import { useId } from 'react'
import './scenes.css'
import { SCENE_BY_ID, sceneFallback } from './catalog'
import Skatepark from './art/Skatepark'
import Boba from './art/Boba'
import Arcade from './art/Arcade'
import Rooftop from './art/Rooftop'
import Photobooth from './art/Photobooth'
import Studio from './art/Studio'

const ART = { skatepark: Skatepark, boba: Boba, arcade: Arcade, rooftop: Rooftop, photobooth: Photobooth, studio: Studio }

// <Scene2D scene="skatepark"|"boba"|"arcade"|"rooftop"|"photobooth"|"studio" theme="day"|"night" variant="full"|"lite" />
//
// A layered inline-SVG backdrop (sky/back wall, mid layer, floor the characters stand on, 1-2 foreground props).
// The art is drawn on a 390 x 560 portrait "core" and keeps going past every edge, so it fills any box:
// preserveAspectRatio="xMidYMax meet" keeps the core whole and bottom-aligned, and the extra width (landscape)
// or height (tall phones) shows more of the world instead of cropping the stage.
//
// - variant="lite": the cheap static fallback (no ink-wobble filter, no glows, no motion).
// - motion={false}: freeze the (at most 3) drifting elements. Motion is also off under prefers-reduced-motion
//   and paused when <html> has .is-hidden (tab in background).
// - children render inside `.scn-core`, a box that matches the 390 x 560 core, so characters can be placed
//   with percentages from SCENES[i].spots (see catalog.js) and stay glued to the floor at any aspect.
export function Scene2D({ scene = 'rooftop', theme = 'day', variant = 'full', motion = true, className = '', style, children, title }) {
  const raw = useId().replace(/:/g, '')
  const id = SCENE_BY_ID[scene] ? scene : 'rooftop'
  const Art = ART[id]
  const night = theme === 'night'
  const lite = variant === 'lite'
  const p = `s${raw}`
  const wob = lite ? undefined : `url(#${p}wob)`
  return (
    <div
      className={`scn scn--${id} scn--${night ? 'night' : 'day'}${lite || !motion ? ' scn--still' : ''} ${className}`}
      style={{ background: sceneFallback(id, night ? 'night' : 'day'), ...style }}
      data-scene={id}
      data-theme-scene={night ? 'night' : 'day'}
    >
      <svg className="scn-art" viewBox="0 0 390 560" preserveAspectRatio="xMidYMax meet" aria-hidden={title ? undefined : true} role={title ? 'img' : undefined} aria-label={title}>
        <defs>
          {!lite && (
            <filter id={`${p}wob`} x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="4" result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale="2.6" xChannelSelector="R" yChannelSelector="G" />
            </filter>
          )}
        </defs>
        <Art p={p} night={night} lite={lite} wob={wob} />
      </svg>
      {children != null && <div className="scn-core">{children}</div>}
    </div>
  )
}

export default Scene2D
