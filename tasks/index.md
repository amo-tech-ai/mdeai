# mdeai — Project Index

> **Project:** mdeai.co — AI-powered marketplace for Medellin, Colombia
> **Current vertical:** Real Estate (rentals for digital nomads)
> **Phase system:** CORE → MVP → ADVANCED → PRODUCTION (defined in `roadmap.md` §7)
> **Last updated:** 2026-04-05

## Epic ID Reference

| Epic ID | Prompt File | Name | Phase | RICE Rank |
|---------|-------------|------|-------|-----------|
| E1 / 01E | `tasks/prompts/01E-data-foundation.md` | Data Foundation | CORE | #1 (500) |
| E2 / 02E | `tasks/prompts/02E-lead-to-lease-pipeline.md` | Lead-to-Lease Pipeline | CORE | #5 (80) |
| E3 / 03E | `tasks/prompts/03E-security-hardening.md` | Security Hardening | CORE | #2 (300) |
| E4 / 04E | `tasks/prompts/04E-frontend-rental-flow.md` | Frontend Rental Flow | CORE | #4 (96) |
| E5 / 05E | `tasks/prompts/05E-agent-infrastructure.md` | Agent Infrastructure | ADVANCED | #6 (67) |
| E6 / 06E | `tasks/prompts/06E-hermes-intelligence.md` | Hermes Intelligence | ADVANCED | #7 (30) |
| E7 / 07E | `tasks/prompts/07E-contract-automation.md` | Contract Automation | ADVANCED | #8 (20) |
| E8 / 08E | `tasks/prompts/08E-multi-channel.md` | Multi-Channel | PRODUCTION | #9 (13) |
| E9 / 09E | `tasks/prompts/09E-production-readiness.md` | Production Readiness | MVP | #3 (105) |
| E10 / 10E | `tasks/prompts/10E-crm-real-estate.md` | P1 CRM (real estate) | CORE | — |

**Lettered & cross-epic prompts** (not separate epics): see **`tasks/prompts/INDEX.md`** — e.g. `04A`/`04B` (ai-search / trip planner wire), `05I`–`05N` (Paperclip/OpenClaw audits), `08F`–`08K` (OpenClaw/WA), `11A`/`11B` (real-estate search stack), `12A`–`12C` (trio integration), `02F`–`02H` & `13A`–`13E` (`tasks/audit/06-tasks-audit.md` gaps).

---

## Governance

| Document | Path | Purpose |
|----------|------|---------|
| **Prompt index** | `tasks/prompts/INDEX.md` | **Every epic → prompt file**; lettered tasks; backlog → prompt mapping rule |
| **DB + Edge verify** | `tasks/prompts/VERIFY-supabase-postgres-edge.md` | Checklist prompt (Postgres RLS/indexes + Edge JWT/Zod/errors) |
| **Layer audits** | `tasks/audit/` | Cross-cutting audits: `01-audit-plan`, `02-hermes`, `03-paperclip..md`, `04-openclaw`, `05-trio-agents`, `06-tasks-audit` |
| PRD | `tasks/prd-real-estate.md` | Product requirements (~807 lines; see file for current section count) |
| Roadmap | `tasks/roadmap.md` | Strategic roadmap: epics, RICE, Now/Next/Later, phase system (§7) |
| Progress Tracker | `tasks/progress.md` | Epic view §1–14 + cross-area weighted tracker §15; `notes/progress-tracker.md` redirects here |
| Notes (redirect) | `tasks/notes/progress-tracker.md` | Pointer to `tasks/progress.md` §15 — edit the main file |
| Todo | `tasks/todo.md` | Prioritized next steps (4-week plan) |
| Task Template | `tasks/tasks-template.md` | Frontmatter format for individual task files |
| **mdeai tasks (EX-NNN)** | `tasks/prompts/` (`10A-*`, `10B-*`, …) or `tasks/real-estate/` | Per **`.claude/skills/mdeai-tasks`**: diagram-linked tasks with required **`skills`** list |
| Changelog | `changelog` | Project changelog |
| Incident Response | `tasks/best-practices/incident-response.md` | Payment failures, rollback playbook, post-incident review |
| Data Retention | `tasks/best-practices/data-retention.md` | Retention schedule per table, deletion process, legal holds |
| Gemini Cost Budget | `tasks/best-practices/gemini-cost-budget.md` | Monthly caps, daily alerts, cost estimation, optimization |
| Definition of Done | `tasks/best-practices/definition-of-done.md` | Per-task-type completion criteria (frontend, edge fn, migration, agent) |

---

## Diagrams (Source of Truth)

All diagrams at `tasks/mermaid/`. Full registry: `tasks/mermaid/INDEX.md`

| ID | File | Type | Phase | Description |
|----|------|------|-------|-------------|
| MERM-01 | `01-user-journeys.mmd` | journey | CORE | Renter satisfaction per step (discover → book → move-in) |
| MERM-02 | `02-system-architecture.mmd` | C4Container | CORE | Full system: frontend → backend → agents → data → external |
| MERM-03 | `03-rental-pipeline.mmd` | flowchart | CORE | Lead-to-lease pipeline with 3 Paperclip approval gates |
| MERM-04 | `04-chat-flow.mmd` | sequence | CORE | Message lifecycle: user → router → chat → Gemini → SSE |
| MERM-05 | `05-intake-wizard-flow.mmd` | flowchart | CORE | NL input → Gemini parse → criteria badges → search |
| MERM-06 | `06-data-model.mmd` | erDiagram | CORE | 39 tables (28 existing + 6 P1 + 3 P2 + 2 P3) |
| MERM-07 | `07-agent-architecture.mmd` | flowchart | MVP | Paperclip org chart, adapters, task lifecycle, approval gates |
| MERM-08 | `08-frontend-components.mmd` | classDiagram | CORE | Component hierarchy: existing + P0 + P1 new with props |
| MERM-09 | `09-edge-function-map.mmd` | flowchart | CORE | Edge function I/O specs (keep in sync with **10 deployed** functions below + planned P1/P2) |
| MERM-10 | `10-deployment-architecture.mmd` | flowchart | PRODUCTION | Vercel + Supabase + agents + external + monitoring |

---

## Supabase

### Edge Functions (`supabase/functions/`)

| Function | Lines | Model | Purpose | Status |
|----------|-------|-------|---------|--------|
| `ai-chat` | 952 | Gemini Flash x3 | Multi-agent chat with tool-calling, SSE streaming | Deployed, tested |
| `ai-router` | 418 | Gemini Lite | Intent classification (15+ categories → 4 agents) | Deployed, tested |
| `ai-search` | 489 | Gemini Flash x2 | Semantic search across apartments, cars, restaurants, events | Deployed, untested |
| `ai-optimize-route` | 322 | Gemini Flash | Trip route optimization (Haversine + waypoint ordering) | Deployed, tested |
| `ai-suggest-collections` | 239 | Gemini Flash | Pattern analysis on saved places → collection suggestions | Deployed, tested |
| `ai-trip-planner` | 349 | Gemini Pro | Multi-day itinerary generation | Deployed, untested |
| `google-directions` | 198 | — | Google Routes API proxy with waypoint optimization | Deployed, tested |
| `rentals` | 721 | Gemini Pro | Multi-turn rental intake conversation + filter extraction | Deployed, tested |
| `rules-engine` | 309 | — | Business rules: empty days, overbooking, budget, safety | Deployed, untested |
| `p1-crm` | 264 | — | CRM actions: leads, payments, showings (Zod + JWT + rate limit; **E10**) | Deployed |

**Total:** **10** functions, **~4,261** lines of Deno/TypeScript (run `wc -l supabase/functions/*/index.ts` to refresh).

### New Edge Functions (Planned — P1/P2)

| Function | Phase | Epic | Purpose |
|----------|-------|------|---------|
| `lead-capture` | P1 | E2 | Capture leads from web + WhatsApp, score quality |
| `showing-create` | P1 | E2 | Schedule property showings, notify hosts |
| `application-create` | P1 | E2 | Submit rental applications with AI summary |
| `booking-create` | P1 | E2 | Create bookings from approved applications |
| `payment-webhook` | P1 | E2 | Stripe webhook handler, idempotent payment recording |
| `hermes-ranking` | P2 | E6 | 7-factor composite scoring for search results (deterministic, no LLM) |
| `taste-profile` | P2 | E6 | Learn user preferences from search behavior (exponential decay) |
| `market-snapshot` | P2 | E6 | Periodic rental market condition snapshots per neighborhood |
| `contract-analysis` | P2 | E7 | AI lease review: PDF → terms → risks → bilingual summary |

### Database (`supabase/migrations/`)

**Migration:** `20260404044720_remote_schema.sql` (9,975 lines)

**Extensions:** PostGIS, pgvector, pg_trgm, pgcrypto, uuid-ossp

**Tables (28 existing):**

| Category | Tables |
|----------|--------|
| Core entities | `profiles`, `apartments`, `cars`, `car_rentals`, `restaurants`, `events`, `collections`, `tourist_destinations` |
| Bookings | `bookings`, `saved_places` |
| Trips | `trips`, `trip_items` |
| AI/Chat | `conversations`, `messages`, `agent_jobs`, `ai_context`, `ai_runs` |
| Rentals | `rentals`, `rental_listing_sources`, `rental_listing_images`, `rental_freshness_log`, `rental_search_sessions` |
| User | `user_preferences`, `user_roles`, `budget_tracking`, `proactive_suggestions`, `conflict_resolutions` |
| WhatsApp | `whatsapp_conversations`, `whatsapp_messages` |

**New tables (planned):**

| Table | Phase | Purpose |
|-------|-------|---------|
| `leads` | P1 | CRM lead tracking |
| `showings` | P1 | Property showing appointments |
| `payments` | P1 | Payment records (Stripe) |
| `rental_applications` | P1 | Rental application submissions |
| `property_verifications` | P1 | Listing verification status |
| `neighborhoods` | P1 | Neighborhood data (safety, walkability, nomad scores) |
| `lease_reviews` | P2 | AI lease analysis results |
| `market_snapshots` | P2 | Market intelligence data |
| `taste_profiles` | P2 | User preference learning |
| `communication_logs` | P3 | Multi-channel message logs |
| `payout_records` | P3 | Host payout tracking |

### Configuration

- **Project ID:** `zkwcbyxiwklihegjhuql`
- **JWT verification:** Often **disabled** in `config.toml` (`verify_jwt = false`) with auth handled inside functions — **high risk** if any handler skips validation. **Harden per `03E-security-hardening.md`** and **`13A-e3-edge-security-extensions.md`**; track until production sign-off.
- **Secrets:** Configured in Supabase dashboard (never in repo)

---

## Agent Infrastructure

### Paperclip (`tasks/paperclip/`, `paperclip/`)

| File | Purpose |
|------|---------|
| `tasks/paperclip/01.md` | Main documentation (672 lines) |
| `tasks/paperclip/01-errors.md` | Error scenarios (214 lines) |
| `tasks/paperclip/03-fix.md` | Fixes for identified issues |
| `tasks/paperclip/04-Multi-Agent.md` | Multi-agent orchestration patterns |
| `tasks/paperclip/05-clifix.md` | CLI fixes |
| `tasks/paperclip/06-audit.md` | Audit: CEO 3/10, workspace 2/10, overall needs work |
| `tasks/paperclip/REFERENCE.md` | API reference + workspace binding instructions |

**Status:** Running at :3102, 4 agents (CEO, CMO, CTO, OpsManager). CEO/workspace need **E5-001/002** (`05A`, `05B`); see **`tasks/audit/03-paperclip..md`**, prompts **`05I`–`05L`**, **`05N`**.

### OpenClaw & WhatsApp

| Resource | Purpose |
|----------|---------|
| `tasks/openclaw/links.md` | Official doc map |
| **`tasks/prompts/05M`**, **`05H`**, **`08E`**, **`08F`–`08K`** | Gateway health stub, adapter, multi-channel, WA ingress / correlation / phased adapter |
| **`tasks/audit/04-openclaw.md`** | Execution gap audit |

### Trio (Paperclip · Hermes · OpenClaw · Supabase)

| Resource | Purpose |
|----------|---------|
| **`tasks/audit/05-trio-agents.md`** | End-to-end integration score + Appendix A |
| **`tasks/prompts/12A`–`12C`** | Integration contract, staging runbook, AI routing flags |

### Hermes (`tasks/hermes/`)

| File | Purpose |
|------|---------|
| `tasks/hermes/01-audit.md` | Full audit: overall 5/10, runtime config 4/10 |
| `tasks/hermes/setup.md` | Configuration steps for Hermes + Paperclip |
| `tasks/hermes/REFERENCE.md` | Reference documentation |

**Status:** v0.7.0, 637 skills, Claude via OpenRouter. Needs `instructionsFilePath` and `timeout=30s`.

---

## Real Estate Vertical (`tasks/real-estate/`)

### Research & Analysis (`tasks/real-estate/docs/`)

| File | Topic |
|------|-------|
| `01-open-claw.md` | OpenClaw agent documentation |
| `02-openclaw.md` | Extended OpenClaw patterns |
| `03-lobster.md` | Listing intelligence agent |
| `04-architecture-map.md` | System architecture mapping |
| `05-github-repos.md` | Referenced repositories |
| `06-real-estate.md` | Real estate domain knowledge |
| `07-Top-10-AI-Real-Estate-Repositories.md` | Ranked repo reference |
| `1-trio-real-estate-plan.md` | Agent trio planning |
| `2-supabase-strategy.md` | Database architecture strategy |
| `10-real-estate-tasks.md` | Task breakdown |

---

## Wireframes (`tasks/wireframes/`)

| File | Screen | Phase |
|------|--------|-------|
| `01-rental-search-desktop.md` | Search interface (desktop) | P0 |
| `02-intake-wizard-desktop.md` | Lead capture wizard | P0 |
| `03-listing-detail-desktop.md` | Property detail view | P0 |
| `04-landlord-dashboard.md` | Host management dashboard | P1 |
| `05-showing-scheduler.md` | Appointment scheduling | P0 |
| `06-application-flow.md` | Rental application wizard | P0 |
| `07-mobile-rental-search.md` | Mobile search layout | P0 |
| `08-whatsapp-conversation.md` | WhatsApp bot flow | P2 |
| `09-admin-listings.md` | Admin listing management | P1 |
| `10-ai-strategy-dashboard.md` | AI strategy dashboard | P2 |

---

## Claude Code Configuration (`.claude/`)

### Rules (`.claude/rules/`)

| File | Scope |
|------|-------|
| `style-guide.md` | TypeScript, React, imports, file naming, Tailwind |
| `supabase-patterns.md` | RLS, client usage, schema changes, security |
| `edge-function-patterns.md` | Request lifecycle, auth, validation, AI logging |
| `ai-interaction-patterns.md` | Propose-only pattern, intent router, chat, embeddings |
| `library-references.md` | Tier 1/2/3 reference repos, agent mapping |
| `env-management.md` | Environment variable tiers, storage rules, danger signals |

### Agents (`.claude/agents/`)

| Agent | Model | Purpose |
|-------|-------|---------|
| `security-auditor.md` | haiku | Secret exposure, RLS, auth, input validation, edge fn security |
| `performance-reviewer.md` | haiku | Re-renders, query efficiency, bundle size, Supabase queries |
| `dependency-auditor.md` | haiku | Lockfile conflicts, vulnerabilities, outdated/unused deps |

### Commands (`.claude/commands/`)

| Command | Args | Purpose |
|---------|------|---------|
| `/process-task` | ID / description / `latest` | Execute task from roadmap or backlog |
| `/deploy-check` | `quick` / `full` | Pre-deployment verification checklist |

### Skills (`.claude/skills/`)

| Skill | Triggers | Scope |
|-------|----------|-------|
| `mdeai-freshness` | freshness, roasted, badge | Coffee roast-age badges |
| `mdeai-commerce` | shopify, gadget, cart, checkout | Shopify + Gadget commerce |
| `mdeai-three-panel` | panel, layout, sidebar, responsive | 3-panel layout enforcement |
| `gemini/` | gemini, ai model | Gemini API integration (Deno) |
| `hermes/` | hermes, hermes agent | Hermes agent configuration |
| `open-claw/` | openclaw, open claw, channel | OpenClaw gateway |
| `paper-clip/` | paperclip, paper clip, agent | Paperclip control plane |
| `supabase/` | supabase, edge function | Supabase Edge Functions + Realtime |
| `mermaid-diagrams/` | mermaid, diagram | Diagram creation |
| `prd/` | prd, product requirements | PRD writing |
| `roadmap/` | roadmap | Product/tech roadmaps |
| `real-estate/` | real estate, rental, lease | Domain knowledge |

---

## Roadmap Summary

See `tasks/roadmap.md` for full details (execution order may prioritize **deps > raw RICE**).

| Phase | Weeks | Epics | Key Deliverable |
|-------|-------|-------|-----------------|
| **NOW** (CORE→MVP) | 1-6 | E1 Data Foundation, E2 Pipeline, E3 Security, E4 Frontend, **E10 P1 CRM**, E5 Agents (as deps allow) | Seed + secure APIs + lead/booking path; CRM edge (`p1-crm`) |
| **NEXT** (ADVANCED) | 7-14 | E6 Hermes Intelligence, E7 Contract Automation, E9 Production | Ranking eval, lease review, CI/E2E |
| **LATER** (PRODUCTION) | 15-22 | E8 Multi-Channel (WhatsApp/OpenClaw), E5 automation hardening | WA + correlation IDs + ADR (**08F**); Paperclip ops |
| **FUTURE** | 23+ | Multi-city, Mercur marketplace, mobile app | Expansion |

---

## Quick Reference

```bash
# Dev server
npm run dev          # Port 8080

# Checks
npm run lint         # ESLint
npm run build        # Production build
npm run test         # Vitest
npm run verify:edge  # Deno check + edge tests (scripts/verify-edge-functions.sh)

# Edge functions
supabase functions serve   # Local edge function server

# Agents (Paperclip may use pnpm; mde app uses npm — see `tasks/audit/06-tasks-audit.md`)
cd paperclip && pnpm dev   # Paperclip at :3102 (if paperclip package uses pnpm)
hermes chat -q "query"     # Hermes CLI
```
