-- 25E: paperclip.* schema — agent governance spine
-- 5 tables: agent_registrations, tasks, task_events, budgets, heartbeats

CREATE SCHEMA IF NOT EXISTS paperclip;
GRANT USAGE ON SCHEMA paperclip TO service_role;

CREATE TABLE paperclip.agent_registrations (
  id                  uuid        PRIMARY KEY,
  name                text        NOT NULL,
  role                text        NOT NULL CHECK (role IN ('CEO','CTO','marketing','operations','researcher')),
  monthly_budget_cents int,
  bypass_approvals    boolean     NOT NULL DEFAULT false,
  heartbeat_required  boolean     NOT NULL DEFAULT true,
  last_heartbeat      timestamptz,
  registered_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE paperclip.tasks (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id     uuid        REFERENCES paperclip.agent_registrations(id) ON DELETE SET NULL,
  goal         text        NOT NULL,
  status       text        NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','running','blocked_on_approval','done','failed','cancelled')),
  approval_id  uuid        REFERENCES public.approval_requests(id) ON DELETE SET NULL,
  result       jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX ON paperclip.tasks (agent_id, status);
CREATE INDEX ON paperclip.tasks (status, created_at DESC);

CREATE TABLE paperclip.task_events (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    uuid        NOT NULL REFERENCES paperclip.tasks(id) ON DELETE CASCADE,
  event_type text        NOT NULL
             CHECK (event_type IN ('started','step_complete','approval_requested','approved','rejected','retry','done','failed')),
  payload    jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON paperclip.task_events (task_id, created_at DESC);

CREATE TABLE paperclip.budgets (
  agent_id    uuid    PRIMARY KEY REFERENCES paperclip.agent_registrations(id) ON DELETE CASCADE,
  cap_cents   int     NOT NULL,
  spent_cents int     NOT NULL DEFAULT 0,
  reset_at    timestamptz NOT NULL DEFAULT date_trunc('month', now() + interval '1 month'),
  paused      boolean NOT NULL DEFAULT false
);

CREATE TABLE paperclip.heartbeats (
  id       uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid        NOT NULL REFERENCES paperclip.agent_registrations(id) ON DELETE CASCADE,
  beat_at  timestamptz NOT NULL DEFAULT now(),
  status   text        NOT NULL,
  details  jsonb
);
CREATE INDEX heartbeats_recent ON paperclip.heartbeats (agent_id, beat_at DESC);

ALTER TABLE paperclip.agent_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE paperclip.tasks               ENABLE ROW LEVEL SECURITY;
ALTER TABLE paperclip.task_events         ENABLE ROW LEVEL SECURITY;
ALTER TABLE paperclip.budgets             ENABLE ROW LEVEL SECURITY;
ALTER TABLE paperclip.heartbeats          ENABLE ROW LEVEL SECURITY;

DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'paperclip' LOOP
    EXECUTE format('CREATE POLICY "service role all" ON paperclip.%I FOR ALL TO service_role USING (true) WITH CHECK (true)', t);
    EXECUTE format('CREATE POLICY "anon blocked"     ON paperclip.%I FOR ALL TO anon      USING (false) WITH CHECK (false)', t);
  END LOOP;
END $$;

CREATE POLICY "admin reads registrations" ON paperclip.agent_registrations FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "admin reads tasks"         ON paperclip.tasks               FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "admin reads task_events"   ON paperclip.task_events         FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "admin reads budgets"       ON paperclip.budgets             FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "admin reads heartbeats"    ON paperclip.heartbeats          FOR SELECT TO authenticated USING (public.is_admin());
