import { useId } from 'react'
import './pip2d.css'

// Glossy candy-plastic villains (contrast with the soft, fuzzy Pips). viewBox 220 x 240.
// <Boss2D boss="walrus"|"penguin"|"hamster"|"triangle"|<lesson boss name> state="smug"|"cracked"|"ko" hp size />
// If `state` is omitted it follows `hp`: > 50 smug, > 0 cracked, 0 K.O.

const INK = '#2A1630'
const SIGN = '#FFF6E0'
const FONT = '"Arial Rounded MT Bold", "Trebuchet MS", system-ui, sans-serif'

export const BOSSES_2D = ['walrus', 'penguin', 'hamster', 'triangle']
export const BOSS_NAMES = {
  walrus: 'Top-Top Bottom-Bottom',
  penguin: 'Pause-Pause Penguin',
  hamster: 'Hop-Hop Hamster',
  triangle: 'Triangle boss', // placeholder until content names it (a_tri.assignment.json)
}

// Pick a boss by id, or by keywords in the lesson's boss name / backstory.
export function bossIdFor(idOrName = '') {
  const s = String(idOrName).toLowerCase()
  if (BOSS_NAMES[s]) return s
  if (/triangle|△|tri\b|area|b\s*[×x*]\s*h|base.*height/.test(s)) return 'triangle'
  if (/walrus|top-top|bottom-bottom|fraction/.test(s)) return 'walrus'
  if (/penguin|pause|comma/.test(s)) return 'penguin'
  if (/hamster|hop-hop|suitcase/.test(s)) return 'hamster'
  return 'walrus'
}

// Hard cel-shaded glossy shape.
function V({ d, fill, shade, uid, w = 4.4, sx = -10, sy = -8 }) {
  return (
    <g>
      {shade ? (
        <>
          <clipPath id={uid}>
            <path d={d} />
          </clipPath>
          <path d={d} fill={shade} />
          <g clipPath={`url(#${uid})`}>
            <path d={d} fill={fill} transform={`translate(${sx} ${sy})`} />
          </g>
        </>
      ) : (
        <path d={d} fill={fill} />
      )}
      <path d={d} fill="none" stroke={INK} strokeWidth={w} strokeLinejoin="round" strokeLinecap="round" />
    </g>
  )
}

// Crisp glossy highlight: a bright streak + a dot.
function Gloss({ x, y, rx = 14, ry = 6, rot = -30 }) {
  return (
    <g fill="#fff">
      <ellipse cx={x} cy={y} rx={rx} ry={ry} transform={`rotate(${rot} ${x} ${y})`} opacity="0.9" />
      <circle cx={x + rx * 0.9} cy={y + ry * 1.6} r={ry * 0.45} opacity="0.9" />
    </g>
  )
}

const ell = (cx, cy, rx, ry) => `M${cx - rx},${cy} A${rx},${ry} 0 1,0 ${cx + rx},${cy} A${rx},${ry} 0 1,0 ${cx - rx},${cy} Z`

// Villain eyes. smug = heavy half-lid + one raised brow; cracked = one eye wide, one squinting; ko = X.
function BossEyes({ L, R, r = 9, state, lid }) {
  if (state === 'ko') {
    return (
      <g stroke={INK} strokeWidth="4.5" strokeLinecap="round">
        {[L, R].map(([x, y], i) => (
          <g key={i}>
            <path d={`M${x - r},${y - r} L${x + r},${y + r}`} />
            <path d={`M${x + r},${y - r} L${x - r},${y + r}`} />
          </g>
        ))}
      </g>
    )
  }
  const lids = state === 'cracked' ? [0.05, 0.6] : [0.5, 0.5]
  return (
    <g>
      {[L, R].map(([x, y], i) => {
        const rr = state === 'cracked' && i === 0 ? r * 1.25 : r
        const ly = y - rr + 2 * rr * lids[i]
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={rr + 3} fill="#fff" stroke={INK} strokeWidth="3" />
            <circle cx={x} cy={y + 1} r={rr * 0.62} fill={INK} />
            <circle cx={x - rr * 0.25} cy={y - rr * 0.15} r={rr * 0.2} fill="#fff" />
            <path d={`M${x - rr - 3},${y - rr - 3} L${x + rr + 3},${y - rr - 3} L${x + rr + 3},${ly} L${x - rr - 3},${ly} Z`} fill={lid} />
            <path d={`M${x - rr - 2},${ly} L${x + rr + 2},${ly}`} stroke={INK} strokeWidth="4" strokeLinecap="round" />
          </g>
        )
      })}
      {/* brows: smug = one raised, cracked = both angry */}
      <g stroke={INK} strokeWidth="5" strokeLinecap="round">
        {state === 'cracked' ? (
          <>
            <path d={`M${L[0] - r - 4},${L[1] - r - 12} L${L[0] + r + 2},${L[1] - r - 5}`} />
            <path d={`M${R[0] - r - 2},${R[1] - r - 5} L${R[0] + r + 4},${R[1] - r - 12}`} />
          </>
        ) : (
          <>
            <path d={`M${L[0] - r - 4},${L[1] - r - 16} Q${L[0]},${L[1] - r - 24} ${L[0] + r + 4},${L[1] - r - 15}`} fill="none" />
            <path d={`M${R[0] - r - 4},${R[1] - r - 7} L${R[0] + r + 4},${R[1] - r - 9}`} />
          </>
        )}
      </g>
    </g>
  )
}

function Sweat({ x, y }) {
  return <path d={`M${x},${y} C${x + 6},${y + 10} ${x + 8},${y + 17} ${x},${y + 21} C${x - 8},${y + 17} ${x - 6},${y + 10} ${x},${y} Z`} fill="#9EDCF5" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
}

function KOStars({ x, y }) {
  return (
    <g className="pip2d-glow">
      <ellipse cx={x} cy={y} rx="30" ry="8" fill="none" stroke="#FFD25A" strokeWidth="3" />
      {[-26, 0, 24].map((dx, i) => (
        <path key={i} d={`M${x + dx},${y - 9 + (i % 2) * 6} l3,6 6,1 -5,4 1,6 -5,-3 -5,3 1,-6 -5,-4 6,-1 Z`} fill="#FFD25A" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      ))}
    </g>
  )
}

// A sign board that bends (cracked) or snaps in two (ko).
function Board({ x, y, w, h, lines, state, size = 18, id, tilt = 0 }) {
  const text = (dx = 0) =>
    lines.map((l, i) => (
      <text key={i} x={x + w / 2 + dx} y={y + h / 2 + (i - (lines.length - 1) / 2) * size * 1.15 + size * 0.35} textAnchor="middle" fontFamily={FONT} fontWeight="900" fontSize={size} fill={INK}>
        {l}
      </text>
    ))
  const board = <rect x={x} y={y} width={w} height={h} rx="8" fill={SIGN} stroke={INK} strokeWidth="4.4" />
  if (state === 'ko') {
    const half = w / 2
    return (
      <g>
        <clipPath id={`${id}bl`}>
          <path d={`M${x - 5},${y - 5} L${x + half + 6},${y - 5} L${x + half - 4},${y + h * 0.4} L${x + half + 5},${y + h + 5} L${x - 5},${y + h + 5} Z`} />
        </clipPath>
        <clipPath id={`${id}br`}>
          <path d={`M${x + half + 6},${y - 5} L${x + w + 5},${y - 5} L${x + w + 5},${y + h + 5} L${x + half + 5},${y + h + 5} L${x + half - 4},${y + h * 0.4} Z`} />
        </clipPath>
        <g transform={`translate(-14 18) rotate(-16 ${x} ${y + h})`} clipPath={`url(#${id}bl)`}>
          {board}
          {text()}
        </g>
        <g transform={`translate(14 22) rotate(19 ${x + w} ${y + h})`} clipPath={`url(#${id}br)`}>
          {board}
          {text()}
        </g>
      </g>
    )
  }
  return (
    <g transform={`rotate(${state === 'cracked' ? tilt + 9 : tilt} ${x + w / 2} ${y + h / 2})`}>
      {board}
      {text()}
      {state === 'cracked' && (
        <path d={`M${x + w * 0.62},${y} l-6,${h * 0.25} 9,${h * 0.18} -8,${h * 0.22} 6,${h * 0.35}`} fill="none" stroke={INK} strokeWidth="3.4" strokeLinejoin="round" strokeLinecap="round" />
      )}
    </g>
  )
}

function Walrus({ state, id }) {
  const fill = '#A47F6B'
  const shade = '#7F5E4D'
  const ko = state === 'ko'
  return (
    <g transform={ko ? 'rotate(-8 110 230)' : undefined}>
      {/* raised grandiose flipper */}
      {!ko && <V d="M40,148 C26,128 22,98 34,84 C44,78 52,100 58,128 Z" fill={fill} shade={shade} uid={`${id}f1`} />}
      <V d="M110,64 C162,64 198,106 198,158 C198,208 162,232 110,232 C58,232 22,208 22,158 C22,106 58,64 110,64 Z" fill={fill} shade={shade} uid={`${id}b`} />
      <V d="M168,170 C190,176 198,196 188,206 C176,204 166,190 164,178 Z" fill={fill} shade={shade} uid={`${id}f2`} />
      <Gloss x={74} y={88} rx={16} ry={6} />
      {/* chin up: face sits a touch high and tilted */}
      <g transform="rotate(-5 110 120)">
        <BossEyes L={[84, 100]} R={[136, 98]} r={8} state={state} lid={fill} />
        <V d={ell(97, 130, 21, 15)} fill="#DCC2AA" shade="#C4A68C" uid={`${id}w1`} w={3.6} sx={-5} sy={-4} />
        <V d={ell(123, 130, 21, 15)} fill="#DCC2AA" shade="#C4A68C" uid={`${id}w2`} w={3.6} sx={-5} sy={-4} />
        <g fill={INK} opacity="0.6">
          {[[88, 128], [96, 136], [104, 127], [116, 127], [124, 136], [132, 128]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.8" />
          ))}
        </g>
        <V d={ell(110, 116, 10, 7)} fill="#4A2E2A" uid={`${id}n`} w={3} />
        <circle cx="106" cy="114" r="2.2" fill="#fff" />
        {/* tusks (one chipped when K.O.) */}
        <V d="M98,142 C96,158 94,170 92,180 C98,178 102,162 104,144 Z" fill="#FFFDF2" uid={`${id}t1`} w={3.4} />
        <V d={ko ? 'M116,144 C118,152 119,158 120,162 C124,160 122,152 122,142 Z' : 'M116,144 C118,160 122,172 128,180 C128,170 124,158 122,142 Z'} fill="#FFFDF2" uid={`${id}t2`} w={3.4} />
      </g>
      {/* sandwich board on straps */}
      <path d="M40,124 L46,162 M180,124 L174,162" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      <Board x={36} y={160} w={148} h={56} lines={['1/2 + 1/3 = 2/5']} size={19} state={state} id={`${id}s`} tilt={-3} />
      {state === 'cracked' && <Sweat x={170} y={78} />}
      {ko && <KOStars x={110} y={58} />}
    </g>
  )
}

function Penguin({ state, id }) {
  const fill = '#2C375A'
  const shade = '#1C2440'
  const ko = state === 'ko'
  return (
    <g transform={ko ? 'rotate(10 110 232)' : undefined}>
      <V d="M58,206 C44,212 40,224 60,226 L84,224 Z" fill="#F59B3C" shade="#D97F28" uid={`${id}ft1`} />
      <V d="M162,206 C176,212 180,224 160,226 L136,224 Z" fill="#F59B3C" shade="#D97F28" uid={`${id}ft2`} />
      <V d="M110,40 C150,40 172,90 172,150 C172,205 148,228 110,228 C72,228 48,205 48,150 C48,90 70,40 110,40 Z" fill={fill} shade={shade} uid={`${id}b`} />
      <path d={ell(110, 158, 44, 60)} fill="#F4F6FA" />
      {/* flippers: one on hip, one holding the sign */}
      <V d="M50,120 C30,140 30,172 46,186 C54,176 56,150 56,128 Z" fill={fill} shade={shade} uid={`${id}w1`} />
      {!ko && <V d="M168,124 C186,134 190,152 182,166 C172,162 166,146 164,132 Z" fill={fill} shade={shade} uid={`${id}w2`} />}
      <Gloss x={82} y={62} rx={14} ry={6} />
      <BossEyes L={[92, 92]} R={[128, 91]} r={8} state={state} lid={fill} />
      <V d="M98,106 L122,106 L110,124 Z" fill="#F59B3C" shade="#D97F28" uid={`${id}bk`} w={3.6} sx={-4} sy={-3} />
      {state === 'smug' && <path d="M100,130 Q112,136 122,128" fill="none" stroke={INK} strokeWidth="3.6" strokeLinecap="round" />}
      {/* giant comma necklace */}
      <path d="M76,124 Q110,150 144,124" fill="none" stroke="#D9A93A" strokeWidth="3.4" strokeDasharray="4 3" />
      <g transform={ko ? 'translate(-30 72) rotate(-60 110 150)' : state === 'cracked' ? 'rotate(25 110 140)' : undefined}>
        <V d="M110,138 A13,13 0 1,1 109.9,138 Z M118,160 C118,172 110,180 100,184 C106,176 108,170 106,162 Z" fill="#F2C14E" shade="#D9A21E" uid={`${id}c`} w={3.6} sx={-5} sy={-4} />
        <circle cx="105" cy="146" r="3" fill="#fff" />
      </g>
      {/* sign on a stick, held up high */}
      {ko ? (
        <g>
          <path d="M176,232 L172,196" stroke="#8A5A3C" strokeWidth="7" strokeLinecap="round" />
          <Board x={98} y={170} w={94} h={52} lines={['I PAUSED,', 'SO COMMA']} size={12.5} state="ko" id={`${id}s`} />
        </g>
      ) : (
        <g transform={state === 'cracked' ? 'rotate(12 180 160)' : undefined}>
          <path d="M184,170 L184,76" stroke={INK} strokeWidth="10" strokeLinecap="round" />
          <path d="M184,170 L184,76" stroke="#A8724C" strokeWidth="5" strokeLinecap="round" />
          <Board x={124} y={22} w={94} h={56} lines={['I PAUSED,', 'SO COMMA']} size={12.5} state={state === 'cracked' ? 'cracked' : 'smug'} id={`${id}s`} />
        </g>
      )}
      {state === 'cracked' && <Sweat x={150} y={56} />}
      {ko && <KOStars x={110} y={30} />}
    </g>
  )
}

function Hamster({ state, id }) {
  const fill = '#E9A64B'
  const shade = '#C78530'
  const ko = state === 'ko'
  return (
    <g transform={ko ? 'rotate(-10 110 232)' : undefined}>
      <V d={ell(62, 70, 15, 15)} fill={fill} shade={shade} uid={`${id}e1`} />
      <V d={ell(158, 70, 15, 15)} fill={fill} shade={shade} uid={`${id}e2`} />
      <circle cx="62" cy="71" r="7" fill="#F2A6A6" />
      <circle cx="158" cy="71" r="7" fill="#F2A6A6" />
      <V d={ell(110, 148, 82, 84)} fill={fill} shade={shade} uid={`${id}b`} />
      <path d={ell(110, 176, 50, 44)} fill="#FFF0D6" />
      {/* stuffed cheeks */}
      <V d={ell(62, 132, 26, 22)} fill="#FBE3C2" shade="#E8C79A" uid={`${id}k1`} w={3.6} sx={-5} sy={-4} />
      <V d={ell(158, 132, 26, 22)} fill="#FBE3C2" shade="#E8C79A" uid={`${id}k2`} w={3.6} sx={-5} sy={-4} />
      <Gloss x={78} y={86} rx={16} ry={6} />
      <BossEyes L={[90, 112]} R={[130, 111]} r={7.5} state={state} lid={fill} />
      <V d="M104,126 L116,126 L110,133 Z" fill="#E87F8E" uid={`${id}n`} w={2.6} />
      {/* buck teeth + smug mouth */}
      {!ko && <path d="M98,138 Q110,146 122,136" fill="none" stroke={INK} strokeWidth="3.4" strokeLinecap="round" />}
      <rect x="104" y="140" width="6" height="9" rx="1.5" fill="#fff" stroke={INK} strokeWidth="2.4" />
      <rect x="110" y="140" width="6" height="9" rx="1.5" fill="#fff" stroke={INK} strokeWidth="2.4" />
      {/* suitcase stamped 2x = 20 + 6 */}
      <g transform={state === 'cracked' ? 'rotate(10 110 196)' : ko ? 'translate(30 6) rotate(24 110 196)' : undefined}>
        <path d="M94,170 L94,160 Q94,154 100,154 L120,154 Q126,154 126,160 L126,170" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
        {ko && <V d="M58,168 L162,168 L150,140 L70,146 Z" fill="#7A4E34" shade="#5E3A26" uid={`${id}lid`} />}
        <V d="M58,170 H162 Q168,170 168,176 V222 Q168,228 162,228 H58 Q52,228 52,222 V176 Q52,170 58,170 Z" fill="#8A5A3C" shade="#6E4430" uid={`${id}case`} />
        <path d="M58,184 H162" stroke="#C9A060" strokeWidth="4" />
        <g transform="rotate(-8 110 204)">
          <rect x="64" y="190" width="92" height="26" rx="4" fill="#FFE9E3" stroke="#D93A3A" strokeWidth="3" strokeDasharray={state === 'cracked' ? '8 4' : undefined} />
          <text x="110" y="209" textAnchor="middle" fontFamily={FONT} fontWeight="900" fontSize="15" fill="#D93A3A">
            2x = 20 + 6
          </text>
        </g>
        {state === 'cracked' && <path d="M140,170 l-6,14 8,10 -6,14" fill="none" stroke={INK} strokeWidth="3.4" strokeLinejoin="round" />}
        {ko && (
          <g>
            <rect x="70" y="128" width="26" height="18" rx="2" fill="#fff" stroke={INK} strokeWidth="2.6" transform="rotate(-25 83 137)" />
            <rect x="128" y="120" width="24" height="17" rx="2" fill="#fff" stroke={INK} strokeWidth="2.6" transform="rotate(20 140 128)" />
          </g>
        )}
      </g>
      {/* paws on the handle */}
      {!ko && (
        <>
          <V d={ell(98, 160, 9, 7)} fill="#FBE3C2" uid={`${id}p1`} w={3} />
          <V d={ell(122, 160, 9, 7)} fill="#FBE3C2" uid={`${id}p2`} w={3} />
        </>
      )}
      {state === 'cracked' && <Sweat x={170} y={90} />}
      {ko && <KOStars x={110} y={48} />}
    </g>
  )
}

// Placeholder triangle boss: a smug glossy triangle who forgot the 1/2, holding up "△ = b × h".
function Triangle({ state, id }) {
  const fill = '#FF6F5E'
  const shade = '#D9503F'
  const ko = state === 'ko'
  const BODY = 'M98,54 Q110,34 122,54 L188,184 Q197,203 176,203 L44,203 Q23,203 32,184 Z'
  return (
    <g transform={ko ? 'rotate(-12 110 220)' : undefined}>
      <V d={ell(80, 210, 15, 9)} fill="#2E2140" uid={`${id}l1`} w={3.6} />
      <V d={ell(140, 210, 15, 9)} fill="#2E2140" uid={`${id}l2`} w={3.6} />
      {/* hand on hip */}
      <V d="M40,170 C22,160 20,140 30,132 C38,140 40,152 50,158 Z" fill={fill} shade={shade} uid={`${id}a1`} />
      <V d={BODY} fill={fill} shade={shade} uid={`${id}b`} sx={-14} sy={-10} />
      <path d="M64,190 L156,190" stroke="#FFD0C4" strokeWidth="10" strokeLinecap="round" opacity="0.6" />
      <Gloss x={92} y={84} rx={14} ry={5.5} rot={-55} />
      <ellipse cx="78" cy="150" rx="7" ry="13" transform="rotate(25 78 150)" fill="#fff" opacity="0.5" filter={`url(#${id}gel)`} />
      <BossEyes L={[92, 128]} R={[128, 127]} r={8} state={state} lid={fill} />
      {state === 'smug' && <path d="M96,156 Q112,164 126,150" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />}
      {state === 'cracked' && <path d="M96,158 L104,154 L112,158 L120,154 L128,158" fill="none" stroke={INK} strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />}
      {ko && <ellipse cx="111" cy="158" rx="8" ry="6" fill="#3A1426" stroke={INK} strokeWidth="3" />}
      {/* the sign, held up high */}
      {ko ? (
        <g>
          <path d="M184,236 L178,206" stroke="#8A5A3C" strokeWidth="7" strokeLinecap="round" />
          <Board x={96} y={176} w={104} h={50} lines={['△ = b × h']} size={21} state="ko" id={`${id}s`} />
        </g>
      ) : (
        <g transform={state === 'cracked' ? 'rotate(10 170 150)' : undefined}>
          <V d="M162,156 C176,150 182,136 178,124 C170,126 164,138 156,146 Z" fill={fill} shade={shade} uid={`${id}a2`} />
          <path d="M172,140 L172,62" stroke={INK} strokeWidth="10" strokeLinecap="round" />
          <path d="M172,140 L172,62" stroke="#A8724C" strokeWidth="5" strokeLinecap="round" />
          <Board x={118} y={10} w={100} h={54} lines={['△ = b × h']} size={21} state={state === 'cracked' ? 'cracked' : 'smug'} id={`${id}s`} />
          <circle cx="172" cy="132" r="8" fill={fill} stroke={INK} strokeWidth="3.4" />
        </g>
      )}
      {state === 'cracked' && <Sweat x={56} y={96} />}
      {ko && <KOStars x={110} y={30} />}
    </g>
  )
}

const ART = { walrus: Walrus, penguin: Penguin, hamster: Hamster, triangle: Triangle }

export function Boss2D({ boss = 'walrus', state, hp, size = 200, className = '', title }) {
  const id = useId().replace(/:/g, '')
  const st = state ?? (hp == null ? 'smug' : hp <= 0 ? 'ko' : hp <= 50 ? 'cracked' : 'smug')
  const key = bossIdFor(boss)
  const Art = ART[key]
  return (
    <svg className={`pip2d ${className}`} width={size} height={(size * 240) / 220} viewBox="0 0 220 240" role="img" aria-label={title ?? `${BOSS_NAMES[key]}, ${st}`}>
      <defs>
        <filter id={`${id}gel`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
      </defs>
      <Art state={st} id={id} />
    </svg>
  )
}

export default Boss2D
