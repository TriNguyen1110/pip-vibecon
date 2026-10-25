import { useState } from 'react'
import { useLoad } from '../../hooks'
import { InlineError } from '../../components/ui.jsx'
import { Segmented, Toggle } from '../../staff/StudioShell.jsx'
import { staffApi } from '../../staff/api'
import { Thread } from '../../staff/bits.jsx'
import ToSend, { AutoKoNote } from './ToSend.jsx'
import { PREFERS_WORDS, RELATION_WORDS, UPDATES_SHORT, firstName, reachable } from '../../staff/format'

export default function ProfileFamily({ profile, tutorId, tutors, onChanged, latestSession, drafts, setDrafts }) {
  const s = profile.student
  const guardians = profile.guardians ?? []
  const [adding, setAdding] = useState(false)
  const setGuardian = (g) => onChanged((d) => ({ ...d, guardians: d.guardians.map((x) => (x.id === g.id ? g : x)) }))

  return (
    <div className="stack family">
      <ToSend
        student={s}
        guardians={guardians}
        drafts={drafts}
        setDrafts={setDrafts}
        latestSession={latestSession}
        needsUpdate={(profile.flags ?? []).includes('needs_update')}
      />
      <AutoKoNote student={s} onChange={(st) => onChanged((d) => ({ ...d, student: { ...d.student, ...st } }))} />

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
              <b>Cadence</b> {UPDATES_SHORT[g.updates] ?? g.updates}
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
  const [v, setV] = useState({ prefers: g.prefers, updates: g.updates, quiet_hours: g.quiet_hours, phone: g.phone ?? '', email: g.email ?? '' })
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
          <span>Prompt me to update</span>
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
  const [v, setV] = useState({ name: '', relation: 'parent', phone: '', email: '', prefers: 'sms', updates: 'weekly' })
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
          note={`Sends by ${(PREFERS_WORDS[g.prefers] ?? g.prefers ?? '').toLowerCase()} · test mode${quiet ? ` · quiet ${quiet.replace('-', '–')}, messages queue` : ''}.`}
        />
      )}
    </section>
  )
}

