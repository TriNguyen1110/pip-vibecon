import { CIRCLED } from '../../lib'
import { CREATURE_EMOJI } from '../Mascot.jsx'
import { Glints } from '../ui.jsx'

// Pip's Brain: a thought cloud of sticky notes in the student's own words.
export function Brain({ brain = [], concepts = [], version = 1, onNote, loading, justFixed = [] }) {
  const idx = (cid) => concepts.findIndex((c) => c.id === cid)
  return (
    <section className="brain" aria-label={`Pip's Brain version ${version}`}>
      <div className="brain__cloud">
        <header className="brain__head">
          <p className="eyebrow">Pip’s Brain</p>
          <span className="brain-badge">v{version}</span>
        </header>
        {loading ? (
          <div className="brain__notes">
            {[0, 1, 2].map((i) => (
              <div key={i} className="note note--ghost">
                <span className="skeleton" style={{ height: 12, width: '50%' }} />
                <span className="skeleton" style={{ height: 16, width: '90%' }} />
                <span className="skeleton" style={{ height: 16, width: '70%' }} />
              </div>
            ))}
          </div>
        ) : brain.length === 0 ? (
          <p className="brain__empty">Pip’s brain is empty. Teach it something first.</p>
        ) : (
          <div className="brain__notes">
            {brain.map((r, n) => {
              const i = idx(r.concept_id)
              const wrong = r.correct === false
              const fixed = !wrong && !!r.fixed_after
              const jumpable = !!onNote && r.msg_index !== -1
              const flip = fixed && justFixed.includes(r.id)
              return (
                <button
                  type="button"
                  key={r.id ?? n}
                  className={`note${wrong ? ' note--wrong' : ''}${fixed ? ' note--fixed' : ''}${flip ? ' is-flip' : ''}${
                    jumpable ? '' : ' note--static'
                  }`}
                  style={{ '--d': `${n * 90}ms` }}
                  onClick={jumpable ? () => onNote(r) : undefined}
                  aria-disabled={!jumpable}
                  title={jumpable ? 'Show where you said this' : undefined}
                >
                  <span className="note__tag">
                    {CIRCLED[i] ?? '•'} {concepts[i]?.text ?? r.concept_id}
                  </span>
                  <span className="note__quote">“{r.quote}”</span>
                  {wrong && <span className="note__flag note__flag--wrong">Pip believes this 😵</span>}
                  {fixed && <span className="note__flag note__flag--fixed">fixed after {r.fixed_after} re-teach</span>}
                  {flip && <Glints />}
                </button>
              )
            })}
          </div>
        )}
        <span className="brain__puff brain__puff--1" aria-hidden />
        <span className="brain__puff brain__puff--2" aria-hidden />
        <span className="brain__puff brain__puff--3" aria-hidden />
      </div>
      {!loading && brain.some((r) => r.msg_index !== -1) && onNote && (
        <p className="brain__hint small subtle">Tap a note to see where you said it.</p>
      )}
    </section>
  )
}

// Pip shows its work one line at a time (300ms apart), then its face.
function WorkLines({ text }) {
  const lines = (text ?? '').split(/(?<=[.?!])\s+(?=[A-Z0-9“"'])/).filter(Boolean)
  return (
    <p className="qitem__line mono">
      {lines.map((l, k) => (
        <span key={k} className="work-line" style={{ '--d': `${k * 300}ms` }}>
          {l}
        </span>
      ))}
    </p>
  )
}

export function QuizResults({ quiz = [], brain = [], concepts = [], creature, onReteach, busyConcept, onRule }) {
  const idx = (cid) => concepts.findIndex((c) => c.id === cid)
  const face = CREATURE_EMOJI[creature] ?? '🫧'
  return (
    <section className="quiz" aria-label="Pip's exam">
      <header className="row row--between">
        <h2 className="sec-title">
          <span aria-hidden>🎓</span> Pip’s Exam
        </h2>
        <span className="quiz__dots" aria-label={`Pip passed ${quiz.filter((q) => q.passed).length} of ${quiz.length}`}>
          {quiz.map((q, n) => (
            <i key={q.id ?? n} className={q.passed ? 'is-pass' : 'is-miss'} />
          ))}
        </span>
      </header>
      <ol className="quiz__list">
        {quiz.map((q, n) => {
          const r = q.rule_id ? brain.find((b) => b.id === q.rule_id) : null
          const ri = r ? idx(r.concept_id) : -1
          const i = idx(q.concept_id)
          const lines = (q.line ?? '').split(/(?<=[.?!])\s+/).length
          return (
            <li
              key={q.id ?? n}
              className={`qitem${q.passed ? ' qitem--pass' : ' qitem--miss'}`}
              style={{ '--d': `${n * 120}ms`, '--face-d': `${lines * 300 + 200}ms` }}
            >
              <div className="qitem__head">
                <span className="qitem__n mono">{CIRCLED[i] ?? n + 1}</span>
                <p className="qitem__q">{q.question}</p>
                <span className="qitem__face" aria-label={q.passed ? 'Pip got it' : 'Pip is stuck'}>
                  {q.passed ? '💡' : '😵'}
                </span>
              </div>
              <div className="qitem__pip">
                <span className="msg__face" aria-hidden>
                  {face}
                </span>
                <div className="stack-sm grow" style={{ minWidth: 0 }}>
                  {q.pip_answer && <p className="msg__bubble qitem__ans">{q.pip_answer}</p>}
                  {!q.passed && q.line && <WorkLines text={q.line} />}
                </div>
              </div>
              <div className="row qitem__meta">
                {r ? (
                  <button
                    type="button"
                    className={`rule-chip${r.correct === false ? ' is-wrong' : ''}`}
                    onClick={() => onRule?.(r)}
                    disabled={!onRule || r.msg_index === -1}
                  >
                    Used rule {CIRCLED[ri] ?? ''}
                  </button>
                ) : (
                  <span className="small subtle">You didn’t teach me that one.</span>
                )}
                {q.passed && <span className="qitem__ok">Pip got it</span>}
              </div>
              {!q.passed && (
                <div className="qitem__fix">
                  <p className="qitem__bug">My brain has a bug. Help me fix it.</p>
                  {onReteach && (
                    <button className="btn btn--primary" onClick={() => onReteach(q.concept_id)} disabled={!!busyConcept}>
                      {busyConcept === q.concept_id ? 'Opening…' : `Re-teach Pip ${CIRCLED[i] ?? ''}`}
                    </button>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
