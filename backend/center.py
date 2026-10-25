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
import mascot
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
SUBJECT_NAME = {s["id"]: s["name"] for s in SUBJECTS}
KNOWN_SUBJECT = {"a_tri": "math", "a_frac": "math", "a_sat_commas": "writing", "a_sat_linear": "sat_math"}
RATE = {"math": 55, "writing": 55, "science": 55, "sat_math": 80, "sat_rw": 80}
RELATIONS = ("parent", "grandparent", "guardian")
PREFERS = ("sms", "email")
UPDATES = ("every_ko", "weekly", "off")
FLAGS = ("at_risk", "needs_update", "no_contact", "new")
TZ_NAME = "America/Los_Angeles"
MIN_SAVED_PER_ITEM = 10   # tutor_hours_saved_week assumption: minutes saved per auto-written update / gap report
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


# ------------------------------------------------------------------ parent copy (English only, CONTRACT v3.16)

# Proud and specific: lead with what the kid taught and fixed. No game words (K.O., boss, brain versions,
# weapons), no deficit words, no rankings. "before" = what Pip believed (shown only next to an approved fix).
MISSIONS = {
    "a_tri": {"before": "A = b × h", "topic": "Area of a triangle",
              "taught": "why a triangle's area is half of base × height"},
    "a_frac": {"before": "1/2 + 1/3 = 2/5", "topic": "Adding fractions with unlike denominators",
               "taught": "why you need same-size pieces to add fractions like 1/2 + 1/3"},
    "a_sat_commas": {"before": "“I was tired, I went to bed.”", "topic": "SAT Writing: commas and run-on sentences",
                     "taught": "when a comma can join two sentences and when it can't"},
    "a_sat_linear": {"before": "2x + 6 = 20 → 2x = 20 + 6", "topic": "SAT Math: solving linear equations",
                     "taught": "why you do the same thing to both sides when you solve an equation"},
}
GAME = re.compile(r"K\.\s?O\b|\bKO\b|knock ?out|\bboss|brain\s*v|brain (just )?level|level+ed up|weapon|\bHP\b", re.I)


def short_topic(topic: str) -> str:
    """Parent copy drops a trailing parenthetical: "SAT Math: solving linear equations (do the same...)"."""
    return re.sub(r"\s*\([^)]*\)\s*$", "", topic or "").strip() or topic


def mission_text(a: dict) -> tuple[str, str]:
    """(topic, what the kid taught) for parent copy: the seeded missions' map (by id or source_id), else a
    generic phrase around the mission topic."""
    m = MISSIONS.get(a.get("id")) or MISSIONS.get(a.get("source_id"))
    if m:
        return m["topic"], m["taught"]
    topic = short_topic(a.get("topic") or "")
    return topic, f"the key ideas of “{topic}”"


def mission_before(a: dict) -> str:
    m = MISSIONS.get(a.get("id")) or MISSIONS.get(a.get("source_id"))
    return a.get("strike") or (m or {}).get("before") or a.get("misconception") or ""


def goal_line(first: str, g: dict) -> str:
    """SAT goal progress in words: latest practice score vs the target (no comparisons with other kids)."""
    gained = g["latest"] - g["start"] if g.get("start") is not None and g.get("latest") is not None else 0
    up = f", up {gained} points since the first practice test" if gained > 0 else ""
    return f"{first}'s latest {g['subject_name']} practice score is {g['latest']} (goal: {g['target']}+){up}. "


def update_template(f: dict) -> str:
    """The parent update draft the tutor approves: what the kid taught (specific), fixed, an approved quote or
    (SAT) goal progress, and what's next."""
    _, taught = mission_text(f.get("assignment") or {"topic": f.get("topic", "")})
    fixed = ", and caught and fixed a mistake along the way" if f.get("fixed") else ""
    if f.get("quote"):
        said = f"In {f['first']}'s own words: \"{f['quote']}\". "
    elif f.get("goal"):
        said = goal_line(f["first"], f["goal"])
    else:
        said = f"{f['first']} explained it in their own words. "
    nxt = f"Next session, {f['first']} starts something new." if f.get("ko") else \
        f"Next session, {f['first']} keeps going with it."
    return f"Bright Path Tutoring: This week {f['first']} taught Pip {taught}{fixed}. {said}{nxt} - {f['tutor']}"


def auto_note(f: dict) -> str:
    """auto_ko_note (grade <= 6 only, tutor opt-in): short, no quote, goes out unreviewed."""
    _, taught = mission_text(f.get("assignment") or {"topic": f.get("topic", "")})
    return f"Bright Path Tutoring: {f['first']} finished today's Pip mission and taught Pip {taught}. - {f['tutor']}"


def nice_date(iso: str) -> str:
    """Human copy never shows ISO dates: "2026-11-02" -> "Nov 2"."""
    try:
        d = date.fromisoformat(str(iso)[:10])
    except ValueError:
        return str(iso)
    return f"{d.strftime('%b')} {d.day}"


def strip_quote(text: str, quote: str | None) -> str:
    """The message without the sentence that carries the quote (the parent app shows the quote as the hero)."""
    if not quote or quote not in (text or ""):
        return text
    q = re.escape(quote)
    out = re.sub(r"\s*In [^.\"]*? own words: \"" + q + r"\"\.", "", text)
    out = re.sub(r",? in [^.,\"]*? own words: \"" + q + r"\"", "", out)
    if quote in out:  # an edited message: drop whichever sentence holds the quote
        parts = re.split(r"(?<=[.!?])\s+", out)
        out = " ".join(x for x in parts if quote not in x)
    return re.sub(r"\s{2,}", " ", out).strip()


def hours_text(n: int) -> str:
    return "no hours" if n <= 0 else "1 hour" if n == 1 else f"{n} hours"


def parent_clean(text: str) -> bool:
    """Parent-facing text: no deficit words, no rankings, no game words."""
    return bool((text or "").strip()) and not BANNED.search(text) and not GAME.search(text)


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


def pip_view(st: dict) -> dict:
    """The student's own Pip: seeded look + live name/brain version/form from the student doc."""
    p = st.get("pip") if isinstance(st.get("pip"), dict) else {}
    return {"name": st.get("pip_name") or p.get("name") or "Pip", "creature": p.get("creature") or "capybara",
            "vibe": p.get("vibe") or "cool", "accessory": mascot.clean_accessory(p.get("accessory") or "none"),
            "brain_version": int(st.get("brain_version") or 1),
            "form": "main" if "main" in (st.get("forms_unlocked") or []) or p.get("form") == "main" else "base"}


def with_pip(st: dict) -> dict:
    return {**st, "pip": pip_view(st)}


# ------------------------------------------------------------------ snapshot (one load per request)

class Snap:
    def __init__(self, now, students, tutors, assignments, sessions, events, sent, guardians, notes, threads,
                 shares, risk):
        self.now, self.today = now, now.astimezone(TZ).date()
        self.students = {s["id"]: s for s in students}
        self.tutors = {t["id"]: t for t in tutors}
        self.assignments = {a["id"]: a for a in assignments}
        self.sessions = defaultdict(list)
        self.saved = defaultdict(list)   # demo replays: never counted, only a fallback source of evidence quotes
        for s in sessions:
            if s.get("saved"):
                self.saved[s["student_id"]].append(s)
            elif s.get("kind") != "review":
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
        self.shares = defaultdict(list)
        for x in shares:
            self.shares[x["student_id"]].append(x)
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
        """Prompt the tutor for an approved update (v3.15: Guardian.updates only sets how often): every_ko after
        each finished session; weekly once the last update is a week old; nobody to tell -> no prompt."""
        want = [g for g in self.g_of.get(sid, []) if g.get("updates") != "off" and reachable(g)]
        done = [s for s in self.sessions.get(sid, []) if s["status"] in ("quizzed", "complete")]
        if not done or (self.g_of.get(sid) and not want):
            return False
        last = self.last_update(sid)
        if last is None:
            return True
        if last >= _dt(done[-1]["created_at"]):
            return False
        return any(g.get("updates") == "every_ko" for g in want) or not want or last < self.week_ago

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
        before = mission_before(a)
        fixed = [{"before": before, "after": c["quote"]} for c in good if c.get("fixed_after")]
        return [c["quote"] for c in good], fixed

    def evidence(self, sid, subject=None):
        """(quote, assignment, source) a renewal note may cite (v3.15): the student's own share > a quote the tutor
        already approved in a sent report > for grade <= 6 (not SAT) only, the best gap-report quote (newest K.O.,
        a fixed one first; the saved demo run as a last resort). (None, None, None) otherwise."""
        st = self.students[sid]
        by_id = {x["id"]: x for x in self.sessions.get(sid, []) + self.saved.get(sid, [])}

        def subj_of(x):
            sess = by_id.get(x.get("session_id"))
            return x.get("subject") or (self.subj(sess) if sess else None)
        for want in ([subject, None] if subject else [None]):
            for x in sorted(self.shares.get(sid, []), key=lambda x: x["ts"], reverse=True):
                if want is None or subj_of(x) == want:
                    return x["quote"], self.assignments.get(x.get("assignment_id")), "student"
            for r in sorted(self.sent.get(sid, []), key=lambda r: r["ts"], reverse=True):
                if r.get("quote") and (want is None or subj_of(r) == want):
                    sess = by_id.get(r.get("session_id"))
                    return r["quote"], self.assignments.get(sess["assignment_id"]) if sess else None, "approved"
        if not auto_quote_ok(st, subject):
            return None, None, None
        mine = self.sessions.get(sid, [])
        pools = ([[s for s in mine if self.subj(s) == subject]] if subject else []) + [mine, self.saved.get(sid, [])]
        for pool in pools:
            for want_ko in (True, False):
                for s in reversed(sorted(pool, key=lambda x: x["created_at"])):
                    if want_ko and not s.get("ko"):
                        continue
                    quotes, fixed = self.taught(s)
                    if quotes:
                        return ((fixed[0]["after"] if fixed else quotes[-1]),
                                self.assignments.get(s["assignment_id"]), "auto")
        return None, None, None

    def evidence_quote(self, sid, subject=None):
        return self.evidence(sid, subject)[0]


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
    colls = ("students", "tutors", "assignments", "sessions", "events", "sent", "guardians", "notes", "threads",
             "shares")
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
        rows.append({"student": with_pip(st), "pip": pip_view(st), "subjects": subject_cells(sn, sid, tutor_id),
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
        known = c["id"] in ((a.get("lesson") or {}).get("prior_knowledge") or [])  # Pip started out knowing it
        if r and r.get("correct"):
            lvl = max(lvl, 2)
        elif r:
            lvl = min(lvl, 1)
        elif known and s:
            lvl = max(lvl, 2)
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
        items.append({"ts": r["ts"], "kind": "update", "subject": sn.subj(s) if s else None,
                      "text": f"{'Auto note' if r.get('auto') else 'Parent update'} to {r['to']}: {r['status']}", "link": None})
    for m in sn.threads.get(sid, []):
        if m.get("kind") == "update":
            continue
        who = (sn.guardians.get(m["guardian_id"], {}).get("name") if m["from"] == "guardian"
               else sn.tutor_ref(m["author_id"])["name"] if m["from"] == "tutor" else "Bright Path Tutoring")
        items.append({"ts": m["ts"], "kind": "message", "subject": None,
                      "text": f"{who}: {m.get('translation') or m['text']}"[:220], "link": None})
    for x in sn.shares.get(sid, []):
        items.append({"ts": x["ts"], "kind": "message", "subject": x.get("subject"),
                      "text": f"{sn.students[sid]['name']} shared with their family: \"{x['quote']}\""[:220],
                      "link": None})
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
    return {"student": with_pip(st), "pip": pip_view(st), "enrollments": sn.enrollments(student_id),
            "progress": progress(sn, student_id),
            "guardians": [{**g, "reachable": reachable(g)} for g in sn.g_of.get(student_id, [])],
            "notes": sorted(sn.notes.get(student_id, []), key=lambda n: n["ts"], reverse=True),
            "timeline": timeline(sn, student_id), "flags": sn.flags(student_id),
            "shares": share_items(sn, student_id), "auto_ko_note": bool(st.get("auto_ko_note")),
            "auto_ko_note_allowed": auto_quote_ok(st),
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
    checks = {"relation": RELATIONS, "prefers": PREFERS, "updates": UPDATES}
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
         "prefers": "sms" if f.get("phone") or not f.get("email") else "email",
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
    allowed = {"prefers", "updates", "quiet_hours", "phone", "email"}   # no language: English only (v3.16)
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
    t = await store.get("tutors", author) if frm == "tutor" else None
    msg["author"] = ({"tutor_id": author, "name": t["name"]} if t else {"guardian_id": g["id"], "name": g["name"]}
                     if frm == "guardian" else {"tutor_id": author, "name": "Bright Path Tutoring"})
    await store.put("threads", msg)
    if frm != "guardian":
        await family_event(st["id"], msg["author"], text, msg["ts"])
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
            quote, qa, qsrc = sn.evidence(sid, e["subject"])
            tutor = sn.tutor_ref(e["tutor_id"])
            note = None
            if g:
                first = st["name"].split()[0]
                ev = ""
                if quote:
                    ev = f"Recently {first} taught Pip {mission_text(qa or {})[1]}, in {first}'s own words: \"{quote}\". "
                elif is_sat_kid(st, e["subject"]) and goal_progress(st, e["subject"]):
                    ev = goal_line(first, goal_progress(st, e["subject"])[0])
                note = (f"Hi {g['name'].split()[0]}, {first}'s {SUBJECT_NAME[e['subject']]} package with {tutor['name']} "
                        f"has {hours_text(p['hours_left'])} left and renews on {nice_date(p['renews_on'])}. {ev}Want to keep going? "
                        f"Reply here and we'll set it up. - {tutor['name']}")
            rows.append({"student": {"id": sid, "name": st["name"]},
                         "guardian": ({"id": g["id"], "name": g["name"], "prefers": g["prefers"]} if g else None),
                         "subject": e["subject"], "tutor": tutor, "enrollment_id": e["id"],
                         "hours_left": p["hours_left"], "renews_on": p["renews_on"], "price_usd": p["price_usd"],
                         "package_status": p["status"], "signal": sig, "at_risk": sid in sn.risk,
                         "evidence_quote": quote, "evidence_source": qsrc, "note_preview": note, "note_text": note,
                         "from": {"tutor_id": tutor["id"], "name": tutor["name"]}})
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
        by_subject.append({"subject": s, "name": SUBJECT_NAME[s], "students": len(sids), "tutors": len(tids),
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


# ------------------------------------------------------------------ parent side (CONTRACT v3.15: the tutor is the filter)
# Parents see only what the tutor sent (approved reports, auto notes for grade <= 6 when enabled), notes marked
# shared, the student's own shares, thread messages, schedule and package. Never transcripts, Pip's brain,
# mistakes in progress, minutes, or activity timestamps. Every item carries `from`.

def is_sat_kid(st: dict, subject: str | None = None) -> bool:
    if subject:
        return subject.startswith("sat_") or int(st.get("grade") or 0) >= 10
    return int(st.get("grade") or 0) >= 10 or any(e["subject"].startswith("sat_") for e in st.get("enrollments") or [])


def auto_quote_ok(st: dict, subject: str | None = None) -> bool:
    """The backend may pick a quote itself only for grade <= 6 and never for SAT (v3.15)."""
    return int(st.get("grade") or 0) <= 6 and not is_sat_kid(st, subject)


def goal_progress(st: dict, subject: str | None = None) -> list[dict]:
    out = []
    for e in st.get("enrollments") or []:
        if subject and e["subject"] != subject:
            continue
        sc = e.get("practice_scores") or []
        if e.get("target_score") and sc:
            out.append({"subject": e["subject"], "subject_name": SUBJECT_NAME.get(e["subject"], e["subject"]),
                        "goal": e.get("goal"), "target": int(e["target_score"]), "start": int(sc[0]),
                        "latest": int(sc[-1])})
    return out


def _tutor_from(sn_or_tutors, tid) -> dict:
    t = (sn_or_tutors.get(tid) if isinstance(sn_or_tutors, dict) else sn_or_tutors.tutors.get(tid)) or {}
    return {"tutor_id": tid, "name": t.get("name") or "your tutor"}


def parent_pip(st: dict) -> dict:
    p = pip_view(st)
    return {"name": p["name"], "creature": p["creature"], "vibe": p["vibe"], "accessory": p["accessory"],
            "form": p["form"], "stage": p["brain_version"]}


def parent_student(st: dict) -> dict:
    return {"id": st["id"], "name": st["name"], "grade": st.get("grade"), "pip_name": st.get("pip_name") or "Pip"}


def report_items(sn: "Snap", sid: str) -> list[dict]:
    """Tutor-sent reports (one per send, not per guardian), newest first."""
    seen, out = set(), []
    for r in sorted(sn.sent.get(sid, []), key=lambda r: r["ts"], reverse=True):
        key = (r.get("session_id"), r["ts"], r["message"])
        if key in seen:
            continue
        seen.add(key)
        s_ = next((x for x in sn.sessions.get(sid, []) + sn.saved.get(sid, []) if x["id"] == r.get("session_id")), None)
        tid = r.get("tutor_id") or (sn.assignments.get(s_["assignment_id"], {}).get("tutor_id") if s_ else None) \
            or sn.students[sid].get("tutor_id")
        out.append({"id": r["id"], "kind": "auto_note" if r.get("auto") else "report", "text": r["message"],
                    "body": strip_quote(r["message"], r.get("quote")),
                    "quote": r.get("quote"), "fixed": r.get("fixed"), "goal": r.get("goal"),
                    "subject": sn.subj(s_) if s_ else None,
                    "date": _dt(r["ts"]).astimezone(TZ).date().isoformat(), "from": _tutor_from(sn, tid)})
    return out


def share_items(sn: "Snap", sid: str) -> list[dict]:
    st = sn.students[sid]
    return [{"id": x["id"], "kind": "share", "quote": x["quote"], "subject": x.get("subject"), "topic": x.get("topic"),
             "date": _dt(x["ts"]).astimezone(TZ).date().isoformat(),
             "from": {"student_id": sid, "name": st["name"]}}
            for x in sorted(sn.shares.get(sid, []), key=lambda x: x["ts"], reverse=True)]


def shared_notes(sn: "Snap", sid: str) -> list[dict]:
    return sorted(({k: n[k] for k in ("id", "student_id", "subject", "text", "share_with_parent")}
                   | {"date": _dt(n["ts"]).astimezone(TZ).date().isoformat(), "ts": n["ts"],
                      "from": _tutor_from(sn, n["tutor_id"])}
                   for n in sn.notes.get(sid, []) if n.get("share_with_parent") is True),
                  key=lambda n: n["ts"], reverse=True)


def _schedule(sn: "Snap", sid: str) -> list[dict]:
    out = []
    for e in sn.enrollments(sid):
        p = e.get("package") or {}
        live = p.get("status") != "expired"
        out.append({"subject": e["subject"], "tutor": sn.tutor_ref(e["tutor_id"]), "next_slot": e["slot"] if live else None,
                    "ko_count": sum(1 for s in sn.in_subject(sid, e["subject"]) if s.get("ko")),
                    "package": {k: p.get(k) for k in ("hours_left", "renews_on", "status")} if p else None})
    return out


def kid_card(sn: "Snap", sid: str) -> dict:
    """One kid on the parent home. The same builder serves /parent/{gid}/home and /students/{id}/family-view."""
    st = sn.students[sid]
    week = [s for s in sn.sessions.get(sid, []) if _dt(s["created_at"]) >= sn.week_ago]
    since = (sn.now - timedelta(days=7)).astimezone(TZ).date().isoformat()
    reports = [r for r in report_items(sn, sid) if r["date"] >= since]
    shares = [x for x in share_items(sn, sid) if x["date"] >= since]
    taught, src = None, None
    if shares:
        taught, src = shares[0]["quote"], shares[0]["from"]
    else:
        r = next((r for r in reports if r.get("quote")), None)
        if r:
            taught, src = r["quote"], r["from"]
    fixed = next(({**r["fixed"], "from": r["from"]} for r in reports if r.get("fixed")), None)
    notes = [n for n in shared_notes(sn, sid) if n["date"] >= since]
    return {"student": parent_student(st), "pip": parent_pip(st),
            "this_week": {"sessions": len(week), "missions": len({s["assignment_id"] for s in week}),
                          "kos": sum(1 for s in week if s.get("ko")), "taught_quote": taught, "taught_from": src,
                          "fixed": fixed, "shared_note": notes[0] if notes else None,
                          "latest_report": reports[0] if reports else None},
            "goal_progress": goal_progress(st), "subjects": _schedule(sn, sid)}


def kid_detail(sn: "Snap", sid: str) -> dict:
    st = sn.students[sid]
    weeks: dict[str, dict] = {}
    for it in report_items(sn, sid) + share_items(sn, sid):
        d = date.fromisoformat(it["date"])
        wk = (d - timedelta(days=d.weekday())).isoformat()
        w = weeks.setdefault(wk, {"week_of": wk, "items": [], "quotes": [], "fixed": []})
        w["items"].append(it)
        if it.get("quote") and it["quote"] not in w["quotes"]:
            w["quotes"].append(it["quote"])
        if it.get("fixed"):
            w["fixed"].append({**it["fixed"], "from": it["from"]})
    out_weeks = []
    for w in sorted(weeks.values(), key=lambda w: w["week_of"], reverse=True)[:8]:
        texts = [i.get("body") or i["text"] for i in w["items"] if i.get("text")]
        out_weeks.append({**w, "summary": " ".join(texts) if texts else None,
                          "from": next((i["from"] for i in w["items"] if i.get("text")), w["items"][0]["from"])})
    nxt = []
    for e in sn.enrollments(sid):
        if (e.get("package") or {}).get("status") == "expired":
            continue
        at = next_occurrence(e["slot"], sn.now)
        if at:
            nxt.append({"subject": e["subject"], "tutor": sn.tutor_ref(e["tutor_id"]), "slot": e["slot"], "at": _iso(at)})
    nxt.sort(key=lambda x: x["at"])
    return {"student": parent_student(st), "pip": parent_pip(st), "weeks": out_weeks,
            "reports": report_items(sn, sid), "shares": share_items(sn, sid), "shared_notes": shared_notes(sn, sid),
            "goal_progress": goal_progress(st), "next_sessions": nxt,
            "tutors": [{"id": e["tutor_id"], "name": sn.tutor_ref(e["tutor_id"])["name"], "subject": e["subject"]}
                       for e in sn.enrollments(sid)]}


async def _guardian_or_404(gid: str) -> dict:
    return _need(await _ctx["store"].get("guardians", gid), "guardian")


def _unread(sn: "Snap", g: dict) -> int:
    n = 0
    for sid in g.get("student_ids") or []:
        msgs = sorted((m for m in sn.threads.get(sid, []) if m["guardian_id"] == g["id"]), key=lambda m: m["ts"])
        last_mine = max((m["ts"] for m in msgs if m["from"] == "guardian"), default="")
        n += sum(1 for m in msgs if m["from"] != "guardian" and m["ts"] > last_mine)
    return n


@router.get("/parent/{gid}/home")
async def parent_home(gid: str):
    g = await _guardian_or_404(gid)
    sn = await snapshot(with_risk=False)
    kids = [kid_card(sn, sid) for sid in g.get("student_ids") or [] if sid in sn.students]
    return {"guardian": g, "kids": kids, "unread": _unread(sn, g), "label": "demo (synthetic data)"}


@router.get("/parent/{gid}/kids/{sid}")
async def parent_kid(gid: str, sid: str):
    g = await _guardian_or_404(gid)
    if sid not in (g.get("student_ids") or []):
        raise HTTPException(403, "not your child")
    sn = await snapshot(with_risk=False)
    _need(sn.students.get(sid), "student")
    return kid_detail(sn, sid)


@router.get("/students/{student_id}/family-view")
async def family_view(student_id: str):
    """Exactly what the student's guardians see (same builders as the parent app) + family_shared events."""
    sn = await snapshot(with_risk=False)
    _need(sn.students.get(student_id), "student")
    events = sorted((e for e in await _ctx["store"].all("events", student_id=student_id) if e.get("kind") == "family_shared"),
                    key=lambda e: e["ts"], reverse=True)
    return {"student_id": student_id, "guardians": [{"id": g["id"], "name": g["name"]} for g in sn.g_of.get(student_id, [])],
            "card": kid_card(sn, student_id), "detail": kid_detail(sn, student_id), "events": events[:20]}


@router.post("/sessions/{session_id}/share")
async def share(session_id: str, body: dict = Body(...)):
    """Student taps "show my family this" on one of their own messages in this session."""
    store = _ctx["store"]
    s = _need(await store.get("sessions", session_id), "session")
    if body.get("student_id") and body["student_id"] != s["student_id"]:
        raise HTTPException(403, "you can only share your own messages")
    i = body.get("msg_index")
    if not isinstance(i, int) or isinstance(i, bool) or not 0 <= i < len(s["transcript"]):
        raise HTTPException(422, "msg_index must point at a message in this session")
    m = s["transcript"][i]
    if m.get("from") != "student" or not (m.get("text") or "").strip():
        raise HTTPException(422, "you can only share your own messages")
    for x in await store.all("shares", session_id=session_id):
        if x["msg_index"] == i:
            return x
    st = _need(await store.get("students", s["student_id"]), "student")
    a = await store.get("assignments", s["assignment_id"]) or {}
    x = {"id": logic.new_id("share"), "student_id": st["id"], "session_id": session_id, "msg_index": i,
         "assignment_id": a.get("id"), "subject": infer_subject(a) if a else None,
         "topic": mission_text(a)[0] if a else None, "quote": m["text"].strip(), "ts": _iso(clock()),
         "from": {"student_id": st["id"], "name": st["name"]}}
    await store.put("shares", x)
    return x


@router.post("/students/{student_id}/auto-ko-note")
async def set_auto_ko_note(student_id: str, body: dict = Body(...)):
    """Tutor opt-in (grade <= 6 only): a short note goes to the family at each K.O. without review."""
    store = _ctx["store"]
    st = _need(await store.get("students", student_id), "student")
    on = bool(body.get("enabled"))
    if on and not auto_quote_ok(st):
        raise HTTPException(422, "auto notes are only for grade 6 and below; older students' updates are tutor-approved")
    st["auto_ko_note"] = on
    await store.put("students", st)
    return {"ok": True, "auto_ko_note": on}


async def family_event(student_id: str, tutor: dict, text: str, ts: str) -> None:
    await _ctx["store"].put("events", {
        "id": logic.new_id("ev"), "kind": "family_shared", "student_id": student_id, "ts": ts, "due": False,
        "by": tutor, "text": f"{tutor['name']} shared this with your family", "preview": text[:240]})


# ------------------------------------------------------------------ parent updates (called by server.py)

def pick_quote(s: dict, a: dict, st: dict, shares: list[dict], msg_index=None) -> tuple[str | None, str | None]:
    """(quote, source) for a draft: the student's share in this session > the tutor's pick (a student message in
    this session) > an auto pick from the gap report (grade <= 6, not SAT) > none."""
    mine = sorted((x for x in shares if x["session_id"] == s["id"]), key=lambda x: x["ts"], reverse=True)
    if mine:
        return mine[0]["quote"], "student"
    if isinstance(msg_index, int) and not isinstance(msg_index, bool) and 0 <= msg_index < len(s["transcript"]):
        m = s["transcript"][msg_index]
        if m.get("from") == "student" and (m.get("text") or "").strip():
            return m["text"].strip(), "tutor"
    if auto_quote_ok(st, infer_subject(a)):
        rep = s.get("gap_report") or pip_ai.report_det(s, a, st)
        good = [c for c in rep["concepts"] if c["status"] == "explained" and (c.get("quote") or "").strip()]
        fx = [c for c in good if c.get("fixed_after")]
        if good:
            return (fx[0] if fx else good[-1])["quote"].strip(), "auto"
    return None, None


def update_facts(s: dict, a: dict, st: dict, tutor: str, shares: list[dict] | None = None, msg_index=None) -> dict:
    rep = s.get("gap_report") or pip_ai.report_det(s, a, st)
    fx = [c for c in rep["concepts"] if c["status"] == "explained" and c.get("fixed_after") and c.get("quote")]
    quote, src = pick_quote(s, a, st, shares or [], msg_index)
    subj = infer_subject(a)
    goal = next(iter(goal_progress(st, subj)), None) if is_sat_kid(st, subj) else None
    return {"first": st["name"].split()[0], "topic": short_topic(a["topic"]), "quote": quote, "quote_source": src,
            "fixed": bool(fx), "fixed_pair": {"before": mission_before(a), "after": fx[0]["quote"]} if fx else None,
            "ko": bool(s.get("ko")), "tutor": tutor, "assignment": a, "goal": goal}


async def _targets(st: dict) -> tuple[list[dict], list[dict]]:
    gs = [await _ctx["store"].get("guardians", gid) for gid in st.get("guardian_ids") or []]
    gs = [g for g in gs if g]
    send = [g for g in gs if g.get("updates") != "off" and reachable(g)]
    skipped = [{"guardian_id": g["id"], "name": g["name"],
                "reason": "updates off" if g.get("updates") == "off" else "no reachable contact"}
               for g in gs if g not in send]
    return send, skipped


async def preview_update(s: dict, a: dict, st: dict, tutor: str, body: dict | None = None) -> dict:
    """The draft the tutor approves (English), who it goes to, and where the quote came from."""
    body = body or {}
    shares = await _ctx["store"].all("shares", session_id=s["id"])
    facts = update_facts(s, a, st, tutor, shares, body.get("msg_index"))
    msg = update_template(facts)
    send, skipped = await _targets(st)
    rows = []
    for g in send:
        via, contact = channel(g)
        until = quiet_until(g)
        rows.append({"guardian_id": g["id"], "name": g["name"], "via": via, "to": contact, "updates": g["updates"],
                     "message": msg, "quiet_hours_now": bool(until), "deliver_after": _iso(until) if until else None})
    return {"message": msg, "by_guardian": rows, "skipped": skipped, "quote": facts["quote"],
            "quote_source": facts["quote_source"], "goal_progress": facts["goal"],
            "approval": "tutor", "auto_ko_note": bool(st.get("auto_ko_note"))}


async def send_update(s: dict, a: dict, st: dict, tutor: str, english: str, body: dict | None = None,
                      auto: bool = False, meta_override: dict | None = None) -> list[dict]:
    """The tutor-approved message (or an auto note) to every guardian with updates != off: one sent-log row and one
    thread message each, plus a family_shared event for the student. `body.messages` {guardian_id: text} sets a
    guardian's own text. With no reachable guardian, the legacy single test-mode row keeps the old behavior."""
    body = body if isinstance(body, dict) else {}
    per = body.get("messages") if isinstance(body.get("messages"), dict) else {}
    store = _ctx["store"]
    ts = _iso(clock())
    tid = (meta_override or {}).get("tutor_id") or a.get("tutor_id") or st.get("tutor_id")
    tutors = {t["id"]: t for t in await store.all("tutors")}
    who = _tutor_from(tutors, tid)
    if meta_override is None:
        shares = await store.all("shares", session_id=s["id"])
        facts = update_facts(s, a, st, tutor, shares, body.get("msg_index"))
        q, fp, src, goal = facts["quote"], facts["fixed_pair"], facts["quote_source"], facts["goal"]
        if fp and not (auto_quote_ok(st, infer_subject(a)) or src in ("student", "tutor")):
            fp = None
    else:
        q, fp, src, goal = (meta_override.get(k) for k in ("quote", "fixed", "quote_source", "goal"))

    def meta_for(text):
        ok_q = q if q and q in text else None
        return {"session_id": s["id"], "tutor_id": tid, "from": who, "quote": ok_q,
                "quote_source": src if ok_q else None, "fixed": fp if fp and fp["after"] in text else None,
                "goal": {"target": goal["target"], "latest": goal["latest"], "label": f"{goal['subject_name']} practice score"}
                if goal else None, "auto": auto, **({"draft_id": meta_override["draft_id"]} if (meta_override or {}).get("draft_id") else {})}
    send, _ = await _targets(st)
    rows = []
    if not send:
        to = os.environ.get("TEST_PARENT_PHONE", "")
        ok = await _ctx["sms"](to, english) if _ctx["sms"] else False
        rows = [{"id": logic.new_id("sent"), "student_id": st["id"], "to": to or "test parent (synthetic)",
                 "message": english, "status": "delivered" if ok else "test-mode (not delivered)", "ts": ts,
                 **meta_for(english)}]
        await store.put("sent", rows[0])
    for g in send:
        text = str(per.get(g["id"]) or english).strip() or english
        d = await deliver(g, text)
        row = {"id": logic.new_id("sent"), "student_id": st["id"], "to": d["to"], "message": text,
               "status": d["status"], "ts": ts, "guardian_id": g["id"], "via": d["via"], **meta_for(text),
               **({"deliver_after": d["deliver_after"]} if d.get("deliver_after") else {})}
        await store.put("sent", row)
        await store.put("threads", {"id": logic.new_id("tm"), "student_id": st["id"], "guardian_id": g["id"],
                                    "from": "center", "author_id": tid, "text": text, "ts": ts,
                                    "status": d["status"], "via": d["via"], "kind": "auto_note" if auto else "update",
                                    "session_id": s["id"],
                                    **({"deliver_after": d["deliver_after"]} if d.get("deliver_after") else {})})
        rows.append(row)
    await family_event(st["id"], who, english, ts)
    return rows


# ------------------------------------------------------------------ v3.15b drafts (the tutor's "To send" queue)

def moments_of(s: dict, shares: list[dict]) -> list[dict]:
    """The student's own messages in a session the tutor may quote (shared ones flagged)."""
    shared = {x["msg_index"] for x in shares if x["session_id"] == s["id"]}
    return [{"session_id": s["id"], "msg_index": i, "text": m["text"].strip(), "shared": i in shared}
            for i, m in enumerate(s.get("transcript") or [])
            if m.get("from") == "student" and len((m.get("text") or "").split()) >= 3]


def _auto_quote(s: dict, a: dict, st: dict) -> dict | None:
    if not auto_quote_ok(st, infer_subject(a)):
        return None
    rep = s.get("gap_report") or pip_ai.report_det(s, a, st)
    good = [c for c in rep["concepts"] if c["status"] == "explained" and (c.get("quote") or "").strip()]
    if not good:
        return None
    c = next((c for c in good if c.get("fixed_after")), good[-1])
    rule = next((r for r in s.get("brain") or [] if r["concept_id"] == c["concept_id"]), {})
    return {"text": c["quote"].strip(), "msg_index": rule.get("msg_index", -1), "session_id": s["id"],
            "shared": False, "source": "auto"}


def _draft_text(d: dict, s: dict, a: dict, st: dict, tutor_name: str) -> str:
    f = {"first": st["name"].split()[0], "topic": short_topic(a["topic"]), "quote": (d.get("quote") or {}).get("text"),
         "fixed": bool(d.get("fixed")), "ko": bool(s.get("ko")), "tutor": tutor_name, "assignment": a,
         "goal": d.get("_goal")}
    return auto_note(f) if d["kind"] == "ko_note" else update_template(f)


async def _draft_ctx(d: dict):
    store = _ctx["store"]
    s = _need(await store.get("sessions", d["session_id"]), "session")
    a = _need(await store.get("assignments", s["assignment_id"]), "assignment")
    st = _need(await store.get("students", d["student_id"]), "student")
    t = await store.get("tutors", d["tutor_id"]) or {}
    return s, a, st, t.get("name") or "your tutor"


async def _render(d: dict, keep_edits: bool = False) -> dict:
    """(Re)write by_guardian messages from the draft's quote; guardians = everyone with updates != off."""
    s, a, st, tn = await _draft_ctx(d)
    goal = next(iter(goal_progress(st, d["subject"])), None) if is_sat_kid(st, d["subject"]) else None
    d["goal"] = {"target": goal["target"], "latest": goal["latest"], "label": f"{goal['subject_name']} practice score"} \
        if goal else None
    msg = _draft_text({**d, "_goal": goal}, s, a, st, tn)
    send, _ = await _targets(st)
    old = {x["guardian_id"]: x for x in d.get("by_guardian") or []}
    d["by_guardian"] = []
    for g in send:
        via, _c = channel(g)
        edited = old.get(g["id"], {}).get("message") if keep_edits else None
        d["by_guardian"].append({"guardian_id": g["id"], "name": g["name"], "via": via, "message": edited or msg})
    d["moments"] = moments_of(s, await _ctx["store"].all("shares", session_id=s["id"]))
    return d


async def build_draft(s: dict, a: dict, st: dict, kind: str = "report") -> dict:
    """A new Draft for a session: quote = the student's latest share > auto (grade <= 6, not SAT) > none."""
    shares = sorted(await _ctx["store"].all("shares", session_id=s["id"]), key=lambda x: x["ts"], reverse=True)
    quote = ({"text": shares[0]["quote"], "msg_index": shares[0]["msg_index"], "session_id": s["id"], "shared": True,
              "source": "student"} if shares else _auto_quote(s, a, st))
    rep = s.get("gap_report") or pip_ai.report_det(s, a, st)
    fx = next((c for c in rep["concepts"] if c["status"] == "explained" and c.get("fixed_after") and c.get("quote")), None)
    fixed = {"before": mission_before(a), "after": fx["quote"]} if fx and (
        auto_quote_ok(st, infer_subject(a)) or (quote and quote["text"] == fx["quote"])) else None
    d = {"id": logic.new_id("dr"), "student_id": st["id"], "tutor_id": a.get("tutor_id") or st["tutor_id"],
         "session_id": s["id"], "subject": infer_subject(a), "topic": mission_text(a)[0],
         "kind": kind if kind in ("report", "ko_note") else "report", "status": "draft", "created_at": _iso(clock()),
         "quote": quote, "fixed": fixed}
    return await _render(d)


async def _latest_session(student_id: str, last_id: str | None = None) -> dict | None:
    mine = [s for s in await _ctx["store"].all("sessions", student_id=student_id)
            if s.get("kind") != "review" and not s.get("saved")]   # saved demo runs never feed drafts
    done = [s for s in mine if s.get("ko")] or [s for s in mine if s["status"] in ("quizzed", "complete")] or mine
    if not done:
        return None
    pinned = next((s for s in done if s["id"] == last_id), None)  # same-second sessions: the student's latest wins
    return pinned or max(reversed(done), key=lambda s: s["created_at"])


@router.get("/students/{student_id}/drafts")
async def list_drafts(student_id: str):
    _need(await _ctx["store"].get("students", student_id), "student")
    items = [d for d in await _ctx["store"].all("drafts", student_id=student_id) if d["status"] == "draft"]
    return {"items": sorted(items, key=lambda d: d["created_at"], reverse=True)}


@router.post("/students/{student_id}/drafts")
async def create_draft(student_id: str, body: dict = Body(default={})):
    store = _ctx["store"]
    st = _need(await store.get("students", student_id), "student")
    sid = (body or {}).get("session_id")
    s = await store.get("sessions", sid) if sid else await _latest_session(student_id, st.get("last_session_id"))
    if not s or s["student_id"] != student_id:
        raise HTTPException(404 if not sid else 422, "no session to report on" if not sid else "not this student's session")
    for d in await store.all("drafts", session_id=s["id"]):
        if d["status"] == "draft":
            return d
    a = _need(await store.get("assignments", s["assignment_id"]), "assignment")
    d = await build_draft(s, a, st, (body or {}).get("kind") or "report")
    await store.put("drafts", d)
    return d


@router.patch("/drafts/{draft_id}")
async def patch_draft(draft_id: str, body: dict = Body(...)):
    store = _ctx["store"]
    d = _need(await store.get("drafts", draft_id), "draft")
    if d["status"] != "draft":
        raise HTTPException(409, f"draft already {d['status']}")
    if "quote" in body:
        q = body["quote"]
        if q is None:
            d["quote"] = None
        else:
            s = await store.get("sessions", str((q or {}).get("session_id") or d["session_id"]))
            i = (q or {}).get("msg_index")
            if not s or s["student_id"] != d["student_id"] or not isinstance(i, int) or isinstance(i, bool) \
                    or not 0 <= i < len(s["transcript"]) or s["transcript"][i].get("from") != "student":
                raise HTTPException(422, "quote must be one of the student's own messages")
            shared = any(x["msg_index"] == i for x in await store.all("shares", session_id=s["id"]))
            d["quote"] = {"text": s["transcript"][i]["text"].strip(), "msg_index": i, "session_id": s["id"],
                          "shared": shared, "source": "student" if shared else "tutor"}
        if d.get("fixed") and (d["quote"] or {}).get("text") != d["fixed"]["after"]:
            st = await store.get("students", d["student_id"])
            if not auto_quote_ok(st, d["subject"]):
                d["fixed"] = None
        d = await _render(d)
    if isinstance(body.get("by_guardian"), list):
        edits = {x.get("guardian_id"): x.get("message") for x in body["by_guardian"] if isinstance(x, dict)}
        for x in d["by_guardian"]:
            if isinstance(edits.get(x["guardian_id"]), str) and edits[x["guardian_id"]].strip():
                x["message"] = edits[x["guardian_id"]].strip()
    await store.put("drafts", d)
    return d


async def _send_draft(d: dict, edits: dict | None = None, auto: bool = False) -> list[dict]:
    store = _ctx["store"]
    s, a, st, tn = await _draft_ctx(d)
    msgs = {x["guardian_id"]: x["message"] for x in d.get("by_guardian") or []}
    msgs.update({k: v.strip() for k, v in (edits or {}).items() if isinstance(v, str) and v.strip()})
    first = next(iter(msgs.values()), None) or _draft_text(d, s, a, st, tn)
    goal = next(iter(goal_progress(st, d["subject"])), None) if is_sat_kid(st, d["subject"]) else None
    rows = await send_update(s, a, st, tn, first, {"messages": msgs}, auto=auto,
                             meta_override={"tutor_id": d["tutor_id"], "quote": (d.get("quote") or {}).get("text"),
                                            "quote_source": (d.get("quote") or {}).get("source"), "fixed": d.get("fixed"),
                                            "goal": goal, "draft_id": d["id"]})
    d.update(status="sent", sent_at=rows[0]["ts"], by_guardian=[{**x, "message": msgs.get(x["guardian_id"], x["message"])}
                                                               for x in d.get("by_guardian") or []])
    await store.put("drafts", d)
    s = await store.get("sessions", s["id"])
    s["parent_sent_at"] = rows[0]["ts"]
    await store.put("sessions", s)
    return rows


@router.post("/drafts/{draft_id}/send")
async def send_draft(draft_id: str, body: dict = Body(default={})):
    d = _need(await _ctx["store"].get("drafts", draft_id), "draft")
    if d["status"] != "draft":
        raise HTTPException(409, f"draft already {d['status']}")
    edits = {x.get("guardian_id"): x.get("message") for x in (body or {}).get("by_guardian") or [] if isinstance(x, dict)}
    rows = await _send_draft(d, edits)
    return {"sent_all": rows, "sent": rows[0], "draft": d}


@router.post("/drafts/{draft_id}/skip")
async def skip_draft(draft_id: str):
    store = _ctx["store"]
    d = _need(await store.get("drafts", draft_id), "draft")
    if d["status"] != "draft":
        raise HTTPException(409, f"draft already {d['status']}")
    d["status"] = "skipped"
    await store.put("drafts", d)
    return {**d, "ok": True}


@router.patch("/students/{student_id}/settings")
async def student_settings(student_id: str, body: dict = Body(...)):
    store = _ctx["store"]
    st = _need(await store.get("students", student_id), "student")
    if "auto_ko_note" in body:
        on = bool(body["auto_ko_note"])
        if on and int(st.get("grade") or 0) > 6:
            raise HTTPException(422, "auto_ko_note is only for grade 6 and under")
        st["auto_ko_note"] = on
        await store.put("students", st)
    return {"student": with_pip(st)}


async def after_ko(session_id: str) -> None:
    """Background after a K.O.: a draft in the tutor's queue, or (auto_ko_note, grade <= 6) a short note sent now."""
    try:
        store = _ctx["store"]
        s = await store.get("sessions", session_id)
        st = s and await store.get("students", s["student_id"])
        a = s and await store.get("assignments", s["assignment_id"])
        if not (s and st and a and s.get("ko")) or s.get("saved"):
            return
        if any(d["status"] == "draft" for d in await store.all("drafts", session_id=session_id)):
            return
        auto = bool(st.get("auto_ko_note")) and auto_quote_ok(st, infer_subject(a))
        d = await build_draft(s, a, st, "ko_note" if auto else "report")
        if auto:
            d["quote"] = None  # the unreviewed note never quotes
            d = await _render(d)
        await store.put("drafts", d)
        if auto:
            await _send_draft(d, auto=True)
    except Exception:  # noqa: BLE001 - never break the K.O. path
        log.exception("post-K.O. draft failed")


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
                 **{k: e[k] for k in ("target_score", "practice_scores") if k in e},
                 "started": (today - timedelta(days=e["started_days_ago"])).isoformat(),
                 "last_attended": _iso(now - timedelta(days=e["last_attended_days_ago"], hours=2)),
                 "package": pkg}, today))
        st["enrollments"] = rows
        st["guardian_ids"] = gids.get(sid, [])
        pip = (ops.get("pips") or {}).get(sid)
        if pip:  # B16b: every student has their own Pip (look + name); brain version stays on the student
            st["pip"] = {**pip, "brain_version": int(st.get("brain_version") or 1), "form": "base"}
            st["pip_name"] = pip["name"]
        st["auto_ko_note"] = False   # v3.15: off by default; tutors approve every send (opt-in for grade <= 6)


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
        q = {r["concept_id"]: r["quote"] for r in th["brain"]}
        lines = [("pip", f"Hi. I'm {st.get('pip_name') or 'Pip'}. I'm learning solving linear equations. I already "
                         f"know one rule: {a['misconception']}. Easy."),
                 ("student", q["k1"]), ("pip", "So both sides have to stay equal. What do I do with the 6, then?"),
                 ("student", "move it over"), ("pip", "Saving that: 'move it over'. So 2x = 20 + 6?"),
                 ("pip", "My brain has a bug about this: \"move it over\". Fix it?"),
                 ("student", q["k2"]), ("pip", "Oh. Take it away from both sides. So x = 7? How do I know?"),
                 ("student", q["k3"]), ("pip", a.get("cliffhanger") or "Okay. Next one.")]
        tr_ = [{"from": w, "text": t, "ts": _iso(created + timedelta(minutes=k))} for k, (w, t) in enumerate(lines)]
        idx = {t: k for k, (w, t) in enumerate(lines) if w == "student"}
        brain = [{"id": f"r_{r['concept_id']}", "msg_index": idx[r["quote"]], **r} for r in th["brain"]]
        quiz = [{"id": x["id"], "concept_id": x["concept_id"], "question": x["question"],
                 "rule_id": f"r_{x['concept_id']}", "pip_answer": x.get("answer", ""), "line": "", "passed": True}
                for x in a.get("quiz") or []]
        s = logic.new_session(a, st["id"], "blob", "frog", "none", [])
        s.update(id=th["session_id"], status="complete", ko=True, brain=brain, quiz=quiz, boss_hp=0, transcript=tr_,
                 mood="celebrating", reteach_count=th["reteach_count"], brain_version=2, minutes=th["minutes"],
                 meters={k["id"]: 60 for k in a["concepts"]}, synthetic=True, created_at=_iso(created),
                 parent_sent_at=_iso(created + timedelta(hours=3)))
        s["gap_report"] = pip_ai.report_det(s, a, st)
        await store.put("sessions", s)
        share_i = idx[q[th["share_concept"]]]   # Theo's own "show my family this" (grade 9: no auto quotes)
        await store.put("shares", {"id": "share_theo_1", "student_id": st["id"], "session_id": s["id"],
                                   "msg_index": share_i, "assignment_id": a["id"], "subject": "sat_math",
                                   "topic": mission_text(a)[0], "quote": lines[share_i][1],
                                   "ts": _iso(created + timedelta(minutes=15)),
                                   "from": {"student_id": st["id"], "name": st["name"]}})
        st.update(brain_version=2, ko_count=1, last_session_id=s["id"], since_last_session=s["gap_report"]["summary"],
                  album=[{"assignment_id": a["id"], "boss_name": a["boss"]["name"], "card_no": 1,
                          "variant": "comeback", "date": s["created_at"]}])
        await store.put("students", st)
    # sent-log rows for every seeded tutor-sent report (one per guardian who gets updates) + the student's event
    students = {x["id"]: x for x in await store.all("students")}
    assignments = {x["id"]: x for x in await store.all("assignments")}
    guardians = {g["id"]: g for g in ops["guardians"]}
    tutors = {t["id"]: t for t in await store.all("tutors")}
    shares = await store.all("shares")
    for s in await store.all("sessions"):
        if not s.get("parent_sent_at") or s.get("saved"):
            continue
        st, a = students.get(s["student_id"]), assignments.get(s["assignment_id"])
        if not st or not a:
            continue
        tid = st["tutor_id"] if a["id"] in KNOWN_SUBJECT else (a.get("tutor_id") or st["tutor_id"])
        who = _tutor_from(tutors, tid)
        facts = update_facts(s, a, st, who["name"], shares)
        msg = update_template(facts)
        meta = {"session_id": s["id"], "tutor_id": tid, "from": who, "auto": False, "synthetic": True,
                "quote": facts["quote"], "quote_source": facts["quote_source"] if facts["quote"] else None,
                "fixed": facts["fixed_pair"] if facts["fixed_pair"] and facts["fixed_pair"]["after"] in msg else None}
        sent_any = False
        for gid in st.get("guardian_ids") or []:
            g = guardians.get(gid)
            if not g or g["updates"] == "off" or not reachable(g):
                continue
            via, contact = channel(g)
            row = {"id": f"sent_seed_{s['id']}_{gid}", "student_id": st["id"], "to": f"{g['name']} \u00b7 {via} {contact}",
                   "message": msg, "status": "test-mode (not delivered)", "ts": s["parent_sent_at"],
                   "guardian_id": gid, "via": via, **meta}
            await store.put("sent", row)
            await store.put("threads", {"id": f"tm_seed_{s['id']}_{gid}", "student_id": st["id"],
                                        "guardian_id": gid, "from": "center", "author_id": tid,
                                        "text": msg, "ts": s["parent_sent_at"], "status": row["status"],
                                        "via": via, "kind": "update", "session_id": s["id"]})
            sent_any = True
        if sent_any:
            await store.put("events", {"id": f"ev_fam_{s['id']}", "kind": "family_shared", "student_id": st["id"],
                                       "ts": s["parent_sent_at"], "due": False, "by": who, "synthetic": True,
                                       "text": f"{who['name']} shared this with your family", "preview": msg[:240]})
    # v3.15b "To send" queue: every finished seeded session with no update yet. Saved demo runs are invisible to
    # logic (rule 1), so Maya's saved session gets no draft: her live K.O. makes her one pending draft (D-27).
    _ctx["store"] = _ctx["store"] or store
    for s in await store.all("sessions"):
        if (s.get("saved") or s.get("parent_sent_at") or s["status"] not in ("quizzed", "complete")
                or s.get("kind") == "review"):
            continue
        st, a = students.get(s["student_id"]), assignments.get(s["assignment_id"])
        if st and a:
            d = await build_draft(s, a, st)
            d["id"] = f"dr_seed_{s['id']}"
            d["created_at"] = s["created_at"]
            await store.put("drafts", d)
