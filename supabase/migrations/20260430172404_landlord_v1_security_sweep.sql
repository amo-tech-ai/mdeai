-- Landlord V1 — security sweep (post-D9 verification findings)
-- ─────────────────────────────────────────────────────────────
-- Closes 4 WARN items the schema advisors flagged after D5-D9 shipped:
--
--   R-RLS-1     apartments cross-landlord visibility — policy unioning
--               `authenticated_can_view_all_apartments` lets ANY signed-in
--               user (renters + other landlords) read every row, including
--               rejected/archived/inactive listings.
--
--   R-RPC-1     `acting_landlord_ids()` SECURITY DEFINER fn is callable
--               by anon + authenticated via /rest/v1/rpc/. Internal helper —
--               only RLS policies should reach it.
--
--   R-RPC-2     `auto_create_landlord_inbox_from_message()` is a TRIGGER
--               function but anon/authenticated can call it via RPC.
--               Triggers run with the table-owner's privs anyway.
--
--   R-STORAGE-1 listing-photos bucket has a broad SELECT policy on
--               storage.objects letting clients enumerate every filename
--               (= every user_id × every draftId × upload chronology).
--               The bucket is `public=true` so direct URLs still serve
--               files without consulting a SELECT policy.
--
-- All 4 fixes are independent + idempotent; this migration is safe to
-- re-run.

BEGIN;

-- ─────────────────────────────────────────────────────────────────────
-- R-RLS-1 — apartments SELECT scoping
-- ─────────────────────────────────────────────────────────────────────
-- Drop the over-permissive policy.
DROP POLICY IF EXISTS authenticated_can_view_all_apartments
  ON public.apartments;

-- Add: landlords see their OWN listings regardless of moderation_status,
-- so the host dashboard can render "In review" + "Rejected" cards. Uses
-- the `(select auth.uid())` subquery pattern per supabase-patterns rule.
DROP POLICY IF EXISTS apartments_select_own_landlord ON public.apartments;
CREATE POLICY apartments_select_own_landlord ON public.apartments
  FOR SELECT
  TO authenticated
  USING (
    landlord_id IN (
      SELECT id
      FROM public.landlord_profiles
      WHERE user_id = (select auth.uid())
    )
  );

-- Add: admins see everything (was implicitly handled by the deleted
-- policy via `USING (true)`). Now explicit + role-gated via is_admin()
-- so the admin app keeps working without granting cross-landlord reads
-- to ordinary authenticated users.
DROP POLICY IF EXISTS apartments_select_admin ON public.apartments;
CREATE POLICY apartments_select_admin ON public.apartments
  FOR SELECT
  TO authenticated
  USING ((select public.is_admin()));

-- ─────────────────────────────────────────────────────────────────────
-- R-RPC-1 + R-RPC-2 — revoke RPC EXECUTE on internal-only fns
-- ─────────────────────────────────────────────────────────────────────
-- These functions still work inside RLS policies + triggers (Postgres
-- evaluates them with the function-owner's permissions, not the
-- caller's), so revoking from anon/authenticated only blocks the
-- /rest/v1/rpc/ surface — which neither function is meant to expose.
--
-- IMPORTANT: REVOKE FROM PUBLIC is required because Postgres grants
-- EXECUTE to PUBLIC by default; revoking from `anon, authenticated`
-- alone leaves the implicit PUBLIC grant intact and the function
-- stays callable.
REVOKE EXECUTE ON FUNCTION public.acting_landlord_ids()
  FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.auto_create_landlord_inbox_from_message()
  FROM PUBLIC, anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- R-STORAGE-1 — listing-photos enumerable filenames
-- ─────────────────────────────────────────────────────────────────────
-- Public buckets serve files via direct URL without consulting a SELECT
-- policy on storage.objects. The broad policy here only enables the
-- `.list()` API + ad-hoc `SELECT … FROM storage.objects WHERE bucket_id`
-- queries, which we never use and which leak filenames cross-tenant.
DROP POLICY IF EXISTS listing_photos_select_public ON storage.objects;

COMMIT;
