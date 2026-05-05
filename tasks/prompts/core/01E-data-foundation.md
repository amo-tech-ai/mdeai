# Epic 1: Data Foundation — Task Prompts

### Real world — purpose & outcomes

**In one sentence:** Travelers opening mdeai should see real Medellín listings and neighborhoods—not empty grids—so the marketplace can demo, search, and run CRM flows on honest data.

- **Who it’s for:** Travelers and hosts using the product; your team running demos; engineers wiring AI search and payments.
- **Purpose:** Make Postgres the source of truth: schema, seed data, RLS, and indexes match how the app actually works.
- **Goals:** Apply migrations in order; load enough seed rows that maps, search, and dashboards aren’t faking it; prove RLS blocks cross-user reads.
- **Features / deliverables:** Migration files, seed script(s), verified counts in key tables, RLS smoke checks, alignment with live column names (see schema truth in this file).

> **Diagrams:** MERM-06 (data model), MERM-09 (edge functions) — **reconcile** with live `supabase/migrations/` (see audit `tasks/audit/07-data-audit.md`).
> **Phase:** CORE | **Outcomes:** O1, O2, O10
> **Hypothesis:** Seeding the database with realistic test data unblocks all frontend demos, AI search, and agent testing.
>
> **Migration ordering (required):** DDL **before** seed data that references new tables.
> 1. **`E1-002`** (P1 tables) — creates `leads`, `showings`, `payments`, `rental_applications`, `property_verifications`, `neighborhoods` (and RLS stubs if policies land in E1-004)
> 2. **`E1-001`** (seed script) — depends on **E1-002** if seed loads `neighborhoods` or FKs to P1 tables; **or** split into **E1-001a** (only `apartments` / `profiles` using **existing** columns) then full seed after P1
> 3. **`E1-003`** (indexes) — depends on E1-002 (and on **`vector`** extension if you add embeddings)
> 4. **`E1-004`** (RLS policies) — depends on E1-002 tables existing
>
> E2 (pipeline), E3 (security), and E4 (frontend) depend on **E1-002** completing first. **E6** (Hermes) needs **seed data** from **E1-001** after the schema supports it. Run `supabase migration up` after each migration file — do not batch blindly.

**Schema truth (live, 2026):** `apartments` uses **`neighborhood` (text)** and **`wifi_speed`**, **`minimum_stay_days`**, **`maximum_stay_days`** — not `neighborhood_id`, `wifi_mbps`, or MERM-only score columns until you migrate. **`bookings`** uses **`booking_type`**, **`resource_id`**, **`resource_title`**, **`payment_status`** — map MERM `listing_id` to **`resource_id` + `booking_type`**. **`pgvector`** is **not** enabled until you add the **`vector`** extension + columns.

**P1 DDL in repo:** Six migrations `supabase/migrations/20260404120000_p1_neighborhoods.sql` … `20260404120005_p1_payments.sql` (tables + RLS + indexes). **E1-002** is satisfied when those are **applied** to the target project and verified; extend with new migrations only if the schema needs changes.

**Status (verified 2026-04-05):**
- **E1-002 (P1 tables): DONE** — All 6 migrations exist and create: `neighborhoods` (12 seeded), `leads`, `showings`, `rental_applications`, `property_verifications`, `payments`. All have RLS enabled with correct `(select auth.uid())` pattern.
- **E1-001 (seed script): DONE** — `supabase/seed.sql` (235 lines) seeds 24 apartments, 12 neighborhoods, 5 user profiles. Uses `ON CONFLICT` upsert for idempotency.
- **E1-003 (indexes): PARTIAL** — Some indexes exist in P1 migrations (`idx_neighborhoods_city`, `idx_leads_user_id`, `idx_leads_status`). Comprehensive index audit against query patterns NOT completed.
- **E1-004 (RLS policies): DONE** — All P1 tables have RLS policies in their migration files.
- **E1-007 (pgvector): NOT STARTED** — `vector` extension not enabled. Blocks E6 (Hermes embedding search). Correctly deferred to ADVANCED.
- **Types regeneration: DONE** — All 6 P1 tables confirmed in `database.types.ts` (leads line 1005, neighborhoods 1134, payments 1173, property_verifications 1355, rental_applications 1399, showings 1915).
- **`npm run build`: PASS** — built in 3.25s.
- **Overall: E1 is COMPLETE** (E1-001 through E1-004 all pass acceptance criteria). E1-007 (pgvector) correctly deferred to ADVANCED phase.

---

## Success criteria (tests · verify · production-ready)

| Track | Definition |
|-------|------------|
| **Tests** | Relevant automated checks pass: `npm run lint`, `npm run build`, `npm run test` (and `npm run verify:edge` when Supabase edge functions change). Add or update tests when behavior changes. |
| **Verify** | Manual smoke: confirm the user-visible or API outcome in dev/staging; for auth, CORS, payments, or idempotency, exercise the real path once. |
| **Production-ready** | No open security gaps for this change scope; deploy path documented or executed; rollback/monitoring understood if the change touches production data or money. Mark complete only when the rows above are satisfied. |

## Feature success (goals → shippable features)

Aligned with [`PROMPT-VERIFICATION.md`](../PROMPT-VERIFICATION.md) §6 (Goal · Workflow · Proof · Gates · Rollout), [`.claude/skills/mde-writing-plans/SKILL.md`](../../../.claude/skills/mde-writing-plans/SKILL.md) (user stories + observable proof), and optionally [`.agents/skills/tasks-generator/SKILL.md`](../../../.agents/skills/tasks-generator/SKILL.md) (PRD → tasks).

| Layer | Intent |
|-------|--------|
| **Goal** | Travelers and demos use real rows in `apartments` / `neighborhoods` / P1 tables — not empty UI. |
| **Workflow** | Migrations in order → seed → `supabase db reset` smoke → spot-check RLS with test JWTs. |
| **Proof** | `supabase migration list` applied; seed counts >0; RLS denies cross-user reads where expected. |
| **Gates** | E1-002 before E1-001 when seed references new FKs; align with live `supabase/migrations/`. |
| **Rollout** | Dev/staging first; no prod promotion until smoke checklist in this epic passes. |

**Epic 1 smoke checklist (after every `supabase db push` / prod migration):**

- [ ] Re-run **Database → Advisors** (security + performance) and **`supabase db lint`**; fix or ticket new findings (same pass as **E1-006**).
- [ ] *(Optional, targeted)* If advisors flag **RLS initplan** / per-row `auth.uid()` on policies that live in `20260404044720_remote_schema.sql` (e.g. Realtime), add a **small follow-up migration** that only `DROP POLICY` / `CREATE POLICY` those names — use `(select auth.uid())` per `.agents/skills/supabase-postgres-best-practices/references/security-rls-performance.md`; do **not** edit the giant dump by hand.

---

## Skills — use for every Epic 1 implementation

| Skill | Path | When |
|-------|------|------|
| **Supabase Edge Functions** | `.claude/skills/supabase/supabase-edge-functions/SKILL.md` | HTTP handlers, JWT, Zod, service role, `verify_jwt`, deploying functions that write P1 rows |
| **Supabase Realtime** | `.claude/skills/supabase/supabase-realtime/SKILL.md` | Subscriptions on `leads` / `showings` / `payments` for live dashboards |
| **Postgres best practices** | `.claude/skills/supabase-postgres-best-practices/SKILL.md` | Indexes, RLS performance (`(select auth.uid())`), data types, EXPLAIN |
| **Repo rules** | `.claude/rules/supabase-patterns.md`, `.claude/rules/edge-function-patterns.md` | RLS patterns, response shapes, no client secrets |

---

## E1-001: Create Seed Script

```yaml
---
id: E1-001
diagram_id: MERM-06
prd_section: "7. Technical Specs — Database"
title: Create seed script for apartments, neighborhoods, and profiles
description: "Ships «Create seed script for apartments, neighborhoods, and profiles» for this epic—full scope in § Prompt below."
skill: migration
phase: CORE
priority: P0
status: Open
owner: Backend
dependencies:
  - E1-002
estimated_effort: S
percent_complete: 0
epic: E1
outcome: O1
---
```

### Prompt

Create a seed script that populates the mdeai Supabase database with realistic test data for Medellin rentals.

**Read first:**
- `tasks/mermaid/06-data-model.mmd` — **cross-check** against live columns below
- `supabase/migrations/20260404044720_remote_schema.sql` — **source of truth** for column names
- `tasks/prd-real-estate.md` Section 3 (Personas) — who the test users should represent
- `tasks/audit/07-data-audit.md` — known MERM vs DB drift

**Live `apartments` (do not assume MERM-only columns):** `neighborhood` **text** (not `neighborhood_id` unless you add it in a migration), `wifi_speed`, `minimum_stay_days` / `maximum_stay_days`, `currency` (align seed with PRD: **COP vs USD** — document conversion or store consistent unit).

**Requirements:**
- Seed file at `supabase/seed.sql` (or `supabase/functions/seed/index.ts` if programmatic)
- 20+ apartments across Laureles, El Poblado, Envigado, Sabaneta — use **`neighborhood` string** matching future **`neighborhoods.name`** if you normalize in **E1-002**
- 5+ user profiles matching PRD personas (digital nomad, remote worker, retiree, couple, family)
- **10+ neighborhoods with scores:** only if **`neighborhoods`** table exists (**E1-002**). If E1-002 is not merged yet, **do not** reference `neighborhoods` in seed; use **`apartments.neighborhood`** text + optional **`metadata` JSON** for scores until the table exists
- Realistic prices — **state COP or USD** explicitly in seed comments / `currency` field
- Proper foreign key relationships (only columns that **exist**)
- Idempotent: `ON CONFLICT` / stable UUIDs for test users

### Acceptance Criteria
- [ ] `supabase/seed.sql` exists and runs **after** migrations it depends on (see ordering above)
- [ ] `apartments` table has 20+ rows with images, amenities, coordinates
- [ ] `profiles` table has 5+ users matching PRD personas
- [ ] If **`neighborhoods`** exists: 10+ rows with scores; else: **document** that scores live in **`neighborhoods`** (post–E1-002) or in **`apartments.metadata`**
- [ ] No invalid FKs: use **`neighborhood` text** on `apartments` unless you add **`neighborhood_id`** in a migration
- [ ] Running twice doesn't create duplicates (UPSERT or ON CONFLICT)
- [ ] `npm run build` passes; regenerate **`src/integrations/supabase/database.types.ts`** (`supabase gen types`) if types change

---

## E1-002: Create P1 Tables

```yaml
---
id: E1-002
diagram_id: MERM-06
prd_section: "7. Technical Specs — Database"
title: Add 6 P1 tables (leads, showings, payments, rental_applications, property_verifications, neighborhoods)
description: "Ships «Add 6 P1 tables (leads, showings, payments, rental_applications, property_verifications, neighbor…» for this epic—full scope in § Prompt below."
skill: migration
phase: CORE
priority: P0
status: Open
owner: Backend
dependencies: []
estimated_effort: M
percent_complete: 0
epic: E1
outcome: O2
---
```

### Prompt

Create a Supabase migration adding the 6 P1 tables defined in MERM-06 (data model diagram).

**Read first:**
- `tasks/mermaid/06-data-model.mmd` — full table definitions with columns and relationships
- `supabase/migrations/20260404044720_remote_schema.sql` — existing tables to reference
- `tasks/index.md` — "New tables (planned)" section for the table list
- **`bookings`:** pipeline may link payments to **`bookings.id`** using existing **`payment_status`** on `bookings`; a dedicated **`payments`** table is for extra Stripe fields / history — **do not** assume `listing_id` on `bookings` (prod uses **`resource_id`**)

**Tables to create:**
1. `leads` — CRM lead tracking (source, score, status, assigned_agent)
2. `showings` — Property showing appointments (lead_id, apartment_id, scheduled_at, status)
3. `payments` — Payment records linked to Stripe (booking_id, amount, stripe_pi_id, status) — **optional** if all payment state stays on `bookings`; still create if MERM requires a ledger
4. `rental_applications` — Application submissions (lead_id, apartment_id, documents, ai_summary)
5. `property_verifications` — Listing verification status (apartment_id, verified_by, status)
6. `neighborhoods` — Normalized neighborhood rows with scores (then **optionally** add `neighborhood_id` FK on `apartments` in a follow-up migration **or** keep text + sync via trigger — **decide in ADR**)

**Rules:**
- **Repo status:** P1 is implemented as **six** migrations (`20260404120000`–`20260404120005`); prefer **editing forward** with new timestamps if you change schema after apply
- All tables must have RLS enabled
- Use `(select auth.uid())` subquery pattern in RLS policies
- Foreign keys with appropriate ON DELETE behavior
- Add indexes on foreign key columns and filter columns
- Include `created_at` and `updated_at` timestamps on all tables

### Acceptance Criteria
- [ ] All 6 tables exist in migrations (see `20260404120000_p1_*.sql` files) **or** equivalent consolidated migration
- [ ] RLS enabled on every table with appropriate policies (**E1-004** = review gaps vs these files)
- [ ] Foreign keys reference existing tables correctly (`apartments`, `bookings`, `profiles`, etc.)
- [ ] Indexes on: lead_id, apartment_id, booking_id, status columns
- [ ] `supabase db push` or `supabase migration up` succeeds
- [ ] Regenerate TypeScript types: `supabase gen types typescript --local` → `src/integrations/supabase/database.types.ts` (or project-standard path)

---

## E1-003: Add Indexes on Filter/Sort Columns

```yaml
---
id: E1-003
diagram_id: MERM-06
prd_section: "7. Technical Specs — Database"
title: Add indexes on filter and sort columns for query performance
description: "Ships «Add indexes on filter and sort columns for query performance» for this epic—full scope in § Prompt below."
skill: migration
phase: CORE
priority: P0
status: Open
owner: Backend
dependencies:
  - E1-002
estimated_effort: S
percent_complete: 0
epic: E1
outcome: O10
---
```

### Prompt

Audit existing and new tables for missing indexes, then create a migration adding them.

**Read first:**
- `tasks/mermaid/06-data-model.mmd` — all table schemas
- `src/hooks/useApartments.ts`, `src/hooks/useCars.ts` — which columns are filtered/sorted
- `supabase/functions/ai-search/index.ts` — which columns the search queries

**Index targets:**
- `apartments`: price, **neighborhood** (text), status, created_at — **embedding / pgvector** only after: **`CREATE EXTENSION vector`**, a **`vector`** column, and agreed MERM alignment (**see 07-data-audit C4**)
- `leads`: status, created_at, assigned_agent_id
- `showings`: scheduled_at, status
- `bookings`: **use `start_date` / `end_date`** (live columns), status, **`resource_id`**, `booking_type` — not `check_in` / `check_out` unless you add those columns
- `rental_applications`: status, created_at
- Composite indexes where multiple columns are commonly filtered together

### Acceptance Criteria
- [ ] Migration file adds all missing indexes **without duplicating** existing indexes (live DB already indexes many listing columns — diff first)
- [ ] **pgvector:** extension enabled + **`embedding`** column exists **before** ivfflat/hnsw index; otherwise **defer** this AC to a follow-up task
- [ ] Migration applies cleanly

---

## E1-004: Configure RLS for New Tables

```yaml
---
id: E1-004
diagram_id: MERM-06
prd_section: "7. Technical Specs — Security"
title: Configure RLS policies for all P1 tables
description: "Ships «Configure RLS policies for all P1 tables» for this epic—full scope in § Prompt below."
skill: migration
phase: CORE
priority: P0
status: Open
owner: Backend
dependencies:
  - E1-002
estimated_effort: S
percent_complete: 0
epic: E1
outcome: O9
---
```

### Prompt

Create comprehensive RLS policies for all 6 P1 tables following the existing patterns.

**Read first:**
- `supabase/migrations/20260404044720_remote_schema.sql` — existing RLS patterns
- `.claude/rules/supabase-patterns.md` — RLS policy rules
- `tasks/mermaid/06-data-model.mmd` — table ownership relationships

**Policy patterns:**
- `leads`: Agents can view assigned leads; **inserts from Edge Functions** use **service role on the server** — **do not** disable RLS or grant anon INSERT; policies must still define who may read/update
- `showings`: Renters see their own, hosts see showings for their apartments
- `payments`: Renters see their own payments, hosts see payments for their bookings
- `rental_applications`: Renters see their own, hosts see applications for their apartments
- `property_verifications`: Public read for verification badges, admin write
- `neighborhoods`: Public read (no auth required for viewing neighborhood data)

**Use `(select auth.uid())` subquery pattern — not direct `auth.uid()`.**

**Service role:** only in **Edge Functions / server**; never expose **service role key** to the client. RLS remains **on** for all tables.

### Acceptance Criteria
- [ ] Every P1 table has RLS enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- [ ] SELECT policies scope to correct user role
- [ ] INSERT/UPDATE/DELETE restricted appropriately (not “open to anon”)
- [ ] Uses `(select auth.uid())` subquery pattern
- [ ] No table is publicly writable without explicit business justification
- [ ] Policy names follow `{table}_{operation}_{role}` convention

---

## E1-005: Regenerate app types + fix imports

```yaml
---
id: E1-005
diagram_id: MERM-06
title: Regenerate Supabase TypeScript types after P1 migrations
description: "Ships «Regenerate Supabase TypeScript types after P1 migrations» for this epic—full scope in § Prompt below."
skill: supabase-cli
phase: CORE
priority: P0
status: Open
owner: Backend
dependencies:
  - E1-002
estimated_effort: XS
epic: E1
outcome: O2
---
```

### Prompt

After P1 migrations apply, regenerate types so the frontend matches Postgres.

**Read first:** `.claude/skills/supabase-postgres-best-practices/SKILL.md` (schema changes → types).

**Commands (pick one):**

```bash
supabase gen types typescript --linked > src/integrations/supabase/database.types.ts
# or --local when using supabase start
```

### Acceptance Criteria

- [ ] `src/integrations/supabase/database.types.ts` includes P1 tables
- [ ] `npm run build` passes; fix any broken `Database` references

---

## E1-006: DB lint + advisor remediation

```yaml
---
id: E1-006
title: Run Supabase database linter and fix security/performance findings
description: "Ships «Run Supabase database linter and fix security/performance findings» for this epic—full scope in § Prompt below."
skill: supabase-postgres-best-practices
phase: CORE
priority: P1
status: Open
owner: Backend
dependencies:
  - E1-002
estimated_effort: S
epic: E1
outcome: O10
---
```

### Prompt

Use **`supabase db lint`** (CLI) and the **Dashboard → Database → Advisors** (security + performance). Address or document:

- RLS on PostGIS `spatial_ref_sys` (if flagged) — see [Supabase linter 0013](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public)
- Extensions in `public` (postgis, pg_trgm) — move or accept with comment
- Leaked-password protection (Auth) — dashboard toggle
- Missing indexes on FKs after any new FK you add later

**Read first:** `.claude/skills/supabase-postgres-best-practices/references/security-rls-performance.md`, `schema-foreign-key-indexes.md`

### Acceptance Criteria

- [ ] `supabase db lint` clean **or** remaining items ticketed with owner
- [ ] Security advisor ERRORs triaged (fix or documented waiver)
- [ ] After each deploy that applies migrations: **re-run advisors + lint** (see **Epic 1 smoke checklist** above); optional targeted RLS policy migration for `remote_schema` policies only if flagged

---

## E1-007: Optional — pgvector + listing embeddings

```yaml
---
id: E1-007
title: Enable vector extension and embedding column (Hermes / ai-search)
description: "Ships «Enable vector extension and embedding column (Hermes / ai-search)» for this epic—full scope in § Prompt below."
skill: supabase-postgres-best-practices
phase: ADVANCED
priority: P2
status: Open
owner: Backend
dependencies:
  - E1-003
estimated_effort: M
epic: E1
outcome: O10
---
```

### Prompt

Only if **06E** / product requires semantic search on listings: migration to `CREATE EXTENSION vector` (if not present), add **`embedding`** column (e.g. on `apartments` or a side table), then **ivfflat/hnsw** index per **E1-003**.

**Read first:** `tasks/audit/07-data-audit.md` (live may have **no** `vector` extension); `.claude/skills/supabase-postgres-best-practices/references/query-index-types.md`

### Acceptance Criteria

- [ ] Extension + column + index in migrations; **E1-003** AC for pgvector satisfied **or** task closed as “not doing” with ADR

---

## E1-008: Edge functions for P1 writes (service role)

```yaml
---
id: E1-008
title: Secure server paths to insert/update P1 CRM rows
description: "Ships «Secure server paths to insert/update P1 CRM rows» for this epic—full scope in § Prompt below."
skill: supabase-edge-functions
phase: CORE
priority: P1
status: Open
owner: Backend
dependencies:
  - E1-002
  - E1-004
estimated_effort: M
epic: E1
outcome: O9
---
```

### Prompt

Client **anon** must not bulk-write `leads` / `payments`. Add or extend **Edge Functions** that:

- Validate JWT / body with **Zod**
- Use **service role** only **inside** Deno (env secrets)
- Return `{ success, data | error }` per `.claude/rules/edge-function-patterns.md`

**Read first:** `.claude/skills/supabase/supabase-edge-functions/SKILL.md`, `supabase/config.toml` (`verify_jwt` — handlers must still auth when required)

### Acceptance Criteria

- [ ] At least one documented path for creating leads / recording payments without exposing service role to Vite
- [ ] Rate limits / logging aligned with `edge-function-patterns.md`

---

## E1-009: Wire Realtime (optional dashboards)

```yaml
---
id: E1-009
title: Realtime channels for pipeline tables (if UI needs live updates)
description: "Ships «Realtime channels for pipeline tables (if UI needs live updates)» for this epic—full scope in § Prompt below."
skill: supabase-realtime
phase: ADVANCED
priority: P2
status: Open
owner: Frontend
dependencies:
  - E1-002
estimated_effort: S
epic: E1
outcome: O2
---
```

### Prompt

If ops dashboards show **leads** / **showings** live, enable **Realtime** for those tables (publication + RLS-safe channels).

**Read first:** `.claude/skills/supabase/supabase-realtime/SKILL.md`

### Acceptance Criteria

- [ ] Realtime enabled only where needed; RLS verified for subscribed roles

---

## E1-010: Sync MERM-06 + docs to deployed schema

```yaml
---
id: E1-010
title: Reconcile MERM-06 and task diagrams with production columns
description: "Ships «Reconcile MERM-06 and task diagrams with production columns» for this epic—full scope in § Prompt below."
skill: documentation
phase: CORE
priority: P1
status: Open
owner: Tech lead
dependencies:
  - E1-002
  - E1-005
estimated_effort: S
epic: E1
outcome: O2
---
```

### Prompt

Update `tasks/mermaid/06-data-model.mmd` (and related PRD sections) so **`apartments`**, **`bookings`**, and **P1** tables match **migrations** — removes Hermes / E2 confusion.

**Read first:** `tasks/audit/07-data-audit.md` (MERM vs live)

### Acceptance Criteria

- [ ] Diagram column names match Postgres (or diagram notes “planned migration”)
- [ ] E2+ prompts can reference this doc without wrong `listing_id` / `wifi_mbps` assumptions

---

## E1-011: Local / CI verification

```yaml
---
id: E1-011
title: Document supabase db reset + seed for dev onboarding
description: "Ships «Document supabase db reset + seed for dev onboarding» for this epic—full scope in § Prompt below."
skill: supabase-cli
phase: CORE
priority: P2
status: Open
owner: Backend
dependencies:
  - E1-001
estimated_effort: XS
epic: E1
outcome: O1
---
```

### Prompt

Add to **`CLAUDE.md`** or **`docs/`** (short): how to run **`supabase start`**, **`supabase db reset`**, load **`seed.sql`**, and run **`npm run build`** — so Epic 1 is reproducible.

### Acceptance Criteria

- [ ] New teammate can get DB + seed + types in documented order
- [ ] Optional: GitHub Action step `supabase db lint` on PR (if CLI available in CI)

