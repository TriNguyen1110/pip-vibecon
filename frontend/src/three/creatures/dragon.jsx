/* eslint-disable react/no-unknown-property, react-refresh/only-export-components */
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Ball, Rod, Tube, At } from '../parts/shapes'
import { Mat } from '../parts/Mat'
import { Fur } from '../parts/Fur'
import { faceOnEllipsoid, onEllipsoid } from '../parts/geo'
import { CREATURE_COLORS, INK } from '../palette'

// "Lilac / Lime": stubby dragon; lime horns, wings and spikes are the one accent.
const C = CREATURE_COLORS.dragon
const HR = [0.45, 0.4, 0.42]
const BODY = { c: [0, 0.44, 0], r: [0.4, 0.44, 0.37] }
const belly = onEllipsoid(BODY.c, BODY.r, 0, -0.08, -0.01)
const SNOUT_C = onEllipsoid([0, 0, 0], HR, 0, -0.3, -0.07).position
const SNOUT_R = [0.21, 0.13, 0.14]
const nostrils = [-0.4, 0.4].map((t) => onEllipsoid(SNOUT_C, SNOUT_R, t, 0.35, -0.004))
const headSpikes = [0.75, 0.35].map((p) => onEllipsoid([0, 0, 0], HR, Math.PI, p))
const backSpikes = [0.45, 0.1].map((p) => onEllipsoid(BODY.c, BODY.r, Math.PI, p))

function Spike({ a, h = 0.12, r = 0.055 }) {
  return (
    <At a={a}>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, h * 0.35]}>
        <coneGeometry args={[r, h, 14]} />
        <Mat color={C.accent} />
      </mesh>
    </At>
  )
}

function Body({ still }) {
  const wings = [useRef(), useRef()]
  useFrame((s) => {
    if (still) return
    const t = s.clock.elapsedTime
    wings.forEach((w, i) => {
      if (w.current) w.current.rotation.y = (i ? -1 : 1) * (0.55 + Math.sin(t * 2.2) * 0.15)
    })
  })
  return (
    <group>
      <mesh position={BODY.c} scale={[BODY.r[0] / BODY.r[1], 1, BODY.r[2] / BODY.r[1]]}>
        <sphereGeometry args={[BODY.r[1], 40, 28]} />
        <Fur color={C.body} shells len={0.04} density={[7, 4]} bald={[[0, -0.08, 1, 0.86]]} />
      </mesh>
      <At a={belly}>
        <mesh scale={[1, 1.25, 0.28]}>
          <sphereGeometry args={[0.24, 24, 16]} />
          <Fur color={C.patch} outline={false} />
        </mesh>
      </At>
      {backSpikes.map((a, i) => (
        <Spike key={i} a={a} />
      ))}
      {[-1, 1].map((s) => (
        <Ball key={s} r={0.12} s={[1.05, 0.6, 1.3]} position={[s * 0.17, 0.05, 0.25]} color={C.body} fur />
      ))}
      {[-1, 1].map((s) => (
        <Rod key={`a${s}`} a={[s * 0.32, 0.6, 0.12]} b={[s * 0.36, 0.38, 0.22]} r={0.072} color={C.body} fur />
      ))}
      {[-1, 1].map((s, i) => (
        <group key={`w${s}`} ref={wings[i]} position={[s * 0.18, 0.66, -0.3]}>
          <mesh position={[s * 0.2, 0.08, 0]} rotation={[0, 0, s * 0.5]} scale={[1.2, 0.8, 0.16]}>
            <sphereGeometry args={[0.2, 20, 14]} />
            <Mat color={C.accent} />
          </mesh>
        </group>
      ))}
      <Tube
          fur
         points={[
          [0, 0.2, -0.3],
          [0.2, 0.12, -0.5],
          [0.45, 0.16, -0.55],
          [0.6, 0.3, -0.45],
        ]}
        r={0.065}
        endR={0.06}
        color={C.body}
      />
      <mesh position={[0.66, 0.38, -0.4]} rotation={[0.4, 0, -0.75]}>
        <coneGeometry args={[0.08, 0.16, 4]} />
        <Mat color={C.accent} />
      </mesh>
    </group>
  )
}

function Head() {
  return (
    <group>
      <mesh scale={[HR[0] / HR[1], 1, HR[2] / HR[1]]}>
        <sphereGeometry args={[HR[1], 44, 30]} />
        <Fur color={C.body} shells len={0.04} density={[7, 4]} bald={[[0, -0.05, 1, 0.8]]} />
      </mesh>
      <mesh position={SNOUT_C} scale={[SNOUT_R[0] / SNOUT_R[1], 1, SNOUT_R[2] / SNOUT_R[1]]}>
        <sphereGeometry args={[SNOUT_R[1], 28, 18]} />
        <Fur color={C.patch} />
      </mesh>
      {nostrils.map((a, i) => (
        <At key={i} a={a}>
          <mesh scale={[1, 0.7, 0.5]}>
            <sphereGeometry args={[0.018, 10, 8]} />
            <meshStandardMaterial color={INK} roughness={0.4} />
          </mesh>
        </At>
      ))}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.19, 0.36, -0.06]} rotation={[-0.45, 0, -s * 0.3]}>
          <mesh position={[0, 0.06, 0]}>
            <coneGeometry args={[0.065, 0.24, 16]} />
            <Mat color={C.accent} />
          </mesh>
        </group>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`e${s}`} position={[s * 0.44, 0.06, -0.04]} rotation={[0, 0, -s * (Math.PI / 2 - 0.35)]} scale={[1, 1, 0.45]}>
          <coneGeometry args={[0.08, 0.2, 14]} />
          <Fur color={C.body} />
        </mesh>
      ))}
      {[-1, 1].map((s) =>
        [0, 1].map((j) => (
          <mesh key={`t${s}${j}`} position={[s * (0.42 + j * 0.02), -0.12 - j * 0.07, 0.12]} rotation={[0, 0, s * (1.9 + j * 0.35)]} scale={[0.5, 1.4, 0.5]}>
            <sphereGeometry args={[0.055, 12, 8]} />
            <Fur color={C.body} />
          </mesh>
        )),
      )}
      {headSpikes.map((a, i) => (
        <Spike key={i} a={a} h={0.11} r={0.05} />
      ))}
    </group>
  )
}

const face = {
  ...faceOnEllipsoid({ R: HR, eyeT: 0.38, eyeP: 0.12, w: 0.055, h: 0.09, mouthP: -0.3, mouthW: 0.16 }),
  mouth: onEllipsoid(SNOUT_C, SNOUT_R, 0, -0.3, 0.01),
}

export default {
  Body,
  Head,
  spec: {
    head: [0, 1.04, 0.02],
    tilt: 1,
    face,
    glassesSide: [0.46, -0.02],
    pencil: { pos: [0.3, 0.3, 0.02], rot: [1.25, 0.2, -0.95] },
    scarf: { y: 0.74, r: 0.34, tube: 0.07, rz: 0.95, tail: 0.85 },
    badge: onEllipsoid(BODY.c, BODY.r, -0.52, 0.32),
    pack: {
      pos: [0, 0.48, -0.42],
      s: 0.85,
      straps: [
        [[-0.17, 0.78, 0.16], [-0.22, 0.46, 0.38]],
        [[0.17, 0.78, 0.16], [0.22, 0.46, 0.38]],
      ],
    },
    icon: [0.5, 0.62, 0.05],
    sweat: [0.4, 0.16, 0.22],
    shadow: 1.2,
    top: 1.5,
  },
}
