---
id: 06F
diagram_id: MERM-09
prd_section: "5. AI agent architecture — Hermes ranking"
title: Hermes ranking eval dataset and hypothesis validation
skills:
  - mdeai-tasks
epic: E6
phase: MVP
priority: P1
status: Open
owner: Backend
dependencies:
  - E6-001
estimated_effort: M
percent_complete: 0
outcome: O10
---

# Eval dataset (E6 hypothesis validation)

Epic hypothesis: **≥70% top-1 accuracy** for composite ranking vs a curated eval set — see [`06E-hermes-intelligence.md`](06E-hermes-intelligence.md).

**Depends on:** [`06A-hermes-ranking-edge.md`](06A-hermes-ranking-edge.md) (`hermes-ranking` outputs to score).

## Tasks

1. **Create `tasks/eval/hermes-ranking-eval.json`** with 50+ labeled test cases:
   - Each case: `{ user_preferences, apartment_ids, expected_top_1: string, expected_top_3: string[], human_rationale: string }`
   - Cases should cover: budget-constrained, neighborhood-specific, amenity-heavy, mixed-priority, new-user-no-taste-profile
2. **Scoring:** Run hermes-ranking on each test case, compare `result[0].apartment_id` against `expected_top_1`. Report top-1 accuracy and top-3 recall.
3. **Baseline:** Compare against naive sort-by-price to show ranking adds value.
4. **Timing:** Build eval dataset during **06A** development; run validation before marking E6 epic complete.

## Acceptance criteria

- [ ] 50+ cases in JSON with human rationale for spot checks
- [ ] Script or CI step runs ranking against eval and prints accuracy metrics
- [ ] Document methodology in `tasks/eval/README.md` (or one paragraph in this folder)

**Blocks:** Claiming **≥70%** in slides or PRD without this dataset is **not** accepted per epic hypothesis.
