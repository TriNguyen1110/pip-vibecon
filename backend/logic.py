"""State rules: pure functions over session documents. No I/O."""

import re
import uuid
from datetime import datetime, timezone

HP_HIT = {"light": 15, "solid": 25, "critical": 40}
HEAL = 20
HP_FLOOR = 5
UNLOCK_AT = 60


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}"


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").lower()).strip()


def is_substring(quote: str, text: str) -> bool:
    return bool(norm(quote)) and norm(quote) in norm(text)


def student_messages(session: dict) -> list[str]:
    return [m["text"] for m in session["transcript"] if m["from"] == "student"]


def clamp(n, lo=0, hi=100):
    return max(lo, min(hi, int(n)))


def concept_ids(assignment: dict) -> list[str]:
    return [c["id"] for c in assignment["concepts"]]


def short_name(assignment: dict, concept_id: str) -> str:
    """A few words for a concept, used in summaries and plain-words lines."""
    names = {"a_frac": {"k1": "same-size pieces", "k2": "common denominators",
                        "k3": "adding the numerators"}}
    if concept_id in names.get(assignment.get("id"), {}):
        return names[assignment["id"]][concept_id]
    c = next((c for c in assignment["concepts"] if c["id"] == concept_id), None)
    return " ".join(c["text"].lower().rstrip(".").split()[:6]) if c else concept_id


def new_ladder(assignment: dict) -> dict:
    return {c["id"]: {"rung": 0, "nudged": False, "stuck": False, "done": False, "best_level": 0}
            for c in assignment["concepts"]}


def new_session(assignment: dict, student_id: str, look: str, creature: str, accessory: str,
                openings: list[str]) -> dict:
    return {
        "id": new_id("sess"), "student_id": student_id, "assignment_id": assignment["id"],
        "status": "teaching", "look": look, "creature": creature,
        "accessory": accessory,
        "transcript": [{"from": "pip", "text": t, "ts": now()} for t in openings],
        "meters": {c["id"]: 0 for c in assignment["concepts"]}, "boss_hp": 100,
        "weapons": [], "equipped": None, "mood": "confused", "brain": [], "quiz": [],
        "reteach_count": 0, "reteach_concept": None, "reteach_from": None, "parent_message": None, "brain_version": 1, "ko": False,
        "finisher": None, "gap_report": None, "created_at": now(),
        "misconception_stated": True, "opening_source": "claim", "ladder": new_ladder(assignment),
        "parked": [], "turn_log": [],
    }


def apply_turn(session: dict, assignment: dict, student_text: str, r: dict) -> dict:
    """Apply a normalized turn result to the session; returns the Pip message."""
    ids = concept_ids(assignment)
    for p in r["concept_progress"]:
        if p["concept_id"] in ids:
            session["meters"][p["concept_id"]] = clamp(
                session["meters"].get(p["concept_id"], 0) + clamp(p["delta"], 0, 50))
    equipped_before = session["equipped"]
    amount, kind = 0, "none"
    hp = session["boss_hp"]
    if r["misconception_event"] == "hit":
        kind = "hit"
        new_hp = max(HP_FLOOR, hp - HP_HIT.get(r["hit_strength"], 25)) if hp > HP_FLOOR else hp
        amount, session["boss_hp"] = hp - new_hp, new_hp
    elif r["misconception_event"] == "heal":
        kind = "heal"
        session["boss_hp"] = min(100, hp + HEAL)
        amount = session["boss_hp"] - hp
    unlocked = []
    for c in assignment["concepts"]:
        w = c.get("weapon")
        if w and session["meters"].get(c["id"], 0) >= UNLOCK_AT and w not in session["weapons"]:
            session["weapons"].append(w)
            unlocked.append(w)
    if session["equipped"] is None and session["weapons"]:
        session["equipped"] = session["weapons"][0]
    session["mood"] = r["mood"]
    event = {"kind": kind, "amount": amount, "caption": r["caption"] if kind != "none" else "",
             "unlocked": unlocked}
    if r.get("level") is not None:
        event["level"] = r["level"]
    if kind == "hit" and equipped_before:
        event["weapon"] = equipped_before
    return {"from": "pip", "text": r["reply"], "ts": now(), "event": event}


def minutes_spent(session: dict) -> int:
    ts = [m["ts"] for m in session["transcript"] if m["from"] == "student" and m.get("ts")]
    if len(ts) < 2:
        return 1 if ts else 0
    secs = (datetime.fromisoformat(ts[-1]) - datetime.fromisoformat(ts[0])).total_seconds()
    return max(1, round(secs / 60))
