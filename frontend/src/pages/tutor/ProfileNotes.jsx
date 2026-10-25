import { useState } from 'react'
import { InlineError } from '../../components/ui.jsx'
import { Toggle } from '../../staff/StudioShell.jsx'
import { staffApi } from '../../staff/api'
import { firstName, fmtWhen, subjectShort } from '../../staff/format'

// Notes are private to staff unless the tutor turns on "Share with family" (CONTRACT v3.13 rules).
export default function ProfileNotes({ profile, tutorId, tutors, onAdded }) {
  const s = profile.student
  const subjects = (profile.enrollments ?? s.enrollments ?? []).map((e) => e.subject)
  const [subject, setSubject] = useState(subjects[0] ?? 'math')
  const [text, setText] = useState('')
  const [share, setShare] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const tName = (id) => tutors?.find((t) => t.id === id)?.name ?? id
  const notes = profile.notes ?? []

  async function add(e) {
    e.preventDefault()
    if (!text.trim()) return
    setBusy(true)
    setErr(null)
    try {
      const body = { tutor_id: tutorId, subject, text: text.trim(), share_with_parent: share }
      const n = await staffApi.addNote(s.id, body)
      onAdded({ ts: new Date().toISOString(), ...body, ...n })
      setText('')
      setShare(false)
    } catch (x) {
      setErr(x)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="stack">
      <form className={`note-form${share ? ' is-shared' : ''}`} onSubmit={add}>
        <div className="row row--between">
          <label className="field note-form__subj">
            <span>Subject</span>
            <select className="select" value={subject} onChange={(e) => setSubject(e.target.value)}>
              {subjects.map((x) => (
                <option key={x} value={x}>
                  {subjectShort(x)}
                </option>
              ))}
            </select>
          </label>
          <Toggle id={`share-${s.id}`} checked={share} onChange={setShare} label="Share with family">
            <span className="note-form__vis">
              {share ? (
                <>
                  <b>Shared with family</b>
                  <span className="small subtle">{firstName(s.name)}’s guardians will see it in the parent app</span>
                </>
              ) : (
                <>
                  <b>Private to staff</b>
                  <span className="small subtle">Only tutors and the owner see it</span>
                </>
              )}
            </span>
          </Toggle>
        </div>
        <label className="sr-only" htmlFor={`note-${s.id}`}>
          Note
        </label>
        <textarea
          id={`note-${s.id}`}
          className="textarea"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={share ? 'Write it for the family: what she did, in plain words.' : 'Private note for staff.'}
        />
        <InlineError error={err} />
        <div className="row">
          <button className="btn btn--primary btn--sm" disabled={busy || !text.trim()}>
            {busy ? 'Saving…' : share ? 'Save and share' : 'Save private note'}
          </button>
        </div>
      </form>

      {notes.length === 0 ? (
        <p className="small subtle">No notes yet.</p>
      ) : (
        <ul className="notes">
          {notes.map((n) => (
            <li key={n.id} className={`note${n.share_with_parent ? ' note--shared' : ''}`}>
              <p className="note__meta small">
                <span className={`vis-tag${n.share_with_parent ? ' vis-tag--shared' : ''}`}>{n.share_with_parent ? 'Shared with family' : 'Private'}</span>
                <span className="subtle">
                  {subjectShort(n.subject)} · {tName(n.tutor_id)} · {fmtWhen(n.ts)}
                </span>
              </p>
              <p className="note__text">{n.text}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
