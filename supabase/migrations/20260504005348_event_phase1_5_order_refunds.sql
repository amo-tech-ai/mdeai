-- =============================================================================
-- Task 026: event_order_refunds — full + partial refund tracking
-- Phase 1.5 EVENTS
-- =============================================================================

CREATE TABLE public.event_order_refunds (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          uuid NOT NULL REFERENCES public.event_orders(id) ON DELETE CASCADE,
  amount_cents      int NOT NULL CHECK (amount_cents > 0),
  currency          text NOT NULL DEFAULT 'COP',
  reason            text CHECK (reason IN
    ('customer_request','duplicate','fraudulent','event_cancelled','organizer_decision','chargeback','other')),
  reason_detail     text,
  initiated_by      uuid REFERENCES auth.users(id),
  initiated_via     text NOT NULL CHECK (initiated_via IN ('stripe_dashboard','organizer_ui','admin_api','automated')),
  stripe_refund_id  text UNIQUE,
  attendee_ids      uuid[],
  status            text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','completed','failed','reversed')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  completed_at      timestamptz
);

CREATE INDEX event_order_refunds_order_idx        ON public.event_order_refunds(order_id);
CREATE INDEX event_order_refunds_initiated_by_idx ON public.event_order_refunds(initiated_by) WHERE initiated_by IS NOT NULL;
CREATE INDEX event_order_refunds_status_idx ON public.event_order_refunds(status);
CREATE INDEX event_order_refunds_stripe_idx ON public.event_order_refunds(stripe_refund_id)
  WHERE stripe_refund_id IS NOT NULL;

ALTER TABLE public.event_order_refunds ENABLE ROW LEVEL SECURITY;

-- Buyer sees own order's refunds
CREATE POLICY refunds_buyer_select ON public.event_order_refunds FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.event_orders o
    WHERE o.id = event_order_refunds.order_id AND o.buyer_user_id = (select auth.uid())
  ));

-- Organizer sees all refunds on their events
CREATE POLICY refunds_organizer_select ON public.event_order_refunds FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.event_orders o
    JOIN public.events e ON e.id = o.event_id
    WHERE o.id = event_order_refunds.order_id AND e.organizer_id = (select auth.uid())
  ));

-- v2 refund RPC: records refund row, updates order status, flips attendees
CREATE OR REPLACE FUNCTION public.ticket_payment_refund_v2(
  p_order_id        uuid,
  p_amount_cents    int,
  p_reason          text,
  p_stripe_refund_id text,
  p_initiated_by    uuid,
  p_initiated_via   text,
  p_attendee_ids    uuid[]
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  v_order          public.event_orders%ROWTYPE;
  v_refund_id      uuid;
  v_total_refunded int;
BEGIN
  SELECT * INTO v_order FROM public.event_orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND'; END IF;
  IF v_order.status NOT IN ('paid','partial_refund') THEN
    RAISE EXCEPTION 'ORDER_NOT_REFUNDABLE: %', v_order.status;
  END IF;

  -- 1. Insert refund record
  INSERT INTO public.event_order_refunds
    (order_id, amount_cents, currency, reason, initiated_by, initiated_via,
     stripe_refund_id, attendee_ids, status, completed_at)
  VALUES
    (p_order_id, p_amount_cents, v_order.currency, p_reason, p_initiated_by,
     p_initiated_via, p_stripe_refund_id, p_attendee_ids, 'completed', now())
  RETURNING id INTO v_refund_id;

  -- 2. Compute cumulative completed refunds
  SELECT COALESCE(SUM(amount_cents), 0) INTO v_total_refunded
    FROM public.event_order_refunds
   WHERE order_id = p_order_id AND status = 'completed';

  -- 3. Flip order status
  IF v_total_refunded >= v_order.total_cents THEN
    UPDATE public.event_orders SET status = 'refunded' WHERE id = p_order_id;
  ELSE
    UPDATE public.event_orders SET status = 'partial_refund' WHERE id = p_order_id;
  END IF;

  -- 4a. Full refund: all active attendees → refunded + decrement qty_sold
  IF p_attendee_ids IS NULL THEN
    UPDATE public.event_attendees SET status = 'refunded'
     WHERE order_id = p_order_id AND status = 'active';
    UPDATE public.event_tickets
       SET qty_sold = GREATEST(0, qty_sold - v_order.quantity)
     WHERE id = v_order.ticket_id;
  -- 4b. Partial refund: only specified attendees
  ELSE
    UPDATE public.event_attendees SET status = 'refunded'
     WHERE id = ANY(p_attendee_ids) AND status = 'active';
    UPDATE public.event_tickets
       SET qty_sold = GREATEST(0, qty_sold - array_length(p_attendee_ids, 1))
     WHERE id = v_order.ticket_id;
  END IF;

  RETURN v_refund_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ticket_payment_refund_v2(uuid, int, text, text, uuid, text, uuid[]) TO service_role;

COMMENT ON TABLE  public.event_order_refunds IS 'Per-order refund records. Supports multiple partial refunds. Stripe replay-safe via UNIQUE stripe_refund_id.';
COMMENT ON FUNCTION public.ticket_payment_refund_v2 IS 'Atomic refund: inserts event_order_refunds row, flips order status, flips attendees, decrements qty_sold.';
