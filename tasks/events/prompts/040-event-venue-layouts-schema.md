---
task_id: 040-event-venue-layouts-schema
title: event_venue_layouts — floor plans + seating zones (theater, banquet, reception)
phase: PHASE-3-EVENTS
priority: P2
status: Open
estimated_effort: 1 day
area: backend
skill:
  - supabase
  - supabase-postgres-best-practices
edge_function: null
schema_tables:
  - public.event_venue_layouts        # NEW
  - public.event_layout_assignments   # NEW (events ↔ layouts)
depends_on: ['001-event-schema-migration', '030-event-media-assets-schema']
mermaid_diagram: null
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-3-EVENTS |
| **Schema** | 1 NEW layouts table + 1 NEW assignment pivot |
| **Real-world** | Hotel Intercontinental's Salón Real has 3 saved layouts: Theater (500 capacity), Banquet (300), Reception (700 standing). Sofía's pageant uses Theater; Postobón's gala next month uses Banquet |

## Description

A single venue is reconfigurable. Storing layouts at the venue level (not the event level) means: organizers reuse known-good layouts; the floor plan PDF lives once in `event_media_assets`; AI floor-plan generator (task 044) seeds candidates from saved layouts.

**zones jsonb shape.** Each zone is `{name, capacity, tier, position?}`. AI layout generator + Phase 3 paid-tier seating maps consume this.

## The migration

```sql
CREATE TABLE public.event_venue_layouts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id        uuid NOT NULL REFERENCES public.event_venues(id) ON DELETE CASCADE,
  name            text NOT NULL,                           -- "Theater 500", "Banquet rounds 30 tables"
  layout_type     text NOT NULL CHECK (layout_type IN
    ('theater','banquet','classroom','u_shape','reception','exhibition','custom')),
  total_capacity  int  NOT NULL CHECK (total_capacity > 0),
  diagram_asset_id uuid REFERENCES public.event_media_assets(id),  -- the floor plan PDF/image
  zones           jsonb NOT NULL DEFAULT '[]'::jsonb,      -- [{name, capacity, tier}]
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX event_venue_layouts_venue_idx ON public.event_venue_layouts(venue_id);
ALTER TABLE  public.event_venue_layouts ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER event_venue_layouts_set_updated_at BEFORE UPDATE ON public.event_venue_layouts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.event_layout_assignments (
  event_id    uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  layout_id   uuid NOT NULL REFERENCES public.event_venue_layouts(id) ON DELETE CASCADE,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, layout_id)
);
ALTER TABLE public.event_layout_assignments ENABLE ROW LEVEL SECURITY;
```

## RLS policies

```sql
CREATE POLICY layouts_public_select ON public.event_venue_layouts FOR SELECT USING (true);
CREATE POLICY layouts_organizer_all ON public.event_venue_layouts FOR ALL
  USING (EXISTS (SELECT 1 FROM public.event_venues v WHERE v.id = event_venue_layouts.venue_id AND v.organizer_id = (select auth.uid())));

CREATE POLICY layout_assignments_event_organizer_all ON public.event_layout_assignments FOR ALL
  USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_layout_assignments.event_id AND e.organizer_id = (select auth.uid())));
```

## Acceptance Criteria

- [ ] Tables + indexes + RLS + triggers created.
- [ ] `total_capacity` matches sum of `zones[].capacity` (validated in app, not DB — flexible for unknown zone counts).
- [ ] Layout reusable across events — same layout assigned to multiple events with different `event_id`.
- [ ] PDF reference via `diagram_asset_id` cleanly resolves to a moderated `event_media_assets` row.

## See also

- [`030-event-media-assets-schema.md`](./030-event-media-assets-schema.md) — diagram asset target
- [`044-ai-venue-layout-generator-edge-fn.md`](./044-ai-venue-layout-generator-edge-fn.md) — AI generator using this schema
