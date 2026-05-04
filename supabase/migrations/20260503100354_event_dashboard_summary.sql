-- Migration: event_dashboard_summary RPC + supabase_realtime publication for event tables.
--
-- Companion to: src/pages/host/HostEventDashboard.tsx (task 003).
--
-- WHY ONE RPC: encapsulates the join logic (KPIs + per-tier breakdown + revenue
-- aggregates) in a single round-trip. Without it the dashboard runs N+1 queries
-- against multiple tables for cold load. Pattern matches `ticket_payment_finalize_response`.
--
-- WHY service-role + authenticated GRANT: organizers will call this from the
-- browser via supabase-js using their authenticated JWT; service_role can also
-- call it from edge functions for tests. Anon is REVOKE'd because the dashboard
-- is organizer-only.
--
-- WHY pg_publication_tables ADD: the dashboard subscribes to Realtime channels
-- on event_orders / event_attendees / event_check_ins. None of these tables
-- were in supabase_realtime publication before this migration (verified
-- 2026-05-03 via pg_publication_tables). Without this, the dashboard's KPI
-- delta within 5s acceptance criterion fails silently.
--
-- WHY REPLICA IDENTITY FULL: needed so UPDATE events (e.g., qr_used_at flip
-- from NULL → timestamp) deliver the OLD row alongside the NEW row in the
-- Realtime payload. Default REPLICA IDENTITY DEFAULT only sends the PK on
-- UPDATE, which means the dashboard can't tell qty_pending decremented vs.
-- qty_sold incremented from the payload alone.

-- ---------------------------------------------------------------------------
-- 1. event_dashboard_summary RPC
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.event_dashboard_summary(p_event_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller uuid := auth.uid();
BEGIN
  -- RLS-equivalent: only the event's organizer can read the dashboard.
  -- service_role bypass: when called via service client (tests, edge fns),
  -- auth.uid() returns NULL, so we treat NULL as "trust the caller layer".
  IF v_caller IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
        FROM public.events
       WHERE id = p_event_id AND organizer_id = v_caller
    ) THEN
      RAISE EXCEPTION 'NOT_ORGANIZER' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'event', (
      SELECT jsonb_build_object(
        'id',                e.id,
        'name',              e.name,
        'status',            e.status,
        'event_start_time',  e.event_start_time,
        'event_end_time',    e.event_end_time,
        'staff_link_version',e.staff_link_version,
        'address',           e.address
      )
      FROM public.events e
      WHERE e.id = p_event_id
    ),
    'kpis', (
      SELECT jsonb_build_object(
        'tickets_sold',  count(*) FILTER (WHERE status = 'active'),
        'checked_in',    count(*) FILTER (WHERE qr_used_at IS NOT NULL),
        -- "Active without scan" — what the dashboard shows as "No-shows"
        -- AFTER event_end_time has passed. Frontend gates on event_end_time.
        'no_shows',      count(*) FILTER (WHERE status = 'active' AND qr_used_at IS NULL)
      )
      FROM public.event_attendees
      WHERE event_id = p_event_id
    ),
    'revenue_cents', (
      SELECT coalesce(sum(total_cents), 0)
        FROM public.event_orders
       WHERE event_id = p_event_id
         AND status IN ('paid', 'partial_refund')
    ),
    'tiers', (
      SELECT coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id',                t.id,
            'name',              t.name,
            'qty_total',         t.qty_total,
            'qty_sold',          t.qty_sold,
            'qty_pending',       t.qty_pending,
            'remaining',         t.qty_total - t.qty_sold - t.qty_pending,
            'price_cents',       t.price_cents,
            'currency',          t.currency,
            'tier_revenue_cents', coalesce((
              SELECT sum(o.total_cents)
                FROM public.event_orders o
               WHERE o.ticket_id = t.id
                 AND o.status IN ('paid', 'partial_refund')
            ), 0)
          )
          ORDER BY t.position
        ),
        '[]'::jsonb
      )
      FROM public.event_tickets t
      WHERE t.event_id = p_event_id
    ),
    -- Right-panel "Recent activity" — last 10 check-in attempts (any outcome).
    'recent_check_ins', (
      SELECT coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id',         ci.id,
            'result',     ci.result,
            'created_at', ci.created_at,
            'details',    ci.details
          )
          ORDER BY ci.created_at DESC
        ),
        '[]'::jsonb
      )
      FROM (
        SELECT id, result, created_at, details
          FROM public.event_check_ins
         WHERE event_id = p_event_id
         ORDER BY created_at DESC
         LIMIT 10
      ) ci
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.event_dashboard_summary(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.event_dashboard_summary(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.event_dashboard_summary(uuid) TO authenticated, service_role;

COMMENT ON FUNCTION public.event_dashboard_summary(uuid) IS
  'Aggregates KPIs + per-tier breakdown + revenue + recent check-ins for the '
  'host event dashboard (task 003). Organizer-only via auth.uid() check; '
  'service_role bypasses for edge fn / test access.';

-- ---------------------------------------------------------------------------
-- 2. Realtime publication for event tables
-- ---------------------------------------------------------------------------

-- Idempotent ALTER: only add if not already present.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime'
       AND schemaname = 'public'
       AND tablename = 'event_orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.event_orders;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime'
       AND schemaname = 'public'
       AND tablename = 'event_attendees'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.event_attendees;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime'
       AND schemaname = 'public'
       AND tablename = 'event_check_ins'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.event_check_ins;
  END IF;
END $$;

-- REPLICA IDENTITY FULL — required for OLD-row payloads on UPDATE so the
-- dashboard can detect qty_pending vs qty_sold transitions.
ALTER TABLE public.event_orders     REPLICA IDENTITY FULL;
ALTER TABLE public.event_attendees  REPLICA IDENTITY FULL;
ALTER TABLE public.event_check_ins  REPLICA IDENTITY FULL;
