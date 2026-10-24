import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { ErrorState, Loading, Shell } from '../components/ui.jsx'

export default function PilotSuccess() {
  const [state, setState] = useState({ loading: true })
  const ran = useRef(false)
  const confirm = () => {
    setState({ loading: true })
    api
      .confirmPilot()
      .then((r) => setState({ pilot: r.pilot }))
      .catch((error) => setState({ error }))
  }
  useEffect(() => {
    if (ran.current) return
    ran.current = true
    confirm()
  }, [])
  return (
    <Shell who="Owner" initials="BP">
      <div className="page page--narrow staff">
        {state.loading ? (
          <Loading label="Confirming your pilot…" />
        ) : state.error ? (
          <ErrorState error={state.error} onRetry={confirm} title="We couldn’t confirm the pilot." />
        ) : (
          <section className="glass card stack success">
            <span className="success__mark" aria-hidden>✓</span>
            <p className="eyebrow">Pilot · {state.pilot?.status ?? 'active'}</p>
            <h1 className="display h-page">Your pilot is on.</h1>
            <p className="muted">
              Bright Path Tutoring is set up. Tutors can assign Pip missions today, and you’ll see the center insight update
              as sessions finish.
            </p>
            <p className="small subtle">Test mode: no card was charged.</p>
            <div className="row">
              <Link className="btn btn--primary" to="/owner">
                Back to owner view
              </Link>
              <Link className="btn btn--ghost" to="/tutor">
                Open tutor view
              </Link>
            </div>
          </section>
        )}
      </div>
    </Shell>
  )
}
