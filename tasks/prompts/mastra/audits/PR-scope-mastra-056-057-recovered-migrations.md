# PR scope — MASTRA-056 / MASTRA-057 + recovered migrations

Use when opening the focused PR (clean branch only).

## Current status

```txt
5 recovered migrations: ✅ aligned
MASTRA-056: ✅ verified
MASTRA-057: ✅ local verified
20260513103000: ⚠️ local-only, not deployed
Remote parity: ❌ still messy
Real db push: ❌ do not run
```

## Intended PR contents

```txt
MASTRA-056 + MASTRA-057 prerequisites
+ 5 recovered migration files
+ audit docs
```

## Deploy expectation (state clearly on PR)

```txt
Remote deployment remains blocked by existing Supabase migration parity drift.
This PR does not run or require production db push.
```

## PR warning note — paste under PR description

```txt
Supabase note:
Local reset and SQL validation pass. Remote migration list now confirms five recovered migration files are aligned, but additional remote-only/local-only drift remains. `20260513103000_grounding_quota_log.sql` is local-only and must not be pushed until migration parity is fully resolved and reviewed.
```

## Do next

1. Clean branch scope.
2. Commit only intended files.
3. Open PR (with wording above).
4. Continue migration parity as **separate** audit work (`audit/supabase-migration-parity`).
5. Revoke any CLI token/session exposed in chat: Supabase Dashboard → Access tokens / CLI tokens.

## Reference snapshots

- `tasks/prompts/mastra/audits/supabase-migration-list-after-recovery-2026-05-12-user.txt`
- `tasks/prompts/mastra/audits/supabase-db-push-dry-run-after-recovery-2026-05-12.txt`
- `tasks/prompts/mastra/audits/supabase-migration-recovery-audit-2026-05-12.md`
- `tasks/prompts/mastra/audits/MASTRA-057-remote-migration-parity-blocker.md`
