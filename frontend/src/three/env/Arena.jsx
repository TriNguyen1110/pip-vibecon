/* eslint-disable react/no-unknown-property, react-refresh/only-export-components */
import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { Mat, CHROME } from '../parts/Mat'
import { BlobShadow } from '../parts/BlobShadow'
import { emojiTexture, glowTexture } from '../parts/textures'
import { squash3 } from '../Mascot'
import { UI } from '../palette'

const STONE = '#123D35'
const STONE_TOP = '#17463D'
const BAR_W = 1.04
const CORAL = '#F59B76'
const CORAL_LOW = '#FF6B5E'
const BOSS = '#FF5A4E'
const BOSS_BELLY = '#FFD0C4'
const CAPE = '#6A2C9C'
const INK_BOOT = '#2A1630'

// Kick-the-Buddy style stitch marks between two points.
function Stitches({ from, to, n = 5, vertical = false }) {
  const marks = []
  for (let i = 0; i < n; i++) {
    const k = n === 1 ? 0.5 : i / (n - 1)
    marks.push([from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k, from[2] + (to[2] - from[2]) * k])
  }
  return marks.map((p, i) => (
    <mesh key={i} position={p} rotation={[vertical ? Math.PI / 2 : 0, 0, vertical ? 0 : Math.PI / 2]}>
      <capsuleGeometry args={[0.012, 0.07, 3, 6]} />
      <meshStandardMaterial color="#3A1426" roughness={0.6} />
    </mesh>
  ))
}

function useDamageTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 256
    c.height = 128
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.userData.draw = (text) => {
      const g = c.getContext('2d')
      g.clearRect(0, 0, 256, 128)
      g.font = '800 84px system-ui, -apple-system, "Segoe UI", sans-serif'
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.lineWidth = 14
      g.strokeStyle = '#001914'
      g.strokeText(text, 128, 66)
      g.fillStyle = CORAL
      g.fillText(text, 128, 66)
      t.needsUpdate = true
    }
    return t
  }, [])
}

// Loud, absurd boss: a chunky horned billboard on a plinth, with a fighting-game HP bar.
function Boss({ emoji, hp, reduced }) {
  const tex = useMemo(() => emojiTexture(emoji), [emoji])
  useEffect(() => () => tex.dispose(), [tex])
  const dmgTex = useDamageTexture()
  useEffect(() => () => dmgTex.dispose(), [dmgTex])

  const body = useRef()
  const headG = useRef()
  const arms = [useRef(), useRef()]
  const ears = [useRef(), useRef()]
  const cape = useRef()
  const panelMat = useRef()
  const fill = useRef()
  const fillMat = useRef()
  const ghost = useRef()
  const bar = useRef()
  const dmg = useRef()
  const dmgMat = useRef()
  const st = useRef({ prev: hp, pending: null, hitAt: -10, healAt: -10, fill: hp, ghost: hp, ghostFrom: hp, bob: 0, lastT: 0 })

  useEffect(() => {
    const s = st.current
    if (hp <= 0 && s.prev > 0) s.koPending = true
    if (hp > 0) s.koAt = null
    if (hp < s.prev) s.pending = { type: 'hit', amount: Math.round(s.prev - hp) }
    else if (hp > s.prev) s.pending = { type: 'heal', amount: Math.round(hp - s.prev) }
    s.prev = hp
  }, [hp])

  useFrame((state, delta) => {
    const s = st.current
    const t = state.clock.elapsedTime
    if (s.pending) {
      if (s.pending.type === 'hit') {
        s.hitAt = t
        s.ghostFrom = Math.max(s.ghost, s.fill)
        s.fill = hp
        dmgTex.userData.draw(`−${s.pending.amount}`)
      } else {
        s.healAt = t
      }
      s.pending = null
    }
    if (s.koPending) {
      s.koPending = false
      s.koAt = t
    }
    const ht = t - s.hitAt
    const kt = t - s.healAt

    // HP fill: drops instantly on hit; rises quickly on heal.
    if (hp > s.fill) s.fill = Math.min(hp, s.fill + 110 * Math.min(0.05, delta) + 0.4)
    if (hp < s.fill && ht > 0.5) s.fill = hp
    // Ghost trails: waits 150 ms, then drains over 450 ms.
    if (ht >= 0 && ht < 0.6) {
      const k = ht < 0.15 ? 0 : (ht - 0.15) / 0.45
      s.ghost = s.ghostFrom + (s.fill - s.ghostFrom) * easeOut(Math.min(1, k))
    } else s.ghost = s.fill

    if (fill.current) fill.current.scale.x = Math.max(0.0001, s.fill / 100)
    if (ghost.current) ghost.current.scale.x = Math.max(0.0001, s.ghost / 100)
    if (fillMat.current) {
      const low = s.fill <= 25
      fillMat.current.color.set(low ? CORAL_LOW : CORAL)
      const healGlow = kt >= 0 && kt < 0.5 ? Math.sin((kt / 0.5) * Math.PI) : 0
      fillMat.current.emissive.set(healGlow > 0 ? '#FFD9A8' : low ? '#FF2A1A' : '#000000')
      fillMat.current.emissiveIntensity = healGlow > 0 ? healGlow * 0.9 : low ? 0.25 + 0.25 * Math.sin(t * 8) : 0
    }

    // Boss body: bouncy idle, 70 ms hit-stop, squash + shake on hit; grow + wobble + smug bob on heal.
    let x = 0
    let rz = 0
    let sx = 1
    let sy = 1
    let flash = 0
    const frozen = !reduced && ht >= 0 && ht < 0.07
    if (!frozen) s.bob = Math.abs(Math.sin(t * 3.4)) * 0.07
    const bottom = 1 - Math.min(1, s.bob / 0.025)
    sy *= 1 - 0.05 * bottom
    sx *= 1 + 0.04 * bottom
    if (ht >= 0 && ht < 0.4) {
      flash = ht < 0.15 ? 1 - ht / 0.15 : 0
      if (!reduced && ht >= 0.07) {
        const k = Math.min(1, (ht - 0.07) / 0.28)
        const decay = 1 - easeOut(k)
        x = 0.045 * Math.sin(k * Math.PI * 8) * decay
        rz = 0.026 * Math.sin(k * Math.PI * 8 + 0.6) * decay
        const [qx, qy] = squash3(ht - 0.07)
        sx *= qx
        sy *= qy
      }
    }
    if (kt >= 0 && kt < 0.36 && !reduced) {
      const k = kt / 0.36
      const g = 1 + 0.08 * Math.sin(k * Math.PI)
      sx *= g
      sy *= g
      rz += 0.052 * Math.sin(k * Math.PI * 4) * (1 - k)
    }
    const smug = kt >= 0 && kt < 1.2 && !reduced ? Math.sin((kt / 1.2) * Math.PI * 3) * 0.035 : 0

    // K.O.: 120 ms hit-stop, flop flat (1.4, 0.1), then slide out. 500 ms total.
    let slide = 0
    if (s.koAt != null) {
      const kk = t - s.koAt
      const f = reduced ? 1 : THREE.MathUtils.clamp((kk - 0.12) / 0.2, 0, 1)
      sx = 1 + 0.4 * f
      sy = 1 - 0.9 * f
      x = 0
      rz = 0
      s.bob = 0
      slide = reduced ? 0 : Math.max(0, (kk - 0.32) / 0.3) ** 2 * 3
    }
    if (body.current) {
      body.current.visible = !(s.koAt != null && (reduced ? t - s.koAt > 0.15 : slide > 3))
      body.current.position.set(x + slide, s.bob + smug, 0)
      body.current.rotation.z = rz + Math.sin(t * 2.1) * 0.045
      body.current.rotation.y = reduced ? 0 : Math.sin(t * 2.1) * 0.22 // idle swagger
      body.current.scale.set(sx, sy, sx)
    }
    // floppy ragdoll limbs
    const hitFlop = ht >= 0.07 && ht < 1.2 ? Math.sin((ht - 0.07) * 17) * Math.exp(-(ht - 0.07) * 3.5) : 0
    const flex = kt >= 0 && kt < 0.9 ? Math.sin((kt / 0.9) * Math.PI) : 0
    arms.forEach((r, i) => {
      if (!r.current) return
      const sgn = i ? 1 : -1
      const sway = Math.sin(t * 3.4 + i) * 0.12
      r.current.rotation.z = sgn * (0.35 + sway + (reduced ? 0 : hitFlop * 0.9) + flex * 1.9)
      r.current.rotation.x = reduced ? 0 : hitFlop * 0.4 * sgn
    })
    ears.forEach((r, i) => {
      if (r.current) r.current.rotation.z = (i ? -1 : 1) * (0.3 + (reduced ? 0 : hitFlop * 0.25))
    })
    if (cape.current) cape.current.rotation.x = 0.12 + Math.sin(t * 4.2) * 0.06 + (reduced ? 0 : Math.abs(hitFlop) * 0.4)
    if (headG.current) {
      headG.current.rotation.x = reduced ? 0 : -0.35 * Math.max(0, hitFlop) * (ht < 0.6 ? 1 : 0.5)
      headG.current.rotation.z = Math.sin(t * 2.7) * 0.05 + (reduced ? 0 : hitFlop * 0.12)
    }
    if (panelMat.current) {
      panelMat.current.emissive.set(reduced ? '#ffffff' : '#FFE1D4')
      panelMat.current.emissiveIntensity = flash * (reduced ? 0.8 : 0.6)
    }
    if (bar.current) {
      const pulse = kt >= 0 && kt < 0.4 ? 1 + 0.1 * Math.sin((kt / 0.4) * Math.PI) : 1
      bar.current.scale.set(pulse, pulse, pulse)
      bar.current.position.x = reduced ? 0 : x * 0.6
    }
    if (dmg.current && dmgMat.current) {
      const k = ht >= 0 ? ht / 0.7 : 1
      dmg.current.visible = k < 1
      if (k < 1) {
        dmg.current.position.y = 1.58 + easeOut(k) * 0.28
        dmgMat.current.opacity = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4
      }
    }
  })

  return (
    <group>
      <BlobShadow size={1.5} opacity={0.4} position={[0, 0.006, 0]} />
      {/* plinth */}
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.5, 0.56, 0.24, 36]} />
        <Mat color="#0F2D27" rough={0.35} />
      </mesh>
      <mesh position={[0, 0.245, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.4, 0.46, 40]} />
        <meshBasicMaterial color={UI.sunset} toneMapped={false} />
      </mesh>
      {/* the boss: a smug slapstick villain. Glossy ragdoll, emoji face decal, cape and belt. */}
      <group position={[0, 0.25, 0]} scale={0.85}>
        <group ref={body}>
          <mesh position={[0, 0.7, -0.45]}>
            <planeGeometry args={[2.2, 2.2]} />
            <meshBasicMaterial map={glowTexture()} color={UI.sunset} transparent opacity={0.3} depthWrite={false} toneMapped={false} />
          </mesh>
          {/* cape */}
          <group ref={cape} position={[0, 0.78, -0.02]}>
            <mesh position={[0, -0.32, 0]} scale={[1, 1, 0.9]}>
              <cylinderGeometry args={[0.36, 0.5, 0.66, 28, 1, true, Math.PI / 2 + 0.35, Math.PI - 0.7]} />
              <Mat color={CAPE} rough={0.3} side={THREE.DoubleSide} />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.3, 0.045, 8, 28]} />
              <Mat color={CAPE} rough={0.3} />
            </mesh>
          </group>
          {[-1, 1].map((sg) => (
            <group key={`leg${sg}`} position={[sg * 0.16, 0.2, 0]}>
              <mesh position={[0, -0.06, 0]}>
                <capsuleGeometry args={[0.09, 0.1, 4, 10]} />
                <Mat color={BOSS} />
              </mesh>
              <mesh position={[sg * 0.02, -0.15, 0.06]} scale={[1.15, 0.6, 1.5]}>
                <sphereGeometry args={[0.1, 14, 10]} />
                <Mat color={INK_BOOT} />
              </mesh>
            </group>
          ))}
          {/* puffed chest */}
          <mesh position={[0, 0.47, 0]} scale={[1.08, 1, 0.9]}>
            <sphereGeometry args={[0.36, 32, 24]} />
            <meshPhysicalMaterial ref={panelMat} color={BOSS} roughness={0.25} clearcoat={1} clearcoatRoughness={0.08} sheen={0.3} />
          </mesh>
          <mesh position={[0, 0.6, 0.13]} scale={[1.15, 0.78, 0.85]}>
            <sphereGeometry args={[0.27, 28, 18]} />
            <Mat color={BOSS} />
          </mesh>
          <mesh position={[0, 0.6, 0.3]} scale={[1.2, 0.8, 0.3]}>
            <sphereGeometry args={[0.16, 20, 14]} />
            <Mat color={BOSS_BELLY} outline={false} />
          </mesh>
          <Stitches from={[-0.16, 0.48, 0.32]} to={[-0.2, 0.26, 0.24]} n={4} />
          {/* belt + chrome buckle */}
          <mesh position={[0, 0.33, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1.05, 0.9, 1]}>
            <torusGeometry args={[0.335, 0.045, 10, 36]} />
            <Mat color={INK_BOOT} rough={0.3} />
          </mesh>
          <RoundedBox args={[0.15, 0.11, 0.04]} radius={0.02} smoothness={2} position={[0, 0.33, 0.33]}>
            <Mat {...CHROME} />
          </RoundedBox>
          {[-1, 1].map((sg, i) => (
            <group key={`arm${sg}`} ref={arms[i]} position={[sg * 0.33, 0.66, 0.02]}>
              <mesh position={[0, -0.17, 0]}>
                <capsuleGeometry args={[0.08, 0.22, 4, 10]} />
                <Mat color={BOSS} />
              </mesh>
              <mesh position={[0, -0.35, 0]}>
                <sphereGeometry args={[0.1, 14, 10]} />
                <Mat color="#FFFFFF" />
              </mesh>
            </group>
          ))}
          <group ref={headG} position={[0, 0.86, 0.02]}>
            <RoundedBox args={[0.8, 0.72, 0.6]} radius={0.24} smoothness={4} position={[0, 0.3, 0]}>
              <Mat color={BOSS} />
            </RoundedBox>
            <RoundedBox args={[0.62, 0.6, 0.06]} radius={0.14} smoothness={3} position={[0, 0.29, 0.28]}>
              <Mat color={UI.ivory} rough={0.25} />
            </RoundedBox>
            <mesh position={[0, 0.37, 0.315]}>
              <planeGeometry args={[0.48, 0.48]} />
              <meshBasicMaterial map={tex} transparent toneMapped={false} />
            </mesh>
            {/* smug angled brows (inner ends down) */}
            {[-1, 1].map((sg) => (
              <mesh key={`brow${sg}`} position={[sg * 0.14, 0.62, 0.33]} rotation={[0, 0, Math.PI / 2 + sg * 0.42]}>
                <capsuleGeometry args={[0.034, 0.17, 4, 10]} />
                <Mat color={INK_BOOT} rough={0.2} />
              </mesh>
            ))}
            {/* cocky lopsided grin */}
            <group position={[0.04, 0.12, 0.31]} rotation={[0, 0, 0.16]}>
              <mesh scale={[1.35, 0.62, 0.35]}>
                <sphereGeometry args={[0.13, 22, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
                <meshStandardMaterial color={INK_BOOT} roughness={0.4} side={THREE.DoubleSide} />
              </mesh>
              <mesh position={[0, -0.012, 0.03]}>
                <boxGeometry args={[0.28, 0.035, 0.02]} />
                <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
              </mesh>
            </group>
            <Stitches from={[-0.3, 0.64, -0.05]} to={[0.3, 0.64, -0.05]} n={6} vertical />
            {/* little villain horns */}
            {[-1, 1].map((sg, i) => (
              <group key={`horn${sg}`} ref={ears[i]} position={[sg * 0.27, 0.64, 0]}>
                <mesh position={[0, 0.1, 0]}>
                  <coneGeometry args={[0.075, 0.22, 16]} />
                  <Mat color="#FFF1E6" rough={0.25} />
                </mesh>
              </group>
            ))}
          </group>
        </group>
      </group>
      {/* HP bar */}
      <group ref={bar} position={[0, 1.86, 0.05]}>
        <RoundedBox args={[BAR_W + 0.1, 0.17, 0.1]} radius={0.06} smoothness={3}>
          <Mat color="#06201B" rough={0.5} />
        </RoundedBox>
        <group ref={ghost} position={[-BAR_W / 2, 0, 0.02]}>
          <mesh position={[BAR_W / 2, 0, 0]}>
            <boxGeometry args={[BAR_W, 0.085, 0.08]} />
            <meshBasicMaterial color="#FFF6EE" toneMapped={false} />
          </mesh>
        </group>
        <group ref={fill} position={[-BAR_W / 2, 0, 0.03]}>
          <mesh position={[BAR_W / 2, 0, 0]}>
            <boxGeometry args={[BAR_W, 0.09, 0.085]} />
            <meshStandardMaterial ref={fillMat} color={CORAL} roughness={0.4} />
          </mesh>
          <mesh position={[BAR_W / 2, 0.024, 0.045]}>
            <boxGeometry args={[BAR_W, 0.014, 0.002]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.4} depthWrite={false} />
          </mesh>
        </group>
      </group>
      <mesh ref={dmg} position={[0.35, 1.5, 0.45]} visible={false}>
        <planeGeometry args={[0.56, 0.28]} />
        <meshBasicMaterial ref={dmgMat} map={dmgTex} transparent depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}

const easeOut = (k) => 1 - Math.pow(1 - k, 3)

function Orb({ position, color, phase = 0 }) {
  const g = useRef()
  useFrame((s) => {
    if (g.current) g.current.position.y = position[1] + Math.sin(s.clock.elapsedTime * 1.2 + phase) * 0.05
  })
  return (
    <group>
      <mesh position={[position[0], position[1] / 2 - 0.1, position[2]]}>
        <cylinderGeometry args={[0.13, 0.17, position[1] - 0.2, 16]} />
        <Mat color={STONE} rough={0.75} />
      </mesh>
      <group ref={g} position={position}>
        <mesh>
          <sphereGeometry args={[0.11, 18, 14]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
        <mesh>
          <planeGeometry args={[0.8, 0.8]} />
          <meshBasicMaterial map={glowTexture()} color={color} transparent opacity={0.5} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}

function Ring({ position, color, r = 0.55 }) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[r - 0.035, r, 48]} />
      <meshBasicMaterial color={color} transparent opacity={0.85} toneMapped={false} />
    </mesh>
  )
}

export function Arena({ bossEmoji = '👾', bossHp = 100, reduced }) {
  const hp = THREE.MathUtils.clamp(Number.isFinite(bossHp) ? bossHp : 100, 0, 100)
  return (
    <group>
      <mesh position={[0, -0.16, 0]}>
        <cylinderGeometry args={[2.45, 2.3, 0.32, 56]} />
        <Mat color={STONE} rough={0.6} coat={0.2} />
      </mesh>
      <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.3, 56]} />
        <Mat color={STONE_TOP} rough={0.7} coat={0.15} outline={false} />
      </mesh>
      <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.26, 2.33, 64]} />
        <meshBasicMaterial color={UI.ice} transparent opacity={0.7} toneMapped={false} />
      </mesh>
      <Ring position={[-0.95, 0.006, 0.15]} color={UI.ice} />
      <Ring position={[1.0, 0.006, -0.1]} color={UI.sunset} r={0.7} />
      <Orb position={[-2.05, 1.3, -1.2]} color={UI.ice} />
      <Orb position={[2.05, 1.3, -1.2]} color={UI.sunset} phase={1.7} />
      <group position={[1.0, 0, -0.1]} rotation={[0, -0.32, 0]}>
        <Boss emoji={bossEmoji} hp={hp} reduced={reduced} />
      </group>
    </group>
  )
}
