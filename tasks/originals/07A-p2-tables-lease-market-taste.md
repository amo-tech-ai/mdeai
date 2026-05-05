---
id: 07A
diagram_id: MERM-06
prd_section: "7. Technical Specs — Database"
title: Add P2 tables (lease_reviews, market_snapshots, taste_profiles)
skills:
  - migration
  - mdeai-tasks
epic: E7
phase: ADVANCED
priority: P2
status: Open
owner: Backend
dependencies: []
estimated_effort: M
percent_complete: 0
outcome: O4
---

# E7-001: Add P2 Tables (Lease Reviews, Market Snapshots, Taste Profiles)

```yaml
---
id: E7-001
diagram_id: MERM-06
prd_section: "7. Technical Specs — Database"
title: Add P2 tables (lease_reviews, market_snapshots, taste_profiles)
skill: migration
phase: ADVANCED
priority: P2
status: Open
owner: Backend
dependencies: []
estimated_effort: M
percent_complete: 0
epic: E7
outcome: O4
---
```

### Prompt

Create a Supabase migration adding the 3 P2 tables defined in MERM-06 for contract analysis, market data, and user preferences.

**Epic index:** [`07E-contract-automation.md`](07E-contract-automation.md)

**Read first:**
- `tasks/mermaid/06-data-model.mmd` — P2 table definitions
- `supabase/migrations/` — existing migration files for patterns
- `.claude/rules/supabase-patterns.md` — RLS, indexes, naming conventions

**Tables to create:**

1. `lease_reviews` — AI lease analysis results
   - `id` (uuid, PK)
   - `user_id` (uuid, FK → profiles)
   - `apartment_id` (uuid, FK → apartments)
   - `document_url` (text) — Supabase Storage path
   - `ai_summary` (jsonb) — structured analysis: terms, risks, flags
   - `risk_score` (integer, 0-100) — overall risk assessment
   - `status` (text: 'pending', 'analyzed', 'reviewed', 'flagged')
   - `reviewed_by` (uuid, nullable, FK → profiles) — human reviewer
   - `created_at`, `updated_at`

2. `market_snapshots` — Periodic neighborhood market data
   - `id` (uuid, PK)
   - `neighborhood_id` (uuid, FK → neighborhoods)
   - `snapshot_date` (date)
   - `avg_rent_1br`, `avg_rent_2br`, `avg_rent_3br` (integer, COP)
   - `median_rent` (integer, COP)
   - `active_listings` (integer)
   - `new_listings` (integer)
   - `occupancy_estimate` (decimal)
   - `price_change_pct` (decimal)
   - `ai_summary` (text, nullable)
   - `created_at`

3. `taste_profiles` — User preference learning
   - `id` (uuid, PK)
   - `user_id` (uuid, FK → profiles, UNIQUE)
   - `neighborhood_preferences` (jsonb) — `{ neighborhood: weight }`
   - `budget_tendency` (jsonb) — `{ min: number, max: number }`
   - `amenity_affinity` (jsonb) — `{ amenity: weight }`
   - `property_type_preference` (jsonb)
   - `signal_count` (integer) — total events processed
   - `last_updated_from` (text) — 'search', 'click', 'save'
   - `created_at`, `updated_at`

**Rules:**
- Migration file: `supabase/migrations/YYYYMMDDHHMMSS_add_p2_tables.sql`
- RLS enabled on all tables
- Users can read their own lease_reviews and taste_profiles
- market_snapshots are public read
- Service role for writes from edge functions
- Indexes on: user_id, apartment_id, neighborhood_id, snapshot_date, status

### Acceptance Criteria
- [ ] Migration creates all 3 tables
- [ ] RLS enabled with appropriate policies
- [ ] Foreign keys reference existing tables
- [ ] Indexes on filter and foreign key columns
- [ ] `supabase db push` or `supabase migration up` succeeds
- [ ] TypeScript types updated if needed

**Next:** [`07B-contract-analysis-edge.md`](07B-contract-analysis-edge.md) (depends on this task).
