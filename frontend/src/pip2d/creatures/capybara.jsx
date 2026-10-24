import { Shape, Sliver, rrect, ell } from '../shapes'

// Capybara: boxy loaf, big blunt snout, tiny round ears, small wide-set eyes. Pip's default.
// Its brain sprout grows out of a yuzu balanced on its head (the capybara-with-a-yuzu meme).
const tokens = {
  cute: { body: '#B9875B', shade: '#9E7049', belly: '#DDBB94', ink: '#4A3020', dark: '#5A3A24' },
  cool: { body: '#6E5A4B', shade: '#5C4A3D', belly: '#8C7562', ink: '#22170F', dark: '#2C2018', neon: '#3DF5FF', visor: '#1C1F24' },
  ugly: { body: '#A88A5E', shade: '#8E734C', belly: '#CDB68C', ink: '#43331D', dark: '#4E3B22' },
}

const HEAD = rrect(38, 58, 124, 104, 46)
const BODY = rrect(26, 128, 148, 74, 36)
const MUZZLE = rrect(56, 108, 88, 58, 26)

const anchors = {
  eyes: [
    { cx: 69, cy: 100, rx: 10, ry: 13 },
    { cx: 131, cy: 99.5, rx: 9.8, ry: 12.7 },
  ],
  mouth: { x: 101, y: 146, s: 1.05 },
  sprout: { x: 100, y: 40, yuzu: true },
  blush: [
    [52, 130],
    [149, 130],
  ],
  hands: [
    [72, 186],
    [128, 186],
  ],
  head: { cx: 100, top: 58, w: 124 },
  neck: { y: 166, x0: 30, x1: 170 },
  badge: [152, 186],
  pencil: [156, 66, 34],
  straps: [
    'M54,152 C48,168 48,184 52,200',
    'M146,152 C152,168 152,184 148,200',
  ],
  sweat: [160, 84],
}

function Art({ t, id }) {
  return (
    <g>
      {/* tiny round ears */}
      <Shape d={ell(58, 64, 12, 11)} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}ea`} shadow={false} />
      <Shape d={ell(142, 64, 12, 11)} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}eb`} shadow={false} />
      <path d={ell(58, 65, 5.5, 5)} fill={t.dark} opacity="0.55" />
      <path d={ell(142, 65, 5.5, 5)} fill={t.dark} opacity="0.55" />
      {/* loaf body + stubby legs */}
      <Shape d={rrect(48, 186, 26, 22, 9)} fill={t.shade} ink={t.ink} uid={`${id}l1`} shadow={false} />
      <Shape d={rrect(126, 186, 26, 22, 9)} fill={t.shade} ink={t.ink} uid={`${id}l2`} shadow={false} />
      <Shape d={BODY} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}b`} />
      {/* big boxy head + blunt snout */}
      <Shape d={HEAD} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}h`} />
      <Shape d={MUZZLE} fill={t.belly} shade={null} ink={t.ink} uid={`${id}m`} shadow={false} w={3.2} />
      <path d={ell(88, 118, 4.5, 3)} fill={t.dark} />
      <path d={ell(112, 118, 4.5, 3)} fill={t.dark} />
      <Sliver d="M50,96 C52,78 62,66 78,62" />
    </g>
  )
}

export default { name: 'capybara', tokens, anchors, Art }
