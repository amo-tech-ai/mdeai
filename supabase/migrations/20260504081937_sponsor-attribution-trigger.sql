-- ============================================================
-- Task 051: sponsor attribution trigger
-- Last-click 24h attribution on event_orders INSERT/UPDATE
-- ============================================================

-- Check if event_orders has buyer_anon_id; add if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'event_orders'
      AND column_name  = 'buyer_anon_id'
  ) THEN
    ALTER TABLE public.event_orders ADD COLUMN buyer_anon_id text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS event_orders_buyer_anon_idx
  ON public.event_orders(buyer_anon_id)
  WHERE buyer_anon_id IS NOT NULL;

-- Attribution function
CREATE OR REPLACE FUNCTION sponsor.attribute_order()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public, sponsor
AS $$
DECLARE
  v_click  sponsor.clicks%ROWTYPE;
BEGIN
  -- Only attribute paid orders
  IF NEW.status != 'paid' THEN RETURN NEW; END IF;

  BEGIN
    -- Find most recent click within 24h for this viewer
    SELECT c.* INTO v_click
      FROM sponsor.clicks c
     WHERE (
       (NEW.buyer_user_id IS NOT NULL AND c.viewer_user_id = NEW.buyer_user_id)
       OR
       (NEW.buyer_anon_id IS NOT NULL AND c.viewer_anon_id = NEW.buyer_anon_id)
     )
     AND c.created_at >= now() - interval '24 hours'
     ORDER BY c.created_at DESC
     LIMIT 1;

    IF FOUND THEN
      INSERT INTO sponsor.attributions
        (placement_id, click_id, conversion_kind, conversion_value_cents, attributed_at)
      VALUES
        (v_click.placement_id, v_click.id, 'purchase',
         GREATEST(0, COALESCE(NEW.total_cents, 0)), now())
      ON CONFLICT DO NOTHING;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Attribution failure must never block the order INSERT
    RAISE WARNING 'sponsor.attribute_order failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Drop and recreate trigger (idempotent)
DROP TRIGGER IF EXISTS event_orders_sponsor_attribution ON public.event_orders;
CREATE TRIGGER event_orders_sponsor_attribution
  AFTER INSERT OR UPDATE OF status ON public.event_orders
  FOR EACH ROW EXECUTE FUNCTION sponsor.attribute_order();
