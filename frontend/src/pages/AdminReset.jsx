import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useLoad } from '../hooks'
import { InlineError, Shell, useReset } from '../components/ui.jsx'

export default function AdminReset() {
  const reset = useReset()
  const health = useLoad(() => api.health(), [])
  const [phase, setPhase] = useState('idle') // idle | busy | warming | done
  const [warm, setWarm] = useState(null)
  const [err, setErr] = useState(null)

  async function go() {
    setPhase('busy')
    setErr(null)
    try {
      await reset()
      setPhase('warming')
      try {
        setWarm(await api.warm())
      } catch (e) {
        setWarm({ ok: false, error: e.message })
      }
      setPhase('done')
      health.reload()
    } catch (e) {
      setErr(e)
      setPhase('idle')
    }
  }

  const h = health.data
  return (
    <Shell>
      <div className="page page--narrow staff">
        <section className="glass card stack" style={{ marginTop: 32 }}>
          <p className="eyebrow">Demo tools</p>
          <h1 className="display h-section">Reset demo data</h1>
          <p className="muted small">
            Restores the seeded center, the 30 completed sessions and Maya’s saved session, then warms up the AI. Live
            sessions from this demo are cleared.
          </p>
          {phase === 'done' ? (
            <div className="stack-sm">
              <p>
                <span className="pill pill--ok">Demo data restored</span>{' '}
                {warm && (
                  <span className={`pill ${warm.ok ? 'pill--ok' : 'pill--warn'}`}>
                    {warm.ok ? `warm · ${warm.ai ?? 'ok'}` : 'warm-up skipped'}
                  </span>
                )}
              </p>
              <div className="row">
                <Link className="btn btn--primary" to="/">
                  Back to start
                </Link>
                <Link className="btn btn--ghost" to="/student">
                  Maya’s home
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <button className="btn btn--primary" onClick={go} disabled={phase !== 'idle'}>
                {phase === 'busy' ? 'Resetting…' : phase === 'warming' ? 'Warming up the AI…' : 'Reset demo data'}
              </button>
            </div>
          )}
          <InlineError error={err} onRetry={go} />
          <p className="mono subtle" style={{ fontSize: 12, marginTop: 8 }}>
            {h ? `ai ${h.ai ?? '?'} · store ${h.store ?? '?'}${h.model ? ` · ${h.model}` : ''}` : health.error ? 'server unreachable' : '…'}
          </p>
        </section>
      </div>
    </Shell>
  )
}
