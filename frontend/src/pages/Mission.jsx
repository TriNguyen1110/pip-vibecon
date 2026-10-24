import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import { readLocal, useLoad } from '../hooks'
import QuizWait from '../components/mission/QuizWait.jsx'
import { ErrorState, Loading, Shell, useToast } from '../components/ui.jsx'
import Mascot, { MOOD_FACE } from '../components/Mascot.jsx'
import MissionCard, { nextStep } from '../components/mission/MissionCard.jsx'
import { BossHud, BossPanel } from '../components/mission/Boss.jsx'
import Chat from '../components/mission/Chat.jsx'
import { Brain, QuizResults } from '../components/mission/Brain.jsx'
import KO from '../components/mission/KO.jsx'
import { CIRCLED, findQuoteSource } from '../lib'

const TAUNTS = [
  (n) => `“Mamma mia, you will never explain it!” — ${n}`,
  (n) => `${n} is reading over your shoulder.`,
  (n) => `${n} adds the bottoms just to annoy you.`,
  (n) => `${n} is doing little stretches. Unbothered.`,
  (n) => `“Bottoms are numbers too!” — ${n}`,
]

export default function Mission() {
  const { sessionId } = useParams()
  const ctx = useLoad(async () => {
    const session = await api.session(sessionId)
    let assignment = null
    let student = null
    try {
      const d = await api.student(session.student_id)
      student = d.student
      assignment = d.assignments?.find((a) => a.id === session.assignment_id) ?? null
    } catch {
      /* mission still works with what the session carries */
    }
    return { session, assignment, student }
  }, [sessionId])

  if (ctx.loading && !ctx.data) {
    return (
      <Shell game footer={false}>
        <Loading label="Waking Pip up…" />
      </Shell>
    )
  }
  if (ctx.error && !ctx.data) {
    return (
      <Shell game>
        <div className="page page--narrow">
          <ErrorState error={ctx.error} onRetry={ctx.reload} title="Pip couldn’t find this mission." />
          <p style={{ textAlign: 'center' }}>
            <Link to="/student">Back to Pip’s room</Link>
          </p>
        </div>
      </Shell>
    )
  }
  return <MissionView key={sessionId} initial={ctx.data} />
}

function MissionView({ initial }) {
  const { assignment, student } = initial
  const [session, setSession] = useState(initial.session)
  const id = session.id
  const toast = useToast()
  const wide = useWide()
  const first = (student?.name ?? 'Maya').split(' ')[0]

  const concepts = useMemo(() => {
    if (assignment?.concepts?.length) return assignment.concepts
    return Object.keys(session.meters ?? {}).map((k) => ({ id: k, text: k, weapon: '' }))
  }, [assignment, session.meters])
  const boss = assignment?.boss ?? { name: 'The Boss', emoji: '👾', backstory: '' }
  const accessory = session.accessory ?? readLocal('pip.look', {}).accessory ?? 'none'

  const [input, setInput] = useState('')
  const [pending, setPending] = useState(null)
  const [sending, setSending] = useState(false)
  const [focus, setFocus] = useState(null)
  const [fx, setFx] = useState(null) // { kind: hit|heal|whiff, n, amount }
  const [freshWeapons, setFreshWeapons] = useState([])
  const [justFixed, setJustFixed] = useState([])
  const [missLine, setMissLine] = useState(null)
  const [taunt, setTaunt] = useState(null)
  const [reaction, setReaction] = useState(0)
  const [quizBusy, setQuizBusy] = useState(false)
  const [actionErr, setActionErr] = useState(null)
  const [reteachBusy, setReteachBusy] = useState(null)
  const [equipping, setEquipping] = useState(false)
  const [finishing, setFinishing] = useState(null)
  const [finisherErr, setFinisherErr] = useState(null)
  const [showBrainAfterKO, setShowBrainAfterKO] = useState(false)
  const [showLog, setShowLog] = useState(false)
  const [highlight, setHighlight] = useState(null)

  const endRef = useRef(null)
  const inputRef = useRef(null)
  const lastTaunt = useRef(0)
  const timers = useRef({})
  const fxN = useRef(0)
  const abortRef = useRef(null)
  const sessionRef = useRef(session)
  sessionRef.current = session

  const status = session.ko ? 'complete' : session.status
  const step = nextStep(session, concepts)
  const studentMsgs = (session.transcript ?? []).filter((m) => m.from === 'student').length
  const retaughtMsgs = session.reteach_concept
    ? (session.transcript ?? []).slice(session.reteach_from ?? 0).filter((m) => m.from === 'student').length
    : 0
  const canQuiz = session.reteach_concept ? retaughtMsgs > 0 : studentMsgs > 0

  const flash = useCallback((key, setter, value, ms) => {
    clearTimeout(timers.current[key])
    setter(value)
    timers.current[key] = setTimeout(() => setter(null), ms)
  }, [])
  useEffect(() => {
    const t = timers.current
    return () => Object.values(t).forEach(clearTimeout)
  }, [])

  // Feedback for whatever changed between two versions of the session.
  const react = useCallback(
    (prev, next) => {
      const fresh = (next.transcript ?? []).slice(prev.transcript?.length ?? 0)
      const evs = fresh.map((m) => m.event).filter(Boolean)
      const dHp = (next.boss_hp ?? 100) - (prev.boss_hp ?? 100)
      let kind = evs.find((e) => e.kind === 'hit') ? 'hit' : evs.find((e) => e.kind === 'heal') ? 'heal' : null
      if (!kind && dHp < 0) kind = 'hit'
      if (!kind && dHp > 0) kind = 'heal'
      if (!kind && evs.some((e) => e.kind === 'none')) kind = 'whiff'
      if (kind) {
        fxN.current += 1
        flash('fx', setFx, { kind, n: fxN.current, amount: Math.abs(dHp) || evs.find((e) => e.kind === kind)?.amount || 0 }, 1400)
        if (kind === 'hit') {
          setReaction((r) => r + 1)
          try {
            navigator.vibrate?.(10)
          } catch {
            /* optional */
          }
        }
      }
      const announced = evs.flatMap((e) => e.unlocked ?? [])
      const unlocked = [...new Set([...announced, ...(next.weapons ?? []).filter((w) => !(prev.weapons ?? []).includes(w))])]
      if (unlocked.length) {
        flash('fresh', setFreshWeapons, unlocked, 1200)
        // The chat already shows "Unlocked: …" for announced ones; a toast would cover the captions.
        const silent = unlocked.filter((w) => !announced.includes(w))
        if (silent.length) toast(`${silent.length > 1 ? 'Weapons' : 'Weapon'} unlocked: ${silent.join(', ')}`)
      }
      if (next.mood !== prev.mood) setReaction((r) => r + 1)
    },
    [flash, toast],
  )

  const scrollEnd = useCallback(() => {
    requestAnimationFrame(() => endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }))
  }, [])

  // Land at the newest message when returning to a conversation in progress.
  useEffect(() => {
    if (status === 'teaching' && studentMsgs > 0) {
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ block: 'end' }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // The gap report is written in the background after a K.O.; fetch it once it's needed.
  useEffect(() => {
    if (status !== 'complete' || session.gap_report) return
    let alive = true
    const t = setTimeout(() => {
      api
        .report(id)
        .then((r) => alive && setSession((s) => ({ ...s, gap_report: r })))
        .catch(() => {})
    }, 1200)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [status, session.gap_report, id])

  async function send(textArg) {
    const text = (textArg ?? input).trim()
    if (!text || sending) return
    setPending({ text })
    setInput('')
    setSending(true)
    setActionErr(null)
    setReaction((r) => r + 1) // Pip leans in
    scrollEnd()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    try {
      const next = await api.turn(id, text, ctrl.signal)
      react(sessionRef.current, next)
      setSession(next)
      setPending(null)
    } catch (e) {
      setPending({ text, failed: true, error: e })
    } finally {
      setSending(false)
      scrollEnd()
    }
  }

  function onType(v) {
    setInput(v)
    if (v.trim() && !input.trim() && Date.now() - lastTaunt.current > 20000 && status === 'teaching') {
      lastTaunt.current = Date.now()
      const pick = TAUNTS[Math.floor(Math.random() * TAUNTS.length)]
      flash('taunt', setTaunt, pick(boss.name), 2400)
    }
  }

  async function equip(w) {
    const prev = session.equipped
    setEquipping(true)
    setSession((s) => ({ ...s, equipped: w }))
    try {
      setSession(await api.equip(id, w))
    } catch (e) {
      setSession((s) => ({ ...s, equipped: prev }))
      toast(e.message)
    } finally {
      setEquipping(false)
    }
  }

  async function quiz() {
    setFx(null)
    setQuizBusy(true)
    setActionErr(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    try {
      const prev = sessionRef.current
      const next = await api.quiz(id)
      const wasWrong = new Set((prev.brain ?? []).filter((r) => r.correct === false).map((r) => r.concept_id))
      const fixedNow = (next.brain ?? []).filter((r) => r.correct && wasWrong.has(r.concept_id)).map((r) => r.id)
      if (fixedNow.length) setJustFixed(fixedNow)
      const miss = (next.quiz ?? []).find((q) => !q.passed)
      if (miss?.line) setMissLine(miss.line)
      setSession(next)
      setShowLog(false)
      if (next.ko) setReaction((r) => r + 1)
    } catch (e) {
      setActionErr(e)
    } finally {
      setQuizBusy(false)
    }
  }

  async function reteach(conceptId) {
    setReteachBusy(conceptId)
    setActionErr(null)
    try {
      const next = await api.reteach(id, conceptId)
      setSession(next)
      setFocus(conceptId)
      scrollEnd()
      setTimeout(() => inputRef.current?.focus(), 300)
    } catch (e) {
      setActionErr(e)
    } finally {
      setReteachBusy(null)
    }
  }

  async function finish(w) {
    setFinishing(w)
    setFinisherErr(null)
    try {
      setSession(await api.finisher(id, w))
      setReaction((r) => r + 1)
    } catch (e) {
      setFinisherErr(e)
    } finally {
      setFinishing(null)
    }
  }

  function jumpToSource(rule) {
    const i = Number.isInteger(rule.msg_index) && session.transcript?.[rule.msg_index]
      ? rule.msg_index
      : findQuoteSource(session.transcript, rule.quote)
    if (i < 0) {
      toast('Couldn’t find that message.')
      return
    }
    setShowLog(true)
    setTimeout(() => {
      document.getElementById(`msg-${i}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      flash('hl', setHighlight, i, 2200)
    }, 60)
  }

  function focusStep(cid) {
    setFocus(cid)
    inputRef.current?.focus({ preventScroll: true })
  }

  const focusConcept = concepts.find((c) => c.id === (session.reteach_concept ?? focus))
  const reteachIdx = concepts.findIndex((c) => c.id === session.reteach_concept)
  const placeholder = focusConcept ? `Explain to Pip: ${focusConcept.text}` : 'Explain it to Pip…'
  const typing = !!input.trim() && !sending
  const stageH = wide ? 220 : 168

  /* ---------- K.O. ---------- */
  if (status === 'complete' && !showBrainAfterKO) {
    return (
      <Shell game who={first}>
        <div className="page page--narrow">
          <KO
            session={session}
            assignment={assignment}
            concepts={concepts}
            accessory={accessory}
            nickname={first}
            pipLine={missLine ?? (session.transcript ?? []).find((m) => m.from === 'pip')?.text}
            onFinisher={finish}
            finishing={finishing}
            finisherErr={finisherErr}
            onShowBrain={() => {
              setShowBrainAfterKO(true)
              window.scrollTo(0, 0)
            }}
          />
        </div>
      </Shell>
    )
  }

  const quizzedView = status === 'quizzed' || status === 'complete' || quizBusy

  return (
    <Shell game who={first} footer={quizzedView}>
      {!quizzedView && (
        <div className="hud-wrap">
          <BossHud boss={boss} hp={session.boss_hp} equipped={session.equipped} fx={fx} taunt={taunt} />
        </div>
      )}

      <div className={`mission${quizzedView ? ' mission--exam' : ''}`}>
        <header className="mission__head">
          <div className="mission__titlebar">
            <Link to="/student" className="small back">
              ← Pip’s room
            </Link>
            {session.label && <span className="chip">{session.label}</span>}
          </div>
          <h1 className="mission__topic">{assignment?.topic ?? 'Pip mission'}</h1>
          {wide && assignment?.why_it_matters && (
            <p className="mission__why">
              <span className="eyebrow">Why this matters</span> {assignment.why_it_matters}
            </p>
          )}
        </header>
        <aside className="mission__side">
          <MissionCard
            session={session}
            assignment={assignment}
            concepts={concepts}
            focus={focus}
            compact={wide}
            onFocus={status === 'teaching' ? focusStep : null}
          />
          <div className="arena">
            <Mascot
              creature={session.creature ?? 'blob'}
              look={session.look}
              accessory={accessory}
              mood={quizBusy ? 'confused' : session.mood ?? 'confused'}
              env="arena"
              bossEmoji={boss.emoji}
              bossHp={session.boss_hp ?? 100}
              reaction={reaction}
              height={stageH}
              onTap={() => setReaction((r) => r + 1)}
            />
            <span className="arena__mood" aria-label={`Pip is ${session.mood}`}>
              {MOOD_FACE[session.mood] ?? '🤔'}
            </span>
            <span className="brain-badge arena__badge">Brain v{session.brain_version ?? 1}</span>
          </div>
          <BossPanel
            boss={boss}
            hp={session.boss_hp}
            weapons={session.weapons}
            equipped={session.equipped}
            onEquip={status === 'teaching' ? equip : null}
            equipping={equipping}
            fx={fx}
            fresh={freshWeapons ?? []}
            taunt={taunt}
          />
        </aside>

        <section className="mission__main">
          {quizzedView ? (
            <div className="exam stack">
              {status === 'complete' && (
                <button className="btn btn--ghost btn--sm" onClick={() => setShowBrainAfterKO(false)}>
                  ← Back to the K.O.
                </button>
              )}
              {quizBusy && <QuizWait boss={boss} creature={session.creature} retry={!!session.reteach_concept} />}
              <Brain
                brain={session.brain}
                concepts={concepts}
                version={session.brain_version ?? 1}
                loading={quizBusy}
                onNote={jumpToSource}
                justFixed={justFixed}
              />
              {!wide && (
                <div className="brain-pip">
                  <Mascot
                    creature={session.creature ?? 'blob'}
                    look={session.look}
                    accessory={accessory}
                    mood={quizBusy ? 'confused' : session.mood ?? 'confused'}
                    env="room"
                    reaction={reaction}
                    height={140}
                    onTap={() => setReaction((r) => r + 1)}
                  />
                </div>
              )}
              {actionErr && <ActionError error={actionErr} onRetry={quizBusy ? null : quiz} />}
              {!quizBusy && session.quiz?.length > 0 && (
                <QuizResults
                  quiz={session.quiz}
                  brain={session.brain}
                  concepts={concepts}
                  creature={session.creature}
                  onReteach={status === 'quizzed' ? reteach : null}
                  busyConcept={reteachBusy}
                  onRule={jumpToSource}
                />
              )}
              {!quizBusy && (
                <div className="log">
                  <button className="btn btn--ghost btn--sm" onClick={() => setShowLog((v) => !v)} aria-expanded={showLog}>
                    {showLog ? 'Hide' : 'Show'} what you taught Pip
                  </button>
                  {showLog && (
                    <div className="log__chat">
                      <Chat
                        transcript={session.transcript}
                        creature={session.creature}
                        mood={session.mood}
                        bossName={boss.name}
                        highlight={highlight}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="teach">
              {session.reteach_concept && (
                <div className="reteach-banner">
                  <span className="eyebrow">Re-teaching {CIRCLED[reteachIdx] ?? ''}</span>
                  <p className="small">{concepts[reteachIdx]?.text ?? ''}. Fix Pip’s rule, then let Pip retry.</p>
                  {session.quiz?.length > 0 && (
                    <p className="reteach-banner__quiz small" aria-label="Pip's exam so far">
                      {session.quiz.map((q, n) => {
                        const ci = concepts.findIndex((c) => c.id === q.concept_id)
                        return (
                          <span key={q.id ?? n} className={q.passed ? 'is-pass' : 'is-miss'}>
                            {CIRCLED[ci] ?? n + 1} {q.passed ? '💡' : '😵'}
                          </span>
                        )
                      })}
                    </p>
                  )}
                </div>
              )}
              <div className="chat-scroll">
                <Chat
                  transcript={session.transcript}
                  creature={session.creature}
                  mood={session.mood}
                  bossName={boss.name}
                  pending={pending}
                  onRetry={() => send(pending?.text)}
                  onGiveUp={() => abortRef.current?.abort()}
                  typing={typing}
                  thinking={sending}
                  highlight={highlight}
                  endRef={endRef}
                />
              </div>
              <div className="composer-wrap">
                {actionErr && <ActionError error={actionErr} onRetry={quiz} />}
                {canQuiz && (
                  <button
                    className={`btn btn--block quiz-btn${step.kind === 'quiz' || session.reteach_concept ? ' btn--primary is-ready' : ''}`}
                    onClick={quiz}
                    disabled={sending || quizBusy}
                  >
                    {session.reteach_concept ? 'Let Pip retry 🎓' : 'I’m done teaching, quiz Pip! 🎓'}
                  </button>
                )}
                <form
                  className="composer"
                  onSubmit={(e) => {
                    e.preventDefault()
                    send()
                  }}
                >
                  <textarea
                    ref={inputRef}
                    className="composer__input"
                    rows={1}
                    value={input}
                    placeholder={placeholder}
                    onChange={(e) => onType(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault()
                        send()
                      }
                    }}
                    aria-label="Message to Pip"
                    enterKeyHint="send"
                  />
                  <button className="composer__send" disabled={!input.trim() || sending} aria-label="Send to Pip">
                    ↑
                  </button>
                </form>
              </div>
            </div>
          )}
        </section>
      </div>
    </Shell>
  )
}

function useWide() {
  const q = '(min-width: 1024px)'
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches)
  useEffect(() => {
    const m = window.matchMedia(q)
    const on = () => setWide(m.matches)
    m.addEventListener('change', on)
    return () => m.removeEventListener('change', on)
  }, [])
  return wide
}

function ActionError({ error, onRetry }) {
  return (
    <div className="panel row" role="alert">
      <span className="small grow">
        <span aria-hidden>😵</span> {error?.message || 'Pip got stuck.'} Try again in a second.
      </span>
      {onRetry && (
        <button className="btn btn--sm" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  )
}
