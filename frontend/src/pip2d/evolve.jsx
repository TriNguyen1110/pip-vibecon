import { starPath, Gel } from './y2k'

// Vibe-specific evolution layers (v2 / v3). cute = the plush glow-up (in Pip2D.jsx);
// cool = sleeker streetwear (hood, zip jacket, chrome trim, glowing visor);
// ugly = weirder (third mini-sprout, mismatched patches, sticker-bombed).

// cool: hoodie hood framing the head (back layer).
export function Hood({ A, t, v3 }) {
  const { cx, top, w } = A.head
  const cy = top + w * 0.4
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={w / 2 + (v3 ? 16 : 12)} ry={w * 0.5 + (v3 ? 12 : 9)} fill="#2B2F45" stroke={t.ink} strokeWidth="3.6" />
      <ellipse cx={cx - w * 0.18} cy={cy - w * 0.36} rx={w * 0.16} ry="5" transform={`rotate(-20 ${cx - w * 0.18} ${cy - w * 0.36})`} fill="#fff" opacity="0.25" />
    </g>
  )
}

// cool: zip-up jacket collar with drawstrings (front). v3 adds chrome trim + a neon logo.
export function Jacket({ A, t, id, v3 }) {
  const { y, x0, x1 } = A.neck
  const l = x0 + 4
  const r = x1 - 4
  return (
    <g>
      <path d={`M${l},${y - 6} L100,${y + 16} L${r},${y - 6} L${r + 4},${y + 24} Q100,${y + 40} ${l - 4},${y + 24} Z`} fill="#2B2F45" stroke={t.ink} strokeWidth="3.2" strokeLinejoin="round" />
      {v3 && <path d={`M${l},${y - 6} L100,${y + 16} L${r},${y - 6}`} fill="none" stroke={`url(#${id}chrome)`} strokeWidth="3.4" strokeLinejoin="round" />}
      <path d={`M100,${y + 16} L100,${y + 38}`} stroke={`url(#${id}chrome)`} strokeWidth="3" />
      <rect x="96" y={y + 18} width="8" height="9" rx="2" fill={`url(#${id}chrome)`} stroke={t.ink} strokeWidth="1.8" />
      {[-1, 1].map((k) => (
        <g key={k}>
          <path d={`M${100 + k * 12},${y + 10} L${100 + k * 14},${y + 30}`} stroke="#E8ECF2" strokeWidth="2.2" strokeLinecap="round" />
          <rect x={100 + k * 14 - 2} y={y + 29} width="4" height="6" rx="1" fill={`url(#${id}chrome)`} />
        </g>
      ))}
      {v3 && <path d={starPath(r - 18, y + 14, 5.5)} fill="#2FF3FF" opacity="0.95" />}
    </g>
  )
}

// cool: a neon glow under the visor.
export function VisorGlow({ hx0, hx1, y, id }) {
  return <path d={`M${hx0},${y + 6} Q100,${y - 10} ${hx1},${y + 6}`} fill="none" stroke={`url(#${id}clubRim)`} strokeWidth="10" opacity="0.65" filter={`url(#${id}neonGlow)`} />
}

// ugly: a third, smaller sprout off to the side.
export function MiniSprout({ A, t }) {
  const x = A.sprout.x + (A.sprout.yuzu ? 26 : 22)
  const y = A.sprout.y + (A.sprout.yuzu ? 22 : 12)
  const d = `M${x},${y} C${x + 2},${y - 10} ${x + 10},${y - 14} ${x + 14},${y - 8}`
  return (
    <g>
      <path d={d} fill="none" stroke={t.ink} strokeWidth="9" strokeLinecap="round" />
      <path d={d} fill="none" stroke="#9BCB6A" strokeWidth="4" strokeLinecap="round" />
      <ellipse cx={x + 15} cy={y - 8} rx="5" ry="3.4" transform={`rotate(30 ${x + 15} ${y - 8})`} fill="#9BCB6A" stroke={t.ink} strokeWidth="2.4" />
    </g>
  )
}

// ugly: mismatched fur patches with visible stitches.
export function Patches({ A, t }) {
  const { y, x0, x1 } = A.neck
  const P = [
    [x0 + 24, y + 26, 14, 11, '#B9A2FF'],
    [x1 - 22, y + 10, 11, 13, '#D8B44A'],
  ]
  return (
    <g>
      {P.map(([cx, cy, rx, ry, c], i) => (
        <g key={i}>
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={c} opacity="0.92" />
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={t.ink} strokeWidth="2.2" strokeDasharray="4 3" />
        </g>
      ))}
    </g>
  )
}

// ugly: sticker-bombed (3 at v2, 5 at v3).
export function Stickers({ A, t, id, n = 3 }) {
  const { y, x0, x1 } = A.neck
  const { cx, top, w } = A.head
  const S = [
    ['star', x1 - 12, y + 34, 15],
    ['q', cx - w * 0.36, top + 30, -12],
    ['half', x0 + 14, y + 4, 8],
    ['holo', cx + w * 0.4, top + 46, 20],
    ['star', x0 + 34, y + 40, -18],
  ].slice(0, n)
  return (
    <g>
      {S.map(([kind, x, yy, rot], i) => (
        <g key={i} transform={`rotate(${rot} ${x} ${yy})`}>
          {kind === 'star' && <path d={starPath(x, yy, 8.5)} fill="#FFD25A" stroke="#fff" strokeWidth="2.6" strokeLinejoin="round" paintOrder="stroke" />}
          {kind === 'q' && (
            <g>
              <circle cx={x} cy={yy} r="8" fill="#FF8FC7" stroke="#fff" strokeWidth="2.4" />
              <text x={x} y={yy + 4} textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="11" fill={t.ink}>
                ?
              </text>
            </g>
          )}
          {kind === 'half' && (
            <g>
              <rect x={x - 8} y={yy - 7} width="16" height="14" rx="3" fill="#C9FCFC" stroke="#fff" strokeWidth="2.4" />
              <text x={x} y={yy + 4} textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="10" fill={t.ink}>
                ½
              </text>
            </g>
          )}
          {kind === 'holo' && (
            <g>
              <rect x={x - 8} y={yy - 8} width="16" height="16" rx="3" fill={`url(#${id}holo)`} stroke="#fff" strokeWidth="2.4" />
              <Gel id={id} x={x - 3} y={yy - 3} r={2.2} />
            </g>
          )}
        </g>
      ))}
    </g>
  )
}
