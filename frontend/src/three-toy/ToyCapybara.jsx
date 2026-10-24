/* eslint-disable react/no-unknown-property */
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer } from '@react-three/drei'
import {
  bezierPoints,
  blobGeometry,
  blushTexture,
  conformGeometry,
  faceQuat,
  flockTexture,
  glowTexture,
  airbrush,
  smooth,
  makeSurface,
  peelTexture,
  surfaceTube,
} from './geometry'

// Pip the capybara as a premium flocked designer-toy figure.
// Proportions are lifted from the 2D art (pip2d/creatures/capybara.jsx, 200x220 viewBox):
// 1 world unit = 64 px, ground = px y 208, centre line = px x 100.

const PX = 1 / 64
const X = (px) => (px - 100) * PX
const Y = (py) => (208 - py) * PX

const C = {
  body: '#B4835A',
  shade: '#946A45',
  belly: '#E0C29E',
  ink: '#4A3020',
  dark: '#5A3A24',
  eye: '#16121C',
  mouth: '#3A1E2C',
  tongue: '#FF8A8A',
  yuzu: '#F6C344',
  leaf: '#7CC46A',
  petal: '#FFD3E8',
  pollen: '#FFD25A',
}

// ---- layout (head is the hero: ~80% of the figure's width, like the 2D) ----
const HEAD = { pos: [0, 1.53, 0.32], size: [1.0, 0.83, 0.86], p: 2.7 }
const BODY = { pos: [0, 0.68, -0.32], size: [1.17, 0.62, 0.98], p: 2.6 }
const MUZZLE = { pos: [0, 1.08, 1.06], size: [0.7, 0.43, 0.62], p: 2.5 }

const MOODS = {
  deadpan: { eyes: 'lid', lid: [0.36, 0.38], mouth: 'closed', sprout: 'droop', flower: true },
  aha: { eyes: 'round', mouth: 'small', sprout: 'bulb' },
  hype: { eyes: 'arcs', mouth: 'grin', sprout: 'perky', flower: true },
  panic: { eyes: 'spiral', mouth: 'wobble', sprout: 'wilt', sweat: true },
}

// Sprout poses from the 2D rig, relative to the stem base (px, SVG y-down).
const SPROUTS = {
  droop: [[[0, 0], [-1, -18], [10, -29], [24, -25]], [[24, -25], [33, -22], [35, -13], [28, -9]]],
  perky: [[[0, 0], [-1, -14], [3, -25], [13, -32]]],
  wilt: [[[0, 0], [6, -9], [20, -9], [31, 1]]],
  bulb: [[[0, 0], [0, -4], [0, -7], [0, -10]]],
}

function useMaterials() {
  return useMemo(() => {
    const flock = flockTexture()
    const velvet = (color, sheenColor, vertexColors = false) =>
      new THREE.MeshPhysicalMaterial({
        color,
        vertexColors,
        roughness: 0.9,
        sheen: 1,
        sheenRoughness: 0.7,
        sheenColor,
        bumpMap: flock,
        bumpScale: 1.2,
      })
    const vinyl = (color, roughness = 0.45, extra = {}) => new THREE.MeshPhysicalMaterial({ color, roughness, clearcoat: 0.5, clearcoatRoughness: 0.35, ...extra })
    return {
      fur: velvet(C.body, '#C9A27C'),
      furV: velvet(C.body, '#C9A27C', true),
      shade: velvet(C.shade, '#B48C68'),
      belly: velvet('#DBBB95', '#EBD2B2'),
      ink: new THREE.MeshStandardMaterial({ color: C.ink, roughness: 0.6 }),
      nostril: new THREE.MeshStandardMaterial({ color: C.dark, roughness: 0.75 }),
      lens: new THREE.MeshPhysicalMaterial({ color: C.eye, roughness: 0.12, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04 }),
      paint: new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false }),
      white: vinyl('#FBFAF6', 0.5),
      mouth: new THREE.MeshStandardMaterial({ color: C.mouth, roughness: 0.55 }),
      tongue: vinyl(C.tongue, 0.5),
      yuzu: new THREE.MeshPhysicalMaterial({ color: C.yuzu, roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.3, bumpMap: peelTexture(), bumpScale: 1.6 }),
      leaf: vinyl(C.leaf, 0.5),
      stem: vinyl('#6FA650', 0.55),
      petal: vinyl(C.petal, 0.55),
      pollen: vinyl(C.pollen, 0.5),
      blush: new THREE.MeshBasicMaterial({ map: blushTexture(), transparent: true, depthWrite: false, toneMapped: true, opacity: 0.9 }),
      bulb: new THREE.MeshStandardMaterial({ color: '#FFE27A', emissive: '#FFD54A', emissiveIntensity: 2.2, roughness: 0.3, toneMapped: false }),
      metal: new THREE.MeshStandardMaterial({ color: '#C9D2CF', roughness: 0.3, metalness: 0.6 }),
      glow: new THREE.SpriteMaterial({ map: glowTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }),
      ray: new THREE.MeshBasicMaterial({ color: '#F6B830', toneMapped: false }),
      sweat: new THREE.MeshPhysicalMaterial({ color: '#9EDCF5', roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.88 }),
    }
  }, [])
}

function useGeometries() {
  return useMemo(() => {
    const head = blobGeometry({
      size: HEAD.size,
      p: HEAD.p,
      deform: (v) => {
        const t = -v.y / HEAD.size[1] // -1 top .. 1 bottom
        v.x *= 1 + 0.06 * t // jowly: wider at the cheeks
        v.z *= 1 + 0.03 * t
      },
    })
    // airbrush: darker crown and nape, warmer/lighter jowls
    airbrush(head, (v) => {
      const yn = v.y / HEAD.size[1]
      const zn = v.z / HEAD.size[2]
      // contact darkening where the muzzle meets the face
      const mx = Math.abs(v.x) / (MUZZLE.size[0] * 1.02)
      const my = Math.abs(v.y - (MUZZLE.pos[1] - HEAD.pos[1])) / MUZZLE.size[1]
      const d = Math.pow(mx ** 2.5 + my ** 2.5, 1 / 2.5)
      const occ = 0.16 * smooth(1.35, 0.95, d) * smooth(0.2, 0.6, zn)
      return 1 - 0.13 * smooth(0.25, 1, yn) - 0.12 * smooth(0, 1, -zn) + 0.05 * smooth(0.1, 0.9, -yn) * smooth(0, 1, zn) - occ
    })
    const body = blobGeometry({
      size: BODY.size,
      p: BODY.p,
      deform: (v) => {
        const t = -v.y / BODY.size[1]
        v.x *= 1 + 0.05 * t
        if (v.y < 0) v.y *= 0.92 // sits flatter on its belly
      },
    })
    airbrush(body, (v) => {
      const yn = v.y / BODY.size[1]
      const zn = v.z / BODY.size[2]
      // tucked under the head: a little darker
      const occ = 0.12 * smooth(0.2, 0.8, zn) * smooth(-0.2, 0.6, yn)
      return 1 - 0.16 * smooth(0.1, 1, yn) + 0.04 * smooth(0, 1, -yn) - occ
    })
    const muzzle = blobGeometry({
      size: MUZZLE.size,
      p: MUZZLE.p,
      deform: (v) => {
        const t = -v.y / MUZZLE.size[1]
        v.x *= 1 + 0.05 * t
      },
    })
    const sphere = new THREE.SphereGeometry(1, 48, 32)
    const leaf = blobGeometry({
      size: [1, 0.5, 0.12],
      p: 2,
      segs: [32, 20],
      deform: (v) => {
        v.y *= Math.pow(1 - Math.min(1, Math.abs(v.x)), 0.55) * 1.25
        v.z += 0.22 * v.x * v.x - 0.1 * Math.abs(v.y)
      },
    })
    return { head, body, muzzle, sphere, leaf }
  }, [])
}

// ---------------- eyes ----------------
function lensNormal(u, v, w, rx, ry, rz) {
  return new THREE.Vector3(u / rx, v / ry, w / rz).normalize()
}

// A dot painted onto the lens at unit-sphere coords (u, v) (y up).
function LensDot({ u, v, r, rx, ry, rz, mat, star }) {
  const w = Math.sqrt(Math.max(0.02, 1 - u * u - v * v))
  const p = [u * rx, v * ry, w * rz]
  const n = lensNormal(p[0], p[1], p[2], rx * rx, ry * ry, rz * rz)
  const q = faceQuat(n)
  const geo = useMemo(() => {
    if (!star) return new THREE.CircleGeometry(r, 28)
    const s = new THREE.Shape()
    const k = r * 0.3
    s.moveTo(0, r)
    s.quadraticCurveTo(k, k, r, 0)
    s.quadraticCurveTo(k, -k, 0, -r)
    s.quadraticCurveTo(-k, -k, -r, 0)
    s.quadraticCurveTo(-k, k, 0, r)
    return new THREE.ShapeGeometry(s, 8)
  }, [r, star])
  return <mesh geometry={geo} material={mat} position={[p[0] + n.x * 0.004, p[1] + n.y * 0.004, p[2] + n.z * 0.004]} quaternion={q} />
}

function LensEye({ at, rx, ry, rz, lid, sparkle, M, G }) {
  const yCut = 1 - 2 * lid // lid line in unit coords (y up)
  const lidGeo = useMemo(() => (lid > 0.02 ? new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, 0, Math.acos(yCut)) : null), [lid, yCut])
  const lidLine = useMemo(() => {
    if (lid <= 0.02) return null
    const sx = 1.09
    const sz = 1.3
    const rr = Math.sqrt(1 - yCut * yCut)
    const pts = []
    for (let i = 0; i <= 40; i++) {
      const t = -1.75 + (3.5 * i) / 40
      pts.push(new THREE.Vector3(Math.sin(t) * rr * rx * sx, yCut * ry * 1.09, Math.cos(t) * rr * rz * sz))
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.024, 10, false)
  }, [lid, yCut, rx, ry, rz])
  // highlight placement copied from the 2D eye
  const hyTop = lid > 0.02 ? -(2 * lid - 1) - (0.42 * rx) / ry : 1
  const bigV = Math.min(0.45, hyTop)
  return (
    <group position={at.point} quaternion={at.q}>
      <mesh geometry={G.sphere} material={M.lens} scale={[rx, ry, rz]} />
      <LensDot u={-0.32} v={bigV} r={rx * 0.34} rx={rx} ry={ry} rz={rz} mat={M.paint} />
      <LensDot u={0.36} v={-0.48} r={rx * 0.16} rx={rx} ry={ry} rz={rz} mat={M.paint} />
      {sparkle && <LensDot u={0.3} v={0.3} r={rx * 0.3} rx={rx} ry={ry} rz={rz} mat={M.paint} star />}
      {lidGeo && (
        <>
          <mesh geometry={lidGeo} material={M.fur} scale={[rx * 1.09, ry * 1.09, rz * 1.3]} />
          <mesh geometry={lidLine} material={M.ink} />
        </>
      )}
    </group>
  )
}

function Eyes({ mode, lid, eyeAt, hitFace, M, G }) {
  const parts = useMemo(() => {
    if (mode === 'arcs') {
      return eyeAt.map(({ x, y }) => {
        const w = 0.17
        const pts = []
        for (let i = 0; i <= 16; i++) {
          const t = i / 16
          const a = [x - w, y - 0.35 * w]
          const c = [x, y + w * 1.1]
          const b = [x + w, y - 0.35 * w]
          const mt = 1 - t
          pts.push([mt * mt * a[0] + 2 * mt * t * c[0] + t * t * b[0], mt * mt * a[1] + 2 * mt * t * c[1] + t * t * b[1]])
        }
        return { tube: surfaceTube(pts, hitFace, { radius: 0.036, lift: 0.02 }) }
      })
    }
    if (mode === 'spiral') {
      return eyeAt.map(({ x, y }) => {
        const r = 0.2
        const disc = conformGeometry(new THREE.CircleGeometry(r, 40).translate(x, y, 0), hitFace, 0.012)
        const ring = []
        for (let i = 0; i <= 48; i++) ring.push([x + Math.cos((i / 48) * Math.PI * 2) * r, y + Math.sin((i / 48) * Math.PI * 2) * r])
        const spiral = []
        for (let i = 0; i <= 80; i++) {
          const th = (i / 80) * Math.PI * 2 * 2.6
          const rr = (r * 0.82 * th) / (Math.PI * 2 * 2.6)
          spiral.push([x + Math.cos(th) * rr, y + Math.sin(th) * rr])
        }
        return {
          disc,
          ring: surfaceTube(ring, hitFace, { radius: 0.022, lift: 0.016, segs: 64 }),
          tube: surfaceTube(spiral, hitFace, { radius: 0.017, lift: 0.02, segs: 96 }),
        }
      })
    }
    return null
  }, [mode, eyeAt, hitFace])

  if (parts) {
    return parts.map((p, i) => (
      <group key={i}>
        {p.disc && <mesh geometry={p.disc} material={M.white} />}
        {p.ring && <mesh geometry={p.ring} material={M.ink} />}
        <mesh geometry={p.tube} material={M.ink} />
      </group>
    ))
  }
  const round = mode === 'round'
  const k = round ? 1.1 : 1
  return eyeAt.map((e, i) => (
    <LensEye key={i} at={e} rx={0.2 * k} ry={0.25 * k} rz={0.085 * k} lid={round ? 0 : lid[i]} sparkle={round} M={M} G={G} />
  ))
}

// ---------------- mouth ----------------
function Mouth({ shape, hitMuzzle, M }) {
  const parts = useMemo(() => {
    const ax = X(101)
    const ay = Y(146) + 0.07
    const s = (shape === 'grin' ? 0.92 : 1.05) * PX
    const P = (dx, dy) => [ax + dx * s, ay - dy * s] // px offsets, SVG y-down
    const conformShape = (shape2d, lift) => conformGeometry(new THREE.ShapeGeometry(shape2d, 24), hitMuzzle, lift)
    if (shape === 'small') {
      const sh = new THREE.Shape().absellipse(ax, ay - 0.01, 0.105, 0.075, 0, Math.PI * 2)
      const ring = []
      for (let i = 0; i <= 40; i++) ring.push([ax + Math.cos((i / 40) * Math.PI * 2) * 0.105, ay - 0.01 + Math.sin((i / 40) * Math.PI * 2) * 0.075])
      return [
        { geo: conformShape(sh, 0.006), mat: M.mouth },
        { geo: surfaceTube(ring, hitMuzzle, { radius: 0.022, lift: 0.01, segs: 48 }), mat: M.ink },
      ]
    }
    if (shape === 'grin') {
      const sh = new THREE.Shape()
      sh.moveTo(...P(-17, -6))
      sh.quadraticCurveTo(...P(0, -3), ...P(17, -7))
      sh.quadraticCurveTo(...P(14, 13), ...P(0, 13))
      sh.quadraticCurveTo(...P(-15, 13), ...P(-17, -6))
      const outline = sh.getPoints(16).map((p) => [p.x, p.y])
      const tongue = new THREE.Shape().absellipse(...P(2, 8), 8 * s, 3.6 * s, 0, Math.PI * 2)
      return [
        { geo: conformShape(sh, 0.006), mat: M.mouth },
        { geo: conformShape(tongue, 0.009), mat: M.tongue },
        { geo: surfaceTube(outline, hitMuzzle, { radius: 0.022, lift: 0.01, segs: 80 }), mat: M.ink },
      ]
    }
    if (shape === 'wobble') {
      const pts = [P(-14, 2), P(-9, -2), P(-4, 2), P(1, -2), P(6, 2), P(11, -2)]
      return [{ geo: surfaceTube(pts, hitMuzzle, { radius: 0.026, lift: 0.012, segs: 60 }), mat: M.ink }]
    }
    // closed deadpan line, a hair of a curve so it reads on the rounded muzzle
    const pts = [P(-9, 0), P(0, 0.9), P(9, 0.4)]
    return [{ geo: surfaceTube(pts, hitMuzzle, { radius: 0.03, lift: 0.012, segs: 24 }), mat: M.ink }]
  }, [shape, hitMuzzle, M])
  return parts.map((p, i) => <mesh key={i} geometry={p.geo} material={p.mat} />)
}

// ---------------- yuzu + brain sprout ----------------
function Sprout({ pose, flower, base, M, G }) {
  const S = 1.2 * PX
  const chain = SPROUTS[pose] ?? SPROUTS.droop
  const { tube, tip, tipDir } = useMemo(() => {
    const pts2 = bezierPoints(chain.map((seg) => seg.map(([x, y]) => [x * S, -y * S])), 18)
    const n = pts2.length
    const pts = pts2.map(([x, y], i) => new THREE.Vector3(x, y, 0.06 * Math.sin((i / (n - 1)) * Math.PI)))
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal')
    const tg = curve.getTangent(1)
    return { tube: new THREE.TubeGeometry(curve, 64, 0.062, 14, false), tip: pts[n - 1], tipDir: tg }
  }, [chain, S])
  const bulb = pose === 'bulb'
  const leafRot = Math.atan2(tipDir.y, tipDir.x)
  return (
    <group position={base}>
      <mesh geometry={tube} material={M.stem} castShadow />
      <mesh geometry={G.sphere} material={M.stem} position={tip} scale={0.062} />
      {bulb ? (
        <Bulb at={tip} M={M} G={G} />
      ) : (
        <group position={tip}>
          <mesh geometry={G.leaf} material={M.leaf} scale={[0.15, 0.15, 0.15]} rotation={[0, 0, leafRot]} position={[Math.cos(leafRot) * 0.1, Math.sin(leafRot) * 0.1, 0]} castShadow />
          {flower && <Flower M={M} G={G} />}
        </group>
      )}
    </group>
  )
}

function Flower({ M, G }) {
  return (
    <group position={[0.02, 0.02, 0.07]} rotation={[-0.25, 0.25, 0]}>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2 + 0.3
        return <mesh key={i} geometry={G.sphere} material={M.petal} position={[Math.cos(a) * 0.075, Math.sin(a) * 0.075, 0]} scale={[0.062, 0.062, 0.028]} castShadow />
      })}
      <mesh geometry={G.sphere} material={M.pollen} position={[0, 0, 0.025]} scale={[0.045, 0.045, 0.03]} />
    </group>
  )
}

function Bulb({ at, M, G }) {
  const R = 0.21
  const c = [at.x, at.y + 0.1 + R, at.z]
  return (
    <group position={c}>
      <sprite material={M.glow} scale={1.15} />
      <mesh geometry={G.sphere} material={M.bulb} scale={R} />
      <mesh material={M.metal} position={[0, -R - 0.03, 0]}>
        <cylinderGeometry args={[0.1, 0.085, 0.13, 24]} />
      </mesh>
      {[-1, 0, 1].map((k) => (
        <mesh key={k} material={M.metal} position={[0, -R - 0.03 + k * 0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.098, 0.012, 8, 24]} />
        </mesh>
      ))}
      {[-62, -31, 0, 31, 62].map((d) => {
        const a = THREE.MathUtils.degToRad(d)
        const r0 = R + 0.12
        return (
          <mesh key={d} material={M.ray} position={[Math.sin(a) * (r0 + 0.07), Math.cos(a) * (r0 + 0.07), 0]} rotation={[0, 0, -a]}>
            <capsuleGeometry args={[0.025, 0.1, 4, 8]} />
          </mesh>
        )
      })}
      <pointLight color="#FFD66B" intensity={2.5} distance={3} decay={2} />
    </group>
  )
}

function Yuzu({ at, M, G }) {
  const r = 0.27
  return (
    <group position={at}>
      <mesh geometry={G.sphere} material={M.yuzu} scale={[r, r * 0.9, r]} castShadow receiveShadow />
      {/* navel + stem nub */}
      <mesh geometry={G.sphere} material={M.stem} position={[0, r * 0.88, 0]} scale={[0.045, 0.03, 0.045]} />
      <mesh geometry={G.leaf} material={M.leaf} position={[-0.2, r * 0.8, 0.07]} rotation={[0.35, 0.25, 2.8]} scale={0.17} castShadow />
    </group>
  )
}

function SweatDrop({ at, M }) {
  const geo = useMemo(
    () =>
      blobGeometry({
        size: [1, 1, 0.75],
        p: 2,
        segs: [32, 24],
        deform: (v) => {
          if (v.y > 0) {
            const k = 1 - v.y
            v.x *= k
            v.z *= k
            v.y *= 1.6
          }
        },
      }),
    [],
  )
  return <mesh geometry={geo} material={M.sweat} position={at} scale={0.1} rotation={[0, 0, -0.35]} />
}

// ---------------- the figure ----------------
export function CapybaraModel({ mood = 'deadpan' }) {
  const spec = MOODS[mood] ?? MOODS.deadpan
  const M = useMaterials()
  const G = useGeometries()

  const S = useMemo(() => {
    const headPart = { geometry: G.head, position: HEAD.pos }
    const muzzlePart = { geometry: G.muzzle, position: MUZZLE.pos }
    const hitFace = makeSurface([headPart, muzzlePart])
    const hitHead = makeSurface([headPart])
    const hitMuzzle = makeSurface([muzzlePart])
    const eyeAt = [
      [X(69), Y(100) - 0.02],
      [X(131), Y(99.5) - 0.02],
    ].map(([x, y]) => {
      const h = hitHead(x, y)
      const n = h.normal.clone().lerp(new THREE.Vector3(0, 0, 1), 0.35).normalize()
      return { x, y, point: h.point.clone().addScaledVector(n, -0.045), q: faceQuat(n) }
    })
    const nostrils = [-1, 1].map((sgn) => {
      const h = hitMuzzle(sgn * 0.2, Y(118) - 0.02)
      return { point: h.point.clone().addScaledVector(h.normal, -0.012), q: faceQuat(h.normal, sgn * 0.35) }
    })
    const blush = [-1, 1].map((sgn) => conformGeometry(new THREE.PlaneGeometry(0.34, 0.22, 12, 8).translate(sgn * 0.8, Y(130) + 0.04, 0), hitHead, 0.01))
    const topY = HEAD.pos[1] + HEAD.size[1]
    const sw = hitHead(X(156), Y(88))
    const sweat = sw.point.clone().addScaledVector(sw.normal, 0.09)
    return { hitFace, hitMuzzle, eyeAt, nostrils, blush, topY, sweat }
  }, [G])

  const yuzuAt = [0, S.topY + 0.2, HEAD.pos[2] - 0.05]
  const sproutBase = [yuzuAt[0], yuzuAt[1] + 0.23, yuzuAt[2]]
  const earY = HEAD.pos[1] + 0.69

  return (
    <group>
      {/* body loaf */}
      <mesh geometry={G.body} material={M.furV} position={BODY.pos} castShadow receiveShadow />
      {/* stubby legs */}
      {[
        [-0.6, 0.18],
        [0.6, 0.18],
        [-0.7, -0.95],
        [0.7, -0.95],
      ].map(([x, z], i) => (
        <mesh key={i} geometry={G.sphere} material={M.shade} position={[x, 0.17, z]} scale={[0.22, 0.17, 0.24]} castShadow receiveShadow />
      ))}
      {/* head */}
      <mesh geometry={G.head} material={M.furV} position={HEAD.pos} castShadow receiveShadow />
      {/* tiny round ears */}
      {[-1, 1].map((sgn) => (
        <group key={sgn} position={[sgn * 0.62, earY, HEAD.pos[2] - 0.12]} rotation={[0, sgn * -0.25, sgn * -0.35]}>
          <mesh geometry={G.sphere} material={M.fur} scale={[0.19, 0.18, 0.11]} castShadow />
          <mesh geometry={G.sphere} material={M.nostril} position={[0, -0.005, 0.07]} scale={[0.1, 0.095, 0.05]} />
        </group>
      ))}
      {/* big blunt muzzle */}
      <mesh geometry={G.muzzle} material={M.belly} position={MUZZLE.pos} castShadow receiveShadow />
      {S.nostrils.map((n, i) => (
        <mesh key={i} geometry={G.sphere} material={M.nostril} position={n.point} quaternion={n.q} scale={[0.065, 0.04, 0.03]} />
      ))}
      {S.blush.map((g, i) => (
        <mesh key={i} geometry={g} material={M.blush} renderOrder={2} />
      ))}
      <Eyes mode={spec.eyes} lid={spec.lid ?? [0, 0]} eyeAt={S.eyeAt} hitFace={S.hitFace} M={M} G={G} />
      <Mouth shape={spec.mouth} hitMuzzle={S.hitMuzzle} M={M} />
      <Yuzu at={yuzuAt} M={M} G={G} />
      <Sprout pose={spec.sprout} flower={spec.flower} base={sproutBase} M={M} G={G} />
      {spec.sweat && <SweatDrop at={S.sweat} M={M} />}
    </group>
  )
}

// ---------------- stage ----------------
function Rig({ target = [0, 1.62, 0] }) {
  const { camera } = useThree()
  useLayoutEffect(() => {
    camera.lookAt(...target)
    camera.updateProjectionMatrix()
  }, [camera, target])
  return null
}

function Turntable({ spin, yaw, children }) {
  const ref = useRef()
  useFrame((_, dt) => {
    if (spin && ref.current) ref.current.rotation.y += dt * 0.35
  })
  return (
    <group ref={ref} rotation={[0, yaw, 0]}>
      {children}
    </group>
  )
}

export function StudioLights() {
  return (
    <>
      <ambientLight intensity={0.15} />
      <directionalLight
        position={[-3, 6, 5]}
        intensity={0.7}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-radius={6}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={4}
        shadow-camera-bottom={-2}
      />
      <Environment resolution={256} frames={1}>
        <color attach="background" args={['#4a5560']} />
        <Lightformer form="rect" intensity={1.2} position={[0, 7, 0]} scale={[12, 12, 1]} />
        <Lightformer form="rect" intensity={2.2} position={[-5, 3, 5]} scale={[5, 6, 1]} />
        <Lightformer form="rect" intensity={1.1} color="#e2f0ff" position={[6, 1.5, 3]} scale={[4, 5, 1]} />
        <Lightformer form="rect" intensity={4.5} position={[0, 3.5, -7]} scale={[10, 3, 1]} />
        <Lightformer form="rect" intensity={2.5} position={[-7, 2, -3]} scale={[3, 6, 1]} />
        <Lightformer form="rect" intensity={2.5} position={[7, 2, -3]} scale={[3, 6, 1]} />
        <Lightformer form="ring" intensity={5} position={[2, 4, 7]} scale={1.6} />
        <Lightformer form="rect" intensity={0.5} color="#f3e8dc" position={[0, -4, 1]} scale={[12, 12, 1]} />
      </Environment>
    </>
  )
}

/**
 * Self-contained turntable stage: <ToyCapybara mood="deadpan" />.
 * mood: deadpan | aha | hype | panic. spin: slow turntable. yaw: starting angle (radians).
 */
export default function ToyCapybara({ mood = 'deadpan', spin = true, yaw = 0, style, className, dpr = [1, 2], onReady }) {
  return (
    <div className={className} style={{ width: '100%', height: '100%', ...style }}>
      <Canvas
        shadows="soft"
        dpr={dpr}
        camera={{ position: [0, 2.6, 10.5], fov: 24, near: 0.1, far: 60 }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.NeutralToneMapping
          gl.toneMappingExposure = 0.92
          onReady?.()
        }}
      >
        <Rig />
        <StudioLights />
        <Turntable spin={spin} yaw={yaw}>
          <group position={[0, 0, 0.05]}>
            <CapybaraModel mood={mood} />
          </group>
        </Turntable>
        <ContactShadows position={[0, 0.002, 0]} opacity={0.85} scale={8} blur={1.8} far={2} resolution={512} color="#3b2a1c" />
      </Canvas>
    </div>
  )
}
