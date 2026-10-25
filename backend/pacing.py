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

BACKSTOP_LINES = ["that's all i've got so far. wanna see what i learned?", "i think i've hit my limit. quiz me and see?"]
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
                    r"tells you|names the|so that")
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
            "asks": {c["id"]: {"idea": 0, "why": 0, "example": 0, "try": 0, "predict": 0, "concrete": 0, "connect": 0} for c in a["concepts"]},
            "vague": {c["id"]: 0 for c in a["concepts"]},
            "nudged": {c["id"]: False for c in a["concepts"]},
            "qlog": [], "target": None, "last_q": "", "texts": 0, "all_texts": 0, "turns": 0, "post_ready": 0}


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
    if not p.get("prior_done"):  # what Pip already knows from its own opening claim is credited at the start
        les = a.get("lesson") or {}
        for cid in L.prior_ids(les):
            if cid in p["cov"]:
                p["cov"][cid].update(idea=True, reason=True, example=True, wrong=False)
                session["ladder"][cid].update(done=True, best_level=max(2, session["ladder"][cid].get("best_level", 0)))
                if "meters" in session:
                    session["meters"][cid] = 100  # Pip already knows it: the bar is full from the start
        p["prior_done"] = True
    return p


def reset_concept(session: dict, a: dict, cid: str) -> None:
    p = ensure_pace(session, a)
    p["cov"][cid] = {"idea": False, "reason": False, "example": False, "wrong": False}
    p["asks"][cid] = {"idea": 0, "why": 0, "example": 0, "try": 0, "predict": 0, "concrete": 0, "connect": 0}
    p["vague"][cid], p["nudged"][cid] = 0, False
    session["ladder"][cid].update(stuck=False, done=False)
    session["ready_for_quiz"] = False


def is_fractions(a: dict) -> bool:
    return a.get("id") == "a_frac" or "fraction" in a.get("topic", "").lower()


def covered(c: dict) -> bool:
    """idea + (a reason, an example, or a full-sentence statement of it: kids explain by stating the relation)."""
    return c["idea"] and (c["reason"] or c["example"] or c.get("solid", False)) and not c["wrong"]


def kind_of(les: dict | None, cid: str) -> str:
    """How Pip treats a concept, from its explain_level: given -> never asked; why -> reason drawn out with
    concrete cases; use -> applied, never 'why does it work' (the old `kind` field is only a fallback)."""
    spec = (L.lc(les, cid) if les else None) or {}
    if spec.get("explain_level") or cid in ((les or {}).get("prior_knowledge") or []):
        return {"given": "given", "why": "reason", "use": "procedure"}[L.level_of(les, cid)]
    return spec.get("kind") or "reason"


def explained(c: dict, kind: str = "reason") -> bool:
    """Reasons need a reason; conventions and procedures are explained by an applied example."""
    if kind == "given":
        return True
    if kind == "reason":
        return c["idea"] and (c["reason"] or c.get("solid", False)) and not c["wrong"]
    return c["idea"] and (c["example"] or c["reason"] or c.get("solid", False)) and not c["wrong"]


# ---------------------------------------------------------------- question bank

def one_question(text: str) -> str:
    """Cut a rung down to its first question (statements before it are kept)."""
    i = text.find("?")
    return text if i < 0 else text[:i + 1].strip()


def rung_kind(text: str) -> str:
    """idea (open), why, example (walk one through), try (a new case with numbers), predict (Pip guesses and
    gets corrected), infer (Pip's old rule applied literally)."""
    t = norm(text)
    if re.search(r"why is that wrong|why is my|why am i wrong", t):
        return "idea"  # the opener: asks what is wrong with Pip's own rule
    if re.search(r"\b(so )?(it'?s|that'?s|this is|is it|are they|that is) (kinda |just |basically )?like\b|"
                 r"\bsame (as|thing as)\b", t) and "?" in text:
        return "connect"
    if re.search(r"what if i (cut|fold|flip|draw|put|stick|slice|split|tear|cover|try to|read|say|want|have|take|remove|plug|swap|add)|"
                 r"^picture |^imagine ", t):
        return "concrete"
    if re.search(r"i.?ll guess|i.?d guess|i bet|my guess|my rule says", t):
        return "predict"
    if re.search(r"show me|example|try one|your own|a small|walk me|walk through|count them|tricky|sort ", t):
        return "example"
    if re.search(r"\bwhy\b|what does the .* mean|what makes", t):
        return "why"
    if re.search(r"\d", t) and re.search(r"\bif\b|what about|what if|bigger|smaller|\bis a\b|does a|would|can i make|"
                                         r"fill|cover|still", t):
        return "try"
    return "idea"


def as_question(r: str) -> str:
    """A contrast case ("... that's what my rule says.") becomes Pip's literal over-reading, asked as a check."""
    r = r.strip()
    if "?" in r:
        return one_question(r)
    r = re.sub(r"[\s,.]*(and )?that.?s what my rule says\.?$", "", r, flags=re.I).rstrip(" .,")
    return r + ", right?"


def qnorm(q: str) -> str:
    return re.sub(r"[^a-z0-9 ]", "", norm(q)).strip()


KIND_GENERIC = {"convention": ["When would I use that one?", "Can you give me a tricky one to sort?"],
                "procedure": ["Can you walk me through one example?", "Can you do one while I watch?"]}
GENERIC = {"idea": ["what do you notice first?", "where would i even start?", "what's the first thing i'd do?"],
           "why": ["hm, what makes it work like that?", "what makes you say that?"],
           "example": ["can you try one with numbers so i can see?", "can you give me one i can picture?"],
           "try": ["would it work on a different one too?", "what if i tried it on a bigger one?"],
           "predict": ["i'd guess it's the other way, am i wrong?"]}


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
    if ladder[cid]["stuck"] or kind == "given":
        return True
    if kind != "reason":  # convention / procedure: an applied example closes it; never ask why
        return explained(c, kind)
    if c["idea"] and c["reason"] and not c["wrong"]:
        return True
    if c["idea"] and c["example"] and (asks["why"] + asks["try"] + asks["concrete"] + asks.get("connect", 0)) >= 1 and not c["wrong"]:
        return True
    return False


def pick_one(session: dict, a: dict) -> str | None:
    """A 'more or less' question built from the kid's own number (else the number in Pip's own claim)."""
    said = " ".join(m["text"] for m in session["transcript"] if m["from"] == "student")
    nums = re.findall(r"\b\d+(?:\.\d+)?\b", said) or re.findall(r"\b\d+(?:\.\d+)?\b", a.get("misconception", ""))
    return f"is it more than {nums[-1]} or less?" if nums else None


def arc_order(les: dict | None, a: dict) -> list[str]:
    """Default concept order: the lesson's bottom-up `arc` (what the kid owns first), else concept order."""
    ids = [c["id"] for c in a["concepts"]]
    arc = [x for x in ((les or {}).get("arc") or []) if x in ids]
    return arc + [x for x in ids if x not in arc]


def next_question(session: dict, a: dict, les: dict, focus: str | None = None, infer: bool = False):
    """(question, cid, kind) for the most useful thing not yet given, or None when nothing is left to ask.
    Moves, best first: try the idea on a new case / predict-then-check, then wonder, then press for reasoning
    (once, soft), then a worked example."""
    p = ensure_pace(session, a)
    order = [cid for cid in arc_order(les, a) if L.lc(les, cid)
             and not closed(p, session["ladder"], cid, kind_of(les, cid))]
    if focus in order:
        order.remove(focus)
        order.insert(0, focus)
    used = set(p["qlog"])
    weak = p.get("weak", 0) >= 1
    for cid in order:
        c, asks = p["cov"][cid], p["asks"][cid]
        ck = kind_of(les, cid)
        spec = L.lc(les, cid)
        rungs = [as_question(r) if "my rule says" in r.lower() else one_question(r)
                 for r in list(spec["probe_ladder"]) + list(spec.get("concrete") or [])]
        conns = [x for x in (spec.get("connections") or []) if qnorm(x) not in used]
        has = {rung_kind(r) for r in rungs if qnorm(r) not in used and "?" in r}
        if conns:
            has.add("connect")
        if ck == "convention":
            if not c["idea"] or c["wrong"]:
                kind = "idea"
            elif not c["example"] and asks["example"] < 1:
                kind = "example"
            else:
                continue
        elif ck == "procedure":
            if not c["idea"] or c["wrong"]:
                kind = "idea"
            elif not c["example"] and asks["connect"] < 1 and conns:
                kind = "connect"
            elif not c["example"] and asks["concrete"] < 1 and "concrete" in has:
                kind = "concrete"
            elif not c["example"] and asks["predict"] < 1 and "predict" in has:
                kind = "predict"
            elif not c["example"] and asks["try"] < 1 and "try" in has:
                kind = "try"
            elif not c["example"] and asks["example"] < 1:
                kind = "example"
            else:
                continue
        elif c["wrong"]:
            kind = "idea" if not c["reason"] and asks["why"] < 1 else "why"
        elif not c["idea"]:
            # with something already on the table, a picture or action draws the idea out better than "what do you notice"
            kind = "concrete" if (any(x["idea"] for x in p["cov"].values()) and asks["concrete"] < 1
                                  and "concrete" in has) else "idea"
        elif not c["reason"] and asks["connect"] < 1 and conns:
            kind = "connect"  # a friend checking they got it: "so it's like cutting a pizza box corner to corner?"
        elif not c["reason"] and asks["concrete"] < 1 and "concrete" in has:
            kind = "concrete"
        elif not c["reason"] and asks["try"] < 1 and "try" in has:
            kind = "try"
        elif not c["reason"] and asks["predict"] < 1 and "predict" in has:
            kind = "predict"
        elif not c["reason"] and asks["why"] < 1:
            kind = "why"
        elif not c["reason"] and not c["example"] and asks["example"] < 1 \
                and not any(x["example"] for x in p["cov"].values()):  # the kid already showed numbers somewhere
            kind = "example"
        else:
            continue
        anything = any(x["idea"] for x in p["cov"].values())
        if kind == "connect" and conns:
            return conns[0], cid, "connect"
        if weak and conns and c["idea"] and asks["connect"] < 1:
            return conns[0], cid, "connect"  # a yes/no that states the idea is the easiest thing to answer
        if weak:  # yes/no or pick-one only: guesses to correct, cases with numbers; never an open why / "what do you notice"
            for want in ("concrete", "predict", "try"):  # a picture or action pulls content out of a kid who says idk
                for r in rungs:
                    if rung_kind(r) == want and qnorm(r) not in used and "?" in r and not re.search(r"why is that wrong", r.lower()):
                        return r, cid, want
            pick = pick_one(session, a)
            if pick and qnorm(pick) not in used:
                return pick, cid, "try"
        for r in rungs:
            if rung_kind(r) == kind and qnorm(r) not in used and "?" in r:
                if anything and re.search(r"why is that wrong|why is my", r.lower()):
                    continue  # the argument opener only makes sense before the kid has said anything
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
MISSION_IDEAS: dict = {}  # per-mission keyword tables now live in the lessons (`idea_patterns`)


def _frac_eq(t: str) -> bool:
    return bool(re.search(r"\d+/\d+\s*(\+|=|is|becomes)\s*\d+/\d+", t))


INFORMAL = [(r"\bb/?c\b|\bbcuz\b|\bbecuz\b|\bcos\b|\bcoz\b|\bcuz\b|\bcause\b", "because"),
            (r"\bu\b", "you"), (r"\bur\b", "your"), (r"\bya\b|\byea\b|\byeh\b", "yes"),
            (r"\bthru\b", "through"), (r"\bw/\b", "with"), (r"\bwhats\b", "what is"), (r"\bgotta\b", "have to")]


AFFIRM = re.compile(r"^\W*(yes|yeah|yea|ya|yep|yup|yess+|exactly|right|correct|true|sure|thats? it|that'?s it|"
                    r"kinda|basically|pretty much|mhm|uh huh|ok yes|oh yeah)\b", re.I)
AUTHORITY = re.compile(r"\b(that'?s|thats|it'?s|its|it is|that is)\s+(just\s+)?(the|a)\s+(theorem|law|rule|formula|definition|"
                       r"equation)\b|\bthe (theorem|law|formula)\b|\bnewton'?s\b|\bpythag\w*|because\s+(it'?s|that'?s)\s+"
                       r"(the|a)\s+(law|theorem|rule|formula)", re.I)


def informal(t: str) -> str:
    """Texting shorthand -> plain words, so 'bc 2 triangles make a rect' reads like 'because ...'."""
    for pat, rep_ in INFORMAL:
        t = re.sub(pat, rep_, t)
    return t


def judge(text: str, a: dict, les: dict | None, session: dict) -> dict:
    """What this one text establishes, per concept, plus the student's move. Heuristic, deterministic."""
    t = informal(norm(text))
    # "ur so dumb" must not read as a reason ("so"); judge the rest of the sentence
    t_ins = t
    t = re.sub(r"\b(you|your|ur|youre|you're)\s*(are|r|re)?\s*(so|very|really|just)?\s*(dumb|stupid|an? idiot|a loser|a moron)\w*",
               " ", t)
    t = INSULT_WORDS.sub(" ", t).strip() or t
    p = ensure_pace(session, a)
    f = empty_flags(a)
    ids = [c["id"] for c in a["concepts"]]
    words = len(t.split())
    nonreason = bool(NONREASON.search(t))
    reasonish = (bool(STRONG.search(t)) or (bool(REASON.search(t)) and "?" not in text)) \
        and not nonreason and words >= 4  # a hedging "?" does not cancel an explicit "because"
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
        for cid in ids:  # lesson-authored phrasing of each idea (kids say it many ways)
            for pat in (L.lc(les, cid) or {}).get("idea_patterns", []) if les else []:
                try:
                    if re.search(pat, t2):
                        f[cid]["idea"] = True
                        break
                except re.error:
                    pass
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
            if any(L.lc(les, c).get("idea_patterns") for c in ids if L.lc(les, c)) if les else False:
                break  # the lesson says how its ideas are phrased: no loose stem guessing
            if words >= 3 and (sc >= 2.0 or (cid == top and sc >= 1.0 and sc > second)):
                f[cid]["idea"] = True
        mis = stems(a.get("misconception", ""))
        neg = re.search(r"\b(not|never|don.?t|can.?t|isn.?t|no|wrong|shouldn.?t)\b", t)
        fixes = re.search(r"\bhalf\b|\u00bd|\u00f7|divid|over 2|opposite|undo|cancel|instead|actually|oh wait|switch", t)
        endorse = re.search(r"^(yes|yeah|yep)\b[^.?!]{0,15}\b(right|correct|true)\b(?!\s*(side|angle|triangle|hand))|"
                            r"that.?s (right|correct|true)\b|you.?re right|\byes it is\b", t) and not neg
        if ((len(mis & ts) >= 2 and re.search(r"\bjust\b|always|whenever|wherever|every", t))
                or (endorse and (len(mis & ts) >= 1 or set(re.findall(r"\d+", a.get('misconception', ''))) & set(re.findall(r"\d+", t))))) \
                and not neg and not (fixes and not endorse):
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
    auth_used = False
    if AUTHORITY.search(t) or AUTHORITY.search(text) or (nonreason and tgt and L.level_of(les, tgt) == "use"):
        # "that's the theorem / it's a law / thats just the rule" is the full reason for a `use` concept
        for cid in ids:
            if L.level_of(les, cid) == "use" and (f[cid]["idea"] or cid == tgt) and not wrong_cid:
                f[cid]["reason"] = True
                f[cid]["idea"] = f[cid]["idea"] or bool(cid == tgt and p["cov"][cid]["idea"])
                auth_used = True
    interest = ""
    return {"flags": f, "refusal": bool(REFUSE.search(t)), "insult": bool(INSULT.search(t_ins)),
            "pointless": bool(POINTLESS.search(t)), "idk": bool(IDK.search(t)),
            "nonreason": nonreason and not auth_used, "wrong_cid": wrong_cid,
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


LEAD = re.compile(r"^(no+|nah|yeah|yes|yep|ok(ay)?|so|well|and|but|oh|wait|because|cuz|cause|like|then|just|duh|lol|"
                  r"bro|hmm+|uh+|um+|it|its|it's|thats|that's|you|need to|have to|has to|gotta|should|can)\b[\s,.!-]*",
                  re.I)
TAIL_FUNCTION = {"of", "the", "a", "an", "is", "to", "and", "or", "in", "on", "for", "with", "by", "times",
                 "are", "then", "so", "at", "as", "be", "you", "just", "your", "my", "its", "than"}
INSULT_WORDS = re.compile(r"\b(dumb|stupid|idiot|bitch|shit|fuck\w*|loser|moron)\b[\s,.!-]*", re.I)


def fragment(text: str, a: dict, les: dict | None, maxw: int = 5) -> str:
    """A few of the student's own words (never a sentence): the 3-5 word window with the most idea in it that
    starts and ends on a real word."""
    t = INSULT_WORDS.sub("", text)
    voc = vocab(a, les)
    keys = set().union(*[set(v) for v in voc.values()]) if voc else set()
    clauses = [c.strip() for c in re.split(r"[.;!?]|,\s|\s+and\s+|\s+but\s+|\s+which\s+", t) if len(c.strip().split()) >= 2]
    best, best_score = "", -1.0
    for cl in clauses:
        ws = cl.replace("?", "").split()
        for n in range(maxw, 2, -1):
            for i in range(0, max(1, len(ws) - n + 1)):
                win = ws[i:i + n]
                if len(win) < 3 and len(ws) >= 3:
                    continue
                lo = [w.lower().strip(",.") for w in win]
                if lo[0] in TAIL_FUNCTION or lo[-1] in TAIL_FUNCTION or LEAD.match(lo[0] + " ") \
                        or not re.search(r"[a-z0-9]", lo[0] + lo[-1]) or not re.search(r"[a-z0-9]", lo[-1]):
                    continue
                score = 2.0 * len(stems(" ".join(win)) & keys) + 1.5 * bool(re.search(r"\d", " ".join(win))) + n / 10
                if score > best_score:
                    best, best_score = " ".join(win), score
    if len(best.split()) >= 2:
        return best.strip(" ,.-").lower()
    m = re.search(r"\b\d+(\.\d+)?\b", text)
    return m.group(0) if m and len(text.split()) <= 6 else ""


REACT = {
    "reason": ["ohh ok, {f}.", "ahh, {f}. that makes sense.", "hm ok, {f}."],
    "example": ["ok, {f}. i can picture that.", "ok so {f}.", "oh, {f}."],
    "idea": ["ohh, {f}.", "hm, {f}. ok.", "oh wait, {f}."],
}


def react(text: str, a: dict, les: dict | None, judged: dict, cr: dict, p: dict) -> str:
    """Pip's short reaction: its own few words plus a fragment of what the kid actually said. Never the sentence."""
    gained = [(cid, g) for cid, g in cr["gained"].items() if any(g.values())]
    n = p["turns"]
    if gained:
        arc = arc_order(les, a)
        pool = [(c, x) for c, x in gained if x["reason"]] or gained
        cid, g = max(pool, key=lambda cx: arc.index(cx[0]) if cx[0] in arc else 0)  # the conclusion, last in the arc
        aha = (L.lc(les, cid) or {}).get("aha") if les else None
        if g["reason"] and aha:
            return aha if aha.rstrip()[-1:] in ".!?" else aha.rstrip() + "."
        kind = "reason" if g["reason"] else ("example" if g["example"] else "idea")
        f = fragment(text, a, les)
        if f:
            tpl = REACT[kind][n % len(REACT[kind])]
            return tpl.format(f=f)
        return {"reason": "ohh, that makes sense.", "example": "ok, i can picture that.",
                "idea": "hm ok, i see where that goes."}[kind]
    if judged.get("nonreason"):
        return "hm, ok."
    if text.strip().endswith("?") and not judged.get("content"):
        return ["hm, you tell me, i'm the confused one.", "i was hoping you'd tell me, honestly."][n % 2]
    if p.get("post_ready") is not None and judged.get("content") and p.get("texts", 0) >= 3:
        return ["ok, that tracks.", "mm, yeah, that fits.", "right, ok."][n % 3]
    if judged.get("content"):  # said something on topic that adds nothing new: still acknowledge it
        f = fragment(text, a, les)
        if f:
            return ["ok, {f}.", "mm, {f}.", "right, {f}."][n % 3].format(f=f)
    if not judged.get("idk") and not judged.get("refusal") and not judged.get("pointless"):
        f = fragment(text, a, les)  # off the ladder but still something the kid said: react to it
        if f:
            return ["hm, {f}.", "ok, {f}.", "mm, {f}."][n % 3].format(f=f)
    return ["hm, ok.", "ok, no worries.", "ok."][n % 3]


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
    pc = p.get("pending_conn")
    if pc and pc in ids and not judged["wrong_cid"] and AFFIRM.search(norm(text)) and len(norm(text).split()) <= 8 \
            and not re.search(r"\bno\b|\bnot\b|\bnope\b|\bnah\b", norm(text)):
        # "yeah": the kid confirmed a friend-style connection that carries the idea -> credit it
        f_ = judged["flags"][pc]
        lvl_ = L.level_of(les, pc)
        judged["flags"][pc] = {**f_, "idea": True, "reason": f_["reason"] or lvl_ == "why",
                               "example": f_["example"] or lvl_ == "use"}
        judged["content"] = True
    p["pending_conn"] = None
    answered_case = p.get("last_kind") in ("concrete", "try")  # Pip asked for a picture or a new case
    for cid in ids:
        new, cov = judged["flags"][cid], p["cov"][cid]
        if answered_case and new["idea"] and not new["wrong"]:
            new = {**new, "example": True}  # saying what the picture shows IS the worked case: credit it
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
        if new["idea"]:
            cov["mentions"] = cov.get("mentions", 0) + 1
        if new["idea"] and (len(text.split()) >= 7 or cov.get("mentions", 0) >= 2) and not cov.get("solid"):
            cov["solid"] = True  # said as a full sentence, or in two separate texts: not a stray fragment
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
            if explained({**cov, "solid": False}, ck):  # a bare claim is not a reason: no free weapon
                delta = max(delta, EXPLAINED_FLOOR - session["meters"].get(cid, 0))
            progress.append({"concept_id": cid, "delta": max(0, min(60, delta))})
            lad = session["ladder"][cid]
            lad["best_level"] = max(lad["best_level"], lvl)
        if covered(cov):
            session["ladder"][cid]["done"] = True
    if judged["content"]:
        p["texts"] += 1
    # a kid who answers in 1-3 words with nothing on topic ("idk", "ok", "sure") cannot take an open question
    p["weak"] = p.get("weak", 0) + 1 if (len(norm(text).split()) <= 3 and not judged["content"]
                                         and p.get("last_kind") in ("idea", "why", "example", "concrete", None)) else 0
    top = max(levels.values(), default=0)
    event = "heal" if wrong_cid else ("hit" if top >= 2 else "none")
    any_gain = any(any(g.values()) for g in gained.values())
    # vague bookkeeping on the concept Pip was asking about: only misses/wrong answers on THAT concept count
    esc, tgt = None, p["target"]
    answered = p.get("last_kind") in ("predict", "try") and not judged.get("idk") and not judged.get("nonreason") \
        and len(norm(text).split()) >= 1
    if tgt and not judged["refusal"] and not any_gain and answered:
        pass  # answering Pip's guess or new-case question is engagement, not a miss
    elif tgt and not judged["refusal"] and not any_gain and not covered(p["cov"][tgt]) \
            and not session.get("ready_for_quiz"):
        p["vague"][tgt] += 1
        spec = L.lc(les, tgt) if les else None
        if p["vague"][tgt] >= 4 and p["nudged"][tgt] or (p["vague"][tgt] >= 5):
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
    # honest: every concept credited (a wrong rule the student taught counts: the quiz will show it). Only after a
    # long session with something taught does Pip offer the quiz anyway, and then it says so.
    all_ok = all(covered(p["cov"][c]) or p["cov"][c]["wrong"] or session["ladder"][c]["stuck"] for c in ids)
    backstop = (not all_ok) and p["all_texts"] >= 8 and n_idea >= 1
    strict_ok = all(c_["reason"] or c_["example"] or c_["wrong"] for c_ in (p["cov"][c] for c in ids))
    ready = was_ready or (all_ok and (p["all_texts"] >= 2 or strict_ok)) or backstop
    if rt:
        ready = covered(p["cov"][rt]) or session["ladder"][rt]["stuck"] or was_ready
    return {"progress": progress, "level": top, "levels": levels, "event": event,
            "strength": "critical" if top >= 3 else "solid", "wrong_cid": wrong_cid, "gained": gained,
            "any_gain": any_gain, "esc": esc, "ready": ready, "newly_ready": ready and not was_ready,
            "backstop": backstop,
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
    """Enforce the pacing rules on a draft reply (model-written or templated) and update the ask log.
    A reply is: a short reaction, then at most one question (sometimes none once Pip is ready)."""
    p = ensure_pace(session, a)
    m = re.match(r"(Saving that: '.*?'\.)(?=\s|$)", draft)  # the filed quote is one atomic statement
    saving = m.group(1) if m else None
    stm, q = split_reply(draft[m.end():].strip() if m else draft)
    if stm and stm[0].lower().startswith("noted") and any(any(g.values()) for g in cr["gained"].values()):
        stm = stm[1:]  # "Noted." is only for texts with nothing on topic; here the kid did say something
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
        p["target"] = tgt  # last_q stays the real question: a parked topic should re-ask that, not the story
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
                          (cid and p["asks"][cid]["why"] >= 1))))  # repeats are caught by the question log
        if qnorm(q) in p["qlog"] or not applicable:
            q = None
        else:
            kind_cid = (cid, kc)
    if q is None and nq and not (cr["ready"] and cr["was_ready"]):
        q, kind_cid = nq[0], (nq[1], nq[2])
    if sl and not (cr["ready"] and (cr["newly_ready"] or cr["was_ready"])):
        q, kind_cid = sl, (None, None)
    ready_line = next((r for r in (BACKSTOP_LINES if cr.get("backstop") else READY_LINES)
                       if qnorm(r) not in p["qlog"]), READY_LINES[-1])
    if cr["ready"]:
        session["ready_for_quiz"] = True
        if cr["newly_ready"]:
            q, kind_cid = ready_line, (None, None)  # the reaction stays; then say so and stop probing
        elif cr["was_ready"]:
            p["post_ready"] += 1  # already ready: react, and only now and then re-offer the quiz
            q, kind_cid = (ready_line, (None, None)) if p["post_ready"] % 3 == 0 else (None, (None, None))
            if q is None and not stm:
                stm = ["ok, got it."]
        elif q is None:
            q, kind_cid = ready_line, (None, None)
    elif q is None:
        q, kind_cid = ready_line, (None, None)
        session["ready_for_quiz"] = True
    stm = stm[:1]
    if stm and q and stm[0].lower().startswith("hm") and q.lower().startswith("hm"):
        q = re.sub(r"^[Hh]m+,?\s*", "", q)
    if stm and (q or "x")[:1].islower() and not stm[0].startswith(("Saving that", "Wait", "Noted", "Fair")):
        stm[0] = stm[0][:1].lower() + stm[0][1:]  # mirror the authored lowercase register
    if stm and q and len((stm[0] + " " + q).split()) > 22 and not stm[0].startswith(("Saving that", "wait,", "Wait,")):
        stm = []  # keep replies short: the question alone is enough
    orig_q = q
    if q and len(q.split()) > 24 and q.count(". ") >= 1:
        q = re.split(r"(?<=[.!])\s+", q)[-1]  # a rung's long set-up: ask just the last sentence
    reply = " ".join(stm + ([q] if q else []))
    if cr["esc"] == "stuck":
        reply = f"{HOLD} {q}" if q else HOLD
    sl_said = norm(said)
    for cid_ in [c["id"] for c in a["concepts"]]:  # spoiler guard: Pip must not say it first
        sibs = (L.lc(les, cid_) or {}).get("spoilers", [])
        if any(re.sub(r"\s+", "", norm(x)) in re.sub(r"\s+", "", norm(said)) for x in sibs):
            continue  # the student used this idea's words: Pip may say it back
        for sp in sibs:
            flat = lambda x: re.sub(r"\s+", "", norm(x))  # noqa: E731  ("2x = 14" == "2x=14")
            if flat(sp) and flat(sp) in flat(reply) and flat(sp) not in flat(said):
                reply = q or "ok."
    if q:
        p["qlog"].append(qnorm(q))
        if orig_q and orig_q != q:
            p["qlog"].append(qnorm(orig_q))
        p["last_q"] = q
    cid, kc = kind_cid
    p["last_kind"] = kc
    if cid and kc in ("idea", "why", "example", "try", "predict", "concrete", "connect"):
        p["asks"][cid][kc] += 1
    p["pending_conn"] = cid if (cid and kc == "connect") else None
    if cid:
        p["target"] = cid
    return reply
