import { createContext, useContext } from 'react'
import { CREATURE_COLORS } from '../palette'

// vibe (CONTRACT v3.3): cute = fuzzy friend; cool = sleek streetwear collectible; ugly = ugly-cute (Labubu energy).
export const VIBES = ['cute', 'cool', 'ugly']
export const VibeCtx = createContext('cute')
export const useVibe = () => useContext(VibeCtx)

// cool: matte/satin dark bases with one neon accent. ugly: slightly off, earthy-but-friendly colours.
const VIBE_COLORS = {
  cool: {
    blob: { name: 'Charcoal / Lime', body: '#3A3F47', patch: '#565D68', accent: '#B8F04A', detail: '#565D68' },
    cat: { name: 'Navy / Chrome', body: '#24304F', patch: '#3A4A70', accent: '#3DF5FF', detail: '#C9D2DC' },
    dragon: { name: 'Olive / Volt', body: '#59633E', patch: '#79845A', accent: '#FF9A3C', detail: '#79845A' },
    axolotl: { name: 'Charcoal / Neon Pink', body: '#3A3F47', patch: '#565D68', accent: '#FF4FB0', detail: '#565D68' },
    frog: { name: 'Olive / Cyan', body: '#4C5636', patch: '#6B7650', accent: '#3DF5FF', detail: '#6B7650' },
    bot: { name: 'Stealth / Cyan', body: '#2A2E35', patch: '#0B0F14', accent: '#3DF5FF', detail: '#0B0F14' },
  },
  ugly: {
    blob: { name: 'Seafoam / Mustard', body: '#7FC9B4', patch: '#E8D58A', accent: '#C98A4B', detail: '#E8D58A' },
    cat: { name: 'Rust / Oat', body: '#C9814A', patch: '#E9D6B4', accent: '#8E6FB0', detail: '#E9D6B4' },
    dragon: { name: 'Moss / Plum', body: '#93A85C', patch: '#D9E2B0', accent: '#8A4F7D', detail: '#D9E2B0' },
    axolotl: { name: 'Mauve / Cream', body: '#D79AB0', patch: '#F2DCE3', accent: '#A8566F', detail: '#F2DCE3' },
    frog: { name: 'Swamp / Peach', body: '#8DA552', patch: '#E8E0B0', accent: '#E89A6A', detail: '#E8E0B0' },
    bot: { name: 'Beige / Tape', body: '#D7D0BE', patch: '#1C2A26', accent: '#E0B04A', detail: '#1C2A26' },
  },
}

export function colorsFor(creature, vibe) {
  return VIBE_COLORS[vibe]?.[creature] ?? CREATURE_COLORS[creature]
}

export const useCreatureColors = (creature) => colorsFor(creature, useVibe())
