"""B19: mascot accessory/form validation. Run from the repo root:
    PIP_FORCE_OFFLINE=1 backend/.venv/bin/python tests/backend/test_mascot.py
"""
import os
import re
import sys
from pathlib import Path

B = Path(os.environ.get("BACKEND_DIR", "backend")).resolve()
ROOT = B.parent
sys.path.insert(0, str(B))
import mascot as M  # noqa: E402

fails = []


def check(label, ok, detail=""):
    print(("PASS " if ok else "FAIL ") + label, detail if not ok else "")
    if not ok:
        fails.append(label)


def js_list(file, name):
    src = (ROOT / "frontend" / "src" / "pip2d" / file).read_text()
    m = re.search(rf"export const {name}\s*=\s*\[([^\]]*)\]", src)
    return re.findall(r"'([^']+)'", m.group(1)) if m else None


# 1. one list, in step with the frontend
front = {"y2k.jsx": "ACCESSORIES_2D", "club.jsx": "CLUB_ACCESSORIES", "earned.jsx": "EARNED_ITEMS"}
ids = set()
for f, name in front.items():
    lst = js_list(f, name)
    check(f"frontend {name} found", lst is not None)
    ids |= set(lst or [])
check("every frontend accessory id is accepted by the backend", ids <= set(M.ACCESSORIES), sorted(ids - set(M.ACCESSORIES)))
check("backend ids exist on the frontend (except legacy)", set(M.ACCESSORIES) - set(M.LEGACY_ACCESSORIES) <= ids,
      sorted(set(M.ACCESSORIES) - set(M.LEGACY_ACCESSORIES) - ids))

# 2. clean_accessory
c = M.clean_accessory
check("club ids kept", [c(x) for x in M.CLUB_ACCESSORIES] == list(M.CLUB_ACCESSORIES))
check("earned ids kept", c("half_pin") == "half_pin" and c("fixed_it_star") == "fixed_it_star")
check("legacy ids kept", c("cap") == "cap")
check("unknown -> none", c("crown") == "none" and c(None) == "none" and c(7) == "none")
check("array of valid ids kept in order", c(["shades_neon", "chain"]) == ["shades_neon", "chain"])
check("array capped at 3", c(["shades_neon", "chain", "puffer", "headphones_dj"]) == ["shades_neon", "chain", "puffer"])
check("array drops invalid, duplicates and none", c(["chain", "crown", "chain", "none", "visor"]) == ["chain", "visor"])
check("array with one id -> string", c(["puffer", "nope"]) == "puffer")
check("empty array -> none", c([]) == "none" and c(["nope"]) == "none")
check("forms", M.clean_form("main") == "main" and M.clean_form("base") == "base" and M.clean_form("chad") == "base")

# 3. API: sessions keep what the student picked
import eval_pip as E  # noqa: E402
client, server = E.load_app(B, "offline")
client.post("/api/demo/reset")


def session(**kw):
    return client.post("/api/sessions", json={"assignment_id": "a_tri", "student_id": "s001", **kw}).json()


check("POST /sessions keeps a club accessory", session(accessory="headphones_dj")["accessory"] == "headphones_dj")
check("POST /sessions keeps an earned item", session(accessory="fixed_it_star")["accessory"] == "fixed_it_star")
check("POST /sessions keeps a combined look", session(accessory=["shades_neon", "chain", "puffer"])["accessory"]
      == ["shades_neon", "chain", "puffer"])
check("POST /sessions still rejects unknown ids", session(accessory="crown")["accessory"] == "none")
check("POST /sessions stores form main", session(form="main")["form"] == "main" and session()["form"] == "base")
check("unknown form -> base", session(form="alpha")["form"] == "base")
st = client.get("/api/students/s001").json()["student"]
check("student pip view still valid", client.get("/api/students/s001/profile").json()["pip"]["accessory"] == "none" and st)
client.post("/api/demo/reset")

print(f"\n{len(fails)} failing")
sys.exit(1 if fails else 0)
