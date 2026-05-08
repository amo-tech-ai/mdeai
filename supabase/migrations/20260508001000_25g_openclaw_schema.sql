-- 25G: openclaw.* schema — execution layer (WhatsApp, scraper, browser)
-- 4 tables: providers, provider_credentials, outbound_jobs, inbound_events
-- Seeds 5 known providers.

CREATE SCHEMA IF NOT EXISTS openclaw;
GRANT USAGE ON SCHEMA openclaw TO service_role;

CREATE TABLE openclaw.providers (
  id                 text        PRIMARY KEY,
  kind               text        NOT NULL CHECK (kind IN ('whatsapp','scraper','browser','social')),
  config             jsonb       NOT NULL DEFAULT '{}',
  enabled            boolean     NOT NULL DEFAULT true,
  last_health_at     timestamptz,
  last_health_status text
);

INSERT INTO openclaw.providers (id, kind) VALUES
  ('twilio',         'whatsapp'),
  ('kapso',          'whatsapp'),
  ('apify',          'scraper'),
  ('playwright-vps', 'browser'),
  ('postiz',         'social')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE openclaw.provider_credentials (
  provider_id  text        NOT NULL PRIMARY KEY REFERENCES openclaw.providers(id) ON DELETE CASCADE,
  vault_secret text        NOT NULL,
  rotated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE openclaw.outbound_jobs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id text        NOT NULL REFERENCES openclaw.providers(id),
  outbox_id   uuid        NOT NULL REFERENCES public.outbox(id) ON DELETE RESTRICT,
  approval_id uuid        REFERENCES public.approval_requests(id) ON DELETE SET NULL,
  status      text        NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','running','sent','delivered','failed','cancelled')),
  request     jsonb       NOT NULL,
  response    jsonb,
  attempts    int         NOT NULL DEFAULT 0,
  started_at  timestamptz,
  finished_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX outbound_jobs_pending ON openclaw.outbound_jobs (status, provider_id)
  WHERE status IN ('pending','running');
CREATE INDEX ON openclaw.outbound_jobs (outbox_id);

CREATE TABLE openclaw.inbound_events (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id           text        NOT NULL REFERENCES openclaw.providers(id),
  external_id           text,
  event_type            text        NOT NULL CHECK (event_type IN ('message','status','bounce','reply','stop','opt_in')),
  identifier            text        NOT NULL,
  payload               jsonb       NOT NULL,
  correlation_outbox_id uuid        REFERENCES public.outbox(id) ON DELETE SET NULL,
  received_at           timestamptz NOT NULL DEFAULT now(),
  processed_at          timestamptz,
  UNIQUE (provider_id, external_id)
);
CREATE INDEX inbound_events_unprocessed ON openclaw.inbound_events (received_at) WHERE processed_at IS NULL;
CREATE INDEX ON openclaw.inbound_events (identifier);

ALTER TABLE openclaw.providers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE openclaw.provider_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE openclaw.outbound_jobs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE openclaw.inbound_events       ENABLE ROW LEVEL SECURITY;

DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'openclaw' LOOP
    EXECUTE format('CREATE POLICY "service role all" ON openclaw.%I FOR ALL TO service_role USING (true) WITH CHECK (true)', t);
    EXECUTE format('CREATE POLICY "anon blocked"     ON openclaw.%I FOR ALL TO anon      USING (false) WITH CHECK (false)', t);
  END LOOP;
END $$;

CREATE POLICY "admin reads providers"      ON openclaw.providers      FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "admin reads outbound_jobs"  ON openclaw.outbound_jobs  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "admin reads inbound_events" ON openclaw.inbound_events FOR SELECT TO authenticated USING (public.is_admin());
