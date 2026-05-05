---
task_id: 063-openclaw-sponsor-discovery-engine
title: Sponsor Discovery Engine — OpenClaw production pipeline
phase: PHASE-3-SPONSOR-AI
priority: P0
status: Design
estimated_effort: 4 weeks
area: automation
tools:
  - openclaw
  - firecrawl
  - apify
  - phantombuster
  - bright-data
  - clay
  - hermes-agent
  - supabase
---

# Sponsor Discovery Engine: OpenClaw Production Pipeline

**For:** mdeai.co — Medellín, Colombia + LATAM event marketplace  
**Goal:** Automatically discover, enrich, score, and qualify sponsors + identify decision-makers  
**Date:** 2026-05-04

---

## 1. FULL SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────┐
│  INPUT LAYER                                                         │
│  mdeai Supabase DB: events, past sponsors, audience demographics    │
│  Seed lists: known Colombian brands, past sponsors, competitor data  │
└───────────────────────┬─────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│  ORCHESTRATION LAYER (Paperclip)                                     │
│  - Schedules daily discovery runs (cron: 06:00 COT)                  │
│  - Enforces rate limits (max 80 LinkedIn/day, 300 domains/hr)        │
│  - Approval gates (human review for score ≥70)                       │
│  - Budget control (max API spend per day)                            │
│  - Audit log (Colombia Ley 1581/2012 compliance)                     │
└───────────────────────┬─────────────────────────────────────────────┘
                        │ issues + heartbeats
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│  EXECUTION LAYER: OPENCLAW (primary automation)                      │
│                                                                      │
│  ┌──────────────────┐  ┌─────────────────┐  ┌───────────────────┐  │
│  │ Query Generation │  │ Browser Actions  │  │ API Orchestration │  │
│  │ (LLM expands     │  │ (Brave/Playwright│  │ (calls Firecrawl, │  │
│  │  seed queries)   │  │  /Midscene)      │  │  Apify, Clay,     │  │
│  │                  │  │                  │  │  PhantomBuster)   │  │
│  └──────────────────┘  └─────────────────┘  └───────────────────┘  │
│                                                                      │
│  Skills installed (ClawHub — 323 skills available):                  │
│  - firecrawl         (JS rendering + /interact; handles dynamic sites)│
│  - super-browser     (8 browser skills combined; Rust-based headless) │
│  - crawl4ai          (AI-powered structured extraction)               │
│  - mrscraper         (rotating-IP scraping with NL queries)          │
│  - apollo-io         (lead enrichment via Apollo.io API)              │
│  - windsor-ai        (analytics aggregation, 325+ data sources)       │
│  NOTE: web_fetch does NOT execute JS — use firecrawl for SPAs        │
└───────────────────────┬─────────────────────────────────────────────┘
                        │ structured JSON
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│  EXTERNAL TOOLS LAYER                                                │
│  ┌──────────────┐ ┌──────────┐ ┌────────────────┐ ┌─────────────┐ │
│  │   Firecrawl  │ │  Apify   │ │  PhantomBuster │ │ Bright Data │ │
│  │  Website +   │ │Instagram │ │ LinkedIn +     │ │  Proxies +  │ │
│  │  blog scrape │ │ TikTok   │ │ website scrape │ │ anti-detect │ │
│  └──────────────┘ └──────────┘ └────────────────┘ └─────────────┘ │
│                      ┌──────────────────────┐                       │
│                      │   Clay               │                       │
│                      │   email patterns +   │                       │
│                      │   WhatsApp numbers + │                       │
│                      │   company enrichment │                       │
│                      └──────────────────────┘                       │
└───────────────────────┬─────────────────────────────────────────────┘
                        │ enriched profiles
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│  AI ANALYSIS LAYER (Hermes agent, claude-sonnet-4.6)                │
│  - Industry classification                                           │
│  - Audience description                                              │
│  - Campaign style detection (digital / influencer / physical)        │
│  - Past sponsorship extraction                                       │
│  - Budget tier estimation                                            │
│  - sponsor_fit_score (0–1)                                           │
└───────────────────────┬─────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│  DATA STORE: Supabase (sponsor_discovery schema)                     │
│  prospects, contacts, signals, enrichment_jobs, outreach_messages   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. OPENCLAW DEEP CAPABILITIES

### What OpenClaw actually is

OpenClaw is a **local AI agent gateway** — not just a WhatsApp tool. It:

- Runs a local server (gateway) that routes AI agent requests to channels + tools
- Has **924+ skills** in ClawHub (the official skill registry)
- Supports multi-agent coordination via `delegation` tool
- Has built-in toolsets: `browser`, `file`, `web-fetch`, `code_execution`, `cronjob`, `image_gen`
- Integrates any external API via plugin SDK

### Browser automation capabilities

| Capability | How it works | Limit |
|---|---|---|
| **web_search** | Built-in — queries 11 providers: Brave, Firecrawl, Tavily, Perplexity, Exa, Gemini, Grok, Kimi, MiniMax, DuckDuckGo, SearXNG | Requires API key per provider; configure in config.yaml |
| **web_fetch** | Converts any URL HTML → clean markdown via HTTP | ⚠️ Does NOT execute JavaScript — fails on SPAs/dynamic pages |
| **Firecrawl skill** | Full browser rendering + `/interact` endpoint; handles JS-heavy sites | API credits; recommended for 90% of scraping tasks |
| **super-browser** | Combines 8 top-rated browser skills; Rust-based headless engine | Most reliable for complex navigation |
| **crawl4ai** | AI-powered structured extraction with natural language queries | Open-source; self-hosted |
| **mrscraper** | "Unblockable" rotating IP scraping with NL queries | $49/mo; good for aggressive targets |
| **Mac GUI control** | Full desktop automation for Mac-based accounts | Only on Mac hardware — not VPS |
| **Computer use** | Vision + mouse control (headless server) | Slowest (60–180s per action); last resort |

### Search provider hierarchy (OpenClaw config)

```yaml
# ~/.openclaw/config.yaml  
# OpenClaw supports 11 search providers natively:
search:
  provider: brave          # primary — best quality, indexed
  fallback: firecrawl      # secondary — scrapes URL directly, handles JS
  tertiary: searxng        # free self-hosted fallback
  
# Full provider list (configure multiple for failover):
# brave, firecrawl, tavily, perplexity, exa, gemini,
# grok, kimi, minimax, duckduckgo, searxng

# Recommended for mdeai discovery:
#   brave (paid, $5/1k queries) → best general web results
#   exa   (neural search, great for finding event pages)
#   firecrawl (when you need full page content, not just URL)

# SearXNG (self-hosted, $0 cost, aggregates all sources):
#   docker run -d -p 8080:8080 searxng/searxng
#   Then: provider: searxng, url: http://localhost:8080
```

### LinkedIn navigation

**Important:** OpenClaw has NO native LinkedIn automation. Community skills exist but are unmaintained. The correct approach:

```
OpenClaw orchestrates → PhantomBuster API → returns structured JSON
                     → Apify LinkedIn scraper → returns employee list

OpenClaw does NOT manually click 500 LinkedIn profiles.
OpenClaw DOES: call PhantomBuster/Apify APIs, parse results, route to Hermes.
```

### Instagram/TikTok navigation

**Important:** OpenClaw has no native Instagram login or DM automation. Community scraper skills exist for public profile data only. For full coverage:

```
OpenClaw → Apify "All-in-One Social Media Scraper" actor
  Input: ["@leonisa", "@bancolombia", "@comfama"]
  Returns: { posts, captions, hashtags, bio, email_in_bio, collab_mentions }

OpenClaw → MrScraper skill
  Query: "Find recent Instagram posts mentioning Medellín events and sponsorships"
  Returns: structured extraction without login required
```

### Login-based scraping (handle carefully)

```
Pattern: OpenClaw manages a DEDICATED scraping account
  - Separate LinkedIn account (not your personal one)
  - Instagram business account (limits apply)
  - Playwright logs in via stored session cookie (not username/password each time)
  - Session cookie stored in ~/.openclaw/secrets/linkedin-session.json

Risk: Account ban. Mitigation: Rotate via Bright Data residential proxies.
```

---

## 3. STEP-BY-STEP DISCOVERY PIPELINE

### Step 1 — Query Generation (OpenClaw + LLM)

OpenClaw's LLM expands seed queries before any scraping begins:

```
SEED INPUTS:
  event_type: "moda", "gastronomía", "cultura", "nightlife", "deportes"
  location: "Medellín", "Antioquia", "Colombia", "LATAM"
  signals: ["patrocinador", "sponsor", "powered by", "en alianza con"]

EXPANDED QUERIES (LLM generates 20+ per run):
  "patrocinador eventos moda Medellín 2025"
  "marcas patrocinan Colombiamoda"
  "sponsor Medellín nightclub opening"
  "brands sponsoring fashion events Colombia"
  "powered by [beverages] Colombia 2025"
  "alianza comercial evento gastronómico Antioquia"
  "patrocinador oficial concurso belleza Colombia"
  "sponsor site:instagram.com Medellín evento"
  "partner evento site:linkedin.com/company Colombia"

SEARCH TARGETS:
  - Brave web search (general sites, blogs, news)
  - Instagram (via Apify)
  - LinkedIn company pages (via PhantomBuster)
  - Cámara de Comercio MDE directory
  - ProColombia investment guide
  - Ruta N company index
```

**OpenClaw cron config:**
```bash
openclaw cron add "sponsor-query-gen" "0 11 * * *" \
  "openclaw agent run sponsor-discovery-query-gen"
# Fires daily at 06:00 COT (11:00 UTC)
```

---

### Step 2 — Web Scraping (OpenClaw + Firecrawl + PhantomBuster)

#### 2a. Company websites

```
For each URL in search results:

OpenClaw → Firecrawl skill:
  crawl([
    "https://brandxyz.com/sobre-nosotros",
    "https://brandxyz.com/prensa",
    "https://brandxyz.com/patrocinios",
    "https://brandxyz.com/alianzas",
    "https://brandxyz.com/blog",
  ])
  
  Returns: { title, markdown_content, metadata, links }

OpenClaw → LLM (Hermes):
  "Extract any sponsorship mentions, event partnerships, 
   marketing department contacts from this text"

Stored as: candidate_companies + sponsor_signals rows
```

#### 2b. Event websites (past sponsors section)

```
OpenClaw → Firecrawl.scrapeUrl(event_url, {
  formats: ["markdown", "screenshot"],
  onlyMainContent: false  # include sponsors section in footer/sidebar
})

LLM detects:
  - "Nuestros Patrocinadores" section
  - Logo grid images → OCR → brand names
  - "Powered by", "En alianza con" text
  - Footer links to sponsor websites

Output: {
  event_name, event_url,
  detected_sponsors: ["Bancolombia", "Leonisa", "Corona"],
  extraction_confidence: 0.87
}
```

#### 2c. Directories (Cámara de Comercio, ProColombia)

```
Cámara de Comercio MDE (camaramedellin.com.co):
  OpenClaw → Playwright:
    navigate("https://www.camaramedellin.com.co/directorio-empresarial")
    fill("#search", "eventos AND patrocinios")
    click("#buscar")
    extract_table(selector=".empresa-result")
    → returns [{ nit, razon_social, actividad, ciudad, contacto }]

ProColombia (procolombia.co):
  OpenClaw → Firecrawl:
    scrape("https://www.procolombia.co/nuestros-servicios/inversion")
    extract companies with "Antioquia" + "marketing" NACE codes
```

---

### Step 3 — Social Scraping

#### 3a. Instagram (Apify Actor)

```python
# OpenClaw calls Apify via HTTP tool:
response = await http.post("https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync", {
  headers: { "Authorization": f"Bearer {APIFY_API_TOKEN}" },
  json: {
    "usernames": ["@leonisa", "@bancolombia", "@comfama", "@postobon"],
    "resultsType": "posts",
    "resultsLimit": 50,
    "addParentData": True,
  }
})

# Hermes then analyzes each post:
ANALYSIS PROMPT:
"Given this Instagram post from brand {handle}:
Caption: {caption}
Hashtags: {hashtags}
Tagged accounts: {tagged}

Answer:
1. Is this post related to an event or event sponsorship? (yes/no)
2. What event or activation type? (fashion show, festival, nightlife, sports)
3. What's the audience? (demographics evident from content)
4. Any co-brand partnerships mentioned?
5. Estimate campaign type: digital | influencer | experiential | product placement"
```

#### 3b. TikTok (Apify)

```python
# TikTok scraper for Colombian event-related content
response = await http.post("https://api.apify.com/v2/acts/clockworks~tiktok-scraper/run-sync", {
  json: {
    "hashtags": ["#MedellinEventos", "#PatrocinadorColombia", "#ColombiaModa"],
    "maxItems": 100,
    "resultsPerPage": 20,
  }
})

# Extract brands mentioned in videos:
# - "Gracias a @brandname por hacer posible este evento"
# - Product placements in event recap videos
# - Brand logos in video backgrounds
```

#### 3c. LinkedIn (PhantomBuster API)

```python
# OpenClaw calls PhantomBuster to scrape company employees
# WITHOUT manual browser-visiting 500 profiles

# Step 1: Company page scrape
company_data = await http.get(
  "https://api.phantombuster.com/api/v2/agents/fetch-output",
  params={
    "id": LINKEDIN_COMPANY_SCRAPER_AGENT_ID,
    "query": "bancolombia.com"
  },
  headers={"X-Phantombuster-Key": PB_API_KEY}
)
# Returns: { name, industry, size, description, specialties }

# Step 2: Employee scrape (filtered by marketing titles)
employees = await http.post(
  "https://api.phantombuster.com/api/v2/agents/launch",
  json={
    "id": LINKEDIN_EMPLOYEE_SCRAPER_AGENT_ID,
    "argument": {
      "companyUrl": "https://linkedin.com/company/bancolombia",
      "titleFilters": [
        "marketing", "marca", "patrocinios", "eventos",
        "partnerships", "brand", "sponsorship"
      ],
      "numberOfProfiles": 10
    }
  }
)
# Returns: [{ name, title, profileUrl, summary }]
```

---

### Step 4 — Sponsor Signal Detection

```python
# OpenClaw runs signal detection on all scraped content

SIGNAL_PATTERNS = {
  "direct_sponsorship": [
    "patrocinado por", "patrocinador oficial", "sponsored by",
    "powered by", "en alianza con", "brand partner",
    "con el apoyo de", "gracias al patrocinio de"
  ],
  "event_participation": [
    "presente en", "exhibición en", "stand en",
    "expositor en", "activation en"
  ],
  "influencer_collab": [
    "gracias a", "gift", "gifted", "collab", "colaboración",
    "ad", "#publicidad", "#patrocinado", "#ad"
  ],
  "logo_presence": [
    # Detected via OCR on event page images
    # OpenClaw → screenshot → Hermes vision analysis
  ]
}

# For each page/post, Hermes runs:
DETECTION_PROMPT = """
Analyze this text/image from an event page in Medellín, Colombia.

Detect if any of these sponsorship signals are present:
- Direct sponsorship mention
- Brand as official partner
- Product/service placement at event  
- Influencer paid collaboration
- Brand logo on event materials

Text: {text}

Return JSON:
{
  "has_signal": boolean,
  "signal_type": "direct_sponsorship|event_participation|influencer_collab|logo",
  "brand_name": "string or null",
  "confidence": 0.0-1.0,
  "excerpt": "exact text that triggered detection"
}
"""

# Store each signal:
INSERT INTO sponsor_discovery.signals (
  prospect_id, page_url, signal_type, 
  detected_text, confidence, detected_at
)
```

---

### Step 5 — Contact Identification

#### 5a. Decision-maker roles to target

```
PRIORITY 1 (score: 1.0):
  "Director de Marketing"
  "Gerente de Marca"  
  "Head of Partnerships"
  "Director Comercial"
  "VP Marketing"
  "Chief Marketing Officer"
  "Directora de Comunicaciones"

PRIORITY 2 (score: 0.7):
  "Coordinador de Patrocinios"
  "Gerente de Eventos"
  "Brand Manager"
  "Especialista en Alianzas"
  "Community Manager" (if DMs are reachable)

PRIORITY 3 (score: 0.4):
  "Analista de Marketing"
  "Asistente de Marca"
  "Ejecutivo de Ventas"
```

#### 5b. Contact extraction pipeline

```
SOURCE 1: LinkedIn (via PhantomBuster)
  → Filter by title keywords above
  → Returns: name, title, profileUrl, location

SOURCE 2: Company "team" page (via Firecrawl)
  → Scrape /equipo, /nosotros, /about/team
  → Extract names + roles via LLM

SOURCE 3: Instagram/TikTok bio
  → Some brand accounts list "DM for partnerships"
  → OpenClaw extracts email if in bio

SOURCE 4: Google search
  → "Director Marketing Bancolombia" → LinkedIn result
  → OpenClaw Brave search + extract first hit

CROSS-REFERENCE:
  → Match LinkedIn name ↔ website team page name
  → Dedupe using Clay normalization
  → Primary contact = highest seniority score
```

---

## 4. CONTACT ENRICHMENT

### Email discovery strategy

```
STEP 1: Direct extraction
  - Instagram/TikTok bio: "partnerships@company.com"
  - Website /contact page: "marketing@company.com"
  - OpenClaw Firecrawl scrape → LLM extracts emails from page

STEP 2: Pattern inference (Clay)
  Known patterns for Colombian companies:
    nombre.apellido@empresa.com    (most common)
    napeллido@empresa.com          (initial + surname)
    nombre@empresa.com             (first name only)
    n.apellido@empresa.com

  Clay API call:
    POST /enrich/contact
    { name: "Carlos Rodríguez", company: "leonisa.com" }
    Returns: { email: "c.rodriguez@leonisa.com", confidence: 0.78 }

STEP 3: Validation
  MX record check (fast, free):
    dig MX leonisa.com → confirms mail server exists
  
  SMTP verification (via Hunter API or ZeroBounce):
    Checks: does this specific inbox exist?
    Returns: valid | invalid | catch-all | unknown

STEP 4: Fallback
  If no email found:
    → Mark: "requires contact-form outreach"
    → OpenClaw: navigates /contacto, fills form (Playwright)
    → Or: LinkedIn InMail via PhantomBuster
```

### WhatsApp discovery (+57 Colombia)

```
Colombia phone format: +57 3XX XXX XXXX
  3XX prefixes: 300-321 (Claro), 310-320 (Movistar), 
                322 (Tigo), 350 (ETB), 311-315 (Avantel)
  Medellín area: all prefixes are mobile (Colombia is mobile-first)

DISCOVERY METHODS:
  1. Website "WhatsApp" button → extract wa.me/57XXXXXXXXXX link
  2. Instagram bio: "📱 3XX XXX XXXX" → regex extract
  3. TikTok bio: same
  4. Google Business Profile → phone number
  5. Cámara de Comercio directory → registered phone

VALIDATION:
  wa.me API check (informal):
    GET https://api.whatsapp.com/send?phone=573001234567
    → 200 = number exists on WhatsApp
    → rate-limit: max 20 checks/hr per IP

NOTE: Never send unsolicited WhatsApp without consent.
  Use only: known business numbers + WhatsApp Business API flows.
  OpenClaw sends only pre-approved Infobip templates.
```

### Contact ranking

```python
def rank_contact(contact: dict) -> float:
    TITLE_SCORES = {
        "director": 1.0, "gerente": 0.9, "head of": 1.0,
        "chief": 1.0, "vp": 0.95, "coordinador": 0.6,
        "brand manager": 0.8, "especialista": 0.5,
        "analista": 0.3, "asistente": 0.2
    }
    
    # Title match (case-insensitive)
    title_lower = contact["title"].lower()
    title_score = max(
        (score for keyword, score in TITLE_SCORES.items() 
         if keyword in title_lower),
        default=0.2
    )
    
    # Has email?
    email_score = 0.3 if contact.get("email") else 0.0
    
    # Has WhatsApp?
    wa_score = 0.2 if contact.get("whatsapp") else 0.0
    
    # Has LinkedIn?
    li_score = 0.1 if contact.get("linkedin_url") else 0.0
    
    return min(title_score + email_score + wa_score + li_score, 1.0)
```

---

## 5. AI ANALYSIS LAYER (Hermes)

### Industry classification

```python
INDUSTRY_MAP = {
  "food_beverage": ["bebidas", "alimentos", "restaurante", "cerveza", "refrescos", "café"],
  "fashion": ["moda", "ropa", "calzado", "lencería", "textil", "diseño"],
  "beauty": ["belleza", "cosméticos", "cuidado personal", "spa", "salón"],
  "fintech": ["bancario", "financiero", "seguros", "inversión", "pagos"],
  "real_estate": ["inmobiliaria", "constructora", "vivienda", "finca raíz"],
  "automotive": ["automóvil", "vehículo", "motos", "concesionario"],
  "telecom": ["celular", "internet", "telecomunicaciones", "streaming"],
  "hospitality": ["hotel", "resort", "turismo", "viajes", "aerolínea"],
  "spirits": ["licores", "ron", "whisky", "aguardiente", "cerveza artesanal"],
  "wellness": ["salud", "bienestar", "deporte", "gimnasio", "yoga"],
}

# Hermes prompt:
INDUSTRY_PROMPT = """
Classify this Colombian company into one of these industries based on their 
website content and social media:
[{industry_list}]

Company: {name}
Website text: {website_text}
Instagram bio: {ig_bio}
Recent posts: {recent_posts}

Return JSON:
{
  "primary_industry": "string",
  "secondary_industry": "string|null",
  "confidence": 0.0-1.0,
  "evidence": "brief explanation"
}
"""
```

### Audience description

```python
AUDIENCE_PROMPT = """
Based on this Colombian brand's content and positioning, describe their target audience:

Brand: {name}
Content sample: {content}

Return JSON:
{
  "age_range": "18-24|25-34|35-44|45+|mixed",
  "gender_skew": "female|male|balanced",
  "income_tier": "low|mid|high|premium",
  "lifestyle": ["fashion", "nightlife", "family", "sports", "culture"],
  "geography": "Medellín|Bogotá|Colombia|LATAM",
  "event_affinity": "beauty pageants|fashion shows|food festivals|nightlife|sports|culture",
  "confidence": 0.0-1.0
}
"""
```

### Budget tier estimation

```python
BUDGET_SIGNALS = {
  "enterprise": [
    "bolsa de valores", "NYSE", "revenue >$100B COP",
    "empleados +5000", "franquicia internacional"
  ],
  "large": [
    "empleados 500-5000", "presencia nacional",
    "revenue estimado $10-100B COP", "campaña TV"
  ],
  "mid": [
    "empleados 50-500", "presencia regional",
    "revenue $1-10B COP", "pauta digital activa"
  ],
  "small": [
    "empleados <50", "presencia local",
    "startup", "revenue <$1B COP"
  ]
}

BUDGET_MAP = {
  "enterprise": {"tier": "platinum", "min_cop": 50_000_000, "score": 0.9},
  "large":      {"tier": "gold",     "min_cop": 20_000_000, "score": 0.75},
  "mid":        {"tier": "silver",   "min_cop": 8_000_000,  "score": 0.55},
  "small":      {"tier": "bronze",   "min_cop": 2_000_000,  "score": 0.30},
}
```

---

## 6. SPONSOR SCORING ENGINE

### Formula

```
sponsor_fit_score = (
  audience_match     × 0.25 +
  industry_relevance × 0.25 +
  local_presence     × 0.20 +
  sponsorship_history× 0.15 +
  budget_fit         × 0.15
)
```

### Component computation

```python
def compute_sponsor_score(prospect: dict, event: dict) -> dict:
    
    # 1. Audience match (0–1)
    # Compare prospect's audience demographics vs event's expected attendees
    prospect_audience = prospect["ai_audience"]  # from Hermes analysis
    event_audience = event["expected_audience"]
    
    audience_match = compute_demographic_overlap(
        prospect_audience, event_audience
    )
    # Example: event = 70% female 25-34 Medellín fashion
    #          brand = 80% female 22-38 Colombia fashion → match = 0.88

    # 2. Industry relevance (0–1)
    INDUSTRY_MATRIX_FOR_EVENT = {
        "reina_de_antioquia": {
            "beauty": 1.0, "fashion": 0.9, "food_beverage": 0.7,
            "hospitality": 0.8, "spirits": 0.6, "fintech": 0.5
        },
        "colombiamoda": {
            "fashion": 1.0, "beauty": 0.9, "luxury": 1.0,
            "food_beverage": 0.6, "telecom": 0.5
        },
        "food_festival": {
            "food_beverage": 1.0, "spirits": 0.95, "hospitality": 0.85,
            "fashion": 0.4, "fintech": 0.4
        },
    }
    industry_relevance = INDUSTRY_MATRIX_FOR_EVENT.get(
        event["category"], {}
    ).get(prospect["primary_industry"], 0.3)
    
    # 3. Local presence (Medellín-weighted)
    hq = prospect.get("hq_city", "").lower()
    local_presence = (
        1.0 if "medellín" in hq or "medellin" in hq
        else 0.85 if "antioquia" in hq
        else 0.70 if "colombia" in prospect.get("hq_country", "")
        else 0.40 if "latam" in prospect.get("market_focus", "")
        else 0.25
    )
    
    # 4. Sponsorship history (0–1)
    # Derived from sponsor_signals COUNT for this brand
    signal_count = prospect.get("signal_count", 0)
    sponsorship_history = min(signal_count / 6, 1.0)  # 6+ signals = max
    # 0 → 0.0, 1-2 → 0.25, 3-5 → 0.67, 6+ → 1.0

    # 5. Budget fit (0–1)
    budget_tiers = {"bronze": 0.30, "silver": 0.55, "gold": 0.75, "platinum": 0.90}
    budget_fit = budget_tiers.get(prospect.get("budget_tier", "bronze"), 0.30)
    
    # Weighted sum
    score = (
        audience_match * 0.25 +
        industry_relevance * 0.25 +
        local_presence * 0.20 +
        sponsorship_history * 0.15 +
        budget_fit * 0.15
    )
    
    return {
        "sponsor_fit_score": round(score, 3),
        "breakdown": {
            "audience_match": audience_match,
            "industry_relevance": industry_relevance,
            "local_presence": local_presence,
            "sponsorship_history": sponsorship_history,
            "budget_fit": budget_fit,
        },
        "recommended_tier": recommend_tier(score),
        "outreach_priority": "high" if score >= 0.75 else "medium" if score >= 0.55 else "low"
    }

def recommend_tier(score: float) -> str:
    if score >= 0.85: return "platinum"
    if score >= 0.70: return "gold"
    if score >= 0.55: return "silver"
    return "bronze"
```

### Ranked output (Supabase query)

```sql
SELECT 
  p.name,
  p.industry,
  p.city,
  p.sponsor_fit_score,
  p.recommended_tier,
  p.outreach_priority,
  c.name AS primary_contact_name,
  c.title AS primary_contact_title,
  c.email AS primary_contact_email,
  c.whatsapp AS primary_contact_whatsapp,
  COUNT(s.id) AS signal_count,
  p.ai_audience_summary,
  p.ai_budget_tier
FROM sponsor_discovery.prospects p
LEFT JOIN sponsor_discovery.contacts c 
  ON c.prospect_id = p.id AND c.is_primary = true
LEFT JOIN sponsor_discovery.signals s 
  ON s.prospect_id = p.id
WHERE p.status = 'pending'
GROUP BY p.id, c.id
ORDER BY p.sponsor_fit_score DESC
LIMIT 50;
```

---

## 7. TOOL STACK (WHAT OPENCLAW HANDLES VS EXTERNAL)

### Decision matrix

| Task | OpenClaw does | External tool does |
|---|---|---|
| **Search query execution** | Brave API calls, result routing | — |
| **Company website scraping** | Orchestrates → calls Firecrawl skill | Firecrawl returns clean markdown |
| **Event sponsor section** | Playwright if JS-heavy, else Firecrawl | Firecrawl for static pages |
| **Instagram/TikTok scraping** | Calls Apify Actor API | Apify returns JSON (posts, bios) |
| **LinkedIn company + employees** | Calls PhantomBuster API | PhantomBuster returns employee list |
| **Email enrichment** | Sends domain + name to Clay | Clay returns email + confidence |
| **Email validation** | Calls MX check (inline) | ZeroBounce/Hunter validates SMTP |
| **WhatsApp discovery** | Extracts +57 numbers from pages | — |
| **Logo OCR on event pages** | Playwright screenshot → Hermes vision | — |
| **Signal detection** | Hermes LLM analysis of all text | — |
| **Scoring computation** | Hermes code_execution (Python) | — |
| **Anti-bot evasion** | Routes all high-volume via Bright Data | Bright Data proxies rotate IPs |
| **Rate limit enforcement** | Paperclip orchestrator throttles | — |

### Recommended hybrid config

```
DISCOVERY:    OpenClaw (Brave search) → Firecrawl (page content) → Hermes (NLP extract)
SOCIAL:       OpenClaw → Apify actors (Instagram, TikTok, LinkedIn)
ENRICHMENT:   OpenClaw → Clay (email patterns, phone, company data)
VALIDATION:   OpenClaw → ZeroBounce / MX check (email)
ANTI-BOT:     Bright Data residential proxies (for direct Instagram/TikTok browser)
STORAGE:      OpenClaw → Supabase edge fn (sponsor-enrich POST)
SCORING:      Hermes code_execution agent (Python scoring formula)
GOVERNANCE:   Paperclip (rate limits, approval gates, audit log)
```

### Costs (monthly estimate for 200 prospects/week)

| Tool | Cost | Volume |
|---|---|---|
| Brave Search API | $10 | 2,000 queries |
| Firecrawl | $83 | 100k credits |
| Apify | $49 | Instagram + TikTok |
| PhantomBuster | $69 | LinkedIn (1 dedicated account) |
| Bright Data | $15 | Residential proxies (10GB) |
| Clay | $149 | 500 enrichments/mo |
| ZeroBounce | $20 | 2,000 email validations |
| VPS (OpenClaw gateway) | $6 | Hetzner 2vCPU/4GB |
| **Total** | **~$400/mo** | ~800 prospects enriched |

**vs. Clay alone:** $720/mo for comparable enrichment with weaker LATAM data  
**Cost per qualified prospect:** ~$0.50 (vs $0.90 with Clay-only)

---

## 8. LIMITATIONS + RISKS

### LinkedIn rate limits

```
Free account:    ~100 profile views/day
Premium:         ~150 profile views/day
Sales Navigator: ~1,000 searches/day (recommended for this use case)

MITIGATION:
  - Use PhantomBuster API (not browser clicks) for bulk employee lists
  - Multiple LinkedIn accounts in rotation (Bright Data proxies per account)
  - Never exceed 80 profile views/day per account
  - Throttle via Paperclip: max 80 LinkedIn lookups/day hard limit
```

### Instagram/TikTok detection

```
RISKS:
  - Instagram blocks after ~200 rapid profile visits
  - TikTok has aggressive bot detection (mouse movement analysis)
  - Both platforms regularly change HTML structure

MITIGATION:
  - Apify actors (maintained, anti-detect built-in) preferred over raw browser
  - Add random delays: 3–15 seconds between requests (Playwright)
  - Use Bright Data residential proxies (Colombia IP pool)
  - Scrape only public data (no login required for brand pages)
  - Cache results: don't re-scrape same brand within 7 days
```

### Colombian legal framework (Ley 1581/2012)

```
Colombia's data protection law:
  - Prohibits "undue use" of personal data
  - Public business information = generally OK to collect
  - Personal contact data (email, phone) = requires consent for marketing use

COMPLIANT APPROACH:
  - Collect only public business information (company name, industry, city)
  - Contact enrichment for B2B outreach (business contacts = lower risk)
  - First outreach message must include: "Para no recibir más mensajes, responda STOP"
  - No scraping of private profiles, CVs, or personal social accounts
  - Supabase stores opt-out list; OpenClaw checks before every send

LinkedIn's own policy:
  - Terms prohibit "scraping without authorization"
  - Risk: account termination (use dedicated scraping accounts)
  - Mitigation: PhantomBuster/Apify provide safer API-backed extraction
```

### Data accuracy

```
KNOWN ISSUES:
  - LLM industry classification: ~85% accuracy (15% needs human review)
  - Email pattern inference: ~70% deliverability (30% bounce)
  - WhatsApp extraction: ~60% success rate from public sources
  - Budget tier estimate: ±1 tier accuracy (rough proxy)

MITIGATION:
  - Random 5% human QA sample per discovery run
  - Confidence score threshold: only advance prospects ≥ 0.65 confidence
  - Email validation (MX + SMTP) before adding to outreach queue
  - "Needs review" queue in Paperclip for low-confidence entries
```

---

## 9. OPENCLAW WORKFLOWS (IMPLEMENTATION)

### Workflow A: Daily Discovery Job

```bash
# OpenClaw skill: sponsor-discovery (install via ClawHub)
openclaw skills install sponsor-discovery

# Config at ~/.openclaw/skills/sponsor-discovery/config.yaml:
discovery:
  target_cities: ["Medellín", "Bogotá", "Cali"]
  target_industries: ["fashion", "food_beverage", "beauty", "fintech", "spirits"]
  search_provider: brave
  scraper: firecrawl
  max_results_per_query: 20
  dedupe_window_days: 7
  output_endpoint: "https://your-supabase.functions.supabase.co/sponsor-enrich"
  output_auth: "${SUPABASE_SERVICE_ROLE_KEY}"

# Run manually for testing:
openclaw agent run sponsor-discovery --dry-run

# Or via Paperclip heartbeat:
# CEO agent creates issue "Discovery: {date}" → Discovery agent picks up
```

### Workflow B: LinkedIn + Social Enrichment

```bash
# Triggered by Paperclip issue: "Enrich: {prospect_name}"

openclaw agent run sponsor-social-enrich \
  --prospect-id "uuid-from-supabase" \
  --linkedin-domain "leonisa.com" \
  --instagram-handle "leonisa" \
  --output-endpoint "https://...supabase.co/functions/v1/sponsor-enrich"

# Under the hood:
# 1. PhantomBuster: company page + employee list
# 2. Apify: Instagram posts (last 50) + TikTok (if handle known)
# 3. Clay: email enrichment for top 3 contacts
# 4. Hermes: AI analysis (industry, audience, budget)
# 5. Supabase: upsert prospect + contacts rows
```

### Workflow C: Signal Detection on Event Pages

```bash
# Runs after any new event is added to mdeai DB
# TRIGGER: Supabase webhook → OpenClaw webhook → signal detection job

# OpenClaw receives:
{
  "event_id": "uuid",
  "event_name": "Colombiamoda 2025",
  "event_website": "https://colombiamoda.com",
  "event_category": "moda",
  "event_date": "2025-07-15"
}

# OpenClaw:
# 1. Firecrawl: scrape event website (sponsors section)
# 2. Google search: "Colombiamoda 2025 patrocinadores"
# 3. Instagram: search #Colombiamoda2025 (via Apify)
# 4. Hermes: extract brand names from all content
# 5. For each brand found: upsert to prospects table with signal
```

### Workflow D: Automated Outreach Queue

```bash
# After scoring, high-priority prospects (score ≥ 0.75) enter outreach queue
# OpenClaw manages the sequence:

Day 0:
  openclaw whatsapp.send(prospect.primary_contact.whatsapp, {
    template: "sponsor-introduction-v1",
    variables: {
      contact_name: "Carlos",
      brand_name: "Leonisa", 
      event_name: "Reina de Antioquia 2026",
      audience_stat: "80% mujeres 25-35 Antioquia"
    }
  })

Day 3 (if no reply):
  openclaw whatsapp.send(... follow_up_template ...)

Day 8 (if no reply):
  openclaw email.send(prospect.primary_contact.email, {
    subject: "Patrocinio exclusivo: {event_name}",
    attachment: "sponsor-deck-{brand}.pdf"  # Hermes-generated
  })

Day 14 (if no reply):
  openclaw linkedin.inmail(prospect.primary_contact.linkedin_url, {
    message: hermes.generate("linkedin_inmail", prospect)
  })

Day 22 (no reply):
  supabase.update(prospect, { status: "dormant" })
  paperclip.close_issue(issue_id, reason: "no_response_22d")
```

---

## 10. 10 OPTIMIZATIONS FOR ACCURACY AND SCALE

### 1. Pre-filter by geography before deep scraping

```python
# Fast filter: only deeply scrape companies with Colombian web presence
# Using Bright Data geolocation lookup:
geo_check = requests.get(
  f"https://api.brightdata.com/geoip?domain={domain}",
  headers={"Authorization": f"Bearer {BRIGHT_DATA_KEY}"}
)
if geo_check.json()["country"] not in ["CO", "LATAM"]:
    prospect.status = "foreign_skip"
    continue
```

### 2. Aggressive dedupe to avoid re-scraping

```sql
-- Before starting any scrape, check if we've seen this domain recently:
SELECT id, last_enriched_at 
FROM sponsor_discovery.prospects
WHERE (website ILIKE '%' || $1 || '%' OR instagram_handle = $2)
  AND last_enriched_at > now() - interval '7 days';

-- If found and fresh → skip scraping, use cached data
-- If found but stale → re-enrich only changed fields
-- If not found → full scrape
```

### 3. Event-sponsor seed lists as high-signal starting points

```sql
-- Extract brands from past events as discovery seeds (free, 100% signal)
INSERT INTO sponsor_discovery.prospects (name, industry, signal_count, status)
SELECT DISTINCT 
  sp.organization_name,
  o.industry,
  COUNT(*) AS past_sponsorships,
  'seed' AS status
FROM sponsor.applications sp
JOIN sponsor.organizations o ON o.id = sp.organization_id
WHERE sp.status = 'approved'
GROUP BY sp.organization_name, o.industry
ON CONFLICT (website) DO UPDATE SET signal_count = EXCLUDED.signal_count + 1;
```

### 4. Shift to API-backed extraction whenever possible

```
Priority order (fastest → slowest, cheapest → most expensive):
  1. Existing Supabase data (0ms, $0)
  2. Cached Firecrawl result <7 days old (0ms, $0 marginal)
  3. Apify/PhantomBuster API (2–10s, $0.001–0.01/call)
  4. Firecrawl fresh scrape (3–15s, $0.002/credit)
  5. OpenClaw Playwright browser (15–60s, server CPU cost)
  6. Computer-use (60–180s, most expensive) — last resort

OpenClaw should default to options 1–3, use Playwright only for 
JS-heavy pages that Firecrawl can't render.
```

### 5. Rate-limit coordination via Paperclip

```yaml
# Paperclip budget settings (daily limits):
linkedin_profiles_per_day: 80
firecrawl_pages_per_hour: 300
apify_instagram_per_day: 500
clay_enrichments_per_day: 100
email_validations_per_day: 200
openclaw_browser_sessions_per_hour: 20
```

### 6. Enrich early, score late, discard aggressively

```
Enrichment pipeline order:
  1. Quick check: does this domain have a Colombian IP? (+1 second, free)
  2. Firecrawl: does the website mention "evento", "patrocin*", "alianza"? (5s, cheap)
  3. Only if yes → full enrichment: LinkedIn + Instagram + Clay (expensive)
  
Result: 70% of leads are filtered in steps 1-2
         Clay is only called on the remaining 30%
         → 70% cost reduction
```

### 7. Fine-tune signal detection prompts on real data

```
After 4 weeks of running:
  1. Export all sponsor_discovery.signals WHERE confidence < 0.7
  2. Human labels: correct_signal (true/false), correct_brand (string)
  3. Use labeled examples as few-shot in Hermes detection prompt:
  
     "Here are examples of sponsorship signals on Colombian event pages:
     EXAMPLE 1: [text] → {signal_type: 'direct', brand: 'Leonisa', confidence: 0.95}
     EXAMPLE 2: [text] → {signal_type: 'none', confidence: 0.05}
     ...
     Now analyze: [new_text]"
  
  Expected accuracy improvement: 85% → 93% after fine-tuning examples
```

### 8. Use mdeai's existing sponsor data as ground truth

```python
# Train "likelihood to sponsor" using actual signed sponsors as positives
existing_sponsors = supabase.table('sponsor.organizations').select('*').execute()

POSITIVE_SIGNALS_FROM_EXISTING_SPONSORS = [
  "local Medellín HQ",
  "beauty/fashion industry",
  "5–500 employees",
  "active Instagram (5k–100k followers)",
  "past event participation"
]

# When scoring new prospects, add a bonus:
ground_truth_match = compute_similarity(prospect, existing_sponsors)
adjusted_score = base_score * 0.85 + ground_truth_match * 0.15
```

### 9. Language-aware NLP for Colombian Spanish

```python
# Spanish + Colombianisms in signal detection:
COLOMBIA_SPECIFIC_TERMS = [
  "parce", "parcerito",     # informal address
  "chévere", "bacano",      # positive sentiment 
  "man", "nena",            # casual reference
  "pola",                   # beer (regional)
  "paisa",                  # Medellín demonym
  "trago",                  # drink/spirits
  "prepago",                # prepaid (consumer behavior)
  "rumba",                  # party/nightlife
  "vaca",                   # group fund (crowdfunding analog)
]

# Hermes prompt includes Colombia-specific glossary:
"Note: Colombian Spanish uses these terms that may indicate sponsorship context:
 'rumba' = nightlife event, 'pola' = beer brand, 'paisa' = Medellín local..."
```

### 10. Predictive refresh cycle based on activity

```python
# Don't rescrape all 200 prospects every week — prioritize by activity:

def compute_refresh_priority(prospect: dict) -> str:
    days_since_enrichment = (now() - prospect["last_enriched_at"]).days
    
    # High priority: refresh every 3 days
    if prospect["outreach_status"] == "responded" or prospect["score"] >= 0.80:
        return "3d"
    
    # Medium priority: refresh every 7 days  
    if prospect["score"] >= 0.60 or prospect["signal_count"] >= 3:
        return "7d"
    
    # Low priority: refresh every 30 days
    return "30d"

# Paperclip enforces schedule via issue creation cadence
```

---

## 11. DB SCHEMA (sponsor_discovery additions)

### New columns for discovery engine

```sql
-- Extend sponsor_discovery.prospects (created in task 060):

ALTER TABLE sponsor_discovery.prospects ADD COLUMN IF NOT EXISTS
  instagram_handle text,
  tiktok_handle text,
  linkedin_url text,
  hq_city text,
  hq_country text DEFAULT 'Colombia',
  company_size_range text CHECK (company_size_range IN (
    '1-10', '11-50', '51-200', '201-500', '500+'
  )),
  budget_tier text CHECK (budget_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  ai_audience_summary text,
  ai_campaign_style text,
  signal_count integer NOT NULL DEFAULT 0,
  last_enriched_at timestamptz,
  enrichment_source text,    -- 'firecrawl', 'clay', 'apify', 'manual'
  openclaw_job_id text;      -- links to openclaw job that created this row

-- Contacts table (linked to prospects):
CREATE TABLE IF NOT EXISTS sponsor_discovery.contacts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id      uuid REFERENCES sponsor_discovery.prospects(id) ON DELETE CASCADE,
  full_name        text NOT NULL,
  title            text,
  email            text,
  email_confidence decimal(3,2),   -- 0.00–1.00
  email_validated  boolean,
  whatsapp         text,           -- +57XXXXXXXXXX format
  linkedin_url     text,
  instagram_handle text,
  seniority_score  decimal(3,2),   -- 0.00–1.00 (computed)
  is_primary       boolean NOT NULL DEFAULT false,
  source           text,           -- 'linkedin', 'website', 'instagram', 'clay'
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (prospect_id, email)
);

-- Signal detection results:
CREATE TABLE IF NOT EXISTS sponsor_discovery.signals (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id      uuid REFERENCES sponsor_discovery.prospects(id) ON DELETE CASCADE,
  event_id         uuid REFERENCES public.events(id),
  page_url         text NOT NULL,
  signal_type      text NOT NULL CHECK (signal_type IN (
    'direct_sponsorship', 'event_participation', 'influencer_collab',
    'logo_presence', 'product_placement'
  )),
  detected_text    text,
  confidence       decimal(3,2) NOT NULL,
  detected_by      text NOT NULL DEFAULT 'hermes',
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Enrichment job tracking:
CREATE TABLE IF NOT EXISTS sponsor_discovery.enrichment_jobs (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id      uuid REFERENCES sponsor_discovery.prospects(id),
  job_type         text NOT NULL CHECK (job_type IN (
    'firecrawl', 'apify_instagram', 'apify_tiktok', 'phantombuster_linkedin',
    'clay_email', 'clay_phone', 'zerobounce', 'hermes_analysis'
  )),
  status           text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'running', 'success', 'error', 'rate_limited'
  )),
  openclaw_job_id  text,
  cost_usd         decimal(8,4),
  started_at       timestamptz,
  completed_at     timestamptz,
  error_message    text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- RLS: service_role writes; admin reads via edge fn
ALTER TABLE sponsor_discovery.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_discovery.signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsor_discovery.enrichment_jobs ENABLE ROW LEVEL SECURITY;

-- Admin read policies:
CREATE POLICY "admin_read_contacts" ON sponsor_discovery.contacts
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role IN ('admin', 'super_admin')
  ));
```

---

## 12. IMPLEMENTATION PLAN (4 weeks)

### Week 1: OpenClaw + Search Foundation

- [ ] Deploy OpenClaw gateway (Hetzner VPS, Docker)
- [ ] Configure Brave Search API + Firecrawl skill
- [ ] Install: `firecrawl`, `crawl4ai`, `mrscraper` skills via ClawHub
- [ ] Set up SearXNG on same VPS (free search fallback)
- [ ] Paperclip: configure discovery job routine (daily 06:00 COT)
- [ ] Supabase: migrate new columns (contacts, signals, enrichment_jobs tables)
- [ ] Test discovery pipeline end-to-end with 10 seed brands

### Week 2: Social Scraping + Enrichment

- [ ] Apify account + Instagram + TikTok actors configured
- [ ] PhantomBuster account + LinkedIn company + employee scrapers
- [ ] Clay workspace + email enrichment configured
- [ ] ZeroBounce API key + email validation pipeline
- [ ] Bright Data residential proxy pool (Colombia IPs)
- [ ] Signal detection Hermes agent (prompt + test on 50 real pages)

### Week 3: Scoring + Contact Discovery

- [ ] Hermes scoring agent (Python formula, all 5 components)
- [ ] Contact ranking algorithm (seniority score)
- [ ] WhatsApp number extraction (+57 regex pipeline)
- [ ] `sponsor-enrich` edge function (writes to Supabase from OpenClaw)
- [ ] Admin CRM view (`/admin/discovery`) showing ranked prospect list
- [ ] Paperclip approval gate: score ≥70 → human review → advance to outreach

### Week 4: Scale + Optimization

- [ ] Outreach sequence wired to OpenClaw crons (Day 0→3→8→14→22)
- [ ] Hermes fine-tuned prompt (after 50+ real detections labeled)
- [ ] Refresh cycle automation (3d/7d/30d based on priority)
- [ ] Cost monitoring dashboard (enrichment_jobs cost_usd SUM per day)
- [ ] First 50 Colombian brands seeded and scored
- [ ] Full pipeline test: discovery → score → qualify → outreach (1 real sponsor)

---

## 13. QUICK-START: FIRST RUN COMMANDS

```bash
# 1. Install OpenClaw discovery skills
openclaw skills install firecrawl
openclaw skills install crawl4ai
openclaw skills install mrscraper

# 2. Configure secrets
openclaw secrets set BRAVE_SEARCH_API_KEY="..."
openclaw secrets set FIRECRAWL_API_KEY="..."
openclaw secrets set APIFY_API_TOKEN="..."
openclaw secrets set PHANTOMBUSTER_API_KEY="..."
openclaw secrets set CLAY_API_KEY="..."
openclaw secrets set SUPABASE_SERVICE_ROLE_KEY="..."

# 3. Seed the first 10 brands for testing
openclaw agent run sponsor-discovery \
  --seed-brands "leonisa,bancolombia,comfama,postobon,corona" \
  --event-type "moda" \
  --output-table "sponsor_discovery.prospects"

# 4. Check results in Supabase
# SELECT name, sponsor_fit_score, recommended_tier 
# FROM sponsor_discovery.prospects 
# ORDER BY sponsor_fit_score DESC;

# 5. Review in Paperclip
# Paperclip UI → Issues → "Qualify: {brand}" (score ≥70)
# → Approve → advances to outreach
```

---

## 14. SUCCESS METRICS (Month 1 → Month 3)

| Metric | Month 1 | Month 3 | Source |
|---|---|---|---|
| Prospects discovered/week | 50 | 250 | prospects COUNT WHERE created_at > 7d |
| Enrichment success rate | 60% | 85% | enrichment_jobs WHERE status='success' / total |
| Email discovery rate | 40% | 65% | contacts WHERE email IS NOT NULL / total |
| Email deliverability | 65% | 80% | email_validated = true / total |
| WhatsApp discovery rate | 30% | 50% | contacts WHERE whatsapp IS NOT NULL / total |
| Score ≥70 (qualified) | 15% | 25% | prospects WHERE sponsor_fit_score >= 0.70 |
| Signal detection accuracy | 80% | 93% | human QA sample accuracy |
| Outreach response rate | 5% | 15% | inbound replies / outbound sends |
| Pipeline → signed sponsor | 2% | 8% | signed contracts / total outreach |
| Cost per signed sponsor | ~$200k COP | ~$80k COP | total_cost / signed |

---

*Document: 063-openclaw-sponsor-discovery-engine.md*  
*Extends: 060 (discovery schema), 062 (3-layer system architecture)*  
*Prerequisites: OpenClaw gateway deployed, Paperclip running at localhost:3102*
