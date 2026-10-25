// Synthetic fixtures for CONTRACT v3.13 / v3.13b, served only when the real endpoint is missing
// (dev) or when the URL has ?mock=1. Same seed facts as the backend: Maya s001 (math with Ms. Rivera
// Tue 4:30pm, writing with Mr. Chen Thu 5pm), guardians g001 Ana R. (sms, es, every_ko; also her
// brother s014) and g002 Sam R. (email, en, weekly). Contacts are 555-01xx and @example.com only.

const DAY = 86400000
const HOUR = 3600000
const iso = (ms) => new Date(ms).toISOString()
const ago = (d, h = 0) => iso(Date.now() - d * DAY - h * HOUR)
const dateIn = (d) => new Date(Date.now() + d * DAY).toISOString().slice(0, 10)

export const SUBJECTS = [
  { id: 'math', name: 'Math', has_missions: true },
  { id: 'writing', name: 'Writing', has_missions: true },
  { id: 'sat_math', name: 'SAT Math', has_missions: true },
  { id: 'sat_rw', name: 'SAT Reading & Writing', has_missions: true },
  { id: 'science', name: 'Science', has_missions: false },
]

const TUTORS = [
  { id: 't1', name: 'Ms. Rivera' },
  { id: 't2', name: 'Mr. Chen' },
  { id: 't3', name: 'Ms. Okafor' },
  { id: 't4', name: 'Mr. Patel' },
  { id: 't5', name: 'Ms. Nguyen' },
  { id: 't6', name: 'Mr. Alvarez' },
  { id: 't7', name: 'Ms. Kim' },
  { id: 't8', name: 'Mr. Brooks' },
]
const tutorRef = (id) => TUTORS.find((t) => t.id === id) ?? { id, name: id }

const CONCEPTS = {
  math: [
    ['k1', 'Two copies of a triangle make a rectangle'],
    ['k2', 'A rectangle’s area is base × height'],
    ['k3', 'So a triangle is half of base × height'],
  ],
  writing: [
    ['c1', 'Two full sentences can’t be joined by a comma'],
    ['c2', 'Fix a run-on with a period, semicolon or “and”'],
    ['c3', 'Commas still go in lists and after intros'],
  ],
  sat_math: [
    ['l1', 'Do the same thing to both sides'],
    ['l2', 'Undo steps in reverse order'],
    ['l3', 'Check by putting x back in'],
  ],
  sat_rw: [
    ['r1', 'Spot the two independent clauses'],
    ['r2', 'Pick the punctuation that can join them'],
    ['r3', 'Explain why the other choices fail'],
  ],
  science: [],
}
const MISSION = { math: 'Area of a triangle', writing: 'Commas and run-ons', sat_math: 'Solving linear equations', sat_rw: 'Commas and run-ons (SAT)' }

// [subject, tutor, slot, startedDaysAgo, [hours_total, hours_used, price_usd, renewsInDays], lastActiveDaysAgo|null, ko_count, levels]
const SPEC = [
  ['s001', 'Maya R.', 6, [['math', 't1', 'Tue 4:30pm', 70, [12, 10, 480, 10], 1, 2, [3, 2, 3]], ['writing', 't2', 'Thu 5:00pm', 40, [8, 3, 320, 34], 3, 0, [1, 0, 2]]], ['g001', 'g002'], { creature: 'capybara', vibe: 'cool', brain_version: 2 }],
  ['s014', 'Theo R.', 9, [['sat_math', 't3', 'Wed 6:00pm', 50, [16, 9, 640, 40], 2, 1, [2, 2, 1]]], ['g001'], { creature: 'raccoon', vibe: 'cool', brain_version: 2 }],
  ['s005', 'Yara K.', 8, [['sat_rw', 't1', 'Mon 5:00pm', 90, [16, 11, 560, 28], 2, 2, [2, 3, 2]], ['math', 't1', 'Thu 4:00pm', 90, [12, 4, 480, 60], 6, 1, [2, 1, 1]]], ['g105'], { creature: 'cat' }],
  ['s027', 'Diego H.', 6, [['math', 't1', 'Tue 5:30pm', 120, [12, 7, 480, 35], 4, 1, [2, 2, 1]]], ['g127'], { creature: 'corgi' }],
  ['s035', 'Yara W.', 8, [['math', 't1', 'Wed 4:30pm', 80, [12, 6, 480, 41], 0, 3, [3, 3, 2]], ['science', 't7', 'Fri 4:00pm', 80, [10, 8, 400, 12], 5, 0, []]], ['g135'], { creature: 'frog' }],
  ['s036', 'Faye J.', 7, [['math', 't1', 'Mon 4:30pm', 150, [12, 5, 480, 50], 9, 1, [2, 1, 0]]], ['g136'], { creature: 'axolotl' }],
  ['s039', 'Amara M.', 6, [['math', 't1', 'Thu 4:30pm', 6, [12, 1, 480, 84], 2, 0, [1, 0, 0]]], ['g139'], { creature: 'cat' }],
  ['s043', 'Luna F.', 9, [['sat_math', 't1', 'Sat 10:00am', 110, [16, 14.5, 640, 6], 17, 1, [2, 1, 1]]], ['g143'], { creature: 'raccoon' }],
  ['s058', 'Rosa E.', 9, [['sat_math', 't1', 'Sat 11:00am', 200, [16, 9, 640, 45], 3, 2, [3, 2, 2]], ['sat_rw', 't2', 'Wed 5:00pm', 200, [16, 16, 560, -2], 20, 1, [2, 1, 1]]], ['g158', 'g159'], { creature: 'capybara' }],
  ['s070', 'Mia D.', 6, [['math', 't1', 'Fri 4:30pm', 60, [12, 10, 480, 9], 15, 0, [1, 1, 0]]], ['g170'], { creature: 'blob' }],
  ['s084', 'Chloe N.', 7, [['math', 't1', 'Tue 6:00pm', 95, [12, 6, 480, 39], 1, 2, [3, 2, 2]], ['writing', 't2', 'Thu 6:00pm', 10, [8, 1, 320, 70], 1, 0, [1, 1, 0]]], ['g184'], { creature: 'corgi' }],
  ['s087', 'Nico F.', 7, [['math', 't1', 'Wed 5:30pm', 130, [12, 3, 480, 66], 3, 2, [2, 3, 2]]], ['g187'], { creature: 'frog' }],
  ['s109', 'Dani D.', 8, [['math', 't1', 'Mon 6:00pm', 140, [12, 11, 480, 5], 16, 0, [1, 0, 0]]], ['g209'], { creature: 'axolotl' }],
  ['s006', 'Aisha R.', 9, [['writing', 't2', 'Mon 4:00pm', 100, [8, 4, 320, 48], 2, 1, [2, 2, 1]]], ['g106'], { creature: 'cat' }],
  ['s013', 'Diego C.', 6, [['writing', 't2', 'Tue 4:00pm', 70, [8, 7, 320, 8], 4, 0, [1, 1, 0]], ['math', 't6', 'Thu 4:00pm', 70, [12, 5, 480, 50], 4, 1, [2, 2, 1]]], ['g113'], { creature: 'corgi' }],
  ['s029', 'Xavi C.', 5, [['writing', 't2', 'Wed 4:00pm', 30, [8, 2, 320, 60], 1, 1, [2, 1, 1]]], ['g129'], { creature: 'frog' }],
  ['s034', 'Owen L.', 8, [['writing', 't2', 'Fri 5:00pm', 160, [8, 5, 320, 40], 18, 0, [1, 0, 1]]], ['g134'], { creature: 'raccoon' }],
  ['s080', 'Hana D.', 7, [['sat_rw', 't2', 'Sat 1:00pm', 12, [16, 2, 560, 80], 2, 0, [1, 1, 0]]], ['g180'], { creature: 'capybara' }],
]

const AT_RISK = {
  s109: ['Stuck after Pip’s full set of questions on “One triangle”. The friend hint didn’t unlock it.', 'Hasn’t come back on their own in 14 days.'],
  s043: ['Hasn’t come back on their own in 14 days.'],
  s070: ['No parent update since the last finished session.'],
  s034: ['Hasn’t come back on their own in 14 days.'],
  s058: ['SAT R&W package ran out 2 days ago.'],
}
const LAST_UPDATE_DAYS = { s001: 1, s014: 3, s005: 4, s027: 6, s035: 2, s036: 16, s039: null, s043: 20, s058: 9, s070: 25, s084: 2, s087: 5, s109: 18, s006: 3, s013: 15, s029: 4, s034: 22, s080: null }

// Guardians: g001 + g002 are hand-written; the rest are generated (synthetic).
const GUARDIANS = [
  { id: 'g001', name: 'Ana R.', relation: 'parent', phone: '555-0101', email: null, prefers: 'sms', language: 'es', updates: 'every_ko', quiet_hours: '21:00-07:00', student_ids: ['s001', 's014'] },
  { id: 'g002', name: 'Sam R.', relation: 'parent', phone: null, email: 'sam.r@example.com', prefers: 'email', language: 'en', updates: 'weekly', quiet_hours: null, student_ids: ['s001'] },
]
const GEN = [
  ['g105', 'Hiro K.', 's005', 'parent', 'en', 'sms'], ['g127', 'Lucia H.', 's027', 'parent', 'es', 'sms'],
  ['g135', 'Mai W.', 's035', 'parent', 'vi', 'sms'], ['g136', 'Pat J.', 's036', 'grandparent', 'en', 'email'],
  ['g139', 'Ngozi M.', 's039', 'parent', 'en', 'email'], ['g143', 'Wei F.', 's043', 'parent', 'zh', 'sms'],
  ['g158', 'Carmen E.', 's058', 'parent', 'es', 'sms'], ['g159', 'Jorge E.', 's058', 'parent', 'es', 'email'],
  ['g170', 'Dana D.', 's070', 'guardian', 'en', 'sms', true], ['g184', 'Linh N.', 's084', 'parent', 'vi', 'email'],
  ['g187', 'Erin F.', 's087', 'parent', 'en', 'sms'], ['g209', 'Lee D.', 's109', 'parent', 'en', 'email'],
  ['g106', 'Omar R.', 's006', 'parent', 'en', 'sms'], ['g113', 'Rosa C.', 's013', 'grandparent', 'es', 'sms'],
  ['g129', 'Tom C.', 's029', 'parent', 'en', 'email'], ['g134', 'Jia L.', 's034', 'parent', 'zh', 'email'],
  ['g180', 'Kenji D.', 's080', 'parent', 'en', 'sms'],
]
GEN.forEach(([id, name, sid, relation, language, prefers, unreachable], i) => {
  const n = String(10 + i).padStart(2, '0')
  GUARDIANS.push({
    id, name, relation, language, prefers,
    phone: unreachable || prefers !== 'sms' ? null : `555-01${n}`,
    email: unreachable || prefers !== 'email' ? null : `${name.split(' ')[0].toLowerCase()}.${id}@example.com`,
    updates: i % 4 === 0 ? 'every_ko' : 'weekly',
    quiet_hours: i % 3 === 0 ? '21:00-07:00' : null,
    student_ids: [sid],
  })
})

function buildDb() {
  const students = {}
  const enrollments = []
  for (const [id, name, grade, ens, guardian_ids, pip] of SPEC) {
    const list = ens.map(([subject, tutor_id, slot, started, pk], i) => {
      const [hours_total, hours_used, price_usd, renews] = pk
      const left = hours_total - hours_used
      const e = {
        id: `e_${id}_${i}`, student_id: id, subject, tutor_id, slot, goal: null, started: dateIn(-started),
        package: { hours_total, hours_used, price_usd, renews_on: dateIn(renews), status: renews < 0 || left <= 0 ? 'expired' : left <= 2 ? 'low' : 'active' },
      }
      enrollments.push(e)
      return e
    })
    students[id] = {
      id, name, grade, tutor_id: list[0].tutor_id, interests: null, since_last_session: null, last_session_id: null,
      enrollments: list, guardian_ids, pip: { name: id === 's001' ? 'Pip' : 'Pip', creature: pip.creature, vibe: pip.vibe ?? 'plain', brain_version: pip.brain_version ?? 1, form: 'base' },
      _spec: ens,
    }
  }
  students.s001.goal = 'Feel ready for 7th-grade geometry'
  // v3.18: avatar badge, school (synthetic), pace, next step, learning profile + map.
  const SCHOOLS = ['Lincoln Middle', 'Harbor View K-8', 'Mission Hills Middle', 'Bayside High', 'Cedar Park Middle']
  const PACES = ['steady', 'quick', 'needs time']
  const COLORS = ['#7B6CFF', '#2EB8C9', '#E0864A', '#4FA35A', '#C2559B', '#3A7BD5']
  Object.values(students).forEach((st, i) => {
    st.avatar = { initials: st.name.split(/\s+/).map((x) => x[0]).join('').slice(0, 2).toUpperCase(), color: COLORS[i % COLORS.length] }
    st.school = st.grade >= 9 ? 'Bayside High' : SCHOOLS[i % SCHOOLS.length]
    st.pace = PACES[i % PACES.length]
    st.started = st.enrollments.map((e) => e.started).sort()[0]
    st.contact = { student_email: null }
  })
  students.s001.school = 'Lincoln Middle'
  students.s001.pace = 'steady'
  students.s001.next_step = 'Start Tue with parallelograms (she asked about slanted ones)'
  students.s014.next_step = 'Wed: two-step equations with fractions'
  students.s109.next_step = 'Call home, then restart “One triangle” with a drawing'
  students.s001.learning_profile = {
    explains_with: ['examples', 'pictures'],
    unstuck_by: ['a concrete picture (two triangles side by side)', 'a pick-one question'],
    pace: 'steady', texts_to_ready_avg: 3.5,
    misconceptions_fixed: [{ quote_before: 'for a right triangle you just times the two sides', quote_after: 'a right triangle is still half a rectangle so its 10×5÷2 = 25', mission: 'Area of a triangle', date: dateIn(-1) }],
    strengths: ['Explains with her own numbers before the rule', 'Fixes a mistake as soon as Pip asks why'],
    watch_for: ['Puts commas where she would pause when she writes fast'],
    updated_at: dateIn(-1),
  }
  students.s001.learning_map = {
    nodes: [
      { concept_id: 'rect_rows', mission: 'Rectangles warm-up', subject: 'math', label: 'Area counts unit squares in rows', level: 3, explain_level: 3, evidence_quote: 'a rectangle is rows of squares so you times them' },
      { concept_id: 'k2', mission: 'Area of a triangle', subject: 'math', label: 'A rectangle’s area is base × height', level: 2, explain_level: 0, evidence_quote: null, given: true },
      { concept_id: 'k1', mission: 'Area of a triangle', subject: 'math', label: 'Two copies of a triangle make a rectangle', level: 3, explain_level: 3, evidence_quote: 'because 2 triangles make a rectangle' },
      { concept_id: 'k3', mission: 'Area of a triangle', subject: 'math', label: 'So a triangle is half of base × height', level: 3, explain_level: 3, evidence_quote: 'no a right triangle is still half a rectangle so its 10×5÷2 = 25' },
      { concept_id: 'para', mission: 'Next: parallelograms', subject: 'math', label: 'A slanted parallelogram is still base × height', level: 0, explain_level: 0, evidence_quote: null },
      { concept_id: 'c1', mission: 'Commas and run-ons', subject: 'writing', label: 'Two full sentences can’t be joined by a comma', level: 1, explain_level: 1, evidence_quote: 'you put a comma wherever you’d take a breath' },
      { concept_id: 'c3', mission: 'Commas and run-ons', subject: 'writing', label: 'Commas still go in lists and after intros', level: 2, explain_level: 2, evidence_quote: 'commas go between the things in a list' },
      { concept_id: 'c2', mission: 'Commas and run-ons', subject: 'writing', label: 'Fix a run-on with a period, semicolon or “and”', level: 0, explain_level: 0, evidence_quote: null },
    ],
    edges: [
      { from: 'k2', to: 'rect_rows', kind: 'builds_on' },
      { from: 'k1', to: 'k2', kind: 'builds_on' },
      { from: 'k3', to: 'k1', kind: 'builds_on' },
      { from: 'k3', to: 'k2', kind: 'builds_on' },
      { from: 'para', to: 'k3', kind: 'builds_on' },
      { from: 'c2', to: 'c1', kind: 'builds_on' },
    ],
  }
  return {
    students,
    enrollments,
    guardians: GUARDIANS.map((g) => ({ ...g })),
    notes: [
      { id: 'n1', student_id: 's001', tutor_id: 't1', subject: 'math', text: 'Explained the half-rectangle rule in her own words, then fixed the right-triangle mistake herself. Starting Tuesday with parallelograms.', ts: ago(1, 2), share_with_parent: true },
      { id: 'n2', student_id: 's001', tutor_id: 't1', subject: 'math', text: 'Rushes the last step when she’s tired. Keep her in the 4:30 slot, not 6.', ts: ago(6), share_with_parent: false },
      { id: 'n3', student_id: 's001', tutor_id: 't2', subject: 'writing', text: 'Reads her sentences out loud to find run-ons. Keep encouraging that.', ts: ago(3, 1), share_with_parent: true },
      { id: 'n4', student_id: 's014', tutor_id: 't3', subject: 'sat_math', text: 'Theo checks his answers by plugging x back in without being asked.', ts: ago(2), share_with_parent: true },
      { id: 'n5', student_id: 's109', tutor_id: 't1', subject: 'math', text: 'Missed two sessions. Call home before the package runs out.', ts: ago(4), share_with_parent: false },
    ],
    threads: [
      { id: 'm1', student_id: 's001', guardian_id: 'g001', from: 'tutor', author_id: 't1', text: 'Hi Ana, today Maya taught Pip why a triangle is half a rectangle, in her own words. She also fixed a mistake on her own.', kind: 'update', ts: ago(1, 3), status: 'test-mode (not delivered)' },
      { id: 'm2', student_id: 's001', guardian_id: 'g001', from: 'guardian', author_id: 'g001', text: 'Love this! She explained it to us at dinner. What can we practice at home?', ts: ago(0, 20), status: 'received' },
      { id: 'm3', student_id: 's001', guardian_id: 'g001', from: 'tutor', author_id: 't1', text: 'Ask her how big a 10 by 5 triangle is, and why. If she says 25 and explains it, she has it.', ts: ago(0, 19), status: 'test-mode (not delivered)' },
      { id: 'm4', student_id: 's001', guardian_id: 'g002', from: 'center', author_id: 'center', text: 'Weekly update from Bright Path: Maya taught Pip 3 ideas about triangle area and fixed one mistake on her own. Next session: Tue 4:30pm with Ms. Rivera.', ts: ago(2), status: 'test-mode (not delivered)' },
      { id: 'm5', student_id: 's014', guardian_id: 'g001', from: 'tutor', author_id: 't3', text: 'Hi Ana, Theo explained why you do the same thing to both sides of an equation. He is on track for his SAT goal.', kind: 'update', ts: ago(3), status: 'test-mode (not delivered)' },
    ],
    sent: [],
    drafts: [
      draftFor('dr1', 's001', 't1', 'sess_maya_saved', 'math', 'Area of a triangle', MAYA_MOMENTS, { text: 'because 2 triangles make a rectangle', msg_index: 3, source: 'auto' }, 'Ana R.'),
      draftFor('dr2', 's084', 't1', 'sess_chloe', 'math', 'Area of a triangle', CHLOE_MOMENTS, null, 'Linh N.'),
    ],
    reports: [
      { id: 'rp1', student_id: 's001', guardian_ids: ['g001', 'g002'], from: { tutor_id: 't1', name: 'Ms. Rivera' }, ts: lastWeekday(2), subject: 'math',
        text: 'Maya taught Pip why a triangle’s area is half a rectangle, and fixed a mistake on her own. Next class we start parallelograms.',
        quote: 'because 2 triangles make a rectangle', fixed: { before: 'for a right triangle you just times the two sides', after: 'a right triangle is still half a rectangle' }, goal: null },
      { id: 'rp2', student_id: 's014', guardian_ids: ['g001'], from: { tutor_id: 't3', name: 'Ms. Okafor' }, ts: lastWeekday(3), subject: 'sat_math',
        text: 'Theo is working toward his SAT Math goal. He explained how to solve equations step by step.', quote: null, fixed: null, goal: { target: 650, latest: 590, label: 'SAT Math practice score' } },
    ],
    settings: {},
  }
}

// Most recent date that fell on the given weekday (0 = Sun … 6 = Sat), at 6pm.
function lastWeekday(dow) {
  const t = new Date()
  t.setHours(18, 0, 0, 0)
  const back = (t.getDay() - dow + 7) % 7 || 7
  return new Date(t.getTime() - back * DAY).toISOString()
}

const MAYA_MOMENTS = [
  [1, 'no its half of that', false],
  [3, 'because 2 triangles make a rectangle', false],
  [5, 'so 6×4÷2 = 12', false],
  [10, 'no a right triangle is still half a rectangle so its 10×5÷2 = 25', true],
]
const CHLOE_MOMENTS = [
  [1, 'idk its just half', false],
  [3, 'oh so the triangle is literally half the box', true],
  [5, 'two of them make the rectangle so you divide by 2', false],
]

function draftText(kid, tutor, topic, quote) {
  return `Hi, it’s ${tutor} from Bright Path. This week ${kid} worked on ${topic.toLowerCase()} by teaching Pip, our practice buddy.` +
    (quote ? ` In ${kid}’s own words: “${quote}”.` : '') + ' See you at the next class.'
}

// v3.15 Draft (proposed for B18): a tutor-approved parent update waiting in the "To send" queue.
function draftFor(id, sid, tid, session_id, subject, topic, moments, quote, gname) {
  const kid = (SPEC.find((x) => x[0] === sid)?.[1] ?? 'Your child').split(' ')[0]
  const tutor = tutorRef(tid).name
  const gids = SPEC.find((x) => x[0] === sid)?.[4] ?? []
  return {
    id, student_id: sid, tutor_id: tid, session_id, subject, topic, kind: 'report', status: 'draft', created_at: iso(Date.now() - 2 * HOUR),
    quote: quote ? { ...quote, session_id, shared: false } : null,
    fixed: sid === 's001' ? { before: 'for a right triangle you just times the two sides', after: 'a right triangle is still half a rectangle' } : null,
    moments: moments.map(([msg_index, text, shared]) => ({ session_id, msg_index, text, shared })),
    by_guardian: gids.map((gid) => ({ guardian_id: gid, name: gid === 'g002' ? 'Sam R.' : gname, via: gid === 'g002' ? 'email' : 'sms', message: draftText(kid, tutor, topic, quote?.text) })),
  }
}

let db = null
const DB = () => (db ??= buildDb())
export function resetMock() {
  db = null
}

const guardianOf = (gid) => DB().guardians.find((g) => g.id === gid)
const isReachable = (g) => !!(g && (g.phone || g.email))

function rowFor(s) {
  const flags = []
  if (AT_RISK[s.id]) flags.push('at_risk')
  const lu = LAST_UPDATE_DAYS[s.id]
  if (lu == null || lu > 14) flags.push('needs_update')
  const gs = s.guardian_ids.map(guardianOf).filter(Boolean)
  if (!gs.some(isReachable)) flags.push('no_contact')
  if (s.enrollments.some((e) => (Date.now() - new Date(e.started).getTime()) / DAY <= 14)) flags.push('new')
  const subjects = s._spec.map(([subject, , , , , last, ko]) => ({
    subject,
    last_active: last == null ? null : ago(last, 3),
    ko_count: ko,
    flag: last != null && last > 14 ? 'quiet' : null,
  }))
  return {
    student: publicStudent(s),
    subjects,
    guardians: gs.map((g) => ({ id: g.id, name: g.name, reachable: isReachable(g) })),
    flags,
    next_slot: s.enrollments[0]?.slot ?? null,
    pace: s.pace,
    school: s.school,
    next_step: s.next_step ?? null,
  }
}

function publicStudent(s) {
  // eslint-disable-next-line no-unused-vars
  const { _spec, ...rest } = s
  return rest
}

function progressFor(s) {
  return s._spec.map(([subject, tutor_id, slot, , , last, ko, levels]) => {
    const concepts = CONCEPTS[subject] ?? []
    let open = null
    if (s.id === 's001' && subject === 'writing') open = { quote: 'you put a comma wherever you’d take a breath', mission: 'Commas and run-ons' }
    else if (s.id === 's109') open = { quote: 'the triangle is just base times height, it’s the same box', mission: 'Area of a triangle' }
    else if (levels.includes(0) && concepts.length) open = { quote: subject === 'math' ? 'you just times the two sides' : subject === 'sat_math' ? 'you move the number and it stays the same sign' : 'a comma is where you pause', mission: MISSION[subject] }
    return {
      subject,
      tutor: tutorRef(tutor_id),
      missions_done: Math.max(ko, levels.length ? 1 : 0),
      ko_count: ko,
      last_session_at: last == null ? null : ago(last, 3),
      next_slot: slot,
      mastery: concepts.map(([concept_id, text], i) => ({ concept_id, text, level: levels[i] ?? 0 })),
      open_misconception: open,
      at_risk: AT_RISK[s.id] && s._spec[0][0] === subject ? { student_id: s.id, name: s.name, reasons: AT_RISK[s.id] } : null,
    }
  })
}

function timelineFor(s) {
  const d = DB()
  if (s.id === 's001') {
    return [
      { ts: ago(0, 19), kind: 'message', subject: 'math', text: 'Ms. Rivera replied to Ana R. with a practice question for home.', link: null },
      { ts: ago(0, 20), kind: 'message', subject: 'math', text: 'Ana R. replied: “¡Qué bien! Me lo explicó en la cena.”', link: null },
      { ts: ago(1, 2), kind: 'update', subject: 'math', text: 'Parent update sent to Ana R. (Spanish, text) · test mode', link: null },
      { ts: ago(1, 2), kind: 'note', subject: 'math', text: 'Ms. Rivera shared a note with the family.', link: null },
      { ts: ago(1, 3), kind: 'ko', subject: 'math', text: 'K.O. on Area of a triangle. Fixed “for a right triangle you just times the two sides” after 1 re-teach.', link: '/tutor/report/sess_maya_saved' },
      { ts: ago(1, 4), kind: 'session', subject: 'math', text: 'Taught Pip for 14 minutes: “because 2 triangles make a rectangle”.', link: '/tutor/report/sess_maya_saved' },
      { ts: ago(3, 1), kind: 'session', subject: 'writing', text: 'Commas and run-ons: 12 minutes, stopped at step 2.', link: null },
      { ts: ago(8), kind: 'ko', subject: 'math', text: 'K.O. on Rectangles warm-up.', link: null },
    ]
  }
  const out = []
  s._spec.forEach(([subject, , , , , last, ko]) => {
    if (last != null) out.push({ ts: ago(last, 3), kind: ko ? 'ko' : 'session', subject, text: ko ? `Finished ${MISSION[subject] ?? 'a lesson'} with Pip.` : `Practiced ${MISSION[subject] ?? 'with Pip'}.`, link: null })
  })
  d.notes.filter((n) => n.student_id === s.id).forEach((n) => out.push({ ts: n.ts, kind: 'note', subject: n.subject, text: n.share_with_parent ? 'Note shared with the family.' : 'Private note added.', link: null }))
  const lu = LAST_UPDATE_DAYS[s.id]
  if (lu != null) out.push({ ts: ago(lu), kind: 'update', subject: s._spec[0][0], text: 'Parent update sent · test mode', link: null })
  return out.sort((a, b) => (a.ts < b.ts ? 1 : -1))
}

function quietNow(g) {
  if (!g?.quiet_hours) return false
  const [a, b] = g.quiet_hours.split('-').map((x) => Number(x.split(':')[0]))
  const h = new Date().getHours()
  return a > b ? h >= a || h < b : h >= a && h < b
}

function overview() {
  const d = DB()
  const all = Object.values(d.students)
  const renewals = []
  for (const s of all) {
    for (const e of s.enrollments) {
      const days = (new Date(e.package.renews_on).getTime() - Date.now()) / DAY
      const left = e.package.hours_total - e.package.hours_used
      if (days <= 14 || left <= 2) {
        const last = s._spec.find((x) => x[0] === e.subject)?.[5]
        const engaged = last != null && last <= 7
        const g = s.guardian_ids.map(guardianOf).find(isReachable) ?? guardianOf(s.guardian_ids[0])
        renewals.push({
          student: { id: s.id, name: s.name }, guardian: { id: g.id, name: g.name, language: g.language, prefers: g.prefers },
          subject: e.subject, hours_left: left, renews_on: e.package.renews_on, price_usd: e.package.price_usd,
          signal: engaged ? 'engaged' : 'quiet', at_risk: !!AT_RISK[s.id],
        })
      }
    }
  }
  renewals.sort((a, b) => (a.renews_on < b.renews_on ? -1 : 1))
  const revenue = renewals.filter((r) => r.signal === 'quiet' || r.at_risk).reduce((t, r) => t + r.price_usd, 0)
  const parent_updates_7d = 41
  const gap_reports_7d = 38
  return {
    by_subject: [
      { subject: 'math', students: 64, tutors: 6, kos_7d: 23 },
      { subject: 'writing', students: 28, tutors: 3, kos_7d: 9 },
      { subject: 'sat_math', students: 22, tutors: 3, kos_7d: 6 },
      { subject: 'sat_rw', students: 18, tutors: 2, kos_7d: 4 },
      { subject: 'science', students: 12, tutors: 2, kos_7d: 0 },
    ],
    by_tutor: [
      { tutor: tutorRef('t1'), students: 12, subjects: ['math', 'sat_rw', 'sat_math'], needs_update: 5 },
      { tutor: tutorRef('t2'), students: 13, subjects: ['writing', 'sat_rw'], needs_update: 2 },
      { tutor: tutorRef('t3'), students: 18, subjects: ['sat_math', 'math'], needs_update: 3 },
      { tutor: tutorRef('t4'), students: 14, subjects: ['science', 'math'], needs_update: 1 },
      { tutor: tutorRef('t5'), students: 17, subjects: ['sat_math'], needs_update: 4 },
      { tutor: tutorRef('t6'), students: 16, subjects: ['math'], needs_update: 0 },
      { tutor: tutorRef('t7'), students: 15, subjects: ['science', 'math'], needs_update: 2 },
      { tutor: tutorRef('t8'), students: 15, subjects: ['writing'], needs_update: 1 },
    ],
    parents_reachable_pct: 92,
    updates_sent_7d: parent_updates_7d,
    renewals_due: renewals,
    revenue_at_risk_usd: revenue,
    retention_30d_pct: 94,
    parent_updates_7d,
    parent_replies_7d: 17,
    gap_reports_7d,
    tutor_hours_saved_week: Math.round(((parent_updates_7d + gap_reports_7d) * 10) / 6) / 10,
    came_back_on_their_own_7d: 9,
    label: 'mock data',
  }
}

const THIS_WEEK = {
  s001: { minutes: 34, missions: 2, kos: 1, taught_quote: 'because 2 triangles make a rectangle', fixed: { before: 'for a right triangle you just times the two sides', after: 'a right triangle is still half a rectangle so its 10×5÷2 = 25' } },
  s014: { minutes: 22, missions: 1, kos: 1, taught_quote: 'whatever you do to one side you do to the other so it stays balanced', fixed: null },
}
const WEEKS = {
  en: {
    s001: [
      { week_of: dateIn(-5), summary: 'Maya taught Pip 3 ideas about triangle area and fixed one mistake on her own.', quotes: ['because 2 triangles make a rectangle'], fixed: [{ before: 'for a right triangle you just times the two sides', after: 'a right triangle is still half a rectangle' }] },
      { week_of: dateIn(-12), summary: 'Maya reviewed rectangle area and explained why it’s base times height.', quotes: ['a rectangle is rows of squares so you times them'], fixed: [] },
    ],
  },
}

const UPDATE_TEXT = {
  en: (kid, tutor) => `Hi, it’s ${tutor} from Bright Path. This week ${kid} taught Pip why a triangle’s area is half a rectangle, in her own words: “because 2 triangles make a rectangle”. She also fixed a mistake on her own. Next session: Tue 4:30pm.`,
}

const DRAFT = (student_id, grade, topic) => ({
  id: null, student_id, tutor_id: 't1', grade, topic, subject: 'math',
  why_it_matters: 'You need this for areas of every polygon next unit.',
  concepts: CONCEPTS.math.map(([id, text], i) => ({ id, text, weapon: ['Twin Triangle Mirror 🪞', 'Rectangle Ruler 📏', 'Half-Slice Blade 🔪'][i] })),
  misconception: 'Area of a triangle is base times height.',
  root_prerequisite: 'Area of a rectangle',
  boss: { name: 'Duke Doublecount', emoji: '🦚', backstory: 'Counts every triangle twice and calls it a rectangle.' },
  cliffhanger: 'I heard a parallelogram is base × height too. Even the slanted ones?',
  quiz: [], created_at: null, mock: true,
})

class MockMiss extends Error {}

// Returns the mock response for a request, or throws MockMiss when there is no fixture.
export function mockRequest(method, path, body = {}) {
  const d = DB()
  const [p, qs] = path.split('?')
  const q = new URLSearchParams(qs ?? '')
  let m
  const notFound = (what) => {
    const e = new Error(`${what} not found`)
    e.status = 404
    e.mockDetail = true
    throw e
  }

  if (method === 'GET' && p === '/subjects') return { subjects: SUBJECTS }
  if (method === 'GET' && p === '/tutors') {
    return {
      tutors: TUTORS.map((t) => {
        const mine = Object.values(d.students).filter((s) => s.enrollments.some((e) => e.tutor_id === t.id))
        const subs = [...new Set(mine.flatMap((s) => s.enrollments.filter((e) => e.tutor_id === t.id).map((e) => e.subject)))]
        return { ...t, subjects: subs, students: mine.length, at_risk: mine.filter((s) => AT_RISK[s.id]).length }
      }),
    }
  }
  if (method === 'GET' && (m = /^\/tutors\/([^/]+)\/students$/.exec(p))) {
    const tid = m[1]
    let rows = Object.values(d.students).filter((s) => s.enrollments.some((e) => e.tutor_id === tid)).map(rowFor)
    rows = rows.map((r) => ({ ...r, next_slot: d.students[r.student.id].enrollments.find((e) => e.tutor_id === tid)?.slot ?? r.next_slot }))
    const subject = q.get('subject')
    const qq = (q.get('q') ?? '').toLowerCase()
    const filter = q.get('filter')
    if (subject) rows = rows.filter((r) => r.student.enrollments.some((e) => e.subject === subject))
    if (qq) rows = rows.filter((r) => r.student.name.toLowerCase().includes(qq))
    if (filter) rows = rows.filter((r) => r.flags.includes(filter))
    return { tutor: tutorRef(tid), rows }
  }
  if (method === 'GET' && (m = /^\/students\/([^/]+)\/profile$/.exec(p))) {
    const s = d.students[m[1]] ?? notFound('Student')
    return {
      student: publicStudent(s),
      enrollments: s.enrollments,
      progress: progressFor(s),
      guardians: s.guardian_ids.map(guardianOf).filter(Boolean),
      notes: d.notes.filter((n) => n.student_id === s.id).sort((a, b) => (a.ts < b.ts ? 1 : -1)),
      timeline: timelineFor(s),
      flags: rowFor(s).flags,
      learning_profile: s.learning_profile ?? null,
      learning_map: s.learning_map ?? null,
    }
  }
  if (method === 'POST' && (m = /^\/students\/([^/]+)\/notes$/.exec(p))) {
    const n = { id: `n${Date.now()}`, student_id: m[1], ts: iso(Date.now()), ...body }
    d.notes.unshift(n)
    return n
  }
  if (method === 'POST' && (m = /^\/students\/([^/]+)\/enrollments$/.exec(p))) {
    const s = d.students[m[1]] ?? notFound('Student')
    const e = { id: `e${Date.now()}`, student_id: s.id, started: dateIn(0), package: { hours_total: 12, hours_used: 0, price_usd: 480, renews_on: dateIn(84), status: 'active' }, ...body }
    s.enrollments.push(e)
    return e
  }
  if (method === 'POST' && p === '/assignments/bulk') {
    const ids = body.student_ids ?? []
    return { assignments: ids.map((sid, i) => ({ ...body.assignment, id: `a_bulk_${Date.now()}_${i}`, student_id: sid, mock: true })) }
  }
  if (method === 'POST' && p === '/assignments/draft') return DRAFT(body.student_id, body.grade, body.topic)
  if (method === 'POST' && p === '/guardians') {
    const g = { id: `g${Date.now()}`, student_ids: [], ...body }
    d.guardians.push(g)
    for (const sid of g.student_ids) d.students[sid]?.guardian_ids.push(g.id)
    return g
  }
  if (method === 'PATCH' && (m = /^\/guardians\/([^/]+)$/.exec(p))) {
    const g = guardianOf(m[1]) ?? notFound('Guardian')
    Object.assign(g, body)
    return { ...g }
  }
  if (method === 'GET' && p === '/threads') {
    const sid = q.get('student_id')
    const gid = q.get('guardian_id')
    return { items: d.threads.filter((t) => (!sid || t.student_id === sid) && (!gid || t.guardian_id === gid)).sort((a, b) => (a.ts < b.ts ? -1 : 1)) }
  }
  if (method === 'POST' && p === '/threads') {
    const g = guardianOf(body.guardian_id)
    const status = body.from === 'guardian' ? 'received' : quietNow(g) ? 'queued (quiet hours)' : 'test-mode (not delivered)'
    const t = { id: `m${Date.now()}`, ts: iso(Date.now()), status, ...body }
    d.threads.push(t)
    return t
  }
  if (method === 'GET' && p === '/center/overview') return overview()
  if (method === 'GET' && (m = /^\/parent\/([^/]+)\/home$/.exec(p))) {
    const g = guardianOf(m[1]) ?? notFound('Guardian')
    return {
      guardian: g,
      kids: g.student_ids.map((sid) => d.students[sid]).filter(Boolean).map((s) => {
        const shared = d.notes.filter((n) => n.student_id === s.id && n.share_with_parent).sort((a, b) => (a.ts < b.ts ? 1 : -1))[0] ?? null
        return {
          student: { id: s.id, name: s.name, grade: s.grade },
          pip: s.pip,
          this_week: { profile_line: s.id === 's001' ? { text: 'Maya explains best with examples and pictures; she fixed 1 mistake this week.', from: tutorRef('t1') } : null, sessions: THIS_WEEK[s.id]?.missions ?? 0, kos: THIS_WEEK[s.id]?.kos ?? 0, shared_note: shared ? { ...shared, from: tutorRef(shared.tutor_id) } : null, from: null },
          reports: d.reports.filter((r) => r.student_id === s.id && r.guardian_ids.includes(g.id)).sort((a, b) => (a.ts < b.ts ? 1 : -1)),
          subjects: s.enrollments.map((e) => ({
            subject: e.subject, tutor: tutorRef(e.tutor_id), next_slot: e.slot,
            package: { hours_left: e.package.hours_total - e.package.hours_used, hours_total: e.package.hours_total, renews_on: e.package.renews_on, status: e.package.status },
          })),
        }
      }),
      unread: d.threads.filter((t) => t.guardian_id === g.id && t.from !== 'guardian' && t.ts > ago(1)).length,
    }
  }
  if (method === 'GET' && (m = /^\/parent\/([^/]+)\/kids\/([^/]+)$/.exec(p))) {
    const g = guardianOf(m[1]) ?? notFound('Guardian')
    if (!g.student_ids.includes(m[2])) {
      const e = new Error('Not your child')
      e.status = 403
      e.mockDetail = true
      throw e
    }
    const s = d.students[m[2]]
    return {
      student: { id: s.id, name: s.name, grade: s.grade },
      weeks: WEEKS.en[s.id] ?? [],
      shared_notes: d.notes.filter((n) => n.student_id === s.id && n.share_with_parent),
      next_sessions: s.enrollments.map((e) => ({ subject: e.subject, slot: e.slot, tutor: tutorRef(e.tutor_id) })),
      tutors: s.enrollments.map((e) => ({ ...tutorRef(e.tutor_id), subject: e.subject })),
    }
  }
  if (method === 'POST' && (m = /^\/sessions\/([^/]+)\/parent-update\/preview$/.exec(p))) {
    const sid = body.student_id ?? 's001'
    const s = d.students[sid] ?? d.students.s001
    const tutor = tutorRef(s.tutor_id).name
    const kid = s.name.split(' ')[0]
    const messages = s.guardian_ids.map(guardianOf).filter((g) => g && g.updates !== 'off').map((g) => ({
      guardian_id: g.id, name: g.name, language: g.language, prefers: g.prefers, reachable: isReachable(g),
      message: UPDATE_TEXT.en(kid, tutor),
    }))
    return { message: UPDATE_TEXT.en(kid, tutor), by_guardian: messages.map((m) => ({ ...m, via: m.prefers })), skipped: [] }
  }
  if (method === 'POST' && (m = /^\/sessions\/([^/]+)\/parent-update\/send$/.exec(p))) {
    const list = body.messages ? Object.entries(body.messages).map(([guardian_id, message]) => ({ guardian_id, message })) : [{ guardian_id: null, message: body.message }]
    const sent = list.map((x) => {
      const g = guardianOf(x.guardian_id)
      return { id: `sl${Date.now()}${x.guardian_id}`, student_id: body.student_id ?? 's001', to: g ? (g.prefers === 'sms' ? g.phone : g.email) ?? g.name : 'parent', guardian_id: x.guardian_id, message: x.message, status: quietNow(g) ? 'queued (quiet hours)' : 'test-mode (not delivered)', ts: iso(Date.now()) }
    })
    d.sent.push(...sent)
    return { sent: sent[0], sent_all: sent }
  }
  // ---- v3.15 (proposed B18 shapes) ----
  if (method === 'GET' && (m = /^\/students\/([^/]+)\/drafts$/.exec(p))) {
    return { items: d.drafts.filter((x) => x.student_id === m[1] && x.status === 'draft') }
  }
  if (method === 'POST' && (m = /^\/students\/([^/]+)\/drafts$/.exec(p))) {
    const st = d.students[m[1]] ?? notFound('Student')
    const nd = draftFor(`dr${Date.now()}`, st.id, st.tutor_id, body.session_id ?? null, st.enrollments[0].subject, MISSION[st.enrollments[0].subject] ?? 'this week’s lesson', [], null, guardianOf(st.guardian_ids[0])?.name ?? 'Guardian')
    d.drafts.unshift(nd)
    return nd
  }
  if (method === 'PATCH' && (m = /^\/drafts\/([^/]+)$/.exec(p))) {
    const dr = d.drafts.find((x) => x.id === m[1]) ?? notFound('Draft')
    if ('quote' in body) {
      const mo = body.quote ? dr.moments.find((x) => x.msg_index === body.quote.msg_index) : null
      dr.quote = mo ? { text: mo.text, msg_index: mo.msg_index, session_id: mo.session_id, shared: mo.shared, source: mo.shared ? 'student' : 'tutor' } : null
      const st = d.students[dr.student_id]
      dr.by_guardian = dr.by_guardian.map((x) => ({ ...x, message: draftText(st.name.split(' ')[0], tutorRef(dr.tutor_id).name, dr.topic, dr.quote?.text) }))
    }
    if (body.by_guardian) dr.by_guardian = dr.by_guardian.map((x) => ({ ...x, ...(body.by_guardian.find((y) => y.guardian_id === x.guardian_id) ?? {}) }))
    return { ...dr }
  }
  if (method === 'POST' && (m = /^\/drafts\/([^/]+)\/send$/.exec(p))) {
    const dr = d.drafts.find((x) => x.id === m[1]) ?? notFound('Draft')
    const msgs = dr.by_guardian.map((x) => ({ ...x, ...(body.by_guardian?.find((y) => y.guardian_id === x.guardian_id) ?? {}) }))
    dr.status = 'sent'
    const ts = iso(Date.now())
    const sent_all = msgs.map((x) => {
      const g = guardianOf(x.guardian_id)
      const status = quietNow(g) ? 'queued (quiet hours)' : 'test-mode (not delivered)'
      d.threads.push({ id: `m${Date.now()}${x.guardian_id}`, student_id: dr.student_id, guardian_id: x.guardian_id, from: 'tutor', author_id: dr.tutor_id, text: x.message, ts, status, kind: 'update' })
      return { guardian_id: x.guardian_id, to: g?.phone ?? g?.email ?? x.name, message: x.message, status, ts }
    })
    d.reports.push({ id: `rp${Date.now()}`, student_id: dr.student_id, guardian_ids: msgs.map((x) => x.guardian_id), from: tutorRef(dr.tutor_id), ts, subject: dr.subject, text: msgs[0]?.message ?? '', quote: dr.quote?.text ?? null, fixed: dr.fixed, goal: null })
    return { sent_all, draft: { ...dr } }
  }
  if (method === 'POST' && (m = /^\/drafts\/([^/]+)\/skip$/.exec(p))) {
    const dr = d.drafts.find((x) => x.id === m[1]) ?? notFound('Draft')
    dr.status = 'skipped'
    return { ok: true }
  }
  if (method === 'PATCH' && (m = /^\/students\/([^/]+)\/settings$/.exec(p))) {
    const st = d.students[m[1]] ?? notFound('Student')
    if ('auto_ko_note' in body) {
      if (st.grade > 6) {
        const e = new Error('auto_ko_note is only for grade 6 and under')
        e.status = 422
        throw e
      }
      st.auto_ko_note = !!body.auto_ko_note
    }
    return { student: publicStudent(st) }
  }
  throw new MockMiss(`${method} ${p}`)
}

export const isMockMiss = (e) => e instanceof MockMiss
