---
id: C16
title: Multi-Vertical Inline Cards — Restaurants, Events, Cars in Chat
status: Not Started
priority: P1
effort: 2 days
revenue_impact: High — every vertical gets inline cards + map pins; visual parity with rentals
depends_on: C01 (RentalCardInline pattern), EmbeddedListings routing, ai-chat tools
skill:
  - frontend-design
  - events
  - mde-real-estate
---

<!-- task-summary -->
> **What:** Multi-Vertical Inline Cards — Restaurants, Events, Cars in Chat
> **Why:** `ai-chat` has 8 tools. Only one (`rentals_search`) emits inline cards via `OPEN_RENTALS_RESULTS`. The other tools — `search_restaurants`, `search_events`, `search_cars`, `search_apartments` — return results as text…
> **Tools/Skills:** `frontend-design` · `events` · `mde-real-estate`
> **P1 · Not Started · Effort: 2 days**
> **Depends on:** C01 (RentalCardInline pattern), EmbeddedListings routing, ai-chat tools

# C16 — Multi-Vertical Inline Cards

## Problem

`ai-chat` has 8 tools. Only one (`rentals_search`) emits inline cards via `OPEN_RENTALS_RESULTS`. The other tools — `search_restaurants`, `search_events`, `search_cars`, `search_apartments` — return results as text only. Users see prose ("I found 3 restaurants in El Poblado") instead of visual cards. Map pins only appear for rentals.

This is a visual parity gap: every vertical that can return results should render inline cards + map pins.

## What to Build

### 1. New card components (following RentalCardInline pattern)

**`RestaurantCardInline.tsx`**
- Thumbnail (restaurant photo)
- Name + cuisine tags
- Neighborhood + price range ($ / $$ / $$$)
- Rating (if available)
- "Get Directions" → Google Maps link
- "Reserve" → links to restaurant booking URL

**`EventCardInline.tsx`**
- Event thumbnail / poster
- Event name + date + time
- Venue + neighborhood
- Ticket price range
- "Buy Ticket" → ticket-checkout flow (C05)
- Heart/save button → saved_places

**`CarCardInline.tsx`**
- Car photo
- Make/model/year
- Daily rate + pickup location
- "Book" → links to rental URL

### 2. Update `ai-chat` to emit per-vertical actions

```typescript
// After search_restaurants tool execution:
actions.push({
  type: 'OPEN_RESTAURANT_RESULTS',
  payload: { restaurants: results }
});

// After search_events:
actions.push({
  type: 'OPEN_EVENT_RESULTS',
  payload: { events: results }
});

// After search_cars:
actions.push({
  type: 'OPEN_CAR_RESULTS',
  payload: { cars: results }
});
```

### 3. Update `EmbeddedListings` to route by action type

```typescript
switch (action.type) {
  case 'OPEN_RENTALS_RESULTS':    return <RentalCardInline ... />;
  case 'OPEN_RESTAURANT_RESULTS': return <RestaurantCardInline ... />;
  case 'OPEN_EVENT_RESULTS':      return <EventCardInline ... />;
  case 'OPEN_CAR_RESULTS':        return <CarCardInline ... />;
  case 'SHOW_BOOKING_PREVIEW':    return <BookingPreviewCard ... />;  // C15
}
```

### 4. Multi-category map pins

Update `ChatMap` / `MapContext` to handle colored pins by vertical:
- Rentals → blue pin
- Restaurants → green pin
- Events → purple pin
- Cars → orange pin (pickup location)

```typescript
type MapPin = {
  id: string;
  lat: number;
  lng: number;
  category: 'rental' | 'restaurant' | 'event' | 'car';
  label: string;
};
```

### 5. Type definitions

```typescript
// src/types/chat.ts additions
export interface RestaurantInlineListing {
  id: string;
  name: string;
  cuisine: string[];
  neighborhood: string | null;
  price_range: '$' | '$$' | '$$$' | null;
  rating: number | null;
  image: string | null;
  latitude: number | null;
  longitude: number | null;
  booking_url: string | null;
}

export interface EventInlineListing {
  id: string;
  title: string;
  date: string;
  venue: string | null;
  neighborhood: string | null;
  ticket_price_min: number | null;
  ticket_price_max: number | null;
  image: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface CarInlineListing {
  id: string;
  make: string;
  model: string;
  year: number | null;
  price_daily: number | null;
  pickup_location: string | null;
  image: string | null;
  latitude: number | null;
  longitude: number | null;
  booking_url: string | null;
}
```

## Acceptance Criteria

- [ ] `RestaurantCardInline` renders with name, cuisine, neighborhood, rating, price range
- [ ] `EventCardInline` renders with title, date, venue, ticket price, "Buy Ticket" CTA
- [ ] `CarCardInline` renders with make/model, daily rate, "Book" CTA
- [ ] `EmbeddedListings` routes `OPEN_RESTAURANT_RESULTS`, `OPEN_EVENT_RESULTS`, `OPEN_CAR_RESULTS`
- [ ] `ai-chat` emits correct action types from `search_restaurants`, `search_events`, `search_cars`
- [ ] `ChatMap` renders colored pins for each vertical (blue/green/purple/orange)
- [ ] Saving an event card → inserts into `saved_places` with type='event'
- [ ] All cards follow RentalCardInline layout conventions (horizontal, compact, consistent padding)
- [ ] `npm run build` passes; no TypeScript errors

## Files

| Layer | File | Action |
|---|---|---|
| Component | `src/components/chat/embedded/RestaurantCardInline.tsx` | Create |
| Component | `src/components/chat/embedded/EventCardInline.tsx` | Create |
| Component | `src/components/chat/embedded/CarCardInline.tsx` | Create |
| Router | `src/components/chat/embedded/EmbeddedListings.tsx` | Modify — add 3 new action cases |
| Map | `src/components/chat/ChatMap.tsx` | Modify — multi-category pin colors |
| Types | `src/types/chat.ts` | Modify — add 3 new inline listing types |
| Edge fn | `supabase/functions/ai-chat/index.ts` | Modify — emit per-vertical actions |

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
