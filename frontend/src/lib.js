// Pick the session a tutor most likely wants to read for a student.
export function pickReportSession(sessions = []) {
  const done = sessions.filter((s) => s.gap_report || s.status === 'complete' || s.status === 'quizzed')
  const live = done.filter((s) => !s.saved)
  return (live.length ? live : done).at(-1) ?? null
}

const norm = (t = '') =>
  t
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim()

// Index of the student message a Pip's Brain quote came from (or -1).
export function findQuoteSource(transcript = [], quote = '') {
  const q = norm(quote)
  if (!q) return -1
  for (let i = transcript.length - 1; i >= 0; i--) {
    const m = transcript[i]
    if (m.from === 'student' && norm(m.text).includes(q)) return i
  }
  // Loose fallback: first 24 characters.
  const head = q.slice(0, 24)
  for (let i = transcript.length - 1; i >= 0; i--) {
    const m = transcript[i]
    if (m.from === 'student' && norm(m.text).includes(head)) return i
  }
  return -1
}

export const CIRCLED = ['①', '②', '③', '④', '⑤']
