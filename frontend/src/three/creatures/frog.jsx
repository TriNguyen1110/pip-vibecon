/* eslint-disable react/no-unknown-property, react-refresh/only-export-components */
import { Ball, At } from '../parts/shapes'
import { Mat } from '../parts/Mat'
import { Fur } from '../parts/Fur'
import { onEllipsoid } from '../parts/geo'
import { CREATURE_COLORS } from '../palette'

// "Lime / Tangerine": one squat rounded body, eyes up on two bumps.
const C = CREATURE_COLORS.frog
const R = [0.62, 0.5, 0.54]
const BUMP_R = 0.2
const BUMPS = [-1, 1].map((s) => [s * 0.28, 0.42, 0.1])
const belly = onEllipsoid([0, 0, 0], R, 0, -0.66, -0.01)
const spots = [
  onEllipsoid([0, 0, 0], R, 2.4, 0.5),
  onEllipsoid([0, 0, 0], R, -2.6, 0.35),
  onEllipsoid([0, 0, 0], R, 3.1, 0.15),
]

function Body() {
  return (
    <group>
      {[-1, 1].map((s) => (
        <Ball key={s} r={0.12} s={[1.3, 0.45, 1.2]} position={[s * 0.27, 0.04, 0.38]} color={C.accent} />
      ))}
      {[-1, 1].map((s) => (
        <Ball key={`b${s}`} r={0.2} s={[0.85, 0.7, 1.2]} position={[s * 0.52, 0.14, -0.1]} color={C.body} fur />
      ))}
    </group>
  )
}

function Head() {
  return (
    <group>
      <mesh scale={[R[0] / R[1], 1, R[2] / R[1]]}>
        <sphereGeometry args={[R[1], 48, 32]} />
        <Fur color={C.body} shells len={0.045} density={[8, 4]} bald={[[0, 0, 1, 0.8], [0, -0.75, 1, 0.9]]} />
      </mesh>
      {BUMPS.map((p, i) => (
        <Ball key={i} r={BUMP_R} position={p} color={C.body} fur seg={32} />
      ))}
      <At a={belly}>
        <mesh scale={[1.3, 0.75, 0.3]}>
          <sphereGeometry args={[0.25, 28, 18]} />
          <Fur color={C.patch} outline={false} />
        </mesh>
      </At>
      {spots.map((a, i) => (
        <At key={i} a={a}>
          <mesh scale={[1, 0.8, 0.25]}>
            <sphereGeometry args={[0.07 + i * 0.015, 16, 10]} />
            <Mat color="#86C83F" outline={false} />
          </mesh>
        </At>
      ))}
    </group>
  )
}

const face = {
  eyes: BUMPS.map((c, i) => onEllipsoid(c, [BUMP_R, BUMP_R, BUMP_R], (i ? 1 : -1) * 0.22, 0.12)),
  w: 0.06,
  h: 0.095,
  mouth: onEllipsoid([0, 0, 0], R, 0, -0.06),
  mouthW: 0.26,
  blush: [-1, 1].map((s) => onEllipsoid([0, 0, 0], R, s * 0.6, 0.02)),
  blushR: 0.05,
  blushColor: '#FF9A3C',
}

export default {
  Body,
  Head,
  spec: {
    head: [0, 0.5, 0],
    tilt: 0.45,
    face,
    glassesSide: [0.5, 0],
    glassesLift: 0.05,
    pencil: { pos: [0.48, 0.3, -0.12], rot: [1.3, 0, -0.5] },
    scarf: { y: 0.3, r: 0.6, tube: 0.08, rz: 0.92 },
    badge: onEllipsoid([0, 0.5, 0], R, -0.5, -0.3),
    pack: { pos: [0, 0.55, -0.52], s: 1 },
    icon: [0.5, 0.82, 0.05],
    sweat: [0.52, 0.12, 0.25],
    shadow: 1.45,
    top: 1.12,
  },
}
