---
id: MASTRA-057-AUDIT
title: MASTRA-057 — grounding_quota_log migration proof checklist
created: 2026-05-12
related:
  - tasks/prompts/mastra/tasks/057-mastra-grounding-quota-log-migration.md
  - tasks/prompts/mastra/tasks/049-mastra-geo-grounding-phase3.md
  - supabase/migrations/20260513103000_grounding_quota_log.sql
---

# MASTRA-057 proof checklist

## Proof summary

- [x] Migration `YYYYMMDDHHMMSS_grounding_quota_log.sql` (14-digit), lexically after prior migrations.
- [x] `public.grounding_quota_log`: `date date primary key default current_date`, `count integer not null default 0`.
- [x] RLS enabled; policy restricts ops to `auth.role() = 'service_role'`.
- [x] `supabase db reset` exits 0 locally.
- [x] Atomic increment SQL returns `1`, then `2`, then `3` on fresh DB (manual).
- [x] `SET ROLE anon` → `SELECT count(*) …` → **0 rows visible**; `INSERT` → **RLS policy violation**.
- [ ] **`supabase db push`** against linked prod/staging — run after resolving remote/local migration parity (`migration repair` / `db pull` if histories diverged).

## Commands

```bash
ls supabase/migrations/*grounding_quota*
supabase db reset
supabase db query --local --agent=no -o table \
  "INSERT INTO public.grounding_quota_log (date, count) VALUES (CURRENT_DATE, 1)
   ON CONFLICT (date) DO UPDATE SET count = public.grounding_quota_log.count + 1 RETURNING count;"
PGPASSWORD=postgres psql "$DB_URL" -v ON_ERROR_STOP=1 -c "SET ROLE anon; SELECT count(*) FROM public.grounding_quota_log;"
npm run lint && npm run build && npm run test -- --run
```

## Out of scope

MASTRA-049 MCP wiring, `grounding-quota.ts`, Mastra tools.
