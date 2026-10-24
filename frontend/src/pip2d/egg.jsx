import { useId } from 'react'
import { Pip2D } from './Pip2D'
import { Y2KDefs, Gel } from './y2k'

// Glossy speckled egg: frame = idle | wobble | crack | hatch (hatch shows a mini Pip peeking out).
const EGG = 'M100,30 C140,30 166,96 166,140 C166,186 137,207 100,207 C63,207 34,186 34,140 C34,96 60,30 100,30 Z'
const SPECKS = [
  [72, 80, 4, '#C9A8FF'], [118, 64, 3, '#7FE9FF'], [134, 112, 5, '#FFB3D9'], [62, 136, 3.5, '#7FE9FF'],
  [98, 104, 2.5, '#C9A8FF'], [142, 160, 4, '#C9A8FF'], [84, 176, 3, '#FFB3D9'], [112, 150, 2.5, '#7FE9FF'],
]
const INK = '#3A2D52'

export function Egg2D({ frame = 'idle', creature = 'capybara', vibe = 'plain', size = 160 }) {
  const id = useId().replace(/:/g, '')
  const crackPath = 'M38,128 L56,120 L66,134 L82,118 L96,132 L112,116 L124,132 L140,118 L152,130 L164,124'
  const body = (
    <g>
      <defs>
        <radialGradient id={`${id}eg`} cx="0.36" cy="0.3" r="0.85">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.6" stopColor="#FFF4E6" />
          <stop offset="1" stopColor="#E9D8F2" />
        </radialGradient>
      </defs>
      <path d={EGG} fill={`url(#${id}eg)`} />
      {SPECKS.map(([x, y, r, c], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={c} />
      ))}
      <path d={EGG} fill="none" stroke={INK} strokeWidth="3.6" />
      <Gel id={id} x={74} y={62} r={10} />
    </g>
  )
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 200 220" role="img" aria-label={`egg (${frame})`} style={{ overflow: 'visible' }}>
      <defs>
        <Y2KDefs id={id} />
        <clipPath id={`${id}low`}>
          <path d={`${crackPath} L170,220 L30,220 Z`} />
        </clipPath>
        <clipPath id={`${id}top`}>
          <path d={`${crackPath} L170,0 L30,0 Z`} />
        </clipPath>
      </defs>
      <ellipse cx="100" cy="210" rx="48" ry="7" fill="#000" opacity="0.15" />
      {frame === 'hatch' ? (
        <g>
          <g transform="translate(25 -2)">
            <Pip2D creature={creature} vibe={vibe} mini mood="aha" size={150} animate={false} />
          </g>
          <g clipPath={`url(#${id}low)`}>{body}</g>
          <g transform="translate(18 -46) rotate(-24 100 100)" clipPath={`url(#${id}top)`}>
            {body}
          </g>
          <path d={crackPath} fill="none" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        </g>
      ) : (
        <g transform={frame === 'wobble' ? 'rotate(-10 100 207)' : undefined}>
          {body}
          {frame === 'crack' && <path d="M60,96 L72,108 L66,120 L82,126 L78,140" fill="none" stroke={INK} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />}
          {frame === 'crack' && <path d="M126,84 L132,96 L124,104" fill="none" stroke={INK} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />}
        </g>
      )}
      {frame === 'wobble' && (
        <g stroke={INK} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7">
          <path d="M176,90 q8,10 0,20" />
          <path d="M186,84 q12,16 0,32" />
          <path d="M24,110 q-8,10 0,20" />
        </g>
      )}
    </svg>
  )
}

// Two Pips side by side mid high-five.
export function Duo2D({ left = { creature: 'capybara' }, right = { creature: 'corgi' }, size = 160 }) {
  const w = size * 2
  return (
    <div style={{ position: 'relative', width: w, height: size * 1.1 }} role="img" aria-label="two Pips high-five">
      <div style={{ position: 'absolute', left: 0, bottom: 0 }}>
        <Pip2D mood="proud" pose="pose" animate={false} size={size} {...left} />
      </div>
      <div style={{ position: 'absolute', right: 0, bottom: 0, transform: 'scaleX(-1)' }}>
        <Pip2D mood="proud" pose="pose" animate={false} size={size} {...right} />
      </div>
      <svg style={{ position: 'absolute', left: w / 2 - size * 0.35, top: size * 0.02 }} width={size * 0.7} height={size * 0.6} viewBox="0 0 140 120" aria-hidden>
        <path d="M70,8 L80,36 L110,30 L88,52 L112,74 L80,70 L70,100 L60,70 L28,74 L52,52 L30,30 L60,36 Z" fill="#FFE27A" stroke="#3A2D52" strokeWidth="3" strokeLinejoin="round" />
        <circle cx="56" cy="56" r="15" fill="#FFF4E6" stroke="#3A2D52" strokeWidth="3" />
        <circle cx="84" cy="56" r="15" fill="#FFF4E6" stroke="#3A2D52" strokeWidth="3" />
        <path d="M20,20 l10,8 M120,20 l-10,8 M18,96 l12,-6 M122,96 l-12,-6" stroke="#3A2D52" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  )
}
