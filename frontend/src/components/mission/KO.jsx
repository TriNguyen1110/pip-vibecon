import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { MuteButton, PagerControls, TalkingMascot, useBoxHeight, usePager } from '../game.jsx'
import { enqueueLine, sayLines, speak, stingLine } from '../../voice'
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

// The struck-through equation on the K.O. card: the last "lhs = rhs" in the misconception.
// "You add the tops and the bottoms, so 1/2 + 1/3 = 2/5" -> ["1/2 + 1/3", "2/5"]
// "... 2x + 6 = 20 becomes 2x = 20 + 6 and x = 13" -> ["x", "13"]
function wrongEquation(misconception = '') {
  const re = /([\d½⅓¼⅔¾/()a-z²]+(?:\s*[+\-×*]\s*[\d½⅓¼⅔¾/()a-z²]+)*)\s*=\s*([^\s,.;]+)/gi
  const all = [...misconception.matchAll(re)].filter((m) => /\d/.test(m[0]))
  const m = all.at(-1)
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
  home = '/student',
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
  const pager = usePager(3)
  const [stageBox, stageH] = useBoxHeight(180)
  const [cliffBox, cliffH] = useBoxHeight(120)
  // Pip asks its rumor question out loud on the cliffhanger beat.
  useEffect(() => {
    if (pager.i === 1 && cliff) speak(cliff)
  }, [pager.i, cliff])

  useEffect(() => {
    const t = timers.current
    return () => t.forEach(clearTimeout)
  }, [])
  // Announcer stings: "K.O." on the stamp, "BRAIN UPGRADED" once the card shows (3 s apart).
  useEffect(() => {
    if (phase === 'stamp') sayLines([stingLine('K.O.')])
    if (phase !== 'card') return
    const t = setTimeout(() => {
      const s = stingLine('BRAIN UPGRADED')
      if (s) enqueueLine(s)
    }, 2200)
    return () => clearTimeout(t)
  }, [phase])
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
            : (PLAIN[c.status] ?? c.status),
        }))

  if (phase !== 'card') {
    return (
      <div className={`ko ko--fight ko--${phase} game play-screen`} onClick={skip}>
        <div className="ko__stage" ref={stageBox}>
          {stageH > 0 && (
            <TalkingMascot
              creature={session.creature ?? 'blob'}
              look={session.look}
              accessory={accessory}
              vibe={session.vibe}
              mood="proud"
              env="arena"
              framing="hero"
              bossEmoji={boss.emoji}
              bossName={boss.name}
              bossHp={phase === 'fight' ? 8 : 0}
              reaction={react}
              height={stageH}
            />
          )}
          {phase === 'stamp' && (
            <span className="ko__stamp" aria-hidden>
              K.O.
            </span>
          )}
        </div>
        {phase === 'fight' ? (
          <section className="ko__pick">
            <h1 className="ribbon ko__ribbon">Pick a finishing move</h1>
            <p className="ko__sub">{boss.name} is wobbling.</p>
            <div className="ko__weapons">
              {weapons.map((w) => (
                <button key={w} className="weapon gel-btn gel-btn--win" disabled={!!finishing} onClick={() => pick(w)}>
                  {w}
                </button>
              ))}
            </div>
            <InlineError error={finisherErr} />
          </section>
        ) : (
          <section className="ko__pick" role="status">
            <h1 className="ko__title">{boss.name} has left Pip’s brain.</h1>
            {session.finisher && <p className="ko__finisher">{finisherCaption(session.finisher, boss.name)}</p>}
            <span className="sticker sticker--chrome">
              Brain v{prevV} → v{v}
            </span>
            {session.finisher && <p className="ko__skip">Tap to skip</p>}
          </section>
        )}
      </div>
    )
  }

  // Beats after the stamp: 3 the card, 4 the cliffhanger, 5 what Ms. Rivera sees.
  return (
    <div className="ko ko--card game play-screen">
      <header className="game-top hud">
        <Link to={home} className="gel-btn gel-btn--secondary icon-btn" aria-label="Pip’s room" title="Pip’s room">
          <span aria-hidden>🏠</span>
        </Link>
        <div className="hud__title">
          <span className="hud__name">Mission complete</span>
        </div>
        <div className="hud__right">
          <MuteButton />
        </div>
      </header>
      <div className="ko__beats snap-x" ref={pager.ref}>
        <section className="ko-beat ko-beat--card" aria-label="Your K.O. card">
          <div className="ko__version" aria-label={`Brain upgraded from version ${prevV} to ${v}`}>
            <span className="sticker sticker--chrome brain-badge--old">Brain v{prevV}</span>
            <span aria-hidden>→</span>
            <span className="sticker sticker--chrome brain-badge--new">Brain v{v}</span>
            <Glints />
          </div>
          <div className="ko__cardwrap">
            <KoCard session={session} assignment={assignment} nickname={nickname} pipLine={pipLine} />
            <p className="ko__hint">Tap the card to flip it. It’s yours to keep.</p>
          </div>
        </section>

        <section className="ko-beat ko-beat--cliff" aria-label="Next time">
          <div className="ko-cliff__stage" ref={cliffBox}>
            {cliffH > 0 && (
              <TalkingMascot
                creature={session.creature ?? 'blob'}
                look={session.look}
                accessory={accessory}
                vibe={session.vibe}
                mood="confused"
                form="awakened"
                env="room"
                framing="hero"
                height={cliffH}
              />
            )}
          </div>
          {cliff && (
            <section className="cliff">
              <p className="sr-only">Pip has a question for next time</p>
              <p className="bubble bubble--pip cliff__q">{cliff}</p>
            </section>
          )}
          <section className="ko-next" aria-label="Coming up">
            <div className="silhouette">
              <span className="silhouette__shape" aria-hidden>
                👾
              </span>
              <span className="sticker">
                {/fraction|denominator/i.test(assignment?.topic ?? '') ? 'Divid████' : '████████'}
              </span>
            </div>
          </section>
        </section>

        <section className="ko-beat ko-beat--rivera" aria-label="What Ms. Rivera sees">
          <section className="panel stack rivera" aria-label="Here's what Ms. Rivera sees">
            <h2 className="rivera__title">What Ms. Rivera sees</h2>
            <p className="rivera__sub">The same thing you see. Nothing else.</p>
            {rows.length === 0 ? (
              <p>Ms. Rivera’s report is being written. It shows each step in plain words.</p>
            ) : (
              <ul className="rivera__list">
                {rows.map((r) => (
                  <li key={r.key}>
                    {r.concept && (
                      <span className="rivera__concept">
                        {r.n} {r.concept}
                      </span>
                    )}
                    <span>{r.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <div className="ko__actions">
            <button className="gel-btn gel-btn--secondary gel-btn--sm" onClick={onShowBrain}>
              Pip’s Brain
            </button>
          </div>
        </section>
      </div>
      <footer className="game-foot ko__foot">
        <PagerControls pager={pager} label="beat" />
        {pager.i < 2 ? (
          <button className="gel-btn ko__next" onClick={() => pager.go(pager.i + 1)}>
            Next ▶
          </button>
        ) : (
          <Link className="gel-btn ko__next" to={home}>
            🏠 Home
          </Link>
        )}
      </footer>
    </div>
  )
}
