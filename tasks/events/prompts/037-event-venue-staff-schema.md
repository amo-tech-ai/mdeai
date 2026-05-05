---
task_id: 037-event-venue-staff-schema
title: event_venue_staff — venue-side roster (security, AV tech, catering ops, manager)
phase: PHASE-2-EVENTS
priority: P1
status: Open
estimated_effort: 0.5 day
area: backend
skill:
  - supabase
  - supabase-postgres-best-practices
edge_function: null
schema_tables:
  - public.event_venue_staff       # NEW
  - public.event_staff_assignments # NEW (M:N pivot — events ↔ venue staff)
depends_on: ['001-event-schema-migration', '028-event-stakeholders-schema']
mermaid_diagram: null
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-2-EVENTS |
| **Schema** | 1 NEW staff table + 1 NEW M:N pivot |
| **Distinction** | `event_venue_staff` = venue-side employees (security, AV, catering). `event_stakeholders` (task 028) = organizer-side (planner, host, judge). `event_attendees` = paying customers. Three different concerns |
| **Real-world** | Hotel Intercontinental keeps a roster of 12 security guards + 4 AV techs + 8 catering staff. Sofía's pageant requires 6 security + 2 AV for that night — auto-assigned from the roster |

## Description

Venue staff are tied to **the venue**, not the event. A security guard works dozens of events at the same hotel over a year. Tracking them at the venue level enables: cross-event scheduling, hourly-rate analytics, repeat-staff bonuses, sub-shift planning.

## The migration

```sql
CREATE TABLE public.event_venue_staff (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id        uuid NOT NULL REFERENCES public.event_venues(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES auth.users(id),         -- nullable: external staff w/o account
  full_name       text NOT NULL,
  email           text,
  phone_e164      text,
  role            text NOT NULL CHECK (role IN
    ('security','av_tech','catering','manager','janitorial','event_coordinator','registration','other')),
  hourly_rate_cents int CHECK (hourly_rate_cents IS NULL OR hourly_rate_cents >= 0),
  is_active       boolean NOT NULL DEFAULT true,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX event_venue_staff_venue_idx ON public.event_venue_staff(venue_id);
CREATE INDEX event_venue_staff_role_idx  ON public.event_venue_staff(venue_id, role);
ALTER TABLE  public.event_venue_staff ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER event_venue_staff_set_updated_at BEFORE UPDATE ON public.event_venue_staff
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.event_staff_assignments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  staff_id      uuid NOT NULL REFERENCES public.event_venue_staff(id) ON DELETE CASCADE,
  role_at_event text NOT NULL,                          -- can override staff.role for the night
  starts_at     timestamptz NOT NULL,
  ends_at       timestamptz NOT NULL,
  hours_billed  numeric(6,2),                            -- computed at end-of-event
  status        text NOT NULL DEFAULT 'tentative' CHECK (status IN
    ('tentative','confirmed','no_show','completed','cancelled')),
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at),
  UNIQUE (event_id, staff_id, starts_at)
);
CREATE INDEX event_staff_assignments_event_idx ON public.event_staff_assignments(event_id);
CREATE INDEX event_staff_assignments_staff_idx ON public.event_staff_assignments(staff_id, starts_at, ends_at);
ALTER TABLE  public.event_staff_assignments ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER event_staff_assignments_set_updated_at BEFORE UPDATE ON public.event_staff_assignments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

## RLS policies

```sql
CREATE POLICY staff_venue_organizer_all ON public.event_venue_staff FOR ALL
  USING (EXISTS (SELECT 1 FROM public.event_venues v WHERE v.id = event_venue_staff.venue_id AND v.organizer_id = (select auth.uid())));
CREATE POLICY staff_self_select ON public.event_venue_staff FOR SELECT
  USING (user_id = (select auth.uid()));

CREATE POLICY assignments_event_organizer_all ON public.event_staff_assignments FOR ALL
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_staff_assignments.event_id AND e.organizer_id = (select auth.uid())));
CREATE POLICY assignments_staff_self_select ON public.event_staff_assignments FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.event_venue_staff s WHERE s.id = event_staff_assignments.staff_id AND s.user_id = (select auth.uid())));
```

## Acceptance Criteria

- [ ] Tables + indexes + RLS + triggers created.
- [ ] `UNIQUE (event_id, staff_id, starts_at)` prevents accidental double-assignment.
- [ ] Cascade: deleting a venue deletes its staff; deleting a staff member deletes their assignments.
- [ ] Staff member with a `user_id` can SELECT their own assignments via `assignments_staff_self_select`.

## See also

- [`028-event-stakeholders-schema.md`](./028-event-stakeholders-schema.md) — organizer-side roles (DIFFERENT from this)
- [`043-ai-venue-optimizer-edge-fn.md`](./043-ai-venue-optimizer-edge-fn.md) — AI staff allocator uses this table
