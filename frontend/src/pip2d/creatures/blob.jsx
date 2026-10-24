import { Shape, Sliver, ell } from '../shapes'

// The original bean Pip (kept as an option).
const tokens = {
  cute: { body: '#6EE0D6', shade: '#5DBFB6', belly: '#C9F6F1', ink: '#2C5A56' },
  cool: { body: '#3F6E70', shade: '#345C5E', belly: '#5D8B8C', ink: '#132A2C', neon: '#3DF5FF', visor: '#1B2327' },
  ugly: { body: '#86D9B9', shade: '#71B99D', belly: '#D9F2C4', ink: '#33574A' },
}

const BODY = 'M100,41 C137,41 162,68 169,108 C177,154 168,203 100,203 C32,203 23,154 31,108 C38,68 63,41 100,41 Z'

const anchors = {
  eyes: [
    { cx: 67, cy: 134, rx: 15, ry: 21 },
    { cx: 133, cy: 133, rx: 14.6, ry: 20.5 },
  ],
  mouth: { x: 101, y: 166, s: 1 },
  sprout: { x: 100, y: 44 },
  blush: [
    [46, 160],
    [155, 159],
  ],
  hands: [
    [60, 182],
    [148, 182],
  ],
  head: { cx: 100, top: 44, w: 140 },
  neck: { y: 186, x0: 30, x1: 170 },
  badge: [54, 176],
  pencil: [150, 66, 38],
  straps: ['M66,60 C56,90 52,120 56,160', 'M134,60 C144,90 148,120 144,160'],
  sweat: [163, 76],
  visorY: 102,
}

function Art({ t, id }) {
  return (
    <g>
      {[74, 127].map((x) => (
        <Shape key={x} d={ell(x, 203, 15, 8)} fill={t.shade} ink={t.ink} uid={`${id}f${x}`} shadow={false} />
      ))}
      <Shape d={BODY} fill={t.body} shade={t.shade} ink={t.ink} uid={`${id}b`} sx={-13} sy={-10} />
      <path d={ell(100, 190, 38, 11)} fill={t.belly} opacity="0.85" />
      <Sliver d="M49,98 C53,76 67,60 85,53" w={6} />
    </g>
  )
}

export default { name: 'blob', tokens, anchors, Art }
