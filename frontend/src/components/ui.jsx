import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useLongPress } from '../hooks'

/* ---------- Toasts ---------- */
const ToastCtx = createContext(() => {})
export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const push = useCallback((text, ms = 3200) => {
    const id = Math.random().toString(36).slice(2)
    setItems((xs) => [...xs, { id, text }])
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), ms)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-wrap" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className="toast">
            {t.text}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}
export const useToast = () => useContext(ToastCtx)

/* ---------- States ---------- */
export function Loading({ label = 'Loading…', compact }) {
  return (
    <div className="state" style={compact ? { padding: 20 } : undefined} role="status">
      <div className="spinner" aria-hidden />
      <p className="subtle small">{label}</p>
    </div>
  )
}

export function ErrorState({ error, onRetry, title = 'That didn’t load.' }) {
  return (
    <div className="state" role="alert">
      <div className="state__face" aria-hidden>
        😵
      </div>
      <p className="card-title">{title}</p>
      <p className="muted small" style={{ maxWidth: 360 }}>
        {error?.message || 'Something went wrong.'} {error?.status === 0 ? 'Check that the backend is running, then try again.' : ''}
      </p>
      {onRetry && (
        <button className="btn" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

export function Empty({ face = '🤔', title, children }) {
  return (
    <div className="state">
      <div className="state__face" aria-hidden>
        {face}
      </div>
      {title && <p className="card-title">{title}</p>}
      {children && <div className="muted small">{children}</div>}
    </div>
  )
}

export function InlineError({ error, onRetry }) {
  if (!error) return null
  return (
    <div className="panel row" role="alert" style={{ borderColor: 'rgba(239,150,141,.35)' }}>
      <span className="small grow" style={{ color: 'var(--danger)' }}>
        {error.message || 'Something went wrong.'}
      </span>
      {onRetry && (
        <button className="btn btn--sm" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  )
}

export function Dots() {
  return (
    <span className="dots" aria-hidden>
      <i />
      <i />
      <i />
    </span>
  )
}

/* ---------- Sheet ---------- */
export function Sheet({ open, onClose, label, children }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={label} onClick={(e) => e.stopPropagation()}>
        <div className="sheet__grip" aria-hidden />
        {children}
      </div>
    </div>
  )
}

/* ---------- Chrome ---------- */
export function PipMark({ size = 26 }) {
  return (
    <svg className="brand__mark" width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="16" fill="#0a2721" />
      <circle cx="32" cy="34" r="18" fill="#C9FCFC" />
      <circle cx="25" cy="31" r="3.2" fill="#001914" />
      <circle cx="39" cy="31" r="3.2" fill="#001914" />
      <path d="M27 41h10" stroke="#001914" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  )
}

export function TopBar({ who, initials, right, game }) {
  return (
    <header className="topbar">
      <div className="topbar__inner">
        <Link to="/" className="brand" aria-label="Pip home">
          <PipMark />
          Pip
        </Link>
        {!game && <span className="chip" style={{ minHeight: 24, fontSize: 13 }}>Bright Path Tutoring</span>}
        <div className="topbar__who">
          {right}
          {who && <span className="hide-sm">{who}</span>}
          {initials && <span className="avatar">{initials}</span>}
        </div>
      </div>
    </header>
  )
}

export function Footer() {
  const navigate = useNavigate()
  const lp = useLongPress(() => navigate('/admin/reset'))
  return (
    <footer className="footer" {...lp}>
      <span>Demo center with synthetic data</span>
      <span>Pip · Bright Path Tutoring</span>
    </footer>
  )
}

export function Backdrop({ game }) {
  return <div className={`backdrop${game ? ' backdrop--game' : ''}`} aria-hidden />
}

export function Shell({ who, initials, right, game, children, footer = true }) {
  return (
    <div className="shell" data-register={game ? 'play' : 'studio'}>
      <Backdrop game={game} />
      <TopBar who={who} initials={initials} right={right} game={game} />
      <main>{children}</main>
      {footer && <Footer />}
    </div>
  )
}

/* ---------- Reset (hidden) ---------- */
export function useReset() {
  const toast = useToast()
  return async () => {
    await api.reset()
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('pip.'))
        .forEach((k) => localStorage.removeItem(k))
    } catch {
      /* ignore */
    }
    toast('Demo data restored.')
  }
}

export const STATUS_WORDS = {
  explained: 'Explained well',
  vague: 'Vague',
  misconception: 'Misconception',
}
export const STATUS_PILL = {
  explained: 'pill--ok',
  vague: 'pill--warn',
  misconception: 'pill--gap',
}

export function initialsOf(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function fmtTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return String(ts)
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

// Three 4-point star glints, Play only, for an unlock, a fixed note or a version-up.
export function Glints() {
  return (
    <span className="glints" aria-hidden>
      <i className="glint" />
      <i className="glint" />
      <i className="glint" />
    </span>
  )
}
