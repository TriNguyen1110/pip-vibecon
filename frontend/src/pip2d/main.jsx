import { Glint } from './y2k'

// Secret final form "Main Character": absurd over-confidence on a fuzzy face (the joke is the mismatch).

export function MainDefs({ id }) {
  return (
    <>
      <radialGradient id={`${id}backlight`} cx="0.5" cy="0.45" r="0.5">
        <stop offset="0" stopColor="#FFF6C8" stopOpacity="0.95" />
        <stop offset="0.55" stopColor="#FFD86B" stopOpacity="0.45" />
        <stop offset="1" stopColor="#FFD86B" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${id}gold`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset="0.5" stopColor="#FFE07A" />
        <stop offset="1" stopColor="#FFB84D" />
      </linearGradient>
      <linearGradient id={`${id}mcShade`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#3A2A6E" />
        <stop offset="1" stopColor="#B0306E" />
      </linearGradient>
    </>
  )
}

// dramatic backlight behind the character
export function Backlight({ id }) {
  return <ellipse cx="100" cy="112" rx="104" ry="100" fill={`url(#${id}backlight)`} />
}

// wind-blown fur tufts streaming off to one side of the head
export function WindTufts({ A, t }) {
  const { cx, top, w } = A.head
  const x = cx + w / 2 - 10
  const ys = [top + 16, top + 34, top + 54]
  return (
    <g>
      {ys.map((y, i) => {
        const d = `M${x - 6},${y + 6} C${x + 14},${y - 4} ${x + 30 + i * 6},${y + 2} ${x + 44 + i * 8},${y - 8 + i * 4}`
        return (
          <g key={i}>
            <path d={d} fill="none" stroke={t.ink} strokeWidth={12 - i * 2} strokeLinecap="round" />
            <path d={d} fill="none" stroke={t.body} strokeWidth={6 - i} strokeLinecap="round" />
          </g>
        )
      })}
    </g>
  )
}

// the chiseled jaw + cheekbones drawn onto the fuzzy face, plus a chin cleft
export function Jawline({ A, t }) {
  const [L, R] = A.eyes
  const { x: mx, y: my } = A.mouth
  const s = A.mouth.s ?? 1
  const jx = 18 * s
  const d = `M${L.cx - L.rx * 1.7},${my - 14} L${mx - jx},${my + 18} L${mx + jx},${my + 18} L${R.cx + R.rx * 1.7},${my - 14}`
  return (
    <g fill="none" stroke={t.ink} strokeLinecap="round" strokeLinejoin="miter">
      <path d={d} strokeWidth="3.2" opacity="0.55" />
      <path d={`M${L.cx - L.rx * 0.9},${L.cy + L.ry + 6} L${L.cx + L.rx * 0.4},${L.cy + L.ry + 13}`} strokeWidth="2.6" opacity="0.45" />
      <path d={`M${R.cx + R.rx * 0.9},${R.cy + R.ry + 6} L${R.cx - R.rx * 0.4},${R.cy + R.ry + 13}`} strokeWidth="2.6" opacity="0.45" />
      <path d={`M${mx},${my + 12} L${mx},${my + 17}`} strokeWidth="2.4" opacity="0.6" />
    </g>
  )
}

// slightly-too-cool tinted shades pushed down the nose (eyes peek over the top)
export function LowShades({ A, t, id }) {
  const [L, R] = A.eyes
  const y = Math.max(L.cy, R.cy) + Math.max(L.ry, R.ry) * 0.45
  const h = Math.max(L.ry, R.ry) * 0.85
  const lens = (e) => `M${e.cx - e.rx - 6},${y - h * 0.45} L${e.cx + e.rx + 6},${y - h * 0.45} Q${e.cx + e.rx + 4},${y + h * 0.65} ${e.cx},${y + h * 0.6} Q${e.cx - e.rx - 4},${y + h * 0.65} ${e.cx - e.rx - 6},${y - h * 0.45} Z`
  return (
    <g>
      <path d={`M${L.cx + L.rx + 6},${y - h * 0.4} Q100,${y - h * 0.65} ${R.cx - R.rx - 6},${y - h * 0.4}`} fill="none" stroke={t.ink} strokeWidth="3.2" strokeLinecap="round" />
      {[L, R].map((e, i) => (
        <g key={i}>
          <path d={lens(e)} fill={`url(#${id}mcShade)`} opacity="0.92" stroke={t.ink} strokeWidth="3" strokeLinejoin="round" />
          <path d={`M${e.cx - e.rx + 2},${y - h * 0.15} L${e.cx - 2},${y - h * 0.3}`} stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity="0.8" />
        </g>
      ))}
    </g>
  )
}

// permanent slow sparkle
export function SlowSparkle({ A }) {
  const { cx, top, w } = A.head
  return (
    <g>
      {[
        [cx - w * 0.55, top + 20, 7],
        [cx + w * 0.62, top - 6, 9],
        [cx - w * 0.3, top - 22, 5],
      ].map(([x, y, r], i) => (
        <Glint key={i} className={`pip2d-twinkle pip2d-slow pip2d-twinkle-${i}`} x={x} y={y} r={r} fill={i === 1 ? '#FFE27A' : '#FFFFFF'} />
      ))}
    </g>
  )
}
