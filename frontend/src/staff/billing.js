// CONTRACT v3.19 parent billing helpers (Stripe test mode / simulated checkout; never a live key).
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLoad } from '../hooks'
import { staffApi } from './api'
import { refId } from './format'

export const PENDING = 'pip.pay.pending'

export const renewHours = (p) => p?.action?.hours ?? p?.renew_hours ?? p?.package_hours ?? p?.hours ?? p?.hours_total ?? null
export const enrollmentId = (p) => p?.enrollment_id ?? `en_${refId(p?.student)}_${p?.subject}`

// Billing for this family: the v3.19 endpoint, or (before B22) package hours from the home payload.
export function useBilling(gid, home) {
  const b = useLoad(() => staffApi.parentBilling(gid), [gid])
  useEffect(() => {
    const f = () => document.visibilityState === 'visible' && b.reload()
    document.addEventListener('visibilitychange', f)
    return () => document.removeEventListener('visibilitychange', f)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gid])
  if (b.data) return { ...b.data, available: true, reload: b.reload, setData: b.setData, loading: false }
  const packages = (home?.kids ?? []).flatMap((k) =>
    (k.subjects ?? [])
      .filter((s) => s.package)
      .map((s) => ({ student: k.student, subject: s.subject, ...s.package })),
  )
  return { packages, payments: [], available: false, loading: b.loading && !b.data, reload: b.reload, setData: b.setData }
}

export const isLow = (p) => p && (p.status === 'low' || p.status === 'expired' || (p.hours_left ?? 99) <= 2)

// Back from Stripe (or a reload mid-checkout): confirm the pending payment once and report the result.
export function usePaymentReturn(onPaid) {
  const [sp, setSp] = useSearchParams()
  const [state, setState] = useState(null) // {kind: 'paid'|'unpaid'|'error', payment}
  useEffect(() => {
    let pending = null
    try {
      pending = JSON.parse(sessionStorage.getItem(PENDING) ?? 'null')
    } catch {
      pending = null
    }
    const id = sp.get('payment') ?? sp.get('payment_id') ?? pending?.id
    if (!id) return
    try {
      sessionStorage.removeItem(PENDING)
    } catch {
      /* ignore */
    }
    staffApi
      .confirmPayment(id)
      .then((p) => {
        const ok = p.status === 'paid' || p.status === 'processing'
        setState({ kind: ok ? 'paid' : 'unpaid', payment: p })
        if (ok) onPaid?.(p)
      })
      .catch((e) => setState({ kind: 'error', error: e }))
    if (sp.get('payment') || sp.get('payment_id') || sp.get('session_id')) {
      const next = new URLSearchParams(sp)
      ;['payment', 'payment_id', 'session_id', 'paid', 'canceled'].forEach((k) => next.delete(k))
      setSp(next, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return [state, setState]
}

