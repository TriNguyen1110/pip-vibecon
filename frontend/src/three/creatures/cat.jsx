/* eslint-disable react/no-unknown-property, react-refresh/only-export-components */
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Ball, Rod, Tube, At } from '../parts/shapes'
import { Mat } from '../parts/Mat'
import { Fur } from '../parts/Fur'
import { faceOnEllipsoid, onEllipsoid } from '../parts/geo'
import { CREATURE_COLORS, INK } from '../palette'

const C = CREATURE_COLORS.cat
const HR = [0.46, 0.39, 0.41]
const BODY = { c: [0, 0.42, 0], r: [0.38, 0.42, 0.35] }

const belly = onEllipsoid(BODY.c, BODY.r, 0, -0.1, -0.01)
const muzzle = onEllipsoid([0, 0, 0], HR, 0, -0.27, -0.01)
const nose = onEllipsoid([0, 0, 0], HR, 0, -0.12, 0.012)
const stripes = [-0.13, 0, 0.13].map((t) => onEllipsoid([0, 0, 0], HR, t, 0.62))

function Body({ still }) {
  const tail = useRef()
  useFrame((s) => {
    if (tail.current && !still) tail.current.rotation.y = Math.sin(s.clock.elapsedTime * 1.3) * 0.25
  })
  return (
    <group>
      <mesh position={BODY.c} scale={[BODY.r[0] / BODY.r[1], 1, BODY.r[2] / BODY.r[1]]}>
        <sphereGeometry args={[BODY.r[1], 40, 28]} />
        <Fur color={C.body} shells len={0.04} density={[7, 4]} bald={[[0, -0.1, 1, 0.86]]} />
      </mesh>
      <At a={belly}>
        <mesh scale={[1, 1.2, 0.28]}>
          <sphereGeometry args={[0.22, 24, 16]} />
          <Fur color={C.patch} outline={false} />
        </mesh>
      </At>
      {[-1, 1].map((s) => (
        <Ball key={s} r={0.11} s={[1.05, 0.6, 1.3]} position={[s * 0.16, 0.05, 0.25]} color={C.detail} fur />
      ))}
      {[-1, 1].map((s) => (
        <Rod key={`a${s}`} a={[s * 0.3, 0.58, 0.12]} b={[s * 0.34, 0.36, 0.2]} r={0.07} color={C.body} fur />
      ))}
      <group ref={tail} position={[0, 0.18, -0.28]}>
        <Tube
          fur
           points={[
            [0, 0, 0],
            [0.18, 0.04, -0.16],
            [0.34, 0.28, -0.2],
            [0.36, 0.58, -0.12],
            [0.26, 0.72, -0.04],
          ]}
          r={0.05}
          endR={0.058}
          color={C.body}
        />
      </group>
    </group>
  )
}

function Head() {
  return (
    <group>
      <mesh scale={[HR[0] / HR[1], 1, HR[2] / HR[1]]}>
        <sphereGeometry args={[HR[1], 44, 30]} />
        <Fur color={C.body} shells len={0.04} density={[7, 4]} bald={[[0, -0.08, 1, 0.8]]} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.27, 0.36, -0.02]} rotation={[-0.1, 0, -s * 0.42]}>
          <mesh>
            <coneGeometry args={[0.15, 0.3, 20]} />
            <Fur color={C.body} />
          </mesh>
          <mesh position={[0, -0.01, 0.065]} scale={[1, 1, 0.45]}>
            <coneGeometry args={[0.085, 0.2, 16]} />
            <Mat color={C.accent} outline={false} />
          </mesh>
        </group>
      ))}
      {/* cheek tufts + ear fluff */}
      {[-1, 1].map((s) =>
        [0, 1].map((j) => (
          <mesh key={`t${s}${j}`} position={[s * (0.43 + j * 0.02), -0.1 - j * 0.07, 0.12]} rotation={[0, 0, s * (1.9 + j * 0.35)]} scale={[0.5, 1.4, 0.5]}>
            <sphereGeometry args={[0.055, 12, 8]} />
            <Fur color={C.body} />
          </mesh>
        )),
      )}
      {[-1, 1].map((s) => (
        <mesh key={`f${s}`} position={[s * 0.25, 0.33, 0.08]} scale={[1, 1.3, 0.6]}>
          <sphereGeometry args={[0.05, 12, 8]} />
          <Fur color={C.patch} />
        </mesh>
      ))}
      <At a={muzzle}>
        <mesh scale={[1.35, 0.78, 0.38]}>
          <sphereGeometry args={[0.15, 24, 16]} />
          <Fur color={C.patch} outline={false} />
        </mesh>
      </At>
      <At a={nose}>
        <mesh scale={[1.35, 0.85, 0.7]}>
          <sphereGeometry args={[0.032, 14, 10]} />
          <Mat color={C.accent} outline={false} />
        </mesh>
      </At>
      {stripes.map((a, i) => (
        <At key={i} a={a}>
          <mesh scale={[1, 1, 0.4]}>
            <capsuleGeometry args={[0.02, i === 1 ? 0.09 : 0.06, 4, 8]} />
            <Mat color="#E8812A" outline={false} />
          </mesh>
        </At>
      ))}
      {[-1, 1].map((s) =>
        [-0.1, -0.17].map((y, j) => (
          <Rod key={`${s}${j}`} a={[s * 0.3, y, 0.28]} b={[s * 0.56, y + (j ? -0.04 : 0.02), 0.2]} r={0.007} color={INK} outline={false} />
        )),
      )}
    </group>
  )
}

const face = {
  ...faceOnEllipsoid({ R: HR, eyeT: 0.38, eyeP: 0.06, w: 0.055, h: 0.088, mouthP: -0.27, mouthW: 0.15 }),
  mouth: onEllipsoid([0, 0, 0], HR, 0, -0.3, 0.05),
}

export default {
  Body,
  Head,
  spec: {
    head: [0, 1.02, 0],
    tilt: 1,
    face,
    glassesSide: [0.47, -0.02],
    pencil: { pos: [0.3, 0.33, 0.02], rot: [1.25, 0.2, -0.95] },
    scarf: { y: 0.7, r: 0.33, tube: 0.07, rz: 0.95, tail: 0.85 },
    badge: onEllipsoid(BODY.c, BODY.r, -0.5, 0.3),
    pack: {
      pos: [0, 0.46, -0.4],
      s: 0.85,
      straps: [
        [[-0.17, 0.74, 0.16], [-0.21, 0.44, 0.36]],
        [[0.17, 0.74, 0.16], [0.21, 0.44, 0.36]],
      ],
    },
    icon: [0.48, 0.62, 0.05],
    sweat: [0.4, 0.16, 0.2],
    shadow: 1.1,
    top: 1.55,
  },
}
