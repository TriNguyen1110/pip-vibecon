// V4 phase 4: every showcase mission plays from home to K.O. offline, through the real UI, using the lesson's own
// offline_demo student lines (backend/seed/lessons/<id>.json). Checks per run: ready before the quiz, the deliberate
// wrong rule makes Pip miss, the re-teach fixes it, K.O., the Unlocked beat lists what the payoff returned, no page
// scroll at 390, and (TUNE-3) Pip never asks a "why" question about a concept tagged explain_level given or use.
// Run: PLAYWRIGHT_MODULE=... CHROME_PATH=... AXE_PATH=... BASE_URL=http://localhost:5791 node tests/e2e/showcase.spec.mjs
import fs from 'node:fs'
import { BASE, VIEWPORTS, api, finish, hygiene, openRun, sleep } from './lib/harness.mjs'
import { normQ, questionOf } from './lib/personas.mjs'

const LESSONS = new URL('../../backend/seed/lessons/', import.meta.url)
const CASES = (process.env.SHOWCASES || 's001:a_tri,s014:a_trig,s014:a_trig_id,s043:a_sat_modifiers').split(',').map((x) => {
  const [sid, aid] = x.split(':')
  return { sid, aid, lesson: JSON.parse(fs.readFileSync(new URL(`${aid}.json`, LESSONS))) }
})
const WHY_RE = /\bwhy\b|how come|what makes|how do you know|can you explain|what do you mean/i
const getSession = async (sid) => (await api(`/sessions/${sid}`)).json

async function sendText(H, sid, text) {
  const respP = H.page.waitForResponse((r) => r.url().includes(`/sessions/${sid}/turn`) && r.request().method() === 'POST', { timeout: 30000 })
  respP.catch(() => {})
  await H.P.getByRole('textbox', { name: 'Message to Pip' }).fill(text, { timeout: 10000 })
  await H.P.getByRole('button', { name: 'Send to Pip' }).click()
  const js = await (await respP).json().catch(() => ({}))
  await sleep(600)
  return js
}
async function toMissPage(H) {
  const fix = H.P.locator('.qitem__fix').first()
  for (let i = 0; i < 5; i++) {
    const vis = await fix.evaluate((el) => {
      const r = el.getBoundingClientRect()
      return r.left >= 0 && r.right <= window.innerWidth + 1 && r.width > 0
    }).catch(() => false)
    if (vis) break
    const next = H.P.locator('.exam-next:not(.exam-next--spacer)')
    if (!(await next.count())) break
    await next.click()
    await sleep(500)
  }
  return fix
}
// The concept Pip's next question is about: the re-teach concept, else the first ladder concept not done and not given.
function targetOf(s, lesson) {
  if (s.reteach_concept) return s.reteach_concept
  const order = lesson.concepts.map((c) => c.concept_id)
  return order.find((k) => !(s.ladder?.[k]?.done) && lesson.concepts.find((c) => c.concept_id === k)?.explain_level !== 'given') ?? null
}

async function runCase(H, c) {
  const { vp } = H
  const tag = `${c.sid}/${c.aid}`
  const level = Object.fromEntries(c.lesson.concepts.map((k) => [k.concept_id, k.explain_level]))
  const turns = c.lesson.offline_demo.turns
  const teach = turns.filter((t) => !t.reteach_concept_id && t.phase !== 'reteach')
  const reteach = turns.find((t) => t.reteach_concept_id || t.phase === 'reteach')
  const qlog = []
  const fits = []
  let sid
  let readyAt = null
  let quiz
  const fitHere = async (l) => vp.mobile && fits.push([l, (await H.fit(`${c.aid}-${l}`)).ok])

  await H.step(`${tag}: home -> mission (pinned or Missions sheet)`, async () => {
    await api('/demo/reset', 'POST')
    await H.page.goto(`${BASE}/student${c.sid === 's001' ? '' : `?as=${c.sid}`}`)
    await H.inApp()
    await H.P.evaluate((s) => {
      localStorage.setItem(`pip.styleDone.${s}`, 'true')
      localStorage.setItem(`pip.named.${s}`, 'true')
    }, c.sid)
    await H.P.evaluate(() => location.reload())
    await H.P.locator('.home-current__topic').waitFor({ timeout: 20000 })
    const st = (await api(`/students/${c.sid}`)).json
    const a = st.assignments.find((x) => x.id === c.aid)
    const topic = (await H.P.locator('.home-current__topic').innerText()).trim()
    const pinned = topic.toLowerCase() === a.topic.toLowerCase()
    await H.shot(`${c.aid}-home`)
    await fitHere('home')
    if (pinned) await H.P.locator('.home-play').click()
    else {
      await H.P.getByRole('button', { name: 'Missions' }).click()
      await sleep(400)
      await H.P.getByRole('button', { name: `Play ${a.topic}` }).click()
    }
    await H.P.getByRole('dialog', { name: "Pick Pip's look" }).getByRole('button', { name: 'Start teaching' }).click()
    await H.P.waitForURL('**/student/mission/**', { timeout: 20000 })
    sid = H.P.url().split('?')[0].split('/').pop()
    await H.P.locator('.bossbar').waitFor({ timeout: 15000 })
    await sleep(800)
    const s = await getSession(sid)
    const open = s.transcript.filter((m) => m.from === 'pip').at(-1)?.text ?? ''
    qlog.push({ after: 'opening', q: questionOf(open), target: targetOf(s, c.lesson) })
    await fitHere('opening')
    return { pass: s.assignment_id === c.aid, via: pinned ? 'home' : 'missions sheet', boss: a.boss?.name }
  })

  await H.step(`${tag}: teach with the script's lines -> ready, wrong rule filed`, async () => {
    const log = []
    for (const t of teach) {
      const s = await sendText(H, sid, t.student)
      const pip = s.transcript.filter((m) => m.from === 'pip').at(-1)?.text ?? ''
      log.push({ kind: t.kind, hp: s.boss_hp, ready: s.ready_for_quiz, pip: pip.slice(0, 120) })
      qlog.push({ after: t.student.slice(0, 40), q: questionOf(pip), target: targetOf(s, c.lesson) })
      if (s.ready_for_quiz && readyAt == null && t.kind !== 'misconception') readyAt = log.length
      await fitHere(`text${log.length}`)
    }
    await H.shot(`${c.aid}-taught`)
    const s = await getSession(sid)
    const wrong = teach.find((t) => t.kind === 'misconception')
    const filed = !wrong || (s.brain ?? []).some((r) => r.correct === false) || s.transcript.some((m) => m.from === 'pip' && /Saving that/.test(m.text))
    return { pass: readyAt != null && s.ready_for_quiz && filed, readyAt, scriptReadyAt: teach.findIndex((t) => /quiz me/i.test(t.pip ?? '')) + 1 || null, filed, log }
  })

  await H.step(`${tag}: quiz -> the trap item misses`, async () => {
    const respP = H.page.waitForResponse((r) => r.url().includes(`/sessions/${sid}/quiz`), { timeout: 30000 })
    await H.P.locator('.quiz-btn').click()
    quiz = await (await respP).json()
    await H.P.locator('.exam-page--brain, .ko').first().waitFor({ timeout: 15000 })
    await sleep(800)
    await H.shot(`${c.aid}-quiz`)
    const want = c.lesson.offline_demo.quiz.map((q) => [q.concept_id, q.passed])
    const got = quiz.quiz.map((q) => [q.concept_id, q.passed])
    return { pass: JSON.stringify(want) === JSON.stringify(got), got, script: want }
  })

  await H.step(`${tag}: re-teach -> retry -> K.O.`, async () => {
    const rounds = []
    for (let i = 0; i < 2 && !quiz.ko; i++) {
      const fix = await toMissPage(H)
      if (!(await fix.count())) return { pass: false, note: 'a miss with no Re-teach button', rounds }
      await fix.click()
      await H.P.locator('.reteach-banner').waitFor({ timeout: 10000 })
      await fitHere(`reteach${i + 1}`)
      const s = await sendText(H, sid, reteach.student)
      qlog.push({ after: 'reteach', q: questionOf(s.transcript.filter((m) => m.from === 'pip').at(-1)?.text ?? ''), target: targetOf(s, c.lesson) })
      const rp = H.page.waitForResponse((r) => r.url().includes(`/sessions/${sid}/quiz`), { timeout: 30000 })
      await H.P.locator('.quiz-btn').click()
      quiz = await (await rp).json()
      rounds.push(quiz.quiz.map((q) => [q.concept_id, q.passed]))
      await H.P.locator('.exam-page--brain, .ko').first().waitFor({ timeout: 15000 })
      await sleep(600)
    }
    await H.shot(`${c.aid}-ko`)
    return { pass: quiz.ko === true && rounds.length === 1, ko: quiz.ko, rounds, brain: quiz.brain_version }
  })

  await H.step(`${tag}: K.O. card -> Unlocked beat lists the payoff`, async () => {
    if (!quiz.ko) return { pass: false, note: 'no K.O.' }
    const chips = H.P.locator('.ko__weapons .weapon')
    await chips.first().waitFor({ timeout: 8000 })
    await chips.first().click()
    for (let i = 0; i < 12 && !(await H.P.locator('.ko--card').count()); i++) {
      await sleep(900)
      if (!(await H.P.locator('.ko--card').count())) await H.P.locator('.ko').first().click().catch(() => {})
    }
    await H.P.locator('.ko--card').waitFor({ timeout: 8000 })
    await sleep(600)
    const front = await H.P.locator('.ko-card__front').innerText()
    await H.shot(`${c.aid}-ko-card`)
    await fitHere('ko-card')
    await H.P.locator('button.ko__next').click()
    await sleep(900)
    const beat = H.P.locator('.ko-beat--unlocked')
    const p = quiz.payoff ?? {}
    const has = (p.new_crew?.length ?? 0) + (p.unlocked?.length ?? 0) + (p.new_items?.length ?? 0) > 0
    const inView = await beat.evaluate((el) => {
      const r = el.getBoundingClientRect()
      return r.left >= -1 && r.right <= innerWidth + 1 && r.width > 0
    }).catch(() => false)
    const text = inView ? await beat.innerText() : ''
    await H.shot(`${c.aid}-unlocked`)
    await fitHere('unlocked')
    const crewOk = (p.new_crew ?? []).every((m) => text.includes(m.name))
    const strike = c.lesson.ko_strike ?? null
    return {
      pass: has ? inView && crewOk && /Unlocked/i.test(text) : !inView,
      payoff: { crew: p.new_crew?.map((m) => m.name), unlocked: p.unlocked, items: p.new_items },
      beatShown: inView,
      beatText: text.replace(/\s+/g, ' ').slice(0, 220),
      cardFront: front.replace(/\s+/g, ' ').slice(0, 120),
      koStrike: strike,
    }
  })

  await H.step(`${tag}: Pip asks no "why" on given/use concepts`, async () => {
    const bad = qlog.filter((x) => x.q && x.target && (level[x.target] === 'given' || (level[x.target] === 'use' && WHY_RE.test(x.q))))
    const asksGiven = qlog.filter((x) => x.q && x.target && level[x.target] === 'given')
    const dup = qlog.map((x) => x.q && normQ(x.q)).filter(Boolean).filter((q, i, a) => a.indexOf(q) !== i)
    return { pass: bad.length === 0, bad, asksGiven: asksGiven.length, repeats: dup, levels: level, questions: qlog.map((x) => `${x.target ?? '-'}(${level[x.target] ?? ''}): ${x.q || '(no question)'}`) }
  })

  if (vp.mobile) {
    await H.step(`${tag}: no page scroll at ${vp.w}`, async () => {
      const bad = fits.filter(([, ok]) => !ok).map(([l]) => l)
      return { pass: bad.length === 0, checked: fits.length, bad }
    })
  }
}

const runs = []
for (const vp of VIEWPORTS) {
  const H = await openRun('showcase', vp)
  try {
    for (const c of CASES) await runCase(H, c)
    await hygiene(H)
  } finally {
    runs.push(H.R)
    await H.close()
  }
}
finish('showcase', runs)
