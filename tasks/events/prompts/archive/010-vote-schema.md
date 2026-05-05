---
task_id: 010-vote-schema
diagram_id: VOTE-SCHEMA
prd_section: 4.3 Database schemas, 09-prd.md §1
title: Create vote.* schema migration (10 tables + RLS + indexes)
phase: PHASE-2-CONTESTS
priority: P0
status: Open
estimated_effort: 1 day
area: backend
skill:
  - supabase
  - supabase-postgres-best-practices
  - mdeai-project-gates
edge_function: null
schema_tables:
  - vote.contests
  - vote.categories
  - vote.entities
  - vote.votes
  - vote.entity_tally
  - vote.judges
  - vote.scoring_criteria
  - vote.judge_scores
  - vote.fraud_signals
  - vote.paid_vote_orders
depends_on: []
mermaid_diagram: ../diagrams/04-vote-schema.md
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-2-CONTESTS — release blocker for the Phase 2 contest engine; foundation for tasks 011–024 |
| **Schema** | New `vote.*` schema, 10 tables |
| **RLS** | All tables enabled; service-role-only on votes/entity_tally; public SELECT on contests/entities/categories where status='live' |
| **Migration file** | `supabase/migrations/<timestamp>_vote_schema.sql` |
| **Indexes** | FK indexes + (contest_id, entity_id, created_at DESC) for vote queries; ivfflat on entities.embedding |
| **Real-world** | "Migration runs cleanly on staging Supabase project; no Supabase advisor errors" |

## Description

**The situation.** As of 2026-05-03 mdeai has 44+ production tables + Phase 1 events MVP shipping (events + tickets + orders + attendees + venues + check_ins). What it lacks is voting infrastructure. The contests initiative ([Miss Elegance Colombia 2026](https://misseleganceco.com/)) cannot start without the `vote.*` schema. This is the foundation everything else depends on.

**Why it matters.** Every subsequent task in Phase 1 reads or writes from these tables. The schema must be correct before any edge function or page can be built; fixing schema after the fact requires rolling back data.

**What already exists.** The schema is fully specified in [`tasks/events/01-contests.md`](../01-contests.md) §3 and visualized in [`tasks/events/diagrams/04-vote-schema.md`](../diagrams/04-vote-schema.md). The mdeai project already uses migration patterns from `supabase/migrations/` (e.g. `20260423120000_durable_rate_limiter.sql` shows the rate-limit pattern we need to reuse for L4 fraud).

**The build.** A single migration file creating all 10 tables, all FK relationships, all indexes (including ivfflat for `entities.embedding`), and all RLS policies. RLS is **strict by default**: SELECT is locked down except where the table is intentionally public.

**Example.** Daniela (Reina de Antioquia organizer) runs the migration on the staging Supabase project. She inspects the resulting schema in Supabase Studio. She can run `INSERT INTO vote.contests …` as service role and the row appears. As an authenticated normal user, she can SELECT only contests with `status='live'`. Supabase Advisor shows no security errors.

## Rationale

**Problem.** No voting infrastructure exists. Phase 1 cannot ship without it.
**Solution.** One migration file that creates the entire `vote.*` schema atomically. If any table or constraint fails, the whole migration rolls back — no partial state.
**Impact.** Unblocks tasks 002 (vote-cast edge fn), 003 (`/vote/:slug` page), 004 (Realtime), 005 (tally trigger), 006 (Turnstile), 008 (fraud scan), 009 (contestant intake), 010 (admin moderation), 011 (Gemini moderation). 9 of the 15 Phase 1 tasks are downstream of this one.

## User Stories

| As a... | I want to... | So that... |
|---|---|---|
| Engineer | run one migration to create the entire voting backend | Phase 1 unblocks immediately |
| Founder (Daniela) | inspect the schema in Supabase Studio | I can verify the data model matches the PRD |
| Voter (Camila) | not see other voters' identities | the platform respects privacy |
| Auditor | confirm RLS prevents cross-organization data access | platform is enterprise-ready |

## Goals

1. **Primary:** All 10 `vote.*` tables exist on the target Supabase project with FKs, indexes, and RLS policies.
2. **Quality:** Zero Supabase advisor errors after migration. Zero broken FK references.
3. **Reversibility:** Migration includes a `DOWN` script (or a documented rollback path).

## Acceptance Criteria

- [ ] Migration file at `supabase/migrations/<timestamp>_vote_schema.sql` runs cleanly via `supabase db push` against a fresh database.
- [ ] All 10 tables exist in the `vote` schema, visible in Supabase Studio.
- [ ] All FK constraints are valid (no orphan references possible).
- [ ] Every table has RLS enabled (verified via `SELECT relrowsecurity FROM pg_class WHERE relname IN (...);` returns true for all 10).
- [ ] `vote.votes` has `UNIQUE (idempotency_key)` constraint.
- [ ] `vote.entities.embedding` column has type `vector(768)` and an `ivfflat` index.
- [ ] `vote.contests.scoring_formula` defaults to `'{"audience":0.5,"judges":0.3,"engagement":0.2}'::jsonb`.
- [ ] `vote.contests.status` CHECK constraint allows only `draft|live|closed|archived`.
- [ ] `vote.contests.event_id` is nullable (FK to `public.events.id` — table doesn't exist yet, so use `uuid` with no FK; FK added in Phase 3 via ALTER).
- [ ] Supabase Advisor (`mcp__ed3787fc...__get_advisors` type=security and type=performance) returns 0 errors for the new tables.
- [ ] Local `npm run test` and `npm run build` pass (no schema-driven type generation broke anything).

## Wiring Plan

| Layer | File | Action |
|---|---|---|
| Migration | `supabase/migrations/<YYYYMMDDHHMMSS>_vote_schema.sql` | Create |
| Types (auto-gen) | `src/integrations/supabase/database.types.ts` | Regenerate via `supabase gen types typescript` |
| Docs | `tasks/events/01-contests.md` | Already exists — verify still matches |
| Diagram | `tasks/events/diagrams/04-vote-schema.md` | Already exists — no changes |

## Schema (full migration content)

See [`tasks/events/01-contests.md`](../01-contests.md) §3 for the complete SQL. Key constraints to preserve verbatim:

- `vote.votes` is **append-only** — no UPDATE or DELETE allowed except for `fraud_status` and `weight` (set via trigger).
- `vote.entity_tally` is **materialized via trigger** — clients read this counter, not raw `votes` rows.
- `vote.entities.embedding` uses pgvector — extension must be enabled (already is in mdeai).
- All `text` enum-like fields use CHECK constraints (e.g. `kind IN ('pageant','restaurant','event','generic')`) for data integrity.

### RLS Policies (exact rules)

| Table | SELECT (public) | SELECT (auth) | INSERT/UPDATE | Service-role |
|---|---|---|---|---|
| `contests` | `status IN ('live','closed')` | own org's drafts | `org_id = (select auth.uid())` or admin | bypass |
| `categories` | parent contest live | parent contest visible | parent contest writable | bypass |
| `entities` | parent contest live AND `approved=true` | parent contest visible | parent contest writable | bypass |
| `votes` | none | `voter_user_id = (select auth.uid())` only own | service-role only (via `vote-cast` edge fn) | bypass |
| `entity_tally` | parent contest live | same | service-role only (via trigger) | bypass |
| `judges` | none | `user_id = (select auth.uid())` | service-role only (admin invites) | bypass |
| `scoring_criteria` | parent contest live | parent contest visible | parent contest writable | bypass |
| `judge_scores` | none | `judge_id = (select auth.uid())` only own | judge-only via edge fn | bypass |
| `fraud_signals` | none | none | service-role only | bypass |
| `paid_vote_orders` | none | `buyer_user_id = (select auth.uid())` | service-role only (Stripe webhook) | bypass |

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Migration runs against database with `vote` schema already existing | Use `CREATE SCHEMA IF NOT EXISTS` + `CREATE TABLE IF NOT EXISTS` for idempotency |
| pgvector extension not enabled | Migration fails fast with clear error before creating any table |
| FK to `public.events` referenced (Phase 3 schema doesn't exist yet) | Use `uuid` column with no FK constraint; add FK via Phase 3 ALTER (`alter table vote.contests add constraint contests_event_fkey foreign key (event_id) references public.events(id)`) |
| `vote.contests.scoring_formula` JSONB invalid | Default value uses canonical JSON; validation deferred to edge fn level |
| `vote.entities.embedding` insert without ivfflat index built | First-row insert may be slow; warmup needed before high traffic |

## Real-World Examples

**Scenario 1 — First Miss Elegance Colombia contest creation.** Daniela (organizer) signs up, completes Phase 0 partnership. Engineer runs the migration on production Supabase. Daniela then opens `/host/contest/new` (built in task 012 dependency chain) and creates "Miss Elegance Colombia 2026". The INSERT lands in `vote.contests` with `status='draft'` and `scoring_formula` defaulted to `0.5/0.3/0.2`. **Without this migration,** the INSERT fails with "relation vote.contests does not exist".

**Scenario 2 — Concurrent voting under load.** During Miss Elegance Colombia finals night (T-0), 3,400 voters cast votes in 60 seconds. Each vote INSERT hits the `idempotency_key UNIQUE` constraint. Replays of the same key return 200 OK already_counted. The trigger on insert atomically updates `vote.entity_tally`. **Without proper indexes,** finals night locks up; with them, vote latency stays under 200ms.

**Scenario 3 — Supabase advisor catches missing index.** After migration, advisor reports `unindexed_foreign_keys` on `vote.judge_scores.criterion_id`. Engineer adds the index in a follow-up migration. **Without the advisor check,** the missing index would only surface as slow queries during finals.

## Outcomes

| Before | After |
|---|---|
| No voting tables — Phase 1 blocked | All 10 `vote.*` tables exist with constraints + indexes + RLS |
| `vote-cast` edge fn cannot be built | `vote-cast` (task 011) can target real tables |
| `/vote/:slug` page has nothing to render | `/vote/:slug` (task 012) reads `vote.entity_tally` |
| Trust page formula reference is hypothetical | Trust page (task 015) renders `scoring_formula` from real DB row |

## Verification (post-implementation)

```sql
-- Run these in Supabase SQL editor after migration:

-- 1. All 10 tables present
SELECT count(*) FROM information_schema.tables WHERE table_schema = 'vote';
-- Expected: 10

-- 2. RLS enabled everywhere
SELECT relname, relrowsecurity FROM pg_class
WHERE relnamespace = 'vote'::regnamespace AND relkind = 'r';
-- Expected: all 10 with relrowsecurity=true

-- 3. ivfflat index on entities.embedding
SELECT indexname FROM pg_indexes
WHERE schemaname='vote' AND tablename='entities' AND indexname LIKE '%embedding%';
-- Expected: at least one ivfflat index

-- 4. UNIQUE constraint on idempotency_key
SELECT conname FROM pg_constraint
WHERE conrelid = 'vote.votes'::regclass AND contype='u' AND conname LIKE '%idempotency%';
-- Expected: returns one row

-- 5. CHECK constraint on contests.status
SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
WHERE conrelid='vote.contests'::regclass AND contype='c' AND conname LIKE '%status%';
-- Expected: returns CHECK with 'draft','live','closed','archived'
```

Run `mdeai-project-gates` skill before declaring task done — must show 0 advisor errors.

## See also

- [`tasks/events/diagrams/04-vote-schema.md`](../diagrams/04-vote-schema.md) — full ERD
- [`tasks/events/01-contests.md`](../01-contests.md) §3 — canonical schema spec
- [`.claude/skills/supabase-postgres-best-practices/`](../../../.claude/skills/supabase-postgres-best-practices/) — schema patterns
