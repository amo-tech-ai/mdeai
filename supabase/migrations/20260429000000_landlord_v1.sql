-- Landlord V1 30-day plan — Day 1 schema
-- See: tasks/plan/06-landlord-v1-30day.md §2
--
-- Adds the landlord side of the marketplace:
--   landlord_profiles         host identities (1 per auth.users row)
--   apartments extensions     landlord_id FK + moderation_status + source
--   landlord_inbox            renter→landlord inquiries
--   landlord_inbox_events     audit trail for landlord_inbox
--   verification_requests     ID/doc upload state machine
--   analytics_events_daily    cohort SQL helper, refreshed nightly (D14)
--
-- Naming divergence from plan (Option C agreed 2026-04-28):
--   plan §2.3 "leads"        → table landlord_inbox        (avoids clash with
--                                                            existing P1-CRM leads)
--   plan §2.4 "lead_events"  → table landlord_inbox_events
-- UX/URL/event names ("/host/leads", PostHog leads_viewed, hooks useLeads)
-- intentionally keep the "lead" mental model — only the physical tables rename.
--
-- Reuses existing helpers: update_updated_at(), is_admin().

-- ─────────────────────────────────────────────────────────────────────────
-- 1. landlord_profiles  (plan §2.1)
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.landlord_profiles (
  id                            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                       uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  kind                          text NOT NULL DEFAULT 'individual'
                                CHECK (kind IN ('individual','agent','property_manager')),
  display_name                  text NOT NULL,
  whatsapp_e164                 text,
  phone_e164                    text,
  bio                           text,
  avatar_url                    text,
  primary_neighborhood          text,
  languages                     text[] NOT NULL DEFAULT ARRAY['es']::text[],
  verification_status           text NOT NULL DEFAULT 'pending'
                                CHECK (verification_status IN ('pending','approved','rejected')),
  verified_at                   timestamptz,
  total_listings                integer NOT NULL DEFAULT 0,
  active_listings               integer NOT NULL DEFAULT 0,
  total_leads_received          integer NOT NULL DEFAULT 0,
  total_replies_sent            integer NOT NULL DEFAULT 0,
  median_response_time_minutes  integer,
  notes                         text,
  source                        text,
  created_at                    timestamptz NOT NULL DEFAULT now(),
  updated_at                    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS landlord_profiles_user_idx
  ON public.landlord_profiles(user_id);
CREATE INDEX IF NOT EXISTS landlord_profiles_status_idx
  ON public.landlord_profiles(verification_status);

DROP TRIGGER IF EXISTS landlord_profiles_updated_at ON public.landlord_profiles;
CREATE TRIGGER landlord_profiles_updated_at
  BEFORE UPDATE ON public.landlord_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- 2. apartments extensions  (plan §2.2)
-- ─────────────────────────────────────────────────────────────────────────
-- landlord_id is a NEW FK separate from the existing host_id (which
-- references profiles, populated for the 43 seeded apartments).
-- moderation_status is separate from the existing status column
-- ('active' default) so renter-side queries that filter status='active'
-- keep working unchanged.

ALTER TABLE public.apartments
  ADD COLUMN IF NOT EXISTS landlord_id uuid REFERENCES public.landlord_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual';

DO $$ BEGIN
  ALTER TABLE public.apartments
    ADD CONSTRAINT apartments_moderation_status_check
    CHECK (moderation_status IN ('pending','approved','rejected','archived'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.apartments
    ADD CONSTRAINT apartments_source_check
    CHECK (source IN ('manual','seed','firecrawl','api'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Backfill: existing seeded apartments stay visible to renters.
-- Without this, switching renter queries to moderation_status='approved'
-- would hide all 43 seed listings.
UPDATE public.apartments
   SET moderation_status = 'approved',
       source = 'seed'
 WHERE moderation_status = 'pending';

CREATE INDEX IF NOT EXISTS apartments_landlord_idx
  ON public.apartments(landlord_id) WHERE landlord_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS apartments_moderation_idx
  ON public.apartments(moderation_status, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────
-- 3. landlord_inbox  (plan §2.3, table renamed)
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.landlord_inbox (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel             text NOT NULL DEFAULT 'chat'
                      CHECK (channel IN ('chat','form','whatsapp','admin_manual')),
  conversation_id     uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  renter_id           uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  renter_name         text,
  renter_phone_e164   text,
  renter_email        text,
  apartment_id        uuid REFERENCES public.apartments(id) ON DELETE SET NULL,
  landlord_id         uuid REFERENCES public.landlord_profiles(id) ON DELETE SET NULL,
  raw_message         text NOT NULL,
  structured_profile  jsonb NOT NULL DEFAULT '{}'::jsonb,
  status              text NOT NULL DEFAULT 'new'
                      CHECK (status IN ('new','viewed','replied','archived','spam')),
  viewed_at           timestamptz,
  first_reply_at      timestamptz,
  archived_at         timestamptz,
  archived_reason     text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS landlord_inbox_landlord_status_idx
  ON public.landlord_inbox(landlord_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS landlord_inbox_apartment_idx
  ON public.landlord_inbox(apartment_id, created_at DESC) WHERE apartment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS landlord_inbox_renter_idx
  ON public.landlord_inbox(renter_id, created_at DESC) WHERE renter_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS landlord_inbox_conversation_idx
  ON public.landlord_inbox(conversation_id) WHERE conversation_id IS NOT NULL;

DROP TRIGGER IF EXISTS landlord_inbox_updated_at ON public.landlord_inbox;
CREATE TRIGGER landlord_inbox_updated_at
  BEFORE UPDATE ON public.landlord_inbox
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- 4. landlord_inbox_events  (plan §2.4, table renamed)
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.landlord_inbox_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inbox_id        uuid NOT NULL REFERENCES public.landlord_inbox(id) ON DELETE CASCADE,
  event_type      text NOT NULL CHECK (event_type IN (
                    'created','viewed','whatsapp_clicked','marked_replied',
                    'archived','spam_marked','reopened','admin_assigned'
                  )),
  actor_user_id   uuid REFERENCES auth.users(id),
  actor_kind      text CHECK (actor_kind IN ('renter','landlord','admin','system')),
  metadata        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS landlord_inbox_events_inbox_idx
  ON public.landlord_inbox_events(inbox_id, created_at DESC);
CREATE INDEX IF NOT EXISTS landlord_inbox_events_type_time_idx
  ON public.landlord_inbox_events(event_type, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────
-- 5. verification_requests  (plan §2.5)
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.verification_requests (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id       uuid NOT NULL REFERENCES public.landlord_profiles(id) ON DELETE CASCADE,
  doc_kind          text NOT NULL CHECK (doc_kind IN (
                      'national_id','passport','rut','property_deed','utility_bill'
                    )),
  storage_path      text NOT NULL,
  status            text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','rejected')),
  reviewed_by       uuid REFERENCES auth.users(id),
  reviewed_at       timestamptz,
  rejection_reason  text,
  expires_at        timestamptz,
  uploaded_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS verification_requests_landlord_idx
  ON public.verification_requests(landlord_id);
CREATE INDEX IF NOT EXISTS verification_requests_pending_idx
  ON public.verification_requests(uploaded_at DESC) WHERE status = 'pending';

-- ─────────────────────────────────────────────────────────────────────────
-- 6. analytics_events_daily  (plan §2.6)
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.analytics_events_daily (
  landlord_id              uuid NOT NULL REFERENCES public.landlord_profiles(id) ON DELETE CASCADE,
  date                     date NOT NULL,
  logins                   integer NOT NULL DEFAULT 0,
  listings_created         integer NOT NULL DEFAULT 0,
  listings_edited          integer NOT NULL DEFAULT 0,
  leads_received           integer NOT NULL DEFAULT 0,
  leads_viewed             integer NOT NULL DEFAULT 0,
  whatsapp_clicks          integer NOT NULL DEFAULT 0,
  replies_marked           integer NOT NULL DEFAULT 0,
  affiliate_revenue_cents  integer NOT NULL DEFAULT 0,
  PRIMARY KEY (landlord_id, date)
);

CREATE INDEX IF NOT EXISTS analytics_events_daily_date_idx
  ON public.analytics_events_daily(date DESC);

-- ─────────────────────────────────────────────────────────────────────────
-- 7. acting_landlord_ids() helper  (plan §2.7)
-- ─────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.acting_landlord_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM public.landlord_profiles WHERE user_id = (SELECT auth.uid());
$$;

REVOKE ALL ON FUNCTION public.acting_landlord_ids() FROM public;
GRANT EXECUTE ON FUNCTION public.acting_landlord_ids() TO authenticated, service_role;

COMMENT ON FUNCTION public.acting_landlord_ids() IS
  'Returns landlord_profiles.id rows that auth.uid() can act on. Used in RLS policies for landlord-scoped tables.';

-- ─────────────────────────────────────────────────────────────────────────
-- 8. RLS policies  (plan §2.7)
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE public.landlord_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS landlord_profiles_select_own ON public.landlord_profiles;
CREATE POLICY landlord_profiles_select_own
  ON public.landlord_profiles FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS landlord_profiles_insert_own ON public.landlord_profiles;
CREATE POLICY landlord_profiles_insert_own
  ON public.landlord_profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS landlord_profiles_update_own ON public.landlord_profiles;
CREATE POLICY landlord_profiles_update_own
  ON public.landlord_profiles FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()))
  WITH CHECK (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS landlord_profiles_service_role ON public.landlord_profiles;
CREATE POLICY landlord_profiles_service_role
  ON public.landlord_profiles TO service_role
  USING (true) WITH CHECK (true);

ALTER TABLE public.landlord_inbox ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS landlord_inbox_select ON public.landlord_inbox;
CREATE POLICY landlord_inbox_select
  ON public.landlord_inbox FOR SELECT TO authenticated
  USING (
    landlord_id IN (SELECT public.acting_landlord_ids())
    OR renter_id = (SELECT auth.uid())
    OR (SELECT public.is_admin())
  );

DROP POLICY IF EXISTS landlord_inbox_update ON public.landlord_inbox;
CREATE POLICY landlord_inbox_update
  ON public.landlord_inbox FOR UPDATE TO authenticated
  USING (landlord_id IN (SELECT public.acting_landlord_ids()))
  WITH CHECK (landlord_id IN (SELECT public.acting_landlord_ids()));

DROP POLICY IF EXISTS landlord_inbox_service_role ON public.landlord_inbox;
CREATE POLICY landlord_inbox_service_role
  ON public.landlord_inbox TO service_role
  USING (true) WITH CHECK (true);

ALTER TABLE public.landlord_inbox_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS landlord_inbox_events_select ON public.landlord_inbox_events;
CREATE POLICY landlord_inbox_events_select
  ON public.landlord_inbox_events FOR SELECT TO authenticated
  USING (
    inbox_id IN (
      SELECT id FROM public.landlord_inbox
       WHERE landlord_id IN (SELECT public.acting_landlord_ids())
          OR renter_id = (SELECT auth.uid())
    )
    OR (SELECT public.is_admin())
  );

DROP POLICY IF EXISTS landlord_inbox_events_service_role ON public.landlord_inbox_events;
CREATE POLICY landlord_inbox_events_service_role
  ON public.landlord_inbox_events TO service_role
  USING (true) WITH CHECK (true);

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS verification_requests_select_own ON public.verification_requests;
CREATE POLICY verification_requests_select_own
  ON public.verification_requests FOR SELECT TO authenticated
  USING (
    landlord_id IN (SELECT public.acting_landlord_ids())
    OR (SELECT public.is_admin())
  );

DROP POLICY IF EXISTS verification_requests_insert_own ON public.verification_requests;
CREATE POLICY verification_requests_insert_own
  ON public.verification_requests FOR INSERT TO authenticated
  WITH CHECK (landlord_id IN (SELECT public.acting_landlord_ids()));

DROP POLICY IF EXISTS verification_requests_service_role ON public.verification_requests;
CREATE POLICY verification_requests_service_role
  ON public.verification_requests TO service_role
  USING (true) WITH CHECK (true);

ALTER TABLE public.analytics_events_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS analytics_events_daily_select_own ON public.analytics_events_daily;
CREATE POLICY analytics_events_daily_select_own
  ON public.analytics_events_daily FOR SELECT TO authenticated
  USING (
    landlord_id IN (SELECT public.acting_landlord_ids())
    OR (SELECT public.is_admin())
  );

DROP POLICY IF EXISTS analytics_events_daily_service_role ON public.analytics_events_daily;
CREATE POLICY analytics_events_daily_service_role
  ON public.analytics_events_daily TO service_role
  USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────
-- 9. landlord_profiles_public view  (plan §2.1)
-- ─────────────────────────────────────────────────────────────────────────
-- Safe public read: name, avatar, response stats. Excludes phone/notes/source.
-- security_invoker so the view runs with the caller's RLS, not the owner's.

CREATE OR REPLACE VIEW public.landlord_profiles_public
WITH (security_invoker = true) AS
SELECT
  id,
  display_name,
  avatar_url,
  bio,
  primary_neighborhood,
  languages,
  (verification_status = 'approved') AS is_verified,
  verified_at,
  active_listings,
  total_leads_received,
  median_response_time_minutes,
  created_at
FROM public.landlord_profiles
WHERE verification_status IN ('approved','pending');

GRANT SELECT ON public.landlord_profiles_public TO anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- 10. auto_create_landlord_inbox_from_message trigger  (plan §2.8 fixed)
-- ─────────────────────────────────────────────────────────────────────────
-- Plan §2.8 referenced messages.body and messages.user_id; actual schema
-- has messages.content and conversations.user_id. Rewritten to JOIN.

CREATE OR REPLACE FUNCTION public.auto_create_landlord_inbox_from_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id        uuid;
  v_apartment_id   uuid;
  v_landlord_id    uuid;
  v_user_msg_count integer;
  v_already_exists boolean;
BEGIN
  -- Only act on user-role messages
  IF NEW.role <> 'user' THEN
    RETURN NEW;
  END IF;

  -- Only act on the FIRST user message in this conversation
  SELECT count(*) INTO v_user_msg_count
    FROM public.messages
   WHERE conversation_id = NEW.conversation_id
     AND role = 'user';

  IF v_user_msg_count <> 1 THEN
    RETURN NEW;
  END IF;

  -- Look up conversation owner + apartment hint (if AI router set it)
  SELECT user_id, NULLIF(session_data->>'apartment_id','')::uuid
    INTO v_user_id, v_apartment_id
    FROM public.conversations
   WHERE id = NEW.conversation_id;

  -- Derive landlord from the apartment if known
  IF v_apartment_id IS NOT NULL THEN
    SELECT landlord_id INTO v_landlord_id
      FROM public.apartments
     WHERE id = v_apartment_id;
  END IF;

  -- Idempotency: skip if a row already exists for this conversation
  SELECT EXISTS (
    SELECT 1 FROM public.landlord_inbox
     WHERE conversation_id = NEW.conversation_id
  ) INTO v_already_exists;

  IF v_already_exists THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.landlord_inbox (
    channel, conversation_id, apartment_id, landlord_id,
    renter_id, raw_message, status
  ) VALUES (
    'chat', NEW.conversation_id, v_apartment_id, v_landlord_id,
    v_user_id, NEW.content, 'new'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_create_landlord_inbox_from_message ON public.messages;
CREATE TRIGGER auto_create_landlord_inbox_from_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.auto_create_landlord_inbox_from_message();

-- ─────────────────────────────────────────────────────────────────────────
-- 11. Grants  (RLS still gates rows; these grant table-level access)
-- ─────────────────────────────────────────────────────────────────────────

GRANT SELECT, INSERT, UPDATE ON public.landlord_profiles  TO authenticated;
GRANT ALL                       ON public.landlord_profiles  TO service_role;

GRANT SELECT, UPDATE             ON public.landlord_inbox     TO authenticated;
GRANT ALL                        ON public.landlord_inbox     TO service_role;

GRANT SELECT                     ON public.landlord_inbox_events TO authenticated;
GRANT ALL                        ON public.landlord_inbox_events TO service_role;

GRANT SELECT, INSERT             ON public.verification_requests TO authenticated;
GRANT ALL                        ON public.verification_requests TO service_role;

GRANT SELECT                     ON public.analytics_events_daily TO authenticated;
GRANT ALL                        ON public.analytics_events_daily TO service_role;

-- ─────────────────────────────────────────────────────────────────────────
-- 12. Comments
-- ─────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE public.landlord_profiles IS
  'V1 landlord identity. One row per landlord (links to auth.users). See tasks/plan/06-landlord-v1-30day.md §2.1.';
COMMENT ON TABLE public.landlord_inbox IS
  'V1 renter→landlord inquiries. Renamed from plan §2.3 "leads" to avoid clash with existing P1-CRM leads table.';
COMMENT ON TABLE public.landlord_inbox_events IS
  'V1 audit trail for landlord_inbox. Renamed from plan §2.4 "lead_events".';
COMMENT ON TABLE public.verification_requests IS
  'V1 ID/document upload state machine for landlord verification badge.';
COMMENT ON TABLE public.analytics_events_daily IS
  'V1 cohort SQL helper. Daily snapshot of landlord engagement counts. Refreshed nightly via pg_cron (D14).';
COMMENT ON COLUMN public.apartments.landlord_id IS
  'V1: FK to landlord_profiles. Separate from the existing host_id which references profiles.';
COMMENT ON COLUMN public.apartments.moderation_status IS
  'V1: separate from existing status field. Defaults pending; auto-moderation rules in listing-create edge fn.';
COMMENT ON COLUMN public.apartments.source IS
  'V1: where the listing came from (manual/seed/firecrawl/api). Distinct from source_url and source_listing_id which describe an upstream listing.';
