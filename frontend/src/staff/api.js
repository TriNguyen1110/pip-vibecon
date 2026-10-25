// Staff + parent client for CONTRACT v3.13 to v3.19 (tutor Studio, owner, parent app). Real endpoints only.
import { ApiError } from '../api'

const BASE = `${import.meta.env.VITE_BACKEND_URL ?? ''}/api`

async function request(method, path, body) {
  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
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
    const d = data?.detail
    const msg = typeof d === 'string' ? d : Array.isArray(d) ? d.map((x) => x.msg).join('; ') : null
    throw new ApiError(msg || (res.status >= 500 ? `The Pip server isn’t answering right now (${res.status}).` : `Something went wrong (${res.status}).`), res.status)
  }
  return data
}

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
  // v3.15 (B18): tutor-approved drafts, quote moments, per-student switches.
  drafts: (sid) => request('GET', `/students/${sid}/drafts`),
  createDraft: (sid, body) => request('POST', `/students/${sid}/drafts`, body),
  patchDraft: (id, patch) => request('PATCH', `/drafts/${id}`, patch),
  sendDraft: (id, body) => request('POST', `/drafts/${id}/send`, body),
  skipDraft: (id) => request('POST', `/drafts/${id}/skip`),
  studentSettings: (sid, patch) => request('PATCH', `/students/${sid}/settings`, patch),
  session: (id) => request('GET', `/sessions/${id}`),
  // v3.19 (B22): parents pay the center (Stripe test mode); Pip's Brain as the stored document.
  parentBilling: (gid) => request('GET', `/parent/${gid}/billing`),
  parentCheckout: (gid, body) => request('POST', `/parent/${gid}/checkout`, body),
  // `method` only matters for the simulated invoice (bank → processing, card → paid); Stripe ignores it.
  confirmPayment: (id, method) => request('POST', `/payments/${id}/confirm`, method ? { method } : undefined),
  sendInvoice: (body) => request('POST', '/invoices', body),
  offlinePayment: (body) => request('POST', '/payments/offline', body),
  sessionDocument: (id) => request('GET', `/sessions/${id}/document`),
  health: () => request('GET', '/health'),
}
