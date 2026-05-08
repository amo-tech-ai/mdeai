-- 25I: postiz.* schema — social publishing layer
-- 5 tables + 1 security_invoker view: channels, posts, schedules, publish_attempts, analytics_pulls
-- View postiz_outbound uses WITH (security_invoker = true) to respect RLS per Supabase best practices.
-- Seeds 4 social channels.

CREATE SCHEMA IF NOT EXISTS postiz;
GRANT USAGE ON SCHEMA postiz TO service_role;

CREATE TABLE postiz.channels (
  id           text    PRIMARY KEY,
  account_id   text    NOT NULL,
  vault_secret text    NOT NULL,
  enabled      boolean NOT NULL DEFAULT true
);

INSERT INTO postiz.channels (id, account_id, vault_secret) VALUES
  ('instagram', 'mdeai_instagram', 'postiz_instagram_token'),
  ('tiktok',    'mdeai_tiktok',    'postiz_tiktok_token'),
  ('x',         'mdeai_x',         'postiz_x_token'),
  ('facebook',  'mdeai_facebook',  'postiz_facebook_token')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE postiz.posts (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  topic       text        NOT NULL,
  body        text        NOT NULL,
  media_urls  text[],
  status      text        NOT NULL DEFAULT 'draft'
              CHECK (status IN ('draft','approved','scheduled','published','failed','cancelled')),
  approval_id uuid        REFERENCES public.approval_requests(id) ON DELETE SET NULL,
  created_by  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON postiz.posts (status, created_at DESC);

CREATE OR REPLACE FUNCTION postiz.fn_posts_updated_at()
  RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN NEW.updated_at = pg_catalog.now(); RETURN NEW; END $$;

CREATE TRIGGER tg_posts_updated_at BEFORE UPDATE ON postiz.posts
  FOR EACH ROW EXECUTE FUNCTION postiz.fn_posts_updated_at();

CREATE TABLE postiz.schedules (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid        NOT NULL REFERENCES postiz.posts(id) ON DELETE CASCADE,
  channel_id text        NOT NULL REFERENCES postiz.channels(id),
  publish_at timestamptz NOT NULL,
  status     text        NOT NULL DEFAULT 'pending'
             CHECK (status IN ('pending','attempted','published','failed','cancelled')),
  outbox_id  uuid        REFERENCES public.outbox(id) ON DELETE SET NULL
);
CREATE INDEX schedules_due ON postiz.schedules (publish_at) WHERE status = 'pending';
CREATE INDEX ON postiz.schedules (post_id);

CREATE TABLE postiz.publish_attempts (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id  uuid        NOT NULL REFERENCES postiz.schedules(id) ON DELETE CASCADE,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  status       text        NOT NULL,
  provider_id  text,
  error        text
);
CREATE INDEX ON postiz.publish_attempts (schedule_id, attempted_at DESC);

CREATE TABLE postiz.analytics_pulls (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid        NOT NULL REFERENCES postiz.schedules(id) ON DELETE CASCADE,
  pulled_at   timestamptz NOT NULL DEFAULT now(),
  metrics     jsonb       NOT NULL
);
CREATE INDEX ON postiz.analytics_pulls (schedule_id, pulled_at DESC);

ALTER TABLE postiz.channels         ENABLE ROW LEVEL SECURITY;
ALTER TABLE postiz.posts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE postiz.schedules        ENABLE ROW LEVEL SECURITY;
ALTER TABLE postiz.publish_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE postiz.analytics_pulls  ENABLE ROW LEVEL SECURITY;

DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'postiz' LOOP
    EXECUTE format('CREATE POLICY "service role all" ON postiz.%I FOR ALL TO service_role USING (true) WITH CHECK (true)', t);
    EXECUTE format('CREATE POLICY "anon blocked"     ON postiz.%I FOR ALL TO anon      USING (false) WITH CHECK (false)', t);
  END LOOP;
END $$;

CREATE POLICY "admin reads channels"         ON postiz.channels         FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "admin reads posts"            ON postiz.posts            FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "admin reads schedules"        ON postiz.schedules        FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "admin reads publish_attempts" ON postiz.publish_attempts FOR SELECT TO authenticated USING (public.is_admin());

-- security_invoker = true ensures RLS is enforced when the view is queried
CREATE OR REPLACE VIEW postiz.postiz_outbound
  WITH (security_invoker = true)
AS
  SELECT
    s.id            AS schedule_id,
    s.publish_at,
    s.channel_id,
    p.id            AS post_id,
    p.topic,
    p.body,
    p.media_urls,
    p.status        AS post_status,
    s.status        AS schedule_status,
    o.id            AS outbox_id,
    o.status        AS outbox_status,
    o.payload       AS outbox_payload
  FROM postiz.schedules s
  JOIN postiz.posts     p ON p.id = s.post_id
  LEFT JOIN public.outbox o ON o.id = s.outbox_id
  WHERE s.status = 'pending'
    AND p.status = 'approved';
