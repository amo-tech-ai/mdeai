---
task_id: MASTRA-017
title: Mastra Workflow Recovery And Dead Letter Handling
phase: OPS
priority: P1
status: Not Started
estimated_effort: 5 days
area: mastra-reliability
skill: [mde-task-lifecycle, mastra, mde-supabase]
subagents: [backend, qa]
edge_function: null
schema_tables: [workflow_failures, workflow_runs, workflow_dead_letters]
depends_on: [MASTRA-012, MASTRA-003, MASTRA-014]
blocks: []
---

<!-- task-summary -->
> **What:** Define durable-ish recovery behaviours for stalled/failed Mastra-linked workflows using Supabase + operator tooling hooks.
> **Why:** Hospitality marketplace flows will pause for human approvals across minutes–days; deterministic recovery prevents duplicate side effects.
> **Delivers:** Retry strategy, DLQ semantics, replay rules operator dashboard backlog spec.
> **Tools/Skills:** `mde-task-lifecycle` · `mastra` · `supabase`
> **OPS · P1 · Not Started · Effort: 5 days**
> **Depends on:** MASTRA-012, MASTRA-003, MASTRA-014

# Mastra Workflow Recovery And Dead Letter Handling

## Architectural rules

```text
Replay MUST honour idempotency keys (MASTRA-012); never blindly re-run Stripe/OpenClaw without duplicate protection
Hermes advises replays ranking; Mastra executes only after approvals
Agents never mutate DLQ rows; operator UI via Supabase dashboards or internal admin guarded routes only
Temporal/LangGraph still explicitly NOT required for MVP
OpenClaw side effects gated — recovery never auto-invokes claw
```

## Must include domains

| Area | Requirement |
| --- | --- |
| Retry strategy | Exponential backoff with ceiling tie-in to MASTRA-014 + MASTRA-012.retry_count increments |
| Dead-letter state | `workflow_dead_letters` or status flag on failure with immutable reason codes |
| Manual resume | Map to Mastra SDK `resume` / `resumeAsync` guarded via operator auth |
| Manual cancel | Propagate to Mastra `.cancel()` and mark Supabase statuses |
| Stuck detection | Heartbeat SLA + cron probing `running` rows older than TTL |
| Failure audit logs | Append-only correlate with Mastra traces + observability IDs |
| Operator dashboard reqs | Queries + UX flows (minimal spec: React admin table backlog) listed |
| Safe replay rules | Preconditions checklist before operator triggers resume |
| Duplicate side-effect protection | Hash-based already-run detection for external integrations |

## Integration with Mastra

Use canonical client resume semantics documented in MCP `reference/client-js/workflows`:

- Preserve `runId` across resumes
- Honour `suspend` payloads stored in Postgres rows

## Acceptance

1. Table(s) migrated + seeded failure scenarios in staging harness.
2. Playbook Markdown for on-call linking to SQL triage snippets.
3. Automated test showing double-resume prevented when idempotency key unchanged.
