-- ============================================================
-- Sponsor security + RLS hardening
-- Fixes from 2026-05-04 forensic audit gate run:
--   1. REVOKE approve_sponsor_application from anon / PUBLIC + add admin guard
--   2. Add SELECT policies on attributions, clicks, impressions (had RLS but no policies)
--   3. Drop redundant orgs_contact_unique index (duplicate of sponsor_orgs_contact_unique)
-- ============================================================

-- ── 1. Lock down approve_sponsor_application ─────────────────────────────────
-- PostgreSQL grants EXECUTE to PUBLIC by default for new functions; revoke it.
REVOKE EXECUTE ON FUNCTION public.approve_sponsor_application(uuid, uuid) FROM anon, PUBLIC;

-- Re-create with an admin guard. Signature unchanged so frontend keeps working.
-- We IGNORE p_approved_by from the caller; always use auth.uid() internally.
CREATE OR REPLACE FUNCTION public.approve_sponsor_application(
  p_application_id uuid,
  p_approved_by    uuid        -- kept for backward compat; overridden by auth.uid()
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public, sponsor
AS $$
DECLARE
  v_caller_id uuid;
  v_caller_role text;
  v_app sponsor.applications%ROWTYPE;
BEGIN
  -- Resolve caller from JWT claims
  v_caller_id := (SELECT auth.uid());

  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED: must be logged in';
  END IF;

  -- Verify admin or super_admin
  SELECT role::text INTO v_caller_role
    FROM public.profiles
   WHERE id = v_caller_id;

  IF v_caller_role NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'FORBIDDEN: admin role required';
  END IF;

  SELECT * INTO v_app
    FROM sponsor.applications
   WHERE id = p_application_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'APPLICATION_NOT_FOUND';
  END IF;

  IF v_app.status NOT IN ('submitted', 'under_review') THEN
    RAISE EXCEPTION 'APPLICATION_NOT_APPROVABLE: %', v_app.status;
  END IF;

  UPDATE sponsor.applications
     SET status      = 'approved',
         approved_at = now(),
         approved_by = v_caller_id        -- always the real authenticated admin
   WHERE id = p_application_id;

  INSERT INTO sponsor.placements
    (application_id, surface, utm_destination, start_at, end_at, weight)
  SELECT
    p_application_id,
    unnest(ARRAY['contest_header', 'leaderboard_footer']),
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

-- Allow authenticated admins to call via REST; anon/PUBLIC already revoked above
GRANT EXECUTE ON FUNCTION public.approve_sponsor_application(uuid, uuid) TO authenticated, service_role;

-- ── 2. RLS policies for sponsor.attributions ─────────────────────────────────
-- Edge fns write via service_role (bypasses RLS); sponsors read their own data.
DROP POLICY IF EXISTS sponsor_attributions_org_select ON sponsor.attributions;
CREATE POLICY sponsor_attributions_org_select ON sponsor.attributions
  FOR SELECT TO authenticated
  USING (
    placement_id IN (
      SELECT pl.id FROM sponsor.placements pl
      JOIN sponsor.applications a ON a.id = pl.application_id
      JOIN sponsor.organizations o ON o.id = a.organization_id
      WHERE o.primary_contact_user_id = (SELECT auth.uid())
    )
  );

-- ── 3. RLS policies for sponsor.clicks ───────────────────────────────────────
DROP POLICY IF EXISTS sponsor_clicks_org_select ON sponsor.clicks;
CREATE POLICY sponsor_clicks_org_select ON sponsor.clicks
  FOR SELECT TO authenticated
  USING (
    placement_id IN (
      SELECT pl.id FROM sponsor.placements pl
      JOIN sponsor.applications a ON a.id = pl.application_id
      JOIN sponsor.organizations o ON o.id = a.organization_id
      WHERE o.primary_contact_user_id = (SELECT auth.uid())
    )
  );

-- ── 4. RLS policies for sponsor.impressions ──────────────────────────────────
DROP POLICY IF EXISTS sponsor_impressions_org_select ON sponsor.impressions;
CREATE POLICY sponsor_impressions_org_select ON sponsor.impressions
  FOR SELECT TO authenticated
  USING (
    placement_id IN (
      SELECT pl.id FROM sponsor.placements pl
      JOIN sponsor.applications a ON a.id = pl.application_id
      JOIN sponsor.organizations o ON o.id = a.organization_id
      WHERE o.primary_contact_user_id = (SELECT auth.uid())
    )
  );

-- ── 5. Drop redundant unique constraint + partial index ──────────────────────
-- orgs_contact_unique (from 20260504090000) is a duplicate of
-- sponsor_orgs_contact_unique (from 20260504230420); keep the latter.
-- sponsor_orgs_contact_idx is a partial index now superseded by the full unique constraint.
ALTER TABLE sponsor.organizations DROP CONSTRAINT IF EXISTS orgs_contact_unique;
DROP INDEX IF EXISTS sponsor.sponsor_orgs_contact_idx;
