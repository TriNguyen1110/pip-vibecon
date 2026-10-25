import { useState } from 'react'
import { InlineError } from '../components/ui.jsx'
import { staffApi } from './api'
import { METHOD_WORDS, usd } from './format'

// CONTRACT v3.19b: record a payment the center received outside Pip (Zelle, cash, check, Venmo…).
// Same effect as a paid checkout: hours added, receipt number, revenue at risk updates. No processing fee.
export default function MarkPaid({ studentId, enrollmentId, hours: h0, amount: a0, onDone, onCancel }) {
  const [method, setMethod] = useState('zelle')
  const [hours, setHours] = useState(h0 ?? 12)
  const [amount, setAmount] = useState(a0 ?? '')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const [done, setDone] = useState(null)

  async function save(e) {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    try {
      const p = await staffApi.offlinePayment({
        student_id: studentId,
        enrollment_id: enrollmentId,
        hours: Number(hours),
        amount_usd: Number(amount),
        method,
        ...(note.trim() ? { note: note.trim() } : {}),
      })
      setDone(p)
      onDone?.(p)
    } catch (x) {
      setErr(x)
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="markpaid markpaid--done" role="status">
        <p>
          <b>Recorded: {usd(done.amount_usd ?? amount)} by {METHOD_WORDS[done.method ?? method]}</b>, {done.hours ?? hours} hours added.
        </p>
        <p className="small subtle">Receipt {done.receipt_no ?? done.id}. No processing fee.</p>
      </div>
    )
  }
  return (
    <form className="markpaid" onSubmit={save} aria-label="Mark as paid">
      <p className="small subtle">Paid outside Pip? Record it so hours and renewals stay right.</p>
      <div className="markpaid__methods" role="radiogroup" aria-label="How they paid">
        {Object.entries(METHOD_WORDS).map(([k, w]) => (
          <button key={k} type="button" role="radio" aria-checked={method === k} className={`fchip${method === k ? ' is-on' : ''}`} onClick={() => setMethod(k)}>
            {w}
          </button>
        ))}
      </div>
      <div className="markpaid__grid">
        <label className="field">
          <span>Amount ($)</span>
          <input className="input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </label>
        <label className="field">
          <span>Hours</span>
          <input className="input" inputMode="numeric" value={hours} onChange={(e) => setHours(e.target.value)} required />
        </label>
      </div>
      <label className="field">
        <span>Note (optional)</span>
        <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Zelle from Ana R., Oct 24" />
      </label>
      <InlineError error={err} />
      <div className="row">
        <button className="btn btn--primary btn--sm" disabled={busy || !amount || !hours}>
          {busy ? 'Saving…' : 'Mark as paid'}
        </button>
        {onCancel && (
          <button type="button" className="btn btn--ghost btn--sm" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
