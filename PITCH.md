# Pip — pitch, video and submission (v5: owner-first, Main Street today, on the path to YC's Primer)

**Pitch-first:** the build follows this pitch, and every gate ends with a recorded rough cut (HACKATHON.md).
Every on-screen moment maps to a BOARD item and a PRODUCT_SPEC check. Only claim a feature when a verifier
`done` row exists. Only use numbers from RESEARCH.md marked ✅ (🟡 only if opened and labeled; never ❌).

Earlier panel scores: v1 61, v2 73.5, v3 78/100; honest ceiling ~84 with a flawless take and no customer quote,
~90 with one real owner/tutor quote. **This v5 changes the story, not the product** (see "What changed in v5").
The real quote is still the biggest lever (see "Get a quote").

## Arc

**Owner pain** (families quit when they can't see progress; tutors re-diagnose every session) → **the gap**
(between sessions kids ask ChatGPT, and it makes them worse) → **the flip** (Pip plays the student; the child
does the teaching) → **what the tutor gets** (evidence in the kid's own words, where to start Tuesday) →
**what the owner gets** (parent update, at-risk families, shared mistakes across the center) → **who pays** →
**close** ("Built for Main Street today, on the path to YC's Primer").

The game is how the evidence gets collected. The product is what the tutor and owner get. The 3D Pip and boss
fight are about 15–20 seconds of wow inside the video; they are not the opening.

**Lines to remember**
- "Every AI tutor plays the teacher. Pip plays the student."
- "The AI is wrong on purpose, the student fixes it, and the tutor gets evidence in the kid's own words."
- "Built for Main Street today, on the path to YC's Primer."
- Student-facing copy only (not in the video): "an AI that believes exactly what you tell it".

## Originality claim (say it the same way every time)

1. **The AI is wrong on purpose.** It believes a real misconception, the student must change its mind with a
   *why*, and its quiz answers come only from what the student taught (Pip's Brain).
2. **The output is evidence, not a score:** a gap report quoting the kid's own words, tagged "fixed after 1 re-teach".
3. **Teach your past self.** Last week's unfixed mistake becomes Pip's belief this week ("someone told me…"),
   never blamed on the kid. *(Claim only after B7's `opening_source: past_self` is verified.)*

## The YC "Primer" framing (use verbatim, attribute)

YC Request for Startups, Fall 2026, "The Primer" (Andrew Miklas): *"The best education has always come from
one-on-one tutoring."* and *"Not a replacement for teachers, but a supplement that makes them more effective."*

- **Why tutoring centers are the wedge:** parents already pay them; the center holds the trust; every session
  produces evidence.
- **Our twist:** the child does the teaching.
- **Don't overclaim:** today Pip covers grades 5–9 math and SAT (math + writing). Young-child reading is **not
  built**. Say "on the path to", never "we are".

## SAT = reading, writing and math proof

The same mechanic runs three subjects (and adapts its questions to the kind of knowledge: reason, convention or procedure). *Live final only, not the 2-minute video.*
- **SAT Writing (commas and run-ons):** Pip literally comma-splices. "Your rule: comma at every pause.
  *'I went home, I ate, then I, slept.'* I paused a lot." The student must teach the real rule.
- **SAT Math:** e.g. "(a + b)² = a² + b²" (tutor assigns it live).
- **Triangle area (CCSS 6.G.A.1)** is the video's demo: a grade 6 topic with a clean "why" (two copies make a rectangle). Fractions (`a_frac`) stays as a secondary mission and as the "hard middle grades" research context (Siegler 2012).
- Lesson content is aligned to Common Core / SAT domains and built from open-licensed material where used (each
  lesson carries a source and attribution field). Tutors can edit the question ladder and look-fors.

## Where each sponsor / judge does real work on screen

| Sponsor / judge | On-screen moment | Line |
|---|---|---|
| Claude (Anthropic) | Pip stays in character, refuses the trick, believes the wrong rule; Claude grades explanations on a 0–3 rubric and drafts the mission. Live model is Claude (Opus 5.5 default); say "live" only when `/api/health` shows `ai: live` | "Claude plays Pip, and grades what the kid teaches." |
| Emergent (host) | Live Emergent URL visible the whole video; integrations; persisted data. Built with Claude Code and agents on GitHub, shipped and demoed on Emergent (allowed by the rules) | "Built on Emergent, powered by Claude." |
| YC (Dessaigne) | Owner first: buyer, retention money, at-risk list, ROI, first 100, why now; Primer quotes and framing | "Built for Main Street today, on the path to YC's Primer." |
| Stripe | 2 s in-app "Start pilot" → test-mode success | (shown, not said) |
| MongoDB (Hero sponsor, if announced) | Pip's Brain is a visible document; center-wide insight from sessions. Say "MongoDB" only when `/api/health` shows `store: mongo` | "Pip's Brain is a MongoDB document." |
| AWS | Not forced; mention only if Emergent hosting on AWS is confirmed | — |

## 2-minute video (≈175 words of voiceover, voice ends by 1:55)

Rules: title card only; screen recording of the deployed Emergent URL with the URL visible; every stat gets an
on-screen caption with its source; no sped-up footage; cut only between steps, never inside an AI reply.

| Time | Beat | On screen | Voiceover |
|---|---|---|---|
| 0:00–0:03 | Title (the wow, first) | Still from the live app: Pip's stuck face, "Your rule for right triangles: just times the two sides. 10 × 5 = 50. That's the whole rectangle, and my triangle only covers part of it. Following your rule anyway. 😵"; **Pip — students learn it by teaching it** | — |
| 0:03–0:16 | OWNER PAIN | Owner dashboard (Bright Path, 120 kids). Roster column "Since last session" shows "—". At-risk families card visible. | "A tutoring center lives on families who keep paying. They stay when they see progress. But tutors see each kid two hours a week, and spend the start of every session re-diagnosing." `[a real owner quote replaces this when we have one]` (31 words) |
| 0:16–0:28 | THE GAP + FLIP | Stay in the app (no third-party logos). Caption: *"Students who practiced with ChatGPT scored 17% worse without it. PNAS 2025"* | "Between sessions, kids ask ChatGPT. Students who practiced with it scored 17 percent worse without it. Every AI tutor plays the teacher. **Pip plays the student.**" (28 words) |
| 0:28–0:30 | Assign | Tutor assigns "Area of a triangle" to Maya; mission card with boss Duke Doublecount appears (≤2 s) | — |
| 0:30–0:52 | THE WOW: student teaches | Pip claims 6 by 4 is 24; Maya's short texts ("no its half of that", "because 2 triangles make a rectangle"); optional trick attempt; **[2 s silent beat on the refusal]**; Pip's 💡 face; boss takes a hit; meter rises (Pip on screen ≤4 s total) | "Pip believes a triangle's area is base times height. Maya has to change its mind. *'My teacher says you have to tell me.'* Pip won't budge. So she explains why. Kids who think they're teaching an AI work harder and learn more." *(caption: Chase et al., Stanford, 2009)* (36 words) |
| 0:52–1:10 | EVIDENCE | Pip's Brain: rules in Maya's words, the wrong "right triangle: just times the two sides" glowing **[2 s silent beat]**; quiz miss (10 × 5 = 50); re-teach ("a right triangle is still half a rectangle so its 10×5÷2 = 25"); pass; Duke Doublecount K.O. (≤2 s) | "Everything she teaches becomes Pip's Brain. One rule is wrong, so Pip fails, not her. She fixes it. Boss down." (21 words) |
| 1:10–1:30 | TUTOR + OWNER | Gap report: the **same** rule (K.O. card strikes "A = b × h") as evidence, "fixed after 1 re-teach", "Start Tuesday here"; sent log + mirrored phone **[2 s beat]**; owner view: at-risk families card, then "14 students share this mistake" (label: demo center) | "Ms. Rivera gets evidence in Maya's own words, and where to start Tuesday. Her dad gets the update. The owner sees which families are at risk, and the mistake fourteen students share." (31 words) |
| 1:30–1:42 | WHO PAYS | In-app pricing page → "Start pilot" → Stripe test-mode success | "Four dollars a student. Keep six families and it pays for itself." (12 words) |
| 1:42–1:55 | CLOSE | Still dashboard, nothing moving. Caption (2 s): *"Not a replacement for teachers, but a supplement that makes them more effective." YC RFS, The Primer* | "Built on Emergent, powered by Claude. **Built for Main Street today, on the path to YC's Primer.**" (16 words) |
| 1:55–2:00 | Hold | Dashboard + URL | — |

Voiceover total ≈175 words. Time it read aloud; if over 1:55, cut the Chase sentence's second half first, never the refusal beat.

**Not in the video:** SAT Writing, the past-self opening, hold-to-talk, the garden/pet play styles. They are the live final.

### Recording rules (honesty is part of the score)

- Record the **deployed** Emergent URL, warmed up (`POST /api/demo/warm`, `/api/health` says `ai: live`) so Pip replies
  fast. Two takes minimum where re-teach → pass works with no cuts; keep the best under 1:58.
- **Browser gate:** record on a Chrome that passes the verifier's journey (V1 found a crash on Chrome ≥154 until D-1
  was fixed; re-verify the deployed build on the recording browser first).
- If the video uses the offline scripted demo, label it "offline demo". Saved sessions are labeled "saved session".
- Phone message: mirror the phone screen or show the in-app sent log; don't film a phone with a camera.
- Pricing is an in-app page. Paste Maya's messages (DEMO_SCRIPT.md); don't type live.
- Do not say "solo" or "24 hours" unless true for the submitted team. Do not say "MongoDB" unless `store: mongo`.
- Check the Drive link in a private window before submitting.

## Get a quote (still the biggest lever; keep this prominent)

We have **no real owner/tutor quote yet.** The video's owner-pain line is a placeholder: it states the product
premise, not a data claim (no churn benchmark exists; RESEARCH.md marks it ❌). One real voice moves Research
and Value most. Tonight: text 3–5 tutors or center owners. Saturday: ask attendees who have tutored ("I'm
building for tutoring centers; 30 seconds?"). Label honestly ("former tutor", "center owner, San Jose"). Log
exact words in `research/interviews.md`. Best questions: "Why do families stop coming?", "How many minutes of
each session go to figuring out where the student is?", "What do your students do with ChatGPT?". A real quote
replaces the 0:03–0:16 voiceover (keep it ≤ 13 seconds) and goes first in the submission.

## Final round (Top 10): 5-minute live demo + 2-minute Q&A

| Time | Beat | Notes |
|---|---|---|
| 0:00–0:30 | **Owner hook.** "A tutoring center lives on families who keep paying, and they stay when they see progress. Tutors see a kid two hours a week and start every session re-diagnosing." Then one stat: "28% of US eighth graders are proficient in math *(NAEP 2024)*; kids who practiced with ChatGPT scored 17% worse without it *(PNAS 2025)*." Close: "Every AI tutor plays the teacher. Pip plays the student." | Real quote here if we have one |
| 0:30–0:50 | Owner dashboard: "Since last session" column, **at-risk families** card (stuck after the full ladder, not back on their own, no parent update in 14 days), center insight. "Retention is the money." | Label demo center |
| 0:50–2:15 | **Live: area of a triangle (`a_tri`).** Tutor assigns → Maya teaches Pip in 2–4 one-sentence texts (prepared messages from DEMO_SCRIPT.md, then **invite a judge to suggest a wrong explanation**; it lands in Pip's Brain and Pip follows it and fails) → re-teach → pass → K.O. (≤5 s). If past-self is verified: show Pip opening a second session with last week's unfixed rule ("someone told me…") | Safety net: saved Maya session one click away; say it's saved |
| 2:15–3:05 | **Live: SAT Writing.** Open the seeded commas/run-ons mission. Pip comma-splices: "Your rule: comma at every pause. 'I went home, I ate, then I, slept.' I paused a lot." Student teaches the real rule (a comma can't join two complete sentences); Pip's Brain updates. "Same mechanic: reading, writing, math." | Seeded and offline-capable (`a_sat_commas`) |
| 3:05–3:35 | Tutor and parent: gap report (same quote as evidence, "Start Tuesday here"), one-tap parent update, sent log | |
| 3:35–4:20 | **Business + Primer.** $4/student/month, $99 minimum; keep six families and a 120-student center pays for it. 176,000 US tutoring & driving-school businesses, none over 5% share *(IBISWorld 2025)*; first 100 via owner communities, NTA and center-software partners; free 30-day pilot for a case study. Stripe "Start pilot". Then: "YC's Primer says the best education is one-on-one tutoring, as a supplement that makes teachers more effective. Centers are the wedge: parents already pay, the center holds the trust, every session produces evidence. Our twist is the child does the teaching." | |
| 4:20–5:00 | Close: "Built on Emergent with Claude. Built for Main Street today, on the path to YC's Primer." Leave the dashboard on screen for Q&A. | |

## Likely judge questions (tight answers)

1. **"Isn't this Khanmigo / ChatGPT Study Mode?"** Those play the teacher and sell to families and schools. Pip
   plays the student, and the product is the output: evidence in the kid's own words, a gap report, a parent
   update and an at-risk list for the center. No other player on our list turns a role flip into a tutor workflow.
2. **"How does this become YC's Primer?"** The Primer's premise is one-on-one tutoring, as a supplement that makes
   teachers more effective. Centers are the wedge: parents already pay, the center holds trust, each session makes
   evidence. Today it's grades 5–9 math and SAT; younger and reading are the path, not built. The twist: the child
   does the teaching.
3. **"Why sell to centers instead of parents?"** Parents churn on their own and only see a score. Centers already
   take the monthly payment, hold the relationship, and need two things we make: proof of progress and a way to
   spot families about to leave. One sale reaches 50–300 students.
4. **"What stops a kid from trolling?"** Pip believes what it's told, so a troll teaches Pip something wrong and
   Pip fails its own quiz. That failure is a signal to the tutor, and Pip never lectures or tattles. Off-topic
   input gets in-character parking ("Not in my brain yet") and is noted for the tutor.
5. **"Is the AI grading accurate?"** Grading is a 4-level rubric (none, procedure only, reason tied to meaning,
   reason applied to a new case), constrained by a lesson spec with look-fors. Questions come only from the
   tutor-editable ladder, and a server guard replaces any reply that leaks an answer. Gap-report quotes are
   exact matches from the transcript, so the tutor reads the kid's words, not our verdict. Say honestly: we
   have tested it on seeded and scripted sessions, not yet on a large set of real students.
6. **"What's your evidence centers will pay?"** Honest answer: we have no signed customer yet. What we have: the
   price sits in Oases' range ($99/mo for 25 students) and Khanmigo's $4; ROI needs six retained families (parent
   spend of about $357/month is a 🟡 EdChoice figure, say "reported" only after opening it); and a free-pilot plan.
   *(Add any real owner quote or interest here.)*
7. **"Why would a teen use this?"** The AI is the one who's wrong, so there's no red mark on them. It takes
   everything literally and talks like a confused friend. The boss only takes damage from real explanations, and
   researchers suggest teaching an agent gives an "ego-protective buffer" (Chase 2009, proposed, not measured).
   We track whether kids come back on their own.
8. **"Teachable agents exist (Betty's Brain)."** Yes, and the research behind them is why this works. Betty's Brain
   is a research tool with hand-built concept maps. Pip is an LLM classmate that learns from free conversation, sold
   to small businesses.
9. **"What is 'teach your past self'?"** Last week's unfixed mistake becomes Pip's belief this week ("someone told
   me…"). The kid fixes their own old error without being blamed. *(Only if verified.)*
10. **"Is the lesson content any good / where does it come from?"** Aligned to Common Core and SAT domains, from
    open-licensed material where used, with source and attribution on each lesson. Tutors edit the question ladder.
11. **"Only math?"** Math and SAT today, including SAT Writing (commas and run-ons) in the demo. Anything with a
    well-known misconception works; reading comprehension for younger kids is the path, not built. We don't build
    simulations; the student does the explaining.
12. **"Minors' data?"** The demo is fully synthetic. In production: data owned by the center, no training on student
    data, consent through the center, COPPA/FERPA review before launch.
13. **"Who else competes / how does it fit with Oases and TutorBird?"** They run scheduling and billing and have no
    learning diagnostics. We're the learning layer and a partner channel.
14. **"First 10 customers?"** Independent centers through owner communities, NTA and software partners; free 30-day
    pilots for case studies. *(Plus any real interest collected.)*
15. **"What did you build on Emergent vs. elsewhere?"** Code was written with Claude Code and agents on GitHub, and
    the live product ships and demos on Emergent, which the rules allow. Say what's true about the store and AI mode
    (`/api/health`), and call the saved Maya run a saved session.
16. **"Why triangle area, and does it work on everything?"** Pip works where there is an explainable why. Triangle
    area is the cleanest: a kid can say "two copies make a rectangle, so one is half" in a sentence. For things
    that are conventions (like comma rules) Pip asks *when it applies*, not why; for procedures it asks the kid to
    walk an example or corrects Pip's wrong prediction. Each concept in a lesson is tagged reason, convention or
    procedure, and Pip's question style follows it. We say plainly that pure memorization topics are out of scope.
17. **"What's next?"** Pilot centers, more lessons, "Pip forgets" spaced review (roadmap), center-software
    integrations, then younger students on the path to the Primer.

## Submission form copy

- **Team name:** Pip · **Track:** Education & training
- **Customer in one sentence:** Independent tutoring centers see each student one or two hours a week, so owners
  struggle to show families progress (and to spot families about to leave) and tutors start every session
  re-diagnosing what didn't stick.
- **What we built (two sentences):** Pip flips AI tutoring: students teach Pip, an AI classmate that is wrong on
  purpose, refuses to give answers, and passes its quiz only from the rules the student taught it (Pip's Brain).
  Tutors get evidence in the student's own words and where to start next session, parents get a center-branded
  update, and owners see at-risk families and the mistakes shared across the center.
- **Built on Emergent with:** Claude (Opus 5.5 default) for Pip, grading and mission drafting; persisted sessions and
  Pip's Brain; Twilio/SendGrid parent updates (test mode); Stripe test mode for the pilot plan. Built with Claude Code
  and agents on GitHub, shipped on Emergent. Emergent job ID: *(from BOARD fact)*. *(Name MongoDB only if verified.)*
- **Vision line:** Built for Main Street today, on the path to YC's Primer ("The best education has always come from
  one-on-one tutoring"; "Not a replacement for teachers, but a supplement that makes them more effective." YC RFS,
  Fall 2026). We're grades 5–9 math and SAT now, not young-child reading.
- **Market and go-to-market:** 176,000 US tutoring & driving-school businesses, $18.9B, no player over 5% share
  (IBISWorld 2025). First 100 via owner communities, the National Tutoring Association, and center-software partners
  (Oases, TutorBird, Teachworks); free 30-day pilot for a case study. $4/active student/month, $99 minimum
  (hypothesis).
- **Problem, with sources:** Only 28% of US 8th graders are proficient in math and 39% are below Basic (NAEP 2024).
  Fraction knowledge in 5th grade predicts high-school algebra (Siegler et al., *Psychological Science* 2012). 54%
  of US teens have used chatbots for schoolwork (Pew 2026), and students who practiced with ChatGPT scored 17%
  lower once it was removed (Bastani et al., *PNAS* 2025). Students who believe they're teaching a computer agent
  work harder and learn more (Chase et al. 2009).
- **Research and data with sources:** the "Pitch-grade data points" table from RESEARCH.md (✅ rows), plus interview
  quotes once collected.
- **Live URL / test login / Drive link:** from BOARD facts.

## What changed in v5

- Opens on the owner's business pain (retention, re-diagnosis), not the mascot; the boss fight and 3D Pip are a
  ~20 s wow in the middle.
- Added the YC Primer framing ("Built for Main Street today, on the path to YC's Primer") with verbatim quotes,
  the centers-as-wedge argument and a no-overclaim rule.
- Originality sharpened to "AI wrong on purpose, student fixes it, tutor gets evidence in the kid's words" plus
  "teach your past self".
- SAT Writing (comma splice) and SAT Math added as live-final proof that the mechanic spans reading, writing, math.
- At-risk families list added to the owner beat in the video and live demo.
- Main demo moved from fractions to Area of a triangle (boss Duke Doublecount, K.O. strikes "A = b × h"); fractions kept as research context and a secondary mission.
- Dropped the solo/24-hour and "MongoDB document" claims from the video unless verified; Q&A grew to 17 answers.
