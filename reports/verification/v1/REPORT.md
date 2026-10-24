# V1 verification: DEMO_SCRIPT journey, local, offline AI

Written by the verifier; saved by the coordinator (the verifier could not write .md files).

- Revision under test: `42a8459` (clean tree). Backend: uvicorn :8741, `ai: offline, store: memory`.
- Frontend: Vite dev :5741 (`PIP_API_PROXY=http://localhost:8741`); production build via `vite preview` :5742.
- Browsers: Chrome for Testing 149.0.7827.55 (full journey); Chrome for Testing 154.0.8037.0 and installed
  Google Chrome 156.0.8078.48 (crash repro).
- Scripts: `tests/e2e/demo.spec.mjs` (journey), `tests/e2e/scrollto-crash.mjs` (repro). Raw: `results.json`, `run.log`.
  Screenshots (`390-*`, `1280-*`, `chrome154-crash/`) are kept locally, not in git.

## Verdict
**FAIL: one critical defect.** On Chrome 149 the journey passes at 390×844 and 1280×800 (48/50 steps; the 2
failures are minor tap targets). On Chrome 154/156 the app crashes: on load in dev, and on the first in-app
navigation ("Try as Maya") in the production build that Emergent serves.

## Pass/fail per step (Chrome 149, 390 and 1280)
| Step | Result |
|---|---|
| Reset; landing; Try as Maya → home; 3D mascot rendered (WebGL, not fallback) | PASS |
| Pinned fractions mission; pick Cat + Glasses; opening is only the claim | PASS |
| #1 asks why; #2 refuses in character; #4 "Why sixths?" | PASS |
| #3 hit 100→75; #5 hit 75→50; weapon unlocked + auto-equipped | PASS |
| #6 heal 50→70 + verbatim "Saving that: 'you just add the top numbers and the bottom numbers'" | PASS |
| Her bubble never coral; optimistic send | PASS |
| Quiz: ③ coral "Pip believes this 😵"; k3 miss with the literal 5/12 line; no ✗ | PASS |
| Brain note tap scrolls to her message | PASS |
| Re-teach ③ → message 8 → Let Pip retry → K.O. (Brain v1→v2) → finisher → card flip | PASS |
| Cliffhanger + "Here's what Ms. Rivera sees" | PASS |
| Roster since-last-session updates; gap report same quote + "fixed after 1 re-teach" | PASS |
| Parent preview → send (test-mode) → sent log | PASS |
| Owner insight 14 + boss chip; Plan a workshop | PASS |
| Pricing → Start pilot → success (simulated) | PASS |
| Tutor New Pip mission for s005 "Expanding (a + b)²" → draft + save | PASS |
| Tap targets ≥ 44px on the mission screen | FAIL (minor) |
| No horizontal overflow at 390 (12 screens) | PASS |
| Same app on Chrome 154/156 | **FAIL (critical)** |

## Measurements
- Console: no page errors; a THREE shader error (MeshToonMaterial iridescence) + 176–308 "useProgram: program not
  valid" warnings on the mission screen with a non-blob creature.
- Network: 0 failed requests, 0 non-2xx.
- 3D first render: canvas mount 0.41–0.62 s on the production build (2.6–6.7 s on the dev server); emoji fallback
  while loading.
- Offline latency: turn 38–177 ms, quiz 253–513 ms, draft 62–497 ms.

## Defects
| ID | Sev | Owner | Defect | Fix |
|---|---|---|---|---|
| D-1 | Critical | frontend | `App.jsx:16` `useEffect(() => window.scrollTo(0, 0), [pathname])`: Chrome ≥154 returns a Promise → "destroy is not a function" → error boundary on first navigation | `useEffect(() => { window.scrollTo(0, 0) }, [pathname])` |
| D-2 | Major | frontend | ≥1024px: full `.mcard` in the left column pushes the boss panel below the fold; no HUD; arena cuts Pip off | `.mcard--compact` at ≥1024 or show the HUD |
| D-3 | Major | 3d | `three/index.jsx:127` toon on `look === 'doodle'` even with a valid creature → creatures render flat in the arena; iridescence props fail on the toon material | `toon = !CREATURES.includes(creature) && look === 'doodle'`; strip `iridescence*` in the toon branch |
| D-4 | Minor | frontend | Home shows "Brain v2" after reset (counts the saved session) | Compute from non-saved sessions |
| D-5 | Minor | frontend | `a.brand` 65×32, back link 84×36 | Min 44px |
| D-6 | Minor | frontend | Weapon toast covers heal caption; typing taunt covers her bubble | Reposition |
| D-7 | Minor | frontend | 390 exam view: arena under the whole exam; Brain cloud puffs point at nothing | ~140px Pip beside the cloud |
| D-8 | Cosmetic | frontend/backend | "1 minutes teaching" | Singular |
| D-9 | Cosmetic | 3d | Room diorama is an opaque box clipped by canvas edges | Pull camera back / fade edges |

## Design critique
- Strong: glossy blob and cat with glasses read as premium, deadpan, not babyish; Brain notes are the money shot;
  the quiz miss reads as Pip's failure; the K.O. card is quiet; Studio screens are calm; the gap report convinces.
- Weak: D-2 hides the fight on laptops; D-3 makes the fight figure look cheaper; the 3D boss (pink TV-head robot)
  lacks villain energy; the K.O. "wobbling" frame floats huge flat emoji over the arena; at 390 the K.O. card
  pushes the cliffhanger below the fold; the landing page has no 3D stage.

## Not verified
Live AI and latency vs. the < 4 s target; MongoDB; the Emergent URL; Stripe test Checkout; Twilio; Safari/iOS
and real phone GPUs; reduced motion; the garden env; tap reactions; AA contrast; anything past the first
navigation on Chrome ≥154.
