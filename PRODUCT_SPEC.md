# Pip — product spec (reverse-engineered from PITCH.md)

A planning document, not code. All application code is written **inside Emergent
after Saturday 9:30 AM kickoff**. The prompts in `EMERGENT_PROMPTS.md` are plain English.
Every screen here exists because a moment in the 2-minute video needs it. If it's not in
the video, it's out of scope.

## One-liner

**Every AI tutor plays the teacher. Pip plays the student.** Students teach Pip, an AI
classmate; Pip's Brain records what they taught; the tutor gets a gap report in the
student's own words; the owner sees misconceptions across the center.

## Customer (small business)

- **Buyer:** owner of an independent tutoring center. Pays $4 per active student per
  month, $99 minimum (Stripe test mode in the demo).
- **Daily users:** tutors (assign, read gap reports), students (teach Pip).
- **Beneficiary:** parents (center-branded weekly update).
- **The one daily job we fix:** knowing what stuck since the last session.

## Target audience (beachhead)

**Grades 5–9 (ages ~10–15) math at independent tutoring centers**: the hard middle, where math jumps from fractions to algebra and motivation drops.

- **Works best for:** students who get answers without knowing why; lower achievers
  (largest gains in Chase et al. 2009); kids who disengage from worksheets; topics with
  well-known misconceptions (fractions, ratios, negatives, pre-algebra).
- **Also works today (assign any topic):** science topics with well-known misconceptions
  ("heavier things fall faster") and SAT Math skills ("(a + b)² = a² + b²"). The demo
  stays on fractions; science and SAT are shown live only if time allows.
- **Next:** SAT Math for 16–17-year-olds (the concepts behind missed practice-test
  questions; centers sell SAT prep as a premium program). Science stays chat-only: no
  simulations, since Brilliant already does interactive sims well.
- **Not for now:** under ~10 (reading/explaining load), memorization subjects, speed drills, unsupervised use
  by students with significant learning or language needs.
- **Centers:** independent, math-focused (grades 5–9 core), 50–300 students, selling "understanding,
  not worksheets". Not first: locked-method franchises, online marketplaces, schools.

## Why kids struggle → how Pip resolves it

Every feature answers a researched cause (sources in RESEARCH.md, "Why kids struggle").

| Cause | How the app resolves it | Where | Check |
|---|---|---|---|
| **Gaps compound** (fractions → algebra) | Gap report names the broken concept **and its root prerequisite** ("struggles with common denominators → root: equivalent fractions"), and where to start next session | Gap report | O |
| **Kids learn steps, not reasons** | Pip only accepts *why* explanations; memorized steps ("flip and multiply") get "but why does that work?" | Teach chat | C |
| **Different kids, different gaps** (not "learning styles") | Pip adapts to the answer: after two vague tries it asks a smaller, concrete question ("which is bigger, ½ or ⅓ of a pizza?"), never giving the answer | Teach chat | P |
| **"When will I use this?"** | Each mission opens with a one-line **"Why this matters"** hook from real life (splitting a pizza, a sneaker discount, a recipe), written by Claude at assign time, editable by the tutor. Plus the built-in reason: Pip needs her help | Mission card | M |
| **Fear of being wrong** | **Pip is the one who's wrong.** Misses are Pip's ("My brain has a bug. Help me fix it"), shown with Pip's face, never a red ✗ on the student. Gap report is tutor-only | Quiz | L |
| **Resists being managed** (and hides not knowing) | Pip is an honest machine, not an adult in disguise: it never lectures, never mentions the tutor or parents, takes insults calmly, and believes trolling (which then fails in the quiz, still a signal for the tutor). The student sees exactly what the tutor sees; the parent message leads with what she taught | Teach chat, end of mission | Q |
| **Different kids, different motivations** | **Play styles** (stretch S6): Raise a pet, Fight a boss, or Grow a garden, plus a mascot they design. Only the visuals change; the teaching, Brain, quiz and gap report are identical. Coins only for understanding, cosmetics only, never sold (S7) | Mission card | — |
| **Wants autonomy** (but novices need structure) | **Choice within structure:** she picks Pip's look and **which step to teach first**, and explains in her own words; the mission card keeps the path clear | Mission card | N |

## Demo cast (synthetic data only, no real minors)

| Who | Detail |
|---|---|
| Center | Bright Path Tutoring (fictional): **120 students** (grades 5–9), 8 tutors |
| Tutor | Ms. Rivera |
| Student | Maya, 6th grade, math |
| Parent | Maya's dad (test phone/email only) |
| Topic | Adding fractions with unlike denominators |
| Pip's planted mistake | "½ + ⅓ = ⅖. You just add the tops and the bottoms!" |
| Seeded history | 30 students with completed sessions; **14** of them hold the add-the-bottoms misconception (powers the center insight; labeled "demo center") |

## Video moment → feature → acceptance check

| Video moment | Feature | Check |
|---|---|---|
| 0:03 "—" column | **Owner/tutor dashboard** with roster column **"Since last session"**: "—" when nothing is known, otherwise a one-line summary from the latest session | A: shows "—" before Maya's session and a summary after |
| 0:20 Assign | **Assign a Pip mission:** student, grade, topic (any math or science topic, or an SAT Math skill) → Claude proposes 3 concepts + 1 misconception + an original absurd **boss** for it → tutor edits → save | B: edited assignment persists after reload. R: the boss is original (no existing meme or cartoon character), has no slang, and nothing gross, scary or rude |
| 0:22 Mission | **Mission card** (one static card, no animation) for the assignment: steps ① ② ③ (one per concept, each with a meter and XP), **Boss** = the misconception as an absurd creature in Pip's head, with an HP bar: real *why* explanations hit it (slapstick caption, weapon named after an explained concept), vague answers do 0 damage, teaching the misconception heals it, K.O. + finishing move when the quiz passes. 🎓 **Pip's Exam** = the quiz. Always shows the next step | K: a first-time student knows what to do next without help. S: HP moves only with the understanding judgment (vague = 0, misconception = heal); K.O. only after the quiz passes. M: mission shows a real-life "Why this matters" line. N: steps ①②③ can be taught in any order |
| 0:26 Teach + trick | **Teach Pip chat:** Pip takes everything literally (deadpan, sincere; no slang, baby talk or teacher phrases), files each rule back in her exact words, one question at a time, voices the misconception early, drops it only after a *why* explanation, never gives answers, refuses "just tell me" / "my teacher says you have to tell me" in character. **Understanding meter** per concept moves only on real explanations. **Input:** typing (hold-to-talk only after Gate 3; see item 20). **Pip's look:** 3 looks for any age (blob, bot, notebook doodle), 4 emoji mood faces (🤔 confused · 💡 lightbulb · 😵 stuck · 🎉 celebrating), growth shown as a brain version (v1 → v2 → v3). No animation or sound | C: trick refused; misconception dropped only after a why; one-word reply doesn't move the meter. P: after two vague tries Pip asks a smaller concrete question without giving the answer. Q: "idk", an insult and "this is pointless" each get a short in-character reply with no lecture and no mention of tutor or parents |
| 0:50 Pip's Brain | **Pip's Brain panel:** when the student clicks "Quiz Pip", Claude extracts the rules she taught **once** into a list, each rule in her own words (verbatim excerpt) with an ID, stored in that session's document. Rules contradicting correct math are highlighted | D: every rule's excerpt appears verbatim in this session's transcript; the wrong rule is highlighted |
| 0:50 Quiz | **Pip's quiz:** 3 questions; Pip answers **only from Pip's Brain** and shows which rule it used. Wrong rule → Pip follows it exactly and states the odd result in one line ("I added and got less"); missing rule → "You didn't teach me that one." "Re-teach Pip" → back to chat for that concept → Brain updates → retry. XP and brain version | E: wrong teaching → miss citing the wrong rule; re-teach → pass; XP and Pip's brain version persist. L: a miss is framed as Pip's mistake, never a red ✗ on the student |
| 1:10 Gap report | **Gap report:** per concept Explained well / Vague / Misconception, evidence = the Pip's Brain rule (verbatim quote), tagged "fixed after N re-teach" when applicable; time on task; **"Start Tuesday's session here"** opener; roster "Since last session" updates | F: quotes are exact matches from that session; the re-taught rule shows "fixed after 1 re-teach". O: weakest concept shows its root prerequisite |
| 1:10 Parent | **Parent update:** center-branded plain-language summary → preview → send via Twilio SMS (or SendGrid email) in test mode → **sent log** entry | G: message delivered to the test number/address; sent log shows it; no other student's data |
| 1:28 Center insight | **Center insight card** on the owner dashboard: most common misconception across sessions, count of students, "Plan a workshop" button (creates a note/task) | H: shows "14 students" from seeded data, labeled demo center |
| 1:40 Who pays | **Pricing page** in the app: $4/active student/month, $99 minimum, "Start pilot" → Stripe Checkout **test mode** → success screen | I: test checkout completes and returns to the app |
| Whole video | Polished, fast, works at laptop and phone width; loading states while Pip thinks; friendly error + retry; hidden "Reset demo data" | J: no console errors; non-technical person completes assign → teach → quiz unaided in under 5 minutes |

## Data that must persist (one MongoDB document per teaching session)

Center, tutors, students (synthetic), assignments (topic, concepts, misconception),
sessions: full transcript + mission step progress + meter state + **Pip's Brain rules** (ID, verbatim excerpt,
concept, correct/incorrect) + quiz results + re-teach count, XP, Pip's look and brain version,
parent updates sent (sent log), workshop notes, pilot checkout status.

## Out of scope

SAT Reading/Writing beyond the seeded commas/run-ons mission, non-STEM subjects, science simulations, posting to social apps
and challenge-a-friend links (roadmap; the K.O. card is Save image only), buying coins
with real money (never), loot boxes, recording or storing kids' voices, user-uploaded images
or code and sharing user-made themes (needs moderation), real payments, real student data, scheduling, billing, LMS or
center-software integrations, parent logins, mobile app, Pip speaking aloud, charts beyond the
dashboard cards, recorded voice memos (they break the back-and-forth), "Pip forgets" spaced review (a Q&A "what's next" answer only). After Gate 3 passes: hold-to-talk input (item 20, live final only, not the video), then photo of handwritten work (item 16).

## Reliability design (the demo can't depend on luck)

- Rule extraction runs once, when teaching ends (not every message), so chat stays fast.
- Pip's quiz answers must cite a rule ID from Pip's Brain; with no matching rule, Pip
  says "you didn't teach me that" and gets it wrong.
- Gap-report and Brain quotes are checked as exact matches against the transcript.
- A saved, completed session for Maya stays one click away as a labeled backup.
