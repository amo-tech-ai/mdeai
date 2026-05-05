---
id: 08G
diagram_id: MERM-04
prd_section: "8. Multi-channel — Observability"
title: Correlation IDs — Infobip ↔ OpenClaw ↔ Supabase `ai_runs`
skills:
  - openclaw
  - supabase/supabase-edge-functions
  - mdeai-tasks
epic: E8
phase: ADVANCED
priority: P1
status: Open
owner: Backend
dependencies:
  - E8-001
estimated_effort: M
percent_complete: 0
outcome: O5
---

# E8-006: Unified observability — correlation across WA, Gateway, and edges

> **Why:** [`tasks/audit/04-openclaw.md`](../../audit/04-openclaw.md) — `ai_runs` (Supabase) vs OpenClaw Gateway logs vs **`agent_audit_log`** (09E) are **not** unified; need **`correlation_id`** (or trace id) end-to-end.  
> **Epic index:** [`08E-multi-channel.md`](08E-multi-channel.md)

## Feature success (goals → shippable features)

Aligned with [`PROMPT-VERIFICATION.md`](../PROMPT-VERIFICATION.md) §6 (Goal · Workflow · Proof · Gates · Rollout), [`.claude/skills/mde-writing-plans/SKILL.md`](../../../.claude/skills/mde-writing-plans/SKILL.md) (user stories + observable proof), and optionally [`.agents/skills/tasks-generator/SKILL.md`](../../../.agents/skills/tasks-generator/SKILL.md) (PRD → tasks).

| Layer | Intent |
|-------|--------|
| **Goal** | Correlation IDs across WA → edge → logs for incidents. |
| **Workflow** | Propagate header/id → structured logs → dashboard filter. |
| **Proof** | End-to-end trace for one test message. |
| **Gates** | PII minimization in logs. |
| **Rollout** | Enable in staging first. |

---

## Prompt

1. **ID generation** — On first inbound Infobip (or OpenClaw) event, generate **`correlation_id`** (UUID); pass through every hop: edge handler → OpenClaw (header or metadata) → `ai-chat` / `ai-router` → **`ai_runs.metadata`**.

2. **Logging** — Gateway and edge logs include same id; optional link to **`agent_audit_log`** when [`09E`](09E-production-readiness.md) exists ([`05K-paperclip-agent-audit-log-ordering.md`](05K-paperclip-agent-audit-log-ordering.md) path).

3. **Dashboards** — Document query: “all logs for WA user X in session Y” — even if v1 is SQL + `jq`.

## Acceptance criteria

- [ ] One **example trace** documented (redacted): inbound → outbound with same `correlation_id` in `ai_runs` and Gateway log line.
- [ ] Edge functions touched by E8 accept/propagate header **`x-correlation-id`** (or agreed name).
- [ ] **08B** acceptance criteria updated to require correlation on OpenClaw → edge calls.

## References

- [`tasks/audit/04-openclaw.md`](../../audit/04-openclaw.md) § Improvements (3), § Advanced Features (Observability)
