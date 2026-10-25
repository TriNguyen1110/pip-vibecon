"""B16/B16b/B18: center operations (CONTRACT v3.13, v3.13b, v3.15, v3.16). Run from the repo root:
    PIP_FORCE_OFFLINE=1 backend/.venv/bin/python tests/backend/test_center.py
"""
import json
import os
import re
import sys
import time
from datetime import date, datetime, timedelta, timezone
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
import center  # noqa: E402  (same module object the server uses)

REAL_CLOCK = center.clock
TEACH = ["a triangle is half of a rectangle", "because two of them make a rectangle so one is half",
         "a rectangle is base times height, like 6×4 = 24"]
GAME_WORDS = re.compile(r"K\.\s?O|\bKO\b|\bboss|brain\s*v|weapon|levell?ed up", re.I)
FORBIDDEN_KEYS = ('"transcript"', '"brain"', '"minutes"', '"since_last_session"', '"interests"', '"turn_log"',
                  '"last_session_at"', '"created_at"')


def get(path, code=200):
    r = client.get(path)
    assert r.status_code == code, (path, r.status_code, r.text[:300])
    return r.json()


def post(path, body=None, code=200):
    r = client.post(path, json=body or {})
    assert r.status_code == code, (path, r.status_code, r.text[:300])
    return r.json()


def has(obj, keys):
    return isinstance(obj, dict) and all(k in obj for k in keys)


def ko(sid="s001", aid="a_tri"):
    s = post("/api/sessions", {"assignment_id": aid, "student_id": sid})
    for m in TEACH:
        post(f"/api/sessions/{s['id']}/turn", {"text": m})
    return post(f"/api/sessions/{s['id']}/quiz")


def parent_blobs(gid):
    home = get(f"/api/parent/{gid}/home")
    out = [json.dumps(home, ensure_ascii=False)]
    for sid in home["guardian"]["student_ids"]:
        out.append(json.dumps(get(f"/api/parent/{gid}/kids/{sid}"), ensure_ascii=False))
    return out


post("/api/demo/reset")

# ------------------------------------------------------------------ seed facts
maya = get("/api/students/s001")["student"]
ens = {e["subject"]: e for e in maya["enrollments"]}
check("Maya: math with Ms. Rivera Tue 4:30pm + writing with Mr. Chen Thu 5pm",
      set(ens) == {"math", "writing"} and ens["math"]["tutor_id"] == "t1" and ens["math"]["slot"] == "Tue 4:30pm"
      and ens["writing"]["tutor_id"] == "t2" and ens["writing"]["slot"] == "Thu 5pm", ens)
check("Maya: guardians g001 + g002, auto_ko_note off", maya["guardian_ids"] == ["g001", "g002"]
      and maya["auto_ko_note"] is False)
check("Maya's math package is low (renewal due)", ens["math"]["package"]["status"] == "low", ens["math"]["package"])
home = get("/api/parent/g001/home")
g1 = home["guardian"]
check("g001 Ana R.: parent, sms, every_ko, kids s001 + s014 (no language field: English only)",
      (g1["name"], g1["relation"], g1["prefers"], g1["updates"], g1["student_ids"])
      == ("Ana R.", "parent", "sms", "every_ko", ["s001", "s014"]) and "language" not in g1, g1)
g2 = get("/api/parent/g002/home")["guardian"]
check("g002 Sam R.: parent, email, weekly", (g2["name"], g2["prefers"], g2["updates"]) == ("Sam R.", "email", "weekly"))
theo = get("/api/students/s014")["student"]
check("s014: grade 9, sat_math", theo["grade"] == 9 and [e["subject"] for e in theo["enrollments"]] == ["sat_math"])
thread = get("/api/threads?student_id=s001&guardian_id=g001")["items"]
check("seeded Rivera <-> g001 thread, in English", len(thread) >= 3 and {m["from"] for m in thread} >= {"tutor", "guardian"}
      and thread[0]["text"].startswith("Hi Ana") and not any("translation" in m or "language" in m for m in thread))
check("thread oldest first", [m["ts"] for m in thread] == sorted(m["ts"] for m in thread))
students = [get(f"/api/students/s{i:03d}")["student"] for i in range(1, 121)]
check("every student has 1-3 enrollments", all(1 <= len(s["enrollments"]) <= 3 for s in students))
avg_g = sum(len(s["guardian_ids"]) for s in students) / len(students)
check("~1.3 guardians per student", 1.15 <= avg_g <= 1.45, avg_g)
rows_all = [r for t in get("/api/tutors")["tutors"] for r in get(f"/api/tutors/{t['id']}/students")["rows"]]
nc = {r["student"]["id"] for r in rows_all if "no_contact" in r["flags"]}
check("~8% no_contact", 6 <= len(nc) <= 14, len(nc))
seed_ops = json.loads((B / "seed" / "seed_ops.json").read_text())
check("synthetic contacts only (555-01xx, @example.com)",
      all(center.PHONE_RE.match(g["phone"]) for g in seed_ops["guardians"] if g.get("phone"))
      and all(g["email"].endswith("@example.com") for g in seed_ops["guardians"] if g.get("email")))
check("seed is English only", not any("language" in g for g in seed_ops["guardians"])
      and not any("translation" in m for m in seed_ops["threads"]))
check("existing at-risk unchanged (4) and insight 14", len(get("/api/center/at-risk")["students"]) == 4
      and get("/api/center")["insight"]["count"] == 14)
subj = {a["id"]: a.get("subject") for s in ("s001", "s002", "s005", "s009") for a in get(f"/api/students/{s}")["assignments"]}
check("Assignment.subject: a_tri/a_frac math, a_sat_commas writing, a_sat_linear sat_math",
      (subj.get("a_tri"), subj.get("a_frac"), subj.get("a_sat_commas"), subj.get("a_sat_linear"))
      == ("math", "math", "writing", "sat_math"), subj)

# ------------------------------------------------------------------ contract shapes
SUBJ = get("/api/subjects")["subjects"]
check("GET /subjects shape", all(has(s, ["id", "name", "has_missions"]) for s in SUBJ) and len(SUBJ) == 5)
T = get("/api/tutors")["tutors"]
check("GET /tutors shape", len(T) == 8 and all(has(t, ["id", "name", "subjects", "students", "at_risk"]) for t in T))
L = get("/api/tutors/t1/students")
row_ok = all(has(r, ["student", "subjects", "guardians", "flags", "next_slot", "pip"])
             and all(has(c, ["subject", "last_active", "ko_count", "flag"]) for c in r["subjects"])
             and all(has(g, ["id", "name", "reachable"]) for g in r["guardians"])
             and set(r["flags"]) <= set(center.FLAGS) for r in L["rows"])
check("GET /tutors/{id}/students shape", has(L, ["tutor", "rows"]) and row_ok and L["rows"])
check("students list: subject filter", all(any(c["subject"] == "writing" and c["mine"] for c in r["subjects"])
                                          for r in get("/api/tutors/t1/students?subject=writing")["rows"]))
check("students list: q search", [r["student"]["id"] for r in get("/api/tutors/t1/students?q=maya")["rows"]] == ["s001"])
ar = get("/api/tutors/t1/students?filter=at_risk")["rows"]
check("students list: filter=at_risk", ar and all("at_risk" in r["flags"] for r in ar), len(ar))
check("students list: bad filter 422", client.get("/api/tutors/t1/students?filter=nope").status_code == 422)
P = get("/api/students/s001/profile")
prog_ok = all(has(p, ["subject", "tutor", "missions_done", "ko_count", "last_session_at", "next_slot", "mastery",
                      "open_misconception", "at_risk"]) for p in P["progress"])
check("GET /students/{id}/profile shape", has(P, ["student", "enrollments", "progress", "guardians", "notes", "timeline",
                                                  "pip", "shares", "auto_ko_note"])
      and prog_ok and all(has(t, ["ts", "kind", "subject", "text", "link"]) and t["kind"] in
                          ("session", "ko", "update", "message", "note") for t in P["timeline"]))
O = get("/api/center/overview")
check("GET /center/overview shape", has(O, ["by_subject", "by_tutor", "parents_reachable_pct", "updates_sent_7d",
                                             "renewals_due", "revenue_at_risk_usd", "retention_30d_pct",
                                             "parent_updates_7d", "parent_replies_7d", "tutor_hours_saved_week",
                                             "came_back_on_their_own_7d"])
      and all(has(r, ["student", "guardian", "subject", "hours_left", "renews_on", "price_usd", "signal", "note_preview"])
              and r["signal"] in ("engaged", "quiet") for r in O["renewals_due"]))
check("overview numbers are believable", O["revenue_at_risk_usd"] > 0 and O["parent_updates_7d"] > 0
      and O["parent_replies_7d"] > 0 and 80 <= O["retention_30d_pct"] <= 99 and 85 <= O["parents_reachable_pct"] <= 95
      and sum(1 for r in O["renewals_due"] if r["signal"] == "engaged") >= 2)
check("came_back_on_their_own_7d matches /center", O["came_back_on_their_own_7d"] == get("/api/center")["came_back_this_week"])
check("tutor_hours_saved_week = (updates + gap reports) x 10 min",
      O["tutor_hours_saved_week"] == round((O["parent_updates_7d"] + O["tutor_hours_saved_basis"]["gap_reports"]) * 10 / 60, 1))
H = get("/api/parent/g001/home")
check("GET /parent/{gid}/home shape", has(H, ["guardian", "kids", "unread"]) and all(
    has(k, ["student", "pip", "this_week", "subjects", "goal_progress"])
    and has(k["this_week"], ["sessions", "missions", "kos", "taught_quote", "fixed", "shared_note"])
    and "minutes" not in k["this_week"]
    and all(has(s, ["subject", "tutor", "next_slot", "ko_count", "package"]) for s in k["subjects"]) for k in H["kids"]))
K = get("/api/parent/g001/kids/s014")
check("GET /parent/{gid}/kids/{sid} shape", has(K, ["student", "weeks", "shared_notes", "next_sessions", "tutors",
                                                    "reports", "shares", "goal_progress"])
      and all(has(w, ["week_of", "summary", "quotes", "fixed", "from"]) for w in K["weeks"]) and K["weeks"])

# ------------------------------------------------------------------ parent access isolation
check("g001 sees exactly s001 + s014", sorted(k["student"]["id"] for k in H["kids"]) == ["s001", "s014"])
check("g001 -> s002 is 403", client.get("/api/parent/g001/kids/s002").status_code == 403)
check("g002 -> s014 is 403 (not Sam's kid)", client.get("/api/parent/g002/kids/s014").status_code == 403)
check("unknown guardian 404", client.get("/api/parent/g999/home").status_code == 404)
check("guardian cannot post about another family's kid",
      client.post("/api/threads", json={"student_id": "s002", "guardian_id": "g001", "from": "guardian",
                                        "text": "hi"}).status_code == 403)

# ------------------------------------------------------------------ v3.15: the tutor is the filter
blobs = parent_blobs("g001") + parent_blobs("g002")
check("no transcript, brain, minutes or activity timestamps in parent payloads",
      not any(k in b for b in blobs for k in FORBIDDEN_KEYS), [k for b in blobs for k in FORBIDDEN_KEYS if k in b])
items = [i for k in ("s001", "s014") for i in get(f"/api/parent/g001/kids/{k}")["reports"]
         + get(f"/api/parent/g001/kids/{k}")["shares"] + get(f"/api/parent/g001/kids/{k}")["shared_notes"]]
check("every parent item carries from", items and all(has(i.get("from"), ["name"]) and
                                                      ("tutor_id" in i["from"] or "student_id" in i["from"]) for i in items))
hm = {k["student"]["id"]: k for k in get("/api/parent/g001/home")["kids"]}
check("Maya (grade 6): nothing reaches the family until her tutor sends", hm["s001"]["this_week"]["taught_quote"] is None
      and get("/api/parent/g001/kids/s001")["reports"] == [])
tq = hm["s014"]["this_week"]
check("Theo (grade 9): the quote is the one he shared, labeled from Theo", tq["taught_quote"] and tq["taught_from"]
      == {"student_id": "s014", "name": "Theo Y."}, tq)
check("Theo (SAT): goal progress shown (target vs latest)", hm["s014"]["goal_progress"]
      and hm["s014"]["goal_progress"][0]["target"] == 650 and hm["s014"]["goal_progress"][0]["latest"] == 610)
check("Theo's report quote is his share (no auto pick)", all(r["quote"] in (None, tq["taught_quote"])
                                                            for r in get("/api/parent/g001/kids/s014")["reports"]))
older = [s for s in students if s["grade"] >= 7 and s["guardian_ids"] and s["id"] not in ("s014",)]
leak = []
for st in older:
    rows = [r for r in get("/api/sent-log")["items"] if r["student_id"] == st["id"]]
    shares = get(f"/api/students/{st['id']}/profile")["shares"]
    for r in rows:
        if r.get("quote") and r.get("quote_source") == "auto":
            leak.append((st["id"], r["quote"]))
    fv = get(f"/api/students/{st['id']}/family-view")
    q = fv["card"]["this_week"]["taught_quote"]
    if q and q not in [x["quote"] for x in shares] and q not in [r.get("quote") for r in rows]:
        leak.append((st["id"], q))
check("grade >= 7: no auto-picked quote anywhere a parent can see", not leak, leak[:3])

# share validation
s_t = get("/api/sessions/sess_theo_ko")
pip_i = next(i for i, m in enumerate(s_t["transcript"]) if m["from"] == "pip")
stu_i = [i for i, m in enumerate(s_t["transcript"]) if m["from"] == "student"]
check("share: Pip's message rejected", client.post("/api/sessions/sess_theo_ko/share", json={"msg_index": pip_i}).status_code == 422)
check("share: out of range rejected", client.post("/api/sessions/sess_theo_ko/share", json={"msg_index": 999}).status_code == 422)
check("share: not an int rejected", client.post("/api/sessions/sess_theo_ko/share", json={"msg_index": "1"}).status_code == 422)
check("share: someone else's session rejected", client.post("/api/sessions/sess_theo_ko/share",
                                                            json={"msg_index": stu_i[0], "student_id": "s001"}).status_code == 403)
check("share: unknown session 404", client.post("/api/sessions/nope/share", json={"msg_index": 0}).status_code == 404)
sh = post("/api/sessions/sess_theo_ko/share", {"msg_index": stu_i[0], "student_id": "s014"})
check("share: returns the share with the verbatim message", has(sh, ["id", "student_id", "session_id", "msg_index", "quote"])
      and sh["quote"] == s_t["transcript"][stu_i[0]]["text"] and sh["from"]["student_id"] == "s014")
check("share: idempotent per message", post("/api/sessions/sess_theo_ko/share", {"msg_index": stu_i[0]})["id"] == sh["id"])
check("share: visible to the family", sh["quote"] in json.dumps(get("/api/parent/g001/kids/s014"), ensure_ascii=False))

# family-view == parent view
for sid, gid in (("s001", "g001"), ("s014", "g001"), ("s001", "g002")):
    fv = get(f"/api/students/{sid}/family-view")
    card = next(k for k in get(f"/api/parent/{gid}/home")["kids"] if k["student"]["id"] == sid)
    check(f"family-view({sid}) equals what {gid} sees", fv["card"] == card and fv["detail"] == get(f"/api/parent/{gid}/kids/{sid}"))
check("family-view has family_shared events", any(e["kind"] == "family_shared" for e in get("/api/students/s014/family-view")["events"]))

# ------------------------------------------------------------------ private notes never reach parents
secret = "PRIVATE-NOTE-do-not-share-7731"
post("/api/students/s001/notes", {"tutor_id": "t1", "subject": "math", "text": secret, "share_with_parent": False})
shared = post("/api/students/s001/notes", {"tutor_id": "t1", "subject": "math",
                                           "text": "Maya explained her rule out loud today.", "share_with_parent": True})
check("POST notes returns a Note", has(shared, ["id", "student_id", "tutor_id", "subject", "text", "ts", "share_with_parent"]))
private_texts = [n["text"] for sid in ("s001", "s014") for n in get(f"/api/students/{sid}/profile")["notes"]
                 if not n["share_with_parent"]]
blobs = parent_blobs("g001") + parent_blobs("g002")
check("private notes appear in staff profile", secret in private_texts)
check("no private note text in any parent payload", not any(t in b for t in private_texts for b in blobs))
check("shared note reaches the parent, from Ms. Rivera", shared["text"] in blobs[1]
      and get("/api/parent/g001/kids/s001")["shared_notes"][0]["from"] == {"tutor_id": "t1", "name": "Ms. Rivera"})
check("parent tone: no behind/failing/rankings", not any(center.BANNED.search(b) for b in blobs))

# ------------------------------------------------------------------ B16b: parent copy (English, proud, no game words)
pv = post("/api/sessions/sess_maya_saved/parent-update/preview")
check("preview is a tutor-approved English draft to g001 + g002", pv["approval"] == "tutor"
      and {x["guardian_id"] for x in pv["by_guardian"]} == {"g001", "g002"} and all(x["message"] == pv["message"]
                                                                                for x in pv["by_guardian"]))
check("draft is proud and specific", "taught Pip why a triangle's area is half of base" in pv["message"]
      and "caught and fixed a mistake" in pv["message"], pv["message"])
check("grade 6 draft may carry an auto quote, verbatim", pv["quote_source"] == "auto" and f'"{pv["quote"]}"' in pv["message"])
rn = get("/api/center/overview")["renewals_due"]
mrn = next(r for r in rn if r["student"]["id"] == "s001")
check("Maya's renewal note cites her verbatim quote", mrn["evidence_quote"] and f'"{mrn["evidence_quote"]}"' in mrn["note_preview"]
      and mrn["note_preview"].startswith("Hi Ana"), mrn["note_preview"])
ISO = re.compile(r"\b20\d\d-\d\d-\d\d\b")
check("renewal notes use readable dates, never ISO", all(not ISO.search(r["note_preview"] or "") for r in rn)
      and center.nice_date(mrn["renews_on"]) in mrn["note_preview"], mrn["note_preview"])
th_rep = [r for r in get("/api/parent/g001/kids/s014")["reports"] if r.get("quote")]
check("report body drops the hero quote; text keeps it for SMS/email", th_rep and all(
    r["quote"] in r["text"] and r["quote"] not in r["body"] and len(r["body"]) > 20 for r in th_rep), th_rep[:1])
check("weekly summaries use the quote-free body", all(q_ not in w["summary"] for w in get("/api/parent/g001/kids/s014")["weeks"]
                                                      for q_ in w["quotes"] if w["summary"]))
check("no ISO dates in parent-facing text", not any(ISO.search(x) for x in
                                                    [r["text"] for r in get("/api/parent/g001/kids/s014")["reports"]]))
trn = [r for r in rn if r["student"]["id"] == "s014"]
check("no game words in any parent copy (payloads, drafts, renewal notes)",
      not any(GAME_WORDS.search(b) for b in parent_blobs("g001") + parent_blobs("g002") + [pv["message"]]
              + [r["note_preview"] or "" for r in rn]),
      [GAME_WORDS.search(b).group(0) for b in parent_blobs("g001") + [pv["message"]] if GAME_WORDS.search(b)])
for t in (center.update_template({"first": "Maya", "topic": "Area", "quote": "x y z", "fixed": True, "ko": True,
                                  "tutor": "Ms. Rivera"}),
          center.auto_note({"first": "Maya", "topic": "Area", "tutor": "Ms. Rivera"})):
    check("templates pass the parent copy rules", center.parent_clean(t), t)
pips = [r["pip"] for r in rows_all]
check("every row has its own Pip", all(has(p, ["name", "creature", "vibe", "accessory", "brain_version", "form"])
                                       for p in pips)
      and len({p["creature"] for p in pips}) == 6 and len({p["vibe"] for p in pips}) == 3)
check("Maya keeps her demo Pip", get("/api/students/s001/profile")["pip"] == {
    "name": "Pip", "creature": "capybara", "vibe": "cool", "accessory": "none", "brain_version": 1, "form": "base"})
check("parent payloads carry the kid's Pip", get("/api/parent/g001/home")["kids"][1]["pip"]["name"] == "Turbo"
      and get("/api/parent/g001/kids/s014")["pip"]["creature"] == "frog")

# ------------------------------------------------------------------ quiet hours
SID = "sess_maya_saved"
TZ = center.TZ
night = datetime.now(TZ).replace(hour=22, minute=30, second=0, microsecond=0)
center.clock = lambda: night.astimezone(timezone.utc)
pv = post(f"/api/sessions/{SID}/parent-update/preview")
byg = {x["guardian_id"]: x for x in pv["by_guardian"]}
check("preview flags quiet hours for g001 at 22:30", byg["g001"]["quiet_hours_now"] and not byg["g002"]["quiet_hours_now"])
sent = post(f"/api/sessions/{SID}/parent-update/send", {"message": pv["message"]})
rows = {r["guardian_id"]: r for r in sent["sent_all"]}
exp = (night + timedelta(days=1)).replace(hour=7, minute=0).astimezone(timezone.utc).isoformat(timespec="seconds")
check("g001 send at 22:30 is queued (quiet hours) until 07:00",
      rows["g001"]["status"] == "queued (quiet hours)" and rows["g001"]["deliver_after"] == exp, rows["g001"])
check("g002 (no quiet hours) is a test-mode send", rows["g002"]["status"] == "test-mode (not delivered)")
check("sent rows carry from + the approved quote", rows["g001"]["from"] == {"tutor_id": "t1", "name": "Ms. Rivera"}
      and rows["g001"]["quote"] == pv["quote"])
check("each send is in the sent log", {r["id"] for r in sent["sent_all"]} <= {r["id"] for r in get("/api/sent-log")["items"]})
tm = post("/api/threads", {"student_id": "s001", "guardian_id": "g001", "from": "tutor", "author_id": "t1",
                           "text": "See you Tuesday!"})
check("tutor thread message at night is queued", tm["status"] == "queued (quiet hours)")
early = datetime.now(TZ).replace(hour=6, minute=59, second=0, microsecond=0)
center.clock = lambda: early.astimezone(timezone.utc)
check("06:59 still quiet", center.quiet_until({"quiet_hours": "21:00-07:00"}) is not None)
noon = datetime.now(TZ).replace(hour=12, minute=0, second=0, microsecond=0)
center.clock = lambda: noon.astimezone(timezone.utc)
tm = post("/api/threads", {"student_id": "s001", "guardian_id": "g001", "from": "tutor", "author_id": "t1",
                           "text": "See you Tuesday!"})
check("tutor thread message at noon is test-mode, labeled", tm["status"] == "test-mode (not delivered)"
      and tm["via"] == "sms" and tm["author"] == {"tutor_id": "t1", "name": "Ms. Rivera"})
rep = post("/api/threads", {"student_id": "s001", "guardian_id": "g001", "from": "guardian", "text": "Thanks!"})
check("guardian reply is received", rep["status"] == "received" and rep["author_id"] == "g001")
center.clock = REAL_CLOCK
ev = [e for e in get("/api/students/s001/family-view")["events"] if e["kind"] == "family_shared"]
check("student gets family_shared events for each tutor send", len(ev) >= 3 and ev[0]["text"].endswith("shared this with your family"))

# ------------------------------------------------------------------ guardians create/patch
bad = client.post("/api/guardians", json={"name": "X", "phone": "+1-415-867-5309", "student_ids": ["s002"]})
check("real-looking phone rejected (synthetic 555-01xx only)", bad.status_code == 422)
bad = client.post("/api/guardians", json={"name": "X", "email": "x@gmail.com", "student_ids": ["s002"]})
check("non-example.com email rejected", bad.status_code == 422)
ng = post("/api/guardians", {"name": "Kim N.", "relation": "grandparent", "phone": "+1-510-555-0177",
                             "updates": "weekly", "student_ids": ["s002"]})
check("POST /guardians returns Guardian and links the kid", has(ng, ["id", "name", "relation", "phone", "email", "prefers",
                                                                  "updates", "quiet_hours", "student_ids"])
      and "language" not in ng and ng["id"] in get("/api/students/s002")["student"]["guardian_ids"])
check("PATCH language is not a field (English only)", client.patch(f"/api/guardians/{ng['id']}", json={"language": "es"}).status_code == 422)
check("PATCH rejects unknown fields", client.patch(f"/api/guardians/{ng['id']}", json={"student_ids": ["s001"]}).status_code == 422)
check("PATCH validates quiet_hours", client.patch(f"/api/guardians/{ng['id']}", json={"quiet_hours": "late"}).status_code == 422)
en = post("/api/students/s002/enrollments", {"subject": "science", "tutor_id": "t6", "slot": "Mon 5pm", "goal": None})
check("POST enrollments returns Enrollment with a package", has(en, ["id", "student_id", "subject", "tutor_id", "slot", "goal",
                                                                      "started", "package"]))
check("enrollment slot validated", client.post("/api/students/s002/enrollments",
                                              json={"subject": "math", "tutor_id": "t1", "slot": "sometime"}).status_code == 422)

# ------------------------------------------------------------------ bulk assign
a_tri = [a for a in get("/api/students/s001")["assignments"] if a["id"] == "a_tri"][0]
bulk = post("/api/assignments/bulk", {"assignment": a_tri, "student_ids": ["s002", "s003", "s004", "s003"]})["assignments"]
ids = [a["id"] for a in bulk]
check("bulk assign: one copy per student, distinct ids", len(bulk) == 3 and len(set(ids)) == 3 and "a_tri" not in ids
      and [a["student_id"] for a in bulk] == ["s002", "s003", "s004"], ids)
check("bulk copies keep the mission + subject", all(a["topic"] == a_tri["topic"] and a["subject"] == "math"
                                                    and a["source_id"] == "a_tri" and len(a["quiz"]) == 3 for a in bulk))
check("bulk copy is visible on the student", ids[1] in [a["id"] for a in get("/api/students/s003")["assignments"]])
check("bulk with unknown student 404", client.post("/api/assignments/bulk", json={"assignment": a_tri,
                                                                                  "student_ids": ["nope"]}).status_code == 404)

# ------------------------------------------------------------------ grade >= 7 live path: no auto quote, share wins
post("/api/demo/reset")
q7 = ko("s002", "a_tri")   # Sid N., grade 9
d7 = post(f"/api/sessions/{q7['id']}/parent-update/preview")
check("grade 9 draft: no auto quote", d7["quote"] is None and '"' not in d7["message"], d7["message"])
mi = next(i for i, m in enumerate(q7["transcript"]) if m["from"] == "student")
d7b = post(f"/api/sessions/{q7['id']}/parent-update/preview", {"msg_index": mi})
check("tutor can pick the quote (a student message)", d7b["quote"] == q7["transcript"][mi]["text"] and d7b["quote_source"] == "tutor")
post(f"/api/sessions/{q7['id']}/share", {"msg_index": mi + 2})
d7c = post(f"/api/sessions/{q7['id']}/parent-update/preview", {"msg_index": mi})
check("the student's own share wins over the tutor pick", d7c["quote"] == q7["transcript"][mi + 2]["text"]
      and d7c["quote_source"] == "student")
check("auto note cannot be enabled for grade >= 7", client.post("/api/students/s002/auto-ko-note",
                                                               json={"enabled": True}).status_code == 422)

# ------------------------------------------------------------------ overview math (independent recompute) + Maya's K.O.
post("/api/demo/reset")


def recompute():
    risk = {r["student_id"] for r in get("/api/center/at-risk")["students"]}
    today = datetime.now(center.TZ).date()
    total = 0
    for i in range(1, 121):
        sid = f"s{i:03d}"
        prof = get(f"/api/students/{sid}/profile")
        for e in prof["enrollments"]:
            p = e["package"]
            due = p["status"] != "expired" and (p["status"] == "low" or
                                                date.fromisoformat(p["renews_on"]) <= today + timedelta(days=14))
            if due and (sid in risk or prof["signal"] == "quiet"):
                total += p["price_usd"]
    return total


O = get("/api/center/overview")
check("revenue_at_risk = sum of qualifying packages (recomputed from profiles)", O["revenue_at_risk_usd"] == recompute(),
      O["revenue_at_risk_usd"])
mrow = next(r for r in O["renewals_due"] if r["student"]["id"] == "s001")
check("Maya's renewal is quiet before her K.O.", mrow["signal"] == "quiet" and mrow["guardian"]["id"] == "g001")
kos_before = {x["subject"]: x["kos_7d"] for x in O["by_subject"]}["math"]
q = ko()
check("demo K.O. on a_tri", q["ko"] is True)
O2 = get("/api/center/overview")
mrow2 = next(r for r in O2["renewals_due"] if r["student"]["id"] == "s001")
check("Maya's K.O. flips her renewal to engaged", mrow2["signal"] == "engaged" and mrow2["evidence_quote"], mrow2)
check("revenue_at_risk drops by Maya's package", O2["revenue_at_risk_usd"] == O["revenue_at_risk_usd"] - mrow["price_usd"])
check("math kos_7d +1", {x["subject"]: x["kos_7d"] for x in O2["by_subject"]}["math"] == kos_before + 1)
check("after the K.O. Maya needs an update", "needs_update" in get("/api/tutors/t1/students?q=maya")["rows"][0]["flags"])
check("auto_ko_note off: nothing sent on the K.O.", not [r for r in get("/api/sent-log")["items"] if r["student_id"] == "s001"])
hk = next(k for k in get("/api/parent/g001/home")["kids"] if k["student"]["id"] == "s001")
check("parent sees no quote before the tutor sends", hk["this_week"]["taught_quote"] is None)
P = get("/api/students/s001/profile")
mp = next(p for p in P["progress"] if p["subject"] == "math")
check("profile: K.O. counted, mastery >= 2 on all concepts", mp["ko_count"] == 1 and all(m["level"] >= 2 for m in mp["mastery"]))
check("timeline has the K.O. with a report link", P["timeline"][0]["kind"] == "ko" and P["timeline"][0]["link"] == f"/tutor/report/{q['id']}")
upd0 = O2["parent_updates_7d"]
pv = post(f"/api/sessions/{q['id']}/parent-update/preview")
post(f"/api/sessions/{q['id']}/parent-update/send", {"message": pv["message"]})
hk = next(k for k in get("/api/parent/g001/home")["kids"] if k["student"]["id"] == "s001")
check("after the tutor sends, the family sees the approved quote from Ms. Rivera",
      hk["this_week"]["taught_quote"] == pv["quote"] and hk["this_week"]["taught_from"]["name"] == "Ms. Rivera"
      and any(pv["quote"] in m["text"] for m in q["transcript"] if m["from"] == "student"))
O3 = get("/api/center/overview")
check("send clears needs_update and counts 2 updates (both guardians)",
      "needs_update" not in get("/api/tutors/t1/students?q=maya")["rows"][0]["flags"] and O3["parent_updates_7d"] == upd0 + 2)

# auto_ko_note (grade <= 6 opt-in)
post("/api/demo/reset")
check("enable auto note for Maya (grade 6)", post("/api/students/s001/auto-ko-note", {"enabled": True})["auto_ko_note"] is True)
ko()
auto = [r for r in get("/api/sent-log")["items"] if r["student_id"] == "s001"]
check("auto note goes out at the K.O. without review, no quote", len(auto) == 2 and all(r["auto"] and r["quote"] is None
                                                                                        for r in auto), auto[:1])
check("auto note passes the parent copy rules", all(center.parent_clean(r["message"]) for r in auto))

# ------------------------------------------------------------------ v3.15b drafts ("To send" queue)
post("/api/demo/reset")
DRAFT_KEYS = ["id", "student_id", "tutor_id", "session_id", "subject", "topic", "kind", "status", "created_at", "quote",
              "fixed", "moments", "by_guardian"]
dl = get("/api/students/s001/drafts")["items"]
check("seeded draft for Maya's saved run, fixture shape", len(dl) == 1 and has(dl[0], DRAFT_KEYS)
      and dl[0]["session_id"] == "sess_maya_saved" and dl[0]["status"] == "draft"
      and all(has(x, ["guardian_id", "name", "via", "message"]) for x in dl[0]["by_guardian"])
      and all(has(m, ["session_id", "msg_index", "text", "shared"]) for m in dl[0]["moments"]), dl[:1])
d0 = dl[0]
check("grade 6 draft: auto quote with msg_index, verbatim in the message", d0["quote"]["source"] == "auto"
      and d0["quote"]["shared"] is False and all(f'"{d0["quote"]["text"]}"' in x["message"] for x in d0["by_guardian"]))
check("drafts carry no game words", not any(GAME_WORDS.search(x["message"]) for x in d0["by_guardian"]))
pick = next(m for m in d0["moments"] if m["text"] != d0["quote"]["text"])
pd = client.patch(f"/api/drafts/{d0['id']}", json={"quote": {"session_id": pick["session_id"], "msg_index": pick["msg_index"]}}).json()
check("PATCH quote -> tutor pick, messages rewritten", pd["quote"]["source"] == "tutor" and pd["quote"]["text"] == pick["text"]
      and all(pick["text"] in x["message"] for x in pd["by_guardian"]))
pip_i = next(i for i, m in enumerate(get("/api/sessions/sess_maya_saved")["transcript"]) if m["from"] == "pip")
check("PATCH quote must be the student's message", client.patch(f"/api/drafts/{d0['id']}", json={
    "quote": {"session_id": "sess_maya_saved", "msg_index": pip_i}}).status_code == 422)
check("PATCH quote from another student's session rejected", client.patch(f"/api/drafts/{d0['id']}", json={
    "quote": {"session_id": "sess_theo_ko", "msg_index": 1}}).status_code == 422)
pn = client.patch(f"/api/drafts/{d0['id']}", json={"quote": None}).json()
check("PATCH quote null -> no quote", pn["quote"] is None and not any('"' in x["message"] for x in pn["by_guardian"]))
pe = client.patch(f"/api/drafts/{d0['id']}", json={"by_guardian": [{"guardian_id": "g002", "message": "Hi Sam, Maya did great."}]}).json()
check("PATCH by_guardian edits one guardian's text", {x["guardian_id"]: x["message"] for x in pe["by_guardian"]}["g002"]
      == "Hi Sam, Maya did great.")
sd = post(f"/api/drafts/{d0['id']}/send", {"by_guardian": [{"guardian_id": "g001", "message": pe["by_guardian"][0]["message"]},
                                                          {"guardian_id": "g002", "message": "Hi Sam, Maya did great."}]})
check("send -> {sent_all, draft}, one row per guardian, draft sent", has(sd, ["sent_all", "draft"]) and len(sd["sent_all"]) == 2
      and sd["draft"]["status"] == "sent" and {r["guardian_id"]: r["message"] for r in sd["sent_all"]}["g002"] == "Hi Sam, Maya did great.")
check("sent draft leaves the queue; resend is 409", get("/api/students/s001/drafts")["items"] == []
      and client.post(f"/api/drafts/{d0['id']}/send", json={}).status_code == 409)
check("family sees the sent report, from Ms. Rivera", get("/api/parent/g001/kids/s001")["reports"][0]["from"]["name"] == "Ms. Rivera")
q = ko()
dk = get("/api/students/s001/drafts")["items"]
check("a K.O. auto-creates a report draft (auto_ko_note off)", len(dk) == 1 and dk[0]["session_id"] == q["id"]
      and dk[0]["kind"] == "report")
check("POST drafts is idempotent for the same session", post("/api/students/s001/drafts", {"session_id": q["id"]})["id"] == dk[0]["id"])
sk = post(f"/api/drafts/{dk[0]['id']}/skip")
check("skip -> draft skipped", sk["status"] == "skipped" and get("/api/students/s001/drafts")["items"] == [])
nd = post("/api/students/s001/drafts", {})
check("POST drafts builds from the latest K.O.", nd["session_id"] == q["id"] and nd["status"] == "draft" and has(nd, DRAFT_KEYS))
q9 = ko("s002", "a_tri")
d9 = get("/api/students/s002/drafts")["items"][0]
check("grade 9 K.O. draft: no auto quote", d9["quote"] is None and d9["fixed"] is None
      and not any('"' in x["message"] for x in d9["by_guardian"]))
mi9 = next(m for m in d9["moments"])
post(f"/api/sessions/{q9['id']}/share", {"msg_index": mi9["msg_index"]})
d9b = post("/api/students/s002/drafts", {"session_id": q9["id"]})
check("existing pending draft is returned (no duplicate)", d9b["id"] == d9["id"])
d9c = client.patch(f"/api/drafts/{d9['id']}", json={"quote": {"session_id": q9["id"], "msg_index": mi9["msg_index"]}}).json()
check("picking a shared moment -> source student, shared true", d9c["quote"]["source"] == "student" and d9c["quote"]["shared"])
dth = post("/api/students/s014/drafts", {"session_id": "sess_theo_ko"})
check("SAT draft carries goal {target, latest}", dth["goal"] and dth["goal"]["target"] == 650 and dth["goal"]["latest"] == 610
      and dth["quote"]["source"] == "student")
check("settings: auto_ko_note 422 for grade >= 7", client.patch("/api/students/s002/settings", json={"auto_ko_note": True}).status_code == 422)
st6 = client.patch("/api/students/s001/settings", json={"auto_ko_note": True}).json()
check("settings: grade 6 -> {student}", st6["student"]["auto_ko_note"] is True and st6["student"]["id"] == "s001")
ko()
auto = [d for d in get(f"/api/students/s001/profile")["shares"]]  # noqa: F841 (shares untouched)
sent_auto = [r for r in get("/api/sent-log")["items"] if r["student_id"] == "s001" and r.get("auto")]
check("auto_ko_note on: the K.O. sends a short ko_note right away", len(sent_auto) == 2 and all(r["quote"] is None for r in sent_auto)
      and get("/api/students/s001/drafts")["items"][0]["session_id"] != sent_auto[0]["session_id"])

# ------------------------------------------------------------------ speed (memory store, 120 students)
def ms(path, n=5):
    t = time.perf_counter()
    for _ in range(n):
        client.get(path)
    return (time.perf_counter() - t) * 1000 / n


tp, to = ms("/api/students/s001/profile"), ms("/api/center/overview")
check("profile < 100 ms", tp < 100, f"{tp:.1f} ms")
check("overview < 100 ms", to < 100, f"{to:.1f} ms")

# ------------------------------------------------------------------ reset restores everything
client.patch("/api/guardians/g001", json={"quiet_hours": None})
post("/api/students/s001/notes", {"tutor_id": "t1", "subject": "math", "text": secret, "share_with_parent": False})
post("/api/assignments/bulk", {"assignment": a_tri, "student_ids": ["s010"]})
post("/api/demo/reset")
g1 = get("/api/parent/g001/home")["guardian"]
check("reset: g001 restored", g1["quiet_hours"] == "21:00-07:00")
check("reset: notes restored", secret not in json.dumps(get("/api/students/s001/profile")["notes"]))
check("reset: no extra guardians", ng["id"] not in json.dumps(get("/api/students/s002")["student"]))
check("reset: bulk copies gone", len(get("/api/students/s010")["assignments"]) == 0)
check("reset: auto note off, Maya's sent log empty", get("/api/students/s001")["student"]["auto_ko_note"] is False
      and not [r for r in get("/api/sent-log")["items"] if r["student_id"] == "s001"])
check("reset: shares back to Theo's one", [x["id"] for x in get("/api/students/s014/profile")["shares"]] == ["share_theo_1"]
      and get("/api/students/s002/profile")["shares"] == [])
check("reset: same revenue at risk", get("/api/center/overview")["revenue_at_risk_usd"] == O["revenue_at_risk_usd"])

print(f"\n{len(fails)} failing")
sys.exit(1 if fails else 0)
