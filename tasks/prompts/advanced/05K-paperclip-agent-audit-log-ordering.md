---
id: 05K
diagram_id: MERM-07
prd_section: "5. AI agent architecture — Audit logging"
title: agent_audit_log ordering — stub vs 09E vs Paperclip activity
skills:
  - paperclip
  - supabase/supabase-edge-functions
  - mdeai-tasks
epic: E5
phase: MVP
priority: P1
status: Open
owner: Backend
dependencies: []
estimated_effort: S
percent_complete: 0
outcome: O8
---

# E5-010: Resolve `agent_audit_log` dependency (E5 vs 09E)

> **Why:** [`tasks/audit/03-paperclip..md`](../../audit/03-paperclip..md) — **05D/05F** assume **`agent_audit_log`** from **09E**; undefined ordering → silent drops or blocked adapters.  
> **Epic index:** [`05E-agent-infrastructure.md`](05E-agent-infrastructure.md)

## Feature success (goals → shippable features)

Aligned with [`PROMPT-VERIFICATION.md`](../PROMPT-VERIFICATION.md) §6 (Goal · Workflow · Proof · Gates · Rollout), [`.claude/skills/mde-writing-plans/SKILL.md`](../../../.claude/skills/mde-writing-plans/SKILL.md) (user stories + observable proof), and optionally [`.agents/skills/tasks-generator/SKILL.md`](../../../.agents/skills/tasks-generator/SKILL.md) (PRD → tasks).

| Layer | Intent |
|-------|--------|
| **Goal** | Audit log ordering and storage are decided so E5 can implement logging once. |
| **Workflow** | Pick option A/B/C → update 05D/05F/05G ACs → spike implementation. |
| **Proof** | Decision doc + sample rows or stdout contract. |
| **Gates** | Blocks multiple E5 tasks until resolved. |
| **Rollout** | Decision in repo before coding dependents. |

---

## Prompt

Pick **one** path and document it in **`05G`** and adapter prompts:

| Path | When to use |
|------|-------------|
| **A — 09E first** | Implement minimal `agent_audit_log` table + RLS + insert from edges per [`09E-production-readiness.md`](09E-production-readiness.md) before gate-heavy work. |
| **B — Stub** | Create empty or stdout-only logging until 09E; **do not** block **05I** run-id discipline — Paperclip **activity API** holds narrative meanwhile. |
| **C — Adapter-only** | Hermes/OpenClaw adapters log structured lines to **stderr** + **Paperclip activity**; DB table added when 09E lands. |

**05G** today requires “log to `agent_audit_log`” — update acceptance criteria to match the chosen path (e.g. “log to stub table OR activity feed until 09E”).

## Acceptance criteria

- [ ] Decision **A/B/C** recorded in `tasks/notes/` or `AGENTS.md` (one paragraph).
- [ ] [`05G-approval-gates.md`](05G-approval-gates.md) AC updated so gates are not blocked on a **non-existent** table.
- [ ] [`05D-hermes-local-adapter.md`](05D-hermes-local-adapter.md) / [`05F-paperclip-heartbeat-schedule.md`](05F-paperclip-heartbeat-schedule.md) cross-link this prompt.

## References

- [`tasks/audit/03-paperclip..md`](../../audit/03-paperclip..md) § Key Problems (`agent_audit_log`), § Improvements (4)
- [`09E-production-readiness.md`](09E-production-readiness.md)
