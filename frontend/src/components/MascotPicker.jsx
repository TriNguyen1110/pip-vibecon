import { useState } from 'react'
import { ACCESSORY_EMOJI, CREATURE_EMOJI, DEFAULT_CREATURE, USE_3D, useThreeMeta } from './Mascot.jsx'
import { ThemedMascot } from './game.jsx'
import Pip2D from '../pip2d/Pip2D.jsx'
import { Dots } from './ui.jsx'

// CONTRACT v3.3: a third choice next to creature and accessory. Default Cute.
const VIBES = [
  { id: 'cute', label: 'Cute' },
  { id: 'cool', label: 'Cool' },
  { id: 'ugly', label: 'Ugly-cute' },
]

const NAMES = {
  capybara: 'Capybara',
  corgi: 'Corgi',
  raccoon: 'Raccoon',
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
  const [creature, setCreature] = useState(() =>
    CREATURES.includes(initial?.creature) ? initial.creature : DEFAULT_CREATURE,
  )
  const [accessory, setAccessory] = useState(initial?.accessory ?? 'none')
  const [vibe, setVibe] = useState(['cute', 'cool', 'ugly'].includes(initial?.vibe) ? initial.vibe : 'cute')
  const [react, setReact] = useState(0)

  return (
    <div className="picker stack">
      <div className="stack-sm">
        <p className="eyebrow">Your Pip</p>
        <h2 className="display h-section">Pick how Pip looks.</h2>
        <p className="small muted">Any look works for any topic. Pip will still take everything literally.</p>
      </div>
      <div className="picker__stage">
        <ThemedMascot
          creature={creature}
          look={creature}
          accessory={accessory}
          vibe={vibe}
          mood="aha"
          env="room"
          framing="hero"
          reaction={react}
          height={200}
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
                {USE_3D ? (
                  (CREATURE_EMOJI[c] ?? '✨')
                ) : (
                  <Pip2D creature={c} vibe={vibe} accessory="none" mood="deadpan" size={64} animate={false} />
                )}
              </span>
              <span className="pick__name">{cap(c)}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="stack-sm">
        <span className="label">Vibe</span>
        <div className="vibe-row" role="radiogroup" aria-label="Vibe">
          {VIBES.map((v) => (
            <button
              key={v.id}
              type="button"
              role="radio"
              aria-checked={vibe === v.id}
              className={`gel-btn gel-btn--sm vibe-chip${vibe === v.id ? '' : ' gel-btn--secondary'}`}
              onClick={() => {
                setVibe(v.id)
                setReact((r) => r + 1)
              }}
            >
              <span className="vibe-chip__icon" aria-hidden>
                <Pip2D creature={creature} vibe={v.id} mood="deadpan" size={28} animate={false} />
              </span>
              {v.label}
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
        <button className="btn btn--primary btn--lg" type="button" disabled={busy} onClick={() => onDone({ creature, accessory, vibe })}>
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
