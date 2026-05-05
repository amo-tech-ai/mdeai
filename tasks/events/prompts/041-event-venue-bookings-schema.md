---
task_id: 041-event-venue-bookings-schema
title: event_venue_bookings — multi-event venue scheduling with EXCLUDE conflict-prevention
phase: PHASE-3-EVENTS
priority: P2
status: Open
estimated_effort: 1 day
area: backend
skill:
  - supabase
  - supabase-postgres-best-practices
  - mdeai-project-gates
edge_function: null
schema_tables:
  - public.event_venue_bookings  # NEW (with EXCLUDE USING gist)
depends_on: ['001-event-schema-migration', '038-event-venue-availability-schema']
mermaid_diagram: null
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-3-EVENTS |
| **Schema** | 1 NEW table with PostgreSQL `EXCLUDE USING gist` constraint preventing double-booking |
| **Why now** | Phase 1+2 covered single-venue / single-event. Phase 3 adds multi-event scheduling: Hotel Intercontinental hosts pageant Saturday + corporate gala Sunday + wedding Monday — none can overlap |
| **Real-world** | An external client (not Sofía) pays the hotel $5k to rent the ballroom for their wedding Oct 25. The booking blocks Sofía from picking that date for a different event |

## Description

The race-safe scheduler. PostgreSQL's `EXCLUDE USING gist` operator prevents two `confirmed` bookings from overlapping at the database level — even under concurrent inserts. No application-level locking required.

## The migration

```sql
-- Required extension (one-time)
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE public.event_venue_bookings (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id          uuid NOT NULL REFERENCES public.event_venues(id) ON DELETE CASCADE,
  event_id          uuid REFERENCES public.events(id) ON DELETE SET NULL,  -- nullable: external rentals
  client_org        text,                                  -- for external bookings
  client_contact_email text,
  client_contact_phone text,
  starts_at         timestamptz NOT NULL,                  -- event start
  ends_at           timestamptz NOT NULL,                  -- event end
  setup_starts_at   timestamptz,                           -- pre-event load-in
  teardown_ends_at  timestamptz,                           -- post-event load-out
  status            text NOT NULL DEFAULT 'inquiry'
    CHECK (status IN ('inquiry','tentative','confirmed','cancelled','completed')),
  total_cents       int CHECK (total_cents IS NULL OR total_cents >= 0),
  deposit_cents     int CHECK (deposit_cents IS NULL OR deposit_cents >= 0),
  contract_url      text,                                  -- Supabase Storage signed URL
  notes             text,
  booked_by         uuid REFERENCES auth.users(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at),
  CHECK (setup_starts_at IS NULL OR setup_starts_at <= starts_at),
  CHECK (teardown_ends_at IS NULL OR teardown_ends_at >= ends_at),
  -- THE conflict-prevention magic: confirmed bookings cannot overlap on the same venue
  EXCLUDE USING gist (
    venue_id WITH =,
    tstzrange(COALESCE(setup_starts_at, starts_at), COALESCE(teardown_ends_at, ends_at), '[]') WITH &&
  ) WHERE (status = 'confirmed')
);
CREATE INDEX event_venue_bookings_venue_idx  ON public.event_venue_bookings(venue_id, starts_at);
CREATE INDEX event_venue_bookings_event_idx  ON public.event_venue_bookings(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX event_venue_bookings_status_idx ON public.event_venue_bookings(venue_id, status);
ALTER TABLE  public.event_venue_bookings ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER event_venue_bookings_set_updated_at BEFORE UPDATE ON public.event_venue_bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

## Booking-creation RPC (atomic, with conflict-friendly error)

```sql
CREATE OR REPLACE FUNCTION public.create_venue_booking(
  p_venue_id uuid, p_event_id uuid, p_client_org text, p_client_email text,
  p_starts_at timestamptz, p_ends_at timestamptz,
  p_setup_starts_at timestamptz, p_teardown_ends_at timestamptz,
  p_total_cents int, p_status text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_id uuid;
  v_avail jsonb;
BEGIN
  -- Cross-check the availability table first (task 038)
  v_avail := public.is_venue_available(p_venue_id, p_starts_at, p_ends_at);
  IF (v_avail->>'available')::boolean = false THEN
    RAISE EXCEPTION 'VENUE_NOT_AVAILABLE: %', v_avail->>'reason';
  END IF;

  -- Insert; the EXCLUDE USING gist constraint will raise if confirmed overlap exists
  BEGIN
    INSERT INTO public.event_venue_bookings
      (venue_id, event_id, client_org, client_contact_email,
       starts_at, ends_at, setup_starts_at, teardown_ends_at,
       total_cents, status, booked_by)
    VALUES (p_venue_id, p_event_id, p_client_org, p_client_email,
            p_starts_at, p_ends_at, p_setup_starts_at, p_teardown_ends_at,
            p_total_cents, p_status, (SELECT auth.uid()))
    RETURNING id INTO v_id;
  EXCEPTION WHEN exclusion_violation THEN
    RAISE EXCEPTION 'VENUE_DOUBLE_BOOKING: a confirmed booking already exists in this window';
  END;
  RETURN jsonb_build_object('booking_id', v_id);
END;
$$;
GRANT EXECUTE ON FUNCTION public.create_venue_booking(uuid,uuid,text,text,timestamptz,timestamptz,timestamptz,timestamptz,int,text) TO authenticated;
```

## RLS policies

```sql
-- Public SELECT only on confirmed bookings (so other organizers can see "this venue is taken")
CREATE POLICY bookings_public_confirmed_select ON public.event_venue_bookings FOR SELECT
  USING (status = 'confirmed');
-- Venue owner manages all
CREATE POLICY bookings_venue_organizer_all ON public.event_venue_bookings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.event_venues v WHERE v.id = event_venue_bookings.venue_id AND v.organizer_id = (select auth.uid())));
-- Booking client (external rental) sees own
CREATE POLICY bookings_booker_select ON public.event_venue_bookings FOR SELECT
  USING (booked_by = (select auth.uid()));
```

## Acceptance Criteria

- [ ] Table + EXCLUDE constraint + indexes + RLS created.
- [ ] `btree_gist` extension enabled.
- [ ] Two `confirmed` bookings overlapping on the same venue → second insert raises `VENUE_DOUBLE_BOOKING`.
- [ ] Two `tentative` bookings can overlap (no constraint until confirmed) — supports inquiry-stage flexibility.
- [ ] Tentative → confirmed transition where the now-confirmed window overlaps another confirmed → UPDATE raises `exclusion_violation`.
- [ ] Setup + teardown windows count toward conflict (a confirmed event Saturday 10am-1am Sunday + Saturday 8am-3pm event with 2-day setup → blocked).
- [ ] Cross-check with `is_venue_available` (task 038) catches blocked-by-availability rules.
- [ ] 50 concurrent inserts on the same window → exactly 1 succeeds.

## See also

- [`038-event-venue-availability-schema.md`](./038-event-venue-availability-schema.md) — pre-check
- [`042-venue-analytics-dashboard.md`](./042-venue-analytics-dashboard.md) — utilization metrics
- PostgreSQL docs: [Range types + EXCLUDE constraint](https://www.postgresql.org/docs/current/rangetypes.html#RANGETYPES-CONSTRAINT)
