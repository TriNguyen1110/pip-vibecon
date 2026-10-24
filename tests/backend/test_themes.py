"""B14: theme enforcement with adversarial themes + API. Run:
    BACKEND_DIR=backend backend/.venv/bin/python tests/backend/test_themes.py
"""
import copy
import os
import sys
from pathlib import Path

B = Path(os.environ.get("BACKEND_DIR", "backend")).resolve()
sys.path.insert(0, str(B))
os.environ["PIP_FORCE_OFFLINE"] = "1"
import logging  # noqa: E402
logging.disable(logging.INFO)
import themes as T  # noqa: E402

fails = []


def check(label, ok, detail=""):
    print(("PASS " if ok else "FAIL ") + label, detail if not ok else "")
    if not ok:
        fails.append(label)


def theme(**tok):
    base = copy.deepcopy(T.PRESET_BY_ID["preset_daylight"])
    base["tokens"].update(tok)
    base.pop("id", None)
    return base


# 1. white on white
e, adj = T.enforce(theme(bg_from="#ffffff", bg_to="#ffffff", panel="#ffffff", ink="#ffffff", ink_muted="#fafafa",
                         bubble_pip="#ffffff", bubble_her="#ffffff", panel_edge="#ffffff"))
check("white on white: ink and muted fixed", not T.violations(e), T.violations(e))
check("white on white: changes reported", any(a.startswith("ink:") for a in adj) and any(a.startswith("panel_edge:") for a in adj), adj)
check("white on white: hue kept (neutral stays neutral)", T.hsl(e["tokens"]["ink"])[1] < 0.1)

# 2. coral action
e, adj = T.enforce(theme(action="#ff6b5e", action_ink="#ffffff"))
ah = T.hsl(e["tokens"]["action"])[0]
bh = T.hsl(e["tokens"]["boss"])[0]
check("coral action moved away from boss", T.hue_gap(ah, bh) >= 30 and not T.violations(e), (ah, bh, T.violations(e)))
check("coral action reported", any(a.startswith("action:") for a in adj), adj)

# 3. neon on neon
e, adj = T.enforce(theme(bg_from="#00ff88", bg_to="#33ff99", panel="#66ffaa", ink="#00ff00", ink_muted="#22ff66",
                         action="#00ff00", action_ink="#33ff33", progress="#00ff55", win="#aaff00",
                         bubble_pip="#00ff88", bubble_her="#44ffaa", panel_edge="#55ff99"))
check("neon on neon: every pair passes", not T.violations(e), T.violations(e))
check("neon on neon: backgrounds untouched", e["tokens"]["bg_from"] == "#00ff88" and e["tokens"]["panel"] == "#66ffaa")

# 4. boss not coral
for bad in ("#2255ff", "#00cc66", "#808080", "#ffcc00"):
    e, adj = T.enforce(theme(boss=bad))
    hb = T.hsl(e["tokens"]["boss"])[0]
    check(f"boss {bad} forced to coral hue 0-20", 0 <= hb <= 20 and not T.violations(e), (hb, T.violations(e)))

# 5. progress pink / too close to boss; action and win lilac
e, adj = T.enforce(theme(progress="#ff66cc", win="#cc88ff", action="#dd66ff", action_ink="#000000"))
check("pink/lilac and progress hue repaired", not T.violations(e), T.violations(e))
e, adj = T.enforce(theme(progress="#ff8a3d"))
ph = T.hsl(e["tokens"]["progress"])[0]
check("progress >= 60 degrees from boss", T.hue_gap(ph, T.hsl(e["tokens"]["boss"])[0]) >= 60 and 90 <= ph <= 170, ph)

# 6. words and pattern
e, adj = T.enforce({**theme(), "name": "f" + "uck this", "vibe_line": "x" * 200, "pattern": "lasers", "pattern_opacity": 0.9})
check("profane name becomes neutral", e["name"] == T.NEUTRAL_NAME, e["name"])
check("vibe_line truncated to 60", len(e["vibe_line"]) <= 60 and len(e["vibe_line"]) > 0)
check("pattern opacity capped", e["pattern_opacity"] <= 0.06, e["pattern_opacity"])
e, _ = T.enforce({**theme(), "name": "A really long theme name that goes on and on", "pattern": "none"})
check("name truncated to 24, no pattern -> opacity 0", len(e["name"]) <= 24 and e["pattern_opacity"] == 0, (e["name"], e["pattern_opacity"]))

# 7. garbage in
e, adj = T.enforce({"tokens": {"ink": "red", "boss": 12, "bg_from": "#12"}, "radius": "triangle", "pattern": "x"})
check("garbage tokens fall back and pass", not T.violations(e) and e["radius"] == "round" and e["pattern"] == "none", T.violations(e))
e, adj = T.enforce(None)
check("None input is safe", not T.violations(e))
e, adj = T.enforce({"tokens": {"ink": "#fff"}})
check("3-digit hex accepted", e["tokens"]["ink"].startswith("#") and len(e["tokens"]["ink"]) == 7)

# 8. presets: pass, idempotent, names as specified
check("seven presets", [p["name"] for p in T.PRESETS] == ["Daylight Arcade", "Club", "Runway", "Vaporwave", "Y2K Aqua",
                                                         "Notebook", "Night Forest"], [p["name"] for p in T.PRESETS])
for p in T.PRESETS:
    again, adj2 = T.enforce(p, p["base"])
    check(f"preset {p['name']} passes and is stable", not T.violations(p) and adj2 == [], (T.violations(p), adj2))

# 9. keyword fallback
for prompt, name in [("neon rave", "Club"), ("fashion runway", "Runway"), ("vaporwave mall at 3am", "Vaporwave"),
                     ("y2k", "Y2K Aqua"), ("my notebook", "Notebook"), ("dark forest", "Night Forest"),
                     ("something else entirely", "Daylight Arcade")]:
    check(f"'{prompt}' -> {name}", T.preset_for(prompt)["name"] == name, T.preset_for(prompt)["name"])
check("night base default", T.preset_for("qwerty", "night")["name"] == "Night Forest")

# 9b. fuzz: random palettes always come out valid
import random  # noqa: E402
random.seed(7)
bad = 0
for _ in range(300):
    th = {"name": "x", "tokens": {k: "#%06x" % random.randrange(1 << 24) for k in T.TOKENS}, "pattern": "grid",
          "pattern_opacity": random.random()}
    bad += bool(T.violations(T.enforce(th)[0]))
check("300 random palettes all valid after enforcement", bad == 0, bad)

# 9c. AI path (mocked llm): adversarial output is enforced, errors fall back to a preset
import asyncio  # noqa: E402
import llm  # noqa: E402
llm.available = lambda: True


async def evil(*a, **k):
    return {**theme(bg_from="#ffffff", bg_to="#ffffff", panel="#ffffff", ink="#ffffff", boss="#0000ff"),
            "name": "Rave", "vibe_line": "loud"}


async def boom(*a, **k):
    raise llm.LlmError("timeout")


llm.structured = evil
out = asyncio.run(T.generate("neon rave"))
check("AI theme enforced", out["source"] == "ai" and not T.violations(out["theme"]) and out["adjusted"], out["adjusted"])
llm.structured = boom
out = asyncio.run(T.generate("neon rave"))
check("AI error -> preset", out["source"] == "preset" and out["theme"]["name"] == "Club")
llm.available = lambda: False

# 10. API
import eval_pip as E  # noqa: E402
client, server = E.load_app(B, "offline")
client.post("/api/demo/reset")
r = client.post("/api/themes/generate", json={"prompt": "neon rave", "base": "night"}).json()
check("generate offline -> preset Club", r["source"] == "preset" and r["theme"]["name"] == "Club" and r["adjusted"] == [], r["theme"]["name"])
g = client.get("/api/themes").json()
check("gallery has presets, no mods yet", len(g["presets"]) == 7 and g["mods"] == [])
evil = theme(ink="#ffffff", boss="#0000ff")
evil["name"] = "Mine"
ok = client.post("/api/students/s001/theme", json={"theme": evil}).json()
check("save a mod (re-enforced server-side)", ok["ok"] and ok["theme_id"].startswith("t_"), ok)
mods = client.get("/api/themes").json()["mods"]
check("mod listed, safe", len(mods) == 1 and not T.violations(mods[0]), mods and T.violations(mods[0]))
st = client.get("/api/students/s001").json()["student"]
check("active theme saved on student", st["theme_id"] == ok["theme_id"] and st["theme"]["name"] == "Mine")
check("pick a preset by id", client.post("/api/students/s001/theme", json={"theme_id": "preset_club"}).json()["theme_id"] == "preset_club")
check("unknown id is 404", client.post("/api/students/s001/theme", json={"theme_id": "nope"}).status_code == 404)
check("empty body is 422", client.post("/api/students/s001/theme", json={}).status_code == 422)
client.post("/api/demo/reset")
check("reset clears mods", client.get("/api/themes").json()["mods"] == [])

print(f"\n{len(fails)} failing")
sys.exit(1 if fails else 0)
