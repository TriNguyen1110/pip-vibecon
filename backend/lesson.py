"""Lesson specs (CONTRACT v3): loading, probe-ladder state machine, guards. Pure functions, no I/O
except reading seed/lessons/*.json."""

import json
import logging
import os
import re
from pathlib import Path

from logic import new_ladder, norm

log = logging.getLogger("pip.lesson")

LEVEL_DELTA = {0: 0, 1: 5, 2: 25, 3: 40}
OOS_LINE = "Not in my brain yet."
WRAP = "That's all my questions for now. Quiz me whenever you're ready."
HOLD = "Okay, I'll hold onto that one."


# ---------------------------------------------------------------- loading

def lessons_dir() -> Path:
    return Path(os.environ.get("PIP_LESSONS_DIR") or Path(__file__).parent / "seed" / "lessons")


def _strs(v) -> list[str]:
    return [str(x).strip() for x in (v or []) if str(x).strip()] if isinstance(v, list) else []


def normalize_lesson(raw) -> dict | None:
    """Tolerant normalizer; returns None when there is nothing usable. Unknown keys are kept."""
    if not isinstance(raw, dict) or not isinstance(raw.get("concepts"), list):
        return None
    cs = []
    for c in raw["concepts"]:
        if not isinstance(c, dict) or not c.get("concept_id"):
            continue
        cs.append({**c, "concept_id": str(c["concept_id"]), "look_fors": _strs(c.get("look_fors")),
                   "probe_ladder": _strs(c.get("probe_ladder")), "spoilers": _strs(c.get("spoilers")),
                   "friend_nudge": str(c.get("friend_nudge") or "").strip()})
    if not cs:
        return None
    return {**raw, "standard": str(raw.get("standard") or ""), "source": str(raw.get("source") or ""),
            "attribution": str(raw.get("attribution") or ""), "in_scope": _strs(raw.get("in_scope")),
            "out_of_scope": _strs(raw.get("out_of_scope")), "concepts": cs}


def load_lesson(assignment_id: str) -> dict | None:
    p = lessons_dir() / f"{assignment_id}.json"
    try:
        return normalize_lesson(json.loads(p.read_text())) if p.exists() else None
    except (OSError, ValueError):
        log.exception("bad lesson file %s", p)
        return None


def load_extra_assignments() -> list[dict]:
    """seed/lessons/*.assignment.json: extra seeded missions (lesson may be embedded)."""
    out = []
    d = lessons_dir()
    for p in sorted(d.glob("*.assignment.json")) if d.exists() else []:
        try:
            raw = json.loads(p.read_text())
            if isinstance(raw, dict) and raw.get("id") and isinstance(raw.get("concepts"), list):
                out.append(raw)
        except (OSError, ValueError):
            log.exception("bad assignment file %s", p)
    return out


def lesson_of(a: dict) -> dict | None:
    """The usable lesson of an assignment (at least one concept with a probe ladder), else None."""
    les = normalize_lesson(a.get("lesson"))
    if les and any(c["probe_ladder"] for c in les["concepts"]):
        return les
    return None


def lc(lesson: dict, cid: str) -> dict | None:
    return next((c for c in lesson["concepts"] if c["concept_id"] == cid and c["probe_ladder"]), None)


_STOP = {"about", "after", "again", "being", "brand", "could", "every", "first", "other", "plain", "shown",
         "their", "there", "these", "thing", "those", "using", "where", "which", "while", "words", "would",
         "means", "works", "example", "examples", "problem", "problems"}


def _phrase(txt: str, n: int = 7) -> str:
    head = txt.strip().rstrip(".?").split(",")[0]
    return " ".join(head.split()[:n]).lower()


def offline_lesson(concepts: list[dict], topic: str) -> dict:
    """Generic lesson used when no AI is available (drafts offline)."""
    t = topic.rstrip(".")
    topic_words = set(re.findall(r"[a-z]{4,}", t.lower()))
    cs = []
    for c in concepts:
        txt = c["text"].rstrip(".")
        nouns = []
        for w in re.findall(r"[A-Za-z]{5,}", txt):
            w = w.lower()
            if w not in _STOP and w not in topic_words and w not in nouns:
                nouns.append(w)
        cs.append({
            "concept_id": c["id"],
            "look_fors": [f"Says in their own words: {_phrase(txt)}",
                          "Gives a reason (because...), not just steps",
                          "Shows it on one small example they chose"],
            "probe_ladder": [
                f"Can you tell me in your own words what part of {t.lower()} this is about?",
                "Why is that true? Like, what would go wrong if it wasn't?",
                "Can you show me with a small example?",
                "What would you do if the numbers or words were different?"],
            "spoilers": nouns[:4],
            "friend_nudge": f"A friend of mine said to think about why it matters before doing any steps "
                            f"({_phrase(txt, 5)}). Does that help?"})
    return {"standard": f"Tutor-drafted: {t}", "source": "Drafted offline (generic)", "attribution": "",
            "in_scope": [t], "out_of_scope": [], "concepts": cs}


def fit_lesson(raw: dict | None, concepts: list[dict], topic: str) -> dict:
    """Align an AI-drafted lesson to the 3 concepts by position; pad ladders to exactly 4 rungs."""
    base = offline_lesson(concepts, topic)
    if not isinstance(raw, dict):
        return base
    raw_cs = raw.get("concepts") if isinstance(raw.get("concepts"), list) else []
    cs = []
    for i, c in enumerate(concepts):
        r = raw_cs[i] if i < len(raw_cs) and isinstance(raw_cs[i], dict) else {}
        d = base["concepts"][i]
        ladder = _strs(r.get("probe_ladder"))[:4]
        ladder += d["probe_ladder"][len(ladder):]
        cs.append({"concept_id": c["id"], "look_fors": _strs(r.get("look_fors")) or d["look_fors"],
                   "probe_ladder": ladder, "spoilers": _strs(r.get("spoilers")),
                   "friend_nudge": str(r.get("friend_nudge") or "").strip() or d["friend_nudge"]})
    return {"standard": str(raw.get("standard") or base["standard"]), "source": "AI-drafted for tutor review",
            "attribution": "", "in_scope": _strs(raw.get("in_scope")) or base["in_scope"],
            "out_of_scope": _strs(raw.get("out_of_scope")), "concepts": cs}


# ---------------------------------------------------------------- topic family (past-self)

FAMILIES = [("fractions", ("fraction", "numerator", "denominator")),
            ("commas", ("comma", "run-on", "run on", "fused sentence")),
            ("linear", ("linear", "slope", "y = mx", "line equation"))]


def topic_family(a: dict) -> str:
    if a.get("topic_family"):
        return str(a["topic_family"]).lower()
    t = (a.get("topic") or "").lower()
    for name, kws in FAMILIES:
        if any(k in t for k in kws):
            return name
    ws = re.findall(r"[a-z]{5,}", t)
    return ws[0][:5] if ws else t


# ---------------------------------------------------------------- ladder state

def ensure_ladder(session: dict, a: dict) -> dict:
    lad = session.setdefault("ladder", {})
    for cid, v in new_ladder(a).items():
        lad.setdefault(cid, v)
    return lad


def current_concept(session: dict, a: dict, lesson: dict) -> str | None:
    lad = ensure_ladder(session, a)
    rt = session.get("reteach_concept")
    if rt and lc(lesson, rt):
        s = lad[rt]
        return None if s["done"] or s["stuck"] else rt
    for c in a["concepts"]:
        s = lad[c["id"]]
        if lc(lesson, c["id"]) and not (s["done"] or s["stuck"]):
            return c["id"]
    return None


def reset_concept(session: dict, cid: str) -> None:
    lad = session.get("ladder") or {}
    if cid in lad:
        lad[cid].update(rung=0, nudged=False, stuck=False, done=False)


def plan(session: dict, a: dict, lesson: dict) -> dict:
    """What Pip does next, before the student's message is scored."""
    cid = current_concept(session, a, lesson)
    out = {"cid": cid, "stage": "none", "rung": None, "last_rung": None, "nudge": "", "next_cid": None,
           "next_rung0": None, "spoilers": []}
    if cid is None:
        return out
    lad = session["ladder"]
    spec = lc(lesson, cid)
    ladder, st = spec["probe_ladder"], lad[cid]
    out["stage"] = "moveon" if st["nudged"] else ("nudge" if st["rung"] >= len(ladder) else "probe")
    out["rung"] = ladder[st["rung"]] if out["stage"] == "probe" else None
    out["last_rung"] = ladder[min(max(st["rung"] - 1, 0), len(ladder) - 1)]
    out["nudge"] = spec["friend_nudge"]
    out["spoilers"] = spec["spoilers"]
    if not session.get("reteach_concept"):
        for c in a["concepts"]:
            if c["id"] != cid and lc(lesson, c["id"]) and not (lad[c["id"]]["done"] or lad[c["id"]]["stuck"]):
                out["next_cid"] = c["id"]
                out["next_rung0"] = lc(lesson, c["id"])["probe_ladder"][0]
                break
    return out


def nudge_reply(nudge: str) -> str:
    n = nudge.strip()
    return n if n.endswith("?") else n.rstrip(".") + ". Want to try again?"


def advance(session: dict, lesson: dict, p: dict, scored_cid: str | None, level: int, reply: str,
            said: str = "") -> str:
    """Apply the scored turn to the ladder state and return the final Pip reply (server-owned
    rung / nudge / move-on text, spoiler guard)."""
    cid = p["cid"]
    if cid is None:
        return reply
    lad = session["ladder"]
    if scored_cid in lad:
        lad[scored_cid]["best_level"] = max(lad[scored_cid]["best_level"], level)
        if level >= 2:
            lad[scored_cid]["done"] = True
    st = lad[cid]
    spoilers = list(p["spoilers"])
    if st["done"]:  # the current concept was explained at level 2+: move to the next one
        nxt = p["next_cid"]
        if nxt:
            lad[nxt]["rung"] = max(lad[nxt]["rung"], 1)
            spoilers += lc(lesson, nxt)["spoilers"]
        target = p["next_rung0"] or WRAP
        return guard_spoilers(reply, spoilers, target, said)
    if p["stage"] == "probe":
        st["rung"] += 1
        return guard_spoilers(reply, spoilers, p["rung"], said)
    if p["stage"] == "nudge":
        st["nudged"] = True
        return nudge_reply(p["nudge"])
    st["stuck"] = True  # moveon: still below level 2 after the nudge
    nxt = p["next_cid"]
    if nxt:
        lad[nxt]["rung"] = max(lad[nxt]["rung"], 1)
        return f"{HOLD} {p['next_rung0']}"
    return f"{HOLD} {WRAP}"


# ---------------------------------------------------------------- guards

def guard_spoilers(reply: str, spoilers: list[str], replacement: str, said: str = "") -> str:
    """Replace the whole reply with the next rung when it contains a spoiler string (case-insensitive).
    A spoiler the student already said themselves is not a leak and is allowed."""
    rl, sl = norm(reply), norm(said)
    for s in spoilers:
        n = norm(s)
        if n and n in rl and n not in sl:
            return replacement
    return reply


_TEACHER = re.compile(r"^\s*(correct|exactly|right|that'?s right|great job|good job|nice job|well done|"
                      r"awesome|perfect|excellent)\s*[.,:;-]+\s*", re.I)


def friend_voice(reply: str) -> str:
    """Server-side voice guard: no '!', no 'Correct!'-style openers."""
    r = reply.replace("!", ".")
    for _ in range(2):
        r = _TEACHER.sub("", r)
    r = re.sub(r"\.{2,}(?!\.)", ".", r).strip()
    return r


_OOS_SPLIT = re.compile(r"\s*,\s*|/|\s+and\s+|\s+or\s+|\s+like\s+")
_OOS_SKIP = {"sat", "next", "the", "mission"}


def oos_terms(term: str) -> list[str]:
    """Matchable phrases of an out_of_scope entry: its pieces and its parenthetical topics."""
    paren = re.findall(r"\(([^)]*)\)", term)
    out = []
    for chunk in [re.sub(r"\([^)]*\)", " ", term)] + [p for p in paren
                                                          if not re.search(r"mission|skill|next", p, re.I)]:
        for piece in _OOS_SPLIT.split(chunk.lower()):
            piece = piece.strip(" .")
            if len(piece) >= 4 and piece not in _OOS_SKIP:
                out.append(piece)
    return out


def find_oos(lesson: dict, text: str) -> str | None:
    t = norm(text)
    for term in lesson.get("out_of_scope", []):
        for piece in oos_terms(term):
            if re.search(rf"(?<![a-z0-9]){re.escape(piece)}(?![a-z0-9])", t):
                return term
    return None


def register_hint(texts: list[str]) -> str:
    """Length and case only; never slang."""
    recent = [t for t in texts[-3:] if t.strip()]
    if not recent:
        return "unknown yet: keep replies short"
    words = sum(len(t.split()) for t in recent) / len(recent)
    letters = [c for t in recent for c in t if c.isalpha()]
    lower = bool(letters) and sum(c.isupper() for c in letters) / len(letters) < 0.03
    length = "very short" if words <= 6 else "short" if words <= 15 else "longer"
    punct = "little punctuation" if sum(t.count(",") + t.count(".") for t in recent) <= len(recent) else "normal punctuation"
    return f"{length} messages (about {round(words)} words), {'all lowercase' if lower else 'normal capitalization'}, {punct}"
