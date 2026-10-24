import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api, DEMO, DEMO_STUDENTS, PINNED_MISSIONS } from '../api'
import { readLocal, useLoad, writeLocal } from '../hooks'
import { ErrorState, InlineError, Shell, Sheet } from '../components/ui.jsx'
import { DEFAULT_CREATURE, lookForCreature } from '../components/Mascot.jsx'
import { Drawer, IconButton, MuteButton, TalkingMascot, ThemeButton, useBoxHeight } from '../components/game.jsx'
import { speak, tapLine } from '../voice'
import MascotPicker from '../components/MascotPicker.jsx'

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

// Demo: switch the student (no <select> on Play screens; a sheet of gels instead).
function StudentSwitch({ sid, onSwitch, onClose }) {
  return (
    <div className="stack switch-sheet">
      <h2 className="ribbon">Try another student</h2>
      {DEMO_STUDENTS.map((s) => (
        <button
          key={s.id}
          type="button"
          className={`gel-btn${s.id === sid ? '' : ' gel-btn--secondary'}`}
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
  const [look, setLook] = useState(() => readLocal('pip.look', { creature: DEFAULT_CREATURE, accessory: 'none', vibe: 'cute' }))
  const [picker, setPicker] = useState(null) // { assignment } | { editOnly: true }
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const [react, setReact] = useState(0)
  const [say, setSay] = useState(null)
  const [sheet, setSheet] = useState(null) // vault | missions | switch
  const greeted = useRef(false)
  const sayTimer = useRef(null)
  const [stageBox, stageH] = useBoxHeight(120)

  useEffect(() => {
    if (opened.current || !recordOpen) return
    opened.current = true
    api.openApp(sid).catch(() => {})
  }, [sid, recordOpen])

  const student = data.data?.student
  const first = (student?.name ?? (sid === DEMO.studentId ? 'Maya' : '')).split(' ')[0]
  const sessions = useMemo(() => data.data?.sessions ?? [], [data.data])
  // Seeded missions (Maya's a_frac, the SAT ones) are pinned first for the demo.
  const assignments = useMemo(() => {
    const pinned = (a) => PINNED_MISSIONS.includes(a.id)
    return [...(data.data?.assignments ?? [])].sort((x, y) => pinned(y) - pinned(x))
  }, [data.data])

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
  const cliff = vault.length ? (vault.at(-1).gap_report?.cliffhanger ?? assignments.find((a) => a.id === vault.at(-1).assignment_id)?.cliffhanger) : null
  const brainV = Math.max(1, ...sessions.filter((s) => !s.saved).map((s) => s.brain_version ?? 1))
  const greeting = cliff ? `I’ve been thinking about something. “${cliff}”` : 'I don’t know much yet. That’s why I need you.'
    useEffect(() => () => clearTimeout(sayTimer.current), [])

  // First tap on Pip: the greeting, out loud. After that: a short deadpan line.
  function tapPip() {
    setReact((r) => r + 1)
    if (!greeted.current) {
      greeted.current = true
      speak(`Hi ${first}. ${greeting}`)
      return
    }
    const line = tapLine()
    clearTimeout(sayTimer.current)
    setSay(line)
    sayTimer.current = setTimeout(() => setSay(null), 3200)
    speak(line)
  }

  async function start({ creature, accessory, vibe = 'cute' }) {
    const next = { creature, accessory, vibe }
    setLook(next)
    writeLocal('pip.look', next)
    if (picker?.editOnly) {
      setPicker(null)
      setReact((r) => r + 1)
      return
    }
    setBusy(true)
    setErr(null)
    try {
      const s = await api.createSession({
        assignment_id: picker.assignment.id,
        student_id: sid,
        look: lookForCreature(creature),
        creature,
        accessory,
        vibe,
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
      <div className="game play-screen game--home">
        <header className="game-top hud home-top">
          <span className="sticker sticker--chrome home-top__brain" aria-label={`Pip's Brain version ${brainV}`}>
            Brain v{brainV}
          </span>
          <div className="hud__right">
            <IconButton label="Try another student" onClick={() => setSheet('switch')} aria-expanded={sheet === 'switch'}>
              👥
            </IconButton>
            <ThemeButton />
            <MuteButton />
          </div>
        </header>

        <section className="home-stage" aria-label="Pip’s room">
          <div className="home-stage__room" ref={stageBox}>
            {stageH > 0 && (
              <TalkingMascot
                creature={look.creature}
                look={look.creature}
                accessory={look.accessory}
                vibe={look.vibe}
                mood={latest?.mood === 'celebrating' ? 'celebrating' : 'confused'}
                env="room"
                framing="hero"
                reaction={react}
                height={stageH}
                onTap={tapPip}
              />
            )}
          </div>
          <div className="speech msg msg--pip" aria-live="polite">
            <p className={`bubble bubble--pip speech__bubble pip-line${say ? ' is-aside' : ''}`} key={say ?? 'g'}>
              {say ?? (current || data.loading ? greeting : 'No mission yet. Your tutor will send one.')}
            </p>
            <span className="speech__tail" aria-hidden />
          </div>
        </section>

        <h1 className="sr-only">{first ? `Hi ${first}.` : 'Hi.'}</h1>

        <section className="home-mission" aria-label="Current mission">
          {data.loading && !data.data ? (
            <p className="home-mission__wait">Finding your missions…</p>
          ) : data.error && !data.data ? (
            <ErrorState error={data.error} onRetry={data.reload} title="Pip lost the thread." />
          ) : current ? (
            <article className={`mission-tile home-current${current.active ? ' is-active' : ''}`}>
              <h3 className="ribbon home-current__topic">{current.a.topic}</h3>
              <span className="sticker sticker--boss home-current__vs" aria-label={`Boss: ${current.a.boss?.name ?? ''}`}>
                vs {current.a.boss?.emoji ?? '👾'}
              </span>
              {current.active ? (
                <Link className="gel-btn gel-btn--lg home-play" to={`/student/mission/${current.active.id}`}>
                  Play
                </Link>
              ) : current.done ? (
                <Link className="gel-btn gel-btn--lg gel-btn--secondary home-play" to={`/student/mission/${current.done.id}`}>
                  K.O.
                </Link>
              ) : (
                <button className="gel-btn gel-btn--lg home-play" onClick={() => setPicker({ assignment: current.a })}>
                  Play
                </button>
              )}
            </article>
          ) : (
            <button className="gel-btn gel-btn--lg home-play" disabled>
              Play
            </button>
          )}
        </section>

        <footer className="game-foot home-foot">
          <IconButton label="Change Pip’s look" caption="Look" onClick={() => setPicker({ editOnly: true })}>
            🎨
          </IconButton>
          <IconButton label="The vault" caption="Vault" onClick={() => setSheet('vault')} aria-expanded={sheet === 'vault'}>
            🏆
          </IconButton>
          <IconButton label="Missions" caption="Missions" onClick={() => setSheet('missions')} aria-expanded={sheet === 'missions'}>
            🗺️
          </IconButton>
        </footer>
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
                <span className="mission-row__state">{done ? 'Defeated' : active ? 'In progress' : 'New mission'}</span>
                <span className="mission-row__topic">{a.topic}</span>
              </span>
              {active ? (
                <Link className="gel-btn gel-btn--sm" to={`/student/mission/${active.id}`}>
                  Play
                </Link>
              ) : done ? (
                <Link className="gel-btn gel-btn--sm gel-btn--secondary" to={`/student/mission/${done.id}`}>
                  K.O.
                </Link>
              ) : (
                <button
                  className="gel-btn gel-btn--sm"
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
                <span className="mission-row__topic">{assignments.find((a) => a.id === s.assignment_id)?.topic ?? 'Pip session'}</span>
              </span>
              <Link className="gel-btn gel-btn--sm gel-btn--secondary" to={`/student/mission/${s.id}`}>
                Open
              </Link>
            </li>
          ))}
          {missions.length === 0 && <li>No missions yet. Your tutor will send one.</li>}
        </ul>
      </Drawer>

      <Drawer open={sheet === 'switch'} onClose={() => setSheet(null)} label="Students">
        <StudentSwitch sid={sid} onSwitch={onSwitch} onClose={() => setSheet(null)} />
      </Drawer>

      <Sheet open={!!picker} onClose={() => !busy && setPicker(null)} label="Pick Pip's look">
        {picker && (
          <MascotPicker
            initial={look}
            busy={busy}
            cta={picker.editOnly ? 'Save look' : 'Start teaching'}
            onCancel={() => setPicker(null)}
            onDone={start}
            note={<InlineError error={err} onRetry={() => start(look)} />}
          />
        )}
      </Sheet>
    </Shell>
  )
}
