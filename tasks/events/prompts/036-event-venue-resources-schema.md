---
task_id: 036-event-venue-resources-schema
title: event_venue_resources — AV / catering / furniture inventory per venue
phase: PHASE-2-EVENTS
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
  - public.event_venue_resources  # NEW
  - public.event_resource_assignments  # NEW (M:N pivot — events ↔ resources)
depends_on: ['001-event-schema-migration']
mermaid_diagram: null
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-2-EVENTS |
| **Schema** | 1 NEW resource table + 1 NEW M:N pivot |
| **Real-world** | Hotel Intercontinental tracks: 12 wireless mics, 4 LED screens, 200 banquet chairs, 50 cocktail tables. Sofía's pageant claims 6 mics + 2 LED screens for that night |

## Description

Phase 2 venue management starts with knowing what's at each venue. Without inventory, organizers can't claim "I need 6 mics" without phone-tagging the venue manager. This table holds the resource catalog; the assignment pivot tracks which event reserves which resources for what window.

## The migration

```sql
CREATE TABLE public.event_venue_resources (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id        uuid NOT NULL REFERENCES public.event_venues(id) ON DELETE CASCADE,
  resource_type   text NOT NULL CHECK (resource_type IN
    ('av_audio','av_video','av_lighting','catering_ware','furniture','signage','power','other')),
  name            text NOT NULL,                         -- "JBL EON710 powered speaker"
  quantity_total  int NOT NULL CHECK (quantity_total >= 0),
  cost_per_event_cents int CHECK (cost_per_event_cents IS NULL OR cost_per_event_cents >= 0),
  vendor_name     text,                                  -- "owned" | "Rented from Audio Pro Medellín"
  is_active       boolean NOT NULL DEFAULT true,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX event_venue_resources_venue_idx ON public.event_venue_resources(venue_id);
CREATE INDEX event_venue_resources_type_idx  ON public.event_venue_resources(venue_id, resource_type);
ALTER TABLE  public.event_venue_resources ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER event_venue_resources_set_updated_at BEFORE UPDATE ON public.event_venue_resources
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.event_resource_assignments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  resource_id     uuid NOT NULL REFERENCES public.event_venue_resources(id) ON DELETE CASCADE,
  quantity        int NOT NULL CHECK (quantity > 0),
  starts_at       timestamptz NOT NULL,
  ends_at         timestamptz NOT NULL,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);
CREATE INDEX event_resource_assignments_event_idx    ON public.event_resource_assignments(event_id);
CREATE INDEX event_resource_assignments_resource_idx ON public.event_resource_assignments(resource_id, starts_at, ends_at);
ALTER TABLE  public.event_resource_assignments ENABLE ROW LEVEL SECURITY;
```

## Conflict-detection helper (used by task 039)

```sql
-- Returns rows where requested quantity exceeds available quantity for the time window
CREATE OR REPLACE FUNCTION public.check_resource_availability(
  p_resource_id uuid, p_quantity int, p_starts_at timestamptz, p_ends_at timestamptz
) RETURNS jsonb LANGUAGE plpgsql STABLE AS $$
DECLARE
  v_total int; v_assigned int;
BEGIN
  SELECT quantity_total INTO v_total FROM public.event_venue_resources WHERE id = p_resource_id;
  SELECT COALESCE(SUM(quantity), 0) INTO v_assigned FROM public.event_resource_assignments
   WHERE resource_id = p_resource_id
     AND tstzrange(starts_at, ends_at, '[)') && tstzrange(p_starts_at, p_ends_at, '[)');
  RETURN jsonb_build_object(
    'available', v_total - v_assigned >= p_quantity,
    'total', v_total, 'assigned', v_assigned, 'requested', p_quantity
  );
END;
$$;
```

## RLS policies

```sql
-- Venue's organizer manages; anyone with an active assignment can SELECT (read-only)
CREATE POLICY resources_organizer_all ON public.event_venue_resources FOR ALL
  USING (EXISTS (SELECT 1 FROM public.event_venues v WHERE v.id = event_venue_resources.venue_id AND v.organizer_id = (select auth.uid())));
CREATE POLICY assignments_event_organizer_all ON public.event_resource_assignments FOR ALL
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_resource_assignments.event_id AND e.organizer_id = (select auth.uid())));
```

## Acceptance Criteria

- [ ] Tables + indexes + RLS + triggers created.
- [ ] `check_resource_availability` returns correct `available: false` when assignments overlap.
- [ ] Cascade: removing a venue deletes its resources; removing a resource deletes its assignments.
- [ ] 50 concurrent assignment inserts → no overcount (advisory lock optional; conflict surfaces at next availability check).

## See also

- [`001-event-schema-migration.md`](./001-event-schema-migration.md) — base schema
- [`039-host-venue-management-page.md`](./039-host-venue-management-page.md) — UI that uses this
