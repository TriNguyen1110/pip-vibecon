import { Shape, Plush, Hair, InkStroke, ell } from '../shapes'
import { ellipsePoints, furPath } from '../fuzz'

// Cat: grey tabby, round fluffy head with puffy cheeks, pointy ears, fluffy curled tail, chest bib, white socks.
const tokens = {
  cute: { body: '#9EA7B1', shade: '#7D8691', belly: '#EDF0F3', ink: '#2F3640', dark: '#6A727C', inner: '#F2B8C0', nose: '#E58A99' },
  cool: { body: '#3C4250', shade: '#2E333F', belly: '#6A7182', ink: '#11141A', dark: '#252A34', inner: '#5A6070', nose: '#8A6A78', neon: '#3DF5FF', visor: '#15181D' },
  ugly: { body: '#A6A090', shade: '#868070', belly: '#E6E1D2', ink: '#3A372E', dark: '#77705F', inner: '#E2B6A8', nose: '#C98A80' },
}

const EAR_L = 'M58,30 C52,34 44,64 44,86 C56,82 74,76 86,70 C80,54 66,30 58,30 Z'
const EAR_R = 'M142,30 C148,34 156,64 156,86 C144,82 126,76 114,70 C120,54 134,30 142,30 Z'
const BODY = 'M58,150 C58,140 142,140 142,150 C150,170 150,198 132,202 L68,202 C50,198 50,170 58,150 Z'
const TAIL = 'M138,192 C170,198 188,176 180,152 C175,138 160,142 164,154'
const cheekZone = (x, y) => (y > 104 && y < 150 && Math.abs(x - 100) > 46 ? 2 : y < 70 ? 0.8 : 1)
const BIB = furPath('cat-bib', ellipsePoints(100, 176, 26, 19), { seed: 31, amp: 2.4, spacing: 6.5 })

const anchors = {
  eyes: [
    { cx: 71, cy: 112, rx: 12, ry: 15 },
    { cx: 129, cy: 111.5, rx: 11.8, ry: 14.7 },
  ],
  mouth: { x: 101, y: 141, s: 0.9 },
  sprout: { x: 100, y: 56 },
  blush: [
    [50, 132],
    [151, 132],
  ],
  hands: [
    [80, 198],
    [120, 198],
  ],
  head: { cx: 100, top: 56, w: 124 },
  neck: { y: 158, x0: 50, x1: 150 },
  badge: [126, 182],
  pencil: [150, 64, 32],
  straps: ['M66,150 C62,166 62,182 66,198', 'M134,150 C138,166 138,182 134,198'],
  sweat: [162, 96],
}

function Art({ t, id }) {
  return (
    <g>
      <InkStroke d={TAIL} color={t.body} ink={t.ink} w={11} fluffy />
      <Shape d={BODY} fur={{ key: 'cat-body', seed: 32, amp: 2.4, spacing: 8 }} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}b`} />
      <path d={BIB} fill={t.belly} />
      <Shape d={ell(80, 199, 14, 9)} fill={t.belly} ink={t.ink} uid={`${id}s1`} shadow={false} />
      <Shape d={ell(120, 199, 14, 9)} fill={t.belly} ink={t.ink} uid={`${id}s2`} shadow={false} />
      <Shape d={EAR_L} fur={{ key: 'cat-ear-l', seed: 33, amp: 1.3, spacing: 8, zone: (x) => (x > 70 ? 0.2 : 1) }} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}el`} />
      <Shape d={EAR_R} fur={{ key: 'cat-ear-r', seed: 34, amp: 1.3, spacing: 8, zone: (x) => (x < 130 ? 0.2 : 1) }} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}er`} />
      <path d="M58,44 C55,52 52,66 52,78 C60,76 70,72 76,68 C72,58 64,46 58,44 Z" fill={t.inner} />
      <path d="M142,44 C145,52 148,66 148,78 C140,76 130,72 124,68 C128,58 136,46 142,44 Z" fill={t.inner} />
      <Hair x={58} y={72} rot={15} s={0.9} color={t.belly} />
      <Hair x={142} y={72} rot={-15} s={0.9} color={t.belly} />
      <Shape pts={ellipsePoints(100, 108, 65, 55)} fur={{ key: 'cat-head', seed: 35, amp: 2.4, spacing: 8, zone: cheekZone, tuftChance: 0.3 }} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}h`} />
      {/* tabby stripes */}
      <g stroke={t.dark} strokeWidth="4.5" strokeLinecap="round" opacity="0.9">
        <path d="M90,60 L92,74" />
        <path d="M100,58 L100,74" />
        <path d="M110,60 L108,74" />
        <path d="M38,112 L50,114" />
        <path d="M162,112 L150,114" />
      </g>
      <Hair x={62} y={168} rot={-20} color={t.shade} />
      <Hair x={138} y={168} rot={20} color={t.shade} />
      <path d={ell(100, 134, 22, 14)} fill={t.belly} />
      <path d="M94,126 L106,126 L100,133 Z" fill={t.nose} stroke={t.ink} strokeWidth="2" strokeLinejoin="round" />
      <g stroke={t.ink} strokeWidth="1.8" strokeLinecap="round" opacity="0.6">
        <path d="M78,136 L56,132" />
        <path d="M78,141 L58,144" />
        <path d="M122,136 L144,132" />
        <path d="M122,141 L142,144" />
      </g>
      <Plush id={id} cx={70} cy={78} rx={18} ry={8} />
    </g>
  )
}

export default { name: 'cat', tokens, anchors, Art }
