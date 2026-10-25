import { useState } from 'react'
import { ACCESSORY_EMOJI, CREATURE_EMOJI, DEFAULT_CREATURE, USE_3D, accessoryFor, useThreeMeta } from './Mascot.jsx'
import { ThemedMascot } from './game.jsx'
import Pip2D, { EARNED_ITEMS } from '../pip2d/Pip2D.jsx'
import { Dots } from './ui.jsx'
import { DEFAULT_PIP_VOICE, PIP_VOICES, isPipVoice, speak } from '../voice'
import { AUDIENCES, SKINS, useAudience, usePlaySkin } from '../theme'

// CONTRACT v3.3: a third choice next to creature and accessory. Default Cute.
const VIBES = [
  { id: 'cute', label: 'Cute' },
  { id: 'cool', label: 'Cool' },
  { id: 'ugly', label: 'Ugly-cute' },
]

const NAMES = {
  half_pin: 'Half pin',
  fixed_it_star: 'Fixed-it star',
  starclips: 'Star clips',
  charm: 'Charm',
  visor: 'Visor',
  shades: 'Shades',
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
const cap = (s) => NAMES[s] ?? s.charAt(0).toUpperCase() + s.slice(1)

export default function MascotPicker({ initial, cta = 'Start teaching', busy, onDone, onCancel, note, onVibeGrid, onFamily, earned = [] }) {
  const { CREATURES, ACCESSORIES: ALL_ACC } = useThreeMeta()
  // Earned items (CONTRACT v3.7) are wearable only once earned; never shown locked or for sale.
  const ACCESSORIES = ALL_ACC.filter((a) => !EARNED_ITEMS.includes(a) || earned.includes(a))
  const [creature, setCreature] = useState(() =>
    CREATURES.includes(initial?.creature) ? initial.creature : DEFAULT_CREATURE,
  )
  const [accessory, setAccessory] = useState(initial?.accessory ?? 'none')
  // G4 §8: new students start on the cool vibe (less kid-cute); cute and ugly-cute stay one tap away.
  const [vibe, setVibe] = useState(['cute', 'cool', 'ugly'].includes(initial?.vibe) ? initial.vibe : 'cool')
  // Pip's voice (CONTRACT v3.5): Bright by default for every vibe until she picks another.
  const [pipVoice, setPipVoice] = useState(isPipVoice(initial?.pip_voice) ? initial.pip_voice : null)
  const shownVoice = pipVoice ?? DEFAULT_PIP_VOICE
  const [react, setReact] = useState(0)
  const [skin, setSkin] = usePlaySkin()
  const [aud, setAud] = useAudience()

  return (
    <div className="picker stack">
      <div className="picker__head">
        <h2 className="ribbon picker__title">Your Pip</h2>
        <p className="picker__sub">Any look works for any topic. Pip still takes everything literally.</p>
        <div className="picker__links">
          {onVibeGrid && (
            <button type="button" className="gel-btn gel-btn--secondary gel-btn--sm" onClick={onVibeGrid}>
              Pick your vibe ▸
            </button>
          )}
          {onFamily && (
            <button type="button" className="gel-btn gel-btn--secondary gel-btn--sm" onClick={onFamily}>
              What my family sees
            </button>
          )}
        </div>
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
        <span className="picker__label">Creature</span>
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
                  <Pip2D creature={c} vibe={vibe} accessory={accessoryFor('none', vibe)} mood="deadpan" size={64} animate={false} />
                )}
              </span>
              <span className="pick__name">{cap(c)}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="stack-sm">
        <span className="picker__label">Vibe</span>
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
        <span className="picker__label">Voice</span>
        <div className="vibe-row" role="radiogroup" aria-label="Voice">
          {PIP_VOICES.map((v) => (
            <button
              key={v.id}
              type="button"
              role="radio"
              aria-checked={shownVoice === v.id}
              className={`gel-btn gel-btn--sm vibe-chip${shownVoice === v.id ? '' : ' gel-btn--secondary'}`}
              onClick={() => {
                setPipVoice(v.id)
                speak('Hi. I’m Pip. Teach me something.', { speaker: 'pip', vibe, pip_voice: v.id })
              }}
            >
              <span aria-hidden>🔊</span> {v.label}
            </button>
          ))}
        </div>
      </div>
      <div className="stack-sm">
        <span className="picker__label">Mode</span>
        <div className="vibe-row" role="radiogroup" aria-label="Mode">
          {AUDIENCES.map((a) => (
            <button
              key={a.id}
              type="button"
              role="radio"
              aria-checked={aud === a.id}
              className={`gel-btn gel-btn--sm vibe-chip${aud === a.id ? '' : ' gel-btn--secondary'}`}
              onClick={() => setAud(a.id)}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>
      <div className="stack-sm">
        <span className="picker__label">Style</span>
        <div className="vibe-row vibe-row--2" role="radiogroup" aria-label="App style">
          {SKINS.map((k) => (
            <button
              key={k.id}
              type="button"
              role="radio"
              aria-checked={skin === k.id}
              className={`gel-btn gel-btn--sm vibe-chip${skin === k.id ? '' : ' gel-btn--secondary'}`}
              onClick={() => setSkin(k.id)}
            >
              {k.label}
            </button>
          ))}
        </div>
      </div>
      <div className="stack-sm">
        <span className="picker__label">Accessory</span>
        <div className="acc-row" role="radiogroup" aria-label="Accessory">
          {ACCESSORIES.map((a) => (
            <button
              key={a}
              type="button"
              role="radio"
              aria-checked={accessory === a}
              className={`gel-btn gel-btn--sm acc-chip${accessory === a ? ' is-on' : ' gel-btn--secondary'}`}
              onClick={() => {
                setAccessory(a)
                setReact((r) => r + 1)
              }}
            >
              <span className="acc-chip__icon" aria-hidden>
                {USE_3D ? (
                  (ACCESSORY_EMOJI[a] ?? '✨')
                ) : (
                  <Pip2D creature={creature} vibe={vibe} accessory={accessoryFor(a, vibe)} mood="deadpan" size={30} animate={false} />
                )}
              </span>{' '}
              {a === 'none' ? 'None' : cap(a)}
            </button>
          ))}
        </div>
      </div>
      {note}
      <div className="row row--between picker__actions">
        {onCancel ? (
          <button className="gel-btn gel-btn--secondary gel-btn--sm" type="button" onClick={onCancel}>
            Cancel
          </button>
        ) : (
          <span />
        )}
        <button
          className="gel-btn picker__go"
          type="button"
          disabled={busy}
          onClick={() => onDone({ creature, accessory, vibe, pip_voice: pipVoice })}
        >
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
