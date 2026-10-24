// Pip V3 feature checks (verifier): 2D mascots, Boss2D states, voice (live / mute / fallback), phone frame + PWA,
// at-risk, lesson editing, stuck, SAT missions via the student switch, out-of-scope parking, no-scroll + taps.
// Plain node script. Uses its own backend (reset at start) so it can run beside demo.spec.mjs.
//   PLAYWRIGHT_MODULE=.../playwright/index.mjs CHROME_PATH=... BASE_URL=http://localhost:5782 \
//   LESSONS_DIR=backend/seed/lessons OUT_DIR=reports/verification/v3/features ONLY=voice,sat node tests/e2e/v3-features.mjs
import fs from 'node:fs'
import path from 'node:path'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const BASE = process.env.BASE_URL || 'http://localhost:5782'
const OUT = process.env.OUT_DIR || 'reports/verification/v3/features'
const LESSONS = process.env.LESSONS_DIR || 'backend/seed/lessons'
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null
fs.mkdirSync(OUT, { recursive: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const CREATURES = ['capybara', 'corgi', 'cat', 'raccoon', 'frog', 'axolotl']
const VIBES = ['cute', 'cool', 'ugly']
const VIBE_LABEL = { cute: 'Cute', cool: 'Cool', ugly: 'Ugly-cute' }

async function api(p, method = 'GET', body) {
  const r = await fetch(`${BASE}/api${p}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  return r.json()
}

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

const RESULTS = {}
let browser

async function newPage(name, { w = 390, h = 844, theme = 'day', mobile = w < 900, setup } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: mobile ? 2 : 1,
    isMobile: mobile,
    hasTouch: mobile,
    colorScheme: theme === 'night' ? 'dark' : 'light',
  })
  await ctx.addInitScript(INSTRUMENT)
  if (setup) await setup(ctx)
  const page = await ctx.newPage()
  const R = { console: [], pageErrors: [], failedRequests: [], badResponses: [], tts: [], checks: [] }
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') R.console.push({ type: m.type(), text: m.text().slice(0, 300) })
  })
  page.on('pageerror', (e) => R.pageErrors.push(String(e).slice(0, 300)))
  page.on('requestfailed', (r) => R.failedRequests.push({ url: r.url(), err: r.failure()?.errorText }))
  page.on('response', async (r) => {
    if (r.status() >= 400) R.badResponses.push({ url: r.url(), status: r.status() })
    if (r.url().endsWith('/api/tts')) {
      const rec = { status: r.status(), t: Date.now() }
      R.tts.push(rec)
      try {
        const j = await r.json()
        Object.assign(rec, { fallback: !!j.fallback, audioB64: j.audio_b64?.length ?? 0, mime: j.mime, alignChars: j.alignment?.characters?.length ?? 0, alignEnd: j.alignment?.character_end_times_seconds?.at(-1) ?? null })
        rec.text = JSON.parse(r.request().postData() || '{}').text?.slice(0, 70)
      } catch (e) {
        rec.err = String(e).slice(0, 80)
      }
    }
  })
  RESULTS[name] = R
  const check = (label, pass, detail) => {
    R.checks.push({ label, pass: !!pass, detail })
    console.log(`[${name}] ${pass ? 'PASS' : 'FAIL'} ${label}`, JSON.stringify(detail ?? '').slice(0, 260))
  }
  const shot = (n, el) => (el ? el.screenshot({ path: path.join(OUT, `${name}-${n}.png`) }) : page.screenshot({ path: path.join(OUT, `${name}-${n}.png`) }))
  return { ctx, page, R, check, shot }
}

// Page-level checks for a Play screen: no page scroll, nothing pressable clipped off-screen, tap targets.
async function screenFacts(P) {
  return P.evaluate(() => {
    const se = document.scrollingElement
    const vh = window.innerHeight
    const vw = window.innerWidth
    const vis = (el) => {
      const r = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && !el.closest('[aria-hidden="true"], [inert]')
    }
    // ignore elements inside containers that scroll on their own (sheets, pagers, trays)
    const inScroller = (el) => {
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const cs = getComputedStyle(p)
        if (/(auto|scroll)/.test(cs.overflowY + cs.overflowX) && (p.scrollHeight > p.clientHeight + 1 || p.scrollWidth > p.clientWidth + 1)) return true
      }
      return false
    }
    const ctrls = [...document.querySelectorAll('button, a[href], textarea, input, select, [role=button], [role=radio]')].filter(vis)
    const small = ctrls
      .map((el) => {
        const r = el.getBoundingClientRect()
        return { el: `${el.tagName.toLowerCase()}.${String(el.className).split(' ').filter(Boolean).slice(0, 3).join('.')}`, text: (el.getAttribute('aria-label') || el.textContent || el.placeholder || '').trim().slice(0, 30), w: Math.round(r.width), h: Math.round(r.height) }
      })
      .filter((x) => x.w < 44 || x.h < 44)
    const clipped = ctrls
      .filter((el) => !inScroller(el))
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.bottom > vh + 1 || r.top < -1 || r.right > vw + 1 || r.left < -1)
      .map(({ el, r }) => ({ text: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30), top: Math.round(r.top), bottom: Math.round(r.bottom) }))
    return { scrollHeight: se.scrollHeight, innerHeight: vh, scrolls: se.scrollHeight > vh + 1 || se.scrollWidth > vw + 1, small, clipped }
  })
}

async function phone(page, w) {
  if (w < 900) return page
  const el = await page.waitForSelector('iframe.device__iframe', { timeout: 20000 })
  const f = await el.contentFrame()
  await f.waitForLoadState('domcontentloaded')
  return f
}

async function openPicker(P) {
  await P.locator('.home-play').first().waitFor({ timeout: 20000 })
  await P.locator('.home-play').first().click()
  await P.getByRole('dialog', { name: "Pick Pip's look" }).waitFor()
}

async function sendTurn(page, P, text, sid) {
  await P.getByRole('textbox', { name: 'Message to Pip' }).fill(text)
  const respP = page.waitForResponse((r) => r.url().includes(`/sessions/${sid}/turn`), { timeout: 30000 })
  await P.getByRole('button', { name: 'Send to Pip' }).click()
  const resp = await respP
  const js = await resp.json()
  const lastPip = (js.transcript ?? []).filter((m) => m.from === 'pip').at(-1)?.text ?? ''
  const tail = lastPip.replace(/[‘’'“”"]/g, '').trim().slice(-14)
  await P.waitForFunction((t) => (document.querySelector('.speech .bubble__text')?.textContent ?? '').replace(/[‘’'“”"]/g, '').includes(t), tail, { timeout: 6000 }).catch(() => {})
  return js
}

/* ---------------------------------------------------------------- scenarios */

const scenarios = {
  // 1. Picker: 6 animals x 3 vibes as Pip2D thumbnails; day + night; 375x667 too.
  async picker() {
    for (const [w, h, theme] of [[390, 844, 'day'], [390, 844, 'night'], [375, 667, 'day']]) {
      await api('/demo/reset', 'POST')
      const { page, check, shot, ctx } = await newPage(`picker-${w}-${theme}`, { w, h, theme })
      await page.goto(`${BASE}/student`)
      await openPicker(page)
      const dlg = page.getByRole('dialog', { name: "Pick Pip's look" })
      for (const v of VIBES) {
        await dlg.getByRole('radio', { name: new RegExp(`^${VIBE_LABEL[v]}$|${VIBE_LABEL[v]}`) }).first().click()
        await sleep(500)
        const thumbs = await dlg.locator('[role=radiogroup][aria-label=Creature] svg').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')))
        const stage = await dlg.locator('.picker__stage svg.pip2d').first().getAttribute('aria-label').catch(() => null)
        const facts = await screenFacts(page)
        check(`${v}: 6 animal thumbnails`, thumbs.length === 6 && CREATURES.every((c) => thumbs.some((t) => t?.includes(c))), { thumbs, stage })
        check(`${v}: no page scroll with picker open`, !facts.scrolls, { sh: facts.scrollHeight, ih: facts.innerHeight })
        if (v === 'cute') check('picker tap targets >= 44', facts.small.length === 0, facts.small)
        await shot(v)
      }
      await ctx.close()
    }
  },

  // 2. Mission stage: every animal x vibe renders (Pip2D + Boss2D), no '?' glyph.
  async stage18() {
    await api('/demo/reset', 'POST')
    const { page, check, shot, ctx } = await newPage('stage18', { w: 390, h: 844 })
    const rows = []
    for (const c of CREATURES) {
      for (const v of VIBES) {
        const s = await api('/sessions', 'POST', { assignment_id: 'a_frac', student_id: 's001', look: 'doodle', creature: c, accessory: 'glasses', vibe: v })
        await page.goto(`${BASE}/student/mission/${s.id}`)
        await page.waitForSelector('.stage2d__pip svg.pip2d', { timeout: 15000 })
        await page.waitForSelector('.stage2d__boss svg', { timeout: 15000 }).catch(() => {})
        await sleep(350)
        const d = await page.evaluate(() => ({
          pip: document.querySelector('.stage2d__pip svg.pip2d')?.getAttribute('aria-label'),
          nodes: document.querySelector('.stage2d__pip svg.pip2d')?.querySelectorAll('*').length,
          boss: document.querySelector('.stage2d__boss svg')?.getAttribute('aria-label'),
          qmarks: window.__pip.qmarks,
          canvas: !!document.querySelector('.arena canvas'),
        }))
        rows.push({ c, v, session: { creature: s.creature, vibe: s.vibe }, ...d })
        await shot(`${c}-${v}`, page.locator('.game-stage'))
      }
    }
    check('18 sessions keep creature+vibe', rows.every((r) => r.session.creature === r.c && r.session.vibe === r.v), rows.map((r) => `${r.c}/${r.v}->${r.session.creature}/${r.session.vibe}`))
    check('Pip2D renders each animal on the mission stage', rows.every((r) => r.pip?.includes(r.c) && r.nodes > 40), rows.map((r) => `${r.c}/${r.v}: ${r.pip} (${r.nodes})`))
    check('Boss2D renders on every stage', rows.every((r) => r.boss), [...new Set(rows.map((r) => r.boss))])
    check('no floating ? glyph, no WebGL canvas', rows.every((r) => !r.qmarks && !r.canvas), rows.filter((r) => r.qmarks || r.canvas))
    RESULTS.stage18.rows = rows
    await ctx.close()
  },

  // 3. Boss2D: smug -> cracked (HP <= 40) in the mission -> K.O. beats; Pip moods along the way.
  async boss() {
    await api('/demo/reset', 'POST')
    const { page, check, shot, ctx, R } = await newPage('boss', { w: 390, h: 844 })
    await page.goto(`${BASE}/student`)
    await openPicker(page)
    await page.getByRole('button', { name: 'Start teaching' }).click()
    await page.waitForURL('**/student/mission/**')
    const sid = page.url().split('?')[0].split('/').pop()
    await page.locator('.stage2d__boss svg').waitFor({ timeout: 15000 })
    const msgs = [
      'ok so imagine a pizza. half a pizza is way bigger than a third of a pizza. the pieces are different sizes so you cant just add them',
      'because 2 and 3 both go into 6',
      'no wait, only add the tops. the bottom just tells you the size of the pieces, and they’re already both sixths, so it stays sixths. 3/6 + 2/6 = 5/6',
    ]
    const hp = []
    for (const m of msgs) {
      const s = await sendTurn(page, page, m, sid)
      await sleep(500)
      hp.push({ hp: s.boss_hp, boss: await page.locator('.stage2d__boss svg').getAttribute('aria-label') })
    }
    await shot('cracked-mission')
    check('Boss2D smug while HP > 40, cracked at HP <= 40', hp.every((x) => (x.hp > 40 ? /smug/.test(x.boss) : /cracked/.test(x.boss))) && hp.some((x) => x.hp <= 40), hp)
    await page.getByRole('button', { name: /Quiz Pip/ }).click()
    await page.waitForSelector('.ko, .quiz .qitem, .exam-page', { timeout: 30000 })
    const s = await api(`/sessions/${sid}`)
    if (!s.ko) {
      check('quiz all passed for K.O. path', false, s.quiz?.map((q) => [q.concept_id, q.passed]))
    }
    await page.waitForSelector('.ko', { timeout: 10000 })
    await sleep(500)
    const fight = await page.locator('.stage2d__boss svg').getAttribute('aria-label').catch(() => null)
    const pipFight = await page.locator('.stage2d__pip svg').first().getAttribute('aria-label').catch(() => null)
    await shot('ko-fight')
    await page.locator('.ko__weapons .weapon').first().click()
    await sleep(700)
    const ko = await page.locator('.stage2d__boss svg').getAttribute('aria-label').catch(() => null)
    await shot('ko-stamp')
    check('K.O. beat: boss cracked at fight, KO after finisher', /cracked/.test(fight ?? '') && /ko/i.test(ko ?? ''), { fight, ko, pipFight })
    await page.waitForSelector('.ko--card', { timeout: 10000 })
    // cliffhanger beat: Pip awakened
    const nextBtn = page.getByRole('button', { name: /Next/ }).last()
    await nextBtn.click().catch(() => {})
    await sleep(900)
    await shot('ko-cliff')
    const cliffPip = await page.locator('.ko-beat--cliff svg.pip2d').first().getAttribute('aria-label').catch(() => null)
    const awakened = await page.locator('.ko-beat--cliff svg.pip2d').first().evaluate((e) => !!e.querySelector('.pip2d-glow')).catch(() => null)
    check('cliffhanger Pip is awakened (aura)', !!awakened, { cliffPip })
    const moods = await page.evaluate(() => window.__pip.moods.map((m) => m.l.replace(/^Pip the \w+ looks /, '')))
    R.moods = moods
    R.bossTrail = await page.evaluate(() => window.__pip.boss.map((b) => b.l))
    await ctx.close()
  },

  // 4. Voice: live ElevenLabs audio + alignment, mouth moves while audio plays, mute stops requests.
  async voice() {
    await api('/demo/reset', 'POST')
    const { page, check, shot, ctx, R } = await newPage('voice', { w: 390, h: 844 })
    await page.goto(`${BASE}/student`)
    await openPicker(page)
    await page.getByRole('button', { name: 'Start teaching' }).click()
    await page.waitForURL('**/student/mission/**')
    const sid = page.url().split('?')[0].split('/').pop()
    await page.locator('.stage2d__pip svg').waitFor()
    await sleep(2500)
    const t0 = R.tts.length
    await sendTurn(page, page, 'ok so imagine a pizza. half a pizza is way bigger than a third of a pizza. the pieces are different sizes so you cant just add them', sid)
    // let the line play out
    for (let i = 0; i < 40; i++) {
      const done = await page.evaluate(() => window.__pip.plays.length > 0 && window.__pip.plays.every((p) => p.end || p.err))
      if (done) break
      await sleep(250)
    }
    const inst = await page.evaluate(() => window.__pip)
    const live = R.tts.filter((x) => x.audioB64 > 1000 && x.alignChars > 0)
    check('/api/tts returns live audio + alignment', live.length > 0 && R.tts.every((x) => x.status === 200), R.tts)
    check('audio element played (ok, playing fired)', inst.plays.some((p) => p.ok && p.playing), inst.plays)
    const shapesPlaying = Object.keys(inst.mouthPlaying)
    check('mouth changes while audio plays (>= 3 shapes) ', shapesPlaying.length >= 3, { playing: inst.mouthPlaying, idle: inst.mouthIdle })
    check('no browser speech while ElevenLabs works', inst.synth.length === 0, inst.synth)
    await shot('speaking')
    // mute
    await page.getByRole('button', { name: 'Mute Pip’s voice' }).click()
    await sleep(300)
    const before = { tts: R.tts.length, plays: inst.plays.length, synth: inst.synth.length }
    await sendTurn(page, page, 'because 2 and 3 both go into 6', sid)
    await sleep(2500)
    await page.locator('.stage2d__pip').click() // tap-to-talk also stays silent
    await sleep(1500)
    const after = await page.evaluate(() => ({ plays: window.__pip.plays.length, synth: window.__pip.synth.length, muted: localStorage.getItem('pip.voice.muted') }))
    check('mute: no new /api/tts, no audio, no speech', R.tts.length === before.tts && after.plays === before.plays && after.synth === before.synth, { before, after, tts: R.tts.length })
    await shot('muted')
    R.ttsBefore = t0
    await ctx.close()
  },

  // 5. Voice fallback: /api/tts blocked (network abort) or {fallback:true} -> browser speech, no errors.
  async fallback() {
    for (const mode of ['abort', 'fallback']) {
      await api('/demo/reset', 'POST')
      const { page, check, ctx, R } = await newPage(`fallback-${mode}`, {
        w: 390,
        h: 844,
        setup: (c) => c.route('**/api/tts', (r) => (mode === 'abort' ? r.abort() : r.fulfill({ json: { fallback: true } }))),
      })
      await page.goto(`${BASE}/student`)
      await openPicker(page)
      await page.getByRole('button', { name: 'Start teaching' }).click()
      await page.waitForURL('**/student/mission/**')
      const sid = page.url().split('?')[0].split('/').pop()
      await page.locator('.stage2d__pip svg').waitFor()
      await sleep(1500)
      await sendTurn(page, page, 'no thats wrong', sid)
      await sleep(2500)
      const inst = await page.evaluate(() => window.__pip)
      check(`${mode}: browser speechSynthesis used`, inst.synth.length > 0, inst.synth)
      check(`${mode}: no audio element played`, !inst.plays.some((p) => p.ok), inst.plays)
      const errs = R.console.filter((c) => c.type === 'error')
      check(`${mode}: no console/page errors`, errs.length === 0 && R.pageErrors.length === 0, { errs, pageErrors: R.pageErrors })
      await ctx.close()
    }
  },

  // 6. Phone frame + PWA at 1440x900; phone landing at 390.
  async pwa() {
    await api('/demo/reset', 'POST')
    const { page, check, shot, ctx } = await newPage('pwa-1440', { w: 1440, h: 900, mobile: false })
    await page.goto(`${BASE}/`)
    await page.waitForSelector('iframe.device__iframe', { timeout: 20000 })
    await sleep(2500)
    const h1 = await page.locator('h1').first().textContent()
    const src = await page.locator('iframe.device__iframe').getAttribute('src')
    const box = await page.locator('iframe.device__iframe').boundingBox()
    const f = await phone(page, 1440)
    await f.locator('.stage2d__pip svg').waitFor({ timeout: 15000 })
    await shot('landing')
    check('landing: pitch + live phone (iframe of /student?preview=1) in view', !!h1 && /\/student/.test(src ?? '') && box && box.y >= 0 && box.y + box.height <= 901, { h1, src, box })
    await f.locator('.home-play').first().click()
    const pickerOpen = await f.getByRole('dialog', { name: "Pick Pip's look" }).waitFor({ timeout: 8000 }).then(() => true, () => false)
    await sleep(500)
    await shot('landing-phone-picker')
    check('phone is playable (PLAY opens the picker inside the phone)', pickerOpen)
    const head = await page.evaluate(() => ({
      manifest: document.querySelector('link[rel=manifest]')?.getAttribute('href'),
      apple: document.querySelector('link[rel=apple-touch-icon]')?.getAttribute('href'),
      themeColor: document.querySelector('meta[name=theme-color]')?.getAttribute('content'),
      viewport: document.querySelector('meta[name=viewport]')?.getAttribute('content'),
    }))
    const man = await page.request.get(`${BASE}${head.manifest}`)
    const mj = await man.json()
    const icons = []
    for (const i of [...(mj.icons ?? []), { src: head.apple }]) {
      const r = await page.request.get(`${BASE}${i.src}`)
      const b = await r.body()
      icons.push({ src: i.src, status: r.status(), type: r.headers()['content-type'], bytes: b.length, png: b.slice(1, 4).toString() === 'PNG', w: b.readUInt32BE(16), h: b.readUInt32BE(20), sizes: i.sizes })
    }
    check('manifest 200, display standalone, icons 200 PNG at declared size', man.status() === 200 && mj.display === 'standalone' && icons.every((i) => i.status === 200 && i.png && (!i.sizes || i.sizes === `${i.w}x${i.h}`)), { status: man.status(), ct: man.headers()['content-type'], display: mj.display, start_url: mj.start_url, icons, head })
    // student route on desktop opens inside the frame
    await page.goto(`${BASE}/student`)
    const f2 = await phone(page, 1440)
    await f2.locator('.stage2d__pip svg').waitFor({ timeout: 15000 })
    await sleep(800)
    await shot('student-in-frame')
    await ctx.close()
    const m = await newPage('pwa-390', { w: 390, h: 844 })
    await m.page.goto(`${BASE}/`)
    await sleep(1500)
    await m.shot('landing')
    const facts = await screenFacts(m.page)
    m.check('phone landing = app welcome screen with Student entry', (await m.page.getByRole('link', { name: /^Student$/ }).count()) > 0, facts)
    await m.ctx.close()
  },

  // 7. Studio: at-risk on /owner and /tutor; New Pip mission lesson editing round-trip.
  async studio() {
    await api('/demo/reset', 'POST')
    const { page, check, shot, ctx } = await newPage('studio', { w: 1280, h: 800, mobile: false })
    const ar = await api('/center/at-risk')
    await page.goto(`${BASE}/owner`)
    await page.locator('.atrisk').waitFor()
    await page.locator('.atrisk__row').first().waitFor({ timeout: 10000 })
    const rows = await page.locator('.atrisk__row').allInnerTexts()
    const cardText = await page.locator('.atrisk').innerText()
    const pageText = await page.locator('body').innerText()
    await page.locator('.atrisk').scrollIntoViewIfNeeded()
    await shot('owner-atrisk', page.locator('.atrisk'))
    check('owner at-risk: 4 students listed', rows.length === 4 && ar.students?.length === 4, { api: ar.students?.map((s) => [s.name, s.reasons]), rows })
    check('owner at-risk: synthetic label visible', /synthetic/i.test(cardText) || /synthetic/i.test(pageText), { card: cardText.slice(0, 400), synthAnywhere: (pageText.match(/.{0,60}synthetic.{0,60}/i) || [])[0] })
    await page.goto(`${BASE}/tutor`)
    await page.locator('.atrisk--compact').waitFor({ timeout: 10000 })
    await sleep(500)
    const crow = await page.locator('.atrisk--compact .atrisk__row').allInnerTexts()
    await shot('tutor-atrisk', page.locator('.atrisk--compact'))
    check('tutor at-risk: compact card', crow.length >= 1 && crow.length <= 4, crow)
    // New Pip mission
    await page.getByRole('button', { name: /New Pip mission/ }).click()
    const dlg = page.getByRole('dialog', { name: 'New Pip mission' })
    await dlg.waitFor()
    await dlg.getByRole('button', { name: 'Expanding (a + b)²' }).click()
    await dlg.getByRole('button', { name: 'Draft the mission' }).click()
    await dlg.getByRole('button', { name: 'Save mission' }).waitFor({ timeout: 30000 })
    await dlg.locator('details.lesson-edit').first().evaluate((d) => (d.open = true))
    await sleep(300)
    const nLessons = await dlg.locator('details.lesson-edit').count()
    const rung = dlg.getByRole('textbox', { name: 'Pip’s question 2 for step 1' })
    const nRungs = await dlg.locator('input[aria-label^="Pip’s question"]').count()
    await rung.fill('VERIFIER EDIT: why would that be true?')
    const nudge = dlg.locator('details.lesson-edit').first().locator('label.field input')
    await nudge.fill('VERIFIER NUDGE: my friend said to draw it as a square.')
    const addLf = dlg.getByRole('textbox', { name: /Add to look-fors/ }).first()
    let lfOk = false
    if (await addLf.count()) {
      await addLf.fill('verifier look-for')
      await addLf.press('Enter')
      lfOk = true
    }
    const lfChips = await dlg.locator('details.lesson-edit').first().locator('.chips-edit__list li').allInnerTexts()
    await shot('new-mission-lesson', dlg)
    const reqP = page.waitForRequest((r) => r.url().endsWith('/api/assignments') && r.method() === 'POST')
    await dlg.getByRole('button', { name: 'Save mission' }).click()
    const req = await reqP
    const body = JSON.parse(req.postData() || '{}')
    const c0 = body.lesson?.concepts?.[0]
    await dlg.getByText('Mission saved').waitFor({ timeout: 10000 })
    check('New Pip mission shows editable ladder (3x4), look-fors, nudge', nLessons === 3 && nRungs === 12 && lfOk, { nLessons, nRungs, lfChips })
    check('edits posted back in the lesson', c0?.probe_ladder?.[1]?.startsWith('VERIFIER EDIT') && c0?.friend_nudge?.startsWith('VERIFIER NUDGE') && c0?.look_fors?.includes('verifier look-for') && Array.isArray(c0?.spoilers), { c0 })
    await ctx.close()
  },

  // 8. SAT Writing (s005) and SAT Math (s009) end to end offline via the student switch.
  async sat() {
    for (const [sidStudent, label, file] of [['s005', /Yara/, 'a_sat_commas'], ['s009', /Dev/, 'a_sat_linear']]) {
      await api('/demo/reset', 'POST')
      const L = JSON.parse(fs.readFileSync(path.join(LESSONS, `${file}.json`), 'utf8')).offline_demo
      const teach = L.turns.filter((t) => t.phase !== 'reteach')
      const re = L.turns.find((t) => t.phase === 'reteach')
      const name = `sat-${sidStudent}`
      const { page, check, shot, ctx, R } = await newPage(name, { w: 390, h: 844 })
      await page.goto(`${BASE}/student`)
      await page.getByRole('button', { name: 'Try another student' }).click()
      await page.getByRole('button', { name: label }).click()
      await page.waitForURL(`**/student?as=${sidStudent}`)
      await sleep(1200)
      await shot('home')
      const topic = await page.locator('.home-current__topic').textContent()
      await openPicker(page)
      await page.getByRole('radio', { name: /Raccoon/ }).click()
      await page.getByRole('radio', { name: /Cool/ }).click()
      await page.getByRole('button', { name: 'Start teaching' }).click()
      await page.waitForURL('**/student/mission/**')
      const sid = page.url().split('?')[0].split('/').pop()
      await page.locator('.speech .bubble__text').waitFor()
      const s0 = await api(`/sessions/${sid}`)
      const turns = []
      for (const t of teach) {
        const before = await api(`/sessions/${sid}`)
        const s = await sendTurn(page, page, t.student, sid)
        await sleep(400)
        const pip = s.transcript.slice(before.transcript.length).filter((m) => m.from === 'pip').map((m) => m.text).join(' | ')
        turns.push({ n: t.n, kind: t.kind, hp: [before.boss_hp, s.boss_hp], pip, expect: t.pip?.slice(0, 60) })
        if (t.kind === 'out_of_scope') await shot('oos')
        if (t.kind === 'misconception') await shot('heal')
      }
      const oos = turns.find((t) => t.kind === 'out_of_scope')
      check('out-of-scope parking line', /^Not in my brain yet\./.test(oos?.pip ?? ''), oos)
      check('authored beats: hits on explain, heal on misconception', turns.every((t) => (t.kind === 'explain' ? t.hp[1] < t.hp[0] : t.kind === 'misconception' ? t.hp[1] > t.hp[0] : t.hp[1] === t.hp[0])), turns.map((t) => [t.n, t.kind, t.hp]))
      await page.getByRole('button', { name: /Quiz Pip/ }).click()
      await page.locator('.exam-page').first().waitFor({ timeout: 30000 })
      await sleep(800)
      await shot('brain')
      const sq = await api(`/sessions/${sid}`)
      const miss = sq.quiz.find((q) => !q.passed)
      check('quiz: Pip misses the wrong-rule concept only', miss && sq.quiz.filter((q) => !q.passed).length === 1 && miss.concept_id === (re?.reteach_concept_id ?? 'k3'), sq.quiz.map((q) => [q.concept_id, q.passed, q.line?.slice(0, 50)]))
      await page.getByRole('button', { name: /Re-teach Pip/ }).first().click()
      await page.locator('.reteach-banner').waitFor({ timeout: 10000 })
      await sendTurn(page, page, re.student, sid)
      await sleep(500)
      await shot('reteach')
      await page.getByRole('button', { name: /Let Pip retry/ }).click()
      await page.waitForSelector('.ko', { timeout: 30000 })
      await page.locator('.ko__weapons .weapon').first().click()
      await page.waitForSelector('.ko--card', { timeout: 10000 })
      await sleep(1000)
      await shot('ko-card')
      const sf = await api(`/sessions/${sid}`)
      check('K.O. complete, Brain v2, gap report', sf.ko && sf.status === 'complete' && sf.brain_version === 2, { ko: sf.ko, status: sf.status, bv: sf.brain_version, topic, opening: s0.transcript.filter((m) => m.from === 'pip').map((m) => m.text) })
      const rep = await api(`/sessions/${sid}/report`)
      await page.goto(`${BASE}/tutor/report/${sid}`)
      await page.locator('.gap').first().waitFor({ timeout: 10000 })
      await sleep(500)
      await page.screenshot({ path: path.join(OUT, `${name}-report.png`), fullPage: true })
      const gaps = await page.locator('.gap').allInnerTexts()
      check('tutor gap report renders the SAT run', gaps.length === 3, { gaps: gaps.map((g) => g.slice(0, 140)), concepts: rep.concepts?.map((c) => [c.concept_id, c.status, c.fixed_after, c.stuck]) })
      R.turns = turns
      R.spoilerScan = sf.transcript
      await ctx.close()
    }
  },

  // 9. Stuck: SAT commas with non-answers until the ladder runs out; gap report + at-risk show it.
  async stuck() {
    await api('/demo/reset', 'POST')
    const { page, check, shot, ctx, R } = await newPage('stuck', { w: 390, h: 844 })
    await page.goto(`${BASE}/student?as=s005`)
    await openPicker(page)
    await page.getByRole('button', { name: 'Start teaching' }).click()
    await page.waitForURL('**/student/mission/**')
    const sid = page.url().split('?')[0].split('/').pop()
    await page.locator('.speech .bubble__text').waitFor()
    const lines = []
    for (const t of ['hmm', 'maybe', 'blue', 'ok', 'pass', 'what', 'hmm ok']) {
      const before = await api(`/sessions/${sid}`)
      const s = await sendTurn(page, page, t, sid)
      lines.push({ me: t, pip: s.transcript.slice(before.transcript.length).filter((m) => m.from === 'pip').map((m) => m.text).join(' | '), k1: s.ladder?.k1 })
      if (s.ladder?.k1?.stuck) break
    }
    await shot('after-ladder')
    const s = await api(`/sessions/${sid}`)
    check('ladder exhausted -> friend nudge -> stuck', s.ladder?.k1?.stuck === true && lines.some((l) => /friend|cousin|someone/i.test(l.pip)), lines)
    const rep = await api(`/sessions/${sid}/report`)
    await page.goto(`${BASE}/tutor/report/${sid}`)
    await page.locator('.gap').first().waitFor({ timeout: 10000 })
    await sleep(500)
    await page.screenshot({ path: path.join(OUT, 'stuck-report.png'), fullPage: true })
    const txt = await page.locator('main, body').first().innerText()
    check('gap report shows stuck', rep.concepts?.some((c) => c.stuck) && /stuck/i.test(txt), { concepts: rep.concepts?.map((c) => [c.concept_id, c.status, c.stuck]), excerpt: (txt.match(/.{0,80}stuck.{0,80}/i) || [])[0] })
    const ar = await api('/center/at-risk')
    R.atRiskAfter = ar.students?.map((x) => [x.student_id, x.reasons])
    await ctx.close()
  },

  // 10. Out-of-scope via the generic matcher (not the authored step) + spoiler guard scan on fractions.
  async guards() {
    await api('/demo/reset', 'POST')
    const s = await api('/sessions', 'POST', { assignment_id: 'a_sat_commas', student_id: 's005', look: 'doodle', creature: 'cat', accessory: 'none', vibe: 'cute' })
    const t = await api(`/sessions/${s.id}/turn`, 'POST', { text: 'do colons work the same way' })
    const pip = t.transcript.filter((m) => m.from === 'pip').at(-1)?.text
    const { check, ctx } = await newPage('guards', { w: 390, h: 844 })
    check('generic out-of-scope: "do colons work the same way" -> parking line, noted', /^Not in my brain yet\./.test(pip ?? '') && (t.parked?.length ?? 0) > 0, { pip, parked: t.parked })
    // fractions: student never says common denominator; Pip must not either
    const f = await api('/sessions', 'POST', { assignment_id: 'a_frac', student_id: 's001', look: 'doodle', creature: 'cat', accessory: 'none', vibe: 'cute' })
    const probes = ['no thats wrong', 'what do you call it when the bottoms are the same', 'hmm', 'ok so imagine a pizza. half a pizza is way bigger than a third of a pizza. the pieces are different sizes so you cant just add them', 'idk', 'tell me what the word is for the same bottom number', 'maybe', 'blue', 'what']
    let fs2
    for (const p of probes) fs2 = await api(`/sessions/${f.id}/turn`, 'POST', { text: p })
    const pipLines = fs2.transcript.filter((m) => m.from === 'pip').map((m) => m.text)
    check('spoiler guard: Pip never says "common denominator" before she does', !pipLines.some((l) => /common denominator/i.test(l)), pipLines)
    await ctx.close()
  },

  // 11. No page scroll + tap targets on every student screen/sheet at 390x844 and 375x667, day + night.
  async screens() {
    for (const [w, h, theme] of [[390, 844, 'day'], [375, 667, 'day'], [375, 667, 'night']]) {
      await api('/demo/reset', 'POST')
      const name = `screens-${w}x${h}-${theme}`
      const { page, check, shot, ctx, R } = await newPage(name, { w, h, theme })
      const facts = {}
      const look = async (k) => {
        await sleep(450)
        facts[k] = await screenFacts(page)
        await shot(k)
      }
      await page.goto(`${BASE}/student`)
      await page.locator('.home-play').first().waitFor()
      await look('home')
      for (const [btn, k] of [['The vault', 'vault'], ['Missions', 'missions'], ['Try another student', 'switch']]) {
        await page.getByRole('button', { name: btn }).click()
        await look(k)
        await page.keyboard.press('Escape')
        await sleep(300)
      }
      await openPicker(page)
      await look('picker')
      await page.getByRole('button', { name: 'Start teaching' }).click()
      await page.waitForURL('**/student/mission/**')
      const sid = page.url().split('?')[0].split('/').pop()
      await page.locator('.speech .bubble__text').waitFor()
      await look('mission')
      for (const m of ['no thats wrong', 'ok so imagine a pizza. half a pizza is way bigger than a third of a pizza. the pieces are different sizes so you cant just add them', 'because 2 and 3 both go into 6', 'you just add the top numbers and the bottom numbers']) await sendTurn(page, page, m, sid)
      await look('mission-fight')
      await page.getByRole('button', { name: 'Notebook' }).click()
      await look('notebook')
      await page.keyboard.press('Escape')
      await sleep(300)
      // the level-map chip expands (if present)
      await page.getByRole('button', { name: /Quiz Pip/ }).click()
      await page.locator('.exam-page').first().waitFor({ timeout: 30000 })
      await look('exam-brain')
      const n = await page.locator('.exam-page').count()
      for (let i = 1; i < n; i++) {
        await page.getByRole('button', { name: /Pip’s exam|Next ▶/ }).last().click()
        await look(`exam-q${i}`)
      }
      await page.getByRole('button', { name: /Re-teach Pip/ }).first().click()
      await page.locator('.reteach-banner').waitFor()
      await look('reteach')
      await sendTurn(page, page, 'no wait, only add the tops. the bottom just tells you the size of the pieces, and they’re already both sixths, so it stays sixths. 3/6 + 2/6 = 5/6', sid)
      await page.getByRole('button', { name: /Let Pip retry/ }).click()
      await page.waitForSelector('.ko', { timeout: 30000 })
      await look('ko-fight')
      await page.locator('.ko__weapons .weapon').first().click()
      await sleep(250)
      await look('ko-stamp')
      await page.waitForSelector('.ko--card', { timeout: 10000 })
      await look('ko-card')
      for (const k of ['ko-cliff', 'ko-rivera']) {
        await page.getByRole('button', { name: /Next/ }).last().click().catch(() => {})
        await look(k)
      }
      const bad = Object.entries(facts).filter(([, f]) => f.scrolls)
      check('no page scroll on any student screen', bad.length === 0, Object.fromEntries(Object.entries(facts).map(([k, f]) => [k, `${f.scrollHeight}/${f.innerHeight}`])))
      const clipped = Object.entries(facts).filter(([, f]) => f.clipped.length)
      check('no control clipped off-screen', clipped.length === 0, Object.fromEntries(clipped.map(([k, f]) => [k, f.clipped])))
      const small = Object.entries(facts).filter(([, f]) => f.small.length)
      check('tap targets >= 44px', small.length === 0, Object.fromEntries(small.map(([k, f]) => [k, f.small])))
      R.facts = facts
      R.moods = await page.evaluate(() => window.__pip.moods.map((m) => `${m.path.split('/')[2] ?? 'home'}: ${m.l.replace(/^Pip the \w+ looks /, '')}`))
      await ctx.close()
    }
  },
}

browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined })
for (const [k, fn] of Object.entries(scenarios)) {
  if (ONLY && !ONLY.includes(k)) continue
  try {
    await fn()
  } catch (e) {
    console.log(`[${k}] ERROR ${String(e).slice(0, 400)}`)
    RESULTS[`${k}-error`] = { checks: [{ label: 'scenario ran', pass: false, detail: String(e).slice(0, 800) }] }
  }
}
await browser.close()
const file = path.join(OUT, `results${ONLY ? '-' + ONLY.join('-') : ''}.json`)
fs.writeFileSync(file, JSON.stringify(RESULTS, null, 2))
const fails = Object.entries(RESULTS).flatMap(([k, r]) => (r.checks ?? []).filter((c) => !c.pass).map((c) => `${k}: ${c.label}`))
const errs = Object.entries(RESULTS).map(([k, r]) => [k, (r.console ?? []).filter((c) => c.type === 'error').length, (r.pageErrors ?? []).length, (r.badResponses ?? []).length])
console.log('\nconsole errors / page errors / bad responses per scenario:', JSON.stringify(errs))
console.log(`Done. ${fails.length} failing check(s).`, fails)
