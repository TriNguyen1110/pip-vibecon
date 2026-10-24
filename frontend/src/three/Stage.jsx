/* eslint-disable react/no-unknown-property, react-refresh/only-export-components */
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { Mascot } from './Mascot'
import { ENV_MAP } from './env'
import { StyleCtx } from './parts/Mat'

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

export function Lights({ env }) {
  return (
    <>
      <hemisphereLight args={['#FFFFFF', env === 'garden' ? '#5E8F5A' : '#5B4F63', 0.9]} />
      <directionalLight position={[-3, 5, 4]} intensity={1.9} color="#FFF4E6" />
      <directionalLight position={[3.5, 2.5, -4]} intensity={1.6} color="#A7DFE6" />
      {env === 'arena' && <pointLight position={[1.1, 1.2, 0.9]} intensity={2.2} distance={3.5} decay={2} color="#FF9C80" />}
      {env === 'room' && <pointLight position={[1.25, 0.9, -0.5]} intensity={1.6} distance={3} decay={2} color="#FFC6E6" />}
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

function Scene(props) {
  const { creature, toon, mood, accessory, env, bossEmoji, bossHp, reaction, onTap, growth, weed, reduced, active } = props
  const E = ENV_MAP[env] ?? ENV_MAP.room ?? Object.values(ENV_MAP)[0]
  const Env = E.Component
  return (
    <StyleCtx.Provider value={{ toon }}>
      <FpsDriver active={active} />
      <CameraRig frame={E.frame} sway={!reduced} />
      <Lights env={env} />
      <StudioEnv />
      <Env bossEmoji={bossEmoji} bossHp={bossHp} growth={growth} weed={weed} reduced={reduced} />
      <group position={E.mascot.pos} rotation={[0, E.mascot.rotY, 0]} scale={E.mascot.scale ?? 1}>
        <Mascot
          creature={creature}
          mood={mood}
          accessory={accessory}
          reaction={reaction}
          onTap={onTap}
          reduced={reduced}
          shadowY={E.shadowY ?? 0.006}
        />
      </group>
    </StyleCtx.Provider>
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
