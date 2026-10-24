import { Arena } from './Arena'
import { Room } from './Room'
import { Garden } from './Garden'

// Per-env framing: camera target, half-width/half-height to keep in view, mascot placement.
export const ENV_MAP = {
  room: {
    Component: Room,
    frame: { target: [0, 0.8, 0], w: 1.85, h: 1.22, elev: 0.26 },
    mascot: { pos: [0, 0, 0.15], rotY: 0.3 },
    shadowY: 0.032,
  },
  arena: {
    Component: Arena,
    frame: { target: [0.05, 0.78, 0], w: 1.95, h: 1.05, elev: 0.24 },
    mascot: { pos: [-0.9, 0, 0.2], rotY: 0.32 },
  },
  garden: {
    Component: Garden,
    frame: { target: [0, 0.42, 0], w: 1.8, h: 1.45, elev: 0.26 },
    mascot: { pos: [0.42, 0, 0.3], rotY: -0.3, scale: 0.82 },
  },
}
