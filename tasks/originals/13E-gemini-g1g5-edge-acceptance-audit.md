---
id: 13E
diagram_id: MERM-09
prd_section: "7. Technical Specs — AI edges"
title: G1–G5 in acceptance criteria — audit all Gemini edge functions
skills:
  - gemini
  - supabase/supabase-edge-functions
  - mdeai-tasks
epic: cross-cutting
phase: CORE
priority: P2
status: Open
owner: Backend
dependencies: []
estimated_effort: M
percent_complete: 0
outcome: O10
---

# G1–G5 named in ACs for every JSON / grounding edge path

> **Why:** [`tasks/audit/06-tasks-audit.md`](../../audit/06-tasks-audit.md) — **G1–G5 in ACs** for **all** edge paths that return JSON or use Search Grounding — not only **06E**; avoids parse errors, key leaks, missing citations.  
> **Rules reference:** [`06E-hermes-intelligence.md`](06E-hermes-intelligence.md), **02E** header (G1–G5 for E2 edges).

## Prompt

1. **Inventory:** List every `supabase/functions/*/index.ts` that calls Gemini.

2. **For each:** Ensure **prompt file** or **VERIFY** checklist row names **G1–G5** explicitly in acceptance criteria (structured output, temperature, grounding, `x-goog-api-key`, `ai_runs` metadata).

3. **Gap file:** Optional `tasks/audits/gemini-edge-g1g5-matrix.md` with function × rule checklist.

## Acceptance criteria

- [ ] Matrix or **03E/06E** update shows **100%** Gemini functions with G1–G5 ACs or documented exception (e.g. no AI).
- [ ] **Security:** G4 key never logged raw.

## References

- [`tasks/audit/06-tasks-audit.md`](../../audit/06-tasks-audit.md) § AI edge (G1–G5 in ACs)
