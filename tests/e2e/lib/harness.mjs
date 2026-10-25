// Shared Playwright harness for the v4 journeys (student, tutor_owner, parent).
// Plain node (no test runner). Playwright is NOT a repo dependency; point at an install:
//   PLAYWRIGHT_MODULE=/abs/node_modules/playwright/index.mjs  (default: 'playwright')
//   CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"   (default: bundled Chromium)
//   AXE_PATH=/abs/node_modules/axe-core/axe.min.js   (optional; without it a computed-style contrast check runs)
//   BASE_URL=http://localhost:5791  OUT_DIR=reports/verification/v4  VIEWPORTS=390x844,1280x800  ONLY_WIDTH=390
// Every step reports PASS / FAIL / NOT BUILT YET. A step is NOT BUILT when the CONTRACT route answers 404/405
// (FastAPI "Not Found") or the UI element the CONTRACT names doesn't exist yet; a wrong answer is a FAIL.
import fs from 'node:fs'
import path from 'node:path'

export const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
export const BASE = process.env.BASE_URL || 'http://localhost:5791'
export const OUT = process.env.OUT_DIR || 'reports/verification/v4'
export const SHOTS = path.join(OUT, 'shots')
fs.mkdirSync(SHOTS, { recursive: true })
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const ONLY = process.env.ONLY_WIDTH ? Number(process.env.ONLY_WIDTH) : null
export const VIEWPORTS = (process.env.VIEWPORTS || '390x844,1280x800')
  .split(',')
  .map((x) => {
    const [w, h] = x.split('x').map(Number)
    return { w, h, mobile: w < 900 }
  })
  .filter((v) => !ONLY || v.w === ONLY)

export class NotBuilt extends Error {}
export const notBuilt = (why) => {
  throw new NotBuilt(why)
}

// API helper: {status, json}. `nb: true` turns a 404/405 into NotBuilt (missing v3.13 route).
export async function api(p, method = 'GET', body, { nb = false } = {}) {
  const r = await fetch(`${BASE}/api${p}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  let json = null
  try {
    json = await r.json()
  } catch {
    /* empty */
  }
  if (nb && (r.status === 405 || (r.status === 404 && json?.detail === 'Not Found'))) notBuilt(`${method} /api${p} -> ${r.status}`)
  return { status: r.status, json }
}

export function readFixture(rel) {
  return JSON.parse(fs.readFileSync(new URL(`../../fixtures/${rel}`, import.meta.url)))
}

// One journey at one viewport.
export async function openRun(journey, vp, { colorScheme = 'light' } = {}) {
  const tag = `${journey}-${vp.w}`
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || undefined,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'],
  })
  const ctx = await browser.newContext({
    viewport: { width: vp.w, height: vp.h },
    deviceScaleFactor: vp.mobile ? 2 : 1,
    isMobile: vp.mobile,
    hasTouch: vp.mobile,
    colorScheme,
  })
  // Mute speech: the browser voice fallback is fine, but no audio is needed for these checks.
  await ctx.addInitScript(() => {
    try {
      window.speechSynthesis.speak = () => {}
    } catch {
      /* none */
    }
  })
  const page = await ctx.newPage()
  const R = {
    journey,
    width: vp.w,
    height: vp.h,
    chrome: browser.version(),
    steps: [],
    console: [],
    pageErrors: [],
    failedRequests: [],
    badResponses: [],
    expectedBad: [],
    smallTargets: [],
    contrast: {},
    overflow: {},
    fit: {},
    notes: {},
  }
  let cur = 'setup'
  const expected = [] // [{re, status}] responses the step expects (e.g. the 403 isolation probe)
  page.on('console', (m) => {
    if (m.type() === 'error') R.console.push({ step: cur, text: m.text().slice(0, 400), url: page.url() })
  })
  page.on('pageerror', (e) => R.pageErrors.push({ step: cur, text: String(e).slice(0, 400) }))
  page.on('requestfailed', (r) => {
    const err = r.failure()?.errorText
    // Aborted media/TTS prefetches on navigation are not failures of the app.
    if (/ERR_ABORTED/.test(err || '') && !/\/api\//.test(r.url())) return
    R.failedRequests.push({ step: cur, url: r.url().replace(BASE, ''), err })
  })
  page.on('response', (r) => {
    if (r.status() < 400) return
    const rec = { step: cur, url: r.url().replace(BASE, ''), status: r.status() }
    if (expected.some((x) => x.re.test(rec.url) && x.status === rec.status)) R.expectedBad.push(rec)
    else R.badResponses.push(rec)
  })

  const H = {
    tag,
    vp,
    page,
    browser,
    R,
    P: page, // the document the current screen lives in (page, or the desktop phone-frame iframe)
    expect(re, status) {
      expected.push({ re, status })
    },
    async frame(timeout = 20000) {
      // The landing page has its own preview phone; wait until the current route's phone frame is the live one.
      await page.waitForLoadState('domcontentloaded')
      for (let i = 0; i < 20; i++) {
        await sleep(300)
        const el = await page.waitForSelector('iframe.device__iframe', { timeout })
        const f = await el.contentFrame()
        if (!f || f.isDetached()) continue
        try {
          await f.waitForLoadState('domcontentloaded')
          await sleep(200)
          if (!f.isDetached() && !/preview=1/.test(f.url())) return f
        } catch {
          /* swapped while loading: retry */
        }
      }
      throw new Error('phone frame never settled')
    },
    // Student/parent screens: on desktop the app runs inside the phone frame.
    async inApp() {
      H.P = vp.mobile ? page : await H.frame()
      return H.P
    },
    n: 0,
    async shot(name) {
      H.n += 1
      const f = path.join(SHOTS, `${tag}-${String(H.n).padStart(2, '0')}-${name.replace(/[^\w.-]+/g, '_')}.png`)
      await page.screenshot({ path: f }).catch(() => {})
      return f
    },
    async step(name, fn) {
      cur = name
      const t0 = Date.now()
      let rec
      try {
        const detail = (await fn()) ?? {}
        const status = detail.notBuilt ? 'NOT BUILT' : detail.pass === false ? 'FAIL' : 'PASS'
        rec = { name, status, ms: Date.now() - t0, detail }
      } catch (e) {
        const nb = e instanceof NotBuilt
        rec = { name, status: nb ? 'NOT BUILT' : 'FAIL', ms: Date.now() - t0, error: String(e.message || e).slice(0, 700) }
        if (!nb) await H.shot(`FAIL-${name}`)
      }
      R.steps.push(rec)
      const d = rec.error ?? JSON.stringify(rec.detail ?? {})
      console.log(`[${tag}] ${rec.status.padEnd(9)} ${name}  ${String(d).slice(0, 260)}`)
      return rec.detail ?? null
    },
    // No horizontal overflow in the current document.
    async overflow(label, doc = H.P) {
      const o = await doc.evaluate(() => {
        const d = document.documentElement
        const wide = [...document.querySelectorAll('body *')]
          .filter((el) => {
            const r = el.getBoundingClientRect()
            const cs = getComputedStyle(el)
            return r.width > 0 && r.right > d.clientWidth + 1 && cs.position !== 'fixed' && cs.visibility !== 'hidden' && !el.closest('[aria-hidden="true"], .sr-only, .snap-x, [class*="pager"]')
          })
          .slice(0, 5)
          .map((el) => `${el.tagName.toLowerCase()}.${String(el.className?.baseVal ?? el.className).split(' ').filter(Boolean).slice(0, 2).join('.')} right=${Math.round(el.getBoundingClientRect().right)}`)
        return { scrollWidth: d.scrollWidth, clientWidth: d.clientWidth, overflows: d.scrollWidth > d.clientWidth + 1, wide }
      })
      R.overflow[label] = o
      return o
    },
    // Play screens fit one viewport (no page scroll). Only meaningful on phones.
    async fit(label, doc = H.P) {
      const f = await doc.evaluate(() => ({ scrollHeight: document.scrollingElement.scrollHeight, innerHeight: window.innerHeight }))
      f.ok = f.scrollHeight <= f.innerHeight + 1
      R.fit[label] = f
      return f
    },
    // Visible interactive elements smaller than `min` px (checkbox/radio measured by their label/cell).
    async targets(label, min = 44, doc = H.P, exempt = null) {
      const small = await doc.evaluate(([min, exempt]) => {
        const els = [...document.querySelectorAll('button, a[href], textarea, input:not([type=hidden]), select, [role=button], [role=radio], [role=tab], [role=switch]')]
        return els
          .filter((el) => {
            const r = el.getBoundingClientRect()
            const cs = getComputedStyle(el)
            if (el.closest('.sr-only,[aria-hidden="true"]')) return false
            if (exempt && el.matches(exempt)) return false
            return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0'
          })
          .map((el) => {
            let r = el.getBoundingClientRect()
            if ((el.type === 'checkbox' || el.type === 'radio') && (el.closest('label') || el.parentElement)) {
              const p = (el.closest('label') ?? el.parentElement).getBoundingClientRect()
              r = { width: Math.max(r.width, p.width), height: Math.max(r.height, p.height) }
            }
            // inline text links inside a sentence are exempt (WCAG 2.5.8 inline exception)
            const inline = el.tagName === 'A' && getComputedStyle(el).display === 'inline' && el.parentElement && el.parentElement.textContent.trim().length > el.textContent.trim().length + 10
            return {
              el: `${el.tagName.toLowerCase()}.${String(el.className?.baseVal ?? el.className).split(' ').filter(Boolean).slice(0, 2).join('.')}`,
              text: (el.getAttribute('aria-label') || el.textContent || el.placeholder || '').trim().slice(0, 36),
              w: Math.round(r.width),
              h: Math.round(r.height),
              inline,
            }
          })
          .filter((x) => !x.inline && (x.w < min || x.h < min))
      }, [min, exempt])
      R.smallTargets.push(...small.map((s) => ({ ...s, screen: label, min })))
      return small
    },
    // AA contrast. axe-core (color-contrast rule) when AXE_PATH is set, else a computed-style check of text nodes.
    async contrast(label, doc = H.P, { scope = null } = {}) {
      let res
      if (process.env.AXE_PATH) {
        try {
          const has = await doc.evaluate(() => !!window.axe)
          if (!has) await doc.addScriptTag({ path: process.env.AXE_PATH })
          res = await doc.evaluate(async (scope) => {
            const r = await window.axe.run(scope ? document.querySelector(scope) ?? document : document, { runOnly: ['color-contrast'], resultTypes: ['violations'] })
            const nodes = r.violations.flatMap((v) => v.nodes)
            return {
              tool: 'axe',
              violations: nodes.length,
              nodes: nodes.slice(0, 8).map((n) => ({ target: n.target.join(' '), why: (n.any[0]?.message || '').slice(0, 140), text: (document.querySelector(n.target[0])?.textContent || '').trim().slice(0, 50) })),
            }
          }, scope)
        } catch (e) {
          res = { tool: 'axe', error: String(e).slice(0, 200) }
        }
      }
      if (!res || res.error) res = { ...(await computedContrast(doc)), axeError: res?.error }
      R.contrast[label] = res
      return res
    },
    async close() {
      await browser.close().catch(() => {})
    },
  }
  return H
}

// Fallback contrast: solid text colour vs the nearest opaque background, for visible text leaves.
async function computedContrast(doc) {
  return doc.evaluate(() => {
    const parse = (c) => {
      const m = c.match(/rgba?\(([^)]+)\)/)
      if (!m) return null
      const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number)
      return { r, g, b, a }
    }
    const lum = ({ r, g, b }) => {
      const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
    }
    const bgOf = (el) => {
      for (let e = el; e; e = e.parentElement) {
        const cs = getComputedStyle(e)
        if (cs.backgroundImage !== 'none') return null // gradient/image: unknown, skip
        const c = parse(cs.backgroundColor)
        if (c && c.a >= 0.95) return c
      }
      return { r: 255, g: 255, b: 255, a: 1 }
    }
    const bad = []
    let checked = 0
    for (const el of document.querySelectorAll('body *')) {
      if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue
      const r = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      if (!r.width || cs.visibility === 'hidden' || el.closest('[aria-hidden="true"],.sr-only')) continue
      const fg = parse(cs.color)
      const bg = bgOf(el)
      if (!fg || !bg || fg.a < 0.95) continue
      checked++
      const L1 = lum(fg)
      const L2 = lum(bg)
      const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)
      const px = parseFloat(cs.fontSize)
      const large = px >= 24 || (px >= 18.66 && Number(cs.fontWeight) >= 700)
      if (ratio < (large ? 3 : 4.5)) bad.push({ text: el.textContent.trim().slice(0, 40), ratio: Math.round(ratio * 100) / 100, px })
    }
    return { tool: 'computed-style', checked, violations: bad.length, nodes: bad.slice(0, 8) }
  })
}

// Write results + a one-line count per viewport.
export function finish(journey, runs) {
  const file = path.join(OUT, `results-${journey}${ONLY ? '-' + ONLY : ''}.json`)
  fs.writeFileSync(file, JSON.stringify(runs, null, 2))
  let fails = 0
  for (const r of runs) {
    const c = { PASS: 0, FAIL: 0, 'NOT BUILT': 0 }
    r.steps.forEach((s) => c[s.status]++)
    fails += c.FAIL
    console.log(
      `\n${journey} @${r.width}: PASS ${c.PASS} · FAIL ${c.FAIL} · NOT BUILT ${c['NOT BUILT']} · console errors ${r.console.length + r.pageErrors.length} · failed requests ${r.failedRequests.length} · non-2xx ${r.badResponses.length} · small targets ${r.smallTargets.length} · Chrome ${r.chrome}`,
    )
    r.steps.filter((s) => s.status !== 'PASS').forEach((s) => console.log(`  ${s.status}: ${s.name}${s.error ? ' :: ' + s.error.slice(0, 160) : ''}`))
  }
  console.log(`results: ${file}`)
  process.exitCode = fails ? 1 : 0
}

// Hygiene step shared by all journeys: console errors, failed requests, non-2xx.
export async function hygiene(H) {
  return H.step('no console errors, failed requests or unexpected non-2xx', async () => {
    const { R } = H
    return {
      pass: R.console.length + R.pageErrors.length + R.failedRequests.length + R.badResponses.length === 0,
      console: R.console.slice(0, 6),
      pageErrors: R.pageErrors.slice(0, 4),
      failedRequests: R.failedRequests.slice(0, 6),
      badResponses: R.badResponses.slice(0, 8),
      expectedBad: R.expectedBad,
    }
  })
}

// Text visible on screen (for "no game words" and similar checks).
export const visibleText = (doc) => doc.evaluate(() => document.body.innerText)
export const mockBadge = async (doc) => /mock data/i.test(await visibleText(doc))

// Maya's DEMO_SCRIPT run through the API (offline engine): 4 texts, quiz, re-teach k3, retry -> K.O.
export const MAYA = {
  texts: ['no its half of that', 'because 2 triangles make a rectangle', 'so 6×4÷2 = 12', 'oh but for a right triangle you just times the two sides'],
  reteach: 'no a right triangle is still half a rectangle so its 10×5÷2 = 25',
}
export async function mayaKO() {
  const s = (await api('/sessions', 'POST', { assignment_id: 'a_tri', student_id: 's001', look: 'blob', creature: 'cat', accessory: 'none' })).json
  for (const t of MAYA.texts) await api(`/sessions/${s.id}/turn`, 'POST', { text: t })
  await api(`/sessions/${s.id}/quiz`, 'POST')
  await api(`/sessions/${s.id}/reteach`, 'POST', { concept_id: 'k3' })
  await api(`/sessions/${s.id}/turn`, 'POST', { text: MAYA.reteach })
  const done = (await api(`/sessions/${s.id}/quiz`, 'POST')).json
  return done
}
// Signs that v3.15 (B18/F18 privacy) and v3.16 (English only) have landed in the parent payloads.
export const GAME_WORDS = /\bK\.?O\.?(?![a-z])|\bboss(es)?\b|brain v\d|\bweapons?\b/i
export const SPANISH = /\b(hola|gracias|semana|está|aprendió|enseñó|clase|quieren|paquete)\b|¿|¡/i
