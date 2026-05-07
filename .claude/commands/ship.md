---
description: Pre-ship gate — lint + build + test, then parallel security/perf review, then commit + PR
argument-hint: "[task-id|--no-pr]"
allowed-tools:
  - Bash(npm run *)
  - Bash(git *)
  - Bash(gh *)
  - Read
  - Grep
  - Glob
---

# /ship — pre-ship gate for mdeai.co

You are running the **/ship** command. Goal: take whatever is on the current branch from "claims to work" to "verifiably shippable", then create a PR.

Argument: `$ARGUMENTS` (optional task ID like `17A`, or `--no-pr` to skip PR creation).

## Steps (in order — do not parallelize)

### 1 · Pre-flight

- Confirm we're not on `main`. If we are, stop and ask the user to switch to a feature branch.
- Run `git status --short` and report dirty files. If truly nothing has changed since `main`, stop.

### 2 · Floor checks (must all pass)

Run sequentially — the next step depends on the previous:

```bash
npm run lint
npm run build
npm run test -- --run
```

If any step fails, **stop immediately**, surface the failure to the user with file:line, and do **not** proceed to review or commit. The fix loop belongs to the user / `mde-task-lifecycle`, not to /ship.

### 3 · Parallel reviewer fan-out

Dispatch in a single message:

- `security-auditor` — scan diff vs `main` for: exposed secrets, missing RLS, auth bypass, unsafe service-role usage, `.env*` leaks.
- `performance-reviewer` — scan diff vs `main` for: re-render hot spots, missing memoization, N+1 queries, oversized bundles.

Wait for both. If either flags **blockers** (not nits), stop and report — do not commit until the user explicitly accepts the risk.

### 4 · Commit

If `git status` shows uncommitted work:

- Use `git-commit` skill conventions (Conventional Commits, `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`).
- Reference the task ID from `$ARGUMENTS` in the commit body if provided.

### 5 · Push + PR

Unless `$ARGUMENTS` contains `--no-pr`:

- `git push -u origin HEAD`
- `gh pr create` with title under 70 chars and a body containing: Summary (3 bullets), Test plan (checklist), reviewer-flagged items (if any).

### 6 · Three-record sync (if a task ID was provided)

If `$ARGUMENTS` looks like a task ID:

- Update `tasks/todo.md` row → ✅
- Append a `CHANGELOG.md` entry under today's date
- Patch the prompt file's frontmatter `status: Done`

This is the same contract enforced by `mde-task-lifecycle` Phase 5.

## Don't

- Don't auto-merge the PR.
- Don't push to `main`.
- Don't skip floor checks because "the change is small".
- Don't paste full lint/build output into the response — summarize, link.

## When to NOT use /ship

- When you only want to lint/build without a PR → just run those commands.
- When the task is a draft / WIP → use `mde-task-lifecycle` Phases 1-4 first.
- When you need to release notes only → use `git-commit`.
