---
task_id: 031-event-sponsors-link-schema
title: event_sponsors + event_sponsor_placements — bridge events to sponsorship system
phase: PHASE-2-EVENTS
priority: P2
status: Open
estimated_effort: 0.5 day
area: backend
skill:
  - supabase
  - supabase-postgres-best-practices
edge_function: null
schema_tables:
  - public.event_sponsors            # NEW (M:N pivot — sponsors ↔ events)
  - public.event_sponsor_placements  # NEW (where sponsor logos appear)
depends_on: ['001-event-schema-migration']
mermaid_diagram: ../diagrams/06-sponsor-onboarding.md
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-2-EVENTS — bridges Phase 1 events to the broader Phase 3 sponsorship system in [`03-sponsorship-system.md`](../03-sponsorship-system.md) |
| **Schema** | 2 NEW tables |
| **Real-world** | Postobón sponsors "Reina de Antioquia 2026 Finals" with a $25k Premium tier. Their logo appears on: event hero, ticket PDF, in-app banner, post-event recap email |

## Description

**The situation.** The full sponsorship system is specified in [`03-sponsorship-system.md`](../03-sponsorship-system.md) and uses a `sponsor.*` schema (organizations, applications, placements, ROI). Phase 2 introduces it. **This task bridges events ↔ sponsors** with two thin pivot tables in `public.*` so events can declare sponsors without waiting for the full `sponsor.*` schema.

**Why two tables (not one with role enum).** A sponsor (Postobón) is associated with the event via `event_sponsors`. The placement (where Postobón's logo appears — hero, ticket PDF, etc.) is a separate concern with multiplicity (1 sponsor → N placements). Splitting prevents row explosion + makes per-placement metrics queryable.

**Why Phase 2 not Phase 1.** Per founder May 2 directive: "no sponsors before ticketing works." Sponsors require traffic + proof + metrics — none of which exist until Phase 1 ships and runs an event end-to-end.

## The migration

```sql
-- 1. event_sponsors — many sponsors per event, one event per sponsor (typical M:N)
CREATE TABLE public.event_sponsors (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id            uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  sponsor_org_id      uuid NOT NULL,                              -- FK to sponsor.organizations (Phase 3)
  tier                text NOT NULL CHECK (tier IN ('bronze','silver','gold','premium','title')),
  amount_cents        int NOT NULL CHECK (amount_cents >= 0),
  currency            text NOT NULL DEFAULT 'COP',
  contract_start_at   timestamptz,
  contract_end_at     timestamptz,
  status              text NOT NULL DEFAULT 'pending' CHECK (status IN
    ('pending','approved','active','completed','cancelled')),
  approved_by         uuid REFERENCES auth.users(id),
  approved_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, sponsor_org_id, tier)
);
CREATE INDEX event_sponsors_event_idx   ON public.event_sponsors(event_id);
CREATE INDEX event_sponsors_org_idx     ON public.event_sponsors(sponsor_org_id);
CREATE INDEX event_sponsors_status_idx  ON public.event_sponsors(event_id, status);
ALTER TABLE  public.event_sponsors ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER event_sponsors_set_updated_at BEFORE UPDATE ON public.event_sponsors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. event_sponsor_placements — where + when a sponsor's brand surfaces
CREATE TABLE public.event_sponsor_placements (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_sponsor_id    uuid NOT NULL REFERENCES public.event_sponsors(id) ON DELETE CASCADE,
  surface             text NOT NULL CHECK (surface IN
    ('event_hero','ticket_pdf','confirmation_email','recap_email',
     'in_app_banner','contest_header','venue_signage','stage_screen','other')),
  asset_id            uuid REFERENCES public.event_media_assets(id),  -- the logo/creative used
  position            int NOT NULL DEFAULT 0,
  weight              numeric(4,2) NOT NULL DEFAULT 1.0 CHECK (weight >= 0 AND weight <= 10),
  starts_at           timestamptz,
  ends_at             timestamptz,
  is_active           boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX event_sponsor_placements_sponsor_idx ON public.event_sponsor_placements(event_sponsor_id);
CREATE INDEX event_sponsor_placements_surface_idx ON public.event_sponsor_placements(surface) WHERE is_active = true;
ALTER TABLE  public.event_sponsor_placements ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER event_sponsor_placements_set_updated_at BEFORE UPDATE ON public.event_sponsor_placements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

## RLS policies

```sql
-- Active approved sponsors on published events: public can SELECT (for displaying logos)
CREATE POLICY sponsors_public_active_select ON public.event_sponsors FOR SELECT
  USING (status IN ('approved','active') AND EXISTS (
    SELECT 1 FROM public.events e WHERE e.id = event_sponsors.event_id AND e.status IN ('published','live')
  ));
CREATE POLICY sponsors_organizer_all ON public.event_sponsors FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.events e WHERE e.id = event_sponsors.event_id AND e.organizer_id = (select auth.uid())
  ));

-- Placements follow the same pattern
CREATE POLICY placements_public_active_select ON public.event_sponsor_placements FOR SELECT
  USING (is_active = true AND EXISTS (
    SELECT 1 FROM public.event_sponsors s WHERE s.id = event_sponsor_placements.event_sponsor_id
      AND s.status IN ('approved','active')
  ));
CREATE POLICY placements_organizer_all ON public.event_sponsor_placements FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.event_sponsors s
    JOIN public.events e ON e.id = s.event_id
    WHERE s.id = event_sponsor_placements.event_sponsor_id AND e.organizer_id = (select auth.uid())
  ));
```

## Acceptance Criteria

- [ ] Both tables + indexes + triggers + RLS created.
- [ ] UNIQUE `(event_id, sponsor_org_id, tier)` prevents the same sponsor buying duplicate tiers on one event.
- [ ] FK `sponsor_org_id` is `uuid` only — no FK constraint until `sponsor.organizations` ships in Phase 3 (then ALTER ADD CONSTRAINT).
- [ ] Public SELECT works on active+approved combos for published events.
- [ ] Hero asset + sponsor logo display on event page when placement.surface='event_hero'.

## See also

- [`../03-sponsorship-system.md`](../03-sponsorship-system.md) — full Phase 3 sponsorship spec
- [`../diagrams/06-sponsor-onboarding.md`](../diagrams/06-sponsor-onboarding.md)
- [`../diagrams/07-sponsor-roi-attribution.md`](../diagrams/07-sponsor-roi-attribution.md)
- [`030-event-media-assets-schema.md`](./030-event-media-assets-schema.md) — sponsor logos live there
