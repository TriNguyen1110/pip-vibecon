"""Pip API (FastAPI). Every route is under /api; see CONTRACT.md."""

import asyncio
import base64
import hashlib
import logging
from collections import OrderedDict
import re
import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / ".env")  # before importing llm, which reads model env vars at import time

import httpx  # noqa: E402
from fastapi import APIRouter, BackgroundTasks, Body, FastAPI, HTTPException, Request  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402

import lesson as lessons  # noqa: E402
import llm  # noqa: E402
import logic  # noqa: E402
import pip_ai  # noqa: E402
from seed import seed  # noqa: E402
from store import make_store  # noqa: E402

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("pip")
store = make_store()
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173").rstrip("/")


@asynccontextmanager
async def lifespan(_app):
    if not await store.all("center"):
        await seed(store)
        log.info("seeded demo center")
    yield


app = FastAPI(title="Pip", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
api = APIRouter(prefix="/api")


async def need(coll: str, doc_id: str, what: str) -> dict:
    doc = await store.get(coll, doc_id)
    if not doc:
        raise HTTPException(404, f"{what} not found")
    return doc


async def tutor_name(student: dict) -> str:
    t = await store.get("tutors", student["tutor_id"])
    return t["name"] if t else "your tutor"


# ------------------------------------------------------------------ read endpoints

@api.get("/health")
async def health():
    return {"ok": True, "model": llm.CHAT_MODEL, "ai": "live" if llm.available() else "offline",
            "store": "mongo" if type(store).__name__ == "MongoStore" else "memory",
            **({"offline_demo": True} if llm.forced_offline() else {})}


async def insight() -> dict:
    """Most common misconception: distinct students whose final Brain holds a wrong rule."""
    holders: dict[str, set] = {}
    for s in await store.all("sessions"):
        if s.get("saved") or not (s.get("synthetic") or s["status"] == "complete"):
            continue
        if any(not r["correct"] for r in s["brain"]):
            holders.setdefault(s["assignment_id"], set()).add(s["student_id"])
    if not holders:
        return {"misconception": None, "count": 0, "boss_name": None, "student_ids": []}
    aid = max(holders, key=lambda k: len(holders[k]))
    a = await store.get("assignments", aid)
    return {"misconception": a["misconception"], "count": len(holders[aid]),
            "boss_name": a["boss"]["name"], "student_ids": sorted(holders[aid])}


@api.get("/center")
async def center():
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    back = {e["student_id"] for e in await store.all("events", kind="open")
            if not e["due"] and datetime.fromisoformat(e["ts"]) >= week_ago}
    ins = await insight()
    pilot = await store.get("pilot", "pilot") or {"status": "not_started"}
    return {"center": await store.get("center", "c1"),
            "insight": {k: ins[k] for k in ("misconception", "count", "boss_name")},
            "came_back_this_week": len(back), "pilot": {"status": pilot["status"]}}


GRACE_DAYS = 3     # a session this fresh cannot be "no return" or "no update" yet
WINDOW_DAYS = 14


def _dt(ts: str) -> datetime:
    return datetime.fromisoformat(ts)


@api.get("/center/at-risk")
async def at_risk():
    """Students who need a human: stuck after the full ladder, no return in 14 days, or no parent update."""
    now = datetime.now(timezone.utc)
    cut, grace = now - timedelta(days=WINDOW_DAYS), now - timedelta(days=GRACE_DAYS)
    assignments = {x["id"]: x for x in await store.all("assignments")}
    by_student: dict[str, list[dict]] = {}
    for s in await store.all("sessions"):
        if not s.get("saved"):
            by_student.setdefault(s["student_id"], []).append(s)
    opens: dict[str, list[datetime]] = {}
    for e in await store.all("events", kind="open"):
        if not e["due"]:
            opens.setdefault(e["student_id"], []).append(_dt(e["ts"]))
    sent: dict[str, list[datetime]] = {}
    for r in await store.all("sent"):
        sent.setdefault(r["student_id"], []).append(_dt(r["ts"]))
    out = []
    for sid, sess in by_student.items():
        st = await store.get("students", sid)
        if not st:
            continue
        reasons = []
        for s in sorted(sess, key=lambda x: x["created_at"]):
            a = assignments.get(s["assignment_id"])
            for cid, v in (s.get("ladder") or {}).items():
                if v.get("stuck") and a and not any(
                        r["correct"] and r["concept_id"] == cid for r in s["brain"]):
                    reasons.append(f"Stuck after the full ladder on \"{logic.short_name(a, cid)}\" "
                                   f"({a['topic']}). Pip's friend hint did not unlock it.")
        latest = max(sess, key=lambda x: x["created_at"])
        if _dt(latest["created_at"]) <= grace and not any(t >= cut for t in opens.get(sid, [])):
            reasons.append("Has not come back to the app on their own in 14 days.")
        done = [s for s in sess if s["status"] in ("quizzed", "complete") and _dt(s["created_at"]) <= grace]
        if done:
            last_done = max(done, key=lambda x: x["created_at"])
            sent_at = [t for t in sent.get(sid, [])]
            if last_done.get("parent_sent_at"):
                sent_at.append(_dt(last_done["parent_sent_at"]))
            if not any(t >= _dt(last_done["created_at"]) for t in sent_at):
                reasons.append("No parent update sent since their last completed session.")
        if reasons:
            out.append({"student_id": sid, "name": st["name"], "reasons": reasons,
                        "synthetic": any(s.get("synthetic") for s in sess)})
    out.sort(key=lambda x: (-len(x["reasons"]), x["student_id"]))
    return {"students": out, "label": "synthetic demo data"}


@api.get("/tutors/{tutor_id}/roster")
async def roster(tutor_id: str):
    tutor = await need("tutors", tutor_id, "tutor")
    students = await store.all("students", tutor_id=tutor_id)
    return {"tutor": tutor, "students": sorted(students, key=lambda s: s["id"])}


@api.get("/students/{student_id}")
async def get_student(student_id: str):
    st = await need("students", student_id, "student")
    return {"student": st,
            "assignments": await store.all("assignments", student_id=student_id),
            "sessions": sorted(await store.all("sessions", student_id=student_id),
                               key=lambda s: s["created_at"])}


@api.post("/students/{student_id}/open")
async def open_app(student_id: str):
    await need("students", student_id, "student")
    done = {s["assignment_id"] for s in await store.all("sessions", student_id=student_id)
            if s["status"] == "complete" and not s.get("saved")}
    due = any(a["id"] not in done for a in await store.all("assignments", student_id=student_id))
    await store.put("events", {"id": logic.new_id("ev"), "kind": "open", "student_id": student_id,
                               "ts": logic.now(), "due": due})
    return {"ok": True}


# ------------------------------------------------------------------ assignments

@api.post("/assignments/draft")
async def draft(body: dict = Body(...)):
    st = await need("students", body.get("student_id", ""), "student")
    topic = (body.get("topic") or "").strip()
    if not topic:
        raise HTTPException(422, "topic is required")
    grade = int(body.get("grade") or st["grade"])
    d = await pip_ai.draft(topic, grade)
    return {"id": None, "student_id": st["id"], "tutor_id": st["tutor_id"], "grade": grade,
            **d, "created_at": logic.now()}


@api.post("/assignments")
async def save_assignment(body: dict = Body(...)):
    st = await need("students", body.get("student_id", ""), "student")
    cs = body.get("concepts") or []
    if len(cs) != 3 or not body.get("topic") or not body.get("misconception"):
        raise HTTPException(422, "need topic, misconception and 3 concepts")
    a = {**body, "id": body.get("id") or logic.new_id("a"),
         "tutor_id": body.get("tutor_id") or st["tutor_id"],
         "concepts": [{"id": c.get("id") or f"k{i + 1}", "text": c["text"],
                       "weapon": c.get("weapon", "")} for i, c in enumerate(cs)],
         "created_at": body.get("created_at") or logic.now()}
    a.setdefault("boss", {"name": "Guess-Guess Goose", "emoji": "🪿🎲", "backstory": "A goose rolling dice instead of checking its work."})
    for k in ("cliffhanger", "root_prerequisite", "why_it_matters"):
        a.setdefault(k, "")
    if a.get("lesson"):
        a["lesson"] = lessons.normalize_lesson(a["lesson"]) or lessons.offline_lesson(
            a["concepts"], a["topic"])
    if {q.get("concept_id") for q in a.get("quiz") or []} != set(logic.concept_ids(a)):
        a["quiz"] = pip_ai.quiz_for(a)
    await store.put("assignments", a)
    return a


# ------------------------------------------------------------------ sessions

def past_self_rule(a: dict, student_sessions: list[dict], assignments: dict) -> str | None:
    """The student's own last unfixed wrong rule on this topic family (most recent non-saved session)."""
    fam = lessons.topic_family(a)
    same = [s for s in student_sessions if not s.get("saved") and s.get("brain")
            and s["assignment_id"] in assignments
            and lessons.topic_family(assignments[s["assignment_id"]]) == fam]
    if not same:
        return None
    last = max(same, key=lambda s: s["created_at"])
    bad = next((r for r in last["brain"] if not r["correct"] and not r.get("fixed_after")), None)
    return bad["quote"].strip().rstrip(".") if bad else None


def openings(student: dict, a: dict, earlier: list[dict], past: str | None = None) -> list[str]:
    """Instant templated opening (no AI call). The LAST message is always the misconception claim."""
    if past:  # M1 past-self: the student's own old mistake, framed as hearsay, never as theirs
        claim = f"I'm learning {a['topic'].lower()}. Someone told me {past}. Seems easy."
    else:
        claim = (f"I'm learning {a['topic'].lower()}. I already know one rule: {a['misconception']}. "
                 "Easy.")
    if not student.get("interests"):
        return ["Hi. I'm Pip. Before we start: what are you into? A game, a sport, music, food. "
                "Anything.", claim]
    old = [r for s in earlier for r in s["brain"]]
    if old and not past:
        return [f'Hi. I\'m Pip. Last time you told me: "{old[0]["quote"]}". Still true?', claim]
    return ["Hi. I'm Pip. " + claim]


@api.post("/sessions")
async def create_session(body: dict = Body(...)):
    a = await need("assignments", body.get("assignment_id", ""), "assignment")
    st = await need("students", body.get("student_id", ""), "student")
    mine = await store.all("sessions", student_id=st["id"])
    earlier = sorted([s for s in mine if not s.get("saved") and s["brain"]],
                     key=lambda s: s["created_at"])
    assignments = {x["id"]: x for x in await store.all("assignments")}
    past = past_self_rule(a, mine, assignments)
    look = body.get("look") if body.get("look") in ("blob", "bot", "doodle") else "blob"
    acc = body.get("accessory") if body.get("accessory") in (
        "none", "cap", "glasses", "scarf", "headphones") else "none"
    s = logic.new_session(a, st["id"], look, body.get("creature") or look, acc,
                          openings(st, a, earlier[-1:], past))
    s["opening_source"] = "past_self" if past else "claim"
    s["vibe"] = body.get("vibe") if body.get("vibe") in ("cute", "cool", "ugly") else "cute"
    await store.put("sessions", s)
    st["last_session_id"] = s["id"]
    await store.put("students", st)
    return s


@api.get("/sessions/{sid}")
async def get_session(sid: str):
    return await need("sessions", sid, "session")


_locks: dict[str, asyncio.Lock] = {}


def session_lock(sid: str) -> asyncio.Lock:
    return _locks.setdefault(sid, asyncio.Lock())


@api.post("/sessions/{sid}/turn")
async def turn(sid: str, body: dict = Body(...)):
    async with session_lock(sid):
        return await _turn(sid, body)


async def _turn(sid: str, body: dict):
    s = await need("sessions", sid, "session")
    text = (body.get("text") or "").strip()
    if not text:
        raise HTTPException(422, "text is required")
    a = await need("assignments", s["assignment_id"], "assignment")
    st = await need("students", s["student_id"], "student")
    try:
        r = await pip_ai.turn(s, a, st, text)
    except Exception:  # never show the student an AI failure
        log.exception("turn failed; using offline")
        r = pip_ai.offline_turn(s, a, st, text)
    s["transcript"].append({"from": "student", "text": text, "ts": logic.now()})
    s["transcript"].append(logic.apply_turn(s, a, text, r))
    s["misconception_stated"] = True
    if r["interests"]:
        st["interests"] = r["interests"]
        await store.put("students", st)
    await store.put("sessions", s)
    return s


@api.post("/sessions/{sid}/equip")
async def equip(sid: str, body: dict = Body(...)):
    s = await need("sessions", sid, "session")
    if body.get("weapon") not in s["weapons"]:
        raise HTTPException(400, "weapon not unlocked")
    s["equipped"] = body["weapon"]
    await store.put("sessions", s)
    return s


def snap(quote: str, text: str) -> str | None:
    """Exact substring of text matching quote ignoring case, whitespace and punctuation."""
    toks = re.findall(r"[\w'/]+", quote)
    if not toks:
        return None
    m = re.search(r"[\W_]*".join(re.escape(t) for t in toks), text, re.IGNORECASE)
    return m.group(0) if m else None


def resolve_rules(raw_rules: list[dict], session: dict, ids: set, start: int) -> dict[int, dict]:
    """Raw rule index -> Rule with a verbatim quote and the msg_index it came from."""
    msgs = dict(pip_ai.student_msgs(session, start))
    out = {}
    for i, r in enumerate(raw_rules):
        if r.get("concept_id") not in ids or not msgs:
            continue
        quote = (r.get("quote") or "").strip()
        mi = r.get("msg_index")
        if mi not in msgs:  # unknown message: find the one containing the quote, else best overlap
            mi = next((k for k, t in msgs.items() if snap(quote, t)), None)
            if mi is None:
                qw = set(logic.norm(quote).split())
                ratio, mi = max(((len(qw & set(logic.norm(t).split())) / max(1, len(qw)), k)
                                 for k, t in msgs.items()), default=(0, None))
                if ratio < 0.5:
                    continue
        out[i] = {"concept_id": r["concept_id"], "msg_index": mi, "correct": bool(r["correct"]),
                  "quote": snap(quote, msgs[mi]) or msgs[mi].strip()}
    return out


@api.post("/sessions/{sid}/quiz")
async def quiz(sid: str, tasks: BackgroundTasks):
    async with session_lock(sid):
        return await _quiz(sid, tasks)


async def _quiz(sid: str, tasks: BackgroundTasks):
    s = await need("sessions", sid, "session")
    if s["status"] == "complete":
        return s
    a = await need("assignments", s["assignment_id"], "assignment")
    st = await need("students", s["student_id"], "student")
    allq = a.get("quiz") or pip_ai.quiz_for(a)
    only = s["reteach_concept"] if s["reteach_from"] is not None and s["brain"] else None
    qs = [q for q in allq if only is None or q["concept_id"] == only]
    start = s["reteach_from"] if only else 0
    try:
        raw = await pip_ai.run_quiz(s, a, qs, start)
    except Exception:
        log.exception("quiz failed; using offline")
        raw = pip_ai.offline_quiz(s, a, qs, start)
    valid = resolve_rules(raw["rules"], s, set(logic.concept_ids(a)), start)
    latest = {r["concept_id"]: r for _, r in sorted(valid.items())}  # later rule wins per concept
    prev = {r["concept_id"]: r for r in s["brain"]}
    brain = []
    for cid in logic.concept_ids(a):
        old = prev.get(cid)
        if cid not in latest:
            if old and only is not None:
                brain.append(old)  # re-teach mode keeps what it did not re-extract
            continue
        rule = {"id": f"r_{cid}", **latest[cid]}
        if rule["correct"] and old and not old["correct"]:
            rule["fixed_after"] = s["reteach_count"]
        elif rule["correct"] and old and old.get("fixed_after"):
            rule["fixed_after"] = old["fixed_after"]
        brain.append(rule)
    by_concept = {r["concept_id"]: r for r in brain}
    answers = {x["question_index"]: x for x in raw["answers"]}
    new_items = {}
    for n, q in enumerate(qs):
        x = answers.get(n)
        i = x.get("rule_index", -1) if x else -1
        rule = by_concept.get(valid[i]["concept_id"]) if i in valid else None
        base = {"id": q["id"], "concept_id": q["concept_id"], "question": q["question"]}
        if rule is None:  # no rule, or the cited rule was dropped: Pip was not taught this
            new_items[q["id"]] = {**base, "rule_id": None, "passed": False,
                                  "pip_answer": "You didn't teach me that one.",
                                  "line": "You didn't teach me that one."}
        else:
            new_items[q["id"]] = {**base, "rule_id": rule["id"], "pip_answer": x["pip_answer"],
                                  "passed": bool(x["passed"]) and rule["correct"], "line": x["line"]}
    old_items = {i["id"]: i for i in s["quiz"]}
    items = [new_items.get(q["id"]) or old_items.get(q["id"]) for q in allq]
    items = [i for i in items if i]
    s["brain"], s["quiz"] = brain, items
    s["reteach_concept"], s["reteach_from"] = None, None
    if len(items) == len(allq) and all(i["passed"] for i in items):
        s.update(ko=True, status="complete", mood="celebrating", boss_hp=0,
                 brain_version=min(3, s["brain_version"] + 1))
        for c in a["concepts"]:  # every passed concept counts as explained: unlock its weapon
            s["meters"][c["id"]] = max(s["meters"].get(c["id"], 0), logic.UNLOCK_AT)
            if c.get("weapon") and c["weapon"] not in s["weapons"]:
                s["weapons"].append(c["weapon"])
        s["equipped"] = s["equipped"] or (s["weapons"][0] if s["weapons"] else None)
        s["transcript"].append({"from": "pip", "text": a.get("cliffhanger", ""), "ts": logic.now(),
                                "event": {"kind": "none", "amount": 0, "caption": "", "unlocked": []}})
        s["gap_report"] = pip_ai.report_det(s, a, st)
        s["parent_message"] = pip_ai.parent_template(s, a, st, await tutor_name(st))
        st["since_last_session"], st["last_session_id"] = s["gap_report"]["summary"], s["id"]
        await store.put("students", st)
        tasks.add_task(finish_ko, s["id"])
    else:
        s.update(status="quizzed", mood="stuck")
    await store.put("sessions", s)
    return s


async def finish_ko(sid: str):
    """Background: optional AI polish of summary/opener and a pre-generated parent message."""
    try:
        s = await need("sessions", sid, "session")
        a = await need("assignments", s["assignment_id"], "assignment")
        st = await need("students", s["student_id"], "student")
        tn = await tutor_name(st)
        better = await pip_ai.polish(s["gap_report"], a, st)
        msg = await pip_ai.parent_message(s, a, st, tn)
        async with session_lock(sid):
            s = await need("sessions", sid, "session")
            if better:
                s["gap_report"].update(summary=better["summary"].strip(), opener=better["opener"].strip())
                st["since_last_session"] = s["gap_report"]["summary"]
                await store.put("students", st)
            s["parent_message"] = msg
            await store.put("sessions", s)
    except Exception:
        log.exception("post-K.O. background work failed")


@api.post("/sessions/{sid}/reteach")
async def reteach(sid: str, body: dict = Body(...)):
    async with session_lock(sid):
        return await _reteach(sid, body)


async def _reteach(sid: str, body: dict):
    s = await need("sessions", sid, "session")
    a = await need("assignments", s["assignment_id"], "assignment")
    cid = body.get("concept_id")
    if cid not in logic.concept_ids(a):
        raise HTTPException(422, "unknown concept_id")
    rule = next((r for r in s["brain"] if r["concept_id"] == cid), None)
    msg = (f'My brain has a bug about this: "{rule["quote"]}". Fix it?'
           if rule and not rule["correct"] else
           "You didn't teach me that one. Can you teach it to me?")
    s.update(reteach_count=s["reteach_count"] + 1, reteach_concept=cid, status="teaching",
             mood="stuck")
    lessons.ensure_ladder(s, a)
    lessons.reset_concept(s, cid)
    s["transcript"].append({"from": "pip", "text": msg, "ts": logic.now(),
                            "event": {"kind": "none", "amount": 0, "caption": "", "unlocked": []}})
    s["reteach_from"] = len(s["transcript"])
    await store.put("sessions", s)
    return s


@api.post("/sessions/{sid}/finisher")
async def finisher(sid: str, body: dict = Body(...)):
    s = await need("sessions", sid, "session")
    a = await need("assignments", s["assignment_id"], "assignment")
    w = body.get("weapon")
    if not s["ko"]:
        raise HTTPException(400, "boss not K.O.'d yet")
    if w not in s["weapons"]:
        raise HTTPException(400, "weapon not unlocked")
    cap = f"{a['boss']['name']} met the {w} one last time and left Pip's brain."
    s["finisher"] = {"weapon": w, "caption": cap}
    s["transcript"].append({"from": "system", "text": cap, "ts": logic.now()})
    await store.put("sessions", s)
    return s


# ------------------------------------------------------------------ report, parent, workshop, pilot

async def make_report(sid: str) -> dict:
    """Deterministic and fast (no AI): safe to call repeatedly."""
    s = await need("sessions", sid, "session")
    if s.get("gap_report"):
        return s["gap_report"]
    a = await need("assignments", s["assignment_id"], "assignment")
    st = await need("students", s["student_id"], "student")
    s["gap_report"] = pip_ai.report_det(s, a, st)
    await store.put("sessions", s)
    if not s.get("saved"):
        st["since_last_session"], st["last_session_id"] = s["gap_report"]["summary"], s["id"]
        await store.put("students", st)
    return s["gap_report"]


@api.get("/sessions/{sid}/report")
async def get_report(sid: str):
    return await make_report(sid)


@api.post("/sessions/{sid}/parent-update/preview")
async def parent_preview(sid: str):
    await make_report(sid)
    s = await need("sessions", sid, "session")
    a = await need("assignments", s["assignment_id"], "assignment")
    st = await need("students", s["student_id"], "student")
    if not s.get("parent_message"):
        s["parent_message"] = await pip_ai.parent_message(s, a, st, await tutor_name(st))
        await store.put("sessions", s)
    return {"message": s["parent_message"]}


async def twilio_send(to: str, body: str) -> bool:
    sid, token, frm = (os.environ.get(k) for k in
                       ("TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM"))
    if not (sid and token and frm and to):
        return False
    try:
        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.post(f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json",
                             auth=(sid, token), data={"To": to, "From": frm, "Body": body})
        return r.status_code in (200, 201)
    except httpx.HTTPError:
        log.exception("twilio send failed")
        return False


@api.post("/sessions/{sid}/parent-update/send")
async def parent_send(sid: str, body: dict = Body(...)):
    s = await need("sessions", sid, "session")
    msg = (body.get("message") or "").strip()
    if not msg:
        raise HTTPException(422, "message is required")
    to = os.environ.get("TEST_PARENT_PHONE", "")
    ok = await twilio_send(to, msg)
    row = {"id": logic.new_id("sent"), "student_id": s["student_id"],
           "to": to or "test parent (synthetic)", "message": msg,
           "status": "delivered" if ok else "test-mode (not delivered)", "ts": logic.now()}
    await store.put("sent", row)
    s["parent_sent_at"] = row["ts"]
    await store.put("sessions", s)
    return {"sent": row}


@api.get("/sent-log")
async def sent_log():
    return {"items": sorted(await store.all("sent"), key=lambda r: r["ts"], reverse=True)}


@api.post("/workshops")
async def workshop(body: dict = Body(default={})):
    ins = await insight()
    mis = (body.get("misconception") or ins["misconception"] or "").strip()
    names = [(await store.get("students", sid))["name"] for sid in ins["student_ids"]]
    note = (f"Workshop: {mis}\nStudents ({len(names)}): {', '.join(names)}\n"
            "Plan (30 min): 1) Draw 1/2 and 1/3 of the same pizza and ask which slice is bigger. "
            "2) Cut both into sixths and add them. 3) Pairs explain why the bottom stays the same.")
    await store.put("workshops", {"id": logic.new_id("ws"), "misconception": mis,
                                  "student_ids": ins["student_ids"], "note": note, "ts": logic.now()})
    return {"note": note}


@api.post("/pilot/checkout")
async def pilot_checkout(request: Request):
    origin = (request.headers.get("origin") or FRONTEND_URL).rstrip("/")
    key = os.environ.get("STRIPE_SECRET_KEY", "")
    sim = {"url": "/pilot/success", "simulated": True}
    if not key:
        return sim
    if not key.startswith("sk_test_"):
        log.error("refusing non-test Stripe key; simulating checkout")
        return sim
    form = {"mode": "payment", "success_url": f"{origin}/pilot/success",
            "cancel_url": f"{origin}/owner/pricing",
            "line_items[0][quantity]": "1",
            "line_items[0][price_data][currency]": "usd",
            "line_items[0][price_data][unit_amount]": "9900",
            "line_items[0][price_data][product_data][name]": "Pip pilot — first month"}
    try:
        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.post("https://api.stripe.com/v1/checkout/sessions", data=form,
                             auth=(key, ""))
        if r.status_code == 200 and r.json().get("url"):
            return {"url": r.json()["url"]}
        log.error("stripe error %s", r.status_code)
    except httpx.HTTPError:
        log.exception("stripe call failed")
    return sim


@api.post("/pilot/confirm")
async def pilot_confirm():
    p = {"id": "pilot", "status": "active", "ts": logic.now()}
    await store.put("pilot", p)
    return {"pilot": {"status": p["status"]}}


# ------------------------------------------------------------------ text to speech (ElevenLabs)

TTS_DEFAULT_MODEL = "eleven_multilingual_v2"  # the documented default of the with-timestamps endpoint
TTS_MAX_CHARS = 600
_tts_cache: "OrderedDict[str, dict]" = OrderedDict()
TTS_CACHE_SIZE = 200


def map_tts_response(j: dict) -> dict | None:
    """ElevenLabs with-timestamps JSON -> our shape; None if audio or alignment is missing."""
    al = j.get("alignment") or j.get("normalized_alignment")
    if not j.get("audio_base64") or not isinstance(al, dict):
        return None
    keys = ("characters", "character_start_times_seconds", "character_end_times_seconds")
    if not all(isinstance(al.get(k), list) for k in keys):
        return None
    return {"audio_b64": j["audio_base64"], "mime": "audio/mpeg", "alignment": {k: al[k] for k in keys}}


async def _eleven(text: str, key: str, voice: str, model: str) -> httpx.Response:
    async with httpx.AsyncClient(timeout=8) as c:
        return await c.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice}/with-timestamps",
            headers={"xi-api-key": key, "content-type": "application/json"},
            json={"text": text, "model_id": model,
                  "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}})


@api.post("/tts")
async def tts(body: dict = Body(default={})):
    """Pip's voice. Never raises to the student: any problem returns {fallback: true} (browser voice)."""
    fb = {"fallback": True}
    try:
        text = (body.get("text") or "").strip()[:TTS_MAX_CHARS]
        key = os.environ.get("ELEVENLABS_API_KEY", "")
        voice = os.environ.get("ELEVENLABS_VOICE_ID", "")
        model = os.environ.get("ELEVENLABS_MODEL") or TTS_DEFAULT_MODEL
        if not (text and key and voice):
            return fb
        ck = hashlib.sha256(f"{text}\x00{voice}\x00{model}".encode()).hexdigest()
        if ck in _tts_cache:
            _tts_cache.move_to_end(ck)
            return _tts_cache[ck]
        r = await _eleven(text, key, voice, model)
        if r.status_code in (400, 422) and model != TTS_DEFAULT_MODEL:  # model not accepted here
            r = await _eleven(text, key, voice, TTS_DEFAULT_MODEL)
        if r.status_code != 200:
            log.warning("tts: elevenlabs status %s", r.status_code)
            return fb
        out = map_tts_response(r.json())
        if not out:
            return fb
        _tts_cache[ck] = out
        while len(_tts_cache) > TTS_CACHE_SIZE:
            _tts_cache.popitem(last=False)
        return out
    except Exception as e:  # noqa: BLE001 - never leak the key or fail the student
        log.warning("tts failed: %s", type(e).__name__)
        return fb


@api.post("/demo/warm")
async def demo_warm():
    ok = await pip_ai.warm()
    return {"ok": ok or not llm.available(), "ai": "live" if llm.available() else "offline"}


@api.post("/demo/reset")
async def demo_reset():
    _locks.clear()
    await seed(store)
    return {"ok": True}


app.include_router(api)
