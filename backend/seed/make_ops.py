"""Generate seed_ops.json (CONTRACT v3.13/v3.13b): enrollments + packages, guardians, notes, threads.

Deterministic (fixed RNG seed). Dates are stored as offsets from "now" so the 7/14/30-day windows stay
meaningful whenever the demo is reset. All contacts are synthetic: 555-01xx numbers and @example.com.
Run from anywhere:  backend/.venv/bin/python backend/seed/make_ops.py
"""

import json
import random
import unicodedata
from pathlib import Path

HERE = Path(__file__).parent
R = random.Random(20261024)

center = json.loads((HERE / "seed_center.json").read_text())
raw = json.loads((HERE / "seed_sessions.json").read_text())
students = {s["id"]: dict(s) for s in center["students"]}
for sid in ("s005", "s009"):          # mirrors seed.py: SAT missions are grade 11
    students[sid]["grade"] = 11
for sid in ("s101", "s095"):          # mirrors seed.py AT_RISK_TO_T1
    students[sid]["tutor_id"] = "t1"
BUSY = {r["student_id"] for r in raw["sessions"]}               # have seeded Pip sessions
PICK = [sid for sid in sorted(students) if sid != "s001" and sid not in BUSY][:11]  # came back this week

TUTOR_SUBJECTS = {"t1": ["math", "writing"], "t2": ["writing", "sat_rw"], "t3": ["math", "sat_math"],
                  "t4": ["math", "sat_math"], "t5": ["sat_math", "math"], "t6": ["math", "science"],
                  "t7": ["writing", "sat_rw"], "t8": ["math", "science"]}
RATE = {"math": 55, "writing": 55, "science": 55, "sat_math": 80, "sat_rw": 80}   # USD per hour
HOURS = {"math": [8, 12, 16], "writing": [8, 12], "science": [8, 12], "sat_math": [12, 16, 24],
         "sat_rw": [12, 16, 24]}
GOALS = {
    "math": ["Confident with ratios before 7th grade", "Move from a B to an A in pre-algebra",
             "Explain the why, not just the steps", "Ready for Algebra 1 in the fall"],
    "writing": ["Organize a five-paragraph essay", "Use evidence in every body paragraph",
                "Fewer run-ons in school essays"],
    "science": ["Lab reports with a claim and evidence", "Ready for the district science fair"],
    "sat_math": ["SAT Math 650+ by March", "Finish the SAT Math section on time"],
    "sat_rw": ["SAT Reading & Writing 650+ by spring", "Stop losing points on comma questions"],
}
DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"]
TIMES = ["3:30pm", "4pm", "4:30pm", "5pm", "5:30pm", "6pm", "6:30pm"]
SAT_TIMES = ["9am", "10am", "11am", "12pm"]


def subjects_for(grade):
    return ["math", "writing", "science"] + (["sat_math", "sat_rw"] if grade >= 9 else [])


def slot():
    return f"Sat {R.choice(SAT_TIMES)}" if R.random() < 0.12 else f"{R.choice(DAYS)} {R.choice(TIMES)}"


# --------------------------------------------------------------- who gets which package story
SPECIAL = {"s001", "s002", "s005", "s009", "s014", "s035", "s040", "s095", "s101"}
pool = [sid for sid in sorted(students) if sid not in SPECIAL and sid not in BUSY and sid not in PICK]
R.shuffle(pool)
LOW_ENGAGED = ["s007", "s010", "s016"]          # low package but came back on their own this week
LOW = ["s035"] + LOW_ENGAGED + pool[0:5]          # + Maya's math (set below)
EXPIRING = ["s101", "s095"] + pool[5:8]           # 3-6 hours left but the term ends within 14 days
CHURNED = pool[8:17]                              # every package expired, last seen 5+ weeks ago
NEW = pool[17:23]                                 # first enrollment within the last 2 weeks
NO_CONTACT = ["s040"] + pool[23:32]               # no reachable guardian (~8%)


def package(subject, story):
    total = R.choice(HOURS[subject])
    if story == "low":
        left, renews = R.choice([0, 1, 2, 2]), R.randint(3, 30)
    elif story == "expiring":
        left, renews = R.randint(3, 6), R.randint(2, 13)
    elif story == "expired":
        left, renews = R.randint(0, 3), -R.randint(5, 30)
    elif story == "new":
        left, renews = total - R.randint(0, 2), R.randint(45, 80)
    else:
        left, renews = R.randint(3, total - 1), R.randint(16, 75)
    return {"hours_total": total, "hours_used": total - left, "price_usd": total * RATE[subject],
            "renews_in_days": renews}


enrollments = {}
for sid, st in sorted(students.items()):
    g, tid = st["grade"], st["tutor_id"]
    forced = {"s001": "math", "s005": "writing", "s009": "sat_math", "s014": "sat_math"}
    first_subj = forced.get(sid) or next(s for s in TUTOR_SUBJECTS[tid] if s in subjects_for(g))
    picks = [(first_subj, tid)]
    if sid == "s001":
        picks.append(("writing", "t2"))
    elif sid != "s014":
        extra = R.choices([0, 1, 2], weights=[55, 35, 10])[0]
        for subj in R.sample([s for s in subjects_for(g) if s != first_subj], k=extra):
            ts = [t for t, ss in TUTOR_SUBJECTS.items() if subj in ss]
            picks.append((subj, tid if tid in ts else R.choice(ts)))
    story = ("expired" if sid in CHURNED else "new" if sid in NEW else "low" if sid in LOW
             else "expiring" if sid in EXPIRING else "normal")
    rows = []
    for i, (subj, t) in enumerate(picks):
        s_story = story if (i == 0 or story in ("expired", "new")) else "normal"
        started = R.randint(3, 12) if story == "new" else R.randint(35, 320)
        attended = R.randint(36, 70) if story == "expired" else R.randint(0, min(7, started))
        rows.append({"id": f"en_{sid}_{subj}", "student_id": sid, "subject": subj, "tutor_id": t,
                     "slot": slot(), "goal": R.choice(GOALS[subj]) if R.random() < 0.6 else None,
                     "started_days_ago": started, "last_attended_days_ago": attended,
                     "package": package(subj, s_story)})
    enrollments[sid] = rows

# Fixed demo facts (CONTRACT v3.13 Rules)
m, w = enrollments["s001"]
m.update(slot="Tue 4:30pm", goal="Explain the why behind area formulas", started_days_ago=120,
         last_attended_days_ago=7,
         package={"hours_total": 12, "hours_used": 10, "price_usd": 660, "renews_in_days": 9})
w.update(slot="Thu 5pm", goal="Organize a five-paragraph essay", started_days_ago=45, last_attended_days_ago=5,
         package={"hours_total": 8, "hours_used": 3, "price_usd": 440, "renews_in_days": 40})
enrollments["s014"][0].update(slot="Wed 6pm", goal="SAT Math 650+ by March", started_days_ago=60,
                              last_attended_days_ago=3,
                              package={"hours_total": 16, "hours_used": 9, "price_usd": 1280,
                                       "renews_in_days": 33})

# --------------------------------------------------------------- guardians
FIRST = {
    "en": ["Jordan", "Chris", "Taylor", "Morgan", "Alex", "Jamie", "Pat", "Robin", "Dana", "Casey", "Kelly",
           "Erin", "Drew", "Avery", "Leslie", "Quinn", "Reese", "Shawn", "Toni", "Blair"],
    "es": ["Lucía", "Carlos", "María", "José", "Rosa", "Miguel", "Elena", "Jorge", "Carmen", "Luis", "Sofía"],
    "vi": ["Linh", "Minh", "Thu", "Huy", "Lan", "Tuấn", "Mai", "Đức"],
    "zh": ["Wei", "Mei", "Jing", "Hao", "Lin", "Yan", "Jun", "Xiu"],
}
AREAS = ["415", "510", "650", "408"]
used_phones = {"+1-415-555-0101", "+1-415-555-0102"}


def phone():
    while True:
        p = f"+1-{R.choice(AREAS)}-555-01{R.randint(0, 99):02d}"
        if p not in used_phones:
            used_phones.add(p)
            return p


def ascii_(s):
    return "".join(c for c in unicodedata.normalize("NFKD", s) if c.isascii()).lower()


guardians = [
    {"id": "g001", "name": "Ana R.", "relation": "parent", "phone": "+1-415-555-0101",
     "email": "ana.r@example.com", "prefers": "sms", "updates": "every_ko",
     "quiet_hours": "21:00-07:00", "student_ids": ["s001", "s014"]},
    {"id": "g002", "name": "Sam R.", "relation": "parent", "phone": "+1-415-555-0102",
     "email": "sam.r@example.com", "prefers": "email", "updates": "weekly",
     "quiet_hours": None, "student_ids": ["s001"]},
]
# families: siblings share a last initial; ~12 sibling pairs
rest = [sid for sid in sorted(students) if sid not in ("s001", "s014")]
by_initial = {}
for sid in rest:
    by_initial.setdefault(students[sid]["name"].split()[-1], []).append(sid)
families, pairs = [], 0
for initial, sids in sorted(by_initial.items()):
    sids = sids[:]
    R.shuffle(sids)
    while sids:
        if pairs < 12 and len(sids) >= 2 and R.random() < 0.5 and not (set(sids[:2]) & set(NO_CONTACT)):
            families.append(sids[:2])
            sids = sids[2:]
            pairs += 1
        else:
            families.append([sids.pop()])
n = 3
for fam in sorted(families):
    initial = students[fam[0]]["name"].split()[-1]
    if any(s in NO_CONTACT for s in fam):
        if R.random() < 0.5:
            continue                                   # no guardian on file at all
        lang = R.choices(["en", "es", "vi", "zh"], weights=[70, 18, 7, 5])[0]
        guardians.append({"id": f"g{n:03d}", "name": f"{R.choice(FIRST[lang])} {initial}",
                          "relation": "guardian", "phone": None, "email": None, "prefers": "sms",
                          "updates": "every_ko", "quiet_hours": None, "student_ids": fam})
        n += 1
        continue
    lang = R.choices(["en", "es", "vi", "zh"], weights=[70, 18, 7, 5])[0]
    for k in range(2 if R.random() < 0.3 else 1):
        first = R.choice(FIRST[lang])
        prefers = R.choices(["sms", "email"], weights=[65, 35])[0]
        has_phone = prefers == "sms" or R.random() < 0.5
        has_email = prefers == "email" or R.random() < 0.4
        guardians.append({
            "id": f"g{n:03d}", "name": f"{first} {initial}",
            "relation": R.choices(["parent", "grandparent", "guardian"], weights=[85, 8, 7])[0] if k == 0 else "parent",
            "phone": phone() if has_phone else None,
            "email": f"{ascii_(first)}.{ascii_(initial[0])}{n}@example.com" if has_email else None,
            "prefers": prefers,
            "updates": R.choices(["every_ko", "weekly", "off"], weights=[55, 35, 10])[0],
            "quiet_hours": "21:00-07:00" if R.random() < 0.6 else None, "student_ids": fam})
        n += 1

# --------------------------------------------------------------- notes
NOTE_SHARED = {
    "math": ["{f} explained the idea back to me in their own words today. Ask them to show you at home!",
             "{f} caught their own mistake today and fixed it without a hint.",
             "Great persistence today. {f} kept going on a tricky word problem."],
    "writing": ["{f}'s topic sentence was clear and specific today. Next step: adding evidence.",
                "{f} revised a paragraph on their own. Proud of the effort."],
    "science": ["{f} wrote a strong claim with evidence for the lab today."],
    "sat_math": ["{f} finished a timed set and checked every answer by plugging it back in."],
    "sat_rw": ["{f} spotted two comma splices on their own today."],
}
NOTE_PRIVATE = ["Rushes the last step; build in a 1-minute check routine.",
                "Quiet in group work. Pair with a patient partner next time.",
                "Parent asked about a schedule change. Check before the renewal.",
                "Responds well to drawing it first. Keep using pictures.",
                "Was tired today (late soccer practice). Keep the session short.",
                "Possible reading load issue on word problems. Read aloud first."]
notes = [
    {"id": "note_s001_1", "student_id": "s001", "tutor_id": "t1", "subject": "math", "days_ago": 6,
     "share_with_parent": False,
     "text": "Rushes to the formula. Ask her to draw the rectangle first; she gets it once she sees it."},
    {"id": "note_s001_2", "student_id": "s001", "tutor_id": "t1", "subject": "math", "days_ago": 3,
     "share_with_parent": True,
     "text": "Maya is starting area of triangles. She asks great why questions. Ask her to explain it to you at dinner!"},
    {"id": "note_s001_3", "student_id": "s001", "tutor_id": "t2", "subject": "writing", "days_ago": 2,
     "share_with_parent": True,
     "text": "Maya's paragraph about her soccer team had a clear topic sentence. Next step: adding evidence."},
    {"id": "note_s001_4", "student_id": "s001", "tutor_id": "t2", "subject": "writing", "days_ago": 2,
     "share_with_parent": False,
     "text": "Ana asked about switching writing to Wednesdays. Check before the math renewal."},
    {"id": "note_s014_1", "student_id": "s014", "tutor_id": "t3", "subject": "sat_math", "days_ago": 1,
     "share_with_parent": True,
     "text": "Theo fixed his sign rule for moving numbers across the equals sign. Nice work this week."},
    {"id": "note_s014_2", "student_id": "s014", "tutor_id": "t3", "subject": "sat_math", "days_ago": 1,
     "share_with_parent": False, "text": "Rushes timed sets; build in a 2-minute check routine."},
]
for sid in sorted(R.sample([s for s in rest if s != "s014"], k=45)):
    st = students[sid]
    for j in range(R.choice([1, 1, 2])):
        en = R.choice(enrollments[sid])
        share = R.random() < 0.5
        text = (R.choice(NOTE_SHARED[en["subject"]]).format(f=st["name"].split()[0]) if share
                else R.choice(NOTE_PRIVATE))
        notes.append({"id": f"note_{sid}_{j + 1}", "student_id": sid, "tutor_id": en["tutor_id"],
                      "subject": en["subject"], "days_ago": R.randint(0, 20), "share_with_parent": share,
                      "text": text})

# --------------------------------------------------------------- threads (English only: CONTRACT v3.16)
threads = [
    {"id": "tm_g001_1", "student_id": "s001", "guardian_id": "g001", "from": "tutor", "author_id": "t1",
     "minutes_ago": 6 * 1440 + 300, "status": "test-mode (not delivered)",
     "text": "Hi Ana, this is Ms. Rivera. This week Maya starts area of triangles and will teach it to Pip, "
             "her AI classmate. Ask her to explain it to you at home!"},
    {"id": "tm_g001_2", "student_id": "s001", "guardian_id": "g001", "from": "guardian", "author_id": "g001",
     "minutes_ago": 5 * 1440 + 900, "status": "received",
     "text": "Thank you, Ms. Rivera! Maya already told us two triangles make a rectangle. Can she practice at home?"},
    {"id": "tm_g001_3", "student_id": "s001", "guardian_id": "g001", "from": "tutor", "author_id": "t1",
     "minutes_ago": 5 * 1440 + 600, "status": "test-mode (not delivered)",
     "text": "Yes! She can open Pip any time, no homework required. See you Tuesday at 4:30."},
]
reachable = [g for g in guardians[2:] if g["phone"] or g["email"]]
for i, g in enumerate(R.sample(reachable, k=12)):
    sid = g["student_ids"][0]
    en = enrollments[sid][0]
    f = students[sid]["name"].split()[0]
    ago = R.randint(1, 6) * 1440 + R.randint(0, 600) if i < 8 else R.randint(9, 20) * 1440
    threads.append({"id": f"tm_{g['id']}_1", "student_id": sid, "guardian_id": g["id"], "from": "tutor",
                    "author_id": en["tutor_id"], "minutes_ago": ago + 240, "status": "test-mode (not delivered)",
                    "text": f"Hi {g['name'].split()[0]}, {f} had a strong session today. Ask {f} to teach you "
                            f"what they taught Pip!"})
    threads.append({"id": f"tm_{g['id']}_2", "student_id": sid, "guardian_id": g["id"], "from": "guardian",
                    "author_id": g["id"], "minutes_ago": ago, "status": "received",
                    "text": "Thanks so much! We'll keep practicing at home."})

# --------------------------------------------------------------- Theo's synthetic K.O. (sat_math, re-taught k2)
theo = {"assignment_from": "a_sat_linear", "assignment_id": "a_sat_linear_s014", "student_id": "s014",
        "tutor_id": "t3", "session_id": "sess_theo_ko", "days_ago": 2, "minutes": 12, "reteach_count": 1,
        "share_concept": "k2",   # Theo tapped "show my family this" on his re-teach explanation
        "brain": [{"concept_id": "k1", "correct": True,
                   "quote": "whatever you do to one side you have to do to the other or it stops being equal"},
                  {"concept_id": "k2", "correct": True, "fixed_after": 1,
                   "quote": "take the 6 away from both sides so its 2x = 14, then divide both sides by 2"},
                  {"concept_id": "k3", "correct": True,
                   "quote": "put 7 back in, 2 times 7 plus 6 is 20 so both sides match"}]}

# --------------------------------------------------------------- each student's own Pip (separate RNG: the data above
# stays byte-identical). Custom names only for students no scripted test/eval drives (their openings say "Pip").
RP = random.Random(31337)
SCRIPTED = BUSY | {"s001", "s002", "s005", "s009"}
CREATURES = ["capybara", "corgi", "cat", "raccoon", "frog", "axolotl"]
VIBES = ["cute", "cool", "ugly"]
ACCESSORIES = ["none", "none", "glasses", "scarf", "pencil", "badge", "backpack", "starclips", "charm", "visor", "shades"]
PIP_NAMES = ["Biscuit", "Nugget", "Pickles", "Mochi", "Turbo", "Waffles", "Sprout", "Pebble", "Zippy", "Noodle",
             "Captain", "Bean", "Toast", "Ziggy", "Pudding", "Rocket", "Tofu", "Gizmo", "Sushi", "Pepper"]
pips = {}
for i, sid in enumerate(sorted(students)):
    pips[sid] = {"name": "Pip" if sid in SCRIPTED or RP.random() < 0.55 else RP.choice(PIP_NAMES),
                 "creature": CREATURES[(i + RP.randint(0, 5)) % 6], "vibe": RP.choices(VIBES, weights=[35, 45, 20])[0],
                 "accessory": RP.choice(ACCESSORIES)}
# SAT goal progress (v3.15): target from the goal + practice scores, oldest first (separate RNG, data above unchanged)
RS = random.Random(650)
for sid, rows in enrollments.items():
    for e in rows:
        if e["subject"] in ("sat_math", "sat_rw"):
            m = __import__("re").search(r"(\d{3})\+", e["goal"] or "")
            target = int(m.group(1)) if m else 650
            start = target - RS.choice([70, 90, 110, 130])
            e["practice_scores"] = [start + k * RS.choice([10, 20, 30]) for k in range(RS.randint(2, 4))]
            e["target_score"] = target
enrollments["s014"][0].update(target_score=650, practice_scores=[560, 590, 610])

pips["s001"] = {"name": "Pip", "creature": "capybara", "vibe": "cool", "accessory": "none"}   # Maya's demo setup
pips["s014"] = {"name": "Turbo", "creature": "frog", "vibe": "cool", "accessory": "shades"}

# --------------------------------------------------------------- v3.18 student details (separate RNG; data above unchanged)
# Synthetic only: an illustrated initials badge (no photos of minors, ever), a made-up school, a birthday month.
RD = random.Random(318)
COLORS = ["#2a63f5", "#1a7030", "#8f5200", "#7a3fb0", "#0a6f94", "#b0306a", "#4a5a00", "#3d5a80", "#a8321f", "#006d6f"]
SCHOOLS = {"elem": ["Maple Grove Elementary", "Sunset Hill Elementary", "Fern Street Elementary"],
           "middle": ["Harbor View Middle School", "Cedar Park Middle School", "Mission Bay Middle School"],
           "high": ["Bayside High School", "Golden Ridge High School", "Lakeshore Prep"]}
MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
details = {}
for sid in sorted(students):
    st = students[sid]
    first, last = st["name"].split()[0], st["name"].split()[-1].rstrip(".")
    band = "elem" if st["grade"] <= 5 else "middle" if st["grade"] <= 8 else "high"
    details[sid] = {"avatar": {"initials": (first[0] + last[0]).upper(), "color": RD.choice(COLORS)},
                    "school": RD.choice(SCHOOLS[band]), "birthday_month": RD.choice(MONTHS),
                    "student_email": f"{ascii_(first)}.{ascii_(last)}{sid[1:]}@example.com" if st["grade"] >= 9 else None}
details["s001"].update(school="Harbor View Middle School", birthday_month="Mar")
details["s014"].update(school="Bayside High School", birthday_month="Nov")

out = {"_about": "Generated by backend/seed/make_ops.py (deterministic). Offsets are relative to reset time. "
                 "Synthetic people only: 555-01xx phones, @example.com emails.",
       "tz": "America/Los_Angeles", "tutor_subjects": TUTOR_SUBJECTS, "enrollments": enrollments,
       "guardians": guardians, "notes": notes, "threads": threads, "theo": theo, "pips": pips, "details": details}
(HERE / "seed_ops.json").write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
gids = {}
for g in guardians:
    for s in g["student_ids"]:
        gids.setdefault(s, []).append(g["id"])
print(f"{len(enrollments)} students, {sum(len(v) for v in enrollments.values())} enrollments, "
      f"{len(guardians)} guardians ({sum(len(v) for v in gids.values()) / len(students):.2f}/student), "
      f"{len(notes)} notes, {len(threads)} thread msgs; pick={PICK}")
