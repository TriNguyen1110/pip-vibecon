// Soft fur edges for 2D creatures: sample an outline, then rebuild it from small irregular outward tufts.
// Deterministic (seeded) so the silhouette is stable between renders; computed once per shape and cached.

const cache = new Map()

function mulberry32(a) {
  return function rand() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Minimal absolute-path parser (M L H V C Q Z) -> dense polyline.
export function pathToPoints(d) {
  const tokens = d.match(/[MLHVCQZ]|-?\d*\.?\d+(?:e-?\d+)?/gi) ?? []
  const pts = []
  let i = 0
  let cmd = 'M'
  let x = 0
  let y = 0
  let sx = 0
  let sy = 0
  const num = () => parseFloat(tokens[i++])
  while (i < tokens.length) {
    if (/[A-Z]/i.test(tokens[i])) cmd = tokens[i++].toUpperCase()
    if (cmd === 'M') {
      x = num()
      y = num()
      sx = x
      sy = y
      pts.push([x, y])
      cmd = 'L'
    } else if (cmd === 'L') {
      x = num()
      y = num()
      pts.push([x, y])
    } else if (cmd === 'H') {
      x = num()
      pts.push([x, y])
    } else if (cmd === 'V') {
      y = num()
      pts.push([x, y])
    } else if (cmd === 'C') {
      const [x1, y1, x2, y2, x3, y3] = [num(), num(), num(), num(), num(), num()]
      for (let k = 1; k <= 16; k++) {
        const t = k / 16
        const u = 1 - t
        pts.push([
          u * u * u * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
          u * u * u * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3,
        ])
      }
      x = x3
      y = y3
    } else if (cmd === 'Q') {
      const [x1, y1, x2, y2] = [num(), num(), num(), num()]
      for (let k = 1; k <= 10; k++) {
        const t = k / 10
        const u = 1 - t
        pts.push([u * u * x + 2 * u * t * x1 + t * t * x2, u * u * y + 2 * u * t * y1 + t * t * y2])
      }
      x = x2
      y = y2
    } else if (cmd === 'Z') {
      x = sx
      y = sy
      pts.push([x, y])
      if (i < tokens.length && !/[A-Z]/i.test(tokens[i])) i++
    } else {
      i++
    }
  }
  return pts
}

export function ellipsePoints(cx, cy, rx, ry, n = 96) {
  const pts = []
  for (let k = 0; k <= n; k++) {
    const a = (k / n) * Math.PI * 2
    pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry])
  }
  return pts
}

function resample(pts, spacing) {
  const segs = []
  let total = 0
  for (let k = 1; k < pts.length; k++) {
    const l = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1])
    segs.push(l)
    total += l
  }
  const n = Math.max(12, Math.round(total / spacing))
  const out = []
  let seg = 0
  let acc = 0
  for (let k = 0; k < n; k++) {
    const target = (k / n) * total
    while (seg < segs.length - 1 && acc + segs[seg] < target) acc += segs[seg++]
    const t = segs[seg] ? (target - acc) / segs[seg] : 0
    const a = pts[seg]
    const b = pts[seg + 1] ?? a
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t])
  }
  return out
}

/**
 * Build a fur-edged closed path.
 * opts: seed, spacing (px between tufts), amp (base tuft height), zone(x, y) -> amplitude multiplier,
 *       tuftChance (0-1) for longer flicked tufts.
 */
export function furPath(key, points, { seed = 1, spacing = 9, amp = 3.2, zone, tuftChance = 0.2 } = {}) {
  if (cache.has(key)) return cache.get(key)
  const rand = mulberry32(seed)
  const p = resample(points, spacing)
  const n = p.length
  const cx = p.reduce((s, q) => s + q[0], 0) / n
  const cy = p.reduce((s, q) => s + q[1], 0) / n
  // outward normal sign
  let sign = 0
  for (let k = 0; k < n; k++) {
    const a = p[(k - 1 + n) % n]
    const b = p[(k + 1) % n]
    const nx = b[1] - a[1]
    const ny = -(b[0] - a[0])
    sign += nx * (p[k][0] - cx) + ny * (p[k][1] - cy)
  }
  sign = sign >= 0 ? 1 : -1
  let d = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`
  for (let k = 0; k < n; k++) {
    const a = p[k]
    const b = p[(k + 1) % n]
    const mx = (a[0] + b[0]) / 2
    const my = (a[1] + b[1]) / 2
    const tx = b[0] - a[0]
    const ty = b[1] - a[1]
    const tl = Math.hypot(tx, ty) || 1
    const nx = (sign * ty) / tl
    const ny = (sign * -tx) / tl
    const z = zone ? zone(mx, my) : 1
    let h = amp * z * (0.5 + rand() * 0.6)
    let shift = 0
    if (rand() < tuftChance * z) {
      h *= 1.7
      shift = (rand() - 0.5) * 0.9 // flick the tuft sideways
    }
    const qx = mx + nx * h * 2 + (tx / tl) * shift * tl
    const qy = my + ny * h * 2 + (ty / tl) * shift * tl
    d += ` Q${qx.toFixed(1)},${qy.toFixed(1)} ${b[0].toFixed(1)},${b[1].toFixed(1)}`
  }
  d += ' Z'
  cache.set(key, d)
  return d
}
