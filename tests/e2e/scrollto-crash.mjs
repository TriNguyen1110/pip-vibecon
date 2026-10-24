// Repro: App.jsx ScrollTop returns window.scrollTo(...) from useEffect. Chrome >= 154 returns a
// Promise from scrollTo, React calls it as the effect cleanup -> "destroy is not a function" -> the
// whole app falls to AppErrorBoundary ("Pip lost the thread.").
// Dev (StrictMode): crashes on first load. Prod build: crashes on the first client-side navigation.
//   PLAYWRIGHT_MODULE=.../playwright/index.mjs CHROME_PATH=... BASE_URL=http://localhost:5742 \
//   OUT_DIR=reports/verification/v1/chrome154-crash node tests/e2e/scrollto-crash.mjs
import fs from 'node:fs'
import path from 'node:path'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const BASE = process.env.BASE_URL || 'http://localhost:5742'
const OUT = process.env.OUT_DIR || 'reports/verification/v1/chrome154-crash'
fs.mkdirSync(OUT, { recursive: true })
const b = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined })
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
const p = await ctx.newPage()
const log = []
p.on('console', (m) => m.type() === 'error' && log.push(m.text().slice(0, 200)))
await p.goto(`${BASE}/`)
await p.waitForTimeout(1200)
const scrollToReturns = await p.evaluate(() => Object.prototype.toString.call(window.scrollTo(0, 0)))
const tag = b.version().split('.')[0]
await p.screenshot({ path: path.join(OUT, `chrome${tag}-1-landing.png`) })
await p.getByRole('link', { name: /Try as Maya/ }).click()
await p.waitForTimeout(1500)
await p.screenshot({ path: path.join(OUT, `chrome${tag}-2-after-try-as-maya.png`) })
const body = (await p.locator('body').innerText()).slice(0, 120)
const crashed = /Pip lost the thread/.test(body)
const res = { browser: b.version(), base: BASE, scrollToReturns, crashedAfterNav: crashed, body, consoleErrors: log.slice(0, 4) }
fs.writeFileSync(path.join(OUT, `chrome${tag}-result.json`), JSON.stringify(res, null, 2))
console.log(JSON.stringify(res, null, 2))
await b.close()
