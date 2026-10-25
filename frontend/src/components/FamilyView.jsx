import { api } from '../api'
import { useLoad } from '../hooks'

// F19 (CONTRACT v3.15): exactly what the family sees, from the same builder as the parent app. Tutors see
// everything; families see only what the tutor sends or what the student picks. Never the chat.
function itemsOf(d) {
  if (!d) return []
  if (Array.isArray(d)) return d
  return d.items ?? d.reports ?? d.feed ?? [...(d.shared ?? []), ...(d.sent ?? [])]
}

export default function FamilyView({ studentId }) {
  const v = useLoad(() => api.familyView(studentId), [studentId])
  const items = itemsOf(v.data)
  return (
    <div className="family-view stack">
      <p className="family-view__lead">Only what Ms. Rivera sends, or a message you pick. Never the chat.</p>
      {v.loading && !v.data ? (
        <p className="family-view__empty">Looking…</p>
      ) : v.error && !v.data ? (
        <p className="family-view__empty">
          {v.error.status === 404 ? 'Nothing to show here yet.' : 'Couldn’t load this right now.'}
        </p>
      ) : items.length === 0 ? (
        <p className="family-view__empty">Nothing yet. Hold one of your messages to pick one for them.</p>
      ) : (
        <ul className="family-view__list">
          {items.map((x, i) => (
            <li key={x.id ?? i} className="panel family-view__item">
              <span className="family-view__from">From {x.from?.name ?? 'your tutor'}</span>
              {(x.title || x.topic) && <span className="family-view__title">{x.title ?? x.topic}</span>}
              {(x.text || x.message || x.quote?.text) && (
                <span className="family-view__text">{x.text ?? x.message ?? `“${x.quote.text}”`}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
