---
name: git-commit
description: 'Execute git commit with conventional commit message analysis, intelligent staging, and message generation. Use when user asks to commit changes, create a git commit, or mentions "/commit". Supports: (1) Auto-detecting type and scope from changes, (2) Generating conventional commit messages from diff, (3) Interactive commit with optional type/scope/description overrides, (4) Intelligent file staging for logical grouping, (5) Mandatory pre/post-commit file-loss verification (added 2026-05-02 after the tasks/ vanishing incident)'
license: MIT
allowed-tools: Bash
---

# Git Commit with Conventional Commits

## Overview

Create standardized, semantic git commits using the Conventional Commits specification. Analyze the actual diff to determine appropriate type, scope, and message.

**This skill is the canonical commit recipe for the mdeai.co repo.** The short version lives in `~/mde/CLAUDE.md` under "How to commit safely". This skill is the long version — use it whenever you commit, especially after restoring files, after a network blip, or when the user has untracked work in progress.

## Conventional Commit Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Commit Types

| Type       | Purpose                        |
| ---------- | ------------------------------ |
| `feat`     | New feature                    |
| `fix`      | Bug fix                        |
| `docs`     | Documentation only             |
| `style`    | Formatting/style (no logic)    |
| `refactor` | Code refactor (no feature/fix) |
| `perf`     | Performance improvement        |
| `test`     | Add/update tests               |
| `build`    | Build system/dependencies      |
| `ci`       | CI/config changes              |
| `chore`    | Maintenance/misc               |
| `revert`   | Revert commit                  |

## Breaking Changes

```
# Exclamation mark after type/scope
feat!: remove deprecated endpoint

# BREAKING CHANGE footer
feat: allow config to extend other configs

BREAKING CHANGE: `extends` key behavior changed
```

---

## The 6-step canonical workflow

This is mandatory in the mdeai.co repo. Skipping any step has caused real data loss in the past (2026-04-29 untracked sweep, 2026-05-02 visible-deletion confusion).

### 1. PRE-COMMIT — verify nothing is silently disappearing

Before EVERY commit (no exceptions, even one-line edits):

```bash
git status -uall                              # see staged + unstaged + ALL untracked
find tasks -type f | wc -l                    # quote back to user (baseline: 236)
git ls-tree -r HEAD --name-only | wc -l       # tracked file count at HEAD
```

**If the untracked count or `tasks/` count is lower than the previous turn, STOP.** Files have vanished from view. Do not commit. Diagnose first:

```bash
git stash list                                # check for sweeps
git fsck --no-reflogs | grep "dangling"       # check for orphans
git reflog | head -20                         # check for HEAD movement
```

Restore via `git checkout <ref> -- <path>` or `git checkout stash@{N}^3 -- <path>` BEFORE adding the new commit on top.

### 2. ANALYZE the diff

```bash
# If files are staged, use staged diff
git diff --staged

# If nothing staged, use working tree diff
git diff

# Also check status
git status --porcelain
```

Determine:
- **Type**: What kind of change is this?
- **Scope**: What area/module is affected? (`auth`, `host`, `db`, `api`, etc.)
- **Subject**: One-line summary of what changed (present tense, imperative mood, <72 chars)

### 3. STAGE — by exact path, never `git add .`

```bash
# ✅ Good — explicit paths
git add src/pages/Login.tsx src/pages/Signup.tsx
git add supabase/migrations/20260502_*.sql
git add src/components/apartments/HostCard.tsx

# ❌ Bad — sweeps any modified or untracked file
git add -A
git add .
git add *
```

`git add -A` and `git add .` will pull in `.env`, leaked tokens, scratch files, broken symlinks — anything in the working tree. **Always name the files.** This also keeps the diff focused and reviewable.

If you genuinely need many files, list them via Glob/Grep first, show the user, then `git add` only the names you confirmed.

**Never commit secrets** (`.env`, `.env.local`, `credentials.json`, anything ending in `.pem` / `.key` / `id_rsa*`, large binaries like `.dmg` / `.iso` / model weights).

### 4. WRITE the commit message via heredoc

```bash
git commit -m "$(cat <<'EOF'
<type>(<scope>): <subject under 70 chars>

<body — explain WHY, not WHAT. Reference bug/PR/issue if applicable.
Multiple paragraphs OK. Code references OK in backticks.>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Subject rules:
- Present tense imperative ("add" not "added", "fix" not "fixes")
- Under 70 chars (GitHub truncates at 72)
- No trailing period
- Scope in parens, lowercase

Body rules:
- Wrap at ~72 chars per line
- Skip if the subject says everything (rare)
- Reference issues: `Closes #123`, `Refs #456`, `Fixes anthropic/claude-code#11821`

### 5. POST-COMMIT — verify the commit landed AND nothing else was lost

```bash
git log --oneline -1                         # confirm new commit on top
git status -sb                                # working tree clean (or expected leftovers)
find tasks -type f | wc -l                   # SAME count as pre-commit
git ls-tree -r HEAD -- tasks/ | wc -l        # tracked tasks/ count steady
```

If the file count dropped between pre-commit and post-commit, **stop and surface it to the user immediately** — do not push, do not run more commits. Diagnose with the same tools as step 1.

### 6. PUSH — when network behaves

Default `git push` may time out on this machine due to GitHub's HTTP/2 endpoint. The local fix is already applied to this repo (`http.version=HTTP/1.1`, `http.postBuffer=524288000`). If push still hangs:

```bash
# Verify config still set
git config --get http.version            # should print HTTP/1.1
git config --get http.postBuffer          # should print 524288000

# Diagnose without touching repo
curl -fsSL --max-time 8 https://github.com   # should be 200 in <2s
ssh -T -o ConnectTimeout=5 git@github.com    # "Permission denied (publickey)" or username = OK

# Escape hatches (in order)
GIT_HTTP_LOW_SPEED_LIMIT=1000 GIT_HTTP_LOW_SPEED_TIME=60 git push -u origin <branch>
git push origin <small-commit-sha>:refs/heads/<branch>   # push older commits first to chunk
```

**Never** `--force` push to `main` or `master`. Force-push to a feature branch is OK only if the user explicitly asks in this turn.

---

## NEVER do these (hard rules — see CLAUDE.md absolute rule)

- `git add -A` / `git add .` / `git add *` — sweeps secrets, scratch files, dangling symlinks
- `--no-verify` — skips hooks (only if user explicitly asks in this turn)
- `--amend` after a hook-failed commit — the failed commit didn't happen, so amend would rewrite the PREVIOUS commit and lose work. Make a NEW commit instead.
- `git config --global` — settings leak to every repo on the machine. Use repo-local `git config` (no `--global`)
- `git push --force` to `main` / `master` — destroys history
- `git stash push -u` / `--include-untracked` — sweeps untracked files (the 2026-04-29 incident)
- `git clean -fd` / `-fdx` — no-recovery delete of untracked / ignored files
- Commit binaries that GitHub's push-protection will block (PATs, `.dmg` over 100MB, `id_rsa`)

The `~/bin/git` wrapper installed in this repo blocks the most dangerous of these (`stash -u`, `clean -fd`). The `.git/hooks/post-checkout` hook warns when watched dirs lose tracked files. See `scripts/safe-git/README.md`.

---

## Recovery — if something goes wrong

1. **DO NOT panic-delete more.** Read-only diagnostics first.
2. `git stash list` — find any swept work
3. `git reflog | head -30` — find HEAD movement
4. `git fsck --no-reflogs --lost-found` — find orphan commits/blobs
5. `git ls-tree -r --name-only stash@{N}^3` — list untracked files inside a stash
6. `git checkout <ref> -- <path>` — surgical restore (one path at a time)
7. **Commit the restore IMMEDIATELY** — uncommitted restored files vanish on next branch switch and look identical to a deletion (CLAUDE.md "After ANY restore, commit immediately" rule).

---

## Examples

### Single-file fix
```bash
git status -uall                                              # PRE
find tasks -type f | wc -l                                    # baseline
git diff src/lib/format-price.ts                              # ANALYZE
git add src/lib/format-price.ts                               # STAGE
git commit -m "fix(price): show COP currency code on listing detail"
git log --oneline -1                                          # POST
find tasks -type f | wc -l                                    # same baseline
git push origin fix/price-currency
```

### Multi-file feature with body
```bash
git status -uall
find tasks -type f | wc -l                # 236
git add src/pages/Signup.tsx src/components/auth/SignupSuccess.tsx
git commit -m "$(cat <<'EOF'
fix(auth): inline 'Check your inbox' panel after signup

Replaces the toast+navigate-to-/login pattern that landed users on
a 'Welcome back' page after signup. Most landlords thought signup
failed (P0 bug from 2026-05-02 QA round).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git log --oneline -1
find tasks -type f | wc -l                # still 236
git push -u origin fix/signup-success-state
```

### After a restore
```bash
git checkout stash@{2}^3 -- tasks/                            # RESTORE
git status -- tasks/                                          # CONFIRM
find tasks -type f | wc -l                                    # 236 (was 4)
git add tasks/                                                # STAGE the restore
git commit -m "docs(tasks): restore 232 files swept on 2026-04-29"   # COMMIT (mandatory)
git log --oneline -1
find tasks -type f | wc -l                                    # 236
git push origin <branch>
```
