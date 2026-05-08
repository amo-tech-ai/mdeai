-- 25H2 follow-up — REVOKE FROM PUBLIC on agent-queue RPCs
-- The first 25H2 migration revoked from anon + authenticated, but PUBLIC still had EXECUTE
-- (Postgres default on CREATE FUNCTION). anon and authenticated inherit from PUBLIC, so the
-- earlier REVOKE was a no-op until PUBLIC is also revoked.
--
-- Re-grant to service_role explicitly (workers run as service_role; needed because PUBLIC
-- revoke would otherwise affect any role that previously relied only on PUBLIC inheritance,
-- though service_role also has its own grant).

REVOKE EXECUTE ON FUNCTION public.claim_agent_job(text, text[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.complete_agent_job(uuid, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fail_agent_job(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_agent_jobs() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.release_stale_agent_job_locks(interval) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_agent_job_progress(uuid, integer, text) FROM PUBLIC;
