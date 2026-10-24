import { Gel } from './y2k'

// Club / runway wearables (gender-neutral). All placed from the creature anchors.
export const CLUB_ACCESSORIES = ['shades_neon', 'chain', 'puffer', 'headphones_dj']

export function ClubDefs({ id }) {
  return (
    <>
      <linearGradient id={`${id}clubRim`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#FF3FD8" />
        <stop offset="0.5" stopColor="#B05CFF" />
        <stop offset="1" stopColor="#2FF3FF" />
      </linearGradient>
      <linearGradient id={`${id}neonLens`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#2FF3FF" />
        <stop offset="1" stopColor="#FF3FD8" />
      </linearGradient>
      <linearGradient id={`${id}puff`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#F2EEFF" />
        <stop offset="0.6" stopColor="#B9AEF0" />
        <stop offset="1" stopColor="#7E70C9" />
      </linearGradient>
      <filter id={`${id}neonGlow`} x="-40%" y="-80%" width="180%" height="260%">
        <feGaussianBlur stdDeviation="3.5" />
      </filter>
    </>
  )
}

// Glowing visor shades: one neon wraparound band across the eyes.
export function NeonShades({ id, A, t }) {
  const [L, R] = A.eyes
  const y = (L.cy + R.cy) / 2
  const h = Math.max(L.ry, R.ry) * 0.8
  const x0 = L.cx - L.rx - 14
  const x1 = R.cx + R.rx + 14
  const d = `M${x0},${y - h} Q100,${y - h * 1.4} ${x1},${y - h} L${x1 - 4},${y + h * 0.7} Q100,${y + h * 0.95} ${x0 + 4},${y + h * 0.7} Z`
  return (
    <g>
      <path d={d} fill={`url(#${id}neonLens)`} opacity="0.65" filter={`url(#${id}neonGlow)`} />
      <path d={d} fill="#14102A" opacity="0.88" stroke={t.ink} strokeWidth="3" strokeLinejoin="round" />
      <path d={`M${x0 + 6},${y - h * 0.15} Q100,${y - h * 0.5} ${x1 - 6},${y - h * 0.15}`} fill="none" stroke={`url(#${id}neonLens)`} strokeWidth="4" strokeLinecap="round" />
      <path d={`M${x0 + 12},${y - h * 0.65} L${x0 + 34},${y - h * 0.8}`} stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity="0.8" />
    </g>
  )
}

// Chunky chrome chain with a star pendant.
export function Chain({ id, A, t }) {
  const { y, x0, x1 } = A.neck
  const n = 9
  const links = []
  for (let i = 0; i < n; i++) {
    const k = i / (n - 1)
    const x = x0 + 20 + (x1 - x0 - 40) * k
    const yy = y - 4 + Math.sin(k * Math.PI) * 14
    links.push([x, yy, i % 2 ? 90 : 0])
  }
  return (
    <g>
      {links.map(([x, yy, r], i) => (
        <ellipse key={i} cx={x} cy={yy} rx="7.5" ry="4.8" transform={`rotate(${r + (x - 100) * 0.3} ${x} ${yy})`} fill="none" stroke={t.ink} strokeWidth="6" />
      ))}
      {links.map(([x, yy, r], i) => (
        <ellipse key={`c${i}`} cx={x} cy={yy} rx="7.5" ry="4.8" transform={`rotate(${r + (x - 100) * 0.3} ${x} ${yy})`} fill="none" stroke={`url(#${id}chrome)`} strokeWidth="3.4" />
      ))}
      <rect x="91" y={y + 12} width="18" height="18" rx="4" transform={`rotate(45 100 ${y + 21})`} fill={`url(#${id}chrome)`} stroke={t.ink} strokeWidth="2.6" />
      <Gel id={id} x={97} y={y + 17} r={2.6} />
    </g>
  )
}

// Glossy puffer-jacket collar: puffy quilted segments around the neck.
export function Puffer({ id, A, t }) {
  const { y, x0, x1 } = A.neck
  const segs = 6
  const w = (x1 - x0 + 12) / segs
  return (
    <g>
      {Array.from({ length: segs }, (_, i) => {
        const x = x0 - 6 + i * w
        const yy = y - 2 + Math.sin(((i + 0.5) / segs) * Math.PI) * 6
        return <rect key={i} x={x} y={yy - 9} width={w + 2} height="22" rx="11" fill={`url(#${id}puff)`} stroke={t.ink} strokeWidth="3" />
      })}
      {Array.from({ length: segs }, (_, i) => {
        const x = x0 - 6 + i * w
        const yy = y - 2 + Math.sin(((i + 0.5) / segs) * Math.PI) * 6
        return <path key={`g${i}`} d={`M${x + 5},${yy - 4} Q${x + w / 2},${yy - 8} ${x + w - 4},${yy - 4}`} fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" opacity="0.9" />
      })}
      <path d={`M100,${y + 4} L100,${y + 22}`} stroke="#C9D1D9" strokeWidth="3" strokeLinecap="round" />
    </g>
  )
}

// Big chrome DJ headphones over the head.
export function DJHeadphones({ id, A, t }) {
  const { cx, top, w } = A.head
  const [L] = A.eyes
  const cy = L.cy - 6
  const r = w / 2 + 4
  return (
    <g>
      <path d={`M${cx - r},${cy} C${cx - r},${top - 34} ${cx + r},${top - 34} ${cx + r},${cy}`} fill="none" stroke={t.ink} strokeWidth="13" strokeLinecap="round" />
      <path d={`M${cx - r},${cy} C${cx - r},${top - 34} ${cx + r},${top - 34} ${cx + r},${cy}`} fill="none" stroke={`url(#${id}chrome)`} strokeWidth="7" strokeLinecap="round" />
      {[-1, 1].map((k) => (
        <g key={k}>
          <ellipse cx={cx + k * r} cy={cy + 6} rx="15" ry="20" fill="#1A1C2C" stroke={t.ink} strokeWidth="3.4" />
          <ellipse cx={cx + k * (r + 3)} cy={cy + 6} rx="10" ry="15" fill={`url(#${id}chrome)`} stroke={t.ink} strokeWidth="2.4" />
          <ellipse cx={cx + k * (r + 3)} cy={cy + 6} rx="5" ry="8" fill={`url(#${id}clubRim)`} />
          <Gel id={id} x={cx + k * (r + 3) - 3} y={cy - 2} r={2.6} />
        </g>
      ))}
    </g>
  )
}

export function ClubAccessory({ type, ...p }) {
  if (type === 'shades_neon') return <NeonShades {...p} />
  if (type === 'chain') return <Chain {...p} />
  if (type === 'puffer') return <Puffer {...p} />
  if (type === 'headphones_dj') return <DJHeadphones {...p} />
  return null
}
