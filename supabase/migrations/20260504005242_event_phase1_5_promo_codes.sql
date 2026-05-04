-- =============================================================================
-- Task 025: event_promo_codes — sponsor comps, VIP unlocks, group discounts
-- Phase 1.5 EVENTS
-- =============================================================================

-- 1. Main promo codes table
CREATE TABLE public.event_promo_codes (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id                uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  code                    text NOT NULL,
  discount_type           text NOT NULL CHECK (discount_type IN ('percent','fixed','free')),
  discount_value          numeric(8,2) NOT NULL CHECK (discount_value >= 0),
  applicable_ticket_ids   uuid[],
  max_usages              int CHECK (max_usages IS NULL OR max_usages > 0),
  usage_count             int NOT NULL DEFAULT 0,
  starts_at               timestamptz,
  expires_at              timestamptz,
  unlocks_hidden_tickets  boolean NOT NULL DEFAULT false,
  created_by              uuid REFERENCES auth.users(id),
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, code),
  CHECK (usage_count <= COALESCE(max_usages, 2147483647)),
  CHECK (expires_at IS NULL OR starts_at IS NULL OR expires_at > starts_at)
);

CREATE INDEX event_promo_codes_event_idx      ON public.event_promo_codes(event_id);
CREATE INDEX event_promo_codes_created_by_idx ON public.event_promo_codes(created_by) WHERE created_by IS NOT NULL;
ALTER TABLE  public.event_promo_codes ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER event_promo_codes_set_updated_at
  BEFORE UPDATE ON public.event_promo_codes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Extend event_orders with promo tracking
ALTER TABLE public.event_orders
  ADD COLUMN promo_code_id uuid REFERENCES public.event_promo_codes(id),
  ADD COLUMN discount_cents int NOT NULL DEFAULT 0 CHECK (discount_cents >= 0);

-- 3. Hidden-ticket flag (gated behind a promo code)
ALTER TABLE public.event_tickets
  ADD COLUMN is_hidden boolean NOT NULL DEFAULT false;

-- 4. RLS policies
-- Public SELECT only on active, in-window, not-exhausted codes for published events
CREATE POLICY promo_codes_public_select ON public.event_promo_codes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_promo_codes.event_id AND e.status IN ('published','live')
    )
    AND (starts_at  IS NULL OR starts_at  <= now())
    AND (expires_at IS NULL OR expires_at >= now())
    AND usage_count < COALESCE(max_usages, 2147483647)
  );

CREATE POLICY promo_codes_organizer_all ON public.event_promo_codes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_promo_codes.event_id AND e.organizer_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_promo_codes.event_id AND e.organizer_id = (select auth.uid())
    )
  );

-- 5. Atomic redemption RPC — FOR UPDATE prevents double-redemption race
CREATE OR REPLACE FUNCTION public.redeem_promo_code(
  p_event_id  uuid,
  p_code      text,
  p_ticket_id uuid
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_promo public.event_promo_codes%ROWTYPE;
BEGIN
  SELECT * INTO v_promo
    FROM public.event_promo_codes
   WHERE event_id = p_event_id AND code = p_code
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PROMO_NOT_FOUND';
  END IF;
  IF v_promo.starts_at IS NOT NULL AND v_promo.starts_at > now() THEN
    RAISE EXCEPTION 'PROMO_NOT_STARTED';
  END IF;
  IF v_promo.expires_at IS NOT NULL AND v_promo.expires_at < now() THEN
    RAISE EXCEPTION 'PROMO_EXPIRED';
  END IF;
  IF v_promo.usage_count >= COALESCE(v_promo.max_usages, 2147483647) THEN
    RAISE EXCEPTION 'PROMO_EXHAUSTED';
  END IF;
  IF v_promo.applicable_ticket_ids IS NOT NULL
     AND NOT (p_ticket_id = ANY(v_promo.applicable_ticket_ids)) THEN
    RAISE EXCEPTION 'PROMO_TICKET_MISMATCH';
  END IF;

  UPDATE public.event_promo_codes
     SET usage_count = usage_count + 1
   WHERE id = v_promo.id;

  RETURN jsonb_build_object(
    'promo_code_id',  v_promo.id,
    'discount_type',  v_promo.discount_type,
    'discount_value', v_promo.discount_value
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_promo_code(uuid, text, uuid) TO service_role;

COMMENT ON TABLE  public.event_promo_codes IS 'Promo codes per event: sponsor comps, VIP unlocks, group discounts. Atomic redemption via redeem_promo_code() RPC.';
COMMENT ON COLUMN public.event_promo_codes.unlocks_hidden_tickets IS 'When true, presenting this code reveals event_tickets rows where is_hidden=true.';
COMMENT ON COLUMN public.event_tickets.is_hidden IS 'Hidden tiers not visible publicly; unlocked by a promo code with unlocks_hidden_tickets=true.';
