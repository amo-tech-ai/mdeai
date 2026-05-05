---
task_id: 048-sponsor-stripe-checkout
title: sponsor-checkout + sponsor-payment-webhook — Stripe flat-tier payment flow
phase: PHASE-1-SPONSOR-MVP
priority: P1
status: Open
estimated_effort: 1 day
area: backend
skill:
  - supabase-edge-functions
  - mdeai-project-gates
edge_function: sponsor-checkout
schema_tables:
  - sponsor.invoices
  - sponsor.placements
depends_on: ['045-sponsor-schema-migration', '046-sponsor-apply-wizard']
mermaid_diagram: null
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-1-SPONSOR-MVP — no money, no placement |
| **Edge functions** | `POST /functions/v1/sponsor-checkout` (creates Stripe session) · `POST /functions/v1/sponsor-payment-webhook` (Stripe → invoice paid → placements scheduled) |
| **Model** | Stripe Checkout (hosted page) — no custom card form in MVP |
| **Real-world** | Postobón completes step 4 of the wizard → `sponsor-checkout` creates a $5M COP Stripe Checkout session → Postobón pays → Stripe fires `checkout.session.completed` → `sponsor-payment-webhook` marks invoice `paid` → placements flip to `active=true` at `start_at` |

## Description

**The situation.** Applications are approved (task 047) but there is no payment mechanism. A placement with `active=false` and no `sponsor.invoices.paid_at` never goes live.

**Why Stripe Checkout (not a custom card form).** Stripe Checkout is PCI-compliant with zero frontend card handling. It handles 3DS, tax, and receipt email. The MVP doesn't need a custom checkout UI — speed-to-revenue matters more.

**Why two edge functions (not one).** The Stripe webhook fires asynchronously on a different request lifecycle than the checkout session. Merging them would require stateful polling. Two small functions are simpler and each can be rate-limited independently.

**What already exists.** Stripe is already used by `ticket-checkout` edge function. The same `STRIPE_SECRET_KEY` secret in Supabase is reusable. The `sponsor.invoices` table from task 045 holds the payment record.

## sponsor-checkout edge function

```typescript
// POST /functions/v1/sponsor-checkout
// Auth: Bearer JWT required
// Body: { application_id: string }
// Returns: { success: true, data: { checkout_url: string } }

// Logic:
// 1. Verify auth + that caller is the org's primary_contact_user_id
// 2. Load application (must be status='approved')
// 3. Load or create sponsor.invoices row (idempotent: UNIQUE on stripe_session_id)
// 4. Create Stripe Checkout session:
//    - mode: 'payment'
//    - currency: 'cop'
//    - amount: application.flat_price_cents
//    - metadata: { application_id, invoice_id }
//    - success_url: /sponsor/dashboard/<application_id>?payment=success
//    - cancel_url: /sponsor/apply?draft=<application_id>
// 5. Store stripe_session_id in invoice row
// 6. Return { checkout_url }
```

## sponsor-payment-webhook edge function

```typescript
// POST /functions/v1/sponsor-payment-webhook
// Auth: Stripe-Signature header verification (STRIPE_WEBHOOK_SECRET env var)
// Handles events: checkout.session.completed, payment_intent.payment_failed

// On checkout.session.completed:
// 1. Verify webhook signature
// 2. Load invoice by stripe_session_id
// 3. Set invoice: status='paid', paid_at=now(), stripe_payment_intent=event.payment_intent
// 4. Schedule placements: for each sponsor.placements row on application_id,
//    set active=true WHERE start_at <= now(); else leave active=false (scheduled by cron)
// 5. Log to ai_runs (agent_name='sponsor-payment-webhook', status='success')

// On payment_intent.payment_failed:
// 1. Set invoice status='failed'
// 2. Notify admin via console.error (email in Phase 2)
```

## Placement activation logic

Placements activate via two paths:

| Path | When | How |
|---|---|---|
| Immediate | `invoice.paid_at` set AND `placement.start_at <= now()` | Webhook sets `active=true` directly |
| Scheduled | `placement.start_at` is in the future | Cron `sponsor-placement-scheduler` (pg_cron, runs hourly) flips `active=true` when `now() >= start_at AND invoice paid AND contract signed` |

The cron SQL (CORRECTED — must require BOTH paid invoice AND signed contract):
```sql
UPDATE sponsor.placements p
   SET active = true
  FROM sponsor.applications a
  JOIN sponsor.invoices  i ON i.application_id = a.id
  JOIN sponsor.contracts c ON c.application_id = a.id
 WHERE p.application_id = a.id
   AND p.active = false
   AND p.start_at <= now()
   AND i.status = 'paid'
   AND c.signed_at IS NOT NULL          -- contract must be signed
   AND c.status = 'active'             -- not cancelled or disputed
   AND a.dispute_freeze IS NOT TRUE;   -- not frozen by dispute

-- ⚠️ Omitting contract gate means a paid-but-unsigned placement goes live —
-- legal and billing risk. Both gates (paid + signed) are required (see task 057).
```

## Environment variables required

```
STRIPE_SECRET_KEY                  # existing (used by ticket-checkout)
STRIPE_SPONSOR_WEBHOOK_SECRET      # sponsor webhook endpoint secret from Stripe dashboard
                                   # ⚠️ CRITICAL: code uses this exact name — NOT "STRIPE_WEBHOOK_SECRET"
                                   # Mismatch = webhook signature fails silently → payments never activate
FRONTEND_URL                       # Base URL for success/cancel redirects: https://mdeai.co
```

## Acceptance Criteria

- [ ] `sponsor-checkout` creates a Stripe session for an approved application; returns `checkout_url`.
- [ ] Calling `sponsor-checkout` twice for the same application is idempotent (returns same session if not yet paid).
- [ ] `sponsor-payment-webhook` verifies Stripe signature; rejects invalid signatures with 400.
- [ ] On `checkout.session.completed`: invoice status set to `paid`; placements with `start_at <= now()` flip to `active=true`.
- [ ] On `payment_intent.payment_failed`: invoice status set to `failed`; no placements activated.
- [ ] Calling the webhook twice with the same event ID is idempotent (UNIQUE on `stripe_session_id`).
- [ ] `STRIPE_WEBHOOK_SECRET` documented in `supabase/functions/README.md` (or equivalent) so any deployer can configure it.
- [ ] Both edge fns log to `ai_runs` (agent_name, duration_ms, status).
- [ ] `npm run verify:edge` passes.

## Real-World Examples

**Scenario 1 — Successful payment:** Postobón clicks "Proceed to payment" → Stripe Checkout → pays → webhook fires → `invoices.status='paid'` → contest hero and leaderboard footer placements go `active=true` → logo appears within 60 seconds of payment.

**Scenario 2 — Webhook replay (Stripe retries on 5xx):** If the DB write succeeds but the response is dropped, Stripe retries the webhook. UNIQUE on `stripe_session_id` means the second attempt is a no-op — the invoice stays `paid`, no duplicate rows.

**Scenario 3 — Future-dated placement:** Mi Sazón pays for their placement today but the contest doesn't start for 2 weeks. Webhook sets invoice `paid` but leaves `placement.active=false` because `start_at > now()`. The hourly pg_cron fires on contest launch day and sets `active=true`.

## Outcomes

| Before | After |
|---|---|
| No payment flow | Sponsor pays self-serve; zero engineering involvement |
| Manual invoice creation | `sponsor.invoices` row auto-created with Stripe reference |
| Placement activation requires admin DB access | Payment webhook + pg_cron activates placements automatically |

## See also

- [`045-sponsor-schema-migration.md`](045-sponsor-schema-migration.md) — `sponsor.invoices` table
- [`047-sponsor-admin-queue.md`](047-sponsor-admin-queue.md) — approval gate before checkout
- [`055-sponsor-contracts-schema.md`](055-sponsor-contracts-schema.md) — contract must also be signed before `active=true`
