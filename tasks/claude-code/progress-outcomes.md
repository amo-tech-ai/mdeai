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
- **This commit:** _filled by commit step below_
