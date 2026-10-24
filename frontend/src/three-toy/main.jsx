// TEMPORARY preview page for the 3D toy (toy.html). Delete when done.
import { createRoot } from 'react-dom/client'
import ToyCapybara from './ToyCapybara'

const q = new URLSearchParams(location.search)
const moods = (q.get('moods') || 'deadpan,aha').split(',')
const views = [
  ['front', 0],
  ['3/4 left', -0.65],
  ['3/4 right', 0.65],
  ['side', -Math.PI / 2],
]
const size = Number(q.get('size') || 340)
const single = q.get('single')

function App() {
  if (single) {
    return (
      <div style={{ width: '100vw', height: '100vh' }}>
        <ToyCapybara mood={single} spin={q.get('spin') === '1'} yaw={Number(q.get('yaw') || 0)} dpr={1} />
      </div>
    )
  }
  return (
    <div style={{ padding: 16 }}>
      {moods.map((m) => (
        <div key={m} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ width: 70, fontWeight: 700, color: '#20435c' }}>{m}</div>
          {views.map(([label, yaw]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ width: size, height: size }}>
                <ToyCapybara mood={m} spin={false} yaw={yaw} dpr={1.5} />
              </div>
              <div style={{ fontSize: 13, color: '#20435c', fontWeight: 600, marginBottom: 8 }}>{label}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)
