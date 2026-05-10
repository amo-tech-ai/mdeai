---
name: mde-worktree-pr-flow
description: This skill should be used when the user asks to "start a new worktree", "open a PR", "split this PR", "ship this change", "add another feature", or mentions "one PR at a time", "one worktree at a time", divergence between branches, or organizing parallel work. Enforces the mdeAI rule of finishing one worktree and one focused PR before starting the next, with a six-step verification cycle (location → preflight → research → code → verify → ship).
metadata:
  version: 0.1.0
---

# mdeAI worktree + PR discipline

Operate on **one worktree at a time** and **one focused PR at a time**. Finish, verify, and merge the current change before starting the next. Scattered worktrees with hidden uncommitted work are the single largest source of lost work and broken merges in this repo.

## When to invoke this skill

Trigger this skill at any of these moments:

- Before running `git worktree add` or `claude --worktree`.
- Before opening a new PR.
- When asked to "split a PR", "break this into smaller PRs", or "ship this change".
- When asked to switch branches in a worktree that is not clean.
- When `git status` in any worktree shows uncommitted or untracked files older than the current task.
- When two `mastra dev` (or any dev server) are running on the same port.
- When a PR title or body no longer matches the actual base branch or diff.

## Hard rules

1. **One worktree active at a time.** Do not `git worktree add` while another worktree is dirty. If a sibling worktree is dirty, surface its state first and let the user decide (commit / stash / delete) before starting new work.
2. **One focused PR per change.** Each PR has a single intent. If scope grows mid-flight, split before merging.
3. **Never force-push to `main` or any branch you do not own.** `--force-with-lease` is allowed on your own feature branch only.
4. **Never stage `.env*` files.** Even one accidental commit forces a credential rotation.
5. **Verify before declaring done.** Typecheck + build + runtime call + Studio/UI check, in that order. Saying "deployed" without HTTP 200 is a lie.

## The six-step cycle (run in order)

### Step 1 — Locate
Confirm the canonical worktree before touching anything:
```bash
pwd
git branch --show-current
git status --short
git worktree list
```
If `git status --short` is non-empty, stop — clean up before continuing (Step 2).

### Step 2 — Preflight (clean state)
- If dirty and the changes belong to the current task: stage, commit on the current branch.
- If dirty and the changes belong to a *different* task: stash with a labeled message (`git stash push -u -m "wip <topic>"`) **or** commit to the existing branch.
- If dirty and the changes are abandoned: confirm with the user before discarding (`git restore` / `git clean`). Never discard untracked files silently.
- Confirm: `git status --short` empty, `git fetch origin`, branch up to date or knowingly ahead.

### Step 3 — Research before coding
For any new code, in this order:
1. Search the official docs (Mastra docs via `mcp__mastra__searchMastraDocs` and `mcp__mastra__readMastraDocs`; Supabase via `mcp__ed3787fc__search_docs`; Vercel via the `vercel:*` agents and skills).
2. Check the relevant `.claude/skills/` skill (e.g. `mde-supabase`, `mde-stripe`, `mastra`, `mde-testing`).
3. Verify installed package APIs in `node_modules` match the docs.
4. Verify model IDs via `.claude/skills/mastra/scripts/provider-registry.mjs --provider <name>`. Never guess slugs.
5. For external APIs, do a focused web search to catch recent breaking changes.

### Step 4 — Code in small, reviewable units
Keep the diff focused. If a fix grows beyond ~300 lines or touches an unrelated subsystem, stop and split.

### Step 5 — Verify (mandatory before push)
Run, in order, and resolve before continuing:
```bash
npm --prefix my-mastra-app run typecheck     # tsc --noEmit
npm --prefix my-mastra-app run build         # mastra build
# runtime call against the actual endpoint:
curl -sS -X POST "http://127.0.0.1:4111/api/workflows/<workflow-id>/start-async" \
  -H "content-type: application/json" --data '{"inputData":{...}}'
# Studio check:
curl -sS http://127.0.0.1:4111/api/agents | jq 'keys'
```
For non-Mastra changes use the equivalent: `npm run lint && npm run build && npm run test` for the main repo, then a live request against the affected route. **Type-check passing is not a feature working** — always exercise the runtime path.

Use `scripts/verify-clean.sh` to run the location + preflight checks together.

### Step 6 — Ship one PR
Before opening a PR:
- `git diff --stat origin/main` — the file list must match the task. Drop unrelated noise.
- `git diff --cached --name-only | grep -E "\.env"` must return nothing.
- Branch is rebased onto latest `origin/main`.
- PR title is action + scope (≤70 chars). Body lists what was tested with results.

Before merging a PR:
- CodeRabbit pass green (or knowingly ignored, with reason).
- All checks green or skipped with a documented reason (e.g. "Supabase Preview SKIPPED — no `supabase/` change").
- No merge conflicts.
- Smoke runs against preview/deployed build, not just localhost.
- PR title + body still match the actual base branch and diff. **If you retargeted base mid-flight, rewrite the body.**

After merge: pull `main` in every active worktree before starting the next change.

## How to split a PR that has grown

If scope expanded beyond the original task:
1. Identify the cohesive sub-changes (e.g. "fix: classifier regex", "feat: rental + event agents", "docs: skill update").
2. Create a fresh branch off `origin/main` for the *next* sub-change.
3. Cherry-pick only the relevant commits.
4. Open a separate PR per branch.
5. Merge in dependency order.

Do not split *after* a PR has been reviewed and approved — finish that one, then split future work.

## Common failure modes

- **`Workflow not found` from Studio**: dev server is serving a stale build from another worktree. Run `lsof -i :4111` to find the bound process, kill it, restart from the correct worktree.
- **PR body says "stacked into #X" but base is now `main`**: happens after `gh pr edit --base main`. Always rewrite the body when retargeting.
- **`fatal: bad object` after rebase**: the merge commit you cited was on a remote branch you have not fetched. Run `git fetch origin` first.
- **Two dev servers, same port**: `pkill -f "<server name>"` is fine for your own processes. Verify with `ss -tlnp | grep <port>` afterward.
- **Untracked `.env` copied between worktrees**: fine for local runtime, but `git status --short` must show it as `??` not `A`. Verify it is in `.gitignore`.

## Resources

### Reference files
- `references/git-worktree-cheatsheet.md` — exact commands for add / list / remove / move / lock, plus mdeAI-specific layout (`.claude/worktrees/<name>`).
- `references/pr-splitting-playbook.md` — worked example of splitting a 950-line PR into three.

### Scripts
- `scripts/verify-clean.sh` — runs the Step 1 + Step 2 checks and exits non-zero if the worktree is not in a known-clean state.
- `scripts/list-worktrees.sh` — prints every worktree with branch + dirty status in one table, so the user can see scatter at a glance.

## Anti-patterns (do not do)

- Spawning a new worktree because the current one feels stuck. Diagnose the block; do not run from it.
- Committing to a feature branch and opening a PR without running the runtime path.
- Editing files in two worktrees in parallel "to save time" — the merge cost erases the savings.
- Closing a PR mid-review to "open a cleaner one" — comments and review history are lost. Push fixes to the existing PR instead.

## See also

- `.claude/rules/worktree-discipline.md` — the short-form rule loaded into every conversation.
- `.claude/rules/shipping-and-divergence.md` — local vs. GitHub vs. production reality.
- `.claude/skills/using-superpowers/` and `.claude/skills/skill-development/` — skill structure conventions.
- Official Claude Code worktree docs: https://code.claude.com/docs/en/worktrees
- Superpowers using-git-worktrees skill: https://github.com/obra/superpowers/blob/main/skills/using-git-worktrees/SKILL.md
