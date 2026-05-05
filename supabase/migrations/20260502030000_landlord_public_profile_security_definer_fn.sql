-- Public-listing host card needs anon-readable landlord display data.
-- The existing landlord_profiles_public view uses security_invoker=true,
-- so it inherits landlord_profiles RLS (owner-only SELECT). That blocks
-- the public listing page from showing host info. (P2 bug 2026-05-02
-- QA: anonymous renters saw no host name on /apartments/:id.)
--
-- Fix: a SECURITY DEFINER function that returns the same column shape
-- as landlord_profiles_public (PII excluded). Bypasses RLS to read the
-- table, but only exposes safe columns. Same gating as the view
-- (verification_status IN ('approved','pending')) so unverified-rejected
-- landlords stay hidden.

CREATE OR REPLACE FUNCTION public.get_landlord_public_profile(landlord_uuid uuid)
RETURNS TABLE (
  id uuid,
  display_name text,
  avatar_url text,
  bio text,
  primary_neighborhood text,
  languages text[],
  is_verified boolean,
  verified_at timestamptz,
  active_listings integer,
  total_leads_received integer,
  median_response_time_minutes integer,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    lp.id,
    lp.display_name,
    lp.avatar_url,
    lp.bio,
    lp.primary_neighborhood,
    lp.languages,
    (lp.verification_status = 'approved') AS is_verified,
    lp.verified_at,
    lp.active_listings,
    lp.total_leads_received,
    lp.median_response_time_minutes,
    lp.created_at
  FROM public.landlord_profiles lp
  WHERE lp.id = landlord_uuid
    AND lp.verification_status IN ('approved', 'pending');
$$;

REVOKE EXECUTE ON FUNCTION public.get_landlord_public_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_landlord_public_profile(uuid) TO anon, authenticated;

COMMENT ON FUNCTION public.get_landlord_public_profile(uuid) IS
  'Public-safe landlord profile lookup for the listing detail page. Returns NULL if the landlord is rejected or does not exist. Mirrors the column shape of landlord_profiles_public but is callable by anon (the view inherits owner-only RLS via security_invoker).';
