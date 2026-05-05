---
id: 06D
diagram_id: MERM-07
prd_section: "5. AI agent architecture — Hermes market intelligence"
title: Implement market intelligence snapshots
skills:
  - supabase/supabase-edge-functions
  - mdeai-tasks
epic: E6
phase: MVP
priority: P2
status: Open
owner: Backend
dependencies:
  - E1-002
estimated_effort: M
percent_complete: 0
outcome: O3
---

# E6-004: Implement Market Intelligence Snapshots

```yaml
---
id: E6-004
diagram_id: MERM-07
prd_section: "5. AI agent architecture — Hermes market intelligence"
title: Implement market intelligence snapshots
skill: edge-function
phase: MVP
priority: P2
status: Open
owner: Backend
dependencies:
  - E1-002
estimated_effort: M
percent_complete: 0
epic: E6
outcome: O3
---
```

### Prompt

Build the market intelligence system that captures periodic snapshots of rental market conditions per neighborhood.

**Read first:**
- `tasks/mermaid/07-agent-architecture.mmd` — Hermes: Market Intelligence, price trends, snapshots
- `tasks/mermaid/06-data-model.mmd` — market_snapshots table (P2)
- `supabase/functions/` — existing edge function patterns
- [`06E-hermes-intelligence.md`](06E-hermes-intelligence.md) — G1–G5 for optional Gemini summary

**The build:**
- New edge function at `supabase/functions/market-snapshot/index.ts`
- Endpoints:
  - `GET /latest` — Latest snapshot per neighborhood
  - `GET /trends?neighborhood=X&period=30d` — Price trends over time
  - `POST /generate` — Trigger snapshot generation (called by scheduler — see below)
- **Scheduler mechanism:** Use Supabase `pg_cron` extension (`SELECT cron.schedule('market-snapshot', '0 6 * * 0', ...)`) to call POST /generate every Sunday at 6 AM COT. If pg_cron is unavailable on the project tier, fall back to Vercel Cron (`vercel.json` cron config) calling the edge function URL. Paperclip heartbeat (E5) can also trigger this as a backup, but the primary scheduler must not depend on Paperclip being operational.
- Snapshot data per neighborhood:
  - Average rent (by bed count)
  - Median rent
  - Listing count (active)
  - Occupancy estimate — **Formula:** `occupancy = booked_nights / (active_listings × 30) × 100` where `booked_nights` counts confirmed bookings in the past 30 days and `active_listings` counts apartments with `status = 'active'` in that neighborhood. If booking data is insufficient (<10 bookings in neighborhood), mark occupancy as `null` with a `"low_confidence"` flag.
  - Price change % vs. previous snapshot
  - New listings count since last snapshot
- Store in `market_snapshots` table
- Optionally use Gemini to generate a natural language summary

**Example:**
Sunday heartbeat triggers market snapshot. For Laureles: avg rent 3.8M COP (2BR), median 3.5M, 45 active listings (3 new this week), occupancy ~85%, price +2.1% vs. last month. Gemini summarizes: "Laureles market tightening slightly — prices up 2% with high occupancy. Good time for landlords, renters should act fast on sub-4M listings."

### Acceptance Criteria
- [ ] GET /latest returns most recent snapshot per neighborhood
- [ ] GET /trends returns price history with period parameter
- [ ] POST /generate creates new snapshot from current apartment data
- [ ] Snapshot includes: avg rent, median, listing count, occupancy, price change %
- [ ] Optional Gemini summary using G1 structured JSON + G5 citation persistence (log to ai_runs)
- [ ] Callable from scheduler (pg_cron primary, Vercel Cron fallback, Paperclip heartbeat backup)
- [ ] Occupancy formula uses `booked_nights / (active_listings × 30) × 100`; marks `null` + `low_confidence` when <10 bookings
- [ ] Zod validates all inputs
- [ ] CORS headers set correctly

## Feature success (goals → shippable features)

Aligned with [`PROMPT-VERIFICATION.md`](../PROMPT-VERIFICATION.md) §6 (Goal · Workflow · Proof · Gates · Rollout), [`.claude/skills/mde-writing-plans/SKILL.md`](../../../.claude/skills/mde-writing-plans/SKILL.md) (user stories + observable proof), and optionally [`.agents/skills/tasks-generator/SKILL.md`](../../../.agents/skills/tasks-generator/SKILL.md) (PRD → tasks).

| Layer | Intent |
|-------|--------|
| **Goal** | Neighborhood market snapshot is cacheable and cited in concierge copy. |
| **Workflow** | Scheduled job → aggregate → store → API. |
| **Proof** | Snapshot date visible; stale data labeled. |
| **Gates** | Read-only public or RLS as designed. |
| **Rollout** | Daily/weekly batch. |

---

