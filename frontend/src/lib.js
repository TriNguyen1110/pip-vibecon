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
// DATA-1: the lesson's own per-concept labels (an array by index, or a map by concept id) come first.
function lessonLabel(assignment, i) {
  const labels = assignment?.lesson?.concept_labels ?? assignment?.concept_labels
  const pick = (x) => (typeof x === 'string' ? x : x?.label ?? x?.short ?? null)
  if (Array.isArray(labels)) return pick(labels[i]) || null
  if (labels && typeof labels === 'object') {
    const id = assignment?.concepts?.[i]?.id ?? assignment?.lesson?.concepts?.[i]?.concept_id
    return (id && pick(labels[id])) || null
  }
  return null
}
export function stepName(assignment, i) {
  const c = assignment?.concepts?.[i]
  const lc = assignment?.lesson?.concepts?.[i]
  return (
    c?.label ?? c?.short ?? lessonLabel(assignment, i) ?? lc?.label ?? lc?.short ?? SEEDED_STEP_NAMES[assignment?.id]?.[i] ?? null
  )
}

// CONTRACT v3.17: a `given` concept is prior knowledge. Pip already knows it: its meter starts full and it is
// shown as known, never as an empty note or a fresh win.
export const GIVEN_LABEL = 'Pip already knows'
export function isGiven(assignment, cid) {
  const c = assignment?.concepts?.find((x) => x.id === cid)
  const lc = assignment?.lesson?.concepts?.find((x) => x.concept_id === cid)
  return (c?.explain_level ?? lc?.explain_level) === 'given'
}

// DATA-1: earned item names from the lesson (`earned_items` as a map id -> name, or [{id, name}]),
// then today's names, then the id in words.
const EARNED_NAMES = { half_pin: 'half pin', fixed_it_star: 'fixed-it star' }
export function earnedName(id, assignment) {
  const own = assignment?.lesson?.earned_items ?? assignment?.earned_items
  const pick = (x) => (typeof x === 'string' ? x : x?.name ?? x?.label ?? null)
  let n = null
  if (Array.isArray(own)) n = pick(own.find((e) => e && typeof e === 'object' && e.id === id))
  else if (own && typeof own === 'object') n = pick(own[id])
  return n || EARNED_NAMES[id] || String(id ?? '').replace(/_/g, ' ')
}

// DATA-1: the equation the K.O. card strikes, from the lesson's `ko_strike: {wrong, right}`.
// Returns [lhs, struck rhs], or ['', whole] when the wrong rule has no "=".
export function lessonStrike(assignment) {
  const k = assignment?.lesson?.ko_strike ?? assignment?.ko_strike
  const wrong = typeof k === 'string' ? k : k?.wrong
  if (!wrong || typeof wrong !== 'string') return null
  const at = wrong.indexOf('=')
  return at > 0 ? [wrong.slice(0, at).trim(), wrong.slice(at + 1).trim()] : ['', wrong.trim()]
}
export function stepTitle(assignment, i) {
  const n = stepName(assignment, i)
  return n ? `Step ${i + 1}: ${n}` : `Step ${i + 1}`
}

// Weapon names arrive with an emoji ("Copy-and-Flip Mirror 🪞"); fallback fonts draw those as ovals,
// so the student UI shows the words only.
const PICTO = /\p{Extended_Pictographic}|\u{FE0F}|\u{200D}|\u{20E3}|\p{Emoji_Modifier}/gu
export function weaponName(w = '') {
  return String(w ?? '').replace(PICTO, '').replace(/\s{2,}/g, ' ').trim()
}
