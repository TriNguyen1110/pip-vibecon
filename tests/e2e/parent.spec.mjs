// V4 parent journey: /parent?as=g001 (Ana R.). CONTRACT v3.13 parent side, v3.15 privacy (the tutor is the filter),
// v3.16 English only; DESIGN_SYSTEM "Audiences": calm, body >= 17px, 48px targets, 200% text zoom, no game words.
// Setup through the API: reset, Maya's K.O. (DEMO_SCRIPT), one private + one shared tutor note.
// Run: PLAYWRIGHT_MODULE=... CHROME_PATH=... AXE_PATH=... BASE_URL=http://localhost:5791 node tests/e2e/parent.spec.mjs
import { BASE, GAME_WORDS, SPANISH, VIEWPORTS, api, finish, hygiene, mayaKO, mockBadge, notBuilt, openRun, sleep, visibleText } from './lib/harness.mjs'

const stamp = Date.now().toString(36).slice(-5)
const PRIVATE_NOTE = `Private v4 ${stamp}: rushes to the formula.`
const SHARED_NOTE = `Shared v4 ${stamp}: Maya explained why a triangle is half a rectangle.`
const ACTIVITY_TIME = /\bactive\s+\d+\s*(m|min|h|d)\b|\b\d+\s*(m|min|h|d)\s+ago\b|minutes? teaching/i
const BODY_SEL = '.p-body, .p-summary, .p-msg__text, .p-quote, .p-fixed__before, .p-fixed__after, .p-h, .p-choice b, .p-field legend, .p-input, .p-btn, .p-class__name, .p-top__hi'

async function run(vp) {
  const H = await openRun('parent', vp)
  const { page } = H
  let ko
  let home
  const texts = {}
  const tabBtn = (name) => H.P.getByRole('navigation', { name: 'Sections' }).getByRole('button', { name })
  let TABS = []
  // Visit every bottom tab and keep its visible text (F18 renamed them: From tutor / Messages / Schedule / Settings).
  const visitTabs = async (label) => {
    TABS = (await H.P.getByRole('navigation', { name: 'Sections' }).locator('.p-tab__label').allTextContents()).map((x) => x.trim())
    for (const t of TABS) {
      await tabBtn(t).click()
      await sleep(600)
      texts[`${label}:${t}`] = await visibleText(H.P)
    }
    await tabBtn(TABS[0]).click()
    await sleep(300)
  }
  const openApp = async (q = 'as=g001') => {
    await page.goto(`${BASE}/parent?${q}`)
    await H.inApp()
    await H.P.locator('.p-main').waitFor({ timeout: 15000 })
    await H.P.locator('.p-state[role=status]').waitFor({ state: 'detached', timeout: 10000 }).catch(() => {})
    await sleep(500)
  }

  try {
    await H.step('setup: reset, Maya’s K.O., private + shared notes', async () => {
      await api('/demo/reset', 'POST')
      ko = await mayaKO()
      const a = await api('/students/s001/notes', 'POST', { tutor_id: 't1', subject: 'math', text: PRIVATE_NOTE, share_with_parent: false }, { nb: true })
      const b = await api('/students/s001/notes', 'POST', { tutor_id: 't1', subject: 'math', text: SHARED_NOTE, share_with_parent: true }, { nb: true })
      // v3.15: parents see only what the tutor sends. Ms. Rivera approves and sends the K.O. update (B18 drafts;
      // before B18 the v3.13 per-session send).
      let sent
      const d = await api('/students/s001/drafts', 'POST', { session_id: ko.id })
      if (d.status === 404 && d.json?.detail === 'Not Found') sent = await api(`/sessions/${ko.id}/parent-update/send`, 'POST', { message: null })
      else sent = await api(`/drafts/${d.json.id}/send`, 'POST', {})
      home = (await api('/parent/g001/home', 'GET', null, { nb: true })).json
      return { pass: ko.ko && a.status < 300 && b.status < 300 && sent.status < 300 && home.kids?.length >= 2, ko: ko.ko, sent: sent.status, kids: home.kids?.map((k) => k.student.name) }
    })

    await H.step('open /parent?as=g001 (live data, demo label)', async () => {
      await openApp()
      const hi = await H.P.locator('.p-top__hi').textContent()
      const demo = await H.P.locator('.p-demo').textContent()
      await H.shot('week-maya')
      return { pass: /Ana/.test(hi) && /demo/.test(demo) && !(await mockBadge(H.P)), hi, demo }
    })

    await H.step('kid switcher Maya <-> Theo (s014)', async () => {
      const kids = H.P.getByRole('tablist', { name: 'Your children' })
      const names = await kids.getByRole('tab').allTextContents()
      await kids.getByRole('tab', { name: 'Theo' }).click()
      await sleep(500)
      const theo = await H.P.locator('.p-hero').innerText()
      texts.theoWeek = await visibleText(H.P)
      await H.shot('week-theo')
      await kids.getByRole('tab', { name: 'Maya' }).click()
      await sleep(500)
      const maya = await H.P.locator('.p-hero').innerText()
      return { pass: names.includes('Maya') && names.includes('Theo') && /Theo/.test(theo) && /Maya/.test(maya), names }
    })

    await H.step('this week: Maya’s verbatim taught quote + fixed mistake before -> after', async () => {
      const said = ko.transcript.filter((m) => m.from === 'student').map((m) => m.text)
      const quote = (await H.P.locator('.p-quote').first().textContent().catch(() => '')).trim().replace(/^[“"]|[”"]$/g, '')
      const before = await H.P.locator('.p-fixed__before').textContent().catch(() => null)
      const after = await H.P.locator('.p-fixed__after').textContent().catch(() => null)
      texts.week = await visibleText(H.P)
      await H.overflow('week')
      await H.contrast('week')
      await H.targets('week', 48)
      return { pass: said.includes(quote) && /b\s*×\s*h/.test(before ?? '') && said.includes(after), quote, before, after }
    })

    await H.step('shared tutor note visible (any tab)', async () => {
      await visitTabs('maya')
      const where = Object.entries(texts).filter(([, t]) => t.includes(SHARED_NOTE)).map(([k]) => k)
      for (const t of TABS.slice(1, 3)) {
        await tabBtn(t).click()
        await sleep(400)
        await H.shot(`tab-${t}`)
        await H.overflow(`tab-${t}`)
        await H.targets(`tab-${t}`, 48)
        await H.contrast(`tab-${t}`)
      }
      await tabBtn(TABS[0]).click()
      return { pass: where.length > 0, tabs: TABS, where }
    })

    await H.step('D-21: package line reads "N of M hours left" (Schedule)', async () => {
      const sched = Object.entries(texts).find(([k]) => /Schedule|Classes/.test(k))?.[1] ?? ''
      const line = sched.match(/[^\n]*hours? left[^\n]*/i)?.[0] ?? null
      return { pass: !!line && /\d+ of \d+ hours? left/i.test(line) && !/of\s+hours/i.test(line), line }
    })

    await H.step('messages: thread with Ms. Rivera; message the tutor', async () => {
      await tabBtn(TABS.find((t) => /Messages/.test(t)) ?? 'Messages').click()
      await H.P.getByRole('list', { name: 'Messages' }).waitFor({ timeout: 8000 })
      const who = await H.P.locator('.p-msg__who').allTextContents()
      const msg = `Thank you! She liked it. (${stamp})`
      await H.P.locator('#p-compose').fill(msg)
      const resp = page.waitForResponse((r) => r.url().includes('/api/threads') && r.request().method() === 'POST')
      await H.P.getByRole('button', { name: 'Send', exact: true }).click()
      const m = await (await resp).json()
      await H.P.locator('.p-msg--me .p-msg__text', { hasText: msg }).waitFor({ timeout: 8000 })
      const t = (await api('/threads?student_id=s001&guardian_id=g001')).json.items
      texts.messages = await visibleText(H.P)
      await H.shot('messages')
      await H.overflow('messages')
      await H.targets('messages', 48)
      await H.contrast('messages')
      return { pass: who.some((w) => /Rivera/.test(w)) && m.from === 'guardian' && t.some((x) => x.text === msg), who: [...new Set(who)], status: m.status }
    })

    await H.step('settings: cadence + quiet hours + channel persist after reload', async () => {
      await tabBtn('Settings').click()
      await H.P.getByRole('button', { name: 'Save settings' }).waitFor({ timeout: 8000 })
      await H.P.getByRole('radio', { name: /Once a week/ }).check()
      await H.P.getByRole('radio', { name: /^Email/ }).check()
      await H.P.getByRole('checkbox', { name: /Don’t message me/ }).uncheck()
      await H.P.getByRole('button', { name: 'Save settings' }).click()
      await H.P.getByRole('status').filter({ hasText: 'Saved.' }).waitFor({ timeout: 8000 })
      texts.settings = await visibleText(H.P)
      await H.shot('settings-saved')
      await H.targets('settings', 48)
      await H.contrast('settings')
      await openApp()
      await tabBtn('Settings').click()
      await sleep(400)
      const weekly = await H.P.getByRole('radio', { name: /Once a week/ }).isChecked()
      const email = await H.P.getByRole('radio', { name: /^Email/ }).isChecked()
      const quiet = await H.P.getByRole('checkbox', { name: /Don’t message me/ }).isChecked()
      const g = (await api('/parent/g001/home')).json.guardian
      await H.shot('settings-after-reload')
      // put Ana back for the next run
      await api('/guardians/g001', 'PATCH', { updates: 'every_ko', prefers: 'sms', quiet_hours: '21:00-07:00' })
      return { pass: weekly && email && !quiet && g.updates === 'weekly' && g.prefers === 'email' && !g.quiet_hours, ui: { weekly, email, quiet }, api: { updates: g.updates, prefers: g.prefers, quiet_hours: g.quiet_hours } }
    })

    await H.step('private tutor note is NOT visible (any tab, any payload)', async () => {
      const all = Object.values(texts).join('\n')
      const kid = (await api('/parent/g001/kids/s001')).json
      const payload = JSON.stringify(home) + JSON.stringify(kid) + JSON.stringify((await api('/parent/g001/home')).json)
      return { pass: !all.includes(PRIVATE_NOTE) && !payload.includes(PRIVATE_NOTE) && payload.includes(SHARED_NOTE), inUI: all.includes(PRIVATE_NOTE), inPayload: payload.includes(PRIVATE_NOTE) }
    })

    await H.step('no game words on parent screens (K.O., boss, brain v, weapon)', async () => {
      const all = Object.entries(texts).map(([k, t]) => [k, (t.match(GAME_WORDS) ?? [])[0]]).filter(([, w]) => w)
      return { pass: all.length === 0, hits: all }
    })

    await H.step('access isolation: g001 cannot open s002 (API 403, friendly UI)', async () => {
      const r = await api('/parent/g001/kids/s002')
      const s002 = (await api('/students/s002')).json?.student?.name ?? 's002'
      H.expect(/\/api\/parent\/g001\/kids\/s002/, 403)
      await openApp('as=g001&kid=s002')
      const t = await visibleText(H.P)
      await H.shot('isolation-s002')
      const leaked = t.includes(s002.split(' ')[0])
      const friendly = /not (linked|yours|available)|can’t|cannot|isn’t (linked|set up)|only see your/i.test(t)
      return { pass: r.status === 403 && !leaked && friendly, apiStatus: r.status, leakedName: leaked, friendlyMessage: friendly, note: friendly ? null : 'UI silently falls back to the first linked child; no message' }
    })

    await H.step('body text >= 17px, tap targets >= 48px', async () => {
      await openApp() // back from the isolation probe's notice to Ana's real app
      const out = {}
      for (const t of TABS) {
        await tabBtn(t).click()
        await sleep(400)
        out[t] = await H.P.evaluate((sel) => {
          const els = [...document.querySelectorAll(sel)].filter((e) => e.getBoundingClientRect().width > 0)
          const small = els.map((e) => ({ c: e.className, px: parseFloat(getComputedStyle(e).fontSize), t: e.textContent.trim().slice(0, 30) })).filter((x) => x.px < 17)
          const min = Math.min(...[...document.querySelectorAll('.parent-app *')].filter((e) => e.getBoundingClientRect().width > 0 && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())).map((e) => parseFloat(getComputedStyle(e).fontSize)))
          const caps = [...document.querySelectorAll('.p-cap')].filter((e) => e.getBoundingClientRect().width > 0).map((e) => parseFloat(getComputedStyle(e).fontSize))
          return { bodyEls: els.length, small: small.slice(0, 5), minAnyText: min, minCaption: caps.length ? Math.min(...caps) : null }
        }, BODY_SEL)
        await H.targets(`tab-${t}`, 48)
      }
      const small48 = [...new Map(H.R.smallTargets.map((x) => [`${x.el}|${x.text}`, x])).values()]
      // D-25: captions >= 15px as well
      return { pass: Object.values(out).every((x) => x.small.length === 0 && (x.minCaption ?? 15) >= 15) && small48.length === 0, fonts: out, targetsUnder48: small48.slice(0, 10) }
    })

    await H.step('200% text zoom: no horizontal overflow (every tab)', async () => {
      const out = {}
      for (const t of TABS) {
        await tabBtn(t).click()
        await H.P.evaluate(() => (document.documentElement.style.fontSize = '200%'))
        await sleep(400)
        const o = await H.overflow(`zoom200-${t}`)
        const rootPx = await H.P.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.p-body, .p-h, p') ?? document.body).fontSize))
        await H.shot(`zoom200-${t}`)
        out[t] = { overflows: o.overflows, wide: o.wide, samplePx: rootPx }
        await H.P.evaluate(() => (document.documentElement.style.fontSize = ''))
      }
      const scaled = Object.values(out).every((x) => x.samplePx >= 30)
      return { pass: Object.values(out).every((x) => !x.overflows) && scaled, scaled, out }
    })

    /* ---- v3.15 privacy + v3.16 English only (B18/F18; NOT BUILT until they land) ---- */
    const h = (await api('/parent/g001/home')).json
    const b18 = h.kids.every((k) => !('minutes' in (k.this_week ?? {})))
    const v316 = !('language' in (h.guardian ?? {}))

    await H.step('v3.15: no minutes and no "active Xm ago" on parent screens', async () => {
      const hits = Object.entries(texts).map(([k, t]) => [k, (t.match(ACTIVITY_TIME) ?? [])[0]]).filter(([, w]) => w)
      if (!b18) notBuilt('parent this_week still carries minutes (B18)')
      return { pass: hits.length === 0, hits }
    })

    await H.step('v3.15: grade >= 7 (Theo) shows no quote unless shared or sent', async () => {
      const theo = h.kids.find((k) => k.student.id === 's014')
      const q = theo?.this_week?.taught_quote
      // shared = the student picked it (taught_from = the student) or it came in a tutor-sent report
      const shared = !!(theo?.this_week?.taught_from || theo?.this_week?.quote_from || theo?.this_week?.shared_quote)
      const uiQuote = /taught Pip\s*\n?\s*“/.test(texts.theoWeek ?? '')
      if (!b18 && (q || uiQuote)) notBuilt('Theo (grade 9) still gets an auto-picked quote (B18/F18)')
      return { pass: (!q && !uiQuote) || shared, apiQuote: q ?? null, uiQuote, shared }
    })

    await H.step('v3.15: every parent item says who sent it ("From Ms. Rivera")', async () => {
      const items = [h.kids[0]?.this_week?.shared_note].filter(Boolean)
      const fromOk = items.every((x) => x.from?.name || x.tutor_name)
      const label = /From (Ms\.|Mr\.|Mrs\.)/.test(texts.week ?? '')
      if (!b18 && !items.every((x) => x.from)) notBuilt('items carry no from {tutor_id, name} yet (B18)')
      return { pass: fromOk && label, fromOk, label }
    })

    await H.step('v3.16: parent-facing text is English; no language setting', async () => {
      const all = Object.values(texts).join('\n')
      const spanish = (all.match(SPANISH) ?? [])[0] ?? null
      const langSetting = /Language for updates/i.test(texts.settings ?? '')
      if (!v316 && (spanish || langSetting)) notBuilt('Guardian.language / language setting still present (v3.16 not landed)')
      return { pass: !spanish && !langSetting, spanish, langSetting }
    })

    await H.step('AA contrast on parent screens', async () => {
      const bad = Object.entries(H.R.contrast).filter(([, c]) => c.violations > 0)
      return { pass: bad.length === 0, tool: Object.values(H.R.contrast)[0]?.tool, bad: bad.map(([k, c]) => ({ screen: k, n: c.violations, nodes: c.nodes?.slice(0, 4) })) }
    })
    await hygiene(H)
  } finally {
    await H.close()
  }
  return H.R
}

const runs = []
for (const vp of VIEWPORTS) runs.push(await run(vp))
finish('parent', runs)
