# Pip design tokens (frontend)

Source of truth for visuals: `../DESIGN_SYSTEM.md`. This file records what the code implements.
Tokens live in `src/styles/tokens.css`; components never hardcode a color that a token covers.

## Identity (from willder)
- Ground forest `--ink #001914`; surfaces `--surface #0A2721`, `--surface-2 #12372E`, `--surface-3 #1A4639`, `--overlay #10372E`.
- Text roles only, never alpha steps: `--fg #EFEFE9`, `--fg-muted #D4D4CD`, `--fg-subtle #A8B8AE`.
- One action color: ice `--ice #C9FCFC` on `--ice-ink #001914`. Sunset `--sunset #F59B76` is a Studio accent (Misconception pill).
- Type: Fraunces (display, SOFT 0 / weight 500 in Studio, SOFT 100 / weight 700 in Play), Manrope (UI), Geist Mono (numbers, IDs, HP, dates). Loaded from Google Fonts in `index.html`.
- Glass cards (`.glass`): blur 10px, hairline `--glass-edge`, one shadow tier. Backdrop: icy ribbon with a sunset edge plus 9% grain.

## Two registers
`Shell` sets `data-register="studio"` (landing, tutor, owner, pricing) or `"play"` (student screens, `game` prop).
- Studio: calm, divided rows, 12/16px radii, no glows, no coral, the boss is a neutral chip.
- Play: pill buttons with a 4px pressed edge and gloss, 20/28px radii, state glows, short game motion, chrome/holo stickers, star glints only on unlock/fix/version-up.

## Play state colors (never on Studio screens)
- `--mint #8FE3B0`: her progress (meters, taught steps, fixed rules, quiz passes).
- `--sun #FFD27A`: her wins (equipped weapon, unlock sparkle, highlighter behind her quoted words).
- `--coral #FF8A7A`: the boss and Pip's wrong beliefs only (HP fill, damage floaters, wrong-rule glow, missed-row edge). Never on her bubble, composer or name; no red ✗ anywhere.
- Paper notes: `--note #FBF3D9` / `--note-ink #1C241F`, labels in `--coral-ink #9E3427` and `--mint-ink #1F6B45`.
- K.O. card: `--ko-bg #14161F`, `--ko-meta #9BA09C`, one metallic hairline (`--ko-sheen`).

## Motion
`--instant 100ms` press, `--fast 160ms`, `--med 240ms`, `--slow 420ms`; `--ease-out`, `--ease-pop` (Play only).
Hit: 70ms hit-stop, 280ms ±8px shake, 240ms squash, coral floater rises 28px over 700ms, HP fill drops instantly and a white ghost drains after 150ms over 450ms.
The K.O. stage is the only screen shake. `prefers-reduced-motion` removes shake, bob, float, flip, sweep and glints.

## Layout
Mobile-first at 390px: 16px gutter (24px from 768), 44px minimum tap targets, composer pinned to the bottom with safe-area padding, sticky boss HUD under the top bar. Mission splits 5fr/7fr at 1024px.
