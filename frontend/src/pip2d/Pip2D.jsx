import { useEffect, useId, useRef, useState } from 'react'
import { BLUSH, BOSS_TINT, EYE, MOOD_ALIASES, MOUTH, TONGUE } from './tokens'
import { CREATURE_DEFS } from './creatures'
import { mix, Shape, FinishCtx } from './shapes'
import { ellipsePoints } from './fuzz'
import { HalfPinArt, FixedStarArt } from './earned'
import { ClubDefs, ClubAccessory, CLUB_ACCESSORIES } from './club'
import { Hood, Jacket, VisorGlow, MiniSprout, Patches, Stickers } from './evolve'
import { MainDefs, Backlight, WindTufts, LowShades, SlowSparkle, HeroBack, HeroFront, HERO_LIFT, MainHead, OldHeadMask, mainHeadFirst, BrowShelf } from './main'
import { ACCESSORIES_2D, Y2KDefs, Gel, Glint, Sparkles, StarClips, Charm, FrostVisor, Shades, HoloBandAid, RimLight, starPath } from './y2k'

export const ACCESSORIES_ALL = [...ACCESSORIES_2D, ...CLUB_ACCESSORIES]
export { ACCESSORIES_2D, CLUB_ACCESSORIES }
export const POSES = ['idle', 'strut', 'pose', 'spin']
export { Sticker2D, ComebackFrame, EARNED_ITEMS } from './earned'
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

const STRUT = [
  { r: -6, x: -6, y: 0, sx: 1.03, sy: 0.97 },
  { r: 0, x: 0, y: -8, sx: 0.98, sy: 1.03 },
  { r: 6, x: 6, y: 0, sx: 1.03, sy: 0.97 },
]
const POSE_END = { r: -8, x: -2, y: 0, sx: 1.02, sy: 1 }

// Each evolution step is visibly bigger (v2 = +8%, v3 = +15% over v1) while staying inside the viewBox.
const GROWTH = [0.9, 0.972, 1.035]
const MAIN_SCALE = 0.93

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
function Eye({ e, lid = 0.35, look = [0, 0], scale = 1, ink, tint, sparkle, ring, uid, matte }) {
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
          <circle cx={cx - rx * 0.32} cy={hy} r={rx * (matte ? 0.2 : 0.34)} fill="#fff" opacity={matte ? 0.85 : 1} />
          {!matte && <Glint x={cx + rx * 0.34} y={cy + ry * 0.42} r={rx * (sparkle ? 0.34 : 0.28)} />}
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

function Sprout({ pose, anchor, t, flower, tint, gid, grown, chrome }) {
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
        {grown && !bulb && (
          // v2: a second leaf on the stem + a small glowing bud
          <g>
            <ellipse cx="91" cy="33" rx="7.5" ry="4.5" transform="rotate(30 91 33)" fill={col} stroke={t.ink} strokeWidth="3" />
            <circle className="pip2d-glow" cx={tx + 6} cy={ty - 6} r="7" fill="#FFF3A0" />
            <circle cx={tx + 6} cy={ty - 6} r="3.6" fill="#FFD25A" stroke={t.ink} strokeWidth="2" />
          </g>
        )}
        {pose === 'crown' && (
          <path d={`M${tx - 20},${ty + 8} L${tx - 22},${ty - 10} L${tx - 11},${ty - 2} L${tx},${ty - 22} L${tx + 11},${ty - 2} L${tx + 22},${ty - 10} L${tx + 20},${ty + 8} Z`} fill={chrome ? `url(#${gid}chrome)` : '#FFD25A'} stroke={t.ink} strokeWidth="3.4" strokeLinejoin="round" />
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
  if (type === 'half_pin') return <HalfPinArt x={A.badge[0]} y={A.badge[1]} s={1.5} id={id} ink={t.ink} />
  if (type === 'fixed_it_star') return <FixedStarArt x={A.badge[0]} y={A.badge[1]} s={1.4} id={id} ink={t.ink} />
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

// v2 signature wearable: a glossy holo neckerchief/bandana with a star print.
function Bandana({ A, t, id }) {
  const { y, x0, x1 } = A.neck
  const l = x0 + 18
  const r = x1 - 18
  return (
    <g>
      <path d={`M${l},${y - 4} Q100,${y + 6} ${r},${y - 5}`} fill="none" stroke={t.ink} strokeWidth="10" strokeLinecap="round" />
      <path d={`M${l},${y - 4} Q100,${y + 6} ${r},${y - 5}`} fill="none" stroke={`url(#${id}holo)`} strokeWidth="6" strokeLinecap="round" />
      <path d={`M${100 - 22},${y + 1} L${100 + 22},${y + 1} L100,${y + 28} Z`} fill={`url(#${id}holo)`} stroke={t.ink} strokeWidth="3" strokeLinejoin="round" />
      <path d={starPath(100, y + 10, 6)} fill="#fff" opacity="0.9" />
      <path d={`M${100 - 14},${y + 4} L${100 - 4},${y + 4}`} stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity="0.85" />
    </g>
  )
}

// v3: a fluffy mantle across the shoulders, clearly visible from the front, with a star clasp.
function Mantle({ A, t, id, creature }) {
  const { y, x0, x1 } = A.neck
  return (
    <g>
      <Shape
        pts={ellipsePoints(100, y + 8, (x1 - x0) / 2 - 8, 14)}
        fur={{ key: `mantle2-${creature}`, seed: 61, amp: 3.2, spacing: 6.5, tuftChance: 0.4 }}
        fill="#EADCFF"
        shade="#C9B3F2"
        ink={t.ink}
        uid={`${id}mantle`}
      />
      <ellipse cx="100" cy={y + 9} rx={(x1 - x0) / 2 - 18} ry="7" fill={`url(#${id}holo)`} opacity="0.5" />
      <path d={starPath(100, y + 8, 8)} fill="#FFD25A" stroke={t.ink} strokeWidth="2.2" strokeLinejoin="round" />
      <Gel id={id} x={97} y={y + 4} r={2.4} />
    </g>
  )
}

// v3 "rare" colourway: a soft holo sheen over the whole body, masked to the silhouette.
function RareTint({ id, Art, t, split }) {
  return (
    <>
      <defs>
        <filter id={`${id}rw`}>
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0" />
        </filter>
        <mask id={`${id}rareM`} maskUnits="userSpaceOnUse" x="-20" y="-40" width="240" height="280">
          <g filter={`url(#${id}rw)`}>
            <Art t={t} id={`${id}rt`} part={split ? 'body' : 'all'} />
          </g>
        </mask>
      </defs>
      <rect x="-20" y="-40" width="240" height="280" fill={`url(#${id}holo)`} mask={`url(#${id}rareM)`} opacity="0.2" />
    </>
  )
}

export function Pip2D({
  creature = 'capybara',
  vibe = 'plain',
  mood = 'deadpan',
  mouth = 0,
  viseme,
  accessory,
  form = 'base',
  size = 160,
  animate = true,
  depth = false,
  tilt,
  holo = false,
  version,
  lighting = 'day',
  pose = 'idle',
  frame,
  mini = false,
  finish,
  colorway,
  className = '',
  title,
}) {
  const def = CREATURE_DEFS[creature] ?? CREATURE_DEFS.capybara
  const A = def.anchors
  const m = MOOD_ALIASES[mood] ?? mood
  const spec = MOOD_SPEC[m] ?? MOOD_SPEC.deadpan
  const club = lighting === 'club'
  // finish: designer-vinyl art toy by default for cool/ugly, plush for cute/plain
  const vinyl = (finish ?? (vibe === 'cool' || vibe === 'ugly' ? 'vinyl' : 'plush')) === 'vinyl'
  const base0 = def.tokens[vibe] ?? def.tokens.cute
  const desat = (c) => mix(c, '#8C8C8C', 0.16)
  const base =
    colorway === 'gunmetal'
      ? { ...base0, body: '#3B4049', shade: '#2A2E35', belly: '#5A616C', ink: '#0E1014', dark: '#22262C', inner: '#5A616C', mask: '#1A1D22', gill: '#2E333B', nose: '#5A616C' }
      : vinyl
        ? { ...base0, body: desat(base0.body), shade: desat(base0.shade), belly: desat(base0.belly) }
        : base0
  // club lighting: deeper, darker fur under magenta/cyan rim light
  const t0 = club
    ? { ...base, body: mix(base.body, '#1B1640', 0.3), shade: mix(base.shade, '#120E30', 0.42), belly: mix(base.belly, '#2A2250', 0.25), ink: mix(base.ink, '#0B0820', 0.3) }
    : base
  // softer, warmer ink: pulled a little toward the body colour
  const t = { ...t0, ink: mix(t0.ink, t0.body, 0.2) }
  const cute = vibe === 'cute'
  const cool = vibe === 'cool'
  const ugly = vibe === 'ugly'
  // evolution: v1 base, v2 grown, v3 awakened (form="awakened" is v3)
  // form="main": the secret "Main Character" final form (alternative to v3; same size as v3)
  const main = form === 'main'
  const ver = form === 'awakened' || main ? 3 : Math.max(1, Math.min(3, Number(version) || 1))
  const awakened = ver === 3 && !main
  const grown = ver >= 2 && !main
  // which glow-up path the evolution follows
  const evo = vibe === 'cool' ? 'cool' : vibe === 'ugly' ? 'ugly' : 'cute'
  // vibe defaults when no accessory is chosen: cute = star clips, cool = frosted visor
  // accessory may be a string or an array (backend allows up to 3): drop 'none'/invalid entries, dedupe, keep order.
  // An explicit 'none' means "no accessory" (no vibe default); the vibe default applies only when the prop is
  // undefined/null or an array that held nothing valid.
  const accRaw = accessory == null ? [] : Array.isArray(accessory) ? accessory : [accessory]
  const explicitNone = accRaw.includes('none')
  const accIn = [...new Set(accRaw.filter((a) => typeof a === 'string' && a && a !== 'none'))]
  const vibeDefault = cute ? 'starclips' : cool ? 'visor' : null
  const accList = accIn.length ? accIn : !explicitNone && vibeDefault ? [vibeDefault] : []
  const has = (a) => accList.includes(a)
  const id = useId().replace(/:/g, '')
  const blink = useBlink(animate)
  const hop = useHop(m, animate)
  const [L, R] = A.eyes

  // eyes: cool = permanent ~60% lid; ugly = tired (heavier lids + bags)
  const lids = (spec.lids ?? [0.35, 0.37]).map((l) => {
    const v = (ugly ? Math.min(0.6, l + 0.15) : l) - (awakened ? 0.1 : grown ? 0.05 : 0)
    if (main) return 0.42 // confident, half-lidded over the shades
    if (vinyl && !cool) return Math.min(0.6, Math.max(0, v) + 0.1)
    return Math.max(0, cool ? Math.max(v, 0.6) : v)
  })
  const sizes = (spec.scale ?? [1, 1]).map((k) => (mini ? k * 1.32 : vinyl ? k * 0.8 : k))
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
      <Eye key={i} e={e} lid={lids[i]} look={spec.look} scale={sizes[i]} ink={t.ink} tint={spec.tint} sparkle={!vinyl && (cute || grown)} matte={vinyl} ring={e.ring} uid={`${id}e${i}`} />
    ))

  const mouthShape = viseme ?? talkShape(mouth) ?? (main && (m === 'deadpan' || m === 'notes') ? 'smirk' : MOOD_MOUTH[m])
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
      <ClubDefs id={id} />
      {main && <MainDefs id={id} />}
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
      {main && <Backlight id={id} />}
      {main && <WindTufts A={A} t={t} />}
      {awakened && (
        <g className="pip2d-glow">
          <ellipse cx="100" cy="128" rx="94" ry="98" fill="none" stroke={evo === 'cool' ? '#FF3FD8' : evo === 'ugly' ? '#B9A2FF' : '#FFE27A'} strokeWidth="5" opacity="0.7" strokeDasharray={evo === 'ugly' ? '14 9' : undefined} />
          <ellipse cx="100" cy="128" rx="86" ry="90" fill="none" stroke={evo === 'cool' ? '#2FF3FF' : '#C9FCFC'} strokeWidth="2.5" opacity="0.8" />
        </g>
      )}
      {grown && evo === 'cool' && <Hood A={A} t={t} v3={awakened} />}
      {awakened && evo === 'cute' && (
        // v3: cape-like fluffy back tuft peeking out at the shoulders
        <Shape
          pts={ellipsePoints(100, A.neck.y + 4, (A.neck.x1 - A.neck.x0) / 2 + 16, 38)}
          fur={{ key: `cape-${def.name}`, seed: 77, amp: 3.6, spacing: 7, tuftChance: 0.35 }}
          fill={mix(t.body, '#ffffff', 0.25)}
          shade={t.shade}
          ink={t.ink}
          uid={`${id}cape`}
        />
      )}
      {grown && evo !== 'cool' && (
        // fluffier silhouette: extra fur tufts poking out at the cheeks
        <g>
          {[-1, 1].map((k, i) => (
            <Shape
              key={k}
              pts={ellipsePoints(A.head.cx + k * (A.head.w / 2 - 4), A.blush[i][1] + 4, 13, 11)}
              fur={{ key: `cheek-${def.name}-${k}`, seed: 90 + i, amp: 3, spacing: 6, tuftChance: 0.5 }}
              fill={t.body}
              shade={t.shade}
              ink={t.ink}
              uid={`${id}ck${i}`}
            />
          ))}
        </g>
      )}
      {has('backpack') && <BackpackBehind t={t} A={A} />}
      {split && (
        <g>
          <def.Art t={t} id={`${id}k`} part="back" />
        </g>
      )}
    </>
  )
  const rimKind = main ? 'gold' : club ? 'club' : holo ? 'holo' : cool ? 'chrome' : null
  const body = (
    <>
      <def.Art t={t} id={id} part={split ? 'body' : 'all'} />
      {rimKind && <RimLight id={id} kind={rimKind} Art={def.Art} t={t} split={split} />}
      {awakened && evo === 'cute' && <RareTint id={id} Art={def.Art} t={t} split={split} />}
    </>
  )
  const face = (
    <>
      {cute && !vinyl && (
        <g fill={BLUSH} opacity="0.55">
          {A.blush.map(([x, y], i) => (
            <ellipse key={i} cx={x} cy={y} rx="10.5" ry="6.5" />
          ))}
        </g>
      )}
      {cute && !vinyl && A.blush.map(([x, y], i) => <circle key={`bg${i}`} cx={x - 4} cy={y - 2} r="1.8" fill="#fff" opacity="0.85" />)}
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
      {main && plainEyes && <BrowShelf A={A} t={t} />}
      <Mouth shape={mouthShape} ink={t.ink} a={A.mouth} ugly={ugly} />
    </>
  )
  const sprout = (
    <>
      {grown && evo === 'ugly' && <MiniSprout A={A} t={t} />}
      {grown && evo !== 'cool' && (
        // v2+: a bigger head tuft around the sprout
        <g>
          {[-1, 1, 0].map((k) => (
            <ellipse key={k} cx={A.sprout.x + k * 10} cy={A.sprout.y + (A.sprout.yuzu ? 22 : 6) - (k === 0 ? 3 : 0)} rx="6" ry="10" transform={`rotate(${k * 35} ${A.sprout.x + k * 10} ${A.sprout.y + (A.sprout.yuzu ? 22 : 6)})`} fill={t.body} stroke={t.ink} strokeWidth="2.6" />
          ))}
        </g>
      )}
      <g transform={awakened && evo === 'ugly' ? `rotate(16 ${A.sprout.x} ${A.sprout.y + 10})` : undefined}>
        <Sprout pose={awakened || main ? 'crown' : spec.sprout} anchor={mini ? { ...A.sprout, scale: (A.sprout.scale ?? 1) * 0.62 } : A.sprout} t={t} flower={false} tint={m === 'possessed' ? BOSS_TINT : undefined} gid={id} grown={grown} chrome={evo === 'cool'} />
      </g>
      {(m === 'aha' || m === 'proud') && <Sparkles A={A} />}
    </>
  )

  const front = (
    <>
      {main && plainEyes && <LowShades A={A} t={t} id={id} />}
      {main && <SlowSparkle A={A} />}
      {m === 'notes' && <Notebook t={t} A={A} />}
      {m === 'overwhelmed' && <SweatDrop at={A.sweat} />}
      {grown && !awakened && evo === 'cute' && !has('scarf') && !has('puffer') && <Bandana A={A} t={t} id={id} />}
      {awakened && evo === 'cute' && !has('scarf') && !has('puffer') && <Mantle A={A} t={t} id={id} creature={def.name} />}
      {grown && evo === 'cool' && !has('scarf') && !has('puffer') && <Jacket A={A} t={t} id={id} v3={awakened} />}
      {grown && evo === 'cool' && accList.includes('visor') && <VisorGlow hx0={hx0} hx1={hx1} y={visorY} id={id} />}
      {grown && evo === 'ugly' && <Patches A={A} t={t} />}
      {grown && evo === 'ugly' && <Stickers A={A} t={t} id={id} n={awakened ? 5 : 3} />}
      {grown && evo === 'cute' && (
        // a tiny star on the cheek
        <Glint x={A.blush[1][0] + 4} y={A.blush[1][1] - 12} r={awakened ? 5.5 : 4.5} fill="#FFE27A" />
      )}
      {awakened && (
        // a small orbit of two stars around the crown
        <g className="pip2d-orbit" style={{ '--ox': `${A.sprout.x}px`, '--oy': `${A.sprout.y + 2}px` }}>
          <path d={starPath(A.sprout.x - 34, A.sprout.y + 6, 6)} fill={evo === 'cool' ? '#FF3FD8' : '#FFE27A'} stroke={t.ink} strokeWidth="1.8" strokeLinejoin="round" />
          <path d={starPath(A.sprout.x + 32, A.sprout.y - 6, 5)} fill={evo === 'cool' ? '#2FF3FF' : '#C9FCFC'} stroke={t.ink} strokeWidth="1.8" strokeLinejoin="round" />
        </g>
      )}
      {awakened && evo === 'cute' && (
        // v3: star-glint fur sheen
        <g>
          {[
            [A.blush[0][0] - 6, A.blush[0][1] + 24, 4.5],
            [A.blush[1][0] + 4, A.blush[1][1] + 30, 5.5],
            [A.head.cx + A.head.w * 0.36, A.head.top + 26, 4],
          ].map(([x, y, r], i) => (
            <Glint key={i} x={x} y={y} r={r} />
          ))}
        </g>
      )}
      {ugly && <HoloBandAid A={A} t={t} id={id} />}
      {ugly && !has('starclips') && <StarClips id={id} A={A} t={t} bent />}
      {accList.map((a) =>
        CLUB_ACCESSORIES.includes(a) ? (
          <ClubAccessory key={`acc-${a}`} type={a} id={id} A={A} t={t} />
        ) : (
          <Accessory key={`acc-${a}`} type={a} t={t} A={A} id={id} hx0={hx0} hx1={hx1} visorY={visorY} />
        ),
      )}
    </>
  )
  const label = title ?? `Pip the ${def.name} looks ${m}`
  // runway poses: strut (3-frame walk cycle), pose (confident end pose with a tilt), spin
  const P = pose === 'idle' && main ? { r: -2, x: 0, y: 0, sx: 1, sy: 1 } : pose === 'strut' ? STRUT[frame ?? 1] : pose === 'pose' ? POSE_END : pose === 'spin' ? { r: 0, x: 0, y: -2, sx: frame == null ? 1 : [1, 0.35, -1][frame % 3], sy: 1 } : null
  const animPose = animate && frame == null && (pose === 'strut' || pose === 'spin')
  const poseT = P && !animPose ? `translate(100 207) translate(${P.x} ${P.y}) rotate(${P.r}) scale(${P.sx} ${P.sy}) translate(-100 -207)` : undefined
  const poseClass = animPose ? `pip2d-${pose}` : undefined
  // vinyl proportions: same head, longer body/limbs (head ~45% of height instead of ~60%)
  const stretch = vinyl && !main && !mini
  const SK = 1.45
  const dy = (207 - A.neck.y) * (SK - 1)
  const stretched = (children, key) => (
    <>
      <defs>
        <clipPath id={`${id}vb${key ?? ''}`}>
          <rect x="-60" y={A.neck.y} width="320" height="120" />
        </clipPath>
        <clipPath id={`${id}vh${key ?? ''}`}>
          <rect x="-60" y="-80" width="320" height={A.neck.y + 80} />
        </clipPath>
      </defs>
      <g transform={`translate(100 207) scale(1 ${SK}) translate(-100 -207)`} clipPath={`url(#${id}vb${key ?? ''})`}>
        {children}
      </g>
      <g transform={`translate(0 ${-dy})`} clipPath={`url(#${id}vh${key ?? ''})`}>
        {children}
      </g>
    </>
  )
  const wrap = (children, key, extra) => (
    <svg key={key} className={`pip2d ${className}`} width={size} height={size * 1.1} viewBox="0 0 200 220" role={key ? undefined : 'img'} aria-label={key ? undefined : label} aria-hidden={key ? true : undefined} {...extra}>
      <g transform={`translate(100 207) scale(${(main ? MAIN_SCALE : GROWTH[ver - 1] * (mini ? 0.64 : 1)) * (stretch ? 0.82 : 1)} ${(main ? MAIN_SCALE : GROWTH[ver - 1] * (mini ? 0.58 : 1)) * (stretch ? 0.82 : 1)}) translate(-100 -207)`}>
        <g transform={poseT} className={poseClass}>
          <g transform={grown && evo === 'ugly' ? `translate(100 207) rotate(${awakened ? -5 : -3}) scale(${awakened ? 1.07 : 1.04} ${awakened ? 0.95 : 0.97}) translate(-100 -207)` : undefined}>
          <g className={hop ? 'pip2d-hop' : undefined}>
            <g className={animate && pose === 'idle' ? 'pip2d-breathe' : undefined}>
              <FinishCtx.Provider value={vinyl ? 'vinyl' : 'plush'}>{stretch ? stretched(children, key) : children}</FinishCtx.Provider>
            </g>
          </g>
          </g>
        </g>
      </g>
    </svg>
  )

  if (main) {
    // Main Character: same face on a re-boned head (jaw, cheekbones, brow shelf) on a heroic V-shaped body
    const lift = HERO_LIFT[def.name] ?? HERO_LIFT.default
    const y0 = A.neck.y - lift
    const clipY = A.neck.y + 6
    const up = `translate(0 ${-lift})`
    const headFirst = mainHeadFirst(def.name)
    const mainDefs = (
      <defs>
        <clipPath id={`${id}headClip`}>
          <rect x="-40" y="-60" width="280" height={clipY + 60} />
        </clipPath>
        <OldHeadMask creature={def.name} id={id} />
      </defs>
    )
    const art = (
      <g clipPath={`url(#${id}headClip)`}>
        <g mask={`url(#${id}oldHead)`}>
          <def.Art t={t} id={id} part="all" />
        </g>
      </g>
    )
    const headLayer = (
      <g transform={up}>
        <WindTufts A={A} t={t} />
        {headFirst && <MainHead creature={def.name} t={t} id={id} />}
        {art}
        {!headFirst && <MainHead creature={def.name} t={t} id={id} />}
      </g>
    )
    const backLayer = (
      <>
        <Backlight id={id} />
        <HeroBack creature={def.name} t={t} id={id} y0={y0} />
      </>
    )
    const faceLayer = <g transform={up}>{face}</g>
    const frontLayer = (
      <>
        <HeroFront creature={def.name} t={t} id={id} y0={y0} />
        <g transform={up}>
          {sprout}
          {front}
        </g>
      </>
    )
    if (!depth) {
      return wrap(
        <>
          {defs}
          {mainDefs}
          {backLayer}
          {headLayer}
          {faceLayer}
          {frontLayer}
        </>,
      )
    }
    const k2 = size / 200
    return (
      <DepthStage size={size} tilt={tilt} label={label}>
        {[
          [-16 * k2, wrap(<>{defs}{backLayer}</>, 'back')],
          [0, wrap(<>{defs}{mainDefs}{headLayer}</>, 'body')],
          [12 * k2, wrap(<>{defs}{faceLayer}</>, 'face')],
          [24 * k2, wrap(<>{defs}{frontLayer}</>, 'front')],
        ]}
      </DepthStage>
    )
  }

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
