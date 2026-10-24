// Shared drawing kit for Scene2D backdrops: the same hand-inked language as pip2d/shapes.jsx
// (coloured ink, a doubled, slightly offset line so the weight wobbles, flat fills, soft shading, gel shine).

export { rrect, ell, mix } from '../pip2d/shapes'

// A filled shape with a hand-made coloured ink line (two offset strokes, ~w..w+1px).
export function Ink({ d, fill = 'none', ink, w = 3, o, className, style, fillOpacity }) {
  return (
    <g opacity={o} className={className} style={style}>
      {fill !== 'none' && <path d={d} fill={fill} fillOpacity={fillOpacity} />}
      {ink && w > 0 && <path d={d} fill="none" stroke={ink} strokeWidth={w} strokeLinejoin="round" strokeLinecap="round" />}
      {ink && w >= 2.4 && (
        <path d={d} fill="none" stroke={ink} strokeWidth={Math.max(1.2, w - 1.3)} strokeLinejoin="round" strokeLinecap="round" transform="translate(0.7 0.9)" />
      )}
    </g>
  )
}

// A plain inked line (no fill).
export function Line({ d, ink, w = 2.5, o, dash, cap = 'round' }) {
  return <path d={d} fill="none" stroke={ink} strokeWidth={w} strokeLinecap={cap} strokeLinejoin="round" opacity={o} strokeDasharray={dash} />
}

// Y2K gel shine: a bright rounded streak plus a dot.
export function Gloss({ x, y, rx = 12, ry = 4, rot = -20, o = 0.85, dot = true }) {
  return (
    <g fill="#fff" opacity={o}>
      <ellipse cx={x} cy={y} rx={rx} ry={ry} transform={`rotate(${rot} ${x} ${y})`} />
      {dot && <circle cx={x + rx * 1.05} cy={y + ry * 1.5} r={Math.max(1.4, ry * 0.5)} />}
    </g>
  )
}

// Vertical (default) or angled linear gradient. stops: [[offset, color, opacity?], ...]
export function Lg({ id, stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1, units, gt }) {
  return (
    <linearGradient id={id} x1={x1} y1={y1} x2={x2} y2={y2} gradientUnits={units} gradientTransform={gt}>
      {stops.map(([o, c, a], i) => <stop key={i} offset={o} stopColor={c} stopOpacity={a ?? 1} />)}
    </linearGradient>
  )
}

export function Rg({ id, stops, cx = 0.5, cy = 0.5, r = 0.5, fx, fy, units }) {
  return (
    <radialGradient id={id} cx={cx} cy={cy} r={r} fx={fx} fy={fy} gradientUnits={units}>
      {stops.map(([o, c, a], i) => <stop key={i} offset={o} stopColor={c} stopOpacity={a ?? 1} />)}
    </radialGradient>
  )
}

// Soft glow blob (no filter: a radial gradient that fades to transparent). Needs a <Rg> per colour, so
// most scenes use this generic white/colour version through `fill`.
export function Glow({ cx, cy, rx, ry, fill, o = 1, className }) {
  return <ellipse className={className} cx={cx} cy={cy} rx={rx} ry={ry ?? rx} fill={fill} opacity={o} />
}

// Puffy gel cloud with a flat-ish bottom. (x, y) = bottom-left, w = width.
export function cloudPath(x, y, w, h = w * 0.42) {
  const b = [0.22, 0.3, 0.26, 0.22]
  let d = `M${x},${y} `
  let cx = x
  const hs = [0.55, 1, 0.8, 0.5]
  b.forEach((f, i) => {
    const seg = w * f
    const r = seg * 0.62
    const lift = h * hs[i]
    d += `C${cx},${y - lift * 0.9} ${cx + seg * 0.15},${y - lift - r * 0.35} ${cx + seg * 0.5},${y - lift} `
    d += `C${cx + seg * 0.85},${y - lift - r * 0.35} ${cx + seg},${y - lift * 0.9} ${cx + seg},${y - lift * 0.35} `
    cx += seg
  })
  d += `Q${x + w + 6},${y} ${x + w - 4},${y + 3} L${x + 6},${y + 3} Q${x - 6},${y} ${x},${y} Z`
  return d
}

export function Cloud({ x, y, w, fill = '#fff', ink, shade, o = 1, className, w2 = 2.4, gloss = true }) {
  const d = cloudPath(x, y, w)
  return (
    <g className={className} opacity={o}>
      <path d={d} fill={fill} />
      {shade && <path d={`M${x + 8},${y - 2} Q${x + w / 2},${y - 12} ${x + w - 8},${y - 2}`} fill="none" stroke={shade} strokeWidth="6" strokeLinecap="round" opacity="0.6" />}
      {ink && <path d={d} fill="none" stroke={ink} strokeWidth={w2} strokeLinejoin="round" />}
      {gloss && <ellipse cx={x + w * 0.32} cy={y - w * 0.26} rx={w * 0.09} ry={w * 0.035} fill="#fff" opacity="0.9" transform={`rotate(-18 ${x + w * 0.32} ${y - w * 0.26})`} />}
    </g>
  )
}

// Silhouette palm: trunk + drooping fronds.
export function Palm({ x, y, h = 180, lean = 12, s = 1, color, o = 1 }) {
  const tx = x + lean
  const ty = y - h
  const trunk = `M${x - 6 * s},${y} Q${x + lean * 0.15 - 5 * s},${y - h * 0.55} ${tx - 3 * s},${ty} L${tx + 3 * s},${ty} Q${x + lean * 0.15 + 5 * s},${y - h * 0.55} ${x + 6 * s},${y} Z`
  const angles = [-172, -145, -118, -88, -58, -30, -6, 18, 160]
  const leaves = angles.map((a, i) => {
    const L = (52 + (i % 3) * 8) * s
    const r = (a * Math.PI) / 180
    const droop = Math.abs(Math.cos(r)) * L * 0.45
    const ex = tx + Math.cos(r) * L
    const ey = ty + Math.sin(r) * L * 0.75 + droop
    const mx = (tx + ex) / 2
    const my = (ty + ey) / 2 - L * 0.22
    const nx = -(ey - ty) / L
    const ny = (ex - tx) / L
    const wd = 9 * s
    return `M${tx},${ty} Q${mx + nx * wd},${my + ny * wd} ${ex},${ey} Q${mx - nx * wd * 0.2},${my - ny * wd * 0.2 + 6 * s} ${tx},${ty} Z`
  })
  return (
    <g fill={color} opacity={o}>
      <path d={trunk} />
      {leaves.map((d, i) => <path key={i} d={d} />)}
      <circle cx={tx} cy={ty + 2} r={5 * s} />
    </g>
  )
}

// Deterministic pseudo-random numbers (stable art across renders).
export function rng(seed = 7) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

// Night sky: little dots + a few plus-sparkles.
export function Stars({ seed = 3, n = 40, x0 = -460, x1 = 850, y0 = -300, y1 = 260, color = '#fff' }) {
  const r = rng(seed)
  const items = []
  for (let i = 0; i < n; i++) {
    const x = x0 + r() * (x1 - x0)
    const y = y0 + r() * (y1 - y0)
    const big = r() > 0.86
    items.push(
      big ? (
        <path key={i} d={`M${x},${y - 5} L${x + 1.2},${y - 1.2} L${x + 5},${y} L${x + 1.2},${y + 1.2} L${x},${y + 5} L${x - 1.2},${y + 1.2} L${x - 5},${y} L${x - 1.2},${y - 1.2} Z`} fill={color} opacity="0.9" />
      ) : (
        <circle key={i} cx={x} cy={y} r={0.7 + r() * 1.1} fill={color} opacity={0.35 + r() * 0.5} />
      ),
    )
  }
  return <g>{items}</g>
}

// 4-point sparkle.
export function Spark({ x, y, r = 8, fill = '#fff', o = 1, className }) {
  const k = r * 0.22
  return (
    <path
      className={className}
      opacity={o}
      fill={fill}
      d={`M${x},${y - r} Q${x + k},${y - k} ${x + r},${y} Q${x + k},${y + k} ${x},${y + r} Q${x - k},${y + k} ${x - r},${y} Q${x - k},${y - k} ${x},${y - r} Z`}
    />
  )
}
