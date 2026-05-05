---
id: 05G
diagram_id: MERM-07
prd_section: "5. AI agent architecture — Approval gates"
title: Implement approval gates (payment, listing, messaging)
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
outcome: O8
---

# E5-006: Implement Approval Gates (full G1–G7)

> **Scope warning:** Per [`tasks/audit/03-paperclip..md`](../../audit/03-paperclip..md), shipping **all seven gates at once** is high risk. Prefer **[`05L-paperclip-approval-gates-phase1.md`](05L-paperclip-approval-gates-phase1.md)** first (one gate E2E), then complete G1–G7 here. Resolve **`agent_audit_log`** ordering via **[`05K-paperclip-agent-audit-log-ordering.md`](05K-paperclip-agent-audit-log-ordering.md)** before requiring DB logging below.

```yaml
---
id: E5-006
diagram_id: MERM-07
prd_section: "5. AI agent architecture — Approval gates"
title: Implement approval gates (payment, listing, messaging)
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
outcome: O8
---
```

### Prompt

Implement the 7 approval gates defined in the agent architecture diagram.

**Epic index:** [`05E-agent-infrastructure.md`](05E-agent-infrastructure.md)

**Depends on:** [`05A-paperclip-ceo-instructions.md`](05A-paperclip-ceo-instructions.md)

**Read first:**
- `tasks/mermaid/07-agent-architecture.mmd` — ApprovalGates section: 7 gates (G1-G7)
- `.claude/skills/paper-clip/` — Paperclip approval gate patterns

**The build:**
- **G1:** Payment >$500 → Queue for human review (notify admin via notifications table)
- **G2:** Outbound host message with confidence <0.7 → Queue for review
- **G3:** Listing publication → Require admin approval (via property_verifications table)
- **G4:** Application forwarding → AI summary + spot-check flag
- **G5:** Budget at 80% → Soft warning (log + notification)
- **G6:** Budget at 100% → Hard stop (reject all new spend, escalate)
- **G7:** Lead untouched >24h → Escalation alert to CMO

Each gate should:
1. Check the condition before the action proceeds
2. If triggered, create a notification/alert and pause the action
3. Log the gate trigger to `agent_audit_log`
4. Resume only after human approval (for G1, G2, G3) or automatic (G5, G7)

### Acceptance Criteria
- [ ] All 7 gates from MERM-07 implemented
- [ ] G1: Payment >$500 blocked until human approval
- [ ] G2: Low-confidence messages queued for review
- [ ] G3: Listing publication requires admin approval
- [ ] G4: Application forwarded with AI summary + review flag
- [ ] G5-G6: Budget warnings and hard stop at thresholds
- [ ] G7: Stale lead escalation within 24 hours
- [ ] All gate triggers logged to agent_audit_log
- [ ] Human-review gates create entries in notifications table
