import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, studentHomePath } from '../api'
import { readLocal, useLoad } from '../hooks'
import QuizWait from '../components/mission/QuizWait.jsx'
import { Dots, ErrorState, Loading, Shell, useToast } from '../components/ui.jsx'
import { LevelMap } from '../components/mission/MissionCard.jsx'
import { HudBoss, WeaponGels } from '../components/mission/Boss.jsx'
import Chat, { PipText } from '../components/mission/Chat.jsx'
import { Brain, QuizPage } from '../components/mission/Brain.jsx'
import KO from '../components/mission/KO.jsx'
import {
  Drawer,
  IconButton,
  MuteButton,
  PagerControls,
  TalkingMascot,
  useBoxHeight,
  usePager,
} from '../components/game.jsx'
import { CIRCLED, findQuoteSource, isCrit, isProcedureOnly } from '../lib'
import { enqueueLine, prefetchTTS, sayLines, setVoiceContext, speak, stingLine, tapLine, voiceForVibe } from '../voice'
import { bossKindFor } from '../components/Mascot.jsx'

// Boss taunts while she types (frontend templates using boss.name). No "!" on student screens.
const TAUNTS = [
  (n) => `“Mamma mia, you will never explain it.” — ${n}`,
  (n) => `${n} is reading over your shoulder.`,
  (n) => `${n} is doing little stretches. Unbothered.`,
  (n) => `${n} is pretending not to listen.`,
]
const FRACTION_TAUNTS = [(n) => `${n} adds the bottoms just to annoy you.`, (n) => `“Bottoms are numbers too.” — ${n}`]
// Boss lines are spoken short: the caption without its "— Name" attribution or quote marks.
const bossLine = (t = '') =>
  String(t)
    .replace(/\s+—\s+[^—]*$/, '')
    .replace(/^[^:]{1,40}:\s*(?=["“])/, '')
    .replace(/[“”"]/g, '')
    .replace(/\s*[−-]\d+\s*HP\.?$/i, '')
    .trim()
const tauntsFor = (topic = '') => (/fraction|denominator/i.test(topic) ? [...TAUNTS, ...FRACTION_TAUNTS] : TAUNTS)

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
      <Shell game footer={false} bar={false}>
        <div className="game game--center">
          <Loading label="Waking Pip up…" />
        </div>
      </Shell>
    )
  }
  if (ctx.error && !ctx.data) {
    return (
      <Shell game footer={false} bar={false}>
        <div className="game game--center">
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
  const home = studentHomePath(session.student_id)

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
  const [fx, setFx] = useState(null) // { kind: hit|heal|whiff, crit, n, amount }
  const [fcap, setFcap] = useState(null) // floating caption near the boss
  const [freshWeapons, setFreshWeapons] = useState([])
  const [justFixed, setJustFixed] = useState([])
  const [missLine, setMissLine] = useState(null)
  const [taunt, setTaunt] = useState(null)
  const [tapSay, setTapSay] = useState(null)
  const [reaction, setReaction] = useState(0)
  const [quizBusy, setQuizBusy] = useState(false)
  const [actionErr, setActionErr] = useState(null)
  const [reteachBusy, setReteachBusy] = useState(null)
  const [equipping, setEquipping] = useState(false)
  const [finishing, setFinishing] = useState(null)
  const [finisherErr, setFinisherErr] = useState(null)
  const [showBrainAfterKO, setShowBrainAfterKO] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
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
  const transcript = session.transcript ?? []
  const studentMsgs = transcript.filter((m) => m.from === 'student').length
  const retaughtMsgs = session.reteach_concept
    ? transcript.slice(session.reteach_from ?? 0).filter((m) => m.from === 'student').length
    : 0
  const canQuiz = session.reteach_concept ? retaughtMsgs > 0 : studentMsgs > 0
  const lastPip = [...transcript].reverse().find((m) => m.from === 'pip')
  const lastMe = [...transcript].reverse().find((m) => m.from === 'student')

  const flash = useCallback((key, setter, value, ms) => {
    clearTimeout(timers.current[key])
    setter(value)
    timers.current[key] = setTimeout(() => setter(null), ms)
  }, [])
  useEffect(() => {
    const t = timers.current
    return () => Object.values(t).forEach(clearTimeout)
  }, [])

  // CONTRACT v3.5: Pip's voice follows the session (vibe, grade, the Look sheet's pip_voice).
  useEffect(() => {
    setVoiceContext({
      vibe: session.vibe ?? 'cute',
      grade: student?.grade ?? null,
      pip_voice: session.pip_voice ?? voiceForVibe(session.vibe),
    })
  }, [session.vibe, session.pip_voice, student?.grade])
  const bossVoice = useMemo(
    () => ({ speaker: 'boss', boss: boss.name, boss_id: bossKindFor(boss.name, boss.emoji) }),
    [boss.name, boss.emoji],
  )

  // Pip says its newest line out loud once she has tapped (browsers need a gesture first).
  // A fresh mission opens with the announcer's "BOSS FIGHT".
  useEffect(() => {
    if (status === 'teaching' && lastPip?.text) sayLines([studentMsgs === 0 && stingLine('BOSS FIGHT'), lastPip.text])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Feedback for whatever changed between two versions of the session.
  const react = useCallback(
    (prev, next) => {
      const fresh = (next.transcript ?? []).slice(prev.transcript?.length ?? 0)
      const evs = fresh.map((m) => m.event).filter(Boolean)
      const dHp = (next.boss_hp ?? 100) - (prev.boss_hp ?? 100)
      // A level-1 explanation (steps, no reason) never damages: it reads as a whiff.
      const dealt = evs.filter((e) => !isProcedureOnly(e))
      let kind = dealt.find((e) => e.kind === 'hit') ? 'hit' : dealt.find((e) => e.kind === 'heal') ? 'heal' : null
      if (!kind && dHp < 0) kind = 'hit'
      if (!kind && dHp > 0) kind = 'heal'
      if (!kind && evs.some((e) => e.kind === 'none' || isProcedureOnly(e))) kind = 'whiff'
      if (kind) {
        fxN.current += 1
        const crit = kind === 'hit' && evs.some(isCrit)
        const amount = Math.abs(dHp) || dealt.find((e) => e.kind === kind)?.amount || 0
        flash('fx', setFx, { kind, crit, n: fxN.current, amount }, 1400)
        const ev =
          (kind === 'whiff'
            ? evs.find((e) => e.kind === 'none' || isProcedureOnly(e))
            : dealt.find((e) => e.kind === kind)) ?? {}
        flash(
          'fcap',
          setFcap,
          { kind, crit, n: fxN.current, amount, text: ev.caption, lvl1: isProcedureOnly(ev) },
          2800,
        )
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
      const unlocked = [
        ...new Set([...announced, ...(next.weapons ?? []).filter((w) => !(prev.weapons ?? []).includes(w))]),
      ]
      if (unlocked.length) {
        flash('fresh', setFreshWeapons, unlocked, 1600)
        toast(`${unlocked.length > 1 ? 'Weapons' : 'Weapon'} unlocked: ${unlocked.join(', ')}`)
      }
      if (next.mood !== prev.mood) setReaction((r) => r + 1)
      // Voices in turn, never overlapping: CRITICAL sting, Pip's line, then the boss's caption.
      const said = fresh.filter((m) => m.from === 'pip').map((m) => m.text)
      const bossEv = dealt.find((e) => (e.kind === 'hit' || e.kind === 'heal') && e.caption)
      const crit = evs.some(isCrit)
      if (said.length || bossEv || crit) {
        sayLines([
          crit && stingLine('CRITICAL'),
          said.length && said.join(' '),
          bossEv && { ...bossVoice, text: bossLine(bossEv.caption) },
        ])
      }
    },
    [flash, toast, bossVoice],
  )

  const scrollEnd = useCallback(() => {
    requestAnimationFrame(() => endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }))
  }, [])

  // History opens at the newest message.
  useEffect(() => {
    if (historyOpen || wide) requestAnimationFrame(() => endRef.current?.scrollIntoView({ block: 'end' }))
  }, [historyOpen, wide])

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
    setTapSay(null)
    setReaction((r) => r + 1) // Pip leans in
    scrollEnd()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    try {
      const next = await api.turn(id, text, ctrl.signal)
      // Prefetch Pip's voice so the bubble and the voice start together (at most 1.2s of extra wait).
      const said = (next.transcript ?? [])
        .slice(sessionRef.current.transcript?.length ?? 0)
        .filter((m) => m.from === 'pip')
        .map((m) => m.text)
        .join(' ')
      if (said) await Promise.race([prefetchTTS(said), new Promise((r) => setTimeout(r, 1200))])
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
      const list = tauntsFor(assignment?.topic)
      const pick = list[Math.floor(Math.random() * list.length)]
      const line = pick(boss.name)
      flash('taunt', setTaunt, line, 2400)
      enqueueLine({ ...bossVoice, text: bossLine(line) })
    }
  }

  function tapPip() {
    setReaction((r) => r + 1)
    if (sending) return
    const line = tapLine()
    flash('tap', setTapSay, line, 3200)
    speak(line)
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
    setFcap(null)
    setQuizBusy(true)
    setActionErr(null)
    setHistoryOpen(false)
    try {
      const prev = sessionRef.current
      const next = await api.quiz(id)
      const wasWrong = new Set((prev.brain ?? []).filter((r) => r.correct === false).map((r) => r.concept_id))
      const fixedNow = (next.brain ?? []).filter((r) => r.correct && wasWrong.has(r.concept_id)).map((r) => r.id)
      if (fixedNow.length) setJustFixed(fixedNow)
      const miss = (next.quiz ?? []).find((q) => !q.passed)
      if (miss?.line) {
        setMissLine(miss.line)
        speak(miss.line)
      }
      setSession(next)
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
      const prev = sessionRef.current
      const next = await api.reteach(id, conceptId)
      setSession(next)
      setFocus(conceptId)
      const said = (next.transcript ?? []).slice(prev.transcript?.length ?? 0).filter((m) => m.from === 'pip')
      if (said.length) speak(said.map((m) => m.text).join(' '))
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 300)
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
    const i =
      Number.isInteger(rule.msg_index) && session.transcript?.[rule.msg_index]
        ? rule.msg_index
        : findQuoteSource(session.transcript, rule.quote)
    if (i < 0) {
      toast('Couldn’t find that message.')
      return
    }
    setHistoryOpen(true)
    setTimeout(() => {
      document.getElementById(`msg-${i}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      flash('hl', setHighlight, i, 2200)
    }, 120)
  }

  function focusStep(cid) {
    setFocus(cid)
    inputRef.current?.focus({ preventScroll: true })
  }

  const focusConcept = concepts.find((c) => c.id === (session.reteach_concept ?? focus))
  const reteachIdx = concepts.findIndex((c) => c.id === session.reteach_concept)
  const placeholder = focusConcept ? `Explain to Pip: ${focusConcept.text}` : 'Explain it to Pip…'
  const typing = !!input.trim() && !sending

  /* ---------- K.O. ---------- */
  if (status === 'complete' && !showBrainAfterKO) {
    return (
      <Shell game bar={false} footer={false}>
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
          home={home}
          onShowBrain={() => setShowBrainAfterKO(true)}
        />
      </Shell>
    )
  }

  const quizzedView = status === 'quizzed' || status === 'complete' || quizBusy

  const history = (
    <Drawer
      open={historyOpen}
      column={wide && !quizzedView}
      onClose={() => setHistoryOpen(false)}
      label={quizzedView ? 'What you taught Pip' : 'Notebook'}
      className="notebook"
    >
      <div className="chat-scroll">
        <Chat
          transcript={session.transcript}
          creature={session.creature}
          mood={session.mood}
          bossName={boss.name}
          highlight={highlight}
          endRef={endRef}
        />
      </div>
    </Drawer>
  )

  const hudRight = (
    <div className="hud__right">
      <span
        className="sticker sticker--chrome hud__brain"
        aria-label={`Pip's Brain version ${session.brain_version ?? 1}`}
      >
        v{session.brain_version ?? 1}
      </span>
      <MuteButton />
    </div>
  )

  /* ---------- Pip's exam: the Brain, then one question per screen ---------- */
  if (quizzedView) {
    return (
      <Shell game bar={false} footer={false}>
        <Exam
          session={session}
          concepts={concepts}
          boss={boss}
          accessory={accessory}
          reaction={reaction}
          quizBusy={quizBusy}
          justFixed={justFixed}
          onNote={jumpToSource}
          onRule={jumpToSource}
          onReteach={status === 'quizzed' ? reteach : null}
          reteachBusy={reteachBusy}
          actionErr={actionErr}
          onRetryQuiz={quiz}
          topic={assignment?.topic}
          home={home}
          onBackToKO={status === 'complete' ? () => setShowBrainAfterKO(false) : null}
          hudRight={hudRight}
          onHistory={() => setHistoryOpen(true)}
          historyOpen={historyOpen}
        />
        {history}
      </Shell>
    )
  }

  /* ---------- Teaching: Talking-Tom stage, newest line as a speech bubble ---------- */
  const bubbleText = tapSay ?? lastPip?.text ?? ''
  const her = pending ?? (lastMe ? { text: lastMe.text } : null)
  const ready = nextReady(session, concepts) || !!session.reteach_concept

  return (
    <Shell game bar={false} footer={false}>
      <div className={`game play-screen game--mission${wide ? ' is-wide' : ''}`}>
        <header className="game-top hud">
          <Link to={home} className="gel-btn gel-btn--secondary icon-btn" aria-label="Pip’s room" title="Pip’s room">
            <span aria-hidden>🏠</span>
          </Link>
          <HudBoss boss={boss} hp={session.boss_hp} fx={fx} />
          {hudRight}
        </header>

        <div className="game-sub">
          <LevelMap
            session={session}
            concepts={concepts}
            focus={focus}
            onFocus={status === 'teaching' ? focusStep : null}
            bossEmoji={boss.emoji}
          />
        </div>

        {session.reteach_concept && (
          <div className="reteach-banner sticker sticker--progress">
            <span className="eyebrow">Re-teaching {CIRCLED[reteachIdx] ?? ''}</span>
            <span className="reteach-banner__text">{concepts[reteachIdx]?.text ?? ''}</span>
          </div>
        )}

        <Stage
          session={session}
          boss={boss}
          accessory={accessory}
          reaction={reaction}
          onTap={tapPip}
          bubble={
            sending ? (
              <p className="bubble bubble--pip speech__bubble speech__bubble--dots msg__bubble">
                <span className="sr-only">Pip is thinking…</span>
                <Dots />
              </p>
            ) : (
              <p
                className={`bubble bubble--pip speech__bubble msg__bubble${tapSay ? ' is-aside' : ''}`}
                key={bubbleText}
              >
                <span className="bubble__text">{tapSay ? tapSay : <PipText text={bubbleText} />}</span>
              </p>
            )
          }
          listening={typing}
          fcap={fcap}
          taunt={taunt}
          her={
            her && (
              <div className={`msg msg--me her-line${pending?.failed ? ' is-failed' : pending ? ' is-pending' : ''}`}>
                <div className="msg__body">
                  <p className="bubble bubble--me msg__bubble" key={her.text}>
                    {her.text}
                  </p>
                  {pending?.failed ? (
                    <p className="msg__retry">
                      Didn’t send.{' '}
                      <button className="linklike" onClick={() => send(pending.text)}>
                        Try again
                      </button>
                    </p>
                  ) : null}
                </div>
              </div>
            )
          }
          sending={sending}
          fx={fx}
          onGiveUp={() => abortRef.current?.abort()}
        />

        <div className="tray">
          {!wide && (
            <IconButton
              label="Notebook"
              className="icon-btn--sm"
              onClick={() => setHistoryOpen(true)}
              aria-expanded={historyOpen}
            >
              📓
            </IconButton>
          )}
          <div className="tray__weapons">
            <WeaponGels
              weapons={session.weapons}
              equipped={session.equipped}
              onEquip={equip}
              equipping={equipping}
              fresh={freshWeapons ?? []}
            />
          </div>
          {canQuiz && (
            <button
              className={`gel-btn gel-btn--sm quiz-btn${ready ? ' is-ready' : ' gel-btn--secondary'}`}
              onClick={quiz}
              disabled={sending || quizBusy}
            >
              {session.reteach_concept ? 'Let Pip retry ▶' : 'Quiz Pip ▶'}
            </button>
          )}
        </div>

        <div className="game-input">
          {actionErr && <ActionError error={actionErr} onRetry={quiz} />}
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
            <button
              className="composer__send gel-btn icon-btn"
              disabled={!input.trim() || sending}
              aria-label="Send to Pip"
            >
              ↑
            </button>
          </form>
        </div>
        {history}
      </div>
    </Shell>
  )
}

// Pip2D mood for the newest moment (coordinator mapping): thinking while waiting, smug (possessed)
// right after she teaches the misconception (the boss heals), aha on a level-2/3 hit, notes when
// Pip files a rule ("Saving that"), confused when Pip asks its next question.
function pipMood(session, sending) {
  if (sending) return 'thinking'
  const t = session.transcript ?? []
  let k = t.length - 1
  while (k >= 0 && t[k].from !== 'student') k--
  const tail = t.slice(k + 1)
  const evs = tail.map((m) => m.event).filter(Boolean)
  if (evs.some((e) => e.kind === 'heal')) return 'possessed'
  if (evs.some((e) => e.kind === 'hit' && (e.level ?? 2) >= 2)) return 'aha'
  const line = tail.filter((m) => m.from === 'pip').at(-1)?.text ?? ''
  if (/Saving that/i.test(line)) return 'notes'
  if (/\?\s*$/.test(line)) return 'confused'
  return session.mood ?? 'deadpan'
}

// Every step has a note: the exam is the next move.
function nextReady(session, concepts) {
  const m = session.meters ?? {}
  return concepts.length > 0 && concepts.every((c) => (m[c.id] ?? 0) >= 50)
}

function Stage({
  session,
  boss,
  accessory,
  reaction,
  onTap,
  bubble,
  listening,
  fcap,
  taunt,
  her,
  sending,
  onGiveUp,
  fx,
}) {
  const [box, h] = useBoxHeight(140)
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    if (!sending) {
      setSlow(false)
      return
    }
    const t = setTimeout(() => setSlow(true), 8000)
    return () => clearTimeout(t)
  }, [sending])
  return (
    <div className="game-stage">
      <div className="arena" ref={box}>
        {h > 0 && (
          <TalkingMascot
            creature={session.creature ?? 'blob'}
            look={session.look}
            accessory={accessory}
            vibe={session.vibe}
            mood={pipMood(session, sending)}
            env="arena"
            framing="hero"
            bossEmoji={boss.emoji}
            bossName={boss.name}
            bossHp={session.boss_hp ?? 100}
            bossFx={fx}
            reaction={reaction}
            height={h}
            onTap={onTap}
          />
        )}
      </div>
      <div className="speech msg msg--pip" aria-live="polite">
        {bubble}
        <span className="speech__tail" aria-hidden />
        {listening && !sending && <p className="speech__status">Pip is listening…</p>}
        {slow && (
          <p className="speech__status">
            Still thinking. Long thought.{' '}
            <button className="gel-btn gel-btn--secondary gel-btn--sm" onClick={onGiveUp}>
              Try again
            </button>
          </p>
        )}
        {fcap && (
          <p key={fcap.n} className={`sticker fcap fcap--${fcap.kind}${fcap.crit ? ' fcap--crit' : ''}`} role="status">
            {fcap.kind === 'hit' && <span aria-hidden>💥 </span>}
            {fcap.kind === 'heal' && <span aria-hidden>🩹 </span>}
            {fcap.crit && <b className="caption__crit">Critical. </b>}
            {fcap.text ||
              (fcap.kind === 'hit'
                ? `${boss.name} took a hit.`
                : fcap.kind === 'heal'
                  ? `${boss.name} healed.`
                  : `${boss.name} is unbothered.`)}
            {fcap.lvl1 && <span className="caption__lvl">procedure, no reason</span>}
          </p>
        )}
      </div>
      {taunt && !fcap && (
        <p className="bubble bubble--boss taunt" role="status">
          {taunt}
        </p>
      )}
      {her}
    </div>
  )
}

// The exam: page 0 is Pip's Brain, then one question per screen. Pip stands behind the pages.
function Exam({
  session,
  concepts,
  boss,
  accessory,
  reaction,
  quizBusy,
  justFixed,
  onNote,
  onRule,
  onReteach,
  reteachBusy,
  actionErr,
  onRetryQuiz,
  topic,
  home,
  onBackToKO,
  hudRight,
  onHistory,
  historyOpen,
}) {
  const quiz = session.quiz ?? []
  const pager = usePager(quizBusy ? 0 : 1 + quiz.length)
  const [box, h] = useBoxHeight(120)
  const cur = pager.i - 1
  const q = cur >= 0 ? quiz[cur] : null
  // Pip2D moods: thinking while it takes the exam, panic on a miss, aha on a pass, notes on its Brain.
  const mood = quizBusy ? 'thinking' : q ? (q.passed ? 'aha' : 'overwhelmed') : session.ko ? 'proud' : 'notes'
  // Pip reads each question's line out loud when she lands on it.
  useEffect(() => {
    if (q && !quizBusy) speak(q.passed ? `${q.pip_answer ?? ''}` : (q.line ?? q.pip_answer ?? ''))
  }, [q, quizBusy])
  return (
    <div className="game play-screen game--exam">
      <header className="game-top hud">
        {onBackToKO ? (
          <IconButton label="Back to the K.O." onClick={onBackToKO}>
            ←
          </IconButton>
        ) : (
          <Link to={home} className="gel-btn gel-btn--secondary icon-btn" aria-label="Pip’s room" title="Pip’s room">
            <span aria-hidden>🏠</span>
          </Link>
        )}
        <div className="hud__title">
          <span className="hud__name">{quizBusy ? 'Pip is taking its exam' : (topic ?? 'Pip’s exam')}</span>
          {!quizBusy && quiz.length > 0 && (
            <span
              className="quiz__dots"
              aria-label={`Pip passed ${quiz.filter((x) => x.passed).length} of ${quiz.length}`}
            >
              {quiz.map((x, n) => (
                <i key={x.id ?? n} className={x.passed ? 'is-pass' : 'is-miss'} />
              ))}
            </span>
          )}
        </div>
        {hudRight}
      </header>
      <div className="exam-area">
        <div className="exam-stage" ref={box} aria-hidden>
          {h > 0 && (
            <TalkingMascot
              creature={session.creature ?? 'blob'}
              look={session.look}
              accessory={accessory}
              vibe={session.vibe}
              mood={mood}
              env="room"
              framing="hero"
              reaction={reaction + pager.i}
              height={h}
            />
          )}
        </div>
        {quizBusy ? (
          <QuizWait boss={boss} creature={session.creature} retry={!!session.reteach_concept} topic={topic} />
        ) : (
          <div className="exam-pager snap-x quiz" ref={pager.ref}>
            <section className="exam-page exam-page--brain" aria-label="Pip's Brain">
              <h2 className="ribbon exam-ribbon">Pip’s Brain v{session.brain_version ?? 1}</h2>
              <Brain
                brain={session.brain}
                concepts={concepts}
                version={session.brain_version ?? 1}
                onNote={onNote}
                justFixed={justFixed}
              />
            </section>
            {quiz.map((x, n) => (
              <QuizPage
                key={x.id ?? n}
                q={x}
                n={n}
                brain={session.brain}
                concepts={concepts}
                onReteach={onReteach}
                busyConcept={reteachBusy}
                onRule={onRule}
              />
            ))}
          </div>
        )}
      </div>
      {actionErr && <ActionError error={actionErr} onRetry={quizBusy ? null : onRetryQuiz} />}
      {!quizBusy && (
        <footer className="game-foot exam-foot">
          <IconButton
            label="What you taught Pip"
            className="icon-btn--sm"
            onClick={onHistory}
            aria-expanded={historyOpen}
          >
            📓
          </IconButton>
          <PagerControls pager={pager} label="screen" />
          {pager.i < pager.n - 1 ? (
            <button
              className={`gel-btn exam-next${pager.i === 0 ? '' : ' gel-btn--secondary'}`}
              onClick={() => pager.go(pager.i + 1)}
            >
              {pager.i === 0 ? 'Pip’s exam ▶' : 'Next ▶'}
            </button>
          ) : (
            <span className="exam-next exam-next--spacer" />
          )}
        </footer>
      )}
    </div>
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
