"""B22: CONTRACT v3.19 / v3.19b / v3.19c parents pay the center (Stripe test mode, invoices, ACH, offline).
Run from the repo root:
    PIP_FORCE_OFFLINE=1 backend/.venv/bin/python tests/backend/test_payments.py
"""
import hashlib
import hmac
import json
import os
import sys
import time
from datetime import date, timedelta
from pathlib import Path

B = Path(os.environ.get("BACKEND_DIR", "backend")).resolve()
sys.path.insert(0, str(B))
import eval_pip as E  # noqa: E402

fails = []


def check(label, ok, detail=""):
    print(("PASS " if ok else "FAIL ") + label, detail if not ok else "")
    if not ok:
        fails.append(label)


for k in ("STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"):
    os.environ.pop(k, None)
client, server = E.load_app(B, "offline")
import center  # noqa: E402


def get(path):
    r = client.get(path)
    assert r.status_code == 200, (path, r.status_code, r.text[:200])
    return r.json()


def post(path, body=None, code=200):
    r = client.post(path, json=body or {})
    assert r.status_code == code, (path, r.status_code, r.text[:300])
    return r.json()


def maya_math():
    return next(e for e in get("/api/students/s001")["student"]["enrollments"] if e["subject"] == "math")


def overview():
    return get("/api/center/overview")


def maya_row():
    return get("/api/tutors/t1/students?q=maya")["rows"][0]


post("/api/demo/reset")
O0 = overview()
e0 = maya_math()
mrow0 = next(r for r in O0["renewals_due"] if r["enrollment_id"] == e0["id"])
check("renewal row carries Renew + Send invoice actions", mrow0["action"]["kind"] == "renew"
      and mrow0["action"]["checkout"]["body"] == {"student_id": "s001", "enrollment_id": e0["id"], "hours": 12}
      and mrow0["invoice_action"]["path"] == "/api/invoices")
kid = next(k for k in get("/api/parent/g001/home")["kids"] if k["student"]["id"] == "s001")
check("parent schedule: Renew on the low package only", next(s for s in kid["subjects"] if s["subject"] == "math")["action"]
      and next(s for s in kid["subjects"] if s["subject"] == "writing")["action"] is None)
check("tutor row billing: due before paying", maya_row()["billing"] == "due")
bl = get("/api/parent/g001/billing")
check("billing shape", {"packages", "payments"} <= set(bl) and all(
    {"student", "subject", "hours_left", "hours_total", "price_usd", "renews_on"} <= set(p) for p in bl["packages"])
      and bl["payments"] == [])

# ------------------------------------------------------------------ isolation + validation
check("403: checkout for another family's kid", client.post("/api/parent/g001/checkout",
                                                           json={"student_id": "s002", "enrollment_id": "x"}).status_code == 403)
check("404: unknown enrollment", client.post("/api/parent/g001/checkout",
                                            json={"student_id": "s001", "enrollment_id": "nope"}).status_code == 404)
check("403: parent identity cannot record offline payments", client.post(
    "/api/payments/offline?as=g001", json={"student_id": "s001", "enrollment_id": e0["id"], "method": "zelle"}).status_code == 403)

# ------------------------------------------------------------------ simulated invoice, card -> paid
co = post("/api/parent/g001/checkout", {"student_id": "s001", "enrollment_id": e0["id"], "hours": 12})
pay = co["payment"]
check("checkout returns an invoice url + ids, simulated", co["simulated"] is True and co["url"] == pay["hosted_invoice_url"]
      and co["invoice_id"].startswith("in_sim_") and co["payment_id"] == pay["id"])
check("invoice fields: line item, amount, due +7d, ACH first then card, reminders",
      pay["line_item"] == "Maya R. · Math · 12 hours" and pay["amount_usd"] == 660
      and pay["due_date"] == (date.fromisoformat(center.local_today().isoformat()) + timedelta(days=7)).isoformat()
      and pay["payment_methods"] == ["us_bank_account", "card"] and pay["reminders"] is True and pay["status"] == "pending")
check("pending invoice: no hours yet", maya_math()["package"]["hours_total"] == 12)
p1 = post(f"/api/payments/{pay['id']}/confirm", {"method": "card"})
e1 = maya_math()
check("card -> paid, +12 hours, renews_on moves forward, active", p1["status"] == "paid" and p1["paid_at"]
      and e1["package"]["hours_total"] == 24 and e1["package"]["renews_on"] > e0["package"]["renews_on"]
      and e1["package"]["status"] == "active")
O1 = overview()
check("paid renewal leaves revenue at risk by exactly that package", O1["revenue_at_risk_usd"] == O0["revenue_at_risk_usd"] - 660
      and not any(r["enrollment_id"] == e0["id"] for r in O1["renewals_due"]))
check("owner: collected_7d_usd and renewals_paid_7d", O1["collected_7d_usd"] == 660 and O1["renewals_paid_7d"] == 1)
check("tutor row billing: paid", maya_row()["billing"] == "paid")
p2 = post(f"/api/payments/{pay['id']}/confirm", {"method": "card"})
check("confirm is idempotent (no extra hours)", p2["status"] == "paid" and maya_math()["package"]["hours_total"] == 24)
check("paid is final: a later failure is ignored", post(f"/api/payments/{pay['id']}/confirm", {"outcome": "failed"})["status"] == "paid"
      and maya_math()["package"]["hours_total"] == 24)
th = get("/api/threads?student_id=s001&guardian_id=g001")["items"]
check("parent gets a receipt in the thread", any(m.get("kind") == "receipt" and pay["receipt_no"] in m["text"] for m in th))
check("billing lists the payment", get("/api/parent/g001/billing")["payments"][0]["id"] == pay["id"])

# ------------------------------------------------------------------ ACH: processing adds hours, failure reverses them
post("/api/demo/reset")
pay = post("/api/parent/g001/checkout", {"student_id": "s001", "enrollment_id": e0["id"]})["payment"]
pp = post(f"/api/payments/{pay['id']}/confirm", {"method": "us_bank_account"})
check("ACH -> processing, hours added at processing", pp["status"] == "processing" and maya_math()["package"]["hours_total"] == 24)
Op = overview()
check("processing already leaves revenue at risk", Op["revenue_at_risk_usd"] == O0["revenue_at_risk_usd"] - 660)
check("processing again is idempotent", post(f"/api/payments/{pay['id']}/confirm", {"outcome": "processing"})["status"] == "processing"
      and maya_math()["package"]["hours_total"] == 24)
pf = post(f"/api/payments/{pay['id']}/confirm", {"outcome": "failed"})
Of = overview()
frow = next((r for r in Of["renewals_due"] if r["enrollment_id"] == e0["id"]), None)
check("failure reverses the hours and the renewal date", pf["status"] == "failed" and maya_math()["package"]["hours_total"] == 12
      and maya_math()["package"]["renews_on"] == e0["package"]["renews_on"])
check("failure flags the owner's renewal row and puts the money back at risk", frow and frow["payment_failed"] is True
      and frow["payment_status"] == "failed" and Of["revenue_at_risk_usd"] == O0["revenue_at_risk_usd"])
check("failed twice reverses once", post(f"/api/payments/{pay['id']}/confirm", {"outcome": "failed"})["status"] == "failed"
      and maya_math()["package"]["hours_total"] == 12)
check("tutor row billing back to due", maya_row()["billing"] == "due")
pay2 = post("/api/parent/g001/checkout", {"student_id": "s001", "enrollment_id": e0["id"]})["payment"]
post(f"/api/payments/{pay2['id']}/confirm", {"method": "us_bank_account"})
pc = post(f"/api/payments/{pay2['id']}/confirm", {"outcome": "paid"})
check("ACH clears: processing -> paid keeps the hours once", pc["status"] == "paid" and maya_math()["package"]["hours_total"] == 24)

# ------------------------------------------------------------------ offline Zelle = card for revenue at risk
post("/api/demo/reset")
z = post("/api/payments/offline", {"student_id": "s001", "enrollment_id": e0["id"], "hours": 12, "amount_usd": 660,
                                    "method": "zelle", "note": "paid at the front desk"})
Oz = overview()
check("offline Zelle: paid, receipt, +12 hours", z["status"] == "paid" and z["provider"] == "offline" and z["method"] == "zelle"
      and z["receipt_no"].startswith("BP-") and maya_math()["package"]["hours_total"] == 24)
check("offline Zelle drops revenue at risk exactly like a card", Oz["revenue_at_risk_usd"] == O1["revenue_at_risk_usd"]
      and Oz["collected_7d_usd"] == 660 and maya_row()["billing"] == "paid")
check("offline method validated", client.post("/api/payments/offline", json={"student_id": "s001", "enrollment_id": e0["id"],
                                                                             "method": "crypto"}).status_code == 422)

# ------------------------------------------------------------------ owner Send invoice
post("/api/demo/reset")
inv = post("/api/invoices", mrow0["invoice_action"]["body"])
check("owner Send invoice: an invoice for the family, marked sent", inv["status"] == "pending" and inv["sent"] is True
      and inv["guardian_id"] == "g001" and inv["hosted_invoice_url"])
check("Send invoice is staff only", client.post("/api/invoices?as=g001", json=mrow0["invoice_action"]["body"]).status_code == 403)

# ------------------------------------------------------------------ webhooks
post("/api/demo/reset")
pay = post("/api/parent/g001/checkout", {"student_id": "s001", "enrollment_id": e0["id"]})["payment"]


def event(kind, obj):
    return json.dumps({"type": kind, "data": {"object": obj}}).encode()


raw = event("invoice.paid", {"id": pay["invoice_id"], "metadata": {"payment_id": pay["id"]}})
r = client.post("/api/stripe/webhook", content=raw, headers={"stripe-signature": "t=1,v1=bad"})
check("webhook ignored without STRIPE_WEBHOOK_SECRET", r.status_code == 200 and r.json().get("ignored")
      and get("/api/parent/g001/billing")["payments"][0]["status"] == "pending")
os.environ["STRIPE_WEBHOOK_SECRET"] = "whsec_test_123"


def signed(payload, secret="whsec_test_123", t=None):
    t = t or int(center.clock().timestamp())
    sig = hmac.new(secret.encode(), f"{t}.".encode() + payload, hashlib.sha256).hexdigest()
    return {"stripe-signature": f"t={t},v1={sig}"}


try:
    check("bad signature -> 400", client.post("/api/stripe/webhook", content=raw, headers={"stripe-signature": "t=1,v1=x"}).status_code == 400)
    check("stale signature -> 400", client.post("/api/stripe/webhook", content=raw,
                                               headers=signed(raw, t=int(time.time()) - 3600)).status_code == 400)
    proc = event("payment_intent.processing", {"id": "pi_1", "invoice": pay["invoice_id"]})
    r = client.post("/api/stripe/webhook", content=proc, headers=signed(proc)).json()
    check("payment_intent.processing -> processing (+hours)", r["status"] == "processing" and maya_math()["package"]["hours_total"] == 24)
    fin = event("invoice.finalized", {"id": pay["invoice_id"], "metadata": {"payment_id": pay["id"]}, "hosted_invoice_url": "https://x"})
    check("invoice.finalized does not move money", client.post("/api/stripe/webhook", content=fin, headers=signed(fin)).json()["status"]
          == "processing")
    r = client.post("/api/stripe/webhook", content=raw, headers=signed(raw)).json()
    check("invoice.paid -> paid", r["status"] == "paid" and maya_math()["package"]["hours_total"] == 24)
    r = client.post("/api/stripe/webhook", content=raw, headers=signed(raw)).json()
    check("replayed webhook is idempotent", r["status"] == "paid" and maya_math()["package"]["hours_total"] == 24)
    bad = event("invoice.payment_failed", {"id": pay["invoice_id"], "metadata": {"payment_id": pay["id"]}})
    check("payment_failed after paid is ignored (paid is final)",
          client.post("/api/stripe/webhook", content=bad, headers=signed(bad)).json()["status"] == "paid")
    other = event("customer.created", {"id": "cus_1"})
    check("unrelated events ignored", client.post("/api/stripe/webhook", content=other, headers=signed(other)).json().get("ignored"))
finally:
    os.environ.pop("STRIPE_WEBHOOK_SECRET", None)

# ------------------------------------------------------------------ keys: never live
os.environ["STRIPE_SECRET_KEY"] = "sk_live_should_never_be_used"
try:
    check("sk_live_ key refused -> simulated", center.stripe_key() is None and post(
        "/api/parent/g001/checkout", {"student_id": "s001", "enrollment_id": e0["id"]})["simulated"] is True)
finally:
    os.environ.pop("STRIPE_SECRET_KEY", None)

# ------------------------------------------------------------------ session document (staff only)
d = get("/api/sessions/sess_theo_ko/document")
check("session document: the raw stored session with Pip's Brain", d["collection"] == "sessions" and d["document"]["id"] == "sess_theo_ko"
      and d["document"]["brain"] and "transcript" in d["document"])
check("session document refused for the parent identity", client.get("/api/sessions/sess_theo_ko/document?as=g001").status_code == 403)
check("session document 404", client.get("/api/sessions/nope/document").status_code == 404)

# ------------------------------------------------------------------ parent reports carry Renew; reset
post("/api/demo/reset")
rep = get("/api/parent/g001/kids/s014")["reports"]
check("parent report actions are Renew-only, for due packages", all(all(a["kind"] == "renew" for a in r["actions"]) for r in rep))
post("/api/parent/g001/checkout", {"student_id": "s001", "enrollment_id": e0["id"]})
post("/api/demo/reset")
check("reset clears payments", get("/api/parent/g001/billing")["payments"] == [] and maya_math()["package"]["hours_total"] == 12)

print(f"\n{len(fails)} failing")
sys.exit(1 if fails else 0)
