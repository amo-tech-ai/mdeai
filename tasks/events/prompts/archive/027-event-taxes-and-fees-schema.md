---
task_id: 027-event-taxes-and-fees-schema
title: event_taxes_and_fees — Colombia IVA 19% + service fees per organizer
phase: PHASE-1.5-EVENTS
priority: P1
status: Done
estimated_effort: 1 day
area: backend
skill:
  - supabase
  - supabase-postgres-best-practices
  - mdeai-project-gates
edge_function: null
schema_tables:
  - public.event_taxes_and_fees       # NEW
  - public.event_ticket_taxes_and_fees # NEW (M:N pivot)
depends_on: ['001-event-schema-migration', '004-ticket-checkout-edge-fn']
mermaid_diagram: ../diagrams/18-mvp-gap.md
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-1.5-EVENTS — compliance-critical for Colombia commerce |
| **Schema** | 1 NEW main table + 1 M:N pivot |
| **Why now** | Colombia IVA 19% on ticket sales is mandatory; without this organizers can't legally invoice attendees |
| **Real-world** | Sofía sets IVA 19% as default for all her events; configures a $500 COP service fee per ticket; Camila's $40,000 GA shows: subtotal $40k + IVA $7,600 + service $500 = $48,100 total |

## Description

**The situation.** Phase 1 ships with `event_orders.total_cents` as a flat number — no tax/fee breakdown. Colombian law (Ley 1607/2012, IVA 19% on event ticket sales) requires displaying tax on every invoice. The audit's HE-2 marked this as a 🚨 release blocker.

**Why per-organizer (not per-event).** Organizers reuse the same tax/fee config across events. Setting it once at the organizer level (with optional per-event override) saves the wizard from asking on every new event.

**Why an M:N pivot.** Some tax/fee rules apply to all tickets, others only to specific tiers (e.g., "service fee only on VIP+"). The pivot lets organizers attach rules to one or many tickets.

**Updated checkout math (task 004).** During `ticket_checkout_create_pending`: compute subtotal = `price_cents × quantity`; compute tax_cents and fee_cents from applicable rules; total_cents = subtotal + tax_cents + fee_cents − discount_cents.

## The migration

```sql
CREATE TABLE public.event_taxes_and_fees (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id        uuid NOT NULL REFERENCES public.profiles(id),
  name                text NOT NULL,                              -- "IVA 19%", "Service fee", "Booking fee"
  type                text NOT NULL CHECK (type IN ('TAX','FEE')),
  calculation_type    text NOT NULL CHECK (calculation_type IN ('FIXED','PERCENTAGE')),
  rate                numeric(10,3) NOT NULL CHECK (rate >= 0),  -- e.g., 19.0 for 19% or 50000 for COP fixed
  is_active           boolean NOT NULL DEFAULT true,
  is_default          boolean NOT NULL DEFAULT false,             -- auto-attach to new tickets
  description         text,
  display_order       int NOT NULL DEFAULT 0,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX event_taxes_and_fees_org_idx ON public.event_taxes_and_fees(organizer_id);
ALTER TABLE  public.event_taxes_and_fees ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER event_taxes_and_fees_set_updated_at BEFORE UPDATE ON public.event_taxes_and_fees
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.event_ticket_taxes_and_fees (
  ticket_id   uuid NOT NULL REFERENCES public.event_tickets(id) ON DELETE CASCADE,
  tax_fee_id  uuid NOT NULL REFERENCES public.event_taxes_and_fees(id) ON DELETE CASCADE,
  PRIMARY KEY (ticket_id, tax_fee_id)
);
ALTER TABLE public.event_ticket_taxes_and_fees ENABLE ROW LEVEL SECURITY;

-- Add per-order breakdown columns
ALTER TABLE public.event_orders
  ADD COLUMN subtotal_cents int NOT NULL DEFAULT 0 CHECK (subtotal_cents >= 0),
  ADD COLUMN tax_cents      int NOT NULL DEFAULT 0 CHECK (tax_cents >= 0),
  ADD COLUMN fee_cents      int NOT NULL DEFAULT 0 CHECK (fee_cents >= 0);
-- (discount_cents already added in task 025; total_cents = subtotal + tax + fee - discount)
```

## RLS policies

```sql
-- Organizer manages own; public can SELECT for invoice display
CREATE POLICY tax_fee_organizer_all ON public.event_taxes_and_fees FOR ALL
  USING (organizer_id = (select auth.uid()));
CREATE POLICY tax_fee_public_select ON public.event_taxes_and_fees FOR SELECT
  USING (is_active = true);

CREATE POLICY ticket_tax_fee_public_select ON public.event_ticket_taxes_and_fees FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.event_tickets t JOIN public.events e ON e.id = t.event_id
    WHERE t.id = event_ticket_taxes_and_fees.ticket_id AND e.status IN ('published','live')
  ));
CREATE POLICY ticket_tax_fee_organizer_all ON public.event_ticket_taxes_and_fees FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.event_tickets t JOIN public.events e ON e.id = t.event_id
    WHERE t.id = event_ticket_taxes_and_fees.ticket_id AND e.organizer_id = (select auth.uid())
  ));
```

## Calculation helper

```sql
CREATE OR REPLACE FUNCTION public.compute_ticket_total(
  p_ticket_id uuid, p_quantity int, p_discount_cents int
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  v_ticket public.event_tickets%ROWTYPE;
  v_subtotal int;
  v_tax int := 0;
  v_fee int := 0;
  v_rule public.event_taxes_and_fees%ROWTYPE;
BEGIN
  SELECT * INTO v_ticket FROM public.event_tickets WHERE id = p_ticket_id;
  v_subtotal := v_ticket.price_cents * p_quantity - p_discount_cents;

  FOR v_rule IN
    SELECT t.* FROM public.event_taxes_and_fees t
    JOIN public.event_ticket_taxes_and_fees pivot ON pivot.tax_fee_id = t.id
    WHERE pivot.ticket_id = p_ticket_id AND t.is_active
  LOOP
    DECLARE v_amount int;
    BEGIN
      IF v_rule.calculation_type = 'PERCENTAGE' THEN
        v_amount := round(v_subtotal * v_rule.rate / 100);
      ELSE
        v_amount := round(v_rule.rate * p_quantity);
      END IF;
      IF v_rule.type = 'TAX' THEN v_tax := v_tax + v_amount;
                              ELSE v_fee := v_fee + v_amount; END IF;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'subtotal_cents', v_subtotal,
    'tax_cents',      v_tax,
    'fee_cents',      v_fee,
    'total_cents',    v_subtotal + v_tax + v_fee
  );
END;
$$;
```

## Acceptance Criteria

- [ ] Tables + indexes + triggers + RLS created.
- [ ] `event_orders` has `subtotal_cents`, `tax_cents`, `fee_cents` columns.
- [ ] Default Colombia IVA 19% rule auto-creates for new organizers (seeded via task 002 wizard).
- [ ] `compute_ticket_total` returns correct breakdown for: 1× $40k GA + 19% IVA = `{subtotal: 40000, tax: 7600, fee: 0, total: 47600}`.
- [ ] PERCENTAGE rules compound correctly with FIXED rules (e.g., IVA 19% + $500 COP service fee).
- [ ] Task 004 checkout updated to call `compute_ticket_total` and persist breakdown.
- [ ] PDF (task 005) shows itemized tax + fee.

## See also

- [`001-event-schema-migration.md`](./001-event-schema-migration.md)
- [`004-ticket-checkout-edge-fn.md`](./004-ticket-checkout-edge-fn.md) — calls `compute_ticket_total`
- [`005-ticket-payment-webhook.md`](./005-ticket-payment-webhook.md) — PDF includes breakdown
- [`100-events-prd.md`](../100-events-prd.md) §4.6.2 (HE-2 release blocker)
