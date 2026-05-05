-- ============================================================
-- Task 047: approve_sponsor_application RPC
-- Creates sponsor.placements on approval (active=false pending payment)
-- ============================================================

CREATE OR REPLACE FUNCTION public.approve_sponsor_application(
  p_application_id uuid,
  p_approved_by    uuid
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public, sponsor
AS $$
DECLARE
  v_app sponsor.applications%ROWTYPE;
BEGIN
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
         approved_by = p_approved_by
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

GRANT EXECUTE ON FUNCTION public.approve_sponsor_application(uuid, uuid) TO service_role;
