---
id: 02G
diagram_id: MERM-01
prd_section: "6. Automations — Lead-to-lease pipeline"
title: E2-011 — MERM-01 renter journey E2E smoke (Playwright tags)
skills:
  - mdeai-tasks
epic: E2
phase: CORE
priority: P2
status: Open
owner: QA
dependencies:
  - E1-001
  - E3-001
estimated_effort: M
percent_complete: 0
outcome: O2
---

# E2-011: MERM-01 journey smoke — Playwright checklist

> **Why:** [`tasks/audit/06-tasks-audit.md`](../../audit/06-tasks-audit.md) — **E9** E2E should cover **MERM-01** through booking (or subset); **green CI** with **broken** real journey = false confidence. Run money paths **only after** **E3** minimum on those routes.  
> **Epic index:** [`02E-lead-to-lease-pipeline.md`](02E-lead-to-lease-pipeline.md) · **[`09E-production-readiness.md`](09E-production-readiness.md)**

## Feature success (goals → shippable features)

Aligned with [`PROMPT-VERIFICATION.md`](../PROMPT-VERIFICATION.md) §6 (Goal · Workflow · Proof · Gates · Rollout), [`.claude/skills/mde-writing-plans/SKILL.md`](../../../.claude/skills/mde-writing-plans/SKILL.md) (user stories + observable proof), and optionally [`.agents/skills/tasks-generator/SKILL.md`](../../../.agents/skills/tasks-generator/SKILL.md) (PRD → tasks).

| Layer | Intent |
|-------|--------|
| **Goal** | Critical renter journey is reproducible in CI (Playwright) so regressions surface before deploy. |
| **Workflow** | Map journey from prompts → write tests → run in CI → fix flakes. |
| **Proof** | Green run on main with video/trace artifact optional; fails block merge if policy says so. |
| **Gates** | Seed data exists (01E) so E2E is not `skip` only. |
| **Rollout** | Run against preview URL or local with env parity. |

---

## Prompt

1. **Tags:** `@merm01` or `@journey-renter` on specs that trace: discover → lead → showing (stub ok) → application stub → booking/pay **only in Stripe test** when E2-005 exists.

2. **Blockers:** Requires **E1** seed + **E3** on public routes before promoting to prod smoke.

3. **Output:** Document in `tasks/operations/e2e-journeys.md` which MERM steps are covered vs deferred (WA = E8).

## Acceptance criteria

- [ ] At least **one** Playwright spec file references MERM-01 stages in describe blocks or tags.
- [ ] CI job (when added) can run journey subset without flaky external WA.
- [ ] **09E** E9-005 (if present) or journey AC cross-links this prompt.

## References

- `tasks/mermaid/01-user-journeys.mmd`
- [`tasks/audit/06-tasks-audit.md`](../../audit/06-tasks-audit.md) § E2-011, § Process tweaks (E9-005 journey AC)
