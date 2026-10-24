import { useId } from 'react'
import { Gel, Y2KDefs, starPath } from './y2k'

// Earned commemorative items: wearable on Pip (accessory ids) and as album stickers.
export const EARNED_ITEMS = ['half_pin', 'fixed_it_star']

// Glossy enamel pin: a triangle split in half (gold rim, two enamel halves).
export function HalfPinArt({ x, y, s = 1, id, ink = '#2A1630' }) {
  const T = (dx, dy) => `${x + dx * s},${y + dy * s}`
  return (
    <g>
      <path d={`M${T(0, -13)} L${T(13, 10)} L${T(-13, 10)} Z`} fill="#F2C14E" stroke={ink} strokeWidth={2.6} strokeLinejoin="round" />
      <path d={`M${T(0, -8.5)} L${T(0, 7)} L${T(-9, 7)} Z`} fill="#FF8FC7" />
      <path d={`M${T(0, -8.5)} L${T(9, 7)} L${T(0, 7)} Z`} fill="#7FE9FF" />
      <path d={`M${T(0, -10)} L${T(0, 9)}`} stroke="#B98A1E" strokeWidth={1.6} strokeDasharray="2 1.6" />
      <Gel id={id} x={x - 4 * s} y={y - 2 * s} r={2.6 * s} />
    </g>
  )
}

// Gold star with a small band-aid: earned by winning after a re-teach.
export function FixedStarArt({ x, y, s = 1, id, ink = '#2A1630' }) {
  return (
    <g>
      <path d={starPath(x, y, 13 * s)} fill="#FFD25A" stroke={ink} strokeWidth={2.6} strokeLinejoin="round" />
      <g transform={`rotate(-28 ${x} ${y})`}>
        <rect x={x - 9 * s} y={y - 3 * s} width={18 * s} height={6.5 * s} rx={3 * s} fill="#F2D3B1" stroke={ink} strokeWidth={1.8} />
        <rect x={x - 3 * s} y={y - 2 * s} width={6 * s} height={4.5 * s} rx={1} fill="#E8BE94" />
      </g>
      <Gel id={id} x={x - 5 * s} y={y - 5 * s} r={2.6 * s} />
    </g>
  )
}

// Album sticker: die-cut white border + holo sheen. item = half_pin | fixed_it_star | comeback
export function Sticker2D({ item = 'half_pin', size = 96, label }) {
  const id = useId().replace(/:/g, '')
  const art =
    item === 'fixed_it_star' ? (
      <FixedStarArt x={50} y={46} s={2.2} id={id} />
    ) : item === 'comeback' ? (
      <g>
        <path d={starPath(50, 44, 26)} fill={`url(#${id}holo)`} stroke="#2A1630" strokeWidth="3" strokeLinejoin="round" />
        <path d="M30,46 Q50,30 70,46" fill="none" stroke="#2A1630" strokeWidth="3" strokeLinecap="round" />
        <path d="M44,54 L50,60 L58,48" fill="none" stroke="#2A1630" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    ) : (
      <HalfPinArt x={50} y={48} s={2.3} id={id} />
    )
  const text = label ?? (item === 'fixed_it_star' ? 'FIXED IT' : item === 'comeback' ? 'COMEBACK' : '½ OF IT')
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={`${text} sticker`}>
      <defs>
        <Y2KDefs id={id} />
      </defs>
      <circle cx="50" cy="50" r="47" fill="#fff" stroke="#D9E2EA" strokeWidth="2" />
      <circle cx="50" cy="50" r="41" fill={`url(#${id}holo)`} opacity="0.35" />
      {art}
      <path d="M22,26 Q36,12 56,12" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.8" />
      <text x="50" y="86" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="11" fill="#2A1630">
        {text}
      </text>
    </svg>
  )
}

// Holographic "comeback" frame for K.O. cards (wraps any content).
export function ComebackFrame({ width = 220, height = 300, children }) {
  const id = useId().replace(/:/g, '')
  return (
    <div style={{ position: 'relative', width, height }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: 'absolute', inset: 0 }} aria-hidden>
        <defs>
          <Y2KDefs id={id} />
        </defs>
        <rect x="3" y="3" width={width - 6} height={height - 6} rx="22" fill="none" stroke={`url(#${id}holo)`} strokeWidth="7" />
        <rect x="9" y="9" width={width - 18} height={height - 18} rx="17" fill="none" stroke={`url(#${id}chrome)`} strokeWidth="2.5" />
        {[
          [20, 20],
          [width - 20, 20],
          [20, height - 20],
          [width - 20, height - 20],
        ].map(([x, y], i) => (
          <path key={i} d={starPath(x, y, 9)} fill="#FFE27A" stroke="#2A1630" strokeWidth="2" strokeLinejoin="round" />
        ))}
        <g transform={`translate(${width / 2} ${height - 16})`}>
          <rect x="-48" y="-12" width="96" height="22" rx="11" fill={`url(#${id}holo)`} stroke="#2A1630" strokeWidth="2.4" />
          <text y="4" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="11" letterSpacing="1" fill="#2A1630">
            COMEBACK
          </text>
        </g>
      </svg>
      <div style={{ position: 'absolute', inset: 14, bottom: 34, overflow: 'hidden', borderRadius: 14, display: 'grid', placeItems: 'center' }}>{children}</div>
    </div>
  )
}
