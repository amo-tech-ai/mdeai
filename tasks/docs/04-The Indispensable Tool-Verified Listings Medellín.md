# The Indispensable Tool-Verified Listings Medellín 

## The one-liner

**One search. All sources. Scam-filtered. Price-checked. Updated hourly.**

That's the tool. Nothing else matters until this works.

## Why users can't live without it

Today a renter in Medellín has to:

1. Open 4 Facebook groups and scroll unstructured posts
2. Open Airbnb for monthly rates
3. Open FazWaz and Metrocuadrado for long-term
4. Cross-check photos on Google to avoid scams
5. Message 20 landlords in Spanish, wait days for replies

You replace all of that with one search box that returns:

- **10 verified listings** ranked by deal score
- **Scam-flagged** listings filtered out
- **"Seen on 3 sites"** trust badges
- **Direct WhatsApp** to verified landlords

If it works, they never go back to Facebook.

## What's already planned you can reuse (from `/tasks/real-estate/`)

|Asset|Use for|
|---|---|
|`brightdata/real-estate-ai-agent` pattern (06-real-estate.md)|Scraping FazWaz, Metrocuadrado, FincaRaiz|
|`ai-real-estate-assistant` architecture (07-top-10.md)|Ranking + RAG search|
|Existing `apartments` table with 55 fields|Canonical listing schema — don't redesign|
|Existing `rentals` edge function (783 lines, Gemini 3.1 Pro)|Intake + extraction|
|pgvector already installed|Dedup + semantic search|
|PostGIS already installed|Geo-proximity dedup|
|Rentals intake wizard|Already collects user preferences|

## What's planned that you skip for now

- **Lobster workflow engine** — overkill, use `pg_cron`
- **Paperclip CEO agent** — not needed until 3+ agents exist
- **Hermes full install** — use Edge Functions + Gemini instead
- **5-step application flow, lease review AI, booking + payment** — these come after the search works
- **31-agent orchestration** from `cre-acquisition-orchestrator` — pure theater at V1
- **Mercur, multi-vendor marketplace** — unrelated to the core wedge

## The gap that makes or breaks it

The planning docs describe ranking and search but **skip the three trust signals that make the tool indispensable**:

1. **Cross-source dedup** → same apartment on Airbnb + FazWaz + Facebook becomes ONE card with badges
2. **Scam detection** → price 20%+ under median, duplicated photos (perceptual hash), wire-transfer language
3. **Freshness verification** → daily ping of source URL, flag stale listings

Build these three. Nothing else matters.

## The architecture (minimum viable)

```
┌─────────────────────────────────────────────────────┐
│  SOURCES                                            │
│  Airbnb (deep-link only) | FazWaz | Metrocuadrado   │
│  Facebook (user paste)   | Direct landlord submits  │
└──────────────┬──────────────────────────────────────┘
               │ Firecrawl / paste / form
               ▼
┌─────────────────────────────────────────────────────┐
│  INGEST (pg_cron hourly)                            │
│  apartment_sources table → raw listing per source   │
└──────────────┬──────────────────────────────────────┘
               ▼
┌─────────────────────────────────────────────────────┐
│  NORMALIZE + VERIFY (edge fn, Gemini Flash)         │
│  1. Extract structured fields                       │
│  2. Embed + pgvector dedup (0.92 threshold)         │
│  3. Perceptual hash photos → scam check             │
│  4. Price vs neighborhood median → outlier flag     │
│  5. Merge into canonical apartments row             │
└──────────────┬──────────────────────────────────────┘
               ▼
┌─────────────────────────────────────────────────────┐
│  SERVE (search edge fn)                             │
│  Rank = quality × trust × deal_score × freshness    │
│  Return with badges: [3 sources] [verified] [🔥-8%] │
└──────────────┬──────────────────────────────────────┘
               ▼
┌─────────────────────────────────────────────────────┐
│  OUTPUT (web + WhatsApp)                            │
│  Card → outbound link OR "Contact via mdeai"        │
│  Every click logged → feed to agents as leads       │
└─────────────────────────────────────────────────────┘
```

## The 14-day build plan

**Days 1–3: Ingest**

- `apartment_sources` table (id, canonical_apartment_id, source, source_url, raw_jsonb, last_seen_at, status)
- Firecrawl scraper for FazWaz + Metrocuadrado → seed **200 listings**
- Simple form at `/paste` for Facebook post paste-in

**Days 4–6: Verify**

- `ingest-normalize` edge function: Gemini extracts → Zod validates → inserts
- `dedupe` edge function: pgvector cosine + PostGIS address match → merge duplicates
- `scam-score` edge function:
    - Price z-score vs neighborhood median (> 2σ below = flag)
    - Perceptual hash across listings (≥3 matches elsewhere = flag)
    - Gemini classifier on description (wire transfer, abroad, etc.)

**Days 7–9: Rank + Serve**

- `search` edge function: filters + composite score + trust score
- Trust score = `(sources_count × 0.4) + (freshness × 0.3) + (scam_safety × 0.3)`
- Return top 10 with badges

**Days 10–12: UI**

- Strip nav to `/rentals` only (kill coffee/cars/restaurants/events)
- Search page SSR (fix the SEO-dead problem)
- Listing card: photo, price, beds, neighborhood, trust badges, source badges, outbound CTA
- Scam banner when flagged: "⚠️ Price 32% below market — possible scam"

**Days 13–14: Revenue hooks**

- Outbound tracking (clicks to Airbnb, FazWaz, etc.)
- Lead capture form: "Want a verified agent to find better?" → `leads` table
- WhatsApp 10 local agents, offer 5 free leads to test willingness to pay

## The data schema change (minimal)

```sql
-- New table: each source's view of a listing
CREATE TABLE apartment_sources (
  id uuid primary key,
  canonical_apartment_id uuid references apartments(id),
  source text not null check (source in ('airbnb','fazwaz','metrocuadrado','facebook','direct')),
  source_url text not null,
  source_listing_id text,
  raw_jsonb jsonb not null,
  photo_hashes text[] default '{}',
  scraped_at timestamptz not null default now(),
  last_verified_at timestamptz,
  status text default 'active' check (status in ('active','stale','removed','flagged')),
  unique(source, source_url)
);

-- Extend apartments table
ALTER TABLE apartments
  ADD COLUMN trust_score numeric(3,2),
  ADD COLUMN scam_risk text check (scam_risk in ('low','medium','high')),
  ADD COLUMN source_count int default 0,
  ADD COLUMN price_vs_median numeric(5,2),
  ADD COLUMN deal_score numeric(3,2);

CREATE INDEX ON apartments (trust_score DESC, deal_score DESC);
CREATE INDEX ON apartment_sources (canonical_apartment_id);
```

That's it. Two migrations. No agent framework needed.

## Why this wins

- **Facebook users get scam protection** they don't have
- **Airbnb users get longer-term options** Airbnb doesn't surface
- **FazWaz users get price context** (deal score vs market)
- **Everyone gets one search** instead of four tabs
- **Landlords get visibility** without paying (for now)
- **You get outbound clicks** (affiliate $) **and lead data** (agent $)

## The revenue tie-in

The tool being indispensable ≠ the tool making money. Money comes from:

1. Every outbound click to Airbnb/FazWaz carries your affiliate tag
2. Every "Contact via mdeai" creates a lead you sell to local agents at $20–$50
3. Direct-submitted listings eventually pay $29/mo to stay featured

**Build the indispensable tool in 14 days. Turn on monetization week 3. If 10 agents don't pay $30/lead by day 45, pivot.**

## What to delete today

- `/coffee`, `/cars`, `/restaurants`, `/events`, `/trips` from nav
- All Shopify/Gadget code from the frontend bundle
- The Paperclip/Hermes/OpenClaw planning docs from your active TODO (archive them)
- `bun.lockb` and `pnpm-lock.yaml` — pick `package-lock.json`, delete the others

**Focus is the feature.** The tool is indispensable because it does one thing better than four other sites combined. Don't dilute it.