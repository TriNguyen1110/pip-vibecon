import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { InlineError } from './ui.jsx'

// Calm, staff-facing. The boss name appears only as a small chip.
export default function InsightCard({ data, compact }) {
  const { insight, came_back_this_week } = data
  const [note, setNote] = useState(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)

  async function plan() {
    setBusy(true)
    setErr(null)
    try {
      const r = await api.workshop(insight.misconception)
      setNote(r.note || 'Workshop note saved.')
    } catch (e) {
      setErr(e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={`glass insight${compact ? ' insight--compact' : ''}`} aria-label="Center insight">
      <div className="insight__main">
        <p className="eyebrow">Center insight · demo center</p>
        <h2 className="insight__headline">
          <span className="insight__count">{insight.count}</span>
          <span className="insight__lead">students share the same mistake:</span>
        </h2>
        <p className="insight__mis">{insight.misconception}</p>
        {insight.boss_name && (
          <span className="chip insight__chip">
            students call it <b>{insight.boss_name}</b>
          </span>
        )}
        {!compact && (
          <div className="stack-sm" style={{ marginTop: 8 }}>
            {note ? (
              <div className="panel insight__note" role="status">
                <p className="eyebrow" style={{ marginBottom: 4 }}>
                  Workshop note saved
                </p>
                <p className="small muted" style={{ whiteSpace: 'pre-wrap' }}>
                  {note}
                </p>
              </div>
            ) : (
              <div>
                <button className="btn btn--primary" onClick={plan} disabled={busy}>
                  {busy ? 'Saving…' : 'Plan a workshop'}
                </button>
              </div>
            )}
            <InlineError error={err} onRetry={plan} />
          </div>
        )}
        {compact && (
          <Link to="/owner" className="small">
            See center view →
          </Link>
        )}
      </div>
      {!compact && came_back_this_week != null && (
        <div className="insight__stat">
          <span className="mono insight__stat-n">{came_back_this_week}</span>
          <span className="small muted">Came back on their own this week</span>
          <span className="small subtle">Opened Pip with no assignment due</span>
        </div>
      )}
    </section>
  )
}
