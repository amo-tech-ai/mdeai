-- Phase 1 events MVP — sample seed data
-- Source: tasks/events/prompts/001-event-schema-migration.md + 100-events-prd.md §6 Q3 (Miss Elegance Colombia 2026)
--
-- Seeds:
--   • 1 organizer profile (or reuses existing if any profile exists)
--   • 1 venue:    Hotel Intercontinental Salón Real (Medellín)
--   • 1 event:    "Reina de Antioquia 2026 Finals" (status=published; Oct 18, 2026 8pm)
--   • 4 tickets:  GA / VIP / Backstage / Frontrow
--   • 2 orders:   1 paid (Camila — full flow exercised) + 1 pending (Maria — cart abandoned)
--   • 3 attendees: 2 active under paid order + 1 pending under pending order
--   • 2 check-ins: 1 'consumed' on Camila's QR + 1 'already_used' replay attempt
--
-- Re-runnable: uses ON CONFLICT DO NOTHING / fixed UUIDs so re-seeding is idempotent.
-- Cleanup: see bottom of file (commented-out DELETE statements).

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- Resolve an organizer: take any existing profile, else fail loud
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_organizer_id uuid;
BEGIN
  SELECT id INTO v_organizer_id FROM public.profiles ORDER BY created_at LIMIT 1;
  IF v_organizer_id IS NULL THEN
    RAISE EXCEPTION 'Cannot seed: no profiles exist. Create at least one auth.users + profiles row first.';
  END IF;
  CREATE TEMP TABLE seed_ctx (organizer_id uuid) ON COMMIT DROP;
  INSERT INTO seed_ctx VALUES (v_organizer_id);
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Fixed UUIDs so seeds are deterministic + re-runnable
-- ─────────────────────────────────────────────────────────────────────────────

-- Venue
WITH ctx AS (SELECT organizer_id FROM seed_ctx)
INSERT INTO public.event_venues (id, organizer_id, name, address, city, postal_code, country, latitude, longitude, capacity, notes)
SELECT
  '11111111-1111-1111-1111-000000000001'::uuid,
  ctx.organizer_id,
  'Hotel Intercontinental — Salón Real',
  'Calle 16 #28-51, El Poblado',
  'Medellín',
  '050021',
  'CO',
  6.20847,
  -75.56873,
  500,
  'Phase 1 seed venue. Hotel ballroom; 500 capacity standing or 300 banquet seating.'
FROM ctx
ON CONFLICT (id) DO NOTHING;

-- Event (uses an existing public.events row template — INSERT or UPDATE in place)
-- The events table predates this migration and has many discovery columns we don't seed.
-- Required: name + event_start_time (legacy NOT NULL). Plus our new Phase 1 columns.
INSERT INTO public.events (
  id, name, description, event_type,
  city, state, country, address,
  event_start_time, event_end_time, timezone,
  is_active, is_verified,
  -- Phase 1 additions:
  slug, status, organizer_id, total_capacity, venue_id, source
)
SELECT
  '22222222-2222-2222-2222-000000000001'::uuid,
  'Reina de Antioquia 2026 Finals',
  'Final stage of Miss Elegance Colombia 2026 — Certamen Nacional de Elegancia, Liderazgo y Autenticidad. Live broadcast from Hotel Intercontinental.',
  'pageant',
  'Medellín', 'Antioquia', 'Colombia', 'Hotel Intercontinental, Calle 16 #28-51, El Poblado, Medellín',
  '2026-10-18 20:00:00-05',
  '2026-10-19 00:30:00-05',
  'America/Bogota',
  true, true,
  'reina-de-antioquia-2026-finals',
  'published',
  ctx.organizer_id,
  500,
  '11111111-1111-1111-1111-000000000001'::uuid,
  'manual'
FROM seed_ctx ctx
ON CONFLICT (id) DO UPDATE SET
  status              = EXCLUDED.status,
  slug                = EXCLUDED.slug,
  organizer_id        = EXCLUDED.organizer_id,
  total_capacity      = EXCLUDED.total_capacity,
  venue_id            = EXCLUDED.venue_id,
  staff_link_version  = public.events.staff_link_version;  -- preserve

-- 4 ticket tiers
INSERT INTO public.event_tickets (id, event_id, name, description, price_cents, currency, qty_total, qty_sold, qty_pending, is_active, position)
VALUES
  ('33333333-3333-3333-3333-000000000001', '22222222-2222-2222-2222-000000000001',
    'GA',        'General Admission seating',     4000000,  'COP',  300, 0, 0, true, 0),
  ('33333333-3333-3333-3333-000000000002', '22222222-2222-2222-2222-000000000001',
    'VIP',       'Front-section seating + welcome drink', 12000000, 'COP', 100, 0, 0, true, 1),
  ('33333333-3333-3333-3333-000000000003', '22222222-2222-2222-2222-000000000001',
    'Backstage', 'Pre-show meet-and-greet + photo with contestants', 40000000, 'COP', 30, 0, 0, true, 2),
  ('33333333-3333-3333-3333-000000000004', '22222222-2222-2222-2222-000000000001',
    'Frontrow',  'First 4 rows + program signed by judges', 8000000, 'COP', 70, 0, 0, true, 3)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- Sample orders + attendees (exercise the full flow)
-- ─────────────────────────────────────────────────────────────────────────────

-- Order 1: PAID (Camila, 1× GA $40,000 COP)
-- We bypass the RPC because seeds run as service_role; fast-path direct INSERT.
INSERT INTO public.event_orders
  (id, event_id, ticket_id, quantity, buyer_email, buyer_name, buyer_phone_e164, total_cents, currency, status, short_id, access_token, stripe_payment_intent)
VALUES
  ('44444444-4444-4444-4444-000000000001',
   '22222222-2222-2222-2222-000000000001',
   '33333333-3333-3333-3333-000000000001',
   1, 'camila.restrepo@example.co', 'Camila Restrepo', '+573005550101',
   4000000, 'COP', 'paid',
   'MDE-SEED01CAMI', 'seed_access_camila_a4f2x1b9c8d7e6f5',
   'pi_seed_camila_paid_001')
ON CONFLICT (id) DO NOTHING;

-- Order 2: PENDING (Maria, 2× VIP — cart abandoned, demonstrates qty_pending behaviour)
INSERT INTO public.event_orders
  (id, event_id, ticket_id, quantity, buyer_email, buyer_name, buyer_phone_e164, total_cents, currency, status, short_id, access_token)
VALUES
  ('44444444-4444-4444-4444-000000000002',
   '22222222-2222-2222-2222-000000000001',
   '33333333-3333-3333-3333-000000000002',
   2, 'maria.gomez@example.co', 'Maria Gómez', '+573005550202',
   24000000, 'COP', 'pending',
   'MDE-SEED02MARI', 'seed_access_maria_z9y8x7w6v5u4t3s2')
ON CONFLICT (id) DO NOTHING;

-- Reflect order 1's commit in qty_sold (paid → counts as sold)
-- Reflect order 2's reservation in qty_pending (pending → reserved but not sold)
UPDATE public.event_tickets SET qty_sold    = 1 WHERE id = '33333333-3333-3333-3333-000000000001';
UPDATE public.event_tickets SET qty_pending = 2 WHERE id = '33333333-3333-3333-3333-000000000002';

-- Attendees for order 1 (PAID → status='active' so QR is scannable)
INSERT INTO public.event_attendees
  (id, order_id, ticket_id, event_id, email, full_name, phone_e164, qr_token, status)
VALUES
  ('55555555-5555-5555-5555-000000000001',
   '44444444-4444-4444-4444-000000000001',
   '33333333-3333-3333-3333-000000000001',
   '22222222-2222-2222-2222-000000000001',
   'camila.restrepo@example.co', 'Camila Restrepo', '+573005550101',
   'seed_jwt_camila_active_eyJhbGciOiJIUzI1NiJ9_demo_only',
   'active')
ON CONFLICT (id) DO NOTHING;

-- Attendees for order 2 (PENDING → status='pending' so scanner returns 'pending_payment')
INSERT INTO public.event_attendees
  (id, order_id, ticket_id, event_id, email, full_name, phone_e164, qr_token, status)
VALUES
  ('55555555-5555-5555-5555-000000000002',
   '44444444-4444-4444-4444-000000000002',
   '33333333-3333-3333-3333-000000000002',
   '22222222-2222-2222-2222-000000000001',
   'maria.gomez@example.co', 'Maria Gómez', '+573005550202',
   'seed_jwt_maria_pending_eyJhbGciOiJIUzI1NiJ9_demo_only',
   'pending'),
  ('55555555-5555-5555-5555-000000000003',
   '44444444-4444-4444-4444-000000000002',
   '33333333-3333-3333-3333-000000000002',
   '22222222-2222-2222-2222-000000000001',
   'guest.maria@example.co', 'Sofía Restrepo (guest of Maria)', '+573005550203',
   'seed_jwt_sofiaguest_pending_eyJhbGciOiJIUzI1NiJ9_demo_only',
   'pending')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- Sample check-ins (exercise success + duplicate-attempt audit trail)
-- ─────────────────────────────────────────────────────────────────────────────

-- Camila gets scanned successfully at the door
INSERT INTO public.event_check_ins
  (event_id, attendee_id, qr_token, scanner_device, ip_address, result, details)
VALUES
  ('22222222-2222-2222-2222-000000000001',
   '55555555-5555-5555-5555-000000000001',
   'seed_jwt_camila_active_eyJhbGciOiJIUzI1NiJ9_demo_only',
   'iPhone 15',
   '186.84.103.42'::inet,
   'consumed',
   jsonb_build_object('attendee_name','Camila Restrepo','ticket_tier','GA'));

-- Mark Camila's QR as used (mirrors what ticket_validate_consume would do on the first scan)
UPDATE public.event_attendees
   SET qr_used_at = now() - interval '1 minute'
 WHERE id = '55555555-5555-5555-5555-000000000001';

-- Replay attempt — staff scans Camila's QR again 1 min later → already_used (logged for forensics)
INSERT INTO public.event_check_ins
  (event_id, attendee_id, qr_token, scanner_device, ip_address, result, details)
VALUES
  ('22222222-2222-2222-2222-000000000001',
   '55555555-5555-5555-5555-000000000001',
   'seed_jwt_camila_active_eyJhbGciOiJIUzI1NiJ9_demo_only',
   'iPhone 15',
   '186.84.103.42'::inet,
   'already_used',
   jsonb_build_object('attendee_name','Camila Restrepo','first_used_at',(now() - interval '1 minute')::text));

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────────
-- POST-SEED VERIFICATION (run as separate query to confirm)
-- ─────────────────────────────────────────────────────────────────────────────
-- SELECT 'venues'      AS t, count(*) FROM public.event_venues
-- UNION ALL SELECT 'tickets',    count(*) FROM public.event_tickets
-- UNION ALL SELECT 'orders',     count(*) FROM public.event_orders
-- UNION ALL SELECT 'attendees',  count(*) FROM public.event_attendees
-- UNION ALL SELECT 'check_ins',  count(*) FROM public.event_check_ins;
--
-- Expected after seeding once:
--   venues=1, tickets=4, orders=2 (1 paid + 1 pending),
--   attendees=3 (1 active + 2 pending), check_ins=2 (consumed + already_used)
--
-- Expected event_tickets state:
--   GA (id=...000000001):   qty_sold=1, qty_pending=0
--   VIP (id=...000000002):  qty_sold=0, qty_pending=2
--   Backstage / Frontrow:   qty_sold=0, qty_pending=0

-- ─────────────────────────────────────────────────────────────────────────────
-- CLEANUP (uncomment + run to undo seeds)
-- ─────────────────────────────────────────────────────────────────────────────
-- BEGIN;
--   DELETE FROM public.event_check_ins WHERE event_id = '22222222-2222-2222-2222-000000000001';
--   DELETE FROM public.event_attendees WHERE event_id = '22222222-2222-2222-2222-000000000001';
--   DELETE FROM public.event_orders    WHERE event_id = '22222222-2222-2222-2222-000000000001';
--   DELETE FROM public.event_tickets   WHERE event_id = '22222222-2222-2222-2222-000000000001';
--   DELETE FROM public.events          WHERE id       = '22222222-2222-2222-2222-000000000001';
--   DELETE FROM public.event_venues    WHERE id       = '11111111-1111-1111-1111-000000000001';
-- COMMIT;
