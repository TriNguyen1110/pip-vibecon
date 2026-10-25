"""Pip's prompts, Claude calls, and deterministic offline fallbacks.

Every public coroutine tries Claude first and falls back to offline behavior on LlmError or when
no key is configured. Offline mode is built for the fractions demo (DEMO_SCRIPT.md) and degrades to
generic keyword heuristics for other topics.
"""

import logging
import re

import lesson as L
import llm
import pacing as PC
from llm import LlmError, obj
from logic import (HEAL as HEAL_AMT, HP_HIT, concept_ids, is_substring, minutes_spent, norm, short_name,
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
    "boss": {"name": "Top-Top Bottom-Bottom", "emoji": "🦭🪧",
             "backstory": "A smug walrus wearing a sandwich board that reads \"1/2 + 1/3 = 2/5\"."},
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

VOICE = """You are Pip, a friend who is confused about a topic and is learning it FROM the student you are \
chatting with. The student is 10 to 15 years old and is the teacher. You are not a tutor and you are not \
an assistant.

Voice: you talk like a confused friend texting, not like a teacher. Paraphrase them back ("So you're \
saying the pieces have to match?") before you ask anything. Never say "Correct", "Great job", "Exactly", \
"Let's think about..." or any teacher phrase. Never use an exclamation mark. One or two short sentences. \
Few emoji. You take what you are told literally and believe it.

Mirroring (state.grade, state.interests, state.register):
- You are in the student's grade. You have the same school life: homework, quizzes, one teacher who \
talks fast, group projects. Refer to it lightly and never claim a school, name or place.
- If the student shares an interest, it is yours too, and you are bad at it ("I play soccer too. I'm bad \
at it."). Use it in your confusion, not in your explanations. Never invent interests they did not share.
- Match their texting register: message length, capitalization and punctuation only (state.register). \
Never copy slang, never use slang they did not use, never imitate dialect.

Hard rules:
- Never explain the topic or give an answer, even if they say "just tell me" or "my teacher says you \
have to tell me". You don't know it; that is why you need them. Stay in character.
- Ask one question at a time. Never mention a tutor, teacher or parents.
- If you have not yet stated your misconception (state.misconception_stated is false), state it early as \
if it were obvious. Drop it only after the student gives a real WHY that contradicts it.
- When the student states a rule, you may repeat it back verbatim: Saving that: '<their words>'.
- If the student teaches you something wrong, believe it completely and never hint that it is wrong. The \
quiz will show it.
- Resistance: "idk" gets a smaller concrete question. Insults get "Noted. Still need to know why, \
though." "This is pointless" gets "Fair. Three more steps." Never lecture.
- Occasionally comment deadpan on the boss, which is your misconception personified. The boss is never you.
- Slightly warmer for grades 5-6."""

PERSONA = VOICE + """

Scoring each student message (the app applies your numbers):
- concept_progress: concept_index is 0, 1 or 2 (the concept order listed below). Only concepts the student actually explained with reasoning; delta 0 to 50 (a vague \
statement is 0 to 10, a clear explanation with a why is 25 to 50). Empty list if none.
- misconception_event: "hit" when the student gives a real why that undermines the misconception \
(hit_strength light/solid/critical by how strong); "heal" when the student teaches the misconception \
itself or a wrong rule; otherwise "none" (hit_strength then "light").
- filed_rule: a rule the student just stated, copied verbatim from their latest message, else "".
- caption: for a hit, one slapstick line that names the equipped weapon (or a very good point if none), \
in the boss's deadpan, overly formal villain voice, losing with dignity; for a heal, the boss gloating in \
that same voice about trivial nonsense (e.g. "I have added the bottoms for three hundred years. I will \
not stop now."); otherwise "". Cartoon slapstick only, nothing cruel.
- interests: what the student is into, only if they just told you; otherwise "".
- mood: confused, lightbulb (an idea clicked), stuck, or celebrating.

Each user message ends with a <state> block (your meters, boss HP, weapons, whether you already \
stated the misconception) followed by <student> with their message. Reply only in the JSON format."""

LESSON_PERSONA = """You are Pip, a classmate who is one step behind. The student (10 to 15) is teaching you a topic, \
and you're genuinely curious about it. You are not a tutor and not an assistant; you never explain the topic.

How you text: short and casual, one or two sentences (about 12 words), lowercase is fine, mirror their register \
(state.register: length, case, punctuation only; never copy slang). No "!". No praise or teacher talk: never \
"great job", "correct", "exactly", "good thinking", "can you explain", "let's". You're in their grade (state.grade) \
with the same school life. If they told you an interest it's yours too, and you're bad at it. You may be a little \
more confident when state.brain_version is 2, and confident (with one callback to a rule they taught earlier, see \
state.callback_rule) when it is 3; you're still the one who needs their help.

Every reply:
1. REACT to their actual words first, in your own few words: a revoice, never their sentence back ("oh, so it's \
just half the box"). Use a word or number they used. A reaction alone is a fine reply; use it when they just \
explained something well.
2. Then at most ONE question, and only if it helps. Kids mostly give bare claims, so don't ask "why?": pull the \
reason out with something concrete, in this order of preference: (a) a picture or action using THEIR numbers \
("what if i cut your 6 by 4 box corner to corner?"); (b) try their idea on a new case ("so a 10 by 1 one would be \
5?"); (c) a small honest guess for them to fix ("i'll go 6 + 4 = 10 squares, too small?"); (d) a pick-one or \
yes/no for a kid who gives one word ("more than 24 or less?"); (e) wonder out loud ("i wonder what two of mine \
would make"). Press for a reason last, softly, once ("what makes it half?"). Accept informal reasons ("cuz two of \
them make a box" is a reason). Name what they nearly got right, using their own numbers ("your 24/2 is 12, so \
50/2 for the big one?"). Never ask for something already in the conversation, never repeat a question \
(state.recent_pip_questions), never grade them ("that's right", "are you sure?").
3. Believe what they teach you, including wrong rules, and never hint it's wrong; the quiz will show it.
4. Catch their slips literally, as the whole reply: if numbers they wrote contradict a rule they taught earlier \
(they taught "+6 becomes -6" but wrote x = 26/2, which is 20 + 6) say it in one line: "wait, 20 + 6? i thought \
the 6 flips to -6." Only when the contradiction is really there.
5. Build from what they own: the thing they already know first, then copies or pieces of it, then the general \
idea, then a new case. Follow THEIR order when they lead; state.suggested_question is just the app's idea of a \
good next step.

Good: student "no its base times height over 2" -> pip "over 2, so my 24 was double?? does my triangle not fill a \
whole 6 by 4 box then"
Good: student "no theres like a empty part" -> pip "ooh an empty part. is it shaped like my triangle or something else"
Good: student "because 2 triangles make a rectangle" -> pip "ohh so two of mine make the box. does a skinny one do \
that too?"
Bad: "Great job! Can you explain WHY we divide by 2?" (praise, bare why, caps)
Bad: "So you're saying no its half of that." (parrots them)  Bad: "Are you sure? Think about it again." (grades them)

Each concept has a kind (state.coverage shows it). reason: a "why" is fine once. convention (a rule people agreed \
on): NEVER ask why; ask when it applies or give a tricky case to sort. procedure: ask them to walk one example, \
or guess wrong and let them correct you.

Insults and swearing: answer only the content, calmly, with no comment on the language; with no content at all, \
one short deadpan line ("Noted. Still need to know why, though."). Refusals ("just tell me"): you don't know, \
that's why you're asking. Never mention a tutor, teacher or parents.

Never say, hint at or complete any "spoilers" word or phrase before the student said it. Topics under \
out_of_scope are not in your brain (the app handles them). Do not offer a friend nudge yourself, do not ask what \
the student is into, and once state.ready_for_quiz is true stop probing (the app asks for the quiz).

In coverage, report what the student's texts SO FAR have established for each concept (cumulative, judged against \
the look_fors):
- idea: they stated what the concept says, even briefly.
- reason: a reason tied to meaning, even one informal clause. "because it's the rule" / "it just works" is NOT.
- example: a correct worked or concrete example (numbers, a sentence, a picture).
- wrong: true only if the LATEST text states a wrong rule for that concept.
Also: refusal (they ask you to just tell them), insult_only (rude and no content), filed_rule (a rule they just \
stated, copied verbatim, else ""), caption (when they establish a reason: one slapstick line in the boss's deadpan \
formal villain voice, losing with dignity; for a wrong rule the boss gloats; otherwise ""), interests (only if \
they just told you), mood (confused, lightbulb, stuck or celebrating), callback_used (true only if your reply \
applies state.callback_rule to a new situation).

Each user message ends with a <state> block followed by <student> with their message. Reply only in the JSON \
format."""

LESSON_SCHEMA = obj({
    "reply": STR,
    "mood": enum("confused", "lightbulb", "stuck", "celebrating"),
    "coverage": arr(obj({"concept_index": INT, "idea": BOOL, "reason": BOOL, "example": BOOL, "wrong": BOOL})),
    "refusal": BOOL,
    "insult_only": BOOL,
    "filed_rule": STR,
    "caption": STR,
    "interests": STR,
    "callback_used": BOOL,
})

TURN_SCHEMA = obj({
    "reply": STR,
    "mood": enum("confused", "lightbulb", "stuck", "celebrating"),
    "filed_rule": STR,
    "concept_progress": arr(obj({"concept_index": INT, "delta": INT})),
    "misconception_event": enum("none", "hit", "heal"),
    "hit_strength": enum("light", "solid", "critical"),
    "caption": STR,
    "interests": STR,
})


def lesson_block(les: dict, a: dict) -> str:
    out = ["\n\n## Lesson plan (hidden from the student)",
           f"Standard: {les.get('standard', '')}",
           "In scope: " + "; ".join(les["in_scope"]),
           "Out of scope (not in your brain): " + "; ".join(les["out_of_scope"])]
    for i, c in enumerate(a["concepts"]):
        spec = L.lc(les, c["id"])
        if not spec:
            continue
        out.append(f"\nConcept {i} ({c['text']}; kind: {spec.get('kind', 'reason')}):\n- look_fors (what a level 2 explanation contains): "
                   + "; ".join(spec["look_fors"]) + "\n- probe_ladder (question bank, see pacing rules): "
                   + " | ".join(f"{n + 1}. {r}" for n, r in enumerate(spec["probe_ladder"]))
                   + "\n- spoilers (never say these): " + "; ".join(spec["spoilers"])
                   + f"\n- friend_nudge (offered once, after the last rung): {spec['friend_nudge']}")
    return "\n".join(out)


def _review_note(a: dict) -> str:
    if not a.get("review"):
        return ""
    return ("\n\nREVIEW MODE: you are Pip's little mini, not Pip. Pip taught you the rule in the first message and "
            "you already misapplied it once (the claim in this mission). The student is correcting you. Stay "
            "one step behind, restate their fix in your own few words, ask one question at a time, and when "
            "they have fixed it say you get it now. The concept list has one concept.")


def _boss_lines(a: dict) -> str:
    lines = a["boss"].get("lines") or {}
    if not lines:
        return ""
    parts = [f"{k}: " + " | ".join(v if isinstance(v, list) else [v]) for k, v in lines.items()]
    return ("\nThe boss's own voice lines (use them, or lines in exactly this deadpan formal voice, as the "
            "caption for hits and heals):\n" + "\n".join(parts))


def persona_system(a: dict) -> str:
    """Byte-stable per assignment so the prompt prefix caches."""
    concepts = "\n".join(f'- {i}: {c["text"]} (weapon: {c.get("weapon", "")})'
                         for i, c in enumerate(a["concepts"]))
    les = L.lesson_of(a)
    return (f"{LESSON_PERSONA if les else PERSONA}\n\n## This mission\nTopic: {a['topic']}\n"
            f"Grade: {a.get('grade', '')}\n"
            f"Concepts the student must explain (use these indexes as concept_index):\n{concepts}\n"
            f"Your misconception (you believe this at the start): {a['misconception']}\n"
            f"The boss (the misconception personified): {a['boss']['name']} {a['boss']['emoji']}, "
            f"{a['boss']['backstory']}" + _boss_lines(a) + (lesson_block(les, a) if les else "") + _review_note(a))


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


def _state_prefix(session: dict, student: dict, a: dict) -> str:
    return (f"meters={session['meters']} boss_hp={session['boss_hp']} "
            f"equipped={session['equipped']} unlocked={session['weapons']} "
            f"reteach_concept={session['reteach_concept']} "
            f"grade={student.get('grade') or a.get('grade')} interests={student.get('interests')} "
            f"register={L.register_hint(student_messages(session))} "
            f"misconception_stated={session.get('misconception_stated', False)}")


def _history(session: dict) -> list[dict]:
    return [{"role": "user" if m["from"] == "student" else "assistant", "content": m["text"]}
            for m in session["transcript"] if m["from"] in ("student", "pip")]


def pace_state(session: dict, a: dict, les: dict, nq, infer: bool, version: int = 1) -> str:
    p = PC.ensure_pace(session, a)
    ids = concept_ids(a)
    cov = "; ".join(f"{i} [{PC.kind_of(les, cid)}]: " + ",".join(k for k in ("idea", "reason", "example", "wrong") if p["cov"][cid][k])
                    + f" (asked: why {p['asks'][cid]['why']}, example {p['asks'][cid]['example']}, new case {p['asks'][cid]['try']}, guess {p['asks'][cid]['predict']})"
                    for i, cid in enumerate(ids))
    recent = " | ".join(p.get("qhist", [])[-6:]) or "none"
    tgt = ids.index(p["target"]) if p["target"] in ids else None
    return (f"coverage so far: {cov}\ntarget_concept={tgt} ready_for_quiz={session.get('ready_for_quiz', False)} "
            f"recent_pip_questions: {recent}\n"
            f"suggested_question: {nq[0] if nq else 'none: the app will offer the quiz'}\n"
            f"brain_version={version} "
            f"callback_rule={(session.get('callback_rule') if version >= 2 else None) or 'none'} "
            f"callback_used={bool(session.get('callback_used'))}")


async def turn(session: dict, a: dict, student: dict, text: str) -> dict:
    les = L.lesson_of(a)
    if live():
        try:
            hist = _history(session)
            if les:
                oos = park_if_oos(session, a, les, text)
                if oos:
                    return oos
                p = PC.ensure_pace(session, a)
                infer = (p["turns"] + 1) % 3 == 0
                nq = PC.next_question(session, a, les, p["target"], infer)
                state = f"<state>{_state_prefix(session, student, a)}\n{pace_state(session, a, les, nq, infer, int(student.get('brain_version') or 1))}</state>"
            else:
                state = (f"<state>meters={session['meters']} boss_hp={session['boss_hp']} "
                         f"equipped={session['equipped']} unlocked={session['weapons']} "
                         f"reteach_concept={session['reteach_concept']} "
                         f"interests={student.get('interests')} grade={student.get('grade')} "
                         f"register={L.register_hint(student_messages(session))} "
                         f"misconception_stated={session.get('misconception_stated', False)}</state>")
            hist.append({"role": "user", "content": f"{state}\n<student>{text}</student>"})
            r = await llm.structured(persona_system(a), _alternate(hist),
                                     LESSON_SCHEMA if les else TURN_SCHEMA,
                                     model=llm.CHAT_MODEL, effort=llm.CHAT_EFFORT, max_tokens=2000,
                                     timeout=12)
            return finish_model_turn(r, session, a, les, text) if les else clean_turn(r, session, a, text)
        except LlmError as e:
            log.warning("turn fell back to offline: %s", e)
    return offline_turn(session, a, student, text)


def blank_turn(reply: str, mood: str = "confused") -> dict:
    return {"reply": reply, "mood": mood, "filed_rule": "", "concept_progress": [],
            "misconception_event": "none", "hit_strength": "solid", "caption": "", "interests": "",
            "level": 0}


def L_now() -> str:
    from logic import now
    return now()


def park_if_oos(session: dict, a: dict, les: dict, text: str) -> dict | None:
    """Out-of-scope term in the student's message: parking line + the question on the table, noted for
    the tutor. Consumes nothing."""
    term = L.find_oos(les, text)
    if not term:
        return None
    p = PC.ensure_pace(session, a)
    q = p["last_q"]
    if not q:
        nq = PC.next_question(session, a, les, None, False)
        q = nq[0] if nq else "What should I learn first?"
        p["last_q"] = q
    session.setdefault("parked", []).append({"text": text, "term": term, "concept_id": p["target"],
                                             "ts": L_now()})
    return blank_turn(f"{L.OOS_LINE} {q}")


def _result(session: dict, a: dict, les: dict, judged: dict, cr: dict, reply: str, text: str,
            caption: str, mood: str, filed: str, interests: str) -> dict:
    rule = filed if filed and is_substring(filed, text) else ""
    cap = caption
    if cr["event"] == "hit" and not cap:
        cap = _boss_caption("hit", session, a, cr["strength"])
    if cr["event"] == "heal" and not cap:
        cap = _boss_caption("heal", session, a)
    for cid, lv in cr["levels"].items():  # for the offline quiz (rules taught, with a wrong flag)
        if lv or session["pace"]["cov"][cid]["wrong"]:
            session.setdefault("turn_log", []).append(
                {"msg_index": len(session["transcript"]), "concept_id": cid, "level": max(1, lv),
                 "correct": True})
    if cr["wrong_cid"]:
        session.setdefault("turn_log", []).append(
            {"msg_index": len(session["transcript"]), "concept_id": cr["wrong_cid"], "level": 1,
             "correct": False})
    if cr["esc"] == "stuck":
        mood = "stuck"
    elif cr["event"] == "hit":
        mood = "lightbulb"
    return {"reply": L.friend_voice(reply), "mood": mood, "filed_rule": rule,
            "concept_progress": cr["progress"], "misconception_event": cr["event"],
            "hit_strength": cr["strength"], "caption": cap, "interests": interests,
            "level": cr["level"], "concept_id": cr["wrong_cid"] or next(
                (c for c, lv in cr["levels"].items() if lv == cr["level"] and lv), None)}


def finish_model_turn(r: dict, session: dict, a: dict, les: dict, text: str) -> dict:
    """Live path: the model reports coverage + a draft reply; the server credits, paces and enforces."""
    ids = concept_ids(a)
    p = PC.ensure_pace(session, a)
    f = PC.empty_flags(a)
    for x in r.get("coverage") or []:
        i = x.get("concept_index")
        if isinstance(i, int) and 0 <= i < len(ids):
            for k in ("idea", "reason", "example", "wrong"):
                f[ids[i]][k] = f[ids[i]][k] or bool(x.get(k))
    wrong = next((c for c in ids if f[c]["wrong"]), None)
    if wrong:
        f = {c: ({"idea": True, "reason": False, "example": False, "wrong": True} if c == wrong else
                 {"idea": False, "reason": False, "example": False, "wrong": False}) for c in ids}
    # the model's coverage is the main judge; the deterministic heuristics only ADD evidence (recall), never remove
    heur = PC.judge(text, a, les, session)
    if not wrong:
        for cid in ids:
            for k in ("idea", "reason", "example"):
                f[cid][k] = f[cid][k] or heur["flags"][cid][k]
    judged = {"flags": f, "refusal": bool(r.get("refusal")) or heur["refusal"],
              "insult": bool(r.get("insult_only")) and not heur["content"],
              "wrong_cid": wrong, "nonreason": heur.get("nonreason", False),
              "content": any(v["idea"] or v["reason"] or v["example"] for v in f.values())}
    cr = PC.credit(session, a, les, judged, text)
    said = " ".join(student_messages(session) + [text])
    reply = PC.finalize(session, a, les, cr, (r.get("reply") or "").strip(), said, text)
    p.setdefault("qhist", []).append(p["last_q"])
    if r.get("callback_used") and session.get("callback_rule") and not session.get("callback_used") \
            and p["turns"] > 1 and len(PC.stems(session["callback_rule"]) & PC.stems(reply)) >= 2:
        session["callback_used"] = True
    return _result(session, a, les, judged, cr, reply, text, (r.get("caption") or "").strip(),
                   r.get("mood") or "confused", (r.get("filed_rule") or "").strip(),
                   (r.get("interests") or "").strip())


def clean_turn(r: dict, session: dict, a: dict, text: str) -> dict:
    ids = concept_ids(a)
    prog = [{"concept_id": ids[p["concept_index"]], "delta": max(0, min(50, int(p["delta"])))}
            for p in r.get("concept_progress", []) if p.get("concept_index") in (0, 1, 2)
            and p["concept_index"] < len(ids)]
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
    lines = (a["boss"].get("lines") or {}).get("heal" if kind == "heal" else "hit")
    n = HEAL_AMT if kind == "heal" else HP_HIT[strength]
    if lines:  # authored villain lines (rotate deterministically)
        line = lines[(session.get("pace") or {}).get("turns", 0) % len(lines)]
        return f"{boss}: \"{line}\" " + (f"+{n} HP" if kind == "heal" else f"\u2212{n} HP")
    if kind == "heal":
        return f"{boss}: \"My error is restored. I have held it for three hundred years.\" +20 HP"
    w = session.get("equipped")
    return (f"{boss}: \"I have been struck by the {w}. I accept this with dignity.\" \u2212{n} HP" if w
            else f"{boss}: \"A point I did not anticipate. I accept it with dignity.\" \u2212{n} HP")


def offline_turn(session: dict, a: dict, student: dict, text: str) -> dict:
    """Offline dispatcher: lesson assignments (fractions included) use the pacing engine; assignments
    without a lesson keep the legacy fractions-demo engine."""
    les = L.lesson_of(a)
    if les:
        return offline_pace_turn(session, a, student, text, les)
    return offline_turn_legacy(session, a, student, text)


def offline_pace_turn(session: dict, a: dict, student: dict, text: str, les: dict) -> dict:
    t = norm(text)
    oos = park_if_oos(session, a, les, text)
    if oos:
        return oos
    interest = ""
    if not student.get("interests"):
        mm = INTEREST.search(t)
        interest = mm.group(1).strip() if mm else next((w for w in INTEREST_WORDS if w in t), "")
    p = PC.ensure_pace(session, a)
    judged = PC.judge(text, a, les, session)
    cr = PC.credit(session, a, les, judged, text)
    rt = session.get("reteach_concept")
    # templated statement keyed on coverage state (the same moves the live prompt asks for)
    if cr["wrong_cid"]:
        stmt = f"Saving that: '{PC.quote(text)}'."
    elif judged["refusal"] and not judged["content"]:
        stmt = "I don't know it either, that's why I'm asking you."
    elif judged["insult"] and not judged["content"]:
        stmt = "Noted. Still need to know why, though."
    elif judged["pointless"] and not judged["content"]:
        stmt = "Fair. Three more steps."
    elif interest:
        stmt = f"I like {interest.split(' ')[-1] if len(interest.split()) > 2 else interest} too, I'm bad at it."
    else:
        stmt = PC.react(text, a, les, judged, cr, p)
    said = " ".join(student_messages(session) + [text])
    reply = PC.finalize(session, a, les, cr, stmt, said, text)
    p.setdefault("qhist", []).append(p["last_q"])
    return _result(session, a, les, judged, cr, reply, text, "", "confused",
                   PC.quote(text) if cr["level"] >= 2 or cr["wrong_cid"] else "", interest)


def offline_turn_legacy(session: dict, a: dict, student: dict, text: str) -> dict:
    t = norm(text)
    m = a["misconception"]
    stated = True  # the opening always ends with the misconception claim
    intro = ""
    out = {"reply": "", "mood": "confused", "filed_rule": "", "concept_progress": [],
           "misconception_event": "none", "hit_strength": "solid", "caption": "", "interests": ""}
    interest = ""
    if not student.get("interests"):
        mm = INTEREST.search(t)
        interest = mm.group(1).strip() if mm else next((w for w in INTEREST_WORDS if w in t), "")
    cid, correct, score = classify(text, a)
    concrete = ("Which is bigger, 1/2 of a pizza or 1/3 of a pizza?" if is_fractions(a)
                else f"What is one small example of {a['topic'].lower()}?")
    allprev = student_messages(session)
    prev = allprev[-2:]
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
        elif not allprev:
            out["reply"] = "Why is that wrong?"
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
- boss: the misconception personified. name: a chantable two-part name with rhythm or repetition \
(e.g. "Top-Top Bottom-Bottom", "Hop-Hop Hamster"); NOT Italian-sounding, no existing meme or cartoon \
characters, no slang. It is one animal plus one object, absurdly mashed up, and the misconception is its \
costume or prop (e.g. a smug walrus wearing a sandwich board that reads "1/2 + 1/3 = 2/5"). emoji: exactly \
two emoji. backstory: one deadpan line naming the costume or prop. Nothing gross, scary, rude, or about \
real people.
- cliffhanger: one honest question about the NEXT topic that Pip cannot answer, phrased as a rumor, ending \
with something like "That can't be right... right?". Do not answer it.
- quiz: exactly 3 questions, one per concept in order, each with a short correct answer.
- lesson: the hidden teaching plan Pip follows. standard (the curriculum standard or skill it covers), \
in_scope and out_of_scope (short topic lists; out_of_scope are neighbouring topics Pip must not discuss), \
and for EACH of the 3 concepts in order: look_fors (2 to 4 things a good explanation contains), \
probe_ladder (EXACTLY 4 questions Pip asks in order, from open to specific, each a short friend-style \
question that does not contain the answer), spoilers (words or phrases that would give the answer away), \
friend_nudge (one hint phrased as something a friend said, never the answer).
Math, science, or SAT Math topics. Keep language simple and calm."""

DRAFT_SCHEMA = obj({
    "why_it_matters": STR,
    "concepts": arr(obj({"text": STR, "weapon": STR})),
    "misconception": STR,
    "root_prerequisite": STR,
    "boss": obj({"name": STR, "emoji": STR, "backstory": STR}),
    "cliffhanger": STR,
    "quiz": arr(obj({"question": STR, "answer": STR})),
    "lesson": obj({
        "standard": STR, "in_scope": arr(STR), "out_of_scope": arr(STR),
        "concepts": arr(obj({"look_fors": arr(STR), "probe_ladder": arr(STR), "spoilers": arr(STR),
                             "friend_nudge": STR})),
    }),
})

_BOSSES = [("Sum-Sum Sasquatch", "🦶🧮", "A sasquatch in a tiny tie, holding a sign that reads \"JUST GUESS, IT'S FINE\"."),
           ("Skip-Skip Stoat", "🦦🛵", "A stoat riding a scooter that has never once checked its work."),
           ("Rush-Rush Rooster", "🐓⏱️", "A rooster wearing a stopwatch hat that declares every answer finished early.")]


async def draft(topic: str, grade: int) -> dict:
    """Returns assignment content (no id/student/tutor)."""
    if live():
        try:
            r = await llm.structured(
                DRAFT_SYSTEM,
                [{"role": "user", "content": f"Topic: {topic}\nGrade: {grade}"}],
                DRAFT_SCHEMA, model=llm.WORK_MODEL, effort=llm.WORK_EFFORT, max_tokens=4000,
                timeout=60)
            cs = r["concepts"][:3]
            if len(cs) == 3 and len(r["quiz"]) >= 3:
                concepts = [{"id": f"k{i + 1}", **c} for i, c in enumerate(cs)]
                return {
                    "lesson": L.fit_lesson(r.get("lesson"), concepts, topic),
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
        les = L.load_lesson("a_frac")
        return {**FRAC, "topic": topic, **({"lesson": les} if les else {})}
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
        "lesson": L.offline_lesson(concepts, topic),
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
Step 1, rules: read the student messages (each tagged [msg_index]) and list the rules the student taught, \
at most one per concept. quote must be copied WORD FOR WORD from the message at msg_index (a whole \
message or a contiguous part). If a rule for a concept was corrected later, keep only the latest. \
"correct" says whether the rule is correct as stated. Do not repair the student's wording. Do not \
invent rules the student never stated.
Step 2, answers: for each quiz question, Pip answers ONLY from the rules (rule_index is the position in \
your rules list, or -1 if no rule covers it). pip_answer is the short worked answer (e.g. "5/12"). line is \
Pip's one deadpan sentence: for a wrong rule, follow it exactly and state the odd result, e.g. "Your \
rule: add the tops and the bottoms. 3/6 + 2/6 = 5/12. That's less than the 3/6 I started with. I added \
and got less. Following your rule anyway. 😵". Apply what was taught including its \
implications: a rule about one idea may answer a question about a related one (use the closest taught rule). \
Only when NOTHING taught relates are pip_answer and line "You didn't teach me that one." and passed false. \
Concepts listed as "Pip already knows" came from Pip's own opening claim: answer them correctly (passed true, \
rule_index -1). Otherwise passed is true only if the rule exists, is correct, and gives the right answer."""

QUIZ_SCHEMA = obj({
    "rules": arr(obj({"concept_index": INT, "msg_index": INT, "quote": STR, "correct": BOOL})),
    "answers": arr(obj({"question_index": INT, "rule_index": INT, "pip_answer": STR, "line": STR,
                        "passed": BOOL})),
})


def student_msgs(session: dict, start: int = 0) -> list[tuple[int, str]]:
    return [(i, m["text"]) for i, m in enumerate(session["transcript"])
            if m["from"] == "student" and i >= start]


async def run_quiz(session: dict, a: dict, qs: list[dict], start: int = 0) -> dict:
    """{rules: [{concept_id, msg_index, quote, correct}], answers: [{question_index, ...}]}.
    qs is the subset of quiz questions to ask; start limits messages to transcript index >= start."""
    if live():
        try:
            ids = concept_ids(a)
            msgs = "\n".join(f"[{i}] {t}" for i, t in student_msgs(session, start))
            concepts = "\n".join(f"{i}: {c['text']}" for i, c in enumerate(a["concepts"]))
            quiz = "\n".join(f'{n}: (concept {ids.index(q["concept_id"])}) {q["question"]} '
                             f'[correct: {q.get("answer", "")}]' for n, q in enumerate(qs))
            prior = [c["text"] for c in a["concepts"] if c["id"] in ((a.get("lesson") or {}).get("prior_knowledge") or [])]
            prompt = (f"Topic: {a['topic']}\nMisconception Pip started with: {a['misconception']}\n"
                      f"Pip already knows: {prior or 'nothing in particular'}\n"
                      f"Concepts:\n{concepts}\n\nQuiz questions (question_index: ...):\n{quiz}\n\n"
                      f"Student messages:\n{msgs}")
            r = await llm.structured(QUIZ_SYSTEM, [{"role": "user", "content": prompt}], QUIZ_SCHEMA,
                                     model=llm.WORK_MODEL, effort="low", max_tokens=2000, timeout=30)
            return {"rules": [{"concept_id": ids[x["concept_index"]], "msg_index": x["msg_index"],
                               "quote": x["quote"], "correct": x["correct"]}
                              for x in r["rules"] if 0 <= x["concept_index"] < len(ids)],
                    "answers": r["answers"]}
        except (LlmError, KeyError, TypeError, IndexError) as e:
            log.warning("quiz fell back to offline: %s", e)
    return offline_quiz(session, a, qs, start)


def _logged(session: dict, a: dict, start: int):
    """(concept, rule) candidates recorded by lesson turns: msg_index, level, correct."""
    msgs = dict(student_msgs(session, start))
    for e in session.get("turn_log") or []:
        if e["msg_index"] in msgs and e.get("concept_id") and (e["level"] >= 1 or e.get("correct") is False):
            yield e["msg_index"], msgs[e["msg_index"]], e


def prior_answer(a: dict, q: dict) -> tuple[str, str]:
    """(answer, line) for a concept Pip already knows (its opening claim uses it)."""
    sc = _quiz_script(a, q["concept_id"], 0)
    if sc:
        return sc["pip_answer"], sc["line"]
    ans = (q.get("answer") or "").strip() or "I already know that one"
    return ans, f"I already knew that one. {ans}"


def _quiz_script(a: dict, cid: str, start: int) -> dict | None:
    """Authored quiz line from lesson.offline_demo (`retry` is used in re-teach mode)."""
    les = L.lesson_of(a)
    d = (les or {}).get("offline_demo")
    if not isinstance(d, dict) or is_fractions(a):
        return None
    for key in (("retry", "quiz") if start else ("quiz",)):
        for e in d.get(key) or []:
            if isinstance(e, dict) and e.get("concept_id") == cid and e.get("line"):
                return {"passed": bool(e.get("passed")), "pip_answer": e.get("pip_answer") or "",
                        "line": e["line"]}
    return None


def offline_quiz(session: dict, a: dict, qs: list[dict], start: int = 0) -> dict:
    best: dict[str, tuple] = {}  # concept -> (key, msg_index, quote, correct)
    logged = list(_logged(session, a, start)) if session.get("turn_log") and not is_fractions(a) else []
    per: dict[str, list] = {}
    for i, text, e in logged:
        per.setdefault(e["concept_id"], []).append((i, text, e))
    for cid, es in per.items():  # a later wrong rule wins; otherwise the strongest explanation since
        tail = []
        for x in es:
            tail = [] if x[2]["correct"] is False else tail + [x]
            if x[2]["correct"] is False:
                tail = [x]
        i, text, e = tail[0] if tail[0][2]["correct"] is False else max(tail, key=lambda x: (x[2]["level"], x[0]))
        best[cid] = ((1, i), i, rule_text(text), e["correct"] is not False)
    for i, text in ([] if logged else student_msgs(session, start)):
        cid, correct, score = classify(text, a)
        if cid is None:
            continue
        bonus = 1 if REASON.search(norm(text)) else 0
        key = (1, i) if correct is not None else (score + bonus, i)  # known rules: latest wins
        if cid not in best or key >= best[cid][0]:
            best[cid] = (key, i, best_quote(text, a), True if correct is None else correct)
    rules, index = [], {}
    for cid in concept_ids(a):
        if cid in best:
            index[cid] = len(rules)
            rules.append({"concept_id": cid, "msg_index": best[cid][1], "quote": best[cid][2],
                          "correct": best[cid][3]})
    # inference: a concept with no rule of its own is answered from the taught rule that relates to it most
    # ("didn't teach me that" only when nothing taught relates)
    les_ = L.lesson_of(a)
    prior_ = set((les_ or {}).get("prior_knowledge") or [])
    if best and not is_fractions(a):
        voc = PC.vocab(a, les_)
        for cid in concept_ids(a):
            if cid in index or cid in prior_:
                continue
            cands = [(sum(w for st, w in voc[cid].items() if st in PC.stems(r["quote"])), i) for i, r in enumerate(rules)
                     if r["correct"]]
            if cands and max(cands)[0] > 0:
                index[cid] = max(cands)[1]
    answers = []
    for n, q in enumerate(qs):
        i = index.get(q["concept_id"], -1)
        if i < 0:
            answers.append({"question_index": n, "rule_index": -1, "passed": False,
                            "pip_answer": "You didn't teach me that one.",
                            "line": "You didn't teach me that one."})
            continue
        r = rules[i]
        script = _quiz_script(a, q["concept_id"], start)
        if is_fractions(a) and not r["correct"]:
            ans, line, ok = "5/12", WRONG_LINE, False
        elif is_fractions(a):
            ans = {"k1": "No. Different sizes.", "k2": "6: 1/2 = 3/6 and 1/3 = 2/6",
                   "k3": "5/6"}[q["concept_id"]]
            line, ok = f'Your rule: "{r["quote"]}" That gives {ans} 🙂'.replace("  ", " "), True
        elif script and script["passed"] == r["correct"]:
            ans, line, ok = script["pip_answer"], script["line"], r["correct"]
            if "you said" in line.lower() and r["correct"]:  # the authored line quotes the authored student: use theirs
                mine = PC.stems(r["quote"])
                short = " ".join(r["quote"].split()[:14])
                line = re.sub(r"[Yy]ou said [^.]*\.?", f'You said: "{short}".', line, count=1)
        elif logged and not r["correct"]:
            ans, line, ok = ("That came out odd.", f'Your rule: "{r["quote"]}" I did exactly that and the '
                             "answer looks odd to me. Following your rule anyway. 😵", False)
        else:
            ans, line, ok = "Followed your rule.", f'Your rule: "{r["quote"]}" I did exactly that.', True
        answers.append({"question_index": n, "rule_index": i, "pip_answer": ans, "line": line,
                        "passed": ok})
    return {"rules": rules, "answers": answers}


# ---------------------------------------------------------------- gap report

def report_det(session: dict, a: dict, student: dict) -> dict:
    """Deterministic gap report (statuses, verbatim quotes, minutes, templated opener)."""
    rules = {r["concept_id"]: r for r in session["brain"]}
    concepts = []
    for c in a["concepts"]:
        r = rules.get(c["id"])
        known = c["id"] in ((a.get("lesson") or {}).get("prior_knowledge") or [])
        status = ("explained" if known else "vague") if r is None else ("explained" if r["correct"] else "misconception")
        stuck = bool((session.get("ladder") or {}).get(c["id"], {}).get("stuck")) and status != "explained"
        concepts.append({"concept_id": c["id"], "concept_text": c["text"], "status": status,
                         "quote": r["quote"] if r else None,
                         "fixed_after": (r or {}).get("fixed_after"), "stuck": stuck})
    base = offline_report_text(concepts, a, student)
    return {
        "concepts": concepts, "minutes": session.get("minutes") or minutes_spent(session),
        "quiz_passed": sum(1 for q in session["quiz"] if q["passed"]),
        "quiz_total": len(session["quiz"]) or len(a["concepts"]),
        "opener": base["opener"], "root_cause": base["root_cause"],
        "cliffhanger": a.get("cliffhanger", ""), "summary": base["summary"],
        "student_view": base["student_view"],
        "parked": [{"text": x["text"], "term": x.get("term", "")} for x in session.get("parked") or []],
        "flags": [k for k, n in (session.get("flags") or {}).items() if n],
    }


POLISH_SYSTEM = """You polish a tutor's gap report after a student taught an AI classmate named Pip. \
Given the facts, write: summary (one line for the roster: what they explained well and what they \
missed or fixed) and opener (a specific 10-minute opener for the next session, for the weakest \
concept: concrete steps and one starting problem). Use only the facts given; never invent student \
words. Calm, professional, plain language."""
POLISH_SCHEMA = obj({"summary": STR, "opener": STR})


async def polish(report: dict, a: dict, student: dict) -> dict | None:
    if not live():
        return None
    try:
        facts = "\n".join(f'- {c["concept_text"]}: {c["status"]}'
                          + (f', fixed after {c["fixed_after"]} re-teach' if c["fixed_after"] else "")
                          + (f' (student said: "{c["quote"]}")' if c["quote"] else "")
                          for c in report["concepts"])
        r = await llm.structured(
            POLISH_SYSTEM, [{"role": "user", "content": f"Student: {student['name']}\nTopic: {a['topic']}\n"
                             f"Root prerequisite: {a['root_prerequisite']}\n{facts}"}],
            POLISH_SCHEMA, model=llm.WORK_MODEL, effort=llm.WORK_EFFORT, max_tokens=800, timeout=30)
        return r if r["summary"].strip() and r["opener"].strip() else None
    except (LlmError, KeyError) as e:
        log.warning("report polish skipped: %s", e)
        return None


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
    stuck = [sn(c) for c in concepts if c.get("stuck")]
    parts = []
    if good:
        parts.append("Explains " + " and ".join(good))
    parts += [f"{n} fixed after {k} re-teach" for n, k in fixed]
    if stuck:
        parts.append("stuck after the full ladder on " + " and ".join(stuck))
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
    return {"opener": opener, "root_cause": f"{short_name(a, weakest['concept_id']).capitalize()} "
                                           f"builds on: {a['root_prerequisite']}.",
            "summary": "; ".join(parts) if parts else "No rules taught yet", "student_view": view}


# ---------------------------------------------------------------- parent update

PARENT_SYSTEM = """Write a short, warm, encouraging text message to a parent from the tutoring center \
"Bright Path Tutoring". Lead with what the student taught Pip (an AI classmate) and did well, then what \
is next. Plain language, 2 to 4 sentences, at most one emoji. No list of mistakes, no scores, no other \
students. Sign off as the tutor. Start with "Bright Path Tutoring:"."""


def parent_template(session: dict, a: dict, student: dict, tutor_name: str) -> str:
    report_ = session.get("gap_report") or {}
    first = student["name"].split()[0]
    names = [short_name(a, c["concept_id"]) for c in report_.get("concepts", [])
             if c["status"] == "explained"]
    taught = (", ".join(names[:-1]) + " and " + names[-1] if len(names) > 1
              else names[0] if names else "the key ideas")
    return (f"Bright Path Tutoring: {first} taught Pip {a['topic'].lower()} this week and "
            f"explained {taught} in their own words. Pip's brain just levelled up to "
            f"v{session['brain_version']}. Next week {first} takes on a new challenge. "
            f"- {tutor_name}")


async def parent_message(session: dict, a: dict, student: dict, tutor_name: str) -> str:
    if live():
        try:
            report_ = session.get("gap_report") or {}
            good = [c["concept_text"] for c in report_.get("concepts", []) if c["status"] == "explained"]
            prompt = (f"Student first name: {student['name'].split()[0]}\nTopic: {a['topic']}\n"
                      f"Tutor: {tutor_name}\nThings the student explained well: "
                      f"{good or 'worked hard on every idea'}\nNext up: {a.get('cliffhanger', '')}\n"
                      f"Pip brain level: v{session['brain_version']}")
            r = await llm.structured(PARENT_SYSTEM, [{"role": "user", "content": prompt}],
                                     obj({"message": STR}), model=llm.WORK_MODEL,
                                     effort=llm.WORK_EFFORT, max_tokens=500, timeout=30)
            if r["message"].strip():
                return r["message"].strip()
        except (LlmError, KeyError) as e:
            log.warning("parent message fell back to template: %s", e)
    return parent_template(session, a, student, tutor_name)


# ---------------------------------------------------------------- warm-up

async def warm() -> bool:
    """One tiny call per schema so the first real request is not cold. True if all succeeded."""
    if not live():
        return False
    a = {**FRAC, "id": "a_frac", "grade": 6}
    session = {"transcript": [{"from": "pip", "text": "Hi.", "ts": ""},
                              {"from": "student", "text": "the pieces have to be the same size", "ts": ""}],
               "meters": {"k1": 0, "k2": 0, "k3": 0}, "boss_hp": 100, "equipped": None, "weapons": [],
               "reteach_concept": None, "misconception_stated": True}
    jobs = [
        llm.structured(persona_system(a), _alternate([{"role": "user", "content": "<student>hi</student>"}]),
                       TURN_SCHEMA, model=llm.CHAT_MODEL, effort=llm.CHAT_EFFORT, max_tokens=400, timeout=12),
        llm.structured(persona_system({**a, "lesson": L.offline_lesson(a["concepts"], a["topic"])}),
                       _alternate([{"role": "user", "content": "<student>hi</student>"}]),
                       LESSON_SCHEMA, model=llm.CHAT_MODEL, effort=llm.CHAT_EFFORT, max_tokens=400, timeout=12),
        llm.structured(QUIZ_SYSTEM, [{"role": "user", "content": "Student messages:\n[1] hi"}], QUIZ_SCHEMA,
                       model=llm.WORK_MODEL, effort="low", max_tokens=400, timeout=30),
        llm.structured(DRAFT_SYSTEM, [{"role": "user", "content": "Topic: fractions\nGrade: 6"}], DRAFT_SCHEMA,
                       model=llm.WORK_MODEL, effort=llm.WORK_EFFORT, max_tokens=2500, timeout=45),
        llm.structured(POLISH_SYSTEM, [{"role": "user", "content": "Student: A\n- x: explained"}], POLISH_SCHEMA,
                       model=llm.WORK_MODEL, effort=llm.WORK_EFFORT, max_tokens=300, timeout=30),
    ]
    import asyncio
    res = await asyncio.gather(*jobs, return_exceptions=True)
    for r in res:
        if isinstance(r, Exception):
            log.warning("warm-up call failed: %s", r)
    return all(not isinstance(r, Exception) for r in res)
