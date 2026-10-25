import { useEffect, useMemo, useRef, useState } from 'react'
import { LEVEL_WORDS } from '../../lib'
import { LEVEL_SHORT, firstName, subjectName } from '../../staff/format'
import { isGiven } from '../../staff/learning'

// CONTRACT v3.18 learning map: "the map Pip learned about <kid>". Every concept across missions, colored by
// level; edges for builds_on ({from, to}: `from` builds on `to`, so the arrow runs prerequisite → next).
// One calm inline-SVG graph per subject: one column per mission (ordered so prerequisites come first),
// concepts stacked in order inside it, cross-mission edges between columns. Tap a node for the evidence
// quote in the kid's own words.

const NODE_H = 60
const GAP_X = 18
const GAP_Y = 26
const HEAD_H = 40
const PAD = 6
const MIN_COL = 124

function wrap(label, maxChars, maxLines = 2) {
  const words = String(label ?? '').split(/\s+/)
  const lines = ['']
  for (const w of words) {
    const cur = lines[lines.length - 1]
    if (!cur) lines[lines.length - 1] = w
    else if ((cur + ' ' + w).length <= maxChars) lines[lines.length - 1] = cur + ' ' + w
    else lines.push(w)
  }
  if (lines.length > maxLines) {
    lines.length = maxLines
    lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, '') + '…'
  }
  return lines
}

const missionKey = (n) => n.mission_id ?? n.mission ?? 'concepts'

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

  // Missions as columns, prerequisites first.
  const groups = {}
  nodes.forEach((n, i) => (groups[missionKey(n)] ??= { key: missionKey(n), title: n.mission ?? '', items: [] }).items.push({ n, i }))
  const cols = Object.values(groups)
  cols.forEach((c) => c.items.sort((a, b) => depth[a.n.concept_id] - depth[b.n.concept_id] || a.i - b.i))
  cols.sort((a, b) => Math.min(...a.items.map((x) => depth[x.n.concept_id])) - Math.min(...b.items.map((x) => depth[x.n.concept_id])))

  const inner = width - 2 * PAD
  const perBand = Math.max(1, Math.min(cols.length, Math.floor((inner + GAP_X) / (MIN_COL + GAP_X))))
  const colW = Math.min(cols.length === 1 ? 300 : 260, Math.floor((inner - GAP_X * (perBand - 1)) / perBand))
  const pos = {}
  const colOf = {}
  const heads = []
  let y = PAD
  for (let b = 0; b < cols.length; b += perBand) {
    const band = cols.slice(b, b + perBand)
    const total = band.length * colW + (band.length - 1) * GAP_X
    let x = PAD + Math.max(0, (inner - total) / 2)
    let tallest = 0
    band.forEach((c, ci) => {
      heads.push({ x, y, w: colW, title: c.title })
      c.items.forEach(({ n }, k) => {
        pos[n.concept_id] = { x, y: y + HEAD_H + k * (NODE_H + GAP_Y) }
        colOf[n.concept_id] = { band: b, col: ci, k }
      })
      tallest = Math.max(tallest, HEAD_H + c.items.length * (NODE_H + GAP_Y) - GAP_Y)
      x += colW + GAP_X
    })
    y += tallest + GAP_Y + 8
  }
  return { pos, colOf, nodeW: colW, height: y - GAP_Y - 8 + PAD, heads, multi: cols.length > 1 }
}

function edgePath(a, b, ca, cb, nodeW) {
  // Same column: straight down when adjacent, around the right side when it skips concepts.
  if (ca.band === cb.band && ca.col === cb.col) {
    if (Math.abs(cb.k - ca.k) === 1) {
      const x = a.x + nodeW / 2
      const [y1, y2] = cb.k > ca.k ? [a.y + NODE_H, b.y - 2] : [a.y, b.y + NODE_H + 2]
      return `M${x} ${y1} L${x} ${y2}`
    }
    const x1 = a.x + nodeW
    const x2 = b.x + nodeW + 2
    const y1 = a.y + NODE_H / 2
    const y2 = b.y + NODE_H / 2
    return `M${x1} ${y1} C${x1 + 16} ${y1} ${x2 + 16} ${y2} ${x2} ${y2}`
  }
  // Across columns in the same band: side to side.
  if (ca.band === cb.band) {
    const right = cb.col > ca.col
    const x1 = right ? a.x + nodeW : a.x
    const x2 = right ? b.x - 2 : b.x + nodeW + 2
    const y1 = a.y + NODE_H / 2
    const y2 = b.y + NODE_H / 2
    const mx = (x1 + x2) / 2
    return `M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`
  }
  // Across bands: bottom to top.
  const x1 = a.x + nodeW / 2
  const y1 = a.y + NODE_H
  const x2 = b.x + nodeW / 2
  const y2 = b.y - 2
  const my = (y1 + y2) / 2
  return `M${x1} ${y1} C${x1} ${my} ${x2} ${my} ${x2} ${y2}`
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
  const byId = useMemo(() => Object.fromEntries(nodes.map((n) => [n.concept_id, n])), [nodes])

  if (!nodes.length) {
    return (
      <div className="lmap lmap--empty" ref={box}>
        <h3 className="lmap__title">The map Pip learned about {kid || 'this student'}</h3>
        <p className="small muted">It fills in as {kid || 'the student'} teaches Pip: every concept, how well it was explained, in their own words.</p>
      </div>
    )
  }

  const builtOn = selected ? edges.filter((e) => e.from === selected.concept_id).map((e) => byId[e.to]).filter(Boolean) : []

  return (
    <section className="lmap" aria-label={`Learning map for ${student?.name ?? 'the student'}`} ref={box}>
      <header className="lmap__head">
        <h3 className="lmap__title">The map Pip learned about {kid}</h3>
        <p className="small subtle">
          <span className="mono">{known}</span> of <span className="mono">{nodes.length}</span> concepts known · tap one for {kid}’s own words
        </p>
      </header>

      {width > 0 &&
        subjects.map((subj) => {
          const ns = nodes.filter((n) => (n.subject ?? 'other') === subj)
          const ids = new Set(ns.map((n) => n.concept_id))
          const es = edges.filter((e) => ids.has(e.from) && ids.has(e.to))
          const { pos, colOf, nodeW, height, heads } = layout(ns, es, width)
          const chars = Math.max(10, Math.floor((nodeW - 22) / 6.6))
          const showWord = nodeW >= 176
          return (
            <figure key={subj} className="lmap__subject">
              <figcaption className="eyebrow">{subjectName(subj)}</figcaption>
              <svg className="lmap__svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="group" aria-label={`${subjectName(subj)} concepts`}>
                <defs>
                  <marker id={`lmap-arrow-${subj}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                    <path d="M0 0 L10 5 L0 10 z" className="lmap__arrow" />
                  </marker>
                </defs>
                {heads.map((h) => (
                  <text key={`${h.x}-${h.y}`} x={h.x + 2} y={h.y + 14} className="lmap__mission">
                    {wrap(h.title, Math.floor(h.w / 6.4), 2).map((l, i) => (
                      <tspan key={i} x={h.x + 2} dy={i ? 14 : 0}>
                        {l}
                      </tspan>
                    ))}
                  </text>
                ))}
                {es.map((e) => {
                  const a = pos[e.to]
                  const b = pos[e.from]
                  if (!a || !b) return null
                  const on = sel && (sel === e.from || sel === e.to)
                  return (
                    <path
                      key={`${e.from}-${e.to}`}
                      d={edgePath(a, b, colOf[e.to], colOf[e.from], nodeW)}
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
                      aria-label={`${n.label}${n.mission ? `, ${n.mission}` : ''}. ${word}.${n.evidence_quote ? ' Has a quote.' : ''}`}
                      onClick={() => setSel(isSel ? null : n.concept_id)}
                      onKeyDown={(ev) => {
                        if (ev.key === 'Enter' || ev.key === ' ') {
                          ev.preventDefault()
                          setSel(isSel ? null : n.concept_id)
                        }
                      }}
                    >
                      <title>{`${n.label} · ${word}`}</title>
                      <rect width={nodeW} height={NODE_H} rx="12" className="lmap__box" />
                      <text x="11" y={lines.length === 1 ? 24 : 19} className="lmap__label">
                        {lines.map((l, i) => (
                          <tspan key={i} x="11" dy={i ? 16 : 0}>
                            {l}
                          </tspan>
                        ))}
                      </text>
                      {[0, 1, 2].map((k) => (
                        <rect key={k} x={11 + k * 13} y={NODE_H - 13} width="10" height="5" rx="2.5" className={`lmap__pip${!given && k < n.level ? ' on' : ''}${given ? ' given' : ''}`} />
                      ))}
                      {showWord && (
                        <text x={54} y={NODE_H - 8} className="lmap__word">
                          {word}
                        </text>
                      )}
                      {!showWord && given && (
                        <text x={54} y={NODE_H - 8} className="lmap__word">
                          knew
                        </text>
                      )}
                      {n.evidence_quote && (
                        <text x={nodeW - 10} y={NODE_H - 7} textAnchor="end" className="lmap__q" aria-hidden>
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
            {builtOn.length > 0 && <p className="small subtle">Builds on: {builtOn.map((x) => x.label).join(', ')}</p>}
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
