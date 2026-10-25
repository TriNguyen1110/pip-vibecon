import { createContext, useContext } from 'react'
import { furPath, pathToPoints } from './fuzz'

// finish: 'plush' (soft fuzzy) or 'vinyl' (designer art-toy: tight fur edge, matte key light, thinner line)
export const FinishCtx = createContext('plush')
export const useVinyl = () => useContext(FinishCtx) === 'vinyl'

// Shared soft, hand-inked drawing helpers for Pip2D creatures.

export function mix(a, b, t) {
  const pa = parseInt(a.slice(1), 16)
  const pb = parseInt(b.slice(1), 16)
  const ch = (p, s) => (p >> s) & 255
  const c = (s) => Math.round(ch(pa, s) + (ch(pb, s) - ch(pa, s)) * t)
  return `#${((1 << 24) | (c(16) << 16) | (c(8) << 8) | c(0)).toString(16).slice(1)}`
}

// A plush shape: soft radial shading (light upper-left -> shade at the rim) and a lighter hand-made double ink line.
// fur = { key, seed, amp, spacing, zone } rebuilds the outline from small irregular tufts (mammals).
export function Shape({ d, pts, fur, fill, shade, ink, uid, shadow = true, w = 3.2 }) {
  const vinyl = useVinyl()
  const f = fur && vinyl ? { ...fur, key: `${fur.key}-v`, amp: (fur.amp ?? 3) * 0.28, tuftChance: 0 } : fur
  const path = f ? furPath(f.key, pts ?? pathToPoints(d), f) : d
  return (
    <g>
      {shadow && shade ? (
        <>
          {vinyl ? (
            // matte vinyl: one soft key light from the upper left, falling off to the shade
            <linearGradient id={`${uid}g`} x1="0.15" y1="0" x2="0.85" y2="1">
              <stop offset="0" stopColor={mix(fill, '#ffffff', 0.1)} />
              <stop offset="0.5" stopColor={fill} />
              <stop offset="1" stopColor={shade} />
            </linearGradient>
          ) : (
            <radialGradient id={`${uid}g`} cx="0.36" cy="0.3" r="0.82">
              <stop offset="0" stopColor={mix(fill, '#ffffff', 0.16)} />
              <stop offset="0.55" stopColor={fill} />
              <stop offset="1" stopColor={shade} />
            </radialGradient>
          )}
          <path d={path} fill={`url(#${uid}g)`} />
        </>
      ) : (
        <path d={path} fill={fill} />
      )}
      <Outline d={path} ink={ink} w={w} />
    </g>
  )
}

// Two slightly offset strokes so the line weight wobbles (~3-3.8px): hand-made, not vector-perfect.
export function Outline({ d, ink, w: w0 = 3.2 }) {
  const w = useVinyl() ? w0 * 0.72 : w0
  return (
    <>
      <path d={d} fill="none" stroke={ink} strokeWidth={w} strokeLinejoin="round" strokeLinecap="round" />
      <path d={d} fill="none" stroke={ink} strokeWidth={Math.max(1.4, w - 1.1)} strokeLinejoin="round" strokeLinecap="round" transform="translate(0.8 1)" />
    </>
  )
}

// Soft plush highlight (blurred white blob), uses the SVG's shared `${id}soft` filter.
export function Plush({ id, cx, cy, rx, ry, rot = -30, o = 0.5 }) {
  if (useVinyl()) return <ellipse cx={cx} cy={cy} rx={rx * 0.8} ry={ry * 0.5} transform={`rotate(${rot} ${cx} ${cy})`} fill="#fff" opacity={0.18} filter={`url(#${id}soft)`} />
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} transform={`rotate(${rot} ${cx} ${cy})`} fill="#fff" opacity={o} filter={`url(#${id}soft)`} />
}

// Legacy hard sliver (kept for the bean).
export function Sliver({ d, w = 5.5 }) {
  return <path d={d} fill="none" stroke="#fff" strokeWidth={w} strokeLinecap="round" opacity="0.6" />
}

// A small group of three short curved hair strokes (fur texture).
export function Hair({ x, y, rot = 0, s = 1, color }) {
  if (useVinyl()) return null
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round">
      <path d="M-5,4 Q-6,-1 -3,-6" />
      <path d="M0,5 Q-1,-1 2,-7" />
      <path d="M5,4 Q4,0 7,-4" />
    </g>
  )
}

// A thick inked stroke-shape (tails, gill fronds). fluffy = scalloped fur edge around it.
export function InkStroke({ d, color, ink, w = 10, fluffy: f = false }) {
  const vinyl = useVinyl()
  const fluffy = f && !vinyl
  if (fluffy) {
    return (
      <>
        <path d={d} fill="none" stroke={ink} strokeWidth={w + 14} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="0.1 6.5" />
        <path d={d} fill="none" stroke={color} strokeWidth={w + 8.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="0.1 6.5" />
        <path d={d} fill="none" stroke={color} strokeWidth={w + 6} strokeLinecap="round" strokeLinejoin="round" />
      </>
    )
  }
  return (
    <>
      <path d={d} fill="none" stroke={ink} strokeWidth={w + 6} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
    </>
  )
}

// Rounded rectangle path.
export function rrect(x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2)
  return `M${x + rr},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h - rr} Q${x + w},${y + h} ${x + w - rr},${y + h} H${x + rr} Q${x},${y + h} ${x},${y + h - rr} V${y + rr} Q${x},${y} ${x + rr},${y} Z`
}

// Ellipse path (A arcs; use ellipsePoints() from fuzz.js when it needs a fur edge).
export function ell(cx, cy, rx, ry) {
  return `M${cx - rx},${cy} A${rx},${ry} 0 1,0 ${cx + rx},${cy} A${rx},${ry} 0 1,0 ${cx - rx},${cy} Z`
}
