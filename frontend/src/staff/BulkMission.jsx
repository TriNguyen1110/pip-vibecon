import { useState } from 'react'
import { Dots, InlineError } from '../components/ui.jsx'
import { ConceptLessonEdit } from '../components/LessonEdit.jsx'
import { CIRCLED, lessonIndexFor } from '../lib'
import { staffApi } from './api'
import { firstName } from './format'

const EXAMPLES = ['Area of a triangle', 'Adding fractions with unlike denominators', 'Commas and run-on sentences', 'Solving two-step equations']

// Same draft → review → save flow as NewMission, but one save copies the mission to every
// selected student (POST /api/assignments/bulk, CONTRACT v3.13).
export default function BulkMission({ students, tutorId, onClose, onSaved }) {
  const first = students[0]
  const [grade, setGrade] = useState(first?.grade ?? 6)
  const [topic, setTopic] = useState(EXAMPLES[0])
  const [draft, setDraft] = useState(null)
  const [phase, setPhase] = useState('pick') // pick | drafting | edit | saving | saved
  const [err, setErr] = useState(null)
  const [saved, setSaved] = useState([])

  const names = students.map((s) => firstName(s.name))
  const who = names.length <= 3 ? names.join(', ') : `${names.slice(0, 3).join(', ')} +${names.length - 3}`

  async function makeDraft() {
    setPhase('drafting')
    setErr(null)
    try {
      const a = await staffApi.draft({ student_id: first?.id, grade: Number(grade), topic: topic.trim() })
      setDraft({ ...a, tutor_id: a.tutor_id ?? tutorId, grade: a.grade ?? Number(grade), boss: a.boss ?? { name: '', emoji: '', backstory: '' }, concepts: (a.concepts ?? []).slice(0, 3) })
      setPhase('edit')
    } catch (e) {
      setErr(e)
      setPhase(draft ? 'edit' : 'pick')
    }
  }

  async function save() {
    setPhase('saving')
    setErr(null)
    try {
      const r = await staffApi.bulkAssign(draft, students.map((s) => s.id))
      setSaved(r.assignments ?? [])
      setPhase('saved')
      onSaved?.(r.assignments ?? [])
    } catch (e) {
      setErr(e)
      setPhase('edit')
    }
  }

  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }))
  const setConcept = (i, k, v) => setDraft((d) => ({ ...d, concepts: d.concepts.map((c, j) => (j === i ? { ...c, [k]: v } : c)) }))
  const lesson = draft?.lesson && typeof draft.lesson === 'object' ? draft.lesson : null
  const setLessonConcept = (li, lc) =>
    setDraft((d) => ({ ...d, lesson: { ...d.lesson, concepts: d.lesson.concepts.map((x, j) => (j === li ? lc : x)) } }))

  if (phase === 'saved') {
    return (
      <div className="stack mission-form">
        <p className="eyebrow">Mission assigned</p>
        <h2 className="display h-section">{draft.topic}</h2>
        <p className="muted">
          On <b>{saved.length || students.length}</b> home screens now: {who}. Each student gets their own copy and their own gap report.
        </p>
        <div className="row">
          <button className="btn btn--primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'pick' || phase === 'drafting') {
    const busy = phase === 'drafting'
    return (
      <form
        className="stack mission-form"
        onSubmit={(e) => {
          e.preventDefault()
          if (topic.trim()) makeDraft()
        }}
      >
        <div className="stack-sm">
          <p className="eyebrow">Assign to {students.length} students</p>
          <h2 className="display h-section">One mission, {students.length} copies</h2>
          <p className="muted small">{who}. Pip drafts once; you review; everyone gets their own copy.</p>
        </div>
        <div className="mission-form__grid">
          <label className="field">
            <span>Topic</span>
            <input className="input" value={topic} disabled={busy} onChange={(e) => setTopic(e.target.value)} />
          </label>
          <label className="field">
            <span>Grade</span>
            <select className="select" value={grade} disabled={busy} onChange={(e) => setGrade(e.target.value)}>
              {[5, 6, 7, 8, 9, 10, 11].map((g) => (
                <option key={g} value={g}>
                  Grade {g}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="row" style={{ gap: 8 }}>
          {EXAMPLES.map((ex) => (
            <button type="button" key={ex} className={`chip chip--btn${topic === ex ? ' is-on' : ''}`} onClick={() => setTopic(ex)} disabled={busy}>
              {ex}
            </button>
          ))}
        </div>
        <InlineError error={err} onRetry={makeDraft} />
        <div className="row row--between">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn--primary btn--lg" disabled={busy || !topic.trim()}>
            {busy ? (
              <>
                Drafting <Dots />
              </>
            ) : (
              'Draft the mission'
            )}
          </button>
        </div>
      </form>
    )
  }

  const busy = phase === 'saving'
  return (
    <form
      className="stack mission-form"
      onSubmit={(e) => {
        e.preventDefault()
        save()
      }}
    >
      <p className="eyebrow">Review · for {who}</p>
      <label className="field">
        <span>Topic</span>
        <input className="input" value={draft.topic ?? ''} onChange={(e) => set('topic', e.target.value)} />
      </label>
      <fieldset className="fieldset">
        <legend className="label">Three concepts the student must explain</legend>
        {draft.concepts.map((c, i) => (
          <div key={c.id ?? i} className="concept-edit">
            <span className="concept-edit__n" aria-hidden>
              {CIRCLED[i]}
            </span>
            <div className="stack-sm grow">
              <input className="input" aria-label={`Concept ${i + 1}`} value={c.text ?? ''} onChange={(e) => setConcept(i, 'text', e.target.value)} />
              {lesson &&
                (() => {
                  const li = lessonIndexFor(lesson, c, i)
                  return li >= 0 ? <ConceptLessonEdit lc={lesson.concepts[li]} n={i} conceptText={c.text} onChange={(lc) => setLessonConcept(li, lc)} /> : null
                })()}
            </div>
          </div>
        ))}
      </fieldset>
      <label className="field">
        <span>Misconception Pip believes at the start</span>
        <textarea className="textarea" rows={2} value={draft.misconception ?? ''} onChange={(e) => set('misconception', e.target.value)} />
      </label>
      <p className="small subtle">
        Boss: {draft.boss?.emoji} {draft.boss?.name || '—'} (student screens only)
      </p>
      <InlineError error={err} />
      <div className="row row--between mission-form__actions">
        <button type="button" className="btn btn--ghost" onClick={makeDraft} disabled={busy}>
          ↻ Regenerate
        </button>
        <button className="btn btn--primary btn--lg" disabled={busy}>
          {busy ? 'Assigning…' : `Assign to ${students.length} students`}
        </button>
      </div>
    </form>
  )
}
