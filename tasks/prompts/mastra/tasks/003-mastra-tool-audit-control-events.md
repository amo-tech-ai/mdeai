---
task_id: MASTRA-003
title: Mastra Tool Audit And Control Events
phase: CORE
priority: P0
status: Not Started
estimated_effort: 3 days
area: mastra-safety
skill: [mde-task-lifecycle, supabase]
subagents: [backend, supabase-auditor]
edge_function: mastra-tool-gateway
schema_tables: [ai_tool_audit_events, ai_control_events, ai_recommendation_drafts]
depends_on: [MASTRA-001, MASTRA-002]
blocks: [MASTRA-005, MASTRA-006, MASTRA-007, MASTRA-008]
---

<!-- task-summary -->
> **What:** Add the audit and safe-action layer used by Mastra tools before any vertical agents can write or trigger outbound work.
> **Why:** Agents must not write arbitrary Supabase rows, send messages, publish campaigns, or mutate ticketing state without audit and approval boundaries.
> **Delivers:** Tables and a constrained backend/edge API for tool audit, control events, drafts, and approval requests.
> **Tools/Skills:** `mde-task-lifecycle` · `supabase`
> **CORE · P0 · Not Started · Effort: 3 days**
> **Depends on:** MASTRA-001, MASTRA-002

# Mastra Tool Audit And Control Events

## Easy Summary

**Purpose:** make every Mastra tool call traceable and stop risky actions from executing directly.

**Goals:** create audit/control tables, idempotency, draft storage, and approval-required action handling.

**Success criteria:** agents can create drafts and audit rows, but cannot send messages, mutate tickets, publish posts, or touch payments without approval.

**Production-ready checklist:**

- Every tool call writes an audit event.
- Risky actions require approval or create drafts only.
- Idempotency keys prevent duplicate side effects.
- RLS blocks public access to audit/control tables.
- Unknown action types and arbitrary SQL/table names are rejected.

## Description

Implement a cross-domain audit/control layer for Mastra. This layer records every tool call and stores risky outputs as drafts or approval requests instead of letting agents perform irreversible actions.

This generalizes the real-estate `008-ai-control-events-safe-actions.md` pattern across rentals, events, restaurants, marketing, WhatsApp, OpenClaw, Paperclip, and Postiz.

## Rationale

Mastra is allowed to reason and call typed tools. It is not allowed to bypass Supabase RLS, own payments, mutate ticket inventory, publish social posts, or send outbound messages without approval/idempotency.

## User Stories

| Persona | Goal | Outcome |
| --- | --- | --- |
| Operator | inspect every AI tool call | I can debug and audit outcomes |
| Developer | route risky actions through one API | I do not duplicate safety checks |
| Approver | see drafts before execution | I can approve or reject safely |

## Acceptance Criteria

- [ ] Add `ai_tool_audit_events` or reconcile with an existing equivalent table.
- [ ] Add or reuse `ai_control_events` with entity type/id, source, action type, status, risk level, idempotency key, actor, and metadata.
- [ ] Add or reuse `ai_recommendation_drafts` for agent-created user-facing or outbound drafts.
- [ ] Add RLS so users cannot read or write private audit/control rows outside their scope.
- [ ] Add a constrained `mastra-tool-gateway` API or equivalent server function for allowed actions only.
- [ ] Reject unknown action types, raw SQL, arbitrary table names, oversized metadata, missing idempotency keys, and invalid entity IDs.
- [ ] Add helper wrappers in the Mastra runtime so every tool writes an audit row.
- [ ] Add tests for valid audit write, duplicate idempotency key, invalid entity, rejected unknown action, and approval-required action.
- [ ] Document which actions are low, medium, and high risk.

## Wiring Plan

| Layer | File | Action |
| --- | --- | --- |
| Migration | `supabase/migrations/*_mastra_tool_audit.sql` | Create or reconcile audit/control tables |
| Edge/backend | `supabase/functions/mastra-tool-gateway/index.ts` or server route | Add constrained action API |
| Mastra | `my-mastra-app/src/tools/audit.ts` | Add audit wrapper |
| Types | `src/integrations/supabase/database.types.ts` | Regenerate after migration |
| Tests | `my-mastra-app/**` and/or function tests | Add validation/idempotency tests |
| Docs | `tasks/mastra/mastra-safety-runbook.md` | Document risk levels and approval flow |

## Edge Cases

| Scenario | Expected Behavior |
| --- | --- |
| Agent retries the same action | API returns existing event by idempotency key |
| Agent asks to send WhatsApp | Store outbound draft or approval request only |
| Agent asks to refund or change ticket state | Reject or require explicit Paperclip approval |
| Entity ID is hallucinated | Reject and write failed audit event |
| Metadata contains PII-heavy transcript | Redact or reject according to limits |

## Real-World Examples

**Scenario 1 - rental follow-up:** Mastra creates a WhatsApp follow-up draft and logs the lead ID, channel, risk level, and idempotency key. It does not send the message.

**Scenario 2 - event refund:** Mastra cannot refund a ticket. It creates an approval request linked to the order and stops.

## Outcomes

| Before | After |
| --- | --- |
| Agents could be wired directly to side effects | Side effects are draft-first and approval-gated |
| Tool calls are hard to trace | Every call has audit evidence |
| Duplicate sends are likely during retries | Idempotency prevents duplicate execution |

## Verification

Run:

```bash
npm run test -- --run
npm run build
rg -n "ai_tool_audit_events|ai_control_events|mastra-tool-gateway" supabase apps src
```
