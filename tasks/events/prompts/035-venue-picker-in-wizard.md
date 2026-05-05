---
task_id: 035-venue-picker-in-wizard
title: Venue picker in /host/event/new wizard — pick existing OR create new
phase: PHASE-1-EVENTS
priority: P0
status: Open
estimated_effort: 0.5 day
area: frontend
skill:
  - frontend-design
  - vercel-react-best-practices
  - supabase
edge_function: null
schema_tables:
  - public.event_venues  # already created in task 001
depends_on: ['001-event-schema-migration', '002-host-event-new-wizard']
mermaid_diagram: ../diagrams/10-event-creation-wizard.md
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-1-EVENTS — folds into task 002 wizard step 1 |
| **Surface** | `/host/event/new` Step 1 (Basics) — adds a venue sub-section |
| **Behavior** | Sofía types "Hotel" → autocomplete shows her saved venues; if not found, "Create new venue" inline form |
| **Real-world** | First event: Sofía creates "Hotel Intercontinental Salón Real" (capacity 500, address, geo); second event re-uses it from autocomplete in 2 clicks |

## Description

**The situation.** Task 001 created `public.event_venues`. Task 002 wizard collects free-text address. **This task wires the venue picker** so creating an event and creating a venue happen in the same flow — without forcing organizers through two separate UIs.

**Behavior.** Step 1 of the wizard adds a venue picker:
- Type-ahead search across `event_venues WHERE organizer_id = auth.uid()`
- Selecting a saved venue auto-fills `events.venue_id` + `events.address` (denormalized for legacy filtering)
- "Create new venue" link opens an inline 5-field form (name, address, city, capacity, postal — geo is optional, autocomplete from Google Places API existing key)
- New venue creates a row + selects it; user continues the wizard

## Acceptance Criteria

- [ ] Type-ahead returns Sofía's 3 saved venues in <200ms.
- [ ] "Create new venue" inline form submits → new row in `event_venues` → selected automatically.
- [ ] `events.venue_id` populated; `events.address` denormalized from venue address.
- [ ] If user types a venue name not in their list, the inline-create form opens automatically with `name` prefilled.
- [ ] Lighthouse a11y ≥ 90 on the picker; mobile 360px works.
- [ ] No regression on task 002's other 4 steps.

## Wiring plan

1. Read `src/components/ui/{combobox,popover}.tsx` for the autocomplete primitive.
2. Add `useVenues` hook in `src/hooks/useVenues.ts`.
3. Add `<VenuePicker>` component in `src/components/host/event-wizard/VenuePicker.tsx`.
4. Update `Step1Basics.tsx` (from task 002) to embed `<VenuePicker>` above the existing address field.
5. Add Vitest test for autocomplete + inline-create flow.

## See also

- [`001-event-schema-migration.md`](./001-event-schema-migration.md) — `event_venues` table
- [`002-host-event-new-wizard.md`](./002-host-event-new-wizard.md) — wizard this folds into
