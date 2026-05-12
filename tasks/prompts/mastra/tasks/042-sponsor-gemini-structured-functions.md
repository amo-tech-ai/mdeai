---
task_id: MASTRA-042
title: Land Gemini structured-output helper foundation (sponsor consumers blocked on schema)
phase: Sponsor marketplace / AI tooling
priority: P1
status: Blocked — sponsor schema incomplete
estimated_effort: 0.25 day for helper foundation; remainder gated on MASTRA-043 + MASTRA-044
area: supabase / edge-functions
skill: [mde-supabase, supabase-edge-functions, gemini, test-driven-development, mde-testing]
subagents: [backend]
edge_function: none (this PR is helper + tests only; sponsor functions defer to MASTRA-044)
schema_tables: []
depends_on: [MASTRA-037]
blocks: [MASTRA-043, MASTRA-044, Phase 3 sponsor marketplace]
verified_docs:
  - https://ai.google.dev/api/rest
  - https://docs.deno.com/runtime/reference/cli/check/
  - https://supabase.com/docs/guides/functions
related:
  - supabase/functions/_shared/gemini.ts
  - supabase/functions/tests/gemini_retry_test.ts
  - supabase/functions/tests/gemini_structured_test.ts
---

<!-- task-summary -->
> **What:** Land **only** the reusable Gemini structured-output helper (`callGeminiStructured` + `GeminiStructuredError` + `withRetry`) and its two Deno unit-test files. Defer the 5 sponsor edge functions, their tests, the sponsor access-control helper, and the two existing sponsor migrations to follow-up tasks (MASTRA-043, MASTRA-044). Shipping the sponsor functions today would 500 in production because the tables they read (`sponsor.invoices`, `sponsor.contracts`, `sponsor.placements`, `sponsor.roi_daily`) have **no migration in the repo**.
> **Why:** A 2026-05-12 audit revealed the sponsor schema is incomplete in git: the access-control migration only creates `sponsor.{organizations, applications, assets}`, and `activate_placements_if_ready` references three sponsor tables that have no `CREATE TABLE` migration anywhere (main, working tree, or any branch). Shipping endpoints that 500 on first call is worse than shipping nothing.
> **Delivers:** A production-grade, REST-locked Gemini structured-output path (snake_case tools, Zod-validated, retryable, `agentName` + truncated-body logging on non-2xx) **available for future consumers**, with 8+ Deno tests proving the REST contract.
> **Tools/Skills:** `mde-supabase` · `supabase-edge-functions` · `gemini` · `test-driven-development` · `mde-testing`
> **Sponsor marketplace · P1 · Blocked (sponsor portion) · Effort: 0.25 day for helper foundation**

# Land Gemini structured-output helper foundation

## 1. Purpose

We have a 305-line addition to `supabase/functions/_shared/gemini.ts` that introduces `callGeminiStructured` (native `v1beta:generateContent`, REST-locked, snake_case tools), a stable `GeminiStructuredError` with `.code`, and the `withRetry` wrapper. Two Deno unit-test files prove the contract. Five untracked sponsor edge functions consume the helper.

The earlier plan was to land all of this — helper, 5 sponsor functions, tests, migrations, smoke — as one feature PR. The 2026-05-12 audit blocked that plan: four sponsor tables that the functions query (`sponsor.invoices`, `sponsor.contracts`, `sponsor.placements`, `sponsor.roi_daily`) **have no migration in git**. Shipping the functions now would produce `relation "sponsor.roi_daily" does not exist` 500s on first call.

**This task is scoped down to the helper foundation only.** Sponsor functions, migrations, sponsor-access helper, and smoke wrapper move to follow-up tasks.

**Not in scope (deferred to MASTRA-043 / MASTRA-044):**
- 5 sponsor edge function `index.ts` files
- 5 sponsor function Deno tests
- `_shared/sponsor-access.ts` (RLS-equivalent access helpers)
- Sponsor migrations (`20260505000100_sponsor_activate_placements_if_ready.sql`, `20260512120000_sponsor_schema_edge_acl.sql`)
- Missing sponsor schema migrations (see §11)
- `scripts/smoke-sponsor-roi-explain.sh`
- Sponsor dashboard UI, Stripe sponsor-checkout wiring

## 2. Goals

- `_shared/gemini.ts` helper foundation lands on `main` as the **single source of truth** for Gemini structured output across the project.
- Helper preserves the locked REST contract: `generationConfig.responseFormat.text.{mimeType, schema}` + snake_case tool keys (`google_search`, `url_context`, `google_maps`).
- `GeminiStructuredError` has a stable `.code` (`GEMINI_TIMEOUT`, `GEMINI_RATE_LIMITED`, `GEMINI_HTTP_ERROR`, `GEMINI_PARSE_ERROR`, `GEMINI_SCHEMA_VIOLATION`) so future consumers can branch on it.
- `withRetry()` wraps 429 / 5xx with bounded backoff and never swallows the final error.
- Two Deno test files (`gemini_retry_test.ts`, `gemini_structured_test.ts`) lock the REST shape and error codes; `deno test` runs green against the staged files.
- `npm run floor` clean on the PR branch.
- No sponsor functions, sponsor tests, sponsor migrations, sponsor access helper, smoke script, or UI files are staged in this PR.

## 3. Features (what the operator gets)

- Future edge functions that need Gemini structured output (sponsor marketplace, possibly other AI features) can import `{ callGeminiStructured, withRetry, GeminiStructuredError }` from one place.
- Stable error codes for retry / fallback logic in callers.
- `agentName` is logged on every 429 and non-2xx response with the first 500 bytes of the body — operators can grep one log line to identify the failing caller.

## 4. Workflows

1. **Stage exactly four files** (one diff per file; nothing else):
   - `supabase/functions/_shared/gemini.ts` (+305 net lines vs `main` blob `568306b`)
   - `supabase/functions/tests/gemini_retry_test.ts` (new)
   - `supabase/functions/tests/gemini_structured_test.ts` (new)
   - `tasks/prompts/mastra/tasks/042-sponsor-gemini-structured-functions.md` (this spec, with status `Blocked`)
2. **Run helper Deno tests directly** before staging:
   ```bash
   deno test \
     supabase/functions/tests/gemini_retry_test.ts \
     supabase/functions/tests/gemini_structured_test.ts \
     --allow-env --allow-net
   ```
   All tests must pass.
3. **Run `npm run verify:edge`** — confirms no edge function regression and that the orphan-skip guard (from MASTRA-037) correctly skips the untracked sponsor functions on disk.
4. **Run `npm run floor`** — `lint` + `build` + `test` + `verify:edge` all green.
5. **Open PR-2** titled `feat(edge-shared): callGeminiStructured helper + 8 Deno tests`. PR body must:
   - State that this is the helper foundation only.
   - List the missing sponsor schema (see §11) as the reason sponsor functions are not in this PR.
   - Link to MASTRA-043 (sponsor schema foundation) and MASTRA-044 (sponsor Gemini functions) as the planned follow-ups.

## 5. User journeys

- **Engineer adding the next AI feature:** imports `callGeminiStructured` from `_shared/gemini.ts`, gets retries + structured-output + error codes for free, writes one test per response schema.
- **Reviewer of this PR:** sees a small, self-contained helper diff plus two test files. No dead code, no orphan functions, no schema risk.
- **On-call after merge:** sees no behavior change. Helper is dormant until a consumer imports it.

## 6. Agents

| Agent | Edge fn | Model | Role |
|-------|---------|-------|------|
| _(none — helper foundation only)_ | _(none)_ | _(none)_ | _(future consumers in MASTRA-044)_ |

## 7. Integrations

| Integration | Purpose | Auth source |
|-------------|---------|-------------|
| Gemini (`v1beta:generateContent`) | REST contract that the helper targets (no live call from this PR) | `GEMINI_API_KEY` (already in Supabase secrets) |

## 8. Summary

We land only the Gemini structured-output helper + its 8 Deno unit tests. The five sponsor edge functions that consume the helper move to MASTRA-044 because the tables they query (`sponsor.invoices`, `sponsor.contracts`, `sponsor.placements`, `sponsor.roi_daily`) have no migration in the repo and shipping them now would 500 on first call. Success = one small PR, one review pass, helper available for future consumers, zero dead code in `main`.

## 9. Definition of Done

- [ ] `supabase/functions/_shared/gemini.ts` committed (REST-locked helper, snake_case tools, `GeminiStructuredError` with `.code`, `withRetry`, `agentName` + truncated-body logging on non-2xx)
- [ ] `supabase/functions/tests/gemini_retry_test.ts` committed and green under `deno test`
- [ ] `supabase/functions/tests/gemini_structured_test.ts` committed and green under `deno test`
- [ ] This spec (status `Blocked — sponsor schema incomplete`) committed
- [ ] **NO** sponsor function, sponsor test, sponsor access helper, sponsor migration, smoke script, or UI file staged
- [ ] `npm run lint` clean
- [ ] `npm run build` clean
- [ ] `npm run test` clean (no count regression)
- [ ] `npm run verify:edge` clean (orphan-skip guard correctly skips untracked sponsor folders)
- [ ] `npm run floor` clean
- [ ] PR body lists: helper LOC, count of new tests, the missing sponsor schema, links to MASTRA-043 + MASTRA-044
- [ ] Branch-protection check `floor / node` + `floor / deno` green

## 10. Rollback

- Single revert of the helper commit removes the new exports. No consumer exists in `main`, so revert is risk-free.
- No migration, no schema change, no env-var requirement introduced.

## 11. Blockers preventing the sponsor portion of the original MASTRA-042 from shipping

> **Until every item below is resolved, sponsor functions stay deferred to MASTRA-044.**

### Missing sponsor tables (zero migrations exist in repo)

- `sponsor.invoices` — referenced by `activate_placements_if_ready` (paid-invoice check)
- `sponsor.contracts` — referenced by `activate_placements_if_ready` (signed-contract check)
- `sponsor.placements` — referenced by `activate_placements_if_ready` (placement activation) and `sponsor-roi-explain` (surface join)
- `sponsor.roi_daily` — read by `sponsor-roi-explain` for 7-day rollups

### Missing foreign key

- `sponsor.applications.event_id` → `public.events(id)` — `sponsor-roi-explain` joins `events(name)` through this FK

### Missing / undocumented env vars

- `SPONSOR_ROI_CRON_SECRET` — cron auth bypass for `sponsor-roi-explain`
- `SPONSOR_CRON_AI_RUN_USER_ID` — `ai_runs.user_id` for cron-initiated runs

### Follow-up tasks

- **MASTRA-043: sponsor schema foundation** — write the 4 missing `CREATE TABLE` migrations, the `event_id` FK migration, RLS policies, and the two env-var docs. Land `_shared/sponsor-access.ts` here only if its target tables exist in this PR.
- **MASTRA-044: sponsor Gemini functions** — depends on MASTRA-042 (helper) + MASTRA-043 (schema). Lands the 5 sponsor function `index.ts` files, their 5 Deno tests, the 2 existing sponsor migrations (`activate_placements_if_ready` + `sponsor_schema_edge_acl`), and the smoke wrapper.

## 12. Pre-merge audit answers (recorded 2026-05-12)

1. **Do the 2 untracked sponsor migrations contain down-migrations?** Not staged in this PR — moved to MASTRA-044.
2. **Are sponsor functions Stripe-coupled?** Not in scope; deferred to MASTRA-044.
3. **Does the helper duplicate logic in `main`?** No. `main` has `fetchGemini` / `fetchGeminiStream` (OAI-compat endpoint); the new `callGeminiStructured` adds a distinct native `v1beta` path. Both coexist in one file.
4. **Does any sponsor table exist on `main`?** No. `git ls-tree main supabase/migrations/` returns zero sponsor migrations. Confirms blocker §11 above.
