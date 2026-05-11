# Git worktree cheatsheet (mdeAI layout)

## Layout convention

```text
/home/sk/mde                                        ← canonical main checkout
/home/sk/mde/.claude/worktrees/<name>/              ← Claude-managed worktrees (default)
/home/sk/mde/.claude/worktrees/practical-carson/    ← example (auto-named)
```

`.claude/worktrees/` is in `.gitignore`. Anything outside that path needs explicit user approval before creation.

## Daily commands

| Action | Command |
|---|---|
| List all worktrees + branch | `git worktree list` |
| List with dirty status | `bash .claude/skills/mde-worktree-pr-flow/scripts/list-worktrees.sh` |
| Create on new branch | `git worktree add -b feat/xyz ../wt-feat-xyz origin/main` |
| Create on existing branch | `git worktree add ../wt-fix fix/something` |
| Remove (must be clean) | `git worktree remove ../wt-feat-xyz` |
| Force remove (lose work) | `git worktree remove --force ../wt-feat-xyz` *(needs explicit user OK)* |
| Move | `git worktree move ../wt-old ../wt-new` |
| Prune stale entries | `git worktree prune` |
| Lock against accidental delete | `git worktree lock ../wt-long-running --reason "running tests"` |

## Claude-Code-native flow

If the desktop app or CLI was started with `--worktree`, prefer the native tool:
```bash
claude --worktree feature-auth     # creates .claude/worktrees/feature-auth on branch worktree-feature-auth
claude --worktree "#1234"          # creates worktree from PR #1234
```
Native creation honors `.worktreeinclude` (auto-copies `.env`, `.env.local`, `config/secrets.json`).

When working from a non-Claude shell, fall back to plain `git worktree add` and copy `.env` manually.

## Cleanup ritual

Before deleting any worktree:
```bash
cd <worktree-path>
git status --short
git stash list
git log --oneline @{u}..HEAD     # local-only commits, possibly unpushed
```
If any of these are non-empty, **stop**. Push, stash, or get user approval before removing.

After cleanup:
```bash
cd /home/sk/mde
git worktree remove <worktree-path>
git worktree prune
```

## When NOT to use worktrees

- Quick one-line edits the user is watching live. Just edit on the current branch.
- Operations that need shared state with the running dev server (e.g. modifying `.mastra/output/` directly).
- Anything that would create a 3rd parallel worktree while the current 2 are dirty.
