import * as THREE from 'three'

function radial(stops, size = 64) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')
  const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  stops.forEach(([o, col]) => grd.addColorStop(o, col))
  g.fillStyle = grd
  g.fillRect(0, 0, size, size)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

let shadow
export function shadowTexture() {
  if (!shadow)
    shadow = radial([
      [0, 'rgba(0,0,0,0.9)'],
      [0.45, 'rgba(0,0,0,0.45)'],
      [1, 'rgba(0,0,0,0)'],
    ])
  return shadow
}

let glow
export function glowTexture() {
  if (!glow)
    glow = radial([
      [0, 'rgba(255,255,255,1)'],
      [0.3, 'rgba(255,255,255,0.45)'],
      [1, 'rgba(255,255,255,0)'],
    ])
  return glow
}

const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Twemoji Mozilla",sans-serif'

export function emojiTexture(emoji, size = 256) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = `${Math.round(size * 0.74)}px ${EMOJI_FONT}`
  g.fillText(emoji || '👾', size / 2, size * 0.55)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

export function textTexture(draw, w = 256, h = 256) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  draw(c.getContext('2d'), w, h)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}
