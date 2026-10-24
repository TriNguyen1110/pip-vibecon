import { useState } from 'react'
import { api, DEMO } from '../api'
import { Dots, InlineError } from './ui.jsx'
import { CIRCLED, lessonIndexFor } from '../lib'
import { ConceptLessonEdit, ScopeEdit } from './LessonEdit.jsx'

const EXAMPLES = [
  'Adding fractions with unlike denominators',
  'Why heavier things don’t fall faster',
  'Expanding (a + b)²',
  'Commas and run-on sentences',
]

export default function NewMission({ students, tutorId, onClose, onSaved }) {
  // Maya's demo mission is pinned (a_frac); the tutor demo drafts for someone else.
  const firstId = students.find((s) => s.id !== DEMO.studentId)?.id ?? students[0]?.id ?? DEMO.studentId
  const [studentId, setStudentId] = useState(firstId)
  const student = students.find((s) => s.id === studentId)
  const [grade, setGrade] = useState(student?.grade ?? 6)
  const [topic, setTopic] = useState(EXAMPLES[1])
  const [draft, setDraft] = useState(null)
  const [phase, setPhase] = useState('pick') // pick | drafting | edit | saving | saved
  const [err, setErr] = useState(null)

  async function makeDraft() {
    setPhase('drafting')
    setErr(null)
    try {
      const a = await api.draftAssignment({ student_id: studentId, grade: Number(grade), topic: topic.trim() })
      setDraft({
        ...a,
        student_id: a.student_id ?? studentId,
        tutor_id: a.tutor_id ?? tutorId,
        grade: a.grade ?? Number(grade),
        boss: a.boss ?? { name: '', emoji: '', backstory: '' },
        concepts: (a.concepts ?? []).slice(0, 3),
      })
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
      const saved = await api.saveAssignment(draft)
      setDraft(saved)
      setPhase('saved')
      onSaved?.(saved)
    } catch (e) {
      setErr(e)
      setPhase('edit')
    }
  }

  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }))
  const setBoss = (k, v) => setDraft((d) => ({ ...d, boss: { ...d.boss, [k]: v } }))
  const setConcept = (i, k, v) =>
    setDraft((d) => ({ ...d, concepts: d.concepts.map((c, j) => (j === i ? { ...c, [k]: v } : c)) }))
  // Lesson edits keep every other lesson field (spoilers, standard, attribution) untouched.
  const setLesson = (lesson) => setDraft((d) => ({ ...d, lesson }))
  const setLessonConcept = (li, lc) =>
    setDraft((d) => ({ ...d, lesson: { ...d.lesson, concepts: d.lesson.concepts.map((x, j) => (j === li ? lc : x)) } }))
  const lesson = draft?.lesson && typeof draft.lesson === 'object' ? draft.lesson : null

  if (phase === 'saved') {
    return (
      <div className="stack mission-form">
        <p className="eyebrow">Mission saved</p>
        <h2 className="display h-section">{draft.topic}</h2>
        <p className="muted">
          It’s on {student?.name?.split(' ')[0] ?? 'the student'}’s home screen now. You’ll get a gap report when Pip takes
          its exam.
        </p>
        <div className="row">
          <button className="btn btn--primary" onClick={onClose}>
            Done
          </button>
          <button
            className="btn btn--ghost"
            onClick={() => {
              setDraft(null)
              setPhase('pick')
            }}
          >
            Assign another
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
          <p className="eyebrow">New Pip mission</p>
          <h2 className="display h-section">What should Pip learn?</h2>
          <p className="muted small">Pip drafts the concepts, the mistake it will believe, and a boss. You edit before saving.</p>
        </div>
        <div className="mission-form__grid">
          <label className="field">
            <span>Student</span>
            <select
              className="select"
              value={studentId}
              disabled={busy}
              onChange={(e) => {
                setStudentId(e.target.value)
                const s = students.find((x) => x.id === e.target.value)
                if (s) setGrade(s.grade)
              }}
            >
              {students.length === 0 && <option value={DEMO.studentId}>Maya R.</option>}
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
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
        <label className="field">
          <span>Topic</span>
          <input
            className="input"
            value={topic}
            disabled={busy}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Any math or science topic, or an SAT skill"
          />
        </label>
        <div className="row" style={{ gap: 8 }}>
          {EXAMPLES.map((ex) => (
            <button
              type="button"
              key={ex}
              className={`chip chip--btn${topic === ex ? ' is-on' : ''}`}
              onClick={() => setTopic(ex)}
              disabled={busy}
            >
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
        {busy && <p className="subtle small">This takes a few seconds.</p>}
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
      <div className="stack-sm">
        <p className="eyebrow">Review the draft · {student?.name ?? ''}</p>
        <label className="field">
          <span>Topic</span>
          <input className="input" value={draft.topic ?? ''} onChange={(e) => set('topic', e.target.value)} />
        </label>
      </div>
      <label className="field">
        <span>Why this matters</span>
        <input className="input" value={draft.why_it_matters ?? ''} onChange={(e) => set('why_it_matters', e.target.value)} />
      </label>

      <fieldset className="fieldset">
        <legend className="label">Three concepts the student must explain</legend>
        {draft.concepts.map((c, i) => (
          <div key={c.id ?? i} className="concept-edit">
            <span className="concept-edit__n" aria-hidden>
              {CIRCLED[i]}
            </span>
            <div className="stack-sm grow">
              <input
                className="input"
                aria-label={`Concept ${i + 1}`}
                value={c.text ?? ''}
                onChange={(e) => setConcept(i, 'text', e.target.value)}
              />
              <input
                className="input input--quiet"
                aria-label={`Weapon unlocked by concept ${i + 1}`}
                value={c.weapon ?? ''}
                placeholder="Weapon it unlocks"
                onChange={(e) => setConcept(i, 'weapon', e.target.value)}
              />
              {lesson &&
                (() => {
                  const li = lessonIndexFor(lesson, c, i)
                  return li >= 0 ? (
                    <ConceptLessonEdit
                      lc={lesson.concepts[li]}
                      n={i}
                      conceptText={c.text}
                      defaultOpen={i === 0}
                      onChange={(lc) => setLessonConcept(li, lc)}
                    />
                  ) : null
                })()}
            </div>
          </div>
        ))}
      </fieldset>

      <label className="field">
        <span>Misconception Pip believes at the start</span>
        <textarea className="textarea" rows={2} value={draft.misconception ?? ''} onChange={(e) => set('misconception', e.target.value)} />
      </label>

      {lesson && <ScopeEdit lesson={lesson} onChange={setLesson} />}

      <fieldset className="fieldset boss-edit">
        <legend className="label">The boss (student screens only)</legend>
        <div className="boss-edit__row">
          <input
            className="input boss-edit__emoji"
            aria-label="Boss emoji"
            value={draft.boss.emoji ?? ''}
            onChange={(e) => setBoss('emoji', e.target.value)}
          />
          <input
            className="input grow"
            aria-label="Boss name"
            value={draft.boss.name ?? ''}
            onChange={(e) => setBoss('name', e.target.value)}
          />
        </div>
        <textarea
          className="textarea"
          rows={2}
          aria-label="Boss backstory"
          value={draft.boss.backstory ?? ''}
          onChange={(e) => setBoss('backstory', e.target.value)}
        />
      </fieldset>

      <div className="mission-form__grid">
        <label className="field">
          <span>Root prerequisite</span>
          <input className="input" value={draft.root_prerequisite ?? ''} onChange={(e) => set('root_prerequisite', e.target.value)} />
        </label>
        <label className="field">
          <span>Pip’s cliffhanger</span>
          <input className="input" value={draft.cliffhanger ?? ''} onChange={(e) => set('cliffhanger', e.target.value)} />
        </label>
      </div>

      <InlineError error={err} />
      <div className="row row--between mission-form__actions">
        <button type="button" className="btn btn--ghost" onClick={makeDraft} disabled={busy}>
          ↻ Regenerate
        </button>
        <button className="btn btn--primary btn--lg" disabled={busy}>
          {busy ? 'Saving…' : 'Save mission'}
        </button>
      </div>
    </form>
  )
}
