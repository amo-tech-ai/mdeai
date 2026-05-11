---
task_id: MASTRA-012
title: Mastra Workflow State Runtime Supabase Backed MVP
phase: CORE
priority: P0
status: Not Started
estimated_effort: 5 days
area: mastra-workflow-state
skill: [mde-task-lifecycle, mastra, mde-supabase]
subagents: [backend, supabase-auditor]
edge_function: null
schema_tables: [workflow_runs, workflow_steps, workflow_failures, workflow_approvals]
depends_on: [MASTRA-002, MASTRA-003]
blocks: []
---

<!-- task-summary -->
> **What:** Add Supabase-backed durable-enough workflow state tables for Mastra MVP runs synchronised with Mastra `runId` / steps.
> **Why:** Mastra workflows need cross-request continuity, operator visibility, and recovery hooks without importing LangGraph/Temporal yet (per MVP scope).
> **Delivers:** Schema, RLS, status model, idempotency keys, retry counts, linkage to Mastra suspend/resume.
> **Tools/Skills:** `mde-task-lifecycle` · `mastra` · `supabase`
> **CORE · P0 · Not Started · Effort: 5 days**
> **Depends on:** MASTRA-002, MASTRA-003

# Mastra Workflow State Runtime Supabase Backed MVP

## Architectural rules

```text
Mastra = orchestration runtime
Supabase = source of truth for workflow_facts (this task)
Agents must NEVER write these tables directly; only audited gateway/tool paths or service-role edge functions MAY upsert rows
Temporal / LangGraph = explicitly out of MVP for this capability
OpenClaw = execution only · never persists workflow_truth here without gateway
```

## Easy summary

Persist enough state to correlate Mastra workflow runs (`createRun`, `resume*`, `stream` chunks summarized) with queryable Postgres rows owned by Supabase migrations + RLS.

## Tables

| Table | Purpose |
| --- | --- |
| `workflow_runs` | One row per Mastra run: `mastra_run_id`, `mastra_workflow_id`, status, timestamps, input snapshot hash, output summary, **`organization_id`**, initiating `user_id` / `profile_id`, `idempotency_key`, `retry_count`, current step pointer |
| `workflow_steps` | Per-step lineage: step id/name, status, started_at/completed_at, payload refs, retry_count |
| `workflow_failures` | Append-only failures: codes, Mastra/stack traces redacted PII |
| `workflow_approvals` | Links Paperclip/control events: FK to approval/issue, blocking step id |

## Rules

- **Idempotency:** unique constraint on `(organization_id, idempotency_key)` where key present
- **Retry count:** monotone integer; escalation to MASTRA-017 DLQ thresholds
- **organization_id:** required on every row (align MASTRA-013)
- **Actor references:** nullable `requested_by_profile_id`, `approved_by_operator_id`
- **Status transitions:** document allowed DAG (e.g. `pending`→`running`→`completed`/`failed`/`awaiting_approval`→`cancelled`)

## Integration points

| System | Behaviour |
| --- | --- |
| Mastra server | On run creation / step boundaries, authoritative tool or edge fn writes Postgres (not LLM tools) |
| Paperclip | `workflow_approvals` rows reference governance IDs |

## Acceptance

1. Migration + RLS enforcing org isolation (paired with MASTRA-013 tests).
2. Golden path: concierge workflow creates run → steps advance → completes; rows match Mastra-visible `runId`.
3. Suspend/resume path leaves `workflow_runs.status = awaiting_human` equivalent.
4. No LangGraph/Temporal packages added.

## MCP reference

Cross-check Mastra semantics with `reference/client-js/workflows` and `docs/workflows/workflow-state` (install-time version via Mastra MCP `mastraDocs` paths).
