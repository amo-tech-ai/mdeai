---
task_id: 060-sponsor-discovery-qualification-module
title: Sponsor Discovery & Qualification Module — Medellín / Colombia
phase: PHASE-3-MARKETPLACE
priority: P1
status: Design
estimated_effort: 6–8 weeks
area: backend + AI + frontend
depends_on:
  - '045-sponsor-schema-migration'
  - '052-sponsor-dashboard'
  - '054-sponsor-ai-edge-fns'
---

# Sponsor Discovery & Qualification Module

> Production-ready design for automated sponsor finding, scoring, matching, and outreach
> tuned for Medellín, Colombia, and broader LATAM context.

---

## A. System Architecture

### DB Schema

```sql
-- ── sponsor_discovery schema ────────────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS sponsor_discovery;

-- Prospect companies (pre-application)
CREATE TABLE sponsor_discovery.prospects (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name          text NOT NULL,
  website               text,
  instagram_handle      text,
  tiktok_handle         text,
  linkedin_url          text,
  whatsapp_number       text,                 -- +57 format, Colombia
  contact_name          text,
  contact_email         text,
  contact_title         text,

  -- Classification
  industry              text NOT NULL,        -- see INDUSTRY_SEGMENTS below
  subcategory           text,
  hq_city               text DEFAULT 'Medellín',
  hq_country            text DEFAULT 'CO',
  employee_count_band   text,                 -- '1-10','11-50','51-200','201+'
  estimated_budget_tier text CHECK (estimated_budget_tier IN
                          ('micro','bronze','silver','gold','title')),

  -- Enrichment state
  enrichment_status     text NOT NULL DEFAULT 'pending'
                          CHECK (enrichment_status IN
                          ('pending','in_progress','complete','failed')),
  enrichment_data       jsonb NOT NULL DEFAULT '{}',
  -- enrichment_data keys:
  --   brand_positioning: text
  --   audience_description: text
  --   campaign_style: text (digital/influencer/physical/mixed)
  --   instagram_followers: int
  --   tiktok_followers: int
  --   avg_post_engagement_rate: float
  --   past_sponsorships: jsonb[]  {event_name, year, type, estimated_value}
  --   sponsorship_frequency: text (never/one-time/occasional/active)
  --   sponsor_signals: text[]    ['powered by logo on X', 'IG story tag Y']

  -- Scoring
  sponsor_fit_score     float,               -- 0.0–1.0 computed score
  score_breakdown       jsonb,               -- per-dimension breakdown
  score_computed_at     timestamptz,

  -- CRM state
  crm_status            text NOT NULL DEFAULT 'prospect'
                          CHECK (crm_status IN
                          ('prospect','contacted','responded','qualified',
                           'applied','converted','rejected','dormant')),
  last_contacted_at     timestamptz,
  last_response_at      timestamptz,
  notes                 text,
  assigned_to           uuid REFERENCES auth.users(id),

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  UNIQUE (website),
  UNIQUE (instagram_handle)
);

-- Many prospects ↔ many events (ranked match)
CREATE TABLE sponsor_discovery.event_matches (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id     uuid NOT NULL REFERENCES sponsor_discovery.prospects(id) ON DELETE CASCADE,
  event_id        uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  match_score     float NOT NULL,             -- 0.0–1.0
  match_breakdown jsonb NOT NULL DEFAULT '{}',
  rank            int,                        -- 1 = best fit for this event
  recommended_tier text,                      -- bronze/silver/gold/title
  recommended_surfaces text[],               -- ['contest_header','qr_station']
  outreach_status text NOT NULL DEFAULT 'pending'
                    CHECK (outreach_status IN
                    ('pending','queued','sent','opened','replied',
                     'meeting_booked','declined')),
  outreach_channel text,                     -- whatsapp/email/instagram/linkedin
  created_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE (prospect_id, event_id)
);

-- Outreach messages log
CREATE TABLE sponsor_discovery.outreach_messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id      uuid NOT NULL REFERENCES sponsor_discovery.event_matches(id) ON DELETE CASCADE,
  channel       text NOT NULL,               -- whatsapp/email/instagram/linkedin
  direction     text NOT NULL CHECK (direction IN ('outbound','inbound')),
  body          text NOT NULL,
  sent_at       timestamptz,
  opened_at     timestamptz,
  replied_at    timestamptz,
  external_id   text,                        -- Infobip message ID / email thread ID
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Enrichment job queue (processed by edge fn / n8n)
CREATE TABLE sponsor_discovery.enrichment_jobs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id   uuid NOT NULL REFERENCES sponsor_discovery.prospects(id) ON DELETE CASCADE,
  status        text NOT NULL DEFAULT 'queued'
                  CHECK (status IN ('queued','running','done','failed')),
  source        text NOT NULL,               -- 'firecrawl'/'openclaw'/'manual'
  result        jsonb,
  error         text,
  started_at    timestamptz,
  completed_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE sponsor_discovery.prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_discovery.event_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_discovery.outreach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_discovery.enrichment_jobs ENABLE ROW LEVEL SECURITY;

-- Admin-only (service_role handles writes from edge fns / n8n)
CREATE POLICY "admin_read_prospects" ON sponsor_discovery.prospects
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role IN ('admin','super_admin')
  ));
```

**Indexes:**
```sql
CREATE INDEX prospects_industry_idx    ON sponsor_discovery.prospects(industry);
CREATE INDEX prospects_city_idx        ON sponsor_discovery.prospects(hq_city);
CREATE INDEX prospects_score_idx       ON sponsor_discovery.prospects(sponsor_fit_score DESC)
  WHERE sponsor_fit_score IS NOT NULL;
CREATE INDEX prospects_crm_idx         ON sponsor_discovery.prospects(crm_status);
CREATE INDEX event_matches_event_idx   ON sponsor_discovery.event_matches(event_id, match_score DESC);
CREATE INDEX event_matches_prospect_idx ON sponsor_discovery.event_matches(prospect_id);
```

---

### API Endpoints (Supabase Edge Functions)

```
POST /functions/v1/sponsor-discovery-search
  Auth: admin JWT
  Body: { industry?, city?, budget_tier?, crm_status?, limit?, offset? }
  → returns ranked prospects list with scores

POST /functions/v1/sponsor-discovery-enrich
  Auth: admin JWT / service_role (called by n8n)
  Body: { prospect_id: uuid }
  → triggers enrichment job: Firecrawl scrape + Gemini classification
  → updates prospects.enrichment_data + enrichment_status

POST /functions/v1/sponsor-discovery-score
  Auth: admin JWT / service_role
  Body: { prospect_id: uuid, event_id?: uuid }
  → computes sponsor_fit_score + event match_score
  → upserts into event_matches

POST /functions/v1/sponsor-discovery-outreach
  Auth: admin JWT
  Body: { match_id: uuid, channel: string, message?: string }
  → generates AI message if message not provided
  → sends via Infobip (WhatsApp) / Resend (email) / manual flag (Instagram/LinkedIn)
  → inserts outreach_messages row

GET  /functions/v1/sponsor-discovery-matches?event_id=xxx&limit=10
  Auth: admin JWT (organizer)
  → returns top-ranked sponsors for an event with recommended tier + surfaces

POST /functions/v1/sponsor-discovery-import
  Auth: admin JWT
  Body: { prospects: ProspectInput[] }  (CSV import or manual bulk add)
  → batch upsert into prospects, queue enrichment jobs
```

---

## B. AI Agent Pipeline (Step-by-Step)

### Step 1 — Discovery (automated, triggered on event publish)

```
Trigger: organizer publishes event → webhook fires

Agent: sponsor-discovery-agent (n8n workflow)

1a. Build search queries from event metadata:
    event.tags         → ['beauty','pageant','fashion','Medellín']
    event.industry     → 'entertainment'
    event.audience_demographics → {gender: 'F 72%', age: '18-34', city: 'Medellín'}

1b. Google search (via Firecrawl or SerpAPI):
    Queries generated by Gemini Flash:
    - "patrocinador [event_tag] Medellín [year]"
    - "sponsor colombiano belleza moda events"
    - "powered by [category] Colombia evento"
    - "[brand] patrocinó [category] Medellín"

1c. LinkedIn company scrape (OpenClaw):
    - Search: industry=[category], location=Medellín or Colombia
    - Filter: 11–500 employees (SMB to enterprise)
    - Extract: company_name, website, linkedin_url, employee_count, description

1d. Instagram sponsor signal detection (Apify Instagram scraper):
    - Search event hashtags: #ReginaDeAntioquia #Colombiamoda #MedellinEvents
    - Detect "Powered by", "Gracias a nuestro patrocinador", brand logos in posts
    - Extract brand handles from captions + Story tags

1e. Local directory scrape (Firecrawl):
    - Directorio de empresas Medellín (Cámara de Comercio Medellín)
    - Ruta N startup directory
    - ProColombia export brand directory
    - Nightlife: Parques del Río venues, El Poblado venues

1f. Deduplicate → INSERT into prospects WHERE NOT EXISTS (website match)
```

### Step 2 — Enrichment (per prospect, async)

```
Trigger: new prospect INSERT or manual "Enrich" button

Agent: sponsor-enrichment-agent (Supabase edge fn + Firecrawl)

2a. Website scrape (Firecrawl):
    GET prospect.website → extract:
    - brand_positioning (About page first 500 chars → Gemini summary)
    - audience_description (Gemini: "who is this brand's target customer?")
    - campaign_style ("Describe their marketing style: digital/influencer/physical")
    - contact_name + contact_email (team/contact page)

2b. Instagram profile (Apify or RapidAPI Instagram):
    GET @handle → extract:
    - follower_count
    - avg_engagement_rate (likes+comments / followers)
    - recent posts: detect sponsorship signals ("Colaboración con", "#ad", "#patrocinado")
    - audience language (Spanish % → Colombia confidence)

2c. TikTok profile (TikTok Research API or Apify):
    GET @handle → extract:
    - follower_count + avg_views
    - brand partnership content

2d. LinkedIn company (OpenClaw or Apify LinkedIn):
    GET linkedin_url → extract:
    - employee_count (refines budget_tier estimate)
    - recent posts mentioning events or sponsorships
    - company description + industry

2e. Gemini Flash classification prompt:
    "Given this brand data: [enrichment_data]
     1. Assign industry + subcategory from: [INDUSTRY_SEGMENTS list]
     2. Describe audience in 2 sentences
     3. Rate campaign style: digital/influencer/physical/mixed
     4. List past sponsorships detected (event name, year, type)
     5. Rate sponsorship frequency: never/one-time/occasional/active
     6. Estimated monthly marketing budget tier: micro/bronze/silver/gold/title
     Output: JSON"

2f. UPDATE prospects SET enrichment_data=..., enrichment_status='complete'
```

### Step 3 — Scoring (Step E below for formula)

```
Agent: sponsor-discovery-score edge fn

Input: prospect_id + event_id
Output: match_score float (0.0–1.0) + score_breakdown jsonb

Steps:
  - Load prospect.enrichment_data
  - Load event audience_demographics + tags
  - Compute each dimension (see Section E)
  - UPSERT event_matches(match_score, recommended_tier, recommended_surfaces)
  - UPDATE prospects.sponsor_fit_score = weighted avg across all event matches
```

### Step 4 — Matching (per event)

```
SELECT p.*, em.match_score, em.recommended_tier, em.recommended_surfaces
FROM sponsor_discovery.prospects p
JOIN sponsor_discovery.event_matches em ON em.prospect_id = p.id
WHERE em.event_id = $1
  AND p.crm_status NOT IN ('rejected','converted')
ORDER BY em.match_score DESC
LIMIT 10;
```

### Step 5 — Outreach (automated sequence)

```
Trigger: match_score > 0.65 AND crm_status = 'prospect'

Agent: outreach-sequence-agent (n8n)

Day 0:
  Gemini Flash → personalized WhatsApp message (Colombian Spanish)
  Send via Infobip WhatsApp Business API
  INSERT outreach_messages(direction='outbound', channel='whatsapp')

Day 3, no response:
  Instagram DM fallback (OpenClaw)
  Note: manual queue item if automation not available

Day 7, no response:
  Resend.com cold email
  Subject: "Oportunidad de patrocinio — [Event Name]"

Day 14, no response:
  LinkedIn InMail (if decision-maker found)

Response detected (Infobip webhook):
  UPDATE outreach_messages SET replied_at=now()
  UPDATE event_matches SET outreach_status='replied'
  UPDATE prospects SET crm_status='responded'
  → Notify admin via Supabase Realtime + WhatsApp alert
```

---

## C. Tooling Comparison

### Discovery

| Tool | Strength | Colombia coverage | Cost | Verdict |
|---|---|---|---|---|
| **OpenClaw** | Computer-use agent, navigates any website, LinkedIn scraping | Good — handles Spanish pages | $97/mo | **Best for LinkedIn + local directories** |
| **Firecrawl** | Structured web scraping, clean markdown output, JS rendering | Excellent | $83/mo | **Best for website enrichment** |
| **Apify** | Pre-built actors for Instagram, TikTok, LinkedIn | Good | Pay-per-use ~$5/1k results | **Best for social scraping** |
| **PhantomBuster** | LinkedIn + Instagram + Twitter scraping flows | Moderate | $69/mo | Alternative to Apify |
| **Bright Data** | Residential proxies for anti-bot scraping | Excellent (global) | $500+/mo | Overkill for MVP |
| **SerpAPI** | Google search results structured | Good | $50/mo 5k queries | Good for discovery phase |

### Enrichment

| Tool | Strength | Colombia coverage | Cost | Verdict |
|---|---|---|---|---|
| **Clay** | 50+ data waterfall, email verification, AI personalization | Moderate (less LATAM data) | $149/mo | **Best for email enrichment + personalization at scale** |
| **Apollo** | 250M+ contacts, filters by industry + location | Weak for Colombia SMBs | $99/seat | Good for large multinationals, weak for local |
| **Hunter.io** | Email finder by domain | Good | $49/mo | Email verification only |
| **Clearbit** | Company data enrichment | Enterprise-grade | $299+/mo | Overkill, weak LATAM |

### Outreach

| Tool | Strength | Colombia fit | Cost | Verdict |
|---|---|---|---|---|
| **Infobip** | WhatsApp Business API, already in stack | ✅ primary in Colombia | Pay-per-msg | **Primary channel** |
| **Resend** | Transactional email, Supabase-native | Good | $20/mo | **Email fallback** |
| **Instantly.ai** | Cold email sequencer, deliverability | Good | $97/mo | **Email sequences** |
| **OpenClaw** | Instagram DM, LinkedIn outreach | Good | $97/mo | **Social channel** |
| **Lemlist** | Email + LinkedIn sequences | Good | $99/mo | Alternative to Instantly |

### Recommended Stack for mdeai

```
Discovery:  Firecrawl (websites) + Apify (social) + OpenClaw (LinkedIn)
Enrichment: Firecrawl + Gemini Flash (classification) + Hunter.io (email verify)
Outreach:   Infobip (WhatsApp #1) + Resend (email #2) + OpenClaw (Instagram #3)
Scoring:    Gemini Flash + custom Postgres function
Orchestration: n8n (self-hosted on existing VPS, see task 021)
```

**Monthly cost estimate:** ~$350/mo tools + $0.001/prospect Gemini tokens
**Capacity:** ~500 prospects enriched/month, ~200 outreach messages/day

---

## D. Data Sources — Colombia / Medellín

### Primary data sources

| Source | What to extract | Method |
|---|---|---|
| **Cámara de Comercio Medellín** (camaramedellin.com.co) | Registered companies by industry | Firecrawl scrape |
| **Ruta N** (rutanmedellin.org) | Startups + tech companies | Firecrawl |
| **ProColombia** (procolombia.co) | Export brands, luxury, food/bev | Firecrawl |
| **Directorio Empresarial** (paginasamarillas.com.co) | SMBs, nightlife, hospitality | Firecrawl |
| **Colombiamoda** (inexmoda.org.co) | Fashion brands + sponsors | Scrape past exhibitor lists |
| **Feria de las Flores** | Past sponsors: Bavaria, Postobón, Claro | Scrape official site |
| **Bogatá Fashion Week** | Fashion + beauty sponsors | Scrape |
| **Instagram #PowBy / #Patrocinador** | Local brand partnerships | Apify Instagram actor |
| **LinkedIn** (location: Medellín, Bogotá) | Company pages, decision-makers | OpenClaw |
| **Google search** | "patrocinador evento Medellín [year]" | SerpAPI |
| **El Tiempo / El Colombiano** (news) | Press releases mentioning brand sponsorships | Firecrawl |

### Key Colombian brands to seed (manual)

**Beverages:** Postobón, Bavaria (AB InBev CO), Águila, Club Colombia, Pony Malta, Milo, Juan Valdez  
**Telecom:** Claro Colombia, Movistar CO, Tigo, WOM Colombia  
**Fintech/Banking:** Bancolombia, Nequi, Daviplata, Rappi Pay, Addi, Bold  
**Fashion/Beauty:** Studio F, Leonisa, Arturo Calle, Vélez, Totto, MAC Colombia  
**Nightlife/Hospitality:** El Cielo, Pergamino Café, Andrés Carne de Res, Selina  
**Consumer apps:** Rappi, Mensajeros Urbanos, Domicilios.com, Merqueo  
**Luxury:** BMW Colombia, Mercedes CO, Rolex Colombia, Diageo CO (Johnnie Walker)  
**Fitness/Wellness:** Smart Fit Colombia, Gold's Gym CO, Bodytech  

---

## E. Sponsor Scoring Model

### Formula

```
sponsor_fit_score = (
  audience_overlap_score    × 0.30
+ industry_match_score      × 0.25
+ past_sponsor_activity     × 0.20
+ local_presence_score      × 0.15
+ budget_tier_fit           × 0.10
)
```

### Dimension computation

**audience_overlap_score** (0.0–1.0)
```
Event audience: {gender: {F: 0.72, M: 0.28}, age_bands: {18-24: 0.44, 25-34: 0.38}, city: Medellín}
Brand audience: extracted from enrichment_data.audience_description via Gemini

Gemini prompt:
  "Rate 0–10 how well this brand's audience matches this event's audience.
   Brand audience: [desc]. Event audience: [desc]. Output: integer 0–10."

score = gemini_rating / 10
```

**industry_match_score** (0.0–1.0)
```
Perfect match table (event_type → best industries):

beauty_pageant:    fashion=1.0, beauty=1.0, luxury=0.9, beverage=0.8,
                   telecom=0.7, fintech=0.6, fitness=0.5, nightlife=0.7
music_festival:    beverage=1.0, nightlife=1.0, telecom=0.8, fashion=0.7,
                   fitness=0.5, fintech=0.4
business_summit:   fintech=1.0, telecom=0.9, consumer_apps=0.9,
                   luxury=0.7, fashion=0.5
fitness_event:     fitness=1.0, beverage=0.8, telecom=0.7, consumer_apps=0.6

score = match_table[event.type][prospect.industry] ?? 0.3
```

**past_sponsor_activity** (0.0–1.0)
```
frequency mapping:
  'active'     → 1.0   (3+ sponsorships in 24 months)
  'occasional' → 0.65  (1–2 sponsorships in 24 months)
  'one-time'   → 0.35
  'never'      → 0.10

type_bonus (add to base):
  has digital sponsorship  → +0.05
  has event sponsorship    → +0.10
  has influencer deal      → +0.05

score = min(frequency_base + type_bonus, 1.0)
```

**local_presence_score** (0.0–1.0)
```
hq_city == 'Medellín'         → 1.0
hq_city in ['Bogotá','Cali']  → 0.7
hq_country == 'CO'            → 0.5
hq_country in LATAM           → 0.3
other                         → 0.1

instagram_followers_colombia_pct (from audience data):
  > 60%  → +0.10
  > 40%  → +0.05

score = min(city_base + instagram_bonus, 1.0)
```

**budget_tier_fit** (0.0–1.0)
```
tier price map (COP):
  micro:   < $500K    → min sponsorship $200K
  bronze:  $500K–2M   → Bronze package $1M
  silver:  $2M–5M     → Silver package $3M
  gold:    $5M–15M    → Gold package $8M
  title:   $15M+      → Title package $20M

budget_tier_fit = 1.0 if estimated_budget_tier >= recommended_tier
                  else estimated_budget_cents / tier_price_cents

recommended_tier derived from:
  employee_count: 1-10→micro, 11-50→bronze, 51-200→silver, 201+→gold/title
  instagram_followers: <10k→micro, 10k-100k→bronze, 100k-500k→silver, 500k+→gold
  Take the higher of the two.
```

### Recommended tier + surfaces

```sql
CREATE OR REPLACE FUNCTION sponsor_discovery.compute_match(
  p_prospect_id uuid,
  p_event_id uuid
) RETURNS float LANGUAGE plpgsql AS $$
DECLARE
  v_score float;
  v_breakdown jsonb;
  v_tier text;
  v_surfaces text[];
BEGIN
  -- ... dimension computation ...
  v_score := (
    audience_overlap  * 0.30 +
    industry_match    * 0.25 +
    past_activity     * 0.20 +
    local_presence    * 0.15 +
    budget_fit        * 0.10
  );

  -- Surfaces based on activation_type derived from industry
  v_surfaces := CASE
    WHEN prospect.industry IN ('fashion','beauty','luxury')
      THEN ARRAY['contest_header','contestant_profile']
    WHEN prospect.industry IN ('beverage','nightlife')
      THEN ARRAY['leaderboard_footer','qr_station']
    WHEN prospect.industry IN ('fintech','telecom','consumer_apps')
      THEN ARRAY['contest_header','digital_banner']
    ELSE ARRAY['leaderboard_footer']
  END;

  INSERT INTO sponsor_discovery.event_matches
    (prospect_id, event_id, match_score, score_breakdown, recommended_tier, recommended_surfaces)
  VALUES (p_prospect_id, p_event_id, v_score, v_breakdown, v_tier, v_surfaces)
  ON CONFLICT (prospect_id, event_id) DO UPDATE
    SET match_score=EXCLUDED.match_score,
        recommended_tier=EXCLUDED.recommended_tier,
        recommended_surfaces=EXCLUDED.recommended_surfaces;

  RETURN v_score;
END;
$$;
```

---

## F. Outreach Channels + Strategy

### Channel priority (Colombia-specific)

```
1. WhatsApp Business (Infobip)  — 92% smartphone penetration in CO
   Open rate: ~85%
   Response rate: ~35%

2. Instagram DM (OpenClaw)      — primary for lifestyle/beauty brands
   Response rate: ~15% (lower but high-intent responders)

3. Email (Resend + Instantly)   — for corporate / fintech / telecom
   Cold email open rate: ~28%
   Reply rate: ~8%

4. LinkedIn InMail               — B2B decision-makers only
   Response rate: ~18%
```

### Message templates (Gemini-generated, per brand)

**WhatsApp (Colombian Spanish, 160 chars max for first message):**
```
Hola [nombre], soy [tu nombre] de mdeai.co 👋

Estamos organizando [Evento] en Medellín el [fecha].
Tu marca encaja perfectamente — tu audiencia coincide en un 72% con nuestros asistentes.

¿Tienes 10 minutos esta semana para conversar? Te explico cómo [Brand] puede destacar. 🎯
```

**Email subject line variants (A/B tested):**
- "Oportunidad de patrocinio: [Event] — [City], [Month]"
- "[Brand] + [Event] = 412,000 impresiones proyectadas"
- "Tu competencia ya preguntó. ¿Qué dice [Brand]?"

**Personalization variables (from enrichment_data):**
```
- [audience_overlap_pct]       → "tu audiencia coincide en un 72%"
- [past_event_name]            → "como tu patrocinio en Colombiamoda 2024"
- [projected_impressions]      → from event.expected_audience × typical_ctr
- [competitor_brand]           → if competitor already in system, mention tactfully
- [specific_surface]           → "tu logo en el contest_header visto por 50,000 personas"
```

### Sequence timing

```
Day 0:   WhatsApp message 1 (short, friendly)
Day 3:   WhatsApp follow-up ("¿Tuviste chance de ver mi mensaje?")
Day 5:   Instagram DM (if no response)
Day 8:   Email (formal proposal PDF attached)
Day 12:  Email follow-up ("Tenemos 2 espacios Gold disponibles")
Day 16:  LinkedIn InMail (decision-maker direct)
Day 21:  Final WhatsApp ("Esta semana cerramos los patrocinios")
Day 22+: Mark crm_status='dormant', re-queue for next event
```

---

## G. Industry Segmentation

### Segments + event fit mapping

| Industry | Subcategories | Best event types | ROI narrative |
|---|---|---|---|
| **Fashion / Beauty** | Fast fashion, luxury, cosmetics, hair care | Beauty pageants, fashion shows, influencer events | "Your product in the hands of the next Queen of Antioquia" |
| **Beverage** | Alcohol (beer, spirits), soft drinks, energy drinks, coffee | Music festivals, nightlife events, galas | "Logo on every cup handed to 8,000 attendees" |
| **Fintech / Banking** | Digital wallets, credit, crypto, insurance | Business summits, student events, concerts | "Cashless payments powered by [Brand] at the venue" |
| **Telecom** | Mobile carriers, internet, IoT | Any — mass audience reach | "Official connectivity partner — Wi-Fi named [Brand]" |
| **Nightlife / Hospitality** | Clubs, hotels, restaurants, co-working | Galas, after-parties, pop-ups | "VIP lounge presented by [Brand]" |
| **Fitness / Wellness** | Gyms, supplements, activewear | 5K runs, wellness retreats, outdoor festivals | "Hydration station powered by [Brand]" |
| **Luxury** | Cars, watches, real estate, wine | Beauty pageants, galas, VIP events | "Title sponsor — your brand IS the event" |
| **Consumer Apps / Tech** | Delivery, mobility, productivity | Student/youth events, concerts | "Scan QR for a free delivery with [App]" |
| **Education** | Language schools, online courses, bootcamps | Student pageants, graduation events | "Official education partner" |
| **Tourism / Travel** | Airlines, hotels, tourism boards | Regional festivals, Feria de Flores | "Official travel partner — fly with [Brand]" |

### Medellín-specific high-fit brands by segment

```
Fashion/Beauty:    Leonisa, Studio F, Vélez, MAC Colombia, Loreal Colombia
Beverage:          Postobón, Bavaria, Club Colombia, Juan Valdez, Águila
Fintech/Banking:   Bancolombia, Nequi, Addi, Bold, Daviplata
Telecom:           Claro Colombia (dominant), Tigo, Movistar CO
Nightlife/Hosp:    El Cielo, Pergamino, Hotel Intercontinental MDE
Fitness:           Bodytech, Smart Fit Colombia
Luxury:            BMW Colombia, Cartier CO, Diageo CO
Consumer Apps:     Rappi, Merqueo, inDriver, Uber Colombia
Education:         Berlitz Colombia, Universidad EAFIT, Platzi
Tourism:           Avianca, ProColombia, Medellin Convention Bureau
```

---

## H. 15 Additional Features

| # | Feature | Description | Revenue impact |
|---|---|---|---|
| 1 | **AI Pitch Deck Generator** | Gemini Pro generates a branded 8-slide PDF proposal: event overview, audience match score, surface mockups (Gemini imagen), pricing table, ROI forecast, Colombian market context | Converts cold leads 3× faster |
| 2 | **Photorealistic Surface Mockup** | Show brand logo placed on contest_header, QR station, leaderboard — generated by Gemini imagen API from brand's actual logo | Eliminates "I need to see it" objection |
| 3 | **ROI Forecast Before Purchase** | Before applying, brand sees projected impressions × historical CTR × attribution rate for that event + tier = "Expected: 18,000 clicks, 720 attributed purchases" | Reduces sales cycle 40% |
| 4 | **Dynamic Slot Pricing** | If 2+ brands want same surface, price increases 25% automatically. Displayed: "2 brands viewing this slot — price increases in 48h" | +20% average deal size |
| 5 | **Sponsor Marketplace (self-serve)** | Brands browse events, filter by audience match + industry + budget, apply without human involvement. Organizer approves/rejects. | 24/7 acquisition, no sales team cost |
| 6 | **WhatsApp Outreach Agent** | n8n + OpenClaw + Infobip: fully automated discovery → enrich → score → personalized WhatsApp → track response → notify admin | 200+ prospects/week with 1 person |
| 7 | **CRM Pipeline Board** | Kanban: Prospect → Contacted → Responded → Qualified → Applied → Converted. Drag-to-move, one-click WhatsApp follow-up | Full visibility, no leads lost |
| 8 | **Renewal Prediction Score** | Gemini model rates renewal probability (0–100%) at campaign Day 30 based on CTR performance + competitor activity + historical renewal data | Save accounts before they churn |
| 9 | **Sponsor Competitor Alert** | Detect when two competing brands (Bavaria vs Postobón) apply to same event → alert admin → enforce category exclusivity | Protects premium slots, drives urgency |
| 10 | **Micro-Sponsorship Slots** | $200K–500K COP self-serve slots (QR station, 48h leaderboard) — no sales call, instant payment, automated contract | Opens market to 500+ SMB brands |
| 11 | **Post-Campaign Debrief PDF** | Auto-generated on contract_end_at: all metrics, audience breakdown, vs-promise comparison, renewal CTA — delivered via WhatsApp + email | Drives 40–60% renewal rate |
| 12 | **Social Amplification Tracking** | Apify monitors hashtags for contestant posts tagging sponsors → adds organic impressions to ROI report → "Your brand was tagged in 312 Stories" | Proves value brands didn't know existed |
| 13 | **Brand Safety Screener** | Gemini scans brand's Instagram/website before admin approves: flags alcohol brands for youth events, competitor conflicts, inappropriate content | Protects organizer reputation |
| 14 | **Performance-Based Bronze Tier** | Entry-level: $0 upfront, 3% rev share on attributed purchases. Platform invoices monthly via Stripe. Removes financial barrier for small brands. | New customer segment, recurring revenue |
| 15 | **AI Contract Clause Negotiator** | Brand requests change to exclusivity scope → Gemini proposes 3 alternative clauses within legal bounds → admin selects → contract auto-updates → re-sent for signature | Eliminates legal back-and-forth |

---

## Full Implementation Plan

### Phase A — Foundation (Weeks 1–2)

```
1. Run migration: sponsor_discovery schema + tables
2. Deploy edge fns:
   - sponsor-discovery-search (admin list view)
   - sponsor-discovery-score (score computation)
3. Build admin CRM page: /admin/sponsor-discovery
   - Table: prospects list with filters (industry, city, score, crm_status)
   - Detail panel: enrichment_data, score_breakdown, event_matches
   - Actions: "Enrich", "Match to Event", "Send Outreach"
4. Manual import: seed 50 Colombian brands from Section D manually
5. Run score computation on seed data
```

### Phase B — Enrichment pipeline (Weeks 3–4)

```
1. Set up Firecrawl API key + edge fn sponsor-discovery-enrich
2. Set up Apify token + Instagram actor
3. Build enrichment queue processor (n8n or Supabase pg_cron)
4. Gemini Flash classification prompt (Section B Step 2e)
5. Test enrichment on 20 seed brands
6. Validate score output vs manual assessment
```

### Phase C — Outreach automation (Weeks 5–6)

```
1. Build outreach edge fn (sponsor-discovery-outreach)
2. Infobip WhatsApp template approval (required for Business API)
   Templates: initial outreach + follow-up + meeting confirmation
3. Resend email setup (domain: outreach@mdeai.co)
4. n8n workflow: outreach sequence (Day 0 → Day 22)
5. Response webhook: Infobip → n8n → Supabase → admin Realtime notification
6. Admin CRM: mark responded, book meeting, move to qualified
```

### Phase D — Marketplace (Weeks 7–8)

```
1. /explore/sponsor — brand-facing event browse
2. Event match score displayed per event card
3. One-click "Apply to sponsor this event" → wizard pre-fill
4. Organizer config: set tiers + surfaces + prices per event
5. Micro-sponsorship self-serve flow (no admin approval for micro tier)
```

### Estimated output

```
Week 1:  50 brands seeded and scored
Week 4:  200+ brands enriched, top 20 matched per event
Week 6:  First automated WhatsApp campaign sent (100 prospects)
Week 8:  Self-serve marketplace live, first inbound brand applies
Month 3: 500+ prospects in pipeline, 8–15 sponsors converted per event
```

---

## Quick-start SQL

```sql
-- Run after creating the schema
-- Seed first 10 prospects manually for testing

INSERT INTO sponsor_discovery.prospects
  (company_name, website, instagram_handle, industry, hq_city, estimated_budget_tier)
VALUES
  ('Postobón S.A.',      'postobon.com',        'postobon',       'beverage',  'Medellín', 'title'),
  ('Leonisa',            'leonisa.com',          'leonisa',        'fashion',   'Medellín', 'gold'),
  ('Bancolombia',        'bancolombia.com',      'bancolombia',    'fintech',   'Medellín', 'title'),
  ('Claro Colombia',     'claro.com.co',         'clarocolombia',  'telecom',   'Bogotá',   'title'),
  ('Nequi',              'nequi.com',            'nequi',          'fintech',   'Medellín', 'silver'),
  ('Juan Valdez',        'juanvaldezcafe.com',   'juanvaldezcafe', 'beverage',  'Bogotá',   'silver'),
  ('Studio F',           'studio-f.com',         'studiof',        'fashion',   'Medellín', 'gold'),
  ('Smart Fit Colombia', 'smartfit.com.co',      'smartfitco',     'fitness',   'Bogotá',   'bronze'),
  ('Rappi',              'rappi.com',            'rappi',          'consumer_apps','Bogotá','gold'),
  ('Bodytech',           'bodytech.com.co',      'bodytech_co',    'fitness',   'Bogotá',   'silver');
```

---

## Related tasks

- `059-marketing-schema-migration.md` — marketing schema (complement to this)
- `054-sponsor-ai-edge-fns.md` — AI edge fns (sponsor-moderate, sponsor-roi-explain)
- `052-sponsor-dashboard.md` — sponsor ROI dashboard
- `021-openclaw-vps-provision.md` — OpenClaw VPS setup
