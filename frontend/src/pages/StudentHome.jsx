import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, DEMO } from '../api'
import { readLocal, useLoad, writeLocal } from '../hooks'
import { ErrorState, InlineError, Loading, Shell, Sheet, initialsOf } from '../components/ui.jsx'
import Mascot, { lookForCreature } from '../components/Mascot.jsx'
import MascotPicker from '../components/MascotPicker.jsx'

export default function StudentHome() {
  const sid = DEMO.studentId
  const data = useLoad(() => api.student(sid), [sid])
  const opened = useRef(false)
  const navigate = useNavigate()
  const [look, setLook] = useState(() => readLocal('pip.look', { creature: 'blob', accessory: 'none' }))
  const [picker, setPicker] = useState(null) // { assignment } | { editOnly: true }
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const [react, setReact] = useState(0)

  useEffect(() => {
    if (opened.current) return
    opened.current = true
    api.openApp(sid).catch(() => {})
  }, [sid])

  const student = data.data?.student
  const first = (student?.name ?? 'Maya').split(' ')[0]
  const sessions = useMemo(() => data.data?.sessions ?? [], [data.data])
  // Maya's seeded a_frac mission is pinned first for the demo.
  const assignments = useMemo(
    () => [...(data.data?.assignments ?? [])].sort((x, y) => (y.id === 'a_frac') - (x.id === 'a_frac')),
    [data.data],
  )

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
  const brainV = Math.max(1, ...sessions.map((s) => s.brain_version ?? 1))

  async function start({ creature, accessory }) {
    const next = { creature, accessory }
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
      })
      navigate(`/student/mission/${s.id}`)
    } catch (e) {
      setErr(e)
      setBusy(false)
    }
  }

  return (
    <Shell who={first} initials={initialsOf(student?.name ?? 'Maya R')} game>
      <div className="page student-home">
        <section className="sh-hero">
          <div className="sh-hero__stage">
            <Mascot
              creature={look.creature}
              look={look.creature}
              accessory={look.accessory}
              mood={latest?.mood === 'celebrating' ? 'celebrating' : 'confused'}
              env="room"
              reaction={react}
              height={260}
              onTap={() => setReact((r) => r + 1)}
            />
            <span className="brain-badge">Brain v{brainV}</span>
          </div>
          <div className="sh-hero__copy stack-sm">
            <p className="eyebrow">Pip’s room</p>
            <h1 className="display h-page">Hi {first}.</h1>
            <p className="pip-line">
              <span aria-hidden>🤔</span>{' '}
              {cliff ? `I’ve been thinking about something. “${cliff}”` : 'I don’t know much yet. That’s why I need you.'}
            </p>
            <div>
              <button className="btn btn--sm btn--ghost" onClick={() => setPicker({ editOnly: true })}>
                Change Pip’s look
              </button>
            </div>
          </div>
        </section>

        {data.loading && !data.data ? (
          <Loading label="Finding your missions…" />
        ) : data.error && !data.data ? (
          <ErrorState error={data.error} onRetry={data.reload} />
        ) : (
          <>
            <section className="stack" aria-label="Missions">
              <h2 className="sh-title">Missions</h2>
              {missions.length === 0 ? (
                <div className="glass card">
                  <p className="muted">No missions yet. Ms. Rivera will send one soon.</p>
                </div>
              ) : (
                missions.map(({ a, active, done }) => (
                  <article key={a.id} className={`glass mission-tile${active ? ' is-active' : ''}`}>
                    <div className="mission-tile__boss" aria-hidden>
                      {done ? <span className="ko-mini">K.O.</span> : null}
                      {a.boss?.emoji ?? '👾'}
                    </div>
                    <div className="grow stack-sm">
                      <p className="eyebrow">{done ? 'Defeated' : active ? 'In progress' : 'New mission'}</p>
                      <h3 className="card-title">{a.topic}</h3>
                      <p className="small muted">
                        Boss: <b className="boss-name-inline">{a.boss?.name}</b>
                      </p>
                      {a.why_it_matters && <p className="small subtle">Why it matters: {a.why_it_matters}</p>}
                    </div>
                    <div className="mission-tile__cta">
                      {active ? (
                        <Link className="btn btn--primary btn--block" to={`/student/mission/${active.id}`}>
                          Continue
                        </Link>
                      ) : done ? (
                        <Link className="btn btn--block" to={`/student/mission/${done.id}`}>
                          See the K.O.
                        </Link>
                      ) : (
                        <button className="btn btn--primary btn--block" onClick={() => setPicker({ assignment: a })}>
                          Start mission
                        </button>
                      )}
                    </div>
                  </article>
                ))
              )}
            </section>

            {vault.length > 0 && (
              <section className="stack" aria-label="Defeated bosses" style={{ marginTop: 32 }}>
                <h2 className="sh-title">The shelf</h2>
                <div className="shelf">
                  {vault.map((s) => (
                    <Link key={s.id} to={`/student/mission/${s.id}`} className="shelf__item" title={bossFor(s)?.name}>
                      <span className="shelf__emoji" aria-hidden>
                        {bossFor(s)?.emoji ?? '👾'}
                      </span>
                      <span className="small subtle">{bossFor(s)?.name ?? 'Boss'}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {saved.length > 0 && (
              <section className="stack" style={{ marginTop: 32 }}>
                {saved.map((s) => (
                  <Link key={s.id} to={`/student/mission/${s.id}`} className="saved-link panel">
                    <span className="chip">{s.label ?? 'saved session'}</span>
                    <span className="small muted grow">{assignments.find((a) => a.id === s.assignment_id)?.topic ?? 'Pip session'}</span>
                    <span aria-hidden>→</span>
                  </Link>
                ))}
              </section>
            )}
          </>
        )}
      </div>

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
