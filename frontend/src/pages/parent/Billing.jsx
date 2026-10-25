import { useEffect, useState } from 'react'
import { Dots } from '../../components/ui.jsx'
import { staffApi } from '../../staff/api'
import { PENDING, enrollmentId, isLow, renewHours } from '../../staff/billing'
import { METHOD_WORDS, PAID_WITH_WORDS, firstName, fmtDate, refId, refName, subjectName, usd } from '../../staff/format'

// CONTRACT v3.19/b/c: parents pay the center by Stripe Invoice in TEST MODE (bank transfer first, card
// second), or an in-app simulated invoice when Stripe isn't configured. Never a live key.

const PROCESSING = 'Processing (bank transfers take a few business days)'

export function PaidBanner({ state, onClose }) {
  if (!state) return null
  const p = state.payment
  const kind = state.kind === 'paid' && p?.status === 'processing' ? 'processing' : state.kind
  return (
    <div className={`p-banner p-banner--${kind}`} role="status">
      <p>
        {kind === 'paid' ? (
          <>
            <b>Paid, {p?.hours ?? ''} hours added.</b> {p?.receipt_no ? `Receipt ${p.receipt_no}.` : ''} Test mode, no real charge.
          </>
        ) : kind === 'processing' ? (
          <>
            <b>{PROCESSING}.</b> {p?.hours ?? ''} hours are already added. Test mode, no real charge.
          </>
        ) : kind === 'unpaid' ? (
          'The invoice isn’t paid yet, so nothing was charged.'
        ) : (
          `We couldn’t check the payment: ${state.error?.message ?? ''}`
        )}
      </p>
      <button type="button" className="p-banner__x" onClick={onClose} aria-label="Dismiss">
        ×
      </button>
    </div>
  )
}

const itemOf = (p) => p.item ?? p.line_item ?? `${firstName(refName(p.student))} · ${subjectName(p.subject)} · ${p.hours} hours`

// Open the invoice: Stripe's hosted invoice page (bank first), or the in-app simulated invoice.
function openInvoice(r, setSim, gid) {
  const url = r.hosted_invoice_url ?? r.url
  if (r.simulated || !/^https?:\/\//.test(url ?? '')) {
    setSim(r)
    return
  }
  try {
    sessionStorage.setItem(PENDING, JSON.stringify({ id: r.payment_id ?? r.id, gid }))
  } catch {
    /* the billing tab refreshes on return either way */
  }
  ;(window.top ?? window).location.assign(url)
}

// "Renew 12 hours: $660": creates the invoice and opens it.
export function RenewButton({ gid, pkg, available, onPaid, primary = true }) {
  const [busy, setBusy] = useState(false)
  const [sim, setSim] = useState(null)
  const [err, setErr] = useState(null)
  const hours = renewHours(pkg)
  const price = pkg?.price_usd
  if (!available || !hours || price == null) {
    return <p className="p-cap">Ask the center to renew. Online payment isn’t set up yet.</p>
  }
  async function start() {
    setBusy(true)
    setErr(null)
    try {
      const r = await staffApi.parentCheckout(gid, { student_id: refId(pkg.student), enrollment_id: enrollmentId(pkg), hours })
      openInvoice({ student: pkg.student, subject: pkg.subject, hours, amount_usd: price, ...(r.payment ?? {}), ...r }, setSim, gid)
    } catch (e) {
      setErr(e)
    } finally {
      setBusy(false)
    }
  }
  return (
    <>
      <button type="button" className={primary ? 'p-btn p-btn--primary p-renew' : 'p-btn p-renew'} onClick={start} disabled={busy}>
        {busy ? (
          <>
            Opening invoice <Dots />
          </>
        ) : (
          `Renew ${hours} hours: ${usd(price)}`
        )}
      </button>
      {err && <p className="p-err">{err.message}</p>}
      {sim && <SimInvoice inv={sim} onClose={() => setSim(null)} onPaid={(p) => (setSim(null), onPaid?.(p))} />}
    </>
  )
}

// Simulated mode: an in-app invoice page with the same fields; bank transfer first.
function SimInvoice({ inv, onClose, onPaid, inline }) {
  const [busy, setBusy] = useState(null)
  const [err, setErr] = useState(null)
  async function pay(method) {
    setBusy(method)
    setErr(null)
    try {
      const p = await staffApi.confirmPayment(inv.payment_id ?? inv.id, method)
      if (p.status === 'paid' || p.status === 'processing') onPaid({ ...inv, ...p })
      else setErr({ message: 'The payment didn’t go through.' })
    } catch (e) {
      setErr(e)
    } finally {
      setBusy(null)
    }
  }
  return (
    <div className={inline ? 'p-modal p-modal--inline' : 'p-modal'} role={inline ? 'region' : 'dialog'} aria-modal={inline ? undefined : true} aria-label="Invoice (test mode)">
      <div className="p-modal__card">
        <p className="p-test">Test mode · simulated invoice</p>
        <p className="p-cap">Invoice {inv.invoice_number ?? inv.receipt_no ?? inv.payment_id ?? ''}</p>
        <p className="p-h">{itemOf(inv)}</p>
        <p className="p-body">
          <b>{usd(inv.amount_usd)}</b>
          {inv.due_date ? ` · due ${fmtDate(inv.due_date)}` : ''}
        </p>
        <button type="button" className="p-btn p-btn--primary p-pay" onClick={() => pay('us_bank_account')} disabled={!!busy}>
          <span>{busy === 'us_bank_account' ? 'Paying…' : 'Pay by bank'}</span>
          <span className="p-pay__note">lower fee for the center · takes a few business days</span>
        </button>
        <button type="button" className="p-btn p-pay" onClick={() => pay('card')} disabled={!!busy}>
          <span>{busy === 'card' ? 'Paying…' : 'Pay by card'}</span>
        </button>
        {err && <p className="p-err">{err.message}</p>}
        <button type="button" className="p-btn p-btn--quiet" onClick={onClose} disabled={!!busy}>
          Not now
        </button>
        <p className="p-cap">Nothing is charged. In a real center this is Stripe’s invoice page.</p>
      </div>
    </div>
  )
}

const paidWith = (p) =>
  p.method ? (METHOD_WORDS[p.method] ?? p.method) : `${PAID_WITH_WORDS[p.paid_with] ?? 'Invoice'}${p.provider === 'stripe_test' ? ' · Stripe test mode' : ' · test mode'}`

const STATUS = {
  pending: 'Open',
  sent: 'Open',
  processing: PROCESSING,
  paid: 'Paid',
  failed: 'Payment failed',
}

function InvoiceRow({ p, gid, onPaid }) {
  const [sim, setSim] = useState(null)
  const open = p.status === 'pending' || p.status === 'sent' || p.status === 'failed'
  return (
    <li className={`p-card p-invoice is-${p.status}`}>
      <p className="p-invoice__top">
        <b>{p.invoice_number ?? p.receipt_no ?? p.id}</b>
        <b>{usd(p.amount_usd)}</b>
      </p>
      <p className="p-body">{itemOf(p)}</p>
      <p className={`p-status p-status--${p.status}`}>{STATUS[p.status] ?? p.status}</p>
      <p className="p-cap">
        {p.status === 'paid'
          ? `Paid ${fmtDate(p.paid_at ?? p.created_at)} · ${paidWith(p)}`
          : p.due_date
            ? `Due ${fmtDate(p.due_date)}`
            : `Sent ${fmtDate(p.created_at)}`}
      </p>
      {open && (
        <button type="button" className="p-btn p-btn--primary" onClick={() => openInvoice({ ...p, payment_id: p.id }, setSim, gid)}>
          Pay invoice
        </button>
      )}
      {sim && <SimInvoice inv={sim} onClose={() => setSim(null)} onPaid={(x) => (setSim(null), onPaid?.(x))} />}
    </li>
  )
}

export function BillingTab({ gid, billing, onPaid }) {
  const { packages = [], payments = [], available, loading } = billing
  const invoices = [...payments].sort((a, b) => ((a.created_at ?? '') < (b.created_at ?? '') ? 1 : -1))
  return (
    <div className="p-stack">
      <div className="row row--between">
        <h2 className="p-h">Billing</h2>
        <span className="p-test">Test mode</span>
      </div>
      {loading ? (
        <p className="p-body">
          Loading <Dots />
        </p>
      ) : packages.length === 0 ? (
        <p className="p-body">No packages on file.</p>
      ) : (
        <ul className="p-list">
          {packages.map((p) => {
            const left = p.hours_left ?? 0
            const total = p.hours_total ?? null
            return (
              <li key={`${refId(p.student)}-${p.subject}`} className={`p-card p-pkg${isLow(p) ? ' p-pkg--low' : ''}`}>
                <p className="p-eyebrow">
                  {firstName(refName(p.student))} · {subjectName(p.subject)}
                </p>
                <p className="p-pkg__hours">
                  {left > 0 ? (
                    <>
                      <b>{left}</b>
                      {total ? ` of ${total}` : ''} hours left
                    </>
                  ) : (
                    <b>Package hours used up</b>
                  )}
                </p>
                {total ? (
                  <span className="p-goal__bar" aria-hidden>
                    <i style={{ width: `${Math.max(3, Math.min(100, (left / total) * 100))}%` }} />
                  </span>
                ) : null}
                <p className="p-cap">{p.renews_on ? `Renews ${fmtDate(p.renews_on)}` : 'No renewal date'}</p>
                <RenewButton gid={gid} pkg={p} available={available} onPaid={onPaid} primary={isLow(p)} />
              </li>
            )
          })}
        </ul>
      )}

      <section className="p-stack" aria-label="Invoices">
        <h3 className="p-h2">Invoices</h3>
        {invoices.length === 0 ? (
          <p className="p-cap">No invoices yet.</p>
        ) : (
          <ul className="p-list">
            {invoices.map((p) => (
              <InvoiceRow key={p.id} p={p} gid={gid} onPaid={onPaid} />
            ))}
          </ul>
        )}
      </section>
      <p className="p-cap">All payments in this demo are test mode. Bank transfer is listed first because it costs the center less.</p>
    </div>
  )
}

// /parent/invoice/:id?as=<gid>: the simulated "hosted invoice page" (what an emailed invoice link opens).
export function InvoicePage({ id, gid }) {
  const [inv, setInv] = useState(undefined)
  const [done, setDone] = useState(null)
  useEffect(() => {
    staffApi
      .parentBilling(gid)
      .then((b) => setInv((b.payments ?? []).find((p) => p.id === id) ?? null))
      .catch(() => setInv(null))
  }, [id, gid])
  const back = `/parent?as=${gid}&tab=billing`
  return (
    <div className="parent-app" data-register="parent" data-audience="parent">
      <main className="p-main p-invoice-page">
        <p className="p-top__center">Bright Path Tutoring</p>
        {inv === undefined ? (
          <p className="p-body">
            Loading <Dots />
          </p>
        ) : !inv ? (
          <div className="p-stack">
            <p className="p-h">We couldn’t find that invoice.</p>
            <a className="p-btn" href={back}>
              Back to billing
            </a>
          </div>
        ) : done ? (
          <div className="p-stack">
            <PaidBanner state={{ kind: 'paid', payment: done }} onClose={() => {}} />
            <a className="p-btn p-btn--primary" href={back}>
              Back to billing
            </a>
          </div>
        ) : inv.status === 'paid' || inv.status === 'processing' ? (
          <div className="p-stack">
            <p className="p-h">{STATUS[inv.status]}</p>
            <a className="p-btn" href={back}>
              Back to billing
            </a>
          </div>
        ) : (
          <SimInvoice inv={{ ...inv, payment_id: inv.id }} inline onClose={() => (window.location.href = back)} onPaid={setDone} />
        )}
      </main>
    </div>
  )
}
