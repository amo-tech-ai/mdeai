---
id: 05F
diagram_id: MERM-07
prd_section: "5. AI agent architecture — Heartbeat"
title: Implement heartbeat schedule (daily 15-min cycle)
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
estimated_effort: M
percent_complete: 0
outcome: O6
---

# E5-005: Implement Heartbeat Schedule

```yaml
---
id: E5-005
diagram_id: MERM-07
prd_section: "5. AI agent architecture — Heartbeat"
title: Implement heartbeat schedule (daily 15-min cycle)
skill: agent-config
phase: MVP
priority: P1
status: Open
owner: Backend
dependencies:
  - E5-001
estimated_effort: M
percent_complete: 0
epic: E5
outcome: O6
---
```

### Prompt

Configure the Paperclip CEO's heartbeat schedule — the recurring task cycle that drives automated operations.

**Epic index:** [`05E-agent-infrastructure.md`](05E-agent-infrastructure.md)

**Depends on:** [`05A-paperclip-ceo-instructions.md`](05A-paperclip-ceo-instructions.md)

**Read first:**
- `tasks/mermaid/07-agent-architecture.mmd` — Heartbeats section: daily + weekly schedule
- `.claude/skills/paper-clip/` — Paperclip heartbeat configuration

**The build:**
- Configure daily heartbeat (15-minute cycle) running checks:
  - Stale leads check (untouched >24h → escalation alert)
  - Showing reminders (upcoming showings in next 24h)
  - Payment status (pending payments, overdue)
  - Budget consumption (warn at 80%, stop at 100%)
- Configure weekly tasks:
  - Monday: Lead pipeline report
  - Wednesday: Listing freshness audit
  - Friday 8AM: Host payout scheduling
  - Sunday: Market snapshot request (delegated to Hermes)
- Each heartbeat task should call the appropriate Supabase edge function for data
- Log all heartbeat runs to `agent_audit_log`

### Acceptance Criteria
- [ ] Daily heartbeat runs on configured schedule
- [ ] Stale leads check queries leads table for status='new' AND created_at < now()-24h
- [ ] Showing reminders query showings table for upcoming confirmed showings
- [ ] Budget tracking compares spending against configured limits
- [ ] Weekly tasks execute on correct days
- [ ] Heartbeat results logged to agent_audit_log
- [ ] Heartbeat cycle completes within 15 minutes
- [ ] CEO delegates to sub-agents (CMO, CTO, OpsManager) as appropriate

## Feature success (goals → shippable features)

Aligned with [`PROMPT-VERIFICATION.md`](../PROMPT-VERIFICATION.md) §6 (Goal · Workflow · Proof · Gates · Rollout), [`.claude/skills/mde-writing-plans/SKILL.md`](../../../.claude/skills/mde-writing-plans/SKILL.md) (user stories + observable proof), and optionally [`.agents/skills/tasks-generator/SKILL.md`](../../../.agents/skills/tasks-generator/SKILL.md) (PRD → tasks).

| Layer | Intent |
|-------|--------|
| **Goal** | Scheduled heartbeats wake agents on a predictable cadence. |
| **Workflow** | Cron/edge → heartbeat endpoint → log success/fail. |
| **Proof** | Missed heartbeat alerts ops; no duplicate wake storms. |
| **Gates** | 05A instructions exist; Paperclip API available. |
| **Rollout** | Low-frequency schedule in prod. |

---

