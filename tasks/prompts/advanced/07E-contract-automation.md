# Epic 7: Contract & Lease Automation — index

> **Diagrams:** MERM-09 (edge functions), MERM-07 (agent architecture)  
> **Phase:** ADVANCED | **Outcome:** O4  
> **Hypothesis:** AI lease review at >=90% accuracy reduces renter risk and builds trust.

---

## Feature success (goals → shippable features)

Aligned with [`PROMPT-VERIFICATION.md`](../PROMPT-VERIFICATION.md) §6 (Goal · Workflow · Proof · Gates · Rollout), [`.claude/skills/mde-writing-plans/SKILL.md`](../../../.claude/skills/mde-writing-plans/SKILL.md) (user stories + observable proof), and optionally [`.agents/skills/tasks-generator/SKILL.md`](../../../.agents/skills/tasks-generator/SKILL.md) (PRD → tasks).

| Layer | Intent |
|-------|--------|
| **Goal** | E7 contract automation delivers reviewable path from upload to decision. |
| **Workflow** | Order: 07A → 07B → 07C → 07D references. |
| **Proof** | End-to-end demo on staging with sample lease. |
| **Gates** | Legal disclaimer: AI assists, human decides. |
| **Rollout** | Internal pilot. |

---

## Subtasks (IDs map to E7-001…E7-004)

Lettered files **skip `07E`** in the basename so the epic index stays the only `07E-*.md` file (same pattern as [`05E`](05E-agent-infrastructure.md), [`06E`](06E-hermes-intelligence.md)).

| ID | Was | File | Status |
|----|-----|------|--------|
| **07A** | E7-001 | [`07A-p2-tables-lease-market-taste.md`](07A-p2-tables-lease-market-taste.md) | Open |
| **07B** | E7-002 | [`07B-contract-analysis-edge.md`](07B-contract-analysis-edge.md) | Open |
| **07C** | E7-003 | [`07C-lease-review-card.md`](07C-lease-review-card.md) | Open |
| **07D** | E7-004 | [`07D-lease-fixtures-validation.md`](07D-lease-fixtures-validation.md) | Open |

**Suggested order:** **07A** → **07B** → **07C** (07B → 07C chain) → **07D** (can run in parallel with UI once **07B** exists, or after fixtures support testing).

---

## Verification

Run migration + edge function smoke tests per subtask; lease fixture accuracy targets **>=90%** flag detection per **07D**.
