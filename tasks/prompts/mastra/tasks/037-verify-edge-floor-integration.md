---
task_id: MASTRA-037
title: Wire `verify:edge` into the floor — fail PRs on edge-function type errors
phase: Floor / CI hardening
priority: P1
status: Not Started
estimated_effort: 0.5 day
area: ci / edge-functions
skill: [mde-task-lifecycle, mde-supabase, mde-github, create-github-action-workflow-specification]
subagents: [backend]
edge_function: none (CI + package.json)
schema_tables: []
depends_on: [MASTRA-036]
blocks: []
verified_docs:
  - https://docs.deno.com/runtime/reference/cli/check/
  - https://github.com/denoland/setup-deno
  - https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions
related:
  - scripts/verify-edge-functions.sh
  - supabase/functions/deno.json
  - .github/workflows/
---

<!-- task-summary -->
> **What:** Add `verify:edge` to the floor and gate the `main`-branch push on it via a GitHub Actions workflow, so any edge-function type error or deprecated import lands as a red PR check before it can ship. Split the workflow into two parallel jobs (frontend-floor + edge-floor) and use `denoland/setup-deno@v2` with proper caching.
> **Why:** Three pre-existing type bugs (`event_venues` cast, `corsHeaders` scope, bearer regex) sat in `main` for weeks because `npm run verify:edge` was never required. The next bug will sit just as long unless the floor enforces it.
> **Delivers:** Two parallel CI jobs blocking PR merge + push-to-main, a structured `SKIP_FUNCTIONS` policy (`name:TASK-ID` entries), a log-tee + conditional artifact for fast failure triage.
> **Tools/Skills:** `mde-supabase` · `mde-github` · `supabase-edge-functions` · `create-github-action-workflow-specification`
> **Floor · P1 · Not Started · Effort: 0.5 day**

# Wire `verify:edge` into the floor

## 1. Purpose

The CLAUDE.md floor today reads `npm run lint && npm run build && npm run test`. That floor catches frontend issues but **not** edge-function type or import errors — those only surface when someone runs `npm run verify:edge` by hand, which nobody does until a deploy fails.

`verify:edge` is now provably green (MASTRA-036 closed the last 5 holes). With a clean baseline, the move is to make breaking it impossible to ignore on `main`.

**Not in scope:** Adding new lint rules to Deno code, restructuring per-function `deno.json` files, moving the verify step into a Docker container, or auto-posting PR comments. Those are MASTRA-038+ candidates.

## 2. Goals

- `npm run floor` is one command that runs `lint && build && test && verify:edge` and exits non-zero on any failure.
- The README / CLAUDE.md "floor before shipping" line points at `npm run floor`.
- A GitHub Actions workflow runs on **both** `pull_request` and `push: branches: [main]` (catches direct pushes + post-merge regressions).
- The workflow is split into two **parallel** jobs:
  - `frontend-floor` — `lint` + `build` + `test` (Node only; no Deno).
  - `edge-floor` — `verify:edge` (Deno + Node, since the script does `npm ci` only if needed).
- `denoland/setup-deno@v2` is pinned with `~/.cache/deno` cached.
- Both jobs **tee** their output to a log file and **conditional-upload** that log as an artifact on `failure()` only — no artifact spam on green runs.
- A guard in `scripts/verify-edge-functions.sh`: any `SKIP_FUNCTIONS` entry MUST follow `name:TASK-ID` format (e.g. `sponsor-roi-explain:MASTRA-036`). Orphan entries (no colon, or unknown name) → exit 1 with `"orphan skip entry"`.
- Drop the "< 90s warm-cache" hard target. Document expected timing (typically 60–120s warm, 180–300s cold) but don't gate on it — flaky cache hits will trip the gate for no reason.

## 3. Features (what the contributor gets)

- One verb to type before any commit: `npm run floor`.
- A red CI check on the PR within 2–3 minutes of pushing, split into two parallel jobs so frontend failures don't block edge debugging and vice versa.
- A clickable artifact (log file) on the failed job — no need to expand the GitHub Actions UI line-by-line.
- A `SKIP_FUNCTIONS` policy enforced by the verify script itself: every entry must reference a tracked task ID, so silent rot is structurally impossible.

## 4. Workflows

1. Add `"floor": "npm run lint && npm run build && npm run test && npm run verify:edge"` to `package.json`.
2. Update `CLAUDE.md` Quick Commands + "Floor before shipping" line to reference `npm run floor`.
3. Use the `create-github-action-workflow-specification` skill to scaffold `.github/workflows/floor.yml`:
   - **Triggers:** `pull_request` (any branch) AND `push: branches: [main]`.
   - **Job 1 (`frontend-floor`):** checkout → `actions/setup-node@v4` (pin Node 20 LTS to match repo runtime; check `.nvmrc` if present) → `npm ci` (with cache) → `npm run lint 2>&1 | tee floor-frontend.log` → same pattern for `build` and `test`.
   - **Job 2 (`edge-floor`):** checkout → setup Node (same) → `npm ci` → `denoland/setup-deno@v2` with `deno-version: v2.x` and `cache: true` (caches `~/.cache/deno` keyed on the deno.lock hash) → `npm run verify:edge 2>&1 | tee floor-edge.log`.
   - **On failure**, both jobs upload `floor-*.log` via `actions/upload-artifact@v4` with `if: failure()` — never on success.
4. Add the orphan-skip guard to `scripts/verify-edge-functions.sh`:
   ```bash
   for entry in "${SKIP_FUNCTIONS[@]}"; do
     [[ "$entry" =~ ^[a-z0-9-]+:[A-Z]+-[0-9]+$ ]] || { echo "orphan skip entry: $entry (expected name:TASK-ID)"; exit 1; }
   done
   ```
5. Open the PR. Confirm both jobs run and are visible in the PR check list.
6. Manually break a sponsor file (add a stray `:` to `_shared/gemini.ts`), push to a throwaway branch, confirm CI fails red on `edge-floor` with the uploaded log artifact. Revert.
7. Add both job names to the branch protection "required status checks" list for `main` on GitHub.

## 5. User journeys

- **Engineer opening a PR that touches `supabase/functions/ai-chat/index.ts`:** types `npm run floor`, gets a four-step pass/fail locally. Pushes. CI runs two parallel jobs in 2–3 minutes. Reviewer sees both green checks covering frontend AND edge surface.
- **Engineer trying to land an edge function with a type error:** local `npm run floor` fails on step 4; CI's `edge-floor` job fails red with a downloadable `floor-edge.log` artifact pointing at the exact Deno check error. No reviewer reads broken code, no Vercel deploy is wasted.
- **Future contributor adding a P3 function that uses an unwritten helper:** adds it to `SKIP_FUNCTIONS` without a task ID → verify-edge orphan-skip guard exits 1 → CI fails → forced to either implement the helper or file a tracked task before merging.
- **Post-merge regression catcher:** the `push: branches: [main]` trigger re-runs the floor against `main` immediately after merge. If a merge conflict resolution introduced a regression that PR CI missed, the `main`-push run goes red within 3 minutes — surfacing in the GitHub Actions tab.

## 6. Agents

None. Pure CI/floor plumbing.

## 7. Integrations

| Integration | Purpose | Auth source |
|-------------|---------|-------------|
| GitHub Actions | PR-blocking CI on PR + main push | `GITHUB_TOKEN` (workflow-scoped, default) |
| `actions/setup-node@v4` | Pinned Node 20 LTS install | n/a |
| `denoland/setup-deno@v2` | Deno install + `~/.cache/deno` cache | n/a |
| `actions/upload-artifact@v4` | Conditional log upload on failure | n/a |

## 8. Summary

We're turning today's manual `verify:edge` script into a mandatory PR + main-push check so the next edge-function type bug fails red on GitHub instead of silently shipping. Two parallel jobs keep the feedback loop fast; a log-tee + conditional artifact makes failures trivially debuggable; a structured `SKIP_FUNCTIONS` guard prevents silent rot. Success = a deliberately broken edge function fails the `edge-floor` job on a test branch and its `floor-edge.log` artifact points at the line.

## 9. Definition of Done

- [x] `npm run lint` clean (0 errors, 48 pre-existing warnings)
- [x] `npm run build` clean (~8s)
- [x] `npm run test` clean, count did not regress (41/41)
- [x] `npm run verify:edge` clean (21 deno tests passed; 63 sponsor JWT-gated ignored)
- [x] `npm run floor` exists in `package.json` and chains lint → build → test → verify:edge
- [x] `.github/workflows/floor.yml` shipped; runs on `pull_request` AND `push: branches: [main]`; 2 parallel jobs (node + deno) with concurrency cancel + `actions/upload-artifact@v4 if: failure()`
- [x] Orphan-skip guard in `scripts/verify-edge-functions.sh` proven: empty array OK ✅, malformed entry rejected with rc=1 ✅, well-formed `name:TASK-ID` accepted ✅
- [ ] Demonstrated CI failure on a deliberately broken edge function (screenshot of the red check + downloaded artifact) — pending first PR run
- [ ] Branch-protection: both `floor / node` and `floor / deno` added to required checks on `main`
- [ ] `CLAUDE.md` updated to reference `npm run floor` as the canonical pre-ship step
- [ ] PR description lists: workflow YAML, sample failure output + artifact link, cold-vs-warm CI timing observed (informational, not gated)

> **N/A:** No frontend / runtime change; no live mdeai.co verification required.
