/* eslint-disable react/no-unknown-property, react-refresh/only-export-components */
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { INK } from '../palette'
import { At } from './shapes'

// Upper-lid line per mood, in eye heights from the center: 1 = fully open, 0.4 = deadpan default (~30% closed).
const LIDS = {
  confused: [0.12, 0.5],
  lightbulb: [0.72, 0.72],
  aha: [1, 1],
  stuck: [-0.12, -0.12],
  celebrating: [0.4, 0.4],
  idle: [0.4, 0.4],
}
// Eye width multiplier: lightbulb eyes go round.
const ROUND = { aha: 1.5 }

function EyeMat({ glow, color }) {
  return glow ? (
    <meshBasicMaterial color={color} side={THREE.DoubleSide} toneMapped={false} />
  ) : (
    <meshPhysicalMaterial color={color} roughness={0.15} clearcoat={1} clearcoatRoughness={0.05} side={THREE.DoubleSide} />
  )
}

function LidEye({ w, h, open, glow, color }) {
  const d = w * 0.42
  const o = Math.min(1, open)
  const thetaStart = o >= 0.999 ? 0 : Math.acos(o)
  const s = Math.sqrt(Math.max(0, 1 - o * o))
  // single clean specular dot, kept under the lid line
  const hx = -0.3
  const hy = Math.min(0.42, o - 0.28)
  const hz = d * Math.sqrt(Math.max(0.05, 1 - hx * hx - hy * hy))
  const hy2 = Math.max(-0.66, hy - 0.55)
  const hz2 = d * Math.sqrt(Math.max(0.05, 1 - 0.09 - hy2 * hy2))
  return (
    <group>
      <mesh scale={[w, h, d]}>
        <sphereGeometry args={[1, 26, 18, 0, Math.PI * 2, thetaStart, Math.PI - thetaStart]} />
        <EyeMat glow={glow} color={color} />
      </mesh>
      {o < 0.999 && (
        <mesh position={[0, o * h, d * s * 0.55]} rotation={[0, 0, Math.PI / 2]}>
          <capsuleGeometry args={[w * 0.1, w * s * 2.05, 4, 8]} />
          <EyeMat glow={glow} color={color} />
        </mesh>
      )}
      <mesh position={[hx * w, hy * h, hz]} scale={[w * 0.3, w * 0.3, w * 0.11]}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
      <mesh position={[0.3 * w, hy2 * h, hz2]} scale={[w * 0.14, w * 0.14, w * 0.06]}>
        <sphereGeometry args={[1, 10, 6]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
    </group>
  )
}

function ArcEye({ w, color, glow }) {
  return (
    <mesh position={[0, -0.22 * w, 0.08 * w]}>
      <torusGeometry args={[0.62 * w, 0.13 * w, 8, 22, Math.PI]} />
      <EyeMat glow={glow} color={color} />
    </mesh>
  )
}

function Mouth({ mood, m, color, glow, tongue }) {
  if (mood === 'lightbulb') {
    return (
      <mesh position={[0.05 * m, 0, 0]} scale={[0.17 * m, 0.2 * m, 0.08 * m]}>
        <sphereGeometry args={[1, 16, 12]} />
        <EyeMat glow={glow} color={color} />
      </mesh>
    )
  }
  if (mood === 'stuck') {
    return (
      <mesh position={[0, -0.36 * m, 0.03 * m]} rotation={[0, 0, Math.PI / 2 - 0.55]}>
        <torusGeometry args={[0.4 * m, 0.055 * m, 6, 16, 1.1]} />
        <EyeMat glow={glow} color={color} />
      </mesh>
    )
  }
  if (mood === 'celebrating') {
    return (
      <group>
        <mesh scale={[1, 0.78, 0.4]}>
          <sphereGeometry args={[0.36 * m, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          <EyeMat glow={glow} color={color} />
        </mesh>
        {!glow && (
          <mesh position={[0, -0.19 * m, 0.08 * m]} scale={[1.25, 0.55, 0.35]}>
            <sphereGeometry args={[0.13 * m, 12, 8]} />
            <meshStandardMaterial color={tongue} roughness={0.6} />
          </mesh>
        )}
      </group>
    )
  }
  // confused / idle: short flat line, slightly off-center
  return (
    <mesh position={[0.12 * m, 0, 0.03 * m]} rotation={[0, 0, Math.PI / 2 + (mood === 'confused' ? 0.16 : 0)]}>
      <capsuleGeometry args={[0.055 * m, 0.34 * m, 4, 8]} />
      <EyeMat glow={glow} color={color} />
    </mesh>
  )
}

export function Face({ cfg, mood = 'idle', anim, glow = false }) {
  const L = useRef()
  const R = useRef()
  const eyeColor = cfg.eyeColor ?? INK
  const mouthColor = cfg.mouthColor ?? eyeColor
  // lightbulb: lids lift and the eyes go round for 400 ms, then settle
  const [aha, setAha] = useState(false)
  useEffect(() => {
    if (mood !== 'lightbulb') return
    setAha(true)
    const id = setTimeout(() => setAha(false), 400)
    return () => clearTimeout(id)
  }, [mood])
  const lidKey = mood === 'lightbulb' && aha ? 'aha' : mood
  const lids = LIDS[lidKey] ?? LIDS.idle
  const { w, h } = cfg
  const eyeScale = [ROUND[lidKey] ?? 1, 1, 1]

  useFrame(() => {
    const b = anim?.current?.blink ?? 1
    if (L.current) L.current.scale.y = b
    if (R.current) R.current.scale.y = b
  })

  return (
    <group>
      {cfg.eyes.map((a, i) => (
        <At key={i} a={a}>
          <group scale={eyeScale}>
            <group ref={i ? R : L}>
              {mood === 'celebrating' ? (
                <ArcEye w={w} color={eyeColor} glow={glow} />
              ) : (
                <LidEye w={w} h={h} open={lids[i]} glow={glow} color={eyeColor} />
              )}
            </group>
          </group>
        </At>
      ))}
      <At a={cfg.mouth}>
        <Mouth mood={mood} m={cfg.mouthW} color={mouthColor} glow={glow} tongue={cfg.tongue ?? '#F59B76'} />
      </At>
      {cfg.blush &&
        cfg.blush.map((a, i) => (
          <At key={i} a={a}>
            <mesh scale={[1.35, 0.7, 0.25]}>
              <sphereGeometry args={[cfg.blushR, 14, 10]} />
              <meshBasicMaterial color={cfg.blushColor ?? '#FF8FA8'} transparent opacity={0.45} depthWrite={false} />
            </mesh>
          </At>
        ))}
    </group>
  )
}
