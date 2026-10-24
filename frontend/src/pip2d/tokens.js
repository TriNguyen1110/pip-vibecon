// Colour tokens per creature and vibe: --body, --shade (~15% darker), --belly, --ink (~60% darker, never black).
export const CREATURE_TOKENS = {
  blob: {
    cute: { body: '#6EE0D6', shade: '#5DBFB6', belly: '#C9F6F1', ink: '#2C5A56' },
    cool: { body: '#3F6E70', shade: '#345C5E', belly: '#5D8B8C', ink: '#132A2C', neon: '#3DF5FF', visor: '#1B2327' },
    ugly: { body: '#86D9B9', shade: '#71B99D', belly: '#D9F2C4', ink: '#33574A' },
  },
}

export const EYE = '#16121C'
export const MOUTH = '#3A1E2C'
export const TONGUE = '#FF8A8A'
export const BLUSH = '#FF9DB5'
export const BOSS_TINT = '#FF5A4E'

export function tokensFor(creature = 'blob', vibe = 'cute') {
  const c = CREATURE_TOKENS[creature] ?? CREATURE_TOKENS.blob
  return c[vibe] ?? c.cute
}

// Older mood names used by the app map onto the new expression set.
export const MOOD_ALIASES = { lightbulb: 'aha', stuck: 'overwhelmed', celebrating: 'proud', idle: 'deadpan' }
export const MOODS = ['deadpan', 'confused', 'notes', 'thinking', 'aha', 'proud', 'overwhelmed', 'possessed']
export const VISEMES = ['closed', 'small', 'wide', 'o']
