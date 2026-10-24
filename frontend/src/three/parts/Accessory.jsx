/* eslint-disable react/no-unknown-property, react-refresh/only-export-components */
import * as THREE from 'three'
import { Mat, CHROME, IRID } from './Mat'
import { Ball, Rod, Tube } from './shapes'
import { UI, INK } from '../palette'
import { RoundedBox } from '@react-three/drei'
import { textTexture } from './textures'

// Round glasses built from the face's eye anchors. side = [halfWidth, z] where temples end.
export function Glasses({ face, side = [0.5, 0], scale = 1.5, lift }) {
  const gr = Math.max(face.w, face.h) * scale
  const lf = lift ?? face.w * 0.75
  const centers = face.eyes.map((e) => {
    const n = new THREE.Vector3(...e.normal)
    return new THREE.Vector3(...e.position).addScaledVector(n, lf)
  })
  const [c0, c1] = centers
  const tube = gr * 0.11
  const bridgeA = c0.clone().add(new THREE.Vector3(gr * 0.96, gr * 0.1, 0))
  const bridgeB = c1.clone().add(new THREE.Vector3(-gr * 0.96, gr * 0.1, 0))
  return (
    <group>
      {face.eyes.map((e, i) => (
        <group key={i} position={centers[i].toArray()} quaternion={e.quaternion}>
          <mesh>
            <torusGeometry args={[gr, tube, 8, 28]} />
            <Mat color="#3B3550" rough={0.2} metal={0.3} thick={1.6} {...IRID} />
          </mesh>
          <mesh position={[0, 0, -tube * 0.3]}>
            <circleGeometry args={[gr, 24]} />
            <meshStandardMaterial color={UI.ice} transparent opacity={0.22} roughness={0.1} depthWrite={false} />
          </mesh>
        </group>
      ))}
      <Rod a={bridgeA.toArray()} b={bridgeB.toArray()} r={tube * 0.85} color="#3B3550" rough={0.2} />
      {centers.map((c, i) => {
        const sgn = i === 0 ? -1 : 1
        const a = c.clone().add(new THREE.Vector3(sgn * gr * 0.97, 0, 0))
        const b = new THREE.Vector3(sgn * side[0], c.y + gr * 0.1, side[1])
        return <Rod key={i} a={a.toArray()} b={b.toArray()} r={tube * 0.8} color="#3B3550" rough={0.2} />
      })}
    </group>
  )
}

// Chunky knit scarf in the body frame. scarf = { y, r, tube, rx, rz }
export function Scarf({ scarf }) {
  const { y, r, tube = 0.07, rz = 1, tail = 1 } = scarf
  const col = UI.sunset
  const stripe = UI.ivory
  return (
    <group position={[0, y, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1, rz, 1]}>
        <torusGeometry args={[r, tube, 12, 32]} />
        <Mat color={col} rough={0.95} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1, rz, 1]} position={[0, tube * 0.15, 0]}>
        <torusGeometry args={[r + tube * 0.25, tube * 0.32, 6, 32]} />
        <Mat color={stripe} rough={0.95} outline={false} />
      </mesh>
      {/* knot + hanging tail at the front, offset to one side */}
      <group position={[r * 0.42, -tube * 0.2, r * rz * 0.92 + tube * 0.6]} rotation={[-0.25, 0, 0.12]} scale={tail}>
        <Ball r={tube * 1.05} color={col} rough={0.95} seg={14} />
        <mesh position={[0, -tube * 2.4, 0]}>
          <boxGeometry args={[tube * 2.1, tube * 4.2, tube * 0.8]} />
          <Mat color={col} rough={0.95} />
        </mesh>
        <mesh position={[0, -tube * 3.4, 0.002]}>
          <boxGeometry args={[tube * 2.14, tube * 0.45, tube * 0.84]} />
          <Mat color={stripe} rough={0.95} outline={false} />
        </mesh>
        <mesh position={[0, -tube * 2.6, 0.002]}>
          <boxGeometry args={[tube * 2.14, tube * 0.45, tube * 0.84]} />
          <Mat color={stripe} rough={0.95} outline={false} />
        </mesh>
      </group>
    </group>
  )
}


// Pencil tucked behind the ear (head frame). pencil = { pos, rot }
export function Pencil({ pencil }) {
  if (pencil.anchor) {
    return (
      <group position={pencil.anchor.position} quaternion={pencil.anchor.quaternion}>
        <Pencil pencil={{ pos: [0, 0, 0.035], rot: pencil.rot }} />
      </group>
    )
  }
  return (
    <group position={pencil.pos} rotation={pencil.rot}>
      <mesh>
        <cylinderGeometry args={[0.03, 0.03, 0.34, 6]} />
        <Mat color="#F2C14E" rough={0.55} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <coneGeometry args={[0.03, 0.07, 6]} />
        <Mat color="#EBCB9F" rough={0.8} outline={false} />
      </mesh>
      <mesh position={[0, 0.226, 0]}>
        <coneGeometry args={[0.011, 0.022, 8]} />
        <Mat color={INK} rough={0.4} outline={false} />
      </mesh>
      <mesh position={[0, -0.19, 0]}>
        <cylinderGeometry args={[0.032, 0.032, 0.05, 14]} />
        <Mat {...CHROME} />
      </mesh>
      <mesh position={[0, -0.235, 0]}>
        <capsuleGeometry args={[0.03, 0.03, 4, 12]} />
        <Mat color="#F19C9C" rough={0.7} />
      </mesh>
    </group>
  )
}

let badgeTex
function badgeTexture() {
  if (!badgeTex) {
    badgeTex = textTexture((g, w, h) => {
      g.fillStyle = UI.ice
      g.beginPath()
      g.arc(w / 2, h / 2, w / 2, 0, Math.PI * 2)
      g.fill()
      g.fillStyle = INK
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.font = '700 30px system-ui, -apple-system, sans-serif'
      g.fillText('BRAIN', w / 2, h * 0.3)
      g.font = '800 92px system-ui, -apple-system, sans-serif'
      g.fillText('v2', w / 2, h * 0.62)
    }, 256, 256)
  }
  return badgeTex
}

// Enamel "Brain v2" pin (body frame). badge = surface anchor
export function Badge({ badge, size = 0.09 }) {
  return (
    <group position={badge.position} quaternion={badge.quaternion}>
      <mesh position={[0, 0, 0.006]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[size, size, 0.018, 28]} />
        <Mat {...CHROME} />
      </mesh>
      <mesh position={[0, 0, 0.0165]}>
        <circleGeometry args={[size * 0.84, 28]} />
        <meshPhysicalMaterial map={badgeTexture()} roughness={0.2} clearcoat={1} clearcoatRoughness={0.05} {...IRID} />
      </mesh>
    </group>
  )
}

// Tiny backpack on the back (body frame). pack = { pos, s, straps: [[a, b], ...] }
export function Backpack({ pack }) {
  const col = UI.sunset
  const dark = '#D97E5C'
  return (
    <group>
      <group position={pack.pos} scale={pack.s ?? 1} rotation={[pack.tilt ?? 0.08, 0, 0]}>
        <RoundedBox args={[0.44, 0.46, 0.2]} radius={0.08} smoothness={3}>
          <Mat color={col} rough={0.7} />
        </RoundedBox>
        <RoundedBox args={[0.45, 0.17, 0.22]} radius={0.07} smoothness={3} position={[0, 0.16, -0.008]}>
          <Mat color={dark} rough={0.7} />
        </RoundedBox>
        <RoundedBox args={[0.28, 0.15, 0.07]} radius={0.03} smoothness={2} position={[0, -0.09, -0.12]}>
          <Mat color={dark} rough={0.7} />
        </RoundedBox>
        <mesh position={[0, 0.24, 0]}>
          <torusGeometry args={[0.06, 0.016, 6, 16, Math.PI]} />
          <Mat color={INK} rough={0.6} />
        </mesh>
        <mesh position={[0.1, 0.12, -0.12]}>
          <cylinderGeometry args={[0.012, 0.012, 0.03, 8]} />
          <Mat {...CHROME} />
        </mesh>
      </group>
      {(pack.straps ?? []).map(([a, b], i) => (
        <Rod key={i} a={a} b={b} r={0.028} color={dark} rough={0.4} />
      ))}
      {(pack.curves ?? []).map((pts, i) => (
        <Tube key={`c${i}`} points={pts} r={0.026} color={dark} rough={0.4} />
      ))}
    </group>
  )
}

// ugly vibe: a big stitched-on patch (body frame), mirrored from the badge anchor, with cross-stitches
export function StitchPatch({ anchor, color, size = 0.3 }) {
  const [x, y, z] = anchor.position
  const [qx, qy, qz, qw] = anchor.quaternion
  const W = size
  const H = size * 0.85
  const crosses = []
  const n = 4
  for (let i = 0; i < n; i++) {
    const k = -0.5 + (i + 0.5) / n
    crosses.push([k * W, H / 2], [k * W, -H / 2], [W / 2, k * H], [-W / 2, k * H])
  }
  return (
    <group position={[-x, y, z]} quaternion={[qx, -qy, -qz, qw]}>
      <group rotation={[0, 0, 0.22]}>
        <mesh position={[0, 0, 0.006]}>
          <boxGeometry args={[W, H, 0.02]} />
          <Mat color={color} rough={0.85} coat={0} />
        </mesh>
        {crosses.map(([cx, cy], i) => (
          <group key={i} position={[cx, cy, 0.02]}>
            {[0.785, -0.785].map((r) => (
              <mesh key={r} rotation={[0, 0, r]}>
                <capsuleGeometry args={[0.007, size * 0.11, 3, 6]} />
                <meshStandardMaterial color={INK} roughness={0.6} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </group>
  )
}

export function HeadAccessory({ type, spec }) {
  if (type === 'glasses') return <Glasses face={spec.face} side={spec.glassesSide} lift={spec.glassesLift} />
  if (type === 'pencil' && spec.pencil) return <Pencil pencil={spec.pencil} />
  return null
}

export function BodyAccessory({ type, spec }) {
  if (type === 'scarf' && spec.scarf) return <Scarf scarf={spec.scarf} />
  if (type === 'badge' && spec.badge) return <Badge badge={spec.badge} />
  if (type === 'backpack' && spec.pack) return <Backpack pack={spec.pack} />
  return null
}
