---
task_id: 038-event-venue-availability-schema
title: event_venue_availability — open/blocked time windows + iCal RRULE recurrence
phase: PHASE-2-EVENTS
priority: P1
status: Open
estimated_effort: 1 day
area: backend
skill:
  - supabase
  - supabase-postgres-best-practices
edge_function: null
schema_tables:
  - public.event_venue_availability  # NEW
depends_on: ['001-event-schema-migration']
mermaid_diagram: null
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-2-EVENTS |
| **Schema** | 1 NEW table with iCal RRULE support |
| **Real-world** | Hotel Intercontinental: open 7 days/week 8am-2am EXCEPT closed every Christmas + maintenance week first Monday in February. Sofía's wizard query "is Oct 18 8pm available" gets a fast yes/no |

## Description

Without an availability table, the wizard can only show "the venue exists" — not whether it's bookable on the date the organizer wants. This table:
- Holds explicit open/blocked windows (one-off and recurring)
- Recurring rules use iCal RRULE strings (Phase 2 — manually parsed; Phase 3 swap to a DB-side recurrence library if perf demands)
- Drives the Phase 2 task 039 venue management UI calendar

**Why a separate table from `event_venue_bookings` (task 041 in Phase 3).** Bookings are the *positive* schedule (this event uses the venue). Availability is the *negative* + *recurring* schedule (the venue is generally open between these hours, except for holidays). A booking conflicts with another booking; an availability rule blocks any booking attempt outright.

## The migration

```sql
CREATE TABLE public.event_venue_availability (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id        uuid NOT NULL REFERENCES public.event_venues(id) ON DELETE CASCADE,
  starts_at       timestamptz,                            -- nullable for pure RRULE rules
  ends_at         timestamptz,
  is_available    boolean NOT NULL,                       -- true = window is open; false = blocked
  reason          text,                                   -- "Holiday", "Maintenance", "Booked elsewhere"
  recurrence_rule text,                                   -- iCal RRULE: "FREQ=WEEKLY;BYDAY=MO"
  recurrence_start_at timestamptz,                        -- anchor for the RRULE
  recurrence_end_at   timestamptz,                        -- when the recurrence stops
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CHECK ((starts_at IS NULL AND recurrence_rule IS NOT NULL) OR (starts_at IS NOT NULL AND ends_at > starts_at))
);
CREATE INDEX event_venue_availability_venue_idx ON public.event_venue_availability(venue_id);
CREATE INDEX event_venue_availability_window_idx ON public.event_venue_availability(venue_id, starts_at, ends_at) WHERE starts_at IS NOT NULL;
ALTER TABLE  public.event_venue_availability ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER event_venue_availability_set_updated_at BEFORE UPDATE ON public.event_venue_availability
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

## Availability check helper

```sql
-- Phase 2: simple non-recurring check. Phase 3: extend to evaluate RRULE rules.
CREATE OR REPLACE FUNCTION public.is_venue_available(
  p_venue_id uuid, p_starts_at timestamptz, p_ends_at timestamptz
) RETURNS jsonb LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_blocked record;
BEGIN
  -- Look for any explicit `is_available=false` window that overlaps the requested slot
  SELECT id, reason, starts_at, ends_at INTO v_blocked
   FROM public.event_venue_availability
   WHERE venue_id = p_venue_id
     AND is_available = false
     AND tstzrange(starts_at, ends_at, '[)') && tstzrange(p_starts_at, p_ends_at, '[)')
   LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object('available', false, 'reason', v_blocked.reason,
                              'blocked_window', jsonb_build_object('starts_at', v_blocked.starts_at, 'ends_at', v_blocked.ends_at));
  END IF;
  RETURN jsonb_build_object('available', true);
END;
$$;
```

## RLS policies

```sql
-- Venue organizer manages; anyone can SELECT (so wizard can show availability before login)
CREATE POLICY availability_public_select ON public.event_venue_availability FOR SELECT USING (true);
CREATE POLICY availability_organizer_all ON public.event_venue_availability FOR ALL
  USING (EXISTS (SELECT 1 FROM public.event_venues v WHERE v.id = event_venue_availability.venue_id AND v.organizer_id = (select auth.uid())));
```

## Acceptance Criteria

- [ ] Table + indexes + RLS + trigger created.
- [ ] CHECK constraint enforces either explicit window OR recurrence rule (one of them must be set).
- [ ] `is_venue_available(venue, start, end)` returns `{available: false, reason: 'Holiday'}` when blocked window overlaps.
- [ ] `is_venue_available` for a fully-open day returns `{available: true}` in <50ms.
- [ ] Phase 3 RRULE evaluation deferred — Phase 2 ignores recurrence_rule for the simple check.

## See also

- [`041-event-venue-bookings-schema.md`](./041-event-venue-bookings-schema.md) — Phase 3 bookings cross-check this table
- [`039-host-venue-management-page.md`](./039-host-venue-management-page.md) — calendar UI
