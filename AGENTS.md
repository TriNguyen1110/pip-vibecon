# Pip @ VibeCon SF 2026 — project instructions

Read `TEAM_BRIEF.md`, `HACKATHON.md`, `PRODUCT_SPEC.md`, `EMERGENT_PROMPTS.md`,
`PITCH.md` and `BOARD.tsv` first.

## The rule: build with anything, ship and demo on Emergent

VibeCon rules (confirmed at the venue, Oct 24): "Use any tools that make you fast, including Claude, coding agents or anything else, but your final product ships and demos on Emergent."

So agents **may write application code** here. The code lives in this GitHub repo and
is pulled into the team lead's Emergent project, where it ships and is demoed at the
public Emergent URL. Keep it import-friendly for Emergent:

- React frontend in `frontend/`, FastAPI backend in `backend/`, MongoDB via `MONGO_URL`
  and `DB_NAME`; every backend route under `/api`.
- Secrets only in `.env` files that are git-ignored; commit `.env.example` instead.
- No code written before Sat 9:30 AM kickoff; synthetic data only; payments in test mode.

## Repository preflight

Run `bash scripts/check-workspace.sh` with this project's root as the explicit
workdir before editing. Application code lives in `frontend/` and `backend/`; docs stay at the root.

## Roles

| Role | Owns | Never |
|---|---|---|
| Coordinator (main session, the human's partner) | Scope, BOARD, Emergent session, gates, submission | Lets a feature slip past a gate |
| `researcher` | `research/**`, citations in `RESEARCH.md` | States a number without a source URL |
| `emergent-coach` | `prompts/**`, next prompt in `EMERGENT_PROMPTS.md` | Writes code; asks Emergent to rebuild working parts |
| `verifier` | `reports/verification/**`, BOARD `done` rows | Fixes things itself; passes an unrun check |
| `pitch` | `PITCH.md`, `submission/**` | Claims a feature the verifier hasn't passed, or an unsourced number |

Keep at most three agents active. The human drives Emergent; agents prepare the
next move and check the last one.

## The loop (every Emergent step)

1. `emergent-coach` writes the next prompt for one BOARD item (small, testable).
2. Human pastes it into Emergent and lets it build.
3. Human or coordinator appends `review` with the Emergent preview/deploy URL.
4. `verifier` runs that item's acceptance checks in a browser and appends `done`
   or `doing` with the exact failure to fix.
5. On failure, `emergent-coach` writes a targeted fix prompt ("only change X; do
   not touch Y"). Never ask Emergent to "redo the app".

## BOARD.tsv

Append-only, tab-separated: `ts kind id value owner scope note`. Last row per
`(kind,id)` wins. `kind` is `item` or `fact`. Only `verifier` writes `done`.
Scopes: `RESEARCH`, `PROMPT`, `SCREEN`, `JOURNEY`, `PITCH`, `SUBMIT`.
Record reusable facts once (e.g. `fact	emergent-url	...`, `fact	credits-left	...`).

## Data rules

Synthetic students, parents and centers only. Test-mode messages only. No real
minors' names, photos or schoolwork in the app, the video or the screenshots.
