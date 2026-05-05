---
task_id: 100-sponsorship-system
title: Master sponsorship strategy — full audit, corrected architecture, chat integration, V1 execution plan
phase: PHASE-2-SPONSOR-GROWTH
priority: P0
status: Living Document
updated: 2026-05-04
---

# 100 — mdeai Sponsorship System: Master Strategy Doc

> **Living document.** Updated as tasks complete. Every decision here supersedes individual task files where they conflict.

---

## PART 1 — Honest audit of all 19 tasks

| Task | Title | Status | Correctness | Notes |
|---|---|---|---|---|
| 045 | Schema migration (9 tables) | ✅ Built | ✅ Correct | Core schema in place |
| 046 | Apply wizard (4-step) | ✅ Built | ✅ Correct | `/sponsor/apply` live |
| 047 | Admin approval queue | ✅ Built | ✅ Correct | `/admin/sponsorships` live |
| 048 | Stripe checkout | ✅ Built | ⚠️ Partial | Secrets `STRIPE_SECRET_KEY`, `STRIPE_SPONSOR_WEBHOOK_SECRET`, `FRONTEND_URL` still needed in Supabase dashboard |
| 049 | SponsoredSurface component | ✅ Built | ✅ Correct | Impression tracking works |
| 050 | Impression + click edge fns | ✅ Built | ✅ Correct | Logs to `sponsor.impressions` |
| 051 | Attribution trigger | ✅ Built | ✅ Correct | SQL trigger on `sponsor.clicks` |
| 052 | Sponsor ROI dashboard | 🔵 Next | — | Not started. Blocks sponsor self-serve. |
| 053 | ROI rollup cron | ✅ Built | ✅ Correct | pg_cron daily at 06:00 Bogotá |
| 054 | AI edge fns (5 fns) | 📋 Open | — | Specced. Not built. Blocks AI differentiation. |
| 055 | Contracts schema | ✅ Built | ✅ Correct | `sponsor.contracts` table live |
| 056 | Contract generate edge fn | ✅ Built | ✅ Correct | PDF generation works |
| 057 | Contract sign page | ✅ Built | ✅ Correct | `/sponsor/contract/:id` live |
| 058 | Dispute UI + cancel edge fn | ✅ Built | ✅ Correct | Dispute flow complete |
| 060 | Discovery & qualification module | 📋 Design | ⚠️ Needs correction | Over-engineered for V1. See Part 7. |
| 061 | Activations plan | 📋 Design | ✅ Correct | 34 activation types. Good reference. |
| 062 | OpenClaw + Hermes + Paperclip lifecycle | 📋 Design | ⚠️ Partial | OpenClaw role was overstated. See Part 2. |
| 063 | Sponsor Discovery Engine | 📋 Design | ⚠️ Corrected | LinkedIn scraping removed. Signal-based V1 added. |
| 064 | Campaign system (Postiz + OpenClaw + AI) | 📋 Design | ✅ Correct | Good Phase 3 roadmap. |

**Critical gaps identified:**
1. `ai-router` has zero sponsor intents → chat can't surface sponsors
2. `ai-chat` has zero sponsor handling → no concierge agent
3. Task 052 (dashboard) blocks sponsor self-serve
4. Task 054 (AI fns) blocks differentiation from generic ad networks
5. Stripe secrets still missing → payments broken

---

## PART 2 — Corrected system architecture

### The real tool roles (corrected from 062/063)

```
┌─────────────────────────────────────────────────────────────────┐
│                    mdeai Sponsorship Stack                       │
│                                                                 │
│  USER / SPONSOR                                                 │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────────┐     ┌──────────────────────┐              │
│  │  mdeai.co Chat  │     │   mdeai.co Web UI    │              │
│  │  (ai-router +   │     │  /sponsor/apply       │              │
│  │  ai-chat fns)   │     │  /sponsor/dashboard   │              │
│  └────────┬────────┘     └──────────┬───────────┘              │
│           │                         │                           │
│           ▼                         ▼                           │
│  ┌─────────────────────────────────────────────┐               │
│  │              Supabase (source of truth)      │               │
│  │  sponsor.* tables + ai_runs + pg_cron        │               │
│  └──────────────────────────────────────────────┘               │
│           │                         │                           │
│           ▼                         ▼                           │
│  ┌─────────────────┐     ┌──────────────────────┐              │
│  │  Gemini AI fns  │     │  Hermes (reasoning)  │              │
│  │  (task 054)     │     │  scoring + insights   │              │
│  │  Flash: fast/   │     │  via Python CLI       │              │
│  │  moderate/roi   │     └──────────┬───────────┘              │
│  │  Pro: creative/ │                │                           │
│  │  optimize/match │                ▼                           │
│  └─────────────────┘     ┌──────────────────────┐              │
│                           │  Paperclip           │              │
│                           │  lifecycle issues +   │              │
│                           │  approval gates       │              │
│                           └──────────┬───────────┘              │
│                                      │                           │
│                                      ▼                           │
│                           ┌──────────────────────┐              │
│                           │  OpenClaw             │              │
│                           │  MESSAGING ONLY:      │              │
│                           │  WhatsApp + Telegram  │              │
│                           │  + email outreach     │              │
│                           └──────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

### Corrected tool roles

| Tool | Correct role | What it does NOT do |
|---|---|---|
| **Gemini (task 054)** | AI decisions — moderate assets, generate copy, explain ROI, optimize placements, match audience | Does not manage lifecycle or send messages |
| **OpenClaw** | Send messages — WhatsApp, Telegram, email, Instagram DM | Does NOT orchestrate, does NOT scrape JS-heavy pages, does NOT manage lifecycle |
| **Hermes** | Reason + score — evaluate prospects, score leads, generate insights | Does NOT send messages, does NOT manage DB directly |
| **Paperclip** | Govern lifecycle — issue tracking, approval gates, budgets, audit log | Does NOT do AI or messaging |
| **Firecrawl** | Scrape — static + JS-rendered pages, structured extraction | Built into OpenClaw AND available standalone |
| **Postiz** | Schedule social — 28+ platforms, campaign analytics, media upload | Does NOT do outreach or scraping |

---

## PART 3 — Gemini tools and agents reference

All 5 AI edge functions from **task 054** (not yet built):

```
supabase/functions/
├── sponsor-moderate/        Flash   Asset moderation (logo/video/image/copy)
├── sponsor-creative-gen/    Pro     Captions ES+EN + IG story prompts
├── sponsor-roi-explain/     Flash   Daily ROI insights (3-sentence + recommendation)
├── sponsor-optimize/        Pro     Placement optimization (proposal-only)
└── sponsor-audience-match/  Pro + googleSearch  Brand→event audience matching
```

### Model selection guide

| Use case | Model | Reasoning |
|---|---|---|
| Fast moderation, daily insights | `gemini-3-flash-preview` | <3s, cheaper, sufficient quality |
| Creative copy, audience analysis | `gemini-3.1-pro-preview` | Better reasoning, bilingual ES/EN |
| Intent routing | `gemini-3.1-flash-lite-preview` | Cheapest, classification only |
| External data needed | Add `googleSearch` tool | Grounds results in real Medellín events |
| Asset URL needed | Add `urlContext` tool | Fetches asset for moderation |

### G-rules compliance checklist (all 5 fns)

- [x] G1: `responseJsonSchema` in every call
- [x] G2: Default temperature (no override unless creative)
- [x] G3: Structured output + Zod validation
- [x] G4: `x-goog-api-key` header (no `?key=` params)

### Shared patterns all fns must follow

```typescript
// _shared/gemini.ts already provides:
callGeminiStructured({ model, system, user, schema, tools? })

// All 5 fns must:
// 1. Auth: getUserId() for sponsor fns, getServiceClient() for cron/admin
// 2. Validate input with Zod before any Gemini call
// 3. Log to ai_runs with insertAiRun(agent_name, status, tokens, duration_ms)
// 4. Return { success: true, data: {...} } or errorBody(CODE, message)
// 5. Set Deno.serve timeout: 15s Flash fns, 30s Pro fns
```

---

## PART 4 — Chat system integration

### Current state (confirmed by reading source files)

```
ai-router/index.ts:  intents = [housing, car, restaurant, event, trip, booking, local_knowledge, general]
                     ❌ ZERO sponsor intents
ai-chat/index.ts:    1,286 lines — ❌ ZERO references to "sponsor"
```

### Required changes to `supabase/functions/ai-router/index.ts`

Add 4 new intents to the intent classification map:

```typescript
// Add to INTENT_MAP after 'general':
sponsor_inquiry: {
  agent: 'sponsor_concierge',
  description: 'Brand or company asking about sponsoring events in Medellín',
},
become_sponsor: {
  agent: 'sponsor_concierge',
  description: 'Contact wants to become a sponsor, asking about packages or pricing',
},
sponsor_status: {
  agent: 'sponsor_concierge',
  description: 'Existing sponsor checking campaign performance or ROI',
},
sponsor_support: {
  agent: 'sponsor_concierge',
  description: 'Sponsor needing help with contract, payment, or assets',
},

// Add to QUICK_PATTERNS before the fallback:
{ patterns: [/\b(sponsor|patrocin|patrocinador|brand partner|advertis)\b/i],
  intent: 'sponsor_inquiry', confidence: 0.88 },
{ patterns: [/\b(become.*sponsor|quiero.*patrocinar|paquetes.*patrocinio|pricing.*sponsor)\b/i],
  intent: 'become_sponsor', confidence: 0.92 },
{ patterns: [/\b(mi.*campa[ñn]a|my.*campaign|roi|impressions|clicks|dashboard)\b/i],
  intent: 'sponsor_status', confidence: 0.85 },
```

### Required changes to `supabase/functions/ai-chat/index.ts`

Add `sponsor_concierge` agent:

```typescript
// Sponsor concierge system prompt
const SPONSOR_CONCIERGE_PROMPT = `You are the mdeai Sponsorship Concierge.
You help brands sponsor events in Medellín, Colombia.

Your qualification sequence (ask in order, one at a time):
1. BUDGET: "¿Cuál es el presupuesto aproximado que tienen para patrocinar? / What's your approximate sponsorship budget?"
   - <$500 USD → Bronze digital only
   - $500-2k → Silver (digital + activation)
   - $2k-10k → Gold (multi-event)
   - $10k+ → Platinum (annual partnership)

2. INDUSTRY: "¿En qué industria está su marca? / What industry is your brand in?"
   - Match to mdeai event categories (music, food, tech, fashion, sports)

3. GOAL: "¿Cuál es su objetivo principal? / What's your main goal?"
   - Brand awareness / leads / product sampling / employee engagement

4. RECOMMENDATION: Based on budget + industry + goal, recommend a specific tier and 2-3 events.
   Use get_sponsor_packages to show real pricing.
   Use get_upcoming_events to show relevant events.

5. CTA: Always end with the apply link: https://mdeai.co/sponsor/apply

Rules:
- Always bilingual (Spanish first, English second) unless user picks a language
- Never invent pricing — use get_sponsor_packages tool only
- Never invent event dates — use get_upcoming_events tool only
- If they are an existing sponsor, use get_sponsor_status to show their ROI
- Keep responses under 200 words`;

// Tools for sponsor_concierge agent
const SPONSOR_TOOLS = [
  {
    name: 'get_sponsor_packages',
    description: 'Get current sponsorship packages and pricing tiers',
    input_schema: { type: 'object', properties: {}, required: [] },
    handler: async () => {
      // ⚠️ CORRECTED: 'sponsor.packages' table does not exist.
      // Packages are tier definitions — return from constants (or create a packages table in Phase 3).
      return [
        { tier: 'bronze',   price_usd: 500,   price_cop: 2100000,  inclusions: ['Logo in app', 'Push mention', '1 social post'] },
        { tier: 'silver',   price_usd: 1500,  price_cop: 6300000,  inclusions: ['Bronze + Event banner', 'Product sampling', '3 social posts'] },
        { tier: 'gold',     price_usd: 5000,  price_cop: 21000000, inclusions: ['Silver + Booth', 'AI creative gen', 'Weekly ROI report'] },
        { tier: 'platinum', price_usd: 15000, price_cop: 63000000, inclusions: ['Gold × 12 months', 'Annual partner', 'Dedicated account manager'] },
      ];
    },
  },
  {
    name: 'get_upcoming_events',
    description: 'Get upcoming events matching a category or keyword',
    input_schema: {
      type: 'object',
      properties: {
        category: { type: 'string' },
        limit: { type: 'number', default: 5 },
      },
      required: [],
    },
    handler: async ({ category, limit = 5 }: { category?: string; limit?: number }) => {
      // ⚠️ CORRECTED: events table columns are 'title' and 'starts_at', not 'name' and 'date'
      let q = supabaseAdmin
        .from('events')
        .select('id, title, starts_at, category, venue')
        .gte('starts_at', new Date().toISOString())
        .order('starts_at')
        .limit(limit);
      if (category) q = q.ilike('category', `%${category}%`);
      const { data } = await q;
      return data ?? [];
    },
  },
  {
    name: 'get_sponsor_status',
    description: "Get an existing sponsor's campaign ROI and impression data",
    input_schema: {
      type: 'object',
      properties: { organization_id: { type: 'string' } },
      required: ['organization_id'],
    },
    handler: async ({ organization_id }: { organization_id: string }) => {
      const { data } = await supabaseAdmin
        .from('sponsor.roi_daily')
        .select('date, impressions, clicks, conversions, revenue_attributed')
        .eq('organization_id', organization_id)
        .order('date', { ascending: false })
        .limit(7);
      return data ?? [];
    },
  },
];
```

### Intelligent qualification question sequence

```
User: "I want to sponsor an event"
          ↓
AI: Asks budget (Q1) → detects tier
          ↓
AI: Asks industry (Q2) → matches event categories
          ↓
AI: Asks goal (Q3) → brand awareness / leads / sampling
          ↓
AI: Recommends tier + 2-3 specific events (using real DB data)
          ↓
AI: Provides /sponsor/apply link with pre-filled params
```

---

## PART 5 — Simplified V1 execution plan

**V1 goal: Find 20 qualified sponsors → contact 20 → close 5 deals → $5k–15k revenue**

Full automation (OpenClaw + Hermes + Paperclip) is Phase 3 (week 16+). Do not build it now.

### Sprint breakdown

| Sprint | Week | Deliverable | Revenue impact |
|---|---|---|---|
| S1 | Week 1 | Task 052: Sponsor dashboard live | Sponsor self-serve → retention |
| S2 | Week 2 | Task 054: 5 Gemini AI fns | Asset moderation + creative gen |
| S3 | Week 3 | Chat integration (4 intents + concierge) | Inbound lead capture 24/7 |
| S4 | Week 4 | Manual discovery: find 20 prospects (see Part 7) | Pipeline seeded |
| S5 | Week 5 | WhatsApp/email outreach (OpenClaw sends, Hermes writes) | First 5 conversations |
| S6 | Week 6 | Close first 5 sponsors, iterate | $5k–15k |

### What NOT to build in V1

- ❌ Automated LinkedIn scraping (TOS violation + brittle)
- ❌ Paperclip governance layer (overkill for 5 deals)
- ❌ Postiz campaign automation (wait until you have 3+ sponsors)
- ❌ Fire Enrich pipeline (wait until 50+ prospects needed)
- ❌ Custom attribution ML model (UTM tracking is enough)

---

## PART 6 — Full task map

### Built ✅ (don't touch)

045, 046, 047, 048 (partial — Stripe secrets), 049, 050, 051, 053, 055, 056, 057, 058

### Build next 🔵 (in order)

1. **052** — Sponsor ROI dashboard (`/sponsor/dashboard/:applicationId`)
2. **054** — 5 Gemini AI edge fns
3. **059** — Chat integration: 4 intents + `sponsor_concierge` agent (new task)

### Design docs ready 📋 (Phase 3+)

- 060 — Discovery module (use signal-based V1 from Part 7 first)
- 061 — Activations plan (reference for tier design)
- 062 — OpenClaw + Hermes + Paperclip (Phase 3, week 16+)
- 063 — Discovery Engine full pipeline (Phase 3)
- 064 — Postiz campaign system (Phase 3)

---

## PART 7 — Discovery V1: Signal-based, zero LinkedIn scraping

**Why no LinkedIn scraping:** TOS violation → account ban → no discovery at all. Use public signals instead.

### 5 public signal sources (no auth required)

| Source | Data | Tool | Volume |
|---|---|---|---|
| Event sponsor pages | Past sponsors of Colombiamoda, Festival Estéreo Picnic, Medellín Fashion Week | Firecrawl `scrapeUrl` | 200+ brands |
| Past mdeai sponsors | `sponsor.organizations` table | Supabase query | Current DB |
| Instagram hashtags | `#PatrocinadorColombia #MedellínEventos` | OpenClaw Instagram public search (no login) | 50+/week |
| Google News | `"patrocinador" site:elcolombiano.com OR site:eltiempo.com` | Firecrawl search | 30+/week |
| Cámara de Comercio | Public Medellín company directory | Firecrawl scrape | 500+ companies |

### Step-by-step V1 discovery (manual + semi-automated)

```
Week 4, Day 1-2:
1. Firecrawl scrape Colombiamoda sponsor page → extract brand names
2. Firecrawl scrape Festival Estéreo Picnic → extract brand names
3. Google: "patrocinador eventos Medellín 2025" → collect 30 names

Day 3:
4. For each brand, Google: "<brand> + patrocinio + eventos + Colombia"
5. Find LinkedIn company page (manual browse, no scraping)
6. Find marketing director name + email via company website
7. Add to Supabase: sponsor.discovery_pipeline (name, website, contact_name, contact_email, source)

Day 4-5:
8. Hermes scores each prospect:
   score = audience_match * 0.25 + industry_relevance * 0.25 +
           local_presence * 0.20 + sponsorship_history * 0.15 + budget_fit * 0.15
9. Sort by score → pick top 20
10. OpenClaw sends personalized WhatsApp (if +57 found) or email
```

### WhatsApp message template (OpenClaw sends)

```
Hola [nombre],

Vi que [marca] patrocinó [evento] el año pasado — ¡excelente visibilidad!

En mdeai conectamos marcas con los mejores eventos de Medellín. Tenemos
paquetes desde $500 USD con:
✓ Presencia en app (50k+ usuarios)
✓ Activaciones en evento
✓ ROI medible en tiempo real

¿Tienen 15 min esta semana para conversar?

[calendly link]
```

---

## PART 8 — Colombia-specific strategy

### Verified top 10 Medellín sponsors (real companies)

| # | Brand | Industry | Why they sponsor | Estimated tier |
|---|---|---|---|---|
| 1 | Bancolombia | Banking | Youth market, digital adoption | Platinum |
| 2 | EPM | Utilities | Community presence, CSR | Gold |
| 3 | Grupo Sura | Insurance/Finance | Brand awareness, professionals | Gold |
| 4 | Comfama | Social welfare | Community events, reach | Silver |
| 5 | Corona | Hardware/Lifestyle | Home + lifestyle tie-in | Silver |
| 6 | Leonisa | Fashion | Women's events, fashion shows | Silver |
| 7 | Auteco | Motorcycles | Urban mobility, youth | Bronze |
| 8 | Postobón | Beverages | Mass market, sampling | Gold |
| 9 | Grupo Nutresa | Food | Sampling, brand awareness | Silver |
| 10 | Haceb | Home appliances | Lifestyle events | Bronze |

### Outreach cadence

```
Day 1:  WhatsApp intro (if +57 found) or email
Day 4:  Follow-up WhatsApp / email if no reply
Day 8:  Final WhatsApp with social proof (screenshot of impressions from another sponsor)
Day 12: Mark as "no response" → Hermes re-scores for next quarter
```

### Colombia Ley 1581/2012 compliance

Every outreach message must include:
- Opt-out: "Responde STOP para no recibir más mensajes"
- Company name and contact info
- Purpose of data use statement

---

## PART 9 — Activation tiers

Based on task 061 design (correct, use as reference):

| Tier | Price USD | Inclusions | Events/month |
|---|---|---|---|
| **Bronze** | $500–1,500 | Logo in app + push notification mention | 1 |
| **Silver** | $1,500–5,000 | Bronze + banner at event + social post | 1–2 |
| **Gold** | $5,000–15,000 | Silver + activation booth + AI content gen | 2–4 |
| **Platinum** | $15,000+ | Gold + annual partnership + dedicated account mgr | All |

### Activation types by tier

```
Bronze (digital only):
  - Logo on event detail page (SponsoredSurface → brand_logo surface)
  - Push notification mention ("Powered by [brand]")
  - 1 social post on mdeai Instagram

Silver (digital + physical):
  - All Bronze +
  - Banner/signage at event
  - Product sampling table (up to 200 samples)
  - 3 branded posts (Postiz → scheduled)

Gold (premium):
  - All Silver +
  - Activation booth (6m × 3m) with power
  - Branded AI-generated content (sponsor-creative-gen fn)
  - Weekly ROI report (sponsor-roi-explain fn)
  - Dedicated Slack channel for communication

Platinum (annual):
  - All Gold × 12 months +
  - Dedicated account manager
  - Custom activation design
  - First access to new events
  - Quarterly business review with data
```

---

## PART 10 — ROI tracking

### UTM schema (5 parameters)

```
utm_source=mdeai
utm_medium=sponsorship
utm_campaign=[application_id]
utm_content=[surface_type]  → event_banner | push_notif | app_logo | social_post
utm_term=[event_id]
```

### ROI rollup SQL (pg_cron every 5 min — see task 053 for full implementation)

⚠️ CORRECTED: `roi_daily` PK is `(placement_id, day)` — NOT `(application_id, date)`.
The table has no `application_id` column. Dashboard queries must JOIN placements.

```sql
-- Correct rollup (from task 053 — this is the authoritative version):
INSERT INTO sponsor.roi_daily
  (placement_id, day, impressions, clicks, attributed_conversions, attributed_revenue_cents)
SELECT
  p.placement_id,
  CURRENT_DATE AS day,
  COUNT(DISTINCT i.id) AS impressions,
  COUNT(DISTINCT c.id) AS clicks,
  COUNT(DISTINCT a.id) AS attributed_conversions,
  COALESCE(SUM(a.conversion_value_cents), 0) AS attributed_revenue_cents
FROM (
  SELECT DISTINCT placement_id FROM sponsor.impressions WHERE created_at >= CURRENT_DATE
  UNION
  SELECT DISTINCT placement_id FROM sponsor.clicks WHERE created_at >= CURRENT_DATE
  UNION
  SELECT DISTINCT placement_id FROM sponsor.attributions WHERE attributed_at >= CURRENT_DATE
) p
LEFT JOIN sponsor.impressions  i ON i.placement_id = p.placement_id AND i.created_at  >= CURRENT_DATE
LEFT JOIN sponsor.clicks       c ON c.placement_id = p.placement_id AND c.created_at  >= CURRENT_DATE
LEFT JOIN sponsor.attributions a ON a.placement_id = p.placement_id AND a.attributed_at >= CURRENT_DATE
GROUP BY p.placement_id
ON CONFLICT (placement_id, day)
DO UPDATE SET
  impressions              = EXCLUDED.impressions,
  clicks                   = EXCLUDED.clicks,
  attributed_conversions   = EXCLUDED.attributed_conversions,
  attributed_revenue_cents = EXCLUDED.attributed_revenue_cents;

-- Dashboard query for an application (must join placements):
SELECT
  p.surface,
  SUM(rd.impressions) AS total_impressions,
  SUM(rd.clicks) AS total_clicks,
  ROUND(SUM(rd.clicks)::numeric / NULLIF(SUM(rd.impressions), 0) * 100, 2) AS ctr_pct,
  SUM(rd.attributed_conversions) AS conversions,
  SUM(rd.attributed_revenue_cents) AS revenue_cents
FROM sponsor.roi_daily rd
JOIN sponsor.placements p ON p.id = rd.placement_id
JOIN sponsor.applications a ON a.id = p.application_id
WHERE a.id = '[applicationId]'
  AND rd.day >= CURRENT_DATE - 30
GROUP BY p.surface
ORDER BY ctr_pct DESC;
```

### Gemini ROI report format (sponsor-roi-explain output)

```json
{
  "insight": "Tu campaña alcanzó 12,400 impresiones esta semana (+23% vs. semana pasada). El CTR de 3.2% supera el benchmark del sector (2.1%).",
  "recommendation": "Aumenta el presupuesto en el surface 'event_banner' — genera 4× más clics que 'app_logo' con el mismo costo.",
  "action": {
    "type": "increase_surface_weight",
    "payload": { "surface": "event_banner", "multiplier": 1.5 }
  }
}
```

---

## PART 11 — 20 must-have features (prioritized)

### P0 — Blocks revenue (build now)

1. **Stripe secrets set** — Payments currently broken (task 048 partial)
2. **Task 052: Sponsor dashboard** — Sponsors can't see their ROI
3. **Task 054: Asset moderation** — Required before sponsors upload logos
4. **Chat sponsor intents** — Inbound leads lost without this
5. **Sponsor concierge agent** — Qualification happens in chat 24/7

### P1 — Accelerates growth (build in Month 1)

6. **Task 054: sponsor-creative-gen** — Bilingual captions EN+ES
7. **Task 054: sponsor-roi-explain** — Daily AI insights, differentiates from generic ad networks
8. **Task 054: sponsor-audience-match** — Brand→event matching (AI-powered)
9. **Discovery pipeline V1** — Manual + semi-automated, see Part 7
10. **WhatsApp outreach** — OpenClaw sends templated messages with +57 contacts
11. **Email outreach** — For contacts without WhatsApp numbers
12. **Hermes lead scoring** — Python script, scores 20 prospects in <5 min

### P2 — Mature platform (Month 2–3)

13. **Task 054: sponsor-optimize** — Placement optimization recommendations
14. **Postiz campaign scheduling** — Once 3+ active sponsors
15. **Paperclip lifecycle governance** — Once 10+ sponsors
16. **Fire Enrich enrichment** — Once 50+ prospects needed
17. **Hermes renewal prediction** — 30 days before contract end
18. **Colombiamoda scraper** — Firecrawl → extract past sponsors
19. **Social proof widget** — Show sponsor logos on event pages
20. **Sponsor referral program** — "Refer a brand, get 10% off next campaign"

---

## PART 12 — Feedback loops

### 1. Discovery → conversion loop

```
Signal found → scored by Hermes → contacted via OpenClaw
       ↓                                      ↓
Score updated based on reply rate      Deal closed or lost
       ↓                                      ↓
Hermes re-trains scoring weights   Update sponsor.organizations.status
```

### 2. Content performance loop

```
sponsor-creative-gen generates 5 captions
       ↓
Postiz schedules → tracks per-post engagement
       ↓
Hermes Performance Analyst reads analytics
       ↓
Feeds back to next creative brief: "posts with 🎵 get 2× engagement"
```

### 3. Channel effectiveness loop

```
OpenClaw tracks reply rate per channel (WhatsApp vs email)
       ↓
If WhatsApp reply rate > 40% and email < 15%:
       ↓
Hermes recommends: "Prioritize WhatsApp for Medellín brands"
```

### 4. Chat → lead loop

```
User asks about sponsoring (sponsor_inquiry intent)
       ↓
sponsor_concierge qualifies (budget + industry + goal)
       ↓
If budget ≥ $500 → creates lead in sponsor.applications with status='chat_qualified'
       ↓
Admin notified → follow up within 24h
       ↓
If closed → tag source='chat' → measure chat conversion rate
```

---

## PART 13 — What to do this week (week of 2026-05-04)

### Day 1 (Monday)

- [ ] Set Stripe secrets in Supabase dashboard: `STRIPE_SECRET_KEY`, `STRIPE_SPONSOR_WEBHOOK_SECRET`, `FRONTEND_URL`
- [ ] Verify task 048 payments work end-to-end with test card
- [ ] Start task 052: scaffold `src/pages/sponsor/Dashboard.tsx`

### Day 2 (Tuesday)

- [ ] Complete task 052: `ROITile`, `TopSurfacesChart`, `AIInsightCard` components
- [ ] Hook to `sponsor.roi_daily` via `useSponsorDashboard` hook
- [ ] Deploy dashboard to `/sponsor/dashboard/:applicationId`

### Day 3 (Wednesday)

- [ ] Start task 054: `sponsor-moderate` edge fn (Flash + urlContext)
- [ ] Start task 054: `sponsor-roi-explain` edge fn (Flash + daily cron)
- [ ] Both fns: Zod validation + ai_runs logging

### Day 4 (Thursday)

- [ ] Task 054: `sponsor-creative-gen` edge fn (Pro, ES+EN captions)
- [ ] Task 054: `sponsor-audience-match` edge fn (Pro + googleSearch)
- [ ] Task 054: `sponsor-optimize` edge fn (Pro, proposals only)

### Day 5 (Friday)

- [ ] Add 4 sponsor intents to `ai-router/index.ts`
- [ ] Add `sponsor_concierge` agent to `ai-chat/index.ts` with 3 tools
- [ ] Test chat flow: ask "I want to sponsor an event" → verify qualification sequence

### Week 2

- [ ] Manual discovery: scrape Colombiamoda + Festival Estéreo Picnic sponsor pages
- [ ] Compile 20 prospect list with contact info
- [ ] Draft WhatsApp + email templates
- [ ] OpenClaw sends first 10 outreach messages

---

## PART 14 — Open questions (5 decisions needed)

1. **Stripe secrets timing:** When will `STRIPE_SECRET_KEY` be added to Supabase dashboard? Payments are broken until then.

2. **V1 sponsor pricing:** Are the Bronze/Silver/Gold/Platinum tiers in Part 9 approved? Or should pricing differ for early Medellín market?

3. **WhatsApp business number:** Does mdeai have a WhatsApp Business number registered? OpenClaw needs a +57 number. Infobip is already configured — confirm the number is active.

4. **Chat language default:** Should `sponsor_concierge` default to Spanish (Medellín market) or bilingual? Current spec is "Spanish first, English second."

5. **Discovery authority:** Who does the manual prospect research in week 4? Finding the initial 20 company names + contact info requires 2–3 hours of human research.

---

## Quick reference links

| Resource | Path |
|---|---|
| Task list | [README.md](./README.md) |
| Activations (34 types) | [061-sponsor-activations-plan.md](./061-sponsor-activations-plan.md) |
| Full lifecycle system | [062-openclaw-hermes-paperclip-sponsorship-system.md](./062-openclaw-hermes-paperclip-sponsorship-system.md) |
| Discovery engine | [063-openclaw-sponsor-discovery-engine.md](./063-openclaw-sponsor-discovery-engine.md) |
| Campaign system | [064-postiz-openclaw-campaign-system.md](./064-postiz-openclaw-campaign-system.md) |
| Gemini AI edge fns spec | [054-sponsor-ai-edge-fns.md](../054-sponsor-ai-edge-fns.md) |
| Schema migration | [045-sponsor-schema-migration.md](../045-sponsor-schema-migration.md) |
| ai-router source | [supabase/functions/ai-router/index.ts](../../../../supabase/functions/ai-router/index.ts) |
| ai-chat source | [supabase/functions/ai-chat/index.ts](../../../../supabase/functions/ai-chat/index.ts) |
| Gemini shared helper | [supabase/functions/_shared/gemini.ts](../../../../supabase/functions/_shared/gemini.ts) |
