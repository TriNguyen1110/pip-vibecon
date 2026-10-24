import { Component, Suspense, lazy, useEffect, useState } from 'react'

// src/three/ is owned by the 3D agent. We only import it lazily so three.js never blocks
// first paint and a WebGL failure never takes the page down.
const loadThree = () => import('../three/index.jsx')
const LazyStage = lazy(() => loadThree().then((m) => ({ default: m.MascotStage ?? m.default })))

export const FALLBACK_META = {
  CREATURES: ['blob', 'cat', 'dragon', 'axolotl', 'frog', 'bot'],
  ACCESSORIES: ['none', 'glasses', 'scarf', 'pencil', 'badge', 'backpack'],
  ENVIRONMENTS: ['room', 'arena', 'garden'],
}

export const CREATURE_EMOJI = {
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

export function useThreeMeta() {
  const [meta, setMeta] = useState(FALLBACK_META)
  useEffect(() => {
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
