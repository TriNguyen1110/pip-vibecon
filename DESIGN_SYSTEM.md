---
version: 1.0
name: Pip
description: >
  One forest-dark system with two registers. Studio (landing, tutor, owner, pricing) is calm
  editorial glass: Fraunces titles, Manrope body, Geist Mono facts, ice as the only action
  color, one shadow tier. Play (student screens) is the same palette made tactile: pill
  buttons with a pressed edge, soft Fraunces display, state glows, and short game motion.
  The boss fight is the loudest moment; the K.O. card is the quietest (matte near-black,
  one metallic hairline). Coral belongs to Pip's wrong rules and the boss's HP, never to
  the student's answers. Variable names match frontend/src/styles/tokens.css; NEW marks additions.

colors:
  ink:            { hex: "#001914", role: "page ground (forest)" }
  surface:        { hex: "#0A2721", role: "solid card, Play boss panel base" }
  surface-2:      { hex: "#12372E", role: "raised: Pip bubble, chips, composer" }
  surface-3:      { hex: "#1A4639", role: "highest raised: avatars, taunt bubble" }
  overlay:        { hex: "#10372E", role: "sheets, toasts, popovers (opaque)" }
  divider:        { value: "rgba(215,212,202,0.12)", role: "row hairlines" }
  border:         { value: "rgba(215,212,202,0.18)", role: "secondary button, chip edge" }
  glass-edge:     { value: "rgba(215,212,202,0.17)", role: "glass card edge" }
  fg:             { hex: "#EFEFE9", role: "titles, body, values (15.8:1 on ink)" }
  fg-muted:       { hex: "#D4D4CD", role: "descriptions, body on glass (7.1:1 on surface-3)" }
  fg-subtle:      { hex: "#A8B8AE", role: "metadata, eyebrows, placeholders (5.1:1 on surface-3)" }
  ice:            { hex: "#C9FCFC", role: "the one action color: primary button, links, next step" }
  ice-ink:        { hex: "#001914", role: "text on ice (16.4:1)" }
  ice-soft:       { value: "rgba(201,252,252,0.10)", role: "student bubble, Tuesday box fill" }
  ice-line:       { value: "rgba(201,252,252,0.32)", role: "student bubble edge, info pill edge" }
  ice-edge:       { hex: "#6FB7B9", role: "NEW Play primary button pressed-edge (decorative)" }
  focus:          { hex: "#A7DFE6", role: "2px focus ring everywhere" }
  sunset:         { hex: "#F59B76", role: "Studio warm accent; 'Misconception' pill text (7.4:1)" }
  ribbon:         { hex: "#62A2B2", role: "backdrop ribbon only" }
  success:        { hex: "#A6D4B4", role: "Studio ok pills" }
  warning:        { hex: "#F3C480", role: "Studio vague pills; Play failed-send edge" }
  danger:         { hex: "#EF968D", role: "Studio errors and destructive only" }
  coral:          { hex: "#FF8A7A", role: "Play only: boss HP fill, Pip's wrong rule glow (6.9:1 on surface)" }
  coral-soft:     { value: "rgba(255,138,122,0.14)", role: "boss panel wash" }
  coral-line:     { value: "rgba(255,138,122,0.55)", role: "wrong-rule chip edge" }
  coral-ink:      { hex: "#9E3427", role: "NEW coral text on paper notes (6.4:1 on note)" }
  mint:           { hex: "#8FE3B0", role: "Play: understanding meters, fixed rule, quiz pass (8.6:1 on surface-2)" }
  mint-soft:      { value: "rgba(143,227,176,0.12)", role: "pass row wash" }
  mint-line:      { value: "rgba(143,227,176,0.5)", role: "fixed chip edge" }
  mint-ink:       { hex: "#1F6B45", role: "NEW mint text on paper notes (5.8:1 on note)" }
  sun:            { hex: "#FFD27A", role: "Play: equipped weapon, unlock sparkle, coins, her quoted words (9.2:1 on surface-2)" }
  sun-soft:       { value: "rgba(255,210,122,0.14)", role: "equipped chip fill, quote highlighter" }
  sun-line:       { value: "rgba(255,210,122,0.55)", role: "NEW weapon hover edge" }
  note:           { hex: "#FBF3D9", role: "sticky-note paper" }
  note-ink:       { hex: "#1C241F", role: "text on note (14.3:1)" }
  note-ink-muted: { hex: "#4B5650", role: "NEW concept tag on note (6.9:1)" }
  ko-bg:          { hex: "#14161F", role: "NEW K.O. card matte near-black" }
  ko-meta:        { hex: "#9BA09C", role: "NEW K.O. card metadata (6.8:1 on ko-bg)" }
  pip-default:    { hex: "#B9A2FF", role: "NEW mascot default colorway (lilac, cream patch #E2D8FF); Y2K colorways bubblegum #FF8FC7, aqua #5FE3E8, lime #B8F04A, tangerine #FF9A3C are 3D materials only, never UI chrome or text" }
  holo:           { value: "conic-gradient(from 210deg, #FF8FC7, #FFD27A, #B8F04A, #5FE3E8, #B9A2FF, #FF8FC7)", role: "NEW Play-only holo sticker and K.O. number sheen" }
  chrome:         { value: "linear-gradient(180deg, #FFFFFF 0%, #D9DEE3 45%, #8E99A3 52%, #E9EEF2 100%)", role: "NEW Play-only chrome sticker, ice-ink text 6.3:1 at darkest stop" }

typography:
  fonts:
    display: "Fraunces (Google Fonts, axes ital,opsz,wght,SOFT,WONK)"
    sans: "Manrope 400-800"
    mono: "Geist Mono 400-500, font-feature-settings 'tnum'"
    url: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,400..800,0..100,0..1;1,9..144,400..800,0..100,0..1&family=Geist+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap"
  studio:
    hero:        { font: display, size: "36 / 48 @640 / 60 @1024", weight: 500, lh: 1.05, ls: "-0.02em", soft: 0 }
    page-title:  { font: display, size: "32 / 40 @640", weight: 500, lh: 1.1, ls: "-0.02em" }
    section:     { font: display, size: 24, weight: 500, lh: 1.2 }
    stat-number: { font: display, size: "40 (insight count 56)", weight: 500, lh: 1, numeric: "lining-nums tabular-nums" }
    card-title:  { font: sans, size: 18, weight: 700, lh: 1.35 }
    body:        { font: sans, size: 16, weight: 400, lh: 1.6 }
    small:       { font: sans, size: 14, weight: 500, lh: 1.5 }
    eyebrow:     { font: sans, size: 12, weight: 600, lh: 1.4, ls: "0.14em", case: upper }
    quote:       { font: display, size: 17, weight: 400, style: italic, lh: 1.5 }
    mono:        { font: mono, size: "13-14", weight: 400 }
  play:
    display:     { font: display, size: "32 / 44 @1024", weight: 700, lh: 1.05, ls: "-0.015em", soft: 100 }
    boss-name:   { font: display, size: "24 / 32 @1024", weight: 700, lh: 1.15, soft: 100, wonk: 1 }
    hud-name:    { font: sans, size: 15, weight: 800, lh: 1.2 }
    chat:        { font: sans, size: 16, weight: 500, lh: 1.5 }
    caption:     { font: sans, size: 16, weight: 800, lh: 1.3 }
    damage:      { font: mono, size: 22, weight: 500 }
    button:      { font: sans, size: 16, weight: 800, ls: "0.01em" }
    note-quote:  { font: display, size: 17, weight: 400, style: italic, lh: 1.45 }
    ko-equation: { font: display, size: 32, weight: 400, soft: 0 }
    ko-meta:     { font: mono, size: 12, ls: "0.08em" }
  floor: "14px for anything that carries information; 12px only for eyebrows and mono metadata"

rounded:
  sm: 10px      # --r-sm small buttons, mono chips
  md: 12px      # --r-md Studio buttons, inputs, panels
  lg: 16px      # --r-lg Studio cards; Play overrides to 20px
  xl: 22px      # --r-xl sheets; Play overrides to 28px (mission card, boss panel)
  note: 6px     # NEW sticky notes
  bubble: 18px  # NEW chat bubbles (tail corner 6px)
  ko: 20px      # NEW K.O. card
  cloud: 40px   # NEW Pip's Brain cloud
  pill: 999px   # NEW chips, Play buttons, composer, HP bar

spacing: { s1: 4px, s2: 8px, s3: 12px, s4: 16px, s5: 20px, s6: 24px, s8: 32px, s10: 40px, s12: 48px, s16: 64px, s24: 96px, gutter: "16px; 24px @768", content: 72rem, narrow: 44rem, measure: 68ch, tap: 44px }

elevation:
  glass:      "border 1px var(--glass-edge); var(--glass-fill); blur(10px) saturate(1.08); 0 20px 56px -30px rgba(0,0,0,.5), inset 0 1px 0 rgba(239,239,233,.05)"
  overlay:    "solid #10372E; 0 16px 40px -18px rgba(0,0,0,.7)"
  lift:       "NEW Play: 0 18px 40px -20px rgba(0,0,0,.7)"
  note:       "NEW 0 1px 0 rgba(0,0,0,.06), 0 12px 24px -14px rgba(0,0,0,.7)"
  edge-ice:   "NEW Play primary: 0 4px 0 #6FB7B9, 0 10px 24px -12px rgba(201,252,252,.45)"
  edge-dark:  "NEW Play secondary: 0 4px 0 #061F19"
  glow-coral: "NEW 0 0 0 2px #FF8A7A, 0 0 32px -6px rgba(255,138,122,.65)"
  glow-mint:  "NEW 0 0 0 2px #8FE3B0, 0 0 28px -8px rgba(143,227,176,.55)"
  glow-sun:   "NEW 0 0 0 1.5px #FFD27A, 0 0 20px -6px rgba(255,210,122,.6)"
  ko-card:    "NEW 0 40px 80px -40px rgba(0,0,0,.9); no blur, no glass"

motion:  # timings reconciled with UX_TEARDOWN.md section 6a (that file has the rationale and sources)
  instant: 100ms   # NEW budget: tap -> first visible reaction, on pointerdown, optimistic, never waits on the network
  fast: 160ms      # --fast hovers, chip states, taunt and caption slide-in
  med: 240ms       # --med sheets, toasts, card rise, squash-stretch
  slow: 450ms      # NEW HP ghost drain, note flip (400ms)
  ease: "cubic-bezier(0.2, 0.7, 0.2, 1)"        # --ease default
  ease-out: "cubic-bezier(0.16, 1, 0.3, 1)"     # NEW reveals, damage float, shake decay
  ease-pop: "cubic-bezier(0.34, 1.56, 0.64, 1)" # NEW Play only: squash-stretch, unlock pop, K.O. stamp
  hit-stop: "70ms on a hit, 120ms on the K.O. hit"
  shake-hit: "280ms ease-out decay, translateX +/-8px, rotate +/-1.5deg, 4 oscillations"
  shake-heal: "360ms, scale 1 -> 1.08 -> 1, wobble +/-3deg"
  squash: "240ms ease-pop, scale (1.15,0.85) -> (0.95,1.05) -> 1"
  screen-shake: "K.O. only: +/-4px, 200ms; never on chat text"
  hp: "fill drops instantly; white ghost waits 150ms then drains over 450ms"
  damage-float: "rise 28px, fade, 700ms"
  caption: "slide in 160ms, hold 2.8s, tap to dismiss"
  unlock-pop: "220ms, scale 0 -> 1.1 -> 1, one sparkle"
  hit-sequence-max: "900ms from hit-stop to end of ghost drain, then the caption"
  idle: "3D: breathe scale 1.00-1.02 over 3.2s; blink 120ms every 2.5-6s (random); look-around every 8-14s; Pip moves 20% slower than the boss"
  ai-wait: "send -> 'Pip is listening' + 4deg lean within 100ms; dots after 1s; 'still thinking' + retry after 8s"
  skip: "anything over 1.5s is tap-to-skip; intros show 'Skip intro'"
  reduced: "prefers-reduced-motion: no shake, hit-stop, bob, float, flip or sweep; a 150ms opacity/color flash marks the event instead; captions and labels still appear"
---

# Pip Design System

## Visual Theme & Atmosphere

Pip lives on willder's forest ground (`#001914`) under a faint ice ribbon with a sunset edge and a 9% soft-light grain. Text is ivory, actions are ice, and every surface is glass or a solid forest step. One identity, two registers, switched by one attribute on the shell root: `data-register="studio"` (default) or `data-register="play"` (set when `Shell` gets `game`).

**Studio** (landing, tutor, owner, gap report, pricing, parent preview) borrows Oura's editorial calm and Linear's precision: Fraunces titles at weight 500 with stone relief, Manrope body, Geist Mono for counts, dates and IDs, hairline rows instead of boxes, one shadow tier, one filled ice button per screen, no spring easing, no glows. Coral never appears; a misconception reads as a sunset pill and the boss is a neutral chip.

**Play** (student home, mission, Pip's Brain, quiz, K.O.) keeps the palette and adds PlayStation and Spotify energy with Airbnb warmth: Fraunces at weight 700 with `SOFT 100` (rounded, friendly, still the brand face), pill buttons with a 4px pressed edge, 20 to 28px card radii, state glows (coral, mint, sun), a 1.04 hover-scale on anything collectible, and short game motion. The 3D Pip, boss and garden carry Y2K charm (glossy candy plastic, bubblegum/aqua/lime/lilac/tangerine colorways, a holo or chrome accent) and are the main color source on screen; the UI stays forest, with only small Y2K accents (gloss highlights, holo stickers, star-glints), so the mascot and boss pop.

Volume map, loudest to quietest: boss hit (shake, flash, floating damage) > K.O. stamp > weapon unlock > Brain note flip > chat > mission card > Studio screens > the K.O. card, which is matte, silent and nearly empty.

## Color Palette & Roles

- **Ground ladder:** `--ink` page, `--surface` solid card, `--surface-2` raised element, `--surface-3` highest raised, `--overlay` for anything floating. Glass (`.glass`) sits over the backdrop; dense lists use solid surfaces.
- **Text roles:** `--fg`, `--fg-muted`, `--fg-subtle` only. Never an alpha step of ivory. All three pass 4.5:1 on ink, surface, surface-2 and surface-3 (worst case fg-subtle on surface-3: 5.1:1).
- **Ice** is the single action color in both registers: primary button, links, focus-adjacent highlights, the mission's next step. Text on ice is `--ice-ink`.
- **Play state colors** (never in Studio):
  - `--mint`: the student's progress. Understanding meters, fixed rules, quiz passes, taught steps.
  - `--sun`: the student's wins. Equipped weapon, the unlock sparkle, coins, the highlighter behind her quoted words in Pip's "Saving that:" lines.
  - `--coral`: the boss and Pip's wrong beliefs. HP fill, boss panel wash, the boss's damage and heal floaters ("−40", "+20 HP"), wrong-rule glow, a missed quiz row's 3px edge. It never touches her chat bubble, her composer, her name, or any status about her.
- **Paper:** `--note` with `--note-ink`; on paper use `--coral-ink` and `--mint-ink` for labels, because coral and mint fail contrast on cream.
- **Studio status pills:** Explained well `pill--ok` (success), Vague `pill--warn` (warning), Misconception `pill--gap` (sunset). Errors and destructive actions use `--danger`.
- **K.O. card:** its own closed palette: `--ko-bg`, `--fg`, `--ko-meta`, plus the metallic hairline gradient `linear-gradient(90deg, transparent, #8F8A7A 12%, #EFE6C8 38%, #C9FCFC 55%, #F59B76 72%, #8F8A7A 88%, transparent)`.
- **Mascot:** `--pip-default` and the Y2K colorways are 3D materials only. Customized colors live in the canvas, never in UI chrome. In the UI, the Y2K palette appears only through `--holo` and `--chrome` on Play stickers and the K.O. number.
- Color never carries meaning alone: every glow has a label ("Pip believes this 😵", "fixed after 1 re-teach"), every pill has a word.

## Typography Rules

- Load the URL in front matter once in `index.html` (it adds the `SOFT` and `WONK` axes to the current Fraunces request; verified 200).
- Studio display: `.display { font-variation-settings: "SOFT" 0, "WONK" 0; font-weight: 500; }` plus `text-shadow: var(--heading-shadow)` on h1/h2 only.
- Play display: `[data-register="play"] .display, .boss__name, .ko__stamp { font-variation-settings: "SOFT" 100, "WONK" 0; font-weight: 700; }`. Boss names add `"WONK" 1` for a slightly unhinged lean. No heading shadow in Play: the soft face reads better clean.
- Manrope does all UI: 15px/700 Studio buttons, 16px/800 Play buttons, 16px/500 chat, 14px/500 supporting, 12px/600 uppercase 0.14em eyebrows.
- Geist Mono with `tnum` for HP ("60 HP"), damage ("−40"), grades, dates, "No. 0147", "Brain v2", quiz progress "2/3". Never mono capitals as labels.
- The student's own words are always Fraunces italic 17px (note quotes, gap-report evidence, K.O. back, "Saving that: '…'" segments). Her words get a typeface; nobody else's do.
- Line lengths: body max 68ch; chat bubbles max 82% of column on phones, 60ch on laptop.
- Minimums: 16px for body and every input (prevents iOS zoom), 14px for anything informative, 12px for eyebrows and mono metadata only.

## Component Stylings

**Buttons.** Studio (`.btn`): 44px tall (`.btn--lg` 52px), padding 0 18px, `--r-md`, Manrope 700 15px. Primary: ice fill, ice-ink text, hover `#DCFEFE`, active `scale(.98)`. Secondary (`.btn`): transparent, 1px `--border`, hover border `--field-border-hover` and fill `rgba(239,239,233,.04)`. Ghost (`.btn--ghost`): no border, `--fg-muted`, hover `--fg` with a `--divider` border. Play overrides: radius 999px, Manrope 800 16px, height 52px for the screen's main action; primary adds `box-shadow: var(--edge-ice)` and on `:active` `transform: translateY(3px); box-shadow: 0 1px 0 #6FB7B9`; secondary gets `--surface-2` fill and `var(--edge-dark)`; hover (pointer: fine) `translateY(-1px)` over 160ms. Disabled: opacity .5, no edge, no transform. One primary per screen in both registers.

**Inputs.** Existing `.input/.textarea/.select`: 44px min, `--r-md`, 1px `--field-border` (3.7:1 on surface-2), fill `--field-bg`, 16px text, focus `outline 2px var(--focus)`. Labels 14px/600 `--fg-muted` above, 6px gap. Errors: 14px `--danger` line below with an icon, field border `--danger` (Studio only).

**Composer (Play).** `.composer-wrap` sticky bottom 0, z 30, padding `8px var(--gutter) calc(8px + env(safe-area-inset-bottom))`, background `linear-gradient(to top, var(--ink) 72%, transparent)`. `.composer`: flex, min-height 52px, radius 999px (24px once it grows past one line), `--surface-2` fill, 1px `--field-border`, padding 4px 4px 4px 16px, `:focus-within` 2px `--focus` outline. `.composer__input`: borderless, 16px, auto-grow 1 to 5 lines (max 132px). `.composer__send`: 44px circle, ice fill, ice-ink arrow 20px; disabled `--surface-3` with `--fg-subtle` icon. The "I'm done teaching, quiz Pip!" `.quiz-btn` sits directly above the composer, full width; `.is-ready` makes it primary and plays one 600ms ring pulse (`0 0 0 0 → 0 0 0 8px rgba(201,252,252,0)`).

**Mission card (`.mcard`).** Glass, Play radius 28px, padding 16px (24px at 768). Order: `.mcard__why` (eyebrow "Why this matters" then 15px `--fg-muted`), the path, `.mcard__next`. `.mpath` on phones is a scroll-snap rail: `display:grid; grid-auto-flow:column; grid-auto-columns:144px; gap:8px; overflow-x:auto; scroll-snap-type:x mandatory`, right edge faded with a 16px mask, and the `.is-next` step scrolled into view on load. At 768+: `grid-template-columns: repeat(3, minmax(0,1fr)) 112px 112px`, no scroll. Connectors: `.mpath__item:not(:last-child)::after` 2px line in `--divider`, `--mint` once the left step is taught. `.mstep`: button, min-height 96px, padding 12px, radius 16px, fill `rgba(239,239,233,.03)`, 1px `--divider`, grid gap 8px; `.mstep__n` 28px circle `--surface-3` Manrope 800 14px; `.mstep__text` 14px/600, 2-line clamp; `.meter` 6px pill track `rgba(239,239,233,.08)`, fill `--mint`, width transition 450ms ease-out. States: `.is-next` 1.5px `--ice` border plus `0 0 0 4px var(--ice-soft)`, number circle ice with ice-ink; `.is-taught` number circle mint with ink "✓"; `.is-focus` fill `--surface-2`; `.mstep--boss .meter` fill coral; `.is-ko` emoji `grayscale(1) opacity(.55)` plus a mono "K.O." label. A taught step's mint check pops in over 200ms ease-pop. `.mcard__next`: 15px/600 `--fg`, arrow in ice; the `--done` variant uses mint text. It always shows where the mission ends, e.g. "② of ③ · then the boss · then Pip's exam". Students respect a visible end; no countdowns. `.mcard--compact` (sticky during chat at 1024+): nodes only (28px circles in a row) plus the next line, max 64px tall.

**Boss panel (`.boss`), the loudest component.** Background `radial-gradient(80% 60% at 50% 0%, var(--coral-soft), transparent 70%), var(--surface)`, 1px `rgba(255,138,122,.28)` border, radius 28px, padding 20px (24px at 1024), `--lift` shadow. `.boss__top`: emoji 64px (88px at 1024) with a 2.4s ease-in-out idle bob of −4px, then eyebrow "Boss · lives in Pip's head" and `.boss__name` (Play display, WONK 1). `.boss__story` 15px `--fg-muted`. HP (`.hp--big`): 14px tall pill, track `rgba(239,239,233,.08)` with `inset 0 1px 2px rgba(0,0,0,.4)`, fill `linear-gradient(90deg,#FF6F5E,#FF8A7A 60%,#FFB4A3)`. The fill drops instantly (no width transition on damage). A `.hp__ghost` span behind it (`rgba(239,239,233,.7)`) keeps the old width for 150ms, then drains over 450ms ease-out: impact first, then loss. Heals grow the fill over 240ms. `.hp__label` is Geist Mono 13px `--fg-muted` above the bar, right-aligned. Compact `.hp` is 8px. The boss is the over-animated one: bouncy, fast, a 2.4s idle bob of −4px.
- **Hit sequence (`.shake-hit`), 900ms at most from hit-stop to the end of the ghost drain:** a 70ms hit-stop (the boss holds still, `animation-delay: 70ms`); then squash, `scale(1.15,.85) → (.95,1.05) → 1` over 240ms ease-pop, running together with the shake, `translateX(±8px) rotate(±1.5deg)` in 4 decaying oscillations over 280ms ease-out; the emoji flashes `brightness(1.8) saturate(.4)` for 90ms; a `.dmg` floater "−40" (Geist Mono 22px `--coral`, `text-shadow 0 2px 8px rgba(0,0,0,.6)`) rises 28px and fades over 700ms; then the ghost drains, and only then does the caption appear. The page never shakes on a normal hit, and chat text never moves. Optional `navigator.vibrate(10)` (Android only).
- **Heal (`.shake-heal`):** no translate shake. Over 360ms the boss gloats: `scale(1 → 1.08 → 1)` with a ±3deg wobble and a smug bob. The panel border pulses to solid coral twice (2 × 240ms), and a "+20 HP" floater appears in coral mono.
- **Whiff (`.shake-whiff`):** the emoji tilts `rotate(-6deg)` and back over 280ms. Caption: "Addini Bottomini is unbothered." in `--fg-muted`.
- **Captions (`.caption--hit|heal|whiff`):** centered system lines in the chat flow, Manrope 800 16px `--fg`, 12px above and below, never attached to her bubble; `role="status"`. They slide in over 160ms, hold for 2.8s, and dismiss on tap. The current 3.4s hold is too long.
- **Taunt (`.taunt`):** `--surface-3` bubble, 1px `rgba(255,138,122,.35)`, radius 14px 14px 14px 4px, Manrope 600 italic 14px `--fg-muted`. It fires once when she starts typing, debounced, at most once every 20s. In over 160ms (fade plus 4px rise); auto-hides after 2400ms.
- **Reduced motion:** no hit-stop, squash or shake. The HP fill and the panel border flash for 150ms (opacity and color only); the damage number appears without moving; the caption is unchanged.
- **HUD (`.hud-wrap`)** on phones: sticky `top: 60px`, 56px tall, `rgba(0,25,20,.86)` + `blur(12px)`, bottom `--divider`; 28px emoji, `.hud__name` 15px/800 truncated, 8px HP, `.hud__eq` 13px `--sun` truncated to 40% width.

**Weapon chips (`.weapon`).** Button, min-height 44px, padding 0 16px, radius 999px, `--surface-2`, 1px `--border`, Manrope 700 14px `--fg`. Hover (pointer: fine): `scale(1.04)` and `--sun-line` border over 160ms ease-out; active `scale(.97)`. `.is-on`: `--sun-soft` fill, `var(--glow-sun)`, `.weapon__eq` 12px mono `--sun` "equipped". `.is-new` (first render after unlock) pops `scale(0 → 1.1 → 1)` over 220ms ease-pop with one sun sparkle (a 6px dot that scales out and fades over 400ms). No full-screen modal for an unlock. When several weapons unlock at once, they share one toast ("Weapons unlocked: Cleaver, Ruler") with no emoji pile-up. Weapons only come from explaining, are never used up, and nothing about them looks purchasable.

**Chat bubbles (`.msg`).** Column gap 4px within one speaker, 16px when the speaker changes. `.msg--pip` left: `.msg__face` 32px circle `--surface-3` with the mood emoji at 18px; `.msg__bubble` `--surface-2`, 1px `--divider`, radius `18px 18px 18px 6px`, padding 10px 14px, 16px/1.5 `--fg`. Quoted student words inside Pip's lines (`<q>`): Fraunces italic, `background: linear-gradient(transparent 55%, var(--sun-soft) 55%)` highlighter. `.msg--me` right: `--ice-soft` fill, 1px `--ice-line`, radius `18px 18px 6px 18px`, `--fg` text (10.4:1). Her bubble never changes color for being wrong. `.is-pending` opacity .7 with a 12px mono "sending"; `.is-failed` 1px dashed `--warning` and a linklike "Didn't send. Try again"; `.is-flash` (jumped to from a note) two 600ms pulses of `0 0 0 2px var(--sun)`.

**"Pip is thinking."** Within 100ms of send, the 3D Pip leans forward 4deg and tilts its head, and an `aria-live="polite"` line reads "Pip is listening…". The wait is shown on the character, not with a spinner. If the reply takes longer than 1s, a `.msg--pip` with `.dots` appears (three 6px dots, `--fg-subtle`, 1.2s blink, 0.2s stagger, min-width 56px), the label changes to "Pip is thinking…", and Pip plays its writing pose. After 8s, add a 14px `--fg-subtle` line "Still thinking. Long thought." and a secondary "Try again" button. Never a spinner in the chat.

**Pip's Brain (`.brain`).** `.brain__cloud`: `radial-gradient(120% 90% at 30% 0%, #1D4A3E, #12372E 60%)`, 1px `--glass-edge`, radius 40px, padding 28px 20px 32px (40px 32px at 1024), `--lift` plus `inset 0 1px 0 rgba(239,239,233,.06)`. Three `.brain__puff` circles (22, 14, 8px, same fill and border) trail from the bottom-left corner toward Pip's stage at offsets (40px, −18px), (22px, −36px), (10px, −50px). `.brain__head`: eyebrow "Pip's Brain", mono chip "v1". `.brain__notes`: grid, 1 column, 2 at 640, 3 at 1024, gap 16px. `.note`: button, `--note` paper, `--note-ink`, radius 6px, padding 16px 16px 12px, min-height 120px, `--note` shadow, tilt by position (`3n+1` −1.2deg, `3n+2` 0.8deg, `3n` −0.4deg), a tape strip `::before` 44×14px `rgba(239,239,233,.35)` at top center rotated −2deg; hover (pointer: fine) straightens to 0deg and rises 2px over 160ms. `.note__quote` Fraunces italic 17px in curly quotes; `.note__tag` 12px/600 uppercase 0.14em `--note-ink-muted`. `.note--wrong`: `var(--glow-coral)` plus the note shadow. On reveal it wobbles ±2deg once (300ms) and its glow breathes from 32 to 44px twice (2 × 1.6s), then holds still. `.note__flag` 14px/700 `--coral-ink` "Pip believes this 😵". `.note--fixed`: `var(--glow-mint)`, flag in `--mint-ink` "fixed after N re-teach". Wrong → fixed is a 400ms `rotateY(180deg)` flip with the content swapped at 50%; reduced motion swaps instantly. Quotes are always her exact words. This is the money shot, so polish it first.

**Quiz rows (`.qitem`).** Glass, radius 20px, padding 16px, 3px left edge. `.qitem__head`: `.qitem__n` 28px mono circle plus `.qitem__q` 16px/600. `.qitem__pip`: Pip's answer as a Pip bubble; `.qitem__line` the work in Geist Mono 14px `--fg-muted` on `rgba(239,239,233,.03)` with radius 10px and padding 10px 12px. The work types out one line every 300ms (tap to show it all; reduced motion shows it all at once). On an odd result, Pip shows 😵 and does a fall-over squash (240ms); `.qitem__rule` chip "Used rule ③" linking to its note (`.is-wrong` gets a `--coral-line` edge). `.qitem--pass`: mint edge, 🎉 or 💡 face, 14px/700 `--mint` "Pip got it". `.qitem--miss`: coral edge, 😵 face, `.qitem__bug` 15px/600 `--fg` "My brain has a bug. Help me fix it", and `.qitem__fix` as the screen's only primary, "Re-teach Pip". Never a ✗, a red row or a score against her; progress is three 10px dots (mint filled, coral ring, empty).

**K.O. screen (`.ko`), loud then quiet.** Phase 1, about 1.6s: the boss (3D or 112px emoji) centered on the arena; the "Pick a finishing move" weapon chips; on pick, a 120ms hit-stop, then the only screen shake in the product (the `.ko__stage`, ±4px, 200ms), and the boss squashes flat (`scale(1.4,.1)`) and slides out, 500ms in total. Optional `navigator.vibrate([15,40,15])`. The whole phase is tap-to-skip. `.ko__stamp` "K.O." in Play display at 72px, `rotate(-6deg)`, `scale(1.4 → 1)` over 240ms ease-pop. `.ko__finisher` caption 18px/800, `.ko__title` "Addini Bottomini has left Pip's brain." in Play display at 28px, `.ko__version` mono ice chip "Brain v1 → v2". No confetti, no exclamation marks. Phase 2, starting 400ms after the stamp: the card rises (opacity 0 → 1, 16px → 0, 480ms ease-out) on a `rgba(0,10,8,.86)` scrim. Then `.ko-next`: Pip's rumor question as a bubble, and the next boss as a silhouette (`.silhouette`: `filter: brightness(0)` at opacity .5, name half-masked "Divid████").

**K.O. card (`.ko-card`), the quietest component.** `aspect-ratio: 9/16`, width `min(78vw, 340px)`, `--ko-bg` with the grain tile at opacity .05 soft-light, 1px `rgba(239,239,233,.08)`, radius 20px, padding 28px 24px, `ko-card` shadow, flex column with space-between. Front: top row "No. 0147" (12px mono, 0.08em, `--ko-meta`) on the left and two 20px emoji on the right; the metallic hairline (1px, full width, 38% from the top, `background-size: 200%`) sweeps once, slowly, over 6s with `ease-in-out`, then stays still (the cut from the loud K.O. to calm); center equation Fraunces 400 32px `--fg` "½ + ⅓ =" with "⅖" in `--ko-meta` struck by a 1.5px line; bottom nickname Manrope 600 14px `--fg` and date 12px mono `--ko-meta`. Back (tap to flip; `perspective:1200px`, `rotateY(180deg)` 600ms `--ease`; reduced motion crossfades in 160ms): boss name Fraunces 600 20px, eyebrow "Your rule" plus her quote in Fraunces italic 17px, eyebrow "Pip said" plus his dumbest line at 14px `--ko-meta`. Below the card: ghost "Save image" and primary "Done". Never: XP, scores, "achievement", confetti, exclamation marks, rank, the center's name.

**Gap report (Studio).** `.report-head`: eyebrow "Gap report", `.h-page` student name, mono meta line at 14px `--fg-subtle` ("Fractions · 18 min teaching · quiz passed after 1 re-teach"). `.report-stats`: three stat tiles. `.gap-list` is divided rows, not cards (Linear): `.gap` grid `32px 1fr`, padding 20px 0, `--divider` between rows; `.gap__n` circled mono; `.gap__head` concept 16px/700 plus status pill; `.gap__quote` Fraunces italic 17px `--fg-muted` (not small or subtle) with a 2px `--divider` left rule and 14px padding; a "fixed after 1 re-teach" `pill--ok`; the boss as a neutral `.chip` "students call it Addini Bottomini 🍕🦵". `.tuesday`: `--ice-soft` fill, 1px `--ice-line`, radius 16px, padding 20px; eyebrow in `--ice` "Start Tuesday's session here"; opener 16px/1.6 `--fg`; `.tuesday__row` with a 112px label column (14px `--fg-subtle`) for Root cause and Pip's question (quote style). Parent preview `.phone`: max 320px, `--surface-3` bubbles with radius 18px, sender as an eyebrow.

**Roster (`.roster__list`).** Phones: rows with dividers, grid areas `"who action" "since since"`, padding 14px 0; `.roster__name` 16px/700, grade 13px mono `--fg-subtle`; since-last-session 14px `--fg-muted`, 2-line clamp, "—" in `--fg-subtle`; `.avatar--pip` gets a 2px ice ring plus a 16px Pip badge at the bottom-right. At 1024+: `.roster__head` visible (eyebrow style), columns `minmax(200px,1.1fr) 72px minmax(0,3fr) 132px`, min row height 64px, hover fill `rgba(239,239,233,.03)`, the whole row links to the report, action "Report →" linklike.

**Insight card (`.insight`).** Glass, padding 24px (32px at 1024); grid `2fr 1fr` at 1024, stacked below. `.insight__main`: eyebrow "Center insight", count in Fraunces 500 56px, "students share the same mistake:" 18px/600, `.insight__mis` "adding the bottoms" in Fraunces italic 24px, boss chip, primary "Plan a workshop". `.insight__stat` holds the stat tile "Came back on their own this week".

**Stat tile (`.stat`).** `.panel` (`rgba(239,239,233,.03)`, 1px `--divider`, radius 12px, padding 16px); eyebrow label; `.stat__n` Fraunces 500 40px/1, lining tabular numerals; caption 14px `--fg-muted`. A missing measurement shows "—" with "not measured yet", never 0.

**Pricing card (`.price`).** One glass card, max-width 440px, centered, padding 28px; eyebrow "Pilot"; `.price__big` "$4" in Fraunces 500 64px plus "/ active student / month" 16px `--fg-muted`; "$99 minimum" 14px mono `--fg-subtle`; `.price__calc` range plus a mono result ("120 students → $480/mo"); `.price__list` four 15px items with 16px ice checks; primary block "Start pilot"; 12px eyebrow footnote "Stripe test mode".

**Toasts, empty, error, loading.** `.toast` stays on `--overlay` with a 3px left edge: `--success` ok, `--ice` info, `--danger` error (Studio) or `--warning` (Play). Auto-dismiss after 4s, at most 2 stacked, `role="status"`; on screens with the composer, `bottom: calc(76px + env(safe-area-inset-bottom))`. `.state`: 40px Pip face, 18px/700 title, one 15px `--fg-muted` line, one button. Play errors are deadpan and never blame her ("Pip lost the thread." plus a secondary "Try again"); Studio errors are plain ("Couldn't load the roster." plus "Retry"). Loading uses `.skeleton` bars (Studio tables: five 56px rows), and `.dots` in chat; spinners only inside buttons.

**3D canvas placement.** The canvas is transparent (`alpha: true`) with no box: Pip stands on the page on drei `ContactShadows` (opacity .35, blur 2.5). Lighting: a soft key light from the upper left and a cool rim light (`#A7DFE6`) that separates Pip from the forest ground. DPR capped at 1.5, 30fps, paused offscreen and when the tab is hidden, a still pose under reduced motion, `.stage-fallback` emoji if WebGL fails, a circular `.skeleton` while loading. No text ever sits on the canvas. Touch: a poke reacts on `pointerdown` within 100ms with a squash and one of 4–6 reactions per zone (head, body), never the same one twice in a row, with no network call. Eyes follow the pointer within ±15deg.

**Mascot, boss and garden art direction: Y2K charm.** This overrides the matte-vinyl direction in UX_TEARDOWN.md §6b; that section's proportions, deadpan rules and silhouette test still apply. The target is Talking Tom's glossy juiciness, Kick the Buddy's ragdoll boss and the Forest app's growing tree. It should read as a glossy collectible toy, never a plush or a baby animal.
- **Shape:** head about the same size as the body (1:1 to 1.2:1, never the infant 2:1), stubby limbs, a low center of gravity, a slight 3/4 turn by default, and a silhouette readable as a solid shape at 48px.
- **Material (Pip):** glossy candy plastic. `MeshPhysicalMaterial` with roughness .2–.35, metalness 0, clearcoat 1, clearcoatRoughness .08, `sheen` .3. One accent per figure: either iridescent (`iridescence` 1, `iridescenceIOR` 1.3, thickness range 100–400) or chrome (metalness 1, roughness .12) on the antenna, badge or one accessory.
- **Colorways:** 2–3 colors per figure, named like sneaker colorways. Bases are bubblegum `#FF8FC7`, aqua `#5FE3E8`, lime `#B8F04A`, lilac `#B9A2FF` and tangerine `#FF9A3C`. Each has a lighter belly and face patch, the base mixed about 55% toward `#FFF6FB` (bubblegum patch `#FFD3E8`, aqua `#C4F6F8`, lime `#E4FAB8`, lilac `#E2D8FF`, tangerine `#FFD3AE`). The default is "Lilac / Cream". Never rainbow on one body. These hexes are 3D materials and never UI chrome.
- **Eyes and expression:** glossy black capsule eyes with two specular dots (a large one upper-left and a small one lower-right) under heavy deadpan lids, closed about 30% by default. Emotion comes from lid height, tilt and a slow blink, not eye size. 💡 lifts the lids and rounds the eyes for 400ms.
- **Sparkles:** sparing. Only on an unlock, a fix or a level-up, three star-glints at most, and never during idle.
- **Boss:** a glossy ragdoll in slapstick (Kick the Buddy). Same candy-plastic material in the boss's own two emoji-derived colors, floppy spring-jointed limbs that flail on a hit and settle within about 600ms, squash on impact, and a bouncy over-animated tempo (Pip stays 20% slower: the straight man). On a K.O. it flops flat and slides out. Cartoon only: no blood, no gore, no real-world weapons.
- **Garden (Grow play style):** a Forest-app tree growing on a small floating island inside a rounded aqua sky (`linear-gradient(180deg, #A8F4F6 0%, #5FC9E0 100%)`, radius 28px, the only light backdrop in Play). Glossy round leaves, slow rising bubbles (6–14px, white at .35 with a 1px highlight, 6–10s rise, at most 6 on screen), and growth in steps seed → sprout → sapling → blooming tree with a 600ms ease-pop grow. It never wilts or dies; a setback sprouts a weed that re-teaching pulls out. No text on the sky.
- **Lighting:** a soft key light from the upper left, an aqua rim light (`#A7DFE6`), and a white hemisphere fill so the clearcoat catches one bright highlight. `ContactShadows` at opacity .35, blur 2.5.
- **Accessories:** exactly `none | glasses | scarf | pencil | badge | backpack`. Nerdy and earned. No caps, headphones or sunglasses.
- **Picker:** randomize does a 300ms spin-and-settle; the preview turntable auto-rotates at 0.4 rad/s and can be dragged to spin.

**Y2K accents: Play register only.** Studio screens never get these. The K.O. card gets only the holo number.
- **Gloss on pill buttons:** Play `.btn` adds a top highlight, `background-image: linear-gradient(180deg, rgba(255,255,255,.38) 0%, rgba(255,255,255,0) 52%)`, over the fill, plus a 1px inner white line `inset 0 1px 0 rgba(255,255,255,.65)`, layered with the pressed edge. On `.btn--primary` the result stays at least 16:1 (a lighter fill under dark ice-ink text). On secondary buttons use `.10` and `.18`. Weapon chips and the composer send button get the same highlight at half strength.
- **Chrome/holo sticker** (`.sticker`, used for the Brain badge "Brain v2", `.brain-badge`, `.ko__version`). Pill shape, padding 4px 10px, Geist Mono 500 13px.
  - Chrome: fill `linear-gradient(180deg, #FFFFFF 0%, #D9DEE3 45%, #8E99A3 52%, #E9EEF2 100%)`, `--ice-ink` text (6.3:1 at the darkest stop), `inset 0 1px 0 #fff, 0 2px 6px -2px rgba(0,0,0,.5)`, rotated −3deg.
  - Holo (`.sticker--holo`): the same, with `conic-gradient(from 210deg, #FF8FC7, #FFD27A, #B8F04A, #5FE3E8, #B9A2FF, #FF8FC7)` at opacity .55 blended `overlay` on top. It sweeps once when it first appears (background-position over 1.2s); no loop.
- **K.O. card number:** "No. 0147" may carry the holo gradient as text (`background: var(--holo); -webkit-background-clip: text; color: transparent`; every stop is at least 8.3:1 on `--ko-bg`). It is static except for the one 6s sweep it shares with the metallic hairline. Nothing else on the card changes: no confetti, no sparkles, no gloss.
- **Star-glint sparkles** (`.glint`): a 4-point star, `clip-path: polygon(50% 0, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0 50%, 39% 39%)`, 8–12px, `#FFFFFF` or `--sun`. Each one scales 0 → 1 → 0 while rotating 45deg over 400ms ease-out, with 3 at most per event, staggered 60ms. They appear only on a weapon unlock, a fixed Brain note, a Brain version-up or garden growth. Never idle, never in Studio, removed under reduced motion.

| Screen | 390px | 1024px+ |
|---|---|---|
| Landing | 220px stage above the headline | right column, 480px square, beside the hero copy |
| Student home (`.sh-hero__stage`) | 260px "room" glass with `--surface` floor glow, Brain badge top-right | 360px, left of the copy |
| Mission | 168px under the HUD, collapses to 96px (240ms) when the composer is focused | sticky left column, 360px, above the mission card |
| Brain and quiz | 140px Pip at the bottom-left, the cloud's puffs pointing at him | 220px left of the cloud |
| K.O. | arena stage for phase 1, then hidden behind the scrim | same |
| Tutor and owner | no canvas; 20px static Pip avatar | same |

## Layout Principles

- 4px base grid: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 96. Gutter 16px (24px at 768). Content 72rem; reading pages (`.page--narrow`) 44rem.
- Studio rhythm: 48px between sections on phones, 64px at 1024; 16px inside cards (24px at 768). Prefer divided rows to nested cards; never put a card in a card.
- Play rhythm is tighter: 24px between blocks (32px at 1024); every Play screen shows the next action without scrolling at 390×844.
- Mission screen on phones, top to bottom: top bar 60px, HUD 56px (sticky), stage 168px, mission card (collapsible after the first message), chat log, `.quiz-btn`, composer (sticky). At 1024: `grid-template-columns: minmax(320px, 5fr) 7fr; gap 32px`; left column (stage, `.mcard--compact`, boss panel) is sticky at `top: 76px`; the right chat column is at most 680px wide, with the composer pinned to its bottom.
- Owner at 1024: insight card full width, then the roster. Tutor: page head with "New Pip mission" primary, insight slot, roster.
- Landing: hero copy plus stage, three role buttons (stacked full width on phones, a 3-column row at 768, each 52px), footer "Demo center with synthetic data." in 14px `--fg-subtle`.

## Depth & Elevation

| Level | Studio | Play |
|---|---|---|
| 0 | `--ink` plus backdrop and grain | `.backdrop--game` (ribbon at 0.32) |
| 1 | `.glass` cards (blur 10, glass shadow) | glass plus `--lift` on mission card, boss panel, Brain cloud |
| 2 | `--overlay`: sheets, toasts, dropdowns, solid with overlay shadow | same, plus the tactile button edges |
| State | `--focus` ring only | `glow-coral`, `glow-mint`, `glow-sun` |
| Special | n/a | K.O. card: matte, no blur, single deep shadow |

Rules: one glowing element per viewport, except wrong and fixed notes in the Brain. Glows mean state, never decoration. Text never sits on raw backdrop ribbons; it sits on glass or solid surfaces. Sheets are bottom sheets on phones (radius 22px on top) and centered 640px dialogs at 768.

## Do's and Don'ts

**Do**
- Keep ice the single action color in both registers; one filled button per screen.
- Put the student's words in Fraunces italic everywhere, and quote her exactly.
- React within 100ms of every touch, on `pointerdown`, optimistically and without waiting on the network; animate transform, opacity and width only.
- Keep the hit sequence at 900ms or less and make anything over 1.5s tap-to-skip; every intro has "Skip intro" (ages 10–15 skip anything that repeats; UX_TEARDOWN.md §5).
- Write Pip's lines with no "!" and no "Great job" or "Awesome": deadpan, treating her as the expert. Physical comedy (squash, wobble, fall-over) lands on the boss, and on Pip only when its rule fails.
- Keep sound off by default behind a visible toggle (cues under 300ms: pop, thwack, boing, low gong); haptics are progressive enhancement, Android only.
- Pair each color state with words: "Pip believes this 😵", "fixed after 1 re-teach", "Pip got it".
- Use the 1.04 hover-scale only on collectible or choosable things: weapon chips, shelf items, mission tiles.
- Honor `prefers-reduced-motion` with the existing global rule; also stop hit-stop, the boss bob, the K.O. flip, the sweep and the damage float, and keep a non-motion signal (a 150ms opacity/color flash).
- Check every new pair against 4.5:1 (text) and 3:1 (control edges), on the brightest surface it can sit on.

**Don't**
- Use coral or `--danger` on her bubble, her composer, her name, a ✗, a score, or any Studio screen.
- Bring boss humor, glows, spring easing or pill buttons into Studio; there the boss is a neutral chip.
- Put XP, confetti, exclamation marks, ranks or the center's name on the K.O. card.
- Use streaks, countdowns, guilt copy ("Pip misses you"), timers, nagging badges, need meters that drain while she is away, a purchasable currency, loot boxes, consumable weapons, locked items that advertise a purchase, or rewards for sharing (full list: UX_TEARDOWN.md §6d).
- Make the mascot plush or baby-proportioned (head larger than 1.2× the body, big shiny irises, lashes), or give it caps, headphones or sunglasses; the accessories are `none | glasses | scarf | pencil | badge | backpack`.
- Let a tap do damage; HP moves only on judged explanations.
- Use alpha steps of ivory for text, or text below 14px except eyebrows and mono metadata.
- Add another accent hue to UI chrome (the Y2K colorways stay in the 3D scene, plus `--holo` on stickers), or a font outside Fraunces, Manrope and Geist Mono.
- Put gloss, holo, chrome or glints on Studio screens, or sparkles anywhere on the K.O. card; never let sparkles idle or exceed 3 per event.
- Animate on loop anything that carries text; run a hit shake longer than 280ms; shake the screen for anything but the K.O.; fire more than one taunt per 20s.

## Responsive Behavior

| Width | Changes |
|---|---|
| 360–389 | Test floor. No horizontal page scroll; the mission rail scrolls inside itself. |
| 390 (base) | One column. Composer and sheets pinned to the bottom with `env(safe-area-inset-bottom)`. Every tap target ≥ 44px (chips 44px tall, send 44px circle). Primary actions within the bottom 40% of the screen on Play. Roster rows stacked. |
| 640 | Hero 48px; page title 40px; Brain notes 2-up. |
| 768 | Gutter 24px; mission path becomes a 5-column row; sheets become dialogs; landing role buttons in a row; cards padded 24px. |
| 1024 | Hero 60px; mission screen splits 5fr/7fr with a sticky left column; roster becomes a table grid; insight card 2fr/1fr; Brain notes 3-up; boss emoji 88px. |
| 1280+ | Content caps at 72rem; extra width becomes margin, never wider text. |

Hover effects sit behind `@media (hover: hover) and (pointer: fine)` so phones never get sticky hover states. Use `100dvh` for full-height Play screens. Keyboard: every note, step, chip and card flip is a `<button>`; focus is a 2px `--focus` ring with a 2px offset; the HP bar is `role="meter"`; captions and "Pip is thinking" announce via `aria-live="polite"`.

## Theming: build your own UI (S10)

A student theme is a small DESIGN.md: a token set in the same front-matter shape as this file, plus a one-line **Visual Theme & Atmosphere** description. A theme can change the look; it can never change what the system means. It is visual only, with no uploads, and is stored as "My theme".

```yaml
theme:
  name: "Y2K Aqua"
  atmosphere: "Deep-sea night with aqua glass buttons and lime progress."
  colors: { ground, surface, surface-2, fg, fg-muted, fg-subtle, action, action-ink, progress, win, boss }
  display: soft            # editorial (SOFT 0, wght 500) | soft (SOFT 100, wght 700) | wonky (soft + WONK 1)
  radius: normal           # tight 0.75x | normal 1x | round 1.25x, multiplies --r-* (pill stays pill)
  bubble: round            # round 18px | square 8px | pill 999px; the tail corner stays 6px
  pattern: grain           # none | grain | dots | grid | ruled | bubbles, CSS only, opacity <= .06
  motion: normal           # low (no shake, half travel, no glints) | normal
```

**Presets** (original; never named after or imitating a real brand or product). Each is checked: every text role is at least 4.5:1 on ground, surface and surface-2; the worst case is listed.

| Preset | ground / surface / surface-2 | fg / fg-muted / fg-subtle | action / action-ink | progress / win / boss | display, radius, bubble, pattern | worst text pair |
|---|---|---|---|---|---|---|
| **Night Forest** (default) | `#001914` `#0A2721` `#12372E` | `#EFEFE9` `#D4D4CD` `#A8B8AE` | `#C9FCFC` / `#001914` | `#8FE3B0` `#FFD27A` `#FF8A7A` | soft, normal, round, grain | fg-subtle 6.3:1 |
| **Y2K Aqua** | `#031A2B` `#0A2A40` `#123A55` | `#EEF9FF` `#CFE6F2` `#9FC3D6` | `#5FE3E8` / `#031A2B` | `#B8F04A` `#FFD27A` `#FF8A7A` | soft, round, pill, bubbles | boss 5.2:1 |
| **Bubblegum** | `#1E0A1C` `#2B1229` `#3A1A37` | `#FFF0F7` `#F2D3E3` `#C9A3B8` | `#FF9AD5` / `#1E0A1C` | `#8FE3B0` `#FFD27A` `#FF7A5C` | wonky, round, round, dots | boss 5.9:1 |
| **Chrome** | `#111316` `#1A1D21` `#252A30` | `#F2F4F6` `#D3D8DD` `#A3ABB3` | `#DDE3E8` / `#111316` | `#8FE3B0` `#FFD27A` `#FF8A7A` | editorial, tight, square, grid | fg-subtle 6.2:1 |
| **Notebook** (light) | `#F7F3E8` `#FFFDF6` `#EFE9D8` | `#1C241F` `#3D4A42` `#56635A` | `#245B64` / `#F7F3E8` | `#1A6E42` `#805300` `#B23A29` | editorial, normal, square, ruled | boss 4.9:1 |

In Notebook, the sticky notes keep `--note` paper with a 1px `#D8CFB6` edge, and glows drop to 1.5px rings with no blur halo.

**What a student may change:** the hex within each role, display mood, radius scale, bubble style, background pattern, and motion intensity (low or normal). Plus Pip's look, which lives in the 3D scene.

**What is locked:**
- **Role meanings.** Action (ice slot) is the only filled-button and link color. Boss (coral slot) is only boss HP and Pip's wrong beliefs; its hue must stay between 0 and 20deg and it never touches her bubble. Progress (mint slot) is her progress; hue 90–170deg. Win (sun slot) is her wins.
- **Layout and access:** the type scale and font families, the 14px minimum, 44px tap targets, the spacing scale, focus ring width, and layout.
- **Motion and voice:** `prefers-reduced-motion` always beats the theme's motion setting, and all copy is unchanged.

**Validation on save,** run live in the picker and again on save:
1. **Contrast:** every text role on ground, surface and surface-2 needs 4.5:1. `action-ink` on `action` needs 4.5:1; `action` against ground needs 3:1 (a UI boundary). Progress, win and boss on surface-2 need 3:1 as fills and 4.5:1 where they are text ("Pip got it", "+20 HP").
2. **Auto-adjust:** if a pick fails, step its OKLCH lightness by 1% toward passing, keeping hue and chroma, and stop at the first passing value. Show it inline: "Adjusted your lime slightly so text stays readable (4.6:1)." Never refuse silently, and never adjust a color she didn't pick.
3. **Coral and mint stay distinguishable:** a boss–progress hue gap of at least 60deg, and boss–action at least 30deg. They are never told apart by hue alone: "Pip believes this 😵", "fixed after N re-teach", 😵/🎉 faces and the HP label stay on in every theme.
4. **Pattern:** the pattern's opacity is capped at .06, and contrast is re-checked against the pattern's brightest pixel.

**Application:** theme tokens are CSS variables set inline on the `[data-register="play"]` root only. They map onto `--ink`, `--surface`, `--surface-2`, `--fg*`, `--ice`, `--ice-ink`, `--mint`, `--sun`, `--coral`, `--r-*`, plus `--bubble-r` and `--pattern`. Derived tints (`*-soft`, `*-line`, glows) are computed with `color-mix(in oklch, var(--x) 14%, transparent)`, so a theme never has to define them. Studio screens, tutor, owner and parent surfaces, and the K.O. card's core layout (matte `--ko-bg`, type, metadata) never take a student theme; the K.O. card may take her `action` hue only on the hairline sweep. Center themes (the owner's colors as the default student theme) use the same validator.

## Agent Prompt Guide

Quick reference: ground `#001914`, glass card `#0A2721`, raised `#12372E`, text `#EFEFE9` / `#D4D4CD` / `#A8B8AE`, action ice `#C9FCFC` on `#001914`, Play states mint `#8FE3B0` (her progress), sun `#FFD27A` (her wins), coral `#FF8A7A` (boss and Pip's wrong rules only), paper `#FBF3D9` with `#1C241F`, K.O. card `#14161F`. Fonts: Fraunces (SOFT 0 at weight 500 for Studio; SOFT 100 at weight 700 for Play), Manrope, Geist Mono.

Ready prompts:
- "Style the boss panel per DESIGN_SYSTEM.md: surface with a coral radial wash, 28px radius, 64px emoji with a 4px idle bob, Fraunces 700 SOFT 100 WONK 1 name at 24px, a 14px pill HP bar with a coral gradient fill and a white damage ghost, and shake-hit, shake-heal and shake-whiff keyframes (70ms hit-stop, 280ms ±8px shake, 240ms squash), an instant HP drop with a ghost that drains over 450ms after 150ms, and a coral mono damage floater; total ≤ 900ms."
- "Restyle Pip's Brain as a 40px-radius thought cloud with three trailing puffs toward Pip; notes are cream paper with a tape strip and alternating tilt, quotes in Fraunces italic 17px; wrong notes get the coral glow and a #9E3427 'Pip believes this 😵' flag; fixed notes get the mint glow and a #1F6B45 flag, with a ±2deg reveal wobble on the wrong note and a 400ms rotateY flip from wrong to fixed."
- "Build the K.O. card: 9:16, #14161F matte, 20px radius, 'No. 0147' in 12px Geist Mono with an optional holo text sheen, one 1px metallic hairline that sweeps once over 6s, the struck-through equation in Fraunces 32px, nickname and date at the bottom, tap to flip to boss name, her rule and Pip's line. No XP, no confetti, no exclamation marks."
- "Apply the Play register under [data-register=play]: pill buttons 52px with a 4px #6FB7B9 pressed edge, 20/28px radii, Fraunces SOFT 100 headings, weapon chips 44px tall with a 1.04 hover-scale and a sun glow when equipped."
- "Make the mission screen mobile-first: sticky 56px HUD under the top bar, 168px 3D stage that collapses to 96px on composer focus, the chat with Pip bubbles on the left (surface-2) and hers on the right (ice-soft), and a pill composer pinned to the bottom with a 44px ice send button and safe-area padding."
- "Studio gap report: divided rows rather than cards, status pills (ok, warn, sunset), evidence quotes in Fraunces italic 17px with a 2px left rule, an ice-soft 'Start Tuesday's session here' box, the boss as a neutral chip. No coral, no glows."
