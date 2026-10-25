import { fmtDate, firstName } from '../../staff/format'
import { EXPLAINS_WORDS, PACE_WORDS } from '../../staff/learning'

// CONTRACT v3.18 learning profile: computed from sessions, never self-reported, never "visual learner" labels.
export default function LearningProfile({ profile, student }) {
  const kid = firstName(student?.name)
  if (!profile) {
    return (
      <section className="lprof lprof--empty" aria-label="Learning profile">
        <h3 className="sec-title">Learning profile</h3>
        <p className="small muted">Pip writes this after {kid || 'the student'}’s first finished lesson: what helps them explain, what gets them unstuck, and their pace.</p>
      </section>
    )
  }
  const lp = profile
  const fixed = lp.misconceptions_fixed ?? []
  const rows = [
    lp.explains_with?.length ? ['Explains best with', lp.explains_with.map((x) => EXPLAINS_WORDS[x] ?? x).join(', ')] : null,
    lp.unstuck_by?.length ? ['Gets unstuck by', lp.unstuck_by.join('; ')] : null,
    lp.pace
      ? [
          'Pace',
          `${PACE_WORDS[lp.pace] ?? lp.pace}${lp.texts_to_ready_avg ? ` · about ${Math.round(lp.texts_to_ready_avg * 10) / 10} texts to explain a concept` : ''}`,
        ]
      : null,
  ].filter(Boolean)

  return (
    <section className="lprof" aria-label="Learning profile">
      <header className="row row--between">
        <h3 className="sec-title">Learning profile</h3>
        {lp.updated_at && <span className="small subtle">from sessions · updated {fmtDate(lp.updated_at)}</span>}
      </header>
      <dl className="lprof__rows">
        {rows.map(([k, v]) => (
          <div key={k} className="lprof__row">
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      {fixed.length > 0 && (
        <div className="lprof__fixed">
          <p className="label">Fixed</p>
          <ul>
            {fixed.slice(0, 3).map((f, i) => (
              <li key={i}>
                <q className="quote lprof__before">{f.quote_before}</q>
                <span className="lprof__arrow" aria-label="became">
                  →
                </span>
                <q className="quote">{f.quote_after}</q>
                <span className="small subtle">
                  {' '}
                  · {f.mission}
                  {f.date ? `, ${fmtDate(f.date)}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {(lp.strengths?.length > 0 || lp.watch_for?.length > 0) && (
        <div className="lprof__cols">
          {lp.strengths?.length > 0 && (
            <div>
              <p className="label">Strengths</p>
              <ul className="lprof__list">
                {lp.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {lp.watch_for?.length > 0 && (
            <div>
              <p className="label">Watch for</p>
              <ul className="lprof__list">
                {lp.watch_for.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
