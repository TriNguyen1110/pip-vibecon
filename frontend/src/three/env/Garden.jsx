/* eslint-disable react/no-unknown-property, react-refresh/only-export-components */
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Mat } from '../parts/Mat'
import { BlobShadow } from '../parts/BlobShadow'
import { Sparkles } from '../parts/MoodIcon'
import { easeOutBack } from '../parts/geo'
import { Y2K } from '../palette'

const GRASS = '#86D85E'
const GRASS_DARK = '#6CC24C'
const DIRT = '#C98B5E'
const DIRT_DARK = '#A86F4A'
const LEAF = '#5FD06A'
const LEAF_2 = '#86E36B'
const TRUNK = '#B9794C'
const BLOSSOM = Y2K.bubblegum

const Leaf = ({ position, r = 0.1, rot = [0, 0, 0], color = LEAF, s = [1, 0.45, 1] }) => (
  <mesh position={position} rotation={rot} scale={s}>
    <sphereGeometry args={[r, 18, 12]} />
    <Mat color={color} rough={0.2} />
  </mesh>
)

function Dewdrop({ position }) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.035, 16, 12]} />
        <meshPhysicalMaterial color="#E8FFFF" roughness={0.05} clearcoat={1} transparent opacity={0.55} />
      </mesh>
      <mesh position={[-0.012, 0.014, 0.028]}>
        <sphereGeometry args={[0.009, 8, 6]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
    </group>
  )
}

function Seed() {
  return (
    <group>
      <mesh position={[0, 0.02, 0]} scale={[1, 0.4, 1]}>
        <sphereGeometry args={[0.16, 20, 12]} />
        <Mat color={DIRT} rough={0.5} />
      </mesh>
      <mesh position={[0, 0.09, 0]} rotation={[0, 0, 0.3]} scale={[0.75, 1, 0.75]}>
        <sphereGeometry args={[0.07, 18, 12]} />
        <Mat color={TRUNK} rough={0.25} />
      </mesh>
      <Leaf position={[0.02, 0.16, 0]} r={0.03} s={[1, 1.4, 1]} color={LEAF_2} />
    </group>
  )
}

function Sprout() {
  return (
    <group>
      <mesh position={[0, 0.13, 0]}>
        <cylinderGeometry args={[0.018, 0.022, 0.26, 8]} />
        <Mat color={LEAF} rough={0.3} />
      </mesh>
      <Leaf position={[-0.08, 0.27, 0]} r={0.08} rot={[0, 0, 0.45]} color={LEAF_2} />
      <Leaf position={[0.08, 0.29, 0]} r={0.085} rot={[0, 0, -0.45]} />
      <Dewdrop position={[0.1, 0.33, 0.04]} />
    </group>
  )
}

function Sapling() {
  return (
    <group>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.03, 0.045, 0.5, 10]} />
        <Mat color={TRUNK} rough={0.35} />
      </mesh>
      <Leaf position={[0, 0.56, 0]} r={0.13} s={[1, 0.9, 1]} />
      <Leaf position={[-0.13, 0.44, 0.02]} r={0.1} rot={[0, 0, 0.5]} color={LEAF_2} s={[1, 0.55, 1]} />
      <Leaf position={[0.14, 0.4, 0.02]} r={0.1} rot={[0, 0, -0.5]} s={[1, 0.55, 1]} />
      <Leaf position={[0.06, 0.32, -0.08]} r={0.08} rot={[0.3, 0, -0.3]} color={LEAF_2} s={[1, 0.55, 1]} />
      <Dewdrop position={[0.16, 0.44, 0.08]} />
    </group>
  )
}

function Bloom() {
  const blossoms = useMemo(
    () => [
      [0.18, 0.95, 0.2],
      [-0.22, 0.86, 0.18],
      [0.02, 1.12, 0.17],
      [0.3, 0.76, 0.05],
      [-0.12, 0.7, 0.24],
    ],
    [],
  )
  return (
    <group>
      <mesh position={[0, 0.34, 0]}>
        <cylinderGeometry args={[0.045, 0.07, 0.68, 12]} />
        <Mat color={TRUNK} rough={0.35} />
      </mesh>
      <mesh position={[0.08, 0.5, 0]} rotation={[0, 0, -0.8]}>
        <cylinderGeometry args={[0.02, 0.03, 0.22, 8]} />
        <Mat color={TRUNK} rough={0.35} />
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <sphereGeometry args={[0.32, 32, 24]} />
        <Mat color={LEAF} rough={0.2} />
      </mesh>
      <mesh position={[-0.24, 0.78, 0.04]}>
        <sphereGeometry args={[0.22, 28, 18]} />
        <Mat color={LEAF_2} rough={0.2} />
      </mesh>
      <mesh position={[0.25, 0.76, 0]}>
        <sphereGeometry args={[0.21, 28, 18]} />
        <Mat color={LEAF_2} rough={0.2} />
      </mesh>
      {blossoms.map((p, i) => (
        <mesh key={i} position={p} scale={[1, 1, 0.6]}>
          <sphereGeometry args={[0.05, 14, 10]} />
          <Mat color={i % 2 ? '#FFFFFF' : BLOSSOM} rough={0.2} />
        </mesh>
      ))}
      <Dewdrop position={[0.12, 1.02, 0.27]} />
    </group>
  )
}

const STAGES = [Seed, Sprout, Sapling, Bloom]

function Tree({ growth }) {
  const g = THREE.MathUtils.clamp(Number.isFinite(growth) ? growth : 0.6, 0, 1)
  const stage = g < 0.25 ? 0 : g < 0.5 ? 1 : g < 0.8 ? 2 : 3
  const Stage = STAGES[stage]
  const grp = useRef()
  const t0 = useRef(null)
  const prevStage = useRef(stage)
  const grew = useRef(false)
  if (prevStage.current !== stage) {
    grew.current = stage > prevStage.current
    prevStage.current = stage
    t0.current = null
  }
  // within a stage, a gentle size step with growth
  const within = stage === 3 ? 1 : 0.85 + 0.15 * ((g % 0.25) / 0.25)
  useFrame((s) => {
    if (!grp.current) return
    const t = s.clock.elapsedTime
    if (t0.current == null) t0.current = t
    const k = Math.min(1, (t - t0.current) / 0.6) // 600 ms ease-pop grow
    const pop = 0.4 + 0.6 * easeOutBack(k)
    grp.current.scale.setScalar(within * pop)
    grp.current.rotation.z = Math.sin(t * 0.9) * 0.025
  })
  return (
    <group>
      <BlobShadow size={stage === 3 ? 1.2 : 0.6} opacity={0.28} position={[0, 0.004, 0]} />
      <group ref={grp}>
        <Stage key={stage} />
      </group>
      {grew.current && <Sparkles key={`sp${stage}`} spread={0.35} height={stage === 3 ? 1.1 : 0.6} />}
    </group>
  )
}

// A setback sprouts a small weed; re-teaching pulls it out (it pops up and away).
function Weed({ on }) {
  const g = useRef()
  const st = useRef({ v: on ? 1 : 0, y: 0 })
  useFrame((s, dt) => {
    if (!g.current) return
    const S = st.current
    S.v = THREE.MathUtils.damp(S.v, on ? 1 : 0, on ? 8 : 5, Math.min(dt, 0.05))
    S.y = on ? 0 : (1 - S.v) * 0.4
    g.current.scale.setScalar(Math.max(0.0001, S.v))
    g.current.position.y = S.y
    g.current.rotation.z = Math.sin(s.clock.elapsedTime * 3) * 0.08
    g.current.visible = S.v > 0.01
  })
  return (
    <group position={[-0.35, 0, 0.35]}>
      <group ref={g}>
        {[-0.5, 0, 0.5].map((r, i) => (
          <mesh key={i} position={[r * 0.08, 0.09, 0]} rotation={[0, 0, -r * 0.8]}>
            <coneGeometry args={[0.025, 0.2, 6]} />
            <Mat color="#4E7A3A" rough={0.5} />
          </mesh>
        ))}
        <mesh position={[0, 0.2, 0]}>
          <sphereGeometry args={[0.035, 10, 8]} />
          <Mat color="#9C8A3A" rough={0.5} />
        </mesh>
      </group>
    </group>
  )
}

// At most 6 slow bubbles (6-10 s rise), white at .35 with a highlight.
function Bubbles() {
  const items = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        x: -1.7 + i * 0.68 + (i % 2) * 0.15,
        z: i % 2 ? -0.9 : 0.6,
        r: 0.035 + (i % 3) * 0.015,
        period: 6 + ((i * 7) % 5),
        off: i * 1.37,
      })),
    [],
  )
  const refs = useRef([])
  useFrame((s) => {
    const t = s.clock.elapsedTime
    items.forEach((b, i) => {
      const m = refs.current[i]
      if (!m) return
      const k = ((t + b.off * b.period) / b.period) % 1
      m.position.set(b.x + Math.sin(t * 0.8 + i) * 0.06, -0.6 + k * 2.9, b.z)
      const fade = Math.min(1, k * 6, (1 - k) * 6)
      m.scale.setScalar(Math.max(0.0001, fade))
    })
  })
  return items.map((b, i) => (
    <group key={i} ref={(el) => (refs.current[i] = el)}>
      <mesh>
        <sphereGeometry args={[b.r, 16, 12]} />
        <meshPhysicalMaterial color="#FFFFFF" transparent opacity={0.35} roughness={0.05} clearcoat={1} depthWrite={false} />
      </mesh>
      <mesh position={[-b.r * 0.35, b.r * 0.4, b.r * 0.8]}>
        <sphereGeometry args={[b.r * 0.22, 8, 6]} />
        <meshBasicMaterial color="#FFFFFF" toneMapped={false} />
      </mesh>
    </group>
  ))
}

function Island() {
  const rocks = useMemo(
    () => [
      [1.1, -0.45, 0.6, 0.16],
      [-1.0, -0.6, 0.5, 0.13],
      [0.3, -0.9, 0.55, 0.12],
    ],
    [],
  )
  return (
    <group>
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[1.62, 1.66, 0.2, 56]} />
        <Mat color={GRASS} rough={0.3} />
      </mesh>
      <mesh position={[0, -0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.62, 0.07, 10, 64]} />
        <Mat color={GRASS} rough={0.3} outline={false} />
      </mesh>
      <mesh position={[0, -0.5, 0]}>
        <cylinderGeometry args={[1.6, 0.85, 0.6, 40]} />
        <Mat color={DIRT} rough={0.5} />
      </mesh>
      <mesh position={[0, -1.05, 0]}>
        <cylinderGeometry args={[0.85, 0.06, 0.6, 32]} />
        <Mat color={DIRT_DARK} rough={0.5} />
      </mesh>
      <mesh position={[0, -0.215, 0]}>
        <cylinderGeometry args={[1.63, 1.63, 0.03, 56]} />
        <Mat color={GRASS_DARK} rough={0.4} outline={false} />
      </mesh>
      {rocks.map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} scale={[1.2, 0.8, 1]}>
          <sphereGeometry args={[r, 14, 10]} />
          <Mat color={i % 2 ? '#B8A99A' : '#CDBFB1'} rough={0.4} />
        </mesh>
      ))}
      {[
        [0.95, 0.55, Y2K.bubblegum],
        [1.15, -0.25, '#FFFFFF'],
        [-0.15, 0.9, Y2K.lilac],
        [0.55, -0.85, Y2K.tangerine],
      ].map(([x, z, c], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.07, 0]}>
            <cylinderGeometry args={[0.01, 0.012, 0.14, 6]} />
            <Mat color={LEAF} outline={false} />
          </mesh>
          <mesh position={[0, 0.15, 0]}>
            <sphereGeometry args={[0.05, 14, 10]} />
            <Mat color={c} rough={0.2} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export function Garden({ growth, weed }) {
  return (
    <group>
      <Island />
      <group position={[-0.72, 0, -0.3]} scale={1.3}>
        <Tree growth={growth} />
      </group>
      <Weed on={!!weed} />
      <Bubbles />
    </group>
  )
}
