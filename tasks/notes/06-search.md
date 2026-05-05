# Rental search — options, meta-search, and best practices

This note is the **strategy layer** for *how* mdeai should search rentals: product shape, architecture, and sequencing. **Vendor scores, portal reviews, and third-party API tables** live in **[`03-realestate-search.md`](03-realestate-search.md)** — read that for *which* external sources to use; read *this* for *how* to wire search well. **Ranked GitHub repos** (RAG, multi-agent, pipelines) for inspiration only: **[`07-github-repos.md`](07-github-repos.md)**.

---

## What “good rental search” means here

- **Travelers** ask in natural language (or filters) for **current** inventory that matches budget, area, and vibe.
- **Listings change often** — search must reflect **live or near-live** data, not a static brochure.
- **Meta-search** (optional differentiator): aggregate **multiple sources** (your inventory + partners + allowed public comps) into **one ranked list** with **source attribution** and **freshness**.

---

## Current setup (repo reality)

| Piece | Role |
|--------|------|
| **`apartments`** (Postgres) | Source of truth for **your** listings; `status = 'active'` drives what’s searchable. |
| **`ai-search`** edge | NL → Gemini **extracts** filters/keywords → SQL over `apartments` (and other tables). Explore uses **`useAISearch`** → `ai-search`. |
| **`ai-chat`** (`search_apartments` tool) | **Separate** SQL path — should eventually **delegate** to the same retrieval logic as `ai-search` (one brain). |
| **`rentals` edge** | Intake + conversational search action for rentals UX — align contracts with product search goals. |
| **Embeddings / pgvector** | Not the default path yet; FTS + filters is the near-term lever; vectors later for semantic ranking. |

**Gap:** extracted **keywords** must **drive** retrieval (FTS or `ilike` on title/description), not only neighborhood + price — see best practices below.

---

## Options (strategy)

| Option | What it is | When to use |
|--------|------------|-------------|
| **A. Single inventory only** | Search **only** rows you control in Supabase (`apartments` + CRM). | MVP, trust, and pipeline (leads → showing) — **required baseline**. |
| **B. Meta-search (aggregated index)** | **Ingest** from allowlisted sources (feeds, scrapes, APIs) into **your DB**, then search **one** unified table (or view). | When the product promise is “see what’s out there across portals,” not only mdeai-hosted units. |
| **C. Live multi-site fetch per user query** | Crawl several sites **on each** search. | **Avoid** for production — slow, brittle, ToS-heavy, easy to block. |
| **D. External STR / benchmark APIs** | AirROI, SearchApi-style tools for **comps and analytics**, not necessarily your primary renter-facing grid. | Pricing stories, “Airbnb vs us” — see **`03-realestate-search.md`** § API scores. |

**Disciplined MVP:** **A** solid + optional **B** started with **1–2 ingest sources** (partnership CSV or scheduled extract), **not** C.

---

## Meta-search — how it should work

**Definition:** One user query hits **your unified index** (Postgres), which contains **normalized listings** from multiple origins — each row knows **`source`**, **`source_url`**, **`fetched_at`**, and a **dedupe key**.

### Flow (best practice)

1. **Ingest (async)** — Cron, queue, or edge job: fetch → parse → normalize → **upsert**. **Never** block the user request on crawling five sites.
2. **Index** — Same DB the app already trusts; optional **`tsvector`** for full-text; later **`pgvector`** on normalized text.
3. **Query (sync)** — User prompt → structured filters + text search → **rank** (price, neighborhood, recency, quality score).
4. **Present** — Cards show **where it came from**, **last updated**, link-out to book on the host/platform.

### User journey: prompt in chat (“search multiple sites”)

**What the traveler sees:** They type in **chat** (same idea as Explore): e.g. *“2BR under 3M COP, Laureles, quiet, good Wi‑Fi, available next month.”* They get **one ranked list** — titles, prices, neighborhoods, **which source** each row came from (your inventory, ingested portal, partner feed), and optional **“verified / as of”** freshness. They do **not** need five browser tabs; the product is **one answer surface**.

**What actually runs (production-shaped):** Meta-search is **not** “on every message, open five websites live.” That would be slow, brittle, and often ToS-problematic. Instead, **multiple sites** show up as **multiple rows in one index** you maintain in **Postgres**, refreshed by **background ingest** — the chat request **only queries your DB**.

| Step | Layer | What happens |
|------|--------|----------------|
| **Ingest** | Background (cron / queue / partnership sync) | Allowlisted sources → parse → normalize → **upsert** into unified listing rows (`source`, `source_url`, `fetched_at`, dedupe). |
| **Index** | Postgres (+ FTS / later `pgvector`) | “Current listings” = rows passing **active + freshness** rules — not live HTML fetched inside the chat turn. |
| **Prompt** | Chat → **`ai-search`** (recommended) or equivalent | NL → **structured filters + keywords** (Gemini or shared parser). **Same path as Explore** so chat and map don’t disagree. |
| **Query** | SQL + rank | Filter, text match, **rank** (price fit, neighborhood, recency, quality score). |
| **Reply** | Chat UI | Model formats results (cards or short summary); links **out** to the original listing/host when not yours. |

**“Current”** = ingestion cadence + **`updated_at` / `fetched_at`** (+ optional “hide if older than N days”). **“Best”** = **your ranking rules** (and later learning), not raw crawl order.

**One-line summary:** The user only **chats**; the system only **searches your aggregated index** that **already contains** listings from many sources, **kept fresh by jobs** — that’s how meta-search stays fast, repeatable, and shippable.

### What to add in the DB (minimum)

- **`source`** (enum/text), **`external_id`** or URL hash, **`source_url`**, **`fetched_at` / `updated_at`**.  
- **Dedupe:** unique on `(source, external_id)` or canonical URL.  
- Either **extend `apartments`** with nullable external fields or add **`aggregated_listings`** if you must separate “ours” vs “ingested.”

### Legal / ops

- Respect **robots.txt**, **rate limits**, and **site ToS** — **`03-realestate-search.md`** and **`tasks/real-estate/docs/1-trio-real-estate-plan.md`** (Gap 1) assume **review before** production scrape.  
- **Partnership feeds** beat fragile scrapes for anything customer-facing.

#### Why we still flag ToS — even with “link back to source” (search-engine analogy)

**Fair intuition:** Showing a result with **title, price, neighborhood, thumbnail, and a prominent link** to the original listing feels like **Google/Bing**: discovery + outbound traffic, not stealing the transaction.

**Why it isn’t automatically the same in legal/product terms:**

| Factor | Typical **search engine** | **Aggregated rental meta-search** |
|--------|---------------------------|-----------------------------------|
| **Relationship** | Often explicit crawl/index policies, scale, and case law in some jurisdictions — not a template for every startup product. | You still rely on **each site’s Terms** and **robots.txt** unless you have a **contract or API license**. |
| **What you store** | Commonly **snippets + URL**; full-page reuse varies by policy and territory. | Copying **full descriptions, photos, or structured feeds** into your DB can cross lines even **with** a link — **attribution helps ethics/UX but is not a blanket permission** to scrape or re-publish. |
| **Commercial use** | Ad-funded index — different business model and risk profile. | **Lead-gen / marketplace** competitors may **explicitly prohibit** automated extraction in ToS even when linking back. |

**What this means for mdeai:** Treat **“link to source”** as **required** for trust and traffic — and still run **source-by-source** review: **official API / feed / partnership** first; **minimal fields** + **clear outbound link** if you ingest; **no** pretending listings are yours. Counsel familiar with **Colombia + target markets** should bless anything beyond light comp research.

**Bottom line:** The product can be **aligned with search-engine spirit** (send users to the real listing); the doc still says **review ToS** because **link-back ≠ automatic right to bulk copy/store**, and contracts beat assumptions.

---

## Best practices (engineering + product)

1. **One retrieval pipeline** — Explore, chat, and WhatsApp bridges should converge on **`ai-search`** (or a shared module), not three different SQL implementations.  
2. **DB is SoT for user-facing search** — Meta-search means **store then search**, not “proxy the web” at request time.  
3. **Freshness** — Show **as-of** date or **last verified**; pipeline jobs refresh **`updated_at`**.  
4. **NL + structured** — Gemini extracts intent; **FTS/keyword** matches description/amenities; filters narrow neighborhood/price/beds.  
5. **Transparency** — “Found on [Fincaraíz / partner / mdeai]” builds trust; avoid implying you **hold** inventory you don’t.  
6. **mdeai rental money** — Marketplace rule: **rent/deposit often off-platform (landlord)** — search is discovery/handoff, not necessarily checkout (`02E` prompts).

---

## Phased roadmap (suggested)

| Phase | Ship |
|--------|------|
| **1** | Harden **`ai-search`** on **`apartments`**: keywords → FTS, unify with **`ai-chat`** apartment tool. |
| **2** | **Meta-search schema** + ingest job for **one** allowlisted source; unified search UI + badges. |
| **3** | More sources, dedupe tuning, Hermes-style ranking; optional **pgvector**. |
| **4** | Partnerships / feeds replacing brittle scrapes where possible. |

---

## Where tasks and deeper research live

| Topic | Doc |
|--------|-----|
| **API vendors, Airbnb tools, Colombian portals, comp sites** | **[`03-realestate-search.md`](03-realestate-search.md)** |
| **Wire Explore → `ai-search`** | [`tasks/prompts/core/04A-ai-search-wire.md`](../prompts/core/04A-ai-search-wire.md) |
| **Rental UI / map search** | [`tasks/prompts/core/04E-frontend-rental-flow.md`](../prompts/core/04E-frontend-rental-flow.md) |
| **Gap 1 multi-site / Firecrawl pattern** | [`tasks/real-estate/docs/1-trio-real-estate-plan.md`](../real-estate/docs/1-trio-real-estate-plan.md) |
| **PRD / inventory focus** | [`tasks/prd-real-estate.md`](../prd-real-estate.md) |

---

*Last updated: 2026-04-05 — § User journey (chat); § Attribution vs ToS (search-engine analogy).*
