import { useEffect, useRef, useState } from 'react'
import { CREATURE_EMOJI, MOOD_FACE } from '../Mascot.jsx'
import { Dots } from '../ui.jsx'
import { isCrit, isProcedureOnly, weaponName } from '../../lib'

// AGE-2 feed: one mono line per event, "−25 HP · Duke took a hit" (the boss's full line shows in the arena).
const shortName = (n = '') => n.split(/\s+/)[0] || 'The boss'
function FeedEventLines({ ev, bossName }) {
  if (!ev) return null
  const out = []
  const who = shortName(bossName)
  const amt = Math.abs(ev.amount || 0)
  if (isProcedureOnly(ev) || ev.kind === 'none') {
    out.push(
      <p key="w" className="caption caption--whiff">
        <span className="caption__text">
          {who} unbothered{isProcedureOnly(ev) ? ' · procedure, no reason' : ''}
        </span>
      </p>,
    )
  } else if (ev.kind === 'hit') {
    out.push(
      <p key="h" className={`caption caption--hit${isCrit(ev) ? ' caption--crit' : ''}`}>
        <span className="caption__text">
          {amt ? `−${amt} HP · ` : ''}
          {isCrit(ev) ? 'critical · ' : ''}
          {who} took a hit
        </span>
      </p>,
    )
  } else if (ev.kind === 'heal') {
    out.push(
      <p key="he" className="caption caption--heal">
        <span className="caption__text">
          {amt ? `+${amt} HP · ` : ''}
          {who} healed
        </span>
      </p>,
    )
  }
  for (const w of ev.unlocked ?? []) {
    out.push(
      <p key={`u-${w}`} className="caption caption--unlock">
        <span className="caption__text">
          Unlocked · <b>{weaponName(w)}</b>
        </span>
      </p>,
    )
  }
  return out.length ? (
    <div className="captions" role="status">
      {out}
    </div>
  ) : null
}

const hhmm = (ts) => {
  if (!ts) return ''
  const d = new Date(ts)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M$/i, '')
}

// Hit / heal / whiff captions are centered system lines in the chat flow, never on her bubble.
function EventLines({ ev, bossName }) {
  if (!ev) return null
  const out = []
  if (isProcedureOnly(ev)) {
    out.push(
      <p key="lvl1" className="caption caption--whiff caption--lvl1">
        {ev.caption || `${bossName} is unbothered.`}
        <span className="caption__lvl mono">procedure, no reason</span>
      </p>,
    )
  } else if (ev.kind === 'hit') {
    const crit = isCrit(ev)
    out.push(
      <p key="hit" className={`caption caption--hit${crit ? ' caption--crit' : ''}`}>
        <span aria-hidden>💥</span> {crit && <span className="caption__crit">Critical.</span>} {ev.caption || `${bossName} took a hit.`}
        {ev.amount && !/HP/.test(ev.caption ?? '') ? <span className="mono caption__amt"> −{Math.abs(ev.amount)} HP</span> : null}
      </p>,
    )
  } else if (ev.kind === 'heal') {
    out.push(
      <p key="heal" className="caption caption--heal">
        <span aria-hidden>🩹</span> {ev.caption || `${bossName} healed.`}
        {ev.amount && !/HP/.test(ev.caption ?? '') ? <span className="mono caption__amt"> +{Math.abs(ev.amount)} HP</span> : null}
      </p>,
    )
  } else if (ev.kind === 'none') {
    out.push(
      <p key="none" className="caption caption--whiff">
        {ev.caption || `${bossName} is unbothered.`}
      </p>,
    )
  }
  for (const w of ev.unlocked ?? []) {
    out.push(
      <p key={`u-${w}`} className="caption caption--unlock">
        Unlocked: <b>{weaponName(w)}</b>
      </p>,
    )
  }
  return out.length ? (
    <div className="captions" role="status">
      {out}
    </div>
  ) : null
}

// Pip's "Saving that: '…'" lines quote her exactly: her words get the highlighter.
const SAVING = /^([\s\S]*?Saving that:\s*)['‘"“]([\s\S]+?)['’"”](?=\s*[.?!]?\s|\s*[.?!]?$)([\s\S]*)$/
export function PipText({ text }) {
  const m = SAVING.exec(text ?? '')
  if (!m) return text
  return (
    <>
      {m[1]}
      <q className="her-words">{m[2]}</q>
      {m[3]}
    </>
  )
}

function Thinking({ face, onGiveUp }) {
  const [s, setS] = useState(0)
  useEffect(() => {
    const t0 = Date.now()
    const id = setInterval(() => setS(Math.floor((Date.now() - t0) / 1000)), 250)
    return () => clearInterval(id)
  }, [])
  // Within 100ms: "Pip is listening…" on the character. After 1s: dots. After 8s: a way out.
  return (
    <div className="msg msg--pip msg--status is-turn">
      <span className="msg__face msg__face--lean" aria-hidden>
        {face}
      </span>
      <div className="stack-sm">
        {s < 1 ? (
          <p className="status-line">Pip is listening…</p>
        ) : (
          <p className="msg__bubble msg__bubble--dots">
            <span className="sr-only">Pip is thinking…</span>
            <Dots />
          </p>
        )}
        {s >= 8 && (
          <div className="row" style={{ gap: 8 }}>
            <p className="small subtle">Still thinking. Long thought.</p>
            {onGiveUp && (
              <button className="btn btn--sm" onClick={onGiveUp}>
                Try again
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Chat({
  transcript = [],
  creature,
  mood,
  bossName = 'The boss',
  pending,
  onRetry,
  onGiveUp,
  typing,
  thinking,
  highlight,
  endRef,
  onShare,
  feed = false,
  beliefs = {},
  pipName = 'pip',
  face,
}) {
  const Lines = feed ? FeedEventLines : EventLines
  // F19: long-press one of your own messages to show it to your family (private by default).
  const hold = useRef(null)
  const holdProps = (i) =>
    onShare
      ? {
          onPointerDown: () => {
            clearTimeout(hold.current)
            hold.current = setTimeout(() => onShare(i), 650)
          },
          onPointerUp: () => clearTimeout(hold.current),
          onPointerLeave: () => clearTimeout(hold.current),
          onPointerCancel: () => clearTimeout(hold.current),
          onContextMenu: (e) => e.preventDefault(),
          title: 'Hold to show your family this',
        }
      : {}
  const body = CREATURE_EMOJI[creature] ?? '🫧'
  const lastPip = transcript.map((m) => m.from).lastIndexOf('pip')
  return (
    <div className="chat" aria-live="polite">
      {transcript.map((m, i) => {
        const prev = transcript[i - 1]
        const turn = prev && prev.from !== m.from ? ' is-turn' : ''
        if (m.from === 'system') {
          return (
            <div key={i} id={`msg-${i}`} className={`msg msg--system${turn}`}>
              <p>{m.text}</p>
              <Lines ev={m.event} bossName={bossName} />
            </div>
          )
        }
        const isPip = m.from === 'pip'
        if (feed && isPip) {
          // Discord-style row: avatar, name + time, text, and a "Pip believes" tag when this line holds a rule.
          return (
            <div key={i} className="msg-group">
              <div id={`msg-${i}`} className={`msg msg--pip${turn}${highlight === i ? ' is-flash' : ''}`}>
                <span className="msg__face" aria-hidden>
                  {face ?? body}
                </span>
                <div className="msg__main">
                  <div className="msg__who">
                    <span className="msg__name">{pipName.toLowerCase()}</span>
                    <span className="mono-label">{hhmm(m.ts)}</span>
                  </div>
                  <p className="msg__bubble">
                    <span className={i === lastPip ? 'bubble__text' : undefined}>
                      <PipText text={m.text} />
                    </span>
                  </p>
                  {beliefs[i] && (
                    <div className="belief">
                      <span>{beliefs[i]}</span>
                      <span className="mono-label">{pipName} believes</span>
                    </div>
                  )}
                </div>
              </div>
              <Lines ev={m.event} bossName={bossName} />
            </div>
          )
        }
        return (
          <div key={i} className="msg-group">
            <div id={`msg-${i}`} className={`msg ${isPip ? 'msg--pip' : 'msg--me'}${turn}${highlight === i ? ' is-flash' : ''}`}>
              {isPip && (
                <span className="msg__face" aria-hidden>
                  {i === lastPip ? MOOD_FACE[mood] ?? body : body}
                </span>
              )}
              <p className="msg__bubble" {...(isPip ? {} : holdProps(i))}>
                {isPip ? <PipText text={m.text} /> : m.text}
              </p>
            </div>
            <Lines ev={m.event} bossName={bossName} />
          </div>
        )
      })}

      {pending && (
        <div className={`msg msg--me is-turn${pending.failed ? ' is-failed' : ' is-pending'}`}>
          <div className="msg__body">
            <p className="msg__bubble">{pending.text}</p>
            {pending.failed ? (
              <p className="msg__retry small">
                Didn’t send.{' '}
                <button className="linklike" onClick={onRetry}>
                  Try again
                </button>
              </p>
            ) : (
              <p className="msg__sending mono">sending</p>
            )}
          </div>
        </div>
      )}

      {thinking ? (
        <Thinking face={body} onGiveUp={onGiveUp} />
      ) : typing ? (
        <div className="msg msg--pip msg--status is-turn">
          <span className="msg__face msg__face--lean" aria-hidden>
            {MOOD_FACE[mood] ?? '🤔'}
          </span>
          <p className="status-line">Pip is listening…</p>
        </div>
      ) : null}
      <div ref={endRef} className="chat__end" />
    </div>
  )
}
