-- 067 + 068: marketing support tables
-- Adds delivery_logs, openclaw_conversations, influencers needed by the two OpenClaw edge functions.

-- ─── influencers ─────────────────────────────────────────────────────────────

CREATE TABLE marketing.influencers (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id         uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  handle           text        NOT NULL,
  platform         text        NOT NULL
                   CHECK (platform IN ('instagram','facebook','tiktok','x','linkedin','youtube')),
  follower_count   int         NOT NULL DEFAULT 0,
  engagement_rate  numeric(5,4),
  category         text,
  email            text,
  whatsapp         text,
  tags             text[]      NOT NULL DEFAULT '{}',
  notes            text,
  status           text        NOT NULL DEFAULT 'prospect'
                   CHECK (status IN ('prospect','outreach','active','inactive','blacklisted')),
  metadata         jsonb       NOT NULL DEFAULT '{}',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON marketing.influencers (owner_id);
CREATE INDEX ON marketing.influencers (platform, status);
CREATE TRIGGER tg_influencers_updated_at BEFORE UPDATE ON marketing.influencers
  FOR EACH ROW EXECUTE FUNCTION marketing.fn_updated_at();

ALTER TABLE marketing.influencers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_blocked_influencers"  ON marketing.influencers FOR ALL TO anon         USING (false);
CREATE POLICY "svc_full_influencers"      ON marketing.influencers FOR ALL TO service_role  USING (true) WITH CHECK (true);
CREATE POLICY "owner_select_influencers"  ON marketing.influencers FOR SELECT TO authenticated
  USING (owner_id = (SELECT auth.uid()));

-- ─── delivery_logs ───────────────────────────────────────────────────────────

CREATE TABLE marketing.delivery_logs (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  outbox_id           uuid        REFERENCES public.outbox(id) ON DELETE SET NULL,
  campaign_id         uuid        REFERENCES marketing.marketing_campaigns(id) ON DELETE SET NULL,
  channel             text        NOT NULL
                      CHECK (channel IN ('whatsapp','email','sms')),
  recipient           text        NOT NULL,
  status              text        NOT NULL
                      CHECK (status IN ('sent','delivered','read','failed','bounced','opted_out')),
  openclaw_message_id text,
  error_code          text,
  error_message       text,
  metadata            jsonb       NOT NULL DEFAULT '{}',
  sent_at             timestamptz,
  delivered_at        timestamptz,
  read_at             timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ON marketing.delivery_logs (openclaw_message_id)
  WHERE openclaw_message_id IS NOT NULL;
CREATE INDEX ON marketing.delivery_logs (campaign_id, created_at DESC);
CREATE INDEX ON marketing.delivery_logs (recipient, channel);
CREATE INDEX ON marketing.delivery_logs (status, created_at DESC);
CREATE TRIGGER tg_delivery_logs_updated_at BEFORE UPDATE ON marketing.delivery_logs
  FOR EACH ROW EXECUTE FUNCTION marketing.fn_updated_at();

ALTER TABLE marketing.delivery_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_blocked_delivery_logs" ON marketing.delivery_logs FOR ALL TO anon         USING (false);
CREATE POLICY "svc_full_delivery_logs"     ON marketing.delivery_logs FOR ALL TO service_role  USING (true) WITH CHECK (true);
CREATE POLICY "auth_select_delivery_logs"  ON marketing.delivery_logs FOR SELECT TO authenticated
  USING (
    campaign_id IN (
      SELECT id FROM marketing.marketing_campaigns
      WHERE owner_id = (SELECT auth.uid())
    )
  );

-- ─── openclaw_conversations ──────────────────────────────────────────────────

CREATE TABLE marketing.openclaw_conversations (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_phone       text        NOT NULL,
  direction           text        NOT NULL CHECK (direction IN ('inbound','outbound')),
  channel             text        NOT NULL DEFAULT 'whatsapp',
  body                text        NOT NULL,
  intent              text,
  confidence          numeric(4,3),
  reply_body          text,
  openclaw_message_id text,
  campaign_id         uuid        REFERENCES marketing.marketing_campaigns(id) ON DELETE SET NULL,
  metadata            jsonb       NOT NULL DEFAULT '{}',
  replied_at          timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON marketing.openclaw_conversations (contact_phone, created_at DESC);
CREATE INDEX ON marketing.openclaw_conversations (campaign_id);
CREATE INDEX ON marketing.openclaw_conversations (intent, created_at DESC);
CREATE UNIQUE INDEX ON marketing.openclaw_conversations (openclaw_message_id)
  WHERE openclaw_message_id IS NOT NULL;

ALTER TABLE marketing.openclaw_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_blocked_conversations" ON marketing.openclaw_conversations FOR ALL TO anon         USING (false);
CREATE POLICY "svc_full_conversations"     ON marketing.openclaw_conversations FOR ALL TO service_role  USING (true) WITH CHECK (true);
CREATE POLICY "auth_select_conversations"  ON marketing.openclaw_conversations FOR SELECT TO authenticated
  USING (
    campaign_id IN (
      SELECT id FROM marketing.marketing_campaigns
      WHERE owner_id = (SELECT auth.uid())
    )
    OR campaign_id IS NULL
  );

COMMENT ON TABLE marketing.influencers            IS 'Influencer CRM — tracked handles with status and contact info';
COMMENT ON TABLE marketing.delivery_logs          IS 'Message delivery receipts from OpenClaw; opt-outs trigger suppression_list insert';
COMMENT ON TABLE marketing.openclaw_conversations IS 'Inbound + outbound WhatsApp messages via the concierge bot (edge fn 068)';
