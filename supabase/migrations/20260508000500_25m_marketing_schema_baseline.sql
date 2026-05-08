-- 25M: Marketing schema baseline
-- 8 tables under the marketing schema; unblocks all 16-/18-series prompts.

CREATE SCHEMA IF NOT EXISTS marketing;
GRANT USAGE ON SCHEMA marketing TO authenticated, service_role;

CREATE OR REPLACE FUNCTION marketing.fn_updated_at()
  RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN NEW.updated_at = pg_catalog.now(); RETURN NEW; END $$;

CREATE TABLE marketing.marketing_campaigns (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  org_id       uuid,
  name         text        NOT NULL,
  status       text        NOT NULL DEFAULT 'draft'
               CHECK (status IN ('draft','pending_review','approved','scheduled','running','completed','failed','cancelled')),
  budget_cents integer     NOT NULL DEFAULT 0,
  channel_mix  text[]      NOT NULL DEFAULT '{}',
  starts_at    timestamptz,
  ends_at      timestamptz,
  metadata     jsonb       NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON marketing.marketing_campaigns (owner_id);
CREATE INDEX ON marketing.marketing_campaigns (status, starts_at);
CREATE TRIGGER tg_marketing_campaigns_updated_at BEFORE UPDATE ON marketing.marketing_campaigns
  FOR EACH ROW EXECUTE FUNCTION marketing.fn_updated_at();

CREATE TABLE marketing.campaign_posts (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id  uuid        NOT NULL REFERENCES marketing.marketing_campaigns(id) ON DELETE CASCADE,
  channel      text        NOT NULL CHECK (channel IN ('instagram','facebook','tiktok','x','linkedin','whatsapp','email')),
  body         text        NOT NULL,
  media_asset_ids uuid[]   NOT NULL DEFAULT '{}',
  status       text        NOT NULL DEFAULT 'draft'
               CHECK (status IN ('draft','pending_review','approved','scheduled','published','failed','cancelled')),
  scheduled_at timestamptz,
  published_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON marketing.campaign_posts (campaign_id);
CREATE INDEX ON marketing.campaign_posts (status, scheduled_at);
CREATE TRIGGER tg_campaign_posts_updated_at BEFORE UPDATE ON marketing.campaign_posts
  FOR EACH ROW EXECUTE FUNCTION marketing.fn_updated_at();

CREATE TABLE marketing.campaign_assets (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id  uuid        REFERENCES marketing.marketing_campaigns(id) ON DELETE CASCADE,
  storage_path text        NOT NULL,
  kind         text        NOT NULL CHECK (kind IN ('image','video','copy')),
  alt_text     text,
  metadata     jsonb       NOT NULL DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON marketing.campaign_assets (campaign_id);

CREATE TABLE marketing.campaign_channels (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid    NOT NULL REFERENCES marketing.marketing_campaigns(id) ON DELETE CASCADE,
  channel     text    NOT NULL,
  settings    jsonb   NOT NULL DEFAULT '{}',
  enabled     boolean NOT NULL DEFAULT true,
  UNIQUE (campaign_id, channel)
);

CREATE TABLE marketing.campaign_approvals (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   uuid        NOT NULL REFERENCES marketing.marketing_campaigns(id) ON DELETE CASCADE,
  scope         text        NOT NULL CHECK (scope IN ('campaign','batch','single_post')),
  decided_by    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_at    timestamptz,
  status        text        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','approved','rejected','revoked')),
  snapshot_json jsonb       NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON marketing.campaign_approvals (campaign_id, status);

CREATE TABLE marketing.campaign_events (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid        NOT NULL REFERENCES marketing.marketing_campaigns(id) ON DELETE CASCADE,
  post_id     uuid        REFERENCES marketing.campaign_posts(id) ON DELETE SET NULL,
  event_type  text        NOT NULL,
  payload     jsonb       NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON marketing.campaign_events (campaign_id, created_at DESC);

CREATE TABLE marketing.postiz_publications (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id      uuid        NOT NULL REFERENCES marketing.campaign_posts(id) ON DELETE CASCADE,
  postiz_id    text        NOT NULL,
  channel      text        NOT NULL,
  status       text        NOT NULL,
  external_url text,
  raw          jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ON marketing.postiz_publications (postiz_id, channel);
CREATE INDEX ON marketing.postiz_publications (post_id);

CREATE TABLE marketing.campaign_metrics (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id  uuid    NOT NULL REFERENCES marketing.marketing_campaigns(id) ON DELETE CASCADE,
  date         date    NOT NULL,
  impressions  integer NOT NULL DEFAULT 0,
  clicks       integer NOT NULL DEFAULT 0,
  conversions  integer NOT NULL DEFAULT 0,
  spend_cents  integer NOT NULL DEFAULT 0,
  raw          jsonb,
  UNIQUE (campaign_id, date)
);
CREATE INDEX ON marketing.campaign_metrics (campaign_id, date DESC);

ALTER TABLE marketing.marketing_campaigns  ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.campaign_posts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.campaign_assets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.campaign_channels    ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.campaign_approvals   ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.campaign_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.postiz_publications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing.campaign_metrics     ENABLE ROW LEVEL SECURITY;

DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'marketing' LOOP
    EXECUTE format('CREATE POLICY "service role all" ON marketing.%I FOR ALL TO service_role USING (true) WITH CHECK (true)', t);
    EXECUTE format('CREATE POLICY "anon blocked"     ON marketing.%I FOR ALL TO anon      USING (false) WITH CHECK (false)', t);
  END LOOP;
END $$;

CREATE POLICY "owner reads campaigns" ON marketing.marketing_campaigns
  FOR SELECT TO authenticated USING ((select auth.uid()) = owner_id);

CREATE POLICY "owner reads posts" ON marketing.campaign_posts
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM marketing.marketing_campaigns mc
    WHERE mc.id = campaign_id AND mc.owner_id = (select auth.uid())
  ));
