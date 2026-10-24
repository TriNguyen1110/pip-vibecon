/* eslint-disable react/no-unknown-property, react-refresh/only-export-components */
import { useMemo } from 'react'
import * as THREE from 'three'
import { Mat } from './Mat'

const Y = new THREE.Vector3(0, 1, 0)

export function Ball({ r = 0.1, s = 1, seg = 24, color, rough, glow, emissive, outline, children, ...p }) {
  return (
    <mesh scale={s} {...p}>
      <sphereGeometry args={[r, seg, Math.max(8, Math.round(seg * 0.7))]} />
      <Mat color={color} rough={rough} glow={glow} emissive={emissive} outline={outline} />
      {children}
    </mesh>
  )
}

// Capsule spanning two points.
export function Rod({ a, b, r = 0.03, color, rough, glow, emissive, outline, seg = 10 }) {
  const A = new THREE.Vector3(...a)
  const B = new THREE.Vector3(...b)
  const d = B.clone().sub(A)
  const len = Math.max(0.0001, d.length())
  const q = new THREE.Quaternion().setFromUnitVectors(Y, d.normalize())
  return (
    <mesh position={A.add(B).multiplyScalar(0.5).toArray()} quaternion={q.toArray()}>
      <capsuleGeometry args={[r, len, 4, seg]} />
      <Mat color={color} rough={rough} glow={glow} emissive={emissive} outline={outline} />
    </mesh>
  )
}

// Smooth tube through points, with round caps at both ends.
export function Tube({ points, r = 0.05, color, rough, seg = 20, endR }) {
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(points)],
  )
  const first = points[0]
  const last = points[points.length - 1]
  return (
    <group>
      <mesh>
        <tubeGeometry args={[curve, seg, r, 10, false]} />
        <Mat color={color} rough={rough} />
      </mesh>
      <Ball r={r} position={first} color={color} rough={rough} seg={12} outline={false} />
      <Ball r={endR ?? r} position={last} color={color} rough={rough} seg={14} />
    </group>
  )
}

// Group placed on a surface anchor from onEllipsoid/onPlane.
export function At({ a, children, ...p }) {
  return (
    <group position={a.position} quaternion={a.quaternion} {...p}>
      {children}
    </group>
  )
}
