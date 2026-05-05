---
task_id: 102-marketplace-corrections
title: Corrected sponsorship marketplace plan — Anvara deep dive + SponsorUnited deep dive + plan review
phase: PHASE-2-SPONSOR-GROWTH
priority: P0
status: Strategy
researched: 2026-05-04
sources: Anvara (8 pages scraped), SponsorUnited (5 pages scraped), cross-referenced with task 101
---

# 102 — Corrected Sponsorship Marketplace Plan

> **Purpose.** This document corrects the plan submitted by the user (referenced as "the draft plan" below), adds Anvara and SponsorUnited deep-dive findings from direct page scraping, and outputs the final corrected version of sections A–J.

---

## Corrections log (what was wrong in the draft plan)

| Section | Issue | Correction |
|---|---|---|
| A — Platform table | **JoinCoVent** described as "Event-analytics + AI-forecasts for sponsors" marketplace with "Subscription + success-based fee" | JoinCoVent (joincovent.com) is a **fully managed B2B event production service** — not a marketplace. Fixed fee per event: $3,000–$15,000. No AI forecasting. No self-serve. Sponsors don't browse events. Covent produces the entire event on behalf of the client. |
| A — Platform table | **Anvara** described as "Airbnb of sports & live-event sponsorships" with "Transaction + SaaS model" and "sports-focused" weakness | Anvara's own tagline is **"The Sponsorship Marketplace."** It is NOT sports-only — covers food festivals, music festivals, marathons, cultural events, experiential activations, and sports. Inventory starts at $25,000–$350,000 (US premium market). Free to browse; paid tiers (Pro, White Glove) for ROI forecasting + analytics. |
| A — Platform table | **SponsorUnited** not included | SponsorUnited is one of the two most important platforms for this research (the other is Anvara). Added in full below. |
| E — MVP | Uses new table names (`events`, `sponsors`, `brands`) that **conflict with the existing mdeai schema** | mdeai already has `sponsor.organizations`, `sponsor.applications`, `sponsor.assets`, `sponsor.placements`, etc. from tasks 045–058. New tables must follow the existing `sponsor.*` namespace. See task 101 for the correct 5 new tables needed. |
| H — Tool stack | **Cloudinary** listed for asset management | mdeai uses **Supabase Storage** (already configured). No Cloudinary dependency. |
| F — 30-day plan | Week 1 says "Build DB schema + API contract" | The `sponsor.*` schema already exists (task 045). Week 1 should be: set Stripe secrets + build task 052 dashboard + build task 054 AI fns. |
| H — Tool stack | "PostgreSQL + NGINX" listed | mdeai uses **Supabase** (managed PostgreSQL), not raw PostgreSQL + NGINX. |

---

## A. Corrected platform comparison table (13 platforms)

| Platform | Type | Target users | Key sponsor features | Key organizer features | Business model | AI features | Entry price | Colombia-ready |
|---|---|---|---|---|---|---|---|---|
| **Anvara** | True two-sided marketplace | Brands (startups → enterprise) + rights holders + agencies | Browse 4,000+ vetted listings; AI matching; predicted ROI/CPM; Deal Room; escrow payments; performance tracking | List opportunities; receive inbound offers; approve/reject sponsors; Deal Room for contracts + creative | Free to browse + offer; Pro/White Glove paid tiers (pricing not disclosed) | AI matching (audience/goals/budget); ROI/CPM prediction; benchmarking | Free | No (US focus; 1 Brazil listing) |
| **SponsorUnited** | Intelligence platform (NOT a marketplace) | Brands + rights holders + agencies + media + educators | Proposal Evaluator (AI); "Surface" AI Q&A; audience insights; competitive research; activation creative library | Prospect brands + contacts; price benchmarking; pitch with deal data; "SPND" pricing tool | Enterprise SaaS (pricing not disclosed; demo-only) | Surface (AI analyst); Proposal Evaluator; Audience Insights; SPND (pricing) | Enterprise | No |
| **SponsorPitch** | Data + CRM + marketplace | Both (sellers + brands) | Review pitches; filter by audience/values; contact database | Submit pitch; get matched brands; contact 13,000+ brands via CRM | Subscription $39–$334/user/mo | None | $0 (free tier) | No |
| **SponsorMyEvent** | Two-sided marketplace | Both | Browse 1,100+ cities; manage deals; pay within platform | Event listing; drag-and-drop packages; auto-match; import contact lists | Commission + SaaS | Undisclosed | Unknown | No |
| **SponsorFlo** | AI-powered management SaaS (supply-side only) | Organizers/rights holders | — | AI proposals in 60s; AI mockups in 10s; CRM; contract mgmt; Stripe payments; QuickBooks sync | Subscription $299–$799/mo | Most comprehensive AI suite in category | $299/mo | No |
| **Sponsoo** | Marketplace (sports only) | Athletes + clubs + corporate sponsors | Search 300+ sports; filter by discipline | Free profile; list offers; 20% commission on closes | 20% commission on closed deals | None | Free | No (Europe-heavy) |
| **Brella** | Event platform + sponsor tools | Conference/tradeshow organizers + sponsors | Book meetings with attendees; lead capture; booth analytics | Manage sponsors + meetings + booths; AI matchmaking; 30+ sponsor touchpoints | Enterprise custom | AI scheduling/matchmaking | Enterprise | No |
| **SponsorSearch** | Directory | India-focused brands + events | Search 2,500+ events; send enquiries | Submit event + tiers; receive enquiries | Commission on closed deals | None | Unknown | No |
| **OpenSponsorship** | Marketplace (athletes only) | Brands + athletes/sports influencers | Browse 20,000+ athlete profiles; filter by sport/follower count | Set own rates; receive brand proposals | Subscription $499+/mo (brands) | Minimal | $499/mo | No |
| **InstantSponsor** | Blockchain marketplace | Brands + sports/esports rights holders | Buy tokenized sponsorship units from $5,000 | List inventory for tokenization | Blockchain/token + "80% lower fees vs agency" claim | Algorithm matching | $5,000 brand min | No |
| **Adsly** | Marketplace (creators only — newsletters, podcasts, SaaS apps) | Brands + creators | Browse verified creator listings; CPM/CPC/flat pricing | List opportunities; set rates; direct messaging | Subscription $0–$15/mo + 0% commission | None | Free | No |
| **Covent** (JoinCoVent) | **Fully managed event production service** — NOT a marketplace | B2B GTM teams at enterprises | Events produced for clients (attendee sourcing, ICP screening, logistics, attribution) | Not organizer-facing — Covent IS the organizer | Fixed fee per event: $3,000–$15,000; annual programs from $40,000 | None | $3,000/event | No |
| **mdeai (planned)** | **Full-stack two-sided marketplace + AI** | Medellín/Colombia brands + event organizers | Browse events; audience match; chat concierge; ROI dashboard; AI insights | Apply wizard; package builder; asset upload; contract sign; impressions/clicks tracking | **15% commission + freemium** | 6 Gemini AI fns + chat concierge | Free to list | **YES — built for it** |

---

## Anvara deep dive (from direct page scraping, 2026-05-04)

### Real positioning (not "Airbnb of sports")

Anvara's actual tagline: **"The Sponsorship Marketplace — Buy, measure, and scale live event sponsorships across the world's largest network of opportunities."**

Their own summary: "We killed the deck."

They explicitly position against the "endless decks & emails" workflow that defines the current industry. Their A-to-Z system handles: send offers → sign contracts → pay → share creative → track performance.

### What Anvara actually is (5-step brand journey)

```
Step 1: Setup     → audience, location, category, budget filters + campaign goals
Step 2: Discover  → search 4,000+ vetted listings; AI-powered matches
Step 3: Predict   → benchmark audience/cost/engagement; see predicted ROI and CPM
Step 4: Execute   → send offers, negotiate, sign, pay, coordinate creative — all in one place
Step 5: Measure   → track impressions, engagements, ROI vs predictions in real time
```

### Anvara pricing evidence (what brands actually pay)

These are "Starting at" prices for **rightsholder inventory** listed on the platform:

| Opportunity | Location | Starting price |
|---|---|---|
| LAFC (football club) | Los Angeles | $350,000 |
| Santos FC (football) | São Paulo, Brazil | $350,000 |
| Tomorrowland Winter | Festival | $200,000 |
| Aspen Art Festival | Colorado | $100,000 |
| Seattle Film Festival | Seattle | $50,000 |
| Faces of Fitness Chicago | Chicago | $25,000 |

**Critical implication for mdeai:** Anvara's inventory minimum ($25,000) is **50x the entry price for mdeai's Bronze tier ($500)**. Anvara serves premium/enterprise brands only. This is not a competitor at the Medellín SMB level — it's an aspirational benchmark.

### Anvara AI features (what AI actually does)

Direct quote from the site:
> "Describe your brand, target audience, and goals. Our AI scans thousands of listings to match you with the most relevant partnerships—instantly."

Additional AI capabilities:
- Predicted ROI and CPM based on past campaign data, audience data, and brand context
- Benchmarking across comparable opportunities (even those outside their marketplace)
- Audience Alignment analysis (Pro/White Glove)
- Social listening, earned media value, brand lift analytics (Pro/White Glove)

**What AI does NOT do on Anvara:** It does not generate proposals, creative copy, or outreach messages. Those are manual or handled by the White Glove service team.

### Anvara international availability

From FAQ: *"Yes, we work with partners and events worldwide."*

However: Zero Colombia mentions. Zero LATAM pages. Only one South American listing found (Santos FC, Brazil, $350,000). Anvara is functionally US-focused in practice. The international claim appears aspirational.

### Anvara for mdeai: what to copy

| Anvara feature | mdeai equivalent | Status |
|---|---|---|
| "Browse opportunities free" | `/marketplace/events` browse page | 📋 task 101 |
| AI matching from brand description + goals | `sponsor-audience-match` edge fn | 📋 task 054 |
| Predicted ROI/CPM before committing | `sponsor-price-recommend` edge fn | 🆕 new |
| Deal Room: offer → negotiate → contract → pay | Existing: proposal → application → Stripe → contract flow | ✅ built (045–058) |
| Escrow payment | Stripe escrow (hold on application, release on approval) | ⚠️ Stripe secrets needed |
| Performance tracking | `sponsor.roi_daily` + dashboard | 📋 task 052 |
| Brand safety: approve/reject sponsors | Admin approval queue | ✅ task 047 |

### Anvara for mdeai: what to adapt (not copy directly)

- **Do NOT copy Anvara's price points.** $25,000 minimum is enterprise. mdeai's Bronze starts at $500 for Medellín SMBs.
- **Do NOT copy Anvara's US event categories.** Focus on beauty pageants, fashion, restaurant weeks, nightlife — underserved in every US-focused platform.
- **Anvara has no WhatsApp integration.** This is mdeai's biggest differentiator in Colombia.
- **Anvara has no bilingual content.** All mdeai AI outputs are ES+EN.

---

## SponsorUnited deep dive (from direct page scraping, 2026-05-04)

### Real positioning

SponsorUnited's actual tagline: **"The Industry's Leading Sponsorship Intelligence Platform"** and **"Your AI-native operating system for sponsorship."**

They are NOT a marketplace. They facilitate zero transactions. They are a **data intelligence and research tool** — the Bloomberg Terminal of sponsorship.

Their version 4.0 announcement: "The transformative operating system that empowers you to discover, evaluate, and activate high-impact deals with speed and precision."

### 4 named AI products in SponsorUnited 4.0

| Product | What it does | Available to |
|---|---|---|
| **Surface** | AI-powered analyst — answers sponsorship questions using SU's data without manual research | All users |
| **Proposal Evaluator** | Upload a proposal → AI returns: audience/market fit analysis, competitive landscape, pricing benchmarks, negotiation guide | Brand customers only |
| **Audience Insights** | Unified demographic profiles (age, income, location) overlaid on sponsorship data for fit assessment | All users |
| **SPND** | "Unprecedented pricing transparency" — pricing insights across deals, categories, markets, assets, entitlements | All users |

### SponsorUnited data scale (verified on platform page)

| Metric | Number |
|---|---|
| Venues audited by scouts | 10,000 |
| Devices scraped | 500,000 |
| Individual profiles tracked | 100,000,000 |
| Deal data for pricing | $45 billion |
| Platform users | 11,000 |
| Client organizations | 1,100+ |

**Data inconsistency found:** The Brands solution page says "data trained on $30B+ in sponsorship intelligence" while the homepage and platform page both say "$45B+". The $30B figure appears out of date.

### What SponsorUnited is for mdeai

SU is **not a competitor** — it's a potential data source inspiration. What mdeai can learn:
1. **Pricing transparency as a product.** SU's SPND tool is a paid product. mdeai could offer a "how much does a Silver sponsorship at a 500-person Medellín fashion event typically cost?" benchmarking feature — powered by its own growing deal DB.
2. **AI analyst as UX pattern.** SU's "Surface" product lets users ask questions in plain language about sponsorship data. mdeai's `sponsor_concierge` chat agent does this already for inbound sponsors.
3. **Proposal Evaluator as differentiator.** Brand uploads a received proposal → AI grades it vs benchmarks. This is a powerful tool for the brand side. mdeai could implement a lightweight version using `sponsor-audience-match` + historical `sponsor.roi_daily` data.

### SponsorUnited for mdeai: feature gap map

| SU feature | mdeai equivalent | Status |
|---|---|---|
| Surface (AI Q&A analyst) | `sponsor_concierge` in chat + `sponsor-roi-explain` | 📋 tasks 054 + 059 |
| Proposal Evaluator | `sponsor-audience-match` (partial) | 📋 task 054 |
| Audience Insights | `sponsor.event_profiles.demographics` JSONB | 📋 task 101 |
| SPND (pricing benchmarks) | `sponsor-price-recommend` fn | 🆕 new task |
| Competitive research | Not planned for V1 | Phase 3+ |
| Activation creative library | `sponsor.assets` + brand profile | 📋 task 101 |

---

## B. Corrected core feature checklist

### Already built in mdeai ✅ (tasks 045–058)

| Feature | Location |
|---|---|
| Sponsorship package builder (Bronze/Silver/Gold tiers) | `sponsor.applications` + apply wizard |
| Organizer event listing | `events` table (existing) |
| Sponsor apply wizard (4-step) | `/sponsor/apply` |
| Admin approval queue | `/admin/sponsorships` |
| Stripe checkout | `/functions/v1/sponsor-checkout` (Stripe secrets needed) |
| Digital contract generation | `sponsor-contract-generate` edge fn |
| E-sign (click-wrap) | `/sponsor/contract/:id` |
| Asset upload + moderation pending | `sponsor.assets` + Supabase Storage |
| Impression tracking | `sponsor.impressions` + `sponsor-impression` fn |
| Click tracking | `sponsor.clicks` + `sponsor-click` fn |
| Attribution (vote/booking to click) | `sponsor.attributions` trigger |
| Daily ROI rollup | pg_cron → `sponsor.roi_daily` |
| Dispute / cancellation UI | `/admin/sponsorships/:id/dispute` |

### Not yet built — needed for marketplace ❌

| Feature | Task | Priority |
|---|---|---|
| Sponsor ROI dashboard | 052 | P0 |
| AI asset moderation (`sponsor-moderate`) | 054 | P0 |
| AI creative gen (`sponsor-creative-gen`) | 054 | P0 |
| AI ROI insights (`sponsor-roi-explain`) | 054 | P0 |
| AI audience match (`sponsor-audience-match`) | 054 | P0 |
| AI optimizer (`sponsor-optimize`) | 054 | P1 |
| Chat sponsor intents + concierge agent | 059 | P0 |
| Event marketplace profile (`/marketplace/events/:id`) | 101 | P1 |
| Brand profile (`/marketplace/brands/:id`) | 101 | P1 |
| In-platform messaging | 101 | P1 |
| Proposal flow (sponsor → organizer) | 101 | P1 |
| Marketplace discover page | 101 | P1 |
| AI pricing benchmark (`sponsor-price-recommend`) | New | P1 |
| AI proposal PDF generator (`sponsor-proposal-gen`) | New | P2 |
| AI renewal prediction (`sponsor-renewal-predict`) | New | P2 |

---

## C. Advanced and AI feature checklist (corrected)

### What the draft plan had right ✅

- AI sponsor-event matching → `sponsor-audience-match` (task 054)
- AI proposal generator → `sponsor-creative-gen` (task 054) + `sponsor-proposal-gen` (new)
- AI pricing recommendations → `sponsor-price-recommend` (new)
- AI outreach message generator → Hermes Python script + OpenClaw sends
- AI creative generation → `sponsor-creative-gen` (task 054)
- AI ROI insights → `sponsor-roi-explain` (task 054)
- AI renewal prediction → `sponsor-renewal-predict` (new, Month 2)
- Activation planning checklist → `agreed_deliverables` JSONB on `sponsor.contracts`
- Post-campaign report generator → PDF from `react-pdf` + Gemini (Month 2)

### What the draft plan missed ❌

| Missing feature | Source | Notes |
|---|---|---|
| **AI Proposal Evaluator** (brand uploads received proposal → AI scores it) | Learned from SponsorUnited | Powerful differentiator for brand side. Use `sponsor-audience-match` + `sponsor.roi_daily` benchmarks. |
| **Pricing transparency tool** ("events like yours charge $X") | Learned from SponsorUnited SPND | `sponsor-price-recommend` fn — Flash model, compares to historical deals in DB |
| **Brand safety approval** (organizer approves each sponsor individually) | Confirmed on Anvara | Already in admin queue (task 047) — but needs to be surfaced to organizers in self-serve flow |
| **Escrow payment** (hold until deal milestones) | Anvara feature | Stripe holds payment until admin approves placements going live — already partially implemented |
| **Benchmarking vs competitors** | Learned from Anvara | Not for V1. Add to Phase 3 roadmap. |

### Model assignment for all 9 AI edge functions

| Function | Model | Tool | Rationale |
|---|---|---|---|
| `sponsor-moderate` | `gemini-3-flash-preview` | `urlContext` | <3s moderation; Flash sufficient for clean/flagged binary |
| `sponsor-creative-gen` | `gemini-3.1-pro-preview` | — | Bilingual ES+EN quality requires Pro |
| `sponsor-roi-explain` | `gemini-3-flash-preview` | — | Daily cron; 3 sentences; Flash sufficient |
| `sponsor-optimize` | `gemini-3.1-pro-preview` | — | Multi-step placement reasoning |
| `sponsor-audience-match` | `gemini-3.1-pro-preview` | `googleSearch` | Ground in real Medellín event data |
| `sponsor-price-recommend` | `gemini-3-flash-preview` | — | Simple lookup + comparison; Flash sufficient |
| `sponsor-proposal-gen` | `gemini-3.1-pro-preview` | — | Full bilingual proposal PDF content |
| `sponsor-renewal-predict` | `gemini-3-flash-preview` | — | Binary prediction + renewal message |
| `sponsor_concierge` (in ai-chat) | `gemini-3-flash-preview` | 3 Supabase tools | Chat response must be <2s |

---

## D. Real-world use cases (verified correct, no changes)

The 7 use cases in task 101 (beauty pageant, fashion week, restaurant week, music/nightlife, sports tournament, influencer event, business conference) are accurate and production-ready. No corrections needed.

**One addition from Anvara research:** Anvara's GoPuff testimonial ("like having a full-service agency available 24/7, 100x smarter") confirms the "AI as agency replacement" framing works. Use this framing in mdeai's sponsor marketing: *"Tu agencia de patrocinio, 24/7, sin comisiones de agencia."*

---

## E. mdeai MVP (corrected — use existing schema)

### Critical correction: don't create new tables that conflict with existing schema

The draft plan listed tables: `events`, `sponsors`, `brands`, `sponsorship_packages`, `proposals`, `messaging_threads`, `payment_logs`, `sponsorship_kpis`

**These conflict with the existing mdeai schema.** The correct tables to add (from task 101) are:

```sql
-- New tables needed (all in sponsor.* namespace)
sponsor.event_profiles          -- marketplace listing for each event
sponsor.brand_profiles          -- public brand profile for marketplace
sponsor.messages                -- in-platform messaging
sponsor.proposals               -- sponsor interest before formal application
sponsor.marketplace_index       -- denormalized search/filter metadata + pgvector embedding
```

Existing tables that already handle the rest:
- `events` → event data (already exists)
- `sponsor.organizations` → brand entity (task 045)
- `sponsor.applications` → formal application + tier + pricing (task 045)
- `sponsor.assets` → logo/video/creative (task 045)
- `sponsor.placements` → active sponsorship surfaces (task 045)
- `sponsor.impressions` + `clicks` + `attributions` → tracking (tasks 049–051)
- `sponsor.roi_daily` → ROI rollup (task 053)
- `sponsor.contracts` → legal agreement (task 055)
- `sponsor.invoices` → payment record (task 045)

### Correct API endpoints (edge functions)

```
Existing (already built):
POST /sponsor-impression           Record impression
POST /sponsor-click                Record click + redirect
POST /sponsor-checkout             Stripe checkout session
POST /sponsor-contract-generate    PDF generation
POST /sponsor-contract-sign        E-signature

New (task 101 adds):
POST /sponsor-event-profile-upsert  Organizer publishes marketplace listing
POST /sponsor-proposal-create       Sponsor sends proposal to organizer
POST /sponsor-message-send          In-platform message + WA notification

New AI (task 054 adds):
POST /sponsor-moderate             Asset moderation
POST /sponsor-creative-gen         Caption generation ES+EN
POST /sponsor-roi-explain          Daily ROI insights
POST /sponsor-optimize             Placement recommendations
POST /sponsor-audience-match       Brand→event matching
```

### Frontend pages (corrected)

```
Existing ✅:
/sponsor/apply                     4-step wizard
/admin/sponsorships                Approval queue
/admin/sponsorships/:id            Review + moderate
/sponsor/contract/:contractId      Sign page

Need to build 📋:
/sponsor/dashboard/:applicationId  ROI dashboard (task 052)
/marketplace                       Landing page
/marketplace/events                Browse events (filter: category, city, budget)
/marketplace/events/:eventId       Event sponsorship profile
/marketplace/brands/:orgId         Brand profile
/marketplace/inbox                 Messaging UI
```

---

## F. Corrected 30-day launch plan

The draft plan Week 1 says "Define DB schema + API contract." This is wrong — the schema already exists (task 045). Week 1 should unblock what's stuck.

### Week 1 — Unblock Stripe + build dashboard

| Day | Task |
|---|---|
| 1 | Set Stripe secrets: `STRIPE_SECRET_KEY`, `STRIPE_SPONSOR_WEBHOOK_SECRET`, `FRONTEND_URL` in Supabase dashboard |
| 1 | Verify test payment end-to-end with card 4242 4242 4242 4242 |
| 2–3 | Task 052: Sponsor ROI dashboard (`/sponsor/dashboard/:applicationId`) — 4 tiles + chart + AI insight card |
| 4 | Task 054: `sponsor-moderate` + `sponsor-roi-explain` edge fns (Flash model, Zod, ai_runs logging) |
| 5 | Task 054: `sponsor-creative-gen` edge fn (Pro model, ES+EN captions) |

### Week 2 — Complete AI + chat

| Day | Task |
|---|---|
| 6–7 | Task 054: `sponsor-audience-match` + `sponsor-optimize` edge fns |
| 8 | Task 059: Add 4 sponsor intents to `ai-router/index.ts` |
| 9 | Task 059: `sponsor_concierge` agent in `ai-chat/index.ts` (3 Supabase tools + qualification sequence) |
| 10 | End-to-end test: "quiero patrocinar un evento" → qualification → `/sponsor/apply` link |

### Week 3 — Build marketplace discovery layer

| Day | Task |
|---|---|
| 11 | DB migration: 5 new `sponsor.*` tables (`event_profiles`, `brand_profiles`, `messages`, `proposals`, `marketplace_index`) |
| 12 | `/marketplace/events` browse page with filters |
| 13 | `/marketplace/events/:eventId` event sponsorship profile |
| 14 | `sponsor-event-profile-upsert` edge fn |
| 15 | Publish 3 real Medellín events internally to seed the marketplace |

### Week 4 — Close the loop + first outreach

| Day | Task |
|---|---|
| 16 | `/marketplace/inbox` messaging UI + `sponsor-message-send` fn + OpenClaw WA notification |
| 17 | `sponsor-proposal-create` edge fn |
| 18 | Proposal → accept → auto-creates `sponsor.application` flow |
| 19–20 | Manual discovery: Firecrawl scrapes Colombiamoda sponsor page → extract 20 brand names |
| 21 | Research marketing contacts (2h manual via company websites) |
| 22–28 | OpenClaw sends 10 personalized WA messages; day-4 follow-up cadence |
| 29–30 | Target: 1 demo call, 1 proposal accepted, first $500–2,000 payment |

---

## G. Corrected 90-day roadmap

### Month 1 (Days 1–30): Foundation + first deals

Goals: Stripe working, dashboard live, 5 AI fns live, chat integrated, 3 events on marketplace, 1 deal closed.

Revenue target: $500–2,000 from first deal.

### Month 2 (Days 31–60): Scale AI + discovery

| Feature | Notes |
|---|---|
| `sponsor-price-recommend` fn | "Events like yours in Medellín charge $1,500–3,000 for Silver" |
| `sponsor-proposal-gen` fn | Bilingual PDF proposal from event + brand profiles |
| Semantic search on marketplace | pgvector: "brand targeting young women Medellín" → beauty pageants |
| Firecrawl discovery pipeline | Colombiamoda + Expo Belleza → 50 prospect list → Hermes scores → OpenClaw sends |
| Postiz integration | Auto-schedule 3 social posts per closed deal (Month 2 start) |
| Featured event listing (paid boost) | $50–100/month to appear at top of `/marketplace/events` |
| WA weekly digest for active sponsors | OpenClaw cron: every Monday, each sponsor gets last week's impressions/clicks |

Revenue target: $5,000–10,000/month (15 events, 10 proposals, 5 closed deals).

### Month 3 (Days 61–90): Marketplace flywheel

| Feature | Notes |
|---|---|
| AI Proposal Evaluator (inspired by SponsorUnited) | Brand uploads received proposal → Flash model grades fit vs DB benchmarks |
| Commission billing automation | Stripe charges 15% automatically when proposal converts to paid application |
| `sponsor-renewal-predict` fn | 30d before contract end → renewal email + WA via OpenClaw |
| Post-campaign PDF report | `react-pdf` + Gemini: branded report with impressions, clicks, conversions, AI summary |
| Hermes lead scoring | Python script scores 50 prospects from discovery pipeline |
| `/marketplace/brands` for organizers | Organizers browse and approach brands proactively |
| Public sponsor showcase | mdeai homepage: "Brands that trust mdeai" → social proof |
| Referral program | Sponsor refers brand → 10% credit on next campaign |

Revenue target: $15,000–25,000/month (30 events, 20 active sponsors).

---

## H. Corrected tool stack

### Core (already in mdeai — no changes)

| Layer | Tool | Notes |
|---|---|---|
| Database | Supabase PostgreSQL + pgvector | All sponsor data + semantic search |
| Storage | **Supabase Storage** (NOT Cloudinary) | Logos, videos, contract PDFs |
| Auth | Supabase Auth | Organizer + sponsor login |
| Frontend | Vite + React + shadcn/ui | All pages |
| Payments | Stripe | Checkout + 15% commission billing |
| AI | Gemini via `_shared/gemini.ts` | 9 AI edge functions |
| Realtime | Supabase Realtime | Dashboard live updates |

### Outreach (Phase 2+, already configured)

| Tool | Role | When |
|---|---|---|
| OpenClaw | WhatsApp + email outreach; WA notification to organizers | Week 1 (Infobip configured) |
| Postiz | Social scheduling (Instagram, TikTok, X) | Month 2 (3+ active sponsors) |
| Firecrawl | Scrape Colombiamoda/Expo Belleza sponsor pages | Month 2 (discovery pipeline) |
| Hermes | Lead scoring (Python CLI) | Month 2 |
| Paperclip | Lifecycle governance, approval gates | Month 3+ (10+ sponsors) |

### Do NOT use

| Tool | Why not |
|---|---|
| Cloudinary | Already using Supabase Storage; adding Cloudinary creates dual asset management problem |
| Raw PostgreSQL + NGINX | Already on managed Supabase |
| SponsorFlo | $299–799/mo; building everything in-house at $0 marginal cost |
| SponsorUnited | Enterprise pricing; no Colombia data; not a marketplace |
| LinkedIn scraping (PhantomBuster/Apify) | TOS violation → account ban |
| Clay for enrichment | $720+/mo; Fire Enrich ($0.01–0.05/lead) is equivalent |
| Blockchain/crypto payments | Zero adoption in Colombia SMB market |

---

## I. Corrected risks and red flags

| Risk | Evidence from research | Mitigation |
|---|---|---|
| **Marketplace empty at launch (chicken-and-egg)** | "Can a sponsorship marketplace finally work?" — The Sponsor.com headline explicitly acknowledges historic failure rate. Reason: both sides need each other from day one. | Seed manually: publish 5 real mdeai events in week 3. Recruit first 3 brands directly via WA. Don't open to public until 3 events + 2 brands are active. |
| **Price mismatch** — Anvara's minimum is $25k; mdeai's Bronze is $500 | Anvara inventory starts at $25,000; Colombian SMB budgets are $500–5,000 | This is actually mdeai's blue ocean. No platform competes at the $500–5,000 level in Colombia. |
| **Commission resistance** | Sponsoo 20% got pushback; Adsly differentiates on 0% commission | Offer "first deal free" (0% commission) for each organizer's first event. Frame the 15% as "you only pay when you get paid." |
| **Stripe secrets still missing** | Known gap from task 048 | Set by day 1. This blocks every paid deal. |
| **Fulfillment disputes** | SponsorFlo's own data: 23% of sponsorship revenue lost annually to poor fulfillment tracking | Every impression logged with timestamp + viewer anon_id. Deliverables checklist in contract. Report available on demand. Never promise what can't be tracked. |
| **WhatsApp outreach throttling** | Infobip has message template approval requirements | Stay under 1,000 messages/day; use pre-approved templates only; test outreach with 10 messages before scaling |
| **Data quality on demographics** | Anvara uses mobile location data (expensive, US-only); most platforms use self-reported data | Make demographics self-reported initially. Don't overclaim AI precision. As real event data accumulates in the DB, the matching improves organically. |
| **Colombia Ley 1581/2012** | Outreach to brands requires opt-out mechanism | Every WA/email includes "Responde STOP" opt-out. Keep opt-out list in `sponsor.blocklist` table. |

### The single biggest red flag from the research

**Anvara's minimum inventory is $25,000.** SponsorUnited is enterprise-only. Every credible platform in the market serves either:
- Enterprises with $25,000+ budgets (Anvara, SponsorUnited, Brella), OR
- Niche verticals (Sponsoo = sports, OpenSponsorship = athletes, Adsly = newsletters)

**No platform serves the $500–5,000 SMB event sponsorship market in an emerging market.** This is mdeai's exact opportunity. Do not let feature complexity distract from it. The MVP is: list event → find brand → WhatsApp them → close $500 deal → deposit to bank account. Everything else is Phase 3.

---

## J. Exact next steps (final, corrected)

### Immediate (this week)

```
Monday:
1. Supabase dashboard → Settings → Edge Functions → Secrets
   Add: STRIPE_SECRET_KEY, STRIPE_SPONSOR_WEBHOOK_SECRET, FRONTEND_URL
2. Test payment with test card: 4242 4242 4242 4242

Tuesday–Wednesday:
3. Build sponsor dashboard: src/pages/sponsor/Dashboard.tsx
   - ROITile (impressions/clicks/CTR/attributed revenue)
   - TopSurfacesChart (bar chart from roi_daily)
   - AIInsightCard (latest sponsor-roi-explain output)
   - useSponsorDashboard hook → queries sponsor.roi_daily

Thursday–Friday:
4. sponsor-moderate edge fn (Flash + urlContext)
5. sponsor-roi-explain edge fn (Flash + pg_cron trigger)
6. sponsor-creative-gen edge fn (Pro, ES+EN captions)
```

### Week 2

```
Monday–Tuesday:
7. sponsor-audience-match edge fn (Pro + googleSearch)
8. sponsor-optimize edge fn (Pro, proposal-only output)

Wednesday:
9. ai-router: add sponsor_inquiry, become_sponsor, sponsor_status, sponsor_support intents

Thursday–Friday:
10. ai-chat: add sponsor_concierge agent (qualification sequence + 3 tools)
11. Test: "quiero patrocinar" → budget Q1 → industry Q2 → goal Q3 → recommendation → /sponsor/apply
```

### Week 3

```
Monday:
12. DB migration: 5 new sponsor.* tables
    (event_profiles, brand_profiles, messages, proposals, marketplace_index)

Tuesday–Wednesday:
13. /marketplace/events browse page + filters
14. /marketplace/events/:eventId event sponsorship profile

Thursday:
15. sponsor-event-profile-upsert edge fn

Friday:
16. Publish 3 real Medellín events on marketplace (internal seed):
    - [Beauty pageant currently running]
    - [Fashion event next month]
    - [Restaurant/nightlife event]
```

### Week 4

```
Monday:
17. /marketplace/inbox messaging UI
18. sponsor-message-send edge fn + OpenClaw WA notification to organizer

Tuesday:
19. sponsor-proposal-create edge fn
20. Proposal → accept → auto-create sponsor.application flow

Wednesday–Thursday:
21. Firecrawl: scrape Colombiamoda sponsor page → extract 20+ brand names
22. Manual research: find marketing director + email for each brand (2h)
23. Draft WhatsApp template (bilingual ES+EN, under 200 words, STOP opt-out)

Friday–end of month:
24. OpenClaw sends 10 WA messages
25. Day-4 follow-up to non-responders
26. Target: 1 demo call, 1 proposal, $500–2,000 payment
```

---

## See also

- [100-sponsorship-system.md](./100-sponsorship-system.md) — master strategy, corrected architecture
- [101-marketplace-strategy.md](./101-marketplace-strategy.md) — initial competitive research + MVP spec
- [054-sponsor-ai-edge-fns.md](../054-sponsor-ai-edge-fns.md) — 5 AI edge fn specs
- [052-sponsor-dashboard.md](../052-sponsor-dashboard.md) — dashboard spec
- Anvara: https://www.anvara.com/ (free to browse 4,000+ listings)
- SponsorUnited: https://www.sponsorunited.com/ (enterprise intelligence; demo-only)
