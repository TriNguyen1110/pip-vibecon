/* eslint-disable react/no-unknown-property, react-refresh/only-export-components */
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { Mat } from '../parts/Mat'
import { BlobShadow } from '../parts/BlobShadow'
import { glowTexture, textTexture } from '../parts/textures'
import { Y2K, INK } from '../palette'

const WALL = '#F6E9F4'
const FLOOR = '#E7CDB8'

function starShape(outer = 0.1, inner = 0.045) {
  const s = new THREE.Shape()
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? inner : outer
    const a = Math.PI / 2 + (i * Math.PI) / 5
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    if (i === 0) s.moveTo(x, y)
    else s.lineTo(x, y)
  }
  s.closePath()
  return s
}

function Star({ position, size = 1, color = '#FFE07A', rot = 0 }) {
  const shape = useMemo(() => starShape(0.09 * size, 0.042 * size), [size])
  return (
    <mesh position={position} rotation={[0, 0, rot]}>
      <extrudeGeometry args={[shape, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2 }]} />
      <Mat color={color} rough={0.2} />
    </mesh>
  )
}

let cardTex
function cardTexture() {
  if (!cardTex) {
    cardTex = textTexture(
      (g, w, h) => {
        g.fillStyle = '#FFF6FB'
        g.fillRect(0, 0, w, h)
        g.fillStyle = Y2K.lilac
        g.beginPath()
        g.arc(w * 0.5, h * 0.42, w * 0.22, 0, Math.PI * 2)
        g.fill()
        g.fillStyle = INK
        g.font = '800 54px system-ui, -apple-system, sans-serif'
        g.textAlign = 'center'
        g.textBaseline = 'middle'
        g.fillText('½+⅓', w * 0.5, h * 0.42)
        g.fillStyle = '#7A6E86'
        g.font = '600 26px system-ui, -apple-system, sans-serif'
        g.fillText('K.O. No. 0147', w * 0.5, h * 0.82)
      },
      256,
      192,
    )
  }
  return cardTex
}

// Translucent iMac-style lamp with a soft glow.
function Lamp({ position }) {
  const halo = useRef()
  useFrame((s) => {
    if (halo.current) halo.current.material.opacity = 0.42 + Math.sin(s.clock.elapsedTime * 1.3) * 0.05
  })
  return (
    <group position={position}>
      <BlobShadow size={0.7} opacity={0.3} position={[0, 0.004, 0]} />
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.16, 0.18, 0.08, 24]} />
        <Mat color="#FFFFFF" rough={0.15} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.26, 10]} />
        <Mat color="#E8EDF2" metal={1} rough={0.12} coat={0} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.2, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
        <meshPhysicalMaterial color={Y2K.aqua} roughness={0.1} clearcoat={1} transparent opacity={0.55} emissive={Y2K.aqua} emissiveIntensity={0.6} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.36, 0]}>
        <sphereGeometry args={[0.08, 16, 12]} />
        <meshBasicMaterial color="#FFFBE8" toneMapped={false} />
      </mesh>
      <mesh ref={halo} position={[0, 0.38, -0.05]}>
        <planeGeometry args={[1.3, 1.3]} />
        <meshBasicMaterial map={glowTexture()} color={Y2K.aqua} transparent opacity={0.45} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}

// Bubbly rug: a soft round rug ringed by little bubbles.
function Rug() {
  const bubbles = useMemo(() => Array.from({ length: 18 }, (_, i) => (i / 18) * Math.PI * 2), [])
  return (
    <group position={[0, 0, 0.12]} scale={[1, 1, 0.66]}>
      <mesh position={[0, 0.012, 0]}>
        <cylinderGeometry args={[1.0, 1.0, 0.024, 48]} />
        <Mat color={Y2K.bubblegum} rough={0.5} coat={0.3} />
      </mesh>
      <mesh position={[0, 0.026, 0]}>
        <cylinderGeometry args={[0.72, 0.72, 0.006, 48]} />
        <Mat color="#FFD3E8" rough={0.5} coat={0.3} outline={false} />
      </mesh>
      {bubbles.map((a, i) => (
        <mesh key={i} position={[Math.cos(a) * 1.04, 0.02, Math.sin(a) * 1.04]} scale={[1, 0.35, 1]}>
          <sphereGeometry args={[i % 2 ? 0.07 : 0.09, 14, 10]} />
          <Mat color={i % 3 ? Y2K.bubblegum : Y2K.lilac} rough={0.3} />
        </mesh>
      ))}
    </group>
  )
}

function Plant({ position }) {
  const leaves = useMemo(
    () => Array.from({ length: 6 }, (_, i) => ({ a: (i / 6) * Math.PI * 2 + 0.3, tilt: 0.55 + (i % 2) * 0.35, y: 0.02 + (i % 3) * 0.05 })),
    [],
  )
  return (
    <group position={position}>
      <BlobShadow size={0.8} opacity={0.3} position={[0, 0.004, 0]} />
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.19, 0.14, 0.3, 24]} />
        <Mat color={Y2K.tangerine} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.205, 0.205, 0.05, 24]} />
        <Mat color="#FFB86E" />
      </mesh>
      <group position={[0, 0.33, 0]}>
        {leaves.map((l, i) => (
          <group key={i} rotation={[0, l.a, 0]} position={[0, l.y, 0]}>
            <mesh position={[0, 0.16, 0.12]} rotation={[-l.tilt, 0, 0]} scale={[1, 0.28, 2]}>
              <sphereGeometry args={[0.1, 18, 12]} />
              <Mat color={i % 2 ? '#5CCB6E' : '#7FDE7A'} rough={0.22} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}

export function Room() {
  return (
    <group>
      {/* floor + wall diorama */}
      <RoundedBox args={[3.9, 0.2, 2.7]} radius={0.08} smoothness={3} position={[0, -0.1, -0.05]}>
        <Mat color={FLOOR} rough={0.6} coat={0.3} />
      </RoundedBox>
      <RoundedBox args={[3.9, 2.6, 0.16]} radius={0.08} smoothness={3} position={[0, 1.2, -1.36]}>
        <Mat color={WALL} rough={0.7} coat={0.2} />
      </RoundedBox>
      <RoundedBox args={[3.9, 0.62, 0.06]} radius={0.03} smoothness={2} position={[0, 0.31, -1.26]}>
        <Mat color="#D9CBFF" rough={0.6} coat={0.3} />
      </RoundedBox>
      <mesh position={[0, 0.63, -1.24]}>
        <boxGeometry args={[3.9, 0.04, 0.08]} />
        <Mat color="#FFFFFF" rough={0.3} />
      </mesh>

      {/* framed card */}
      <group position={[0.95, 1.5, -1.25]} rotation={[0, 0, -0.04]}>
        <RoundedBox args={[0.64, 0.5, 0.06]} radius={0.04} smoothness={3}>
          <Mat color={Y2K.lilac} rough={0.25} />
        </RoundedBox>
        <mesh position={[0, 0, 0.032]}>
          <planeGeometry args={[0.52, 0.39]} />
          <meshStandardMaterial map={cardTexture()} roughness={0.6} />
        </mesh>
      </group>

      {/* star stickers */}
      <Star position={[-0.9, 1.75, -1.27]} size={1.3} rot={0.2} />
      <Star position={[-0.55, 1.45, -1.27]} size={0.8} color={Y2K.aqua} rot={-0.3} />
      <Star position={[-1.2, 1.3, -1.27]} size={0.9} color={Y2K.bubblegum} rot={0.5} />
      <Star position={[1.55, 1.9, -1.27]} size={0.7} color={Y2K.aqua} rot={0.1} />

      <Rug />
      <Plant position={[-1.4, 0, -0.8]} />
      <Lamp position={[1.35, 0, -0.75]} />
    </group>
  )
}
