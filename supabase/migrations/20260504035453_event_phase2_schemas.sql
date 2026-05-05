-- Phase 2 supporting schemas: stakeholders (028), vendors (029), sponsors (031), attendee profiles (032)

-- ─── 028: event_stakeholders ─────────────────────────────────────────────────

CREATE TABLE public.event_stakeholders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES auth.users(id),
  full_name       text NOT NULL,
  email           text NOT NULL,
  phone_e164      text,
  role            text NOT NULL CHECK (role IN
    ('organizer','planner','co_producer','mc','host','judge',
     'sponsor_contact','vendor_lead','security_lead','photographer','other')),
  organization    text,
  is_primary      boolean NOT NULL DEFAULT false,
  notes           text,
  invited_by      uuid REFERENCES auth.users(id),
  invited_at      timestamptz NOT NULL DEFAULT now(),
  accepted_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, email, role)
);
CREATE INDEX event_stakeholders_event_idx ON public.event_stakeholders(event_id);
CREATE INDEX event_stakeholders_user_idx  ON public.event_stakeholders(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX event_stakeholders_role_idx  ON public.event_stakeholders(event_id, role);
ALTER TABLE  public.event_stakeholders ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER event_stakeholders_set_updated_at BEFORE UPDATE ON public.event_stakeholders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY stakeholders_organizer_all ON public.event_stakeholders FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.events e WHERE e.id = event_stakeholders.event_id
      AND e.organizer_id = (SELECT auth.uid())
  ));
CREATE POLICY stakeholders_self_select ON public.event_stakeholders FOR SELECT
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY stakeholders_peer_select ON public.event_stakeholders FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.event_stakeholders peer
    WHERE peer.event_id = event_stakeholders.event_id
      AND peer.user_id = (SELECT auth.uid())
  ));

-- ─── 029: event_vendors ──────────────────────────────────────────────────────

CREATE TABLE public.event_vendors (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id              uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  company_name          text NOT NULL,
  service_type          text NOT NULL CHECK (service_type IN
    ('photographer','videographer','av_sound','security','catering','decor',
     'transport','printing','rental','venue_supplier','other')),
  contact_name          text,
  contact_email         text,
  contact_phone_e164    text,
  contract_amount_cents int CHECK (contract_amount_cents IS NULL OR contract_amount_cents >= 0),
  currency              text NOT NULL DEFAULT 'COP',
  amount_paid_cents     int NOT NULL DEFAULT 0 CHECK (amount_paid_cents >= 0),
  payment_status        text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN
    ('unpaid','partial','paid','overdue','cancelled')),
  contract_url          text,
  invoice_url           text,
  notes                 text,
  booked_at             timestamptz,
  service_date          timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  CHECK (amount_paid_cents <= COALESCE(contract_amount_cents, 2147483647))
);
CREATE INDEX event_vendors_event_idx    ON public.event_vendors(event_id);
CREATE INDEX event_vendors_service_idx  ON public.event_vendors(event_id, service_type);
CREATE INDEX event_vendors_payment_idx  ON public.event_vendors(event_id, payment_status);
ALTER TABLE  public.event_vendors ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER event_vendors_set_updated_at BEFORE UPDATE ON public.event_vendors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY vendors_organizer_all ON public.event_vendors FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.events e WHERE e.id = event_vendors.event_id
      AND e.organizer_id = (SELECT auth.uid())
  ));
CREATE POLICY vendors_costakeholder_select ON public.event_vendors FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.event_stakeholders s
    WHERE s.event_id = event_vendors.event_id
      AND s.user_id = (SELECT auth.uid())
      AND s.role IN ('co_producer','planner')
  ));

-- ─── 031: event_sponsors + event_sponsor_placements ─────────────────────────

CREATE TABLE public.event_sponsors (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id            uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  sponsor_org_id      uuid NOT NULL,
  tier                text NOT NULL CHECK (tier IN ('bronze','silver','gold','premium','title')),
  amount_cents        int NOT NULL CHECK (amount_cents >= 0),
  currency            text NOT NULL DEFAULT 'COP',
  contract_start_at   timestamptz,
  contract_end_at     timestamptz,
  status              text NOT NULL DEFAULT 'pending' CHECK (status IN
    ('pending','approved','active','completed','cancelled')),
  approved_by         uuid REFERENCES auth.users(id),
  approved_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, sponsor_org_id, tier)
);
CREATE INDEX event_sponsors_event_idx  ON public.event_sponsors(event_id);
CREATE INDEX event_sponsors_org_idx    ON public.event_sponsors(sponsor_org_id);
CREATE INDEX event_sponsors_status_idx ON public.event_sponsors(event_id, status);
ALTER TABLE  public.event_sponsors ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER event_sponsors_set_updated_at BEFORE UPDATE ON public.event_sponsors
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY sponsors_organizer_all ON public.event_sponsors FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.events e WHERE e.id = event_sponsors.event_id
      AND e.organizer_id = (SELECT auth.uid())
  ));
CREATE POLICY sponsors_public_select ON public.event_sponsors FOR SELECT
  USING (status = 'active' AND EXISTS (
    SELECT 1 FROM public.events e WHERE e.id = event_sponsors.event_id
      AND e.status IN ('published','live','closed')
  ));

CREATE TABLE public.event_sponsor_placements (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_sponsor_id    uuid NOT NULL REFERENCES public.event_sponsors(id) ON DELETE CASCADE,
  surface             text NOT NULL CHECK (surface IN
    ('event_hero','ticket_pdf','confirmation_email','recap_email',
     'in_app_banner','contest_header','venue_signage','stage_screen','other')),
  asset_id            uuid REFERENCES public.event_media_assets(id),
  position            int NOT NULL DEFAULT 0,
  weight              numeric(4,2) NOT NULL DEFAULT 1.0 CHECK (weight >= 0 AND weight <= 10),
  starts_at           timestamptz,
  ends_at             timestamptz,
  is_active           boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX event_sponsor_placements_sponsor_idx ON public.event_sponsor_placements(event_sponsor_id);
CREATE INDEX event_sponsor_placements_surface_idx ON public.event_sponsor_placements(surface) WHERE is_active = true;
ALTER TABLE  public.event_sponsor_placements ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER event_sponsor_placements_set_updated_at BEFORE UPDATE ON public.event_sponsor_placements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY placements_organizer_all ON public.event_sponsor_placements FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.event_sponsors s
    JOIN public.events e ON e.id = s.event_id
    WHERE s.id = event_sponsor_placements.event_sponsor_id
      AND e.organizer_id = (SELECT auth.uid())
  ));
CREATE POLICY placements_public_select ON public.event_sponsor_placements FOR SELECT
  USING (is_active = true AND EXISTS (
    SELECT 1 FROM public.event_sponsors s WHERE s.id = event_sponsor_placements.event_sponsor_id
      AND s.status = 'active'
  ));

-- ─── 032: event_attendee_profiles ────────────────────────────────────────────

CREATE TABLE public.event_attendee_profiles (
  attendee_id             uuid PRIMARY KEY REFERENCES public.event_attendees(id) ON DELETE CASCADE,
  dietary_preference      text CHECK (dietary_preference IS NULL OR dietary_preference IN
    ('omnivore','vegetarian','vegan','gluten_free','halal','kosher','none','other')),
  dietary_detail          text,
  accessibility_needs     text[],
  accessibility_detail    text,
  shirt_size              text CHECK (shirt_size IS NULL OR shirt_size IN ('XS','S','M','L','XL','XXL')),
  company                 text,
  job_title               text,
  emergency_contact_name  text,
  emergency_contact_phone text,
  marketing_consent       boolean NOT NULL DEFAULT false,
  custom_fields           jsonb DEFAULT '{}'::jsonb,
  updated_at              timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX event_attendee_profiles_dietary_idx
  ON public.event_attendee_profiles(dietary_preference) WHERE dietary_preference IS NOT NULL;
CREATE INDEX event_attendee_profiles_accessibility_idx
  ON public.event_attendee_profiles USING GIN(accessibility_needs) WHERE accessibility_needs IS NOT NULL;
ALTER TABLE  public.event_attendee_profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER event_attendee_profiles_set_updated_at BEFORE UPDATE ON public.event_attendee_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY profiles_via_attendee ON public.event_attendee_profiles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.event_attendees a
    JOIN public.event_orders o ON o.id = a.order_id
    WHERE a.id = event_attendee_profiles.attendee_id AND (
      o.buyer_user_id = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.events e WHERE e.id = o.event_id
          AND e.organizer_id = (SELECT auth.uid())
      )
    )
  ));
