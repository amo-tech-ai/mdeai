-- 25D: outreach.* schema — contacts, segments, campaigns, sequences, sequence_steps, send_log
-- Backfills existing public.leads into outreach.contacts.

CREATE SCHEMA IF NOT EXISTS outreach;
GRANT USAGE ON SCHEMA outreach TO authenticated, service_role;

CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA extensions;

CREATE TABLE outreach.contacts (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  email           extensions.citext,
  phone_e164      text,
  whatsapp_e164   text,
  full_name       text,
  source          text,
  source_event_id uuid,
  attributes      jsonb   NOT NULL DEFAULT '{}',
  consent         jsonb   NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT at_least_one_identifier
    CHECK (email IS NOT NULL OR phone_e164 IS NOT NULL OR whatsapp_e164 IS NOT NULL)
);
CREATE UNIQUE INDEX contacts_email_idx ON outreach.contacts (email)         WHERE email IS NOT NULL;
CREATE UNIQUE INDEX contacts_phone_idx ON outreach.contacts (phone_e164)    WHERE phone_e164 IS NOT NULL;
CREATE UNIQUE INDEX contacts_wa_idx    ON outreach.contacts (whatsapp_e164) WHERE whatsapp_e164 IS NOT NULL;

CREATE OR REPLACE FUNCTION outreach.fn_contacts_updated_at()
  RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN NEW.updated_at = pg_catalog.now(); RETURN NEW; END $$;

CREATE TRIGGER tg_contacts_updated_at BEFORE UPDATE ON outreach.contacts
  FOR EACH ROW EXECUTE FUNCTION outreach.fn_contacts_updated_at();

CREATE TABLE outreach.segments (
  id            uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text    NOT NULL,
  filter_sql    text    NOT NULL,
  contact_count int,
  refreshed_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE outreach.campaigns (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL,
  segment_id   uuid        REFERENCES outreach.segments(id) ON DELETE SET NULL,
  channel      text        NOT NULL CHECK (channel IN ('whatsapp','email','sms')),
  template_key text,
  status       text        NOT NULL DEFAULT 'draft'
               CHECK (status IN ('draft','approved','sending','done','paused','cancelled')),
  approval_id  uuid        REFERENCES public.approval_requests(id) ON DELETE SET NULL,
  starts_at    timestamptz,
  finished_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON outreach.campaigns (status, starts_at);

CREATE TABLE outreach.sequences (
  id         uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text    NOT NULL,
  trigger    text    NOT NULL,
  active     boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE outreach.sequence_steps (
  id           uuid     PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id  uuid     NOT NULL REFERENCES outreach.sequences(id) ON DELETE CASCADE,
  step_order   int      NOT NULL,
  delay        interval NOT NULL,
  channel      text     NOT NULL,
  template_key text     NOT NULL,
  conditions   jsonb,
  UNIQUE (sequence_id, step_order)
);
CREATE INDEX ON outreach.sequence_steps (sequence_id);

CREATE TABLE outreach.send_log (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id       uuid        NOT NULL REFERENCES outreach.contacts(id) ON DELETE CASCADE,
  campaign_id      uuid        REFERENCES outreach.campaigns(id) ON DELETE SET NULL,
  sequence_step_id uuid        REFERENCES outreach.sequence_steps(id) ON DELETE SET NULL,
  outbox_id        uuid        NOT NULL REFERENCES public.outbox(id) ON DELETE RESTRICT,
  status           text        NOT NULL,
  delivered_at     timestamptz,
  opened_at        timestamptz,
  clicked_at       timestamptz,
  replied_at       timestamptz,
  unsubscribed_at  timestamptz,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON outreach.send_log (contact_id);
CREATE INDEX ON outreach.send_log (campaign_id);
CREATE INDEX ON outreach.send_log (outbox_id);

ALTER TABLE outreach.contacts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach.segments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach.campaigns      ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach.sequences      ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach.sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach.send_log       ENABLE ROW LEVEL SECURITY;

DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'outreach' LOOP
    EXECUTE format('CREATE POLICY "service role all" ON outreach.%I FOR ALL TO service_role USING (true) WITH CHECK (true)', t);
    EXECUTE format('CREATE POLICY "anon blocked"     ON outreach.%I FOR ALL TO anon      USING (false) WITH CHECK (false)', t);
  END LOOP;
END $$;

CREATE POLICY "admin reads contacts"  ON outreach.contacts  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "admin reads send_log"  ON outreach.send_log  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "admin reads campaigns" ON outreach.campaigns FOR SELECT TO authenticated USING (public.is_admin());

-- Backfill existing leads (no name column in public.leads)
INSERT INTO outreach.contacts (email, phone_e164, source, attributes, created_at)
SELECT
  email::extensions.citext,
  phone,
  COALESCE(source, 'lead-form'),
  jsonb_build_object('lead_id', id, 'status', status, 'score', score),
  created_at
FROM public.leads
WHERE email IS NOT NULL OR phone IS NOT NULL
ON CONFLICT DO NOTHING;
