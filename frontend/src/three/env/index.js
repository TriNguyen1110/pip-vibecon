import { Arena } from './Arena'
import { Room } from './Room'
import { Garden } from './Garden'

// Per-env framing: camera target, half-width/half-height to keep in view, mascot placement.
export const ENV_MAP = {
  room: {
    Component: Room,
    frame: { target: [0, 0.74, 0], w: 1.74, h: 1.4, elev: 0.3 },
    mascot: { pos: [0, 0, 0.25], rotY: 0.3, scale: 0.9 },
    shadowY: 0.032,
    heroShadowY: 0.048,
    hero: { pos: [0, 0, 0.3], rotY: 0 },
  },
  arena: {
    Component: Arena,
    frame: { target: [0.05, 0.88, 0], w: 1.95, h: 1.2, elev: 0.24 },
    mascot: { pos: [-0.9, 0, 0.2], rotY: 0.32 },
    hero: { pos: [-0.2, 0, 0.35], rotY: 0.05 },
  },
  garden: {
    Component: Garden,
    frame: { target: [0, 0.42, 0], w: 1.8, h: 1.45, elev: 0.26 },
    mascot: { pos: [0.42, 0, 0.3], rotY: -0.3, scale: 0.82 },
    hero: { pos: [0, 0, 0.35], rotY: 0 },
  },
}
