// Scene catalog + picker. Plain data so it can be imported anywhere (no React).
//
// Placement: `spots` are fractions of the 390 x 560 "core" box (x = centre, y = feet line), which
// <Scene2D> exposes as the absolutely-positioned `.scn-core` layer that wraps its children.
// `pipSize` / `bossSize` are suggested widths as a fraction of the core width.

export const SCENES = [
  {
    id: 'skatepark',
    name: 'Golden Hour Skatepark',
    fits: { assignments: ['a_tri'], mission: 'Triangle area (Duke Doublecount)', dream: null },
    spots: { pip: { x: 0.25, y: 0.9 }, boss: { x: 0.745, y: 0.6 } },
    pipSize: 0.38,
    bossSize: 0.4,
  },
  {
    id: 'boba',
    name: 'Bubble Tea Counter',
    fits: { assignments: ['a_frac'], mission: 'Fractions (Top-Top Bottom-Bottom)', dream: null },
    spots: { pip: { x: 0.27, y: 0.9 }, boss: { x: 0.72, y: 0.9 } },
    pipSize: 0.38,
    bossSize: 0.44,
  },
  {
    id: 'arcade',
    name: 'Neon Arcade',
    fits: { assignments: ['a_sat_linear'], mission: 'SAT linear equations (Hop-Hop Hamster)', dream: null },
    spots: { pip: { x: 0.27, y: 0.9 }, boss: { x: 0.72, y: 0.9 } },
    pipSize: 0.38,
    bossSize: 0.44,
  },
  {
    id: 'rooftop',
    name: 'City Rooftop Stage',
    fits: { assignments: [], mission: 'Fame finale, landing hero, fallback', dream: 'fame' },
    spots: { pip: { x: 0.3, y: 0.89 }, boss: { x: 0.7, y: 0.89 } },
    pipSize: 0.4,
    bossSize: 0.42,
  },
  {
    id: 'photobooth',
    name: 'Sticker Photo Booth',
    fits: { assignments: [], mission: 'Lookbook cover shoot after a K.O.', dream: null },
    spots: { pip: { x: 0.5, y: 0.86 }, boss: { x: 0.74, y: 0.86 } },
    pipSize: 0.5,
    bossSize: 0.38,
  },
  {
    id: 'studio',
    name: 'On-Air Studio',
    fits: { assignments: ['a_sat_commas'], mission: 'SAT commas: pauses and timing (Pause-Pause Penguin)', dream: 'creator' },
    spots: { pip: { x: 0.28, y: 0.9 }, boss: { x: 0.72, y: 0.9 } },
    pipSize: 0.38,
    bossSize: 0.42,
  },
]

export const SCENE_IDS = SCENES.map((s) => s.id)
export const SCENE_BY_ID = Object.fromEntries(SCENES.map((s) => [s.id, s]))

const BY_ASSIGNMENT = {
  a_tri: 'skatepark',
  a_frac: 'boba',
  a_sat_commas: 'studio',
  a_sat_linear: 'arcade',
}

// sceneFor({ assignmentId, dream, stage, scene })
// - `scene`: an explicit scene from the assignment (CONTRACT v3.12) wins when it is a known id.
// - stage: 'cover' | 'cover_shoot' | 'photobooth' -> photobooth; 'finale' | 'fame_finale' | 'landing' | 'hero' -> rooftop.
// - dream === 'fame' with stage 'finale' -> rooftop.
// - otherwise the assignment's topic stage; fallback rooftop.
export function sceneFor({ assignmentId, dream, stage, scene } = {}) {
  if (scene && SCENE_BY_ID[scene]) return scene
  const st = String(stage ?? '').toLowerCase()
  if (/cover|photo|lookbook/.test(st)) return 'photobooth'
  if (/finale|landing|hero/.test(st) || (dream === 'fame' && /final|ko|payoff/.test(st))) return 'rooftop'
  const id = String(assignmentId ?? '').toLowerCase()
  if (BY_ASSIGNMENT[id]) return BY_ASSIGNMENT[id]
  if (/tri/.test(id)) return 'skatepark'
  if (/frac/.test(id)) return 'boba'
  if (/comma|punct/.test(id)) return 'studio'
  if (/linear|equation|algebra/.test(id)) return 'arcade'
  return 'rooftop'
}

// Cheap static fallback: one CSS background per scene/theme (shown instantly, and under the SVG).
const FALLBACK = {
  skatepark: {
    day: 'linear-gradient(180deg, #86A6F2 0%, #C9A6E8 30%, #FFB38A 52%, #FFD98A 62%, #EBC29C 64%, #D9A27E 100%)',
    night: 'linear-gradient(180deg, #0D0A24 0%, #22164A 35%, #4A2A6E 58%, #2B2452 64%, #1A1538 100%)',
  },
  boba: {
    day: 'linear-gradient(180deg, #FFF1DE 0%, #FFE2C4 45%, #9FE3D2 66%, #F6E7D2 80%, #EAD3B8 100%)',
    night: 'linear-gradient(180deg, #1B1233 0%, #2A1B4A 45%, #1E5A5E 66%, #2B2142 80%, #1B1530 100%)',
  },
  arcade: {
    day: 'linear-gradient(180deg, #3B2E7A 0%, #5A3FA0 40%, #2A2266 70%, #3A2A78 100%)',
    night: 'linear-gradient(180deg, #07040F 0%, #140A26 45%, #1C1040 70%, #120A2A 100%)',
  },
  rooftop: {
    day: 'linear-gradient(180deg, #4B3C9A 0%, #B85C9E 30%, #FF8A6B 50%, #FFC36B 60%, #6A5A8C 70%, #3E3560 100%)',
    night: 'linear-gradient(180deg, #07040F 0%, #140A26 40%, #2A1A52 60%, #1C1233 72%, #120B22 100%)',
  },
  photobooth: {
    day: 'linear-gradient(180deg, #E9F8FF 0%, #F1E6FF 40%, #FFF3D6 70%, #E6E9EF 100%)',
    night: 'linear-gradient(180deg, #120A26 0%, #24144A 45%, #1C1233 75%, #0E0820 100%)',
  },
  studio: {
    day: 'linear-gradient(180deg, #E8E2F4 0%, #CFC6E6 50%, #8E7BB8 75%, #6E5E96 100%)',
    night: 'linear-gradient(180deg, #120B22 0%, #1E1438 50%, #2A1E4A 75%, #160E2A 100%)',
  },
}

export function sceneFallback(scene = 'rooftop', theme = 'day') {
  const f = FALLBACK[scene] ?? FALLBACK.rooftop
  return f[theme === 'night' ? 'night' : 'day']
}
