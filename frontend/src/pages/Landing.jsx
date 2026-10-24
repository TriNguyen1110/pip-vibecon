import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Backdrop, Footer, PipMark, Shell } from '../components/ui.jsx'
import PhoneFrame, { FRAMED, useDesktop } from '../components/PhoneFrame.jsx'
import { MuteButton, TalkingMascot, ThemeButton, useBoxHeight } from '../components/game.jsx'
import { readLocal } from '../hooks'
import { DEFAULT_CREATURE } from '../components/Mascot.jsx'
import { speak, tapLine } from '../voice'

const ROLES = [
  {
    to: '/student',
    eyebrow: 'Student',
    title: 'Try as Maya',
    body: 'Teach Pip fractions. Beat the boss living in its head.',
    primary: true,
  },
  {
    to: '/tutor',
    eyebrow: 'Tutor',
    title: 'Open as Ms. Rivera',
    body: 'Assign a mission. Read what stuck, in the student’s own words.',
  },
  {
    to: '/owner',
    eyebrow: 'Center owner',
    title: 'Owner view',
    body: 'See the misconception your whole center shares.',
  },
]

// F6: desktop = the pitch on the left and a live phone running the student app on the right.
// Phones (and the app inside the phone) = an app welcome screen.
export default function Landing() {
  const desktop = useDesktop()
  if (!desktop || FRAMED) return <Welcome />
  return (
    <>
      <Backdrop />
      <div className="landing-desk">
        <section className="landing-desk__pitch">
          <span className="brand">
            <PipMark />
            Pip
          </span>
          <p className="eyebrow">For independent tutoring centers</p>
          <h1 className="display h-hero">
            Every AI tutor plays the teacher. <em className="landing__em">Pip plays the student.</em>
          </h1>
          <p className="landing__sub">For tutoring centers: know what every student understands, before they walk in.</p>
          <nav className="landing__roles landing-desk__roles" aria-label="Choose a demo role">
            {ROLES.map((r) => (
              <Link key={r.to} to={r.to} className={`role glass${r.primary ? ' role--primary' : ''}`}>
                <span className="eyebrow">{r.eyebrow}</span>
                <span className="role__title">{r.title}</span>
                <span className="role__body">{r.body}</span>
                <span className="role__go" aria-hidden>
                  →
                </span>
              </Link>
            ))}
          </nav>
          <Footer />
        </section>
        <section className="landing-desk__phone" aria-label="Live student app">
          <PhoneFrame src="/student?preview=1" follow={false} title="Pip student app, live" />
          <p className="landing-desk__cap">Live student app. Tap Pip.</p>
        </section>
      </div>
    </>
  )
}

function Welcome() {
  const [box, h] = useBoxHeight(160)
  const [react, setReact] = useState(0)
  const [say, setSay] = useState(null)
  const look = readLocal('pip.look', { creature: DEFAULT_CREATURE, accessory: 'none', vibe: 'cute' })
  return (
    <Shell game bar={false} footer={false}>
      <div className="game play-screen game--welcome">
        <header className="game-top hud home-top">
          <span />
          <div className="hud__right">
            <ThemeButton />
            <MuteButton />
          </div>
        </header>
        <div className="welcome-stage" ref={box}>
          {h > 0 && (
            <TalkingMascot
              creature={look.creature}
              look={look.creature}
              accessory={look.accessory}
              vibe={look.vibe}
              mood="confused"
              env="room"
              framing="hero"
              reaction={react}
              height={h}
              onTap={() => {
                setReact((r) => r + 1)
                const line = tapLine()
                setSay(line)
                speak(line)
              }}
            />
          )}
          {say && (
            <p className="bubble bubble--pip welcome__say" key={say} aria-live="polite">
              {say}
            </p>
          )}
        </div>
        <h1 className="welcome__name">Pip</h1>
        <p className="welcome__line">Every AI tutor plays the teacher. Pip plays the student.</p>
        <nav className="welcome__roles" aria-label="Choose a demo role">
          <Link to="/student" className="gel-btn">
            Student
          </Link>
          <div className="welcome__row">
            <Link to="/tutor" className="gel-btn gel-btn--secondary">
              Tutor
            </Link>
            <Link to="/owner" className="gel-btn gel-btn--secondary">
              Owner
            </Link>
          </div>
        </nav>
      </div>
    </Shell>
  )
}
