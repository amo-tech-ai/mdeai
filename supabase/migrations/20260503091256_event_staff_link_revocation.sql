-- Migration: bump_staff_link_version RPC for door-staff JWT revocation.
--
-- Companion to:
--   - supabase/functions/event-staff-link-generator/index.ts (signs JWTs)
--   - supabase/functions/ticket-validate/index.ts             (verifies + checks version)
--
-- When the organizer hits "Revoke staff link" in the dashboard (task 003),
-- the front-end calls the staff-link-generator fn with `revoke: true`. That
-- service-role-scoped fn calls this RPC, which bumps the per-event counter.
-- Any outstanding JWT whose `staff_link_version` claim doesn't match the
-- current row value is then rejected on the next scan.
--
-- Why SECURITY DEFINER + service_role only:
--   The edge fn runs under service_role (bypassing RLS) but verifies the
--   caller is the organizer in JS *before* invoking the RPC. Restricting
--   EXECUTE to service_role means a leaked anon key cannot call this
--   directly. Audit M2 / SKILL.md G1 (supabase-postgres-best-practices).

CREATE OR REPLACE FUNCTION public.bump_staff_link_version(p_event_id uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_new_version int;
BEGIN
  UPDATE public.events
     SET staff_link_version = staff_link_version + 1,
         updated_at         = now()
   WHERE id = p_event_id
   RETURNING staff_link_version INTO v_new_version;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'EVENT_NOT_FOUND' USING ERRCODE = 'P0001';
  END IF;

  RETURN v_new_version;
END;
$$;

-- Lockdown: only service_role (the edge fn) can invoke this.
-- Anonymous + authenticated roles are revoked from the default PUBLIC grant
-- created by `CREATE FUNCTION` to prevent direct invocation from the
-- browser via PostgREST.
REVOKE ALL ON FUNCTION public.bump_staff_link_version(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.bump_staff_link_version(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bump_staff_link_version(uuid) TO service_role;

COMMENT ON FUNCTION public.bump_staff_link_version(uuid) IS
  'Bumps events.staff_link_version to revoke all outstanding door-staff JWTs '
  'for an event. service_role-only; the calling edge fn must verify the '
  'caller is the event organizer before invoking.';
