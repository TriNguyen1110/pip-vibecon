import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Pip2D from '../../pip2d/Pip2D.jsx'
import Boss2D from '../../pip2d/Boss2D.jsx'
import { MuteButton, PagerControls, TalkingMascot, useBoxHeight, usePager } from '../game.jsx'
import { enqueueLine, sayLines, speak, stingLine } from '../../voice'
import { accessoryFor, bossKindFor } from '../Mascot.jsx'
import { InlineError } from '../ui.jsx'
import { CIRCLED } from '../../lib'
import { usePipName } from '../../identity'

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

const ITEM_NAMES = { half_pin: 'half pin', fixed_it_star: 'fixed-it star' }
const itemName = (id) => ITEM_NAMES[id] ?? String(id).replace(/_/g, ' ')

// The moment worth showing: the rule fixed after a re-teach, else the last correct one (its message index).
function fixedRuleIndex(session) {
  const r = session.brain?.find((x) => x.fixed_after) ?? session.brain?.filter((x) => x.correct).at(-1)
  return Number.isInteger(r?.msg_index) ? r.msg_index : -1
}

function serial(id = '') {
  let h = 7
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 9973
  return String(h % 10000).padStart(4, '0')
}

// The equation the card strikes: the lesson's own (ko_equation) when it has one, a hand-picked one for the
// seeded triangle demo (CONTRACT v3.6: "A = b × h"), else the last equation in the misconception.
const KO_EQUATIONS = { a_tri: ['A', 'b × h'] }
function cardEquation(assignment) {
  const own = assignment?.ko_equation
  if (Array.isArray(own) && own.length === 2) return own
  if (typeof own === 'string' && own.includes('=')) return own.split('=').map((x) => x.trim())
  return KO_EQUATIONS[assignment?.id] ?? wrongEquation(assignment?.misconception)
}

// Time on the mission, as an LCD "mm:ss" from the first to the last message.
function elapsed(session) {
  const ts = (session.transcript ?? []).map((m) => Date.parse(m.ts)).filter((x) => !Number.isNaN(x))
  const sec = ts.length > 1 ? Math.max(0, Math.round((Math.max(...ts) - Math.min(...ts)) / 1000)) : 0
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`
}

function KoCard({ session, assignment, nickname, pipLine }) {
  const [flipped, setFlipped] = useState(false)
  const pipName = usePipName()
  const v = session.brain_version ?? 2
  const prevV = Math.max(1, v - 1)
  const boss = assignment?.boss ?? {}
  const eq = cardEquation(assignment)
  const fixedRule = session.brain?.find((r) => r.fixed_after) ?? session.brain?.filter((r) => r.correct).at(-1)
  const date = new Date(session.created_at ?? Date.now()).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return (
    <button
      type="button"
      className={`ko-card kocard${flipped ? ' is-flipped' : ''}`}
      onClick={() => setFlipped((f) => !f)}
      aria-label={flipped ? 'K.O. card, back. Tap to flip.' : 'K.O. card, front. Tap to flip.'}
    >
      <span className="ko-card__inner">
        <span className="ko-card__face ko-card__front">
          <span className="kocard__top">
            <span className="mono-label">
              {pipName} · Card #{String(session.payoff?.card?.card_no ?? serial(session.id)).padStart(3, '0')}
            </span>
            <span className="mono-label ko__version" aria-label={`Brain upgraded from version ${prevV} to ${v}`}>
              ● Brain v{prevV} → Brain v{v}
            </span>
          </span>
          <span className="kocard__art scanbox">
            <span className="kocard__boss" aria-hidden>
              <Boss2D boss={bossKindFor(boss.name, boss.emoji)} state="ko" size={72} />
            </span>
            <span className="kocard__pip" aria-hidden>
              <Pip2D
                creature={session.creature ?? 'capybara'}
                vibe={session.vibe ?? 'cool'}
                accessory={accessoryFor(session.accessory, session.vibe ?? 'cool')}
                version={v}
                mood="proud"
                size={128}
                animate={false}
              />
            </span>
            <span className="kocard__ko display-x chrome-type">K.O.</span>
          </span>
          <span className="holo-line" aria-hidden />
          <span className="kgrid">
            <span>
              <span className="mono-label">Boss</span>
              <b className="kgrid__plain">{boss.name}</b>
            </span>
            <span>
              <span className="mono-label">Time</span>
              <b>{elapsed(session)}</b>
            </span>
            <span>
              <span className="mono-label">Re-teaches</span>
              <b>{String(session.reteach_count ?? 0).padStart(2, '0')}</b>
            </span>
            <span>
              <span className="mono-label">Quiz</span>
              <b>
                {(session.quiz ?? []).filter((q) => q.passed).length}/{(session.quiz ?? []).length || 3}
              </b>
            </span>
          </span>
          <span className="kocard__item">
            <span className="mono-label">{pipName} believed</span>
            <span className="kocard__eq">
              {eq ? (
                <>
                  {pretty(eq[0])} = <s>{pretty(eq[1])}</s>
                </>
              ) : (
                <s>{boss.name}</s>
              )}
            </span>
          </span>
          {fixedRule && (
            <span className="kocard__quote">
              “{fixedRule.quote}”
              <span className="mono-label">
                — {nickname}, teaching {pipName} · {date}
              </span>
            </span>
          )}
          {session.finisher && (
            <span className="kocard__item">
              <span>{typeof session.finisher === 'object' ? session.finisher.weapon : session.finisher}</span>
              <span className="lcd">Earned</span>
            </span>
          )}
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
  onShare,
  onWear,
  home = '/student',
}) {
  const boss = assignment?.boss ?? { name: 'The Boss', emoji: '👾' }
  const pipName = usePipName()
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
    if (phase === 'stamp')
      sayLines([
        stingLine('K.O.'),
        boss.lines?.ko && { speaker: 'boss', text: boss.lines.ko, boss: boss.name, boss_id: bossKindFor(boss.name, boss.emoji) },
      ])
    if (phase !== 'card') return
    const t = setTimeout(() => {
      const s = stingLine('BRAIN UPGRADED')
      if (s) enqueueLine(s)
    }, 2200)
    return () => clearTimeout(t)
    // Fire once per phase change; the boss doesn't change during the K.O.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])
  // F11 runway walk (DESIGN_SYSTEM G4 §4): the stamp opens the walk (~1.9s), then "The new look." holds for a
  // tap (or moves on by itself after a few seconds), then the quiet card.
  useEffect(() => {
    if (phase === 'stamp' && session.finisher) {
      timers.current.push(setTimeout(() => setPhase((p) => (p === 'stamp' ? 'newlook' : p)), 1900))
    }
    if (phase === 'newlook') {
      speak(`I'm v${v} now. that's on you.`)
      timers.current.push(setTimeout(() => setPhase((p) => (p === 'newlook' ? 'card' : p)), 3600))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  // Tap to skip: through the walk to the new look, and from the new look to the card.
  const skip = () => {
    if (!session.finisher) return
    if (phase === 'stamp' || phase === 'hit') setPhase('newlook')
    else if (phase === 'newlook') setPhase('card')
  }
  const payoff = session.payoff ?? null
  const newItem = payoff?.new_items?.find((x) => x !== 'fixed_it_star') ?? payoff?.new_items?.[0] ?? null
  const lookNo = String(payoff?.card?.card_no ?? Math.max(1, v - 1)).padStart(2, '0')
  const comeback = (session.reteach_count ?? 0) >= 1

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

  if (phase === 'newlook') {
    return (
      <div className="ko ko--newlook game play-screen" onClick={skip}>
        <div className="newlook__stage">
          <span className="newlook__spot" aria-hidden />
          <span className="newlook__pip" aria-hidden>
            <Pip2D
              creature={session.creature ?? 'capybara'}
              vibe={session.vibe ?? 'cool'}
              accessory={accessoryFor(newItem ? [accessory, newItem].filter((x) => x && x !== 'none') : accessory, session.vibe ?? 'cool')}
              version={v}
              pose="pose"
              mood="proud"
              size={230}
            />
          </span>
        </div>
        <section className="newlook__copy" aria-live="polite">
          <h1 className="newlook editorial">The new look.</h1>
          <div className="look-card">
            <span>
              LOOK {lookNo} — {pipName.toUpperCase()} V{v}
            </span>
            {newItem && <span>WEARING: THE {itemName(newItem).toUpperCase()}</span>}
            {comeback && (
              <span>
                FIXED IT, {session.reteach_count} RE-TEACH{session.reteach_count > 1 ? 'ES' : ''}
              </span>
            )}
          </div>
          <span className="y2k-chrome-text newlook__save" style={{ '--size': '30px' }}>
            Brain v{v}
          </span>
          {newItem && onWear && (
            <button
              type="button"
              className="gel-btn gel-btn--sm"
              onClick={(e) => {
                e.stopPropagation()
                onWear(newItem)
                setPhase('card')
              }}
            >
              Wear it
            </button>
          )}
          <p className="ko__skip">Tap to keep going</p>
        </section>
      </div>
    )
  }

  if (phase !== 'card') {
    return (
      <div className={`ko ko--fight ko--${phase} game play-screen`} onClick={skip}>
        <div className={`ko__stage${phase === 'stamp' ? ' ko__stage--walk' : ''}`} ref={stageBox}>
          {phase === 'stamp' && (
            <>
              <span className="catwalk" aria-hidden />
              <span className="strut" aria-hidden>
                <Pip2D
                  creature={session.creature ?? 'capybara'}
                  vibe={session.vibe ?? 'cool'}
                  accessory={accessoryFor(accessory, session.vibe ?? 'cool')}
                  version={v}
                  pose="strut"
                  mood="proud"
                  size={Math.round(Math.min(stageH * 0.62, 300))}
                />
              </span>
              {[0.15, 0.55, 0.95, 1.35].map((t, i) => (
                <i key={t} className={`camflash camflash--${i % 2 ? 'r' : 'l'}`} style={{ '--t': `${t}s`, top: `${18 + i * 14}%` }} aria-hidden />
              ))}
            </>
          )}
          {phase !== 'stamp' && stageH > 0 && (
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
            <>
              <span className="ko__stamp y2k-chrome-text" aria-hidden>
                K.O.
              </span>
              <span className="ko-sparkles" aria-hidden>
                <i className="y2k-star y2k-star--glint" />
                <i className="y2k-star y2k-star--glint" />
                <i className="y2k-star y2k-star--glint" />
              </span>
            </>
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
            <h1 className="ko__title">{boss.name} has left {pipName}’s brain.</h1>
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
          <div className="ko__cardwrap">
            <KoCard session={session} assignment={assignment} nickname={nickname} pipLine={pipLine} />
            <p className="ko__hint">Tap the card to flip it. It’s yours to keep.</p>
            {onShare && fixedRuleIndex(session) >= 0 && (
              <button type="button" className="gel-btn gel-btn--secondary gel-btn--sm" onClick={() => onShare(fixedRuleIndex(session))}>
                Show my family
              </button>
            )}
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
                {'████████'}
              </span>
            </div>
          </section>
        </section>

        <section className="ko-beat ko-beat--rivera" aria-label="What Ms. Rivera sees">
          <div className="ko-rivera__pip" aria-hidden>
            <TalkingMascot
              creature={session.creature ?? 'blob'}
              look={session.look}
              accessory={accessory}
              vibe={session.vibe}
              mood="proud"
              env="room"
              framing="default"
              height={170}
            />
          </div>
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
