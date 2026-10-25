import { useCallback, useEffect, useRef, useState } from 'react'

// Talking-Tom-style life for Pip2D (deadpan, no cutesy bounce). Transform/opacity only.
export const PIP_STATES = ['idle', 'listening', 'talking', 'thinking', 'react']
export const POKE_ZONES = ['head', 'belly', 'sprout']

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// idle life: random glance left/right (every 6-10 s) and a rare deadpan yawn or head tilt (every 20-40 s).
export function useIdleLife(enabled) {
  const [glance, setGlance] = useState(0)
  const [quirk, setQuirk] = useState(null) // 'yawn' | 'tilt'
  useEffect(() => {
    if (!enabled || reducedMotion()) return
    const timers = []
    const at = (ms, fn) => timers.push(setTimeout(fn, ms))
    const glanceLoop = () =>
      at(6000 + Math.random() * 4000, () => {
        setGlance(Math.random() < 0.5 ? -1 : 1)
        at(900, () => {
          setGlance(0)
          glanceLoop()
        })
      })
    const quirkLoop = () =>
      at(20000 + Math.random() * 20000, () => {
        setQuirk(Math.random() < 0.5 ? 'yawn' : 'tilt')
        at(1600, () => {
          setQuirk(null)
          quirkLoop()
        })
      })
    glanceLoop()
    quirkLoop()
    return () => timers.forEach(clearTimeout)
  }, [enabled])
  return { glance, quirk }
}

// Eyes follow the pointer / last touch slightly (no React re-render: writes a transform on the eyes group).
export function useEyeTracking(svgRef, eyesRef, enabled) {
  useEffect(() => {
    if (!enabled || reducedMotion()) return
    let raf = 0
    let target = [0, 0]
    let cur = [0, 0]
    const onMove = (e) => {
      const svg = svgRef.current
      if (!svg) return
      const r = svg.getBoundingClientRect()
      const nx = (e.clientX - (r.left + r.width / 2)) / Math.max(200, r.width)
      const ny = (e.clientY - (r.top + r.height * 0.45)) / Math.max(200, r.height)
      target = [Math.max(-1, Math.min(1, nx * 1.6)) * 3.2, Math.max(-1, Math.min(1, ny * 1.6)) * 2.2]
    }
    const loop = () => {
      raf = requestAnimationFrame(loop)
      cur = [cur[0] + (target[0] - cur[0]) * 0.15, cur[1] + (target[1] - cur[1]) * 0.15]
      if (eyesRef.current) eyesRef.current.style.transform = `translate(${cur[0].toFixed(2)}px, ${cur[1].toFixed(2)}px)`
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerdown', onMove)
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onMove)
    }
  }, [svgRef, eyesRef, enabled])
}

// Taps: head = squint + "hey", belly = squish, sprout = boing. Returns the active reaction zone.
export function usePokes(onPoke, forced) {
  const [zone, setZone] = useState(null)
  const timer = useRef(0)
  const poke = useCallback(
    (z) => (e) => {
      e?.stopPropagation?.()
      clearTimeout(timer.current)
      setZone(z)
      timer.current = setTimeout(() => setZone(null), z === 'head' ? 1100 : 700)
      onPoke?.(z)
    },
    [onPoke],
  )
  useEffect(() => () => clearTimeout(timer.current), [])
  return { zone: forced ?? zone, poke }
}

// Invisible tap targets placed from the creature anchors, always drawn as the top-most layer.
// sprout = [[x, y, r], ...] hit circles (stem/base + the actual tip for the current sprout pose).
export function PokeZones({ A, poke, lift = 0, sprout, bellyTransform }) {
  const hit = { fill: 'transparent', pointerEvents: 'all', style: { cursor: 'pointer' } }
  const { cx, top, w } = A.head
  const sp = sprout ?? [[A.sprout.x, A.sprout.y - 6, 20]]
  // keep the head zone above the neck so it never swallows the belly (matters for the one-blob frog)
  const hry = Math.min(w * 0.42, (A.neck.y + 4 - top) / 2)
  return (
    <g className="pip2d-zones">
      <g transform={bellyTransform}>
        <ellipse data-zone="belly" cx="100" cy={A.neck.y + 26} rx="52" ry="30" {...hit} onPointerDown={poke('belly')} />
      </g>
      <g transform={`translate(0 ${-lift})`}>
        <ellipse data-zone="head" cx={cx} cy={top + hry} rx={w / 2} ry={hry} {...hit} onPointerDown={poke('head')} />
        {sp.map(([x, y, r], i) => (
          <circle key={i} data-zone="sprout" cx={x} cy={y} r={r} {...hit} onPointerDown={poke('sprout')} />
        ))}
      </g>
    </g>
  )
}

// The dry "hey" speech bubble for a head poke.
export function HeyBubble({ A, ink }) {
  const x = A.head.cx + A.head.w * 0.34
  const y = A.head.top - 6
  return (
    <g className="pip2d-pop">
      <rect x={x} y={y - 18} width="42" height="24" rx="12" fill="#fff" stroke={ink} strokeWidth="2.6" />
      <path d={`M${x + 8},${y + 5} L${x + 4},${y + 14} L${x + 16},${y + 5} Z`} fill="#fff" stroke={ink} strokeWidth="2.6" strokeLinejoin="round" />
      <rect x={x + 6} y={y + 2} width="12" height="4" fill="#fff" />
      <text x={x + 21} y={y - 1} textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="13" fill={ink}>
        hey
      </text>
    </g>
  )
}

// listening: ears/gills perk up (two short dry "perk" ticks beside the head).
export function PerkMarks({ A, ink }) {
  const { cx, top, w } = A.head
  return (
    <g className="pip2d-pop" stroke={ink} strokeWidth="2.6" strokeLinecap="round" opacity="0.7">
      {[-1, 1].map((k) => (
        <g key={k}>
          <path d={`M${cx + k * (w / 2 + 6)},${top + 6} l${k * 7},-6`} />
          <path d={`M${cx + k * (w / 2 + 10)},${top + 18} l${k * 8},-1`} />
        </g>
      ))}
    </g>
  )
}

// ---- turnaround (P2D-16) ----
export const VIEWS = ['front', 'three-quarter', 'side', 'back']
// front -> 3/4 -> side -> back -> side -> 3/4 -> front; `flip` mirrors the return leg.
export const TURN_SEQUENCE = [
  { view: 'front', flip: false },
  { view: 'three-quarter', flip: false },
  { view: 'side', flip: false },
  { view: 'back', flip: false },
  { view: 'side', flip: true },
  { view: 'three-quarter', flip: true },
  { view: 'front', flip: false },
]

// Steps through TURN_SEQUENCE once each time `playKey` changes (~1.2 s total). Returns { view, flip, turning }.
export function useTurnaround(playKey, { stepMs = 170 } = {}) {
  const [i, setI] = useState(-1)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (reducedMotion()) return
    let k = 0
    setI(0)
    const id = setInterval(() => {
      k += 1
      if (k >= TURN_SEQUENCE.length) {
        clearInterval(id)
        setI(-1)
      } else setI(k)
    }, stepMs)
    return () => clearInterval(id)
  }, [playKey, stepMs])
  const step = i >= 0 ? TURN_SEQUENCE[i] : TURN_SEQUENCE[0]
  return { view: step.view, flip: step.flip, turning: i >= 0 }
}

// Squash for 140 ms whenever the view swaps (classic 2D turnaround feel).
export function useSwapSquash(view, flip) {
  const [on, setOn] = useState(false)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    setOn(true)
    const id = setTimeout(() => setOn(false), 140)
    return () => clearTimeout(id)
  }, [view, flip])
  return on
}
