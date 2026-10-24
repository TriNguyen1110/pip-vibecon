/* eslint-disable react/no-unknown-property, react-refresh/only-export-components */
import { useMemo } from 'react'
import { Ball, Tube, At } from '../parts/shapes'
import { Mat } from '../parts/Mat'
import { makeLathe, onLathe } from '../parts/geo'
import { CREATURE_COLORS } from '../palette'

// "Lilac / Cream": Pip's default form. A soft teardrop with a single cowlick.
const C = CREATURE_COLORS.blob
const PIVOT = 0.4
const lathe = makeLathe([
  [0, 0],
  [0.4, 0.015],
  [0.55, 0.13],
  [0.6, 0.34],
  [0.575, 0.57],
  [0.47, 0.8],
  [0.3, 0.99],
  [0.12, 1.11],
  [0, 1.15],
])
const OFF = [0, -PIVOT, 0]
const belly = onLathe(lathe, 0, 0.22, -0.012) // rendered inside the OFF group

function Body() {
  return (
    <group>
      {[-1, 1].map((s) => (
        <Ball key={`a${s}`} r={0.1} s={[0.7, 1, 0.9]} position={[s * 0.59, 0.34, 0.05]} rotation={[0, 0, s * 0.35]} color={C.body} />
      ))}
    </group>
  )
}

function Head() {
  const pts = useMemo(() => lathe.pts, [])
  return (
    <group position={OFF}>
      <mesh>
        <latheGeometry args={[pts, 48]} />
        <Mat color={C.body} />
      </mesh>
      <At a={belly}>
        <mesh scale={[1.3, 0.95, 0.3]}>
          <sphereGeometry args={[0.19, 28, 18]} />
          <Mat color={C.patch} outline={false} />
        </mesh>
      </At>
      <Tube
        points={[
          [0, 1.1, 0],
          [0.0, 1.22, 0.03],
          [0.06, 1.3, 0.02],
          [0.13, 1.28, -0.03],
          [0.12, 1.21, -0.05],
        ]}
        r={0.034}
        endR={0.036}
        color={C.body}
      />
    </group>
  )
}

const face = {
  eyes: [onLathe(lathe, -0.34, 0.66, 0, OFF), onLathe(lathe, 0.34, 0.66, 0, OFF)],
  w: 0.062,
  h: 0.1,
  mouth: onLathe(lathe, 0.04, 0.5, 0, OFF),
  mouthW: 0.22,
}

export default {
  Body,
  Head,
  spec: {
    head: [0, PIVOT, 0],
    tilt: 0.4,
    face,
    glassesSide: [0.56, 0],
    pencil: { anchor: onLathe(lathe, 0.8, 0.88, 0, OFF), rot: [0, 0, -1.25] },
    scarf: { y: 0.36, r: 0.62, tube: 0.085, rz: 1 },
    badge: onLathe(lathe, -0.5, 0.4),
    pack: {
      pos: [0, 0.48, -0.56],
      s: 1.05,
      curves: [-0.62, 0.62].map((t) => [0.98, 0.85, 0.7, 0.55, 0.42].map((y) => onLathe(lathe, t * (1 + (0.98 - y) * 0.35), y, 0.022).position)),
    },
    icon: [0.42, 0.98, 0.05],
    sweat: [0.48, 0.18, 0.32],
    shadow: 1.45,
    top: 1.3,
  },
}
