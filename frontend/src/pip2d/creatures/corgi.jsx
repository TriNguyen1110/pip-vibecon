import { Shape, Plush, Hair, rrect } from '../shapes'
import { ellipsePoints, furPath } from '../fuzz'

// Corgi: huge upright ears with ear fluff, fox face with a white blaze, fluffy chest bib, loaf body, fluffy tail.
const tokens = {
  cute: { body: '#E8944A', shade: '#C47533', belly: '#FFF1DC', ink: '#5A3214', dark: '#3A2414', inner: '#F7C6A8' },
  cool: { body: '#8A6448', shade: '#6E4F38', belly: '#C9B8A6', ink: '#24170D', dark: '#1C140D', inner: '#A98A74', neon: '#3DF5FF', visor: '#1C1F24' },
  ugly: { body: '#D49A58', shade: '#B07B42', belly: '#F2E4C6', ink: '#53351A', dark: '#3A2414', inner: '#E8B898' },
}

const EAR_L = 'M60,20 C52,22 40,58 40,86 C52,84 74,76 88,68 C82,48 70,22 60,20 Z'
const EAR_R = 'M140,20 C148,22 160,58 160,86 C148,84 126,76 112,68 C118,48 130,22 140,20 Z'
const EAR_IN_L = 'M60,34 C55,40 48,62 48,78 C58,76 70,70 78,66 C74,52 66,36 60,34 Z'
const EAR_IN_R = 'M140,34 C145,40 152,62 152,78 C142,76 130,70 122,66 C126,52 134,36 140,34 Z'
// rounder fox head with puffier cheeks
const HEAD = 'M100,58 C136,58 162,78 164,108 C174,118 170,132 158,136 C150,154 128,164 100,164 C72,164 50,154 42,136 C30,132 26,118 36,108 C38,78 64,58 100,58 Z'
const BLAZE = 'M93,60 Q100,56 107,60 L111,104 Q132,114 130,136 Q100,162 70,136 Q68,114 89,104 Z'
const BODY = rrect(38, 134, 124, 70, 35)
const cheekZone = (x, y) => (y > 104 && Math.abs(x - 100) > 44 ? 1.8 : y < 80 ? 0.7 : 1)
const BIB = furPath('corgi-bib', ellipsePoints(100, 174, 34, 24), { seed: 21, amp: 2.6, spacing: 7 })

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
  straps: ['M60,150 C54,166 54,182 58,198', 'M140,150 C146,166 146,182 142,198'],
  sweat: [160, 100],
}

function Art({ t, id, part = 'all' }) {
  const back = part !== 'body'
  const body = part !== 'back'
  return (
    <g>
      {back && (
        <>
      {/* fluffy tail tuft */}
      <Shape pts={ellipsePoints(166, 180, 15, 13)} fur={{ key: 'corgi-tail', seed: 22, amp: 3.4, spacing: 6, tuftChance: 0.4 }} fill={t.belly} shade={mix2(t)} ink={t.ink} uid={`${id}t`} />
      <Shape d={EAR_L} fur={{ key: 'corgi-ear-l', seed: 23, amp: 1.6, spacing: 8, zone: (x) => (x > 70 ? 0.3 : 1) }} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}el`} />
      <Shape d={EAR_R} fur={{ key: 'corgi-ear-r', seed: 24, amp: 1.6, spacing: 8, zone: (x) => (x < 130 ? 0.3 : 1) }} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}er`} />
      <path d={EAR_IN_L} fill={t.inner} />
      <path d={EAR_IN_R} fill={t.inner} />
      {/* ear fluff */}
      <Hair x={58} y={74} rot={20} color={t.belly} />
      <Hair x={142} y={74} rot={-20} color={t.belly} />
        </>
      )}
      {body && (
        <>
      <Shape d={rrect(60, 188, 26, 20, 10)} fill={t.belly} ink={t.ink} uid={`${id}l1`} shadow={false} />
      <Shape d={rrect(114, 188, 26, 20, 10)} fill={t.belly} ink={t.ink} uid={`${id}l2`} shadow={false} />
      <Shape d={BODY} fur={{ key: 'corgi-body', seed: 25, amp: 2.8, spacing: 8 }} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}b`} />
      <path d={BIB} fill={t.belly} />
      <Hair x={52} y={176} rot={-25} color={t.shade} />
      <Hair x={148} y={176} rot={25} color={t.shade} />
      <Shape d={HEAD} fur={{ key: 'corgi-head', seed: 26, amp: 2.6, spacing: 8, zone: cheekZone, tuftChance: 0.3 }} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}h`} />
      <path d={BLAZE} fill={t.belly} />
      <Hair x={70} y={76} rot={-20} s={0.85} color={t.shade} />
      <Hair x={130} y={76} rot={20} s={0.85} color={t.shade} />
      <path d="M93,126 Q100,122 107,126 Q104,134 100,134 Q96,134 93,126 Z" fill={t.dark} stroke={t.ink} strokeWidth="2" strokeLinejoin="round" />
      <Plush id={id} cx={70} cy={80} rx={18} ry={8} />
        </>
      )}
    </g>
  )
}

const mix2 = (t) => t.inner

export default { name: 'corgi', tokens, anchors, Art, split: true }
