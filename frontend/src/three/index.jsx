/* eslint-disable react/no-unknown-property, react-refresh/only-export-components */
import { Component, Suspense, lazy, useEffect, useRef, useState } from 'react'

// Public API (imported by the app). Keep these names and props stable.
export const CREATURES = ['blob', 'cat', 'dragon', 'axolotl', 'frog', 'bot']
export const ACCESSORIES = ['none', 'glasses', 'scarf', 'pencil', 'badge', 'backpack']
export const ENVIRONMENTS = ['room', 'arena', 'garden']

// three.js is code-split: the emoji fallback shows while it loads and on any WebGL error.
const Stage = lazy(() => import('./Stage.jsx'))

const FACE = { confused: '🤔', lightbulb: '💡', stuck: '😵', celebrating: '🎉' }
const GARDEN_SKY = 'linear-gradient(180deg, #A8F4F6 0%, #5FC9E0 100%)'

let webgl2
function hasWebGL2() {
  if (webgl2 !== undefined) return webgl2
  try {
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl2')
    webgl2 = !!gl
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    webgl2 = false
  }
  return webgl2
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false,
  )
  useEffect(() => {
    if (!window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const on = () => setReduced(mq.matches)
    mq.addEventListener?.('change', on)
    return () => mq.removeEventListener?.('change', on)
  }, [])
  return reduced
}

function useInView(ref) {
  const [inView, setInView] = useState(true)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: '80px' })
    io.observe(el)
    return () => io.disconnect()
  }, [ref])
  return inView
}

export function StageFallback({ mood = 'confused', env, bossEmoji, bossHp, height = 260, onTap }) {
  const hp = Math.max(0, Math.min(100, Number.isFinite(bossHp) ? bossHp : 100))
  const size = Math.max(40, Math.min(120, height * 0.34))
  return (
    <div
      className="stage-fallback"
      role="img"
      aria-label={`Pip is ${mood}`}
      onPointerDown={onTap}
      style={{
        height,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: size * 0.6,
        cursor: onTap ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      <span style={{ fontSize: size, lineHeight: 1, filter: 'drop-shadow(0 8px 14px rgba(0,0,0,.35))' }}>{FACE[mood] ?? '🤔'}</span>
      {env === 'arena' && (
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: size * 0.9, lineHeight: 1 }}>{bossEmoji || '👾'}</span>
          <span style={{ width: size * 1.1, height: 8, borderRadius: 999, background: 'rgba(239,239,233,.12)', overflow: 'hidden' }}>
            <span
              style={{
                display: 'block',
                height: '100%',
                width: `${hp}%`,
                background: 'linear-gradient(90deg,#FF6F5E,#FF8A7A 60%,#FFB4A3)',
              }}
            />
          </span>
        </span>
      )}
    </div>
  )
}

class GLBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(err) {
    console.warn('[pip/three] falling back to 2D:', err?.message || err)
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

export function MascotStage({
  creature,
  look,
  mood = 'confused',
  accessory = 'none',
  env = 'room',
  bossEmoji,
  bossHp,
  reaction = 0,
  height = 260,
  onTap,
  growth,
  weed = false,
}) {
  // Legacy `look`: bot -> bot, blob -> blob, doodle -> ink-outline toon variant. Only used when creature is absent.
  const resolved = CREATURES.includes(creature) ? creature : look === 'bot' ? 'bot' : 'blob'
  const toon = look === 'doodle'
  const safeEnv = ENVIRONMENTS.includes(env) ? env : 'room'
  const safeAcc = ACCESSORIES.includes(accessory) ? accessory : 'none'
  const reduced = usePrefersReducedMotion()
  const box = useRef(null)
  const inView = useInView(box)
  const [ok] = useState(() => (typeof document === 'undefined' ? false : hasWebGL2()))
  const [lost, setLost] = useState(false)

  const fallback = (
    <StageFallback mood={mood} env={safeEnv} bossEmoji={bossEmoji} bossHp={bossHp} height={height} onTap={onTap} />
  )

  return (
    <div
      ref={box}
      style={{
        position: 'relative',
        width: '100%',
        height,
        borderRadius: safeEnv === 'garden' ? 28 : undefined,
        background: safeEnv === 'garden' ? GARDEN_SKY : undefined,
        overflow: safeEnv === 'garden' ? 'hidden' : undefined,
      }}
    >
      {!ok || lost ? (
        fallback
      ) : (
        <GLBoundary fallback={fallback}>
          <Suspense fallback={fallback}>
            <Stage
              height={height}
              creature={resolved}
              toon={toon}
              mood={mood}
              accessory={safeAcc}
              env={safeEnv}
              bossEmoji={bossEmoji}
              bossHp={bossHp}
              reaction={reaction}
              onTap={onTap}
              growth={growth}
              weed={weed}
              reduced={reduced}
              active={inView}
              onContextLost={() => setLost(true)}
            />
          </Suspense>
        </GLBoundary>
      )}
    </div>
  )
}

// Small static portrait for lists (~64px). Rendered once per combo on a shared offscreen canvas.
export function MascotThumb({ creature = 'blob', accessory = 'none', look, size = 64, mood = 'idle', style }) {
  const [src, setSrc] = useState(null)
  const resolved = CREATURES.includes(creature) ? creature : look === 'bot' ? 'bot' : 'blob'
  const toon = look === 'doodle'
  useEffect(() => {
    let alive = true
    if (!hasWebGL2()) return
    import('./thumb.jsx')
      .then((m) => m.renderThumb({ creature: resolved, accessory, toon, mood }))
      .then((url) => alive && url && setSrc(url))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [resolved, accessory, toon, mood])
  if (!src) {
    return (
      <span
        aria-hidden
        style={{
          display: 'inline-grid',
          placeItems: 'center',
          width: size,
          height: size,
          borderRadius: '50%',
          fontSize: size * 0.5,
          background: 'rgba(239,239,233,.06)',
          ...style,
        }}
      >
        {FACE[mood] ?? '😐'}
      </span>
    )
  }
  return <img src={src} width={size} height={size} alt="" draggable={false} style={{ display: 'inline-block', ...style }} />
}

export default MascotStage
