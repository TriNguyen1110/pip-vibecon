"""Center operations (CONTRACT v3.13 + v3.13b): subjects, enrollments + packages, guardians, notes, threads,
bulk assign, tutor student lists, student profiles, owner overview, the parent side, and multilingual
parent updates with quiet hours.

Every number is computed from the store (seed + live sessions), so a K.O. in the demo moves the owner's
metrics. Parents only ever see: their own linked kids, verbatim quotes that are already in gap reports
(correct rules only), and notes a tutor marked share_with_parent. No transcripts, no private notes, no
staff summaries. Server wiring: `center.init(store, at_risk, sms)` then `app.include_router(center.router)`.
"""

import asyncio
import copy
import hashlib
import json
import logging
import os
import re
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

from fastapi import APIRouter, Body, HTTPException

import lesson as lessons
import llm
import logic
import pip_ai

log = logging.getLogger("pip.center")
router = APIRouter(prefix="/api")
_ctx: dict = {"store": None, "at_risk": None, "sms": None}
OPS_FILE = Path(__file__).parent / "seed" / "seed_ops.json"


def init(store, at_risk, sms) -> None:
    """store: the app's document store; at_risk: async () -> {students: AtRisk[]}; sms: async (to, body) -> bool."""
    _ctx.update(store=store, at_risk=at_risk, sms=sms)


def clock() -> datetime:
    """Current time (UTC). Tests replace this to pin quiet hours and windows."""
    return datetime.now(timezone.utc)


# ------------------------------------------------------------------ constants

SUBJECTS = [{"id": "math", "name": "Math"}, {"id": "writing", "name": "Writing"},
            {"id": "sat_math", "name": "SAT Math"}, {"id": "sat_rw", "name": "SAT Reading & Writing"},
            {"id": "science", "name": "Science"}]
SUBJECT_IDS = tuple(s["id"] for s in SUBJECTS)
SUBJECT_NAME = {
    "en": {s["id"]: s["name"] for s in SUBJECTS},
    "es": {"math": "Matemáticas", "writing": "Escritura", "sat_math": "SAT Matemáticas",
           "sat_rw": "SAT Lectura y Escritura", "science": "Ciencias"},
    "vi": {"math": "Toán", "writing": "Viết", "sat_math": "SAT Toán", "sat_rw": "SAT Đọc và Viết",
           "science": "Khoa học"},
    "zh": {"math": "数学", "writing": "写作", "sat_math": "SAT数学", "sat_rw": "SAT阅读与写作", "science": "科学"},
}
KNOWN_SUBJECT = {"a_tri": "math", "a_frac": "math", "a_sat_commas": "writing", "a_sat_linear": "sat_math"}
RATE = {"math": 55, "writing": 55, "science": 55, "sat_math": 80, "sat_rw": 80}
LANGS = ("en", "es", "vi", "zh")
LANG_NAME = {"en": "English", "es": "Spanish", "vi": "Vietnamese", "zh": "Simplified Chinese"}
RELATIONS = ("parent", "grandparent", "guardian")
PREFERS = ("sms", "email")
UPDATES = ("every_ko", "weekly", "off")
FLAGS = ("at_risk", "needs_update", "no_contact", "new")
TZ_NAME = "America/Los_Angeles"
MIN_SAVED_PER_ITEM = 10   # tutor_hours_saved_week assumption: minutes saved per auto-written update / gap report
STRIKE = {"a_tri": "A = b × h"}
DAY = {"Mon": 0, "Tue": 1, "Wed": 2, "Thu": 3, "Fri": 4, "Sat": 5, "Sun": 6}
SLOT_RE = re.compile(r"^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (\d{1,2})(?::(\d{2}))?(am|pm)$")
QUIET_RE = re.compile(r"^([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-3]):([0-5]\d)$")
PHONE_RE = re.compile(r"^\+?1?[-. ]?\(?\d{3}\)?[-. ]?555[-. ]?01\d\d$")   # fictional 555-01xx only
EMAIL_RE = re.compile(r"^[A-Za-z0-9._%+-]+@example\.com$")                 # synthetic domain only
BANNED = re.compile(r"\b(behind|failing|failed|fail|fails|worse|worst|lowest|ranked|ranking|rank)\b", re.I)

try:
    from zoneinfo import ZoneInfo
    TZ = ZoneInfo(TZ_NAME)
except Exception:  # noqa: BLE001 - no tz database: fixed Pacific offset
    TZ = timezone(timedelta(hours=-7))


def _dt(ts: str) -> datetime:
    d = datetime.fromisoformat(ts)
    return d if d.tzinfo else d.replace(tzinfo=timezone.utc)


def _iso(d: datetime) -> str:
    return d.astimezone(timezone.utc).isoformat(timespec="seconds")


def local_today() -> date:
    return clock().astimezone(TZ).date()


def infer_subject(a: dict) -> str:
    """Assignment.subject: explicit if valid, else the seeded missions' map, else keywords in the topic."""
    if a.get("subject") in SUBJECT_IDS:
        return a["subject"]
    for k in (a.get("id"), a.get("source_id")):
        if k in KNOWN_SUBJECT:
            return KNOWN_SUBJECT[k]
    t = (a.get("topic") or "").lower()
    sat = "sat" in re.findall(r"[a-z]+", t)
    if re.search(r"scien|biolog|chemi|physic|\bcells?\b|ecosystem|photosynth|\bforce", t):
        return "science"
    if re.search(r"writ|essay|comma|grammar|sentence|punctuat|paragraph|reading|vocab", t):
        return "sat_rw" if sat else "writing"
    return "sat_math" if sat else "math"


# ------------------------------------------------------------------ i18n (offline templates; AI when live)

T = {
    "update_head": {"en": "Bright Path Tutoring: {first} taught Pip “{topic}” this week. ",
                    "es": "Bright Path Tutoring: Esta semana {first} le enseñó a Pip «{topic}». ",
                    "vi": "Bright Path Tutoring: Tuần này {first} đã dạy Pip «{topic}». ",
                    "zh": "Bright Path Tutoring：本周{first}教Pip学习了「{topic}」。"},
    "update_quote": {"en": "In {first}'s own words: \"{quote}\". ", "es": "En sus propias palabras: \"{quote}\". ",
                     "vi": "Theo lời của {first}: \"{quote}\". ", "zh": "用{first}自己的话说：\"{quote}\"。"},
    "update_noquote": {"en": "{first} explained the key ideas in their own words. ",
                       "es": "{first} explicó las ideas clave con sus propias palabras. ",
                       "vi": "{first} đã giải thích các ý chính bằng lời của mình. ",
                       "zh": "{first}用自己的话讲清楚了关键概念。"},
    "fixed": {"en": "{first} also found a mistake in Pip's thinking and fixed it. ",
              "es": "{first} también encontró un error en el razonamiento de Pip y lo corrigió. ",
              "vi": "{first} còn phát hiện một lỗi trong cách nghĩ của Pip và đã sửa lại. ",
              "zh": "{first}还发现了Pip思路中的一个错误，并把它改正了。"},
    "level": {"en": "Pip's brain levelled up to v{v}. ", "es": "El cerebro de Pip subió a la v{v}. ",
              "vi": "Bộ não của Pip đã lên cấp v{v}. ", "zh": "Pip的大脑升级到了v{v}。"},
    "next_ko": {"en": "Next time, {first} takes on a new challenge.", "es": "La próxima vez, {first} tendrá un nuevo reto.",
                "vi": "Buổi tới, {first} sẽ nhận một thử thách mới.", "zh": "下次课，{first}将迎接新的挑战。"},
    "next": {"en": "Next time, {first} keeps teaching Pip.", "es": "La próxima vez, {first} seguirá enseñándole a Pip.",
             "vi": "Buổi tới, {first} sẽ tiếp tục dạy Pip.", "zh": "下次课，{first}会继续教Pip。"},
    "sign": {"en": " - {tutor}", "es": " - {tutor}", "vi": " - {tutor}", "zh": " - {tutor}"},
    "week": {"en": "{first} explained {ideas} to Pip in their own words: \u201c{topic}\u201d.",
             "es": "{first} le explicó a Pip {ideas} con sus propias palabras: «{topic}».",
             "vi": "{first} đã giải thích cho Pip {ideas} bằng lời của mình: «{topic}».",
             "zh": "{first}用自己的话向Pip讲解了{ideas}：「{topic}」。"},
    "week_none": {"en": "{first} practiced \u201c{topic}\u201d with Pip.", "es": "{first} practicó «{topic}» con Pip.",
                  "vi": "{first} đã luyện tập «{topic}» cùng Pip.", "zh": "{first}和Pip一起练习了「{topic}」。"},
    "week_ko": {"en": " Pip beat the boss!", "es": " ¡Pip venció al jefe!", "vi": " Pip đã hạ gục trùm cuối!",
                "zh": "Pip打败了大怪兽！"},
    "ideas": {"en": ("1 idea", "{n} ideas"), "es": ("1 idea", "{n} ideas"), "vi": ("1 ý", "{n} ý"),
              "zh": ("1个概念", "{n}个概念")},
    "hours": {"en": ("no hours", "1 hour", "{n} hours"), "es": ("0 horas", "1 hora", "{n} horas"),
              "vi": ("0 giờ", "1 giờ", "{n} giờ"), "zh": ("0小时", "1小时", "{n}小时")},
    "renewal": {"en": "Hi {g}, {first}'s {subject} package with {tutor} has {hours} left and renews on {date}. "
                      "{evidence}Want to keep going? Reply here and we'll set it up. - {tutor}",
                "es": "Hola {g}, al paquete de {subject} de {first} con {tutor} le quedan {hours} y se renueva el "
                      "{date}. {evidence}¿Quieren continuar? Respondan aquí y lo preparamos. - {tutor}",
                "vi": "Chào {g}, gói {subject} của {first} với {tutor} còn {hours} và sẽ gia hạn vào ngày {date}. "
                      "{evidence}Gia đình có muốn tiếp tục không? Hãy trả lời tin nhắn này, chúng tôi sẽ sắp xếp. "
                      "- {tutor}",
                "zh": "{g}您好，{first}与{tutor}的{subject}课程包还剩{hours}，将于{date}续费。{evidence}"
                      "想继续吗？回复此消息，我们来安排。- {tutor}"},
    "evidence": {"en": "This week {first} taught Pip: \"{quote}\". ", "es": "Esta semana {first} le enseñó a Pip: \"{quote}\". ",
                 "vi": "Tuần này {first} đã dạy Pip: \"{quote}\". ", "zh": "本周{first}教Pip：\"{quote}\"。"},
}


def short_topic(topic: str) -> str:
    """Parent copy drops a trailing parenthetical: "SAT Math: solving linear equations (do the same...)"."""
    return re.sub(r"\s*\([^)]*\)\s*$", "", topic or "").strip() or topic


def tr(key: str, lang: str, **kw) -> str:
    return T[key].get(lang, T[key]["en"]).format(**kw)


def update_template(lang: str, f: dict) -> str:
    """Offline parent update in the guardian's language: what the kid taught (verbatim) and fixed first."""
    out = tr("update_head", lang, **f)
    out += tr("update_quote", lang, **f) if f.get("quote") else tr("update_noquote", lang, **f)
    if f.get("fixed"):
        out += tr("fixed", lang, **f)
    if f.get("ko"):
        out += tr("level", lang, **f) + tr("next_ko", lang, **f)
    else:
        out += tr("next", lang, **f)
    return out + tr("sign", lang, **f)


def week_summary(lang: str, first: str, topic: str, n: int, ko: bool, fixed: bool) -> str:
    if n:
        one, many = T["ideas"].get(lang, T["ideas"]["en"])
        out = tr("week", lang, first=first, topic=topic, ideas=one if n == 1 else many.format(n=n))
    else:
        out = tr("week_none", lang, first=first, topic=topic)
    if ko:
        out += tr("week_ko", lang)
    if fixed:
        out += " " + tr("fixed", lang, first=first).strip() if lang != "zh" else tr("fixed", lang, first=first)
    return out


def hours_text(lang: str, n: int) -> str:
    zero, one, many = T["hours"].get(lang, T["hours"]["en"])
    return zero if n <= 0 else one if n == 1 else many.format(n=n)


I18N_SYSTEM = """You localize a short text message from the tutoring center "Bright Path Tutoring" to a \
parent. Write it in {lang}, natural and warm, 2 to 4 sentences, at most one emoji. Keep every part inside \
double quotes exactly as written (those are the student's own words; never translate or change them). Keep \
names, "Pip", "Bright Path Tutoring" and the sign-off. Lead with what the student taught and fixed. Never \
mention being behind, failing, scores, or other children."""
_i18n_cache: dict[str, str] = {}


def _quotes(text: str) -> list[str]:
    return [q for q in re.findall(r"\"([^\"]{3,})\"", text)]


def tone_ok(text: str) -> bool:
    return bool(text.strip()) and not BANNED.search(text)


_i18n_pending: dict[str, asyncio.Task] = {}


async def _ai_call(text: str, lang: str, key: str) -> str | None:
    try:
        r = await llm.structured(I18N_SYSTEM.format(lang=LANG_NAME[lang]), [{"role": "user", "content": text}],
                                 llm.obj({"message": {"type": "string"}}), model=llm.WORK_MODEL, effort="low",
                                 max_tokens=700, timeout=20)
        out = (r.get("message") or "").strip()
    except (llm.LlmError, KeyError, TypeError, AttributeError) as e:
        log.warning("parent localize fell back to template: %s", e)
        return None
    finally:
        _i18n_pending.pop(key, None)
    if not tone_ok(out) or any(q not in out for q in _quotes(text)):
        log.warning("parent localize rejected (tone or quote check)")
        return None
    _i18n_cache[key] = out
    return out


async def ai_localize(text: str, lang: str, wait: float = 6.0) -> str | None:
    """One structured call (work model, low effort), awaited at most `wait` seconds so Preview stays fast; the
    call keeps running and fills the cache for the next Preview/Send. None -> callers use the template."""
    if lang == "en" or not llm.available():
        return None
    key = hashlib.sha256(f"{lang}\0{text}".encode()).hexdigest()
    if key in _i18n_cache:
        return _i18n_cache[key]
    task = _i18n_pending.get(key)
    if task is None:
        task = _i18n_pending[key] = asyncio.create_task(_ai_call(text, lang, key))
    try:
        return await asyncio.wait_for(asyncio.shield(task), wait)
    except asyncio.TimeoutError:
        return None


# ------------------------------------------------------------------ guardians, contact, quiet hours

def channel(g: dict) -> tuple[str | None, str | None]:
    """(via, contact) honoring prefers; falls back to the other channel; (None, None) if unreachable."""
    order = ["sms", "email"] if g.get("prefers") != "email" else ["email", "sms"]
    for via in order:
        contact = g.get("phone") if via == "sms" else g.get("email")
        if contact:
            return via, contact
    return None, None


def reachable(g: dict) -> bool:
    return channel(g)[0] is not None


def quiet_until(g: dict, now: datetime | None = None) -> datetime | None:
    """If `now` is inside the guardian's quiet hours (center local time), when they end (UTC); else None."""
    m = QUIET_RE.match(g.get("quiet_hours") or "")
    if not m:
        return None
    now = now or clock()
    loc = now.astimezone(TZ)
    start, end = int(m[1]) * 60 + int(m[2]), int(m[3]) * 60 + int(m[4])
    t = loc.hour * 60 + loc.minute
    inside = (start <= t < end) if start <= end else (t >= start or t < end)
    if not inside:
        return None
    end_dt = loc.replace(hour=int(m[3]), minute=int(m[4]), second=0, microsecond=0)
    if end_dt <= loc:
        end_dt += timedelta(days=1)
    return end_dt.astimezone(timezone.utc)


async def deliver(g: dict, text: str) -> dict:
    """Test-mode send honoring prefers + quiet_hours. Twilio (if configured) only ever texts TEST_PARENT_PHONE;
    the guardian's own number is synthetic."""
    via, contact = channel(g)
    until = quiet_until(g)
    out = {"via": via, "to": f"{g['name']} · {via} {contact}" if via else f"{g['name']} (no contact)"}
    if until:
        return {**out, "status": "queued (quiet hours)", "deliver_after": _iso(until)}
    ok = False
    if via == "sms" and _ctx["sms"]:
        ok = await _ctx["sms"](os.environ.get("TEST_PARENT_PHONE", ""), text)
    return {**out, "status": "delivered" if ok else "test-mode (not delivered)"}


def parent_safe_student(st: dict) -> dict:
    return {"id": st["id"], "name": st["name"], "grade": st.get("grade"), "pip_name": st.get("pip_name") or "Pip"}


# ------------------------------------------------------------------ snapshot (one load per request)

class Snap:
    def __init__(self, now, students, tutors, assignments, sessions, events, sent, guardians, notes, threads,
                 risk):
        self.now, self.today = now, now.astimezone(TZ).date()
        self.students = {s["id"]: s for s in students}
        self.tutors = {t["id"]: t for t in tutors}
        self.assignments = {a["id"]: a for a in assignments}
        self.sessions = defaultdict(list)
        for s in sessions:
            if not s.get("saved") and s.get("kind") != "review":
                self.sessions[s["student_id"]].append(s)
        for v in self.sessions.values():
            v.sort(key=lambda s: s["created_at"])
        self.opens = defaultdict(list)
        for e in events:
            if e.get("kind") == "open" and not e.get("due"):
                self.opens[e["student_id"]].append(_dt(e["ts"]))
        self.sent = defaultdict(list)
        for r in sent:
            self.sent[r["student_id"]].append(r)
        self.guardians = {g["id"]: g for g in guardians}
        self.g_of = defaultdict(list)
        for g in sorted(guardians, key=lambda g: g["id"]):
            for sid in g.get("student_ids") or []:
                self.g_of[sid].append(g)
        self.notes = defaultdict(list)
        for n in notes:
            self.notes[n["student_id"]].append(n)
        self.threads = defaultdict(list)
        for m in threads:
            self.threads[m["student_id"]].append(m)
        self.risk = {r["student_id"]: r for r in risk}
        self.week_ago = now - timedelta(days=7)

    # --- small facts
    def tutor_ref(self, tid):
        t = self.tutors.get(tid)
        return {"id": tid, "name": t["name"] if t else tid}

    def subj(self, s: dict) -> str | None:
        a = self.assignments.get(s["assignment_id"])
        return infer_subject(a) if a else None

    def in_subject(self, sid, subject):
        return [s for s in self.sessions.get(sid, []) if self.subj(s) == subject]

    def enrollments(self, sid):
        return [enrollment_view(e, self.today) for e in self.students[sid].get("enrollments") or []]

    def came_back_7d(self, sid):
        return any(t >= self.week_ago for t in self.opens.get(sid, []))

    def ko_7d(self, sid):
        return any(s.get("ko") and _dt(s["created_at"]) >= self.week_ago for s in self.sessions.get(sid, []))

    def signal(self, sid):
        return "engaged" if self.came_back_7d(sid) or self.ko_7d(sid) else "quiet"

    def last_update(self, sid):
        ts = [_dt(r["ts"]) for r in self.sent.get(sid, [])]
        ts += [_dt(s["parent_sent_at"]) for s in self.sessions.get(sid, []) if s.get("parent_sent_at")]
        return max(ts) if ts else None

    def needs_update(self, sid):
        done = [s for s in self.sessions.get(sid, []) if s["status"] in ("quizzed", "complete")]
        if not done:
            return False
        last = self.last_update(sid)
        return last is None or last < _dt(done[-1]["created_at"])

    def no_contact(self, sid):
        return not any(reachable(g) for g in self.g_of.get(sid, []))

    def is_new(self, sid):
        es = self.students[sid].get("enrollments") or []
        return bool(es) and min(date.fromisoformat(e["started"]) for e in es) >= self.today - timedelta(days=14)

    def flags(self, sid):
        on = {"at_risk": sid in self.risk, "needs_update": self.needs_update(sid),
              "no_contact": self.no_contact(sid), "new": self.is_new(sid)}
        return [f for f in FLAGS if on[f]]

    def last_active(self, sid, subject=None):
        ts = [_dt(s["created_at"]) for s in (self.in_subject(sid, subject) if subject else self.sessions.get(sid, []))]
        ts += [_dt(e["last_attended"]) for e in self.students[sid].get("enrollments") or []
               if e.get("last_attended") and (subject is None or e["subject"] == subject)]
        if subject is None:
            ts += self.opens.get(sid, [])
        return max(ts) if ts else None

    def report(self, s):
        a = self.assignments.get(s["assignment_id"])
        if not a:
            return None, None
        return a, s.get("gap_report") or pip_ai.report_det(s, a, self.students[s["student_id"]])

    def taught(self, s):
        """Verbatim quotes the student taught correctly (from the gap report) + fixed pairs."""
        a, rep = self.report(s)
        if not rep:
            return [], []
        good = [c for c in rep["concepts"] if c["status"] == "explained" and (c.get("quote") or "").strip()]
        before = a.get("strike") or STRIKE.get(a.get("source_id") or a["id"]) or a.get("misconception")
        fixed = [{"before": before, "after": c["quote"]} for c in good if c.get("fixed_after")]
        return [c["quote"] for c in good], fixed

    def evidence_quote(self, sid, subject=None):
        """The newest K.O. quote (prefer a fixed one); falls back to any correct taught rule."""
        sess = list(reversed(self.in_subject(sid, subject) if subject else self.sessions.get(sid, [])))
        for want_ko in (True, False):
            for s in sess:
                if want_ko and not s.get("ko"):
                    continue
                quotes, fixed = self.taught(s)
                if quotes:
                    return fixed[0]["after"] if fixed else quotes[-1]
        return None


def enrollment_view(e: dict, today: date) -> dict:
    p = dict(e.get("package") or {})
    if p:
        left = max(0, int(p.get("hours_total", 0)) - int(p.get("hours_used", 0)))
        renews = date.fromisoformat(p["renews_on"])
        p.update(hours_left=left, status="expired" if renews < today else "low" if left <= 2 else "active")
    return {**e, "package": p or None}


def renewal_due(e: dict, today: date) -> bool:
    p = e.get("package")
    return bool(p) and p["status"] != "expired" and (
        p["status"] == "low" or date.fromisoformat(p["renews_on"]) <= today + timedelta(days=14))


async def snapshot(with_risk: bool = True) -> Snap:
    st = _ctx["store"]
    colls = ("students", "tutors", "assignments", "sessions", "events", "sent", "guardians", "notes", "threads")
    data = await asyncio.gather(*(st.all(c) for c in colls))
    risk = (await _ctx["at_risk"]())["students"] if with_risk and _ctx["at_risk"] else []
    return Snap(clock(), *data, risk)


def next_occurrence(slot: str, now: datetime) -> datetime | None:
    m = SLOT_RE.match(slot or "")
    if not m:
        return None
    hour = int(m[2]) % 12 + (12 if m[4] == "pm" else 0)
    loc = now.astimezone(TZ)
    d = loc.replace(hour=hour, minute=int(m[3] or 0), second=0, microsecond=0)
    d += timedelta(days=(DAY[m[1]] - loc.weekday()) % 7)
    if d <= loc:
        d += timedelta(days=7)
    return d


def soonest(enrollments: list[dict], now: datetime) -> dict | None:
    best = None
    for e in enrollments:
        if (e.get("package") or {}).get("status") == "expired":
            continue
        at = next_occurrence(e.get("slot"), now)
        if at and (best is None or at < best["_at"]):
            best = {"subject": e["subject"], "tutor_id": e["tutor_id"], "slot": e["slot"], "_at": at}
    if best:
        best["at"] = _iso(best.pop("_at"))
    return best


def _need(doc, what):
    if not doc:
        raise HTTPException(404, f"{what} not found")
    return doc


# ------------------------------------------------------------------ staff endpoints

@router.get("/subjects")
async def subjects():
    with_missions = {infer_subject(a) for a in await _ctx["store"].all("assignments") if not a.get("review")}
    return {"subjects": [{**s, "has_missions": s["id"] in with_missions} for s in SUBJECTS]}


@router.get("/tutors")
async def tutors():
    sn = await snapshot()
    out = []
    for tid, t in sorted(sn.tutors.items()):
        mine = {sid for sid, st in sn.students.items()
                if st.get("tutor_id") == tid or any(e["tutor_id"] == tid for e in st.get("enrollments") or [])}
        subj = set(t.get("subjects") or []) | {e["subject"] for sid in mine
                                               for e in sn.students[sid].get("enrollments") or []
                                               if e["tutor_id"] == tid}
        out.append({"id": tid, "name": t["name"], "subjects": [s for s in SUBJECT_IDS if s in subj],
                    "students": len(mine), "at_risk": sum(1 for sid in mine if sid in sn.risk)})
    return {"tutors": out}


def subject_cells(sn: Snap, sid: str, tid: str | None = None) -> list[dict]:
    cells = []
    for e in sn.enrollments(sid):
        sess = sn.in_subject(sid, e["subject"])
        p = e.get("package") or {}
        flag = None
        last = sn.last_update(sid)
        if any(s["status"] in ("quizzed", "complete") and (last is None or last < _dt(s["created_at"]))
               for s in sess):
            flag = "needs_update"
        elif p.get("status") == "expired":
            flag = "expired"
        elif p.get("status") == "low":
            flag = "low_hours"
        elif renewal_due(e, sn.today):
            flag = "renewal_due"
        la = sn.last_active(sid, e["subject"])
        cells.append({"subject": e["subject"], "tutor": sn.tutor_ref(e["tutor_id"]), "mine": e["tutor_id"] == tid,
                      "slot": e["slot"], "last_active": _iso(la) if la else None,
                      "ko_count": sum(1 for s in sess if s.get("ko")), "flag": flag, "package": p or None})
    return cells


@router.get("/tutors/{tutor_id}/students")
async def tutor_students(tutor_id: str, subject: str | None = None, q: str | None = None,
                         filter: str | None = None):  # noqa: A002 - contract name
    sn = await snapshot()
    tutor = _need(sn.tutors.get(tutor_id), "tutor")
    if subject and subject not in SUBJECT_IDS:
        raise HTTPException(422, f"subject must be one of {', '.join(SUBJECT_IDS)}")
    if filter and filter not in FLAGS:
        raise HTTPException(422, f"filter must be one of {', '.join(FLAGS)}")
    rows, counts = [], {f: 0 for f in FLAGS}
    needle = (q or "").strip().lower()
    for sid, st in sn.students.items():
        mine = [e for e in st.get("enrollments") or [] if e["tutor_id"] == tutor_id]
        if not mine and st.get("tutor_id") != tutor_id:
            continue
        if subject and not any(e["subject"] == subject for e in mine):
            continue
        if needle and needle not in st["name"].lower() and needle != sid:
            continue
        flags = sn.flags(sid)
        for f in flags:
            counts[f] += 1
        if filter and filter not in flags:
            continue
        nxt = soonest([enrollment_view(e, sn.today) for e in mine] or sn.enrollments(sid), sn.now)
        rows.append({"student": st, "subjects": subject_cells(sn, sid, tutor_id),
                     "guardians": [{"id": g["id"], "name": g["name"], "reachable": reachable(g)}
                                   for g in sn.g_of.get(sid, [])],
                     "flags": flags, "next_slot": nxt["slot"] if nxt else None, "next_at": nxt["at"] if nxt else None})
    rank = {f: i for i, f in enumerate(FLAGS)}
    rows.sort(key=lambda r: (min([rank[f] for f in r["flags"] if f != "new"] or [9]), r["student"]["name"]))
    return {"tutor": tutor, "rows": rows, "counts": counts}


def mastery(a: dict | None, s: dict | None) -> list[dict]:
    if not a:
        return []
    rules = {r["concept_id"]: r for r in (s or {}).get("brain") or []}
    out = []
    for c in a["concepts"]:
        lvl = int(((s or {}).get("ladder") or {}).get(c["id"], {}).get("best_level") or 0)
        r = rules.get(c["id"])
        if r and r.get("correct"):
            lvl = max(lvl, 2)
        elif r:
            lvl = min(lvl, 1)
        out.append({"concept_id": c["id"], "text": c["text"], "level": max(0, min(3, lvl))})
    return out


def progress(sn: Snap, sid: str) -> list[dict]:
    st = sn.students[sid]
    mine_a = sorted((a for a in sn.assignments.values() if a.get("student_id") == sid and not a.get("review")),
                    key=lambda a: a.get("created_at") or "")
    out = []
    for e in sn.enrollments(sid):
        subj = e["subject"]
        sess = sn.in_subject(sid, subj)
        latest = sess[-1] if sess else None
        cur = (sn.assignments.get(latest["assignment_id"]) if latest else None) or next(
            (a for a in reversed(mine_a) if infer_subject(a) == subj), None)
        cur_s = next((s for s in reversed(sess) if cur and s["assignment_id"] == cur["id"]), None)
        open_mis = None
        for s in reversed(sess):
            bad = next((r for r in s.get("brain") or [] if not r.get("correct") and not r.get("fixed_after")), None)
            if bad:
                a = sn.assignments.get(s["assignment_id"]) or {}
                open_mis = {"quote": bad["quote"], "mission": a.get("topic"), "mission_id": a.get("id"),
                            "session_id": s["id"]}
                break
            if s.get("ko"):
                break  # a later K.O. closes older misconceptions
        nxt = next_occurrence(e["slot"], sn.now) if (e.get("package") or {}).get("status") != "expired" else None
        out.append({
            "subject": subj, "tutor": sn.tutor_ref(e["tutor_id"]),
            "missions_done": len({s["assignment_id"] for s in sess if s["status"] == "complete"}),
            "ko_count": sum(1 for s in sess if s.get("ko")),
            "last_session_at": latest["created_at"] if latest else None,
            "next_slot": e["slot"] if nxt else None, "next_at": _iso(nxt) if nxt else None,
            "mastery": mastery(cur, cur_s), "current_mission": ({"id": cur["id"], "topic": cur["topic"]} if cur else None),
            "open_misconception": open_mis, "at_risk": sn.risk.get(sid) if sess else None,
            "package": e.get("package"), "goal": e.get("goal"),
        })
    return out


def timeline(sn: Snap, sid: str) -> list[dict]:
    items = []
    by_id = {s["id"]: s for s in sn.sessions.get(sid, [])}
    for s in sn.sessions.get(sid, []):
        a = sn.assignments.get(s["assignment_id"]) or {"topic": "a mission", "concepts": []}
        n_ok = sum(1 for r in s.get("brain") or [] if r.get("correct"))
        total = len(a.get("concepts") or []) or 3
        if s.get("ko"):
            text = f"K.O. on {a['topic']}: {n_ok} of {total} ideas taught"
            text += f", fixed after {s['reteach_count']} re-teach" if s.get("reteach_count") else ""
        elif s["status"] == "quizzed":
            text = f"Quizzed Pip on {a['topic']}: {n_ok} of {total} ideas taught"
        else:
            text = f"Teaching Pip {a['topic']}"
        items.append({"ts": s["created_at"], "kind": "ko" if s.get("ko") else "session", "subject": sn.subj(s),
                      "text": text, "link": f"/tutor/report/{s['id']}" if s["status"] != "teaching" else None})
    for r in sn.sent.get(sid, []):
        s = by_id.get(r.get("session_id"))
        lang = f", {r['language']}" if r.get("language") else ""
        items.append({"ts": r["ts"], "kind": "update", "subject": sn.subj(s) if s else None,
                      "text": f"Parent update to {r['to']}{lang}: {r['status']}", "link": None})
    for m in sn.threads.get(sid, []):
        if m.get("kind") == "update":
            continue
        who = (sn.guardians.get(m["guardian_id"], {}).get("name") if m["from"] == "guardian"
               else sn.tutor_ref(m["author_id"])["name"] if m["from"] == "tutor" else "Bright Path Tutoring")
        items.append({"ts": m["ts"], "kind": "message", "subject": None,
                      "text": f"{who}: {m.get('translation') or m['text']}"[:220], "link": None})
    for n in sn.notes.get(sid, []):
        items.append({"ts": n["ts"], "kind": "note", "subject": n["subject"],
                      "text": f"{sn.tutor_ref(n['tutor_id'])['name']} ({'shared with parents' if n['share_with_parent'] else 'private'}): {n['text']}",
                      "link": None})
    items.sort(key=lambda x: _dt(x["ts"]), reverse=True)
    return items[:60]


@router.get("/students/{student_id}/profile")
async def profile(student_id: str):
    sn = await snapshot()
    st = _need(sn.students.get(student_id), "student")
    return {"student": st, "enrollments": sn.enrollments(student_id), "progress": progress(sn, student_id),
            "guardians": [{**g, "reachable": reachable(g)} for g in sn.g_of.get(student_id, [])],
            "notes": sorted(sn.notes.get(student_id, []), key=lambda n: n["ts"], reverse=True),
            "timeline": timeline(sn, student_id), "flags": sn.flags(student_id),
            "signal": sn.signal(student_id)}


@router.post("/students/{student_id}/notes")
async def add_note(student_id: str, body: dict = Body(...)):
    store = _ctx["store"]
    _need(await store.get("students", student_id), "student")
    _need(await store.get("tutors", str(body.get("tutor_id") or "")), "tutor")
    text = str(body.get("text") or "").strip()
    if not text or len(text) > 2000:
        raise HTTPException(422, "text is required (max 2000 characters)")
    subj = body.get("subject")
    if subj not in SUBJECT_IDS:
        raise HTTPException(422, f"subject must be one of {', '.join(SUBJECT_IDS)}")
    note = {"id": logic.new_id("note"), "student_id": student_id, "tutor_id": body["tutor_id"], "subject": subj,
            "text": text, "ts": _iso(clock()), "share_with_parent": bool(body.get("share_with_parent"))}
    await store.put("notes", note)
    return note


def default_package(subject: str, today: date) -> dict:
    return {"hours_total": 8, "hours_used": 0, "price_usd": 8 * RATE[subject],
            "renews_on": (today + timedelta(days=56)).isoformat(), "status": "active"}


@router.post("/students/{student_id}/enrollments")
async def add_enrollment(student_id: str, body: dict = Body(...)):
    store = _ctx["store"]
    st = _need(await store.get("students", student_id), "student")
    _need(await store.get("tutors", str(body.get("tutor_id") or "")), "tutor")
    subj = body.get("subject")
    if subj not in SUBJECT_IDS:
        raise HTTPException(422, f"subject must be one of {', '.join(SUBJECT_IDS)}")
    slot = str(body.get("slot") or "").strip()
    if not SLOT_RE.match(slot):
        raise HTTPException(422, 'slot looks like "Tue 4:30pm"')
    ens = st.setdefault("enrollments", [])
    if any(e["subject"] == subj and e["tutor_id"] == body["tutor_id"] for e in ens):
        raise HTTPException(409, "already enrolled in this subject with this tutor")
    today = local_today()
    pkg = default_package(subj, today)
    if isinstance(body.get("package"), dict):
        p = body["package"]
        try:
            pkg.update({k: int(p[k]) for k in ("hours_total", "hours_used", "price_usd") if k in p})
            if p.get("renews_on"):
                pkg["renews_on"] = date.fromisoformat(str(p["renews_on"])).isoformat()
        except (TypeError, ValueError):
            raise HTTPException(422, "package: hours_total/hours_used/price_usd are numbers, renews_on is a date")
    e = {"id": logic.new_id("en"), "student_id": student_id, "subject": subj, "tutor_id": body["tutor_id"],
         "slot": slot, "goal": (str(body.get("goal")).strip() or None) if body.get("goal") else None,
         "started": today.isoformat(), "last_attended": None, "package": pkg}
    e = enrollment_view(e, today)
    ens.append(e)
    await store.put("students", st)
    return e


@router.post("/assignments/bulk")
async def bulk_assign(body: dict = Body(...)):
    store = _ctx["store"]
    src = body.get("assignment")
    if not isinstance(src, dict):
        raise HTTPException(422, "assignment is required")
    cs = src.get("concepts") or []
    if len(cs) != 3 or not src.get("topic") or not src.get("misconception"):
        raise HTTPException(422, "need topic, misconception and 3 concepts")
    ids = list(dict.fromkeys(str(x) for x in body.get("student_ids") or []))
    if not ids:
        raise HTTPException(422, "student_ids is required")
    students = {sid: await store.get("students", sid) for sid in ids}
    missing = [sid for sid, st in students.items() if not st]
    if missing:
        raise HTTPException(404, f"student not found: {', '.join(missing)}")
    subj = infer_subject(src)
    base = copy.deepcopy(src)
    base["concepts"] = [{"id": c.get("id") or f"k{i + 1}", "text": c["text"], "weapon": c.get("weapon", "")}
                        for i, c in enumerate(cs)]
    base.setdefault("boss", {"name": "Guess-Guess Goose", "emoji": "🪿🎲",
                             "backstory": "A goose rolling dice instead of checking its work."})
    for k in ("cliffhanger", "root_prerequisite", "why_it_matters"):
        base.setdefault(k, "")
    if base.get("lesson"):
        base["lesson"] = lessons.normalize_lesson(base["lesson"]) or lessons.offline_lesson(
            base["concepts"], base["topic"])
    if {q.get("concept_id") for q in base.get("quiz") or []} != set(logic.concept_ids(base)):
        base["quiz"] = pip_ai.quiz_for(base)
    out = []
    for sid in ids:
        st = students[sid]
        en = next((e for e in st.get("enrollments") or [] if e["subject"] == subj), None)
        a = {**copy.deepcopy(base), "id": logic.new_id("a"), "student_id": sid,
             "tutor_id": (en or {}).get("tutor_id") or src.get("tutor_id") or st["tutor_id"],
             "grade": src.get("grade") or st.get("grade"), "subject": subj,
             "source_id": src.get("source_id") or src.get("id"), "created_at": logic.now()}
        await store.put("assignments", a)
        out.append(a)
    return {"assignments": out}


def _guardian_fields(body: dict, partial: bool) -> dict:
    out = {}
    checks = {"relation": RELATIONS, "prefers": PREFERS, "language": LANGS, "updates": UPDATES}
    for k, allowed in checks.items():
        if k in body:
            if body[k] not in allowed:
                raise HTTPException(422, f"{k} must be one of {', '.join(allowed)}")
            out[k] = body[k]
    if "quiet_hours" in body:
        qh = body["quiet_hours"] or None
        if qh is not None and not QUIET_RE.match(str(qh)):
            raise HTTPException(422, 'quiet_hours looks like "21:00-07:00" or null')
        out["quiet_hours"] = qh
    if "phone" in body:
        p = (str(body["phone"]).strip() if body["phone"] else None) or None
        if p and not PHONE_RE.match(p):
            raise HTTPException(422, "phone must be a synthetic 555-01xx number")
        out["phone"] = p
    if "email" in body:
        e = (str(body["email"]).strip() if body["email"] else None) or None
        if e and not EMAIL_RE.match(e):
            raise HTTPException(422, "email must be a synthetic @example.com address")
        out["email"] = e
    if not partial and "name" in body:
        out["name"] = str(body["name"]).strip()[:60]
    return out


@router.post("/guardians")
async def create_guardian(body: dict = Body(...)):
    store = _ctx["store"]
    f = _guardian_fields(body, partial=False)
    if not f.get("name"):
        raise HTTPException(422, "name is required")
    sids = list(dict.fromkeys(str(x) for x in body.get("student_ids") or []))
    students = [await store.get("students", sid) for sid in sids]
    if not sids or not all(students):
        raise HTTPException(422, "student_ids must list existing students")
    nums = [int(g["id"][1:]) for g in await store.all("guardians") if re.fullmatch(r"g\d+", g["id"])]
    g = {"id": f"g{max(nums or [0]) + 1:03d}", "relation": "parent", "phone": None, "email": None,
         "prefers": "sms" if f.get("phone") or not f.get("email") else "email", "language": "en",
         "updates": "every_ko", "quiet_hours": None, **f, "student_ids": sids}
    await store.put("guardians", g)
    for st in students:
        st["guardian_ids"] = list(dict.fromkeys((st.get("guardian_ids") or []) + [g["id"]]))
        await store.put("students", st)
    return g


@router.patch("/guardians/{gid}")
async def patch_guardian(gid: str, body: dict = Body(...)):
    store = _ctx["store"]
    g = _need(await store.get("guardians", gid), "guardian")
    allowed = {"prefers", "language", "updates", "quiet_hours", "phone", "email"}
    extra = set(body) - allowed
    if extra:
        raise HTTPException(422, f"cannot change: {', '.join(sorted(extra))}")
    g.update(_guardian_fields(body, partial=True))
    await store.put("guardians", g)
    return g


@router.get("/threads")
async def threads(student_id: str | None = None, guardian_id: str | None = None):
    eq = {k: v for k, v in (("student_id", student_id), ("guardian_id", guardian_id)) if v}
    items = await _ctx["store"].all("threads", **eq)
    return {"items": sorted(items, key=lambda m: (m["ts"], m["id"]))}


@router.post("/threads")
async def post_thread(body: dict = Body(...)):
    store = _ctx["store"]
    st = _need(await store.get("students", str(body.get("student_id") or "")), "student")
    g = _need(await store.get("guardians", str(body.get("guardian_id") or "")), "guardian")
    if st["id"] not in (g.get("student_ids") or []):
        raise HTTPException(403, "this guardian is not linked to this student")
    frm = body.get("from")
    if frm not in ("tutor", "guardian", "center"):
        raise HTTPException(422, "from must be tutor, guardian or center")
    text = str(body.get("text") or "").strip()
    if not text or len(text) > 1600:
        raise HTTPException(422, "text is required (max 1600 characters)")
    author = str(body.get("author_id") or "")
    if frm == "tutor":
        _need(await store.get("tutors", author), "tutor")
    elif frm == "guardian":
        if author and author != g["id"]:
            raise HTTPException(403, "a guardian can only post as themselves")
        author = g["id"]
    else:
        author = author or "c1"
    msg = {"id": logic.new_id("tm"), "student_id": st["id"], "guardian_id": g["id"], "from": frm,
           "author_id": author, "text": text, "ts": _iso(clock())}
    if frm == "guardian":
        msg["status"] = "received"
    else:
        d = await deliver(g, text)
        msg.update(status=d["status"], via=d["via"], **({"deliver_after": d["deliver_after"]}
                                                          if d.get("deliver_after") else {}))
        if body.get("kind") in ("renewal", "message"):
            msg["kind"] = body["kind"]
    await store.put("threads", msg)
    return msg


# ------------------------------------------------------------------ owner overview

def renewal_rows(sn: Snap) -> list[dict]:
    rows = []
    for sid, st in sn.students.items():
        for e in sn.enrollments(sid):
            if not renewal_due(e, sn.today):
                continue
            p = e["package"]
            gs = [g for g in sn.g_of.get(sid, []) if reachable(g)]
            g = gs[0] if gs else None
            sig = sn.signal(sid)
            quote = sn.evidence_quote(sid)
            tutor = sn.tutor_ref(e["tutor_id"])
            lang = (g or {}).get("language", "en")
            note = None
            if g:
                ev = tr("evidence", lang, first=st["name"].split()[0], quote=quote) if quote else ""
                note = tr("renewal", lang, g=g["name"].split()[0], first=st["name"].split()[0],
                          subject=SUBJECT_NAME.get(lang, SUBJECT_NAME["en"])[e["subject"]], tutor=tutor["name"],
                          hours=hours_text(lang, p["hours_left"]), date=p["renews_on"], evidence=ev)
            rows.append({"student": {"id": sid, "name": st["name"]},
                         "guardian": ({"id": g["id"], "name": g["name"], "language": g["language"],
                                       "prefers": g["prefers"]} if g else None),
                         "subject": e["subject"], "tutor": tutor, "enrollment_id": e["id"],
                         "hours_left": p["hours_left"], "renews_on": p["renews_on"], "price_usd": p["price_usd"],
                         "package_status": p["status"], "signal": sig, "at_risk": sid in sn.risk,
                         "evidence_quote": quote, "note_preview": note})
    rows.sort(key=lambda r: (r["renews_on"], r["student"]["name"]))
    return rows


@router.get("/center/overview")
async def overview():
    sn = await snapshot()
    now, week, month = sn.now, sn.week_ago, sn.now - timedelta(days=30)
    active_en = {sid: [e for e in sn.enrollments(sid) if (e.get("package") or {}).get("status") != "expired"]
                 for sid in sn.students}
    by_subject = []
    for s in SUBJECT_IDS:
        sids = {sid for sid, es in active_en.items() if any(e["subject"] == s for e in es)}
        tids = {e["tutor_id"] for es in active_en.values() for e in es if e["subject"] == s}
        kos = sum(1 for sid in sn.sessions for x in sn.in_subject(sid, s)
                  if x.get("ko") and _dt(x["created_at"]) >= week)
        by_subject.append({"subject": s, "name": SUBJECT_NAME["en"][s], "students": len(sids), "tutors": len(tids),
                           "kos_7d": kos})
    needs = {sid for sid in sn.students if sn.needs_update(sid)}
    by_tutor = []
    for tid in sorted(sn.tutors):
        sids = {sid for sid, es in active_en.items() if any(e["tutor_id"] == tid for e in es)}
        subj = {e["subject"] for es in active_en.values() for e in es if e["tutor_id"] == tid}
        by_tutor.append({"tutor": sn.tutor_ref(tid), "students": len(sids),
                         "subjects": [s for s in SUBJECT_IDS if s in subj], "needs_update": len(sids & needs)})
    reach = sum(1 for sid in sn.students if not sn.no_contact(sid))
    updates_7d = sum(1 for rs in sn.sent.values() for r in rs if _dt(r["ts"]) >= week)
    replies_7d = sum(1 for ms in sn.threads.values() for m in ms if m["from"] == "guardian" and _dt(m["ts"]) >= week)
    reports_7d = sum(1 for ss in sn.sessions.values() for s in ss
                     if s["status"] in ("quizzed", "complete") and _dt(s["created_at"]) >= week)
    cohort = [sid for sid, st in sn.students.items() if st.get("enrollments") and min(
        date.fromisoformat(e["started"]) for e in st["enrollments"]) <= sn.today - timedelta(days=30)]
    retained = [sid for sid in cohort if (sn.last_active(sid) or datetime.min.replace(tzinfo=timezone.utc)) >= month]
    renewals = renewal_rows(sn)
    at_risk_rows = [r for r in renewals if r["at_risk"] or r["signal"] == "quiet"]
    came_back = sum(1 for sid in sn.students if sn.came_back_7d(sid))
    return {
        "by_subject": by_subject, "by_tutor": by_tutor,
        "parents_reachable_pct": round(100 * reach / max(1, len(sn.students))),
        "updates_sent_7d": updates_7d,
        "renewals_due": renewals,
        "revenue_at_risk_usd": sum(r["price_usd"] for r in at_risk_rows),
        "revenue_at_risk_count": len(at_risk_rows),
        "retention_30d_pct": round(100 * len(retained) / max(1, len(cohort)), 1),
        "parent_updates_7d": updates_7d, "parent_replies_7d": replies_7d,
        "tutor_hours_saved_week": round((updates_7d + reports_7d) * MIN_SAVED_PER_ITEM / 60, 1),
        "tutor_hours_saved_basis": {"parent_updates": updates_7d, "gap_reports": reports_7d,
                                    "minutes_each": MIN_SAVED_PER_ITEM,
                                    "assumption": f"Each parent update or gap report Pip writes saves a tutor "
                                                  f"about {MIN_SAVED_PER_ITEM} minutes."},
        "came_back_on_their_own_7d": came_back,
        "students": len(sn.students), "label": "synthetic demo data",
    }


# ------------------------------------------------------------------ parent side

async def _guardian_or_404(gid: str) -> dict:
    return _need(await _ctx["store"].get("guardians", gid), "guardian")


def _unread(sn: Snap, g: dict) -> int:
    n = 0
    for sid in g.get("student_ids") or []:
        msgs = sorted((m for m in sn.threads.get(sid, []) if m["guardian_id"] == g["id"]), key=lambda m: m["ts"])
        last_mine = max((m["ts"] for m in msgs if m["from"] == "guardian"), default="")
        n += sum(1 for m in msgs if m["from"] != "guardian" and m["ts"] > last_mine)
    return n


def shared_notes(sn: Snap, sid: str) -> list[dict]:
    return sorted(({k: n[k] for k in ("id", "student_id", "tutor_id", "subject", "text", "ts", "share_with_parent")}
                   | {"tutor_name": sn.tutor_ref(n["tutor_id"])["name"]}
                   for n in sn.notes.get(sid, []) if n.get("share_with_parent") is True),
                  key=lambda n: n["ts"], reverse=True)


@router.get("/parent/{gid}/home")
async def parent_home(gid: str):
    g = await _guardian_or_404(gid)
    sn = await snapshot(with_risk=False)
    kids = []
    for sid in g.get("student_ids") or []:
        st = sn.students.get(sid)
        if not st:
            continue
        sess = sn.sessions.get(sid, [])
        week = [s for s in sess if _dt(s["created_at"]) >= sn.week_ago]
        quote, fixed = None, None
        for s in reversed(week):
            quotes, fx = sn.taught(s)
            quote = quote or (fx[0]["after"] if fx else (quotes[-1] if quotes else None))
            fixed = fixed or (fx[0] if fx else None)
        notes = [n for n in shared_notes(sn, sid) if _dt(n["ts"]) >= sn.week_ago]
        last = sess[-1] if sess else None
        forms = st.get("forms_unlocked") or []
        kids.append({
            "student": parent_safe_student(st),
            "pip": {"name": st.get("pip_name") or "Pip", "creature": (last or {}).get("creature") or "blob",
                    "brain_version": int(st.get("brain_version") or 1), "form": "main" if "main" in forms else None},
            "this_week": {"minutes": sum(int(s.get("minutes") or logic.minutes_spent(s)) for s in week),
                          "missions": len({s["assignment_id"] for s in week}),
                          "kos": sum(1 for s in week if s.get("ko")), "taught_quote": quote, "fixed": fixed,
                          "shared_note": notes[0] if notes else None},
            "subjects": [{"subject": e["subject"], "tutor": sn.tutor_ref(e["tutor_id"]),
                          "next_slot": e["slot"] if (e.get("package") or {}).get("status") != "expired" else None,
                          "ko_count": sum(1 for s in sn.in_subject(sid, e["subject"]) if s.get("ko"))}
                         for e in sn.enrollments(sid)],
        })
    return {"guardian": g, "kids": kids, "unread": _unread(sn, g), "label": "demo (synthetic data)"}


@router.get("/parent/{gid}/kids/{sid}")
async def parent_kid(gid: str, sid: str):
    g = await _guardian_or_404(gid)
    if sid not in (g.get("student_ids") or []):
        raise HTTPException(403, "not your child")
    sn = await snapshot(with_risk=False)
    st = _need(sn.students.get(sid), "student")
    lang, first = g.get("language", "en"), st["name"].split()[0]
    weeks: dict[str, dict] = {}
    for s in sn.sessions.get(sid, []):
        if s["status"] not in ("quizzed", "complete"):
            continue
        loc = _dt(s["created_at"]).astimezone(TZ).date()
        wk = (loc - timedelta(days=loc.weekday())).isoformat()
        quotes, fixed = sn.taught(s)
        a = sn.assignments.get(s["assignment_id"]) or {"topic": ""}
        w = weeks.setdefault(wk, {"week_of": wk, "lines": [], "quotes": [], "fixed": []})
        w["lines"].append(week_summary(lang, first, short_topic(a["topic"]), len(quotes), bool(s.get("ko")), bool(fixed)))
        w["quotes"] += [q for q in quotes if q not in w["quotes"]]
        w["fixed"] += fixed
    out_weeks = [{"week_of": w["week_of"], "summary": " ".join(w["lines"]), "quotes": w["quotes"],
                  "fixed": w["fixed"]} for w in sorted(weeks.values(), key=lambda w: w["week_of"], reverse=True)][:8]
    ens = sn.enrollments(sid)
    nxt = []
    for e in ens:
        if (e.get("package") or {}).get("status") == "expired":
            continue
        at = next_occurrence(e["slot"], sn.now)
        if at:
            nxt.append({"subject": e["subject"], "tutor": sn.tutor_ref(e["tutor_id"]), "slot": e["slot"],
                        "at": _iso(at)})
    nxt.sort(key=lambda x: x["at"])
    return {"student": parent_safe_student(st), "weeks": out_weeks, "shared_notes": shared_notes(sn, sid),
            "next_sessions": nxt,
            "tutors": [{"id": e["tutor_id"], "name": sn.tutor_ref(e["tutor_id"])["name"], "subject": e["subject"]}
                       for e in ens]}


# ------------------------------------------------------------------ parent updates (called by server.py)

def update_facts(s: dict, a: dict, st: dict, tutor: str) -> dict:
    rep = s.get("gap_report") or pip_ai.report_det(s, a, st)
    good = [c for c in rep["concepts"] if c["status"] == "explained" and (c.get("quote") or "").strip()]
    fx = [c for c in good if c.get("fixed_after")]
    quote = (fx[0] if fx else good[-1])["quote"].strip() if good else None
    return {"first": st["name"].split()[0], "topic": short_topic(a["topic"]), "quote": quote, "fixed": bool(fx),
            "ko": bool(s.get("ko")), "v": s.get("brain_version") or st.get("brain_version") or 1, "tutor": tutor}


async def _targets(st: dict) -> tuple[list[dict], list[dict]]:
    gs = [await _ctx["store"].get("guardians", gid) for gid in st.get("guardian_ids") or []]
    gs = [g for g in gs if g]
    send = [g for g in gs if g.get("updates") != "off" and reachable(g)]
    skipped = [{"guardian_id": g["id"], "name": g["name"],
                "reason": "updates off" if g.get("updates") == "off" else "no reachable contact"}
               for g in gs if g not in send]
    return send, skipped


async def localized(g: dict, english: str, facts: dict, override: str | None = None,
                    wait: float = 6.0) -> tuple[str, str]:
    """(message, source) for one guardian: tutor's text for English, AI localization when live, else template."""
    if override and override.strip():
        return override.strip(), "tutor"
    lang = g.get("language", "en")
    if lang == "en":
        return english, "tutor"
    ai = await ai_localize(english, lang, wait)
    return (ai, "ai") if ai else (update_template(lang, facts), "template")


async def preview_update(s: dict, a: dict, st: dict, tutor: str, english: str) -> dict:
    send, skipped = await _targets(st)
    facts = update_facts(s, a, st, tutor)
    msgs = await asyncio.gather(*(localized(g, english, facts) for g in send))
    rows = []
    for g, (m, src) in zip(send, msgs):
        via, contact = channel(g)
        until = quiet_until(g)
        rows.append({"guardian_id": g["id"], "name": g["name"], "language": g["language"], "via": via,
                     "to": contact, "updates": g["updates"], "message": m, "source": src,
                     "quiet_hours_now": bool(until), "deliver_after": _iso(until) if until else None})
    return {"by_guardian": rows, "skipped": skipped}


async def send_update(s: dict, a: dict, st: dict, tutor: str, english: str, overrides: dict | None = None) -> list[dict]:
    """One sent-log row (+ a thread message) per guardian with updates != off. With no reachable guardian,
    the legacy single test-mode row (TEST_PARENT_PHONE) keeps the old behavior."""
    store = _ctx["store"]
    send, _ = await _targets(st)
    ts = _iso(clock())
    if not send:
        to = os.environ.get("TEST_PARENT_PHONE", "")
        ok = await _ctx["sms"](to, english) if _ctx["sms"] else False
        row = {"id": logic.new_id("sent"), "student_id": st["id"], "to": to or "test parent (synthetic)",
               "message": english, "status": "delivered" if ok else "test-mode (not delivered)", "ts": ts,
               "session_id": s["id"]}
        await store.put("sent", row)
        return [row]
    facts = update_facts(s, a, st, tutor)
    overrides = overrides or {}
    msgs = await asyncio.gather(*(localized(g, english, facts, overrides.get(g["id"]), wait=3.0) for g in send))
    rows = []
    for g, (m, src) in zip(send, msgs):
        d = await deliver(g, m)
        row = {"id": logic.new_id("sent"), "student_id": st["id"], "to": d["to"], "message": m,
               "status": d["status"], "ts": ts, "guardian_id": g["id"], "language": g["language"],
               "via": d["via"], "source": src, "session_id": s["id"],
               **({"deliver_after": d["deliver_after"]} if d.get("deliver_after") else {})}
        await store.put("sent", row)
        await store.put("threads", {"id": logic.new_id("tm"), "student_id": st["id"], "guardian_id": g["id"],
                                    "from": "center", "author_id": a.get("tutor_id") or st.get("tutor_id"),
                                    "text": m, "ts": ts, "status": d["status"], "via": d["via"], "kind": "update",
                                    "session_id": s["id"],
                                    **({"deliver_after": d["deliver_after"]} if d.get("deliver_after") else {})})
        rows.append(row)
    # rows[0] is the legacy `sent` the old UI shows: put the row carrying the tutor's own text first
    rows.sort(key=lambda r: r["message"] != english)
    return rows


# ------------------------------------------------------------------ seed (called by seed.py)

def _ops() -> dict:
    return json.loads(OPS_FILE.read_text())


def apply_student_ops(students: dict, now: datetime | None = None) -> None:
    """Adds enrollments (with packages) and guardian_ids to the seeded student docs (before they are stored)."""
    ops = _ops()
    now = now or clock()
    today = now.astimezone(TZ).date()
    gids = defaultdict(list)
    for g in ops["guardians"]:
        for sid in g["student_ids"]:
            gids[sid].append(g["id"])
    for sid, st in students.items():
        rows = []
        for e in ops["enrollments"].get(sid, []):
            p = e["package"]
            pkg = {"hours_total": p["hours_total"], "hours_used": p["hours_used"], "price_usd": p["price_usd"],
                   "renews_on": (today + timedelta(days=p["renews_in_days"])).isoformat()}
            rows.append(enrollment_view(
                {"id": e["id"], "student_id": sid, "subject": e["subject"], "tutor_id": e["tutor_id"],
                 "slot": e["slot"], "goal": e["goal"],
                 "started": (today - timedelta(days=e["started_days_ago"])).isoformat(),
                 "last_attended": _iso(now - timedelta(days=e["last_attended_days_ago"], hours=2)),
                 "package": pkg}, today))
        st["enrollments"] = rows
        st["guardian_ids"] = gids.get(sid, [])


async def seed_ops(store, now: datetime | None = None) -> None:
    """Guardians, notes, threads, tutor subjects, Theo's synthetic sat_math K.O., and sent-log rows for the
    seeded sessions' parent updates (so 7-day counts come from rows). Run after seed.py stored everything."""
    ops = _ops()
    now = now or clock()
    c = await store.get("center", "c1")
    if c:
        await store.put("center", {**c, "tz": ops.get("tz", TZ_NAME)})
    for tid, subj in ops["tutor_subjects"].items():
        t = await store.get("tutors", tid)
        if t:
            await store.put("tutors", {**t, "subjects": subj})
    for g in ops["guardians"]:
        await store.put("guardians", dict(g))
    for n in ops["notes"]:
        n = dict(n)
        n["ts"] = _iso(now - timedelta(days=n.pop("days_ago"), hours=3))
        await store.put("notes", n)
    for m in ops["threads"]:
        m = dict(m)
        m["ts"] = _iso(now - timedelta(minutes=m.pop("minutes_ago")))
        await store.put("threads", m)
    th = ops["theo"]
    src = await store.get("assignments", th["assignment_from"])
    st = await store.get("students", th["student_id"])
    if src and st:
        a = {**copy.deepcopy(src), "id": th["assignment_id"], "student_id": st["id"], "tutor_id": th["tutor_id"],
             "grade": st["grade"], "subject": "sat_math", "source_id": src["id"],
             "created_at": _iso(now - timedelta(days=th["days_ago"] + 5))}
        await store.put("assignments", a)
        created = now - timedelta(days=th["days_ago"])
        brain = [{"id": f"r_{r['concept_id']}", "msg_index": -1, **r} for r in th["brain"]]
        quiz = [{"id": q["id"], "concept_id": q["concept_id"], "question": q["question"],
                 "rule_id": f"r_{q['concept_id']}", "pip_answer": q.get("answer", ""), "line": "", "passed": True}
                for q in a.get("quiz") or []]
        s = logic.new_session(a, st["id"], "blob", "frog", "none", [])
        s.update(id=th["session_id"], status="complete", ko=True, brain=brain, quiz=quiz, boss_hp=0,
                 mood="celebrating", reteach_count=th["reteach_count"], brain_version=2, minutes=th["minutes"],
                 meters={k["id"]: 60 for k in a["concepts"]}, synthetic=True, created_at=_iso(created),
                 parent_sent_at=_iso(created + timedelta(hours=3)))
        s["gap_report"] = pip_ai.report_det(s, a, st)
        await store.put("sessions", s)
        st.update(brain_version=2, ko_count=1, last_session_id=s["id"], since_last_session=s["gap_report"]["summary"],
                  album=[{"assignment_id": a["id"], "boss_name": a["boss"]["name"], "card_no": 1,
                          "variant": "comeback", "date": s["created_at"]}])
        await store.put("students", st)
    # sent-log rows for every seeded parent update (one per guardian who gets updates)
    students = {x["id"]: x for x in await store.all("students")}
    assignments = {x["id"]: x for x in await store.all("assignments")}
    guardians = {g["id"]: g for g in ops["guardians"]}
    tutors = {t["id"]: t["name"] for t in await store.all("tutors")}
    for s in await store.all("sessions"):
        if not s.get("parent_sent_at") or s.get("saved"):
            continue
        st, a = students.get(s["student_id"]), assignments.get(s["assignment_id"])
        if not st or not a:
            continue
        facts = update_facts(s, a, st, tutors.get(st["tutor_id"], "your tutor"))
        for gid in st.get("guardian_ids") or []:
            g = guardians.get(gid)
            if not g or g["updates"] == "off" or not reachable(g):
                continue
            via, contact = channel(g)
            msg = update_template(g["language"], facts)
            row = {"id": f"sent_seed_{s['id']}_{gid}", "student_id": st["id"], "to": f"{g['name']} · {via} {contact}",
                   "message": msg, "status": "test-mode (not delivered)", "ts": s["parent_sent_at"],
                   "guardian_id": gid, "language": g["language"], "via": via, "source": "template",
                   "session_id": s["id"], "synthetic": True}
            await store.put("sent", row)
            await store.put("threads", {"id": f"tm_seed_{s['id']}_{gid}", "student_id": st["id"],
                                        "guardian_id": gid, "from": "center", "author_id": st["tutor_id"],
                                        "text": msg, "ts": s["parent_sent_at"], "status": row["status"],
                                        "via": via, "kind": "update", "session_id": s["id"]})
