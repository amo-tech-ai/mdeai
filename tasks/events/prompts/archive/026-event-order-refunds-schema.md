---
task_id: 026-event-order-refunds-schema
title: event_order_refunds — full + partial refund tracking
phase: PHASE-1.5-EVENTS
priority: P1
status: Done
estimated_effort: 0.5 day
area: backend
skill:
  - supabase
  - supabase-postgres-best-practices
  - mdeai-project-gates
edge_function: null
schema_tables:
  - public.event_order_refunds  # NEW
depends_on: ['001-event-schema-migration', '005-ticket-payment-webhook']
mermaid_diagram: ../diagrams/18-mvp-gap.md
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-1.5-EVENTS |
| **Schema** | 1 NEW table |
| **Why now** | Phase 1's `ticket_payment_refund` RPC flips order status but doesn't preserve refund history (multiple partial refunds, who initiated, why); chargebacks become unreviewable once volume picks up |
| **Real-world** | Camila refunds her $40 GA via Stripe Dashboard; mdeai records `event_order_refunds(amount=40, reason='customer_changed_plans', initiated_by=admin@mdeai)`. Sofía sees full history in the dashboard 6 weeks later when reconciling |

## Description

**The situation.** Phase 1 ships with refund handling that flips `event_orders.status` to `refunded` but loses all detail (when, who, partial amount, reason). The audit's HE-2 flagged this as a 🚨 critical gap — once chargeback volume picks up, manual reconciliation becomes impossible.

**Why a separate refund table.** A single order can have multiple partial refunds over time (e.g., refund 1 of 4 attendees due to a no-show concession, then 2 of the remaining 3 later). Storing as JSONB on `event_orders` blocks queryable history. A 1:N child table is the standard pattern Hi.Events + Eventbrite use.

**What this changes in task 005 webhook.** On `charge.refunded`, instead of just calling `ticket_payment_refund`, the webhook records a new `event_order_refunds` row with the Stripe refund ID, amount, and reason. If the cumulative refund equals the order total, flips `event_orders.status` to `refunded`; if less, flips to `partial_refund` (status added in task 001).

## The migration

```sql
CREATE TABLE public.event_order_refunds (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            uuid NOT NULL REFERENCES public.event_orders(id) ON DELETE CASCADE,
  amount_cents        int NOT NULL CHECK (amount_cents > 0),
  currency            text NOT NULL DEFAULT 'COP',
  reason              text CHECK (reason IN
    ('customer_request','duplicate','fraudulent','event_cancelled','organizer_decision','chargeback','other')),
  reason_detail       text,
  initiated_by        uuid REFERENCES auth.users(id),       -- nullable: anonymous (Stripe Dashboard refund)
  initiated_via       text NOT NULL CHECK (initiated_via IN ('stripe_dashboard','organizer_ui','admin_api','automated')),
  stripe_refund_id    text UNIQUE,                          -- Stripe's refund object id (e.g., "re_xxx")
  attendee_ids        uuid[],                                -- which attendees were refunded (null = full order)
  status              text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','completed','failed','reversed')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  completed_at        timestamptz
);
CREATE INDEX event_order_refunds_order_idx  ON public.event_order_refunds(order_id);
CREATE INDEX event_order_refunds_status_idx ON public.event_order_refunds(status);
CREATE INDEX event_order_refunds_stripe_idx ON public.event_order_refunds(stripe_refund_id) WHERE stripe_refund_id IS NOT NULL;
ALTER TABLE  public.event_order_refunds ENABLE ROW LEVEL SECURITY;
```

## RLS policies

```sql
-- Buyer sees own; organizer sees own event's refunds; service-role writes
CREATE POLICY refunds_buyer_select ON public.event_order_refunds FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.event_orders o WHERE o.id = event_order_refunds.order_id
      AND o.buyer_user_id = (select auth.uid())
  ));
CREATE POLICY refunds_organizer_select ON public.event_order_refunds FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.event_orders o
    JOIN public.events e ON e.id = o.event_id
    WHERE o.id = event_order_refunds.order_id AND e.organizer_id = (select auth.uid())
  ));
```

## Updated refund RPC (replaces task 005's simple `ticket_payment_refund`)

```sql
CREATE OR REPLACE FUNCTION public.ticket_payment_refund_v2(
  p_order_id uuid, p_amount_cents int, p_reason text, p_stripe_refund_id text,
  p_initiated_by uuid, p_initiated_via text, p_attendee_ids uuid[]
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_order        public.event_orders%ROWTYPE;
  v_refund_id    uuid;
  v_total_refunded int;
BEGIN
  SELECT * INTO v_order FROM public.event_orders WHERE id = p_order_id FOR UPDATE;
  IF v_order.status NOT IN ('paid','partial_refund') THEN
    RAISE EXCEPTION 'ORDER_NOT_REFUNDABLE: %', v_order.status;
  END IF;

  -- 1. Insert refund record
  INSERT INTO public.event_order_refunds
    (order_id, amount_cents, currency, reason, initiated_by, initiated_via, stripe_refund_id, attendee_ids, status, completed_at)
  VALUES
    (p_order_id, p_amount_cents, v_order.currency, p_reason, p_initiated_by, p_initiated_via, p_stripe_refund_id, p_attendee_ids, 'completed', now())
  RETURNING id INTO v_refund_id;

  -- 2. Compute cumulative refund
  SELECT COALESCE(SUM(amount_cents), 0) INTO v_total_refunded
    FROM public.event_order_refunds WHERE order_id = p_order_id AND status = 'completed';

  -- 3. Flip order status
  IF v_total_refunded >= v_order.total_cents THEN
    UPDATE public.event_orders SET status = 'refunded' WHERE id = p_order_id;
  ELSE
    UPDATE public.event_orders SET status = 'partial_refund' WHERE id = p_order_id;
  END IF;

  -- 4. Flip attendees + decrement qty_sold
  IF p_attendee_ids IS NULL THEN
    -- Full refund: all active attendees → refunded
    UPDATE public.event_attendees SET status = 'refunded' WHERE order_id = p_order_id AND status = 'active';
    UPDATE public.event_tickets SET qty_sold = GREATEST(0, qty_sold - v_order.quantity) WHERE id = v_order.ticket_id;
  ELSE
    -- Partial refund: only specified attendees
    UPDATE public.event_attendees SET status = 'refunded' WHERE id = ANY(p_attendee_ids) AND status = 'active';
    UPDATE public.event_tickets SET qty_sold = GREATEST(0, qty_sold - array_length(p_attendee_ids, 1))
     WHERE id = v_order.ticket_id;
  END IF;

  RETURN v_refund_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.ticket_payment_refund_v2(uuid, int, text, text, uuid, text, uuid[]) TO service_role;
```

## Acceptance Criteria

- [ ] Table + indexes + RLS created.
- [ ] Stripe webhook (task 005) updated to call `ticket_payment_refund_v2` with the Stripe refund ID + amount.
- [ ] Full refund: cumulative refunds = order total → status = `refunded`; all attendees → `refunded`; qty_sold decremented by full quantity.
- [ ] Partial refund (1 of 3 attendees): cumulative < total → status = `partial_refund`; only that attendee flipped; qty_sold decremented by 1.
- [ ] Two partial refunds summing to the full amount → final status flips to `refunded`.
- [ ] Stripe replay (same `stripe_refund_id`) → UNIQUE constraint catches; second insert raises constraint violation; webhook handles gracefully.

## See also

- [`001-event-schema-migration.md`](./001-event-schema-migration.md) — `partial_refund` status was added there
- [`005-ticket-payment-webhook.md`](./005-ticket-payment-webhook.md) — calls this RPC
- [`003-host-event-dashboard.md`](./003-host-event-dashboard.md) — refund history panel uses this table
