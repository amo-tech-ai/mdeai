---
id: 13B
diagram_id: MERM-03
prd_section: "6. Automations — Payments"
title: Stripe E2-005 — rollback playbook + idempotency on money paths
description: "Ships «Stripe E2-005 — rollback playbook + idempotency on money paths» for this epic—full scope in § Prompt below."
skills:
  - mdeai-tasks
epic: E2
phase: CORE
priority: P1
status: Open
owner: Backend
dependencies:
  - E2-005
estimated_effort: S
percent_complete: 0
outcome: O1
---

# Payment rollback & idempotency hardening (E2 + E3)

### Real world — purpose & outcomes

**In one sentence:** If Stripe hiccups or a user double-clicks pay, money and booking state stay **consistent**—no double charge, no “paid” without a booking.

- **Who it’s for:** Travelers paying; finance; support handling refunds.
- **Purpose:** Idempotent webhooks + rollback playbook for failed captures.
- **Goals:** Webhook dedupe; replay safety; documented rollback steps.
- **Features / deliverables:** `stripe_event_id` or equivalent; tests in test mode; ops runbook bullets.

> **Why:** [`tasks/audit/06-tasks-audit.md`](../../audit/06-tasks-audit.md) — **Stripe / E2-005 + rollback doc**; **Idempotency** on **lead-capture** and **showing-create** (02E header states idempotency — this prompt **verifies** payment + documents rollback).  
> **Epic index:** [`02E-lead-to-lease-pipeline.md`](02E-lead-to-lease-pipeline.md)

## Success criteria (tests · verify · production-ready)

| Track | Definition |
|-------|------------|
| **Tests** | Relevant automated checks pass: `npm run lint`, `npm run build`, `npm run test` (and `npm run verify:edge` when Supabase edge functions change). Add or update tests when behavior changes. |
| **Verify** | Manual smoke: confirm the user-visible or API outcome in dev/staging; for auth, CORS, payments, or idempotency, exercise the real path once. |
| **Production-ready** | No open security gaps for this change scope; deploy path documented or executed; rollback/monitoring understood if the change touches production data or money. Mark complete only when the rows above are satisfied. |

## Feature success (goals → shippable features)

Aligned with [`PROMPT-VERIFICATION.md`](../PROMPT-VERIFICATION.md) §6 (Goal · Workflow · Proof · Gates · Rollout), [`.claude/skills/mde-writing-plans/SKILL.md`](../../../.claude/skills/mde-writing-plans/SKILL.md) (user stories + observable proof), and optionally [`.agents/skills/tasks-generator/SKILL.md`](../../../.agents/skills/tasks-generator/SKILL.md) (PRD → tasks).

| Layer | Intent |
|-------|--------|
| **Goal** | Stripe rollback + webhook idempotency — no double capture or lost state. |
| **Workflow** | Idempotency keys + webhook dedupe + documented rollback. |
| **Proof** | Replay webhook is no-op; refund path tested in test mode. |
| **Gates** | Stripe secrets server-side only. |
| **Rollout** | Test mode until finance sign-off. |

---

## Prompt

1. **Rollback one-pager:** Create `tasks/operations/stripe-webhook-rollback.md` containing:
   - Booking state machine: `pending_payment → paid → refunded → cancelled`
   - Steps to handle: stuck webhook, duplicate event, booking/payment row mismatch
   - Stripe Dashboard links (test mode) for: refunding, retrying webhooks, viewing event logs
   - Who to page and escalation steps

2. **Webhook idempotency:** Add `stripe_event_id TEXT UNIQUE` column to `payments` table (migration in 02E prerequisite handles this). Before processing any webhook event, check: `SELECT 1 FROM payments WHERE stripe_event_id = $1`. Skip if exists.

3. **POST idempotency:** The `idempotency_keys` table is created in the 02E prerequisite migration. This task verifies it works:
   - Send duplicate POST to `p1-crm` with same `Idempotency-Key` header
   - Verify second call returns cached response (not a new record)
   - Test on: create_lead, schedule_tour, record_payment actions

## Acceptance criteria

- [ ] Rollback doc exists at `tasks/operations/stripe-webhook-rollback.md`
- [ ] Doc contains: state machine diagram, manual recovery steps, Stripe dashboard links, escalation contacts
- [ ] Doc linked from 02E E2-005 section
- [ ] `payments` table has `stripe_event_id UNIQUE` column (verify migration applied)
- [ ] `idempotency_keys` table exists with TTL cleanup (verify migration applied)
- [ ] **Automated Vitest test:** duplicate POST to `p1-crm` `create_lead` with same Idempotency-Key returns identical response without creating second record
- [ ] **Automated Vitest test:** duplicate Stripe webhook event (same event_id) does not create duplicate payment record

## References

- [`tasks/audit/06-tasks-audit.md`](../../audit/06-tasks-audit.md) § Data & money (Stripe, idempotency)
