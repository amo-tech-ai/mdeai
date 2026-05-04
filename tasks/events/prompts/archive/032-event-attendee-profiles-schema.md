---
task_id: 032-event-attendee-profiles-schema
title: event_attendee_profiles — extra attendee data (dietary, accessibility, company)
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
  - public.event_attendee_profiles  # NEW
depends_on: ['001-event-schema-migration']
mermaid_diagram: null
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-2-EVENTS |
| **Schema** | 1 NEW table — extends `event_attendees` 1:0..1 |
| **Real-world** | Camila adds her dietary preference (vegetarian) + accessibility need (wheelchair) at checkout. The catering vendor + venue staff get a pre-event report sorted by these fields |

## Description

**The situation.** Phase 1 captures `event_attendees.full_name + email + phone_e164`. Real attendees often supply dietary restrictions, accessibility needs, T-shirt sizes, company affiliation (B2B events). Storing those on the `event_attendees` table itself would clutter the hot path; storing in JSONB blocks indexed queries.

**Why a separate 1:0..1 child table.** Most events don't collect this data; only some do. A child table with optional row keeps the hot table lean while letting heavy events index by dietary preference + accessibility need.

**Distinction from `event_checkout_questions` (Phase 2).** Checkout questions are organizer-defined custom fields (e.g., "Which session will you attend?"). Profile fields are common-shape known data. Different use cases.

## The migration

```sql
CREATE TABLE public.event_attendee_profiles (
  attendee_id         uuid PRIMARY KEY REFERENCES public.event_attendees(id) ON DELETE CASCADE,
  dietary_preference  text CHECK (dietary_preference IS NULL OR dietary_preference IN
    ('omnivore','vegetarian','vegan','gluten_free','halal','kosher','none','other')),
  dietary_detail      text,                                          -- "nut allergy"
  accessibility_needs text[],                                         -- ['wheelchair','sign_language','captions']
  accessibility_detail text,
  shirt_size          text CHECK (shirt_size IS NULL OR shirt_size IN ('XS','S','M','L','XL','XXL')),
  company             text,                                            -- B2B events
  job_title           text,
  emergency_contact_name  text,
  emergency_contact_phone text,
  marketing_consent       boolean NOT NULL DEFAULT false,
  custom_fields           jsonb DEFAULT '{}'::jsonb,                 -- per-event custom-form answers
  updated_at              timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX event_attendee_profiles_dietary_idx
  ON public.event_attendee_profiles(dietary_preference)
  WHERE dietary_preference IS NOT NULL;
CREATE INDEX event_attendee_profiles_accessibility_idx
  ON public.event_attendee_profiles USING GIN(accessibility_needs)
  WHERE accessibility_needs IS NOT NULL;
ALTER TABLE  public.event_attendee_profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER event_attendee_profiles_set_updated_at BEFORE UPDATE ON public.event_attendee_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

## RLS policies

```sql
-- Visibility follows event_attendees: buyer sees own; organizer sees own event's
CREATE POLICY profiles_via_attendee ON public.event_attendee_profiles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.event_attendees a
    JOIN public.event_orders o ON o.id = a.order_id
    WHERE a.id = event_attendee_profiles.attendee_id AND (
      o.buyer_user_id = (select auth.uid())
      OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = o.event_id AND e.organizer_id = (select auth.uid()))
    )
  ));
-- Service-role-only writes (frontend submits via edge fn that validates ownership first)
```

## Acceptance Criteria

- [ ] Table + indexes (B-tree on dietary_preference, GIN on accessibility_needs[]) + trigger + RLS created.
- [ ] Organizer dashboard query (`SELECT count(*) FROM event_attendee_profiles WHERE attendee_id IN (...) GROUP BY dietary_preference`) returns sub-100ms on 5,000 attendees.
- [ ] Cascade delete: removing an attendee removes the profile (FK ON DELETE CASCADE).
- [ ] PII (emergency contact, company) NOT visible to other attendees on the same event.

## See also

- [`001-event-schema-migration.md`](./001-event-schema-migration.md)
