import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLoad } from '../../hooks'
import { Dots, InlineError } from '../../components/ui.jsx'
import PhoneFrame, { FRAMED, useDesktop } from '../../components/PhoneFrame.jsx'
import Pip2D from '../../pip2d/Pip2D.jsx'
import { StudioShell } from '../../staff/StudioShell.jsx'
import { staffApi, useMockUsed } from '../../staff/api'
import { StatusTag } from '../../staff/bits.jsx'
import { LANG_EN, LANG_NAMES, firstName, fmtDate, fmtWhen, subjectName } from '../../staff/format'
import '../../styles/studio.css'

// Parent app (CONTRACT v3.13; DESIGN_SYSTEM v3.14 "Parents / grandparents"): calm, one idea per
// screen, body ≥ 17px (rem, survives 200% text zoom), 48px targets, AAA body text, no game words.
// The chrome is English; updates and messages arrive in the guardian's language.
// Demo identity, no login: /parent?as=g001.

const TABS = [
  { id: 'week', label: 'This week', icon: '◐' },
  { id: 'subjects', label: 'Classes', icon: '▤' },
  { id: 'messages', label: 'Messages', icon: '✉' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
]

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
            One calm screen a week: what their child taught Pip, in the child’s own words, and the mistake they fixed. Messages arrive in the family’s
            language.
          </p>
          <div className="stack-sm">
            <span className="label">Open as</span>
            <div className="parent-desk__who" role="group" aria-label="Demo guardian">
              {[
                { id: 'g001', name: 'Ana R.', note: 'Maya and Theo · reads Spanish · text' },
                { id: 'g002', name: 'Sam R.', note: 'Maya · reads English · email' },
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
            <li>No chat transcripts: only the child’s quoted words and notes a tutor chose to share.</li>
            <li>Private tutor notes never leave the staff side.</li>
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

export function ParentApp() {
  const [sp] = useSearchParams()
  const gid = sp.get('as') ?? 'g001'
  const home = useLoad(() => staffApi.parentHome(gid), [gid])
  const [tab, setTab] = useState(() => (TABS.some((t) => t.id === sp.get('tab')) ? sp.get('tab') : 'week'))
  const [kidId, setKidId] = useState(sp.get('kid'))
  const mock = useMockUsed()

  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#F7F5F0')
  }, [])

  const data = home.data
  const kids = data?.kids ?? []
  const kid = kids.find((k) => k.student.id === kidId) ?? kids[0]
  const g = data?.guardian

  return (
    <div className="parent-app" data-register="parent" data-audience="parent">
      <header className="p-top">
        <div className="p-top__row">
          <span className="p-top__center">Bright Path Tutoring</span>
          <span className="p-demo">demo{mock ? ' · mock data' : ''}</span>
        </div>
        {g && <p className="p-top__hi">Hi, {firstName(g.name)}</p>}
        {kids.length > 1 && tab !== 'settings' && (
          <div className="p-kids" role="tablist" aria-label="Your children">
            {kids.map((k) => (
              <button
                key={k.student.id}
                role="tab"
                aria-selected={k === kid}
                className={`p-kid${k === kid ? ' is-on' : ''}`}
                onClick={() => setKidId(k.student.id)}
              >
                {firstName(k.student.name)}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="p-main">
        {home.loading && !data ? (
          <div className="p-state" role="status">
            <Dots />
            <p>Loading this week…</p>
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
            <p>When the center links your child, their week shows up here.</p>
          </div>
        ) : tab === 'week' ? (
          <Week gid={gid} kid={kid} />
        ) : tab === 'subjects' ? (
          <Classes gid={gid} kid={kid} />
        ) : tab === 'messages' ? (
          <Messages gid={gid} guardian={g} kid={kid} />
        ) : (
          <Settings guardian={g} onSaved={(ng) => home.setData((d) => ({ ...d, guardian: ng }))} />
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
  )
}

function useKid(gid, sid) {
  return useLoad(() => staffApi.parentKid(gid, sid), [gid, sid])
}

function Week({ gid, kid }) {
  const detail = useKid(gid, kid.student.id)
  const w = kid.this_week ?? {}
  const name = firstName(kid.student.name)
  const weeks = detail.data?.weeks ?? []
  const summary = weeks[0]?.summary
  const ideas = w.kos ? 3 * w.kos : null
  return (
    <div className="p-stack">
      <section className="p-hero" aria-label={`${name}’s week`}>
        <div className="p-hero__pip" aria-hidden>
          <Pip2D creature={kid.pip?.creature ?? 'capybara'} vibe={kid.pip?.vibe === 'cool' ? 'cool' : 'plain'} version={1} size={64} animate={false} mood="lightbulb" />
        </div>
        {w.taught_quote ? (
          <>
            <p className="p-eyebrow">This week, {name} taught Pip</p>
            <blockquote className="p-quote">“{w.taught_quote}”</blockquote>
            <p className="p-cap">{name}’s own words, typed to Pip.</p>
          </>
        ) : (
          <>
            <p className="p-eyebrow">This week</p>
            <p className="p-h">{name} hasn’t taught Pip yet this week.</p>
            <p className="p-cap">The next class is a good time to start.</p>
          </>
        )}
      </section>

      {summary && (
        <p className="p-summary" lang={detail.data?.lang}>
          {summary}
        </p>
      )}
      {!summary && ideas && (
        <p className="p-summary">
          {name} taught Pip {ideas} ideas{w.fixed ? ' and fixed one mistake' : ''}.
        </p>
      )}

      {w.fixed && (
        <section className="p-card p-fixed" aria-label="A mistake fixed">
          <p className="p-eyebrow">Fixed a mistake</p>
          <div className="p-fixed__row">
            <span className="p-fixed__tag">Before</span>
            <p className="p-fixed__before">
              <del>{w.fixed.before}</del>
            </p>
          </div>
          <div className="p-fixed__row">
            <span className="p-fixed__tag p-fixed__tag--now">Now</span>
            <p className="p-fixed__after">{w.fixed.after}</p>
          </div>
        </section>
      )}

      <section className="p-stats" aria-label="This week in numbers">
        <div className="p-stat">
          <b>{w.minutes ?? 0}</b>
          <span>minutes teaching Pip</span>
        </div>
        <div className="p-stat">
          <b>{w.missions ?? 0}</b>
          <span>lesson{w.missions === 1 ? '' : 's'} practiced</span>
        </div>
        <div className="p-stat">
          <b>{w.kos ?? 0}</b>
          <span>finished all the way</span>
        </div>
      </section>

      {w.shared_note && (
        <section className="p-card" aria-label="Note from the tutor">
          <p className="p-eyebrow">From {tutorName(kid, w.shared_note)}</p>
          <p className="p-body">{w.shared_note.text}</p>
          <p className="p-cap">{fmtWhen(w.shared_note.ts)}</p>
        </section>
      )}

      <p className="p-explain">Pip is a practice buddy that believes whatever {name} teaches it. When Pip gets a quiz right, it’s because {name} explained it well.</p>
    </div>
  )
}

function tutorName(kid, note) {
  const s = kid.subjects?.find((x) => x.subject === note.subject)
  return s?.tutor?.name ?? 'the tutor'
}

function Classes({ gid, kid }) {
  const detail = useKid(gid, kid.student.id)
  const name = firstName(kid.student.name)
  const notes = detail.data?.shared_notes ?? []
  const weeks = detail.data?.weeks ?? []
  return (
    <div className="p-stack">
      <h2 className="p-h">{name}’s classes</h2>
      <ul className="p-list">
        {(kid.subjects ?? []).map((s) => (
          <li key={s.subject} className="p-card p-class">
            <p className="p-class__name">{subjectName(s.subject)}</p>
            <p className="p-body">with {s.tutor?.name ?? 'their tutor'}</p>
            <p className="p-class__next">
              <span className="p-cap">Next class</span> <b>{s.next_slot ?? 'not scheduled'}</b>
            </p>
            <p className="p-cap">
              {s.ko_count ?? 0} lesson{s.ko_count === 1 ? '' : 's'} finished all the way
            </p>
          </li>
        ))}
      </ul>
      {notes.length > 0 && (
        <section className="p-stack" aria-label="Notes from tutors">
          <h3 className="p-h2">Notes from tutors</h3>
          {notes.map((n) => (
            <div key={n.id} className="p-card">
              <p className="p-body">{n.text}</p>
              <p className="p-cap">
                {subjectName(n.subject)} · {fmtWhen(n.ts)}
              </p>
            </div>
          ))}
        </section>
      )}
      {weeks.length > 1 && (
        <section className="p-stack" aria-label="Earlier weeks">
          <h3 className="p-h2">Earlier weeks</h3>
          {weeks.slice(1).map((w) => (
            <div key={w.week_of} className="p-card">
              <p className="p-cap">Week of {fmtDate(w.week_of)}</p>
              <p className="p-body">{w.summary}</p>
              {w.quotes?.[0] && <p className="p-quote p-quote--sm">“{w.quotes[0]}”</p>}
            </div>
          ))}
        </section>
      )}
    </div>
  )
}

function Messages({ gid, guardian, kid }) {
  const sid = kid.student.id
  const t = useLoad(() => staffApi.thread(sid, gid), [sid, gid])
  const detail = useKid(gid, sid)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const names = { center: 'Bright Path', [gid]: 'You', ...Object.fromEntries((detail.data?.tutors ?? []).map((x) => [x.id, x.name])) }
  const items = t.data?.items ?? []
  const tutors = detail.data?.tutors ?? kid.subjects?.map((s) => s.tutor) ?? []

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
      <p className="p-cap">With {[...new Set(tutors.map((x) => x?.name).filter(Boolean))].join(' and ') || 'the center'}</p>
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
                <span className="p-msg__who">{me ? 'You' : names[m.author_id] ?? names[m.from] ?? 'Bright Path'}</span>
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
          Write to the tutor{guardian?.language && guardian.language !== 'en' ? ` (any language is fine)` : ''}
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

function Settings({ guardian, onSaved }) {
  const [v, setV] = useState(() => ({
    prefers: guardian?.prefers ?? 'sms',
    language: guardian?.language ?? 'en',
    updates: guardian?.updates ?? 'weekly',
    quiet_hours: guardian?.quiet_hours ?? null,
  }))
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState(null)
  if (!guardian) return null
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
        {choice('prefers', "sms", "Text message", guardian.phone ?? 'No phone number on file')}
        {choice('prefers', "email", "Email", guardian.email ?? 'No email on file')}
      </fieldset>
      <fieldset className="p-field">
        <legend>Language for updates and messages</legend>
        {Object.keys(LANG_NAMES).map((l) => choice('language', l, LANG_NAMES[l], l === 'en' ? null : LANG_EN[l]))}
      </fieldset>
      <fieldset className="p-field">
        <legend>How often?</legend>
        {choice('updates', "every_ko", "After every finished lesson", null)}
        {choice('updates', "weekly", "Once a week", null)}
        {choice('updates', "off", "No updates", "You can still message the tutor")}
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
