import { Shape, Sliver, ell } from '../shapes'

// Frog: eye domes breaking the top line, wide mouth line, sitting pose with folded legs.
const tokens = {
  cute: { body: '#8FCB4E', shade: '#74AD3A', belly: '#E6F5BC', ink: '#2F4A1A', dark: '#5E8F2E' },
  cool: { body: '#4F6136', shade: '#42512C', belly: '#7C8C5E', ink: '#151C0C', dark: '#2E3920', neon: '#B8F04A', visor: '#15181D' },
  ugly: { body: '#9AA54C', shade: '#808A3C', belly: '#E8E4B4', ink: '#3A4019', dark: '#6A7330' },
}

const BODY = 'M100,74 C150,74 178,108 176,148 C174,184 150,202 100,202 C50,202 26,184 24,148 C22,108 50,74 100,74 Z'

const anchors = {
  eyes: [
    { cx: 64, cy: 72, rx: 13, ry: 16 },
    { cx: 136, cy: 71.5, rx: 12.8, ry: 15.7 },
  ],
  mouth: { x: 101, y: 122, s: 1.6, wideLine: true },
  sprout: { x: 100, y: 72, scale: 0.72 },
  blush: [
    [46, 116],
    [155, 116],
  ],
  hands: [
    [76, 198],
    [124, 198],
  ],
  head: { cx: 100, top: 72, w: 140 },
  neck: { y: 140, x0: 26, x1: 174 },
  badge: [140, 170],
  pencil: [164, 92, 30],
  straps: [
    'M50,104 C40,130 40,160 48,190',
    'M150,104 C160,130 160,160 152,190',
  ],
  sweat: [172, 60],
  visorY: 46,
}

function Art({ t, id }) {
  return (
    <g>
      {/* folded back legs */}
      <Shape d={ell(40, 184, 26, 16)} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}k1`} />
      <Shape d={ell(160, 184, 26, 16)} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}k2`} />
      <Shape d={BODY} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}b`} />
      {/* eye domes break the top line */}
      <Shape d={ell(64, 72, 30, 28)} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}d1`} sx={-6} sy={-5} />
      <Shape d={ell(136, 72, 30, 28)} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}d2`} sx={-6} sy={-5} />
      <path d="M40,96 C60,88 140,88 160,96 C150,104 50,104 40,96 Z" fill={t.body} />
      <path d={ell(100, 168, 46, 28)} fill={t.belly} />
      <g fill={t.dark} opacity="0.5">
        <circle cx="150" cy="140" r="7" />
        <circle cx="162" cy="156" r="4.5" />
        <circle cx="44" cy="146" r="5" />
      </g>
      {/* front feet with toes */}
      {[76, 124].map((x) => (
        <g key={x}>
          {[-9, 0, 9].map((dx) => (
            <Shape key={dx} d={ell(x + dx, 201, 6.5, 5)} fill={t.body} ink={t.ink} uid={`${id}t${x}${dx}`} shadow={false} w={3} />
          ))}
        </g>
      ))}
      <Sliver d="M40,64 C44,52 54,46 64,45" w={5} />
      <Sliver d="M36,128 C36,112 42,100 50,94" w={5} />
    </g>
  )
}

export default { name: 'frog', tokens, anchors, Art }
