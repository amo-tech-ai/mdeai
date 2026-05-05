-- Migration: sponsor_rollup_dispute_freeze_fix
-- The original rollup_roi_daily() was created before the dispute_freeze column
-- was added (migration 20260504260000). Disputed applications must have their
-- ROI rollup frozen so the audit window shows consistent numbers.
-- This replaces the function with a version that JOINs through placements →
-- applications and skips any application where dispute_freeze = true.
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
    COUNT(DISTINCT i.id)                      AS impressions,
    COUNT(DISTINCT c.id)                      AS clicks,
    COUNT(DISTINCT a.id)                      AS attributed_conversions,
    COALESCE(SUM(a.conversion_value_cents), 0) AS attributed_revenue_cents
  FROM (
    -- Only include placements whose application is NOT frozen for dispute audit
    SELECT DISTINCT pl.id AS placement_id
    FROM sponsor.impressions im
    JOIN sponsor.placements pl   ON pl.id = im.placement_id
    JOIN sponsor.applications ap ON ap.id = pl.application_id
    WHERE im.created_at >= CURRENT_DATE
      AND COALESCE(ap.dispute_freeze, false) = false
    UNION
    SELECT DISTINCT pl.id AS placement_id
    FROM sponsor.clicks cl
    JOIN sponsor.placements pl   ON pl.id = cl.placement_id
    JOIN sponsor.applications ap ON ap.id = pl.application_id
    WHERE cl.created_at >= CURRENT_DATE
      AND COALESCE(ap.dispute_freeze, false) = false
    UNION
    SELECT DISTINCT pl.id AS placement_id
    FROM sponsor.attributions atr
    JOIN sponsor.placements pl   ON pl.id = atr.placement_id
    JOIN sponsor.applications ap ON ap.id = pl.application_id
    WHERE atr.attributed_at >= CURRENT_DATE
      AND COALESCE(ap.dispute_freeze, false) = false
  ) p
  LEFT JOIN sponsor.impressions  i ON i.placement_id = p.placement_id
    AND i.created_at  >= CURRENT_DATE
  LEFT JOIN sponsor.clicks       c ON c.placement_id = p.placement_id
    AND c.created_at  >= CURRENT_DATE
  LEFT JOIN sponsor.attributions a ON a.placement_id = p.placement_id
    AND a.attributed_at >= CURRENT_DATE
  GROUP BY p.placement_id
  ON CONFLICT (placement_id, day)
  DO UPDATE SET
    impressions              = EXCLUDED.impressions,
    clicks                   = EXCLUDED.clicks,
    attributed_conversions   = EXCLUDED.attributed_conversions,
    attributed_revenue_cents = EXCLUDED.attributed_revenue_cents;
END;
$$;

-- Smoke test: function must exist and be SECURITY DEFINER
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'sponsor'
      AND p.proname = 'rollup_roi_daily'
      AND p.prosecdef = true
  ) THEN
    RAISE EXCEPTION 'MIGRATION FAILED: rollup_roi_daily not found or not SECURITY DEFINER';
  END IF;
  -- Verify it runs without error (no data yet, should be a no-op)
  PERFORM sponsor.rollup_roi_daily();
END $$;
