"""B21: CONTRACT v3.18 learning profile + learning map, student details. Run from the repo root:
    PIP_FORCE_OFFLINE=1 backend/.venv/bin/python tests/backend/test_learning.py
"""
import asyncio
import json
import os
import re
import sys
import time
from pathlib import Path

B = Path(os.environ.get("BACKEND_DIR", "backend")).resolve()
sys.path.insert(0, str(B))
import eval_pip as E  # noqa: E402

fails = []


def check(label, ok, detail=""):
    print(("PASS " if ok else "FAIL ") + label, detail if not ok else "")
    if not ok:
        fails.append(label)


client, server = E.load_app(B, "offline")
import center  # noqa: E402
import llm  # noqa: E402

TEACH = ["a triangle is half of a rectangle", "because two of them make a rectangle so one is half",
         "a rectangle is base times height, like 6×4 = 24"]
LABELS = re.compile(r"\b(visual|auditory|aural|kinesth?etic)\s+learn", re.I)
PROFILE_KEYS = ["explains_with", "unstuck_by", "pace", "texts_to_ready_avg", "misconceptions_fixed", "strengths",
                "watch_for", "updated_at"]


def get(path):
    r = client.get(path)
    assert r.status_code == 200, (path, r.status_code, r.text[:200])
    return r.json()


def post(path, body=None):
    r = client.post(path, json=body or {})
    assert r.status_code == 200, (path, r.status_code, r.text[:200])
    return r.json()


def student_msgs(sid):
    return [m["text"] for s in get(f"/api/students/{sid}")["sessions"] for m in s["transcript"] if m["from"] == "student"]


post("/api/demo/reset")

# ------------------------------------------------------------------ unit: explain kinds
k = center.explain_kinds
check("numbers -> examples", "examples" in k("so 6×4÷2 = 12"))
check("imagine / cut -> pictures", "pictures" in k("imagine you cut the box corner to corner"))
check("first / then -> steps", "steps" in k("first take away 6 from both sides then divide"))
check("like a ... -> analogies", "analogies" in k("it's like a seesaw that has to stay level"))
check("bare claim -> short claims", k("it stays sixths") == {"short claims"})

# ------------------------------------------------------------------ seed: details for every student
studs = [get(f"/api/students/s{i:03d}")["student"] for i in range(1, 121)]
check("every student has avatar {initials, color}, school, birthday_month, started, contact",
      all(re.fullmatch(r"[A-Z]{2}", s["avatar"]["initials"]) and s["avatar"]["color"].startswith("#") and s["school"]
          and s["birthday_month"] in ("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")
          and s["started"] and "student_email" in s["contact"] for s in studs))
check("student emails are synthetic (@example.com), none under grade 9",
      all((s["contact"]["student_email"] or "").endswith("@example.com") if s["grade"] >= 9 else s["contact"]["student_email"] is None
          for s in studs))
check("Maya: MR, Harbor View Middle School, Mar", (studs[0]["avatar"]["initials"], studs[0]["school"], studs[0]["birthday_month"])
      == ("MR", "Harbor View Middle School", "Mar"))
check("every student has a profile + map", all(all(x in (s.get("learning_profile") or {}) for x in PROFILE_KEYS)
                                                 and "nodes" in (s.get("learning_map") or {}) for s in studs))
check("no learner-type labels anywhere", not any(LABELS.search(json.dumps(s["learning_profile"])) for s in studs))

# ------------------------------------------------------------------ rich, consistent showcase profiles
for sid, name in (("s001", "Maya"), ("s014", "Theo"), ("s043", "Luna")):
    P = get(f"/api/students/{sid}/profile")
    lp, lm = P["learning_profile"], P["learning_map"]
    msgs = student_msgs(sid)
    check(f"{name}: explains_with, unstuck_by, pace, strengths filled", lp["explains_with"] and lp["unstuck_by"]
          and lp["pace"] in ("quick", "steady", "needs time") and lp["texts_to_ready_avg"] and lp["strengths"], lp)
    check(f"{name}: misconceptions_fixed quotes are verbatim from their own messages", lp["misconceptions_fixed"] and all(
        any(f["quote_after"] in m for m in msgs) and any(f["quote_before"] in m for m in msgs) for f in lp["misconceptions_fixed"]),
        lp["misconceptions_fixed"])
    check(f"{name}: map evidence quotes are verbatim", all(n["evidence_quote"] is None or any(n["evidence_quote"] in m for m in msgs)
                                                          for n in lm["nodes"]))
    check(f"{name}: profile + map on /profile, avatar/school/next_step too", has := all(k_ in P for k_ in (
        "learning_profile", "learning_map", "avatar", "school", "next_step")))
P = get("/api/students/s014/profile")
missions = {n["mission_id"] for n in P["learning_map"]["nodes"]}
check("Theo's map holds the 3 showcase missions (a_pyth, a_trig, a_trig_id)", {"a_pyth", "a_trig", "a_trig_id"} <= missions, missions)
edges = {(e["from"], e["to"]) for e in P["learning_map"]["edges"]}
check("builds_on inside a lesson arc: `from` builds on `to` (a_trig k3 -> k2 -> k1)",
      {("a_trig:k2", "a_trig:k1"), ("a_trig:k3", "a_trig:k2")} <= edges, edges)
check("builds_on across lessons (a_trig_id on a_trig, a_trig on a_pyth)",
      any(f.startswith("a_trig:") and t.startswith("a_pyth:") for f, t in edges)
      and any(f.startswith("a_trig_id:") and t.startswith("a_trig:") for f, t in edges))
check("node concept_id is unique across missions (F20 keys by it), edges reference it",
      len({n["concept_id"] for n in P["learning_map"]["nodes"]}) == len(P["learning_map"]["nodes"])
      and all(f in {n["concept_id"] for n in P["learning_map"]["nodes"]} for f, _ in edges))
nd = {n["id"]: n for n in P["learning_map"]["nodes"]}
check("map nodes: level, explain_level, label", all(0 <= n["level"] <= 3 and n["explain_level"] in ("given", "why", "use")
                                                   and n["label"] for n in nd.values()))
check("given concepts start known at level >= 2 with given: true (a_trig_id k1)", nd["a_trig_id:k1"]["level"] >= 2
      and nd["a_trig_id:k1"]["given"] is True and nd["a_trig:k1"]["given"] is False)
check("node mission is the topic name, mission_id the mission", nd["a_trig:k1"]["mission"] == "Sine in right triangles"
      and nd["a_trig:k1"]["mission_id"] == "a_trig")
check("Theo's a_pyth run shows up (level >= 2 with his words)", nd["a_pyth:k1"]["level"] >= 2 and nd["a_pyth:k1"]["evidence_quote"])
m = get("/api/students/s001/profile")["learning_map"]
check("Maya's map: a_tri k3 builds on k1, k2 given", ("a_tri:k3", "a_tri:k1") in {(e["from"], e["to"]) for e in m["edges"]}
      and {n["id"]: n for n in m["nodes"]}["a_tri:k2"]["explain_level"] == "given")

# ------------------------------------------------------------------ tutor rows
rows = get("/api/tutors/t1/students")["rows"]
check("tutor rows: avatar, school, pace, next_step (and no heavy map)", rows and all(
    r["avatar"] and r["school"] and r["pace"] in ("quick", "steady", "needs time") and r["next_step"]
    and "learning_map" not in r["student"] for r in rows))

# ------------------------------------------------------------------ recompute on K.O. and on completion
before = get("/api/students/s001/profile")["learning_profile"]
time.sleep(1.1)
s = post("/api/sessions", {"assignment_id": "a_tri", "student_id": "s001"})
for t in TEACH:
    post(f"/api/sessions/{s['id']}/turn", {"text": t})
q = post(f"/api/sessions/{s['id']}/quiz")
after = get("/api/students/s001/profile")
lp = after["learning_profile"]
check("K.O. recomputes Maya's profile", q["ko"] and lp["updated_at"] > before["updated_at"], (before["updated_at"], lp["updated_at"]))
check("the live run replaces the saved run (no double count)", lp["runs"] == 1)
live_msgs = [m["text"] for m in q["transcript"] if m["from"] == "student"]
check("map evidence now comes from the live run", all(n["evidence_quote"] is None or any(n["evidence_quote"] in x for x in live_msgs)
                                                     for n in after["learning_map"]["nodes"] if n["mission_id"] == "a_tri"))
s2 = post("/api/sessions", {"assignment_id": "a_tri", "student_id": "s002"})
post(f"/api/sessions/{s2['id']}/turn", {"text": "a triangle is half of a rectangle"})
q2 = post(f"/api/sessions/{s2['id']}/quiz")
p2 = get("/api/students/s002/profile")["learning_profile"]
check("a finished session without a K.O. also recomputes", q2["status"] in ("quizzed", "complete") and p2["runs"] >= 1, (q2["status"], p2))

# ------------------------------------------------------------------ parent slice (tutor-approved, v3.15)
post("/api/demo/reset")
card = next(k_ for k_ in get("/api/parent/g001/home")["kids"] if k_["student"]["id"] == "s001")
check("no learning slice for parents before the tutor sends", card["learning"] is None
      and card["this_week"]["profile_line"] is None)
s = post("/api/sessions", {"assignment_id": "a_tri", "student_id": "s001"})
for t in TEACH:
    post(f"/api/sessions/{s['id']}/turn", {"text": t})
post(f"/api/sessions/{s['id']}/quiz")
d = get("/api/students/s001/drafts")["items"][0]
line = center.learning_line(get("/api/students/s001")["student"])
check("the draft carries the plain-English learning line", line and line.startswith("Maya explains best with")
      and all(line in x["message"] for x in d["by_guardian"]), (line, d["by_guardian"][0]["message"]))
post(f"/api/drafts/{d['id']}/send", {})
card = next(k_ for k_ in get("/api/parent/g001/home")["kids"] if k_["student"]["id"] == "s001")
check("after the tutor sends, parents see the slice, from Ms. Rivera", card["learning"] and card["learning"]["line"] == line
      and card["learning"]["from"]["name"] == "Ms. Rivera"
      and card["this_week"]["profile_line"] == {"text": line, "from": {"tutor_id": "t1", "name": "Ms. Rivera"}})
blob = json.dumps(get("/api/parent/g001/home")) + json.dumps(get("/api/parent/g001/kids/s001"))
check("parent payloads: no profile internals, no labels", '"learning_profile"' not in blob and '"learning_map"' not in blob
      and not LABELS.search(blob))
fv = get("/api/students/s001/family-view")
check("family-view shows the same slice", fv["card"]["learning"] == card["learning"])

# ------------------------------------------------------------------ live refinement (fake model, no network)
st = get("/api/students/s001")["student"]
sess = next(x for x in get("/api/students/s001")["sessions"] if x["id"] == s["id"])
base = center.compute_learning(st, [sess], {a["id"]: a for a in get("/api/students/s001")["assignments"]})[0]
_orig = (llm.available, llm.structured)


def fake(reply, exc=None):
    async def structured(system, messages, schema, **kw):
        if exc:
            raise exc
        assert "learner-type" in system or "learner" in system
        return reply
    return structured


try:
    llm.available = lambda: True
    llm.structured = fake({"explains_with": ["examples", "magic"],
                           "strengths": [{"text": "uses a 6 by 4 case to check", "quote": "like 6×4 = 24"},
                                         {"text": "is a visual learner", "quote": "a triangle is half of a rectangle"},
                                         {"text": "explains area with pizza", "quote": "pizza slices"}],
                           "watch_for": [{"text": "skips the units", "quote": "half of a rectangle"}]})
    r = asyncio.run(center.refine_live(st, sess, base))
    check("live: grounded phrases kept, label + invented quote dropped", r["source"] == "ai"
          and r["strengths"] == ["uses a 6 by 4 case to check"] and r["explains_with"] == ["examples"]
          and r["watch_for"] == ["skips the units"] and all(LABELS.search(x) is None for x in r["strengths"]), r)
    llm.structured = fake(None, llm.LlmError("timeout"))
    r = asyncio.run(center.refine_live(st, sess, base))
    check("live: model error -> offline rules", r == base)
    llm.structured = fake({"explains_with": [], "strengths": [{"text": "a visual learner", "quote": "nope"}], "watch_for": []})
    check("live: nothing grounded -> offline rules", asyncio.run(center.refine_live(st, sess, base)) == base)
finally:
    llm.available, llm.structured = _orig

# ------------------------------------------------------------------ speed + reset
t0 = time.perf_counter()
for _ in range(5):
    client.get("/api/students/s014/profile")
check("profile with map < 100 ms", (time.perf_counter() - t0) * 200 < 100)
post("/api/demo/reset")
lp = get("/api/students/s001/profile")["learning_profile"]
check("reset: Maya's profile back to her seeded evidence", lp["runs"] == 1 and lp["misconceptions_fixed"]
      and get("/api/parent/g001/home")["kids"][0]["learning"] is None)

print(f"\n{len(fails)} failing")
sys.exit(1 if fails else 0)
