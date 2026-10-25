import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api, DEMO } from '../api'
import { useLoad, readLocal, writeLocal } from '../hooks'
import { Empty, ErrorState, Sheet, initialsOf, useToast } from '../components/ui.jsx'
import InsightCard from '../components/InsightCard.jsx'
import AtRiskCard from '../components/AtRiskCard.jsx'
import NewMission from '../components/NewMission.jsx'
import BulkMission from '../staff/BulkMission.jsx'
import { StudioShell } from '../staff/StudioShell.jsx'
import { staffApi } from '../staff/api'
import { useMedia } from '../staff/useMedia'
import { FLAG_ORDER, FLAG_WORDS, subjectShort } from '../staff/format'
import StudentsTable from './tutor/StudentsTable.jsx'
import StudentProfile from './tutor/StudentProfile.jsx'

// Tutor Studio (CONTRACT v3.13): students × subjects, filters, bulk assign, two-pane profile at ≥1024.
// /tutor?s=<id> selects in place on desktop; /tutor/students/:id is the profile route (its own page at 390).
export default function TutorHome() {
  const { id: routeId } = useParams()
  const [sp, setSp] = useSearchParams()
  const desktop = useMedia('(min-width: 1024px)')
  const navigate = useNavigate()
  const toast = useToast()

  const tutorId = sp.get('tutor') ?? readLocal('pip.studio.tutor', DEMO.tutorId)
  const tutors = useLoad(() => staffApi.tutors(), [])
  const list = useLoad(() => staffApi.tutorStudents(tutorId), [tutorId])
  const center = useLoad(() => api.center(), [])

  const [q, setQ] = useState('')
  const [subject, setSubject] = useState('')
  const [flags, setFlags] = useState(() => new Set())
  const [selected, setSelected] = useState(() => new Set())
  const [missionOpen, setMissionOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)

  useEffect(() => {
    setSelected(new Set())
    setSubject('')
  }, [tutorId])

  const tutorList = tutors.data?.tutors ?? []
  const tutor = list.data?.tutor ?? tutorList.find((t) => t.id === tutorId) ?? { id: tutorId, name: 'Ms. Rivera' }
  const allRows = useMemo(() => list.data?.rows ?? [], [list.data])

  const rows = useMemo(() => {
    const qq = q.trim().toLowerCase()
    const out = allRows.filter(
      (r) =>
        (!qq || r.student.name.toLowerCase().includes(qq)) &&
        (!subject || (r.student.enrollments ?? r.subjects).some((e) => e.subject === subject)) &&
        [...flags].every((f) => r.flags.includes(f)),
    )
    // Maya first for the demo, then anything flagged.
    return out.sort((a, b) => {
      if (a.student.id === DEMO.studentId) return -1
      if (b.student.id === DEMO.studentId) return 1
      return b.flags.length - a.flags.length || a.student.name.localeCompare(b.student.name)
    })
  }, [allRows, q, subject, flags])

  const subjects = useMemo(() => {
    const set = new Set()
    allRows.forEach((r) => (r.student.enrollments ?? r.subjects).forEach((e) => (!e.tutor_id || e.tutor_id === tutorId) && set.add(e.subject)))
    return [...set]
  }, [allRows, tutorId])
  const flagCounts = useMemo(() => Object.fromEntries(FLAG_ORDER.map((f) => [f, allRows.filter((r) => r.flags.includes(f)).length])), [allRows])

  const activeId = routeId ?? sp.get('s') ?? (desktop ? rows[0]?.student.id : null)
  const rosterIds = useMemo(() => (list.data ? new Set(allRows.map((r) => r.student.id)) : null), [list.data, allRows])
  const selectedStudents = allRows.filter((r) => selected.has(r.student.id)).map((r) => r.student)

  function setTutor(id) {
    writeLocal('pip.studio.tutor', id)
    const next = new URLSearchParams(sp)
    next.set('tutor', id)
    next.delete('s')
    if (routeId) navigate(`/tutor?${next}`)
    else setSp(next, { replace: true })
  }
  function open(id) {
    if (desktop) {
      const next = new URLSearchParams(sp)
      next.set('s', id)
      if (routeId) navigate(`/tutor?${next}`, { replace: true })
      else setSp(next, { replace: true })
    } else {
      navigate(`/tutor/students/${id}${sp.get('tutor') ? `?tutor=${sp.get('tutor')}` : ''}`)
    }
  }
  const toggle = (id) =>
    setSelected((s) => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  const toggleFlag = (f) =>
    setFlags((s) => {
      const n = new Set(s)
      n.has(f) ? n.delete(f) : n.add(f)
      return n
    })

  const tutorName = tutor?.name ?? 'Ms. Rivera'

  // Phone: the profile is its own page.
  if (routeId && !desktop) {
    return (
      <StudioShell who={tutorName} initials={initialsOf(tutorName)}>
        <div className="page studio-page staff">
          <Link to={`/tutor${sp.get('tutor') ? `?tutor=${sp.get('tutor')}` : ''}`} className="back">
            ← All students
          </Link>
          <StudentProfile id={routeId} tutorId={tutorId} tutors={tutorList} />
        </div>
      </StudioShell>
    )
  }

  return (
    <StudioShell who={tutorName} initials={initialsOf(tutorName)} wide>
      <div className="studio-band" aria-hidden />
      <div className="page page--wide studio-page stack staff">
        <section className="page-head studio-head">
          <div className="stack-sm grow">
            <label className="tutor-switch">
              <span className="eyebrow">Tutor</span>
              <select className="select select--quiet" value={tutorId} onChange={(e) => setTutor(e.target.value)} aria-label="Viewing as tutor">
                {(tutorList.length ? tutorList : [{ id: tutorId, name: tutorName }]).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    {t.students != null ? ` · ${t.students} students` : ''}
                  </option>
                ))}
              </select>
            </label>
            <h1 className="display h-page">Your students</h1>
            <p className="muted">Every student, every subject, and what each one taught Pip since you last saw them.</p>
          </div>
          <button className="btn btn--primary btn--lg" onClick={() => setMissionOpen(true)}>
            <span aria-hidden>＋</span> New Pip mission
          </button>
        </section>

        <div className={`studio-split${desktop ? ' is-split' : ''}`}>
          <section className="glass st-card" aria-label="Students">
            <div className="st-tools">
              <input className="input st-tools__q" type="search" placeholder="Find a student" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Find a student" />
              <div className="st-tools__chips" role="group" aria-label="Subject">
                <button type="button" className={`fchip${!subject ? ' is-on' : ''}`} aria-pressed={!subject} onClick={() => setSubject('')}>
                  All subjects
                </button>
                {subjects.map((s) => (
                  <button key={s} type="button" className={`fchip${subject === s ? ' is-on' : ''}`} aria-pressed={subject === s} onClick={() => setSubject(subject === s ? '' : s)}>
                    {subjectShort(s)}
                  </button>
                ))}
              </div>
              <div className="st-tools__chips" role="group" aria-label="Flags">
                {FLAG_ORDER.map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`fchip fchip--flag fchip--${f}${flags.has(f) ? ' is-on' : ''}`}
                    aria-pressed={flags.has(f)}
                    onClick={() => toggleFlag(f)}
                    disabled={!flagCounts[f] && !flags.has(f)}
                  >
                    {FLAG_WORDS[f]} <span className="mono">{flagCounts[f] ?? 0}</span>
                  </button>
                ))}
              </div>
            </div>

            {list.loading && !list.data ? (
              <div className="stack-sm" style={{ padding: 16 }}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="skeleton" style={{ height: 52 }} />
                ))}
              </div>
            ) : list.error && !list.data ? (
              <ErrorState error={list.error} onRetry={list.reload} />
            ) : rows.length === 0 ? (
              <Empty title={allRows.length ? 'No match' : 'No students yet'}>
                {allRows.length ? 'Clear a filter or try another name.' : `Students enrolled with ${tutorName} show up here.`}
              </Empty>
            ) : (
              <StudentsTable
                rows={rows}
                tutors={tutorList}
                tutorId={tutorId}
                activeId={desktop ? activeId : null}
                selected={selected}
                onToggle={toggle}
                onToggleAll={(on) => setSelected(on ? new Set(rows.map((r) => r.student.id)) : new Set())}
                onOpen={open}
              />
            )}
            {list.data && (
              <p className="st-foot small subtle">
                <span className="mono">{rows.length}</span> of <span className="mono">{allRows.length}</span> students · K.O. = Pip passed its quiz on a lesson
              </p>
            )}
          </section>

          {desktop && (
            <aside className="glass studio-pane" aria-label="Student profile">
              {activeId ? (
                <StudentProfile key={activeId} id={activeId} tutorId={tutorId} tutors={tutorList} pane />
              ) : (
                <Empty title="Pick a student">Their subjects, family and notes open here.</Empty>
              )}
            </aside>
          )}
        </div>

        <div className="tutor-glance">
          {rosterIds && <AtRiskCard compact only={rosterIds} limit={3} />}
          {center.data?.insight && <InsightCard data={center.data} compact />}
        </div>
      </div>

      {selected.size > 0 && (
        <div className="bulk-bar" role="region" aria-label="Selected students">
          <span className="bulk-bar__n">
            <b className="mono">{selected.size}</b> selected
          </span>
          <button className="btn btn--ghost btn--sm" onClick={() => setSelected(new Set())}>
            Clear
          </button>
          <button className="btn btn--primary" onClick={() => setBulkOpen(true)}>
            Assign mission to {selected.size} student{selected.size === 1 ? '' : 's'}
          </button>
        </div>
      )}

      <Sheet open={missionOpen} onClose={() => setMissionOpen(false)} label="New Pip mission">
        <NewMission
          students={allRows.map((r) => r.student)}
          tutorId={tutorId}
          onClose={() => setMissionOpen(false)}
          onSaved={(a) => toast(`Mission saved. It’s on ${(allRows.find((r) => r.student.id === a.student_id)?.student.name ?? 'the student').split(' ')[0]}’s home screen.`)}
        />
      </Sheet>
      <Sheet open={bulkOpen} onClose={() => setBulkOpen(false)} label="Assign a mission to several students">
        <BulkMission
          students={selectedStudents}
          tutorId={tutorId}
          onClose={() => {
            setBulkOpen(false)
            setSelected(new Set())
          }}
          onSaved={(as) => toast(`Assigned to ${as.length} students.`)}
        />
      </Sheet>
    </StudioShell>
  )
}
