import { Shape, Plush, Hair, InkStroke, rrect, ell } from '../shapes'
import { ellipsePoints } from '../fuzz'

// Dedicated side / back turnaround art (corgi's lives in corgi.jsx). Side views face right.
// Each creature exports { back, side, backSprout, sideSprout, backNeck }.

const EYE = '#16121C'

// Deadpan eye in profile: dark oval, flat lid line, one highlight.
function ProfileEye({ x, y, rx = 7, ry = 9.5, t }) {
  return (
    <g>
      <ellipse cx={x} cy={y} rx={rx} ry={ry} fill={EYE} />
      <rect x={x - rx - 1} y={y - ry - 1} width={2 * rx + 2} height={ry * 0.75 + 1} fill={t.body} />
      <path d={`M${x - rx - 2},${y - ry * 0.25} L${x + rx + 2},${y - ry * 0.25}`} stroke={t.ink} strokeWidth="3.4" strokeLinecap="round" />
      <circle cx={x - rx * 0.25} cy={y + ry * 0.15} r={rx * 0.3} fill="#fff" />
    </g>
  )
}

// Stubby legs seen from behind, with soles toward the viewer.
function BackFeet({ xs, y = 186, t, pad, id, w = 30, h = 22 }) {
  return xs.map((x) => (
    <g key={x}>
      <Shape d={rrect(x - w / 2, y, w, h, 10)} fill={t.shade} ink={t.ink} uid={`${id}bf${x}`} shadow={false} />
      <ellipse cx={x} cy={y + h * 0.62} rx={w * 0.22} ry={h * 0.2} fill={pad} opacity="0.85" />
    </g>
  ))
}

/* ------------------------------ capybara ------------------------------ */
// Back: round barrel body, tiny tail nub, little ears, the yuzu-sprout seen from behind.
function CapyBack({ t, id }) {
  return (
    <g>
      {[60, 140].map((x, i) => (
        <g key={x}>
          <Shape pts={ellipsePoints(x, 64, 12.5, 11.5)} fur={{ key: `capyb-ear${i}`, seed: 201 + i, amp: 1.6, spacing: 6 }} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}be${i}`} />
        </g>
      ))}
      <BackFeet xs={[64, 136]} t={t} pad={t.dark} id={id} />
      <Shape d={rrect(22, 116, 156, 90, 46)} fur={{ key: 'capyb-body', seed: 203, amp: 2.6, spacing: 8 }} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}bb`} />
      <Shape d={rrect(38, 56, 124, 86, 42)} fur={{ key: 'capyb-head', seed: 204, amp: 2.4, spacing: 8 }} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}bh`} />
      {/* tiny tail nub */}
      <ellipse cx="100" cy="178" rx="8" ry="6" fill={t.body} stroke={t.ink} strokeWidth="2.6" />
      <ellipse cx="98" cy="176" rx="3" ry="2" fill="#fff" opacity="0.35" />
      {[
        [70, 160, -20],
        [130, 160, 20],
        [100, 136, 0],
        [80, 92, -10],
        [120, 92, 10],
      ].map(([x, y, r], i) => (
        <Hair key={i} x={x} y={y} rot={r} color={t.shade} />
      ))}
      <path d="M100,64 Q96,100 100,136" fill="none" stroke={t.shade} strokeWidth="2.4" strokeLinecap="round" opacity="0.7" />
      <Plush id={id} cx={72} cy={70} rx={18} ry={8} />
    </g>
  )
}

// Side: barrel body, big blunt rectangular snout, small ear, tiny tail nub.
function CapySide({ t, id }) {
  return (
    <g>
      {[46, 64, 126, 144].map((x, i) => (
        <Shape key={x} d={rrect(x - 10, 182, 20, 24, 9)} fill={i % 2 ? t.shade : t.dark} ink={t.ink} uid={`${id}sl${x}`} shadow={false} />
      ))}
      <ellipse cx="24" cy="150" rx="6" ry="5" fill={t.shade} stroke={t.ink} strokeWidth="2.6" />
      <Shape d={rrect(24, 118, 132, 80, 40)} fur={{ key: 'capys-body', seed: 211, amp: 2.6, spacing: 8 }} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}sb`} />
      <Shape pts={ellipsePoints(112, 60, 11, 10)} fur={{ key: 'capys-ear2', seed: 212, amp: 1.5, spacing: 6 }} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}se`} />
      <Shape d={rrect(100, 60, 94, 88, 34)} fur={{ key: 'capys-head', seed: 213, amp: 2.2, spacing: 8 }} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}sh`} />
      <Shape d={rrect(148, 94, 48, 54, 18)} fill={t.belly} ink={t.ink} uid={`${id}sm`} shadow={false} w={2.8} />
      <ellipse cx="186" cy="106" rx="4.5" ry="3" fill={t.dark} />
      <path d="M170,132 L188,131" stroke={t.ink} strokeWidth="3" strokeLinecap="round" />
      <ProfileEye x={136} y={88} t={t} rx={6.5} ry={8.5} />
      <Hair x={70} y={150} rot={-10} color={t.shade} />
      <Hair x={100} y={140} rot={5} color={t.shade} />
      <Plush id={id} cx={124} cy={76} rx={16} ry={7} />
    </g>
  )
}

export const capybaraViews = {
  back: CapyBack,
  side: CapySide,
  backSprout: { x: 100, y: 38, yuzu: true },
  sideSprout: { x: 140, y: 42, yuzu: true },
  backNeck: { y: 140, x0: 40, x1: 160 },
}

/* ------------------------------ frog ------------------------------ */
// Back: wide spotted back, eye domes from behind, folded haunches, sprout seen from behind.
function FrogBack({ t, id }) {
  return (
    <g>
      <Shape d={ell(34, 178, 28, 18)} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}bk1`} />
      <Shape d={ell(166, 178, 28, 18)} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}bk2`} />
      {/* feet soles toward the viewer */}
      {[30, 170].map((x) => (
        <g key={x}>
          {[-9, 0, 9].map((dx) => (
            <Shape key={dx} d={ell(x + dx, 200, 6.5, 5)} fill={t.belly} ink={t.ink} uid={`${id}bt${x}${dx}`} shadow={false} w={2.6} />
          ))}
        </g>
      ))}
      <Shape d="M100,78 C152,78 180,110 178,150 C176,186 150,204 100,204 C50,204 24,186 22,150 C20,110 48,78 100,78 Z" fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}bb`} />
      <path d="M100,78 C152,78 180,110 178,150 C176,186 150,204 100,204 C50,204 24,186 22,150 C20,110 48,78 100,78 Z" fill={`url(#${id}speck)`} />
      <Shape d={ell(64, 80, 28, 24)} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}bd1`} />
      <Shape d={ell(136, 80, 28, 24)} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}bd2`} />
      <path d="M44,100 C64,92 136,92 156,100 C146,108 54,108 44,100 Z" fill={t.body} />
      {/* spots + a light spine stripe */}
      <path d="M100,104 Q96,150 100,196" fill="none" stroke={t.belly} strokeWidth="6" strokeLinecap="round" opacity="0.55" />
      <g fill={t.dark} opacity="0.55">
        <circle cx="64" cy="132" r="9" />
        <circle cx="140" cy="126" r="7" />
        <circle cx="128" cy="168" r="10" />
        <circle cx="70" cy="174" r="6" />
        <circle cx="152" cy="150" r="4.5" />
        <circle cx="48" cy="152" r="4.5" />
      </g>
      <Plush id={id} cx={56} cy={64} rx={11} ry={5} />
      <Plush id={id} cx={128} cy={64} rx={11} ry={5} />
    </g>
  )
}

// Side: egg body, one eye dome, long mouth line, big folded hind leg.
function FrogSide({ t, id }) {
  const BODY = 'M92,96 C140,92 178,118 180,150 C182,184 152,204 104,204 C58,204 30,186 30,158 C30,124 54,98 92,96 Z'
  return (
    <g>
      <Shape d={BODY} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}sb`} />
      <path d={BODY} fill={`url(#${id}speck)`} />
      <path d="M118,176 C140,170 168,172 176,182 C168,198 138,204 112,200 Z" fill={t.belly} />
      <Shape d={ell(130, 96, 28, 26)} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}sd`} />
      <path d="M110,116 C130,108 160,112 170,124" fill={t.body} />
      <ProfileEye x={136} y={94} t={t} rx={10} ry={12.5} />
      <path d="M126,136 Q156,144 182,132" fill="none" stroke={t.ink} strokeWidth="3.6" strokeLinecap="round" />
      {/* folded hind leg */}
      <Shape d={ell(66, 172, 34, 24)} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}sh`} />
      {[-10, 0, 10].map((dx) => (
        <Shape key={dx} d={ell(86 + dx, 203, 7, 5)} fill={t.body} ink={t.ink} uid={`${id}st${dx}`} shadow={false} w={2.6} />
      ))}
      <Shape d={rrect(146, 182, 14, 22, 6)} fill={t.body} ink={t.ink} uid={`${id}sf`} shadow={false} />
      <g fill={t.dark} opacity="0.55">
        <circle cx="96" cy="128" r="7" />
        <circle cx="64" cy="166" r="6" />
        <circle cx="120" cy="156" r="5" />
      </g>
      <Plush id={id} cx={122} cy={78} rx={11} ry={5} />
    </g>
  )
}

export const frogViews = {
  back: FrogBack,
  side: FrogSide,
  backSprout: { x: 100, y: 84, scale: 0.72 },
  sideSprout: { x: 112, y: 92, scale: 0.72 },
  backNeck: { y: 130, x0: 30, x1: 170 },
}

/* ------------------------------ cat ------------------------------ */
const CAT_EAR_L = 'M58,30 C52,34 44,64 44,86 C56,82 74,76 86,70 C80,54 66,30 58,30 Z'
const CAT_EAR_R = 'M142,30 C148,34 156,64 156,86 C144,82 126,76 114,70 C120,54 134,30 142,30 Z'

function CatBack({ t, id }) {
  return (
    <g>
      <InkStroke d="M128,198 C162,200 178,180 170,156 C166,146 154,148 158,158" color={t.body} ink={t.ink} w={11} fluffy />
      <BackFeet xs={[80, 120]} y={188} w={26} h={18} t={{ ...t, shade: t.belly }} pad={t.inner} id={id} />
      <Shape d="M56,150 C56,138 144,138 144,150 C152,172 150,198 132,204 L68,204 C50,198 48,172 56,150 Z" fur={{ key: 'catb-body', seed: 221, amp: 2.4, spacing: 8 }} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}bb`} />
      <Shape d={CAT_EAR_L} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}bel`} />
      <Shape d={CAT_EAR_R} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}ber`} />
      <Shape pts={ellipsePoints(100, 106, 64, 52)} fur={{ key: 'catb-head', seed: 222, amp: 2.4, spacing: 8 }} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}bh`} />
      <g stroke={t.dark} strokeWidth="5" strokeLinecap="round">
        <path d="M84,66 Q86,90 82,118" fill="none" />
        <path d="M100,62 L100,124" />
        <path d="M116,66 Q114,90 118,118" fill="none" />
        <path d="M66,166 L80,170 M134,166 L120,170" />
      </g>
      <Plush id={id} cx={74} cy={72} rx={16} ry={7} />
    </g>
  )
}

function CatSide({ t, id }) {
  return (
    <g>
      <InkStroke d="M58,190 C26,192 18,166 30,148 C36,140 46,144 42,152" color={t.body} ink={t.ink} w={11} fluffy />
      <Shape d="M60,150 C60,134 132,128 140,150 C148,172 146,198 128,204 L72,204 C54,198 52,172 60,150 Z" fur={{ key: 'cats-body', seed: 231, amp: 2.4, spacing: 8 }} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}sb`} />
      {[84, 120].map((x) => (
        <Shape key={x} d={ell(x, 201, 13, 8)} fill={t.belly} ink={t.ink} uid={`${id}ss${x}`} shadow={false} />
      ))}
      <path d="M112,52 C110,40 116,26 122,24 C130,32 134,46 134,60 Z" fill={t.body} stroke={t.ink} strokeWidth="3" strokeLinejoin="round" />
      <path d="M118,52 C117,44 120,36 123,34 C127,40 128,48 128,56 Z" fill={t.inner} />
      <Shape pts={ellipsePoints(118, 104, 52, 48)} fur={{ key: 'cats-head', seed: 232, amp: 2.4, spacing: 8 }} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}sh`} />
      <path d="M154,112 C162,110 169,114 169,121 C165,127 157,128 151,125 Z" fill={t.belly} stroke={t.ink} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M164,113 L169,114 L166,118 Z" fill={t.nose} />
      <path d="M150,120 L178,115 M150,124 L177,127" stroke={t.ink} strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
      <ProfileEye x={146} y={100} t={t} rx={7.5} ry={10} />
      <g stroke={t.dark} strokeWidth="4.5" strokeLinecap="round">
        <path d="M96,62 L98,76 M84,68 L88,80" />
      </g>
      <Plush id={id} cx={98} cy={78} rx={14} ry={6} />
    </g>
  )
}

export const catViews = {
  back: CatBack,
  side: CatSide,
  backSprout: { x: 100, y: 56 },
  sideSprout: { x: 112, y: 58 },
  backNeck: { y: 156, x0: 54, x1: 146 },
}

/* ------------------------------ raccoon ------------------------------ */
const RAC_EAR_L = 'M56,40 C46,44 40,64 44,80 C56,78 68,72 78,64 C74,52 66,40 56,40 Z'
const RAC_EAR_R = 'M144,40 C154,44 160,64 156,80 C144,78 132,72 122,64 C126,52 134,40 144,40 Z'

function RacBack({ t, id }) {
  const TAIL = 'M100,196 C96,170 112,150 104,124 C100,110 112,100 120,106'
  return (
    <g>
      <BackFeet xs={[80, 120]} y={188} w={26} h={18} t={{ ...t, shade: t.dark }} pad={t.body} id={id} />
      <Shape d="M54,150 C54,138 146,138 146,150 C156,172 154,198 132,204 L68,204 C46,198 44,172 54,150 Z" fur={{ key: 'racb-body', seed: 241, amp: 2.4, spacing: 8 }} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}bb`} />
      <Shape d={RAC_EAR_L} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}bel`} />
      <Shape d={RAC_EAR_R} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}ber`} />
      <Shape d="M100,58 C136,58 160,80 162,106 L176,122 L158,128 C150,150 128,160 100,160 C72,160 50,150 42,128 L24,122 L38,106 C40,80 64,58 100,58 Z" fur={{ key: 'racb-head', seed: 242, amp: 2.4, spacing: 8 }} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}bh`} />
      <Hair x={86} y={84} rot={-10} color={t.shade} />
      <Hair x={114} y={84} rot={10} color={t.shade} />
      {/* the big ringed tail, curling up the back */}
      <InkStroke d={TAIL} color={t.body} ink={t.ink} w={22} fluffy />
      <path d={TAIL} fill="none" stroke={t.dark} strokeWidth="24" strokeDasharray="10 10" />
      <Plush id={id} cx={74} cy={74} rx={16} ry={7} />
    </g>
  )
}

function RacSide({ t, id }) {
  const TAIL = 'M58,186 C24,190 12,160 24,138'
  return (
    <g>
      <InkStroke d={TAIL} color={t.body} ink={t.ink} w={20} fluffy />
      <path d={TAIL} fill="none" stroke={t.dark} strokeWidth="22" strokeDasharray="9 9" />
      <Shape d="M58,150 C58,134 132,128 142,150 C150,172 148,198 128,204 L72,204 C52,198 50,172 58,150 Z" fur={{ key: 'racs-body', seed: 251, amp: 2.4, spacing: 8 }} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}sb`} />
      {[84, 122].map((x) => (
        <Shape key={x} d={ell(x, 201, 12, 8)} fill={t.dark} ink={t.ink} uid={`${id}sf${x}`} shadow={false} />
      ))}
      <path d="M108,58 C104,44 112,34 120,34 C128,42 128,54 126,64 Z" fill={t.body} stroke={t.ink} strokeWidth="3" strokeLinejoin="round" />
      <Shape d="M74,104 C76,74 100,58 126,60 C152,62 166,86 168,100 L196,116 L168,128 C160,148 136,156 110,152 C86,148 72,128 74,104 Z" fur={{ key: 'racs-head', seed: 252, amp: 2.2, spacing: 8 }} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}sh`} />
      {/* bandit mask stripe through the eye */}
      <path d="M118,96 Q146,86 172,104 Q160,118 140,116 Q124,114 118,96 Z" fill={t.mask} />
      <path d="M160,120 L196,116 L176,132 Z" fill={t.belly} />
      <ellipse cx="195" cy="116" rx="5" ry="4" fill={t.dark} stroke={t.ink} strokeWidth="2" />
      <circle cx="148" cy="103" r="11" fill="#EEF0F3" />
      <ProfileEye x={148} y={103} t={{ ...t, body: '#EEF0F3' }} rx={7} ry={9} />
      <Shape d={ell(132, 176, 10, 8)} fill={t.dark} ink={t.ink} uid={`${id}sp`} shadow={false} />
      <Plush id={id} cx={100} cy={76} rx={14} ry={6} />
    </g>
  )
}

export const raccoonViews = {
  back: RacBack,
  side: RacSide,
  backSprout: { x: 100, y: 60 },
  sideSprout: { x: 116, y: 62 },
  backNeck: { y: 158, x0: 52, x1: 148 },
}

/* ------------------------------ axolotl ------------------------------ */
const FRONDS = [
  ['M44,88 C34,76 26,66 16,62', 'M44,102 C30,100 20,98 8,100', 'M46,116 C34,124 26,130 16,138'],
  ['M156,88 C166,76 174,66 184,62', 'M156,102 C170,100 180,98 192,100', 'M154,116 C166,124 174,130 184,138'],
]

function AxoBack({ t, id }) {
  return (
    <g>
      <Shape d="M64,146 C64,136 136,136 136,146 C146,170 142,198 124,204 L76,204 C58,198 54,170 64,146 Z" fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}bb`} />
      {/* tail fin standing up the middle of the back */}
      <Shape d="M100,204 C88,184 86,160 96,140 C104,126 116,124 118,134 C112,152 112,180 110,204 Z" fill={t.gill} shade={t.shade} ink={t.ink} uid={`${id}bt`} />
      {[80, 120].map((x) => (
        <Shape key={x} d={ell(x, 201, 12, 7)} fill={t.shade} ink={t.ink} uid={`${id}bf${x}`} shadow={false} />
      ))}
      {FRONDS.flat().map((d, i) => (
        <InkStroke key={i} d={d} color={t.gill} ink={t.ink} w={9} />
      ))}
      {[
        [16, 62], [8, 100], [16, 138], [184, 62], [192, 100], [184, 138],
      ].map(([x, y], i) => (
        <circle key={`f${i}`} cx={x} cy={y} r="7.5" fill={t.gill} stroke={t.ink} strokeWidth="3" />
      ))}
      <Shape d={ell(100, 104, 66, 50)} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}bh`} />
      <path d={ell(100, 104, 66, 50)} fill={`url(#${id}speck)`} />
      <Plush id={id} cx={72} cy={76} rx={18} ry={8} />
    </g>
  )
}

function AxoSide({ t, id }) {
  return (
    <g>
      {/* long tail with a fin, trailing left */}
      <Shape d="M70,170 C40,170 20,180 8,196 C30,204 56,200 80,192 Z" fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}st`} />
      <path d="M70,166 C46,162 24,170 10,186" fill="none" stroke={t.gill} strokeWidth="6" strokeLinecap="round" opacity="0.8" />
      <Shape d="M64,150 C64,136 132,132 138,150 C146,172 142,198 124,204 L80,204 C60,198 56,172 64,150 Z" fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}sb`} />
      {[88, 122].map((x) => (
        <Shape key={x} d={ell(x, 201, 11, 7)} fill={t.body} ink={t.ink} uid={`${id}sf${x}`} shadow={false} />
      ))}
      {['M96,86 C86,72 80,62 70,58', 'M92,100 C80,98 70,96 58,98', 'M96,114 C86,122 78,128 68,136'].map((d, i) => (
        <g key={i}>
          <InkStroke d={d} color={t.gill} ink={t.ink} w={9} />
        </g>
      ))}
      {[
        [70, 58], [58, 98], [68, 136],
      ].map(([x, y], i) => (
        <circle key={`g${i}`} cx={x} cy={y} r="7" fill={t.gill} stroke={t.ink} strokeWidth="3" />
      ))}
      <Shape d={ell(132, 104, 56, 46)} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}sh`} />
      <path d={ell(132, 104, 56, 46)} fill={`url(#${id}speck)`} />
      <ProfileEye x={160} y={100} t={t} rx={7} ry={9} />
      <path d="M160,128 Q174,132 186,120" fill="none" stroke={t.ink} strokeWidth="3.4" strokeLinecap="round" />
      <Plush id={id} cx={120} cy={76} rx={16} ry={7} />
    </g>
  )
}

export const axolotlViews = {
  back: AxoBack,
  side: AxoSide,
  backSprout: { x: 100, y: 56 },
  sideSprout: { x: 130, y: 58 },
  backNeck: { y: 148, x0: 60, x1: 140 },
}
