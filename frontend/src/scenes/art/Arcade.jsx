import { Ink, Line, Gloss, Lg, Rg, Spark, rrect, rng } from '../kit'

// Neon arcade: two claw machines full of plushies, a row of cabinets with original pixel-art screens,
// cosmic carpet, a curl of prize tickets in the foreground. Core 390 x 560, feet ~y 504.

const FONT = "Fredoka, 'Arial Rounded MT Bold', system-ui, sans-serif"

const DAY = {
  wall: [[0, '#4A3A9E'], [1, '#7A62CE']], ceil: '#3A2C86', ink: '#1E1450',
  cab: '#4E3EA6', cabSide: '#3A2C86', bezel: '#1E1450', screenBg: '#13243A',
  carpet: [[0, '#3A2C86'], [1, '#2A1E6A']], neonO: 0.75,
  frameL: '#2EC9DF', frameR: '#FF9A3C', base: '#5A48B4',
}
const NIGHT = {
  wall: [[0, '#07040F'], [1, '#1C1040']], ceil: '#05030C', ink: '#05030C',
  cab: '#241A52', cabSide: '#170F3A', bezel: '#07040F', screenBg: '#0A1424',
  carpet: [[0, '#140A2E'], [1, '#0C0620']], neonO: 1,
  frameL: '#17A8BE', frameR: '#E0742A', base: '#2C2066',
}

// Original 8x8 pixel sprites (0 = empty). Palettes per screen.
const SPRITES = {
  frog: ['..1111..', '.122221.', '12322321', '12222221', '.122221.', '..2442..', '.22..22.', '........'],
  rocket: ['...11...', '..1221..', '..1231..', '..1221..', '.112211.', '1.1221.1', '...44...', '..4..4..'],
  capy: ['.1....1.', '.111111.', '11311311', '11111111', '11222211', '.112211.', '.111111.', '........'],
  star: ['...11...', '...11...', '11111111', '.111111.', '..1331..', '.11..11.', '.1....1.', '........'],
  heart: ['........', '.11..11.', '12211221', '12222221', '.122221.', '..1221..', '...11...', '........'],
}
const SPAL = {
  frog: { 1: '#B6FF3B', 2: '#5FD45A', 3: '#07040F', 4: '#FF52C8' },
  rocket: { 1: '#FFFFFF', 2: '#2EF2FF', 3: '#FF52C8', 4: '#FFB020' },
  capy: { 1: '#C98A5A', 2: '#F2D2A8', 3: '#07040F' },
  star: { 1: '#FFE14D', 3: '#07040F' },
  heart: { 1: '#FF52C8', 2: '#FF9AE0' },
}

export default function Arcade({ p, night, lite, wob }) {
  const c = night ? NIGHT : DAY
  return (
    <g>
      <defs>
        <Lg id={`${p}wall`} stops={c.wall} units="userSpaceOnUse" y1={-300} y2={440} />
        <Lg id={`${p}carpet`} stops={c.carpet} units="userSpaceOnUse" y1={440} y2={560} />
        <Lg id={`${p}glass`} x2={1} y2={1} stops={[[0, '#CFFBFF', 0.22], [0.5, '#CFFBFF', 0.06], [1, '#CFFBFF', 0.16]]} />
        <Rg id={`${p}scr`} stops={[[0, '#2EF2FF', 0.35], [1, '#2EF2FF', 0]]} />
        <Rg id={`${p}pool`} stops={[[0, '#7B6CFF', 0.45], [1, '#7B6CFF', 0]]} />
      </defs>

      <g filter={wob}>
        <rect x="-500" y="-500" width="1400" height="960" fill={`url(#${p}wall)`} />
        {/* ceiling with converging neon rails */}
        <path d="M-500,-500 H900 V96 L640,96 L195,60 L-250,96 H-500 Z" fill={c.ceil} opacity="0.85" />
        {/* wall decals: big zig-zag + dots */}
        <path d="M-500,140 L-420,110 L-340,140 L-260,110 L-180,140 L-100,110 L-20,140 L60,110 L140,140 L220,110 L300,140 L380,110 L460,140 L540,110 L620,140 L700,110 L780,140 L860,110" fill="none" stroke={night ? '#2A1E5A' : '#9A86E6'} strokeWidth="10" strokeLinejoin="round" opacity="0.7" />
      </g>
      <g className={lite ? undefined : 'scn-flicker'} opacity={c.neonO}>
        <NeonLine d="M-500,96 L-250,96 L195,60 L640,96 L900,96" col="#2EF2FF" lite={lite} />
        <NeonLine d="M-420,40 L195,10 L810,40" col="#FF52C8" lite={lite} />
      </g>

      <g filter={wob}>
        {/* back row of cabinets */}
        {[-330, -230, 126, 206, 560, 660].map((x, i) => (
          <Cabinet key={x} x={x} y={156} c={c} sprite={['heart', 'star', 'frog', 'rocket', 'capy', 'heart'][i]} title={['BLIP', 'ZOOM', 'HOP!', 'ZAP', 'CAPY', 'BLOOP'][i]} hue={['#FF52C8', '#FFE14D', '#B6FF3B', '#2EF2FF', '#FF9A3C', '#7B6CFF'][i]} night={night} lite={lite} blink={i === 3} />
        ))}

        {/* carpet: cosmic pattern in perspective */}
        <rect x="-500" y="438" width="1400" height="170" fill={`url(#${p}carpet)`} />
        <Carpet night={night} />
        {!lite && <ellipse cx="195" cy="500" rx="260" ry="50" fill={`url(#${p}pool)`} />}
        <Line d="M-500,438 H900" ink={c.ink} w={3} />
        <rect x="-500" y="438" width="1400" height="5" fill={night ? '#2EF2FF' : '#B6FF3B'} opacity="0.5" />

        {/* claw machines */}
        <ClawMachine x={-26} c={c} frame={c.frameL} p={p} night={night} title="GRAB!" seed={3} />
        <ClawMachine x={274} c={c} frame={c.frameR} p={p} night={night} title="WIN!" seed={8} />
      </g>
      {/* hanging claws (one sways) */}
      <Claw x={60} y={168} len={58} cls={lite ? undefined : 'scn-sway'} />
      <Claw x={366} y={168} len={36} />

      {/* ---------- foreground ---------- */}
      <g filter={wob}>
        <Tickets />
        <Joystick x={372} y={530} night={night} />
      </g>
      {night && <Spark x={186} y={120} r={6} fill="#B6FF3B" o={0.9} />}
      {night && <Spark x={330} y={400} r={4} fill="#2EF2FF" o={0.9} />}
    </g>
  )
}

function NeonLine({ d, col, lite }) {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {!lite && <path d={d} stroke={col} strokeWidth="16" opacity="0.14" />}
      <path d={d} stroke={col} strokeWidth="7" opacity="0.45" />
      <path d={d} stroke="#F2FEFF" strokeWidth="2.6" />
    </g>
  )
}

function Pixel({ name, x, y, s }) {
  const rows = SPRITES[name]
  const pal = SPAL[name]
  const out = []
  rows.forEach((row, j) => [...row].forEach((ch, i) => {
    if (ch !== '.') out.push(<rect key={`${i}-${j}`} x={x + i * s} y={y + j * s} width={s + 0.3} height={s + 0.3} fill={pal[ch]} />)
  }))
  return <g>{out}</g>
}

function Cabinet({ x, y, c, sprite, title, hue, night, lite, blink }) {
  const w = 76
  const ink = c.ink
  return (
    <g>
      {/* body silhouette: marquee top, angled screen, control shelf, base */}
      <Ink d={`M${x},${y} H${x + w} V${y + 34} L${x + w + 4},${y + 120} L${x + w + 8},${y + 132} V${y + 282} H${x - 8} V${y + 132} L${x - 4},${y + 120} L${x},${y + 34} Z`} fill={c.cab} ink={ink} w={3} />
      <rect x={x + w - 8} y={y + 36} width="8" height="246" fill={c.cabSide} opacity="0.6" />
      {/* marquee */}
      <Ink d={rrect(x + 4, y + 4, w - 8, 26, 5)} fill={hue} ink={ink} w={2.4} />
      <text x={x + w / 2} y={y + 23} textAnchor="middle" fontFamily={FONT} fontWeight="700" fontSize="14" letterSpacing="1" fill="#07040F">{title}</text>
      {/* screen */}
      <Ink d={rrect(x + 6, y + 40, w - 12, 64, 8)} fill={c.bezel} ink={ink} w={2.4} />
      <rect x={x + 11} y={y + 45} width={w - 22} height="54" rx="5" fill={c.screenBg} />
      <g className={blink && !lite ? 'scn-blink' : undefined}>
        <Pixel name={sprite} x={x + w / 2 - 20} y={y + 52} s={5} />
      </g>
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((k) => <rect key={k} x={x + 11} y={y + 46 + k * 6} width={w - 22} height="1.2" fill="#000" opacity="0.25" />)}
      <Gloss x={x + 20} y={y + 52} rx={8} ry={2} rot={-20} o={0.5} dot={false} />
      {/* control shelf: stick + buttons */}
      <Ink d={`M${x - 4},${y + 120} H${x + w + 4} L${x + w + 8},${y + 132} H${x - 8} Z`} fill={night ? '#3A2C7A' : '#6A58C4'} ink={ink} w={2.4} />
      <path d={`M${x + 18},${y + 124} V${y + 112}`} stroke={ink} strokeWidth="3" strokeLinecap="round" />
      <circle cx={x + 18} cy={y + 110} r="5" fill="#FF52C8" stroke={ink} strokeWidth="2" />
      <circle cx={x + 44} cy={y + 125} r="4" fill="#B6FF3B" stroke={ink} strokeWidth="1.8" />
      <circle cx={x + 56} cy={y + 124} r="4" fill="#2EF2FF" stroke={ink} strokeWidth="1.8" />
      {/* coin door */}
      <Ink d={rrect(x + 22, y + 190, 32, 40, 4)} fill={night ? '#170F3A' : '#3A2C86'} ink={ink} w={2.2} />
      <rect x={x + 30} y={y + 200} width="4" height="12" rx="2" fill={hue} />
      <rect x={x + 42} y={y + 200} width="4" height="12" rx="2" fill={hue} />
    </g>
  )
}

const PLUSH = ['#C98A5A', '#5FD45A', '#FFE14D', '#FF9AE0', '#2EF2FF', '#B9A6F2', '#FF9A3C']

function ClawMachine({ x, c, frame, p, night, title, seed }) {
  const w = 140
  const ink = c.ink
  const r = rng(seed)
  const plush = []
  for (let k = 0; k < 9; k++) plush.push([x + 22 + r() * (w - 44), 318 - r() * 30 - (k % 3) * 6, PLUSH[Math.floor(r() * PLUSH.length)], k])
  return (
    <g>
      {/* header */}
      <Ink d={rrect(x, 104, w, 50, 14)} fill={frame} ink={ink} w={3.4} />
      <rect x={x + 14} y={114} width={w - 28} height="30" rx="8" fill={night ? '#07040F' : '#1E1450'} />
      <text x={x + w / 2} y={137} textAnchor="middle" fontFamily={FONT} fontWeight="700" fontSize="22" letterSpacing="2" fill={night ? '#FFE14D' : '#FFF3A0'} stroke={night ? '#FF9A3C' : 'none'} strokeWidth="0.8">{title}</text>
      {[0, 1, 2, 3, 4, 5].map((k) => <circle key={k} cx={x + 14 + k * 22.4} cy={108} r="2.6" fill="#FFF6C8" />)}
      {/* glass box */}
      <Ink d={`M${x + 4},154 H${x + w - 4} V340 H${x + 4} Z`} fill={night ? '#120B2E' : '#3A2C86'} ink={ink} w={3} />
      <path d={`M${x + 10},170 H${x + w - 10}`} stroke={night ? '#9A96C8' : '#C9CED8'} strokeWidth="4" />
      {/* plush pile */}
      {plush.map(([px, py, col, k]) => <Plush key={k} x={px} y={py} col={col} k={k} />)}
      <rect x={x + 4} y={154} width={w - 8} height="186" fill={`url(#${p}glass)`} />
      <path d={`M${x + 18},170 L${x + 56},300`} stroke="#fff" strokeWidth="6" opacity="0.18" strokeLinecap="round" />
      <path d={`M${x + 34},170 L${x + 50},220`} stroke="#fff" strokeWidth="3" opacity="0.4" strokeLinecap="round" />
      {/* frame posts */}
      <Ink d={`M${x},150 H${x + 10} V344 H${x} Z`} fill={frame} ink={ink} w={2.6} />
      <Ink d={`M${x + w - 10},150 H${x + w} V344 H${x + w - 10} Z`} fill={frame} ink={ink} w={2.6} />
      {/* base with prize chute */}
      <Ink d={rrect(x - 4, 338, w + 8, 104, 10)} fill={c.base} ink={ink} w={3.4} />
      <Ink d={rrect(x + 16, 360, 52, 44, 8)} fill="#07040F" ink={ink} w={2.4} />
      <path d={`M${x + 20},372 H${x + 64}`} stroke={frame} strokeWidth="3" opacity="0.8" />
      <Ink d={rrect(x + 96, 362, 40, 26, 6)} fill={night ? '#170F3A' : '#3A2C86'} ink={ink} w={2.2} />
      <circle cx={x + 108} cy={375} r="5" fill="#B6FF3B" stroke={ink} strokeWidth="1.6" />
      <circle cx={x + 124} cy={375} r="5" fill="#FF52C8" stroke={ink} strokeWidth="1.6" />
      <Gloss x={x + 18} y={346} rx={14} ry={2.6} rot={0} o={0.5} />
    </g>
  )
}

function Plush({ x, y, col, k }) {
  const ink = '#2A1640'
  const ears = k % 3 !== 1
  return (
    <g>
      {ears && <circle cx={x - 9} cy={y - 12} r="5" fill={col} stroke={ink} strokeWidth="2" />}
      {ears && <circle cx={x + 9} cy={y - 12} r="5" fill={col} stroke={ink} strokeWidth="2" />}
      <ellipse cx={x} cy={y} rx="16" ry="14" fill={col} stroke={ink} strokeWidth="2.2" />
      <circle cx={x - 5} cy={y - 2} r="1.8" fill={ink} /><circle cx={x + 5} cy={y - 2} r="1.8" fill={ink} />
      <path d={`M${x - 3},${y + 3} Q${x},${y + 5} ${x + 3},${y + 3}`} stroke={ink} strokeWidth="1.4" fill="none" />
      <ellipse cx={x - 6} cy={y - 7} rx="4" ry="2" fill="#fff" opacity="0.5" />
    </g>
  )
}

function Claw({ x, y, len, cls }) {
  const ink = '#1E1450'
  return (
    <g className={cls}>
      <path d={`M${x},${y} V${y + len}`} stroke="#C9CED8" strokeWidth="2.4" />
      <Ink d={rrect(x - 9, y + len, 18, 10, 3)} fill="#E6E9EF" ink={ink} w={2} />
      <path d={`M${x - 6},${y + len + 10} Q${x - 18},${y + len + 22} ${x - 8},${y + len + 32} M${x + 6},${y + len + 10} Q${x + 18},${y + len + 22} ${x + 8},${y + len + 32} M${x},${y + len + 10} V${y + len + 30}`} stroke={ink} strokeWidth="5.4" fill="none" strokeLinecap="round" />
      <path d={`M${x - 6},${y + len + 10} Q${x - 18},${y + len + 22} ${x - 8},${y + len + 32} M${x + 6},${y + len + 10} Q${x + 18},${y + len + 22} ${x + 8},${y + len + 32} M${x},${y + len + 10} V${y + len + 30}`} stroke="#E6E9EF" strokeWidth="2.6" fill="none" strokeLinecap="round" />
    </g>
  )
}

function Carpet({ night }) {
  const r = rng(21)
  const cols = ['#2EF2FF', '#B6FF3B', '#FF52C8', '#FFE14D', '#7B6CFF']
  const items = []
  for (let k = 0; k < 90; k++) {
    const y = 446 + Math.pow(r(), 1.3) * 120
    const x = -480 + r() * 1360
    const s = 0.45 + ((y - 440) / 120) * 0.9
    const col = cols[k % 5]
    const t = k % 4
    const tr = `translate(${x} ${y}) scale(${s} ${s * 0.55})`
    if (t === 0) items.push(<path key={k} transform={tr} d="M-12,0 q6,-8 12,0 t12,0" stroke={col} strokeWidth="3.4" fill="none" strokeLinecap="round" />)
    else if (t === 1) items.push(<g key={k} transform={tr}><circle r="7" fill={col} /><ellipse rx="14" ry="4" fill="none" stroke={col} strokeWidth="2.4" transform="rotate(-18)" /></g>)
    else if (t === 2) items.push(<path key={k} transform={tr} d="M0,-8 L2.4,-2.4 L8,0 L2.4,2.4 L0,8 L-2.4,2.4 L-8,0 L-2.4,-2.4 Z" fill={col} />)
    else items.push(<path key={k} transform={tr} d="M-7,5 L0,-7 L7,5 Z" fill="none" stroke={col} strokeWidth="2.6" strokeLinejoin="round" />)
  }
  return <g opacity={night ? 0.75 : 0.55}>{items}</g>
}

function Tickets() {
  const ink = '#7A3A1A'
  const pts = [[-30, 548], [10, 530], [44, 540], [70, 556], [94, 572]]
  return (
    <g>
      {pts.slice(0, -1).map(([x, y], i) => {
        const [x2, y2] = pts[i + 1]
        const a = (Math.atan2(y2 - y, x2 - x) * 180) / Math.PI
        const len = Math.hypot(x2 - x, y2 - y)
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${a})`}>
            <Ink d={`M0,-9 H${len} V9 H0 Z`} fill={i % 2 ? '#FFD84A' : '#FFC23A'} ink={ink} w={2.4} />
            <circle cx={len / 2} cy="0" r="3.4" fill="none" stroke={ink} strokeWidth="1.6" />
            <path d={`M${len},-9 V9`} stroke={ink} strokeWidth="1.4" strokeDasharray="2 2" />
          </g>
        )
      })}
    </g>
  )
}

function Joystick({ x, y, night }) {
  const ink = '#1E1450'
  return (
    <g>
      <Ink d={`M${x - 46},${y + 40} L${x - 36},${y} H${x + 50} L${x + 60},${y + 40} Z`} fill={night ? '#3A2C7A' : '#6A58C4'} ink={ink} w={3.6} />
      <path d={`M${x - 34},${y + 4} H${x + 48}`} stroke="#fff" strokeWidth="2.4" opacity="0.4" />
      <path d={`M${x - 10},${y + 8} L${x - 16},${y - 30}`} stroke={ink} strokeWidth="7" strokeLinecap="round" />
      <path d={`M${x - 10},${y + 8} L${x - 16},${y - 30}`} stroke="#C9CED8" strokeWidth="3.4" strokeLinecap="round" />
      <Ink d={`M${x - 16},${y - 30} m-12,0 a12,12 0 1,0 24,0 a12,12 0 1,0 -24,0`} fill="#FF52C8" ink={ink} w={3} />
      <Gloss x={x - 21} y={y - 35} rx={4} ry={2} rot={-30} o={0.85} />
      <Ink d={`M${x + 20},${y + 14} m-9,0 a9,5 0 1,0 18,0 a9,5 0 1,0 -18,0`} fill="#B6FF3B" ink={ink} w={2.6} />
    </g>
  )
}
