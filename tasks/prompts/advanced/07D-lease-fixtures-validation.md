---
id: 07D
diagram_id: MERM-07
prd_section: "5. AI agent architecture — Lease analysis validation"
title: Create fixture set of 50+ leases for AI validation
skills:
  - testing
  - mdeai-tasks
epic: E7
phase: ADVANCED
priority: P2
status: Open
owner: Backend
dependencies: []
estimated_effort: M
percent_complete: 0
outcome: O4
---

# E7-004: Create Lease Fixture Set for Validation

```yaml
---
id: E7-004
diagram_id: MERM-07
prd_section: "5. AI agent architecture — Lease analysis validation"
title: Create fixture set of 50+ leases for AI validation
skill: testing
phase: ADVANCED
priority: P2
status: Open
owner: Backend
dependencies: []
estimated_effort: M
percent_complete: 0
epic: E7
outcome: O4
---
```

### Prompt

Create a set of test lease documents to validate the contract-analysis edge function's accuracy.

**Epic index:** [`07E-contract-automation.md`](07E-contract-automation.md)

**Read first:**
- `tasks/mermaid/07-agent-architecture.mmd` — Hermes: Lease Analysis validation
- Colombian rental law (Ley 820/2003) basics
- `supabase/functions/contract-analysis/` — the analysis function to test against

**The build:**
- Create `tests/fixtures/leases/` directory
- 50+ lease document fixtures (markdown or text format for easy creation):
  - 15 "clean" leases — standard Colombian terms, no red flags, risk <30
  - 15 "moderate risk" leases — 1-2 yellow flags (excessive deposit, vague termination), risk 30-70
  - 10 "high risk" leases — 3+ red flags (no termination clause, landlord entry without notice, hidden fees), risk >70
  - 5 "non-standard" leases — English-only, mixed language, unusual formats
  - 5 edge cases — empty document, corrupt format, extremely short/long
- Each fixture has an expected analysis in `tests/fixtures/leases/expected/`
- Create a validation script that runs all fixtures through contract-analysis and compares to expected

**Goal:** Achieve >=90% accuracy on risk flag detection (true positive rate).

### Acceptance Criteria
- [ ] 50+ lease fixtures in `tests/fixtures/leases/`
- [ ] Expected analysis files with risk scores and flags
- [ ] Validation script compares actual vs. expected
- [ ] Clean leases correctly scored <30
- [ ] High-risk leases correctly scored >70
- [ ] Red flags detected with >=90% accuracy
- [ ] Edge cases handled gracefully (no crashes)
- [ ] Results report shows accuracy metrics

## Feature success (goals → shippable features)

Aligned with [`PROMPT-VERIFICATION.md`](../PROMPT-VERIFICATION.md) §6 (Goal · Workflow · Proof · Gates · Rollout), [`.claude/skills/mde-writing-plans/SKILL.md`](../../../.claude/skills/mde-writing-plans/SKILL.md) (user stories + observable proof), and optionally [`.agents/skills/tasks-generator/SKILL.md`](../../../.agents/skills/tasks-generator/SKILL.md) (PRD → tasks).

| Layer | Intent |
|-------|--------|
| **Goal** | Validation set covers edge cases for lease analysis accuracy. |
| **Workflow** | Fixtures in repo → automated comparison → threshold. |
| **Proof** | CI fails if accuracy drops below threshold. |
| **Gates** | 07B prompt frozen per fixture version. |
| **Rollout** | CI only. |

---

