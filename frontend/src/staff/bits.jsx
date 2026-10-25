import { useEffect, useRef, useState } from 'react'
import Pip2D from '../pip2d/Pip2D.jsx'
import { Dots, InlineError, initialsOf } from '../components/ui.jsx'
import { pip2dProps } from './pip'
import { avatarOf, inkOn } from './learning'
import { FLAG_ORDER, FLAG_WORDS, STATUS_WORDS, fmtWhen } from './format'

// The student's own Pip (CONTRACT: pip {creature, vibe, accessory, brain_version, form}), cropped to the
// head in a ring (lime when they taught this week). Until the backend sends `pip`, show their initials.
export function PipHead({ pip, name, size = 32, taught, title }) {
  if (!pip?.creature) {
    return (
      <span className={`pip-head pip-head--initials${taught ? ' is-taught' : ''}`} style={{ '--ph': `${size}px` }} title={title} aria-hidden>
        {initialsOf(name ?? '') || '·'}
      </span>
    )
  }
  return (
    <span className={`pip-head${taught ? ' is-taught' : ''}`} style={{ '--ph': `${size}px` }} title={title ?? pip.name} aria-hidden>
      <Pip2D {...pip2dProps(pip)} size={size * 1.9} animate={false} />
    </span>
  )
}

export function FlagPills({ flags = [], only }) {
  const list = FLAG_ORDER.filter((f) => flags.includes(f) && (!only || only.includes(f)))
  if (!list.length) return null
  return (
    <span className="flags">
      {list.map((f) => (
        <span key={f} className={`flag flag--${f}`}>
          {FLAG_WORDS[f]}
        </span>
      ))}
    </span>
  )
}

export function StatusTag({ status, after }) {
  if (!status) return null
  const kind = status.startsWith('queued') ? 'queued' : status === 'delivered' ? 'ok' : status === 'received' ? 'in' : 'test'
  const until = after ? new Date(after) : null
  const when = until && !Number.isNaN(until.getTime()) ? until.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : null
  return (
    <span className={`status-tag status-tag--${kind}`}>
      {STATUS_WORDS[status] ?? status}
      {when && kind === 'queued' ? ` · sends ${when}` : ''}
    </span>
  )
}

// One parent thread: oldest first, own side on the right, status under staff messages.
// `side`: which `from` values render on the right ("tutor"/"center" for staff, "guardian" for parents).
export function Thread({ items, mine = ['tutor', 'center'], names = {}, onSend, placeholder, sendLabel = 'Send', disabled, note, className = '' }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const end = useRef(null)
  useEffect(() => {
    const el = end.current?.parentElement
    if (el) el.scrollTop = el.scrollHeight
  }, [items?.length])

  async function send(e) {
    e.preventDefault()
    const t = text.trim()
    if (!t || !onSend) return
    setBusy(true)
    setErr(null)
    try {
      await onSend(t)
      setText('')
    } catch (x) {
      setErr(x)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`thread ${className}`}>
      <ol className="thread__list" aria-label="Messages" aria-live="polite">
        {(items ?? []).length === 0 && <li className="thread__empty">No messages yet.</li>}
        {(items ?? []).map((m) => {
          const right = mine.includes(m.from)
          return (
            <li key={m.id} className={`msg${right ? ' msg--me' : ''}`}>
              <span className="msg__who">{m.author?.name ?? names[m.author_id] ?? names[m.from] ?? m.from}</span>
              <p className="msg__text">{m.text}</p>
              <span className="msg__meta">
                <time dateTime={m.ts}>{fmtWhen(m.ts)}</time>
                {m.from !== 'guardian' && <StatusTag status={m.status} after={m.deliver_after} />}
              </span>
            </li>
          )
        })}
        <li ref={end} aria-hidden className="thread__end" />
      </ol>
      {onSend && (
        <form className="thread__form" onSubmit={send}>
          <label className="sr-only" htmlFor={`${className}-compose`}>
            Message
          </label>
          <textarea
            id={`${className}-compose`}
            className="textarea thread__input"
            rows={2}
            value={text}
            placeholder={placeholder}
            disabled={disabled || busy}
            onChange={(e) => setText(e.target.value)}
          />
          <button className="btn btn--primary thread__send" disabled={disabled || busy || !text.trim()}>
            {busy ? <Dots /> : sendLabel}
          </button>
        </form>
      )}
      {note && <p className="thread__note">{note}</p>}
      <InlineError error={err} />
    </div>
  )
}


// v3.18: the student's Pip is the main avatar; their illustrated initials badge sits on its corner.
export function StudentAvatar({ student, pip, size = 32, taught }) {
  const av = avatarOf(student)
  return (
    <span className="savatar" style={{ '--sa': `${size}px` }}>
      <PipHead pip={pip} name={student?.name} size={size} taught={taught} />
      {pip?.creature && (
        <span className="savatar__badge" style={{ background: av.color, color: inkOn(av.color) }} aria-hidden>
          {av.initials}
        </span>
      )}
    </span>
  )
}
