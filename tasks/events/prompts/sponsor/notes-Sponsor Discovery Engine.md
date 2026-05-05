> ⚠️ **PHASE 3 DESIGN NOTES — Not for immediate implementation.** LinkedIn scraping references below are for research purposes only — LinkedIn’s Terms of Service prohibit automated scraping. Any production implementation must use LinkedIn’s official Marketing API or manual research workflows. See task 063 for the structured discovery engine spec.

Here’s a **production‑ready Sponsor Discovery Engine** for mdeai (Medellín + LATAM event marketplace) built on **OpenClaw** as the core automation layer.

---

## 1. Full system architecture

text

`[User + Event Data]   mdeai internal DB (events, past sponsors, audiences) | V [Discovery Orchestrator (Paperclip‑style)]   - Schedules scraping jobs.  - Enforces rate limits + legal constraints.  - Routes data to OpenClaw + enrich‑tools. | V +-----------------------------------------------------+ | OpenClaw Layer (automation execution)               | | - Brave‑powered browser automation                  | | - Firecrawl‑backed web search & scraping            | | - LinkedIn / Instagram / TikTok navigation          | | - Form‑fills, navigation, login‑based scraping      | +-----------------------------------------------------+ | V +-----------------------------------------------------+ | External Tools Layer                                | | - Firecrawl: structured web page scraping           | | - Apify: social‑media scrapers (Instagram, TikTok)  | | - PhantomBuster: LinkedIn + website scraping        | | - Bright Data: proxies + anti‑bot rotation          | | - Clay: company / contact enrichment                | +-----------------------------------------------------+ | V +-----------------------------------------------------+ | AI‑Analysis Layer (LLM + rules)                     | | - Classify industry, audience, sponsorship style    | | - Extract past sponsorships & budget estimates      | | - Score & rank prospects                            | +-----------------------------------------------------+ | V [Data Store (PostgreSQL + analytics)]   sponsors, contacts, sponsorships, signals, scores`

- **OpenClaw** is the “do‑it” layer for browser navigation, logins, and multi‑source scraping.
    
- **Firecrawl / Apify / PhantomBuster** provide structured, high‑reliability data so OpenClaw doesn’t have to parse every page.
    
- **Clay** enriches company and contact profiles.
    
- **LLM‑based analysis** (e.g., Hermes‑style) runs the **sponsor‑fit scoring** and natural‑language insights.
    

---

## 2. Step‑by‑step pipeline

## Step 1 — Generate search queries

Inputs: Medellín + LATAM + nightlife / fashion + events.

Seed queries OpenClaw uses:

- `“patrocinador eventos Medellín”`
    
- `“sponsored by fashion event Colombia”`
    
- `“marcas patrocinan eventos Medellín noches”`
    
- `“powered by [industry] Colombia”`
    
- `“eventos gastronómicos Colombia patrocinados”`
    

OpenClaw then:

- Amplifies queries with “site:instagram.com”, `site:linkedin.com`, `site:camaradecomercio*.gov.co`, etc.
    
- Runs via **Brave search** + **Firecrawl** so results are pre‑fetched and structured.
    

## Step 2 — Web scraping (OpenClaw + Firecrawl + PhantomBuster)

For each result:

1. **Company websites**
    
    - OpenClaw visits:
        
        - `/about`, `/prensa`, `/blog`, `/career` pages.
            
    - Firecrawl reads HTML → returns clean text + metadata (e.g., “press release about event sponsorship”).
        
2. **Event websites**
    
    - OpenClaw scrapes:
        
        - “Sponsors” / “Partners” / “Powered by” sections.
            
    - Detects:
        
        - Company logos.
            
        - “Patrocinador oficial”, “Sponsor plata”, etc.
            
3. **Directories**
    
    - Use:
        
        - **Cámara de Comercio Medellín** (public business directory).
            
        - ProColombia / Invest in Medellín sites.
            
    - PhantomBuster or OpenClaw + Firecrawl = reliable extraction per profile.
        

## Step 3 — Social scraping (Instagram, TikTok, LinkedIn)

- **Instagram & TikTok**
    
    - OpenClaw + **Apify All‑in‑One Social Media Scraper**:
        
        - Given a brand username, fetch posts, reels, bio, collaborator mentions.
            
        - Extract:
            
            - Hashtags (`#Colombiamoda2025`, `#MedellinNightlife`).
                
            - Collab phrases (`“thank you [brand]”`).
                
            - Influencer‑tagged posts.
                
    - Firecrawl / Apify returns structured JSON (no full‑page scraping noise).
        
- **LinkedIn**
    
    - Use **PhantomBuster LinkedIn scraper** connected to your **Sales Navigator** account:
        
        - Scrape:
            
            - Company pages.
                
            - Employee profiles (marketing, partnerships, brand managers).
                
        - OpenClaw:
            
            - Controls flow, but critical data comes via PhantomBuster API to avoid rate‑limit‑style browser‑visits.
                
            - “Visit many profiles” via API instead of manually clicking 1000 times.
                

## Step 4 — Sponsor signal detection (NLP + keyword rules)

On each page/post, run simple LLM + keyword rules:

- **Keyword patterns** (any language):
    
    - `"sponsored by"`, `"powered by"`, `"patrocinado por"`, `"en alianza con"`, `"colaboración"`, `"brand partner"`.
        
- **Logo detection** (event‑page images):
    
    - Use OpenClaw + a small vision‑model or OCR step:
        
        - “Is this logo present?” → match vs mdeai‑brand‑logos or generic event‑logo dicts.
            
- **Influencer‑collab signals**:
    
    - “Gracias a [brand] por la colaboración” + tagged brand.
        
    - “Evento producido con [brand]” in video captions.
        

Results stored as:

- `sponsor_signals` table:
    
    - page_url, signal_type, detected_text, confidence.
        

## Step 5 — Contact identification

OpenClaw + Apify + PhantomBuster pipelines:

1. **Company‑level scraping**
    
    - From `/about` or `/team` pages:
        
        - “Director de marketing”, “Gerente de marca”, “Responsable comercial”.
            
    - From LinkedIn company page:
        
        - OpenClaw + PhantomBuster:
            
            - Filter by title keywords → return:
                
                - `name`, `title`, `url`, `description`.
                    
2. **Emails**
    
    - Apify / similar tools extract emails from bios / posts.
        
    - Use **Hunter‑style APIs** (via Clay):
        
        - Validates and infers patterns:
            
            - `firstname.lastname@company.com` for companies in Medellín.
                
3. **WhatsApp / contact forms**
    
    - OpenClaw:
        
        - Finds “WhatsApp business” links, generic contact forms, or “+57” numbers.
            
    - Clay:
        
        - Confirms Colombia‑format numbers: `+57 3xx 123 4567`.
            

Each contact is tagged with:

- `seniority_score` (e.g., “Director de marketing” = high, “community manager” = medium‑low).
    

---

## 3. OpenClaw workflows (detailed)

## 3.1 Discovery job (OpenClaw + Firecrawl + Brave)

1. **Trigger: daily cron**
    
    - Paperclip‑style orchestrator calls OpenClaw task `sponsor_discovery_daily`.
        
2. **Query generation**
    
    - LLM in OpenClaw:
        
        - Expands seed queries (Medellín + Colombia + “event sponsorship” + nightlife / fashion).
            
    - Result: `search_queries[]`.
        
3. **Firecrawl + Brave search**
    
    - OpenClaw configures:
        
        - `web_search` = Brave + Firecrawl fallback.
            
    - For each query:
        
        - Firecrawl fetches:
            
            - `title`, `url`, `text`, `metadata`.
                
        - OpenClaw:
            
            - Filters “about / press / sponsors / partnerships”‑oriented pages.
                
4. **Structured storage**
    
    - OpenClaw writes:
        
        - `candidate_companies`:
            
            - domain, name, detected_industry, description_snippet, source_urls.
                

## 3.2 LinkedIn + social enrichment (OpenClaw + PhantomBuster + Apify)

1. **LinkedIn**
    
    - OpenClaw:
        
        - Asks PhantomBuster API:
            
            - `"/scrape/linkedin/company?domain=brandxyz.com"`
                
            - `"/scrape/linkedin/employees?company=brandxyz&title_keywords=marketing"`
                
    - Receives:
        
        - `employees[]` with name, title, profile_url, skills.
            
    - Avoids mass‑profile‑visits via browser (rate‑limit safe).
        
2. **Instagram + TikTok**
    
    - OpenClaw → Apify Actor:
        
        - `InstagramTikTokPosts` actor with input:
            
            - `["brandxyz"]`
                
    - Result:
        
        - JSON with posts, captions, hashtags, tags, bio‑email.
            
    - OpenClaw:
        
        - Runs LLM to:
            
            - Classify “event‑related” vs “brand‑campaign” posts.
                
            - Detect sponsorship‑related language.
                

## 3.3 Signal‑detection workflow (OpenClaw + LLM)

For each page/post:

1. OpenClaw asks LLM:
    
    - “Is there a sponsorship signal here?”
        
    - Prompt includes:
        
        - Pre‑defined keyword list.
            
        - Event‑context (e.g., “Colombiamoda 2025”).
            
2. Output:
    
    - Structured JSON:
        
        - `{ signal_type, confidence, excerpt }`.
            
3. Log to `sponsor_signals` + link to `company_id` or `event_id`.
    

---

## 4. Contact discovery strategy (Medellín / LATAM)

- **Goal**: For each company, find 1–3 “best” contacts:
    
    - Decision‑makers: marketing, brand, partnerships, or “eventos / patrocinios”‑related roles.
        

## Steps

1. **Cross‑source matching**
    
    - Match:
        
        - Web‑based “team” page names ↔ LinkedIn profiles.
            
    - OpenClaw + Clay:
        
        - Normalizes names and resolves dups.
            
2. **Email strategy**
    
    - For each person:
        
        - Clay:
            
            - Infers pattern: `fname@company.com`, `f.last@company.com`, etc.
                
            - Calls Hunter‑style API to validate.
                
    - If no public mail:
        
        - Mark “requires contact‑form outreach via OpenClaw”.
            
3. **WhatsApp strategy**
    
    - OpenClaw:
        
        - Detects “+57 3xx …” phone numbers.
            
        - Tags “eligible for WhatsApp Business push”.
            
    - Clay:
        
        - Flags Colombia‑numbers with likely Medellín prefixes (`301`, `305`, etc.).
            
4. **Seniority ranking**
    
    - Rules:
        
        - `Director`, `Gerente`, `Head of` → score 1.0.
            
        - `Coordinador`, `Especialista`, `Analista` → 0.5–0.7.
            
    - Top‑ranked contact per company becomes “Primary” for outreach.
        

---

## 5. Sponsor scoring engine (0–1)

## Scoring formula (all normalized 0–1):

sponsor_fit_score=w1⋅audience_match+w2⋅industry_relevance+w3⋅local_presence+w4⋅sponsorship_history+w5⋅budget_fit\text{sponsor\_fit\_score} = w_1 \cdot \text{audience\_match} + w_2 \cdot \text{industry\_relevance} + w_3 \cdot \text{local\_presence} + w_4 \cdot \text{sponsorship\_history} + w_5 \cdot \text{budget\_fit}sponsor_fit_score=w1​⋅audience_match+w2​⋅industry_relevance+w3​⋅local_presence+w4​⋅sponsorship_history+w5​⋅budget_fit

Weights (Medellín case):

- `w_1` (audience_match) = 0.25
    
- `w_2` (industry_relevance) = 0.25
    
- `w_3` (local_presence) = 0.20
    
- `w_4` (sponsorship_history) = 0.15
    
- `w_5` (budget_fit) = 0.15
    

## How Hermes‑style LLM derives components

1. **audience_match** (0–1)
    
    - LLM reads:
        
        - Company website + social posts.
            
    - Output:
        
        - e.g., “audience = 25–35 year‑old fashion‑oriented + nightlife‑focused in Medellín” → high match vs mdeai events.
            
2. **industry_relevance** (0–1)
    
    - Companies in:
        
        - Fashion, nightlife, beverages, luxury, tech‑events → high score.
            
    - LLM classifies from description + categories.
        
3. **local_presence** (0–1)
    
    - Heavily weighted for Medellín focus:
        
        - “offices in Medellín” → 1.0
            
        - “Latam‑only” → 0.7
            
        - “no physical presence” → 0.3
            
4. **sponsorship_history** (0–1)
    
    - Based on:
        
        - Count of “sponsored by” / “event partners” matches in scraped data.
            
    - Rules:
        
        - 0 Past events → 0.1
            
        - 1–2 → 0.4
            
        - 3–5 → 0.7
            
        - 6+ → 0.9
            
5. **budget_fit** (0–1)
    
    - Inferred from:
        
        - Company size (revenue / headcount via LinkedIn + Crunchbase‑style data).
            
        - “logos on high‑profile events” → proxy for higher spend.
            
    - LLM outputs:
        
        - `{budget_tier: low, mid, high, enterprise}` → mapped to 0–1.
            

Final output:

- `sponsor_fit_score` rounded to 3 decimals.
    
- Ranked list exported to mdeai‑CRM.
    

---

## 6. Tool stack recommendation

## What each tool should handle

|Tool|Role in this Discovery Engine|
|---|---|
|**OpenClaw**|Primary orchestrator + browser automation; runs Brave‑powered search + Firecrawl + PhantomBuster / Apify APIs.|
|**Firecrawl**|Structured web‑page scraping; primary source for “event sponsorship” pages, blogs, press.|
|**Apify**|Instagram + TikTok scraping; extract posts, hashtags, collab‑signals.|
|**PhantomBuster**|LinkedIn + website scraping (via API to avoid browser‑rate‑limit issues).|
|**Bright Data**|Rotating proxies for high‑volume scraping; avoid IP blocks on Instagram / event sites.|
|**Clay**|Company + contact enrichment (funding, tech stack, email patterns, WhatsApp / contact‑form parsing).|

## Recommended hybrid architecture

- **Discovery flow**:
    
    - Brave‑based queries → Firecrawl pages → OpenClaw filters → store → PhantomBuster / Apify for social/LinkedIn.
        
- **Enrichment**:
    
    - OpenClaw sends domains → Clay → enhances company + contact records.
        
- **AI‑analysis**:
    
    - OpenClaw dumps text + JSON → local LLM → outputs sponsor‑fit score + insights.
        

This keeps:

- OpenClaw focused on **workflow + browser + API coordination**.
    
- External tools (Firecrawl, Apify, PhantomBuster, Clay) supplying **structured, high‑quality data**.
    

---

## 7. Risks and mitigation

## 1. Scraping limits (LinkedIn, Instagram)

- **Problem**: LinkedIn tightly limits:
    
    - ~80–100 profile views / day for free accounts, 150 for premium, 1,000 for Sales Navigator.
        
- **Mitigation**:
    
    - Use API‑backed tools (PhantomBuster / Apify) instead of manual browser‑click patterns.
        
    - Throttle via Paperclip scheduler: e.g., “max 80 LinkedIn profiles per day per account.”
        

## 2. Anti‑bot detection

- **Problem**: Instagram, TikTok, LinkedIn guard against rapid‑fire browser automation.
    
- **Mitigation**:
    
    - Use:
        
        - Bright Data proxies to rotate IPs.
            
        - Long‑interval polling (minutes vs seconds between actions).
            
        - Prefer API‑access when available (Apify, PhantomBuster).
            

## 3. Legal / privacy risks (Colombia)

- **Problem**: Colombian data‑protection law (Law 1581/2012) limits “undue use” of public data; privacy authorities recently ordered LinkedIn to curb scraping.[linkedin](https://www.linkedin.com/posts/jorge-de-los-rios_privacy-phr-privacycolombia-activity-7325972530727456768-DWvB)
    
- **Mitigation**:
    
    - Collect **only public**, event‑related, brand‑related information.
        
    - Do not scrape:
        
        - Private member data, CVs, salary‑info, etc.
            
    - Allow opt‑out via:
        
        - Clear “do‑not‑contact” links in mdeai‑sponsored emails.
            
    - Process PII only after explicit opt‑in.
        

## 4. Data accuracy issues

- **Problem**: Automated extraction can miss edge‑cases or misparse structured data.
    
- **Mitigation**:
    
    - Add human QA checkpoints:
        
        - Random‑sample review of 5% of discovered leads.
            
    - Use confidence scores:
        
        - Low‑confidence entries go to “needs review” queue.
            

---

## 8. 10 optimizations to improve accuracy and scale

1. **Pre‑filter domains by geography**
    
    - Use Bright Data + location‑based DNS so you only deeply scrape Colombia‑serving companies.
        
2. **Cache and dedupe aggressively**
    
    - Map domains and LinkedIn profiles to canonical IDs; avoid re‑scraping same company.
        
3. **Use “event‑sponsor”‑specific seed lists**
    
    - Inject known event‑sponsors (e.g., past Colombiamoda brands, nightlife sponsors) as seeds.
        
4. **Shift from browser‑clicks to API‑scraping**
    
    - Use PhantomBuster + Apify + Firecrawl whenever possible; keep OpenClaw mainly for tasks that **require manual logins or dynamic JS**.
        
5. **Rate‑limit coordinates via orchestrator**
    
    - Implement Paperclip‑style throttle:
        
        - “No more than 80 LinkedIn profiles per day per account”.
            
        - “No more than 300 domain‑scrapes per hour.”
            
6. **Enrich early, score late**
    
    - Run Clay right after discovery so OpenClaw only re‑scrapes truly promising prospects.
        
7. **Train fine‑tuned signal‑detector prompts**
    
    - Expose LLM to 100 real‑world “sponsored by” / “patrocinado por” pages so it generalizes better.
        
8. **Leverage mdeai‑owned data as ground‑truth**
    
    - Use existing sponsors to train a “likelihood‑to‑sponsor” model and bias seeds toward similar companies.
        
9. **Add language‑aware NLP**
    
    - Support “patrocinado por”, “en alianza con”, “powered by