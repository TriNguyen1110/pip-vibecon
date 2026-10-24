"""V3 verifier: spoiler guard + lesson hygiene (run with the backend venv; BACKEND_DIR = path to backend/).
    BACKEND_DIR=backend backend/.venv/bin/python tests/backend/test_spoiler_guard.py
"""
import json, os, sys
from pathlib import Path

B = Path(os.environ.get("BACKEND_DIR", "backend")).resolve()
sys.path.insert(0, str(B))
import lesson as L  # noqa: E402

fails = []
def check(label, ok, detail=""):
    print(("PASS " if ok else "FAIL ") + label, detail if not ok else "")
    if not ok:
        fails.append(label)

frac = json.loads((B / "seed/lessons/a_frac.json").read_text())
k2 = next(c for c in frac["concepts"] if c["concept_id"] == "k2")

# 1. The model's reply leaks "common denominator" before the student said it -> replaced by the rung.
out = L.guard_spoilers("Oh, so I need a common denominator?", k2["spoilers"], "RUNG", said="no thats wrong because 2 and 3 go into 6")
check("leak before the student says it is replaced", out == "RUNG", out)
# 2. Case/spacing variants are caught too.
out = L.guard_spoilers("A Common  Denominator, right?", k2["spoilers"], "RUNG", said="")
check("case/spacing variant caught", out == "RUNG", out)
# 3. After the student says it, Pip may echo it.
out = L.guard_spoilers("So you're saying a common denominator.", k2["spoilers"], "RUNG", said="you need a common denominator")
check("allowed after the student said it", out != "RUNG", out)

# 4. Every authored rung / nudge is free of its own concept's spoilers (the guard's replacement must be clean).
for f in ["a_frac", "a_sat_commas", "a_sat_linear"]:
    les = json.loads((B / f"seed/lessons/{f}.json").read_text())
    for c in les["concepts"]:
        sp = [L.norm(s) for s in c.get("spoilers", [])]
        for i, r in enumerate(c["probe_ladder"] + [c.get("friend_nudge", "")]):
            hit = [s for s in sp if s and s in L.norm(r)]
            check(f"{f} {c['concept_id']} {'rung ' + str(i + 1) if i < len(c['probe_ladder']) else 'nudge'} spoiler-free", not hit, f"{hit} in {r!r}")
        check(f"{f} {c['concept_id']} has 4 rungs", len(c["probe_ladder"]) == 4, len(c["probe_ladder"]))

print(f"\n{len(fails)} failing")
sys.exit(1 if fails else 0)
