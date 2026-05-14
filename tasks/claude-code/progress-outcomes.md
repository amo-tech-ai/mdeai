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
- **Current commit:** _filled by commit step at the end of this session_

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
