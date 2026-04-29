# 06 — Landlord / Property Manager System (Production Plan)

> **Status:** Plan v1.0 — locked 2026-04-28 · Owner: sk · Reviewer: Claude Opus 4.7
> **Mission:** Build the landlord-side of mdeai.co so owners + brokers + property managers can join, list, receive leads, run showings, communicate, and prove value — *all before the booking-payment system ships in Month 3*.
> **Constraint:** Native Stripe rental bookings are explicitly DEFERRED (per CHAT-CENTRAL-PLAN.md §11). This plan therefore monetises through **landlord SaaS subscription + pay-per-qualified-lead + premium AI tools + featured-listing surcharge**, not booking commissions.
> **Cross-references:** `tasks/CHAT-CENTRAL-PLAN.md` (renter-side rentals MVP), `tasks/real-estate/1-trio-real-estate-plan.md` (trio architecture), `tasks/real-estate/2-supabase-strategy.md` (canonical schema), `tasks/real-estate/10-real-estate-tasks.md` (numbered task IDs), `tasks/todo.md` (live backlog).

---

## 📑 TL;DR — One-page executive summary

| | |
|---|---|
| **What we're building** | A SaaS-style landlord workspace inside mdeai.co — onboarding wizard, listing manager, leads inbox, showing calendar, messaging, analytics, AI assistant, team management. Three account types (Individual / Agent / Property Manager) + Admin. |
| **Why now** | The renter side is shipped. Without supply, the marketplace is hollow and renter retention crumbles. Every additional landlord = ~3 listings = ~30 leads/month = revenue surface. |
| **Why not payments** | Stripe Connect + COP-friendly disbursement (Wompi) is a 4-week project on its own and adds Colombian regulatory complexity. We can monetise *first* via subscription + lead-fees, then layer payments in Month 3. |
| **Time-to-MVP** | **2 weeks** for an end-to-end "landlord can sign up → list a property → get a lead → schedule a showing" flow. **4 weeks** for the full revenue-bearing system. |
| **First-paying-landlord milestone** | Day 21 (W3 end). Target: 5 paying landlords by Day 30, 25 by Day 60, 100 by Day 90. |
| **Core moat** | (1) **Multi-source supply** scraped + deduped from FincaRaiz / Metrocuadrado / Airbnb / Facebook Groups (2) **Lead intelligence** (Hermes scores every renter inquiry 0-100 before delivering) (3) **WhatsApp-first ops** (95% of Medellín housing comms is WhatsApp; we're native-WhatsApp from day one) |
| **Rev model rank** (best → worst for our context) | 1) Pay-per-qualified-lead ($5–10/lead) · 2) Featured-listing surcharge ($25–50/mo per pinned listing) · 3) SaaS subscription tiers ($0 free / $29 pro / $99 PM) · 4) Verified-host badge ($15/yr) · 5) Premium AI add-ons ($19/mo Pricing Lab) |
| **Single biggest risk** | Cold-start supply: until we have 200+ active listings, the renter side has nothing to show and the landlord side has nothing to scale. Mitigation = aggressive scraping + agent outreach in W1–W2. |

---

## 1. Mission, Scope, Non-Goals

### Mission

Give Medellín housing supply (owners, real-estate agents, building admins, property managers) **a faster + smarter way to fill vacancies than Facebook Groups + Metrocuadrado**, with AI doing the boring work (lead triage, listing copy, showing reminders, vacancy recovery, pricing recommendations).

### In-scope (this plan)

- Three landlord account types — Individual, Real Estate Agent, Property Manager — plus Admin
- Onboarding + KYC-light verification
- Listing creation + photo upload + AI description + moderation gate
- Leads inbox + lead-scoring + auto-reply + WhatsApp routing
- Showing scheduler + reminders + no-show tracking
- In-app messaging between landlord ↔ renter
- Performance analytics per listing + portfolio
- AI Recommendations Center (price, photos, copy, vacancy recovery)
- Automation rules (configurable triggers + actions)
- Team management (PM with sub-users)
- 6 named automation flows (Lead / Showing / Listing-Stale / Vacancy / Inactive-Lead / Renewal)
- Pre-payment SaaS monetisation

### Explicitly out-of-scope (deferred)

| Feature | Why deferred | Revisit |
|---|---|---|
| Native Stripe rental bookings + Connect payouts | 4-week regulatory + COP/Wompi project | Month 3 |
| Lease e-signature (DocuSign-grade) | Click-to-sign MVP only — full e-sign is Month 4 | Month 4 |
| Property maintenance request management | Post-booking feature; needs payments first | Month 5 |
| Tenant background check (Cripto / Socure) | KYC-light suffices for inventory growth | Month 4 |
| Investor analytics ("Airbnb arbitrage") | Premium tier 4; needs paying base first | Quarter 2 |
| Multi-city expansion (Bogotá, Cartagena) | Prove Medellín first | Quarter 4 |
| Property-tour video (Remotion) | Nice but doesn't drive supply | Month 5 |

### Non-goals (won't build, even later)

- A full ERP for property management companies — we're a marketplace, not a yardi-replacement
- A traditional MLS — Latin America doesn't have one and chasing it would distract us
- A free-tier-forever model — landlords will pay for tools that fill vacancies; we should design for revenue from day 30

---

## 2. User Types + Permissions Matrix

Every authenticated user has a `profiles.account_type` discriminator. Anonymous visitors are renters by default (3-msg gate already shipped).

### 2.1 The four types

| Type | Who | Listings cap | Key capabilities | Pricing tier |
|---|---|---|---|---|
| **Individual landlord** | Owner of 1–4 properties | 4 | List own properties, view leads, schedule showings, message renters, basic analytics | Free + pay-per-lead OR $29/mo Pro |
| **Real estate agent** | Independent agent representing multiple owners | 25 | All Individual capabilities + bulk listing + agent branding + co-listed properties + commission tracking | $59/mo Agent or 10% lead-fee |
| **Property manager** | Building admins, property mgmt companies | unlimited | All Agent capabilities + team management (sub-users) + portfolio analytics + bulk pricing tools + branded landing | $99/mo PM + featured-listing pack |
| **Admin** | mdeai staff | n/a | All-listing moderation, landlord verification, dispute resolution, audit log, billing override | n/a (internal) |

### 2.2 Permissions matrix

| Capability | Individual | Agent | PM | Admin |
|---|---|---|---|---|
| Create own listing | ✓ | ✓ | ✓ | ✓ (any) |
| Edit own listing | ✓ | ✓ | ✓ | ✓ (any) |
| Delete / archive own listing | ✓ | ✓ | ✓ | ✓ (any) |
| Co-list (linked to another landlord) | — | ✓ | ✓ | ✓ |
| Submit listing for moderation | ✓ | ✓ | ✓ | bypass |
| **Approve / reject listing** | — | — | — | ✓ |
| View own leads | ✓ | ✓ | ✓ | ✓ (any) |
| Reply to leads | ✓ | ✓ | ✓ | ✓ (any) |
| **Mark lead as qualified** (triggers fee) | ✓ | ✓ | ✓ | ✓ |
| Schedule showings on own listings | ✓ | ✓ | ✓ | ✓ (any) |
| View own listing analytics | ✓ | ✓ | ✓ | ✓ (any) |
| View portfolio analytics | — | ✓ (own) | ✓ (own) | ✓ (any) |
| Bulk listing operations (price update, calendar) | — | ✓ | ✓ | ✓ |
| Add team member (sub-user) | — | — | ✓ (≤10) | ✓ (any) |
| Configure automation rules | ✓ (limited) | ✓ | ✓ | ✓ |
| Access AI Recommendations Center | Pro+ | ✓ | ✓ | ✓ |
| Access Pricing Lab (premium) | $19/mo add-on | included | included | ✓ |
| **Verify landlord identity** | — | — | — | ✓ |
| **View other landlords' data** | — | — | — | ✓ |

Permissions are enforced at three layers:

1. **RLS policies** on every landlord-owned table (listings, leads, showings, messages, payments)
2. **Edge-function role check** — `_shared/auth.ts` extracts `account_type` from JWT + `landlord_team_members` membership; rejects mismatched calls before any DB write
3. **UI route guards** — `<RoleProtectedRoute requires="landlord">` wrappers on `/host/*` routes

### 2.3 Team-member sub-roles (PM only)

Property managers can invite sub-users with one of three sub-roles:

| Sub-role | Can edit listings | Can reply to leads | Can schedule showings | Can view analytics |
|---|---|---|---|---|
| `agent` | ✓ (assigned only) | ✓ (assigned only) | ✓ (assigned only) | own only |
| `coordinator` | — | ✓ (all) | ✓ (all) | summary only |
| `admin` | ✓ (all) | ✓ (all) | ✓ (all) | full |

Stored in `landlord_team_members` table (see §4).

---

## 3. System Architecture

### 3.1 Three-tier overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       FRONTEND (React + Vite)                           │
│  /host/onboarding  /host/dashboard  /host/listings/*                    │
│  /host/leads       /host/calendar   /host/messages                      │
│  /host/analytics   /host/automations  /host/team   /host/billing        │
│  /admin/moderation /admin/landlords  /admin/audit                       │
└──────────────┬──────────────────────────────────────────────────────────┘
               │ supabase-js + @tanstack/react-query
               │ realtime channels for: leads, showings, messages
┌──────────────▼──────────────────────────────────────────────────────────┐
│                    SUPABASE EDGE FUNCTIONS (Deno)                       │
│  Onboarding:    landlord-onboarding-step                                │
│  Listings:      listing-create  listing-update  listing-moderate        │
│                 generate-listing-description  listing-photos-upload     │
│  Leads:         lead-classify  lead-score  lead-auto-reply              │
│  Showings:      showing-schedule  showing-confirm  showing-reminder-cron│
│  Messaging:     message-send  message-thread-fetch                      │
│  Analytics:     listing-metrics  portfolio-metrics                      │
│  AI:            pricing-recommend  copy-improve  vacancy-recover        │
│                 occupancy-forecast  lead-quality-batch                  │
│  Billing:       subscription-create  subscription-portal                │
│                 lead-fee-charge  featured-listing-purchase              │
│  Automation:    automation-run  automation-rule-evaluate                │
│  WhatsApp:      whatsapp-webhook  whatsapp-send                         │
└──────────────┬──────────────────────────────────────────────────────────┘
               │ Postgres + RLS
┌──────────────▼──────────────────────────────────────────────────────────┐
│                     POSTGRES (Supabase)                                 │
│  Landlord:   landlord_profiles  landlord_team_members                   │
│              landlord_subscriptions  landlord_billing_events            │
│  Inventory:  apartments(EXTENDED)  listing_photos  listing_amenities    │
│              listing_availability  featured_listings                    │
│  Pipeline:   leads  lead_scores  lead_events  showings                  │
│              messages  message_threads                                  │
│  Intelligence: pricing_history  occupancy_history                       │
│              ai_recommendations  automation_rules  automation_runs      │
│  Trust:      verification_status  verification_documents  audit_log     │
│  Existing:   profiles  conversations  saved_places  trips  trip_items   │
│              outbound_clicks  apartment_save_counts (RPC)               │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              │ external integrations
                              ▼
              Infobip (WhatsApp Business) · Stripe Billing (subscription only)
              Google Maps (places + geocoding) · Gemini (3 Flash + 3.1 Pro)
              PostHog (events + funnel) · Sentry (errors)
              Firecrawl (multi-source scraping — supply ingestion)
```

### 3.2 Auth flow (signup → role → dashboard)

```
[/signup] → AccountTypeStep (renter | landlord)
              │
              ├── renter   → existing /chat?send=pending flow (unchanged)
              └── landlord → AccountKindStep (individual | agent | pm)
                              │
                              ▼
                     POST /signup → Supabase Auth user row
                              │
                              ▼
                  TRIGGER auto-create row in:
                  • profiles (account_type = 'landlord')
                  • landlord_profiles (verification_status = 'pending')
                              │
                              ▼
                  [Redirect to /host/onboarding]
                              │
                  ┌───────────┴────────────┐
                  ▼                        ▼
          Step1 Basic              Step2 Business
          (name, phone, WA)        (RUT/NIT, address)
                                          │
                                          ▼
                                  Step3 Verification
                                  (ID + ownership proof
                                   uploaded to private
                                   identity-docs bucket)
                                          │
                                          ▼
                                  Step4 First Listing OR
                                  Skip → /host/dashboard
                                          │
                                          ▼
                          Admin reviews verification (within 24h)
                                          │
                          ┌───────────────┴────────────────┐
                          ▼                                ▼
                 verified = true                  verified = false
                          │                                │
                          ▼                                ▼
                Listings can publish          Listings stay in
                + verified badge              "pending verification"
                                              + admin notes shown
```

### 3.3 Single-source-of-truth conventions

- **Listings are owned by `landlord_profiles.id`, NOT `auth.users.id`** — this lets agents/PMs co-list and lets us transfer ownership when a landlord upgrades from Individual → Agent
- **Every action is auditable** — `audit_log` row inserted via DB trigger on every write to `apartments`, `leads`, `showings`, `messages`, `verification_status`. Read-only via service role.
- **AI recommendations are cached, not regenerated on each view** — `ai_recommendations` table with `expires_at`. The Recommendations Center reads from cache + triggers regeneration via background edge fn.
- **Realtime is opt-in** — leads inbox + messages use Supabase Realtime; analytics + reports are query-on-demand.

---

## 4. Database Schema

Full DDL below. All tables use `gen_random_uuid()` PKs, `timestamptz` for time, RLS enabled. Foreign keys use `ON DELETE CASCADE` where ownership is real, `ON DELETE SET NULL` where reference is informational.

### 4.1 Account & identity tables

#### `landlord_profiles`

```sql
CREATE TABLE public.landlord_profiles (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  kind                  text NOT NULL CHECK (kind IN ('individual', 'agent', 'property_manager')),
  display_name          text NOT NULL,
  business_name         text,
  rut_nit               text,                          -- Colombian tax ID
  phone_e164            text,
  whatsapp_e164         text,
  languages             text[] DEFAULT ARRAY['es']::text[],
  bio                   text,
  avatar_url            text,
  cover_photo_url       text,
  primary_neighborhood  text,
  total_listings        integer DEFAULT 0,
  active_listings       integer DEFAULT 0,
  response_rate_pct     numeric(5,2),
  response_time_minutes integer,
  verification_status   text NOT NULL DEFAULT 'pending'
                        CHECK (verification_status IN ('pending','in_review','approved','rejected','expired')),
  verified_at           timestamptz,
  verified_by           uuid REFERENCES auth.users(id),
  rejection_reason      text,
  -- Subscription (filled by landlord-billing layer; null until subscribed)
  subscription_tier     text CHECK (subscription_tier IN ('free','pro','agent','pm')),
  subscription_status   text CHECK (subscription_status IN ('active','past_due','canceled','trialing')),
  subscription_id       text,                          -- Stripe subscription id
  trial_ends_at         timestamptz,
  -- Payouts (deferred to F3 — leave nullable now, schema-locked)
  payout_bank_name      text,
  payout_account_last4  text,
  payout_currency       text CHECK (payout_currency IN ('COP','USD')),
  -- Lead-fee / commission overrides
  pay_per_lead_cents    integer,                       -- override of platform default
  commission_rate       numeric(5,4) DEFAULT 0.12,     -- locked for booking-payment phase
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX landlord_profiles_user_idx ON landlord_profiles(user_id);
CREATE INDEX landlord_profiles_status_idx ON landlord_profiles(verification_status)
  WHERE verification_status IN ('pending','in_review');
CREATE INDEX landlord_profiles_active_idx ON landlord_profiles(active_listings DESC)
  WHERE verification_status = 'approved';
```

RLS: landlord can SELECT/UPDATE own; admin can do anything; public can SELECT a SUBSET (display_name, avatar_url, bio, total_listings, response_*) via a security-definer view `public.landlord_profiles_public`.

#### `landlord_team_members`

```sql
CREATE TABLE public.landlord_team_members (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id       uuid NOT NULL REFERENCES landlord_profiles(id) ON DELETE CASCADE,
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sub_role          text NOT NULL CHECK (sub_role IN ('agent','coordinator','admin')),
  invited_by        uuid REFERENCES auth.users(id),
  invited_at        timestamptz NOT NULL DEFAULT now(),
  accepted_at       timestamptz,
  status            text NOT NULL DEFAULT 'invited'
                    CHECK (status IN ('invited','active','suspended','removed')),
  permissions       jsonb DEFAULT '{}',                -- per-listing scoping
  UNIQUE (landlord_id, user_id)
);

CREATE INDEX landlord_team_user_idx ON landlord_team_members(user_id);
CREATE INDEX landlord_team_landlord_idx ON landlord_team_members(landlord_id);
```

#### `landlord_subscriptions`

```sql
CREATE TABLE public.landlord_subscriptions (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id              uuid NOT NULL REFERENCES landlord_profiles(id) ON DELETE CASCADE,
  tier                     text NOT NULL CHECK (tier IN ('free','pro','agent','pm')),
  status                   text NOT NULL CHECK (status IN ('trialing','active','past_due','canceled')),
  stripe_customer_id       text,
  stripe_subscription_id   text UNIQUE,
  current_period_start     timestamptz,
  current_period_end       timestamptz,
  trial_ends_at            timestamptz,
  cancel_at_period_end     boolean DEFAULT false,
  canceled_at              timestamptz,
  monthly_amount_cents     integer NOT NULL,
  currency                 text NOT NULL DEFAULT 'USD',
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX landlord_subscriptions_landlord_idx ON landlord_subscriptions(landlord_id);
CREATE INDEX landlord_subscriptions_status_idx ON landlord_subscriptions(status)
  WHERE status IN ('active','trialing');
```

### 4.2 Inventory tables (apartments + extensions)

The existing `apartments` table gets extended (NOT replaced). New columns:

```sql
ALTER TABLE public.apartments
  ADD COLUMN IF NOT EXISTS landlord_id uuid REFERENCES landlord_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'pending'
    CHECK (moderation_status IN ('pending','approved','rejected','archived')),
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS lease_status text NOT NULL DEFAULT 'available'
    CHECK (lease_status IN ('available','reserved','showing','application','leased','off_market')),
  ADD COLUMN IF NOT EXISTS current_tenant_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual'
    CHECK (source IN ('manual','firecrawl_fincaraiz','firecrawl_metrocuadrado',
                      'firecrawl_airbnb','firecrawl_facebook','api')),
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS embedding vector(1536),     -- Gemini embedding for semantic search
  ADD COLUMN IF NOT EXISTS view_count_30d integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS save_count_30d integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lead_count_30d integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS days_on_market integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_price_change_at timestamptz,
  ADD COLUMN IF NOT EXISTS featured_until timestamptz;

CREATE INDEX IF NOT EXISTS apartments_landlord_idx ON apartments(landlord_id)
  WHERE landlord_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS apartments_moderation_idx ON apartments(moderation_status, created_at DESC);
CREATE INDEX IF NOT EXISTS apartments_lease_status_idx ON apartments(lease_status)
  WHERE moderation_status = 'approved';
CREATE INDEX IF NOT EXISTS apartments_featured_idx ON apartments(featured_until DESC NULLS LAST)
  WHERE featured_until > now();
CREATE INDEX IF NOT EXISTS apartments_embedding_idx ON apartments
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

#### `listing_photos`

```sql
CREATE TABLE public.listing_photos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id  uuid NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  storage_path  text NOT NULL,                        -- "<landlord_id>/<apartment_id>/<uuid>.webp"
  url           text NOT NULL,
  width         integer,
  height        integer,
  bytes         integer,
  is_primary    boolean DEFAULT false,
  display_order integer DEFAULT 0,
  alt_text      text,
  ai_quality_score numeric(3,2),                      -- 0.00–1.00 (Gemini Flash auto-scored)
  ai_categories text[],                               -- ["bedroom","kitchen","exterior","view"]
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX listing_photos_apartment_idx ON listing_photos(apartment_id, display_order);
CREATE UNIQUE INDEX listing_photos_primary_idx ON listing_photos(apartment_id) WHERE is_primary;
```

#### `listing_availability`

```sql
CREATE TABLE public.listing_availability (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id      uuid NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  -- Either weekly slot OR specific date range — XOR enforced via CHECK below
  day_of_week       integer CHECK (day_of_week BETWEEN 0 AND 6),
  start_time        time,
  end_time          time,
  date_range        daterange,
  is_available      boolean DEFAULT true,
  reason            text,                            -- 'maintenance' / 'showing' / 'leased'
  created_at        timestamptz NOT NULL DEFAULT now(),
  CHECK ((day_of_week IS NOT NULL AND date_range IS NULL)
       OR (day_of_week IS NULL AND date_range IS NOT NULL))
);

CREATE INDEX listing_availability_apt_idx ON listing_availability(apartment_id);
```

#### `featured_listings`

```sql
CREATE TABLE public.featured_listings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id    uuid NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  landlord_id     uuid NOT NULL REFERENCES landlord_profiles(id) ON DELETE CASCADE,
  starts_at       timestamptz NOT NULL,
  ends_at         timestamptz NOT NULL,
  amount_cents    integer NOT NULL,
  currency        text NOT NULL DEFAULT 'USD',
  payment_id      text,                              -- Stripe charge id
  position        text NOT NULL CHECK (position IN ('top_of_search','neighborhood_pin','homepage')),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX featured_listings_active_idx ON featured_listings(apartment_id, ends_at DESC)
  WHERE ends_at > now();
```

### 4.3 Pipeline tables (leads, showings, messages)

#### `leads`

```sql
CREATE TABLE public.leads (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Source channel
  channel           text NOT NULL CHECK (channel IN ('chat','whatsapp','form','phone','email','admin_manual')),
  conversation_id   uuid REFERENCES conversations(id) ON DELETE SET NULL,
  -- Renter side (nullable — anon leads OK)
  renter_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  renter_name       text,
  renter_phone_e164 text,
  renter_whatsapp_e164 text,
  renter_email      text,
  -- Listing side (nullable — could be unmatched lead)
  apartment_id      uuid REFERENCES apartments(id) ON DELETE SET NULL,
  landlord_id       uuid REFERENCES landlord_profiles(id) ON DELETE SET NULL,
  -- Inquiry payload
  raw_message       text NOT NULL,
  structured_profile jsonb DEFAULT '{}',  -- {budget_min, budget_max, move_in, stay_months, neighborhood, bedrooms, pets, ...}
  source_intent     text CHECK (source_intent IN ('explore','book','schedule','question')),
  -- AI scoring
  quality_score     numeric(3,2),                    -- 0.00–1.00 (Hermes lead-scoring skill)
  quality_factors   jsonb DEFAULT '{}',
  classified_at     timestamptz,
  -- Pipeline status
  status            text NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new','assigned','contacted','qualified','converted','archived','spam')),
  assigned_to       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at       timestamptz,
  first_response_at timestamptz,
  qualified_at      timestamptz,                     -- becomes billable
  qualified_by      uuid REFERENCES auth.users(id),
  converted_to_booking_id uuid,                      -- forward-ref to bookings (Month 3)
  archived_at       timestamptz,
  archived_reason   text,
  -- Billing (pay-per-qualified-lead)
  fee_charged       boolean DEFAULT false,
  fee_amount_cents  integer,
  fee_charged_at    timestamptz,
  fee_invoice_id    text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX leads_landlord_status_idx ON leads(landlord_id, status, created_at DESC);
CREATE INDEX leads_apartment_idx ON leads(apartment_id, created_at DESC) WHERE apartment_id IS NOT NULL;
CREATE INDEX leads_unassigned_idx ON leads(created_at DESC) WHERE status = 'new' AND assigned_to IS NULL;
CREATE INDEX leads_renter_idx ON leads(renter_id, created_at DESC) WHERE renter_id IS NOT NULL;
CREATE INDEX leads_qualified_idx ON leads(qualified_at DESC NULLS LAST) WHERE qualified_at IS NOT NULL;
```

#### `lead_scores` (history of scoring runs)

```sql
CREATE TABLE public.lead_scores (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  scored_by       text NOT NULL,                     -- 'hermes_lead_scoring_v1' / 'manual_admin'
  score           numeric(3,2) NOT NULL,
  factors         jsonb NOT NULL,                    -- {budget_realism: 0.8, urgency: 0.9, ...}
  model_version   text,
  tokens_used     integer,
  duration_ms     integer,
  scored_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX lead_scores_lead_idx ON lead_scores(lead_id, scored_at DESC);
```

#### `lead_events` (audit + analytics)

```sql
CREATE TABLE public.lead_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  event_type      text NOT NULL CHECK (event_type IN (
                    'created','classified','scored','assigned','message_sent','message_received',
                    'showing_scheduled','showing_completed','showing_no_show',
                    'qualified','converted','archived','spam_marked','reopened',
                    'auto_replied','reminder_sent','escalated_to_human'
                  )),
  actor_user_id   uuid REFERENCES auth.users(id),
  actor_kind      text CHECK (actor_kind IN ('renter','landlord','admin','system','ai')),
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX lead_events_lead_idx ON lead_events(lead_id, created_at DESC);
CREATE INDEX lead_events_type_idx ON lead_events(event_type, created_at DESC);
```

#### `showings`

```sql
CREATE TABLE public.showings (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id           uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  apartment_id      uuid NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  landlord_id       uuid NOT NULL REFERENCES landlord_profiles(id) ON DELETE CASCADE,
  renter_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Slot
  scheduled_at      timestamptz NOT NULL,
  duration_minutes  integer DEFAULT 30,
  timezone          text DEFAULT 'America/Bogota',
  -- Logistics
  meeting_kind      text NOT NULL DEFAULT 'in_person' CHECK (meeting_kind IN ('in_person','virtual')),
  meeting_url       text,
  meeting_address   text,
  notes             text,
  -- Status
  status            text NOT NULL DEFAULT 'proposed'
                    CHECK (status IN ('proposed','confirmed','rescheduled','completed','no_show','canceled')),
  confirmed_at      timestamptz,
  completed_at      timestamptz,
  no_show_at        timestamptz,
  no_show_party     text CHECK (no_show_party IN ('renter','landlord','both')),
  -- Reminder tracking
  reminder_24h_sent_at timestamptz,
  reminder_3h_sent_at  timestamptz,
  reminder_30m_sent_at timestamptz,
  -- Post-showing feedback
  renter_rating     integer CHECK (renter_rating BETWEEN 1 AND 5),
  renter_feedback   text,
  landlord_rating   integer CHECK (landlord_rating BETWEEN 1 AND 5),
  landlord_feedback text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX showings_landlord_idx ON showings(landlord_id, scheduled_at DESC);
CREATE INDEX showings_renter_idx ON showings(renter_id, scheduled_at DESC) WHERE renter_id IS NOT NULL;
CREATE INDEX showings_upcoming_idx ON showings(scheduled_at) WHERE status IN ('proposed','confirmed');
```

#### `message_threads` and `landlord_messages`

```sql
CREATE TABLE public.message_threads (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id    uuid REFERENCES apartments(id) ON DELETE SET NULL,
  lead_id         uuid REFERENCES leads(id) ON DELETE SET NULL,
  landlord_id     uuid NOT NULL REFERENCES landlord_profiles(id) ON DELETE CASCADE,
  renter_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  renter_phone_e164 text,                            -- for WhatsApp-only threads
  channel         text NOT NULL CHECK (channel IN ('in_app','whatsapp','email')),
  subject         text,
  status          text NOT NULL DEFAULT 'open' CHECK (status IN ('open','archived','blocked')),
  last_message_at timestamptz,
  unread_count_landlord integer DEFAULT 0,
  unread_count_renter   integer DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX message_threads_landlord_idx ON message_threads(landlord_id, last_message_at DESC NULLS LAST);
CREATE INDEX message_threads_renter_idx ON message_threads(renter_id, last_message_at DESC NULLS LAST)
  WHERE renter_id IS NOT NULL;

CREATE TABLE public.landlord_messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id       uuid NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  sender_user_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_kind     text NOT NULL CHECK (sender_kind IN ('landlord','renter','ai_auto_reply','admin','system')),
  body            text NOT NULL,
  attachments     jsonb DEFAULT '[]',                -- [{url, kind:'image|pdf', size}]
  whatsapp_message_id text,                          -- when channel = 'whatsapp'
  read_at         timestamptz,
  ai_classification jsonb,                           -- {sentiment, urgency, topic}
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX landlord_messages_thread_idx ON landlord_messages(thread_id, created_at);
CREATE INDEX landlord_messages_unread_idx ON landlord_messages(thread_id, created_at) WHERE read_at IS NULL;
```

### 4.4 Intelligence + automation tables

#### `pricing_history`, `occupancy_history`

```sql
CREATE TABLE public.pricing_history (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id    uuid NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  changed_by      uuid REFERENCES auth.users(id),
  change_kind     text NOT NULL CHECK (change_kind IN ('manual','ai_suggestion_accepted','seasonal_auto','market_adjust')),
  old_price_monthly numeric(12,2),
  new_price_monthly numeric(12,2),
  old_price_daily   numeric(12,2),
  new_price_daily   numeric(12,2),
  ai_recommendation_id uuid,
  reason          text,
  market_context  jsonb,                             -- {comp_avg, comp_median, comp_count, percentile}
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX pricing_history_apt_idx ON pricing_history(apartment_id, created_at DESC);

CREATE TABLE public.occupancy_history (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id    uuid NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
  start_date      date NOT NULL,
  end_date        date,                              -- null = currently occupied
  status          text NOT NULL CHECK (status IN ('vacant','occupied','reserved','off_market')),
  tenant_id       uuid REFERENCES auth.users(id),
  monthly_rate    numeric(12,2),
  source_lead_id  uuid REFERENCES leads(id),
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX occupancy_history_apt_idx ON occupancy_history(apartment_id, start_date DESC);
CREATE INDEX occupancy_history_current_idx ON occupancy_history(apartment_id) WHERE end_date IS NULL;
```

#### `ai_recommendations`

```sql
CREATE TABLE public.ai_recommendations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  apartment_id    uuid REFERENCES apartments(id) ON DELETE CASCADE,
  landlord_id     uuid REFERENCES landlord_profiles(id) ON DELETE CASCADE,
  kind            text NOT NULL CHECK (kind IN (
                    'pricing','copy','photo','title','availability',
                    'vacancy_recovery','renewal','featured_pitch','automation_tune'
                  )),
  severity        text NOT NULL CHECK (severity IN ('info','suggestion','warning','urgent')),
  title           text NOT NULL,
  body            text NOT NULL,
  diff            jsonb,                             -- before/after suggested values
  confidence      numeric(3,2),
  source_signals  jsonb,                             -- {market_data, listing_metrics, comparable_ids}
  applied_at      timestamptz,
  applied_by      uuid REFERENCES auth.users(id),
  dismissed_at    timestamptz,
  dismissed_by    uuid REFERENCES auth.users(id),
  expires_at      timestamptz NOT NULL,
  generated_by    text NOT NULL,                     -- 'hermes_pricing_v1' / 'gemini_copy_v2'
  tokens_used     integer,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ai_recommendations_apt_active_idx ON ai_recommendations(apartment_id, severity, expires_at DESC)
  WHERE applied_at IS NULL AND dismissed_at IS NULL AND expires_at > now();
CREATE INDEX ai_recommendations_landlord_active_idx ON ai_recommendations(landlord_id, severity, created_at DESC)
  WHERE applied_at IS NULL AND dismissed_at IS NULL AND expires_at > now();
```

#### `automation_rules`, `automation_runs`

```sql
CREATE TABLE public.automation_rules (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id     uuid NOT NULL REFERENCES landlord_profiles(id) ON DELETE CASCADE,
  name            text NOT NULL,
  flow            text NOT NULL CHECK (flow IN (
                    'lead','showing','listing_stale','vacancy','inactive_lead','renewal'
                  )),
  trigger_condition jsonb NOT NULL,                  -- {hours_inactive: 48, score_min: 0.6, ...}
  action          jsonb NOT NULL,                    -- {type:'send_whatsapp', template_id:'...', ...}
  enabled         boolean DEFAULT true,
  requires_approval boolean DEFAULT false,           -- if true, action queued not executed
  last_run_at     timestamptz,
  total_runs      integer DEFAULT 0,
  total_successes integer DEFAULT 0,
  total_failures  integer DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX automation_rules_enabled_idx ON automation_rules(landlord_id, flow) WHERE enabled;

CREATE TABLE public.automation_runs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id         uuid REFERENCES automation_rules(id) ON DELETE SET NULL,
  flow            text NOT NULL,
  trigger_payload jsonb NOT NULL,
  status          text NOT NULL CHECK (status IN ('running','succeeded','failed','approved_pending','rejected')),
  action_taken    jsonb,
  target_lead_id  uuid REFERENCES leads(id) ON DELETE SET NULL,
  target_apartment_id uuid REFERENCES apartments(id) ON DELETE SET NULL,
  target_showing_id uuid REFERENCES showings(id) ON DELETE SET NULL,
  error_message   text,
  duration_ms     integer,
  approved_by     uuid REFERENCES auth.users(id),
  approved_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX automation_runs_rule_idx ON automation_runs(rule_id, created_at DESC);
CREATE INDEX automation_runs_pending_approval_idx ON automation_runs(created_at DESC)
  WHERE status = 'approved_pending';
```

### 4.5 Trust + audit tables

```sql
CREATE TABLE public.verification_documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id     uuid NOT NULL REFERENCES landlord_profiles(id) ON DELETE CASCADE,
  doc_kind        text NOT NULL CHECK (doc_kind IN (
                    'national_id','passport','rut','property_deed','utility_bill','power_of_attorney'
                  )),
  storage_path    text NOT NULL,                     -- private bucket
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected','expired')),
  reviewed_by     uuid REFERENCES auth.users(id),
  reviewed_at     timestamptz,
  rejection_reason text,
  expires_at      timestamptz,                       -- 90-day TTL on ID docs
  uploaded_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX verification_documents_landlord_idx ON verification_documents(landlord_id);

CREATE TABLE public.audit_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_kind      text NOT NULL CHECK (actor_kind IN ('user','admin','system','ai_agent')),
  table_name      text NOT NULL,
  row_id          uuid,
  action          text NOT NULL CHECK (action IN ('insert','update','delete','approve','reject','soft_delete')),
  old_values      jsonb,
  new_values      jsonb,
  request_ip      text,
  request_user_agent text,
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_log_table_row_idx ON audit_log(table_name, row_id, created_at DESC);
CREATE INDEX audit_log_actor_idx ON audit_log(actor_user_id, created_at DESC) WHERE actor_user_id IS NOT NULL;
-- 90-day retention enforced via pg_cron daily delete
```

### 4.6 Triggers + helper functions

```sql
-- Auto-touch updated_at on every UPDATE
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- Apply to every table with updated_at
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT table_name FROM information_schema.columns
    WHERE table_schema='public' AND column_name='updated_at'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS touch_updated_at ON public.%I', r.table_name);
    EXECUTE format('CREATE TRIGGER touch_updated_at BEFORE UPDATE ON public.%I
                    FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at()', r.table_name);
  END LOOP;
END $$;

-- Helper: returns set of landlord_ids that auth.uid() can act on
CREATE OR REPLACE FUNCTION public.acting_landlord_ids() RETURNS setof uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM landlord_profiles WHERE user_id = (SELECT auth.uid())
  UNION
  SELECT landlord_id FROM landlord_team_members
  WHERE user_id = (SELECT auth.uid()) AND status = 'active';
$$;

-- Sync apartments.lease_status when occupancy_history changes
CREATE OR REPLACE FUNCTION public.sync_apartment_lease_status() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE apartments SET
    lease_status = CASE
      WHEN NEW.status = 'occupied' AND NEW.end_date IS NULL THEN 'leased'
      WHEN NEW.status = 'vacant' THEN 'available'
      WHEN NEW.status = 'reserved' THEN 'reserved'
      WHEN NEW.status = 'off_market' THEN 'off_market'
    END,
    current_tenant_id = CASE WHEN NEW.status = 'occupied' THEN NEW.tenant_id ELSE NULL END
  WHERE id = NEW.apartment_id;
  RETURN NEW;
END $$;
```

### 4.7 RLS policy patterns

Generic pattern — landlord can SELECT/UPDATE rows where `landlord_id` matches a landlord they own (direct or via team membership):

```sql
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY leads_landlord_select ON leads FOR SELECT
  USING (landlord_id IN (SELECT acting_landlord_ids()) OR renter_id = (SELECT auth.uid()));
CREATE POLICY leads_landlord_update ON leads FOR UPDATE
  USING (landlord_id IN (SELECT acting_landlord_ids()))
  WITH CHECK (landlord_id IN (SELECT acting_landlord_ids()));

-- Service role bypass — admins via _shared/role-check.ts assert account_type = 'admin'
```

---

## 5. Edge Functions Catalog

30 functions across 9 categories. Each gets `verify_jwt: true` (admin functions add server-side `account_type='admin'` check), Zod schema, rate limit per `_shared/rate-limit.ts`, structured response via `_shared/http.ts`.

| # | Function | Category | Purpose | RBAC |
|---|---|---|---|---|
| 1 | `landlord-onboarding-step` | Onboarding | Persist a step's data + advance state | landlord (own) |
| 2 | `verification-submit` | Onboarding | Receive uploaded docs, set `in_review`, notify admin | landlord (own) |
| 3 | `verification-decide` | Onboarding | Admin approves/rejects landlord | admin |
| 4 | `listing-create` | Listings | Insert apartment row + trigger moderation | landlord |
| 5 | `listing-update` | Listings | Edit apartment + re-trigger moderation if photos/address changed | landlord (own) |
| 6 | `listing-moderate` | Listings | Admin approves/rejects listing | admin |
| 7 | `generate-listing-description` | Listings | Gemini Flash given photos+specs → suggested copy | landlord (own) |
| 8 | `listing-photo-upload-sign` | Listings | Pre-signed URL for direct-to-Storage upload + AI quality scoring | landlord (own) |
| 9 | `lead-classify` | Leads | Parse raw_message → structured_profile | system (cron) + on-write trigger |
| 10 | `lead-score` | Leads | Hermes lead-quality skill | system (cron) |
| 11 | `lead-auto-reply` | Leads | Generate + (optionally) send first reply via WhatsApp/in-app | landlord (rule-driven) |
| 12 | `lead-mark-qualified` | Leads | Landlord clicks "qualified" → triggers fee-charge in Pro+ | landlord (own) |
| 13 | `showing-schedule` | Showings | Create showing + send confirmations | landlord OR renter |
| 14 | `showing-confirm` | Showings | Confirm slot from email/WhatsApp link | renter (anon-token) OR landlord |
| 15 | `showing-reminder-cron` | Showings | pg_cron every 5 min → send T-24/T-3/T-30 reminders | system |
| 16 | `message-send` | Messages | Insert message + fan-out to channel (in-app realtime / WhatsApp / email) | landlord OR renter |
| 17 | `whatsapp-webhook` | Messages | Infobip → mdeai inbound; route to ai-chat or message thread | system (signed) |
| 18 | `whatsapp-send` | Messages | Outbound WhatsApp via Infobip API | system (rule-driven) |
| 19 | `listing-metrics` | Analytics | Aggregate per-listing stats from `lead_events` + saved_places + view tracking | landlord (own) |
| 20 | `portfolio-metrics` | Analytics | Roll-up across all listings of a landlord | landlord (own) |
| 21 | `pricing-recommend` | AI | Compare against `competitor_listings` + `market_snapshots` → suggest price | landlord (Pro+) |
| 22 | `copy-improve` | AI | Hermes audit: photo balance, description completeness, title hook | landlord (own) |
| 23 | `vacancy-recover` | AI | Apartment vacant ≥21d → generate recovery plan (price/photos/copy/featured) | landlord (own) |
| 24 | `occupancy-forecast` | AI | Forecast next-30/60/90-day occupancy from history + market_snapshots | landlord (Pro+) |
| 25 | `subscription-create` | Billing | Stripe Checkout for SaaS tier | landlord |
| 26 | `subscription-portal` | Billing | Stripe Billing Portal session URL | landlord (own) |
| 27 | `lead-fee-charge` | Billing | Charge pay-per-qualified-lead via Stripe Invoice Item | system |
| 28 | `featured-listing-purchase` | Billing | Stripe Checkout for featured slot | landlord (own) |
| 29 | `automation-rule-evaluate` | Automation | pg_cron every 5 min → evaluate all enabled rules → emit runs | system |
| 30 | `automation-run-execute` | Automation | Execute the action of a rule (or queue for approval) | system |

All functions emit structured logs to `audit_log` + `ai_runs` (for AI-bearing ones).

---

## 6. Frontend Pages + Routes

The landlord workspace lives under `/host/*`; admin moderation under `/admin/*` (already partially scaffolded).

### 6.1 Routes inventory

| Route | Access | Page component | Notes |
|---|---|---|---|
| `/signup` | public | `pages/Signup.tsx` (extend) | Add account-type toggle |
| `/host/onboarding` | landlord (any state) | `pages/host/Onboarding.tsx` | 4-step wizard |
| `/host/dashboard` | landlord (verified) | `pages/host/Dashboard.tsx` | Workspace shell (3-panel) |
| `/host/listings` | landlord | `pages/host/Listings.tsx` | Listing index |
| `/host/listings/new` | landlord | `pages/host/ListingNew.tsx` | 6-step wizard |
| `/host/listings/:id` | landlord (own) | `pages/host/ListingEdit.tsx` | Edit + metrics + AI panel |
| `/host/leads` | landlord | `pages/host/Leads.tsx` | CRM inbox |
| `/host/leads/:id` | landlord (own) | `pages/host/LeadDetail.tsx` | Detail + thread + actions |
| `/host/calendar` | landlord | `pages/host/Calendar.tsx` | Showings calendar (week/day) |
| `/host/messages` | landlord | `pages/host/Messages.tsx` | Unified inbox (in-app + WA) |
| `/host/messages/:threadId` | landlord (own) | `pages/host/MessageThread.tsx` | Thread view |
| `/host/analytics` | landlord (Pro+) | `pages/host/Analytics.tsx` | Charts + KPIs |
| `/host/recommendations` | landlord | `pages/host/Recommendations.tsx` | AI center |
| `/host/automations` | landlord (Pro+) | `pages/host/Automations.tsx` | Rules editor |
| `/host/team` | PM only | `pages/host/Team.tsx` | Sub-user management |
| `/host/billing` | landlord (own) | `pages/host/Billing.tsx` | Plan + invoices |
| `/host/profile` | landlord | `pages/host/Profile.tsx` | Public profile editor |
| `/hosts/:landlordId` | public | `pages/HostProfile.tsx` | Public profile page |
| `/admin/moderation` | admin | `pages/admin/Moderation.tsx` | Listings + landlords queue |
| `/admin/landlords` | admin | `pages/admin/Landlords.tsx` | Landlord directory |
| `/admin/audit` | admin | `pages/admin/Audit.tsx` | Audit log viewer |

### 6.2 Component tree (host workspace)

```
src/
  pages/host/                       (16 files — see routes table)
  components/host/
    layout/
      HostShell.tsx                 ─ 3-panel landlord workspace
      HostLeftNav.tsx               ─ "Listings · Leads · Calendar · Messages..."
      HostHeader.tsx                ─ landlord name + verification badge
      HostMobileNav.tsx             ─ bottom nav on mobile
      RoleProtectedRoute.tsx        ─ wraps each /host/* route
    onboarding/
      Step1BasicInfo.tsx
      Step2BusinessInfo.tsx
      Step3Verification.tsx
      Step4Welcome.tsx
      OnboardingProgress.tsx        ─ stepper + state persistence
    listing/
      ListingCard.tsx               ─ index card with mini-metrics
      ListingForm/Step1Address..6Description.tsx
      ListingPreview.tsx            ─ what renters will see
      ListingMetricsRow.tsx         ─ inline mini-row "12 views · 3 inquiries..."
      AIRecommendationsPanel.tsx    ─ live recommendations for this listing
    leads/
      LeadCard.tsx                  ─ score badge + intro + budget + age
      LeadFilters.tsx               ─ status + score + neighborhood + recency
      LeadDetailPanel.tsx           ─ structured profile + thread + actions
      QualifyButton.tsx             ─ + fee-disclosure modal in Pro+
      AutoReplyComposer.tsx         ─ Gemini-drafted first reply with edit
    calendar/
      CalendarWeekView.tsx
      CalendarDayView.tsx
      ShowingForm.tsx               ─ schedule new showing
      ShowingCard.tsx
      AvailabilityEditor.tsx        ─ weekly recurring slots
    messages/
      ThreadList.tsx
      Thread.tsx
      MessageComposer.tsx
      WhatsAppBadge.tsx             ─ "via WhatsApp" indicator
    analytics/
      KPIBar.tsx                    ─ revenue, occupancy, response rate
      PortfolioOccupancyChart.tsx
      ListingPerformanceTable.tsx
      LeadFunnelChart.tsx
    recommendations/
      RecommendationCard.tsx
      RecommendationFilter.tsx      ─ by kind / severity
      RecommendationDiff.tsx        ─ before/after preview
    automations/
      RuleCard.tsx
      RuleEditor.tsx                ─ trigger + condition + action builder
      AutomationRunHistory.tsx
    team/
      TeamMemberCard.tsx
      InviteTeamMemberModal.tsx
      PermissionsEditor.tsx
    billing/
      PlanCard.tsx                  ─ Free / Pro / Agent / PM
      UpgradeButton.tsx
      InvoicesTable.tsx
      LeadFeesTable.tsx
```

### 6.3 Reusable layout (HostShell)

```
┌───────────────────────────────────────────────────────────────────────┐
│ HostHeader  [logo] [verified ✓] [Maria H.]  [🔔 3]  [⚙ profile]      │
├───────────┬───────────────────────────────────────────────┬───────────┤
│ HostLeft  │                                               │ Right     │
│ Nav       │      Main content (route outlet)              │ context   │
│           │                                               │ panel     │
│ ▣ Dash    │                                               │ (e.g.     │
│ ▣ Listings│                                               │  AI recs  │
│ ▣ Leads   │                                               │  for sel- │
│ ▣ Calendar│                                               │  ected    │
│ ▣ Messages│                                               │  listing) │
│ ▣ Analytics                                               │           │
│ ▣ AI Recs │                                               │           │
│ ▣ Auto-   │                                               │           │
│   mations │                                               │           │
│ ▣ Team    │                                               │           │
│ ▣ Billing │                                               │           │
└───────────┴───────────────────────────────────────────────┴───────────┘
                                                       (Mobile: bottom nav)
```

### 6.4 UX patterns

- **Wizards** persist progress to row.session_data — closing tab mid-flow restores on return
- **Empty states** are first-class — every list view has a CTA-driven empty state ("No leads yet — share this listing on WhatsApp ↗")
- **Confirmations** before irreversible actions (archive listing, mark lead spam, cancel showing)
- **Optimistic updates** with rollback on failure (already established pattern from save/add-to-trip)
- **Realtime opt-in** — leads inbox + messages auto-refresh; analytics/reports stay query-on-demand
- **Mobile-first** — 60% of Medellín landlords manage from WhatsApp + phone; every page has a mobile-acceptable layout
- **Spanish-first copy** — primary language is `es`, English is secondary; toggle in header

---

## 7. AI Features (Core + Advanced)

Each feature scored on 5 axes 0–100. **ROI** = (impact × adoption probability) ÷ build cost. **Difficulty** = engineering effort + ML risk. **Speed** = days to ship MVP. **Revenue** = direct $/landlord/month uplift (Pro+ tier driver). **Retention** = effect on landlord churn reduction.

### 7.1 Core AI features (Phase 1 — must-ship for revenue tiering)

| # | Feature | What it does | ROI | Difficulty | Speed | Revenue | Retention | Priority |
|---|---|---|---:|---:|---:|---:|---:|---:|
| 1 | **AI lead scoring (Hermes)** | Score 0–100 every new lead by completeness, urgency, budget realism, listing match, prior-history signal | 95 | 35 | 90 | 70 | 80 | **P0** |
| 2 | **Auto-reply to inquiries** | Gemini-drafted first reply within 60s of lead arrival; landlord edits + sends | 92 | 30 | 95 | 60 | 90 | **P0** |
| 3 | **Listing description generator** | Photos + specs → 150-word EN + ES description | 88 | 25 | 95 | 50 | 60 | **P0** |
| 4 | **Title optimisation** | Suggest 3 alternative listing titles ranked by predicted CTR | 78 | 20 | 95 | 30 | 40 | **P1** |
| 5 | **Photo quality scoring** | Auto-score every uploaded photo (resolution, framing, lighting); flag low-quality before publish | 75 | 35 | 80 | 40 | 50 | **P1** |
| 6 | **Smart FAQ assistant** | Answers common renter questions (pet policy, deposit, internet) by reading the listing + landlord profile | 70 | 25 | 85 | 30 | 45 | **P1** |
| 7 | **Renter qualification snapshot** | One-paragraph applicant summary for landlord ("Sofia, 29, UX designer, Berlin, 3-mo stay, verified income") | 90 | 30 | 80 | 65 | 70 | **P0** |
| 8 | **Showing reminder copy** | Personalised T-24h / T-3h / T-30m reminders in renter's language | 85 | 15 | 95 | 40 | 60 | **P0** |
| 9 | **Price suggestion (single-listing)** | Compare to `competitor_listings` median by neighborhood + bedrooms; suggest a price band | 88 | 50 | 60 | 75 | 70 | **P1** |
| 10 | **Availability recommendation** | "Add Saturday morning slots — 70% of showings are weekends" | 60 | 30 | 75 | 25 | 50 | **P2** |

**Phase 1 AI total**: 10 features. Estimated build: 18 engineer-days. Bundle as the **Pro tier ($29/mo)** value prop.

### 7.2 Advanced AI features (Phase 2/3 — moat)

| # | Feature | What it does | ROI | Difficulty | Speed | Revenue | Retention | Priority |
|---|---|---|---:|---:|---:|---:|---:|---:|
| 11 | **Dynamic pricing engine** | Daily-recomputed pricing band per listing using market_snapshots, occupancy_history, seasonality, comp price-deltas | 92 | 70 | 35 | 90 | 75 | **P1** |
| 12 | **Occupancy forecast** | 30/60/90-day projected occupancy + revenue, with confidence interval | 80 | 65 | 40 | 70 | 60 | **P1** |
| 13 | **Vacancy risk prediction** | Flag listings likely to vacate next 60 days based on lease history, market signals, message sentiment | 75 | 75 | 30 | 55 | 80 | **P2** |
| 14 | **Lead conversion prediction** | Probability lead → booking, used for prioritisation in the inbox | 78 | 60 | 50 | 50 | 65 | **P2** |
| 15 | **Fraud detection (renter)** | Flag suspicious leads: throwaway emails, bot-pattern messages, inconsistent budget vs profile | 82 | 55 | 45 | 30 | 75 | **P1** |
| 16 | **Duplicate-listing detection** | Photo-hash + embedding similarity + address fuzz; flag scraped duplicates pre-publish | 85 | 60 | 55 | 35 | 70 | **P1** |
| 17 | **Sentiment analysis on messages** | Classify thread sentiment (cooperative / frustrated / urgent / aggressive); surface in inbox + alert on escalation | 70 | 50 | 65 | 40 | 65 | **P2** |
| 18 | **AI leasing assistant** | Conversational agent inside landlord workspace ("draft a follow-up to Sofia"; "what's my best-performing listing?") | 75 | 70 | 40 | 50 | 70 | **P2** |
| 19 | **Renewal prediction engine** | T-45d before lease end → predict renewal likelihood + suggest extension offer terms | 70 | 75 | 25 | 45 | 80 | **P3** |
| 20 | **Churn prediction (landlord)** | Predict landlord-side churn (engagement drop, listings going stale); alert customer success | 65 | 70 | 30 | 30 | 90 | **P3** |
| 21 | **Comparative market analysis** | Auto-generate "your listing vs 8 comparables" report on demand | 80 | 55 | 50 | 60 | 60 | **P2** |
| 22 | **Photo categoriser + missing-room detector** | Identify rooms in photos; flag if no kitchen/bathroom photo | 65 | 50 | 60 | 25 | 35 | **P3** |
| 23 | **Smart availability optimiser** | Recommend slot patterns based on which slots most often book | 60 | 45 | 65 | 25 | 40 | **P3** |

**Phase 2 AI total**: 13 features. Estimated build: 35 engineer-days. Bundle (#11, #12, #14, #16) as **Pricing Lab add-on ($19/mo)**. (#15, #18, #21) elevate **Agent + PM tiers**.

### 7.3 Implementation note — model selection

| Use case | Model | Rationale |
|---|---|---|
| Lead scoring (high-volume, latency-sensitive) | Gemini 3.1 Flash Lite + structured-output | Cheapest tier, sufficient for classification |
| Description generation | Gemini 3 Flash | Good balance of quality / cost / speed |
| Leasing assistant chat | Gemini 3 Flash + tool-calling | Re-uses existing ai-chat infrastructure |
| Pricing recommendation | Gemini 3.1 Pro + structured-output | Higher reasoning needed; lower volume |
| Photo quality + categorisation | Gemini 3.1 Pro vision | Multimodal needs Pro tier |
| Sentiment analysis | Gemini 3 Flash | Classification, fast batch |
| Forecasting (occupancy, churn) | Custom Postgres SQL + lightweight regression | LLM not needed; deterministic + auditable |

All AI calls go through `_shared/gemini.ts` with 30s `AbortController` + log to `ai_runs`.

---

## 8. Automation Systems (6 Named Flows)

Each flow is a **named pattern** with a trigger, condition, action, and approval policy. Configurable per-landlord via `automation_rules`. Runs are logged to `automation_runs` with full audit trail.

### 8.1 Flow F1 — Lead Flow

**Trigger:** new row in `leads` (DB trigger fires `lead-classify` → `lead-score` → automation evaluator)

```
new lead arrives
  ↓
lead-classify (extract structured profile)
  ↓
lead-score (Hermes 0–1)
  ↓
IF score < 0.3 → mark spam, archive
IF score 0.3–0.6 → route to inbox, notify landlord (no auto-reply)
IF score 0.6–0.8 → route to inbox, notify, draft auto-reply (queue for approval)
IF score > 0.8 → route to inbox, notify URGENT, send auto-reply immediately
                  (if landlord has enabled this rule)
  ↓
schedule follow-up reminder T+24h if no response
```

**Default rule preset (Pro tier):** auto-reply for score ≥0.8, draft+queue for 0.6–0.8.

**Notifications:** landlord gets WhatsApp message ("Nuevo lead: Sofía, score 0.87, $1500/mes") + in-app bell + email digest if not opened within 1h.

### 8.2 Flow F2 — Showing Flow

**Trigger:** new row in `showings` with status `'proposed'` or `'confirmed'`

```
showing scheduled
  ↓
send confirmation to renter (WhatsApp + email)
send confirmation to landlord (WhatsApp)
  ↓
T-24h: showing-reminder-cron sends reminder both parties
T-3h:  reminder both parties (with directions link)
T-30m: final reminder
  ↓
At scheduled_at: status auto-flips to 'in_progress' (cron)
+30m past scheduled_at:
  IF no completion event → flag for landlord "did this happen?"
  IF flagged no_show by either party → mark no_show
  IF marked complete → request feedback (24h delay) from both sides
  ↓
post-feedback: lead status moves toward 'qualified' OR 'archived'
```

**Approval policy:** all reminder + feedback messages go without approval (low-risk, templated). Cancellation/reschedule requires landlord click.

### 8.3 Flow F3 — Listing-Stale Flow

**Trigger:** `automation-rule-evaluate` cron runs daily; flags `apartments` where `lease_status = 'available'` AND `created_at < now() - interval '14 days'` AND `lead_count_30d` is in bottom quartile vs comparables.

**Action:** generate `ai_recommendations` row with kind `'vacancy_recovery'`:
- "Drop price by X% (market median: $1200, you're at $1400)"
- "Add photos of: kitchen, bathroom, view (you're missing those)"
- "Rewrite title (current CTR predicted at 1.2%, suggested at 2.8%)"
- "Promote to featured for 7 days ($25)"

Then send digest WhatsApp/email to landlord. **No approval required** — generates suggestions, landlord acts (or doesn't).

### 8.4 Flow F4 — Vacancy Recovery Flow

**Trigger:** `apartments.lease_status = 'available'` AND `days_on_market > 21`

```
generate vacancy-recovery report (more aggressive than F3):
  - 4 specific actions ranked by predicted impact
  - "Take action by [date] or auto-archive in 60 days"
  ↓
send WhatsApp DM with the report link
  ↓
schedule check-in T+7d:
  IF days_on_market > 28 → escalate to email
  IF days_on_market > 45 → suggest off-market or co-list
  IF days_on_market > 60 → auto-archive (with landlord opt-out)
```

### 8.5 Flow F5 — Inactive-Lead Flow

**Trigger:** `leads.status = 'new'` OR `'contacted'` AND no `lead_events` of type `message_sent` from landlord side in 48h

```
draft a personalised nudge from landlord side
  ↓
queue for approval (default) OR auto-send (Pro+ with rule enabled)
  ↓
log; if no response 24h later, mark `archived` with reason 'no_response'
```

### 8.6 Flow F6 — Renewal Flow

**Trigger:** `occupancy_history` row with `end_date` between `now() + interval '30 days'` and `now() + interval '60 days'`

```
T-45d: send tenant a personalised renewal offer
       (terms suggested by renewal-prediction model)
T-30d: send landlord report on tenant's likelihood to renew
       + suggested concession (e.g. 5% discount, deposit waiver)
T-15d: if no response → suggest re-listing
T-7d:  trigger re-listing wizard (pre-fill from existing apartment row)
```

### 8.7 Cross-flow approval queue

Any action with `requires_approval = true` goes into `automation_runs` with status `'approved_pending'`. Surfaces in `/host/automations` "Pending approvals" tab. Default `requires_approval` settings:

| Action | Free | Pro | Agent | PM |
|---|---|---|---|---|
| Auto-reply send | ✓ approve | ✓ approve | auto | auto |
| Reminder send | auto | auto | auto | auto |
| Price change | n/a | ✓ approve | ✓ approve | ✓ approve |
| Listing archive | ✓ approve | ✓ approve | ✓ approve | ✓ approve |
| Renewal outreach | n/a | ✓ approve | auto | auto |

---

## 9. Revenue Strategy (Pre-Payments)

The big idea: **earn $20–80 per landlord per month from SaaS-like monetisation while we work on the booking-payment plumbing in parallel.**

### 9.1 Monetisation models — ranked

| # | Model | How it works | $ per landlord / mo | Margin | Adoption | Speed to ship | Score /100 |
|---|---|---|---|---:|---:|---:|---:|
| 1 | **Pay-per-qualified-lead** | $5 (Free) / $3 (Pro) per lead the landlord marks "qualified" | $25–60 (variable) | 90% | 75% | 5 days | **92** |
| 2 | **Featured-listing surcharge** | $25/listing/week to pin top of search OR get a coloured pin on map | $25–100 | 95% | 50% | 3 days | **88** |
| 3 | **SaaS subscription tiers** | Free (5 listings, 10 leads/mo cap) / Pro $29 / Agent $59 / PM $99 | $29–99 | 90% | 30–50% | 7 days | **85** |
| 4 | **Pricing Lab add-on** | $19/mo for dynamic pricing + occupancy forecast + comparative market analysis | $19 | 95% | 25% | 10 days (after Phase 2 AI) | **78** |
| 5 | **Verified-host badge fee** | $15/year one-time KYC fee for the verified ✓ badge | $1.25 | 99% | 80% | 2 days | **70** |
| 6 | **Auto-leasing concierge package** | Bundle: AI-listing + auto-reply + showing scheduling + lease drafting; $99/mo flat | $99 | 80% | 15% | 14 days | **65** |
| 7 | **WhatsApp-channel surcharge** | $5/mo to use WhatsApp inbox in landlord workspace (PM tier includes it) | $5 | 70% | 60% | 4 days | **60** |
| 8 | **Lead-pack prepay** | $200 prepays 30 qualified leads + carry forward 60 days | $200 / 30d (variable) | 90% | 30% | 5 days | **58** |
| 9 | **Premium analytics tier** | $19/mo for portfolio + market-segment + competitor analytics dashboards | $19 | 95% | 20% | 7 days | **55** |

### 9.2 Recommended bundle — what to ship first

| Phase | Models active | Realistic AAR (Average Annual Revenue per Landlord) |
|---|---|---|
| **W2 (revenue starts)** | #1 Pay-per-lead + #5 Verified badge | $200–600 / yr |
| **W4 (subscription on)** | #3 Free/Pro tiers + #2 Featured listings | $400–1200 / yr |
| **M2 (premium add-ons)** | #4 Pricing Lab + #6 Concierge | $700–2500 / yr |
| **M3 (booking comm.)** | + 12% rental commission post-payments | $1500–6000 / yr |

### 9.3 Stripe setup (subscription only — payouts deferred)

Use Stripe Billing (NOT Connect — Connect is the booking-payments project for Month 3). Products:

```
Product 1: "Mdeai Pro"           Price 1A: $29/mo recurring (USD)
                                 Price 1B: $290/yr recurring (saves $58)
Product 2: "Mdeai Agent"         Price 2A: $59/mo
Product 3: "Mdeai PM"            Price 3A: $99/mo
Product 4: "Mdeai Pricing Lab"   Price 4A: $19/mo (cancel-anytime)
Product 5: "Featured Listing"    Price 5A: $25 one-time (1-week pin)
                                 Price 5B: $80 one-time (4-week pin)
Product 6: "Verified Host Badge" Price 6A: $15/yr recurring
Product 7: "Lead Fees"           Price 7A: $5 invoice item (Free)
                                 Price 7B: $3 invoice item (Pro)
```

Stripe's **invoice items + scheduled invoices** combine well: a Pro landlord gets a single monthly invoice with the $29 base + however many lead fees accumulated that month.

---

## 10. Security + Trust

### 10.1 RLS policy summary

| Table | Public read | Landlord (own) | Landlord (others) | Renter | Admin |
|---|---|---|---|---|---|
| `apartments` (approved + active) | ✓ | ✓ | only approved | only approved | ✓ |
| `apartments` (pending/rejected) | — | ✓ | — | — | ✓ |
| `leads` | — | ✓ | — | own only | ✓ |
| `showings` | — | ✓ | — | own only | ✓ |
| `messages` (`landlord_messages`) | — | ✓ (own threads) | — | own threads | ✓ |
| `landlord_profiles` (full) | — | own only | — | — | ✓ |
| `landlord_profiles_public` (subset view) | ✓ | ✓ | ✓ | ✓ | ✓ |
| `verification_documents` | — | own only | — | — | ✓ |
| `automation_rules` / `_runs` | — | own only | — | — | ✓ |
| `pricing_history` / `occupancy_history` | — | own only | — | — | ✓ |
| `audit_log` | — | — | — | — | ✓ |

### 10.2 Moderation flow

```
landlord submits listing
  ↓
moderation_status = 'pending'
  ↓
auto-checks:
  - photos: 5+ unique images, ai_quality_score avg ≥ 0.5
  - description: ≥ 80 chars, no contact info (phone/email — should be in profile, not listing)
  - address: geocodable, in Medellín metro
  - price: within 0.5–3x neighborhood median
  ↓
IF all auto-checks pass + landlord verified → auto-approve (within 5min)
ELSE → admin queue (target SLA: 12h)
  ↓
admin sees in /admin/moderation:
  - listing preview side-by-side with similar listings
  - auto-check failures highlighted
  - "approve" / "reject + reason" / "request changes"
  ↓
on rejection: landlord notified with specific reasons + edit-and-resubmit CTA
on approval: listing goes live + email to landlord ("Your listing is live ↗")
```

### 10.3 Identity + ownership verification

**Landlord KYC-light (Phase 1):**
- Required: government ID upload (cedula CC or passport)
- Required: ownership proof — utility bill OR property deed OR rental management agreement
- Optional: video selfie (Phase 2)

Stored in `verification_documents` (private bucket, 90-day TTL on ID copies). Admin reviews in `/admin/landlords`. Status visible to landlord on `/host/profile`.

**Verified badge** unlocks:
- "Verified" green check on listings + profile
- Higher default placement in search
- Eligible for Pro tier discounts
- Eligible for the verified badge fee revenue stream (#5 above)

### 10.4 Fraud detection

| Vector | Defence |
|---|---|
| Fake landlord, mass-listing | Auto-flag any landlord adding >3 listings/24h before verification |
| Same photo across "different" listings | `listing_photos.storage_path` perceptual-hash match → block second upload |
| Fake leads to score landlord (negative SEO) | `lead_score < 0.3 → spam`; if 5+ spam leads from one IP → block |
| Stolen-credit-card lead-pack purchase | Stripe Radar default rules + 3DS challenge for first purchase |
| Listing with off-platform contact | Auto-detect phone/email/WhatsApp number in listing description → require redaction |
| Account takeover | Supabase MFA on accounts with active subscription |
| Scraping our public APIs | Rate limit by IP + JWT; CAPTCHA on `/signup` if 5+ from same IP/24h |

### 10.5 Audit log retention

- All landlord-facing tables emit `audit_log` rows on INSERT/UPDATE/DELETE
- Admin actions (verification decisions, moderation decisions, role changes) audited by default
- 90-day retention via daily pg_cron prune
- Service-role-only read; admin-only access via `/admin/audit`

---

## 11. Medellín-Specific Opportunities

### 11.1 Demand patterns to lean into

| Pattern | Implication for product |
|---|---|
| **Laureles & Poblado dominate** demand for nomads / expats | Default-pin map on Laureles in onboarding; show price comparables limited to those zones |
| **High-season Q1 (Jan–Mar)** for foreign nomads escaping winter | Surface seasonal pricing recommendations in December — "raise 15% for Jan" |
| **Feria de las Flores (early Aug)** drives 3-week price spike | Auto-recommend +20–30% for the festival window |
| **Christmas → mid-Jan bookings** drop locally but expats stay | Don't over-discount in Jan based on local-only signal |
| **Local landlords list at COP, foreign nomads search in USD** | Always show both; auto-conversion in chat + listing card |
| **WhatsApp is everything** | Native WA inbox in landlord workspace; outbound WA reminders > email |
| **Many "informal" landlords** (Facebook Groups, no MLS) | KYC-light path with video-call verification option |
| **Cash deposits common; debit/credit penetration ~60%** | Plan for both Stripe + Wompi (local) when payments ship |

### 11.2 Bilingual content strategy

- All UI strings have EN + ES (default ES for landlords, EN for renter side from existing intent)
- AI-generated listing descriptions emit both languages by default — landlord can edit either
- Auto-reply to renter inquiries in **the renter's last-message language** (already deduced from `conversations.session_data`)
- Showing reminders in the recipient's language

### 11.3 WhatsApp-first ops

- Onboarding Step 3 captures landlord's WhatsApp E.164 number
- All notifications default to WA channel; email is fallback
- Landlord can reply directly from WhatsApp — `whatsapp-webhook` routes back into the right thread
- WA template approvals via Infobip in advance (showing reminders, lead notification, listing approved)
- `whatsapp_e164` is the **primary identity field** in landlord directory — phone-first onboarding

### 11.4 Seasonality automation

```
automation_rules entries seeded per landlord on activation:

  - "Feria pricing": every Jul-15, propose +25% for active listings, Aug 1–14
  - "Q1 nomad push": every Nov-15, propose +12% for Jan listings
  - "Christmas low": every Dec-15, propose -8% for Dec 22–Jan 5
  - "Easter (Semana Santa)": auto-block bookings unless `pets_allowed=true` (cultural pattern)
```

Landlords can toggle off / customise.

---

## 12. Build Roadmap

### 12.1 Week 1 — MVP (Days 1–7)

**Theme: a landlord can sign up, get verified, and list a property. Renters can see it.**

| Day | Deliverable |
|---|---|
| **D1 (Mon)** | Schema migration applied + types regen — `supabase/migrations/20260429_landlord_profiles.sql` (creates landlord_profiles, landlord_team_members, listing_photos, listing_availability, featured_listings, verification_documents, audit_log + apartments columns) |
| **D2 (Tue)** | Landlord signup branch + onboarding shell — `pages/Signup.tsx`, `components/auth/AccountTypeStep.tsx`, `pages/host/Onboarding.tsx` (Step1 only) |
| **D3 (Wed)** | Onboarding Steps 2 + 3 + Verification submit edge fn — `Step2BusinessInfo.tsx`, `Step3Verification.tsx`, `verification-submit` |
| **D4 (Thu)** | Listing form Steps 1–3 + photo upload — `pages/host/ListingNew.tsx`, `Step1Address.tsx` (Google Places autocomplete), `Step2Specs.tsx`, `Step3Photos.tsx`, `lib/storage/upload-listing-photo.ts`, `listing-photo-upload-sign` |
| **D5 (Fri)** | Listing form Steps 4–6 + AI description + create + moderation submit — `Step4Amenities.tsx`, `Step5Pricing.tsx`, `Step6Description.tsx`, `listing-create`, `generate-listing-description` |
| **D6 (Sat)** | Admin moderation queue + verification decide — `pages/admin/Moderation.tsx`, `listing-moderate`, `verification-decide` |
| **D7 (Sun)** | Host dashboard shell + listings index — `pages/host/Dashboard.tsx`, `pages/host/Listings.tsx`, `HostShell.tsx`, `HostLeftNav.tsx`, `RoleProtectedRoute.tsx` |

**W1 exit criteria:** sign up → onboard → submit verification → list property → admin approves → listing appears on `/apartments` for a renter to discover.

### 12.2 Week 2 — Revenue starts (Days 8–14)

**Theme: leads flow in, landlords pay per qualified lead, featured listings start selling.**

| Day | Deliverable |
|---|---|
| **D8 (Mon)** | `leads` table + auto-create lead from chat trigger + `lead-classify` edge fn |
| **D9 (Tue)** | `lead-score` (Hermes lead-scoring v1) + Leads inbox UI + LeadCard + LeadFilters |
| **D10 (Wed)** | LeadDetail + auto-reply composer (`lead-auto-reply` Gemini draft) + manual send |
| **D11 (Thu)** | Mark-qualified flow + lead-fee Stripe invoice item + `lead-fee-charge` edge fn |
| **D12 (Fri)** | Featured-listing purchase via Stripe Checkout + `featured_listings` table + UI surface (gold-pin on map) |
| **D13 (Sat)** | Verified-host badge fee Stripe Checkout + badge surfaces on listing + profile |
| **D14 (Sun)** | First $: end-to-end test — sign up new landlord → list → simulate renter inquiry → mark qualified → see invoice in Stripe |

**W2 exit:** **first revenue event** (qualified-lead fee OR featured-listing purchase OR verified-badge fee).

### 12.3 Week 3 — Operations + showings (Days 15–21)

**Theme: landlords run their business — schedule showings, message renters, see their numbers.**

| Day | Deliverable |
|---|---|
| **D15** | Showings table + `showing-schedule` edge fn + ShowingForm + Calendar (week view) |
| **D16** | `showing-reminder-cron` (T-24/T-3/T-30) via pg_cron + WhatsApp templates |
| **D17** | message_threads + landlord_messages + Thread UI + realtime + WhatsApp inbound webhook |
| **D18** | `whatsapp-send` + outbound delivery + status tracking |
| **D19** | Listing performance metrics edge fn + ListingMetricsRow inline display |
| **D20** | Landlord public profile page `/hosts/:id` + RentalCardInline "Hosted by" link |
| **D21** | Pricing-recommend MVP (single listing vs comparables) + simple recommendations card |

**W3 exit:** the workspace is operationally complete. Landlord can do all 80% of daily work without leaving.

### 12.4 Week 4 — Subscriptions + automations + polish (Days 22–28)

**Theme: convert pay-per-lead users to recurring subscription; lock in revenue.**

| Day | Deliverable |
|---|---|
| **D22** | Stripe Billing setup: 4 products (Pro/Agent/PM + Pricing Lab) + `subscription-create` + `subscription-portal` |
| **D23** | Tier gating in UI (which features visible per tier) + upgrade prompts |
| **D24** | `automation_rules` editor + 6-flow defaults seeded on landlord create |
| **D25** | Lead Flow + Inactive-Lead Flow shipped end-to-end |
| **D26** | Listing-Stale + Vacancy Recovery flows shipped |
| **D27** | Analytics page (KPIs + occupancy chart + lead funnel + listing performance table) |
| **D28** | Public sales page `/for-landlords` + WhatsApp deep-link signup + LATAM pricing |

**W4 exit:** **first paying subscription**. Target: 5 paying landlords by Day 30.

### 12.5 Month 2 — Growth (Days 29–60)

**Theme: scale supply (multi-source ingestion) + AI moat (Phase 2 features).**

| Sprint | Deliverable |
|---|---|
| **W5** | Firecrawl Multi-Site Extraction (FincaRaiz, Metrocuadrado, Airbnb) → `competitor_listings` table → cron daily |
| **W5** | Duplicate-listing detection (#16) — photo-hash + embedding + address fuzz |
| **W6** | Dynamic pricing engine (#11) — cron-recompute price band per listing daily |
| **W6** | Pricing Lab UI + $19/mo paywall |
| **W7** | Sentiment analysis on messages (#17) + AI escalation alerts |
| **W7** | Renter qualification snapshot (#7) — applicant summary on application screen |
| **W8** | Photo categoriser + missing-room detector (#22) → blocks listing publish if missing |
| **W8** | Bulk listing operations (multi-select price update, calendar) for Agent + PM tiers |

**M2 exit:** 25 paying landlords. Pricing Lab adoption ≥10 of those 25.

### 12.6 Month 3 — AI advantage + booking unlock (Days 61–90)

**Theme: AI moat solidifies; booking-payments project starts and lands by D90.**

| Sprint | Deliverable |
|---|---|
| **W9** | Occupancy forecast (#12) — 30/60/90-day projection per listing |
| **W9** | Lead conversion prediction (#14) — sort leads inbox by predicted-conv |
| **W10** | Vacancy risk prediction (#13) — proactive "this listing is at risk" alerts |
| **W10** | AI leasing assistant (#18) — chat inside `/host/dashboard` ("draft a follow-up to Sofia") |
| **W11** | **Booking-payments project** — Stripe Connect + booking-create + payment-webhook + payout schedule |
| **W11** | Comparative market analysis (#21) — "your listing vs 8 comparables" report |
| **W12** | Renewal prediction engine (#19) + Renewal Flow F6 live |
| **W12** | Churn prediction for landlord side (#20) + customer-success alerting |

**M3 exit:** 100 paying landlords. Pre-booking-payment ARR run-rate ≥ $40K. Booking commission unlocks Month 4 onward.

### 12.7 Total effort estimate

| Phase | Engineer-days | Calendar weeks | Cumulative landlords |
|---|---:|---:|---:|
| W1 MVP | 7 | 1 | 0 |
| W2 Revenue | 7 | 1 | 1 (first paid lead) |
| W3 Operations | 7 | 1 | 5 |
| W4 Subscription | 7 | 1 | 5 paying / 25 trial |
| M2 Growth | 28 | 4 | 25 paying / 60 trial |
| M3 AI moat | 28 | 4 | 100 paying / 200 trial |
| **Total** | **84 e-days** | **12 weeks** | **100 paying** |

Reality buffer: real shipped is typically 1.4× the estimate. Plan for **120 engineer-days / 16 weeks** to hit "100 paying landlords" comfortably.

---

## 13. Risk Register + Mitigations

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Cold-start supply: no landlords sign up because no demand visible | High | Critical | Pre-seed via Firecrawl in W5; manual outreach to 20 brokers in W1; show fake-but-realistic demand counts on landing page ("2,400 nomads searched this week") |
| R2 | Verification bottleneck: admin queue grows faster than admins can process | High | Major | Auto-approve clean cases (verified ID match + clean photos); SLA dashboard; hire 1 part-time moderator at 50 landlords |
| R3 | WhatsApp Business API approval delays via Infobip (typical 7–14d) | High | Major | Apply for WA Business Account on Day 1; have email + in-app fallback ready |
| R4 | Stripe Billing complexity (lead-fee invoice items + tier proration) | Medium | Major | Use Stripe-Sigma test reports in W2; only one billable event type at first (qualified leads); prove invoice flow before adding subscription |
| R5 | Landlord churn from poor lead quality | High | Major | Strict lead-score threshold for "qualified" charges (≥0.7); satisfaction survey at lead-fee-charge time; refund policy for bad leads |
| R6 | AI hallucinations in description / pricing recommendations | Medium | Moderate | Always show source-of-truth (comparable listings used); landlord-must-approve before publish; track `accepted_at` on `ai_recommendations` to learn |
| R7 | Photo storage costs balloon | Medium | Moderate | WebP-only after upload; max 2400px width; cap 30 photos per listing; 1-yr lifecycle on archived-listing photos |
| R8 | Duplicate-detection false positives | Medium | Moderate | Show "is this your listing?" review step before block; manual override |
| R9 | RLS policies leak data between landlords | Low | Critical | Positive RLS test suite in `e2e/` (RWT-19/20 path); MFA for admins; 90-day audit retention |
| R10 | Spanish localisation gaps embarrass us | High | Moderate | Spanish-first copy review by a native speaker before W4; localisation linting in CI |
| R11 | Existing chat-canvas regressions from cross-cutting changes | Medium | Major | Phase E RWT specs (in todo.md) cover the chat-canvas critical path; run before every release |
| R12 | Landlords expect booking-payments + commission, not subscription | High | Major | Sales narrative: "lead generation first, payments next month" — set expectation; offer founding-landlord 50% lifetime discount through M3 |

---

## 14. Success Metrics

### 14.1 North-star metric

**Active paid landlords with ≥3 active listings AND ≥10 leads in trailing 30 days.**

Target trajectory:

| Day | Target | Notes |
|---|---:|---|
| 14 | 1 | First $ |
| 30 | 5 | First subscriber |
| 60 | 25 | Verifying pricing power |
| 90 | 100 | Pre-payment cohort solid |
| 180 | 400 | Booking-payments live, comm. flowing |
| 365 | 1,500 | Y1 graduation |

### 14.2 Phase-level KPIs

**Phase 1 (W1–W4):**
- 50 landlord signups
- 20 listings published (≥3 photos, AI-quality ≥0.5)
- 200 leads captured
- 50 leads marked qualified (avg fee event = $4 → $200 revenue)
- 5 paying subscriptions (Pro tier, $145 MRR)
- 10 featured-listing purchases ($250 one-time revenue)
- **Total month-1 revenue: ~$600**

**Phase 2 (M2):**
- 200 listings active
- 1,500 leads captured
- 250 qualified leads ($1,000 fee revenue)
- 25 paying subs ($725 MRR Pro avg, $19 add-on for half = ~$960 MRR)
- 40 featured purchases ($1,000 one-time)
- 30 verified badges ($45 revenue)
- **Total month-2 revenue: ~$3,000**

**Phase 3 (M3):**
- 500 listings active
- 5,000 leads
- 100 paying subs
- $5K MRR + $2K month-3 one-time = **$7K month-3 revenue**

### 14.3 Operational SLAs

| Metric | Target |
|---|---|
| Verification decision turnaround | ≤24h, ≤8h after V2 (auto-approve path) |
| Listing moderation turnaround | ≤12h, ≤2h after auto-approve V2 |
| Lead → first auto-reply latency | ≤60s |
| Lead → landlord notification | ≤30s |
| Showing reminder delivery | ≤2 min after T-24h/T-3h/T-30m mark |
| WhatsApp inbound → in-app surface | ≤5 s |
| Edge function P95 latency | ≤800 ms (excluding AI calls) |
| AI call P95 latency | ≤4 s (Gemini Flash) / ≤8 s (Gemini Pro) |

### 14.4 Quality bars

- New listing publish → live in search ≤5 min after admin approve
- Lead-score precision (high-score → human-confirmed-qualified) ≥75%
- AI description acceptance rate (landlord publishes without significant edit) ≥60%
- Verification false-rejection rate <5% (measured by re-submission acceptance)
- Landlord NPS at 60 days ≥40

---

## 15. Open Decisions

| # | Decision | Options | Default if no objection | Due |
|---|---|---|---|---|
| 1 | Stripe Billing region of record | US (Stripe Inc) / Mexico (Stripe MX) / Colombia direct | **US Stripe Inc with USD pricing** | Day 1 |
| 2 | Pay-per-lead pricing | $3 / $5 / $7 per qualified lead | **$5 (Free) / $3 (Pro)** | Day 7 |
| 3 | Verification doc retention | 90 days / 1 year / 5 years | **90 days for ID; 5 years for ownership proof (legal req.)** | Day 7 |
| 4 | Free tier cap | 3 / 5 / 10 listings | **5 listings + 10 leads/mo** | Day 14 |
| 5 | Min photos per listing | 3 / 5 / 8 | **5 with at least 1 each: bedroom, kitchen, bathroom, exterior** | Day 5 |
| 6 | WhatsApp template approvals | Pre-launch / on first need | **Pre-launch all 8 templates** | Day 8 |
| 7 | Auto-reply opt-in | On-by-default / off-by-default | **Off by default; landlord opts in during onboarding step 4** | Day 10 |
| 8 | Lead-fee refund policy | No refund / 50% / 100% if marked spam | **Auto-refund if landlord marks spam within 24h of charge** | Day 11 |
| 9 | Founder discount window | First 50 / 100 / 200 landlords | **First 100 — 50% lifetime on Pro tier** | Day 14 |
| 10 | Bilingual default | Spanish-first / English-first / detect from browser | **Spanish-first for /host; detect on /signup; toggle in header** | Day 2 |

---

## 16. Appendix

### 16.1 File inventory (NEW vs MODIFIED)

```
NEW FILES (~80)
───────────────
src/pages/host/{Onboarding,Dashboard,Listings,ListingNew,ListingEdit,
                Leads,LeadDetail,Calendar,Messages,MessageThread,
                Analytics,Recommendations,Automations,Team,Billing,Profile}.tsx
src/pages/HostProfile.tsx
src/pages/admin/{Moderation,Landlords,Audit}.tsx
src/components/host/layout/{HostShell,HostLeftNav,HostHeader,HostMobileNav,RoleProtectedRoute}.tsx
src/components/host/onboarding/{Step1,Step2,Step3,Step4,OnboardingProgress}.tsx
src/components/host/listing/ListingForm/{Step1..Step6}.tsx
src/components/host/listing/{ListingCard,ListingMetricsRow,AIRecommendationsPanel,ListingPreview}.tsx
src/components/host/leads/{LeadCard,LeadFilters,LeadDetailPanel,QualifyButton,AutoReplyComposer}.tsx
src/components/host/calendar/{CalendarWeekView,CalendarDayView,ShowingForm,ShowingCard,AvailabilityEditor}.tsx
src/components/host/messages/{ThreadList,Thread,MessageComposer,WhatsAppBadge}.tsx
src/components/host/analytics/{KPIBar,PortfolioOccupancyChart,ListingPerformanceTable,LeadFunnelChart}.tsx
src/components/host/recommendations/{RecommendationCard,RecommendationFilter,RecommendationDiff}.tsx
src/components/host/automations/{RuleCard,RuleEditor,AutomationRunHistory}.tsx
src/components/host/team/{TeamMemberCard,InviteTeamMemberModal,PermissionsEditor}.tsx
src/components/host/billing/{PlanCard,UpgradeButton,InvoicesTable,LeadFeesTable}.tsx
src/lib/storage/upload-listing-photo.ts
src/lib/host/auth-helpers.ts
src/hooks/host/{useLandlordOnboarding,useListings,useLeads,useShowings,useAutomations}.ts

NEW EDGE FUNCTIONS (30) — see §5 catalog

NEW MIGRATIONS (5)
──────────────────
20260429120000_landlord_profiles.sql
20260429120001_apartments_landlord_extensions.sql
20260429120002_pipeline_tables.sql           (leads, lead_scores, lead_events, showings, message_threads, landlord_messages)
20260429120003_intelligence_tables.sql       (pricing_history, occupancy_history, ai_recommendations, automation_rules, automation_runs)
20260429120004_trust_tables.sql              (verification_documents, audit_log + audit triggers)

MODIFIED FILES
──────────────
src/App.tsx                               — add /host/* + /admin/* lazy routes; AccountTypeStep wiring
src/pages/Signup.tsx                      — account-type toggle + post-signup branching
src/hooks/useAuth.tsx                     — extend signup payload with account_type
src/integrations/supabase/database.types.ts — regen post-migration
src/components/chat/embedded/RentalCardInline.tsx — "Hosted by [name]" link to /hosts/:id
src/lib/posthog.ts                        — new typed events (host_*, lead_*, listing_*)
.env.local                                — STRIPE_SECRET_KEY, INFOBIP_API_KEY (already exist)
```

### 16.2 Commit cadence (1 PR per dotted task)

`F1.1` → 1 PR. `F1.2` → 1 PR. Etc. Every PR:
- Lints clean (no NEW errors)
- Builds in ≤5 s
- Adds/preserves Vitest coverage
- Has 1 RWT spec when applicable
- Cross-references this plan in the PR body

Average PR size: ~250 LOC + tests + docs. Roughly **30 PRs across the 12-week plan**.

### 16.3 Cross-doc references

- `tasks/CHAT-CENTRAL-PLAN.md` §3 — three-panel layout pattern (mirror in HostShell)
- `tasks/real-estate/1-trio-real-estate-plan.md` Part 7 — Hermes ranking model (powers `lead-score` + `pricing-recommend`)
- `tasks/real-estate/2-supabase-strategy.md` Part 5 — RLS pattern reference
- `tasks/real-estate/10-real-estate-tasks.md` — numbered task IDs cross-reference
- `tasks/todo.md` Phase F — sprint-level execution tracker
- `CLAUDE.md` — current stack + edge function patterns
- `.claude/rules/edge-function-patterns.md` — request lifecycle template all new functions follow

### 16.4 What's intentionally NOT in v1.0 of this plan

- **Booking-payment integration** (Stripe Connect, escrow, COP/Wompi) — Month 3 separate plan doc
- **Lease e-signature beyond click-to-sign MVP** — DocuSign integration is Month 4
- **Maintenance request system** (tenant submits → landlord triages) — Month 5
- **Multi-city expansion** (Bogotá, Cartagena) — Quarter 4
- **Investor analytics tier** ("Airbnb arbitrage" tools) — Quarter 2
- **Property tour video generation** (Remotion) — Month 5
- **In-room sensor integration** (utility usage, occupancy detection) — never (out of scope)

---

*End of plan v1.0. Update this file when scope or sequencing changes.*
*Last edit: 2026-04-28 · Author: sk · Reviewer: Claude Opus 4.7 (1M context)*
