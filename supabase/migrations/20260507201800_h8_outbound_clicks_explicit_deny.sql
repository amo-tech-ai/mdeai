-- 25H8 — outbound_clicks: explicit deny-by-default RLS for anon + authenticated
-- Source: tasks/prompts/data/25H8-outbound-clicks-explicit-deny.md
-- Live state (verified 2026-05-07): RLS enabled, 0 policies → advisor `rls_enabled_no_policy`.
-- Writes happen via SECURITY DEFINER `log_outbound_click()`; reads via service_role only.
-- service_role bypasses RLS, so these denies do not affect existing flows.

CREATE POLICY outbound_clicks_no_anon
  ON public.outbound_clicks
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY outbound_clicks_no_authenticated
  ON public.outbound_clicks
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);
