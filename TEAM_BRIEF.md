# Team brief — VibeCon SF 2026: "Build for Main Street"

Everyone reads this before taking work. Official rules: vibecon.com/rules (the version
on site wins; re-check at kickoff 9:30 AM Saturday).

## Theme and our entry

Small businesses in six industries still run on old software, spreadsheets and phone
calls. Build the one daily job, live on Emergent, start to finish.
**Track: Education & training. Customer: an independent tutoring center.**
**Product: Pip — students learn it by teaching it.** See PRODUCT_SPEC.md.

## Judging (both rounds, out of 100)

| Criterion | Weight | What a 10 looks like | How Pip scores it |
|---|---|---|---|
| Execution & UI/UX | **25%** | Works live without a hitch, handles a mistake, feels finished; a non-technical owner uses it unaided | One flow, polished: assign → teach Pip → quiz → gap report. Mistake moments are built in (wrong teaching → Pip fails; "just tell me" → refused) |
| Originality & innovation | **20%** | Judges haven't seen it and want to use it | Every AI tutor plays the teacher. We flip it: the student teaches the AI, and the AI's quiz depends on the teaching |
| Problem research & data | **20%** | Clear numbers with sources, owner interviews, features that answer findings | RESEARCH.md finding → feature map; PNAS 2025 harm-of-answers study; Pew 2026; owner quotes |
| Value, market & pitch | **20%** | Specific customer, real demand, a story that lands | $4/student/month; retaining 2 students pays for it; first 100 via independent-center channels |
| Use of Emergent | **15%** | Ambitious scope shipped end to end on Emergent | Deployed URL, Claude via Universal Key inside the app, SendGrid/Twilio parent update, persistent data; say so explicitly |

Round 1: pod judges score the **2-minute video** + live URL + research (no Q&A).
Top 10 (top 3 per pod + next best) → **5-minute live demo + 2-minute Q&A** on stage.
Pod scores don't carry over.

## Pitfall guardrails (why great builders lose, and our countermeasure)

| Pitfall | Our rule |
|---|---|
| Too much tech, too little pitch | **Pitch-first.** The video script is the spec. At every gate, record that beat as a rough cut. ~25% of build time goes to pitch and recording. A feature that isn't in the video doesn't get built |
| Solving a vague problem | One emotional, relatable pain: kids fail math, hide behind ChatGPT, and fear being wrong. Shown in a person (Maya) and in numbers (NAEP, PNAS, OECD) |
| Ignoring sponsor prizes | No sponsor prizes were announced (research Oct 23). **Confirm at kickoff.** If MongoDB/Claude/AWS run side prizes, switch on the prepared contingency (EMERGENT_PROMPTS S3) and submit to them too |
| No "wow" visual | The title card is Pip failing ("You told me to add the bottoms… 5/12? 😵"). The first live frame is a designed owner dashboard. Pip's Brain is designed with the most care (DESIGN.md) |
| Building from scratch | Emergent builds the stack; **seed data is prepared** (`data/`); **design brief prepared** (DESIGN.md); **demo messages prepared** (DEMO_SCRIPT.md); demo login picker instead of real auth |

## Sponsors and judges (researched Oct 23; confirm at kickoff)

| Who | Role | What they want to see | How we show it (truthfully) |
|---|---|---|---|
| **Emergent** (host) | Platform; CEO Mukund Jha and CTO Madhav Jha judge | Software that runs a small business's core operations, built by one person through conversation, live and deployed; "replaces SaaS and agencies" | Say "built solo on Emergent in 24 hours". Show the deployed URL, integrations and real persisted data |
| **MongoDB** | **Hero Sponsor**; on-site engineers | Their database doing real work. Emergent runs on MongoDB Atlas (flexible documents let agents iterate without migrations) | **Pip's Brain is a MongoDB document**: the rules the student taught, which Pip must answer from. Session documents power the center insight ("14 students share the same mistake"). **Ask MongoDB engineers Saturday** whether the session document can be shown |
| **Anthropic / Claude** | Supporting partner; Sachin Malhotra (Anthropic) judges | Claude doing the core intelligence, well | Pip runs on Claude via Emergent's Universal Key: stays in character, never leaks answers, grades explanations, grounds the quiz in the transcript |
| **AWS** | Supporting partner; Balaji NJL (AWS) judges | No stated ask | Don't force it. Mention only if Emergent hosting uses AWS and we can confirm it |
| **Y Combinator** | Nicolas Dessaigne (GP) judges; winner gets a YC interview | A real business: buyer, demand, distribution, founder insight | Crisp market slide-in-words, pricing, first 100 customers, why now (AI is making students worse) |
| **Stripe** | Pratik Gupta judges (not a listed sponsor) | Real money flows | In-app pricing page + test-mode "Start pilot" checkout (2s in the video). Shows who pays |

Last year's VibeCon SF (Nov 2025) winner, "Cypher", won on storytelling plus a real
workflow. Emergent's CEO noted only one of six criteria was mostly technical. **The story
matters as much as the build.**

## Rules that bind us

- "Use any tools that make you fast, including Claude, coding agents or anything else, but your final product ships and demos on Emergent." Code can be written in GitHub with Claude Code and pulled into the team
  lead's Emergent project; the live, demoed app is the public Emergent URL.
- No code written before kickoff.
- Synthetic data for students, parents and tutors. Payments in test mode.
- Submit by **12:00 PM Sunday**: team name, track, emails, live URL (+ test login),
  **Emergent job ID**, Drive video link, customer in one sentence, what we built in two
  sentences, research with sources.
- Video: max 2:00, screen recording of the live app + voiceover, title card only.

## Prizes

Winner: $10,000 + direct interview for an upcoming YC batch. Runner-up $5,000.
Third $3,000. Plus partner credits/perks.
