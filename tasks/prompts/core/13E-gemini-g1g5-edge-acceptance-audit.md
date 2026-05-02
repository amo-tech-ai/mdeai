---
id: 13E
diagram_id: MERM-09
prd_section: "7. Technical Specs — AI edges"
title: G1–G5 in acceptance criteria — audit all Gemini edge functions
description: "Ships «G1–G5 in acceptance criteria — audit all Gemini edge functions» for this epic—full scope in § Prompt below."
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

### Real world — purpose & outcomes

**In one sentence:** Every Gemini edge follows the same safety and quality bar (G1–G5) — so API keys never leak to the client and logs stay useful for audits.

- **Who it’s for:** Travelers (correct AI behavior); security reviewers; finance (cost metadata).
- **Purpose:** Audit matrix across `ai-*` functions: JSON schema, temperature, grounding, `ai_runs`.
- **Goals:** PR checklist; grep or CI for violations; consistent logging.
- **Features / deliverables:** Per-function gap list; fixes or waivers; link to `ai_runs` usage.

> **Why:** [`tasks/audit/06-tasks-audit.md`](../../audit/06-tasks-audit.md) — **G1–G5 in ACs** for **all** edge paths that return JSON or use Search Grounding — not only **06E**; avoids parse errors, key leaks, missing citations.  
> **Rules reference:** [`06E-hermes-intelligence.md`](06E-hermes-intelligence.md), **02E** header (G1–G5 for E2 edges).

## Success criteria (tests · verify · production-ready)

| Track | Definition |
|-------|------------|
| **Tests** | Relevant automated checks pass: `npm run lint`, `npm run build`, `npm run test` (and `npm run verify:edge` when Supabase edge functions change). Add or update tests when behavior changes. |
| **Verify** | Manual smoke: confirm the user-visible or API outcome in dev/staging; for auth, CORS, payments, or idempotency, exercise the real path once. |
| **Production-ready** | No open security gaps for this change scope; deploy path documented or executed; rollback/monitoring understood if the change touches production data or money. Mark complete only when the rows above are satisfied. |

## Feature success (goals → shippable features)

Aligned with [`PROMPT-VERIFICATION.md`](../PROMPT-VERIFICATION.md) §6 (Goal · Workflow · Proof · Gates · Rollout), [`.claude/skills/mde-writing-plans/SKILL.md`](../../../.claude/skills/mde-writing-plans/SKILL.md) (user stories + observable proof), and optionally [`.agents/skills/tasks-generator/SKILL.md`](../../../.agents/skills/tasks-generator/SKILL.md) (PRD → tasks).

| Layer | Intent |
|-------|--------|
| **Goal** | G1–G5 Gemini rules enforced in every edge PR touching AI. |
| **Workflow** | Audit each function → fix gaps → log `ai_runs`. |
| **Proof** | Checklist in PR template; CI grep optional. |
| **Gates** | API keys never in client logs. |
| **Rollout** | Block merge on P0 violations. |

---

## G1–G5 Rules (inline — do NOT require reading 06E separately)

| Rule | Requirement |
|------|-------------|
| G1 | Use `responseMimeType: "application/json"` + `responseSchema` for structured output |
| G2 | Use temperature 1.0 (Gemini default) unless creative output needed |
| G3 | Prefer grounding + schema over prompt-only extraction |
| G4 | Auth via `x-goog-api-key` header (not Bearer), key from `Deno.env.get("GEMINI_API_KEY")` — NEVER log the key value |
| G5 | Log to `ai_runs` table: agent_name, model_name, input_tokens, output_tokens, duration_ms, status |

## Prompt

1. **Inventory:** Run `grep -r "generativelanguage.googleapis.com" supabase/functions/` to find every edge function that calls Gemini. Expected functions (verify): ai-chat, ai-router, ai-search, ai-trip-planner, ai-optimize-route, ai-suggest-collections, rentals.

2. **For each function:** Create a row in the matrix showing compliance with G1–G5.

3. **Output:** Create `tasks/audit/gemini-g1g5-matrix.md` (NOT optional) with this format:

| Function | G1 (JSON schema) | G2 (temp 1.0) | G3 (grounding) | G4 (api-key auth) | G5 (ai_runs log) | Status |
|----------|:-:|:-:|:-:|:-:|:-:|--------|
| ai-chat | ? | ? | ? | ? | ? | ? |
| ai-router | ? | ? | ? | ? | ? | ? |
| ai-search | ? | ? | ? | ? | ? | ? |
| ai-trip-planner | ? | ? | ? | ? | ? | ? |
| ai-optimize-route | ? | ? | ? | ? | ? | ? |
| ai-suggest-collections | ? | ? | ? | ? | ? | ? |
| rentals | ? | ? | ? | ? | ? | ? |

**Pre-audit baseline (verified 2026-04-05 — 0/7 functions fully comply):**

| Function | G1 (JSON schema) | G2 (temp 1.0) | G3 (grounding) | G4 (api-key auth) | G5 (ai_runs log) | Status |
|----------|:-:|:-:|:-:|:-:|:-:|--------|
| ai-chat | FAIL | ? | FAIL | OK (via shared helper) | PARTIAL (calls insertAiRun) | FAIL |
| ai-router | FAIL | ? | FAIL | OK (via shared helper) | FAIL (no logging) | FAIL |
| ai-search | FAIL | FAIL (uses 0.1) | FAIL | OK (via shared helper) | FAIL (no logging) | FAIL |
| ai-trip-planner | FAIL | ? | FAIL | OK (via shared helper) | FAIL (no logging) | FAIL |
| ai-optimize-route | FAIL | ? | FAIL | OK (via shared helper) | FAIL (no logging) | FAIL |
| ai-suggest-collections | FAIL | ? | FAIL | OK (via shared helper) | FAIL (no logging) | FAIL |
| rentals | FAIL | ? | FAIL | OK (direct, bypasses helper) | FAIL (no logging) | FAIL |

**Key findings:**
- **G1:** Zero functions use `responseMimeType: "application/json"` + `responseSchema`. All parse raw text.
- **G2:** `ai-search` explicitly sets `temperature: 0.1` (line ~84). Others don't specify (defaults may vary).
- **G3:** Zero functions use Search Grounding API. All use prompt-only extraction.
- **G4:** Shared `_shared/gemini.ts` helper uses Bearer correctly. `rentals` bypasses the helper and calls Gemini directly — should be refactored to use shared helper.
- **G5:** Only `ai-chat` calls `insertAiRun()`. Helper exists in shared code but other 6 functions don't use it.

## Acceptance criteria

- [ ] `tasks/audit/gemini-g1g5-matrix.md` created with ALL Gemini-calling functions listed
- [ ] Each function has a compliance status for each of G1–G5 (pass/fail/N/A)
- [ ] Failing functions have linked issues or TODOs in the matrix
- [ ] `grep -r "GEMINI_API_KEY" supabase/functions/` shows key is read from env, never hardcoded or logged
- [ ] Matrix linked from `VERIFY-supabase-postgres-edge.md` as a pre-deploy check

## References

- [`tasks/audit/06-tasks-audit.md`](../../audit/06-tasks-audit.md) § AI edge (G1–G5 in ACs)
