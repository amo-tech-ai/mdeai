---
id: C06
title: Chat Memory + Personalization — Persistent User Context
status: Not Started
priority: P1
effort: 3 days
revenue_impact: High — returning users convert 3x better; personalized results close faster
depends_on: user_preferences table, Hermes ranking (hermes-ranking edge fn exists)
skill:
  - hermes
  - mde-supabase
  - ai-building-chatbots
---

<!-- task-summary -->
> **What:** Chat Memory + Personalization — Persistent User Context
> **Why:** Every chat session starts cold. A returning user who already told the AI "I want a 2BR in Laureles for $900, moving in June" must repeat this information every session. There is no: - User preference storage -…
> **Tools/Skills:** `hermes` · `mde-supabase` · `ai-building-chatbots`
> **P1 · Not Started · Effort: 3 days**
> **Depends on:** user_preferences table, Hermes ranking (hermes-ranking edge fn exists)

# C06 — Chat Memory + Personalization

## Problem

Every chat session starts cold. A returning user who already told the AI "I want a 2BR in Laureles for $900, moving in June" must repeat this information every session. There is no:
- User preference storage
- Cross-session context injection
- Personalized result ranking
- "Welcome back, Sofia — still looking in Laureles?" greeting

This is the single biggest retention lever. Hermes ranking exists but isn't wired into chat.

## What to Build

### 1. user_preferences table

```sql
CREATE TABLE user_preferences (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, key)
);
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_prefs" ON user_preferences
  FOR ALL USING (user_id = (SELECT auth.uid()));
```

Standard keys:
```
neighborhood_preference  → { primary: "Laureles", secondary: ["Envigado"] }
budget_preference        → { min: 700, max: 1000, currency: "USD" }
stay_preference          → { min_months: 1, max_months: 3, furnished: true }
bedrooms_preference      → { min: 1, max: 2 }
move_in_preference       → { target_date: "2026-06-01" }
persona                  → { type: "renter" | "host" | "buyer" | "organizer" | "tourist" }
language_preference      → { lang: "en" | "es" }
last_search              → { query, filters, results_count, timestamp }
saved_neighborhoods      → ["Laureles", "El Poblado"]
```

### 2. `chat-user-context` edge function

File: `supabase/functions/chat-user-context/index.ts`

Called by `ai-chat` at the start of every request for authenticated users:
```typescript
// Input
{ user_id: string, conversation_id: string }

// Output
{
  greeting: string | null,        // "Welcome back, Sofia!"
  preferences: Record<string, unknown>,
  saved_searches: SavedSearch[],
  recent_conversations: { id: string, title: string, last_at: string }[],
  persona: string,               // 'renter', 'host', 'buyer', etc.
  context_summary: string,       // injected into system prompt
}
```

The `context_summary` is a compact paragraph injected into the Gemini system prompt:
```
User profile: Sofia is a renter looking for a furnished 1-2BR in Laureles or Envigado, budget $700-$1,000/month, moving June 2026. She has saved 3 listings and viewed 12. Her last search was "2BR Laureles pets allowed" (May 7). Prioritize: Laureles and Envigado results, furnished, pet-friendly, in budget.
```

### 3. `save_preference` tool in ai-chat

```typescript
{
  name: "save_preference",
  description: "Save a user preference that will be used to personalize future searches. Call this when the user states a clear preference about neighborhood, budget, stay length, or lifestyle requirements.",
  parameters: {
    key: { type: "string", enum: ["neighborhood", "budget", "stay_length", "bedrooms", "pets", "furnished"] },
    value: { type: "string", description: "The preference value" }
  }
}
```

System prompt instruction:
```
When a user clearly states a preference ("I need furnished", "budget is $900", "I want Laureles"), call save_preference to record it. This will be used in all future sessions.
```

### 4. Hermes ranking integration

`hermes-ranking` edge function exists but isn't wired into chat. Wire it:

In `rentals_search` execution, after getting results from the `rentals` edge fn:
```typescript
// Rerank results based on user preferences + Hermes signals
const reranked = await fetch(`${supabaseUrl}/functions/v1/hermes-ranking`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${serviceKey}` },
  body: JSON.stringify({
    user_id: userId,
    listings: results.listings,
    user_preferences: userContext.preferences,
  })
});
const { ranked_listings } = await reranked.json();
results.listings = ranked_listings;
```

This makes the first result for each user the most relevant to them specifically — not just the newest listing.

### 5. Returning user greeting

In `ai-chat` system prompt, when `context_summary` is present:

If user has prior conversations and preferences → greeting mode:
```
You are mdeai's AI Concierge. The user has been here before.
Start your first response with: "Welcome back, [name]! Still looking for a 2BR in Laureles?"
Then proceed with their query.
```

### 6. Context persistence in ChatContextChips

Currently chatContext (neighborhood/dates/budget/travelers) is lost on page refresh.

Fix: 
- `useChat.ts` — on init, load `conversations.session_data.context` into chatContext state
- `updateChatContext` — write to DB on every change:
  ```typescript
  await supabase.from('conversations').update({
    session_data: { ...currentSessionData, context: newContext }
  }).eq('id', currentConversation.id);
  ```

Also save to `user_preferences` for cross-session persistence.

### 7. saved_searches table

```sql
CREATE TABLE saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT,         -- user-visible name
  query TEXT,         -- original user query
  filters JSONB,      -- search parameters
  result_count INTEGER,
  last_run_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Add tool: `save_search` — called when user says "save this search" or after 3+ turns with consistent filters.

Show saved searches in ChatLeftNav under "Saved Searches (N)" section — click re-runs the search instantly.

## Acceptance Criteria

- [ ] Authenticated returning user greeted with "Welcome back" + their prior preferences mentioned
- [ ] After stating "I want Laureles" → preference saved → next search auto-filters to Laureles without asking
- [ ] ChatContextChips survive page refresh for authenticated users
- [ ] Rental results ranked by Hermes (if hermes-ranking fn is wired)
- [ ] "Save this search" prompt appears after 3 turns → saved search appears in left nav
- [ ] Spanish-speaking user's language preference saved → subsequent sessions respond in ES
- [ ] user_preferences table has RLS — users only see their own prefs

## Files to Touch

- `supabase/functions/chat-user-context/index.ts` — create
- `supabase/functions/ai-chat/index.ts` — call chat-user-context at start, add save_preference tool
- `supabase/migrations/YYYYMMDD_user_preferences.sql` — create
- `supabase/migrations/YYYYMMDD_saved_searches.sql` — create
- `src/hooks/useChat.ts` — persist chatContext to DB in updateChatContext
- `src/components/chat/ChatLeftNav.tsx` — add Saved Searches section

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
