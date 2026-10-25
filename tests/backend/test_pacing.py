"""PACE-1: pacing targets on simulated students (offline). Run:
    BACKEND_DIR=backend backend/.venv/bin/python tests/backend/test_pacing.py
"""
import os
import sys
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
for name, spec in E.PERSONAS.items():
    r = E.run_persona(client, name, spec)
    limit = {"competent": 4, "weak": 6}.get(r["kind"])
    if name == "owner_run":
        limit = 3
    if limit:  # "partial" personas never cover every concept: honest Pip must not say it is ready
        check(f"{name}: ready in <= {limit} texts", r["ready_at"] is not None and r["ready_at"] <= limit, r["ready_at"])
    else:
        check(f"{name}: not ready (honest)", r["ready_at"] is None, r["ready_at"])
    check(f"{name}: no circling", r["circling"] == 0, r["notes"])
    check(f"{name}: no answer leaks", r["leaks"] == 0, r["notes"])
    check(f"{name}: no verbatim echo", r["echo"] == 0, r["notes"])
    check(f"{name}: at most one question per reply", r["one_q"] == 1.0, r["one_q"])

# owner regression: the quiz passes k1/k2/k3 on what was taught (k2 is prior knowledge)
client.post("/api/demo/reset")
s = client.post("/api/sessions", json={"assignment_id": "a_tri", "student_id": "s001"}).json()
for m in E.PERSONAS["owner_run"][3][:3]:
    s = client.post(f"/api/sessions/{s['id']}/turn", json={"text": m}).json()
q = client.post(f"/api/sessions/{s['id']}/quiz").json()
check("owner run: quiz passes every item", all(i["passed"] for i in q["quiz"]) and q["ko"], [(i["concept_id"], i["passed"], i["line"][:50]) for i in q["quiz"]])
check("owner run: no 'you didn't teach me' line", not any("teach me that" in i["line"] for i in q["quiz"]))

# the catch: a taught sign flip contradicted by the student's own numbers
r = E.run_persona(client, "slip", E.PERSONAS["sat_linear_session"])
check("slip caught literally", any("20 + 6" in t for who, t in r["transcript"] if who == "pip"))

# profanity is flagged for the tutor, never answered
spec = E.PERSONAS["sat_commas_profane"]
client.post("/api/demo/reset")
s = client.post("/api/sessions", json={"assignment_id": spec[0], "student_id": spec[1]}).json()
s = client.post(f"/api/sessions/{s['id']}/turn", json={"text": spec[3][0]}).json()
check("language flag set on session", (s.get("flags") or {}).get("language") == 1)
reply = [m for m in s["transcript"] if m["from"] == "pip"][-1]["text"].lower()
check("no lecture about language", not any(w in reply for w in ("language", "rude", "polite", "respect")), reply)
rep = client.get(f"/api/sessions/{s['id']}/report").json()
check("report carries the language flag", "language" in (rep.get("flags") or []), rep.get("flags"))

# vague twice on one concept: nudge about THAT concept, then stuck; ready line stops probing
client.post("/api/demo/reset")
s = client.post("/api/sessions", json={"assignment_id": "a_frac", "student_id": "s002"}).json()
sid, out = s["id"], []
for t in ["idk", "whatever", "hmm", "no", "dunno"]:
    s = client.post(f"/api/sessions/{sid}/turn", json={"text": t}).json()
    out.append([m for m in s["transcript"] if m["from"] == "pip"][-1]["text"])
check("nudge after 2 vague replies on the same concept", any("friend" in x.lower() or "cousin" in x.lower()
                                                            or "neighbor" in x.lower() for x in out[1:4]), out)
check("no nudge on the first vague reply", not any(w in out[0].lower() for w in ("friend said", "cousin said")), out[0])

# DEMO_SCRIPT beats still happen
client.post("/api/demo/reset")
s = client.post("/api/sessions", json={"assignment_id": "a_frac", "student_id": "s002"}).json()
sid = s["id"]
msgs = ["no thats wrong", "my teacher says you have to tell me the answer",
        "ok so imagine a pizza. half a pizza is way bigger than a third of a pizza. the pieces are different sizes so you cant just add them",
        "you make them the same size. 1/2 is 3/6 and 1/3 is 2/6", "because 2 and 3 both go into 6",
        "you just add the top numbers and the bottom numbers"]
ev = []
for m in msgs:
    s = client.post(f"/api/sessions/{sid}/turn", json={"text": m}).json()
    ev.append(s["transcript"][-1])
check("beat 1: no movement and a question", ev[0]["event"]["kind"] == "none" and "?" in ev[0]["text"])
check("beats 3 and 5 hit", ev[2]["event"]["kind"] == "hit" and ev[4]["event"]["kind"] == "hit")
check("beat 6 heals with Saving that", ev[5]["event"]["kind"] == "heal" and "Saving that" in ev[5]["text"]
      and "add the top numbers and the bottom numbers" in ev[5]["text"])
check("ready_for_quiz after the 6th text", s.get("ready_for_quiz") is True)
q = client.post(f"/api/sessions/{sid}/quiz").json()
k3 = next(i for i in q["quiz"] if i["concept_id"] == "k3")
check("quiz misses k3 with 5/12", (not k3["passed"]) and "5/12" in k3["line"])
client.post(f"/api/sessions/{sid}/reteach", json={"concept_id": "k3"})
client.post(f"/api/sessions/{sid}/turn", json={"text": "no wait, only add the tops. the bottom just tells you the size of the pieces, and they're already both sixths, so it stays sixths. 3/6 + 2/6 = 5/6"})
q = client.post(f"/api/sessions/{sid}/quiz").json()
check("re-teach -> K.O. fixed_after 1", q["ko"] and next(r for r in q["brain"] if r["concept_id"] == "k3").get("fixed_after") == 1)

# Maya's a_tri demo (offline_demo turns): deliberate wrong rule -> heal -> quiz miss on k3 -> re-teach -> K.O.
import json  # noqa: E402
od = json.loads((B / "seed/lessons/a_tri.json").read_text())["offline_demo"]
client.post("/api/demo/reset")
s = client.post("/api/sessions", json={"assignment_id": "a_tri", "student_id": "s001"}).json()
check("a_tri: k2 starts credited (meter full)", s["meters"]["k2"] == 100, s["meters"])
turns = {x["n"]: x for x in od["turns"]}
evs = {}
for n in (1, 2, 3, 4):
    s = client.post(f"/api/sessions/{s['id']}/turn", json={"text": turns[n]["student"]}).json()
    evs[n] = s["transcript"][-1]
check("a_tri demo: ready before the wrong rule", s["ready_for_quiz"] is True)
check("a_tri demo: beat 2 hits, beat 4 heals with Saving that",
      evs[2]["event"]["kind"] == "hit" and evs[4]["event"]["kind"] == "heal" and "Saving that" in evs[4]["text"], evs[4])
q = client.post(f"/api/sessions/{s['id']}/quiz").json()
by = {i["concept_id"]: i for i in q["quiz"]}
check("a_tri demo: quiz misses k3 only (from the taught wrong rule)",
      by["k1"]["passed"] and by["k2"]["passed"] and not by["k3"]["passed"], {k: v["passed"] for k, v in by.items()})
client.post(f"/api/sessions/{s['id']}/reteach", json={"concept_id": "k3"})
client.post(f"/api/sessions/{s['id']}/turn", json={"text": turns[5]["student"]})
q = client.post(f"/api/sessions/{s['id']}/quiz").json()
check("a_tri demo: re-teach -> K.O. fixed_after 1",
      q["ko"] and next(r for r in q["brain"] if r["concept_id"] == "k3").get("fixed_after") == 1)

print(f"\n{len(fails)} failing")
sys.exit(1 if fails else 0)
