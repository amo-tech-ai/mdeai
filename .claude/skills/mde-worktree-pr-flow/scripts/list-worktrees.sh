#!/usr/bin/env bash
# list-worktrees.sh — Print every worktree with branch + dirty status in one table.
# Usage: bash .claude/skills/mde-worktree-pr-flow/scripts/list-worktrees.sh
set -euo pipefail

BOLD=$'\033[1m'; DIM=$'\033[2m'; RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; RESET=$'\033[0m'

printf "${BOLD}%-55s %-40s %-10s %-12s${RESET}\n" "PATH" "BRANCH" "DIRTY?" "AHEAD/BEHIND"
printf "%s\n" "$(printf '%.0s-' {1..120})"

git worktree list --porcelain | awk '
  /^worktree / { path=$2 }
  /^HEAD /     { head=$2 }
  /^branch /   { branch=$2; print path "|" head "|" branch }
  /^detached/  { print path "|" head "|(detached)" }
' | while IFS='|' read -r path head branch; do
  short_branch="${branch#refs/heads/}"
  if [ -d "$path" ]; then
    pushd "$path" >/dev/null
    if [ -n "$(git status --short)" ]; then
      dirty="${RED}DIRTY${RESET}"
    else
      dirty="${GREEN}clean${RESET}"
    fi
    upstream=$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || echo "")
    if [ -n "$upstream" ]; then
      ahead=$(git rev-list --count "$upstream"..HEAD 2>/dev/null || echo "?")
      behind=$(git rev-list --count HEAD.."$upstream" 2>/dev/null || echo "?")
      track="${ahead}/${behind}"
      if [ "$behind" != "0" ] && [ "$behind" != "?" ]; then
        track="${YELLOW}${track}${RESET}"
      fi
    else
      track="${DIM}—${RESET}"
    fi
    popd >/dev/null
  else
    dirty="${YELLOW}MISSING${RESET}"
    track="${DIM}—${RESET}"
  fi
  printf "%-55s %-40s %-19s %-21s\n" "$path" "$short_branch" "$dirty" "$track"
done

echo
echo "${DIM}Legend: AHEAD/BEHIND counts vs. tracked upstream. Yellow = behind upstream — fetch/rebase before opening a PR.${RESET}"
