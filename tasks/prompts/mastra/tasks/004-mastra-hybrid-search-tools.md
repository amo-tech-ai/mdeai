---
task_id: MASTRA-004
title: Mastra Hybrid Search Tools
phase: CORE
priority: P0
status: Not Started
estimated_effort: 3 days
area: mastra-search
skill: [mde-task-lifecycle, pgvector, supabase]
subagents: [backend, supabase-auditor]
edge_function: null
schema_tables: [apartments, events, restaurants, listing_embeddings, ai_tool_audit_events]
depends_on: [MASTRA-001, MASTRA-002, MASTRA-003, MASTRA-012, MASTRA-013, MASTRA-014, MASTRA-015, VDB-01]
blocks: [MASTRA-005, MASTRA-006, MASTRA-007, MASTRA-008]
---

<!-- task-summary -->
> **What:** Add typed Mastra search tools for rentals, events, and restaurants using Supabase hybrid full-text and pgvector search.
> **Why:** Chat-first mdeAI needs real results from Supabase, not generated recommendations or duplicated search logic.
> **Delivers:** Read-only Mastra tools for entity search, map-area search, and result ranking with audit events.
> **Tools/Skills:** `mde-task-lifecycle` · `pgvector` · `supabase`
> **CORE · P0 · Not Started · Effort: 3 days**
> **Depends on:** MASTRA-001, MASTRA-002, MASTRA-003, MASTRA-012–015, VDB-01

# Mastra Hybrid Search Tools

## Easy Summary

**Purpose:** give Mastra one safe read-only way to search real rentals, events, and restaurants.

**Goals:** call Supabase hybrid FTS + pgvector/PostGIS search, return typed cards, and audit every search.

**Success criteria:** chat can return real cards from Supabase for exact, vibe, neighborhood, and map-area queries.

**Production-ready checklist:**

- Search tools are read-only.
- Supabase remains source of truth for filters, RLS, geo, and vector retrieval.
- Result cards include stable IDs and source table names.
- No fake availability, fake listings, fake events, or fake restaurants.
- Query fixtures cover English/Spanish and no-result cases.

## Description

Create the read-only Mastra search tools used by the Concierge and vertical agents. The tools must call existing Supabase RPCs or edge functions and preserve Supabase as the source of truth.

Use pgvector first. Do not introduce Milvus or another vector store until measured pgvector limits justify it.

## Rationale

The app needs one search layer for rentals, events, and restaurants. Mastra should orchestrate and format results, while Supabase handles filtering, ranking inputs, RLS, PostGIS, and pgvector retrieval.

## User Stories

| Persona | Goal | Outcome |
| --- | --- | --- |
| Renter | ask for "quiet 2BR near Laureles cafes" | I get real listings |
| Visitor | ask for "reggaeton events this weekend" | I get real event cards |
| Diner | ask for "date-night sushi near Provenza" | I get real restaurant options |

## Acceptance Criteria

- [ ] Confirm VDB-01 hybrid search tables/RPCs exist or document them as a blocker.
- [ ] Add `search_entities` Mastra tool with domain enum: `rentals`, `events`, `restaurants`.
- [ ] Add `search_by_map_area` tool for PostGIS bounding box or radius queries.
- [ ] Add `rank_results_for_context` helper that only reorders supplied real results.
- [ ] Return typed result cards with IDs, titles, location/neighborhood, image references, source table, and confidence/reason fields.
- [ ] Write audit events for every search call through MASTRA-003 wrappers.
- [ ] Add fixtures for exact query, vibe query, neighborhood query, and mixed English/Spanish query.
- [ ] Ensure tools are read-only and never create leads, bookings, tickets, or outbound messages.

## Wiring Plan

| Layer | File | Action |
| --- | --- | --- |
| Mastra tools | `my-mastra-app/src/tools/search.ts` | Create typed search tools |
| Supabase RPC | Existing VDB-01 RPCs | Call rather than duplicate SQL |
| Types | `my-mastra-app/src/types/cards.ts` | Define rental/event/restaurant card contracts |
| Tests | `my-mastra-app/src/tools/search.test.ts` | Add fixtures and read-only assertions |
| Docs | `tasks/mastra/mastra-search-runbook.md` | Document query examples and limits |

## Edge Cases

| Scenario | Expected Behavior |
| --- | --- |
| Hybrid RPC missing | Task fails closed and points to VDB-01 |
| No results | Return structured empty state with suggested next filters |
| Result missing image | Return placeholder-safe card data |
| User asks for unsupported city | Ask clarification or return Medellin-only boundary |
| Search includes private user data | Do not include PII in vector text or traces |

## Real-World Examples

**Scenario 1 - rental:** "2 bedroom in Laureles under $1,500 with coworking nearby" returns apartment cards and map pins.

**Scenario 2 - restaurant:** "Where should I eat before an event in Provenza?" returns restaurants near the event location.

## Outcomes

| Before | After |
| --- | --- |
| AI may answer from prose only | AI returns real cards from Supabase |
| Search behavior differs by vertical | One typed tool contract covers core domains |
| Vector work is isolated | Mastra consumes VDB search safely |

## Verification

Run:

```bash
npm run test -- --run
npm run build
rg -n "search_entities|search_by_map_area|rank_results_for_context" my-mastra-app src supabase
```
