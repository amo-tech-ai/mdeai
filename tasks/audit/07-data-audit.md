# Data layer forensic audit — Supabase + Epic 1 (`01E-data-foundation.md`)

| Field | Value |
|-------|--------|
| **Role** | Senior software specialist + forensic auditor |
| **Scope** | `tasks/prompts/01E-data-foundation.md`, `supabase/migrations/`, `supabase/config.toml`, `tasks/mermaid/06-data-model.mmd`, `docs/audits/database-schema-audit.md`, `.claude/rules/supabase-patterns.md` |
| **Note** | The vendored **`.claude/skills/supabase/supabase-edge-functions/SKILL.md`** describes another codebase (one big Hono server). For **mde**, follow **`CLAUDE.md`**, **`.claude/rules/supabase-patterns.md`**, and **`.claude/rules/edge-function-patterns.md`** instead. |

---

## Executive summary

**What we checked:** Whether Epic 1’s written plan matches what’s in the repo (migrations, seed, diagrams, edge config) and whether you can safely build the **real-estate pipeline** (leads → showings → applications) on top of it.

| Dimension | Score | In plain terms |
|-----------|-------|----------------|
| **01E prompt quality** (structure, acceptance criteria) | **78%** | Tasks are readable and mention RLS/indexes, but **task order is wrong** and **diagrams don’t match the DB** in a few important places. |
| **Schema vs MERM-06 / E6** | **52%** | **`apartments`** and **`bookings`** don’t match the MERM diagram; **P1 CRM tables** from the plan **aren’t in migrations** yet. |
| **Implementation state** (seed, P1 migrations) | **~0%** | There is **no** `supabase/seed.sql` and **no** `add_p1_tables`-style migration in repo; **`database-schema-audit.md`** still shows **0 rows** — nothing to demo against. |
| **Supabase config hygiene** | **35%** | Every edge function has **`verify_jwt = false`** — the gateway won’t reject bad JWTs for you; handlers must enforce auth (see **`03E`**, **`progress.md`**). |
| **Weighted “data plan correctness”** | **~44%** | The **intent** is strong; **delivery and consistency** are behind. |

**Bottom line:** The **remote schema** is a **usable base** for listings and auth, but **Epic 1 is not done**: **no seed**, **no P1 tables**, and **MERM / `06E` / `01E`** disagree on **columns** (scores, embeddings, stay length). **Fix task order and one “source of truth” schema story before** you invest in bulk seeding or E2 features.

---

## Critical — errors, red flags, blockers

### C1 — E1 task order contradicts the database you need

**Finding:** In **`01E`**, the story reads: first **E1-001** (seed), then **E1-002** (P1 tables). The YAML makes **E1-002** depend on **E1-001** (`dependencies: [E1-001]`) — i.e. “do seed before P1 tables,” which conflicts with needing tables before seed data.

**Why that breaks in practice:** **E1-001** is supposed to seed **neighborhoods** (10+ rows with scores and FKs). If the **`neighborhoods`** table is only created in **E1-002**, running the seed **first** fails with something like: `relation "neighborhoods" does not exist`. The prompt also says *“create `neighborhoods` if not already there”* — which hides the real rule: **migrations before seed**, not the other way around.

**Fix (pick one and make YAML + narrative match):**

1. **Option A — migrations first:** Ship **E1-002** (P1 tables + `neighborhoods` if needed), **then** **E1-001** seed. Flip dependencies: **E1-001** depends on **E1-002**.
2. **Option B — split seed:** **E1-001** only seeds tables that **already exist** (e.g. `apartments`, `profiles`); **E1-002** adds P1; a **follow-up seed** (E1-001b or second file) loads `neighborhoods` / pipeline data.

**Until fixed:** Anyone running seeds in doc order hits a **hard stop** — not a flaky test, a missing table.

---

### C2 — P1 tables not in repo migrations

**Finding:** In **`20260404044720_remote_schema.sql`** there are **no** tables named like **`leads`**, **`showings`**, **`rental_applications`**, **`property_verifications`**, **`neighborhoods`** (as a first-class table), or a dedicated **`payments`** table as **01E** / MERM describe (Stripe may live elsewhere — still, the **pipeline storage** isn’t there).

**Real-world gap:** **E2** tasks (capture a lead, book a showing) have **nowhere to INSERT** as specified until **E1-002** (or equivalent) lands.

**Blocker:** Treat **E1-002** as **mandatory** before pipeline epics — not a nice-to-have.

---

### C3 — No seed file

**Finding:** No **`supabase/seed.sql`** (or scripted seed) under **`supabase/`**.

**What that means day-to-day:** **E1-001** isn’t implemented; the DB stays empty; demos, Hermes ranking, and “journey” tests have **no realistic rows** to query.

---

### C4 — MERM-06 vs live `apartments` — naming and columns diverge

**Finding:** **`tasks/mermaid/06-data-model.mmd`** shows **`apartments`** with e.g. `wifi_mbps`, `safety_score`, `walkability_score`, `nomad_score`, `min_stay_months` / `max_stay_months`, and a **vector embedding**.

**Live migration** has **`wifi_speed`** (not “mbps” in the name), **`minimum_stay_days` / `maximum_stay_days`**, and **no** `safety_score`, `walkability_score`, `nomad_score`, or **`embedding`** on `apartments` (no pgvector column there).

**Why it matters:**

- **`06E` (Hermes ranking)** may assume signals that **aren’t columns** — you’ll need **computed** fields, **other tables**, or **new migrations**.
- **`01E-003`** calls for a **pgvector index on `embedding`** — that column **isn’t on `apartments`** today, so the migration text is **invalid until** embeddings exist **somewhere** you agree on.

**Red flag:** Pick **one** contract: update **MERM + prompts** to match production, **or** migrate the DB to match the diagram — don’t let three sources drift forever.

---

### C5 — `bookings` vs MERM — different shapes

**Finding:** Production **`bookings`** uses **`booking_type`**, **`resource_id`**, **`resource_title`** (generic “thing being booked”). **MERM-06** often shows **`listing_id`** as the link to a listing.

**Live DB also has** **`payment_status`** (and related payment fields) — so the gap is mainly **identity**: **`resource_id`** is the polymorphic key, not **`listing_id`**. Treat MERM’s `listing_id` as “**the UUID of the booked thing**,” which in prod maps to **`resource_id`** + **`booking_type`**.

**Impact:** E2 code or prompts that reference **`listing_id`** literally will **miss** unless you **rename in docs** or **map** `listing_id` → `(booking_type, resource_id)`.

---

### C6 — E1-004 wording vs safe RLS

**Finding:** **E1-004** language can sound like “use service role so inserts work” — the **safe** pattern is: **edge function uses service role on the server**; **RLS** must still **block** anonymous clients from writing arbitrary rows. Bad paraphrase → people **turn off RLS** or **open INSERT to anon**.

**Impact:** Mis-read policy text → **data exposure** or **broken** edge writes.

---

## High — failure points

| ID | Issue | What goes wrong |
|----|--------|-----------------|
| H1 | **Single very large migration** (`20260404044720_remote_schema.sql`, ~9k lines) | Reviews are painful; **E1-002** should be **small, reviewable** migrations whenever possible. |
| H2 | **Nullable FKs** on `created_by` / roles (per **`database-schema-audit.md`**) | Seeds and the app must **not** leave orphan or meaningless FKs. |
| H3 | **RLS policy count** differs across listing tables | Some tables may be **too open** or **too tight** — **re-check per table** after P1. |
| H4 | **`verify_jwt = false`** for all functions in **`config.toml`** | Not “schema,” but it means **you** must validate JWTs in code — otherwise **03E**-style abuse paths stay open. |

---

## Medium — gaps & improvements

| ID | Gap | Suggestion |
|----|-----|------------|
| M1 | Seed must be **safe to run twice** | Use **`ON CONFLICT`** + stable UUIDs for test users; document how devs **reset** data. |
| M2 | **`neighborhood` text** on listings vs **`neighborhoods` table** | Decide: **normalize** (FK + scores) for maps/ranking, or **document** that scoring lives in **JSON** / admin-only. |
| M3 | **Currency** — listings often **USD** in schema; PRD stresses **COP** | Align seed + UI; don’t mix currencies without a **stated** conversion rule. |
| M4 | **Types** — E1-002 mentions **`src/types/`** | Regenerate **`database.types.ts`** after migrations (`supabase gen types typescript`). |

---

## Best practices checklist (mde-specific)

| Practice | Source | Status |
|----------|--------|--------|
| Schema changes only via **`supabase/migrations/`** | `supabase-patterns.md` | OK for new work; **P1 not in repo yet** |
| RLS on all tables; **`(select auth.uid())`** pattern | `supabase-patterns.md`, **01E** | Existing tables: yes; **P1: pending** |
| Indexes on FK + filter columns | `supabase-patterns.md`, **01E-003** | **Revisit** after P1 lands |
| No raw SQL from the browser | `supabase-patterns.md` | Matches app pattern |
| Service role **only** server-side (edge, jobs) | `supabase-patterns.md` | Must match **E1-004** intent |
| Edge: JWT + Zod + rate limits | `edge-function-patterns` / **03E** | Cross-cutting — **production** depends on it |

**Skill caveat:** Ignore **“single Hono server”** edge layout from the vendored **`supabase-edge-functions/SKILL.md`**. **mde** uses **one folder per function** under **`supabase/functions/`**.

---

## Critical fixes (priority order)

1. **Fix E1 dependencies in YAML and prose** — **E1-002** (P1 + `neighborhoods` if needed) **before** a seed that references those tables; update **`01E-data-foundation.md`** everywhere it disagrees.
2. **Add focused migration(s)** for **P1** + **RLS** + **indexes** per **E1-002–004** — avoid one unreadable mega-change unless the team explicitly accepts it.
3. **Reconcile MERM-06** with **`apartments`** / **`bookings`** — add columns (e.g. **embedding**, scores) **or** update MERM + **06E** to match **production**.
4. **Add `supabase/seed.sql`** (or equivalent) per **E1-001** — idempotent, realistic money/units, **valid FKs**.
5. **Regenerate TypeScript types** after schema changes.
6. **Tighten JWT story** — **`verify_jwt`**, handler checks, **03E** — before calling the pipeline **production-ready**.

---

## Suggested improvements (non-blocking)

- **ADR: neighborhoods** — free text vs normalized table + scores (for **maps + Hermes**).
- **Seed personas** — tie test **`profiles`** to PRD personas with **fixed UUIDs** so support can reproduce bugs.
- **CI:** `supabase db lint` / migration dry-run on PR if the CLI is in CI.
- **Ops:** document backup / PITR for production (Supabase dashboard).

---

## “Percent correct” — how we scored

| Component | Weight | Score | Rationale |
|-----------|--------|-------|-----------|
| 01E prompt clarity & ACs | 20% | 78% | Solid RLS/index guidance; **dependency** mistake pulls score down |
| Schema vs MERM / E6 alignment | 25% | 52% | **`apartments`** drift; **P1** missing |
| Repo implementation (seed, P1) | 30% | 5% | Schema snapshot exists; **seed + P1** do not |
| RLS / security patterns (docs) | 15% | 72% | Rules are sound; **edge JWT** config is weak |
| Config + observability | 10% | 40% | **`verify_jwt`** off everywhere |

**Approximate weighted score:**  
0.2×78 + 0.25×52 + 0.30×5 + 0.15×72 + 0.10×40 ≈ **44%** as a **holistic “data foundation is correct and shippable”** score.

**Readiness** for “seeded CRM + pipeline in dev”: about **5–10%** until **E1-002** and **E1-001** actually ship.

---

## Verdict

| Question | Answer |
|----------|--------|
| Can we run **01E** exactly as written end-to-end? | **Not yet** — **task order** and **MERM vs DB** must be fixed first. |
| What’s the biggest delivery risk? | **Building E2** assuming **P1 tables** or **MERM column names** that **aren’t in Postgres**. |
| Is the current Supabase schema useless? | **No** — **~29 `public` tables** (including PostGIS **`spatial_ref_sys`**) support the core app; the **pipeline + seed story** in the PRD is **unfinished** until **E1** completes. |

---

## Live database verification (MCP Supabase — 2026-04-04)

**Method:** Queries against the **linked** Supabase project via **`user-supabase`** MCP (`list_tables`, `execute_sql`, `list_edge_functions`, `get_advisors`). Use this as **evidence** for the findings above; re-run after migrations.

### Schema summary

| Check | Live result | Confirms |
|--------|-------------|----------|
| **`public` base tables** | **29** (includes **`spatial_ref_sys`** from PostGIS) | Slightly more than “28 app tables” if you count only business tables — **28** is fine as **round** count excluding `spatial_ref_sys`. |
| **P1 pipeline tables** (`leads`, `showings`, `rental_applications`, `property_verifications`, `neighborhoods`, `payments`) | **None** present | **C2** ✅ |
| **`apartments` scoring / embedding** | **`wifi_speed`**, **`minimum_stay_days`**, **`maximum_stay_days`** only (no `safety_score`, `nomad_score`, `embedding` in our column check) | **C4** ✅ |
| **`pgvector`** | **`vector` extension not installed** (`pg_trgm`, `postgis` present) | **Stronger than C4:** you cannot add an **`embedding vector`** column until **`CREATE EXTENSION vector`** (or enable via dashboard) + migration. |
| **RLS policies** (`public`) | **116** policies | RLS is **in use** broadly; not a substitute for per-table review (**H3**). |
| **Supabase security advisor** | **ERROR:** RLS disabled on **`public.spatial_ref_sys`** ([remediation](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public)); **WARN:** `pg_trgm` / `postgis` in `public`; leaked-password protection off | PostGIS system table is a **known** class of lint noise — confirm with [RLS on spatial_ref_sys](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public) guidance. |

### Indexes & triggers (sample)

- **Indexes:** Many **partial / composite** indexes on listings, **`bookings`** (`idx_bookings_resource`, `idx_bookings_type`, …), **`ai_runs`**, **`conversations`**, **`apartments`** (`idx_apartments_neighborhood`, `idx_apartments_location`, …). Aligned with **filter-heavy** app queries.
- **Triggers:** Heaviest on **`messages`**, **`trips`**, **`trip_items`**, **`proactive_suggestions`**, **`agent_jobs`** (likely `updated_at` / counters). No separate audit of trigger **logic** here — spot-check in migrations if behavior seems wrong.

### Edge functions (deployed vs repo)

| Deployed (live) | `verify_jwt` | Notes |
|-----------------|--------------|--------|
| `ai-chat`, `ai-router`, `ai-search`, `ai-trip-planner`, `ai-optimize-route`, `ai-suggest-collections`, `google-directions`, `rules-engine`, `rentals` | **false** (all) | Matches **`supabase/config.toml`** for the **9** repo functions. |
| **`whatsapp-webhook`** | **false** | **Deployed** on project but **no** matching folder under **`supabase/functions/`** in this repo — track in **ops/config** (deployed from elsewhere or stale). |

**Implication:** **H4** holds — gateway does **not** enforce JWT; each handler must validate when required.

---

## Agents, Gemini 3, OpenClaw / Hermes / Paperclip — wiring reality

**Database “agents” (live):** Enum **`agent_type`** on **`conversations`** / **`ai_runs`** (e.g. `local_scout`, `general_concierge`, …) — **product agents**, not separate processes. **`agent_jobs`** queues **heavy** jobs (`trip_wizard`, `deep_research`, …); **worker** must consume these (if not running, jobs **stall**).

| Layer | What it is in mde | Core vs advanced |
|-------|-------------------|------------------|
| **Core** | **`ai-chat`** edge + **`useChat`** / **`FloatingChatWidget`** / **`Concierge`** → `POST …/functions/v1/ai-chat`; **`conversations`**, **`messages`**, **`ai_runs`**, **`ai_context`** in Supabase | **Ship path** for concierge UX and logging. |
| **Core** | **`ai-router`**, **`ai-search`**, **`rentals`**, **`google-directions`** — invoked from hooks / explore / trip flows as in **`CLAUDE.md`** | Needed for **routing**, **semantic-ish search**, **rentals**, **maps**. |
| **Advanced** | **Gemini 3** models in edge (see **`CLAUDE.md`** model table) — **tools** defined **inside** `ai-chat` (e.g. call **`rentals`** as tool) | Requires **stable** secrets + **rate limits**; tool surface must stay **audited**. |
| **Advanced** | **OpenClaw / Hermes / Paperclip** | **Not** Postgres tables — **orchestration** (CLI, Paperclip API, WhatsApp bridge). See **`tasks/audit/06-tasks-audit.md`**: wiring **E5/E8**, **not** implied by schema alone. **`whatsapp_messages` / `whatsapp_conversations`** exist — **Infobip + `whatsapp-webhook`** edge are the **plumbing** when you connect them. |

**Frontend ↔ backend sketch (chat):**

1. User sends message → **`useChat`** → `fetch` **`/functions/v1/ai-chat`** with JWT or anon key.  
2. Edge function calls **Gemini** + tools → streams response → client appends messages.  
3. Persist thread via Supabase client to **`conversations`** / **`messages`** (when implemented in hook paths).  
4. **`ai_runs`** rows for analytics — **must** be written from edge for production observability.

**Wizards / workflows / dashboards:** **`agent_jobs`** + **`proactive_suggestions`** + **`budget_tracking`** / **`conflict_resolutions`** support **automation-shaped** features; **full “wizard”** and **Paperclip** dashboards are **product/adapter** work — see **06-tasks-audit**, not this file alone.

---

*Re-run this audit after: P1 migrations merge, first successful seed run, MERM-06 aligned with live schema, `database.types.ts` updated, and **`vector`** extension if embeddings are required.*
