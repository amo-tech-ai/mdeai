-- ============================================================
-- Task 045: sponsor.* schema — core sponsorship data model
-- Phase: PHASE-1-SPONSOR-MVP
-- 9 tables, RLS, FK indexes, updated_at triggers
-- ============================================================

CREATE SCHEMA IF NOT EXISTS sponsor;

-- ── 1. Brand entities (1:N applications across contests) ─────────────────────
CREATE TABLE sponsor.organizations (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name              text NOT NULL,
  display_name            text NOT NULL,
  website                 text,
  industry                text,
  tax_id                  text,
  primary_contact_user_id uuid REFERENCES auth.users(id),
  status                  text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','suspended','blocked')),
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sponsor_orgs_contact_idx ON sponsor.organizations(primary_contact_user_id)
  WHERE primary_contact_user_id IS NOT NULL;
ALTER TABLE sponsor.organizations ENABLE ROW LEVEL SECURITY;

-- ── 2. Applications: one brand + one event + one activation type + tier ───────
CREATE TABLE sponsor.applications (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  uuid NOT NULL REFERENCES sponsor.organizations(id) ON DELETE CASCADE,
  event_id         uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  activation_type  text NOT NULL CHECK (activation_type IN (
    'title_naming','category_powered_by','contestant_sponsor',
    'venue_sponsor','digital')),
  tier             text NOT NULL CHECK (tier IN (
    'bronze','silver','gold','premium','custom')),
  pricing_model    text NOT NULL CHECK (pricing_model IN (
    'flat','cpl','cpa','cpm','hybrid')),
  flat_price_cents int,
  cpl_cents        int,
  cpa_cents        int,
  campaign_goals   jsonb NOT NULL DEFAULT '{}',
  status           text NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft','submitted','under_review','approved','rejected','live','closed')),
  rejection_reason text,
  submitted_at     timestamptz,
  approved_at      timestamptz,
  approved_by      uuid REFERENCES auth.users(id),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sponsor_apps_event_status_idx ON sponsor.applications(event_id, status);
CREATE INDEX sponsor_apps_org_idx          ON sponsor.applications(organization_id);
CREATE INDEX sponsor_apps_approved_by_idx  ON sponsor.applications(approved_by)
  WHERE approved_by IS NOT NULL;
ALTER TABLE sponsor.applications ENABLE ROW LEVEL SECURITY;

-- ── 3. Brand assets (logo, video, creative) ───────────────────────────────────
CREATE TABLE sponsor.assets (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id        uuid NOT NULL REFERENCES sponsor.applications(id) ON DELETE CASCADE,
  kind                  text NOT NULL CHECK (kind IN (
    'logo','video','image','copy','color')),
  storage_path          text,
  alt_text              text,
  meta                  jsonb NOT NULL DEFAULT '{}',
  ai_moderation_status  text NOT NULL DEFAULT 'pending'
    CHECK (ai_moderation_status IN ('pending','clean','flagged','rejected')),
  created_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sponsor_assets_app_idx ON sponsor.assets(application_id);
ALTER TABLE sponsor.assets ENABLE ROW LEVEL SECURITY;

-- ── 4. Placements: where a brand shows up (one application → N placements) ────
CREATE TABLE sponsor.placements (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  uuid NOT NULL REFERENCES sponsor.applications(id) ON DELETE CASCADE,
  surface         text NOT NULL,
  surface_ref     uuid,
  asset_id        uuid REFERENCES sponsor.assets(id),
  utm_destination text NOT NULL,
  start_at        timestamptz NOT NULL,
  end_at          timestamptz NOT NULL,
  active          boolean NOT NULL DEFAULT false,
  weight          int NOT NULL DEFAULT 100,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sponsor_placements_active_surface_idx
  ON sponsor.placements(surface, surface_ref) WHERE active = true;
CREATE INDEX sponsor_placements_app_idx    ON sponsor.placements(application_id);
CREATE INDEX sponsor_placements_asset_idx  ON sponsor.placements(asset_id)
  WHERE asset_id IS NOT NULL;
ALTER TABLE sponsor.placements ENABLE ROW LEVEL SECURITY;

-- ── 5. Impressions: every render of a placement ───────────────────────────────
CREATE TABLE sponsor.impressions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_id    uuid NOT NULL REFERENCES sponsor.placements(id) ON DELETE CASCADE,
  viewer_user_id  uuid REFERENCES auth.users(id),
  viewer_anon_id  text,
  surface         text NOT NULL,
  ip_hash         text,
  user_agent      text,
  country         text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sponsor_impressions_placement_ts_idx
  ON sponsor.impressions(placement_id, created_at);
CREATE INDEX sponsor_impressions_viewer_idx
  ON sponsor.impressions(viewer_user_id)
  WHERE viewer_user_id IS NOT NULL;
ALTER TABLE sponsor.impressions ENABLE ROW LEVEL SECURITY;

-- ── 6. Clicks on sponsor surfaces ────────────────────────────────────────────
CREATE TABLE sponsor.clicks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_id    uuid NOT NULL REFERENCES sponsor.placements(id) ON DELETE CASCADE,
  viewer_user_id  uuid REFERENCES auth.users(id),
  viewer_anon_id  text,
  utm_full        text,
  ip_hash         text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sponsor_clicks_placement_ts_idx ON sponsor.clicks(placement_id, created_at);
CREATE INDEX sponsor_clicks_viewer_idx       ON sponsor.clicks(viewer_user_id, created_at)
  WHERE viewer_user_id IS NOT NULL;
CREATE INDEX sponsor_clicks_anon_ts_idx      ON sponsor.clicks(viewer_anon_id, created_at)
  WHERE viewer_anon_id IS NOT NULL;
ALTER TABLE sponsor.clicks ENABLE ROW LEVEL SECURITY;

-- ── 7. Attribution: conversion linked to a placement (24h last-click) ─────────
CREATE TABLE sponsor.attributions (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_id           uuid NOT NULL REFERENCES sponsor.placements(id) ON DELETE CASCADE,
  click_id               uuid REFERENCES sponsor.clicks(id),
  conversion_kind        text NOT NULL CHECK (conversion_kind IN (
    'vote','signup','purchase','redemption')),
  conversion_value_cents int NOT NULL DEFAULT 0,
  attributed_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sponsor_attributions_placement_ts_idx
  ON sponsor.attributions(placement_id, attributed_at);
CREATE INDEX sponsor_attributions_click_idx ON sponsor.attributions(click_id)
  WHERE click_id IS NOT NULL;
ALTER TABLE sponsor.attributions ENABLE ROW LEVEL SECURITY;

-- ── 8. Daily rollup for fast dashboard reads ──────────────────────────────────
CREATE TABLE sponsor.roi_daily (
  placement_id             uuid NOT NULL REFERENCES sponsor.placements(id) ON DELETE CASCADE,
  day                      date NOT NULL,
  impressions              int NOT NULL DEFAULT 0,
  clicks                   int NOT NULL DEFAULT 0,
  attributed_conversions   int NOT NULL DEFAULT 0,
  attributed_revenue_cents int NOT NULL DEFAULT 0,
  PRIMARY KEY (placement_id, day)
);
ALTER TABLE sponsor.roi_daily ENABLE ROW LEVEL SECURITY;

-- ── 9. Invoices ───────────────────────────────────────────────────────────────
CREATE TABLE sponsor.invoices (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id        uuid NOT NULL REFERENCES sponsor.applications(id) ON DELETE CASCADE,
  amount_cents          int NOT NULL CHECK (amount_cents > 0),
  currency              text NOT NULL DEFAULT 'COP',
  status                text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','paid','refunded','failed')),
  stripe_session_id     text UNIQUE,
  stripe_payment_intent text UNIQUE,
  invoice_pdf_path      text,
  paid_at               timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sponsor_invoices_app_idx    ON sponsor.invoices(application_id);
CREATE INDEX sponsor_invoices_stripe_idx ON sponsor.invoices(stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;
ALTER TABLE sponsor.invoices ENABLE ROW LEVEL SECURITY;

-- ── updated_at trigger (SECURITY INVOKER, hardened search_path) ──────────────
CREATE OR REPLACE FUNCTION sponsor.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER sponsor_orgs_updated_at
  BEFORE UPDATE ON sponsor.organizations
  FOR EACH ROW EXECUTE FUNCTION sponsor.set_updated_at();

CREATE TRIGGER sponsor_apps_updated_at
  BEFORE UPDATE ON sponsor.applications
  FOR EACH ROW EXECUTE FUNCTION sponsor.set_updated_at();

CREATE TRIGGER sponsor_invoices_updated_at
  BEFORE UPDATE ON sponsor.invoices
  FOR EACH ROW EXECUTE FUNCTION sponsor.set_updated_at();

-- ── RLS policies ──────────────────────────────────────────────────────────────

-- organizations: owner full access
CREATE POLICY sponsor_orgs_owner_all ON sponsor.organizations FOR ALL
  USING (primary_contact_user_id = (SELECT auth.uid()))
  WITH CHECK (primary_contact_user_id = (SELECT auth.uid()));

-- applications: sponsor sees/inserts own org's
CREATE POLICY sponsor_apps_org_select ON sponsor.applications FOR SELECT
  USING (organization_id IN (
    SELECT id FROM sponsor.organizations
    WHERE primary_contact_user_id = (SELECT auth.uid())
  ));
CREATE POLICY sponsor_apps_org_insert ON sponsor.applications FOR INSERT
  WITH CHECK (organization_id IN (
    SELECT id FROM sponsor.organizations
    WHERE primary_contact_user_id = (SELECT auth.uid())
  ));

-- placements: active placements public SELECT; sponsor manages own
CREATE POLICY sponsor_placements_public_select ON sponsor.placements FOR SELECT
  USING (active = true);
CREATE POLICY sponsor_placements_org_all ON sponsor.placements FOR ALL
  USING (application_id IN (
    SELECT a.id FROM sponsor.applications a
    JOIN sponsor.organizations o ON o.id = a.organization_id
    WHERE o.primary_contact_user_id = (SELECT auth.uid())
  ));

-- assets: sponsor reads/writes own application's assets
CREATE POLICY sponsor_assets_org_all ON sponsor.assets FOR ALL
  USING (application_id IN (
    SELECT a.id FROM sponsor.applications a
    JOIN sponsor.organizations o ON o.id = a.organization_id
    WHERE o.primary_contact_user_id = (SELECT auth.uid())
  ));

-- impressions / clicks / attributions: service_role only (edge fns)
-- No anon/authenticated policies — writes go through service client.

-- roi_daily: sponsor reads own placements
CREATE POLICY sponsor_roi_daily_org_select ON sponsor.roi_daily FOR SELECT
  USING (placement_id IN (
    SELECT p.id FROM sponsor.placements p
    JOIN sponsor.applications a ON a.id = p.application_id
    JOIN sponsor.organizations o ON o.id = a.organization_id
    WHERE o.primary_contact_user_id = (SELECT auth.uid())
  ));

-- invoices: sponsor reads own
CREATE POLICY sponsor_invoices_org_select ON sponsor.invoices FOR SELECT
  USING (application_id IN (
    SELECT a.id FROM sponsor.applications a
    JOIN sponsor.organizations o ON o.id = a.organization_id
    WHERE o.primary_contact_user_id = (SELECT auth.uid())
  ));

-- ── Grants ────────────────────────────────────────────────────────────────────
GRANT USAGE ON SCHEMA sponsor TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA sponsor TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA sponsor TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA sponsor TO service_role;
