---
task_id: MASTRA-021
title: Mastra VDB Local Remote Reconciliation
phase: CORE
priority: P0
status: Not Started
estimated_effort: 2 days
area: mastra-search
skill: [mastra, pgvector, supabase]
subagents: [backend, supabase-auditor]
edge_function: null
schema_tables: [listing_embeddings, event_embeddings, restaurant_embeddings]
depends_on: [MASTRA-001, MASTRA-022]
blocks: [MASTRA-004, MASTRA-005, MASTRA-006, MASTRA-007, MASTRA-008]
---

<!-- task-summary -->
> **What:** Reconcile local and remote Supabase search RPCs (`semantic_search_*` vs `hybrid_search_*`) so Mastra search tools can rely on a single contract.
> **Why:** Local migrations create `semantic_search_*` while plan docs reference `hybrid_search_*`. MASTRA-004 cannot ship safely until the drift is resolved or fallbacks are documented.
> **Delivers:** Verified RPC inventory (local + remote), missing migration or documented fallback, fixture queries for rentals/events/restaurants, and an explicit blocker on MASTRA-004 until proven.
> **Tools/Skills:** `mastra` · `pgvector` · `mde-supabase`
> **CORE · P0 · Not Started · Effort: 2 days**
> **Depends on:** MASTRA-001, MASTRA-022

# Mastra VDB Local Remote Reconciliation

## Easy Summary

**Purpose:** make local and remote vector/search behavior match before Mastra search tools depend on it.

**Goals:** reconcile `hybrid_search_*` RPCs, FTS columns/indexes, and semantic fallback behavior across environments.

**Success criteria:** the same smoke queries work locally and remotely, or the task documents an explicit fallback path.

**Production-ready checklist:**

- Local migrations include every remote search RPC needed by Mastra.
- Search tools can fall back to `semantic_search_*` when hybrid RPCs are absent.
- Tests cover rentals, events, and restaurants.
- No unrestricted SQL is exposed to agents.

## Acceptance Criteria

- [ ] Verify local RPCs: `semantic_search_*`, `hybrid_search_*`.
- [ ] Verify remote RPCs without printing secrets.
- [ ] Add missing local migration or documented fallback.
- [ ] Add query fixtures for rentals, events, restaurants.
- [ ] Block `MASTRA-004` until proof exists.

## Verification

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "\\df public.*search*"
cd /home/sk/mde/my-mastra-app
npm run smoke:runtime
```

