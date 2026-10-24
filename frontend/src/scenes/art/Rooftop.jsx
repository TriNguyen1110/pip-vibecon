import { Ink, Line, Gloss, Lg, Rg, Cloud, Stars, Spark, rrect, rng } from '../kit'

// City rooftop show: skyline, water tower, string lights, a small stage with an LED lip.
// Night = the Fame finale / landing hero (Club lasers), day = sunset. Core 390 x 560, feet ~y 498.

const DAY = {
  sky: [[0, '#4B3C9A'], [0.35, '#B85C9E'], [0.62, '#FF8A6B'], [0.8, '#FFC36B'], [1, '#FFE0A0']],
  far: '#8A5A9C', farWin: '#FFD9A0', rim: '#FFB08A', cap: '#7A548E', mid: '#5C3E7E', midWin: '#FFC07A', midInk: '#2E1A44',
  ledge: '#B98AA8', ledgeTop: '#E0B4C4', ledgeInk: '#4A2A50',
  stage: [[0, '#4A3A6E'], [1, '#2E2448']], stageEdge: '#E6E9EF', led: '#2EF2FF', stageInk: '#1C1230',
  tank: '#C98058', tankShade: '#9C5A3E', tankInk: '#4A2414', steel: '#5A3E6E',
  bulb: '#FFE9A0', wire: '#3A2448',
}
const NIGHT = {
  sky: [[0, '#07040F'], [0.45, '#140A26'], [0.75, '#2A1A52'], [1, '#4A2A6E']],
  far: '#1E1440', farWin: '#7B6CFF', rim: '#7B6CFF', cap: '#241A48', mid: '#150D30', midWin: '#FFE14D', midInk: '#07040F',
  ledge: '#2A1E4C', ledgeTop: '#3E3070', ledgeInk: '#07040F',
  stage: [[0, '#1C1233'], [1, '#0C0818']], stageEdge: '#9A96C8', led: '#2EF2FF', stageInk: '#07040F',
  tank: '#5A3A5E', tankShade: '#3A2440', tankInk: '#0C0614', steel: '#241A40',
  bulb: '#FFE9A0', wire: '#07040F',
}

export default function Rooftop({ p, night, lite, wob }) {
  const c = night ? NIGHT : DAY
  return (
    <g>
      <defs>
        <Lg id={`${p}sky`} stops={c.sky} units="userSpaceOnUse" y1={-300} y2={400} />
        <Lg id={`${p}stage`} stops={c.stage} units="userSpaceOnUse" y1={440} y2={530} />
        <Rg id={`${p}sun`} stops={[[0, '#FFFBE0'], [0.6, '#FFD27A'], [1, '#FF9A6B']]} />
        <Rg id={`${p}halo`} stops={[[0, '#FFE6A8', 0.7], [1, '#FF9A6B', 0]]} />
        <Rg id={`${p}bulbG`} stops={[[0, '#FFE9A0', 0.75], [1, '#FFE9A0', 0]]} />
        <Rg id={`${p}spot`} cx={0.5} cy={0} r={1} stops={[[0, '#FFFFFF', 0.32], [0.7, '#FFFFFF', 0.06], [1, '#FFFFFF', 0]]} />
        <Rg id={`${p}pool`} stops={[[0, night ? '#7B6CFF' : '#FFD9A0', night ? 0.4 : 0.35], [1, '#7B6CFF', 0]]} />
        <Rg id={`${p}haze`} stops={[[0, '#7B6CFF', 0.3], [1, '#7B6CFF', 0]]} />
      </defs>

      {/* ---------- sky ---------- */}
      <rect x="-500" y="-500" width="1400" height="960" fill={`url(#${p}sky)`} />
      {night ? (
        <g>
          <Stars seed={5} n={80} y1={230} />
          {!lite && <ellipse cx="195" cy="300" rx="420" ry="120" fill={`url(#${p}haze)`} />}
        </g>
      ) : (
        <g>
          <circle className={lite ? undefined : 'scn-pulse'} cx="156" cy="196" r="130" fill={`url(#${p}halo)`} />
          <circle cx="156" cy="200" r="46" fill={`url(#${p}sun)`} />
          {[214, 224, 233].map((y, i) => <rect key={y} x="108" y={y} width="96" height={2.6 + i * 1.4} fill="#FF9AA8" opacity="0.75" />)}
          <g className={lite ? undefined : 'scn-drift'}>
            <Cloud x={20} y={120} w={110} fill="#FFD0DC" ink="#B2628E" shade="#FFB0C8" o={0.9} />
            <Cloud x={300} y={70} w={80} fill="#FFD0DC" ink="#B2628E" o={0.85} />
            <Cloud x={-300} y={90} w={120} fill="#FFD0DC" ink="#B2628E" o={0.85} />
            <Cloud x={560} y={120} w={110} fill="#FFD0DC" ink="#B2628E" o={0.85} />
          </g>
        </g>
      )}

      {/* night: Club lasers fanning from an off-stage rig (one pulsing group) */}
      {night && !lite && (
        <g className="scn-pulse" style={{ mixBlendMode: 'screen' }}>
          {[[-70, '#2EF2FF'], [-38, '#FF2BD6'], [-8, '#B6FF3B'], [22, '#FF2BD6'], [54, '#2EF2FF']].map(([a, col], i) => (
            <path key={i} d="M195,-40 L192,560 L198,560 Z" fill={col} opacity="0.32" transform={`rotate(${a * 0.6} 195 -40)`} />
          ))}
        </g>
      )}

      <g filter={wob}>
        <Skyline c={c} night={night} />
        <WaterTower x={40} c={c} />
        {/* parapet ledge */}
        <rect x="-500" y="404" width="1400" height="44" fill={c.ledge} />
        <Ink d="M-500,396 H900 V408 H-500 Z" fill={c.ledgeTop} ink={c.ledgeInk} w={2.6} />
        {[-420, -320, -220, -120, -20, 80, 180, 280, 380, 480, 580, 680, 780].map((x) => <Line key={x} d={`M${x},410 V446`} ink={c.ledgeInk} w={1.2} o={0.3} />)}
        {/* light pole for the string lights */}
        <rect x="376" y="196" width="6" height="210" fill={c.steel} />
        <Ink d={rrect(370, 190, 18, 10, 4)} fill={c.steel} ink={c.ledgeInk} w={2} />
      </g>

      {/* string lights (one twinkle group) */}
      <StringLights p={p} c={c} lite={lite} night={night} />

      {night && !lite && (
        <g className="scn-pulse" style={{ mixBlendMode: 'screen', animationDuration: '5s' }}>
          <path d="M-60,-30 L-20,-30 L230,560 L-200,560 Z" fill={`url(#${p}spot)`} />
          <path d="M410,-30 L450,-30 L590,560 L160,560 Z" fill={`url(#${p}spot)`} />
        </g>
      )}

      {/* ---------- the stage (floor) ---------- */}
      <g filter={wob}>
        <path d="M-500,452 L900,452 L900,530 L-500,530 Z" fill={`url(#${p}stage)`} />
        <g stroke={night ? '#2A1E4C' : '#5A4A7E'} strokeWidth="1.4" opacity="0.8">
          {[466, 484, 506].map((y) => <path key={y} d={`M-500,${y} H900`} />)}
          {[-900, -500, -150, 195, 540, 890, 1290].map((x) => <path key={x} d={`M${195 + (x - 195) * 0.25},452 L${x},560`} />)}
        </g>
        <Ink d="M-500,446 H900 V454 H-500 Z" fill={c.stageEdge} ink={c.stageInk} w={2.2} />
        {!lite && <ellipse cx="195" cy="494" rx="230" ry="34" fill={`url(#${p}pool)`} />}
        <path d="M-500,520 H900" stroke={c.led} strokeWidth="3" opacity="0.25" />
        {/* LED lip + stage skirt */}
        <rect x="-500" y="528" width="1400" height="40" fill={c.stageInk} />
        <rect x="-500" y="526" width="1400" height="6" fill={c.led} />
        {!lite && <rect x="-500" y="518" width="1400" height="20" fill={c.led} opacity="0.18" />}
        <Line d="M-500,532 H900" ink={c.stageInk} w={2} />
        {[-470, -410, -350, -290, -230, -170, -110, -50, 10, 70, 130, 190, 250, 310, 370, 430, 490, 550, 610].map((x) => <circle key={x} cx={x + 30} cy="546" r="2.2" fill={c.led} opacity="0.5" />)}
      </g>

      {/* ---------- foreground props ---------- */}
      <g filter={wob}>
        <Monitor x={30} y={546} night={night} />
        <FlightCase x={358} y={520} night={night} />
      </g>
      {!night && <Spark x={330} y={210} r={7} fill="#FFF6C8" o={0.9} />}
      {night && <Spark x={86} y={70} r={7} fill="#B6FF3B" />}
    </g>
  )
}

function Skyline({ c, night }) {
  const r = rng(13)
  const far = []
  let x = -520
  while (x < 900) {
    const w = 34 + Math.floor(r() * 40)
    const h = 70 + Math.floor(r() * 120)
    far.push([x, w, h])
    x += w + 4
  }
  const mid = [[-470, 80, 150], [-370, 60, 210], [-290, 90, 120], [-180, 70, 180], [120, 64, 150], [196, 86, 210], [292, 60, 130], [450, 90, 200], [560, 70, 140], [650, 90, 230], [760, 80, 160]]
  return (
    <g>
      {far.map(([bx, w, h], i) => (
        <g key={i}>
          <rect x={bx} y={400 - h} width={w} height={h} fill={c.far} />
          {r() > 0.5 && <rect x={bx + w / 2 - 1} y={400 - h - 14} width="2" height="14" fill={c.far} />}
          {Array.from({ length: Math.floor(h / 22) }, (_, j) => (r() > 0.55 ? <rect key={j} x={bx + 6 + (j % 2) * (w - 18)} y={400 - h + 10 + j * 20} width="6" height="8" fill={c.farWin} opacity={night ? 0.7 : 0.45} /> : null))}
        </g>
      ))}
      {mid.map(([bx, w, h], i) => (
        <g key={`m${i}`}>
          <Ink d={`M${bx},400 V${400 - h} H${bx + w} V400 Z`} fill={c.mid} ink={c.midInk} w={2.2} />
          <rect x={bx + 2} y={400 - h + 2} width="5" height={h - 4} fill={c.rim} opacity="0.55" />
          <Ink d={`M${bx - 4},${400 - h - 6} H${bx + w + 4} V${400 - h + 2} H${bx - 4} Z`} fill={c.cap} ink={c.midInk} w={2} />
          {Array.from({ length: Math.floor((h - 20) / 24) }, (_, j) =>
            [0, 1, 2].map((k) => (((i + j + k) * 7) % 5 < 2 ? <rect key={`${j}-${k}`} x={bx + 10 + k * ((w - 28) / 2)} y={400 - h + 14 + j * 24} width="8" height="12" rx="1.5" fill={c.midWin} opacity={night ? 0.9 : 0.75} /> : null)),
          )}
        </g>
      ))}
      {/* antenna with a blinking light on the tallest mid building */}
      <path d="M239,190 V140" stroke={c.midInk} strokeWidth="3" />
      <circle className="scn-blink" cx="239" cy="138" r="4.4" fill="#FF6F61" />
      {/* billboard: Pip's lime thought-bubble mark (our own brand, no real logos) */}
      <g transform="translate(292 230)">
        <path d="M14,40 V60 M46,40 V60" stroke={c.midInk} strokeWidth="3" />
        <Ink d={rrect(0, 0, 60, 42, 6)} fill={night ? '#1C1233' : '#FFF6E6'} ink={c.midInk} w={2.4} />
        <circle cx="22" cy="22" r="9" fill="#B6FF3B" /><circle cx="36" cy="30" r="4" fill="#B6FF3B" /><circle cx="44" cy="34" r="2" fill="#B6FF3B" />
      </g>
    </g>
  )
}

function WaterTower({ x, c }) {
  const ink = c.tankInk
  const tank = `M${x - 52},170 Q${x - 54},250 ${x - 48},262 H${x + 48} Q${x + 54},250 ${x + 52},170 Z`
  return (
    <g>
      {/* legs + cross braces */}
      <g stroke={c.steel} strokeWidth="6" strokeLinecap="round">
        <path d={`M${x - 40},262 L${x - 52},404 M${x + 40},262 L${x + 52},404 M${x - 12},262 L${x - 14},404 M${x + 12},262 L${x + 14},404`} />
      </g>
      <g stroke={c.steel} strokeWidth="2.6">
        <path d={`M${x - 46},300 L${x + 46},350 M${x + 46},300 L${x - 46},350 M${x - 48},350 L${x + 48},398 M${x + 48},350 L${x - 48},398`} />
      </g>
      <Ink d={`M${x - 58},262 H${x + 58} V270 H${x - 58} Z`} fill={c.steel} ink={ink} w={2.2} />
      {/* wooden tank with hoops */}
      <Ink d={tank} fill={c.tank} ink={ink} w={3.4} />
      {[-36, -18, 0, 18, 36].map((dx) => <path key={dx} d={`M${x + dx},172 V262`} stroke={c.tankShade} strokeWidth="2" opacity="0.7" />)}
      {[196, 236].map((y) => <path key={y} d={`M${x - 53},${y} H${x + 53}`} stroke={ink} strokeWidth="3" />)}
      <path d={`M${x + 30},176 Q${x + 36},214 ${x + 30},258`} stroke={c.tankShade} strokeWidth="10" opacity="0.6" fill="none" />
      {/* conical roof */}
      <Ink d={`M${x - 60},172 L${x},120 L${x + 60},172 Z`} fill={c.tankShade} ink={ink} w={3.4} />
      <circle cx={x} cy="118" r="4" fill={c.tankShade} stroke={ink} strokeWidth="2" />
      <Gloss x={x - 30} y={154} rx={10} ry={2.4} rot={-38} o={0.5} dot={false} />
      {/* ladder */}
      <g stroke={c.steel} strokeWidth="2">
        <path d={`M${x + 64},270 V404 M${x + 76},270 V404`} />
        {[284, 300, 316, 332, 348, 364, 380, 396].map((y) => <path key={y} d={`M${x + 64},${y} H${x + 76}`} />)}
      </g>
    </g>
  )
}

function StringLights({ p, c, lite, night }) {
  // two sagging strands: tank -> pole, and off-left -> tank
  const strands = [
    [[96, 196], [379, 196], 64],
    [[-300, 150], [-10, 196], 50],
    [[380, 196], [700, 150], 54],
  ]
  const cols = ['#FFE9A0', '#2EF2FF', '#FFE9A0', '#B6FF3B', '#FFE9A0', '#FF9AE0']
  return (
    <g>
      {strands.map(([[x1, y1], [x2, y2], sag], si) => {
        const mx = (x1 + x2) / 2
        const my = (y1 + y2) / 2 + sag * 2
        const d = `M${x1},${y1} Q${mx},${my} ${x2},${y2}`
        const n = 11
        const bulbs = []
        for (let i = 1; i < n; i++) {
          const t = i / n
          const bx = (1 - t) * (1 - t) * x1 + 2 * t * (1 - t) * mx + t * t * x2
          const by = (1 - t) * (1 - t) * y1 + 2 * t * (1 - t) * my + t * t * y2
          bulbs.push([bx, by + 5, cols[(i + si) % cols.length], i])
        }
        return (
          <g key={si}>
            <path d={d} fill="none" stroke={c.wire} strokeWidth="2" />
            {!lite && (
              <g className={si === 0 ? 'scn-pulse' : undefined} opacity={night ? 1 : 0.6}>
                {bulbs.map(([bx, by, , i]) => <circle key={i} cx={bx} cy={by} r="14" fill={`url(#${p}bulbG)`} />)}
              </g>
            )}
            {bulbs.map(([bx, by, col, i]) => (
              <g key={`b${i}`}>
                <path d={`M${bx},${by - 6} V${by - 3}`} stroke={c.wire} strokeWidth="3" />
                <ellipse cx={bx} cy={by + 1} rx="4" ry="5" fill={col} stroke={c.wire} strokeWidth="1.4" />
                <circle cx={bx - 1.2} cy={by - 0.6} r="1.2" fill="#fff" />
              </g>
            ))}
          </g>
        )
      })}
    </g>
  )
}

function Monitor({ x, y, night }) {
  const ink = '#07040F'
  return (
    <g>
      <Ink d={`M${x - 70},${y + 30} L${x - 56},${y - 26} L${x + 62},${y - 8} L${x + 70},${y + 30} Z`} fill={night ? '#241A40' : '#3A2C5A'} ink={ink} w={3.6} />
      <path d={`M${x - 50},${y - 18} L${x + 56},${y - 2} L${x + 60},${y + 24} L${x - 60},${y + 24} Z`} fill="#141024" />
      <g fill="#2E2848">
        {Array.from({ length: 30 }, (_, i) => <circle key={i} cx={x - 48 + (i % 10) * 11} cy={y - 6 + Math.floor(i / 10) * 9} r="2.4" />)}
      </g>
      <path d={`M${x - 56},${y - 26} L${x + 62},${y - 8}`} stroke="#9A96C8" strokeWidth="2.4" opacity="0.6" />
      <rect x={x + 36} y={y + 16} width="8" height="4" rx="2" fill="#B6FF3B" />
    </g>
  )
}

function FlightCase({ x, y, night }) {
  const ink = '#07040F'
  return (
    <g>
      <Ink d={rrect(x - 40, y - 34, 90, 80, 6)} fill={night ? '#2A2050' : '#3E3266'} ink={ink} w={3.6} />
      <path d={`M${x - 40},${y - 8} H${x + 50}`} stroke="#C9CED8" strokeWidth="5" />
      <path d={`M${x - 40},${y - 8} H${x + 50}`} stroke={ink} strokeWidth="1.4" opacity="0.5" />
      {[[-40, -34], [38, -34]].map(([dx, dy], i) => <rect key={i} x={x + dx} y={y + dy} width="12" height="12" rx="2" fill="#C9CED8" stroke={ink} strokeWidth="1.6" />)}
      {/* stickers */}
      <g transform={`translate(${x - 16} ${y + 16}) rotate(-12)`}><rect x="-12" y="-8" width="24" height="16" rx="4" fill="#B6FF3B" stroke={ink} strokeWidth="1.6" /><path d="M-6,0 H6" stroke={ink} strokeWidth="2" /></g>
      <g transform={`translate(${x + 14} ${y + 22})`}><path d="M0,-10 L3,-3 L10,-3 L4,2 L6,9 L0,5 L-6,9 L-4,2 L-10,-3 L-3,-3 Z" fill="#FFE14D" stroke={ink} strokeWidth="1.6" /></g>
      <Gloss x={x - 26} y={y - 26} rx={10} ry={2} rot={0} o={0.5} />
    </g>
  )
}
