import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { InlineError, Shell } from '../components/ui.jsx'

const PRICE = 4
const MIN = 99

export default function Pricing() {
  const [n, setN] = useState(120)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const navigate = useNavigate()
  const monthly = Math.max(MIN, n * PRICE)

  async function start() {
    setBusy(true)
    setErr(null)
    try {
      const { url } = await api.checkout()
      if (!url) throw new Error('No checkout link came back.')
      const u = new URL(url, window.location.origin)
      if (u.origin === window.location.origin) navigate(u.pathname + u.search)
      else window.location.assign(u.href)
    } catch (e) {
      setErr(e)
      setBusy(false)
    }
  }

  return (
    <Shell who="Owner" initials="BP">
      <div className="page page--narrow stack staff">
        <Link to="/owner" className="small back">
          ← Owner view
        </Link>
        <div className="stack-sm">
          <p className="eyebrow">Pricing</p>
          <h1 className="display h-page">Pay for students who use it.</h1>
          <p className="muted">Tutors, owners and parent updates are included. Cancel any month.</p>
        </div>

        <section className="glass card price stack">
          <div className="price__big">
            <span className="display price__n">$4</span>
            <span className="muted">per active student per month</span>
          </div>
          <p className="small subtle">$99 minimum per month. A student is active in a month they teach Pip at least once.</p>

          <div className="price__calc panel">
            <label className="field">
              <span>
                Active students: <b className="mono">{n}</b>
              </span>
              <input
                type="range"
                min={5}
                max={300}
                step={5}
                value={n}
                onChange={(e) => setN(Number(e.target.value))}
                className="range"
              />
            </label>
            <div className="row row--between">
              <span className="muted small">Estimated monthly</span>
              <span className="mono price__total">${monthly.toLocaleString()}</span>
            </div>
            {n * PRICE < MIN && <p className="small subtle">Minimum applies below 25 active students.</p>}
          </div>

          <ul className="price__list small muted">
            <li>Unlimited Pip missions and gap reports</li>
            <li>Center insight across every session</li>
            <li>Weekly parent updates, branded as your center</li>
          </ul>

          <button className="btn btn--primary btn--lg btn--block" onClick={start} disabled={busy}>
            {busy ? 'Opening checkout…' : 'Start pilot'}
          </button>
          <p className="small subtle" style={{ textAlign: 'center' }}>
            Stripe test mode. No real card is charged.
          </p>
          <InlineError error={err} onRetry={start} />
        </section>
      </div>
    </Shell>
  )
}
