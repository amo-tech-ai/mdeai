-- 25B: Approval request/decision tables + FK back to outbox

CREATE TABLE IF NOT EXISTS public.approval_requests (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  outbox_id    uuid,                               -- set after outbox row exists
  request_type text        NOT NULL CHECK (request_type IN ('outbox_send','agent_action','manual')),
  payload      jsonb       NOT NULL DEFAULT '{}',
  status       text        NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','approved','rejected','expired')),
  requester_id uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at   timestamptz NOT NULL DEFAULT now() + interval '24 hours',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- FK from outbox back to approval_requests (circular dep resolved here)
ALTER TABLE public.outbox
  ADD CONSTRAINT IF NOT EXISTS outbox_approval_fk
  FOREIGN KEY (approval_id) REFERENCES public.approval_requests(id)
  ON DELETE SET NULL;

-- Decision log
CREATE TABLE IF NOT EXISTS public.approval_decisions (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_id    uuid        NOT NULL REFERENCES public.approval_requests(id) ON DELETE CASCADE,
  decided_by     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  decision       text        NOT NULL CHECK (decision IN ('approved','rejected')),
  notes          text,
  decided_at     timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS approval_requests_status_idx ON public.approval_requests (status, expires_at);
CREATE INDEX IF NOT EXISTS approval_decisions_approval_idx ON public.approval_decisions (approval_id);

-- RLS
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon blocked" ON public.approval_requests
  FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "service role manages approval_requests" ON public.approval_requests
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "authenticated admins read approval_requests" ON public.approval_requests
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );

CREATE POLICY "anon blocked" ON public.approval_decisions
  FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "service role manages approval_decisions" ON public.approval_decisions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.fn_approval_requests_updated_at()
  RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN NEW.updated_at = pg_catalog.now(); RETURN NEW; END $$;

CREATE TRIGGER tg_approval_requests_updated_at
  BEFORE UPDATE ON public.approval_requests
  FOR EACH ROW EXECUTE FUNCTION public.fn_approval_requests_updated_at();

-- Trigger: apply decision → update approval_requests + propagate to outbox
CREATE OR REPLACE FUNCTION public.fn_apply_approval_decision()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.approval_requests
  SET status = NEW.decision, updated_at = pg_catalog.now()
  WHERE id = NEW.approval_id;

  IF NEW.decision = 'approved' THEN
    UPDATE public.outbox SET status = 'approved', updated_at = pg_catalog.now()
    WHERE approval_id = NEW.approval_id AND status = 'pending';
  ELSIF NEW.decision = 'rejected' THEN
    UPDATE public.outbox SET status = 'cancelled', updated_at = pg_catalog.now()
    WHERE approval_id = NEW.approval_id AND status = 'pending';
  END IF;

  RETURN NEW;
END $$;

CREATE TRIGGER tg_apply_approval_decision
  AFTER INSERT ON public.approval_decisions
  FOR EACH ROW EXECUTE FUNCTION public.fn_apply_approval_decision();

-- RPC: request_approval (SECURITY DEFINER — callable by authenticated users)
CREATE OR REPLACE FUNCTION public.request_approval(
  p_request_type text,
  p_payload      jsonb,
  p_outbox_id    uuid DEFAULT NULL,
  p_expires_in   interval DEFAULT '24 hours'
) RETURNS uuid
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.approval_requests (request_type, payload, outbox_id, expires_at, requester_id)
  VALUES (p_request_type, p_payload, p_outbox_id, pg_catalog.now() + p_expires_in, (SELECT auth.uid()))
  RETURNING id INTO v_id;
  RETURN v_id;
END $$;

-- RPC: decide_approval (admin only via service role)
CREATE OR REPLACE FUNCTION public.decide_approval(
  p_approval_id uuid,
  p_decision    text,
  p_notes       text DEFAULT NULL
) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF p_decision NOT IN ('approved','rejected') THEN
    RAISE EXCEPTION 'Invalid decision: %', p_decision;
  END IF;
  INSERT INTO public.approval_decisions (approval_id, decided_by, decision, notes)
  VALUES (p_approval_id, (SELECT auth.uid()), p_decision, p_notes);
END $$;
