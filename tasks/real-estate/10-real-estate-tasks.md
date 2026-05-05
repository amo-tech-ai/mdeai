# 10 — Real Estate Vertical: Comprehensive Task Plan

> **Last updated:** 2026-04-04
> **Status:** Planning
> **Scope:** Everything needed to take mdeai.co from current state to production-ready real estate marketplace for Medellin

---

## Table of Contents

1. [Current State Audit](#1-current-state-audit)
2. [User Journeys](#2-user-journeys)
3. [Frontend Tasks](#3-frontend-tasks)
4. [Backend Tasks](#4-backend-tasks)
5. [UI/UX Tasks](#5-uiux-tasks)
6. [Content & Data Tasks](#6-content--data-tasks)
7. [Wiring & Integration Tasks](#7-wiring--integration-tasks)
8. [Priority Matrix](#8-priority-matrix)

---

## 1. Current State Audit

### Working

| Area | Component | Path |
|------|-----------|------|
| Rentals Intake Wizard | Conversational AI filter collection via Gemini 3.1 Pro | `src/components/rentals/RentalsIntakeWizard.tsx` |
| Rentals Wizard Form | Wrapper with manual filter fallback | `src/components/rentals/RentalsWizardForm.tsx` |
| Rentals Search Results | Scored/ranked results display | `src/components/rentals/RentalsSearchResults.tsx` |
| Rentals Listing Detail | Detail view in right panel | `src/components/rentals/RentalsListingDetail.tsx` |
| Rentals Page | Full wizard->results->detail flow in ThreePanelLayout | `src/pages/Rentals.tsx` |
| Rentals Edge Function | Intake + search actions with Gemini tool calling | `supabase/functions/rentals/index.ts` |
| AI Chat | 4-tab FloatingChatWidget (concierge/trips/explore/bookings) | `supabase/functions/ai-chat/index.ts` |
| AI Router | Intent classification (EXPLORE/BOOK/TRIP/SEARCH/MEMORY/GENERAL) | `supabase/functions/ai-router/index.ts` |
| AI Search | Semantic search via pgvector | `supabase/functions/ai-search/index.ts` |
| Auth | Supabase Auth (email + Google OAuth) | `src/hooks/useAuth.tsx` |
| Admin Auth | Role-based via `user_roles` table (admin/super_admin/moderator) | `src/hooks/useAdminAuth.ts` |
| Admin CRUD | Apartments, cars, restaurants, events with forms | `src/components/admin/` (14 files) |
| Apartment Types | Full `Apartment` interface with 40+ fields including `host_id`, `freshness_status` | `src/types/listings.ts` |
| Three-Panel Layout | Left/Main/Right panel system with mobile collapse | `src/components/explore/ThreePanelLayout.tsx` |
| Dashboard | Stats, bookings, recommendations | `src/pages/Dashboard.tsx` |
| Commerce | Shopify + Gadget integration, cart hook | `src/hooks/useShopifyCart.ts` |
| Database | 28+ tables with RLS, pgvector, PostGIS enabled | `supabase/migrations/` |
| Components | 152+ React components, 31 hooks, 44 pages | `src/` |

### Missing for Real Estate Production

| Gap | Impact | Blocks |
|-----|--------|--------|
| No landlord-facing features | Cannot acquire supply | Everything |
| No showing scheduler | Renters cannot visit properties | Conversion |
| No application/lease workflow | Cannot close deals | Revenue |
| No property document management | Cannot verify listings | Trust |
| No landlord dashboard | Cannot manage properties | Supply retention |
| No tenant verification | Cannot vet renters | Landlord trust |
| No deposit/rent payment integration | Cannot collect money | Revenue |
| No WhatsApp/Telegram channel (OpenClaw) | Missing primary LATAM channel | Reach |
| No agent orchestration (Paperclip) | No automated operations | Scale |
| No deep reasoning (Hermes) | No property analysis or lead scoring | Intelligence |
| No automated prospecting/outreach | Cannot acquire landlords at scale | Growth |
| No CRM for landlord acquisition | Cannot track pipeline | Sales |
| No lease generation or review | Manual legal work | Efficiency |
| No maintenance request system | Cannot support tenants post-move-in | Retention |
| No property analytics | No occupancy, revenue, or price trend data | Decision-making |
| 0 rows in apartments table | No listings to show | Everything |
| 0 rows in all 28 tables | No seed data at all | Development/testing |

---

## 2. User Journeys

### Journey 1: Renter (Digital Nomad / Expat)

**Persona:** Sofia, 29, remote UX designer from Berlin. Arriving in Medellin in 3 weeks. Needs furnished 2BR with strong WiFi in a safe neighborhood. Budget: $800-1200/mo.

**Flow:**

```
1. DISCOVER    Sofia finds mdeai via Google ("apartments Medellin digital nomad") or Instagram ad
                → Lands on homepage or /rentals directly

2. EXPLORE     Opens /rentals page
                → ThreePanelLayout: left=filters, main=wizard, right=map
                → RentalsIntakeWizard greets her conversationally

3. DESCRIBE    Types: "2BR furnished in Laureles or Poblado, $800-1200/mo, strong WiFi, I have a cat"
                → Gemini extracts: bedrooms=2, budget_min=800, budget_max=1200, neighborhoods=[Laureles, Poblado],
                  furnished=true, pets=true, amenities=[WiFi]
                → Wizard asks 1-2 follow-up: "When do you want to move in?" / "How long are you staying?"

4. RESULTS     Intake complete → rentals edge function queries apartments table
                → RentalsSearchResults shows scored/ranked listings
                → Map pins update in right panel
                → Each card shows: price, freshness badge, WiFi speed, neighborhood, pet policy

5. DETAIL      Clicks a listing → RentalsListingDetail opens in right panel
                → Photos, floor plan, neighborhood intelligence (walkability, cafes, safety)
                → AI-generated summary: "This 2BR in Laureles checks all your boxes..."
                → Availability calendar visible

6. SCHEDULE    Clicks "Schedule Showing" → calendar widget with available time slots
                → Picks date/time → confirms → receives WhatsApp/email confirmation
                → Landlord gets notification with Sofia's profile summary

7. APPLY       After showing (or before, if confident), clicks "Apply Now"
                → Multi-step application form:
                  Step 1: Personal info (name, nationality, profession, LinkedIn)
                  Step 2: Stay details (move-in date, duration, number of occupants)
                  Step 3: Documents (passport, proof of income, references)
                  Step 4: Review & submit
                → Application saved to `applications` table
                → Landlord notified with AI-generated applicant summary

8. APPROVAL    Landlord reviews in landlord dashboard → approves with one click
                → Sofia gets notification: "Your application was approved!"
                → Lease generated from template with pre-filled details

9. SIGN        Sofia reviews digital lease in lease viewer component
                → E-signature integration (DocuSign or simple click-to-sign MVP)
                → Both parties sign → lease stored in `leases` table
                → Deposit payment link sent (Stripe Connect or Wompi)

10. MOVE-IN    Sofia receives move-in guide:
                → Key pickup instructions, WiFi password, building rules
                → Neighborhood guide: nearby cafes, coworking, grocery, gym
                → Emergency contacts, utility info
                → "Your concierge is ready" — links to FloatingChatWidget

11. ONGOING    Uses mdeai concierge for restaurants, events, transportation
                → Can submit maintenance requests through the app
                → Gets neighborhood event notifications
                → Renewal reminder 30 days before lease end
```

**Key touchpoints requiring new code:**
- Steps 6-10 are entirely new features
- Steps 3-5 exist but need enhancement (map integration, freshness, neighborhood intelligence)

---

### Journey 2: Landlord (Property Owner)

**Persona:** Carlos, 45, owns 3 apartments in El Poblado. Currently lists on FincaRaiz and Airbnb. Wants a better tenant pipeline with less effort.

**Flow:**

```
1. DISCOVER    Carlos receives personalized outreach from Sun AI (OpenClaw)
                → Email/WhatsApp: "We matched 12 qualified tenants to your Poblado apartments this week"
                → Or: referred by another landlord already on the platform

2. SIGNUP      Visits mdeai.co/landlord-onboarding
                → Separate onboarding wizard from renter flow
                → Step 1: Basic info (name, phone, email)
                → Step 2: Business info (company name, RUT/NIT, number of properties)
                → Step 3: Verification (ID upload, property ownership docs)
                → Step 4: Payout setup (bank account for COP deposits)
                → Creates `landlord_profiles` record linked to `profiles`

3. LIST        Clicks "Add Property" → guided listing form
                → Step 1: Basic details (address, type, bedrooms, bathrooms)
                → Step 2: Photos (drag-and-drop upload, minimum 5, AI quality check)
                → Step 3: Amenities & features (checkboxes + freeform)
                → Step 4: Pricing (monthly rate, deposit, utilities)
                → Step 5: AI-assisted description generation
                  → "Based on your photos and details, here's a suggested listing..."
                  → Carlos edits and approves (propose-only pattern)
                → Step 6: Availability settings (calendar, minimum stay)
                → Listing enters moderation queue → admin approves → goes live

4. PRICING     AI market comparison panel shows:
                → "Similar 2BR in Poblado: $900-1400/mo"
                → "Your listing at $1100 is competitively priced"
                → "Suggestion: Adding WiFi speed would increase inquiries by ~20%"
                → Carlos adjusts price based on data

5. RECEIVE     Qualified applications arrive in landlord dashboard
                → Each application shows:
                  - AI-generated applicant summary (profession, nationality, stay length)
                  - Document verification status
                  - Match score (how well tenant matches listing criteria)
                → Carlos can view full application, chat with applicant, or quick-approve/reject

6. APPROVE     One-click approve → triggers lease generation
                → Pre-filled lease from Colombian-compliant template
                → Carlos reviews, adds any custom terms
                → Sends to tenant for signature

7. MANAGE      Landlord dashboard shows:
                → Active listings with performance metrics (views, inquiries, conversion rate)
                → Current tenants with lease status and payment tracking
                → Maintenance requests with priority and status
                → Revenue overview (monthly income, upcoming payments, occupancy rate)

8. ANALYTICS   Portfolio analytics panel:
                → Occupancy rate across all properties
                → Revenue trends (monthly, quarterly)
                → Market position (how listings compare to similar properties)
                → AI recommendations: "Consider raising rent by 5% — market has moved up"
```

**Key touchpoints requiring new code:**
- Entire journey is new (Steps 1-8)
- Landlord onboarding wizard, dashboard, listing form, application review, analytics

---

### Journey 3: Expat Already in Medellin (WhatsApp-first)

**Persona:** Jake, 34, developer from Austin. Already in Medellin for 6 months, lease ending. Prefers WhatsApp over web apps.

**Flow:**

```
1. MESSAGE     Jake texts mdeai WhatsApp number: "Hey, my lease ends in 3 weeks, need a new place"
                → OpenClaw receives message via WhatsApp Business API (Infobip)
                → Routes to ai-chat edge function with BOOK intent

2. CONTEXT     AI recalls Jake's profile from previous interactions:
                → "Welcome back Jake! Last time you were looking at places in Laureles."
                → "Your current place is a 1BR at $700/mo. Want something similar or different?"
                → Pulls from `conversations` + `messages` + `profiles` tables

3. REFINE      Jake: "Actually, I want to upgrade. 2BR, up to $1000, still Laureles or Envigado"
                → AI runs intake extraction (same as web wizard but via WhatsApp)
                → Returns 3-5 top matches as WhatsApp carousel cards

4. SHOW        Jake: "Number 2 looks great, can I see it tomorrow?"
                → AI checks availability via `showings` table
                → "Available tomorrow at 10am, 2pm, or 4pm. Which works?"
                → Jake picks 2pm → showing booked → both parties notified

5. APPLY       Jake: "I want this one. Can I apply?"
                → AI sends application link (deep link to web app, pre-filled)
                → Or: collects info conversationally and submits on Jake's behalf
                → "I'll need your passport, proof of income, and a reference. Can you send those?"

6. SIGN        Lease sent via WhatsApp as PDF link
                → Jake reviews and signs on mobile web
                → Deposit payment link sent
                → Move-in guide delivered as WhatsApp message series
```

**Key touchpoints requiring new code:**
- OpenClaw WhatsApp integration (Infobip already has env vars configured)
- Conversational application flow via chat
- Deep linking from WhatsApp to web app
- WhatsApp message templates (carousel, media, buttons)

---

### Journey 4: Sun AI Sales (Automated Landlord Acquisition)

**Persona:** Not a human user — this is the autonomous AI sales pipeline managed by Paperclip.

**Flow:**

```
1. TASK         Paperclip CEO agent assigns weekly prospecting task:
                 → "Find 20 new landlord prospects in Poblado and Laureles with 2+ listings"
                 → Task created in `agent_jobs` table with budget and deadline

2. PROSPECT     OpenClaw scrapes/searches target sources:
                 → FincaRaiz.com.co (primary Colombian rental marketplace)
                 → Metrocuadrado.com (secondary marketplace)
                 → Airbnb (landlords with multiple listings)
                 → Extracts: listing URL, landlord name/phone, property details, pricing

3. ANALYZE      Hermes deep-reasons on each prospect:
                 → Listing quality score (photos, description completeness, pricing competitiveness)
                 → Response time analysis (how quickly they typically reply)
                 → Portfolio analysis (how many listings, what areas, price range)
                 → Pain point assessment (are they getting enough inquiries?)
                 → Writes analysis to `ai_context` table

4. SCORE        Hermes ranks prospects by likelihood to convert:
                 → High: 5+ listings, slow response times (overwhelmed), competitive pricing
                 → Medium: 2-4 listings, moderate response times
                 → Low: 1 listing, responsive (probably fine with current setup)

5. OUTREACH     OpenClaw sends personalized outreach:
                 → Channel: WhatsApp (preferred in Colombia) or email
                 → Template: "Hola [name], vi tus apartamentos en [neighborhood].
                   Tenemos [X] inquilinos calificados buscando en esa zona este mes..."
                 → Personalized with actual demand data from renter searches

6. REPLY        Reply handling:
                 → Positive: Route to onboarding flow (Journey 2, Step 2)
                 → Question: OpenClaw answers with pre-approved responses
                 → Negative: Mark as "not interested", schedule follow-up in 3 months
                 → No reply: Follow up once after 3 days, then mark dormant

7. REPORT       Paperclip generates weekly report:
                 → Prospects found, outreach sent, replies received, onboarded
                 → Pipeline value (estimated monthly revenue from prospects)
                 → Logged to `ai_runs` table for audit trail
```

**Key touchpoints requiring new code:**
- Paperclip agent framework setup (org chart, task system, budget enforcement)
- OpenClaw scraping/outreach capabilities
- Hermes analysis skills for property and lead scoring
- CRM tables for prospect tracking
- WhatsApp template messages for outreach

---

### Journey 5: Property Manager (Multi-unit Portfolio)

**Persona:** Maria, 38, manages 15 apartments across Poblado, Laureles, and Envigado for multiple owners. Uses Excel and WhatsApp groups currently.

**Flow:**

```
1. ONBOARD     Maria signs up as property manager (extended landlord onboarding)
                → Links multiple property owners to her account
                → Bulk imports existing listings (CSV upload or manual entry)
                → Sets commission structure per owner

2. PORTFOLIO    Portfolio dashboard shows:
                → All 15 properties in a sortable/filterable table
                → Occupancy heatmap by neighborhood and month
                → Revenue breakdown by property and owner
                → Upcoming lease expirations (renewal pipeline)
                → Maintenance request queue across all properties

3. BULK OPS    Bulk operations:
                → Update pricing across multiple listings (seasonal adjustments)
                → Publish/unpublish listings in batches
                → Generate monthly owner reports (revenue, expenses, net income)
                → Schedule showings across properties from single calendar

4. TENANTS     Tenant communication hub:
                → Unified inbox for all tenant messages
                → Automated payment reminders
                → Maintenance request triage (auto-categorize, auto-assign)
                → Lease renewal automation (reminders, new lease generation)

5. ANALYTICS   Portfolio analytics:
                → Revenue per square meter by neighborhood
                → Average days to lease by property type
                → Tenant retention rate
                → Market comparison (portfolio vs market averages)
                → AI recommendations: "Property #7 has been vacant 45 days.
                  Consider reducing price by 10% — similar units lease in 18 days at $950"
```

**Key touchpoints requiring new code:**
- Property manager role + multi-owner linking
- Bulk operations UI
- Portfolio analytics dashboard
- Unified communication inbox
- Owner reporting system

---

## 3. Frontend Tasks

### 3.1 Renter-Facing

| ID | Priority | Task | Description | Dependencies | Files to Create/Modify | Effort |
|----|----------|------|-------------|--------------|----------------------|--------|
| FE-R01 | P0 | Enhance RentalsIntakeWizard with map | Show neighborhood map pins during intake; update map as neighborhoods are discussed | Map component exists | `src/components/rentals/RentalsIntakeWizard.tsx`, new: `src/components/rentals/RentalsIntakeMap.tsx` | M |
| FE-R02 | P0 | Showing scheduler component | Calendar widget with available time slots; date/time picker with landlord availability | BE-EF01, DB-01 | New: `src/components/rentals/ShowingScheduler.tsx`, `src/hooks/useShowings.ts` | L |
| FE-R03 | P0 | Rental application form | Multi-step form: personal info, stay details, document upload, review/submit. Uses react-hook-form + Zod | BE-EF02, DB-02 | New: `src/components/rentals/RentalApplication.tsx`, `src/components/rentals/ApplicationSteps/` (4 step components), `src/hooks/useApplications.ts` | L |
| FE-R04 | P1 | Lease viewer + e-signature | PDF display of generated lease; click-to-sign MVP (full DocuSign later) | BE-EF06, DB-04 | New: `src/components/rentals/LeaseViewer.tsx`, `src/components/rentals/LeaseSignature.tsx`, `src/hooks/useLeases.ts` | L |
| FE-R05 | P1 | Move-in guide page | Post-approval guide: keys, WiFi, neighborhood tips, concierge link. Personalized per listing | DB-04 | New: `src/pages/MoveInGuide.tsx`, `src/components/rentals/MoveInChecklist.tsx` | M |
| FE-R06 | P1 | Property comparison view | Side-by-side comparison of 2-3 listings; highlight differences in price, amenities, location | Existing results | New: `src/components/rentals/PropertyComparison.tsx` | M |
| FE-R07 | P1 | Enhanced listing detail with neighborhood intelligence | Right panel shows walkability score, nearby cafes/coworking, safety rating, transit access | Google Places API | Modify: `src/components/rentals/RentalsListingDetail.tsx`, new: `src/components/rentals/NeighborhoodIntelligence.tsx` | M |
| FE-R08 | P2 | Virtual tour viewer | 360-degree photo viewer or embedded video tour | `virtual_tour_url` field exists on Apartment type | New: `src/components/rentals/VirtualTourViewer.tsx` | S |
| FE-R09 | P2 | Roommate matching feature | Optional: match tenants looking for shared apartments | New DB table | New: `src/components/rentals/RoommateMatch.tsx`, `src/hooks/useRoommateMatch.ts` | L |

### 3.2 Landlord-Facing

| ID | Priority | Task | Description | Dependencies | Files to Create/Modify | Effort |
|----|----------|------|-------------|--------------|----------------------|--------|
| FE-L01 | P0 | Landlord onboarding wizard | 4-step guided onboarding: basic info, business info, verification docs, payout setup | BE-EF03, DB-00 | New: `src/pages/LandlordOnboarding.tsx`, `src/components/landlord/OnboardingWizard.tsx`, `src/components/landlord/OnboardingSteps/` (4 step components) | L |
| FE-L02 | P0 | Landlord dashboard page | Overview: active listings, pending applications, revenue summary, recent activity | DB-00, FE-L03 | New: `src/pages/LandlordDashboard.tsx`, `src/components/landlord/DashboardStats.tsx`, `src/components/landlord/RecentActivity.tsx` | L |
| FE-L03 | P0 | Property listing form | Guided multi-step: details, photos, amenities, pricing, AI description, availability | BE-EF03 | New: `src/components/landlord/PropertyListingForm.tsx`, `src/components/landlord/ListingSteps/` (6 step components), `src/hooks/useLandlordListings.ts` | XL |
| FE-L04 | P1 | Application review interface | View applications with AI summary, documents, match score; approve/reject actions | FE-R03, DB-02 | New: `src/components/landlord/ApplicationReview.tsx`, `src/components/landlord/ApplicantCard.tsx`, `src/components/landlord/ApplicationDetail.tsx` | L |
| FE-L05 | P1 | Tenant management view | Active tenants list, lease status, payment history, communication | DB-04 | New: `src/components/landlord/TenantManagement.tsx`, `src/components/landlord/TenantCard.tsx` | M |
| FE-L06 | P1 | Revenue/occupancy analytics charts | Charts: monthly revenue, occupancy rate over time, price vs market comparison | BE-EF05, DB-06 | New: `src/components/landlord/AnalyticsCharts.tsx`, `src/hooks/usePropertyAnalytics.ts` (using Recharts or similar) | L |
| FE-L07 | P2 | Maintenance request management | View/triage/respond to tenant maintenance requests; status tracking | DB-05 | New: `src/components/landlord/MaintenanceQueue.tsx`, `src/components/landlord/MaintenanceDetail.tsx` | M |
| FE-L08 | P2 | Bulk listing management | Multi-select listings, bulk price update, bulk publish/unpublish | FE-L03 | New: `src/components/landlord/BulkListingActions.tsx` | M |

### 3.3 Admin

| ID | Priority | Task | Description | Dependencies | Files to Create/Modify | Effort |
|----|----------|------|-------------|--------------|----------------------|--------|
| FE-A01 | P0 | Fix admin auth guards | Audit `useAdminAuth` — currently queries `user_roles` table but no RLS policy verification; ensure admin routes are truly protected | None | Modify: `src/hooks/useAdminAuth.ts`, `src/components/admin/AdminProtectedRoute.tsx` | S |
| FE-A02 | P1 | Landlord verification workflow | Admin UI to review landlord verification docs, approve/reject with notes | DB-00 | New: `src/components/admin/LandlordVerification.tsx`, new page: `src/pages/admin/LandlordVerification.tsx` | M |
| FE-A03 | P1 | Property moderation queue | Admin UI to review new listings before they go live; approve/reject/request changes | DB-00 | New: `src/components/admin/PropertyModeration.tsx`, new page: `src/pages/admin/PropertyModeration.tsx` | M |
| FE-A04 | P2 | Platform analytics dashboard | Admin-wide: total listings, active renters, conversion funnels, revenue metrics | BE-EF05 | New: `src/pages/admin/PlatformAnalytics.tsx`, `src/components/admin/PlatformStatsCards.tsx`, `src/components/admin/ConversionFunnel.tsx` | L |

---

## 4. Backend Tasks

### 4.1 Database — New Tables

| ID | Priority | Table | Key Columns | RLS Policy | Notes |
|----|----------|-------|-------------|------------|-------|
| DB-00 | P0 | `landlord_profiles` | `id`, `user_id` (FK profiles), `business_name`, `rut_nit`, `properties_count`, `verified` (bool), `verification_status` (enum: pending/approved/rejected), `verification_docs` (jsonb), `payout_bank_name`, `payout_account_number`, `payout_account_type`, `commission_rate` (decimal), `created_at`, `updated_at` | SELECT: own record or admin; INSERT: authenticated; UPDATE: own record or admin | Links to existing `profiles` table via `user_id` |
| DB-01 | P0 | `showings` | `id`, `apartment_id` (FK apartments), `renter_id` (FK profiles), `landlord_id` (FK profiles), `scheduled_at` (timestamptz), `duration_minutes` (int, default 30), `status` (enum: requested/confirmed/completed/cancelled/no_show), `notes` (text), `renter_message` (text), `landlord_response` (text), `created_at`, `updated_at` | SELECT: own showings (renter or landlord) or admin; INSERT: authenticated; UPDATE: participants or admin | Index on `apartment_id`, `scheduled_at`, `status` |
| DB-02 | P0 | `applications` | `id`, `apartment_id` (FK apartments), `renter_id` (FK profiles), `landlord_id` (FK profiles), `status` (enum: draft/submitted/under_review/approved/rejected/withdrawn), `personal_info` (jsonb: name, nationality, profession, linkedin, phone), `stay_details` (jsonb: move_in_date, duration_months, occupants), `documents` (jsonb: array of {type, file_url, verified}), `references` (jsonb), `ai_summary` (text), `match_score` (int 0-100), `landlord_notes` (text), `submitted_at`, `reviewed_at`, `created_at`, `updated_at` | SELECT: own applications (renter or landlord) or admin; INSERT: authenticated renter; UPDATE: participants or admin | Unique constraint on (apartment_id, renter_id, status != withdrawn) |
| DB-03 | P0 | `landlord_availability` | `id`, `landlord_id` (FK profiles), `apartment_id` (FK apartments, nullable for all properties), `day_of_week` (int 0-6), `start_time` (time), `end_time` (time), `is_available` (bool), `created_at` | SELECT: public; INSERT/UPDATE: own records | Showing scheduler uses this to offer time slots |
| DB-04 | P1 | `leases` | `id`, `apartment_id` (FK apartments), `tenant_id` (FK profiles), `landlord_id` (FK profiles), `application_id` (FK applications), `start_date`, `end_date`, `monthly_rent` (decimal), `currency`, `deposit_amount` (decimal), `deposit_paid` (bool), `status` (enum: draft/pending_signature/active/expired/terminated), `document_url` (text), `signed_by_tenant_at`, `signed_by_landlord_at`, `terms` (jsonb), `created_at`, `updated_at` | SELECT: own leases; INSERT: admin or landlord; UPDATE: participants or admin | Generated from template by lease-generation edge function |
| DB-05 | P1 | `maintenance_requests` | `id`, `apartment_id` (FK apartments), `tenant_id` (FK profiles), `landlord_id` (FK profiles), `lease_id` (FK leases), `title`, `description`, `category` (enum: plumbing/electrical/appliance/structural/pest/other), `priority` (enum: low/medium/high/emergency), `status` (enum: submitted/acknowledged/in_progress/resolved/closed), `photos` (text[]), `resolution_notes` (text), `resolved_at`, `created_at`, `updated_at` | SELECT: own requests; INSERT: tenant with active lease; UPDATE: participants or admin | Tenant submits; landlord manages |
| DB-06 | P1 | `property_documents` | `id`, `apartment_id` (FK apartments), `uploaded_by` (FK profiles), `type` (enum: ownership_deed/utility_bill/photos/floor_plan/insurance/other), `file_url`, `file_name`, `file_size_bytes`, `verified` (bool), `verified_by` (FK profiles, nullable), `created_at` | SELECT: owner + admin; INSERT: owner; UPDATE: admin (verification only) | Stored in Supabase Storage bucket |
| DB-07 | P2 | `property_analytics` | `id`, `apartment_id` (FK apartments), `period_start` (date), `period_end` (date), `views` (int), `inquiries` (int), `showings_scheduled` (int), `showings_completed` (int), `applications_received` (int), `avg_days_to_lease` (int), `occupancy_rate` (decimal), `revenue` (decimal), `created_at` | SELECT: owner + admin; INSERT: system only (edge function) | Aggregated daily/weekly by analytics edge function |
| DB-08 | P2 | `rent_payments` | `id`, `lease_id` (FK leases), `amount` (decimal), `currency`, `due_date`, `paid_date`, `status` (enum: pending/paid/overdue/partial/refunded), `payment_method`, `transaction_id`, `receipt_url`, `created_at` | SELECT: own payments (tenant or landlord) or admin; INSERT: system; UPDATE: system | Integrates with Stripe Connect or Wompi |
| DB-09 | P2 | `prospect_pipeline` | `id`, `source` (enum: fincaraiz/metrocuadrado/airbnb/referral/manual), `source_url`, `landlord_name`, `phone`, `email`, `properties_count` (int), `neighborhoods` (text[]), `quality_score` (int 0-100), `status` (enum: new/contacted/replied/qualified/onboarding/converted/rejected/dormant), `outreach_channel` (enum: whatsapp/email), `outreach_sent_at`, `last_reply_at`, `agent_notes` (text), `assigned_to` (text), `created_at`, `updated_at` | SELECT: admin only; INSERT: system (agents); UPDATE: system or admin | Paperclip/OpenClaw prospecting pipeline |

### 4.2 Database — Modify Existing Tables

| ID | Priority | Table | Change | Notes |
|----|----------|-------|--------|-------|
| DB-M01 | P0 | `apartments` | Add column `landlord_id` (FK landlord_profiles, nullable), `moderation_status` (enum: pending/approved/rejected, default approved for existing), `rejection_reason` (text) | Currently `host_id` exists but no landlord profile link |
| DB-M02 | P0 | `profiles` | Add column `account_type` (enum: renter/landlord/property_manager/admin, default renter), `phone` (text), `nationality` (text), `profession` (text) | Distinguish user types |
| DB-M03 | P1 | `apartments` | Add columns `lease_status` (enum: available/showing/application/leased), `current_tenant_id` (FK profiles, nullable), `current_lease_id` (FK leases, nullable) | Track real-time occupancy state |

### 4.3 Edge Functions — New

| ID | Priority | Function | Actions | AI Model | Notes |
|----|----------|----------|---------|----------|-------|
| BE-EF01 | P0 | `showing-scheduler` | `check_availability` — returns open slots from landlord_availability + existing showings; `schedule` — creates showing record + sends notifications; `cancel` — cancels with reason; `reschedule` — updates time | None (pure CRUD) | Rate limit: 10 req/min/user |
| BE-EF02 | P0 | `application-management` | `submit` — validates + saves application + generates AI summary; `review` — landlord approve/reject; `withdraw` — renter withdraws; `get_status` — check application status | `gemini-3-flash-preview` (summary generation) | Generates `ai_summary` and `match_score` on submit |
| BE-EF03 | P0 | `landlord-onboarding` | `create_profile` — validates + saves landlord profile; `upload_docs` — handles verification document upload; `submit_verification` — sends to admin review queue; `get_status` — check verification status | None | Service role for admin operations |
| BE-EF04 | P1 | `ai-chat` enhancement | Add tools: `schedule_showing`, `submit_application`, `check_availability`, `get_landlord_listings`, `get_application_status` | Already uses `gemini-3-flash-preview` | Extend existing `supabase/functions/ai-chat/index.ts` |
| BE-EF05 | P1 | `property-analytics` | `aggregate` — compute daily/weekly analytics per property; `portfolio` — aggregate across all landlord properties; `market_comparison` — compare to similar listings; `recommendations` — AI pricing/optimization suggestions | `gemini-3-flash-preview` (recommendations only) | Runs on schedule (cron) or on-demand |
| BE-EF06 | P2 | `lease-generation` | `generate` — create lease PDF from template + application data; `validate` — check lease terms against Colombian law rules; `sign` — record signature | `gemini-3-flash-preview` (validation) | Uses Supabase Storage for PDF storage |
| BE-EF07 | P2 | `maintenance-request` | `create` — submit request with photos; `update_status` — landlord updates; `auto_categorize` — AI categorizes and sets priority | `gemini-3.1-flash-lite-preview` (categorization) | Photo upload via Supabase Storage |

### 4.4 Edge Functions — Modify Existing

| ID | Priority | Function | Change | Notes |
|----|----------|----------|--------|-------|
| BE-EM01 | P0 | `rentals` | Add `schedule_showing` action that delegates to showing-scheduler; add `apply` action that links to application-management | `supabase/functions/rentals/index.ts` |
| BE-EM02 | P1 | `ai-chat` | Add real estate tools: `schedule_showing`, `submit_application`, `check_availability`, `search_by_landlord` | `supabase/functions/ai-chat/index.ts` |
| BE-EM03 | P1 | `ai-search` | Add landlord-facing search: "show me my vacant properties" / "applications pending for Poblado apartment" | `supabase/functions/ai-search/index.ts` |
| BE-EM04 | P1 | `ai-router` | Add intents: `SHOW` (schedule showing), `APPLY` (rental application), `MANAGE` (landlord operations) | `supabase/functions/ai-router/index.ts` |

### 4.5 Agents (Paperclip + OpenClaw + Hermes)

| ID | Priority | Agent | Task | Description | Dependencies |
|----|----------|-------|------|-------------|--------------|
| AG-01 | P1 | Paperclip | Framework setup | Set up Paperclip org chart: CEO agent → Sales Manager → Prospecting Workers; define budget enforcement rules; configure heartbeat schedule (daily check-in); create task templates for prospecting, outreach, reporting | `agent_jobs` table exists |
| AG-02 | P1 | OpenClaw | WhatsApp channel | Connect OpenClaw to Infobip WhatsApp Business API (env vars already configured: `INFOBIP_API_KEY`, `INFOBIP_BASE_URL`, `INFOBIP_PHONE_NUMBER`); implement message receive/send handlers; route incoming messages to ai-chat edge function with WhatsApp context | Infobip account active |
| AG-03 | P1 | OpenClaw | Outreach templates | Create WhatsApp + email templates for landlord outreach: initial contact, follow-up, onboarding invitation; must comply with WhatsApp Business API template rules | AG-02 |
| AG-04 | P1 | Hermes | Property analysis skill | Skill that analyzes a listing: photo quality score, description completeness, pricing vs market, amenity competitiveness; writes analysis to `ai_context` table | Supabase MCP connection |
| AG-05 | P1 | Hermes | Lead scoring skill | Skill that scores landlord prospects: portfolio size, response patterns, listing quality, pain indicators; outputs score + reasoning | AG-04 |
| AG-06 | P2 | OpenClaw | Scraping pipeline | Scrape FincaRaiz and Metrocuadrado for landlord prospects; extract listing details, contact info, pricing; populate `prospect_pipeline` table | DB-09 |
| AG-07 | P2 | Hermes | Lease review skill | Analyze lease documents for Colombian law compliance; flag missing clauses, unusual terms, tenant-unfavorable conditions | Colombian law templates |
| AG-08 | P2 | Paperclip | Reporting automation | Weekly pipeline report: prospects found, outreach sent, replies received, conversions; monthly platform report: listings, tenants, revenue, churn | AG-01, DB-09 |

---

## 5. UI/UX Tasks

| ID | Priority | Task | Description | Deliverable | Effort |
|----|----------|------|-------------|-------------|--------|
| UX-01 | P0 | Landlord onboarding flow design | Mobile-first 4-step wizard; must feel distinct from renter onboarding; progress indicator, save-and-resume | Figma mockups or component specs | M |
| UX-02 | P0 | Showing scheduler interaction | Calendar integration with time slot selection; confirmation flow with WhatsApp/email notification preview | Interaction spec | S |
| UX-03 | P0 | Application form design | Multi-step form with progress indicator, document upload zone, review-before-submit summary | Component specs for 4 steps | M |
| UX-04 | P1 | Landlord dashboard layout | ThreePanelLayout adaptation: left=property list, main=selected property detail/stats, right=quick actions/notifications | Wireframes | M |
| UX-05 | P1 | Lease signing experience | Mobile-friendly lease display, scroll-to-sign, signature capture, confirmation state | Interaction flow | M |
| UX-06 | P1 | WhatsApp conversation templates | Carousel card layouts for listings, quick reply buttons for scheduling, rich media for property photos | Template specs for Infobip | S |
| UX-07 | P2 | Property manager portfolio view | Table + card views for 15+ properties; heatmap visualization for occupancy; owner grouping | Dashboard wireframes | L |

---

## 6. Content & Data Tasks

| ID | Priority | Task | Description | Dependencies | Effort |
|----|----------|------|-------------|--------------|--------|
| CD-01 | P0 | Seed apartments table | 50+ real Medellin listings across 5 neighborhoods (Poblado, Laureles, Envigado, Sabaneta, Centro); include realistic photos, pricing, amenities, coordinates | None | L |
| CD-02 | P0 | Neighborhood descriptions | Detailed descriptions for all 5 zones: vibe, price range, walkability, safety, WiFi quality, coworking options, nightlife, grocery/restaurants, transit; used by NeighborhoodIntelligence component | None | M |
| CD-03 | P0 | Onboarding copy | Renter intake wizard welcome messages, landlord onboarding step descriptions, CTA text, error messages, success states | UX-01, UX-03 | S |
| CD-04 | P1 | Email/notification templates | Application received, application approved/rejected, showing reminder, lease ready, payment due, maintenance update, move-in guide | DB-02, DB-01, DB-04 | M |
| CD-05 | P1 | Lease template | Colombian-law-compliant rental lease template (Spanish + English); must include: parties, property description, term, rent amount, deposit, utilities, rules, termination clauses | Legal review required | L |
| CD-06 | P1 | Seed all tables | Populate remaining tables: profiles (10 renters, 5 landlords), showings (20), applications (15), cars (20), restaurants (30), events (15) | CD-01, DB-00, DB-01, DB-02 | L |
| CD-07 | P2 | Property photography guidelines | Standards for listing photos: minimum count (5), required angles (exterior, living room, kitchen, bathroom, bedroom, view), resolution requirements, no-go list (personal items, clutter) | None | S |
| CD-08 | P2 | Landlord FAQ/help content | FAQ section: how to list, pricing tips, application review guide, payout schedule, maintenance handling | None | S |

---

## 7. Wiring & Integration Tasks

| ID | Priority | Task | Description | Dependencies | Effort |
|----|----------|------|-------------|--------------|--------|
| WI-01 | P0 | Wire showing scheduler to Supabase + notifications | ShowingScheduler component → showing-scheduler edge function → `showings` table → email/push notification to both parties | FE-R02, BE-EF01, DB-01 | M |
| WI-02 | P0 | Wire application form to pipeline | RentalApplication → application-management edge function → `applications` table → AI summary generation → landlord notification | FE-R03, BE-EF02, DB-02 | M |
| WI-03 | P0 | Wire landlord onboarding to auth | LandlordOnboarding → landlord-onboarding edge function → `landlord_profiles` table → `profiles.account_type` update → admin verification queue | FE-L01, BE-EF03, DB-00, DB-M02 | M |
| WI-04 | P1 | Wire OpenClaw WhatsApp to ai-chat | Infobip webhook → OpenClaw message handler → ai-chat edge function (with `channel: "whatsapp"` context) → response formatted as WhatsApp message → Infobip send API | AG-02, BE-EM02 | L |
| WI-05 | P1 | Wire Hermes to Supabase MCP | Connect Hermes agent to Supabase via MCP server; enable read access to apartments, applications, profiles, analytics; write access to ai_context | AG-04 | M |
| WI-06 | P1 | Wire Paperclip task system to agent tables | Paperclip task creation → `agent_jobs` table; status updates → `agent_jobs.status`; results → `ai_runs` table for audit; budget tracking → new `agent_budgets` table or column | AG-01 | M |
| WI-07 | P1 | Wire landlord dashboard to real-time updates | useRealtimeChannel for: new applications, showing requests, maintenance requests, payment received; landlord dashboard auto-updates | FE-L02, existing `src/hooks/useRealtimeChannel.ts` | M |
| WI-08 | P2 | Wire payment system for deposits | Stripe Connect (or Wompi for COP) integration: tenant pays deposit → platform holds → releases to landlord minus commission; create `rent_payments` records | DB-08, Commerce layer | XL |
| WI-09 | P2 | Wire maintenance request to notifications | Tenant submits → `maintenance_requests` table → landlord push notification + email → status updates → tenant notification | FE-L07, BE-EF07, DB-05 | M |
| WI-10 | P2 | Wire analytics aggregation cron | Scheduled edge function (daily) → queries showings/applications/leases → computes metrics → writes to `property_analytics` table | BE-EF05, DB-07 | M |

---

## 8. Priority Matrix

All tasks across all categories, sorted by priority tier, then by dependency order within each tier.

### P0 — Must Have (Launch Blockers)

| # | ID | Category | Task | Dependencies | Effort | Sprint |
|---|-----|----------|------|--------------|--------|--------|
| 1 | CD-01 | Content | Seed apartments table with 50+ real Medellin listings | None | L | S1 |
| 2 | CD-02 | Content | Write neighborhood descriptions for 5 zones | None | M | S1 |
| 3 | FE-A01 | Admin | Fix admin auth guards (`useAdminAuth` audit) | None | S | S1 |
| 4 | DB-M02 | Database | Add `account_type`, `phone`, `nationality`, `profession` to `profiles` | None | S | S1 |
| 5 | DB-00 | Database | Create `landlord_profiles` table | DB-M02 | M | S1 |
| 6 | DB-01 | Database | Create `showings` table | None | S | S1 |
| 7 | DB-02 | Database | Create `applications` table | None | M | S1 |
| 8 | DB-03 | Database | Create `landlord_availability` table | DB-00 | S | S1 |
| 9 | DB-M01 | Database | Add `landlord_id`, `moderation_status` to `apartments` | DB-00 | S | S1 |
| 10 | CD-03 | Content | Write onboarding copy for renter and landlord flows | None | S | S1 |
| 11 | UX-02 | UX | Design showing scheduler interaction | None | S | S2 |
| 12 | UX-03 | UX | Design application form (4-step) | None | M | S2 |
| 13 | UX-01 | UX | Design landlord onboarding flow | None | M | S2 |
| 14 | BE-EF01 | Backend | Build `showing-scheduler` edge function | DB-01, DB-03 | L | S2 |
| 15 | BE-EF02 | Backend | Build `application-management` edge function | DB-02 | L | S2 |
| 16 | BE-EF03 | Backend | Build `landlord-onboarding` edge function | DB-00 | M | S2 |
| 17 | FE-R01 | Frontend | Enhance RentalsIntakeWizard with neighborhood map | None | M | S2 |
| 18 | FE-R02 | Frontend | Build showing scheduler component | BE-EF01 | L | S3 |
| 19 | FE-R03 | Frontend | Build rental application form | BE-EF02 | L | S3 |
| 20 | FE-L01 | Frontend | Build landlord onboarding wizard | BE-EF03 | L | S3 |
| 21 | FE-L02 | Frontend | Build landlord dashboard page | DB-00 | L | S3 |
| 22 | FE-L03 | Frontend | Build property listing form (6-step) | BE-EF03 | XL | S3-S4 |
| 23 | BE-EM01 | Backend | Add showing/apply actions to rentals edge function | BE-EF01, BE-EF02 | M | S3 |
| 24 | WI-01 | Integration | Wire showing scheduler to Supabase + notifications | FE-R02, BE-EF01 | M | S3 |
| 25 | WI-02 | Integration | Wire application form to pipeline | FE-R03, BE-EF02 | M | S3 |
| 26 | WI-03 | Integration | Wire landlord onboarding to auth system | FE-L01, BE-EF03 | M | S3 |

### P1 — Should Have (Post-Launch, High Value)

| # | ID | Category | Task | Dependencies | Effort | Sprint |
|---|-----|----------|------|--------------|--------|--------|
| 27 | DB-04 | Database | Create `leases` table | DB-02 | M | S4 |
| 28 | DB-05 | Database | Create `maintenance_requests` table | DB-04 | S | S4 |
| 29 | DB-06 | Database | Create `property_documents` table | DB-00 | S | S4 |
| 30 | DB-M03 | Database | Add `lease_status`, `current_tenant_id`, `current_lease_id` to apartments | DB-04 | S | S4 |
| 31 | CD-04 | Content | Write email/notification templates | DB-02, DB-01 | M | S4 |
| 32 | CD-05 | Content | Write Colombian-law-compliant lease template | Legal review | L | S4 |
| 33 | CD-06 | Content | Seed all remaining tables (profiles, showings, applications, etc.) | CD-01, DB-00-02 | L | S4 |
| 34 | BE-EM02 | Backend | Add real estate tools to ai-chat edge function | BE-EF01, BE-EF02 | M | S4 |
| 35 | BE-EM03 | Backend | Add landlord-facing search to ai-search | DB-00 | M | S4 |
| 36 | BE-EM04 | Backend | Add SHOW/APPLY/MANAGE intents to ai-router | BE-EM02 | S | S4 |
| 37 | BE-EF05 | Backend | Build `property-analytics` edge function | DB-07 | L | S5 |
| 38 | FE-R04 | Frontend | Build lease viewer + e-signature | DB-04 | L | S5 |
| 39 | FE-R05 | Frontend | Build move-in guide page | DB-04 | M | S5 |
| 40 | FE-R06 | Frontend | Build property comparison view | None | M | S5 |
| 41 | FE-R07 | Frontend | Enhance listing detail with neighborhood intelligence | CD-02 | M | S5 |
| 42 | FE-L04 | Frontend | Build application review interface | FE-R03 | L | S5 |
| 43 | FE-L05 | Frontend | Build tenant management view | DB-04 | M | S5 |
| 44 | FE-L06 | Frontend | Build revenue/occupancy analytics charts | BE-EF05 | L | S5 |
| 45 | FE-A02 | Admin | Build landlord verification workflow | DB-00 | M | S5 |
| 46 | FE-A03 | Admin | Build property moderation queue | DB-M01 | M | S5 |
| 47 | UX-04 | UX | Design landlord dashboard layout | None | M | S4 |
| 48 | UX-05 | UX | Design lease signing experience | None | M | S5 |
| 49 | UX-06 | UX | Design WhatsApp conversation templates | None | S | S4 |
| 50 | AG-01 | Agent | Set up Paperclip framework (org chart, budgets, heartbeat) | `agent_jobs` table | L | S5 |
| 51 | AG-02 | Agent | Connect OpenClaw to Infobip WhatsApp | Infobip env vars | L | S5 |
| 52 | AG-03 | Agent | Create WhatsApp outreach templates | AG-02 | M | S5 |
| 53 | AG-04 | Agent | Build Hermes property analysis skill | Supabase MCP | L | S6 |
| 54 | AG-05 | Agent | Build Hermes lead scoring skill | AG-04 | M | S6 |
| 55 | WI-04 | Integration | Wire OpenClaw WhatsApp to ai-chat | AG-02 | L | S6 |
| 56 | WI-05 | Integration | Wire Hermes to Supabase MCP | AG-04 | M | S6 |
| 57 | WI-06 | Integration | Wire Paperclip task system to agent tables | AG-01 | M | S6 |
| 58 | WI-07 | Integration | Wire landlord dashboard to realtime updates | FE-L02 | M | S5 |

### P2 — Nice to Have (Growth / Polish)

| # | ID | Category | Task | Dependencies | Effort | Sprint |
|---|-----|----------|------|--------------|--------|--------|
| 59 | DB-07 | Database | Create `property_analytics` table | None | S | S7 |
| 60 | DB-08 | Database | Create `rent_payments` table | DB-04 | M | S7 |
| 61 | DB-09 | Database | Create `prospect_pipeline` table | None | M | S7 |
| 62 | BE-EF06 | Backend | Build `lease-generation` edge function | DB-04, CD-05 | L | S7 |
| 63 | BE-EF07 | Backend | Build `maintenance-request` edge function | DB-05 | M | S7 |
| 64 | FE-R08 | Frontend | Build virtual tour viewer | `virtual_tour_url` field exists | S | S7 |
| 65 | FE-R09 | Frontend | Build roommate matching feature | New DB table | L | S8 |
| 66 | FE-L07 | Frontend | Build maintenance request management | DB-05 | M | S7 |
| 67 | FE-L08 | Frontend | Build bulk listing management | FE-L03 | M | S7 |
| 68 | FE-A04 | Admin | Build platform analytics dashboard | BE-EF05 | L | S8 |
| 69 | UX-07 | UX | Design property manager portfolio view | None | L | S7 |
| 70 | CD-07 | Content | Write property photography guidelines | None | S | S7 |
| 71 | CD-08 | Content | Write landlord FAQ/help content | None | S | S7 |
| 72 | AG-06 | Agent | Build OpenClaw scraping pipeline | DB-09 | L | S8 |
| 73 | AG-07 | Agent | Build Hermes lease review skill | CD-05 | L | S8 |
| 74 | AG-08 | Agent | Build Paperclip reporting automation | AG-01, DB-09 | M | S8 |
| 75 | WI-08 | Integration | Wire payment system (Stripe Connect/Wompi) | DB-08 | XL | S8 |
| 76 | WI-09 | Integration | Wire maintenance request to notifications | BE-EF07, DB-05 | M | S7 |
| 77 | WI-10 | Integration | Wire analytics aggregation cron | BE-EF05, DB-07 | M | S8 |

---

## Effort Key

| Code | Meaning | Approximate Time |
|------|---------|-----------------|
| S | Small | 2-4 hours |
| M | Medium | 0.5-1 day |
| L | Large | 1-3 days |
| XL | Extra Large | 3-5 days |

## Sprint Cadence

| Sprint | Focus | Duration |
|--------|-------|----------|
| S1 | Database foundations + seed data + admin auth fix | 1 week |
| S2 | Edge functions + UX design + wizard enhancement | 1 week |
| S3 | Core renter features (showing, application) + landlord onboarding | 2 weeks |
| S4 | Landlord dashboard + lease system + ai-chat real estate tools | 2 weeks |
| S5 | Analytics + verification + agent framework setup | 2 weeks |
| S6 | Agent wiring (WhatsApp, Hermes, Paperclip) | 2 weeks |
| S7 | P2 features (maintenance, bulk ops, virtual tours) | 2 weeks |
| S8 | Growth features (payments, scraping, roommate, platform analytics) | 2 weeks |

**Total estimated timeline:** 14 weeks (3.5 months) from start to full P2 completion.
**MVP (P0 only):** 4 weeks (1 month) — renters can search, schedule showings, apply; landlords can onboard and list.

---

## Dependency Graph (Critical Path)

```
DB-M02 (profiles.account_type)
  └─→ DB-00 (landlord_profiles)
       ├─→ DB-03 (landlord_availability)
       │    └─→ BE-EF01 (showing-scheduler)
       │         └─→ FE-R02 (ShowingScheduler component)
       │              └─→ WI-01 (wire to Supabase + notifications)
       ├─→ DB-M01 (apartments.landlord_id)
       ├─→ BE-EF03 (landlord-onboarding)
       │    └─→ FE-L01 (LandlordOnboarding wizard)
       │         └─→ WI-03 (wire to auth)
       └─→ FE-L02 (LandlordDashboard)
            └─→ FE-L03 (PropertyListingForm)

DB-02 (applications)
  └─→ BE-EF02 (application-management)
       └─→ FE-R03 (RentalApplication form)
            └─→ WI-02 (wire to pipeline)
                 └─→ DB-04 (leases)
                      ├─→ FE-R04 (LeaseViewer)
                      ├─→ DB-05 (maintenance_requests)
                      └─→ DB-08 (rent_payments)

CD-01 (seed data) → parallel with all above, unblocks testing
```

---

## File Structure Preview

New files and directories this plan will create:

```
src/
├── components/
│   ├── landlord/                          # NEW DIRECTORY
│   │   ├── OnboardingWizard.tsx
│   │   ├── OnboardingSteps/
│   │   │   ├── BasicInfoStep.tsx
│   │   │   ├── BusinessInfoStep.tsx
│   │   │   ├── VerificationStep.tsx
│   │   │   └── PayoutSetupStep.tsx
│   │   ├── PropertyListingForm.tsx
│   │   ├── ListingSteps/
│   │   │   ├── PropertyDetailsStep.tsx
│   │   │   ├── PhotoUploadStep.tsx
│   │   │   ├── AmenitiesStep.tsx
│   │   │   ├── PricingStep.tsx
│   │   │   ├── AIDescriptionStep.tsx
│   │   │   └── AvailabilityStep.tsx
│   │   ├── DashboardStats.tsx
│   │   ├── RecentActivity.tsx
│   │   ├── ApplicationReview.tsx
│   │   ├── ApplicantCard.tsx
│   │   ├── ApplicationDetail.tsx
│   │   ├── TenantManagement.tsx
│   │   ├── TenantCard.tsx
│   │   ├── AnalyticsCharts.tsx
│   │   ├── MaintenanceQueue.tsx
│   │   ├── MaintenanceDetail.tsx
│   │   └── BulkListingActions.tsx
│   ├── rentals/
│   │   ├── ShowingScheduler.tsx            # NEW
│   │   ├── RentalApplication.tsx           # NEW
│   │   ├── ApplicationSteps/              # NEW DIRECTORY
│   │   │   ├── PersonalInfoStep.tsx
│   │   │   ├── StayDetailsStep.tsx
│   │   │   ├── DocumentUploadStep.tsx
│   │   │   └── ReviewSubmitStep.tsx
│   │   ├── LeaseViewer.tsx                 # NEW
│   │   ├── LeaseSignature.tsx              # NEW
│   │   ├── PropertyComparison.tsx          # NEW
│   │   ├── NeighborhoodIntelligence.tsx    # NEW
│   │   ├── VirtualTourViewer.tsx           # NEW
│   │   ├── RentalsIntakeMap.tsx            # NEW
│   │   ├── MoveInChecklist.tsx             # NEW
│   │   └── RoommateMatch.tsx              # NEW
│   ├── admin/
│   │   ├── LandlordVerification.tsx        # NEW
│   │   ├── PropertyModeration.tsx          # NEW
│   │   ├── PlatformStatsCards.tsx          # NEW
│   │   └── ConversionFunnel.tsx            # NEW
├── hooks/
│   ├── useShowings.ts                      # NEW
│   ├── useApplications.ts                  # NEW
│   ├── useLeases.ts                        # NEW
│   ├── useLandlordListings.ts              # NEW
│   ├── usePropertyAnalytics.ts             # NEW
│   └── useRoommateMatch.ts                # NEW
├── pages/
│   ├── LandlordOnboarding.tsx              # NEW
│   ├── LandlordDashboard.tsx               # NEW
│   ├── MoveInGuide.tsx                     # NEW
│   └── admin/
│       ├── LandlordVerification.tsx         # NEW
│       ├── PropertyModeration.tsx           # NEW
│       └── PlatformAnalytics.tsx            # NEW
supabase/
├── functions/
│   ├── showing-scheduler/index.ts          # NEW
│   ├── application-management/index.ts     # NEW
│   ├── landlord-onboarding/index.ts        # NEW
│   ├── property-analytics/index.ts         # NEW
│   ├── lease-generation/index.ts           # NEW
│   └── maintenance-request/index.ts        # NEW
├── migrations/
│   ├── 20260405_landlord_profiles.sql      # NEW
│   ├── 20260405_showings.sql               # NEW
│   ├── 20260405_applications.sql           # NEW
│   ├── 20260405_landlord_availability.sql  # NEW
│   ├── 20260405_leases.sql                 # NEW
│   ├── 20260405_maintenance_requests.sql   # NEW
│   ├── 20260405_property_documents.sql     # NEW
│   ├── 20260405_property_analytics.sql     # NEW
│   ├── 20260405_rent_payments.sql          # NEW
│   ├── 20260405_prospect_pipeline.sql      # NEW
│   ├── 20260405_alter_profiles.sql         # NEW
│   └── 20260405_alter_apartments.sql       # NEW
```

---

## Routes to Add

```tsx
// In App.tsx — add to router configuration

// Public
"/landlord"                    // Landlord landing / marketing page
"/landlord/onboarding"         // Landlord onboarding wizard

// Protected (require auth + landlord role)
"/landlord/dashboard"          // Landlord dashboard
"/landlord/listings"           // Manage listings
"/landlord/listings/new"       // Create new listing
"/landlord/listings/:id/edit"  // Edit listing
"/landlord/applications"       // View all applications
"/landlord/applications/:id"   // Application detail
"/landlord/tenants"            // Tenant management
"/landlord/analytics"          // Revenue + occupancy analytics
"/landlord/maintenance"        // Maintenance requests

// Protected (require auth + renter)
"/rentals/:id/apply"           // Rental application for specific listing
"/rentals/:id/showing"         // Schedule showing for specific listing
"/leases/:id"                  // View/sign lease
"/move-in/:leaseId"            // Move-in guide

// Admin
"/admin/landlord-verification" // Landlord verification queue
"/admin/property-moderation"   // Property moderation queue
"/admin/platform-analytics"    // Platform-wide analytics
```
