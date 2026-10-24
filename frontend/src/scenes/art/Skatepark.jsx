import { Ink, Line, Gloss, Lg, Rg, Cloud, Palm, Stars, Spark, rrect } from '../kit'

// Golden-hour skatepark: concrete bowl, a big triangular pyramid ramp (Duke Doublecount's throne),
// original graffiti doodles, palm silhouettes. Night: floodlights + UV-bright paint.
// Core 390 x 560. Floor line: Pip's feet ~y 504; the ramp deck (boss feet) at y 336.

const DAY = {
  sky: [[0, '#7E9CF2'], [0.42, '#B9A3EC'], [0.7, '#FFB28C'], [1, '#FFDD90']],
  hills: '#D59AA6', hills2: '#E7B0A6',
  palm: '#7A4C86', palmFar: '#B27CA2',
  fence: '#7A5C80',
  wall: '#F2CFA8', wallShade: '#DCA986', wallTop: '#FFE7C8', wallInk: '#8A5A62',
  floor: [[0, '#F6D3A8'], [1, '#E2A57E']], joint: '#B5786A',
  bowlIn: [[0, '#F9DDB8'], [0.5, '#EDC098'], [0.8, '#EFC59E'], [1, '#F6D3A8']], tile: '#4FC8E0', tileGrout: '#F6F0FF', coping: '#F6F3FF', copingInk: '#6A5276',
  face: [[0, '#8A74F0'], [1, '#4C37B4']], ride: '#E9E6F7', rideEdge: '#FFC48A', rampInk: '#2C1F6E',
  paintInk: '#2A1C4A', shadow: '#8A4E78', shadowO: 0.2,
  cone: '#FF8A3C', coneShade: '#E2622A', coneInk: '#8A2F14',
}
const NIGHT = {
  sky: [[0, '#0A0820'], [0.42, '#1E1446'], [0.75, '#3E2466'], [1, '#5E3176']],
  hills: '#251A4C', hills2: '#2E2158',
  palm: '#0F0A26', palmFar: '#1D1544',
  fence: '#4A3C86',
  wall: '#3D3374', wallShade: '#2B2459', wallTop: '#544A92', wallInk: '#140F30',
  floor: [[0, '#3A3070'], [1, '#1E1942']], joint: '#4E4390',
  bowlIn: [[0, '#4C428E'], [0.5, '#3A3072'], [0.8, '#382E6E'], [1, '#3A3070']], tile: '#2A8FB0', tileGrout: '#6C64B0', coping: '#C9C5F2', copingInk: '#120E2E',
  face: [[0, '#4A38B8'], [1, '#22186E']], ride: '#A9A5E2', rideEdge: '#2EF2FF', rampInk: '#0C0828',
  paintInk: '#0C0828', shadow: '#05030F', shadowO: 0.35,
  cone: '#E8743A', coneShade: '#A9461E', coneInk: '#3A1206',
}

const PAINT = { cyan: '#22D6EA', lime: '#A8F23A', magenta: '#FF52C8', orange: '#FF923A', violet: '#7B6CFF', yellow: '#FFD84A' }

export default function Skatepark({ p, night, lite, wob }) {
  const c = night ? NIGHT : DAY
  const glow = night && !lite
  return (
    <g>
      <defs>
        <Lg id={`${p}sky`} stops={c.sky} units="userSpaceOnUse" y1={-300} y2={350} />
        <Lg id={`${p}floor`} stops={c.floor} units="userSpaceOnUse" y1={404} y2={560} />
        <Lg id={`${p}wall`} stops={c.bowlIn} units="userSpaceOnUse" y1={300} y2={440} />
        <Lg id={`${p}face`} stops={c.face} />
        <Lg id={`${p}ride`} stops={[[0, c.ride], [1, c.ride, 0.85]]} />
        <Rg id={`${p}sun`} stops={[[0, '#FFFBE0'], [0.6, '#FFE27A'], [1, '#FFB948']]} />
        <Rg id={`${p}halo`} stops={[[0, '#FFF2B8', 0.85], [0.45, '#FFD27A', 0.35], [1, '#FFB070', 0]]} />
        <Rg id={`${p}beam`} cx={0.5} cy={0} r={1} stops={[[0, '#E9FDFF', 0.55], [0.6, '#9FF6FF', 0.16], [1, '#9FF6FF', 0]]} />
        <Rg id={`${p}aura`} stops={[[0, '#FF6F61', 0.32], [0.6, '#FF6F61', 0.12], [1, '#FF6F61', 0]]} />
        <Rg id={`${p}pool`} stops={[[0, '#CFFBFF', 0.4], [1, '#CFFBFF', 0]]} />
        <Lg id={`${p}cone`} x2={1} y2={0} stops={[[0, c.coneShade], [0.45, c.cone], [1, c.coneShade]]} />
        <pattern id={`${p}chain`} width="12" height="12" patternUnits="userSpaceOnUse">
          <path d="M0,0 L12,12 M12,0 L0,12" stroke={c.fence} strokeWidth="1.1" opacity="0.55" />
        </pattern>
      </defs>

      {/* ---------- back: sky, sun/moon, far hills, palms ---------- */}
      <rect x="-500" y="-500" width="1400" height="910" fill={`url(#${p}sky)`} />
      {night ? (
        <g>
          <Stars seed={11} n={70} y1={240} />
          <circle cx="66" cy="92" r="24" fill="#F3F0FF" />
          <circle cx="78" cy="84" r="21" fill={c.sky[1][1]} />
          <Spark x={312} y={70} r={7} fill="#B6FF3B" />
          <Spark x={150} y={170} r={5} fill="#2EF2FF" />
        </g>
      ) : (
        <g>
          <circle className={lite ? undefined : 'scn-pulse'} cx="160" cy="250" r="130" fill={`url(#${p}halo)`} />
          <circle cx="160" cy="254" r="48" fill={`url(#${p}sun)`} />
          <path d="M126,240 Q160,230 194,240" stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.55" />
          {/* gel streak bands across the sun (Y2K sunset stripes) */}
          <rect x="112" y="276" width="96" height="3.5" fill="#FFB2A0" opacity="0.7" />
          <rect x="114" y="285" width="92" height="5" fill="#FFB2A0" opacity="0.7" />
        </g>
      )}

      {/* drifting clouds (2 moving elements) */}
      <g className={lite ? undefined : 'scn-drift'}>
        <Cloud x={-10} y={142} w={120} fill={night ? '#3A2C6E' : '#FFF4FA'} ink={night ? undefined : '#C98BB4'} shade={night ? undefined : '#F2C4DA'} o={night ? 0.55 : 0.95} gloss={!night} />
      </g>
      <g className={lite ? undefined : 'scn-drift-back'}>
        <Cloud x={232} y={92} w={92} fill={night ? '#33275F' : '#FFF4FA'} ink={night ? undefined : '#C98BB4'} shade={night ? undefined : '#F2C4DA'} o={night ? 0.45 : 0.9} gloss={!night} />
        <Cloud x={520} y={160} w={110} fill={night ? '#33275F' : '#FFF4FA'} ink={night ? undefined : '#C98BB4'} o={night ? 0.45 : 0.9} gloss={!night} />
        <Cloud x={-300} y={110} w={110} fill={night ? '#33275F' : '#FFF4FA'} ink={night ? undefined : '#C98BB4'} o={night ? 0.45 : 0.9} gloss={!night} />
      </g>

      <g filter={wob}>
        {/* far hills / low city line */}
        <g transform="translate(0 -24)">
        <path d="M-500,350 L-500,318 Q-420,286 -330,306 Q-250,276 -150,300 Q-60,282 20,304 Q110,280 200,300 Q300,276 400,298 Q500,282 600,302 Q700,284 900,300 L900,350 Z" fill={c.hills2} opacity="0.9" />
        <path d="M-500,350 L-500,326 L-380,326 L-380,308 L-340,308 L-340,322 L-120,322 L-120,312 L-80,312 L-80,326 L470,326 L470,306 L520,306 L520,324 L900,324 L900,350 Z" fill={c.hills} />
        {night && [-360, -350, -100, -90, 480, 495, 505].map((x, i) => <rect key={i} x={x} y={i % 2 ? 314 : 318} width="4" height="4" fill="#FFE14D" opacity="0.8" />)}
        </g>

        {/* palm silhouettes */}
        <Palm x={-150} y={300} h={150} lean={-10} s={0.8} color={c.palmFar} />
        <Palm x={190} y={300} h={120} lean={8} s={0.7} color={c.palmFar} />
        <Palm x={560} y={300} h={140} lean={-12} s={0.8} color={c.palmFar} />
        <Palm x={-40} y={344} h={230} lean={26} s={1.05} color={c.palm} />
        <Palm x={8} y={344} h={176} lean={-20} s={0.9} color={c.palm} />
        <Palm x={392} y={344} h={214} lean={-30} s={1} color={c.palm} />
        <Palm x={700} y={344} h={200} lean={18} s={1} color={c.palm} />

        {/* night floodlight poles (behind the wall) */}
        {night && (
          <g>
            <rect x="24" y="150" width="6" height="190" fill="#120C2C" />
            <rect x="360" y="138" width="6" height="200" fill="#120C2C" />
            <Ink d={rrect(10, 136, 36, 16, 4)} fill="#2A2258" ink="#0C0828" w={2.4} />
            <Ink d={rrect(344, 124, 38, 16, 4)} fill="#2A2258" ink="#0C0828" w={2.4} />
            <rect x="14" y="140" width="28" height="7" rx="3" fill="#F2FEFF" />
            <rect x="348" y="128" width="30" height="7" rx="3" fill="#F2FEFF" />
          </g>
        )}

        {/* chain-link fence on the deck behind the bowl */}
        <rect x="-500" y="232" width="1400" height="62" fill={`url(#${p}chain)`} />
        <Line d="M-500,233 L900,233" ink={c.fence} w={2.4} o={0.8} />
        {[-420, -300, -180, -60, 60, 180, 300, 420, 540, 660, 780].map((x) => (
          <rect key={x} x={x} y="228" width="4" height="66" fill={c.fence} opacity="0.85" />
        ))}
        {/* deck around the bowl */}
        <rect x="-500" y="288" width="1400" height="90" fill={c.wallTop} />
        <Line d="M-500,289 L900,289" ink={c.wallInk} w={1.6} o={0.5} />

        {/* the bowl: far wall curving down into the flat bottom (where everyone stands) */}
        <path d="M-500,372 Q195,252 890,372 L890,440 L-500,440 Z" fill={`url(#${p}wall)`} />
        <path d="M-500,410 Q195,330 890,410" fill="none" stroke={c.wallShade} strokeWidth="26" opacity="0.35" />
        {/* pool tiles under the coping */}
        <path d="M-500,382 Q195,262 890,382" fill="none" stroke={c.tileGrout} strokeWidth="13" />
        <path d="M-500,382 Q195,262 890,382" fill="none" stroke={c.tile} strokeWidth="10" strokeDasharray="10 2.4" />
        {/* chrome coping on the rim */}
        <path d="M-500,372 Q195,252 890,372" fill="none" stroke={c.copingInk} strokeWidth="10" strokeLinecap="round" />
        <path d="M-500,372 Q195,252 890,372" fill="none" stroke={c.coping} strokeWidth="6" />
        <path d="M-500,370.5 Q195,250.5 890,370.5" fill="none" stroke="#fff" strokeWidth="1.8" opacity="0.9" />
        <Graffiti c={c} glow={glow} />

        {/* floor: the bowl's flat bottom, with expansion joints converging to the vanishing point */}
        <rect x="-500" y="438" width="1400" height="170" fill={`url(#${p}floor)`} />
        <g stroke={c.joint} strokeWidth="1.6" opacity="0.5" fill="none" strokeLinecap="round">
          {[-900, -560, -260, 0, 195, 390, 650, 950, 1300].map((x) => <path key={x} d={`M${195 + (x - 195) * 0.2},440 L${x},600`} />)}
          {[452, 476, 510, 554].map((y) => <path key={y} d={`M-500,${y} L900,${y}`} />)}
        </g>
        <Line d="M60,486 l10,-4 l6,5 l9,-3" ink={c.joint} w={1.4} o={0.7} />
        <Line d="M232,544 l12,-6 l4,6 l10,-2" ink={c.joint} w={1.4} o={0.7} />

        {/* ramp shadow on the floor */}
        <path d="M118,486 L462,486 L210,556 Z" fill={c.shadow} opacity={c.shadowO} />
      </g>

      {/* floodlight beams (night; one pulsing group) */}
      {night && !lite && (
        <g className="scn-pulse" style={{ mixBlendMode: 'screen' }}>
          <path d="M18,146 L40,146 L250,560 L-140,560 Z" fill={`url(#${p}beam)`} />
          <path d="M350,134 L376,134 L520,560 L150,560 Z" fill={`url(#${p}beam)`} />
          <ellipse cx="70" cy="520" rx="150" ry="30" fill={`url(#${p}pool)`} />
          <ellipse cx="320" cy="500" rx="150" ry="30" fill={`url(#${p}pool)`} />
        </g>
      )}

      {/* coral boss aura behind the deck (static) */}
      {!lite && <ellipse cx="290" cy="250" rx="130" ry="120" fill={`url(#${p}aura)`} />}
      <g filter={wob}>
        <Ramp p={p} c={c} night={night} glow={glow} />
      </g>

      {/* ---------- foreground props ---------- */}
      <g filter={wob}>
        <Skateboard night={night} />
        <Cone p={p} c={c} />
      </g>
    </g>
  )
}

function Graffiti({ c, glow }) {
  const ink = c.paintInk
  const g = glow ? { filter: 'drop-shadow(0 0 4px rgba(46,242,255,.55))' } : undefined
  return (
    <g style={g} transform="translate(0 16)">
      {/* bubble-letter nonsense tag "ZORP" */}
      <g transform="translate(-122 372) rotate(-6)">
        <text x="0" y="0" fontFamily="Fredoka, 'Arial Rounded MT Bold', system-ui, sans-serif" fontWeight="700" fontSize="40" letterSpacing="-2" fill={PAINT.lime} stroke={ink} strokeWidth="5" paintOrder="stroke" strokeLinejoin="round">ZORP</text>
        <path d="M6,-24 q14,-6 30,-2" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.8" />
        <path d="M100,4 q2,12 0,18 M60,4 q2,8 0,12" stroke={PAINT.lime} strokeWidth="4" strokeLinecap="round" fill="none" />
      </g>
      {/* smiling star */}
      <g transform="translate(28 362) rotate(-10)">
        <Ink d="M0,-26 L7,-8 L26,-8 L11,4 L17,23 L0,12 L-17,23 L-11,4 L-26,-8 L-7,-8 Z" fill={PAINT.yellow} ink={ink} w={3} />
        <circle cx="-5" cy="-2" r="2.2" fill={ink} /><circle cx="5" cy="-2" r="2.2" fill={ink} />
        <path d="M-5,5 Q0,10 5,5" stroke={ink} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      </g>
      {/* eyeball with drips */}
      <g transform="translate(134 360)">
        <Ink d="M-22,0 Q0,-22 22,0 Q0,22 -22,0 Z" fill="#fff" ink={ink} w={3} />
        <circle cx="2" cy="0" r="8" fill={PAINT.cyan} /><circle cx="3" cy="0" r="3.6" fill={ink} /><circle cx="5" cy="-3" r="1.6" fill="#fff" />
        <path d="M-8,10 q2,14 0,22 M10,10 q2,10 0,16" stroke={PAINT.cyan} strokeWidth="3.4" strokeLinecap="round" fill="none" />
      </g>
      {/* lightning bolt */}
      <g transform="translate(226 370) rotate(8)">
        <Ink d="M4,-30 L-14,4 L0,4 L-6,30 L16,-6 L2,-6 L10,-30 Z" fill={PAINT.orange} ink={ink} w={3} />
      </g>
      {/* wavy squiggle + triangle doodle */}
      <path d="M318,352 q10,-12 20,0 t20,0 t20,0" stroke={PAINT.magenta} strokeWidth="5" fill="none" strokeLinecap="round" />
      <Ink d="M340,392 L356,364 L372,392 Z" fill="none" ink={PAINT.violet} w={4} />
      {/* crown + grin blob (landscape extensions) */}
      <g transform="translate(-280 366)">
        <Ink d="M-26,14 L-26,-12 L-12,2 L0,-18 L12,2 L26,-12 L26,14 Z" fill={PAINT.magenta} ink={ink} w={3} />
      </g>
      <g transform="translate(470 364)">
        <Ink d="M-30,4 Q-30,-24 0,-24 Q30,-24 30,4 Q30,24 0,24 Q-30,24 -30,4 Z" fill={PAINT.violet} ink={ink} w={3} />
        <path d="M-14,4 Q0,16 14,4" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="-10" cy="-6" r="3" fill="#fff" /><circle cx="10" cy="-6" r="3" fill="#fff" />
      </g>
      <g transform="translate(620 372) rotate(-4)">
        <text x="0" y="0" fontFamily="Fredoka, 'Arial Rounded MT Bold', system-ui, sans-serif" fontWeight="700" fontSize="34" fill={PAINT.cyan} stroke={ink} strokeWidth="5" paintOrder="stroke" strokeLinejoin="round">WOW?</text>
      </g>
    </g>
  )
}

// The triangular pyramid ramp: front face (truncated triangle), riding surface strips, chrome deck coping.
function Ramp({ p, c, night, glow }) {
  const ink = c.rampInk
  const face = 'M118,486 L272,340 L308,340 L462,486 Z'
  const rideL = 'M118,486 L272,340 L272,322 L118,468 Z'
  const rideR = 'M308,340 L462,486 L462,468 L308,322 Z'
  const deck = 'M272,322 L308,322 L308,340 L272,340 Z'
  return (
    <g>
      <Ink d={rideL} fill={`url(#${p}ride)`} ink={ink} w={3} />
      <Ink d={rideR} fill={c.ride} ink={ink} w={3} />
      {/* warm rim light on the sun side / cyan floodlight edge at night */}
      <path d="M310,324 L460,466" stroke={c.rideEdge} strokeWidth="4" strokeLinecap="round" opacity={night ? 0.8 : 0.9} style={glow ? { filter: 'drop-shadow(0 0 4px #2EF2FF)' } : undefined} />
      <path d="M120,466 L270,324" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
      <Ink d={deck} fill={c.ride} ink={ink} w={3} />
      <Ink d={face} fill={`url(#${p}face)`} ink={ink} w={4.2} />
      {/* plywood seams */}
      <g stroke={ink} strokeWidth="1.4" opacity="0.35">
        <path d="M195,414 L385,414" /><path d="M150,456 L430,456" /><path d="M248,372 L332,372" />
      </g>
      {/* hand-painted height line + right-angle mark (math easter egg, no answer given) */}
      <path d="M290,346 L290,482" stroke="#fff" strokeWidth="3" strokeDasharray="7 7" strokeLinecap="round" opacity="0.85" />
      <path d="M290,470 L302,470 L302,482" stroke="#fff" strokeWidth="2.4" fill="none" opacity="0.85" />
      <text x="297" y="430" fontFamily="Fredoka, 'Arial Rounded MT Bold', system-ui, sans-serif" fontWeight="700" fontSize="17" fill="#fff" opacity="0.9">h</text>
      {/* stickers + paint on the face */}
      <g transform="translate(206 446) rotate(-14)">
        <Ink d="M0,-14 L4,-4 L14,-4 L6,2 L9,12 L0,6 L-9,12 L-6,2 L-14,-4 L-4,-4 Z" fill={PAINT.lime} ink={ink} w={2.4} />
      </g>
      <g transform="translate(372 452) rotate(10)">
        <Ink d={rrect(-16, -11, 32, 22, 6)} fill={PAINT.cyan} ink={ink} w={2.4} />
        <circle cx="-5" cy="-2" r="2" fill={ink} /><circle cx="5" cy="-2" r="2" fill={ink} />
        <path d="M-5,4 Q0,8 5,4" stroke={ink} strokeWidth="1.8" fill="none" />
      </g>
      <path d="M246,402 q8,-10 16,0 t16,0" stroke={PAINT.magenta} strokeWidth="3.4" fill="none" strokeLinecap="round" opacity="0.9" />
      {/* gel shine on the face */}
      <path d="M262,356 L176,438" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.28" />
      <Gloss x={250} y={366} rx={9} ry={2.4} rot={-44} o={0.7} />
      {/* chrome deck coping */}
      <Ink d={rrect(266, 315, 48, 9, 4.5)} fill="#F4F2FF" ink={ink} w={2.8} />
      <rect x="272" y="317" width="26" height="2.4" rx="1.2" fill="#fff" />
      <rect x="266" y="321" width="48" height="3" fill="#9C98C6" opacity="0.6" />
    </g>
  )
}

function Skateboard({ night }) {
  const ink = night ? '#0C0828' : '#2A1C4A'
  return (
    <g transform="translate(74 540) rotate(-6)">
      <ellipse cx="0" cy="18" rx="92" ry="9" fill="#000" opacity="0.14" />
      {/* wheels */}
      {[-52, 52].map((x) => (
        <g key={x}>
          <rect x={x - 9} y="6" width="18" height="6" fill="#B9BCCB" stroke={ink} strokeWidth="2" />
          <Ink d={rrect(x - 12, 9, 10, 13, 4)} fill="#FFF1C9" ink={ink} w={2.4} />
          <Ink d={rrect(x + 2, 9, 10, 13, 4)} fill="#FFF1C9" ink={ink} w={2.4} />
        </g>
      ))}
      {/* deck edge + grip */}
      <Ink d="M-86,-2 Q-96,-6 -92,-14 Q-86,-20 -70,-16 L70,-16 Q86,-20 92,-14 Q96,-6 86,-2 Q80,6 66,6 L-66,6 Q-80,6 -86,-2 Z" fill={night ? '#7B6CFF' : '#B6FF3B'} ink={ink} w={3.4} />
      <path d="M-84,-8 Q-88,-14 -72,-13 L72,-13 Q88,-14 84,-8 Q78,-2 64,-1 L-64,-1 Q-78,-2 -84,-8 Z" fill="#2E2848" />
      <g transform="translate(-30 -7)"><path d="M0,-5 L1.6,-1.6 L5,0 L1.6,1.6 L0,5 L-1.6,1.6 L-5,0 L-1.6,-1.6 Z" fill="#2EF2FF" /></g>
      <path d="M8,-11 L2,-6 L7,-6 L3,-1" stroke="#FFD84A" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="40" cy="-7" r="3.4" fill="#FF52C8" />
      <Gloss x={-56} y={-10} rx={10} ry={1.6} rot={0} o={0.5} dot={false} />
    </g>
  )
}

function Cone({ p, c }) {
  const ink = c.coneInk
  return (
    <g transform="translate(372 0)">
      <ellipse cx="0" cy="560" rx="40" ry="7" fill="#000" opacity="0.15" />
      <Ink d="M-38,548 L38,548 L42,560 L-42,560 Z" fill={c.coneShade} ink={ink} w={3.2} />
      <Ink d="M-6,470 Q0,464 6,470 L28,550 Q0,558 -28,550 Z" fill={`url(#${p}cone)`} ink={ink} w={3.6} />
      <path d="M-14.5,502 Q0,506 14.5,502 L18.5,517 Q0,522 -18.5,517 Z" fill="#F6F3FF" />
      <path d="M-9.5,484 Q0,487 9.5,484 L11.6,492 Q0,495.6 -11.6,492 Z" fill="#F6F3FF" />
      <Gloss x={-8} y={500} rx={2} ry={14} rot={14} o={0.55} dot={false} />
    </g>
  )
}
