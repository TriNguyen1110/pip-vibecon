// V4 staff journey: Tutor Studio (/tutor), Maya's profile, Owner (/owner), and the old staff paths.
// CONTRACT v3.13 / v3.13b / v3.15 / v3.16. Owner numbers are read before and after Maya's K.O. (run through the API
// with the DEMO_SCRIPT texts, same as the student journey) so the renewal signal flip is checked on screen.
// Run: PLAYWRIGHT_MODULE=... CHROME_PATH=... AXE_PATH=... BASE_URL=http://localhost:5791 node tests/e2e/tutor_owner.spec.mjs
import { BASE, SPANISH, VIEWPORTS, api, finish, hygiene, mayaKO, mockBadge, notBuilt, openRun, sleep } from './lib/harness.mjs'

const usd = (n) => `$${Number(n).toLocaleString('en-US')}`
const FLAGS = { at_risk: 'At risk', needs_update: 'Needs parent update', no_contact: 'No parent contact', new: 'New' }
const stamp = Date.now().toString(36).slice(-5)
const PRIVATE_NOTE = `Private v4 ${stamp}: rushes to the formula, ask her to draw it first.`
const SHARED_NOTE = `Shared v4 ${stamp}: Maya explained why a triangle is half a rectangle.`

async function run(vp) {
  const H = await openRun('tutor_owner', vp)
  const { page } = H
  const desktop = vp.w >= 1024
  const MIN = vp.mobile ? 44 : 24 // Studio: 44px touch rows on phone/iPad; laptop = WCAG 2.5.8 (24px)
  let before
  let koSid
  const rowsShown = async () => page.locator('.st__row:not(.st__row--th)').count()
  const footCount = async () => Number((await page.locator('.st-foot .mono').first().textContent().catch(() => 'NaN')) ?? NaN)

  try {
    await H.step('reset + owner numbers before the K.O.', async () => {
      await api('/demo/reset', 'POST')
      before = (await api('/center/overview', 'GET', null, { nb: true })).json
      const maya = before.renewals_due?.find((r) => r.student?.id === 's001')
      await page.goto(`${BASE}/owner`)
      await page.locator('.metric--big .metric__n').waitFor({ timeout: 15000 })
      await sleep(500)
      const head = (await page.locator('.metric--big .metric__n').textContent()).trim()
      await H.shot('owner-before')
      return { pass: head.startsWith(usd(before.revenue_at_risk_usd)) && maya?.signal === 'quiet', headline: head, api: before.revenue_at_risk_usd, mayaSignal: maya?.signal, mayaPrice: maya?.price_usd }
    })

    await H.step("Maya's K.O. (DEMO_SCRIPT through the API)", async () => {
      const s = await mayaKO()
      koSid = s.id
      return { pass: s.ko === true && s.brain_version === 2, sid: s.id }
    })

    /* ---------------- Tutor Studio ---------------- */
    await H.step('Tutor Studio loads Ms. Rivera’s students (live data, no mock)', async () => {
      await page.goto(`${BASE}/tutor`)
      await page.getByRole('table', { name: 'Students and subjects' }).waitFor({ timeout: 15000 })
      await sleep(600)
      const api1 = (await api('/tutors/t1/students', 'GET', null, { nb: true })).json
      const n = await rowsShown()
      await H.shot('tutor-studio')
      const o = await H.overflow('tutor', page)
      await H.targets('tutor', MIN, page, '.st__row .st__name') // the whole 44px+ row opens the profile
      await H.contrast('tutor', page)
      return { pass: n === api1.rows.length && !(await mockBadge(page)) && !o.overflows, rows: n, apiRows: api1.rows.length, overflow: o.wide }
    })

    await H.step('tutor switcher: Mr. Chen and back', async () => {
      const sel = page.getByRole('combobox', { name: 'Viewing as tutor' })
      const opts = await sel.locator('option').allTextContents()
      const t2 = (await api('/tutors/t2/students')).json
      await sel.selectOption('t2')
      await page.waitForFunction((n) => document.querySelectorAll('.st__row:not(.st__row--th)').length === n, t2.rows.length, { timeout: 10000 }).catch(() => {})
      const n2 = await rowsShown()
      const names2 = await page.locator('.st__name').allTextContents()
      await H.shot('tutor-switch-chen')
      await sel.selectOption('t1')
      await sleep(800)
      const n1 = await rowsShown()
      return { pass: opts.length >= 2 && n2 === t2.rows.length && names2.every((x) => t2.rows.some((r) => r.student.name === x)), tutors: opts.length, chenRows: n2, apiChen: t2.rows.length, riveraRows: n1 }
    })

    await H.step('subject filter', async () => {
      const chips = page.getByRole('group', { name: 'Subject' }).getByRole('button')
      const labels = await chips.allTextContents()
      if (labels.length < 2) return { pass: false, labels, note: 'only one subject chip' }
      const out = {}
      for (const lab of labels.slice(1)) {
        await page.getByRole('group', { name: 'Subject' }).getByRole('button', { name: lab, exact: true }).click()
        await sleep(300)
        const subs = await page.locator('.st__row:not(.st__row--th) .st__subs').allTextContents()
        out[lab] = { rows: subs.length, allMatch: subs.every((t) => t.includes(lab)) }
      }
      await H.shot('tutor-subject-filter')
      await page.getByRole('group', { name: 'Subject' }).getByRole('button', { name: 'All subjects' }).click()
      return { pass: Object.values(out).every((x) => x.rows > 0 && x.allMatch), out }
    })

    await H.step('search "Maya"', async () => {
      await page.getByRole('searchbox', { name: 'Find a student' }).fill('Maya')
      await sleep(300)
      const names = await page.locator('.st__name').allTextContents()
      await H.shot('tutor-search')
      await page.getByRole('searchbox', { name: 'Find a student' }).fill('')
      return { pass: names.length === 1 && /Maya/.test(names[0]), names }
    })

    await H.step('flag filters: at risk / needs update / no contact / new', async () => {
      const out = {}
      const retries = []
      const setChip = async (chip, on, f) => {
        for (let i = 0; i < 3; i++) {
          if ((await chip.getAttribute('aria-pressed')) === String(on)) return
          if (i > 0) retries.push(`${f}->${on}`)
          await chip.click()
          await sleep(300)
        }
      }
      for (const [f, word] of Object.entries(FLAGS)) {
        const apiN = (await api(`/tutors/t1/students?filter=${f}`)).json?.rows?.length
        const chip = page.getByRole('group', { name: 'Flags' }).getByRole('button', { name: new RegExp(`^${word}`) })
        const disabled = await chip.isDisabled()
        if (disabled) {
          out[f] = { apiN, disabled, ok: apiN === 0 }
          continue
        }
        await setChip(chip, true, f)
        const rows = page.locator('.st__row:not(.st__row--th)')
        const n = await rows.count()
        const flagged = await rows.evaluateAll((els, w) => els.every((e) => e.textContent.includes(w)), word)
        if (f === 'at_risk') await H.shot('tutor-flag-at-risk')
        await setChip(chip, false, f)
        out[f] = { ui: n, apiN, flagged, ok: n === apiN && flagged && n > 0 }
      }
      return { pass: Object.values(out).every((x) => x.ok), out, toggleRetries: retries }
    })

    await H.step('multi-select -> bulk assign mission (distinct assignments)', async () => {
      const boxes = page.locator('.st__row:not(.st__row--th) input[type=checkbox]')
      const ids = []
      for (let i = 1; i <= 2; i++) {
        await boxes.nth(i).check()
        ids.push(await boxes.nth(i).getAttribute('aria-label'))
      }
      await page.getByRole('region', { name: 'Selected students' }).getByRole('button', { name: /Assign mission to 2 students/ }).click()
      const dlg = page.getByRole('dialog', { name: 'Assign a mission to several students' })
      await dlg.waitFor()
      await dlg.getByRole('button', { name: 'Solving two-step equations' }).click()
      const resp = page.waitForResponse((r) => r.url().includes('/api/assignments/bulk'), { timeout: 30000 })
      await dlg.getByRole('button', { name: 'Draft the mission' }).click()
      await dlg.getByRole('button', { name: /Assign to 2 students/ }).waitFor({ timeout: 30000 })
      await H.shot('tutor-bulk-draft')
      await dlg.getByRole('button', { name: /Assign to 2 students/ }).click()
      const r = await (await resp).json()
      await dlg.getByText('Mission assigned').waitFor({ timeout: 10000 })
      await H.shot('tutor-bulk-saved')
      const as = r.assignments ?? []
      const distinct = new Set(as.map((a) => a.id)).size === as.length && new Set(as.map((a) => a.student_id)).size === as.length
      const onHome = await Promise.all(as.map(async (a) => (await api(`/students/${a.student_id}`)).json?.assignments?.some((x) => x.id === a.id)))
      await dlg.getByRole('button', { name: 'Done' }).click()
      return { pass: as.length === 2 && distinct && onHome.every(Boolean), selected: ids, assignments: as.map((a) => [a.id, a.student_id, a.topic]), onHome }
    })

    /* ---------------- Maya's profile ---------------- */
    const openMaya = async () => {
      await page.goto(`${BASE}/tutor`)
      await page.getByRole('table', { name: 'Students and subjects' }).waitFor({ timeout: 15000 })
      await page.locator('.st__name', { hasText: 'Maya' }).first().click()
      if (!desktop) await page.waitForURL('**/tutor/students/s001**')
      await page.locator('.profile__name', { hasText: 'Maya' }).waitFor({ timeout: 10000 })
      await sleep(400)
    }
    const tab = (name) => page.getByRole('tablist', { name: 'Profile sections' }).getByRole('tab', { name })

    await H.step('Maya profile: math + writing progress', async () => {
      await openMaya()
      const subj = await page.locator('.prog__title').allTextContents()
      const mastery = await page.locator('.mastery__row').count()
      await H.shot('profile-progress')
      await H.overflow('profile', page)
      await H.targets('profile', MIN, page)
      await H.contrast('profile', page)
      return { pass: subj.some((s) => /Math/.test(s)) && subj.some((s) => /Writing/.test(s)) && mastery >= 3, subjects: subj, masteryRows: mastery }
    })

    await H.step('Maya profile: guardians Ana R. + Sam R.', async () => {
      await tab('Family').click()
      await page.getByRole('region', { name: 'Guardians' }).waitFor({ timeout: 8000 })
      const t = await page.getByRole('region', { name: 'Guardians' }).innerText()
      await H.shot('profile-family')
      return { pass: /Ana R\./.test(t) && /Sam R\./.test(t), text: t.slice(0, 240) }
    })

    await H.step('add a private note and a shared note', async () => {
      await tab('Notes').click()
      const ta = page.locator('textarea.textarea').first()
      await ta.fill(PRIVATE_NOTE)
      await page.getByRole('button', { name: 'Save private note' }).click()
      await page.locator('.note__text', { hasText: PRIVATE_NOTE }).waitFor({ timeout: 8000 })
      await page.getByRole('switch', { name: 'Share with family' }).check({ force: true }) // the styled track sits over the input
      await ta.fill(SHARED_NOTE)
      await page.getByRole('button', { name: 'Save and share' }).click()
      await page.locator('.note__text', { hasText: SHARED_NOTE }).waitFor({ timeout: 8000 })
      await H.shot('profile-notes')
      const notes = (await api('/students/s001/profile')).json.notes
      const p = notes.find((n) => n.text === PRIVATE_NOTE)
      const s = notes.find((n) => n.text === SHARED_NOTE)
      return { pass: p?.share_with_parent === false && s?.share_with_parent === true, private: !!p, shared: !!s }
    })

    await H.step('message a parent (test mode or queued for quiet hours)', async () => {
      await tab('Family').click()
      const box = page.getByRole('region', { name: 'Messages with the family' })
      await box.waitFor({ timeout: 8000 })
      const tabs = box.getByRole('tablist', { name: 'Guardian' })
      if (await tabs.count()) await tabs.getByRole('tab', { name: 'Ana' }).click()
      const text = `See you Tuesday at 4:30. (${stamp})`
      await box.locator('textarea').fill(text)
      const resp = page.waitForResponse((r) => r.url().includes('/api/threads') && r.request().method() === 'POST')
      await box.getByRole('button', { name: 'Send' }).click()
      const m = await (await resp).json()
      await box.locator('.msg__text', { hasText: text }).waitFor({ timeout: 8000 })
      const tag = await box.locator('li.msg', { hasText: text }).locator('.status-tag').textContent().catch(() => null)
      await H.shot('profile-thread')
      return { pass: /test-mode|queued \(quiet hours\)/.test(m.status) && !!tag, status: m.status, tag }
    })

    await H.step('parent update per guardian (Ana + Sam)', async () => {
      await tab('Family').click()
      const queue = page.getByRole('region', { name: 'To send' })
      let ana, sam, tags, flow, sentItems
      await sleep(600)
      if (await queue.count()) {
        // v3.15 (F18): tutor-approved drafts in a "To send" queue.
        flow = 'v3.15 To send queue'
        const draftBtn = queue.getByRole('button', { name: 'Draft an update' })
        if (await draftBtn.count()) await draftBtn.click()
        const card = queue.locator('article').first() // newest draft first (the K.O. update)
        H.R.notes.draftsQueued = await queue.locator('article').count()
        const approve = card.getByRole('button', { name: /Approve and send to \d/ })
        await approve.waitFor({ timeout: 15000 })
        ana = await card.getByRole('textbox', { name: 'Message to Ana R.' }).inputValue().catch(() => null)
        sam = await card.getByRole('textbox', { name: 'Message to Sam R.' }).inputValue().catch(() => null)
        await H.shot('profile-update-draft')
        const resp = page.waitForResponse((r) => r.request().method() === 'POST' && /drafts\/.+\/send|parent-update\/send/.test(r.url()), { timeout: 15000 })
        await approve.click()
        const sent = await (await resp).json()
        sentItems = (sent.sent_all ?? sent.items ?? [sent.sent]).map((x) => x && [x.guardian_id ?? x.to, x.status])
        await sleep(600)
        tags = await card.locator('.status-tag').allTextContents().catch(() => [])
        if (tags.length < 2) tags = sentItems?.map((x) => x?.[1]).filter(Boolean) ?? tags
      } else {
        // v3.13: Send parent update -> Preview -> Send to N guardians.
        flow = 'v3.13 preview/send'
        await page.getByRole('button', { name: /Send parent update|Update the family/ }).click()
        const box = page.getByRole('region', { name: 'Parent update' })
        await box.waitFor({ timeout: 8000 })
        await box.getByRole('button', { name: 'Preview the update' }).click()
        await box.getByRole('button', { name: /Send to \d guardian/ }).waitFor({ timeout: 15000 })
        ana = await box.getByRole('textbox', { name: 'Message to Ana R.' }).inputValue().catch(() => null)
        sam = await box.getByRole('textbox', { name: 'Message to Sam R.' }).inputValue().catch(() => null)
        await H.shot('profile-update-preview')
        const resp = page.waitForResponse((r) => /parent-update\/send/.test(r.url()))
        await box.getByRole('button', { name: /Send to \d guardian/ }).click()
        const sent = await (await resp).json()
        sentItems = (sent.items ?? [sent.sent]).map((x) => x && [x.to ?? x.guardian_id, x.status])
        await sleep(600)
        tags = await box.locator('.status-tag').allTextContents()
      }
      await H.shot('profile-update-sent')
      H.R.notes.update = { ana, sam }
      return { pass: !!ana && !!sam && tags.length >= 2, flow, draftsQueued: H.R.notes.draftsQueued, anaPreview: ana?.slice(0, 160), samPreview: sam?.slice(0, 160), tags, sentItems }
    })

    await H.step('D-27: one K.O. queues exactly one draft (no draft from the saved session)', async () => {
      const n = H.R.notes.draftsQueued
      const api1 = (await api('/students/s001/drafts')).json?.items ?? []
      return { pass: n === 1, queuedBeforeSend: n, openAfterSend: api1.map((d) => d.session_id) }
    })

    await H.step('parent updates are English with no game words (v3.16, B18/F18)', async () => {
      const { ana, sam } = H.R.notes.update ?? {}
      const g = (await api('/students/s001/profile')).json.guardians
      const landed = !g.some((x) => 'language' in x)
      const spanish = SPANISH.test(ana ?? '')
      const game = /\bK\.O\.|\bboss\b|brain v\d|\bweapon/i.test(`${ana} ${sam}`)
      if (!landed && spanish) notBuilt('Guardian.language still present and Ana’s update is Spanish (v3.16 English-only not landed)')
      return { pass: !spanish && !game, spanish, game, guardianLanguageField: !landed }
    })

    /* ---------------- Owner ---------------- */
    let after
    await H.step('owner: Maya flips to engaged; revenue at risk drops by her package', async () => {
      after = (await api('/center/overview')).json
      await page.goto(`${BASE}/owner`)
      await page.locator('.metric--big .metric__n').waitFor({ timeout: 15000 })
      await sleep(500)
      const head = (await page.locator('.metric--big .metric__n').textContent()).trim()
      const row = page.getByRole('table', { name: 'Renewals due' }).getByRole('row').filter({ hasText: 'Maya' }).first()
      const signal = await row.locator('.pill').textContent()
      const b = before.renewals_due.find((r) => r.student.id === 's001')
      const a = after.renewals_due.find((r) => r.student.id === 's001')
      await H.shot('owner-after')
      await H.overflow('owner', page)
      await H.targets('owner', MIN, page)
      await H.contrast('owner', page)
      return {
        pass: a?.signal === 'engaged' && /Engaged/.test(signal) && after.revenue_at_risk_usd === before.revenue_at_risk_usd - b.price_usd && head.startsWith(usd(after.revenue_at_risk_usd)) && !(await mockBadge(page)),
        before: before.revenue_at_risk_usd,
        after: after.revenue_at_risk_usd,
        headline: head,
        signal,
        renewalsDue: after.renewals_due.length,
      }
    })

    await H.step('owner: every metric explains itself; revenue headline = sum of listed packages', async () => {
      const btns = page.locator('.metric__btn')
      const n = await btns.count()
      const out = []
      for (let i = 0; i < n; i++) {
        await btns.nth(i).click()
        const ex = await page.locator('.metric').nth(i).locator('.metric__explain').innerText().catch(() => '')
        out.push({ label: (await btns.nth(i).locator('.eyebrow').textContent())?.trim(), explain: ex.slice(0, 120) })
      }
      const sum = await page.locator('.metric__sum').textContent().catch(() => '')
      const total = (sum.match(/\$[\d,]+/g) ?? []).reduce((t, x) => t + Number(x.replace(/[$,]/g, '')), 0)
      const rowNames = await page.locator('.rn__row:not(.rn__row--th) .rn__name').allTextContents()
      const rows = rowNames.length + 1
      const missing = after.renewals_due.filter((r) => !rowNames.includes(r.student.name)).map((r) => `${r.student.name} ${r.subject}`)
      await H.shot('owner-metrics-open')
      return { pass: n >= 5 && out.every((x) => x.explain.length > 30) && total === after.revenue_at_risk_usd && rows - 1 === after.renewals_due.length, metrics: out, sumOfListed: total, headline: after.revenue_at_risk_usd, renewalRows: rows - 1, apiRows: after.renewals_due.length, missingInUI: missing }
    })

    await H.step('owner: send a renewal note (preview first, K.O. quote as evidence)', async () => {
      const row = page.getByRole('table', { name: 'Renewals due' }).getByRole('row').filter({ hasText: 'Maya' }).first()
      await row.getByRole('button', { name: 'Send renewal note' }).click()
      const dlg = page.getByRole('dialog', { name: 'Renewal note' })
      await dlg.getByRole('textbox', { name: 'Renewal note' }).waitFor({ timeout: 15000 })
      const text = await dlg.getByRole('textbox', { name: 'Renewal note' }).inputValue()
      await H.shot('owner-renewal-preview')
      const resp = page.waitForResponse((r) => r.url().includes('/api/threads') && r.request().method() === 'POST', { timeout: 15000 })
      await dlg.getByRole('button', { name: 'Send renewal note' }).click()
      const m = await (await resp).json()
      await sleep(500)
      await H.shot('owner-renewal-sent')
      const quote = after.renewals_due.find((r) => r.student.id === 's001')?.evidence_quote
      await dlg.getByRole('button', { name: 'Done' }).click().catch(() => {})
      const rowNow = await row.innerText()
      return { pass: !!text && /test-mode|queued/.test(m.status) && (!quote || text.includes(quote)) && /Note sent/.test(rowNow), status: m.status, preview: text.slice(0, 200), evidenceQuote: quote, englishOnly: !SPANISH.test(text) }
    })

    /* ---------------- Old staff paths ---------------- */
    await H.step('old path: gap report (same quote, fixed after 1 re-teach, root cause)', async () => {
      await openMaya()
      const link = page.getByRole('link', { name: /Gap report/ }).first()
      await link.click()
      await page.waitForURL(`**/tutor/report/**`)
      await page.locator('.gap').first().waitFor({ timeout: 10000 })
      await sleep(500)
      const s = (await api(`/sessions/${koSid}`)).json
      const k3 = s.brain.find((r) => r.concept_id === 'k3')
      const gaps = await page.locator('.gap').allInnerTexts()
      const tuesday = await page.locator('.tuesday').innerText().catch(() => '')
      await H.shot('gap-report')
      return { pass: page.url().includes(koSid) && gaps.some((g) => g.includes(k3.quote) && /fixed after 1 re-teach/.test(g)) && /Root cause/i.test(tuesday), url: page.url().replace(BASE, ''), k3: k3.quote }
    })

    await H.step('old path: owner insight -> Plan a workshop', async () => {
      await page.goto(`${BASE}/owner`)
      const btn = page.getByRole('button', { name: 'Plan a workshop' })
      await btn.waitFor({ timeout: 10000 })
      const count = (await page.locator('.insight__count').textContent().catch(() => '')).trim()
      await btn.click()
      await page.getByText('Workshop note saved', { exact: false }).first().waitFor({ timeout: 10000 })
      await H.shot('owner-workshop')
      return { pass: !!count, count }
    })

    await H.step('old path: pricing -> Start pilot -> success', async () => {
      await page.goto(`${BASE}/owner/pricing`)
      await page.getByRole('button', { name: 'Start pilot' }).waitFor({ timeout: 10000 })
      await H.shot('pricing')
      await H.targets('pricing', MIN, page)
      await page.getByRole('button', { name: 'Start pilot' }).click()
      await page.waitForURL('**/pilot/success**', { timeout: 15000 })
      await page.getByText('Your pilot is on.').waitFor({ timeout: 10000 })
      await H.shot('pilot-success')
      const c = (await api('/center')).json
      return { pass: c.pilot?.status === 'active', pilot: c.pilot }
    })

    await H.step(`${MIN}px tap targets on staff screens`, async () => {
      const uniq = [...new Map(H.R.smallTargets.map((t) => [`${t.screen}|${t.el}|${t.text}`, t])).values()]
      return { pass: uniq.length === 0, count: uniq.length, small: uniq.slice(0, 14) }
    })
    await H.step('AA contrast on staff screens', async () => {
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
finish('tutor_owner', runs)
