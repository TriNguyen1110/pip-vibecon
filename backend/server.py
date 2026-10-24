"""Pip API (FastAPI). Every route is under /api; see CONTRACT.md."""

import asyncio
import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv

load_dotenv()  # before importing llm, which reads model env vars at import time

import httpx  # noqa: E402
from fastapi import APIRouter, BackgroundTasks, Body, FastAPI, HTTPException  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402

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
    return {"ok": True, "mode": "live" if llm.available() else "offline", "model": llm.CHAT_MODEL}


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


@api.get("/tutors/{tutor_id}/roster")
async def roster(tutor_id: str):
    tutor = await need("tutors", tutor_id, "tutor")
    students = await store.all("students", tutor_id=tutor_id)
    latest = {}
    for s in sorted((s for s in await store.all("sessions") if not s.get("saved")),
                    key=lambda s: s["created_at"]):
        latest[s["student_id"]] = s["id"]
    for st in students:
        st["report_session_id"] = latest.get(st["id"])
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
    a.setdefault("boss", {"name": "Mistakio Blunderini", "emoji": "🍝😵", "backstory": ""})
    for k in ("cliffhanger", "root_prerequisite", "why_it_matters"):
        a.setdefault(k, "")
    if {q.get("concept_id") for q in a.get("quiz") or []} != set(logic.concept_ids(a)):
        a["quiz"] = pip_ai.quiz_for(a)
    await store.put("assignments", a)
    return a


# ------------------------------------------------------------------ sessions

def opening(student: dict, a: dict, earlier: list[dict]) -> tuple[str, bool]:
    """Instant templated opening (no AI call). Returns (text, misconception_stated)."""
    if not student.get("interests"):
        return ("Hi. I'm Pip. Before we start: what are you into? A game, a sport, music, food. "
                "Anything."), False
    old = [r for s in earlier for r in s["brain"]]
    if old:
        return f'Last time you told me: "{old[0]["quote"]}". Still true?', False
    return (f"Hi. I'm Pip. I'm learning {a['topic'].lower()}. I already know one rule: "
            f"{a['misconception']}. Easy."), True


@api.post("/sessions")
async def create_session(body: dict = Body(...)):
    a = await need("assignments", body.get("assignment_id", ""), "assignment")
    st = await need("students", body.get("student_id", ""), "student")
    earlier = sorted([s for s in await store.all("sessions", student_id=st["id"])
                      if not s.get("saved") and s["brain"]], key=lambda s: s["created_at"])
    text, stated = opening(st, a, earlier[-1:])
    look = body.get("look") if body.get("look") in ("blob", "bot", "doodle") else "blob"
    s = logic.new_session(a, st["id"], look, body.get("creature") or look, text, stated)
    await store.put("sessions", s)
    return s


@api.get("/sessions/{sid}")
async def get_session(sid: str):
    return await need("sessions", sid, "session")


@api.post("/sessions/{sid}/turn")
async def turn(sid: str, body: dict = Body(...)):
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


def resolve_quotes(raw_rules: list[dict], msgs: list[str], ids: set) -> dict[int, dict]:
    """Raw rule index -> rule with a verbatim quote. A quote that is not in any student message is
    replaced by the best-overlapping whole message, or the rule is dropped."""
    out = {}
    for i, r in enumerate(raw_rules):
        if r.get("concept_id") not in ids:
            continue
        quote = (r.get("quote") or "").strip()
        if not any(logic.is_substring(quote, m) for m in msgs):
            qw = set(logic.norm(quote).split())
            ratio, best = max(((len(qw & set(logic.norm(m).split())) / max(1, len(qw)), m)
                               for m in msgs), default=(0, ""))
            if ratio < 0.5:
                continue
            quote = best.strip()
        out[i] = {"concept_id": r["concept_id"], "quote": quote, "correct": bool(r["correct"])}
    return out


@api.post("/sessions/{sid}/quiz")
async def quiz(sid: str, tasks: BackgroundTasks):
    s = await need("sessions", sid, "session")
    if s["status"] == "complete":
        return s
    a = await need("assignments", s["assignment_id"], "assignment")
    qs = a.get("quiz") or pip_ai.quiz_for(a)
    try:
        raw = await pip_ai.run_quiz(s, a)
    except Exception:
        log.exception("quiz failed; using offline")
        raw = pip_ai.offline_quiz(s, a, qs)
    valid = resolve_quotes(raw["rules"], logic.student_messages(s), set(logic.concept_ids(a)))
    latest = {r["concept_id"]: r for _, r in sorted(valid.items())}  # later rule wins per concept
    prev = {r["concept_id"]: r for r in s["brain"]}
    brain = []
    for cid in logic.concept_ids(a):
        if cid not in latest:
            continue
        rule, old = {"id": f"r_{cid}", **latest[cid]}, prev.get(cid)
        if rule["correct"] and old and not old["correct"]:
            rule["fixed_after"] = s["reteach_count"]
        elif rule["correct"] and old and old.get("fixed_after"):
            rule["fixed_after"] = old["fixed_after"]
        brain.append(rule)
    by_concept = {r["concept_id"]: r for r in brain}
    answers = {x["question_id"]: x for x in raw["answers"]}
    items = []
    for q in qs:
        x = answers.get(q["id"])
        i = x.get("rule_index", -1) if x else -1
        rule = by_concept.get(valid[i]["concept_id"]) if i in valid else None
        base = {"id": q["id"], "concept_id": q["concept_id"], "question": q["question"]}
        if rule is None:  # no rule, or the cited rule was dropped: Pip was not taught this
            items.append({**base, "rule_id": None, "pip_answer": "You didn't teach me that one.",
                          "passed": False, "line": "You didn't teach me that one."})
        else:
            items.append({**base, "rule_id": rule["id"], "pip_answer": x["pip_answer"],
                          "passed": bool(x["passed"]) and rule["correct"], "line": x["line"]})
    s["brain"], s["quiz"], s["reteach_concept"] = brain, items, None
    if all(i["passed"] for i in items):
        s.update(ko=True, status="complete", mood="celebrating", boss_hp=0,
                 brain_version=min(3, s["brain_version"] + 1))
        for c in a["concepts"]:  # every passed concept counts as explained: unlock its weapon
            s["meters"][c["id"]] = max(s["meters"].get(c["id"], 0), logic.UNLOCK_AT)
            if c.get("weapon") and c["weapon"] not in s["weapons"]:
                s["weapons"].append(c["weapon"])
        s["equipped"] = s["equipped"] or (s["weapons"][0] if s["weapons"] else None)
        s["transcript"].append({"from": "pip", "text": a.get("cliffhanger", ""), "ts": logic.now()})
        tasks.add_task(make_report, s["id"])
    else:
        s.update(status="quizzed", mood="stuck")
    await store.put("sessions", s)
    return s


@api.post("/sessions/{sid}/reteach")
async def reteach(sid: str, body: dict = Body(...)):
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
    s["transcript"].append({"from": "pip", "text": msg, "ts": logic.now()})
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

_locks: dict[str, asyncio.Lock] = {}


async def make_report(sid: str) -> dict:
    async with _locks.setdefault(sid, asyncio.Lock()):
        s = await need("sessions", sid, "session")
        if s.get("gap_report"):
            return s["gap_report"]
        a = await need("assignments", s["assignment_id"], "assignment")
        st = await need("students", s["student_id"], "student")
        try:
            rep = await pip_ai.report(s, a, st, await tutor_name(st))
        except Exception:
            log.exception("report failed")
            raise HTTPException(502, "could not build the report; try again")
        s["gap_report"] = rep
        await store.put("sessions", s)
        if not s.get("saved"):
            st["since_last_session"] = rep["summary"]
            await store.put("students", st)
        return rep


@api.get("/sessions/{sid}/report")
async def get_report(sid: str):
    return await make_report(sid)


@api.post("/sessions/{sid}/parent-update/preview")
async def parent_preview(sid: str):
    await make_report(sid)
    s = await need("sessions", sid, "session")
    a = await need("assignments", s["assignment_id"], "assignment")
    st = await need("students", s["student_id"], "student")
    return {"message": await pip_ai.parent_message(s, a, st, await tutor_name(st))}


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
async def pilot_checkout():
    key = os.environ.get("STRIPE_SECRET_KEY", "")
    sim = {"url": "/pilot/success", "simulated": True}
    if not key:
        return sim
    if not key.startswith("sk_test_"):
        log.error("refusing non-test Stripe key; simulating checkout")
        return sim
    form = {"mode": "payment", "success_url": f"{FRONTEND_URL}/pilot/success",
            "cancel_url": f"{FRONTEND_URL}/owner/pricing",
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


@api.post("/demo/reset")
async def demo_reset():
    _locks.clear()
    await seed(store)
    return {"ok": True}


app.include_router(api)
