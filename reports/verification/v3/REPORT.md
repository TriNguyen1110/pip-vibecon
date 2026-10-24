# V3 verification (journey + screens): PASS with corrections

Written by the verifier; saved by the coordinator. Revision `b6cc31a` (app code = `a9c61c4`), re-run on `4953052`.
Local clone, ElevenLabs live, AI offline, memory store, installed Chrome 156.

| # | Check | Result |
|---|---|---|
| 1 | DEMO_SCRIPT at 390×844 and 1280×800 (phone frame), day + night, + 375×667 | PASS: 0 failing steps; 0 console errors, failed requests, non-2xx, taps < 44px |
| 2 | No page scroll (17 student screens/sheets; 390×844 day, 375×667 day + night) | PASS |
| 3 | 2D mascots (6 × 3 vibes; moods through the journey; Boss2D smug → cracked → KO) | PASS |
| 4 | Voice: live ElevenLabs 10/10, mouth sync, mute, bad-key + blocked fallback | PASS |
| 5 | Phone frame + PWA (manifest 200, standalone, 4 icons) | PASS |
| 6 | At-risk, lesson editing, stuck, SAT Writing + Math, parking, spoiler guard | PASS |
| 7 | Game feel | ~70% of a polished Y2K mobile game; scene backgrounds never render (biggest fix) |
| 8 | Contrast | FAIL one pair: night "her" bubble 1.7:1; other spot checks pass |

Corrections filed (`doing`): F4 transparent `.shell--bare` so the scene shows; D-11 night bubble contrast; D-12 one
line-clamp on an inner span; D-13 weapon tray crops the equipped glow/label; D-14 neutral student-facing step names
and re-teach copy (no answer leaks in the UI); D-15 retired "Mamma mia" taunt; D-16 show parked out-of-scope
questions in the gap report; D-17 Ms. Rivera's at-risk card empty after reset; D-18 overlaps (damage sticker over HP,
boss sign behind Pip, caption over Pip at 1280, K.O. stamp over Pip's face, KO boss off-screen); D-19 confused
sprout reads like a "?" (owner call); D-20 picker sheet uses Studio styles on a Play screen.

Not verified: live Claude AI, Mongo, Emergent URL, Safari/iOS, real phones, the 3D path, P2D-5 depth mode, voice-cast
specifics (F9/B10/B11/F9b), reduced motion, orientation. Evidence: reports/verification/v3/ (PNGs git-ignored).
