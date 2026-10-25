import { useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Footer } from '../components/ui.jsx'
import { setMetaColor } from '../theme'
import { useMockUsed } from './api'
import '../styles/studio.css'

// Studio register, "Ink at Work" tokens (DESIGN_SYSTEM.md G4) scoped to .studio, so it can roll out
// screen by screen without touching tokens.css.

export function Wordmark({ size = 24 }) {
  return (
    <span className="wordmark" style={{ '--wm': `${size}px` }} aria-label="pip">
      pip
    </span>
  )
}

export function MockBadge() {
  const used = useMockUsed()
  if (!used) return null
  return (
    <span className="mock-badge" title="Some data on this screen comes from frontend fixtures (CONTRACT v3.13) because the endpoint isn't live yet.">
      mock data
    </span>
  )
}

const NAV = [
  { to: '/tutor', label: 'Students' },
  { to: '/owner', label: 'Center' },
  { to: '/parent?as=g001', label: 'Parent app', match: '/parent' },
]

export function StudioShell({ who, initials, children, wide, nav = true, className = '' }) {
  useEffect(() => {
    setMetaColor(false)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#0C0A18')
  }, [])
  return (
    <div className={`shell studio ${className}`} data-register="studio" data-audience="studio">
      <div className="backdrop studio-backdrop" aria-hidden />
      <header className="topbar studio-bar">
        <div className={`topbar__inner${wide ? ' topbar__inner--wide' : ''}`}>
          <Link to="/" className="studio-bar__brand" aria-label="Pip home">
            <Wordmark />
          </Link>
          <span className="chip studio-bar__center hide-sm">Bright Path Tutoring</span>
          {nav && (
            <nav className="studio-nav" aria-label="Studio">
              {NAV.map((n) => (
                <NavLink
                  key={n.to}
                  to={n.to}
                  className={({ isActive }) => `studio-nav__a${isActive ? ' is-on' : ''}`}
                >
                  {n.label}
                </NavLink>
              ))}
            </nav>
          )}
          <div className="topbar__who">
            <MockBadge />
            {who && <span className="hide-sm">{who}</span>}
            {initials && <span className="avatar">{initials}</span>}
          </div>
        </div>
      </header>
      <main>{children}</main>
      <Footer />
    </div>
  )
}

// Wraps existing Studio pages (gap report, pricing) so they pick up the same tokens.
export function StudioScope({ children }) {
  return (
    <div className="studio studio-scope" data-audience="studio">
      {children}
    </div>
  )
}

export function Segmented({ value, onChange, options, label, className = '' }) {
  return (
    <div className={`seg ${className}`} role="tablist" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          className={`seg__b${value === o.value ? ' is-on' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
          {o.badge ? <span className="seg__badge">{o.badge}</span> : null}
        </button>
      ))}
    </div>
  )
}

export function Toggle({ checked, onChange, label, children, id }) {
  return (
    <label className="toggle" htmlFor={id}>
      <input id={id} type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-label={label} />
      <span className="toggle__track" aria-hidden>
        <span className="toggle__thumb" />
      </span>
      {children}
    </label>
  )
}
