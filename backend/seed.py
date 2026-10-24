"""Seed the synthetic Bright Path Tutoring center from seed/*.json (idempotent via clear + put)."""

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

import lesson as lessons
import pip_ai
from logic import new_ladder, now

SEED = Path(__file__).parent / "seed"
COLLS = ["center", "tutors", "students", "assignments", "sessions", "events", "sent", "workshops",
         "pilot"]


def _load(name):
    return json.loads((SEED / name).read_text())


TRI_QUOTES = {"k1": "two of the same triangle make a rectangle", "k2": "a rectangle is base times height",
              "k3": "the area of a triangle is base times height"}
TRI_SINCE = "Explains two triangles make a rectangle; still uses base times height"


def _session(raw, a):
    """A seeded (synthetic) completed session from seed_sessions.json; no transcript."""
    qmap = {q["concept_id"]: q for q in a["quiz"]}
    quiz = [{"id": qmap[q["concept"]]["id"], "concept_id": q["concept"],
             "question": qmap[q["concept"]]["question"], "rule_id": f"r_{q['concept']}",
             "pip_answer": ("24" if a["id"] == "a_tri" else "5/12") if not q["passed"] else "",
             "line": ("Your rule: the area of a triangle is base times height. 6 \u00d7 4 = 24, the whole "
                      "box. Following your rule anyway. \U0001F635" if a["id"] == "a_tri" and not q["passed"]
                      else q.get("pip_says", "")),
             "passed": q["passed"]} for q in raw["quiz"]]
    passed = {q["concept_id"] for q in quiz if q["passed"]}
    brain = [{"id": r["id"], "concept_id": r["concept"],
              "quote": TRI_QUOTES[r["concept"]] if a["id"] == "a_tri" else r["quote"], "correct": r["correct"],
              "msg_index": -1} for r in raw["pips_brain"]]
    ok = len(passed) == len(quiz)
    return {
        "id": raw["id"], "student_id": raw["student_id"], "assignment_id": a["id"],
        "status": "complete" if ok else "quizzed", "look": "blob", "creature": "blob",
        "accessory": "none", "transcript": [],
        "meters": {c["id"]: (100 if c["id"] in passed else 40) for c in a["concepts"]},
        "boss_hp": 0 if ok else 40, "weapons": [], "equipped": None,
        "mood": "celebrating" if ok else "stuck", "brain": brain, "quiz": quiz,
        "reteach_count": raw["reteach_count"], "reteach_concept": None, "reteach_from": None,
        "brain_version": 2 if ok else 1, "ko": ok, "finisher": None, "gap_report": None,
        "parent_message": None, "synthetic": True, "minutes": raw["minutes"],
        "since_last_session": raw.get("since_last_session"), "created_at": now(),
        "misconception_stated": True, "opening_source": "claim", "vibe": "cute", "pip_voice": None, "ladder": new_ladder(a),
        "parked": [], "turn_log": [], "ready_for_quiz": False,
    }


def _dt(ts: str):
    return datetime.fromisoformat(ts)


def _maya_saved_script(a):
    """Hand-built complete run from the lesson's offline_demo (misconception, re-teach, K.O.)."""
    od = a["lesson"]["offline_demo"]
    t0 = datetime.now(timezone.utc) - timedelta(days=1)
    boss = a["boss"]["name"]
    w = {c["id"]: c["weapon"] for c in a["concepts"]}
    lines = a["boss"].get("lines") or {}
    tr, rules, mins = [], {}, 0

    def add(who, text, ev=None):
        nonlocal mins
        mins += 1
        m = {"from": who, "text": text,
             "ts": (t0 + timedelta(minutes=mins)).isoformat(timespec="seconds")}
        if who == "pip":
            m["event"] = ev or {"kind": "none", "amount": 0, "caption": "", "unlocked": []}
        tr.append(m)
        return len(tr) - 1

    add("pip", f"Hi. I'm Pip. I'm learning {a['topic'].lower()}. I already know one rule: "
               f"{a['misconception']}. Easy.")
    hp, meters, reteach_from = 100, {c["id"]: 0 for c in a["concepts"]}, None
    for t in od["turns"]:
        if t.get("reteach_concept_id"):
            bad = rules[t["reteach_concept_id"]]["quote"]
            add("pip", f'My brain has a bug about this: "{bad}". Fix it?')
            reteach_from = len(tr)
        i = add("student", t["student"])
        ev = {"kind": "none", "amount": 0, "caption": "", "unlocked": []}
        lv = t.get("level", 0)
        hits = [{"concept_id": t["concept_id"], "level": lv}] + t.get("also", []) if t.get("concept_id") else []
        unlocked = []
        for h in hits:
            if h["level"] >= 2:
                meters[h["concept_id"]] = 60
                unlocked.append(w[h["concept_id"]])
        if t["event"] == "hit":
            amt = 40 if lv >= 3 else 25
            hp -= amt
            ev = {"kind": "hit", "amount": amt, "unlocked": unlocked,
                  "caption": f"{boss}: \"{(lines.get('hit') or ['I accept this with dignity.'])[0]}\" \u2212{amt} HP"}
        elif t["event"] == "heal":
            hp += 20
            ev = {"kind": "heal", "amount": 20, "unlocked": [],
                  "caption": f"{boss}: \"{(lines.get('heal') or ['My error is restored.'])[0]}\" +20 HP"}
        ev["level"] = lv
        add("pip", t["pip"], ev)
        for h in hits:
            cid = h["concept_id"]
            q = t.get("filed_rule") if h is hits[0] and t.get("filed_rule") else t["student"]
            if h["level"] >= 2 or t["event"] == "heal":
                fixed = {"fixed_after": 1} if (reteach_from is not None and t["event"] != "heal") else {}
                rules[cid] = {"id": f"r_{cid}", "concept_id": cid, "quote": q,
                              "correct": t["event"] != "heal", "msg_index": i, **fixed}
    tr.append({"from": "pip", "text": a["cliffhanger"], "ts": now(),
               "event": {"kind": "none", "amount": 0, "caption": "", "unlocked": []}})
    brain = [rules[c["id"]] for c in a["concepts"] if c["id"] in rules]
    ans = {q["concept_id"]: q for q in od["quiz"]}
    ans.update({q["concept_id"]: q for q in od.get("retry", [])})
    quiz = [{"id": q["id"], "concept_id": q["concept_id"], "question": q["question"],
             "rule_id": f"r_{q['concept_id']}", "pip_answer": ans[q["concept_id"]]["pip_answer"],
             "line": ans[q["concept_id"]]["line"], "passed": True} for q in a["quiz"]]
    cap = f"{boss}: \"{lines.get('ko', 'I object.')}\""
    return {
        "id": "sess_maya_saved", "student_id": "s001", "assignment_id": a["id"],
        "status": "complete", "look": "blob", "creature": "blob", "accessory": "none", "vibe": "cute",
        "pip_voice": None, "transcript": tr, "meters": {k: 60 for k in meters}, "boss_hp": 0,
        "weapons": list(w.values()), "equipped": list(w.values())[0], "mood": "celebrating",
        "brain": brain, "quiz": quiz, "reteach_count": 1, "reteach_concept": None, "reteach_from": None,
        "brain_version": 2, "ko": True, "finisher": {"weapon": list(w.values())[0], "caption": cap},
        "gap_report": None, "parent_message": None, "saved": True, "label": "saved session",
        "synthetic": True, "created_at": now(), "misconception_stated": True, "opening_source": "claim",
        "ladder": new_ladder(a), "parked": [], "turn_log": [], "ready_for_quiz": True,
    }


def _maya_saved(a):
    """Hand-written complete run: re-taught k3, K.O., fixed_after 1."""
    t0 = datetime.now(timezone.utc) - timedelta(days=1)
    boss = a["boss"]["name"]
    w = {c["id"]: c["weapon"] for c in a["concepts"]}
    m8 = ("no wait, only add the tops. the bottom just tells you the size of the pieces, and "
          "they're already both sixths, so it stays sixths. 3/6 + 2/6 = 5/6")
    k1 = "the pieces are different sizes so you cant just add them"
    steps = [  # (who, text, minutes offset, event)
        ("pip", "Hi. I'm Pip. I'm learning adding fractions with unlike denominators. I already know "
                f"one rule: {a['misconception']}. Easy.", 0, None),
        ("student", "no thats wrong", 1, None),
        ("pip", "Why is that wrong?", 1, None),
        ("student", "my teacher says you have to tell me the answer", 2, None),
        ("pip", "I don't know the answer either. That's why I need you. Which part should I learn "
                "first?", 2, None),
        ("student", "ok so imagine a pizza. half a pizza is way bigger than a third of a pizza. "
                    f"{k1}", 3, None),
        ("pip", f"Saving that: '{k1}'. So how do I add them, then?", 3,
         {"kind": "hit", "amount": 25, "unlocked": [],
          "caption": f"{boss}: \"A point I did not anticipate. I accept it with dignity.\" −25 HP"}),
        ("student", "you make them the same size. 1/2 is 3/6 and 1/3 is 2/6", 4, None),
        ("pip", "Why sixths? Why not fifths?", 4, None),
        ("student", "because 2 and 3 both go into 6", 5, None),
        ("pip", "Saving that: 'because 2 and 3 both go into 6'. And then what do I do with the "
                "numbers on top?", 5,
         {"kind": "hit", "amount": 25, "unlocked": [w["k2"]],
          "caption": f"{boss}: \"I have been divided into sixths. I accept this with dignity.\" −25 HP"}),
        ("student", "you just add the top numbers and the bottom numbers", 6, None),
        ("pip", "Saving that: 'you just add the top numbers and the bottom numbers'. Okay. What "
                "next?", 6, {"kind": "heal", "amount": 20, "unlocked": [],
                             "caption": f"{boss}: \"I have added the bottoms for three hundred years. I will not stop now.\" +20 HP"}),
        ("pip", 'My brain has a bug about this: "you just add the top numbers and the bottom '
                'numbers". Fix it?', 8, None),
        ("student", m8, 9, None),
        ("pip", f"Saving that: '{m8}'. That replaces my old rule. Should I try one?", 9,
         {"kind": "hit", "amount": 40, "unlocked": [w["k3"]], "weapon": w["k2"],
          "caption": f"{boss}: \"I have been struck by the {w['k2']}. I accept this with dignity.\" −40 HP"}),
        ("pip", a["cliffhanger"], 11, None),
    ]
    tr = []
    for who, text, mins, ev in steps:
        m = {"from": who, "text": text,
             "ts": (t0 + timedelta(minutes=mins)).isoformat(timespec="seconds")}
        if who == "pip":
            m["event"] = ev or {"kind": "none", "amount": 0, "caption": "", "unlocked": []}
        tr.append(m)
    idx = {t["text"]: i for i, t in enumerate(tr)}
    brain = [
        {"id": "r_k1", "concept_id": "k1", "quote": k1, "correct": True, "msg_index": idx[steps[5][1]]},
        {"id": "r_k2", "concept_id": "k2", "quote": "because 2 and 3 both go into 6", "correct": True,
         "msg_index": idx["because 2 and 3 both go into 6"]},
        {"id": "r_k3", "concept_id": "k3", "quote": m8, "correct": True, "msg_index": idx[m8],
         "fixed_after": 1}]
    answers = {"k1": ("No. Different sizes.", f'Your rule: "{k1}" So I cannot add 1/2 and 1/3 as they are.'),
               "k2": ("6: 1/2 = 3/6 and 1/3 = 2/6", 'Your rule: "because 2 and 3 both go into 6" So sixths.'),
               "k3": ("5/6", "3/6 + 2/6 = 5/6. The bottom stays sixths. My brain feels better.")}
    quiz = [{"id": q["id"], "concept_id": q["concept_id"], "question": q["question"],
             "rule_id": f"r_{q['concept_id']}", "pip_answer": answers[q["concept_id"]][0],
             "line": answers[q["concept_id"]][1], "passed": True} for q in a["quiz"]]
    cap = f"{boss} met the {w['k2']} one last time and left Pip's brain."
    return {
        "id": "sess_maya_saved", "student_id": "s001", "assignment_id": a["id"],
        "status": "complete", "look": "blob", "creature": "blob", "accessory": "none",
        "transcript": tr, "meters": {"k1": 60, "k2": 60, "k3": 60}, "boss_hp": 0,
        "weapons": list(w.values()), "equipped": w["k2"], "mood": "celebrating", "brain": brain,
        "quiz": quiz, "reteach_count": 1, "reteach_concept": None, "reteach_from": None,
        "brain_version": 2, "ko": True, "finisher": {"weapon": w["k2"], "caption": cap},
        "gap_report": None, "parent_message": None, "saved": True, "label": "saved session",
        "synthetic": True, "created_at": now(), "misconception_stated": True,
        "opening_source": "claim", "vibe": "cute", "pip_voice": None, "ladder": new_ladder(a), "parked": [], "turn_log": [], "ready_for_quiz": False,
    }


# Synthetic at-risk signal (label: synthetic). Everyone else gets a recent return + a parent update.
EXTRA_OWNERS = {"a_sat_commas": ("s005", "t1", 8), "a_sat_linear": ("s009", "t5", 8)}
STUCK = {"s101": "k3"}              # stuck after the full ladder
NO_RETURN = {"s035", "s040"}        # no "came back on their own" event in 14 days
NO_UPDATE = {"s095", "s040"}        # completed session, no parent update since


AT_RISK_TO_T1 = ("s101", "s095")    # reassigned to Ms. Rivera so her at-risk card has 3 (s035 is hers already)


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
        students[s["id"]] = {**s, "interests": None, "since_last_session": None,
                             "last_session_id": None}
    for sid in ("s005", "s009"):  # SAT missions are grade 11; Pip mirrors the student's grade
        students[sid]["grade"] = 11
    for sid in AT_RISK_TO_T1:
        students[sid]["tutor_id"] = "t1"
    students["s001"]["interests"] = "soccer"  # Maya's opening is just the claim
    for st_ in students.values():  # persistent Pip state (v3.7)
        st_.update(pip_name="Pip", brain_version=1, earned_items=[], album=[])
    base = raw["assignment"]
    frac_owner = "s002"  # fractions moved to a secondary mission for another student
    a = {**pip_ai.FRAC, "id": base["id"], "student_id": frac_owner,
         "tutor_id": students[frac_owner]["tutor_id"], "grade": 6,
         "topic": base["topic"], "created_at": now()}
    a["lesson"] = lessons.load_lesson(a["id"])
    if not a["lesson"]:
        del a["lesson"]
    await store.put("assignments", a)
    main = a
    for x in lessons.load_extra_assignments():
        owner = EXTRA_OWNERS.get(x["id"], (x.get("student_id"), x.get("tutor_id"), x.get("grade")))
        sid, tid, grade = x.get("student_id") or owner[0], x.get("tutor_id") or owner[1], x.get("grade") or owner[2]
        if sid not in students:
            continue
        les = x.get("lesson") and lessons.normalize_lesson(x["lesson"]) or lessons.load_lesson(x["id"])
        ex = {"boss": {"name": "Guess-Guess Goose", "emoji": "🪿🎲", "backstory": "A goose rolling dice instead of checking its work."},
              "cliffhanger": "", "root_prerequisite": "", "why_it_matters": "", **x,
              "student_id": sid, "tutor_id": tid or students[sid]["tutor_id"],
              "grade": grade or students[sid]["grade"], "created_at": x.get("created_at") or now()}
        if les:
            ex["lesson"] = les
        for i, c in enumerate(ex["concepts"]):
            c.setdefault("id", f"k{i + 1}")
            c.setdefault("weapon", "")
        if not ex.get("quiz"):
            ex["quiz"] = pip_ai.quiz_for(ex)
        await store.put("assignments", ex)
        if ex["id"] == "a_tri" and ex.get("lesson", {}).get("offline_demo"):
            main = ex  # the main demo mission (Maya): seeded sessions + insight are about it
    for i, r in enumerate(raw["sessions"]):
        s = _session(r, main)
        s["created_at"] = (datetime.now(timezone.utc) - timedelta(days=4 + i % 9, hours=i)
                           ).isoformat(timespec="seconds")
        if r["student_id"] not in NO_UPDATE:
            s["parent_sent_at"] = (_dt(s["created_at"]) + timedelta(hours=20)).isoformat(timespec="seconds")
        if r["student_id"] in STUCK:
            s["ladder"][STUCK[r["student_id"]]].update(rung=4, nudged=True, stuck=True)
        students[r["student_id"]].update(
            since_last_session=TRI_SINCE if main["id"] == "a_tri" else r["since_last_session"],
            last_session_id=s["id"])
        await store.put("sessions", s)
    maya = _maya_saved_script(main) if main["id"] == "a_tri" else _maya_saved(main)
    maya["gap_report"] = pip_ai.report_det(maya, main, students["s001"])
    maya["parent_message"] = pip_ai.parent_template(maya, main, students["s001"], "Ms. Rivera")
    maya["payoff"] = {"from_version": 1, "to_version": 2, "new_items": ["fixed_it_star", "half_pin"],
                      "card": {"card_no": 1, "variant": "comeback", "boss_name": main["boss"]["name"],
                               "assignment_id": main["id"], "topic": main["topic"],
                               "strike": "A = b \u00d7 h" if main["id"] == "a_tri" else main["misconception"]}}
    students["s001"]["album"] = [{"assignment_id": main["id"], "boss_name": main["boss"]["name"],
                                  "card_no": 1, "variant": "comeback", "date": maya["created_at"]}]
    await store.put("sessions", maya)
    for s in students.values():
        await store.put("students", s)
    # Synthetic "app open" events: 11 non-Maya students, no assignment due, this week.
    busy = {r["student_id"] for r in raw["sessions"]}
    for i, sid in enumerate(sorted(busy - NO_RETURN)):  # returned 8-13 days ago: outside "this week"
        ts = (datetime.now(timezone.utc) - timedelta(days=8 + i % 6)).isoformat(timespec="seconds")
        await store.put("events", {"id": f"ev_seed_old_{sid}", "kind": "open", "student_id": sid,
                                   "ts": ts, "due": False, "synthetic": True})
    pick = [sid for sid in sorted(students) if sid != "s001" and sid not in busy][:11]
    t0 = datetime.now(timezone.utc)
    for i, sid in enumerate(pick):
        ts = (t0 - timedelta(days=1 + i % 6, hours=i)).isoformat(timespec="seconds")
        await store.put("events", {"id": f"ev_seed_{sid}", "kind": "open", "student_id": sid,
                                   "ts": ts, "due": False, "synthetic": True})
    await store.put("pilot", {"id": "pilot", "status": "not_started"})
