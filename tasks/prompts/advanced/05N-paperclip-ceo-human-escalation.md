---
id: 05N
diagram_id: MERM-07
prd_section: "5. AI agent architecture — CEO instructions"
title: E5-008 — CEO instructions: human escalation rules (↔ E8-004)
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
estimated_effort: S
percent_complete: 0
outcome: O8
---

# E5-008: CEO markdown — when to escalate to human (match 08D)

> **Why:** [`tasks/audit/06-tasks-audit.md`](../../audit/06-tasks-audit.md) — **E8-004** handover rules **not** reflected in **E5-001**; users **stuck** with bot; **G2** low-confidence path unclear end-to-end.  
> **Related:** [`08D-human-handover-escalation.md`](08D-human-handover-escalation.md), [`05A-paperclip-ceo-instructions.md`](05A-paperclip-ceo-instructions.md)

## Feature success (goals → shippable features)

Aligned with [`PROMPT-VERIFICATION.md`](../PROMPT-VERIFICATION.md) §6 (Goal · Workflow · Proof · Gates · Rollout), [`.claude/skills/mde-writing-plans/SKILL.md`](../../../.claude/skills/mde-writing-plans/SKILL.md) (user stories + observable proof), and optionally [`.agents/skills/tasks-generator/SKILL.md`](../../../.agents/skills/tasks-generator/SKILL.md) (PRD → tasks).

| Layer | Intent |
|-------|--------|
| **Goal** | CEO escalates to humans on clear signals without alert fatigue. |
| **Workflow** | Define signals → routing → ack SLA. |
| **Proof** | Escalation creates trackable issue; duplicate suppressed. |
| **Gates** | 08D aligned if WhatsApp handover exists. |
| **Rollout** | Low volume escalation first. |

---

## Prompt

Extend **CEO instructions** (E5-001 deliverable) with a **non-ambiguous** section:

- **Triggers:** confidence &lt; 0.3 (align **08D**), legal/payout keywords, repeated user frustration signals.
- **Action:** create Paperclip issue / notify human queue — **not** silent drop.
- **Cross-link:** Same thresholds as **WhatsApp** escalation doc.

## Acceptance criteria

- [ ] CEO instructions file references **08D** thresholds or duplicates them with single source comment.
- [ ] **05A** acceptance criteria mention E5-008 cross-link.
- [ ] No **E5-008** duplicate epic — this prompt **is** the tracked task for escalation copy.

## References

- [`tasks/audit/06-tasks-audit.md`](../../audit/06-tasks-audit.md) § Agent workflow gaps (E8-004 ↔ CEO), § E5-008
