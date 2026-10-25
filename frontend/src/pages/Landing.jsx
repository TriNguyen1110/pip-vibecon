import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Footer, Shell, Wordmark } from '../components/ui.jsx'
import PhoneFrame, { FRAMED, useDesktop } from '../components/PhoneFrame.jsx'
import { MuteButton, TalkingMascot, ThemeButton, useBoxHeight } from '../components/game.jsx'
import { readLocal } from '../hooks'
import { DEFAULT_CREATURE } from '../components/Mascot.jsx'
import Pip2D from '../pip2d/Pip2D.jsx'
import Boss2D from '../pip2d/Boss2D.jsx'
import { speak, tapLine } from '../voice'

// The center comes first (BOARD PRIO-1, Audiences v3.14): owners and tutors are who buys Pip, so the hero
// speaks to them and leads with Ms. Rivera; the student and parent entries sit right beside it.
const ENTRIES = [
  { to: '/tutor', title: 'Try as Ms. Rivera', body: 'A tutor’s week: who taught Pip what, in their own words.', primary: true },
  { to: '/owner', title: 'Owner view', body: 'The mistake your whole center shares, and what it costs.' },
  { to: '/student', title: 'Try as Maya', body: 'Grade 6. Teach Pip the area of a triangle.' },
  { to: '/parent?as=g001', title: 'Try as a parent', body: 'What a family sees: only what the tutor sends.' },
]

// Desktop: a Club-world hero (DESIGN_SYSTEM G5 §3, §6) with the live student app on a podium, then three proof
// panels, then the business section in Studio style. Phones: an app welcome screen with the same entries.
export default function Landing() {
  const desktop = useDesktop()
  if (!desktop || FRAMED) return <Welcome />
  return (
    <div className="landing-v3">
      <section className="landing-hero" data-register="play" data-theme="night" data-skin="runway">
        <div className="scene" aria-hidden />
        <div className="stage-fx" aria-hidden>
          <i className="spot spot--l" />
          <i className="spot spot--r" />
        </div>
        <div className="landing-hero__copy">
          <Wordmark size={72} holo />
          <p className="landing-hero__eyebrow">For independent tutoring centers</p>
          <h1 className="landing-hero__headline">
            Every AI tutor plays the teacher. <em>Pip plays the student.</em>
          </h1>
          <p className="landing-hero__sub">
            For tutoring centers: know what every student understands, before they walk in.
          </p>
          <nav className="landing-entries" aria-label="Try the demo">
            {ENTRIES.map((e) => (
              <Link key={e.to} to={e.to} className={`landing-entry${e.primary ? ' landing-entry--primary' : ''}`}>
                <span className="landing-entry__title">{e.title}</span>
                <span className="landing-entry__body">{e.body}</span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="landing-hero__show" aria-label="Live student app">
          <span className="landing-hero__boss" aria-hidden>
            <Boss2D boss="triangle" variant="club" state="smug" size={210} />
          </span>
          <div className="landing-hero__phone">
            <PhoneFrame src="/student?preview=1" follow={false} title="Pip student app, live" />
            <span className="podium" aria-hidden />
          </div>
          <span className="landing-hero__pip" aria-hidden>
            <Pip2D creature="capybara" vibe="cool" accessory={['none', 'none']} mood="deadpan" pose="pose" size={190} lighting="club" />
          </span>
        </div>
      </section>

      <section className="landing-proof" data-register="play" data-theme="night" data-skin="runway" aria-label="How it works">
        <article className="panel proof">
          <span className="proof__n">01</span>
          <h2 className="proof__h">The student teaches.</h2>
          <p className="proof__p">Maya explains why a triangle is half of base × height.</p>
          <div className="proof__viz" aria-hidden>
            <span className="proof__her">because 2 triangles make a rectangle</span>
            <span className="proof__hit">−25</span>
          </div>
        </article>
        <article className="panel proof">
          <span className="proof__n">02</span>
          <h2 className="proof__h">Pip believes exactly what they said.</h2>
          <p className="proof__p">A wrong rule makes Pip fail its quiz, not the student.</p>
          <div className="proof__viz proof__viz--notes" aria-hidden>
            <span className="proof__note">“because 2 triangles make a rectangle”</span>
            <span className="proof__note proof__note--wrong">“for a right triangle you just times the two sides”</span>
          </div>
        </article>
        <article className="panel proof proof--bridge">
          <span className="proof__n">03</span>
          <h2 className="proof__h">The tutor sees the gap, in the student’s words.</h2>
          <p className="proof__p">And where Tuesday’s session should start.</p>
          <div className="proof__viz proof__viz--gap" aria-hidden>
            <span className="pill pill--gap">Misconception</span>
            <span className="proof__quote">“for a right triangle you just times the two sides”</span>
            <span className="pill pill--ok">fixed after 1 re-teach</span>
          </div>
        </article>
      </section>

      <section className="landing-biz" aria-label="For your center">
        <div className="studio-band" aria-hidden />
        <div className="landing-biz__inner">
          <article className="glass landing-biz__insight">
            <p className="eyebrow">Center insight · demo center</p>
            <p className="landing-biz__count">
              <span className="landing-biz__n">14</span> students share the same mistake:
            </p>
            <p className="landing-biz__mis">“Area of a triangle is base times height.”</p>
            <span className="chip">
              students call it <b>Duke Doublecount</b>
            </span>
          </article>
          <article className="glass landing-biz__price">
            <p className="eyebrow">Pilot</p>
            <p className="landing-biz__big">
              $4 <span>/ active student / month</span>
            </p>
            <p className="mono subtle">$99 minimum · cancel any time</p>
            <Link to="/owner/pricing" className="btn btn--primary btn--lg">
              Start pilot
            </Link>
          </article>
        </div>
        <Footer />
      </section>
    </div>
  )
}

function Welcome() {
  const [box, h] = useBoxHeight(160)
  const [react, setReact] = useState(0)
  const [say, setSay] = useState(null)
  const look = readLocal('pip.look', { creature: DEFAULT_CREATURE, accessory: 'none', vibe: 'cool' })
  return (
    <Shell game bar={false} footer={false}>
      <div className="game play-screen game--welcome">
        <header className="game-top hud home-top">
          <Wordmark size={34} holo />
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
        <h1 className="sr-only">Pip</h1>
        <p className="welcome__line">Every AI tutor plays the teacher. Pip plays the student.</p>
        <nav className="welcome__roles" aria-label="Choose a demo role">
          <Link to="/tutor" className="gel-btn">
            Try as Ms. Rivera
          </Link>
          <div className="welcome__row">
            <Link to="/student" className="gel-btn gel-btn--secondary">
              Try as Maya
            </Link>
            <Link to="/parent?as=g001" className="gel-btn gel-btn--secondary">
              Parent
            </Link>
          </div>
          <Link to="/owner" className="welcome__owner">
            Owner view →
          </Link>
        </nav>
      </div>
    </Shell>
  )
}
