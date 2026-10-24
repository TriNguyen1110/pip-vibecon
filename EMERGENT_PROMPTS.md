# Emergent prompt sequence (plain English — type these at/after kickoff)

These are instructions to Emergent's agent, written before kickoff as planning. They
contain no code, and none should be added. Emergent writes all code. Send one prompt at a
time, test it in the preview, append a BOARD `review` row, and wait for the verifier
before the next one. Each prompt builds a moment in the video (see PITCH.md); check
letters refer to PRODUCT_SPEC.md.

**Next prompt:** P1

---

## P0 — Before the first prompt (Sat 10:30)

- Start a new Emergent project as team lead. Note the **job ID** (`fact emergent-job-id`).
- If Emergent asks for the LLM, choose **Claude** via the Universal Key.
- Ask Emergent to **deploy as soon as P1 works** so there's a public URL early.
- Ask the on-site MongoDB engineers: "Does my Emergent app's data live in MongoDB Atlas,
  and can I show a session document?" Log the answer as a BOARD fact.

## P1 — Foundation + dashboard (item 04 · check A)

> Build a web app called **Pip** for an independent tutoring center. Roles: owner/
> tutor and student. Use a simple demo login screen where I can pick "Ms. Rivera (tutor)"
> or "Maya (student)".
>
> Store data for: the center, tutors, students, assignments, and teaching sessions. Each
> teaching session is **one document** holding its full chat transcript, understanding
> meter state, a list called "Pip's Brain" (rules the student taught), quiz results,
> re-teach count, and XP. Also store the student's Pip avatar, parent messages sent
> (a sent log), workshop notes, and pilot checkout status.
>
> Load the **synthetic** demo data from the two JSON files I'm attaching
> (`seed_center.json`: center, 8 tutors, 120 students; `seed_sessions.json`: the fractions
> assignment, 30 completed sessions of which 14 hold the "add the bottoms" misconception,
> and Maya's saved backup session, labeled "saved session"). Don't invent other data.
> Label the center "demo center". *(If attaching files isn't possible, paste the JSON.)*
>
> Home screen for Ms. Rivera: a clean roster with a column **"Since last session"** that
> shows "—" when there's no Pip session yet, otherwise a one-line summary of what
> the student explained well and what they missed. A big "New Pip mission" button. Above the
> roster, a **Center insight** banner area (filled in later).
>
> Design: warm and friendly. Colors: ink #1F2333, paper background #FFFBF5, purple accent
> #6C4CF5, sunshine #FFC845 for XP, mint #2BB673 for correct, coral #FF6B5E only for Pip's
> wrong rules. Fonts: Nunito for headings and student screens, Inter for tutor tables.
> 16px rounded cards, soft shadows, lots of white space, one main button per screen.
> Readable by a non-technical owner; works on laptop and phone widths.
>
> The first screen at the public URL is a **landing page** that explains itself to someone
> who arrives with no context: headline "Every AI tutor plays the teacher. Pip plays the
> student.", subline "For tutoring centers: know what every student understands, before they
> walk in.", and three big buttons: Try as Maya (student), Open as Ms. Rivera (tutor), Owner
> view. Footer: "Demo center with synthetic data." Then deploy to a public URL and tell me
> how to test it.

## P2 — Assign a Pip mission (item 05 · check B)

> On "New Pip mission", the tutor picks a student, grade and topic. The topic can be any
> math or science topic, or an SAT Math skill (examples: "Adding fractions with unlike
> denominators", "Why heavier things don't fall faster", "Expanding (a + b)²"). Use
> Claude to propose **three key concepts** the student must be able to explain and **one
> common misconception** that Pip will believe at the start (example: "you add the tops
> and the bottoms, so ½ + ⅓ = ⅖").
> Also have Claude write one short **"Why this matters"** line from real life for a
> 10–15 year old (splitting a pizza, a sneaker discount, doubling a recipe).
>
> Claude also turns the misconception into a **boss**: an original, absurd name in a
> silly fake-Italian style, a two-emoji look, and one line of ridiculous backstory
> (example: "Addini Bottomini 🍕🦵, a pizza with legs that adds everything, including the
> bottoms"). The boss must be original: no existing meme or cartoon characters, no slang,
> nothing gross, scary, rude or about real people. The tutor can edit or regenerate any of
> these before saving. Saving creates an assignment on that student's home
> screen. Don't change anything else.

## P3 — Student teaches Pip (item 06 · check C): the core

> When Maya opens her assignment she meets **Pip**, an AI classmate who **takes everything
> literally**: Pip believes exactly what it's told and follows it to the letter. First she
> picks Pip's look: a round purple blob, a little robot with a screen face, or a doodle that
> looks hand-drawn in a notebook margin. Pip shows one of four emoji mood faces that change
> with the chat: confused, lightbulb, stuck, celebrating. Pip starts at "Brain v1". Keep it
> simple: no animation or sound.
>
> Above the chat, show one simple, static **mission card** that always makes the next step obvious:
> the "Why this matters" line on top, then steps ① ② ③ (one per key concept, each with
> its meter and +20 XP; the student can **choose which step to teach first**), then the
> **Boss** step, then **Pip's Exam**. Highlight the current step and check off finished ones.
>
> **Boss fight.** The boss lives in Pip's head: it's the misconception, never Pip. Show
> the boss (name, emoji look, backstory) with an HP bar starting at 100. Each concept the
> student explains well unlocks a silly **weapon** named after it (example: "Common
> Denominator Cleaver 🔪🍕"). When the student gives a real *why* explanation against the
> misconception, the boss takes a hit: HP drops, a quick shake, and a one-line slapstick
> caption naming the weapon ("Addini Bottomini got sliced into sixths. −40 HP"). Vague
> answers do nothing ("Addini Bottomini is unbothered. 0 damage"). If the student teaches
> the misconception itself, the boss **heals** (+20 HP) and gloats in one silly line.
> Pip comments deadpan ("The boss is yelling in fake Italian. I'm still taking notes.").
> Cartoon slapstick only: splats, squashes, pies, slicing pizza. Nothing bloody or cruel.
> HP comes from the same judgment as the understanding meter, so button-mashing can't
> win.
>
> Make the student side feel **alive and tappable, phone first**: weapon chips are
> tappable to equip (the next hit's caption uses the equipped weapon); the boss reacts
> when the student starts typing (a one-line taunt), and Pip shows "Pip is listening…"
> while she types; every hit, heal and meter change gets instant visual feedback. Big tap
> targets, chat input pinned to the bottom, everything usable one-handed on an iPhone.
>
> Pip's personality and rules (powered by Claude):
> - Deadpan and sincere: calm, literal, quietly funny, never tries to sound cool. **No slang,
>   no baby talk, no teacher phrases** ("Great job!", "Let's think about…"). One or two short
>   sentences per message, few emoji. Same Pip for every grade; a little warmer for grades 5–6.
> - When the student states a rule, Pip repeats it back in her exact words and files it,
>   deadpan: "Saving that: 'the pieces are different sizes so you can't just add them.'"
> - Pip **never** explains the topic or gives answers, even if the student says "just tell
>   me" or "my teacher says you have to tell me." Pip stays in character: it doesn't know
>   either, which is why it needs her.
> - Pip asks **one question at a time**, mostly "why?" and "can you show me an example?"
> - Pip believes the assignment's misconception and says it early. It only lets go when
>   the student explains **why** it's wrong, not just that it's wrong.
> - If an explanation is vague or one word, Pip asks for an example instead of accepting it.
> - If she gives memorized steps ("flip and multiply"), Pip asks why that works.
> - After two vague tries on the same idea, Pip asks a smaller, concrete question
>   ("which is bigger, ½ of a pizza or ⅓?") so she can get there herself. Still no answers.
> - When the student resists, Pip never lectures and never mentions the tutor or parents.
>   "idk" or one-word answers → a smaller, concrete question. Insults → taken calmly ("Noted.
>   Still need to know why, though."). "This is pointless" → "Fair. Three more steps."
> - If the student teaches something wrong, Pip believes it completely, because it takes
>   everything literally. Pip never hints that a rule is wrong; the quiz shows it.
> - Pip asks like a curious peer, never like a teacher checking answers: real "why" and
>   "what if" questions it wants to know ("Wait, so is a bigger bottom number a smaller
>   piece? That's backwards. Why?"), and "which part should I learn first?" so she
>   decides.
> - On the first session Pip asks one question about what she's into (a game, a sport,
>   music, food) and saves it. Pip uses it in its questions from then on ("If you win 3
>   of 6 matches, what fraction is that?"). Lessons tied to a kid's own interests help
>   them learn (Walkington 2013).
> - If she taught Pip before, Pip opens by recalling one of her old rules in her words
>   and asking if it's still true ("Last time you said 'the bottom is the size of the
>   pieces.' Still true?"). One line, then on to the new mission.
>
> Show a **"Pip's understanding" meter** for each of the three concepts that rises only
> when the student really explains that concept. Save the transcript and meters to the
> session document as the chat goes. Add an "I'm done teaching, quiz Pip!" button. Keep
> the tutor screens as they are.

## P4 — Pip's Brain + quiz (item 07 · checks D, E): the memorable shot

> When the student clicks "quiz Pip", first build **Pip's Brain**. Use Claude **once** to
> read this session's transcript and list the rules the student taught. Each rule has a
> short ID, the concept it belongs to, an **exact quote copied word for word from the
> student's messages**, and whether it's mathematically correct. Save the list in the
> session document. Show it as a big **thought-cloud card** called "Pip's Brain": each rule
> is a sticky note in the student's own words, in quotes, with a small concept tag; tapping
> a note jumps to the chat message it came from. A wrong
> rule glows coral with "Pip believes this 😵"; after re-teaching it turns mint with "fixed
> after 1 re-teach". Make this the most polished screen in the app.
>
> Then Pip takes a 3-question quiz on the three concepts. Pip must answer **only by using
> rules in Pip's Brain** and shows which rule it used for each answer. If the rule it uses
> is wrong, Pip follows it **exactly**, shows the work, and calmly states the odd result in
> one line, for example: "Your rule: add the tops and the bottoms. 3/6 + 2/6 = 5/12. That's
> less than the 3/6 I started with. I added and got less. Following your rule anyway. 😵"
> If there's no rule for it: "You didn't teach me that one." A miss is always **Pip's**
> mistake: show Pip's stuck face and "My brain has a bug. Help me fix it", never a red ✗
> or a score against the student. Mark each question passed or missed. Award XP per pass.
> When all three pass, the boss gets a **K.O.** screen ("Addini Bottomini has left
> Pip's brain"), the student picks one of her unlocked weapons as the finishing move (one
> silly caption, no extra scoring), Pip celebrates and **upgrades its brain** (Brain v1 →
> v2 → v3), and the mission is marked complete. For a missed question, "Re-teach Pip"
> returns to the chat for that concept. When she finishes, update Pip's Brain (replace
> the wrong rule, count the re-teach) and let Pip retry. Save everything.
>
> After the mission, end on a **cliffhanger**: Pip asks one honest question about the
> *next* topic that it can't answer yet, phrased as a rumor ("I heard dividing can make
> numbers bigger. That can't be right... right?"). Don't answer it; save it for the
> tutor's next session. Also show the mascot's **next form as a silhouette** and the
> next boss as a shadow with half its name hidden, so there's always something just out
> of reach. No timers, no "come back or else", no guilt messages.

## P5 — Tutor gap report (item 08 · check F): the money screen

> After a session, the tutor sees a **Gap Report** for that student. For each concept show
> Explained well / Vague / Misconception, with the matching **Pip's Brain rule quote as
> evidence** (word for word; never invent or paraphrase). If a rule was fixed by
> re-teaching, tag it "fixed after 1 re-teach" (use the actual count). Also show time spent
> teaching, the quiz result, and a box titled **"Start Tuesday's session here"** with a
> specific 10-minute opener based on the weakest concept (plus Pip's cliffhanger question
> about the next topic, if there is one), a **"Root cause"** line naming
> the earlier skill that concept depends on (for example: common denominators → root:
> equivalent fractions). At the end of the mission, also show the student a short
> read-only card, **"Here's what Ms. Rivera sees"**, with each concept's status in plain
> words (no surprises later). Update the roster's "Since last
> session" column for that student. Link the report from the roster. Don't change other
> screens.

## P6 — Parent update + center insight (item 09 · checks G, H)

> On the gap report add "Send weekly update to parent". It writes a short, encouraging,
> plain-language summary branded "Bright Path Tutoring" (what Maya taught Pip and mastered,
> what's next; no list of mistakes),
> shows a preview, then sends it by **Twilio SMS in test mode** (or SendGrid email if SMS
> isn't available) to a test number/address I'll give you. Record each send in a sent log
> visible to the tutor.
>
> On the owner dashboard add a **Center insight** card: the most common misconception
> across all sessions and how many students hold it (from the session documents), in
> plain words, with the boss name as a small chip ("students call it Addini Bottomini"),
> and a
> "Plan a workshop" button that saves a workshop note listing those students. Next to
> it, a small stat: **"Came back on their own this week"**: how many students opened
> Pip without an assignment due. Keep everything else unchanged.

## P7 — Pricing + Stripe pilot (item 17 · check I)

> Add a Pricing page in the app for the center owner: "$4 per active student per month,
> $99 minimum", with a **Start pilot** button that opens Stripe Checkout in **test mode**
> and returns to a success screen in the app. Save the pilot status. Don't change other
> screens.

## P8 — Polish (item 10 · check J)

> Polish only, no new features: consistent spacing and type, clear "Pip is thinking…"
> loading states, friendly empty states, a helpful message with retry if an AI call fails,
> and phone-width layout. Add a hidden "Reset demo data" action that restores the seeded
> center and one saved, completed example session for Maya (labeled "saved session").

## After Gate 3 only (gap report with real quotes passes)

- **S1 photo (item 16):** "Let the student upload a photo of her handwritten work in the
  Pip chat. Pip reads it and reacts in character, pointing to the step it's confused by."

- **S2 hold-to-talk (item 20, after Gate 3):** "In the Pip chat, add a microphone button
  the student holds to talk. Speech turns into text in the message box, which she can
  fix before sending. Only the sent text is saved. Don't change anything else."

- **S3 sponsor contingency (only if kickoff announces a MongoDB prize):** "Group students'
  wrong rules by meaning, not exact words, so 'add the bottoms' and 'you add both numbers'
  count as the same misconception in the Center insight. Use MongoDB's vector search if
  this app's database supports it." Ask the on-site MongoDB engineers first.

- **S4 bug on purpose (item 26, after Gate 3; live final, not the video):** "After Pip
  misses a quiz question because of a wrong rule, if the student says they did it on
  purpose, Pip asks them to predict the exact wrong answer it will give on a new question
  using that rule. Then Pip answers. If the prediction matches, save it in the session as
  'deliberate bug, predicted correctly', and the gap report counts that concept as
  understood, not a misconception. Don't change anything else." Trolling Pip then takes
  knowing the right answer.

- **S5 K.O. card (item 30, after Gate 3):** "After a boss K.O., create a **K.O. card**
  the student can keep. It should feel premium and understated, like a numbered
  collectible, not a trophy: matte near-black background, one thin metallic accent line,
  lots of empty space, small clean type. **Front:** the boss's two emoji, small; the
  misconception written as an equation with the wrong answer struck through (for example
  '½ + ⅓ = ~~⅖~~'); a serial number like 'No. 0147' (the order this boss was beaten in
  across the app); the student's nickname; the date. No XP, no score, no 'achievement
  unlocked', no exclamation marks, no boss name on the front. **Back (tap to flip):** the
  boss's full name, the student's winning rule in her exact words in small italics, and
  Pip's dumbest line before the fix. Defeated bosses collect in a quiet 'Vault' on the
  student's home screen. One 'Save image' button in story size (9:16); no posting
  buttons, no rewards for saving or sharing. Use the nickname only; no last name, photo,
  school or center name, and nothing that says tutoring. Add a center setting to turn
  card saving off. Don't change anything else."

- **S6 play styles + your own mascot (item 31, after Gate 3):** "Let the student make
  their own mascot and pick a **play style**. Mascot: choose a creature (cat, dragon,
  axolotl, frog, robot, blob), a name (default: Pip), and accessories (hats, glasses, scarves). Play
  style changes **only how progress looks**, never the teaching, Pip's Brain, the quiz or
  the gap report:
  - **Raise** (cute): the mascot is a pet. Good explanations make it happy; a wrong rule
    makes it confused. Milestones: baby → grown → its final form.
  - **Fight** (tough): the boss fight that already exists. Milestones: boss K.O.s.
  - **Grow** (calm): a garden. Good explanations water a plant; a wrong rule sprouts a
    weed that's pulled when re-taught. Milestones: seed → sprout → blooming tree.
  Every style uses the same three events: a real *why* explanation (progress), a vague
  answer (nothing happens), the misconception (a setback that's undone by re-teaching).
  Setbacks are never cruel: pets never get sick or die, gardens never wilt away. The
  mascot keeps Pip's literal, deadpan personality in every style. The student can switch
  style any time. Save the mascot, style and stage. Don't change anything else."

- **S7 coins and tools (item 32, after S6):** "Each concept explained well earns a few
  **coins**; fixing a wrong rule through re-teaching earns a bonus. No coins for time
  spent, logging in, streaks, or just finishing. Coins buy **cosmetics and tools only**:
  accessories, pet toys, garden tools, boss-fight weapon skins. Special items are
  **named after what she figured out** and can't be bought, only earned by explaining
  ("Sixths Scarf: explained common denominators"). Coins never buy hints,
  answers, skips or quiz passes. **Coins can never be bought with real money**, and there
  are no loot boxes or random paid prizes. A **mission complete** is the big milestone: the
  mascot moves to its next form (and the K.O. card becomes that style's milestone card).
  Save the coin balance and inventory. Don't change anything else."

- **S8 a mascot that feels alive (item 33, cheap; do first of S8–S10):** "Make the
  mascot react like a real pet toy. Tap it: it says a short deadpan line ('Ow. Noted.').
  Tap and hold: it relaxes (happy face). Poke it repeatedly: it gets mildly annoyed,
  then forgives you. When idle, it does small things (blinks, looks at the mission card,
  reads its own Brain). Add a **'Hear Pip say it'** button on each Pip's Brain note that
  reads the student's rule aloud in a funny robotic voice using the browser's built-in
  text-to-speech. Never record or store the student's voice. Keep reactions to emoji
  faces, a short wiggle and one line of text. Don't change anything else."

- **S9 deep mascot creator + Pip's room (item 34, after S7):** "Upgrade the mascot maker
  to feel like a character creator: body shape, color, pattern, eyes, mouth, and
  accessories in layers, with a randomize button and a live preview. Add **Pip's room**:
  a small room the student decorates with items bought with coins (posters, plants,
  lamps, a rug). Earned milestone cards hang on the wall as framed cards. The mascot
  wanders the room and reacts when tapped. Save everything. Don't change anything else."

- **S10 mod-style themes (item 35, after S9):** "Let the student customize the student
  side like a mod: pick a theme (colors, light or dark, chat bubble style, background
  pattern, font size) from a set of presets, then tweak individual pieces and save it as
  'My theme'. Themes are visual only and never change content, the boss, or anything a
  tutor sees. Also add a **center theme** the owner sets (center colors and logo on
  student screens, used as the default). No uploading images or code, and no sharing
  themes between students yet. Don't change anything else."

## Fix-prompt template (for verifier failures)

> Only fix this: **[observed behavior]**. It should **[expected behavior]**. Steps to
> reproduce: **[steps]**. Do not change any other screen, the data, or Pip's personality.
