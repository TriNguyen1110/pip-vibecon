import { Shape, Plush, InkStroke, ell } from '../shapes'

// Axolotl: soft aqua-mint, frilly gill fronds, wide smile-line face.
const tokens = {
  cute: { body: '#8FE3CF', shade: '#74C8B4', belly: '#DAF8EF', ink: '#24564C', gill: '#4FB89F' },
  cool: { body: '#3F6A66', shade: '#345854', belly: '#5E8A86', ink: '#0F201E', gill: '#2B4C48', neon: '#3DF5FF', visor: '#15181D' },
  ugly: { body: '#9CD6BE', shade: '#82BCA4', belly: '#E0F2E2', ink: '#2E5446', gill: '#6A9E7E' },
}

const HEAD = ell(100, 104, 66, 50)
const BODY = 'M64,146 C64,136 136,136 136,146 C146,170 142,198 124,202 L76,202 C58,198 54,170 64,146 Z'
const FRONDS = [
  ['M44,88 C34,76 26,66 16,62', 'M44,102 C30,100 20,98 8,100', 'M46,116 C34,124 26,130 16,138'],
  ['M156,88 C166,76 174,66 184,62', 'M156,102 C170,100 180,98 192,100', 'M154,116 C166,124 174,130 184,138'],
]

const anchors = {
  eyes: [
    { cx: 66, cy: 110, rx: 10, ry: 12.5 },
    { cx: 134, cy: 109.5, rx: 9.8, ry: 12.2 },
  ],
  mouth: { x: 101, y: 132, s: 1.45, wideLine: true },
  sprout: { x: 100, y: 56 },
  blush: [
    [48, 126],
    [153, 126],
  ],
  hands: [
    [74, 194],
    [126, 194],
  ],
  head: { cx: 100, top: 56, w: 128 },
  neck: { y: 150, x0: 58, x1: 142 },
  badge: [124, 180],
  pencil: [152, 66, 30],
  straps: [
    'M70,148 C66,164 66,180 70,196',
    'M130,148 C134,164 134,180 130,196',
  ],
  sweat: [160, 78],
}

function Art({ t, id }) {
  return (
    <g>
      {/* tail fin peeking out to the side */}
      <Shape d="M130,186 C156,178 176,186 182,200 C166,206 146,204 130,198 Z" fill={t.body} shade={null} ink={t.ink} uid={`${id}tf`} shadow={false} />
      <Shape d={BODY} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}b`} />
      <path d={BODY} fill={`url(#${id}speck)`} />
      <path d={ell(100, 178, 24, 18)} fill={t.belly} />
      <Shape d={ell(78, 200, 12, 7)} fill={t.body} ink={t.ink} uid={`${id}f1`} shadow={false} />
      <Shape d={ell(122, 200, 12, 7)} fill={t.body} ink={t.ink} uid={`${id}f2`} shadow={false} />
      {/* frilly gill fronds with little frill bumps */}
      {FRONDS.flat().map((d, i) => (
        <g key={i}>
          <InkStroke d={d} color={t.gill} ink={t.ink} w={9} />
        </g>
      ))}
      {/* frilly tips */}
      {[
        [16, 62], [8, 100], [16, 138], [184, 62], [192, 100], [184, 138],
        [26, 70], [20, 99], [26, 132], [174, 70], [180, 99], [174, 132],
      ].map(([x, y], i) => (
        <circle key={`f${i}`} cx={x} cy={y} r={i < 6 ? 7.5 : 5.5} fill={t.gill} stroke={t.ink} strokeWidth="3" />
      ))}
      <Shape d={HEAD} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}h`} />
      <path d={HEAD} fill={`url(#${id}speck)`} />
      <Plush id={id} cx={70} cy={74} rx={20} ry={9} />
    </g>
  )
}

export default { name: 'axolotl', tokens, anchors, Art }
