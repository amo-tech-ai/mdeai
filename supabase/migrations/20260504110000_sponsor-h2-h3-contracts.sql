-- ============================================================
-- Tasks 055 + H2 + H3 — Sponsor audit fixes + contracts schema
--
-- H2: approve_sponsor_application — replace hardcoded surfaces with
--     activation_type-aware mapping (prevents venue_sponsor from getting
--     digital ad slots it shouldn't have)
-- H3: sponsor.applications — add rejected_by + rejected_at columns
-- 055: sponsor.contracts — click-wrap contract table + RLS
-- ============================================================

-- ── H3: Add rejected_by + rejected_at to sponsor.applications ───────────────
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'sponsor' AND table_name = 'applications'
      AND column_name = 'rejected_by'
  ) THEN
    ALTER TABLE sponsor.applications
      ADD COLUMN rejected_by  uuid REFERENCES auth.users(id),
      ADD COLUMN rejected_at  timestamptz;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS sponsor_apps_rejected_by_idx
  ON sponsor.applications(rejected_by) WHERE rejected_by IS NOT NULL;

-- ── H2: approve_sponsor_application — activation_type-aware placement surfaces
CREATE OR REPLACE FUNCTION public.approve_sponsor_application(
  p_application_id uuid,
  p_approved_by    uuid        -- backward compat; overridden by auth.uid()
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public, sponsor
AS $$
DECLARE
  v_caller_id   uuid;
  v_caller_role text;
  v_app         sponsor.applications%ROWTYPE;
  v_surfaces    text[];
BEGIN
  -- Auth + admin guard
  v_caller_id := (SELECT auth.uid());
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED: must be logged in';
  END IF;

  SELECT role::text INTO v_caller_role
    FROM public.profiles WHERE id = v_caller_id;
  IF v_caller_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'FORBIDDEN: admin role required';
  END IF;

  SELECT * INTO v_app
    FROM sponsor.applications WHERE id = p_application_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'APPLICATION_NOT_FOUND'; END IF;
  IF v_app.status NOT IN ('submitted', 'under_review') THEN
    RAISE EXCEPTION 'APPLICATION_NOT_APPROVABLE: %', v_app.status;
  END IF;

  -- Map activation_type → digital surfaces
  v_surfaces := CASE v_app.activation_type
    WHEN 'digital'            THEN ARRAY['contest_header', 'leaderboard_footer']
    WHEN 'title_naming'       THEN ARRAY['contest_header', 'digital_banner']
    WHEN 'category_powered_by'THEN ARRAY['category_header']
    WHEN 'contestant_sponsor' THEN ARRAY['contestant_profile']
    WHEN 'venue_sponsor'      THEN ARRAY['qr_station']
    ELSE                           ARRAY['contest_header']
  END;

  UPDATE sponsor.applications
     SET status      = 'approved',
         approved_at = now(),
         approved_by = v_caller_id
   WHERE id = p_application_id;

  INSERT INTO sponsor.placements
    (application_id, surface, utm_destination, start_at, end_at, weight)
  SELECT
    p_application_id,
    unnest(v_surfaces),
    'https://mdeai.co/sponsor/' || p_application_id,
    now(),
    now() + interval '90 days',
    CASE v_app.tier
      WHEN 'gold'    THEN 150
      WHEN 'premium' THEN 200
      ELSE 100
    END;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.approve_sponsor_application(uuid, uuid) FROM anon, PUBLIC;
GRANT  EXECUTE ON FUNCTION public.approve_sponsor_application(uuid, uuid) TO authenticated, service_role;

-- ── 055: sponsor.contracts table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sponsor.contracts (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id            uuid NOT NULL REFERENCES sponsor.applications(id) ON DELETE CASCADE,
  template_version          text NOT NULL DEFAULT 'v1.0',

  organizer_user_id         uuid NOT NULL REFERENCES auth.users(id),
  sponsor_user_id           uuid NOT NULL REFERENCES auth.users(id),

  agreed_amount_cents       int  NOT NULL,
  agreed_currency           text NOT NULL DEFAULT 'COP',
  agreed_pricing_model      text NOT NULL,
  agreed_deliverables       jsonb NOT NULL DEFAULT '[]',

  cancellation_window_days  int  NOT NULL DEFAULT 7,
  ip_ownership              text NOT NULL DEFAULT 'shared'
    CHECK (ip_ownership IN ('sponsor','platform','shared')),
  exclusivity_scope         text
    CHECK (exclusivity_scope IS NULL OR exclusivity_scope IN ('category','event','platform')),

  pdf_storage_path          text,
  signature_request_id      text UNIQUE,
  organizer_signed_at       timestamptz,
  sponsor_signed_at         timestamptz,
  signed_ip_hash            text,
  sponsor_display_name      text,

  contract_start_at         timestamptz NOT NULL,
  contract_end_at           timestamptz NOT NULL,

  status  text NOT NULL DEFAULT 'draft' CHECK (status IN
    ('draft','sent_for_signature','signed','active','expired','cancelled','disputed')),

  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  UNIQUE (application_id)
);

CREATE INDEX IF NOT EXISTS sponsor_contracts_app_idx
  ON sponsor.contracts(application_id);
CREATE INDEX IF NOT EXISTS sponsor_contracts_sponsor_idx
  ON sponsor.contracts(sponsor_user_id);
CREATE INDEX IF NOT EXISTS sponsor_contracts_status_idx
  ON sponsor.contracts(status)
  WHERE status NOT IN ('expired','cancelled');

ALTER TABLE sponsor.contracts ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS sponsor_contracts_updated_at ON sponsor.contracts;
CREATE TRIGGER sponsor_contracts_updated_at
  BEFORE UPDATE ON sponsor.contracts
  FOR EACH ROW EXECUTE FUNCTION sponsor.set_updated_at();

-- Sponsor reads their own contract; organizer reads all contracts for their events
DROP POLICY IF EXISTS sponsor_contracts_sponsor_select  ON sponsor.contracts;
DROP POLICY IF EXISTS sponsor_contracts_organizer_select ON sponsor.contracts;

CREATE POLICY sponsor_contracts_sponsor_select ON sponsor.contracts
  FOR SELECT TO authenticated
  USING (sponsor_user_id = (SELECT auth.uid()));

CREATE POLICY sponsor_contracts_organizer_select ON sponsor.contracts
  FOR SELECT TO authenticated
  USING (organizer_user_id = (SELECT auth.uid()));
-- All writes are service_role only (contract-generate + contract-sign edge fns)
