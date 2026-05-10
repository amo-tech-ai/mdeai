---
task_id: MASTRA-007
title: Mastra Events MVP Runtime
phase: MVP
priority: P0
status: Not Started
estimated_effort: 4 days
area: mastra-events
skill: [mde-task-lifecycle, mastra]
subagents: [backend, frontend, supabase-auditor]
edge_function: [ticket-checkout, ticket-payment-webhook, ticket-validate, staff-link]
schema_tables: [events, event_orders, tickets, ticket_scans, ai_control_events, ai_recommendation_drafts]
depends_on: [MASTRA-003, MASTRA-004, MASTRA-005, MASTRA-011, MASTRA-018, MASTRA-012, MASTRA-013, MASTRA-014, MASTRA-015, MASTRA-019]
blocks: []
---

<!-- task-summary -->
> **What:** Add Mastra Events MVP agents only after ticketing, webhook, QR validation, and staff-link runtime state is reconciled.
> **Why:** Events are a revenue pillar, but AI must not own inventory, Stripe webhooks, refunds, or check-in mutation.
> **Delivers:** Event Concierge, Event Draft Assistant, Ticketing Support, and Check-In Support agents with deterministic backend boundaries.
> **Tools/Skills:** `mde-task-lifecycle` · `mastra`
> **MVP · P0 · Not Started · Effort: 4 days**
> **Depends on:** MASTRA-003–005, MASTRA-011, MASTRA-018, MASTRA-012–015, MASTRA-019

# Mastra Events MVP Runtime

## Easy Summary

**Purpose:** add event AI help without putting ticket revenue or check-in trust at risk.

**Goals:** recommend events, draft event copy, answer ticket support questions, and explain staff scan issues.

**Success criteria:** event chat works with real event data while ticket checkout, Stripe webhooks, QR scans, and refunds stay deterministic.

**Production-ready checklist:**

- Ticketing functions are reconciled before agent launch.
- Mastra cannot mutate inventory, webhook state, scan state, refunds, or comp tickets.
- Event drafts require host/operator confirmation.
- Staff support explains status and escalates exceptions.
- Stripe/QR regression tests are green.

## Description

Implement the first Mastra event agents after reconciling the active event ticketing stack. The agents should recommend events, create event drafts, answer ticketing support questions, and support staff with safe explanations.

Mastra must never mutate ticket inventory, finalize Stripe payment state, override QR scan state, or issue refunds.

## Rationale

Events can generate revenue and engagement, but ticketing/check-in correctness must remain deterministic. AI can assist, explain, draft, and escalate.

## User Stories

| Persona | Goal | Outcome |
| --- | --- | --- |
| Visitor | find events by vibe/date/location | I can buy tickets faster |
| Host | draft an event listing | I can publish with less effort |
| Staff | understand scan errors | I can resolve issues without unsafe overrides |

## Acceptance Criteria

- [ ] Verify active ticket checkout, payment webhook, QR validation, and staff-link functions exist locally or as documented remote deployments.
- [ ] Add Event Concierge Agent using read-only event search.
- [ ] Add Event Draft Assistant that creates draft content only.
- [ ] Add Ticketing Support Agent that reads safe order/ticket state but does not mutate payment state.
- [ ] Add Check-In Support Agent that explains scan status and routes exceptions to human approval.
- [ ] Add tests proving Mastra cannot call refund, comp-ticket, inventory, or QR override actions.
- [ ] Add smoke proof for an event recommendation query returning real event cards.
- [ ] Add reconciliation report if ticketing functions are missing or drifted.

## Wiring Plan

| Layer | File | Action |
| --- | --- | --- |
| Mastra agents | `my-mastra-app/src/agents/events/**` | Create events agent pack |
| Mastra tools | `my-mastra-app/src/tools/events.ts` | Create read-only and draft-only event tools |
| Edge functions | `supabase/functions/ticket-*`, `staff-link` | Verify deterministic ownership |
| UI | Event chat/card components | Render event cards and support states |
| Tests | Event function and Mastra tests | Add no-mutation and support tests |
| Docs | `tasks/mastra/events-mastra-runbook.md` | Document AI boundaries |

## Edge Cases

| Scenario | Expected Behavior |
| --- | --- |
| User asks for refund | Create approval/support request, do not refund |
| Staff asks to override used QR | Explain `ALREADY_USED` and escalate |
| Ticket webhook missing | Block Events MVP runtime until reconciled |
| Event sold out | Explain sold-out state and suggest alternatives |
| Host draft has policy-sensitive claims | Store draft for review |

## Real-World Examples

**Scenario 1 - visitor:** "What is good in Provenza this Saturday?" returns real event cards and ticket links.

**Scenario 2 - staff:** "This QR says already used" returns safe explanation and escalation path without changing ticket state.

## Outcomes

| Before | After |
| --- | --- |
| Event AI could touch risky surfaces | AI is read-only or draft-only |
| Ticketing readiness unclear | Runtime state is reconciled first |
| Staff support lacks AI guardrails | Scan support is bounded |

## Verification

Run:

```bash
npm run test -- --run
npm run build
rg -n "Event Concierge Agent|Ticketing Support Agent|Check-In Support Agent|ticket-payment-webhook|ticket-validate" my-mastra-app src supabase tasks/mastra
```
