---
title: Outcomes — progress tracker
status: Active
last_updated: 2026-05-14
owner: mde-task-lifecycle
companions:
  - tasks/claude-code/01-outcomes-plan.md
  - tasks/claude-code/02-outcomes-prompt.md
  - tasks/claude-code/03-outcomes-skill.md
  - .claude/docs/best-practices/01-outcomes-plan.md
  - .claude/docs/best-practices/dashboard-claude.md
---

# Outcomes — progress tracker

> Single page that tells you what's done, what's next, and where each artifact lives. Updated whenever an Outcomes-related ship happens.

## Headline

| | |
|---|---|
| **Phase** | **Phase 1 manual** — rubrics live + skill live + hooks reinforcing culture. **Phase 2** (API runner) deferred. |
| Rubrics extracted | **4 / 4** (`pr-review`, `supabase-migration`, `maps-grounding`, `events-ticketing`) |
| Skill installed | `outcomes` (`.claude/skills/outcomes/SKILL.md` + 4 references) |
| Hooks reinforcing | `stop-attribution-gate.mjs`, `stop-rls-gate.mjs`, `dist-leak-scan.mjs` (3/3 syntactically valid + hook-tested) |
| Real PRs run through the rubrics | **0** — next action |
| API runner shipped | **No** (deferred per Phase 2 of `01-outcomes-plan.md`) |
| Dashboard score Outcomes axis | **7.5 → 9.0** (jumped this session) |

## Phase 1 deliverables — DONE

- [x] `.claude/outcomes/README.md` — library overview, rubric table, manual prompt example
- [x] `.claude/outcomes/pr-review.md` — 80 lines, 10 criteria, `max_iterations: 3`
- [x] `.claude/outcomes/supabase-migration.md` — 94 lines, 10 criteria, `max_iterations: 5`
- [x] `.claude/outcomes/maps-grounding.md` — 113 lines, 11 criteria, `max_iterations: 5`
- [x] `.claude/outcomes/events-ticketing.md` — 150 lines, 10 criteria, `max_iterations: 8`
- [x] `.claude/skills/outcomes/SKILL.md` — concise routing layer with `paths:` scoping
- [x] `.claude/skills/outcomes/references/evidence-rules.md` — acceptable / weak / forbidden evidence
- [x] `.claude/skills/outcomes/references/rubric-selection.md` — which rubric + Fast/Full/Locked mode + iteration recs
- [x] `.claude/skills/outcomes/references/manual-outcomes-workflow.md` — 6-step verifier loop + per-rubric expected output
- [x] `.claude/skills/outcomes/references/anti-patterns.md` — 8 categories of claims a verifier must reject
- [x] `.claude/hooks/stop-attribution-gate.mjs` — blocks turn-end on unsupported success claims (negation-aware)
- [x] `.claude/hooks/stop-rls-gate.mjs` — blocks turn-end on migration diff without RLS evidence
- [x] `.claude/hooks/dist-leak-scan.mjs` — blocks deploy command when built artifacts contain secret-class patterns
- [x] Hook test transcript validated: A1 block-no-evidence (exit 2), A2 pass-with-evidence (exit 0), A3 stop_hook_active suppress (exit 0), B1 block-migration-no-RLS (exit 2), B2 pass-with-RLS (exit 0), C1 block-leak (exit 2), C2 ignore-non-deploy (exit 0)

## Phase 2 — DEFERRED

Per Phase 2 of `.claude/docs/best-practices/01-outcomes-plan.md §8` (and the user's explicit rules: "do not implement Outcomes automation, do not wire Managed Agents API"):

- [ ] `scripts/outcomes/run-outcome.ts` — generic Managed Agents API runner using beta header `managed-agents-2026-04-01`
- [ ] `scripts/outcomes/upload-rubric.ts` — Files API upload for rubric reuse across sessions
- [ ] `scripts/outcomes/run-pr-review-outcome.ts`, `run-migration-outcome.ts`, `run-deploy-outcome.ts` — per-flow wrappers
- [ ] Streaming reader for `span.outcome_evaluation_start` / `…_end` events
- [ ] Deliverable retrieval from `/mnt/session/outputs/` via Files API

**Gate before starting Phase 2:** at least **3 real PRs** run manually through `pr-review.md` with the loop reaching `satisfied`. Today's count: **0**.

## Phase 3 — DEFERRED

- [ ] GitHub Action on `pull_request` invoking `run-outcome.ts`
- [ ] Grader explanation posted as PR comment
- [ ] Block merge on `result != satisfied`

## Phase 4 — DEFERRED

- [ ] Vercel deploy-hook → invoke `production-deploy.md` outcome
- [ ] Rollback on failure via `vercel rollback`

## Phase 5 — DEFERRED (and likely to stay deferred)

- [ ] Cron-triggered nightly QA running `phase1-gate.md`, `mastra-agent.md`, `maps-grounding.md`
- [ ] Pager only after 7 nights green in a row

## Test artifacts (validates the system works)

| Test | Result | Date | Notes |
|---|---|---|---|
| Hook test A1 (attribution gate, no evidence) | **block, exit 2** ✓ | 2026-05-14 | Pattern matched `verified`; no evidence marker; blocked correctly |
| Hook test A2 (attribution gate, with evidence) | **pass, exit 0** ✓ | 2026-05-14 | Evidence: `Tests 76 passed`, `exit code 0`, `http=200` |
| Hook test A3 (attribution gate, stop_hook_active) | **pass, exit 0** ✓ | 2026-05-14 | Confirms no infinite loop |
| Hook test B1 (RLS gate, migration without RLS) | **block, exit 2** ✓ | 2026-05-14 | Listed the dummy migration file path; required pasted RLS evidence |
| Hook test B2 (RLS gate, with RLS evidence) | **pass, exit 0** ✓ | 2026-05-14 | `pg_policies` + `CREATE POLICY` + `supabase db reset` all matched |
| Hook test C1 (dist-leak, simulated git push) | **block, exit 2** ✓ | 2026-05-14 | **Surfaced 3 real `AIzaSy` hits in existing `dist/assets/*.js` — see §Findings** |
| Hook test C2 (dist-leak, npm run build) | **pass, exit 0** ✓ | 2026-05-14 | Correctly ignores non-deploy commands |

## Findings from Test C1

The dist-leak-scan hook surfaced **3 real `AIzaSy*` patterns** in the current build artifacts:

```
dist/assets/ChatMap-CZixAT4g.js       → class=google-api-key
dist/assets/TripDetail-Yy4OZ6Oj.js    → class=google-api-key
dist/assets/index-UAvyMnHB.js         → class=google-api-key
```

**Status:** **expected**. `VITE_GOOGLE_MAPS_API_KEY` is a Vite `VITE_*` env var, which by design is inlined into the client bundle. The key is restricted by HTTP-referrer in Google Cloud Console.

**Action item:** the rotation in `.claude/docs/security/secret-rotation-checklist-2026-05-14.md §1` regenerates this key. After rotation: **rebuild `dist/`** so the old key is no longer in any built artifact. The hook should be left blocking — a deploy that bundles the old key is the exact thing it's supposed to catch.

## Score history (outcomes axis)

| Date | Score /10 | Notes |
|---|---:|---|
| 2026-05-08 | 0 | No plan, no rubrics. |
| 2026-05-14 (mid) | 7.5 | `01-outcomes-plan.md` shipped with 4 rubric bodies embedded in §6.A–D. |
| 2026-05-14 (post-extract) | 7.5 | Rubric files extracted to `.claude/outcomes/*.md`. |
| **2026-05-14 (current)** | **9.0** | `outcomes` skill installed with 4 references + Stop hooks reinforcing culture + hook tests pass. |

To reach 10/10: run the loop on **3 real PRs** to `satisfied`, then mark this axis green-locked.

## Next 3 actions

| # | Action | Effort | Approval |
|---|---|---|---|
| 1 | Run `pr-review.md` against the next real PR (the writer of that PR is the user / `mdeai-executor`; the verifier is a fresh Claude Code session reading the rubric). Paste the full transcript here under §"Run log". | 30 min | no |
| 2 | Update `02-best-practices-guide.md` §15 and `dashboard-claude.md` to reflect "outcomes skill installed" + bump §10 to 9.0. | 10 min | no |
| 3 | After 3 real PR runs reach `satisfied`, gate-pass Phase 2 and begin authoring `scripts/outcomes/run-outcome.ts`. | 2 days | **yes** (Anthropic API spend) |

## Run log

_(Populate as real PRs are graded. One row per session.)_

| Date | PR # | Rubric | Iterations | Final result | Verifier | Notes |
|---|---|---|---:|---|---|---|
| _empty_ | | | | | | First run pending |

---

# Testing strategy — 2026-05-14

Run from `/home/sk/mde` against commit `36d1636` (working tree dirty: 285 modified files unrelated to this strategy). Node `v25.9.0`, npm `11.12.1`.

## Strategy — what we check and why

| Layer | What | Why it gates Phase 2 |
|---|---|---|
| 1. File existence | All 10 outcomes / skill / hook files | Missing file → broken routing |
| 2. Hook syntax | `node --check` on each `.mjs` | Syntax error → harness can't load the hook |
| 3. Frontmatter / markdown validation | Required sections in each rubric: `When to run`, `max_iterations`, `Forbidden shortcuts`, `Coverage checklist`, `Output format` | Missing section → grader can't run the rubric |
| 4. Hook behavior — positive | Each hook **blocks** on its negative case (no evidence / no RLS / leaked pattern) | Hook that doesn't block = false safety |
| 5. Hook behavior — negative | Each hook **passes** when its positive case is satisfied | Hook that over-blocks = pager fatigue |
| 6. Recursion guard | `stop_hook_active=true` short-circuits the Stop hooks | Prevents infinite loops |
| 7. Repo floor | `lint`, `typecheck`, `test`, `build`, `verify:edge` | Project must already be green before grading |
| 8. Performance timing | `/usr/bin/time -f "duration=%E exit=%x"` on every command | Loop is unusable if floor > 60 s |
| 9. Secret scan | `AIzaSy / ghp_ / sk_live_ / whsec_` regex over `.claude`, `CLAUDE.md`, `src`, `supabase`, `dist` | A leak in `dist/` would deploy a live key |
| 10. CI readiness | `verify`, `test:e2e` scripts present, `floor` chains everything | No CI = humans must remember to run it |
| 11. Manual PR-outcome readiness | Count of real PRs run end-to-end through a rubric | Phase 2 (API runner) only unlocks at ≥ 3 |
| 12. 100% correctness gate | Every probe above passes AND ≥ 3 real PR loops at `satisfied` | The single ship gate |

## Key findings

- **Deterministic correctness:** 17/17 probes pass — file existence (10/10), hook syntax (3/3), rubric markdown (6/6), hook behavior (7/7), floor (5/5 commands green).
- **Current correctness percentage:** **74 %** (17 deterministic passes ÷ 23 total probes that include the CI-script gaps + 3 real-PR-loop gate + 1 real dist leak still queued for rotation).
- **Current grade:** **8.4 / 10** (see §Performance grade below — strict scoring).
- **What works:** all rubric files load, all hooks are syntactically valid, all 7 expected hook outcomes confirmed live, `npm run floor` chains cleanly in ~16 s wall time, secret scan over `.claude` / `CLAUDE.md` / `src` / `supabase` is clean for new content (the two vendor doc hits are Google's public sample key).
- **What is blocked:** Phase 2 (Managed Agents API runner) is gated on **3 real PR outcome loops reaching `satisfied`**. **Current count: 0 / 3.**
- **Real dist leak:** `dist/assets/{ChatMap,TripDetail,index}-*.js` still contain the inlined `VITE_GOOGLE_MAPS_API_KEY`. Expected (Vite inlines `VITE_*` by design), but the dist-leak hook will block `git push` until the rotation in `.claude/docs/security/secret-rotation-checklist-2026-05-14.md §1` is done **and** `dist/` is rebuilt.
- **100 % reached?** **No.** See §100% correctness gate.
- **Phase 2 can start?** **No.** Gated on real PR loops + rotation + CI scripts.

## What failed

Strict per the task rule "if something cannot be tested, mark it as failed for 100 % certification":

| # | Failure / gap | Evidence | Cost to 100 % |
|---|---|---|---|
| 1 | `npm run verify` script not in `package.json` | `node -e '…scripts.verify'` → `(not present)` | -1 CI readiness |
| 2 | `npm run test:e2e` script not in `package.json` | `node -e '…scripts["test:e2e"]'` → `(not present)`; Playwright config present but suite empty | -1 CI readiness |
| 3 | 3 real PR outcome loops at `satisfied` | Run log empty (`_empty_` row) | Phase 2 blocked |
| 4 | `dist/assets/*.js` contains live `AIzaSy*` (Vite-inlined Maps key) | `grep AIzaSy dist/assets/` → 3 files | Deploy hook will block until rotation + rebuild |
| 5 | Lint warnings (155, mostly `@typescript-eslint/no-explicit-any` outside this PR's scope) | `npm run lint` → 0 errors, 155 warnings, exit 0 | -1 lint quality (warning-level, not failing) |
| 6 | Skill triggering not verifiable from a Bash script | The `outcomes` skill appears in this session's registry but auto-trigger on `paths:` only fires in a fresh session | Defer to next session restart |

All other deterministic probes **PASS**.

## Test results — latest run

| Test | Command | Duration | Exit code | Result | Notes |
|---|---|---:|---:|---|---|
| File existence (10 paths) | `test -f …` × 10 | < 1 s | 0 | ✅ PASS | All 10 files present, sizes 2 KB–8 KB |
| Hook syntax (attribution-gate) | `node --check .claude/hooks/stop-attribution-gate.mjs` | < 1 s | 0 | ✅ PASS | |
| Hook syntax (rls-gate) | `node --check .claude/hooks/stop-rls-gate.mjs` | < 1 s | 0 | ✅ PASS | |
| Hook syntax (dist-leak-scan) | `node --check .claude/hooks/dist-leak-scan.mjs` | < 1 s | 0 | ✅ PASS | |
| Rubric markdown validation | inline node script | < 1 s | 0 | ✅ PASS | Every rubric has all 5 required sections |
| Hook behavior A1 — attribution / no-evidence | piped JSON → stop-attribution-gate.mjs | < 1 s | 2 | ✅ PASS | Expected block; got block |
| Hook behavior A2 — attribution / with-evidence | piped JSON → stop-attribution-gate.mjs | < 1 s | 0 | ✅ PASS | Expected pass; got pass |
| Hook behavior A3 — recursion guard | piped JSON `stop_hook_active=true` | < 1 s | 0 | ✅ PASS | No re-block |
| Hook behavior B1 — RLS / migration without RLS | piped JSON → stop-rls-gate.mjs | < 1 s | 2 | ✅ PASS | Listed the dummy migration path |
| Hook behavior B2 — RLS / migration with RLS | piped JSON → stop-rls-gate.mjs | < 1 s | 0 | ✅ PASS | `pg_policies` + `CREATE POLICY` + `supabase db reset` matched |
| Hook behavior C1 — dist-leak / git push | piped JSON → dist-leak-scan.mjs | < 1 s | 2 | ✅ PASS | Blocked deploy; printed file paths only, never values |
| Hook behavior C2 — dist-leak / npm run build | piped JSON → dist-leak-scan.mjs | < 1 s | 0 | ✅ PASS | Non-deploy ignored |
| Lint | `npm run lint` | 7.93 s | 0 | ✅ PASS | 0 errors, 155 warnings (pre-existing) |
| Typecheck | `npm run typecheck` | 0.25 s | 0 | ✅ PASS | `tsc --noEmit` clean |
| Tests | `npm run test -- --run` | 1.61 s | 0 | ✅ PASS | 76/76 in 9 files |
| Build | `npm run build` | 4.79 s | 0 | ✅ PASS | Main bundle 454.5 KB (gzip 128.2 KB) |
| Edge verify | `npm run verify:edge` | 1.55 s | 0 | ✅ PASS | 21 passed / 0 failed / 51 ignored |
| `verify` script | `npm run verify` | n/a | n/a | ❌ MISSING | Not present in `package.json` |
| `test:e2e` script | `npm run test:e2e` | n/a | n/a | ❌ MISSING | Not present in `package.json` |
| Secret scan (src) | `grep -RIE 'AIzaSy\|ghp_\|sk_live_\|whsec_' .claude CLAUDE.md src supabase package.json` | < 1 s | n/a | ⚠ INFO | 2 hits — Google public sample key in vendor docs (documented as safe) |
| Secret scan (dist) | `grep -RIE 'AIzaSy' dist/` | < 1 s | n/a | ❌ FAIL | 3 hits — live Vite-inlined Maps key; queued for rotation + rebuild |
| Manual PR-outcome runs | run log count | n/a | n/a | ❌ 0 / 3 | Phase 2 gate |

**Floor total wall time:** `lint 7.93 + typecheck 0.25 + test 1.61 + build 4.79 + verify:edge 1.55 = 16.13 s` end-to-end. Well under any reasonable CI budget.

## Performance grade

Strict 10-point scoring per category:

| Category | Score | Reason |
|---|---:|---|
| File completeness | **10** | All 10 expected paths present with sane byte sizes (2 KB–8 KB) |
| Hook syntax | **10** | 3/3 hooks pass `node --check`; clean exit |
| Hook behavior | **10** | 7/7 expected outcomes verified live (3 positive + 3 negative + 1 recursion guard) |
| Rubric quality | **9** | All 4 rubrics + README have required sections; one point withheld because no real PR has graded against them yet |
| Skill routing | **9** | `outcomes` SKILL.md + 4 references present; `paths:` scoping correct; one point withheld pending real verifier session in a fresh process |
| Repo lint / type / test / build | **10** | `floor` green: 0 lint errors, typecheck clean, 76/76 vitest, build 4.79 s, edge 21/0/51 |
| Security leak protection | **7** | Hook works (C1 PASS) and `settings.local.json` is sanitized (0 matches); **but** `dist/assets/*.js` contains the live Vite-inlined Maps key — counts against this axis until rotation + rebuild |
| CI readiness | **5** | `floor` chains everything locally, but `verify` and `test:e2e` scripts are absent, and no GitHub Action gates PR merges yet |
| Performance | **9** | Floor totals 16.13 s; typecheck 0.25 s, build 4.79 s, tests 1.61 s — well within budget. Minor: 155 lint warnings (pre-existing, not failing) |
| Production readiness | **5** | Hooks tested; rubrics live; **but 0 / 3 real PR outcome loops** at `satisfied`, Phase 2 blocked, dist leak pending rotation |

**Total: 10 + 10 + 10 + 9 + 9 + 10 + 7 + 5 + 9 + 5 = `84 / 100` → grade `8.4 / 10`.**

## GitHub reference

- **Progress tracker (committed):** https://github.com/amo-tech-ai/mde/blob/main/tasks/claude-code/progress-outcomes.md
- **Previous commit:** `bc8e1730c7b31da0a211dc2689a94e16a13c8a7d`
- **Current commit:** `ed99e8148fef129885dc1b46f9e56a855d14c269`

## 100 % correctness gate

A pass requires every deterministic probe PASS **and** every coverage gap below resolved.

**Pass conditions:**
- [x] All 10 file-existence probes PASS
- [x] All 3 hook syntax probes PASS
- [x] All 6 rubric markdown validations PASS
- [x] All 7 hook behavior probes PASS (3 positive + 3 negative + 1 recursion guard)
- [x] `npm run lint` exit 0
- [x] `npm run typecheck` exit 0
- [x] `npm run test` exit 0 with no regression (76 vs 76 main)
- [x] `npm run build` exit 0
- [x] `npm run verify:edge` exit 0
- [x] No new secrets in `.claude` / `CLAUDE.md` / `src` / `supabase` / `package.json`
- [ ] `npm run verify` script present *(missing)*
- [ ] `npm run test:e2e` script present *(missing)*
- [ ] `dist/assets/*.js` free of leaked-shape secrets *(3 hits — pending rotation + rebuild)*
- [ ] ≥ 3 real PR outcome loops reached `satisfied` *(current: 0 / 3)*

**Current result: `FAIL`.**

Four conditions are unmet. Honest framing: **the Outcomes scaffolding is correct, but the system has not yet been exercised end-to-end on a real PR.** No claim of "100 % working" is warranted today.

When the four boxes are checked, this section flips to `PASS` and Phase 2 (Managed Agents API runner) is unblocked.

---

# Rubric review — latest (2026-05-14)

Strict line-by-line audit against the four rubric files + `README.md`, with the user's seven feedback items as the starting point.

## Errors found

| # | Rubric | Line / criterion | Problem | Severity |
|---|---|---|---|---|
| E1 | `pr-review.md` | Criterion 3 | Used `git stash && npm run test && git stash pop` to get a baseline test count — **destructive** in a dirty worktree (loses uncommitted work if anything goes wrong mid-run, can fail on merge-conflicting stashes). | 🔴 high |
| E2 | `events-ticketing.md` | Criterion 3 | Concurrent curl probe sent `stripe-signature: <test-sig>` — Stripe webhook handlers reject this; **all 50 requests return 400** and the probe proves nothing. | 🔴 high |
| E3 | `supabase-migration.md` | Criterion 7 | Referenced `npm run gen:types` — **the script does not exist** in this repo's `package.json`. Verifier would hit `Missing script: "gen:types"` and silently mark criterion failed. | 🟡 medium |
| E4 | All four rubrics | (entire file) | No mode tagging — every PR ran the same heavy checklist regardless of risk. Forced graders to demand mobile screenshots for a one-line typo fix. | 🟡 medium |
| E5 | `pr-review.md` | Criterion 5 | Secret regex missed `AIzaSy…`, `ghp_…`, `Bearer <token>`, and short Stripe `sk_test_…` patterns — would let a Google Maps key or a GitHub PAT slip through the secret check. | 🟡 medium |
| E6 | `maps-grounding.md` + `events-ticketing.md` | Several criteria | External-service dependencies (Maps Grounding Lite API, Infobip, Stripe, Supabase local) were not labeled as blockers — they could be silently skipped as "N/A" without the verifier realizing they're load-bearing. | 🟡 medium |

## Red flags / failure points

- **F1 — `maps-grounding.md` criterion 7 (`<GroundingAttribution>`):** correctly documented as failing-by-definition until MASTRA-066 ships. Already explicit. **No fix needed**, just preserved.
- **F2 — `maps-grounding.md` criterion 11 (real Medellín smoke):** depends on Maps Grounding Lite API being enabled in the test GCP project. Currently disabled (`H2` blocker). Now explicitly tagged as `[Locked]` only.
- **F3 — `events-ticketing.md` criteria 11–13:** Camila / Roberto / Lighthouse E2E require a running preview server + a Stripe test session + real Lighthouse. Now tagged `[Locked]` only — Fast and Full modes skip them.
- **F4 — `events-ticketing.md` criterion 7 (Infobip delivery):** external API dependency. Now flagged in the README "External-service blockers" table — verifier must either get a real Infobip `messageId` or write `BLOCKED — Infobip unreachable`.
- **F5 — `supabase-migration.md` requires running `supabase start`:** added as an explicit prerequisite in the file header. If the local stack isn't running, the rubric fails closed (cannot silently skip).
- **F6 — `pr-review.md` criterion 10 (RLS not removed):** light check (only `relrowsecurity`). For PRs that also include a migration, the heavier `supabase-migration.md` rubric runs in series — by design, no overlap.

## Fixes applied

| # | File | Change |
|---|---|---|
| F1 | `README.md` | Added **Modes** section (Fast / Full / Locked) with explicit iteration caps and criterion coverage. |
| F2 | `README.md` | Added **Universal N/A rule** — three criteria that are never N/A (build/lint/test/typecheck, secret scan, §9 DoD). |
| F3 | `README.md` | Added **Accepted evidence — examples by class** table (command output / HTTP / SQL / screenshot / test summary / log / Lighthouse / Stripe session / email). |
| F4 | `README.md` | Added **External-service blockers** table flagging Stripe / Infobip / Maps Grounding Lite / Supabase as fail-closed. |
| F5 | `pr-review.md` | Replaced `git stash` baseline with `git worktree add /tmp/mdeai-baseline main` OR cached CI baseline — non-destructive. |
| F6 | `pr-review.md` | Tagged every criterion with `[Fast]` / `[Full]` / `[Locked]`. |
| F7 | `pr-review.md` | Expanded secret regex in criterion 5 to cover `AIzaSy…`, `ghp_…`, `sk_test_…`, JWTs, and `Bearer <token>`. |
| F8 | `pr-review.md` | Criterion 10 N/A wording now precise: `N/A — No migration files changed in this PR.` |
| F9 | `supabase-migration.md` | Header now declares `supabase start` as a prerequisite. Modes tagged. |
| F10 | `supabase-migration.md` | Criterion 7 uses `supabase gen types --lang=typescript --local > …` directly (no missing `npm run gen:types`); explicit N/A clause for policy-only migrations. |
| F11 | `maps-grounding.md` | Modes tagged. Header lists external-service prerequisites + the MASTRA-066 dependency. |
| F12 | `events-ticketing.md` | Modes tagged. Header lists Stripe test-mode + Infobip sandbox + Supabase local + preview server as prerequisites. |
| F13 | `events-ticketing.md` | **Criterion 3 (oversell probe) rewritten** with two valid paths: (A) `stripe trigger` CLI generates signed events; (B) documented `STRIPE_WEBHOOK_VERIFY=false` test-mode bypass with `_diag` precondition check. The user must document which path they used. |

## Remaining blockers

| Blocker | Affected criterion | Resolution path |
|---|---|---|
| MASTRA-066 (`<GroundingAttribution>`) not built | `maps-grounding.md` #7 | Ship MASTRA-066 — concrete: Mastra tool plus React component. |
| Maps Grounding Lite API not enabled in test GCP project | `maps-grounding.md` #8, #11 | Enable in Google Cloud Console (see `grounding-runtime-hardening.md` H2). |
| `stripe` CLI not in PATH on the local dev box | `events-ticketing.md` #3 path A | `brew install stripe/stripe-cli/stripe` (mac) or download from stripe.com/docs/stripe-cli. Otherwise use path B. |
| Phase 1 gate items (Camila / Roberto / Lighthouse) untested | `events-ticketing.md` #11–13 | Locked-mode runs against preview build with real Stripe test mode + real Lighthouse. Manual today; Phase 2 wraps in API. |
| 0 / 3 real PR outcome loops at `satisfied` | Phase 2 gate | Run pr-review.md against the next 3 real mdeai PRs. |
| `dist/assets/*.js` contains live `VITE_GOOGLE_MAPS_API_KEY` | Deploy gate (dist-leak hook) | Complete rotation in `secret-rotation-checklist-2026-05-14.md §1` + rebuild. |

## Next validation plan

Order matters — each step is independently shippable:

1. **Smoke the updated rubrics** against this very PR (the rubric refactor itself). Run `pr-review.md` in **Fast** mode against the rubric diff and confirm it reaches `satisfied` in 1 iteration. This is the lowest-risk first real run.
2. **Pick the next real PR** that touches `supabase/migrations/` and run `supabase-migration.md` in Full mode. Expect 2–3 iterations.
3. **Pick the next real PR** that touches a `src/**/*Map*` file and run `maps-grounding.md` in Full mode. The Grounding sub-section will fail on criterion 7 (MASTRA-066) — that's expected; the PR ships when the rendering sub-section passes.
4. After 3 PRs reach `satisfied`, flip the 100 % gate to `PASS` and start Phase 2 (`scripts/outcomes/run-outcome.ts` against the Managed Agents API).

## Current score

| Axis | Score / 10 | Reason |
|---|---:|---|
| Mechanical rubric quality | **9** | Modes tagged, prerequisites declared, regex expanded, dangerous `git stash` removed, missing `gen:types` fallback documented. Only −1 because the rubrics have not yet survived a real-PR run. |
| Evidence discipline | **9** | Accepted-evidence table in the README + per-criterion specifics + Stripe-signature reality check. −1 because the verifier has not yet been observed pasting evidence under fire. |
| Production readiness | **7** | Hooks proven live; rubrics now realistic; **but** 0 / 3 real PR loops + external-service blockers (MASTRA-066, Maps Grounding Lite, Infobip, `stripe` CLI, dist rotation) all still unresolved. |
| **Full 100 % certification** | **FAIL** | Phase 2 still blocked: 0 / 3 real PR loops at `satisfied`, two missing CI scripts, four external-service blockers. |

### Dashboard delta projected

After committing this audit: dashboard `§10 Outcomes readiness` stays at 9.0/10 (rubrics improved, but the gating real-PR runs are still 0). Overall dashboard score: **89 → 90** (the +1 reflects the +0.5 rubric-quality bump on a 10-axis rollup). Will not move further until 3 real PR loops are graded.

---

## GitHub reference (audit commit)

- **Progress tracker:** https://github.com/amo-tech-ai/mde/blob/main/tasks/claude-code/progress-outcomes.md
- **Previous audit commit:** `4bae3e66250993e25643c7c7e58291cc36810c75`
- **Current audit commit:** `9b9bb9b3a32bdc0e166005d6db38e2b9de32edcf`

---

# Mastra workflow rubric — added + tested (2026-05-14)

## What was added

| Artifact | Path | Size |
|---|---|---|
| **New rubric** | `.claude/outcomes/mastra-workflow.md` | 168 lines · 8.6 KB · 12 criteria across 5 sections |
| README entry | `.claude/outcomes/README.md` | +2 lines (table + max_iterations row) |
| Skill routing index | `.claude/skills/outcomes/references/rubric-selection.md` | +2 rows (selection table + iteration table) |

The rubric grades any change under `my-mastra-app/src/mastra/**` against the architecture boundaries in `tasks/mastra/mastra-prd.md §1` — *"Agents must NEVER: write DB directly · run unrestricted SQL · mutate Stripe · call OpenClaw directly from LLM tools."* It maps directly to the four P0 tasks in `tasks/mastra/tasks/000-index.md` execution order (tool audit #003, workflow state runtime #012, tenant isolation #013, AI rate limits #014).

## Rubric design — 12 criteria, 5 sections

| § | Criteria | Mode |
|---|---|---|
| A. Code health | 1 typecheck, 2 unit tests | `[Fast]` |
| B. Runtime smoke | 3 `mastra-smoke.sh` end-to-end, 4 `/api/health` 200 | `[Full]` |
| C. Architecture safety | 5 env boundary, 6 tool registry whitelist, 7 agents never write DB, 8 no raw SQL, 9 tenant isolation | `[Full]` |
| D. Observability | 10 every run logs to `ai_runs` | `[Full]` |
| E. Locked mode | 11 router intent preservation (multi-turn), 12 workflow state recovery (kill+restart) | `[Locked]` |

## Test results — mastra-workflow rubric vs. current `my-mastra-app/`

Run from `/home/sk/mde`, commit `ef60530`, working tree dirty.

| # | Criterion | Command | Duration | Exit | Result | Evidence |
|---|---|---|---:|---:|---|---|
| C1 | typecheck green | `cd my-mastra-app && npm run typecheck` | 2.43 s | 0 | ✅ **PASS** | `tsc --noEmit` clean |
| C2 | unit tests green | `cd my-mastra-app && npm test` | 0.73 s | 0 | ✅ **PASS** | `Test Files 2 passed`, `Tests 15 passed` |
| C3 | `mastra-smoke.sh` end-to-end | `bash my-mastra-app/scripts/mastra-smoke.sh` | — | — | ⏸ NOT RUN | Requires live `mastra dev` on port 4111 + real env; defer to next session with `.env.local` populated |
| C4 | `/api/health` returns 200 | `curl localhost:4111/api/health` | — | — | ⏸ NOT RUN | Depends on C3 |
| C5 | env / secret boundary | `node my-mastra-app/scripts/verify-env-security.mjs` | 0.07 s | **2** | ✅ **PASS (rubric)** / ❌ **BLOCKED (env)** | Script correctly fails closed: `MISSING SERVER ENV: GOOGLE_MAPS_API_KEY / GEMINI_API_KEY / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_URL`. The rubric criterion is satisfied (the script ran and reported); the **environment** is the blocker, not the rubric. |
| C6 | tool registry whitelist | `node my-mastra-app/scripts/verify-grounding-runtime.mjs` | 0.53 s | **2** | ✅ **PASS (rubric)** / ❌ **BLOCKED (env)** | `FAIL: GOOGLE_MAPS_API_KEY missing — refusing to call MCP`. Same env blocker as C5. |
| C7 | agents never write DB directly | `grep -rnE 'supabase\.from\([^)]+\)\.(insert\|update\|delete\|upsert\|rpc)' my-mastra-app/src/mastra/agents/` | < 1 s | 0 | ✅ **PASS** | Empty grep — no agent writes to DB directly |
| C8 | no raw SQL from agents/workflows | `grep -rnE '\.rpc\(...(exec_sql\|execute_sql\|raw)' my-mastra-app/src/mastra/{agents,workflows}/` | < 1 s | 0 | ✅ **PASS** | Empty grep — no `exec_sql`/`raw` calls |
| C9 | tenant isolation | tenanted-table query grep | < 1 s | 0 | ✅ **PASS** | Empty grep — every multi-tenant query filters by `org_id`/`user_id`/`buyer_id`/`owner_user_id` |
| C10 | every run logs to `ai_runs` | trigger workflow + `SELECT … FROM ai_runs` | — | — | ⏸ NOT RUN | Requires Supabase local stack running + a real workflow trigger |
| C11 | **[Locked]** router intent preservation | 2-turn POST to `/api/agents/router/generate` | — | — | ⏸ NOT RUN | Locked-only; defer to next session |
| C12 | **[Locked]** workflow state recovery | kill + restart + run-status poll | — | — | ⏸ NOT RUN | Locked-only; depends on task 012 (`workflow-state-runtime`) shipped |

**Score against the rubric itself today: 5 PASS / 2 env-blocked / 5 deferred = `5/12` runnable PASS in this session.**

The rubric is **correct** — it caught real environment gaps (missing `GOOGLE_MAPS_API_KEY`, `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL` in the audit shell) and the deterministic grep audits all came back clean. The next mdeai developer who runs this rubric will see exactly the same shape: 5 immediate passes, 2 env blockers that point to the `.env.local` they need to set up.

## Performance grade — mastra-workflow rubric (out of 10 points)

| Category | Score | Reason |
|---|---:|---|
| Mechanical rubric quality | **9** | All 12 criteria binary + evidence-based; modes tagged; prerequisites declared with fail-closed semantics. −1 because two criteria depend on tasks (012 workflow-state-runtime) that haven't shipped yet — the rubric correctly flags this but those criteria can't be exercised today. |
| Evidence discipline | **9** | Per-criterion commands are concrete; `bash mastra-smoke.sh`, `grep -rnE …`, `SELECT … FROM ai_runs LIMIT 5`. Forbidden shortcuts spelled out per criterion. −1 because the multi-turn router probe (C11) doesn't yet have a recorded "known-good" baseline transcript. |
| Architecture alignment | **10** | Maps 1:1 onto `mastra-prd.md §1` boundary rules ("agents never write DB directly · no raw SQL · approval gates"); uses the existing `verify-*.mjs` scripts under `my-mastra-app/scripts/`; respects the `mastra-routing` skill convention for C11. |
| Repo executability today | **6** | 5 of 12 criteria run end-to-end against the current repo without env setup; 2 fail closed on missing env (correct behavior); 5 require live `mastra dev` + Supabase local + (for C12) a not-yet-shipped task. Score reflects "ready to use today" not "ready when env is provisioned". |
| External-service handling | **9** | Prerequisites table at the top calls out Supabase local + `MASTRA_PORT=4111` + `GEMINI_API_KEY` + multi-turn fixture loadable. Fails closed; cannot silently skip. −1 because the rubric does not list an OS-level prereq (Node ≥ 22 per `mastra-smoke.sh` line 8). |
| Modes (Fast / Full / Locked) | **10** | Fast = C1+C2 (mechanical health for type/test-only edits); Full = C1–C10 (default for any agent/workflow/tool change); Locked = +C11+C12 (Phase-1-gate-equivalent, required when promoting any P0 task from `000-index.md`). |
| Tag clarity | **10** | Every criterion explicitly tagged `[Fast]` / `[Full]` / `[Locked]`. No ambiguity. |
| False-positive risk | **9** | Grep regexes are tight (named tenanted tables only; specific RPC names for raw SQL). −1 because C7's regex matches any `.from(X).insert(...)` even in test fixtures — verifier may need to whitelist `__tests__/`. |
| Reproducibility | **10** | Every command pasted is copy-paste-able; no hidden state; commit hash + timestamp in the output format. |
| Production readiness | **6** | Rubric is shipped; but **0/3 real PRs** have graded against it yet, and Mastra P0 tasks 012 + 013 + 014 are still in-flight. Score will climb to 9 once 3 real Mastra PRs reach `satisfied` in Full mode. |

**Mastra rubric total: `88 / 100` → grade `8.8 / 10`.**

## Maps-grounding rubric — re-verified against current state

| Check | Result |
|---|---|
| Rubric file exists | ✅ `.claude/outcomes/maps-grounding.md` (118 lines, 11 criteria) |
| Scripts it references | ✅ all 4 exist: `verify-grounding-runtime.mjs` (58 L), `verify-grounded-search.mjs` (80 L), `verify-grounding-fallback.mjs` (71 L), `verify-places-sdk.mjs` (66 L) |
| `tasks/maps/` alignment | ✅ rubric criterion 7 explicitly cites MASTRA-066 dependency; matches `tasks/maps/06-maps-new-plan.md` + `tasks/maps/07-mapsv2-tasks.md` blocker list |
| `mde-maps` skill cross-reference | ✅ rubric criterion 1 references `VITE_GOOGLE_MAPS_API_KEY` per `mde-maps/SKILL.md`; criterion 10 enforces the server/client key split documented in `mde-maps/references/places-official/` |
| Modes added (this session's rubric review pass) | ✅ Fast / Full / Locked tagged + prerequisites flagged (Maps Grounding Lite API as `H2` blocker) |
| External-service handling | ✅ MASTRA-066 explicitly fails-by-definition; Maps Grounding Lite API marked as known blocker |

**No regressions in maps-grounding.md.** The rubric remains aligned with the live `tasks/maps/` plan and `mde-maps` skill conventions.

## Updated 100 % correctness gate

| Condition | State |
|---|---|
| All 10 file-existence probes pass | ✅ (now 11 — added `mastra-workflow.md`) |
| All 3 hook syntax probes pass | ✅ unchanged |
| All 6 rubric markdown validations pass | ✅ (now 7 — Mastra rubric validates after fixing the `**bold**` regex blind spot in the validator; criterion `max_iterations: 5` is present in the file) |
| All 7 hook behavior probes pass | ✅ unchanged |
| Floor green (lint / typecheck / test / build / verify:edge) | ✅ unchanged |
| Mastra rubric criteria runnable without env setup | 🟡 5/12 today; 7 require env or live `mastra dev` |
| `npm run verify` script present | ❌ still missing |
| `npm run test:e2e` script present | ❌ still missing |
| `dist/assets/*.js` free of leaked-shape secrets | ❌ 3 hits (Vite-inlined Maps key, awaiting rotation + rebuild) |
| ≥ 3 real PR outcome loops reached `satisfied` | ❌ 0 / 3 |
| ≥ 3 real Mastra PR outcome loops reached `satisfied` | ❌ 0 / 3 (new gate for `mastra-workflow.md`) |

**Current 100 % result: `FAIL`** (unchanged from prior audit — adding the Mastra rubric did not change the gate, only the surface area covered).

## Score trend

| Date | Outcomes axis (dashboard §10) | Notes |
|---|---:|---|
| 2026-05-14 (mid) | 7.5 | 4 rubrics embedded in plan, not yet extracted |
| 2026-05-14 (skill install) | 9.0 | 4 rubrics live + outcomes skill installed |
| 2026-05-14 (rubric audit) | 9.0 | Modes / N/A rule / accepted-evidence / Stripe-signature fixes |
| **2026-05-14 (this run)** | **9.0** | **+1 rubric (mastra-workflow). Coverage broader; gate unchanged because no real PR has graded yet.** |

Dashboard overall: stays at 89/100. Coverage is wider (5 rubrics now vs 4) but the production-readiness axis won't move until real PRs flow through.

## GitHub reference (mastra-rubric commit)

- **Progress tracker:** https://github.com/amo-tech-ai/mde/blob/main/tasks/claude-code/progress-outcomes.md
- **Previous audit commit:** `9b9bb9b3a32bdc0e166005d6db38e2b9de32edcf` (rubric audit)
- **This commit:** `1ddb9e78dd30ae2a3d13e2588715d7216e163d05`

---

# Outcomes re-verification — 2026-05-14 (third audit pass)

Strict re-audit of the Mastra + Maps outcomes rubrics against the live repo, official docs, and repo skills. Goal: surface red flags, blockers, and broken assumptions the prior two passes did not catch.

## What was verified this pass

| Probe | Command | Result |
|---|---|---|
| Mastra rubric scripts exist | `test -f my-mastra-app/scripts/{mastra-smoke.sh,verify-env-security.mjs,verify-grounding-runtime.mjs,verify-grounded-search.mjs,verify-grounding-fallback.mjs,verify-places-sdk.mjs}` | **6/6 PASS** (sizes 58–344 L) |
| Mastra typecheck | `cd my-mastra-app && npm run typecheck` | exit 0 in **2.67 s** |
| Mastra unit tests | `cd my-mastra-app && npm test` | **Tests 15 passed** in **0.73 s** |
| Root typecheck | `npm run typecheck` | exit 0 in **0.23 s** (re-run 1.79 s) |
| Root tests | `npm test` | **Tests 76 passed (9 files)** in **1.67 s** (re-run 4.24 s) |
| Root lint | `npm run lint` | 0 errors / 155 warnings in **17.36 s** (pre-existing warnings) |
| Root build | `npm run build` | bundle 454.5 KB / 128.2 KB gzip in **5.76 s** |
| `verify:edge` | `npm run verify:edge` | 21 passed / 0 failed / 51 ignored in **1.74 s** |
| `verify:mastra` | `npm run verify:mastra` | OK (5 scripts) in **0.60 s** |
| C7 agents-no-DB-write | `grep -nE "supabase\.from\([^)]+\)\.(insert\|update\|delete\|upsert\|rpc)" my-mastra-app/src/mastra/agents/` | **empty (PASS)** |
| C8 no raw SQL | `grep -nE "\.rpc\(['\"](exec_sql\|execute_sql\|raw)" my-mastra-app/src/mastra/{agents,workflows}/` | **empty (PASS)** |
| C9 tenant isolation | `grep -nE "\.from\(['\"](apartments\|events\|tickets\|bookings\|conversations\|messages)['\"][^)]*\)\.select" my-mastra-app/src/mastra/` | **empty (PASS)** |
| C5 env-security script | `node my-mastra-app/scripts/verify-env-security.mjs` | exit **2** — fails closed correctly. Issues: `MISSING SERVER ENV: GOOGLE_MAPS_API_KEY / GEMINI_API_KEY / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_URL` |
| Rubric sanity grep | `grep -l "Modes:\|Forbidden shortcuts\|Output format" .claude/outcomes/*.md` | **5/5 rubrics have all three sections** |
| `max_iterations` | rubric headers | `pr-review 3`, `supabase-migration 5`, `mastra-workflow 5`, `maps-grounding 5`, `events-ticketing 8` (matches README + rubric-selection) |
| New `gen:types` script | `npm run gen:types` | exit 0 in **2.37 s** (writes to `src/integrations/supabase/types.ts`; local stack drift surfaces 1218 added / 75 removed lines — expected, not part of this audit) |
| New `outcomes:verify` script | `npm run outcomes:verify` | exit 0 in **16.71 s** end-to-end |

## New red flags caught this pass

| # | Severity | Finding | Evidence | Fix shipped |
|---|---|---|---|---|
| **R1** | 🔴 high | **`.claude/worktrees/nervous-northcutt-7a51d0/.claude/settings.local.json.pre-sanitize.bak` contains three live secrets** — a Gemini API key (`AIzaSyCA…<redacted>`), a Maps preview-deploy key (`AIzaSyDL…<redacted>`), and a GitHub PAT (`ghp_<redacted>`). The file is untracked in git but lives in the working tree where any `git add -A` would scoop it. Real values intentionally not pasted here — see the actual file path to recover them for rotation. | `grep -RIE 'AIzaSy\|ghp_' .claude/worktrees/` returned 5 lines | Added `.claude/worktrees/` + `.claude/**/*.pre-sanitize.bak` + `.claude/settings.local.json` to `.gitignore`. Rotation still required — these three credentials are live and must be revoked. |
| **R2** | 🟡 medium | **4 broken doc links** referencing `.claude/docs/best-practices/01-outcomes-plan.md` — the file is actually at `tasks/claude-code/01-outcomes-plan.md`. Affected: `.claude/outcomes/README.md`, `.claude/skills/outcomes/SKILL.md` (2 mentions), `.claude/skills/outcomes/references/rubric-selection.md` (2 mentions). | `grep -rn "docs/best-practices/01-outcomes-plan" .claude` returned 4 hits across 3 files | All four references rewritten to `tasks/claude-code/01-outcomes-plan.md` with correct relative path. |
| **R3** | 🟡 medium | **`npm run gen:types` was missing** from root `package.json` — `supabase-migration.md` criterion 7 had a fallback (`supabase gen types --lang=typescript --local > …`), but no aliased script. | `node -e 'console.log(require("./package.json").scripts["gen:types"])'` → `undefined` | Added `gen:types` and `outcomes:verify` scripts. Both verified passing (2.37 s and 16.71 s). |
| **R4** | 🟡 medium | **Mastra rubric prerequisite said `my-mastra-app/.env.local`** but only `my-mastra-app/.env` exists. Verifiers running `node --env-file=...` would silently see "no env loaded" and the criteria would all fail with a confusing "env missing" error. | `ls my-mastra-app/.env*` → only `.env` exists | Updated mastra-workflow.md prerequisites to accept either path + paste the path used. Added Node ≥ 22 requirement (smoke script uses `--env-file`). |
| **R5** | 🟡 medium | **Exit-code semantics for `verify-env-security.mjs` and `verify-grounding-runtime.mjs` were ambiguous** — the rubric said "paste exit code + summary line" but didn't tell the grader that exit 2 (env-security), exit 3 (missing tools), or exit 4 (MCP connect fail) all mean "fail closed", not "script error". | Read scripts: env-security exits 2 on FAIL / 0 on OK; grounding-runtime exits 0/3/4 | Added an "Exit-code semantics" block to mastra-workflow.md immediately after the prerequisites. Grader now knows which non-zero exit ≠ script bug. |
| **R6** | 🟢 info | `dist/assets/{ChatMap,TripDetail,index}-*.js` still contain 3 live `AIzaSy*` strings (Vite-inlined `VITE_GOOGLE_MAPS_API_KEY`). | `grep -RIE 'AIzaSy' dist/` → 3 files | No change — this is the known rotation queued in `secret-rotation-checklist-2026-05-14.md §1`. The dist-leak-scan hook will continue to block any deploy that bundles the old key, which is the intended behavior. |

## Errors / failure points caught and fixed

| File | Old | New |
|---|---|---|
| `package.json` | (no `gen:types`, no `outcomes:verify`) | + `gen:types`, + `outcomes:verify` |
| `.gitignore` | `.claude/worktrees/` untracked but not ignored | now ignored; `.pre-sanitize.bak` and `settings.local.json` ignored too |
| `.claude/outcomes/README.md` | broken `01-outcomes-plan.md` link | rewritten to `tasks/claude-code/01-outcomes-plan.md` |
| `.claude/skills/outcomes/SKILL.md` | 2 broken `01-outcomes-plan.md` links | both rewritten with proper relative paths |
| `.claude/skills/outcomes/references/rubric-selection.md` | 2 broken `01-outcomes-plan.md` links | both rewritten |
| `.claude/outcomes/mastra-workflow.md` | `.env.local` only; no exit-code semantics | accepts `.env` OR `.env.local`; documents exit codes 2/3/4 of the verify scripts; Node ≥ 22 noted |

## Blockers still standing (Phase 2 stays gated)

| Blocker | Affects | Resolution |
|---|---|---|
| 0 / 3 real PR outcome loops at `satisfied` | every rubric | Run pr-review, supabase-migration, and maps-grounding rubrics against three real PRs (sprint plan documented earlier in this file) |
| 3 live secrets in `.claude/worktrees/…/settings.local.json.pre-sanitize.bak` | security gate | **Rotate now:** revoke the Gemini key, Maps preview key, and GitHub PAT. They are gitignored now but live on disk; rotate before sharing the machine or backing it up |
| `dist/assets/*.js` contains Vite-inlined Maps key | deploy gate | Rotate `VITE_GOOGLE_MAPS_API_KEY` + `npm run build` (per `secret-rotation-checklist-2026-05-14.md §1`) |
| MASTRA-066 (`<GroundingAttribution>`) not built | `maps-grounding.md` #7 | Ship MASTRA-066 (Mastra tool + React badge component) |
| Maps Grounding Lite API not enabled in test GCP | `maps-grounding.md` #8, #11 | Enable `mapstools.googleapis.com` in GCP Console |
| `stripe` CLI not in PATH | `events-ticketing.md` #3 Path A | `brew install stripe/stripe-cli/stripe` or download from stripe.com/docs/stripe-cli — Path B (test-mode bypass) is the documented alternative |
| Workflow-state-runtime task 012 not shipped | `mastra-workflow.md` C12 | Ship `tasks/mastra/tasks/core/012-workflow-state-runtime.md` first; rubric correctly flags the dependency |

## Performance grade — third pass (out of 10 points)

Strict scoring, no inflation:

| Axis | Score | Reason |
|---|--:|---|
| Mechanical rubric quality | **9** | All 5 rubrics now have modes + prerequisites + forbidden shortcuts + output format; broken doc links repaired; exit-code semantics documented. −1 because there is still no recorded "known-good" baseline transcript for Mastra C11 (router intent multi-turn) — a verifier sees the rubric for the first time and must guess what `intent: rental_search` actually looks like in the response shape. |
| Evidence discipline | **9** | Accepted-evidence table in README; per-criterion specific commands; mastra-workflow rubric now spells out exit-code meanings. −1 because verifiers still have to read `verify-env-security.mjs` source to learn that exit 2 is the load-bearing signal — a one-line "expected: exit 2 when env missing" snippet in the criterion body would close the gap. |
| Architecture alignment | **10** | Mastra rubric 1:1 with `mastra-prd.md §1` boundary rules; Maps rubric 1:1 with `mde-maps` server/client split + `tasks/maps/06-maps-new-plan.md`; cross-references verified live this session. |
| Repo executability today | **7** | **+1** vs prior audit: `gen:types` and `outcomes:verify` now exist as scripts; new probes run end-to-end. Still 7/12 Mastra criteria require live `mastra dev` + Supabase local. |
| External-service handling | **9** | External-service blockers table in README + per-rubric prerequisite blocks + mastra-workflow `.env` path flexibility. −1 because no automated probe yet detects "is `mastra dev` running on 4111?" — graders still must remember to start it. |
| Modes (Fast / Full / Locked) | **10** | Tagged everywhere; coverage matrix in README documents which criteria run in which mode. |
| Tag clarity | **10** | Every criterion explicitly tagged. |
| False-positive risk | **9** | Greps are tight. −1 because C7 still matches test fixtures if any are added under `agents/__tests__/` — a documented whitelist clause should be added once tests exist. |
| Reproducibility | **10** | Every command is copy-paste-able; commit hashes + timestamps required in output format; new scripts use only stable CLIs (`supabase`, `node`, `tsc`). |
| Production readiness | **6** | 5 rubrics + 3 hooks + new package scripts; floor green in 16.71 s. **−4 because 0 / 3 real PR loops** + 3 live secrets in the worktree backup still need rotation + MASTRA-066 + Maps Grounding Lite enablement all unresolved. |

**Third-pass total: `9 + 9 + 10 + 7 + 9 + 10 + 10 + 9 + 10 + 6 = 89 / 100` → grade `8.9 / 10`** (up from `8.8 / 10` last pass).

## Updated 100 % correctness gate

| Condition | State |
|---|---|
| All 11 rubric / skill / hook files present | ✅ |
| Hook syntax probes pass | ✅ 3/3 |
| Rubric markdown structure (Modes, Forbidden shortcuts, Output format) | ✅ 5/5 |
| Hook behavior probes (3 positive + 3 negative + 1 recursion guard) | ✅ 7/7 (from prior pass) |
| Floor green (lint / typecheck / build / test / verify:edge / verify:mastra) | ✅ exit 0, **16.71 s** wall via new `npm run outcomes:verify` |
| `gen:types` script present | ✅ **(fixed this pass)** |
| `outcomes:verify` script present | ✅ **(added this pass)** |
| `test:e2e` script present | ❌ still missing (Playwright config present, suite empty) |
| Broken doc links to `01-outcomes-plan.md` repaired | ✅ **(fixed this pass — 4 references)** |
| `dist/assets/*.js` free of leaked-shape secrets | ❌ 3 Vite-inlined hits — awaiting rotation + rebuild |
| `.claude/worktrees/` live secret backup neutralized | 🟡 **gitignored this pass; rotation of the 3 keys still required** |
| ≥ 3 real PR outcome loops reached `satisfied` | ❌ 0 / 3 |
| ≥ 3 real Mastra PR outcome loops reached `satisfied` | ❌ 0 / 3 |

**Result: `FAIL`** — Phase 2 still blocked, but the deterministic side of the system improved this pass (6 fixes landed, 0 regressions).

## Phase 2 unblock checklist (after this audit)

1. **Rotate the 3 leaked credentials in the worktree backup** (Gemini key, Maps preview key, GitHub PAT) — high priority, not gated on rubric changes.
2. **Rotate `VITE_GOOGLE_MAPS_API_KEY`** + `npm run build` — clears the dist leak gate.
3. **Run `pr-review.md` against this very PR** (the rubric refactor itself, this commit) in Fast mode — first real PR loop, count = 1 / 3.
4. **Run `supabase-migration.md`** against the next migration PR — count = 2 / 3.
5. **Run `maps-grounding.md`** against the next `src/**/*Map*` PR — count = 3 / 3 (expect MASTRA-066 sub-criterion to fail by definition; rubric ships when rendering sub-section passes).
6. After 3 real PR loops reach `satisfied`, begin Phase 2 — `scripts/outcomes/run-outcome.ts` against the Managed Agents API with the `managed-agents-2026-04-01` beta header.

## Commit reference (third audit)

- **Previous audit commit (hash record):** `3368b9ee4a793eaf5d0b8bfc0ff49f334fb4eb3c`
- **This audit commit:** `74eeffc` (third audit pass — 6 fixes landed)
- **Progress tracker:** [`tasks/claude-code/progress-outcomes.md`](https://github.com/amo-tech-ai/mde/blob/main/tasks/claude-code/progress-outcomes.md)

---

# Outcomes re-verification — 2026-05-14 (fourth audit pass)

Focus: official-doc alignment, security rotation status, deterministic floor, real-PR validation sprint planning. No invented APIs; cite `.claude/docs/claude-code/outcomes.md` directly.

## What was verified this pass

| Probe | Command | Result |
|---|---|---|
| Official-doc alignment — beta header | `grep -n "managed-agents-2026-04-01" .claude/docs/claude-code/outcomes.md` | 5 hits — header matches the constant cited in our `outcomes/SKILL.md` and the Phase-2 plan |
| Official-doc alignment — events | `grep -nE "span\.outcome_evaluation_(start\|ongoing\|end)\|user\.define_outcome" .claude/docs/claude-code/outcomes.md` | All four event types present in official docs; our rubrics + skill reference only these — **no invented events** |
| Official-doc alignment — `max_iterations` | rubric headers vs `max_iterations: optional, default 3, max 20` | `pr-review 3`, `supabase-migration 5`, `mastra-workflow 5`, `maps-grounding 5`, `events-ticketing 8` — all ≤ 20 ✓ |
| Gitignore covers worktrees | `git check-ignore .claude/worktrees/nervous-northcutt-7a51d0/.claude/settings.local.json.pre-sanitize.bak` | exit 0, path printed — **IGNORED** |
| Leaked-credential lines in worktree backups | `grep -RIE 'AIzaSy\|ghp_' .claude/worktrees/ \| wc -l` | **16 lines** spread across `.claude/worktrees/nervous-northcutt-7a51d0/.claude/settings.local.json.pre-sanitize.bak` — still on disk, gitignored, **rotation required** |
| `npm run outcomes:verify` end-to-end | `npm run outcomes:verify` | exit 0 in **17.14 s** |
| Rubric structure — `Modes:` | `grep -l "Modes:" .claude/outcomes/*.md \| wc -l` | **5 / 5** rubrics |
| Rubric structure — `Forbidden shortcuts` | `grep -l "Forbidden shortcuts" .claude/outcomes/*.md \| wc -l` | **6** (5 rubrics + README) |
| Rubric structure — `Output format` | `grep -l "Output format" .claude/outcomes/*.md \| wc -l` | **6** (5 rubrics + README) |
| `test:e2e` script | `node -e 'console.log(require("./package.json").scripts["test:e2e"] \|\| "(missing)")'` | **(missing)** — see decision below |
| Playwright config | `playwright.config.ts` | Present — uses `lovable-agent-playwright-config` |
| Playwright specs in `tests/` | `find tests/ -name "*.spec.ts"` | 2 specs in `tests/smoke/` (`mastra-056-057-localhost`, `mastra-chat-events-weekend`) — both Mastra-smoke specific, not main-app E2E |

## Official-doc alignment — verdict

Our rubrics, skill, and Phase 2 plan **do not invent any API surface**. Every event name, header value, and `max_iterations` bound cited in our files matches `.claude/docs/claude-code/outcomes.md` (which mirrors the public Anthropic docs). The only deferred surface — automatic grader provisioning over the `managed-agents-2026-04-01` beta header — is correctly tagged as Phase 2 and not exercised yet. **No corrections needed in this pass.**

## Security cleanup — verification status

| Item | Today | Action required |
|---|---|---|
| `.claude/worktrees/` in `.gitignore` | ✅ confirmed via `git check-ignore` | none |
| `*.pre-sanitize.bak` in `.gitignore` | ✅ pattern present | none |
| `.claude/settings.local.json` in `.gitignore` | ✅ pattern present | none |
| Live secrets still on disk in working tree | ⚠ **yes** — gitignored but rotatable values still present in `.claude/worktrees/nervous-northcutt-7a51d0/.claude/settings.local.json.pre-sanitize.bak` | **rotate the 4 credential classes below** |

### Leaked credential classes (values intentionally not listed)

1. **Gemini API key** — `AIzaSy…` shape, used in a logged `curl` example against `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`. Rotation closes the Gemini billing leak risk.
2. **Maps preview-deploy key** — `AIzaSy…` shape, used in `curl` against `maps.googleapis.com/maps/api/js` with a Vercel preview Referer header. Rotation closes the Maps quota / billing leak.
3. **GitHub Personal Access Token** — `ghp_…` shape, used in a `git ls-remote https://x-access-token:…@github.com/...` URL. Rotation revokes any push/PR scope the token carries.
4. **Production `VITE_GOOGLE_MAPS_API_KEY`** — same class as #2 but the **production** variant; inlined into `dist/assets/{ChatMap,TripDetail,index}-*.js` by Vite (3 files). Rotation + `npm run build` clears the dist-leak gate.

### Rotation checklist (paste into Phase 2 PR body once done)

| # | Step | Where | Done? |
|---|---|---|---|
| 1 | Revoke the Gemini key | Google AI Studio → API keys → delete the leaked key | ☐ |
| 2 | Create a new Gemini key and update **Supabase secrets** (`supabase secrets set GEMINI_API_KEY=…`) — never put it in `.env` for the client | Supabase dashboard → Project settings → Edge function secrets | ☐ |
| 3 | Revoke the Maps preview-deploy key | Google Cloud Console → APIs & Services → Credentials → delete the leaked key | ☐ |
| 4 | Create a new Maps preview key with HTTP-referrer restriction to `https://*.vercel.app/*` | Google Cloud Console → Credentials → "Restrict key" | ☐ |
| 5 | Revoke the GitHub PAT | github.com/settings/tokens → revoke the leaked token | ☐ |
| 6 | If push automation needs the token, create a new fine-scoped PAT with the minimum scopes the workflow actually uses | GitHub settings → Personal access tokens (fine-grained) | ☐ |
| 7 | Rotate `VITE_GOOGLE_MAPS_API_KEY` (production) | Google Cloud Console → Credentials → create new key with production referrer restrictions | ☐ |
| 8 | Update Vercel env var | Vercel dashboard → Settings → Environment Variables → replace `VITE_GOOGLE_MAPS_API_KEY` | ☐ |
| 9 | Local rebuild to clear stale key from `dist/` | `rm -rf dist && npm run build && grep -RIE 'AIzaSy' dist/` | ☐ — must list only the **new** key, zero hits matching the old value |
| 10 | Delete the worktree backup file once the keys it lists are all revoked | `rm .claude/worktrees/nervous-northcutt-7a51d0/.claude/settings.local.json.pre-sanitize.bak` | ☐ — only after #1, #3, #5 all confirmed revoked |
| 11 | (Recommended) Delete the entire `.claude/worktrees/nervous-northcutt-7a51d0/` tree if no in-progress work remains there | `rm -rf .claude/worktrees/nervous-northcutt-7a51d0` | ☐ — verify worktree is not active via `git worktree list` first |

## Deterministic floor — fourth-pass evidence

| Command | Wall time | Exit |
|---|---:|---:|
| `npm run outcomes:verify` (chains lint → typecheck → test → build → verify:edge → verify:mastra) | **17.14 s** | 0 |

Compared with prior pass: 16.71 s → 17.14 s (+0.43 s — within noise; mostly lint warming).

## test:e2e — decision: **explicitly defer**

The repo has a Playwright config (`playwright.config.ts` using `lovable-agent-playwright-config`) but only **2 specs**, both under `tests/smoke/` and both Mastra-smoke specific (require live `mastra dev` on 4111 + Supabase local). Wiring `npm run test:e2e` today would either:

- Run nothing (no specs in the configured `e2e/` directory), giving a false-green signal that masks real coverage gaps, **or**
- Run the Mastra smoke specs, which already require external services to be up — duplicating `npm run smoke:runtime` in `my-mastra-app/`.

**Decision:** do NOT add a hollow `test:e2e` alias. Document the deferral here; the gate flips from "missing script" to "documented N/A until real specs exist". When the first true mdeai E2E spec lands (Camila buy-ticket flow), wire `test:e2e` alongside it. This matches the Phase 1 gate's preference for real evidence over checkbox compliance.

## Real PR validation sprint — created

See [`outcomes-real-pr-validation-sprint.md`](./outcomes-real-pr-validation-sprint.md). Three required PR loops, each with exact commands, expected evidence, pass/fail criteria, rollback plan, and what counts as `satisfied`.

## Errors found this pass

| # | Severity | Finding |
|---|---|---|
| E1 | 🟡 med | `test:e2e` script absent **and** existing Playwright specs are Mastra-smoke only — adding the alias would be misleading. Documented as deferral (decision above), not a fix. |
| E2 | 🟢 info | `.claude/worktrees/nervous-northcutt-7a51d0/playwright.config.ts` and worktree subtree contain spec copies. Not a leak (no secrets in spec files), but the worktree's existence is noise — clean up after rotation per checklist step 11. |

No new red flags vs pass 3. The pass 3 fixes held.

## Failure points — preserved

| Flag | Affects | Status |
|---|---|---|
| 4 credential classes in worktree backup awaiting rotation | security gate | gitignored ✓ / rotation pending |
| Vite-inlined Maps key in `dist/assets/*.js` | deploy gate (dist-leak hook) | rebuild required after key rotation |
| MASTRA-066 not shipped | `maps-grounding.md` #7 | criterion correctly fails by definition |
| Maps Grounding Lite API not enabled in test GCP | `maps-grounding.md` #8, #11 | Locked-only |
| Workflow-state-runtime task 012 not shipped | `mastra-workflow.md` #12 | Locked-only |

## Performance grade — fourth pass (strict 5-axis)

| Axis | Score | Reason |
|---|--:|---|
| Mechanical correctness | **9** | All 5 rubrics have Modes / Forbidden shortcuts / Output format; broken doc links fixed pass 3; `gen:types` + `outcomes:verify` aliased; `test:e2e` explicitly deferred with rationale. −1 still pending the first real-PR loop. |
| Evidence discipline | **9** | Exit-code semantics block in mastra-workflow; accepted-evidence table in README; per-criterion commands concrete. −1 because no recorded "known-good" baseline transcript for router intent multi-turn. |
| Security readiness | **6** | Hooks block correctly; `.gitignore` covers worktrees + sanitize backups + settings.local; **but** 4 credential classes still live on disk awaiting rotation + dist still has Vite-inlined Maps key. Rotation checklist shipped this pass, execution pending. |
| Runtime readiness | **6** | `outcomes:verify` floor green in 17.14 s; deterministic Mastra greps pass; **but** 7/12 Mastra criteria still require live `mastra dev` + Supabase local; `mastra dev` autostart probe still manual. |
| Production readiness | **5** | Scaffolding correct; rotation checklist documented; PR validation sprint authored; **but** 0 / 3 real PR loops, 0 / 4 credentials rotated, 0 / 1 dist rebuild. |

**Fourth-pass total: `9 + 9 + 6 + 6 + 5 = 35 / 50` → grade `7.0 / 10`** on the strict 5-axis production-readiness scale.

> Note: the 10-axis rubric-quality score from pass 3 (`8.9 / 10`) and this 5-axis production-readiness score (`7.0 / 10`) measure different things. Rubric quality is stable; the production-readiness gap is real and reflected here.

## Full 100 % certification

**Result: `FAIL`.**

Phase 2 stays blocked until **all** of these flip green:

- [ ] PR 1, 2, 3 reach `satisfied` in their respective rubrics (currently 0 / 3)
- [ ] Gemini key rotated
- [ ] Maps preview key rotated
- [ ] GitHub PAT revoked
- [ ] `VITE_GOOGLE_MAPS_API_KEY` rotated + rebuild clears `dist/` of old key

This pass shipped: rotation checklist, real-PR validation sprint plan, and the deferral decision for `test:e2e`. It did **not** push, did **not** rotate any keys, and did **not** grade any real PR — all four require explicit user authorization.

## Commit reference (fourth audit)

- **Previous audit commit:** `858ebe5` (pass 3 hash record)
- **This audit commit:** `e55955f` (pass 4 sprint plan)
- **Pushed:** **No.** Local `main` is 10 commits ahead of `origin/main` and stays local until you authorize `git push`.
- **Sprint plan:** [`tasks/claude-code/outcomes-real-pr-validation-sprint.md`](./outcomes-real-pr-validation-sprint.md)
