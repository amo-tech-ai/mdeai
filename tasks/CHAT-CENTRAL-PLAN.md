# mdeai Chat-Central Plan v1.0

*Locked: 2026-04-23 · Owner: sk · Reviewer: Claude Opus 4.7*

---

## 1. Mission

Build an AI concierge for Medellín where **chat is the primary interface**. One canvas at `mdeai.co/` — three panels (nav · conversation · map) — handles every user intent (rentals, restaurants, events, attractions, general Medellín questions).

**Rentals are the hero vertical that drives revenue this month.** Restaurants, events, and attractions slot into the same chat architecture over the following 3 weeks without a rebuild.

---

## 2. Positioning vs. competitors

> *"Mindtrip helps a tourist plan a 5-day trip to any city. mdeai helps a nomad move to Medellín for 3 months."*

| | mdeai | Mindtrip | Airbnb | Jitty |
|---|---|---|---|---|
| Scope | 1 city (Medellín) | Global | Global | UK |
| Stay length | Medium/long (30-90d) | Short (3-7d) | Any | Any |
| Sources | Airbnb + FazWaz + Metrocuadrado + Facebook | Booking.com | Self | UK portals |
| Scam moat | Price z-score + photo hash + cross-source verify | None | Platform-verified only | None |
| Languages | EN/ES bilingual | EN | EN + | EN |
| Channels | Web + WhatsApp | Web | App + web | Web |
| Supply side | Leads for agents + landlord SaaS | None | Host tools | None |

**Defensible moats (ranked):**
1. Multi-source aggregation + scam filter (Colombian market unique)
2. Medium-term stay depth (Wi-Fi, workstation, commute, lease clarity)
3. Bilingual EN/ES from byte 0
4. WhatsApp channel for LATAM reach
5. Supply-side product (agents + landlords)

---

## 3. Architecture

### The single canvas

```
─── mdeai.co/ ──────────────────────────────────────────────────
┌──────────┬──────────────────────────────┬──────────────────┐
│ LEFT NAV │         CONVERSATION          │   RIGHT MAP      │
│          │                               │                  │
│ New chat │ Context chips                 │ Color-coded pins │
│ Chats N  │ User message                  │ synced with      │
│ Saved N  │ AI response:                  │ latest tool call │
│ Trips N  │  · agent-themed reasoning     │                  │
│ Create   │  · structured sections        │ 🏠 rentals       │
│          │  · embedded <Card>s           │ 🍽️ food          │
│          │  · Not-a-fit table            │ 🎉 events        │
│ User     │  · Follow-up question         │ 📍 attractions   │
│          │                               │                  │
│          │ [Ask anything…]  [+ 🎙 →]     │                  │
└──────────┴──────────────────────────────┴──────────────────┘
```

### Four extensible parts

| # | Part | Pattern | New vertical costs |
|---|---|---|---|
| 1 | Tool registry | `TOOLS: Record<name, ToolExecutor>` | 1 entry (~30 lines) |
| 2 | Card components | Polymorphic by `result.type` | 1 file (~100 lines) |
| 3 | Map pin types | Color+icon keyed on `category` | 1 config row |
| 4 | Tool response envelope | Fixed shape | 0 changes |

### The contract — tool response envelope

Every search tool returns this. Client renders generically.

```ts
// supabase/functions/_shared/tool-response.ts
export interface ToolResponse<T = unknown> {
  type: "rentals" | "restaurants" | "events" | "attractions";
  message: string;                    // 1-sentence AI-facing summary
  total_count: number;                // for "showing 5 of 43"
  considered: number;                 // for "12 of 72 match"
  listings: T[];                      // cards; shape varies per type
  filters_applied: Record<string, unknown>;
  considered_but_rejected?: {         // the trust moat
    listing_summary: string;
    reason: string;
  }[];
  actions?: ChatAction[];             // OPEN_RESULTS, ADD_TO_TRIP, etc
  agent_label?: string;               // "Rentals Concierge" narration
}
```

### SSE stream pattern

Edge function emits 4 types of events before `[DONE]`:

```
data: {"phase":"handoff","agent_label":"Rentals Concierge","message":"Handing off..."}
data: {"phase":"thinking","message":"Scouting 43 rentals across sources..."}
data: {"phase":"thinking","message":"Filtering 7 scam-flagged..."}
data: {"phase":"thinking","message":"Considering 12 of 43..."}
data: {"mdeai_actions":[{"type":"OPEN_RENTALS_RESULTS","payload":{...}}]}
data: {"choices":[{"delta":{"content":"Found 5 apartments..."}}]}
…
data: [DONE]
```

Client renders `phase` events as a collapsible "Thought for Ns" panel above the response.

### Routing

| URL | Who | What loads |
|---|---|---|
| `/` | Any user | **The chat canvas** (3-panel, new chat) |
| `/c/:conversationId` | Logged-in user | Chat canvas with prior conversation loaded |
| `/apartments` | SEO / direct link | Static grid page with "Find similar in chat →" CTA |
| `/apartments/:id` | SEO / shared listing | Detail page with "Ask mdeai about this →" CTA |
| `/restaurants`, `/events` | SEO | Static grid, same pattern as `/apartments` |
| `/login`, `/signup` | Auth | Existing |
| `/trips/:id` | Shared trip | Public view with saved listings + map |

---

## 4. File layout (what exists / what we add)

### Existing (reuse)

```
src/
  App.tsx                                  — routes
  components/
    chat/
      ChatInput.tsx                        — reuse (v31 has sendingRef guard)
      ChatMessageList.tsx                  — reuse, extend
      ChatActionBar.tsx                    — reuse (v31), extend
      FloatingChatWidget.tsx               — DEPRECATE (kept for /dashboard only)
    apartments/
      ApartmentCard.tsx                    — reuse inline in chat
    explore/
      ThreePanelLayout.tsx                 — reuse as chat canvas
  hooks/
    useChat.ts                             — reuse, extend for phase events
  pages/
    Apartments.tsx                         — reuse, add "Find similar" CTA

supabase/functions/
  ai-chat/index.ts                         — reuse, refactor to tool-registry
  _shared/
    ai-runs.ts                             — reuse
    gemini.ts                              — reuse
    http.ts                                — reuse
    rate-limit.ts                          — reuse (durable)
    supabase-clients.ts                    — reuse
```

### New (to create)

```
src/
  pages/
    Home.tsx                               — NEW: chat canvas at /
    ChatConversation.tsx                   — NEW: /c/:id wrapper
  components/
    chat/
      ChatCanvas.tsx                       — NEW: 3-panel layout for chat
      ChatLeftNav.tsx                      — NEW: chat history + saved + trips
      ChatMap.tsx                          — NEW: right panel map with synced pins
      ChatContextChips.tsx                 — NEW: persistent filter chips
      ChatReasoningTrace.tsx               — NEW: "Thought for Ns" collapsible
      ChatAgentBadge.tsx                   — NEW: "Rentals Concierge" avatar
      embedded/
        EmbeddedListings.tsx               — NEW: renders cards inline
        RentalCardInline.tsx               — NEW: chat-optimized ApartmentCard
        RestaurantCardInline.tsx           — Week 3
        EventCardInline.tsx                — Week 4
        AttractionCardInline.tsx           — Week 5
      NotAFitTable.tsx                     — NEW: rejection transparency
  context/
    MapContext.tsx                         — NEW: shares pins between chat & map
  hooks/
    useAnonSession.ts                      — NEW: cookie-based 3-msg gate
    useChatActions.ts                      — NEW: heart/add-to-trip handlers

supabase/functions/
  _shared/
    tool-registry.ts                       — NEW: TOOLS registry
    tool-response.ts                       — NEW: envelope types
    google-places.ts                       — NEW: Places API wrapper (Week 3)
  search-nearby/                           — Week 3
    index.ts
  search-events/                           — Week 4
    index.ts

supabase/migrations/
  20260424120000_outbound_clicks.sql       — NEW: affiliate attribution
  20260424120001_conversation_session_data.sql — (column may exist; verify)
```

---

## 5. Phase 1 — Rentals MVP (Weeks 1–2, day-by-day)

### Week 1 — Layout + structure

| Day | Deliverable | Files touched | Acceptance criteria |
|---|---|---|---|
| **Mon** | Tool-registry refactor + `/` routes to chat canvas | `_shared/tool-registry.ts`, `ai-chat/index.ts`, `App.tsx`, new `pages/Home.tsx`, new `ChatCanvas.tsx` | Opening `mdeai.co/` shows 3-panel chat (no floating widget). Tool registry exports `TOOLS`. Existing v31 functionality unchanged. |
| **Tue** | Inline rental cards in message stream | `ChatMessageList.tsx`, new `embedded/RentalCardInline.tsx`, new `EmbeddedListings.tsx` | Chat response renders ApartmentCards inline (not markdown prose). Cards have ♥ + ➕ buttons (no-op for now). |
| **Wed** | Map sync + reasoning trace | new `ChatMap.tsx`, new `MapContext.tsx`, new `ChatReasoningTrace.tsx`, `ai-chat/index.ts` (phase events) | Map pins appear on right panel for every returned listing. "Thought for Ns" collapsible appears above AI responses. Agent label shows "Rentals Concierge". |
| **Thu** | Structured response + rejection transparency | `ai-chat/index.ts` (system prompt + `considered_but_rejected`), new `NotAFitTable.tsx` | AI responses always use sections: **What I Searched / Best Option / Other Top Rentals / Not a Good Fit / Follow-up**. Rejection table renders with reasons. |
| **Fri** | Anonymous mode + email gate | new `useAnonSession.ts`, `useChat.ts` (integrate), `ai-chat/index.ts` (allow anon with cookie) | Logged-out user can send 3 messages. 4th message shows email capture. Email → magic link → continues session. |

**Week 1 exit test:** Logged-out visitor types "rentals Laureles", sees cards + pins + structured response + reasoning trace. 3-message limit enforced.

### Week 2 — Engagement + revenue hooks

| Day | Deliverable | Files touched | Acceptance criteria |
|---|---|---|---|
| **Mon** | Context chips bar | new `ChatContextChips.tsx`, `useChat.ts` (persist to `conversations.session_data`) | `📍 Laureles · 📅 May 11–18 · 👥 1 · 💰 $500–$1200` at top. Edit any chip → next tool call uses it. Persists across page refresh. |
| **Tue** | ♥ Save + ➕ Add to trip + social proof | `RentalCardInline.tsx`, new `useChatActions.ts` | Heart → `saved_places` row. Plus → modal (new/existing trip) → `trip_items` row. Cards show "Saved by N nomads" if count > 0. |
| **Wed** | Left nav = chats + saved + trips | new `ChatLeftNav.tsx`, replace/augment current left panel | Sidebar lists recent conversations (title from first user msg). "Saved (N)", "Trips (N)" sections. Click → loads that conversation/trip in middle column. |
| **Thu** | SEO page handoff + email gate UI polish | `Apartments.tsx`, `ApartmentDetail.tsx`, email-gate modal component | `/apartments/:id` has "Ask mdeai about this →" CTA that opens chat with listing context pre-loaded. Email gate UX polished. |
| **Fri** | Affiliate attribution + outbound tracking | new migration `20260424120000_outbound_clicks.sql`, `ApartmentCard.tsx`, env vars | Every outbound click to `source_url` carries affiliate tag. Click logged to `outbound_clicks` table. Airbnb + Booking.com affiliate IDs wired. |

**Week 2 exit test:** Logged-in user searches → saves 2 listings → adds 1 to a new trip → clicks outbound to Airbnb → click is logged with affiliate tag.

---

## 6. Phase 2 — Restaurants (Week 3)

| Day | Deliverable |
|---|---|
| **Mon** | `search-nearby` edge function wrapping Google Places Nearby Search. Cache in `restaurants` table with 7-day TTL. |
| **Tue** | Seed: one-off script pulls top 200 Medellín restaurants (radius El Poblado/Laureles/Envigado/Provenza) via Places API. |
| **Wed** | `<RestaurantCardInline>`, 🍽️ map pin config. Register `search_nearby` in tool-registry. |
| **Thu** | System prompt update: after `rentals_search`, auto-call `search_nearby(lat, lng, radius_km=1.5, types=[restaurant,cafe], limit=3)`. Renders as **"What's Nearby"** section. |
| **Fri** | Reservation affiliate (ResPlaces LATAM / OpenTable where available). Outbound tracking. |

---

## 7. Phase 3 — Events (Week 4)

| Day | Deliverable |
|---|---|
| **Mon** | `events` table manual seed — top 30 weekly recurring Medellín events (jazz at Eslabón, salsa at Salón Málaga, poetry at Amor a Mares, etc.). |
| **Tue** | `search-events` edge function. Filter by date range + neighborhood proximity. Eventbrite API fallback for upcoming special events. |
| **Wed** | `<EventCardInline>`, 🎉 pin. |
| **Thu** | System prompt update: add **"This Week"** section when search dates fall in next 7 days. |
| **Fri** | Eventbrite affiliate API for ticket-backed events. |

---

## 8. Phase 4 — Attractions (Week 5)

| Day | Deliverable |
|---|---|
| **Mon** | Extend `search-nearby` to accept `type=tourist_attraction`. Seed top 50 Medellín attractions via Places API. |
| **Tue** | `<AttractionCardInline>`, 📍 pin. |
| **Wed** | System prompt: include in nearby section when stay ≥ 3 days. |
| **Thu** | GetYourGuide / Viator affiliate for bookable experiences. |
| **Fri** | Polish + bug fix buffer. |

---

## 9. Monetization per vertical

| Vertical | Revenue per interaction | Integration | Starts earning |
|---|---|---|---|
| Rentals (core) | 12% on native bookings + $20–50 per qualified agent lead + Airbnb/Booking affiliate (3–5%) | Stripe Connect (native) + affiliate tags | Week 2 Fri |
| Restaurants | Reservation affiliate $1–3 per cover | Link generation | Week 3 Fri |
| Events | Eventbrite affiliate 5–8% ticket | API | Week 4 Fri |
| Attractions | GetYourGuide / Viator 5–10% | API | Week 5 Thu |

**Revenue milestones:**

| Week | Target |
|---|---|
| 2 | First affiliate click + first email capture |
| 4 | First paying agent ($500 prepaid lead-pack) + 50 leads captured |
| 6 | $1K MRR across rentals + restaurants affiliate |
| 8 | $3K MRR, 3 paying agents, 200 active users |

---

## 10. Success metrics

Measure weekly. Dashboard on `/admin/metrics` (Week 2 build).

| Metric | Wk2 | Wk4 | Wk8 | Wk12 |
|---|---|---|---|---|
| Users landing on chat | 100 | 500 | 2K | 8K |
| Email captures (post 3-msg gate) | 20 | 150 | 600 | 2.5K |
| Outbound affiliate clicks | 50 | 500 | 2K | 8K |
| Qualified leads captured | 5 | 40 | 150 | 600 |
| Paying agents | 0 | 1 | 5 | 15 |
| Chat turns per session | 3 | 5 | 7 | 8 |
| Save / add-to-trip events | 10% of sessions | 25% | 40% | 50% |
| Conversations with >1 vertical surfaced | n/a | 30% | 60% | 70% |

---

## 11. What's explicitly deferred

| Item | Why defer | Revisit |
|---|---|---|
| Cars vertical | No data, weak nomad fit | Q3 if market pulls |
| Coffee/Shopify commerce | Different commerce model, not chat-native | Phase 2 product initiative |
| WhatsApp channel | Prove web first; reuse `chat-engine` when ready | Week 6 |
| Voice input | Nice-to-have, not revenue-blocking | Week 8 |
| Native Stripe bookings | Affiliate is faster to revenue; native adds 2 weeks | Month 3 |
| Firecrawl ingestion | Manual + user-paste covers MVP; scraping needed when data quality matters | Month 2 |
| Scam score + trust columns | Synthetic data doesn't benefit; add with live scraping | Month 2 |
| Hermes / Paperclip / OpenClaw | Tool-registry suffices until 3+ autonomous cron processes exist | Month 6+ |
| Multi-city (Bogotá, Cartagena) | Proof first in Medellín | Month 12 |

---

## 12. Decisions locked in (from user conversation)

| Decision | Choice |
|---|---|
| Primary interaction | **Chat at `/`** — not a widget |
| Focus vertical | **Rentals** (weeks 1–2) |
| Layout | 3-panel (nav · chat · map) — Mindtrip pattern |
| Cards | Inline in chat, not markdown |
| Map | Always visible right panel |
| Agent architecture | **Tool-registry** (not multi-agent infra). Agent-themed UX via phase events. |
| Multi-vertical surfacing | Rentals cross-sell nearby restaurants/events/attractions |
| SEO pages | **Keep** `/apartments`, `/events`, `/restaurants` for Google. Primary CTA = "Ask mdeai →" |
| Auth | Anon 3-message gate, then email |
| Map provider | Google Maps (already using Places + Directions) |
| Cars + Coffee | Deferred / deleted from nav |
| Languages | EN + ES auto-detect |
| Trip primitive | Cards save into trips; trips are shareable |

## 13. Decisions still open (low stakes, defaults in **bold**)

| Decision | Options | Default if no objection |
|---|---|---|
| Anon message limit | 2 / **3** / 5 | 3 |
| Email gate type | Magic link / OTP / password | **Magic link** (Supabase default) |
| Agent persona names | **Rentals Concierge / Food Scout / Events Scout / Tours Guide** / other | as shown |
| Chat history retention | **Forever** / 90d / 30d | Forever |
| Default conversation title | **first 50 chars of first user message** / AI-generated title | first 50 chars |
| Right-panel map height | **full viewport** / collapsible / hidden on mobile | full on desktop, toggle on mobile |

---

## 14. Day 1 concrete checklist (Monday)

Morning (2–3h):
- [ ] Create `_shared/tool-response.ts` with `ToolResponse` interface
- [ ] Create `_shared/tool-registry.ts` with `TOOLS` registry + `ToolExecutor` interface
- [ ] Refactor `ai-chat/index.ts` to consume from registry (no behavior change)
- [ ] Create `src/pages/Home.tsx` = `ChatCanvas` component
- [ ] Update `src/App.tsx` so `/` routes to `Home`
- [ ] Create `src/components/chat/ChatCanvas.tsx` — `ThreePanelLayout` with chat in middle

Afternoon (2–3h):
- [ ] Confirm existing `ChatMessageList` + `ChatInput` work inside the new canvas
- [ ] Remove `FloatingChatWidget` from homepage (keep on `/dashboard` + internal pages)
- [ ] Deploy ai-chat v32 (tool-registry refactor)
- [ ] Smoke test: `/` renders chat, typing "rentals Laureles" returns a response (markdown still OK on day 1)
- [ ] Push single commit: `feat(chat): tool-registry + ChatCanvas at /`

End of Monday: canvas is live, everything else is the same as v31.

---

## 15. Rollback + safety

- Every change ships behind an existing PR (or a new one per phase).
- `FloatingChatWidget` stays in the codebase until Week 3 as a fallback (controlled by a feature flag or route-level decision).
- Migrations are applied via MCP `execute_sql` (simple protocol) + recorded in `schema_migrations`. Never use `apply_migration` for iterative work.
- Every new edge function deploy increments version; rollback = redeploy previous version.
- Anon rate limiter uses durable Postgres RPC (shipped v30) — safe under load.

---

## 16. One-paragraph commit message template

```
feat(chat): <what changed in one line>

<why this move helps the chat-central plan>
<what the user-visible behavior is now>
<what tests or smoke-checks were run>

Refs: tasks/CHAT-CENTRAL-PLAN.md §<section>
Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

---

*End of plan v1.0. Update this file when decisions change or phases ship.*
