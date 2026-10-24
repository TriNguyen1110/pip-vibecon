import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Mascot, { CREATURE_EMOJI } from '../Mascot.jsx'
import { Glints, InlineError } from '../ui.jsx'
import { CIRCLED } from '../../lib'

const PLAIN = {
  explained: 'You explained this in your own words.',
  vague: 'Still a bit vague. Worth another go.',
  misconception: 'Pip learned a wrong rule here.',
}

// Contract v2: finisher is {weapon, caption}; tolerate a bare string too.
function finisherCaption(f, bossName) {
  if (f && typeof f === 'object') return f.caption || `${f.weapon}. ${bossName} has left Pip’s brain.`
  return `${f}. ${bossName} has left Pip’s brain.`
}

// "You add the tops and the bottoms, so 1/2 + 1/3 = 2/5" -> ["1/2 + 1/3", "2/5"]
function wrongEquation(misconception = '') {
  const m = /([\d½⅓¼⅔¾/()a-z²]+\s*[+\-×x*]\s*[\d½⅓¼⅔¾/()a-z²]+)\s*=\s*([^\s,.;]+)/i.exec(misconception)
  return m ? [m[1], m[2]] : null
}
const pretty = (s) =>
  s
    .replace(/\b1\/2\b/g, '½')
    .replace(/\b1\/3\b/g, '⅓')
    .replace(/\b2\/5\b/g, '⅖')
    .replace(/\b1\/4\b/g, '¼')

function serial(id = '') {
  let h = 7
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 9973
  return String(h % 10000).padStart(4, '0')
}

function KoCard({ session, assignment, nickname, pipLine }) {
  const [flipped, setFlipped] = useState(false)
  const boss = assignment?.boss ?? {}
  const eq = wrongEquation(assignment?.misconception)
  const fixedRule = session.brain?.find((r) => r.fixed_after) ?? session.brain?.filter((r) => r.correct).at(-1)
  const date = new Date(session.created_at ?? Date.now()).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return (
    <button
      type="button"
      className={`ko-card${flipped ? ' is-flipped' : ''}`}
      onClick={() => setFlipped((f) => !f)}
      aria-label={flipped ? 'K.O. card, back. Tap to flip.' : 'K.O. card, front. Tap to flip.'}
    >
      <span className="ko-card__inner">
        <span className="ko-card__face ko-card__front">
          <span className="ko-card__top">
            <span className="ko-card__meta ko-card__no mono">No. {serial(session.id)}</span>
            <span className="ko-card__emoji" aria-hidden>
              {boss.emoji}
            </span>
          </span>
          <span className="ko-card__line" aria-hidden />
          <span className="ko-card__eq">
            {eq ? (
              <>
                {pretty(eq[0])} = <s>{pretty(eq[1])}</s>
              </>
            ) : (
              <s>{boss.name}</s>
            )}
          </span>
          <span className="ko-card__bottom">
            <span className="ko-card__nick">{nickname}</span>
            <span className="ko-card__meta mono">{date}</span>
          </span>
        </span>
        <span className="ko-card__face ko-card__back">
          <span className="ko-card__boss">{boss.name}</span>
          <span className="ko-card__sect">
            <span className="eyebrow">Your rule</span>
            {fixedRule && <span className="ko-card__quote">“{fixedRule.quote}”</span>}
          </span>
          {pipLine && (
            <span className="ko-card__sect">
              <span className="eyebrow">Pip said</span>
              <span className="ko-card__pip">{pipLine}</span>
            </span>
          )}
        </span>
      </span>
    </button>
  )
}

export default function KO({
  session,
  assignment,
  accessory,
  nickname,
  pipLine,
  onFinisher,
  finishing,
  finisherErr,
  onShowBrain,
}) {
  const boss = assignment?.boss ?? { name: 'The Boss', emoji: '👾' }
  const weapons = session.weapons ?? []
  // fight: pick a finishing move. hit/stamp: the loud part. card: the quiet part.
  const [phase, setPhase] = useState(session.finisher || weapons.length === 0 ? 'card' : 'fight')
  const [react, setReact] = useState(1)
  const timers = useRef([])
  const v = session.brain_version ?? 2
  const prevV = Math.max(1, v - 1)
  const report = session.gap_report
  const cliff = report?.cliffhanger ?? assignment?.cliffhanger

  useEffect(() => {
    const t = timers.current
    return () => t.forEach(clearTimeout)
  }, [])
  useEffect(() => {
    if (phase === 'stamp' && session.finisher) {
      timers.current.push(setTimeout(() => setPhase('card'), 1000))
    }
  }, [phase, session.finisher])
  useEffect(() => {
    if (phase === 'hit' && finisherErr) setPhase('fight')
  }, [phase, finisherErr])

  function pick(w) {
    setPhase('hit')
    setReact((r) => r + 1)
    try {
      navigator.vibrate?.([15, 40, 15])
    } catch {
      /* optional */
    }
    onFinisher(w)
    timers.current.push(setTimeout(() => setPhase((p) => (p === 'hit' ? 'stamp' : p)), 620))
  }
  const skip = () => {
    if ((phase === 'stamp' || phase === 'hit') && session.finisher) setPhase('card')
  }

  const rows =
    report?.student_view?.length > 0
      ? report.student_view.map((t, i) => ({ key: i, text: t }))
      : (report?.concepts ?? []).map((c, i) => ({
          key: c.concept_id ?? i,
          n: CIRCLED[i],
          concept: c.concept_text,
          text: c.fixed_after
            ? `Pip had a wrong rule. You fixed it after ${c.fixed_after} re-teach.`
            : PLAIN[c.status] ?? c.status,
        }))

  if (phase !== 'card') {
    return (
      <div className={`ko ko--fight ko--${phase}`} onClick={skip}>
        <div className="ko__stage">
          <Mascot
            creature={session.creature ?? 'blob'}
            look={session.look}
            accessory={accessory}
            mood={phase === 'fight' ? 'lightbulb' : 'celebrating'}
            env="arena"
            reaction={react}
            height={200}
          />
          <span className="ko__boss" aria-hidden>
            {boss.emoji}
          </span>
          {phase === 'stamp' && (
            <span className="ko__stamp" aria-hidden>
              K.O.
            </span>
          )}
        </div>
        {phase === 'fight' ? (
          <section className="stack ko__pick">
            <p className="eyebrow ko__eyebrow">Pip passed the exam</p>
            <h1 className="ko__title">{boss.name} is wobbling.</h1>
            <p className="muted">Pick a finishing move.</p>
            <div className="row ko__weapons">
              {weapons.map((w) => (
                <button key={w} className="weapon weapon--big" disabled={!!finishing} onClick={() => pick(w)}>
                  {w}
                </button>
              ))}
            </div>
            <InlineError error={finisherErr} />
          </section>
        ) : (
          <section className="stack ko__pick" role="status">
            <h1 className="ko__title">{boss.name} has left Pip’s brain.</h1>
            {session.finisher && <p className="ko__finisher">{finisherCaption(session.finisher, boss.name)}</p>}
            {session.finisher && <p className="small subtle">Tap to skip</p>}
          </section>
        )}
      </div>
    )
  }

  return (
    <div className="ko ko--card">
      <section className="ko__hero">
        <p className="eyebrow ko__eyebrow">Mission complete</p>
        <h1 className="ko__title">{boss.name} has left Pip’s brain.</h1>
        {session.finisher && <p className="ko__finisher">{finisherCaption(session.finisher, boss.name)}</p>}
        <div className="ko__version" aria-label={`Brain upgraded from version ${prevV} to ${v}`}>
          <span className="brain-badge brain-badge--old">Brain v{prevV}</span>
          <span aria-hidden>→</span>
          <span className="brain-badge brain-badge--new">Brain v{v}</span>
          <Glints />
        </div>
      </section>

      <div className="ko__cardwrap">
        <KoCard session={session} assignment={assignment} nickname={nickname} pipLine={pipLine} />
        <p className="small subtle">Tap the card to flip it. It’s yours to keep.</p>
      </div>

      {cliff && (
        <section className="cliff">
          <span className="msg__face" aria-hidden>
            {CREATURE_EMOJI[session.creature] ?? '🫧'}
          </span>
          <div className="stack-sm">
            <p className="label">Pip has a question for next time</p>
            <p className="msg__bubble cliff__q">{cliff}</p>
          </div>
        </section>
      )}

      <section className="ko-next" aria-label="Coming up">
        <div className="silhouette">
          <span className="silhouette__shape" aria-hidden>
            {CREATURE_EMOJI[session.creature] ?? '🫧'}
          </span>
          <span className="small subtle mono">Pip v{v + 1}</span>
        </div>
        <div className="silhouette">
          <span className="silhouette__shape" aria-hidden>
            👾
          </span>
          <span className="small subtle mono">Divid████</span>
        </div>
      </section>

      <section className="glass card stack rivera" aria-label="Here's what Ms. Rivera sees">
        <div className="stack-sm">
          <p className="eyebrow">Here’s what Ms. Rivera sees</p>
          <p className="small subtle">The same thing you see. Nothing else.</p>
        </div>
        {rows.length === 0 ? (
          <p className="small muted">Ms. Rivera’s report is being written. It shows each step in plain words.</p>
        ) : (
          <ul className="rivera__list">
            {rows.map((r) => (
              <li key={r.key}>
                {r.concept && (
                  <span className="small subtle">
                    {r.n} {r.concept}
                  </span>
                )}
                <span>{r.text}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="row ko__actions">
        <button className="btn" onClick={onShowBrain}>
          See Pip’s Brain
        </button>
        <Link className="btn btn--primary" to="/student">
          Done
        </Link>
      </div>
    </div>
  )
}
