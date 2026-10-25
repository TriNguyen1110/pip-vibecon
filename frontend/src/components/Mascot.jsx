import { Component, Suspense, lazy, useEffect, useRef, useState } from 'react'
import Pip2D, { ACCESSORIES_2D } from '../pip2d/Pip2D.jsx'
import { CREATURES_2D } from '../pip2d/creatures'

// src/three/ is owned by the 3D agent. We only import it lazily so three.js never blocks
// first paint and a WebGL failure never takes the page down.
const loadThree = () => import('../three/index.jsx')
const LazyStage = lazy(() => loadThree().then((m) => ({ default: m.MascotStage ?? m.default })))

export const FALLBACK_META = {
  CREATURES: ['blob', 'cat', 'dragon', 'axolotl', 'frog', 'bot'],
  ACCESSORIES: ['none', 'glasses', 'scarf', 'pencil', 'badge', 'backpack'],
  ENVIRONMENTS: ['room', 'arena', 'garden'],
}

// Coordinator decision (F3-F6): the mascot is 2D SVG (src/pip2d) by default; the 3D MascotStage
// stays behind ?mascot=3d as a fallback (remembered for the tab).
export const USE_3D = (() => {
  if (typeof window === 'undefined') return false
  try {
    const q = new URLSearchParams(window.location.search).get('mascot')
    if (q === '3d' || q === '2d') sessionStorage.setItem('pip.mascot', q)
    return (q ?? sessionStorage.getItem('pip.mascot')) === '3d'
  } catch {
    return false
  }
})()

export const CREATURE_EMOJI = {
  capybara: '🦫',
  corgi: '🐶',
  raccoon: '🦝',
  blob: '🫧',
  cat: '🐱',
  dragon: '🐲',
  axolotl: '🦎',
  frog: '🐸',
  bot: '🤖',
}
export const ACCESSORY_EMOJI = {
  none: '—',
  pencil: '✏️',
  badge: '📛',
  backpack: '🎒',
  glasses: '👓',
  scarf: '🧣',
}
export const MOOD_FACE = { confused: '🤔', lightbulb: '💡', stuck: '😵', celebrating: '🎉' }

// The contract's Session.look is blob | bot | doodle; the 3D creature set is wider.
export function lookForCreature(creature) {
  if (creature === 'bot') return 'bot'
  if (creature === 'blob') return 'blob'
  return 'doodle'
}

export const META_2D = { CREATURES: CREATURES_2D, ACCESSORIES: ACCESSORIES_2D, ENVIRONMENTS: FALLBACK_META.ENVIRONMENTS }
export const DEFAULT_CREATURE = USE_3D ? 'blob' : 'capybara'

export function useThreeMeta() {
  const [meta, setMeta] = useState(USE_3D ? FALLBACK_META : META_2D)
  useEffect(() => {
    if (!USE_3D) return
    let alive = true
    loadThree()
      .then((m) => {
        if (!alive) return
        setMeta({
          CREATURES: m.CREATURES?.length ? m.CREATURES : FALLBACK_META.CREATURES,
          ACCESSORIES: m.ACCESSORIES?.length ? m.ACCESSORIES : FALLBACK_META.ACCESSORIES,
          ENVIRONMENTS: m.ENVIRONMENTS?.length ? m.ENVIRONMENTS : FALLBACK_META.ENVIRONMENTS,
        })
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])
  return meta
}

function StaticPip({ creature = 'blob', mood = 'confused', height, bossEmoji, onTap }) {
  return (
    <div
      className="stage-fallback"
      style={{ height }}
      onClick={onTap}
      role={onTap ? 'button' : undefined}
      aria-label={`Pip, ${mood}`}
    >
      {bossEmoji && <span className="stage-fallback__boss">{bossEmoji}</span>}
      <span className="stage-fallback__pip">{CREATURE_EMOJI[creature] ?? '🫧'}</span>
      <span className="stage-fallback__mood">{MOOD_FACE[mood] ?? '🤔'}</span>
    </div>
  )
}

class StageBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(err) {
    console.warn('[Pip] 3D stage fell back to static:', err?.message)
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

function webglOk() {
  try {
    const c = document.createElement('canvas')
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')))
  } catch {
    return false
  }
}
let WEBGL = null

export default function Mascot(props) {
  if (!USE_3D) return <Stage2D {...props} />
  return <Mascot3D {...props} />
}

function Mascot3D(props) {
  const { height = 240, className = '' } = props
  if (WEBGL === null) WEBGL = typeof window !== 'undefined' && webglOk()
  const fallback = <StaticPip {...props} height={height} />
  return (
    <div className={`stage ${className}`} style={{ height }}>
      {WEBGL ? (
        <StageBoundary fallback={fallback}>
          <Suspense fallback={<div className="stage-loading" style={{ height }} aria-hidden />}>
            <LazyStage {...props} height={height} />
          </Suspense>
        </StageBoundary>
      ) : (
        fallback
      )}
    </div>
  )
}

/* ---------- 2D stage: Pip centered on the CSS scene, a soft floor disc and a blob shadow ---------- */

// Boss2D is drawn by the 2D builder (walrus | penguin | hamster, states smug | cracked | KO).
// Picked up when src/pip2d/Boss2D.jsx exists; until then the boss is its emoji pair.
const BOSS_MODULES = import.meta.glob('../pip2d/Boss2D.jsx')
const loadBoss = BOSS_MODULES['../pip2d/Boss2D.jsx']
const LazyBoss2D = loadBoss ? lazy(() => loadBoss().then((m) => ({ default: m.Boss2D ?? m.default }))) : null
const BOSS_KINDS = ['walrus', 'penguin', 'hamster', 'triangle']
export function bossKindFor(name = '', emoji = '') {
  const k = `${name} ${emoji}`.toLowerCase()
  if (/doublecount|duke|peacock|triangle|🦚|△/u.test(k)) return 'triangle'
  if (/penguin|🐧/u.test(k)) return 'penguin'
  if (/hamster|🐹/u.test(k)) return 'hamster'
  if (/walrus|🦭/u.test(k)) return 'walrus'
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 997
  return BOSS_KINDS[h % 3] // unknown bosses: one of the three classic villains
}
export const bossStateFor = (hp) => (hp <= 0 ? 'KO' : hp <= 40 ? 'cracked' : 'smug')

function Boss2DSlot({ emoji, name, hp, size, fx }) {
  const state = bossStateFor(hp ?? 100)
  const emojiBoss = (
    <span className="stage2d__boss-emoji" style={{ fontSize: size * 0.5 }} aria-hidden>
      {emoji || '👾'}
    </span>
  )
  return (
    <span
      className={`stage2d__boss is-${state.toLowerCase()}${fx ? ` shake-${fx.kind} fx-${fx.n % 2}` : ''}`}
      aria-label={`${name ?? 'The boss'}, ${state === 'KO' ? 'knocked out' : `${hp} HP`}`}
      role="img"
    >
      {LazyBoss2D ? (
        <Suspense fallback={emojiBoss}>
          <StageBoundary fallback={emojiBoss}>
            <LazyBoss2D boss={bossKindFor(name, emoji)} state={state.toLowerCase()} hp={hp} size={size} />
          </StageBoundary>
        </Suspense>
      ) : (
        emojiBoss
      )}
    </span>
  )
}

function usePoke(reaction) {
  const [on, setOn] = useState(false)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    setOn(false)
    const raf = requestAnimationFrame(() => setOn(true))
    const t = setTimeout(() => setOn(false), 300)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(t)
    }
  }, [reaction])
  return on
}

// Pip2D draws a vibe default when no accessory is chosen (cool = frosted visor, which reads like a sweatband).
// Students default to cool now, so "none" means none: pass an explicit empty pair. Cute keeps its star clips.
export function accessoryFor(accessory, vibe) {
  const none = !accessory || accessory === 'none' || (Array.isArray(accessory) && accessory.every((a) => a === 'none'))
  return none && vibe !== 'cute' ? ['none', 'none'] : accessory
}

export function Stage2D({
  creature,
  vibe = 'cool',
  accessory = 'none',
  mood = 'deadpan',
  form,
  mouth = 0,
  viseme,
  env = 'room',
  bossEmoji,
  bossName,
  bossHp,
  bossFx,
  reaction = 0,
  height = 240,
  onTap,
  className = '',
  framing,
  animate = true,
  version,
  pose,
  frame,
  lighting,
}) {
  const poke = usePoke(reaction)
  const name = CREATURES_2D.includes(creature) ? creature : 'capybara'
  const arena = env === 'arena' && (bossEmoji || bossName)
  const size = Math.round(Math.max(64, Math.min(height * (framing === 'hero' ? 0.62 : 0.66), 320)))
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  return (
    <div
      className={`stage stage2d stage2d--${env}${framing === 'hero' ? ' stage2d--hero' : ''} ${className}`}
      style={{ height, '--pip-size': `${size}px` }}
      onPointerDown={onTap}
    >
      <span className="stage2d__floor" aria-hidden />
      {arena && <Boss2DSlot emoji={bossEmoji} name={bossName} hp={bossHp ?? 100} size={Math.round(size * 0.55)} fx={bossFx} />}
      <span className="stage2d__shadow" aria-hidden />
      <span className={`stage2d__pip${poke ? ' is-poked' : ''}`}>
        <Pip2D
          creature={name}
          vibe={vibe ?? 'cool'}
          mood={mood}
          mouth={mouth}
          viseme={viseme}
          accessory={accessoryFor(accessory, vibe ?? 'cool')}
          form={form}
          holo={framing === 'hero'}
          version={version}
          pose={pose}
          frame={frame}
          lighting={lighting}
          size={size}
          animate={animate && !reduced}
        />
      </span>
    </div>
  )
}
