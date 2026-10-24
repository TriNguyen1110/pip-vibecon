/* eslint-disable react/no-unknown-property, react-refresh/only-export-components */
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mat } from './Mat'
import { UI } from '../palette'
import { easeOutBack } from './geo'
import { glowTexture } from './textures'

function usePop(ref, base = 1, still = false) {
  const t0 = useRef(null)
  useFrame((state) => {
    if (!ref.current || still) return
    const t = state.clock.elapsedTime
    if (t0.current == null) t0.current = t
    const k = Math.min(1, (t - t0.current) / 0.45)
    ref.current.scale.setScalar(base * Math.max(0.001, easeOutBack(k)))
  })
}

function Question({ still }) {
  const g = useRef()
  usePop(g, 1, still)
  const spin = useRef()
  useFrame((s) => {
    if (spin.current && !still) spin.current.rotation.y = Math.sin(s.clock.elapsedTime * 1.4) * 0.45
  })
  return (
    <group ref={g}>
      <group ref={spin} scale={0.16}>
        <mesh rotation={[0, 0, -Math.PI / 2]}>
          <torusGeometry args={[0.5, 0.17, 10, 26, Math.PI * 1.5]} />
          <Mat color={UI.sunset} rough={0.55} />
        </mesh>
        <mesh position={[0, -0.72, 0]}>
          <capsuleGeometry args={[0.17, 0.22, 4, 10]} />
          <Mat color={UI.sunset} rough={0.55} />
        </mesh>
        <mesh position={[0, -1.3, 0]}>
          <sphereGeometry args={[0.19, 14, 10]} />
          <Mat color={UI.sunset} rough={0.55} />
        </mesh>
      </group>
    </group>
  )
}

function Bulb({ still }) {
  const g = useRef()
  const halo = useRef()
  usePop(g, 1, still)
  useFrame((s) => {
    if (halo.current && !still) {
      const k = 1 + Math.sin(s.clock.elapsedTime * 4) * 0.08
      halo.current.scale.setScalar(k)
    }
  })
  return (
    <group ref={g}>
      <group scale={0.2}>
        <mesh ref={halo} position={[0, 0.05, -0.1]}>
          <planeGeometry args={[3.2, 3.2]} />
          <meshBasicMaterial map={glowTexture()} color="#FFE07A" transparent opacity={0.55} depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.15, 0]}>
          <sphereGeometry args={[0.55, 24, 18]} />
          <meshStandardMaterial color="#FFF2B0" emissive="#FFD95A" emissiveIntensity={1.1} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.42, 0]}>
          <cylinderGeometry args={[0.3, 0.27, 0.34, 18]} />
          <Mat color="#C9D2CF" rough={0.4} metal={0.2} />
        </mesh>
        <mesh position={[0, -0.36, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.3, 0.05, 6, 18]} />
          <Mat color="#AEB8B4" rough={0.4} outline={false} />
        </mesh>
        <mesh position={[0, -0.48, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.29, 0.05, 6, 18]} />
          <Mat color="#AEB8B4" rough={0.4} outline={false} />
        </mesh>
        <mesh position={[0, -0.66, 0]}>
          <sphereGeometry args={[0.14, 12, 8]} />
          <Mat color="#2B2F33" />
        </mesh>
      </group>
    </group>
  )
}

function Dots({ still }) {
  const g = useRef()
  const dots = [useRef(), useRef(), useRef()]
  usePop(g, 1, still)
  useFrame((s) => {
    if (still) return
    const t = s.clock.elapsedTime
    dots.forEach((d, i) => {
      if (d.current) d.current.position.y = Math.max(0, Math.sin(t * 4 - i * 0.7)) * 0.05
    })
  })
  return (
    <group ref={g}>
      {[-1, 0, 1].map((x, i) => (
        <mesh key={x} ref={dots[i]} position={[x * 0.09, 0, 0]}>
          <sphereGeometry args={[0.035, 12, 8]} />
          <Mat color={UI.ice} rough={0.5} />
        </mesh>
      ))}
    </group>
  )
}

export function SweatDrop({ position, still }) {
  const g = useRef()
  useFrame((s) => {
    if (!g.current || still) return
    const t = (s.clock.elapsedTime % 2.6) / 2.6
    g.current.position.y = position[1] - t * 0.12
    const vis = t < 0.85 ? 1 : (1 - t) / 0.15
    g.current.scale.setScalar(Math.max(0.001, vis))
  })
  return (
    <group ref={g} position={position}>
      <mesh>
        <sphereGeometry args={[0.045, 14, 10]} />
        <meshStandardMaterial color="#9EDCF5" roughness={0.15} />
      </mesh>
      <mesh position={[0, 0.045, 0]}>
        <coneGeometry args={[0.043, 0.07, 14]} />
        <meshStandardMaterial color="#9EDCF5" roughness={0.15} />
      </mesh>
    </group>
  )
}

// One-shot 4-point star glint: scale 0 -> 1 -> 0 while rotating 45deg over 400 ms.
function Glint({ position, delay = 0, size = 1, still }) {
  const g = useRef()
  const t0 = useRef(null)
  useFrame((s) => {
    if (!g.current || still) return
    if (t0.current == null) t0.current = s.clock.elapsedTime
    const k = (s.clock.elapsedTime - t0.current - delay) / 0.4
    const v = k > 0 && k < 1 ? Math.sin(k * Math.PI) : 0
    g.current.scale.setScalar(Math.max(0.0001, v * size))
    g.current.rotation.z = Math.max(0, Math.min(1, k)) * (Math.PI / 4)
  })
  return (
    <group ref={g} position={position} scale={0.0001}>
      <mesh scale={[0.022, 0.1, 0.02]}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color="#FFFFFF" toneMapped={false} />
      </mesh>
      <mesh scale={[0.1, 0.022, 0.02]}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color="#FFFFFF" toneMapped={false} />
      </mesh>
    </group>
  )
}

// At most three glints per event, staggered 60 ms. Mount it (with a fresh key) to play once.
export function Sparkles({ spread = 0.6, height = 1.2, still, color }) {
  return (
    <group>
      <Glint position={[-spread, height * 0.8, 0.2]} delay={0} still={still} color={color} />
      <Glint position={[spread * 0.95, height, 0.1]} delay={0.06} size={1.25} still={still} color={color} />
      <Glint position={[spread * 0.6, height * 0.5, 0.35]} delay={0.12} size={0.8} still={still} color={color} />
    </group>
  )
}

// Floating icon above the head (head-local coordinates).
export function MoodIcon({ mood, position, still }) {
  return (
    <group position={position}>
      {mood === 'confused' && <Question key="q" still={still} />}
      {mood === 'lightbulb' && <Bulb key="b" still={still} />}
      {mood === 'stuck' && <Dots key="d" still={still} />}
    </group>
  )
}
