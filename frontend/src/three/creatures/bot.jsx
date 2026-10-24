/* eslint-disable react/no-unknown-property, react-refresh/only-export-components */
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { Ball, Rod } from '../parts/shapes'
import { Mat, CHROME } from '../parts/Mat'
import { onPlane } from '../parts/geo'
import { useCreatureColors, useVibe } from '../parts/vibe'
import { CREATURE_COLORS } from '../palette'

// "Pearl / Aqua": rectangular head + chrome antenna, glowing face on a dark screen.
const C = CREATURE_COLORS.bot
const SCREEN_Z = 0.372

function Body() {
  const C = useCreatureColors('bot')
  return (
    <group>
      <RoundedBox args={[0.68, 0.6, 0.56]} radius={0.17} smoothness={4} position={[0, 0.36, 0]}>
        <Mat color={C.body} />
      </RoundedBox>
      <RoundedBox args={[0.34, 0.24, 0.04]} radius={0.06} smoothness={3} position={[0, 0.38, 0.28]}>
        <Mat color={C.patch} rough={0.2} outline={false} />
      </RoundedBox>
      <mesh position={[0, 0.38, 0.302]}>
        <circleGeometry args={[0.045, 20]} />
        <meshBasicMaterial color={C.accent} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.12, 0.15, 0.1, 20]} />
        <Mat {...CHROME} />
      </mesh>
      {[-1, 1].map((s) => (
        <Ball key={s} r={0.12} s={[1.1, 0.55, 1.3]} position={[s * 0.18, 0.05, 0.08]} color={C.accent} />
      ))}
      {[-1, 1].map((s) => (
        <group key={`a${s}`}>
          <Rod a={[s * 0.36, 0.52, 0.02]} b={[s * 0.43, 0.3, 0.1]} r={0.06} color={C.body} />
          <Ball r={0.07} position={[s * 0.44, 0.26, 0.11]} color={C.accent} seg={16} />
        </group>
      ))}
    </group>
  )
}

function Head({ still, accessory }) {
  const C = useCreatureColors('bot')
  const ugly = useVibe() === 'ugly'
  const ball = useRef()
  useFrame((s) => {
    if (ball.current && !still) ball.current.position.x = Math.sin(s.clock.elapsedTime * 1.7) * 0.025
  })
  return (
    <group>
      <RoundedBox args={[0.88, 0.68, 0.7]} radius={0.22} smoothness={5}>
        <Mat color={C.body} />
      </RoundedBox>
      <RoundedBox args={[0.7, 0.46, 0.06]} radius={0.1} smoothness={4} position={[0, -0.01, 0.335]}>
        <Mat color={C.patch} rough={0.15} outline={false} />
      </RoundedBox>
      {accessory !== 'pencil' &&
        [-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.45, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.09, 0.09, 0.08, 20]} />
            <Mat color={C.accent} />
          </mesh>
        ))}
      <group position={[0, 0.34, 0]} rotation={[0, 0, ugly ? 0.6 : 0]}>
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.014, 0.018, 0.2, 10]} />
          <Mat {...CHROME} />
        </mesh>
        <group ref={ball} position={[0, 0.22, 0]}>
          <Ball r={0.055} color={C.accent} seg={18} />
        </group>
      </group>
    </group>
  )
}

const face = {
  eyes: [onPlane(-0.15, 0.03, SCREEN_Z), onPlane(0.15, 0.03, SCREEN_Z)],
  w: 0.055,
  h: 0.09,
  mouth: onPlane(0, -0.12, SCREEN_Z),
  mouthW: 0.2,
  eyeColor: '#9FF8F4',
  blush: [onPlane(-0.25, -0.1, SCREEN_Z - 0.01), onPlane(0.25, -0.1, SCREEN_Z - 0.01)],
  blushR: 0.035,
  blushColor: '#FF8FC7',
}

export default {
  Body,
  Head,
  spec: {
    head: [0, 1.09, 0],
    tilt: 0.8,
    face,
    glow: true,
    glassesSide: [0.46, 0.1],
    glassesLift: 0.04,
    pencil: { pos: [0.47, 0.06, 0.02], rot: [1.45, 0, -0.15] },
    scarf: { y: 0.71, r: 0.32, tube: 0.07, rz: 0.95, tail: 0.85 },
    badge: { position: [-0.2, 0.52, 0.283], quaternion: [0, 0, 0, 1], normal: [0, 0, 1] },
    pack: {
      pos: [0, 0.4, -0.36],
      s: 0.9,
      straps: [
        [[-0.2, 0.66, 0.12], [-0.22, 0.24, 0.29]],
        [[0.2, 0.66, 0.12], [0.22, 0.24, 0.29]],
      ],
    },
    icon: [0.5, 0.6, 0.05],
    sweat: [0.46, 0.2, 0.2],
    shadow: 1.15,
    top: 1.7,
    headZone: 0.0,
  },
}
