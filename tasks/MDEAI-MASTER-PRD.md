# mdeai Master PRD v4 — Chat-First AI Concierge for Medellín

*Version 4.0 · Locked: 2026-04-23 · Owner: sk · Architect: Claude Opus 4.7*
*Supersedes: `prd.md` (v3, 2026-04-04) · Extends: `tasks/CHAT-CENTRAL-PLAN.md`*

---

## 0. How this document is organized

| Section | Audience | Purpose |
|---|---|---|
| 1–4 | Everyone | What we're building, what's shipped, what the system looks like |
| 5–7 (**CORE**) | Shipping team | Week-by-week execution through Phase 2 |
| 8–11 (**ADVANCED**) | Q3/Q4 | Intelligence, agents, automation layer |
| 12 (**ROADMAP**) | Founder / investors | 12-month quarterly plan |
| 13–16 | Everyone | Risks, decisions, revenue, appendices |

---

## 1. Executive summary

**mdeai is an AI concierge for Medellín where chat is the entire product.**

One canvas at `mdeai.co/` — three panels (nav · conversation · map) — handles every user intent. Rentals are the hero vertical that drives revenue; restaurants, events, and attractions are upsell layers that extend session time and unlock affiliate revenue.

**Positioning:** *"Mindtrip helps a tourist plan a 5-day trip. mdeai helps a nomad move to Medellín for 3 months."*

**Defensible moats (ranked):**
1. Multi-source rental aggregation + scam detection (Airbnb + FazWaz + Metrocuadrado + Facebook Groups) — no competitor does this in Colombia
2. Medium-term stay depth (Wi-Fi speed, workstation, commute, lease clarity — not Airbnb's nightly focus)
3. Bilingual EN/ES from byte 0
4. WhatsApp-native delivery for LATAM reach
5. Supply-side product (agent leads + landlord SaaS)
6. Hermes-backed personalization via pgvector (Phase 3)

**North-star metric:** Qualified rental leads sold per week × average lead price.

---

## 2. What's shipped today (Week 1 complete)

Done via PR #1 on `fix/chat-production-hardening` — 12 commits, 50 files, +25.6k/−5.4k lines.

| Capability | Proof |
|---|---|
| Chat canvas at `mdeai.co/` | Live; 3-panel layout on desktop, tablet collapses, mobile single-column |
| Tool-registry pattern | `supabase/functions/_shared/tool-registry.ts` + `tool-response.ts` |
| Inline rental cards | `RentalCardInline.tsx`, embedded in conversation stream |
| Map pin context | `MapContext` with color-coded categories; right-panel pin list |
| Agent-themed reasoning trace | "Thought for Ns" collapsible; phases streamed via SSE |
| Structured responses | System prompt enforces **What I Searched / Best / Others / Not a Fit / Follow-up** |
| Rejection transparency | `NotAFitTable.tsx` + `considered_but_rejected` rows from tool |
| Anon 3-msg gate | Live-proven: msg #4 → `402 ANON_LIMIT_EXCEEDED` (curl sequence recorded) |
| Email magic-link modal | `EmailGateModal.tsx`, opens on 402 |
| Durable rate limiter | Postgres `check_rate_limit` RPC + `rate_limit_hits` table |
| Server-authoritative UUID roundtrip | Realtime dedup fixed |
| Strict Zod caps | 8K content, 20-msg history, role enum |
| Scam-free auth gate | No anon Gemini burn; user JWT forwarded to internal rentals fn |
| TZ-correct same-day showing guard | `p1_schedule_tour_atomic` uses `America/Bogota` |
| 43 seeded listings with hosts/ratings/source-URLs | `20260423130000_apartments_seed_enrichment.sql` |

Edge function versions: `ai-chat` v28 → v36 across the week.

---

## 3. System architecture

### 3.1 The single canvas (shipped)

```
─── mdeai.co/ ──────────────────────────────────────────────────
┌──────────┬──────────────────────────────┬──────────────────┐
│ LEFT NAV │         CONVERSATION          │   RIGHT MAP      │
│ New chat │ Context chips                 │ Color-coded pins │
│ Chats N  │ User msg                      │ synced with      │
│ Saved N  │ AI response:                  │ latest tool call │
│ Trips N  │  · agent reasoning trace      │                  │
│ Create   │  · structured sections        │ 🏠 rentals       │
│          │  · embedded cards             │ 🍽️ restaurants   │
│          │  · Not-a-fit table            │ 🎉 events        │
│          │  · Follow-up question         │ 📍 attractions   │
│          │ [Ask anything…]  [+ 🎙 →]     │                  │
└──────────┴──────────────────────────────┴──────────────────┘
```

### 3.2 Layered stack

```
┌─────────────────────────────────────────────────────────────────┐
│ CHAT LAYER (Vite + React + TS + shadcn + Tailwind · Vercel)     │
│   ChatCanvas · embedded cards · ChatMap · ChatReasoningTrace    │
│   useChat · useAnonSession · useMapContext                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │ fetch → SSE stream
┌──────────────────────────▼──────────────────────────────────────┐
│ EDGE FUNCTIONS (Deno · Supabase)                                │
│   ai-chat (TOOLS registry · SSE sidecar · rate limit · auth)    │
│   ai-router  ·  rentals  ·  p1-crm  ·  google-directions        │
│   ingest-scrape (Phase 2)  ·  search-nearby (Phase 2)           │
│   whatsapp-webhook (Phase 2)  ·  scam-score (Phase 3)           │
└──────────────────────────┬──────────────────────────────────────┘
            ┌──────────────┼──────────────────┐
            ▼              ▼                  ▼
┌────────────────┐ ┌───────────────┐ ┌────────────────────────┐
│ DATA LAYER     │ │ INTELLIGENCE  │ │ EXECUTION              │
│ (Supabase)     │ │ (Phase 3)     │ │ (Phase 4)              │
│ · Postgres 17  │ │ · Hermes-style│ │ · OpenClaw skills      │
│ · pgvector     │ │   ranker      │ │ · Apify scrapers       │
│ · PostGIS      │ │ · Embeddings  │ │ · Firecrawl extracts   │
│ · Realtime     │ │ · Taste model │ │ · Infobip WhatsApp     │
│ · RLS          │ │ · Re-ranking  │ │                        │
│ · pg_cron      │ │               │ │                        │
└────────────────┘ └───────────────┘ └────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│ MANAGEMENT LAYER (Phase 4)                                      │
│   Paperclip (org chart · budgets · approval gates · audit log)  │
│   Trigger.dev (scheduled jobs · cron · retries · DLQ)           │
│   Sentry (errors)  ·  PostHog (product analytics)               │
└─────────────────────────────────────────────────────────────────┘
```

**Separation of concerns:**
- **Chat layer** = presentation only. Pure React.
- **Edge functions** = business logic. Stateless. Tool-registry + envelope contract.
- **Data layer** = source of truth. RLS enforced on every table.
- **Intelligence layer** = deterministic ranking + LLM reasoning. Read-heavy.
- **Execution layer** = side-effectful (scraping, messaging, bookings). Queued + retried.
- **Management layer** = governance. Budget caps, approval gates, audit trail.

### 3.3 Tool-registry contract (shipped)

Every search capability returns the same `ToolResponse` envelope:

```ts
interface ToolResponse {
  type: "rentals" | "restaurants" | "events" | "attractions";
  message: string;
  total_count: number;
  considered?: number;
  listings: Record<string, unknown>[];
  filters_applied: Record<string, unknown>;
  considered_but_rejected?: { listing_summary: string; reason: string }[];
  actions?: ChatAction[];
  agent_label?: string;
}
```

Adding a new vertical = one entry in `TOOLS` + one card component + one row in `PIN_CATEGORY_CONFIG`. Zero changes to the chat pipeline, map, or SSE handling.

---

## 4. Phased roadmap (summary)

| Phase | Window | Focus | Revenue milestone |
|---|---|---|---|
| **1** | Week 1–2 | Chat canvas + rentals MVP (rentals-first) | First affiliate click |
| **2** | Week 3–5 | Restaurants + Events + Attractions + SEO handoff | $1K MRR |
| **3** | Month 2 | pgvector semantic search + Hermes ranker + ingestion | $5K MRR |
| **4** | Month 3+ | OpenClaw skills + Paperclip governance + WhatsApp | $15K MRR |
| **5** | Q3+ | Landlord SaaS + B2B dashboard + multi-city | $50K+ MRR |

Detailed execution per phase in sections 5–11.

---

# ═══════════════════════════════════════════════════════════════
# 🏗  CORE  (Phases 1–2)
# ═══════════════════════════════════════════════════════════════

## 5. Phase 1 — Chat + Rentals MVP (SHIPPED)

Week 1 detailed in [`tasks/CHAT-CENTRAL-PLAN.md`](./CHAT-CENTRAL-PLAN.md) and fully delivered per section 2 above.

### Week 2 remaining work

| Day | Deliverable | Files |
|---|---|---|
| Mon | `ChatContextChips.tsx` — 📍 Laureles · 📅 May · 👥 2 · 💰 $1k (persisted in `conversations.session_data`) | new component |
| Tue | ♥ Save + ➕ Add-to-trip + social proof badges | `RentalCardInline.tsx` + `useChatActions.ts` |
| Wed | Left-nav: chat history · saved · trips sections (counts from DB) | `ChatLeftNav.tsx` |
| Thu | SEO page handoff — `/apartments/:id` CTA "Ask mdeai about this →" | `ApartmentDetail.tsx` |
| Fri | `outbound_clicks` table + affiliate tag injection on every source link | new migration |

---

## 6. Phase 2 — Multi-vertical upsell (Weeks 3–5)

Every vertical follows the same pattern: **1 tool + 1 card + 1 pin row + 1 API integration**. No chat pipeline changes.

### 6.1 Week 3 — Restaurants

| Day | Deliverable |
|---|---|
| Mon | `search-nearby` edge function · Google Places `nearbysearch` wrapper |
| Mon | `restaurants` table 7-day cache TTL · materialized neighborhood clusters |
| Tue | Seed top 200 Medellín restaurants (batch script via Places) |
| Wed | `<RestaurantCardInline>` · 🍽️ pin color · registered in `PIN_CATEGORY_CONFIG` |
| Thu | System prompt update: after rentals_search, auto-call `search_nearby(lat, lng, r=1.5km)` for cross-sell section |
| Fri | Reservation affiliate — OpenTable / ResPlaces LATAM link generator |

### 6.2 Week 4 — Events

| Day | Deliverable |
|---|---|
| Mon | Manual seed: 30 recurring Medellín events (jazz at Eslabón, salsa at Salón Málaga, poetry at Amor a Mares, Feria de Flores programming) |
| Tue | `search-events` edge function · filter by `event_start_time` + neighborhood |
| Wed | Eventbrite API integration for ticketed events · fallback to Google Places `event_venue` type |
| Thu | `<EventCardInline>` + 🎉 pin color |
| Thu | System prompt: "This Week" section when search dates ≤ 7 days out |
| Fri | Eventbrite affiliate (commission ~5–8% per ticket) |

### 6.3 Week 5 — Attractions

| Day | Deliverable |
|---|---|
| Mon | Extend `search-nearby` with `type=tourist_attraction` + seed top 50 (Comuna 13, Plaza Botero, Metrocable, Guatapé day trip, Parque Arví) |
| Tue | `<AttractionCardInline>` + 📍 pin color |
| Wed | System prompt: include in "Nearby" section when stay ≥ 3 days |
| Thu | GetYourGuide / Viator affiliate for bookable tours |
| Fri | Polish + bug buffer · first $1K MRR target assessment |

### 6.4 Canvas after Phase 2 (user-visible)

User asks *"rentals Laureles"* → response structure:

```
**What I Searched For**                                    ← structured
**Best Option**                                            ← structured
**Other Top Rentals**                                      ← structured
**What's Nearby** (restaurants + cafes within 1.5 km)      ← NEW Week 3
**This Week** (events in the area)                         ← NEW Week 4
**Must-Do** (attractions within 3 km)                      ← NEW Week 5
**Not a Good Fit**                                         ← structured
**Follow-up**                                              ← structured
```

All rendered as cards with heart + add-to-trip. Map pins color-coded per vertical.

---

## 7. Tech stack

### 7.1 Core (shipped or Phase 2)

| Layer | Tool | Status | Notes |
|---|---|---|---|
| Frontend | Vite 5 + React 18 + TS + SWC | ✅ | Matches existing mdeai codebase |
| UI | shadcn/ui + Tailwind | ✅ | "Paisa" theme (DM Sans + Playfair) |
| State | TanStack Query + React Context | ✅ | |
| Routing | react-router-dom v6 | ✅ | |
| Backend | Supabase (Postgres 17 + Auth + Edge Functions + Realtime) | ✅ | Project `zkwcbyxiwklihegjhuql` |
| Vector | **pgvector** | ⏳ Phase 3 | Extension installed, not yet wired |
| Geo | **PostGIS** | ✅ | Used for neighborhood proximity |
| LLM | Gemini 3 Flash + 3.1 Flash Lite | ✅ | Direct OpenAI-compatible endpoint |
| Payments | Stripe Connect | ⏳ Phase 3 | For direct bookings + agent credit packs |
| Places | Google Places API | ⏳ Phase 2 | `GOOGLE_PLACES_API_KEY` in env already |
| Events | Eventbrite API | ⏳ Phase 2 | |
| Tours | GetYourGuide / Viator | ⏳ Phase 2 | |
| Maps | Google Maps JS SDK | ⏳ Phase 2 | Stub map shipped; swap when key wired |
| Hosting | Vercel | ✅ | Auto-deploys from `main` |
| Messaging | Infobip WhatsApp | ⏳ Phase 4 | Credentials already in Supabase secrets |
| Analytics | **PostHog** | ⏳ Phase 2 | Event schema defined in §13 |
| Errors | **Sentry** | ⏳ Phase 2 | |
| Jobs | **Trigger.dev** or **Supabase pg_cron** | ⏳ Phase 3 | pg_cron for simple; Trigger for retries/DLQ |
| Cache | Redis (optional) | Phase 4 | Only if Supabase Postgres becomes bottleneck |

### 7.2 Advanced (Phase 3–4)

| Tool | Role | Phase |
|---|---|---|
| **Hermes** | Reasoning + memory (pgvector-backed) | 3 |
| **OpenClaw** | Skill-based execution (scrape, outreach) | 4 |
| **Paperclip** | Governance (budgets, approvals, audit) | 4 |
| **Firecrawl** | Structured scraping (FazWaz, Metrocuadrado, FincaRaiz) | 3 |
| **Apify** | Airbnb + Facebook Groups scrapers (pre-built actors) | 3 |
| **Playwright / Browserbase** | Last-resort scrape when APIs don't exist | 4 |
| **Bright Data** | Residential proxies when sites block | 4 (only if needed) |

---

# ═══════════════════════════════════════════════════════════════
# 📡  DATA + SCRAPING
# ═══════════════════════════════════════════════════════════════

## 8. Data sources per vertical

### 8.1 Rentals (critical — multi-source is the moat)

| Source | Method | Legal | Cost | Deploy |
|---|---|---|---|---|
| Airbnb | **Apify Airbnb Listing Scraper** (`apify/caprolok/airbnb-scraper` or `kaix/airbnb-listing-scraper`) | ⚠️ TOS-grey; Apify's Actor handles JS/anti-bot; community-maintained | ~$1.25 / 1K results · ~$0.30 per query of 240 results | Phase 3 |
| Airbnb (affiliate-safe) | **Direct affiliate deep-links** (no scrape) · `https://www.airbnb.com/s/<city>/homes?...&adults=...` + affiliate tag | ✅ TOS-safe | Free | **Phase 2** (immediate) |
| FazWaz (`fazwaz.com.co`) | **Firecrawl Extract API** + Zod schema | ✅ Public listings, low enforcement | $20–89/mo Firecrawl | Phase 3 |
| Metrocuadrado | Firecrawl + Zod | ✅ | Included | Phase 3 |
| FincaRaiz | Firecrawl + Zod | ✅ | Included | Phase 3 |
| Facebook Groups (`765646657979980`, `987616699644834`) | **Apify Facebook Groups Scraper** (authenticated account) · + paste-in fallback from users | ❌ FB TOS forbids; accept account-ban risk OR use paste-in only | ~$0.40–$1 per 1K posts | Phase 3 (paste-in in Phase 2) |
| Direct landlord submissions | Web form + chat `rentals_intake` tool | ✅ Free, highest quality | Free | **Phase 2** |
| Local agent partnerships | WhatsApp → AI extracts → `rentals` table | ✅ | Free | Phase 4 |

### 8.2 Restaurants

| Source | Method | Cost |
|---|---|---|
| Google Places | `nearbysearch` + `place_details` (radius + type=restaurant/cafe/bar) | Free tier 100K calls/mo, then $17 / 1K |
| Yelp | Only if we need review sentiment; skip for MVP | — |
| TripAdvisor | Affiliate for Experiences; scraping not needed | — |

### 8.3 Events

| Source | Method | Cost |
|---|---|---|
| Eventbrite | Official API (affiliate program) | Free |
| Meetup | Official API | Free |
| Local sites (vive.co, medellin.travel) | Firecrawl weekly | Included in Firecrawl |
| Manual curation | Weekly ops job (30 min human review) | Cost of labor |

### 8.4 Attractions

| Source | Method | Cost |
|---|---|---|
| Google Places | `type=tourist_attraction` | Included |
| Viator | Affiliate API for bookable tours | Free |
| GetYourGuide | Affiliate API | Free |
| Manual top-50 curation | One-time seed | Free |

---

## 9. Scraping strategy (Firecrawl + Apify + APIs)

### 9.1 Decision tree — which method per source

```
Is there an official API with the data we need?
  ├─ Yes → Use the API (Google Places, Eventbrite, Viator, GetYourGuide)
  └─ No →
       Is the site's ToS permissive and listings are public?
         ├─ Yes → **Firecrawl** (structured extract with Zod schema)
         └─ No →
              Is there a battle-tested Apify Actor?
                ├─ Yes → **Apify** (absorbs anti-bot + JS render, but accept
                │         community-maintenance risk and account bans)
                └─ No →
                     Fall back to **Playwright/Browserbase** + residential
                     proxies, or punt the source entirely.
```

### 9.2 Scraping pipeline (Phase 3)

```
┌─ pg_cron schedules ─────────────────────────────────────────┐
│   • Every 6h: Firecrawl FazWaz+Metrocuadrado+FincaRaiz      │
│   • Every 24h: Apify Airbnb (Laureles+Poblado+Envigado)     │
│   • Every 12h: Apify Facebook Groups (with rotation)        │
│   • Every 24h: Google Places nearbysearch (refresh cache)   │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
         ┌─ Edge Function: ingest-scrape ─┐
         │ 1. Fetch raw page / JSON       │
         │ 2. Gemini extracts → Zod valid │  ← tolerant to layout drift
         │ 3. Write to staging table      │
         └──────────────────┬─────────────┘
                            ▼
         ┌─ Edge Function: normalize-dedupe ─────┐
         │ 1. Gemini embedding (description)     │
         │ 2. pgvector similarity > 0.92 = merge │
         │ 3. PostGIS distance < 50m = merge     │
         │ 4. Perceptual hash photos             │
         │ 5. Upsert into apartments + sources[] │
         └──────────────────┬────────────────────┘
                            ▼
         ┌─ Edge Function: scam-score ──────────┐
         │ • Price z-score vs neighborhood      │
         │ • Photo-hash collision across sources│
         │ • Text signals (wire transfer, etc)  │
         │ • Writes trust_score, scam_risk      │
         └──────────────────┬───────────────────┘
                            ▼
                   public.apartments
               (canonical + trust signals)
```

### 9.3 Data validation rules

| Field | Rule |
|---|---|
| `price_monthly` | 200 ≤ p ≤ 10000 USD; reject outside |
| `neighborhood` | Must match seeded enum (El Poblado, Laureles, Envigado, Provenza, Belén, Sabaneta, Manila, Centro, +20 more) |
| `latitude/longitude` | Within Medellín bounding box (6.15–6.35, −75.65 to −75.45) |
| `images` | At least 1; reject if all URLs 404 on probe |
| `source_url` | Must parse as valid URL; reject if host not whitelisted |
| `description` | 20–5000 chars; strip HTML; Gemini-classify for scam signals |

### 9.4 Duplicate detection (across sources)

| Signal | Threshold | Decision |
|---|---|---|
| pgvector cosine on description embedding | ≥ 0.92 | Merge |
| PostGIS distance | < 50m | Candidate |
| Perceptual hash (pHash) photo match | Hamming distance ≤ 8 on any image | Merge |
| Title fuzzy (trigram) | similarity > 0.8 | Weight toward merge |
| Price within ±5% AND bedrooms same AND beds same | — | Weight toward merge |

Merged listings keep `source_url` in a `sources[]` array. **Number of sources = trust signal** ("Seen on 3 sites" badge).

### 9.5 Anti-scam logic

| Signal | Action |
|---|---|
| Price z-score > 2σ below neighborhood median | `scam_risk='high'` |
| Same photo on ≥3 listings across sources | `scam_risk='high'` + flag all |
| Description contains "wire transfer" / "abroad" / "Western Union" (EN/ES) | `scam_risk='high'` |
| Contact phone is WhatsApp that never responds to test message | `scam_risk='medium'` |
| Only 1 photo with generic stock feel (reverse-image) | `scam_risk='medium'` |
| No neighborhood match to lat/lng | `scam_risk='medium'` |
| Verified across ≥ 2 sources, price within 1σ, responsive host | `scam_risk='low'` + `trust_score = 0.9+` |

**Rendered in UI as:** red ⚠️ banner on card OR ✓ Verified green badge. Scam-flagged listings are never in the top-5 shortlist (go to "Not a Good Fit" with reason).

---

# ═══════════════════════════════════════════════════════════════
# 💰  REVENUE
# ═══════════════════════════════════════════════════════════════

## 10. Revenue model

### 10.1 Primary streams

| Stream | Per-event revenue | Launch | Ceiling |
|---|---|---|---|
| Airbnb/Booking affiliate click | $15–30 / booking conversion (3–5% of gross) | Week 2 | Infinite |
| Agent lead sales | $20–50 / qualified rental lead (prepaid credits) | Week 4 | Agent pool size |
| Eventbrite affiliate | 5–8% ticket commission | Week 4 | Ticket volume |
| Restaurant reservation affiliate | $1–3 / cover | Week 3 | High but low margin |
| Tour affiliate (Viator / GetYourGuide) | 5–10% tour price | Week 5 | Tourist volume |
| **Native rental commission (Stripe Connect)** | 12% of first-month + deposit | Phase 3 | Highest margin per txn |
| Landlord SaaS subscription | $29/mo basic, $99/mo manager | Phase 4 | Largest LTV |
| **"Featured listing" for landlords** | $20/week per slot in search | Phase 4 | Density-limited |
| **Concierge subscription** | $29/mo (AI contacts landlords, scam-checks, lease review) | Phase 4 | Premium filter |
| Scam-check API / white-label for rental platforms | $0.10/check, $500+/mo B2B tier | Year 2 | B2B moat |

### 10.2 Top 10 revenue-generation ideas (ranked by ROI × speed)

| # | Idea | Rev/event | Speed | Moat | Notes |
|---|---|---|---|---|---|
| 1 | Airbnb affiliate deep-links on outbound clicks | $15–30 | Day 1 | None (but free) | Primary Phase 2 |
| 2 | Agent credit packs ($500 = 25 leads at $20) | $20–50/lead | Week 3 | Agent relationships | Weekly ops work |
| 3 | "Moving-to-Medellín" pre-arrival package ($49) · curated rental shortlist + neighborhood tour + WhatsApp concierge for 2 weeks | $49/sale | Week 4 | Personalization | Bundles 3 verticals |
| 4 | **Rental scam-check API for Facebook/WhatsApp agents** ("Is this listing legit?" → $1/check) | $1/check | Month 2 | Your unique moat | B2B-friendly |
| 5 | **Landlord "listing freshness" SaaS** · $29/mo for auto-crossposting + weekly freshness check + inquiry auto-reply | $29/mo | Month 3 | Supply-side lock-in | High LTV |
| 6 | Eventbrite ticket affiliate with WhatsApp reminders | 5–8% | Month 2 | Retention | Retention driver |
| 7 | **Digital nomad "landing week" bundle** · 5-night rental + 3 restaurants + 2 events + 1 tour, Stripe-processed | 12% margin | Month 4 | Cross-vertical | Native bookings |
| 8 | Realtor.com-style "Verified by mdeai" badge licensed back to landlords | $49/listing/mo | Month 6 | Trust moat | Margin-rich |
| 9 | **B2B: sell scam-cleaned + trust-scored rental feed** to other proptechs in Colombia | $500–5K / mo per feed | Year 1 Q3 | Data asset | Moat monetization |
| 10 | Premium agent directory ($99/mo listing for local agents, users see "mdeai-verified agent" badge) | $99/mo | Month 4 | Review loop | Marketplace effect |

### 10.3 Revenue milestones (committed)

| Date | Target | Driver |
|---|---|---|
| End of Week 2 | First affiliate click + first email captured | Phase 2 |
| End of Week 4 | First paying agent ($500 prepaid) + 50 leads captured | Phase 2 |
| End of Month 2 | **$5K MRR** | Scam-check API + 5 paying agents + 100 affiliate conversions |
| End of Month 3 | **$15K MRR** | Native rentals + landlord SaaS v1 |
| End of Month 6 | **$50K MRR** | Landlord SaaS + WhatsApp lead capture + premium tiers |
| End of Year 1 | **$150K MRR** | Multi-city + B2B feed + subscription tiers |

---

## 11. User flows

### 11.1 Rental flow (core conversion)

```
Visitor lands on mdeai.co/
     → Welcome state + 4 quick-action chips
     → Types / clicks: "top rentals Laureles"
     → "Thought for Ns" reasoning trace (Rentals Concierge · Considering 43 matches…)
     → 5 inline ApartmentCards rendered in chat
     → Map pins sync on right
     → "Not a Good Fit" table (3 rejections with reasons)
     → "See all 5 on the map →" + refining question
     → User ♥ 2 listings + ➕ adds top pick to a new trip
     → Clicks a card → /apartments/:id detail
     → Clicks "View on Airbnb →" (affiliate tagged) → 💰 outbound click logged
          OR clicks "Contact landlord via mdeai" → lead captured → 💰 sold to agent
```

### 11.2 Upsell flow (cross-vertical)

```
User searches rentals → 5 cards on map
     → "What's Nearby" section renders 3 restaurants (🍽️ pins added)
     → "This Week" renders 2 events (🎉 pins)
     → "Must-Do" renders 2 attractions (📍 pins)
     → User adds 1 restaurant + 1 event to trip
     → Trip becomes shareable → partner/friend gets link → viral loop
     → Every outbound click (OpenTable, Eventbrite, Viator) earns affiliate 💰
```

### 11.3 Trip flow (retention)

```
User saves 3 rentals + 2 restaurants to a trip named "Medellín May"
     → Trip auto-generates an itinerary (Phase 3, Hermes)
     → Day-by-day view with map
     → Shareable link (public trip page, renders on /trips/:id)
     → Partner signs in via magic link to edit
     → mdeai sends weekly WhatsApp digest: "2 new rentals match your trip criteria"
     → User returns → 2x engagement → more conversions
```

### 11.4 Anon → authed flow (shipped)

```
Anon visitor sends 3 free messages
     → 4th attempt returns 402 ANON_LIMIT_EXCEEDED
     → EmailGateModal opens ("Check your inbox")
     → Supabase magic link → returns authenticated
     → Quota flips to 10/min (authenticated) → continues
     → Conversation re-fetched from DB (future Phase 3 work: resume anon history)
```

---

# ═══════════════════════════════════════════════════════════════
# 🧠  ADVANCED  (Phases 3–4)
# ═══════════════════════════════════════════════════════════════

## 12. Phase 3 — Intelligence layer (Month 2)

### 12.1 pgvector semantic search

**Motivation:** Filter-based search loses nuance. Users say *"quiet hipster 2BR walking distance to good coffee"* — keyword match fails.

**Design:**

```sql
-- Migration: enable + columns
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE public.apartments
  ADD COLUMN description_embedding vector(1536),
  ADD COLUMN last_embedded_at timestamptz;

CREATE INDEX idx_apartments_embedding
  ON public.apartments
  USING hnsw (description_embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Semantic search RPC
CREATE FUNCTION public.apartments_semantic_search(
  p_query_embedding vector(1536),
  p_neighborhood text DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_limit int DEFAULT 20,
  p_min_similarity float DEFAULT 0.7
) RETURNS TABLE (
  id uuid,
  title text,
  similarity float,
  price_monthly numeric,
  neighborhood text
) LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN QUERY
  SELECT a.id, a.title,
         1 - (a.description_embedding <=> p_query_embedding) AS similarity,
         a.price_monthly, a.neighborhood
  FROM public.apartments a
  WHERE a.status = 'active'
    AND a.description_embedding IS NOT NULL
    AND (p_neighborhood IS NULL OR a.neighborhood ILIKE p_neighborhood || '%')
    AND (p_max_price IS NULL OR a.price_monthly <= p_max_price)
    AND (1 - (a.description_embedding <=> p_query_embedding)) >= p_min_similarity
  ORDER BY a.description_embedding <=> p_query_embedding
  LIMIT p_limit;
END;
$$;
```

Embeddings generated by Gemini text-embedding-004 (768-dim) or OpenAI text-embedding-3-small (1536-dim). Populate on insert via trigger → edge function.

Same pattern repeated for `restaurants`, `events`, `attractions`.

### 12.2 Hermes-style ranker

A deterministic composite score wrapping the semantic search:

```
final_rank = 0.35 × semantic_similarity
           + 0.20 × budget_fit
           + 0.15 × neighborhood_fit
           + 0.10 × amenity_match
           + 0.10 × host_quality
           + 0.05 × freshness
           + 0.05 × deal_score  ← discount vs neighborhood median
           − 0.50 × scam_risk   ← hard penalty
```

Not a separate "agent" — it's an SQL function + a re-rank step in the `rentals_search` tool. Call it "Hermes" in the UI for sophistication; under the hood it's one RPC. This is the right engineering move (see §14.1 real Hermes vs theater).

### 12.3 Taste profile (personalization)

Track per-user preferences:

```sql
CREATE TABLE public.user_taste_vectors (
  user_id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  rental_preferences vector(1536),  -- moving average of saved rental embeddings
  restaurant_preferences vector(1536),
  updated_at timestamptz DEFAULT now()
);
```

Every ♥ save + ➕ add-to-trip blends the listing's embedding into the user's preference vector. Next search reorders results by `cosine(user_vector, listing_vector)` as an additional factor.

### 12.4 Conversation memory

Store compact turn summaries in `ai_context` table (already exists). After N turns, Hermes summarizes the conversation's context chips into a single JSONB blob. Next turn includes this summary in the system prompt instead of the full transcript. Reduces token cost by 60–70% for long conversations.

### 12.5 Timeline

| Week | Delivery |
|---|---|
| Mo 2 Wk 1 | pgvector extension + embedding column + HNSW index + backfill script |
| Mo 2 Wk 2 | Gemini embed-on-write trigger + `apartments_semantic_search` RPC |
| Mo 2 Wk 3 | Hermes composite ranker RPC + re-rank step in `rentals_search` tool |
| Mo 2 Wk 4 | User taste vectors + personalization re-rank + `ai_context` memory summarization |

---

## 13. Phase 4 — Automation layer (Month 3+)

### 13.1 OpenClaw — skills-based execution

OpenClaw becomes the home for **side-effect-heavy** work: scraping, outreach, booking. One skill per action.

| Skill | Trigger | What it does |
|---|---|---|
| `ingest-fazwaz` | pg_cron 6h | Firecrawl → normalize → dedupe → upsert into `apartments` |
| `ingest-metrocuadrado` | pg_cron 6h | Same as above, different target |
| `ingest-airbnb` | pg_cron 24h | Apify Actor → normalize with anti-dedup against other sources |
| `ingest-fb-groups` | pg_cron 12h | Apify Facebook Actor (account-risk acknowledged) + paste-in fallback |
| `scam-score` | On insert / daily re-score | Price z-score + photo pHash + Gemini text classifier |
| `outreach-landlord` | Lead captured | WhatsApp inquiry template via Infobip, logs to `outreach_log` |
| `lease-review` | User uploads PDF | Gemini clause extraction + risk scoring |
| `taste-vector-rebuild` | pg_cron weekly | Rebuild user preferences from recent saves |
| `conversation-summarizer` | After N turns | Compress old turns into `ai_context` summaries |

Each skill runs as a separate edge function so budgets + audit are granular.

### 13.2 Paperclip — management layer

Paperclip (57k-star open-source, MIT, Node + React UI) runs on a `$8.99/mo` Hostinger KVM 2 as a single long-running process. Responsibilities:

| Responsibility | How |
|---|---|
| **Daily budget caps per skill** | `ingest-airbnb: $3/day`, `ingest-fb: $2/day`, `outreach: $5/day` |
| **Approval gates** | Outbound messages + lease signings + native booking payments require human tap |
| **Heartbeat monitoring** | Each skill emits a heartbeat; Paperclip alerts Slack if stale |
| **Audit trail** | Every skill run logs to `agent_audit_log` |
| **Error recovery** | Failed skill run triggers a retry with backoff, then escalates |
| **Org chart** | Defines CEO → CTO → Skill-Owner hierarchy for approvals |

Paperclip is **not required for MVP**. It earns its keep only when 5+ autonomous processes are running concurrently. Before that, pg_cron + plain edge functions are enough.

### 13.3 Hermes — reasoning + memory (true integration, not theater)

When to promote the "Hermes-style ranker" from a SQL function to an actual Hermes installation:

- When we need **agent-level reflection** (did the last ranking produce good conversions? Learn from it)
- When we need **long-running research tasks** (e.g. "scout every Medellín building on Instagram with tagged rental signs")
- When we need **tool-call composition** beyond what Gemini's native function-calling handles

Until then: keep it in-function. Hermes the framework is overkill for a CRUD ranker.

### 13.4 WhatsApp channel (Phase 4 start)

```
User's WhatsApp message
  → Infobip webhook → edge fn `whatsapp-webhook`
  → Idempotency check (external_id UNIQUE)
  → Reuse `chat-engine` core (same as web)
  → Reply via Infobip API
  → Log inbound + outbound to `whatsapp_messages`
```

Tables already exist: `whatsapp_conversations`, `whatsapp_messages`. Infobip credentials in Supabase secrets. ~3 days of work once Phase 2 is done.

---

## 14. Phase 5 — Scale + B2B (Q3+)

| Initiative | Unlock |
|---|---|
| Landlord self-service SaaS | Supply-side lock-in; $29–99/mo recurring |
| Bogotá + Cartagena expansion | 3x TAM; reuse everything except neighborhood seeds |
| Scam-check API (public) | Moat monetization; $0.10/check, $500+/mo B2B tiers |
| Verified-agent marketplace | Two-sided; charge agents $99/mo for featured status |
| Lease review + e-signing (DocuSign integration) | Take a fee on every signed lease |
| Concierge subscription ($29/mo) | Premium filter; AI contacts landlords, scam-checks, lease review on your behalf |
| Investor portfolio tools | Analytics + alerts on emerging neighborhoods |

---

# ═══════════════════════════════════════════════════════════════
# 🗄  DATABASE + GROWTH + RISKS
# ═══════════════════════════════════════════════════════════════

## 15. Database design

### 15.1 Tables already in prod (see migrations)

`profiles · apartments · rentals · conversations · messages · leads · showings · rental_applications · property_verifications · payments · saved_places · trips · trip_items · rate_limit_hits · ai_runs · ai_context · neighborhoods · idempotency_keys · agent_audit_log · notifications · whatsapp_conversations · whatsapp_messages · bookings · events · restaurants · tourist_destinations · car_rentals · collections`

### 15.2 New tables (Phase 2–4)

| Table | Phase | Purpose |
|---|---|---|
| `apartment_sources` | Phase 3 | Each source's view of a listing (cross-source dedup) |
| `outbound_clicks` | Phase 2 | Affiliate attribution + conversion tracking |
| `agent_credits` | Phase 2 | Agent prepaid balance for lead sales |
| `agent_lead_deliveries` | Phase 2 | Which leads went to which agent + billing |
| `user_taste_vectors` | Phase 3 | pgvector preference per user |
| `landlord_subscriptions` | Phase 4 | Stripe subscription for landlord SaaS |
| `scam_signals` | Phase 3 | Per-listing per-signal breakdown (audit trail for flags) |
| `agent_skill_runs` | Phase 4 | One row per skill execution — OpenClaw audit |

### 15.3 Critical indexes

```sql
-- Shipped
CREATE INDEX idx_apartments_neighborhood     ON apartments (neighborhood);
CREATE INDEX idx_apartments_price_monthly    ON apartments (price_monthly);
CREATE INDEX idx_apartments_host_id          ON apartments (host_id);
CREATE UNIQUE INDEX idx_showings_lead_apt_day
  ON showings(lead_id, apartment_id, ((scheduled_at AT TIME ZONE 'America/Bogota')::date));

-- Phase 3
CREATE INDEX idx_apartments_embedding
  ON apartments USING hnsw (description_embedding vector_cosine_ops);
CREATE INDEX idx_apartments_location
  ON apartments USING gist (location);
CREATE INDEX idx_outbound_clicks_user_ts
  ON outbound_clicks (user_id, created_at DESC);
CREATE INDEX idx_leads_agent_status
  ON leads (assigned_agent_id, status) WHERE status != 'converted';

-- Phase 4
CREATE INDEX idx_apartment_sources_canonical
  ON apartment_sources (canonical_apartment_id);
CREATE INDEX idx_agent_skill_runs_skill_ts
  ON agent_skill_runs (skill_name, created_at DESC);
```

### 15.4 RLS principles (already enforced)

- Every public-schema table has RLS enabled
- `SELECT`: public for listings, user-scoped for personal data
- `INSERT/UPDATE/DELETE`: always require `(select auth.uid())` match
- Service role writes limited to edge functions (logs, webhooks, payouts)
- Admin writes behind `is_admin()` function check

---

## 16. Growth channels

| Channel | Tactic | Phase | Metric |
|---|---|---|---|
| SEO | 100 neighborhood+bedroom pages (`/apartments?neighborhood=Laureles&bedrooms=2`) rendered SSR-like via Vercel ISR | Phase 2 | Organic traffic |
| Content | Weekly "Medellín neighborhood deep-dive" posts authored by chat + human polish | Phase 3 | Backlinks |
| Facebook groups | Weekly curated "verified rentals of the week" post in 3 expat groups (accounts we own; no scraping) | Phase 2 | Direct traffic |
| WhatsApp | Shareable trip links + concierge number in expat group bios | Phase 4 | Organic shares |
| TikTok / IG | Short "scam-check this listing" reels — AI flags, we verify | Phase 4 | Brand |
| Agent partnerships | 5 local real-estate agents on prepaid lead credits | Phase 2 | Conversion |
| Landlord outreach | Direct WhatsApp to top 50 Laureles + Poblado landlords; free first month | Phase 3 | Supply |
| Email drip | "New rentals matching your last search" weekly | Phase 3 | Retention |
| Referral | $20 credit for each friend who signs up + uses chat | Phase 4 | K-factor |

---

## 17. Risks + mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| **Apify Airbnb Actor breaks when Airbnb ships UI change** | High | Fallback to affiliate deep-links; queue fix in OpenClaw; never depend on scraped Airbnb for booking flow |
| **Facebook account banned for scraping** | High | Paste-in model as default; account-scrape only for curated group-op user; residential proxy rotation |
| **Supabase Management API prepared-protocol bug** | Med | Already worked around via MCP execute_sql; document in plan |
| **Gemini rate/cost spike from anon flood** | Med | Durable rate limiter shipped; anon 3/24h shipped; further: add CAPTCHA on email gate |
| **Scam detection false positives** | Med | Always render explanation, let user override; log to `scam_signals` for audit |
| **Stripe Connect onboarding friction for landlords** | Med | Launch on affiliate-only first; add Connect in Phase 3 |
| **WhatsApp Meta template review takes 2 weeks** | Low | Submit all templates (welcome, showing reminder, lead handoff, scam alert) in Week 1 of Phase 4 |
| **Colombian legal: Habeas Data on user PII** | Med | ISO-compliant data export; PII encrypted at rest; auth-only PII access |
| **Vercel bundle grows past 2 MB** | Low | Route-based code splitting already enabled by Vite; monitor `bundle-analyzer` |
| **pg_cron + Supabase Pro tier required for scheduled jobs** | Low | Free tier works for MVP; upgrade when cron jobs exceed free quota |
| **Hermes / Paperclip / OpenClaw over-engineering** | High | Tool-registry pattern is sufficient through Month 2. Enforce: don't install until 3+ autonomous cron processes exist |

---

## 18. Analytics schema (PostHog events)

Minimum viable event set:

```
session_started            · anon_session_id · landing_url · referrer
chat_message_sent          · message_length · tab · has_context_chips
tool_called                · tool_name · cached · latency_ms
cards_rendered             · vertical · count
card_clicked               · vertical · listing_id · card_position
card_saved                 · vertical · listing_id
added_to_trip              · listing_id · trip_id
trip_created               · item_count
trip_shared                · method (link/whatsapp/email)
outbound_click             · source_host · listing_id · affiliate_tagged
lead_captured              · source · email · phone · neighborhood
agent_lead_delivered       · agent_id · lead_id · price
anon_limit_hit             · messages_used
email_gate_shown           · retry_after_seconds
magic_link_sent            · email_domain (hashed)
user_signed_in             · method · returning
```

Every event carries `user_id || anon_session_id`, `page`, `conversation_id`.

---

## 19. Decision record

### Locked in (from conversation / PRs)

| Decision | Choice |
|---|---|
| Primary UX | Chat at `/` (not floating widget) |
| Focus vertical | Rentals (MVP) |
| Architecture | Tool-registry pattern; agents are theater via SSE phase events |
| Multi-vertical | Cross-sell restaurants / events / attractions on rental success |
| Anon gate | 3 messages per 24h, email magic-link after |
| Rate limiter | Durable Postgres `check_rate_limit` RPC |
| Map provider | Google Maps (swap in when key configured) |
| Languages | Auto-detect EN/ES on first message |
| SEO | Keep `/apartments`, `/events`, `/restaurants` static pages; CTA → chat |
| Scrapers | Firecrawl for portals; Apify for Airbnb + Facebook; direct APIs where available |
| Intelligence | pgvector + Hermes-style SQL ranker (not Hermes framework) for Phase 3 |
| Automation | OpenClaw skills only when 3+ cron processes exist |
| Governance | Paperclip only at $10K+ MRR or when budget violations surface |

### Open (need call)

| Decision | Options | Default |
|---|---|---|
| Agent persona names | Rentals Concierge / Food Scout / Events Scout / Tours Guide | as listed |
| Landlord SaaS tier names | Starter / Pro / Enterprise | keep |
| Referral credit | $10 / $20 / $50 | $20 |
| Session retention | 30d / 90d / forever | forever |
| Mobile map | Collapsible / full-modal | collapsible toggle |

---

## 20. Final recommendation (founder's eye)

> **Ship Week 2 completely before anything in section 12+. One phase at a time.**

Priority stack, top-down:

1. **Week 2 SEO handoff + context chips + affiliate attribution** — this converts what we built into dollars
2. **Phase 2 (restaurants, events, attractions)** — 3× engagement at linear effort
3. **Month 2 pgvector + Hermes-style ranker** — finally deserves the "AI" brand
4. **First paying agent** ($500 credit pack) — proves the supply-side works
5. **Landlord SaaS v1** (Phase 4) — recurring revenue, highest LTV
6. **Multi-source scraping** (Phase 4) — only after paying agents exist
7. **WhatsApp** — after scraping proves the data layer
8. **Paperclip / OpenClaw frameworks** — only when cron processes demand governance
9. **Everything else** (B2B, multi-city, e-signing, DocuSign) — post-$50K MRR

### Anti-recommendations (do NOT do)

- ❌ Install Hermes/Paperclip/OpenClaw frameworks before you have 3+ autonomous processes
- ❌ Build native Stripe Connect bookings before affiliate revenue proves the funnel
- ❌ Launch multi-city before Medellín hits $50K MRR
- ❌ Add coffee/cars verticals — distracts from rentals
- ❌ Scrape Airbnb directly — use affiliate deep-links (TOS-safe)
- ❌ Buy residential proxies before you have a sustained scraping need
- ❌ Write planning docs beyond this one until PM capacity exists

---

## Appendix A — 12-month quarterly roadmap

| Quarter | Must-ship | Target MRR |
|---|---|---|
| **Q2 2026** | Week 1 chat ✅ → Week 2 hooks → Phase 2 three verticals → 5 paying agents | $5K |
| **Q3 2026** | pgvector + ranker + Hermes-style personalization + first landlord SaaS customer | $15K |
| **Q4 2026** | OpenClaw scraping skills + Paperclip governance + WhatsApp channel | $50K |
| **Q1 2027** | Multi-city (Bogotá) + scam-check API + verified-agent marketplace | $150K |

## Appendix B — File-layout target (end of Phase 3)

```
src/
  pages/
    Home.tsx                              · chat canvas at /
    Apartments.tsx  Restaurants.tsx  Events.tsx  Attractions.tsx   · SEO
    Trips.tsx  TripDetail.tsx               · shareable trips
    Admin*.tsx                               · internal ops
  components/
    chat/
      ChatCanvas · ChatInput · ChatMessageList
      ChatMap · ChatReasoningTrace · ChatContextChips · ChatLeftNav
      EmailGateModal · NotAFitTable
      embedded/
        RentalCardInline · RestaurantCardInline · EventCardInline · AttractionCardInline
        EmbeddedListings  (polymorphic dispatcher)
    listings/, map/, trips/ ...
  context/
    MapContext.tsx  TripContext.tsx  ThreePanelContext.tsx
  hooks/
    useChat · useAnonSession · useChatActions · useMapContext · useTaste
  lib/
    affiliate.ts  seo.ts  postHog.ts

supabase/
  functions/
    _shared/
      tool-response.ts · tool-registry.ts · ai-runs.ts · gemini.ts
      rate-limit.ts · supabase-clients.ts · http.ts · json.ts · cron.ts
      firecrawl.ts · apify.ts · google-places.ts · eventbrite.ts
    ai-chat/ ai-router/ rentals/ p1-crm/
    search-nearby/ search-events/ search-attractions/
    ingest-fazwaz/ ingest-metrocuadrado/ ingest-airbnb/ ingest-fb-groups/
    normalize-dedupe/ scam-score/ embed/
    whatsapp-webhook/ payment-webhook/
  migrations/
    [shipped migrations] + [phased new ones per §15.2]
```

## Appendix C — One-paragraph pitch

mdeai is the AI concierge for moving to Medellín. Instead of opening seven tabs — Airbnb, FazWaz, Metrocuadrado, Facebook groups, Google Maps, Eventbrite, TripAdvisor — users open one chat. They describe what they want in their own words; within seconds they see verified rental cards with scam warnings, nearby restaurants, events this week, and must-do attractions, all on a synced map, with a shareable trip. Renters save hours and get better matches than any marketplace alone. Agents and landlords get qualified leads they'd otherwise pay a marketplace 15–20% to reach. We take a cut of every outbound click, every lead, and eventually every booking — and we do it in Spanish or English, on web or WhatsApp, for the one market our competitors can't serve as well: medium-term stays in Medellín.

---

**Sources referenced:**
- [Apify Airbnb Scraper pricing](https://apify.com/automation-lab/airbnb-listing) — $1.25 / 1K results · community-maintained risk
- [How to Scrape Airbnb Data — Apify blog (2025)](https://blog.apify.com/how-to-scrape-airbnb/)
- [Best Airbnb Scrapers 2026 — Bright Data](https://brightdata.com/blog/web-data/best-airbnb-scrapers)
- [Apify Facebook Groups Scraper](https://apify.com/apify/facebook-groups-scraper)
- [Facebook Groups scraping guide (DEV)](https://dev.to/barakplasma/how-to-scrape-facebook-groups-for-apartment-rentals-5oh)
- `tasks/CHAT-CENTRAL-PLAN.md` (v1, 2026-04-23) — Week 1 daily execution plan
- `prd.md` (v3, 2026-04-04) — superseded

*End of Master PRD v4. Update this file when quarter milestones land or advanced phases begin.*
