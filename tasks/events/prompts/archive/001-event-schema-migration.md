---
task_id: 001-event-schema-migration
diagram_id: MVP-GAP
prd_section: 18-mvp-gap.md + 100-events-prd.md §4.6.1 (HE-1 partial) + founder May 3 schema additions
title: Phase 1 events schema — ALTER events + 5 new tables + RPCs + triggers
phase: PHASE-1-EVENTS
priority: P0
status: Done
estimated_effort: 1.5 days
implementation: supabase/migrations/20260503011925_event_phase1.sql
area: backend
skill:
  - supabase
  - supabase-postgres-best-practices
  - mdeai-project-gates
edge_function: null
schema_tables:
  - public.events           # ALTER (slug, status, organizer_id, total_capacity, staff_link_version)
  - public.event_venues     # NEW
  - public.event_tickets    # NEW (with sale windows, min/max per order, updated_at)
  - public.event_orders     # NEW (with ticket_id, quantity, phone_e164, payment FK, access_token, stripe_payment_intent)
  - public.event_attendees  # NEW (caller-provided id for JWT match, phone_e164, pending status)
  - public.event_check_ins  # NEW (audit trail per scan — who, when, device, success/failure)
depends_on: []
mermaid_diagram: ../diagrams/18-mvp-gap.md
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-1-EVENTS — release blocker; foundation for tasks 002–009 |
| **Schema** | 1 ALTER (`public.events`) + 5 NEW tables |
| **Triggers** | `updated_at` auto-touch on every mutable table; reusable `set_updated_at()` function |
| **RPCs** | `ticket_checkout_create_pending`, `ticket_payment_finalize`, `ticket_payment_refund`, `ticket_validate_consume`, `record_check_in`, `get_anonymous_order` (5 SECURITY DEFINER fns) |
| **RLS** | All tables enabled. Public SELECT on published events + active tickets + venues. Authenticated buyer sees own. Organizer sees own event's data. Anon buyer reads via `get_anonymous_order` RPC + access_token (no direct RLS) |
| **Migration file** | `supabase/migrations/<timestamp>_event_phase1.sql` |
| **Real-world** | Migration runs cleanly; existing `events`/`bookings`/`payments` rows untouched; advisor passes; Andrés's first scan logged in `event_check_ins`; refund decrements `qty_sold` and flips attendees |

## Description

**The situation.** mdeai has 44+ production tables. Phase 1 needs **6 events tables** (1 existing + 5 new) for: organizer ownership + status workflow on events, ticket inventory with sale-time windows, multi-attendee orders with payment ledger linkage, per-person attendees with QR tokens, venue addressing distinct from event-level address, and a check-in audit trail (who scanned what, when, on which device, success/failure).

**Why orders + attendees split.** One purchase can have multiple attendees ("buy 1 GA + 2 VIP for me + Maria + Juan"). Conflating into a single `bookings` row breaks multi-attendee buys. Hi.Events split them in 2024-09 for the same reason.

**Why event_check_ins (not just `qr_used_at`).** A single timestamp tells you scanned-or-not, but not: which staff member scanned, which device, did the scan succeed or fail (counterfeit vs. already-used), how many duplicate attempts. The audit table records every scan attempt for forensics. `event_attendees.qr_used_at` remains as the fast yes/no for door scan UX; `event_check_ins` is the durable log.

**Why event_venues.** Phase 1 doesn't need festival/multi-venue logic, but it does need a clean shape so that Phase 2/3 can extend without breaking the API. Today: each event has one venue. The denormalized `events.address` column stays for legacy Google Places + Ticketmaster catalog rows; new events created via task 002 wizard create both `event_venues` row and `events.address` (denormalized for fast filtering).

**Why ticket sale windows + min/max-per-order.** Organizers commonly run "early bird until X date" or "limit 4 tickets per buyer" — without these columns, the wizard either lies or the dashboard fails. Adding them now (cheap) is far cheaper than later (touching every checkout call).

**Why phone_e164 on orders + attendees.** WhatsApp reminders (Phase 1.5) need phone numbers. Optional in P1, mandatory in P1.5+. Capturing now means no schema change later.

**Why payment_id FK to public.payments.** mdeai already has a Stripe ledger (`public.payments` from `20260404120005_p1_payments.sql`). Linking `event_orders.payment_id` to that ledger means refunds + reconciliation reuse the existing money infrastructure instead of forking ticket-payments off into a separate ledger.

**Why caller-provided `event_attendees.id`.** Pre-mint UUID in JS at checkout, sign JWT with that UUID, then INSERT — JWT and row PK always match (no stale-random-UUID problem from the original draft).

**What stays untouched.** `public.bookings` (apartment/car/restaurant — different domain), `public.payments` (extended via FK only — no schema change), `idempotency_keys`, `profiles`, all 14 existing edge functions.

## The migration

```sql
-- 0. Reusable updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- 1. ALTER existing events table — additive only
ALTER TABLE public.events
  ADD COLUMN slug                text,
  ADD COLUMN status              text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','published','live','closed','archived')),
  ADD COLUMN organizer_id        uuid REFERENCES public.profiles(id),
  ADD COLUMN total_capacity      int,
  ADD COLUMN staff_link_version  int  NOT NULL DEFAULT 1,  -- bump to revoke staff JWTs
  ADD COLUMN venue_id            uuid,                     -- nullable; FK added below after event_venues exists
  ADD COLUMN updated_at          timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX events_slug_uk        ON public.events(slug) WHERE slug IS NOT NULL;
CREATE        INDEX events_organizer_idx  ON public.events(organizer_id) WHERE organizer_id IS NOT NULL;
CREATE        INDEX events_status_idx     ON public.events(status);

CREATE TRIGGER events_set_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. NEW: event_venues — distinct from inline events.address for clean P2 evolution
CREATE TABLE public.event_venues (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id    uuid NOT NULL REFERENCES public.profiles(id),
  name            text NOT NULL,
  address         text NOT NULL,
  city            text NOT NULL,
  postal_code     text,
  country         text NOT NULL DEFAULT 'CO',
  latitude        numeric(9,6),
  longitude       numeric(9,6),
  capacity        int,                 -- venue's max-people; nullable for outdoor/flexible
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX event_venues_org_idx  ON public.event_venues(organizer_id);
CREATE INDEX event_venues_city_idx ON public.event_venues(city);
ALTER TABLE  public.event_venues ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER event_venues_set_updated_at BEFORE UPDATE ON public.event_venues FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Now wire events.venue_id FK
ALTER TABLE public.events
  ADD CONSTRAINT events_venue_fkey FOREIGN KEY (venue_id) REFERENCES public.event_venues(id);

-- 3. NEW: event_tickets — ticket types per event with sale windows + per-order limits
CREATE TABLE public.event_tickets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name            text NOT NULL,
  description     text,
  price_cents     int  NOT NULL CHECK (price_cents >= 0),
  currency        text NOT NULL DEFAULT 'COP',
  qty_total       int  NOT NULL CHECK (qty_total > 0),
  qty_sold        int  NOT NULL DEFAULT 0,
  is_active       boolean NOT NULL DEFAULT true,
  position        int  NOT NULL DEFAULT 0,
  sale_starts_at  timestamptz,                      -- nullable = sales open immediately on publish
  sale_ends_at    timestamptz,                      -- nullable = sales close at event start
  min_per_order   int  NOT NULL DEFAULT 1  CHECK (min_per_order >= 1),
  max_per_order   int  NOT NULL DEFAULT 10 CHECK (max_per_order >= min_per_order AND max_per_order <= 50),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CHECK (qty_sold <= qty_total),
  CHECK (sale_ends_at IS NULL OR sale_starts_at IS NULL OR sale_ends_at > sale_starts_at)
);
CREATE INDEX event_tickets_event_idx ON public.event_tickets(event_id);
ALTER TABLE  public.event_tickets ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER event_tickets_set_updated_at BEFORE UPDATE ON public.event_tickets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. NEW: event_orders — one purchase, parent of N attendees, ledger-linked
CREATE TABLE public.event_orders (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id              uuid NOT NULL REFERENCES public.events(id),
  ticket_id             uuid NOT NULL REFERENCES public.event_tickets(id),
  quantity              int  NOT NULL CHECK (quantity > 0 AND quantity <= 50),
  buyer_user_id         uuid REFERENCES auth.users(id),  -- nullable for anon
  buyer_email           text NOT NULL,
  buyer_name            text NOT NULL,
  buyer_phone_e164      text,                            -- optional; for WhatsApp (Phase 1.5)
  total_cents           int  NOT NULL,
  currency              text NOT NULL DEFAULT 'COP',
  payment_id            uuid REFERENCES public.payments(id),  -- FK to existing Stripe ledger
  stripe_session_id     text,
  stripe_payment_intent text,
  status                text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','paid','partial_refund','refunded','cancelled')),  -- partial_refund added per founder
  short_id              text NOT NULL UNIQUE,            -- "MDE-A4F2X1"
  access_token          text NOT NULL UNIQUE,            -- anon-buyer email-link auth
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX event_orders_event_idx  ON public.event_orders(event_id);
CREATE INDEX event_orders_buyer_idx  ON public.event_orders(buyer_user_id) WHERE buyer_user_id IS NOT NULL;
CREATE INDEX event_orders_status_idx ON public.event_orders(status);
CREATE INDEX event_orders_pi_idx     ON public.event_orders(stripe_payment_intent) WHERE stripe_payment_intent IS NOT NULL;
ALTER TABLE  public.event_orders ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER event_orders_set_updated_at BEFORE UPDATE ON public.event_orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4b. ALTER public.payments — generalize ledger to support BOTH bookings (existing) AND event_orders (new).
--     Per audit #2 B1: existing payments.booking_id is NOT NULL — would block event-ticket payments.
--     Fix: drop NOT NULL + add event_order_id + CHECK constraint enforcing exactly one source.
ALTER TABLE public.payments ALTER COLUMN booking_id DROP NOT NULL;
ALTER TABLE public.payments ADD COLUMN event_order_id uuid REFERENCES public.event_orders(id);
ALTER TABLE public.payments ADD CONSTRAINT payments_source_chk CHECK (
  (booking_id IS NOT NULL AND event_order_id IS NULL)
  OR (booking_id IS NULL AND event_order_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_payments_event_order_id
  ON public.payments(event_order_id) WHERE event_order_id IS NOT NULL;

-- New RLS policy for event-order payments (existing booking-payment policies untouched; Postgres OR-unions)
CREATE POLICY payments_event_order_select ON public.payments FOR SELECT
  USING (
    payments.event_order_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.event_orders o
      WHERE o.id = payments.event_order_id AND (
        o.buyer_user_id = (select auth.uid())
        OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = o.event_id AND e.organizer_id = (select auth.uid()))
      )
    )
  );

-- 5. NEW: event_attendees — per-person record carrying the QR. id is caller-provided so JWT.attendee_id matches.
CREATE TABLE public.event_attendees (
  id            uuid PRIMARY KEY,                            -- caller-provided UUID (JWT match)
  order_id      uuid NOT NULL REFERENCES public.event_orders(id) ON DELETE CASCADE,
  ticket_id     uuid NOT NULL REFERENCES public.event_tickets(id),
  event_id      uuid NOT NULL REFERENCES public.events(id),  -- denormalized for fast scanner lookup
  email         text NOT NULL,
  full_name     text NOT NULL,
  phone_e164    text,                                        -- optional; SMS/WhatsApp reminders
  qr_token      text NOT NULL UNIQUE,                        -- HS256 JWT signed at checkout
  qr_used_at    timestamptz,                                  -- fast yes/no for door scanner UX
  status        text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','active','cancelled','refunded')),  -- 'pending' before Stripe confirms
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX event_attendees_order_idx ON public.event_attendees(order_id);
CREATE INDEX event_attendees_event_idx ON public.event_attendees(event_id);
ALTER TABLE  public.event_attendees ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER event_attendees_set_updated_at BEFORE UPDATE ON public.event_attendees FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. NEW: event_check_ins — audit trail per scan (forensics + ops monitoring)
CREATE TABLE public.event_check_ins (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES public.events(id),
  attendee_id     uuid REFERENCES public.event_attendees(id),  -- nullable: failed scans w/ unknown token
  qr_token        text NOT NULL,                                -- always recorded (even on failure)
  scanned_by      uuid REFERENCES auth.users(id),               -- nullable: anonymous staff via short-lived JWT
  scanner_device  text,                                          -- "iPhone 15", "Pixel 8" — from User-Agent
  ip_address      inet,
  result          text NOT NULL CHECK (result IN
    ('consumed','already_used','wrong_event','event_ended',
     'invalid_signature','unknown_token','refunded','cancelled','pending_payment')),
  details         jsonb DEFAULT '{}'::jsonb,                    -- e.g., {first_used_at, attendee_name}
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX event_check_ins_event_idx       ON public.event_check_ins(event_id, created_at DESC);
CREATE INDEX event_check_ins_attendee_idx    ON public.event_check_ins(attendee_id) WHERE attendee_id IS NOT NULL;
CREATE INDEX event_check_ins_failures_idx    ON public.event_check_ins(event_id, result) WHERE result <> 'consumed';
ALTER TABLE  public.event_check_ins ENABLE ROW LEVEL SECURITY;
-- No updated_at trigger — check-in records are immutable.
```

## RLS policies

```sql
-- event_venues: public SELECT only when the venue has at least one published/live event;
-- otherwise visible only to the organizer (audit #2 R: don't expose draft/private venue rows)
CREATE POLICY venues_public_select ON public.event_venues FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.venue_id = event_venues.id AND e.status IN ('published','live')
  ));
CREATE POLICY venues_owner_all ON public.event_venues FOR ALL
  USING (organizer_id = (select auth.uid()));

-- event_tickets: SELECT only on published-event tickets; organizer manages
CREATE POLICY tickets_public_select   ON public.event_tickets FOR SELECT
  USING (is_active = true AND EXISTS (
    SELECT 1 FROM public.events e WHERE e.id = event_tickets.event_id AND e.status IN ('published','live')
  ));
CREATE POLICY tickets_organizer_all   ON public.event_tickets FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.events e WHERE e.id = event_tickets.event_id AND e.organizer_id = (select auth.uid())
  ));

-- event_orders: authenticated buyer sees own; organizer sees own event; anon via RPC only (no policy)
CREATE POLICY orders_buyer_select     ON public.event_orders FOR SELECT
  USING (buyer_user_id = (select auth.uid()));
CREATE POLICY orders_organizer_select ON public.event_orders FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.events e WHERE e.id = event_orders.event_id AND e.organizer_id = (select auth.uid())
  ));
-- INSERT/UPDATE/DELETE: service-role-only

-- event_attendees: visible via order chain
CREATE POLICY attendees_via_order_select ON public.event_attendees FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.event_orders o WHERE o.id = event_attendees.order_id AND (
      o.buyer_user_id = (select auth.uid())
      OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = o.event_id AND e.organizer_id = (select auth.uid()))
    )
  ));

-- event_check_ins: organizer sees own event's logs only
CREATE POLICY checkins_organizer_select ON public.event_check_ins FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.events e WHERE e.id = event_check_ins.event_id AND e.organizer_id = (select auth.uid())
  ));
-- INSERT: service-role-only (via record_check_in RPC, called from task 006)
```

## SECURITY DEFINER RPCs (anchor list — full bodies in their owning tasks)

```sql
-- Anon order lookup — see task 008
CREATE FUNCTION public.get_anonymous_order(p_order_id uuid, p_access_token text) RETURNS jsonb ...

-- Checkout — see task 004
CREATE FUNCTION public.ticket_checkout_create_pending(...) RETURNS jsonb ...

-- Webhook finalize + refund — see task 005
CREATE FUNCTION public.ticket_payment_finalize(p_order_id uuid, p_payment_intent_id text) RETURNS jsonb ...
CREATE FUNCTION public.ticket_payment_refund(p_order_id uuid)                            RETURNS void ...

-- Door scan + audit — see task 006 (validate) + this task (record_check_in helper)
CREATE FUNCTION public.ticket_validate_consume(p_qr_token text) RETURNS jsonb ...

-- Audit trail helper — called from task 006 after every scan attempt (success or failure)
CREATE OR REPLACE FUNCTION public.record_check_in(
  p_event_id      uuid,
  p_attendee_id   uuid,
  p_qr_token      text,
  p_scanned_by    uuid,
  p_scanner_device text,
  p_ip_address    inet,
  p_result        text,
  p_details       jsonb
) RETURNS uuid LANGUAGE sql SECURITY DEFINER AS $$
  INSERT INTO public.event_check_ins
    (event_id, attendee_id, qr_token, scanned_by, scanner_device, ip_address, result, details)
  VALUES
    (p_event_id, p_attendee_id, p_qr_token, p_scanned_by, p_scanner_device, p_ip_address, p_result, p_details)
  RETURNING id;
$$;
GRANT EXECUTE ON FUNCTION public.record_check_in(uuid, uuid, text, uuid, text, inet, text, jsonb) TO service_role;
```

## Acceptance Criteria

- [ ] Migration runs cleanly via `supabase db push` against fresh DB AND staging mirror.
- [ ] All 6 schema changes + payments ALTER succeed atomically (transactional migration).
- [ ] `relrowsecurity = true` for all 5 new tables.
- [ ] Existing rows in `public.events`, `public.bookings`, `public.payments` untouched.
- [ ] `payments.booking_id` is nullable post-migration; existing rows still satisfy `payments_source_chk` (booking_id IS NOT NULL ∧ event_order_id IS NULL).
- [ ] New `payments.event_order_id` FK + index created.
- [ ] Inserting a payment with both `booking_id` AND `event_order_id` raises `payments_source_chk` violation.
- [ ] Inserting a payment with neither raises `payments_source_chk` violation.
- [ ] `events.staff_link_version` defaults to `1` for all existing rows.
- [ ] `events.venue_id` is nullable + FK to `event_venues` (optional in P1; required when wizard creates the venue).
- [ ] `event_tickets` constraints: `max_per_order >= min_per_order`, `sale_ends_at > sale_starts_at` when both set.
- [ ] `event_orders.ticket_id` and `event_orders.quantity` are NOT NULL with FK + CHECK.
- [ ] `event_orders.payment_id` is FK to `public.payments(id)`; nullable until webhook fires.
- [ ] `event_orders.status` CHECK includes `partial_refund`.
- [ ] `event_attendees.id` is **NOT** auto-defaulted (caller must provide; verified by `INSERT ... DEFAULT VALUES` failing).
- [ ] `event_check_ins.result` CHECK enforces all 9 audit codes.
- [ ] `set_updated_at()` trigger fires on UPDATE for events / event_venues / event_tickets / event_orders / event_attendees.
- [ ] Supabase advisor (`get_advisors lints=security`) returns zero errors after migration.
- [ ] Service-role can INSERT into all 6 tables; anon INSERT fails on event_orders + event_attendees + event_check_ins.
- [ ] Anon SELECT on `event_tickets` returns rows only where parent event is `published` or `live`.
- [ ] Anon SELECT on `event_orders` returns 0 rows; `get_anonymous_order` returns the order with valid token.
- [ ] `record_check_in` succeeds for both `consumed` and failure results (`already_used`, `invalid_signature`, etc.).

## Failure handling

- Migration fails partway → entire transaction rolls back; clean state.
- Existing `events` rows with null `status` → DEFAULT covers; verify zero NULLs post-migration.
- `slug` collision on existing rows → partial UNIQUE INDEX `WHERE slug IS NOT NULL` allows nulls.
- `access_token` collision → 1 in 2^128 with `crypto.randomUUID()`; UNIQUE constraint catches.

## Wiring plan

1. Read `supabase/migrations/20260423120000_durable_rate_limiter.sql` for the established migration pattern.
2. Read `supabase/migrations/20260404120005_p1_payments.sql` for `public.payments` shape (FK target).
3. Generate timestamp via `date +%Y%m%d%H%M%S`.
4. Write migration to `supabase/migrations/<ts>_event_phase1.sql` with the full SQL above + the 5 SECURITY DEFINER RPCs (3 of which live in tasks 004 + 005 + 006 — link to those task PRs).
5. Test: `supabase db reset && supabase db push`.
6. Inspect via Supabase Studio.
7. Run `mcp__ed3787fc__get_advisors lints=security` — expect zero errors.
8. Push to staging, validate, merge.

## Future schema additions (not in this task)

- **Phase 1.5:** `event_promo_codes` (task 025), `event_order_refunds` (task 026), `event_taxes_and_fees` (task 027).
- **Phase 2:** `event_stakeholders` (task 028), `event_vendors` (task 029), `event_media_assets` (task 030), `event_sponsors` link (task 031), `event_attendee_profiles` (task 032).

These are explicitly **NOT** in Phase 1. Document them as future ALTERs against the schema this task creates.

## See also

- [`../diagrams/18-mvp-gap.md`](../diagrams/18-mvp-gap.md) — visual gap diagram
- [`../diagrams/16-current-supabase-erd.md`](../diagrams/16-current-supabase-erd.md) — what exists today
- [`004-ticket-checkout-edge-fn.md`](./004-ticket-checkout-edge-fn.md) — uses `ticket_id`, `quantity`, `access_token`, `attendee.id` mint
- [`005-ticket-payment-webhook.md`](./005-ticket-payment-webhook.md) — uses `stripe_payment_intent`, `partial_refund` status
- [`006-ticket-validate-edge-fn.md`](./006-ticket-validate-edge-fn.md) — uses `staff_link_version`, calls `record_check_in`
- [`003-host-event-dashboard.md`](./003-host-event-dashboard.md) — reads `event_check_ins` for audit panel
- `supabase/migrations/20260404120005_p1_payments.sql` — `public.payments` FK target
- `.claude/rules/supabase-patterns.md` — RLS subquery pattern
