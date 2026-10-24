import { Pip2D } from './Pip2D'

// Fashion-magazine cover for a K.O.: masthead "PIP", big pose, the K.O. line as the cover quote.
// <Cover2D creature vibe version pose bossName koLine issueNo accessory lighting width />
const LOOKS = {
  club: {
    bg: 'radial-gradient(60% 45% at 20% 25%, rgba(255,63,216,.55), transparent 70%), radial-gradient(55% 45% at 85% 70%, rgba(47,243,255,.45), transparent 70%), linear-gradient(180deg, #1A0F3A 0%, #0B0820 100%)',
    ink: '#FFFFFF',
    sub: '#C9D6FF',
    accent: '#2FF3FF',
  },
  day: {
    bg: 'radial-gradient(60% 45% at 80% 20%, rgba(255,210,90,.5), transparent 70%), linear-gradient(180deg, #9FDBFF 0%, #FCEBFF 100%)',
    ink: '#14102A',
    sub: '#3A3060',
    accent: '#E8389A',
  },
}

export function Cover2D({
  creature = 'capybara',
  vibe = 'cool',
  version = 3,
  pose = 'pose',
  bossName = 'Duke Doublecount',
  koLine = 'Half of it was always enough.',
  issueNo = 1,
  accessory = 'none',
  lighting = 'club',
  mood = 'deadpan',
  width = 300,
}) {
  const L = LOOKS[lighting] ?? LOOKS.club
  const h = width * (4 / 3)
  const u = width / 300
  const mast = {
    fontFamily: '"Anton", "Impact", "Haettenschweiler", "Arial Narrow Bold", "Arial Black", sans-serif',
    fontWeight: 900,
    fontSize: 120 * u,
    lineHeight: 0.82,
    letterSpacing: -4 * u,
    background: 'linear-gradient(100deg, #7FF5FF, #FFA3EC 45%, #D2F76E 75%, #9FB8FF)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    WebkitTextStroke: `${1.5 * u}px ${lighting === 'club' ? 'rgba(255,255,255,.65)' : '#14102A'}`,
  }
  const small = { fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace', fontSize: 10 * u, letterSpacing: 1.5 * u, color: L.sub, textTransform: 'uppercase' }
  return (
    <div
      role="img"
      aria-label={`PIP magazine, issue ${issueNo}: ${koLine}`}
      style={{ position: 'relative', width, height: h, background: L.bg, borderRadius: 14 * u, overflow: 'hidden', boxShadow: '0 18px 40px -18px rgba(0,0,0,.55)' }}
    >
      <div style={{ position: 'absolute', left: 16 * u, top: 10 * u, ...mast }}>PIP</div>
      <div style={{ position: 'absolute', right: 16 * u, top: 18 * u, textAlign: 'right', ...small }}>
        <div>Issue No. {String(issueNo).padStart(2, '0')}</div>
        <div>The K.O. issue</div>
      </div>
      <div style={{ position: 'absolute', right: 16 * u, top: 64 * u, maxWidth: 120 * u, textAlign: 'right', fontFamily: 'system-ui, sans-serif', fontWeight: 900, fontSize: 13 * u, lineHeight: 1.05, color: L.accent, textTransform: 'uppercase' }}>
        vs {bossName}
        <div style={{ ...small, color: L.sub, marginTop: 4 * u }}>K.O. exclusive</div>
      </div>
      <div style={{ position: 'absolute', left: '50%', bottom: 66 * u, transform: 'translateX(-50%)' }}>
        <Pip2D creature={creature} vibe={vibe} version={version} pose={pose} mood={mood} accessory={accessory} lighting={lighting} size={222 * u} animate={false} />
      </div>
      <div
        style={{
          position: 'absolute',
          left: 16 * u,
          bottom: 18 * u,
          right: 70 * u,
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontStyle: 'italic',
          fontWeight: 700,
          fontSize: 19 * u,
          lineHeight: 1.08,
          color: L.ink,
          textShadow: lighting === 'club' ? '0 2px 12px rgba(0,0,0,.6)' : 'none',
        }}
      >
        “{koLine}”
      </div>
      {/* barcode */}
      <div style={{ position: 'absolute', right: 14 * u, bottom: 16 * u, width: 44 * u, height: 26 * u, background: '#fff', borderRadius: 3 * u, padding: 3 * u, display: 'flex', gap: 1 * u, alignItems: 'stretch' }}>
        {[2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 2].map((w, i) => (
          <span key={i} style={{ width: w * u, background: i % 2 ? '#fff' : '#111' }} />
        ))}
      </div>
    </div>
  )
}

export default Cover2D
