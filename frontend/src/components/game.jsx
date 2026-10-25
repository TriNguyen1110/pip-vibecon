import { useCallback, useEffect, useRef, useState } from 'react'
import Mascot from './Mascot.jsx'
import { useMouth, useViseme, useVoice } from '../voice'
import { usePlayTheme } from '../theme'

// Play-register building blocks for one-screen game layouts (F3). Styling lives in classes
// (student.css "Game layout") so the G2 game skin can restyle them without touching markup.

// Round gel icon buttons along the screen edges (DESIGN_SYSTEM v2: class="gel-btn icon-btn").
// `caption` adds the small label under the button (home screen bottom row).
export function IconButton({ label, children, className = '', pressed, caption, ...rest }) {
  const btn = (
    <button
      type="button"
      className={`gel-btn gel-btn--secondary icon-btn ${className}`}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      {...rest}
    >
      <span aria-hidden>{children}</span>
    </button>
  )
  if (!caption) return btn
  return (
    <span className="icon-btn__wrap">
      {btn}
      <span className="icon-btn__label" aria-hidden>
        {caption}
      </span>
    </span>
  )
}

export function ThemeButton() {
  const [t, toggle] = usePlayTheme()
  return (
    <IconButton label="Night mode" pressed={t === 'night'} onClick={toggle} className="icon-btn--theme">
      {t === 'night' ? '🌙' : '☀️'}
    </IconButton>
  )
}

export function MuteButton() {
  const v = useVoice()
  if (!v.supported) return null
  return (
    <IconButton
      label={v.muted ? 'Turn Pip’s voice on' : 'Mute Pip’s voice'}
      className={`icon-btn--mute${v.muted ? ' is-muted' : ''}${v.speaking ? ' is-speaking' : ''}`}
      onClick={v.toggle}
      pressed={v.muted}
    >
      {v.muted ? '🔇' : '🔊'}
    </IconButton>
  )
}

// Height of an element, kept in sync with its box (the 3D stage needs a number). Returns a
// callback ref, so it also works for elements that mount later (K.O. beats, exam pages).
export function useBoxHeight(min = 120) {
  const [h, setH] = useState(0)
  const ro = useRef(null)
  const ref = useCallback(
    (el) => {
      ro.current?.disconnect()
      ro.current = null
      if (!el) return
      const read = () => setH(Math.max(min, Math.floor(el.clientHeight)))
      read()
      if (typeof ResizeObserver === 'undefined') return
      ro.current = new ResizeObserver(read)
      ro.current.observe(el)
    },
    [min],
  )
  // No effect cleanup here: React calls the ref with null on unmount, which disconnects. (An effect
  // cleanup would also run in StrictMode's dev re-mount and leave the observer detached.)
  return [ref, h]
}

// The 3D Pip with its mouth driven by the voice. Only this component re-renders while Pip talks.
export function TalkingMascot(props) {
  const mouth = useMouth()
  const viseme = useViseme()
  const [theme] = usePlayTheme()
  return <Mascot {...props} mouth={mouth} viseme={viseme ?? undefined} theme={theme} framing={props.framing ?? 'hero'} />
}

// Any non-talking Play stage (picker preview) still follows the day/night scene.
export function ThemedMascot(props) {
  const [theme] = usePlayTheme()
  return <Mascot {...props} theme={theme} />
}

// Horizontal pages that swipe (scroll-snap) with prev/next buttons and dots.
export function usePager(count) {
  const ref = useRef(null)
  const [i, setI] = useState(0)
  const onScroll = useCallback(() => {
    const el = ref.current
    if (!el) return
    const mid = el.scrollLeft + el.clientWidth / 2
    let best = 0
    let bestD = Infinity
    ;[...el.children].forEach((c, k) => {
      const d = Math.abs(c.offsetLeft + c.clientWidth / 2 - mid)
      if (d < bestD) {
        bestD = d
        best = k
      }
    })
    setI(best)
  }, [])
  const go = useCallback((k, instant) => {
    const el = ref.current
    const c = el?.children[k]
    if (!c) return
    el.scrollTo({ left: c.offsetLeft - (el.clientWidth - c.clientWidth) / 2, behavior: instant ? 'auto' : 'smooth' })
    setI(k)
  }, [])
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [onScroll, count])
  return { ref, i: Math.min(i, Math.max(0, count - 1)), go, n: count }
}

export function PagerControls({ pager, label = 'page', className = '' }) {
  const { i, n, go } = pager
  if (n < 2) return null
  return (
    <div className={`pager-ctl ${className}`}>
      <IconButton label={`Previous ${label}`} className="icon-btn--sm" onClick={() => go(i - 1)} disabled={i === 0}>
        ‹
      </IconButton>
      <span className="pager-ctl__dots" aria-label={`${label} ${i + 1} of ${n}`} role="status">
        {Array.from({ length: n }, (_, k) => (
          <i key={k} className={k === i ? 'is-on' : ''} />
        ))}
      </span>
      <IconButton label={`Next ${label}`} className="icon-btn--sm" onClick={() => go(i + 1)} disabled={i >= n - 1}>
        ›
      </IconButton>
    </div>
  )
}

// History drawer: a bottom sheet on phones (scrolls inside), a column or side sheet on laptops.
// Always mounted so captions and messages stay in the document; inert while closed.
export function Drawer({ open, onClose, label, column, children, footer, className = '' }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open || column) el.removeAttribute('inert')
    else el.setAttribute('inert', '')
  }, [open, column])
  useEffect(() => {
    if (!open || column) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, column, onClose])
  return (
    <>
      {!column && open && <div className="drawer-scrim" onClick={onClose} aria-hidden />}
      <aside
        ref={ref}
        className={`drawer ${className}${column ? ' drawer--column' : ''}${open ? ' is-open' : ''}`}
        aria-label={label}
        aria-hidden={!open && !column}
      >
        {!column && (
          <header className="drawer__head">
            <span className="drawer__grip" aria-hidden />
            <p className="drawer__title">{label}</p>
            <IconButton label={`Close ${label.toLowerCase()}`} className="icon-btn--sm" onClick={onClose}>
              ✕
            </IconButton>
          </header>
        )}
        <div className="drawer__body">{children}</div>
        {footer}
      </aside>
    </>
  )
}
