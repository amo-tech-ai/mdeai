# safe-git — wrapper + hook to prevent the 2026-04-29 incident

## What this protects against

On 2026-04-29, `git stash push -u` swept 700+ untracked files (including
all of `tasks/`) into `stash@{2}^3`. The visible result was indistinguishable
from deletion — and the user only discovered it 4 days later.

This directory contains the protection installed in response:

| Component | What it does |
|---|---|
| `bin-git` | Wrapper at `~/bin/git`. Blocks `git stash -u/-a/--include-untracked/--all` and `git clean -f/-fd/-fdx`. Pass-through for everything else. |
| `hooks/post-checkout` | Warns when a branch switch causes tracked files in watched dirs (`tasks/`, `.claude/skills/`, `.claude/rules/`, `docs/`, `supabase/`) to decrease — caught early instead of 4 days later. |
| `install.sh` | Idempotent installer. Copies the two files into `~/bin/git` and `.git/hooks/post-checkout` and warns if PATH is misconfigured. |

## Install

```bash
./scripts/safe-git/install.sh
```

## Verify

```bash
which git           # → /home/<user>/bin/git
git stash -u        # → ❌ Blocked
git stash list      # → works (read-only, passes through)
git clean -nd       # → works (dry-run, passes through)
git clean -fd       # → ❌ Blocked
```

## Override (when you really mean it)

```bash
command git stash -u    # bypasses the wrapper
/usr/bin/git stash -u   # also bypasses
```

## Uninstall

```bash
rm ~/bin/git .git/hooks/post-checkout
```

## Why a wrapper script and not an alias / `~/.bashrc` function

- **Aliases can't override core git commands.** Per `git`'s own design,
  aliases that hide a built-in subcommand are silently ignored.
- **Bash functions in `~/.bashrc` only protect interactive bash shells.**
  Empirically tested: Claude Code's Bash tool does NOT source `~/.bashrc`,
  so any function defined there has no effect on Claude's git invocations.
- **A script in `~/bin/` works for everyone.** Both interactive shells
  AND tool-spawned subshells inherit `PATH`, so as long as `~/bin` comes
  before `/usr/bin`, this wrapper intercepts every `git` call.

Validated against:
- [git-stash docs](https://git-scm.com/docs/git-stash) — `-u` / `-a` semantics
- [git-checkout docs](https://git-scm.com/docs/git-checkout) — built-in untracked-overwrite protection
- [githooks docs](https://git-scm.com/docs/githooks) — confirms no `pre-checkout` hook exists
- [Pro Git: aliases](https://git-scm.com/book/en/v2/Git-Basics-Git-Aliases)
- [Atlassian: git clean](https://www.atlassian.com/git/tutorials/undoing-changes/git-clean) — dry-run as best practice
- [anthropic claude-code#11821](https://github.com/anthropics/claude-code/issues/11821) — open platform safety issue
