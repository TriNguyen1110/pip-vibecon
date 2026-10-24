// D-3 regression: every creature (with the iridescent glasses) in the mission arena must render
// glossy with no THREE shader errors / WebGL "program not valid" warnings.
// Sessions are created through the API exactly as the frontend does (look = lookForCreature(creature)).
//   PLAYWRIGHT_MODULE=... CHROME_PATH=... BASE_URL=http://localhost:5741 OUT_DIR=reports/verification/v2/creatures \
//   node tests/e2e/creatures.mjs
import fs from 'node:fs'
import path from 'node:path'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const BASE = process.env.BASE_URL || 'http://localhost:5741'
const OUT = process.env.OUT_DIR || 'reports/verification/v2/creatures'
const WIDTH = Number(process.env.WIDTH || 1280)
fs.mkdirSync(OUT, { recursive: true })

const CREATURES = ['blob', 'cat', 'dragon', 'axolotl', 'frog', 'bot']
const lookFor = (c) => (c === 'bot' ? 'bot' : c === 'blob' ? 'blob' : 'doodle')
const post = (p, b) =>
  fetch(`${BASE}/api${p}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b ?? {}) }).then((r) => r.json())

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined })
const tag = `chrome${browser.version().split('.')[0]}-${WIDTH}`
const out = []
for (const creature of CREATURES) {
  const s = await post('/sessions', { assignment_id: 'a_frac', student_id: 's001', look: lookFor(creature), creature, accessory: 'glasses' })
  const page = await browser.newPage({ viewport: { width: WIDTH, height: WIDTH < 600 ? 844 : 800 } })
  const msgs = []
  page.on('console', (m) => {
    const t = m.text()
    if (/Shader Error|program not valid|WebGLProgram|too many errors/i.test(t) || m.type() === 'error') msgs.push(`${m.type()}: ${t.slice(0, 160)}`)
  })
  page.on('pageerror', (e) => msgs.push(`pageerror: ${String(e).slice(0, 160)}`))
  await page.goto(`${BASE}/student/mission/${s.id}`)
  const canvas = await page.waitForSelector('.arena canvas', { timeout: 20000 }).then(() => true).catch(() => false)
  await page.waitForTimeout(3000)
  await page.locator('.arena').screenshot({ path: path.join(OUT, `${tag}-${creature}-glasses-arena.png`) }).catch(() => {})
  out.push({ creature, look: s.look, canvas, shaderOrGlMessages: msgs.length, sample: msgs.slice(0, 3) })
  console.log(tag, creature, 'canvas', canvas, 'GL/shader/console errors', msgs.length, msgs[0] ?? '')
  await page.close()
}
await browser.close()
fs.writeFileSync(path.join(OUT, `${tag}-result.json`), JSON.stringify(out, null, 2))
process.exitCode = out.some((o) => !o.canvas || o.shaderOrGlMessages) ? 1 : 0
