# Changelog

All notable changes to mdeai.co are documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

---

## [2026-04-29] - Landlord V1 Day 2: signup branch + per-day testing block

### Frontend
- New `src/components/auth/AccountTypeStep.tsx` — full-screen radiogroup gating signup with two options ("I'm looking for a place" vs "I'm a landlord or agent"). Renders before email/password form. Brand-aligned: BrandLogo, emerald primary on hover, focus-ring, 44px+ tap targets, `data-account-type` selectors for tests
- Extended `src/pages/Signup.tsx` — two-step flow: AccountTypeStep first, then existing form. Form copy adapts (badge "LANDLORD / AGENT" vs "Renter", Founding-Beta hero blurb for landlords). "Change account type" back button replaces "Back to home" once a choice is made
- Extended `src/hooks/useAuth.tsx` — `signUp` and `signInWithGoogle` accept optional `{ accountType }`. Landlords get `emailRedirectTo: window.location.origin + '/host/onboarding'`; renters get `/`. Account type persisted to `auth.users.raw_user_meta_data.account_type` so it survives email confirmation + OAuth round-trips. Exported `AccountType` type
- New `src/pages/host/Onboarding.tsx` — D2 stub. Anon → `/login?returnTo=/host/onboarding`. Renter → `/dashboard`. Landlord → welcome screen with founder WhatsApp link + dashboard CTA. D3 fleshes out the 3-step wizard
- Modified `src/App.tsx` — lazy `HostOnboarding` route + `/host/onboarding` registration

### Telemetry
- Added 2 PostHog event arms to `AppEvent` union: `landlord_signup_started` (`from: 'signup_page' | 'host_redirect'`) and `landlord_signup_completed` (`method: 'email' | 'google'`). Per plan §7.2 — first 2 of the 12 V1 events

### Testing
- New `src/components/auth/AccountTypeStep.test.tsx` — 4 Vitest tests: both options render as radios, each click fires onSelect with the correct literal, no auto-fire on mount
- Browser-verified via Claude Preview MCP — `/signup` AccountTypeStep, landlord branch form, renter branch form, `/host/onboarding` anon redirect to `/login?returnTo=/host/onboarding` (all clean console)

### Continuous testing — codified
- New `tasks/plan/06-landlord-v1-30day.md` §13 — **Per-day testing block.** Every V1-day PR D2-D30 must include 4 artifacts: (1) Vitest unit tests for non-trivial logic, (2) Claude Preview MCP browser verification with screenshot in PR, (3) PostHog event smoke test, (4) deno test for any edge fn change. RWT scenarios remain the cross-cutting layer (RWT-23 through RWT-27 added for landlord V1)
- New `tasks/todo.md` CT-12 (landlord critical-path Playwright specs, sequenced with V1 days) + CT-13 (per-V1-day testing block)
- New RWT scenarios: RWT-23 (landlord signup happy path), RWT-24 (renter signup regression guard), RWT-25 (landlord OAuth via Google), RWT-26 (end-to-end loop renter→landlord inbox), RWT-27 (RLS isolation between landlords)

### Tooling
- Gates: lint exit 0 · 48/48 unit tests (44 prior + 4 AccountTypeStep) · 11/11 deno tests · build green

---

## [2026-04-29] - Landlord V1 Day 1: schema migration

Per `tasks/plan/06-landlord-v1-30day.md` — first commit of the 30-day landlord build.

### Database
- New migration `20260429000000_landlord_v1.sql` — 5 new tables, 1 view, 4 apartment columns, 14 RLS policies, 2 functions, 3 triggers
- New tables: `landlord_profiles`, `landlord_inbox`, `landlord_inbox_events`, `verification_requests`, `analytics_events_daily`
- New view: `landlord_profiles_public` (security_invoker, safe public read of name/avatar/response stats)
- `apartments` extensions: `landlord_id` FK + `moderation_status` + `rejection_reason` + `source` (43 seeded rows backfilled to `moderation_status='approved'`, `source='seed'`)
- New RLS helper `acting_landlord_ids()` — used by 5 policies
- New trigger `auto_create_landlord_inbox_from_message` — fires on first user-role message in a conversation, creates a `landlord_inbox` row with apartment/landlord derived from `conversations.session_data`
- Reuses existing `update_updated_at()` and `is_admin()` helpers
- Applied via Supabase MCP `apply_migration` to project `zkwcbyxiwklihegjhuql`
- Existing P1-CRM `leads` table (6 rows) + `showings`/`rental_applications` FKs untouched

### Naming divergence (locked Option C)
- Plan §2.3 `leads` → table `landlord_inbox` (avoids clash with existing P1-CRM leads)
- Plan §2.4 `lead_events` → table `landlord_inbox_events`
- UX/URL/event names (`/host/leads`, `useLeads`, PostHog `leads_viewed`) keep the "leads" mental model — only physical tables renamed

### Plan refinements (external review feedback)
- Reframed `Why no billing yet` → "Founding Beta — free for first 100 landlords, permanently"
- D30 success criteria split into Acceptable + Stretch bands (avoids brittle absolute targets)
- Daily scorecard reorders quality-first (reply rate, time-to-reply, active landlords) above count metrics
- Added weekly renter-side conversation-volume check (alert if -25% from D1 baseline)
- §9.4 verification flow: signed JWT + 24h expiry + single-use (replaces naked magic-link)
- Trigger SQL in plan §2.8 corrected to use real schema (`messages.content`, JOIN to `conversations.user_id`)

### Tooling
- `database.types.ts` regenerated: 3940 → 4326 lines (+386 for new tables)
- Gates: lint exit 0 · 44/44 unit tests · 11/11 deno tests · build 4.04s

---

## [2026-04-05] - Epic 1 data foundation, P1 CRM, Supabase CLI workflow

### Database & seed
- Applied six P1 table migrations to linked Supabase project (`db push`)
- Added `supabase/seed.sql` with neighborhoods, profiles, 28 apartments, P1 pipeline demo rows, bookings, payments; wired `[db.seed]` in `supabase/config.toml`
- Regenerated app `database.types.ts` from linked schema

### Edge functions
- New `p1-crm` function: authenticated `create_lead` and `record_payment` with Zod validation; `verify_jwt: true` in config
- Deployed with `supabase functions deploy p1-crm --use-api`

### Tooling & docs
- Cursor rule `supabase-cli.mdc` aligned with [Supabase CLI](https://supabase.com/docs/reference/cli/introduction) / [local dev](https://supabase.com/docs/guides/local-development) docs
- `tasks/notes/01-supa.md` updated with linked-project command checklist

---

## [2026-04-04] - Full Audit, Diagrams, Gemini Migration, DB Sync

### Audits
- **Database Schema Audit** — 28 tables verified, all RLS enabled, FK chain analysis, missing tables identified
- **Edge Function Deep Audit** — 9 functions, 3,706 LOC, 20 issues found (5 P0, 5 P1, 5 P2, 5 P3)
- **TypeScript types generated** — 3,451 lines from live Supabase schema
- **Edge function inventory** — cleaned up 5 orphan functions (ai-booking-chat, ai-orchestrator, ai-suggestions, make-server-fd8c4bf7, server)
- **Identified 3 deployed-but-never-called functions** (ai-search, ai-trip-planner, rules-engine)

### AI Migration
- Migrated ALL 6 AI edge functions from Lovable gateway to Google Gemini direct API
- Fixed ai-router bug: was using SUPABASE_URL as Bearer token
- Updated models: ai-router → gemini-3.1-flash-lite-preview, ai-trip-planner/rentals → gemini-3.1-pro-preview
- Deployed all 6 updated functions to Supabase

### Infrastructure
- Migration history repaired (78 entries marked as reverted)
- Fresh schema pulled from remote (baseline migration: 9,975 lines)
- Vercel build fixed (legacy-peer-deps in .npmrc for @gadgetinc/react)
- All 34 routes verified returning 200 on live site
- Google Maps API key configured
- Supabase CLI linked to project

### Documentation
- Created `docs/architecture-diagrams.md` — 8 Mermaid diagrams (system context, frontend, ERD, edge functions, AI chat flow, commerce flow, tourist journey, deployment pipeline)
- Created `docs/audits/database-schema-audit.md`
- Created `docs/audits/edge-function-audit.md` — with 5-sprint implementation plan
- Created `NEXT-STEPS.md` at project root (replaces outdated docs/NEXT-STEPS.md)
- Created `.claude/plans/edge-function-hardening.md` — 18-step security + performance plan

### Plugins Installed
- commit-commands, code-review, feature-dev, claude-md-management, claude-code-setup, frontend-design, security-guidance

---

## [2026-04-03] - Full Codebase Audit + Commerce Integration

### Audit Results — Live Site vs Codebase
- **mdeai.co IS deployed and working** — Vercel at medell-n-connect.vercel.app, domain www.mdeai.co linked
- **Local codebase is 95%+ complete** — 25+ features working with REAL Supabase data (not mock)
- **Zero mock-only features** — every page queries live Supabase PostgreSQL
- **AI system fully wired** — ai-chat, ai-router, ai-search, ai-trip-planner all call real edge functions with Claude
- **Admin panel complete** — CRUD for all 4 listing types + user management
- **Auth working** — Supabase email/password + Google OAuth configured
- **Realtime active** — chat messages, trip items, conversations use Supabase Realtime subscriptions
- **Critical blocker: app needs Vercel deployment to go live**

### Feature Status (all WORKING with real data)
| Feature | Data Source | Status |
|---------|------------|--------|
| Homepage (hero, categories, featured) | Supabase | Working |
| Explore (multi-category, AI search) | Supabase + ai-search edge fn | Working |
| Apartments (list, detail, filters) | Supabase apartments table | Working |
| Cars (list, detail, filters) | Supabase car_rentals table | Working |
| Restaurants (list, detail, filters) | Supabase restaurants table | Working |
| Events (list, detail, calendar view) | Supabase events table | Working |
| Rentals (unified AI intake wizard) | Supabase + rentals edge fn | Working |
| Concierge (6-tab AI chat) | Supabase + ai-chat edge fn | Working |
| Trips (list, detail, create, itinerary) | Supabase trips/trip_items | Working |
| Bookings (multi-type, status filters) | Supabase bookings table | Working |
| Dashboard (stats, featured, AI picks) | Supabase (multiple tables) | Working |
| Saved/Collections (CRUD) | Supabase saved_places/collections | Working |
| Auth (email + Google OAuth) | Supabase Auth | Working |
| AI Chat (streaming, tool-calling) | ai-chat edge fn (Claude) | Working |
| AI Search (semantic) | ai-search edge fn | Working |
| Intent Router | ai-router edge fn | Working |
| Admin Panel (5 pages) | Supabase (admin queries) | Working |
| 3-Panel Layout | All pages | Working |
| Mobile Responsive | Bottom nav + overlays | Working |

### Chat System Architecture (Fully Built)
- 7 agent types: concierge, booking_assistant, budget_guardian, dining_orchestrator, event_curator, itinerary_optimizer, local_scout
- 6 chat tabs: concierge, bookings, dining, trips, events, local
- Tool-calling: rentals_search, rentals_intake, restaurant search, event discovery, trip planning
- Message streaming with AbortController
- Conversation persistence + archive in Supabase
- Realtime updates via Supabase subscriptions
- FloatingChatWidget on all pages
- Full AI concierge page at /concierge

### Added — Commerce Integration (Shopify + Gadget + /coffee Route)

### Added
- **Shopify headless commerce** — Connected dev store `mdeaidev.myshopify.com` via Gadget.dev
- **Gadget integration** — Installed `@gadget-client/mdeai` + `@gadgetinc/react@0.21.4`
  - `.npmrc` configured for Gadget npm registry
  - `MdeaiClient` initialized with anonymous auth for public product browsing
  - `GadgetProvider` wraps the entire app in `App.tsx`
- **`/coffee` route** — New product listing page with 3-panel layout
  - `useCoffeeProducts()` hook using Gadget `useFindMany` for Shopify product queries
  - `useCoffeeByHandle()` for single product detail
  - `CoffeeCard` component with image placeholder, price, vendor, tasting notes
  - `FreshnessBadge` — "Roasted Xh ago" badge (green/yellow/red)
  - `CoffeeFilters` — Roast level and processing method filters
- **`/coffee/:handle` route** — Product detail page with knowledge graph (farm, altitude, cupping score)
- **`useShopifyCart` hook** — Shopify Storefront API cart management
  - Cart create, add lines, restore from localStorage
  - Checkout redirect to Shopify hosted payment
- **Coffee types** — `CoffeeProduct`, `CoffeeFilters`, `getFreshnessInfo()` utility

### Added — Developer Infrastructure
- **CLAUDE.md** — Project-level AI assistant configuration
- **claude.local.md** — Personal overrides (git-ignored)
- **`.claude/` architecture:**
  - `rules/` — 4 modular rule files (style-guide, supabase-patterns, edge-function-patterns, ai-interaction-patterns)
  - `commands/` — `/process-task` and `/deploy-check` slash commands
  - `skills/` — mdeai-freshness, mdeai-commerce, mdeai-three-panel
  - `agents/` — security-auditor and performance-reviewer specialist agents
- **`docs/gadget-best-practices.md`** — 1,500+ line Gadget integration guide
- **`.claude/plans/coffee-route-gadget.md`** — Implementation plan

### Added — Shopify App
- Scaffolded `~/mdeai-development/` Shopify React Router app
- Connected to Gadget backend at `mdeai--development.gadget.app`
- Released app version `mdeai-2` to Shopify Partner Dashboard
- Installed on dev store `mdeaidev`

### Changed
- `.env.local` — Added Shopify, Gadget, and VITE_SHOPIFY_* credentials
- `.env.local` — Fixed leading whitespace on SHOPIFY_CATALOG_API_KEY
- `.env.local` — Updated `PUBLIC_STOREFRONT_API_VERSION` from 2024-04 to 2026-01
- `.gitignore` — Added `.env` and `.env.*` patterns (was previously missing)
- `package.json` — Added @gadgetinc/react, @gadget-client/mdeai dependencies

### Tools Installed
- Node.js v25.8.2 (via nvm), Gadget CLI (ggt) 3.0.0, Shopify CLI 3.93.0, Yarn 1.22.22

---

## [2026-01-29] - Unified Rentals MVP

### Added
- Rentals page with unified apartment + car search
- Rentals API edge function
- Rentals UI wizard flow

---

## [2026-01-23] - Premium Booking Wizards Wired to Detail Pages

### Added
- **CarBookingWizardPremium Integration** - Wired to `/cars/:id` detail page
  - Opens in Dialog modal on "Book Now" click
  - 3-panel layout with dates, pickup location, insurance tiers (Basic/Standard/Premium)
  - Weekly discount logic for 7+ day rentals
  - Delivery fee calculator ($25 for apartment/hotel delivery)
  - Real-time price breakdown in right panel
  
- **EventBookingWizardPremium Integration** - Wired to `/events/:id` detail page
  - Opens in Dialog modal on "Get Tickets" click
  - 3-panel layout with ticket type selection (General/VIP)
  - Quantity selector (1-10 tickets)
  - VIP perks display (priority entry, reserved seating, etc.)
  - Group booking acknowledgment (4+ tickets)

### Changed
- Updated CarDetail right panel with "Book Now" action button
- Updated EventDetail right panel with "Get Tickets" action button
- Added Dialog + DialogContent imports to both detail pages

### Verified
- RLS policies on bookings table: user_id = auth.uid() for SELECT/UPDATE
- All 4 booking wizards (Apartment, Restaurant, Car, Event) now functional
- Progress tracker updated to 85% overall completion

---

## [2026-01-23] - Progress Tracker Audit & Bug Fixes

### Fixed
- **PlaceCard forwardRef warning** - Fixed console warning on Index page
- **Progress Tracker accuracy** - Complete rewrite with verified percentages and proof of completion

### Added
- **Comprehensive Progress Tracker** - New format with:
  - Executive summary with completion percentages
  - Critical issues table (RLS, OAuth status)
  - Phase-by-phase breakdown with verification
  - Database table inventory (24 tables)
  - Edge function inventory (4 functions)
  - Metrics dashboard

### Verified
- 23 routes functional
- 8 protected routes with auth
- All 5 listing types (apartments, cars, restaurants, events, explore)
- AI chat with tool calling
- Booking wizards (apartment, restaurant)
- Trip management (list, detail, create, itinerary builder)

---

## [2026-01-22] - AI Concierge & Bookings Dashboard

### Added
- **AI Concierge Page** (`/concierge`) - Full-page 3-panel chat experience
  - 4-tab architecture (Concierge, Trips, Explore, Bookings)
  - Real-time streaming from ai-chat edge function
  - Active trip context awareness
  - Quick action buttons
- **Bookings Dashboard** (`/bookings`) - 3-panel booking management
  - Status filters (upcoming, past, cancelled)
  - Type filters (all, apartment, car, restaurant, event)
  - Statistics panel (total, upcoming, this month)
  - Detail panel with cancel action

### Changed
- Updated LeftPanel navigation with Concierge link
- Enhanced Index footer with multi-column layout

---

## [2026-01-21] - Google Maps Integration for Itinerary Builder

### Added
- **GoogleMapView** component - Interactive Google Maps with street-level tiles, zoom/pan, and custom markers
- **google-directions** edge function - Secure Google Routes API calls for real routing data
- **useGoogleDirections** hook - Client-side hook for fetching directions
- Polyline decoding and rendering for actual road routes
- Real travel times from Google's traffic-aware routing
- Auto-fetch directions when day selection changes
- "Get Directions" button for manual routing requests
- VITE_GOOGLE_MAPS_API_KEY environment variable support
- Seamless fallback to placeholder view when API key not configured

### Changed
- VisualItineraryBuilder now uses GoogleMapView instead of placeholder ItineraryMapView
- Travel time indicators now display real Google-calculated durations when available
- Haversine calculation remains as fallback when Google API unavailable
- AI route optimization integrates with Google routing for validated travel times

### Technical
- Google Routes API v2 (computeRoutes) with traffic-aware preference
- Advanced Marker Element API for custom styled pins
- Encoded polyline decoding for route visualization
- CORS-enabled edge function with proper error handling

---

## [2026-01-21] - Map Visualization for Itinerary Builder

### Added
- **ItineraryMapView** component - Visual route map with positioned pins and dashed route lines
- **TravelTimeIndicator** component - Shows travel time/distance between activities with mode suggestion (walk/taxi/drive)
- Haversine formula for accurate distance calculation between coordinates
- Travel time estimation based on 25 km/h average city speed
- Split view mode in VisualItineraryBuilder (List + Map side-by-side)
- Map/List toggle in TripDetail page toolbar
- SVG route lines with arrow markers connecting activity pins
- Total travel time badge per selected day
- Activity pins show step number, icon, and title

### Changed
- Updated VisualItineraryBuilder to support `showMapView` prop
- TripDetail now includes map toggle for builder view
- Travel time indicators appear between items when map view is active

---

## [2026-01-21] - Collections, Itinerary Builder, Events Enhancement

### Added
- **Collections Page** (`/collections`) - Grid view of user collections with preview thumbnails
- **CollectionCard** component with image grid, edit/delete/share actions
- **VisualItineraryBuilder** - Drag-and-drop itinerary planning with @dnd-kit
- **EventsCalendar** - Month view calendar for event discovery
- **EnhancedEventFilters** - Date presets, category/neighborhood/price filters, view mode toggle
- `useCollectionPreviews` hook for fetching collection thumbnail images
- `useReorderTripItem` hook for drag-and-drop item reordering
- Extended `EventFilters` type with category, neighborhood, priceRange, dateRange

### Changed
- Updated Events page with calendar view and enhanced filtering
- Updated TripDetail page with tabbed Builder/Timeline views
- Added Collections route to App.tsx

---

## [2026-01-20] - 3-Panel System Rebuild

### Added
- **ThreePanelContext** - Global state for selectedItem, rightPanelOpen, URL sync
- **ThreePanelLayout** - Responsive shell (Desktop/Tablet/Mobile)
- **RightDetailPanel** - Slide-in detail view with hero, AI pitch, actions
- Desktop: 280px Left | Flex Center | 500px slide-in Right
- Tablet: Collapsible Left | Right overlay
- Mobile: Full-screen Right overlay with bottom nav
- ESC key closes panel, URL sync with `?detail=id`
- Card selection highlighting across all types

### Changed
- All listing pages now use unified `ThreePanelLayout`
- Removed duplicate Sheet/drawer on desktop
- Fixed panel leaking between breakpoints
- LeftPanel now includes "My Trips" navigation link

### Cards Updated (isSelected prop)
- RestaurantCard
- ApartmentCard
- CarCard
- EventCard
- ExploreCard

---

## [2026-01-20] - Trips Module

### Added
- `/trips` - Trip list page with filters (draft, active, completed)
- `/trips/:id` - Trip detail with day-by-day timeline
- `/trips/new` - Trip creation wizard (4 steps)
- `TripCard` component with status badges
- `DayTimeline` component for itinerary view
- `TripWizard` with date picker and budget
- `AddToTripDialog` - Add any listing to a trip
- `useTrips`, `useTripItems` hooks for data management
- Protected routes requiring authentication

---

## [0.2.0] - 2026-01-19

### Added
- Supabase authentication (email/password, Google OAuth)
- Protected routes for `/saved` and `/concierge`
- Login, Signup, Forgot Password, Reset Password pages
- Session persistence across refresh
- User state in Sidebar and MobileNav

### Changed
- Updated Index page header with auth state
- Sidebar shows user email when logged in

### Security
- Passwords validated (min 6 chars)
- Password reset via email link

---

## [0.1.0] - 2026-01-19

### Added
- Initial project setup (Vite + React + TypeScript)
- Supabase connection (project: `medellin`)
- Design system with emerald/cream palette
- Custom typography (DM Sans, Playfair Display)
- 3-panel layout components (Sidebar, MobileNav, AppLayout)
- Home page with hero section
- Explore page with filters and mock data
- Place detail page
- Saved places page (basic)
- Concierge page (placeholder)
- PlaceCard, CategoryFilter, NeighborhoodSelector components
- Mock data for testing

### Database
- Connected to existing Supabase schema
- Tables available: profiles, apartments, restaurants, events, car_rentals, saved_places, collections, trips, bookings

---

## Version Format

- **Major (X.0.0)**: Breaking changes, major features
- **Minor (0.X.0)**: New features, backward compatible
- **Patch (0.0.X)**: Bug fixes, small improvements

---

## Related

- [Progress Tracker](./progress-tracker/progress.md) — Task status
- [Next Steps](./NEXT-STEPS.md) — Implementation guide
