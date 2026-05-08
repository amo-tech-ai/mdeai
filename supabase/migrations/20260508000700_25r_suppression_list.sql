-- 25R: Global suppression list — stop-contact registry (supersedes 25C)
-- BEFORE INSERT trigger on public.outbox blocks suppressed whatsapp/email/sms sends.

CREATE TABLE public.suppression_list (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  channel      text        NOT NULL
               CHECK (channel IN ('whatsapp','email','sms','push','voice','all')),
  identifier   text        NOT NULL,   -- phone E.164 / email / device token (lowercased)
  reason       text        NOT NULL
               CHECK (reason IN ('user_stop','unsubscribe','bounce','complaint','admin_block','tcpa_holiday','manual')),
  source       text        NOT NULL DEFAULT 'user',
  source_event jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz,            -- NULL = permanent
  UNIQUE (channel, identifier)
);

CREATE INDEX suppression_lookup ON public.suppression_list (channel, identifier);
CREATE INDEX suppression_expires ON public.suppression_list (expires_at) WHERE expires_at IS NOT NULL;

ALTER TABLE public.suppression_list ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon blocked" ON public.suppression_list
  FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "service role manages suppression_list" ON public.suppression_list
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "admin reads suppression_list" ON public.suppression_list
  FOR SELECT TO authenticated USING (public.is_admin());

-- RPC: is_suppressed — checks channel + 'all', excludes expired rows
CREATE OR REPLACE FUNCTION public.is_suppressed(p_channel text, p_identifier text)
  RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.suppression_list
    WHERE (channel = p_channel OR channel = 'all')
      AND identifier = pg_catalog.lower(p_identifier)
      AND (expires_at IS NULL OR expires_at > pg_catalog.now())
  );
$$;

-- BEFORE INSERT guard on public.outbox
-- Reads 'to', 'identifier', 'phone', or 'email' from payload for the check.
CREATE OR REPLACE FUNCTION public.fn_outbox_suppression_check()
  RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_identifier text;
BEGIN
  IF NEW.channel NOT IN ('whatsapp','email','sms') THEN
    RETURN NEW;
  END IF;

  v_identifier := COALESCE(
    NEW.payload->>'to',
    NEW.payload->>'identifier',
    NEW.payload->>'phone',
    NEW.payload->>'email'
  );

  IF v_identifier IS NOT NULL AND public.is_suppressed(NEW.channel, v_identifier) THEN
    RAISE EXCEPTION 'SUPPRESSED: % identifier % is on the suppression list for channel %',
      NEW.channel, v_identifier, NEW.channel
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_outbox_suppression_check ON public.outbox;
CREATE TRIGGER tg_outbox_suppression_check
  BEFORE INSERT ON public.outbox
  FOR EACH ROW EXECUTE FUNCTION public.fn_outbox_suppression_check();
