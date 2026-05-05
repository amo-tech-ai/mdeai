-- Phase 1 events MVP — search_path hardening (audit #3 follow-up)
--
-- Source: tasks/events/audit/03-audit-migration.md (and Supabase advisor lint
-- `function_search_path_mutable` flagged 9 RPCs after `event_phase1` deployment).
--
-- Why: SECURITY DEFINER functions with a mutable role search_path are vulnerable
-- to a privilege-escalation attack where a malicious caller temporarily prepends
-- a schema (e.g., `pg_temp` containing a poisoned `events` view) before invoking
-- the RPC. With `SET search_path = public, pg_temp`, the function's lookup is
-- pinned at definition time and the attack surface closes.
--
-- Reference: https://supabase.com/docs/guides/database/postgres/database-advisors#function-search-path-mutable
--
-- Why pin to `public, pg_temp` (not just `public`):
--   • Postgres requires `pg_temp` for temp-table support inside SECURITY DEFINER fns.
--   • Excluding `pg_catalog` is fine — it's always on the path implicitly.
--
-- Idempotent: ALTER FUNCTION ... SET is safe to re-run.

BEGIN;

ALTER FUNCTION public.set_updated_at()
  SET search_path = public, pg_temp;

ALTER FUNCTION public.get_anonymous_order(uuid, text)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.record_check_in(uuid, uuid, text, uuid, text, inet, text, jsonb)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.bump_staff_link_version(uuid)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.ticket_checkout_create_pending(uuid, uuid, int, text, text, text, jsonb)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.ticket_payment_finalize_response(public.events, public.event_orders, public.event_tickets)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.ticket_payment_finalize(uuid, text)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.ticket_payment_refund(uuid)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.ticket_checkout_cancel(uuid)
  SET search_path = public, pg_temp;

ALTER FUNCTION public.ticket_validate_consume(text)
  SET search_path = public, pg_temp;

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────────
-- ROLLBACK (revert to mutable search_path — only run if the fix breaks something):
-- ─────────────────────────────────────────────────────────────────────────────
-- BEGIN;
--   ALTER FUNCTION public.set_updated_at()                                                                              RESET search_path;
--   ALTER FUNCTION public.get_anonymous_order(uuid, text)                                                                RESET search_path;
--   ALTER FUNCTION public.record_check_in(uuid, uuid, text, uuid, text, inet, text, jsonb)                               RESET search_path;
--   ALTER FUNCTION public.bump_staff_link_version(uuid)                                                                  RESET search_path;
--   ALTER FUNCTION public.ticket_checkout_create_pending(uuid, uuid, int, text, text, text, jsonb)                       RESET search_path;
--   ALTER FUNCTION public.ticket_payment_finalize_response(public.events, public.event_orders, public.event_tickets)     RESET search_path;
--   ALTER FUNCTION public.ticket_payment_finalize(uuid, text)                                                            RESET search_path;
--   ALTER FUNCTION public.ticket_payment_refund(uuid)                                                                    RESET search_path;
--   ALTER FUNCTION public.ticket_checkout_cancel(uuid)                                                                   RESET search_path;
--   ALTER FUNCTION public.ticket_validate_consume(text)                                                                  RESET search_path;
-- COMMIT;
