import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLoad } from '../../hooks'
import { Dots, InlineError } from '../../components/ui.jsx'
import PhoneFrame, { FRAMED, useDesktop } from '../../components/PhoneFrame.jsx'
import Pip2D from '../../pip2d/Pip2D.jsx'
import { StudioShell } from '../../staff/StudioShell.jsx'
import { staffApi, useMockUsed } from '../../staff/api'
import { StatusTag } from '../../staff/bits.jsx'
import { pip2dProps } from '../../staff/pip'
import { firstName, fmtDate, fmtWhen, subjectName } from '../../staff/format'
import '../../styles/studio.css'

// Parent app. CONTRACT v3.15: the tutor is the filter, so families see only what the tutor sends:
// reports, shared notes, messages, schedule and hours. No transcripts, no minutes, no activity times.
// v3.16: English only. DESIGN_SYSTEM v3.14 "Parents / grandparents": calm, one idea per screen,
// body ≥ 17px (rem, survives 200% text zoom), 48px targets, AAA body text, no game words.
// Demo identity, no login: /parent?as=g001.

const TABS = [
  { id: 'home', label: 'From tutor', icon: '✎' },
  { id: 'messages', label: 'Messages', icon: '✉' },
  { id: 'schedule', label: 'Schedule', icon: '▤' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
]
const TAB_ALIASES = { week: 'home', subjects: 'schedule', classes: 'schedule' }

export default function ParentRoute() {
  const desktop = useDesktop()
  const [sp] = useSearchParams()
  if (!desktop || FRAMED) return <ParentApp />
  return <ParentDesk gid={sp.get('as') ?? 'g001'} search={sp} />
}

// Desktop: the parent's phone, in the calm Studio room, with a guardian switch for the demo.
function ParentDesk({ gid, search }) {
  const [as, setAs] = useState(gid)
  const src = useMemo(() => {
    const p = new URLSearchParams(search)
    p.set('as', as)
    return `/parent?${p}`
  }, [as, search])
  return (
    <StudioShell who="Parent app" wide>
      <div className="studio-band" aria-hidden />
      <div className="page page--wide parent-desk">
        <section className="parent-desk__copy stack">
          <p className="eyebrow">Parent app · demo</p>
          <h1 className="display h-page">What families see</h1>
          <p className="muted">
            Only what the tutor sends: reports, notes they chose to share, messages, the schedule and package hours. Students can be honest with
            Pip because their family never sees the chat.
          </p>
          <div className="stack-sm">
            <span className="label">Open as</span>
            <div className="parent-desk__who" role="group" aria-label="Demo guardian">
              {[
                { id: 'g001', name: 'Ana R.', note: 'Maya and Theo · text message' },
                { id: 'g002', name: 'Sam R.', note: 'Maya · email' },
              ].map((g) => (
                <button key={g.id} type="button" className={`who-btn${as === g.id ? ' is-on' : ''}`} aria-pressed={as === g.id} onClick={() => setAs(g.id)}>
                  <b>{g.name}</b>
                  <span className="small subtle">{g.note}</span>
                </button>
              ))}
            </div>
          </div>
          <ul className="parent-desk__rules small muted">
            <li>Families only see their own children.</li>
            <li>Every report is approved by the tutor before it goes out.</li>
            <li>No chat transcripts, no minutes, no “last active” times. Private tutor notes stay private.</li>
            <li>Every message is test mode in this demo. All people are synthetic.</li>
          </ul>
        </section>
        <div className="parent-desk__phone">
          <PhoneFrame key={as} src={src} title="Pip parent app" follow={false} />
        </div>
      </div>
    </StudioShell>
  )
}

const initialTab = (t) => {
  const v = TAB_ALIASES[t] ?? t
  return TABS.some((x) => x.id === v) ? v : 'home'
}

export function ParentApp() {
  const [sp] = useSearchParams()
  const gid = sp.get('as') ?? 'g001'
  const home = useLoad(() => staffApi.parentHome(gid), [gid])
  const [tab, setTab] = useState(() => initialTab(sp.get('tab')))
  const [kidId, setKidId] = useState(sp.get('kid'))
  const mock = useMockUsed()
  const mainRef = useRef(null)
  const more = useMoreBelow(mainRef, [tab, kidId, home.data])

  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#F7F5F0')
  }, [])

  const data = home.data
  const kids = data?.kids ?? []
  const kid = kids.find((k) => k.student.id === kidId) ?? kids[0]
  const g = data?.guardian

  return (
    <div className="parent-app" data-register="parent" data-audience="parent">
      <div className="p-shell">
        <header className="p-top">
          <div className="p-top__row">
            <span className="p-top__center">Bright Path Tutoring</span>
            <span className="p-demo">demo{mock ? ' · mock data' : ''}</span>
          </div>
          {g && <p className="p-top__hi">Hi, {firstName(g.name)}</p>}
          {kids.length > 1 && tab !== 'settings' && (
            <div className="p-kids" role="tablist" aria-label="Your children">
              {kids.map((k) => (
                <button key={k.student.id} role="tab" aria-selected={k === kid} className={`p-kid${k === kid ? ' is-on' : ''}`} onClick={() => setKidId(k.student.id)}>
                  {k.pip?.creature && (
                    <span className="p-kid__pip" aria-hidden>
                      <Pip2D {...pip2dProps(k.pip)} size={40} animate={false} />
                    </span>
                  )}
                  {firstName(k.student.name)}
                </button>
              ))}
            </div>
          )}
        </header>

        <main className="p-main" ref={mainRef}>
          {home.loading && !data ? (
            <div className="p-state" role="status">
              <Dots />
              <p>Loading…</p>
            </div>
          ) : home.error && !data ? (
            <div className="p-state" role="alert">
              <p className="p-h">We couldn’t open this page.</p>
              <p>{home.error.status === 404 ? 'This family link isn’t set up yet. Ask the center for a new one.' : home.error.message}</p>
              <button className="p-btn" onClick={home.reload}>
                Try again
              </button>
            </div>
          ) : !kid ? (
            <div className="p-state">
              <p className="p-h">No children linked yet</p>
              <p>When the center links your child, their tutor’s reports show up here.</p>
            </div>
          ) : tab === 'home' ? (
            <FromTutor gid={gid} kid={kid} />
          ) : tab === 'schedule' ? (
            <Schedule kid={kid} />
          ) : tab === 'messages' ? (
            <Messages gid={gid} kid={kid} />
          ) : (
            <Settings guardian={g} kids={kids} onSaved={(ng) => home.setData((d) => ({ ...d, guardian: ng }))} />
          )}
          {more && (
            <div className="p-more">
              <button type="button" className="p-more__btn" onClick={() => mainRef.current?.scrollBy({ top: mainRef.current.clientHeight * 0.7, behavior: 'smooth' })}>
                More below <span aria-hidden>↓</span>
              </button>
            </div>
          )}
        </main>

        <nav className="p-tabs" aria-label="Sections">
          {TABS.map((t) => (
            <button key={t.id} className={`p-tab${tab === t.id ? ' is-on' : ''}`} aria-current={tab === t.id ? 'page' : undefined} onClick={() => setTab(t.id)}>
              <span className="p-tab__icon" aria-hidden>
                {t.icon}
              </span>
              <span className="p-tab__label">{t.label}</span>
              {t.id === 'messages' && data?.unread > 0 && (
                <span className="p-tab__badge" aria-label={`${data.unread} new`}>
                  {data.unread}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}

// True while the scrolling main area has content below the fold (shows the "More below" cue).
function useMoreBelow(ref, deps) {
  const [more, setMore] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.scrollTop = 0
    const check = () => setMore(el.scrollHeight - el.clientHeight - el.scrollTop > 24 && getComputedStyle(el).overflowY !== 'visible')
    check()
    const t = setTimeout(check, 400)
    el.addEventListener('scroll', check, { passive: true })
    const ro = new ResizeObserver(check)
    ro.observe(el)
    if (el.firstElementChild) ro.observe(el.firstElementChild)
    return () => {
      clearTimeout(t)
      el.removeEventListener('scroll', check)
      ro.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return more
}

// "Tue" within the last week, else "Oct 12". Labels when the tutor sent something, never activity.
function sentLabel(ts) {
  if (!ts) return ''
  const t = new Date(String(ts).length === 10 ? `${ts}T12:00:00` : ts)
  if (Number.isNaN(t.getTime())) return ''
  const days = (Date.now() - t.getTime()) / 86400000
  return days < 6.5 ? t.toLocaleDateString('en-US', { weekday: 'short' }) : t.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const tutorNames = (kid) => Object.fromEntries((kid.subjects ?? []).map((s) => [s.tutor?.id, s.tutor?.name]).filter(([k]) => k))

// Reports = what the tutor sent (B18): the kid detail carries every report; home carries the latest.
function useReports(gid, kid) {
  const d = useLoad(() => staffApi.parentKid(gid, kid.student.id), [gid, kid.student.id])
  const latest = kid.this_week?.latest_report
  const reports = (d.data?.reports ?? kid.reports ?? (latest ? [latest] : [])).slice().sort((a, b) => (stamp(a) < stamp(b) ? 1 : -1))
  return { reports, loading: d.loading && !d.data && !latest }
}
const stamp = (r) => r.ts ?? r.date ?? ''

function FromTutor({ gid, kid }) {
  const { reports, loading } = useReports(gid, kid)
  const name = firstName(kid.student.name)
  const w = kid.this_week ?? {}
  const latest = reports[0]
  const sessions = w.sessions ?? w.missions
  const note = w.shared_note
  const mainTutor = kid.subjects?.[0]?.tutor?.name ?? 'the tutor'
  return (
    <div className="p-stack p-week">
      {loading ? (
        <p className="p-body">
          Loading <Dots />
        </p>
      ) : latest ? (
        <ReportCard report={latest} kid={kid} hero />
      ) : (
        <section className="p-hero" aria-label="Latest report">
          <p className="p-eyebrow">From {mainTutor}</p>
          <p className="p-h">No report yet this week.</p>
          <p className="p-cap">
            {mainTutor} sends one after {name}’s class.
          </p>
        </section>
      )}

      {(kid.goal_progress ?? []).map((gp) => (
        <section key={gp.subject} className="p-card p-goal" aria-label={`${gp.subject_name ?? subjectName(gp.subject)} goal`}>
          <p className="p-eyebrow">{gp.goal ?? `${gp.subject_name ?? subjectName(gp.subject)} goal`}</p>
          <p className="p-goal__nums">
            <b>{gp.latest}</b> <span>latest practice score{gp.start != null ? `, up from ${gp.start}` : ''} · goal {gp.target}</span>
          </p>
          <span className="p-goal__bar" aria-hidden>
            <i style={{ width: `${Math.max(4, Math.min(100, (gp.latest / gp.target) * 100))}%` }} />
          </span>
        </section>
      ))}

      {sessions > 0 && (
        <p className="p-summary p-summary--quiet">
          {name} practiced with Pip {sessions === 1 ? 'once' : `${sessions} times`} this week
          {w.kos ? `, and finished ${w.kos === 1 ? 'a lesson' : `${w.kos} lessons`} all the way` : ''}.
        </p>
      )}

      {note && (
        <section className="p-card" aria-label="Note from the tutor">
          <p className="p-eyebrow">
            From {note.from?.name ?? note.tutor_name ?? tutorNames(kid)[note.tutor_id] ?? 'the tutor'} · {sentLabel(note.date ?? note.ts)}
          </p>
          <p className="p-body">{note.text}</p>
        </section>
      )}

      {reports.length > 1 && (
        <section className="p-stack" aria-label="Earlier reports">
          <h3 className="p-h2">Earlier reports</h3>
          {reports.slice(1, 5).map((r) => (
            <ReportCard key={r.id} report={r} kid={kid} />
          ))}
        </section>
      )}

      <p className="p-explain">Pip is a practice buddy {name} teaches. You see what {name}’s tutor chooses to share, never the chat itself.</p>
    </div>
  )
}

function ReportCard({ report, kid, hero }) {
  const name = firstName(kid.student.name)
  const g = report.goal
  return (
    <section className={hero ? 'p-hero p-report' : 'p-card p-report'} aria-label={`Report from ${report.from?.name ?? 'the tutor'}`}>
      <div className="p-hero__top">
        {hero && kid.pip?.creature && (
          <div className="p-hero__pip" aria-hidden title={kid.pip?.name}>
            <Pip2D {...pip2dProps(kid.pip)} size={64} animate={false} />
          </div>
        )}
        <p className="p-eyebrow">
          From {report.from?.name ?? 'Bright Path'} · {sentLabel(stamp(report))}
          {report.subject ? <span className="p-cap"> · {subjectName(report.subject)}</span> : null}
        </p>
      </div>
      {report.quote && (
        <>
          <blockquote className={hero ? 'p-quote' : 'p-quote p-quote--sm'}>“{report.quote}”</blockquote>
          <p className="p-cap">{name}’s own words</p>
        </>
      )}
      {g && (
        <div className="p-goal">
          <p className="p-cap">{g.label ?? 'Practice score'}</p>
          <p className="p-goal__nums">
            <b>{g.latest}</b> <span>of a {g.target} goal</span>
          </p>
          <span className="p-goal__bar" aria-hidden>
            <i style={{ width: `${Math.max(4, Math.min(100, (g.latest / g.target) * 100))}%` }} />
          </span>
        </div>
      )}
      <p className="p-body">{report.text}</p>
      {report.fixed && (
        <div className="p-fixed">
          <p className="p-eyebrow">Fixed a mistake</p>
          <div className="p-fixed__row">
            <span className="p-fixed__tag">Before</span>
            <p className="p-fixed__before">
              <del>{report.fixed.before}</del>
            </p>
          </div>
          <div className="p-fixed__row">
            <span className="p-fixed__tag p-fixed__tag--now">Now</span>
            <p className="p-fixed__after">{report.fixed.after}</p>
          </div>
        </div>
      )}
    </section>
  )
}

function Schedule({ kid }) {
  const name = firstName(kid.student.name)
  return (
    <div className="p-stack">
      <h2 className="p-h">{name}’s classes</h2>
      <ul className="p-list">
        {(kid.subjects ?? []).map((s) => {
          const pkg = s.package
          const left = pkg ? (pkg.hours_left ?? (pkg.hours_total ?? 0) - (pkg.hours_used ?? 0)) : null
          return (
            <li key={s.subject} className="p-card p-class">
              <p className="p-class__name">{subjectName(s.subject)}</p>
              <p className="p-body">with {s.tutor?.name ?? 'their tutor'}</p>
              <p className="p-class__next">
                <span className="p-cap">Next class</span> <b>{s.next_slot ?? 'not scheduled'}</b>
              </p>
              {pkg && (
                <p className={`p-hours${left <= 2 ? ' is-low' : ''}`}>
                  <b>{left}</b> of {pkg.hours_total} hours left{pkg.renews_on ? ` · renews ${fmtDate(pkg.renews_on)}` : ''}
                </p>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function Messages({ gid, kid }) {
  const sid = kid.student.id
  const t = useLoad(() => staffApi.thread(sid, gid), [sid, gid])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const names = { center: 'Bright Path', [gid]: 'You', ...tutorNames(kid) }
  const items = t.data?.items ?? []
  // Newest message is at the bottom: open the thread scrolled to it.
  useEffect(() => {
    const el = document.querySelector('.p-main')
    if (el && items.length) el.scrollTop = el.scrollHeight
  }, [items.length])
  const tutors = [...new Set((kid.subjects ?? []).map((s) => s.tutor?.name).filter(Boolean))]

  async function send(e) {
    e.preventDefault()
    if (!text.trim()) return
    setBusy(true)
    setErr(null)
    try {
      const m = await staffApi.sendThread({ student_id: sid, guardian_id: gid, from: 'guardian', author_id: gid, text: text.trim() })
      t.setData((d) => ({ items: [...(d?.items ?? []), m] }))
      setText('')
    } catch (x) {
      setErr(x)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="p-stack p-msgs">
      <h2 className="p-h">About {firstName(kid.student.name)}</h2>
      <p className="p-cap">With {tutors.join(' and ') || 'the center'}</p>
      {t.loading && !t.data ? (
        <p className="p-body">
          Loading <Dots />
        </p>
      ) : t.error && !t.data ? (
        <InlineError error={t.error} onRetry={t.reload} />
      ) : (
        <ol className="p-thread" aria-label="Messages" aria-live="polite">
          {items.length === 0 && <li className="p-body">No messages yet. Say hello to the tutor below.</li>}
          {items.map((m) => {
            const me = m.from === 'guardian'
            return (
              <li key={m.id} className={`p-msg${me ? ' p-msg--me' : ''}`}>
                <span className="p-msg__who">{me ? 'You' : m.author?.name ?? names[m.author_id] ?? names[m.from] ?? 'Bright Path'}</span>
                <p className="p-msg__text">{m.text}</p>
                <span className="p-msg__meta">
                  {fmtWhen(m.ts)}
                  {me && m.status && m.status !== 'received' && (
                    <>
                      {' '}
                      · <StatusTag status={m.status} />
                    </>
                  )}
                </span>
              </li>
            )
          })}
        </ol>
      )}
      <form className="p-compose" onSubmit={send}>
        <label htmlFor="p-compose" className="p-cap">
          Write to the tutor
        </label>
        <textarea id="p-compose" className="p-input" rows={3} value={text} onChange={(e) => setText(e.target.value)} disabled={busy} />
        <button className="p-btn p-btn--primary" disabled={busy || !text.trim()}>
          {busy ? 'Sending…' : 'Send'}
        </button>
        {err && <p className="p-err">{err.message}</p>}
      </form>
      <p className="p-cap">Demo: messages stay inside this app (test mode).</p>
    </div>
  )
}

function Settings({ guardian, kids, onSaved }) {
  const [v, setV] = useState(() => ({
    prefers: guardian?.prefers ?? 'sms',
    updates: guardian?.updates ?? 'weekly',
    quiet_hours: guardian?.quiet_hours ?? null,
  }))
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState(null)
  if (!guardian) return null
  const tutor = kids?.[0]?.subjects?.[0]?.tutor?.name ?? 'the tutor'
  const set = (k, x) => {
    setV((o) => ({ ...o, [k]: x }))
    setSaved(false)
  }
  async function save(e) {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    try {
      const r = await staffApi.patchGuardian(guardian.id, v)
      onSaved({ ...guardian, ...v, ...r })
      setSaved(true)
    } catch (x) {
      setErr(x)
    } finally {
      setBusy(false)
    }
  }
  const choice = (name, value, label, hint) => (
    <label key={`${name}-${value}`} className={`p-choice${v[name] === value ? ' is-on' : ''}`}>
      <input type="radio" name={name} value={value} checked={v[name] === value} onChange={() => set(name, value)} />
      <span>
        <b>{label}</b>
        {hint && <span className="p-cap">{hint}</span>}
      </span>
    </label>
  )
  return (
    <form className="p-stack" onSubmit={save}>
      <h2 className="p-h">Your settings</h2>
      <fieldset className="p-field">
        <legend>How should we reach you?</legend>
        {choice('prefers', 'sms', 'Text message', guardian.phone ?? 'No phone number on file')}
        {choice('prefers', 'email', 'Email', guardian.email ?? 'No email on file')}
      </fieldset>
      <fieldset className="p-field">
        <legend>How often would you like a report?</legend>
        {choice('updates', 'every_ko', 'After each finished lesson', `${tutor} reviews each one before it’s sent`)}
        {choice('updates', 'weekly', 'Once a week', null)}
        {choice('updates', 'off', 'No reports', 'You can still message the tutor')}
      </fieldset>
      <fieldset className="p-field">
        <legend>Quiet hours</legend>
        <label className={`p-choice${v.quiet_hours ? ' is-on' : ''}`}>
          <input type="checkbox" checked={!!v.quiet_hours} onChange={(e) => set('quiet_hours', e.target.checked ? '21:00-07:00' : null)} />
          <span>
            <b>Don’t message me 9pm–7am</b>
            <span className="p-cap">Messages wait until morning</span>
          </span>
        </label>
      </fieldset>
      <button className="p-btn p-btn--primary" disabled={busy}>
        {busy ? 'Saving…' : 'Save settings'}
      </button>
      {saved && (
        <p className="p-ok" role="status">
          Saved.
        </p>
      )}
      {err && <p className="p-err">{err.message}</p>}
    </form>
  )
}
