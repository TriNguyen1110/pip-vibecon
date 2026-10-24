"""Seed the synthetic Bright Path Tutoring center from seed/*.json (idempotent via clear + put)."""

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pip_ai
from logic import now

SEED = Path(__file__).parent / "seed"
COLLS = ["center", "tutors", "students", "assignments", "sessions", "events", "sent", "workshops",
         "pilot"]


def _load(name):
    return json.loads((SEED / name).read_text())


def _meters(a, quiz):
    passed = {q["concept"] for q in quiz if q["passed"]}
    return {c["id"]: (100 if c["id"] in passed else 40) for c in a["concepts"]}


def _session(raw, a, saved=False):
    quiz = []
    qmap = {q["concept_id"]: q for q in a["quiz"]}
    for q in raw["quiz"]:
        says = q.get("pip_says", "")
        quiz.append({"id": qmap[q["concept"]]["id"], "concept_id": q["concept"],
                     "question": qmap[q["concept"]]["question"], "rule_id": f"r_{q['concept']}",
                     "pip_answer": says, "passed": q["passed"], "line": says})
    brain = [{"id": r["id"], "concept_id": r["concept"], "quote": r["quote"], "correct": r["correct"]}
             for r in raw["pips_brain"]]
    ok = all(q["passed"] for q in quiz)
    ts = now()
    tr = [{"from": m["from"], "text": m["text"], "ts": ts} for m in raw.get("transcript", [])]
    return {
        "id": raw["id"], "student_id": raw["student_id"], "assignment_id": raw["assignment_id"],
        "status": "complete" if ok else "quizzed", "look": "blob", "creature": "blob",
        "transcript": tr, "meters": _meters(a, raw["quiz"]), "boss_hp": 0 if ok else 40,
        "weapons": [], "equipped": None, "mood": "celebrating" if ok else "stuck",
        "brain": brain, "quiz": quiz, "reteach_count": raw["reteach_count"],
        "reteach_concept": None, "brain_version": 2 if ok else 1, "ko": ok, "finisher": None,
        "gap_report": None, "synthetic": True, "minutes": raw["minutes"],
        "since_last_session": raw.get("since_last_session"), "created_at": ts,
        "misconception_stated": True,
        **({"saved": True, "label": "saved session"} if saved else {}),
    }


async def seed(store):
    for c in COLLS:
        await store.clear(c)
    cdata = _load("seed_center.json")
    raw = _load("seed_sessions.json")
    await store.put("center", {**cdata["center"], "id": "c1"})
    for t in cdata["tutors"]:
        await store.put("tutors", t)
    students = {}
    for s in cdata["students"]:
        s = {k: v for k, v in s.items() if k != "pip"}
        students[s["id"]] = {**s, "interests": None, "since_last_session": None}
    base = raw["assignment"]
    f = pip_ai.FRAC
    a = {**f, "id": base["id"], "student_id": "s001", "tutor_id": "t1", "grade": 6,
         "topic": base["topic"], "created_at": now()}
    await store.put("assignments", a)
    for r in raw["sessions"]:
        s = _session(r, a)
        students[r["student_id"]]["since_last_session"] = r["since_last_session"]
        await store.put("sessions", s)
    maya = _session(raw["maya_saved_session"], a, saved=True)
    maya["gap_report"] = await pip_ai.report(maya, a, students["s001"], "Ms. Rivera")
    await store.put("sessions", maya)
    for s in students.values():
        await store.put("students", s)
    # Synthetic "app open" events: 11 non-Maya students, no assignment due, this week.
    busy = {r["student_id"] for r in raw["sessions"]}
    pick = [sid for sid in sorted(students) if sid != "s001" and sid not in busy][:11]
    t0 = datetime.now(timezone.utc)
    for i, sid in enumerate(pick):
        ts = (t0 - timedelta(days=1 + i % 6, hours=i)).isoformat(timespec="seconds")
        await store.put("events", {"id": f"ev_seed_{sid}", "kind": "open", "student_id": sid,
                                   "ts": ts, "due": False, "synthetic": True})
    await store.put("pilot", {"id": "pilot", "status": "not_started"})
