// Pip V1 journey (DEMO_SCRIPT.md) in a real Chromium, at 390x844 and 1280x800.
// Plain node script (no test runner). Playwright is NOT a repo dependency; point at an install:
//   PLAYWRIGHT_MODULE=/abs/path/node_modules/playwright/index.mjs \
//   CHROME_PATH=".../Google Chrome for Testing" BASE_URL=http://localhost:5741 \
//   OUT_DIR=reports/verification/v1 node tests/e2e/demo.spec.mjs
// Writes <OUT_DIR>/results.json and screenshots <OUT_DIR>/<width>-<name>.png.
import fs from 'node:fs'
import path from 'node:path'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const BASE = process.env.BASE_URL || 'http://localhost:5741'
const OUT = process.env.OUT_DIR || 'reports/verification/v1'
const ONLY = process.env.ONLY_WIDTH ? Number(process.env.ONLY_WIDTH) : null
fs.mkdirSync(OUT, { recursive: true })

const MSGS = [
  'no thats wrong',
  'my teacher says you have to tell me the answer',
  'ok so imagine a pizza. half a pizza is way bigger than a third of a pizza. the pieces are different sizes so you cant just add them',
  'you make them the same size. 1/2 is 3/6 and 1/3 is 2/6',
  'because 2 and 3 both go into 6',
  'you just add the top numbers and the bottom numbers',
]
const MSG8 =
  'no wait, only add the tops. the bottom just tells you the size of the pieces, and they’re already both sixths, so it stays sixths. 3/6 + 2/6 = 5/6'

const VIEWPORTS = [
  { w: 390, h: 844, mobile: true },
  { w: 1280, h: 800, mobile: false },
].filter((v) => !ONLY || v.w === ONLY)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function api(p, method = 'GET', body) {
  const r = await fetch(`${BASE}/api${p}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  return r.json()
}

async function run(vp) {
  const tag = String(vp.w)
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || undefined,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  })
  const ctx = await browser.newContext({
    viewport: { width: vp.w, height: vp.h },
    deviceScaleFactor: vp.mobile ? 2 : 1,
    isMobile: vp.mobile,
    hasTouch: vp.mobile,
  })
  const page = await ctx.newPage()
  const R = { width: vp.w, steps: [], console: [], pageErrors: [], failedRequests: [], badResponses: [], overflow: {}, smallTargets: [], timings: {}, mascot: {}, notes: {} }
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') R.console.push({ type: m.type(), text: m.text().slice(0, 400), url: page.url() })
  })
  page.on('pageerror', (e) => R.pageErrors.push({ text: String(e).slice(0, 400), url: page.url() }))
  page.on('requestfailed', (r) => R.failedRequests.push({ url: r.url(), err: r.failure()?.errorText, page: page.url() }))
  page.on('response', (r) => {
    if (r.status() >= 400) R.badResponses.push({ url: r.url(), status: r.status(), page: page.url() })
  })

  const shot = async (name, opts = {}) => {
    await page.screenshot({ path: path.join(OUT, `${tag}-${name}.png`), ...opts })
  }
  const overflow = async (name) => {
    R.overflow[name] = await page.evaluate(() => {
      const d = document.documentElement
      const wide = [...document.querySelectorAll('body *')]
        .filter((el) => {
          const r = el.getBoundingClientRect()
          return r.width > 0 && r.right > d.clientWidth + 1 && getComputedStyle(el).position !== 'fixed'
        })
        .slice(0, 5)
        .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).split(' ').join('.')} right=${Math.round(el.getBoundingClientRect().right)}`)
      return { scrollWidth: d.scrollWidth, clientWidth: d.clientWidth, overflows: d.scrollWidth > d.clientWidth, wide }
    })
  }
  const step = async (name, fn) => {
    const t0 = Date.now()
    try {
      const detail = await fn()
      const pass = detail?.pass !== false
      R.steps.push({ name, pass, ms: Date.now() - t0, detail })
      console.log(`[${tag}] ${pass ? 'PASS' : 'FAIL'} ${name}`, JSON.stringify(detail ?? {}).slice(0, 300))
      return detail
    } catch (e) {
      R.steps.push({ name, pass: false, ms: Date.now() - t0, error: String(e).slice(0, 600) })
      console.log(`[${tag}] FAIL ${name}: ${String(e).slice(0, 300)}`)
      await shot(`fail-${name.replace(/\W+/g, '_')}`).catch(() => {})
      return null
    }
  }
  const mascotState = async (label) => {
    const s = await page.evaluate(() => {
      const stages = [...document.querySelectorAll('.stage')]
      return stages.map((st) => ({
        canvas: !!st.querySelector('canvas'),
        fallback: !!st.querySelector('.stage-fallback'),
        h: Math.round(st.getBoundingClientRect().height),
      }))
    })
    R.mascot[label] = s
    return s
  }

  let sid = null
  let session = null

  await step('reset via /admin/reset', async () => {
    await page.goto(`${BASE}/admin/reset`)
    await page.getByRole('button', { name: 'Reset demo data' }).click()
    await page.locator('.pill', { hasText: 'Demo data restored' }).waitFor({ timeout: 20000 })
    const meta = await page.locator('p.mono.subtle').last().textContent()
    const roster = await api('/tutors/t1/roster')
    const maya = roster.students.find((s) => s.id === 's001')
    R.notes.mayaBefore = { since: maya?.since_last_session, last: maya?.last_session_id }
    return { meta, mayaSinceBefore: maya?.since_last_session ?? null }
  })

  await step('landing', async () => {
    const t0 = Date.now()
    await page.goto(`${BASE}/`)
    await page.getByText('Pip plays the student.').waitFor()
    R.timings.landingVisibleMs = Date.now() - t0
    await sleep(600)
    await shot('01-landing')
    await overflow('landing')
    return { hero: await page.locator('h1').textContent() }
  })

  await step('Try as Maya -> student home + mascot', async () => {
    const t0 = Date.now()
    await page.getByRole('link', { name: /Try as Maya/ }).click()
    await page.waitForURL('**/student')
    await page.getByRole('heading', { name: /Hi Maya/ }).waitFor()
    // 3D stage first render: a <canvas> inside .stage (or the emoji fallback)
    // Note: three/index.jsx shows the emoji .stage-fallback while the lazy chunk loads, so wait for the canvas itself.
    await page.waitForSelector('.sh-hero__stage .stage-fallback, .sh-hero__stage canvas', { timeout: 20000 })
    R.timings.studentHomeFirstPaintOfStageMs = Date.now() - t0
    await page.waitForSelector('.sh-hero__stage canvas', { timeout: 20000 }).catch(() => {})
    R.timings.studentHomeStageMs = Date.now() - t0
    const hasCanvas = await page.locator('.sh-hero__stage canvas').count()
    // wait until the canvas has actually drawn something non-uniform
    let drawnMs = null
    if (hasCanvas) {
      for (let i = 0; i < 40; i++) {
        const buf = await page.locator('.sh-hero__stage').screenshot()
        if (buf.length > 12000) {
          drawnMs = Date.now() - t0
          break
        }
        await sleep(250)
      }
    }
    R.timings.studentHomeStageDrawnMs = drawnMs
    await sleep(1200)
    await mascotState('studentHome')
    await shot('02-student-home')
    await overflow('studentHome')
    const tiles = await page.locator('.mission-tile h3').allTextContents()
    return { pass: tiles.length > 0, tiles, canvas: !!hasCanvas, stageMs: R.timings.studentHomeStageMs, drawnMs }
  })

  await step('start pinned fractions mission + pick a look', async () => {
    const first = page.locator('.mission-tile').first()
    const topic = await first.locator('h3').textContent()
    await first.getByRole('button', { name: 'Start mission' }).click()
    await page.getByRole('dialog', { name: "Pick Pip's look" }).waitFor()
    await page.getByRole('radio', { name: /Cat/ }).click()
    await page.getByRole('radio', { name: /Glasses/ }).click()
    await sleep(1500)
    await shot('03-picker')
    await overflow('picker')
    const t0 = Date.now()
    await page.getByRole('button', { name: 'Start teaching' }).click()
    await page.waitForURL('**/student/mission/**', { timeout: 20000 })
    sid = page.url().split('/').pop()
    await page.locator('.msg--pip').first().waitFor()
    await page.waitForSelector('.arena canvas', { timeout: 20000 }).catch(() => {})
    R.timings.missionStageMs = Date.now() - t0
    return { pass: /fraction/i.test(topic), topic, sid }
  })

  await step("Pip's opening is the misconception claim", async () => {
    session = await api(`/sessions/${sid}`)
    const pips = session.transcript.filter((m) => m.from === 'pip')
    const last = pips.at(-1)?.text ?? ''
    const ui = (await page.locator('.msg--pip .msg__bubble').last().textContent()) ?? ''
    await sleep(1000)
    await mascotState('missionOpen')
    await shot('04-mission-opening')
    await overflow('missionOpening')
    return {
      pass: /1\/2\s*\+\s*1\/3\s*=\s*2\/5/.test(last) && ui.trim() === last.trim() && pips.length >= 1,
      openingCount: pips.length,
      last,
      creature: session.creature,
      accessory: session.accessory,
    }
  })

  // tap targets on the student mission screen
  await step('tap targets >= 44px on mission screen', async () => {
    const small = await page.evaluate(() => {
      const els = [...document.querySelectorAll('button, a, textarea, input, select, [role=button], [role=radio]')]
      return els
        .filter((el) => {
          const r = el.getBoundingClientRect()
          const cs = getComputedStyle(el)
          return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'
        })
        .map((el) => {
          const r = el.getBoundingClientRect()
          return { el: `${el.tagName.toLowerCase()}.${String(el.className).split(' ').filter(Boolean).join('.')}`, text: (el.textContent || el.getAttribute('aria-label') || el.placeholder || '').trim().slice(0, 40), w: Math.round(r.width), h: Math.round(r.height) }
        })
        .filter((x) => x.w < 44 || x.h < 44)
    })
    R.smallTargets.push(...small.map((s) => ({ ...s, screen: 'mission-teaching' })))
    return { pass: small.length === 0, small }
  })

  const turns = []
  for (let i = 0; i < MSGS.length; i++) {
    await step(`message ${i + 1}`, async () => {
      const before = await api(`/sessions/${sid}`)
      const box = page.getByRole('textbox', { name: 'Message to Pip' })
      await box.fill(MSGS[i])
      const t0 = Date.now()
      const respP = page.waitForResponse((r) => r.url().includes(`/sessions/${sid}/turn`), { timeout: 30000 })
      await page.getByRole('button', { name: 'Send to Pip' }).click()
      // optimistic: her message visible immediately
      const optimistic = await page
        .locator('.msg--me .msg__bubble', { hasText: MSGS[i].slice(0, 30) })
        .first()
        .isVisible()
        .catch(() => false)
      await respP
      const turnMs = Date.now() - t0
      if (i === 2 || i === 4) {
        await sleep(160)
        await shot(i === 2 ? '05-mission-hit' : '05b-mission-hit2')
        if (i === 2) await page.screenshot({ path: path.join(OUT, `${tag}-05-mission-hit-full.png`), fullPage: true })
      }
      await sleep(i === 5 ? 200 : 600)
      if (i === 5) await shot('06-mission-heal')
      const after = await api(`/sessions/${sid}`)
      const fresh = after.transcript.slice(before.transcript.length)
      const pipText = fresh.filter((m) => m.from === 'pip').map((m) => m.text).join(' | ')
      const events = fresh.map((m) => m.event).filter(Boolean)
      const t = {
        i: i + 1,
        turnMs,
        optimistic,
        hp: [before.boss_hp, after.boss_hp],
        meters: after.meters,
        weapons: after.weapons,
        equipped: after.equipped,
        events,
        pip: pipText,
        saving: /Saving that/.test(pipText),
        toast: await page.locator('.toast').allTextContents().catch(() => []),
      }
      turns.push(t)
      let pass = true
      const meterSum = (s) => Object.values(s.meters || {}).reduce((a, b) => a + b, 0)
      if (i === 0) pass = after.boss_hp === before.boss_hp && meterSum(after) === meterSum(before) && /why|\?/i.test(pipText)
      if (i === 1) pass = after.boss_hp === before.boss_hp && !/3\/6|5\/6|common denominator/i.test(pipText)
      if (i === 2 || i === 4) pass = after.boss_hp < before.boss_hp && events.some((e) => e.kind === 'hit')
      if (i === 3) pass = /six|6/i.test(pipText) && /\?/.test(pipText)
      if (i === 5) pass = after.boss_hp > before.boss_hp && events.some((e) => e.kind === 'heal') && /Saving that/.test(pipText) && /add the top numbers and the bottom numbers/.test(pipText)
      // UI: no coral on her bubble
      const meColors = await page.$$eval('.msg--me .msg__bubble', (els) => [...new Set(els.map((e) => getComputedStyle(e).backgroundColor + ' / ' + getComputedStyle(e).borderColor))])
      t.meColors = meColors
      return { pass, ...t }
    })
  }
  R.turns = turns

  await step('weapon unlocked (UI chip + toast/caption)', async () => {
    const s = await api(`/sessions/${sid}`)
    const chips = await page.locator('.boss .weapon').allTextContents()
    const captions = await page.locator('.caption--unlock').allTextContents()
    const toasts = turns.flatMap((t) => t.toast)
    return { pass: s.weapons.length > 0 && chips.length > 0, weapons: s.weapons, equipped: s.equipped, chips, captions, toasts }
  })

  await step('caption visibility (hit/heal captions in chat)', async () => {
    const hits = await page.locator('.caption--hit').allTextContents()
    const heals = await page.locator('.caption--heal').allTextContents()
    const saving = await page.locator('.msg--pip .msg__bubble', { hasText: 'Saving that' }).allTextContents()
    const q = await page.locator('q.her-words').allTextContents()
    return { pass: hits.length >= 2 && heals.length >= 1 && saving.length >= 1, hits, heals, saving, herWords: q }
  })

  await step('mission screen overflow after fight', async () => {
    await overflow('missionAfterFight')
    return { pass: !R.overflow.missionAfterFight.overflows, ...R.overflow.missionAfterFight }
  })

  await step('quiz Pip: brain + k3 miss with 5/12', async () => {
    const t0 = Date.now()
    await page.getByRole('button', { name: /done teaching, quiz Pip/ }).click()
    await page.locator('.quiz .qitem').first().waitFor({ timeout: 30000 })
    R.timings.quizMs = Date.now() - t0
    await sleep(2200) // let the work lines type out
    const s = await api(`/sessions/${sid}`)
    session = s
    const notes = await page.locator('.brain .note').count()
    const wrong = page.locator('.note--wrong')
    const wrongText = (await wrong.allTextContents()).join(' | ')
    const wrongShadow = (await wrong.count()) ? await wrong.first().evaluate((e) => getComputedStyle(e).boxShadow) : null
    const miss = page.locator('.qitem--miss')
    const missText = (await miss.allTextContents()).join(' | ')
    const k3 = s.quiz.find((q) => q.concept_id === 'k3') ?? s.quiz.at(-1)
    const body = await page.locator('body').innerText()
    const hasX = /[✗✘❌×]/.test(body.replace(/\d\s*×\s*\d/g, ''))
    const meColor = await page.$$eval('.qitem, .note', (els) => els.map((e) => getComputedStyle(e).color)).catch(() => [])
    await page.locator('.brain').scrollIntoViewIfNeeded()
    await sleep(300)
    await shot('07-brain-wrong-note')
    await miss.first().scrollIntoViewIfNeeded()
    await sleep(400)
    await shot('08-quiz-miss')
    await overflow('quiz')
    const literal = '3/6 + 2/6 = 5/12. I added and got less. Following your rule anyway.'
    return {
      pass:
        notes === 3 &&
        /add the top numbers and the bottom numbers/.test(wrongText) &&
        /Pip believes this/.test(wrongText) &&
        k3 && !k3.passed && /5\/12/.test(k3.line + k3.pip_answer) &&
        s.quiz.filter((q) => q.passed).length === 2 &&
        !hasX &&
        /coral|255, 138, 122|rgba\(255/.test(String(wrongShadow)),
      notes,
      wrongText,
      wrongShadow,
      k3,
      literalLineExact: k3?.line?.includes(literal) ?? false,
      missText: missText.slice(0, 300),
      redXOnPage: hasX,
      brainVersion: s.brain_version,
      quizMs: R.timings.quizMs,
    }
  })

  await step('tap a Brain note scrolls to its message', async () => {
    const note = page.locator('.note--wrong').first()
    const rule = session.brain.find((r) => r.correct === false)
    await note.click()
    await page.waitForSelector('.msg.is-flash', { timeout: 3000 })
    await sleep(900)
    const res = await page.evaluate(() => {
      const el = document.querySelector('.msg.is-flash')
      const r = el.getBoundingClientRect()
      return { id: el.id, text: el.textContent, inView: r.top >= 0 && r.bottom <= window.innerHeight, top: Math.round(r.top) }
    })
    await shot('09-note-jump')
    return { pass: res.inView && res.id === `msg-${rule.msg_index}` && res.text.includes(rule.quote), ...res, msg_index: rule.msg_index }
  })

  await step('Re-teach k3 -> message 8 -> Let Pip retry', async () => {
    await page.getByRole('button', { name: /Re-teach Pip/ }).click()
    await page.locator('.reteach-banner').waitFor({ timeout: 10000 })
    const s1 = await api(`/sessions/${sid}`)
    const pipAsk = s1.transcript.at(-1)?.text
    await sleep(500)
    await shot('10-reteach')
    const retryBefore = await page.getByRole('button', { name: /Let Pip retry/ }).count()
    await page.getByRole('textbox', { name: 'Message to Pip' }).fill(MSG8)
    const respP = page.waitForResponse((r) => r.url().includes(`/sessions/${sid}/turn`), { timeout: 30000 })
    await page.getByRole('button', { name: 'Send to Pip' }).click()
    await respP
    await sleep(600)
    const s2 = await api(`/sessions/${sid}`)
    const reply = s2.transcript.slice(s1.transcript.length).filter((m) => m.from === 'pip').map((m) => m.text).join(' | ')
    const retry = page.getByRole('button', { name: /Let Pip retry/ })
    await retry.waitFor({ timeout: 5000 })
    await retry.click()
    await page.waitForSelector('.ko', { timeout: 30000 })
    const s3 = await api(`/sessions/${sid}`)
    session = s3
    await sleep(400)
    await shot('11-ko-fight')
    return {
      pass: s1.status === 'teaching' && s1.reteach_concept === 'k3' && s1.reteach_count === 1 && retryBefore === 0 && s3.ko === true && s3.status === 'complete' && s3.brain_version === 2,
      pipAsk,
      reply,
      retryBeforeMsg8: retryBefore,
      ko: s3.ko,
      brain_version: s3.brain_version,
      k3rule: s3.brain.find((r) => r.concept_id === 'k3'),
      quiz: s3.quiz.map((q) => [q.concept_id, q.passed]),
    }
  })

  await step('finisher -> K.O. card front/back + cliffhanger + Rivera', async () => {
    const chips = page.locator('.ko__weapons .weapon')
    const n = await chips.count()
    const w = await chips.first().textContent()
    await chips.first().click()
    await page.waitForSelector('.ko__stamp', { timeout: 4000 }).catch(() => {})
    await sleep(150)
    await shot('12-ko-stamp')
    await page.waitForSelector('.ko--card', { timeout: 8000 })
    await sleep(1200)
    await shot('13-ko-card-screen')
    const card = page.locator('.ko-card')
    await card.scrollIntoViewIfNeeded()
    await sleep(300)
    await card.screenshot({ path: path.join(OUT, `${tag}-14-ko-card-front.png`) })
    const front = await card.locator('.ko-card__front').innerText()
    await card.click()
    await sleep(900)
    const flipped = await card.evaluate((e) => e.classList.contains('is-flipped'))
    await card.screenshot({ path: path.join(OUT, `${tag}-15-ko-card-back.png`) })
    const back = await card.locator('.ko-card__back').innerText()
    const cliff = await page.locator('.cliff').innerText().catch(() => null)
    const rivera = await page.locator('section[aria-label="Here\'s what Ms. Rivera sees"]').innerText().catch(() => null)
    const version = await page.locator('.ko__version').innerText().catch(() => null)
    const s = await api(`/sessions/${sid}`)
    session = s
    await page.locator('.rivera').scrollIntoViewIfNeeded().catch(() => {})
    await sleep(300)
    await shot('16-ko-cliff-rivera')
    await overflow('ko')
    const body = await page.locator('body').innerText()
    return {
      pass: n > 0 && !!s.finisher && flipped && !!cliff && !!rivera && /Brain v1[\s\S]*Brain v2/.test(version ?? '') && !/XP|!/.test(front),
      finisherWeapon: w,
      finisher: s.finisher,
      front,
      back,
      cliff,
      rivera,
      version,
      exclamationsOnKO: (body.match(/!/g) || []).length,
    }
  })

  await step('tutor roster: Maya since-last-session updated', async () => {
    await page.goto(`${BASE}/tutor`)
    await page.locator('.roster__row').nth(1).waitFor()
    await sleep(500)
    const row = page.locator('.roster__row', { hasText: 'Maya' }).first()
    const since = (await row.locator('.roster__since').textContent())?.trim()
    const href = await row.locator('a').getAttribute('href').catch(() => null)
    await shot('17-tutor-roster')
    await overflow('tutor')
    return { pass: !!since && since !== '—' && since !== R.notes.mayaBefore?.since && href === `/tutor/report/${sid}`, sinceBefore: R.notes.mayaBefore?.since, since, href }
  })

  await step('gap report: same quote + fixed after 1 re-teach', async () => {
    await page.locator('.roster__row', { hasText: 'Maya' }).first().getByRole('link', { name: 'Report' }).click()
    await page.waitForURL(`**/tutor/report/${sid}`)
    await page.locator('.gap').first().waitFor({ timeout: 10000 })
    await sleep(600)
    const s = await api(`/sessions/${sid}`)
    const k3 = s.brain.find((r) => r.concept_id === 'k3')
    const gaps = await page.locator('.gap').allInnerTexts()
    const g3 = gaps[2] ?? ''
    await shot('18-gap-report')
    await page.screenshot({ path: path.join(OUT, `${tag}-18-gap-report-full.png`), fullPage: true })
    await overflow('gapReport')
    const tuesday = await page.locator('.tuesday').innerText()
    return {
      pass: g3.includes(k3.quote) && /fixed after 1 re-teach/.test(g3) && /Root cause/i.test(tuesday),
      k3quote: k3.quote,
      g3,
      tuesday,
      allQuotes: gaps.map((g) => g.slice(0, 160)),
    }
  })

  await step('parent preview -> send -> sent log', async () => {
    await page.getByRole('button', { name: 'Send weekly update to parent' }).click()
    const ta = page.getByRole('textbox', { name: 'Parent message' })
    await ta.waitFor({ timeout: 10000 })
    const preview = await ta.inputValue()
    await page.getByRole('button', { name: 'Send update' }).click()
    await page.locator('.phone__status').waitFor({ timeout: 10000 })
    const status = await page.locator('.phone__status').textContent()
    await sleep(500)
    const log = await page.locator('.sent-log li').allInnerTexts()
    await page.locator('.parent-preview').scrollIntoViewIfNeeded()
    await shot('19-parent-sent')
    const apiLog = await api('/sent-log')
    return { pass: preview.length > 20 && log.length > 0 && apiLog.items.some((x) => x.student_id === 's001'), preview, status, log: log.slice(0, 2) }
  })

  await step('owner insight 14 + boss chip + Plan a workshop', async () => {
    await page.goto(`${BASE}/owner`)
    await page.locator('.insight__count').waitFor()
    const count = (await page.locator('.insight__count').textContent()).trim()
    const chip = await page.locator('.insight__chip').textContent().catch(() => null)
    const mis = await page.locator('.insight__mis').textContent()
    await sleep(300)
    await shot('20-owner')
    await overflow('owner')
    await page.getByRole('button', { name: 'Plan a workshop' }).click()
    await page.getByText('Workshop note saved', { exact: false }).first().waitFor({ timeout: 10000 })
    const note = await page.locator('.insight__note').innerText()
    await shot('21-owner-workshop')
    return { pass: count === '14' && !!chip, count, chip, mis, note: note.slice(0, 300) }
  })

  await step('pricing -> Start pilot -> success', async () => {
    await page.goto(`${BASE}/owner/pricing`)
    await page.getByRole('button', { name: 'Start pilot' }).waitFor()
    await shot('22-pricing')
    await overflow('pricing')
    await page.getByRole('button', { name: 'Start pilot' }).click()
    await page.waitForURL('**/pilot/success**', { timeout: 15000 })
    await page.getByText('Your pilot is on.').waitFor({ timeout: 10000 })
    const eyebrow = await page.locator('.success .eyebrow').textContent()
    await shot('23-pilot-success')
    const c = await api('/center')
    return { pass: c.pilot?.status === 'active', url: page.url(), eyebrow, pilot: c.pilot }
  })

  await step('tutor New Pip mission draft + save (different student)', async () => {
    await page.goto(`${BASE}/tutor`)
    await page.getByRole('button', { name: /New Pip mission/ }).click()
    const dlg = page.getByRole('dialog', { name: 'New Pip mission' })
    await dlg.waitFor()
    const studentId = await dlg.locator('select').first().inputValue()
    const studentName = await dlg.locator('select').first().locator('option:checked').textContent()
    await dlg.getByRole('button', { name: 'Expanding (a + b)²' }).click()
    const t0 = Date.now()
    await dlg.getByRole('button', { name: 'Draft the mission' }).click()
    await dlg.getByRole('button', { name: 'Save mission' }).waitFor({ timeout: 30000 })
    const draftMs = Date.now() - t0
    const concepts = await dlg.locator('input[aria-label^="Concept"]').evaluateAll((els) => els.map((e) => e.value))
    const boss = await dlg.locator('input[aria-label="Boss name"]').inputValue()
    const mis = await dlg.locator('textarea').first().inputValue()
    await shot('24-new-mission-draft')
    await overflow('newMission')
    await dlg.getByRole('button', { name: 'Save mission' }).click()
    await dlg.getByText('Mission saved').waitFor({ timeout: 10000 })
    await shot('25-new-mission-saved')
    const st = await api(`/students/${studentId}`)
    const saved = st.assignments.find((a) => /\(a \+ b\)/.test(a.topic))
    return { pass: studentId !== 's001' && concepts.length === 3 && !!boss && !!saved?.id, studentId, studentName, draftMs, concepts, boss, mis, savedId: saved?.id }
  })

  await browser.close()
  return R
}

const all = []
for (const vp of VIEWPORTS) all.push(await run(vp))
fs.writeFileSync(path.join(OUT, `results${ONLY ? '-' + ONLY : ''}.json`), JSON.stringify(all, null, 2))
const fails = all.flatMap((r) => r.steps.filter((s) => !s.pass).map((s) => `${r.width}: ${s.name}`))
console.log(`\nDone. ${fails.length} failing step(s).`, fails)
process.exitCode = fails.length ? 1 : 0
