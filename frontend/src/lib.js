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

// CONTRACT v3 rubric level on an event: 1 = steps without a reason (a whiff, no damage),
// 3 = reason applied to a new case (a critical hit).
export const isCrit = (ev) => ev?.kind === 'hit' && ev.level === 3
export const isProcedureOnly = (ev) => ev?.level === 1 && ev?.kind !== 'heal'

// The lesson entry for one concept: by concept_id, else by position (same order as concepts).
export function lessonIndexFor(lesson, concept, i) {
  const list = lesson?.concepts ?? []
  const byId = list.findIndex((lc) => lc?.concept_id != null && lc.concept_id === concept?.id)
  if (byId >= 0) return byId
  return i < list.length ? i : -1
}

// CONTRACT v3 rubric levels, in tutor words.
export const LEVEL_WORDS = {
  0: 'no explanation yet',
  1: 'procedure only, no reason',
  2: 'explained with a reason',
  3: 'reason, applied to a new case',
}

// Student-facing step names must never give the answer away (verifier D-14). The concept's full text
// is the rule she has to explain, so Play screens use a short neutral name: the lesson's own
// `label`/`short` when it has one, a hand-picked name for the seeded missions, else "Step N".
const SEEDED_STEP_NAMES = {
  a_tri: ['Two triangles', 'Rectangles', 'One triangle'],
  a_frac: ['Pieces', 'Making them match', 'Adding'],
  a_sat_commas: ['Joining sentences', 'Comma trouble', 'Where commas go'],
  a_sat_linear: ['Balance', 'Getting x alone', 'Checking'],
}
export function stepName(assignment, i) {
  const c = assignment?.concepts?.[i]
  const lc = assignment?.lesson?.concepts?.[i]
  return c?.label ?? c?.short ?? lc?.label ?? lc?.short ?? SEEDED_STEP_NAMES[assignment?.id]?.[i] ?? null
}
export function stepTitle(assignment, i) {
  const n = stepName(assignment, i)
  return n ? `Step ${i + 1}: ${n}` : `Step ${i + 1}`
}
