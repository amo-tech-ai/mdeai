---
task_id: 053-sponsor-roi-rollup-cron
title: sponsor-roi-rollup — pg_cron aggregate impressions + clicks + attributions into roi_daily
phase: PHASE-2-SPONSOR-GROWTH
priority: P1
status: Open
estimated_effort: 0.5 day
area: backend
skill:
  - supabase
  - supabase-postgres-best-practices
  - mdeai-project-gates
edge_function: null
schema_tables:
  - sponsor.roi_daily
  - sponsor.impressions
  - sponsor.clicks
  - sponsor.attributions
depends_on:
  - '051-sponsor-attribution-trigger'
  - '045-sponsor-schema-migration'
mermaid_diagram: null
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-2-SPONSOR-GROWTH — raw event rows are too slow to aggregate on every dashboard load |
| **Mechanism** | pg_cron job every 5 minutes → upserts into `sponsor.roi_daily` |
| **Real-world** | 412k impression rows exist for Postobón's placement. Without rollup, the dashboard query would GROUP BY all 412k rows on every page load. With rollup: one row per `(placement_id, day)` — the dashboard reads 30 rows |

## Description

**The situation.** `sponsor.impressions`, `sponsor.clicks`, and `sponsor.attributions` accumulate raw event rows. Dashboard queries against these tables grow unbounded as volume increases. At 1M impressions/day, a dashboard GROUP BY takes seconds.

**Why pg_cron (not an edge fn cron).** `sponsor.roi_daily` is a Postgres table. Aggregation inside Postgres is faster than pulling rows to an edge fn. pg_cron is already used in this project (task 023). No cold-start latency.

**What already exists.** pg_cron extension is enabled (`supabase/config.toml`). `sponsor.roi_daily` table (task 045) has the right columns.

## Rollup SQL (runs every 5 minutes via pg_cron)

```sql
CREATE OR REPLACE FUNCTION sponsor.rollup_roi_daily()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public, sponsor
AS $$
BEGIN
  -- Upsert today's rollup for all placements with activity in the last 10 minutes
  -- (5-min window + 5-min buffer for late-arriving rows)
  INSERT INTO sponsor.roi_daily
    (placement_id, day, impressions, clicks, attributed_conversions, attributed_revenue_cents)
  SELECT
    p.placement_id,
    CURRENT_DATE AS day,
    COUNT(DISTINCT i.id) AS impressions,
    COUNT(DISTINCT c.id) AS clicks,
    COUNT(DISTINCT a.id) AS attributed_conversions,
    COALESCE(SUM(a.conversion_value_cents), 0) AS attributed_revenue_cents
  FROM (
    -- Union all placement_ids active today (excluding dispute-frozen applications)
    SELECT DISTINCT pl.id AS placement_id
    FROM sponsor.impressions im
    JOIN sponsor.placements pl ON pl.id = im.placement_id
    JOIN sponsor.applications ap ON ap.id = pl.application_id
    WHERE im.created_at >= CURRENT_DATE AND COALESCE(ap.dispute_freeze, false) = false
    UNION
    SELECT DISTINCT pl.id AS placement_id
    FROM sponsor.clicks cl
    JOIN sponsor.placements pl ON pl.id = cl.placement_id
    JOIN sponsor.applications ap ON ap.id = pl.application_id
    WHERE cl.created_at >= CURRENT_DATE AND COALESCE(ap.dispute_freeze, false) = false
    UNION
    SELECT DISTINCT pl.id AS placement_id
    FROM sponsor.attributions atr
    JOIN sponsor.placements pl ON pl.id = atr.placement_id
    JOIN sponsor.applications ap ON ap.id = pl.application_id
    WHERE atr.attributed_at >= CURRENT_DATE AND COALESCE(ap.dispute_freeze, false) = false
  ) p
  LEFT JOIN sponsor.impressions  i ON i.placement_id = p.placement_id AND i.created_at  >= CURRENT_DATE
  LEFT JOIN sponsor.clicks       c ON c.placement_id = p.placement_id AND c.created_at  >= CURRENT_DATE
  LEFT JOIN sponsor.attributions a ON a.placement_id = p.placement_id AND a.attributed_at >= CURRENT_DATE
  GROUP BY p.placement_id
  ON CONFLICT (placement_id, day)
  DO UPDATE SET
    impressions              = EXCLUDED.impressions,
    clicks                   = EXCLUDED.clicks,
    attributed_conversions   = EXCLUDED.attributed_conversions,
    attributed_revenue_cents = EXCLUDED.attributed_revenue_cents;
END;
$$;

-- Schedule: every 5 minutes (UTC — Supabase pg_cron always runs UTC)
-- For Bogotá (UTC-5) this means the day boundary rolls at 19:00 Bogotá local time.
-- The `CURRENT_DATE` in the rollup uses UTC date. Dashboard displays may need
-- to adjust for UTC-5 if showing "today's" numbers to Colombian sponsors.
SELECT cron.schedule(
  'sponsor-roi-rollup',
  '*/5 * * * *',
  $$ SELECT sponsor.rollup_roi_daily(); $$
);

-- Note: This is the LIVE DATA rollup cron (every 5 min).
-- The AI insight cron (sponsor-roi-explain daily at 06:00 Bogotá) is SEPARATE — see task 054.
-- Do not confuse these two cron jobs.
```

## Historical backfill (run once on deploy)

```sql
-- Backfill all days with existing data (handles rows before cron was scheduled)
INSERT INTO sponsor.roi_daily
  (placement_id, day, impressions, clicks, attributed_conversions, attributed_revenue_cents)
SELECT
  placement_id,
  DATE(created_at) AS day,
  COUNT(DISTINCT i.id) AS impressions,
  0, 0, 0
FROM sponsor.impressions i
GROUP BY placement_id, DATE(created_at)
ON CONFLICT (placement_id, day) DO UPDATE SET
  impressions = sponsor.roi_daily.impressions + EXCLUDED.impressions;
-- Repeat for clicks and attributions similarly
```

## Acceptance Criteria

- [ ] `sponsor.rollup_roi_daily()` function created; no syntax errors.
- [ ] pg_cron job registered with name `'sponsor-roi-rollup'`; visible via `SELECT * FROM cron.job WHERE jobname='sponsor-roi-rollup'`.
- [ ] Smoke test: insert 1000 synthetic impression rows for one placement → run `SELECT sponsor.rollup_roi_daily()` → confirm `roi_daily` row shows impressions=1000.
- [ ] Running the rollup twice (idempotency): `ON CONFLICT DO UPDATE` overwrites with fresh counts — no double-counting.
- [ ] Rollup skips applications with `dispute_freeze = true` (disputes freeze the audit window — see task 058).
- [ ] Historical backfill script documented in the migration file as a comment block.
- [ ] `get_advisors(type: "performance")` shows no new issues on `sponsor.*` tables after migration.
- [ ] Rollup completes in < 2 seconds at 10k impression rows (EXPLAIN ANALYZE in migration notes).

## See also

- [`052-sponsor-dashboard.md`](052-sponsor-dashboard.md) — dashboard reads `roi_daily`
- [`045-sponsor-schema-migration.md`](045-sponsor-schema-migration.md) — `roi_daily` table
