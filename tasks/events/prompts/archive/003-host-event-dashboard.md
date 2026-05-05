---
task_id: 003-host-event-dashboard
diagram_id: MVP-GAP
prd_section: 15-user-stories.md §2 (S-O-4, S-O-5)
title: /host/event/:id — organizer dashboard with KPIs + attendees + staff link
phase: PHASE-1-EVENTS
priority: P0
status: Done
estimated_effort: 2.5 days  # +0.5d for event_dashboard_summary RPC + Realtime publication setup
area: frontend
skill:
  - frontend-design
  - vercel-react-best-practices
  - supabase
  - supabase-postgres-best-practices  # for the new SECURITY DEFINER RPC
  - vitest-component-testing          # unit tests
  - claude-preview-browser-testing    # mandatory browser proof
  - mdeai-project-gates               # final verification gate
edge_function: event-staff-link-generator  # indirect — used by "Generate" + "Revoke" buttons (task 034)
schema_tables:
  - public.events
  - public.event_tickets
  - public.event_orders
  - public.event_attendees
  - public.event_check_ins   # right-panel "Recent activity" + scan-failure log
  - public.payments          # Stripe deep-link via stripe_payment_intent_id
depends_on: ['001-event-schema-migration', '002-host-event-new-wizard', '034-event-staff-link-generator-edge-fn']
mermaid_diagram: ../diagrams/18-mvp-gap.md
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-1-EVENTS |
| **Route** | `/host/event/:id` (protected; only `events.organizer_id = auth.uid()` can access) |
| **Reads** | `event_orders` + `event_attendees` (Realtime) + `event_tickets` (capacity) |
| **Updates live** | Sales tick within 2s of new order via Supabase Realtime |
| **Real-world** | Sofía sees "73 GA + 12 VIP sold = $4,360" updated live; one-click "Generate staff link" for door scanner |

## Description

**The situation.** Phase 1 organizers need a single page that answers: how many tickets sold, how many people checked in, how much money I made, and how do I delegate door check-in. No new infrastructure needed — every number is computable from the schema in task 001.

**Why no aggregation tables in P1.** SQL aggregates (`SUM(total_cents)`, `COUNT(*) FILTER WHERE qr_used_at IS NOT NULL`) on event_orders + event_attendees are fast at <1k orders. Materialized views deferred to P2 if performance becomes an issue.

## Layout (3-panel mandatory per CLAUDE.md)

| Panel | Content |
|---|---|
| **Left** | Event summary card · status badge (draft/published/live/closed) · public URL with copy · "Edit event" button (loops back to wizard) |
| **Main** | 4 KPI cards · per-tier breakdown table · attendee list (paginated 50/page, search by name/email) |
| **Right** | "Generate staff link" CTA · check-in counter (live) · share panel (WhatsApp/IG/copy URL) · "Open in Stripe" deep-link |

## KPI cards (4)

1. **Tickets sold:** `count(*) FROM event_attendees WHERE event_id=$1 AND status='active'`
2. **Revenue (COP):** `sum(total_cents) FROM event_orders WHERE event_id=$1 AND status IN ('paid','partial_refund') ÷ 100`
   — `partial_refund` rows already had refund amounts deducted in task 005; `refunded` rows are excluded from revenue
3. **Checked in:** `count(*) FROM event_attendees WHERE event_id=$1 AND qr_used_at IS NOT NULL`
4. **No-shows:** computed = `Tickets sold − Checked in` (only after `events.event_end_time < now()`; before that show "—")

## Per-tier breakdown table

| Tier | Sold | Remaining | Revenue |
|---|---|---|---|
| GA | 73 / 1000 | 927 | $2,920,000 COP |
| VIP | 12 / 200 | 188 | $1,440,000 COP |

Computed via SECURITY DEFINER RPC `event_dashboard_summary(p_event_id uuid)` (see "New RPC" below).

- **Sold** = `event_attendees.status='active'` per tier (consistent with KPI 1 — pending purchases excluded)
- **Remaining** = `qty_total - qty_sold - qty_pending` (qty_pending in-flight checkouts hide from "available" so a host watching the dashboard during a sales rush sees real-time availability)
- **Revenue** = `sum(total_cents)` from paid+partial_refund orders for that ticket_id ÷ 100

## New RPC: `event_dashboard_summary`

```sql
CREATE OR REPLACE FUNCTION public.event_dashboard_summary(p_event_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, pg_temp AS $$
DECLARE v_caller uuid := auth.uid();
BEGIN
  -- RLS-equivalent: only the organizer can read the dashboard summary
  IF NOT EXISTS (
    SELECT 1 FROM public.events
     WHERE id = p_event_id AND organizer_id = v_caller
  ) THEN
    RAISE EXCEPTION 'NOT_ORGANIZER' USING ERRCODE = 'P0001';
  END IF;

  RETURN jsonb_build_object(
    'kpis', (
      SELECT jsonb_build_object(
        'tickets_sold',  count(*) FILTER (WHERE status = 'active'),
        'checked_in',    count(*) FILTER (WHERE qr_used_at IS NOT NULL),
        'no_shows',      count(*) FILTER (WHERE status = 'active' AND qr_used_at IS NULL)
      ) FROM public.event_attendees WHERE event_id = p_event_id
    ),
    'revenue_cents', (
      SELECT coalesce(sum(total_cents), 0)
        FROM public.event_orders
       WHERE event_id = p_event_id AND status IN ('paid', 'partial_refund')
    ),
    'tiers', (
      SELECT jsonb_agg(jsonb_build_object(
        'id', t.id, 'name', t.name,
        'qty_total', t.qty_total, 'qty_sold', t.qty_sold, 'qty_pending', t.qty_pending,
        'remaining', t.qty_total - t.qty_sold - t.qty_pending,
        'price_cents', t.price_cents, 'currency', t.currency,
        'tier_revenue_cents', coalesce((
          SELECT sum(o.total_cents) FROM public.event_orders o
           WHERE o.ticket_id = t.id AND o.status IN ('paid', 'partial_refund')
        ), 0)
      ) ORDER BY t.position) FROM public.event_tickets t WHERE t.event_id = p_event_id
    )
  );
END;
$$;
REVOKE ALL ON FUNCTION public.event_dashboard_summary(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.event_dashboard_summary(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.event_dashboard_summary(uuid) TO authenticated, service_role;
```

One round-trip; encapsulates the join logic; pattern matches existing `ticket_payment_finalize_response` helper.

## Attendee list

- Columns: name, email, ticket tier, purchase time, check-in status (`unused` / `used` with timestamp / `refunded`).
- Paginated 50/page.
- Search input filters by name OR email (case-insensitive ILIKE).
- Export CSV button (P2 — for now, copy-to-clipboard).

## Realtime

**Prerequisite (one-time, ships with this task's migration):**

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE
  public.event_orders, public.event_attendees, public.event_check_ins;
ALTER TABLE public.event_orders     REPLICA IDENTITY FULL;
ALTER TABLE public.event_attendees  REPLICA IDENTITY FULL;
ALTER TABLE public.event_check_ins  REPLICA IDENTITY FULL;
```

(Verified 2026-05-03: zero `event*` tables currently in `supabase_realtime` publication; without this step Realtime emits silently.)

- Subscribe to `event_orders` channel filtered by `event_id` (server-side filter — RLS still applies).
- Subscribe to `event_attendees` channel filtered by `event_id`.
- Subscribe to `event_check_ins` channel filtered by `event_id` (drives "Recent activity" strip in the right panel).
- KPIs + table re-fetch via `event_dashboard_summary` RPC on any INSERT/UPDATE/DELETE.
- Use existing `useRealtimeChannel` hook.
- Acceptance gate: `pg_publication_tables` lists all 3 event tables for `supabase_realtime`.

## Staff link generator (S-O-5)

- Button: "Generate staff link" → POST `event-staff-link-generator` (task 034) with `{event_id, ttl_hours: 24}`.
- Returns URL: `https://mdeai.co/staff/check-in/:event_id?token=<jwt>`.
- Auto-copy to clipboard via `navigator.clipboard.writeText` + show "Copied — share via WhatsApp" toast.
- "Revoke link" button → POST same fn with `{event_id, revoke: true}`. The fn calls `bump_staff_link_version` (service-role-only RPC) and the next scan returns `STAFF_TOKEN_REVOKED`.

**NOTE:** Do **NOT** call `supabase.rpc('bump_staff_link_version', ...)` directly from the frontend — the migration grants that RPC to `service_role` only. The edge fn is the supported path. (This deviates from the original task 034 spec which exposed it to `authenticated`; the deployed migration tightened it for security in line with the audit-M2 rationale.)

## Stripe deep-link (right panel)

- Hide the "Open in Stripe" CTA entirely when `event_orders.stripe_payment_intent IS NULL` (covers test-mode + manually-marked orders).
- When present, build the URL via:
  ```typescript
  function stripeDashboardUrl(piId: string): string {
    const pk = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ?? "";
    const prefix = pk.startsWith("pk_test_") ? "/test" : "";
    return `https://dashboard.stripe.com${prefix}/payments/${piId}`;
  }
  ```
- Mode auto-detected from the publishable key prefix (frontend never sees the secret key).

## CSV export (P1, not P2)

- "Export attendees (CSV)" button next to the search input.
- Generates `attendees-<short_id>-<yyyy-mm-dd>.csv` with columns: `name, email, ticket_tier, purchase_time, check_in_status, checked_in_at, short_id`.
- Implemented via `<a href="data:text/csv;charset=utf-8;base64,...">` — no server round-trip. ~30 LOC.

## Acceptance Criteria

- [ ] Page loads in <2s on 4G with 500 attendee rows.
- [ ] **Initial paint** shows KPIs + page 1 (50 rows) of attendees only — NOT all 500 at once.
- [ ] All 4 KPIs reconcile to the cent against Stripe Dashboard for a test event.
- [ ] `partial_refund` orders count toward Revenue (with reduced amount); `refunded` orders are excluded.
- [ ] Per-tier "Remaining" reflects `qty_total - qty_sold - qty_pending` (hides in-flight checkouts during sales rush).
- [ ] Realtime: a manual INSERT into `event_orders` from Studio reflects in dashboard within 5s without page refresh.
- [ ] Anyone other than `organizer_id` who tries to load `/host/event/:id` gets a 403 page (RPC raises `NOT_ORGANIZER`; UI shows friendly message + "Back to dashboard").
- [ ] Pagination works: 100+ attendees displays page 1 + 2 + ... navigation.
- [ ] Search "maria" filters 500 attendees down correctly (server-side ILIKE on `lower(full_name)` + `lower(email)`).
- [ ] CSV export downloads attendees for the current filter.
- [ ] Staff link button copies URL to clipboard; revoke flips `staff_link_version` and invalidates next scan (verified by re-calling task 006 with the old token).
- [ ] Stripe deep-link hidden when `stripe_payment_intent IS NULL`; correct mode (test/live) when set.
- [ ] Lighthouse a11y ≥ 90.
- [ ] `pg_publication_tables` confirms `event_orders`, `event_attendees`, `event_check_ins` are in `supabase_realtime`.
- [ ] `get_advisors --type security` returns zero new errors after the `event_dashboard_summary` migration.

## Failure handling

- Realtime channel disconnect → show "🔴 Live updates paused" banner; auto-reconnect on visibility change.
- Stripe deep-link broken (event paid via test mode) → show URL anyway; user can copy.
- Empty state (0 tickets sold) → friendly "Share your event to start selling" CTA, not a blank table.

## Wiring plan

1. Read `src/pages/host/Dashboard.tsx` for the **host** dashboard chrome (`Dashboard.tsx` at root is the renter dashboard — wrong analogy).
2. Read `src/hooks/useRealtimeChannel.ts` for the subscription helper.
3. Read `src/components/host/onboarding/Step1Basics.test.tsx` for our Vitest+JSDOM pattern (mocks Supabase + react-router).
4. Migration: `event_dashboard_summary` SECURITY DEFINER RPC + `ALTER PUBLICATION supabase_realtime ADD TABLE` for the 3 event tables.
5. Apply migration via `mcp__supabase__apply_migration` and verify `get_advisors security` shows zero new errors.
6. Create `src/hooks/useEventDashboard.ts` — single `supabase.rpc('event_dashboard_summary', { p_event_id })` + 3 Realtime subscriptions; no N+1.
7. Create `src/components/host/event-dashboard/{KpiCard,TierTable,AttendeeTable,StaffLinkPanel,RecentActivityStrip,StripeDeepLink}.tsx` (split for testability).
8. Create `src/pages/host/HostEventDashboard.tsx` per the 3-panel layout above.
9. Add the route to `src/App.tsx` (`/host/event/:id`); guard with `<ProtectedRoute>`.
10. Vitest:
    - `useEventDashboard.test.ts` — KPI math, permission denial path, Realtime delta integration
    - `HostEventDashboard.test.tsx` — 4 states (loading/error/empty/success), pagination, search filter, CSV export
    - `StaffLinkPanel.test.tsx` — generate + revoke flows mocked
11. **Browser proof (Claude Preview MCP)** — drive the persona scenario:
    - Log in as `qa-organizer@mdeai.test` (seed user, organizer of `22222222-2222-2222-2222-000000000001`)
    - Navigate to `/host/event/22222222-2222-2222-2222-000000000001`
    - Verify KPI: `tickets_sold` matches active attendees, revenue = sum of paid orders
    - Click "Generate staff link" → verify `navigator.clipboard` contains the URL + toast appears
    - Manually `INSERT INTO event_orders` via MCP `execute_sql` → verify KPI delta within 5s
    - Click "Revoke" → re-call task 006 endpoint with the old token → expect `STAFF_TOKEN_REVOKED`
12. **Gates (mdeai-project-gates)** — `npm run lint` (zero new errors), `npm run build` (clean), `npm run test` (all green), `get_advisors security` (no new lints), bundle delta within budget.

## See also

- [`../diagrams/18-mvp-gap.md`](../diagrams/18-mvp-gap.md)
- [`../15-user-stories.md`](../15-user-stories.md) §2 (S-O-4, S-O-5)
- `src/hooks/useRealtimeChannel.ts` — existing Realtime hook
- `.claude/rules/style-guide.md` — 4-state requirement (loading/error/empty/success)
