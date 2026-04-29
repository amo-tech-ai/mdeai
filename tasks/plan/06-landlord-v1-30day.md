# 06 — Landlord V1 (30-Day Execution Plan)

> **Status:** Plan v1.0 — locked 2026-04-28 · Owner: sk · Reviewer: Claude Opus 4.7
> **Goal:** First 20 landlords, 50 listings, 200 leads captured, **in 30 days**.
> **No billing in V1.** No paywalls, no subscriptions, no qualified-lead fees. Free for everyone. Revenue model gets picked at Day 60+ from data — not from guesses.
> **Companion doc:** `tasks/plan/06-landlord-system.md` is the long-term vision (12-month). This file is the 30-day build instruction.
> **Mantra:** *Launch ugly. Get supply. Watch behaviour. Pick monetisation from data.*

---

## 📑 TL;DR

| | |
|---|---|
| **Mission** | Get the first 10–20 Medellín landlords onboarded with ≥1 published listing each, generating 100–200 renter leads, in 30 calendar days. |
| **Why no billing yet** | This is a **Founding Beta**: free for the first 100 landlords, permanently. We don't know what landlords actually value until we watch them use a free product; pre-PMF pricing is a guess. Day-60 data tells us what to charge later cohorts — never the founding 100. |
| **Engineering scope** | 6 edge functions · 6 new tables · 9 frontend pages · 1 migration. ~12 engineer-days of code. |
| **Founder scope** | 18 calendar-days of code (lead engineer), 12 calendar-days of outreach (founder). They can run in parallel from D8. |
| **First paying landlord** | Not in V1, and not from the founding 100. Day-60 cohort review picks a monetisation model for new sign-ups #101+. |
| **What we instrument from Day 1** | Every landlord action → PostHog with typed events. Daily aggregate `analytics_events_daily` table for cohort SQL. Outbound revenue (already shipping via affiliate clicks) attributed per-landlord so we know who's actually generating value. |
| **V1 targets (Day 30)** | **Stretch:** 20 landlords / 50 listings / 200 leads / median time-to-first-reply < 6h / 5+ landlords logged in 3+ days. **Acceptable:** 10 landlords / 25 listings / 100 leads / 25%+ reply rate / 3+ active landlords. **Kill criteria** (§8.3): <5 landlords or <20 leads after 100 outreach attempts → pause and diagnose. |

---

## 1. Scope

### 1.1 In V1 (build only this)

- **Landlord signup** with account-type toggle on `/signup`
- **3-step onboarding** (no full KYC): name + WhatsApp, optional ID upload, welcome
- **Public landlord profile** at `/hosts/:id` with response stats
- **4-step listing form** (address → specs → photos → description)
- **Auto-publish moderation** (rule-based, no admin queue UI in V1)
- **Listing edit** (same form, edit mode)
- **Leads inbox** (read-only cards, status tags)
- **Lead detail** with `wa.me/` deep-link reply button (no WhatsApp Business API)
- **Email notifications** (new lead, listing approved/rejected) via Supabase + Resend
- **Listing inline metrics** (views · leads · replies — last 7 days, no full analytics page)
- **PostHog instrumentation** on every landlord action (typed events)
- **Daily engagement aggregate** SQL view for cohort analysis at Day 60

### 1.2 Explicitly NOT in V1 (defer to V2 or later)

| Cut | Why |
|---|---|
| Stripe Billing | No pricing locked yet. Decided at Day 60+ from data. |
| Subscription tiers (Free/Pro/Agent/PM) | Same — premature segmentation. |
| Pay-per-qualified-lead fees | High dispute risk; replace with subscription or contact-unlock at Day 60+. |
| Featured listings | No payment infra in V1. |
| Verified-host badge fee | Free in V1; charge at Day 60+ if signal warrants. |
| WhatsApp Business API | 7-14 day approval; replaced with `wa.me/` deep-links (no API). |
| Lead scoring (Hermes) | Manual triage works at <200 leads/day. AI scoring at V2 or V3. |
| AI listing description | Free-text input only in V1. AI-generated copy at V2. |
| AI auto-reply composer | Manual replies via WhatsApp suffice for first 200 leads. |
| Pricing recommendations | No comparable data yet — we're seeding supply, not analysing it. |
| Showing scheduler | Landlords arrange showings via WhatsApp DM in V1. Scheduler at V2. |
| Calendar / availability editor | Same as above. |
| Analytics dashboard with charts | Inline 7-day stat row only. Full charts at V2. |
| AI Recommendations Center | All recommendation generation deferred. |
| Automations editor + 6 named flows | No automation in V1; founder runs ops manually for 30 days. |
| Team management (PM sub-users) | First 20 landlords are individuals + agents, not teams. |
| Multi-source scraping (Firecrawl) | Manual outreach gets us 20 landlords. Scraping at V2. |
| Listing co-listing / multi-landlord | Not needed at <50 landlords. |
| Bulk operations (bulk price update, calendar) | Same. |
| Public sales page `/for-landlords` | Founder DMs, not paid acquisition, in V1. Built at Day 25 if signups stall. |
| Audit log viewer (admin UI) | Service-role SQL access only in V1. |
| Verification queue (admin UI) | Founder approves manually via SQL or one-click email links. |
| Tier-gated UI guards | Single tier (everyone Pro-equivalent for free). |

**Cut ratio: ~22 features dropped from the long-term vision. ~6 features built. That's the point.**

### 1.3 What V1 does NOT touch (existing renter-side product stays unchanged)

- Existing `/chat`, `/apartments`, `/apartments/:id`, ChatCanvas, RentalCardInline, MapContext, observability, code-splitting — all preserved as-is.
- Renters never see a "this is V1" warning; the landlord-side appearing makes the platform more useful, not less.

---

## 2. Database (6 tables, 1 migration)

### 2.1 `landlord_profiles`

```sql
CREATE TABLE public.landlord_profiles (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  kind                  text NOT NULL DEFAULT 'individual'
                        CHECK (kind IN ('individual','agent','property_manager')),
  display_name          text NOT NULL,
  whatsapp_e164         text,                              -- "+57301..." — primary identity
  phone_e164            text,
  bio                   text,
  avatar_url            text,
  primary_neighborhood  text,                              -- "Laureles", "Poblado" etc.
  languages             text[] DEFAULT ARRAY['es']::text[],
  -- Verification (badge only — no fee)
  verification_status   text NOT NULL DEFAULT 'pending'
                        CHECK (verification_status IN ('pending','approved','rejected')),
  verified_at           timestamptz,
  -- Computed stats (refreshed nightly)
  total_listings        integer DEFAULT 0,
  active_listings       integer DEFAULT 0,
  total_leads_received  integer DEFAULT 0,
  total_replies_sent    integer DEFAULT 0,
  median_response_time_minutes integer,
  -- Trial-status placeholder (kept null until billing exists)
  notes                 text,                              -- founder ops notes
  source                text,                              -- "broker_outreach" / "facebook_group" / "referral" / "organic"
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX landlord_profiles_user_idx ON landlord_profiles(user_id);
CREATE INDEX landlord_profiles_status_idx ON landlord_profiles(verification_status);

-- Public view exposing only safe fields (avatar, name, response stats)
CREATE VIEW public.landlord_profiles_public AS
SELECT id, display_name, avatar_url, bio, primary_neighborhood, languages,
       verification_status = 'approved' AS is_verified,
       verified_at, active_listings, total_leads_received,
       median_response_time_minutes
FROM landlord_profiles
WHERE verification_status IN ('approved','pending');
```

### 2.2 `apartments` extensions (no new table, just columns)

```sql
ALTER TABLE public.apartments
  ADD COLUMN IF NOT EXISTS landlord_id uuid REFERENCES landlord_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'pending'
    CHECK (moderation_status IN ('pending','approved','rejected','archived')),
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual'
    CHECK (source IN ('manual','seed','firecrawl','api'));

CREATE INDEX IF NOT EXISTS apartments_landlord_idx ON apartments(landlord_id)
  WHERE landlord_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS apartments_moderation_idx ON apartments(moderation_status, created_at DESC);
```

### 2.3 `landlord_inbox`

> **Naming divergence (locked 2026-04-28, Option C):** the V1 table is `landlord_inbox`, not `leads`. A pre-existing `leads` table from the P1-CRM pipeline (renter→agent prospect funnel) ships with 6 live rows + FKs from `showings` and `rental_applications`. Renaming the V1 table avoids that clash. UX-level "lead" terminology (URLs `/host/leads`, hooks `useLeads`, PostHog events `leads_viewed`) intentionally keeps the landlord's mental model.

```sql
CREATE TABLE public.landlord_inbox (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Source
  channel           text NOT NULL DEFAULT 'chat'
                    CHECK (channel IN ('chat','form','whatsapp','admin_manual')),
  conversation_id   uuid REFERENCES conversations(id) ON DELETE SET NULL,
  -- Renter (nullable — anon leads OK)
  renter_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  renter_name       text,
  renter_phone_e164 text,
  renter_email      text,
  -- Listing target (nullable — could be a general inquiry)
  apartment_id      uuid REFERENCES apartments(id) ON DELETE SET NULL,
  landlord_id       uuid REFERENCES landlord_profiles(id) ON DELETE SET NULL,
  -- Inquiry payload
  raw_message       text NOT NULL,
  structured_profile jsonb DEFAULT '{}',
  -- Pipeline status (V1 keeps it simple)
  status            text NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new','viewed','replied','archived','spam')),
  viewed_at         timestamptz,
  first_reply_at    timestamptz,
  archived_at       timestamptz,
  archived_reason   text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX landlord_inbox_landlord_status_idx ON landlord_inbox(landlord_id, status, created_at DESC);
CREATE INDEX landlord_inbox_apartment_idx ON landlord_inbox(apartment_id, created_at DESC) WHERE apartment_id IS NOT NULL;
CREATE INDEX landlord_inbox_renter_idx ON landlord_inbox(renter_id, created_at DESC) WHERE renter_id IS NOT NULL;
CREATE INDEX landlord_inbox_conversation_idx ON landlord_inbox(conversation_id) WHERE conversation_id IS NOT NULL;
```

### 2.4 `landlord_inbox_events` (audit + analytics)

```sql
CREATE TABLE public.landlord_inbox_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inbox_id        uuid NOT NULL REFERENCES landlord_inbox(id) ON DELETE CASCADE,
  event_type      text NOT NULL CHECK (event_type IN (
                    'created','viewed','whatsapp_clicked','marked_replied',
                    'archived','spam_marked','reopened','admin_assigned'
                  )),
  actor_user_id   uuid REFERENCES auth.users(id),
  actor_kind      text CHECK (actor_kind IN ('renter','landlord','admin','system')),
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX landlord_inbox_events_inbox_idx ON landlord_inbox_events(inbox_id, created_at DESC);
CREATE INDEX landlord_inbox_events_type_time_idx ON landlord_inbox_events(event_type, created_at DESC);
```

### 2.5 `verification_requests`

Kept lightweight — separate from `landlord_profiles` so the state machine is clean.

```sql
CREATE TABLE public.verification_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id     uuid NOT NULL REFERENCES landlord_profiles(id) ON DELETE CASCADE,
  doc_kind        text NOT NULL CHECK (doc_kind IN ('national_id','passport','rut','property_deed','utility_bill')),
  storage_path    text NOT NULL,                          -- private bucket: identity-docs/<landlord_id>/...
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected')),
  reviewed_by     uuid REFERENCES auth.users(id),
  reviewed_at     timestamptz,
  rejection_reason text,
  expires_at      timestamptz,                            -- 90-day TTL on ID copies
  uploaded_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX verification_requests_landlord_idx ON verification_requests(landlord_id);
CREATE INDEX verification_requests_pending_idx ON verification_requests(uploaded_at DESC)
  WHERE status = 'pending';
```

### 2.6 `analytics_events_daily` (cohort SQL helper)

PostHog is the source of truth for product analytics. This table is a **denormalised daily snapshot** so we can run cohort SQL without the PostHog API. Refreshed nightly via pg_cron.

```sql
CREATE TABLE public.analytics_events_daily (
  landlord_id              uuid NOT NULL REFERENCES landlord_profiles(id) ON DELETE CASCADE,
  date                     date NOT NULL,
  -- Counts (one row per landlord per day)
  logins                   integer DEFAULT 0,
  listings_created         integer DEFAULT 0,
  listings_edited          integer DEFAULT 0,
  leads_received           integer DEFAULT 0,
  leads_viewed             integer DEFAULT 0,
  whatsapp_clicks          integer DEFAULT 0,
  replies_marked           integer DEFAULT 0,
  -- Computed
  affiliate_revenue_cents  integer DEFAULT 0,             -- their listings' outbound_clicks → estimated affiliate $
  PRIMARY KEY (landlord_id, date)
);

CREATE INDEX analytics_events_daily_date_idx ON analytics_events_daily(date DESC);
```

### 2.7 RLS pattern

```sql
-- Helper: returns set of landlord_ids that auth.uid() can act on
CREATE OR REPLACE FUNCTION public.acting_landlord_ids() RETURNS setof uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM landlord_profiles WHERE user_id = (SELECT auth.uid());
$$;

-- landlord_inbox
ALTER TABLE landlord_inbox ENABLE ROW LEVEL SECURITY;
CREATE POLICY landlord_inbox_select ON landlord_inbox FOR SELECT
  USING (landlord_id IN (SELECT acting_landlord_ids()) OR renter_id = (SELECT auth.uid()));
CREATE POLICY landlord_inbox_update ON landlord_inbox FOR UPDATE
  USING (landlord_id IN (SELECT acting_landlord_ids()))
  WITH CHECK (landlord_id IN (SELECT acting_landlord_ids()));

-- landlord_inbox_events: same pattern
-- verification_requests: landlord can see own, admin can see all
-- analytics_events_daily: landlord can see own, service-role can read all
```

### 2.8 Triggers (V1 — minimal, 2 only)

```sql
-- Auto-create a landlord_inbox row from a new chat conversation that mentions
-- an apartment. SECURITY DEFINER so the trigger can write the inbox row even
-- when the renter inserting the message has no direct INSERT grant.
--
-- NOTE: the actual schema differs from earlier drafts in two ways:
--   - messages.content (not .body)
--   - messages has no user_id column; renter id lives on conversations.user_id
-- See migration 20260429000000_landlord_v1.sql for the live version.
CREATE OR REPLACE FUNCTION public.auto_create_landlord_inbox_from_message()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id        uuid;
  v_apartment_id   uuid;
  v_landlord_id    uuid;
  v_user_msg_count integer;
  v_already_exists boolean;
BEGIN
  IF NEW.role <> 'user' THEN RETURN NEW; END IF;

  SELECT count(*) INTO v_user_msg_count
    FROM messages WHERE conversation_id = NEW.conversation_id AND role = 'user';
  IF v_user_msg_count <> 1 THEN RETURN NEW; END IF;

  SELECT user_id, NULLIF(session_data->>'apartment_id','')::uuid
    INTO v_user_id, v_apartment_id
    FROM conversations WHERE id = NEW.conversation_id;

  IF v_apartment_id IS NOT NULL THEN
    SELECT landlord_id INTO v_landlord_id FROM apartments WHERE id = v_apartment_id;
  END IF;

  SELECT EXISTS (SELECT 1 FROM landlord_inbox WHERE conversation_id = NEW.conversation_id)
    INTO v_already_exists;
  IF v_already_exists THEN RETURN NEW; END IF;

  INSERT INTO landlord_inbox (channel, conversation_id, apartment_id, landlord_id,
                              renter_id, raw_message, status)
  VALUES ('chat', NEW.conversation_id, v_apartment_id, v_landlord_id,
          v_user_id, NEW.content, 'new');
  RETURN NEW;
END $$;

-- Auto-touch updated_at on every UPDATE — reuses the existing
-- public.update_updated_at() function (already used by leads, etc.).
```

---

## 3. Edge Functions (6 only)

| # | Function | Purpose | Auth | Day shipped |
|---|---|---|---|---|
| 1 | `landlord-onboarding-step` | Persist a step's data on `landlord_profiles` | landlord JWT (own) | D3 |
| 2 | `verification-submit` | Insert `verification_requests` row, notify founder via email | landlord JWT (own) | D3 |
| 3 | `listing-create` | Insert `apartments` row + run auto-moderation rules | landlord JWT | D5 |
| 4 | `listing-update` | Edit own listing + re-trigger auto-mod if photos/address changed | landlord JWT (own) | D17 |
| 5 | `listing-moderate` | Admin approve/reject listing (kept simple — magic-link from email) | admin token | D6 |
| 6 | `lead-classify` | Lightweight: parse `raw_message` → set `structured_profile` (regex + Gemini Flash if needed) | system | D8 |

All 6 follow the existing `_shared/http.ts` + Zod + rate-limit pattern. None of them call the Hermes / Paperclip / OpenClaw stack — agent infra is **not** V1 scope.

### 3.1 Auto-moderation rules (in `listing-create`)

Simple Boolean checks, no ML:

```ts
function autoModerationVerdict(listing): 'auto_approved' | 'needs_review' | 'rejected' {
  const reasons: string[] = [];
  if (listing.photos.length < 5)              reasons.push('photos_lt_5');
  if (!isInMedellinMetro(listing.lat, listing.lng)) reasons.push('outside_medellin');
  if (containsPhoneOrEmail(listing.description)) reasons.push('contact_info_in_description');
  if (listing.price_monthly < 200_000 || listing.price_monthly > 15_000_000) reasons.push('price_out_of_range_cop');
  if (listing.description.length < 80)        reasons.push('description_too_short');
  if (reasons.length === 0)                   return 'auto_approved';
  if (reasons.length === 1)                   return 'needs_review';   // founder reviews via email link
  return 'rejected';
}
```

Target: **80%+ of listings auto-approved without human review**. This is the operational moat — founder time stays on outreach, not moderation.

---

## 4. Frontend Pages (9)

```
NEW pages (9)
─────────────
src/pages/Signup.tsx                         (extend — add AccountTypeStep)
src/pages/host/Onboarding.tsx                3-step wizard
src/pages/host/Dashboard.tsx                 listings list + leads count + quick actions
src/pages/host/ListingNew.tsx                4-step listing form
src/pages/host/ListingEdit.tsx               same component, edit mode
src/pages/host/Leads.tsx                     inbox (cards, filters by status)
src/pages/host/LeadDetail.tsx                lead + WhatsApp deep-link button
src/pages/host/Profile.tsx                   public profile editor
src/pages/HostProfile.tsx                    public profile at /hosts/:id

NEW components (15)
───────────────────
src/components/auth/AccountTypeStep.tsx
src/components/host/layout/HostShell.tsx
src/components/host/layout/HostLeftNav.tsx
src/components/host/layout/RoleProtectedRoute.tsx
src/components/host/onboarding/{Step1Basics,Step2Verification,Step3Welcome}.tsx
src/components/host/listing/ListingForm/{Step1Address,Step2Specs,Step3Photos,Step4Description}.tsx
src/components/host/listing/ListingCard.tsx
src/components/host/listing/ListingMetricsRow.tsx       (inline "12 views · 3 leads · 1 reply")
src/components/host/leads/LeadCard.tsx
src/components/host/leads/LeadStatusFilter.tsx
src/components/host/leads/WhatsAppDeepLinkButton.tsx
src/components/host/HostBadge.tsx                       (verified ✓ + response time)
```

### 4.1 Page-by-page UX summary

| Page | Primary action | What's measured |
|---|---|---|
| `/signup` | Pick "renter" or "landlord" | `landlord_signup_started` event |
| `/host/onboarding` | Complete 3 steps in <3 min | `onboarding_complete` event with duration |
| `/host/dashboard` | Click "Add listing" or "View leads" | `dashboard_view`, click events on each card |
| `/host/listings/new` | Create + publish first listing | `listing_create_step_X` per step + `listing_published` |
| `/host/listings/:id` | Edit price / photos / availability | `listing_edited` with field-name diff |
| `/host/leads` | Click a lead card | `leads_viewed`, `lead_clicked` |
| `/host/leads/:id` | Click "Reply on WhatsApp" | `whatsapp_reply_clicked` (= the proxy for reply intent) |
| `/host/profile` | Edit display_name, bio, photo | `profile_edited` |
| `/hosts/:id` | Renter views host profile | `host_profile_viewed` (renter-side event) |

### 4.2 Mobile (V1 = responsive only, no native app)

Every page wraps in our existing `useIsMobile()` hook. Specific mobile adaptations:

- HostShell collapses to single-column + bottom nav
- Listing form steps go full-screen one-at-a-time
- Lead cards become full-bleed with swipe-to-archive (single column, no filters bar)
- Public host profile reuses existing apartment detail layout patterns

---

## 5. Build Roadmap (Day-by-Day)

### 5.1 Days 1–7: Landlords can sign up + list a property

| Day | Deliverable | Files | Commit |
|---|---|---|---|
| **D1 Mon** | Single migration + types regen — `landlord_profiles` + `apartments` extensions + `landlord_inbox` + `landlord_inbox_events` + `verification_requests` + `analytics_events_daily` + RLS + triggers | `supabase/migrations/20260429000000_landlord_v1.sql` + `src/integrations/supabase/database.types.ts` | `feat(db): landlord V1 schema` |
| **D2 Tue** | Signup branch + AccountTypeStep + post-signup redirect logic | `src/pages/Signup.tsx`, `AccountTypeStep.tsx`, `useAuth.tsx` (extend) | `feat(auth): landlord account-type toggle` |
| **D3 Wed** | Onboarding 3 steps + verification-submit edge fn | `pages/host/Onboarding.tsx`, `Step1Basics.tsx`, `Step2Verification.tsx`, `Step3Welcome.tsx`, `landlord-onboarding-step`, `verification-submit` | `feat(host): onboarding wizard` |
| **D4 Thu** | Listing form Steps 1+2 (address + specs) + photo upload | `ListingForm/Step1Address.tsx` (Google Places autocomplete), `Step2Specs.tsx`, `Step3Photos.tsx`, `lib/storage/upload-listing-photo.ts` | `feat(host): listing form steps 1-3` |
| **D5 Fri** | Listing form Step 4 + listing-create edge fn + auto-moderation rules | `Step4Description.tsx`, `listing-create` | `feat(host): listing creation + auto-moderation` |
| **D6 Sat** | Founder-side admin moderation via magic-link emails (no UI) — `listing-moderate` edge fn callable from email button | `listing-moderate`, `lib/host/admin-emails.ts` | `feat(admin): listing moderation via email links` |
| **D7 Sun** | Host dashboard shell + listings list + RoleProtectedRoute + buffer | `pages/host/Dashboard.tsx`, `HostShell.tsx`, `HostLeftNav.tsx`, `RoleProtectedRoute.tsx`, `ListingCard.tsx` | `feat(host): dashboard + listings list` |

**D7 exit criteria:** signup → onboard → list → auto-moderation → listing visible on `/apartments` for renters. End-to-end on dev + preview.

### 5.2 Days 8–14: Leads inbox + WhatsApp reply

| Day | Deliverable | Files |
|---|---|---|
| **D8 Mon** | `auto_create_lead_from_message` trigger + `lead-classify` edge fn (Gemini Flash for structure extraction) | DB trigger + `lead-classify` |
| **D9 Tue** | Leads inbox UI + filters by status | `pages/host/Leads.tsx`, `LeadCard.tsx`, `LeadStatusFilter.tsx` |
| **D10 Wed** | Lead detail page + WhatsApp deep-link button | `pages/host/LeadDetail.tsx`, `WhatsAppDeepLinkButton.tsx` |
| **D11 Thu** | Email notifications via Resend — new lead, listing approved/rejected | `supabase/functions/send-host-email`, templates in `lib/host/email-templates.ts` |
| **D12 Fri** | Status tag transitions (new → viewed → replied → archived) + `lead_events` writes on each transition | `useLeads.ts` hook + UI buttons |
| **D13 Sat** | PostHog instrumentation: typed events for every landlord action | `lib/posthog.ts` extend AppEvent union with 12 host_* events |
| **D14 Sun** | `analytics_events_daily` aggregation pg_cron + verification of cohort SQL queries | `supabase/migrations/20260506_analytics_aggregator.sql` |

**D14 exit criteria:** a renter can ask about an apartment, the landlord receives an email, opens the lead, clicks "Reply on WhatsApp," and that whole journey is logged. Median time-to-first-reply visible in PostHog.

### 5.3 Days 15–21: Public profile + listing edit + trust

| Day | Deliverable |
|---|---|
| **D15** | Public host profile page `/hosts/:id` (uses `landlord_profiles_public` view) + responsive layout |
| **D16** | "Hosted by [name]" link on `RentalCardInline` + `ApartmentDetail` header |
| **D17** | Listing edit page + photo reorder + soft-archive (`moderation_status = 'archived'`) |
| **D18** | Listing inline metrics row: "12 views · 3 leads · 1 reply this week" — computed from `lead_events` |
| **D19** | Verified badge surface in UI (no fee — just a trust signal). Founder approves via email magic-link |
| **D20** | Response-time tracking — daily aggregation + display on `/hosts/:id` |
| **D21** | Buffer + polish + Spanish-first copy review |

**D21 exit criteria:** a renter can find a listing, see who's hosting it, see how fast they reply, and trust the platform enough to send a message. Landlord can edit anything they posted.

### 5.4 Days 22–30: Founder outreach (engineering pause)

**Engineering during W4 = ONLY fixing things real landlords break.** No new features.

| Day | Founder activity |
|---|---|
| **D22 Mon** | Outreach prep: scripts in Spanish + English, 50-target list (brokers + Facebook Group admins + property managers), tracking spreadsheet |
| **D23 Tue** | First outreach batch: 10 brokers via WhatsApp, 5 Facebook Groups, 3 building walks (Laureles) |
| **D24 Wed** | Same — Poblado + Provenza + Envigado |
| **D25 Thu** | Onboard first 3-5 landlords personally — over WhatsApp, walking them through every step. Capture every friction point. |
| **D26 Fri** | Engineering: fix the top 3 friction points found D25. Probably small UI tweaks, copy clarifications, photo upload edge cases. |
| **D27 Sat** | Outreach batch 2: 20 more brokers + 10 Facebook Group posts + 5 building admins |
| **D28 Sun** | First user interview round: 5 video calls with active landlords. "Walk me through your last week." |
| **D29 Mon** | Second engineering response — fix or skip-with-reason every interview signal |
| **D30 Tue** | **V1 review**: numbers checked against the success criteria below. Decision on V2 scope made from data. |

---

## 6. Founder Growth Plan — How to Get the First 20 Landlords

This is the section the original vision doc was missing. Without supply, no product.

### 6.1 ICP — who we want

| Segment | Why they convert | Where they hang out |
|---|---|---|
| **Mid-tier brokers** (5–25 listings each) | Already paying for FincaRaiz Premium ($50–80/mo); willing to try free alternative | WhatsApp groups for Medellín agents; FincaRaiz / Metrocuadrado public phone numbers |
| **Building admins (administradores)** | Manage 10-50 units; informal landlords; under-served by tech | Walk into Laureles + Poblado buildings, talk to portería |
| **Furnished-rental specialists** | Already targeting nomads (our renter side) | Facebook Group "Apartamentos amoblados Medellín / Furnished apartments Medellin" |
| **Digital-nomad-host individuals** | Single-property owners renting their place when they travel | "Medellín Digital Nomads" Facebook Group; expat WhatsApp groups |
| **Spanish-fluent expat investors** | Own 1-3 furnished apartments; tech-friendly; English + Spanish | Selina / Tinkko / Atom House coworking spaces |

**Anti-ICP (skip in V1):**

- Large property management companies (15+ employees) — sales cycle too long
- Listing aggregators / real-estate agencies — want our data, not our product
- Hotel-style operators (10+ short-term units) — different model, regulatory exposure

### 6.2 Five outreach channels, ranked

| # | Channel | Realistic conversions / 50 attempts | Effort | Best at |
|---|---|---|---|---|
| 1 | **WhatsApp DMs to brokers** | 5–8 / 50 | High | Mid-tier brokers, fast feedback |
| 2 | **Facebook Group posts (5 groups)** | 3–6 / week of posting | Low | Furnished-rental specialists, expat hosts |
| 3 | **Building walks (Laureles + Poblado)** | 2–4 / day of walking | High | Building admins, large supply unlocks |
| 4 | **Coworking flyers (Selina, WeWork, Tinkko, Atom)** | 1–3 / week | Low | Expat hosts, digital nomads |
| 5 | **Referrals from first 5 landlords** | 1–3 referrals × converting at ~50% | Medium | Compounding once we have any landlords |

**Target mix for D22–D30:** 10 from #1, 4 from #2, 4 from #3, 2 from #4. Then #5 kicks in for V1→V2 transition.

### 6.3 Outreach scripts (Spanish, ready to copy-paste)

#### Script A — WhatsApp to broker (cold)

```
Hola [Nombre], qué tal?

Soy [Founder Name], somos un equipo construyendo mdeai.co — una nueva
plataforma para arrendadores en Medellín. Conectamos su apartamento
con nómades digitales y expatriados que ya están buscando.

✓ Es 100% gratis (no cobramos comisión ni mensualidad)
✓ Solo demora 5 min subir un apartamento
✓ Reciben las consultas directo a su WhatsApp

Le interesa probarlo? Le mando el link.

[mdeai.co/host]
```

**Why it works:** specific, short, free, time-bounded ("5 min"), and offers WhatsApp as the channel — which is how Medellín actually works.

#### Script B — Facebook Group post

```
🏠 Arrendadores en Medellín: lanzamos una plataforma 100% GRATIS
para conectar apartamentos amoblados con nómades digitales.

Nada de comisiones. Nada de mensualidades.
Suben sus fotos, reciben consultas en WhatsApp.

Si quieren probarla en beta y dar feedback, les invito acá:
mdeai.co/host

DM si tienen preguntas — soy uno de los fundadores.
```

**Why it works:** addresses the audience directly, anchors free, makes the founder approachable.

#### Script C — Building walk (in-person)

> "Buenos días. Soy [Founder]. Trabajo en una plataforma nueva — mdeai.co — donde conectamos apartamentos amoblados con nómades extranjeros que vienen a Medellín. Es totalmente gratis para el arrendador. ¿Tiene 2 minutos para que le muestre cómo funciona en mi celular?"

**Then:** show the live `/host/onboarding` flow on phone. If they're interested, walk them through right there. Capture WhatsApp number on the way out.

#### Script D — Referral ask (after first landlord onboards)

```
[Nombre], gracias por ser uno de los primeros 20 arrendadores en mdeai.

Como reconocimiento, ustedes los primeros 100 mantienen acceso de
fundador permanente — gratis siempre, sin importar lo que cueste
mdeai en el futuro.

¿Conoce a 1-2 colegas que también arrenden apartamentos en Medellín?
Les puedo extender el mismo trato.
```

**Why it works:** loss aversion (founder status), reciprocity, soft ask (1-2 not 10).

### 6.4 Tracking the funnel

Spreadsheet (Google Sheets, real-time):

| Column | Notes |
|---|---|
| Name | "Maria Hernández" |
| Channel | "WhatsApp / Facebook / Building walk / Coworking / Referral" |
| Source detail | "FincaRaiz - listing #12345" / "Facebook group Apartamentos Amoblados" / "Edificio X in Laureles" |
| First contact date | |
| Replied? | Y/N + date |
| Signed up? | Y/N + landlord_profiles.id |
| Listings published | count |
| Converted to active (replied to ≥1 lead)? | Y/N |
| Notes | "Said price is unclear", "Needs photo upload help" |

Goal: **40% reply rate** (8 of 20 attempts), **40% signup-from-reply** (3 of 8 = ~6 signups per 20 attempts). Hit 20 landlords = 70 attempts. Founder runs ~100 over the 9 days.

### 6.5 Onboarding the first 5 landlords personally

For the first 5 landlords, the founder is on WhatsApp with them in real time as they sign up. They hit a snag — the founder fixes it that day. Every snag becomes a P0 engineering ticket.

This is the most expensive landlord-acquisition cost we'll ever pay, and the most valuable. Each of the first 5 reveals something the next 15 never would.

---

## 7. Metrics To Track

### 7.1 The numbers that matter (quality first)

Posted in a Slack channel, updated daily by a single SQL query. Quality metrics lead — count metrics follow, because 200 leads no one replies to is a bad outcome that *looks* like a good one.

```
DAILY V1 SCORECARD                   Day [N] of 30
─────────────────────────────────────────────────────────
QUALITY (lead first)
  Median time to first WA-click reply     [X] minutes        (target <360)
  Reply rate (WA-click ÷ leads, 7d)        [X] %              (target ≥25%)
  Active landlords (logged ≥3 days, 7d)   [X] / target ⌈signups × 0.4⌉
COUNT (lag indicators)
  Landlord signups (cumulative)            [X] / 10–20 target band
  Listings published (live)                [X] / 25–50 target band
  Leads received (last 24h / cumulative)   [X] / [Y]
RENTER-DEMAND HEALTH (weekly check)
  Renter conversations (7d) vs. baseline   [X] / baseline [Y]  (alert if -25%)
─────────────────────────────────────────────────────────
```

The quality metrics surface "is the loop working" before the count metrics tell us "is the loop big." If quality drops while count holds, fix the experience before more outreach. If renter-demand drops, pause landlord onboarding entirely — empty inboxes churn landlords fast.

### 7.2 PostHog event taxonomy (V1)

12 typed events added to `lib/posthog.ts` AppEvent union:

```ts
| { name: 'landlord_signup_started'; from: 'signup_page' | 'host_redirect' }
| { name: 'landlord_signup_completed'; kind: 'individual' | 'agent' | 'pm' }
| { name: 'onboarding_step_completed'; step: 1 | 2 | 3; durationSec: number }
| { name: 'onboarding_completed'; totalDurationSec: number }
| { name: 'verification_doc_uploaded'; docKind: string }
| { name: 'listing_create_step'; step: 1 | 2 | 3 | 4 }
| { name: 'listing_published'; apartmentId: string; autoModerated: boolean }
| { name: 'listing_edited'; apartmentId: string; field: string }
| { name: 'leads_viewed'; count: number }
| { name: 'lead_card_clicked'; leadId: string; leadAgeMin: number }
| { name: 'whatsapp_reply_clicked'; leadId: string; minutesSinceLeadCreated: number }
| { name: 'lead_status_changed'; leadId: string; from: string; to: string }
```

### 7.3 Cohorts to compute at Day 30

These come from `analytics_events_daily` SQL — used for V2 monetisation decisions:

| Cohort | Definition | What it tells us |
|---|---|---|
| **Power users** | ≥3 listings + ≥10 leads + logged 5+ days | Future $99/mo customers |
| **Engaged casual** | 1-2 listings + ≥3 leads + logged 2-4 days | Future $29/mo customers |
| **Tried-and-quit** | 1 listing + 0 logins after Day 7 | Free forever; not our customer |
| **Power-no-leads** | 3+ listings + 0 leads | Listing quality / SEO problem |
| **High-affiliate-revenue** | Outbound clicks → affiliate $ ≥ $20/mo per landlord | These are *worth* paying us for placement |

### 7.4 Anti-metrics — things we explicitly will NOT track in V1

- Time-to-conversion (no conversion event yet — no payments)
- LTV (premature)
- Churn rate (no subscription state to churn from)
- Revenue per landlord (zero by design)
- NPS (less than 50 landlords; sample too small)

---

## 8. V1 Success Criteria + V2 Decision Gate

### 8.1 V1 outcome bands (Day 30):

Two thresholds. Hitting **Acceptable** means V1 worked enough to choose a V2 direction. Hitting **Stretch** means V1 over-delivered and we have a strong signal for monetisation. Below acceptable → §8.3 kill criteria.

| Metric | Acceptable | Stretch |
|---|---|---|
| Landlord signups | ≥10 | ≥20 |
| Activation (published ≥1 listing) | ≥7 (70%) | ≥15 (75%) |
| Listings live (incl. seed) | ≥25 | ≥50 |
| Leads captured (chat / form / direct) | ≥100 | ≥200 |
| Reply rate (`whatsapp_reply_clicked` ÷ leads) | ≥25% | ≥30% |
| Median time-to-first-reply | <12h | <6h |
| Active landlords (logged 3+ days, D22–D30) | ≥3 | ≥5 |
| Auto-moderation pass rate | ≥60% | ≥75% |

Plus tooling, regardless of band:

- [ ] PostHog dashboard shows daily-engagement breakdown
- [ ] `analytics_events_daily` has 30 days of rows
- [ ] Cohort SQL queries run in <3s
- [ ] Renter-side conversation volume hasn't dropped >25% from D1 baseline

### 8.2 V2 decision matrix

At Day 30 we have data to choose between three V2 directions:

| Cohort signal at Day 30 | Implies | V2 first build |
|---|---|---|
| Top-heavy (5+ power users) | Subscription fits | $29/mo Pro tier + unlimited everything |
| Flat / casual-dominant | Transactional fits | Contact-unlock pricing ($5 per renter contact reveal) |
| Few listings, lots of affiliate clicks | Indirect monetisation | Push aggregator-affiliate revenue; no landlord billing yet |
| Power users but zero leads | Demand problem | V2 spends 30 days on renter-side acquisition, not landlord features |

**No revenue model is decided before Day 30 review.**

### 8.3 Kill criteria — when to pause and reconsider

If by Day 30 any of these hit:

- < 5 landlords signed up despite 100 outreach attempts
- < 20 leads captured total
- Auto-moderation pass rate < 50% (= founder time eaten by ops)
- Founder spent > 60% of D22–D30 on engineering instead of outreach (= product still has friction)

→ **Pause V2 planning**. Spend 14 days finding out what's broken in V1 before building more.

---

## 9. Operational Runbook (for founder + on-call engineer)

### 9.1 Daily founder routine (D22–D30)

Once D11 email-notification automation ships, manual moderation drops from ~30 min/day to <5 min/day. That hour goes back into outreach. Weekly (Mondays), check renter-side conversation volume against D1 baseline — if it dropped >25%, *pause new landlord onboarding* until renter side recovers.

```
07:00  Check overnight signups in landlord_profiles
07:30  Verification queue: approve/reject via signed magic-link emails (≤5 min)
08:00  Daily scorecard SQL → post to Slack
       (Mon only: weekly renter-demand check vs. baseline)
08:30  Reply to any WhatsApp DM responses from outreach
09:00  Outreach block: 10 WhatsApp DMs OR 1 building walk OR 1 Facebook Group post
12:00  User-interview block (if scheduled): 1×30-min video call
13:00  Lunch + clear inbox
14:00  Outreach block 2  (longer once D11 email automation removes manual ops)
17:00  Engineering response: review on-call tickets from new-landlord friction
19:00  End of day: update tracking spreadsheet
```

### 9.2 On-call engineering (D22–D30)

- **P0 fixes only** — anything that blocks a landlord from signing up, listing, or seeing leads
- **No new features**, even if a landlord requests one. Capture in backlog for V2.
- **Bug-fix SLA**: P0 in <4 hours, P1 in <24 hours
- **One PR per fix** — easy to roll back if it breaks something else

### 9.3 Lead-routing for unmatched leads

If a renter chats about a generic search ("rentals in Laureles") without picking a specific listing, the lead has `apartment_id = NULL` and `landlord_id = NULL`. In V1:

- Founder reviews these manually each morning (target <10/day at first)
- Manually assigns to a landlord who has a matching listing (via `admin_assigned` `lead_event`)
- Sends a personal WhatsApp to the renter explaining the match

This doesn't scale past ~100/day, but at <50 it's how we learn what renters actually search for. Automation lands in V2 once we know the patterns.

### 9.4 Verification approval flow (V1 = email magic-link)

When a landlord uploads docs:

1. `verification-submit` edge fn inserts `verification_requests` row
2. Sends founder an email with two action buttons: **Approve** / **Reject (with reason)**
3. Each button URL carries a **signed JWT with 24h expiry** scoped to that single `verification_requests.id` and decision verb. Replay/forward attacks fail after 24h or after first use (token consumed). Use `SUPABASE_JWT_SECRET` for signing — same secret stack as the rest of edge auth.
4. Founder clicks → `verification-decide` edge fn validates signature + expiry + single-use, then updates `landlord_profiles.verification_status`. Landlord notified via email.

No admin UI needed. Total founder time per landlord: ~30 seconds. Token-based approach swaps in for the V2 admin panel without breaking existing email links.

---

## 10. File Inventory

```
NEW (D1–D14)
────────────
supabase/migrations/20260429000000_landlord_v1.sql ─ all 6 tables (landlord_profiles, landlord_inbox, landlord_inbox_events, verification_requests, analytics_events_daily, apartments extensions) + RLS + 3 triggers + landlord_profiles_public view  ✅ SHIPPED D1
supabase/migrations/20260506_analytics_aggregator.sql ─ analytics_events_daily pg_cron job (D14)

supabase/functions/landlord-onboarding-step/        D3
supabase/functions/verification-submit/             D3
supabase/functions/listing-create/                  D5
supabase/functions/listing-update/                  D17
supabase/functions/listing-moderate/                D6
supabase/functions/lead-classify/                   D8
supabase/functions/send-host-email/                 D11

src/pages/host/Onboarding.tsx                       D3
src/pages/host/Dashboard.tsx                        D7
src/pages/host/ListingNew.tsx                       D5
src/pages/host/ListingEdit.tsx                      D17
src/pages/host/Leads.tsx                            D9
src/pages/host/LeadDetail.tsx                       D10
src/pages/host/Profile.tsx                          D15
src/pages/HostProfile.tsx                           D15
src/components/auth/AccountTypeStep.tsx             D2
src/components/host/layout/{HostShell,HostLeftNav,RoleProtectedRoute}.tsx  D7
src/components/host/onboarding/{Step1Basics,Step2Verification,Step3Welcome}.tsx  D3
src/components/host/listing/ListingForm/{Step1Address,Step2Specs,Step3Photos,Step4Description}.tsx  D4-5
src/components/host/listing/{ListingCard,ListingMetricsRow}.tsx  D7,D18
src/components/host/leads/{LeadCard,LeadStatusFilter,WhatsAppDeepLinkButton}.tsx  D9-10
src/components/host/HostBadge.tsx                   D19
src/lib/storage/upload-listing-photo.ts             D4
src/lib/host/admin-emails.ts                        D6
src/lib/host/email-templates.ts                     D11
src/hooks/host/{useLandlordOnboarding,useListings,useLeads}.ts

MODIFIED
────────
src/pages/Signup.tsx                                D2
src/hooks/useAuth.tsx                               D2
src/App.tsx                                         D2 (lazy /host/* routes)
src/lib/posthog.ts                                  D13 (12 new event arms)
src/components/chat/embedded/RentalCardInline.tsx   D16 ("Hosted by" link)
src/integrations/supabase/database.types.ts         D1, D14 (regen)
```

**Total V1 surface:** ~28 new files (9 pages + 15 components + ~4 lib files), ~7 edge functions, 2 migrations, ~6 modified files. Well under one engineer-month.

---

## 11. Companion docs + cross-links

- `tasks/plan/06-landlord-system.md` — long-term vision (12 months). Use it to see where V1 plugs into the bigger picture, not as a build instruction.
- `tasks/CHAT-CENTRAL-PLAN.md` — renter-side state. V1 plugs into existing `conversations` + `messages` tables; nothing on the renter side changes.
- `tasks/todo.md` — live backlog. After Day 30 review, the V2 decision lands here as Phase F2.
- `CLAUDE.md` — current stack reference; edge function patterns; env var conventions.
- `.claude/rules/edge-function-patterns.md` — auth + Zod + rate-limit template all 7 V1 edge fns follow.

---

## 12. Why we'll know it worked

V1 is a *bet*: that free + manual + tiny will get us to 20 landlords + 200 leads in 30 days, and that the resulting behavioural data will tell us what to charge for.

If we're right, V2 begins on Day 31 with a data-driven monetisation choice and a real list of 5 paying-customer candidates.

If we're wrong (kill criteria in §8.3), we pause and figure out what we missed before adding any more features. That's the discipline this doc enforces — *no engineering decision happens without a metric to back it up*.

---

*End of plan v1.0. The 30-day clock starts when the first commit on this branch lands.*
*Last edit: 2026-04-28 · Author: sk · Reviewer: Claude Opus 4.7 (1M context)*
