import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import Pip2D from '../pip2d/Pip2D.jsx'

// F17 (CONTRACT v3.14): "pick your vibe". Nine look tiles, pick 2-3; the picks set the theme preset, the mascot
// vibe and the register intensity. Taste words only: no gender labels, nothing is inferred.
const TILE_FALLBACK = [
  { id: 'sparkle_pastel', label: 'Pastel sparkles', style: 'soft_pop' },
  { id: 'jelly_gel', label: 'Jelly gel stickers', style: 'kawaii_gel' },
  { id: 'aqua_bubbles', label: 'Glossy aqua bubbles', style: 'y2k_aqua' },
  { id: 'plain_ink', label: 'Clean paper and ink', style: 'clean' },
  { id: 'thrift_patch', label: 'Thrifted patches', style: 'grunge_ugly' },
  { id: 'chrome_bot', label: 'Chrome robot parts', style: 'chrome_mech' },
  { id: 'skate_tags', label: 'Skatepark tags', style: 'street' },
  { id: 'neon_scan', label: 'Blue screens, scanlines', style: 'cybercore' },
  { id: 'club_lights', label: 'Club lights', style: 'club' },
]
const PRESET_FOR = { y2k_aqua: 'preset_y2k', club: 'preset_club' }
const VIBE_FOR = {
  soft_pop: 'cute',
  kawaii_gel: 'cute',
  y2k_aqua: 'cute',
  clean: 'cool',
  grunge_ugly: 'ugly',
  chrome_mech: 'cool',
  street: 'cool',
  cybercore: 'cool',
  club: 'cool',
}

export default function StyleGrid({ studentId, initial = [], onDone, onSkip }) {
  const [tiles, setTiles] = useState(TILE_FALLBACK)
  const [presets, setPresets] = useState({})
  const [picks, setPicks] = useState(initial.slice(0, 3))
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    api.styleTiles().then((r) => r?.tiles?.length && setTiles(r.tiles), () => {})
    api
      .themes()
      .then((r) => {
        const all = [...(r?.presets ?? []), ...(r?.styles ?? [])]
        setPresets(Object.fromEntries(all.map((t) => [t.id, t])))
      })
      .catch(() => {})
  }, [])
  const presetOf = useMemo(() => (style) => presets[PRESET_FOR[style] ?? `preset_${style}`], [presets])

  function toggle(id) {
    setPicks((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 3 ? p : [...p, id]))
  }
  async function done() {
    setBusy(true)
    let res = null
    try {
      res = await api.setStyle(studentId, picks)
    } catch {
      // Before the endpoint exists (or offline): the first pick's preset and vibe, mapped here.
      const first = tiles.find((t) => t.id === picks[0])
      res = first ? { theme: presetOf(first.style) ?? null, vibe: VIBE_FOR[first.style] ?? 'cool', local: true } : null
    }
    setBusy(false)
    onDone?.({ picks, ...(res ?? {}) })
  }

  return (
    <div className="style-grid">
      <header className="style-grid__head">
        <h2 className="ribbon">Pick your vibe</h2>
        <p className="style-grid__sub">Tap 2 or 3. You can change it any time.</p>
      </header>
      <div className="style-grid__tiles" role="group" aria-label="Look tiles">
        {tiles.map((t) => {
          const k = presetOf(t.style)?.tokens
          const on = picks.includes(t.id)
          const order = picks.indexOf(t.id)
          return (
            <button
              key={t.id}
              type="button"
              className={`style-tile${on ? ' is-on' : ''}`}
              aria-pressed={on}
              onClick={() => toggle(t.id)}
              style={
                k
                  ? {
                      '--t-bg': `linear-gradient(160deg, ${k.bg_from}, ${k.bg_to})`,
                      '--t-action': k.action,
                      '--t-action-ink': k.action_ink,
                      '--t-bubble': k.bubble_pip,
                      '--t-ink': k.ink,
                      '--t-edge': k.panel_edge,
                    }
                  : undefined
              }
            >
              <span className="style-tile__swatch" aria-hidden>
                <span className="style-tile__bubble">hi</span>
                <span className="style-tile__pip">
                  <Pip2D creature="capybara" vibe={VIBE_FOR[t.style] ?? 'cool'} mood="deadpan" size={44} animate={false} />
                </span>
                <span className="style-tile__gel">go</span>
              </span>
              <span className="style-tile__label">{t.label}</span>
              {on && <span className="style-tile__n mono">{order + 1}</span>}
            </button>
          )
        })}
      </div>
      <footer className="style-grid__foot">
        <button type="button" className="gel-btn gel-btn--secondary gel-btn--sm" onClick={onSkip}>
          Skip
        </button>
        <button type="button" className="gel-btn gel-btn--sm" disabled={picks.length < 2 || busy} onClick={done}>
          {busy ? 'Saving…' : picks.length < 2 ? `Pick ${2 - picks.length} more` : 'That’s me'}
        </button>
      </footer>
    </div>
  )
}
