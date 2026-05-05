-- Migration: sponsor_applications_update_rls
-- Sponsors need UPDATE access on their own draft applications so wizard step
-- saves work through the client SDK. Without this policy, any PATCH to a draft
-- row returns a silent RLS 403 — the wizard appears to save but changes are lost.
--
-- Policy scope: status='draft' only in the USING clause. This prevents a sponsor
-- from reopening a submitted/approved application by patching status back to draft.
-- Admin status transitions (approve/reject/live) use the approve_sponsor_application()
-- SECURITY DEFINER RPC which runs as service_role and bypasses RLS entirely.
CREATE POLICY sponsor_apps_org_update ON sponsor.applications
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT id FROM sponsor.organizations
      WHERE primary_contact_user_id = (SELECT auth.uid())
    )
    AND status = 'draft'
  )
  WITH CHECK (
    organization_id IN (
      SELECT id FROM sponsor.organizations
      WHERE primary_contact_user_id = (SELECT auth.uid())
    )
  );

-- Verify: exactly 3 policies now exist on sponsor.applications
DO $$
DECLARE v_count int;
BEGIN
  SELECT count(*) INTO v_count
  FROM pg_policies
  WHERE schemaname = 'sponsor' AND tablename = 'applications';

  IF v_count < 3 THEN
    RAISE EXCEPTION 'MIGRATION FAILED: expected ≥3 policies on sponsor.applications, got %', v_count;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'sponsor'
      AND tablename = 'applications'
      AND policyname = 'sponsor_apps_org_update'
      AND cmd = 'UPDATE'
  ) THEN
    RAISE EXCEPTION 'MIGRATION FAILED: sponsor_apps_org_update policy not found';
  END IF;
END $$;
