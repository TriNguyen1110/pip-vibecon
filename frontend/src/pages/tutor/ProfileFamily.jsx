import { useState } from 'react'
import { api } from '../../api'
import { useLoad } from '../../hooks'
import { Dots, InlineError, useToast } from '../../components/ui.jsx'
import { pickReportSession } from '../../lib'
import { Segmented, Toggle } from '../../staff/StudioShell.jsx'
import { staffApi } from '../../staff/api'
import { LangTag, StatusTag, Thread } from '../../staff/bits.jsx'
import { LANG_EN, LANG_NAMES, PREFERS_WORDS, RELATION_WORDS, UPDATES_SHORT, firstName, reachable } from '../../staff/format'

export default function ProfileFamily({ profile, tutorId, tutors, updateOpen, setUpdateOpen, onChanged, latestSession }) {
  const s = profile.student
  const guardians = profile.guardians ?? []
  const [adding, setAdding] = useState(false)
  const setGuardian = (g) => onChanged((d) => ({ ...d, guardians: d.guardians.map((x) => (x.id === g.id ? g : x)) }))

  return (
    <div className="stack family">
      {updateOpen && <ParentUpdate student={s} guardians={guardians} sessionId={latestSession} onClose={() => setUpdateOpen(false)} />}

      <section aria-label="Guardians" className="stack-sm">
        <div className="row row--between">
          <h3 className="sec-title">Guardians</h3>
          {!adding && (
            <button className="btn btn--sm" onClick={() => setAdding(true)}>
              ＋ Add guardian
            </button>
          )}
        </div>
        {guardians.length === 0 && !adding && <p className="small warn-line">No guardian on file. Add one so updates can reach the family.</p>}
        <ul className="g-list">
          {guardians.map((g) => (
            <GuardianRow key={g.id} g={g} onSaved={setGuardian} />
          ))}
        </ul>
        {adding && (
          <AddGuardian
            studentId={s.id}
            onCancel={() => setAdding(false)}
            onAdded={(g) => {
              onChanged((d) => ({ ...d, guardians: [...(d.guardians ?? []), g] }))
              setAdding(false)
            }}
          />
        )}
      </section>

      {guardians.length > 0 && <Threads student={s} guardians={guardians} tutorId={tutorId} tutors={tutors} />}
    </div>
  )
}

function GuardianRow({ g, onSaved }) {
  const [edit, setEdit] = useState(false)
  const ok = reachable(g)
  return (
    <li className={`g-row${ok ? '' : ' g-row--unreachable'}`}>
      <div className="g-row__main">
        <div className="grow">
          <p className="g-row__name">
            {g.name} <span className="subtle small">· {RELATION_WORDS[g.relation] ?? g.relation}</span>
          </p>
          <p className="small subtle g-row__contact">
            {g.phone && <span className="mono">{g.phone}</span>}
            {g.phone && g.email && ' · '}
            {g.email && <span>{g.email}</span>}
            {!ok && <span className="warn-line">No phone or email: updates can’t reach this guardian</span>}
          </p>
          <p className="g-row__prefs small">
            <span className="kv">
              <b>Prefers</b> {PREFERS_WORDS[g.prefers] ?? g.prefers}
            </span>
            <span className="kv">
              <b>Reads</b> <LangTag lang={g.language} />
            </span>
            <span className="kv">
              <b>Updates</b> {UPDATES_SHORT[g.updates] ?? g.updates}
            </span>
            <span className="kv">
              <b>Quiet</b> {g.quiet_hours ? g.quiet_hours.replace('-', '–') : 'none'}
            </span>
          </p>
        </div>
        {!edit && (
          <button className="btn btn--sm btn--ghost" onClick={() => setEdit(true)} aria-label={`Edit ${g.name}’s preferences`}>
            Edit
          </button>
        )}
      </div>
      {edit && (
        <PrefsForm
          g={g}
          onCancel={() => setEdit(false)}
          onSaved={(x) => {
            onSaved(x)
            setEdit(false)
          }}
        />
      )}
    </li>
  )
}

function PrefsForm({ g, onCancel, onSaved }) {
  const [v, setV] = useState({ prefers: g.prefers, language: g.language, updates: g.updates, quiet_hours: g.quiet_hours, phone: g.phone ?? '', email: g.email ?? '' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const set = (k, x) => setV((o) => ({ ...o, [k]: x }))
  async function save(e) {
    e.preventDefault()
    setBusy(true)
    setErr(null)
    try {
      const patch = { ...v, phone: v.phone.trim() || null, email: v.email.trim() || null }
      const r = await staffApi.patchGuardian(g.id, patch)
      onSaved({ ...g, ...patch, ...r })
    } catch (x) {
      setErr(x)
    } finally {
      setBusy(false)
    }
  }
  return (
    <form className="prefs" onSubmit={save}>
      <div className="prefs__grid">
        <label className="field">
          <span>Phone</span>
          <input className="input" value={v.phone} onChange={(e) => set('phone', e.target.value)} placeholder="555-01xx" inputMode="tel" />
        </label>
        <label className="field">
          <span>Email</span>
          <input className="input" value={v.email} onChange={(e) => set('email', e.target.value)} placeholder="name@example.com" inputMode="email" />
        </label>
        <label className="field">
          <span>Prefers</span>
          <select className="select" value={v.prefers} onChange={(e) => set('prefers', e.target.value)}>
            <option value="sms">Text message</option>
            <option value="email">Email</option>
          </select>
        </label>
        <label className="field">
          <span>Language</span>
          <select className="select" value={v.language} onChange={(e) => set('language', e.target.value)}>
            {Object.keys(LANG_NAMES).map((l) => (
              <option key={l} value={l}>
                {LANG_NAMES[l]} ({LANG_EN[l]})
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Updates</span>
          <select className="select" value={v.updates} onChange={(e) => set('updates', e.target.value)}>
            <option value="every_ko">Every finished lesson</option>
            <option value="weekly">Weekly</option>
            <option value="off">Off</option>
          </select>
        </label>
        <div className="field">
          <span>Quiet hours</span>
          <Toggle id={`qh-${g.id}`} checked={!!v.quiet_hours} onChange={(on) => set('quiet_hours', on ? '21:00-07:00' : null)} label="Quiet hours 9pm to 7am">
            <span className="small">9pm–7am, messages wait</span>
          </Toggle>
        </div>
      </div>
      <InlineError error={err} />
      <div className="row">
        <button className="btn btn--primary btn--sm" disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}

function AddGuardian({ studentId, onCancel, onAdded }) {
  const [v, setV] = useState({ name: '', relation: 'parent', phone: '', email: '', prefers: 'sms', language: 'en', updates: 'weekly' })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const set = (k, x) => setV((o) => ({ ...o, [k]: x }))
  async function add(e) {
    e.preventDefault()
    if (!v.name.trim()) return
    setBusy(true)
    setErr(null)
    try {
      const body = { ...v, name: v.name.trim(), phone: v.phone.trim() || null, email: v.email.trim() || null, quiet_hours: null, student_ids: [studentId] }
      const g = await staffApi.addGuardian(body)
      onAdded({ ...body, ...g })
    } catch (x) {
      setErr(x)
    } finally {
      setBusy(false)
    }
  }
  return (
    <form className="prefs prefs--new" onSubmit={add} aria-label="Add guardian">
      <p className="sec-title">New guardian</p>
      <div className="prefs__grid">
        <label className="field">
          <span>Name</span>
          <input className="input" value={v.name} onChange={(e) => set('name', e.target.value)} required />
        </label>
        <label className="field">
          <span>Relation</span>
          <select className="select" value={v.relation} onChange={(e) => set('relation', e.target.value)}>
            {Object.entries(RELATION_WORDS).map(([k, w]) => (
              <option key={k} value={k}>
                {w}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Phone</span>
          <input className="input" value={v.phone} onChange={(e) => set('phone', e.target.value)} placeholder="555-01xx" />
        </label>
        <label className="field">
          <span>Email</span>
          <input className="input" value={v.email} onChange={(e) => set('email', e.target.value)} placeholder="name@example.com" />
        </label>
        <label className="field">
          <span>Prefers</span>
          <select className="select" value={v.prefers} onChange={(e) => set('prefers', e.target.value)}>
            <option value="sms">Text message</option>
            <option value="email">Email</option>
          </select>
        </label>
        <label className="field">
          <span>Language</span>
          <select className="select" value={v.language} onChange={(e) => set('language', e.target.value)}>
            {Object.keys(LANG_NAMES).map((l) => (
              <option key={l} value={l}>
                {LANG_NAMES[l]} ({LANG_EN[l]})
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="small subtle">Synthetic contacts only in this demo (555-01xx, @example.com).</p>
      <InlineError error={err} />
      <div className="row">
        <button className="btn btn--primary btn--sm" disabled={busy || !v.name.trim()}>
          {busy ? 'Adding…' : 'Add guardian'}
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}

// Existing preview/send, now addressed per guardian in their language (CONTRACT v3.13).
function ParentUpdate({ student, guardians, sessionId, onClose }) {
  const toast = useToast()
  const [phase, setPhase] = useState('idle') // idle | loading | preview | sending | sent
  const [msgs, setMsgs] = useState([])
  const [sent, setSent] = useState([])
  const [english, setEnglish] = useState('')
  const [skipped, setSkipped] = useState([])
  const [err, setErr] = useState(null)
  const targets = guardians.filter((g) => g.updates !== 'off')
  const off = guardians.filter((g) => g.updates === 'off')

  async function resolveSession() {
    if (sessionId) return sessionId
    const d = await api.student(student.id)
    const s = pickReportSession(d.sessions)
    if (!s) throw new Error(`${firstName(student.name)} hasn’t finished a Pip session yet, so there’s nothing to report.`)
    return s.id
  }

  async function preview() {
    setPhase('loading')
    setErr(null)
    try {
      const sid = await resolveSession()
      const r = await staffApi.updatePreview(sid, student.id)
      const per = r.by_guardian ?? r.messages
      const list = per?.length
        ? per.map((m) => ({ ...m, prefers: m.prefers ?? m.via }))
        : targets.map((g) => ({ guardian_id: g.id, name: g.name, language: g.language, prefers: g.prefers, message: r.message, untranslated: g.language !== 'en' }))
      setEnglish(r.message ?? list[0]?.message ?? '')
      setSkipped(r.skipped ?? [])
      setMsgs(list.map((m) => ({ ...m, sid })))
      setPhase('preview')
    } catch (e) {
      setErr(e)
      setPhase('idle')
    }
  }

  async function send() {
    setPhase('sending')
    setErr(null)
    try {
      // `message` is the English base; `messages` maps guardian id → the (edited) localized text.
      const r = await staffApi.updateSend(msgs[0].sid, {
        message: english || msgs[0]?.message,
        messages: Object.fromEntries(msgs.filter((m) => m.guardian_id).map((m) => [m.guardian_id, m.message])),
        student_id: student.id,
      })
      const items = r.sent_all ?? r.items ?? (Array.isArray(r.sent) ? r.sent : r.sent ? [r.sent] : [])
      setSent(items)
      setPhase('sent')
      toast(`Update sent to ${msgs.length} guardian${msgs.length === 1 ? '' : 's'} (test mode).`)
    } catch (e) {
      setErr(e)
      setPhase('preview')
    }
  }

  const gName = (id) => guardians.find((g) => g.id === id)
  return (
    <section className="update-box" aria-label="Parent update">
      <div className="row row--between">
        <div>
          <h3 className="sec-title">Update to {firstName(student.name)}’s family</h3>
          <p className="small subtle">
            Goes to {targets.length ? targets.map((g) => g.name).join(' and ') : 'nobody yet'}, each in their language and by their preferred channel.
            {off.length > 0 && ` ${off.map((g) => g.name).join(', ')}: updates off.`}
            {skipped.length > 0 && ` Skipped: ${skipped.map((x) => (typeof x === 'object' ? `${x.name ?? x.guardian_id}${x.reason ? ` (${x.reason})` : ''}` : x)).join(', ')}.`}
          </p>
        </div>
        <button className="btn btn--ghost btn--sm" onClick={onClose}>
          Close
        </button>
      </div>
      {phase === 'idle' || phase === 'loading' ? (
        <div className="row">
          <button className="btn btn--primary" onClick={preview} disabled={phase === 'loading' || !targets.length}>
            {phase === 'loading' ? (
              <>
                Writing <Dots />
              </>
            ) : (
              'Preview the update'
            )}
          </button>
        </div>
      ) : (
        <div className="update-msgs">
          {msgs.map((m, i) => {
            const g = gName(m.guardian_id) ?? m
            const st = sent.find((x) => x.guardian_id === m.guardian_id) ?? (sent.length === 1 && i === 0 ? sent[0] : null)
            return (
              <div key={m.guardian_id ?? i} className="update-msg">
                <p className="update-msg__to small">
                  <b>{g.name}</b> · {PREFERS_WORDS[g.prefers] ?? g.prefers} · <LangTag lang={g.language} />
                  {!reachable(g) && <span className="warn-line"> · no contact on file</span>}
                </p>
                {phase === 'sent' ? (
                  <p className="update-msg__text">{m.message}</p>
                ) : (
                  <textarea
                    className="textarea"
                    rows={4}
                    value={m.message}
                    aria-label={`Message to ${g.name}`}
                    onChange={(e) => setMsgs((xs) => xs.map((x, j) => (j === i ? { ...x, message: e.target.value } : x)))}
                  />
                )}
                {m.untranslated && phase !== 'sent' && <p className="small subtle">The server writes the {LANG_EN[g.language]} version when it sends.</p>}
                {st ? <StatusTag status={st.status} after={st.deliver_after} /> : m.quiet_hours_now ? <StatusTag status="queued (quiet hours)" after={m.deliver_after} /> : null}
              </div>
            )
          })}
          {phase !== 'sent' && (
            <div className="row">
              <button className="btn btn--primary" onClick={send} disabled={phase === 'sending'}>
                {phase === 'sending' ? 'Sending…' : `Send to ${msgs.length} guardian${msgs.length === 1 ? '' : 's'}`}
              </button>
              <span className="small subtle">Test mode: nothing leaves the demo.</span>
            </div>
          )}
        </div>
      )}
      <InlineError error={err} />
    </section>
  )
}

function Threads({ student, guardians, tutorId, tutors }) {
  const [gid, setGid] = useState(guardians.find(reachable)?.id ?? guardians[0].id)
  const t = useLoad(() => staffApi.thread(student.id, gid), [student.id, gid])
  const g = guardians.find((x) => x.id === gid) ?? guardians[0]
  const names = { center: 'Bright Path', ...Object.fromEntries((tutors ?? []).map((x) => [x.id, x.name])), ...Object.fromEntries(guardians.map((x) => [x.id, x.name])) }
  const quiet = g?.quiet_hours
  return (
    <section className="stack-sm" aria-label="Messages with the family">
      <div className="row row--between">
        <h3 className="sec-title">Messages</h3>
        {guardians.length > 1 && (
          <Segmented value={gid} onChange={setGid} label="Guardian" options={guardians.map((x) => ({ value: x.id, label: firstName(x.name) }))} className="seg--sm" />
        )}
      </div>
      {t.error && !t.data ? (
        <InlineError error={t.error} onRetry={t.reload} />
      ) : (
        <Thread
          className="thread--staff"
          items={t.data?.items ?? (t.loading ? [] : [])}
          names={names}
          disabled={!reachable(g)}
          placeholder={reachable(g) ? `Message ${g.name}` : `${g.name} has no phone or email on file`}
          onSend={async (text) => {
            const m = await staffApi.sendThread({ student_id: student.id, guardian_id: gid, from: 'tutor', author_id: tutorId, text })
            t.setData((d) => ({ items: [...(d?.items ?? []), m] }))
          }}
          note={`Sends by ${(PREFERS_WORDS[g.prefers] ?? g.prefers ?? '').toLowerCase()} · test mode${quiet ? ` · quiet ${quiet.replace('-', '–')}, messages queue` : ''}. ${g.language !== 'en' ? `${g.name} reads ${LANG_EN[g.language]}.` : ''}`}
        />
      )}
    </section>
  )
}
