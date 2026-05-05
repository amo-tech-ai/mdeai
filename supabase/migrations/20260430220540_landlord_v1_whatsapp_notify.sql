-- Landlord V1 — WhatsApp lead notifications (Twilio Sandbox)
-- ─────────────────────────────────────────────────────────────
-- Adds the storage + scheduler bits for D11.5 ("WhatsApp tap-to-chat
-- on new lead + 30-min reminder if landlord hasn't responded").
--
-- Goal: landlord gets pinged on WhatsApp the second a lead lands, and
-- nudged again 30 min later if they haven't acted (lead.status='new').
-- Code path lives in the lead-from-form + lead-reminder-tick edge fns.
--
-- Design decisions per user request:
--   - No webhooks (no status callback handling)
--   - No retries (one-shot send; failure logged, no requeue)
--   - No complex tracking (just two timestamps)
--
-- Idempotency: pg_cron tick UPDATE-RETURNINGs the row before sending so
-- a parallel tick can't double-send.

BEGIN;

-- ─────────────────────────────────────────────────────────────────────
-- 1. Extensions
-- ─────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ─────────────────────────────────────────────────────────────────────
-- 2. Two timestamp columns on landlord_inbox
-- ─────────────────────────────────────────────────────────────────────
-- whatsapp_sent_at  → first send fired (any status; "we tried")
-- reminder_sent_at  → 30-min nudge fired
-- Both nullable — null means "not yet". UPDATE-RETURNING gates idempotency.
ALTER TABLE public.landlord_inbox
  ADD COLUMN IF NOT EXISTS whatsapp_sent_at  timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_sent_at  timestamptz;

CREATE INDEX IF NOT EXISTS landlord_inbox_pending_reminder_idx
  ON public.landlord_inbox (created_at)
  WHERE status = 'new' AND reminder_sent_at IS NULL;

-- ─────────────────────────────────────────────────────────────────────
-- 3. Schedule the 5-minute reminder tick via pg_cron
-- ─────────────────────────────────────────────────────────────────────
-- pg_net.http_post fires asynchronously; the cron job itself just queues
-- the request and returns immediately. The lead-reminder-tick edge fn
-- handles its own auth via X-Cron-Secret header.
--
-- We use the existing `app_settings` jsonb table pattern (or fall back
-- to a hardcoded URL) to look up the project URL + cron secret. For V1
-- we keep it minimal and read both from current_setting.
--
-- Setting must be set before the cron fires successfully — see the
-- ALTER DATABASE block below.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'mdeai_lead_reminder_tick'
  ) THEN
    PERFORM cron.unschedule('mdeai_lead_reminder_tick');
  END IF;
END $$;

SELECT cron.schedule(
  'mdeai_lead_reminder_tick',
  '*/5 * * * *',                       -- every 5 minutes
  $cron$
  SELECT net.http_post(
    url     := current_setting('app.supabase_url') || '/functions/v1/lead-reminder-tick',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Cron-Secret', current_setting('app.cron_secret')
    ),
    body    := '{}'::jsonb
  );
  $cron$
);

-- ─────────────────────────────────────────────────────────────────────
-- 4. Settings — must be set out-of-band via execute_sql once we know
--    the cron secret. We document the required commands here:
--
--   ALTER DATABASE postgres SET app.supabase_url = 'https://zkwcbyxiwklihegjhuql.supabase.co';
--   ALTER DATABASE postgres SET app.cron_secret  = '<random-32-byte-string>';
--
-- These survive the migration and are read by pg_cron at fire time.
-- Setting them inside this migration is brittle (different envs need
-- different values) — leaving as a one-time setup step.
-- ─────────────────────────────────────────────────────────────────────

COMMIT;
