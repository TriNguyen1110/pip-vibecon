/* eslint-disable react/no-unknown-property, react-refresh/only-export-components */
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { CREATURE_MAP } from './creatures'
import { Face } from './parts/Face'
import { HeadAccessory, BodyAccessory } from './parts/Accessory'
import { MoodIcon, SweatDrop, Sparkles } from './parts/MoodIcon'
import { BlobShadow } from './parts/BlobShadow'
import { damp, easeInOut } from './parts/geo'

const MOODS = ['confused', 'lightbulb', 'stuck', 'celebrating']
const BODY_REACTIONS = ['squash', 'wiggle', 'hop', 'peek']
const HEAD_REACTIONS = ['flinch', 'shake', 'squash', 'wiggle']

// Classic 3-step squash: (1.15, 0.85) -> (0.95, 1.05) -> 1 over 240 ms. Returns [sx, sy].
export function squash3(t, dur = 0.24) {
  if (t < 0 || t >= dur) return [1, 1]
  const k = t / dur
  if (k < 0.4) {
    const e = easeInOut(k / 0.4)
    return [1.15 + (0.95 - 1.15) * e, 0.85 + (1.05 - 0.85) * e]
  }
  const e = easeInOut((k - 0.4) / 0.6)
  return [0.95 + 0.05 * e, 1.05 - 0.05 * e]
}

function pick(list, last) {
  const opts = list.filter((r) => r !== last)
  return opts[Math.floor(Math.random() * opts.length)]
}

export function Mascot({
  creature = 'blob',
  mood = 'confused',
  accessory = 'none',
  reaction = 0,
  onTap,
  still = false,
  reduced = false,
  shadowY = 0.004,
}) {
  const C = CREATURE_MAP[creature] ?? CREATURE_MAP.blob
  const spec = C.spec
  const root = useRef()
  const squash = useRef()
  const head = useRef()
  const shadow = useRef()
  const anim = useRef({
    blink: 1,
    blinkAt: -10,
    nextBlink: 2,
    reactAt: -10,
    kind: 'squash',
    pending: null,
    hopAt: -10,
    lastMood: mood,
    w: Object.fromEntries(MOODS.map((m) => [m, m === mood ? 1 : 0])),
    tiltZ: 0,
    tiltX: 0,
    yaw: 0,
    pitch: 0,
    lookAt: -10,
    lookDir: 0,
    nextLook: 6 + Math.random() * 4,
  })

  // External reaction counter -> one of the body reactions.
  const prevReaction = useRef(reaction)
  useEffect(() => {
    if (reaction !== prevReaction.current) {
      prevReaction.current = reaction
      const a = anim.current
      a.pending = pick(BODY_REACTIONS, a.kind)
    }
  }, [reaction])

  useFrame((state, delta) => {
    if (still) return
    const a = anim.current
    const t = state.clock.elapsedTime
    const dt = Math.min(delta, 0.05)

    if (a.pending) {
      a.kind = a.pending
      a.pending = null
      a.reactAt = t
      if (a.kind !== 'hop') a.blinkAt = t
    }
    if (a.lastMood !== mood) {
      a.lastMood = mood
      a.blinkAt = t
      if (mood === 'celebrating' || mood === 'lightbulb') a.hopAt = t
    }
    if (mood === 'celebrating' && t - a.hopAt > 6) a.hopAt = t

    // 120 ms blink at a random 2.5-6 s, sometimes a double
    if (t > a.nextBlink) {
      a.blinkAt = t
      a.nextBlink = t + (Math.random() < 0.15 ? 0.3 : 2.5 + Math.random() * 3.5)
    }
    const bt = t - a.blinkAt
    a.blink = bt >= 0 && bt < 0.12 ? 1 - Math.sin((Math.PI * bt) / 0.12) * 0.95 : 1

    for (const m of MOODS) a.w[m] = damp(a.w[m], m === mood ? 1 : 0, 5, dt)
    const W = a.w
    // 3.2 s breathing loop, scale 1.00-1.02
    const breathe = 0.5 + 0.5 * Math.sin((t * Math.PI * 2) / 3.2)

    // mood poses: small and weighty
    const tiltZ = W.confused * (0.15 + 0.02 * Math.sin(t * 0.8)) + W.stuck * 0.04 * Math.sin(t * 0.6)
    const tiltX = W.lightbulb * -0.09 + W.stuck * 0.12 + W.celebrating * -0.05
    a.tiltZ = damp(a.tiltZ, tiltZ, 5, dt)
    a.tiltX = damp(a.tiltX, tiltX, 5, dt)

    // look-around every 8-14 s, otherwise follow the pointer within +-15 deg
    if (t > a.nextLook) {
      a.lookAt = t
      a.lookDir = (Math.random() < 0.5 ? -1 : 1) * (0.35 + Math.random() * 0.15)
      a.nextLook = t + 8 + Math.random() * 6
    }
    const lt = t - a.lookAt
    const lookW = lt >= 0 && lt < 1.6 ? Math.sin((lt / 1.6) * Math.PI) : 0
    const px = THREE.MathUtils.clamp(state.pointer.x, -1, 1)
    const py = THREE.MathUtils.clamp(state.pointer.y, -1, 1)
    a.yaw = damp(a.yaw, px * 0.26 * (1 - lookW) + a.lookDir * lookW, 4, dt)
    a.pitch = damp(a.pitch, -py * 0.12, 4, dt)

    // hop: lightbulb = small pop; celebrating = one hop + 360 spin
    let hop = 0
    let spin = 0
    let land = 0
    if (!reduced) {
      const ht = t - a.hopAt
      const big = mood === 'celebrating'
      const dur = big ? 0.6 : 0.36
      const pre = 0.12
      if (ht >= 0 && ht < pre) land = Math.sin((ht / pre) * Math.PI) * (big ? 0.6 : 0.35)
      else if (ht >= pre && ht < pre + dur) {
        const k = (ht - pre) / dur
        hop = 4 * k * (1 - k) * (big ? 0.36 : 0.1)
        if (big) spin = easeInOut(k) * Math.PI * 2
      } else if (ht >= pre + dur && ht < pre + dur + 0.3) {
        const k = (ht - pre - dur) / 0.3
        land = Math.sin(k * Math.PI) * Math.exp(-k * 2) * (big ? 0.9 : 0.5)
      }
    }

    // tap reactions: instant (first frame after pointerdown), crisp, then settle
    const rt = t - a.reactAt
    let rsx = 1
    let rsy = 1
    let wiggle = 0
    let lean = 0
    let shake = 0
    let peek = 0
    if (rt >= 0 && rt < 0.8) {
      const env = Math.exp(-rt * 6)
      if (reduced) {
        const k = rt < 0.16 ? Math.sin((rt / 0.16) * Math.PI) : 0
        rsy = 1 - 0.04 * k
        rsx = 1 + 0.02 * k
      } else {
        switch (a.kind) {
          case 'squash':
            ;[rsx, rsy] = squash3(rt)
            break
          case 'wiggle':
            wiggle = 0.13 * Math.sin(rt * 21) * env
            ;[rsx, rsy] = squash3(rt, 0.2).map((v) => 1 + (v - 1) * 0.5)
            break
          case 'hop': {
            const k = rt / 0.36
            if (k < 1) hop += 4 * k * (1 - k) * 0.11
            ;[rsx, rsy] = squash3(rt < 0.36 ? rt * 0.3 : rt - 0.36)
            break
          }
          case 'peek':
            peek = rt < 0.55 ? Math.sin((rt / 0.55) * Math.PI) * 0.7 : 0
            ;[rsx, rsy] = squash3(rt, 0.18).map((v) => 1 + (v - 1) * 0.5)
            break
          case 'flinch':
            lean = -0.22 * (rt < 0.5 ? Math.sin((rt / 0.5) * Math.PI) : 0)
            ;[rsx, rsy] = squash3(rt, 0.2).map((v) => 1 + (v - 1) * 0.6)
            break
          case 'shake':
            shake = 0.28 * Math.sin(rt * 26) * env
            ;[rsx, rsy] = squash3(rt, 0.2).map((v) => 1 + (v - 1) * 0.4)
            break
        }
      }
    }

    const sy = (1 + 0.02 * breathe - W.stuck * 0.03) * (1 - 0.15 * land) * rsy * (hop > 0.02 ? 1.03 : 1)
    const sx = rsx / Math.sqrt(1 + 0.02 * breathe - W.stuck * 0.03) / Math.sqrt(1 - 0.15 * land)

    if (root.current) {
      root.current.position.y = hop
      root.current.rotation.y = spin + peek
      root.current.rotation.z = wiggle
      root.current.rotation.x = lean
    }
    if (squash.current) squash.current.scale.set(sx, sy, sx)
    if (head.current) {
      const k = spec.tilt ?? 1
      head.current.rotation.z = a.tiltZ * k
      head.current.rotation.x = a.tiltX * k + a.pitch * k
      head.current.rotation.y = (a.yaw + shake) * Math.max(0.5, k)
    }
    if (shadow.current) {
      const s = Math.max(0.4, 1 - hop * 1.4)
      shadow.current.scale.set(s * sx, s * sx, 1)
      shadow.current.material.opacity = 0.32 * s
    }
  })

  const tap = (e) => {
    e.stopPropagation()
    const a = anim.current
    let zone = 'body'
    if (root.current && e.point) {
      const local = root.current.worldToLocal(e.point.clone())
      if (local.y > spec.head[1] + (spec.headZone ?? 0.12)) zone = 'head'
    }
    a.pending = pick(zone === 'head' ? HEAD_REACTIONS : BODY_REACTIONS, a.kind)
    onTap?.()
  }

  return (
    <group>
      <BlobShadow ref={shadow} size={spec.shadow} position={[0, shadowY, 0]} />
      <group ref={root}>
        <group ref={squash}>
          <C.Body accessory={accessory} mood={mood} still={still} />
          <BodyAccessory type={accessory} spec={spec} />
          <group ref={head} position={spec.head}>
            <C.Head accessory={accessory} mood={mood} still={still} />
            <Face cfg={spec.face} mood={still ? 'idle' : mood} anim={anim} glow={spec.glow} />
            <HeadAccessory type={accessory} spec={spec} />
            {!still && <MoodIcon mood={mood} position={spec.icon} />}
            {!still && mood === 'stuck' && <SweatDrop position={spec.sweat} />}
          </group>
        </group>
        {!still && mood === 'celebrating' && <Sparkles spread={0.7} height={spec.top + 0.3} />}
        {!still && (
          <mesh
            position={[0, spec.top * 0.5, 0]}
            onPointerDown={tap}
            onPointerOver={() => (document.body.style.cursor = 'pointer')}
            onPointerOut={() => (document.body.style.cursor = '')}
          >
            <sphereGeometry args={[spec.top * 0.6, 12, 8]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
          </mesh>
        )}
      </group>
    </group>
  )
}
