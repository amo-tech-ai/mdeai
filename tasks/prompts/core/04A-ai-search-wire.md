---
id: 04A
diagram_id: MERM-08
prd_section: "4. Feature inventory — Explore, search"
title: Wire Explore AI search to ai-search edge function
description: "Ships «Wire Explore AI search to ai-search edge function» for this epic—full scope in § Prompt below."
skills:
  - mdeai-tasks
  - supabase/supabase-edge-functions
  - frontend-design
epic: E4
phase: CORE
priority: P0
status: Open
owner: Frontend
dependencies:
  - E3-001
estimated_effort: M
percent_complete: 0
outcome: O10
---


### Real world — purpose & outcomes

**In one sentence:** When someone types “quiet 2BR near Laureles,” search uses the real `ai-search` edge and embeddings—not a pretend chat mode—so results match what’s in the database.

- **Who it’s for:** Travelers discovering apartments; product folks who care about relevance and cost.
- **Purpose:** Wire the frontend to semantic search the way the architecture intended.
- **Goals:** One network path to `ai-search`; loading/error/empty states; no double billing for duplicate AI calls.
- **Features / deliverables:** `useAISearch` → edge URL with auth; consistent UX; verification steps (network tab / tests).

| Aspect | Details |
|--------|---------|
| **Problem** | `useAISearch` currently invokes **`ai-chat`** with `searchMode` context — the dedicated **`ai-search`** edge function (semantic + DB recall) is deployed but unused from the client. |
| **Edge contract** | `supabase/functions/ai-search/index.ts` — body: `query`, optional `domain`, `filters`, `limit`; success returns structured results with `relevanceScore`. |
| **Files** | `src/hooks/useAISearch.ts`, `src/components/explore/AISearchInput.tsx`, `src/pages/Explore.tsx` |
| **Current bug (verified 2026-04-05)** | `useAISearch.ts` line ~45 calls `supabase.functions.invoke("ai-chat", ...)` with `{ messages, tab: "explore", context: { searchMode: true, filters } }`. This is the **wrong endpoint and wrong request shape**. Must change to `supabase.functions.invoke("ai-search", { body: { query, domain, filters, limit } })`. Response parsing also wrong: currently expects `data?.toolResults` (ai-chat format) but ai-search returns `{ success: true, data: { results: SearchResult[] } }`. |

## Success criteria (tests · verify · production-ready)

| Track | Definition |
|-------|------------|
| **Tests** | Relevant automated checks pass: `npm run lint`, `npm run build`, `npm run test` (and `npm run verify:edge` when Supabase edge functions change). Add or update tests when behavior changes. |
| **Verify** | Manual smoke: confirm the user-visible or API outcome in dev/staging; for auth, CORS, payments, or idempotency, exercise the real path once. |
| **Production-ready** | No open security gaps for this change scope; deploy path documented or executed; rollback/monitoring understood if the change touches production data or money. Mark complete only when the rows above are satisfied. |

## Feature success (goals → shippable features)

Aligned with [`PROMPT-VERIFICATION.md`](../PROMPT-VERIFICATION.md) §6 (Goal · Workflow · Proof · Gates · Rollout), [`.claude/skills/mde-writing-plans/SKILL.md`](../../../.claude/skills/mde-writing-plans/SKILL.md) (user stories + observable proof), and optionally [`.agents/skills/tasks-generator/SKILL.md`](../../../.agents/skills/tasks-generator/SKILL.md) (PRD → tasks).

| Layer | Intent |
|-------|--------|
| **Goal** | Semantic search uses `ai-search` edge — not a fake chat mode — so results match embeddings. |
| **Workflow** | Wire `useAISearch` → edge URL with session; handle loading/error/empty per CLAUDE.md. |
| **Proof** | Network tab shows `ai-search` call; results render; failure shows ErrorState. |
| **Gates** | 03E already on `ai-search`; Gemini key in Supabase secrets only. |
| **Rollout** | Ship when search returns non-empty with seed data (01E). |

---

## User story

*As a traveler using Explore, I want semantic search to hit the **search** pipeline (embeddings + listings DB) so that results match my query and show up consistently — not only whatever the chat tool path returns.*

## Description

**The situation:** Duplicate paths: `ai-chat` explore tab vs `ai-search` edge.

**The build:**

1. **`useAISearch.search()`** — Invoke `supabase.functions.invoke("ai-search", { body: { query, domain, filters, limit } })` with the session JWT (default anon + user session when signed in). Map the edge **success** payload into existing `AISearchResult[]` (align types with `SearchResult` from the function).
2. **Error handling** — Parse `{ success, error }` / structured errors like `p1-crm` patterns; toast user-friendly message; **four states**: loading, error (retry), empty, success.
3. **Explore integration** — `Explore.tsx` toggle `useAISearch` should reflect **ai-search** results; remove dependency on `ai-chat` `toolResults` parsing for the default path.
4. **Optional:** Feature flag `VITE_USE_AI_CHAT_FOR_SEARCH=false` (or env) to keep **ai-chat** fallback for debugging — document in `.env.example`.

## Acceptance criteria

- [ ] `useAISearch` calls **`ai-search`**, not `ai-chat`, for the primary search path (or documented flag for fallback).
- [ ] Request body matches **`searchBodySchema`** in `ai-search/index.ts` (Zod on server).
- [ ] Results render in Explore / `AISearchInput` with same or better UX than before.
- [ ] Loading / error / empty / success states handled.
- [ ] `npm run build` passes; manual smoke: query returns listing cards from DB-backed search.

## Verification

```bash
npm run build
npm run verify:edge   # ai-search included
```

Manual: signed-in and anonymous search from `/explore` — network tab shows `ai-search` invocation.
