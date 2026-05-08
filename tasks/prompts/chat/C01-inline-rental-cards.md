---
id: C01
title: Inline Rental Cards in Chat Message Stream
status: Done
priority: P0
effort: 2 days
revenue_impact: High — keeps users in chat funnel, enables saves/trips from results
depends_on: rentals edge function returning listings array
skill:
  - frontend-design
  - mde-real-estate
---

<!-- task-summary -->
> **What:** Inline Rental Cards in Chat Message Stream
> **Why:** The `ai-chat` edge function calls `rentals_search` and emits an `OPEN_RENTALS_RESULTS` action that sets map pins. But the conversation itself shows only AI-generated text ("Found 5 apartments in Laureles..."). Per…
> **Tools/Skills:** `frontend-design` · `mde-real-estate`
> **P0 · Done · Effort: 2 days**
> **Depends on:** rentals edge function returning listings array

# C01 — Inline Rental Cards in Chat Message Stream

## Problem

The `ai-chat` edge function calls `rentals_search` and emits an `OPEN_RENTALS_RESULTS` action that sets map pins. But the conversation itself shows only AI-generated text ("Found 5 apartments in Laureles..."). Per `CHAT-CENTRAL-PLAN.md §5 Tue deliverable`, results should render as **inline cards inside the message** — not as markdown prose.

Current state: user sees text → must mentally translate → low engagement
Target state: user sees cards inline → can heart/save/add-to-trip → high engagement

## What to Build

### 1. EmbeddedListings component
File: `src/components/chat/embedded/EmbeddedListings.tsx`

Already created per CHAT-CENTRAL-PLAN file list — verify it exists and wires correctly.
It should:
- Accept `actions: ChatAction[]` prop
- Find `OPEN_RENTALS_RESULTS` actions
- Extract `payload.listings[]`
- Render `<RentalCardInline>` for each (max 5)
- Show "See all 12 results →" link to `/apartments?q=...` if total_count > 5

### 2. RentalCardInline component
File: `src/components/chat/embedded/RentalCardInline.tsx`

Chat-optimized rental card:
```tsx
interface RentalInlineListing {
  id: string;
  title: string;
  price_monthly: number | null;
  neighborhood: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  images: string[];
  rating: number | null;
  source_url: string;
  latitude: number | null;
  longitude: number | null;
}
```

Card layout (compact, ~120px tall):
- Left: thumbnail image (64x64, rounded)
- Center: title (truncated), neighborhood · BR · BA, price/mo
- Right: ♥ save button, → outbound link button
- On card click: navigate to `/apartments/:id`
- On ♥ click: upsert to `saved_places` table

### 3. Wire EmbeddedListings into ChatMessageList

After the last assistant message, if that message's turn has `pendingActions` with `OPEN_RENTALS_RESULTS`, render `<EmbeddedListings actions={pendingActions} />`.

The tricky part: `pendingActions` lives in `useChat` but `ChatMessageList` is the render target. Two options:
- Option A: Pass `pendingActions` as prop to `ChatMessageList` (already passed from ChatCanvas, currently ignored)
- Option B: Render `<EmbeddedListings>` in ChatCanvas below the last assistant message

**Recommended: Option A** — update `ChatMessageList` to accept and render `pendingActions` below the last assistant message.

### 4. Update ChatMessageList signature

```tsx
interface ChatMessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  pendingActions?: ChatAction[];
  onActionDispatched?: () => void;
  reasoningPhases?: unknown[];
}
```

After the last assistant message, render:
```tsx
{pendingActions && pendingActions.length > 0 && !isStreaming && (
  <EmbeddedListings actions={pendingActions} />
)}
```

### 5. Verify payload shape from ai-chat

The `rentals_search` function in `ai-chat/index.ts` returns:
```typescript
{
  actions: [
    { type: "OPEN_RENTALS_RESULTS", payload: { listings: [...], map_pins: [...] } }
  ]
}
```

The `payload.listings` must include `latitude`, `longitude`, `images`, `price_monthly`, `neighborhood`, `bedrooms`, `bathrooms`, `rating` for the card to render usefully.

Verify the `rentals` edge function returns these fields. If not, update its SELECT query.

## Acceptance Criteria

- [ ] User types "rentals Laureles" → AI response includes 3-5 inline rental cards
- [ ] Each card shows image, title, neighborhood, price, BR count
- [ ] Clicking ♥ saves listing to `saved_places`
- [ ] Clicking → opens source_url with affiliate tag
- [ ] Map pins also appear (existing behavior preserved)
- [ ] Cards only appear after streaming completes (not during)
- [ ] "See all N results →" link appears if total_count > cards shown

## Files to Touch

- `src/components/chat/ChatMessageList.tsx` — update props, add EmbeddedListings render
- `src/components/chat/embedded/EmbeddedListings.tsx` — create/verify
- `src/components/chat/embedded/RentalCardInline.tsx` — create
- `supabase/functions/rentals/index.ts` — verify listing shape includes all card fields

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
