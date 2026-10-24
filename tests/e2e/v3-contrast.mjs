// V3 verifier: text-contrast spot checks on Play screens (day + night). Background = first ancestor with an
// opaque background-color or the first stop of a gradient (approximation; gradients use their first stop).
//   PLAYWRIGHT_MODULE=... CHROME_PATH=... BASE_URL=http://localhost:5782 OUT_DIR=reports/verification/v3/features node tests/e2e/v3-contrast.mjs
import fs from 'node:fs'
import path from 'node:path'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const BASE = process.env.BASE_URL || 'http://localhost:5782'
const OUT = process.env.OUT_DIR || 'reports/verification/v3/features'
const api = (p, m = 'GET', b) => fetch(`${BASE}/api${p}`, { method: m, headers: b ? { 'Content-Type': 'application/json' } : {}, body: b ? JSON.stringify(b) : undefined }).then((r) => r.json())
const MEASURE = (sels) => {
  const parse = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 } }
  const lum = ({ r, g, b }) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
  const bgOf = (el) => {
    for (let e = el; e; e = e.parentElement) {
      const cs = getComputedStyle(e)
      const c = parse(cs.backgroundColor)
      if (c && c.a > 0.85) return { c, from: e.className?.toString().slice(0, 40) || e.tagName }
      if (cs.backgroundImage.includes('gradient')) { const g = parse(cs.backgroundImage); if (g && g.a > 0.6) return { c: g, from: 'grad ' + (e.className?.toString().slice(0, 40) || e.tagName) } }
    }
    return { c: { r: 255, g: 255, b: 255 }, from: 'default' }
  }
  return sels.map(([label, sel, attr]) => {
    const el = document.querySelector(sel)
    if (!el) return { label, missing: true }
    const cs = getComputedStyle(el)
    let fg = parse(attr === 'placeholder' ? getComputedStyle(el, '::placeholder').color : cs.color)
    const bg = bgOf(attr === 'self' ? el : el)
    const L1 = lum(fg), L2 = lum(bg.c)
    const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)
    return { label, ratio: Math.round(ratio * 100) / 100, size: cs.fontSize, weight: cs.fontWeight, fg: cs.color, bg: `rgb(${bg.c.r},${bg.c.g},${bg.c.b}) ${bg.from}` }
  })
}
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined })
const all = {}
for (const theme of ['day', 'night']) {
  await api('/demo/reset', 'POST')
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: theme === 'night' ? 'dark' : 'light' })
  const page = await ctx.newPage()
  const rows = []
  await page.goto(`${BASE}/student`)
  await page.locator('.home-play').first().waitFor()
  await page.waitForTimeout(800)
  rows.push(...(await page.evaluate(MEASURE, [['home bubble', '.speech__bubble'], ['home ribbon', '.home-current__topic'], ['PLAY gel', '.home-play'], ['icon caption Look', '.home-foot .icon-btn__cap, .home-foot span']])).map((r) => ({ screen: 'home', ...r })))
  await page.locator('.home-play').first().click()
  await page.getByRole('dialog', { name: "Pick Pip's look" }).waitFor()
  await page.waitForTimeout(500)
  rows.push(...(await page.evaluate(MEASURE, [['picker eyebrow', '.picker .eyebrow'], ['picker sub', '.picker .small.muted'], ['creature name', '.pick__name'], ['label Creature', '.picker .label'], ['accessory chip', '.chip--btn'], ['Cancel', '.picker .btn--ghost'], ['Start teaching', '.picker .btn--primary']])).map((r) => ({ screen: 'picker', ...r })))
  await page.getByRole('button', { name: 'Start teaching' }).click()
  await page.waitForURL('**/student/mission/**')
  const sid = page.url().split('?')[0].split('/').pop()
  await page.locator('.speech .bubble__text').waitFor()
  await page.getByRole('textbox', { name: 'Message to Pip' }).fill('ok so imagine a pizza. half a pizza is way bigger than a third of a pizza. the pieces are different sizes so you cant just add them')
  const resp = page.waitForResponse((r) => r.url().includes(`/sessions/${sid}/turn`))
  await page.getByRole('button', { name: 'Send to Pip' }).click()
  await resp
  await page.waitForTimeout(1600)
  rows.push(...(await page.evaluate(MEASURE, [['Pip bubble', '.speech .bubble__text'], ['her bubble', '.her-line .bubble--me'], ['HUD boss name', '.hud__name, .hud .boss__name, .hudboss__name'], ['HP number', '.hp__num, .hud .hp__n, [role=meter] + *'], ['hit caption', '.fcap'], ['Quiz Pip gel', '.quiz-btn'], ['level node', '.mstep__n, .mpath button span']])).map((r) => ({ screen: 'mission', ...r })))
  rows.push(...(await page.evaluate(MEASURE, [['input placeholder', '.composer__input', 'placeholder']])).map((r) => ({ screen: 'mission', ...r })))
  await page.getByRole('button', { name: /Quiz Pip/ }).click()
  await page.locator('.exam-page').first().waitFor()
  await page.waitForTimeout(600)
  rows.push(...(await page.evaluate(MEASURE, [['Brain ribbon', '.exam-ribbon'], ['note concept', '.note .note__concept, .note h3, .note p'], ['exam next gel', '.exam-next'], ['HUD title', '.hud__name']])).map((r) => ({ screen: 'exam', ...r })))
  all[theme] = rows
  await ctx.close()
}
await browser.close()
fs.writeFileSync(path.join(OUT, 'contrast.json'), JSON.stringify(all, null, 2))
for (const [t, rows] of Object.entries(all)) for (const r of rows) console.log(t, r.screen, r.label, r.missing ? 'MISSING' : `${r.ratio} (${r.size} ${r.weight}) fg ${r.fg} on ${r.bg}`)
