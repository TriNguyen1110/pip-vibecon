import { ell, rrect } from './shapes'

// "Main Character" bone structure: per-animal head silhouettes with a real jaw (squared, wider lower face,
// flat underside, defined corners, chin jutting forward/down), cheekbone planes, a flatter longer cranium.
// oldHead = the regular head outline (masked away in this form). Marks = facial markings redrawn on the new head.

function CapyMarks({ t }) {
  return (
    <g>
      {/* the biggest block snout, squared off with a jutting chin */}
      <path d={rrect(48, 110, 104, 70, 18)} fill={t.belly} stroke={t.ink} strokeWidth="2.8" />
      <path d="M48,164 Q100,172 152,164 L152,168 Q152,180 140,180 L60,180 Q48,180 48,168 Z" fill={t.shade} opacity="0.35" />
      <path d={ell(86, 120, 5, 3.2)} fill={t.dark} />
      <path d={ell(114, 120, 5, 3.2)} fill={t.dark} />
    </g>
  )
}

function CorgiMarks({ t }) {
  return (
    <g>
      <path d="M93,62 Q100,58 107,62 L112,98 L130,110 L132,148 Q118,168 100,170 Q82,168 68,148 L70,110 L88,98 Z" fill={t.belly} />
      <path d="M92,128 Q100,123 108,128 Q105,137 100,137 Q95,137 92,128 Z" fill={t.dark} stroke={t.ink} strokeWidth="2" strokeLinejoin="round" />
    </g>
  )
}

function CatMarks({ t }) {
  return (
    <g>
      <g stroke={t.dark} strokeWidth="4.5" strokeLinecap="round">
        <path d="M90,62 L92,76" />
        <path d="M100,60 L100,76" />
        <path d="M110,62 L108,76" />
      </g>
      <path d="M80,132 L120,132 L112,152 L100,158 L88,152 Z" fill={t.belly} />
      <path d="M94,128 L106,128 L100,135 Z" fill={t.nose} stroke={t.ink} strokeWidth="2" strokeLinejoin="round" />
      <g stroke={t.ink} strokeWidth="1.8" strokeLinecap="round" opacity="0.6">
        <path d="M80,138 L54,132" />
        <path d="M80,143 L56,146" />
        <path d="M120,138 L146,132" />
        <path d="M120,143 L144,146" />
      </g>
    </g>
  )
}

function RaccoonMarks({ t }) {
  return (
    <g>
      <path d="M46,100 Q70,80 96,94 Q72,90 46,104 Z" fill={t.belly} />
      <path d="M154,100 Q130,80 104,94 Q128,90 154,104 Z" fill={t.belly} />
      <path d="M32,110 Q60,88 100,102 Q140,88 168,110 Q158,132 130,130 Q112,128 100,118 Q88,128 70,130 Q42,132 32,110 Z" fill={t.mask} />
      <path d="M78,134 L122,134 L114,156 L100,162 L86,156 Z" fill={t.belly} />
      <path d={ell(100, 134, 7, 5)} fill={t.dark} stroke={t.ink} strokeWidth="2" />
    </g>
  )
}

function FrogMarks({ t }) {
  return <path d="M28,128 Q100,136 172,128 L172,132 Q172,142 162,142 L38,142 Q28,142 28,132 Z" fill={t.shade} opacity="0.4" />
}

function AxoMarks() {
  return null
}

export const MAIN_HEADS = {
  capybara: {
    oldHead: rrect(36, 58, 128, 106, 50),
    head: 'M46,58 L154,58 Q166,58 166,70 L168,96 L174,108 L168,120 L166,150 Q166,170 150,174 L116,182 Q100,186 84,182 L50,174 Q34,170 34,150 L32,120 L26,108 L32,96 L34,70 Q34,58 46,58 Z',
    cheeks: [
      [44, 104],
      [156, 104],
    ],
    Marks: CapyMarks,
  },
  corgi: {
    oldHead: 'M100,58 C136,58 162,78 164,108 C174,118 170,132 158,136 C150,154 128,164 100,164 C72,164 50,154 42,136 C30,132 26,118 36,108 C38,78 64,58 100,58 Z',
    head: 'M66,60 Q100,54 134,60 L152,72 Q160,92 164,104 L174,118 L160,126 L154,150 Q148,164 130,168 L114,174 Q100,180 86,174 L70,168 Q52,164 46,150 L40,126 L26,118 L36,104 Q40,92 48,72 Z',
    cheeks: [
      [44, 112],
      [156, 112],
    ],
    Marks: CorgiMarks,
  },
  cat: {
    oldHead: ell(100, 108, 65, 55),
    head: 'M58,58 Q100,50 142,58 L158,80 L170,110 L156,140 L132,160 L112,172 Q100,178 88,172 L68,160 L44,140 L30,110 L42,80 Z',
    cheeks: [
      [40, 110],
      [160, 110],
    ],
    Marks: CatMarks,
  },
  raccoon: {
    oldHead: 'M100,58 C136,58 160,80 162,106 L176,122 L158,128 C150,150 128,162 100,162 C72,162 50,150 42,128 L24,122 L38,106 C40,80 64,58 100,58 Z',
    head: 'M60,58 Q100,50 140,58 L158,82 L178,116 L160,124 L152,146 L124,164 Q100,174 76,164 L48,146 L40,124 L22,116 L42,82 Z',
    cheeks: [
      [38, 114],
      [162, 114],
    ],
    Marks: RaccoonMarks,
  },
  frog: {
    oldHead: 'M100,74 C150,74 178,108 176,148 C174,184 150,202 100,202 C50,202 26,184 24,148 C22,108 50,74 100,74 Z',
    // a wide flat jaw like a boot
    head: 'M42,82 Q100,72 158,82 L176,102 L182,126 Q182,142 168,144 L32,144 Q18,142 18,126 L24,102 Z',
    headFirst: true,
    cheeks: [
      [30, 116],
      [170, 116],
    ],
    Marks: FrogMarks,
  },
  axolotl: {
    oldHead: ell(100, 104, 66, 50),
    head: 'M46,60 Q100,50 154,60 L166,86 L170,110 L160,138 Q152,154 130,158 L70,158 Q48,154 40,138 L30,110 L34,86 Z',
    cheeks: [
      [36, 106],
      [164, 106],
    ],
    Marks: AxoMarks,
  },
}
