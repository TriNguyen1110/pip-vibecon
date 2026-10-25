import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useLoad } from '../hooks'
import { ErrorState, Loading, Sheet, useToast } from '../components/ui.jsx'
import InsightCard from '../components/InsightCard.jsx'
import AtRiskCard from '../components/AtRiskCard.jsx'
import { StudioShell } from '../staff/StudioShell.jsx'
import { staffApi } from '../staff/api'
import { LangTag } from '../staff/bits.jsx'
import RenewalNote from '../staff/RenewalNote.jsx'
import { fmtDate, pct, refId, refName, subjectShort, usd } from '../staff/format'

const PILOT_WORDS = {
  active: 'Pilot active',
  pending: 'Checkout started',
  not_started: 'No pilot yet',
  none: 'No pilot yet',
}

// Owner (CONTRACT v3.13b): the money first, every number explains itself on tap.
export default function Owner() {
  const c = useLoad(() => api.center(), [])
  const o = useLoad(() => staffApi.overview(), [])
  const [renewal, setRenewal] = useState(null)
  const [noted, setNoted] = useState({})
  const toast = useToast()
  const center = c.data?.center
  const pilot = c.data?.pilot?.status ?? 'none'
  const ov = o.data

  return (
    <StudioShell who="Owner" initials="BP">
      <div className="studio-band" aria-hidden />
      <div className="page studio-page stack staff owner">
        <section className="page-head studio-head">
          <div className="stack-sm grow">
            <p className="eyebrow">Owner · {center?.name ?? 'Bright Path Tutoring'}</p>
            <h1 className="display h-page">This week at your center</h1>
            <p className="muted">
              {center
                ? `${center.students ?? 120} students · ${center.tutors ?? 8} tutors · grades ${center.grades ?? '5–9'} · ${center.label ?? 'demo center'}`
                : 'Bright Path Tutoring · demo center (synthetic data)'}
            </p>
          </div>
        </section>

        {o.loading && !ov ? (
          <div className="money">
            <div className="skeleton" style={{ height: 220 }} />
            <div className="kpis">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="skeleton" style={{ height: 104 }} />
              ))}
            </div>
          </div>
        ) : o.error && !ov ? (
          <ErrorState error={o.error} onRetry={o.reload} title="The center numbers didn’t load." />
        ) : ov ? (
          <Overview ov={ov} noted={noted} onRenew={setRenewal} />
        ) : null}

        <h2 className="sec-head">Patterns across every session</h2>
        {c.loading && !c.data ? (
          <Loading label="Reading every session…" />
        ) : c.error && !c.data ? (
          <ErrorState error={c.error} onRetry={c.reload} />
        ) : c.data?.insight ? (
          <InsightCard data={c.data} />
        ) : (
          <div className="glass card">
            <p className="muted">No shared misconception yet. It appears once students finish Pip sessions.</p>
          </div>
        )}

        <AtRiskCard />

        <div className="owner-grid">
          <Link to="/tutor" className="glass card owner-link">
            <p className="eyebrow">Tutors</p>
            <p className="card-title">Students × subjects</p>
            <p className="small muted">Every tutor’s students, families and gap reports.</p>
            <span className="owner-link__go" aria-hidden>
              →
            </span>
          </Link>
          <Link to="/owner/pricing" className="glass card owner-link">
            <p className="eyebrow">Plan</p>
            <p className="card-title">
              $4 per active student <span className="subtle small">/ month</span>
            </p>
            <p className="small muted">{PILOT_WORDS[pilot] ?? pilot}. $99 minimum.</p>
            <span className="owner-link__go" aria-hidden>
              →
            </span>
          </Link>
        </div>
      </div>

      <Sheet open={!!renewal} onClose={() => setRenewal(null)} label="Renewal note">
        {renewal && (
          <RenewalNote
            key={`${refId(renewal.student)}-${renewal.subject}`}
            row={renewal}
            onClose={() => setRenewal(null)}
            onSent={(m) => {
              setNoted((n) => ({ ...n, [`${refId(renewal.student)}-${renewal.subject}`]: m.status }))
              toast(`Renewal note sent to ${refName(renewal.guardian)} (test mode).`)
            }}
          />
        )}
      </Sheet>
    </StudioShell>
  )
}

function Metric({ label, value, unit, sub, explain, big, lcd, children }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`metric${big ? ' metric--big' : ''}${open ? ' is-open' : ''}`}>
      <button type="button" className="metric__btn" aria-expanded={open} onClick={() => setOpen((x) => !x)}>
        <span className="eyebrow">{label}</span>
        <span className={`metric__n${lcd ? ' y2k-lcd metric__n--lcd' : ''}`}>
          {value}
          {unit && <span className="metric__unit">{unit}</span>}
        </span>
        {sub && <span className="metric__sub">{sub}</span>}
        <span className="metric__how">{open ? 'Hide how we count' : 'How we count this'}</span>
      </button>
      {open && <div className="metric__explain small">{explain}</div>}
      {children}
    </div>
  )
}

function Overview({ ov, noted, onRenew }) {
  const rows = ov.renewals_due ?? []
  const riskRows = rows.filter((r) => r.signal === 'quiet' || r.at_risk)
  const hours = ov.tutor_hours_saved_week
  const basis = ov.tutor_hours_saved_basis ?? {}
  const updates = basis.parent_updates ?? ov.parent_updates_7d ?? ov.updates_sent_7d
  const reports = basis.gap_reports ?? ov.gap_reports_7d ?? (hours != null && updates != null ? Math.max(0, Math.round(hours * 6) - updates) : null)
  const minutesEach = basis.minutes_each ?? 10
  const riskCount = ov.revenue_at_risk_count ?? riskRows.length
  const subjMax = Math.max(1, ...(ov.by_subject ?? []).map((x) => x.students))

  return (
    <>
      <section className="money" aria-label="This week’s numbers">
        <Metric
          big
          label="Revenue at risk"
          value={usd(ov.revenue_at_risk_usd)}
          sub={
            <>
              {riskCount} package{riskCount === 1 ? '' : 's'} ending soon with a quiet or at-risk student.{' '}
              <a href="#renewals">See who →</a>
            </>
          }
          explain={
            <>
              Sum of package prices for students flagged at risk or quiet (no visit on their own or finished lesson this week) whose package is low (≤ 2 hours) or renews within 14 days.
              {riskRows.length > 0 && (
                <span className="metric__sum mono">
                  {' '}
                  = {riskRows.map((r) => usd(r.price_usd)).join(' + ')}
                </span>
              )}
            </>
          }
        >
          {riskRows.length > 0 && (
            <ul className="money__list" aria-label="Largest packages at risk">
              {[...riskRows]
                .sort((a, b) => b.price_usd - a.price_usd || String(a.renews_on).localeCompare(String(b.renews_on)))
                .slice(0, 3)
                .map((r) => (
                  <li key={`${refId(r.student)}-${r.subject}`}>
                    <span>
                      <b>{refName(r.student)}</b> · {subjectShort(r.subject)} · {r.hours_left}h left
                    </span>
                    <span className="mono">{usd(r.price_usd)}</span>
                  </li>
                ))}
            </ul>
          )}
        </Metric>
        <div className="kpis">
          <Metric
            label="Kept families · 30 days"
            value={pct(ov.retention_30d_pct)}
            sub="of students active a month ago are still enrolled"
            explain="Students with an active package 30 days ago who still have one today (renewed or still running)."
          />
          <Metric
            label="Parents reached · 7 days"
            value={updates ?? '—'}
            unit=" updates"
            sub={
              <>
                <b className="mono">{ov.parent_replies_7d ?? '—'}</b> replies · {pct(ov.parents_reachable_pct)} of families have a working contact
              </>
            }
            explain="Updates = parent updates sent this week (test mode in the demo), each in the guardian’s language. Replies = guardian messages back in the same threads. Reachable = families with at least one guardian who has a phone or email."
          />
          <Metric
            lcd
            label="Tutor time saved · this week"
            value={hours != null ? Number(hours).toFixed(1) : '—'}
            unit=" h"
            sub={`assumes ${minutesEach} min per write-up a tutor didn’t have to write`}
            explain={
              <>
                (parent updates <b className="mono">{updates ?? '—'}</b> + gap reports written automatically <b className="mono">{reports ?? '—'}</b>) × {minutesEach} minutes.
                The {minutesEach} minutes is our assumption for one hand-written update or session summary, not a measurement.
              </>
            }
          />
          <Metric
            label="Came back on their own · 7 days"
            value={ov.came_back_on_their_own_7d ?? '—'}
            unit=" students"
            sub="opened Pip with nothing due"
            explain="Students who opened Pip when no assignment was due. The strongest early sign a family will renew."
          />
        </div>
      </section>

      <section id="renewals" className="glass renewals" aria-label="Renewals due">
        <header className="renewals__head">
          <div>
            <h2 className="card-title">Renewals due</h2>
            <p className="small subtle">Packages with ≤ 2 hours left or renewing in the next 14 days. Engaged = came back on their own or finished a lesson this week.</p>
          </div>
        </header>
        {rows.length === 0 ? (
          <p className="muted renewals__empty">No packages ending in the next two weeks.</p>
        ) : (
          <div className="rn" role="table" aria-label="Renewals due">
            <div className="rn__row rn__row--th" role="row">
              <span role="columnheader">Student · family</span>
              <span role="columnheader">Subject</span>
              <span role="columnheader" className="rn__num">Hours left</span>
              <span role="columnheader">Renews</span>
              <span role="columnheader" className="rn__num">Package</span>
              <span role="columnheader">Signal</span>
              <span role="columnheader" className="sr-only">
                Action
              </span>
            </div>
            {rows.map((r) => {
              const key = `${refId(r.student)}-${r.subject}`
              const st = noted[key]
              const g = typeof r.guardian === 'object' ? r.guardian : null
              return (
                <div key={key} role="row" className={`rn__row${r.signal === 'quiet' ? ' is-quiet' : ''}`}>
                  <span role="cell" className="rn__who">
                    <Link to={`/tutor/students/${refId(r.student)}`} className="rn__name">
                      {refName(r.student)}
                    </Link>
                    <span className="small subtle">
                      {refName(r.guardian)} {g?.language && <LangTag lang={g.language} />}
                    </span>
                  </span>
                  <span role="cell">{subjectShort(r.subject)}</span>
                  <span role="cell" className={`rn__num mono${r.hours_left <= 2 ? ' is-low' : ''}`}>
                    {r.hours_left}
                  </span>
                  <span role="cell" className="mono">{fmtDate(r.renews_on)}</span>
                  <span role="cell" className="rn__num mono">{usd(r.price_usd)}</span>
                  <span role="cell">
                    <span className={`pill ${r.signal === 'engaged' ? 'pill--ok' : 'pill--warn'}`}>{r.signal === 'engaged' ? 'Engaged' : 'Quiet'}</span>
                  </span>
                  <span role="cell" className="rn__act">
                    {st ? (
                      <span className="small subtle">Note sent · test mode</span>
                    ) : (
                      <button className="btn btn--sm" onClick={() => onRenew(r)}>
                        Send renewal note
                      </button>
                    )}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <div className="load-grid">
        <section className="glass card load" aria-label="Load by subject">
          <h2 className="card-title">By subject</h2>
          <p className="small subtle">Students enrolled · lessons finished this week (Pip passed its quiz)</p>
          <ul className="bars">
            {(ov.by_subject ?? []).map((x) => (
              <li key={x.subject} className="bars__row">
                <span className="bars__label">{subjectShort(x.subject)}</span>
                <span className="bars__track" aria-hidden>
                  <i style={{ width: `${(x.students / subjMax) * 100}%` }} />
                </span>
                <span className="bars__n mono">{x.students}</span>
                <span className="bars__k small subtle mono">
                  {x.kos_7d} finished · {x.tutors} tutor{x.tutors === 1 ? '' : 's'}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="glass card load" aria-label="Load by tutor">
          <h2 className="card-title">By tutor</h2>
          <p className="small subtle">Students · subjects · families waiting on an update</p>
          <table className="table load__table">
            <thead>
              <tr>
                <th>Tutor</th>
                <th className="num">Students</th>
                <th>Subjects</th>
                <th className="num">Needs update</th>
              </tr>
            </thead>
            <tbody>
              {(ov.by_tutor ?? []).map((x) => (
                <tr key={refId(x.tutor)}>
                  <td>
                    <Link to={`/tutor?tutor=${refId(x.tutor)}`}>{refName(x.tutor)}</Link>
                  </td>
                  <td className="num mono">{x.students}</td>
                  <td className="small">{(x.subjects ?? []).map(subjectShort).join(', ')}</td>
                  <td className={`num mono${x.needs_update > 2 ? ' is-low' : ''}`}>{x.needs_update}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </>
  )
}
