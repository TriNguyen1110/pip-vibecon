"""B16: center operations (CONTRACT v3.13 + v3.13b). Run from the repo root:
    PIP_FORCE_OFFLINE=1 backend/.venv/bin/python tests/backend/test_center.py
"""
import json
import os
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


post("/api/demo/reset")

# ------------------------------------------------------------------ seed facts
maya = get("/api/students/s001")["student"]
ens = {e["subject"]: e for e in maya["enrollments"]}
check("Maya: math with Ms. Rivera Tue 4:30pm + writing with Mr. Chen Thu 5pm",
      set(ens) == {"math", "writing"} and ens["math"]["tutor_id"] == "t1" and ens["math"]["slot"] == "Tue 4:30pm"
      and ens["writing"]["tutor_id"] == "t2" and ens["writing"]["slot"] == "Thu 5pm", ens)
check("Maya: guardians g001 + g002", maya["guardian_ids"] == ["g001", "g002"], maya["guardian_ids"])
check("Maya's math package is low (renewal due)", ens["math"]["package"]["status"] == "low", ens["math"]["package"])
home = get("/api/parent/g001/home")
g1 = home["guardian"]
check("g001 Ana R.: parent, sms, es, every_ko, kids s001 + s014",
      (g1["name"], g1["relation"], g1["prefers"], g1["language"], g1["updates"], g1["student_ids"])
      == ("Ana R.", "parent", "sms", "es", "every_ko", ["s001", "s014"]), g1)
g2 = get("/api/parent/g002/home")["guardian"]
check("g002 Sam R.: parent, email, en, weekly", (g2["name"], g2["prefers"], g2["language"], g2["updates"])
      == ("Sam R.", "email", "en", "weekly"), g2)
theo = get("/api/students/s014")["student"]
check("s014: grade 9, sat_math", theo["grade"] == 9 and [e["subject"] for e in theo["enrollments"]] == ["sat_math"])
thread = get("/api/threads?student_id=s001&guardian_id=g001")["items"]
check("seeded Rivera <-> g001 thread", len(thread) >= 3 and {m["from"] for m in thread} >= {"tutor", "guardian"}
      and any(m["author_id"] == "t1" for m in thread), [m["from"] for m in thread])
check("thread oldest first", [m["ts"] for m in thread] == sorted(m["ts"] for m in thread))
students = [get(f"/api/students/s{i:03d}")["student"] for i in range(1, 121)]
check("every student has 1-3 enrollments", all(1 <= len(s["enrollments"]) <= 3 for s in students),
      [s["id"] for s in students if not 1 <= len(s["enrollments"]) <= 3])
avg_g = sum(len(s["guardian_ids"]) for s in students) / len(students)
check("~1.3 guardians per student", 1.15 <= avg_g <= 1.45, avg_g)
rows_all = [r for t in get("/api/tutors")["tutors"] for r in get(f"/api/tutors/{t['id']}/students")["rows"]]
nc = {r["student"]["id"] for r in rows_all if "no_contact" in r["flags"]}
check("~8% no_contact", 6 <= len(nc) <= 14, len(nc))
seed_ops = json.loads((B / "seed" / "seed_ops.json").read_text())
contacts = [g.get("phone") for g in seed_ops["guardians"] if g.get("phone")]
emails = [g.get("email") for g in seed_ops["guardians"] if g.get("email")]
check("synthetic contacts only (555-01xx, @example.com)",
      all(center.PHONE_RE.match(p) for p in contacts) and all(e.endswith("@example.com") for e in emails))
check("existing at-risk unchanged (4) and insight 14", len(get("/api/center/at-risk")["students"]) == 4
      and get("/api/center")["insight"]["count"] == 14)
subj = {a["id"]: a.get("subject") for s in ("s001", "s002", "s005", "s009") for a in get(f"/api/students/{s}")["assignments"]}
check("Assignment.subject: a_tri/a_frac math, a_sat_commas writing, a_sat_linear sat_math",
      (subj.get("a_tri"), subj.get("a_frac"), subj.get("a_sat_commas"), subj.get("a_sat_linear"))
      == ("math", "math", "writing", "sat_math"), subj)

# ------------------------------------------------------------------ contract shapes
SUBJ = get("/api/subjects")["subjects"]
check("GET /subjects shape", all(has(s, ["id", "name", "has_missions"]) for s in SUBJ) and len(SUBJ) == 5
      and {s["id"]: s["has_missions"] for s in SUBJ}["math"] is True)
T = get("/api/tutors")["tutors"]
check("GET /tutors shape", len(T) == 8 and all(has(t, ["id", "name", "subjects", "students", "at_risk"]) for t in T))
L = get("/api/tutors/t1/students")
row_ok = all(has(r, ["student", "subjects", "guardians", "flags", "next_slot"])
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
check("GET /students/{id}/profile shape", has(P, ["student", "enrollments", "progress", "guardians", "notes", "timeline"])
      and prog_ok and all(has(t, ["ts", "kind", "subject", "text", "link"]) and t["kind"] in
                          ("session", "ko", "update", "message", "note") for t in P["timeline"]))
check("mastery levels 0..3", all(0 <= m["level"] <= 3 for p in P["progress"] for m in p["mastery"]))
O = get("/api/center/overview")
check("GET /center/overview shape", has(O, ["by_subject", "by_tutor", "parents_reachable_pct", "updates_sent_7d",
                                             "renewals_due", "revenue_at_risk_usd", "retention_30d_pct",
                                             "parent_updates_7d", "parent_replies_7d", "tutor_hours_saved_week",
                                             "came_back_on_their_own_7d"])
      and all(has(x, ["subject", "students", "tutors", "kos_7d"]) for x in O["by_subject"])
      and all(has(x, ["tutor", "students", "subjects", "needs_update"]) for x in O["by_tutor"])
      and all(has(r, ["student", "guardian", "subject", "hours_left", "renews_on", "price_usd", "signal"])
              and r["signal"] in ("engaged", "quiet") for r in O["renewals_due"]))
check("overview numbers are believable", O["revenue_at_risk_usd"] > 0 and O["parent_updates_7d"] > 0
      and O["parent_replies_7d"] > 0 and 80 <= O["retention_30d_pct"] <= 99 and 85 <= O["parents_reachable_pct"] <= 95
      and sum(1 for r in O["renewals_due"] if r["signal"] == "engaged") >= 2, {k: O[k] for k in (
          "revenue_at_risk_usd", "parent_updates_7d", "parent_replies_7d", "retention_30d_pct", "parents_reachable_pct")})
check("came_back_on_their_own_7d matches /center", O["came_back_on_their_own_7d"] == get("/api/center")["came_back_this_week"])
check("tutor_hours_saved_week = (updates + gap reports) x 10 min",
      O["tutor_hours_saved_week"] == round((O["parent_updates_7d"] + O["tutor_hours_saved_basis"]["gap_reports"]) * 10 / 60, 1))
H = get("/api/parent/g001/home")
check("GET /parent/{gid}/home shape", has(H, ["guardian", "kids", "unread"]) and all(
    has(k, ["student", "pip", "this_week", "subjects"]) and has(k["pip"], ["name", "creature", "brain_version", "form"])
    and has(k["this_week"], ["minutes", "missions", "kos", "taught_quote", "fixed", "shared_note"])
    and all(has(s, ["subject", "tutor", "next_slot", "ko_count"]) for s in k["subjects"]) for k in H["kids"]))
K = get("/api/parent/g001/kids/s014")
check("GET /parent/{gid}/kids/{sid} shape", has(K, ["student", "weeks", "shared_notes", "next_sessions", "tutors"])
      and all(has(w, ["week_of", "summary", "quotes", "fixed"]) for w in K["weeks"]) and K["weeks"])

# ------------------------------------------------------------------ parent access isolation
check("g001 sees exactly s001 + s014", sorted(k["student"]["id"] for k in H["kids"]) == ["s001", "s014"])
check("g001 -> s002 is 403", client.get("/api/parent/g001/kids/s002").status_code == 403)
check("g002 -> s014 is 403 (not Sam's kid)", client.get("/api/parent/g002/kids/s014").status_code == 403)
check("unknown guardian 404", client.get("/api/parent/g999/home").status_code == 404)
check("guardian cannot post about another family's kid",
      client.post("/api/threads", json={"student_id": "s002", "guardian_id": "g001", "from": "guardian",
                                        "text": "hi"}).status_code == 403)

# ------------------------------------------------------------------ private notes never reach parents
secret = "PRIVATE-NOTE-do-not-share-7731"
post("/api/students/s001/notes", {"tutor_id": "t1", "subject": "math", "text": secret, "share_with_parent": False})
shared = post("/api/students/s001/notes", {"tutor_id": "t1", "subject": "math",
                                           "text": "Maya explained her rule out loud today.", "share_with_parent": True})
check("POST notes returns a Note", has(shared, ["id", "student_id", "tutor_id", "subject", "text", "ts", "share_with_parent"]))
private_texts = [n["text"] for sid in ("s001", "s014") for n in get(f"/api/students/{sid}/profile")["notes"]
                 if not n["share_with_parent"]]
parent_blobs = [json.dumps(get(p), ensure_ascii=False) for p in
                ("/api/parent/g001/home", "/api/parent/g001/kids/s001", "/api/parent/g001/kids/s014",
                 "/api/parent/g002/home", "/api/parent/g002/kids/s001")]
check("private notes appear in staff profile", secret in private_texts)
check("no private note text in any parent payload", not any(t in b for t in private_texts for b in parent_blobs))
check("shared note reaches the parent", shared["text"] in parent_blobs[1])
check("no transcripts or staff summaries in parent payloads",
      not any(k in b for b in parent_blobs for k in ('"transcript"', '"since_last_session"', '"brain"', '"interests"')))
quotes_ok = True
for sid in ("s014",):
    st_sessions = get(f"/api/students/{sid}")["sessions"]
    allowed = {c["quote"] for s in st_sessions for c in (s.get("gap_report") or {}).get("concepts", []) if c.get("quote")}
    for w in get(f"/api/parent/g001/kids/{sid}")["weeks"]:
        quotes_ok &= all(q in allowed for q in w["quotes"]) and all(f["after"] in allowed for f in w["fixed"])
check("parent quotes are verbatim gap-report quotes", quotes_ok)
check("parent tone: no behind/failing/rankings", not any(center.BANNED.search(b) for b in parent_blobs))

# ------------------------------------------------------------------ language follows the guardian
SID = "sess_maya_saved"
pv = post(f"/api/sessions/{SID}/parent-update/preview")
byg = {x["guardian_id"]: x for x in pv["by_guardian"]}
check("preview addresses g001 + g002", set(byg) == {"g001", "g002"}, list(byg))
check("g001 (es) gets Spanish", "Esta semana" in byg["g001"]["message"] and byg["g001"]["language"] == "es", byg["g001"]["message"])
check("g002 (en) gets the tutor's English", byg["g002"]["message"] == pv["message"])
quote = center.update_facts(get(f"/api/sessions/{SID}"), [a for a in get("/api/students/s001")["assignments"]
                                                          if a["id"] == "a_tri"][0], maya, "Ms. Rivera")["quote"]
check("localized message keeps the kid's words verbatim", quote and f'"{quote}"' in byg["g001"]["message"])
for lang, marker in (("vi", "Tuần này"), ("zh", "本周")):
    r = client.patch("/api/guardians/g001", json={"language": lang})
    msg = {x["guardian_id"]: x for x in post(f"/api/sessions/{SID}/parent-update/preview")["by_guardian"]}["g001"]["message"]
    check(f"PATCH language={lang} -> update in {lang}", r.status_code == 200 and marker in msg, msg)
client.patch("/api/guardians/g001", json={"language": "es"})
for lang in center.LANGS:
    t = center.update_template(lang, {"first": "Maya", "topic": "Area", "quote": "x y z", "fixed": True, "ko": True,
                                      "v": 2, "tutor": "Ms. Rivera"})
    check(f"template {lang}: leads with what she taught, tone ok", center.tone_ok(t) and '"x y z"' in t)

# ------------------------------------------------------------------ live AI localization path (fake model, no network)
import asyncio  # noqa: E402
import llm  # noqa: E402

_orig = (llm.available, llm.structured)
SRC = 'Bright Path Tutoring: Maya taught Pip. In her words: "two triangles make a rectangle". - Ms. Rivera'


def fake_model(reply, delay=0.0):
    async def structured(system, messages, schema, **kw):
        assert "Spanish" in system and messages[0]["content"] == SRC
        await asyncio.sleep(delay)
        return {"message": reply}
    return structured


async def live_checks():
    llm.available = lambda: True
    good = 'Bright Path Tutoring: Maya le enseñó a Pip. En sus palabras: "two triangles make a rectangle". - Ms. Rivera'
    llm.structured = fake_model(good)
    r1 = await center.ai_localize(SRC, "es")
    center._i18n_cache.clear()
    llm.structured = fake_model("Maya le enseñó a Pip dos triángulos.")  # dropped the verbatim quote
    r2 = await center.ai_localize(SRC, "es")
    llm.structured = fake_model(good.replace("le enseñó", "is behind but"))  # tone guard
    r3 = await center.ai_localize(SRC, "es")
    llm.structured = fake_model(good, delay=0.3)
    r4 = await center.ai_localize(SRC, "es", wait=0.05)  # too slow for Preview: template now...
    await asyncio.sleep(0.4)
    r5 = await center.ai_localize(SRC, "es", wait=0.05)  # ...and cached for the next Preview/Send
    return r1 == good, r2 is None, r3 is None, r4 is None, r5 == good


try:
    res = asyncio.run(live_checks())
finally:
    llm.available, llm.structured = _orig
    center._i18n_cache.clear()
check("live: AI localization used when it keeps the quote", res[0])
check("live: dropped quote -> template", res[1])
check("live: tone guard -> template", res[2])
check("live: slow AI does not block Preview, then is cached", res[3] and res[4], res)

# ------------------------------------------------------------------ quiet hours
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
check("legacy `sent` is the tutor's own text", sent["sent"]["message"] == pv["message"])
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
check("tutor thread message at noon is test-mode", tm["status"] == "test-mode (not delivered)" and tm["via"] == "sms")
rep = post("/api/threads", {"student_id": "s001", "guardian_id": "g001", "from": "guardian", "text": "¡Gracias!"})
check("guardian reply is received", rep["status"] == "received" and rep["author_id"] == "g001")
center.clock = REAL_CLOCK

# ------------------------------------------------------------------ guardians create/patch
bad = client.post("/api/guardians", json={"name": "X", "phone": "+1-415-867-5309", "student_ids": ["s002"]})
check("real-looking phone rejected (synthetic 555-01xx only)", bad.status_code == 422)
bad = client.post("/api/guardians", json={"name": "X", "email": "x@gmail.com", "student_ids": ["s002"]})
check("non-example.com email rejected", bad.status_code == 422)
ng = post("/api/guardians", {"name": "Kim N.", "relation": "grandparent", "phone": "+1-510-555-0177",
                             "language": "vi", "updates": "weekly", "student_ids": ["s002"]})
check("POST /guardians returns Guardian and links the kid", has(ng, ["id", "name", "relation", "phone", "email", "prefers",
                                                                  "language", "updates", "quiet_hours", "student_ids"])
      and ng["id"] in get("/api/students/s002")["student"]["guardian_ids"])
check("PATCH rejects unknown fields", client.patch(f"/api/guardians/{ng['id']}", json={"student_ids": ["s001"]}).status_code == 422)
check("PATCH validates quiet_hours", client.patch(f"/api/guardians/{ng['id']}", json={"quiet_hours": "late"}).status_code == 422)
en = post("/api/students/s002/enrollments", {"subject": "science", "tutor_id": "t6", "slot": "Mon 5pm", "goal": None})
check("POST enrollments returns Enrollment with a package", has(en, ["id", "student_id", "subject", "tutor_id", "slot", "goal",
                                                                      "started", "package"])
      and has(en["package"], ["hours_total", "hours_used", "price_usd", "renews_on", "status"]))
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
draft = {k: v for k, v in a_tri.items() if k not in ("id", "student_id")}
check("bulk from an unsaved draft works", len(post("/api/assignments/bulk", {"assignment": {**draft, "id": None},
                                                                              "student_ids": ["s005"]})["assignments"]) == 1)

# ------------------------------------------------------------------ overview math (independent recompute)
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
check("revenue_at_risk = sum over at_risk|quiet renewal rows", O["revenue_at_risk_usd"] ==
      sum(r["price_usd"] for r in O["renewals_due"] if r["at_risk"] or r["signal"] == "quiet"))
mrow = next(r for r in O["renewals_due"] if r["student"]["id"] == "s001")
check("Maya's renewal is quiet before her K.O.", mrow["signal"] == "quiet" and mrow["guardian"]["id"] == "g001"
      and mrow["note_preview"] and "Hola Ana" in mrow["note_preview"], mrow)
kos_before = {x["subject"]: x["kos_7d"] for x in O["by_subject"]}["math"]
q = ko()
check("demo K.O. on a_tri", q["ko"] is True)
O2 = get("/api/center/overview")
mrow2 = next(r for r in O2["renewals_due"] if r["student"]["id"] == "s001")
check("Maya's K.O. flips her renewal to engaged", mrow2["signal"] == "engaged" and mrow2["evidence_quote"], mrow2)
check("revenue_at_risk drops by Maya's package", O2["revenue_at_risk_usd"] == O["revenue_at_risk_usd"] - mrow["price_usd"],
      (O["revenue_at_risk_usd"], O2["revenue_at_risk_usd"]))
check("math kos_7d +1", {x["subject"]: x["kos_7d"] for x in O2["by_subject"]}["math"] == kos_before + 1)
check("K.O. is evidence in the renewal note", mrow2["evidence_quote"] in (mrow2["note_preview"] or ""))
row = get("/api/tutors/t1/students?q=maya")["rows"][0]
check("after the K.O. Maya needs an update", "needs_update" in row["flags"])
P = get("/api/students/s001/profile")
mp = next(p for p in P["progress"] if p["subject"] == "math")
check("profile: K.O. counted, mastery >= 2 on all concepts", mp["ko_count"] == 1 and mp["missions_done"] == 1
      and all(m["level"] >= 2 for m in mp["mastery"]), mp["mastery"])
check("timeline has the K.O. with a report link", P["timeline"][0]["kind"] == "ko" and P["timeline"][0]["link"] == f"/tutor/report/{q['id']}")
hk = next(k for k in get("/api/parent/g001/home")["kids"] if k["student"]["id"] == "s001")
check("parent sees this week's K.O. with a verbatim quote", hk["this_week"]["kos"] == 1 and hk["this_week"]["taught_quote"]
      and any(hk["this_week"]["taught_quote"] in m["text"] for m in q["transcript"] if m["from"] == "student"),
      hk["this_week"])
upd0 = O2["parent_updates_7d"]
pv = post(f"/api/sessions/{q['id']}/parent-update/preview")
post(f"/api/sessions/{q['id']}/parent-update/send", {"message": pv["message"]})
O3 = get("/api/center/overview")
check("send clears needs_update and counts 2 updates (both guardians)",
      "needs_update" not in get("/api/tutors/t1/students?q=maya")["rows"][0]["flags"] and O3["parent_updates_7d"] == upd0 + 2)
tl = get("/api/students/s001/profile")["timeline"]
check("timeline shows the updates", sum(1 for t in tl if t["kind"] == "update") == 2)

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
client.patch("/api/guardians/g001", json={"language": "zh", "quiet_hours": None})
post("/api/students/s001/notes", {"tutor_id": "t1", "subject": "math", "text": secret, "share_with_parent": False})
post("/api/assignments/bulk", {"assignment": a_tri, "student_ids": ["s010"]})
post("/api/demo/reset")
g1 = get("/api/parent/g001/home")["guardian"]
check("reset: g001 restored", g1["language"] == "es" and g1["quiet_hours"] == "21:00-07:00")
check("reset: notes restored", secret not in json.dumps(get("/api/students/s001/profile")["notes"]))
check("reset: no extra guardians", ng["id"] not in json.dumps(get("/api/students/s002")["student"]))
check("reset: bulk copies gone", len(get("/api/students/s010")["assignments"]) == 0)
check("reset: Maya's sent log empty, renewal quiet again", not [r for r in get("/api/sent-log")["items"] if r["student_id"] == "s001"]
      and next(r for r in get("/api/center/overview")["renewals_due"] if r["student"]["id"] == "s001")["signal"] == "quiet")
check("reset: same revenue at risk", get("/api/center/overview")["revenue_at_risk_usd"] == O["revenue_at_risk_usd"])

print(f"\n{len(fails)} failing")
sys.exit(1 if fails else 0)
