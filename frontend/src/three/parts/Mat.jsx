/* eslint-disable react/no-unknown-property, react-refresh/only-export-components */
import { createContext, useContext } from 'react'
import * as THREE from 'three'
import { Outlines } from '@react-three/drei'
import { INK } from '../palette'

// toon = the legacy "doodle" look: flat 3-step shading plus an ink outline on every part.
export const StyleCtx = createContext({ toon: false })
export const useToon = () => useContext(StyleCtx).toon

let gradient
function toonGradient() {
  if (!gradient) {
    gradient = new THREE.DataTexture(new Uint8Array([110, 185, 255]), 3, 1, THREE.RedFormat)
    gradient.minFilter = THREE.NearestFilter
    gradient.magFilter = THREE.NearestFilter
    gradient.generateMipmaps = false
    gradient.needsUpdate = true
  }
  return gradient
}

// Y2K candy-plastic gloss by default (physical, full clearcoat). Use metal=1 rough=0.15 for chrome.
export function Mat({
  color = '#ffffff',
  rough = 0.28,
  metal = 0,
  coat = 1,
  emissive = '#000000',
  glow = 0,
  outline = true,
  thick = 2.6, // px (drei Outlines is screen-space in this version)
  ...rest
}) {
  const toon = useToon()
  if (toon) {
    return (
      <>
        <meshToonMaterial color={color} gradientMap={toonGradient()} emissive={emissive} emissiveIntensity={glow} {...rest} />
        {outline && <Outlines thickness={thick} color={INK} />}
      </>
    )
  }
  return (
    <meshPhysicalMaterial
      color={color}
      roughness={rough}
      metalness={metal}
      clearcoat={coat}
      clearcoatRoughness={0.08}
      sheen={metal > 0.5 ? 0 : 0.3}
      sheenColor="#ffffff"
      emissive={emissive}
      emissiveIntensity={glow}
      {...rest}
    />
  )
}

// One accent per figure.
export const CHROME = { color: '#E8EDF2', metal: 1, rough: 0.12, coat: 0 }
export const IRID = { iridescence: 1, iridescenceIOR: 1.3, iridescenceThicknessRange: [100, 400] }
