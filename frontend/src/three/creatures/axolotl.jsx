/* eslint-disable react/no-unknown-property, react-refresh/only-export-components */
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Ball, At } from '../parts/shapes'
import { Mat } from '../parts/Mat'
import { Fur } from '../parts/Fur'
import { faceOnEllipsoid, onEllipsoid } from '../parts/geo'
import { useCreatureColors, useVibe } from '../parts/vibe'
import { CREATURE_COLORS } from '../palette'

// "Bubblegum / Cream": wide flat head, berry gills, tail fin.
const C = CREATURE_COLORS.axolotl
const HR = [0.52, 0.37, 0.42]
const BODY = { c: [0, 0.38, -0.02], r: [0.36, 0.38, 0.4] }
const belly = onEllipsoid(BODY.c, BODY.r, 0, -0.1, -0.01)
const GILLS = [0.95, 0.4, -0.1] // angle from +x (radians) per gill

function Gills({ side, still }) {
  const C = useCreatureColors('axolotl')
  const g = useRef()
  useFrame((s) => {
    if (g.current && !still) g.current.rotation.z = Math.sin(s.clock.elapsedTime * 2.4 + side) * 0.06
  })
  return (
    <group ref={g} position={[side * 0.44, 0.1, -0.04]}>
      {GILLS.map((ang, i) => {
        const dx = side * Math.cos(ang)
        const dy = Math.sin(ang)
        const len = 0.2 - i * 0.02
        return (
          <group key={i} position={[dx * 0.04, (1 - i) * 0.09, 0]} rotation={[0, 0, Math.atan2(-dx, dy)]}>
            <mesh position={[0, len / 2 + 0.04, 0]}>
              <capsuleGeometry args={[0.05, len, 4, 10]} />
              <Fur color={C.accent} glow={C.glow ?? 0} />
            </mesh>
            <Ball r={0.035} position={[0.045, len * 0.55, 0.02]} color={C.accent} emissive={C.accent} glow={C.glow ?? 0} seg={10} outline={false} />
          </group>
        )
      })}
    </group>
  )
}

function Body({ still }) {
  const C = useCreatureColors('axolotl')
  const tail = useRef()
  useFrame((s) => {
    if (tail.current && !still) tail.current.rotation.y = Math.sin(s.clock.elapsedTime * 1.6) * 0.3
  })
  return (
    <group>
      <mesh position={BODY.c} scale={[BODY.r[0] / BODY.r[1], 1, BODY.r[2] / BODY.r[1]]}>
        <sphereGeometry args={[BODY.r[1], 40, 28]} />
        <Fur color={C.body} shells len={0.04} density={[4, 2]} bald={[[0, -0.1, 1, 0.86]]} />
      </mesh>
      <At a={belly}>
        <mesh scale={[1, 1.2, 0.28]}>
          <sphereGeometry args={[0.21, 24, 16]} />
          <Fur color={C.patch} outline={false} />
        </mesh>
      </At>
      <group ref={tail} position={[0, 0.3, -0.3]}>
        <mesh position={[0, 0.04, -0.3]} scale={[0.22, 0.6, 1]}>
          <sphereGeometry args={[0.36, 24, 16]} />
          <Fur color={C.body} />
        </mesh>
        <mesh position={[0, 0.2, -0.32]} scale={[0.08, 0.35, 0.9]}>
          <sphereGeometry args={[0.34, 20, 12]} />
          <Fur color={C.patch} />
        </mesh>
      </group>
      {[-1, 1].map((s) => (
        <Ball key={s} r={0.1} s={[1.1, 0.6, 1.3]} position={[s * 0.17, 0.05, 0.24]} color={C.body} fur />
      ))}
      {[-1, 1].map((s) => (
        <Ball key={`b${s}`} r={0.09} s={[1.1, 0.6, 1.3]} position={[s * 0.26, 0.05, -0.2]} color={C.body} fur />
      ))}
      {[-1, 1].map((s) => (
        <Ball key={`a${s}`} r={0.08} s={[0.8, 1.2, 0.9]} position={[s * 0.35, 0.42, 0.12]} rotation={[0, 0, s * 0.4]} color={C.body} fur />
      ))}
    </group>
  )
}

function Head({ still }) {
  const C = useCreatureColors('axolotl')
  const ugly = useVibe() === 'ugly'
  return (
    <group>
      <mesh scale={[HR[0] / HR[1], 1, HR[2] / HR[1]]}>
        <sphereGeometry args={[HR[1], 44, 30]} />
        <Fur color={C.body} shells len={0.04} density={[5, 2]} bald={[[0, -0.05, 1, 0.66]]} />
      </mesh>
      <Gills side={-1} still={still} />
      <group rotation={[0, 0, ugly ? -0.45 : 0]} position={[ugly ? 0.06 : 0, ugly ? -0.08 : 0, 0]}>
        <Gills side={1} still={still} />
      </group>
    </group>
  )
}

const face = {
  ...faceOnEllipsoid({
    R: HR,
    eyeT: 0.5,
    eyeP: 0.08,
    w: 0.05,
    h: 0.08,
    mouthP: -0.18,
    mouthW: 0.24,
    blushT: 0.72,
    blushP: -0.12,
    blushR: 0.045,
  }),
  blushColor: '#FF5AA5',
}

export default {
  Body,
  Head,
  spec: {
    head: [0, 0.96, 0.02],
    tilt: 1,
    face,
    glassesSide: [0.52, -0.02],
    pencil: { pos: [0.34, 0.26, -0.05], rot: [1.3, 0.1, -0.8] },
    scarf: { y: 0.68, r: 0.33, tube: 0.07, rz: 1, tail: 0.85 },
    badge: onEllipsoid(BODY.c, BODY.r, -0.5, 0.3),
    pack: {
      pos: [0, 0.44, -0.44],
      s: 0.82,
      straps: [
        [[-0.16, 0.7, 0.18], [-0.2, 0.42, 0.4]],
        [[0.16, 0.7, 0.18], [0.2, 0.42, 0.4]],
      ],
    },
    icon: [0.55, 0.55, 0.05],
    sweat: [0.45, 0.14, 0.22],
    shadow: 1.2,
    top: 1.4,
    tufts: [[-0.95, 0.45], [0.9, 0.5], [-1.45, -0.05], [0.25, 0.78]].map(([t, p]) => onEllipsoid([0, 0, 0], HR, t, p)),
    lumps: [[1.3, 0.1], [-2.3, 0.3], [2.8, -0.2]].map(([t, p]) => onEllipsoid(BODY.c, BODY.r, t, p)),
    pin: { position: [0.52, 0.02, 0.1], quaternion: [0, 0, -0.2, 0.98], normal: [0, 0, 1] },
    visor: { y: 0.16, rTop: 0.467, rBot: 0.512, h: 0.07, sz: 0.81 },
  },
}
