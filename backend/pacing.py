"""Pacing model (PACE-1): shared by the offline engine and the live path.

Every student text is judged against ALL concepts (earlier texts keep their credit). Per concept we track
idea / reason / example (and `wrong` when the student taught the misconception). Pip never asks for something
already given, asks at most one "why" and one "example" per concept, never repeats a question, and says it is
ready for the quiz once every concept has idea + (reason or example), or after 4 content texts with 2 covered.
The server owns all of this state; the live model only reports what the student's texts established.
"""

import re

import lesson as L
from logic import norm

READY_LINES = ["ok I think I get it. quiz me?", "I think I'm good. Want to quiz me now?",
               "Anything else, or should I try the quiz?", "I'm ready when you are. Should we do the quiz?",
               "That's everything I can hold. Quiz time?", "Okay, I'm full. Ready for the quiz?"]
HOLD = "Okay, I'll hold onto that one."
EXPLAINED_FLOOR = 60          # a concept with idea + reason unlocks its weapon (logic.UNLOCK_AT)

REFUSE = re.compile(r"just tell me|tell me (the|what)|give me the answer|my teacher says|"
                    r"you have to tell|what.?s the answer|what is the answer")
PROFANE = re.compile(r"\b(bitch|shit|fuck\w*|asshole|bastard|crap|damn|dick|piss)\b")
INSULT = re.compile(r"stupid|dumb|idiot|shut up|you suck|hate you|\bloser\b|moron|\bbitch\b|\bshit\b|fuck|asshole")
POINTLESS = re.compile(r"pointless|boring|waste of time|who cares|this is useless")
IDK = re.compile(r"\bidk\b|i don.?t know|i dont know|no idea|not sure|dunno|whatever")
REASON = re.compile(r"because|\bcuz\b|\bcause\b|since|\bso\b|that.?s why|which is why|imagine|means|otherwise|"
                    r"tells you|names the|so that|has to|have to")
STRONG = re.compile(r"imagine|because|\bcuz\b|\bcause\b|since|that.?s why|which is why|so that|tells you|names the")
NONREASON = re.compile(r"because (the )?(rule|formula)|just the formula|because (it'?s|that'?s|thats|its|it is) (just )?(the|a) rule|just because|because i said|"
                       r"i said so|it just works|because it is|because it'?s (how|what)|just do it|you just do it|"
                       r"my teacher")
EXAMPLE = re.compile(r"\d\s*[+\-*/x=\u00d7\u00f7]\s*\d|\d+\s*(times|by)\s*\d+|\d+/\d+|for example|for instance|e\.g\.|imagine|\bsay\b|"
                     r"'[^']{6,}'|\"[^\"]{6,}\"")
STOP = set("that this with from have when then they them what your each does into there their about which would "
           "could should because just like also only make some need want thing things same".split())


# ---------------------------------------------------------------- state

def new_pace(a: dict) -> dict:
    return {"cov": {c["id"]: {"idea": False, "reason": False, "example": False, "wrong": False}
                    for c in a["concepts"]},
            "asks": {c["id"]: {"idea": 0, "why": 0, "example": 0} for c in a["concepts"]},
            "vague": {c["id"]: 0 for c in a["concepts"]},
            "nudged": {c["id"]: False for c in a["concepts"]},
            "qlog": [], "target": None, "last_q": "", "texts": 0, "all_texts": 0, "turns": 0}


def ensure_pace(session: dict, a: dict) -> dict:
    p = session.setdefault("pace", new_pace(a))
    for k, v in new_pace(a).items():
        if isinstance(v, dict):
            d = p.setdefault(k, {})
            for cid, x in v.items():
                d.setdefault(cid, x)
        else:
            p.setdefault(k, v)
    L_lad = session.setdefault("ladder", {})
    for cid in p["cov"]:
        L_lad.setdefault(cid, {"rung": 0, "nudged": False, "stuck": False, "done": False, "best_level": 0})
    session.setdefault("ready_for_quiz", False)
    return p


def reset_concept(session: dict, a: dict, cid: str) -> None:
    p = ensure_pace(session, a)
    p["cov"][cid] = {"idea": False, "reason": False, "example": False, "wrong": False}
    p["asks"][cid] = {"idea": 0, "why": 0, "example": 0}
    p["vague"][cid], p["nudged"][cid] = 0, False
    session["ladder"][cid].update(stuck=False, done=False)
    session["ready_for_quiz"] = False


def is_fractions(a: dict) -> bool:
    return a.get("id") == "a_frac" or "fraction" in a.get("topic", "").lower()


def covered(c: dict) -> bool:
    return c["idea"] and (c["reason"] or c["example"]) and not c["wrong"]


def kind_of(les: dict | None, cid: str) -> str:
    return ((L.lc(les, cid) if les else None) or {}).get("kind") or "reason"


def explained(c: dict, kind: str = "reason") -> bool:
    """Reasons need a reason; conventions and procedures are explained by an applied example."""
    if kind == "reason":
        return c["idea"] and c["reason"] and not c["wrong"]
    return c["idea"] and (c["example"] or c["reason"]) and not c["wrong"]


# ---------------------------------------------------------------- question bank

def one_question(text: str) -> str:
    """Cut a rung down to its first question (statements before it are kept)."""
    i = text.find("?")
    return text if i < 0 else text[:i + 1].strip()


def rung_kind(text: str) -> str:
    t = norm(text)
    if re.search(r"my rule says|^then |^so if|^say a ", t):
        return "infer"
    if re.search(r"show me|example|try one|your own|a small|walk me|walk through|count them|i.?ll guess|"
                 r"tricky|sort ", t):
        return "example"
    if re.search(r"\bwhy\b|what does the .* mean", t):
        return "why"
    return "idea"


def qnorm(q: str) -> str:
    return re.sub(r"[^a-z0-9 ]", "", norm(q)).strip()


KIND_GENERIC = {"convention": ["When would I use that one?", "Can you give me a tricky one to sort?"],
                "procedure": ["Can you walk me through one example?", "Can you do one while I watch?"]}
GENERIC = {"idea": ["What do I do first?", "Can you say that part again, smaller?", "What's the very first step?"],
           "why": ["Why does that work?", "Why does it have to be like that?"],
           "example": ["Can you give me an example of that?", "Can you try one so I can see it?"]}


def stems(text: str) -> set[str]:
    return {w[:5] for w in re.findall(r"[a-z]{4,}", norm(text)) if w not in STOP}


def vocab(a: dict, les: dict | None) -> dict[str, dict[str, float]]:
    """cid -> {stem: weight}; a stem shared by all concepts counts less."""
    raw = {}
    for c in a["concepts"]:
        spec = L.lc(les, c["id"]) if les else None
        raw[c["id"]] = stems(c["text"] + " " + " ".join((spec or {}).get("look_fors", [])))
    count: dict[str, int] = {}
    for s in raw.values():
        for w in s:
            count[w] = count.get(w, 0) + 1
    return {cid: {w: 1.0 / count[w] for w in s} for cid, s in raw.items()}


def best_concept(a: dict, les: dict | None, text: str, default: str | None = None) -> str | None:
    voc, ts = vocab(a, les), stems(text)
    scored = sorted(((sum(w for s, w in v.items() if s in ts), cid) for cid, v in voc.items()), reverse=True)
    return scored[0][1] if scored and scored[0][0] > 0 else default


def closed(p: dict, ladder: dict, cid: str, kind: str = "reason") -> bool:
    """Nothing left to ask about this concept."""
    c, asks = p["cov"][cid], p["asks"][cid]
    if ladder[cid]["stuck"]:
        return True
    if kind != "reason":  # convention / procedure: an applied example closes it; never ask why
        return explained(c, kind)
    if c["idea"] and c["reason"] and not c["wrong"]:
        return True
    if c["idea"] and c["example"] and asks["why"] >= 1 and not c["wrong"]:
        return True
    return False


def next_question(session: dict, a: dict, les: dict, focus: str | None = None, infer: bool = False):
    """(question, cid, kind) for the most useful thing not yet given, or None when nothing is left to ask."""
    p = ensure_pace(session, a)
    order = [c["id"] for c in a["concepts"] if L.lc(les, c["id"])
             and not closed(p, session["ladder"], c["id"], kind_of(les, c["id"]))]
    if focus in order:
        order.remove(focus)
        order.insert(0, focus)
    used = set(p["qlog"])
    for cid in order:
        c, asks = p["cov"][cid], p["asks"][cid]
        ck = kind_of(les, cid)
        if ck != "reason":  # never ask why of a convention or procedure
            if not c["idea"] or c["wrong"]:
                kind = "idea"
            elif not c["example"] and asks["example"] < 1:
                kind = "example"
            else:
                continue
        elif c["wrong"]:
            kind = "idea" if not c["reason"] and asks["why"] < 1 else "why"
        elif not c["idea"]:
            kind = "idea"
        elif not c["reason"] and asks["why"] < 1:
            kind = "why"
        elif not c["reason"] and not c["example"] and asks["example"] < 1:
            kind = "example"
        else:
            continue
        rungs = [one_question(r) for r in L.lc(les, cid)["probe_ladder"]]
        if infer and c["idea"]:
            for r in rungs:
                if rung_kind(r) == "infer" and qnorm(r) not in used:
                    return r, cid, "infer"
        for r in rungs:
            if rung_kind(r) == kind and qnorm(r) not in used and "?" in r:
                return r, cid, kind
        for g in (KIND_GENERIC.get(ck, []) if kind == "example" and ck != "reason" else []) + GENERIC[kind]:
            if qnorm(g) not in used:
                return g, cid, kind
    return None


# ---------------------------------------------------------------- judging (offline heuristics)

def sentences(text: str) -> list[str]:
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text.strip()) if s.strip()]


def quote(text: str) -> str:
    """A verbatim sentence from the text for "Saving that": the first sentence with a reason, else the first."""
    ss = [s for s in sentences(text) if len(s) >= 12] or [text.strip()]
    if len(text.strip()) <= 140:
        return text.strip()
    pick = next((s for s in ss if REASON.search(norm(s))), ss[0])
    return pick[:240]


def empty_flags(a: dict) -> dict:
    return {c["id"]: {"idea": False, "reason": False, "example": False, "wrong": False} for c in a["concepts"]}


FR = {
    "k1": re.compile(r"same (size|denominator|bottom|pieces)|different (sizes?|pieces)|bottoms? (the same|match|"
                     r"have to)|make (the|them) (bottoms?|same)|can.?t (just )?add|same first|bottom the same"),
    "k2": re.compile(r"common|multiple|sixths|equivalent|divisible|go(es)? into|\d+/\d+\s*(is|=|becomes|turns into)"
                     r"\s*\d+/\d+|both (the )?(2|3|bottoms)|\d+ and \d+ both"),
    "k3": re.compile(r"add (only |just )?(the )?(tops?|numerators?)|only add|keep the (bottom|denominator)|"
                     r"(bottom|denominator)s? (just |also )?(stays?|tells|names|doesn.?t change|is the same)"),
    "k3wrong": re.compile(r"add (up )?the (tops?|numerators?)( numbers)? and (the )?(bottoms?|denominators?)"
                          r"( numbers)?|add (the )?(tops?|numerators?),? (and )?(the )?(bottoms?|denominators?)"),
}


# Offline-only keyword features for the main demo missions (the generic stem scorer handles the rest).
MISSION_IDEAS = {
    "a_tri": {
        "k1": re.compile(r"(two|2) (of them|copies|triangles|same|identical|together)|make a (rectangle|parallelogram|"
                         r"box)|put .{0,20}together|into a (rectangle|box)|fit together|flip"),
        "k2": re.compile(r"(rectangle|box).{0,25}(base|length|width).{0,12}(times|x|\u00d7|\*)|"
                         r"(base|length) (times|x|\u00d7|\*) (height|width)|\d+\s*(x|\u00d7|\*|times)\s*\d+"),
        "k3": re.compile(r"\bhalf\b|\u00bd|\u00f7\s*2|divided? (it )?by (2|two)|/\s*2\b|times (1/2|a half)"),
    },
}


def _frac_eq(t: str) -> bool:
    return bool(re.search(r"\d+/\d+\s*(\+|=|is|becomes)\s*\d+/\d+", t))


def judge(text: str, a: dict, les: dict | None, session: dict) -> dict:
    """What this one text establishes, per concept, plus the student's move. Heuristic, deterministic."""
    t = norm(text)
    p = ensure_pace(session, a)
    f = empty_flags(a)
    ids = [c["id"] for c in a["concepts"]]
    words = len(t.split())
    nonreason = bool(NONREASON.search(t))
    reasonish = bool(REASON.search(t)) and not nonreason and words >= 4
    exampleish = bool(EXAMPLE.search(text)) and words >= 3
    wrong_cid = None
    if is_fractions(a) and {"k1", "k2", "k3"} <= set(ids):
        if FR["k3wrong"].search(t):
            wrong_cid = "k3"
        else:
            if FR["k1"].search(t):
                f["k1"]["idea"] = True
            if FR["k2"].search(t):
                f["k2"]["idea"] = True
            if FR["k3"].search(t):
                f["k3"]["idea"] = True
        if _frac_eq(t):  # a worked equivalent-fraction pair shows both "same bottoms" and the conversion
            f["k1"]["example"] = f["k2"]["example"] = True
            f["k1"]["idea"] = f["k1"]["idea"] or f["k2"]["idea"]
            f["k2"]["idea"] = True
        if re.search(r"\d+\s*\+\s*\d+\s*=\s*\d+|\d+/(\d+)\s*\+\s*\d+/\1\s*=|=\s*\d+/\d+\s*$|then \d+/\d+", t):
            f["k3"]["example"] = f["k3"]["idea"] = True
        if f["k1"]["idea"] and (reasonish or exampleish):
            f["k1"]["reason"] = reasonish and bool(re.search(r"because|so|since|different|can.?t|cuz", t))
            f["k1"]["example"] = f["k1"]["example"] or bool(re.search(r"pizza|slice|piece", t)) or exampleish
        if f["k2"]["idea"] and reasonish and re.search(r"because|since|cuz|multiple|go(es)? into|both", t) \
                and not f["k2"]["reason"]:
            f["k2"]["reason"] = bool(re.search(r"because|since|cuz|so that", t) or "multiple" in t)
        if f["k3"]["idea"] and reasonish and re.search(r"bottom|denominator|size|name|tells|stays|same", t):
            f["k3"]["reason"] = bool(re.search(r"because|since|cuz|tells|names|size of", t))
    else:
        t2 = re.sub(r"\b2\b", "two", t)
        for cid, rx in MISSION_IDEAS.get(a.get("id"), {}).items():
            if cid in f and rx.search(t2):
                f[cid]["idea"] = True
        for cid in ids:  # an authored "answer phrase" (the lesson's spoilers) is evidence of that concept
            for sp in (L.lc(les, cid) or {}).get("spoilers", []) if les else []:
                n = re.sub(r"\b2\b", "two", norm(sp))
                if len(n) >= 4 and n in t2 and not re.match(r"[=\d]", n):
                    f[cid]["idea"] = True
        voc = vocab(a, les)
        ts = stems(text)
        scores = {cid: sum(w for s, w in v.items() if s in ts) for cid, v in voc.items()}
        order = sorted(scores, key=scores.get, reverse=True)
        top = order[0] if order else None
        second = scores[order[1]] if len(order) > 1 else 0
        for cid, sc in scores.items():  # a clear winner, or a strong match; ties credit nothing
            if a.get("id") in MISSION_IDEAS:
                break
            if words >= 3 and (sc >= 2.0 or (cid == top and sc >= 1.0 and sc > second)):
                f[cid]["idea"] = True
        mis = stems(a.get("misconception", ""))
        neg = re.search(r"\b(not|never|don.?t|can.?t|isn.?t|no|wrong|shouldn.?t)\b", t)
        if len(mis & ts) >= 2 and re.search(r"\bjust\b|always|whenever|wherever|every", t) and not neg:
            wrong_cid = best_concept(a, les, text, p["target"]) or ids[0]
    # bare reasoning / examples answer the question Pip just asked
    tgt = p["target"]
    got = [cid for cid in ids if f[cid]["idea"]]
    strong = bool(STRONG.search(t)) and not nonreason and words >= 4
    for cid in got:  # reasons / examples attach to the concepts this text is about
        if reasonish and not f[cid]["reason"]:
            f[cid]["reason"] = True
        if exampleish:
            f[cid]["example"] = True
    if tgt and strong and not wrong_cid and p["cov"][tgt]["idea"] and not p["cov"][tgt]["reason"] \
            and tgt not in got:  # a reason also answers the "why" Pip asked about the target concept
        f[tgt]["reason"] = True
    if tgt and not got and not wrong_cid:  # bare answer to the question Pip just asked
        if strong:
            f[tgt]["reason"] = True
        if exampleish and words >= 3:
            f[tgt]["example"] = True
    if wrong_cid:
        for cid in ids:
            f[cid] = {"idea": False, "reason": False, "example": False, "wrong": False}
        f[wrong_cid] = {"idea": True, "reason": False, "example": False, "wrong": True}
    interest = ""
    return {"flags": f, "refusal": bool(REFUSE.search(t)), "insult": bool(INSULT.search(t)),
            "pointless": bool(POINTLESS.search(t)), "idk": bool(IDK.search(t)),
            "nonreason": nonreason, "wrong_cid": wrong_cid,
            "content": any(v["idea"] or v["reason"] or v["example"] or v["wrong"] for v in f.values()),
            "interest": interest}


# ---------------------------------------------------------------- slips (the smart-dumb move)

FLIP = re.compile(r"(\+|plus)\s*(becomes|turns into|changes to|flips? to|goes to)\s*(-|\u2212|minus)|"
                  r"becomes\s*(-|\u2212)|(-|\u2212)\s*(becomes|turns into)\s*\+|vice versa")


def slip(text: str, a: dict, session: dict) -> str | None:
    """A literal one-line catch when the student's own numbers contradict a rule they taught (parseable
    cases only: linear equations with a taught sign flip, equal-denominator fraction sums)."""
    prior = " ".join(m["text"] for m in session["transcript"] if m["from"] == "student")
    m = re.search(r"(\d+)\s*x\s*\+\s*(\d+)\s*=\s*(\d+)", a.get("misconception", ""))
    if m:
        coef, b, c = (int(g) for g in m.groups())
        mm = re.search(r"x\s*=\s*(\d+)\s*/\s*(\d+)", text)
        if mm and FLIP.search(norm(prior + " " + text)) and int(mm.group(1)) == c + b and int(mm.group(2)) == coef:
            return f"wait, {c} + {b}? I thought you said the {b} flips to \u2212{b}."
    fm = re.search(r"(\d+)/(\d+)\s*\+\s*(\d+)/(\d+)\s*=\s*(\d+)/(\d+)", text)
    if fm and is_fractions(a):
        n1, d1, n2, d2, n3, d3 = (int(g) for g in fm.groups())
        taught = re.search(r"bottom (stays|is the same|doesn.?t change)|keep the (bottom|denominator)|only add the top",
                           norm(prior + " " + text))
        if d1 == d2 and d3 != d1 and taught:
            return f"wait, {n3}/{d3}? I thought the bottom stays {d1}."
    return None


def paraphrase(a: dict, cr: dict, p: dict) -> str:
    """At most every other turn, <= 8 of Pip's own words, never the student's sentence."""
    if p["turns"] % 2 == 0:
        return ""
    gain = [cid for cid, g in cr["gained"].items() if any(g.values())]
    if not gain:
        return ""
    cid = next((c for c in gain if cr["gained"][c]["reason"]), gain[0])
    why = cr["gained"][cid]["reason"]
    if a.get("id") == "a_frac":  # curated short names exist for the demo mission
        name = " ".join(short_name_of(a, cid).split()[:5])
        return f"ok, that explains {name}." if why else f"ok, so it's about {name}."
    return "ok, that's the why." if why else "ok, I follow that part."


def short_name_of(a: dict, cid: str) -> str:
    from logic import short_name
    return short_name(a, cid)


def verbatim(stmt: str, current: str) -> bool:
    """True if the statement repeats 6+ words of the student's text in a row."""
    sw, cw = norm(re.sub(r"[^\w\s']", " ", stmt)).split(), norm(re.sub(r"[^\w\s']", " ", current)).split()
    runs = {" ".join(cw[i:i + 6]) for i in range(max(0, len(cw) - 5))}
    return any(" ".join(sw[i:i + 6]) in runs for i in range(max(0, len(sw) - 5)))


# ---------------------------------------------------------------- crediting

LEVEL_DELTA = L.LEVEL_DELTA


def credit(session: dict, a: dict, les: dict, judged: dict, text: str) -> dict:
    """Merge this text's flags into the session, score it, decide escalation and readiness."""
    p = ensure_pace(session, a)
    ids = [c["id"] for c in a["concepts"]]
    rt = session.get("reteach_concept")
    p["all_texts"] += 1
    p["turns"] += 1
    if PROFANE.search(norm(text)):  # tutor-only flag; never shown to the student
        fl = session.setdefault("flags", {})
        fl["language"] = fl.get("language", 0) + 1
    gained: dict[str, dict] = {}
    progress, levels = [], {}
    wrong_cid = None
    for cid in ids:
        new, cov = judged["flags"][cid], p["cov"][cid]
        g = {k: new[k] and not cov[k] for k in ("idea", "reason", "example")}
        if new["wrong"]:
            wrong_cid = cid
            cov.update(idea=True, wrong=True)
            gained[cid] = g
            continue
        if cov["wrong"] and (new["idea"] or new["reason"]):  # corrected
            cov["wrong"] = False
            cov.update(reason=False, example=False)
            g = {k: new[k] for k in ("idea", "reason", "example")}
        for k in ("idea", "reason", "example"):
            cov[k] = cov[k] or new[k]
        gained[cid] = g
        ck = kind_of(les, cid)
        if (g["reason"] or (ck != "reason" and g["example"])) and cov["idea"]:
            lvl = 3 if (cid == rt and cov["example"]) else 2
        elif any(g.values()):
            lvl = 1
        else:
            lvl = 0
        levels[cid] = lvl
        if lvl:
            delta = LEVEL_DELTA[lvl]
            if explained(cov, ck):
                delta = max(delta, EXPLAINED_FLOOR - session["meters"].get(cid, 0))
            progress.append({"concept_id": cid, "delta": max(0, min(60, delta))})
            lad = session["ladder"][cid]
            lad["best_level"] = max(lad["best_level"], lvl)
        if covered(cov):
            session["ladder"][cid]["done"] = True
    if judged["content"]:
        p["texts"] += 1
    top = max(levels.values(), default=0)
    event = "heal" if wrong_cid else ("hit" if top >= 2 else "none")
    any_gain = any(any(g.values()) for g in gained.values())
    # vague bookkeeping on the concept Pip was asking about: only misses/wrong answers on THAT concept count
    esc, tgt = None, p["target"]
    if tgt and not judged["refusal"] and not any_gain:
        p["vague"][tgt] += 1
        spec = L.lc(les, tgt) if les else None
        if p["vague"][tgt] >= 3 and p["nudged"][tgt] or (p["vague"][tgt] >= 4):
            esc = "stuck"
        elif p["vague"][tgt] >= 2 and not p["nudged"][tgt] and spec and spec.get("friend_nudge"):
            esc = "nudge"
    elif tgt and any(gained[tgt].values()):
        p["vague"][tgt] = 0
    if session.get("ready_for_quiz"):
        esc = None  # once ready, Pip stops probing: no nudges, no stuck
    if esc == "stuck":
        session["ladder"][tgt]["stuck"] = True
    # readiness
    states = [p["cov"][c] for c in ids]
    all_ok = all(covered(p["cov"][c]) or session["ladder"][c]["stuck"] for c in ids)
    n_cov = sum(covered(s) for s in states)
    n_idea = sum(s["idea"] for s in states)
    was_ready = bool(session.get("ready_for_quiz"))
    ready = was_ready or all_ok or (p["texts"] >= 4 and n_cov >= 2) or (p["all_texts"] >= 6 and n_idea >= 2) \
        or (p["all_texts"] >= 8 and n_idea >= 1)
    if rt:
        ready = covered(p["cov"][rt]) or session["ladder"][rt]["stuck"] or was_ready
    return {"progress": progress, "level": top, "levels": levels, "event": event,
            "strength": "critical" if top >= 3 else "solid", "wrong_cid": wrong_cid, "gained": gained,
            "any_gain": any_gain, "esc": esc, "ready": ready, "newly_ready": ready and not was_ready,
            "was_ready": was_ready, "esc_cid": tgt}


# ---------------------------------------------------------------- reply assembly

def split_reply(reply: str) -> tuple[list[str], str | None]:
    """(statements, first question) of a draft reply; later questions are dropped."""
    stm, q = [], None
    for s in sentences(reply):
        if "?" in s:
            if q is None:
                q = s if s.count("?") == 1 and s.endswith("?") else one_question(s)
        elif q is None:
            stm.append(s)
    return stm, q


def finalize(session: dict, a: dict, les: dict, cr: dict, draft: str, said: str, current: str = "") -> str:
    """Enforce the pacing rules on a draft reply (model-written or templated) and update the ask log."""
    p = ensure_pace(session, a)
    m = re.match(r"(Saving that: '.*?'\.)(?=\s|$)", draft)  # the filed quote is one atomic statement
    saving = m.group(1) if m else None
    stm, q = split_reply(draft[m.end():].strip() if m else draft)
    if saving:
        stm = [saving]
    elif stm and current and verbatim(stm[0], current):  # never parrot the student
        stm = []
    sl = slip(current, a, session) if current else None
    if sl:  # the catch is itself the one question
        stm, q = [], sl
    tgt = cr["esc_cid"]
    cl = lambda c_: closed(p, session["ladder"], c_, kind_of(les, c_))  # noqa: E731
    focus = next((cid for cid, lv in cr["levels"].items() if lv and not cl(cid)), None)
    focus = focus or (tgt if tgt and not cl(tgt) else None)
    kind_cid = (None, None)

    if cr["esc"] == "nudge" and not cr["any_gain"]:
        nudge = one_question(L.lc(les, tgt)["friend_nudge"])
        nudge = nudge if nudge.endswith("?") else nudge.rstrip(".") + ". Want to try again?"
        p["nudged"][tgt] = True
        p["qlog"].append(qnorm(nudge))
        p["last_q"], p["target"] = nudge, tgt
        return nudge
    infer = p["turns"] % 3 == 0 and not cr["wrong_cid"] and not cr["esc"]
    nq = next_question(session, a, les, focus, infer)
    if cr["esc"] == "stuck":
        stm, q = [HOLD], None
    if q and q is not sl:  # drop a question that repeats, or asks for what is already given
        kc = rung_kind(q)
        gained_c = next((c_ for c_, g_ in cr["gained"].items() if any(g_.values())), None)
        cid = best_concept(a, les, q, gained_c or focus or tgt)
        c = p["cov"].get(cid, {}) if cid else {}
        no_why = bool(cid) and kind_of(les, cid) != "reason"
        applicable = not ((kc == "example" and c.get("example")) or (kc == "why" and (c.get("reason") or no_why or
                          (cid and p["asks"][cid]["why"] >= 1))) or (kc == "idea" and c.get("idea") and not c.get("wrong")))
        if qnorm(q) in p["qlog"] or not applicable:
            q = None
        else:
            kind_cid = (cid, kc)
    if q is None and nq:
        q, kind_cid = nq[0], (nq[1], nq[2])
    if sl and not (cr["ready"] and (cr["newly_ready"] or cr["was_ready"])):
        q, kind_cid = sl, (None, None)
    ready_line = next((r for r in READY_LINES if qnorm(r) not in p["qlog"]), READY_LINES[-1])
    if cr["ready"] and (cr["newly_ready"] or cr["was_ready"] or q is None):
        q, kind_cid = ready_line, (None, None)  # ready: say so and stop asking
        session["ready_for_quiz"] = True
        if not (saving or sl):
            stm = []
    elif q is None:
        q, kind_cid = ready_line, (None, None)
        session["ready_for_quiz"] = True
    stm = stm[:1]
    if stm and q[:1].islower() and not stm[0].startswith(("Saving that", "Wait", "Noted", "Fair")):
        stm[0] = stm[0][:1].lower() + stm[0][1:]  # mirror the authored lowercase register
    reply = " ".join(stm + [q])
    if cr["esc"] == "stuck":
        reply = f"{HOLD} {q}"
    sl_said = norm(said)
    for cid_ in [c["id"] for c in a["concepts"]]:  # spoiler guard: Pip must not say it first
        for sp in (L.lc(les, cid_) or {}).get("spoilers", []):
            if norm(sp) and norm(sp) in norm(reply) and norm(sp) not in sl_said:
                reply = q if norm(sp) not in norm(q) else ready_line
    p["qlog"].append(qnorm(q))
    p["last_q"] = q
    cid, kc = kind_cid
    if cid and kc in ("idea", "why", "example"):
        p["asks"][cid][kc] += 1
    if cid:
        p["target"] = cid
    return reply
