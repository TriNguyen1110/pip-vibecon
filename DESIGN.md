# Pip — design brief (paste the relevant parts into Emergent prompts)

Prepared before kickoff as a design asset; the rules allow "design assets, UI kits and
icons". No code here. Goal: judges see something **polished and visual in the first 3
seconds**, and the Pip's Brain shot is the image they remember.

## Look and feel

> **Superseded for visuals by `DESIGN_SYSTEM.md`** (willder palette, Fraunces/Manrope/Geist Mono, Studio vs. Play registers). The purple/Nunito values below are historical; the product rules in the rest of this file still apply.


- **Mood:** warm, playful for students; calm and professional for tutors/owners. Same
  palette, different density.
- **Palette:** ink `#1F2333` · paper `#FFFBF5` · Pip purple `#6C4CF5` (accent) · sunshine
  `#FFC845` (XP, celebrate) · mint `#2BB673` (correct) · coral `#FF6B5E` (Pip's wrong rule,
  never used on the student's answers).
- **Type:** "Nunito" (Google Fonts) for headings and student UI; "Inter" for tutor/owner
  tables.
- **Shape:** 16px rounded cards, soft shadows, generous white space, one primary button
  per screen.
- **Icons/emoji:** system emoji for Pip's moods (🤔 💡 😵 🎉) so nothing needs drawing;
  Twemoji/OpenMoji (open-licensed) if a consistent set is wanted.

## Pip

**Pip takes everything literally.** Deadpan, sincere, calm, quietly funny. The humor comes
from Pip following a rule to its odd conclusion ("I added and got less. Following your rule
anyway."), not from attitude. That reads the same at 10 and at 15, and to a kid who
resists, it's an honest machine, not an adult in disguise.

Avoid: slang, "cool teen" props (caps, headphones, sunglasses), trash talk, baby talk,
teacher praise ("Great job!"), and anything that sides with the adults.

| Look | Description |
|---|---|
| Blob | Round purple creature with big eyes |
| Bot | Little robot with a screen face |
| Doodle | Looks hand-drawn in a notebook margin: ink lines on paper |

Any look, any age; no look is labeled by age. Moods: 🤔 confused (default) · 💡 lightbulb
(good explanation) · 😵 stuck (quiz miss, "my brain has a bug") · 🎉 celebrating (pass).
Growth: Brain v1 → v2 → v3 (a version badge on Pip and on Pip's Brain).

## The boss: where the brainrot lives

Brainrot energy goes into **the boss only**: the misconception becomes an absurd original
creature with a fake-Italian name, a two-emoji look and one line of ridiculous lore
("Addini Bottomini 🍕🦵, a pizza with legs that adds everything, including the bottoms").
Claude generates a new one per assignment, so it works for any topic ("Heavierino
Fallerino 🎳🪶" for physics, "Squarino Distributini 🟦💥" for SAT Math's (a + b)²).

- **The joke is the pairing:** chaotic boss, deadpan Pip. Pip is the straight man.
- **Kick-the-Buddy-style fights:** HP bar (coral), a quick shake on each hit, one-line
  slapstick captions, weapons named after the concepts the student explained, and a
  finishing move on K.O. Splats, squashes, pies and pizza slicing; nothing bloody or cruel.
- **Never:** borrowed meme characters or other companies' mascots, adult-written slang
  (skibidi, rizz, gyatt), gross-out or scary content, mocking the student or Pip.
- **Student screens only.** Tutor, owner and parent screens stay calm and professional;
  the boss name appears there only as a small chip next to the plain misconception.
- Memes date fast. Generating original bosses per topic means nothing goes stale.

## Play styles and your own mascot (stretch S6–S7)

Kids pick what feels like theirs; the learning underneath is identical. These are **play
styles** (what motivates you), not "learning styles" (which have no evidence; see
RESEARCH.md): content, Pip's Brain, quiz and gap report never change.

| Style | Feels like | Progress | Setback (wrong rule) | Milestone (mission complete) |
|---|---|---|---|---|
| **Raise** | Raising a cat | Mascot gets happier | Mascot looks confused | Baby → grown → final form |
| **Fight** | Kick the Buddy, a boss game | Boss loses HP | Boss heals and gloats | Boss K.O. |
| **Grow** | Tending a garden | Plant gets watered | A weed sprouts | Seed → sprout → blooming tree |

- **Mascot:** creature (cat, dragon, axolotl, frog, robot, blob), a name the kid picks,
  accessories. Emoji and simple flat shapes so nothing needs custom art. Personality
  stays Pip's: literal and deadpan, even as a kitten.
- **Small wins → coins and tools; big wins → the mascot changes form.** Coins come only
  from understanding (a concept explained well, a wrong rule fixed), buy cosmetics and
  tools only, and are never sold for real money.
- **Never guilt:** no dying pets, no wilting gardens, no streak shame. Setbacks get
  undone by re-teaching, which is the point.
- The milestone card (S5) follows the style: K.O. card, bloom card, evolution card. Same
  quiet, premium look.

## Keep it intrinsic: the fun is the learning

Rewards bolted onto learning wear off; fun that *is* the learning lasts. In a math game
built so the fighting itself was division, kids given free time chose it about seven
times longer than a version where the same math was a quiz between fights (Habgood &
Ainsworth 2011, 16 children in the free-choice study). That's the bar for every
feature.

- **The boss is the mistake.** You can only win by explaining. Keep it that way: no
  way to damage a boss, grow a pet or water a plant except understanding.
- **Curiosity needs a small gap.** People are most curious when they half-know something,
  and remember answers better when curious (Kang et al. 2009; Gruber et al. 2014). So:
  a cliffhanger question about the next topic, the next form as a silhouette, the next
  boss as a shadow with half a name. Always one thing just out of reach, never a mystery
  box to buy.
- **Asking before teaching helps.** Trying a question before the lesson improves
  learning even when the guess is wrong (Richland, Kornell & Kao 2009). Pip's cliffhanger
  is that question, and the tutor gets it as Tuesday's opener.
- **Pip is a peer, not a coach.** It asks what it actually wants to know, lets her pick
  the order, uses what she's into, and remembers what she taught it last time.
- **Customization is expression, not a grind.** The best items commemorate what she
  figured out and can't be bought. Coins decorate; understanding unlocks.
- **No pressure tactics:** no streak guilt, no "Pip misses you 😢", no countdowns, no
  push notifications nagging.
- **Measure it honestly:** "came back on their own" (sessions with no assignment due)
  is the free-choice measure researchers use for intrinsic motivation.

## Make it theirs: alive, built by them, styled by them (stretch S8–S10)

Kids care for what they've built and what responds to them. People value things more
when they've made them themselves (the "IKEA effect", Norton, Mochon & Ariely 2012).

- **Alive, like a pet toy (S8):** tap, hold and poke reactions, small idle moments, and
  "Hear Pip say it": Pip reads the kid's own rule aloud in a robot voice. That's the
  Talking-Tom feeling without ever recording a child's voice.
- **Built by them, like a character creator (S9):** layered body, color, pattern, eyes,
  mouth, accessories, a randomize button, and **Pip's room** to decorate with coin items.
  Milestone cards hang on the wall, so the quiet flex lives in the room too.
- **Styled by them, like a mod (S10):** theme presets plus tweaks (colors, light/dark,
  bubbles, background, font size), saved as "My theme". Visual only.
- **Center theme:** the owner's colors and logo as the default student theme. A reason
  for the buyer to care about the fun layer.
- **Not for kids (yet):** uploading images or code, sharing user-made themes or items.
  Those need moderation and parent consent.

## The K.O. card: loud inside, quiet outside (stretch S5)

The game is chaotic; what leaves the game is calm. The card is a lowkey flex: if you know,
you know. It reads like a numbered collectible or a membership card, never a trophy.

- **Look:** matte near-black (`#14161F`), one thin metallic accent line (a soft
  sunshine-to-purple sheen), lots of empty space, small Inter type, 9:16 for stories.
- **Front (cryptic):** two small emoji, the struck-through wrong answer ("½ + ⅓ = ~~⅖~~"),
  "No. 0147", nickname, date. Nothing else. Outsiders see a nice card; players get it.
- **Back (tap to flip):** boss name, the student's winning rule in her own words, Pip's
  dumbest line. The full story is there for whoever asks.
- **Never:** XP, scores, "achievement unlocked", confetti, exclamation marks, rankings,
  the word tutoring, the center's name by default, rewards for saving or sharing.
- **Vault:** defeated bosses collect quietly on the student's home screen, like a shelf.

Why: rewards students expect for doing the task undermine wanting to do it (Deci,
Koestner & Ryan 1999). The card is pride in something they actually figured out, and the
student chooses whether anyone sees it.

## The three "wow" screens (design these with the most care)

1. **Pip's Brain** — a big card shaped like a thought cloud. Each rule is a "sticky note" in
   the student's own words, in quotes, with a small concept tag. The wrong rule glows coral
   with "Pip believes this 😵". When re-taught, it flips to mint with "fixed after 1
   re-teach". This is the video's money shot.
2. **Owner dashboard** (the video's first live frame) — top: Center insight banner "14 students
   share the same mistake: adding the bottoms" with a "Plan a workshop" button; below: the
   roster with the "Since last session" column (— vs. one-line summaries) and small Pip
   avatars next to students who've taught theirs.
3. **Mission card + boss** — horizontal path ① ② ③ → boss (emoji look + HP bar) → 🎓 Exam,
   with the "Why this matters" line on top and a sunshine XP counter. Unlocked weapons sit
   under the boss as small chips.

## Judge-ready landing page (the live URL's first screen)

Judges may open the URL with no guidance. The first screen must pitch itself:

- Headline: **"Every AI tutor plays the teacher. Pip plays the student."**
- Subline: "For tutoring centers: know what every student understands, before they walk in."
- Three big buttons: **Try as Maya (student)** · **Open as Ms. Rivera (tutor)** · **Owner view**.
- Small footer: "Demo center with synthetic data."
