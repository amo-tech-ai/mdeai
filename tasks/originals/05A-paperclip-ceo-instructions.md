---
id: 05A
diagram_id: MERM-07
prd_section: "5. AI agent architecture — Paperclip"
title: Fix Paperclip CEO instructions (replace placeholder .md)
skills:
  - paperclip
  - mdeai-tasks
epic: E5
phase: MVP
priority: P0
status: Open
owner: Backend
dependencies: []
estimated_effort: S
percent_complete: 0
outcome: O7
---

# E5-001: Fix Paperclip CEO Instructions

```yaml
---
id: E5-001
diagram_id: MERM-07
prd_section: "5. AI agent architecture — Paperclip"
title: Fix Paperclip CEO instructions (replace placeholder .md)
skill: agent-config
phase: MVP
priority: P0
status: Open
owner: Backend
dependencies: []
estimated_effort: S
percent_complete: 0
epic: E5
outcome: O7
---
```

### Prompt

Replace the placeholder CEO instructions with a production-grade markdown file that defines the CEO agent's scope, budget enforcement, and delegation rules.

**Epic index:** [`05E-agent-infrastructure.md`](05E-agent-infrastructure.md)

**Read first:**
- `tasks/mermaid/07-agent-architecture.mmd` — CEO role: budget enforcement, approval gates, heartbeat
- Current Paperclip CEO instructions file (wherever Paperclip stores its company config)
- `.claude/skills/paper-clip/` — Paperclip skill reference

**The build:**
- Locate or create the CEO instructions `.md` file for the `mde` Paperclip company
- Define CEO scope: budget enforcement, approval gates, delegation to CMO/CTO/OpsManager
- Budget rules: soft warning at 80%, hard stop at 100%
- Delegation rules: reasoning tasks → Hermes (via hermes_local), messaging → OpenClaw (via openclaw_gateway)
- Approval gates: payment >$500, listing publication, outbound host messages with confidence <0.7
- Heartbeat schedule: daily 15-min cycle

**Example:**
The CEO agent runs its daily heartbeat at 8AM. It checks: 3 stale leads (untouched >24h) → delegates to CMO for follow-up. 1 payment pending >$500 → queues for human review. Budget consumption at 62% → no action. Listing freshness check → 2 apartments have stale photos → delegates to OpsManager.

### Acceptance Criteria
- [ ] CEO instructions markdown file exists with complete scope definition
- [ ] Budget enforcement rules: soft warning at 80%, hard stop at 100%
- [ ] Delegation rules specify which adapter handles which task type
- [ ] All 7 approval gates from MERM-07 are documented
- [ ] Heartbeat schedule matches diagram (daily 15-min cycle)
- [ ] Instructions reference the correct agent names (CMO, CTO, OpsManager)

**Next:** [`05B-paperclip-workspace-bind.md`](05B-paperclip-workspace-bind.md), [`05F-paperclip-heartbeat-schedule.md`](05F-paperclip-heartbeat-schedule.md), [`05G-approval-gates.md`](05G-approval-gates.md).
