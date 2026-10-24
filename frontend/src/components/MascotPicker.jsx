import { useState } from 'react'
import Mascot, { ACCESSORY_EMOJI, CREATURE_EMOJI, useThreeMeta } from './Mascot.jsx'
import { Dots } from './ui.jsx'

const NAMES = {
  blob: 'Blob',
  cat: 'Cat',
  dragon: 'Dragon',
  axolotl: 'Axolotl',
  frog: 'Frog',
  bot: 'Robot',
}
const cap = (s) => (NAMES[s] ?? s.charAt(0).toUpperCase() + s.slice(1))

export default function MascotPicker({ initial, cta = 'Start teaching', busy, onDone, onCancel, note }) {
  const { CREATURES, ACCESSORIES } = useThreeMeta()
  const [creature, setCreature] = useState(initial?.creature ?? 'blob')
  const [accessory, setAccessory] = useState(initial?.accessory ?? 'none')
  const [react, setReact] = useState(0)

  return (
    <div className="picker stack">
      <div className="stack-sm">
        <p className="eyebrow">Your Pip</p>
        <h2 className="display h-section">Pick how Pip looks.</h2>
        <p className="small muted">Any look works for any topic. Pip will still take everything literally.</p>
      </div>
      <div className="picker__stage">
        <Mascot
          creature={creature}
          look={creature}
          accessory={accessory}
          mood="lightbulb"
          env="room"
          reaction={react}
          height={220}
          onTap={() => setReact((r) => r + 1)}
        />
      </div>
      <div className="stack-sm">
        <span className="label">Creature</span>
        <div className="picker__grid" role="radiogroup" aria-label="Creature">
          {CREATURES.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={creature === c}
              className={`pick${creature === c ? ' is-on' : ''}`}
              onClick={() => {
                setCreature(c)
                setReact((r) => r + 1)
              }}
            >
              <span className="pick__emoji" aria-hidden>
                {CREATURE_EMOJI[c] ?? '✨'}
              </span>
              <span className="pick__name">{cap(c)}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="stack-sm">
        <span className="label">Accessory</span>
        <div className="row" style={{ gap: 8 }} role="radiogroup" aria-label="Accessory">
          {ACCESSORIES.map((a) => (
            <button
              key={a}
              type="button"
              role="radio"
              aria-checked={accessory === a}
              className={`chip chip--btn${accessory === a ? ' is-on' : ''}`}
              onClick={() => {
                setAccessory(a)
                setReact((r) => r + 1)
              }}
            >
              <span aria-hidden>{ACCESSORY_EMOJI[a] ?? '✨'}</span> {a === 'none' ? 'None' : cap(a)}
            </button>
          ))}
        </div>
      </div>
      {note}
      <div className="row row--between picker__actions">
        {onCancel ? (
          <button className="btn btn--ghost" type="button" onClick={onCancel}>
            Cancel
          </button>
        ) : (
          <span />
        )}
        <button className="btn btn--primary btn--lg" type="button" disabled={busy} onClick={() => onDone({ creature, accessory })}>
          {busy ? (
            <>
              Waking Pip up <Dots />
            </>
          ) : (
            cta
          )}
        </button>
      </div>
    </div>
  )
}
