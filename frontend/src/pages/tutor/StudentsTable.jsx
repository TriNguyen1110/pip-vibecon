import { FlagPills, PipHead } from '../../staff/bits.jsx'
import { pipOf } from '../../staff/pip'
import { ago, daysSince, subjectShort } from '../../staff/format'

// Students × subjects. Dense, scannable rows (44px+ touch), whole row opens the profile.
export default function StudentsTable({ rows, tutors, tutorId, activeId, selected, onToggle, onToggleAll, onOpen }) {
  const tName = (id) => tutors?.find((t) => t.id === id)?.name ?? id
  const allOn = rows.length > 0 && rows.every((r) => selected.has(r.student.id))
  return (
    <div className="st" role="table" aria-label="Students and subjects">
      <div className="st__row st__row--th" role="row">
        <span role="columnheader" className="st__check">
          <input type="checkbox" aria-label="Select all students shown" checked={allOn} onChange={() => onToggleAll(!allOn)} />
        </span>
        <span role="columnheader">Student</span>
        <span role="columnheader">Subjects · tutor</span>
        <span role="columnheader" className="st__num">Last active</span>
        <span role="columnheader" className="st__num" title="Lessons finished: Pip passed its quiz">K.O.</span>
        <span role="columnheader">Next slot</span>
      </div>
      {rows.map((r) => {
        const s = r.student
        const last = r.subjects.map((x) => x.last_active).filter(Boolean).sort().at(-1) ?? null
        const kos = r.subjects.reduce((t, x) => t + (x.ko_count ?? 0), 0)
        const ens = s.enrollments ?? r.subjects.map((x) => ({ subject: x.subject, tutor_id: tutorId }))
        const on = selected.has(s.id)
        return (
          <div
            key={s.id}
            role="row"
            className={`st__row${activeId === s.id ? ' is-active' : ''}${on ? ' is-selected' : ''}`}
            onClick={() => onOpen(s.id)}
          >
            <span role="cell" className="st__check" onClick={(e) => e.stopPropagation()}>
              <input type="checkbox" aria-label={`Select ${s.name}`} checked={on} onChange={() => onToggle(s.id)} />
            </span>
            <span role="cell" className="st__who">
              <PipHead pip={pipOf(r)} name={s.name} taught={daysSince(last) <= 7} />
              <span className="st__id">
                <button
                  type="button"
                  className="st__name"
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpen(s.id)
                  }}
                  aria-current={activeId === s.id ? 'true' : undefined}
                >
                  {s.name}
                </button>
                <span className="st__grade mono">G{s.grade}</span>
                <FlagPills flags={r.flags} />
              </span>
            </span>
            <span role="cell" className="st__subs">
              {ens.map((e) => (
                <span key={`${e.subject}-${e.tutor_id}`} className={`subj${e.tutor_id === tutorId ? ' subj--mine' : ''}`}>
                  {subjectShort(e.subject)}
                  <span className="subj__t">{'\u00a0·\u00a0'}{tName(e.tutor_id)}</span>
                </span>
              ))}
            </span>
            <span role="cell" className={`st__num st__last${daysSince(last) > 14 ? ' is-quiet' : ''}`}>
              {ago(last)}
            </span>
            <span role="cell" className="st__num mono">{kos}</span>
            <span role="cell" className="st__slot mono">{r.next_slot ?? '—'}</span>
          </div>
        )
      })}
    </div>
  )
}
