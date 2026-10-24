import * as THREE from 'three'

// Geometry + texture helpers for the designer-toy creatures.

// A superellipsoid ("squircle blob"): a sphere pushed out toward a rounded box.
// p = 2 is an ellipsoid; higher p is boxier. `deform(v)` may reshape each vertex (taper, bulge).
export function blobGeometry({ size = [1, 1, 1], p = 2.8, deform, segs = [72, 56] } = {}) {
  const geo = new THREE.SphereGeometry(1, segs[0], segs[1])
  const pos = geo.attributes.position
  const v = new THREE.Vector3()
  const [a, b, c] = size
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const k = Math.pow(Math.abs(v.x) ** p + Math.abs(v.y) ** p + Math.abs(v.z) ** p, 1 / p)
    v.divideScalar(k || 1)
    v.set(v.x * a, v.y * b, v.z * c)
    if (deform) deform(v)
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  geo.computeVertexNormals()
  weldNormals(geo)
  return geo
}

// Average normals of vertices that share a position (sphere seam + poles) so the surface has no crease.
export function weldNormals(geo) {
  const pos = geo.attributes.position
  const nor = geo.attributes.normal
  const acc = new Map()
  const key = (i) => `${pos.getX(i).toFixed(4)},${pos.getY(i).toFixed(4)},${pos.getZ(i).toFixed(4)}`
  for (let i = 0; i < pos.count; i++) {
    const k = key(i)
    const n = acc.get(k) ?? new THREE.Vector3()
    n.x += nor.getX(i)
    n.y += nor.getY(i)
    n.z += nor.getZ(i)
    acc.set(k, n)
  }
  for (let i = 0; i < pos.count; i++) {
    const n = acc.get(key(i)).clone().normalize()
    nor.setXYZ(i, n.x, n.y, n.z)
  }
  nor.needsUpdate = true
}

// Surface finder: shoot rays along -Z (in the toy's local space) at a set of meshes.
export function makeSurface(parts) {
  const meshes = parts.map(({ geometry, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1] }) => {
    const m = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ side: THREE.FrontSide }))
    m.position.set(...position)
    m.rotation.set(...rotation)
    m.scale.set(...scale)
    m.updateMatrixWorld(true)
    return m
  })
  const ray = new THREE.Raycaster()
  const origin = new THREE.Vector3()
  const dirV = new THREE.Vector3()
  // dir defaults to straight back (-Z); pass another direction for the sides/top.
  return function hit(x, y, z = 10, dir = [0, 0, -1]) {
    origin.set(x, y, z)
    dirV.set(...dir).normalize()
    ray.set(origin, dirV)
    const hits = ray.intersectObjects(meshes, false)
    if (!hits.length) return null
    const h = hits[0]
    const n = h.face.normal.clone().transformDirection(h.object.matrixWorld)
    return { point: h.point.clone(), normal: n }
  }
}

// Quaternion turning +Z onto a surface normal.
export function faceQuat(normal, roll = 0) {
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal)
  if (roll) q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), roll))
  return q
}

// Project a 2D flat geometry (in XY) onto the surface, floating `lift` above it.
export function conformGeometry(geo, hit, lift = 0.006) {
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const h = hit(pos.getX(i), pos.getY(i))
    if (!h) continue
    pos.setXYZ(i, h.point.x + h.normal.x * lift, h.point.y + h.normal.y * lift, h.point.z + h.normal.z * lift)
  }
  pos.needsUpdate = true
  geo.computeVertexNormals()
  return geo
}

// A tube that follows 2D points projected onto the surface.
export function surfaceTube(pts2d, hit, { radius = 0.022, lift = 0.012, segs = 48 } = {}) {
  const pts = pts2d.map(([x, y]) => {
    const h = hit(x, y)
    return h ? h.point.add(h.normal.multiplyScalar(lift)) : new THREE.Vector3(x, y, 0)
  })
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal')
  return new THREE.TubeGeometry(curve, segs, radius, 10, false)
}

// Sample a cubic Bezier chain (SVG-like) into points.
export function bezierPoints(chain, n = 16) {
  const out = []
  for (let s = 0; s < chain.length; s++) {
    const [p0, c1, c2, p1] = chain[s]
    for (let i = s === 0 ? 0 : 1; i <= n; i++) {
      const t = i / n
      const mt = 1 - t
      out.push([
        mt * mt * mt * p0[0] + 3 * mt * mt * t * c1[0] + 3 * mt * t * t * c2[0] + t * t * t * p1[0],
        mt * mt * mt * p0[1] + 3 * mt * mt * t * c1[1] + 3 * mt * t * t * c2[1] + t * t * t * p1[1],
      ])
    }
  }
  return out
}

// ---------- procedural textures (cached) ----------
const cache = {}

function canvasTex(key, w, h, draw, { repeat = [1, 1], color = false } = {}) {
  if (cache[key]) return cache[key]
  const cv = document.createElement('canvas')
  cv.width = w
  cv.height = h
  draw(cv.getContext('2d'), w, h)
  const tex = new THREE.CanvasTexture(cv)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(...repeat)
  tex.anisotropy = 4
  if (color) tex.colorSpace = THREE.SRGBColorSpace
  cache[key] = tex
  return tex
}

function rng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

// Fine flocking grain for the velvet coat (bump).
export function flockTexture() {
  return canvasTex(
    'flock',
    256,
    256,
    (g, w, h) => {
      const r = rng(7)
      const img = g.createImageData(w, h)
      for (let i = 0; i < w * h; i++) {
        const v = 128 + (r() - 0.5) * 90
        img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v
        img.data[i * 4 + 3] = 255
      }
      g.putImageData(img, 0, 0)
      // soft directional strokes, like brushed flocking
      g.globalAlpha = 0.18
      for (let i = 0; i < 1400; i++) {
        const x = r() * w
        const y = r() * h
        g.strokeStyle = r() > 0.5 ? '#fff' : '#000'
        g.lineWidth = 1
        g.beginPath()
        g.moveTo(x, y)
        g.lineTo(x + (r() - 0.5) * 3, y + 3 + r() * 4)
        g.stroke()
      }
    },
    { repeat: [4, 2] },
  )
}

// Citrus peel: lots of small pits (bump).
export function peelTexture() {
  return canvasTex(
    'peel',
    512,
    256,
    (g, w, h) => {
      const r = rng(31)
      g.fillStyle = '#c8c8c8'
      g.fillRect(0, 0, w, h)
      for (let i = 0; i < 2600; i++) {
        const x = r() * w
        const y = r() * h
        const rad = 1.2 + r() * 2.4
        const grd = g.createRadialGradient(x, y, 0, x, y, rad)
        grd.addColorStop(0, 'rgba(40,40,40,0.9)')
        grd.addColorStop(1, 'rgba(40,40,40,0)')
        g.fillStyle = grd
        g.beginPath()
        g.arc(x, y, rad, 0, Math.PI * 2)
        g.fill()
      }
    },
    { repeat: [2, 1] },
  )
}

// Soft round airbrushed blush.
export function blushTexture() {
  return canvasTex(
    'blush',
    128,
    128,
    (g, w) => {
      const grd = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2)
      grd.addColorStop(0, 'rgba(255,140,165,0.85)')
      grd.addColorStop(0.55, 'rgba(255,150,175,0.45)')
      grd.addColorStop(1, 'rgba(255,160,185,0)')
      g.fillStyle = grd
      g.fillRect(0, 0, w, w)
    },
    { color: true },
  )
}

// Additive glow halo (lightbulb).
export function glowTexture() {
  return canvasTex(
    'glow',
    128,
    128,
    (g, w) => {
      const grd = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2)
      grd.addColorStop(0, 'rgba(255,240,170,1)')
      grd.addColorStop(0.35, 'rgba(255,225,120,0.45)')
      grd.addColorStop(1, 'rgba(255,220,110,0)')
      g.fillStyle = grd
      g.fillRect(0, 0, w, w)
    },
    { color: true },
  )
}

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
export { smooth }

// Airbrushed tonal variation baked as vertex colours (multiplies the material colour).
// fn(position) -> brightness multiplier, or [r, g, b].
export function airbrush(geo, fn) {
  const pos = geo.attributes.position
  const col = new Float32Array(pos.count * 3)
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const k = fn(v)
    const [r, g, b] = Array.isArray(k) ? k : [k, k, k]
    col[i * 3] = r
    col[i * 3 + 1] = g
    col[i * 3 + 2] = b
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
  return geo
}
