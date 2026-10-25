"""Pip API (FastAPI). Every route is under /api; see CONTRACT.md."""

import asyncio
import base64
import hashlib
import json
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
import crew  # noqa: E402
import pacing  # noqa: E402
import themes  # noqa: E402
import llm  # noqa: E402
import logic  # noqa: E402
import pip_ai  # noqa: E402
import center as center_ops  # noqa: E402  (v3.13 center ops router; `center` is a route below)
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
from mascot import ACCESSORIES, clean_accessory, clean_form  # noqa: E402,F401  (B19: one list, mirrors pip2d)


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
        return {"assignment_id": None, "misconception": None, "count": 0, "boss_name": None, "student_ids": []}
    aid = max(holders, key=lambda k: len(holders[k]))
    a = await store.get("assignments", aid)
    return {"assignment_id": aid, "misconception": a["misconception"], "count": len(holders[aid]),
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
        if not s.get("saved") and s.get("kind") != "review":
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


@api.post("/students/{student_id}/pip-name")
async def set_pip_name(student_id: str, body: dict = Body(default={})):
    """Name your Pip: 1-16 characters, trimmed; anything rude falls back to "Pip"."""
    st = await need("students", student_id, "student")
    raw = re.sub(r"[^\w \-'.]", "", str(body.get("name") or ""), flags=re.UNICODE)
    name = " ".join(raw.split())[:16].strip()
    if not name or pacing.PROFANE.search(name.lower()) or pacing.INSULT.search(name.lower()):
        name = "Pip"
    st["pip_name"] = name
    await store.put("students", st)
    return {"pip_name": name, "student": st}


# ------------------------------------------------------------------ themes (v3.8)

@api.post("/themes/generate")
async def theme_generate(body: dict = Body(default={})):
    base = body.get("base") if body.get("base") in ("day", "night") else None
    return await themes.generate(str(body.get("prompt") or ""), base)


@api.get("/themes")
async def list_themes():
    mods = sorted(await store.all("themes"), key=lambda t: t.get("saved_at", ""), reverse=True)
    return {"presets": themes.PRESETS, "mods": mods, "styles": themes.STYLE_PRESETS}  # styles: v3.14


@api.post("/students/{student_id}/theme")
async def set_student_theme(student_id: str, body: dict = Body(...)):
    """Save the student's active theme: a preset/mod id, or a theme object (re-enforced; never trusted)."""
    st = await need("students", student_id, "student")
    if body.get("theme_id") is not None:
        tid = str(body["theme_id"])
        theme = themes.PRESET_BY_ID.get(tid) or await store.get("themes", tid)
        if not theme:
            raise HTTPException(404, "theme not found")
    elif isinstance(body.get("theme"), dict):
        raw = {k: v for k, v in body["theme"].items() if k != "id"}  # ids are content hashes, never client-chosen
        theme, _ = themes.enforce(raw, raw.get("base"))
        same = next((p for p in themes.PRESETS if p["tokens"] == theme["tokens"] and p["name"] == theme["name"]), None)
        if same:
            theme["id"] = same["id"]
        else:
            await store.put("themes", {**theme, "student_id": student_id, "saved_at": logic.now()})
    else:
        raise HTTPException(422, "theme_id or theme is required")
    st["theme_id"], st["theme"] = theme["id"], theme
    await store.put("students", st)
    return {"ok": True, "theme_id": theme["id"]}


@api.get("/style/tiles")
async def style_tiles():
    """v3.14 "pick your vibe" grid: 9 look tiles (no gender labels)."""
    return {"tiles": [{k: t[k] for k in ("id", "label", "style")} for t in themes.STYLE_TILES]}


@api.post("/students/{student_id}/style")
async def set_style(student_id: str, body: dict = Body(default={})):
    """v3.14: the kid's picks -> theme preset + mascot vibe + register intensity. Chosen, never inferred."""
    st = await need("students", student_id, "student")
    try:
        r = themes.style_from_tiles(body.get("tiles"))
    except ValueError as e:
        raise HTTPException(422, str(e))
    st["style"] = {"tiles": [str(x) for x in body["tiles"]], "style": r["style"], "theme_id": r["theme"]["id"],
                   "vibe": r["vibe"], "register_intensity": r["register_intensity"], "chosen_at": logic.now()}
    st["theme_id"], st["theme"] = r["theme"]["id"], r["theme"]
    await store.put("students", st)
    return {"theme": r["theme"], "vibe": r["vibe"], "register_intensity": r["register_intensity"],
            "style": r["style"]}


@api.post("/students/{student_id}/dream")
async def set_dream(student_id: str, body: dict = Body(default={})):
    st = await need("students", student_id, "student")
    if body.get("dream") not in crew.DREAMS:
        raise HTTPException(422, f"dream must be one of {', '.join(crew.DREAMS)}")
    st["pip_dream"] = body["dream"]
    st["egg_ready"] = crew.egg_ready(st)
    await store.put("students", st)
    return {"ok": True, "pip_dream": st["pip_dream"], "egg_ready": st["egg_ready"]}


@api.post("/students/{student_id}/duo")
async def choose_duo(student_id: str, body: dict = Body(default={})):
    """Pick the duo partner once."""
    st = await need("students", student_id, "student")
    if any(c.get("kind") == "duo" for c in st.get("crew", [])):
        raise HTTPException(409, "duo already chosen")
    if body.get("creature") not in crew.DUO_CREATURES:
        raise HTTPException(422, f"creature must be one of {', '.join(crew.DUO_CREATURES)}")
    member = {"kind": "duo", "id": f"duo_{body['creature']}", "name": body["creature"].capitalize(),
              "creature": body["creature"], "joined_at": logic.now()}
    st.setdefault("crew", []).append(member)
    await store.put("students", st)
    return {"ok": True, "duo": member}


@api.post("/students/{student_id}/hatch")
async def hatch(student_id: str):
    st = await need("students", student_id, "student")
    if any(c.get("kind") == "mini" for c in st.get("crew", [])):
        raise HTTPException(409, "already hatched")
    if not crew.egg_ready(st):
        raise HTTPException(400, "no egg yet: reach brain v3, win 3 K.O.s (or 1 with the family dream)")
    mini = {"kind": "mini", "id": f"mini_{student_id}", "name": f"Mini {st.get('pip_name') or 'Pip'}",
            "joined_at": logic.now()}
    st.setdefault("crew", []).append(mini)
    st["egg_ready"] = False
    await store.put("students", st)
    return {"ok": True, "mini": mini}


@api.post("/mini/{student_id}/review")
async def mini_review(student_id: str):
    """Spaced review: the mini was taught one of the student's old rules, misapplies it, the student fixes it."""
    st = await need("students", student_id, "student")
    mini = next((c for c in st.get("crew", []) if c.get("kind") == "mini"), None)
    if not mini:
        raise HTTPException(409, "hatch the egg first")
    assignments = {x["id"]: x for x in await store.all("assignments")}
    pick = crew.pick_review_rule(st, await store.all("sessions", student_id=student_id), assignments)
    if not pick:
        raise HTTPException(409, "nothing to review yet: teach Pip something first")
    src, cid, rule = pick["assignment"], pick["concept_id"], pick["rule"]
    les = lessons.lesson_of(src)
    concept = next(c for c in src["concepts"] if c["id"] == cid)
    wrong = crew.misapplication(src, les, cid)
    pseudo = {**src, "id": logic.new_id("rv"), "student_id": f"rv:{student_id}", "review": True,
              "concepts": [concept], "misconception": wrong, "quiz": [q for q in src.get("quiz", [])
                                                                       if q.get("concept_id") == cid],
              "lesson": ({**les, "concepts": [c for c in les["concepts"] if c["concept_id"] == cid]} if les else None),
              "created_at": logic.now()}
    if not pseudo["lesson"]:
        pseudo.pop("lesson")
    await store.put("assignments", pseudo)
    pip = st.get("pip_name") or "Pip"
    s = logic.new_session(pseudo, student_id, "blob", "blob", "none",
                          [f"Hi. I'm {mini['name']}. {pip} taught me this: '{rule}'.", wrong])
    s.update(kind="review", mini_name=mini["name"],
             review={"assignment_id": src["id"], "concept_id": cid, "rule": rule})
    p = pacing.ensure_pace(s, pseudo)
    p["target"], p["last_q"] = cid, wrong
    p["qlog"].append(pacing.qnorm(wrong))
    await store.put("sessions", s)
    return s


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
            **d, "subject": center_ops.infer_subject({"topic": topic, "subject": body.get("subject")}),
            "created_at": logic.now()}


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
    a["subject"] = center_ops.infer_subject(a)
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


def callback_rule(a: dict, student_sessions: list[dict]) -> str | None:
    """One CORRECT rule the student taught in an earlier session (verbatim from their old Brain), the most
    relevant to the new mission if possible, else the newest."""
    mine = sorted([x for x in student_sessions if not x.get("saved") and x.get("brain")],
                  key=lambda x: x["created_at"], reverse=True)
    cands = [r for x in mine for r in x["brain"] if r.get("correct") and (r.get("quote") or "").strip()]
    if not cands:
        return None
    want = pacing.stems(a["topic"] + " " + " ".join(c["text"] for c in a["concepts"]))
    best = max(enumerate(cands), key=lambda ir: (len(pacing.stems(ir[1]["quote"]) & want), -ir[0]))
    return best[1]["quote"].strip()


def openings(student: dict, a: dict, past: str | None = None, recall: str | None = None) -> list[str]:
    """Instant templated opening (no AI call). The LAST message is always the misconception claim."""
    if past:  # M1 past-self: the student's own old mistake, framed as hearsay, never as theirs
        claim = f"I'm learning {a['topic'].lower()}. Someone told me {past}. Seems easy."
    else:
        claim = (f"I'm learning {a['topic'].lower()}. I already know one rule: {a['misconception']}. "
                 "Easy.")
    name = student.get("pip_name") or "Pip"
    if recall:  # v3.7: Pip carries the student's earlier teaching
        return [f"Hi. I'm {name}. I still remember your thing: '{recall}'.", claim]
    return [f"Hi. I'm {name}. " + claim]


@api.post("/sessions")
async def create_session(body: dict = Body(...)):
    a = await need("assignments", body.get("assignment_id", ""), "assignment")
    st = await need("students", body.get("student_id", ""), "student")
    mine = await store.all("sessions", student_id=st["id"])
    assignments = {x["id"]: x for x in await store.all("assignments")}
    past = past_self_rule(a, mine, assignments)
    recall = callback_rule(a, mine)
    look = body.get("look") if body.get("look") in ("blob", "bot", "doodle") else "blob"
    acc = clean_accessory(body.get("accessory"))  # B19: club/earned ids, or a combined look of up to 3
    s = logic.new_session(a, st["id"], look, body.get("creature") or look, acc,
                          openings(st, a, past, recall))
    pacing.ensure_pace(s, a)  # prior-knowledge concepts (e.g. rectangle area) start credited, meter full
    s["opening_source"] = "past_self" if past else "claim"
    s["callback_rule"], s["callback_used"] = recall, False
    s["pip_voice"] = (body.get("pip_voice") or "").strip() or None
    s["vibe"] = body.get("vibe") if body.get("vibe") in ("cute", "cool", "ugly") else "cute"
    s["form"] = clean_form(body.get("form"))  # B19: "main" (Main Character) or "base"
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
    if s.get("kind") == "review" and s.get("ready_for_quiz") and s["status"] != "complete":
        s["transcript"][-1]["text"] = "ok, that makes sense now. thanks for fixing me. we good?"
        s.update(status="complete", mood="celebrating")
        meta = s["review"]
        st.setdefault("review_log", []).append({**{k: meta[k] for k in ("assignment_id", "concept_id")},
                                                "date": logic.now(), "session_id": s["id"]})
        st["reviews"] = int(st.get("reviews", 0)) + 1
        await store.put("students", st)
    await store.put("sessions", s)
    return s


@api.post("/sessions/{sid}/voice")
async def set_voice(sid: str, body: dict = Body(...)):
    s = await need("sessions", sid, "session")
    v = body.get("pip_voice")
    s["pip_voice"] = v.strip() if isinstance(v, str) and v.strip() else None
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


STRIKES = {"a_tri": "A = b \u00d7 h"}
PINS = {"a_tri": "half_pin"}


def grant_payoff(st: dict, s: dict, a: dict, from_v: int, to_v: int) -> dict:
    """Persistent Pip state at K.O.: brain version, earned items, album card (v3.7). Earn-only."""
    st["brain_version"] = to_v
    earned = st.setdefault("earned_items", [])
    new = []
    wants = (["fixed_it_star"] if s.get("reteach_count", 0) >= 1 else []) + [
        PINS.get(a["id"]) or f"{lessons.topic_family(a)}_pin"]
    for item in wants:
        if item not in earned:
            earned.append(item)
            new.append(item)
    album = st.setdefault("album", [])
    card = {"card_no": len(album) + 1, "variant": "comeback" if s.get("reteach_count", 0) >= 1 else "clean",
            "boss_name": a["boss"]["name"], "assignment_id": a["id"], "topic": a["topic"],
            "strike": a.get("strike") or STRIKES.get(a["id"]) or a["misconception"]}
    album.append({"assignment_id": a["id"], "boss_name": a["boss"]["name"], "card_no": card["card_no"],
                  "variant": card["variant"], "date": logic.now()})
    return {"from_version": from_v, "to_version": to_v, "new_items": new, "card": card}


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
        if rule is None and q["concept_id"] in ((a.get("lesson") or {}).get("prior_knowledge") or []):
            known = pip_ai.prior_answer(a, q)  # Pip's own opening claim already uses it: not taught, not missed
            new_items[q["id"]] = {**base, "rule_id": None, "passed": True, "pip_answer": known[0], "line": known[1]}
        elif rule is None:  # no rule, or the cited rule was dropped: Pip was not taught this
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
        from_v = int(st.get("brain_version") or 1)
        to_v = min(3, from_v + 1)
        s.update(ko=True, status="complete", mood="celebrating", boss_hp=0, brain_version=to_v)
        s["payoff"] = grant_payoff(st, s, a, from_v, to_v)
        s["payoff"].update(crew.ko_rewards(st, a, logic.now()))
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
        tasks.add_task(center_ops.after_ko, s["id"])  # v3.15: opt-in auto note (grade <= 6 only)
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
    pacing.reset_concept(s, a, cid)
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
async def parent_preview(sid: str, body: dict = Body(default={})):
    await make_report(sid)
    s = await need("sessions", sid, "session")
    a = await need("assignments", s["assignment_id"], "assignment")
    st = await need("students", s["student_id"], "student")
    # v3.15: a tutor-approved draft (no game words; quote = student's share > tutor pick {msg_index} > auto only
    # for grade <= 6), the guardians it goes to, and who is skipped. Instant: no AI call.
    return await center_ops.preview_update(s, a, st, await tutor_name(st), body if isinstance(body, dict) else {})


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
    a = await need("assignments", s["assignment_id"], "assignment")
    st = await need("students", s["student_id"], "student")
    # v3.13: each guardian with updates != off, in their language, via prefers, honoring quiet hours
    rows = await center_ops.send_update(s, a, st, await tutor_name(st), msg, body)
    s = await need("sessions", sid, "session")
    s["parent_sent_at"] = rows[0]["ts"]
    await store.put("sessions", s)
    return {"sent": rows[0], "sent_all": rows}


@api.get("/sent-log")
async def sent_log():
    return {"items": sorted(await store.all("sent"), key=lambda r: r["ts"], reverse=True)}


WORKSHOP_PLANS = {
    "a_frac": "Plan (30 min): 1) Draw 1/2 and 1/3 of the same pizza and ask which slice is bigger. "
              "2) Cut both into sixths and add them. 3) Pairs explain why the bottom stays the same.",
    "a_tri": "Plan (30 min): 1) Draw a 6 by 4 rectangle on graph paper, cut it corner to corner, and ask how "
             "many squares each piece covers. 2) Pairs make a different triangle from a different rectangle. "
             "3) Each student explains in one sentence why a triangle is half of base times height.",
}


@api.post("/workshops")
async def workshop(body: dict = Body(default={})):
    ins = await insight()
    mis = (body.get("misconception") or ins["misconception"] or "").strip()
    names = [(await store.get("students", sid))["name"] for sid in ins["student_ids"]]
    note = (f"Workshop: {mis}\nStudents ({len(names)}): {', '.join(names)}\n"
            + WORKSHOP_PLANS.get(ins.get("assignment_id"), WORKSHOP_PLANS["a_frac"]))
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


VOICES = json.loads((Path(__file__).parent / "voices.json").read_text())
SPEAKERS = ("pip", "boss", "announcer", "narrator")


def resolve_voice(body: dict, fallback_voice: str = "") -> dict:
    """{voice_id, stability, style, speed, name} for a speaker (see voices.json)."""
    speaker = body.get("speaker") if body.get("speaker") in SPEAKERS else "pip"
    v = None
    if speaker == "pip":
        v = dict(VOICES["pip"].get(body.get("vibe")) or VOICES["pip"]["cute"])
        pv = body.get("pip_voice")
        if isinstance(pv, str) and pv.strip():
            pv = pv.strip()
            choice = (VOICES.get("pip_choices") or {}).get(pv.lower())
            if choice:  # a named student choice: bright | chaotic | chill
                v = dict(choice)
            else:  # a raw ElevenLabs voice id overrides only the id
                v.update(voice_id=pv, name="custom")
    elif speaker == "boss":
        ref = f"{body.get('boss_id') or ''} {body.get('boss_name') or ''}".lower()
        kind = next((k for k, keys in VOICES["boss_keys"].items() if any(x in ref for x in keys)), "default")
        v = dict(VOICES["boss"][kind])
        try:
            grade = int(body.get("grade") or 0)
        except (TypeError, ValueError):
            grade = 0
        if v.get("min_grade") and grade < v["min_grade"]:
            v = dict(v["younger"])
    else:
        v = dict(VOICES[speaker])
    v.pop("younger", None)
    if not v.get("voice_id"):
        v["voice_id"] = fallback_voice
    return v


async def _eleven(text: str, key: str, voice: dict, model: str) -> httpx.Response:
    async with httpx.AsyncClient(timeout=8) as c:
        return await c.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice['voice_id']}/with-timestamps",
            headers={"xi-api-key": key, "content-type": "application/json"},
            json={"text": text, "model_id": model,
                  "voice_settings": {"stability": voice.get("stability", 0.5), "similarity_boost": 0.75,
                                     "style": voice.get("style", 0), "speed": voice.get("speed", 1)}})


@api.post("/tts")
async def tts(body: dict = Body(default={})):
    """Pip's voice. Never raises to the student: any problem returns {fallback: true} (browser voice)."""
    fb = {"fallback": True}
    try:
        text = (body.get("text") or "").strip()[:TTS_MAX_CHARS]
        key = os.environ.get("ELEVENLABS_API_KEY", "")
        voice = resolve_voice(body, os.environ.get("ELEVENLABS_VOICE_ID", ""))
        model = os.environ.get("ELEVENLABS_MODEL") or TTS_DEFAULT_MODEL
        if not (text and key and voice["voice_id"]):
            return fb
        ck = hashlib.sha256(json.dumps([text, voice, model], sort_keys=True).encode()).hexdigest()
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


center_ops.init(store, at_risk, twilio_send)
app.include_router(api)
app.include_router(center_ops.router)
