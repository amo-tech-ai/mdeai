-- 25H2 — Revoke EXECUTE on agent-queue RPCs from anon + authenticated
-- Source: tasks/prompts/data/25H2-revoke-anon-on-agent-queue-rpcs.md
-- Live state (verified 2026-05-07): 24 SECURITY DEFINER public functions are EXECUTE-able by anon;
-- the 6 below are background worker RPCs and must NEVER be reachable from a browser.
-- Workers run as service_role (bypasses GRANT checks). Clears 12 of 72 advisor warnings.

REVOKE EXECUTE ON FUNCTION public.claim_agent_job(text, text[]) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.complete_agent_job(uuid, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fail_agent_job(uuid, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_agent_jobs() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.release_stale_agent_job_locks(interval) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_agent_job_progress(uuid, integer, text) FROM anon, authenticated;
