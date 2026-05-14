# PR Review Outcome Rubric

**When to run:** Any PR opened against `main`, before merge.
**max_iterations:** 3
**Modes:** Fast (criteria 1, 2, 4 only) · **Full (default — all 10)** · Locked (Full + double-check on criteria 5 and 8).
**Forbidden shortcuts:**
- Do NOT cite "I ran it locally" without pasting the last 5 lines of stdout including exit code.
- Do NOT mark a criterion satisfied by reading code — require command output.
- Do NOT skip a criterion as "N/A" without one sentence explaining why it genuinely does not apply.

**Out of scope (do not grade):**
- Pre-existing TypeScript warnings outside the changed files.
- Formatter-only churn in files the PR didn't touch.
- Unrelated commits already on `main` that appear in `git log`.

---

## Coverage checklist

> Criterion tags: `[Fast]` = runs in all three modes · `[Full]` = runs in Full and Locked · `[Locked]` = adds the double-check in Locked mode.

1. **[Fast] Build green.**
   Paste the last 5 lines of `npm run build` including exit code 0 and `dist/` size.
   Fail if exit code is non-zero or output contains "ERROR" / "error TS".

2. **[Fast] Lint green.**
   Paste `npm run lint` summary (errors/warnings count, exit code).
   Fail if exit code is non-zero (errors = fail; warnings alone = pass).

3. **[Full] Tests green and count did not regress.**
   Paste `npm run test -- --run` summary line (`Test Files N passed`, `Tests M passed`).
   M must be ≥ the `main` branch count. **Use a clean baseline — never `git stash` in a dirty worktree:**
   ```bash
   # Option A (preferred): clean worktree
   git worktree add /tmp/mdeai-baseline main && \
     cd /tmp/mdeai-baseline && npm ci --silent && npm run test -- --run | tail -3 && \
     cd - && git worktree remove /tmp/mdeai-baseline
   # Option B: cached baseline from the last green CI run
   #   (paste the `Tests M passed` line from CI artifact)
   ```
   Paste both numbers (`Tests M_baseline passed` vs `Tests M_PR passed`).
   Fail if any tests failed or if `M_PR < M_baseline`.

4. **[Fast] Typecheck green.**
   Paste `npm run typecheck` final line. Exit code 0 = pass.
   Fail if any new type errors appear in files touched by the PR.

5. **[Full, Locked-doubled] No secrets in diff.**
   Run:
   ```bash
   git diff main...HEAD | grep -nE "(sk_live|sk_test_[A-Za-z0-9]{20,}|whsec_|ghp_[A-Za-z0-9]{30,}|AIzaSy[A-Za-z0-9_-]{30,}|eyJ[A-Za-z0-9_-]{20,}\.eyJ|SUPABASE_SERVICE_ROLE|_API_KEY=[\"'][^\"']{8,}|Bearer [A-Za-z0-9._-]{20,})"
   ```
   Must return empty. Paste the command output (empty output = pass).
   Fail if any line is returned. In Locked mode, run a second time after rebasing onto `origin/main` to catch newly-pushed commits.

6. **[Full] No `console.log` added.**
   Run: `git diff main...HEAD -- 'src/**' | grep '^+.*console\.log'`
   Paste output. If non-empty, each occurrence must have a PR body justification ("debug log needed until MASTRA-NNN resolves").
   Fail if output is non-empty AND the PR body has no justification.

7. **[Full] No unsafe `VITE_` vars referencing server-side secrets.**
   Run: `git diff main...HEAD -- 'src/**' | grep -E "VITE_(GEMINI|STRIPE|ANTHROPIC|SERVICE_ROLE|MAPS_SERVER)"`
   Must return empty. Paste output.
   Fail if any line is returned.

8. **[Full, Locked-doubled] Scope match.**
   `git diff --name-only main...HEAD` — paste the file list.
   Every changed file must map to the PR description's stated scope. Flag any file that looks unrelated.
   Fail if > 2 clearly out-of-scope files appear without justification in the PR body. In Locked mode, also paste `git log main..HEAD --oneline` and verify every commit message aligns with the scope.

9. **[Full] §9 Definition of Done is filled in (no orphan checkboxes).**
   Paste the `## 9. Definition of Done` section from the PR body.
   Fail if any `- [ ]` (unchecked box) appears that is not marked `N/A` with a reason.

10. **[Full] RLS not removed on tables touched by the PR.**
    For each table modified or added in `supabase/migrations/` files in this diff:
    Run: `SELECT relrowsecurity FROM pg_class WHERE relname='<table>';`
    Paste output. Must return `t`.
    If no migrations are in the diff, paste `N/A — No migration files changed in this PR.`

---

## Output format

Line 1: `Pass N/10. <one-line summary of what passed and what didn't>`

Then, for each FAILED criterion:
`<id> - FAIL. <what specifically is wrong and what to do to fix it>`

Example:
```
Pass 8/10. Build and tests green; two issues found.
3 - FAIL. Test count decreased: main has 82 tests, this PR has 79. Restore or replace the 3 deleted tests.
5 - FAIL. Line +41 in src/lib/gemini.ts contains GEMINI_API_KEY=process.env.GEMINI_API_KEY — remove and use the server-side env pattern.
```
