// Thin client for CONTRACT.md. Every route lives under /api.
const BASE = `${import.meta.env.VITE_BACKEND_URL ?? ''}/api`

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

async function request(method, path, body, signal) {
  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      signal,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (e) {
    if (e?.name === 'AbortError') throw new ApiError('Pip lost the thread.', -1)
    throw new ApiError("Can't reach the Pip server right now.", 0)
  }
  let data = null
  const text = await res.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }
  if (!res.ok) {
    const detail = data?.detail
    const msg = typeof detail === 'string' ? detail : Array.isArray(detail) ? detail.map((d) => d.msg).join('; ') : null
    throw new ApiError(msg || `Something went wrong (${res.status}).`, res.status)
  }
  return data
}

const get = (p) => request('GET', p)
const post = (p, b = {}, signal) => request('POST', p, b, signal)

export const api = {
  health: () => get('/health'),
  center: () => get('/center'),
  atRisk: () => get('/center/at-risk'),
  roster: (tutorId = 't1') => get(`/tutors/${tutorId}/roster`),
  student: (id) => get(`/students/${id}`),
  openApp: (id) => post(`/students/${id}/open`),
  draftAssignment: (b) => post('/assignments/draft', b),
  saveAssignment: (a) => post('/assignments', a),
  createSession: (b) => post('/sessions', b),
  session: (id) => get(`/sessions/${id}`),
  turn: (id, text, signal) => post(`/sessions/${id}/turn`, { text }, signal),
  equip: (id, weapon) => post(`/sessions/${id}/equip`, { weapon }),
  styleTiles: () => get('/style/tiles'),
  pipName: (studentId, name) => post(`/students/${studentId}/pip-name`, { name }),
  shareMessage: (sessionId, msg_index) => post(`/sessions/${sessionId}/share`, { msg_index }),
  familyView: (studentId) => get(`/students/${studentId}/family-view`),
  themes: () => get('/themes'),
  setStyle: (studentId, tiles) => post(`/students/${studentId}/style`, { tiles }),
  setVoice: (id, pip_voice) => post(`/sessions/${id}/voice`, { pip_voice }),
  quiz: (id) => post(`/sessions/${id}/quiz`),
  reteach: (id, concept_id) => post(`/sessions/${id}/reteach`, { concept_id }),
  finisher: (id, weapon) => post(`/sessions/${id}/finisher`, { weapon }),
  report: (id) => get(`/sessions/${id}/report`),
  parentPreview: (id) => post(`/sessions/${id}/parent-update/preview`),
  parentSend: (id, message) => post(`/sessions/${id}/parent-update/send`, { message }),
  sentLog: () => get('/sent-log'),
  workshop: (misconception) => post('/workshops', { misconception }),
  checkout: () => post('/pilot/checkout'),
  confirmPilot: () => post('/pilot/confirm'),
  reset: () => post('/demo/reset'),
  warm: () => post('/demo/warm'),
}

export const DEMO = { tutorId: 't1', studentId: 's001' }

// Students the live demo can switch between on /student (Maya stays the default).
export const DEMO_STUDENTS = [
  { id: 's001', label: 'Maya · triangles' },
  { id: 's005', label: 'Yara · SAT Writing' },
  { id: 's009', label: 'Dev · SAT Math' },
  { id: 's014', label: 'Theo · trig' },
]
// Seeded, hand-written missions are pinned first on a student's home screen.
export const PINNED_MISSIONS = ['a_tri', 'a_frac', 'a_sat_commas', 'a_sat_linear']

// DATA-1: a showcase mission is a hand-written one (flagged, one of the seeded ids, or a lesson with its own
// offline demo script). Each student's newest showcase is pinned first (Maya: a_tri, Theo: a_trig_id, Luna: a_sat_modifiers).
export const isShowcase = (a) => !!a && (a.showcase === true || PINNED_MISSIONS.includes(a.id) || !!a.lesson?.offline_demo)
export function pinnedMissionId(assignments = []) {
  const shows = assignments.filter(isShowcase)
  if (!shows.length) return null
  const t = (a) => Date.parse(a.created_at ?? '') || 0
  return shows.reduce((best, a) => (t(a) > t(best) ? a : best)).id
}
// Pinned one first, then the other seeded ones, then the rest (stable).
export function orderMissions(assignments = []) {
  const pin = pinnedMissionId(assignments)
  const rank = (a) => (a.id === pin ? 2 : PINNED_MISSIONS.includes(a.id) ? 1 : 0)
  return [...assignments].sort((x, y) => rank(y) - rank(x))
}

export const studentHomePath = (id) => (!id || id === DEMO.studentId ? '/student' : `/student?as=${id}`)
