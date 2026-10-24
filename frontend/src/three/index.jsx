// Placeholder until the 3D owner lands the real scene. Same props as the final component.
export const CREATURES = ['blob', 'cat', 'dragon', 'axolotl', 'frog', 'bot']
export const ACCESSORIES = ['none', 'cap', 'glasses', 'scarf', 'headphones']
export const ENVIRONMENTS = ['room', 'arena', 'garden']

const FACE = { confused: '🤔', lightbulb: '💡', stuck: '😵', celebrating: '🎉' }

export function MascotStage({ mood = 'confused', height = 260, onTap }) {
  return (
    <div onClick={onTap} style={{ height, display: 'grid', placeItems: 'center', fontSize: 72, cursor: 'pointer' }}>
      {FACE[mood] ?? '🤔'}
    </div>
  )
}

export default MascotStage
