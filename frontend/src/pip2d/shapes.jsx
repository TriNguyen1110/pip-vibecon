// Shared hand-inked drawing helpers for Pip2D creatures.

// A flat-filled shape with one cel-shadow crescent (lower right) and a hand-made double ink outline.
export function Shape({ d, fill, shade, ink, uid, shadow = true, sx = -9, sy = -7, w = 3.6 }) {
  return (
    <g>
      {shadow && shade ? (
        <>
          <clipPath id={uid}>
            <path d={d} />
          </clipPath>
          <path d={d} fill={shade} />
          <g clipPath={`url(#${uid})`}>
            <path d={d} fill={fill} transform={`translate(${sx} ${sy})`} />
          </g>
        </>
      ) : (
        <path d={d} fill={fill} />
      )}
      <Outline d={d} ink={ink} w={w} />
    </g>
  )
}

// Two slightly offset strokes so the line weight wobbles (3.5-4.6px): hand-made, not vector-perfect.
export function Outline({ d, ink, w = 3.6 }) {
  return (
    <>
      <path d={d} fill="none" stroke={ink} strokeWidth={w} strokeLinejoin="round" strokeLinecap="round" />
      <path d={d} fill="none" stroke={ink} strokeWidth={w - 1} strokeLinejoin="round" strokeLinecap="round" transform="translate(0.9 1.1)" />
    </>
  )
}

// One white rim-highlight sliver.
export function Sliver({ d, w = 5.5 }) {
  return <path d={d} fill="none" stroke="#fff" strokeWidth={w} strokeLinecap="round" opacity="0.85" />
}

// A thick inked stroke-shape (tails, gill fronds, sprout stems).
export function InkStroke({ d, color, ink, w = 10 }) {
  return (
    <>
      <path d={d} fill="none" stroke={ink} strokeWidth={w + 7} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
    </>
  )
}

// Rounded rectangle path.
export function rrect(x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2)
  return `M${x + rr},${y} H${x + w - rr} Q${x + w},${y} ${x + w},${y + rr} V${y + h - rr} Q${x + w},${y + h} ${x + w - rr},${y + h} H${x + rr} Q${x},${y + h} ${x},${y + h - rr} V${y + rr} Q${x},${y} ${x + rr},${y} Z`
}

// Ellipse path.
export function ell(cx, cy, rx, ry) {
  return `M${cx - rx},${cy} A${rx},${ry} 0 1,0 ${cx + rx},${cy} A${rx},${ry} 0 1,0 ${cx - rx},${cy} Z`
}
