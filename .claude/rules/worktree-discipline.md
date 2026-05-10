# Worktree discipline (hard rule)

> **One worktree at a time.** Do not start work in a new worktree until the current one is clean, committed, pushed, tested, and reviewed.

## Why this rule exists

Multiple worktrees on the same repo cause:
- Hidden uncommitted work scattered across paths nobody remembers.
- Studio / dev servers running from a stale checkout while you edit a different one.
- Force-pushes that surprise reviewers because a parallel branch silently diverged.
- Stash piles in worktrees that get deleted, losing work.

If you cannot point at the *one* worktree that holds the canonical state, you are no longer doing software engineering — you are doing archaeology.

## The 6-step process (run before every code change)

### 1. Verify current location
```bash
pwd
git branch --show-current
git status --short
git worktree list
```
You must be able to answer: which worktree am I in, what branch, is it clean, what other worktrees exist.

### 2. Before creating or switching branches
- Confirm no uncommitted work in the current worktree (`git status --short` empty).
- If dirty: commit, stash with a labeled message, or intentionally discard. Never `git checkout` over uncommitted changes.
- Never leave hidden work in another worktree. If you find untracked files in a sibling worktree (`practical-carson/scripts/audit-edge-fn-jwt.ts` etc.), surface them before doing anything else.

### 3. Before coding
- Web-search the official Mastra docs for the API you're about to use.
- Check Mastra GitHub issues for known bugs on the version you've installed.
- Read the relevant `.claude/skills/mastra*` skill for project conventions.
- Verify the actual installed package API in `node_modules` matches the docs (Mastra ships often).
- Verify any model ID via `.claude/skills/mastra/scripts/provider-registry.mjs --provider <name>` — never guess slugs.

### 4. After coding
- `npm run typecheck` — clean.
- `npm run build` — clean.
- Smoke/runtime test — actually call the workflow/agent endpoint and assert on response shape, not just status.
- Studio: confirm new agents/workflows/tools appear at the URL you expect.
- `git diff --staged --name-only | grep -E "\.env"` — must return nothing.

### 5. Before opening a PR
- `git diff --stat origin/main` — confirm files changed match the task.
- Exclude unrelated noise (formatter churn, IDE configs, unrelated package bumps).
- Confirm branch is based on latest `origin/main` (rebase if it isn't).
- Document tests run + results in the PR body. Don't leave `[ ]` boxes for things you actually ran.

### 6. Before merging a PR
- CodeRabbit (or chosen reviewer) has completed.
- All CI checks green or knowingly skipped (Supabase Preview skipped is fine for Mastra-only work, document it).
- No merge conflicts.
- Smoke passes against the deployed/preview build, not just localhost.
- PR title + body match the actual base branch and diff. If you retargeted base mid-flight, rewrite the body.

## Failure modes to watch for

- **Two `mastra dev` running on the same port** — `pkill -f "mastra dev"` and restart from the correct worktree before you trust Studio output.
- **`PR body says targets X, actually targets Y`** — happens after `gh pr edit --base`. Always rewrite the body when retargeting.
- **`Workflow not found` in Studio** — the dev server is serving a stale build. Check `lsof -i :4111` to find which worktree is actually bound.
- **`.env` copied between worktrees** — fine for local runtime, but verify it's gitignored and never staged.
