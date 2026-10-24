import { useEffect, useId, useRef, useState } from 'react'
import { BLUSH, BOSS_TINT, EYE, MOOD_ALIASES, MOUTH, TONGUE, tokensFor } from './tokens'
import './pip2d.css'

// Pip as a flat, hand-inked 2D character. viewBox 200 x 220, no dependencies.
// One mochi/bean silhouette; the blob's one big feature is the "brain sprout" cowlick.

const BODY =
  'M100,41 C137,41 162,68 169,108 C177,154 168,203 100,203 C32,203 23,154 31,108 C38,68 63,41 100,41 Z'
// Face anchors (lower half of the body). A hair of asymmetry keeps it hand-made.
const EYE_L = { cx: 67, cy: 134, rx: 15, ry: 21 }
const EYE_R = { cx: 133, cy: 133, rx: 14.6, ry: 20.5 }
const MOUTH_C = { x: 101, y: 166 }

// Sprout (cowlick) paths per pose; tip = where a leaf / flower sits.
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
  confused: { sprout: 'question', lids: [0.08, 0.45], scale: [1.12, 0.94] },
  notes: { sprout: 'droop', lids: [0.5, 0.52], look: [0, 4] },
  thinking: { sprout: 'curl', eyes: 'dots' },
  aha: { sprout: 'bulb', eyes: 'round' },
  proud: { sprout: 'perky', eyes: 'arcs' },
  overwhelmed: { sprout: 'wilt', eyes: 'spiral' },
  possessed: { sprout: 'horn', lids: [0.5, 0.52], tint: BOSS_TINT },
}

function Eye({ e, lid = 0.35, look = [0, 0], scale = 1, ink, tint, sparkle, uid }) {
  const cx = e.cx + look[0]
  const cy = e.cy + look[1]
  const rx = e.rx * scale
  const ry = e.ry * scale
  const ly = cy - ry + 2 * ry * lid
  const chord = lid > 0.02 ? rx * Math.sqrt(Math.max(0, 1 - ((ly - cy) / ry) ** 2)) + 2.5 : 0
  const hy = Math.max(cy - ry * 0.45, ly + 6)
  return (
    <g>
      <clipPath id={uid}>
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} />
      </clipPath>
      {/* the lid is a cut, not a cover: no anti-aliased fringe above the lid line */}
      <clipPath id={`${uid}l`}>
        <rect x={cx - rx - 6} y={lid > 0.02 ? ly : cy - ry - 6} width={2 * rx + 12} height={2 * ry + 12} />
      </clipPath>
      {tint && (
        <g className="pip2d-glow">
          <ellipse cx={cx} cy={cy} rx={rx + 9} ry={ry + 9} fill={tint} opacity="0.18" />
          <ellipse cx={cx} cy={cy} rx={rx + 4} ry={ry + 4} fill={tint} opacity="0.3" />
        </g>
      )}
      <g clipPath={`url(#${uid}l)`}>
      <g clipPath={`url(#${uid})`}>
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={tint ? '#2A0E12' : EYE} />
        {tint && <ellipse cx={cx} cy={cy + ry * 0.25} rx={rx * 0.62} ry={ry * 0.45} fill={tint} />}
        <circle cx={cx - rx * 0.32} cy={hy} r={rx * 0.34} fill="#fff" />
        <circle cx={cx + rx * 0.36} cy={cy + ry * 0.48} r={rx * 0.16} fill="#fff" />
        {sparkle && <Star x={cx + rx * 0.3} y={hy + 2} r={rx * 0.28} />}
      </g>
      </g>
      {lid > 0.02 && <line x1={cx - chord} y1={ly} x2={cx + chord} y2={ly} stroke={ink} strokeWidth="4.2" strokeLinecap="round" />}
    </g>
  )
}

function Star({ x, y, r, fill = '#fff' }) {
  const s = r * 0.32
  return <path d={`M${x},${y - r} L${x + s},${y - s} L${x + r},${y} L${x + s},${y + s} L${x},${y + r} L${x - s},${y + s} L${x - r},${y} L${x - s},${y - s} Z`} fill={fill} />
}

function ArcEye({ e, ink }) {
  return <path d={`M${e.cx - 14},${e.cy + 5} Q${e.cx},${e.cy - 14} ${e.cx + 14},${e.cy + 5}`} fill="none" stroke={ink} strokeWidth="5.5" strokeLinecap="round" />
}

function SpiralEye({ e, ink }) {
  const { cx, cy } = e
  return (
    <g>
      <circle cx={cx} cy={cy} r="17" fill="#fff" stroke={ink} strokeWidth="3.5" />
      <path
        d={`M${cx},${cy} m-1.5,0 a1.5,1.5 0 1,1 3,0 a4.5,4.5 0 1,1 -9,0 a7.5,7.5 0 1,1 15,0 a10.5,10.5 0 1,1 -21,0`}
        fill="none"
        stroke={ink}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </g>
  )
}

function RoundEye({ e, lid, ink, uid }) {
  return <Eye e={{ ...e, rx: 17, ry: 18 }} lid={lid} ink={ink} sparkle uid={uid} />
}

function ThinkingDots({ ink }) {
  return (
    <g>
      {[76, 100, 124].map((x) => (
        <circle key={x} className="pip2d-dot" cx={x} cy={136} r="7" fill={ink} />
      ))}
    </g>
  )
}

// mouth shapes: talking visemes + mood mouths
function Mouth({ shape, ink, ugly }) {
  const { x, y } = MOUTH_C
  let el
  switch (shape) {
    case 'small':
      el = <ellipse cx={x} cy={y} rx="7" ry="4.5" fill={MOUTH} stroke={ink} strokeWidth="3" />
      break
    case 'wide':
      el = (
        <g>
          <path d={`M${x - 15},${y - 5} Q${x},${y - 7} ${x + 15},${y - 5} Q${x + 13},${y + 12} ${x},${y + 12} Q${x - 13},${y + 12} ${x - 15},${y - 5} Z`} fill={MOUTH} stroke={ink} strokeWidth="3.4" strokeLinejoin="round" />
          <ellipse cx={x + 1} cy={y + 7} rx="7" ry="3.5" fill={TONGUE} />
        </g>
      )
      break
    case 'o':
      el = <ellipse cx={x} cy={y + 1} rx="7.5" ry="9.5" fill={MOUTH} stroke={ink} strokeWidth="3.4" />
      break
    case 'squiggle':
      el = <path d={`M${x - 13},${y} q3.5,-5 7,0 t7,0 t7,0 t6,0`} fill="none" stroke={ink} strokeWidth="3.6" strokeLinecap="round" />
      break
    case 'hmm':
      el = <path d={`M${x - 2},${y + 1} L${x + 11},${y - 2}`} stroke={ink} strokeWidth="3.8" strokeLinecap="round" />
      break
    case 'grin':
      el = (
        <g>
          <path d={`M${x - 17},${y - 6} Q${x},${y - 3} ${x + 17},${y - 7} Q${x + 14},${y + 13} ${x},${y + 13} Q${x - 15},${y + 13} ${x - 17},${y - 6} Z`} fill={MOUTH} stroke={ink} strokeWidth="3.4" strokeLinejoin="round" />
          <ellipse cx={x + 2} cy={y + 8} rx="8" ry="4" fill={TONGUE} />
        </g>
      )
      break
    case 'wobble':
      el = <path d={`M${x - 14},${y + 2} l5,-4 l5,4 l5,-4 l5,4 l5,-4`} fill="none" stroke={ink} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      break
    case 'smirk':
      el = <path d={`M${x - 13},${y - 1} Q${x - 2},${y + 6} ${x + 13},${y - 6}`} fill="none" stroke={ink} strokeWidth="3.8" strokeLinecap="round" />
      break
    default: // closed / deadpan line
      el = <path d={`M${x - 8},${y} L${x + 8},${y + 0.6}`} stroke={ink} strokeWidth="4" strokeLinecap="round" />
  }
  return (
    <g>
      {el}
      {ugly && (
        // ONE snaggle tooth
        <path d={`M${x + 4},${y - 1} L${x + 11},${y - 1} L${x + 8.5},${y + 7} Z`} fill="#FFFDF5" stroke={ink} strokeWidth="2.2" strokeLinejoin="round" />
      )}
    </g>
  )
}

const MOOD_MOUTH = {
  deadpan: 'closed',
  confused: 'squiggle',
  notes: 'closed',
  thinking: 'hmm',
  aha: 'o-small',
  proud: 'grin',
  overwhelmed: 'wobble',
  possessed: 'smirk',
}

function talkShape(mouth) {
  if (mouth < 0.06) return null
  if (mouth < 0.35) return 'small'
  if (mouth < 0.7) return 'wide'
  return 'o'
}

function Sprout({ pose, t, flower, tint }) {
  const sp = SPROUTS[pose] ?? SPROUTS.droop
  const col = tint ?? t.body
  const [tx, ty] = sp.tip
  return (
    <g>
      {(pose === 'bulb' || pose === 'crown') && (
        <g>
          <circle className="pip2d-glow" cx={tx} cy={ty} r="25" fill="#FFF3A0" />
          {[[-26, -6], [-18, -22], [0, -29], [18, -22], [26, -6]].map(([dx, dy], i) => (
            <path key={i} d={`M${tx + dx * 0.72},${ty + dy * 0.72} L${tx + dx},${ty + dy}`} stroke="#F2B630" strokeWidth="3.5" strokeLinecap="round" />
          ))}
        </g>
      )}
      <path d={sp.d} fill="none" stroke={t.ink} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
      <path d={sp.d} fill="none" stroke={col} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      {pose === 'crown' && (
        // glowing bulb crown: three little points around the lit bulb
        <path d={`M${tx - 20},${ty + 8} L${tx - 22},${ty - 10} L${tx - 11},${ty - 2} L${tx},${ty - 22} L${tx + 11},${ty - 2} L${tx + 22},${ty - 10} L${tx + 20},${ty + 8} Z`} fill="#FFD25A" stroke={t.ink} strokeWidth="3.4" strokeLinejoin="round" />
      )}
      {pose === 'bulb' || pose === 'crown' ? (
        <g>
          <rect x={tx - 7} y={ty + 9} width="14" height="8" rx="2" fill="#C9D2CF" stroke={t.ink} strokeWidth="3" />
          <circle cx={tx} cy={ty} r="13" fill="#FFE27A" stroke={t.ink} strokeWidth="3.6" />
          <path d={`M${tx - 4},${ty + 4} q4,-8 8,0`} fill="none" stroke="#E2A21B" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx={tx - 4.5} cy={ty - 4.5} r="3" fill="#fff" />
        </g>
      ) : (
        pose !== 'question' && (
          <ellipse cx={tx} cy={ty} rx="7.5" ry="5.5" transform={`rotate(-25 ${tx} ${ty})`} fill={col} stroke={t.ink} strokeWidth="3.4" />
        )
      )}
      {flower && pose !== 'bulb' && pose !== 'crown' && (
        <g>
          {[0, 72, 144, 216, 288].map((a) => (
            <circle key={a} cx={tx + Math.cos((a * Math.PI) / 180) * 5} cy={ty + Math.sin((a * Math.PI) / 180) * 5} r="4" fill="#FFD3E8" stroke={t.ink} strokeWidth="1.4" />
          ))}
          <circle cx={tx} cy={ty} r="3" fill="#FFD25A" />
        </g>
      )}
    </g>
  )
}

function Accessory({ type, t, bodyClip }) {
  if (type === 'glasses') {
    return (
      <g fill="none" stroke={t.ink} strokeWidth="4" strokeLinecap="round">
        <circle cx={EYE_L.cx} cy={EYE_L.cy} r="23" fill="rgba(201,252,252,.16)" />
        <circle cx={EYE_R.cx} cy={EYE_R.cy} r="23" fill="rgba(201,252,252,.16)" />
        <path d="M90,128 Q100,123 110,128" />
        <path d="M44,130 L30,124" />
        <path d="M156,129 L170,123" />
      </g>
    )
  }
  if (type === 'scarf') {
    return (
      <g>
        <g clipPath={`url(#${bodyClip})`}>
          <path d="M20,178 Q100,190 180,176 L180,194 Q100,208 20,196 Z" fill="#F59B76" stroke={t.ink} strokeWidth="3.4" />
          <path d="M20,186 Q100,198 180,184" fill="none" stroke="#FFF6EC" strokeWidth="3" />
        </g>
        <g transform="rotate(10 140 190)">
          <rect x="132" y="186" width="17" height="24" rx="4" fill="#F59B76" stroke={t.ink} strokeWidth="3.2" />
          <path d="M133,202 L148,202" stroke="#FFF6EC" strokeWidth="2.6" />
        </g>
      </g>
    )
  }
  if (type === 'pencil') {
    return (
      <g transform="translate(150 66) rotate(38)">
        <rect x="-5" y="-26" width="10" height="44" rx="1.5" fill="#F7C948" stroke={t.ink} strokeWidth="3" />
        <path d="M-5,18 L0,30 L5,18 Z" fill="#F2D3B1" stroke={t.ink} strokeWidth="3" strokeLinejoin="round" />
        <rect x="-5" y="-32" width="10" height="6" fill="#C9D2CF" stroke={t.ink} strokeWidth="2.6" />
        <rect x="-5" y="-40" width="10" height="8" rx="3" fill="#F29B9B" stroke={t.ink} strokeWidth="2.6" />
      </g>
    )
  }
  if (type === 'badge') {
    return (
      <g>
        <circle cx="54" cy="176" r="12" fill="#C9FCFC" stroke={t.ink} strokeWidth="3.2" />
        <text x="54" y="180" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="800" fontSize="10" fill={t.ink}>
          v2
        </text>
      </g>
    )
  }
  if (type === 'backpack') {
    return (
      <g fill="none" strokeLinecap="round">
        <path d="M66,60 C56,90 52,120 56,160" stroke={t.ink} strokeWidth="9" />
        <path d="M66,60 C56,90 52,120 56,160" stroke="#E0784F" strokeWidth="4.5" />
        <path d="M134,60 C144,90 148,120 144,160" stroke={t.ink} strokeWidth="9" />
        <path d="M134,60 C144,90 148,120 144,160" stroke="#E0784F" strokeWidth="4.5" />
      </g>
    )
  }
  return null
}

// Backpack body peeks out behind Pip (drawn before the body).
function BackpackBehind({ t }) {
  return <rect x="16" y="92" width="168" height="96" rx="30" fill="#F59B76" stroke={t.ink} strokeWidth="4" />
}

function Notebook({ t }) {
  return (
    <g transform="translate(8 12) rotate(-10 152 168)">
      <rect x="138" y="150" width="28" height="34" rx="3" fill="#FFFDF5" stroke={t.ink} strokeWidth="3.2" />
      <path d="M143,160 L161,160 M143,167 L161,167 M143,174 L155,174" stroke={t.ink} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <circle cx="140" cy="182" r="9" fill={t.body} stroke={t.ink} strokeWidth="3.4" />
    </g>
  )
}

function SweatDrop() {
  return (
    <path className="pip2d-sweat" d="M163,70 C169,80 171,87 163,91 C155,87 157,80 163,70 Z" fill="#9EDCF5" stroke="#2F6C86" strokeWidth="3" strokeLinejoin="round" />
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
  creature = 'blob',
  vibe = 'cute',
  mood = 'deadpan',
  mouth = 0,
  viseme,
  accessory = 'none',
  form = 'base',
  size = 160,
  animate = true,
  className = '',
  title,
}) {
  const m = MOOD_ALIASES[mood] ?? mood
  const spec = MOOD_SPEC[m] ?? MOOD_SPEC.deadpan
  const t = tokensFor(creature, vibe)
  const cute = vibe === 'cute'
  const cool = vibe === 'cool'
  const ugly = vibe === 'ugly'
  const id = useId().replace(/:/g, '')
  const blink = useBlink(animate)
  const hop = useHop(m, animate)
  // ugly-cute = soft body + ONE off detail (snaggle tooth) + tired eyes; never a pile of flaws
  const body = BODY
  const awakened = form === 'awakened'
  const inkW = awakened ? 1.2 : 0

  // eyes
  const coolLid = (l) => (cool ? Math.max(l, 0.6) : l)
  const sizes = spec.scale ?? [1, 1]
  const lids = (spec.lids ?? [0.35, 0.37]).map((l) => coolLid(ugly ? Math.min(0.6, l + 0.15) : l))
  let eyes
  if (spec.eyes === 'arcs') eyes = [<ArcEye key="l" e={EYE_L} ink={t.ink} />, <ArcEye key="r" e={EYE_R} ink={t.ink} />]
  else if (spec.eyes === 'spiral') eyes = [<SpiralEye key="l" e={EYE_L} ink={t.ink} />, <SpiralEye key="r" e={EYE_R} ink={t.ink} />]
  else if (spec.eyes === 'dots') eyes = [<ThinkingDots key="d" ink={t.ink} />]
  else if (spec.eyes === 'round')
    eyes = [EYE_L, EYE_R].map((e, i) => (
      <RoundEye key={i} e={{ ...e, cx: e.cx + (i ? -1 : 1) }} lid={cool ? 0.6 : 0} ink={t.ink} uid={`${id}e${i}`} />
    ))
  else
    eyes = [EYE_L, EYE_R].map((e, i) => (
      <Eye
        key={i}
        e={e}
        lid={lids[i]}
        look={spec.look}
        scale={sizes[i]}
        ink={t.ink}
        tint={spec.tint}
        sparkle={cute}
        uid={`${id}e${i}`}
      />
    ))

  // mouth: viseme wins, then talking amplitude, then the mood's mouth
  let mouthShape = viseme ?? talkShape(mouth) ?? MOOD_MOUTH[m]
  if (mouthShape === 'o-small') mouthShape = 'small'

  return (
    <svg
      className={`pip2d ${className}`}
      width={size}
      height={size * 1.1}
      viewBox="0 0 200 220"
      role="img"
      aria-label={title ?? `Pip looks ${m}`}
    >
      <defs>
        <clipPath id={`${id}body`}>
          <path d={body} />
        </clipPath>
      </defs>
      <g className={hop ? 'pip2d-hop' : undefined}>
        <g className={animate ? 'pip2d-breathe' : undefined}>
          {awakened && (
            // Brain v2+ aura ring
            <g className="pip2d-glow">
              <ellipse cx="100" cy="128" rx="92" ry="98" fill="none" stroke="#FFE27A" strokeWidth="5" opacity="0.7" />
              <ellipse cx="100" cy="128" rx="84" ry="90" fill="none" stroke="#C9FCFC" strokeWidth="2.5" opacity="0.8" />
            </g>
          )}
          {accessory === 'backpack' && <BackpackBehind t={t} />}
          {/* feet nubs */}
          {[74, 127].map((x, i) => (
            <ellipse key={x} cx={x} cy={203 + i * 0.6} rx="15" ry="8" fill={t.shade} stroke={t.ink} strokeWidth="4" />
          ))}
          {cool && <path d={body} fill="none" stroke={t.neon} strokeWidth="10" strokeLinejoin="round" />}
          {/* flat fill + one cel-shadow crescent (lower right) */}
          <path d={body} fill={t.shade} />
          <g clipPath={`url(#${id}body)`}>
            <path d={body} fill={t.body} transform="translate(-13 -10)" />
            <ellipse cx="100" cy="190" rx="38" ry="11" fill={t.belly} opacity="0.85" />
          </g>
          {/* rim-highlight sliver */}
          <path d="M49,98 C53,76 67,60 85,53" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity="0.85" />
          {/* hand-inked outline: two slightly offset strokes so the weight wobbles 3.5-4.5px */}
          <path d={body} fill="none" stroke={t.ink} strokeWidth={3.6 + inkW} strokeLinejoin="round" />
          <path d={body} fill="none" stroke={t.ink} strokeWidth={2.6 + inkW} strokeLinejoin="round" transform="translate(0.9 1.1)" />

          <Sprout pose={awakened ? 'crown' : spec.sprout} t={t} flower={cute && !awakened} tint={m === 'possessed' ? BOSS_TINT : undefined} />

          {cute && (
            <g fill={BLUSH} opacity="0.55">
              <ellipse cx="46" cy="160" rx="11" ry="6.5" />
              <ellipse cx="155" cy="159" rx="10.5" ry="6.5" />
            </g>
          )}
          {cool && (
            // sleek visor band across the forehead
            <g>
              <path d="M36,103 Q100,84 164,103 L162,115 Q100,97 38,115 Z" fill={t.visor} stroke={t.ink} strokeWidth="3" strokeLinejoin="round" />
              <path d="M40,113 Q100,96 160,113" fill="none" stroke={t.neon} strokeWidth="2.4" strokeLinecap="round" />
            </g>
          )}

          {ugly && !['arcs', 'spiral', 'dots'].includes(spec.eyes) && (
            // tired under-eye bags
            <g fill="none" stroke={t.ink} strokeWidth="2.6" strokeLinecap="round" opacity="0.55">
              <path d={`M${EYE_L.cx - 12},${EYE_L.cy + 25} Q${EYE_L.cx},${EYE_L.cy + 32} ${EYE_L.cx + 12},${EYE_L.cy + 25}`} />
              <path d={`M${EYE_R.cx - 12},${EYE_R.cy + 25} Q${EYE_R.cx},${EYE_R.cy + 32} ${EYE_R.cx + 12},${EYE_R.cy + 25}`} />
            </g>
          )}
          {(m === 'confused' || m === 'overwhelmed') && (
            // anxious little brows (inner ends up): trying hard, staying kind
            <g stroke={t.ink} strokeWidth="3.6" strokeLinecap="round">
              <path d={`M${EYE_L.cx - 12},${EYE_L.cy - 30} L${EYE_L.cx + 9},${EYE_L.cy - 36}`} />
              <path d={`M${EYE_R.cx - 9},${EYE_R.cy - 35} L${EYE_R.cx + 12},${EYE_R.cy - 29}`} />
            </g>
          )}
          <g className={`pip2d-eyes${blink && !['arcs', 'spiral', 'dots'].includes(spec.eyes) ? ' is-blinking' : ''}`}>{eyes}</g>
          <Mouth shape={mouthShape} ink={t.ink} ugly={ugly} />

          {m === 'notes' && <Notebook t={t} />}
          {m === 'overwhelmed' && <SweatDrop />}
          <Accessory type={accessory} t={t} bodyClip={`${id}body`} />
        </g>
      </g>
    </svg>
  )
}

export default Pip2D
