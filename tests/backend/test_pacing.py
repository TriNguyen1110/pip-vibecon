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
    limit = 4 if r["kind"] == "competent" else 6
    check(f"{name}: ready in <= {limit} texts", r["ready_at"] is not None and r["ready_at"] <= limit, r["ready_at"])
    check(f"{name}: no circling", r["circling"] == 0, r["notes"])
    check(f"{name}: no answer leaks", r["leaks"] == 0, r["notes"])
    check(f"{name}: no verbatim echo", r["echo"] == 0, r["notes"])
    check(f"{name}: exactly one question per reply", r["one_q"] == 1.0, r["one_q"])

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

print(f"\n{len(fails)} failing")
sys.exit(1 if fails else 0)
