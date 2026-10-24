import { Ink, Line, Gloss, Lg, Rg, Spark, rrect, rng } from '../kit'

// Cozy bubble-tea shop: cup-shaped neon sign, menu board with original nonsense drinks, a sweetness board
// in fractions, tapioca jars on the shelf, counter, pastel checker floor. Core 390 x 560, feet ~y 504.

const FONT = "Fredoka, 'Arial Rounded MT Bold', system-ui, sans-serif"

const DAY = {
  wall: '#FFE6CC', stripe: '#FFD9B8', wainscot: '#9FE3D2', wainscotLine: '#6CBFAE', wallInk: '#9A6A5A',
  shelf: '#E9A86E', shelfInk: '#7A4426',
  board: '#2F4A4A', boardEdge: '#E9A86E', chalk: '#FFF8EC', chalk2: '#B6FF3B', chalk3: '#7FF0FF',
  top: '#FFFFFF', topSpeck: ['#FF9A7A', '#7FD6C6', '#B9A6F2'], front: '#B9A6F2', frontLine: '#8E78DC', counterInk: '#4A3A7A',
  floorA: '#FFF6E6', floorB: '#9FDCCB', floorInk: '#6CBFAE',
  neonO: 0.7, window: [[0, '#9FE0FF'], [1, '#DDF6FF']], frame: '#FFFFFF',
}
const NIGHT = {
  wall: '#2C1D4C', stripe: '#26183F', wainscot: '#1E5A5E', wainscotLine: '#2E7A7E', wallInk: '#120A26',
  shelf: '#6A4A8A', shelfInk: '#120A26',
  board: '#122626', boardEdge: '#6A4A8A', chalk: '#F2ECFF', chalk2: '#B6FF3B', chalk3: '#2EF2FF',
  top: '#4A3E7A', topSpeck: ['#FF7FD0', '#2EF2FF', '#B6FF3B'], front: '#4A3A8A', frontLine: '#3A2C70', counterInk: '#0C0820',
  floorA: '#2E2450', floorB: '#1D4A4E', floorInk: '#3A2E66',
  neonO: 1, window: [[0, '#0B0820'], [1, '#2A1A52']], frame: '#5A4A8A',
}

export default function Boba({ p, night, lite, wob }) {
  const c = night ? NIGHT : DAY
  return (
    <g>
      <defs>
        <pattern id={`${p}stripe`} width="28" height="20" patternUnits="userSpaceOnUse">
          <rect width="28" height="20" fill={c.wall} />
          <rect width="12" height="20" fill={c.stripe} />
        </pattern>
        <Lg id={`${p}win`} stops={c.window} />
        <Lg id={`${p}jar`} x2={1} y2={0} stops={[[0, '#FFFFFF', 0.25], [0.3, '#FFFFFF', 0.6], [1, '#C9EEF5', 0.35]]} />
        <Lg id={`${p}front`} stops={[[0, c.front], [1, c.frontLine]]} />
        <Rg id={`${p}glow`} stops={[[0, '#2EF2FF', 0.35], [1, '#2EF2FF', 0]]} />
        <Rg id={`${p}lamp`} cx={0.5} cy={0} r={1} stops={[[0, '#FFF2C2', 0.55], [1, '#FFF2C2', 0]]} />
      </defs>

      {/* ---------- back wall ---------- */}
      <g filter={wob}>
        <rect x="-500" y="-500" width="1400" height="900" fill={`url(#${p}stripe)`} />
        {/* side windows (seen in landscape / wide screens) */}
        <Window x={-330} c={c} p={p} night={night} />
        <Window x={520} c={c} p={p} night={night} />
        {/* mint tile wainscot behind the counter */}
        <rect x="-500" y="296" width="1400" height="110" fill={c.wainscot} />
        <g stroke={c.wainscotLine} strokeWidth="1.4" opacity="0.8">
          {[310, 326, 342, 358].map((y) => <path key={y} d={`M-500,${y} H900`} />)}
          {Array.from({ length: 50 }, (_, i) => -500 + i * 28).map((x, i) => <path key={x} d={`M${x + (i % 2) * 14},296 V406`} strokeDasharray="16 16" strokeDashoffset={i % 2 ? 16 : 0} />)}
        </g>
        <Line d="M-500,296 H900" ink={c.wallInk} w={2.4} />

        {/* pendant lamps */}
        {[60, 300].map((x) => (
          <g key={x}>
            <Line d={`M${x},-400 V-6`} ink={c.wallInk} w={2} />
            {!lite && <ellipse cx={x} cy="40" rx="70" ry="52" fill={`url(#${p}lamp)`} opacity={night ? 0.7 : 0.5} />}
            <Ink d={`M${x - 22},18 Q${x - 20},-6 ${x},-8 Q${x + 20},-6 ${x + 22},18 Z`} fill={night ? '#FFD84A' : '#FF9A7A'} ink={c.wallInk} w={2.6} />
            <ellipse cx={x} cy="18" rx="12" ry="4" fill="#FFF6C8" />
            <Gloss x={x - 10} y={2} rx={5} ry={1.8} rot={-40} o={0.8} dot={false} />
          </g>
        ))}

        {/* menu board (original nonsense drinks) */}
        <g transform="translate(176 34)">
          <Ink d={rrect(0, 0, 204, 156, 12)} fill={c.boardEdge} ink={c.wallInk} w={3} />
          <rect x="8" y="8" width="188" height="140" rx="8" fill={c.board} />
          <text x="102" y="36" textAnchor="middle" fontFamily={FONT} fontWeight="700" fontSize="21" letterSpacing="2" fill={c.chalk2}>SIPS</text>
          <path d="M60,28 l-10,0 M144,28 l10,0" stroke={c.chalk2} strokeWidth="2.4" strokeLinecap="round" />
          {[['BLOOP MILK', '4.5', '#C9A27A'], ['WOBBLE TARO', '5', '#B9A6F2'], ['CLOUD PEACH', '5', '#FFB08A'], ['FIZZ FROG', '4', '#9BE06A']].map(([n, pr, col], i) => (
            <g key={n} transform={`translate(0 ${58 + i * 24})`}>
              <MiniCup x={22} y={-4} col={col} />
              <text x="36" y="0" fontFamily={FONT} fontWeight="600" fontSize="13" fill={c.chalk}>{n}</text>
              <path d={`M${44 + n.length * 7.2},-3 H166`} stroke={c.chalk} strokeWidth="1.6" strokeDasharray="1 4" strokeLinecap="round" opacity="0.7" />
              <text x="184" y="0" textAnchor="end" fontFamily={FONT} fontWeight="700" fontSize="13" fill={c.chalk3}>{pr}</text>
            </g>
          ))}
        </g>
        {/* sweetness board in fractions (familiar boba ritual, no answers) */}
        <g transform="translate(196 202) rotate(-2)">
          <Line d="M30,-14 L44,0 M134,-14 L120,0" ink={c.wallInk} w={1.6} />
          <Ink d={rrect(0, 0, 164, 52, 10)} fill={night ? '#3A2E66' : '#FFFFFF'} ink={c.wallInk} w={2.6} />
          <text x="82" y="17" textAnchor="middle" fontFamily={FONT} fontWeight="700" fontSize="10.5" letterSpacing="1.6" fill={night ? '#DCD5F2' : '#9A6A5A'}>SWEETNESS</text>
          {['0', '¼', '½', '¾', '1'].map((t, i) => (
            <g key={t} transform={`translate(${22 + i * 30} 34)`}>
              <circle r="12" fill={['#FFF6E6', '#FFE6A8', '#FFD27A', '#FFB948', '#FF9A3C'][i]} stroke={c.wallInk} strokeWidth="2" />
              <text y={t.length > 1 || t === '0' || t === '1' ? 5 : 5.6} textAnchor="middle" fontFamily="Manrope, system-ui, sans-serif" fontWeight="800" fontSize={t === '0' || t === '1' ? 13 : 16} fill="#4A2A1A">{t}</text>
            </g>
          ))}
        </g>

        {/* shelf with tapioca jars */}
        <Shelf y={286} x0={-500} x1={186} c={c} />
        {[-150, -90, 18, 74, 132].map((x, i) => <Jar key={x} p={p} x={x} y={286} i={i} c={c} />)}
        <Shelf y={286} x0={404} x1={900} c={c} />
        {[490, 550].map((x, i) => <Jar key={x} p={p} x={x} y={286} i={i + 2} c={c} />)}
        <CupStack x={440} y={286} c={c} />
      </g>

      {/* ---------- neon cup sign (flickers) ---------- */}
      <NeonCup x={84} y={124} lite={lite} o={c.neonO} night={night} p={p} />

      {/* ---------- counter + floor ---------- */}
      <g filter={wob}>
        <rect x="-500" y="384" width="1400" height="72" fill={`url(#${p}front)`} />
        {Array.from({ length: 70 }, (_, i) => -500 + i * 20).map((x) => (
          <g key={x}>
            <rect x={x + 3} y="392" width="10" height="60" rx="5" fill="#fff" opacity={night ? 0.06 : 0.22} />
            <path d={`M${x + 16},392 V452`} stroke={c.frontLine} strokeWidth="1.4" />
          </g>
        ))}
        <Ink d="M-500,370 H900 V388 H-500 Z" fill={c.top} ink={c.counterInk} w={2.8} />
        <Speckles c={c} />
        <Line d="M-500,388 H900" ink={c.counterInk} w={2.2} />
        <rect x="-500" y="388" width="1400" height="8" fill="#000" opacity="0.12" />
        {/* counter-top things at the far edges: bell + straw holder (left), order tablet (right) */}
        <Straws x={-6} y={370} c={c} />
        <Bell x={44} y={370} c={c} />
        <Tablet x={366} y={370} c={c} night={night} />

        <Checker c={c} />
      </g>

      {/* ---------- foreground props ---------- */}
      <g filter={wob}>
        <Stool x={14} y={524} c={c} night={night} />
      </g>
      <g className={lite ? undefined : 'scn-sway'} style={{ transformOrigin: '50% 100%' }}>
        <Monstera x={404} y={566} night={night} />
      </g>
      {night && <Spark x={160} y={64} r={6} fill="#B6FF3B" o={0.8} />}
    </g>
  )
}

function MiniCup({ x, y, col }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-6,-6 L6,-6 L4.6,7 L-4.6,7 Z" fill={col} stroke="#FFF8EC" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M1,-6 L4,-11" stroke="#FFF8EC" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="-2" cy="4.5" r="1.2" fill="#2A1622" /><circle cx="1.5" cy="4.8" r="1.2" fill="#2A1622" />
    </g>
  )
}

function Window({ x, c, p, night }) {
  return (
    <g>
      <Ink d={rrect(x, 40, 180, 230, 16)} fill={c.frame} ink={c.wallInk} w={3} />
      <rect x={x + 10} y="50" width="160" height="210" rx="10" fill={`url(#${p}win)`} />
      {night ? (
        <g>
          {[0, 1, 2, 3].map((i) => <rect key={i} x={x + 22 + i * 38} y={150 - (i % 2) * 30} width="26" height={110 + (i % 2) * 30} fill="#1C1240" />)}
          {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={x + 28 + (i % 4) * 38} y={170 + (i % 3) * 22} width="6" height="6" fill="#FFE14D" opacity="0.8" />)}
        </g>
      ) : (
        <g>
          <path d={`M${x + 10},230 Q${x + 60},200 ${x + 110},222 T${x + 170},214 V260 H${x + 10} Z`} fill="#8FD9A8" />
          <circle cx={x + 130} cy="92" r="20" fill="#FFF2A8" />
        </g>
      )}
      <path d={`M${x + 90},50 V260 M${x + 10},150 H${x + 170}`} stroke={c.frame} strokeWidth="6" />
      <path d={`M${x + 24},70 L${x + 60},62`} stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.6" />
    </g>
  )
}

function Shelf({ y, x0, x1, c }) {
  return (
    <g>
      <Ink d={`M${x0},${y} H${x1} V${y + 10} H${x0} Z`} fill={c.shelf} ink={c.shelfInk} w={2.6} />
      <rect x={x0} y={y + 10} width={x1 - x0} height="5" fill="#000" opacity="0.12" />
    </g>
  )
}

const LIDS = ['#B6FF3B', '#2EF2FF', '#FF9A3C', '#B9A6F2', '#FFD84A']
const PEARLS = ['#4A2A2E', '#6A3E26', '#3A2430', '#7A4A6A', '#4A3050']

function Jar({ x, y, i, p }) {
  const r = rng(30 + i)
  const ink = '#4A3A6A'
  const h = 52 + (i % 2) * 8
  const top = y - h
  const pearls = []
  for (let k = 0; k < 26; k++) pearls.push([x - 14 + r() * 28, y - 7 - r() * (h * 0.62)])
  return (
    <g>
      <Ink d={rrect(x - 21, top, 42, h, 10)} fill="#EAF8FB" ink={ink} w={2.6} fillOpacity={0.5} />
      {pearls.map(([px, py], k) => <circle key={k} cx={px} cy={py} r="4.6" fill={PEARLS[i % 5]} stroke="#1A0F18" strokeWidth="0.8" />)}
      {pearls.slice(0, 8).map(([px, py], k) => <circle key={`h${k}`} cx={px - 1.4} cy={py - 1.6} r="1.3" fill="#fff" opacity="0.7" />)}
      <rect x={x - 21} y={top} width="42" height={h} rx="10" fill={`url(#${p}jar)`} opacity="0.55" />
      <Ink d={rrect(x - 23, top - 10, 46, 13, 5)} fill={LIDS[i % 5]} ink={ink} w={2.6} />
      <circle cx={x + 10} cy={top - 4} r="3" fill="#fff" opacity="0.8" />
      <Gloss x={x - 12} y={top + 30} rx={2} ry={9} rot={0} o={0.75} dot={false} />
    </g>
  )
}

function CupStack({ x, y }) {
  const ink = '#4A3A6A'
  return (
    <g>
      {[0, 1, 2, 3].map((i) => (
        <Ink key={i} d={`M${x - 13},${y - 46 - i * 7} H${x + 13} L${x + 10},${y - i * 0} H${x - 10} Z`} fill="#FFFFFF" ink={ink} w={2.2} fillOpacity={0.95} />
      ))}
      <path d={`M${x - 11},${y - 30} H${x + 11}`} stroke="#B6FF3B" strokeWidth="3" />
      <Gloss x={x - 6} y={y - 40} rx={1.6} ry={8} rot={0} o={0.8} dot={false} />
    </g>
  )
}

function NeonCup({ x, y, lite, o, night, p }) {
  // cup body, dome lid, angled straw, pearls; a tube = wide faint + mid + bright core (no blur filter)
  const cup = 'M-34,-26 L34,-26 L26,58 Q24,66 16,66 L-16,66 Q-24,66 -26,58 Z'
  const lid = 'M-38,-26 Q-38,-58 0,-58 Q38,-58 38,-26 Z'
  const straw = 'M10,-58 L26,-96 L40,-92'
  const tube = (d, col, wc = 3.6) => (
    <g>
      {!lite && <path d={d} fill="none" stroke={col} strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" opacity={0.12 * o} />}
      <path d={d} fill="none" stroke={col} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" opacity={0.35 * o + 0.1} />
      <path d={d} fill="none" stroke={mixWhite(col)} strokeWidth={wc} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  )
  return (
    <g transform={`translate(${x} ${y})`}>
      {!lite && <ellipse cx="0" cy="0" rx="110" ry="120" fill={`url(#${p}glow)`} opacity={night ? 1 : 0.5} />}
      {/* backplate */}
      {night && <rect x="-66" y="-112" width="132" height="200" rx="14" fill="#120A26" opacity="0.55" />}
      {!night && <g stroke="#9A6A5A" strokeWidth="1.6" opacity="0.6"><path d="M-40,-112 L-30,-96 M40,-112 L30,-96" /></g>}
      <g className={lite ? undefined : 'scn-flicker'}>
        {tube(cup, '#2EF2FF')}
        {tube(lid, '#2EF2FF')}
        {tube(straw, '#B6FF3B')}
        {tube('M-26,6 Q0,14 26,6', '#2EF2FF', 2.6)}
        {[[-14, 44], [2, 48], [16, 40], [-4, 32], [10, 26]].map(([px, py], i) => (
          <g key={i}>
            {!lite && <circle cx={px} cy={py} r="9" fill="#FF52C8" opacity={0.18 * o} />}
            <circle cx={px} cy={py} r="4.6" fill="#FFC2EE" stroke="#FF52C8" strokeWidth="2.4" />
          </g>
        ))}
      </g>
    </g>
  )
}

function mixWhite(col) {
  return col === '#2EF2FF' ? '#D8FDFF' : col === '#B6FF3B' ? '#EFFFD0' : '#FFE0F6'
}

function Speckles({ c }) {
  const r = rng(9)
  return (
    <g>
      {Array.from({ length: 120 }, (_, i) => (
        <circle key={i} cx={-500 + r() * 1400} cy={373 + r() * 12} r={0.8 + r() * 1.3} fill={c.topSpeck[i % 3]} opacity="0.8" />
      ))}
    </g>
  )
}

function Bell({ x, y }) {
  const ink = '#4A3A6A'
  return (
    <g>
      <Ink d={`M${x - 14},${y} H${x + 14} V${y - 4} H${x - 14} Z`} fill="#7C6CCF" ink={ink} w={2.2} />
      <Ink d={`M${x - 11},${y - 4} Q${x - 11},${y - 20} ${x},${y - 20} Q${x + 11},${y - 20} ${x + 11},${y - 4} Z`} fill="#FFD84A" ink={ink} w={2.4} />
      <circle cx={x} cy={y - 22} r="2.6" fill="#FFD84A" stroke={ink} strokeWidth="1.6" />
      <Gloss x={x - 5} y={y - 13} rx={1.6} ry={4} rot={20} o={0.8} dot={false} />
    </g>
  )
}

function Straws({ x, y }) {
  const ink = '#4A3A6A'
  return (
    <g>
      {[['#2EF2FF', -8], ['#B6FF3B', -2], ['#FF9A3C', 5], ['#B9A6F2', 10]].map(([col, a], i) => (
        <path key={i} d={`M${x + i * 2 - 3},${y - 20} L${x + a},${y - 58}`} stroke={col} strokeWidth="4" strokeLinecap="round" />
      ))}
      <Ink d={`M${x - 12},${y - 30} H${x + 12} L${x + 10},${y} H${x - 10} Z`} fill="#FFFFFF" ink={ink} w={2.4} fillOpacity={0.9} />
      <path d={`M${x - 10},${y - 18} H${x + 10}`} stroke="#FF52C8" strokeWidth="3" />
    </g>
  )
}

function Tablet({ x, y, night }) {
  const ink = '#2A1E4A'
  return (
    <g>
      <path d={`M${x},${y} L${x + 6},${y - 20}`} stroke={ink} strokeWidth="5" strokeLinecap="round" />
      <g transform={`rotate(-12 ${x} ${y - 30})`}>
        <Ink d={rrect(x - 22, y - 58, 48, 36, 6)} fill="#2A1E4A" ink={ink} w={2.6} />
        <rect x={x - 17} y={y - 53} width="38" height="26" rx="3" fill={night ? '#2EF2FF' : '#B6FF3B'} opacity="0.9" />
        <circle cx={x - 3} cy={y - 43} r="2" fill={ink} /><circle cx={x + 7} cy={y - 43} r="2" fill={ink} />
        <path d={`M${x - 4},${y - 37} Q${x + 2},${y - 33} ${x + 8},${y - 37}`} stroke={ink} strokeWidth="1.8" fill="none" />
      </g>
    </g>
  )
}

// Perspective checker floor (pastel), vanishing point (195, 250).
function Checker({ c }) {
  const rows = [452, 466, 484, 508, 540, 584, 640]
  const cols = Array.from({ length: 31 }, (_, i) => -1300 + i * 110)
  const X = (xb, y) => 195 + (xb - 195) * ((y - 250) / 390)
  const quads = []
  for (let i = 0; i < rows.length - 1; i++) {
    for (let j = 0; j < cols.length - 1; j++) {
      const y0 = rows[i]
      const y1 = rows[i + 1]
      const d = `M${X(cols[j], y0)},${y0} L${X(cols[j + 1], y0)},${y0} L${X(cols[j + 1], y1)},${y1} L${X(cols[j], y1)},${y1} Z`
      quads.push(<path key={`${i}-${j}`} d={d} fill={(i + j) % 2 ? c.floorA : c.floorB} />)
    }
  }
  return (
    <g>
      <rect x="-500" y="452" width="1400" height="200" fill={c.floorA} />
      {quads}
      <rect x="-500" y="452" width="1400" height="10" fill="#000" opacity="0.1" />
      <Line d="M-500,452 H900" ink={c.counterInk} w={2.4} />
    </g>
  )
}

function Stool({ x, y, c, night }) {
  const ink = c.counterInk
  return (
    <g>
      <path d={`M${x - 26},${y + 8} L${x - 34},${y + 60} M${x + 26},${y + 8} L${x + 34},${y + 60} M${x},${y + 10} V${y + 60}`} stroke={night ? '#9A96C8' : '#C9CED8'} strokeWidth="6" strokeLinecap="round" />
      <path d={`M${x - 26},${y + 8} L${x - 34},${y + 60} M${x + 26},${y + 8} L${x + 34},${y + 60}`} stroke={ink} strokeWidth="1.6" fill="none" opacity="0.6" />
      <Ink d={`M${x - 44},${y} Q${x - 44},${y - 16} ${x},${y - 16} Q${x + 44},${y - 16} ${x + 44},${y} Q${x + 44},${y + 12} ${x},${y + 12} Q${x - 44},${y + 12} ${x - 44},${y} Z`} fill={night ? '#FF7A5C' : '#FF9A7A'} ink={ink} w={3.4} />
      <ellipse cx={x} cy={y - 5} rx="36" ry="7" fill="#fff" opacity="0.25" />
      <Gloss x={x - 18} y={y - 9} rx={10} ry={2.4} rot={-6} o={0.8} />
    </g>
  )
}

function Monstera({ x, y, night }) {
  const ink = night ? '#0E2A20' : '#1F5A3E'
  const leaf = night ? '#2E7A5A' : '#4FBF7A'
  const leafD = (s) => `M0,0 C${-30 * s},${-20 * s} ${-44 * s},${-70 * s} ${-14 * s},${-96 * s} C${6 * s},${-110 * s} ${34 * s},${-86 * s} ${30 * s},${-56 * s} C${28 * s},${-30 * s} ${14 * s},${-12 * s} 0,0 Z`
  return (
    <g transform={`translate(${x} ${y}) scale(0.78)`}>
      <g transform="rotate(-30)">
        <Ink d={leafD(1)} fill={leaf} ink={ink} w={3.4} />
        <path d="M0,0 Q-6,-50 -6,-92" stroke={ink} strokeWidth="2" fill="none" />
        <path d="M-4,-40 L-26,-52 M-6,-62 L-28,-78 M-2,-34 L18,-50 M-4,-58 L18,-74" stroke={night ? '#0A1E16' : '#2E8A58'} strokeWidth="5" strokeLinecap="round" />
      </g>
      <g transform="rotate(-62) scale(0.8)">
        <Ink d={leafD(1)} fill={leaf} ink={ink} w={3.6} />
        <path d="M0,0 Q-6,-50 -6,-92" stroke={ink} strokeWidth="2" fill="none" />
      </g>
      <Ink d="M-30,0 L-24,-36 H24 L30,0 Z" fill={night ? '#B9A6F2' : '#FFF6E6'} ink={ink} w={3.4} />
      <path d="M-26,-26 H26" stroke="#FF9A7A" strokeWidth="5" />
    </g>
  )
}
