import { useState } from 'react'
import { CIRCLED } from '../lib'

// CONTRACT v3 Lesson: hidden from students; the tutor edits the probe ladder, look-fors,
// friend nudge and scope. Every other lesson field (spoilers, standard, attribution, …) is kept.

const RUNGS = 4

// Editable chips: × removes one, Enter (or comma) adds one.
export function ChipsEdit({ label, items = [], onChange, placeholder, idPrefix }) {
  const [text, setText] = useState('')
  const add = () => {
    const v = text.trim().replace(/,$/, '').trim()
    if (!v) return
    if (!items.includes(v)) onChange([...items, v])
    setText('')
  }
  return (
    <div className="chips-edit">
      <span className="label" id={`${idPrefix}-label`}>
        {label}
      </span>
      <ul className="chips-edit__list" aria-labelledby={`${idPrefix}-label`}>
        {items.map((it, i) => (
          <li key={`${it}-${i}`} className="chip chips-edit__chip">
            <span className="chips-edit__text">{it}</span>
            <button
              type="button"
              className="chips-edit__x"
              aria-label={`Remove “${it}” from ${label.toLowerCase()}`}
              onClick={() => onChange(items.filter((_, j) => j !== i))}
            >
              ×
            </button>
          </li>
        ))}
        {items.length === 0 && <li className="small subtle">None yet.</li>}
      </ul>
      <input
        className="input input--quiet"
        value={text}
        placeholder={placeholder}
        aria-label={`Add to ${label.toLowerCase()}`}
        onChange={(e) => setText(e.target.value)}
        onBlur={add}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ',') && !e.nativeEvent.isComposing) {
            e.preventDefault()
            add()
          }
        }}
      />
    </div>
  )
}

export function ConceptLessonEdit({ lc, n, conceptText, onChange, defaultOpen }) {
  const ladder = Array.from({ length: Math.max(RUNGS, lc.probe_ladder?.length ?? 0) }, (_, k) => lc.probe_ladder?.[k] ?? '')
  const setRung = (k, v) => onChange({ ...lc, probe_ladder: ladder.map((r, j) => (j === k ? v : r)) })
  const step = n + 1
  return (
    <details className="lesson-edit" open={defaultOpen}>
      <summary className="lesson-edit__sum">
        <span>How Pip asks about step {CIRCLED[n] ?? step}</span>
        <span className="small subtle mono">
          {ladder.filter((r) => r.trim()).length} questions · {(lc.look_fors ?? []).length} look-fors
        </span>
      </summary>
      <div className="lesson-edit__body stack-sm">
        <p className="small subtle">
          Pip asks these in order, one at a time, until {conceptText ? `“${conceptText}”` : 'this step'} is explained with a
          reason.
        </p>
        <ol className="ladder-edit">
          {ladder.map((r, k) => (
            <li key={k} className="ladder-edit__rung">
              <span className="ladder-edit__n mono" aria-hidden>
                {k + 1}
              </span>
              <input
                className="input"
                aria-label={`Pip’s question ${k + 1} for step ${step}`}
                value={r}
                onChange={(e) => setRung(k, e.target.value)}
              />
            </li>
          ))}
        </ol>
        <ChipsEdit
          idPrefix={`lf-${n}`}
          label="Look-fors"
          items={lc.look_fors ?? []}
          placeholder="Add what a good explanation mentions"
          onChange={(v) => onChange({ ...lc, look_fors: v })}
        />
        <label className="field">
          <span>Friend nudge, after the last question</span>
          <input
            className="input"
            value={lc.friend_nudge ?? ''}
            placeholder="A hint framed as something a friend said, never the answer"
            onChange={(e) => onChange({ ...lc, friend_nudge: e.target.value })}
          />
        </label>
      </div>
    </details>
  )
}

export function ScopeEdit({ lesson, onChange }) {
  return (
    <fieldset className="fieldset">
      <legend className="label">What Pip will talk about</legend>
      <ChipsEdit
        idPrefix="scope-in"
        label="In scope"
        items={lesson.in_scope ?? []}
        placeholder="Add a topic Pip can discuss"
        onChange={(v) => onChange({ ...lesson, in_scope: v })}
      />
      <ChipsEdit
        idPrefix="scope-out"
        label="Out of scope"
        items={lesson.out_of_scope ?? []}
        placeholder="Add a topic Pip parks for you"
        onChange={(v) => onChange({ ...lesson, out_of_scope: v })}
      />
      <p className="small subtle">Out-of-scope questions get “Not in my brain yet.” and are noted for you.</p>
      {(lesson.standard || lesson.attribution || lesson.source) && (
        <p className="small subtle lesson-src">
          {lesson.standard && <span className="mono">{lesson.standard}</span>}
          {lesson.standard && (lesson.attribution || lesson.source) ? ' · ' : ''}
          {lesson.attribution || lesson.source}
        </p>
      )}
    </fieldset>
  )
}
