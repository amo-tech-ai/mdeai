# Supabase Migration Outcome Rubric

**When to run:** Any new file under `supabase/migrations/`, before merge to `main`.
**max_iterations:** 5
**Modes:** Fast (criteria 1, 4, 5 only — for migrations that only adjust comments / docstrings) · **Full (default — all 10)** · Locked (Full + the grader runs `supabase db reset` twice to confirm idempotency).
**Prerequisite:** Local Supabase stack running (`supabase start` → port 54321). If unavailable, paste `BLOCKED — supabase CLI not running` and all DB-dependent criteria fail.
**Forbidden shortcuts:**
- Do NOT pass criterion 4 (RLS) by reading the SQL file — require `pg_policies` query output.
- Do NOT pass criterion 1 (clean apply) by re-running a migration that was already applied to your local stack. Use `supabase db reset` on a clean local clone.
- Do NOT apply the migration to a remote/production project as evidence. All testing is local.
- Do NOT pass criterion 6 (indexes) by grep-ing the SQL for `CREATE INDEX` — require `pg_indexes` query output showing the index actually exists after apply.

**Out of scope (do not grade):**
- Migrations already merged to `main` (only grade the new file(s) in this diff).
- Auto-generated type reformatting that does not add/remove/rename exported symbols.
- Foreign key indexes on `auth.users` (managed by Supabase, not our responsibility).

---

## Coverage checklist

1. **Applies cleanly on a fresh local stack.**
   Run `supabase db reset` (wipes local DB, replays all migrations including the new one).
   Paste: the last 10 lines of stdout + exit code.
   Fail if exit code is non-zero or output contains "ERROR" / "failed".

2. **No destructive SQL without explicit approval.**
   Run: `grep -nE "^\s*(DROP TABLE|DROP COLUMN|TRUNCATE|DELETE FROM)" supabase/migrations/<new-file>.sql`
   Paste output. If non-empty, the PR body must contain the exact phrase:
   `"Destructive SQL approved: <table/column name, reason>"`
   Fail if destructive SQL is present AND the PR body contains no such phrase.

3. **Rollback note exists.**
   The PR body must contain either:
   a. A `## Rollback` section with the exact reverting SQL, OR
   b. The phrase `"Rollback: revert commit <sha>"` with the SHA.
   Paste the rollback section from the PR body.
   Fail if neither is present.

4. **RLS enabled on every new table.**
   For each new table T introduced by this migration:
   a. Paste: `SELECT relrowsecurity FROM pg_class WHERE relname='T';` → must return `t`
   b. Paste: `SELECT polname, cmd, qual FROM pg_policies WHERE tablename='T';`
      Must have ≥ 1 policy per data-access verb the table supports (SELECT for readable tables, INSERT/UPDATE/DELETE for writable ones).
   Fail if `relrowsecurity = f` or if zero policies exist for a table that serves user-scoped data.

5. **`(select auth.uid())` subquery pattern used — not direct `auth.uid()` call.**
   Run: `grep -nP "auth\.uid\(\)" supabase/migrations/<new-file>.sql | grep -vP "\(select auth\.uid\(\)\)"`
   Paste output. Must be empty.
   Fail if any line is returned (direct `auth.uid()` calls without the subquery wrapper).

6. **Indexes exist for new foreign key and filter columns.**
   For each FK column C on new or modified table T:
   Paste: `SELECT indexname, indexdef FROM pg_indexes WHERE tablename='T' AND indexdef LIKE '%C%';`
   Must return ≥ 1 row per FK column.
   Also check columns named in WHERE clauses of any SELECT policies — those need indexes too.
   Fail if a FK column or policy filter column has no index entry.

7. **TypeScript types regenerated and consistent.**
   After `supabase db reset`, regenerate types. The `npm run gen:types` script does **not** yet exist in this repo, so use the canonical fallback:
   ```bash
   supabase gen types --lang=typescript --local > src/integrations/supabase/types.ts
   ```
   Paste: exit code + `git diff --stat src/integrations/supabase/types.ts`
   The diff must show changes consistent with the migration (new tables/columns appear; no unexpected removals).
   Fail if `gen types` errors OR the diff is empty when new tables were added.
   N/A is acceptable only if the migration is policy-only / index-only and adds no new tables or columns — paste `N/A — migration adds no new tables or columns.`

8. **Edge functions still compile.**
   Run: `npm run verify:edge` (or `cd supabase/functions && deno check **/*.ts`)
   Paste: exit code + the pass/fail summary line.
   Fail if exit code is non-zero.

9. **No secrets or real data in seed / migration files.**
   Run: `grep -rE "(sk_live|whsec_|[A-Za-z0-9+/]{40,}=|SUPABASE_SERVICE_ROLE)" supabase/migrations/<new-file>.sql supabase/seed*.sql 2>/dev/null`
   Must return empty. Paste output.
   Fail if any line is returned.

10. **Production safety assessment.**
    Write one line: `"Safe to apply to production: YES / NO / NEEDS_REVIEW — <reason>"`
    YES requires criteria 1–9 all green AND the migration is additive-only (no column removals, no constraint changes on hot tables).
    NO or NEEDS_REVIEW is acceptable — it means the human must review before prod apply.
    This criterion always passes (it is informational); fail only if the assessment is missing.

---

## Output format

Line 1: `Pass N/10. <one-line summary of what passed and what didn't>`

Then, for each FAILED criterion:
`<id> - FAIL. <what specifically is wrong and what to do to fix it>`

Example:
```
Pass 7/10. Migration applies cleanly; three safety issues found.
4 - FAIL. Table `grounding_quota_log` has RLS disabled (relrowsecurity=f). Add: ALTER TABLE grounding_quota_log ENABLE ROW LEVEL SECURITY; and at least one SELECT policy.
5 - FAIL. Line 23: USING (auth.uid() = user_id) — must be USING ((select auth.uid()) = user_id).
6 - FAIL. Column `user_id` on `grounding_quota_log` has no index. Add: CREATE INDEX ON grounding_quota_log(user_id);
```
