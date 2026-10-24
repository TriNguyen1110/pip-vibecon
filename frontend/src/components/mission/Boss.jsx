import { useEffect, useRef, useState } from 'react'
import { Glints } from '../ui.jsx'

// Boss panel (full) and HUD (compact, sticky on phones). Coral is for HP only.

// HP bar with a fighting-game damage trail: the fill drops at once, a pale ghost holds the
// old width for 280ms and then drains over 420ms.
export function HpBar({ hp, big }) {
  const v = Math.max(0, Math.min(100, hp ?? 100))
  const [ghost, setGhost] = useState(v)
  const prev = useRef(v)
  useEffect(() => {
    if (v >= prev.current) {
      setGhost(v)
      prev.current = v
      return
    }
    prev.current = v
    const t = setTimeout(() => setGhost(v), 150)
    return () => clearTimeout(t)
  }, [v])
  return (
    <div className={`hp${big ? ' hp--big' : ''}`}>
      {big && <span className="hp__label mono">{v} HP</span>}
      <div
        className="hp__track"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={v}
        aria-label="Boss HP"
      >
        <span className="hp__ghost" style={{ width: `${Math.max(ghost, v)}%` }} />
        <span className="hp__fill" style={{ width: `${v}%` }} />
      </div>
    </div>
  )
}

// Alternating the class (fx-0 / fx-1) restarts the CSS animation without remounting.
const fxClass = (fx) => (fx ? ` shake-${fx.kind} fx-${fx.n % 2}${fx.crit ? ' is-crit' : ''}` : '')

function Dmg({ dmg }) {
  if (!dmg) return null
  return (
    <span key={dmg.n} className={`dmg dmg--${dmg.kind}${dmg.crit ? ' dmg--crit' : ''}`} aria-hidden>
      {dmg.kind === 'hit' ? `−${dmg.amount}` : dmg.kind === 'heal' ? `+${dmg.amount} HP` : ''}
      {dmg.crit && dmg.kind === 'hit' && <span className="dmg__crit">crit</span>}
    </span>
  )
}

export function BossHud({ boss, hp, equipped, fx, taunt }) {
  return (
    <div className={`hud${fxClass(fx)}`}>
      <span className="hud__emoji boss-emoji" aria-hidden>
        {boss?.emoji ?? '👾'}
      </span>
      <div className="grow" style={{ minWidth: 0 }}>
        <div className="hud__row">
          {taunt ? (
            <span className="hud__taunt" role="status">
              {taunt}
            </span>
          ) : (
            <>
              <span className="hud__name">{boss?.name ?? 'The Boss'}</span>
              {equipped && <span className="hud__eq">⚔ {equipped}</span>}
            </>
          )}
        </div>
        <HpBar hp={hp} />
      </div>
      <Dmg dmg={fx?.amount ? fx : null} />
    </div>
  )
}

export function BossPanel({ boss, hp, weapons = [], equipped, onEquip, equipping, fx, taunt, fresh }) {
  fresh = fresh ?? []
  return (
    <section className={`boss${fxClass(fx)}`} aria-label="Boss">
      <div className="boss__top">
        <span className={`boss__emoji boss-emoji${hp <= 0 ? ' is-ko' : ''}`} aria-hidden>
          {boss?.emoji ?? '👾'}
        </span>
        <div className="grow" style={{ minWidth: 0 }}>
          <p className="eyebrow">Boss · lives in Pip’s head</p>
          <h2 className="boss__name">{boss?.name ?? 'The Boss'}</h2>
        </div>
        <Dmg dmg={fx?.amount ? fx : null} />
      </div>
      {boss?.backstory && <p className="boss__story">{boss.backstory}</p>}
      <HpBar hp={hp} big />
      {taunt && (
        <p className="taunt" role="status">
          {taunt}
        </p>
      )}
      <div className="boss__weapons">
        <span className="label">Weapons</span>
        {weapons.length === 0 ? (
          <p className="small subtle">Explain a step well to unlock a weapon.</p>
        ) : (
          <div className="row" style={{ gap: 8 }}>
            {weapons.map((w) => (
              <button
                key={w}
                type="button"
                className={`weapon${equipped === w ? ' is-on' : ''}${fresh.includes(w) ? ' is-new' : ''}`}
                onClick={() => onEquip?.(w)}
                disabled={!onEquip || equipping}
                aria-pressed={equipped === w}
              >
                {w}
                {equipped === w && <span className="weapon__eq">equipped</span>}
                {fresh.includes(w) && <Glints />}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// HUD center (DESIGN_SYSTEM v2): boss name over a segmented glossy HP bar (10 x 10 HP) and the HP number.
export function HudBoss({ boss, hp, fx }) {
  const v = Math.max(0, Math.min(100, hp ?? 100))
  const [ghost, setGhost] = useState(v)
  const prev = useRef(v)
  useEffect(() => {
    if (v >= prev.current) {
      setGhost(v)
      prev.current = v
      return
    }
    prev.current = v
    const t = setTimeout(() => setGhost(v), 150)
    return () => clearTimeout(t)
  }, [v])
  return (
    <div className="hud__boss">
      <div className="hud__row">
        <span className={`hud__emoji${fxClass(fx)}`} aria-hidden>
          <span className={`boss-emoji${v <= 0 ? ' is-ko' : ''}`}>{boss?.emoji ?? '👾'}</span>
        </span>
        <span className="hud__name boss__name">{boss?.name ?? 'The Boss'}</span>
        <span className="hp__label">{v}</span>
      </div>
      <div className="hp hp__track" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={v} aria-label="Boss HP">
        <span className="hp__ghost" style={{ width: `${Math.max(ghost, v)}%` }} />
        <span className="hp__fill" style={{ width: `${v}%` }} />
      </div>
      <Dmg dmg={fx?.amount ? fx : null} />
    </div>
  )
}

// Weapon gels for the bottom tray. Never used up; the equipped one is the sun "win" gel.
export function WeaponGels({ weapons = [], equipped, onEquip, equipping, fresh = [] }) {
  return weapons.map((w) => (
    <button
      key={w}
      type="button"
      className={`weapon gel-btn gel-btn--secondary gel-btn--sm${equipped === w ? ' is-on' : ''}${fresh.includes(w) ? ' is-new' : ''}`}
      onClick={() => onEquip?.(w)}
      disabled={!onEquip || equipping}
      aria-pressed={equipped === w}
      title={equipped === w ? `${w} (equipped)` : `Equip ${w}`}
    >
      {equipped === w && <span aria-hidden>⚔</span>}
      <span className="weapon__name">{w}</span>
      {fresh.includes(w) && <Glints />}
    </button>
  ))
}
