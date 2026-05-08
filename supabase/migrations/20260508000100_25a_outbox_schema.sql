-- 25A: Write-ahead outbox table + RPCs
-- Provides idempotent outbox pattern for whatsapp, email, stripe, etc.

CREATE TABLE IF NOT EXISTS public.outbox (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  channel          text        NOT NULL CHECK (channel IN ('whatsapp','email','stripe','postiz','pinterest','webhook','custom')),
  action           text        NOT NULL,
  idempotency_key  text        NOT NULL,
  payload          jsonb       NOT NULL,
  approval_id      uuid,                           -- FK added in 25B
  status           text        NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending','approved','sent','delivered','failed','cancelled')),
  attempts         int         NOT NULL DEFAULT 0,
  next_retry_at    timestamptz,
  last_error       text,
  provider_id      text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  sent_at          timestamptz,
  delivered_at     timestamptz,
  UNIQUE (channel, idempotency_key)
);

-- Indexes
CREATE INDEX IF NOT EXISTS outbox_status_retry_idx ON public.outbox (status, next_retry_at)
  WHERE status IN ('pending','approved','failed');
CREATE INDEX IF NOT EXISTS outbox_channel_status_idx ON public.outbox (channel, status);
CREATE INDEX IF NOT EXISTS outbox_created_at_idx ON public.outbox (created_at DESC);

-- RLS
ALTER TABLE public.outbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon blocked" ON public.outbox
  FOR ALL TO anon USING (false) WITH CHECK (false);

CREATE POLICY "service role manages outbox" ON public.outbox
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.fn_outbox_updated_at()
  RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at = pg_catalog.now();
  RETURN NEW;
END $$;

CREATE TRIGGER tg_outbox_updated_at
  BEFORE UPDATE ON public.outbox
  FOR EACH ROW EXECUTE FUNCTION public.fn_outbox_updated_at();

-- RPC: outbox_enqueue — idempotent insert
CREATE OR REPLACE FUNCTION public.outbox_enqueue(
  p_channel        text,
  p_action         text,
  p_idempotency_key text,
  p_payload        jsonb,
  p_approval_id    uuid DEFAULT NULL
) RETURNS uuid
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.outbox (channel, action, idempotency_key, payload, approval_id)
  VALUES (p_channel, p_action, p_idempotency_key, p_payload, p_approval_id)
  ON CONFLICT (channel, idempotency_key) DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    SELECT id INTO v_id FROM public.outbox
    WHERE channel = p_channel AND idempotency_key = p_idempotency_key;
  END IF;

  RETURN v_id;
END $$;

-- RPC: outbox_claim — safe concurrent worker claim
CREATE OR REPLACE FUNCTION public.outbox_claim(
  p_channel    text,
  p_batch_size int DEFAULT 10
) RETURNS SETOF public.outbox
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  RETURN QUERY
  UPDATE public.outbox
  SET status = 'approved', updated_at = pg_catalog.now()
  WHERE id IN (
    SELECT id FROM public.outbox
    WHERE channel = p_channel
      AND status IN ('pending','approved')
      AND (next_retry_at IS NULL OR next_retry_at <= pg_catalog.now())
    ORDER BY created_at
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
END $$;

-- RPC: outbox_mark_sent
CREATE OR REPLACE FUNCTION public.outbox_mark_sent(
  p_id         uuid,
  p_provider_id text DEFAULT NULL
) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.outbox
  SET status = 'sent', sent_at = pg_catalog.now(), provider_id = p_provider_id, updated_at = pg_catalog.now()
  WHERE id = p_id;
END $$;

-- RPC: outbox_mark_failed
CREATE OR REPLACE FUNCTION public.outbox_mark_failed(
  p_id           uuid,
  p_error        text,
  p_retry_after  interval DEFAULT '5 minutes'
) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.outbox
  SET status = 'failed',
      last_error = p_error,
      attempts = attempts + 1,
      next_retry_at = pg_catalog.now() + p_retry_after,
      updated_at = pg_catalog.now()
  WHERE id = p_id;
END $$;
