Focused research on meta-search patterns + legal, then I'll write the strategy.

# 🔍 mdeai.co — Meta-Search Engine Strategy (Rentals, No MLS)

_Fragmented market = your moat. Here's how to weaponize it._

---

## PART 1 — CORE STRATEGY

### The One-Line Thesis

**"Kayak for Medellín rentals — one AI-ranked inbox for listings scattered across Airbnb, FazWaz, Facebook, and WhatsApp, with scam filtering and WhatsApp lead-capture that none of the sources offer."**

### Best architecture for a rental meta-search (no MLS)

**Three-tier pipeline:**

1. **Ingest tier** — multi-source crawlers/APIs/user-submit → raw listings table
2. **Normalize tier** — Gemini extraction → unified schema + deduped + scam-scored
3. **Serve tier** — pgvector + composite ranking → web + WhatsApp → outbound link (your revenue event)

### How this differs from Airbnb/Zillow

||Airbnb/Zillow|mdeai|
|---|---|---|
|Inventory|Own, walled garden|Aggregated, multi-source|
|Monetization|Booking fee|Affiliate + lead gen + concierge|
|Fraud risk|Verified hosts|**Cross-source verification is your edge** — you see the same listing on 3 sites, Airbnb + FazWaz match → verified; Facebook-only → scam-flag|
|Trust|Platform brand|AI scam filter + "listed on X other sites" badge|
|Moat|Supply|**Scam filtering + WhatsApp concierge + bilingual ranking**|

### MVP that actually works

- 1 city (Medellín), 2 neighborhoods (Laureles + El Poblado)
- 3 sources: Airbnb deep-links (no scraping — use search URL construction), FazWaz scrape, 2 Facebook groups scrape
- Gemini normalizer → Supabase → ranked list → **outbound link** (Airbnb affiliate ID, WhatsApp the FB poster, or email FazWaz lister)
- No booking, no payment, no inventory management. You're a router, not a marketplace.

---

## PART 2 — DATA SOURCES + INGESTION

|Source|Best method|Difficulty|Scale|Legal reality|
|---|---|---|---|---|
|**Airbnb**|**Do NOT scrape.** Construct affiliate deep-links by filters (`/s/city/homes?...`). Use 3rd-party (AirDNA/Airbtics) subscription for market data if needed.|20|∞|TOS explicitly forbids scraping ([Airbnb Help](https://www.airbnb.com/help/article/2908)). Public scraping is _legal in US_ (hiQ, Bright Data cases) but **contractually risky** — accounts/IPs banned, potential civil claims. Partner API is invite-only.|
|**FazWaz** (fazwaz.com.co)|Firecrawl Extract API or Playwright → Zod schema|40|~500 listings/day|No public API. Scraping public listings is generally permitted but **respect robots.txt, throttle, no login-gated content**. Safer than Airbnb — lower legal budget to chase you.|
|**Facebook groups** (765646657979980, 987616699644834)|**Human-assisted ingest.** Browser extension or apify actor that runs _under a logged-in account_ (one you own). Pull posts, Gemini extract.|75|~30-50 posts/day/group|**Facebook TOS explicitly forbids scraping**. Account bans common. Meta v. Bright Data affirmed scraping _public data_ is legal, but group posts aren't fully public. **Best: let the user paste FB posts into mdeai, AI extracts.** Lower risk, solves the same problem.|
|**Metrocuadrado, FincaRaiz, Ciencuadras** (Colombia)|Firecrawl/Apify → Zod|45|high|Same as FazWaz — public listings, scrape with care.|
|**User-submitted** (landlord form, WhatsApp paste)|Simple form + AI extract|5|low volume, high margin|Zero risk. **This is your golden source.**|
|**Partnerships** (local agents, building managers)|WhatsApp → AI converts to listing|15|5-20/week|Zero risk. Highest intent.|

### Practical ingestion rules

- **No direct Airbnb scraping** — use affiliate deep-links only.
- **Facebook: "paste, don't pull"** — a Chrome extension or WhatsApp bot where users/admins paste posts and AI extracts. Zero TOS violation.
- **Respect `robots.txt`, throttle to 1 req/sec, rotate IPs, cache aggressively.**
- **Never replay copyrighted photos on your domain** — hotlink with source credit and `<a>` to original. Reduces DMCA + copyright risk.
- **Always keep a `source_url` on every listing row.** When in doubt, send the user off-site.

---

## PART 3 — AI SYSTEM DESIGN

### 1. Data extraction (messy → structured)

- **How:** Gemini 2.5 Flash with Zod schema + JSON mode. Input = raw HTML/markdown/FB-post-text + photos. Output = unified Apartment schema (beds, baths, rent, neighborhood, amenities, stay terms, source_url, photo_urls).
- **Real-world:** "Bonito apto en Laureles, 3M COP, 2 cuartos, WiFi, pet friendly, contacta 3XX-XXX-XXXX" → `{bedrooms: 2, rent_cop: 3000000, neighborhood: "Laureles", amenities: ["wifi","pet_friendly"], contact_phone: "+573XX..."}`
- **Cost:** ~$0.0003 per listing. 500 listings/day ≈ $0.15/day.

### 2. Normalization (dedup across sources)

- **How:** Embed each listing (Gemini text-embed) → pgvector cosine similarity > 0.92 = likely same property. Also fuzzy-match on address + bed/bath + price range. Merge into a single **canonical listing** row with `sources[]` array.
- **Real-world:** Same Laureles 2BR on FazWaz + Airbnb + a Facebook post → one mdeai card with 3 source badges and "seen on 3 sites" trust signal.
- **This is the defensible moat.** No other platform merges these.

### 3. Ranking (best deals first)

- **How:** Composite score (already designed in PRD):
    - `budget_fit × 0.25 + neighborhood × 0.20 + wifi × 0.15 + stay_length × 0.15 + amenities × 0.10 + host × 0.10 + freshness × 0.05`
- Plus a **"deal score"**: price vs neighborhood median (from your aggregate). 8% under median → 🔥 badge.
- Plus a **"trust score"**: number of sources confirming + days since last verified.

### 4. Scam detection (especially Facebook)

Scammers copy real listings at ~30% discounts and demand wire transfers ([FlagMyListing 2026](https://flagmylisting.com/blog/facebook-marketplace-rental-scams-2026)). Signals:

- **Price > 20% below neighborhood median** → flag
- **Photos reverse-match another listing** (perceptual hash + CLIP embedding) → "This photo appears on 4 other listings" → hard flag
- **Contact mentions "I'm abroad", "wire transfer", "Western Union"** → Gemini detection → hard flag
- **Language red-flags**: identical templated text across 3+ Facebook posts from different accounts → coordinated scam ring
- **Contact not verifiable** (WhatsApp number never responds in test message) → soft flag

Expose the score: "Verified ✓" / "Unverified" / "⚠️ Possible scam — price 40% below market". **This alone is worth a paid tier.**

### 5. Personalization

- **Taste profile** from search history: if user opens 3 pet-friendly 2BRs under $1200, rerank future results to boost those features.
- Stored as user preference JSONB + pgvector embedding of viewed listings. Updated on every click.
- **Nothing fancy needed for V1** — a simple "your last 5 searches" boost gets 80% of the value.

---

## PART 4 — AGENT STRATEGY

### What to build now (MVP) — no agent framework yet

- **No Paperclip. No Hermes. No OpenClaw.** Use Supabase Edge Functions + `pg_cron`.
- Treat "agents" as **scheduled jobs + stateless edge functions** until you have revenue.

### Agent phases (after MVP hits revenue)

**Phase A — Ingestion agent (OpenClaw skill)**

- Scrape FazWaz/Metrocuadrado nightly via Firecrawl
- Pull user-submitted Facebook pastes from inbox
- Runs on cron; failures logged to `ai_runs`

**Phase B — Reasoning agent (Hermes-style, but start as an Edge Function)**

- Normalize + dedupe + score + scam-flag
- Composite ranking + embeddings
- Can be pure SQL + one Gemini call. **Don't install Hermes yet.**

**Phase C — Concierge agent (OpenClaw WhatsApp channel)**

- Handles inbound WhatsApp inquiries, asks qualifying questions, returns top 3 listings as cards with outbound links
- Human handover on complex cases

**Phase D — Orchestration (Paperclip, only at $10K MRR)**

- Budget caps, audit logs, heartbeats
- **Do not install until you have ≥3 autonomous agents running.** Until then, it's overhead.

### What NOT to build yet

- Multi-agent coordination protocols
- Self-improving skill registries
- Mercur multi-vendor marketplace
- Coffee, cars, restaurants, events, trip planning
- Voice, vision, contract review
- Any custom LLM fine-tuning

---

## PART 5 — USER FLOWS (REAL WORLD)

### Flow 1 — Rental Search (the money flow)

```
Sarah lands on mdeai.co/rentals (or WhatsApp bot)
 → "2BR Laureles, $1200, 3 months, WiFi"
 → Gemini parses → query pgvector + filters
 → Returns top 5 cards:
   #1 (🔥 8% under median) — FazWaz — [View on FazWaz] (referral tag)
   #2 (Verified x3 sources) — Airbnb deep-link — [Book on Airbnb] (affiliate ID)
   #3 (⚠ Unverified) — Facebook — [Message seller via WhatsApp]
   #4 Native listing — [Talk to concierge]
 → Click → outbound → 💰 (affiliate OR lead captured)
```

### Flow 2 — Lead Capture (sell to agents)

```
On listing card: "Want a verified agent to find you a better deal?"
 → Form: name, email, budget, dates, neighborhoods
 → Creates `leads` row with quality score
 → Paid agents in Medellín get WhatsApp notification with lead
 → Agent pays $20-50 per qualified lead (pre-paid credits)
 → mdeai keeps 100% of lead fee (not booking commission)
```

### Flow 3 — Messaging Automation (concierge tier)

```
Premium user ($29/mo): "Contact these 3 landlords for me"
 → OpenClaw agent opens WhatsApp via Infobip
 → Sends templated inquiry in Spanish to each number on listing
 → Collects replies, summarizes, ranks
 → User gets a digest: "Apt #2 responded, available Thu, asking 3.1M COP"
```

### Flow 4 — Booking Assistance (light-touch)

```
User wants Airbnb listing #2
 → "I'll pre-fill your Airbnb inquiry"
 → mdeai generates a pre-written message + deep-link with dates/guests
 → User clicks → Airbnb with affiliate tag attached
 → 💰 if user books within cookie window
```

**Key insight:** mdeai never takes payment for external listings. It's a referrer. Only native/concierge listings process payment.

---

## PART 6 — REVENUE STRATEGY

|Stream|How it works|When|Speed|Difficulty|Scalability|
|---|---|---|---|---|---|
|**Airbnb/Booking affiliate**|Apply to affiliate programs; add tracking IDs to outbound links. Earn on completed bookings.|Day 1|**S-tier (fastest)**|20/100|∞|
|**FazWaz / Metrocuadrado affiliate**|Negotiate direct — most Latin American portals do per-lead deals|Week 2|A-tier|40|High|
|**Lead sales to agents**|Agents pre-pay credits ($500 = 25 leads @ $20). Sold via WhatsApp drip to local agents|Week 3|A-tier|50|High (agent supply limited)|
|**Landlord "featured listing" ($20/week)**|Landlord pays to pin listing at top for their neighborhood|Week 4|B-tier|30|Moderate|
|**Concierge subscription ($29/mo)**|AI contacts landlords, schedules showings, scam-checks|Week 8|B-tier|70|High margin, slow growth|
|**Scam-check API / white-label**|B2B: rental sites pay per listing for your scam score|Month 6|C-tier|80|High|
|**Native bookings (12%)**|Only for landlords who sign up directly. Stripe + Wompi.|Month 3+|Slowest|85|High margin|

### Revenue projection (realistic, conservative)

Assumes 1K MAU by month 3, 10K by month 9.

|Month|MAU|Affiliate|Leads|Subs|Total|
|---|---|---|---|---|---|
|1|200|$50|0|0|**$50**|
|3|1,000|$400|$600|0|**$1K**|
|6|4,000|$1.5K|$3K|$500|**$5K**|
|9|10,000|$4K|$8K|$2K|**$14K**|
|12|20,000|$8K|$16K|$5K|**$29K**|

---

## PART 7 — MVP PLAN (what to build, what to ignore)

### Build FIRST (4 weeks)

1. **Kill scope.** Delete `/coffee`, `/cars`, `/restaurants`, `/events`, `/trips` from nav. Make `/rentals` the homepage.
2. **Ingestion edge function** — Firecrawl scraper for FazWaz + Metrocuadrado → `apartments` table. Runs `pg_cron` hourly.
3. **Facebook paste form** — "Saw a listing on Facebook? Paste it here, AI extracts + flags scams." Zero TOS risk.
4. **Airbnb deep-link generator** — construct URLs with affiliate ID; no scraping.
5. **Normalize + dedupe edge function** — Gemini extraction + pgvector dedup.
6. **Search UI** with source badges, trust score, scam warnings, outbound click tracking.
7. **WhatsApp concierge (Infobip)** — single flow: search → top 3 cards → outbound link.
8. **Lead capture form** + manual email to local agent contacts.

### Ignore for now

- Payment, booking, Stripe, Wompi
- Paperclip / Hermes / OpenClaw installs
- Mercur, coffee, cars, multi-vertical
- Contract AI, vision, voice
- Multi-city expansion

### Fastest way to users + revenue

- **Airbnb affiliate** applied day 1
- **SEO**: generate 200 city+neighborhood+bedrooms pages ("2BR furnished Laureles monthly"). Render server-side so crawlers see them (current site is tagline-only to crawlers — SEO-dead).
- **Reddit + Facebook expat groups**: post weekly curated list "10 best Laureles apartments this week" → drives traffic to mdeai with affiliate links.
- **WhatsApp number on landing**: "Just send us what you need." Lowest-friction funnel.

---

## PART 8 — RISKS + MISTAKES

### Biggest failure points

1. **Over-scraping Airbnb** → account bans, IP blocks, DMCA → dead product. **Don't.**
2. **Facebook scrape detection** → group bans → can't re-access. **Paste-not-pull.**
3. **Hosting copyrighted photos** on your domain → takedowns. **Hotlink only.**
4. **Scams leak through** → platform trust destroyed. **Conservative scam thresholds, always show "Unverified" badge when uncertain.**
5. **Empty inventory at launch** → bounce rate kills SEO. **Seed 200+ listings before shipping.**

### Legal risks ranked

|Risk|Severity|Mitigation|
|---|---|---|
|Airbnb TOS violation|High|Don't scrape. Use affiliate links + user-pasted URLs only.|
|Facebook ToS / bans|Medium-High|Paste-in model; never automate group scraping without an account you own and accept risk on.|
|Copyright (photos)|Medium|Hotlink, always credit + link to source. Allow take-downs.|
|Colombian data protection (Ley 1581)|Medium|Habeas Data compliance for user PII; no PII ingest from Facebook posts without consent.|
|Misrepresenting listings|Medium|Always label "Sourced from X", never imply you own the listing.|
|DIAN tax (when you earn COP)|Low-Medium|Register once revenue crosses threshold; trivial at first.|

### Overengineering traps

- **Installing Paperclip/Hermes/OpenClaw before revenue.** You've already done this once — 25+ planning docs, 0 agents running.
- **Building a "platform"** before a product. You don't need vendor onboarding, payouts, or multi-vertical. You need 10 people clicking affiliate links per day.
- **Custom models / fine-tuning.** Gemini Flash is $0.0003/listing. Fine-tuning won't pay back until $100K+ ARR.
- **Booking + payment in V1.** You don't own inventory. Don't try to process money for other people's listings.
- **Multi-agent orchestration** before a single agent works end-to-end.

### What most founders get wrong here

- They build the _marketplace_ (supply + demand + transactions) when they should build the _router_ (search + outbound link). Routers scale 10× faster because they don't need inventory.
- They treat scraping as infrastructure. It's a legal liability. Treat it as a _user input_ (paste-in) where possible.
- They ignore scam detection. In Colombia specifically, this is the #1 reason renters distrust Facebook groups. **Own the trust layer.**

---

## PART 9 — FINAL OUTPUT

### 1. Best Overall Strategy (one paragraph)

**Be the scam-filtered, AI-ranked inbox for Medellín rentals scattered across Airbnb, FazWaz, Metrocuadrado, and Facebook.** Don't own inventory. Don't process payments. Send users to the source with affiliate tags, sell qualified leads to local agents, and charge renters $29/mo for a WhatsApp concierge that contacts landlords on their behalf. Win on trust (scam score) and convenience (one search, many sources, WhatsApp-native).

### 2. Architecture

```
┌────────────────────────────────────────────────────────────┐
│  USER: Web / WhatsApp                                      │
└──────┬────────────────────┬──────────────────────┬─────────┘
       │ query              │ paste FB post        │ landlord submit
       ▼                    ▼                      ▼
┌────────────────────────────────────────────────────────────┐
│  EDGE FUNCTIONS (Supabase)                                 │
│  • search (pgvector + filters + ranking)                   │
│  • ingest-fb-paste (Gemini extract + scam score)           │
│  • ingest-scrape (Firecrawl → Metrocuadrado/FazWaz)        │
│  • lead-capture → notifies agents                          │
│  • whatsapp-bot (Infobip)                                  │
└──────┬─────────────────────────────────────────────────────┘
       ▼
┌────────────────────────────────────────────────────────────┐
│  SUPABASE POSTGRES                                         │
│  • apartments (canonical)     • apartment_sources (many)   │
│  • leads                      • scam_signals               │
│  • users + taste_profile      • outbound_clicks            │
│  • pg_cron: hourly scrape, daily freshness, weekly dedupe  │
└──────┬─────────────────────────────────────────────────────┘
       ▼
┌────────────────────────────────────────────────────────────┐
│  OUTBOUND                                                  │
│  • Airbnb affiliate deep-link                              │
│  • FazWaz referral                                         │
│  • WhatsApp to landlord                                    │
│  • Lead email/WhatsApp to agents                           │
└────────────────────────────────────────────────────────────┘
```

**One layer of agents in V1. Add Paperclip/Hermes/OpenClaw only after $5K MRR.**

### 3. Top 5 Features to Build First

1. **Listing aggregator** (FazWaz + Metrocuadrado scrape + Facebook paste-in + Airbnb deep-link)
2. **AI normalizer + dedupe + scam score** (Gemini + pgvector)
3. **Search UI with source badges & trust score** (SSR for SEO)
4. **WhatsApp concierge** (Infobip) with outbound link
5. **Lead capture form** feeding a manual "agent inbox" (automate later)

### 4. Revenue Plan (numbers)

- **Month 1:** Affiliate + 2 paid agent contracts → **$500-1K**
- **Month 3:** 1K MAU, 50 outbound clicks/day, 5 leads/day → **$3-5K/mo**
- **Month 6:** 4K MAU + concierge subs launching → **$8-15K/mo**
- **Month 12:** 20K MAU + landlord SaaS → **$25-40K/mo MRR**

Capital to get here: ~$15-30K (mostly dev time + Firecrawl + Infobip + affiliate/SEO content).

### 5. Agent System Design (simple)

**V1 (months 1-3):** No agent framework. Only Supabase Edge Functions + pg_cron jobs. Call them "agents" in marketing, not in code.

**V2 (months 4-6):** Add **OpenClaw** for WhatsApp concierge + Firecrawl scraping skills. One process, one inbox, one budget cap.

**V3 (months 6-12):** Add **Hermes-style reasoning** (just a structured Edge Function — don't install the framework) for better ranking + personalization. Add **Paperclip** only when you have 3+ autonomous agents and need governance.

### 6. 30-Day Execution Roadmap

**Week 1 — Kill scope + seed**

- Strip nav to `/rentals` only; fix admin auth bypass
- Apply to Airbnb + Booking affiliate programs
- Firecrawl subscription; build FazWaz + Metrocuadrado scrapers → seed 200 listings
- SSR/prerender landing + search pages (fix SEO-invisible problem)

**Week 2 — Normalize + dedupe + rank**

- Gemini extractor → unified schema
- pgvector embeddings on insert trigger
- Scam score v1 (price deviation + photo hash)
- Search UI with source badges

**Week 3 — WhatsApp + lead capture**

- Infobip WhatsApp bot (single flow: query → top 3 cards → outbound)
- Lead capture form → email/WhatsApp to 5 pre-recruited agents
- Airbnb deep-link generator + affiliate ID wired

**Week 4 — Launch + measure**

- Post in 3 expat Facebook groups + Reddit r/medellin
- Content: 20 SEO pages ("2BR furnished Laureles monthly") rendered SSR
- Instrument outbound_clicks + lead_created events
- First revenue target: **$200 affiliate + 10 leads × $20 = $400 in 30 days**

---

## ⚖️ The One Thing That Matters

Your edge is **not** inventory, booking, or payments. Airbnb wins those. Your edge is:

> **Trust (scam-filter) + Coverage (all sources) + Convenience (WhatsApp).**

Build those three. Affiliate away the rest. Add agents only when manual revenue is repeatable.

---

**Sources:**

- [Is It Legal to Scrape Airbnb Data? — AirROI](https://www.airroi.com/blog/is-it-legal-to-scrape-airbnb-data)
- [Airbnb Terms of Service](https://www.airbnb.com/help/article/2908)
- [Airbnb API Terms](https://www.airbnb.com/help/article/3418)
- [Scrape Airbnb Data: Ethical 2026 Guide — GoProxy](https://www.goproxy.com/blog/scrape-airbnb-data/)
- [Facebook Marketplace Rental Scams 2026 — FlagMyListing](https://flagmylisting.com/blog/facebook-marketplace-rental-scams-2026)
- [AI Listing Protection from Rental Scams — Showdigs](https://www.showdigs.com/features/new-ai-powered-listing-protection)
- [Meta Launches New Anti-Scam Tools](https://about.fb.com/news/2026/03/meta-launches-new-anti-scam-tools-deploys-ai-technology-to-fight-scammers-and-protect-people/)
- [10 Latest AI Tools for Real Estate — Crescendo](https://www.crescendo.ai/blog/ai-tools-for-real-estate-businesses)
- [AI Real Estate Lead Generation — Lindy](https://www.lindy.ai/blog/how-to-use-ai-for-real-estate-lead-generation)
- [AI Real Estate Tools 2026 — The Close](https://theclose.com/best-real-estate-ai-tools/)