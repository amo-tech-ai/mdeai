---
task_id: 025-event-promo-codes-schema
title: event_promo_codes — sponsor comps, VIP unlocks, group-sale discounts
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
  - public.event_promo_codes  # NEW
depends_on: ['001-event-schema-migration', '004-ticket-checkout-edge-fn']
mermaid_diagram: ../diagrams/18-mvp-gap.md
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-1.5-EVENTS — fast-follow after Phase 1 launch |
| **Schema** | 1 NEW table (`event_promo_codes`) + ALTER `event_orders` to add `promo_code_id` |
| **RLS** | Public SELECT (so checkout UI can validate); organizer manages |
| **Real-world** | Sofía gives Postobón 10 comp tickets via promo code `POSTOBON-COMP-2026` (unlocks hidden VIP tier, 100% discount, 10 max usages); Camila uses public code `EARLYBIRD` for 20% off through May 31 |

## Description

**The situation.** Phase 1 ships ticket sales without promo codes. Sponsor comp tickets, VIP unlocks ("hidden" tiers behind a code), and group-sale discounts are organizer asks that surface on day 1 of any real launch.

**Why Phase 1.5 not Phase 1.** The audit's HE-2 marked promo codes as a 🚨 critical gap, but per founder May 2 reset (no over-engineering) we ship Phase 1 without them and add immediately after. ~1 day of work.

**Why an `event_promo_codes` table (not `events.promo_codes jsonb`).** We need indexes on `(event_id, code)` for fast checkout-time validation, an `unlocks_hidden_tickets` flag to make hidden tier paths cheap, and atomic `usage_count` increment on use. JSONB blob can't enforce uniqueness or atomic increment cleanly.

**What this enables in checkout (task 004 update).** During `ticket_checkout_create_pending`: if a promo code is supplied, validate it (active, in-window, has remaining usages, applies to this ticket_id), atomically increment `usage_count`, apply the discount to `total_cents`, and store `promo_code_id` on `event_orders`.

## The migration

```sql
CREATE TABLE public.event_promo_codes (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id                    uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  code                        text NOT NULL,                                    -- "POSTOBON-COMP-2026"
  discount_type               text NOT NULL CHECK (discount_type IN ('percent','fixed','free')),
  discount_value              numeric(8,2) NOT NULL CHECK (discount_value >= 0),
  applicable_ticket_ids       uuid[],                                           -- nullable = all tickets
  max_usages                  int CHECK (max_usages IS NULL OR max_usages > 0), -- nullable = unlimited
  usage_count                 int NOT NULL DEFAULT 0,
  starts_at                   timestamptz,                                      -- nullable = active immediately
  expires_at                  timestamptz,                                      -- nullable = no expiry
  unlocks_hidden_tickets      boolean NOT NULL DEFAULT false,                   -- gates hidden-tier visibility
  created_by                  uuid REFERENCES auth.users(id),
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, code),
  CHECK (usage_count <= COALESCE(max_usages, 2147483647)),
  CHECK (expires_at IS NULL OR starts_at IS NULL OR expires_at > starts_at)
);
CREATE INDEX event_promo_codes_event_idx ON public.event_promo_codes(event_id);
ALTER TABLE  public.event_promo_codes ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER event_promo_codes_set_updated_at BEFORE UPDATE ON public.event_promo_codes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Wire to event_orders
ALTER TABLE public.event_orders
  ADD COLUMN promo_code_id uuid REFERENCES public.event_promo_codes(id),
  ADD COLUMN discount_cents int NOT NULL DEFAULT 0 CHECK (discount_cents >= 0);

-- Add hidden-ticket flag (so checkout can hide tiers behind a code)
ALTER TABLE public.event_tickets
  ADD COLUMN is_hidden boolean NOT NULL DEFAULT false;
```

## RLS policies

```sql
-- Public SELECT only on active codes (checkout needs to validate without exposing all of them)
CREATE POLICY promo_codes_public_select ON public.event_promo_codes FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_promo_codes.event_id AND e.status IN ('published','live'))
    AND (starts_at  IS NULL OR starts_at  <= now())
    AND (expires_at IS NULL OR expires_at >= now())
    AND usage_count < COALESCE(max_usages, 2147483647)
  );
CREATE POLICY promo_codes_organizer_all ON public.event_promo_codes FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.events e WHERE e.id = event_promo_codes.event_id AND e.organizer_id = (select auth.uid())
  ));
```

## Atomic redemption RPC

```sql
CREATE OR REPLACE FUNCTION public.redeem_promo_code(p_event_id uuid, p_code text, p_ticket_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_promo public.event_promo_codes%ROWTYPE;
BEGIN
  SELECT * INTO v_promo FROM public.event_promo_codes
   WHERE event_id = p_event_id AND code = p_code FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'PROMO_NOT_FOUND'; END IF;
  IF v_promo.starts_at  IS NOT NULL AND v_promo.starts_at  > now() THEN RAISE EXCEPTION 'PROMO_NOT_STARTED'; END IF;
  IF v_promo.expires_at IS NOT NULL AND v_promo.expires_at < now() THEN RAISE EXCEPTION 'PROMO_EXPIRED'; END IF;
  IF v_promo.usage_count >= COALESCE(v_promo.max_usages, 2147483647) THEN RAISE EXCEPTION 'PROMO_EXHAUSTED'; END IF;
  IF v_promo.applicable_ticket_ids IS NOT NULL AND NOT (p_ticket_id = ANY(v_promo.applicable_ticket_ids))
     THEN RAISE EXCEPTION 'PROMO_TICKET_MISMATCH'; END IF;

  UPDATE public.event_promo_codes SET usage_count = usage_count + 1 WHERE id = v_promo.id;
  RETURN jsonb_build_object('promo_code_id', v_promo.id, 'discount_type', v_promo.discount_type, 'discount_value', v_promo.discount_value);
END;
$$;
GRANT EXECUTE ON FUNCTION public.redeem_promo_code(uuid, text, uuid) TO service_role;
```

## Acceptance Criteria

- [ ] `event_promo_codes` table + indexes + trigger created.
- [ ] `event_orders.promo_code_id` + `discount_cents` columns added.
- [ ] `event_tickets.is_hidden` column added.
- [ ] Atomic `redeem_promo_code` RPC enforces all 5 validation paths.
- [ ] 50 concurrent redemptions of a 10-usage code → exactly 10 succeed, 40 raise `PROMO_EXHAUSTED`.
- [ ] Hidden ticket (`is_hidden=true`) does NOT appear in public SELECT until promo unlocks it (UI logic, not schema).
- [ ] Task 004 (`ticket-checkout`) extended to call `redeem_promo_code` when buyer supplies a code.

## Wiring plan

1. Append SQL above to a new migration `<ts>_event_promo_codes.sql` (separate from task 001).
2. Update task 004 RPC `ticket_checkout_create_pending` to accept optional `p_promo_code` parameter and call `redeem_promo_code` if provided.
3. Update task 002 wizard to add a "Promo codes" sub-screen on Step 2 (`/host/event/new`).
4. Update task 008 `/me/tickets` and EventDetail to show "Have a code?" input.

## See also

- [`001-event-schema-migration.md`](./001-event-schema-migration.md)
- [`004-ticket-checkout-edge-fn.md`](./004-ticket-checkout-edge-fn.md) — extended to consume `promo_code`
- [`100-events-prd.md`](../100-events-prd.md) §4.6 (HE-2 critical gap)
