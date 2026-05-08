# CLAUDE.md — mdeai.co

> **Source of truth for product strategy:** [prd.md](./prd.md) (v5.1, 2026-05-05). When CLAUDE.md and prd.md disagree, prd.md wins.

> **Active work + ordering:** [tasks/todo.md](./tasks/todo.md). Top of file = next thing to ship. When a task ships, move it to [changelog](./changelog) — don't leave `[x]` rows in todo.md.

> **Skills (mandatory check before non-trivial work):** browse [.claude/skills/](./.claude/skills/) and load any matching domain skill before editing. Each skill is a folder with a `SKILL.md` (or `.md` file at the root) containing `name`, `description`, and instructions. Owner skills for this repo: `mde-supabase`, `mde-vercel`, `mde-github`, `mde-stripe`, `mde-whatsapp`, `mde-real-estate`, `mde-testing`, `mde-task-lifecycle`, `mde-infisical`, `mde-firecrawl`, `mde-roadmap`, `mde-writing-plans`, `mdeai-three-panel`, `working-with-claude-code`. If a request matches a skill name or its triggers (Supabase / RLS / Vercel / Stripe / WhatsApp / events / sponsors / etc.), open the skill file first.

## Project Overview

**mdeai.co** is an AI-first platform for Medellín built around four product pillars (see prd.md §1):

1. **Rentals AI Chat** — semantic apartment + rental search with lead capture (Live)
2. **Events + Tickets** — host wizard, ticket buy flow, staff PWA scanner (Phase 1, current)
3. **Contests + Voting** — Miss Elegance Colombia flagship, hybrid scoring, leaderboard (Phase 2)
4. **Sponsorship Marketplace** — sponsor onboarding, ROI dashboard, AI brand-fit (Phase 3)

**Status:** ~55% overall (42/76 tasks per prd.md). 259/259 tests passing. Build clean (~6s). Live at https://www.mdeai.co.

**Vercel:** auto-deploys `main` to mdeai.co.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vite 5 + React 18 + TypeScript + SWC |
| UI | shadcn/ui (Radix primitives) + Tailwind CSS 3 |
| State | TanStack Query (server) + React Context (client) + Supabase Realtime |
| Routing | react-router-dom v6 |
| Backend | Supabase PostgreSQL + pgvector + 9 Edge Functions |
| Auth | Supabase Auth (email/password + Google OAuth) |
| AI | Google Gemini via Supabase Edge Functions (see "AI Models" table below) |
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

All AI runs on **Google Gemini** via the OpenAI-compatible endpoint
`https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`.
There is **no Anthropic / Claude API in production** — Claude is only used in dev tooling (Claude Code).

Core agents (see "AI Models" table below for the exact model per function):
- `ai-router` — Intent classification (cheapest model)
- `ai-chat` — Multi-agent chat with tool-calling + SSE streaming
- `rentals` — Rental intake + structured lead extraction
- `ai-search` — Semantic search (pgvector) across listings
- `ai-trip-planner` — Multi-day itinerary generation
- `ai-optimize-route` — Trip item reordering by proximity

Phase 2/3 agents: `ai-roi-explain`, `ai-creative-gen`, `ai-audience-match`, `vote-cast`, `scam-score`, `listing-moderate`. Full agent inventory in [prd.md §3.1](./prd.md).

Google Directions API proxied through `google-directions` edge function.

## Secrets — Infisical Agent Vault is the only source of truth

**All credentials, API keys, and tokens live in self-hosted Infisical at `http://localhost:80`.** Never paste a secret into chat, into a file, into a `.env`, or into a commit. If Claude needs a secret, it gets injected at runtime by Agent Vault — Claude never sees the raw value.

| Surface | URL / command |
|---|---|
| Dashboard | http://localhost:80/login |
| Project overview | http://localhost/organizations/0efac210-70fc-457b-accc-b56fe6835162/projects/secret-management/82d12c1d-c7dc-4b0e-82e2-2fca61340102/overview |
| Project ID | `82d12c1d-c7dc-4b0e-82e2-2fca61340102` |
| Org ID | `0efac210-70fc-457b-accc-b56fe6835162` |
| CLI config | `~/.infisical/infisical-config.json` (already pointing at `localhost:80/api`) |
| Launch Claude with secrets injected | `agent-vault run -- claude` |
| One-shot inject | `infisical run --env=prod -- <cmd>` |
| List secrets | `infisical secrets --env=prod` |
| Push to Supabase edge fns | `supabase secrets set` (Infisical → Supabase, never the reverse) |
| Upstream | https://github.com/infisical/infisical |

> **Skill:** read [`.claude/skills/mde-infisical/SKILL.md`](./.claude/skills/mde-infisical/SKILL.md) before doing any secret-related work (rotation, sync, agent broker, secret-sync targets).

### Public env vars (the only things allowed in `.env`)
```
VITE_SUPABASE_PROJECT_ID       # Supabase project ID
VITE_SUPABASE_PUBLISHABLE_KEY  # Supabase anon key
VITE_SUPABASE_URL              # Supabase API URL
VITE_GOOGLE_MAPS_API_KEY       # Google Maps JS key (set in Vercel for prod)
```

`.env` may only contain the four `VITE_*` vars above. Every other credential — Stripe, Gemini, Infobip, Supabase service role, staff/QR signing secrets, cron secrets — lives in Infisical and is synced to Supabase / Vercel by `mde-infisical`. **Never** put a service role key, Stripe secret, Gemini key, or any non-`VITE_*` value into `.env`, the repo, or chat.

### Edge function secrets (Supabase dashboard)
`GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`, `GOOGLE_MAPS_API_KEY`, `GOOGLE_PLACES_API_KEY`, `GOOGLE_ROUTES_API_KEY`, `INFOBIP_API_KEY`, `INFOBIP_BASE_URL`, `INFOBIP_PHONE_NUMBER`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_TICKET_CHECKOUT_KEY`, `STRIPE_TICKET_WEBHOOK_KEY`, `STRIPE_SPONSOR_CHECKOUT_KEY` (⚠ not yet set — blocks sponsor checkout), `STRIPE_SPONSOR_WEBHOOK_KEY`, `STAFF_LINK_SECRET`, `QR_SIGNING_SECRET`, `LEAD_REMINDER_CRON_SECRET`.

> **Commerce / e-commerce is out of scope.** Shopify, Gadget, Hydrogen, and any storefront layer belong to a far-future phase. Do **not** add `SHOPIFY_*`, `GADGET_*`, or storefront variables, skills, or scaffolding to this repo.

## AI Models (Edge Functions)

All edge functions call Google Gemini directly via OpenAI-compatible endpoint:
`https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`

| Edge Function | Model | Purpose |
|--------------|-------|---------|
| ai-router | `gemini-3.1-flash-lite-preview` | Intent classification (cheapest) |
| ai-chat (x3 calls) | `gemini-3-flash-preview` | Main conversational AI |
| ai-search (x2) | `gemini-3-flash-preview` | Semantic search parsing |
| ai-trip-planner | `gemini-3.1-pro-preview` | Complex trip generation |
| ai-optimize-route | `gemini-3-flash-preview` | Route optimization |
| rentals | `gemini-3.1-pro-preview` | Rental intake conversation |
| ai-roi-explain (P3) | `gemini-3.1-pro-preview` | Sponsor ROI insight |
| ai-creative-gen (P3) | `gemini-3.1-pro-preview` | Ad copy / image prompts |
| ai-audience-match (P3) | `gemini-3.1-pro-preview` | Brand ↔ contest fit scoring |

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
- `/code-review` — Parallel security + performance review of current diff

### Skills (`.claude/skills/`)

Domain owners used in Phase 1 — Phase 3:
- `mde-task-lifecycle` — 5-phase ship workflow (planning → release)
- `mde-supabase` — RLS, edge fns, migrations
- `mde-vercel` — deploy + React perf
- `mde-github` — `gh`, PRs, Actions
- `mde-stripe` — payments (tickets, sponsors)
- `mde-whatsapp` — Twilio + Kapso (lead replies, OTP)
- `mde-real-estate` — rentals marketplace
- `mde-testing` — Vitest + Playwright + Chrome DevTools MCP
- `mdeai-three-panel` — left/main/right layout

> Removed (do not reference): `mdeai-freshness`, `mdeai-commerce`, any `shopify-*`, `gadget-best-practices`, `shopify-hydrogen`, `shopify-app-deployment`. Commerce is out of scope.

### Agents (`.claude/agents/`)
- `mdeai-planner` — strategic plans before code (read-only)
- `mdeai-executor` — implements an approved plan
- `security-auditor` — exposed secrets, missing RLS, auth bypasses
- `performance-reviewer` — re-renders, query efficiency, bundle size

## Phase 1 Priorities (current — Events + Tickets MVP)

Per [prd.md §5.2](./prd.md), Phase 1 build is **100% done**, gate is **not yet passed**. Five items block Phase 2:

1. **Camila E2E** — buy ticket → email arrives → QR displayed (QA, not run)
2. **Roberto E2E** — valid scan ✓ + rescan returns `ALREADY_USED` (QA, not run)
3. **Staff link revocation** — scanner denied within 60s of revoke (QA, not run)
4. **Load test** — 50 concurrent buyers → 0 oversell (Eng, not run)
5. **Lighthouse a11y ≥ 90** on event listing, ticket buy, scanner, host dashboard (QA, not run)

Until all 5 are green, no Phase 2 (contests/voting) work ships.

## Known Issues

- Admin routes lack proper admin auth guards (`useAdminAuth` hook needs audit)
- No Playwright e2e tests written yet (config present, suite empty)
- Unit test coverage is uneven across pages
- `bun.lockb` and `package-lock.json` both present — pick one package manager
- `STRIPE_SPONSOR_CHECKOUT_KEY` not yet set in Supabase prod — sponsor checkout will 500 until set

## Communication style — plain English by default

Every response Claude gives in this project should be **easy to understand for a non-engineer**. The user manages the project but is not a daily coder. Treat every reply as if it were a teammate explaining work to a product owner.

**Rules for every response:**
1. **Lead with what changed and what the user can see** — not the file paths or commit hashes. Example: "The sidebar now shows EXPLORE and MANAGE sections" beats "Modified `ChatLeftNav.tsx` line 42".
2. **Define jargon the first time it appears.** Words like *cherry-pick*, *rebase*, *divergence*, *TDZ*, *pgvector*, *RLS*, *edge function* should each get a one-line plain meaning the first time they show up in a response, even if they reappear elsewhere in the project.
3. **Use concrete numbers and outcomes.** "Tests went from 28 to 41" is clearer than "tests improved". "Live at www.mdeai.co/chat (HTTP 200)" is clearer than "deployed".
4. **When something is technical, give a 1-sentence "why this matters" right after.** Example: *"We diverged 12 ahead and 46 behind. Translation: my computer and GitHub disagreed by 58 commits — Git won't let me just push, so I had to take a longer route."*
5. **Use small tables, bullet lists, and short paragraphs.** Walls of prose don't get read.
6. **Show proof when claiming success.** Test counts, HTTP status, build time, screenshots. Never claim "deployed" without verifying live.
7. **Flag what's NOT done in the same response.** "Shipped X. Still on your computer (not live): Y." prevents surprises.
8. **No code blocks the user doesn't need to read.** If the answer doesn't require copy-paste, summarize the diff in English.
9. **End with the next decision, not a recap.** "Want me to do A or B next?" beats "I have completed the task."

If a response feels like it requires three re-reads, rewrite it shorter and clearer before sending.

## Git Workflow

- Branch from `main` for features
- Run `npm run lint && npm run build` before pushing
- Repo: github.com/amo-tech-ai/medell-n-connect
- Vercel auto-deploys on push to main

## How shipping to production actually works (plain English)

There are **two copies** of the project that can drift apart:

| Where | What it is |
|-------|-----------|
| **Your computer** (local `main`) | The code on this machine. Only you see it. |
| **GitHub** (`origin/main`) | The shared truth. Vercel watches this branch and auto-deploys it to https://www.mdeai.co. |

A change is **only live** after it lands on GitHub's `main`. Code sitting on your computer — even if it's committed locally — is invisible to users.

### The path from "I wrote code" → "users see it"

```
1. Write code locally
2. git commit            → saved on your computer only
3. git push              → uploaded to GitHub (a branch)
4. Open a Pull Request   → ask GitHub to merge your branch into main
5. Merge the PR          → code lands on GitHub's main
6. Vercel auto-deploys   → live on www.mdeai.co (~1-2 min)
```

Skip any step and **it's not live**.

### When local and GitHub disagree ("diverged")

If you commit locally without pushing, and someone else pushes to GitHub, the two timelines split:

- "12 commits ahead, 46 behind" means **your computer has 12 commits GitHub doesn't have**, and **GitHub has 46 commits you don't have**.
- You cannot just push — Git refuses, because it would erase the 46 commits on GitHub.

**Safest fix when diverged:**
1. Make a fresh branch from GitHub's current `main` (not your local one)
2. Cherry-pick only the commits you want to ship onto that branch
3. Push the branch and open a PR
4. Resolve any merge conflicts (your local code touched files GitHub's code also touched)
5. Merge the PR

This is what we did for PR #10 — the C11+C12+C13 sidebar work was 1 commit on local main; we put just that 1 commit onto a clean branch from GitHub and shipped it.

### Why test counts can look weird

`npm run test` runs the tests **that exist in the code on your current branch**. Different branches have different tests:

- If `main` has 41 test files, you'll see "41 passed".
- If your local branch has extra tests not on `main`, you'll see more.
- **A lower number doesn't mean tests broke** — it means the test files for those features aren't on this branch yet.

To get those tests onto `main`, the commits that contain them need their own PR.

### Rule of thumb

> If it's not on GitHub's `main`, it's not on production.
> "I committed it" ≠ "it's deployed."
