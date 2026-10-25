// DATA-1: showcase missions read their lesson data (pinned mission, boss, step labels, scene, given concepts).
// Maya's a_tri must look exactly as before; Theo (s014) gets a_trig and a_trig_id, Luna (s043) a_sat_modifiers.
// Plain node script, same env as demo.spec.mjs:
//   PLAYWRIGHT_MODULE=/abs/path/node_modules/playwright/index.mjs CHROME_PATH=... BASE_URL=http://localhost:5741 \
//   OUT_DIR=reports/verification/data1 [ONLY_WIDTH=390] [THEME=night] node tests/e2e/data1.spec.mjs
import fs from 'node:fs'
import path from 'node:path'

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const BASE = process.env.BASE_URL || 'http://localhost:5741'
const OUT = process.env.OUT_DIR || 'reports/verification/data1'
const ONLY = process.env.ONLY_WIDTH ? Number(process.env.ONLY_WIDTH) : null
const THEME = process.env.THEME === 'night' ? 'night' : 'day'
fs.mkdirSync(OUT, { recursive: true })

const VIEWPORTS = [
  { w: 390, h: 844, mobile: true },
  { w: 1280, h: 800, mobile: false },
].filter((v) => !ONLY || v.w === ONLY)

// Today's a_tri step names: Maya's flow must not change.
const TRI_LABELS = ['Two triangles', 'Rectangles', 'One triangle']
const CASES = [
  { who: 'Maya', sid: 's001', open: 'a_tri', boss: 'Duke Doublecount', labels: TRI_LABELS, scene: 'skatepark' },
  { who: 'Theo', sid: 's014', open: 'a_trig', boss: 'Sir Cosine Overreach' },
  { who: 'Theo', sid: 's014', open: 'a_trig_id', boss: 'Baroness Plus-Plus-One', given: ['k1', 'k2'] },
  { who: 'Luna', sid: 's043', open: 'a_sat_modifiers', boss: 'Dame Dangle-Dangle', scene: 'studio' },
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const api = async (p, init) => (await fetch(`${BASE}/api${p}`, init)).json()
// The rule under test, computed independently: the newest showcase (hand-written lesson) is pinned first.
const showcase = (a) => a.showcase === true || ['a_tri', 'a_frac', 'a_sat_commas', 'a_sat_linear'].includes(a.id) || !!a.lesson?.offline_demo
const newestShowcase = (as) =>
  as.filter(showcase).reduce((b, a) => (!b || (Date.parse(a.created_at ?? '') || 0) > (Date.parse(b.created_at ?? '') || 0) ? a : b), null)

const all = []
let failing = 0
for (const vp of VIEWPORTS) {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined })
  for (const c of CASES) {
    const tag = `${vp.w}-${THEME}-${c.who}-${c.open}`
    const R = { tag, steps: [], errors: [] }
    const step = async (name, fn) => {
      try {
        const d = await fn()
        const pass = d?.pass !== false
        if (!pass) failing++
        R.steps.push({ name, pass, d })
        console.log(`[${tag}] ${pass ? 'PASS' : 'FAIL'} ${name}`, JSON.stringify(d ?? {}).slice(0, 360))
        return d
      } catch (e) {
        failing++
        R.steps.push({ name, pass: false, error: String(e).slice(0, 400) })
        console.log(`[${tag}] FAIL ${name}: ${String(e).slice(0, 300)}`)
        return null
      }
    }
    await fetch(`${BASE}/api/demo/reset`, { method: 'POST' })
    const st = await api(`/students/${c.sid}`)
    const a = st.assignments.find((x) => x.id === c.open)
    const pinned = newestShowcase(st.assignments)
    const ctx = await browser.newContext({
      viewport: { width: vp.w, height: vp.h },
      deviceScaleFactor: 1,
      isMobile: vp.mobile,
      hasTouch: vp.mobile,
      colorScheme: THEME === 'night' ? 'dark' : 'light',
    })
    // Skip the first-run vibe grid and naming (they have their own checks); this run is about lesson data.
    await ctx.addInitScript((sid) => {
      localStorage.setItem(`pip.styleDone.${sid}`, 'true')
      localStorage.setItem(`pip.named.${sid}`, 'true')
    }, c.sid)
    const page = await ctx.newPage()
    page.on('pageerror', (e) => R.errors.push(String(e).slice(0, 300)))
    await page.goto(`${BASE}${c.sid === 's001' ? '/student' : `/student?as=${c.sid}`}`)
    let P = page
    if (!vp.mobile) {
      const el = await page.waitForSelector('.device-scene iframe.device__iframe', { timeout: 20000 })
      P = await el.contentFrame()
    }
    const shot = (n) => page.screenshot({ path: path.join(OUT, `${tag}-${n}.png`) }).catch(() => {})

    await step('assignment exists with its lesson fields', async () => ({
      pass: !!a && !!a.lesson?.concept_labels && (c.labels ? true : !!a.scene),
      boss: a?.boss?.name,
      scene: a?.scene,
      labels: a?.lesson?.concept_labels,
    }))

    await step('home pins the newest showcase mission', async () => {
      await P.locator('.home-current__topic').waitFor({ timeout: 15000 })
      const topic = (await P.locator('.home-current__topic').innerText()).trim()
      const desc = (await P.locator('.home-current .drop__desc').innerText().catch(() => '')).trim()
      await shot('home')
      return { pass: !!pinned && topic.toLowerCase() === pinned.topic.toLowerCase(), topic, pinned: pinned?.id, desc: desc.slice(0, 120) }
    })

    await step(`open ${c.open} (home or the Missions sheet)`, async () => {
      if (pinned?.id === c.open) await P.locator('.home-play').click()
      else {
        await P.getByRole('button', { name: 'Missions' }).click()
        await sleep(400)
        await P.getByRole('button', { name: `Play ${a.topic}` }).click()
      }
      await P.getByRole('button', { name: 'Start teaching' }).click()
      await P.waitForURL('**/student/mission/**', { timeout: 15000 })
      await P.locator('.bossbar').waitFor({ timeout: 15000 })
      await sleep(900)
      return { pass: true, via: pinned?.id === c.open ? 'home' : 'missions sheet' }
    })

    await step('mission shows its own boss, scene and step labels', async () => {
      const boss = await P.locator('.bossbar').getAttribute('aria-label')
      const scene = await P.locator('.mission-scene').getAttribute('data-scene').catch(() => null)
      await P.locator('.chip-tool', { hasText: 'Steps' }).click()
      await sleep(400)
      const steps = await P.locator('.levelmap .mstep:not(.mstep--boss):not(.mstep--exam)').evaluateAll((els) =>
        els.map((e) => ({ label: e.getAttribute('aria-label'), given: e.classList.contains('is-given') })),
      )
      await shot('mission-steps')
      const want = c.labels ?? a.concepts.map((k) => a.lesson.concept_labels[k.id])
      const labelsOk = want.every((l, i) => steps[i]?.label?.startsWith(`Step ${i + 1}: ${l}`))
      const noTriLeak = c.open === 'a_tri' || !steps.some((s) => TRI_LABELS.some((t) => s.label?.includes(t)))
      const sceneOk = scene === (c.scene ?? a.scene)
      return { pass: boss?.includes(c.boss) && labelsOk && noTriLeak && sceneOk, boss, scene, steps: steps.map((s) => s.label), want }
    })

    if (c.given) {
      await step('given concepts show as "Pip already knows" and do not animate', async () => {
        const g = await P.locator('.levelmap .mstep.is-given').evaluateAll((els) =>
          els.map((e) => {
            const m = e.querySelector('.meter')
            const cs = m ? getComputedStyle(m) : null
            return { label: e.getAttribute('aria-label'), anim: cs?.animationName, trans: cs?.transitionDuration }
          }),
        )
        const known = g.length === c.given.length && g.every((x) => /Pip already knows/.test(x.label ?? ''))
        const still = g.every((x) => (x.anim ?? 'none') === 'none' && /^0s/.test(x.trans ?? '0s'))
        return { pass: known && still, given: g }
      })
    }

    await step('no page errors', async () => ({ pass: R.errors.length === 0, errors: R.errors }))
    all.push(R)
    await ctx.close()
  }
  await browser.close()
}
fs.writeFileSync(path.join(OUT, `results-data1-${THEME}${ONLY ? '-' + ONLY : ''}.json`), JSON.stringify(all, null, 2))
console.log(`Done. ${failing} failing step(s).`)
process.exitCode = failing ? 1 : 0
