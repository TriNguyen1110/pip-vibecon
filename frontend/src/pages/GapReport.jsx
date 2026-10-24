import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import { useLoad } from '../hooks'
import {
  Dots,
  ErrorState,
  InlineError,
  Loading,
  STATUS_PILL,
  STATUS_WORDS,
  Shell,
  fmtTime,
  initialsOf,
} from '../components/ui.jsx'
import { CIRCLED } from '../lib'

export default function GapReport() {
  const { sessionId } = useParams()
  const ctx = useLoad(async () => {
    const [session, report] = await Promise.all([api.session(sessionId), api.report(sessionId)])
    let student = null
    let assignment = null
    try {
      const d = await api.student(session.student_id)
      student = d.student
      assignment = d.assignments?.find((a) => a.id === session.assignment_id) ?? null
    } catch {
      /* the report still renders without names */
    }
    return { session, report, student, assignment }
  }, [sessionId])

  return (
    <Shell who="Ms. Rivera" initials="MR">
      <div className="page page--narrow stack staff">
        <Link to="/tutor" className="small back">
          ← Roster
        </Link>
        {ctx.loading && !ctx.data ? (
          <Loading label="Reading the session…" />
        ) : ctx.error && !ctx.data ? (
          <ErrorState error={ctx.error} onRetry={ctx.reload} title="The report didn’t load." />
        ) : (
          <ReportBody {...ctx.data} sessionId={sessionId} />
        )}
      </div>
    </Shell>
  )
}

function ReportBody({ report, student, assignment, session, sessionId }) {
  const name = student?.name ?? 'Student'
  const first = name.split(' ')[0]
  const concepts = report.concepts ?? []
  const weakest =
    concepts.find((c) => c.status === 'misconception') ?? concepts.find((c) => c.status === 'vague') ?? null

  return (
    <>
      <header className="report-head">
        <span className="avatar avatar--lg avatar--pip" aria-hidden>
          {initialsOf(name)}
        </span>
        <div className="stack-sm grow">
          <p className="eyebrow">Gap report{session?.saved || session?.label ? ` · ${session.label ?? 'saved session'}` : ''}</p>
          <h1 className="display h-page">{name}</h1>
          <p className="muted">
            {assignment?.topic ?? 'Pip mission'}
            {student?.grade ? ` · Grade ${student.grade}` : ''}
          </p>
        </div>
      </header>

      <div className="report-stats">
        <div className="stat">
          <span className="mono stat__n">{report.minutes ?? '—'}</span>
          <span className="small subtle">{report.minutes === 1 ? 'minute' : 'minutes'} teaching</span>
        </div>
        <div className="stat">
          <span className="mono stat__n">
            {report.quiz_passed ?? 0}/{report.quiz_total ?? concepts.length}
          </span>
          <span className="small subtle">Pip’s quiz passed</span>
        </div>
        <div className="stat">
          <span className="mono stat__n">{session?.reteach_count ?? 0}</span>
          <span className="small subtle">{session?.reteach_count === 1 ? 're-teach' : 're-teaches'}</span>
        </div>
      </div>

      {report.summary && <p className="report-summary">{report.summary}</p>}

      <section className="glass card stack" aria-label="What the student explained">
        <div className="row row--between">
          <h2 className="card-title">What {first} explained</h2>
          {assignment?.boss?.name && <span className="chip small">students call it {assignment.boss.name}</span>}
        </div>
        <ol className="gap-list">
          {concepts.map((c, i) => (
            <li key={c.concept_id ?? i} className="gap">
              <div className="gap__head">
                <span className="gap__n mono" aria-hidden>
                  {CIRCLED[i]}
                </span>
                <span className="gap__text grow">{c.concept_text}</span>
                <span className={`pill ${STATUS_PILL[c.status] ?? 'pill--info'}`}>{STATUS_WORDS[c.status] ?? c.status}</span>
              </div>
              {c.quote ? (
                <blockquote className="gap__quote">
                  <span className="quote">“{c.quote}”</span>
                  <span className="small subtle"> — {first}, taught to Pip</span>
                </blockquote>
              ) : (
                <p className="small subtle gap__quote">No rule taught for this one.</p>
              )}
              {c.fixed_after ? (
                <span className="pill pill--ok gap__fixed">
                  fixed after {c.fixed_after} re-teach
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      <section className="glass card tuesday stack" aria-label="Start Tuesday's session here">
        <p className="eyebrow">Start Tuesday’s session here</p>
        {weakest && <p className="small subtle">Weakest: {weakest.concept_text}</p>}
        <p className="tuesday__opener">{report.opener}</p>
        {report.root_cause && (
          <div className="tuesday__row">
            <span className="label">Root cause</span>
            <span>{report.root_cause}</span>
          </div>
        )}
        {report.cliffhanger && (
          <div className="tuesday__row">
            <span className="label">Pip’s cliffhanger</span>
            <span className="quote">“{report.cliffhanger}”</span>
          </div>
        )}
      </section>

      <ParentUpdate sessionId={sessionId} studentId={session?.student_id} first={first} />
    </>
  )
}

function ParentUpdate({ sessionId, studentId, first }) {
  const [msg, setMsg] = useState('')
  const [phase, setPhase] = useState('idle') // idle | previewing | ready | sending | sent
  const [err, setErr] = useState(null)
  const [sent, setSent] = useState(null)
  const log = useLoad(() => api.sentLog(), [])
  const items = (log.data?.items ?? []).filter((x) => !studentId || x.student_id === studentId).slice().reverse()

  async function preview() {
    setPhase('previewing')
    setErr(null)
    try {
      const r = await api.parentPreview(sessionId)
      setMsg(r.message ?? '')
      setPhase('ready')
    } catch (e) {
      setErr(e)
      setPhase('idle')
    }
  }
  async function send() {
    setPhase('sending')
    setErr(null)
    try {
      const r = await api.parentSend(sessionId, msg)
      setSent(r.sent)
      setPhase('sent')
      log.reload()
    } catch (e) {
      setErr(e)
      setPhase('ready')
    }
  }

  return (
    <section className="glass card stack" aria-label="Parent update">
      <div className="stack-sm">
        <h2 className="card-title">Weekly update to {first}’s parent</h2>
        <p className="small muted">Leads with what {first} taught and what’s next. No list of mistakes. Test mode.</p>
      </div>

      {phase === 'idle' || phase === 'previewing' ? (
        <div>
          <button className="btn btn--primary" onClick={preview} disabled={phase === 'previewing'}>
            {phase === 'previewing' ? (
              <>
                Writing <Dots />
              </>
            ) : (
              'Send weekly update to parent'
            )}
          </button>
        </div>
      ) : (
        <div className="parent-preview">
          <div className="phone" aria-label="Message preview">
            <p className="phone__from small subtle">Bright Path Tutoring</p>
            {phase === 'sent' ? (
              <p className="phone__bubble">{sent?.message ?? msg}</p>
            ) : (
              <textarea
                className="textarea phone__edit"
                rows={6}
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                aria-label="Parent message"
              />
            )}
            {phase === 'sent' && (
              <p className="small phone__status">
                {sent?.status === 'delivered' ? '✓ Delivered' : sent?.status ?? 'Sent'} {sent?.to ? `to ${sent.to}` : ''}
              </p>
            )}
          </div>
          {phase !== 'sent' && (
            <div className="row">
              <button className="btn btn--primary" onClick={send} disabled={phase === 'sending' || !msg.trim()}>
                {phase === 'sending' ? 'Sending…' : 'Send update'}
              </button>
              <button className="btn btn--ghost" onClick={preview} disabled={phase === 'sending'}>
                Rewrite
              </button>
            </div>
          )}
        </div>
      )}
      <InlineError error={err} onRetry={phase === 'ready' ? send : preview} />

      <div className="stack-sm">
        <p className="eyebrow">Sent log</p>
        {log.error && !log.data ? (
          <InlineError error={log.error} onRetry={log.reload} />
        ) : items.length === 0 ? (
          <p className="small subtle">Nothing sent yet.</p>
        ) : (
          <ul className="sent-log">
            {items.map((x) => (
              <li key={x.id}>
                <div className="row row--between">
                  <span className="small mono subtle">
                    {fmtTime(x.ts)} · {x.to}
                  </span>
                  <span className={`pill ${x.status === 'delivered' ? 'pill--ok' : 'pill--info'}`}>{x.status}</span>
                </div>
                <p className="small muted sent-log__msg">{x.message}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
