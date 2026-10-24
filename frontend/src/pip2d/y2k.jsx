// Y2K finish for the soft Pips: gel shine, holo/chrome gradients, star clips, charm, frosted visor, shield shades.
// Everything reads from the SVG's shared defs (Y2KDefs) so each Pip adds only a few gradients.

export const ACCESSORIES_2D = ['none', 'glasses', 'scarf', 'pencil', 'badge', 'backpack', 'starclips', 'charm', 'visor', 'shades', 'half_pin', 'fixed_it_star']

export function Y2KDefs({ id }) {
  return (
    <>
      <filter id={`${id}gel`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1.1" />
      </filter>
      <linearGradient id={`${id}holo`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#7FF5FF" />
        <stop offset="0.35" stopColor="#FFA3EC" />
        <stop offset="0.65" stopColor="#D2F76E" />
        <stop offset="1" stopColor="#9FB8FF" />
      </linearGradient>
      <linearGradient id={`${id}chrome`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset="0.45" stopColor="#C9D1D9" />
        <stop offset="0.55" stopColor="#8E99A3" />
        <stop offset="1" stopColor="#EEF2F6" />
      </linearGradient>
      <linearGradient id={`${id}shade`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#6B5BD6" />
        <stop offset="0.5" stopColor="#E86BC8" />
        <stop offset="1" stopColor="#FF9A5C" />
      </linearGradient>
      <linearGradient id={`${id}frost`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#7FF5FF" />
        <stop offset="1" stopColor="#C9A8FF" />
      </linearGradient>
      <linearGradient id={`${id}lens`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#7FE9FF" stopOpacity="0.55" />
        <stop offset="1" stopColor="#FFA3EC" stopOpacity="0.3" />
      </linearGradient>
    </>
  )
}

// Frutiger-Aero gel shine: a soft white blob + a crisp dot.
export function Gel({ id, x, y, r = 4, rot = -30, o = 0.9 }) {
  return (
    <g pointerEvents="none">
      <ellipse cx={x} cy={y} rx={r} ry={r * 0.6} transform={`rotate(${rot} ${x} ${y})`} fill="#fff" opacity={o} filter={`url(#${id}gel)`} />
      <circle cx={x - r * 0.25} cy={y - r * 0.1} r={Math.max(0.9, r * 0.28)} fill="#fff" />
    </g>
  )
}

// 4-point star glint.
export function Glint({ x, y, r, fill = '#fff', className }) {
  const s = r * 0.3
  return (
    <path
      className={className}
      d={`M${x},${y - r} L${x + s},${y - s} L${x + r},${y} L${x + s},${y + s} L${x},${y + r} L${x - s},${y + s} L${x - r},${y} L${x - s},${y - s} Z`}
      fill={fill}
    />
  )
}

export function starPath(x, y, R, r = R * 0.48) {
  let d = ''
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 ? r : R
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    d += `${i ? 'L' : 'M'}${(x + Math.cos(a) * rad).toFixed(1)},${(y + Math.sin(a) * rad).toFixed(1)} `
  }
  return d + 'Z'
}

// Twinkling sparkle field near the head (aha / hype only).
export function Sparkles({ A }) {
  const { cx, top, w } = A.head
  const pts = [
    [cx - w * 0.48, top + 8, 6],
    [cx + w * 0.5, top + 2, 7.5],
    [cx + w * 0.3, top - 18, 5],
  ]
  return (
    <g>
      {pts.map(([x, y, r], i) => (
        <Glint key={i} className={`pip2d-twinkle pip2d-twinkle-${i}`} x={x} y={y} r={r} fill={i === 1 ? '#FFE27A' : '#FFFFFF'} />
      ))}
    </g>
  )
}

function StarClip({ id, x, y, rot = 0, fill, ink }) {
  return (
    <g transform={`rotate(${rot} ${x} ${y})`}>
      <rect x={x - 9} y={y + 4} width="18" height="4" rx="2" fill="#C9D1D9" stroke={ink} strokeWidth="2" />
      <path d={starPath(x, y, 9.5)} fill={fill} stroke={ink} strokeWidth="2.6" strokeLinejoin="round" />
      <Gel id={id} x={x - 2.5} y={y - 3} r={3} />
    </g>
  )
}

export function StarClips({ id, A, t, bent = false }) {
  const { cx, top, w } = A.head
  const [a, b] = A.clips ?? [
    [cx - w * 0.3, top + 14],
    [cx + w * 0.27, top + 10],
  ]
  return (
    <g>
      <StarClip id={id} x={a[0]} y={a[1]} rot={-18} fill="#C9A8FF" ink={t.ink} />
      {bent ? (
        <StarClip id={id} x={b[0] + w * 0.06} y={b[1] + 12} rot={42} fill="#7FE9FF" ink={t.ink} />
      ) : (
        <StarClip id={id} x={b[0]} y={b[1]} rot={14} fill="#7FE9FF" ink={t.ink} />
      )}
    </g>
  )
}

// Beaded phone-charm dangling at the side, ending in a tiny glossy star.
export function Charm({ id, A, t }) {
  const x = A.neck.x1 - 6
  const y = A.neck.y + 2
  const beads = ['#C9A8FF', '#7FE9FF', '#D2F76E', '#FFFFFF']
  return (
    <g transform={`translate(${x} ${y}) scale(1.55) translate(${-x} ${-y})`}>
      <path d={`M${x},${y} Q${x + 6},${y + 14} ${x + 2},${y + 30}`} fill="none" stroke={t.ink} strokeWidth="1.6" />
      {beads.map((c, i) => (
        <g key={i}>
          <circle cx={x + 3 + Math.sin(i) * 2} cy={y + 6 + i * 6.5} r="3.6" fill={c} stroke={t.ink} strokeWidth="1.6" />
          <circle cx={x + 2 + Math.sin(i) * 2} cy={y + 5 + i * 6.5} r="1" fill="#fff" />
        </g>
      ))}
      <path d={starPath(x + 2, y + 38, 7.5)} fill="#FFE27A" stroke={t.ink} strokeWidth="2.2" strokeLinejoin="round" />
      <Gel id={id} x={x} y={y + 35} r={2.4} />
    </g>
  )
}

// Frosted translucent candy visor across the forehead.
export function FrostVisor({ id, hx0, hx1, y, t }) {
  return (
    <g>
      <path d={`M${hx0},${y} Q100,${y - 18} ${hx1},${y} L${hx1 + 2},${y + 13} Q100,${y - 2} ${hx0 - 2},${y + 13} Z`} fill={`url(#${id}frost)`} opacity="0.72" stroke={t.ink} strokeWidth="2.8" strokeLinejoin="round" />
      <path d={`M${hx0 + 10},${y + 2} Q100,${y - 13} ${hx1 - 30},${y - 2}`} fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" opacity="0.85" />
    </g>
  )
}

// Tinted shield sunglasses (one wraparound lens).
export function Shades({ id, A, t }) {
  const [L, R] = A.eyes
  const y = (L.cy + R.cy) / 2
  const h = Math.max(L.ry, R.ry)
  const x0 = L.cx - L.rx - 12
  const x1 = R.cx + R.rx + 12
  const d = `M${x0},${y - h * 0.7} Q100,${y - h * 1.15} ${x1},${y - h * 0.7} Q${x1 + 2},${y + h * 0.75} ${(x1 + 100) / 2},${y + h * 0.85} Q100,${y + h * 0.35} ${(x0 + 100) / 2},${y + h * 0.85} Q${x0 - 2},${y + h * 0.75} ${x0},${y - h * 0.7} Z`
  return (
    <g>
      <path d={`M${x0},${y - h * 0.4} L${A.head.cx - A.head.w / 2 + 2},${y - h * 0.6}`} stroke={t.ink} strokeWidth="3.4" strokeLinecap="round" />
      <path d={`M${x1},${y - h * 0.4} L${A.head.cx + A.head.w / 2 - 2},${y - h * 0.6}`} stroke={t.ink} strokeWidth="3.4" strokeLinecap="round" />
      <path d={d} fill={`url(#${id}shade)`} opacity="0.86" stroke={t.ink} strokeWidth="3.2" strokeLinejoin="round" />
      <path d={`M${x0 + 10},${y - h * 0.45} L${x0 + 34},${y - h * 0.6}`} stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
      <path d={`M${x1 - 30},${y + h * 0.2} L${x1 - 18},${y + h * 0.1}`} stroke="#fff" strokeWidth="2.2" strokeLinecap="round" opacity="0.6" />
    </g>
  )
}

// Cracked holographic sticker band-aid (ugly vibe).
export function HoloBandAid({ A, t, id }) {
  const x = A.head.cx - A.head.w * 0.3
  const y = A.head.top + 22
  return (
    <g transform={`rotate(-28 ${x} ${y})`}>
      <rect x={x - 17} y={y - 6} width="34" height="12" rx="6" fill={`url(#${id}holo)`} stroke={t.ink} strokeWidth="2.6" />
      <rect x={x - 6} y={y - 4.5} width="12" height="9" rx="2" fill="#fff" opacity="0.55" />
      <path d={`M${x + 3},${y - 6} l-3,4 4,3 -3,5`} fill="none" stroke={t.ink} strokeWidth="1.8" strokeLinejoin="round" />
    </g>
  )
}

// Chrome/holo rim light around the whole silhouette (built from a dilated mask of the art).
export function RimLight({ id, kind, Art, t, split }) {
  return (
    <>
      <defs>
        <filter id={`${id}dil`} x="-10%" y="-10%" width="120%" height="120%">
          <feMorphology in="SourceAlpha" operator="dilate" radius={kind === 'club' || kind === 'gold' ? 4 : 3} result="d" />
          <feFlood floodColor="#fff" />
          <feComposite in2="d" operator="in" />
        </filter>
        <filter id={`${id}blk`}>
          <feFlood floodColor="#000" />
          <feComposite in2="SourceAlpha" operator="in" />
        </filter>
        <mask id={`${id}rimM`} maskUnits="userSpaceOnUse" x="-20" y="-40" width="240" height="280">
          <g filter={`url(#${id}dil)`}>
            <Art t={t} id={`${id}r1`} part={split ? 'body' : 'all'} />
          </g>
          <g filter={`url(#${id}blk)`}>
            <Art t={t} id={`${id}r2`} part={split ? 'body' : 'all'} />
          </g>
        </mask>
      </defs>
      <rect
        x="-20"
        y="-40"
        width="240"
        height="280"
        fill={`url(#${id}${kind === 'holo' ? 'holo' : kind === 'club' ? 'clubRim' : kind === 'gold' ? 'gold' : 'chrome'})`}
        mask={`url(#${id}rimM)`}
        opacity={kind === 'holo' ? 0.5 : 0.95}
      />
    </>
  )
}
