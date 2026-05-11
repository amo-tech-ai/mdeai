---
task_id: MASTRA-011
title: Mastra Observability Evals And Guardrails
phase: CORE
priority: P0
status: Not Started
estimated_effort: 3 days
area: mastra-observability
skill: [mde-task-lifecycle, mastra, testing-strategy]
subagents: [backend, qa]
edge_function: null
schema_tables: [ai_tool_audit_events, ai_control_events]
depends_on: [MASTRA-002, MASTRA-003, MASTRA-005, MASTRA-015, MASTRA-019]
blocks: []
---

<!-- task-summary -->
> **What:** Add tracing, evals/scorers, and guardrail tests for Mastra before production rollout.
> **Why:** Production agents need proof: traces, costs, tool calls, failure modes, and quality scores. Otherwise "it answered" becomes false confidence.
> **Delivers:** Observability plan, Langfuse/OTel/Sentry/PostHog event map, eval fixtures, and guardrail tests.
> **Tools/Skills:** `mde-task-lifecycle` · `mastra` · `testing-strategy`
> **CORE · P0 · Not Started · Effort: 3 days**
> **Depends on:** MASTRA-002, MASTRA-003, MASTRA-005, MASTRA-015, MASTRA-019

# Mastra Observability Evals And Guardrails

## Easy Summary

**Purpose:** make Mastra behavior debuggable, measurable, and safe enough for production.

**Goals:** trace agent/tool runs, score answer quality, detect unsafe outputs, and map app/product/LLM telemetry.

**Success criteria:** every critical Mastra run has a trace, audit row, error path, and at least one eval/guardrail fixture.

**Production-ready checklist:**

- Langfuse or OTel trace path documented.
- Sentry captures runtime failures without secrets.
- PostHog tracks product events without PII leakage.
- Scorers/evals cover core chat, rentals, events, restaurants, and risky action refusal.
- Prompt-injection and unsafe-tool tests exist.

## Description

Add the observability and quality gates that make Mastra safe to operate. Use official Mastra observability/scorers docs and connect them to the existing mdeAI audit/control tables.

## Acceptance Criteria

- [ ] Create `/home/sk/mde/tasks/mastra/mastra-observability-plan.md`.
- [ ] Define trace IDs and correlation IDs across Mastra, Supabase audit rows, Paperclip approvals, and OpenClaw/Postiz jobs.
- [ ] Configure or document Langfuse/OpenTelemetry tracing for agent/tool runs.
- [ ] Define Sentry error tags and PostHog product events for Mastra chat/tool behavior.
- [ ] Add eval fixtures for rental search, event search, restaurant search, unknown intent, and risky action refusal.
- [ ] Add prompt-injection and tool-permission guardrail tests.
- [ ] Verify traces/logs redact secrets and sensitive PII.
- [ ] Add a production readiness checklist to the plan.

## Wiring Plan

| Layer | File | Action |
| --- | --- | --- |
| Docs | `tasks/mastra/mastra-observability-plan.md` | Create plan |
| Mastra | `my-mastra-app/src/observability/**` | Add trace/eval helpers |
| Tests | `my-mastra-app/**` | Add eval and guardrail fixtures |
| Supabase | `ai_tool_audit_events`, `ai_control_events` | Link trace/correlation IDs |
| App telemetry | Sentry/PostHog config | Add safe tags/events |

## Verification

Run:

```bash
npm run test -- --run
npm run build
test -f /home/sk/mde/tasks/mastra/mastra-observability-plan.md
rg -n "Langfuse|OpenTelemetry|Sentry|PostHog|scorer|eval|guardrail" my-mastra-app src tasks/mastra
```
