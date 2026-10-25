// CONTRACT v3.18 helpers: avatars, pace words, and the learning-map fallback before B21 lands.
import { initialsOf } from '../components/ui.jsx'

const AVATAR_COLORS = ['#7B6CFF', '#2EB8C9', '#E0864A', '#4FA35A', '#C2559B', '#3A7BD5', '#B8913A', '#5E8C82']

// The student's illustrated badge: the backend's {initials, color}, or a stable fallback from the id.
export function avatarOf(student) {
  if (student?.avatar?.initials) return student.avatar
  const id = String(student?.id ?? student?.name ?? '')
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return { initials: initialsOf(student?.name ?? '') || '·', color: AVATAR_COLORS[h % AVATAR_COLORS.length] }
}

// Readable ink on a badge color (white or near-black, whichever has more contrast).
export function inkOn(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex ?? '')
  if (!m) return '#0C0A18'
  const n = parseInt(m[1], 16)
  const lin = (v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255)
  return (1.05 / (L + 0.05)) >= ((L + 0.05) / 0.05) ? '#FFFFFF' : '#0C0A18'
}

export const PACE_WORDS = { quick: 'Quick', steady: 'Steady', 'needs time': 'Needs time' }
export const EXPLAINS_WORDS = { examples: 'examples', pictures: 'pictures', steps: 'step by step', analogies: 'analogies', 'short claims': 'short claims' }

// A node counts as "already knew" when the backend says so, or when it is known without any explanation.
export const isGiven = (n) => !!(n?.given ?? n?.known ?? n?.prior_knowledge ?? (n?.source === 'prior'))

// Before B21: one map per subject from the profile's mastery (concepts in order build on the previous one).
export function mapFromProgress(progress = [], priorByMission = {}) {
  const nodes = []
  const edges = []
  for (const p of progress) {
    const mission = p.current_mission?.topic ?? null
    const prior = priorByMission[p.current_mission?.id] ?? []
    let prev = null
    for (const m of p.mastery ?? []) {
      const given = m.known ?? prior.includes(m.concept_id)
      const id = `${p.subject}:${m.concept_id}`
      nodes.push({ concept_id: id, mission, subject: p.subject, label: m.text, level: given ? Math.max(2, m.level) : m.level, explain_level: m.level, evidence_quote: null, given })
      if (prev) edges.push({ from: id, to: prev, kind: 'builds_on' })
      prev = id
    }
  }
  return { nodes, edges, fallback: true }
}
