-- Migration: event_attendees_paginated RPC + extend event_dashboard_summary
-- with latest_stripe_pi for the right-panel Stripe deep-link.
--
-- Companion to: src/pages/host/HostEventDashboard.tsx (task 003 — remaining gaps).
--
-- WHY A SEPARATE PAGINATED RPC: event_dashboard_summary is a STABLE aggregate
-- returning KPIs + tiers + recent check-ins in one round-trip. The attendee
-- list needs pagination + search (ILIKE) — folding that into the same RPC
-- would force the whole aggregate to re-run on every keystroke. Separate RPC
-- keeps the KPI cache warm while the attendee table refetches independently.
--
-- WHY SECURITY DEFINER: event_attendees RLS only exposes rows to the buyer
-- (orders_buyer_select policy). The organizer role has no separate attendees
-- SELECT policy. SECURITY DEFINER with an explicit organizer check lets the
-- organizer read all attendees for their own event.
--
-- WHY latest_stripe_pi in event_dashboard_summary: the Stripe deep-link in
-- the right panel links to a single payment intent. Extending the existing
-- aggregate RPC (CREATE OR REPLACE) avoids a second round-trip and keeps the
-- right panel stateless.

-- ---------------------------------------------------------------------------
-- 1. event_attendees_paginated
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.event_attendees_paginated(
  p_event_id  uuid,
  p_search    text  DEFAULT '',
  p_limit     int   DEFAULT 50,
  p_offset    int   DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_caller uuid := auth.uid();
BEGIN
  -- Organizer guard: service_role (auth.uid() IS NULL) bypasses for edge fn / tests.
  IF v_caller IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.events
       WHERE id = p_event_id AND organizer_id = v_caller
    ) THEN
      RAISE EXCEPTION 'NOT_ORGANIZER' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'total', (
      SELECT count(*)
        FROM public.event_attendees a
       WHERE a.event_id = p_event_id
         AND (
           p_search = ''
           OR lower(a.full_name) ILIKE '%' || lower(p_search) || '%'
           OR lower(a.email)     ILIKE '%' || lower(p_search) || '%'
         )
    ),
    'rows', COALESCE(
      (
        SELECT jsonb_agg(r)
          FROM (
            SELECT jsonb_build_object(
              'id',                    a.id,
              'full_name',             a.full_name,
              'email',                 a.email,
              'status',                a.status,
              'qr_used_at',            a.qr_used_at,
              'tier_name',             t.name,
              'purchase_time',         o.created_at,
              'order_short_id',        o.short_id,
              'stripe_payment_intent', o.stripe_payment_intent
            ) AS r
              FROM public.event_attendees a
              JOIN public.event_orders   o ON o.id = a.order_id
              JOIN public.event_tickets  t ON t.id = o.ticket_id
             WHERE a.event_id = p_event_id
               AND (
                 p_search = ''
                 OR lower(a.full_name) ILIKE '%' || lower(p_search) || '%'
                 OR lower(a.email)     ILIKE '%' || lower(p_search) || '%'
               )
             ORDER BY o.created_at DESC
             LIMIT  p_limit
             OFFSET p_offset
          ) sub
      ),
      '[]'::jsonb
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.event_attendees_paginated(uuid, text, int, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.event_attendees_paginated(uuid, text, int, int) FROM anon;
GRANT  EXECUTE ON FUNCTION public.event_attendees_paginated(uuid, text, int, int)
  TO authenticated, service_role;

COMMENT ON FUNCTION public.event_attendees_paginated(uuid, text, int, int) IS
  'Paginated + searchable attendee list for /host/event/:id dashboard (task 003). '
  'Organizer-only via auth.uid() check; service_role bypasses for edge fn / tests.';

-- ---------------------------------------------------------------------------
-- 2. Update event_dashboard_summary to include latest_stripe_pi
--    (CREATE OR REPLACE — idempotent; retains all existing GRANT/REVOKE)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.event_dashboard_summary(p_event_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_caller uuid := auth.uid();
BEGIN
  IF v_caller IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.events WHERE id = p_event_id AND organizer_id = v_caller
    ) THEN
      RAISE EXCEPTION 'NOT_ORGANIZER' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'event', (
      SELECT jsonb_build_object(
        'id',                 e.id,
        'name',               e.name,
        'status',             e.status,
        'event_start_time',   e.event_start_time,
        'event_end_time',     e.event_end_time,
        'staff_link_version', e.staff_link_version,
        'address',            e.address
      )
      FROM public.events e WHERE e.id = p_event_id
    ),
    'kpis', (
      SELECT jsonb_build_object(
        'tickets_sold',  count(*) FILTER (WHERE status = 'active'),
        'checked_in',    count(*) FILTER (WHERE qr_used_at IS NOT NULL),
        'no_shows',      count(*) FILTER (WHERE status = 'active' AND qr_used_at IS NULL)
      )
      FROM public.event_attendees WHERE event_id = p_event_id
    ),
    'revenue_cents', (
      SELECT coalesce(sum(total_cents), 0)
        FROM public.event_orders
       WHERE event_id = p_event_id AND status IN ('paid', 'partial_refund')
    ),
    'tiers', (
      SELECT coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id',                 t.id,
            'name',               t.name,
            'qty_total',          t.qty_total,
            'qty_sold',           t.qty_sold,
            'qty_pending',        t.qty_pending,
            'remaining',          t.qty_total - t.qty_sold - t.qty_pending,
            'price_cents',        t.price_cents,
            'currency',           t.currency,
            'tier_revenue_cents', coalesce((
              SELECT sum(o.total_cents)
                FROM public.event_orders o
               WHERE o.ticket_id = t.id AND o.status IN ('paid', 'partial_refund')
            ), 0)
          )
          ORDER BY t.position
        ),
        '[]'::jsonb
      )
      FROM public.event_tickets t WHERE t.event_id = p_event_id
    ),
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
    ),
    -- Latest paid Stripe payment intent for the right-panel deep-link.
    -- NULL when no paid orders exist or Stripe is not yet wired up.
    'latest_stripe_pi', (
      SELECT stripe_payment_intent
        FROM public.event_orders
       WHERE event_id = p_event_id
         AND status IN ('paid', 'partial_refund')
         AND stripe_payment_intent IS NOT NULL
       ORDER BY created_at DESC
       LIMIT 1
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.event_dashboard_summary(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.event_dashboard_summary(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.event_dashboard_summary(uuid) TO authenticated, service_role;

COMMENT ON FUNCTION public.event_dashboard_summary(uuid) IS
  'Aggregates KPIs + per-tier breakdown + revenue + recent check-ins + latest_stripe_pi '
  'for the host event dashboard (task 003). Organizer-only via auth.uid() check; '
  'service_role bypasses for edge fn / test access.';
