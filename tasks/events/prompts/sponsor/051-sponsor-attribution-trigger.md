---
task_id: 051-sponsor-attribution-trigger
title: sponsor-attribute — 24h last-click attribution on event ticket purchases
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
  - sponsor.attributions
  - sponsor.clicks
  - public.event_orders
depends_on: ['050-sponsor-impression-click-edge-fns', '045-sponsor-schema-migration']
mermaid_diagram: null
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-2-SPONSOR-GROWTH — attribution makes CPL/CPA pricing possible |
| **Mechanism** | Postgres trigger on `event_orders` INSERT (paid status) → calls attribution function |
| **Model** | Last-click within 24h on matching `(viewer_anon_id OR viewer_user_id)` |
| **Real-world** | A user clicks the Postobón leaderboard footer at 14:00. At 15:30 they buy 2 tickets to "Reina de Antioquia 2026". The order INSERT trigger finds the Postobón click within 24h → inserts one `sponsor.attributions` row (conversion_kind='purchase', conversion_value_cents=2×ticket_price_cents) |

## Description

**The situation.** Impressions and clicks land (task 050) but there is no link between a sponsor click and a subsequent purchase. Without attribution, CPL/CPA pricing is impossible and sponsor dashboards show no ROI proof.

**Why a Postgres trigger (not an edge fn called after payment).** The ticket purchase path uses `ticket_payment_confirm_v2` RPC (from the existing Phase 1.5 schema). A trigger on `event_orders` INSERT fires atomically within the same transaction — no race condition, no missed events if the caller's network drops after payment.

**What already exists.** `event_orders` table is live. `sponsor.clicks` table (task 045) holds click rows with `viewer_anon_id` and `viewer_user_id`. `sponsor.attributions` table is ready.

**The build.** One attribution function + one trigger on `event_orders`. The function looks back 24h on clicks, finds the most recent for the same viewer, and inserts an attribution row.

## Attribution function + trigger

```sql
CREATE OR REPLACE FUNCTION sponsor.attribute_order()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public, sponsor
AS $$
DECLARE
  v_click  sponsor.clicks%ROWTYPE;
  v_value  int;
BEGIN
  -- Only attribute paid orders (status='paid')
  IF NEW.status != 'paid' THEN RETURN NEW; END IF;

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

  IF NOT FOUND THEN RETURN NEW; END IF;

  -- Compute value: ticket price × quantity (minus discount)
  v_value := GREATEST(0, NEW.total_cents);

  INSERT INTO sponsor.attributions
    (placement_id, click_id, conversion_kind, conversion_value_cents, attributed_at)
  VALUES
    (v_click.placement_id, v_click.id, 'purchase', v_value, now())
  ON CONFLICT (click_id) DO NOTHING;  -- idempotent: one conversion per click (requires UNIQUE(click_id) below)

  RETURN NEW;
END;
$$;

CREATE TRIGGER event_orders_sponsor_attribution
  AFTER INSERT OR UPDATE OF status ON public.event_orders
  FOR EACH ROW EXECUTE FUNCTION sponsor.attribute_order();
```

Note: `event_orders.buyer_anon_id` column may not exist yet — add via ALTER TABLE in this migration if missing.

⚠️ CRITICAL — add UNIQUE constraint on `click_id` before deploy:
```sql
-- Required for ON CONFLICT (click_id) DO NOTHING to work correctly.
-- Without this, ON CONFLICT DO NOTHING is a no-op and duplicates accumulate.
ALTER TABLE sponsor.attributions ADD CONSTRAINT attributions_click_id_unique UNIQUE (click_id);
-- Idempotency model: one conversion event per click. Last-click = one attribution per click_id.
-- If click_id is NULL (e.g. direct purchase with no click), falls through without conflict.
```

## Anon-to-user upgrade path

When an anonymous user (with `viewer_anon_id` from a click) later signs up and completes a purchase as `buyer_user_id`:

```sql
-- On auth.users INSERT (or profiles INSERT):
-- Retro-attribute clicks from last 24h that match the session anon_id
-- This requires passing anon_id through the signup flow and storing on the session
-- Phase 2: implement via a Supabase Auth hook (auth.on_new_user trigger)
-- Phase 1: not implemented — documented here as a known gap
```

## Acceptance Criteria

- [ ] Trigger fires on `event_orders` INSERT with `status='paid'`.
- [ ] Attribution row created when a click exists within 24h for matching `buyer_user_id` or `buyer_anon_id`.
- [ ] No attribution row when no click exists within 24h (correct negative case).
- [ ] No attribution row when click is older than 24h (correct window enforcement).
- [ ] Trigger is idempotent: updating an order status to `paid` a second time does not create duplicate attribution rows (requires `UNIQUE(click_id)` constraint + `ON CONFLICT (click_id) DO NOTHING`).
- [ ] UNIQUE constraint `attributions_click_id_unique` exists on `sponsor.attributions.click_id` — verify via `\d sponsor.attributions` in psql.
- [ ] `get_advisors(type: "performance")` shows no missing FK indexes on `sponsor.attributions`.
- [ ] Trigger does not block the `event_orders` INSERT on error — use `BEGIN ... EXCEPTION WHEN OTHERS THEN NULL; END;` wrapper to isolate attribution failures.
- [ ] Smoke test: insert a synthetic click row + order row → confirm attribution appears.

## See also

- [`045-sponsor-schema-migration.md`](045-sponsor-schema-migration.md) — `sponsor.clicks` + `sponsor.attributions` tables
- [`050-sponsor-impression-click-edge-fns.md`](050-sponsor-impression-click-edge-fns.md) — click rows this reads
- [`052-sponsor-dashboard.md`](052-sponsor-dashboard.md) — attribution displayed here
