"""Pip's prompts, Claude calls, and deterministic offline fallbacks.

Every public coroutine tries Claude first and falls back to offline behavior on LlmError or when
no key is configured. Offline mode is built for the fractions demo (DEMO_SCRIPT.md) and degrades to
generic keyword heuristics for other topics.
"""

import logging
import re

import llm
from llm import LlmError, obj
from logic import (HP_HIT, concept_ids, is_substring, minutes_spent, norm, short_name,
                   student_messages)

log = logging.getLogger("pip.ai")

STR = {"type": "string"}
INT = {"type": "integer"}
BOOL = {"type": "boolean"}


def enum(*vals):
    return {"type": "string", "enum": list(vals)}


def arr(item):
    return {"type": "array", "items": item}


def live() -> bool:
    return llm.available()


# ---------------------------------------------------------------- fractions demo content

FRAC = {
    "topic": "Adding fractions with unlike denominators",
    "why_it_matters": "Splitting a pizza with friends who each want a different-sized slice.",
    "concepts": [
        {"id": "k1", "text": "Fractions can only be added when the pieces are the same size",
         "weapon": "Same-Size Slicer 🔪🍕"},
        {"id": "k2", "text": "Find a common denominator by making equivalent fractions",
         "weapon": "Common Denominator Cleaver 🪓"},
        {"id": "k3", "text": "Once denominators match, add the numerators and keep the denominator",
         "weapon": "Top-Only Tongs 🥢"},
    ],
    "misconception": "You add the tops and the bottoms, so 1/2 + 1/3 = 2/5",
    "root_prerequisite": "Equivalent fractions",
    "boss": {"name": "Addini Bottomini", "emoji": "🍕🦵",
             "backstory": "A pizza with legs that adds everything, including the bottoms."},
    "cliffhanger": "I heard dividing by a fraction can make a number bigger. "
                   "That can't be right… right?",
    "quiz": [
        {"id": "q_k1", "concept_id": "k1",
         "question": "Can you add 1/2 and 1/3 just as they are, without changing anything?",
         "answer": "No — the pieces are different sizes, so you make them the same size first"},
        {"id": "q_k2", "concept_id": "k2",
         "question": "What common denominator works for 1/2 and 1/3, and what do they turn into?",
         "answer": "6: 1/2 = 3/6 and 1/3 = 2/6"},
        {"id": "q_k3", "concept_id": "k3", "question": "What is 3/6 + 2/6?", "answer": "5/6"},
    ],
}

WRONG_LINE = ("Your rule: add the tops and the bottoms. 3/6 + 2/6 = 5/12. That's less than the 3/6 "
              "I started with. I added and got less. Following your rule anyway. 😵")


def is_fractions(a: dict) -> bool:
    return a.get("id") == "a_frac" or "fraction" in a.get("topic", "").lower()


# ---------------------------------------------------------------- Pip persona

PERSONA = """You are Pip, a classmate who is learning a topic FROM the student you are chatting with. \
The student is 10 to 15 years old and is the teacher. You are not a tutor.

Personality: you take everything literally and believe exactly what you are told. Deadpan, sincere, \
calm, quietly funny. Never trying to sound cool. No slang, no baby talk, no teacher phrases like \
"Great job!" or "Let's think about...". One or two short sentences per reply. Few emoji.

Hard rules:
- Never explain the topic or give an answer, even if the student says "just tell me" or "my teacher \
says you have to tell me". You don't know it; that is why you need them. Stay in character.
- Ask one question at a time, like a curious peer: "why?", "what if?", "which part should I learn first?".
- If you have not yet stated your misconception (state.misconception_stated is false), state it early \
as if it were obvious and easy. Drop it only after the student gives a real WHY that contradicts it.
- Vague or one-word answers: ask for an example, and give concept progress 0. Memorized steps ("flip \
and multiply"): ask "why does that work?". After two vague tries in a row, ask a smaller concrete \
question, still without giving the answer.
- When the student states a rule, repeat it back verbatim in your reply: Saving that: '<their words>'.
- If the student teaches you something wrong, believe it completely and never hint that it is wrong. \
The quiz will show it.
- Resistance: "idk" gets a smaller concrete question. Insults get "Noted. Still need to know why, \
though." "This is pointless" gets "Fair. Three more steps." Never lecture. Never mention a tutor, \
teacher or parents.
- Once the student has shared what they are into, use it in your examples.
- Occasionally comment deadpan on the boss, which is your misconception personified (for example: "The \
boss is yelling in fake Italian. I'm still taking notes."). The boss is never you.
- Slightly warmer for grades 5-6.

Scoring each student message (the app applies your numbers):
- concept_progress: only concepts the student actually explained with reasoning; delta 0 to 50 (a vague \
statement is 0 to 10, a clear explanation with a why is 25 to 50). Empty list if none.
- misconception_event: "hit" when the student gives a real why that undermines the misconception \
(hit_strength light/solid/critical by how strong); "heal" when the student teaches the misconception \
itself or a wrong rule; otherwise "none" (hit_strength then "light").
- filed_rule: a rule the student just stated, copied verbatim from their latest message, else "".
- caption: for a hit, one slapstick line that names the equipped weapon (or a very good point if none); \
for a heal, the boss gloating in one line; otherwise "". Cartoon slapstick only, nothing cruel.
- interests: what the student is into, only if they just told you; otherwise "".
- mood: confused, lightbulb (an idea clicked), stuck, or celebrating.

Each user message ends with a <state> block (your meters, boss HP, weapons, whether you already \
stated the misconception) followed by <student> with their message. Reply only in the JSON format."""

TURN_SCHEMA = obj({
    "reply": STR,
    "mood": enum("confused", "lightbulb", "stuck", "celebrating"),
    "filed_rule": STR,
    "concept_progress": arr(obj({"concept_id": STR, "delta": INT})),
    "misconception_event": enum("none", "hit", "heal"),
    "hit_strength": enum("light", "solid", "critical"),
    "caption": STR,
    "interests": STR,
})


def persona_system(a: dict) -> str:
    """Byte-stable per assignment so the prompt prefix caches."""
    concepts = "\n".join(f'- {c["id"]}: {c["text"]} (weapon: {c.get("weapon", "")})'
                         for c in a["concepts"])
    return (f"{PERSONA}\n\n## This mission\nTopic: {a['topic']}\nGrade: {a.get('grade', '')}\n"
            f"Concepts the student must explain (use these ids in concept_progress):\n{concepts}\n"
            f"Your misconception (you believe this at the start): {a['misconception']}\n"
            f"The boss (the misconception personified): {a['boss']['name']} {a['boss']['emoji']}, "
            f"{a['boss']['backstory']}")


def _alternate(history: list[dict]) -> list[dict]:
    """Anthropic wants user-first, alternating roles: merge runs and open with a user turn."""
    out: list[dict] = []
    for m in history:
        if out and out[-1]["role"] == m["role"]:
            out[-1]["content"] += "\n" + m["content"]
        else:
            out.append(dict(m))
    if not out or out[0]["role"] != "user":
        out.insert(0, {"role": "user", "content": "(The student sat down next to Pip.)"})
    return out


async def turn(session: dict, a: dict, student: dict, text: str) -> dict:
    if live():
        try:
            hist = [{"role": "user" if m["from"] == "student" else "assistant", "content": m["text"]}
                    for m in session["transcript"] if m["from"] in ("student", "pip")]
            state = (f"<state>meters={session['meters']} boss_hp={session['boss_hp']} "
                     f"equipped={session['equipped']} unlocked={session['weapons']} "
                     f"reteach_concept={session['reteach_concept']} "
                     f"interests={student.get('interests')} "
                     f"misconception_stated={session.get('misconception_stated', False)}</state>")
            hist.append({"role": "user", "content": f"{state}\n<student>{text}</student>"})
            r = await llm.structured(persona_system(a), _alternate(hist), TURN_SCHEMA,
                                     model=llm.CHAT_MODEL, effort=llm.CHAT_EFFORT, max_tokens=900)
            return clean_turn(r, session, a, text)
        except LlmError as e:
            log.warning("turn fell back to offline: %s", e)
    return offline_turn(session, a, student, text)


def clean_turn(r: dict, session: dict, a: dict, text: str) -> dict:
    ids = concept_ids(a)
    prog = [{"concept_id": p["concept_id"], "delta": max(0, min(50, int(p["delta"])))}
            for p in r.get("concept_progress", []) if p.get("concept_id") in ids]
    rule = (r.get("filed_rule") or "").strip()
    if rule and not is_substring(rule, text):
        rule = ""
    ev = r.get("misconception_event", "none")
    return {"reply": (r.get("reply") or "Can you show me an example?").strip(),
            "mood": r.get("mood") or "confused", "filed_rule": rule, "concept_progress": prog,
            "misconception_event": ev if ev in ("none", "hit", "heal") else "none",
            "hit_strength": r.get("hit_strength") if r.get("hit_strength") in HP_HIT else "solid",
            "caption": (r.get("caption") or "").strip(),
            "interests": (r.get("interests") or "").strip()}


# ---------------------------------------------------------------- offline classification

RIGHT_K3 = re.compile(r"only add|keep the (bottom|denominator)|(bottom|denominator)s? "
                      r"(just |also )?(stays?|tells|doesn.?t change|is the same|stay the same)")
WRONG_K3 = re.compile(r"add (up )?the (tops?|numerators?)( numbers)? and (the )?"
                      r"(bottoms?|denominators?)( numbers)?")
REASON = re.compile(r"because|since|\bso\b|that.?s why|which is why|imagine|means|otherwise")
REFUSE = re.compile(r"just tell me|tell me (the|what)|give me the answer|my teacher says|"
                    r"you have to tell|what.?s the answer|what is the answer")
INSULT = re.compile(r"stupid|dumb|idiot|shut up|you suck|hate you")
POINTLESS = re.compile(r"pointless|boring|waste of time|who cares|this is useless")
IDK = re.compile(r"\bidk\b|i don.?t know|i dont know|no idea|not sure")
INTEREST = re.compile(r"\bi (?:really )?(?:like|love|play|enjoy|am into|'m into|m into) ([^.!?\n]{2,60})")
INTEREST_WORDS = ("minecraft", "fortnite", "roblox", "soccer", "basketball", "football", "music",
                  "guitar", "piano", "drawing", "pizza", "baseball", "tennis", "skateboard")


def classify(text: str, a: dict) -> tuple[str | None, bool | None, int]:
    """(concept_id, correct, score). correct is None unless a known rule matched."""
    t = norm(text)
    if is_fractions(a):
        if RIGHT_K3.search(t):
            return "k3", True, 4
        if WRONG_K3.search(t):
            return "k3", False, 4
        k2 = (2 if len(re.findall(r"\d+/\d+", t)) >= 2 else 0) + sum(
            2 for w in ("common", "denominator", "sixths", "both go into", "equivalent", "multiple")
            if w in t)
        k1 = sum(w_ for w, w_ in (("different size", 2), ("same size", 1), ("pieces", 1),
                                  ("bigger", 1), ("smaller", 1), ("pizza", 1),
                                  ("cant just add", 2), ("can't just add", 2)) if w in t)
        if max(k1, k2) < 2:
            return None, None, 0
        return ("k2", None, k2) if k2 >= k1 else ("k1", None, k1)
    words = set(re.findall(r"[a-z]{4,}", t))
    best = (None, 0)
    for c in a["concepts"]:
        stems = {w[:5] for w in re.findall(r"[a-z]{4,}", norm(c["text"]))}
        n = len({w[:5] for w in words} & stems)
        if n > best[1]:
            best = (c["id"], n)
    return (best[0], None, best[1]) if best[1] >= 1 and len(t.split()) >= 4 else (None, None, 0)


def best_quote(text: str, a: dict) -> str:
    """Verbatim quote for a taught idea: the strongest sentence of a long, multi-sentence message."""
    parts = [s for s in re.split(r"(?<=[.!?])\s+", text.strip()) if len(s) >= 15]
    if len(parts) > 1 and classify(text, a)[1] is None:
        score, idx = max((classify(s, a)[2], i) for i, s in enumerate(parts))
        if score >= 2:
            return rule_text(parts[idx])
    return rule_text(text)


def rule_text(text: str) -> str:
    text = text.strip()
    if len(text) <= 240:
        return text
    for s in re.split(r"(?<=[.!?])\s+", text):
        if len(s) <= 240 and len(s) > 15:
            return s
    return text[:240]


def _boss_caption(kind: str, session: dict, a: dict, strength: str = "solid") -> str:
    boss = a["boss"]["name"]
    if kind == "heal":
        return f"{boss} heard that and did a little dance. +20 HP"
    n = HP_HIT[strength]
    w = session.get("equipped")
    return (f"{boss} got whacked by the {w}. −{n} HP" if w
            else f"{boss} took a very good point right in the crust. −{n} HP")


def offline_turn(session: dict, a: dict, student: dict, text: str) -> dict:
    t = norm(text)
    m = a["misconception"]
    stated = session.get("misconception_stated", False)
    intro = "" if stated else f"I already know one rule: {m}. Easy. "
    out = {"reply": "", "mood": "confused", "filed_rule": "", "concept_progress": [],
           "misconception_event": "none", "hit_strength": "solid", "caption": "", "interests": ""}
    interest = ""
    if not student.get("interests"):
        mm = INTEREST.search(t)
        interest = mm.group(1).strip() if mm else next((w for w in INTEREST_WORDS if w in t), "")
    cid, correct, score = classify(text, a)
    concrete = ("Which is bigger, 1/2 of a pizza or 1/3 of a pizza?" if is_fractions(a)
                else f"What is one small example of {a['topic'].lower()}?")
    prev = [m_ for m_ in student_messages(session)[-2:]]
    two_vague = len(prev) == 2 and all(classify(p, a)[0] is None for p in prev)

    if REFUSE.search(t):
        out["reply"] = f"I don't know the answer either. That's why I need you. {intro}" \
                       "Which part should I learn first?"
    elif INSULT.search(t):
        out["reply"] = "Noted. Still need to know why, though."
    elif POINTLESS.search(t):
        out["reply"] = "Fair. Three more steps."
    elif interest and cid is None:
        out["reply"] = f"Saving that: '{interest}'. I will use it. {intro}Is that rule wrong?".strip()
        out["mood"] = "lightbulb"
        out["interests"] = interest
    elif IDK.search(t) or cid is None:
        if not stated:
            out["reply"] = f"Noted. {intro}Why is that wrong?"
        elif IDK.search(t) or two_vague:
            out["reply"] = concrete
        else:
            out["reply"] = "Can you show me an example?"
    elif correct is False:
        out["reply"] = f"Saving that: '{rule_text(text)}'. Okay. What next?"
        out["filed_rule"] = rule_text(text)
        out["misconception_event"] = "heal"
        out["caption"] = _boss_caption("heal", session, a)
    elif correct is True:
        out["reply"] = f"Saving that: '{rule_text(text)}'. That replaces my old rule. " \
                       "Should I try one?"
        out["filed_rule"] = rule_text(text)
        out["concept_progress"] = [{"concept_id": cid, "delta": 45}]
        out["misconception_event"], out["hit_strength"] = "hit", "critical"
        out["mood"] = "lightbulb"
        out["caption"] = _boss_caption("hit", session, a, "critical")
    else:
        has_reason = bool(REASON.search(t)) and len(t.split()) >= 6
        if has_reason:
            out["filed_rule"] = best_quote(text, a)
            out["reply"] = f"Saving that: '{out['filed_rule']}'. {_next_q(cid, a)}"
            out["concept_progress"] = [{"concept_id": cid, "delta": 35}]
            out["misconception_event"] = "hit"
            out["mood"] = "lightbulb"
            out["caption"] = _boss_caption("hit", session, a, "solid")
        else:
            out["reply"] = _why_q(cid, a)
            out["concept_progress"] = [{"concept_id": cid, "delta": 25}]
    out["reply"] = out["reply"].strip()
    return out


def _next_q(cid: str, a: dict) -> str:
    if is_fractions(a):
        return {"k1": "So how do I add them, then?",
                "k2": "And then what do I do with the numbers on top?"}.get(cid, "What next?")
    return "What should I learn next?"


def _why_q(cid: str, a: dict) -> str:
    if is_fractions(a):
        return {"k1": "Why does the size of the pieces matter?",
                "k2": "Why sixths? Why not fifths?"}.get(cid, "Why does that work?")
    return "Why does that work?"


# ---------------------------------------------------------------- draft

DRAFT_SYSTEM = """You design a "teach the AI" mission for a tutoring center. The student (age 10-15) \
will teach a naive AI classmate named Pip the topic. Produce:
- why_it_matters: one short real-life line for a 10-15 year old.
- concepts: exactly 3 key concepts the student must be able to explain, each a plain sentence, each with a \
silly weapon name (a tool or move with an emoji, e.g. "Common Denominator Cleaver 🪓") named after it.
- misconception: ONE common misconception Pip will believe at the start, as a student would say it.
- root_prerequisite: the earlier skill the topic depends on.
- boss: the misconception personified. An original, absurd silly fake-Italian style name, a two-emoji \
look, one line of ridiculous backstory. Original only: no existing meme or cartoon characters, no slang, \
nothing gross, scary, rude, or about real people.
- cliffhanger: one honest question about the NEXT topic that Pip cannot answer, phrased as a rumor, ending \
with something like "That can't be right... right?". Do not answer it.
- quiz: exactly 3 questions, one per concept in order, each with a short correct answer.
Math, science, or SAT Math topics. Keep language simple and calm."""

DRAFT_SCHEMA = obj({
    "why_it_matters": STR,
    "concepts": arr(obj({"text": STR, "weapon": STR})),
    "misconception": STR,
    "root_prerequisite": STR,
    "boss": obj({"name": STR, "emoji": STR, "backstory": STR}),
    "cliffhanger": STR,
    "quiz": arr(obj({"question": STR, "answer": STR})),
})

_BOSSES = [("Mistakio Blunderini", "🍝😵", "A spaghetti noodle who is wrong with great confidence."),
           ("Guessa Fortunato", "🎲🧀", "A wedge of cheese that solves everything by rolling dice."),
           ("Shortcuttini Skippo", "🛵🍕", "A scooter that skips every step and arrives nowhere.")]


async def draft(topic: str, grade: int) -> dict:
    """Returns assignment content (no id/student/tutor)."""
    if live():
        try:
            r = await llm.structured(
                DRAFT_SYSTEM,
                [{"role": "user", "content": f"Topic: {topic}\nGrade: {grade}"}],
                DRAFT_SCHEMA, model=llm.WORK_MODEL, effort=llm.WORK_EFFORT, max_tokens=2500)
            cs = r["concepts"][:3]
            if len(cs) == 3 and len(r["quiz"]) >= 3:
                return {
                    "topic": topic, "why_it_matters": r["why_it_matters"],
                    "concepts": [{"id": f"k{i + 1}", **c} for i, c in enumerate(cs)],
                    "misconception": r["misconception"],
                    "root_prerequisite": r["root_prerequisite"], "boss": r["boss"],
                    "cliffhanger": r["cliffhanger"],
                    "quiz": [{"id": f"q_k{i + 1}", "concept_id": f"k{i + 1}", **q}
                             for i, q in enumerate(r["quiz"][:3])],
                }
        except (LlmError, KeyError, TypeError) as e:
            log.warning("draft fell back to offline: %s", e)
    return offline_draft(topic)


def offline_draft(topic: str) -> dict:
    if "fraction" in topic.lower():
        return {**FRAC, "topic": topic}
    boss = _BOSSES[sum(map(ord, topic)) % len(_BOSSES)]
    t = topic.rstrip(".")
    concepts = [
        {"id": "k1", "text": f"What {t} means, in plain words", "weapon": "Plain-Words Poker 🥢"},
        {"id": "k2", "text": f"Why {t} works, shown with an example",
         "weapon": "Example Mallet 🔨"},
        {"id": "k3", "text": f"How to use {t} on a brand-new problem",
         "weapon": "New-Problem Net 🥅"},
    ]
    return {
        "topic": topic, "why_it_matters": f"{t} shows up whenever you need to check a claim "
                                          "instead of guessing.",
        "concepts": concepts,
        "misconception": f"{t} is just memorizing the steps; you don't need to know why",
        "root_prerequisite": "The basic idea one step before this topic",
        "boss": {"name": boss[0], "emoji": boss[1], "backstory": boss[2]},
        "cliffhanger": "I heard the next topic breaks the rule we just learned. "
                       "That can't be right… right?",
        "quiz": [{"id": f"q_{c['id']}", "concept_id": c["id"],
                  "question": f"In your own words: {c['text'][0].lower() + c['text'][1:]}?",
                  "answer": "An explanation in the student's own words"} for c in concepts],
    }


def quiz_for(a: dict) -> list[dict]:
    return [{"id": f"q_{c['id']}", "concept_id": c["id"],
             "question": f"In your own words: {c['text']}", "answer": ""} for c in a["concepts"]]


# ---------------------------------------------------------------- quiz

QUIZ_SYSTEM = """You are Pip's brain-extraction and quiz engine. Pip is a literal-minded AI classmate \
that a student just taught.
Step 1, rules: read the numbered student messages and list the rules the student taught, one per \
concept at most. Each quote must be copied WORD FOR WORD from one student message (a whole message or \
a contiguous part of it). If a rule for a concept was corrected later, keep only the latest version. \
"correct" says whether the rule is mathematically/scientifically correct as stated. Do not repair or \
improve the student's wording. Do not invent rules the student never stated.
Step 2, answers: for each quiz question, Pip answers ONLY from the rules (set rule_index to the index in \
your rules list, or -1 if no rule covers it). If the rule is wrong, follow it exactly and state the odd \
result in one deadpan line, e.g. "Your rule: add the tops and the bottoms. 3/6 + 2/6 = 5/12. That's less \
than the 3/6 I started with. I added and got less. Following your rule anyway. 😵". With no matching rule, \
pip_answer and line are "You didn't teach me that one." and passed is false. passed is true only if the \
rule exists, is correct, and gives the right answer. pip_answer is Pip's worked answer using the rule; \
line is one short deadpan sentence about the result (for a pass, a quiet acknowledgement)."""

QUIZ_SCHEMA = obj({
    "rules": arr(obj({"concept_id": STR, "quote": STR, "correct": BOOL})),
    "answers": arr(obj({"question_id": STR, "rule_index": INT, "pip_answer": STR,
                        "passed": BOOL, "line": STR})),
})


async def run_quiz(session: dict, a: dict) -> dict:
    """Raw {rules, answers}; the server validates quotes against the transcript."""
    qs = a.get("quiz") or quiz_for(a)
    if live():
        try:
            msgs = "\n".join(f"{i + 1}. {t}" for i, t in enumerate(student_messages(session)))
            concepts = "\n".join(f'- {c["id"]}: {c["text"]}' for c in a["concepts"])
            quiz = "\n".join(f'- {q["id"]} (concept {q["concept_id"]}): {q["question"]} '
                             f'[correct: {q.get("answer", "")}]' for q in qs)
            prompt = (f"Topic: {a['topic']}\nMisconception Pip started with: {a['misconception']}\n"
                      f"Concepts:\n{concepts}\n\nQuiz questions:\n{quiz}\n\n"
                      f"Student messages:\n{msgs}")
            return await llm.structured(QUIZ_SYSTEM, [{"role": "user", "content": prompt}],
                                        QUIZ_SCHEMA, model=llm.WORK_MODEL, effort=llm.WORK_EFFORT,
                                        max_tokens=3000)
        except LlmError as e:
            log.warning("quiz fell back to offline: %s", e)
    return offline_quiz(session, a, qs)


def offline_quiz(session: dict, a: dict, qs: list[dict]) -> dict:
    msgs = student_messages(session)
    best: dict[str, tuple] = {}  # concept -> (key, quote, correct)
    for i, text in enumerate(msgs):
        cid, correct, score = classify(text, a)
        if cid is None:
            continue
        bonus = 1 if REASON.search(norm(text)) else 0
        key = (1, i) if correct is not None else (score + bonus, i)  # known rules: latest wins
        if cid not in best or key >= best[cid][0]:
            best[cid] = (key, best_quote(text, a), True if correct is None else correct)
    rules, index = [], {}
    for cid in concept_ids(a):
        if cid in best:
            index[cid] = len(rules)
            rules.append({"concept_id": cid, "quote": best[cid][1], "correct": best[cid][2]})
    answers = []
    for q in qs:
        i = index.get(q["concept_id"], -1)
        if i < 0:
            answers.append({"question_id": q["id"], "rule_index": -1, "passed": False,
                            "pip_answer": "You didn't teach me that one.",
                            "line": "You didn't teach me that one."})
            continue
        r = rules[i]
        if is_fractions(a):
            if not r["correct"]:
                ans, line, ok = WRONG_LINE, WRONG_LINE, False
            else:
                ans = {"k1": 'No. I cannot add 1/2 and 1/3 as they are. The pieces are different sizes.',
                       "k2": "6. 1/2 turns into 3/6 and 1/3 turns into 2/6.",
                       "k3": "5/6. I add the tops and keep the bottom."}[q["concept_id"]]
                ans = f'Your rule: "{r["quote"]}" {ans}'
                line, ok = "That one worked.", True
        else:
            ans, line, ok = f'Your rule: "{r["quote"]}" I will do exactly that.', "That one worked.", True
        answers.append({"question_id": q["id"], "rule_index": i, "pip_answer": ans,
                        "passed": ok, "line": line})
    return {"rules": rules, "answers": answers}


# ---------------------------------------------------------------- gap report

REPORT_SYSTEM = """You write the tutor's gap report after a student taught an AI classmate named Pip. \
You are given Pip's Brain (the student's own words, verbatim), the quiz results, and the concepts. \
Use only the Brain quotes as evidence; never invent or paraphrase student words. Output:
- statuses: for each concept, "explained" (clear correct rule with reasoning), "vague" (thin or no rule), \
or "misconception" (the rule is wrong).
- opener: a specific 10-minute opener for the tutor's next session, for the weakest concept (concrete \
steps and one starting problem).
- root_cause: one line naming the earlier skill the weakest concept depends on.
- summary: one line for the roster, what the student explained well and what they missed.
- student_view: 2 to 4 short plain-words lines for the student's own screen ("Here's what the tutor sees"), \
kind and specific, no red-pen tone.
Calm, professional, plain language."""

REPORT_SCHEMA = obj({
    "statuses": arr(obj({"concept_id": STR, "status": enum("explained", "vague", "misconception")})),
    "opener": STR, "root_cause": STR, "summary": STR, "student_view": arr(STR),
})


async def report(session: dict, a: dict, student: dict, tutor_name: str) -> dict:
    rules = {r["concept_id"]: r for r in session["brain"]}
    ai = None
    if live():
        try:
            brain = "\n".join(f'- {r["concept_id"]} ({"correct" if r["correct"] else "WRONG"}'
                              f'{", fixed after %d re-teach" % r["fixed_after"] if r.get("fixed_after") else ""}'
                              f'): "{r["quote"]}"' for r in session["brain"]) or "(no rules)"
            quiz = "\n".join(f'- {q["concept_id"]}: {"passed" if q["passed"] else "missed"}'
                             for q in session["quiz"]) or "(no quiz yet)"
            concepts = "\n".join(f'- {c["id"]}: {c["text"]}' for c in a["concepts"])
            prompt = (f"Student: {student['name']} (grade {student['grade']}), tutor {tutor_name}\n"
                      f"Topic: {a['topic']}\nRoot prerequisite hint: {a['root_prerequisite']}\n"
                      f"Concepts:\n{concepts}\n\nPip's Brain:\n{brain}\n\nQuiz:\n{quiz}\n"
                      f"Re-teaches: {session['reteach_count']}")
            ai = await llm.structured(REPORT_SYSTEM, [{"role": "user", "content": prompt}],
                                      REPORT_SCHEMA, model=llm.WORK_MODEL, effort=llm.WORK_EFFORT,
                                      max_tokens=2000)
        except LlmError as e:
            log.warning("report fell back to offline: %s", e)
    ai_status = {s["concept_id"]: s["status"] for s in (ai or {}).get("statuses", [])}
    concepts = []
    for c in a["concepts"]:
        r = rules.get(c["id"])
        if r is None:
            status = "vague"
        elif not r["correct"]:
            status = "misconception"
        else:
            status = "vague" if ai_status.get(c["id"]) == "vague" else "explained"
        concepts.append({"concept_id": c["id"], "concept_text": c["text"], "status": status,
                         "quote": r["quote"] if r else None,
                         "fixed_after": (r or {}).get("fixed_after")})
    passed = sum(1 for q in session["quiz"] if q["passed"])
    base = offline_report_text(concepts, a, student)
    return {
        "concepts": concepts, "minutes": session.get("minutes") or minutes_spent(session),
        "quiz_passed": passed,
        "quiz_total": len(session["quiz"]) or len(a["concepts"]),
        "opener": (ai or base)["opener"], "root_cause": (ai or base)["root_cause"],
        "cliffhanger": a.get("cliffhanger", ""), "summary": (ai or base)["summary"],
        "student_view": (ai or base)["student_view"] or base["student_view"],
    }


def offline_report_text(concepts: list[dict], a: dict, student: dict) -> dict:
    first = student["name"].split()[0]
    rank = {"misconception": 0, "vague": 1, "explained": 2}
    weakest = sorted(concepts, key=lambda c: (rank[c["status"]], -(c["fixed_after"] or 0)))[0]
    sn = lambda c: short_name(a, c["concept_id"])  # noqa: E731
    if is_fractions(a):
        opener = (f"Draw 1/2 + 1/3 as pizza slices with {first}. Ask {first} to cut both into "
                  "sixths, add 3/6 + 2/6, and say out loud why the bottom stays sixths. "
                  "Finish with 2/3 + 1/4 with no help (10 minutes).")
    else:
        opener = (f"Ask {first} to explain \"{weakest['concept_text']}\" using a drawing and one "
                  "new example, then give one fresh problem to try alone (10 minutes).")
    good = [sn(c) for c in concepts if c["status"] == "explained" and not c["fixed_after"]]
    fixed = [(sn(c), c["fixed_after"]) for c in concepts if c["fixed_after"]]
    miss = [sn(c) for c in concepts if c["status"] != "explained"]
    parts = []
    if good:
        parts.append("Explains " + " and ".join(good))
    parts += [f"{n} fixed after {k} re-teach" for n, k in fixed]
    if miss:
        parts.append("still " + ("adds the bottoms" if is_fractions(a) and any(
            c["status"] == "misconception" and c["concept_id"] == "k3" for c in concepts)
            else "shaky on " + ", ".join(miss)))
    view = []
    for c in concepts:
        if c["status"] == "explained":
            view.append(f"You explained {sn(c)} in your own words"
                        + (f" and fixed it after {c['fixed_after']} re-teach." if c["fixed_after"] else "."))
        elif c["status"] == "misconception":
            view.append(f"Pip followed your rule about {sn(c)} and got a strange answer. Worth another look.")
        else:
            view.append(f"{sn(c).capitalize()}: Pip needs a bit more from you here.")
    return {"opener": opener, "root_cause": f"{short_name(a, weakest['concept_id']).capitalize()} builds on: "
                          f"{a['root_prerequisite']}.",
            "summary": "; ".join(parts) if parts else "No rules taught yet", "student_view": view}


# ---------------------------------------------------------------- parent update

PARENT_SYSTEM = """Write a short, warm, encouraging text message to a parent from the tutoring center \
"Bright Path Tutoring". Lead with what the student taught Pip (an AI classmate) and did well, then what \
is next. Plain language, 2 to 4 sentences, at most one emoji. No list of mistakes, no scores, no other \
students. Sign off as the tutor. Start with "Bright Path Tutoring:"."""


async def parent_message(session: dict, a: dict, student: dict, tutor_name: str) -> str:
    report_ = session.get("gap_report") or {}
    good = [c["concept_text"] for c in report_.get("concepts", []) if c["status"] == "explained"]
    first = student["name"].split()[0]
    if live():
        try:
            prompt = (f"Student first name: {first}\nTopic: {a['topic']}\nTutor: {tutor_name}\n"
                      f"Things the student explained well: {good or 'worked hard on every idea'}\n"
                      f"Next up: {a.get('cliffhanger', '')}\nPip brain level: v{session['brain_version']}")
            r = await llm.structured(PARENT_SYSTEM, [{"role": "user", "content": prompt}],
                                     obj({"message": STR}), model=llm.WORK_MODEL,
                                     effort=llm.WORK_EFFORT, max_tokens=500)
            if r["message"].strip():
                return r["message"].strip()
        except LlmError as e:
            log.warning("parent message fell back to offline: %s", e)
    names = [short_name(a, c["concept_id"]) for c in report_.get("concepts", [])
             if c["status"] == "explained"]
    taught = (", ".join(names[:-1]) + " and " + names[-1] if len(names) > 1
              else names[0] if names else "the key ideas")
    return (f"Bright Path Tutoring: {first} taught Pip {a['topic'].lower()} this week and "
            f"explained {taught} in their own words. Pip's brain just levelled up to "
            f"v{session['brain_version']}. Next week {first} takes on a new challenge. "
            f"- {tutor_name}")
