import { Ink, Line, Gloss, Lg, Rg, Spark, rrect, rng } from '../kit'

// Purikura-style sticker photo booth: patterned backdrop, ring light with a dome camera and countdown,
// side curtains, a sticker-frame border, a prop basket. Lookbook cover shoot after a K.O.
// Core 390 x 560, feet ~y 482 (one hero in the middle).

const FONT = "Fredoka, 'Arial Rounded MT Bold', system-ui, sans-serif"

const DAY = {
  back: [[0, '#BFF3FF'], [0.45, '#E6D6FF'], [1, '#FFF1C8']], motif: '#FFFFFF', motif2: '#7B6CFF', ink: '#3A2A6A',
  curtain: '#9A86F0', curtainShade: '#7A64DA', curtainHi: '#C2B4FF',
  floor: [[0, '#FFFFFF'], [1, '#E6E9EF']], floorLine: '#C9CED8',
  frame: '#FFFFFF', frameInk: '#3A2A6A', ringO: 0.9,
}
const NIGHT = {
  back: [[0, '#1C1040'], [0.5, '#2A1652'], [1, '#140A26']], motif: '#2EF2FF', motif2: '#B6FF3B', ink: '#07040F',
  curtain: '#3A1E6A', curtainShade: '#24124A', curtainHi: '#5A3A92',
  floor: [[0, '#2A1E4C'], [1, '#140A26']], floorLine: '#3E3070',
  frame: '#F2ECFF', frameInk: '#07040F', ringO: 1,
}

export default function Photobooth({ p, night, lite, wob }) {
  const c = night ? NIGHT : DAY
  return (
    <g>
      <defs>
        <Lg id={`${p}back`} stops={c.back} units="userSpaceOnUse" y1={-200} y2={470} />
        <Lg id={`${p}floor`} stops={c.floor} units="userSpaceOnUse" y1={466} y2={560} />
        <Lg id={`${p}holo`} x2={1} y2={1} stops={[[0, '#2EF2FF', 0.35], [0.33, '#B6FF3B', 0.25], [0.66, '#FFE14D', 0.25], [1, '#7B6CFF', 0.35]]} />
        <Lg id={`${p}curt`} x2={1} y2={0} stops={[[0, c.curtainShade], [0.35, c.curtain], [0.6, c.curtainHi], [1, c.curtainShade]]} />
        <Rg id={`${p}ringG`} stops={[[0.55, '#FFFFFF', 0], [0.72, '#FFFFFF', 0.55], [0.85, '#E9FDFF', 0.2], [1, '#E9FDFF', 0]]} />
        <Rg id={`${p}wash`} cx={0.5} cy={0.2} r={0.8} stops={[[0, '#FFFFFF', night ? 0.18 : 0.45], [1, '#FFFFFF', 0]]} />
      </defs>

      {/* ---------- backdrop panel ---------- */}
      <g filter={wob}>
        <rect x="-500" y="-500" width="1400" height="980" fill={`url(#${p}back)`} />
        <rect x="-500" y="-500" width="1400" height="980" fill={`url(#${p}holo)`} opacity={night ? 0.35 : 0.6} />
        <Motifs c={c} />
      </g>
      {!lite && <ellipse cx="195" cy="300" rx="260" ry="260" fill={`url(#${p}wash)`} />}

      {/* ring light + dome camera + countdown */}
      <g filter={wob}>
        <path d="M195,-300 V40" stroke={c.ink} strokeWidth="6" />
        <Ink d={rrect(150, 36, 90, 14, 6)} fill="#C9CED8" ink={c.ink} w={2.4} />
      </g>
      {!lite && <circle className="scn-pulse" cx="195" cy="138" r="122" fill={`url(#${p}ringG)`} opacity={c.ringO} />}
      <g filter={wob}>
        <circle cx="195" cy="138" r="84" fill="none" stroke={c.ink} strokeWidth="26" />
        <circle cx="195" cy="138" r="84" fill="none" stroke="#F4FBFF" strokeWidth="20" />
        <circle cx="195" cy="138" r="84" fill="none" stroke="#FFFFFF" strokeWidth="8" />
        <path d="M128,98 A84,84 0 0 1 176,56" stroke="#fff" strokeWidth="4" fill="none" opacity="0.9" strokeLinecap="round" transform="translate(-6 -4)" />
        {/* dome camera */}
        <Ink d={rrect(166, 112, 58, 50, 18)} fill={night ? '#2A1E4C' : '#FFFFFF'} ink={c.ink} w={3} />
        <circle cx="195" cy="137" r="16" fill="#1C1233" stroke={c.ink} strokeWidth="2.4" />
        <circle cx="195" cy="137" r="9" fill="#3A2E7A" />
        <circle cx="190" cy="132" r="3.4" fill="#fff" opacity="0.9" />
        <circle cx="214" cy="120" r="3" fill="#FF6F61" />
        {/* countdown screen */}
        <g transform="translate(276 200) rotate(6) scale(0.82)">
          <Ink d={rrect(0, 0, 58, 48, 10)} fill="#1C1233" ink={c.ink} w={3} />
          <rect x="6" y="6" width="46" height="36" rx="6" fill={night ? '#2EF2FF' : '#B6FF3B'} />
          <text x="29" y="35" textAnchor="middle" fontFamily={FONT} fontWeight="700" fontSize="30" fill="#07040F">3</text>
          <Gloss x={14} y={11} rx={6} ry={1.6} rot={0} o={0.8} dot={false} />
        </g>
        {/* speech-bubble sticker "SMILE?" (deadpan Pip joke) */}
        <g transform="translate(62 236) rotate(-8)">
          <Ink d="M0,0 H72 Q80,0 80,8 V30 Q80,38 72,38 H26 L14,50 L16,38 H8 Q0,38 0,30 V8 Q0,0 8,0 Z" fill="#FFFFFF" ink={c.ink} w={3} />
          <text x="40" y="26" textAnchor="middle" fontFamily={FONT} fontWeight="700" fontSize="15" fill="#3A2A6A">SMILE?</text>
        </g>
      </g>

      {/* ---------- floor ---------- */}
      <g filter={wob}>
        <rect x="-500" y="462" width="1400" height="120" fill={`url(#${p}floor)`} />
        <g stroke={c.floorLine} strokeWidth="1.4" opacity="0.8">
          {[476, 496, 524, 560].map((y) => <path key={y} d={`M-500,${y} H900`} />)}
          {[-700, -300, 0, 195, 390, 690, 1090].map((x) => <path key={x} d={`M${195 + (x - 195) * 0.3},462 L${x},580`} />)}
        </g>
        <Line d="M-500,462 H900" ink={c.ink} w={2.6} />
        {/* mark where to stand */}
        <ellipse cx="195" cy="500" rx="86" ry="14" fill="none" stroke={night ? '#B6FF3B' : '#7B6CFF'} strokeWidth="3" strokeDasharray="10 7" opacity="0.8" />
      </g>

      {/* ---------- curtains ---------- */}
      <g filter={wob}>
        <Curtain x0={-500} x1={74} p={p} c={c} side="l" />
        <Curtain x0={316} x1={900} p={p} c={c} side="r" />
        {/* curtain rail */}
        <Ink d={rrect(-500, -26, 1400, 12, 6)} fill="#C9CED8" ink={c.ink} w={2.4} />
      </g>

      {/* ---------- sticker-frame border (foreground) ---------- */}
      <StickerFrame c={c} night={night} lite={lite} />
      <g filter={wob}>
        <PropBasket x={52} y={530} night={night} />
      </g>
    </g>
  )
}

function Motifs({ c }) {
  const r = rng(17)
  const out = []
  for (let k = 0; k < 46; k++) {
    const x = -480 + (k % 12) * 120 + (Math.floor(k / 12) % 2) * 60 + r() * 20
    const y = -160 + Math.floor(k / 12) * 140 + r() * 30
    const t = k % 3
    const col = k % 2 ? c.motif : c.motif2
    if (t === 0) out.push(<path key={k} d={`M${x},${y - 14} Q${x + 3},${y - 3} ${x + 14},${y} Q${x + 3},${y + 3} ${x},${y + 14} Q${x - 3},${y + 3} ${x - 14},${y} Q${x - 3},${y - 3} ${x},${y - 14} Z`} fill={col} opacity="0.7" />)
    else if (t === 1) out.push(<circle key={k} cx={x} cy={y} r="9" fill="none" stroke={col} strokeWidth="3" opacity="0.6" />)
    else out.push(<path key={k} d={`M${x - 10},${y} q5,-8 10,0 t10,0`} stroke={col} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.6" />)
  }
  // checker strip low on the backdrop
  const checks = []
  for (let i = -26; i < 46; i++) checks.push(<rect key={i} x={i * 20} y={i % 2 ? 418 : 438} width="20" height="20" fill={c.motif2} opacity="0.22" />)
  return <g>{out}{checks}</g>
}

function Curtain({ x0, x1, p, c, side }) {
  const w = x1 - x0
  const folds = Math.round(w / 26)
  const tieY = 330
  const inner = side === 'l' ? x1 - 46 : x0 + 46
  // drape: straight at top, gathered toward the outer side at the tie-back, then flares to the floor
  const d = side === 'l'
    ? `M${x0},-20 H${x1} Q${x1 + 6},${tieY - 150} ${x1 - 46},${tieY} Q${x1 - 30},${tieY + 90} ${x1 - 6},560 H${x0} Z`
    : `M${x1},-20 H${x0} Q${x0 - 6},${tieY - 150} ${x0 + 46},${tieY} Q${x0 + 30},${tieY + 90} ${x0 + 6},560 H${x1} Z`
  return (
    <g>
      <defs><clipPath id={`${p}c${side}`}><path d={d} /></clipPath></defs>
      <path d={d} fill={`url(#${p}curt)`} />
      <g clipPath={`url(#${p}c${side})`}>
        {Array.from({ length: folds + 2 }, (_, i) => {
          const fx = x0 + i * 26
          return <path key={i} d={`M${fx},-20 Q${fx + 8},${tieY - 60} ${side === 'l' ? fx - (fx - x0) * 0.1 : fx + (x1 - fx) * 0.1},${tieY} Q${fx},${tieY + 120} ${fx + 4},560`} stroke={i % 2 ? c.curtainShade : c.curtainHi} strokeWidth="7" fill="none" opacity="0.55" />
        })}
      </g>
      <path d={d} fill="none" stroke={c.ink} strokeWidth="3.2" strokeLinejoin="round" />
      {/* tie-back with a chunky tassel */}
      <Ink d={rrect(inner - (side === 'l' ? 52 : 4), tieY - 6, 56, 12, 6)} fill="#FFE14D" ink={c.ink} w={2.6} />
      <circle cx={inner + (side === 'l' ? -30 : 30)} cy={tieY + 14} r="7" fill="#FFE14D" stroke={c.ink} strokeWidth="2.4" />
      <path d={`M${inner + (side === 'l' ? -36 : 24)},${tieY + 20} l-2,18 M${inner + (side === 'l' ? -30 : 30)},${tieY + 21} v20 M${inner + (side === 'l' ? -24 : 36)},${tieY + 20} l2,18`} stroke="#FFB020" strokeWidth="3.4" strokeLinecap="round" />
    </g>
  )
}

function StickerFrame({ c, night, lite }) {
  const ink = c.frameInk
  // scalloped inner edge: a dashed white border + corner stickers
  return (
    <g>
      <rect x="10" y="10" width="370" height="540" rx="26" fill="none" stroke={c.frame} strokeWidth="9" />
      <rect x="10" y="10" width="370" height="540" rx="26" fill="none" stroke={ink} strokeWidth="2.4" />
      <rect x="19" y="19" width="352" height="522" rx="20" fill="none" stroke={ink} strokeWidth="2" strokeDasharray="2 7" strokeLinecap="round" opacity="0.6" />
      {/* corner stickers */}
      <g transform="translate(30 32) rotate(-14)">
        <Ink d="M0,-20 L6,-6 L20,-6 L9,3 L13,18 L0,9 L-13,18 L-9,3 L-20,-6 L-6,-6 Z" fill="#FFE14D" ink={ink} w={3} />
        <circle cx="-4" cy="-1" r="1.8" fill={ink} /><circle cx="4" cy="-1" r="1.8" fill={ink} />
      </g>
      <g transform="translate(362 538) rotate(10)">
        <Ink d={rrect(-34, -14, 68, 28, 14)} fill={night ? '#2EF2FF' : '#B6FF3B'} ink={ink} w={2.8} />
        <text x="0" y="5.5" textAnchor="middle" fontFamily={FONT} fontWeight="700" fontSize="14" fill="#07040F">ICONIC</text>
      </g>
      <g transform="translate(26 300) rotate(-90)">
        <text x="0" y="0" textAnchor="middle" fontFamily={FONT} fontWeight="700" fontSize="12" letterSpacing="3" fill={ink} opacity="0.8">COVER STAR ✦ COVER STAR</text>
      </g>
      <g className={lite ? undefined : 'scn-pulse-fast'}>
        <Spark x={352} y={30} r={11} fill={night ? '#B6FF3B' : '#FFFFFF'} />
        <Spark x={336} y={50} r={5} fill={night ? '#2EF2FF' : '#7B6CFF'} />
        <Spark x={40} y={520} r={7} fill={night ? '#2EF2FF' : '#FFFFFF'} />
      </g>
      <Spark x={120} y={250} r={6} fill="#FFFFFF" o={0.85} />
      <Spark x={290} y={300} r={8} fill="#FFFFFF" o={0.85} />
    </g>
  )
}

function PropBasket({ x, y, night }) {
  const ink = '#3A2A6A'
  return (
    <g>
      {/* star glasses */}
      <g transform={`translate(${x - 8} ${y - 34}) rotate(-16)`}>
        <path d="M-4,0 H4" stroke={ink} strokeWidth="3" />
        {[-16, 16].map((dx) => (
          <path key={dx} d={`M${dx},-12 L${dx + 4},-4 L${dx + 12},-4 L${dx + 6},2 L${dx + 8},10 L${dx},5 L${dx - 8},10 L${dx - 6},2 L${dx - 12},-4 L${dx - 4},-4 Z`} fill="#FF52C8" stroke={ink} strokeWidth="2.4" strokeLinejoin="round" />
        ))}
      </g>
      {/* headband with round ears */}
      <g transform={`translate(${x + 24} ${y - 30}) rotate(14)`}>
        <path d="M-18,8 Q0,-14 18,8" stroke={ink} strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M-18,8 Q0,-14 18,8" stroke="#2EF2FF" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="-12" cy="-6" r="7" fill="#2EF2FF" stroke={ink} strokeWidth="2.4" />
        <circle cx="12" cy="-6" r="7" fill="#2EF2FF" stroke={ink} strokeWidth="2.4" />
      </g>
      {/* basket */}
      <Ink d={`M${x - 44},${y - 22} H${x + 44} L${x + 36},${y + 30} H${x - 36} Z`} fill={night ? '#C98058' : '#F2B880'} ink={ink} w={3.4} />
      {[-30, -15, 0, 15, 30].map((dx) => <path key={dx} d={`M${x + dx},${y - 20} L${x + dx * 0.82},${y + 28}`} stroke="#B07040" strokeWidth="2" />)}
      {[-6, 10].map((dy) => <path key={dy} d={`M${x - 42},${y + dy} H${x + 42}`} stroke="#B07040" strokeWidth="2" />)}
      <Ink d={rrect(x - 48, y - 28, 96, 10, 5)} fill={night ? '#E0A070' : '#FFD0A0'} ink={ink} w={2.6} />
    </g>
  )
}
