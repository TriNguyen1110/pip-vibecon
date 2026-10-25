// Shared words and formatters for Studio (tutor, owner) and the parent app (CONTRACT v3.13).

export const SUBJECT_NAMES = {
  math: 'Math',
  writing: 'Writing',
  sat_math: 'SAT Math',
  sat_rw: 'SAT Reading & Writing',
  science: 'Science',
}
export const SUBJECT_SHORT = { math: 'Math', writing: 'Writing', sat_math: 'SAT Math', sat_rw: 'SAT R&W', science: 'Science' }
export const subjectName = (id, subjects) => subjects?.find?.((s) => s.id === id)?.name ?? SUBJECT_NAMES[id] ?? id ?? ''
export const subjectShort = (id) => SUBJECT_SHORT[id] ?? SUBJECT_NAMES[id] ?? id ?? ''

export const FLAG_WORDS = {
  at_risk: 'At risk',
  needs_update: 'Needs parent update',
  no_contact: 'No parent contact',
  new: 'New',
}
export const FLAG_ORDER = ['at_risk', 'needs_update', 'no_contact', 'new']

export const PREFERS_WORDS = { sms: 'Text message', email: 'Email' }
export const UPDATES_WORDS = { every_ko: 'After every finished lesson', weekly: 'Once a week', off: 'Off' }
export const UPDATES_SHORT = { every_ko: 'Every finished lesson', weekly: 'Weekly', off: 'Off' }
export const RELATION_WORDS = { parent: 'Parent', grandparent: 'Grandparent', guardian: 'Guardian' }

export const STATUS_WORDS = {
  delivered: 'Delivered',
  'test-mode (not delivered)': 'Test mode · not sent',
  'queued (quiet hours)': 'Queued · quiet hours',
  received: 'Received',
}

export const LEVEL_SHORT = ['Not yet', 'Steps only', 'Explained', 'Explained + applied']

const MIN = 60 * 1000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

export function ago(ts, now = Date.now()) {
  if (!ts) return '—'
  const t = new Date(ts).getTime()
  if (Number.isNaN(t)) return String(ts)
  const d = now - t
  if (d < 0) return 'upcoming'
  if (d < HOUR) return `${Math.max(1, Math.round(d / MIN))}m ago`
  if (d < DAY) return `${Math.round(d / HOUR)}h ago`
  if (d < 2 * DAY) return 'yesterday'
  if (d < 14 * DAY) return `${Math.round(d / DAY)}d ago`
  return new Date(t).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function daysSince(ts, now = Date.now()) {
  if (!ts) return Infinity
  const t = new Date(ts).getTime()
  return Number.isNaN(t) ? Infinity : (now - t) / DAY
}

export function fmtDate(d) {
  if (!d) return '—'
  const t = new Date(d.length === 10 ? `${d}T12:00:00` : d)
  if (Number.isNaN(t.getTime())) return String(d)
  return t.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function fmtWhen(ts) {
  if (!ts) return ''
  const t = new Date(ts)
  if (Number.isNaN(t.getTime())) return String(ts)
  return t.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export const usd = (n) =>
  n == null || Number.isNaN(Number(n)) ? '—' : `$${Math.round(Number(n)).toLocaleString('en-US')}`

export const pct = (n) => (n == null || Number.isNaN(Number(n)) ? '—' : `${Math.round(Number(n))}%`)

export const firstName = (n = '') => String(n).split(/\s+/)[0] || ''

// Guardian / student refs can arrive as objects or ids.
export const refName = (x) => (x && typeof x === 'object' ? x.name : x) ?? ''
export const refId = (x) => (x && typeof x === 'object' ? x.id : x) ?? null

export const reachable = (g) => !!(g && (g.phone || g.email))

export function hoursLeft(pkg) {
  if (!pkg) return null
  return Math.max(0, (Number(pkg.hours_total) || 0) - (Number(pkg.hours_used) || 0))
}

// Session id from a timeline / progress link like "/tutor/report/sess_123".
export function sessionFromLink(link) {
  const m = /\/tutor\/report\/([^/?#]+)/.exec(link ?? '')
  return m ? m[1] : null
}
