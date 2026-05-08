-- 25H4 — sponsor-assets storage bucket: stop directory listing
-- Source: tasks/prompts/data/25H4-sponsor-assets-bucket-listing-fix.md
-- Live state (verified 2026-05-07): bucket public=true; SELECT policy `sponsor_assets_public_read`
-- has qual `bucket_id = 'sponsor-assets'` — broad enough to enumerate via storage `list` API.
-- Advisor: `public_bucket_allows_listing`.
--
-- Fix: replace SELECT policy so anon/authenticated can GET-by-known-path (CDN style) but
-- the storage `list` API returns 0 rows. service_role bypasses RLS for admin tooling.

DROP POLICY IF EXISTS sponsor_assets_public_read ON storage.objects;

CREATE POLICY sponsor_assets_public_get
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (
    bucket_id = 'sponsor-assets'
    AND name IS NOT NULL
    AND octet_length(name) > 0
  );
