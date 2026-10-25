"""TUNE-3 showcase missions: each scripted run (lesson.offline_demo) behaves as designed. Run:
    PIP_FORCE_OFFLINE=1 BACKEND_DIR=backend backend/.venv/bin/python tests/backend/test_missions.py
"""
import json
import os
import re
import sys
from pathlib import Path

B = Path(os.environ.get("BACKEND_DIR", "backend")).resolve()
sys.path.insert(0, str(B))
import eval_pip as E  # noqa: E402

fails = []
WHY = re.compile(r"\bwhy\b|how come|what makes|how do you know|can you explain|what do you mean", re.I)


def check(label, ok, detail=""):
    print(("PASS " if ok else "FAIL ") + label, detail if not ok else "")
    if not ok:
        fails.append(label)


client, server = E.load_app(B, "offline")
# mission -> (student, ready_by, wrong_turn_concept (the planned quiz miss))
MISSIONS = {"a_trig": ("s014", 3, "k2"), "a_sat_modifiers": ("s043", 3, "k3")}
for aid, (sid, ready_by, miss) in MISSIONS.items():
    les = json.loads((B / f"seed/lessons/{aid}.json").read_text())
    od = les["offline_demo"]
    T = {t["n"]: t for t in od["turns"]}
    client.post("/api/demo/reset")
    st = client.get(f"/api/students/{sid}").json()
    check(f"{aid}: assigned to {sid}", any(a["id"] == aid for a in st["assignments"]))
    s = client.post("/api/sessions", json={"assignment_id": aid, "student_id": sid}).json()
    ready_at, pip = None, []
    wrong_n = next(n for n, t in T.items() if t["event"] == "heal")
    for n in sorted(T):
        t = T[n]
        if t.get("reteach_concept_id"):
            q = client.post(f"/api/sessions/{s['id']}/quiz").json()
            by = {i["concept_id"]: i for i in q["quiz"]}
            check(f"{aid}: quiz misses only {miss} (the trap)", [k for k, v in by.items() if not v["passed"]] == [miss],
                  {k: v["passed"] for k, v in by.items()})
            client.post(f"/api/sessions/{s['id']}/reteach", json={"concept_id": t["reteach_concept_id"]})
        s = client.post(f"/api/sessions/{s['id']}/turn", json={"text": t["student"]}).json()
        m = s["transcript"][-1]
        pip.append(m["text"])
        if ready_at is None and s.get("ready_for_quiz"):
            ready_at = n
        if n == wrong_n:
            check(f"{aid}: wrong rule is filed (heal + Saving that)", m["event"]["kind"] == "heal" and "Saving that" in m["text"], m)
    check(f"{aid}: ready by text {ready_by}", ready_at is not None and ready_at <= ready_by, ready_at)
    q = client.post(f"/api/sessions/{s['id']}/quiz").json()
    check(f"{aid}: re-teach -> K.O. fixed_after 1", q["ko"] and next(
        r for r in q["brain"] if r["concept_id"] == miss).get("fixed_after") == 1)
    use = {c["concept_id"] for c in les["concepts"] if c.get("explain_level") in ("given", "use")}
    asked = [t for t in pip if WHY.search(t)]
    check(f"{aid}: no why-question while teaching a use/given concept (if any use: {sorted(use)})",
          not any(WHY.search(t) for t in pip) or not use, asked)

print(f"\n{len(fails)} failing")
sys.exit(1 if fails else 0)
