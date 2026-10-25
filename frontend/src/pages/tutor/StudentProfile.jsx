import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import { useLoad } from '../../hooks'
import { ErrorState, Empty } from '../../components/ui.jsx'
import { LEVEL_WORDS } from '../../lib'
import { Segmented } from '../../staff/StudioShell.jsx'
import { staffApi } from '../../staff/api'
import { FlagPills, PipHead } from '../../staff/bits.jsx'
import { pipOf } from '../../staff/pip'
import { LEVEL_SHORT, ago, daysSince, fmtDate, fmtWhen, hoursLeft, sessionFromLink, subjectName, subjectShort } from '../../staff/format'
import ProfileFamily from './ProfileFamily.jsx'
import ProfileNotes from './ProfileNotes.jsx'

const TABS = [
  { value: 'progress', label: 'Progress' },
  { value: 'family', label: 'Family' },
  { value: 'notes', label: 'Notes' },
  { value: 'timeline', label: 'Timeline' },
]

export default function StudentProfile({ id, tutorId, tutors, pane }) {
  const p = useLoad(() => staffApi.profile(id), [id])
  // Concepts Pip starts out knowing (lesson.prior_knowledge, CONTRACT v3.6 lesson spec), per mission id.
  const st = useLoad(() => api.student(id).catch(() => null), [id])
  const priorByMission = Object.fromEntries((st.data?.assignments ?? []).map((a) => [a.id, a.lesson?.prior_knowledge ?? []]))
  // v3.15 drafts (B18): pending parent updates waiting for the tutor.
  const dr = useLoad(() => staffApi.drafts(id).then((r) => ({ items: r.items ?? [] })), [id])
  const drafts = dr.data ?? { items: [] }
  const [tab, setTab] = useState('progress')

  if (p.loading && !p.data) {
    return (
      <div className="stack-sm profile" style={{ padding: pane ? 20 : 0 }}>
        <div className="skeleton" style={{ height: 64 }} />
        <div className="skeleton" style={{ height: 44 }} />
        <div className="skeleton" style={{ height: 220 }} />
      </div>
    )
  }
  if (p.error && !p.data) return <ErrorState error={p.error} onRetry={p.reload} title="That profile didn’t load." />
  const d = p.data
  const s = d.student
  const enrollments = d.enrollments ?? s.enrollments ?? []
  const reports = (d.timeline ?? []).filter((t) => sessionFromLink(t.link))
  const latestReport = reports[0]?.link ?? null
  const lastActive = (d.progress ?? []).map((x) => x.last_session_at).filter(Boolean).sort().at(-1)
  const flags = d.flags ?? []
  const toSend = drafts.items.filter((x) => (x.status ?? 'draft') === 'draft').length

  return (
    <div className={`profile${pane ? ' profile--pane' : ''}`}>
      <header className="profile__head">
        <PipHead pip={d.pip ?? pipOf(s)} name={s.name} size={52} taught={daysSince(lastActive) <= 7} />
        <div className="grow stack-sm" style={{ gap: 4 }}>
          <h2 className="display profile__name">
            {s.name} <span className="profile__grade mono">Grade {s.grade}</span>
          </h2>
          <p className="small subtle">
            {enrollments.map((e) => `${subjectShort(e.subject)} ${e.slot ?? ''}`).join(' · ')}
            {lastActive ? ` · active ${ago(lastActive)}` : ''}
          </p>
          <FlagPills flags={flags} />
        </div>
        <div className="profile__actions">
          <button className="btn btn--primary" onClick={() => setTab('family')}>
            {toSend > 0 ? `To send · ${toSend}` : 'Update the family'}
          </button>
          {latestReport && (
            <Link className="btn" to={latestReport}>
              Gap report
            </Link>
          )}
        </div>
      </header>

      <Segmented
        value={tab}
        onChange={setTab}
        options={TABS.map((t) => (t.value === 'family' && toSend ? { ...t, badge: toSend } : t))}
        label="Profile sections"
        className="profile__tabs"
      />

      <div className="profile__body" role="tabpanel">
        {tab === 'progress' && <Progress progress={d.progress ?? []} enrollments={enrollments} reports={reports} tutorId={tutorId} priorByMission={priorByMission} />}
        {tab === 'family' && (
          <ProfileFamily
            profile={d}
            tutorId={tutorId}
            tutors={tutors}
            onChanged={(fn) => p.setData(fn)}
            latestSession={sessionFromLink(latestReport)}
            drafts={drafts}
            setDrafts={(fn) => dr.setData((x) => fn(x ?? drafts))}
          />
        )}
        {tab === 'notes' && <ProfileNotes profile={d} tutorId={tutorId} tutors={tutors} onAdded={(n) => p.setData((x) => ({ ...x, notes: [n, ...(x.notes ?? [])] }))} />}
        {tab === 'timeline' && <Timeline items={d.timeline ?? []} />}
      </div>
    </div>
  )
}

function Progress({ progress, enrollments, reports, tutorId, priorByMission = {} }) {
  if (!progress.length) return <Empty title="No subjects yet">Enroll the student in a subject to see progress here.</Empty>
  return (
    <div className="prog-list">
      {progress.map((x) => {
        const en = enrollments.find((e) => e.subject === x.subject)
        const pkg = en?.package
        const left = hoursLeft(pkg)
        const rep = reports.find((r) => r.subject === x.subject)
        return (
          <article key={x.subject} className={`prog${x.tutor?.id === tutorId ? ' prog--mine' : ''}`}>
            <header className="prog__head">
              <div className="grow">
                <h3 className="prog__title">{subjectName(x.subject)}</h3>
                <p className="small subtle">
                  {x.tutor?.name} · next {x.next_slot ?? '—'}
                </p>
              </div>
              <dl className="prog__facts">
                <div>
                  <dt>K.O.</dt>
                  <dd className="mono">{x.ko_count ?? 0}</dd>
                </div>
                <div>
                  <dt>Last</dt>
                  <dd>{ago(x.last_session_at)}</dd>
                </div>
                {pkg && (
                  <div className={pkg.status !== 'active' ? 'is-low' : ''}>
                    <dt>Package</dt>
                    <dd>
                      {left > 0 ? (
                        <>
                          <span className="mono">{left}</span>h left
                        </>
                      ) : (
                        'used up'
                      )}
                    </dd>
                  </div>
                )}
              </dl>
            </header>

            {x.mastery?.length ? (
              <ul className="mastery" aria-label={`${subjectName(x.subject)} concepts`}>
                {x.mastery.map((m) => {
                  // The backend's level is the truth; a prior-knowledge concept reads as known (≥ 2) and says so.
                  const prior = m.known ?? m.prior_knowledge ?? (priorByMission[x.current_mission?.id] ?? []).includes(m.concept_id)
                  const level = prior ? Math.max(2, m.level) : m.level
                  const word = prior && m.level < 2 ? 'Already knew' : LEVEL_SHORT[level]
                  return (
                    <li key={m.concept_id} className="mastery__row">
                      <span className="mastery__text">
                        {m.text}
                        {prior && <span className="known-tag">Already knew</span>}
                      </span>
                      <span className="mastery__meter" role="img" aria-label={`${word}: level ${level} of 3`} title={prior ? 'Already knew this before the lesson' : LEVEL_WORDS[level]}>
                        {[1, 2, 3].map((k) => (
                          <i key={k} className={k <= level ? `on l${level}` : ''} />
                        ))}
                      </span>
                      <span className="mastery__word small">{word}</span>
                    </li>
                  )
                })}
              </ul>
            ) : null}
            {x.mastery?.length ? (
              <p className="mastery-legend small" aria-hidden>
                {[1, 2, 3].map((lv) => (
                  <span key={lv}>
                    <span className="mastery__meter">
                      {[1, 2, 3].map((k) => (
                        <i key={k} className={k <= lv ? `on l${lv}` : ''} />
                      ))}
                    </span>{' '}
                    {LEVEL_SHORT[lv]}
                  </span>
                ))}
              </p>
            ) : (
              <p className="small subtle">No Pip missions in this subject yet. Notes and sessions still show up in the timeline.</p>
            )}

            {x.open_misconception ? (
              <blockquote className="prog__mis">
                <span className="eyebrow">Still believes · {x.open_misconception.mission}</span>
                <q className="quote">{x.open_misconception.quote}</q>
              </blockquote>
            ) : x.mastery?.length ? (
              <p className="small prog__clear">No open mistake in this subject.</p>
            ) : null}

            {x.at_risk?.reasons?.length > 0 && (
              <ul className="prog__risk small">
                {x.at_risk.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            )}

            <footer className="prog__foot small">
              {pkg ? (
                <span className={pkg.status !== 'active' ? 'pkg pkg--low' : 'pkg'}>
                  {pkg.status === 'expired' ? 'Package ended' : pkg.status === 'low' ? 'Package low' : 'Package'} ·{' '}
                  <span className="mono">
                    {pkg.hours_used}/{pkg.hours_total}
                  </span>{' '}
                  h used · renews {fmtDate(pkg.renews_on)}
                </span>
              ) : (
                <span className="subtle">No package on file</span>
              )}
              {rep && (
                <Link to={rep.link} className="prog__rep">
                  Gap report →
                </Link>
              )}
            </footer>
          </article>
        )
      })}
    </div>
  )
}

const KIND_WORDS = { session: 'Session', ko: 'K.O.', update: 'Parent update', message: 'Message', note: 'Note' }

function Timeline({ items }) {
  if (!items.length) return <Empty title="Nothing yet">Sessions, updates and notes show up here.</Empty>
  return (
    <ol className="tl">
      {items.map((t, i) => (
        <li key={i} className={`tl__item tl__item--${t.kind}`}>
          <span className="tl__dot" aria-hidden />
          <div className="grow">
            <p className="tl__meta small">
              <span className="tl__kind">{KIND_WORDS[t.kind] ?? t.kind}</span>
              {t.subject && <span> · {subjectShort(t.subject)}</span>}
              <time className="subtle" dateTime={t.ts}>
                {' '}
                · {fmtWhen(t.ts)}
              </time>
            </p>
            <p className="tl__text">{t.text}</p>
            {t.link && (
              <Link to={t.link} className="small">
                Open gap report →
              </Link>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}
