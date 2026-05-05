# Real-estate search: multi-site & third-party APIs

> **Strategy (options, meta-search architecture, best practices):** [`tasks/notes/06-search.md`](06-search.md). **Open-source reference repos** (ranked for mdeai): [`tasks/notes/07-github-repos.md`](07-github-repos.md). **This** doc focuses on **sources** — APIs, portals, comps, and tooling scores.

## Where is this work tracked?

| What you mean | Where it lives today | Status |
|---------------|----------------------|--------|
| **“Search rentals across multiple sites + third-party APIs”** (Piloterr, AirROI, SearchApi, Apify, RapidAPI, etc.) | **Not** a dedicated line in [`tasks/prd-real-estate.md`](../prd-real-estate.md). That PRD focuses on **mdeai inventory**, Supabase, Hermes ranking, `rentals` edge, and **market snapshots from your own aggregates** — not external STR API vendors. | **Gap** — spell out in PRD or add a prompt if you want it epic-tracked. |
| **Multi-site listing aggregation (FincaRaiz, Metrocuadrado, Ciencuadras, Airbnb…)** | [`tasks/real-estate/docs/1-trio-real-estate-plan.md`](../real-estate/docs/1-trio-real-estate-plan.md) — **PART 10 → Gap 1: Multi-Site Scraping** (Firecrawl + Zod schemas, nightly cron). | Planned pattern; **not** mapped to a `tasks/prompts/0xE-*.md` file yet. |
| **In-app rental search UI** | Epic **E4** — [`tasks/prompts/04E-frontend-rental-flow.md`](../prompts/04E-frontend-rental-flow.md); wireframes `tasks/wireframes/01-rental-search-desktop.md`. | Product search for **your** listings. |
| **`rentals` edge (intake + search)** | `supabase/functions/rentals/` · [`tasks/real-estate/docs/10-real-estate-tasks.md`](../real-estate/docs/10-real-estate-tasks.md). | Core search path. |
| **Neighborhood / market intel** | **E6** — [`06D-market-snapshot-edge.md`](../prompts/06D-market-snapshot-edge.md); PRD §5 “Market intelligence snapshot”. | Uses **internal** `market_snapshots` + Hermes — not necessarily external APIs. |

**Bottom line:** If you want **third-party Airbnb/STR data APIs** as a first-class task, add either (a) a subsection to the PRD + a backlog line in `tasks/todo.md`, or (b) a new lettered prompt (e.g. `04C` or a small **E11** spike) titled *external listing comparables & STR benchmarks*.

---

## Third-party search & data APIs — review scores (/100)

Scores are **mdeai-specific**: fit for **Medellín medium-term furnished rentals**, need for **comparable STR/LTR pricing**, **API quality**, **self-serve vs enterprise**, **legal/ToS sanity**, and **Colombia relevance** (most STR APIs are **US/global Airbnb-centric**).

| Provider | Score /100 | Role | Notes |
|----------|------------|------|--------|
| **[AirROI](https://www.airroi.com/blog/best-airbnb-api-providers)** (Airbnb data API) | **88** | STR listings + analytics API | Strong filters, geospatial modes, pay-as-you-go from ~$10, [documented in a 2026 provider roundup](https://www.airroi.com/blog/best-airbnb-api-providers). **Use case for mdeai:** benchmark ADR/occupancy for “Airbnb vs us” pricing stories — **not** a replacement for FincaRaiz inventory. |
| **AirDNA** | **72** | Enterprise STR analytics | CBRE-grade credibility; **~$50K+** enterprise, no self-serve API. Better for institutional comps than MVP. |
| **Mashvisor** | **68** | STR + LTR US investment API | Credit-based / RapidAPI; **US-heavy** — weak Colombia coverage for local comps. |
| **SearchApi.io** (Airbnb search engine) | **70** | Query-by-city / dates / guests | Useful for **structured JSON** search experiments; verify **ToS**, rate limits, and whether results match live Airbnb (scraping-based vendors drift). |
| **Piloterr** | **65** | General web scraping / extraction API | Good for **custom** listing pages if you own compliance; **not** Airbnb-specialized — score assumes flexible extraction, not Medellín out-of-the-box. |
| **Apify** (Airbnb scrapers) | **62** | Programmatic scraper actors | Fast to test; **fragile** when Airbnb changes UI; build-your-own monitoring. |
| **RapidAPI** (marketplace) | **58** | Aggregator of many “Airbnb APIs” | Convenient auth; **uneven quality**, unofficial scrapers, ~20% marketplace fee — fine for prototypes, risky for production SoT. |
| **Bright Data** | **55** | Raw scrape / datasets | Huge raw volume; **you** build analytics — high engineering cost. |
| **Inside Airbnb** | **48** | Free CSV dumps | **No API**, quarterly, limited cities — OK for **research**, not prod search. |

**Suggested “best” for a disciplined MVP:** prioritize **one** paid STR benchmark source (**AirROI** or a **SearchApi**-style product after a 1-day spike) **plus** the existing plan (**Firecrawl / structured scrape** for **Colombian** portals in Gap 1). That splits **global STR comps** from **local inventory truth**.

---

## AI-powered Airbnb search tools (GitHub, MCP & OpenClaw)

These projects let LLMs or agents **query Airbnb-style inventory** via natural language, MCP tools, or CLI skills. None replace **mdeai’s own** `rentals` / Supabase search; they are **comps, research, or assistant integrations**. **Legal/ToS:** favor robots.txt-aware tools and licensed data for anything customer-facing; unofficial private-API wrappers are **high risk** in production.

| Project | Score /100 | What it is | mdeai notes |
|--------|--------------|-------------|-------------|
| **[openbnb-org/mcp-server-airbnb](https://github.com/openbnb-org/mcp-server-airbnb)** | **82** | MCP server (`airbnb_search`, `airbnb_listing_details`); npm `@openbnb/mcp-server-airbnb`; optional `--ignore-robots-txt` for testing. | Best **MCP** fit for Cursor/Claude-style dev workflows; [docs describe](https://github.com/openbnb-org/mcp-server-airbnb) filters, pagination, robots compliance by default. |
| **[stveenli/airbnb](https://clawskills.sh/skills/stveenli-airbnb)** (OpenClaw / [ClawHub](https://github.com/openclaw/skills/tree/main/skills/stveenli/airbnb)) | **78** | OpenClaw skill: CLI search (`airbnb-search`), JSON-friendly, no API key. | Aligns with **OpenClaw** stack in [`08E`](../prompts/08E-multi-channel.md) / Paperclip — good for **ops scripts** and agent tooling, not primary web UX. |
| **[AmirLayegh/airbnb-semantic-search](https://github.com/AmirLayegh/airbnb-semantic-search)** | **76** | **Superlinked** + **Qdrant**, multi-attribute vectors, FastAPI + Streamlit; dataset from [Inside Airbnb](https://insideairbnb.com/) (Stockholm). | Strong **pattern** for semantic + structured ranking (compare to **Hermes** + `pgvector`); re-embed **your** listings, not Airbnb production scrape. |
| **[AI-ANK/Airbnb-Listing-Explorer](https://github.com/AI-ANK/Airbnb-Listing-Explorer)** | **70** | **LlamaIndex** + **Qdrant** + Streamlit; NL queries over embedded listings; sample Berlin CSVs in repo. | Demo-grade **semantic search**; swap in Medellín-shaped CSVs only if licensing allows. |
| **[openclaw/travel-concierge](https://smithery.ai/skills/openclaw/travel-concierge)** ([Smithery](https://smithery.ai/skills/openclaw/travel-concierge)) | **72** | Skill: `travel-concierge find-contact "<url>"` — phone/email/WhatsApp/IG from **Airbnb, Booking, VRBO, Expedia** URLs; optional Google Places. | **Direct-booking research** and host contact discovery — adjacent to search, useful for **concierge** flows; scraping caveats apply. |
| **[mongodb-developer/stream-airbnb-ai-reviews](https://github.com/mongodb-developer/stream-airbnb-ai-reviews)** | **55** | Streamlit + MongoDB Atlas; ingest from Hugging Face Airbnb-style dataset; AI review summaries. | Tutorial/demo; not a search engine — **reference** for review UX only. |
| **[zxol/airbnbapi](https://github.com/zxol/airbnbapi)** (`airbnbapijs`) | **45** | Unofficial **Node** wrapper around Airbnb **private/mobile** JSON API (`listingSearch`, calendars, etc.). | README: *educational only*, not affiliated with Airbnb — **fragile + ToS-sensitive**; avoid for mdeai prod; use for understanding legacy patterns only. |
| **Airbnb-MCP (vedantparmar12)** | *TBD* | Cited as MCP + **LiveKit** / voice for agents — [search GitHub](https://github.com/search?q=vedantparmar12+airbnb+mcp&type=repositories) for the canonical repo and replace this row with a link + score. | — |

---

## Colombian portals: [Fincaraíz](https://www.fincaraiz.com.co/) — 84/100

[Fincaraíz](https://www.fincaraiz.com.co/) is a major **Colombia-wide** property portal (venta, arriendo, proyectos). It positions itself with broad inventory and search filters — useful for **human comps** and for the **Gap 1** idea (structured extraction of *public* listing pages), not as a substitute for mdeai’s verified inventory.

**Why 84:** Best **national breadth** and standard filters; slightly less “furnished nomad” focus than Casacol/VICO for niche comps. See also **individual reviews** below (Casacol, VICO, etc.).

### How to search (manual / research)

1. **Open** [fincaraiz.com.co](https://www.fincaraiz.com.co/) and use the main **search** area: choose **tipo de propiedad** (e.g. apartamento, casa), then **ubicación** (ciudad → comuna/barrio, e.g. Medellín → Laureles, El Poblado, Envigado, Sabaneta).
2. **Arriendo vs venta:** use top navigation **Arriendo** for rentals and **Venta** for sale. The footer includes shortcuts such as **Apartamentos en Arriendo en Medellín** (and other cities) for quick entry.
3. **Refine:** apply filters (precio, área, habitaciones, estrato if shown) in the results UI — same pattern as most LATAM portals.
4. **By code:** use **“Buscar por código”** if you already have a Fincaraíz listing ID.
5. **Share / repeat:** after filters are set, **copy the URL from the browser address bar** — that URL is the handiest artifact for “save this comp search” or pasting into an internal research doc (exact query-string format may change; treat as opaque).
6. **Mobile:** the site promotes [iOS/Android apps](https://www.fincaraiz.com.co/) for alerts and favorites — useful for brokers, not for mdeai’s web product.

### Suggested additions for this doc / product

| Idea | Purpose |
|------|--------|
| **Paste Fincaraíz search URL into Hermes / ops** | Let staff or agents attach a **single canonical comp search** to a lead or pricing note without building an API. |
| **Gap 1 extract (edge job)** | Nightly or on-demand **structured extract** of listing cards + detail pages via Firecrawl (or similar) with **Zod schemas**, aligned with [`1-trio-real-estate-plan.md`](../real-estate/docs/1-trio-real-estate-plan.md) — only after **legal/ToS** review and `robots.txt` respect. |
| **No unofficial “Fincaraíz API” in prod** | Do not ship scraping as a user-facing search backend; use it only for **internal benchmarks** or **partnership-sourced** feeds if you later get one. |
| **Cross-link Metrocuadrado / Ciencuadras** | Same manual-search pattern: build location + tipo in UI, copy URL, same Gap 1 story for multi-portal comps. |

---

## Medellín listing & comp sites — scores & individual reviews

Scores reflect **mdeai fit**: Medellín **furnished / medium-term** relevance, **human search UX**, usefulness as **comps** (not API quality). **Not** endorsement of scraping — follow ToS and [`Gap 1`](../real-estate/docs/1-trio-real-estate-plan.md).

**Quick index** (scroll for full write-up per row)

| Site | Score |
|------|-------|
| Casacol (EN) | 88 |
| VICO — Medellín | 81 |
| Umbral | 79 |
| LIV Realty Medellín | 77 |
| CozyCozy Medellín STR | 74 |
| FazWaz Medellín rent | 73 |
| Fast.io OpenClaw web research (tooling) | 86 |
| SIXPERCENT | 42 |
| redfincaraiz.com | 22 |

**Fincaraíz** (84/100) is reviewed in **§ Colombian portals** above (national portal; separate from the thin `redfincaraiz.com` domain).

**Suggested manual comp order:** Casacol → Fincaraíz (arriendo, Medellín) → VICO → Umbral → CozyCozy (nightly STR) → LIV / FazWaz as cross-checks.

---

### Casacol (EN) — 88/100

- **URL:** [en.casacol.co](https://en.casacol.co/)
- **What it is:** Curated **furnished** apartment inventory in Medellín (long-term monthly + short-term daily), bilingual site, property-management positioning.
- **Strengths:** Very close to **mdeai ICP** (nomads, families, business travelers); clear filters (bedrooms, amenities, contract term); Poblado/Laureles focus matches your positioning docs.
- **Limits:** Competitor / peer operator — use for **benchmarking**, not as data you ingest without permission; no assumption of open API.
- **mdeai use:** Primary **manual comp** for premium furnished pricing and amenity bundles; screenshot + URL in pricing memos.

---

### VICO — Medellín — 81/100

- **URL:** [getvico.com/en/colombia/medellin](https://getvico.com/en/colombia/medellin)
- **What it is:** **Rooms and entire apartments**, furnished, medium/long stay; strong coverage by **barrio** and university/landmark.
- **Strengths:** **COP** prices visible; distinguishes shared vs entire place — fills the **budget / coliving** lane Casacol doesn’t own.
- **Limits:** Mix of room rentals vs whole units — compare like-for-like; still a live competitor ecosystem.
- **mdeai use:** Comps for **room vs apartment** tradeoffs and Laureles/Poblado/Envigado **price floors**.

---

### Umbral — 79/100

- **URL:** [umbral.co](https://umbral.co/) · example: [arrendamientos apartamentos Medellín](https://umbral.co/arrendamientos-apartamentos-medellin/?negocio=1)
- **What it is:** Large **Antioquia** developer + **arriendos** / ventas / nuevos; institutional funnel (forms, WhatsApp, citas).
- **Strengths:** Deep **local** inventory; filters (ciudad, barrio, tipo de inmueble) match how Colombians search; good for **“new vs used”** mix.
- **Limits:** Heavy UX around leads and credit/marketing consent — research as **browser user**, not headless abuse.
- **mdeai use:** Comps on **developer-grade** stock and **monthly** arriendo listings in core Medellín comunas.

---

### LIV Realty Medellín — 77/100

- **URL:** [livrealtymedellin.com](https://livrealtymedellin.com/)
- **What it is:** **Agency** site — sale + **monthly** furnished rentals, search by destination/keyword/dates; expat-facing copy.
- **Strengths:** Good for **high-end monthly** and **property-management** positioning signals; neighborhood tags (Poblado, Laureles, Envigado).
- **Limits:** Single-agency stock — narrower than portals; verify currency (COP vs USD) per listing.
- **mdeai use:** Benchmark **concierge / PM** tier pricing and listing presentation.

---

### CozyCozy — Medellín STR — 74/100

- **URL:** [cozycozy.com — Medellín short-term](https://www.cozycozy.com/us/medellin-short-term-rentals)
- **What it is:** **Meta-aggregator** across 100+ providers (Airbnb, Booking, Vrbo, etc.) — vacation / **nightly** focus.
- **Strengths:** Single place to see **cross-platform STR** nightly bands and seasonality patterns.
- **Limits:** Not a substitute for **monthly** furnished comps; rates are **OTA-loaded** (fees, cleaning); links out to third parties.
- **mdeai use:** **STR/nightly ceiling** context only — explain “why medium-term on mdeai beats 7-night OTA stacking.”

---

### FazWaz — Medellín rent — 73/100

- **URL:** [fazwaz.com.co — property for rent, Medellín](https://www.fazwaz.com.co/en/property-for-rent/colombia/antioquia/medellin)
- **What it is:** **International** property portal (EN), Antioquia-level search.
- **Strengths:** Useful **sanity check** when comparing against other expat-facing UIs; map/list views familiar to foreign buyers.
- **Limits:** Listings can **stale** vs local portals; always cross-check against Fincaraíz / Casacol.
- **mdeai use:** Secondary **cross-check** for rent bands and copy benchmarks, not primary SoT.

---

### Fast.io — OpenClaw web research (tooling) — 86/100

- **URL:** [fast.io/resources/best-openclaw-skills-web-research/](https://fast.io/resources/best-openclaw-skills-web-research/)
- **What it is:** **Editorial guide** (not a listings site): stacks **Brave Search**, **Agent Browser**, **Playwright**, **Gog**, **Fast.io** memory — plus **robots.txt**, rate limits, ethical scraping.
- **Strengths:** Ties directly to how you should **tool OpenClaw** before pointing agents at Fincaraíz-class sites; links to [ClawHub](https://clawhub.ai/) skill pages.
- **Limits:** Product marketing for Fast.io — still a solid checklist for **research hygiene**.
- **mdeai use:** **Required reading** for anyone wiring Gap 1 / agent browser automation; not a comp source by itself.

---

### SIXPERCENT — 42/100

- **URL:** [sixpercent.ai](https://sixpercent.ai/)
- **What it is:** **Costa Rica** AI real-estate concierge; A2A / agent protocol positioning; OpenClaw mentioned in marketing.
- **Strengths:** Useful **positioning** reference (AI-first brokerage narrative).
- **Limits:** **Wrong geography** for Medellín inventory comps; not a data source for Colombia.
- **mdeai use:** **Competitive storytelling** and agent-protocol ideas — not weekly pricing research.

---

### redfincaraiz.com — 22/100

- **URL:** [redfincaraiz.com](https://redfincaraiz.com/)
- **What it is:** Minimal / placeholder presence vs the real national portal.
- **Strengths:** None identified for research workflows.
- **Limits:** Use **[fincaraiz.com.co](https://www.fincaraiz.com.co/)** for actual **Fincaraíz** search and comps.
- **mdeai use:** **Skip** for comps; avoid confusing with official Fincaraíz.

---

## References

- [Best Airbnb API Providers in 2026: A Full Review | AirROI](https://www.airroi.com/blog/best-airbnb-api-providers) — comparison table, pricing models, coverage vs AirDNA/Mashvisor/Bright Data/RapidAPI.
- [`tasks/real-estate/docs/1-trio-real-estate-plan.md`](../real-estate/docs/1-trio-real-estate-plan.md) — Gap 1 multi-site scraping (Colombian sites + Airbnb via Firecrawl).
- [openbnb-org/mcp-server-airbnb](https://github.com/openbnb-org/mcp-server-airbnb) — MCP tools `airbnb_search` / `airbnb_listing_details`.
- [zxol/airbnbapi](https://github.com/zxol/airbnbapi) — unofficial `airbnbapijs` (educational disclaimer in README).
- [Fincaraíz — Colombia property search](https://www.fincaraiz.com.co/) — venta / arriendo / proyectos; manual search + footer shortcuts by city (e.g. Medellín).
- [Best OpenClaw Skills for Web Research | Fast.io](https://fast.io/resources/best-openclaw-skills-web-research/) — research stack + ethics (robots, rate limits).
- Medellín comps: [Casacol](https://en.casacol.co/), [VICO](https://getvico.com/en/colombia/medellin), [Umbral](https://umbral.co/), [CozyCozy](https://www.cozycozy.com/us/medellin-short-term-rentals), [LIV Realty](https://livrealtymedellin.com/), [FazWaz Medellín](https://www.fazwaz.com.co/en/property-for-rent/colombia/antioquia/medellin).

---

*Last updated: 2026-04-05* — cross-link to [`06-search.md`](06-search.md) for rental search strategy.
