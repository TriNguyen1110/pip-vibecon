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
               misconception, root_prerequisite, boss: Boss, cliffhanger,
               quiz: [{id, concept_id, question, answer}], created_at }
               // The frontend posts the edited draft back with ALL fields (spread the draft);
               // the backend keeps unknown fields.
Message      { from: "pip"|"student"|"system", text, ts, event?: Event }
Event        { kind: "hit"|"heal"|"none", amount, caption, weapon?, unlocked?: string[] }
Rule         { id, concept_id, quote, correct, msg_index, fixed_after?: number }  // msg_index = transcript index of the student message the quote came from
QuizItem     { id, concept_id, question, rule_id|null, pip_answer, passed, line }
GapConcept   { concept_id, concept_text, status: "explained"|"vague"|"misconception",
               quote|null, fixed_after|null }
GapReport    { concepts: GapConcept[], minutes, quiz_passed, quiz_total, opener,
               root_cause, cliffhanger, summary, student_view: string[] }
Session      { id, student_id, assignment_id, status: "teaching"|"quizzed"|"complete",
               look: "blob"|"bot"|"doodle", creature: "blob"|"cat"|"dragon"|"axolotl"|"frog"|"bot",
               accessory: "none"|"glasses"|"scarf"|"pencil"|"badge"|"backpack"  // nerdy, earned; no caps/headphones (DESIGN.md), transcript: Message[],
               meters: {[concept_id]: 0..100}, boss_hp: 0..100, weapons: string[],
               equipped: string|null, mood: "confused"|"lightbulb"|"stuck"|"celebrating",
               brain: Rule[], quiz: QuizItem[], reteach_count, reteach_concept|null, reteach_from|null,
               brain_version: 1|2|3, ko: bool, finisher|null, gap_report: GapReport|null,
               parent_message|null, saved?: bool, label?: string }
Student      { id, name, grade, tutor_id, interests: string|null, since_last_session: string|null,
               last_session_id: string|null }
```

## Endpoints

| Method + path | Body | Returns |
|---|---|---|
| GET `/api/health` | | `{ok, model, ai: "live"|"offline", store: "mongo"|"memory"}` |
| GET `/api/center` | | `{center, insight: {misconception, count, boss_name}, came_back_this_week, pilot: {status}}` |
| GET `/api/tutors/{tutor_id}/roster` | | `{tutor, students: Student[]}` (Ms. Rivera = `t1`) |
| GET `/api/students/{student_id}` | | `{student, assignments: Assignment[], sessions: Session[]}` (Maya = `s001`) |
| POST `/api/students/{student_id}/open` | | `{ok}` (records an app open; counts toward "came back on their own") |
| POST `/api/assignments/draft` | `{student_id, grade, topic}` | `Assignment` (unsaved, `id: null`) — slow-ish AI call |
| POST `/api/assignments` | `Assignment` (edited draft) | `Assignment` (saved) |
| POST `/api/sessions` | `{assignment_id, student_id, look, creature, accessory}` | `Session` (with Pip's opening messages) |
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
| POST `/api/demo/warm` | | `{ok, ai}` (one tiny call per AI schema; run before recording) |

Errors: non-2xx with `{detail}`. AI calls can take a few seconds; the UI shows
"Pip is thinking…" and keeps the student's message visible immediately (optimistic).

## Behavior rules (coordinator decisions after the architect review)
1. **Saved sessions are invisible to logic.** Sessions with `saved: true` never count for the opener's
   recall, `since_last_session`, `last_session_id`, the insight count or "came back". The insight counts
   only sessions whose final Brain still holds the wrong rule (seed gives 14).
2. **Opening:** Pip's last opening message is always the misconception claim (e.g. "1/2 + 1/3 = 2/5…").
   An interests question or old-rule recall may come before it in the same opening, never after.
   After `/api/demo/reset`, Maya (`s001`) has interests pre-filled and no prior sessions, so her
   opening is just the claim. Maya's demo mission is the seeded `a_frac`, pinned as her current mission.
3. **Re-teach and retry:** `POST /reteach {concept_id}` → `status: "teaching"`, `reteach_count += 1`,
   `reteach_from` = transcript length, Pip asks to be fixed. After ≥ 1 student turn the UI shows
   "Let Pip retry", which calls `POST /quiz`. In re-teach mode `/quiz` re-extracts only that concept's
   rule from messages after `reteach_from`, sets `fixed_after = reteach_count` when it becomes correct,
   re-asks only that question and keeps the other results. All passed → `ko: true`, `status: "complete"`,
   `brain_version += 1` (only at K.O.).
4. **Quiz items:** `pip_answer` is the worked answer ("5/12"); `line` is Pip's in-character sentence.
5. **Gap report at K.O.:** built deterministically inside the K.O. response (statuses, quotes,
   fixed_after, minutes, quiz counts, root cause from `root_prerequisite`, templated opener for the
   weakest concept, cliffhanger, `student_view`). AI may polish `summary`/`opener` in the background.
   `parent_message` is pre-generated in the same background task (template fallback) so Preview is instant.
6. **Concurrency:** one in-flight turn per session (server lock; UI disables Send while waiting).
7. **Stripe** success/cancel URLs derive from the request's `Origin` header.
8. **No XP in the UI.** Boss taunts while typing are frontend templates using `boss.name`.
9. **Demo safety:** `PIP_FORCE_OFFLINE=1` runs the scripted fractions demo deterministically (labeled
   "offline demo"); the saved session is a complete, re-taught K.O. run with a gap report.

## v3 additions (Saturday evening; additive, nothing above changes)
```
Lesson       { standard, source, attribution, in_scope: string[], out_of_scope: string[],
               concepts: [{ concept_id, look_fors: string[], probe_ladder: string[4],
                            spoilers: string[], friend_nudge }] }
               // stored on Assignment as `lesson`; hidden from students; tutor can edit ladder/look-fors
Event        { ..., level?: 0|1|2|3 }      // rubric level of the explanation that produced the event
GapConcept   { ..., stuck: bool }          // true when the probe ladder ran out without a level-2 explanation
Session      { ..., opening_source: "claim"|"past_self" }  // past_self = Pip believes the student's own
                                                           // last unfixed misconception ("someone told me…")
AtRisk       { student_id, name, reasons: string[] }      // plain-language reasons, tutor/owner only
```
| Method + path | Body | Returns |
|---|---|---|
| GET `/api/center/at-risk` | | `{students: AtRisk[]}` (stuck after the full ladder, no return on their own in 14 days, or no parent update in 14 days) |

Rules: rubric levels 0 none/off-topic (+0), 1 procedure without reason (+5, no damage), 2 reason tied to meaning
(+25, hit), 3 reason + applied to a new case (+40, critical). Pip asks only from the current concept's
`probe_ladder`, in order; the server replaces any reply that contains a `spoilers` string with the next ladder
rung. Out-of-scope topics get "Not in my brain yet." and are noted for the tutor. After the last rung Pip offers
the concept's `friend_nudge` (a hint framed as something a friend said, never the answer), then moves on and
marks the concept `stuck` if still below level 2. Pip talks like a confused friend: paraphrases back ("So you're
saying…"), never "Correct!", never teacher phrases. Seeded missions: `a_frac` (Maya, fractions) and `a_sat_commas`
(a different student, SAT Writing: commas and run-ons), both hand-written and offline-capable.

## v3.1 additions (talking, centered mascot; frontend + 3D only, no backend change)
`MascotStage` gains two optional props: `mouth` (0–1, how open the mouth is right now; the frontend drives it
while Pip speaks) and `framing: "default"|"hero"` (hero = Talking-Tom layout: Pip large and centered, facing the
student; in the arena the boss stands smaller behind Pip to the right). Pip's voice is client-side only (browser
speech synthesis); no audio is recorded, stored or sent. Captions always show; voice is never the only channel.

## v3.2 (student palette)
Student (Play) screens get two palettes: **Daylight Arcade** (default) and **Night Arcade** (toggle; first visit
follows `prefers-color-scheme`, choice remembered). `MascotStage` gains optional `theme: "day"|"night"` so
environments light and color themselves to match. Studio (tutor/owner/landing) keeps the forest palette.

## v3.3 (mascot vibe)
`vibe: "cute"|"cool"|"ugly"` — a third mascot choice next to creature and accessory. Stored on the session
(`Session.vibe`, sent in POST /api/sessions; default "cute"), passed to `MascotStage` as `vibe`. cute = the fuzzy
friend; cool = sleek, confident, streetwear-collectible (dark/matte colourways, chrome or neon accents, a visor or
hood option, half-lidded unimpressed eyes); ugly = intentionally ugly-cute (Labubu/Ugly Doll energy: crooked
toothy grin, mismatched eye sizes, eye bags, scruffy uneven fur, a stitched patch, one wonky ear/horn) — still
friendly, never gross or scary. All three keep Pip's deadpan personality.

## v3.4 (Pip's voice via ElevenLabs)
| Method + path | Body | Returns |
|---|---|---|
| POST `/api/tts` | `{text, session_id?}` | `{audio_b64, mime: "audio/mpeg", alignment: {characters[], character_start_times_seconds[], character_end_times_seconds[]} }` or `{fallback: true}` when ElevenLabs isn't configured / fails |
Backend calls ElevenLabs `/v1/text-to-speech/{voice_id}/with-timestamps` with `ELEVENLABS_API_KEY`,
`ELEVENLABS_VOICE_ID`, `ELEVENLABS_MODEL` (default `eleven_flash_v2_5`; verify it's accepted on this endpoint, else
use the documented default), caches by hash(text+voice) in memory, 8 s timeout. The key never reaches the browser.
Frontend plays the audio and drives Pip2D `viseme` from the character alignment; if `fallback`, it uses browser
speechSynthesis as before. Only Pip's lines are spoken; no student audio is recorded or sent.

## v3.5 (cast of voices)
POST `/api/tts` accepts `speaker` (default `pip`) and optional `vibe`, `grade`, `boss_id`. The backend resolves the
voice from `backend/voices.json` (voice IDs + ElevenLabs voice_settings per role; IDs aren't secrets):
`pip_cute` Fena · `pip_ugly` Michael Mouse · `pip_cool` Tri (user's cloned voice) · `boss_walrus` Rob ·
`boss_penguin` Oxley (SAT, grade ≥ 11 only; else Rob) · `boss_hamster` Jen Frankie · `announcer` Xavier ·
`narrator` Tri. Students can override Pip's voice in the Look sheet (`pip_voice`), saved on the session.
Boss captions (hit/heal/taunt) are spoken in the boss voice; short announcer stings ("BOSS FIGHT", "K.O.",
"BRAIN UPGRADED") in Xavier's voice. Mute silences all; captions always show.
