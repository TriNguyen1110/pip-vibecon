/* eslint-disable react/no-unknown-property, react-refresh/only-export-components */
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { Mascot } from './Mascot'
import { ENV_MAP } from './env'
import { StyleCtx } from './parts/Mat'
import { CREATURE_MAP } from './creatures'
import { ThemeCtx } from './parts/theme'
import { THEMES } from './palette'

function CameraRig({ frame, sway = true }) {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const base = useRef(new THREE.Vector3())
  const target = useMemo(() => new THREE.Vector3(...frame.target), [frame])
  useLayoutEffect(() => {
    const aspect = size.width / Math.max(1, size.height)
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
    const dist = Math.max(frame.h / t, frame.w / (t * aspect))
    const dir = new THREE.Vector3(0, frame.elev ?? 0.3, 1).normalize()
    base.current.copy(target).addScaledVector(dir, dist)
    camera.position.copy(base.current)
    camera.lookAt(target)
    camera.updateProjectionMatrix()
  }, [camera, size, frame, target])
  useFrame((s) => {
    if (!sway) return
    const t = s.clock.elapsedTime
    camera.position.set(base.current.x + Math.sin(t * 0.21) * 0.06, base.current.y + Math.sin(t * 0.17) * 0.03, base.current.z)
    camera.lookAt(target)
  })
  return null
}

// Glossy reflections without network assets: an env map baked once from light strips.
export function StudioEnv() {
  return (
    <Environment resolution={128} frames={1}>
      <Lightformer form="rect" intensity={3} color="#ffffff" position={[-3, 4, 4]} scale={[5, 2.5, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={1.6} color="#7FF5EC" position={[5, 1, 1]} scale={[2, 6, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={1.4} color="#FF9CCB" position={[-5, 0.5, -2]} scale={[2, 6, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={0.8} color="#C9FCFC" position={[0, 6, -3]} scale={[6, 1.5, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={0.5} color="#FFE7C9" position={[0, -4, 2]} scale={[6, 2, 1]} target={[0, 0, 0]} />
    </Environment>
  )
}

export function Lights({ env, theme = THEMES.day }) {
  const night = theme.name === 'night'
  return (
    <>
      <hemisphereLight args={theme.hemi} />
      <directionalLight position={[-3, 5, 4]} intensity={theme.key[1]} color={theme.key[0]} />
      <directionalLight position={[3.5, 2.5, -4]} intensity={theme.rim[1]} color={theme.rim[0]} />
      {env === 'arena' && <pointLight position={[1.1, 1.2, 0.9]} intensity={2.2} distance={3.5} decay={2} color={theme.arena.point} />}
      {env === 'arena' && night && <spotLight position={[0, 5, 2.5]} angle={0.55} penumbra={0.7} intensity={18} distance={9} decay={2} color="#F2F6FF" />}
      {env === 'room' && <pointLight position={[1.25, 0.9, -0.5]} intensity={night ? 2.4 : 1.4} distance={3} decay={2} color={theme.room.point} />}
    </>
  )
}

// 30 fps, paused when offscreen (rAF already pauses in hidden tabs).
function FpsDriver({ fps = 30, active = true }) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    if (!active) return
    let id
    let last = 0
    const step = (now) => {
      id = requestAnimationFrame(step)
      if (now - last >= 1000 / fps - 3) {
        last = now
        invalidate()
      }
    }
    id = requestAnimationFrame(step)
    return () => cancelAnimationFrame(id)
  }, [active, fps, invalidate])
  return null
}

// Talking-Tom "hero" composition: Pip large, centered, facing the camera, feet low in the frame.
function heroFrame(top) {
  // feet ~1/4 up from the bottom; enough width to show the boss / room around Pip
  return { target: [0, top * 0.5, 0], w: 0.95, h: top * 0.92, elev: 0.1 }
}

function Scene(props) {
  const { creature, toon, mood, accessory, env, bossEmoji, bossHp, reaction, onTap, growth, weed, reduced, active, hero, mouthRef, theme } = props
  const T = THEMES[theme] ?? THEMES.day
  const E = ENV_MAP[env] ?? ENV_MAP.room
  const Env = E.Component
  const top = (CREATURE_MAP[creature] ?? CREATURE_MAP.blob).spec.top
  const frame = useMemo(() => (hero ? heroFrame(top) : E.frame), [hero, top, E])
  const place = hero ? E.hero ?? { pos: [0, 0, 0.2], rotY: 0 } : E.mascot
  return (
    <ThemeCtx.Provider value={T}>
    <StyleCtx.Provider value={{ toon }}>
      <FpsDriver active={active} />
      <CameraRig frame={frame} sway={!reduced} />
      <Lights env={env} theme={T} />
      <StudioEnv />
      <Env bossEmoji={bossEmoji} bossHp={bossHp} growth={growth} weed={weed} reduced={reduced} hero={hero} />
      <group position={place.pos} rotation={[0, place.rotY, 0]} scale={place.scale ?? 1}>
        <Mascot
          creature={creature}
          mood={mood}
          accessory={accessory}
          reaction={reaction}
          onTap={onTap}
          reduced={reduced}
          mouthRef={mouthRef}
          shadowY={(hero ? E.heroShadowY : null) ?? E.shadowY ?? 0.006}
        />
      </group>
    </StyleCtx.Provider>
    </ThemeCtx.Provider>
  )
}

export default function Stage({ height, onContextLost, ...props }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop="demand"
      flat
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      camera={{ fov: 30, position: [0, 1.6, 6], near: 0.1, far: 60 }}
      style={{ width: '100%', height, touchAction: 'manipulation' }}
      onCreated={(state) => {
        state.gl.setClearColor(0x000000, 0)
        state.gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault()
          onContextLost?.()
        })
      }}
    >
      <Scene {...props} />
    </Canvas>
  )
}
