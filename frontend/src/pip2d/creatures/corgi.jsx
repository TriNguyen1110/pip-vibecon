import { Shape, Sliver, rrect, ell } from '../shapes'

// Corgi: huge upright ears, fox face with a white blaze, loaf body, tiny legs, fluffy tail tuft.
const tokens = {
  cute: { body: '#E8944A', shade: '#C97A36', belly: '#FFF1DC', ink: '#5A3214', dark: '#3A2414', inner: '#F7C6A8' },
  cool: { body: '#8A6448', shade: '#74533B', belly: '#C9B8A6', ink: '#24170D', dark: '#1C140D', inner: '#A98A74', neon: '#3DF5FF', visor: '#1C1F24' },
  ugly: { body: '#D49A58', shade: '#B78046', belly: '#F2E4C6', ink: '#53351A', dark: '#3A2414', inner: '#E8B898' },
}

const EAR_L = 'M60,20 C52,22 40,58 40,86 C52,84 74,76 88,68 C82,48 70,22 60,20 Z'
const EAR_R = 'M140,20 C148,22 160,58 160,86 C148,84 126,76 112,68 C118,48 130,22 140,20 Z'
const EAR_IN_L = 'M60,34 C55,40 48,62 48,78 C58,76 70,70 78,66 C74,52 66,36 60,34 Z'
const EAR_IN_R = 'M140,34 C145,40 152,62 152,78 C142,76 130,70 122,66 C126,52 134,36 140,34 Z'
// fox-shaped head with cheek fluff
const HEAD = 'M100,58 C134,58 160,78 162,108 C170,118 166,130 156,134 C148,152 126,162 100,162 C74,162 52,152 44,134 C34,130 30,118 38,108 C40,78 66,58 100,58 Z'
const BLAZE = 'M93,60 Q100,56 107,60 L111,104 Q132,114 130,136 Q100,162 70,136 Q68,114 89,104 Z'
const BODY = rrect(40, 136, 120, 66, 33)
const TAIL = 'M156,170 C172,160 186,170 180,184 C174,196 160,192 156,186 Z'

const anchors = {
  eyes: [
    { cx: 71, cy: 114, rx: 11, ry: 14 },
    { cx: 129, cy: 113.5, rx: 10.8, ry: 13.7 },
  ],
  mouth: { x: 101, y: 145, s: 0.95 },
  sprout: { x: 100, y: 60 },
  blush: [
    [52, 136],
    [149, 136],
  ],
  hands: [
    [74, 196],
    [126, 196],
  ],
  head: { cx: 100, top: 62, w: 120 },
  neck: { y: 160, x0: 40, x1: 160 },
  badge: [146, 182],
  pencil: [150, 62, 30],
  straps: [
    'M60,150 C54,166 54,182 58,198',
    'M140,150 C146,166 146,182 142,198',
  ],
  sweat: [160, 100],
}

function Art({ t, id }) {
  return (
    <g>
      <Shape d={TAIL} fill={t.belly} shade={null} ink={t.ink} uid={`${id}t`} shadow={false} />
      <Shape d={EAR_L} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}el`} />
      <Shape d={EAR_R} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}er`} />
      <path d={EAR_IN_L} fill={t.inner} />
      <path d={EAR_IN_R} fill={t.inner} />
      <Shape d={rrect(60, 188, 26, 20, 9)} fill={t.belly} ink={t.ink} uid={`${id}l1`} shadow={false} />
      <Shape d={rrect(114, 188, 26, 20, 9)} fill={t.belly} ink={t.ink} uid={`${id}l2`} shadow={false} />
      <Shape d={BODY} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}b`} />
      <path d={ell(100, 176, 32, 22)} fill={t.belly} />
      <Shape d={HEAD} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}h`} />
      <path d={BLAZE} fill={t.belly} />
      <path d="M93,126 Q100,122 107,126 Q104,134 100,134 Q96,134 93,126 Z" fill={t.dark} stroke={t.ink} strokeWidth="2" strokeLinejoin="round" />
      <Sliver d="M50,104 C52,86 62,72 78,66" />
    </g>
  )
}

export default { name: 'corgi', tokens, anchors, Art }
