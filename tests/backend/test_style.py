"""B17: CONTRACT v3.14 style presets + "pick your vibe" tiles. Run from the repo root:
    PIP_FORCE_OFFLINE=1 backend/.venv/bin/python tests/backend/test_style.py
"""
import os
import re
import sys
from pathlib import Path

B = Path(os.environ.get("BACKEND_DIR", "backend")).resolve()
sys.path.insert(0, str(B))
import themes as T  # noqa: E402

fails = []


def check(label, ok, detail=""):
    print(("PASS " if ok else "FAIL ") + label, detail if not ok else "")
    if not ok:
        fails.append(label)


def pinkish(hexv):
    h, s, _ = T.hsl(hexv)
    return s >= 0.2 and 280 <= h <= 345


# 1. presets: enforced, stable, semantic slots locked
want = {"soft_pop", "kawaii_gel", "chrome_mech", "street", "cybercore", "grunge_ugly", "clean", "club", "y2k_aqua"}
check("all nine styles map to a preset", set(T.STYLES) == want and all(T.STYLES[k][0] in T.PRESET_BY_ID for k in want))
for p in T.STYLE_PRESETS:
    again, adj = T.enforce(p, p["base"])
    check(f"{p['id']}: passes enforcement and is stable", not T.violations(p) and adj == [], (T.violations(p), adj))
    check(f"{p['id']}: no pink in action/progress/win, boss coral",
          not any(pinkish(p["tokens"][k]) for k in ("action", "progress", "win"))
          and 0 <= T.hsl(p["tokens"]["boss"])[0] <= 20)
for pid in ("preset_soft_pop", "preset_kawaii_gel"):
    tk = T.PRESET_BY_ID[pid]["tokens"]
    check(f"{pid}: pink/lilac allowed in backgrounds", any(pinkish(tk[k]) for k in ("bg_from", "bg_to", "bubble_her",
                                                                                     "panel_edge")))
evil = {**T.PRESET_BY_ID["preset_soft_pop"], "id": None,
        "tokens": {**T.PRESET_BY_ID["preset_soft_pop"]["tokens"], "action": "#ff4fa8", "progress": "#ff7ac8"}}
fixed, adj = T.enforce(evil, "day")
check("pink action/progress still rejected on soft_pop", not pinkish(fixed["tokens"]["action"])
      and not pinkish(fixed["tokens"]["progress"]) and adj)
check("v3.8 gallery keeps its seven presets", len(T.PRESETS) == 7)

# 2. tiles -> style
check("nine tiles, no gender labels", len(T.STYLE_TILES) == 9 and not any(
    re.search(r"\b(boys?|girls?|male|female|his|hers?)\b", (t["label"] + t["id"]).lower()) for t in T.STYLE_TILES))
s = T.style_from_tiles
check("first pick weighs most (tough)", s(["chrome_bot", "skate_tags"])["style"] == "chrome_mech")
check("first pick weighs most (reversed)", s(["skate_tags", "chrome_bot"])["style"] == "street")
check("soft picks -> soft preset + cute", (s(["sparkle_pastel", "jelly_gel"])["style"], s(["sparkle_pastel"])["vibe"])
      == ("soft_pop", "cute"))
check("tough picks -> cool", s(["neon_scan", "club_lights"])["vibe"] == "cool")
mix = s(["sparkle_pastel", "chrome_bot"])
check("soft + tough mix -> blended grunge_ugly + ugly vibe", mix["style"] == "grunge_ugly" and mix["vibe"] == "ugly"
      and mix["blended"])
check("mix order does not matter when balanced", s(["chrome_bot", "sparkle_pastel"])["style"] == "grunge_ugly")
check("lopsided mix follows the majority", s(["sparkle_pastel", "jelly_gel", "skate_tags"])["style"] == "soft_pop")
check("register intensity follows the picks", (s(["plain_ink"])["register_intensity"],
                                               s(["skate_tags", "club_lights"])["register_intensity"],
                                               s(["jelly_gel", "chrome_bot"])["register_intensity"]) == ("low", "high", "mid"))
check("style names accepted as tiles", s(["cybercore"])["style"] == "cybercore")
for bad in ([], ["nope"], ["plain_ink"] * 4, "plain_ink", None):
    try:
        s(bad)
        check(f"bad tiles {bad!r} rejected", False)
    except ValueError:
        check(f"bad tiles {bad!r} rejected", True)

# 3. API
import eval_pip as E  # noqa: E402
client, server = E.load_app(B, "offline")
client.post("/api/demo/reset")
check("reset: no style by default (neutral)", "style" not in client.get("/api/students/s001").json()["student"])
tiles = client.get("/api/style/tiles").json()["tiles"]
check("GET /style/tiles", len(tiles) == 9 and all({"id", "label", "style"} <= set(t) for t in tiles))
r = client.post("/api/students/s001/style", json={"tiles": ["sparkle_pastel", "chrome_bot", "plain_ink"]})
j = r.json()
check("POST /students/{id}/style shape", r.status_code == 200 and {"theme", "vibe", "register_intensity"} <= set(j)
      and j["vibe"] in ("cute", "cool", "ugly") and j["register_intensity"] in ("low", "mid", "high"), j)
check("returned theme is safe", not T.violations(j["theme"]))
st = client.get("/api/students/s001").json()["student"]
check("Student.style stores the picks", st["style"]["tiles"] == ["sparkle_pastel", "chrome_bot", "plain_ink"]
      and st["style"]["vibe"] == j["vibe"] and st["theme_id"] == j["theme"]["id"], st.get("style"))
check("unknown tile 422", client.post("/api/students/s001/style", json={"tiles": ["x"]}).status_code == 422)
check("no tiles 422", client.post("/api/students/s001/style", json={}).status_code == 422)
check("unknown student 404", client.post("/api/students/zzz/style", json={"tiles": ["plain_ink"]}).status_code == 404)
check("style presets selectable by id", client.post("/api/students/s002/theme",
                                                    json={"theme_id": "preset_chrome_mech"}).status_code == 200)
g = client.get("/api/themes").json()
check("GET /themes: presets unchanged + styles listed", len(g["presets"]) == 7 and len(g["styles"]) == 7)
client.post("/api/demo/reset")
st = client.get("/api/students/s001").json()["student"]
check("reset clears Student.style", "style" not in st and st.get("theme_id") is None)

print(f"\n{len(fails)} failing")
sys.exit(1 if fails else 0)
