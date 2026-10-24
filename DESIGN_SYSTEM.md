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
  studio:   # :root default; tutor, owner, landing, pricing, parent preview
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
  url: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..700&family=Fredoka:wdth,wght@75..125,400..700&family=Geist+Mono:wght@400;500&family=Manrope:wght@400;500;600;700;800&display=swap"   # verified 200
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
  play:          # Fredoka = --font-game (NEW)
    title:       { font: Fredoka, size: "40 / 56 @1024", weight: 700, wdth: 112, lh: 1.0 }
    ribbon:      { font: Fredoka, size: 22, weight: 700, wdth: 108 }
    button-lg:   { font: Fredoka, size: 30, weight: 700, wdth: 112, case: upper, note: "PLAY" }
    button:      { font: Fredoka, size: 20, weight: 700, note: "large bold text, 3:1 rule applies; still >= 4.5:1 on mid fill" }
    button-sm:   { font: Fredoka, size: 17, weight: 600 }
    hud-number:  { font: Fredoka, size: 18, weight: 700, numeric: tabular-nums }
    speech:      { font: Fredoka, size: 19, weight: 500, lh: 1.3, note: "Pip's comic bubble" }
    sticker:     { font: Fredoka, size: 15, weight: 700 }
    icon-label:  { font: Fredoka, size: 15, weight: 600 }
    stamp:       { font: Fredoka, size: 96, weight: 700, wdth: 125, note: "K.O." }
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

**Studio** (landing, tutor, owner, gap report, pricing, parent preview) is willder's calm web app. Forest ground (`#001914`), a faint ice ribbon, ivory text, glass cards, Fraunces titles, Manrope body, Geist Mono facts. It borrows Oura's editorial calm and Linear's precision: hairline rows, one shadow tier, one filled ice button per screen. No boss humor; the boss is a neutral chip.

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
- **Whiff (`.shake-whiff`):** a 280ms tilt and "Addini Bottomini is unbothered."
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
2. **Stamp:** "K.O." in Fredoka 700 96px (wdth 125, 6px outline stroke) stamps in at −6deg (`scale 1.4 → 1`, 240ms ease-pop), with the caption "Addini Bottomini has left Pip's brain.", a chrome sticker "Brain v1 → v2" and Pip celebrating. No confetti, no "!".
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
| **Daylight Arcade** (default) | `#BFE6FF`→`#E3FCEB` / `#FFFFFF`→`#EEF6FF` | `#10213F` `#2E4466` `#4A5F80` | `#2A63F5` / `#FFFFFF` | `#1A7030`·`#3FBF4F` / `#8F5200`·`#FFB020` / `#B52E1B`·`#FF6B5E` | `#10213F` | clouds, chunky | fg-subtle 4.9:1 |
| **Night Arcade** (dark default) | `#0E1530`→`#1B1F4D` / `#333E86`→`#2A3370` | `#FFFFFF` `#DCE3FF` `#B8C2EE` | `#33E1FF` / `#0E1530` | `#A3F04A` / `#FFD23F` / `#FFA89C`·`#FF8A7A` | `#050A1F`, panels `#6E7BD6` | stars, chunky | coral 5.1:1 |
| **Deep Aqua** | `#031A2B`→`#0A2A40` / `#123A55` | `#EEF9FF` `#CFE6F2` `#9FC3D6` | `#5FE3E8` / `#031A2B` | `#B8F04A` / `#FFD27A` / `#FF8A7A` | `#01101C` | bubbles, regular | boss 5.2:1 |
| **Night Forest** | `#001914`→`#0A2721` / `#12372E` | `#EFEFE9` `#D4D4CD` `#A8B8AE` | `#C9FCFC` / `#001914` | `#8FE3B0` / `#FFD27A` / `#FF8A7A` | `#000D0A` | stars, regular | fg-subtle 6.3:1 |
| **Chrome** | `#111316`→`#1A1D21` / `#252A30` | `#F2F4F6` `#D3D8DD` `#A3ABB3` | `#DDE3E8` / `#111316` | `#8FE3B0` / `#FFD27A` / `#FF8A7A` | `#000000` | grid, narrow | fg-subtle 6.2:1 |
| **Notebook** (light) | `#F7F3E8`→`#FFFDF6` / `#EFE9D8` | `#1C241F` `#3D4A42` `#56635A` | `#245B64` / `#F7F3E8` | `#1A6E42` / `#805300` / `#B23A29` | `#1C241F` | ruled, regular | boss 4.9:1 |

**She may change:** the hex within each role, the display width, the radius scale, the bubble style, the scene, the motion level (low or normal), and Pip's look (3D).

**Locked:**
- **Role meanings:** action is the only filled-button and link color; boss (coral) hue stays at 0–20deg and is only for boss HP and Pip's wrong beliefs; progress hue stays at 90–170deg; win is her wins.
- **No pink or lilac** (hue 280–345deg) in the action, progress or win slots.
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
