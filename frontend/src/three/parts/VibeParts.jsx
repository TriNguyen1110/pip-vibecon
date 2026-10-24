/* eslint-disable react/no-unknown-property, react-refresh/only-export-components */
import * as THREE from 'three'
import { Mat, CHROME } from './Mat'
import { Fur } from './Fur'
import { At } from './shapes'

// ugly: scruffy spiky fur clumps sticking out at odd angles (head frame)
export function UglyTufts({ anchors = [], color }) {
  return anchors.map((a, i) => (
    <At key={i} a={a}>
      <group rotation={[Math.PI / 2 + ((i % 3) - 1) * 0.45, 0, ((i * 7) % 5) * 0.3 - 0.6]}>
        {[0, 1].map((j) => (
          <mesh key={j} position={[(j - 0.5) * 0.04, 0.06 + j * 0.015, 0]} rotation={[0, 0, (j - 0.5) * 0.6]}>
            <coneGeometry args={[0.035, 0.15 + ((i + j) % 3) * 0.03, 8]} />
            <Fur color={color} />
          </mesh>
        ))}
      </group>
    </At>
  ))
}

// ugly: lumpier silhouette (body frame)
export function Lumps({ anchors = [], color, fur = true }) {
  return anchors.map((a, i) => (
    <At key={i} a={a}>
      <mesh position={[0, 0, -0.03]} scale={[1.1, 0.9, 0.6]}>
        <sphereGeometry args={[0.1 + (i % 2) * 0.03, 18, 12]} />
        {fur ? <Fur color={color} /> : <Mat color={color} />}
      </mesh>
    </At>
  ))
}

// ugly: a band-aid on one ear/horn
export function Bandage({ a }) {
  if (!a) return null
  return (
    <At a={a}>
      <group rotation={[0, 0, 0.5]}>
        <mesh>
          <boxGeometry args={[0.15, 0.055, 0.02]} />
          <Mat color="#F2D3B1" rough={0.8} coat={0} />
        </mesh>
        <mesh position={[0, 0, 0.011]}>
          <boxGeometry args={[0.05, 0.045, 0.004]} />
          <Mat color="#E6B98E" rough={0.8} coat={0} outline={false} />
        </mesh>
        {/* safety pin */}
        <group position={[0.09, 0.03, 0.015]} rotation={[0, 0, -0.4]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.012, 0.004, 6, 12]} />
            <Mat {...CHROME} />
          </mesh>
          <mesh position={[0.03, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.004, 0.05, 3, 6]} />
            <Mat {...CHROME} />
          </mesh>
        </group>
      </group>
    </At>
  )
}

// cool: a slim chrome visor band across the forehead with a neon edge. v = { y, rTop, rBot, h, sz }
export function Visor({ v, accent }) {
  if (!v) return null
  if (v.box) {
    return (
      <group position={v.box.pos}>
        <mesh>
          <boxGeometry args={v.box.size} />
          <Mat {...CHROME} />
        </mesh>
        <mesh position={[0, -v.box.size[1] / 2 - 0.006, v.box.size[2] / 2]}>
          <boxGeometry args={[v.box.size[0], 0.012, 0.01]} />
          <meshBasicMaterial color={accent} toneMapped={false} />
        </mesh>
      </group>
    )
  }
  return (
    <group position={[0, v.y, 0]} rotation={[v.tilt ?? -0.08, 0, 0]} scale={[1, 1, v.sz ?? 1]}>
      <mesh>
        <cylinderGeometry args={[v.rTop, v.rBot, v.h, 40, 1, true, -1.25, 2.5]} />
        <Mat {...CHROME} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -v.h / 2, 0]}>
        <cylinderGeometry args={[v.rBot + 0.006, v.rBot + 0.006, 0.014, 40, 1, true, -1.2, 2.4]} />
        <meshBasicMaterial color={accent} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}
