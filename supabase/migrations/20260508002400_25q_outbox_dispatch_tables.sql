-- 25Q: Outbox dispatch tables
-- posts_outbox, wa_outbox, email_outbox, delivery_receipts
-- Supports exponential-backoff retry via outbox-dispatch cron function.
-- All idempotency: unique partial index on (payload->>'idempotency_key', provider) WHERE active

-- ── posts_outbox ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.posts_outbox (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  -- Context
  agent_run_id     uuid REFERENCES public.agent_runs(id) ON DELETE SET NULL,
  campaign_id      uuid,
  post_id          uuid,
  approval_id      uuid,

  -- Dispatch
  provider         text NOT NULL DEFAULT 'postiz',
  channel          text NOT NULL,
  payload          jsonb NOT NULL DEFAULT '{}',
  status           text NOT NULL DEFAULT 'queued'
                   CHECK (status IN ('queued','dispatching','sent','failed','dead')),
  external_id      text,
  attempts         int NOT NULL DEFAULT 0,
  last_error       text,
  next_attempt_at  timestamptz NOT NULL DEFAULT now(),
  sent_at          timestamptz
);

CREATE INDEX IF NOT EXISTS posts_outbox_status_next_attempt
  ON public.posts_outbox (status, next_attempt_at)
  WHERE status IN ('queued', 'failed');

-- Idempotency: one active row per idempotency_key+provider
CREATE UNIQUE INDEX IF NOT EXISTS posts_outbox_idempotency
  ON public.posts_outbox ((payload->>'idempotency_key'), provider)
  WHERE status IN ('queued', 'dispatching', 'sent');

ALTER TABLE public.posts_outbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY posts_outbox_service_all ON public.posts_outbox
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── wa_outbox ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wa_outbox (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  agent_run_id     uuid REFERENCES public.agent_runs(id) ON DELETE SET NULL,
  to_e164          text NOT NULL,
  payload          jsonb NOT NULL DEFAULT '{}',
  provider         text NOT NULL DEFAULT 'openclaw',
  status           text NOT NULL DEFAULT 'queued'
                   CHECK (status IN ('queued','dispatching','sent','failed','dead')),
  external_id      text,
  attempts         int NOT NULL DEFAULT 0,
  last_error       text,
  next_attempt_at  timestamptz NOT NULL DEFAULT now(),
  sent_at          timestamptz
);

CREATE INDEX IF NOT EXISTS wa_outbox_status_next_attempt
  ON public.wa_outbox (status, next_attempt_at)
  WHERE status IN ('queued', 'failed');

CREATE UNIQUE INDEX IF NOT EXISTS wa_outbox_idempotency
  ON public.wa_outbox ((payload->>'idempotency_key'), provider)
  WHERE status IN ('queued', 'dispatching', 'sent');

ALTER TABLE public.wa_outbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY wa_outbox_service_all ON public.wa_outbox
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── email_outbox ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_outbox (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),

  agent_run_id     uuid REFERENCES public.agent_runs(id) ON DELETE SET NULL,
  to_email         text NOT NULL,
  payload          jsonb NOT NULL DEFAULT '{}',
  provider         text NOT NULL DEFAULT 'resend',
  status           text NOT NULL DEFAULT 'queued'
                   CHECK (status IN ('queued','dispatching','sent','failed','dead')),
  external_id      text,
  attempts         int NOT NULL DEFAULT 0,
  last_error       text,
  next_attempt_at  timestamptz NOT NULL DEFAULT now(),
  sent_at          timestamptz
);

CREATE INDEX IF NOT EXISTS email_outbox_status_next_attempt
  ON public.email_outbox (status, next_attempt_at)
  WHERE status IN ('queued', 'failed');

CREATE UNIQUE INDEX IF NOT EXISTS email_outbox_idempotency
  ON public.email_outbox ((payload->>'idempotency_key'), provider)
  WHERE status IN ('queued', 'dispatching', 'sent');

ALTER TABLE public.email_outbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY email_outbox_service_all ON public.email_outbox
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── delivery_receipts ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.delivery_receipts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at     timestamptz NOT NULL DEFAULT now(),

  outbox_table   text NOT NULL CHECK (outbox_table IN ('posts_outbox','wa_outbox','email_outbox')),
  outbox_id      uuid NOT NULL,
  provider       text NOT NULL,
  external_id    text,
  event_type     text NOT NULL,
  raw_payload    jsonb NOT NULL DEFAULT '{}',
  delivered_at   timestamptz
);

CREATE INDEX IF NOT EXISTS delivery_receipts_outbox_id
  ON public.delivery_receipts (outbox_table, outbox_id);

ALTER TABLE public.delivery_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY delivery_receipts_service_all ON public.delivery_receipts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ── updated_at triggers ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'posts_outbox_updated_at'
  ) THEN
    CREATE TRIGGER posts_outbox_updated_at
      BEFORE UPDATE ON public.posts_outbox
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'wa_outbox_updated_at'
  ) THEN
    CREATE TRIGGER wa_outbox_updated_at
      BEFORE UPDATE ON public.wa_outbox
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'email_outbox_updated_at'
  ) THEN
    CREATE TRIGGER email_outbox_updated_at
      BEFORE UPDATE ON public.email_outbox
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- ── pg_cron: reset stuck dispatching rows ─────────────────────────────────
SELECT cron.schedule(
  'outbox_reset_stuck',
  '*/5 * * * *',
  $$
    UPDATE public.posts_outbox SET status = 'failed'
    WHERE status = 'dispatching' AND updated_at < now() - interval '5 minutes';

    UPDATE public.wa_outbox SET status = 'failed'
    WHERE status = 'dispatching' AND updated_at < now() - interval '5 minutes';

    UPDATE public.email_outbox SET status = 'failed'
    WHERE status = 'dispatching' AND updated_at < now() - interval '5 minutes';
  $$
) ON CONFLICT (jobname) DO NOTHING;
