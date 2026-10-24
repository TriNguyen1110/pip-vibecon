import { Glint } from './y2k'
import { Shape, mix, Outline, InkStroke } from './shapes'
import { ellipsePoints, pathToPoints, furPath } from './fuzz'
import { MAIN_HEADS } from './mainHeads'

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

// slightly-too-cool tinted shades pushed down the nose (eyes peek over the top)
export function LowShades({ A, t, id }) {
  const [L, R] = A.eyes
  const y = Math.max(L.cy, R.cy) + Math.max(L.ry, R.ry) * 0.78
  const h = Math.max(L.ry, R.ry) * 0.72
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

// ---- P2D-12b: heroic "Main Character" body (cartoon power-up shape, no anatomy) ----

const RUFF = { capybara: [58, 28], corgi: [48, 23], cat: [44, 22], raccoon: [46, 22], frog: [46, 22], axolotl: [40, 19] }
export const HERO_LIFT = { frog: 30, default: 30 }

// Back part: wind cape, long legs in a wide stance, V-shaped torso.
export function HeroBack({ creature, t, id, y0 }) {
  const cape = `M58,${y0 + 2} C100,${y0 - 10} 150,${y0 - 6} 176,${y0 + 4} C192,${y0 + 18} 200,${y0 + 40} 196,${y0 + 70} C184,${y0 + 60} 168,${y0 + 58} 150,${y0 + 64} C120,${y0 + 40} 84,${y0 + 30} 58,${y0 + 2} Z`
  const torso = `M36,${y0 + 8} Q100,${y0 - 8} 164,${y0 + 8} Q162,${y0 + 32} 134,${y0 + 50} L130,${y0 + 62} L70,${y0 + 62} L66,${y0 + 50} Q38,${y0 + 32} 36,${y0 + 8} Z`
  const leg = (x0, x1) => `M${x0},${y0 + 56} C${x0},${y0 + 80} ${x1},${y0 + 82} ${x1},204`
  return (
    <g>
      <Shape d={cape} fur={{ key: `hero-cape-${creature}`, seed: 141, amp: 3.4, spacing: 7, tuftChance: 0.45 }} fill={mix(t.body, '#ffffff', 0.18)} shade={t.shade} ink={t.ink} uid={`${id}hc`} />
      {creature === 'raccoon' && (
        // the ringed tail, restored (sweeping up behind the hip)
        <g>
          <InkStroke d={`M128,${y0 + 58} C170,${y0 + 64} 196,${y0 + 40} 190,${y0 + 6}`} color={t.body} ink={t.ink} w={20} fluffy />
          <path d={`M128,${y0 + 58} C170,${y0 + 64} 196,${y0 + 40} 190,${y0 + 6}`} fill="none" stroke={t.dark} strokeWidth="22" strokeDasharray="9 9" />
        </g>
      )}
      {creature === 'axolotl' && (
        // taller tail stance: the tail sweeps down to the ground like a kickstand
        <path d={`M120,${y0 + 54} C150,${y0 + 70} 170,${y0 + 82} 184,206`} fill="none" stroke={t.ink} strokeWidth="22" strokeLinecap="round" />
      )}
      {creature === 'axolotl' && <path d={`M120,${y0 + 54} C150,${y0 + 70} 170,${y0 + 82} 184,206`} fill="none" stroke={t.body} strokeWidth="15" strokeLinecap="round" />}
      {[
        [80, 62],
        [120, 138],
      ].map(([a, b], i) => (
        <g key={i}>
          <path d={leg(a, b)} fill="none" stroke={t.ink} strokeWidth="22" strokeLinecap="round" />
          <path d={leg(a, b)} fill="none" stroke={t.body} strokeWidth="15" strokeLinecap="round" />
          <ellipse cx={b + (i ? 6 : -6)} cy="207" rx="17" ry="8" fill={t.shade} stroke={t.ink} strokeWidth="3.4" />
        </g>
      ))}
      <Shape pts={pathToPoints(torso)} fur={{ key: `hero-torso-${creature}`, seed: 142, amp: 2.6, spacing: 7 }} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}ht`} />
    </g>
  )
}

// Front part: the big fluffy chest ruff + crossed arms.
export function HeroFront({ creature, t, id, y0 }) {
  const [rx, ry] = RUFF[creature] ?? [46, 22]
  const arm = (a, b) => `M${a[0]},${a[1]} Q100,${y0 + 46} ${b[0]},${b[1]}`
  return (
    <g>
      <Shape
        pts={ellipsePoints(100, y0 + 12, rx, ry)}
        fur={{ key: `hero-ruff-${creature}`, seed: 143, amp: 4.2, spacing: 6.5, tuftChance: 0.55 }}
        fill={t.belly}
        shade={mix(t.belly, t.shade, 0.35)}
        ink={t.ink}
        uid={`${id}hr`}
      />
      {/* crossed arms */}
      {[
        [[42, y0 + 18], [128, y0 + 38]],
        [[158, y0 + 18], [72, y0 + 40]],
      ].map(([a, b], i) => (
        <g key={i}>
          <path d={arm(a, b)} fill="none" stroke={t.ink} strokeWidth="19" strokeLinecap="round" />
          <path d={arm(a, b)} fill="none" stroke={t.body} strokeWidth="12" strokeLinecap="round" />
          <circle cx={b[0]} cy={b[1]} r="8" fill={t.body} stroke={t.ink} strokeWidth="3" />
        </g>
      ))}
    </g>
  )
}


// ---- P2D-12c: real bone structure (the head outline itself changes) ----
const jawZone = (x, y) => (y > 140 && Math.abs(x - 100) > 26 ? 1.9 : y < 70 ? 0.6 : Math.abs(x - 100) > 60 ? 1.3 : 1)

export function mainHeadPath(creature) {
  const H = MAIN_HEADS[creature]
  if (!H) return null
  const furred = !['frog', 'axolotl'].includes(creature)
  return furred ? furPath(`mainhead-${creature}`, pathToPoints(H.head), { seed: 151, amp: 2.6, spacing: 7.5, zone: jawZone, tuftChance: 0.3 }) : H.head
}

// New head: flat fill + a darker underside plane under the jaw + light cheekbone planes, then the markings.
export function MainHead({ creature, t, id }) {
  const H = MAIN_HEADS[creature]
  if (!H) return null
  const d = mainHeadPath(creature)
  const velvet = creature === 'frog' || creature === 'axolotl'
  return (
    <g>
      <clipPath id={`${id}mh`}>
        <path d={d} />
      </clipPath>
      <path d={d} fill="none" stroke="#FFD86B" strokeWidth="10" opacity="0.75" />
      <path d={d} fill={t.shade} />
      <g clipPath={`url(#${id}mh)`}>
        <path d={d} fill={t.body} transform="translate(0 -11)" />
        {velvet && <path d={d} fill={`url(#${id}speck)`} />}
        {H.cheeks.map(([x, y], i) => (
          <ellipse key={i} cx={x + (i ? -8 : 8)} cy={y} rx="16" ry="9" transform={`rotate(${i ? 30 : -30} ${x} ${y})`} fill="#fff" opacity="0.22" />
        ))}
      </g>
      <Outline d={d} ink={t.ink} />
      <H.Marks t={t} />
    </g>
  )
}

// Hide the regular round head so only the new structure shows (ears, gills, domes stay).
export function OldHeadMask({ creature, id }) {
  const H = MAIN_HEADS[creature]
  return (
    <mask id={`${id}oldHead`} maskUnits="userSpaceOnUse" x="-40" y="-60" width="280" height="340">
      <rect x="-40" y="-60" width="280" height="340" fill="#fff" />
      {H && <path d={H.oldHead} fill="#000" stroke="#000" strokeWidth="14" strokeLinejoin="round" />}
    </mask>
  )
}

export const mainHeadFirst = (creature) => !!MAIN_HEADS[creature]?.headFirst

// A heavy flat brow shelf the shades tuck under.
export function BrowShelf({ A, t }) {
  const [L, R] = A.eyes
  const top = Math.min(L.cy - L.ry, R.cy - R.ry) - 3
  const x0 = L.cx - L.rx - 12
  const x1 = R.cx + R.rx + 12
  return (
    <g>
      <path d={`M${x0},${top} Q100,${top - 7} ${x1},${top} L${x1 - 2},${top + 9} Q100,${top + 4} ${x0 + 2},${top + 9} Z`} fill={t.body} stroke={t.ink} strokeWidth="3" strokeLinejoin="round" />
      <path d={`M${x0 + 8},${top - 1} Q100,${top - 7} ${x1 - 8},${top - 1}`} fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" opacity="0.5" />
    </g>
  )
}
