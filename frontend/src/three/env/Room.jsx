/* eslint-disable react/no-unknown-property, react-refresh/only-export-components */
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { Mat } from '../parts/Mat'
import { BlobShadow } from '../parts/BlobShadow'
import { glowTexture, textTexture } from '../parts/textures'
import { Y2K, INK } from '../palette'
import { useTheme } from '../parts/theme'


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

function Star({ position, size = 1, color = '#FFE07A', rot = 0, glow = 0 }) {
  const shape = useMemo(() => starShape(0.09 * size, 0.042 * size), [size])
  return (
    <mesh position={position} rotation={[0, 0, rot]}>
      <extrudeGeometry args={[shape, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2 }]} />
      <Mat color={color} rough={0.2} emissive={color} glow={glow} />
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
        g.fillStyle = Y2K.aqua
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
  const T = useTheme().room
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
        <meshPhysicalMaterial color={T.lamp} roughness={0.1} clearcoat={1} transparent opacity={0.55} emissive={T.lamp} emissiveIntensity={0.6} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.36, 0]}>
        <sphereGeometry args={[0.08, 16, 12]} />
        <meshBasicMaterial color="#FFFBE8" toneMapped={false} />
      </mesh>
      <mesh ref={halo} position={[0, 0.38, -0.05]}>
        <planeGeometry args={[1.3, 1.3]} />
        <meshBasicMaterial map={glowTexture()} color={T.lamp} transparent opacity={0.45} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}

// Bubbly rug: a soft round rug ringed by little bubbles.
function Rug() {
  const T = useTheme().room
  const bubbles = useMemo(() => Array.from({ length: 18 }, (_, i) => (i / 18) * Math.PI * 2), [])
  return (
    <group position={[0, 0, 0.18]} scale={[0.92, 1, 0.62]}>
      <mesh position={[0, 0.012, 0]}>
        <cylinderGeometry args={[1.0, 1.0, 0.024, 48]} />
        <Mat color={T.rug} rough={0.5} coat={0.3} />
      </mesh>
      <mesh position={[0, 0.026, 0]}>
        <cylinderGeometry args={[0.72, 0.72, 0.006, 48]} />
        <Mat color={T.rugInner} rough={0.5} coat={0.3} outline={false} />
      </mesh>
      {bubbles.map((a, i) => (
        <mesh key={i} position={[Math.cos(a) * 1.04, 0.02, Math.sin(a) * 1.04]} scale={[1, 0.35, 1]}>
          <sphereGeometry args={[i % 2 ? 0.07 : 0.09, 14, 10]} />
          <Mat color={T.bubbles[i % 3]} rough={0.3} emissive={T.bubbles[i % 3]} glow={T.glow * 0.6} />
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

const R = 1.5 // round floor radius; the curved back wall shares it
const WALL_H = 1.72

// Place an object on the inside of the curved wall at angle a (0 = straight back), facing the room.
function OnWall({ a, y, children, inset = 0.03 }) {
  const r = R - 0.06 - inset
  return (
    <group position={[Math.sin(a) * r, y, -Math.cos(a) * r]} rotation={[0, -a, 0]}>
      {children}
    </group>
  )
}

// A self-contained round diorama that floats on the page (fits fully inside the frame).
export function Room({ hero }) {
  const T = useTheme().room
  // hero: the room is scaled up so it fills the background around a centered Pip
  return (
    <group scale={hero ? 1.55 : 1}>
      <BlobShadow size={3.6} opacity={0.35} position={[0, -0.17, 0]} />
      <mesh position={[0, -0.08, 0]}>
        <cylinderGeometry args={[R, R, 0.16, 64]} />
        <Mat color={T.floor} rough={0.5} coat={0.4} />
      </mesh>
      <mesh position={[0, WALL_H / 2 - 0.02, 0]}>
        <cylinderGeometry args={[R - 0.02, R - 0.02, WALL_H, 64, 1, true, Math.PI / 2 + 0.25, Math.PI - 0.5]} />
        <Mat color={T.wall} rough={0.6} coat={0.3} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[R - 0.05, R - 0.05, 0.56, 64, 1, true, Math.PI / 2 + 0.25, Math.PI - 0.5]} />
        <Mat color={T.wainscot} rough={0.5} coat={0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* wall cap + floor rim */}
      <mesh position={[0, WALL_H - 0.02, 0]} rotation={[Math.PI / 2, 0, -Math.PI + 0.25]}>
        <torusGeometry args={[R - 0.02, 0.035, 8, 48, Math.PI - 0.5]} />
        <Mat color={T.cap} rough={0.25} emissive={T.cap} glow={T.glow} />
      </mesh>
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[R, 0.04, 8, 64]} />
        <Mat color={T.floorRim} rough={0.3} />
      </mesh>

      {/* framed card */}
      <OnWall a={0.42} y={1.2}>
        <group rotation={[0, 0, -0.04]}>
          <RoundedBox args={[0.6, 0.46, 0.05]} radius={0.04} smoothness={3}>
            <Mat color={T.frame} rough={0.25} emissive={T.frame} glow={T.glow * 0.4} />
          </RoundedBox>
          <mesh position={[0, 0, 0.027]}>
            <planeGeometry args={[0.49, 0.36]} />
            <meshStandardMaterial map={cardTexture()} roughness={0.6} />
          </mesh>
        </group>
      </OnWall>

      {/* star stickers */}
      <OnWall a={-0.45} y={1.42} inset={0}>
        <Star position={[0, 0, 0]} size={1.3} rot={0.2} color={T.stars[0]} glow={T.glow} />
      </OnWall>
      <OnWall a={-0.2} y={1.22} inset={0}>
        <Star position={[0, 0, 0]} size={0.8} color={T.stars[1]} rot={-0.3} glow={T.glow} />
      </OnWall>
      <OnWall a={-0.7} y={1.05} inset={0}>
        <Star position={[0, 0, 0]} size={0.9} color={T.stars[2]} rot={0.5} glow={T.glow} />
      </OnWall>
      <OnWall a={0.95} y={1.45} inset={0}>
        <Star position={[0, 0, 0]} size={0.7} color={T.stars[3]} rot={0.1} glow={T.glow} />
      </OnWall>

      <Rug />
      <Plant position={hero ? [-0.62, 0, -0.85] : [-0.95, 0, -0.75]} />
      <Lamp position={hero ? [0.62, 0, -0.82] : [0.95, 0, -0.7]} />
    </group>
  )
}
