import { useState } from 'react'
import { api } from '../api'
import { setPipName } from '../identity'

// F11 (CONTRACT v3.7): "Name your Pip". One field, 16 characters, default "Pip"; skipping keeps "Pip".
// The server moderates (bad words fall back to "Pip").
export default function NamePip({ studentId, initial = 'Pip', onDone }) {
  const [name, setName] = useState(initial)
  const [busy, setBusy] = useState(false)
  async function save(e) {
    e?.preventDefault()
    const v = name.trim().slice(0, 16) || 'Pip'
    setBusy(true)
    let final = v
    try {
      const r = await api.pipName(studentId, v)
      final = r?.pip_name ?? v
    } catch {
      /* offline or older server: keep it on this device */
    }
    setPipName(final)
    setBusy(false)
    onDone?.(final)
  }
  return (
    <form className="name-pip stack" onSubmit={save}>
      <h2 className="ribbon">Name your Pip</h2>
      <p className="name-pip__sub">It answers to this from now on. You can keep “Pip”.</p>
      <input
        className="name-pip__input"
        value={name}
        maxLength={16}
        autoFocus
        aria-label="Pip's name"
        onChange={(e) => setName(e.target.value)}
      />
      <div className="name-pip__foot">
        <button type="button" className="gel-btn gel-btn--secondary gel-btn--sm" onClick={() => onDone?.(null)} disabled={busy}>
          Skip
        </button>
        <button className="gel-btn gel-btn--sm" disabled={busy}>
          {busy ? 'Saving…' : 'That’s its name'}
        </button>
      </div>
    </form>
  )
}
