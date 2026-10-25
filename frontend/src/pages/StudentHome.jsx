import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api, DEMO, DEMO_STUDENTS, PINNED_MISSIONS, orderMissions } from '../api'
import { readLocal, useLoad, writeLocal } from '../hooks'
import { ErrorState, InlineError, Shell, Sheet, Wordmark, useToast } from '../components/ui.jsx'
import { DEFAULT_CREATURE, bossKindFor, lookForCreature } from '../components/Mascot.jsx'
import Boss2D from '../pip2d/Boss2D.jsx'
import { noteGrade, setStudentTheme } from '../theme'
import { Drawer, MuteButton, TalkingMascot, useBoxHeight } from '../components/game.jsx'
import { pokeLine, setVoiceContext, speak, tapLine, usePipSpeaking, voiceForVibe } from '../voice'
import { Scene2D, sceneFor } from '../scenes'
import MascotPicker from '../components/MascotPicker.jsx'
import StyleGrid from '../components/StyleGrid.jsx'
import FamilyView from '../components/FamilyView.jsx'
import NamePip from '../components/NamePip.jsx'
import { setPipName, usePipName } from '../identity'

// `?as=s005` switches the demo student (Maya stays the default). Keyed so nothing from the
// previous student flashes while the next one loads.
export default function StudentHome() {
  const [params, setParams] = useSearchParams()
  const sid = params.get('as') || DEMO.studentId
  // A demo switch is not the student opening Pip on their own, so it doesn't record an open.
  const switched = useRef(false)
  const pick = (id) => {
    switched.current = true
    setParams(id === DEMO.studentId ? {} : { as: id }, { replace: true })
  }
  // ?preview=1 (the landing page's live phone) is a demo, not the student opening Pip.
  const preview = params.get('preview') === '1'
  return <StudentHomeView key={sid} sid={sid} onSwitch={pick} recordOpen={!switched.current && !preview} />
}

// The drop card's one line: what Pip believes and who lives in that rule.
function dropLine(a, pipName) {
  const claim = String(a?.misconception ?? '').split(/,| so |;|\.\s/)[0].trim()
  const rule = claim ? claim.charAt(0).toLowerCase() + claim.slice(1) : 'something wrong'
  return `${pipName} thinks ${rule}. ${a?.boss?.name ?? 'The boss'} is living in that rule.`
}

// Demo: switch the student (no <select> on Play screens; a sheet of gels instead).
function StudentSwitch({ sid, onSwitch, onClose }) {
  return (
    <div className="stack switch-sheet">
      <h2 className="ribbon">Try another student</h2>
      {DEMO_STUDENTS.map((s) => (
        <button
          key={s.id}
          type="button"
          className={`gel-btn gel-btn--secondary switch-choice${s.id === sid ? ' is-on' : ''}`}
          aria-pressed={s.id === sid}
          onClick={() => {
            onClose()
            if (s.id !== sid) onSwitch(s.id)
          }}
        >
          {s.label}
        </button>
      ))}
    </div>
  )
}

function StudentHomeView({ sid, onSwitch, recordOpen }) {
  const data = useLoad(() => api.student(sid), [sid])
  const opened = useRef(false)
  const navigate = useNavigate()
  const [look, setLook] = useState(() =>
    readLocal('pip.look', { creature: DEFAULT_CREATURE, accessory: 'none', vibe: 'cool' }),
  )
  const [picker, setPicker] = useState(null) // { assignment } | { editOnly: true }
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const [react, setReact] = useState(0)
  const [say, setSay] = useState(null)
  // TOM-1: Pip talks while its line plays (or shows, muted/offline); idle otherwise (pokes react inside Pip2D).
  const pipSpeaking = usePipSpeaking()
  const homeState = pipSpeaking || say ? 'talking' : 'idle'
  const [sheet, setSheet] = useState(null) // vault | missions | switch | style
  const [afterStyle, setAfterStyle] = useState(null) // the mission to open once the vibe grid is done
  const greeted = useRef(false)
  const sayTimer = useRef(null)
  const [stageBox, stageH] = useBoxHeight(120)
  const [cardBox, cardH] = useBoxHeight(0)

  useEffect(() => {
    if (opened.current || !recordOpen) return
    opened.current = true
    api.openApp(sid).catch(() => {})
  }, [sid, recordOpen])

  const student = data.data?.student
  const first = (student?.name ?? (sid === DEMO.studentId ? 'Maya' : '')).split(' ')[0]
  const sessions = useMemo(() => data.data?.sessions ?? [], [data.data])
  // DATA-1: each student's newest showcase mission is pinned first (Maya: a_tri, Theo: a_trig).
  const assignments = useMemo(() => orderMissions(data.data?.assignments ?? []), [data.data])

  const missions = useMemo(
    () =>
      assignments.map((a) => {
        const mine = sessions.filter((s) => s.assignment_id === a.id && !s.saved)
        const active = mine.filter((s) => s.status !== 'complete').at(-1)
        const done = mine.filter((s) => s.status === 'complete').at(-1)
        return { a, active, done }
      }),
    [assignments, sessions],
  )
  const saved = sessions.filter((s) => s.saved)
  const vault = sessions.filter((s) => !s.saved && (s.ko || s.status === 'complete'))
  const bossFor = (s) => assignments.find((a) => a.id === s.assignment_id)?.boss
  const latest = sessions.filter((s) => !s.saved).at(-1)
  const cliff = vault.length
    ? (vault.at(-1).gap_report?.cliffhanger ??
      assignments.find((a) => a.id === vault.at(-1).assignment_id)?.cliffhanger)
    : null
  const brainV = Math.max(1, ...sessions.filter((s) => !s.saved).map((s) => s.brain_version ?? 1))
  const greeting = cliff
    ? `I’ve been thinking about something. “${cliff}”`
    : 'I don’t know much yet. That’s why I need you.'
  useEffect(() => () => clearTimeout(sayTimer.current), [])

  const satHome = (data.data?.assignments ?? []).some((a) => PINNED_MISSIONS.includes(a.id) && /^a_sat/.test(a.id))
  useEffect(() => noteGrade(student?.grade, satHome), [student?.grade, satHome])
  useEffect(() => {
    if (student?.pip_name) setPipName(student.pip_name)
  }, [student?.pip_name])
  const pipName = usePipName()
  const [naming, setNaming] = useState(null) // the look waiting for "Name your Pip" before the mission starts
  const toast = useToast()
  useEffect(() => {
    const evs = (student?.events ?? []).filter((e) => e.kind === 'family_shared')
    const seenKey = `pip.familySeen.${sid}`
    const seen = new Set(readLocal(seenKey, []))
    const fresh = evs.filter((e) => !seen.has(e.id ?? e.ts))
    if (!fresh.length) return
    toast(`${fresh.at(-1).from?.name ?? 'Ms. Rivera'} shared this with your family.`)
    writeLocal(seenKey, [...seen, ...fresh.map((e) => e.id ?? e.ts)])
  }, [student?.events, sid, toast])
  useEffect(() => {
    setVoiceContext({
      vibe: look.vibe ?? 'cute',
      pip_voice: look.pip_voice ?? voiceForVibe(look.vibe),
      grade: student?.grade ?? null,
    })
  }, [look.vibe, look.pip_voice, student?.grade])

  // F17: first run shows "pick your vibe" before the look picker. Maya (the demo) skips it: her style is
  // pre-picked so the demo path stays fast; it's always in the Look sheet.
  const styleKey = `pip.styleDone.${sid}`
  const needsStyle = sid !== DEMO.studentId && !student?.style && !readLocal(styleKey, false)
  function openMission(a) {
    if (needsStyle) {
      setAfterStyle(a)
      setSheet('style')
    } else setPicker({ assignment: a })
  }
  function styleFinished(res) {
    writeLocal(styleKey, true)
    if (res?.theme) setStudentTheme(res.theme)
    if (res?.vibe) {
      const next = { ...look, vibe: res.vibe }
      setLook(next)
      writeLocal('pip.look', next)
    }
    setSheet(null)
    if (afterStyle) {
      setPicker({ assignment: afterStyle })
      setAfterStyle(null)
    }
  }

  // First tap on Pip: the greeting. After that: a short deadpan line. Every spoken line also shows as a
  // caption (D-35), sound on or off, for as long as it takes to read.
  function tapPip(zone) {
    setReact((r) => r + 1)
    let line
    if (!greeted.current) {
      greeted.current = true
      line = `Hi ${first}. ${greeting}`
    } else {
      line = typeof zone === 'string' ? pokeLine(zone) : tapLine()
    }
    clearTimeout(sayTimer.current)
    setSay(line)
    sayTimer.current = setTimeout(() => setSay(null), Math.min(6000, Math.max(3200, 900 + line.length * 45)))
    speak(line)
  }

  async function start({ creature, accessory, vibe = 'cute', pip_voice = null }, named = false) {
    const next = { creature, accessory, vibe, pip_voice }
    setLook(next)
    writeLocal('pip.look', next)
    // F11: first run asks for Pip's name once (not on the demo student's path, where Pip keeps "Pip").
    const nameKey = `pip.named.${sid}`
    if (!picker?.editOnly && !named && sid !== DEMO.studentId && !readLocal(nameKey, false)) {
      setNaming({ look: next, assignment: picker?.assignment })
      setPicker(null)
      return
    }
    if (picker?.editOnly) {
      // Keep missions in progress in step with the new voice (CONTRACT v3.5).
      sessions
        .filter((s) => !s.saved && s.status !== 'complete')
        .forEach((s) => api.setVoice(s.id, pip_voice ?? voiceForVibe(vibe)).catch(() => {}))
      setPicker(null)
      setReact((r) => r + 1)
      return
    }
    const target = picker?.assignment ?? naming?.assignment
    if (!target) return
    setBusy(true)
    setErr(null)
    try {
      const s = await api.createSession({
        assignment_id: target.id,
        student_id: sid,
        look: lookForCreature(creature),
        creature,
        accessory,
        vibe,
        pip_voice: pip_voice ?? voiceForVibe(vibe),
      })
      navigate(`/student/mission/${s.id}`)
    } catch (e) {
      setErr(e)
      setBusy(false)
    }
  }

  // The current mission: in progress first, then the first one not yet beaten (seeded ones are pinned).
  const current = missions.find((m) => m.active) ?? missions.find((m) => !m.done) ?? missions[0] ?? null

  return (
    <Shell game bar={false} footer={false}>
      <div className="game play-screen game--home game--home2">
        <header className="home2-top">
          <Wordmark size={26} />
          <div className="home2-top__right">
            <span className="lcd" aria-label={`${pipName}'s Brain version ${brainV}, taught by ${first}`}>
              Brain v{brainV}
            </span>
            <MuteButton />
            <button
              type="button"
              className="home2-avatar"
              aria-label="Try another student"
              title="Try another student"
              onClick={() => setSheet('switch')}
            >
              {(first || '?').charAt(0)}
            </button>
          </div>
        </header>

        <h1 className="sr-only">{first ? `Hi ${first}.` : 'Hi.'}</h1>

        {data.loading && !data.data ? (
          <p className="drop__desc">Finding your missions…</p>
        ) : data.error && !data.data ? (
          <ErrorState error={data.error} onRetry={data.reload} title="Pip lost the thread." />
        ) : current ? (
          <>
            {/* TOM-1: Pip front and center in today's scene (a Talking Tom home); poke it for a dry line. */}
            <div className="home-stage home-tom" data-pip-state={homeState} style={{ '--card-h': `${cardH}px` }}>
              <Scene2D
                scene={sceneFor({ assignmentId: current.a.id, scene: current.a.scene ?? current.a.lesson?.scene })}
                theme="night"
                className="home-tom__scene"
                variant="lite"
              />
              <div className="home-stage__room" ref={stageBox}>
                {stageH > 0 && (
                  <TalkingMascot
                    creature={look.creature}
                    look={look.creature}
                    accessory={look.accessory}
                    vibe={look.vibe ?? 'cool'}
                    version={brainV}
                    mood={latest?.mood === 'celebrating' ? 'celebrating' : 'deadpan'}
                    env="room"
                    framing="tom"
                    state={homeState}
                    reaction={react}
                    height={stageH}
                    onTap={tapPip}
                  />
                )}
              </div>
              {say && (
                <p className="drop__say" key={say} aria-live="polite">
                  {say}
                </p>
              )}
              {/* D-33: the card sits over the bottom of the scene, so Pip gets the height and stands on it. */}
              <article
                ref={cardBox}
                className={`mission-tile home-current drop drop--compact${current.active ? ' is-active' : ''}`}
              >
                <div className="drop__row">
                  <span className="drop__thumb scanbox" aria-hidden>
                    <Boss2D boss={bossKindFor(current.a.boss?.name, current.a.boss?.emoji)} state="smug" size={48} />
                  </span>
                  <div className="drop__body">
                    <span className="mono-label drop__label">
                      ● {current.active ? 'In progress' : current.done ? 'Done' : 'Today’s drop'} · Mission{' '}
                      {String(missions.indexOf(current) + 1).padStart(2, '0')}/{String(missions.length).padStart(2, '0')} · ~6 min
                    </span>
                    <h3 className="drop__title display-x chrome-type home-current__topic">{current.a.topic}</h3>
                    <p className="drop__desc">{dropLine(current.a, pipName)}</p>
                  </div>
                </div>
                {current.active ? (
                  <Link className="gel-btn gel-btn--lg home-play" to={`/student/mission/${current.active.id}`}>
                    Keep teaching
                  </Link>
                ) : current.done ? (
                  <Link className="gel-btn gel-btn--lg home-play" to={`/student/mission/${current.done.id}`}>
                    See the K.O.
                  </Link>
                ) : (
                  <button className="gel-btn gel-btn--lg home-play" onClick={() => openMission(current.a)}>
                    Teach {pipName}
                  </button>
                )}
              </article>
            </div>
          </>
        ) : (
          <p className="drop__desc">No missions yet. Your tutor will send one.</p>
        )}

        <nav className="tabs" aria-label="Pip">
          <button type="button" className="tab on" aria-current="page">
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M3 11 12 4l9 7v9H3z" />
            </svg>
            Home
          </button>
          <button type="button" className="tab" onClick={() => setSheet('missions')} aria-label="Missions">
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M4 6h16M4 12h16M4 18h10" />
            </svg>
            Missions
          </button>
          <button type="button" className="tab" onClick={() => setSheet('vault')} aria-label="The vault">
            <svg viewBox="0 0 24 24" aria-hidden>
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <path d="M4 10h16" />
            </svg>
            Vault
          </button>
          <button type="button" className="tab" onClick={() => setPicker({ editOnly: true })} aria-label="Change Pip’s look">
            <svg viewBox="0 0 24 24" aria-hidden>
              <circle cx="12" cy="12" r="8" />
              <path d="M12 8v8M8 12h8" />
            </svg>
            Look
          </button>
        </nav>
      </div>

      <Drawer open={sheet === 'vault'} onClose={() => setSheet(null)} label="The vault">
        <div className="stack shelf-drawer">
          {vault.length === 0 ? (
            <p>Nothing here yet. Bosses you knock out end up in the vault.</p>
          ) : (
            <div className="shelf">
              {vault.map((s) => (
                <Link key={s.id} to={`/student/mission/${s.id}`} className="shelf__item" title={bossFor(s)?.name}>
                  <span className="shelf__emoji" aria-hidden>
                    {bossFor(s)?.emoji ?? '👾'}
                  </span>
                  <span>{bossFor(s)?.name ?? 'Boss'}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Drawer>

      <Drawer open={sheet === 'missions'} onClose={() => setSheet(null)} label="Missions">
        <ul className="mission-list">
          {missions.map(({ a, active, done }) => (
            <li key={a.id} className="mission-row panel">
              <span className="mission-row__boss" aria-hidden>
                {a.boss?.emoji ?? '👾'}
              </span>
              <span className="mission-row__copy">
                <span className="mission-row__state">
                  {done ? 'Defeated' : active ? 'In progress' : 'New mission'}
                  {a.boss?.name ? ` · ${a.boss.name}` : ''}
                </span>
                <span className="mission-row__topic">{a.topic}</span>
              </span>
              {active ? (
                <Link className="gel-btn gel-btn--sm gel-btn--secondary" to={`/student/mission/${active.id}`} aria-label={`Play ${a.topic}`}>
                  Play
                </Link>
              ) : done ? (
                <Link className="gel-btn gel-btn--sm gel-btn--secondary" to={`/student/mission/${done.id}`}>
                  K.O.
                </Link>
              ) : (
                <button
                  className="gel-btn gel-btn--sm gel-btn--secondary"
                  aria-label={`Play ${a.topic}`}
                  onClick={() => {
                    setSheet(null)
                    setPicker({ assignment: a })
                  }}
                >
                  Play
                </button>
              )}
            </li>
          ))}
          {saved.map((s) => (
            <li key={s.id} className="mission-row panel">
              <span className="mission-row__boss" aria-hidden>
                📼
              </span>
              <span className="mission-row__copy">
                <span className="mission-row__state">{s.label ?? 'saved session'}</span>
                <span className="mission-row__topic">
                  {assignments.find((a) => a.id === s.assignment_id)?.topic ?? 'Pip session'}
                </span>
              </span>
              <Link className="gel-btn gel-btn--sm gel-btn--secondary" to={`/student/mission/${s.id}`}>
                Open
              </Link>
            </li>
          ))}
          {missions.length === 0 && <li>No missions yet. Your tutor will send one.</li>}
        </ul>
      </Drawer>

      <Drawer open={sheet === 'style'} onClose={() => styleFinished(null)} label="Your vibe">
        {sheet === 'style' && (
          <StyleGrid
            studentId={sid}
            initial={student?.style?.tiles ?? []}
            onDone={styleFinished}
            onSkip={() => styleFinished(null)}
          />
        )}
      </Drawer>

      <Drawer open={!!naming} onClose={() => setNaming(null)} label="Your Pip">
        {naming && (
          <NamePip
            studentId={sid}
            initial={pipName}
            onDone={() => {
              writeLocal(`pip.named.${sid}`, true)
              start(naming.look, true)
            }}
          />
        )}
      </Drawer>

      <Drawer open={sheet === 'family'} onClose={() => setSheet(null)} label="What my family sees">
        {sheet === 'family' && <FamilyView studentId={sid} />}
      </Drawer>

      <Drawer open={sheet === 'switch'} onClose={() => setSheet(null)} label="Students">
        <StudentSwitch sid={sid} onSwitch={onSwitch} onClose={() => setSheet(null)} />
      </Drawer>

      <Sheet open={!!picker} onClose={() => !busy && setPicker(null)} label="Pick Pip's look">
        {picker && (
          <MascotPicker
            initial={look}
            earned={student?.earned_items ?? []}
            busy={busy}
            cta={picker.editOnly ? 'Save look' : 'Start teaching'}
            onCancel={() => setPicker(null)}
            onVibeGrid={() => {
              setPicker(null)
              setSheet('style')
            }}
            onFamily={() => {
              setPicker(null)
              setSheet('family')
            }}
            onDone={start}
            note={<InlineError error={err} onRetry={() => start(look)} />}
          />
        )}
      </Sheet>
    </Shell>
  )
}
