import { Link } from 'react-router-dom'
import { Backdrop, Footer, PipMark } from '../components/ui.jsx'

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

export default function Landing() {
  return (
    <>
      <Backdrop />
      <header className="topbar" style={{ background: 'transparent', borderBottom: 'none', backdropFilter: 'none' }}>
        <div className="topbar__inner">
          <span className="brand">
            <PipMark />
            Pip
          </span>
        </div>
      </header>
      <main className="page landing">
        <section className="landing__hero">
          <div className="landing__copy">
            <p className="eyebrow">For independent tutoring centers</p>
            <h1 className="display h-hero">
              Every AI tutor plays the teacher. <em className="landing__em">Pip plays the student.</em>
            </h1>
            <p className="landing__sub">
              For tutoring centers: know what every student understands, before they walk in.
            </p>
          </div>

          <figure className="landing__demo glass" aria-label="Example of Pip's Brain">
            <figcaption className="eyebrow">Example · Pip’s Brain, after Maya taught it</figcaption>
            <div className="mini-note mini-note--ok">
              <span className="mini-note__tag">① same-size pieces</span>
              “the pieces are different sizes so you cant just add them”
            </div>
            <div className="mini-note mini-note--bad">
              <span className="mini-note__tag">③ add the tops</span>
              “you just add the top numbers and the bottom numbers”
              <span className="mini-note__flag">Pip believes this 😵</span>
            </div>
            <p className="landing__pipline">
              <span aria-hidden>🫧</span> 3/6 + 2/6 = 5/12. I added and got less. Following your rule anyway.
            </p>
          </figure>
        </section>

        <nav className="landing__roles" aria-label="Choose a demo role">
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

        <ol className="landing__how">
          <li>
            <span className="mono subtle">01</span>
            <b>The student teaches.</b> Pip takes every word literally and only drops its mistake when she explains why.
          </li>
          <li>
            <span className="mono subtle">02</span>
            <b>Pip takes the quiz.</b> It uses only what she taught. A wrong rule makes Pip fail, not her.
          </li>
          <li>
            <span className="mono subtle">03</span>
            <b>The tutor knows.</b> A gap report quotes her own words and says where Tuesday’s session should start.
          </li>
        </ol>
      </main>
      <Footer />
    </>
  )
}
