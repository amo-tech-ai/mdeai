---
task_id: 039-host-venue-management-page
title: /host/venues — venue list + per-venue management (resources, staff, availability calendar)
phase: PHASE-2-EVENTS
priority: P1
status: Open
estimated_effort: 1.5 days
area: frontend
skill:
  - frontend-design
  - vercel-react-best-practices
  - supabase
edge_function: null
schema_tables:
  - public.event_venues
  - public.event_venue_resources
  - public.event_venue_staff
  - public.event_venue_availability
depends_on: ['001-event-schema-migration', '036-event-venue-resources-schema', '037-event-venue-staff-schema', '038-event-venue-availability-schema']
mermaid_diagram: null
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-2-EVENTS — primary UI for venue management |
| **Routes** | `/host/venues` (list) · `/host/venues/:id` (detail with 4 tabs: overview, resources, staff, availability) |
| **Real-world** | Sofía clicks "My venues" → 3 venues listed → opens "Hotel Intercontinental" → sees roster of 12 staff + 8 AV items + Oct calendar with 4 events scheduled |

## Description

The dashboard for venue-level operations. Phase 2 venue work is mostly back-end (tasks 036-038); this task surfaces it.

## Layout

| Route | Panel | Content |
|---|---|---|
| `/host/venues` | Main | Card grid of venues; "Add new venue" CTA |
| `/host/venues/:id` Left | Left | Venue summary, edit button, "Delete (with safeguards)" |
| `/host/venues/:id` Main | Main | Tabs: Overview · Resources · Staff · Availability |
| `/host/venues/:id` Right | Right | This-month KPIs (events held, hours utilized, $ resource cost, $ staff cost) |

### Resources tab
- Inventory table: type, name, qty total, cost per event, vendor source
- "Add resource" inline form
- Per-resource: shows N upcoming assignments (links to events)

### Staff tab
- Roster table: name, role, hourly rate, contact
- "Add staff" inline form
- Per-staff: shows assigned events this month + hours billed

### Availability tab
- Month calendar view with green (open) / red (blocked) / blue (booked-by-event) blocks
- "Block a date" CTA — modal with reason + RRULE option
- Read-only display of upcoming events (linked to `event_venue_bookings` once Phase 3 lands)

## Acceptance Criteria

- [ ] All 4 tabs render real data from the 4 schema tasks (036-038 + 001).
- [ ] Mobile 360px: tabs collapse to a single-select dropdown.
- [ ] All 4 data states handled per `style-guide.md` on every tab.
- [ ] Inline create forms persist via existing Supabase client pattern (no new edge fn).
- [ ] `/host/venues/:id` is RLS-protected — only `event_venues.organizer_id = auth.uid()` can load.
- [ ] Lighthouse a11y ≥ 90.

## Wiring plan

1. Read `src/pages/host/HostEventDashboard.tsx` (task 003) for the 3-panel pattern.
2. Read `src/components/ui/tabs.tsx` for the shadcn tabs primitive.
3. Create `src/pages/host/HostVenues.tsx` (list) + `src/pages/host/HostVenueDetail.tsx`.
4. Create `src/components/host/venue/{ResourcesTab,StaffTab,AvailabilityTab,OverviewTab}.tsx`.
5. Create `src/hooks/{useVenue,useVenueResources,useVenueStaff,useVenueAvailability}.ts`.
6. Add 2 routes to `src/App.tsx`.
7. Vitest: 1 test per tab covering empty/loaded/error states.

## See also

- [`036-event-venue-resources-schema.md`](./036-event-venue-resources-schema.md)
- [`037-event-venue-staff-schema.md`](./037-event-venue-staff-schema.md)
- [`038-event-venue-availability-schema.md`](./038-event-venue-availability-schema.md)
