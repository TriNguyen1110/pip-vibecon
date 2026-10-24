# Pip architecture (coordinator-owned; builders read, coordinator changes)

## Goal and constraints
- Demo path (DEMO_SCRIPT.md) must be flawless on an iPhone-width screen and a laptop.
- Ships and demos on **Emergent** (public URL). Code is written in this repo and pulled in.
- Speed was the reason we left Emergent's own build: **one AI call per student message**.
- Solo team, freeze Sun 10:00, submit Sun 11:40.

## System
```
Browser (React, Vite)                FastAPI (Python)                 Data / services
 student / tutor / owner screens ──► /api/* (server.py)  ──────────► MongoDB (Emergent MONGO_URL)
 3D MascotStage (lazy, r3f)            logic.py  state rules           or in-memory (local dev)
 optimistic chat UI                    pip_ai.py prompts + fallbacks ─► Claude (llm.py, structured JSON)
                                       BackgroundTasks (gap report)  ─► Twilio test / Stripe test (optional)
```
- **One process, one database, one AI wrapper.** No queues, no microservices.
- Frontend calls `${VITE_BACKEND_URL ?? ''}/api`; Vite dev proxy → `localhost:8001`.
- The 3D layer is isolated: lazy-loaded, behind an error boundary, never blocks a screen.

## Data model (MongoDB collections, documents keyed by `id`)
`centers`, `tutors`, `students` (interests), `assignments` (concepts + weapons, misconception,
boss, quiz questions, cliffhanger), `sessions` (one document per teaching session: transcript,
meters, boss_hp, weapons, brain, quiz, reteach_count, brain_version, ko, gap_report),
`events` (app opens, for "came back on their own"), `sent_log`, `workshops`, `pilot`.
Shapes: CONTRACT.md.

## AI call budget (the latency plan)
| Moment | Calls | Model / effort | Notes |
|---|---|---|---|
| Open a session | 0 | — | Templated opening (interests question / recall / misconception) |
| Each student message | **1** | `PIP_CHAT_MODEL` (default Opus 5.5) / low | Reply + progress + hit/heal + caption + interests in one structured JSON |
| Quiz Pip | **1** | `PIP_WORK_MODEL` / medium | Brain extraction + literal answers together; quotes validated server-side |
| K.O. | 0 extra on the student path | — | Gap report generated in a background task |
| Tutor creates a mission | 1 | work model | Concepts, misconception, boss, weapons, quiz, cliffhanger in one call |
| Parent update | 1 | work model | Preview only; send is not an AI call |
Every AI path has an offline fallback (no key, refusal, timeout) so the demo never dead-ends.
Server, not the model, owns numbers: HP, meters, unlocks, brain version, counts.

## Trust boundaries
- Verbatim quotes are checked against the transcript on the server; no invented evidence.
- Secrets only in `backend/.env` (git-ignored) or Emergent's env. Stripe test keys only.
- Synthetic data only; no real students, no recording of voices.

## Ownership
| Area | Owner |
|---|---|
| ARCHITECTURE.md, CONTRACT.md, COMMANDS.md, package/config files, git, integration, Emergent import | coordinator |
| `backend/**` | backend |
| `frontend/**` except `frontend/src/three/**` | frontend |
| `frontend/src/three/**` | 3d |
| `tests/**`, `reports/verification/**`, `done` rows | verifier |
| `DESIGN_SYSTEM.md` (visual spec the frontend and 3D follow) | design lead |

## Integration gates (Saturday)
1. **Contract freeze**: CONTRACT.md + this doc reviewed by the architect; changes only via coordinator.
2. **Local journey (offline)**: backend B1–B6 review + frontend F1 review → coordinator runs DEMO_SCRIPT locally.
3. **Local journey (live AI)**: same with a key; measure turn latency (target < 4 s).
4. **Emergent import**: repo pulled into Emergent, public URL, Mongo + key configured.
5. **Verifier**: V1 on the Emergent URL (phone width + laptop). Only then: stretch work.
