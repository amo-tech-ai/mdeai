---
task_id: 058-sponsor-dispute-ui
title: /admin/sponsorships/:id/dispute — cancellation + refund + dispute resolution UI
phase: PHASE-2-SPONSOR-GROWTH
priority: P2
status: Open
estimated_effort: 0.5 day
area: frontend
skill:
  - frontend-design
  - supabase
  - mdeai-project-gates
edge_function: sponsor-cancel
schema_tables:
  - sponsor.contracts
  - sponsor.invoices
  - sponsor.placements
depends_on:
  - '057-sponsor-contract-sign-page'
  - '047-sponsor-admin-queue'
mermaid_diagram: null
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-2-SPONSOR-GROWTH — needed before first live sponsor to handle inevitable cancellations |
| **Routes** | `/admin/sponsorships/:id/dispute` (admin) · Cancel button in `/sponsor/dashboard/:id` (sponsor) |
| **Edge function** | `POST /functions/v1/sponsor-cancel` (handles cancel + dispute state transitions) |
| **Real-world** | Postobón cancels 5 days into their 7-day window → admin processes full refund via Stripe → contract flips to `cancelled` → placements deactivated. Mi Sazón disputes their CPL count 2 weeks in → admin freezes `roi_daily` for 48h audit → resolves with partial credit |

## Description

**The situation.** Live sponsors will cancel. Some will dispute attribution counts. Without a resolution UI, admin handles these via Slack/WhatsApp — no audit trail, no consistent policy.

**Why a dedicated dispute route (not a modal on the admin queue).** Disputes involve reviewing audit logs (`sponsor.clicks`, `sponsor.impressions`), comparing against `roi_daily` rollups, issuing partial refunds, and updating contract status. These need dedicated screen space.

**What already exists.** `/admin/sponsorships/:id` detail page (task 047). Stripe refund API is already used by `ticket_payment_refund_v2`. `sponsor.contracts` table (task 055).

## Cancellation scenarios + state transitions

| Scenario | Who | Action | Contract status | Invoice | Placements |
|---|---|---|---|---|---|
| Within cancellation_window_days | Sponsor | Self-serve cancel button | `cancelled` | Full refund via Stripe | `active=false` |
| After window | Sponsor | Contacts admin | Admin resolves | Prorated refund | `active=false` on resolution |
| CPL/CPA dispute | Sponsor | Claims miscounting | `disputed` | Frozen | Active (no change until resolved) |
| Force majeure (event cancelled) | Admin | Admin action | `cancelled` | Full refund | `active=false` |

## sponsor-cancel edge function

```typescript
// POST /functions/v1/sponsor-cancel
// Auth: Bearer JWT (sponsor for self-serve cancel); service_role for admin actions
// Body: {
//   application_id: string,
//   action: 'cancel_within_window' | 'dispute' | 'admin_resolve_cancel' | 'admin_resolve_dispute',
//   admin_note?: string,          // required for admin_resolve_*
//   partial_refund_cents?: number // for admin_resolve_cancel with prorated amount
// }

// cancel_within_window:
//   1. Verify now() - contract.sponsor_signed_at <= cancellation_window_days
//   2. UPDATE contract: status='cancelled'
//   3. UPDATE placements: active=false
//   4. Issue full Stripe refund via invoice.stripe_payment_intent
//   5. UPDATE invoice: status='refunded'

// dispute:
//   1. UPDATE contract: status='disputed'
//   2. SET sponsor.applications.dispute_freeze = true
//      (rollup cron in task 053 must check this flag — see task 053 acceptance criteria)
//   3. Notify admin (console.error + Supabase notification)
//
// ⚠️ DEPENDENCY: dispute_freeze column must exist in sponsor.applications:
//   ALTER TABLE sponsor.applications ADD COLUMN dispute_freeze boolean NOT NULL DEFAULT false;
//   Add to task 045 migration or create a follow-up migration before building task 058.

// admin_resolve_cancel:
//   1. Verify service_role
//   2. UPDATE contract: status='cancelled'
//   3. UPDATE placements: active=false
//   4. Issue partial Stripe refund of partial_refund_cents
//   5. UPDATE invoice: status='refunded'

// admin_resolve_dispute:
//   1. Verify service_role
//   2. UPDATE contract: status='active' (dispute resolved, campaign continues)
//   3. Clear dispute_freeze flag
//   4. If credit issued: create Stripe credit note
```

## Admin dispute UI (`/admin/sponsorships/:id/dispute`)

Sections:
1. **Contract summary** — tier, amount, signed date, cancellation window status
2. **Invoice** — paid date, Stripe PI link, refund history
3. **Attribution audit** — raw `sponsor.clicks` + `sponsor.attributions` vs `roi_daily` rollup for the disputed period; any discrepancy highlighted
4. **Resolution actions**
   - Cancel (full refund) / Cancel (partial refund with amount input)
   - Resolve dispute (credit amount input) / Resolve dispute (no credit)
   - Extend campaign (extend `placement.end_at` by N days as goodwill)

## Sponsor self-serve cancel (in Dashboard)

In `/sponsor/dashboard/:applicationId`, add a "Cancel sponsorship" link (visible only if `contract.status` is `signed` or `active`):
- If within `cancellation_window_days`: shows "Cancel — full refund" with 1-click confirm
- If after window: shows "Request cancellation — contact admin" which opens a support email

## Acceptance Criteria

- [ ] `sponsor-cancel` with `action='cancel_within_window'`: validates within window; issues Stripe full refund; flips contract to `cancelled`; deactivates placements.
- [ ] `sponsor-cancel` with `action='cancel_within_window'` outside window: returns 400 "CANCELLATION_WINDOW_EXPIRED".
- [ ] `sponsor-cancel` with `action='dispute'`: flips contract to `disputed`; sets `dispute_freeze=true` on application.
- [ ] Admin resolve actions require service_role; non-admin calls return 403.
- [ ] Attribution audit section shows `roi_daily` vs raw `clicks` count for the disputed date range.
- [ ] Extend campaign action updates `placement.end_at` (admin only).
- [ ] Edge fn logs to `ai_runs`.
- [ ] Dashboard shows "Cancel" link with correct label based on window status.
- [ ] `npm run lint` zero new errors; `npm run build` clean.

## Real-World Examples

**Scenario 1 — Clean cancellation:** Postobón decides within 3 days of signing that the event timing doesn't work. They click "Cancel — full refund" in the dashboard. Stripe refunds $5M COP within 5–10 business days. Contract → `cancelled`, placements → `active=false`. Dashboard shows "Cancelled" status.

**Scenario 2 — Post-window dispute:** Mi Sazón claims their attributed purchases are 200, not the 380 shown in `roi_daily`. Admin opens `/admin/sponsorships/:id/dispute`. Attribution audit shows 380 confirmed clicks → 380 within-24h orders. No discrepancy. Admin resolves with no credit, adds admin note "Attribution verified against raw clicks table." Contract stays `active`.

**Scenario 3 — Event cancelled (force majeure):** The event organizer cancels "Reina de Antioquia 2026" 2 weeks before the finals. Admin opens dispute UI, selects "Force majeure cancel — full refund". All sponsor contracts for this event flip to `cancelled`; all placements deactivated; all invoices refunded prorated to undelivered days.

## Outcomes

| Before | After |
|---|---|
| Cancellations handled via WhatsApp | Self-serve cancel with Stripe refund + audit trail |
| No dispute resolution process | Structured dispute → freeze → audit → resolve workflow |
| Admin manually writes DB updates | Edge fn handles all state transitions atomically |
| No record of admin decisions | `admin_note` + `ai_runs` log every resolution |

## See also

- [`057-sponsor-contract-sign-page.md`](057-sponsor-contract-sign-page.md) — contract signed here
- [`048-sponsor-stripe-checkout.md`](048-sponsor-stripe-checkout.md) — refund uses same Stripe PI
- [`052-sponsor-dashboard.md`](052-sponsor-dashboard.md) — self-serve cancel button lives here
- [`tasks/events/03-sponsorship-system.md`](03-sponsorship-system.md) §8 — cancellation scenarios
