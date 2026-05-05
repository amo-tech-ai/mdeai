---
task_id: 059-marketing-schema-migration
title: marketing.* schema migration — 13 tables + RLS + pg_cron rollup
phase: PHASE-2-MARKETING
priority: P1
status: Open
estimated_effort: 1 day
area: backend
skill:
  - supabase
  - supabase-postgres-best-practices
  - mdeai-project-gates
edge_function: null
schema_tables:
  - marketing.campaigns
  - marketing.posts
  - marketing.campaign_approvals
  - marketing.clicks
  - marketing.impressions
  - marketing.conversions
  - marketing.referral_links
  - marketing.delivery_logs
  - marketing.openclaw_conversations
  - marketing.openclaw_skills
  - marketing.segments
  - marketing.influencers
  - marketing.influencer_outreach
depends_on:
  - '001-event-schema-migration'
  - '045-sponsor-schema-migration'
mermaid_diagram: null
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-2-MARKETING — foundation; all 7 subsequent marketing tasks depend on this |
| **Schema** | New `marketing` schema; 13 tables; RLS on all; human-approval gate enforced by FK constraint |
| **Real-world** | Sofía creates "Reina de Antioquia 2026" and triggers a 14-day content plan. `marketing.campaigns` holds the plan; `marketing.posts` holds each scheduled post; `marketing.campaign_approvals` blocks any send until a human approves. Attribution flows through `marketing.clicks → marketing.conversions` to feed sponsor CPL/CPA |

## Description

**The situation.** No marketing tables exist. The closed-loop growth model (event → campaign → traffic → ticket/vote → attribution → sponsor ROI → next event) requires a persistent schema to store campaigns, scheduled posts, approval records, click attribution, referral links, and OpenClaw delivery receipts.

**Why `marketing` schema not `public.*`.** The marketing surface is a distinct product domain. Isolating it prevents FK sprawl, simplifies RLS, and enables future multi-tenant isolation without migration churn.

**Human-approval gate.** `marketing.campaign_approvals.status` must be `'approved'` before any edge fn sends a post or outreach message. This is enforced at the application layer by `063-postiz-schedule-posts-edge-fn` and `064-openclaw-outreach-edge-fns` — both check `campaign_approvals.status = 'approved'` before executing. No message is ever sent without explicit approval.

## Schema

```sql
CREATE SCHEMA IF NOT EXISTS marketing;

-- Master campaign record: one per event per channel bundle
CREATE TABLE marketing.campaigns (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  organizer_id    uuid NOT NULL REFERENCES auth.users(id),
  name            text NOT NULL,
  start_date      date NOT NULL,
  end_date        date NOT NULL,
  status          text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','pending_approval','approved','active','paused','completed','cancelled')),
  budget_cents    int,
  gemini_plan     jsonb,  -- raw AI-generated plan before human review
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- Individual scheduled posts (Postiz + OpenClaw messages)
CREATE TABLE marketing.posts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     uuid NOT NULL REFERENCES marketing.campaigns(id) ON DELETE CASCADE,
  channel         text NOT NULL CHECK (channel IN ('instagram','facebook','tiktok','twitter','youtube','linkedin','whatsapp','telegram','email')),
  content_text    text NOT NULL,
  media_urls      text[],
  scheduled_at    timestamptz NOT NULL,
  postiz_post_id  text,  -- provider_post_id from Postiz
  status          text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','approved','scheduled','sent','failed')),
  sent_at         timestamptz,
  created_at      timestamptz DEFAULT now()
);

-- Human approval gate: exactly one row per campaign; status='approved' required before any send
CREATE TABLE marketing.campaign_approvals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     uuid NOT NULL REFERENCES marketing.campaigns(id) ON DELETE CASCADE,
  reviewed_by     uuid REFERENCES auth.users(id),
  status          text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected')),
  notes           text,
  reviewed_at     timestamptz,
  UNIQUE (campaign_id)
);

-- Click attribution: every outbound link carries utm_campaign + ref_token
CREATE TABLE marketing.clicks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         uuid REFERENCES marketing.posts(id),
  campaign_id     uuid NOT NULL REFERENCES marketing.campaigns(id),
  ref_token       text,
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,
  ip_hash         text,  -- SHA-256 of IP for dedup, no raw PII
  user_agent_hash text,
  clicked_at      timestamptz DEFAULT now()
);
CREATE INDEX ON marketing.clicks (campaign_id, clicked_at);
CREATE INDEX ON marketing.clicks (ref_token) WHERE ref_token IS NOT NULL;

-- Impression tracking (for sponsor placements on posts)
CREATE TABLE marketing.impressions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     uuid NOT NULL REFERENCES marketing.campaigns(id),
  post_id         uuid REFERENCES marketing.posts(id),
  surface         text,  -- 'ig_story','whatsapp_broadcast','email_header'
  impression_at   timestamptz DEFAULT now()
);

-- Conversion events downstream of a click (ticket purchase, vote cast, registration)
CREATE TABLE marketing.conversions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  click_id        uuid NOT NULL REFERENCES marketing.clicks(id),
  campaign_id     uuid NOT NULL REFERENCES marketing.campaigns(id),
  event_type      text NOT NULL CHECK (event_type IN ('ticket_purchase','vote_cast','registration','sponsor_inquiry')),
  revenue_cents   int,
  converted_at    timestamptz DEFAULT now()
);
CREATE INDEX ON marketing.conversions (campaign_id, event_type);

-- Referral links: unique short token per influencer/channel for attribution
CREATE TABLE marketing.referral_links (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     uuid NOT NULL REFERENCES marketing.campaigns(id),
  ref_token       text NOT NULL UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  label           text,  -- 'influencer:@laurabotero','email:newsletter'
  destination_url text NOT NULL,
  clicks_count    int NOT NULL DEFAULT 0,
  conversions_count int NOT NULL DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);

-- OpenClaw delivery receipts (from openclaw-delivery-webhook)
CREATE TABLE marketing.delivery_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         uuid REFERENCES marketing.posts(id),
  campaign_id     uuid NOT NULL REFERENCES marketing.campaigns(id),
  channel         text NOT NULL,
  openclaw_job_id text UNIQUE,
  status          text NOT NULL CHECK (status IN ('sent','delivered','read','failed','opted_out')),
  contact_hash    text,  -- SHA-256(phone/email) — no raw PII
  delivered_at    timestamptz,
  read_at         timestamptz,
  error_detail    text,
  created_at      timestamptz DEFAULT now()
);

-- OpenClaw conversation state (inbound replies, concierge sessions)
CREATE TABLE marketing.openclaw_conversations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel             text NOT NULL,
  contact_hash        text NOT NULL,  -- SHA-256(phone/email)
  user_id             uuid REFERENCES auth.users(id),
  openclaw_session_id text,
  last_message_at     timestamptz,
  topic_tags          text[],
  created_at          timestamptz DEFAULT now(),
  UNIQUE (channel, contact_hash)
);

-- OpenClaw skill registry (what skills are installed on the VPS)
CREATE TABLE marketing.openclaw_skills (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_name  text NOT NULL UNIQUE,
  description text,
  trigger     text,
  created_by  uuid REFERENCES auth.users(id),
  is_active   bool NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

-- Audience segments (saved filter specs for campaigns)
CREATE TABLE marketing.segments (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name    text NOT NULL UNIQUE,
  filter  jsonb NOT NULL,  -- {city:'Medellín',followers:'5k-50k',niche:'beauty'}
  created_at timestamptz DEFAULT now()
);

-- Influencer/contact database (from Apify scraping + manual entry)
CREATE TABLE marketing.influencers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source          text NOT NULL CHECK (source IN ('apify','manual','referral')),
  platform        text NOT NULL CHECK (platform IN ('instagram','tiktok','youtube','whatsapp','email','other')),
  handle          text NOT NULL,
  display_name    text,
  follower_count  int,
  engagement_rate numeric(5,4),
  niche_tags      text[],
  city            text,
  contact_hash    text,  -- SHA-256(whatsapp_e164 or email)
  embedding       vector(768),
  opt_out         bool NOT NULL DEFAULT false,
  first_seen_at   timestamptz DEFAULT now(),
  UNIQUE (platform, handle)
);
CREATE INDEX ON marketing.influencers USING ivfflat (embedding vector_cosine_ops) WHERE opt_out = false;
CREATE INDEX ON marketing.influencers (city, platform) WHERE opt_out = false;

-- Influencer outreach log (one row per outreach attempt per influencer)
CREATE TABLE marketing.influencer_outreach (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id   uuid NOT NULL REFERENCES marketing.influencers(id),
  campaign_id     uuid NOT NULL REFERENCES marketing.campaigns(id),
  channel         text NOT NULL,
  status          text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','sent','replied','converted','opted_out','failed')),
  sent_at         timestamptz,
  replied_at      timestamptz,
  UNIQUE (influencer_id, campaign_id)
);
```

## RLS policies

```sql
-- campaigns: organizer reads own; service_role writes
ALTER TABLE marketing.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "organizer reads own campaigns"
  ON marketing.campaigns FOR SELECT
  USING (organizer_id = (SELECT auth.uid()));
-- INSERT/UPDATE/DELETE: service_role only (via edge fns)

-- posts: same pattern as campaigns via JOIN
ALTER TABLE marketing.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "organizer reads own posts"
  ON marketing.posts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM marketing.campaigns c
    WHERE c.id = campaign_id AND c.organizer_id = (SELECT auth.uid())
  ));

-- campaign_approvals: admin reads/writes; organizer reads own
ALTER TABLE marketing.campaign_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "organizer reads own approval"
  ON marketing.campaign_approvals FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM marketing.campaigns c
    WHERE c.id = campaign_id AND c.organizer_id = (SELECT auth.uid())
  ));
-- All other tables: service_role only (PII-adjacent)
```

## Indexes

```sql
CREATE INDEX ON marketing.campaigns (event_id);
CREATE INDEX ON marketing.campaigns (organizer_id, status);
CREATE INDEX ON marketing.posts (campaign_id, scheduled_at);
CREATE INDEX ON marketing.clicks (ref_token) WHERE ref_token IS NOT NULL;
CREATE INDEX ON marketing.conversions (click_id);
CREATE INDEX ON marketing.influencer_outreach (campaign_id, status);
```

## Acceptance Criteria

- [ ] All 13 tables created in `marketing` schema; `\dt marketing.*` confirms.
- [ ] `marketing.campaign_approvals` has `UNIQUE (campaign_id)` — only one approval row per campaign.
- [ ] RLS enabled on all 13 tables; `get_advisors(security)` returns 0 new ERRORs on `marketing.*` tables.
- [ ] FK indexes: every `REFERENCES` column has a matching index — `get_advisors(performance)` confirms.
- [ ] `embedding vector(768)` column on `marketing.influencers` with `ivfflat` index.
- [ ] `npm run lint` zero new errors; `npm run build` clean.

## See also

- [`growth-strategy.md`](../growth-strategy.md) §3 — schema source
- [`social/02-openclaw-strategy.md`](../social/02-openclaw-strategy.md) §DB — three additional tables (delivery_logs, openclaw_conversations, openclaw_skills)
- [`060-campaign-builder-ui.md`](./060-campaign-builder-ui.md) — first consumer of this schema
