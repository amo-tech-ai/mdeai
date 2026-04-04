# CLAUDE.md — mdeai.co

## Project Overview

**mdeai.co** is an AI-powered marketplace connecting travelers and locals to premium coffee, luxury stays, and experiences in Medellin, Colombia. It's a "Digital Concierge" vendor marketplace with AI discovery, automated payouts, and zero-friction purchasing.

**Status:** 95%+ complete. 25+ features working with real Supabase data. Commerce layer (Shopify + Gadget) integrated. AI chat fully wired (6 edge functions, 7 agents).

**Website:** https://www.mdeai.co/ (live on Vercel: medell-n-connect.vercel.app)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vite 5 + React 18 + TypeScript + SWC |
| UI | shadcn/ui (Radix primitives) + Tailwind CSS 3 |
| State | TanStack Query (server) + React Context (client) + Supabase Realtime |
| Routing | react-router-dom v6 |
| Backend | Supabase PostgreSQL + pgvector + 9 Edge Functions |
| Auth | Supabase Auth (email/password + Google OAuth) |
| AI | Claude 3.5 Sonnet via Supabase Edge Functions |
| Forms | react-hook-form + Zod validation |
| Design | "Paisa" theme — DM Sans + Playfair Display, emerald/cream/charcoal palette |
| Testing | Vitest (unit) + Playwright (e2e) |
| Package manager | npm (lockfile present), bun.lockb also present |

## Quick Commands

```bash
npm run dev          # Start dev server (port 8080)
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest (run once)
npm run test:watch   # Vitest (watch mode)
npm run preview      # Preview production build
```

Dev server binds to `::` (all interfaces) on port 8080.

## Project Structure

```
src/
├── App.tsx              # Root: providers + all routes
├── components/          # 152+ React components
│   ├── ui/              # 40+ shadcn/ui primitives (button, card, dialog, etc.)
│   ├── layout/          # 3-panel layout system, navigation
│   ├── chat/            # FloatingChatWidget, message components
│   ├── ai/              # AI proposal/suggestion components
│   ├── admin/           # Admin dashboard components
│   ├── apartments/      # Apartment listings & details
│   ├── rentals/         # Unified rentals (apartments + cars)
│   ├── cars/            # Car listings & details
│   ├── restaurants/     # Restaurant listings & details
│   ├── events/          # Event listings & details
│   ├── bookings/        # Booking management
│   ├── trips/           # Trip planning
│   ├── collections/     # Curated collections
│   ├── explore/         # Discovery/explore features
│   ├── saved/           # Saved places
│   ├── auth/            # ProtectedRoute, login forms
│   ├── onboarding/      # New user onboarding
│   ├── notifications/   # Notification components
│   ├── panels/          # Panel-specific components
│   ├── places/          # Generic place components
│   ├── listings/        # Shared listing components
│   └── home/            # Homepage components
├── hooks/               # 31 custom hooks
│   ├── useAuth.tsx      # Auth context + hook (provider lives here)
│   ├── useChat.ts       # AI chat integration
│   ├── useAISearch.ts   # Semantic search
│   ├── useAITripPlanner.ts
│   ├── useIntentRouter.ts
│   ├── useApartments.ts / useCars.ts / useRestaurants.ts / useEvents.ts
│   ├── useBookings.ts / useTrips.ts / useTripItems.ts
│   ├── useCollections.ts / useSavedPlaces.ts
│   ├── useGoogleDirections.ts / useRouteOptimization.ts
│   ├── useRealtimeChannel.ts
│   └── useNotifications.ts
├── context/             # React Context providers
│   ├── TripContext.tsx
│   ├── ThreePanelContext.tsx
│   └── OnboardingContext.tsx
├── pages/               # 33 page components (see Routing section)
├── types/               # TypeScript type definitions
│   ├── listings.ts      # Apartments, cars
│   ├── trip.ts / booking.ts / chat.ts / event.ts / restaurant.ts
│   ├── explore.ts / saved.ts
├── integrations/supabase/  # Supabase client config
├── lib/
│   ├── utils.ts         # cn() utility (clsx + tailwind-merge)
│   ├── mockData.ts      # Development mock data
│   └── confetti.ts      # Celebration effects
supabase/
├── functions/           # 9 Edge Functions
│   ├── ai-chat/         # Multi-agent chat (concierge, trips, explore, bookings)
│   ├── ai-search/       # Semantic search across all listing types
│   ├── ai-router/       # Intent classification
│   ├── ai-trip-planner/ # AI trip planning
│   ├── ai-optimize-route/  # Route optimization
│   ├── ai-suggest-collections/  # Collection suggestions
│   ├── google-directions/  # Google Directions API proxy
│   ├── rentals/         # Rentals API
│   └── rules-engine/    # Business rules engine
├── migrations/          # 5 SQL migrations
rules/                   # Governance docs (frontend, backend, supabase, edge-functions)
docs/                    # Architecture, changelogs, audits, prompts, tasks
plan/                    # Planning documents and PRD drafts
```

## Path Alias

All imports use `@/` which maps to `./src/`:
```tsx
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
```

## Architecture Rules

### 3-Panel Layout (Mandatory)

All main pages follow this layout:

| Panel | Purpose | Content |
|-------|---------|---------|
| Left | Context | Navigation, filters, user info |
| Main | Work | Primary content, listings, details |
| Right | Intelligence | Map, AI suggestions, quick actions |

Mobile: panels collapse to single column with bottom navigation.

### AI Interaction Pattern

AI **proposes only** — never auto-applies changes:
1. **Preview** — Show what AI suggests
2. **Apply** — User confirms action
3. **Undo** — User can revert

### Required States for Data Components

Every data-fetching component must handle all four states:
```tsx
if (isLoading) return <Skeleton />;
if (error) return <ErrorState onRetry={refetch} />;
if (!data?.length) return <EmptyState />;
return <Content data={data} />;
```

### No Client Secrets

- Never store API keys in frontend code
- Only `VITE_SUPABASE_PUBLISHABLE_KEY` and `VITE_SUPABASE_URL` are safe for client
- All private operations go through edge functions
- Service role key is for edge functions only

## Routing

### Public Routes
`/` `/explore` `/apartments` `/apartments/:id` `/rentals` `/cars` `/cars/:id` `/restaurants` `/restaurants/:id` `/events` `/events/:id` `/:type/:id` `/concierge` `/how-it-works` `/pricing` `/privacy` `/terms` `/sitemap` `/onboarding`

### Auth Routes
`/login` `/signup` `/forgot-password` `/reset-password`

### Protected Routes (require auth)
`/dashboard` `/saved` `/collections` `/trips` `/trips/new` `/trips/:id` `/bookings` `/notifications`

### Admin Routes
`/admin` `/admin/apartments` `/admin/restaurants` `/admin/events` `/admin/cars` `/admin/users`

## Design System

- **Fonts:** DM Sans (body), Playfair Display (headings/display)
- **Palette:** Emerald primary, cream backgrounds, charcoal text (HSL tokens in `index.css`)
- **All colors via CSS variables** — no hardcoded hex/rgb values
- **Dark mode:** supported via `class` strategy on `<html>`
- Use `cn()` from `@/lib/utils` for conditional classes
- Use shadcn/ui components — don't rebuild primitives

## Backend Rules

- **Database is source of truth** — not cache, not frontend state
- Schema changes require migrations
- All external API calls go through edge functions
- Consistent response shape: `{ success: true, data }` or `{ success: false, error: { code, message } }`
- Idempotency keys for payment/booking operations
- Pagination default: 50 items

## Supabase Rules

- **RLS on all tables** — no public writes, user-scoped reads
- Never modify `auth.users` directly — use `profiles` table
- Never expose service role key in frontend
- Use `(select auth.uid())` subquery pattern in RLS policies (not direct `auth.uid()`)
- Add indexes for foreign keys and filter columns

## Edge Function Rules

- Validate auth on every request (401/403 responses)
- Validate all inputs with Zod schemas
- Structured responses (success/error format)
- Rate limits: AI 10 req/min/user, Search 30 req/min/user
- Log all AI runs to `ai_runs` table (agent_name, tokens, duration, status)
- Timeouts: 30s for AI calls, 10s for DB queries
- Graceful fallbacks on timeout

## Database

24+ tables in Supabase PostgreSQL with pgvector:

**Core:** `profiles`, `apartments`, `cars`, `restaurants`, `events`, `collections`
**Bookings:** `bookings`, `saved_places`
**Trips:** `trips`, `trip_items`
**AI:** `conversations`, `messages`, `agent_jobs`, `ai_context`, `ai_runs`
**System:** `notifications`

PostGIS enabled for geospatial queries. pgvector for semantic search embeddings.

## AI Integration

Claude 3.5 Sonnet powers 6 AI edge functions:
- `ai-chat` — Multi-agent chat with tool-calling and streaming
- `ai-search` — Semantic search across apartments, restaurants, cars, events
- `ai-router` — Intent classification (routes to correct agent)
- `ai-trip-planner` — AI-assisted trip planning
- `ai-optimize-route` — Route optimization for trips
- `ai-suggest-collections` — Curated collection suggestions

Google Directions API proxied through `google-directions` edge function.

## Environment Variables

### Public (safe for frontend — in `.env`)
```
VITE_SUPABASE_PROJECT_ID       # Supabase project ID
VITE_SUPABASE_PUBLISHABLE_KEY  # Supabase anon key
VITE_SUPABASE_URL              # Supabase API URL
VITE_GOOGLE_MAPS_API_KEY       # Google Maps (currently empty)
```

### Private (in `.env.local` — git-ignored via `*.local`)
```
SHOPIFY_CATALOG_API_KEY              # Shopify catalog access
SHOPIFY_DEV_DASHBOARD_ID             # Shopify partner dashboard
SHOPIFY_CLI_TOKEN                    # Shopify CLI auth (CRITICAL — never commit)
SHOPIFY_CLI_ORGANIZATION_ID          # Shopify org ID
PUBLIC_STORE_DOMAIN                  # mdeaidev.myshopify.com
PUBLIC_STOREFRONT_API_TOKEN          # Storefront API (read-only, public)
PRIVATE_ADMIN_API_ACCESS_TOKEN       # Admin API (CRITICAL — never commit)
PUBLIC_STOREFRONT_API_VERSION        # API version (2026-01)
GADGET_API_KEY                       # Gadget public key
GADGET_API_SECRET                    # Gadget secret (CRITICAL — never commit)
```

Edge function secrets configured in Supabase dashboard:
`GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`, `GOOGLE_MAPS_API_KEY`, `GOOGLE_PLACES_API_KEY`, `GOOGLE_ROUTES_API_KEY`, `INFOBIP_API_KEY`, `INFOBIP_BASE_URL`, `INFOBIP_PHONE_NUMBER`

## Commerce Tooling

| Tool | Version | Purpose |
|------|---------|---------|
| Gadget CLI (`ggt`) | 3.0.0 | Sync Gadget app locally |
| Shopify CLI | 3.93.0 | Manage Shopify app + extensions |
| Shopify app | `mdeai-development` | Scaffolded at `~/mdeai-development/`, connected to Gadget |
| Dev store | `mdeaidev.myshopify.com` | Headless Shopify dev store |

### Shopify App Location
The Shopify React Router app lives at `~/mdeai-development/` (separate repo from this one). It connects to Gadget at `mdeai--development.gadget.app`.

## AI Models (Edge Functions)

All edge functions call Google Gemini directly via OpenAI-compatible endpoint:
`https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`

| Edge Function | Model | Purpose |
|--------------|-------|---------|
| ai-chat (x3 calls) | `gemini-3-flash-preview` | Main conversational AI |
| ai-search (x2) | `gemini-3-flash-preview` | Semantic search parsing |
| ai-router | `gemini-3.1-flash-lite-preview` | Intent classification (cheapest) |
| ai-trip-planner | `gemini-3.1-pro-preview` | Complex trip generation |
| ai-optimize-route | `gemini-3-flash-preview` | Route optimization |
| rentals | `gemini-3.1-pro-preview` | Rental intake conversation |

Auth: `GEMINI_API_KEY` secret in Supabase dashboard.

## .claude/ Architecture

### Rules (`.claude/rules/`)
- `style-guide.md` — TypeScript, React, file naming, imports, styling
- `supabase-patterns.md` — RLS, client usage, schema, security
- `edge-function-patterns.md` — Request lifecycle, auth, validation, AI logging
- `ai-interaction-patterns.md` — Propose-only, intent router, chat, embeddings

### Commands (`.claude/commands/`)
- `/process-task [ID|description|latest]` — Execute a task from backlog
- `/deploy-check [quick|full]` — Pre-deployment verification checklist

### Skills (`.claude/skills/`)
- `mdeai-freshness` — Triggers on: freshness, roasted, badge, coffee age
- `mdeai-commerce` — Triggers on: shopify, gadget, cart, checkout, buy, order
- `mdeai-three-panel` — Triggers on: panel, layout, sidebar, responsive

### Agents (`.claude/agents/`)
- `security-auditor` — Scans for exposed secrets, missing RLS, auth bypasses (haiku)
- `performance-reviewer` — Checks re-renders, query efficiency, bundle size (haiku)

### Installed Skills (`.agents/skills/`)
- `gadget-best-practices` — Gadget models, actions, routes, Shopify integration
- `shopify-development` — GraphQL Admin API, CLI, Polaris, Liquid
- `shopify-apps` — Modern Shopify app template with React Router
- `shopify-hydrogen` — Hydrogen + Oxygen storefront
- `shopify-app-deployment` — Deployment strategies for Shopify apps

## Phase 1 Priorities

Commerce integration (IN PROGRESS):
1. ~~Connect Shopify headless dev store via Gadget.dev~~ DONE
2. ~~Build `/coffee` route displaying products from Gadget~~ DONE
3. ~~Cart via Storefront API mutations~~ DONE (useShopifyCart hook)
4. Test full checkout flow (needs test products in Shopify)
5. Extend `ai-chat` to search real Shopify products
6. ~~Deploy to mdeai.co via Vercel~~ DONE (live at www.mdeai.co)

## Known Issues

- Admin routes lack proper admin auth guards (useAdminAuth hook needs audit)
- No e2e tests written yet (Playwright configured but empty)
- Unit test coverage is minimal
- `bun.lockb` and `package-lock.json` both present — pick one package manager
- Need test coffee products in Shopify dev store + Gadget sync

## Git Workflow

- Branch from `main` for features
- Run `npm run lint && npm run build` before pushing
- Repo: github.com/amo-tech-ai/medell-n-connect
- Vercel auto-deploys on push to main
