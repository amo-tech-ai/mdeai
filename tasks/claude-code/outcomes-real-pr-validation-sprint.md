---
title: Outcomes — real-PR validation sprint
status: Not Started
priority: P0 (Phase 2 unblock)
owner: mde-task-lifecycle + outcomes
last_updated: 2026-05-14
companions:
  - tasks/claude-code/progress-outcomes.md
  - tasks/claude-code/01-outcomes-plan.md
  - .claude/outcomes/README.md
  - .claude/skills/outcomes/SKILL.md
  - .claude/docs/claude-code/outcomes.md
---

# Outcomes — real-PR validation sprint

> The Outcomes scaffolding is correct, the hooks block the right things, and the floor is green in 17 s. **None of that proves the rubrics catch real bugs.** This sprint runs three real mdeai PRs through the loop. After all three reach `satisfied`, Phase 2 (Managed Agents API runner) is unblocked. Until then, no `100 %` claim is warranted.

## Sprint exit criteria

- **3 real PR outcome loops at `satisfied`** (count today: **0 / 3**)
- One per rubric class — PR review, Supabase migration, Maps/Mastra runtime
- Every loop's transcript pasted into `tasks/claude-code/progress-outcomes.md` §"Run log"
- Each PR's `satisfied` verdict reached **without skipping a criterion as N/A** unless the diff genuinely doesn't exercise it (silence ≠ exemption)

## Prerequisites before starting the sprint

| Item | Status | Action |
|---|---|---|
| `npm run outcomes:verify` exit 0 in < 30 s | ✅ 17.14 s | Already shipped (commit `74eeffc`) |
| `.claude/worktrees/` + `*.pre-sanitize.bak` gitignored | ✅ | Shipped (commit `74eeffc`) |
| Leaked credentials in worktree backup **rotated** | ❌ | See §"Security rotation checklist" below |
| `dist/assets/*.js` Maps key rotation | ❌ | `secret-rotation-checklist-2026-05-14.md §1` |
| Hooks tested live (attribution / RLS / dist-leak) | ✅ | 7/7 from prior audit |
| Verifier prompt template ready | ✅ | `outcomes/README.md §"How to use today"` |

PRs 2 and 3 can proceed in parallel with the key rotations (they don't touch Stripe / Gemini), but the sprint cannot exit `satisfied` until the rotations land.

---

## PR 1 — pr-review rubric (Fast mode)

**Goal:** First real `satisfied`. Stress-test the rubric on a low-risk PR — the rubric cleanup PR itself.

| Field | Value |
|---|---|
| Rubric | `.claude/outcomes/pr-review.md` |
| Mode | **Fast** (criteria 1, 2, 4 only — build / lint / typecheck) |
| Target | The current cleanup branch (rubric fixes, `gen:types`, `outcomes:verify`, `.gitignore` worktrees). Today HEAD is `858ebe5`, 8 ahead of `origin/main`. |
| max_iterations | 3 |

### Commands

```bash
# 1. Confirm the branch is clean and points at the expected diff
git status --short
git log --oneline origin/main..HEAD

# 2. Run the Fast subset
npm run build 2>&1 | tail -5
npm run lint 2>&1 | tail -5
npm run typecheck 2>&1 | tail -3

# 3. Diff-scoped secret scan (criterion 5 still runs in Fast for safety)
git diff origin/main...HEAD | grep -nE "(sk_live|sk_test_[A-Za-z0-9]{20,}|whsec_|ghp_[A-Za-z0-9]{30,}|AIzaSy[A-Za-z0-9_-]{30,}|eyJ[A-Za-z0-9_-]{20,}\.eyJ|SUPABASE_SERVICE_ROLE|Bearer [A-Za-z0-9._-]{20,})" || echo "(empty — OK)"

# 4. Scope match
git diff --name-only origin/main...HEAD
```

### Expected evidence

| Criterion | Acceptable evidence |
|---|---|
| 1. Build green | Last 5 lines including `✓ built in <Ns>` and dist sizes |
| 2. Lint green | `✖ 0 problems` line OR `0 errors, N warnings` (warnings OK) |
| 4. Typecheck green | `tsc --noEmit` exit code 0 + empty stderr |
| 5. No secrets in diff | Empty grep output OR a documented justification |
| 8. Scope match | Every changed file maps to "rubric / progress / package.json / gitignore" |

### Pass/fail criteria

`satisfied` requires criteria 1, 2, 4, 5, 8 all green. Criterion 3 (tests count) is `Full` only; skip with `N/A — Fast mode`.

### Rollback

This PR is doc + script-alias only. Rollback = `git revert <merge-sha>`. No DB / no runtime.

### What counts as `satisfied`

Single iteration, all five Fast criteria pasted with concrete evidence (not "looks fine"). Verifier writes:

```
Mode: Fast. Pass 5/5. Build, lint, typecheck, secret-scan, scope-match all green.
```

---

## PR 2 — supabase-migration rubric (Full mode)

**Goal:** Prove the DB / RLS / index / types path.

| Field | Value |
|---|---|
| Rubric | `.claude/outcomes/supabase-migration.md` |
| Mode | **Full** (criteria 1–10) |
| Target | Next real migration PR (candidate: any new `supabase/migrations/*.sql` from Phase 1 or Mastra task list) |
| max_iterations | 5 |

### Commands

```bash
# 1. Local stack
supabase status || supabase start

# 2. Clean apply on a fresh DB
supabase db reset 2>&1 | tail -10
echo "exit=$?"

# 3. RLS proof for every new table T
psql "$(supabase status -o env | grep DB_URL | cut -d= -f2)" -c "
  SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('<new_table_1>', '<new_table_2>');
"

# 4. Policy proof
psql "$(...)" -c "
  SELECT polname, cmd, qual FROM pg_policies WHERE tablename = '<new_table>';
"

# 5. Subquery pattern check
grep -nP "auth\.uid\(\)" supabase/migrations/<new-file>.sql | grep -vP "\(select auth\.uid\(\)\)" || echo "(empty — OK)"

# 6. Index proof
psql "$(...)" -c "
  SELECT indexname, indexdef FROM pg_indexes WHERE tablename = '<new_table>';
"

# 7. Types regen — now uses the new npm alias
npm run gen:types 2>&1 | tail -3
git diff --stat src/integrations/supabase/types.ts

# 8. Edge functions still compile
npm run verify:edge 2>&1 | tail -5
```

### Expected evidence

| Criterion | Evidence |
|---|---|
| 1. Clean apply | `supabase db reset` exit 0, last 10 lines |
| 2. No destructive SQL | `grep -nE "DROP TABLE\|DROP COLUMN\|TRUNCATE"` returns empty OR PR body has "Destructive SQL approved" |
| 3. Rollback note | `## Rollback` section in PR body |
| 4. RLS on every new table | `relrowsecurity = t` + ≥ 1 policy per access verb |
| 5. `(select auth.uid())` | Empty grep |
| 6. Indexes | One `indexdef` row per FK column |
| 7. Types regen | `gen:types` exit 0 + non-empty diff for new tables |
| 8. Edge fn compile | `verify:edge` exit 0 |
| 9. No secrets in migration | Empty grep over `sk_live\|whsec_\|SERVICE_ROLE` |
| 10. Production-safety line | `Safe to apply to production: YES / NO / NEEDS_REVIEW — <reason>` |

### Pass/fail criteria

`satisfied` after all 10 criteria pasted. Acceptable to fail criterion 7 with `N/A — migration adds no new tables or columns`.

### Rollback

If a migration breaks RLS or pushes a destructive SQL line:

```bash
git revert <merge-sha>
supabase db reset             # re-apply the now-reverted history locally
```

In production: `supabase migration down` on the offending file, then redeploy.

### What counts as `satisfied`

Verifier writes:

```
Mode: Full. Pass 10/10. Migration applies clean, RLS on new tables, indexes present, types regenerated, edge fns compile.
```

---

## PR 3 — maps-grounding OR mastra-workflow rubric (Full mode)

**Goal:** Prove the runtime / evidence-blocker path.

> **Pick one** based on which PR lands first. Run the other against the second qualifying PR.

### Option A — maps-grounding (default if a `src/**/*Map*.tsx` PR lands first)

| Field | Value |
|---|---|
| Rubric | `.claude/outcomes/maps-grounding.md` |
| Mode | **Full** (criteria A1–A6 rendering + B7–B10 grounding) |
| Target | Next `src/**/*Map*` or grounding-client diff |
| max_iterations | 5 |

#### Commands

```bash
# A1. APIProvider key check
grep -n "APIProvider" src/components/<changed-Map-file>.tsx

# A2, A3, A4, A5, A6 — preview + screenshots
# (Use Claude Preview MCP or chrome-devtools-cli)
# Screenshot paths:
#   ./outcomes-evidence/<date>-rentals-map-1440x900.png
#   ./outcomes-evidence/<date>-rentals-map-375x812.png
#   ./outcomes-evidence/<date>-rentals-drawer-375x812.png

# B7. <GroundingAttribution> badge (FAILS by definition until MASTRA-066 ships)
# Document explicitly: "MASTRA-066 not built — criterion fails until MASTRA-066 ships."

# B8. Fallback chain logs
node --env-file=my-mastra-app/.env my-mastra-app/scripts/verify-grounding-fallback.mjs

# B9. Tool whitelist
node --env-file=my-mastra-app/.env my-mastra-app/scripts/verify-grounding-runtime.mjs

# B10. No server-side key in dist
npm run build
grep -RIE "GOOGLE_MAPS_API_KEY=" dist/assets/*.js || echo "(no server-side key in dist — OK)"
```

#### Expected evidence

- A2–A6: 3+ screenshots at 1440×900 and 375×812 with explicit viewport captions
- B7: `BLOCKED — MASTRA-066 not shipped` (acceptable for first pass; the criterion ships when the component does)
- B8: log excerpt showing MCP → Places SDK → Supabase chain
- B9: `3 expected tools, 0 unknown`
- B10: empty grep over server-side key pattern

#### Pass/fail criteria

`satisfied` when 9/11 criteria green with B7 explicitly `BLOCKED — MASTRA-066`. Rendering subset (A1–A6) must all pass.

### Option B — mastra-workflow (if a `my-mastra-app/src/mastra/**` PR lands first)

| Field | Value |
|---|---|
| Rubric | `.claude/outcomes/mastra-workflow.md` |
| Mode | **Full** (criteria 1–10; Locked-mode 11, 12 require workflow-state-runtime task 012) |
| Target | Next agent / workflow / tool diff |
| max_iterations | 5 |

#### Commands

```bash
# 1. Typecheck + tests
cd my-mastra-app && npm run typecheck && npm test
cd -

# 3. Smoke
MASTRA_SMOKE_KEEP_RUNNING=1 bash my-mastra-app/scripts/mastra-smoke.sh
# Keep PID for criterion 4

# 4. Health
curl -fsSL http://localhost:4111/api/health

# 5. Env security
node my-mastra-app/scripts/verify-env-security.mjs
# Expected exit 0 (OK) OR exit 2 (BLOCKED — env missing); paste the line

# 6. Tool registry
node --env-file=my-mastra-app/.env my-mastra-app/scripts/verify-grounding-runtime.mjs

# 7, 8, 9. Architecture greps (already shipped — all empty today)
grep -nE "supabase\.from\([^)]+\)\.(insert|update|delete|upsert|rpc)" my-mastra-app/src/mastra/agents/
grep -nE "\.rpc\(['\"](exec_sql|execute_sql|raw)" my-mastra-app/src/mastra/{agents,workflows}/
grep -nE "\.from\(['\"](apartments|events|tickets|bookings|conversations|messages)['\"][^)]*\)\.select" my-mastra-app/src/mastra/ | grep -vE "\.eq\(['\"](org_id|user_id|buyer_id|owner_user_id)"

# 10. ai_runs observability — trigger a router call then query
psql "$(supabase status -o env | grep DB_URL | cut -d= -f2)" -c "
  SELECT agent_name, status, duration_ms, started_at FROM ai_runs
  ORDER BY started_at DESC LIMIT 5;
"
```

#### Expected evidence

- Criteria 1, 2: vitest summaries
- Criterion 3: smoke `[mastra-smoke] OK` line + exit 0
- Criterion 4: JSON body with `"status":"ok"`
- Criterion 5: exit 0 OR explicit `BLOCKED` line with missing env name
- Criteria 7, 8, 9: empty grep output (already verified)
- Criterion 10: ≥ 1 row in `ai_runs` matching an agent in `my-mastra-app/src/mastra/agents/`

#### Pass/fail criteria

`satisfied` with 10/10 in Full mode. Locked-mode criteria 11–12 stay `BLOCKED — workflow-state-runtime task 012 not shipped`.

### Rollback (both options)

```bash
git revert <merge-sha>
# Maps: clear Vite cache + rebuild
rm -rf node_modules/.vite dist && npm run build
# Mastra: kill any lingering mastra dev
pkill -f "mastra dev" || true
```

### What counts as `satisfied`

Verifier writes (Option A):

```
Mode: Full. Pass 9/11. A1–A6 rendering green, B8–B10 grounding green. B7 BLOCKED — MASTRA-066 not shipped. B11 BLOCKED — Maps Grounding Lite API not enabled.
```

Verifier writes (Option B):

```
Mode: Full. Pass 10/10. Smoke + health + tool registry + architecture greps + ai_runs all green.
```

---

## Run log (populate as PRs ship)

| Date | PR # | Rubric | Mode | Iterations | Result | Verifier | Notes |
|---|---|---|---|---:|---|---|---|
| _empty_ | | | | | | | First run pending |

---

## Phase 2 unblock checklist (mirrors progress-outcomes.md)

- [ ] PR 1 (`pr-review.md`, Fast) reaches `satisfied`
- [ ] PR 2 (`supabase-migration.md`, Full) reaches `satisfied`
- [ ] PR 3 (`maps-grounding.md` OR `mastra-workflow.md`, Full) reaches `satisfied`
- [ ] Gemini key rotated
- [ ] Maps preview key rotated
- [ ] GitHub PAT revoked
- [ ] `VITE_GOOGLE_MAPS_API_KEY` rotated + `npm run build` clean of old key
- [ ] `test:e2e` script decision: ship a minimal Playwright spec OR explicitly defer (this sprint defers — see progress-outcomes.md §"Audit pass 4")
- [ ] Phase 2 (`scripts/outcomes/run-outcome.ts`) authoring approved
