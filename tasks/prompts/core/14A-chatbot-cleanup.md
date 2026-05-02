---
id: E14-001
title: Chatbot cleanup — remove waste, fix security, wire intent routing
description: "Ships «Chatbot cleanup — remove waste, fix security, wire intent routing» for this epic—full scope in § Prompt below."
epic: E14
phase: CORE
priority: P0
effort: M
status: Open
percent_complete: 0
dependencies: []
outcomes: [O1, O10]
---

# E14-001 — Chatbot Cleanup

### Real world — purpose & outcomes

**In one sentence:** The concierge chat feels fast and cheap—one AI call per message when possible—and no API keys or dead code ship in the browser bundle.

- **Who it’s for:** Travelers using chat; you, paying Gemini bills.
- **Purpose:** Remove wasted `ai-router` round-trip when unused; delete dead files; fix URLs/tokens.
- **Goals:** Lower cost per message; smaller bundle; no secrets in client.
- **Features / deliverables:** Code removal, routing fix, verification steps (chat still works).

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
| **Goal** | Chat stops wasting router calls; dead code and hardcoded secrets removed. |
| **Workflow** | Remove orphan imports → fix URLs → verify chat flows. |
| **Proof** | Lighthouse/network: no duplicate ai-router; no secrets in bundle. |
| **Gates** | Chat still works on key flows manual or E2E. |
| **Rollout** | Low risk; ship after smoke. |

---

## Context

The chatbot is the most complete feature in mdeai (streaming works, tools work, persistence works). But it has 3 problems that waste money, expose secrets, and leave dead code in the bundle.

This task fixes all 3. No new features — just cleanup.

## Problem 1: Wasted ai-router call

**Current behavior:** Every chat message makes 2 API calls:
1. `POST /functions/v1/ai-router` — classifies intent (concierge, housing, trips, etc.)
2. `POST /functions/v1/ai-chat` — generates response

The ai-router result is stored in `lastIntent` state but **nothing reads it**. The chat always goes to ai-chat regardless of classification.

**Cost:** Every message costs 2x Gemini calls. At scale this doubles AI spend.

**File:** `src/hooks/useChat.ts` — `routeMessage()` around line 143-169

**Fix:** Remove the wasted routing call. The ai-chat function already has tab-specific system prompts that effectively "route" by context. The separate ai-router call is redundant.

### Acceptance Criteria

- [ ] Remove `routeMessage()` call from `sendMessage()` in `useChat.ts`
- [ ] Remove `lastIntent` state variable
- [ ] Remove the `import` and usage of `useIntentRouter` if present
- [ ] Verify chat still works: send message → get streamed response → correct tab context
- [ ] Verify ai-router edge function is NOT called during normal chat (check Network tab)
- [ ] Do NOT delete the `ai-router` edge function itself (it may be used by WhatsApp routing in 08L later)

## Problem 2: Dead code — orphaned hooks and components

**Verified import status (2026-04-05):**

| File | Status | Imported By | Action |
|------|--------|------------|--------|
| `src/hooks/useIntentRouter.ts` | ORPHANED | Nothing | **Delete** |
| `src/hooks/useAISearch.ts` | ACTIVE IMPORT | `src/components/explore/AISearchInput.tsx` (hook + type), `src/pages/Explore.tsx` (type only) | **Do NOT delete** — fix response format instead |
| `src/components/chat/ConversationList.tsx` | ACTIVE IMPORT | `src/pages/Concierge.tsx` (line 19) | **Do NOT delete** — it's used in the Concierge page |
| `src/components/chat/ChatRightPanel.tsx` | ORPHANED | Nothing | **Delete** |

**Fix:**
- Delete only the 2 truly orphaned files (useIntentRouter, ChatRightPanel)
- For useAISearch: fix the response format mismatch so it actually works with ai-search edge function (this ties into task 04A)
- For ConversationList: keep it — it renders in `/concierge` page

### Acceptance Criteria

- [ ] Delete `src/hooks/useIntentRouter.ts` (verified: no imports anywhere)
- [ ] Delete `src/components/chat/ChatRightPanel.tsx` (verified: no imports anywhere)
- [ ] Do NOT delete `src/hooks/useAISearch.ts` — it's imported by `AISearchInput.tsx` and `Explore.tsx`
- [ ] Do NOT delete `src/components/chat/ConversationList.tsx` — it's imported by `Concierge.tsx`
- [ ] Grep for remaining imports of deleted files — should find zero
- [ ] `npm run build` passes with zero errors
- [ ] `npm run lint` passes

## Problem 3: Hardcoded URLs and tokens

**Verified: 7 files contain hardcoded Supabase URLs or JWT tokens (2026-04-05):**

| File | Issue | Fix |
|------|-------|-----|
| `src/hooks/useChat.ts` | Hardcoded `SUPABASE_URL` string | Replace with `import.meta.env.VITE_SUPABASE_URL` |
| `src/hooks/useGoogleDirections.ts` | Hardcoded URL + JWT token fallback | Replace URL with env var, remove token |
| `src/hooks/useCollectionSuggestions.ts` | Hardcoded URL + JWT token fallback | Replace URL with env var, remove token |
| `src/integrations/supabase/client.ts` | Hardcoded URL + publishable key | Replace both with `import.meta.env.*` |
| `src/components/rentals/RentalsListingDetail.tsx` | Hardcoded Supabase URL | Replace with `import.meta.env.VITE_SUPABASE_URL` |
| `src/components/rentals/RentalsSearchResults.tsx` | Hardcoded Supabase URL | Replace with `import.meta.env.VITE_SUPABASE_URL` |
| `src/components/rentals/RentalsIntakeWizard.tsx` | Hardcoded Supabase URL | Replace with `import.meta.env.VITE_SUPABASE_URL` |

### Acceptance Criteria

- [ ] All 7 files above: replace hardcoded `zkwcbyxiwklihegjhuql` URLs with `import.meta.env.VITE_SUPABASE_URL`
- [ ] `useGoogleDirections.ts` + `useCollectionSuggestions.ts`: remove hardcoded JWT token (`eyJhbGciOi...`) — use `import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY` as fallback
- [ ] `src/integrations/supabase/client.ts`: use env vars for both URL and key (this is the Supabase client — critical)
- [ ] `grep -r "zkwcbyxiwklihegjhuql" src/` returns ZERO results
- [ ] `grep -r "eyJhbGciOi" src/` returns ZERO results
- [ ] `npm run build` passes
- [ ] Chat, directions, rentals, and collection suggestions still work in browser

## Verification

After all 3 fixes:

1. Open mdeai.co locally (`npm run dev`)
2. Open browser DevTools → Network tab
3. Send a chat message
4. Verify: only ONE request to `/functions/v1/ai-chat` (no ai-router call)
5. Verify: response streams correctly
6. Verify: no hardcoded URLs in Network request origins
7. `npm run build` — zero errors
8. Bundle size should decrease (2 deleted files)
9. `/concierge` page still renders ConversationList correctly
10. `/explore` page still renders AISearchInput (even if results empty — 04A will fix)

## What This Is NOT

- NOT a chatbot feature change — user experience is identical
- NOT a redesign — component structure stays the same
- NOT touching ai-chat or ai-router edge functions — only frontend cleanup
- NOT adding new features — pure subtraction
