"""B15: crew, unlocks, dream, duo, egg/hatch, mini review. Run:
    BACKEND_DIR=backend backend/.venv/bin/python tests/backend/test_crew.py
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
TEACH = ["a triangle is half of a rectangle", "because two of them make a rectangle so one is half",
         "a rectangle is base times height, like 6×4 = 24"]


TEXTS = {"a_tri": TEACH, "a_sat_commas": E.PERSONAS["sat_commas"][3], "a_sat_linear": E.PERSONAS["sat_linear"][3]}


def ko(sid="s001", aid="a_tri"):
    s = client.post("/api/sessions", json={"assignment_id": aid, "student_id": sid}).json()
    for m in TEXTS[aid]:
        client.post(f"/api/sessions/{s['id']}/turn", json={"text": m})
    return client.post(f"/api/sessions/{s['id']}/quiz").json()


def student(sid="s001"):
    return client.get(f"/api/students/{sid}").json()["student"]


client.post("/api/demo/reset")
st = student()
check("reset: empty crew/unlocks, no dream", st["crew"] == [] and st["unlocks"] == [] and st["pip_dream"] is None
      and st["ko_count"] == 0 and st["brain_version"] == 1)
check("dream validated", client.post("/api/students/s001/dream", json={"dream": "dating"}).status_code == 422)

# first K.O. with no dream
q = ko()
p = q["payoff"]
check("K.O.: reformed boss joins with the deadpan line", p["new_crew"] and p["new_crew"][0]["kind"] == "reformed_boss"
      and p["new_crew"][0]["line"] == "I have recounted. It is half. I would like to join you.", p["new_crew"])
check("K.O.: v2 unlocks club_stage", p["unlocked"] == ["club_stage"] and "club_stage" in student()["unlocks"], p["unlocked"])
check("no dream -> no dream_unlock", p["dream_unlock"] is None)
check("egg not ready yet", p["egg_ready"] is False and client.post("/api/students/s001/hatch").status_code == 400)

# second K.O. on another boss: v3 unlocks, second reformed boss
q = ko("s001", "a_sat_commas")
check("K.O. #2 -> v3 unlocks runway_finale + mod_slot_2", set(q["payoff"]["unlocked"]) == {"runway_finale", "mod_slot_2"}, q["payoff"]["unlocked"])
check("v3 -> egg ready", q["payoff"]["egg_ready"] is True)
check("two reformed bosses, each with its own line", len([c for c in student()["crew"] if c["kind"] == "reformed_boss"]) == 2)
q = ko("s001", "a_tri")
check("same boss does not join twice", q["payoff"]["new_crew"] == [])

# duo once
check("duo needs a creature", client.post("/api/students/s001/duo", json={"creature": "unicorn"}).status_code == 422)
check("duo chosen", client.post("/api/students/s001/duo", json={"creature": "frog"}).json()["duo"]["kind"] == "duo")
check("duo only once", client.post("/api/students/s001/duo", json={"creature": "cat"}).status_code == 409)

# hatch + review
check("review before hatch is refused", client.post("/api/mini/s001/review").status_code == 409)
mini = client.post("/api/students/s001/hatch").json()["mini"]
check("hatched mini joins the crew", mini["kind"] == "mini" and any(c["kind"] == "mini" for c in student()["crew"]))
check("hatch only once", client.post("/api/students/s001/hatch").status_code == 409)
r = client.post("/api/mini/s001/review").json()
check("review session: mini opens with a verbatim old rule", r["kind"] == "review" and r["transcript"][0]["text"].count("'") >= 2
      and r["review"]["rule"] in r["transcript"][0]["text"])
check("review is not a regular assignment of the student",
      all(a["id"] != r["assignment_id"] for a in client.get("/api/students/s001").json()["assignments"]))
n = 0
for m in ("a skinny triangle is still half of its rectangle", "because two of them make the rectangle so one is half, 6×4÷2 = 12"):
    r = client.post(f"/api/sessions/{r['id']}/turn", json={"text": m}).json()
    n += 1
    if r["status"] == "complete":
        break
check("review completes in <= 3 texts", r["status"] == "complete" and n <= 3, (r["status"], n))
st = student()
check("counts as a spaced review", st["reviews"] == 1 and len(st["review_log"]) == 1)
check("review does not touch brain version or K.O. count", st["brain_version"] == 3 and st["ko_count"] == 3)

# dream unlocks, one line each
LINES = {"fame": "i just headlined the club stage. you're welcome.", "squad": "duke wants to be in the group photo. fine.",
         "creator": "i made a jacket out of your half-rule.", "family": "the egg is wobbling. i didn't do anything.",
         "explorer": "there's a new place on the map. it's shaped like a triangle."}
for dream, line in LINES.items():
    client.post("/api/demo/reset")
    client.post("/api/students/s001/dream", json={"dream": dream})
    q = ko()
    du = q["payoff"]["dream_unlock"]
    check(f"dream {dream}: first K.O. unlock + line", du and du["line"] == line and du["id"] in student()["unlocks"], du)
client.post("/api/demo/reset")
client.post("/api/students/s001/dream", json={"dream": "fame"})
ids = [ko("s001", a)["payoff"]["dream_unlock"]["id"] for a in ("a_tri", "a_sat_commas", "a_sat_linear")]
check("fame progression club_show -> runway -> arena_concert", ids == ["club_show", "runway", "arena_concert"], ids)
client.post("/api/demo/reset")
client.post("/api/students/s001/dream", json={"dream": "family"})
check("family: egg after the first K.O. (before v3)", ko()["payoff"]["egg_ready"] is True and student()["brain_version"] == 2)
client.post("/api/demo/reset")
st = student()
check("reset clears everything again", st["crew"] == [] and st["unlocks"] == [] and st["pip_dream"] is None and st["reviews"] == 0)

print(f"\n{len(fails)} failing")
sys.exit(1 if fails else 0)
