---
id: 05I
diagram_id: MERM-07
prd_section: "5. AI agent architecture — Paperclip API hygiene"
title: Paperclip API lifecycle — run ID, checkout, 409, heartbeat-context
skills:
  - paperclip
  - mdeai-tasks
epic: E5
phase: MVP
priority: P1
status: Open
owner: Backend
dependencies:
  - E5-001
  - E5-002
estimated_effort: S
percent_complete: 0
outcome: O8
---

# E5-008: Paperclip API lifecycle & audit hygiene

> **Why:** [`tasks/audit/03-paperclip..md`](../../audit/03-paperclip..md) — mutations without **`X-Paperclip-Run-Id`** break audit trail; 409 retry loops violate skill rules.  
> **Epic index:** [`05E-agent-infrastructure.md`](05E-agent-infrastructure.md)

## Feature success (goals → shippable features)

Aligned with [`PROMPT-VERIFICATION.md`](../PROMPT-VERIFICATION.md) §6 (Goal · Workflow · Proof · Gates · Rollout), [`.claude/skills/mde-writing-plans/SKILL.md`](../../../.claude/skills/mde-writing-plans/SKILL.md) (user stories + observable proof), and optionally [`.agents/skills/tasks-generator/SKILL.md`](../../../.agents/skills/tasks-generator/SKILL.md) (PRD → tasks).

| Layer | Intent |
|-------|--------|
| **Goal** | Paperclip API lifecycle (versioning, deprecations) is documented and testable. |
| **Workflow** | Publish contract → consumer updates → sunset old paths. |
| **Proof** | 409/410 behavior documented; clients handle. |
| **Gates** | API tokens rotated via env. |
| **Rollout** | Versioned rollout. |

---

## Prompt

Enforce **Paperclip control-plane discipline** for all agents/adapters that call the Paperclip HTTP API:

1. **`X-Paperclip-Run-Id`** — Every **mutating** request (POST/PATCH/PUT/DELETE that changes issues, comments, approvals, checkouts) sends this header from the active run context. Document the header name in `tasks/paperclip/links.md` or `AGENTS.md`.
2. **Checkout before work** — Agents **checkout** an issue before editing; no “drive-by” comment spam on issues they don’t own for the turn.
3. **No 409 retry** — On **409 Conflict**, agents **do not** blindly retry; they **read** current state, reconcile, or **comment** with conflict note (per `.claude/skills/paperclip` / official skill).
4. **`GET .../heartbeat-context` (optional)** — Before heavy comment/thread replay, prefer **heartbeat-context** when available to reduce token load (per skill).

**Metrics (lightweight):** Add a **manual or scripted** weekly check: 409 rate, failed heartbeats, time-in-`in_progress` — even a spreadsheet row is enough until dashboards exist.

## Acceptance criteria

- [ ] `AGENTS.md` or `tasks/paperclip/links.md` documents **run ID** + **checkout** + **409** rules for mde agents.
- [ ] Adapter template(s) (`hermes_local`, `openclaw_gateway` prep) include **Run-Id** on mutations.
- [ ] No documented flow that says “retry forever on 409.”
- [ ] Reference to heartbeat-context where the API supports it.

## Verification

Manual: one agent session completes checkout → comment → complete without 409 loop; Paperclip UI shows coherent run attribution.

## References

- [`tasks/audit/03-paperclip..md`](../../audit/03-paperclip..md) § Improvements (3), § Key Problems (API hygiene)
- [`05K-paperclip-agent-audit-log-ordering.md`](05K-paperclip-agent-audit-log-ordering.md) — where audit rows land before `agent_audit_log` exists
