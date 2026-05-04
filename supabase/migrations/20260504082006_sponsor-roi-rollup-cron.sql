-- ============================================================
-- Task 053: sponsor ROI daily rollup (pg_cron every 5 minutes)
-- Aggregates impressions + clicks + attributions → roi_daily
-- ============================================================

CREATE OR REPLACE FUNCTION sponsor.rollup_roi_daily()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public, sponsor
AS $$
BEGIN
  INSERT INTO sponsor.roi_daily
    (placement_id, day, impressions, clicks, attributed_conversions, attributed_revenue_cents)
  SELECT
    p.placement_id,
    CURRENT_DATE AS day,
    COUNT(DISTINCT i.id)        AS impressions,
    COUNT(DISTINCT c.id)        AS clicks,
    COUNT(DISTINCT a.id)        AS attributed_conversions,
    COALESCE(SUM(a.conversion_value_cents), 0) AS attributed_revenue_cents
  FROM (
    SELECT DISTINCT placement_id FROM sponsor.impressions  WHERE created_at  >= CURRENT_DATE
    UNION
    SELECT DISTINCT placement_id FROM sponsor.clicks       WHERE created_at  >= CURRENT_DATE
    UNION
    SELECT DISTINCT placement_id FROM sponsor.attributions WHERE attributed_at >= CURRENT_DATE
  ) p
  LEFT JOIN sponsor.impressions  i ON i.placement_id = p.placement_id
    AND i.created_at  >= CURRENT_DATE
  LEFT JOIN sponsor.clicks       c ON c.placement_id = p.placement_id
    AND c.created_at  >= CURRENT_DATE
  LEFT JOIN sponsor.attributions a ON a.placement_id = p.placement_id
    AND a.attributed_at >= CURRENT_DATE
  GROUP BY p.placement_id
  ON CONFLICT (placement_id, day) DO UPDATE SET
    impressions              = EXCLUDED.impressions,
    clicks                   = EXCLUDED.clicks,
    attributed_conversions   = EXCLUDED.attributed_conversions,
    attributed_revenue_cents = EXCLUDED.attributed_revenue_cents;
END;
$$;

-- Schedule: every 5 minutes (requires pg_cron extension — already enabled in supabase/config.toml)
-- Idempotent: unschedule first so re-running migration doesn't create duplicates.
DO $$ BEGIN PERFORM cron.unschedule('sponsor-roi-rollup'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
SELECT cron.schedule(
  'sponsor-roi-rollup',
  '*/5 * * * *',
  $$ SELECT sponsor.rollup_roi_daily(); $$
);
