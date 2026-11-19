import fs from 'node:fs'
// V4 student journey (replaces the legacy fractions journey in demo.spec.mjs).
// 1. Maya's triangle-area demo (DEMO_SCRIPT.md, CONTRACT v3.6): reset -> landing "Try as Maya" -> home -> pinned
//    triangle mission -> opening claim -> her 3 one-sentence texts (+ the deliberate wrong rule) -> ready_for_quiz ->
//    quiz -> the miss -> re-teach -> K.O. -> payoff (new crew / unlocks) -> cliffhanger.
// 2. Three SCR-1 personas from tests/fixtures/students/a_tri.json typed through the real UI, choosing each bank by
//    what Pip just said (port of eval_pip.classify_pip): tri_quick (competent), tri_idk (weak), tri_insult (sarcastic).
// 3. Student registers play / cool / focus (by grade and via the Look sheet switch) render without overflow.
// Run (see reports/verification/v4/REPORT.md for the exact env):
//   PLAYWRIGHT_MODULE=... CHROME_PATH=... AXE_PATH=... BASE_URL=http://localhost:5791 node tests/e2e/student.spec.mjs
import { BASE, VIEWPORTS, api, finish, hygiene, openRun, readFixture, sleep, notBuilt } from './lib/harness.mjs'
import { classifyPip, makeKid, normQ, questionOf } from './lib/personas.mjs'

const MSGS = ['no its half of that', 'because 2 triangles make a rectangle', 'so 6×4÷2 = 12', 'oh but for a right triangle you just times the two sides']
const MSG_RETEACH = 'no a right triangle is still half a rectangle so its 10×5÷2 = 25'
const WRONG_RULE = 'for a right triangle you just times the two sides'
// PACE-2: the owner's own triangle run (backend/eval_pip.py "owner_run"): ready by text 2-3, quiz passes k1/k2/k3.
const OWNER_RUN = [
  'no you need to divide it by 2',
  "because a triangle's area is half of the rectangle with the same base and height",
  'no it fills only half',
  'nothing',
  "yes that's why we divide it in half to get the triangle area",
  '2 triangles with the same base and height creates an area of a rectangle with that base and height',
]
// FIXTURE_PATH pins the persona cards to a given file (e.g. HEAD's copy while the tree has uncommitted edits).
const FIX = process.env.FIXTURE_PATH ? JSON.parse(fs.readFileSync(process.env.FIXTURE_PATH, 'utf8')) : readFixture('students/a_tri.json')
const PERSONAS = (process.env.PERSONAS || 'tri_quick:cool,tri_idk:play,tri_insult:focus').split(',').map((x) => {
  const [id, register] = x.split(':')
  return { card: FIX.personas.find((p) => p.id === id), register }
}).filter((p) => p.card) // PERSONAS=none skips them

// Student register on the shell root: data-register (play|cool|focus) since DES-Y2K-1; data-audience before it.
const registerOf = (P) =>
  P.evaluate(() => {
    const el = document.querySelector('[data-register="play"],[data-register="cool"],[data-register="focus"]')
    return el?.getAttribute('data-register') ?? document.querySelector('[data-audience]')?.getAttribute('data-audience') ?? null
  })
// ui_actions in the cards are probabilistic; the run follows the ones with p >= P_ACT (deterministic).
const P_ACT = Number(process.env.P_ACT ?? 0.75)
// Home primary: "Play" (pre AGE-2) or "Teach <pip name>" (AGE-2 drop card).
const PLAY_RE = /^(play|teach [a-z]+)$/i
// Exam/quiz screens are mid-restyle: their visual checks (fit, contrast) are reported as pending, not pass/fail.
const EXAM_VISUAL = /^quiz-|-quiz$/
const sessionIdOf = (P) => P.url().split('?')[0].split('/').pop()
const getSession = async (sid) => (await api(`/sessions/${sid}`)).json
const pipMsgs = (s) => s.transcript.filter((m) => m.from === 'pip')

// Type one text into the composer and send it; wait for the turn response and Pip's newest line on stage.
async function sendText(H, sid, text) {
  const { P, page } = H
  const respP = page.waitForResponse((r) => r.url().includes(`/sessions/${sid}/turn`) && r.request().method() === 'POST', { timeout: 30000 })
  respP.catch(() => {}) // if typing fails, the step reports that error instead of an unhandled rejection
  await P.getByRole('textbox', { name: 'Message to Pip' }).fill(text, { timeout: 10000 })
  await P.getByRole('button', { name: 'Send to Pip' }).click()
  const resp = await respP
  const js = await resp.json().catch(() => ({}))
  await waitBubble(H, js)
  return js
}
async function waitBubble(H, s) {
  const last = (s.transcript ?? []).filter((m) => m.from === 'pip').at(-1)?.text ?? ''
  const tail = last.replace(/[‘’'“”"]/g, '').trim().slice(-14)
  await H.P.waitForFunction((t) => (document.querySelector('.speech .bubble__text')?.textContent ?? '').replace(/[‘’'“”"]/g, '').includes(t), tail, { timeout: 6000 }).catch(() => {})
  await sleep(250)
}

// The newest Pip line must be on screen and not covered (AGE-2 feed: scrolled to the end after each reply).
async function newestVisible(H) {
  return H.P.evaluate(() => {
    const el = document.querySelector('.speech .bubble__text')
    const feed = document.querySelector('.feed')
    if (!el) return { ok: false, why: 'no newest Pip line' }
    const r = el.getBoundingClientRect()
    const y = Math.min(r.bottom - 4, innerHeight - 1)
    const hit = document.elementFromPoint(r.left + Math.min(20, r.width / 2), Math.max(0, y))
    const ok = r.top >= 0 && r.bottom <= innerHeight + 1 && !!hit && (hit === el || el.contains(hit) || hit.contains(el))
    return { ok, top: Math.round(r.top), bottom: Math.round(r.bottom), vh: innerHeight, feed: feed ? { scrollTop: Math.round(feed.scrollTop), scrollHeight: feed.scrollHeight, clientHeight: feed.clientHeight } : null }
  })
}

// Before ready_for_quiz the primary "Quiz Pip" gel must not show (a quiet "Keep teaching" hold-to-quiz instead).
async function quizGate(H, s) {
  const quizBtn = await H.P.locator('.quiz-btn').count()
  const keep = await H.P.locator('.keep-teaching').count()
  const ready = s.ready_for_quiz === true || !!s.reteach_concept
  return { ready, quizBtn, keep, ok: ready ? quizBtn === 1 : quizBtn === 0 }
}

async function startMission(H, { reset = true } = {}) {
  if (reset) await api('/demo/reset', 'POST')
  await H.page.goto(`${BASE}/student`)
  await H.inApp()
  await H.P.locator('.home-current__topic').waitFor({ timeout: 20000 })
  await H.P.locator('.home-current').getByRole('button', { name: PLAY_RE }).click()
  const dlg = H.P.getByRole('dialog', { name: "Pick Pip's look" })
  await dlg.waitFor()
  return dlg
}

// Walk the exam pager to a missed question; returns its Re-teach button.
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

async function runMaya(H) {
  const { page, vp } = H
  let sid
  const fits = []
  const fitHere = async (label) => {
    if (!vp.mobile) return
    const f = await H.fit(label)
    fits.push([label, f.ok])
  }

  await H.step('reset demo data (/admin/reset)', async () => {
    await page.goto(`${BASE}/admin/reset`)
    await page.getByRole('button', { name: 'Reset demo data' }).click()
    await page.locator('.pill', { hasText: 'Demo data restored' }).waitFor({ timeout: 20000 })
    await page.evaluate(() => localStorage.removeItem('pip.audience'))
    return {}
  })

  await H.step('landing -> "Try as Maya"', async () => {
    await page.goto(`${BASE}/`)
    await sleep(500)
    await H.shot('landing')
    const o = await H.overflow('landing', page)
    const c = await H.contrast('landing', page)
    await page.getByRole('link', { name: /Try as Maya|^Student$/ }).first().click()
    await page.waitForURL('**/student**')
    return { pass: !o.overflows, overflow: o, contrast: c.violations }
  })

  await H.step('student home: pinned triangle mission vs Duke', async () => {
    await H.inApp()
    await H.P.locator('.home-current__topic').waitFor({ timeout: 20000 })
    await sleep(800)
    const topic = await H.P.locator('.home-current__topic').textContent()
    // AGE-2 drop card: the boss is named in the drop line (the sticker is decorative); pre-AGE-2: the vs sticker label
    const boss = (await H.P.locator('.home-current__vs').getAttribute('aria-label', { timeout: 1500 }).catch(() => null)) ?? (await H.P.locator('.home-current').innerText())
    const aud = await registerOf(H.P)
    await H.shot('home')
    const o = await H.overflow('home')
    await fitHere('home')
    const small = await H.targets('home', 44)
    await H.contrast('home')
    return { pass: /triangle/i.test(topic) && /Duke/i.test(boss ?? '') && aud === 'cool' && !o.overflows, topic, boss, register: aud, small } // AGE-1: cool by default
  })

  await H.step('start mission: picker -> Start teaching', async () => {
    await H.P.locator('.home-current').getByRole('button', { name: PLAY_RE }).click()
    const dlg = H.P.getByRole('dialog', { name: "Pick Pip's look" })
    await dlg.waitFor()
    await dlg.getByRole('radio', { name: /Cat/ }).first().click().catch(() => {})
    await sleep(500)
    await H.shot('picker')
    await H.overflow('picker')
    await dlg.getByRole('button', { name: 'Start teaching' }).click()
    await H.P.waitForURL('**/student/mission/**', { timeout: 20000 })
    sid = sessionIdOf(H.P)
    await H.P.locator('.speech .bubble__text').waitFor({ timeout: 10000 })
    return { sid }
  })

  await H.step("opening: Pip's last line is the misconception claim", async () => {
    const s = await getSession(sid)
    const last = pipMsgs(s).at(-1)?.text ?? ''
    await sleep(600)
    const ui = (await H.P.locator('.speech .bubble__text').textContent()) ?? ''
    const gate = await quizGate(H, s)
    await H.shot('mission-opening')
    await fitHere('mission-opening')
    await H.targets('mission-teaching', 44)
    await H.contrast('mission-teaching')
    return {
      pass: /base times height/i.test(last) && /24/.test(last) && ui.replace(/\s+/g, ' ').includes(last.slice(-30).replace(/\s+/g, ' ').trim()) && gate.quizBtn === 0 && gate.keep === 0,
      last,
      quizButtonsBeforeFirstText: gate,
    }
  })

  const turns = []
  for (let i = 0; i < MSGS.length; i++) {
    await H.step(`Maya text ${i + 1}: "${MSGS[i]}"`, async () => {
      const before = await getSession(sid)
      const after = await sendText(H, sid, MSGS[i])
      const fresh = after.transcript.slice(before.transcript.length)
      const pip = fresh.filter((m) => m.from === 'pip').map((m) => m.text).join(' | ')
      const events = fresh.map((m) => m.event).filter(Boolean)
      const gate = await quizGate(H, after)
      await sleep(500)
      const seen = await newestVisible(H)
      await H.shot(`mission-text${i + 1}`)
      await fitHere(`mission-text${i + 1}`)
      const t = { hp: [before.boss_hp, after.boss_hp], ready: after.ready_for_quiz, gate, newestPipVisible: seen, pip: pip.slice(0, 200), events: events.map((e) => `${e.kind}:${e.level ?? ''}`) }
      turns.push(t)
      let pass = !!pip && gate.ok && seen.ok
      if (i === 0) pass = pass && after.boss_hp === before.boss_hp && /\?/.test(pip) && after.ready_for_quiz === false
      if (i === 1) pass = pass && after.boss_hp < before.boss_hp && events.some((e) => e.kind === 'hit')
      // PACE-2: ready may already come at text 2; text 3 then only has to keep Pip ready (no regression).
      if (i === 2) pass = pass && after.ready_for_quiz === true && (before.ready_for_quiz || after.boss_hp < before.boss_hp)
      if (i === 3) pass = pass && after.boss_hp > before.boss_hp && events.some((e) => e.kind === 'heal') && pip.includes(WRONG_RULE)
      return { pass, ...t }
    })
  }

  await H.step('Pip never repeats the same question (Maya)', async () => {
    const s = await getSession(sid)
    const qs = pipMsgs(s).map((m) => questionOf(m.text)).filter(Boolean).map((q) => normQ(q))
    const dup = qs.filter((q, i) => qs.indexOf(q) !== i)
    return { pass: dup.length === 0, questions: qs, dup }
  })

  let quizResp
  await H.step('quiz Pip: Brain shows the wrong rule; Pip passes 2, misses the right triangle', async () => {
    const respP = page.waitForResponse((r) => r.url().includes(`/sessions/${sid}/quiz`), { timeout: 30000 })
    await H.P.locator('.quiz-btn').click()
    quizResp = await (await respP).json()
    await H.P.locator('.exam-page--brain').waitFor({ timeout: 15000 })
    await sleep(900)
    const wrong = (await H.P.locator('.note--wrong').allTextContents()).join(' | ')
    await H.shot('quiz-brain')
    await fitHere('quiz-brain')
    const fix = await toMissPage(H)
    await sleep(1200)
    await H.shot('quiz-miss')
    await fitHere('quiz-miss')
    await H.contrast('quiz-miss')
    const k3 = quizResp.quiz?.find((q) => q.concept_id === 'k3')
    return {
      pass: wrong.includes(WRONG_RULE) && /Pip believes this/.test(wrong) && quizResp.quiz.filter((q) => q.passed).length === 2 && k3 && !k3.passed && /50/.test(`${k3.line} ${k3.pip_answer}`) && (await fix.count()) === 1,
      wrongNote: wrong.slice(0, 160),
      quiz: quizResp.quiz.map((q) => [q.concept_id, q.passed]),
      k3line: k3?.line,
    }
  })

  await H.step('re-teach the right triangle -> Let Pip retry -> K.O.', async () => {
    await H.P.locator('.qitem__fix').first().click()
    await H.P.locator('.reteach-banner').waitFor({ timeout: 10000 })
    const s1 = await getSession(sid)
    await sleep(500)
    await H.shot('reteach')
    await fitHere('reteach')
    const gate0 = await H.P.locator('.quiz-btn').count()
    await sendText(H, sid, MSG_RETEACH)
    const respP = page.waitForResponse((r) => r.url().includes(`/sessions/${sid}/quiz`), { timeout: 30000 })
    await H.P.locator('.quiz-btn').click()
    quizResp = await (await respP).json()
    await H.P.locator('.ko').first().waitFor({ timeout: 20000 })
    await sleep(500)
    await H.shot('ko-fight')
    return {
      pass: s1.reteach_concept === 'k3' && gate0 === 0 && quizResp.ko === true && quizResp.brain_version === 2,
      pipAsk: s1.transcript.at(-1)?.text,
      retryBeforeText: gate0,
      ko: quizResp.ko,
      brain: quizResp.brain_version,
    }
  })

  await H.step('payoff in the API: reformed Duke joins the crew, club stage unlocked', async () => {
    const p = quizResp.payoff
    if (!p) notBuilt('quiz response has no payoff (v3.7/v3.9)')
    return {
      pass: p.from_version === 1 && p.to_version === 2 && (p.new_crew ?? []).some((c) => c.kind === 'reformed_boss' && /Duke/.test(c.name)) && (p.unlocked ?? []).includes('club_stage') && /b\s*×\s*h/.test(p.card?.strike ?? ''),
      payoff: { new_items: p.new_items, new_crew: p.new_crew?.map((c) => c.name), unlocked: p.unlocked, strike: p.card?.strike },
    }
  })

  let koText = ''
  await H.step('K.O.: finishing move -> card (strikes A = b × h, Brain v1 -> v2)', async () => {
    const chips = H.P.locator('.ko__weapons .weapon')
    await chips.first().waitFor({ timeout: 8000 })
    await chips.first().click()
    // stamp -> (AGE-2) "The new look" -> card; tap through like a kid would, keeping what each beat says.
    for (let i = 0; i < 12 && !(await H.P.locator('.ko--card').count()); i++) {
      await sleep(900)
      if (await H.P.locator('.ko--newlook').count()) {
        koText += await H.P.locator('.ko--newlook').innerText().catch(() => '')
        await H.shot('ko-newlook')
      }
      if (!(await H.P.locator('.ko--card').count())) await H.P.locator('.ko').first().click().catch(() => {})
    }
    await H.P.locator('.ko--card').waitFor({ timeout: 8000 })
    await sleep(1000)
    const version = await H.P.locator('.ko__version').getAttribute('aria-label')
    const front = await H.P.locator('.ko-card__front').innerText()
    await H.shot('ko-card')
    await fitHere('ko-card')
    await H.P.locator('.ko-card').click()
    await sleep(900)
    await H.shot('ko-card-back')
    koText += await H.P.locator('body').innerText()
    return { pass: /1 to 2/.test(version ?? '') && /b\s*×\s*h/.test(front) && !/XP/.test(front), version, front: front.slice(0, 160) }
  })

  await H.step('payoff on screen: new crew member / unlock shown after K.O.', async () => {
    // Walk the K.O. beats and look for the payoff the API returned (reformed boss line, club stage).
    for (let i = 0; i < 3; i++) {
      koText += await H.P.locator('body').innerText()
      const next = H.P.locator('button.ko__next')
      if (!(await next.count())) break
      await next.click()
      await sleep(700)
      await H.shot(`ko-beat${i + 2}`)
      await fitHere(`ko-beat${i + 2}`)
    }
    koText += await H.P.locator('body').innerText()
    const crew = /I have recounted|joined (your|Pip’s|Pip's) crew|joins? the crew|new crew/i.test(koText)
    const unlock = /club stage|unlocked|new stage/i.test(koText)
    if (!crew && !unlock) notBuilt('K.O. beats show no crew/unlock payoff (F14 backlog)')
    return { pass: crew && unlock, crew, unlock }
  })

  await H.step('cliffhanger: the parallelogram rumor', async () => {
    const cliff = koText.match(/[^\n]*parallelogram[^\n]*/i)?.[0] ?? null
    const rivera = /What Ms\. Rivera sees/.test(koText)
    return { pass: !!cliff && rivera, cliff, rivera }
  })

  if (vp.mobile) {
    await H.step('no page scroll on Play screens at 390 (mission, quiz, re-teach, K.O.)', async () => {
      const exam = fits.filter(([l]) => EXAM_VISUAL.test(l))
      const rest = fits.filter(([l]) => !EXAM_VISUAL.test(l))
      const bad = rest.filter(([, ok]) => !ok).map(([l]) => l)
      return { pass: rest.length >= 6 && bad.length === 0, checked: rest.length, bad, detail: Object.fromEntries(bad.map((b) => [b, H.R.fit[b]])), examPending: exam }
    })
  }
  return sid
}

// One SCR-1 persona through the real UI.
async function runPersona(H, { card, register }) {
  const { page, vp } = H
  const id = card.id
  const kid = makeKid(card)
  const log = []
  const gates = []
  const fits = []
  const prior = new Set()
  let sid
  let texts = 0
  let readyAt = null
  let ended = null
  let doubleText = null

  await H.step(`${id}: start mission in the ${register} register`, async () => {
    await api('/demo/reset', 'POST')
    await page.goto(`${BASE}/student`)
    await H.inApp()
    await H.P.evaluate((r) => localStorage.setItem('pip.audience', r), register)
    await H.P.evaluate(() => location.reload())
    await H.P.locator('.home-current__topic').waitFor({ timeout: 20000 })
    await H.P.locator('.home-current').getByRole('button', { name: PLAY_RE }).click()
    const dlg = H.P.getByRole('dialog', { name: "Pick Pip's look" })
    await dlg.getByRole('button', { name: 'Start teaching' }).click()
    await H.P.waitForURL('**/student/mission/**', { timeout: 20000 })
    sid = sessionIdOf(H.P)
    await H.P.locator('.speech .bubble__text').waitFor({ timeout: 10000 })
    const aud = await registerOf(H.P)
    const composer = await H.P.evaluate(() => {
      const el = document.querySelector('.composer__input')
      const r = el?.getBoundingClientRect()
      const hit = r && document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
      return { present: !!el, inView: !!r && r.top >= 0 && r.bottom <= innerHeight, onTop: !!hit && (hit === el || el.contains(hit)) }
    })
    await H.shot(`${id}-opening`)
    const o = await H.overflow(`${id}-mission`)
    if (vp.mobile) fits.push((await H.fit(`${id}-opening`)).ok)
    await H.targets(`${id}-mission`, 44)
    await H.contrast(`${id}-mission`)
    return { pass: aud === register && !o.overflows && composer.inView && composer.onTop, register: aud, sid, overflow: o.wide, composer }
  })

  const say = async (text, label) => {
    const before = await getSession(sid)
    const after = await sendText(H, sid, text)
    texts += 1
    const reply = after.transcript.slice(before.transcript.length).filter((m) => m.from === 'pip').map((m) => m.text).join(' ')
    log.push({ kid: text, key: label, pip: reply.slice(0, 180), hp: after.boss_hp, ready: after.ready_for_quiz })
    gates.push({ t: texts, ...(await quizGate(H, after)) })
    if (vp.mobile) fits.push((await H.fit(`${id}-text${texts}`)).ok)
    if (after.ready_for_quiz && readyAt == null) readyAt = texts
    return { after, reply }
  }

  await H.step(`${id}: teach until Pip is ready (bank chosen by what Pip said)`, async () => {
    // Double text (ui_actions after_text:1): the second piece goes out while Pip is still thinking.
    // The turn is slowed to 1.5 s so "thinking" is observable in offline mode.
    const dbl = kid.action('after_text:1')
    if (dbl?.do === 'double_text') {
      doubleText = await sendDouble(H, sid, card.first_text, dbl.text)
      texts += 2
      log.push({ kid: [card.first_text, dbl.text], key: 'first_text + double_text' })
      if ((await getSession(sid)).ready_for_quiz && readyAt == null) readyAt = texts
    } else await say(card.first_text, 'first_text')
    for (let guard = 0; guard < 10 && texts < 10; guard++) {
      const s = await getSession(sid)
      if (s.ready_for_quiz) break
      const early = kid.action(`after_text:${texts}`)
      if (early?.do === 'quiz_early' && early.p >= P_ACT) {
        ended = 'quiz_early (hold Keep teaching)'
        break
      }
      const leave = kid.action(`pip_repeats:${kid.repeats}`)
      if (leave?.do === 'leave' && kid.repeats > 0 && leave.p >= P_ACT) {
        ended = 'left (patience)'
        break
      }
      const last = pipMsgs(s).at(-1)?.text ?? ''
      const key = classifyPip(last, prior)
      pipMsgs(s).forEach((m) => questionOf(m.text) && prior.add(normQ(m.text)))
      const pick = kid.next(key)
      if (Array.isArray(pick.line)) {
        await say(pick.line[0], `${pick.key} (double 1/2)`)
        await say(pick.line[1], `${pick.key} (double 2/2)`)
      } else await say(pick.line, pick.key)
    }
    await H.shot(`${id}-taught`)
    const s = await getSession(sid)
    return { texts, readyAt, ended, ready: s.ready_for_quiz, hp: s.boss_hp, log }
  })

  if (doubleText) {
    await H.step(`${id}: double text while Pip is thinking`, async () => doubleText)
  }

  await H.step(`${id}: Quiz button hidden before ready, shown once ready`, async () => {
    const bad = gates.filter((g) => !g.ok)
    return { pass: bad.length === 0, gates, bad }
  })

  await H.step(`${id}: ready within ${card.expect?.ready_within_texts ?? 6} texts (SCR-1 target)`, async () => {
    const n = card.expect?.ready_within_texts ?? 6
    return { pass: readyAt != null && readyAt <= n, readyAt, target: n, ended }
  })

  // Quiz (or the hold-to-quiz escape hatch), then re-teach misses with the card's after_quiz_miss lines.
  await H.step(`${id}: no dead end: quiz -> re-teach -> K.O. or a clean exit`, async () => {
    if (ended === 'left (patience)') {
      await H.P.getByRole('link', { name: 'Pip’s room' }).first().click()
      await H.P.locator('.home-current__topic').waitFor({ timeout: 10000 })
      const btn = await H.P.locator('.home-current .home-play').textContent()
      await H.shot(`${id}-left-home`)
      return { pass: /play|keep teaching|teach/i.test(btn), outcome: 'left; mission resumes from home', btn }
    }
    const respP = page.waitForResponse((r) => r.url().includes(`/sessions/${sid}/quiz`), { timeout: 30000 })
    const s0 = await getSession(sid)
    let how
    if (s0.ready_for_quiz) {
      await H.P.locator('.quiz-btn').click()
      how = 'Quiz Pip'
    } else {
      const keep = H.P.locator('.keep-teaching')
      if (!(await keep.count())) return { pass: false, outcome: 'not ready and no Keep teaching / hold-to-quiz button: dead end' }
      // Long press (800 ms) quizzes Pip anyway; the button is gone once the quiz starts, so no pointerup.
      await keep.dispatchEvent('pointerdown')
      how = 'hold Keep teaching'
    }
    let q = await (await respP).json()
    await H.P.locator('.exam-page--brain, .ko').first().waitFor({ timeout: 15000 })
    await sleep(800)
    await H.shot(`${id}-quiz`)
    if (vp.mobile) await H.fit(`${id}-quiz`) // exam screen: pending restyle, recorded only
    const rounds = [q.quiz.map((x) => [x.concept_id, x.passed])]
    const skip = kid.action('after_quiz_miss')
    for (let round = 0; round < 3 && !q.ko; round++) {
      if (skip?.do === 'skip_reteach' && skip.p >= P_ACT) {
        await H.P.getByRole('link', { name: 'Pip’s room' }).first().click()
        await H.P.locator('.home-current__topic').waitFor({ timeout: 10000 })
        return { pass: true, outcome: `${how}; skipped re-teach and went home (card skip_reteach)`, rounds }
      }
      const fix = await toMissPage(H)
      if (!(await fix.count())) return { pass: false, outcome: 'missed a question but no Re-teach button: dead end', rounds }
      await fix.click()
      await H.P.locator('.reteach-banner').waitFor({ timeout: 10000 })
      // Fixture: the after_quiz_miss line re-teaches; then one more line from the bank Pip's reply calls for.
      const r1 = await say(kid.afterMiss(), 'after_quiz_miss')
      const k2 = classifyPip(r1.reply, prior)
      pipMsgs(r1.after).forEach((m) => questionOf(m.text) && prior.add(normQ(m.text)))
      const pick = kid.next(k2)
      await say(Array.isArray(pick.line) ? pick.line.join('\n') : pick.line, `reteach: ${pick.key}`)
      const rp = page.waitForResponse((r) => r.url().includes(`/sessions/${sid}/quiz`), { timeout: 30000 })
      await H.P.locator('.quiz-btn').click()
      q = await (await rp).json()
      rounds.push(q.quiz.map((x) => [x.concept_id, x.passed]))
      await H.P.locator('.exam-page--brain, .ko').first().waitFor({ timeout: 15000 })
      await sleep(800)
    }
    await H.shot(`${id}-end`)
    const brainQuotes = (q.brain ?? []).map((r) => r.quote)
    const insultFiled = brainQuotes.some((x) => /dumb|stupid|broken|genius/i.test(x))
    return { pass: q.ko === true && !insultFiled, outcome: `${how}; ${q.ko ? 'K.O.' : 'no K.O. after re-teach rounds'}`, rounds, brainQuotes, insultFiled, reteachLog: log.filter((l) => /after_quiz_miss|reteach/.test(l.key)) }
  })

  await H.step(`${id}: Pip never repeats the same question (teaching + re-teach)`, async () => {
    const s = await getSession(sid)
    const qs = pipMsgs(s).map((m) => questionOf(m.text)).filter(Boolean).map((q) => normQ(q))
    const dup = [...new Set(qs.filter((q, i) => qs.indexOf(q) !== i))]
    const sameLine = pipMsgs(s).map((m) => m.text).filter((t, i, a) => i > 0 && t === a[i - 1])
    return { pass: dup.length === 0 && sameLine.length === 0, dup, sameLine, questions: qs.length }
  })

  if (vp.mobile) {
    await H.step(`${id}: no page scroll on the mission screen at 390`, async () => ({ pass: fits.every(Boolean), checked: fits.length, bad: fits.filter((x) => !x).length }))
  }
}

// Send `first` then `second` before the first reply lands; both must reach the server, in order.
async function sendDouble(H, sid, first, second) {
  const { P, page } = H
  const before = await getSession(sid)
  await page.route('**/api/sessions/*/turn', async (route) => {
    await sleep(1500)
    await route.continue()
  })
  try {
    const box = P.getByRole('textbox', { name: 'Message to Pip' })
    await box.fill(first)
    await P.getByRole('button', { name: 'Send to Pip' }).click()
    await sleep(200)
    const thinking = await P.locator('.speech__bubble--dots, .msg__bubble--dots, .msg--status').count()
    await box.fill(second)
    const sendEnabled = await P.getByRole('button', { name: 'Send to Pip' }).isEnabled()
    if (sendEnabled) await P.getByRole('button', { name: 'Send to Pip' }).click()
    await sleep(150)
    const waiting = (await P.locator('.msg__sending').allTextContents().catch(() => [])).join(' ') || null
    await H.shot('double-text-waiting')
    // both turns go out one after another
    for (let i = 0; i < 40; i++) {
      const s = await getSession(sid)
      const mine = s.transcript.slice(before.transcript.length).filter((m) => m.from === 'student').map((m) => m.text)
      if (mine.length >= 2) {
        await sleep(400)
        return { pass: thinking > 0 && sendEnabled && /waiting/.test(waiting ?? '') && mine[0] === first && mine[1] === second, thinkingShown: thinking > 0, sendEnabled, waiting, sentInOrder: mine }
      }
      await sleep(250)
    }
    if (!sendEnabled) notBuilt('Send is disabled while Pip is thinking (F10 outbox)')
    return { pass: false, thinkingShown: thinking > 0, sendEnabled, waiting, note: 'second text never reached the server' }
  } finally {
    await page.unroute('**/api/sessions/*/turn')
  }
}

// PACE-2: the owner's transcript typed through the UI, sending the next text only until Pip is ready.
async function runOwnerTranscript(H) {
  let sid
  let readyAt = null
  const sent = []
  await H.step("PACE-2 owner's triangle run: ready by text 2-3", async () => {
    await startMission(H)
    await H.P.getByRole('dialog', { name: "Pick Pip's look" }).getByRole('button', { name: 'Start teaching' }).click()
    await H.P.waitForURL('**/student/mission/**', { timeout: 20000 })
    sid = sessionIdOf(H.P)
    await H.P.locator('.speech .bubble__text, .msg--pip').first().waitFor({ timeout: 10000 })
    for (const t of OWNER_RUN) {
      const s = await sendText(H, sid, t)
      sent.push({ kid: t, pip: (pipMsgs(s).at(-1)?.text ?? '').slice(0, 140), ready: s.ready_for_quiz })
      if (s.ready_for_quiz) {
        readyAt = sent.length
        break
      }
    }
    await H.shot('owner-run-ready')
    return { pass: readyAt != null && readyAt <= 3, readyAt, sent }
  })
  await H.step("PACE-2 owner's triangle run: quiz passes every item (K.O., no re-teach)", async () => {
    if (readyAt == null) return { pass: false, note: 'never ready, quiz not attempted' }
    const respP = H.page.waitForResponse((r) => r.url().includes(`/sessions/${sid}/quiz`), { timeout: 30000 })
    await H.P.locator('.quiz-btn').click()
    const q = await (await respP).json()
    await H.P.locator('.exam-page--brain, .ko').first().waitFor({ timeout: 15000 })
    await sleep(800)
    await H.shot('owner-run-quiz')
    const lines = q.quiz.map((x) => [x.concept_id, x.passed, x.line?.slice(0, 70)])
    return { pass: q.ko === true && q.quiz.every((x) => x.passed) && !q.quiz.some((x) => /teach me that/i.test(x.line ?? '')), ko: q.ko, lines }
  })
}

// AGE-1/AGE-2: the student default is the night "secondary" look (reports/design/secondary_preview.png).
// Checked on a fresh device (no stored theme/register/skin) with the OS in LIGHT mode, so "night" must be the default.
// Preview frames: 01 home = drop card + mono labels + "Teach Pip" + bottom tabs; 02 mission = LCD boss bar + chat feed
// + tool chips + composer. Type: grotesk/condensed/mono, no Fredoka; radii 6-12; body >= 15px (12px mono labels OK).
const LOOK = () => {
  const shell = document.querySelector('[data-register]')
  const vis = [...document.querySelectorAll('body *')].filter((e) => {
    const r = e.getBoundingClientRect()
    return r.width > 0 && r.bottom > 0 && r.top < innerHeight && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && !e.closest('[aria-hidden="true"],.sr-only')
  })
  const fredoka = vis.filter((e) => /fredoka/i.test(getComputedStyle(e).fontFamily)).map((e) => e.textContent.trim().slice(0, 24))
  const body = vis.filter((e) => e.textContent.trim().length > 25 && !e.closest('.mono-label,.lcd,.mono')).map((e) => [parseFloat(getComputedStyle(e).fontSize), e.textContent.trim().slice(0, 30)])
  const radii = [...document.querySelectorAll('.gel-btn, .drop, .row2, .msg__bubble, .chip-tool, .composer')]
    .filter((e) => e.getBoundingClientRect().width > 0)
    .map((e) => [parseFloat(getComputedStyle(e).borderTopLeftRadius), e.className.split(' ')[0]])
    .filter(([r, c]) => r > 12 && !/icon-btn|composer__send/.test(c))
  const bg = getComputedStyle(document.body).backgroundColor
  const rgb = (c) => (c.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number)
  const lum = (c) => {
    const [r, g, b] = rgb(c).map((v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const screenBg = [document.querySelector('.play-screen'), shell, document.body].map((e) => e && getComputedStyle(e).backgroundColor).find((c) => c && !/rgba\(0, 0, 0, 0\)|transparent/.test(c)) ?? bg
  return {
    // "night" = what the screen renders (the data-theme attribute still follows the OS for the legacy skins)
    theme: lum(screenBg) < 0.05 ? 'night' : 'day',
    dataTheme: shell?.getAttribute('data-theme'),
    screenBg,
    register: shell?.getAttribute('data-register'),
    skin: shell?.getAttribute('data-skin'),
    bodyBg: bg,
    fredoka: fredoka.slice(0, 4),
    fredokaCount: fredoka.length,
    smallBody: body.filter(([px]) => px < 15).slice(0, 4),
    bigRadii: radii.slice(0, 4),
    monoLabels: document.querySelectorAll('.mono-label').length,
    cta: [...document.querySelectorAll('.home-play')].map((b) => b.textContent.trim())[0] ?? null,
    tabs: [...document.querySelectorAll('nav.tabs .tab')].map((t) => t.textContent.trim()),
    feed: !!document.querySelector('.game--feed .feed'),
    lcdBoss: !!document.querySelector('.bossbar .lcd--boss'),
    segHp: document.querySelectorAll('.bossbar .seg-hp b').length,
    toolChips: [...document.querySelectorAll('.tools .chip-tool')].map((t) => t.textContent.trim()),
    composer: !!document.querySelector('.composer__input'),
  }
}
async function runSecondaryLook(H) {
  let home
  await H.step('AGE-2 home vs secondary_preview #01 (night default, drop card, Teach Pip, mono, tabs)', async () => {
    await api('/demo/reset', 'POST')
    await H.page.goto(`${BASE}/student`)
    await H.inApp()
    await H.P.evaluate(() => ['pip.theme', 'pip.audience', 'pip.skin'].forEach((k) => localStorage.removeItem(k)))
    await H.P.evaluate(() => location.reload())
    await H.P.locator('.home-current__topic').waitFor({ timeout: 20000 })
    await sleep(900)
    home = await H.P.evaluate(LOOK)
    await H.shot('age2-home-default')
    if (home.cta && /^play$/i.test(home.cta)) notBuilt(`restyle not landed: ${JSON.stringify(home)}`)
    const ok = home.theme === 'night' && /^teach /i.test(home.cta ?? '') && home.fredokaCount === 0 && home.bigRadii.length === 0 && home.smallBody.length === 0 && home.monoLabels >= 1 && home.tabs.length >= 3 // TOM-1 moved the continue rows to the Missions sheet
    return { pass: ok, ...home }
  })
  await H.step('AGE-2 mission vs secondary_preview #02 (LCD boss bar, chat feed, tool chips)', async () => {
    await H.P.locator('.home-current').getByRole('button', { name: PLAY_RE }).click()
    await H.P.getByRole('dialog', { name: "Pick Pip's look" }).getByRole('button', { name: 'Start teaching' }).click()
    await H.P.waitForURL('**/student/mission/**', { timeout: 20000 })
    const sid = sessionIdOf(H.P)
    await H.P.locator('.speech .bubble__text').waitFor({ timeout: 10000 })
    await sendText(H, sid, 'no its half of that')
    await sendText(H, sid, 'because 2 triangles make a rectangle')
    const m = await H.P.evaluate(LOOK)
    await H.shot('age2-mission-feed')
    const f = H.vp.mobile ? await H.fit('age2-mission') : { ok: true }
    const c = await H.contrast('age2-mission')
    if (!m.feed && !m.lcdBoss) notBuilt('mission still uses the pre-AGE-2 stage layout')
    const ok = m.theme === 'night' && m.feed && m.lcdBoss && m.segHp === 10 && m.toolChips.length >= 3 && m.composer && m.fredokaCount === 0 && m.bigRadii.length === 0 && f.ok
    return { pass: ok, ...m, fit: f, contrastViolations: c.violations }
  })
}

// TOM-1: Talking-Tom Pip. Hero size, live states, pokes, chat overlay + full-chat sheet.
const POKE_LINES = {
  head: ['Hey.', 'That’s where the rules live.', 'Careful. Thinking in there.', 'Hey. I felt that.'],
  belly: ['Squish. Noted.', 'That’s not a button.', 'Rude, but fine.'],
  sprout: ['Boing. Please don’t.', 'The sprout is load-bearing.', 'Leave the sprout alone.'],
}
const pipBox = (P) =>
  P.evaluate(() => {
    const el = document.querySelector('.stage2d__pip svg.pip2d, .stage2d__pip .pip2d-depth')
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { h: Math.round(r.height), w: Math.round(r.width), cx: Math.round(r.left + r.width / 2), vh: innerHeight, vw: innerWidth, pct: Math.round((r.height / innerHeight) * 100), centered: Math.abs(r.left + r.width / 2 - innerWidth / 2) < innerWidth * 0.12 }
  })
const stateOf = (P) => P.evaluate(() => document.querySelector('[data-pip-state]')?.getAttribute('data-pip-state') ?? null)
async function waitState(P, want, ms) {
  const seen = []
  const t0 = Date.now()
  while (Date.now() - t0 < ms) {
    const st = await stateOf(P)
    if (seen.at(-1) !== st) seen.push(st)
    if (st === want) return { ok: true, seen }
    await sleep(60)
  }
  return { ok: false, seen }
}
// Tap the centre of each poke zone (real hit-testing through the page) and read the line Pip says.
// P2D-15b: zones carry data-zone (belly, head, and one or more sprout circles incl. the leaf tip).
async function pokeAll(H, lineSel) {
  const zones = await H.P.evaluate(() => {
    const svg = document.querySelector('.stage2d__pip svg.pip2d')
    if (!svg) return null
    return [...svg.querySelectorAll('[data-zone]')].map((e) => {
      const r = e.getBoundingClientRect()
      return { zone: e.getAttribute('data-zone'), x: r.left + r.width / 2, y: r.top + r.height / 2 }
    })
  })
  if (!zones?.length) notBuilt('no Pip2D poke zones (data-zone)')
  const off = H.vp.mobile
    ? { x: 0, y: 0, sc: 1 }
    : await H.page.evaluate(() => {
        const r = document.querySelector('iframe.device__iframe').getBoundingClientRect()
        return { x: r.left, y: r.top, sc: r.width / 390 }
      })
  const targets = [
    ['head', zones.find((z) => z.zone === 'head')],
    ['belly', zones.find((z) => z.zone === 'belly')],
    ...zones.filter((z) => z.zone === 'sprout').map((z, i, all) => [i === all.length - 1 && all.length > 1 ? 'sproutTip' : `sprout${i ? i + 1 : ''}`, z]),
  ]
  const out = {}
  for (const [name, z] of targets) {
    if (!z) {
      out[name] = { ok: false, line: null, note: 'zone missing' }
      continue
    }
    await H.page.mouse.click(off.x + z.x * off.sc, off.y + z.y * off.sc)
    await sleep(350)
    const line = (await H.P.locator(lineSel).last().textContent().catch(() => '')).trim()
    const zone = name.startsWith('sprout') ? 'sprout' : name
    out[name] = { line, ok: POKE_LINES[zone].includes(line) }
    await sleep(3400) // the line clears after 3.2 s
  }
  return out
}

async function runTom(H) {
  const { vp } = H
  let sid
  await H.step('TOM-1 home: Pip is the front-facing hero (~55-60% of height)', async () => {
    await api('/demo/reset', 'POST')
    await H.page.goto(`${BASE}/student`)
    await H.inApp()
    await H.P.locator('.home-current__topic').waitFor({ timeout: 20000 })
    await sleep(900)
    const b = await pipBox(H.P)
    await H.shot('tom-home')
    const f = vp.mobile ? await H.fit('tom-home') : { ok: true }
    if (!b) notBuilt('no Pip on home')
    return { pass: b.pct >= 50 && b.pct <= 66 && b.centered && f.ok, pip: b, fit: f }
  })
  await H.step('TOM-1 home: the first poke (greeting) shows a caption, not voice only', async () => {
    const head = await H.P.evaluate(() => {
      const r = document.querySelector('.stage2d__pip [data-zone="head"]')?.getBoundingClientRect()
      return r && { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    })
    const off = vp.mobile ? { x: 0, y: 0, sc: 1 } : await H.page.evaluate(() => {
      const r = document.querySelector('iframe.device__iframe').getBoundingClientRect()
      return { x: r.left, y: r.top, sc: r.width / 390 }
    })
    await H.page.mouse.click(off.x + head.x * off.sc, off.y + head.y * off.sc)
    await sleep(400)
    const caption = (await H.P.locator('.drop__say').last().textContent({ timeout: 500 }).catch(() => null))?.trim() ?? null
    await sleep(3400)
    return { pass: !!caption, caption, note: caption ? null : 'first tap speaks the greeting with no on-screen text (captions must always show)' }
  })
  await H.step('TOM-1 home pokes: head, belly, sprout each get their line', async () => {
    const r = await pokeAll(H, '.drop__say')
    await H.shot('tom-home-poke')
    return { pass: Object.values(r).every((x) => x.ok), ...r }
  })
  await H.step('TOM-1 mission: Pip hero size + idle', async () => {
    await H.P.locator('.home-current').getByRole('button', { name: PLAY_RE }).click()
    await H.P.getByRole('dialog', { name: "Pick Pip's look" }).getByRole('button', { name: 'Start teaching' }).click()
    await H.P.waitForURL('**/student/mission/**', { timeout: 20000 })
    sid = sessionIdOf(H.P)
    await H.P.locator('.speech .bubble__text').waitFor({ timeout: 10000 })
    await sleep(2500)
    const b = await pipBox(H.P)
    const st = await waitState(H.P, 'idle', 6000)
    await H.shot('tom-mission-idle')
    const f = vp.mobile ? await H.fit('tom-mission') : { ok: true }
    return { pass: !!b && b.pct >= 50 && b.pct <= 66 && b.centered && st.ok && f.ok, pip: b, state: st, fit: f }
  })
  await H.step('TOM-1 states: listening while typing, thinking while waiting, talking while the reply shows', async () => {
    const box = H.P.getByRole('textbox', { name: 'Message to Pip' })
    await box.click()
    await box.fill('no its half of that')
    const listening = await waitState(H.P, 'listening', 1500)
    await H.shot('tom-listening')
    await H.page.route('**/api/sessions/*/turn', async (route) => {
      await sleep(1500)
      await route.continue()
    })
    let thinking, talking
    try {
      const respP = H.page.waitForResponse((r) => r.url().includes(`/sessions/${sid}/turn`), { timeout: 30000 })
      await H.P.getByRole('button', { name: 'Send to Pip' }).click()
      thinking = await waitState(H.P, 'thinking', 1200)
      await H.shot('tom-thinking')
      await respP
      talking = await waitState(H.P, 'talking', 2500)
      await H.shot('tom-talking')
    } finally {
      await H.page.unroute('**/api/sessions/*/turn')
    }
    const after = await waitState(H.P, 'idle', 12000)
    return { pass: listening.ok && thinking.ok && talking.ok, listening, thinking, talking, backToIdle: after }
  })
  await H.step('TOM-1 mission pokes: head, belly, sprout each get their line', async () => {
    const r = await pokeAll(H, '.fcap--pip')
    return { pass: Object.values(r).every((x) => x.ok), ...r }
  })
  await H.step('TOM-1 chat: overlay shows the newest lines; the full sheet opens at the newest', async () => {
    for (const t of ['because 2 triangles make a rectangle', 'so 6×4÷2 = 12', 'oh but for a right triangle you just times the two sides']) await sendText(H, sid, t)
    await sleep(700)
    const overlay = await newestVisible(H)
    await H.shot('tom-overlay')
    const f = vp.mobile ? await H.fit('tom-overlay') : { ok: true }
    await H.P.getByRole('button', { name: 'Open the full chat' }).click()
    await sleep(900)
    const sheet = await H.P.evaluate(() => {
      const feed = document.querySelector('.feed--sheet')
      const msgs = feed ? [...feed.querySelectorAll('.msg')] : []
      const last = msgs.at(-1)
      const r = last?.getBoundingClientRect()
      return { open: !!feed && feed.getBoundingClientRect().height > 0, messages: msgs.length, lastText: last?.textContent.trim().slice(0, 60), lastInView: !!r && r.bottom <= innerHeight + 1 && r.top >= 0, scroll: feed ? { top: Math.round(feed.scrollTop), h: feed.scrollHeight, ch: feed.clientHeight } : null }
    })
    await H.shot('tom-sheet')
    const c = await H.contrast('tom-sheet')
    await H.page.keyboard.press('Escape')
    await sleep(400)
    return { pass: overlay.ok && sheet.open && sheet.lastInView && f.ok, overlay, sheet, fit: f, sheetContrast: c.violations }
  })
}

// Registers: default by grade (s001 g6 play, s014 g9 cool, s005 SAT focus) and the Look-sheet switch.
async function runRegisters(H) {
  const { page, vp } = H
  await api('/demo/reset', 'POST')
  for (const [sid, want] of [
    ['s001', 'cool'], // AGE-1: grade 6 now defaults to cool (play only when picked)
    ['s014', 'cool'],
    ['s005', 'focus'],
  ]) {
    await H.step(`register by grade: ${sid} -> ${want}`, async () => {
      await page.goto(`${BASE}/student${sid === 's001' ? '' : `?as=${sid}`}`)
      await H.inApp()
      await H.P.evaluate(() => localStorage.removeItem('pip.audience'))
      await H.P.evaluate(() => location.reload())
      await H.P.locator('.home-mission, .home-current__topic, .drop__desc').first().waitFor({ timeout: 20000 })
      await sleep(900)
      const st = (await api(`/students/${sid}`)).json?.student
      const aud = await registerOf(H.P)
      await H.shot(`register-${want}-home`)
      const o = await H.overflow(`register-${want}-home`)
      const f = vp.mobile ? await H.fit(`register-${want}-home`) : { ok: true }
      const c = await H.contrast(`register-${want}-home`)
      return { pass: aud === want && !o.overflows && f.ok, grade: st?.grade, register: aud, overflow: o.wide, fit: f, contrastViolations: c.violations }
    })
  }
  await H.step('register switch: Look sheet -> Mode', async () => {
    await page.goto(`${BASE}/student`)
    await H.inApp()
    await H.P.locator('.home-mission, .home-current__topic, .drop__desc').first().waitFor({ timeout: 20000 })
    const out = {}
    for (const mode of ['Cool', 'Focus', 'Play']) {
      await H.P.getByRole('button', { name: 'Change Pip’s look' }).click()
      const dlg = H.P.getByRole('dialog', { name: "Pick Pip's look" })
      await dlg.waitFor()
      const radio = dlg.getByRole('radiogroup', { name: 'Mode' }).getByRole('radio', { name: mode })
      if (!(await radio.count())) notBuilt('no Mode switch in the Look sheet')
      await radio.click()
      await dlg.getByRole('button', { name: 'Save look' }).click()
      await sleep(600)
      const aud = await registerOf(H.P)
      const o = await H.overflow(`switch-${mode}`)
      const f = vp.mobile ? await H.fit(`switch-${mode}`) : { ok: true }
      await H.shot(`register-switch-${mode}`)
      out[mode] = { aud, overflow: o.overflows, fit: f.ok }
    }
    await H.P.evaluate(() => localStorage.removeItem('pip.audience'))
    return { pass: Object.entries(out).every(([m, v]) => v.aud === m.toLowerCase() && !v.overflow && v.fit), out }
  })
}

const runs = []
for (const vp of VIEWPORTS) {
  const H = await openRun('student', vp)
  try {
    if (!process.env.SKIP_MAYA) await runMaya(H)
    if (!process.env.SKIP_TOM) await runTom(H)
    await runOwnerTranscript(H)
    await runSecondaryLook(H)
    for (const p of PERSONAS) await runPersona(H, p)
    await runRegisters(H)
    await H.step('44px tap targets on student screens', async () => {
      const list = H.R.smallTargets.filter((t) => t.min === 44)
      const uniq = [...new Map(list.map((t) => [`${t.el}|${t.text}|${t.w}x${t.h}`, t])).values()]
      return { pass: uniq.length === 0, count: uniq.length, small: uniq.slice(0, 12) }
    })
    await H.step('AA contrast on student screens (exam screens pending restyle)', async () => {
      const bad = Object.entries(H.R.contrast).filter(([k, c]) => c.violations > 0 && !EXAM_VISUAL.test(k))
      H.R.notes.examContrastPending = Object.entries(H.R.contrast).filter(([k]) => EXAM_VISUAL.test(k)).map(([k, c]) => [k, c.violations])
      return { pass: bad.length === 0, tool: Object.values(H.R.contrast)[0]?.tool, bad: bad.map(([k, c]) => ({ screen: k, n: c.violations, nodes: c.nodes?.slice(0, 3) })) }
    })
    await hygiene(H)
  } finally {
    runs.push(H.R)
    await H.close()
  }
}
finish('student', runs)
