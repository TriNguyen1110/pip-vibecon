/* eslint-disable react/no-unknown-property, react-refresh/only-export-components */
import { useRef } from 'react'
import * as THREE from 'three'
import { createRoot, extend, useFrame, useThree } from '@react-three/fiber'
import { Mascot } from './Mascot'
import { StudioEnv } from './Stage'
import { StyleCtx } from './parts/Mat'
import { CREATURE_MAP } from './creatures'
import { VibeCtx } from './parts/vibe'

// One shared offscreen canvas renders each thumbnail once; results are cached as data URLs.
const SIZE = 160
const cache = new Map()
let chain = Promise.resolve()
let canvas = null
let root = null

function Capture({ done }) {
  const n = useRef(0)
  const setFrameloop = useThree((s) => s.setFrameloop)
  useFrame(({ gl }) => {
    n.current += 1
    if (n.current === 4) {
      done(gl.domElement.toDataURL('image/png'))
      setFrameloop('never')
    }
  })
  return null
}

function ThumbScene({ creature, accessory, toon, mood, vibe, done }) {
  const camera = useThree((s) => s.camera)
  const top = (CREATURE_MAP[creature] ?? CREATURE_MAP.blob).spec.top
  const cy = top * 0.48
  const dist = (top * 0.7) / Math.tan((15 * Math.PI) / 180)
  camera.position.set(0, cy + dist * 0.18, dist)
  camera.lookAt(0, cy, 0)
  return (
    <VibeCtx.Provider value={vibe}>
    <StyleCtx.Provider value={{ toon }}>
      <hemisphereLight args={['#FFFFFF', '#5B4F63', 0.9]} />
      <directionalLight position={[-3, 5, 4]} intensity={1.9} />
      <directionalLight position={[3.5, 2.5, -4]} intensity={1.6} color="#A7DFE6" />
      <StudioEnv />
      <group rotation={[0, 0.35, 0]}>
        <Mascot creature={creature} accessory={accessory} mood={mood === 'idle' ? 'confused' : mood} still />
      </group>
      <Capture done={done} />
    </StyleCtx.Provider>
    </VibeCtx.Provider>
  )
}

export function renderThumb({ creature = 'blob', accessory = 'none', toon = false, mood = 'idle', vibe = 'cute' }) {
  const key = `${creature}|${accessory}|${toon}|${mood}|${vibe}`
  if (cache.has(key)) return cache.get(key)
  const job = (chain = chain.then(
    () =>
      new Promise((resolve) => {
        const timer = setTimeout(() => resolve(null), 4000)
        try {
          if (!canvas) {
            extend(THREE) // <Canvas> does this; a bare root must do it itself
            canvas = document.createElement('canvas')
            canvas.width = SIZE
            canvas.height = SIZE
            root = createRoot(canvas)
          }
          root.configure({
            gl: { alpha: true, antialias: true, preserveDrawingBuffer: true },
            size: { width: SIZE, height: SIZE, top: 0, left: 0 },
            dpr: 1,
            flat: true,
            frameloop: 'always',
            camera: { fov: 30, near: 0.1, far: 50 },
          })
          root.render(
            <ThumbScene
              key={key}
              creature={creature}
              accessory={accessory}
              toon={toon}
              mood={mood}
              vibe={vibe}
              done={(url) => {
                clearTimeout(timer)
                resolve(url)
              }}
            />,
          )
        } catch {
          clearTimeout(timer)
          resolve(null)
        }
      }),
  ))
  cache.set(key, job)
  return job
}
