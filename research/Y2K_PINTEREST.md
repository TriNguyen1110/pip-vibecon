# Y2K × 2016 on Pinterest: what to build for Pip (DES-Y2K)

Owner's direction: "look up images of y2k apps/tech on pinterest, that's where I want you to go."
Coordinator branch: for 10–15s, Y2K is a *style*, and their own childhood is 2014–2020 ("2026 is the new 2016").
The target is where those two overlap.

**Artifacts**
- `reports/design/pinterest/*.png`: 66 raw grid captures (22 queries × 3 screens). Git-ignored; third-party, reference only.
- `reports/design/y2k_board.png`: labeled moodboard of cropped tiles. Git-ignored, same reason.
- `reports/design/y2k_tokens_preview.png` (+ `.html`): every recipe built from scratch in CSS, with five audience registers side by side. Safe to commit.
- `reports/design/y2k_tokens.css.patch.css`: proposed tokens and components. Not applied; frontend owns `frontend/**`.

## Method and source status
- **Pinterest worked.** It was logged out, using `https://www.pinterest.com/search/pins/?q=…`, Playwright, and system Chrome at a 1440px desktop viewport. Every query returned 13–22 pins and no login wall blocked the grid.
- **Scrolling was locked for logged-out users**: 20 of 22 queries returned identical frames after wheel or scroll. I re-captured with a 1440×2600 viewport (about three screens of pins) and split each capture into `-1/-2/-3`.
- All motifs below come from Pinterest. No fallback to Are.na, Behance or Dribbble was needed.

**Queries (22)**
- **Y2K:** y2k app ui · y2k user interface · y2k tech aesthetic · frutiger aero · y2k gadgets · y2k web design · early 2000s ui · windows xp aesthetic · ipod nano ui · tamagotchi · y2k phone ui · cybercore y2k · y2k chrome 3d icons · y2k mobile app design
- **2016 branch:** 2016 aesthetic · 2016 nostalgia · early 2010s mobile game ui · glossy game ui buttons · talking tom app · subway surfers ui · musical.ly aesthetic · 2016 purple blue filter

**What the 2016 queries actually returned:**
- "2016 aesthetic" and "2016 nostalgia" are mostly lifestyle photos: palm trees, Starbucks cups, rose-gold iPhones, #SWAG, galaxy prints, fidget spinners, Nyan Cat, Minecraft/Roblox collages. Some are party photos. Almost none is UI, and some is not kid-appropriate.
- The usable 2016 **UI** signal comes from *early 2010s mobile game ui*, *glossy game ui buttons*, *talking tom app* and *subway surfers ui*.
- From the lifestyle side, only the **purple-blue tint** carries over, as scene light.
- *musical.ly* returns a brand logo and a pink-red app. Brand, so off-limits; the only takeaway is "round avatar + big counts".

## The sweet spot: where 2012–16 mobile-game UI meets Y2K gel/chrome
The 2012–16 game UI these kids grew up on (Subway Surfers, Talking Tom, Cut the Rope, Temple Run, Candy Crush home screens) is **Y2K Aqua gel with a chunky outline added**.

| Shared DNA (use freely) | Y2K-only (adds the "tech" read) | 2016-only (adds "my childhood") |
|---|---|---|
| Pill buttons with a white gloss cap · saturated blue/green/yellow fills · round glossy icon orbs · rounded-square app icons with top shine · bubbles/sky | liquid chrome · translucent candy plastic · LCD panels · window chrome · skinned-player blobs · cybercore duotone | dark rim + 5–6px **pressable bottom edge** · **coin capsule** counter with overlapping coin and a "+" · round **level badge** · mission list panels with a light top bevel · green PLAY / yellow CLAIM · red notification dots |

**Pip is already halfway there.** Daylight Arcade's gel buttons, round icon buttons and pressable edges are the 2016 half. What's missing is the Y2K material layer: a hard gloss cap, the caustic glow, chrome, LCD and plastic. So the hackathon move is a **re-skin, not a redesign**.

**Tension with G4.** G4 retires the Arcade sky and bubbles in favor of Runway/Club. Pinterest (Frutiger Aero) argues for keeping bubbles and sky for **10–12 (play)**, with Club plus cybercore as the **13–15 (cool)** register. That maps one-to-one onto the v3.14 Audiences table, so the coordinator should confirm it.

## 12 recurring motifs (buildable recipes)
All of these are in `y2k_tokens.css.patch.css` under `--y2k-*` / `.y2k-*`.

**Fonts.** All are on Google Fonts; they'd be added to the existing URL.
- **VT323:** LCD digits.
- **Silkscreen:** pixel labels, 15px minimum.
- **Michroma:** wide extended-sans tech caps, letter-spacing .08em.
- **Unbounded 800–900:** stays the display face and the chrome type.

Avoid Orbitron (cliché), Comic Sans, Press Start 2P for body text, and Papyrus/RPG faces.

### 01 · Aqua gel pill (Y2K × 2016)
*Sources: glossy game ui buttons, early 2010s mobile game ui, frutiger aero.*
- **Body:** `linear-gradient(180deg, #0B5BC0 0%, #1670D8 50%, #2E93EE 76%, #8FE4FF 100%)`. It's darker at the top and lighter at the bottom, like light passing through.
- **Gloss cap:** a `::before` at `left/right 9%`, `top 3px`, `height 46%`, radius 999, `linear-gradient(180deg, rgba(255,255,255,.92), rgba(255,255,255,.55) 45%, rgba(255,255,255,.08))`.
- **Caustic:** `inset 0 -8px 14px -4px rgba(190,250,255,.75)`.
- **Rim and 2016 edge:** `0 0 0 1.5px #06336E, 0 6px 0 #06336E, 0 12px 18px -8px rgba(6,51,110,.55)`. On press: `translateY(5px)` and the edge goes to 1px.
- **Colorways:** lime `#3E9A06→#D9FF9A`, ink `#0E2400`. Sun `#D97A00→#FFF0A8`, ink `#2A1700`. Smoke `#1A1D29→#8A93AB`, white. Chrome.
- **Contrast:** white on the 50% stop 4.8:1, lime 7.6:1, sun 8.3:1.

### 02 · Candy-bevel game panel (2016)
*Source: subway surfers ui.*
- Radius 14–18.
- **Fill:** `linear-gradient(180deg, #3D7BE0, #2A5FC4)`.
- **Bevel:** `inset 0 2px 0 rgba(255,255,255,.35)`. **Rim and edge:** `0 0 0 2px #0E2A66, 0 4px 0 #0E2A66`.
- Rows are lighter wells (`rgba(255,255,255,.12)`, radius 8) with a lime "+1500" pill at the right.
- For Pip: Missions list, Vault rows, quiz result panel.

### 03 · Coin capsule + level orb (2016)
*Sources: talking tom app, subway surfers ui.*
- **Capsule:** pill, 34px tall, `rgba(6,20,60,.62)`, double ring `0 0 0 2px #fff, 0 0 0 3.5px #06336E`.
- **Coin:** 38px, overlapping the left edge by −6px, `radial-gradient(circle at 35% 30%, #FFF6C2 0 12%, #FFD23F 35%, #E09A00 80%)`.
- **"+":** a 24px lime gel.
- **Numbers:** Unbounded 700 17px, tabular.
- **Level orb:** a 44px circle with a number and a ring-progress `conic-gradient`.

### 04 · Liquid chrome + starbursts (Y2K, the freshest motif)
*Source: y2k chrome 3d icons.*
- **Horizon chrome:** `linear-gradient(180deg, #FFF 0%, #E9EDF2 20%, #A9B2BD 46%, #3C434D 50%, #7D8794 62%, #D5DBE2 82%, #FFF 100%)`.
- **Type:** `background-clip: text` plus a `-webkit-text-stroke` of 2.2% of the size in `#2A2F38`, with `drop-shadow(0 3px 0 rgba(0,0,0,.25))`.
- **Sparkle:** 4-point `clip-path: polygon(50% 0,57% 43%,100% 50%,57% 57%,50% 100%,43% 57%,0 50%,43% 43%)`, filled with a 135° chrome gradient.
- **Glint:** 1.6s, scale .4→1.1 with a 45° rotate, `ease-pop`.
- Use it on black (cool) or white (play).

### 05 · Translucent candy plastic (Y2K)
*Sources: y2k gadgets, y2k tech aesthetic.*
- **Fill:** `linear-gradient(160deg, rgba(120,220,255,.62), rgba(20,140,210,.42))` over ribs `repeating-linear-gradient(90deg, rgba(255,255,255,.14) 0 2px, transparent 2px 7px)`.
- **Glass:** `backdrop-filter: blur(8px) saturate(1.4)`.
- **Edges:** `inset 0 3px 0 rgba(255,255,255,.65)`, `inset 0 -18px 30px -10px rgba(0,50,110,.35)`, `0 0 0 1.5px rgba(255,255,255,.75)`.
- **Specular:** an extra highlight in the top-left 28%.
- Radius 44 (bezel) or blob `42% 58% 46% 54% / 56% 48% 52% 44%`.
- **Colorways:** aqua, lime, smoke. Pinterest's grape and strawberry are pink-coded, so skip them.

### 06 · LCD panel (Y2K)
*Sources: tamagotchi, y2k user interface, ipod nano ui.*
- **Green:** `#C3D19B` with `#1E2A12` ink (9.3:1).
- **Blue backlit:** `#A8E6FF` with `#04253D` ink (11.5:1).
- **Night:** `#0A1630` with `#7CF4FF` ink (13.9:1) and a 6px glow.
- **Texture:** dot-matrix `radial-gradient(rgba(0,0,0,.07) 1px, transparent 1.3px) 0 0/3px 3px`.
- **Depth:** `inset 0 2px 5px rgba(0,0,0,.38), inset 0 0 0 2px rgba(0,0,0,.12), 0 1px 0 rgba(255,255,255,.55)`. Radius 8.
- **Type:** VT323, 20–26px. Optionally show ghost "88:88" at 13% behind the digits.
- **Status-bar glyphs:** 4 ascending signal bars (3px wide, 25/50/75/100%) and a 26×13 battery with a nub and segments.

### 07 · Window chrome (Y2K)
*Sources: windows xp aesthetic, y2k phone ui, y2k app ui.*
- **Title bar:** 34px, `linear-gradient(180deg, #6DB4FF 0%, #2569DB 40%, #1550C4 56%, #2F78E6 100%)`, with a top-half gloss `::before`.
- **Title:** white Unbounded 700 15px (5.0:1 or better). Radius `12 12 8 8`.
- **Close box:** a 24px chrome rounded square with ✕ (not red: coral is reserved).
- **Smoke variant:** `#4A5168 → #262B3B 50% / #12151F 52% → #2A3045` for the cool register.
- **Generic only:** no Start button, no Bliss hills, no OS logo.

### 08 · Skinned player / blob hardware (Y2K)
*Sources: y2k user interface, early 2000s ui.*
- Organic metal bezel built from the blob radius plus `--y2k-chrome-soft`.
- Inset LCD, EQ bars (5–7 bars, 4px wide), knob orbs.
- For Pip: the **Pip's Brain** drawer as a "player" (notes listed like a playlist), and the loader as an EQ.

### 09 · Frutiger Aero bubbles (Y2K; huge with teens as an ironic revival)
*Source: frutiger aero.*
- **Bubble:** `radial-gradient(circle at 32% 28%, rgba(255,255,255,.95) 0 7%, rgba(255,255,255,.3) 15%, rgba(170,235,255,.12) 45%, rgba(46,190,240,.38) 68%, rgba(255,255,255,.75) 71%, transparent 73%)`.
- **Drift:** ±18px over 9s, alternating.
- **Glass podium under the mascot:** an ellipse `radial-gradient(ellipse at 50% 30%, #FFF 0 18%, rgba(160,230,255,.7) 45%, rgba(30,141,235,.55) 75%, rgba(6,51,110,.6))`.
- **Palette (Pinterest's own swatch):** sky `#74E4FF`, deep sea `#0C71C6`, inchworm `#86E750`, grass `#6AB63F`. Gender-neutral.

### 10 · Cybercore blue duotone (Y2K × 2016 purple-blue filter)
*Sources: cybercore y2k, 2016 purple blue filter.*
- **Ground:** `linear-gradient(180deg, #0A0F3D, #1B2A9E 55%, #3F5BFF)`.
- **Scanlines:** `repeating-linear-gradient(0deg, rgba(255,255,255,.055) 0 1px, transparent 1px 3px)`, blended with `screen`.
- **Images:** `grayscale(1)` plus a blue `mix-blend-mode: multiply` layer.
- For the cool register: scene, K.O. card back, loading.

### 11 · Menu list + click wheel (Y2K)
*Source: ipod nano ui.*
- **Rows:** 44–48px white rows. The selected row gets `linear-gradient(180deg, #5FA8FF, #1E63D6)` with a white label and a chevron.
- **Header:** a gray gradient title bar with a battery glyph.
- **Progress:** a blue gel bar on white.
- For Pip: the settings/register picker and the mission picker (scrollable list, which is calmer than tiles).

### 12 · Glossy app-icon grid (2012–16)
*Source: early 2010s mobile game ui.*
- Rounded square, radius 22%.
- **Top shine:** an ellipse `radial-gradient(120% 60% at 50% -10%, rgba(255,255,255,.7), transparent 60%)`.
- **Depth:** `0 2px 4px rgba(0,0,0,.35)`.
- **Badge:** an 18px red dot with white numerals. Pip's version uses lime or sun, never coral.
- For Pip: the Vault/lookbook item tiles and the home dock.

## Fresh vs. cringe (for 10–15 in 2026)

**Fresh** (teens post or remix these now):
- Liquid chrome sparkles, stars and crescents.
- Frutiger Aero bubbles, sky and glass (an ironic-but-loved revival).
- Cybercore blue duotone with scanlines.
- LCD / Tamagotchi / digicam screens and pixel type.
- Translucent "clear tech" plastic.
- Widgets-as-windows phone home screens.
- Skinned media-player shapes.
- Their own 2016 game HUD: coin capsule, mission panel, PLAY/CLAIM pills, read as "my childhood".
- Purple-blue tint, as scene light only.

**Cringe or dated** (avoid):
- Full-rainbow stock gel button sets on everything (one gel per screen; color means role).
- Wet-floor reflections under buttons.
- Lens flares.
- Literal Windows XP: Bliss hills, the Start button, the "Task failed successfully" meme, logos.
- MSN emoticons, Comic Sans, Papyrus/RPG ornament frames.
- Galaxy print, mustaches, #SWAG, "Keep calm".
- 3D glass clip-art people.
- `.exe` on everything (one deadpan `pip.brain` window in the cool register is enough).
- Pink-coded collage (Bratz lips, strawberries, Hello Kitty, pink Widgetsmith themes).
- Wood or leather skeuomorphism.

**Palettes:**
- **Gender-neutral (use):** aqua/cobalt, lime, tangerine/sun, smoke graphite, silver/chrome, Frutiger sky/grass, cyber blue.
- **Pink-coded (stay out of UI):** bubblegum, lilac + pink, strawberry, rose gold.

## Y2K recipe per audience (v3.14 Audiences table)
These appear side by side in `y2k_tokens_preview.png`. Each would be set by `data-audience` on the shell root (proposed; it doesn't exist yet).

| Audience | Dose | Recipe |
|---|---|---|
| **Play, 10–12** | high, bubbly | Daylight sky plus Frutiger bubbles and a glass podium. Aqua/lime/sun gel pills (01). Orb icon buttons. Coin capsule plus green LCD level chip in the HUD. Chrome sparkles on wins. Chrome "LEVEL UP" and "K.O." type. Comic Pip bubble with a gloss cap; her bubble in aqua glass. |
| **Cool, 13–15** | high but styled | Club dark plus cybercore scanlines. Night LCD status bar (signal, boss name, LCD HP segments, battery). Pip speaks in a smoke **window** ("pip.brain — v1"). Smoke gel primary with a cyan glow; chrome secondary. Chrome type, a cybercore K.O. card back. Lowercase copy. No bubbles, no sun gel on primary actions. |
| **Focus, SAT 15–17** | medium | White/silver calm. **One** blue-backlit LCD status bar (subject · goal · now · timer). A chrome goal badge with an LCD number. Aqua gel only on the single primary action, chrome for secondary. Pip is a 44px avatar. A lime gel progress bar. |
| **Tutor/owner Studio** | low | Ink at Work unchanged. The flat cyan primary gets one 1px gloss line (`linear-gradient(rgba(255,255,255,.38), … 0 52%)`). Toggles become **pill switches with an aqua-glass knob**. One headline KPI per page may sit in a quiet LCD well (Geist Mono, no glow). Chrome wordmark in the top bar. Nothing animates. |
| **Parent** | very low | White, 18px body, AAA text. An aqua-glass ring around the kid's Pip avatar, one blue pill CTA, a glass-knob switch for contact preferences. No gel, chrome, LCD or motion. |

## Per-screen change list, ranked by impact per hour
Estimates assume the patch file is pasted in. "Now" refers to the current `reports/frontend/f10-e2e` captures.

| # | Change | Screen(s) | Est. | Why it ranks here |
|---|---|---|---|---|
| 1 | **Gel re-recipe:** `.gel-btn` takes the 01 recipe (split gradient, hard gloss cap, caustic glow); keep the existing edge. | every student screen (PLAY, Teach, Claim, quiz) | 30m | The biggest Y2K read for the least code. Today's PLAY already has the shape but a soft radial highlight. |
| 2 | **Chrome K.O. + level-up type** plus 3 starburst glints. It replaces the outlined Fredoka box. | K.O. stamp, level-up, Brain v1→v2 | 30m | The demo's climax moment, and chrome sparkles are the freshest motif. |
| 3 | **Orb icon buttons** (`.y2k-orb`) replace the white circles. | home (Look/Vault/Missions, top row), mission HUD, Brain button | 20m | Instantly reads as 2012 app icon plus Aqua, on every screen. |
| 4 | **Chrome wordmark + translucent device frame:** the landing `PhoneFrame` bezel becomes `.y2k-device--smoke` (or aqua), and the "Pip" text logo becomes `.wordmark` chrome. | landing, Studio top bar | 45m | The judges' first frame. It turns a generic phone mockup into a Y2K gadget. |
| 5 | **LCD HUD:** the boss name + HP row moves into an LCD strip (green in play, night in cool). "Brain v1" becomes an LCD chip. Add the coin capsule. | mission/chat, home | 60m | It makes the game HUD feel like a Tamagotchi or digicam, which is the 2016 × Y2K sweet spot. |
| 6 | **Mascot stage:** a glass podium disc replaces the flat shadow, plus 3 drifting bubbles (play only). | home, mission, K.O. | 30m | Frutiger Aero in one element; the mascot looks "displayed". |
| 7 | **Chat bubbles + input:** her bubble becomes aqua glass (`.y2k-bubble-her`). The Pip bubble gets a gloss band. The input becomes a glass pill with an aqua send orb. | mission/chat | 30m | The screen students stare at most. |
| 8 | **Studio low dose:** pill switches with a glass knob (filters, parent prefs), a gloss line on the primary, one LCD KPI on the owner page. | tutor, owner, parent prefs | 30m | Ties the brand together without toy-ifying staff screens. |
| 9 | **Quiz:** options become chrome gel pills; the result moves to an LCD panel ("2/3 · PIP PASSED"). The K.O. card back gets the cybercore duotone. | quiz, K.O. card | 45m | It makes the quiz feel like a handheld minigame. |
| 10 | **Audience plumbing:** set `data-audience` from grade (≤6 play, 7–9 cool, ≥10 focus) next to `data-register`. | shell | 30m | Unlocks items 11–12. Without it, ship the play dose only. |
| 11 | **Cool register:** the Pip bubble becomes the smoke window `pip.brain — v1`, with a night LCD HUD and scanlines over Club. | mission (13–15) | 45m | High style payoff, but only after #10. |
| 12 | **Focus register:** one LCD status bar plus a chrome goal badge; shrink the mascot. | SAT mission | 40m | A smaller audience for the demo. |
| 13 | **Parent:** aqua avatar ring only. | /parent | 10m | Cheap, but very low visual impact by design. |

**Recommended cut for the demo:** #1–#7 (about 4h of frontend), plus #8 if a staff agent has 30 minutes.

**Do not:**
- recolor coral (it stays boss/wrong-belief only);
- add pink;
- put OS logos or the XP wallpaper anywhere;
- use Pinterest images in the product;
- animate anything in Studio or parent screens.

## Guardrails honored
- Every product-facing recipe is a gradient, shadow or clip-path written from scratch. Pinterest captures and the moodboard are git-ignored.
- No brand logos or UI are copied (no Apple, Microsoft, MSN, Winamp, Subway Surfers or Talking Tom assets). Patterns are abstracted to shapes and stops.
- The palette is gender-neutral; pink and lilac stay out of the UI per DESIGN_SYSTEM, and magenta stays scene light only.
- Contrast is checked for every label pair (see the preview footer). Reduced motion stops the glints and bubbles.
