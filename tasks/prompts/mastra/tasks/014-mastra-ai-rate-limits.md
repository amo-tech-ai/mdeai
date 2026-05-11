---
task_id: MASTRA-014
title: Mastra AI Rate Limits Tokens And Cost Controls
phase: CORE
priority: P0
status: Not Started
estimated_effort: 4 days
area: mastra-governance-cost
skill: [mde-task-lifecycle, mde-supabase, mastra]
subagents: [backend, security-auditor]
edge_function: null
schema_tables: [ai_usage_limits, agent_rate_limits, workflow_budget_limits]
depends_on: [MASTRA-003, MASTRA-013]
blocks: []
---

<!-- task-summary -->
> **What:** Introduce quotas for LLM/token usage, tool calls, workflows, WhatsApp egress, OpenClaw job budgets with hard-stop and soft-warning behaviour.
> **Why:** Marketplace AI workloads need predictable spend abuse protection and fair multi-tenant use.
> **Delivers:** Config tables, enforcement middleware in Mastra gateway, metering hooks tying into audit + observability.
> **Tools/Skills:** `mde-task-lifecycle` · `mastra` · `supabase`
> **CORE · P0 · Not Started · Effort: 4 days**
> **Depends on:** MASTRA-003, MASTRA-013

# Mastra AI Rate Limits Tokens And Cost Controls

## Architectural rules

```text
Hermes/OpenClaw usage counts toward quotas but agents never bypass enforcement gateways
Agents never adjust limits; operator/Paperclip policies may propose changes through governed flows only
Stripe billing state unaffected — never mutate Stripe for quota enforcement without separate finance-approved task
Redis optional; Postgres-first authoritative counters acceptable for MVP with row-level transactional increments
Hard stop rejects request; soft warn surfaces UI + logs but allows completion for current invocation policy (document thresholds)
Retry ceilings cooperate with workflow `retry_count` (MASTRA-012 / MASTRA-017)
```

## Tables

| Table | Role |
| --- | --- |
| `ai_usage_limits` | Base limit definitions keyed by dimension (`organization`, `user`, `agent`, `tool`, optional `workflow_type`) incl. sliding windows |
| `agent_rate_limits` | Specific agent invocation caps + backoff policies |
| `workflow_budget_limits` | Max tokens/tool steps per workflow class per org |

Dimensions must support **per-user**, **per-organization**, **per-agent**, **per-tool** lookups with deterministic precedence docs (Org override > tenant default).

## Behaviour

| Mode | Requirement |
| --- | --- |
| Soft warning | emit structured telemetry + Mastra SSE metadata field `budget_warning` consumable by MASTRA-016 |
| Hard stop | return typed error surfaced to concierge as human-handoff cue (ties MASTRA-018) |

## Integration

- Middleware executed **before** model calls and **before** gated tools.
- Persist rolling counters partitioned by `(organization_id, window)` minimal schema.
- Hook Paperclip escalation when thresholds repeatedly trip.

## Acceptance

1. Canary org/user cannot exceed seeded caps in integration tests (429/Mastra error contract).
2. Dashboard SQL or Grafana query defined for utilization (doc link in task notes).
3. WhatsApp/OpenClaw specific caps stubbed (`channel_whatsapp_daily_send_cap` documented even if enforced in later gateway task).

## Out of MVP

Adaptive learning of limits, cross-region metering sharding beyond Postgres row contention mitigations — document backlog only.
