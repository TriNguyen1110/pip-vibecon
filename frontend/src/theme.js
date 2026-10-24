// Play palettes (CONTRACT v3.2, DESIGN_SYSTEM v2): Daylight Arcade (default) and Night Arcade.
// First visit follows prefers-color-scheme (live) until she taps the toggle; her choice wins after that.
import { useEffect, useState } from 'react'

const KEY = 'pip.theme'
const META_STUDIO = '#001914'
const META = { day: '#BFE6FF', night: '#0E1530' }

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
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', play ? META[t] : META_STUDIO)
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
