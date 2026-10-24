import { createContext, useContext } from 'react'
import { CREATURE_COLORS } from '../palette'

// vibe (CONTRACT v3.3): cute = fuzzy friend; cool = sleek streetwear collectible; ugly = ugly-cute (Labubu energy).
export const VIBES = ['cute', 'cool', 'ugly']
export const VibeCtx = createContext('cute')
export const useVibe = () => useContext(VibeCtx)

// cool: matte/satin dark bases with one neon accent. ugly: slightly off, earthy-but-friendly colours.
const VIBE_COLORS = {
  cool: {
    blob: { name: 'Charcoal / Lime', body: '#3A3F47', patch: '#565D68', accent: '#B8F04A', detail: '#565D68', glow: 0.7 },
    cat: { name: 'Navy / Chrome', body: '#24304F', patch: '#3A4A70', accent: '#3DF5FF', detail: '#C9D2DC', glow: 0.7 },
    dragon: { name: 'Olive / Volt', body: '#59633E', patch: '#79845A', accent: '#FF9A3C', detail: '#79845A', glow: 0.6 },
    axolotl: { name: 'Charcoal / Neon Pink', body: '#3A3F47', patch: '#565D68', accent: '#FF4FB0', detail: '#565D68', glow: 0.6 },
    frog: { name: 'Olive / Cyan', body: '#4C5636', patch: '#6B7650', accent: '#3DF5FF', detail: '#6B7650', glow: 0.7 },
    bot: { name: 'Stealth / Cyan', body: '#2A2E35', patch: '#0B0F14', accent: '#3DF5FF', detail: '#0B0F14', glow: 0.7 },
  },
  ugly: {
    blob: { name: 'Mustard / Swamp', body: '#C9B04E', patch: '#7E8F4A', accent: '#8C6FA8', detail: '#E9DDB0' },
    cat: { name: 'Lilac-Grey / Mustard', body: '#A49AB5', patch: '#D8B44A', accent: '#6E8A4A', detail: '#E6E0EC' },
    dragon: { name: 'Swamp / Mustard', body: '#7E8F4A', patch: '#D8C46A', accent: '#8C6FA8', detail: '#D8C46A' },
    axolotl: { name: 'Faded Mauve / Moss', body: '#BFA0B2', patch: '#8E9A5A', accent: '#8A5A78', detail: '#EADCE3' },
    frog: { name: 'Olive-Mustard / Lilac', body: '#9AA04A', patch: '#B6A9C6', accent: '#C98A4B', detail: '#E6E0B0' },
    bot: { name: 'Beige / Tape', body: '#CFC6A8', patch: '#1C2A26', accent: '#D8B44A', detail: '#1C2A26' },
  },
}

export function colorsFor(creature, vibe) {
  return VIBE_COLORS[vibe]?.[creature] ?? CREATURE_COLORS[creature]
}

export const useCreatureColors = (creature) => colorsFor(creature, useVibe())
