---
id: C14
title: pgvector RAG — Semantic Search for Listings, Events, Restaurants
status: Not Started
priority: P0
effort: 2 days
revenue_impact: High — "quiet place for remote work" and vibe-based queries unlock 40%+ of searches that currently return nothing
depends_on: 25L embedding_cache table, apartments table, events table, restaurants table
skill:
  - mde-supabase
  - gemini
  - ai-building-chatbots
---

<!-- task-summary -->
> **What:** pgvector RAG — Semantic Search for Listings, Events, Restaurants
> **Why:** `ai-search` does keyword + filter matching only. Queries like "quiet place for remote work", "something like Casa Bella but cheaper", or "romantic dinner, not too loud" return zero results because no column matches…
> **Tools/Skills:** `mde-supabase` · `gemini` · `ai-building-chatbots`
> **P0 · Not Started · Effort: 2 days**
> **Depends on:** 25L embedding_cache table, apartments table, events table, restaurants table

# C14 — pgvector RAG: Semantic Search

## Problem

`ai-search` does keyword + filter matching only. Queries like "quiet place for remote work", "something like Casa Bella but cheaper", or "romantic dinner, not too loud" return zero results because no column matches those words exactly. 40%+ of natural-language queries fall into this category.

Supabase already has the `vector` extension available. The `embedding_cache` table is planned in 25L. The only missing piece is: embedding the listings and running hybrid SQL queries.

## What to Build

### 1. Embedding tables + HNSW indexes (migration)

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE listing_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES apartments(id) ON DELETE CASCADE,
  embedding vector(1536) NOT NULL,
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX ON listing_embeddings USING hnsw (embedding vector_cosine_ops);

CREATE TABLE event_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  embedding vector(1536) NOT NULL,
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX ON event_embeddings USING hnsw (embedding vector_cosine_ops);

CREATE TABLE restaurant_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  embedding vector(1536) NOT NULL,
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX ON restaurant_embeddings USING hnsw (embedding vector_cosine_ops);
```

### 2. `ai-embed` edge function (new)

Triggered via pg_net HTTP call on INSERT/UPDATE to source tables.

Document format per vertical:
- Apartment: `"{title} · {bedrooms}BR/{bathrooms}BA · {neighborhood} · ${price_monthly}/mo · {amenities joined} · {description}"`
- Event: `"{title} · {date} · {venue} · {neighborhood} · {description} · {category}"`
- Restaurant: `"{name} · {cuisine} · {neighborhood} · {price_range} · {description} · {vibe}"`

Embed using Gemini `embedding-004` (free, 768 dims) or OpenAI `text-embedding-3-small` (1536 dims).
Store in the relevant embedding table.

### 3. Hybrid search in `ai-search`

```typescript
// Embed the user query
const queryEmbedding = await embedText(userQuery);

// Hybrid SQL: semantic threshold + hard filters
const { data } = await supabase.rpc('semantic_search_listings', {
  query_embedding: queryEmbedding,
  max_price: filters.price ?? 9999,
  neighborhood: filters.neighborhood ?? null,
  limit: 5
});
```

```sql
CREATE OR REPLACE FUNCTION semantic_search_listings(
  query_embedding vector(1536),
  max_price numeric DEFAULT 9999,
  neighborhood text DEFAULT NULL,
  result_limit int DEFAULT 5
) RETURNS TABLE (listing_id uuid, title text, score float) AS $$
  SELECT a.id, a.title,
         1 - (e.embedding <=> query_embedding) AS score
  FROM listing_embeddings e
  JOIN apartments a ON e.listing_id = a.id
  WHERE (max_price = 9999 OR a.price_monthly <= max_price)
    AND (neighborhood IS NULL OR a.neighborhood ILIKE '%' || neighborhood || '%')
    AND (e.embedding <=> query_embedding) < 0.35
  ORDER BY e.embedding <=> query_embedding
  LIMIT result_limit;
$$ LANGUAGE sql;
```

### 4. RAG context injection in `ai-chat`

When semantic results are retrieved, inject as Gemini system prompt prefix:

```
SYSTEM (appended): "Relevant listings for this query: 
[{"id":"abc","title":"Casa Verde","neighborhood":"Laureles","price_monthly":900,...}]
Use these specific listings in your response."
```

This grounds Gemini's response in real data → no hallucination of listing details.

## Acceptance Criteria

- [ ] Migration creates 3 embedding tables with HNSW indexes
- [ ] `ai-embed` edge fn generates and stores embeddings for apartments, events, restaurants
- [ ] `ai-search` runs hybrid query (pgvector similarity + SQL filters) when query contains vibe/lifestyle terms
- [ ] `ai-chat` injects top semantic results as RAG context into Gemini system prompt
- [ ] "quiet place for remote work" → returns relevant apartments
- [ ] "something like Casa Bella but cheaper" → returns similar apartments by embedding distance
- [ ] "romantic dinner, not too loud" → returns matching restaurants
- [ ] `npm run build` passes; no TypeScript errors
- [ ] Embedding cost stays under $0.05/day at 10K queries

## Files

| Layer | File | Action |
|---|---|---|
| Migration | `supabase/migrations/YYYYMMDD_listing_embeddings.sql` | Create |
| Edge fn | `supabase/functions/ai-embed/index.ts` | Create |
| Edge fn | `supabase/functions/ai-search/index.ts` | Modify — add hybrid search path |
| Edge fn | `supabase/functions/ai-chat/index.ts` | Modify — inject RAG context |
| DB fn | `supabase/migrations/YYYYMMDD_semantic_search_fn.sql` | Create — RPC function |

## References

- Supabase vector module: https://supabase.com/modules/vector
- Chatbase pgvector at scale: https://supabase.com/customers/chatbase
- HNSW index guide: pgvector docs, `vector_cosine_ops`
- Chunk sizing: 500–1000 tokens with 10–20% overlap (not applicable here — listings are short documents)

---

## Definition of Done (continuous testing — mandatory)

A task is **not** done until every applicable row is checked. "Code merged" is not the finish line — **tested + verified live** is. See [.claude/rules/task-writing.md §9](../../../.claude/rules/task-writing.md) and [CLAUDE.md → Definition of Done](../../../CLAUDE.md).

- [ ] `npm run lint` clean
- [ ] `npm run build` clean
- [ ] `npm run test` clean and **count did not regress** (new logic = new tests; bugs = regression test that fails without the fix)
- [ ] `npm run verify:edge` clean *(only if `supabase/` was touched — else "N/A — no edge-fn change")*
- [ ] E2E covered *(Playwright spec OR documented manual run with screenshot — only if user-facing flow touched; else "N/A")*
- [ ] Live verification on https://www.mdeai.co after Vercel deploy *(only if UI shipped to prod; HTTP 200 + visual check)*
- [ ] PR body lists what was tested + result for each layer

If a layer is N/A, **say so explicitly** in the PR. Silence ≠ exemption.
