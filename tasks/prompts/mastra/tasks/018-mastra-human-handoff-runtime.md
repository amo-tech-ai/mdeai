---
task_id: MASTRA-018
title: Mastra Human Handoff Runtime
phase: MVP
priority: P0
status: Not Started
estimated_effort: 5 days
area: mastra-human-in-loop
skill: [mde-task-lifecycle, mastra, mde-supabase]
subagents: [backend, product, paperclip-integration]
edge_function: null
schema_tables: [human_handoffs, ai_control_events, workflow_runs]
depends_on: [MASTRA-003, MASTRA-005, MASTRA-012, MASTRA-013, MASTRA-015, MASTRA-011]
blocks: []
---

<!-- task-summary -->
> **What:** Define runtime for escalating AI uncertainty or policy blocks to humans across legal/lease risk, refunds, ticket/check-ins, WhatsApp outbound, sponsorship approvals.
> **Why:** mdeAI must never silently fail revenue/security sensitive flows — operators need assignment + SLA + transparent user messaging drafts.
> **Delivers:** `human_handoffs` schema (or reuse control events enriched), Mastra signalling contract, bilingual-friendly message templates stubs.
> **Tools/Skills:** `mde-task-lifecycle` · `supabase`
> **MVP · P0 · Not Started · Effort: 5 days**
> **Depends on:** MASTRA-003, MASTRA-005, MASTRA-012, MASTRA-013, MASTRA-015, MASTRA-011

# Mastra Human Handoff Runtime

## Architectural rules

```text
Mastra orchestrates escalation logic; Paperclip captures approvals/trace
OpenClaw may execute AFTER approval gates only (never autonomous escalation sends)
Hermes proposes ranked operator / macro responses but cannot assign without policy
Agents never Stripe mutate, never ticketing/check-in authoritative writes, never legal conclusions
Escalations always produce audit artifacts + sanitized user-visible copy drafts
tenant isolation mandatory (organization_id everywhere)
```

## Trigger catalog

| Signal | Behaviour |
| --- | --- |
| Low model confidence score | escalate with automatic reason buckets |
| Legal / lease ambiguity | escalate to rentals legal queue |
| Payments / refunds | finance queue + refuse AI execution |
| Ticket / QR / check-in override | events ops-only |
| WhatsApp escalation | drafts only unless approved OpenClaw job |
| Sponsor approvals | marketing governance queue |

## Data model essentials

Suggested table **`human_handoffs`** (alternative: extend `ai_control_events`):

- `organization_id`
- classification enum + severity
- `assigned_operator_id`
- SLA deadline
- `linked_workflow_run_id`
- lifecycle (`open`, `in_progress`, `resolved`, `cancelled`)
- sanitized user message template refs (EN/ES)

## User-facing messaging

Provide template doc with placeholder tokens respecting privacy (no PAN, no Stripe ids).

## Audit logging

Duplicate summary row in `workflow_failures` or dedicated channel for KPI analytics.

## Acceptance

1. Simulated escalation path renders in concierge UI awaiting state (`MASTRA-016`).
2. Paperclip issue creation hook stub documented (manual until integration shipped).
3. Proof that escalation never surfaces internal operator emails in client bundles.
