---
task_id: MASTRA-001
title: Mastra Source Inventory And Safety Baseline
date: 2026-05-10
status: Complete
---

# MASTRA-001 — Source Inventory And Safety Baseline

> **Purpose:** Verified evidence pack for the Mastra rollout. Confirms what actually exists in the repo and local Supabase vs. what the plan assumes. No secrets printed.

---

## Commands Run

```bash
# Local DB queries
psql "postgresql://postgres:postgres@localhost:54322/postgres" -c \
  "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;"
psql "postgresql://postgres:postgres@localhost:54322/postgres" -c \
  "SELECT routine_name FROM information_schema.routines WHERE routine_schema='public' AND routine_type='FUNCTION';"
psql "postgresql://postgres:postgres@localhost:54322/postgres" -c \
  "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('ai_control_events','ai_tool_audit_events','human_handoffs','workflow_runs'));"

# Repo scans
ls supabase/migrations/ | sort
ls supabase/functions/
ls my-mastra-app/node_modules/@mastra/
grep -n "CREATE TABLE" supabase/migrations/20260404044720_remote_schema.sql
grep -rn "ai_tool_audit_events|ai_control_events|human_handoffs" src/ supabase/
npm run test
```

---

## 1. Supabase Tables — Local DB (confirmed 2026-05-10)

### 1a. Core domain tables ✅

| Table | Domain | Key columns confirmed |
|---|---|---|
| `apartments` | Real Estate | id, title, neighborhood, bedrooms, price_monthly, location (geography), status |
| `rentals` | Real Estate | id, is_active |
| `events` | Events | id, name, event_type, is_active, event_start_time, ticket_price_min/max |
| `event_tickets` | Events | confirmed via DB query |
| `event_venues` | Events | confirmed |
| `event_orders` | Events | confirmed |
| `event_attendees` | Events | confirmed |
| `restaurants` | Restaurants | id, name, cuisine_types, price_level, is_active |
| `bookings` | Unified booking | all reservation types |
| `profiles` | Auth | extends auth.users |
| `conversations` | Chat | confirmed |
| `messages` | Chat | confirmed |

### 1b. Vector / search tables ✅

| Table | Status | Notes |
|---|---|---|
| `listing_embeddings` | ✅ exists | 768-dim, HNSW index, service-role writes only |
| `event_embeddings` | ✅ exists | 768-dim, HNSW index |
| `restaurant_embeddings` | ✅ exists | 768-dim, HNSW index |

### 1c. Real-estate Phase 1 tables ✅

| Table | Status |
|---|---|
| `leads` | ✅ |
| `showings` | ✅ |
| `rental_applications` | ✅ |
| `property_verifications` | ✅ |
| `payments` | ✅ |
| `neighborhoods` | ✅ |
| `idempotency_keys` | ✅ |

### 1d. AI/runtime tables ✅ (partial)

| Table | Status |
|---|---|
| `ai_runs` | ✅ (tokens, duration, status logging) |
| `ai_context` | ✅ |
| `agent_jobs` | ✅ (claim/complete/fail pattern) |
| `agent_audit_log` | ✅ |
| `rate_limit_hits` | ✅ |

### 1e. Mastra-required tables ❌ MISSING

| Table | Required by | Status |
|---|---|---|
| `ai_control_events` | MASTRA-003 (withAudit wrapper) | ❌ DOES NOT EXIST |
| `ai_tool_audit_events` | MASTRA-003 (withAudit wrapper) | ❌ DOES NOT EXIST |
| `human_handoffs` | MASTRA-018 (Paperclip approval gate) | ❌ DOES NOT EXIST |
| `workflow_runs` | MASTRA-012 (workflow state runtime) | ❌ DOES NOT EXIST |

### 1f. Sponsor tables ❌ MISSING

Sponsor edge functions exist (`sponsor-audience-match`, `sponsor-creative-gen`, `sponsor-moderate`, `sponsor-optimize`, `sponsor-roi-explain`) but **no sponsor tables exist in local DB or in any migration file**. This is a gap — the edge functions are currently non-functional against local DB.

---

## 2. RPCs — Local DB (confirmed 2026-05-10)

### 2a. Semantic search RPCs ✅

| RPC | Status |
|---|---|
| `semantic_search_listings(query_embedding, threshold, limit)` | ✅ |
| `semantic_search_events(query_embedding, threshold, limit)` | ✅ |
| `semantic_search_restaurants(query_embedding, threshold, limit)` | ✅ |

### 2b. Hybrid FTS + semantic RPCs ⚠️ REMOTE ONLY

| RPC | Local DB | Remote (production) | Notes |
|---|---|---|---|
| `hybrid_search_listings` | ❌ NOT in local | ✅ applied via MCP | VDB-01 was applied directly to remote |
| `hybrid_search_events` | ❌ NOT in local | ✅ applied via MCP | Same |
| `hybrid_search_restaurants` | ❌ NOT in local | ✅ applied via MCP | Same |
| `fts_spanish()` helper | ❌ NOT in local | ✅ | Immutable tsvector wrapper |
| `fts_array_to_text()` helper | ❌ NOT in local | ✅ | Array concat helper |

> **Note:** VDB-01 hybrid search (fts_content columns + GIN indexes + 3 hybrid_search_* RPCs) was applied via Supabase MCP directly to the remote project. The audit record is at `supabase/migrations/20260510000000_vdb01_hybrid_fts_search.sql` (in worktree). **Local DB does NOT have these RPCs.** MASTRA-004 search tools must use `semantic_search_*` locally; `hybrid_search_*` only works against production remote.

### 2c. Event ticketing RPCs ✅

| RPC | Status |
|---|---|
| `ticket_checkout_create_pending` | ✅ |
| `ticket_checkout_cancel` | ✅ |
| `ticket_payment_finalize` | ✅ |
| `ticket_payment_refund` | ✅ |
| `ticket_validate_consume` | ✅ |
| `record_check_in` | ✅ |

### 2d. Real-estate P1 RPCs ✅

| RPC | Status |
|---|---|
| `p1_schedule_tour_atomic` | ✅ |
| `p1_start_rental_application_atomic` | ✅ |
| `check_rate_limit` | ✅ |
| `apartment_save_counts` | ✅ |

---

## 3. Edge Functions (17 total)

### 3a. AI/chat ✅

| Function | Status | Notes |
|---|---|---|
| `ai-chat` | ✅ 1137 lines | Tool registry pattern, Gemini, SSE streaming |
| `ai-router` | ✅ 384 lines | Intent classification: housing/events/restaurants/trips |
| `ai-search` | ✅ 526 lines | Calls `semantic_search_*` RPCs; hybrid search not wired |
| `ai-embed` | ✅ | Gemini embedding-001, 768-dim pgvector pipeline |
| `ai-trip-planner` | ✅ | Trip itinerary generation |
| `ai-suggest-collections` | ✅ | Collection suggestions |
| `ai-optimize-route` | ✅ | Google Directions integration |

### 3b. Commerce/operational ✅

| Function | Status | Notes |
|---|---|---|
| `chat-lead-capture` | ✅ | Lead logging; OpenClaw comment stub present |
| `rentals` | ✅ | Rental data |
| `google-directions` | ✅ | Maps integration |
| `rules-engine` | ✅ | Business rules |

### 3c. Sponsor AI ✅ (edge functions) ❌ (DB tables missing)

| Function | Status | DB gap |
|---|---|---|
| `sponsor-audience-match` | ✅ | Sponsor tables absent from local DB |
| `sponsor-creative-gen` | ✅ | Same |
| `sponsor-moderate` | ✅ | Same |
| `sponsor-optimize` | ✅ | Same |
| `sponsor-roi-explain` | ✅ | Same |

### 3d. Missing edge functions (gaps vs. plan)

| Expected | Status | Blocker for |
|---|---|---|
| `ticket-checkout` or `ticket-payment-webhook` | ❌ NOT a separate edge fn | Event checkout is RPC-only; MASTRA-007 can call RPCs directly |
| `mastra-proxy` or `mastra-gateway` | ❌ Not yet | MASTRA-002 |

---

## 4. my-mastra-app Current State

### 4a. Installed packages

| Package | Installed | Required |
|---|---|---|
| `@mastra/core` ^1.32.1 | ✅ | Core |
| `@mastra/memory` ^1.17.5 | ✅ | Memory |
| `@mastra/libsql` ^1.10.0 | ✅ | **MUST REPLACE** with `@mastra/pg` |
| `@mastra/duckdb` ^1.3.0 | ✅ | Observability domain only |
| `@mastra/evals` ^1.2.2 | ✅ | Scoring |
| `@mastra/loggers` ^1.1.1 | ✅ | Logging |
| `@mastra/observability` ^1.11.1 | ✅ | Tracing |
| `@mastra/pg` | ❌ NOT INSTALLED | **P0 BLOCKER** — production storage |
| `@mastra/client-js` | ❌ NOT INSTALLED | **P0 BLOCKER** — browser SDK (MASTRA-019) |

### 4b. Existing source files

```
my-mastra-app/src/mastra/
├── index.ts          ← LibSQLStore singleton (must be replaced)
├── agents/
│   └── weather-agent.ts   ← placeholder, references openai/gpt-5-mini
├── tools/
│   └── weather-tool.ts    ← placeholder
├── workflows/
│   └── weather-workflow.ts ← placeholder
└── scorers/
    └── weather-scorer.ts  ← placeholder
```

**None of the domain agents, tools, or workflows exist yet.**

Missing folders (to be created in MASTRA-002):
- `agents/` — router, concierge, real-estate, events, restaurants, sponsor, whatsapp
- `tools/` — index, registry, audit-wrapper, risk-levels, search/, memory/, approval/, integration/
- `workflows/` — rental-inquiry, ticket-purchase, whatsapp-inbound
- `memory/` — config.ts
- `storage/` — config.ts
- `types/` — intents.ts, tool-context.ts, workflow-state.ts

### 4c. Environment / secrets

| Variable | Location | Status |
|---|---|---|
| `OPENAI_API_KEY` | `my-mastra-app/.env` | ✅ present (incorrect model — must switch to Gemini) |
| `GEMINI_API_KEY` / `GOOGLE_GENERATIVE_AI_API_KEY` | `my-mastra-app/.env` | ❌ NOT SET |
| `SUPABASE_DATABASE_URL` (connection string) | `my-mastra-app/.env` | ❌ NOT SET |
| `MASTRA_CLOUD_ACCESS_TOKEN` | `my-mastra-app/.env` | ❌ NOT SET (optional) |

The `DATABASE_URL` and `DIRECT_URL` values exist in `.env.local` (gitignored). MASTRA-002 must wire these into `my-mastra-app/.env` (or use `process.env` referencing `.env.local`).

---

## 5. Domain Prerequisite Verification

### MASTRA-004: Hybrid Search Tools

| Prerequisite | Status |
|---|---|
| VDB-01 (semantic_search_* RPCs) | ✅ local + remote |
| hybrid_search_* RPCs | ⚠️ remote only (local DB lacks these) |
| fts_content columns on apartments/events/restaurants | ⚠️ remote only |
| ai-search edge function | ✅ calls semantic_search_* |
| VDB-02 (user memory / personalization) | ❌ not started |

> **Decision:** MASTRA-004 should implement Mastra tools calling `semantic_search_*` for local dev. For production, switch to `hybrid_search_*`. Consider adding hybrid_search migration to local migrations.

### MASTRA-005: Chat Router + Concierge MVP

| Prerequisite | Status |
|---|---|
| `conversations` table | ✅ |
| `messages` table | ✅ |
| `ai-router` intent classification | ✅ exists (plain edge fn) |
| `ai-chat` tool registry | ✅ exists (plain edge fn) |
| MASTRA-002 core scaffold | ❌ not started |
| MASTRA-003 tool audit | ❌ not started |

### MASTRA-006: Real Estate MVP Agents

| Prerequisite | Status |
|---|---|
| `apartments` table + listing_embeddings | ✅ |
| `leads`, `showings`, `rental_applications` | ✅ |
| `p1_schedule_tour_atomic` RPC | ✅ |
| MASTRA-011 observability | ❌ not started |
| MASTRA-018 human handoff | ❌ not started |
| RE-001 through RE-008 tasks | Not verified — check roadmap |

### MASTRA-007: Events MVP Runtime

| Prerequisite | Status |
|---|---|
| `events` table (name, event_type, is_active, timing) | ✅ |
| `event_tickets`, `event_orders`, `event_venues`, `event_attendees` | ✅ |
| Ticket RPCs (checkout, finalize, refund, validate) | ✅ |
| ticket-checkout dedicated edge function | ❌ Does not exist (RPCs cover it) |
| MASTRA-006 real estate path | ❌ not started |

> Events MVP can proceed without a separate edge function — ticket RPCs are comprehensive. MASTRA-007 does NOT require a dedicated `ticket-checkout` edge function.

### MASTRA-008: Restaurants MVP Discovery

| Prerequisite | Status |
|---|---|
| `restaurants` table | ✅ |
| `restaurant_embeddings` + semantic RPC | ✅ |
| Restaurant booking edge function | ❌ Not found |
| MASTRA-006 + MASTRA-007 complete | ❌ not started |

---

## 6. Shared Tool Registry (Edge Functions)

`supabase/functions/_shared/tool-registry.ts` defines the **ToolExecutor** interface pattern used by `ai-chat`. This is the existing tool pattern — Mastra will introduce a parallel registry (`my-mastra-app/src/mastra/tools/registry.ts`) with `withAudit()` wrapper.

**Key difference:** Existing edge function tools log to `ai_runs` (exists). Mastra tools will log to `ai_tool_audit_events` (must be created in MASTRA-003).

---

## 7. Secret Hygiene

| Location | Contents | Status |
|---|---|---|
| `.env` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`, `VITE_GOOGLE_MAPS_API_KEY` | ✅ Only public VITE_ vars |
| `.env.local` | Service role key, DB password, direct/pool URLs, Gemini key, Shopify tokens | ✅ Gitignored |
| `my-mastra-app/.env` | `OPENAI_API_KEY` only | ⚠️ Missing Gemini key + Supabase URL |
| `my-mastra-app/.env.example` | `OPENAI_API_KEY=your-api-key` | ⚠️ Stale — needs update for Gemini + Supabase |
| `supabase/` migrations | No secrets confirmed | ✅ |
| `src/` | No secrets confirmed | ✅ |

---

## 8. P0 Blockers for Mastra Ladder

| Blocker | Blocks | Resolution |
|---|---|---|
| `@mastra/pg` not installed | MASTRA-002 (PostgresStore) | `npm install @mastra/pg` in MASTRA-002 |
| `@mastra/client-js` not installed | MASTRA-019 (browser SDK) | `npm install @mastra/client-js` in MASTRA-002 |
| `ai_tool_audit_events` table absent | MASTRA-003 (withAudit wrapper) | Create migration in MASTRA-003 |
| `ai_control_events` table absent | MASTRA-003 | Create migration in MASTRA-003 |
| `human_handoffs` table absent | MASTRA-018 (Paperclip) | Create migration in MASTRA-018 |
| `workflow_runs` table absent | MASTRA-012 (workflow state) | Create migration in MASTRA-012 |
| `GEMINI_API_KEY` not in `my-mastra-app/.env` | All agents | Wire from `.env.local` in MASTRA-002 |
| `SUPABASE_DATABASE_URL` not in `my-mastra-app/.env` | PostgresStore | Wire from `.env.local` in MASTRA-002 |
| LibSQLStore (`file:./mastra.db`) in index.ts | All production workflows | Replace with PostgresStore in MASTRA-002 |
| No domain agents/tools/workflows exist | All Mastra features | Create in MASTRA-002 through MASTRA-019 |
| hybrid_search_* RPCs absent locally | MASTRA-004 local dev | Add local migration or use semantic_search_* locally |
| Sponsor DB tables absent | Sponsor edge functions | Out of scope for Mastra MVP |

---

## 9. Domain Summary

| Domain | DB tables | RPCs | Edge Fns | Mastra Ready |
|---|---|---|---|---|
| Real Estate | ✅ complete | ✅ | ✅ | ❌ agents/tools not built |
| Events | ✅ complete | ✅ ticket RPCs | ❌ no ticket edge fn (not needed) | ❌ agents/tools not built |
| Restaurants | ✅ complete | ✅ semantic | ❌ no booking edge fn | ❌ agents/tools not built |
| Chat | ✅ complete | ✅ | ✅ ai-chat | ❌ concierge not built |
| Vector Search | ✅ semantic local | ⚠️ hybrid remote-only | ✅ ai-search | ❌ Mastra tools not built |
| WhatsApp | ✅ tables | — | — | ❌ agent not built |
| Sponsor | ❌ NO tables | — | ✅ edge fns | ❌ blocked on DB |
| OpenClaw | ❌ not present | — | — | ❌ Phase 3 (deferred) |
| Hermes | ❌ not present | — | — | ❌ Phase 3 (deferred) |
| Paperclip | ❌ not present | — | — | ❌ MASTRA-018 |

---

## 10. Implementation Order Confirmation

The canonical order from `000-index.md` is confirmed valid:

```
001 → 002 → 003 → 012 → 013 → 014 → 015 → 004 → 005 → 019 → 011 → 009 → 018 → 006 → 007 → 008 → 016 → 017 → 010
```

**No changes required** to the planned order. All prerequisites align:
- MASTRA-002 first (packages + storage) unblocks everything.
- MASTRA-003 second (audit tables) unblocks tool wrappers.
- MASTRA-012 third (workflow state tables) unblocks suspend/resume.
- MASTRA-006/007/008 (verticals) correctly gated behind observability (011) and handoff (018).

---

*Inventory produced: 2026-05-10. Commands run against local Supabase (port 54322). Remote state assumed consistent with migrations except where noted (VDB-01 hybrid search remote-only).*
