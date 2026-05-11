#!/usr/bin/env bash
# verify-clean.sh — Step 1 + Step 2 of the worktree-pr-flow.
# Exits 0 only if the current worktree is in a known-clean state.
# Usage: bash .claude/skills/mde-worktree-pr-flow/scripts/verify-clean.sh
set -euo pipefail

BOLD=$'\033[1m'; RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; RESET=$'\033[0m'

fail=0

cwd=$(pwd)
branch=$(git branch --show-current 2>/dev/null || echo "(detached)")
status=$(git status --short)
worktrees=$(git worktree list)

echo "${BOLD}Location${RESET}"
echo "  pwd:    $cwd"
echo "  branch: $branch"
echo

echo "${BOLD}Worktrees${RESET}"
echo "$worktrees" | sed 's/^/  /'
echo

if [ -n "$status" ]; then
  echo "${RED}✗ Working tree is dirty:${RESET}"
  echo "$status" | sed 's/^/    /'
  echo "  ${YELLOW}Resolve before starting new work: commit, stash with -m, or restore.${RESET}"
  fail=1
else
  echo "${GREEN}✓ Working tree clean${RESET}"
fi

upstream=$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || true)
if [ -n "$upstream" ]; then
  ahead=$(git rev-list --count "$upstream"..HEAD 2>/dev/null || echo 0)
  behind=$(git rev-list --count HEAD.."$upstream" 2>/dev/null || echo 0)
  echo
  echo "${BOLD}Upstream${RESET} ($upstream)"
  echo "  ahead:  $ahead"
  echo "  behind: $behind"
  if [ "$behind" -gt 0 ]; then
    echo "  ${YELLOW}⚠ Behind upstream — fetch/rebase before opening a PR.${RESET}"
  fi
fi

stashes=$(git stash list)
if [ -n "$stashes" ]; then
  echo
  echo "${YELLOW}⚠ Stashes present — review before deleting this worktree:${RESET}"
  echo "$stashes" | sed 's/^/    /'
fi

# Untracked .env files are OK locally but must never be staged.
staged_env=$(git diff --cached --name-only | grep -E '(^|/)\.env($|/)' || true)
if [ -n "$staged_env" ]; then
  echo
  echo "${RED}✗ .env file is staged — unstage immediately:${RESET}"
  echo "$staged_env" | sed 's/^/    /'
  fail=1
fi

echo
if [ "$fail" -eq 0 ]; then
  echo "${GREEN}${BOLD}OK — worktree is in a clean state. Safe to start new work.${RESET}"
  exit 0
else
  echo "${RED}${BOLD}NOT CLEAN — fix the items above before continuing.${RESET}"
  exit 1
fi
