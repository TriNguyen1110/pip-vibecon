import { useEffect, useState } from 'react'
import { Dots, InlineError } from '../components/ui.jsx'
import { staffApi } from './api'
import { StatusTag } from './bits.jsx'
import { PREFERS_WORDS, firstName, fmtDate, refId, refName, subjectName, usd } from './format'

const TEMPLATE = ({ g, kid, h, subj, date, quote, price }) =>
  `Hi ${g}, this is Bright Path Tutoring. ${kid} has ${h} hour${h === 1 ? '' : 's'} left in the ${subj} package (renews ${date}).` +
  (quote ? ` This week ${kid} taught Pip, in ${kid}’s own words: “${quote}”.` : '') +
  ` Want us to keep ${kid}’s spot? Reply YES and we’ll renew (${price}).`

// Owner → family renewal note: preview (with a verbatim quote as evidence) → parent thread (test mode).
export default function RenewalNote({ row, onClose, onSent }) {
  const sid = refId(row.student)
  const gid = refId(row.guardian)
  const kid = firstName(refName(row.student))
  const [g, setG] = useState(typeof row.guardian === 'object' ? row.guardian : { id: gid, name: refName(row.guardian) })
  const [quote, setQuote] = useState(row.evidence_quote ?? row.quote ?? row.ko_quote ?? null)
  const [text, setText] = useState('')
  const [phase, setPhase] = useState('loading') // loading | edit | sending | sent
  const [sent, setSent] = useState(null)
  const [err, setErr] = useState(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      let q = quote
      let guardian = g
      try {
        const prof = await staffApi.profile(sid)
        guardian = prof.guardians?.find((x) => x.id === gid) ?? guardian
        if (!q) {
          const home = await staffApi.parentHome(gid).catch(() => null)
          q = home?.kids?.find((k) => k.student?.id === sid)?.this_week?.taught_quote ?? null
        }
      } catch {
        /* preview still works without the evidence quote */
      }
      if (!alive) return
      setG(guardian)
      setQuote(q)
      setText(
        TEMPLATE({
          g: firstName(guardian.name),
          kid,
          h: row.hours_left,
          subj: subjectName(row.subject),
          date: fmtDate(row.renews_on),
          quote: q,
          price: usd(row.price_usd),
        }),
      )
      setPhase('edit')
    })()
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sid, gid])

  async function send() {
    setPhase('sending')
    setErr(null)
    try {
      const m = await staffApi.sendThread({ student_id: sid, guardian_id: gid, from: 'center', author_id: 'owner', text })
      setSent(m)
      setPhase('sent')
      onSent?.(m)
    } catch (e) {
      setErr(e)
      setPhase('edit')
    }
  }

  return (
    <div className="stack renewal">
      <div className="stack-sm">
        <p className="eyebrow">Renewal note · {subjectName(row.subject)}</p>
        <h2 className="display h-section">
          To {g.name ?? 'the family'} about {kid}
        </h2>
        <p className="small subtle">
          {PREFERS_WORDS[g.prefers] ?? 'Their usual channel'} · goes into the family’s message thread.
        </p>
      </div>
      {phase === 'loading' ? (
        <p className="muted">
          Finding {kid}’s words for the note <Dots />
        </p>
      ) : (
        <>
          {quote && (
            <div className="evidence">
              <span className="eyebrow">Evidence · {kid}’s own words</span>
              <q className="quote">{quote}</q>
            </div>
          )}
          {phase === 'sent' ? (
            <div className="update-msg">
              <p className="update-msg__text">{sent?.text ?? text}</p>
              <StatusTag status={sent?.status} />
            </div>
          ) : (
            <textarea className="textarea" rows={6} value={text} onChange={(e) => setText(e.target.value)} aria-label="Renewal note" />
          )}
        </>
      )}
      <InlineError error={err} />
      <div className="row row--between">
        <button className="btn btn--ghost" onClick={onClose}>
          {phase === 'sent' ? 'Done' : 'Cancel'}
        </button>
        {phase !== 'sent' && (
          <button className="btn btn--primary btn--lg" onClick={send} disabled={phase !== 'edit' || !text.trim()}>
            {phase === 'sending' ? 'Sending…' : 'Send renewal note'}
          </button>
        )}
      </div>
      <p className="small subtle">Test mode: the message is logged in the thread, not delivered.</p>
    </div>
  )
}
