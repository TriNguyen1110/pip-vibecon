import { useEffect, useMemo, useRef, useState } from 'react'
import { LEVEL_WORDS } from '../../lib'
import { LEVEL_SHORT, firstName, subjectName } from '../../staff/format'
import { isGiven } from '../../staff/learning'

// CONTRACT v3.18 learning map: "the map Pip learned about <kid>". Every concept across missions, colored by
// level, edges for builds_on ({from, to}: `from` builds on `to`, so the arrow runs prerequisite → next).
// One calm inline-SVG graph per subject, laid out in layers (prerequisites first). Tap a node for the
// evidence quote in the kid's own words.

const NODE_H = 64
const GAP_X = 16
const GAP_Y = 36
const PAD = 8

function wrap(label, maxChars) {
  const words = String(label ?? '').split(/\s+/)
  const lines = ['']
  for (const w of words) {
    const cur = lines[lines.length - 1]
    if (!cur) lines[lines.length - 1] = w
    else if ((cur + ' ' + w).length <= maxChars) lines[lines.length - 1] = cur + ' ' + w
    else lines.push(w)
  }
  if (lines.length > 2) {
    lines.length = 2
    lines[1] = lines[1].replace(/\s*\S*$/, '') + '…'
  }
  return lines
}

function layout(nodes, edges, width) {
  const ids = new Set(nodes.map((n) => n.concept_id))
  const prereqs = Object.fromEntries(nodes.map((n) => [n.concept_id, []]))
  for (const e of edges) if (ids.has(e.from) && ids.has(e.to)) prereqs[e.from].push(e.to)
  const depth = {}
  const visiting = new Set()
  const d = (id) => {
    if (depth[id] != null) return depth[id]
    if (visiting.has(id)) return 0
    visiting.add(id)
    const v = prereqs[id].length ? 1 + Math.max(...prereqs[id].map(d)) : 0
    visiting.delete(id)
    return (depth[id] = v)
  }
  nodes.forEach((n) => d(n.concept_id))
  const layers = {}
  nodes.forEach((n, i) => (layers[depth[n.concept_id]] ??= []).push({ n, i }))
  const widest = Math.max(1, ...Object.values(layers).map((l) => l.length))
  const perLine = Math.max(1, Math.min(3, widest, Math.floor((width - 2 * PAD - 40 + GAP_X) / (170 + GAP_X))))
  const nodeW = Math.min(perLine === 1 ? 300 : 240, Math.floor((width - 2 * PAD - 40 - GAP_X * (perLine - 1)) / perLine))
  const pos = {}
  let y = PAD
  Object.keys(layers)
    .map(Number)
    .sort((a, b) => a - b)
    .forEach((k) => {
      const row = layers[k]
      for (let s = 0; s < row.length; s += perLine) {
        const chunk = row.slice(s, s + perLine)
        const total = chunk.length * nodeW + (chunk.length - 1) * GAP_X
        let x = Math.max(PAD, (width - 40 - total) / 2)
        for (const { n } of chunk) {
          pos[n.concept_id] = { x, y }
          x += nodeW + GAP_X
        }
        y += NODE_H + GAP_Y
      }
    })
  return { pos, nodeW, height: y - GAP_Y + PAD, prereqs }
}

function useWidth(ref) {
  const [w, setW] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el)
    setW(el.clientWidth)
    return () => ro.disconnect()
  }, [ref])
  return w
}

export default function LearningMap({ map, student }) {
  const box = useRef(null)
  const width = useWidth(box)
  const kid = firstName(student?.name)
  const nodes = useMemo(() => map?.nodes ?? [], [map])
  const edges = useMemo(() => map?.edges ?? [], [map])
  const subjects = useMemo(() => [...new Set(nodes.map((n) => n.subject ?? 'other'))], [nodes])
  const [sel, setSel] = useState(null)
  const selected = nodes.find((n) => n.concept_id === sel) ?? null
  const known = nodes.filter((n) => n.level >= 2).length

  if (!nodes.length) {
    return (
      <div className="lmap lmap--empty" ref={box}>
        <p className="small muted">The map fills in as {kid || 'the student'} teaches Pip: every concept, how well it was explained, in their words.</p>
      </div>
    )
  }

  return (
    <section className="lmap" aria-label={`Learning map for ${student?.name ?? 'the student'}`} ref={box}>
      <header className="lmap__head">
        <div>
          <h3 className="lmap__title">The map Pip learned about {kid}</h3>
          <p className="small subtle">
            <span className="mono">{known}</span> of <span className="mono">{nodes.length}</span> concepts known · tap one for {kid}’s own words
            {map?.fallback ? ' · built from the current missions' : ''}
          </p>
        </div>
      </header>

      {width > 0 &&
        subjects.map((subj) => {
          const ns = nodes.filter((n) => (n.subject ?? 'other') === subj)
          const ids = new Set(ns.map((n) => n.concept_id))
          const es = edges.filter((e) => ids.has(e.from) && ids.has(e.to))
          const { pos, nodeW, height } = layout(ns, es, width)
          const chars = Math.max(14, Math.floor((nodeW - 24) / 6.4))
          return (
            <figure key={subj} className="lmap__subject">
              <figcaption className="eyebrow">{subjectName(subj)}</figcaption>
              <svg className="lmap__svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="group" aria-label={`${subjectName(subj)} concepts`}>
                <defs>
                  <marker id={`lmap-arrow-${subj}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M0 0 L10 5 L0 10 z" className="lmap__arrow" />
                  </marker>
                </defs>
                {es.map((e) => {
                  const a = pos[e.to]
                  const b = pos[e.from]
                  if (!a || !b) return null
                  const on = sel && (sel === e.from || sel === e.to)
                  // An edge that skips a layer would cross the node between: route it around the right side.
                  const skips = ns.some((n) => {
                    const q = pos[n.concept_id]
                    return n.concept_id !== e.from && n.concept_id !== e.to && q.y > a.y && q.y < b.y && Math.abs(q.x - a.x) < nodeW && Math.abs(q.x - b.x) < nodeW
                  })
                  let d
                  if (skips) {
                    const x1 = a.x + nodeW
                    const y1 = a.y + NODE_H * 0.6
                    const x2 = b.x + nodeW + 2
                    const y2 = b.y + NODE_H * 0.4
                    const bulge = Math.min(36, Math.max(18, (width - Math.max(x1, x2)) - 6))
                    d = `M${x1} ${y1} C${x1 + bulge} ${y1} ${x2 + bulge} ${y2} ${x2} ${y2}`
                  } else {
                    const x1 = a.x + nodeW / 2
                    const y1 = a.y + NODE_H
                    const x2 = b.x + nodeW / 2
                    const y2 = b.y - 2
                    const my = (y1 + y2) / 2
                    d = `M${x1} ${y1} C${x1} ${my} ${x2} ${my} ${x2} ${y2}`
                  }
                  return (
                    <path
                      key={`${e.from}-${e.to}`}
                      d={d}
                      className={`lmap__edge${on ? ' is-on' : ''}`}
                      markerEnd={`url(#lmap-arrow-${subj})`}
                    />
                  )
                })}
                {ns.map((n) => {
                  const p = pos[n.concept_id]
                  const given = isGiven(n)
                  const lines = wrap(n.label, chars)
                  const isSel = sel === n.concept_id
                  const word = given ? 'Already knew' : LEVEL_SHORT[n.level] ?? ''
                  return (
                    <g
                      key={n.concept_id}
                      transform={`translate(${p.x} ${p.y})`}
                      className={`lmap__node lv${given ? 'g' : n.level}${isSel ? ' is-sel' : ''}`}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isSel}
                      aria-label={`${n.label}. ${word}.${n.evidence_quote ? ' Has a quote.' : ''}`}
                      onClick={() => setSel(isSel ? null : n.concept_id)}
                      onKeyDown={(ev) => {
                        if (ev.key === 'Enter' || ev.key === ' ') {
                          ev.preventDefault()
                          setSel(isSel ? null : n.concept_id)
                        }
                      }}
                    >
                      <rect width={nodeW} height={NODE_H} rx="12" className="lmap__box" />
                      <text x="12" y={lines.length === 1 ? 26 : 20} className="lmap__label">
                        {lines.map((l, i) => (
                          <tspan key={i} x="12" dy={i ? 17 : 0}>
                            {l}
                          </tspan>
                        ))}
                      </text>
                      {[0, 1, 2].map((k) => (
                        <rect key={k} x={12 + k * 14} y={NODE_H - 13} width="11" height="5" rx="2.5" className={`lmap__pip${!given && k < n.level ? ' on' : ''}${given ? ' given' : ''}`} />
                      ))}
                      <text x={58} y={NODE_H - 8} className="lmap__word">
                        {word}
                      </text>
                      {n.evidence_quote && (
                        <text x={nodeW - 12} y={NODE_H - 8} textAnchor="end" className="lmap__q" aria-hidden>
                          “ ”
                        </text>
                      )}
                    </g>
                  )
                })}
              </svg>
            </figure>
          )
        })}

      <div className="lmap__detail" aria-live="polite">
        {selected ? (
          <>
            <p className="lmap__detail-title">{selected.label}</p>
            <p className="small subtle">
              {[selected.mission, subjectName(selected.subject)].filter(Boolean).join(' · ')} ·{' '}
              {isGiven(selected) ? 'Already knew this before the lesson' : LEVEL_WORDS[selected.level]}
            </p>
            {selected.evidence_quote ? (
              <blockquote className="lmap__quote">
                <q className="quote">{selected.evidence_quote}</q>
                <span className="small subtle">{kid}’s own words</span>
              </blockquote>
            ) : (
              <p className="small muted">{isGiven(selected) ? 'Pip started out knowing this, so there’s no quote.' : `No explanation from ${kid} yet.`}</p>
            )}
          </>
        ) : (
          <p className="small subtle">Tap a concept to see how {kid} explained it.</p>
        )}
      </div>

      <ul className="lmap__legend small" aria-label="Legend">
        {[0, 1, 2, 3].map((l) => (
          <li key={l} className={`lv${l}`}>
            <i aria-hidden /> {LEVEL_SHORT[l]}
          </li>
        ))}
        <li className="lvg">
          <i aria-hidden /> Already knew
        </li>
      </ul>
    </section>
  )
}
