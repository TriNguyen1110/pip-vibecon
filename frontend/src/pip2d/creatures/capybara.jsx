import { Shape, Plush, Hair, rrect, ell } from '../shapes'
import { ellipsePoints } from '../fuzz'

// Capybara: boxy (but squishy) loaf, big blunt snout, tiny round ears, small wide-set eyes. Pip's default.
// Its brain sprout grows out of a yuzu balanced on its head (the capybara-with-a-yuzu meme).
const tokens = {
  cute: { body: '#B9875B', shade: '#946A45', belly: '#E0C29E', ink: '#4A3020', dark: '#5A3A24' },
  cool: { body: '#6E5A4B', shade: '#56463A', belly: '#8C7562', ink: '#22170F', dark: '#2C2018', neon: '#3DF5FF', visor: '#1C1F24' },
  ugly: { body: '#A88A5E', shade: '#86704A', belly: '#CDB68C', ink: '#43331D', dark: '#4E3B22' },
}

const HEAD = rrect(36, 58, 128, 106, 50)
const BODY = rrect(24, 128, 152, 76, 40)
const MUZZLE = rrect(55, 108, 90, 60, 28)
// short coarse capybara fur; calmer where the face is
const headZone = (x, y) => (y > 100 && Math.abs(x - 100) < 40 ? 0.4 : Math.abs(x - 100) > 52 && y > 96 ? 1.4 : 1)
const FUR_HEAD = { key: 'capy-head', seed: 11, amp: 2.4, spacing: 8, zone: headZone }
const FUR_BODY = { key: 'capy-body', seed: 12, amp: 2.6, spacing: 8 }

const anchors = {
  eyes: [
    { cx: 69, cy: 100, rx: 10.5, ry: 13.5 },
    { cx: 131, cy: 99.5, rx: 10.3, ry: 13.2 },
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
  head: { cx: 100, top: 58, w: 128 },
  neck: { y: 166, x0: 30, x1: 170 },
  badge: [152, 186],
  pencil: [156, 66, 34],
  straps: ['M54,152 C48,168 48,184 52,200', 'M146,152 C152,168 152,184 148,200'],
  sweat: [160, 84],
}

function Art({ t, id, part = 'all' }) {
  const back = part !== 'body'
  const body = part !== 'back'
  return (
    <g>
      {back && (
        <>
      <Shape pts={ellipsePoints(58, 64, 12.5, 11.5)} fur={{ key: 'capy-ear-l', seed: 3, amp: 1.6, spacing: 6 }} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}ea`} />
      <Shape pts={ellipsePoints(142, 64, 12.5, 11.5)} fur={{ key: 'capy-ear-r', seed: 4, amp: 1.6, spacing: 6 }} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}eb`} />
      <path d={ell(58, 65, 5.5, 5)} fill={t.dark} opacity="0.5" />
      <path d={ell(142, 65, 5.5, 5)} fill={t.dark} opacity="0.5" />
        </>
      )}
      {body && (
        <>
      <Shape d={rrect(48, 186, 26, 22, 10)} fill={t.shade} ink={t.ink} uid={`${id}l1`} shadow={false} />
      <Shape d={rrect(126, 186, 26, 22, 10)} fill={t.shade} ink={t.ink} uid={`${id}l2`} shadow={false} />
      <Shape d={BODY} fur={FUR_BODY} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}b`} />
      {[
        [40, 160, -20],
        [158, 162, 20],
        [62, 192, -8],
        [140, 192, 10],
      ].map(([x, y, r], i) => (
        <Hair key={`hb${i}`} x={x} y={y} rot={r} color={t.shade} />
      ))}
      <Shape d={HEAD} fur={FUR_HEAD} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}h`} />
      {[
        [78, 72, -10],
        [122, 70, 12],
        [46, 120, -30],
        [154, 120, 30],
      ].map(([x, y, r], i) => (
        <Hair key={`hh${i}`} x={x} y={y} rot={r} s={0.9} color={t.shade} />
      ))}
      <Shape d={MUZZLE} fill={t.belly} shade={null} ink={t.ink} uid={`${id}m`} shadow={false} w={2.8} />
      <path d={ell(88, 118, 4.5, 3)} fill={t.dark} />
      <path d={ell(112, 118, 4.5, 3)} fill={t.dark} />
      <Plush id={id} cx={68} cy={76} rx={20} ry={9} />
        </>
      )}
    </g>
  )
}

export default { name: 'capybara', tokens, anchors, Art, split: true }
