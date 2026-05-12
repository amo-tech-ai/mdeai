# CLAUDE.md — mdeai.co

> **Source of truth for product strategy:** [prd.md](./prd.md) (v5.1, 2026-05-05). When CLAUDE.md and prd.md disagree, prd.md wins.

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
| AI | Google Gemini via Supabase Edge Functions |
| Forms | react-hook-form + Zod validation |
| Design | "Paisa" theme — DM Sans + Playfair Display, emerald/cream/charcoal |
| Testing | Vitest (unit) + Playwright (e2e) |

## Quick Commands

```bash
npm run dev          # Start dev server (port 8080, binds to ::)
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest (run once)
npm run test:watch   # Vitest (watch mode)
```

Floor before shipping any change: `npm run lint && npm run build && npm run test`.

## Project Structure

`src/` holds 152+ components, 31 hooks, 3 context providers, and 33 pages. `supabase/` holds 9 edge functions and migrations. Use `glob` or `grep` to discover specific files — don't memorize paths from this doc.

All routes are defined in `src/App.tsx`. Four categories: **public** (explore, listings, concierge), **auth** (login, signup, reset), **protected** (dashboard, trips, bookings), **admin** (`/admin/*`).

`@/` maps to `./src/`. Import order: react → third-party → `@/components` → `@/hooks` → `@/types` → `@/lib`.

## Architecture Rules

### 3-Panel Layout (Mandatory)

Every main page: left (context/filters/nav), main (content/listings), right (map/AI/quick actions). Mobile collapses to single column + bottom nav. See `.claude/rules/style-guide.md`.

### AI Interaction Pattern

AI **proposes only** — never auto-applies changes to bookings, trips, or saved data:
1. **Preview** — Show what AI suggests
2. **Apply** — User confirms action
3. **Undo** — User can revert

See `.claude/rules/ai-interaction-patterns.md` for chat architecture, intent router, and embedding patterns.

### Required States for Data Components

Every data-fetching component must handle all four states:
```tsx
if (isLoading) return <Skeleton />;
if (error) return <ErrorState onRetry={refetch} />;
if (!data?.length) return <EmptyState />;
return <Content data={data} />;
```

### No Client Secrets

Only `VITE_SUPABASE_PUBLISHABLE_KEY` and `VITE_SUPABASE_URL` are safe for client. All private operations go through edge functions. Service role key is for edge functions only.

## Supabase Rules

- **RLS on all tables** — no exceptions; no public writes, user-scoped reads
- Never modify `auth.users` directly — use `profiles` table
- Use `(select auth.uid())` subquery pattern in RLS policies (not direct `auth.uid()`)
- Add indexes for foreign keys and filter columns
- Schema changes require migration files in `supabase/migrations/`

See `.claude/rules/supabase-patterns.md` and the seven Supabase-specific rules in `.claude/rules/supabase-*.md`.

## Edge Function Rules

- Validate auth on every request (401/403 responses)
- Validate all inputs with Zod schemas
- Rate limits: AI 10 req/min/user, Search 30 req/min/user
- Log all AI runs to `ai_runs` table (agent_name, tokens, duration, status)
- Timeouts: 30s for AI calls, 10s for DB queries
- Response shape: `{ success: true, data }` or `{ success: false, error: { code, message } }`

See `.claude/rules/edge-function-patterns.md`.

## Database

24+ tables in Supabase PostgreSQL with pgvector + PostGIS:

**Core:** `profiles`, `apartments`, `cars`, `restaurants`, `events`, `collections`
**Bookings:** `bookings`, `saved_places`
**Trips:** `trips`, `trip_items`
**AI:** `conversations`, `messages`, `agent_jobs`, `ai_context`, `ai_runs`
**System:** `notifications`

## AI Integration

All AI runs on **Google Gemini** via the OpenAI-compatible endpoint
`https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`.
There is **no Anthropic / Claude API in production** — Claude is only used in dev tooling (Claude Code).

| Edge Function | Model | Purpose |
|--------------|-------|---------|
| ai-router | `gemini-3.1-flash-lite-preview` | Intent classification |
| ai-chat | `gemini-3-flash-preview` | Conversational AI + tool-calling |
| ai-search | `gemini-3-flash-preview` | Semantic search (pgvector) |
| ai-trip-planner | `gemini-3.1-pro-preview` | Multi-day itinerary generation |
| ai-optimize-route | `gemini-3-flash-preview` | Route optimization |
| rentals | `gemini-3.1-pro-preview` | Rental intake conversation |
| ai-roi-explain (P3) | `gemini-3.1-pro-preview` | Sponsor ROI insight |
| ai-creative-gen (P3) | `gemini-3.1-pro-preview` | Ad copy / image prompts |
| ai-audience-match (P3) | `gemini-3.1-pro-preview` | Brand ↔ contest fit scoring |

Auth: `GEMINI_API_KEY` secret in Supabase dashboard.

## Environment Variables

### Public (safe for frontend — in `.env`)
```
VITE_SUPABASE_PROJECT_ID
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_URL
VITE_GOOGLE_MAPS_API_KEY
VITE_USE_MASTRA_CHAT        # "true" to route chat through Mastra (must be set in Vercel)
VITE_MASTRA_SERVER_URL      # Mastra server URL, e.g. https://my-mastra-app-beta.vercel.app
```

`.env` may only contain the `VITE_*` vars above. All other secrets live in **Infisical** (source of truth at `localhost:80`) and sync to Supabase / Vercel — never in `.env`.

> **Mastra chat path:** If `VITE_USE_MASTRA_CHAT` is not set to `"true"` in Vercel, all chat traffic falls back to the legacy `ai-chat` Supabase edge function. `VITE_MASTRA_SERVER_URL` defaults to `http://localhost:4111` — this must be the deployed Mastra service URL in production.

### Edge function secrets (Supabase dashboard)
`GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`, `GOOGLE_MAPS_API_KEY`, `GOOGLE_PLACES_API_KEY`, `GOOGLE_ROUTES_API_KEY`, `INFOBIP_API_KEY`, `INFOBIP_BASE_URL`, `INFOBIP_PHONE_NUMBER`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_TICKET_CHECKOUT_KEY`, `STRIPE_TICKET_WEBHOOK_KEY`, `STRIPE_SPONSOR_CHECKOUT_KEY` (⚠ not yet set — blocks sponsor checkout), `STRIPE_SPONSOR_WEBHOOK_KEY`, `STAFF_LINK_SECRET`, `QR_SIGNING_SECRET`, `LEAD_REMINDER_CRON_SECRET`.

> **Commerce / e-commerce is out of scope.** Do **not** add storefront variables, skills, or scaffolding to this repo.

## .claude/ Architecture

### Rules (`.claude/rules/`)

Path-scoped — Claude loads them automatically when editing matching files:

| File | Scope | Content |
|------|-------|---------|
| `style-guide.md` | `src/**` | TypeScript, React, file naming, imports |
| `design.md` | `src/**/*.{css,tsx,ts}` | Paisa brand tokens + responsive rules |
| `supabase-patterns.md` | `src/**`, `supabase/**` | RLS, client usage, schema, security |
| `edge-function-patterns.md` | `supabase/functions/**` | Request lifecycle, auth, AI logging |
| `ai-interaction-patterns.md` | `src/**` | Propose-only, intent router, embeddings |
| `supabase-migrations.md` | `supabase/migrations/**` | Migration file conventions |
| `supabase-rls-policies.md` | `supabase/**/*.sql` | RLS policy patterns |
| `supabase-database-functions.md` | `supabase/**/*.sql` | DB function patterns |
| `supabase-edge-functions.md` | `supabase/functions/**/*.ts` | Edge fn Deno patterns |
| `supabase-realtime.md` | `supabase/functions/**`, `src/**` | Broadcast, presence, channels |
| `communication.md` | always | Response style rules |
| `shipping-and-divergence.md` | always | Local vs GitHub vs production |
| `task-writing.md` | always | Task template + §9 Definition of Done |

### Hooks (`.claude/hooks/`)

Configured in `.claude/settings.json`:
- `post-edit-lint` — runs ESLint after `*.ts|*.tsx` edits (warn-only)
- `guard-sensitive-paths` — blocks writes to `supabase/migrations/**` and `.env*` without explicit approval (set `MDEAI_ALLOW_MIGRATION_EDIT=1` to bypass)

### Commands (`.claude/commands/`)
- `/process-task [ID|description|latest]` — Execute a task from backlog end-to-end
- `/deploy-check [quick|full]` — Pre-deployment verification checklist
- `/code-review` — Parallel security + performance review of current diff

### Skills (`.claude/skills/`)

Domain owner skills for active phases:

| Skill | Purpose |
|-------|---------|
| `mde-task-lifecycle` | 5-phase ship workflow (plan → ship → release) |
| `mde-supabase` | RLS, edge fns, migrations |
| `mde-vercel` | Deploy + React perf |
| `mde-github` | `gh`, PRs, Actions |
| `mde-stripe` | Payments (tickets, sponsors) |
| `mde-whatsapp` | Lead replies, OTP |
| `mde-real-estate` | Rentals marketplace |
| `mde-testing` | Vitest + Playwright + Chrome DevTools MCP |
| `systematic-debugging` | Debugging workflows |
| `mde-task-lifecycle` | Task template + Definition of Done |

> Removed (do not reference): any `shopify-*`, `gadget-best-practices`, `mdeai-freshness`, `mdeai-commerce`. Commerce is out of scope.

### Agents (`.claude/agents/`)
- `mdeai-planner` — strategic plans before code (read-only)
- `mdeai-executor` — implements an approved plan
- `security-auditor` — exposed secrets, missing RLS, auth bypasses
- `performance-reviewer` — re-renders, query efficiency, bundle size

## Phase 1 Priorities (current — Events + Tickets MVP)

Phase 1 build is **100% done**, gate is **not yet passed**. Five items block Phase 2:

1. **Camila E2E** — buy ticket → email arrives → QR displayed (QA, not run)
2. **Roberto E2E** — valid scan ✓ + rescan returns `ALREADY_USED` (QA, not run)
3. **Staff link revocation** — scanner denied within 60s of revoke (QA, not run)
4. **Load test** — 50 concurrent buyers → 0 oversell (Eng, not run)
5. **Lighthouse a11y ≥ 90** on event listing, ticket buy, scanner, host dashboard (QA, not run)

Until all 5 are green, no Phase 2 (contests/voting) work ships.

## Known Issues

- Admin routes lack proper admin auth guards (`useAdminAuth` hook needs audit)
- No Playwright e2e tests written yet (config present, suite empty)
- `bun.lockb` and `package-lock.json` both present — pick one package manager
- `STRIPE_SPONSOR_CHECKOUT_KEY` not yet set in Supabase prod — sponsor checkout will 500 until set

## Communication & Response Style

See `.claude/rules/communication.md` — plain English, lead with what changed, concrete numbers, no jargon without a one-line definition.

## Git Workflow & Shipping

Branch from `main`. Run `npm run lint && npm run build && npm run test` before pushing. Vercel auto-deploys on push to `main`. Repo: github.com/amo-tech-ai/medell-n-connect.

For how local/GitHub/production stay in sync and how to recover from divergence, see `.claude/rules/shipping-and-divergence.md`.

## One worktree, one PR, one testing cycle (hard rule)

Operate on **one worktree at a time** and **one focused PR at a time**. Finish, verify, and merge the current change before starting the next. Scattered worktrees with hidden uncommitted work are the single largest source of lost work and broken merges in this repo.

Before any new worktree or PR, run the six-step cycle: **Locate → Preflight → Research → Code → Verify → Ship**. Type-check passing is *not* a feature working — always exercise the runtime path (curl the endpoint, click the UI, scan the QR) before declaring done.

If a PR's diff grows beyond ~300 lines or mixes intents, **split before merging** (see the playbook). Never close a reviewed PR to "open a cleaner one" — push fixes to the existing PR instead.

- Skill: [`.claude/skills/mde-worktree-pr-flow/`](./.claude/skills/mde-worktree-pr-flow/) — six-step cycle, splitting playbook, `verify-clean.sh`, `list-worktrees.sh`.
- Rule: [`.claude/rules/worktree-discipline.md`](./.claude/rules/worktree-discipline.md) — short-form rule loaded into every conversation.
