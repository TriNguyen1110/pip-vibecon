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

// Y2K colourways (DESIGN_SYSTEM.md): base + lighter belly/face patch (+ one accent). Default "Lilac / Cream".
export const Y2K = {
  bubblegum: '#FF8FC7',
  aqua: '#5FE3E8',
  lime: '#B8F04A',
  lilac: '#B9A2FF',
  tangerine: '#FF9A3C',
}
export const CREATURE_COLORS = {
  blob: { name: 'Lilac / Cream', body: Y2K.lilac, patch: '#E2D8FF', accent: Y2K.bubblegum, detail: '#FFF6FB' },
  cat: { name: 'Tangerine / Cream', body: Y2K.tangerine, patch: '#FFD3AE', accent: Y2K.lilac, detail: '#FFF6FB' },
  dragon: { name: 'Aqua / Lilac', body: Y2K.aqua, patch: '#C4F6F8', accent: Y2K.lilac, detail: '#FFF6FB' },
  axolotl: { name: 'Bubblegum / Cream', body: Y2K.bubblegum, patch: '#FFD3E8', accent: '#FF5AA5', detail: '#FFF6FB' },
  frog: { name: 'Lime / Tangerine', body: Y2K.lime, patch: '#E4FAB8', accent: Y2K.tangerine, detail: '#FFF6FB' },
  bot: { name: 'Pearl / Aqua', body: '#F1F3F9', patch: '#0E2F28', accent: Y2K.aqua, detail: '#0E2F28' },
}
