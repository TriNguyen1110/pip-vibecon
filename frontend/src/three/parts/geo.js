import * as THREE from 'three'

const UP = new THREE.Vector3(0, 1, 0)

// A point on an ellipsoid surface plus an upright frame whose +z is the surface normal.
// theta: yaw from the front (+z), positive toward +x. phi: elevation, positive up.
export function onEllipsoid(center, radii, theta, phi, lift = 0) {
  const [cx, cy, cz] = center
  const [a, b, c] = radii
  const ux = Math.sin(theta) * Math.cos(phi)
  const uy = Math.sin(phi)
  const uz = Math.cos(theta) * Math.cos(phi)
  const n = new THREE.Vector3(ux / a, uy / b, uz / c).normalize()
  const p = new THREE.Vector3(cx + a * ux, cy + b * uy, cz + c * uz).addScaledVector(n, lift)
  const x = new THREE.Vector3().crossVectors(UP, n).normalize()
  const y = new THREE.Vector3().crossVectors(n, x)
  const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, n))
  return { position: p.toArray(), quaternion: q.toArray(), normal: n.toArray() }
}

// Surface of revolution from a sampled profile [[r, y], ...] (bottom to top).
export function makeLathe(points, samples = 48) {
  const curve = new THREE.SplineCurve(points.map(([r, y]) => new THREE.Vector2(r, y)))
  const pts = curve.getPoints(samples).map((p) => new THREE.Vector2(Math.max(0, p.x), p.y))
  pts[0].x = 0
  pts[pts.length - 1].x = 0
  const radiusAt = (y) => {
    // widest crossing at height y (profile is monotonic enough in y for faces)
    let best = 0
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i]
      const b = pts[i + 1]
      if ((a.y - y) * (b.y - y) <= 0 && a.y !== b.y) {
        const k = (y - a.y) / (b.y - a.y)
        best = Math.max(best, a.x + (b.x - a.x) * k)
      }
    }
    return best
  }
  return { pts, radiusAt }
}

export function onLathe(lathe, theta, y, lift = 0, offset = [0, 0, 0]) {
  const r = lathe.radiusAt(y)
  const dy = 0.01
  const dr = (lathe.radiusAt(y + dy) - lathe.radiusAt(y - dy)) / (2 * dy)
  const n = new THREE.Vector3(Math.sin(theta), -dr, Math.cos(theta)).normalize()
  const p = new THREE.Vector3(r * Math.sin(theta) + offset[0], y + offset[1], r * Math.cos(theta) + offset[2]).addScaledVector(n, lift)
  const x = new THREE.Vector3().crossVectors(UP, n).normalize()
  const yv = new THREE.Vector3().crossVectors(n, x)
  const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, yv, n))
  return { position: p.toArray(), quaternion: q.toArray(), normal: n.toArray() }
}

// A flat anchor facing +z (for screen faces).
export function onPlane(x, y, z) {
  return { position: [x, y, z], quaternion: [0, 0, 0, 1], normal: [0, 0, 1] }
}

// Standard face layout on an ellipsoid head.
export function faceOnEllipsoid({
  c = [0, 0, 0],
  R,
  eyeT,
  eyeP,
  w,
  h,
  browP,
  browT = eyeT,
  mouthP,
  mouthW,
  mouthLift = 0,
  blushT,
  blushP,
  blushR = 0.06,
}) {
  return {
    eyes: [onEllipsoid(c, R, -eyeT, eyeP), onEllipsoid(c, R, eyeT, eyeP)],
    w,
    h,
    brows: browP == null ? null : [onEllipsoid(c, R, -browT, browP), onEllipsoid(c, R, browT, browP)],
    mouth: onEllipsoid(c, R, 0, mouthP, mouthLift),
    mouthW,
    blush: blushT == null ? null : [onEllipsoid(c, R, -blushT, blushP), onEllipsoid(c, R, blushT, blushP)],
    blushR,
  }
}

export const damp = THREE.MathUtils.damp
export const easeInOut = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2)
export const easeOutBack = (x) => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
}
