import { useEffect, useId, useRef, useState } from 'react'
import { BLUSH, BOSS_TINT, EYE, MOOD_ALIASES, MOUTH, TONGUE } from './tokens'
import { CREATURE_DEFS } from './creatures'
import { mix } from './shapes'
import { ACCESSORIES_2D, Y2KDefs, Gel, Glint, Sparkles, StarClips, Charm, FrostVisor, Shades, HoloBandAid, RimLight, starPath } from './y2k'

export { ACCESSORIES_2D }
import './pip2d.css'

// Pip as a flat, hand-inked 2D character. viewBox 200 x 220, no dependencies.
// Each creature supplies its art + anchors (eyes, mouth, sprout, hands, head, neck...);
// the face, the brain sprout, vibes and accessories are shared layers placed on those anchors.

// Sprout (brain cowlick) poses, drawn around a base at (100,44) and translated to the creature's anchor.
const SPROUTS = {
  droop: { d: 'M100,44 C99,26 110,15 124,19 C133,22 135,31 128,35', tip: [128, 35] },
  question: { d: 'M100,44 L100,35 C100,27 116,26 116,15 C116,5 100,2 92,12', tip: [92, 12] },
  perky: { d: 'M100,44 C99,30 103,19 113,12', tip: [113, 12] },
  curl: { d: 'M100,44 C99,30 107,22 116,25 C121,27 119,33 114,32', tip: [114, 32] },
  wilt: { d: 'M100,44 C106,35 120,35 131,45', tip: [131, 45] },
  horn: { d: 'M100,44 C100,30 106,20 118,16 C114,24 112,30 112,30', tip: [118, 16] },
  bulb: { d: 'M100,44 L100,34', tip: [100, 20] },
  crown: { d: 'M100,44 L100,34', tip: [100, 20] },
}

const MOOD_SPEC = {
  deadpan: { sprout: 'droop', lids: [0.35, 0.37] },
  confused: { sprout: 'question', lids: [0.08, 0.45], scale: [1.12, 0.94], brows: true },
  notes: { sprout: 'droop', lids: [0.5, 0.52], look: [0, 3] },
  thinking: { sprout: 'curl', eyes: 'dots' },
  aha: { sprout: 'bulb', eyes: 'round' },
  proud: { sprout: 'perky', eyes: 'arcs' },
  overwhelmed: { sprout: 'wilt', eyes: 'spiral', brows: true },
  possessed: { sprout: 'horn', lids: [0.5, 0.52], tint: BOSS_TINT },
}

const MOOD_MOUTH = {
  deadpan: 'closed',
  confused: 'squiggle',
  notes: 'closed',
  thinking: 'hmm',
  aha: 'small',
  proud: 'grin',
  overwhelmed: 'wobble',
  possessed: 'smirk',
}


// Big black oval eye, two highlights, deadpan lid cut as a flat ink line.
function Eye({ e, lid = 0.35, look = [0, 0], scale = 1, ink, tint, sparkle, ring, uid }) {
  const cx = e.cx + look[0]
  const cy = e.cy + look[1]
  const rx = e.rx * scale
  const ry = e.ry * scale
  const ly = cy - ry + 2 * ry * lid
  const chord = lid > 0.02 ? rx * Math.sqrt(Math.max(0, 1 - ((ly - cy) / ry) ** 2)) + 2.5 : 0
  const hy = Math.max(cy - ry * 0.45, ly + rx * 0.42)
  return (
    <g>
      <clipPath id={uid}>
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} />
      </clipPath>
      <clipPath id={`${uid}l`}>
        <rect x={cx - rx - 6} y={lid > 0.02 ? ly : cy - ry - 6} width={2 * rx + 12} height={2 * ry + 12} />
      </clipPath>
      {ring && <ellipse cx={cx} cy={cy + 1} rx={rx + 4} ry={ry + 4} fill="#EEF0F3" />}
      {tint && (
        <g className="pip2d-glow">
          <ellipse cx={cx} cy={cy} rx={rx + 8} ry={ry + 8} fill={tint} opacity="0.18" />
          <ellipse cx={cx} cy={cy} rx={rx + 3.5} ry={ry + 3.5} fill={tint} opacity="0.3" />
        </g>
      )}
      <g clipPath={`url(#${uid}l)`}>
        <g clipPath={`url(#${uid})`}>
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={tint ? '#2A0E12' : EYE} />
          {tint && <ellipse cx={cx} cy={cy + ry * 0.25} rx={rx * 0.62} ry={ry * 0.45} fill={tint} />}
          <circle cx={cx - rx * 0.32} cy={hy} r={rx * 0.34} fill="#fff" />
          <Glint x={cx + rx * 0.34} y={cy + ry * 0.42} r={rx * (sparkle ? 0.34 : 0.28)} />
        </g>
      </g>
      {lid > 0.02 && <line x1={cx - chord} y1={ly} x2={cx + chord} y2={ly} stroke={ink} strokeWidth={Math.max(3, rx * 0.28)} strokeLinecap="round" />}
    </g>
  )
}

function ArcEye({ e, ink }) {
  const w = e.rx * 0.95
  return <path d={`M${e.cx - w},${e.cy + w * 0.35} Q${e.cx},${e.cy - w} ${e.cx + w},${e.cy + w * 0.35}`} fill="none" stroke={ink} strokeWidth={Math.max(4, e.rx * 0.36)} strokeLinecap="round" />
}

function SpiralEye({ e, ink }) {
  const { cx, cy } = e
  const r = Math.max(e.rx, e.ry) * 0.85
  const k = r / 17
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#fff" stroke={ink} strokeWidth="3.4" />
      <path
        d={`M${cx},${cy} m${-1.5 * k},0 a${1.5 * k},${1.5 * k} 0 1,1 ${3 * k},0 a${4.5 * k},${4.5 * k} 0 1,1 ${-9 * k},0 a${7.5 * k},${7.5 * k} 0 1,1 ${15 * k},0 a${10.5 * k},${10.5 * k} 0 1,1 ${-21 * k},0`}
        fill="none"
        stroke={ink}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </g>
  )
}

function ThinkingDots({ eyes, ink }) {
  const [L, R] = eyes
  const y = (L.cy + R.cy) / 2
  const r = Math.max(5, L.rx * 0.45)
  return (
    <g>
      {[0.12, 0.5, 0.88].map((k) => (
        <circle key={k} className="pip2d-dot" cx={L.cx + (R.cx - L.cx) * k} cy={y} r={r} fill={ink} />
      ))}
    </g>
  )
}

// Mouth shapes around anchor (x, y) with scale s (stroke weights stay constant).
function Mouth({ shape, ink, a, ugly }) {
  const { x, y } = a
  const s = a.s ?? 1
  const P = (dx, dy) => `${x + dx * s},${y + dy * s}`
  let el
  switch (shape) {
    case 'small':
      el = <ellipse cx={x} cy={y} rx={7 * s} ry={4.5 * Math.sqrt(s)} fill={MOUTH} stroke={ink} strokeWidth="3" />
      break
    case 'wide':
      el = (
        <g>
          <path d={`M${P(-15, -5)} Q${P(0, -7)} ${P(15, -5)} Q${P(13, 12)} ${P(0, 12)} Q${P(-13, 12)} ${P(-15, -5)} Z`} fill={MOUTH} stroke={ink} strokeWidth="3.4" strokeLinejoin="round" />
          <ellipse cx={x + s} cy={y + 7 * s} rx={7 * s} ry={3.5 * s} fill={TONGUE} />
        </g>
      )
      break
    case 'o':
      el = <ellipse cx={x} cy={y + 1} rx={7.5 * Math.sqrt(s)} ry={9.5 * Math.sqrt(s)} fill={MOUTH} stroke={ink} strokeWidth="3.4" />
      break
    case 'squiggle':
      el = <path d={`M${P(-13, 0)} Q${P(-9.5, -5)} ${P(-6, 0)} T${P(1, 0)} T${P(8, 0)} T${P(14, 0)}`} fill="none" stroke={ink} strokeWidth="3.6" strokeLinecap="round" />
      break
    case 'hmm':
      el = <path d={`M${P(-2, 1)} L${P(11, -2)}`} stroke={ink} strokeWidth="3.8" strokeLinecap="round" />
      break
    case 'grin':
      el = (
        <g>
          <path d={`M${P(-17, -6)} Q${P(0, -3)} ${P(17, -7)} Q${P(14, 13)} ${P(0, 13)} Q${P(-15, 13)} ${P(-17, -6)} Z`} fill={MOUTH} stroke={ink} strokeWidth="3.4" strokeLinejoin="round" />
          <ellipse cx={x + 2 * s} cy={y + 8 * s} rx={8 * s} ry={4 * s} fill={TONGUE} />
        </g>
      )
      break
    case 'wobble':
      el = <path d={`M${P(-14, 2)} L${P(-9, -2)} L${P(-4, 2)} L${P(1, -2)} L${P(6, 2)} L${P(11, -2)}`} fill="none" stroke={ink} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      break
    case 'smirk':
      el = <path d={`M${P(-13, -1)} Q${P(-2, 6)} ${P(13, -6)}`} fill="none" stroke={ink} strokeWidth="3.8" strokeLinecap="round" />
      break
    default:
      // closed: deadpan line (wide creatures get a longer, slightly curved line)
      el = a.wideLine ? (
        <path d={`M${P(-12, -1)} Q${P(0, 2.5)} ${P(12, -1.5)}`} fill="none" stroke={ink} strokeWidth="4" strokeLinecap="round" />
      ) : (
        <path d={`M${P(-8, 0)} L${P(8, 0.6)}`} stroke={ink} strokeWidth="4" strokeLinecap="round" />
      )
  }
  return (
    <g>
      {el}
      {ugly && <path d={`M${x + 4},${y - 1} L${x + 11},${y - 1} L${x + 8.5},${y + 7} Z`} fill="#FFFDF5" stroke={ink} strokeWidth="2.2" strokeLinejoin="round" />}
    </g>
  )
}

function talkShape(mouth) {
  if (mouth < 0.06) return null
  if (mouth < 0.35) return 'small'
  if (mouth < 0.7) return 'wide'
  return 'o'
}

function Sprout({ pose, anchor, t, flower, tint, gid }) {
  const sp = SPROUTS[pose] ?? SPROUTS.droop
  const col = tint ?? (anchor.yuzu ? '#7CC46A' : t.body)
  const [tx, ty] = sp.tip
  const bulb = pose === 'bulb' || pose === 'crown'
  return (
    <g>
      {anchor.yuzu && (
        // the capybara's yuzu, balanced on its head
        <g>
          <circle cx={anchor.x} cy={anchor.y + 13} r="14" fill="#F6C344" stroke={t.ink} strokeWidth="3.6" />
          <path d={`M${anchor.x - 8},${anchor.y + 8} C${anchor.x - 6},${anchor.y + 4} ${anchor.x - 3},${anchor.y + 3} ${anchor.x},${anchor.y + 3}`} fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
          <circle cx={anchor.x + 5} cy={anchor.y + 17} r="1.4" fill="#D69A1E" />
          <Gel id={gid} x={anchor.x - 5} y={anchor.y + 7} r={4.5} />
          <circle cx={anchor.x - 3} cy={anchor.y + 20} r="1.4" fill="#D69A1E" />
        </g>
      )}
      <g transform={`translate(${anchor.x} ${anchor.y}) scale(${anchor.scale ?? 1}) translate(-100 -44)`}>
        {bulb && (
          <g>
            <circle className="pip2d-glow" cx={tx} cy={ty} r="25" fill="#FFF3A0" />
            {[[-26, -6], [-18, -22], [0, -29], [18, -22], [26, -6]].map(([dx, dy], i) => (
              <path key={i} d={`M${tx + dx * 0.72},${ty + dy * 0.72} L${tx + dx},${ty + dy}`} stroke="#F2B630" strokeWidth="3.5" strokeLinecap="round" />
            ))}
          </g>
        )}
        <path d={sp.d} fill="none" stroke={t.ink} strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
        <path d={sp.d} fill="none" stroke={col} strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
        {pose === 'crown' && (
          <path d={`M${tx - 20},${ty + 8} L${tx - 22},${ty - 10} L${tx - 11},${ty - 2} L${tx},${ty - 22} L${tx + 11},${ty - 2} L${tx + 22},${ty - 10} L${tx + 20},${ty + 8} Z`} fill="#FFD25A" stroke={t.ink} strokeWidth="3.4" strokeLinejoin="round" />
        )}
        {bulb ? (
          <g>
            <rect x={tx - 7} y={ty + 9} width="14" height="8" rx="2" fill="#C9D2CF" stroke={t.ink} strokeWidth="3" />
            <circle cx={tx} cy={ty} r="13" fill="#FFE27A" stroke={t.ink} strokeWidth="3.6" />
            <path d={`M${tx - 4},${ty + 4} q4,-8 8,0`} fill="none" stroke="#E2A21B" strokeWidth="2.2" strokeLinecap="round" />
            <circle cx={tx - 4.5} cy={ty - 4.5} r="3" fill="#fff" />
          </g>
        ) : (
          pose !== 'question' && (
            <g>
              <ellipse cx={tx} cy={ty} rx="7.5" ry="5.5" transform={`rotate(-25 ${tx} ${ty})`} fill={col} stroke={t.ink} strokeWidth="3.4" />
              <Gel id={gid} x={tx - 2} y={ty - 1.5} r={2.6} />
            </g>
          )
        )}
        {flower && !bulb && (
          <g>
            {[0, 72, 144, 216, 288].map((deg) => (
              <circle key={deg} cx={tx + Math.cos((deg * Math.PI) / 180) * 5} cy={ty + Math.sin((deg * Math.PI) / 180) * 5} r="4" fill="#FFD3E8" stroke={t.ink} strokeWidth="1.4" />
            ))}
            <circle cx={tx} cy={ty} r="3" fill="#FFD25A" />
          </g>
        )}
      </g>
    </g>
  )
}

function Accessory({ type, t, A, id, hx0, hx1, visorY }) {
  const [L, R] = A.eyes
  if (type === 'starclips') return <StarClips id={id} A={A} t={t} />
  if (type === 'charm') return <Charm id={id} A={A} t={t} />
  if (type === 'visor') return <FrostVisor id={id} hx0={hx0} hx1={hx1} y={visorY} t={t} />
  if (type === 'shades') return <Shades id={id} A={A} t={t} />
  if (type === 'glasses') {
    const r = Math.max(L.rx, L.ry) + 8
    const hw = A.head.w / 2
    return (
      <g fill="none" stroke={t.ink} strokeWidth="3.6" strokeLinecap="round">
        {/* Y2K tinted oval lenses */}
        <ellipse cx={L.cx} cy={L.cy} rx={r * 1.12} ry={r * 0.86} fill={`url(#${id}lens)`} />
        <ellipse cx={R.cx} cy={R.cy} rx={r * 1.12} ry={r * 0.86} fill={`url(#${id}lens)`} />
        <path d={`M${L.cx - r * 0.6},${L.cy - r * 0.4} L${L.cx - r * 0.2},${L.cy - r * 0.62}`} stroke="#fff" strokeWidth="2.4" opacity="0.85" />
        <path d={`M${R.cx - r * 0.6},${R.cy - r * 0.4} L${R.cx - r * 0.2},${R.cy - r * 0.62}`} stroke="#fff" strokeWidth="2.4" opacity="0.85" />
        <path d={`M${L.cx + r * 1.12},${L.cy - 4} Q100,${L.cy - 9} ${R.cx - r * 1.12},${R.cy - 4}`} />
        <path d={`M${L.cx - r * 1.12},${L.cy - 3} L${A.head.cx - hw + 2},${L.cy - 9}`} />
        <path d={`M${R.cx + r * 1.12},${R.cy - 3} L${A.head.cx + hw - 2},${R.cy - 9}`} />
      </g>
    )
  }
  if (type === 'scarf') {
    const { y, x0, x1 } = A.neck
    return (
      <g>
        <path d={`M${x0},${y - 6} Q100,${y + 4} ${x1},${y - 7} L${x1 - 2},${y + 9} Q100,${y + 20} ${x0 + 2},${y + 10} Z`} fill="#F59B76" stroke={t.ink} strokeWidth="3.4" strokeLinejoin="round" />
        <path d={`M${x0 + 4},${y + 2} Q100,${y + 12} ${x1 - 4},${y + 1}`} fill="none" stroke="#FFF6EC" strokeWidth="3" />
        <g transform={`rotate(10 ${x1 - 26} ${y + 14})`}>
          <rect x={x1 - 34} y={y + 6} width="17" height="26" rx="4" fill="#F59B76" stroke={t.ink} strokeWidth="3.2" />
          <path d={`M${x1 - 33},${y + 22} L${x1 - 18},${y + 22}`} stroke="#FFF6EC" strokeWidth="2.6" />
        </g>
      </g>
    )
  }
  if (type === 'pencil') {
    const [px, py, rot] = A.pencil
    return (
      <g transform={`translate(${px} ${py}) rotate(${rot})`}>
        <rect x="-5" y="-26" width="10" height="44" rx="1.5" fill="#F7C948" stroke={t.ink} strokeWidth="3" />
        <path d="M-5,18 L0,30 L5,18 Z" fill="#F2D3B1" stroke={t.ink} strokeWidth="3" strokeLinejoin="round" />
        <rect x="-5" y="-32" width="10" height="6" fill="#C9D2CF" stroke={t.ink} strokeWidth="2.6" />
        <rect x="-5" y="-40" width="10" height="8" rx="3" fill="#F29B9B" stroke={t.ink} strokeWidth="2.6" />
      </g>
    )
  }
  if (type === 'badge') {
    const [bx, by] = A.badge
    return (
      <g>
        {/* chrome-rimmed holographic sticker */}
        <g transform={`translate(${bx} ${by}) scale(1.3) translate(${-bx} ${-by})`}>
        <circle cx={bx} cy={by} r="14" fill={`url(#${id}chrome)`} stroke={t.ink} strokeWidth="2.8" />
        <circle cx={bx} cy={by} r="10.5" fill={`url(#${id}holo)`} />
        <path d={starPath(bx, by - 1, 5.5)} fill="#fff" opacity="0.9" />
        <text x={bx} y={by + 9} textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="900" fontSize="6.5" fill={t.ink}>
          v2
        </text>
        <Gel id={id} x={bx - 5} y={by - 6} r={3} />
        </g>
      </g>
    )
  }
  if (type === 'backpack') {
    return (
      <g fill="none" strokeLinecap="round">
        {A.straps.map((d, i) => (
          <g key={i}>
            <path d={d} stroke={t.ink} strokeWidth="9" />
            <path d={d} stroke="#E0784F" strokeWidth="4.5" />
          </g>
        ))}
      </g>
    )
  }
  return null
}

function BackpackBehind({ t, A }) {
  const { x0, x1, y } = A.neck
  return <rect x={x0 - 12} y={y - 30} width={x1 - x0 + 24} height={204 - (y - 30)} rx="28" fill="#F59B76" stroke={t.ink} strokeWidth="4" />
}

function Notebook({ t, A }) {
  const [hx, hy] = A.hands[1]
  return (
    <g transform={`rotate(-10 ${hx} ${hy})`}>
      <rect x={hx - 16} y={hy - 34} width="28" height="34" rx="3" fill="#FFFDF5" stroke={t.ink} strokeWidth="3.2" />
      <path d={`M${hx - 11},${hy - 24} L${hx + 7},${hy - 24} M${hx - 11},${hy - 17} L${hx + 7},${hy - 17} M${hx - 11},${hy - 10} L${hx + 1},${hy - 10}`} stroke={t.ink} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <circle cx={hx - 2} cy={hy - 2} r="8" fill={t.body} stroke={t.ink} strokeWidth="3.2" />
    </g>
  )
}

function SweatDrop({ at }) {
  const [x, y] = at
  return (
    <path className="pip2d-sweat" d={`M${x},${y} C${x + 6},${y + 10} ${x + 8},${y + 17} ${x},${y + 21} C${x - 8},${y + 17} ${x - 6},${y + 10} ${x},${y} Z`} fill="#9EDCF5" stroke="#2F6C86" strokeWidth="3" strokeLinejoin="round" />
  )
}

function useBlink(enabled) {
  const [blink, setBlink] = useState(false)
  useEffect(() => {
    if (!enabled) return
    let t1
    let t2
    const loop = () => {
      t1 = setTimeout(() => {
        setBlink(true)
        t2 = setTimeout(() => {
          setBlink(false)
          loop()
        }, 90)
      }, 3000 + Math.random() * 2000)
    }
    loop()
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [enabled])
  return blink
}

function useHop(mood, enabled) {
  const [hop, setHop] = useState(false)
  const first = useRef(true)
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    if (!enabled) return
    setHop(true)
    const id = setTimeout(() => setHop(false), 430)
    return () => clearTimeout(id)
  }, [mood, enabled])
  return hop
}

export function Pip2D({
  creature = 'capybara',
  vibe = 'cute',
  mood = 'deadpan',
  mouth = 0,
  viseme,
  accessory = 'none',
  form = 'base',
  size = 160,
  animate = true,
  depth = false,
  tilt,
  holo = false,
  className = '',
  title,
}) {
  const def = CREATURE_DEFS[creature] ?? CREATURE_DEFS.capybara
  const A = def.anchors
  const m = MOOD_ALIASES[mood] ?? mood
  const spec = MOOD_SPEC[m] ?? MOOD_SPEC.deadpan
  const t0 = def.tokens[vibe] ?? def.tokens.cute
  // softer, warmer ink: pulled a little toward the body colour
  const t = { ...t0, ink: mix(t0.ink, t0.body, 0.2) }
  const cute = vibe === 'cute'
  const cool = vibe === 'cool'
  const ugly = vibe === 'ugly'
  const awakened = form === 'awakened'
  // vibe defaults when no accessory is chosen: cute = star clips, cool = frosted visor
  const acc = accessory === 'none' ? (cute ? 'starclips' : cool ? 'visor' : 'none') : accessory
  const id = useId().replace(/:/g, '')
  const blink = useBlink(animate)
  const hop = useHop(m, animate)
  const [L, R] = A.eyes

  // eyes: cool = permanent ~60% lid; ugly = tired (heavier lids + bags)
  const lids = (spec.lids ?? [0.35, 0.37]).map((l) => {
    const v = ugly ? Math.min(0.6, l + 0.15) : l
    return cool ? Math.max(v, 0.6) : v
  })
  const sizes = spec.scale ?? [1, 1]
  const plainEyes = !['arcs', 'spiral', 'dots'].includes(spec.eyes)
  let eyes
  if (spec.eyes === 'arcs') eyes = A.eyes.map((e, i) => <ArcEye key={i} e={e} ink={t.ink} />)
  else if (spec.eyes === 'spiral') eyes = A.eyes.map((e, i) => <SpiralEye key={i} e={e} ink={t.ink} />)
  else if (spec.eyes === 'dots') eyes = <ThinkingDots eyes={A.eyes} ink={t.ink} />
  else if (spec.eyes === 'round')
    eyes = A.eyes.map((e, i) => {
      const r = Math.max(e.rx, e.ry) * 1.02
      return <Eye key={i} e={{ ...e, rx: r, ry: r * 1.05 }} lid={cool ? 0.6 : 0} ink={t.ink} sparkle ring={e.ring} uid={`${id}e${i}`} />
    })
  else
    eyes = A.eyes.map((e, i) => (
      <Eye key={i} e={e} lid={lids[i]} look={spec.look} scale={sizes[i]} ink={t.ink} tint={spec.tint} sparkle={cute} ring={e.ring} uid={`${id}e${i}`} />
    ))

  const mouthShape = viseme ?? talkShape(mouth) ?? MOOD_MOUTH[m]
  const visorY = A.visorY ?? Math.min(L.cy - L.ry, R.cy - R.ry) - 12
  const hx0 = A.head.cx - A.head.w / 2 + 2
  const hx1 = A.head.cx + A.head.w / 2 - 2

  const defs = (
    <defs>
      <filter id={`${id}soft`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" />
      </filter>
      <pattern id={`${id}speck`} width="16" height="16" patternUnits="userSpaceOnUse">
        <circle cx="3" cy="4" r="1.3" fill="#fff" opacity="0.35" />
        <circle cx="11" cy="9" r="1" fill="#000" opacity="0.12" />
        <circle cx="7" cy="14" r="0.9" fill="#fff" opacity="0.25" />
      </pattern>
      <Y2KDefs id={id} />
      {cool && (
        <filter id={`${id}neon`} x="-10%" y="-10%" width="120%" height="120%">
          <feMorphology in="SourceAlpha" operator="dilate" radius="2.2" result="d" />
          <feFlood floodColor={t.neon} />
          <feComposite in2="d" operator="in" result="o" />
          <feMerge>
            <feMergeNode in="o" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      )}
    </defs>
  )
  const split = depth && def.split
  const back = (
    <>
      {awakened && (
        <g className="pip2d-glow">
          <ellipse cx="100" cy="128" rx="94" ry="98" fill="none" stroke="#FFE27A" strokeWidth="5" opacity="0.7" />
          <ellipse cx="100" cy="128" rx="86" ry="90" fill="none" stroke="#C9FCFC" strokeWidth="2.5" opacity="0.8" />
        </g>
      )}
      {acc === 'backpack' && <BackpackBehind t={t} A={A} />}
      {split && (
        <g>
          <def.Art t={t} id={`${id}k`} part="back" />
        </g>
      )}
    </>
  )
  const rimKind = holo ? 'holo' : cool ? 'chrome' : null
  const body = (
    <>
      <def.Art t={t} id={id} part={split ? 'body' : 'all'} />
      {rimKind && <RimLight id={id} kind={rimKind} Art={def.Art} t={t} split={split} />}
    </>
  )
  const face = (
    <>
      {cute && (
        <g fill={BLUSH} opacity="0.55">
          {A.blush.map(([x, y], i) => (
            <ellipse key={i} cx={x} cy={y} rx="10.5" ry="6.5" />
          ))}
        </g>
      )}
      {cute && A.blush.map(([x, y], i) => <circle key={`bg${i}`} cx={x - 4} cy={y - 2} r="1.8" fill="#fff" opacity="0.85" />)}
      {A.nose && <Gel id={id} x={A.nose[0] - 2} y={A.nose[1] - 1.5} r={2.6} />}
      {ugly && plainEyes && (
        <g fill="none" stroke={t.ink} strokeWidth="2.6" strokeLinecap="round" opacity="0.55">
          {A.eyes.map((e, i) => (
            <path key={i} d={`M${e.cx - e.rx * 0.8},${e.cy + e.ry + 4} Q${e.cx},${e.cy + e.ry + 10} ${e.cx + e.rx * 0.8},${e.cy + e.ry + 4}`} />
          ))}
        </g>
      )}
      {spec.brows && (
        <g stroke={t.ink} strokeWidth="3.6" strokeLinecap="round">
          <path d={`M${L.cx - L.rx * 0.8},${L.cy - L.ry - 9} L${L.cx + L.rx * 0.6},${L.cy - L.ry - 15}`} />
          <path d={`M${R.cx - R.rx * 0.6},${R.cy - R.ry - 14} L${R.cx + R.rx * 0.8},${R.cy - R.ry - 8}`} />
        </g>
      )}
      <g className={`pip2d-eyes${blink && plainEyes ? ' is-blinking' : ''}`}>{eyes}</g>
      <Mouth shape={mouthShape} ink={t.ink} a={A.mouth} ugly={ugly} />
    </>
  )
  const sprout = (
    <>
      <Sprout pose={awakened ? 'crown' : spec.sprout} anchor={A.sprout} t={t} flower={false} tint={m === 'possessed' ? BOSS_TINT : undefined} gid={id} />
      {(m === 'aha' || m === 'proud') && <Sparkles A={A} />}
    </>
  )

  const front = (
    <>
      {m === 'notes' && <Notebook t={t} A={A} />}
      {m === 'overwhelmed' && <SweatDrop at={A.sweat} />}
      {ugly && <HoloBandAid A={A} t={t} id={id} />}
      {ugly && acc !== 'starclips' && <StarClips id={id} A={A} t={t} bent />}
      <Accessory type={acc} t={t} A={A} id={id} hx0={hx0} hx1={hx1} visorY={visorY} />
    </>
  )
  const label = title ?? `Pip the ${def.name} looks ${m}`
  const wrap = (children, key, extra) => (
    <svg key={key} className={`pip2d ${className}`} width={size} height={size * 1.1} viewBox="0 0 200 220" role={key ? undefined : 'img'} aria-label={key ? undefined : label} aria-hidden={key ? true : undefined} {...extra}>
      <g className={hop ? 'pip2d-hop' : undefined}>
        <g className={animate ? 'pip2d-breathe' : undefined}>{children}</g>
      </g>
    </svg>
  )

  if (!depth) {
    return wrap(
      <>
        {defs}
        {back}
        {body}
        {sprout}
        {face}
        {front}
      </>,
    )
  }

  // 2.5D: the same character split into parallax layers inside a CSS-perspective wrapper
  const sheen = (
    <>
      <defs>
        <filter id={`${id}white`}>
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0" />
        </filter>
        <linearGradient id={`${id}sheenG`} x1="0" x2="1" y1="0" y2="0.35">
          <stop offset="0.3" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.32" />
          <stop offset="0.7" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${id}sheenM`} maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="220">
          <g filter={`url(#${id}white)`}>
            <def.Art t={t} id={`${id}m`} part={split ? 'body' : 'all'} />
          </g>
        </mask>
      </defs>
      <g mask={`url(#${id}sheenM)`}>
        <rect className="pip2d-sheen" x="-60" y="0" width="320" height="220" fill={`url(#${id}sheenG)`} />
      </g>
    </>
  )
  const k = size / 200
  return (
    <DepthStage size={size} tilt={tilt} label={label}>
      {[
        [-16 * k, wrap(<>{defs}{back}</>, 'back')],
        [0, wrap(<>{defs}{body}{sheen}</>, 'body')],
        [12 * k, wrap(face, 'face')],
        [24 * k, wrap(<>{sprout}{front}</>, 'front')],
      ]}
    </DepthStage>
  )
}

function prefersReduced() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

// CSS-only 3D-toy feel: perspective + tilt (pointer / device tilt / slow idle sway), parallax layers,
// a ground shadow that slides opposite the tilt, and a sheen that slides across the fur.
function DepthStage({ size, tilt, label, children }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const set = (rx, ry) => {
      el.style.setProperty('--rx', `${rx.toFixed(2)}deg`)
      el.style.setProperty('--ry', `${ry.toFixed(2)}deg`)
      el.style.setProperty('--tx', `${(-ry * 0.9).toFixed(1)}px`)
      el.style.setProperty('--sheen', `${(ry * 6).toFixed(1)}px`)
    }
    if (tilt) {
      set(tilt[0], tilt[1])
      return
    }
    if (prefersReduced()) {
      set(0, 6)
      return
    }
    let raf
    let last = -1e9
    let target = [0, 0]
    let cur = [0, 0]
    const onMove = (e) => {
      const r = el.getBoundingClientRect()
      const nx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width * 1.5)))
      const ny = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height * 1.5)))
      target = [-ny * 10, nx * 12]
      last = performance.now()
    }
    const onTilt = (e) => {
      if (e.gamma == null) return
      target = [Math.max(-10, Math.min(10, (e.beta - 45) * 0.3)), Math.max(-12, Math.min(12, e.gamma * 0.4))]
      last = performance.now()
    }
    const loop = (now) => {
      raf = requestAnimationFrame(loop)
      if (now - last > 1600) {
        const s = now / 1000
        target = [Math.sin(s * 0.5) * 3, Math.sin(s * 0.7) * 9]
      }
      cur = [cur[0] + (target[0] - cur[0]) * 0.12, cur[1] + (target[1] - cur[1]) * 0.12]
      set(cur[0], cur[1])
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('deviceorientation', onTilt)
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('deviceorientation', onTilt)
    }
  }, [tilt])
  return (
    <div ref={ref} className="pip2d-depth" role="img" aria-label={label} style={{ width: size, height: size * 1.1, '--size': `${size}px` }}>
      <div className="pip2d-depth-shadow" />
      <div className="pip2d-depth-tilt">
        {children.map(([z, svg], i) => (
          <div key={i} className="pip2d-depth-layer" style={{ transform: `translateZ(${z}px)` }}>
            {svg}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Pip2D
