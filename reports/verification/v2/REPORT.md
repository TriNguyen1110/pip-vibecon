# V1 re-verification (v2): PASS

Written by the verifier; saved by the coordinator.

- Revision: `29417ea` (fresh clone; frontend/backend identical to `e7e608f`). Backend :8741 offline, in-memory.
  Frontend dev :5741 and production build via `vite preview` :5742.
- Browsers: installed Chrome 156.0.8078.48 and Chrome for Testing 149.0.7827.55, at 390×844 and 1280×800.
- Scripts: `tests/e2e/demo.spec.mjs`, `tests/e2e/scrollto-crash.mjs`, `tests/e2e/creatures.mjs`.

| Check | Chrome 156 prod | Chrome 156 dev | Chrome 149 prod | Chrome 149 dev |
|---|---|---|---|---|
| Journey, 390 | 25/25 | 25/25 | 25/25* | 25/25 |
| Journey, 1280 | 25/25 | 25/25 | 25/25 | 25/25 |
| No crash after navigation | yes (scrollTo returns a Promise) | yes | yes | yes |
| Console errors, failed requests, non-2xx | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| Shader or WebGL warnings | 0 | 0 | 0 | 0 |
| Overflow at 390; tap targets under 44px | none; none | none; none | none; none | none; none |
| Laptop fight: HP bar and arena in view | 100% / 100% | 100% / 100% | 100% / 100% | 100% / 100% |

\* After the test's note-jump check changed from a fixed 900 ms wait to polling up to 2 s (smooth scroll settles at ~0.9 s).

Creatures (all six, with glasses, in the arena): 0 shader/WebGL messages in both browsers at both widths.
Defects D-1 to D-9 from round 1: all fixed.

Remaining cosmetics (not blocking): the K.O. stamp covers Pip's face; the "Brain v1" sticker overlaps the 3D boss
HP bar; the boss's emoji face texture is a little muddy; at 390 the home island's base is clipped by the canvas.

Notes: blank band in some screenshots is a mid-scroll capture (layout keeps the top bar at 0). The journey's 6–8 s
quiz time at 390 didn't reproduce directly (response 192 ms, render 246 ms). Headless canvas mount after
"Try as Maya": 2.8–3.3 s production, up to 6.1 s at 390 in Chrome 149; emoji fallback meanwhile.

Not verified: live AI and latency, Mongo, the Emergent URL, Stripe test Checkout, Twilio, Safari/iOS, real GPUs,
reduced motion, garden env, tap reactions, contrast; builders' uncommitted edits after 29417ea.
