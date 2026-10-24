import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, DEMO } from '../api'
import { useLoad } from '../hooks'
import { Empty, ErrorState, InlineError, Shell, Sheet, initialsOf, useToast } from '../components/ui.jsx'
import InsightCard from '../components/InsightCard.jsx'
import NewMission from '../components/NewMission.jsx'
import { pickReportSession } from '../lib'

export default function TutorHome() {
  const roster = useLoad(() => api.roster(DEMO.tutorId), [])
  const center = useLoad(() => api.center(), [])
  const [missionOpen, setMissionOpen] = useState(false)
  const [opening, setOpening] = useState(null)
  const [openErr, setOpenErr] = useState(null)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const toast = useToast()

  const tutor = roster.data?.tutor
  const students = useMemo(() => {
    const list = roster.data?.students ?? []
    const q = query.trim().toLowerCase()
    const filtered = q ? list.filter((s) => s.name.toLowerCase().includes(q)) : list
    // Students with something new float to the top; Maya first for the demo.
    return [...filtered].sort((a, b) => {
      if (a.id === DEMO.studentId) return -1
      if (b.id === DEMO.studentId) return 1
      return (b.since_last_session ? 1 : 0) - (a.since_last_session ? 1 : 0)
    })
  }, [roster.data, query])

  async function openReport(student) {
    setOpening(student.id)
    setOpenErr(null)
    try {
      const data = await api.student(student.id)
      const s = pickReportSession(data.sessions)
      if (s) navigate(`/tutor/report/${s.id}`)
      else toast(`${student.name.split(' ')[0]} hasn’t finished a Pip session yet.`)
    } catch (e) {
      setOpenErr(e)
    } finally {
      setOpening(null)
    }
  }

  const tutorName = tutor?.name ?? 'Ms. Rivera'
  const withPip = (roster.data?.students ?? []).filter((s) => s.since_last_session).length

  return (
    <Shell who={tutorName} initials={initialsOf(tutorName) || 'MR'}>
      <div className="page stack staff">
        <section className="page-head">
          <div className="stack-sm grow">
            <p className="eyebrow">Tutor · {tutorName}</p>
            <h1 className="display h-page">Your students</h1>
            <p className="muted">What stuck since the last session, in each student’s own words.</p>
          </div>
          <button className="btn btn--primary btn--lg" onClick={() => setMissionOpen(true)}>
            <span aria-hidden>＋</span> New Pip mission
          </button>
        </section>

        {center.data?.insight && <InsightCard data={center.data} compact />}

        <section className="glass roster">
          <div className="roster__head">
            <div>
              <h2 className="card-title">Roster</h2>
              {roster.data && (
                <p className="subtle small">
                  <span className="mono">{roster.data.students.length}</span> students ·{' '}
                  <span className="mono">{withPip}</span> taught Pip recently
                </p>
              )}
            </div>
            <input
              className="input roster__search"
              type="search"
              placeholder="Find a student"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Find a student"
            />
          </div>
          <InlineError error={openErr} />
          {roster.loading && !roster.data ? (
            <div className="stack-sm" style={{ padding: 16 }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="skeleton" style={{ height: 56 }} />
              ))}
            </div>
          ) : roster.error && !roster.data ? (
            <ErrorState error={roster.error} onRetry={roster.reload} />
          ) : students.length === 0 ? (
            <Empty title={query ? 'No match' : 'No students yet'}>
              {query ? 'Try another name.' : 'Students assigned to you will show up here.'}
            </Empty>
          ) : (
            <div className="roster__list" role="table" aria-label="Students">
              <div className="roster__row roster__row--th" role="row">
                <span role="columnheader">Student</span>
                <span role="columnheader">Since last session</span>
                <span role="columnheader" className="sr-only">
                  Report
                </span>
              </div>
              {students.map((s) => (
                <div className="roster__row" role="row" key={s.id}>
                  <span role="cell" className="roster__who">
                    <span className={`avatar${s.since_last_session ? ' avatar--pip' : ''}`} aria-hidden>
                      {initialsOf(s.name)}
                    </span>
                    <span>
                      <span className="roster__name">{s.name}</span>
                      <span className="roster__grade"> · G{s.grade}</span>
                    </span>
                  </span>
                  <span role="cell" className={s.since_last_session ? 'roster__since' : 'roster__since roster__since--none'}>
                    {s.since_last_session || '—'}
                  </span>
                  <span role="cell" className="roster__action">
                    {s.last_session_id ? (
                      <Link className="btn btn--sm" to={`/tutor/report/${s.last_session_id}`}>
                        Report
                      </Link>
                    ) : s.since_last_session ? (
                      <button className="btn btn--sm" onClick={() => openReport(s)} disabled={opening === s.id}>
                        {opening === s.id ? 'Opening…' : 'Report'}
                      </button>
                    ) : null}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <Sheet open={missionOpen} onClose={() => setMissionOpen(false)} label="New Pip mission">
        <NewMission
          students={roster.data?.students ?? []}
          tutorId={tutor?.id ?? DEMO.tutorId}
          onClose={() => setMissionOpen(false)}
          onSaved={(a) => {
            toast(`Mission saved. It’s on ${studentFirst(roster.data?.students, a.student_id)}’s home screen.`)
          }}
        />
      </Sheet>
    </Shell>
  )
}

function studentFirst(list = [], id) {
  return (list.find((s) => s.id === id)?.name ?? 'the student').split(' ')[0]
}
