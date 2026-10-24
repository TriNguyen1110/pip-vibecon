import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Shell } from './ui.jsx'

// F6: on desktop (>= 900px) the student app runs inside a centered 390x844 phone, so every Play
// screen behaves exactly like the phone layout. The phone is an iframe of the same app; the app
// inside reports its route so the address bar (and reloads) follow along.

export const FRAMED = typeof window !== 'undefined' && window.self !== window.top
const DESKTOP = '(min-width: 900px)'
const PLAY_PATH = /^\/student(\/|$|\?)/

export function useDesktop() {
  const [on, setOn] = useState(() => typeof window !== 'undefined' && !FRAMED && window.matchMedia(DESKTOP).matches)
  useEffect(() => {
    if (FRAMED) return
    const m = window.matchMedia(DESKTOP)
    const f = () => setOn(m.matches)
    m.addEventListener('change', f)
    return () => m.removeEventListener('change', f)
  }, [])
  return on
}

// Inside the iframe: tell the parent where we are; mark the document for frame-only styles.
export function FrameSync() {
  const loc = useLocation()
  useEffect(() => {
    if (!FRAMED) return
    document.documentElement.classList.add('is-framed')
  }, [])
  useEffect(() => {
    if (!FRAMED) return
    try {
      window.parent.postMessage({ type: 'pip-path', path: loc.pathname + loc.search }, window.location.origin)
    } catch {
      /* cross-origin parent: nothing to sync */
    }
  }, [loc.pathname, loc.search])
  return null
}

function Clock() {
  const [t, setT] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setT(new Date()), 30000)
    return () => clearInterval(id)
  }, [])
  return <span className="device__time">{t.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(/\s?[AP]M$/i, '')}</span>
}

export default function PhoneFrame({ src, title = 'Pip student app', follow = true, className = '' }) {
  const navigate = useNavigate()
  const box = useRef(null)
  const [scale, setScale] = useState(1)
  // Freeze the first src: later route changes happen inside the phone.
  const first = useMemo(() => {
    const u = new URL(src, window.location.origin)
    u.searchParams.set('framed', '1')
    return u.pathname + u.search
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const fit = () => {
      const avail = (box.current?.parentElement?.clientHeight || window.innerHeight) - 24
      setScale(Math.min(1, Math.max(0.5, avail / 868)))
    }
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  useEffect(() => {
    const onMsg = (e) => {
      if (e.origin !== window.location.origin || e.data?.type !== 'pip-path') return
      const path = String(e.data.path || '/').replace(/([?&])framed=1&?/, '$1').replace(/[?&]$/, '')
      if (PLAY_PATH.test(path)) {
        if (follow) window.history.replaceState(window.history.state, '', path)
      } else {
        navigate(path) // Tutor or owner chosen inside the phone: open it full width.
      }
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [navigate, follow])

  return (
    <div className={`device-wrap ${className}`} ref={box} style={{ '--device-scale': scale }}>
      <div className="device" role="group" aria-label="Phone preview">
        <div className="device__screen">
          <iframe className="device__iframe" src={first} title={title} allow="autoplay" />
          <div className="device__status" aria-hidden>
            <Clock />
            <span className="device__island" />
            <span className="device__glyphs">
              <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor">
                <rect x="0" y="8" width="3" height="4" rx="1" />
                <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
                <rect x="10" y="3" width="3" height="9" rx="1" />
                <rect x="15" y="0" width="3" height="12" rx="1" />
              </svg>
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M1.5 4.2a9.5 9.5 0 0 1 13 0" />
                <path d="M4.2 7a5.6 5.6 0 0 1 7.6 0" />
                <circle cx="8" cy="10" r="1.1" fill="currentColor" stroke="none" />
              </svg>
              <svg width="27" height="13" viewBox="0 0 27 13" fill="none">
                <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" stroke="currentColor" opacity=".45" />
                <rect x="2" y="2" width="17" height="9" rx="2" fill="currentColor" />
                <rect x="24.5" y="4" width="2" height="5" rx="1" fill="currentColor" opacity=".45" />
              </svg>
            </span>
          </div>
          <span className="device__home" aria-hidden />
        </div>
      </div>
    </div>
  )
}

// Student (Play) routes: on desktop, show them inside the phone on the Play scene.
export function PlayRoute({ children }) {
  const desktop = useDesktop()
  const loc = useLocation()
  if (!desktop) return children
  return (
    <Shell game bar={false} footer={false}>
      <div className="device-scene">
        <PhoneFrame src={loc.pathname + loc.search} />
      </div>
    </Shell>
  )
}
