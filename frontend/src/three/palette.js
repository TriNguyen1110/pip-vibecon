// Shared palette. UI: forest #001914, ivory, ice #C9FCFC, sunset #F59B76.
export const UI = {
  forest: '#001914',
  forestMid: '#0E3A31',
  ivory: '#FBF5EA',
  ice: '#C9FCFC',
  sunset: '#F59B76',
}

// Ink used for eyes, mouth lines and doodle outlines.
export const INK = '#1E1A22'

// Y2K colourways (DESIGN_SYSTEM.md): base + lighter belly/face patch (+ one accent). Default "Aqua / Cream".
export const Y2K = {
  bubblegum: '#FF8FC7',
  aqua: '#5FE3E8',
  lime: '#B8F04A',
  lilac: '#B9A2FF',
  tangerine: '#FF9A3C',
}
export const CREATURE_COLORS = {
  blob: { name: 'Aqua / Cream', body: Y2K.aqua, patch: '#C4F6F8', accent: Y2K.tangerine, detail: '#FFF6FB' },
  cat: { name: 'Tangerine / Cream', body: Y2K.tangerine, patch: '#FFD3AE', accent: Y2K.lilac, detail: '#FFF6FB' },
  dragon: { name: 'Lilac / Lime', body: Y2K.lilac, patch: '#E2D8FF', accent: Y2K.lime, detail: '#FFF6FB' },
  axolotl: { name: 'Bubblegum / Cream', body: Y2K.bubblegum, patch: '#FFD3E8', accent: '#FF5AA5', detail: '#FFF6FB' },
  frog: { name: 'Lime / Tangerine', body: Y2K.lime, patch: '#E4FAB8', accent: Y2K.tangerine, detail: '#FFF6FB' },
  bot: { name: 'Pearl / Aqua', body: '#F1F3F9', patch: '#0E2F28', accent: Y2K.aqua, detail: '#0E2F28' },
}

// Student palettes (CONTRACT v3.2): Daylight Arcade (default) and Night Arcade. Gender-neutral: sky, mint, navy,
// electric blue by day; navy/indigo dusk with cyan + lime neon by night.
export const THEMES = {
  day: {
    name: 'day',
    hemi: ['#FFFFFF', '#9DB6C6', 1.0],
    key: ['#FFF4E0', 2.1],
    rim: ['#A7DFE6', 1.4],
    room: {
      wall: '#BFE3F7',
      wainscot: '#8FD9C4',
      cap: '#FFFFFF',
      floor: '#E8CFA6',
      floorRim: '#D2B386',
      rug: '#2E4C86',
      rugInner: '#7FDCC0',
      bubbles: ['#2F6BFF', '#7FDCC0', '#5FE3E8'],
      frame: '#2F6BFF',
      stars: ['#FFC83D', '#2F6BFF', '#38C9A0', '#5FE3E8'],
      lamp: '#5FE3E8',
      point: '#FFE2B8',
      glow: 0,
    },
    arena: {
      side: '#1F3A68',
      top: '#D5DEE8',
      rim: '#2F6BFF',
      ring: '#2F6BFF',
      orbs: ['#2F6BFF', '#F59B76'],
      pillar: '#1F3A68',
      plinth: '#1F3A68',
      point: '#FFB59A',
      beams: false,
    },
    garden: { sky: 'linear-gradient(180deg, #9FDBFF 0%, #BDF5E2 100%)', bubble: '#FFFFFF', glow: false },
  },
  night: {
    name: 'night',
    hemi: ['#AFC2FF', '#141C3A', 0.75],
    key: ['#E8F0FF', 1.7],
    rim: ['#3DF5FF', 1.9],
    room: {
      wall: '#1E2A5A',
      wainscot: '#2B3577',
      cap: '#3DF5FF',
      floor: '#4E4060',
      floorRim: '#3A3050',
      rug: '#121A3C',
      rugInner: '#22306A',
      bubbles: ['#3DF5FF', '#B8F04A', '#3DF5FF'],
      frame: '#3DF5FF',
      stars: ['#B8F04A', '#3DF5FF', '#B8F04A', '#3DF5FF'],
      lamp: '#3DF5FF',
      point: '#7FE9FF',
      glow: 0.8,
    },
    arena: {
      side: '#121A38',
      top: '#1C2752',
      rim: '#3DF5FF',
      ring: '#3DF5FF',
      orbs: ['#3DF5FF', '#B8F04A'],
      pillar: '#121A38',
      plinth: '#0D1430',
      point: '#FF9C80',
      beams: true,
    },
    garden: { sky: 'linear-gradient(180deg, #0F1838 0%, #2A2F6E 100%)', bubble: '#B8F04A', glow: true },
  },
}
