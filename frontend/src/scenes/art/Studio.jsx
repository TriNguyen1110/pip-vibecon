import { Ink, Gloss, Lg, Rg, Spark, rrect } from '../kit'

// Recording studio / podcast booth: wedge-foam walls, a glowing ON AIR light, control-room window,
// a mic on a boom arm with a pop filter, round rug. SAT commas mission (pauses & timing).
// Core 390 x 560, feet ~y 504.

const FONT = "Fredoka, 'Arial Rounded MT Bold', system-ui, sans-serif"

const DAY = {
  wall: '#B7A6E6', foamA: '#9C88DA', foamB: '#C8BAF2', foamLine: '#7E68C4', ink: '#2E2058',
  trim: '#E6E0F8', floor: [[0, '#D9A97E'], [1, '#B98660']], plank: '#9C6A48',
  rug: '#2EC9DF', rug2: '#FFE14D', glass: [[0, '#2A1E5A'], [1, '#3A2C7A']],
}
const NIGHT = {
  wall: '#1E1438', foamA: '#170F2E', foamB: '#2A1E4C', foamLine: '#0C0820', ink: '#07040F',
  trim: '#3A2C6A', floor: [[0, '#3A2A4A'], [1, '#22182E']], plank: '#170F22',
  rug: '#1590A8', rug2: '#C9A82A', glass: [[0, '#07040F'], [1, '#140A26']],
}

export default function Studio({ p, night, lite, wob }) {
  const c = night ? NIGHT : DAY
  return (
    <g>
      <defs>
        <pattern id={`${p}foam`} width="80" height="40" patternUnits="userSpaceOnUse">
          <rect width="80" height="40" fill={c.foamA} />
          {[0, 1, 2, 3].map((i) => <rect key={i} x={2} y={3 + i * 9} width="36" height="5" rx="2.5" fill={c.foamB} />)}
          {[0, 1, 2, 3].map((i) => <rect key={`v${i}`} x={43 + i * 9} y={2} width="5" height="36" rx="2.5" fill={c.foamB} />)}
          <path d="M40,0 V40 M0,0 H80" stroke={c.foamLine} strokeWidth="1.6" />
        </pattern>
        <Lg id={`${p}floor`} stops={c.floor} units="userSpaceOnUse" y1={440} y2={560} />
        <Lg id={`${p}glass`} stops={c.glass} />
        <Rg id={`${p}onair`} stops={[[0, '#FF6F61', 0.55], [1, '#FF6F61', 0]]} />
        <Rg id={`${p}lamp`} cx={0.5} cy={0} r={1} stops={[[0, '#FFF2C2', night ? 0.35 : 0.25], [1, '#FFF2C2', 0]]} />
      </defs>

      <g filter={wob}>
        <rect x="-500" y="-500" width="1400" height="960" fill={c.wall} />
        <rect x="-500" y="96" width="1400" height="330" fill={`url(#${p}foam)`} />
        <Ink d="M-500,90 H900 V100 H-500 Z" fill={c.trim} ink={c.ink} w={2.4} />
        <Ink d="M-500,422 H900 V432 H-500 Z" fill={c.trim} ink={c.ink} w={2.4} />
        {/* control-room window */}
        <Ink d={rrect(-150, 124, 250, 170, 14)} fill={c.trim} ink={c.ink} w={3.2} />
        <rect x="-140" y="134" width="230" height="150" rx="8" fill={`url(#${p}glass)`} />
        <Console />
        <path d="M-120,150 L-60,140 M-100,170 L-30,158" stroke="#fff" strokeWidth="5" opacity="0.18" strokeLinecap="round" />
        {/* headphones on a hook + framed "gold record" (original: a lime disc) */}
        <path d="M326,250 v14" stroke={c.ink} strokeWidth="3" />
        <Headphones x={326} y={268} />
        <g transform="translate(320 128)">
          <Ink d={rrect(0, 0, 56, 70, 4)} fill={night ? '#2A1E4C' : '#FFFFFF'} ink={c.ink} w={2.6} />
          <circle cx="28" cy="30" r="18" fill="#B6FF3B" stroke={c.ink} strokeWidth="2" />
          <circle cx="28" cy="30" r="5" fill={c.ink} />
          <path d="M14,24 a16,16 0 0 1 10,-10" stroke="#fff" strokeWidth="2.4" fill="none" opacity="0.8" />
          <rect x="12" y="56" width="32" height="5" rx="2" fill={c.foamLine} />
        </g>
        {/* lamp glow */}
        {!lite && <ellipse cx="195" cy="120" rx="240" ry="200" fill={`url(#${p}lamp)`} />}
      </g>

      {/* ON AIR light (gentle pulse, coral, never a flash) */}
      <g>
        {!lite && <ellipse className="scn-pulse" cx="195" cy="58" rx="110" ry="50" fill={`url(#${p}onair)`} />}
        <Ink d={rrect(130, 34, 130, 46, 12)} fill="#3A0E14" ink={c.ink} w={3.4} />
        <rect x="138" y="41" width="114" height="32" rx="8" fill="#FF6F61" />
        <rect x="138" y="41" width="114" height="12" rx="6" fill="#fff" opacity="0.25" />
        <text x="195" y="65" textAnchor="middle" fontFamily={FONT} fontWeight="700" fontSize="22" letterSpacing="3" fill="#FFF6E0">ON AIR</text>
        <path d="M150,34 V10 M240,34 V10" stroke={c.ink} strokeWidth="3" />
      </g>

      {/* floor + rug */}
      <g filter={wob}>
        <rect x="-500" y="432" width="1400" height="160" fill={`url(#${p}floor)`} />
        <g stroke={c.plank} strokeWidth="1.6" opacity="0.7">
          {[-900, -600, -320, -60, 195, 450, 710, 990, 1290].map((x) => <path key={x} d={`M${195 + (x - 195) * 0.3},432 L${x},600`} />)}
        </g>
        <ellipse cx="195" cy="506" rx="230" ry="44" fill={c.rug} stroke={c.ink} strokeWidth="3" />
        <ellipse cx="195" cy="506" rx="190" ry="34" fill="none" stroke={c.rug2} strokeWidth="6" />
        <ellipse cx="195" cy="506" rx="150" ry="25" fill="none" stroke="#fff" strokeWidth="3" strokeDasharray="8 8" opacity="0.6" />
      </g>

      {/* LED level meter on the right wall (pulses) */}
      <g>
        <Ink d={rrect(364, 290, 22, 110, 6)} fill="#140A26" ink={c.ink} w={2.4} />
        <g className={lite ? undefined : 'scn-pulse-fast'}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <rect key={i} x="369" y={384 - i * 12} width="12" height="8" rx="2" fill={i > 5 ? '#FF6F61' : i > 3 ? '#FFE14D' : '#B6FF3B'} opacity={i > 5 ? 0.5 : 1} />)}
        </g>
      </g>

      {/* ---------- foreground: boom-arm mic + speaker ---------- */}
      <g filter={wob}>
        <BoomMic night={night} />
        <Speaker x={40} y={506} night={night} />
      </g>
      {night && <Spark x={110} y={60} r={6} fill="#2EF2FF" />}
    </g>
  )
}

function Console() {
  return (
    <g>
      <path d="M-140,284 L-120,236 H70 L90,284 Z" fill="#3A2C6A" stroke="#07040F" strokeWidth="2" />
      {Array.from({ length: 12 }, (_, i) => (
        <g key={i}>
          <rect x={-112 + i * 15} y="244" width="3" height="28" fill="#07040F" />
          <rect x={-115 + i * 15} y={250 + ((i * 7) % 16)} width="9" height="5" rx="1" fill="#E6E9EF" />
          <circle cx={-110 + i * 15} cy="240" r="2" fill={['#2EF2FF', '#B6FF3B', '#FFE14D'][i % 3]} />
        </g>
      ))}
      {/* two screens with waveforms */}
      <rect x="-118" y="160" width="86" height="56" rx="4" fill="#0A1424" stroke="#2EF2FF" strokeWidth="1.4" />
      <path d="M-112,188 l6,-10 l6,18 l6,-24 l6,30 l6,-20 l6,12 l6,-6 l6,4 l6,-2 l6,0 l6,0" stroke="#2EF2FF" strokeWidth="2" fill="none" />
      <rect x="-22" y="160" width="86" height="56" rx="4" fill="#0A1424" stroke="#B6FF3B" strokeWidth="1.4" />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => <rect key={i} x={-16 + i * 9} y={208 - ((i * 13) % 34)} width="6" height={((i * 13) % 34) + 4} fill="#B6FF3B" opacity="0.85" />)}
    </g>
  )
}

function Headphones({ x, y }) {
  const ink = '#07040F'
  return (
    <g>
      <path d={`M${x - 22},${y + 26} Q${x - 24},${y} ${x},${y} Q${x + 24},${y} ${x + 22},${y + 26}`} stroke={ink} strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d={`M${x - 22},${y + 26} Q${x - 24},${y} ${x},${y} Q${x + 24},${y} ${x + 22},${y + 26}`} stroke="#E6E9EF" strokeWidth="4.4" fill="none" strokeLinecap="round" />
      <Ink d={rrect(x - 32, y + 20, 16, 26, 7)} fill="#7B6CFF" ink={ink} w={2.6} />
      <Ink d={rrect(x + 16, y + 20, 16, 26, 7)} fill="#7B6CFF" ink={ink} w={2.6} />
      <Gloss x={x - 26} y={y + 27} rx={1.6} ry={5} rot={0} o={0.8} dot={false} />
    </g>
  )
}

function BoomMic({ night }) {
  const ink = '#07040F'
  const arm = night ? '#3A2C6A' : '#2E2058'
  return (
    <g>
      {/* clamp off the top-right, two arm segments with springs, mic + pop filter */}
      <Ink d={rrect(380, -30, 30, 40, 6)} fill="#5A4A8A" ink={ink} w={2.6} />
      <path d="M392,6 L332,94 L268,150" stroke={ink} strokeWidth="11" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M392,6 L332,94 L268,150" stroke={arm} strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M384,24 L346,78 M326,104 L284,140" stroke="#C9CED8" strokeWidth="2" strokeDasharray="2 3" />
      <circle cx="332" cy="94" r="7" fill="#C9CED8" stroke={ink} strokeWidth="2.4" />
      {/* shock mount + mic body */}
      <g transform="rotate(-28 262 176)">
        <ellipse cx="262" cy="176" rx="30" ry="22" fill="none" stroke={ink} strokeWidth="5" />
        <ellipse cx="262" cy="176" rx="30" ry="22" fill="none" stroke="#C9CED8" strokeWidth="2.4" />
        <Ink d={rrect(244, 140, 36, 76, 18)} fill={night ? '#9A96C8' : '#E6E9EF'} ink={ink} w={3.4} />
        <g stroke="#7A74A8" strokeWidth="1.6">
          {[150, 158, 166, 174].map((y) => <path key={y} d={`M248,${y} H276`} />)}
        </g>
        <rect x="244" y="186" width="36" height="8" fill="#7B6CFF" />
        <Gloss x={252} y={160} rx={2} ry={10} rot={0} o={0.85} dot={false} />
      </g>
      {/* pop filter on a gooseneck */}
      <path d="M300,128 Q246,120 226,186" stroke={ink} strokeWidth="3" fill="none" />
      <ellipse cx="220" cy="204" rx="24" ry="28" fill="#140A26" opacity="0.35" stroke={ink} strokeWidth="3.4" />
      <ellipse cx="220" cy="204" rx="20" ry="24" fill="none" stroke="#fff" strokeWidth="1" strokeDasharray="1 3" opacity="0.6" />
    </g>
  )
}

function Speaker({ x, y, night }) {
  const ink = '#07040F'
  return (
    <g>
      <Ink d={rrect(x - 50, y - 10, 82, 110, 10)} fill={night ? '#241A40' : '#3A2C5A'} ink={ink} w={3.6} />
      <circle cx={x - 9} cy={y + 20} r="11" fill="#141024" stroke="#9A96C8" strokeWidth="2.4" />
      <circle cx={x - 9} cy={y + 62} r="24" fill="#141024" stroke="#9A96C8" strokeWidth="3" />
      <circle cx={x - 9} cy={y + 62} r="9" fill="#2E2848" />
      <circle cx={x - 13} cy={y + 57} r="3" fill="#fff" opacity="0.4" />
      <rect x={x + 16} y={y - 2} width="6" height="4" rx="2" fill="#B6FF3B" />
    </g>
  )
}

