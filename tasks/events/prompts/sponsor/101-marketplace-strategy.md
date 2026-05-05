---
task_id: 101-marketplace-strategy
title: Sponsorship marketplace — competitive analysis + mdeai build plan (Medellín/Colombia)
phase: PHASE-2-SPONSOR-GROWTH
priority: P0
status: Strategy
researched: 2026-05-04
sources: 18 platforms scraped, 4 web searches, primary data from SponsorFlo/SponsorUnited/Anvara/Sponsoo/SponsorPitch
---

# 101 — mdeai Sponsorship Marketplace: Deep Research + Build Plan

> **Bottom line up front.** Zero dedicated sponsorship marketplace platforms exist for Latin America. Colombia's events market is growing at 9.9% CAGR. No platform closes the full loop: marketplace discovery + AI management + payment + ROI reporting in one product. mdeai can own this market in Medellín first, then expand to Bogotá and LATAM.

---

## A. Platform comparison table

| Platform | Type | Business model | AI features | Payment | Colombia-ready | Entry price |
|---|---|---|---|---|---|---|
| **Anvara** | Marketplace | Unknown (listing + access fee) | Audience data matching | No | No (US only) | Unknown |
| **SponsorPitch** | Data + CRM + marketplace | Subscription $39–$334/user/mo | None | No | No | $0 (free tier) |
| **SponsorFlo** | Management SaaS (supply-side) | Subscription $299–$799/mo | Most comprehensive in market | Stripe | No | $299/mo |
| **Sponsoo** | Marketplace (sports) | 20% commission on closed deals | None | Yes (on deal close) | No (Europe-heavy) | Free (20% cut) |
| **SponsorMyEvent** | Two-sided marketplace | Unknown (freemium) | Unknown | No | No | Unknown |
| **Brella** | Event platform + sponsor tools | Enterprise custom | AI scheduling/matchmaking | No | No | Enterprise |
| **SponsorUnited** | Data intelligence | Enterprise SaaS ($K–$100K+/yr) | AI analyst + benchmarking | No | No | Enterprise |
| **OpenSponsorship** | Marketplace (athletes) | Subscription $499+/mo | Minimal | No | No | $499/mo |
| **InstantSponsor** | Blockchain marketplace | Token-based | Algorithm matching | Crypto | No | $5,000 brand min |
| **Adsly** | Marketplace (creators) | Subscription $0–$15/mo + 0% commission | None | No | No | Free |
| **Covent** | Managed events service | Fixed $3k–$15k/event | None | Yes | No | $3,000/event |
| **Grip** | Event platform + sponsorship | Enterprise custom | AI meeting scheduling | No | No | Enterprise |
| **mdeai (planned)** | **Full-stack marketplace** | **Hybrid: 15% commission + freemium SaaS** | **5 Gemini AI fns + concierge chat** | **Stripe** | **Yes (Medellín-first)** | **Free to list** |

### Five critical market gaps mdeai can exploit

1. **No LATAM competitor.** Zero dedicated sponsorship marketplace platforms operate in Colombia, Mexico, or Latin America. mdeai moves first.
2. **No full-lifecycle platform below enterprise.** SponsorFlo has AI management but no discovery marketplace. Anvara has discovery but no management or payment. mdeai builds both.
3. **No WhatsApp-native outreach.** All platforms use email-only. Colombia is a WhatsApp-first country.
4. **No real-time ROI reporting tied to actual ticket/event sales.** mdeai can do this because it already has the booking/event data in the same DB.
5. **No platform charges commission only** (risk-aligned) below the enterprise tier. Sponsoo does 20% but is Europe-only and sports-only. mdeai can undercut on commission (15%) for a comparable value prop.

---

## B. Core feature checklist

### Must-have for MVP (week 1–4)

| Feature | Status in mdeai | Urgency |
|---|---|---|
| Organizer event listing | ✅ Events table exists | — |
| Sponsorship package builder (Bronze/Silver/Gold/Platinum) | ✅ Schema in 045 | — |
| Sponsor apply wizard (4-step) | ✅ Task 046 done | — |
| Admin approval queue | ✅ Task 047 done | — |
| Stripe payment checkout | ✅ Task 048 (Stripe secrets needed) | P0 |
| Sponsor dashboard (ROI tiles) | ❌ Task 052 not built | P0 |
| Asset management (logo, video, copy upload) | ✅ Storage + assets table | — |
| Impression + click tracking | ✅ Tasks 049–051 done | — |
| Contract generation + e-sign | ✅ Tasks 055–057 done | — |
| Dispute / cancellation UI | ✅ Task 058 done | — |
| **Brand discovery browse page** | ❌ NOT BUILT | P1 |
| **Organizer public event profile** | ❌ NOT BUILT | P1 |
| **Sponsor public brand profile** | ❌ NOT BUILT | P1 |
| **In-platform messaging** | ❌ NOT BUILT | P1 |
| **Proposal flow (sponsor → organizer)** | ❌ NOT BUILT | P1 |

### Must-have for marketplace (week 5–8)

| Feature | Notes |
|---|---|
| **Discover page** (`/marketplace/discover`) | Browse events by category, location, audience size, available packages |
| **Sponsor brand profile** (`/marketplace/brands/:orgId`) | Logo, industry, past campaigns, verified budget range |
| **Event sponsorship profile** (`/marketplace/events/:eventId`) | Audience demographics, past sponsors, available packages, pricing |
| **Two-way messaging** | Sponsor initiates contact with organizer; organizer responds; in-app inbox |
| **Proposal builder** | Sponsor selects package → system generates proposal PDF for organizer review |
| **Package configurator** | Organizer creates custom tiers; system shows "comparable events charge X" benchmark |

---

## C. Advanced and AI feature checklist

### Advanced features (week 9–16)

| Feature | Reference | Priority |
|---|---|---|
| Audience match score (brand→event) | task 054 `sponsor-audience-match` | P0 |
| AI proposal generator | task 054 `sponsor-creative-gen` | P0 |
| AI ROI insights (daily) | task 054 `sponsor-roi-explain` | P0 |
| AI asset moderation | task 054 `sponsor-moderate` | P0 |
| AI campaign optimizer | task 054 `sponsor-optimize` | P1 |
| Dynamic pricing recommendations | Benchmark vs. comparable events in DB | P1 |
| Deliverables checklist (per contract) | `agreed_deliverables` JSONB field | P1 |
| Post-campaign report (PDF) | `react-pdf` from ROI data + Gemini summary | P1 |
| Renewal prediction (30d before expiry) | Hermes scoring, cron | P2 |
| Lead scoring for inbound sponsors | Hermes, from chat qualification + apply data | P2 |
| Sponsor media asset library | Per-org asset gallery with performance per asset | P2 |
| Activation plan builder | UI for mapping deliverables to calendar | P2 |
| Event-to-sponsor recommendation engine | "Events like yours attracted these brands" | P2 |

### AI features detail (all using Gemini via `_shared/gemini.ts`)

| AI fn | Model | Input | Output | Status |
|---|---|---|---|---|
| `sponsor-moderate` | Flash | Asset URL + kind | `clean/flagged/rejected` + flags | 📋 task 054 |
| `sponsor-creative-gen` | Pro | Brief + brand voice | 5 captions ES+EN + IG prompts + push copy | 📋 task 054 |
| `sponsor-roi-explain` | Flash | 7 days roi_daily | 3-sentence insight + 1 recommendation + action | 📋 task 054 |
| `sponsor-optimize` | Pro | 30d roi_daily + placements | Ranked recommendations (proposals only) | 📋 task 054 |
| `sponsor-audience-match` | Pro + googleSearch | Brand description + keywords | Top 5 events + audience segments + reach estimate | 📋 task 054 |
| `sponsor-concierge` | Flash (via ai-chat) | Chat message | Sequential qualification → recommendation → CTA | 📋 task 059 |
| `sponsor-price-recommend` | Flash | Event size + category + past deals | Suggested tier prices with market benchmark | 🆕 new task |
| `sponsor-proposal-gen` | Pro | Event profile + brand profile + package | Full proposal PDF content (bilingual) | 🆕 new task |
| `sponsor-renewal-predict` | Flash | Contract end date + ROI + engagement | Renewal probability + suggested approach | 🆕 new task |

---

## D. Real-world use cases for Medellín events

### 1. Beauty pageant — "Reinado Antioqueño 2026"

**Event profile:** 500 contestants, 3 rounds over 2 months, 10,000 live attendees at finals, 100k+ online votes.

**Sponsor targets:** Leonisa (lingerie/fashion), Yanbal (cosmetics), Dove, L'Oréal Colombia, Claro (telecom), Bancolombia.

**Packages:**
- Bronze ($500): Logo on voting page + 1 push notification mention
- Silver ($2,000): + Contestant profile badge ("¡Apoyada por Yanbal!") + 5 WA broadcasts
- Gold ($7,500): + Title sponsor of 1 round + booth at semifinals + AI creative gen
- Platinum ($20,000): "Reinado Antioqueño presentado por Leonisa" — full naming rights

**Activation mechanics:** `contestant_sponsor` surface type (existing schema). Each contestant has sponsor badge on profile. Every vote page shows sponsor logo.

**ROI hook:** "Yanbal's branded contestant page saw 23,400 impressions. 4,200 unique users clicked through to Yanbal.com. 12 purchased within 24h via UTM tracking."

**WhatsApp angle:** Leaderboard screenshot sent every 4h via OpenClaw has sponsor watermark bottom-right. 50,000 subscribers see it 6× per day = 300,000 branded impressions/day.

---

### 2. Fashion event — "Medellín Fashion Week 2026"

**Event profile:** 200 designers, 3-day runway shows, 5,000 ticketed attendees, 2M social impressions.

**Sponsor targets:** Leonisa, Punto Blanco, Arket (Colombian line), Banco de Bogotá (checkout partner), Renault (lifestyle mobility).

**Packages:**
- Gold ($8,000): Category sponsor "Best Emerging Designer powered by Banco de Bogotá"
- Platinum ($25,000): Title sponsor + official car fleet (Renault) + runway activation

**AI angle:** `sponsor-creative-gen` produces bilingual fashion copy for each sponsor: "Estilo que transforma. Moda que empodera. Presentado por Leonisa." — 5 caption variants for IG + TikTok.

**ROI tracking:** Ticket UTMs (`?ref=leonisa-banner`) + post-show PDF report from `sponsor-roi-explain`.

---

### 3. Restaurant week — "Sabores de Medellín 2026"

**Event profile:** 80 participating restaurants, 2-week event, 30,000 diners using the mdeai discovery feature.

**Sponsor targets:** Postobón (beverage), Grupo Nutresa (food brands), Bavaria (beer), Mastercard (checkout rewards), Rappi (delivery).

**Packages:**
- Bronze ($500): Logo in restaurant discovery page + 2 push notifs ("Sabores de Medellín, powered by Postobón")
- Silver ($2,500): + Featured restaurant carousel on mdeai homepage + social post series
- Gold ($8,000): + Category sponsor "Best Bandeja Paisa powered by Nutresa" + physical signage kit for 20 participating restaurants

**Unique activation:** Rappi sponsors the "Order + Vote" feature — users who order via Rappi get 2x votes in the Best Restaurant ranking. Real transaction data = verified attribution.

---

### 4. Music / nightlife — "Circuito Electrónico Medellín"

**Event profile:** 12 club nights over 3 months, 500–2,000 attendees per night, 18–35 demographic.

**Sponsor targets:** Águila beer, Club Colombia, Red Bull, Claro (co-branded phone charging stations), Spotify (playlist sponsorship).

**Packages:**
- Bronze ($500): Logo on event listing + WA broadcast mention per night
- Silver ($1,500 for 3 nights): + Door staff badge + physical signage
- Gold ($5,000 for circuit): + "Etapa powered by Red Bull" category + sponsored Instagram Story for each night

**WhatsApp activation:** "Powered by Red Bull" watermark on every nightclub lineup image (OpenClaw sends 11pm, hits 25k subscribers at peak interest time).

---

### 5. Sports tournament — "Copa Fútbol Barrial Medellín"

**Event profile:** 64 teams, 8-week grassroots tournament, 3,000 weekly spectators, hyper-local community audience.

**Sponsor targets:** Colanta (dairy), Auteco (motorcycles), local construction companies, Aseguradora Solidaria.

**Packages:**
- Bronze ($300): "Equipo auspiciado por [empresa]" badge on team profile
- Silver ($1,500): + Banner at main field + photo in weekly WhatsApp leaderboard
- Gold ($4,000): Category sponsor "Goleador del torneo powered by Colanta" + trophy naming

**Insight:** Price points are lower than tier events but volume is much higher. 64 teams × $500 avg = $32,000 potential per tournament. Community brands don't need Platinum — they need authentic local presence.

---

### 6. Influencer event — "Creator Day Medellín"

**Event profile:** 500-person creator gathering, 50 invited nano/micro influencers, brand activation booths, 48h content creation sprint.

**Sponsor targets:** Adobe, Ring (Amazon), Samsung, Listerine (lifestyle), Bancolombia digital (fintech).

**Packages:**
- Silver ($2,000): Branded photo activation booth (all UGC tagged with brand)
- Gold ($7,500): Official tech sponsor + product gifting for 50 creators + 1 sponsored challenge
- Platinum ($20,000): Naming rights + dedicated creator briefing session + UGC rights licensing

**AI angle:** `sponsor-creative-gen` generates the challenge brief + prize copy for each creator in their voice. Saves sponsor 3 days of agency work.

---

### 7. Business conference — "Startup Grind Medellín 2026"

**Event profile:** 800 attendees, C-suite + tech founders, 2-day conference, $2M+ collective annual revenue in room.

**Sponsor targets:** Grupo Sura (financial services), Bancolombia ÁgilCo, Microsoft Colombia, AWS, Telefónica/Movistar, Legis.

**Packages:**
- Silver ($3,000): Logo on event app + 1 speaking slot in sponsor track
- Gold ($10,000): Category sponsor "Startup of the Year powered by Bancolombia" + booth + 500 contacts shared
- Platinum ($30,000): Title sponsor + keynote intro + VIP dinner host + lead capture integration

**Attribution hook:** Badge scans at sponsor booth → instant lead to Salesforce/HubSpot via `sponsor-audience-match` output (pre-event audience profile shared with sponsor 2 weeks before).

---

## E. Recommended mdeai sponsorship marketplace MVP

### What to build (the minimum viable marketplace)

**Current state:** mdeai has a one-sided system. Sponsors apply to mdeai (the organizer). There is no marketplace — no brand discovery, no event browsing by sponsors, no two-way matching.

**MVP upgrade:** Add the discovery layer that turns a single-org tool into a two-sided marketplace.

### Six new pages required

```
/marketplace                      → Landing: "Find your next sponsorship" + "List your event"
/marketplace/events               → Browse events: filter by category, city, budget, audience size
/marketplace/events/:eventId      → Event sponsorship profile (audience, packages, past sponsors, apply)
/marketplace/brands               → Browse active sponsors (for organizers to research)
/marketplace/brands/:orgId        → Brand profile (industry, past campaigns, verified budget tier)
/marketplace/inbox                → Two-way messaging between sponsors and organizers
```

### Five new DB tables required

```sql
-- Public-facing event sponsorship profile (separate from internal sponsor.applications)
CREATE TABLE sponsor.event_profiles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  organizer_id    uuid NOT NULL REFERENCES auth.users(id),
  tagline         text,                        -- "Medellín's biggest beauty pageant — 50k votes/week"
  audience_size   int,                         -- expected attendance
  demographics    jsonb,                       -- { age_range, gender_split, income_bracket, interests[] }
  past_sponsors   text[],                      -- brand names (text, not FK — may be external orgs)
  min_package_usd int NOT NULL DEFAULT 500,
  max_package_usd int,
  is_published    bool NOT NULL DEFAULT false,
  published_at    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Public brand profile for the sponsor side of the marketplace
CREATE TABLE sponsor.brand_profiles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES sponsor.organizations(id) ON DELETE CASCADE,
  tagline         text,
  categories      text[],                      -- event categories they sponsor
  min_deal_usd    int,
  max_deal_usd    int,
  past_events     text[],                      -- event names (text)
  is_published    bool NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- In-platform messaging between sponsors and organizers
CREATE TABLE sponsor.messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id       uuid NOT NULL,               -- groups messages in a conversation
  event_profile_id uuid REFERENCES sponsor.event_profiles(id),
  sender_id       uuid NOT NULL REFERENCES auth.users(id),
  receiver_id     uuid NOT NULL REFERENCES auth.users(id),
  body            text NOT NULL,
  is_read         bool NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON sponsor.messages (thread_id, created_at);
CREATE INDEX ON sponsor.messages (receiver_id, is_read);

-- Sponsor interest / proposal (before formal application)
CREATE TABLE sponsor.proposals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_profile_id uuid NOT NULL REFERENCES sponsor.event_profiles(id),
  organization_id  uuid NOT NULL REFERENCES sponsor.organizations(id),
  proposed_tier    text,
  proposed_amount_usd int,
  message         text,
  status          text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','declined','converted')),
  converted_application_id uuid REFERENCES sponsor.applications(id),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Marketplace search/filter metadata (denormalized for fast queries)
CREATE TABLE sponsor.marketplace_index (
  event_profile_id uuid PRIMARY KEY REFERENCES sponsor.event_profiles(id) ON DELETE CASCADE,
  city            text NOT NULL DEFAULT 'Medellín',
  country         text NOT NULL DEFAULT 'CO',
  category        text,                        -- 'beauty','fashion','music','food','sports','business','influencer'
  audience_min    int,
  audience_max    int,
  package_min_usd int,
  package_max_usd int,
  next_event_date date,
  search_vector   tsvector,                    -- for full-text search
  embedding       vector(1536),                -- for semantic matching via pgvector
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON sponsor.marketplace_index USING GIN (search_vector);
CREATE INDEX ON sponsor.marketplace_index USING ivfflat (embedding vector_cosine_ops);
```

### Three new edge functions required

```
POST /sponsor-event-profile-upsert   Organizer creates/updates their marketplace listing
POST /sponsor-proposal-create        Sponsor sends a proposal to an organizer
POST /sponsor-message-send           In-platform messaging (webhook to WhatsApp via OpenClaw)
```

### MVP acceptance criteria

- Organizer can publish their event on `/marketplace/events` in < 10 minutes
- Sponsor can browse events, filter by category + budget, click through to event profile
- Sponsor can send a proposal with package selection and message
- Organizer receives proposal in inbox + WhatsApp notification
- Deal flow: proposal → accept → auto-creates `sponsor.applications` → proceeds to existing checkout flow

---

## F. 30-day launch plan

### Week 1 — Unblock existing system

| Day | Task | Owner |
|---|---|---|
| 1 | Set Stripe secrets in Supabase dashboard | Admin |
| 1–2 | Task 052: Sponsor ROI dashboard `/sponsor/dashboard/:id` | Dev |
| 3–4 | Task 054 A: `sponsor-moderate` + `sponsor-roi-explain` edge fns | Dev |
| 5 | Task 054 B: `sponsor-creative-gen` edge fn | Dev |

### Week 2 — Complete AI + chat layer

| Day | Task |
|---|---|
| 6–7 | Task 054 C: `sponsor-audience-match` + `sponsor-optimize` edge fns |
| 8 | Task 059: Add 4 sponsor intents to `ai-router/index.ts` |
| 9 | Task 059: Add `sponsor_concierge` agent to `ai-chat/index.ts` (3 tools, qualification flow) |
| 10 | Test full chat → qualify → apply flow end-to-end |

### Week 3 — Marketplace discovery layer

| Day | Task |
|---|---|
| 11 | DB migration: 5 new marketplace tables |
| 12 | `/marketplace` landing page + `/marketplace/events` browse page |
| 13 | `/marketplace/events/:eventId` event sponsorship profile page |
| 14 | `sponsor-event-profile-upsert` edge fn; organizer can publish their event |
| 15 | Internal test: publish 3 real Medellín events on the marketplace |

### Week 4 — Close the loop + first deals

| Day | Task |
|---|---|
| 16 | `/marketplace/brands/:orgId` brand profile page |
| 17 | `/marketplace/inbox` messaging UI + `sponsor-message-send` edge fn |
| 18 | `sponsor-proposal-create` edge fn + proposal UI |
| 19 | WhatsApp notification to organizer when proposal received (OpenClaw) |
| 20 | Manual outreach to 10 brands from Part 8 of task 100 (WhatsApp + email) |
| 21–30 | Follow-up cadence; target: 3 proposals accepted, 1 deal closed, $500–2,000 first payment |

---

## G. 90-day product roadmap

### Month 1 (Days 1–30): Foundation + first deals

- ✅ All tasks from 30-day plan above
- Target: 5 events published on marketplace, 3 proposals, 1 closed deal
- Revenue target: $500–2,000 from first sponsor

### Month 2 (Days 31–60): Scale discovery + AI

| Feature | Details |
|---|---|
| Semantic search on `/marketplace/events` | pgvector search: "brand that sells to young women in Medellín" → shows beauty pageants + fashion events |
| `sponsor-price-recommend` edge fn | Flash fn: "Events like yours in Medellín charge $X–$Y for Silver" |
| `sponsor-proposal-gen` edge fn | Pro fn: generates full bilingual proposal PDF from event + brand profiles |
| Organizer dashboard: proposal inbox | Accept/decline/counter-offer workflow |
| Postiz integration | Auto-schedule 3 social posts per closed deal (Postiz CLI via OpenClaw) |
| Discovery outreach | Firecrawl scrapes Colombiamoda/Expo Belleza sponsor pages → 50 prospect list → Hermes scores → OpenClaw sends |
| WhatsApp group for active sponsors | OpenClaw creates group → weekly performance digest sent automatically |

- Target: 15 events listed, 10 proposals, 5 deals, $5,000–10,000 MRR

### Month 3 (Days 61–90): Marketplace flywheel

| Feature | Details |
|---|---|
| "Featured event" paid placement | Organizers pay $50–100 to boost their listing to top of `/marketplace/events` |
| Commission billing automation | Stripe automatically charges 15% when proposal converts to paid application |
| Brand referral program | Sponsor refers another brand → 10% credit on next campaign |
| `sponsor-renewal-predict` | Hermes scores 30d before contract end → auto-sends renewal email via OpenClaw |
| Post-campaign PDF report | `react-pdf` + Gemini: branded PDF with impressions, clicks, conversions, AI insights |
| `/marketplace/brands` for organizers | Organizers can search and approach brands proactively |
| Public sponsor showcase | Homepage section: "Brands that trust mdeai" → social proof for new signups |

- Target: 30 events listed, 20 active sponsors, $15,000–25,000 MRR
- Enough traction to pitch seed round or Bancolombia/EPM as anchor sponsors

---

## H. Tool stack recommendation

### Core stack (already in mdeai)

| Layer | Tool | Role |
|---|---|---|
| Database | Supabase PostgreSQL + pgvector | All sponsor data + semantic search |
| Auth | Supabase Auth | Organizer + sponsor login |
| Frontend | Vite + React + shadcn/ui | All pages |
| Payments | Stripe | Checkout + commission billing |
| AI decisions | Gemini (via `_shared/gemini.ts`) | 9 edge fns |
| Storage | Supabase Storage | Logo, video, contract PDF assets |
| Realtime | Supabase Realtime | Dashboard live updates |

### Outreach stack (Phase 2+)

| Layer | Tool | Role | When to add |
|---|---|---|---|
| Messaging | OpenClaw | WhatsApp + email outreach, WA notifications | Week 1 (already configured) |
| Social scheduling | Postiz | Instagram, TikTok, X campaign posts | Month 2 (3+ active sponsors) |
| Scraping | Firecrawl | Colombiamoda sponsor pages, web enrichment | Month 2 (discovery pipeline) |
| Reasoning | Hermes | Lead scoring, renewal prediction | Month 2 (Hermes Python CLI) |
| Governance | Paperclip | Lifecycle tracking, approval gates, budget control | Month 3+ (10+ sponsors) |
| Contact enrichment | Fire Enrich | $0.01–0.05/lead, email + phone enrichment | Month 3 (50+ prospects) |

### What NOT to use

| Tool | Why not |
|---|---|
| SponsorFlo | $299–799/mo for features already being built in-house at $0 marginal cost |
| SponsorUnited | Enterprise pricing, sports-heavy, no Colombia data |
| PhantomBuster / LinkedIn scraping | TOS violation → account ban → zero discovery |
| Apify for Instagram | Same risk; use Firecrawl + public signals instead |
| Clay | $720+/mo; Fire Enrich does same at $0.01–0.05/lead |
| Blockchain/crypto payments | No adoption in Colombian SMB market |

---

## I. Risks and red flags

### Critical risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Stripe secrets not set** | High (known gap) | Payments broken → zero revenue | Set within 48h. Escalate now. |
| **Marketplace stays empty** — chicken-and-egg problem | High | No sponsors if no events; no events if no sponsors | Seed manually: publish 5 real events yourself in week 3. Don't launch empty. |
| **Colombian brands don't trust a new platform** | Medium | Low conversion on outreach | Lead with Bancolombia/EPM anchor deal → social proof for everyone else |
| **WhatsApp Business API rate limits** | Medium | OpenClaw outreach throttled | Stay under 1,000 messages/day; verify Infobip number has approved templates |
| **Commission model deters organizers** | Medium | Low supply side | Offer "first deal free" (0% commission) for first 3 events per organizer |
| **Fulfillment disputes** (sponsor says impressions weren't delivered) | Medium | Chargebacks, brand damage | Every impression logged with timestamp + viewer anon_id. Report available on demand. |
| **Data quality on demographics** | Medium | AI matching returns bad recommendations | Make demographics field self-reported initially; don't overclaim AI precision |

### Red flags from competitor research

1. **"Can a sponsorship marketplace finally work?"** — The Sponsor.com's headline on Anvara explicitly acknowledges the historic failure rate of sponsorship marketplaces. The reason: data quality. Self-reported audience demographics are unreliable. Anvara solves this with mobile location data (expensive, US-only). mdeai's advantage: it already has real booking and event attendance data in the DB. Use it.

2. **Sponsoo's 20% commission** got pushback. mdeai should use **15% commission** as the differentiator.

3. **SponsorFlo's 23% statistic** — 23% of sponsorship revenue lost annually due to poor fulfillment tracking. This is mdeai's biggest operational risk. The deliverables checklist + impression logging mitigates it. Never promise what you can't track.

4. **B2B sales cycle is long** (1–5 months at the corporate level). For V1, target SMB Colombian brands ($500–5,000 deals) that can move in 1–5 days, not corporate procurement cycles. Go big on corporate later.

5. **The blockchain angle** (InstantSponsor) is a dead end for Colombia. Crypto payment adoption in Colombian SMBs is negligible. Stick with Stripe + bank transfer.

---

## J. Exact next steps (in order, start Monday)

### This week (days 1–5)

**Day 1 — Unblock payments:**
```
1. Log into Supabase dashboard → Settings → Edge Functions → Secrets
2. Add: STRIPE_SECRET_KEY, STRIPE_SPONSOR_WEBHOOK_SECRET, FRONTEND_URL
3. Test with Stripe test card 4242 4242 4242 4242 → confirm invoice created
```

**Day 2 — Ship sponsor dashboard (task 052):**
- `src/pages/sponsor/Dashboard.tsx` — 4 ROI tiles + impressions chart + AI insight card
- `src/hooks/useSponsorDashboard.ts` — queries `sponsor.roi_daily` last 30 days
- Route: `/sponsor/dashboard/:applicationId`

**Day 3–4 — Ship AI fns (task 054, batch 1):**
- `supabase/functions/sponsor-moderate/index.ts` — Flash + urlContext
- `supabase/functions/sponsor-roi-explain/index.ts` — Flash + daily cron trigger
- Both: Zod + ai_runs logging

**Day 5 — Ship chat integration (task 059):**
- Add 4 intents to `ai-router/index.ts`
- Add `sponsor_concierge` to `ai-chat/index.ts`
- Test: "quiero patrocinar un evento" → qualification sequence fires

### Week 2 — Complete AI + marketplace tables

**Days 6–7:**
- `sponsor-creative-gen` edge fn (Pro, ES+EN)
- `sponsor-audience-match` edge fn (Pro + googleSearch)
- `sponsor-optimize` edge fn (Pro, proposals only)

**Days 8–10 — Marketplace DB migration:**
```sql
-- Run in Supabase: migration for sponsor.event_profiles, brand_profiles,
-- messages, proposals, marketplace_index
```
- `sponsor-event-profile-upsert` edge fn
- Internal: publish 3 real Medellín events on `/marketplace/events`

### Week 3 — Build marketplace pages

**Days 11–13:**
- `/marketplace` landing page
- `/marketplace/events` browse + filter (category, city, budget)
- `/marketplace/events/:eventId` event sponsorship profile

**Days 14–15:**
- `/marketplace/inbox` messaging UI
- `sponsor-message-send` edge fn + OpenClaw WA notification to organizer

### Week 4 — First sponsor deals

**Days 16–18:**
- `sponsor-proposal-create` edge fn
- `/marketplace/brands/:orgId` brand profile
- Proposal → accept → auto-creates application flow

**Days 19–21 — Manual outreach:**
1. Scrape Colombiamoda sponsor page (Firecrawl) → extract brand names
2. Research marketing contacts via company websites (2h manual)
3. Send 10 personalized WhatsApp messages via OpenClaw
4. Target: 3 responses, 1 demo call, 1 proposal

**Day 22–30 — Follow-up + close:**
- Day-4 follow-up WA to non-responders
- Day-8 WA with screenshot proof (existing impression data from task 049)
- Target: 1 deal at $500–2,000 closed before end of Month 1

### Month 2 goals (to assign as tasks 102–108)

- [ ] Semantic search on marketplace (pgvector)
- [ ] `sponsor-price-recommend` edge fn
- [ ] `sponsor-proposal-gen` edge fn (full bilingual PDF)
- [ ] Postiz integration for social scheduling
- [ ] Discovery pipeline: Firecrawl → Hermes scoring → OpenClaw outreach
- [ ] Featured listing paid boost ($50/event)
- [ ] WhatsApp weekly digest for active sponsors (OpenClaw cron)

---

## Appendix: Pricing benchmark data

### What comparable deals cost (verified from research)

| Tier | US benchmark | Colombia suggested | Rationale |
|---|---|---|---|
| Bronze | $2,000–5,000 | $300–1,500 | 40–60% discount for emerging market + smaller events |
| Silver | $5,000–10,000 | $1,500–5,000 | Mid-size brands, regional campaigns |
| Gold | $10,000–20,000 | $5,000–15,000 | National brands, multi-event deals |
| Platinum | $25,000–50,000 | $15,000–40,000 | Title sponsors, annual partnerships |

**Commission models compared:**
| Platform | Commission |
|---|---|
| Sponsoo | 20% of deal value |
| Paved (newsletters) | 30% of deal value |
| Traditional agency | 10–15% of deal value |
| **mdeai (recommended)** | **15% of deal value** |

**Why 15%:**
- Below Sponsoo (20%) → competitive advantage vs. the closest commission-model competitor
- Above agency rates (10–15%) → justified by platform value (payment, ROI dashboard, AI insights)
- Free to list → no upfront cost risk for organizers, lowers supply-side adoption friction
- First-deal free for first 3 events per organizer → accelerates marketplace seeding

### Monetization stack (all revenue streams)

| Stream | When | Price point | Monthly upside |
|---|---|---|---|
| Platform commission (15%) | On every closed deal | 15% of deal value | $750 per $5k deal |
| Featured event listing | Month 2 | $50–100/listing/month | $500–1,000 at 10 events |
| Sponsored "recommended brand" | Month 3 | $200/month/brand | $2,000 at 10 brands |
| AI tools SaaS (Pro organizer) | Month 3 | $99/month | $990 at 10 organizers |
| Managed sponsorship service | Month 4 | $500–2,000/event | $5,000 at 5 managed events |
| Commission on renewals | Ongoing | 10% (reduced for loyalty) | Compounds with base |

**Month 6 revenue model (projections):**
- 30 active sponsors × avg $3,000 deal × 15% = $13,500 commission
- 20 featured listings × $75 = $1,500
- 15 Pro organizer subscriptions × $99 = $1,485
- 3 managed events × $1,000 = $3,000
- **Total: ~$19,500/month MRR at Month 6** (conservative; assumes 30 sponsors on platform)

---

## See also

- [100-sponsorship-system.md](./100-sponsorship-system.md) — master strategy, architecture, chat integration
- [052-sponsor-dashboard.md](../052-sponsor-dashboard.md) — ROI dashboard spec
- [054-sponsor-ai-edge-fns.md](../054-sponsor-ai-edge-fns.md) — 5 AI edge fn specs
- [062-openclaw-hermes-paperclip-sponsorship-system.md](./062-openclaw-hermes-paperclip-sponsorship-system.md) — Phase 3 automation
- [063-openclaw-sponsor-discovery-engine.md](./063-openclaw-sponsor-discovery-engine.md) — discovery pipeline
- [064-postiz-openclaw-campaign-system.md](./064-postiz-openclaw-campaign-system.md) — campaign system
