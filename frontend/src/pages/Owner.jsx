import { Link } from 'react-router-dom'
import { api } from '../api'
import { useLoad } from '../hooks'
import { ErrorState, Loading, Shell } from '../components/ui.jsx'
import InsightCard from '../components/InsightCard.jsx'

const PILOT_WORDS = {
  active: 'Pilot active',
  pending: 'Checkout started',
  not_started: 'No pilot yet',
  none: 'No pilot yet',
}

export default function Owner() {
  const c = useLoad(() => api.center(), [])
  const center = c.data?.center
  const pilot = c.data?.pilot?.status ?? 'none'
  return (
    <Shell who="Owner" initials="BP">
      <div className="page stack staff">
        <section className="page-head">
          <div className="stack-sm grow">
            <p className="eyebrow">Owner · {center?.name ?? 'Bright Path Tutoring'}</p>
            <h1 className="display h-page">This week at your center</h1>
            <p className="muted">
              {center
                ? `${center.students ?? 120} students · ${center.tutors ?? 8} tutors · grades ${center.grades ?? '5–9'} · ${center.label ?? 'demo center'}`
                : 'Patterns across every Pip session.'}
            </p>
          </div>
        </section>

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

        <div className="owner-grid">
          <Link to="/tutor" className="glass card owner-link">
            <p className="eyebrow">Tutors</p>
            <p className="card-title">Ms. Rivera’s roster</p>
            <p className="small muted">“Since last session” for every student, with gap reports.</p>
            <span className="owner-link__go" aria-hidden>→</span>
          </Link>
          <Link to="/owner/pricing" className="glass card owner-link">
            <p className="eyebrow">Plan</p>
            <p className="card-title">
              $4 per active student <span className="subtle small">/ month</span>
            </p>
            <p className="small muted">
              {PILOT_WORDS[pilot] ?? pilot}. $99 minimum.
            </p>
            <span className="owner-link__go" aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </Shell>
  )
}
