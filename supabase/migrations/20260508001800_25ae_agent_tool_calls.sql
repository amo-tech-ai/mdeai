-- 25AE: agent_tool_calls — tool-level tracing per agent run
-- 30-day retention cron. RLS: service_role write; authenticated reads via ai_runs.user_id.

CREATE TABLE public.agent_tool_calls (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_run_id    uuid        NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  ai_run_id       uuid        REFERENCES public.ai_runs(id) ON DELETE SET NULL,
  tool_name       text        NOT NULL,
  tool_version    text,
  call_index      integer     NOT NULL DEFAULT 0,
  input_json      jsonb       NOT NULL DEFAULT '{}',
  output_json     jsonb,
  status          text        NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','success','error','timeout','blocked')),
  error_message   text,
  agent_name      text,
  started_at      timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX agent_tool_calls_run_idx       ON public.agent_tool_calls (agent_run_id, call_index);
CREATE INDEX agent_tool_calls_tool_name_idx ON public.agent_tool_calls (tool_name, started_at DESC);
CREATE INDEX agent_tool_calls_errors_idx    ON public.agent_tool_calls (tool_name, started_at DESC) WHERE status IN ('error','timeout','blocked');
CREATE INDEX agent_tool_calls_ai_run_idx    ON public.agent_tool_calls (ai_run_id) WHERE ai_run_id IS NOT NULL;
CREATE INDEX agent_tool_calls_created_idx   ON public.agent_tool_calls (created_at DESC);
ALTER TABLE public.agent_tool_calls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_blocked_tool_calls"       ON public.agent_tool_calls FOR ALL TO anon        USING (false);
CREATE POLICY "service_role_full_tool_calls"  ON public.agent_tool_calls FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "auth_read_own_tool_calls"      ON public.agent_tool_calls FOR SELECT TO authenticated
  USING (ai_run_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.ai_runs r WHERE r.id = ai_run_id AND r.user_id = (SELECT auth.uid())));
COMMENT ON TABLE public.agent_tool_calls IS 'Tool-level tracing per agent run. Captures tool name, sanitized input/output, status, and timing. 30-day retention via cron.';

CREATE OR REPLACE FUNCTION public.fn_record_tool_call_start(
  p_agent_run_id uuid, p_tool_name text, p_call_index integer,
  p_input_json jsonb DEFAULT '{}', p_agent_name text DEFAULT NULL, p_ai_run_id uuid DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
DECLARE v_id uuid;
BEGIN
  INSERT INTO public.agent_tool_calls (agent_run_id, ai_run_id, tool_name, call_index, input_json, agent_name, status)
  VALUES (p_agent_run_id, p_ai_run_id, p_tool_name, p_call_index, COALESCE(p_input_json,'{}'), p_agent_name, 'pending')
  RETURNING id INTO v_id;
  RETURN v_id;
END; $$;
GRANT EXECUTE ON FUNCTION public.fn_record_tool_call_start(uuid,text,integer,jsonb,text,uuid) TO service_role;
REVOKE EXECUTE ON FUNCTION public.fn_record_tool_call_start(uuid,text,integer,jsonb,text,uuid) FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.fn_record_tool_call_end(
  p_tool_call_id uuid, p_status text, p_output_json jsonb DEFAULT NULL, p_error text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
BEGIN
  UPDATE public.agent_tool_calls SET status=p_status, output_json=p_output_json, error_message=p_error, completed_at=pg_catalog.now() WHERE id=p_tool_call_id;
END; $$;
GRANT EXECUTE ON FUNCTION public.fn_record_tool_call_end(uuid,text,jsonb,text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.fn_record_tool_call_end(uuid,text,jsonb,text) FROM anon, authenticated;

SELECT cron.schedule('agent_tool_calls_cleanup','0 4 * * *',
  $$DELETE FROM public.agent_tool_calls WHERE created_at < pg_catalog.now() - interval '30 days'$$);
