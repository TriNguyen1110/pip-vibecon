import { useId } from 'react'
import './pip2d.css'

// Glossy candy-plastic villains (contrast with the soft, fuzzy Pips). viewBox 220 x 240.
// <Boss2D boss="walrus"|"penguin"|"hamster"|"triangle"|<lesson boss name> state="smug"|"cracked"|"ko"|"reformed" hp size />
// If `state` is omitted it follows `hp`: > 50 smug, > 0 cracked, 0 K.O.

const INK = '#2A1630'
const SIGN = '#FFF6E0'
const FONT = '"Arial Rounded MT Bold", "Trebuchet MS", system-ui, sans-serif'

export const BOSSES_2D = ['walrus', 'penguin', 'hamster', 'triangle']
export const BOSS_NAMES = {
  walrus: 'Top-Top Bottom-Bottom',
  penguin: 'Pause-Pause Penguin',
  hamster: 'Hop-Hop Hamster',
  triangle: 'Duke Doublecount',
}

// Pick a boss by id, or by keywords in the lesson's boss name / backstory.
export function bossIdFor(idOrName = '') {
  const s = String(idOrName).toLowerCase()
  if (BOSS_NAMES[s]) return s
  if (/doublecount|duke|peacock|triangle|△|tri\b|area|b\s*[×x*]\s*h|base.*height/.test(s)) return 'triangle'
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
  if (state === 'reformed') {
    // friendly, slightly sheepish: open eyes, worried brows, a little blush
    return (
      <g>
        {[L, R].map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={r + 3} fill="#fff" stroke={INK} strokeWidth="3" />
            <circle cx={x} cy={y + 1.5} r={r * 0.68} fill={INK} />
            <circle cx={x - r * 0.25} cy={y - r * 0.1} r={r * 0.26} fill="#fff" />
            <ellipse cx={x + (i ? 4 : -4)} cy={y + r + 9} rx={r * 0.9} ry={r * 0.45} fill="#FF8FA8" opacity="0.55" />
          </g>
        ))}
        <g stroke={INK} strokeWidth="4" strokeLinecap="round">
          <path d={`M${L[0] - r - 2},${L[1] - r - 7} L${L[0] + r + 2},${L[1] - r - 13}`} />
          <path d={`M${R[0] - r - 2},${R[1] - r - 13} L${R[0] + r + 2},${R[1] - r - 7}`} />
        </g>
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
      <Board x={36} y={160} w={148} h={56} lines={[state === 'reformed' ? '1/2 + 1/3 = 5/6' : '1/2 + 1/3 = 2/5']} size={19} state={state === 'reformed' ? 'smug' : state} id={`${id}s`} tilt={-3} />
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
      {(state === 'smug' || state === 'reformed') && <path d={state === 'reformed' ? 'M102,130 Q111,137 120,130' : 'M100,130 Q112,136 122,128'} fill="none" stroke={INK} strokeWidth="3.6" strokeLinecap="round" />}
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
          <Board x={124} y={22} w={94} h={56} lines={state === 'reformed' ? ['A PAUSE', '≠ A COMMA'] : ['I PAUSED,', 'SO COMMA']} size={12.5} state={state === 'cracked' ? 'cracked' : 'smug'} id={`${id}s`} />
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
            {state === 'reformed' ? '2x = 20 − 6' : '2x = 20 + 6'}
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

// Club variant: Duke behind a DJ booth whose neon sign reads the misconception.
function DJBooth({ state, id }) {
  const ko = state === 'ko'
  const cracked = state === 'cracked'
  return (
    <g>
      <defs>
        <filter id={`${id}nglow`} x="-20%" y="-60%" width="140%" height="220%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      {/* turntables */}
      {[70, 150].map((x) => (
        <g key={x}>
          <ellipse cx={x} cy="152" rx="26" ry="8" fill="#0F0C1E" stroke={INK} strokeWidth="3" />
          <ellipse cx={x} cy="151" rx="9" ry="3" fill="#FF3FD8" />
        </g>
      ))}
      <rect x="26" y="154" width="168" height="84" rx="10" fill="#1A1530" stroke={INK} strokeWidth="4.4" />
      <path d="M30,160 H190" stroke="#2FF3FF" strokeWidth="3" strokeLinecap="round" />
      <path d="M30,232 H190" stroke="#FF3FD8" strokeWidth="3" strokeLinecap="round" />
      {/* neon sign: glows when smug, flickers + cracks when hit, half goes dark on K.O. */}
      <g opacity={cracked ? 0.75 : 1}>
        <text x="110" y="206" textAnchor="middle" fontFamily={FONT} fontWeight="900" fontSize="30" fill="#2FF3FF" filter={`url(#${id}nglow)`}>
          △ = b × h
        </text>
        <text x="110" y="206" textAnchor="middle" fontFamily={FONT} fontWeight="900" fontSize="30" fill="#E8FFFF">
          △ = b × h
        </text>
      </g>
      {cracked && <path d="M130,170 l-8,14 10,9 -9,14 6,12" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinejoin="round" opacity="0.9" />}
      {ko && <rect x="110" y="166" width="80" height="60" fill="#1A1530" opacity="0.92" />}
      {ko && <path d="M110,164 l-6,16 8,10 -7,14 6,16" fill="none" stroke={INK} strokeWidth="3.4" strokeLinejoin="round" />}
    </g>
  )
}

// Duke Doublecount (boss id "triangle"): a smug aristocratic peacock in a tiny cape, holding "△ = b × h".
// He claims the whole rectangle every time: his tail fan is a big rectangle. Each hit divides it by two:
// cracked = folded diagonally into a triangle; K.O. = folded flat in half.
function Peacock({ state, id, variant }) {
  const booth = variant === 'club'
  const blue = '#2F62D9'
  const blueShade = '#2147A8'
  const ko = state === 'ko'
  const FAN = 'M48,14 H172 Q198,14 198,40 V124 Q198,150 172,150 H48 Q22,150 22,124 V40 Q22,14 48,14 Z'
  const spots = []
  for (const y of [40, 78, 116]) for (const x of [50, 90, 130, 170]) spots.push([x, y])
  const reformed = state === 'reformed'
  const fanClip =
    state === 'cracked'
      ? 'M18,154 L202,154 L18,10 Z' // half of the rectangle: a triangle
      : ko
        ? 'M18,10 L110,10 L110,154 L18,154 Z' // folded flat in half
        : 'M10,6 H210 V160 H10 Z'
  return (
    <g transform={ko ? 'rotate(-10 110 232)' : undefined}>
      <defs>
        <clipPath id={`${id}fan`}>
          <path d={fanClip} />
        </clipPath>
      </defs>
      {/* the rectangle tail fan */}
      <g transform={ko ? 'translate(0 22) scale(1 0.86)' : reformed ? 'translate(60 106) scale(0.75)' : undefined}>
        {state === 'cracked' && <path d="M22,14 L198,150 L198,40 Q198,14 172,14 Z" fill="#1F8C82" opacity="0.28" />}
        <g clipPath={`url(#${id}fan)`}>
          <V d={FAN} fill="#2FB5A8" shade="#23968B" uid={`${id}f`} sx={-12} sy={-8} />
          {spots.map(([x, y], i) => (
            <path key={`r${i}`} d={`M110,168 L${x},${y}`} stroke="#1F7C73" strokeWidth="2" opacity="0.6" />
          ))}
          {spots.map(([x, y], i) => (
            <g key={i}>
              <ellipse cx={x} cy={y} rx="13" ry="15" fill="#F2C14E" stroke={INK} strokeWidth="2.4" />
              <ellipse cx={x} cy={y + 1} rx="8.5" ry="10.5" fill="#2E7FD6" />
              <ellipse cx={x} cy={y + 2} rx="4.5" ry="6" fill="#1B2560" />
              <circle cx={x - 3} cy={y - 4} r="2" fill="#fff" />
            </g>
          ))}
        </g>
        {state === 'cracked' && <path d="M22,14 L198,150" stroke={INK} strokeWidth="4" strokeLinecap="round" strokeDasharray="10 5" />}
        {(ko || reformed) && <path d="M110,14 L110,150" stroke={INK} strokeWidth="4" strokeLinecap="round" strokeDasharray="10 5" />}
      </g>
      {/* legs */}
      <path d="M98,206 L96,230 M122,206 L124,230" stroke="#E08A2E" strokeWidth="5" strokeLinecap="round" />
      <path d="M88,231 L104,231 M116,231 L132,231" stroke="#E08A2E" strokeWidth="4.5" strokeLinecap="round" />
      {/* body + neck + head */}
      <V d={ell(110, 172, 40, 42)} fill={blue} shade={blueShade} uid={`${id}b`} />
      <V d="M98,150 C96,128 98,112 102,104 L118,104 C122,112 124,128 122,150 Z" fill={blue} shade={blueShade} uid={`${id}n`} />
      <V d={ell(110, 92, 23, 21)} fill={blue} shade={blueShade} uid={`${id}h`} sx={-6} sy={-5} />
      {/* crest */}
      {[[96, 50], [110, 44], [124, 50]].map(([x, y], i) => (
        <g key={i}>
          <path d={`M110,72 L${x},${y}`} stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
          <circle cx={x} cy={y} r="5" fill="#2FB5A8" stroke={INK} strokeWidth="2.4" />
          <circle cx={x} cy={y} r="2" fill="#F2C14E" />
        </g>
      ))}
      <Gloss x={100} y={80} rx={7} ry={3} rot={-35} />
      <BossEyes L={[100, 92]} R={[121, 91]} r={5.5} state={state} lid={blue} />
      <V d="M104,101 L117,101 L110,113 Z" fill="#F2A33A" shade="#D9862A" uid={`${id}bk`} w={3} sx={-3} sy={-2} />
      {/* tiny cape with a gold clasp */}
      <V d="M82,142 Q110,128 138,142 L146,172 Q110,164 74,172 Z" fill="#8B2FC9" shade="#6E1FA6" uid={`${id}cape`} />
      <path d="M84,142 Q110,130 136,142" fill="none" stroke="#F2C14E" strokeWidth="4" strokeLinecap="round" />
      <circle cx="110" cy="136" r="5" fill="#FF5AA5" stroke={INK} strokeWidth="2.4" />
      <ellipse cx="88" cy="160" rx="6" ry="12" transform="rotate(20 88 160)" fill="#fff" opacity="0.4" filter={`url(#${id}gel)`} />
      {booth && <DJBooth state={state} id={id} />}
      {/* the sign */}
      {booth ? null : ko ? (
        <g>
          <path d="M184,236 L178,206" stroke="#8A5A3C" strokeWidth="7" strokeLinecap="round" />
          <Board x={98} y={182} w={100} h={46} lines={['△ = b × h']} size={19} state="ko" id={`${id}s`} />
        </g>
      ) : (
        <g transform={state === 'cracked' ? 'rotate(8 170 190)' : undefined}>
          <path d="M176,236 L176,196" stroke={INK} strokeWidth="9" strokeLinecap="round" />
          <path d="M176,236 L176,196" stroke="#A8724C" strokeWidth="4.5" strokeLinecap="round" />
          <Board x={reformed ? 114 : 122} y={150} w={reformed ? 104 : 94} h={48} lines={[reformed ? '△ = ½ b × h' : '△ = b × h']} size={reformed ? 17 : 19} state={state === 'cracked' ? 'cracked' : 'smug'} id={`${id}s`} />
          <V d={ell(150, 196, 12, 8)} fill={blue} shade={blueShade} uid={`${id}w`} w={3} />
        </g>
      )}
      {state === 'cracked' && <Sweat x={140} y={66} />}
      {ko && <KOStars x={110} y={36} />}
    </g>
  )
}

const ART = { walrus: Walrus, penguin: Penguin, hamster: Hamster, triangle: Peacock }

export function Boss2D({ boss = 'walrus', state, hp, size = 200, className = '', title, variant }) {
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
      <g transform={st === 'reformed' ? 'translate(110 236) scale(0.82) translate(-110 -236)' : undefined}>
        <Art state={st} id={id} variant={variant} />
      </g>
    </svg>
  )
}

export default Boss2D
