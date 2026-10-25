// Play palettes (CONTRACT v3.2, DESIGN_SYSTEM v2): Daylight Arcade (default) and Night Arcade.
// First visit follows prefers-color-scheme (live) until she taps the toggle; her choice wins after that.
import { useEffect, useState } from 'react'

const KEY = 'pip.theme'
const META_STUDIO = '#0C0A18'
const META = { day: '#EEF0F4', night: '#07040F' }
const META_ARCADE = { day: '#BFE6FF', night: '#0E1530' }

function saved() {
  try {
    const t = localStorage.getItem(KEY)
    if (t === 'day' || t === 'night') return t
  } catch {
    /* storage unavailable */
  }
  return null
}
function osTheme() {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day'
  } catch {
    return 'day'
  }
}

let current = typeof window === 'undefined' ? 'day' : (saved() ?? osTheme())
const subs = new Set()
const emit = () => subs.forEach((f) => f(current))

if (typeof window !== 'undefined') {
  // The phone frame (desktop) and the app inside it share the choice across documents.
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return
    current = saved() ?? osTheme()
    emit()
  })
  try {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (saved()) return
      current = osTheme()
      emit()
    })
  } catch {
    /* old browsers */
  }
}

export function initialTheme() {
  return current
}

export function setTheme(t) {
  current = t === 'night' ? 'night' : 'day'
  try {
    localStorage.setItem(KEY, current)
  } catch {
    /* the choice lasts for this visit */
  }
  emit()
}

// Browser chrome color: Play follows the theme, Studio restores the forest.
export function setMetaColor(play, t = current) {
  try {
    const m = skin === 'arcade' ? META_ARCADE : META
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', play ? m[t] : META_STUDIO)
  } catch {
    /* fine */
  }
}

export function usePlayTheme() {
  const [t, setT] = useState(current)
  useEffect(() => {
    subs.add(setT)
    setT(current)
    return () => {
      subs.delete(setT)
    }
  }, [])
  return [t, () => setTheme(t === 'night' ? 'day' : 'night')]
}

// Play skin (G4/G5): "runway" = Runway by day, Club by night (default); "arcade" = the Daylight/Night Arcade
// presets. Day/night stays its own toggle; the skin is a preset in the Look sheet. Remembered per device.
const SKIN_KEY = 'pip.skin'
export const SKINS = [
  { id: 'runway', label: 'Runway & Club' },
  { id: 'arcade', label: 'Arcade' },
]
let skin = (() => {
  try {
    const v = localStorage.getItem(SKIN_KEY)
    return v === 'arcade' || v === 'runway' ? v : 'runway'
  } catch {
    return 'runway'
  }
})()
const skinSubs = new Set()
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== SKIN_KEY) return
    skin = e.newValue === 'arcade' ? 'arcade' : 'runway'
    skinSubs.forEach((f) => f(skin))
  })
}
export function setSkin(v) {
  skin = v === 'arcade' ? 'arcade' : 'runway'
  try {
    localStorage.setItem(SKIN_KEY, skin)
  } catch {
    /* this visit only */
  }
  skinSubs.forEach((f) => f(skin))
}
export function usePlaySkin() {
  const [v, setV] = useState(skin)
  useEffect(() => {
    skinSubs.add(setV)
    setV(skin)
    return () => {
      skinSubs.delete(setV)
    }
  }, [])
  return [v, setSkin]
}

// Audiences (DESIGN_SYSTEM v3.14): the student register. play (grade <= 6), cool (7-9), focus (>= 10, SAT).
// Defaults from the student's grade; the student can switch it in the Look sheet (remembered per device).
// It changes palette intensity, mascot size, copy tone and density only, never features.
const AUD_KEY = 'pip.audience'
export const AUDIENCES = [
  { id: 'play', label: 'Play' },
  { id: 'cool', label: 'Cool' },
  { id: 'focus', label: 'Focus' },
]
// Owner direction (secondary, not elementary): every student defaults to cool; focus for SAT (grade >= 10 or a
// SAT mission). play exists only when a student picks it (Mode) - soft looks come from the vibe picker.
export const audienceForGrade = (g, sat) => (sat || (g != null && g >= 10) ? 'focus' : 'cool')
let audOverride = (() => {
  try {
    const v = localStorage.getItem(AUD_KEY)
    return AUDIENCES.some((a) => a.id === v) ? v : null
  } catch {
    return null
  }
})()
const audSubs = new Set()
export function setAudience(v) {
  audOverride = AUDIENCES.some((a) => a.id === v) ? v : null
  try {
    if (audOverride) localStorage.setItem(AUD_KEY, audOverride)
    else localStorage.removeItem(AUD_KEY)
  } catch {
    /* this visit only */
  }
  audSubs.forEach((f) => f(audOverride))
}
let lastGrade = null
let lastSat = false
export function noteGrade(g, sat) {
  lastGrade = g ?? lastGrade
  if (sat !== undefined) lastSat = !!sat
  audSubs.forEach((f) => f(audOverride))
}
export function useAudience(grade, sat) {
  const [o, setO] = useState(audOverride)
  const [, bump] = useState(0)
  useEffect(() => {
    const f = (v) => {
      setO(v)
      bump((n) => n + 1)
    }
    audSubs.add(f)
    return () => {
      audSubs.delete(f)
    }
  }, [])
  return [o ?? audienceForGrade(grade ?? lastGrade, sat ?? lastSat), setAudience]
}

// Copy tone per register (short labels only; features are the same).
const COPY = {
  play: { quiz: 'Quiz Pip ▶', retry: 'Let Pip retry ▶', keep: 'Keep teaching', placeholder: 'Explain it to Pip…' },
  cool: { quiz: 'Quiz Pip', retry: 'Let Pip retry', keep: 'keep teaching', placeholder: 'explain it to pip…' },
  focus: { quiz: 'Check Pip ▶', retry: 'Recheck Pip ▶', keep: 'Keep explaining', placeholder: 'Explain the idea to Pip…' },
}
export const copyFor = (aud, key) => (COPY[aud] ?? COPY.play)[key] ?? COPY.play[key]

// A student's chosen theme (v3.8 tokens, set by the v3.14 vibe grid or Mods): applied as CSS variables on the
// Play shell, over the skin/day-night tokens. Semantic slots (boss, progress, win) come from the server already
// checked for contrast and role rules. Remembered per device; the server keeps the source of truth.
const ST_KEY = 'pip.studentTheme'
let studentTheme = (() => {
  try {
    const t = JSON.parse(localStorage.getItem(ST_KEY) || 'null')
    return t && t.tokens ? t : null
  } catch {
    return null
  }
})()
const stSubs = new Set()
export function setStudentTheme(t) {
  studentTheme = t && t.tokens ? t : null
  try {
    if (studentTheme) localStorage.setItem(ST_KEY, JSON.stringify(studentTheme))
    else localStorage.removeItem(ST_KEY)
  } catch {
    /* this visit only */
  }
  stSubs.forEach((f) => f(studentTheme))
}
export function useStudentTheme() {
  const [t, setT] = useState(studentTheme)
  useEffect(() => {
    stSubs.add(setT)
    setT(studentTheme)
    return () => {
      stSubs.delete(setT)
    }
  }, [])
  return [t, setStudentTheme]
}
export function themeVars(theme) {
  const k = theme?.tokens
  if (!k) return undefined
  const grad = (a, b) => `linear-gradient(180deg, ${a} 0%, ${b} 100%)`
  return {
    colorScheme: theme.base === 'night' ? 'dark' : 'light',
    '--sky': grad(k.bg_from, k.bg_to),
    '--ink': k.bg_to,
    '--surface': k.panel,
    '--surface-2': k.panel,
    '--surface-3': k.panel,
    '--overlay': k.panel,
    '--panel-fill': k.panel,
    '--panel-outline': k.panel_edge,
    '--outline': k.panel_edge,
    '--field-bg': k.panel,
    '--field-border': k.panel_edge,
    '--fg': k.ink,
    '--fg-muted': k.ink_muted,
    '--fg-subtle': k.ink_muted,
    '--ice': k.action,
    '--ice-ink': k.action_ink,
    '--link': k.action,
    '--focus': k.action,
    '--gel-primary': grad(k.action, k.action),
    '--gel-primary-ink': k.action_ink,
    '--gel-secondary': grad(k.panel, k.panel),
    '--gel-secondary-ink': k.ink,
    '--mint': k.progress,
    '--mint-fill': k.progress,
    '--sun': k.win,
    '--sun-fill': k.win,
    '--coral': k.boss,
    '--coral-fill': k.boss,
    '--bubble-fill': k.bubble_pip,
    '--her-bubble': k.bubble_her,
    '--bubble-ink': k.ink,
  }
}
