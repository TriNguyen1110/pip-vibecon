import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import { Dots, InlineError, useToast } from '../../components/ui.jsx'
import { pickReportSession } from '../../lib'
import { Toggle } from '../../staff/StudioShell.jsx'
import { isMissing, staffApi } from '../../staff/api'
import { StatusTag } from '../../staff/bits.jsx'
import { PREFERS_WORDS, firstName, fmtWhen, reachable, subjectName } from '../../staff/format'

// CONTRACT v3.15: the tutor is the filter. Parent updates are drafts the tutor approves, edits or skips.
// B18 drafts API when it exists; until then a "legacy" draft is built from the v3.13 preview/send endpoints.
// Quotes: grade ≥ 7 shows the student's own shared moments first and never auto-picks; grade ≤ 6 may
// auto-send a short K.O. note (auto_ko_note).

const isSat = (student, subject) => (student?.grade ?? 0) >= 10 || String(subject ?? '').startsWith('sat_')

export function AutoKoNote({ student, onChange }) {
  const [on, setOn] = useState(!!student.auto_ko_note)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState(null)
  if ((student.grade ?? 99) > 6) return null
  async function flip(v) {
    setOn(v)
    setBusy(true)
    setNote(null)
    try {
      const r = await staffApi.studentSettings(student.id, { auto_ko_note: v })
      onChange?.(r?.student ?? { ...student, auto_ko_note: v })
    } catch (e) {
      setOn(!v)
      setNote(isMissing(e) ? 'Automatic notes aren’t switched on for this center yet.' : e.message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="auto-ko">
      <Toggle id={`auto-ko-${student.id}`} checked={on} onChange={(v) => !busy && flip(v)} label="Send a short note automatically after each finished lesson">
        <span className="auto-ko__text">
          <b>Auto note after each finished lesson</b>
          <span className="small subtle">Grade 6 and under only. A short note goes out without review; full updates still wait for you.</span>
        </span>
      </Toggle>
      {note && <p className="small warn-line">{note}</p>}
    </div>
  )
}

export default function ToSend({ student, guardians, drafts, setDrafts, latestSession, needsUpdate }) {
  const legacy = drafts.legacy
  const items = (drafts.items ?? []).filter((d) => (d.status ?? 'draft') === 'draft')
  const [making, setMaking] = useState(false)
  const [err, setErr] = useState(null)
  const targets = guardians.filter((g) => g.updates !== 'off')

  async function makeDraft() {
    setMaking(true)
    setErr(null)
    try {
      if (!legacy) {
        const d = await staffApi.createDraft(student.id, latestSession ? { session_id: latestSession } : {})
        setDrafts((x) => ({ ...x, items: [d, ...(x.items ?? [])] }))
      } else {
        const d = await buildLegacyDraft(student, guardians, latestSession)
        setDrafts((x) => ({ ...x, items: [d] }))
      }
    } catch (e) {
      setErr(e)
    } finally {
      setMaking(false)
    }
  }

  const done = (id) => setDrafts((x) => ({ ...x, items: (x.items ?? []).filter((d) => d.id !== id), sentCount: (x.sentCount ?? 0) + 1 }))

  return (
    <section className="to-send" aria-label="To send">
      <div className="row row--between">
        <div>
          <h3 className="sec-title">
            To send {items.length > 0 && <span className="count-dot mono">{items.length}</span>}
          </h3>
          <p className="small subtle">
            Families only see what you send. Nothing goes out until you approve it
            {targets.length ? ` (to ${targets.map((g) => g.name).join(' and ')})` : ''}.
          </p>
        </div>
        {items.length === 0 && (
          <button className="btn btn--sm" onClick={makeDraft} disabled={making || !targets.length}>
            {making ? (
              <>
                Drafting <Dots />
              </>
            ) : (
              'Draft an update'
            )}
          </button>
        )}
      </div>
      {items.length === 0 && needsUpdate && !making && (
        <p className="small warn-line">No update since {firstName(student.name)}’s last finished lesson.</p>
      )}
      <InlineError error={err} onRetry={makeDraft} />
      {items.map((d) => (
        <DraftCard
          key={d.id}
          draft={d}
          student={student}
          guardians={guardians}
          onChange={(nd) => setDrafts((x) => ({ ...x, items: x.items.map((y) => (y.id === d.id ? nd : y)) }))}
          onDone={() => done(d.id)}
        />
      ))}
    </section>
  )
}

// Swap the quoted words inside each message (or add them) so the text matches the pick (legacy drafts).
function applyLegacyQuote(draft, m, kid) {
  const old = draft.quote?.text ?? draft.autoQuote
  const by_guardian = draft.by_guardian.map((x) => {
    let t = x.message ?? ''
    if (old && t.includes(old)) {
      t = m ? t.replace(old, m.text) : t.replace(`: “${old}”`, '').replace(`: "${old}"`, '').replace(`“${old}”`, '').replace(`"${old}"`, '')
    } else if (m) t = `${t.trim()} In ${kid}’s words: “${m.text}”`
    return { ...x, message: t }
  })
  return { ...draft, quote: m, autoQuote: null, by_guardian }
}

// v3.13 compat: preview gives per-guardian text; the session transcript gives the moments to quote.
async function buildLegacyDraft(student, guardians, sessionId) {
  let sid = sessionId
  if (!sid) {
    const d = await api.student(student.id)
    sid = pickReportSession(d.sessions)?.id
  }
  if (!sid) throw new Error(`${firstName(student.name)} hasn’t finished a lesson yet, so there’s nothing to report.`)
  const [r, s] = await Promise.all([staffApi.updatePreview(sid, student.id), staffApi.session(sid).catch(() => null)])
  const shared = new Set((s?.shares ?? []).map((x) => x.msg_index))
  const moments = (s?.transcript ?? [])
    .map((m, i) => ({ msg_index: i, text: m.text, from: m.from, shared: shared.has(i), session_id: sid }))
    .filter((m) => m.from === 'student' && m.text?.trim().length > 6)
  const per = r.by_guardian ?? r.messages ?? guardians.filter((g) => g.updates !== 'off').map((g) => ({ guardian_id: g.id, name: g.name, via: g.prefers, message: r.message }))
  const inText = moments.find((m) => per.some((x) => x.message?.includes(m.text)))
  const older = (student.grade ?? 0) >= 7
  const d = {
    id: `legacy-${sid}`,
    legacy: true,
    session_id: sid,
    subject: s?.subject ?? null,
    topic: s?.topic ?? null,
    english: r.message,
    quote: null,
    autoQuote: inText ? inText.text : null,
    by_guardian: per.map((x) => ({ ...x, via: x.via ?? x.prefers })),
    moments,
    status: 'draft',
    created_at: new Date().toISOString(),
  }
  // Grade ≥ 7: never an automatic quote; use the student's shared moment if there is one.
  return older ? applyLegacyQuote(d, moments.find((m) => m.shared) ?? null, firstName(student.name)) : d
}

function DraftCard({ draft, student, guardians, onChange, onDone }) {
  const toast = useToast()
  const [busy, setBusy] = useState(null) // quote | send | skip
  const [err, setErr] = useState(null)
  const [sent, setSent] = useState(null)
  const [picking, setPicking] = useState(false)
  const kid = firstName(student.name)
  const older = (student.grade ?? 0) >= 7
  const sat = isSat(student, draft.subject)
  const moments = draft.moments ?? []
  const sharedMoments = moments.filter((m) => m.shared)
  const otherMoments = moments.filter((m) => !m.shared)
  const quoteText = draft.quote?.text ?? null

  async function pick(m) {
    setErr(null)
    setPicking(false)
    if (draft.legacy) {
      onChange(applyLegacyQuote(draft, m, kid))
      return
    }
    setBusy('quote')
    try {
      const nd = await staffApi.patchDraft(draft.id, { quote: m ? { session_id: m.session_id, msg_index: m.msg_index } : null })
      onChange({ ...draft, ...nd })
    } catch (e) {
      setErr(e)
    } finally {
      setBusy(null)
    }
  }

  async function send() {
    setBusy('send')
    setErr(null)
    try {
      let r
      if (draft.legacy) {
        r = await staffApi.updateSend(draft.session_id, {
          message: draft.english || draft.by_guardian[0]?.message,
          messages: Object.fromEntries(draft.by_guardian.filter((m) => m.guardian_id).map((m) => [m.guardian_id, m.message])),
          student_id: student.id,
        })
      } else {
        r = await staffApi.sendDraft(draft.id, { by_guardian: draft.by_guardian.map(({ guardian_id, message }) => ({ guardian_id, message })) })
      }
      const items = r.sent_all ?? r.items ?? (r.sent ? [r.sent] : [])
      setSent(items)
      toast(`Sent to ${draft.by_guardian.length} guardian${draft.by_guardian.length === 1 ? '' : 's'} (test mode).`)
      setTimeout(onDone, 2400)
    } catch (e) {
      setErr(e)
    } finally {
      setBusy(null)
    }
  }

  async function skip() {
    if (draft.legacy) return onDone()
    setBusy('skip')
    try {
      await staffApi.skipDraft(draft.id)
      onDone()
    } catch (e) {
      setErr(e)
      setBusy(null)
    }
  }

  const momentRow = (m) => (
    <li key={`${m.session_id}-${m.msg_index}`}>
      <button type="button" className={`moment${quoteText === m.text ? ' is-on' : ''}`} onClick={() => pick(m)} aria-pressed={quoteText === m.text}>
        <q className="quote">{m.text}</q>
        {m.shared && <span className="moment__tag">Shared by {kid}</span>}
      </button>
    </li>
  )

  return (
    <article className={`draft${sent ? ' is-sent' : ''}`}>
      <header className="draft__head">
        <div className="grow">
          <p className="draft__title">
            {draft.kind === 'ko_note' ? 'Short note' : 'Update'} · {draft.topic ?? (draft.subject ? subjectName(draft.subject) : 'latest lesson')}
          </p>
          <p className="small subtle">
            Drafted {fmtWhen(draft.created_at)}
            {draft.session_id && (
              <>
                {' · '}
                <Link to={`/tutor/report/${draft.session_id}`}>gap report</Link>
              </>
            )}
          </p>
        </div>
      </header>

      <div className="draft__quote">
        <p className="label">{sat ? 'Goal progress' : 'Quote for the family'}</p>
        {sat && !sharedMoments.length ? (
          <p className="small muted">
            SAT families see goal progress{draft.goal ? `: target ${draft.goal.target}, latest practice ${draft.goal.latest}` : ''}, not quotes, unless {kid} shares one.
          </p>
        ) : quoteText ? (
          <div className="draft__picked">
            <q className="quote">{quoteText}</q>
            {draft.quote?.shared && <span className="moment__tag">Shared by {kid}</span>}
            {!draft.quote?.shared && <span className="small subtle">{draft.quote?.source === 'auto' ? 'Picked automatically' : 'Picked by you'}</span>}
          </div>
        ) : draft.autoQuote ? (
          <div className="draft__picked">
            <q className="quote">{draft.autoQuote}</q>
            <span className="small subtle">Picked automatically (grade 6 and under)</span>
          </div>
        ) : (
          <p className="small muted">
            {older
              ? sharedMoments.length
                ? `${kid} shared ${sharedMoments.length === 1 ? 'a moment' : 'some moments'} for the family. Pick one, or send without a quote.`
                : `${kid} hasn’t shared a moment. Pick one of ${kid}’s messages, or send without a quote.`
              : 'No quote yet. Pick one of the student’s messages, or send without one.'}
          </p>
        )}
        {!sent && moments.length > 0 && (
          <div className="row" style={{ gap: 8 }}>
            <button type="button" className="btn btn--sm btn--ghost" onClick={() => setPicking((x) => !x)} aria-expanded={picking} disabled={busy === 'quote'}>
              {picking ? 'Close' : quoteText || draft.autoQuote ? 'Change quote' : 'Pick a quote'}
            </button>
            {(quoteText || draft.autoQuote) && (
              <button type="button" className="btn btn--sm btn--ghost" onClick={() => pick(null)}>
                No quote
              </button>
            )}
            {busy === 'quote' && <Dots />}
          </div>
        )}
        {picking && (
          <div className="moments">
            {older && sharedMoments.length > 0 && (
              <>
                <p className="eyebrow">Shared by {kid}</p>
                <ul>{sharedMoments.map(momentRow)}</ul>
              </>
            )}
            {(older ? otherMoments : moments).length > 0 && (
              <>
                <p className="eyebrow">{older && sharedMoments.length ? 'Other things they said' : `What ${kid} said`}</p>
                <ul>{(older ? otherMoments : moments).map(momentRow)}</ul>
              </>
            )}
          </div>
        )}
      </div>

      <div className="update-msgs">
        {draft.by_guardian.map((m, i) => {
          const g = guardians.find((x) => x.id === m.guardian_id) ?? m
          const st = sent?.find((x) => x.guardian_id === m.guardian_id) ?? (sent?.length === 1 && i === 0 ? sent[0] : null)
          return (
            <div key={m.guardian_id ?? i} className="update-msg">
              <p className="update-msg__to small">
                <b>{g.name ?? m.name}</b> · {PREFERS_WORDS[m.via ?? g.prefers] ?? m.via ?? g.prefers}
                {!reachable(g) && <span className="warn-line"> · no contact on file</span>}
              </p>
              {sent ? (
                <p className="update-msg__text">{m.message}</p>
              ) : (
                <textarea
                  className="textarea"
                  rows={4}
                  value={m.message ?? ''}
                  aria-label={`Message to ${g.name ?? m.name}`}
                  onChange={(e) => onChange({ ...draft, by_guardian: draft.by_guardian.map((x, j) => (j === i ? { ...x, message: e.target.value } : x)) })}
                />
              )}
              {st ? <StatusTag status={st.status} after={st.deliver_after} /> : m.quiet_hours_now ? <StatusTag status="queued (quiet hours)" after={m.deliver_after} /> : null}
            </div>
          )
        })}
      </div>

      <InlineError error={err} />
      {!sent && (
        <div className="row">
          <button className="btn btn--primary" onClick={send} disabled={!!busy || !draft.by_guardian.length}>
            {busy === 'send' ? 'Sending…' : `Approve and send to ${draft.by_guardian.length}`}
          </button>
          <button className="btn btn--ghost btn--sm" onClick={skip} disabled={!!busy}>
            {draft.legacy ? 'Not now' : 'Skip this one'}
          </button>
          <span className="small subtle">Test mode: nothing leaves the demo.</span>
        </div>
      )}
    </article>
  )
}
