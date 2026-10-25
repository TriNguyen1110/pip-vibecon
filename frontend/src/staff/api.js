// Staff + parent client for CONTRACT v3.13 / v3.13b.
// Mock fallback (src/staff/fixtures.js) is served when:
//   dev builds only (`npm run dev`): the URL has ?mock=1 (remembered for this tab; ?mock=0 clears it), or the
//   backend is unreachable. A route that doesn't exist yet throws an ApiError with `missingRoute: true`
//   (isMissing) so screens can fall back to older endpoints.
// Production builds always use the real v3.13 endpoints; the shell shows a "mock data" badge whenever a mock answered.
import { useSyncExternalStore } from 'react'
import { ApiError } from '../api'
import { isMockMiss, mockRequest } from './fixtures'

const BASE = `${import.meta.env.VITE_BACKEND_URL ?? ''}/api`
const DEV = import.meta.env.DEV

function forced() {
  if (!DEV) return false
  try {
    const q = new URLSearchParams(window.location.search).get('mock')
    if (q === '1') sessionStorage.setItem('pip.mock', '1')
    if (q === '0') sessionStorage.removeItem('pip.mock')
    return sessionStorage.getItem('pip.mock') === '1'
  } catch {
    return false
  }
}

// "Mock answered at least once" store for the badge.
let mockUsed = false
const subs = new Set()
function markMock() {
  if (mockUsed) return
  mockUsed = true
  subs.forEach((f) => f())
}
export function useMockUsed() {
  return useSyncExternalStore(
    (f) => {
      subs.add(f)
      return () => subs.delete(f)
    },
    () => mockUsed,
  )
}

function fromMock(method, path, body) {
  try {
    const r = mockRequest(method, path, body)
    markMock()
    return Promise.resolve(JSON.parse(JSON.stringify(r)))
  } catch (e) {
    if (isMockMiss(e)) return null
    markMock()
    return Promise.reject(new ApiError(e.message, e.status ?? 500))
  }
}

async function request(method, path, body) {
  if (forced()) {
    const m = fromMock(method, path, body)
    if (m) return m
  }
  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    if (DEV) {
      const m = fromMock(method, path, body)
      if (m) return m
    }
    throw new ApiError("Can't reach the Pip server right now.", 0)
  }
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }
  if (!res.ok) {
    const missingRoute = (res.status === 404 && data?.detail === 'Not Found') || res.status === 405
    // Dev: fixtures only stand in for an unreachable backend. A missing route is a real answer, so screens can
    // take their compat path (e.g. v3.15 drafts before B18 lands); use ?mock=1 to see the full fixture flow.
    if (DEV && res.status >= 502) {
      const m = fromMock(method, path, body)
      if (m) return m
    }
    const d = data?.detail
    const msg = typeof d === 'string' ? d : Array.isArray(d) ? d.map((x) => x.msg).join('; ') : null
    if (missingRoute) throw Object.assign(new ApiError('This feature isn’t on the server yet.', res.status), { missingRoute: true })
    throw new ApiError(msg || (res.status >= 500 ? `The Pip server isn’t answering right now (${res.status}).` : `Something went wrong (${res.status}).`), res.status)
  }
  return data
}

export const isMissing = (e) => !!e?.missingRoute

const qs = (o) => {
  const p = new URLSearchParams()
  Object.entries(o).forEach(([k, v]) => v != null && v !== '' && p.set(k, v))
  const s = p.toString()
  return s ? `?${s}` : ''
}

export const staffApi = {
  subjects: () => request('GET', '/subjects'),
  tutors: () => request('GET', '/tutors'),
  tutorStudents: (tid, { subject, q, filter } = {}) => request('GET', `/tutors/${tid}/students${qs({ subject, q, filter })}`),
  profile: (sid) => request('GET', `/students/${sid}/profile`),
  addNote: (sid, body) => request('POST', `/students/${sid}/notes`, body),
  addEnrollment: (sid, body) => request('POST', `/students/${sid}/enrollments`, body),
  draft: (body) => request('POST', '/assignments/draft', body),
  bulkAssign: (assignment, student_ids) => request('POST', '/assignments/bulk', { assignment, student_ids }),
  addGuardian: (g) => request('POST', '/guardians', g),
  patchGuardian: (gid, patch) => request('PATCH', `/guardians/${gid}`, patch),
  thread: (student_id, guardian_id) => request('GET', `/threads${qs({ student_id, guardian_id })}`),
  sendThread: (body) => request('POST', '/threads', body),
  overview: () => request('GET', '/center/overview'),
  parentHome: (gid) => request('GET', `/parent/${gid}/home`),
  parentKid: (gid, sid) => request('GET', `/parent/${gid}/kids/${sid}`),
  // Existing per-session parent update; v3.13 addresses every guardian (messages[] when the backend has it).
  updatePreview: (sessionId, student_id) => request('POST', `/sessions/${sessionId}/parent-update/preview`, { student_id }),
  updateSend: (sessionId, body) => request('POST', `/sessions/${sessionId}/parent-update/send`, body),
  // v3.15 (B18, proposed shapes; see fixtures.js): tutor-approved drafts, quote moments, per-student switches.
  drafts: (sid) => request('GET', `/students/${sid}/drafts`),
  createDraft: (sid, body) => request('POST', `/students/${sid}/drafts`, body),
  patchDraft: (id, patch) => request('PATCH', `/drafts/${id}`, patch),
  sendDraft: (id, body) => request('POST', `/drafts/${id}/send`, body),
  skipDraft: (id) => request('POST', `/drafts/${id}/skip`),
  studentSettings: (sid, patch) => request('PATCH', `/students/${sid}/settings`, patch),
  session: (id) => request('GET', `/sessions/${id}`),
}
