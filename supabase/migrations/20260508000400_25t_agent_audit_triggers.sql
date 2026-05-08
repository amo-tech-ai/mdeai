-- 25T: Unforgeable agent audit log via DB triggers
-- Triggers on agent_runs, agent_approvals, outbox fire automatically —
-- edge functions cannot skip the audit trail.

-- Step 1: Add canonical columns to existing agent_audit_log
ALTER TABLE public.agent_audit_log
  ADD COLUMN IF NOT EXISTS source_table text,
  ADD COLUMN IF NOT EXISTS source_id    uuid,
  ADD COLUMN IF NOT EXISTS agent_kind   text,
  ADD COLUMN IF NOT EXISTS action       text,
  ADD COLUMN IF NOT EXISTS payload      jsonb;

-- Relax legacy NOT NULL constraints (table had 0 rows — canonical shape drops these requirements)
ALTER TABLE public.agent_audit_log
  ALTER COLUMN action_type DROP NOT NULL,
  ALTER COLUMN result      DROP NOT NULL;

-- Step 2: Trigger function — agent_runs
CREATE OR REPLACE FUNCTION public.fn_audit_agent_run()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.agent_audit_log (
    source_table, source_id, agent_kind, agent_name, action, payload, created_at
  ) VALUES (
    TG_TABLE_NAME,
    NEW.id,
    NEW.agent_kind,
    NEW.agent_name,
    NEW.status,
    pg_catalog.jsonb_build_object(
      'routine',        NEW.routine,
      'step',           NEW.step,
      'correlation_id', NEW.correlation_id,
      'cost_cents',     NEW.cost_cents
    ),
    pg_catalog.now()
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_audit_agent_runs ON public.agent_runs;
CREATE TRIGGER tg_audit_agent_runs
  AFTER INSERT ON public.agent_runs
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_agent_run();

-- Step 3: Trigger function — agent_approvals
-- (no agent_kind/agent_name columns; use routine as name, 'approval' as kind)
CREATE OR REPLACE FUNCTION public.fn_audit_agent_approval()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.agent_audit_log (
    source_table, source_id, agent_kind, agent_name, action, payload, created_at
  ) VALUES (
    TG_TABLE_NAME,
    NEW.id,
    'approval',
    NEW.routine,
    NEW.status,
    pg_catalog.jsonb_build_object(
      'run_id',     NEW.run_id,
      'expires_at', NEW.expires_at
    ),
    pg_catalog.now()
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_audit_agent_approvals ON public.agent_approvals;
CREATE TRIGGER tg_audit_agent_approvals
  AFTER INSERT ON public.agent_approvals
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_agent_approval();

-- Step 4: Trigger function — outbox (covers whatsapp, email, stripe, etc.)
CREATE OR REPLACE FUNCTION public.fn_audit_outbox()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.agent_audit_log (
    source_table, source_id, agent_kind, agent_name, action, payload, created_at
  ) VALUES (
    TG_TABLE_NAME,
    NEW.id,
    NEW.channel,
    NEW.action,
    NEW.status,
    pg_catalog.jsonb_build_object(
      'channel',         NEW.channel,
      'idempotency_key', NEW.idempotency_key
    ),
    pg_catalog.now()
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tg_audit_outbox ON public.outbox;
CREATE TRIGGER tg_audit_outbox
  AFTER INSERT ON public.outbox
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_outbox();
