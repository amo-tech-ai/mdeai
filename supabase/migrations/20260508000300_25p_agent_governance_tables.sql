-- 25P: Agent governance tables — runs, errors, approvals, budgets

-- agent_runs: one row per agent execution
CREATE TABLE IF NOT EXISTS public.agent_runs (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_kind     text        NOT NULL CHECK (agent_kind IN ('paperclip','hermes','openclaw','postiz')),
  agent_name     text        NOT NULL,
  routine        text,
  step           text,
  parent_run_id  uuid        REFERENCES public.agent_runs(id) ON DELETE SET NULL,
  correlation_id text,
  input          jsonb       NOT NULL DEFAULT '{}',
  output         jsonb,
  status         text        NOT NULL DEFAULT 'running'
                 CHECK (status IN ('running','succeeded','failed','cancelled','awaiting_approval')),
  started_at     timestamptz NOT NULL DEFAULT now(),
  finished_at    timestamptz,
  duration_ms    integer,
  cost_cents     integer     DEFAULT 0,
  tokens_in      integer     DEFAULT 0,
  tokens_out     integer     DEFAULT 0,
  error_message  text
);

CREATE INDEX IF NOT EXISTS agent_runs_kind_status_idx   ON public.agent_runs (agent_kind, status);
CREATE INDEX IF NOT EXISTS agent_runs_correlation_idx   ON public.agent_runs (correlation_id) WHERE correlation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS agent_runs_started_at_idx    ON public.agent_runs (started_at DESC);

ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon blocked"                       ON public.agent_runs FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "service role manages agent_runs"   ON public.agent_runs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "authenticated admins read runs"    ON public.agent_runs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));

-- agent_errors: structured error log
CREATE TABLE IF NOT EXISTS public.agent_errors (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id      uuid        REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  error_code  text        NOT NULL,
  message     text        NOT NULL,
  stack       text,
  context     jsonb       DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_errors_run_idx ON public.agent_errors (run_id);

ALTER TABLE public.agent_errors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon blocked"                      ON public.agent_errors FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "service role manages agent_errors" ON public.agent_errors FOR ALL TO service_role USING (true) WITH CHECK (true);

-- agent_approvals: pending human-in-the-loop gate per run
CREATE TABLE IF NOT EXISTS public.agent_approvals (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id      uuid        REFERENCES public.agent_runs(id) ON DELETE CASCADE,
  routine     text        NOT NULL,
  payload     jsonb       NOT NULL DEFAULT '{}',
  status      text        NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','approved','rejected','expired')),
  decided_by  uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_at  timestamptz,
  expires_at  timestamptz NOT NULL DEFAULT now() + interval '24 hours',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Only one pending approval per run (prevents duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS agent_approvals_pending_run_idx
  ON public.agent_approvals (run_id) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS agent_approvals_status_idx ON public.agent_approvals (status, expires_at);

ALTER TABLE public.agent_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon blocked"                          ON public.agent_approvals FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "service role manages agent_approvals"  ON public.agent_approvals FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "authenticated admins read approvals"   ON public.agent_approvals FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin'));

-- agent_budgets: daily spend caps per routine
CREATE TABLE IF NOT EXISTS public.agent_budgets (
  routine          text    NOT NULL,
  as_of_date       date    NOT NULL,
  daily_cap_cents  integer NOT NULL DEFAULT 100000,
  daily_spent_cents integer NOT NULL DEFAULT 0,
  PRIMARY KEY (routine, as_of_date)
);

ALTER TABLE public.agent_budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon blocked"                       ON public.agent_budgets FOR ALL TO anon USING (false) WITH CHECK (false);
CREATE POLICY "service role manages agent_budgets" ON public.agent_budgets FOR ALL TO service_role USING (true) WITH CHECK (true);
