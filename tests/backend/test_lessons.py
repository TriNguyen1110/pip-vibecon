"""TUNE-3: lesson data hygiene for every seeded lesson. Run:
    BACKEND_DIR=backend backend/.venv/bin/python tests/backend/test_lessons.py
"""
import json
import os
import re
import sys
from pathlib import Path

B = Path(os.environ.get("BACKEND_DIR", "backend")).resolve()
sys.path.insert(0, str(B))
import lesson as L  # noqa: E402

fails = []
WHY = re.compile(r"\bwhy\b|how come|what makes|how do you know|can you explain|what do you mean", re.I)


def check(label, ok, detail=""):
    if not ok:
        print("FAIL " + label, detail)
        fails.append(label)


files = sorted(p for p in (B / "seed/lessons").glob("*.json") if not p.name.endswith(".assignment.json"))
check("there are lessons", len(files) >= 4, len(files))
for f in files:
    les = json.loads(f.read_text())
    aid = f.stem
    asg = json.loads((B / "seed/lessons" / f"{aid}.assignment.json").read_text()) if (
        B / "seed/lessons" / f"{aid}.assignment.json").exists() else None
    check(f"{aid}: source and attribution", bool(les.get("source")) and "attribution" in les)
    for c in les["concepts"]:
        cid, lvl = c["concept_id"], c.get("explain_level")
        tag = f"{aid} {cid}"
        check(f"{tag}: explain_level set", lvl in ("given", "why", "use"), lvl)
        check(f"{tag}: 4 rungs", len(c["probe_ladder"]) == 4)
        for pat in c.get("idea_patterns", []):
            try:
                re.compile(pat)
            except re.error as e:
                check(f"{tag}: idea_pattern compiles", False, e)
        qs = list(c["probe_ladder"]) + list(c.get("concrete") or []) + list(c.get("connections") or []) + [c["friend_nudge"]]
        low = " ".join(qs).lower()
        for sp in c["spoilers"]:
            check(f"{tag}: own spoiler '{sp}' not in Pip's own questions", sp.lower() not in low)
        if lvl in ("given", "use"):
            for q in qs:
                check(f"{tag}: no 'why' ask on a {lvl} concept", not WHY.search(q), q)
        for x in c.get("connections") or []:
            check(f"{tag}: connection is one short question", x.count("?") == 1 and len(x.split()) <= 18, x)
    if asg:
        ids = {c["id"] for c in asg["concepts"]}
        check(f"{aid}: lesson concepts match the assignment", ids == {c["concept_id"] for c in les["concepts"]})

print(f"{len(fails)} failing")
sys.exit(1 if fails else 0)
