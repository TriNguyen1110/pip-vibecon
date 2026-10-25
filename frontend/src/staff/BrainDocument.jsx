import { useState } from 'react'
import { api } from '../api'
import { useLoad } from '../hooks'
import { Dots, InlineError } from '../components/ui.jsx'
import { pickReportSession } from '../lib'
import { staffApi } from './api'

// CONTRACT v3.19: "View Pip's Brain as stored": the raw session document (tutor/owner only), readable,
// monospace, collapsible. Labelled "MongoDB document" only when the server really stores in MongoDB
// (/api/health store: "mongo"); otherwise it says it's the same document shape in the demo's memory store.

const OPEN_KEYS = new Set(['brain', 'quiz', 'gap_report', 'meters'])

function Value({ v, name, depth }) {
  if (v === null) return <span className="jv jv--null">null</span>
  if (Array.isArray(v) || typeof v === 'object') {
    const entries = Array.isArray(v) ? v.map((x, i) => [i, x]) : Object.entries(v)
    const open = depth < 1 || OPEN_KEYS.has(name)
    const brace = Array.isArray(v) ? ['[', ']'] : ['{', '}']
    if (!entries.length) return <span className="jv">{brace.join('')}</span>
    return (
      <details className="jd" open={open}>
        <summary>
          <span className="jv jv--brace">{brace[0]}</span>
          <span className="jd__count">
            {entries.length} {Array.isArray(v) ? (entries.length === 1 ? 'item' : 'items') : entries.length === 1 ? 'field' : 'fields'}
          </span>
        </summary>
        <ul className="jd__list">
          {entries.map(([k, x]) => (
            <li key={k}>
              <span className={Array.isArray(v) ? 'jk jk--i' : `jk${OPEN_KEYS.has(k) ? ' jk--brain' : ''}`}>{Array.isArray(v) ? k : `"${k}"`}</span>
              <span className="jp">: </span>
              <Value v={x} name={k} depth={depth + 1} />
            </li>
          ))}
        </ul>
        <span className="jv jv--brace">{brace[1]}</span>
      </details>
    )
  }
  if (typeof v === 'string') return <span className="jv jv--s">{JSON.stringify(v)}</span>
  if (typeof v === 'number') return <span className="jv jv--n">{v}</span>
  return <span className="jv jv--b">{String(v)}</span>
}

export default function BrainDocument({ studentId, sessionId }) {
  const health = useLoad(() => staffApi.health().catch(() => null), [])
  const doc = useLoad(async () => {
    let sid = sessionId
    if (!sid) {
      const d = await api.student(studentId)
      sid = pickReportSession(d.sessions)?.id ?? d.sessions?.at(-1)?.id
    }
    if (!sid) return { empty: true }
    const r = await staffApi.sessionDocument(sid)
    return { sid, doc: r?.document ?? r, store: r?.store ?? null, collection: r?.collection ?? 'sessions' }
  }, [studentId, sessionId])
  const [copied, setCopied] = useState(false)
  const d = doc.data
  const mongo = health.data?.store === 'mongo' || /mongo/i.test(d?.store ?? '')

  return (
    <div className="stack braindoc">
      <div className="stack-sm">
        <p className="eyebrow">Pip’s Brain as stored</p>
        <h2 className="display h-section">{mongo ? 'MongoDB document' : 'Stored session document'}</h2>
        <p className="small subtle">
          {mongo
            ? 'The session exactly as it lives in MongoDB. The “brain” field is what Pip believes, in the student’s words.'
            : 'The session document as stored. This demo runs on the in-memory store; with MONGO_URL set it is the same document in MongoDB.'}
        </p>
      </div>
      {doc.loading && !d ? (
        <p className="muted">
          Loading <Dots />
        </p>
      ) : doc.error && !d ? (
        <InlineError error={doc.error} onRetry={doc.reload} />
      ) : d?.empty ? (
        <p className="muted">No Pip session yet for this student.</p>
      ) : (
        <>
          <div className="row row--between">
            <span className="chip mono">{mongo ? 'MongoDB document' : 'document · memory store'} · {d.collection ?? 'sessions'} · _id {d.doc?._id ?? d.doc?.id ?? d.sid}</span>
            <button
              type="button"
              className="btn btn--sm btn--ghost"
              onClick={() => {
                navigator.clipboard?.writeText(JSON.stringify(d.doc, null, 2)).then(() => setCopied(true))
              }}
            >
              {copied ? 'Copied' : 'Copy JSON'}
            </button>
          </div>
          <div className="jsonview" role="tree" aria-label="Session document">
            <Value v={d.doc} name="" depth={0} />
          </div>
        </>
      )}
    </div>
  )
}
