import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useLoad } from '../hooks'
import { InlineError, initialsOf, useToast } from './ui.jsx'
import { pickReportSession } from '../lib'

// Studio: calm divided rows, plain-language reasons, no coral, no boss humor.
// `only` (a Set of student ids) narrows the center list to one tutor's roster.
export default function AtRiskCard({ compact, only, limit }) {
  const list = useLoad(() => api.atRisk(), [])
  const [opening, setOpening] = useState(null)
  const [openErr, setOpenErr] = useState(null)
  const navigate = useNavigate()
  const toast = useToast()

  const all = list.data?.students ?? []
  const mine = only ? all.filter((s) => only.has(s.student_id)) : all
  const shown = limit ? mine.slice(0, limit) : mine
  const more = mine.length - shown.length

  async function openReport(s) {
    const direct = s.last_session_id ?? s.session_id
    if (direct) {
      navigate(`/tutor/report/${direct}`)
      return
    }
    setOpening(s.student_id)
    setOpenErr(null)
    try {
      const d = await api.student(s.student_id)
      const session = pickReportSession(d.sessions)
      if (session) navigate(`/tutor/report/${session.id}`)
      else toast(`${firstName(s.name)} has no finished Pip session yet.`)
    } catch (e) {
      setOpenErr(e)
    } finally {
      setOpening(null)
    }
  }

  return (
    <section className={`glass atrisk${compact ? ' atrisk--compact' : ''}`} aria-label="At-risk families">
      <header className="atrisk__head">
        <div className="stack-sm grow">
          <p className="eyebrow">{compact ? 'Your students' : 'Families to check on'}</p>
          <h2 className="card-title">
            At-risk families
            {list.data && mine.length > 0 && <span className="atrisk__n mono"> {mine.length}</span>}
          </h2>
          {!compact && (
            <p className="small subtle">
              Stuck after Pip’s full set of questions, no visit on their own in 14 days, or no parent update in 14 days.
            </p>
          )}
        </div>
        {compact && (
          <Link to="/owner" className="small atrisk__all">
            Center view →
          </Link>
        )}
      </header>

      <InlineError error={openErr} />
      {list.loading && !list.data ? (
        <div className="stack-sm atrisk__body">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton" style={{ height: compact ? 44 : 56 }} />
          ))}
        </div>
      ) : list.error && !list.data ? (
        <div className="atrisk__body">
          <InlineError error={{ message: 'Couldn’t load the at-risk list.' }} onRetry={list.reload} />
        </div>
      ) : mine.length === 0 ? (
        <p className="atrisk__empty muted">Nobody at risk this week.</p>
      ) : (
        <ul className="atrisk__list">
          {shown.map((s) => {
            const reasons = s.reasons ?? []
            return (
              <li key={s.student_id} className="atrisk__row">
                <span className="avatar" aria-hidden>
                  {initialsOf(s.name)}
                </span>
                <div className="atrisk__who">
                  <span className="atrisk__name">{s.name}</span>
                  {reasons.length > 0 &&
                    (compact ? (
                      <span className="atrisk__reason small">
                        {reasons[0]}
                        {reasons.length > 1 && <span className="subtle"> · +{reasons.length - 1} more</span>}
                      </span>
                    ) : (
                      <ul className="atrisk__reasons">
                        {reasons.map((r, i) => (
                          <li key={i} className="small">
                            {r}
                          </li>
                        ))}
                      </ul>
                    ))}
                </div>
                <button
                  className="btn btn--sm atrisk__go"
                  onClick={() => openReport(s)}
                  disabled={opening === s.student_id}
                  aria-label={`Latest report for ${s.name}`}
                >
                  {opening === s.student_id ? 'Opening…' : 'Report'}
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {more > 0 && (
        <p className="atrisk__more small subtle">
          <span className="mono">{more}</span> more in the{' '}
          <Link to="/owner">center view</Link>.
        </p>
      )}
    </section>
  )
}

const firstName = (n = '') => n.split(' ')[0] || 'This student'
