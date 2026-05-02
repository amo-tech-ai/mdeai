---
id: 13B
diagram_id: MERM-03
prd_section: "6. Automations — Payments"
title: Stripe E2-005 — rollback playbook + idempotency on money paths
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

> **Why:** [`tasks/audit/06-tasks-audit.md`](../../audit/06-tasks-audit.md) — **Stripe / E2-005 + rollback doc**; **Idempotency** on **lead-capture** and **showing-create** (02E header states idempotency — this prompt **verifies** payment + documents rollback).  
> **Epic index:** [`02E-lead-to-lease-pipeline.md`](02E-lead-to-lease-pipeline.md)

## Prompt

1. **Rollback one-pager:** `tasks/operations/stripe-webhook-rollback.md` — if webhook stuck, duplicate event, or booking row inconsistent: **steps**, **who**, **Stripe dashboard** links (test mode).

2. **Webhook idempotency:** Stripe event IDs stored; replay safe.

3. **POST idempotency:** **`Idempotency-Key`** on **lead-capture**, **showing-create**, and **payment-related** edges — align with **02E** global rule; add **migration** for `idempotency_keys` if not present.

## Acceptance criteria

- [ ] Rollback doc exists and is linked from **02E** E2-005 section or **CLAUDE.md**.
- [ ] At least one **automated** test or manual script proves duplicate POST does not double-create lead/showing.

## References

- [`tasks/audit/06-tasks-audit.md`](../../audit/06-tasks-audit.md) § Data & money (Stripe, idempotency)
