import { useEffect, useRef, useState } from 'react'
import { CIRCLED } from '../../lib'

export const TAUGHT = 50 // meter value at which a step counts as taught

export function nextStep(session, concepts) {
  if (!session) return { kind: 'none', text: '' }
  const n = concepts.length
  const last = CIRCLED[n - 1] ?? n
  if (session.ko || session.status === 'complete') return { kind: 'done', text: 'Boss K.O. Mission complete.' }
  if (session.status === 'quizzed') return { kind: 'reteach', text: 'Pip’s brain has a bug. Re-teach the step it missed.' }
  if (session.reteach_concept) {
    const i = concepts.findIndex((c) => c.id === session.reteach_concept)
    return { kind: 'reteach', index: i, text: `Re-teach ${CIRCLED[i] ?? ''} so Pip can fix its rule, then let Pip retry.` }
  }
  const meters = session.meters ?? {}
  const taught = concepts.filter((c) => (meters[c.id] ?? 0) >= TAUGHT).length
  const i = concepts.findIndex((c) => (meters[c.id] ?? 0) < TAUGHT)
  if (i === -1) return { kind: 'quiz', text: 'Pip has a note for every step. Then the boss, then Pip’s exam.' }
  const any = concepts.some((c) => (meters[c.id] ?? 0) > 0)
  return {
    kind: 'teach',
    index: i,
    text: any
      ? `${CIRCLED[taught] ?? taught + 1} of ${last} · then the boss · then Pip’s exam.`
      : `Start with any step. ${last} steps · then the boss · then Pip’s exam.`,
  }
}

export default function MissionCard({ session, assignment, concepts, focus, onFocus, compact }) {
  const meters = session.meters ?? {}
  const hp = session.boss_hp ?? 100
  const step = nextStep(session, concepts)
  const examActive = step.kind === 'quiz' || session.status === 'quizzed'
  const done = step.kind === 'done'
  const rail = useRef(null)

  // Bring the next step into view on the phone rail.
  useEffect(() => {
    const r = rail.current
    const el = r?.querySelector('.is-next')
    if (r && el && r.scrollWidth > r.clientWidth) r.scrollTo({ left: el.parentElement.offsetLeft - 16, behavior: 'smooth' })
  }, [step.kind, step.index])

  const quizPassed = session.quiz?.filter((q) => q.passed).length ?? 0
  return (
    <section className={`mcard glass${compact ? ' mcard--compact' : ''}`} aria-label="Mission">
      {!compact && assignment?.why_it_matters && (
        <p className="mcard__why">
          <span className="eyebrow">Why this matters</span>
          {assignment.why_it_matters}
        </p>
      )}
      <ol className="mpath" ref={rail}>
        {concepts.map((c, i) => {
          const m = Math.max(0, Math.min(100, meters[c.id] ?? 0))
          const taught = m >= TAUGHT
          const isNext = step.index === i && (step.kind === 'teach' || step.kind === 'reteach')
          return (
            <li key={c.id} className={`mpath__item${taught ? ' is-taught' : ''}`}>
              <button
                type="button"
                className={`mstep${taught ? ' is-taught' : ''}${isNext ? ' is-next' : ''}${focus === c.id ? ' is-focus' : ''}`}
                onClick={() => onFocus?.(c.id)}
                disabled={!onFocus}
                aria-label={`Step ${i + 1}: ${c.text}. Understanding ${m} percent.`}
              >
                <span className="mstep__n">{taught ? '✓' : i + 1}</span>
                <span className="mstep__text">{c.text}</span>
                <span className="meter" aria-hidden>
                  <span className="meter__fill" style={{ width: `${m}%` }} />
                </span>
              </button>
            </li>
          )
        })}
        <li className={`mpath__item${hp <= 0 || done ? ' is-taught' : ''}`}>
          <div className={`mstep mstep--boss${hp <= 0 || done ? ' is-ko' : ''}`}>
            <span className="mstep__n mstep__n--emoji" aria-hidden>
              {assignment?.boss?.emoji || '👾'}
            </span>
            <span className="mstep__text">{hp <= 0 || done ? 'K.O.' : 'Boss'}</span>
            <span className="meter meter--hp" aria-label={`Boss HP ${hp}`}>
              <span className="meter__fill" style={{ width: `${Math.max(0, hp)}%` }} />
            </span>
          </div>
        </li>
        <li className="mpath__item">
          <div className={`mstep mstep--exam${examActive ? ' is-next' : ''}${done ? ' is-taught' : ''}`}>
            <span className="mstep__n mstep__n--emoji" aria-hidden>
              🎓
            </span>
            <span className="mstep__text">Pip’s exam</span>
            <span className="mstep__sub mono">{done ? 'passed' : session.quiz?.length ? `${quizPassed}/${session.quiz.length}` : '—'}</span>
          </div>
        </li>
      </ol>
      <p className={`mcard__next mcard__next--${step.kind}`} role="status">
        <span className="mcard__arrow" aria-hidden>
          →
        </span>{' '}
        {step.text}
      </p>
    </section>
  )
}

// DESIGN_SYSTEM v2 level map: ① ② ③ → boss → exam on one dotted path. Tapping a step shows its
// name as a sticker under the map for 2.4s (absolute, so nothing moves) and focuses it.
export function LevelMap({ session, concepts, focus, onFocus, bossEmoji }) {
  const meters = session.meters ?? {}
  const hp = session.boss_hp ?? 100
  const step = nextStep(session, concepts)
  const done = step.kind === 'done'
  const [label, setLabel] = useState(null)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])
  const show = (text) => {
    clearTimeout(timer.current)
    setLabel(text)
    timer.current = setTimeout(() => setLabel(null), 2400)
  }
  const quizPassed = session.quiz?.filter((q) => q.passed).length ?? 0
  return (
    <nav className="levelmap" aria-label="Mission map">
      <ol className="mpath">
        {concepts.map((c, i) => {
          const m = Math.max(0, Math.min(100, meters[c.id] ?? 0))
          const taught = m >= TAUGHT
          const isNext = step.index === i && (step.kind === 'teach' || step.kind === 'reteach')
          return (
            <li key={c.id} className={`mpath__item${taught ? ' is-taught' : ''}`}>
              <button
                type="button"
                className={`mstep${taught ? ' is-taught' : ''}${isNext ? ' is-next' : ''}${focus === c.id ? ' is-focus' : ''}`}
                onClick={() => {
                  show(`${CIRCLED[i]} ${c.text}`)
                  onFocus?.(c.id)
                }}
                aria-label={`Step ${i + 1}: ${c.text}. Understanding ${m} percent.`}
              >
                <span className="mstep__n" aria-hidden>
                  {taught ? '✓' : i + 1}
                </span>
                <span className="meter" style={{ '--m': m }} aria-hidden />
              </button>
            </li>
          )
        })}
        <li className={`mpath__item${hp <= 0 || done ? ' is-taught' : ''}`}>
          <button
            type="button"
            className={`mstep mstep--boss${hp <= 0 || done ? ' is-ko' : ''}`}
            onClick={() => show(hp <= 0 || done ? 'Boss K.O.' : `The boss: ${hp} HP`)}
            aria-label={`Boss, ${hp} HP`}
          >
            <span aria-hidden>{bossEmoji ?? '👾'}</span>
          </button>
        </li>
        <li className="mpath__item">
          <button
            type="button"
            className={`mstep mstep--exam${step.kind === 'quiz' || session.status === 'quizzed' ? ' is-next' : ''}${done ? ' is-taught' : ''}`}
            onClick={() => show(done ? 'Pip passed its exam' : session.quiz?.length ? `Pip’s exam: ${quizPassed}/${session.quiz.length}` : 'Then Pip’s exam')}
            aria-label="Pip’s exam"
          >
            <span aria-hidden>🏆</span>
          </button>
        </li>
      </ol>
      {label && (
        <span className="sticker levelmap__label" role="status" key={label}>
          {label}
        </span>
      )}
    </nav>
  )
}
