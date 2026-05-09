---
id: C05
title: Events Chat Flows — Discovery + Ticket Purchase + Creation via Chat
status: Not Started
priority: P0
effort: 4 days
revenue_impact: High — ticket commission 5-8%, event creation vertical unlock
depends_on: events table, ticket-checkout edge fn (exists), event_intake flow
skill:
  - events
  - frontend-design
  - mde-stripe
  - chatbot-conversation-design
  - .claude/skills/event-prospecting
---

<!-- task-summary -->
> **What:** Events Chat Flows — Discovery + Ticket Purchase + Creation via Chat
> **Why:** The `search_events` tool exists but returns minimal data from a likely-empty `events` table. There is no: - EventCardInline component (events show as text only) - Ticket purchase from chat - Nightlife discovery - Event…
> **Tools/Skills:** `events` · `frontend-design` · `mde-stripe` · `chatbot-conversation-design` · `.claude/skills/event-prospecting`
> **P0 · Not Started · Effort: 4 days**
> **Depends on:** events table, ticket-checkout edge fn (exists), event_intake flow

# C05 — Events Chat Flows

## Problem

The `search_events` tool exists but returns minimal data from a likely-empty `events` table. There is no:
- EventCardInline component (events show as text only)
- Ticket purchase from chat
- Nightlife discovery
- Event creation via chat for organizers

The events vertical is a complete blank slate despite having `ticket-checkout`, `ticket-validate`, `vote-cast`, and other edge functions ready.

## What to Build

### 1. EventCardInline component
File: `src/components/chat/embedded/EventCardInline.tsx`

```tsx
interface EventInlineListing {
  id: string;
  title: string;
  date_start: string;
  venue_name: string;
  neighborhood: string;
  category: string;         // 'concert', 'festival', 'nightlife', 'sports'
  image_url?: string;
  price_min?: number;
  price_max?: number;
  is_free: boolean;
  tickets_available: number;
  latitude?: number;
  longitude?: number;
  source_url?: string;
}
```

Card layout:
- Left: image (64x64) with category emoji overlay (🎵 🎉 🎭 🌃)
- Center: title, date (formatted), venue + neighborhood
- Right: price pill ("Free" / "$25–$50") + "Get Tickets" button
- Map pin: 🎉 category, teal color

### 2. `OPEN_EVENTS_RESULTS` action type

Add to `search_events` tool return value:
```typescript
actions: [
  { type: "OPEN_EVENTS_RESULTS", payload: { listings: events[], map_pins: [...] } }
]
```

Handle in `EmbeddedListings.tsx` — render EventCardInline components.
Handle in `useChat.ts` — process `OPEN_EVENTS_RESULTS` for map pins with category='event'.
Handle in `ChatActionBar.tsx` — "See all events →" to `/events`.

### 3. Ticket purchase from chat

When user clicks "Get Tickets" on EventCardInline:
```
User: [clicks "Get Tickets" on Jazz at Eslabón]
→ ChatActionBar shows OPEN_TICKET_CHECKOUT action
→ Button: "Buy 1 ticket for $25 →"
→ Click → initiate_ticket_checkout tool call → Stripe payment intent
→ OPEN_PAYMENT_LINK action → link opens Stripe checkout in new tab
```

New tool in ai-chat:
```typescript
{
  name: "initiate_ticket_checkout",
  description: "Start the ticket purchase process for an event the user wants to attend",
  parameters: {
    event_id: { type: "string" },
    ticket_tier_id: { type: "string" },
    quantity: { type: "integer", default: 1 }
  }
}
```

This calls `supabase/functions/ticket-checkout/index.ts` which already exists.
Returns payment_url → emit `OPEN_PAYMENT_LINK` action → ChatActionBar shows "Complete Purchase →" button.

### 4. Nightlife search tool

New tool for "where to go tonight" queries:
```typescript
{
  name: "search_nightlife",
  description: "Search for bars, clubs, live music, and nightlife in Medellín for tonight or this weekend",
  parameters: {
    neighborhood: { type: "string" },
    vibe: { type: "string", enum: ["salsa", "electronic", "live_music", "rooftop", "craft_beer", "cocktails"] },
    date: { type: "string" }
  }
}
```

Data source: extends `events` table with `category = 'nightlife'`. Seed with top Medellín nightlife (Eslabón Eléctrico, Salón Málaga, Calle 9+1, Envy Rooftop, etc.).

### 5. Event creation intake (organizer flow)

New tool: `event_intake` — conversational event creation in 6 steps.

File: `supabase/functions/chat-event-intake/index.ts`

```
Step 1: Event type and name
Step 2: Date, time, and duration
Step 3: Venue or location
Step 4: Capacity and ticket pricing
Step 5: Description and target audience
Step 6: Sponsor and media (optional)
```

Example conversation:
```
User: I want to organize an event
AI: Exciting! What kind of event are you planning?
    (Concert, festival, workshop, networking, nightlife, sports, cultural)

User: A salsa night at a venue in El Poblado
AI: Love it — a salsa night! What date and time are you thinking?

User: June 15th, starts at 8pm
AI: Perfect. Do you have a venue in mind, or need help finding one in El Poblado?

User: I have Envy Rooftop booked
AI: Great venue choice. How many guests are you expecting, and will you charge entry?

User: About 200 people, $15 at the door
AI: Got it — 200 capacity at $15/ticket. Tell me about the event: who's performing or hosting?

User: DJ Pacho will be playing, it's a mix of salsa and champeta
AI: Creating your event now...
    [OPEN_EVENT_CREATED action] 
    "Salsa + Champeta Night with DJ Pacho" — June 15 — Envy Rooftop — $15
    [Edit Event →] [Create Ticket Tiers →] [Share Event →]
```

After creation, emit `OPEN_EVENT_CREATED` action with:
```json
{
  "type": "OPEN_EVENT_CREATED",
  "payload": {
    "event_id": "uuid",
    "title": "Salsa + Champeta Night with DJ Pacho",
    "event_url": "/events/uuid"
  }
}
```

### 6. Router intents to add

```typescript
event_create: { agent: 'organizer', description: 'Create or organize a new event' },
event_manage: { agent: 'organizer', description: 'Manage an existing event, check stats, modify' },
nightlife: { agent: 'concierge', description: 'Find bars, clubs, live music for tonight' },
event_ticket: { agent: 'concierge', description: 'Buy or manage event tickets' },
contestant_enter: { agent: 'concierge', description: 'Enter a contest or competition' },
```

Quick-match patterns:
```typescript
{ patterns: [/\b(organize|create|plan.*event|host.*event|my event)\b/i], intent: 'event_create', confidence: 0.90 },
{ patterns: [/\b(nightlife|club|bar|going out|party tonight|where to go)\b/i], intent: 'nightlife', confidence: 0.88 },
{ patterns: [/\b(buy.*ticket|get.*ticket|attend|entrada)\b/i], intent: 'event_ticket', confidence: 0.90 },
```

### 7. Seed event data

Create a seeding script (or migration) with 20 real Medellín events:
- Eslabón Eléctrico Jazz Thursdays
- Salón Málaga Tango Sundays
- Parque Explora events
- Teatro Metropolitano concerts
- Feria de las Flores (August)
- Rock al Parque
- Festival Internacional de Poesía

These become the initial `events` table rows that make the chat actually useful for tourists/nomads.

## Acceptance Criteria

- [ ] "What's happening this weekend?" returns EventCardInline cards + map pins
- [ ] "Where to go for salsa tonight?" returns nightlife results
- [ ] "Get Tickets" button on event card triggers ticket checkout flow
- [ ] Organizer saying "I want to create an event" starts 6-step intake
- [ ] Event created via chat appears at `/events/:id`
- [ ] `event_create`, `nightlife`, `event_ticket` intents classified correctly
- [ ] Events have 🎉 map pins (teal color) on the right panel map

## Files to Touch

- `src/components/chat/embedded/EventCardInline.tsx` — create
- `src/components/chat/embedded/EmbeddedListings.tsx` — handle OPEN_EVENTS_RESULTS
- `supabase/functions/ai-chat/index.ts` — add event_intake, search_nightlife, initiate_ticket_checkout tools
- `supabase/functions/chat-event-intake/index.ts` — create
- `supabase/functions/ai-router/index.ts` — add event intents
- `src/components/chat/ChatActionBar.tsx` — handle OPEN_EVENT_CREATED, OPEN_PAYMENT_LINK
- `supabase/migrations/YYYYMMDD_events_seed.sql` — seed 20 real events

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
