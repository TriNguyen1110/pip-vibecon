# Pip API contract (frontend ↔ backend)

Backend: FastAPI in `backend/`, every route under `/api`, JSON in and out. Frontend: React
(Vite) in `frontend/`, calls `${import.meta.env.VITE_BACKEND_URL ?? ''}/api/...`; in dev,
Vite proxies `/api` to `http://localhost:8001`. All data is synthetic.

Ownership: backend owner edits `backend/` only; frontend owner edits `frontend/` except
`frontend/src/three/`, which the 3D owner edits. Change this file only by agreement.

## Shapes

```
Concept      { id, text, weapon }                       // weapon: "Common Denominator Cleaver 🔪🍕"
Boss         { name, emoji, backstory }                 // emoji: two emoji, e.g. "🍕🦵"
Assignment   { id, student_id, tutor_id, grade, topic, why_it_matters, concepts: Concept[3],
               misconception, root_prerequisite, boss: Boss, cliffhanger, created_at }
Message      { from: "pip"|"student"|"system", text, ts, event?: Event }
Event        { kind: "hit"|"heal"|"none", amount, caption, weapon?, unlocked?: string[] }
Rule         { id, concept_id, quote, correct, fixed_after?: number }
QuizItem     { id, concept_id, question, rule_id|null, pip_answer, passed, line }
GapConcept   { concept_id, concept_text, status: "explained"|"vague"|"misconception",
               quote|null, fixed_after|null }
GapReport    { concepts: GapConcept[], minutes, quiz_passed, quiz_total, opener,
               root_cause, cliffhanger, summary, student_view: string[] }
Session      { id, student_id, assignment_id, status: "teaching"|"quizzed"|"complete",
               look: "blob"|"bot"|"doodle", creature, transcript: Message[],
               meters: {[concept_id]: 0..100}, boss_hp: 0..100, weapons: string[],
               equipped: string|null, mood: "confused"|"lightbulb"|"stuck"|"celebrating",
               brain: Rule[], quiz: QuizItem[], reteach_count, reteach_concept|null,
               brain_version: 1|2|3, ko: bool, finisher|null, gap_report: GapReport|null,
               saved?: bool, label?: string }
Student      { id, name, grade, tutor_id, interests: string|null, since_last_session: string|null }
```

## Endpoints

| Method + path | Body | Returns |
|---|---|---|
| GET `/api/health` | | `{ok, model}` |
| GET `/api/center` | | `{center, insight: {misconception, count, boss_name}, came_back_this_week, pilot: {status}}` |
| GET `/api/tutors/{tutor_id}/roster` | | `{tutor, students: Student[]}` (Ms. Rivera = `t1`) |
| GET `/api/students/{student_id}` | | `{student, assignments: Assignment[], sessions: Session[]}` (Maya = `s001`) |
| POST `/api/students/{student_id}/open` | | `{ok}` (records an app open; counts toward "came back on their own") |
| POST `/api/assignments/draft` | `{student_id, grade, topic}` | `Assignment` (unsaved, `id: null`) — slow-ish AI call |
| POST `/api/assignments` | `Assignment` (edited draft) | `Assignment` (saved) |
| POST `/api/sessions` | `{assignment_id, student_id, look, creature}` | `Session` (with Pip's opening messages) |
| GET `/api/sessions/{id}` | | `Session` |
| POST `/api/sessions/{id}/turn` | `{text}` | `Session` (new student + Pip messages appended; meters/HP/mood/weapons updated) |
| POST `/api/sessions/{id}/equip` | `{weapon}` | `Session` |
| POST `/api/sessions/{id}/quiz` | | `Session` (brain + quiz filled; if all passed: `ko: true`, `status: "complete"`, brain_version++, gap_report filled) |
| POST `/api/sessions/{id}/reteach` | `{concept_id}` | `Session` (`status: "teaching"`, `reteach_concept` set, Pip asks to be re-taught) |
| POST `/api/sessions/{id}/finisher` | `{weapon}` | `Session` (`finisher` set) |
| GET `/api/sessions/{id}/report` | | `GapReport` (generates if missing) |
| POST `/api/sessions/{id}/parent-update/preview` | | `{message}` |
| POST `/api/sessions/{id}/parent-update/send` | `{message}` | `{sent: SentLog}` |
| GET `/api/sent-log` | | `{items: SentLog[]}` where `SentLog {id, student_id, to, message, status: "delivered"|"test-mode (not delivered)", ts}` |
| POST `/api/workshops` | `{misconception}` | `{note}` |
| POST `/api/pilot/checkout` | | `{url}` (Stripe test Checkout URL, or the in-app success URL when Stripe isn't configured, with `simulated: true`) |
| POST `/api/pilot/confirm` | | `{pilot: {status}}` |
| POST `/api/demo/reset` | | `{ok}` |

Errors: non-2xx with `{detail}`. AI calls can take a few seconds; the UI shows
"Pip is thinking…" and keeps the student's message visible immediately (optimistic).
