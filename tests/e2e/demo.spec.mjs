// LEGACY (v1-v3). Superseded by tests/e2e/student.spec.mjs + tutor_owner.spec.mjs + parent.spec.mjs (v4).
// Kept for reference; its selectors (.roster__row, the "Hi Maya" heading, fractions-era checks) predate F3/F16 and no longer match the app.
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
// THEME=night runs the Play screens in Night Arcade (first visit follows prefers-color-scheme).
const THEME = process.env.THEME === 'night' ? 'night' : 'day'
fs.mkdirSync(OUT, { recursive: true })

// DEMO_SCRIPT.md (CONTRACT v3.6): Maya teaches Area of a triangle (a_tri). Turn 1 is level 1 (no damage), turns 2-3
// hit (ready for quiz), turn 4 is the deliberate wrong rule (heal). MSG8 is the re-teach (level 3).
const MSGS = [
  'no its half of that',
  'because 2 triangles make a rectangle',
  'so 6×4÷2 = 12',
  'oh but for a right triangle you just times the two sides',
]
const MSG8 = 'no a right triangle is still half a rectangle so its 10×5÷2 = 25'
const WRONG_RULE = 'for a right triangle you just times the two sides'

// VIEWPORTS=375x667 (comma list) overrides the default pair; widths < 900 run as a phone.
const VIEWPORTS = (process.env.VIEWPORTS
  ? process.env.VIEWPORTS.split(',').map((x) => {
      const [w, h] = x.split('x').map(Number)
      return { w, h, mobile: w < 900 }
    })
  : [
      { w: 390, h: 844, mobile: true },
      { w: 1280, h: 800, mobile: false },
    ]
).filter((v) => !ONLY || v.w === ONLY)

// V3 instrumentation (every frame, incl. the desktop phone-frame iframe): Pip2D mood labels, Boss2D
// state, mouth shape samples while ElevenLabs audio plays vs. silent, audio plays, speechSynthesis calls.
const INSTRUMENT = () => {
  const P = (window.__pip = { moods: [], boss: [], plays: [], synth: [], mouthPlaying: {}, mouthIdle: {}, qmarks: 0 })
  let cur = 0
  const op = HTMLMediaElement.prototype.play
  HTMLMediaElement.prototype.play = function (...a) {
    const rec = { t: Date.now(), mime: String(this.src || '').slice(5, 15), len: String(this.src || '').length }
    P.plays.push(rec)
    this.addEventListener('playing', () => { rec.playing = Date.now(); cur++ }, { once: true })
    const end = () => { if (!rec.end) { rec.end = Date.now(); cur = Math.max(0, cur - 1) } }
    this.addEventListener('ended', end, { once: true })
    this.addEventListener('pause', end, { once: true })
    return op.apply(this, a).then((r) => { rec.ok = true; return r }, (e) => { rec.err = String(e).slice(0, 120); throw e })
  }
  try {
    const sp = window.speechSynthesis.speak.bind(window.speechSynthesis)
    window.speechSynthesis.speak = (u) => { P.synth.push({ t: Date.now(), text: String(u.text).slice(0, 80) }); return sp(u) }
  } catch { /* no synth */ }
  setInterval(() => {
    const svg = document.querySelector('.stage2d__pip svg.pip2d, .stage2d__pip .pip2d-depth')
    const lab = svg?.getAttribute('aria-label')
    if (lab && P.moods.at(-1)?.l !== lab) P.moods.push({ t: Date.now(), l: lab, path: location.pathname })
    const b = document.querySelector('.stage2d__boss svg')
    const bl = b ? b.getAttribute('aria-label') : null
    if (bl && P.boss.at(-1)?.l !== bl) P.boss.push({ t: Date.now(), l: bl, hp: document.querySelector('.stage2d__boss')?.getAttribute('aria-label') })
    const m = svg?.querySelector('.pip2d-eyes')?.nextElementSibling
    if (m) {
      const k = m.tagName + ':' + (m.getAttribute('d') || m.getAttribute('rx') || m.innerHTML.length)
      const bag = cur > 0 ? P.mouthPlaying : P.mouthIdle
      bag[k] = (bag[k] || 0) + 1
    }
    const q = [...document.querySelectorAll('.stage2d *, .home-stage *, .arena *')].filter((e) => e.children.length === 0 && /^[?？❓]$/.test((e.textContent || '').trim()) && e.getBoundingClientRect().width > 0).length
    P.qmarks = Math.max(P.qmarks, q)
  }, 40)
}

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
  const tag = `${vp.w}-${THEME}`
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || undefined,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  })
  const ctx = await browser.newContext({
    viewport: { width: vp.w, height: vp.h },
    deviceScaleFactor: vp.mobile ? 2 : 1,
    isMobile: vp.mobile,
    hasTouch: vp.mobile,
    colorScheme: THEME === 'night' ? 'dark' : 'light',
  })
  await ctx.addInitScript(INSTRUMENT)
  const page = await ctx.newPage()
  // F6: on desktop (>= 900px) the student app runs inside a phone frame (an iframe of the same app).
  // P is the document the current screen lives in: the page, or that iframe.
  let P = page
  const phoneFrame = async () => {
    const el = await page.waitForSelector('.device-scene iframe.device__iframe', { timeout: 20000 })
    const f = await el.contentFrame()
    await f.waitForLoadState('domcontentloaded')
    return f
  }
  const R = { width: vp.w, steps: [], console: [], pageErrors: [], failedRequests: [], badResponses: [], overflow: {}, smallTargets: [], timings: {}, mascot: {}, notes: {} }
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') R.console.push({ type: m.type(), text: m.text().slice(0, 400), url: page.url() })
  })
  page.on('pageerror', (e) => R.pageErrors.push({ text: String(e).slice(0, 400), url: page.url() }))
  page.on('requestfailed', (r) => R.failedRequests.push({ url: r.url(), err: r.failure()?.errorText, page: page.url() }))
  R.tts = []
  page.on('response', async (r) => {
    if (r.status() >= 400) R.badResponses.push({ url: r.url(), status: r.status(), page: page.url() })
    if (r.url().endsWith('/api/tts')) {
      const rec = { status: r.status(), t: Date.now() }
      R.tts.push(rec)
      try {
        const j = await r.json()
        rec.fallback = !!j.fallback
        rec.audioB64 = j.audio_b64 ? j.audio_b64.length : 0
        rec.mime = j.mime
        rec.alignChars = j.alignment?.characters?.length ?? 0
        rec.alignEnd = j.alignment?.character_end_times_seconds?.at(-1) ?? null
        rec.text = JSON.parse(r.request().postData() || '{}').text?.slice(0, 80)
      } catch (e) {
        rec.err = String(e).slice(0, 100)
      }
    }
  })

  const shot = async (name, opts = {}) => {
    await page.screenshot({ path: path.join(OUT, `${tag}-${name}.png`), ...opts })
  }
  const overflow = async (name) => {
    R.overflow[name] = await P.evaluate(() => {
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
  // Play screens fit one viewport at 390x844 (coordinator rule, F3): no page scroll.
  R.fit = {}
  const fit = async (name) => {
    if (!vp.mobile) return
    R.fit[name] = await P.evaluate(() => ({ scrollHeight: document.scrollingElement.scrollHeight, innerHeight: window.innerHeight }))
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
    const s = await P.evaluate(() => {
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

  R.instrument = {}
  const collect = async (label) => {
    for (const f of page.frames()) {
      try {
        const d = await f.evaluate(() => window.__pip)
        if (d && (d.moods.length || d.plays.length || d.synth.length)) R.instrument[`${label} ${f.url().replace(BASE, '')}`] = d
      } catch { /* detached */ }
    }
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
    // F6: the phone landing is an app welcome screen with a "Student" gel; desktop keeps "Try as Maya".
    await page.getByRole('link', { name: /Try as Maya|^Student$/ }).click()
    await page.waitForURL('**/student')
    if (!vp.mobile) P = await phoneFrame()
    await P.getByRole('heading', { name: /Hi Maya/ }).waitFor()
    // 3D stage first render: a <canvas> inside .stage (or the emoji fallback)
    // Note: three/index.jsx shows the emoji .stage-fallback while the lazy chunk loads, so wait for the canvas itself.
    // F3: the home is a one-screen title screen; Pip's room stage is .home-stage__room (was .sh-hero__stage).
    // Coordinator decision: the mascot is 2D SVG (.pip2d) by default; 3D (canvas) only with ?mascot=3d.
    await P.waitForSelector('.home-stage__room .pip2d, .home-stage__room .stage-fallback, .home-stage__room canvas', { timeout: 20000 })
    R.timings.studentHomeFirstPaintOfStageMs = Date.now() - t0
    await P.waitForSelector('.home-stage__room canvas', { timeout: 20000 }).catch(() => {})
    R.timings.studentHomeStageMs = Date.now() - t0
    const hasCanvas = await P.locator('.home-stage__room canvas').count()
    // wait until the canvas has actually drawn something non-uniform
    let drawnMs = null
    if (hasCanvas) {
      for (let i = 0; i < 40; i++) {
        const buf = await P.locator('.home-stage__room').screenshot()
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
    await fit('studentHome')
    const tiles = await P.locator('.mission-tile h3').allTextContents()
    return { pass: tiles.length > 0, tiles, canvas: !!hasCanvas, stageMs: R.timings.studentHomeStageMs, drawnMs }
  })

  await step('start pinned triangle mission + pick a look', async () => {
    const first = P.locator('.mission-tile').first()
    const topic = await first.locator('h3').textContent()
    // F4: the home is a title screen; the current mission starts from the PLAY gel.
    await first.getByRole('button', { name: /^play$/i }).click()
    await P.getByRole('dialog', { name: "Pick Pip's look" }).waitFor()
    await P.getByRole('radio', { name: new RegExp(process.env.CREATURE || 'Cat') }).click()
    await P.getByRole('radio', { name: /Glasses/ }).click()
    await sleep(1500)
    await shot('03-picker')
    await overflow('picker')
    const t0 = Date.now()
    await P.getByRole('button', { name: 'Start teaching' }).click()
    await P.waitForURL('**/student/mission/**', { timeout: 20000 })
    sid = P.url().split('?')[0].split('/').pop()
    await P.locator('.msg--pip').first().waitFor()
    await P.waitForSelector('.arena canvas', { timeout: 20000 }).catch(() => {})
    R.timings.missionStageMs = Date.now() - t0
    return { pass: /triangle/i.test(topic), topic, sid }
  })

  await step("Pip's opening is the misconception claim", async () => {
    session = await api(`/sessions/${sid}`)
    const pips = session.transcript.filter((m) => m.from === 'pip')
    const last = pips.at(-1)?.text ?? ''
    const ui = (await P.locator('.msg--pip .msg__bubble').last().textContent()) ?? ''
    await sleep(1000)
    await mascotState('missionOpen')
    await shot('04-mission-opening')
    await overflow('missionOpening')
    await fit('missionOpening')
    return {
      pass: /base times height/i.test(last) && /24/.test(last) && ui.trim() === last.trim() && pips.length >= 1,
      openingCount: pips.length,
      last,
      creature: session.creature,
      accessory: session.accessory,
    }
  })

  // tap targets on the student mission screen
  await step('tap targets >= 44px on mission screen', async () => {
    const small = await P.evaluate(() => {
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
  const fightVis = {}
  R.fightVis = fightVis
  for (let i = 0; i < MSGS.length; i++) {
    await step(`message ${i + 1}`, async () => {
      const before = await api(`/sessions/${sid}`)
      const box = P.getByRole('textbox', { name: 'Message to Pip' })
      await box.fill(MSGS[i])
      const t0 = Date.now()
      const respP = page.waitForResponse((r) => r.url().includes(`/sessions/${sid}/turn`), { timeout: 30000 })
      await P.getByRole('button', { name: 'Send to Pip' }).click()
      // optimistic: her message visible immediately
      const optimistic = await page
        .locator('.msg--me .msg__bubble', { hasText: MSGS[i].slice(0, 30) })
        .first()
        .isVisible()
        .catch(() => false)
      const resp = await respP
      const turnMs = Date.now() - t0
      // The reply renders after the voice prefetch (<= 1.2 s): wait for Pip's newest line on the stage.
      try {
        const js = await resp.json()
        const lastPip = (js.transcript ?? []).filter((m) => m.from === 'pip').at(-1)?.text ?? ''
        const tail = lastPip.replace(/[‘’'“”"]/g, '').trim().slice(-14)
        await P.waitForFunction((t) => (document.querySelector('.speech .bubble__text')?.textContent ?? '').replace(/[‘’'“”"]/g, '').includes(t), tail, { timeout: 5000 })
      } catch { /* checked by the step below */ }
      const renderMs = Date.now() - t0 - turnMs
      if (i === 1 || i === 2) {
        await sleep(160)
        // Fight visibility: HP bar (HUD or boss panel), the 3D arena and Pip must be on screen during a hit.
        fightVis[i] = await P.evaluate(() => {
          const vh = window.innerHeight
          const vis = (el) => {
            if (!el) return 0
            const r = el.getBoundingClientRect()
            if (!r.height || getComputedStyle(el).visibility === 'hidden') return 0
            return Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0)) / r.height
          }
          const hps = [...document.querySelectorAll('.hp__track')].map(vis)
          const arena = document.querySelector('.arena canvas') ?? document.querySelector('.arena')
          return { hpVisible: Math.max(0, ...hps), arenaVisible: vis(arena), arenaCanvas: !!document.querySelector('.arena canvas') }
        })
        await shot(i === 1 ? '05-mission-hit' : '05b-mission-hit2')
        if (i === 1) await page.screenshot({ path: path.join(OUT, `${tag}-05-mission-hit-full.png`), fullPage: true })
      }
      await sleep(i === 3 ? 200 : 600)
      if (i === 3) await shot('06-mission-heal')
      const after = await api(`/sessions/${sid}`)
      const fresh = after.transcript.slice(before.transcript.length)
      const pipText = fresh.filter((m) => m.from === 'pip').map((m) => m.text).join(' | ')
      const events = fresh.map((m) => m.event).filter(Boolean)
      const t = {
        i: i + 1,
        turnMs,
        renderMs,
        optimistic,
        hp: [before.boss_hp, after.boss_hp],
        meters: after.meters,
        weapons: after.weapons,
        equipped: after.equipped,
        events,
        pip: pipText,
        saving: /Saving that/.test(pipText),
        toast: await P.locator('.toast').allTextContents().catch(() => []),
      }
      turns.push(t)
      let pass = true
      const meterSum = (s) => Object.values(s.meters || {}).reduce((a, b) => a + b, 0)
      // Turn 1: level 1 (procedure, no reason): no damage, Pip asks why.
      if (i === 0) pass = after.boss_hp === before.boss_hp && events.every((e) => e.kind !== 'hit') && /\?/.test(pipText)
      // Turns 2-3: real reasons: hits.
      if (i === 1 || i === 2) {
        pass = after.boss_hp < before.boss_hp && events.some((e) => e.kind === 'hit') && /\?|quiz me/i.test(pipText)
        t.fightVisible = fightVis[i]
        // laptop: HP bar fully visible and >= 90% of the arena (Pip + boss) in view
        if (vp.w >= 1024) pass = pass && fightVis[i].hpVisible >= 0.99 && fightVis[i].arenaVisible >= 0.9
        else pass = pass && fightVis[i].hpVisible >= 0.99
      }
      // Turn 4: the deliberate wrong rule: the boss heals and Pip files it verbatim.
      if (i === 3) pass = after.boss_hp > before.boss_hp && events.some((e) => e.kind === 'heal') && /Saving that/.test(pipText) && pipText.includes(WRONG_RULE)
      // UI: no coral on her bubble
      const meColors = await P.$$eval('.msg--me .msg__bubble', (els) => [...new Set(els.map((e) => getComputedStyle(e).backgroundColor + ' / ' + getComputedStyle(e).borderColor))])
      t.meColors = meColors
      return { pass, ...t }
    })
  }
  R.turns = turns

  await step('weapon unlocked (UI chip + toast/caption)', async () => {
    const s = await api(`/sessions/${sid}`)
    const chips = await P.locator('.tray .weapon').allTextContents() // F4: weapons live in the bottom tray
    const captions = await P.locator('.caption--unlock').allTextContents()
    const toasts = turns.flatMap((t) => t.toast)
    return { pass: s.weapons.length > 0 && chips.length > 0, weapons: s.weapons, equipped: s.equipped, chips, captions, toasts }
  })

  await step('caption visibility (hit/heal captions in chat)', async () => {
    const hits = await P.locator('.caption--hit').allTextContents()
    const heals = await P.locator('.caption--heal').allTextContents()
    const saving = await P.locator('.msg--pip .msg__bubble', { hasText: 'Saving that' }).allTextContents()
    const q = await P.locator('q.her-words').allTextContents()
    return { pass: hits.length >= 2 && heals.length >= 1 && saving.length >= 1, hits, heals, saving, herWords: q }
  })

  await step('mission screen overflow after fight', async () => {
    await overflow('missionAfterFight')
    await fit('missionAfterFight')
    return { pass: !R.overflow.missionAfterFight.overflows, ...R.overflow.missionAfterFight }
  })

  await step('quiz Pip: brain + k3 miss with 5/12', async () => {
    const t0 = Date.now()
    await P.getByRole('button', { name: /Quiz Pip/ }).click() // F4 label: "Quiz Pip ▶"
    await P.locator('.quiz .qitem').first().waitFor({ timeout: 30000 })
    R.timings.quizMs = Date.now() - t0
    await sleep(2200) // let the work lines type out
    const s = await api(`/sessions/${sid}`)
    session = s
    const notes = await P.locator('.brain .note').count()
    const wrong = P.locator('.note--wrong')
    const wrongText = (await wrong.allTextContents()).join(' | ')
    const wrongShadow = (await wrong.count()) ? await wrong.first().evaluate((e) => getComputedStyle(e).boxShadow) : null
    const miss = P.locator('.qitem--miss')
    const missText = (await miss.allTextContents()).join(' | ')
    const k3 = s.quiz.find((q) => q.concept_id === 'k3') ?? s.quiz.at(-1)
    const body = await P.locator('body').innerText()
    const hasX = /[✗✘❌×]/.test(body.replace(/[\w½]\s*×\s*[\w(]/g, ''))
    const meColor = await P.$$eval('.qitem, .note', (els) => els.map((e) => getComputedStyle(e).color)).catch(() => [])
    await P.locator('.brain').scrollIntoViewIfNeeded()
    await sleep(300)
    await shot('07-brain-wrong-note')
    await miss.first().scrollIntoViewIfNeeded()
    await sleep(400)
    await shot('08-quiz-miss')
    await overflow('quiz')
    await fit('quiz')
    const literal = 'Following your rule anyway.'
    return {
      pass:
        notes >= 2 &&
        wrongText.includes(WRONG_RULE) &&
        /Pip believes this/.test(wrongText) &&
        k3 && !k3.passed && /50/.test(k3.line + k3.pip_answer) &&
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
    const note = P.locator('.note--wrong').first()
    const rule = session.brain.find((r) => r.correct === false)
    await note.click()
    await P.waitForSelector('.msg.is-flash', { timeout: 3000 })
    // smooth scroll can travel ~1500px at 390; wait until it settles in view (max 2s) instead of a fixed 900ms
    await page
      .waitForFunction(() => {
        const r = document.querySelector('.msg.is-flash')?.getBoundingClientRect()
        return r && r.top >= 0 && r.bottom <= window.innerHeight
      }, null, { timeout: 2000 })
      .catch(() => {})
    const res = await P.evaluate(() => {
      const el = document.querySelector('.msg.is-flash')
      const r = el.getBoundingClientRect()
      return { id: el.id, text: el.textContent, inView: r.top >= 0 && r.bottom <= window.innerHeight, top: Math.round(r.top) }
    })
    await shot('09-note-jump')
    // F3: the message opens in the history drawer; close it before the next action.
    await page.keyboard.press('Escape')
    await sleep(400)
    return { pass: res.inView && res.id === `msg-${rule.msg_index}` && res.text.includes(rule.quote), ...res, msg_index: rule.msg_index }
  })

  await step('Re-teach k3 -> message 8 -> Let Pip retry', async () => {
    await P.getByRole('button', { name: /Re-teach Pip/ }).click()
    await P.locator('.reteach-banner').waitFor({ timeout: 10000 })
    const s1 = await api(`/sessions/${sid}`)
    const pipAsk = s1.transcript.at(-1)?.text
    await sleep(500)
    await shot('10-reteach')
    await fit('reteach')
    const retryBefore = await P.getByRole('button', { name: /Let Pip retry/ }).count()
    await P.getByRole('textbox', { name: 'Message to Pip' }).fill(MSG8)
    const respP = page.waitForResponse((r) => r.url().includes(`/sessions/${sid}/turn`), { timeout: 30000 })
    await P.getByRole('button', { name: 'Send to Pip' }).click()
    await respP
    await sleep(600)
    const s2 = await api(`/sessions/${sid}`)
    const reply = s2.transcript.slice(s1.transcript.length).filter((m) => m.from === 'pip').map((m) => m.text).join(' | ')
    const retry = P.getByRole('button', { name: /Let Pip retry/ })
    await retry.waitFor({ timeout: 5000 })
    await retry.click()
    await P.waitForSelector('.ko', { timeout: 30000 })
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
    const chips = P.locator('.ko__weapons .weapon')
    const n = await chips.count()
    const w = await chips.first().textContent()
    await chips.first().click()
    await P.waitForSelector('.ko__stamp', { timeout: 4000 }).catch(() => {})
    await sleep(150)
    await shot('12-ko-stamp')
    // F11: the runway walk and "The new look." beat come before the card (tap or ~3.6s).
    await P.waitForSelector('.ko--card', { timeout: 15000 })
    await sleep(1200)
    await shot('13-ko-card-screen')
    await fit('koCard')
    const card = P.locator('.ko-card')
    await card.scrollIntoViewIfNeeded()
    await sleep(300)
    await card.screenshot({ path: path.join(OUT, `${tag}-14-ko-card-front.png`) })
    const front = await card.locator('.ko-card__front').innerText()
    await card.click()
    await sleep(900)
    const flipped = await card.evaluate((e) => e.classList.contains('is-flipped'))
    await card.screenshot({ path: path.join(OUT, `${tag}-15-ko-card-back.png`) })
    const back = await card.locator('.ko-card__back').innerText()
    const cliff = await P.locator('.cliff').innerText().catch(() => null)
    const rivera = await P.locator('section[aria-label="Here\'s what Ms. Rivera sees"]').innerText().catch(() => null)
    const version = await P.locator('.ko__version').innerText().catch(() => null)
    const s = await api(`/sessions/${sid}`)
    session = s
    await P.locator('.rivera').scrollIntoViewIfNeeded().catch(() => {})
    await sleep(300)
    await shot('16-ko-cliff-rivera')
    await overflow('ko')
    const body = await P.locator('body').innerText()
    return {
      pass: n > 0 && !!s.finisher && flipped && !!cliff && !!rivera && /Brain v1[\s\S]*Brain v2/.test(version ?? '') && !/XP|!/.test(front) && /b\s*×\s*h/.test(front), // a_tri: the card strikes A = b × h
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

  if (vp.mobile) {
    await step(`Play screens fit one viewport (no page scroll at ${vp.w}x${vp.h})`, async () => {
      const bad = Object.entries(R.fit).filter(([, v]) => v.scrollHeight > v.innerHeight + 1)
      return { pass: Object.keys(R.fit).length >= 6 && bad.length === 0, fit: R.fit, bad: bad.map(([k]) => k) }
    })
  }

  await collect('student')
  await step('tutor roster: Maya since-last-session updated', async () => {
    P = page
    // The tutor Studio (staff-frontend agent, F16) replaced the old roster rows: check Maya is listed with
    // her new session, then open the report by URL below.
    await page.goto(`${BASE}/tutor`)
    await page.getByText('Maya', { exact: false }).first().waitFor({ timeout: 20000 })
    await sleep(500)
    await shot('17-tutor-roster')
    await overflow('tutor')
    const roster = await api('/tutors/t1/roster')
    const maya = roster.students?.find((s) => s.id === 's001')
    const since = maya?.since_last_session ?? null
    return { pass: !!since && since !== R.notes.mayaBefore?.since && maya?.last_session_id === sid, sinceBefore: R.notes.mayaBefore?.since, since, last: maya?.last_session_id }
  })

  await step('gap report: same quote + fixed after 1 re-teach', async () => {
    await page.goto(`${BASE}/tutor/report/${sid}`)
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

  await collect('end')
  await browser.close()
  return R
}

const all = []
for (const vp of VIEWPORTS) all.push(await run(vp))
fs.writeFileSync(path.join(OUT, `results-${THEME}${ONLY ? '-' + ONLY : ''}.json`), JSON.stringify(all, null, 2))
const fails = all.flatMap((r) => r.steps.filter((s) => !s.pass).map((s) => `${r.width}: ${s.name}`))
console.log(`\nDone. ${fails.length} failing step(s).`, fails)
process.exitCode = fails.length ? 1 : 0
