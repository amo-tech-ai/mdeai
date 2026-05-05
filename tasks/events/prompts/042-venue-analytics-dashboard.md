---
task_id: 042-venue-analytics-dashboard
title: /host/venues/:id/analytics — utilization, revenue, resource cost, staff hours
phase: PHASE-3-EVENTS
priority: P2
status: Open
estimated_effort: 1 day
area: frontend
skill:
  - frontend-design
  - vercel-react-best-practices
  - supabase
edge_function: null
schema_tables:
  - public.event_venue_bookings
  - public.event_resource_assignments
  - public.event_staff_assignments
  - public.event_orders
depends_on: ['041-event-venue-bookings-schema', '036-event-venue-resources-schema', '037-event-venue-staff-schema']
mermaid_diagram: null
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-3-EVENTS |
| **Route** | `/host/venues/:id/analytics` |
| **Real-world** | Sofía sees: 12 events at this venue last month · 218h utilized of 720 · $48M COP revenue · $3.2M COP resource cost · $5.8M COP staff cost · net $39M |

## Description

Phase 3 utilization tracking. Aggregates over `event_venue_bookings` + assignment pivot tables. Materialized view considered but deferred to Phase 4 if perf demands; Phase 3 ships with on-demand SQL.

## KPIs

1. **Events held** = `count(*) FROM event_venue_bookings WHERE venue_id=$1 AND status='completed' AND ends_at >= now() - 30d`
2. **Hours utilized** = `sum(extract(epoch from (ends_at - starts_at))/3600)` for completed bookings
3. **Utilization %** = utilized / 720 (assumes 24×30 baseline; configurable per venue)
4. **Gross revenue** = `sum(total_cents) FROM event_venue_bookings` + `sum(total_cents) FROM event_orders WHERE event_id IN (...)` (combined: rentals + ticket sales)
5. **Resource cost** = `sum(quantity × cost_per_event_cents)` from resource_assignments × resources
6. **Staff cost** = `sum(hours_billed × hourly_rate_cents)` from staff_assignments × staff
7. **Net contribution** = revenue − resource_cost − staff_cost

## Layout

| Panel | Content |
|---|---|
| Top KPI strip | 7 cards (above) with month-over-month delta arrows |
| Main chart | Bar chart: events per week (last 12 weeks) — Recharts |
| Secondary | Resource utilization heatmap (which AV/catering items used most) |
| Sidebar | Top 10 client orgs by revenue (external rentals) |

## Acceptance Criteria

- [ ] All 7 KPIs computed correctly on synthetic data.
- [ ] Utilization % over a Christmas-closed venue accounts for `is_available=false` blocks (excludes blocked hours from denominator).
- [ ] Page loads <2s on 4G with 1 year of bookings (~500 rows).
- [ ] Empty state for new venues: "No events this month — book one to start tracking."
- [ ] Realtime: a manual booking insert in Studio reflects within 5s.
- [ ] Lighthouse a11y ≥ 90.

## Wiring plan

1. Read `src/pages/host/HostEventDashboard.tsx` for KPI-card pattern.
2. Read `recharts` (already in project) for bar chart.
3. Create `src/pages/host/HostVenueAnalytics.tsx`.
4. Create `src/hooks/useVenueAnalytics.ts` (single hook returning all 7 KPIs).
5. Add the route to `src/App.tsx`.
6. Vitest: 1 test for KPI math on synthetic data.

## See also

- [`041-event-venue-bookings-schema.md`](./041-event-venue-bookings-schema.md)
- [`036-event-venue-resources-schema.md`](./036-event-venue-resources-schema.md)
- [`037-event-venue-staff-schema.md`](./037-event-venue-staff-schema.md)
- [`043-ai-venue-optimizer-edge-fn.md`](./043-ai-venue-optimizer-edge-fn.md) — AI consumes these metrics
