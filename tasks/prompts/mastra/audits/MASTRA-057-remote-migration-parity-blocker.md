# MASTRA-057 — Remote migration parity blocker (audit)

**Status:** Local migration + RLS verified; **remote deploy blocked** until history aligns.  
**Linked project ref:** `zkwcbyxiwklihegjhuql` (from team CLI).

## Confirmed after `supabase login` + `supabase link`

- **`supabase db push --dry-run`** now **runs** (CLI auth OK).
- Dry-run **fails** with:

```txt
Remote migration versions not found in local migrations directory.
```

CLI suggests **`supabase db pull`** and lists many remote version IDs + proposes **`supabase migration repair --status reverted …`** for those versions.

## How to read `supabase migration list`

| Local column | Remote column | Meaning |
| ------------ | ------------- | ------- |
| blank | version | **Remote-only** — applied on linked DB, **no matching file** in local `supabase/migrations/` |
| version | blank | **Local-only** — file exists locally, **not** recorded on remote (not pushed / never applied) |
| version | same version | **Aligned** |

**057 migration:** `20260513103000` appears **local-only** (expected until push succeeds **after** parity).

## Root cause (high level)

The linked remote has **many** migrations recorded in `schema_migrations` (or equivalent) **without** corresponding SQL files in **this** repo checkout. Until local files match what remote thinks ran—or remote history is corrected deliberately—you cannot safely **`db push`** new migrations including `grounding_quota_log`.

## Do **not** do yet (without team sign-off)

- **`supabase migration repair`** — can rewrite migration history; easy to break CI/other clones.
- **`supabase db push`** (non–dry-run) — until dry-run is clean or drift is explicitly resolved.

## Safe reconciliation playbook (order)

1. **Audit on a dedicated git branch** (e.g. `audit/supabase-migration-parity`) so unrelated dirty files do not confuse the diff.
2. Prefer **restore missing migration SQL files** from **canonical git history** (e.g. `main`, release tag, or infra repo)—matches remote versions without inventing SQL.
3. If files truly never existed in git but DB matches prod intent: **`supabase db pull`** on that audit branch, inspect generated migration(s), review with another engineer, then merge intentionally.
4. **`migration repair`** only as **last resort**, with written rationale (which versions are phantom vs duplicated squashes).

## Immediate decision

```txt
056/057 local work: good
057 remote deploy: blocked — migration parity
Next: parity audit / reconcile remote ↔ local migration files
```

See also: `tasks/prompts/mastra/audits/MASTRA-056-057-playwright-supabase-proof.md` (local verification).

**Snapshot:** `tasks/prompts/mastra/audits/supabase-migration-list-2026-05-12.txt` (branch `audit/supabase-migration-parity`, `supabase migration list` tee).

**Git recovery audit (2026-05-12):** `tasks/prompts/mastra/audits/supabase-migration-recovery-audit-2026-05-12.md` — remote-only classification, 5 landlord files restored from history, `20260120000733` intentional-removal note, post-recovery dry-run log path.
