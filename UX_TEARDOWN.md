# Pip UX teardown: Talking Tom, Kick the Buddy, The Sims, mods

UX research, Sat Oct 24. What to take from four reference games, what to leave behind, and what
changes for ages 10–15. Ends with a ranked build list by screen ("Now" = ships tonight in
React + r3f, mostly CSS, animation and copy; "Later" = roadmap).
**Notation:** `[n]` = sourced (list at bottom). *(inference)* = my read, not a checked fact.
Everything else is general game-design knowledge.

**In short:** take the *speed* and *physicality* of Talking Tom and Kick the Buddy, the
*authorship* of The Sims and mods, and the *deadpan* of Talking Ben (which teens made into a
meme on their own [9]). Leave out the ad flows, the two-currency stores and the guilt pets.
For 10–15, the mascot should feel like a designer vinyl toy, not a plush baby, and every line
should treat the player as the expert, because in Pip they are.

---

## 1. Talking Tom / Talking Ben (Outfit7)

Talking Tom Cat came out in June 2010, and Talking Ben in 2011; the signature mechanic is
poke/tickle reactions plus repeating your voice back in a higher pitch [7]. My Talking Tom is
rated **4+** on the App Store, and its listing discloses ads, in-app purchases and
auto-renewing subscriptions [6].

| What you can see | Notes |
|---|---|
| Layout and camera | Fixed front-on camera; the character fills ~60–70% of the portrait screen, centered, at eye level. Nothing competes with him. *(inference from play)* |
| Controls | The whole body is the button: poke the head, belly, feet or tail and each zone gets its own reaction. There's almost no UI between your finger and the character. |
| Juice | Hand-animated reactions (flinch, fall over, purr), each paired with a sound. Voice playback is pitch-shifted with lip flaps. |
| Customization | (My Talking Tom) a wardrobe and room furniture bought with coins; presented as a closet and a shop. |
| Onboarding | Under 5 seconds to first fun: open the app, poke, he reacts. No tutorial is needed because the affordance is the face. |
| HUD | Sparse in the original. In My Talking Tom: needs meters (hunger, sleep, fun), a coin counter, shop and ad buttons around the edges. |
| Color/type | Saturated primaries, a chunky rounded display face, glossy buttons. Reads as made for young kids. |
| Monetization | Coin store, ads offered for coins, cross-promotion of Outfit7's own games [6]. CARU (2014) found banner ads that a child could mistake for a game icon [8]; in 2019 CARU found inappropriate, unlabeled ads and an ad-cluttered privacy policy [8]. |

**What you can't see**
- **Core loop:** poke → instant reaction → laugh → poke a different spot. My Talking Tom adds
  the care loop on top (feed, sleep, wash → needs refill → come back).
- **Latency is the product.** Under ~100 ms, a reaction feels *caused by you* [5]. Past that,
  he feels like a video. This matters more than art quality. *(inference)*
- **Variable reward:** the same poke rolls one of several reactions, so you keep poking to
  see what comes up.
- **Parasocial bond:** he says *your* words, so the character feels like it's about you. This
  is the strongest single mechanic and it costs nothing to run.
- **Return hooks:** draining need meters and "Tom is hungry" style pulls. Researchers coded
  this kind of parasocial pressure as manipulative design [3].
- **Failure is safe:** there's no fail state at all, which is right for a toy but gives you
  no arc.
- **Alive:** idle fidgets, blinks and yawns when you aren't touching him. He exists when
  you aren't looking.

**Talking Ben is the one to study.** A grumpy old dog who answers only "Yes / No / Ho ho ho /
Ugh". Teens remixed him into a TikTok meme in Feb 2022 (millions of views, 26k+ videos in under a
week) [9]. A deadpan, limited character that answers literally is exactly what tweens and teens
enjoy ironically. That's Pip's personality.

**Avoid:** need meters that drain while you're away; "Tom misses you" notifications; ads for
coins; anything that could look like a game button but is an ad [8]; recording a child's
voice (Pip reads the kid's *typed* rule aloud instead, per DESIGN.md).

---

## 2. Beat-the-boss toys: Kick the Buddy (Playgendary), Whack Your Boss

Kick the Buddy is rated **12+ / 13+** on the App Store (cartoon and realistic violence, in-app
purchases) [10]. It sells weekly/monthly/yearly subscriptions ($7.99/wk after a trial) and
uses two currencies: Bucks (earned) and Gold (mostly bought), which can't be exchanged for
each other [11].

| What you can see | Notes |
|---|---|
| Layout and camera | A side-on arena; the ragdoll sits center stage, ~40% of the screen height, with room to fly. The weapon tray sits along the bottom edge. |
| Controls | Pick a weapon from the tray, then tap or drag on the Buddy. Physics does the rest, so the same action plays out differently each time. |
| Juice | Everything at once: ragdoll physics, squash on impact, particles, screen shake, a brief freeze on big hits, comic sounds, coins popping out. That's the "juice" Jonasson and Purho demoed in "Juice it or lose it" (GDC 2012) [12]. |
| Customization | Outfits for the Buddy and a large weapon catalog sorted into categories [11]. |
| Onboarding | About 3 seconds: a weapon is already in your hand. |
| HUD | Dense: two currency counters, a shop, a subscription badge, ad offers, a weapon tray. |
| Monetization | Ads offered for extra uses, weapons with limited uses per round, subscriptions that hand out daily currency [11]. |

**What you can't see**
- **Core loop:** pick a weapon → hit → spectacle → earn Bucks → unlock a weapon → hit
  differently. It's novelty-driven: the fun is "what does *this* one do?".
- **Hit-stop is what sells impact:** a 50–100 ms freeze on contact, then release. Shorter
  isn't noticed; longer reads as lag [12b].
- **Catharsis without consequence:** the Buddy always comes back, so nothing is ever lost.
- **Variable reward** comes from physics, not from a random drop. That's the clean kind of
  randomness, because outcomes differ but you aren't gambling for them. *(inference)*
- **Session length:** 2–5 minutes, a snack game. *(inference)*

**For Pip:** the boss is the misconception, so the *weapon is the concept* and the
*hit is an explanation*. That's Habgood's "intrinsic integration" (DESIGN.md). Copy the
feedback grammar of Kick the Buddy, not its economy.

**Avoid:** weapons that can be used up (the meter-to-paywall pattern); two currencies;
subscription prompts; real-world-weapon realism; blood. And don't let tapping cause damage:
HP moves only on judged explanations (this is already in the spec).

---

## 3. The Sims (Create a Sim + Build mode)

The Sims 4 is rated **T** (crude humor, sexual themes, violence) [13]; its base game went
free on Oct 18, 2022 while expansions and kits stay paid [14]. So it isn't a game for our
youngest users, but its *creation UX* is the benchmark.

| What you can see | Notes |
|---|---|
| Layout and camera | Create a Sim: the character stands full-height, center-left, on a neutral backdrop, with the editing panel on the right. The camera zooms in on the body part you're editing. |
| Controls | Click directly on a body part to edit it, or drag to sculpt. Thumbnail grids for each category, a **randomize** button, swatches for color variants. |
| Juice | The Sim *reacts while you edit*: poses, glances at the camera, a different idle per personality trait. Build mode objects drop in with a soft bounce and a sound. |
| Customization | Layered: body → face → hair → outfits per occasion → traits and aspirations. Swatches multiply each item into many. |
| Onboarding | Can take hours, and that's the point. For us it has to be optional and skippable. |
| HUD | Heavy, but tucked into panels; the live view always stays dominant. |
| Monetization | Paid packs show up as locked items in the catalog *(observed)*, so you keep seeing what you don't own. |

**What you can't see**
- **IKEA effect:** people value what they made themselves more (Norton, Mochon & Ariely,
  in DESIGN.md). Creation is investment, so the Sim becomes *yours*.
- **Identity play:** for tweens and teens, building a character is a way to try out
  identity without real-world risk. *(inference, consistent with [4])*
- **Undo everywhere:** you can't ruin anything, so experimenting is free.
- **Stories happen on their own:** autonomous Sims do odd, funny things you didn't script.
  The same kind of comedy as Pip following a rule literally.

**Avoid:** catalogs where items you can't get keep advertising themselves; a long creation
step blocking the first minute of fun; any paid bundle.

---

## 4. Mods, skins and UI themes (Minecraft, Roblox)

Minecraft is rated **E10+** (fantasy violence) [15]; Minecoins buy skins, texture packs
and worlds on the Marketplace [15]. Roblox is rated **T** by the ESRB, with "In-Game
Purchases (Includes Random Items)" [16]. Roblox requires creators to disclose the odds for
paid random items [16].

| What you can see | Notes |
|---|---|
| Customization surface | Skins (the avatar), texture packs (the whole world), UI themes (the frame around everything). Each one changes how the *whole game* looks, not a single item. |
| Presentation | A live preview first: the skin rotates on a turntable, texture packs swap in place. |
| Status | A rare or self-made skin is visible to everyone else, so it works as identity and status. |
| Monetization | Premium currency (Minecoins, Robux) bought in bundles that don't match prices, so you always have leftovers; Roblox allows paid random items with disclosed odds [16]. |

**What you can't see**
- **Authorship beats acquisition:** a skin you edited pixel by pixel means more than one you
  bought. It's the IKEA effect again.
- **A theme is a cheap, high-ownership change:** swapping tokens (colors, font, background)
  makes the app *feel like mine* at almost no engineering cost. *(inference)*
- **Trust and safety cost:** user-generated content means moderation. DESIGN.md already
  rules out uploads and sharing for kids for now. Right call.

**Avoid:** premium currency (FTC v. Epic: $245M refund over purchase dark patterns [17];
HoYoverse: $20M and a ban on under-16 purchases without parental consent [18]); loot boxes
(Belgium's regulator found three games' loot boxes to be illegal gambling in 2018 [19]);
currency bundles designed to leave a remainder.

---

## 5. Ages 10–15 are not Talking Tom's audience

Teens are more sensitive than kids to being treated with respect and given status, and
interventions that talk down to them backfire [4]. In a study of apps used by 3–5-year-olds,
80% of apps had manipulative design, mostly parasocial pressure and lures to keep playing
[3]. Older kids notice those tricks faster and resent them more. *(inference)*

| Dimension | Young kid (Talking Tom, ~4–8) | Ages 10–15 | Pip move |
|---|---|---|---|
| Autonomy | Happy to be guided | Wants choices and to skip things | They choose the step order, the look, a skippable creator, "Skip intro" on every animation |
| Status and identity | Not a concern | Everything is a concern; peers are watching | Quiet flex (K.O. card numbers, commemorative items); nothing childish on screen |
| Cringe sensitivity | Low | Very high: adult-written slang = instant cringe | No slang, no "Great job!", no exclamation marks in Pip's lines; a narrator who doesn't try |
| Humor | Slapstick, silly voices | Deadpan, absurd, ironic, meme-literate (Talking Ben [9]) | Deadpan Pip + absurd boss. The straight man/chaos pair is the joke |
| Aesthetics | Plush, baby proportions, glossy primaries | Designer toy, collectible, "clean", dark mode | A vinyl-figure mascot, matte materials, limited palette, a dark-first K.O. card |
| Text vs. voice | Voice and touch | Text first (often in class or around family); voice when it's funny | Text chat; "Hear Pip say it" robot TTS on demand only, muted by default |
| Social sharing | Parent shares | Screenshots, stories, group chats | 9:16 K.O. card; a cryptic front so outsiders don't get it; no rewards for sharing |
| Speed | Patient with long animations | Skips anything over ~1 s that repeats | Hit sequence ≤ 900 ms total; tap-to-skip on everything over 1.5 s |
| Respect for time | Not their call | They notice when they're being farmed | Visible end ("3 steps left"), no countdowns, no "Pip misses you", a clean exit |
| Being judged | Wants praise | Hates being evaluated in public | Misses are always Pip's ("my brain has a bug"), never a red ✗ |

**What still transfers:** reaction in under 100 ms; tactile feedback on every touch; a
character that idles, blinks and notices you; physical comedy (squash, wobble, fall-over)
aimed at the *boss*; a little surprise in each reaction (variety without randomized prizes).

---

## 6. Apply to Pip

### 6a. Feedback numbers (put these in `tokens.css` as variables)

| Cue | Spec | Why |
|---|---|---|
| Tap → first visible reaction | **≤ 100 ms**, i.e. on `pointerdown`, not `click`; optimistic, never waiting on the network | Miller/Nielsen 0.1 s limit [5] |
| Send → "Pip is listening…" | ≤ 100 ms; Pip leans forward 4°, head tilts | Show the AI wait *on the character*, not a spinner |
| AI reply over 1 s | Typing dots + Pip writing/thinking animation; over 8 s, show "still thinking" and a retry | 1 s / 10 s limits [5] |
| Hit-stop | **70 ms** freeze (pause tweens, hold the frame) on hit, 120 ms on the K.O. hit | 50–100 ms band [12b] |
| Boss shake (hit) | translateX ±**8 px**, rotate ±1.5°, 4 oscillations, **280 ms**, ease-out decay | Clearly felt but not nauseating *(inference)* |
| Boss shake (heal/gloat) | scale 1 → 1.08 → 1, wobble ±3°, 360 ms, plus a smug bob | Distinct from a hit |
| Screen shake | **Only on K.O.**: ±4 px, 200 ms; never on chat text | Keeps the chat readable |
| Squash/stretch | scaleX/Y (1.15, 0.85) → (0.95, 1.05) → 1 over **240 ms**, `cubic-bezier(.34,1.56,.64,1)` | Classic 3-step overshoot |
| HP bar | Fill drops instantly; a white "ghost" bar trails, waits 150 ms, then drains over 450 ms | Fighting-game health bar; impact first, then loss |
| Damage number | "−40" floats up 28 px and fades over **700 ms**; coral for boss HP only | Readable value without a score against the student |
| Caption | Slides in 160 ms, holds 2.8 s, tap to dismiss | Current code holds for 3.4 s; shorten it |
| Weapon unlock | Chip pops scale 0 → 1.1 → 1 in 220 ms plus a single sparkle; no full-screen modal | Small win, small celebration |
| Idle | Breathing scale 1.00–1.02 on a **3.2 s** loop; blink 120 ms at a random 2.5–6 s; a look-around every 8–14 s | It exists when you aren't looking |
| Poke variety | 4–6 reactions per zone, no repeats twice in a row | Variety without loot |
| Haptics | `navigator.vibrate(10)` on hit, `[15,40,15]` on K.O. (Android only; iOS Safari has no Vibration API) | Progressive enhancement |
| Sound | Off by default with a visible toggle; under 300 ms each: pop (tap), thwack (hit), boing (heal), low gong (K.O.) | They're often in class *(inference)*; turn it on for the demo video |
| Reduced motion | `prefers-reduced-motion`: no shake or hit-stop; a 150 ms opacity/color flash instead | base.css already zeroes animations; keep a non-motion signal |

### 6b. Mascot art direction (ages 10–15, still great on video)

- **Reference class:** designer vinyl / art toy (blind-box figure on a shelf), *not* plush
  or a baby animal. Collectible, a bit odd, cool because it doesn't try.
- **Silhouette:** readable as a solid black shape at 48 px. One defining feature per creature
  (bot: rectangular head + antenna; blob: teardrop with a single cowlick; doodle: flat ink
  outline that wobbles when it moves).
- **Proportions:** head:body **~1:1 to 1.2:1** (baby mascots are about 2:1). Short stubby limbs, a
  low center of gravity, plants firmly on the ground. Slight 3/4 turn by default.
- **Eyes = deadpan.** Small, set wide, **pill or capsule shaped, matte black with one
  specular dot**. Default lids at ~30% closed. No big shiny irises, no lashes. Emotion comes
  from lid height, eyebrow-less tilt and a slow blink, not from eye size. The 💡 mood is
  a single eyebrow-like lid lift plus the eyes going round for 400 ms.
- **Materials (r3f):** `MeshPhysicalMaterial`, roughness **0.55–0.7**, metalness 0,
  clearcoat 0.2–0.3 (soft-touch vinyl). One accent material per figure: an enamel badge or
  a brushed-metal antenna (metalness 0.8, roughness 0.35). Avoid glossy candy plastic.
- **Color:** 2–3 colors per figure from the palette, named like sneaker colorways ("Ink /
  Sunshine", "Paper / Pip Purple", "Mint / Ink"). Allow monochrome. Never rainbow.
- **Lighting:** soft key from upper left, a cool rim light, drei `ContactShadows`
  (opacity 0.35, blur 2.5). Plain paper backdrop on light screens; near-black on K.O.
- **Accessories:** nerdy and earned, not "cool teen". Pencil behind the ear, a clip-on
  **Brain v2** badge, a tiny backpack, a scarf, a desk lamp, a commemorative pin per K.O. boss
  ("⅙ pizza slice pin"). ⚠ `three/index.jsx` and `Mascot.jsx` currently list `cap` and
  `headphones`; DESIGN.md explicitly bans caps, headphones and sunglasses. Swap them for
  `pencil`, `badge`, `backpack`.
- **Motion personality:** slow and deliberate. Pip moves 20% slower than the boss; the boss
  is bouncy and over-animated. The contrast in tempo is the straight-man joke.

### 6c. Ranked build list by screen

| # | Screen | Item | When |
|---|---|---|---|
| 1 | Boss fight | **Make the shake real.** `Boss.jsx` adds `shake-hit` / `shake-heal` classes, but no CSS defines them, and `main.jsx` imports `styles/student.css`, which doesn't exist yet. Add the keyframes from 6a. | **Now** |
| 2 | Boss fight | Hit sequence: hit-stop 70 ms → squash + shake 280 ms → "−40" float → ghost HP drain. Total ≤ 900 ms, then the caption. | **Now** |
| 3 | Mascot stage | Poke reacts on `pointerdown` in ≤ 100 ms: a squash, a different reaction per zone (head/body), no repeats twice in a row. Pure transform on the r3f group, no network. | **Now** |
| 4 | Mascot stage | Idle life: 3.2 s breathing, random blink, an occasional look-around; eyes follow the pointer within ±15°. | **Now** |
| 5 | Chat | Boss taunts once when typing starts (debounced, at most once per 20 s); Pip leans in on send; "Pip is listening…" on the character, not a spinner. | **Now** |
| 6 | Pip's Brain | The wrong rule's sticky note **wobbles ±2° once** on reveal and glows coral; on fix, a 400 ms flip to mint. Rules use the student's quotes verbatim. The money shot, so give it the extra polish. | **Now** |
| 7 | Quiz | Pip shows the work step by step (300 ms per line, typewriter), then the 😵 face plus a fall-over squash on the odd result. Never a red ✗. | **Now** |
| 8 | K.O. / card | K.O.: 120 ms hit-stop, ±4 px screen shake, the boss squashes flat and leaves (scale y→0.1, x→1.4, then slides out, 500 ms). Then a cut to calm: the matte card with a slow 6 s metallic sheen sweep. No confetti, no exclamation marks. | **Now** |
| 9 | Copy, all student screens | Cringe pass: remove "!" from Pip's lines, no "Awesome/Great job", toast reads "Weapon unlocked: …" without 🔓 spam if several unlock at once (group them). | **Now** |
| 10 | Mascot / customization | Mascot art direction from 6b: matte vinyl material, pill eyes with heavy lids, 1:1 head:body, swap cap/headphones for pencil/badge/backpack. | **Now** |
| 11 | Customization | Randomize button with a 300 ms spin-and-settle; named colorways; a live turntable preview (auto-rotate 0.4 rad/s, drag to spin). | **Now** |
| 12 | Mission card | Show the end: "② of ③ · then the boss · then Pip's exam". Completed steps get a mint check that pops in 200 ms. Skippable intro animation. | **Now** |
| 13 | All | Sound toggle (default off), 4 short cues; haptics on Android; `prefers-reduced-motion` fallbacks. | **Now** (sound **Later** if no assets) |
| 14 | Mascot stage | "Hear Pip say it": robot TTS (Web Speech API, pitch 0.6, rate 0.9) reads the student's saved rule. Their words, Pip's voice, no recording. | **Now** if 30 min free, else **Later** |
| 15 | Home / room | Vault shelf: defeated bosses as small matte figurines in a row, each with its commemorative pin; next boss as a shadow with half a name. | **Later** |
| 16 | Customization | Full Create-a-Pip: layered body, pattern, eyes, mouth, accessories; undo everywhere. | **Later** |
| 17 | Home / room | Pip's room: place items earned through understanding; K.O. cards hang on the wall. | **Later** |
| 18 | Settings | "My theme" mod panel: theme presets + token tweaks (accent, light/dark, bubble shape, font size). Visual only, no uploads. | **Later** |
| 19 | Mascot | Evolution forms per brain version (v1 → v2 → v3 changes the silhouette slightly, e.g. the antenna grows a second segment). | **Later** |
| 20 | Measurement | Log tap-to-reaction latency and "came back on their own" sessions. Turn this teardown's claims into data. | **Later** |

### 6d. Never (Pip red lines)
Ads of any kind · a purchasable or premium currency · loot boxes or random paid rewards ·
consumable weapons or energy meters · need meters that drain while away · "Pip misses you" /
streak notifications · countdown timers · locked catalog items that advertise purchases ·
recording the child's voice · user uploads or sharing between kids (until moderation and
parent consent exist) · rewards for sharing the card.

---

## Sources
1. DESIGN.md (this repo): Habgood & Ainsworth 2011; Norton, Mochon & Ariely 2012 (IKEA effect); Deci, Koestner & Ryan 1999.
2. EMERGENT_FULL_PROMPT.md, DEMO_SCRIPT.md (this repo).
3. Radesky et al. 2022, *JAMA Netw Open*, manipulative design in apps used by 3–5-year-olds: https://pmc.ncbi.nlm.nih.gov/articles/PMC9206186/ ; summary: https://michiganmedicine.org/health-lab/design-tricks-commonly-used-monetize-young-childrens-app-use
4. Yeager, Dahl & Dweck 2018, *Perspectives on Psychological Science* 13(1): https://pmc.ncbi.nlm.nih.gov/articles/PMC5758430
5. Nielsen Norman Group, response-time limits (after Miller 1968): https://www.nngroup.com/videos/3-response-time-limits-interaction-design/
6. My Talking Tom, App Store listing (4+, ads, in-app purchases, subscriptions): https://apps.apple.com/app/657500465
7. Talking Tom & Friends (Wikipedia; Talking Tom Cat in June 2010, Talking Ben in 2011): https://en.wikipedia.org/wiki/Talking_Tom_%26_Friends
8. CARU on Talking Tom Cat 2 (2014): https://bbbprograms.org/media/newsroom/decisions/caru-reviews-outfit-7-s-talking-tom-cat-2-app-recommends-modifications ; CARU on My Talking Tom (2019): https://www.sheppard.com/insights/blogs/caru-action-two-mobile-apps
9. Know Your Meme, Talking Ben the Dog (TikTok trend, Feb 2022): https://knowyourmeme.com/memes/talking-ben-the-dog
10. Kick the Buddy, App Store listings (12+ / 13+): https://apps.apple.com/app/id1435346021 , https://apple.co/2kZBkIY
11. Kick the Buddy currencies and listing: https://www.gamezebo.com/walkthroughs/how-to-get-more-stuff-in-kick-the-buddy/ , https://apps.apple.com/app/1278869953
12. Jonasson & Purho, "Juice it or lose it", GDC 2012 (summary): https://rpgplayground.com/research-making-a-juicy-game/ . 12b. Hit-stop range of 50–100 ms is a practitioner rule of thumb, not from the talk: https://eastondev.com/blog/en/posts/dev/20260521-game-feedback-feel/
13. ESRB, The Sims 4 (T): https://www.esrb.org/ratings/37346/the-simstm-4/
14. EA Help, The Sims 4 free to play: https://help.ea.com/help/the-sims/the-sims-4/sims-4-free-to-play ; https://www.thegamer.com/the-sims-4-free-to-play-october-18/
15. ESRB, Minecraft (E10+): https://esrb.org/ratings/34986/Minecraft ; Minecoins: https://rewards-catalog.catalogapi.com/shop/item/5716663
16. ESRB on Roblox (T, random items): https://www.esrb.org/blog/what-parents-need-to-know-about-roblox-2/ ; Roblox paid random items policy: https://create.roblox.com/docs/production/monetization/paid-random-items
17. FTC, Epic Games $245M dark-patterns refund: https://www.ftc.gov/node/80648
18. FTC, HoYoverse/Genshin Impact settlement (Jan 2025): https://ftc.gov/business-guidance/blog/2025/01/level-tips-businesses-ftcs-settlement-genshin-impact-developer-hoyoverse
19. Belgian Gaming Commission on loot boxes (Apr 2018): https://gameinformer.com/b/news/archive/2018/04/25/belgium-classifies-loot-boxes-as-illegal.aspx
