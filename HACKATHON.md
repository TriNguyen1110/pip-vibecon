# VibeCon SF 2026 — Pip build plan

**Event:** VibeCon SF 2026 (Emergent × Y Combinator), Sat Oct 24 – Sun Oct 25,
San Francisco (YC). Venue WiFi: `Y Combinator` / `makesomething`.
**Team:** solo, Tri is team lead. **Track:** Education & training.
**Product:** Pip — see `PRODUCT_SPEC.md`.
**Hard deadline:** submission + build freeze **Sun 12:00 PM**. Late = not judged.

## Compliance checklist (breaking one can remove us from judging)

- [ ] Signed up for Emergent with the **same email used on the YC application**.
- [ ] Zero application code exists before Sat 9:30 AM kickoff. This kit holds
      research, sketches and plain-English prompts only.
- [ ] Final product ships and demos on Emergent, at a public Emergent URL (code may be
      written anywhere, e.g. our GitHub repo, and pulled into the Emergent project).
- [ ] Synthetic data only for students, parents and tutors; any payments in test mode.
- [ ] Research sources cited in the submission.
- [ ] Video ≤ 2:00, screen recording of the live app + voiceover, title card only,
      on Google Drive with "anyone with the link can view".
- [ ] Badge and wristband on. Leaving after midnight = no re-entry until 6:00 AM.

## Schedule mapped to the event

| Event block | Our work | Gate / exit condition |
|---|---|---|
| Fri night (today) | Text 3–5 tutors/owners for a quote; confirm Kumon price; spec, prompts | Items 01–03, 18 attempted |
| Sat 8:00–9:30 check-in | Re-read spec; open Emergent; Drive folder ready | Account + credits confirmed |
| Sat 9:30–10:30 kickoff | Listen for rule changes, **sponsor side prizes**, judge names; update TEAM_BRIEF | Item 21: sponsor-prize decision logged as a BOARD fact |
| Sat 10:30–1:00 Sprint 1 | Items 04–05 | **Gate 1 (1:00):** deployed URL with tutor assigning a Pip mission that persists |
| Sat 1:00–1:20 | **Rough cut 1 (item 23):** record the 0:03–0:29 opener on the deployed URL; time it | Opener fits 26s |
| Sat 1:20–2:30 lunch + fireside | Talk to Emergent and MongoDB staff about the best features to show; eat | — |
| Sat 2:30–6:00 Sprint 2 | Items 06–07 | **Gate 2 (6:00):** student teaches Pip → Pip's Brain → quiz, end to end |
| Sat 6:00–7:00 dinner | **Rough cut 2 (item 24):** record the Pip beats (0:29–1:11); fix the script to match reality | Pip beats fit 42s |
| Sat 7:00–1:00 Sprint 3 | Items 08, 09, 17, 10, 12 | **Gate 3 (11:00 PM):** gap report with the same Brain quotes + center insight. Nothing else starts until these work |
| Sat 11:30 PM–12:15 AM | **Full rough cut (item 25):** record the whole 2:00 once, even with rough edges. Watch it as a judge would | A complete video exists. Anything that looks dull gets polish time, not new features |
| Sat ~1:30 AM | Sleep. A rested demo beats one more feature | Script v1 locked |
| Sun 9:00–10:00 | Item 11: full verification, fix only demo-path bugs | **Feature freeze 10:00** |
| Sun 10:15–11:15 | Item 13: record, two takes | Best take chosen |
| Sun 11:15–11:40 | Item 14: upload, test link in private window, submit | **Submitted by 11:40** (20-min buffer) |
| Sun 1:00–3:30 | Item 15: final-demo prep while pods judge | — |
| Sun 3:30 | Top 10 announced | If in: rehearse 5-min demo twice |
| Sun 5:00–6:10 | Live final: 5-min demo + 2-min Q&A | — |

## Pitch-first rule

The video is the spec. Each gate ends with a recorded rough cut of the beats it unlocked,
so there is always a submittable video. Rough cuts take ~20 minutes each. If a beat looks
weak on camera, fix the screen (polish, design) before building anything new.

## Prepared before kickoff (allowed: ideas, research, data, sketches, design assets; no code)

- `data/seed_center.json`, `data/seed_sessions.json`: synthetic center, 120 students, 30
  sessions (14 hold the misconception), Maya's labeled saved session. Give these to Emergent
  in P1 instead of having it generate data.
- `DESIGN.md`: palette, type, Pip looks and moods, the three wow screens, landing page.
- `DEMO_SCRIPT.md`: Maya's exact messages to paste while recording.

## Cut order if behind (cut from the top)

1. Photo upload (stretch 16)
2. Hold-to-talk (item 20; never in the video anyway)
3. Pip's look picker and brain versions → one fixed Pip with mood faces (keep the literal personality; it's prompt text)
4. Boss weapons and finishing move → boss card with HP bar and captions only (keep the boss; it's the Boss step)
5. Stripe checkout → in-app pricing page only (drop the "Start pilot" shot)
6. Real parent SMS → preview + sent log (say "preview" in the voiceover)
7. "Plan a workshop" button → insight card only
8. Never cut: "Since last session" column → assign → **mission card** → teach Pip → **Pip's Brain** → quiz
   from the Brain → gap report with the same quotes → center insight. Those are the video.

## Credit budget (2,000 credits + one 1,000 refill at the credit desk)

Rough planning numbers, not Emergent's published costs; update `fact credits-left`
after each item and re-plan if a phase overruns by more than 50%.

| Phase | Items | Budget |
|---|---|---|
| Foundation + seed + assign | 04–05 | 400 |
| Pip teaching loop | 06 | 400 |
| Pip's Brain + quiz | 07 | 350 |
| Gap report | 08 | 250 |
| Parent SMS + center insight | 09 | 200 |
| Stripe pilot | 17 | 100 |
| Pip looks/moods/brain versions + mission card + boss fight | in 05–07 | ~150 (HP bar, shake and captions only) |
| Polish + fixes | 10–11 | 300 |
| Reserve | — | Refill (1,000) |

Credit savers: one feature per prompt; describe exact behavior and test steps;
say "do not change anything else"; test in preview before asking for more; never
ask for a full redesign late.

## If something breaks

- Timebox any single bug to 20 minutes, then simplify the feature.
- If the LLM call is slow or flaky on stage: keep a seeded completed session for
  Maya so the gap report and quiz can be shown instantly, labeled as a saved
  session. Never fake a live run.
- Keep the deployed URL stable after Sunday 10:00. No deploys after recording
  unless it fixes a demo-path break.
