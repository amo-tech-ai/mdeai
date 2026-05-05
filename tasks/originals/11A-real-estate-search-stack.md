---
id: 11A
diagram_id: MERM-08
prd_section: "4–6. Search, Hermes, agents"
title: Real-estate search — stack, data flow & best practices
skills:
  - supabase/supabase-edge-functions
  - mdeai-tasks
epic: cross-cutting
phase: Reference
priority: P2
status: Reference
owner: Full-stack
dependencies: []
estimated_effort: S
percent_complete: 100
outcome: O10
---

# Real-estate search — architecture & best practices (Hermes · OpenClaw · Paperclip · data)

> **Purpose:** Single reference for **how to search, populate, and present** Medellín / furnished rental inventory without mixing responsibilities. Use when designing **`ai-search`**, **`hermes-ranking`**, **`rentals`**, OpenClaw skills, or Paperclip gates.  
> **Related:** [`tasks/notes/03-realestate-search.md`](../notes/03-realestate-search.md) (portals & APIs), [`04A-ai-search-wire.md`](04A-ai-search-wire.md), [`06E-hermes-intelligence.md`](06E-hermes-intelligence.md), [`06A-hermes-ranking-edge.md`](06A-hermes-ranking-edge.md), [`05E-agent-infrastructure.md`](05E-agent-infrastructure.md), [`08E-multi-channel.md`](08E-multi-channel.md).  
> **LLM copy-paste prompts:** [`11B-real-estate-search-llm-prompts.md`](11B-real-estate-search-llm-prompts.md).

---

## 1. Role of each system (do not blur)

| System | Owns | Does **not** own |
|--------|------|-------------------|
| **Supabase + `apartments` / rentals** | Source of truth for **mdeai** listings, embeddings target for `ai-search`, RLS | External portal HTML, competitor inventory as SoT |
| **`ai-search` edge** | **Recall**: semantic + keyword + filters over **your** DB (`pgvector` + structured query) | Final ordering for “best apartment for you” (pass to Hermes) |
| **`hermes-ranking` edge** | **Precision**: 7-factor composite score + ordering on **`apartment_ids`** you pass in | Ingesting web pages; scoring FincaRaíz IDs |
| **Hermes Intelligence (06*)** | Deterministic scoring, taste profile, market snapshots **from your aggregates** | Scraping third-party sites |
| **OpenClaw** | **Channels** (WhatsApp, etc.) + **tool invocation** (skills, MCP, HTTP to **your** edges) | Long-term storage of listing truth |
| **Paperclip** | **Tasks**, delegation, **05G approval gates**, heartbeats, audit trail | Real-time search index |

**Rule:** User-visible “search results” for **your product** always come from **DB → ai-search (recall) → hermes-ranking (precision)** when Hermes is enabled. OpenClaw may **call** those edges; it does not replace them.

---

## 2. Data flow — best results

### Populate (write path)

1. **Authoritative inventory:** Admin / integrations / `rentals` intake → Supabase. Keep **one row per listing** with stable `id`, **fresh** `updated_at`, and **complete** fields Hermes factors need (price, barrio, amenities, photos count, etc.).
2. **Embeddings:** Regenerate embeddings when title/description/location fields change (`01E` / embedding job). Stale embeddings = bad recall.
3. **External comps (optional):** STR benchmarks (e.g. AirROI) or Gap 1 extracts → **analytics / `market_snapshots`** tables — **not** merged into `apartments` as fake listings without explicit product decision.

### Search (read path)

1. **Parse user intent** (budget, stay length, barrios, must-haves). Prefer **structured filters** + short free text; avoid sending raw chat as the only filter.
2. **`ai-search`:** Return a **bounded** set (e.g. top N by similarity + filters). Log to `ai_runs` per edge patterns.
3. **`hermes-ranking`:** Pass **only** returned IDs + **user_preferences** object. Paginate DB reads inside the function if needed (**06A**).
4. **Explainability:** Surface **score breakdown** in UI (**06B**) so users trust ordering.

### Present

1. **Four states:** loading, error (retry), empty, success — mandatory for any search UI (**04A**, **04E**).
2. **Propose-only AI:** Never auto-book; comps labeled **“benchmark / external”** if shown.
3. **WhatsApp:** Same ranking pipeline via OpenClaw → invoke **`ai-search` + `hermes-ranking`**; do not maintain a parallel ranking in the gateway.

---

## 3. OpenClaw — best practices

- **Expose tools** that map 1:1 to **your** edges (`invoke_ai_search`, `invoke_hermes_rank`, `get_listing_detail`) with **Zod-validated** payloads.
- **Skills** (e.g. Airbnb CLI, travel-concierge): use for **ops / research / concierge**, not as the **primary** web app search backend.
- Respect **robots.txt** and rate limits for any browser automation (**05H** adapter + Fast.io research stack in `03` note).
- **05G:** Require approval before bulk automated messages that include **unverified** comp data.

---

## 4. Paperclip — best practices

- **Delegate** search implementation to edges + frontend; Paperclip tracks **tasks** (“wire 04A”, “ship 06A”).
- **Approval gates** for: new external data sources in prod, scraping jobs, or customer-facing use of third-party STR data.
- **Heartbeat / audit:** Agent actions that touch search config link to **`ai_runs` / `agent_audit_log`** (G5 in **06E**).

---

## 5. Anti-patterns

| Anti-pattern | Why it fails |
|--------------|----------------|
| Hermes scores **competitor** listing URLs | Hermes inputs are **your** `apartment_ids` only |
| OpenClaw scrapes FincaRaíz into Supabase on every user message | ToS, fragility, no single SoT |
| `ai-chat` tool results as **only** search path | Bypasses `ai-search` recall + eval (**04A**) |
| Showing external comps **without** source & date | Trust and legal risk |
| Skipping **empty state** when filters are too tight | Bad UX; suggest relaxing one constraint |

---

## 6. Verification checklist (when shipping search changes)

- [ ] `npm run build`; [`VERIFY-supabase-postgres-edge.md`](VERIFY-supabase-postgres-edge.md) for touched functions.
- [ ] Manual: query with filters → network shows **`ai-search`** then **`hermes-ranking`** (when wired).
- [ ] Anonymous + authenticated paths behave per RLS.
- [ ] CRM / lead hooks unchanged unless explicitly in scope (**10E**).

---

## 7. References

- [`tasks/notes/03-realestate-search.md`](../notes/03-realestate-search.md)
- `tasks/real-estate/docs/1-trio-real-estate-plan.md` — Gap 1 multi-site scraping
- `tasks/mermaid/09-edge-function-map.mmd` — edge I/O
- [`11B-real-estate-search-llm-prompts.md`](11B-real-estate-search-llm-prompts.md)
