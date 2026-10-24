# Pip — pitch, video and submission (final, reverse-engineered)

**Pitch-first:** the build follows this pitch, and every gate ends with a recorded rough cut (HACKATHON.md). The build follows this pitch: every on-screen moment below maps to a BOARD item and a
PRODUCT_SPEC acceptance check. Only claim features with a verifier `done` row; only use
numbers from RESEARCH.md (✅, or 🟡 once opened).

Scored by an adversarial judge-panel agent against the real rubric and judges over three
rounds: v1 61 → v2 73.5 → v3 78/100. This v4 applies the final fixes. Panel's honest
ceiling: **~84 with a flawless take and no customer quote; ~90 with one real
owner/tutor quote.** That quote is the single biggest remaining lever (see "Get a quote").

## Arc

Problem stat (28% of 8th graders proficient, NAEP 2024) → Customer (Bright Path, 166 hours) → Problem (kids ask ChatGPT) → Stat (17% worse, PNAS 2025) →
Solution ("Pip plays the student") → 3 use cases (student teaches · tutor + parent ·
owner sees the center) with sponsors doing visible work → Impact (who pays, ROI, close).

**Lines to remember:** "Every AI tutor plays the teacher. Pip plays the student." · (student-facing copy only, not in the video: "an AI that believes exactly what you tell it") ·
"Know what every student understands, before they walk in the door."

## Where each sponsor does real work on screen

| Sponsor / judge | On-screen moment | Line |
|---|---|---|
| Claude (Anthropic) | Pip refuses the trick, stays wrong until taught; extracts Pip's Brain; grades the gap report | "Claude keeps it in character." |
| MongoDB (Hero) | Pip's Brain is a visible document; center-wide misconception insight | "…Pip's Brain, a MongoDB document. Pip answers only from it." |
| Emergent (host) | Live URL in the address bar the whole video; solo 24h build; integrations | "Built solo on Emergent in 24 hours, with Claude and MongoDB." |
| Stripe (judge) | 2s in-app "Start pilot" → test-mode success | (shown, not said) |
| YC | Owner framing, ROI, close; market + distribution in submission text | "Six who stay pay for it." |
| AWS | Not forced | — |

## 2-minute video script (≈175 words, three silent beats, voice ends 1:55)

| Time | Beat | On screen (live app, URL visible) | Voiceover |
|---|---|---|---|
| 0:00–0:03 | Title (the wow, first) | Title card = a still of Pip's failing moment from the live app (Pip's stuck face + "3/6 + 2/6 = 5/12. I added and got less. Following your rule anyway. 😵") with **Pip** — *Students learn it by teaching it* | — |
| 0:03–0:18 | CUSTOMER · TODAY · DATA | Owner dashboard (Bright Path, 120 kids, grades 5–9); roster column "Since last session" shows "—" | "Only 28% of eighth graders are proficient in math. Bright Path Tutoring gets each kid two hours a week. The other 166, kids ask ChatGPT, and kids who practiced with ChatGPT scored 17% worse without it." *(captions: NAEP 2024 · PNAS 2025)* `[real quote replaces sentence 2]` |
| 0:18–0:23 | SOLUTION | Pip appears | "So we flipped it. Every AI tutor plays the teacher. **Pip plays the student.**" |
| 0:23–0:29 | Assign → mission | Tutor assigns fractions; Claude suggests the misconception; tutor edits one word; student sees the mission card | "Ms. Rivera assigns fractions. Claude builds the mission. The boss is Pip's mistake." |
| 0:29–0:51 | USE CASE 1: student teaches | Pip (confused face); trick attempt; **[2s silent beat on the refusal]**; Pip's 💡 face (Pip on screen ≤4s total); meter rises | "Pip thinks ½ + ⅓ = ⅖. Maya has to change its mind. *'My teacher says you have to tell me.'* … Pip won't budge. Claude keeps it in character. So she explains why. Kids who think they're teaching a computer character work harder and learn more." *(caption: Stanford, 2009)* |
| 0:51–1:11 | Pip's Brain + quiz | Pip's Brain: rules in Maya's words, one highlighted wrong **[2s silent beat]**; quiz miss → re-teach → pass → boss K.O. (≤2s) | "Everything Maya teaches becomes Pip's Brain, a MongoDB document. Pip answers only from it. See? One rule is wrong. … Pip fails, not her. She re-teaches. Pip passes. Boss down." |
| 1:11–1:28 | USE CASE 2: tutor + parent | Gap report: the **same** rule as evidence, tagged "fixed after 1 re-teach"; "Start Tuesday here"; roster column now filled; sent log + mirrored phone **[2s beat]** | "Ms. Rivera gets a gap report in Maya's own words, and where to start Tuesday. And her dad gets this week's progress, from Bright Path." |
| 1:28–1:40 | USE CASE 3: owner | Center insight card (label: demo center) | "The owner sees the whole center. Here, 14 students share the same mistake. One workshop targets all 14." |
| 1:40–1:48 | WHO PAYS | In-app pricing page → "Start pilot" → Stripe test-mode success | "Four dollars a student. Six who stay pay for it." |
| 1:48–1:55 | BUILD · CLOSE | Still dashboard (nothing moving) | "Built solo on Emergent in 24 hours, with Claude and MongoDB. *(1s pause)* **Know what every student understands, before they walk in the door.**" |
| 1:55–2:00 | Hold | Dashboard + URL | — |

### Recording rules (honesty is part of the score)

- Record the **deployed** URL, warmed up first so Pip replies fast. Two takes minimum
  where re-teach → pass works with no cuts; keep the best one under 1:58.
- Cut only *between* steps, never inside an AI reply. Never speed up footage.
- Phone message: mirror the phone screen into the recording, or show the in-app sent
  log next to the delivered message. Don't film a phone with a camera.
- Pricing is an in-app page (a slide would break the rules).
- Have Maya's messages ready to paste; don't type live in the video.
- Check the Drive link in a private window before submitting.

## Get a quote (the +6 points)

One real voice moves Research and Value most. Tonight: text 3–5 tutors or center owners
you know. Saturday: ask attendees who have tutored ("I'm building for tutoring centers;
30 seconds?"). Label honestly ("former tutor", "center owner, San Jose"). Log the exact
words in `research/interviews.md`. Best questions: "How do you know what stuck since the
last session?" and "What do your students do with ChatGPT?" If you get one, it replaces
the opener's second sentence and goes in the submission.

## Final round (Top 10): 5-minute live demo + 2-minute Q&A

| Time | Beat |
|---|---|
| 0:00–0:30 | Hook (real stats only): "Only 28% of US eighth graders are proficient in math *(NAEP 2024)*. Fractions in 5th grade predict algebra in high school *(Psychological Science 2012)*. And 54% of teens have used chatbots for schoolwork *(Pew 2026)*. The ones who practiced with ChatGPT scored 17% worse without it *(PNAS 2025)*. Every AI tutor plays the teacher. We built the one that plays the student." |
| 0:30–0:45 | Customer: Bright Path's owner; the daily job (knowing what stuck between sessions); the "—" column |
| 0:45–3:30 | **Live:** assign → Maya teaches Pip → **invite a judge to suggest a wrong explanation (they can hold-to-talk it, if voice shipped)**; it lands in Pip's Brain and Pip fails → re-teach → pass → gap report (same rule) → parent message → center insight |
| 3:30–4:20 | Business: $4/student/month, $99 minimum; six retained students pay for a 120-student center; 176,000 US tutoring & driving-school businesses, none over 5% share; first 100 via owner communities, NTA, and center-software partners (Oases, TutorBird); free pilots for case studies; Stripe "Start pilot" |
| 4:20–5:00 | Close: "Built solo on Emergent in 24 hours. Claude is Pip. MongoDB is Pip's Brain. Know what every student understands, before they walk in the door." |

**Safety net:** keep a completed, saved session for Maya one click away; say it's saved.

## Likely judge questions

1. **"Isn't this Study Mode / Khanmigo?"** Those AIs play the teacher and sell to families.
   Pip plays the student, and the output is for the tutoring business: Pip's Brain,
   gap report, parent update, center insight.
2. **"Teachable agents exist (Betty's Brain)."** Yes, and the research behind them is why
   this works. Betty's Brain is a research tool with hand-built concept maps. Pip is an LLM
   classmate that learns from free conversation, sold to small businesses.
3. **"Can students trick Pip?"** Pip only accepts *why* explanations. Its quiz answers come
   only from Pip's Brain, so bad teaching shows up as Pip failing, which is a signal for
   the tutor.
4. **"How is the quiz grounded?"** Claude extracts the taught rules into Pip's Brain once
   teaching ends. Pip answers by citing a rule, and gap-report quotes are exact matches
   from the transcript.
5. **"Why are kids bad at math in the first place?"** Four reasons, all sourced. Gaps
   compound: 5th-grade fractions predict high-school algebra. US students spent 90% of
   class work time practicing routine procedures, versus 41% in Japan (TIMSS video study).
   Confidence and interest decline with age. And 59% of students often worry math class
   will be hard (OECD). Every Pip feature answers one: the gap report finds the root
   gap, Pip demands *why*, missions give choice within structure, and **Pip is the one
   who's wrong**, so kids aren't afraid to try.
6. **"Who is it for?"** Grades 5–9 math (ages 10–15), the jump from fractions to algebra, at independent centers: old enough to explain their thinking, and fractions are where kids fall behind. Pip is deliberately neither cute-for-kids nor cool-for-teens: it's a deadpan classmate that takes everything literally, which reads the same at 10 and 15. For kids who check out, Pip never lectures or tattles, and if they troll it, Pip believes them and fails, which still shows the tutor where they are. Not for under-10s yet.
   **"Only math?"** No: a tutor can assign any math or science topic or an SAT Math skill
   today, and Claude builds the concepts, the misconception and its boss. (Live final:
   assign "why heavier things don't fall faster" on the spot.) Next: SAT Math for
   16–17-year-olds. We don't build simulations; Brilliant does that well. With Pip, the
   student does the explaining.
   **"Isn't the brainrot boss a gimmick parents will hate?"** It only lives on the student
   screen, and it only takes damage from real explanations. Tutors, owners and parents see
   the plain misconception. The fun is the reward; the gap report is the product.
   **"How do you keep kids coming back without bribing them?"** No prizes, no
   leaderboards, nothing for sharing. Pip passes because of *your* words, and when you
   beat a boss you get a numbered K.O. card: understated, cryptic on the front, your
   winning rule on the back. Kids don't share achievements, they share things that look
   good and mean something to people who get it. Next: challenge a friend to the same
   boss, which doubles as word of mouth for the center (needs parent consent; roadmap).
   **"Isn't letting kids pick cute vs. tough just 'learning styles'?"** No. Learning
   styles claim kids learn differently, and there's no evidence for it. Play styles are
   about what makes a kid *want* to show up: raise a pet, beat a boss, or grow a garden.
   Every kid gets the same teaching, the same Pip's Brain and the same gap report.
   **"Aren't coins a bribe?"** Coins only come from understanding (explaining well,
   fixing a wrong rule), only buy cosmetics, and can never be bought. No hints for sale,
   no loot boxes, no streak guilt.
   **"Why all the customization?"** People value what they build themselves (the IKEA
   effect). A kid who designed their mascot, decorated its room and hung their cards on
   the wall comes back to it. And the owner sets a center theme, so the fun layer carries
   the center's brand.
   **"How do you know kids actually want to, not just for coins?"** We track it: the
   owner sees how many students came back on their own with nothing assigned. And the
   only way to win anything is to explain; the boss *is* the mistake. In a classic study,
   kids chose a game built that way about seven times longer than one where the math was
   a quiz between the fun parts (Habgood & Ainsworth 2011).
7. **"Why would a center pay?"** Retention and tutor time. At $4/student, six students who
   stay pay for a 120-student center. Parents see progress weekly, branded by the center.
8. **"How does it fit with Oases / TutorBird?"** They run scheduling and billing; none do
   learning diagnostics. We're the learning layer, and a partner channel.
9. **"Learning styles?"** Not supported by research (Pashler 2008). Pip adapts to how the
   student is responding.
10. **"Minors' data?"** The demo is fully synthetic. In production: data owned by the center,
   no training on student data, consent through the center, COPPA/FERPA review before launch.
11. **"First 10 customers?"** Independent centers through owner communities and NTA; free
   30-day pilot for a case study. *(Plus any real interest you collected.)*
12. **"What's next?"** "Pip forgets": days later Pip gets fuzzy on a rule and asks the student to remind it (spaced review, and a reason to come back). Then three pilot centers, more subjects, center-software integrations,
    voice for younger kids.

## Submission form copy

- **Team name:** Pip · **Track:** Education & training
- **Customer and how they handle it today (one sentence):** Independent tutoring centers
  see each student one or two hours a week, so between sessions students lean on AI
  chatbots for answers and tutors start every session re-diagnosing what didn't stick.
- **What we built (two sentences):** Pip flips AI tutoring: students teach Pip, an AI
  classmate that believes a common misconception, refuses to give answers, and passes its
  quiz only from the rules the student taught it (Pip's Brain). Tutors get a gap report in
  the student's own words with where to start next session, parents get a center-branded
  weekly update, and owners see misconceptions across the whole center.
- **Built on Emergent with:** Claude (Universal Key) for Pip, rule extraction and grading;
  MongoDB for sessions and Pip's Brain; Twilio/SendGrid for parent updates; Stripe test
  mode for the pilot plan. Emergent job ID: *(from BOARD fact)*.
- **Market and go-to-market:** 176,000 US tutoring & driving-school businesses, $18.9B,
  no player over 5% share (IBISWorld 2025). First 100 via owner communities, the National
  Tutoring Association, and center-software partners (Oases, TutorBird, Teachworks);
  free 30-day pilot for a case study. $4/active student/month, $99 minimum.
- **Problem, with sources:** Only 28% of US 8th graders are proficient in math and 39%
  are below Basic (NAEP 2024). Fraction knowledge in 5th grade predicts high-school
  algebra (Siegler et al., *Psychological Science* 2012). 54% of US teens have used
  chatbots for schoolwork (Pew 2026), and students who practiced with ChatGPT scored 17%
  lower once it was removed (Bastani et al., *PNAS* 2025). Students who believe they're
  teaching a computer agent work harder and learn more (Chase et al. 2009).
- **Research and data with sources:** the full "Pitch-grade data points" table from
  RESEARCH.md, plus any interview quotes.
- **Live URL / test login / Drive link:** from BOARD facts.
