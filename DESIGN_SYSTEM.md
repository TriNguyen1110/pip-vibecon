---
version: 2.0
name: Pip
description: >
  Two registers, one product. Studio (landing, tutor, owner, pricing, parent preview) is a calm
  editorial web app on willder's forest: Fraunces titles, Manrope body, Geist Mono facts, ice as
  the only action color, hairline rows, one shadow tier. Play (every student screen) is a game,
  not a web app: a full-screen scene (Daylight Arcade by default, Night Arcade as a toggle),
  the mascot filling the middle like Talking Tom, glossy gel buttons with a chunky pressable
  edge, thick-outlined panels, stickers and ribbons, a segmented boss HP bar, a level map, comic
  speech bubbles, and every screen fitting one phone viewport without scrolling. The boss fight
  is the loudest moment; the K.O. card is the quiet premium exception. Coral belongs only to
  boss HP and Pip's wrong beliefs, never to the student's answers. Variable names match
  frontend/src/styles/tokens.css; NEW marks additions.

colors:
  studio:   # v1 forest values; G4 replaces them with 'Ink at Work' (see Shared brand layer): ink #0C0A18, surface #15122A/#1D1936/#262144, fg #F4F2FA/#D6D2E6/#A9A3C4, accent #2EF2FF, accent-2 #B6FF3B
    ink:        { hex: "#001914", role: "page ground (forest)" }
    surface:    { hex: "#0A2721", role: "solid card" }
    surface-2:  { hex: "#12372E", role: "raised" }
    surface-3:  { hex: "#1A4639", role: "highest raised" }
    overlay:    { hex: "#10372E", role: "sheets, toasts" }
    fg:         { hex: "#EFEFE9", role: "main text, 15.8:1 on ink" }
    fg-muted:   { hex: "#D4D4CD", role: "supporting text, 7.1:1 worst" }
    fg-subtle:  { hex: "#A8B8AE", role: "metadata, 5.1:1 worst" }
    ice:        { hex: "#C9FCFC", role: "the one action color; ice-ink #001914 on it, 16.4:1" }
    focus:      { hex: "#A7DFE6", role: "2px focus ring" }
    sunset:     { hex: "#F59B76", role: "warm accent; Misconception pill, 7.4:1" }
    success:    { hex: "#A6D4B4" }
    warning:    { hex: "#F3C480" }
    danger:     { hex: "#EF968D", role: "Studio errors and destructive only" }
  play-day:   # [data-register="play"][data-theme="day"], Daylight Arcade, the default
    sky:          { value: "linear-gradient(180deg, #BFE6FF 0%, #D8F1FF 45%, #E3FCEB 100%)", role: "NEW scene background" }
    ink:          { hex: "#D8F1FF", role: "ground fallback" }
    surface:      { hex: "#FFFFFF", role: "panel top" }
    surface-2:    { hex: "#EEF6FF", role: "panel bottom, Pip-side fills" }
    surface-3:    { hex: "#DCE8F4", role: "tracks, pressed wells" }
    fg:           { hex: "#10213F", role: "deep navy text, 12.2:1 worst (sky top)" }
    fg-muted:     { hex: "#2E4466", role: "7.5:1 worst" }
    fg-subtle:    { hex: "#4A5F80", role: "4.9:1 worst; 15px+ only" }
    ice:          { hex: "#2A63F5", role: "electric blue action fill; white label 5.0:1" }
    ice-ink:      { hex: "#FFFFFF", role: "label on action" }
    link:         { hex: "#1F4FD6", role: "NEW action as text, 5.1:1 worst" }
    outline:      { hex: "#10213F", role: "NEW 3px outlines and pressable edges, 13.7:1 vs sky" }
    mint:         { hex: "#1A7030", role: "her progress as text, 4.7:1 worst" }
    mint-fill:    { hex: "#3FBF4F", role: "NEW her progress as fill; navy label 6.7:1" }
    sun:          { hex: "#8F5200", role: "her wins as text, 4.7:1 worst" }
    sun-fill:     { hex: "#FFB020", role: "NEW her wins as fill; navy label 8.8:1" }
    coral:        { hex: "#B52E1B", role: "boss and Pip's wrong rules as text, 4.7:1 worst" }
    coral-fill:   { hex: "#FF6B5E", role: "NEW boss HP and wrong-rule fill; navy label 5.7:1" }
    her-bubble:   { hex: "#EAF3FB", role: "NEW her speech bubble; navy 14.3:1" }
  play-night: # [data-register="play"][data-theme="night"], Night Arcade
    sky:          { value: "radial-gradient(120% 60% at 50% 110%, rgba(51,225,255,.18), transparent 60%), linear-gradient(180deg, #0E1530 0%, #1B1F4D 100%)", role: "NEW scene + stars" }
    ink:          { hex: "#0E1530" }
    surface:      { hex: "#333E86", role: "panel top (frosted)" }
    surface-2:    { hex: "#2A3370", role: "panel bottom" }
    surface-3:    { hex: "#354085", role: "tracks, wells" }
    fg:           { hex: "#FFFFFF", role: "9.4:1 worst" }
    fg-muted:     { hex: "#DCE3FF", role: "7.4:1 worst" }
    fg-subtle:    { hex: "#B8C2EE", role: "5.4:1 worst; 15px+ only" }
    ice:          { hex: "#33E1FF", role: "electric cyan action; ice-ink #0E1530 label 11.4:1" }
    ice-ink:      { hex: "#0E1530" }
    link:         { hex: "#33E1FF", role: "6.0:1 worst" }
    outline:      { hex: "#050A1F", role: "gel and sticker outlines" }
    panel-outline: { hex: "#6E7BD6", role: "NEW panel outline, 4.7:1 vs night sky" }
    mint:         { hex: "#A3F04A", role: "lime progress, text and fill, 6.8:1 worst" }
    sun:          { hex: "#FFD23F", role: "yellow wins, text and fill, 6.5:1 worst" }
    coral:        { hex: "#FFA89C", role: "boss text, 5.1:1 worst" }
    coral-fill:   { hex: "#FF8A7A", role: "HP fill; ink label 7.9:1" }
    her-bubble:   { hex: "#C9F6FF", role: "ink 15.5:1" }
  shared:
    note:         { hex: "#FBF3D9", role: "sticky-note and notebook paper; note-ink #1C241F 14.3:1, navy 14.4:1" }
    coral-ink:    { hex: "#9E3427", role: "coral text on paper, 6.4:1" }
    mint-ink:     { hex: "#1A7030", role: "green text on paper, 5.6:1" }
    ko-bg:        { hex: "#14161F", role: "K.O. card matte near-black, both themes" }
    ko-meta:      { hex: "#9BA09C", role: "K.O. card metadata, 6.8:1" }
    holo:         { value: "conic-gradient(from 210deg, #33E1FF, #A3F04A, #FFD23F, #FF9A3C, #4F82FF, #33E1FF)", role: "Play sticker sheen and K.O. number; every stop >= 5.1:1 on ko-bg" }
    chrome:       { value: "linear-gradient(180deg, #FFFFFF 0%, #D9DEE3 45%, #8E99A3 52%, #E9EEF2 100%)", role: "chrome sticker; navy text 6.3:1 at darkest stop" }
    pip-default:  { hex: "#5FE3E8", role: "default mascot colorway Aqua / Cream (3D only)" }

typography:
  url: "https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..700&family=Geist+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&family=Unbounded:wght@400..900&display=swap"   # verified 200 (G4)
  studio:
    hero:        { font: Fraunces, size: "36 / 48 @640 / 60 @1024", weight: 500, lh: 1.05, ls: "-0.02em" }
    page-title:  { font: Fraunces, size: "32 / 40 @640", weight: 500, lh: 1.1 }
    section:     { font: Fraunces, size: 24, weight: 500 }
    stat-number: { font: Fraunces, size: "40 (insight 56)", weight: 500, numeric: "lining-nums tabular-nums" }
    card-title:  { font: Manrope, size: 18, weight: 700 }
    body:        { font: Manrope, size: 16, weight: 400, lh: 1.6 }
    small:       { font: Manrope, size: 14, weight: 500 }
    eyebrow:     { font: Manrope, size: 12, weight: 600, ls: "0.14em", case: upper }
    quote:       { font: Fraunces, size: 17, style: italic }
    mono:        { font: Geist Mono, size: "13-14" }
  play:          # G4: Unbounded = --font-game (replaces Fredoka); Bodoni Moda = --font-editorial (NEW)
    title:       { font: Unbounded, size: "30 / 44 @1024", weight: 800, lh: 1.0, ls: "-0.02em" }
    editorial:   { font: Bodoni Moda, size: "36-72", weight: 800, opsz: 96, note: "mastheads, THE NEW LOOK, cover quotes (italic 500)" }
    ribbon:      { font: Unbounded, size: 18, weight: 700, case: upper, ls: "0.04em" }
    button-lg:   { font: Unbounded, size: 24, weight: 800, case: upper, ls: "0.06em", note: "PLAY" }
    button:      { font: Unbounded, size: 17, weight: 600, note: "below large-text size, so labels hold >= 4.5:1 (they reach 7.2-19.6:1)" }
    button-sm:   { font: Unbounded, size: 15, weight: 600 }
    hud-number:  { font: Geist Mono, size: 18, weight: 500, numeric: tabular-nums }
    speech:      { font: Manrope, size: 18, weight: 700, lh: 1.3, note: "Pip's bubble: plain, deadpan" }
    caption:     { font: Unbounded, size: 16, weight: 700, case: upper, ls: "0.04em", note: "MC captions" }
    sticker:     { font: Geist Mono, size: 15, weight: 500, case: upper, ls: "0.06em", note: "tags, look numbers, issue numbers" }
    icon-label:  { font: Manrope, size: 15, weight: 700 }
    stamp:       { font: Unbounded, size: 88, weight: 900, note: "K.O." }
    body-small:  { font: Manrope, size: 16, weight: 600, lh: 1.45, note: "her words, chat history, notes, quiz work" }
  floor: "Play: 15px minimum anywhere, labels at most 3 words. Studio: 14px informative, 12px eyebrows and mono only"

rounded:
  studio: { sm: 10px, md: 12px, lg: 16px, xl: 22px }
  play:   { sticker: 12px, bubble: 24px, panel: 24px, sheet: 28px, gel: 999px, icon: 50% }
  note: 6px
  ko: 20px
  cloud: 40px

spacing: { s1: 4px, s2: 8px, s3: 12px, s4: 16px, s5: 20px, s6: 24px, s8: 32px, s10: 40px, s12: 48px, s16: 64px, gutter: "16px; 24px @768 (Play: 12px)", content: 72rem, tap: "44px Studio; 48px Play minimum, 56px default" }

elevation:
  studio-glass: "1px var(--glass-edge); blur(10px); 0 20px 56px -30px rgba(0,0,0,.5)"
  studio-overlay: "solid #10372E; 0 16px 40px -18px rgba(0,0,0,.7)"
  play-gel:     "NEW 3px outline; 0 6px 0 var(--gel-edge); inset 0 -4px 8px rgba(0,0,0,.18); inset 0 2px 0 rgba(255,255,255,.55); 0 10px 18px -8px rgba(16,33,63,.45)"
  play-panel:   "NEW 3px outline; inset 0 2px 0 var(--panel-hi); 0 5px 0 var(--panel-edge); 0 14px 24px -14px rgba(16,33,63,.35)"
  play-sticker: "NEW 2.5px outline; 0 3px 0 var(--outline)"
  ko-card:      "0 40px 80px -40px rgba(0,0,0,.9); no blur, no outline"

motion:  # timings from UX_TEARDOWN.md §6a
  instant: 100ms     # tap -> first visible reaction, on pointerdown, never waits on the network
  press: 100ms       # gel sink + squash
  fast: 160ms
  med: 240ms
  screen: 260ms      # NEW swoosh/scale-in between screens and K.O. beats (<= 300ms)
  slow: 450ms
  ease: "cubic-bezier(0.2, 0.7, 0.2, 1)"
  ease-out: "cubic-bezier(0.16, 1, 0.3, 1)"
  ease-pop: "cubic-bezier(0.34, 1.56, 0.64, 1)"   # Play only
  hit-stop: "70ms on a hit, 120ms on the K.O. hit"
  shake-hit: "280ms, translateX +/-8px, rotate +/-1.5deg, 4 decaying oscillations"
  shake-heal: "360ms, scale 1 -> 1.08 -> 1, wobble +/-3deg"
  squash: "240ms ease-pop, (1.15,0.85) -> (0.95,1.05) -> 1"
  screen-shake: "K.O. only: +/-4px, 200ms"
  hp: "segments drop instantly; white ghost waits 150ms, drains 450ms"
  damage-float: "28px rise + fade, 700ms"
  caption: "pop in 160ms, hold 2.8s, tap to dismiss"
  unlock-pop: "220ms, scale 0 -> 1.1 -> 1, up to 3 star-glints"
  hit-sequence-max: 900ms
  idle: "breathe 1.00-1.02 over 3.2s; blink 120ms every 2.5-6s; look-around every 8-14s; Pip 20% slower than the boss"
  ai-wait: "lean 4deg + 'Pip is listening' within 100ms; dots after 1s; 'still thinking' + retry after 8s"
  skip: "anything over 1.5s is tap-to-skip"
  reduced: "no shake, hit-stop, squash, drift, twinkle, flip or swoosh; screens crossfade 120ms; events flash 150ms (opacity/color); labels unchanged"
---

# Pip Design System

## Visual Theme & Atmosphere

Pip has two registers in one system, switched on the shell root: `data-register="studio"` (default) or `data-register="play"` (set when `Shell` gets `game`). Play also carries `data-theme="day"` or `data-theme="night"`.

> **G4 update:** Studio moves from forest to **Ink at Work** and shares the wordmark, Signal Cyan, Acid Lime, the scene language and the button family with Play. The landing hero is now the app's Club world. See *Shared brand layer* below.

**Studio** (landing, tutor, owner, gap report, pricing, parent preview) is willder's calm web app. Forest ground (`#001914`), a faint ice ribbon, ivory text, glass cards, Fraunces titles, Manrope body, Geist Mono facts. It borrows Oura's editorial calm and Linear's precision: hairline rows, one shadow tier, one filled ice button per screen. No boss humor; the boss is a neutral chip.

> **G4 update:** the Play look is now **Runway** (day, default) and **Club** (night): runway fashion show plus club/concert energy, Unbounded and Bodoni Moda type, lasers, spotlights, a lookbook Vault and a runway-walk K.O. See *Runway & Club* below; it supersedes the Daylight/Night Arcade palettes, Fredoka, the sticker album and the sky backdrops wherever they conflict. Layout, components and role rules below still apply.

**Play** (student home, mission, Pip's Brain, quiz, K.O.) is a game screen, not a website. The references are Talking Tom's layout (the character fills the middle, round icon buttons around the edges), Wii/DS-era menus and Frutiger Aero (glossy aqua bubbles, clouds, sky), PS2/Xbox-era menus, early glossy app icons, and Club Penguin's chunky panels. Kept gender-neutral and not babyish: the energy is Switch, Fortnite, Minecraft and Duolingo, not pastel candy.
- **Daylight Arcade** (default): sky-to-mint gradient, soft clouds, a few bubbles, white panels with 3px navy outlines, deep navy text, electric-blue gel buttons, lime for her progress, sunny yellow-orange for her wins.
- **Night Arcade** (toggle): navy-to-indigo with stars and a cyan horizon glow, frosted indigo panels, white text, electric-cyan gel buttons, lime progress, yellow wins.
- **Both:** chunky rounded Fredoka for anything big, a 3D stage that blends into the scene, and every screen fitting one phone viewport.

**Volume map, loudest to quietest:** boss hit (hit-stop, shake, segment burst, damage sticker) > K.O. stamp > weapon unlock > Brain note flip > speech bubbles > level map > home title screen > Studio > the K.O. card. The card is matte near-black, silent and nearly empty: the premium exception inside the game.

## Color Palette & Roles

**Locked role rules (every theme, every register):**
- **Action** (`--ice` slot: ice in Studio, electric blue by day, cyan by night) is the only filled-button color, and the only link color through `--link`.
- **Coral** (`--coral` text, `--coral-fill`) is only boss HP, the boss's taunts and floaters, and Pip's wrong beliefs (wrong-rule glow and sticker, a missed quiz result, which is Pip's). It never touches her bubble, her input, her name or any status about her, and never appears in Studio.
- **Progress** (`--mint` text, `--mint-fill`): her progress (level-map rings, taught nodes, fixed rules, quiz passes).
- **Wins** (`--sun`, `--sun-fill`): her wins (equipped weapon, coins, unlock glints, the highlighter behind her quoted words).
- **No pink or lilac anywhere in the UI.** Mascot colorways are her choice and live only in the 3D scene.
- **Every color state has a word or icon too:** "Pip believes this 😵", "fixed after 1 re-teach", "Pip got it", the HP number.
- **Text vs. fill:** by day the bright role colors fail as text on white, so each role has a text value (`--mint`, `--sun`, `--coral`) and a fill value (`--*-fill`). By night the bright value passes both ways, except coral, which is split (`#FFA89C` text, `#FF8A7A` fill). Fills meet the 3:1 boundary rule through their 3px outline, not their hue.

**Studio palette:** unchanged from v1 (front matter `studio`). Text roles `--fg`, `--fg-muted`, `--fg-subtle` only, never alpha steps of ivory. Status pills: Explained well `pill--ok`, Vague `pill--warn`, Misconception `pill--gap` (sunset).

*(Daylight and Night Arcade are superseded by Runway and Club in G4; the values below remain as the 'Daylight Arcade' / 'Night Arcade' presets.)*

**AA contrast, Daylight Arcade.** Worst case is the lowest ratio across sky top `#BFE6FF`, sky mid `#D8F1FF`, sky bottom `#E3FCEB`, panel `#FFFFFF`/`#EEF6FF` and well `#DCE8F4`.

| Pair | Worst | On panel |
|---|---|---|
| fg `#10213F` | 12.18 | 14.69 |
| fg-muted `#2E4466` | 7.48 | 9.02 |
| fg-subtle `#4A5F80` (15px+) | 4.93 | 5.95 |
| link `#1F4FD6` | 5.08 | 6.12 |
| mint text `#1A7030` | 4.69 | 5.66 |
| sun text `#8F5200` | 4.73 | 5.71 |
| coral text `#B52E1B` | 4.74 | 5.71 |
| white label on blue gel mid `#2A63F5` / bottom `#1F4FD6` | 5.00 / 6.67 | |
| navy on secondary gel `#FFFFFF`→`#E6EEF8` | 13.69 | |
| navy on lime / sun / coral fills | 6.69 / 8.76 / 5.73 | |
| navy on Pip's bubble `#FFFFFF` / her bubble `#EAF3FB` / note paper | 16.01 / 14.27 / 14.43 | |
| navy outline vs sky (UI boundary) | 13.69 | |
| placeholder `#4A5F80` on input `#FFFFFF` | 6.48 | |

**AA contrast, Night Arcade.** Worst case is the lowest ratio across `#0E1530`, `#1B1F4D`, panel `#333E86`/`#2A3370`, surface `#1F2758` and well `#354085`.

| Pair | Worst | On panel |
|---|---|---|
| fg `#FFFFFF` | 9.44 | 11.63 |
| fg-muted `#DCE3FF` | 7.41 | 9.12 |
| fg-subtle `#B8C2EE` (15px+) | 5.39 | 6.64 |
| cyan `#33E1FF` | 6.01 | 7.39 |
| lime `#A3F04A` | 6.80 | 8.37 |
| yellow `#FFD23F` | 6.54 | 8.05 |
| coral text `#FFA89C` | 5.10 | 6.28 |
| ink `#0E1530` on cyan gel top `#8AF0FF` / mid `#33E1FF` / bottom `#14B8DB` | 13.68 / 11.43 / 7.62 | |
| white on indigo secondary gel `#333E86`→`#2A3370` | 9.66 / 11.63 | |
| ink on lime / yellow / coral fills | 12.94 / 12.44 / 7.85 | |
| ink on her bubble `#C9F6FF` | 15.50 | |
| panel outline `#6E7BD6` vs sky | 4.68 | |
| placeholder `#B8C2EE` on input `#2A3370` | 6.64 | |

I adjusted these until they passed: the night panel top went from `#3A4590` to `#333E86`, night fg-subtle from `#AEB8E8` to `#B8C2EE`, night coral text from `#FF9C8F` to `#FFA89C`, and the day link from `#2458E0` to `#1F4FD6`. Day lime, sun and coral were each split into a fill and a darker text value.

**K.O. card:** its own closed palette in both themes: `--ko-bg`, `#EFEFE9`, `--ko-meta`, the metallic hairline, and an optional holo number.

## Typography Rules

- **Fonts:** load the front-matter URL in `index.html` (verified 200). It drops Fraunces' SOFT/WONK axes, which Play no longer needs, and adds Fredoka. `--font-game: 'Fredoka', 'Manrope', system-ui, sans-serif`.
- **Studio:** unchanged. Fraunces 500 titles with `--heading-shadow`, Manrope UI, Geist Mono facts, Fraunces italic 17px for the student's quoted words in gap reports.
- **Play display:** Fredoka (`font-variation-settings: "wdth" 112` for titles, ribbons, PLAY and the K.O. stamp; 100 elsewhere) for headings, ribbons, buttons, HUD numbers, stickers, icon labels and Pip's speech bubble.
- **Play body:** Manrope 600 16px only for small body text: her words, chat history, note quotes, quiz work, input text (17px).
- **Labels:** big, bold, short. Buttons are at most 3 words ("PLAY", "Quiz Pip", "Re-teach", "Next"). Only PLAY and the K.O. stamp are uppercase.
- **Big text gets an outline:** Play titles and the K.O. stamp over the scene use `paint-order: stroke fill; -webkit-text-stroke: 6px var(--outline)` plus `text-shadow: 0 4px 0 var(--outline)`, so they read on any sky.
- **Her words:** in Play, Manrope 600 inside curly quotes with the win highlighter `background: linear-gradient(transparent 58%, color-mix(in oklch, var(--sun-fill) 45%, transparent) 58%)`. In Studio and on the K.O. card, Fraunces italic.
- **Numbers:** `font-variant-numeric: tabular-nums` for HP, coins and quiz dots; Geist Mono only on the K.O. card ("No. 0147").
- **Size floors:** no Play text below 15px. No "small grey text": `--fg-subtle` is for 15px+ secondary labels only. Inputs are at least 16px.

## Component Stylings

### Play: ready-to-apply CSS

Paste into `student.css`. It maps onto the existing class names. New classes are `.gel-btn`, `.icon-btn`, `.ribbon`, `.bubble`, `.tray` and `.play-screen`; `.panel` is redefined only inside Play.

```css
/* ---------- Play tokens: Daylight Arcade (default) ---------- */
[data-register="play"], [data-register="play"][data-theme="day"] {
  color-scheme: light;
  --font-game: 'Fredoka', 'Manrope', system-ui, sans-serif;
  --sky: linear-gradient(180deg, #BFE6FF 0%, #D8F1FF 45%, #E3FCEB 100%);
  --ink: #D8F1FF; --surface: #FFFFFF; --surface-2: #EEF6FF; --surface-3: #DCE8F4; --overlay: #FFFFFF;
  --fg: #10213F; --fg-muted: #2E4466; --fg-subtle: #4A5F80;
  --ice: #2A63F5; --ice-ink: #FFFFFF; --link: #1F4FD6; --focus: #10213F;
  --ice-soft: rgba(42,99,245,.12); --ice-line: rgba(42,99,245,.4);
  --mint: #1A7030; --mint-fill: #3FBF4F; --sun: #8F5200; --sun-fill: #FFB020;
  --coral: #B52E1B; --coral-fill: #FF6B5E; --coral-ink: #9E3427; --mint-ink: #1A7030;
  --outline: #10213F; --outline-w: 3px; --panel-outline: #10213F;
  --panel-fill: linear-gradient(180deg, #FFFFFF 0%, #EEF6FF 100%);
  --panel-hi: #FFFFFF; --panel-edge: #10213F;
  --gel-primary: linear-gradient(180deg, #4F82FF 0%, #2A63F5 40%, #1F4FD6 100%);
  --gel-primary-ink: #FFFFFF; --gel-primary-edge: #10213F; --gel-text-shadow: 0 2px 0 rgba(16,33,63,.45);
  --gel-secondary: linear-gradient(180deg, #FFFFFF 0%, #E6EEF8 100%);
  --gel-secondary-ink: #10213F; --gel-secondary-edge: #10213F;
  --gel-win: linear-gradient(180deg, #FFD27A 0%, #FFB020 55%, #F59B0B 100%);
  --sticker-ink: #10213F; --bubble-fill: #FFFFFF; --her-bubble: #EAF3FB;
  --track: rgba(16,33,63,.12); --tint-1: rgba(16,33,63,.04); --tint-2: rgba(16,33,63,.10);
  --divider: rgba(16,33,63,.12); --border: rgba(16,33,63,.2);
  --field-bg: #FFFFFF; --field-border: #10213F; --field-placeholder: #4A5F80;
  --scrim: rgba(16,33,63,.55); --path-dot: #10213F;
  --heading-shadow: none;
}
/* ---------- Play tokens: Night Arcade ---------- */
[data-register="play"][data-theme="night"] {
  color-scheme: dark;
  --sky: radial-gradient(120% 60% at 50% 110%, rgba(51,225,255,.18), transparent 60%),
         linear-gradient(180deg, #0E1530 0%, #1B1F4D 100%);
  --ink: #0E1530; --surface: #333E86; --surface-2: #2A3370; --surface-3: #354085; --overlay: #1F2758;
  --fg: #FFFFFF; --fg-muted: #DCE3FF; --fg-subtle: #B8C2EE;
  --ice: #33E1FF; --ice-ink: #0E1530; --link: #33E1FF; --focus: #33E1FF;
  --ice-soft: rgba(51,225,255,.14); --ice-line: rgba(51,225,255,.45);
  --mint: #A3F04A; --mint-fill: #A3F04A; --sun: #FFD23F; --sun-fill: #FFD23F;
  --coral: #FFA89C; --coral-fill: #FF8A7A;
  --outline: #050A1F; --panel-outline: #6E7BD6;
  --panel-fill: linear-gradient(180deg, rgba(51,62,134,.92) 0%, rgba(42,51,112,.92) 100%);
  --panel-hi: rgba(255,255,255,.18); --panel-edge: #050A1F;
  --gel-primary: linear-gradient(180deg, #8AF0FF 0%, #33E1FF 40%, #14B8DB 100%);
  --gel-primary-ink: #0E1530; --gel-primary-edge: #0B7F9C; --gel-text-shadow: 0 1px 0 rgba(255,255,255,.35);
  --gel-secondary: linear-gradient(180deg, #333E86 0%, #2A3370 100%);
  --gel-secondary-ink: #FFFFFF; --gel-secondary-edge: #050A1F;
  --gel-win: linear-gradient(180deg, #FFE27A 0%, #FFD23F 55%, #F2B705 100%);
  --sticker-ink: #0E1530; --bubble-fill: #FFFFFF; --her-bubble: #C9F6FF;
  --track: rgba(255,255,255,.14); --tint-1: rgba(255,255,255,.04); --tint-2: rgba(255,255,255,.10);
  --divider: rgba(255,255,255,.14); --border: rgba(255,255,255,.22);
  --field-bg: #2A3370; --field-border: #6E7BD6; --field-placeholder: #B8C2EE;
  --scrim: rgba(5,10,31,.7); --path-dot: #B8C2EE;
}

/* ---------- Scene backgrounds (the .backdrop the Shell already renders) ---------- */
[data-register="play"] .backdrop { background: var(--sky); }
[data-register="play"][data-theme="day"] .backdrop::before {          /* soft clouds */
  inset: 0; background:
    radial-gradient(70px 28px at 16% 12%, #fff 96%, transparent),
    radial-gradient(48px 24px at 23% 9%, #fff 96%, transparent),
    radial-gradient(90px 32px at 80% 20%, rgba(255,255,255,.92) 96%, transparent),
    radial-gradient(56px 26px at 88% 17%, rgba(255,255,255,.92) 96%, transparent),
    radial-gradient(160px 46px at 50% 96%, rgba(255,255,255,.75), transparent 70%);
  animation: drift 60s linear infinite alternate;
}
[data-register="play"][data-theme="day"] .backdrop::after {           /* a few bubbles */
  opacity: 1; mix-blend-mode: normal; background:
    radial-gradient(circle at 12% 70%, rgba(255,255,255,.9) 0 2px, rgba(255,255,255,.35) 3px 9px, transparent 10px),
    radial-gradient(circle at 90% 58%, rgba(255,255,255,.9) 0 2px, rgba(255,255,255,.35) 3px 7px, transparent 8px),
    radial-gradient(circle at 76% 84%, rgba(255,255,255,.9) 0 2px, rgba(255,255,255,.35) 3px 12px, transparent 13px),
    radial-gradient(circle at 30% 40%, rgba(255,255,255,.8) 0 1px, rgba(255,255,255,.3) 2px 5px, transparent 6px);
  animation: float 14s ease-in-out infinite alternate;
}
[data-register="play"][data-theme="night"] .backdrop::before {        /* stars, two tiles */
  inset: 0; background:
    radial-gradient(1.5px 1.5px at 20px 30px, #fff 50%, transparent),
    radial-gradient(1px 1px at 120px 80px, #fff 50%, transparent),
    radial-gradient(1.5px 1.5px at 70px 150px, #DCE3FF 50%, transparent);
  background-size: 180px 180px;
}
[data-register="play"][data-theme="night"] .backdrop::after {
  opacity: .6; mix-blend-mode: normal;
  background: radial-gradient(1px 1px at 40px 60px, #fff 50%, transparent),
              radial-gradient(1.5px 1.5px at 200px 20px, #33E1FF 50%, transparent);
  background-size: 260px 260px; animation: twinkle 4s ease-in-out infinite alternate;
}
@keyframes drift { to { transform: translateX(24px); } }
@keyframes float { to { transform: translateY(-16px); } }
@keyframes twinkle { from { opacity: .35; } to { opacity: .8; } }

/* ---------- One-viewport screen frame ---------- */
[data-register="play"] .play-screen {
  height: var(--vvh, 100dvh); overflow: hidden; display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto auto;      /* hud, map, stage, tray, composer */
  font-family: var(--font-game); color: var(--fg);
  animation: screen-in var(--screen, 260ms) var(--ease-out) both;
}
@keyframes screen-in { from { opacity: 0; transform: translateX(var(--from, 24px)) scale(.96); } }

/* ---------- Gel buttons ---------- */
.gel-btn {
  --gel: var(--gel-primary); --gel-ink: var(--gel-primary-ink); --gel-edge: var(--gel-primary-edge);
  position: relative; display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  min-height: 56px; padding: 0 28px; border-radius: 999px;
  border: var(--outline-w) solid var(--outline);
  background: radial-gradient(ellipse 46% 24% at 50% 24%, rgba(255,255,255,.75), rgba(255,255,255,0)) , var(--gel);
  color: var(--gel-ink); font: 700 20px/1 var(--font-game); text-shadow: var(--gel-text-shadow);
  box-shadow: 0 6px 0 var(--gel-edge), inset 0 -4px 8px rgba(0,0,0,.18),
              inset 0 2px 0 rgba(255,255,255,.55), 0 10px 18px -8px rgba(16,33,63,.45);
  transition: transform 100ms var(--ease-out), box-shadow 100ms var(--ease-out), filter 160ms;
  cursor: pointer; -webkit-tap-highlight-color: transparent; user-select: none;
}
.gel-btn:active, .gel-btn.is-pressed { transform: translateY(5px) scale(1.03, .95);
  box-shadow: 0 1px 0 var(--gel-edge), inset 0 -2px 6px rgba(0,0,0,.2), inset 0 2px 0 rgba(255,255,255,.4); }
@media (hover: hover) and (pointer: fine) { .gel-btn:hover { transform: translateY(-2px); filter: brightness(1.05); } }
.gel-btn--secondary { --gel: var(--gel-secondary); --gel-ink: var(--gel-secondary-ink); --gel-edge: var(--gel-secondary-edge); text-shadow: none; }
.gel-btn--win { --gel: var(--gel-win); --gel-ink: var(--sticker-ink); --gel-edge: var(--outline); text-shadow: none; }
.gel-btn--lg { min-height: 72px; min-width: 220px; font-size: 30px; font-variation-settings: "wdth" 112; text-transform: uppercase; }
.gel-btn--sm { min-height: 48px; padding: 0 18px; font-size: 17px; font-weight: 600; box-shadow: 0 4px 0 var(--gel-edge), inset 0 2px 0 rgba(255,255,255,.5); }
.gel-btn:disabled { filter: grayscale(.6) opacity(.6); transform: none; box-shadow: 0 2px 0 var(--gel-edge); cursor: not-allowed; }
.gel-btn:focus-visible, .icon-btn:focus-visible { outline: 3px solid var(--focus); outline-offset: 4px; }

/* ---------- Round icon buttons (screen edges) ---------- */
/* icon buttons: use both classes, class="gel-btn icon-btn" */
.icon-btn { width: 56px; min-height: 56px; height: 56px; padding: 0; border-radius: 50%; font-size: 26px; }
.icon-btn--sm { width: 48px; height: 48px; min-height: 48px; font-size: 22px; }
.icon-btn__label { display: block; margin-top: 8px; font: 600 15px/1 var(--font-game); color: var(--fg); text-align: center; }

/* ---------- Game panels, stickers, ribbons ---------- */
[data-register="play"] .panel {
  border: var(--outline-w) solid var(--panel-outline); border-radius: 24px; padding: 16px;
  background: var(--panel-fill); color: var(--fg);
  box-shadow: inset 0 2px 0 var(--panel-hi), 0 5px 0 var(--panel-edge), 0 14px 24px -14px rgba(16,33,63,.35);
}
[data-register="play"][data-theme="night"] .panel { -webkit-backdrop-filter: blur(12px) saturate(1.2); backdrop-filter: blur(12px) saturate(1.2); }
[data-register="play"] .sticker {
  display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 12px;
  border: 2.5px solid var(--outline); background: #FFFFFF; color: var(--sticker-ink);
  font: 700 15px/1.1 var(--font-game); transform: rotate(var(--tilt, -3deg)); box-shadow: 0 3px 0 var(--outline);
}
.sticker--progress { background: var(--mint-fill); }
.sticker--win { background: var(--sun-fill); }
.sticker--boss { background: var(--coral-fill); }
.sticker--chrome { background: linear-gradient(180deg, #FFFFFF 0%, #D9DEE3 45%, #8E99A3 52%, #E9EEF2 100%); color: #10213F; }
.ribbon {
  position: relative; display: inline-block; padding: 8px 28px; transform: rotate(-2deg);
  background: var(--ice); color: var(--ice-ink); font: 700 22px/1.1 var(--font-game);
  font-variation-settings: "wdth" 108; border: var(--outline-w) solid var(--outline);
  border-radius: 8px; box-shadow: 0 4px 0 var(--outline);
}
.ribbon::before, .ribbon::after {                    /* notched tails */
  content: ''; position: absolute; top: 10px; width: 22px; height: 100%; z-index: -1;
  background: var(--gel-primary-edge); border: var(--outline-w) solid var(--outline);
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 30% 50%);
}
.ribbon::before { left: -16px; } .ribbon::after { right: -16px; transform: scaleX(-1); }

/* ---------- HUD (replaces .topbar on Play) ---------- */
[data-register="play"] .topbar { display: none; }
[data-register="play"] .hud {
  display: grid; grid-template-columns: 56px minmax(0, 1fr) auto; align-items: center; gap: 10px;
  padding: calc(6px + env(safe-area-inset-top)) 12px 6px; height: auto; min-height: 64px;
  background: none; border: 0; backdrop-filter: none;
}
.hud__name { font: 700 15px/1.1 var(--font-game); color: var(--fg); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hud__right { display: flex; gap: 8px; }
[data-register="play"] .hp {                          /* segmented glossy HP: 10 x 10 HP */
  position: relative; height: 20px; border-radius: 10px; overflow: hidden;
  background: var(--track); border: var(--outline-w) solid var(--outline);
}
[data-register="play"] .hp__fill, [data-register="play"] .hp__ghost { position: absolute; inset: 0 auto 0 0; }
[data-register="play"] .hp__fill { background: linear-gradient(180deg, #FFB0A6 0%, var(--coral-fill) 50%, #E04A3C 100%); transition: none; }
[data-register="play"] .hp__ghost { background: #FFFFFF; transition: width 450ms var(--ease-out) 150ms; }
[data-register="play"] .hp::before { content: ''; position: absolute; inset: 2px 6px auto; height: 35%; border-radius: 6px; background: rgba(255,255,255,.45); z-index: 2; }
[data-register="play"] .hp::after { content: ''; position: absolute; inset: 0; z-index: 3;
  background: repeating-linear-gradient(90deg, transparent 0 calc(10% - 2px), var(--outline) calc(10% - 2px) 10%); }
[data-register="play"] .hp__label { font: 700 18px/1 var(--font-game); font-variant-numeric: tabular-nums; color: var(--fg); }

/* ---------- Level map (the existing .mpath / .mstep markup) ---------- */
[data-register="play"] .mpath { display: flex; align-items: center; height: 64px; padding: 0 12px; margin: 0; list-style: none; }
[data-register="play"] .mpath__item { display: flex; align-items: center; flex: 1 1 auto; }
[data-register="play"] .mpath__item:last-child { flex: 0 0 auto; }
[data-register="play"] .mpath__item:not(:last-child)::after {
  content: ''; flex: 1; height: 8px; margin: 0 4px;
  background: radial-gradient(circle, var(--path-dot) 3px, transparent 3.5px) 0 50% / 12px 8px repeat-x;
}
[data-register="play"] .mpath__item:has(.is-taught)::after {
  background-image: radial-gradient(circle, var(--mint-fill) 3.5px, transparent 4px);
}
[data-register="play"] .mstep {
  position: relative; flex: none; width: 48px; height: 48px; padding: 0; border-radius: 50%;
  display: grid; place-items: center; border: var(--outline-w) solid var(--outline);
  background: radial-gradient(ellipse 50% 26% at 50% 26%, rgba(255,255,255,.8), transparent), var(--gel-secondary);
  color: var(--gel-secondary-ink); font: 700 20px/1 var(--font-game); box-shadow: 0 4px 0 var(--outline);
}
[data-register="play"] .mstep__text, [data-register="play"] .mstep__sub { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
[data-register="play"] .mstep .meter {                 /* progress ring; set style="--m: 60" */
  position: absolute; inset: -7px; border-radius: 50%; height: auto; background:
    conic-gradient(var(--mint-fill) calc(var(--m, 0) * 1%), var(--track) 0);
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px));
          mask: radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px));
}
[data-register="play"] .mstep .meter__fill { display: none; }
[data-register="play"] .mstep.is-next { background: radial-gradient(ellipse 50% 26% at 50% 26%, rgba(255,255,255,.7), transparent), var(--gel-primary); color: var(--gel-primary-ink); animation: node-pulse 1.2s var(--ease-out) 2; }
[data-register="play"] .mstep.is-taught { background: radial-gradient(ellipse 50% 26% at 50% 26%, rgba(255,255,255,.7), transparent), var(--mint-fill); color: var(--sticker-ink); }
[data-register="play"] .mstep--boss { width: 56px; height: 56px; font-size: 28px; border-color: var(--outline); box-shadow: 0 4px 0 var(--outline), 0 0 0 4px var(--coral-fill); }
[data-register="play"] .mstep--boss.is-ko { filter: grayscale(1); opacity: .6; }
@keyframes node-pulse { 50% { box-shadow: 0 4px 0 var(--outline), 0 0 0 8px var(--ice-line); } }

/* ---------- Comic speech bubbles (Talking-Tom layout) ---------- */
.bubble {
  position: relative; max-width: min(92%, 340px); padding: 12px 16px; border-radius: 24px;
  background: var(--bubble-fill); color: #10213F; border: var(--outline-w) solid var(--outline);
  box-shadow: 0 4px 0 var(--outline); font: 500 19px/1.3 var(--font-game);
  animation: bubble-pop 160ms var(--ease-pop) both;
}
.bubble::after {                                   /* tail toward Pip's head */
  content: ''; position: absolute; left: 50%; bottom: -15px; width: 22px; height: 22px;
  background: inherit; border-right: var(--outline-w) solid var(--outline); border-bottom: var(--outline-w) solid var(--outline);
  transform: translateX(-50%) rotate(45deg); border-bottom-right-radius: 4px;
}
.bubble--pip { margin: 8px auto 0; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.bubble--me { background: var(--her-bubble); font: 600 16px/1.4 'Manrope', sans-serif; max-width: 78%; margin-left: auto; border-width: 2.5px; }
.bubble--me::after { left: auto; right: 22px; transform: rotate(45deg); }
.bubble--boss { background: var(--coral-fill); color: #10213F; font-weight: 700; font-size: 16px; transform: rotate(3deg); }
@keyframes bubble-pop { from { opacity: 0; transform: translateY(6px) scale(.9); } }

/* ---------- Bottom: weapon tray + chunky input ---------- */
.tray { display: flex; align-items: center; gap: 8px; height: 56px; padding: 0 12px; overflow-x: auto; scrollbar-width: none; }
/* weapons: render as class="weapon gel-btn gel-btn--secondary gel-btn--sm" */
[data-register="play"] .weapon { flex: none; }
[data-register="play"] .weapon.is-on { --gel: var(--gel-win); --gel-ink: var(--sticker-ink); }
[data-register="play"] .composer-wrap { padding: 8px 12px calc(8px + env(safe-area-inset-bottom)); background: none; }
[data-register="play"] .composer {
  display: flex; align-items: center; gap: 8px; min-height: 60px; padding: 4px 4px 4px 18px;
  border-radius: 30px; border: var(--outline-w) solid var(--field-border); background: var(--field-bg);
  box-shadow: inset 0 3px 0 var(--tint-2), 0 4px 0 var(--outline);
}
[data-register="play"] .composer__input { font: 600 17px/1.35 'Manrope', sans-serif; color: var(--fg); background: none; border: 0; max-height: 72px; }
/* send: class="composer__send gel-btn icon-btn" */
[data-register="play"] .composer__send { width: 52px; height: 52px; min-height: 52px; }

/* ---------- Reduced motion ---------- */
@media (prefers-reduced-motion: reduce) {
  [data-register="play"] .backdrop::before, [data-register="play"] .backdrop::after { animation: none; }
  [data-register="play"] .play-screen { animation: fade 120ms linear both; }
  .gel-btn:active { transform: none; }
}
```

Compose by stacking classes in the markup (`class="gel-btn icon-btn"`, `class="weapon gel-btn gel-btn--secondary gel-btn--sm"`).

**Theme toggle** (Play only; Studio stays forest). On the home screen, a round icon button in the top-right toggles ☀️ / 🌙, with `aria-pressed` and the label "Night mode".

```js
const KEY = 'pip.theme'
export function initialTheme() {
  try { const t = localStorage.getItem(KEY); if (t === 'day' || t === 'night') return t } catch {}
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day'
}
export function applyTheme(root, t) {
  root.dataset.theme = t
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'night' ? '#0E1530' : '#BFE6FF')
}
export function setTheme(root, t) { applyTheme(root, t); try { localStorage.setItem(KEY, t) } catch {} }
```

- **First visit:** follow `prefers-color-scheme`, and keep following live OS changes (a `matchMedia` change listener) until she taps the toggle.
- **After a tap:** her choice is remembered and wins over the OS.
- **Switching:** a 240ms crossfade of `background` and `color` on the shell (instant under reduced motion). `MascotStage` gets `theme={t}`.
- **Studio:** leaving Play restores the meta color to `#001914`.

### Play components

**Gel buttons and icon buttons.** One primary gel per screen (blue by day, cyan by night). Secondary gels are white by day and indigo by night. The win gel (sun) is used only for the equipped weapon and for the K.O. finisher pick.
- **Press:** 100ms, sink 5px, squash `scale(1.03,.95)`, and the edge collapses to 1px. Feedback fires on `pointerdown`.
- **Sizes:** `--lg` 72px (PLAY), default 56px, `--sm` 48px. Labels are Fredoka 700 at 20px or more, so the large-text rule applies, and the label still clears 4.5:1 on the gel's middle stop.
- **Icon buttons:** 56px circles (48px small) with a 26px icon and an optional label under them (Fredoka 600 15px). They sit along the screen edges, Talking Tom style. Every icon button has an `aria-label`.

**Panels, stickers, ribbons.** Play has no hairline web cards; everything is a `.panel` with a 3px outline, a top-light gradient and a 5px edge.
- **Stickers** (`.sticker`, ±2–4deg tilt via `--tilt`) carry status: progress (lime), win (sun), boss and Pip-believes (coral), chrome for Brain-version badges. `.sticker--holo` adds the holo overlay at .5 opacity with one 1.2s sweep when it first appears.
- **Ribbons** title a screen or a mission ("Fractions", "Pip's Brain v1", "K.O."), centered, −2deg.

**HUD** (mission, Brain, quiz).
- **Left:** a round 🏠 home icon button.
- **Center:** the boss name (Fredoka 700 15px) over the segmented glossy HP bar (10 segments, 20px tall, coral gel fill, navy separators) with the HP number at 18px.
- **Right:** a round Brain-version badge (48px chrome sticker, "v2") and a mute icon button (sound off by default).
- **Rules:** no text nav links, no top bar, no avatar menu on student screens. On a hit, each lost segment pops white for 150ms, then drains over 450ms.

**Level map** (the existing `.mpath`, `.mstep` markup).
- **Path:** nodes ① ② ③ (48px gel circles) → boss (56px, emoji, coral ring) → exam (🏆 48px), joined by a dotted path that turns lime as steps are taught.
- **Progress ring:** each step node wears a lime progress ring (`--m`, 0–100).
- **States:** the next step is the primary gel with two 1.2s ring pulses; a taught step is lime with a ✓; a K.O.'d boss is grayscale. All steps stay open, so she picks the order.
- **Step names:** tapping a node shows its concept as a sticker label floating under the map for 2.4s (absolute, so the layout doesn't move) and sets the focus.
- **Next hint:** said by Pip in the bubble ("Teach me ② next, or any step"), not printed under the map. The end is always visible on the map itself.

**Speech bubbles** (CONTRACT v3.1, `framing="hero"`).
- **Pip's bubble:** Pip's latest line is a comic bubble (white, 3px outline, tail down) at the top of the stage, above Pip's head. Fredoka 500 19px, 3 lines at most (Pip speaks in 1–2 sentences). The bubble pops in over 160ms; when voice is on, captions always show and `mouth` animates.
- **Her bubble:** her last message is a small bubble (`--her-bubble`, Manrope 600 16px, 2 lines, tail to the bottom-right) overlaid at the bottom-right of the stage. It "flies" 24px up and fades into Pip's head after Pip answers (260ms). It never changes color for being wrong.
- **Pip thinking:** within 100ms Pip leans 4deg, and the bubble shows "…" as three 8px bouncing dots (Fredoka) with an `aria-live="polite"` "Pip is listening…". After 1s Pip plays its writing pose and the label changes to "Pip is thinking…". After 8s the bubble shows "Still thinking. Long thought." plus a secondary "Try again" gel.
- **Boss taunts:** `.bubble--boss` (coral, tilted 3deg) near the boss at the stage's top-right, once when she starts typing, at most once every 20s, auto-hiding after 2.4s.
- **Chat history:** a round 📓 icon button in the tray opens it as a bottom-sheet notebook.
  - **Panel:** `--note` paper ruled with `repeating-linear-gradient(180deg, transparent 0 31px, rgba(16,33,63,.10) 31px 32px)`, a 2px `--ice-line` margin rule at 40px, a 3px outline, a 28px top radius, and a height of 80% of the viewport.
  - **Content:** it scrolls inside itself. Pip's lines carry a 32px face; her lines are right-aligned in her bubble style. Navy text on paper is 14.4:1 in both themes.

**Weapon tray and input.**
- **Tray (56px):** 📓 history, the weapon gels (`--sm`, the equipped one in sun with "⚔"), and on the right "Quiz Pip ▶". The quiz button is secondary until every step is taught, then becomes the screen's primary with a 220ms pop.
- **Weapons:** new weapons pop `scale(0 → 1.1 → 1)` in 220ms with up to 3 star-glints. Several unlocks share one sticker toast. Weapons are never used up and never look purchasable. The tray scrolls sideways inside itself if needed.
- **Input:** a chunky rounded field (60px, 30px radius, 3px outline, inner top shadow) with a 52px round send gel and the placeholder "Explain it to Pip…". It is never a bordered web form field.

**Boss feedback** (timings from UX_TEARDOWN.md §6a). The boss is the 3D glossy ragdoll standing smaller behind Pip to the right (falling back to an emoji when there is no WebGL).
- **Hit (`.shake-hit`), 900ms at most:** 70ms hit-stop, then a 240ms ease-pop squash together with a 280ms ±8px / ±1.5deg shake on the boss only. HP segments drop at once. A coral damage sticker "−40" rises 28px and fades over 700ms. Then a caption sticker pops in at the top-center of the stage (white sticker, Fredoka 700 18px, held 2.8s, tap to dismiss).
- **Heal (`.shake-heal`):** the boss gloats over 360ms (scale 1.08, ±3deg) with a "+20 HP" coral sticker.
- **Whiff (`.shake-whiff`):** a 280ms tilt and "Top-Top Bottom-Bottom is unbothered."
- **Never:** a page shake on a normal hit, or moving chat text. Optional `navigator.vibrate(10)`.

**Pip's Brain** (one screen).
- **Layout:** a ribbon title "Pip's Brain v1", then a cloud-shaped panel (`.brain__cloud`: `--panel-fill`, 3px outline, 40px radius, three `.brain__puff` circles trailing to Pip at the bottom-left).
- **Notes:** cream paper, a tape strip, alternating ±1.2deg tilt, her quote in Manrope 600 17px (3-line clamp, tap to read the full message in the notebook), and a 15px concept sticker.
- **Paging:** at most 3 notes per page (2 when the stage area is under 520px tall). More pages are horizontal scroll-snap pages inside the cloud, with dot stickers and a "Next ▶" secondary gel; the page itself never scrolls.
- **Wrong note:** a coral glow `0 0 0 3px var(--coral-fill), 0 0 28px -4px var(--coral-fill)`, a one-time ±2deg wobble, and a coral sticker "Pip believes this 😵".
- **Fixed note:** lime glow and a lime sticker "fixed after N re-teach", reached by a 400ms flip with up to 3 glints.
- **Bottom:** the "Quiz Pip ▶" primary gel.

**Quiz** (one question per screen).
- **Top:** the HUD with three dot stickers.
- **Center:** Pip, with the question and then Pip's work typed into the speech bubble one line every 300ms (tap to show it all).
- **Result:** a sticker: "Pip got it" (lime, 💡/🎉) or "My brain has a bug 😵" (coral, Pip's miss), plus a small "Used rule ③" sticker that opens that note in a sheet.
- **Bottom:** "Next ▶" (primary), or on a miss "Re-teach" (primary) with "Next" as secondary.
- **Never:** a ✗, a red row or a score against her.

**K.O. sequence.** Full-screen beats, each fitting one viewport. Moving between beats is a 260ms swoosh. "Next ▶" is a gel at the bottom; tapping anywhere also advances after 1.5s.
1. **Finisher:** a ribbon "Pick a finishing move" and the weapons as big win gels. On pick: 120ms hit-stop, ±4px/200ms screen shake (the only one in the product), and the ragdoll squashes flat and slides out over 500ms. Optional `vibrate([15,40,15])`.
2. **Stamp:** "K.O." in Fredoka 700 96px (wdth 125, 6px outline stroke) stamps in at −6deg (`scale 1.4 → 1`, 240ms ease-pop), with the caption "Top-Top Bottom-Bottom has left Pip's brain.", a chrome sticker "Brain v1 → v2" and Pip celebrating. No confetti, no "!".
3. **Card:** the quiet K.O. card (below) on a `--scrim`, with "Save image" (secondary) and "Next" (primary).
4. **Cliffhanger:** Pip's rumor question in the bubble, plus the next boss as a black silhouette with a half-masked name ("Divid████").
5. **What Ms. Rivera sees:** one panel with the three concepts and their statuses in plain words (stickers), and a 🏠 "Home" primary gel.

**K.O. card (`.ko-card`), the quiet premium exception.** It is unchanged in both themes and takes no gel, outline, Fredoka, sticker or glint.
- **Card:** `aspect-ratio: 9/16`, width `min(78vw, 340px)`, `--ko-bg` with grain at .05, a 1px `rgba(239,239,233,.08)` edge, 20px radius, 28px 24px padding.
- **Front:** "No. 0147" (Geist Mono 12px `--ko-meta`, optionally holo text) and two emoji; a 1px metallic hairline that sweeps once over 6s; the struck equation in Fraunces 400 32px; nickname (Manrope 600 14px) and date (mono 12px) at the bottom.
- **Back:** tap to flip (600ms; a 160ms crossfade under reduced motion) to the boss name (Fraunces 600 20px), her rule (Fraunces italic 17px) and Pip's line.
- **Never:** XP, scores, confetti, "!", ranks, the center's name.

**Student home = title screen** (one viewport).
- **Scene:** the full scene with Pip centered in its room (`framing="hero"`, about 55% of the height).
- **Above Pip:** its speech bubble with one line (the cliffhanger, or "I don't know much yet. That's why I need you.").
- **Top corners:** a Brain-version chrome sticker (top-left); theme ☀️/🌙 and mute icon buttons (top-right).
- **Below Pip:** a ribbon with the current mission's topic and a "vs 🍕🦵" boss sticker, then the big "PLAY" gel (`--lg`) that resumes or starts the current mission.
- **Bottom row:** three labeled round icon buttons: "Look" (opens the picker sheet), "Vault" (opens the shelf sheet of defeated bosses), "Missions" (a sheet listing other missions and the saved session).
- **States:** with no mission, PLAY is disabled with Pip saying "No mission yet. Ms. Rivera will send one."

**Toasts, empty, error, loading (Play).**
- **Toasts:** sticker toasts drop in just under the HUD (never at the bottom, where the input is), 2 at most, 4s, `role="status"`.
- **Empty and error:** a panel with Pip's face, one line and one gel. Errors are deadpan and never blame her: "Pip lost the thread." plus a "Try again" gel. Never a red banner.
- **Loading:** Pip's thinking bubble or a pulsing silhouette. No spinner, no skeleton bars.

**Screen transitions.**
- **Forward:** `screen-in` (opacity plus 24px slide plus `scale(.96 → 1)`, 260ms ease-out); `--from: -24px` for back.
- **View Transitions:** use `document.startViewTransition` where supported, with the same keyframes on `::view-transition-new(root)`.
- **Reduced motion:** a 120ms crossfade.
- **Never:** confetti.

**3D stage and environments** (`MascotStage` props `theme`, `framing`, `mouth`).
- **Canvas:** transparent (`alpha: true`), no box, border or card. The canvas sits in the stage grid row and the scene gradient shows through, so Pip stands in the scene. No text ever sits on the canvas; bubbles and stickers are DOM overlays positioned above it.
- **Performance:** DPR ≤ 1.5, 30fps, paused offscreen, a still pose under reduced motion, an emoji fallback without WebGL.
- **Touch:** a poke reacts on `pointerdown` within 100ms with one of 4–6 reactions per zone, never the same one twice in a row. Pip's eyes follow the pointer within ±15deg.

| Environment | `theme="day"` (bright pastel) | `theme="night"` (dusk / neon) |
|---|---|---|
| Lights | hemisphere sky `#D8F1FF` / ground `#E3FCEB` at 1.0; warm-white key upper-left 1.1; white rim | hemisphere `#333E86` / `#0E1530` at .6; cool key .8; cyan rim `#33E1FF` .9 |
| Arena | pastel playground disc (mint-sand `#E8F7E4`, white rim), soft `ContactShadows` .35 | dark disc `#1B1F4D` with an emissive cyan ring (`#33E1FF`, .8) and a yellow spot on the boss |
| Room | walls sky `#CDEBFF`, rug sand `#F3E3C3`, accents mint `#BFF0D4`, a sunny window | walls `#1E2860`, rug `#2A3370`, desk lamp warm `#FFD23F` pool, a cyan neon strip |
| Garden | floating island (grass `#7FD67A` on sand), aqua sky, slow bubbles | the same island at dusk, a moon, yellow fireflies (≤ 8 emissive points) |
| Fog / bg | none (the CSS sky shows) | none (the CSS stars show) |

No pink or lilac lights in either theme.

**Mascot, boss and garden art direction.** The mascots are fuzzy, soft, cute cartoon collectibles (Y2K fuzzy-toy and fuzzy-collectible energy), not baby plush. The boss is the shiny villain against the fuzzy friend. The proportions, deadpan rules and silhouette test from UX_TEARDOWN.md §6b still apply.
- **Shape:** head about the size of the body (1:1 to 1.2:1, never the infant 2:1), stubby limbs, a low center of gravity, a slight 3/4 turn, readable as a solid shape at 48px. Little ear tufts and a crown tuft give each creature its one defining feature.
- **Fur (all creatures except the bot):**
  - **Body:** fuzzy velvet, `MeshPhysicalMaterial` roughness .85–.95, metalness 0, `sheen` 1, `sheenRoughness` .6–.8, `sheenColor` the patch tint.
  - **Shell fur:** 12 shells on phones and 20 on laptop, offset along the normals 0–0.03 units, alpha from a noise texture that thins toward the tips, with gravity droop on the outer shells.
  - **Tufts:** 3–6 hair-card tufts on the head and ears. The fluff wobbles on poke (a 240ms spring).
- **The bot:** the one glossy option. Candy plastic, roughness .2–.35, clearcoat 1, one chrome or iridescent accent.
- **Eyes:** glossy black capsules with two specular dots (a large one upper-left, a small one lower-right) under heavy deadpan lids, about 30% closed. No lashes, no big shiny irises. Emotion comes from the lids and tilt; 💡 rounds the eyes for 400ms.
- **Colorways:** gender-neutral and her choice: aqua `#5FE3E8` (default, "Aqua / Cream"), tangerine `#FF9A3C`, lime `#B8F04A`, sky `#7CC4FF`, sand `#E8CFA0`, graphite `#5A6378`. Each has a lighter belly and face patch (the base mixed 55% toward `#FFF8F0`) and darker tufts (the base at −25% lightness). By day, the aqua default gets `#2BB8C2` tufts and a white rim light so it separates from the sky. 3D only.
- **Boss:** glossy candy plastic (roughness .2–.35, clearcoat 1) in its own two emoji-derived colors. A floppy spring-jointed ragdoll that flails on hits and settles within about 600ms, is bouncier than Pip, flops flat on K.O., and stays cartoon only.
- **Garden:** a Forest-app tree on the floating island. Glossy round leaves, growth seed → sprout → sapling → bloom with a 600ms pop. It never wilts; a setback sprouts a weed that re-teaching pulls out.
- **Accessories:** exactly `none | glasses | scarf | pencil | badge | backpack`.
- **Picker:** randomize does a 300ms spin-and-settle; the turntable auto-rotates at 0.4 rad/s and can be dragged.
- **Sparkles:** star-glints (`.glint`, a 4-point star clip-path, 8–12px, white or `--sun-fill`, 400ms) appear only on an unlock, a fix, a level-up or garden growth, 3 at most per event, never idle, never in Studio, never on the K.O. card.

### Studio components (unchanged from v1)

**Buttons.** `.btn` 44px (`--lg` 52px), `--r-md`, Manrope 700 15px. Primary: ice fill with ice-ink text, hover `#DCFEFE`, active `scale(.98)`. Secondary: transparent with a 1px `--border`. Ghost: no border, `--fg-muted`. One primary per screen; no gloss, edges or pills.

**Inputs.** `.input/.textarea/.select`: 44px, `--r-md`, 1px `--field-border` (3.7:1), 16px text, a 2px `--focus` outline.

**Gap report.**
- **Head:** `.report-head` with an eyebrow, the student name and a mono meta line.
- **Rows:** `.gap-list` is divided rows (not cards). Each `.gap` has a status pill and a `.gap__quote` in Fraunces italic 17px `--fg-muted` with a 2px left rule. "Fixed after 1 re-teach" uses `pill--ok`. The boss is a neutral `.chip`.
- **Tuesday box:** `.tuesday` on `--ice-soft` with a 1px `--ice-line`, 16px radius and 20px padding, holding the opener, Root cause, and Pip's question.
- **Parent preview:** `.phone` with `--surface-3` bubbles.
- **Phones:** summary first (status pills for the three concepts and the Tuesday opener); quotes expand on tap.

**Roster.** Rows with dividers on phones (name, grade in mono, since-last-session with a 2-line clamp, "—" in `--fg-subtle`, `.avatar--pip` with an ice ring). At 1024: a grid `minmax(200px,1.1fr) 72px minmax(0,3fr) 132px`, 64px rows, and the whole row links to the report.

**Insight card.** Glass, 24px padding (32px at 1024), `2fr 1fr` at 1024: eyebrow, a Fraunces 56px count, the misconception in Fraunces italic 24px, the boss chip, and the primary "Plan a workshop". The stat tile sits beside it.

**Stat tile.** `.panel` (Studio: `rgba(239,239,233,.03)`, 1px `--divider`, 12px radius, 16px padding), eyebrow, Fraunces 500 40px number, 14px caption. A missing measurement shows "—" with "not measured yet", never 0.

**Pricing card.** One glass card, max 440px: "$4" in Fraunces 64px, "/ active student / month", "$99 minimum" in mono, a range calculator, four checked items, the primary "Start pilot", and a "Stripe test mode" footnote.

**Toasts, empty, error, loading.** `.toast` on `--overlay` with a 3px left edge (`--success`, `--ice`, `--danger`), 4s; `.state` with one line and one button; `.skeleton` rows for tables.

## Layout Principles

**Play: one viewport, no page scroll.** Every Play screen fits `100dvh` at 390×844 and still works at 375×667.
- **Frame:** `.play-screen` is a fixed-height grid with `overflow: hidden`.
- **Overflow:** anything that doesn't fit becomes pages (scroll-snap plus dots plus a Next gel), tabs, or a sheet or drawer that scrolls inside itself (chat history, the Vault, the Missions list, a full note). Never a long page.
- **Keyboard:** track `visualViewport`: set `--vvh` to `visualViewport.height` and add `.is-typing` when it is more than 150px shorter than `innerHeight`.

| Mission screen row | 390×844 | 375×667 | Keyboard open (844 → ~508 / 667 → ~363) |
|---|---|---|---|
| Safe-area top | 47 | 0 | same |
| HUD (home, HP, badge, mute) | 64 | 56 | 48 (HP only, buttons 40px) |
| Level map | 64 | 56 (nodes 40px) | hidden |
| Stage (Pip, boss, both bubbles) | flex: about 503 (min 280) | flex: about 435 (min 240) | flex: about 384 / about 247 |
| ↳ Pip's bubble (overlay, 3 lines) | ≤ 104 | ≤ 104 | ≤ 80 (2 lines) |
| ↳ her bubble (overlay, 2 lines) | ≤ 64 | ≤ 64 | hidden |
| Weapon tray | 56 | 52 | hidden |
| Input row | 76 (60 + 16) | 68 (56 + 12) | 76 / 68 |
| Safe-area bottom | 34 | 0 | 0 |

In Safari with its toolbars showing, `dvh` is about 94px shorter. The stage absorbs the difference; if the stage would fall below its minimum, the level map collapses into 5 tiny dots inside the HUD.

| Screen | 390×844 budget | 375×667 |
|---|---|---|
| Home title | sticker and icons 64 · bubble 80 · Pip 360 · ribbon 52 · PLAY 72 · icon row 96 · safe areas | Pip 250, bubble 2 lines |
| Brain | HUD 64 · ribbon 48 · cloud with 3 notes (≈ 112 each) · Pip 140 (overlapping the cloud's corner) · Quiz gel 76 | 2 notes per page |
| Quiz | HUD 64 · Pip and bubble with work (stage) · result sticker 48 · gel row 76 | bubble 4 lines, the rest via "Show all" |
| K.O. beats | each beat: content centered, gel row 76 at the bottom | card width `min(78vw, 300px)` |

- **Laptop (≥1024):** the scene stays full-bleed. The HUD spans up to 1100px; the stage stays centered at up to 640px; the chat notebook docks as a right panel (380px, always open); Brain notes show 3-up without paging; level-map nodes grow to 56px (boss 64px). Still no page scroll.
- **Studio:** 4px grid, a 16px gutter (24px at 768), 72rem content. Sections 48px apart on phones and 64px at 1024. Divided rows rather than nested cards. On phones, minimize scrolling: summary first, details behind taps (gap-report quotes expand; the roster shows name and since-last-session first, with the report one tap away). Scrolling is acceptable in Studio.

## Depth & Elevation

| Level | Studio | Play |
|---|---|---|
| 0 | forest `--ink`, ribbon, grain | scene: day sky with clouds and bubbles / night navy with stars and cyan horizon |
| 1 | `.glass` (blur 10, one shadow) | `.panel`: 3px outline, top highlight, 5px edge (frosted blur 12 at night) |
| 2 | `--overlay` sheets and toasts | gels and icon buttons: outline, gloss, 6px pressable edge; stickers with a 3px edge |
| State | 2px focus ring | coral, lime and sun glows (3px ring plus a 28px halo); 3px focus ring with a 4px offset |
| Special | n/a | K.O. card: matte, flat, one deep shadow; no outline or gloss |

Pressable things have an edge, and static things have none or a shallow one. The edge is the affordance: if it has a 6px edge, it can be pressed. Glows mean state only, with one per viewport (except Brain notes). Sheets are bottom sheets (a 28px top radius, 3px outline) on phones and centered 560px panels at 768+.

## Do's and Don'ts

**Do**
- Make Play look like a game: a full-screen scene, the character in the middle, round icon buttons on the edges, gels, panels, stickers, ribbons, comic bubbles, the level map.
- Fit every Play screen in one viewport. Page, tab or drawer instead of scrolling.
- Keep the action color the only filled-button color, with one primary gel per screen.
- React within 100ms on `pointerdown`; keep the hit sequence at 900ms or less; make anything over 1.5s tap-to-skip; keep screen transitions at 300ms or less.
- Write Pip's lines with no "!" and no "Great job": deadpan, treating her as the expert. Physical comedy lands on the boss.
- Pair every color state with a word or icon. Check every pair against 4.5:1 (text) and 3:1 (UI boundaries) in both themes.
- Keep sound off by default (with a mute icon button). Honor `prefers-reduced-motion` everywhere.

**Don't (Play screens)**
- Top nav bars, text nav links, avatar menus, breadcrumbs, tables, dropdowns/`<select>`, hairline web cards, small grey text, form-looking inputs, spinners, skeleton bars, or a scrolling page.
- Pink or lilac in the UI. Pastel-candy styling. Babyish styling: the infant 2:1 head, lashes, big shiny irises.
- Coral on her bubble, her input, her name, a ✗ or a score. Red banners for errors.
- Confetti anywhere. XP, scores, "!", ranks or the center's name on the K.O. card. Gel, outline, Fredoka or glints on the card.
- Streaks, countdowns, guilt copy, need meters that drain while she is away, purchasable currency, loot boxes, consumable weapons, locked items that advertise a purchase, rewards for sharing (UX_TEARDOWN.md §6d).
- Caps, headphones or sunglasses on the mascot. A tap that does damage.
- More than 3 glints per event, idle sparkles, screen shake outside the K.O., or more than one taunt per 20s.
- Copies of real products in the nostalgia pass: OS window controls, handheld silhouettes, logos, fonts or sounds (see Nostalgia guardrails).
- Bar, drink, VIP-lounge or anything alcohol- or drug-coded in the Runway & Club look; flashes faster than 2 per second, flashes above .3 opacity, or red flashes; borrowed slang in narrator copy.

**Don't (Studio)**
- Gels, stickers, Fredoka, the boss's humor, glows or the Play palettes on tutor, owner, landing, pricing or parent screens.
- Alpha steps of ivory for text, or text below 14px except eyebrows and mono metadata.

## Responsive Behavior

| Width | Play | Studio |
|---|---|---|
| 360–389 | test floor; level-map nodes 40px; tray scrolls inside itself | no horizontal scroll |
| 375×667 | the budget above; 2 Brain notes per page; quiz bubble 4 lines | summary first |
| 390×844 (base) | the budget above; 56px icon buttons; thumbs reach PLAY, the input and the tray in the bottom 40% | one column, 44px targets |
| 768 | the stage widens; sheets become centered 560px panels | gutter 24; sheets become dialogs |
| 1024+ | notebook docks right (380px); Brain 3-up; HUD up to 1100px; nodes 56px | roster grid; insight 2fr/1fr; hero 60px |

- **Hover:** only under `(hover: hover) and (pointer: fine)`.
- **Tap targets:** 48px minimum in Play, 44px in Studio.
- **Semantics:** every node, note, sticker-button and card flip is a `<button>`. The HP bar is `role="meter"` with `aria-valuenow`. Bubbles, captions and the thinking state announce via `aria-live="polite"`.
- **Orientation:** landscape phones get the same scene in a two-column frame (stage left, bubble, tray and input right), still with no scroll.

## Nostalgia pass (G3, Play only)

**The brief:** more Y2K, plus the childhood these students actually had. For 10–15-year-olds that is about 2014–2020: blocky sandbox worlds, spooky-cute night games, crewmate-style party games, catch-'em-outside phone games, and iPad stickers. On top of that, the wider Y2K and Frutiger Aero revival ("2026 is the new 2016"; research/CHARACTERS_TEENS.md).

**What the nostalgia means here:** glossy plastic, sticker albums, chunky load bars, save points, starry wallpapers and an early-2000s handheld. Nothing should feel like a 4-year-old's app.

**Guardrails:**
- Play register only; Studio is unchanged.
- Gender-neutral palettes only (the Play tokens).
- No copied IP, logos, fonts, sounds or silhouettes from real products. Every frame, window and icon below is an original shape.
- The one-viewport rule and the performance budget still hold.
- Every effect is off under `prefers-reduced-motion` or `motion: low`.

**Performance budget for this pass:**
- **Weight:** CSS-only patterns; no new images except optional sound files (≤ 150 KB total).
- **Rendering:** at most 20 sparkle nodes alive; `backdrop-filter` on at most 2 elements per screen; animate only `transform` and `opacity`.
- **Background tabs:** pause every loop when `document.hidden` (toggle `.is-hidden` on `<html>` and set `animation-play-state: paused`).

### 1. Vault as a sticker album
- **Page:** the Vault sheet holds an album page with a 3×3 slot grid that fits the sheet without scrolling. More stickers go on more pages: scroll-snap, page dots, and a "Next ▶" gel.
- **Earned slot:** a puffy glossy sticker. The boss emoji (44px) sits on a gloss dome with a white die-cut border and a 3D drop; its name strip is Fredoka 600 15px.
- **Empty slot:** a dashed outline. The next boss shows as a black silhouette with half a name ("Divid████"): curiosity, never a purchase.
- **Holo variant:** earned only by the comeback (a wrong rule she fixed by re-teaching), never by luck or money. It uses the same sticker with `.is-holo`.
- **New sticker:** it drops in (`translateY(-40px) rotate(-12deg) → 0`, then squash `scale(1.08,.92) → 1`, 360ms, ease-pop), plays "sticker-stick", and makes 3 glints.
- **Tapping a sticker:** it peels (240ms): the corner curls up, the sticker lifts and tilts, "sticker-peel" plays, then the K.O. card opens in a sheet. Each sticker is a `<button aria-label="Addini Bottomini, defeated Oct 24">`.

```css
[data-register="play"] .album { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; padding: 12px;
  background: var(--note); border-radius: 16px; box-shadow: inset 0 3px 6px rgba(16,33,63,.18); }
[data-register="play"] .album__slot { aspect-ratio: 1; border-radius: 18px; border: 3px dashed rgba(16,33,63,.28);
  display: grid; place-items: center; font: 600 15px/1.1 var(--font-game); color: #2E4466; }   /* 8.9:1 on note */
.album-sticker { position: relative; width: 100%; height: 100%; display: grid; place-items: center; padding: 6px;
  border-radius: 18px; border: 4px solid #FFFFFF;                                  /* die-cut margin */
  background: radial-gradient(ellipse 60% 34% at 50% 22%, rgba(255,255,255,.85), rgba(255,255,255,0)),
              radial-gradient(circle at 50% 60%, #FFFFFF, #E6EEF8);
  box-shadow: 0 0 0 2.5px var(--outline), 0 5px 0 var(--outline), 0 12px 18px -10px rgba(16,33,63,.5),
              inset 0 -6px 10px rgba(16,33,63,.10);                                 /* puffy */
  transform: rotate(var(--tilt, -2deg)); transition: transform 160ms var(--ease-out); }
.album-sticker.is-holo { background: radial-gradient(ellipse 60% 34% at 50% 22%, rgba(255,255,255,.85), transparent),
  conic-gradient(from 210deg, #33E1FF, #A3F04A, #FFD23F, #FF9A3C, #4F82FF, #33E1FF); }
.album-sticker::after {                                                            /* peel corner */
  content: ''; position: absolute; right: -4px; bottom: -4px; width: 26px; height: 26px; border-radius: 0 0 14px 0;
  background: linear-gradient(135deg, transparent 50%, #E8EEF5 50%, #FFFFFF 75%);
  box-shadow: -3px -3px 6px rgba(16,33,63,.25); transform: scale(0); transform-origin: 100% 100%;
  transition: transform 240ms var(--ease-pop); }
.album-sticker.is-peeling { transform: translateY(-6px) rotate(4deg) perspective(400px) rotateX(10deg); }
.album-sticker.is-peeling::after { transform: scale(1); }
.album-sticker.is-new { animation: stick-in 360ms var(--ease-pop) both; }
@keyframes stick-in { 0% { transform: translateY(-40px) rotate(-12deg); opacity: 0; }
  70% { transform: translateY(0) rotate(-2deg) scale(1.08,.92); opacity: 1; } 100% { transform: rotate(-2deg); } }
```

### 2. Window-chrome sheets and drawers
Every Play sheet (notebook history, Vault, Missions, Look, the Rivera beat panel) wears one original glossy OS-window skin:
- **Title bar:** a pill-ended glossy bar with a small app-icon sticker on the left and the title in Fredoka 700 19px, which counts as large text (white on blue 5.0–6.7:1 by day, ink on cyan 7.6–13.7:1 by night).
- **Bubbles:** two round glossy bubbles on the right: a fold bubble (aqua, "–", collapses the sheet to half height) and a close bubble (sun, "×"). Each is 24px visually inside a 48px hit area. This arrangement (round, right-side, aqua plus sun) deliberately matches no real OS.
- **Body:** an inset panel (a sunken well with an inner shadow) that is the only part that scrolls.
- **Motion:** the window opens with a 220ms scale-in from the button that opened it (`transform-origin` set from the trigger's rect) and closes in 160ms.

```css
[data-register="play"] .sheet { padding: 0; border: var(--outline-w) solid var(--outline); border-radius: 22px 22px 0 0;
  background: var(--panel-fill); box-shadow: 0 -6px 0 rgba(16,33,63,.12), 0 -20px 50px -20px rgba(16,33,63,.5);
  animation: win-in 220ms var(--ease-pop) both; }
@keyframes win-in { from { opacity: 0; transform: translateY(16px) scale(.94); } }
.win__bar { display: flex; align-items: center; gap: 10px; height: 52px; padding: 0 6px 0 14px;
  border-bottom: var(--outline-w) solid var(--outline); border-radius: 19px 19px 0 0;
  background: radial-gradient(ellipse 70% 40% at 50% 18%, rgba(255,255,255,.55), rgba(255,255,255,0)), var(--gel-primary);
  color: var(--gel-primary-ink); font: 700 19px/1 var(--font-game); text-shadow: var(--gel-text-shadow); }
.win__title { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.win__btn { width: 48px; height: 48px; display: grid; place-items: center; background: none; border: 0; cursor: pointer; }
.win__btn::before { content: attr(data-glyph); width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center;
  border: 2.5px solid var(--outline); color: #10213F; font: 700 16px/1 var(--font-game);
  background: radial-gradient(ellipse 60% 35% at 50% 25%, rgba(255,255,255,.9), rgba(255,255,255,0)), var(--bubble, #FFD23F);
  box-shadow: 0 2px 0 var(--outline); }
.win__btn--fold { --bubble: #5FE3E8; }
.win__btn:active::before { transform: translateY(2px) scale(.94); box-shadow: none; }
.win__body { margin: 10px; max-height: calc(var(--vvh, 100dvh) * .7); overflow: auto; overscroll-behavior: contain;
  border-radius: 14px; border: 2px solid var(--outline); background: var(--surface);
  box-shadow: inset 0 3px 8px rgba(16,33,63,.18); }
.win__body--paper { background: var(--note) repeating-linear-gradient(180deg, transparent 0 31px, rgba(16,33,63,.10) 31px 32px); }
```

Markup: `<div class="win__bar"><span class="sticker">📓</span><span class="win__title">Notebook</span><button class="win__btn win__btn--fold" data-glyph="–" aria-label="Fold"></button><button class="win__btn" data-glyph="×" aria-label="Close"></button></div><div class="win__body">…</div>`.

### 3. Handheld-console frame (desktop option)
`.device--handheld` is an alternative skin for the existing desktop `PhoneFrame` (`.device`): an original translucent candy-plastic handheld from the 2000s.
- **Shell:** a tall rounded slab with a 56px radius, the same 390×844 screen, and a 120px chin below it.
- **See-through plastic:** the shell is tinted and shows faint "internals" (a CSS dot grid).
- **Top:** an arc of 6 speaker dots and a lime power LED.
- **Chin:** a navy plus-shaped pad on the left, two round glossy buttons on the right (aqua and sun), and a small pill "home" button in the center. Only the pill is real (it routes to student home); the rest are decorative and `aria-hidden`.
- **Colorways follow the Play theme:** "Aqua Ice" by day, "Smoke" (graphite-indigo with a cyan LED glow) by night.
- **Switch:** a "Frame: Phone / Handheld" sticker toggle under the device, saved as `pip.frame` (try/catch). Phone stays the default for the demo video.
- **Scaling:** the existing `--device-scale` math now uses the taller 414×992 box.

```css
.device--handheld { width: 414px; height: 992px; border-radius: 56px; padding: 12px 12px 136px;
  background: radial-gradient(circle, rgba(255,255,255,.22) 1px, transparent 1.5px) 0 0 / 10px 10px,
              linear-gradient(160deg, rgba(95,227,232,.62) 0%, rgba(42,99,245,.42) 100%);
  border: 3px solid rgba(16,33,63,.85);
  box-shadow: inset 0 3px 0 rgba(255,255,255,.7), inset 0 -10px 24px rgba(16,33,63,.25), 0 30px 60px -24px rgba(16,33,63,.55);
  -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); }
[data-theme="night"] .device--handheld { background: radial-gradient(circle, rgba(255,255,255,.12) 1px, transparent 1.5px) 0 0 / 10px 10px,
  linear-gradient(160deg, rgba(60,66,110,.75), rgba(14,21,48,.85)); box-shadow: inset 0 3px 0 rgba(255,255,255,.25),
  0 0 40px -10px rgba(51,225,255,.45), 0 30px 60px -24px rgba(0,0,0,.7); }
.device--handheld .device__screen { border-radius: 30px; border: 3px solid #10213F; }
.handheld__pad { position: absolute; left: 44px; bottom: 34px; width: 72px; height: 72px; background: #10213F;
  clip-path: polygon(33% 0, 67% 0, 67% 33%, 100% 33%, 100% 67%, 67% 67%, 67% 100%, 33% 100%, 33% 67%, 0 67%, 0 33%, 33% 33%); }
.handheld__ab { position: absolute; right: 40px; bottom: 44px; display: flex; gap: 14px; transform: rotate(-18deg); }
.handheld__ab i { width: 38px; height: 38px; border-radius: 50%; border: 3px solid #10213F; box-shadow: 0 4px 0 #10213F;
  background: radial-gradient(ellipse 55% 35% at 50% 25%, rgba(255,255,255,.85), transparent), var(--c, #5FE3E8); }
.handheld__ab i + i { --c: #FFD23F; }
.handheld__led { position: absolute; top: 22px; right: 48px; width: 8px; height: 8px; border-radius: 50%; background: #A3F04A; box-shadow: 0 0 8px #A3F04A; }
```

### 4. Tap sparkles
A pointerdown anywhere on the Play root spawns a 5-star burst. Each star is a 6–10px 4-point star (the `.glint` clip-path) in white, `--sun-fill` or `--ice`, flies 18–28px outward at a random angle, and scales 1 → 0 over 280ms ease-out.
- **Limits:** at most 1 burst per 80ms and at most 20 live nodes; each node is removed on `animationend`.
- **Not on:** text selection inside the notebook or while dragging.
- **Off:** under reduced motion or `motion: low`.

```css
.tapstar { position: fixed; z-index: 90; width: var(--s, 8px); height: var(--s, 8px); pointer-events: none;
  background: var(--c, #FFFFFF); clip-path: polygon(50% 0, 61% 39%, 100% 50%, 61% 61%, 50% 100%, 39% 61%, 0 50%, 39% 39%);
  filter: drop-shadow(0 0 2px rgba(16,33,63,.35)); animation: tapstar 280ms var(--ease-out) forwards; }
@keyframes tapstar { to { transform: translate(var(--dx), var(--dy)) rotate(90deg) scale(0); opacity: .2; } }
@media (prefers-reduced-motion: reduce) { .tapstar { display: none; } }
```
```js
let last = 0
export function tapStars(e) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || e.timeStamp - last < 80) return
  last = e.timeStamp
  if (document.querySelectorAll('.tapstar').length > 15) return
  const colors = ['#FFFFFF', 'var(--sun-fill)', 'var(--ice)']
  for (let i = 0; i < 5; i++) {
    const a = Math.random() * Math.PI * 2, d = 18 + Math.random() * 10, s = document.createElement('i')
    s.className = 'tapstar'
    s.style.cssText = `left:${e.clientX - 4}px;top:${e.clientY - 4}px;--s:${6 + Math.random() * 4}px;--c:${colors[i % 3]};--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px`
    s.addEventListener('animationend', () => s.remove())
    document.body.appendChild(s)
  }
}
```

### 5. Chunky loading bar with a bouncing Pip
Use it for AI waits longer than 1s that happen outside the chat bubble: quiz grading (`QuizWait`), building Pip's Brain, mission start, saving.
- **Bar:** 10 glossy blocks in a 3px-outlined, 30px-tall tray, `min(280px, 80%)` wide. The blocks fill one at a time every 220ms, and the bar loops with a quick double-blink when full. It is indeterminate on purpose: it never claims real progress.
- **Pip:** a small 2D Pip (40px, the stage-fallback art or emoji) hops block to block above the bar (translateY −14px and back per block, with a squash on landing).
- **Label:** under the bar, Fredoka 600 17px `--fg`: "Pip is thinking…". After 8s: "Still thinking. Long thought." and a "Try again" secondary gel.
- **Reduced motion:** a static half-filled bar with a 1.2s opacity pulse; Pip doesn't hop.

```css
.loadbar { position: relative; display: grid; grid-template-columns: repeat(10, 1fr); gap: 3px; width: min(280px, 80%);
  height: 30px; padding: 4px; border: var(--outline-w) solid var(--outline); border-radius: 12px; background: var(--surface-3);
  box-shadow: inset 0 3px 6px rgba(16,33,63,.2), 0 4px 0 var(--outline); }
.loadbar__block { border-radius: 4px; opacity: 0;
  background: radial-gradient(ellipse 60% 35% at 50% 25%, rgba(255,255,255,.8), transparent), var(--gel-primary);
  animation: block 2.2s steps(1, end) infinite; animation-delay: calc(var(--i) * 220ms); }
@keyframes block { 0% { opacity: 0; } 10%, 92% { opacity: 1; } 95% { opacity: .4; } 100% { opacity: 0; } }
.loadbar__pip { position: absolute; bottom: 100%; left: 4px; width: 40px; height: 40px; margin-bottom: 4px;
  animation: hop-x 2.2s steps(10, end) infinite, hop-y 220ms var(--ease-out) infinite alternate; }
@keyframes hop-x { to { transform: translateX(calc(min(280px, 80vw) - 48px)); } }
@keyframes hop-y { to { translate: 0 -14px; } }
```

### 6. Wallpapers and drifting clouds
`--wallpaper` is a CSS-only tile layered under the scene gradient, at ≤ .06 opacity. It shows only in open scene areas; panels, gels and bubbles are opaque, so text contrast is unchanged. Choices: `stars | checkers | bubbles | none` (part of the S10 theme `scene` field).
- **Day:** soft sky checkers `conic-gradient(rgba(16,33,63,.05) 25%, transparent 0 50%, rgba(16,33,63,.05) 0 75%, transparent 0) 0 0 / 48px 48px`, plus bubbles (§ scene CSS).
- **Night:** stars (§ scene CSS) plus tiny plus-sparkles: `radial-gradient(2px 6px at 30px 30px, rgba(255,255,255,.5), transparent), radial-gradient(6px 2px at 30px 30px, rgba(255,255,255,.5), transparent) 0 0 / 120px 120px`.
- **Clouds (day):** two layers. The near layer has 3 bigger clouds drifting at 90s per cycle, the far layer 4 small clouds at 140s, with `transform: translateX` loops (GPU). Night swaps them for 2 slow, faint nebula blobs (`rgba(51,225,255,.06)`).
- **Off:** paused when the tab is hidden and static under reduced motion.

### 7. Micro-sounds (off by default; the mute icon in the HUD and home)
- **Format:** each sound is ≤ 300ms except where noted, at volume .4, with no overlap of the same sound inside 80ms.
- **Source:** synthesize tonight with WebAudio (no assets needed), or use original short files ≤ 150 KB total. No sounds sampled from real games or devices.

| Sound | When |
|---|---|
| pop | gel button press (on pointerdown) |
| boop | icon button press, theme toggle |
| bubble-blip | Pip's bubble appears |
| swoosh | screen or K.O.-beat transition, window open |
| plink | weapon unlock and star-glints |
| thwack | boss hit (at the hit-stop) |
| boing | boss heal / gloat |
| sticker-stick | new Vault sticker lands |
| sticker-peel | Vault sticker tapped |
| block-tick | each loading-bar block (quiet, .2 volume) |
| save-chime (600ms) | save point: a Brain rule saved or the Brain version going up |
| low-gong (800ms) | K.O. stamp |

### 8. Glitter and chrome text (K.O. stamp and level-ups)
`.glitter-text` is for the K.O. stamp (beat 2), "Brain v2", and the "Weapon unlocked" sticker title. It never appears on the K.O. card.
- **Fill:** a light chrome gradient with a fine glitter dot layer, clipped to the text.
- **Edge:** a 6px navy stroke (`paint-order: stroke fill`) plus a 4px navy drop.
- **Sheen:** one light sweep over 1.2s, then still, with up to 3 glints.
- **AA:** every fill stop is ≥ 11:1 against the navy stroke (`#FFFFFF` 16.0, `#FFF3B0` 14.3, `#FFD23F` 11.1, `#BDF6FF` 13.6). The stroke is 13.7:1 against the day sky. By night the fill itself is ≥ 12.4:1 against the sky. The text is large (≥ 40px), so 3:1 would be enough.

```css
.glitter-text { font: 700 96px/1 var(--font-game); font-variation-settings: "wdth" 125; letter-spacing: .02em;
  background:
    radial-gradient(circle, rgba(255,255,255,.95) 0 .6px, transparent 1px) 0 0 / 7px 7px,           /* glitter */
    linear-gradient(105deg, transparent 40%, rgba(255,255,255,.9) 50%, transparent 60%) -150% 0 / 200% 100% no-repeat,  /* sheen */
    linear-gradient(180deg, #FFFFFF 0%, #FFF3B0 35%, #FFD23F 52%, #BDF6FF 72%, #FFFFFF 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
  -webkit-text-stroke: 6px var(--outline); paint-order: stroke fill;
  filter: drop-shadow(0 4px 0 var(--outline));
  animation: sheen 1.2s var(--ease-out) 240ms 1 both; }
@keyframes sheen { to { background-position: 0 0, 150% 0, 0 0; } }
@media (prefers-reduced-motion: reduce) { .glitter-text { animation: none; } }
@media (forced-colors: active) { .glitter-text { color: CanvasText; background: none; -webkit-text-stroke: 0; } }
```

### 9. Save points for Pip's Brain
Pip's Brain saves like a game. A glossy 5-point star icon (`.savepoint`) marks every moment the Brain changes:
- **Rule saved** (Pip's "Saving that: '…'"): a 28px star blips beside Pip's bubble (scale 0 → 1.2 → 1, 300ms) with a "Saved" sticker for 1.2s and the save-chime.
- **Rule fixed** after re-teach: the star appears on the fixed note's sticker.
- **Brain version up** (K.O. beat 2): a 72px star spins once (360deg, 600ms ease-out) and floats up 12px. Under it, a `.glitter-text` "Brain v2" at 40px and a chrome sticker "Save point reached". In the HUD, the Brain badge gains a small star for the rest of the session.
- **Star style:** sun gel fill, a navy outline made with stacked drop-shadows (clip-path removes borders), and a white gloss. Navy on sun is 11.1:1 for any glyph inside.

```css
.savepoint { width: var(--size, 28px); height: var(--size, 28px);
  background: radial-gradient(ellipse 50% 30% at 45% 30%, rgba(255,255,255,.9), transparent), var(--gel-win);
  clip-path: polygon(50% 2%, 62% 36%, 98% 38%, 69% 59%, 79% 95%, 50% 74%, 21% 95%, 31% 59%, 2% 38%, 38% 36%);
  filter: drop-shadow(2px 0 0 var(--outline)) drop-shadow(-2px 0 0 var(--outline)) drop-shadow(0 2px 0 var(--outline))
          drop-shadow(0 -2px 0 var(--outline)) drop-shadow(0 3px 0 var(--outline));
  animation: save-in 300ms var(--ease-pop) both; }
.savepoint--big { --size: 72px; animation: save-spin 600ms var(--ease-out) both; }
@keyframes save-in { from { transform: scale(0); } 70% { transform: scale(1.2); } }
@keyframes save-spin { from { transform: rotate(-360deg) scale(.4); } to { transform: translateY(-12px); } }
```

**Nostalgia guardrails** (add to the Don'ts):
- No real-product shapes. No four-color window flags, no red/yellow/green traffic lights, no copied handheld silhouettes, logos, fonts, startup sounds or meme characters.
- No loot boxes, random paid rewards or purchasable stickers. The holo variant is earned only by fixing a wrong rule, never by luck or money.
- No sparkle trails while idle, and no confetti.
- No glitter on the K.O. card, which stays quiet.
- No wallpaper behind text above .06 opacity.

## Runway & Club (G4, Play only; supersedes the childlike parts above)

The user's note: Play reads "a bit too childish". The new energy is a runway fashion show plus a club or concert night: vibey, weirder, more creative. It stays all-ages for 10–15-year-olds and for tutoring-center buyers. The settings are fashion week, a concert, a dance battle and rave lights. Never a bar, drinks, or anything alcohol- or drug-coded: no bottles, cups, bartenders, smoke, pills or "VIP lounge" cues. Studio is unchanged. The one-viewport rule, the performance budget, reduced motion and every role rule still hold.

**What this supersedes.** Where this section conflicts with G2 or G3, this section wins.

| Before | Now |
|---|---|
| Daylight Arcade (baby-blue sky, clouds, bubbles) | **Runway** (`data-theme="day"`): gallery white to silver, chrome and holo |
| Night Arcade (navy, stars) | **Club** (`data-theme="night"`): black-violet, neon lasers, haze |
| Fredoka everywhere | **Unbounded** (wide, geometric, flyer energy) for display, buttons and captions; **Bodoni Moda** for editorial moments; Manrope for speech and body; Geist Mono for tags and numbers |
| 3px navy outlines, comic bubble look | 2px ink outlines in Runway, 1.5px violet edges plus neon glow in Club; sharper radii (panels 16px, stickers 6px) |
| Sticker-album Vault | **Lookbook** of magazine covers (§5) |
| Wallpapers (checkers, bubbles, stars) and drifting clouds | Lasers and haze (Club), gallery grid and light leaks (Runway), surreal props (§6) |
| K.O. beat 2 (stamp + glitter) | **Runway walk** (§4) |
| Glitter text | **Chrome text** (same structure, glitter layer removed) |
| Candy handheld frame | kept as an option, colorways "Ice Chrome" (Runway) and "Smoke Neon" (Club) |

**What stays from G2 and G3:**
- Gel buttons, restyled: black chrome pills in Runway, neon pills in Club.
- Round icon buttons, the HUD, the segmented HP bar, the level map, the one-viewport layout budget.
- Window-style sheets, re-skinned as chrome title bars.
- The chunky loader, restyled as an equalizer.
- Tap sparkles, now chrome or neon.
- Save points, now a chrome star.
- The sound list, re-voiced (§7).
- The K.O. card, which stays the quiet exception.

**No-pink rule, refined:** magenta `#FF2BD6` appears only as scene light (lasers, haze, rim light, flashes). It is never a role color, button, text or status, and it always comes paired with cyan and lime so the palette reads club, not candy.

### 1–2. Theme tokens: Runway (day, default) and Club (night)

AA results, worst case across each theme's backgrounds:

| Text role | Runway (on `#FFFFFF`, `#EEF0F4`, silver `#D9DDE5`, panel `#F6F7F9`, well `#E6E9EF`) | Club (on `#07040F`, `#140A26`, panel `#1C1233`, `#251A42`, well `#2E2250`) |
|---|---|---|
| fg | `#0B0B12` 14.4 | `#FFFFFF` 14.4 |
| fg-muted | `#34364A` 8.7 | `#DCD5F2` 10.2 |
| fg-subtle (15px+) | `#55586E` 5.1 | `#ADA3D1` 6.1 |
| link / action as text | `#3A2BD8` 6.1 | `#2EF2FF` 10.5 |
| progress text | `#2F6B00` 4.8 | `#B6FF3B` 11.9 |
| win text | `#8A5200` 4.7 | `#FFE14D` 11.0 |
| boss text | `#B0281A` 4.9 | `#FF9D92` 7.2 |
| button label on action gel | white on black chrome 15.5–19.6 | `#07040F` on cyan 9.1–16.7 |
| label on progress / win / boss fill | `#0B0B12` on `#B6FF3B` 16.2, `#FFB020` 10.7, `#FF6F61` 7.2 | `#07040F` on lime 16.8, `#FFE14D` 15.6, `#FF6F61` 7.5 |
| outline vs base (UI boundary) | `#0B0B12` 14.4 | `#6C5BB0` 3.6 |

```css
/* ---------- Runway (day, default): gallery white -> silver, chrome + holo ---------- */
[data-register="play"], [data-register="play"][data-theme="day"] {
  color-scheme: light;
  --font-game: 'Unbounded', 'Manrope', system-ui, sans-serif;
  --font-editorial: 'Bodoni Moda', 'Fraunces', Georgia, serif;
  --sky: radial-gradient(90% 50% at 50% 0%, #FFFFFF 0%, rgba(255,255,255,0) 70%),
         linear-gradient(180deg, #FFFFFF 0%, #EEF0F4 55%, #D9DDE5 100%);
  --ink: #EEF0F4; --surface: #FFFFFF; --surface-2: #F6F7F9; --surface-3: #E6E9EF; --overlay: #FFFFFF;
  --fg: #0B0B12; --fg-muted: #34364A; --fg-subtle: #55586E;
  --ice: #0B0B12; --ice-ink: #FFFFFF; --link: #3A2BD8; --focus: #3A2BD8;
  --ice-soft: rgba(11,11,18,.06); --ice-line: rgba(11,11,18,.3);
  --mint: #2F6B00; --mint-fill: #B6FF3B; --sun: #8A5200; --sun-fill: #FFB020;
  --coral: #B0281A; --coral-fill: #FF6F61;
  --outline: #0B0B12; --outline-w: 2px; --panel-outline: #0B0B12;
  --panel-fill: linear-gradient(180deg, #FFFFFF 0%, #F6F7F9 100%); --panel-hi: #FFFFFF; --panel-edge: rgba(11,11,18,.9);
  --gel-primary: linear-gradient(180deg, #3A3B48 0%, #23232E 40%, #0B0B12 100%);
  --gel-primary-ink: #FFFFFF; --gel-primary-edge: #000000; --gel-text-shadow: none;
  --gel-secondary: linear-gradient(180deg, #FFFFFF 0%, #E9ECF1 48%, #C9CED8 52%, #EEF0F4 100%);   /* chrome */
  --gel-secondary-ink: #0B0B12; --gel-secondary-edge: #0B0B12;
  --gel-win: linear-gradient(180deg, #FFD66B 0%, #FFB020 60%, #E89A00 100%);
  --sticker-ink: #0B0B12; --bubble-fill: #FFFFFF; --her-bubble: #F1EEFF;      /* violet tint, ink 17.2:1 */
  --track: rgba(11,11,18,.12); --tint-1: rgba(11,11,18,.03); --tint-2: rgba(11,11,18,.08);
  --divider: rgba(11,11,18,.12); --border: rgba(11,11,18,.22);
  --field-bg: #FFFFFF; --field-border: #0B0B12; --field-placeholder: #55586E;
  --scrim: rgba(11,11,18,.6); --path-dot: #0B0B12;
  --holo: conic-gradient(from 200deg, #2EF2FF, #B6FF3B, #FFE14D, #FF9A3C, #7B6CFF, #2EF2FF);
  --r-panel: 16px; --r-sticker: 6px;
}
/* ---------- Club (night): black-violet, neon lasers, haze ---------- */
[data-register="play"][data-theme="night"] {
  color-scheme: dark;
  --sky: radial-gradient(70% 40% at 50% 0%, rgba(123,108,255,.22), transparent 70%),
         linear-gradient(180deg, #07040F 0%, #140A26 100%);
  --ink: #07040F; --surface: #1C1233; --surface-2: #251A42; --surface-3: #2E2250; --overlay: #1C1233;
  --fg: #FFFFFF; --fg-muted: #DCD5F2; --fg-subtle: #ADA3D1;
  --ice: #2EF2FF; --ice-ink: #07040F; --link: #2EF2FF; --focus: #2EF2FF;
  --ice-soft: rgba(46,242,255,.12); --ice-line: rgba(46,242,255,.45);
  --mint: #B6FF3B; --mint-fill: #B6FF3B; --sun: #FFE14D; --sun-fill: #FFE14D;
  --coral: #FF9D92; --coral-fill: #FF6F61;
  --outline: #07040F; --outline-w: 1.5px; --panel-outline: #6C5BB0;
  --panel-fill: linear-gradient(180deg, rgba(37,26,66,.86) 0%, rgba(28,18,51,.86) 100%);
  --panel-hi: rgba(255,255,255,.14); --panel-edge: rgba(0,0,0,.6);
  --gel-primary: linear-gradient(180deg, #9AF8FF 0%, #2EF2FF 45%, #12BFD0 100%);
  --gel-primary-ink: #07040F; --gel-primary-edge: #0A7E8A; --gel-text-shadow: none;
  --gel-secondary: linear-gradient(180deg, #34285C 0%, #251A42 100%);
  --gel-secondary-ink: #FFFFFF; --gel-secondary-edge: #000000;
  --gel-win: linear-gradient(180deg, #FFF09A 0%, #FFE14D 55%, #E6C200 100%);
  --sticker-ink: #07040F; --bubble-fill: #FFFFFF; --her-bubble: #D9FBFF;      /* ink 18.6:1 */
  --track: rgba(255,255,255,.12); --tint-1: rgba(255,255,255,.04); --tint-2: rgba(255,255,255,.09);
  --divider: rgba(255,255,255,.12); --border: rgba(255,255,255,.22);
  --field-bg: #1C1233; --field-border: #6C5BB0; --field-placeholder: #ADA3D1;
  --scrim: rgba(7,4,15,.78); --path-dot: #ADA3D1;
  --neon-glow: 0 0 0 1.5px rgba(46,242,255,.9), 0 0 18px rgba(46,242,255,.45);
}
[data-register="play"] .panel { border-width: var(--outline-w); border-radius: var(--r-panel, 16px); }
[data-register="play"][data-theme="night"] .panel { box-shadow: inset 0 1px 0 var(--panel-hi), 0 0 24px -8px rgba(123,108,255,.45); }
[data-register="play"] .sticker { border-radius: var(--r-sticker, 6px); font: 500 15px/1.1 'Geist Mono', monospace; text-transform: uppercase; letter-spacing: .06em; }
[data-register="play"] .ribbon { font: 700 18px/1.1 var(--font-game); text-transform: uppercase; letter-spacing: .04em;
  border-radius: 4px; transform: rotate(-1.5deg); }
[data-register="play"][data-theme="night"] .gel-btn:not(.gel-btn--secondary) { box-shadow: 0 5px 0 var(--gel-edge), 0 0 22px rgba(46,242,255,.45), inset 0 2px 0 rgba(255,255,255,.6); }
```

**Runway scene:** white gallery walls fading to a silver floor. Add a faint 1px runway-centerline grid (`linear-gradient(90deg, transparent calc(50% - .5px), rgba(11,11,18,.06) 0 calc(50% + .5px), transparent 0)`) plus two soft holo light leaks at the corners (`radial-gradient(40% 30% at 0% 10%, rgba(46,242,255,.14), transparent)`, `radial-gradient(40% 30% at 100% 80%, rgba(182,255,59,.12), transparent)`).
- **Editorial moments:** big Bodoni Moda headlines at the top of the home, K.O. and Vault screens, e.g. a 56px *"The fractions issue."*, set black on white.
- **Chrome and holo:** chrome appears on secondary gels and badges; holo only on the Brain badge, the earned-item tag and the cover mastheads of comeback issues.

**Club scene:** a black-violet room with 5 laser beams fanning down from an off-screen rig. Beams are 1–2deg wide and alternate cyan, magenta and lime at .22–.35 alpha; they sweep ±8deg over 12s (alternate, ease-in-out) and blend with `screen`. Haze is two pre-blurred radial gradients drifting 20s (no `filter: blur`, for performance). The HUD carries a subtle beat pulse at 120 BPM.

```css
[data-register="play"][data-theme="night"] .backdrop::before {          /* lasers */
  inset: -10% -20% 0; transform-origin: 50% 0; mix-blend-mode: screen; background:
    conic-gradient(from 150deg at 50% -6%, transparent 0 8deg, rgba(46,242,255,.32) 8deg 9.5deg, transparent 9.5deg 19deg,
      rgba(255,43,214,.26) 19deg 20.5deg, transparent 20.5deg 30deg, rgba(182,255,59,.24) 30deg 31deg, transparent 31deg 41deg,
      rgba(255,43,214,.26) 41deg 42.5deg, transparent 42.5deg 52deg, rgba(46,242,255,.32) 52deg 53.5deg, transparent 53.5deg 360deg);
  animation: laser-sweep 12s ease-in-out infinite alternate;
}
[data-register="play"][data-theme="night"] .backdrop::after {           /* haze */
  opacity: 1; mix-blend-mode: screen; background:
    radial-gradient(60% 30% at 30% 70%, rgba(123,108,255,.16), transparent 70%),
    radial-gradient(50% 26% at 75% 55%, rgba(255,43,214,.10), transparent 70%),
    radial-gradient(80% 30% at 50% 100%, rgba(46,242,255,.10), transparent 70%);
  animation: haze 20s ease-in-out infinite alternate;
}
@keyframes laser-sweep { from { transform: rotate(-8deg); } to { transform: rotate(8deg); } }
@keyframes haze { to { transform: translate(-6%, -3%) scale(1.08); } }
[data-register="play"][data-theme="night"] .hud .hp { animation: beat 500ms ease-out infinite; }     /* 120 BPM */
@keyframes beat { 0% { box-shadow: 0 0 0 0 rgba(46,242,255,.0); } 12% { box-shadow: 0 0 14px 1px rgba(46,242,255,.45); } 100% { box-shadow: 0 0 0 0 rgba(46,242,255,0); } }
@media (prefers-reduced-motion: reduce) {
  [data-register="play"] .backdrop::before, [data-register="play"] .backdrop::after, [data-register="play"] .hud .hp { animation: none; }
}
```

### 3. Boss fight = spotlight battle stage
- **Stage (3D `env="arena"`, `theme` aware):** Pip stands on a round podium with an LED rim (Runway: chrome podium with a white rim; Club: black podium with a cyan LED rim). The boss is on a DJ-booth-style plinth (a deck with two glowing discs, no screens, no logos) behind and to the right.
- **Spotlights:** two cones from the top corners, drawn as DOM overlays above the canvas and below the bubbles: `linear-gradient(180deg, rgba(255,255,255,.28), transparent)` clipped to a triangle, `mix-blend-mode: screen` in Club and `multiply`-free white in Runway. Idle, they rest on Pip; on a hit they snap to the boss in 120ms.
- **Crowd:** a 72px silhouette strip pinned to the stage bottom, two layers of head-and-shoulder shapes (CSS radial gradients) in `#000` at .85 (Club) or `#0B0B12` at .12 (Runway). It bobs ±2px on the beat. On a hit it jumps (−6px over 180ms) with a few raised arms (3 small rounded bars that scale in); on a whiff it stays still, and the caption reads "The crowd is unconvinced."
- **Bass drop on a hit,** added to the G2 hit sequence, which still totals 900ms or less:
  1. At the 70ms hit-stop, the stage scales 1 → 1.015 → 1 over 160ms (`.stage.is-drop`).
  2. A flash overlay pulses in 120ms: white at most .28 opacity in Runway, cyan-white at most .25 in Club, never red.
  3. The lasers lock onto the boss for 400ms (Club).
  4. Then the usual squash, shake, segment drop and damage tag.
- **Flash safety (WCAG 2.3.1):** at most 2 flashes per second anywhere in the product, flash opacity ≤ .3, no saturated red flashes, and flashes are disabled entirely under reduced motion, which gets a 150ms color change on the HP bar instead.

```css
.stage-fx { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.spot { position: absolute; top: -10%; width: 60%; height: 120%; mix-blend-mode: screen; transition: transform 120ms var(--ease-out);
  background: linear-gradient(180deg, rgba(255,255,255,.28), rgba(255,255,255,0) 85%);
  clip-path: polygon(45% 0, 55% 0, 100% 100%, 0 100%); }
.spot--l { left: -10%; transform: rotate(-18deg); transform-origin: 50% 0; }
.spot--r { right: -10%; transform: rotate(18deg); transform-origin: 50% 0; }
.stage.is-hit .spot--l { transform: rotate(-4deg); } .stage.is-hit .spot--r { transform: rotate(6deg); }
.crowd { position: absolute; left: 0; right: 0; bottom: 0; height: 72px; opacity: var(--crowd-a, .85);
  background: radial-gradient(14px 16px at 20px 26px, #000 98%, transparent) 0 0 / 40px 72px repeat-x,
              radial-gradient(24px 30px at 20px 72px, #000 98%, transparent) 0 0 / 40px 72px repeat-x;
  animation: bob 500ms ease-in-out infinite alternate; }
.crowd--back { bottom: 14px; transform: scale(.85); opacity: .55; background-position: 20px 0, 20px 0; animation-delay: 250ms; }
[data-theme="day"] .crowd { --crowd-a: .12; }
.stage.is-hit .crowd { animation: jump 180ms var(--ease-out) 1; }
.flash { position: absolute; inset: 0; pointer-events: none; opacity: 0; background: radial-gradient(circle at 60% 45%, #FFFFFF, transparent 65%); }
.stage.is-drop .flash { animation: flash 120ms linear 1; }
.stage.is-drop { animation: drop 160ms var(--ease-out) 1; }
@keyframes bob { to { transform: translateY(-2px); } }
@keyframes jump { 50% { transform: translateY(-6px); } }
@keyframes flash { 30% { opacity: .28; } 100% { opacity: 0; } }
@keyframes drop { 40% { transform: scale(1.015); } }
@media (prefers-reduced-motion: reduce) { .crowd, .stage.is-drop, .stage.is-drop .flash, .stage.is-hit .crowd { animation: none; } }
```

### 4. K.O. evolution = runway walk
This replaces G2's K.O. beat 2. Beats are still full screens; the whole walk is tap-to-skip and lasts about 3.2s.
1. **The drop (finisher, about 1.2s):** "PICK THE FINAL DROP" ribbon, weapons as gels. On pick, a 120ms hit-stop, the one ±4px screen shake, the boss flops off its plinth, the lasers converge, and the low gong plays.
2. **The walk (about 2s):** the scene cuts to a catwalk in perspective: a floor plane with `perspective: 700px; transform: rotateX(62deg)`, a center stripe, and two rows of edge lights (dots) running to a vanishing point near the top third.
   - **Strut:** Pip (3D `framing="hero"` walk cycle, or 2D Pip scaling .45 → 1 with a ±3deg hip-sway every 400ms) struts from the back to the front at 20% slower than any boss move. That's the deadpan.
   - **Flashes:** camera bursts pop along both sides as 4-point white stars, 80ms each, at most 2 per second, each ≤ 10% of the screen area, with the camera-shutter sound.
   - **The pose:** Pip freezes at the front in its evolution pose.
3. **The new look (about 1.2s, waits for a tap):** Pip stays posed under one spotlight. The top line is a Bodoni Moda 800 italic 44px *"The new look."* Beneath it sits a look card (a white sticker in Runway, a neon-edged panel in Club) in Geist Mono uppercase:
   - `LOOK 02 — PIP V2`
   - the earned item: `WEARING: THE HALF PIN` (from `payoff.new_items`)
   - `FIXED IT, 1 RE-TEACH`, only if it was a comeback

   A chrome text "Brain v2" save point appears with the save-chime. Pip wears the earned item from here on (CONTRACT v3.7).
4. **The card** (the quiet K.O. card, unchanged), then 5. **the cliffhanger** ("Next season:" with the silhouette and half-name), then 6. **what Ms. Rivera sees**.

```css
.catwalk { position: absolute; inset: 35% -30% -10%; transform: perspective(700px) rotateX(62deg); transform-origin: 50% 0;
  background: linear-gradient(90deg, transparent 44%, rgba(255,255,255,.5) 44% 45%, transparent 45% 55%, rgba(255,255,255,.5) 55% 56%, transparent 56%),
              var(--catwalk, linear-gradient(180deg, #D9DDE5, #FFFFFF)); }
[data-theme="night"] .catwalk { --catwalk: linear-gradient(180deg, #140A26, #2E2250); }
.catwalk::before, .catwalk::after { content: ''; position: absolute; top: 0; bottom: 0; width: 6px;
  background: radial-gradient(circle, var(--ice) 2px, transparent 3px) 0 0 / 6px 28px repeat-y; }
.catwalk::before { left: 43%; } .catwalk::after { right: 43%; }
.strut { animation: strut-in 2s cubic-bezier(.3,.1,.3,1) both, sway 400ms ease-in-out 5 alternate; }
@keyframes strut-in { from { transform: translateY(-38%) scale(.45); } to { transform: none; } }
@keyframes sway { from { rotate: -3deg; } to { rotate: 3deg; } }
.camflash { position: absolute; width: 56px; height: 56px; background: #FFFFFF; opacity: 0;
  clip-path: polygon(50% 0, 58% 42%, 100% 50%, 58% 58%, 50% 100%, 42% 58%, 0 50%, 42% 42%);
  animation: camflash 80ms linear 1 both; animation-delay: var(--t); }
@keyframes camflash { 40% { opacity: .9; transform: scale(1.1); } 100% { opacity: 0; } }
.newlook { font: italic 800 44px/1 var(--font-editorial); font-variation-settings: "opsz" 96; color: var(--fg); letter-spacing: -.02em; }
@media (prefers-reduced-motion: reduce) { .strut, .camflash { animation: none; } .camflash { display: none; } }
```

### 5. Vault = lookbook of magazine covers
The Vault sheet becomes "The Lookbook": a 2×2 grid of 3:4 covers per page (each about 175×233 at 390px), which fits without scrolling. More covers go on further pages (scroll-snap, page dots, "Next ▶"). Each beaten boss is one issue.

**Cover anatomy:**
- **Masthead:** "PIP" in Bodoni Moda 900 at 64px (scaled to cover width), letter-spacing −.03em, top-center. Pip's pose image (the `thumb.jsx` render or Pip2D) overlaps the bottom of the masthead, the classic head-over-logo move (masthead `z-index: 1`, Pip `z-index: 2`).
- **Issue line:** Geist Mono 12px `NO. 0147 · OCT 2026` under the masthead (the one 12px exception, as metadata).
- **Cover quote:** the boss's K.O. line in Bodoni Moda italic 500 16px (*"Addini Bottomini has left Pip's brain."*).
- **Cover lines:** two short Unbounded 600 12px uppercase lines, e.g. "THE ½ + ⅓ ISSUE" and "WEARING: THE HALF PIN".
- **Comeback issues:** the holo masthead (`background: var(--holo); -webkit-background-clip: text`) plus the line "EXCLUSIVE: HOW IT GOT FIXED".
- **Background:** a dark editorial gradient from `#0B0B12` to the boss's tint at 30% (e.g. `#3A1830`), with a white masthead (19.6:1) and `#F2EDE4` text (15.4:1). Covers look the same in both themes, the way magazines do.
- **Next issue:** a dimmed cover with Pip's silhouette, the next boss's half-name and "COMING NEXT SEASON". Curiosity, never a purchase.
- **Open:** tapping a cover zooms it to full screen (260ms, from the tile's rect), and a second tap flips it to the K.O. card. Each cover is a `<button aria-label="Issue 0147, Addini Bottomini, October 2026">`.

```css
.lookbook { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 12px; }
.cover { position: relative; aspect-ratio: 3 / 4; overflow: hidden; border-radius: 6px; padding: 10px; color: #F2EDE4;
  background: radial-gradient(80% 50% at 50% 70%, color-mix(in oklch, var(--boss-tint, #7B6CFF) 30%, transparent), transparent), #0B0B12;
  box-shadow: 0 0 0 1.5px #0B0B12, 0 14px 24px -14px rgba(0,0,0,.6); transition: transform 160ms var(--ease-out); }
.cover__mast { position: relative; z-index: 1; display: block; text-align: center; color: #FFFFFF;
  font: 900 clamp(40px, 15cqw, 64px)/.9 var(--font-editorial); letter-spacing: -.03em; }
.cover--comeback .cover__mast { background: var(--holo); -webkit-background-clip: text; background-clip: text; color: transparent; }
.cover__pip { position: absolute; z-index: 2; left: 10%; right: 10%; top: 16%; bottom: 18%; object-fit: contain; }
.cover__issue { position: relative; z-index: 3; font: 500 12px/1 'Geist Mono', monospace; letter-spacing: .08em; text-align: center; }
.cover__quote { position: absolute; z-index: 3; left: 10px; right: 10px; bottom: 30px; font: italic 500 16px/1.15 var(--font-editorial); }
.cover__line { position: absolute; z-index: 3; left: 10px; bottom: 10px; font: 600 12px/1 var(--font-game); text-transform: uppercase; letter-spacing: .06em; color: #FFE14D; }
.cover--next { filter: grayscale(1) brightness(.55); }
@media (hover: hover) and (pointer: fine) { .cover:hover { transform: translateY(-4px) rotate(-1deg); } }
```

The cover lines at 12px pass AA (`#FFE14D` on `#0B0B12` is 15.6:1, white 19.6:1). They are metadata; the cover quote at 16px carries the meaning.

### 6. Surreal props
Background props make the scene feel art-directed and slightly weird. They are decorative (`aria-hidden`), sit behind everything (`z-index: 0`, above `.backdrop`), and are capped at 4 per screen, drifting with transforms only.
- **Chrome blob:** an organic sphere, `border-radius: 42% 58% 63% 37% / 41% 44% 56% 59%`, filled `radial-gradient(circle at 32% 28%, #FFFFFF 0 8%, #D9DDE5 22%, #8A90A0 48%, #3A3B48 70%, #C9CED8 100%)`. It morphs its radius over 18s and floats ±10px.
- **Glossy shapes:** a ring (`radial-gradient(circle, transparent 52%, var(--c) 53% 70%, transparent 71%)` plus a white gloss), a pill, and a 4-point star, in lime, cyan or chrome.
- **Holo fog:** a 240px blob of `var(--holo)` at .16 opacity with `border-radius: 50%` and a pre-blurred edge (`mask: radial-gradient(closest-side, #000, transparent)`), drifting 24s.
- **Placement:** home (2 props), mission (1, behind the boss side), K.O. walk (3, in the background), Vault (0). Never behind text or a bubble.
- **3D option:** the 3D env can render the same props (chrome `MeshPhysicalMaterial` metalness 1, roughness .1) when the device is not throttled.

```css
.prop { position: absolute; z-index: 0; pointer-events: none; will-change: transform; animation: prop-float 9s ease-in-out infinite alternate; }
.prop--blob { width: 120px; aspect-ratio: 1; border-radius: 42% 58% 63% 37% / 41% 44% 56% 59%;
  background: radial-gradient(circle at 32% 28%, #FFFFFF 0 8%, #D9DDE5 22%, #8A90A0 48%, #3A3B48 70%, #C9CED8 100%);
  animation: prop-float 9s ease-in-out infinite alternate, blob 18s ease-in-out infinite alternate; }
.prop--ring { width: 80px; aspect-ratio: 1; border-radius: 50%;
  background: radial-gradient(ellipse 40% 20% at 40% 25%, rgba(255,255,255,.8), transparent), radial-gradient(circle, transparent 52%, var(--c, #B6FF3B) 53% 70%, transparent 71%); }
.prop--fog { width: 240px; aspect-ratio: 1; border-radius: 50%; background: var(--holo); opacity: .16;
  -webkit-mask: radial-gradient(closest-side, #000, transparent); mask: radial-gradient(closest-side, #000, transparent); }
@keyframes prop-float { to { transform: translateY(-10px) rotate(6deg); } }
@keyframes blob { to { border-radius: 58% 42% 37% 63% / 56% 59% 41% 44%; } }
@media (prefers-reduced-motion: reduce) { .prop { animation: none; } }
```

### 7. Copy tone: confident editorial and MC
- **Two voices.** The *narrator* (ribbons, captions, MC lines, cover lines) is a confident host: short, declarative, a little dramatic. *Pip* stays deadpan and literal. The contrast is the joke, the same straight-man rule as before.
- **Narrator examples:**
  - "Tonight's challenger: Addini Bottomini."
  - "Step ② is open. The floor is yours."
  - "Sliced into sixths. −40."
  - "The crowd felt that."
  - "The crowd is unconvinced."
  - "Final drop. Pick it."
  - "The new look."
  - "Look 02."
  - "Next season: Divid████."
  - "Front row is waiting." (home, with a mission)
- **Pip examples:**
  - "I walked. People took photos. I don't know why."
  - "This is my new look. I'm told it is a look."
- **Rules:** no exclamation marks; no borrowed or trending slang (no "slay", "ate", "serve", "it's giving", "no cap", "mother", "periodt", "rizz"); no club-drink, VIP, or after-party language; no "Great job". Captions are uppercase Unbounded at most 6 words; editorial headlines are sentence-case Bodoni italic.

### 8. Mascot defaults: less kid-cute
- **Default vibe** in the picker and on a new student: `cool`. Its default colorway is "Graphite / Acid": body graphite `#5A6378` fuzz, a lime `#B6FF3B` crown tuft, a chrome visor. Half-lidded, unimpressed eyes.
- **cute** keeps its blush and flowers but loses baby styling: muted pastel-free colorways (aqua, sand, sky), small cheek blush (`#FF9A8A` at .35), and at most one flower clip.
- **cool** leans editorial streetwear: matte or chrome, a visor or hood option, neon piping in Club.
- **ugly** leans avant-garde: asymmetric runway-weird (one oversized ear or horn, a stitched patch in a contrasting fabric, crooked toothy grin, eye bags). Friendly, never gross.
- **Evolution forms** read as new looks: v2 adds a structured collar or shoulder piece in the vibe's material; v3 adds a chrome or holo accessory slot. Earned items (CONTRACT v3.7) are worn as styling: a pin on the collar, a holo badge on the chest.
- **All vibes:** deadpan voice; accessory list unchanged (`none | glasses | scarf | pencil | badge | backpack`, plus earned items); no lashes, no infant 2:1 head, no big shiny irises.

### What else changes
- **Window sheets:** the title bar becomes chrome (Runway: `--gel-secondary` with black title; Club: `#251A42` with a cyan 1px underline glow and white title). The fold and close bubbles become chrome and lime dots.
- **Loader:** the chunky bar becomes a 10-bar equalizer. Bars of random height animate (transform `scaleY`, 300ms steps) in `--ice`, with Pip bobbing on top instead of hopping. The "Pip is thinking…" label and the 8s retry stay.
- **Tap sparkles:** chrome and neon colors (`#FFFFFF`, `--ice`, `#B6FF3B`; magenta allowed in Club because it is light, not UI).
- **Sounds (§ G3 list):** pop → *click*, boop → *tick*, thwack → *bass hit*, low-gong → *bass drop*. Add *camera-shutter* (runway flashes), *crowd-cheer* (≤ 600ms, K.O. pose), and *record-scratch* (whiff). Still off by default and synthesized or original.
- **Presets (S10):** Runway and Club replace Daylight Arcade and Night Arcade as the two defaults; the other presets remain options.

### Do first (frontend, G4 including the brand layer)
1. **Tokens and fonts in one commit.**
   - Paste the Runway and Club Play blocks.
   - Swap Studio `:root` to Ink at Work, with cyan as the primary and lime as success.
   - Update the font link (add Unbounded and Bodoni Moda, drop Fredoka); `--font-game` becomes Unbounded.
   - Every screen restyles at once, and the forest/game mismatch disappears.
2. **Wordmark and icon.** Add the `.wordmark` component (landing, Studio top bar, Play home) and the SVG mark as the favicon and PWA icon, and set `theme-color` to `#0C0A18`.
3. **Landing hero in the app world.** The `data-register="play" data-theme="night"` hero with the `.scene` lasers and haze, spotlights, crowd, the podium phone, and Pip and Duke Doublecount. Then the three glossy proof panels and the Studio-style business section.
4. **Spotlight stage and Club scene on the mission screen.** Spots, crowd and the bass-drop flash inside the existing hit sequence, within the flash limits; the HUD beat pulse.
5. **K.O. runway walk and the Lookbook Vault.** The catwalk, strut, flashes and "The new look." with `payoff` items; then the 2×2 magazine covers from `album[]`.

Then:
- **Studio:** header bands and row avatars; the flat button family.
- **Play:** surreal props; the copy pass; mascot default `cool`; the equalizer loader; sound re-voice.

## Shared brand layer: one world (G4)

**The problem:** the landing and Studio look like a calm dark-forest editorial site, while the student app is a runway/club game, so they read as two products.

**The fix:** one brand layer used everywhere: one wordmark, one signature accent plus one secondary, one scene language and one button family.
- The landing's first screen *is* the app's world.
- Studio stays calm and dense, with readable tables: "the same world, at work".

**Retiring forest:** willder's forest green stays willder's brand and leaves Pip. Studio moves to **Ink at Work**, a calm, desaturated cousin of Club. This is only a token swap in `tokens.css :root`; every Studio class name stays.

### 1. Wordmark and app icon
- **Wordmark:** "pip", lowercase, in Unbounded 900 with tracking −.045em. A small lime thought-bubble (one dot and a smaller trailing dot) sits after the word at cap height. That bubble is Pip's signature: Pip is always thinking about what you taught it.
- **Fill:** chrome (white → silver → steel → white) with an ink stroke of 4% of the size, painted under the fill. In Club it may switch to holo.
- **Contrast:** it is large display text, so 3:1 applies. The stroke is 14.4:1 on Runway white, and the chrome's darkest stop is 6.1:1 on Ink and 6.4:1 on Club.
- **Where:**
  - Landing hero: 72–120px.
  - Landing nav and Studio top bar: 24px, replacing the forest `.brand` text.
  - Play home title screen: 40px, top-left.
  - Play HUD: none, because the HUD has no text chrome (the 🏠 icon button stays).
  - Favicon, PWA icon, `theme-color` `#0C0A18`, OG image (the hero scene crop).
- **Icon:** the mark is an original geometric "p" (a rounded stem plus a ring bowl) in chrome, the lime thought-bubble, and one cyan laser streak on a black-violet tile. It needs no web font, so the favicon renders before fonts load. All content sits inside the 80% maskable safe zone. Save it as `public/pip-icon.svg` and export 192/512 PNGs (plus maskable) to `public/icons/`.

```html
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Pip">
  <defs>
    <linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1C1233"/><stop offset="1" stop-color="#07040F"/></linearGradient>
    <linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".45" stop-color="#D9DDE5"/><stop offset=".53" stop-color="#8A90A0"/><stop offset="1" stop-color="#EEF0F4"/></linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="url(#t)"/>
  <path d="M6 46 L58 20" stroke="#2EF2FF" stroke-opacity=".45" stroke-width="1.5"/>
  <rect x="15" y="18" width="10" height="36" rx="5" fill="url(#c)"/>
  <circle cx="33" cy="29" r="10" fill="none" stroke="url(#c)" stroke-width="9"/>
  <circle cx="50" cy="13" r="4.5" fill="#B6FF3B"/><circle cx="45" cy="19.5" r="2" fill="#B6FF3B"/>
</svg>
```

```css
.wordmark { --wm: 28px; display: inline-flex; align-items: flex-start; font: 900 var(--wm)/.9 'Unbounded', 'Manrope', sans-serif;
  letter-spacing: -.045em; text-transform: lowercase; color: transparent;
  background: linear-gradient(180deg, #FFFFFF 0%, #D9DDE5 45%, #8A90A0 53%, #EEF0F4 100%);
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-stroke: calc(var(--wm) * .04) var(--wm-stroke, #0B0B12); paint-order: stroke fill; }
.wordmark::after { content: ''; width: .2em; height: .2em; margin: -.05em 0 0 .08em; border-radius: 50%;
  background: var(--accent-2, #B6FF3B); box-shadow: -.15em .17em 0 -.055em var(--accent-2, #B6FF3B); }
[data-theme="night"] .wordmark--holo { background-image: conic-gradient(from 200deg, #2EF2FF, #B6FF3B, #FFE14D, #FF9A3C, #7B6CFF, #2EF2FF); }
@media (forced-colors: active) { .wordmark { color: CanvasText; background: none; -webkit-text-stroke: 0; } .wordmark::after { background: CanvasText; } }
```

### 2. Signature accent and secondary (both registers)
- **Signal Cyan `#2EF2FF` (`--accent`)** means *act*.
  - **Fills:** Studio's primary button (replacing ice), Club's primary gel, focus rings on dark grounds, the selected state.
  - **Runway:** cyan is light, never text on white. It shows as the 2px inner edge of the black primary gel and in the laser streak.
  - **Labels on cyan:** always ink `#0C0A18` or `#07040F`, 14.2:1 or better.
- **Acid Lime `#B6FF3B` (`--accent-2`)** means *learned*.
  - **Where:** the wordmark's thought-bubble, her progress in Play, and Studio's "Explained well" pill and "taught this week" rings (replacing sage `#A6D4B4`).
  - **On white:** text uses `#2F6B00`.
- **Unchanged role rules:** coral is boss HP and Pip's wrong beliefs in Play only; Studio never uses coral; magenta is scene light only.

| Token | Runway (day) | Club (night) | Studio "Ink at Work" |
|---|---|---|---|
| `--accent` | `#2EF2FF` (edge and glow only) | `#2EF2FF` (gel) | `#2EF2FF` (flat button, ink label 14.2:1; text 11.0:1) |
| `--accent-2` | fill `#B6FF3B`, text `#2F6B00` | `#B6FF3B` | `#B6FF3B` (12.6:1) |

**Studio "Ink at Work"** (`tokens.css :root`; same variable names; AA worst case across `#0C0A18`, `#15122A`, `#1D1936`, `#262144`):
- **Grounds:** `--ink #0C0A18`, `--surface #15122A`, `--surface-2 #1D1936`, `--surface-3 #262144`, `--overlay #1D1936`.
- **Text:** `--fg #F4F2FA` 13.7, `--fg-muted #D6D2E6` 10.3, `--fg-subtle #A9A3C4` 6.3.
- **Action:** `--ice` (now `--accent`) `#2EF2FF` with `--ice-ink #0C0A18`; `--focus #2EF2FF`.
- **States:** `--success #B6FF3B` 12.6, `--warning #FFE14D` 11.7, `--sunset` (Misconception pill) `#F59B76` 7.1, `--danger #FFA3A3` 8.0.
- **Fields:** `--field-border #7A73A0` 3.5.
- **Materials:** `--glass-fill: linear-gradient(120deg, rgba(29,25,54,.62), rgba(12,10,24,.52))`, `--glass-edge: rgba(214,210,230,.16)`.
- **Backdrop:** `.backdrop` ribbon recolored to violet haze `rgba(123,108,255,.18)` with a cyan edge `rgba(46,242,255,.10)`. Grain stays.
- **Type:** Fraunces stays for Studio titles and her quotes (calm editorial).

### 3. Same scene on the landing hero
The landing hero is a slice of the app: a full-bleed Club scene (the night tokens, lasers, haze, a crowd strip) whatever the visitor's OS theme, because it is the most striking first frame.
- **Desktop:** the live phone (`PhoneFrame`) stands center-right on a podium under two spotlights. Pip (2D, `framing="hero"`) stands at the front-left of the podium. Duke Doublecount (the triangle-area boss, `Boss2D` `variant="club"`) poses on a DJ-booth plinth behind and to the right, a little smaller, under the coral rim light.
- **Mobile:** no iframe. Wordmark, headline, Pip and Duke art, then the CTA, which opens the student app directly.

Reuse the Play tokens by scoping the hero, and render the scene with a `.scene` element. `.scene` is an absolutely positioned twin of `.backdrop`: extend every `.backdrop`, `::before` and `::after` selector in the Club CSS to `.backdrop, .scene`.

```html
<section class="landing-hero" data-register="play" data-theme="night">
  <div class="scene" aria-hidden="true"></div>
  <div class="stage-fx" aria-hidden="true"><i class="spot spot--l"></i><i class="spot spot--r"></i><i class="crowd"></i></div>
  <div class="landing-hero__copy">…wordmark, headline, sub, role buttons…</div>
  <div class="landing-hero__show">…Pip2D · PhoneFrame on .podium · Boss2D variant="club"…</div>
</section>
```
```css
.landing-hero { position: relative; isolation: isolate; min-height: 100dvh; display: grid; align-items: center; overflow: hidden;
  grid-template-columns: 1fr; padding: 24px 16px 96px; color: var(--fg); background: var(--ink); }
@media (min-width: 1024px) { .landing-hero { grid-template-columns: minmax(0, 5fr) minmax(0, 6fr); padding: 48px 48px 0; } }
.scene { position: absolute; inset: 0; z-index: -1; background: var(--sky); overflow: hidden; }
.landing-hero__headline { font: 800 clamp(34px, 5vw, 64px)/1.02 var(--font-game); letter-spacing: -.03em; }
.landing-hero__headline em { font: italic 700 1.08em/1 var(--font-editorial); letter-spacing: -.02em; color: var(--accent, #2EF2FF); }  /* 11:1 on Club */
.landing-hero__sub { font: 500 18px/1.5 'Manrope', sans-serif; color: var(--fg-muted); max-width: 34ch; }
.podium { width: 70%; height: 36px; margin: -18px auto 0; border-radius: 50%; background: radial-gradient(ellipse at 50% 30%, #3A2E66, #120B22 70%);
  box-shadow: 0 0 0 2px #2EF2FF66, 0 0 30px rgba(46,242,255,.35); }
```
Copy keeps the pitch exactly: **"Every AI tutor plays the teacher. *Pip plays the student.*"** The second sentence is in Bodoni italic and cyan. The subline "For tutoring centers: know what every student understands, before they walk in." follows, then three buttons in the Play gel family: "Try as Maya" (primary cyan gel), "Open as Ms. Rivera" and "Owner view" (secondary).

### 4. Studio: the same world, at work
Studio keeps its density, readable tables and calm motion (no lasers moving, no glows on data), and adopts:
- **The wordmark** (24px) in the top bar, and the "Bright Path Tutoring" chip beside it.
- **A header band:** a static, light version of the scene behind each page head, as a 132px band at the top of tutor, owner, report and pricing pages. Violet haze, two still laser lines and a slow fade into the ground. No animation and no crowd. The page title sits on it: `--fg` on the band's lightest point (where the cyan line crosses the haze) is 10.0:1.
- **Avatars in rows:**
  - Roster rows show each student's own Pip head: 28px, from `thumb.jsx` or `Pip2D` at `size={28}`, with their vibe and creature. The ring is lime if they taught this week and `--divider` otherwise.
  - The boss appears as a neutral chip with a 20px `Boss2D` icon plus its name ("🦚 Duke Doublecount"), next to the plain-language misconception.
  - The insight card's count gets the boss's 48px icon.
  - Coral stays out of Studio.
- **Buttons from the same family** (below), and the accent and secondary from §2.

```css
.studio-band { position: absolute; inset: 0 0 auto; height: 132px; z-index: -1; pointer-events: none;
  background:
    linear-gradient(100deg, transparent 0 58%, rgba(46,242,255,.14) 58% 58.4%, transparent 58.4%),
    linear-gradient(80deg, transparent 0 72%, rgba(182,255,59,.10) 72% 72.3%, transparent 72.3%),
    radial-gradient(60% 120% at 80% 0%, rgba(123,108,255,.20), transparent 70%), var(--ink);
  -webkit-mask: linear-gradient(180deg, #000 55%, transparent); mask: linear-gradient(180deg, #000 55%, transparent); }
.row-avatar { width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; background: var(--surface-3);
  box-shadow: 0 0 0 2px var(--ring, var(--divider)); overflow: hidden; }
.row-avatar.is-taught { --ring: #B6FF3B; }
.boss-chip { display: inline-flex; align-items: center; gap: 6px; padding: 2px 10px 2px 4px; border-radius: 999px;
  border: 1px solid var(--border); color: var(--fg-muted); font: 500 14px/1.3 'Manrope', sans-serif; }
```

### 5. One button family
Same pill radius, same edge logic and same color meaning everywhere; only the material changes.

| | Play gel (`.gel-btn`) | Studio flat (`.btn`) |
|---|---|---|
| Shape | pill 999px, 52–72px | pill 999px, 44px (`--lg` 52px) |
| Material | gloss highlight, inner glow, outline, 5–6px pressable edge | flat fill, 1.5px border, **2px edge** `0 2px 0 rgba(0,0,0,.45)`, no gloss |
| Press | sink 5px plus squash (100ms) | sink 2px, edge to 0 (100ms), no squash |
| Primary | Runway black chrome / Club cyan | cyan `#2EF2FF` with ink label (14.2:1) |
| Secondary | chrome or indigo gel | transparent with a 1.5px `--border`, `--fg` label |
| Ghost | n/a | no border, `--fg-muted` |
| Type | Unbounded 600 17px (PLAY 800 24px uppercase) | Manrope 700 15px |

```css
.btn { border-radius: 999px; border-width: 1.5px; box-shadow: 0 2px 0 rgba(0,0,0,.45); transition: transform 100ms var(--ease), box-shadow 100ms var(--ease); }
.btn:active { transform: translateY(2px); box-shadow: 0 0 0 rgba(0,0,0,0); }
.btn--primary { background: var(--accent, #2EF2FF); border-color: var(--accent, #2EF2FF); color: #0C0A18; }
.btn--primary:hover { background: #7DF7FF; border-color: #7DF7FF; }
.btn--ghost { box-shadow: none; }
```

### 6. Landing structure (rewrite)
The landing may scroll; it is Studio's register at the bottom, with the app's world on top. Order:
1. **Hero in the app world:** the Club scene, wordmark, pitch, role buttons, and the live phone with Pip and Duke Doublecount (§3). Desktop is one viewport; mobile is one viewport plus a CTA.
2. **Three proof sections as glossy panels.** Each sits on the Club scene, fading in haze toward Ink as you scroll. Each is a `.panel` in the Club style (1.5px `#6C5BB0` edge plus a neon glow), with a Geist Mono numeral, an Unbounded 700 28px headline, one Manrope line and a small live visual built from real components (no screenshots). Each animates once when 50% visible and is static under reduced motion. Panels are stacked on phones and in a 3-column row at 1024.
   - **01 · She teaches.** "Maya explains why ½ + ⅓ isn't ⅖." Visual: her bubble, then a boss hit (HP segment drop and the "−40" tag).
   - **02 · Pip believes exactly what she said.** Visual: the three Brain notes; the wrong one glows coral, then flips to lime "fixed after 1 re-teach".
   - **03 · Her tutor sees the gap, in her words.** Visual: one gap-report row in **Studio** style (pill, quote in Fraunces italic, the Tuesday opener). This panel is the bridge: its glossy edge fades to the Studio hairline.
3. **Business section in Studio style:** Ink ground with the header band. The insight card ("14 students share the same mistake" plus the Duke chip), the pricing card ($4 per active student per month, $99 minimum, "Start pilot" flat primary), then the footer "Demo center with synthetic data."

**Contrast:**
- **Proof panels:** headline `#FFFFFF` on the Club panel 14.4:1, lines `#DCD5F2` 10.2:1.
- **Business:** Studio roles as above (worst 6.3:1).

## Theming: build your own UI (S10)

A student theme is a small DESIGN.md: a token set in this file's front-matter shape plus a one-line atmosphere. It can change the look, never the meaning, and is visual only (no uploads). It is saved as "My theme" and applied on the `[data-register="play"]` root.

```yaml
theme:
  name: "Night Arcade"
  atmosphere: "Navy arcade at night: frosted panels, cyan gels, lime progress."
  base: night                    # day | night: picks the Play token block it overrides
  colors: { sky-top, sky-bottom, panel-top, panel-bottom, fg, fg-muted, fg-subtle, action, action-ink, outline, progress, win, boss }
  display: chunky                # chunky (Fredoka wdth 112) | regular (100) | narrow (88)
  radius: normal                 # tight 0.75x | normal 1x | round 1.25x (gels stay pills)
  bubble: comic                  # comic (24px, tail) | square (10px, tail) | cloud (puffs)
  scene: clouds                  # clouds | stars | bubbles | grid | ruled | none (CSS only)
  motion: normal                 # low (no shake, half travel, no glints) | normal
```

**Presets** (original names; never named after or imitating a real brand). The worst text pair is across sky, panel and well.

| Preset | sky / panel | fg trio | action / label | progress / win / boss | outline | scene, display | worst text pair |
|---|---|---|---|---|---|---|---|
| **Runway** (default, G4) | `#FFFFFF`→`#D9DDE5` / `#FFFFFF`→`#F6F7F9` | `#0B0B12` `#34364A` `#55586E` | `#0B0B12` / `#FFFFFF` | `#2F6B00`·`#B6FF3B` / `#8A5200`·`#FFB020` / `#B0281A`·`#FF6F61` | `#0B0B12` | gallery, editorial | sun text 4.7:1 |
| **Club** (dark default, G4) | `#07040F`→`#140A26` / `#251A42`→`#1C1233` | `#FFFFFF` `#DCD5F2` `#ADA3D1` | `#2EF2FF` / `#07040F` | `#B6FF3B` / `#FFE14D` / `#FF9D92`·`#FF6F61` | `#6C5BB0` | lasers, wide | fg-subtle 6.1:1 |
| **Daylight Arcade** | `#BFE6FF`→`#E3FCEB` / `#FFFFFF`→`#EEF6FF` | `#10213F` `#2E4466` `#4A5F80` | `#2A63F5` / `#FFFFFF` | `#1A7030`·`#3FBF4F` / `#8F5200`·`#FFB020` / `#B52E1B`·`#FF6B5E` | `#10213F` | clouds, chunky | fg-subtle 4.9:1 |
| **Night Arcade** | `#0E1530`→`#1B1F4D` / `#333E86`→`#2A3370` | `#FFFFFF` `#DCE3FF` `#B8C2EE` | `#33E1FF` / `#0E1530` | `#A3F04A` / `#FFD23F` / `#FFA89C`·`#FF8A7A` | `#050A1F`, panels `#6E7BD6` | stars, chunky | coral 5.1:1 |
| **Deep Aqua** | `#031A2B`→`#0A2A40` / `#123A55` | `#EEF9FF` `#CFE6F2` `#9FC3D6` | `#5FE3E8` / `#031A2B` | `#B8F04A` / `#FFD27A` / `#FF8A7A` | `#01101C` | bubbles, regular | boss 5.2:1 |
| **Night Forest** | `#001914`→`#0A2721` / `#12372E` | `#EFEFE9` `#D4D4CD` `#A8B8AE` | `#C9FCFC` / `#001914` | `#8FE3B0` / `#FFD27A` / `#FF8A7A` | `#000D0A` | stars, regular | fg-subtle 6.3:1 |
| **Chrome** | `#111316`→`#1A1D21` / `#252A30` | `#F2F4F6` `#D3D8DD` `#A3ABB3` | `#DDE3E8` / `#111316` | `#8FE3B0` / `#FFD27A` / `#FF8A7A` | `#000000` | grid, narrow | fg-subtle 6.2:1 |
| **Notebook** (light) | `#F7F3E8`→`#FFFDF6` / `#EFE9D8` | `#1C241F` `#3D4A42` `#56635A` | `#245B64` / `#F7F3E8` | `#1A6E42` / `#805300` / `#B23A29` | `#1C241F` | ruled, regular | boss 4.9:1 |

**She may change:** the hex within each role, the display width, the radius scale, the bubble style, the scene, the motion level (low or normal), and Pip's look (3D).

**Locked:**
- **Role meanings:** action is the only filled-button and link color; boss (coral) hue stays at 0–20deg and is only for boss HP and Pip's wrong beliefs; progress hue stays at 90–170deg; win is her wins.
- **No pink or lilac** (hue 280–345deg) in the action, progress or win slots. Magenta may appear only as scene light (Club lasers, haze), never in a slot.
- **Structure and access:** fonts, the type scale and 15px floor, 48px tap targets, the 3px outline and gel structure, spacing, the one-viewport rule, focus ring width, reduced motion, all copy, and the K.O. card.

**Validation on save,** live in the picker and again on save:
1. **Contrast:** every text role needs 4.5:1 on sky top, sky bottom, panel top, panel bottom and well. The action label needs 4.5:1 on the gel's middle stop. Outline vs sky and panel outline vs sky need 3:1. Role fills need their label at 4.5:1; role text values need 4.5:1 on the panel.
2. **Auto-adjust:** step a failing pick's OKLCH lightness 1% at a time toward passing (keeping hue and chroma) and stop at the first pass. Say so inline: "Adjusted your lime a little so text stays readable (4.6:1)." Never adjust a color she didn't pick.
3. **Coral vs progress:** at least 60deg of hue apart, and coral vs action at least 30deg. They are never told apart by hue alone: the stickers, faces and HP number stay on in every theme.
4. **Scene patterns:** at most .06 opacity behind text, and contrast is re-checked on the brightest pixel.

**Where it applies:** theme tokens override the Play blocks above, inline on the Play root only. Gel stops are derived from `action` (top +12% lightness, bottom −8%) with `color-mix(in oklch, …)`. Soft and line tints are derived at 14% and 45%. Studio, tutor, owner and parent surfaces, and the K.O. card's layout and palette, never take a theme. A center theme (the owner's colors as the student default) runs through the same validator.

## Agent Prompt Guide

**Quick reference.**
- **Studio:** forest `#001914`, ivory `#EFEFE9`, ice action `#C9FCFC`, Fraunces, Manrope, Geist Mono.
- **Play day:** sky `#BFE6FF`→`#E3FCEB`, white panels, navy text and outlines `#10213F`, blue gel `#2A63F5` with a white label, lime `#3FBF4F` (text `#1A7030`), sun `#FFB020` (text `#8F5200`), coral `#FF6B5E` (text `#B52E1B`).
- **Play night:** `#0E1530`→`#1B1F4D`, frosted indigo panels, white text, cyan gel `#33E1FF` with a `#0E1530` label, lime `#A3F04A`, yellow `#FFD23F`, coral `#FF8A7A` (text `#FFA89C`).
- **Shared:** Fredoka for anything big, Manrope 600 16px for small body. K.O. card `#14161F`.

**Ready prompts.**
- "Convert the student mission screen to the Play game layout in DESIGN_SYSTEM.md: a `.play-screen` grid at 100dvh with no page scroll; a HUD with a 🏠 icon button, boss name and segmented 10-part glossy HP bar, Brain badge and mute; a level map of ① ② ③ → boss → 🏆 nodes with progress rings; a centered 3D Pip with a comic speech bubble above its head and her last message bottom-right; a weapon tray with 📓 history and 'Quiz Pip ▶'; a chunky rounded input with a round send gel. Use the day/night token blocks."
- "Build the student home as a game title screen: Pip centered in its room, a one-line bubble, a ribbon with the mission topic and boss sticker, a 72px 'PLAY' gel, and round icon buttons for Look, Vault, Missions, theme and mute. It must fit 375×667 without scrolling."
- "Style the boss hit: 70ms hit-stop, 240ms squash, 280ms ±8px shake on the boss only, HP segments drop instantly with a white ghost that drains over 450ms after 150ms, a coral '−40' sticker rising 28px over 700ms, then a caption sticker for 2.8s; 900ms at most in total."
- "Pip's Brain as one screen: a cloud panel with at most 3 paper notes per page (scroll-snap pages with dots), wrong note in coral glow with a 'Pip believes this 😵' sticker, fixed note in lime with a 'fixed after N re-teach' sticker, and the 'Quiz Pip ▶' primary gel."
- "Keep the K.O. card quiet: 9:16, #14161F matte, Geist Mono 'No. 0147' (optionally holo), one metallic hairline sweeping once over 6s, Fraunces equation, tap to flip. No gel, outline, Fredoka, confetti or '!'."
