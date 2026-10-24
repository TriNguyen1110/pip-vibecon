import { Shape, Plush, Hair, InkStroke, ell } from '../shapes'

// Raccoon: fluffy cheek tufts, bandit eye-mask, fluffy ringed tail, little dark hands (made for "notes").
const tokens = {
  cute: { body: '#A3A8B0', shade: '#82878F', belly: '#ECEEF1', ink: '#2A2D33', dark: '#3D4048', mask: '#3D4048' },
  cool: { body: '#4A4F5A', shade: '#3A3E48', belly: '#7A8090', ink: '#101216', dark: '#1D2027', mask: '#1D2027', neon: '#B8F04A', visor: '#15181D' },
  ugly: { body: '#A39E94', shade: '#848078', belly: '#E4E0D6', ink: '#33302A', dark: '#45413A', mask: '#45413A' },
}

const EAR_L = 'M56,40 C46,44 40,64 44,80 C56,78 68,72 78,64 C74,52 66,40 56,40 Z'
const EAR_R = 'M144,40 C154,44 160,64 156,80 C144,78 132,72 122,64 C126,52 134,40 144,40 Z'
const HEAD = 'M100,58 C136,58 160,80 162,106 L176,122 L158,128 C150,150 128,162 100,162 C72,162 50,150 42,128 L24,122 L38,106 C40,80 64,58 100,58 Z'
const MASK = 'M34,112 Q60,88 100,104 Q140,88 166,112 Q156,134 130,132 Q112,130 100,120 Q88,130 70,132 Q44,134 34,112 Z'
const BODY = 'M56,150 C56,138 144,138 144,150 C154,172 152,198 132,202 L68,202 C48,198 46,172 56,150 Z'
const TAIL = 'M140,188 C176,192 190,164 176,140'
const cheekZone = (x, y) => (y > 100 && Math.abs(x - 100) > 50 ? 2 : y < 72 ? 0.8 : 1)

const anchors = {
  eyes: [
    { cx: 71, cy: 113, rx: 11, ry: 13, ring: true },
    { cx: 129, cy: 112.5, rx: 10.8, ry: 12.7, ring: true },
  ],
  mouth: { x: 101, y: 148, s: 0.9 },
  sprout: { x: 100, y: 60 },
  blush: [
    [54, 140],
    [147, 140],
  ],
  hands: [
    [80, 178],
    [120, 178],
  ],
  head: { cx: 100, top: 60, w: 124 },
  neck: { y: 160, x0: 52, x1: 148 },
  badge: [128, 190],
  pencil: [150, 68, 30],
  straps: ['M66,150 C62,166 62,182 66,198', 'M134,150 C138,166 138,182 134,198'],
  nose: [100, 131],
  sweat: [164, 94],
}

function Art({ t, id }) {
  return (
    <g>
      <InkStroke d={TAIL} color={t.body} ink={t.ink} w={20} fluffy />
      <path d={TAIL} fill="none" stroke={t.dark} strokeWidth="22" strokeDasharray="9 9" strokeLinecap="butt" />
      <Shape d={BODY} fur={{ key: 'racc-body', seed: 41, amp: 2.4, spacing: 8 }} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}b`} />
      <path d={ell(100, 182, 26, 17)} fill={t.belly} />
      <Hair x={64} y={166} rot={-20} color={t.shade} />
      <Hair x={136} y={166} rot={20} color={t.shade} />
      <Shape d={ell(82, 200, 13, 8)} fill={t.dark} ink={t.ink} uid={`${id}f1`} shadow={false} />
      <Shape d={ell(118, 200, 13, 8)} fill={t.dark} ink={t.ink} uid={`${id}f2`} shadow={false} />
      <Shape d={EAR_L} fur={{ key: 'racc-ear-l', seed: 42, amp: 1.5, spacing: 7 }} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}el`} />
      <Shape d={EAR_R} fur={{ key: 'racc-ear-r', seed: 43, amp: 1.5, spacing: 7 }} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}er`} />
      <path d="M58,52 C52,58 50,68 52,74 C60,72 66,68 70,64 C68,58 62,52 58,52 Z" fill={t.dark} />
      <path d="M142,52 C148,58 150,68 148,74 C140,72 134,68 130,64 C132,58 138,52 142,52 Z" fill={t.dark} />
      <Shape d={HEAD} fur={{ key: 'racc-head', seed: 44, amp: 2.4, spacing: 8, zone: cheekZone, tuftChance: 0.35 }} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}h`} />
      <path d="M48,100 Q70,80 96,96 Q72,90 48,104 Z" fill={t.belly} />
      <path d="M152,100 Q130,80 104,96 Q128,90 152,104 Z" fill={t.belly} />
      <path d={MASK} fill={t.mask} />
      <Hair x={86} y={70} rot={-10} s={0.85} color={t.shade} />
      <Hair x={114} y={70} rot={10} s={0.85} color={t.shade} />
      <path d={ell(100, 140, 24, 16)} fill={t.belly} />
      <path d={ell(100, 132, 7, 5)} fill={t.dark} stroke={t.ink} strokeWidth="2" />
      <Shape d={ell(80, 178, 11, 9)} fill={t.dark} ink={t.ink} uid={`${id}h1`} shadow={false} />
      <Shape d={ell(120, 178, 11, 9)} fill={t.dark} ink={t.ink} uid={`${id}h2`} shadow={false} />
      <Plush id={id} cx={68} cy={80} rx={18} ry={8} />
    </g>
  )
}

export default { name: 'raccoon', tokens, anchors, Art }
