---
task_id: 061-sponsor-activations-plan
title: Sponsor Activations — Digital, Physical, AI-Driven (Medellín / Colombia)
phase: PHASE-3-MARKETPLACE
priority: P1
status: Design
estimated_effort: 8–12 weeks full build
area: product + backend + AI + growth
depends_on:
  - '060-sponsor-discovery-qualification-module'
  - '052-sponsor-dashboard'
  - '054-sponsor-ai-edge-fns'
---

# Sponsor Activations — Complete Production Plan

> ⚠️ **PHASE 3+ ONLY** — All n8n references in this document are Phase 3+ infrastructure. Phase 1–2 uses Supabase Edge Functions + pg_cron only (no external orchestrator). Do not set up n8n until 10+ active paid sponsors are generating data worth automating. OpenClaw/Postiz integrations are also Phase 3+ (see task 062/064).

> Full activation system covering digital, on-site, social, and AI-driven channels
> tuned for Medellín, Colombia, and the mdeai event platform.

---

## 1. Full Activation Taxonomy

### A. Social Media Activations

| Activation                      | Platform          | Mechanic                                                   | Measurable KPI                      |
| ------------------------------- | ----------------- | ---------------------------------------------------------- | ----------------------------------- |
| **Influencer story tag**        | Instagram         | Contestant tags sponsor in pre-event Story                 | Story views, swipe-ups, link clicks |
| **Sponsored hashtag challenge** | TikTok            | #[BrandName]Challenge launched at event                    | UGC videos, views, follower adds    |
| **WhatsApp voting campaign**    | WhatsApp          | "Vote for your favorite via WhatsApp to win [Brand] prize" | Vote count, opt-in numbers          |
| **Giveaway co-branding**        | Instagram         | "Win [Brand product] — follow + tag 2 friends"             | Reach, new followers, entries       |
| **Live countdown Stories**      | Instagram         | Brand-branded countdown to event or voting close           | Views, DMs                          |
| **Influencer unboxing**         | TikTok/IG Reels   | Contestant opens sponsor gift box on camera                | Views, saves, shares                |
| **Branded poll**                | Instagram Stories | "Which look is your favorite? Powered by [Brand]"          | Poll responses                      |
| **YouTube pre-roll**            | YouTube           | 6-second sponsor bumper before event livestream            | Impressions, completion rate        |

**Medellín-specific:** Partner with micro-influencers (10k–100k) in Laureles, El Poblado, Envigado. Engagement rate 4–8% vs 1–2% for mega-influencers. Modash.io and Favikon track Medellín influencer data.

---

### B. Website / Digital Activations

| Surface | Placement | Format | Tracking |
|---|---|---|---|
| `contest_header` | Top banner across voting UI | 728×90 + mobile 320×50 | Impressions, CTR via `sponsor.impressions` + `sponsor.clicks` |
| `leaderboard_footer` | Below contestant rankings | 728×90 sticky | Scroll depth + CTR |
| `contestant_profile` | Per-contestant sponsor badge | 200×60 logo + tagline | Clicks per contestant |
| `category_header` | Above each category section | Full-width branded divider | Impressions |
| `digital_banner` | Sidebar on event detail pages | 300×250 | CTR |
| `qr_station` | Physical QR → digital page | Landing page with offer | Scans, conversions |
| **Embedded AI card** | Inside chat responses | "Powered by [Brand] — here's a deal for you" | Chat impressions |
| **Sponsored search result** | AI search returns | Brand result at position #1 | Clicks from search |
| **UTM attribution links** | All sponsor links | `?utm_source=mdeai&utm_campaign=[event]&utm_medium=[surface]` | Full Google Analytics funnel |

---

### C. Event / On-Site Activations

| Type | Description | ROI measurement |
|---|---|---|
| **Title sponsorship** | Event renamed "[Brand] Presents: Reina de Antioquia" — logo on all collateral, stage, tickets | Brand recall surveys + total impressions |
| **Stage branding** | LED backdrop with brand logo + color scheme during contest performances | Camera time (seconds) × CPM benchmark |
| **LED screens** | Brand videos on screens during intermissions (30s spots, 4× per show) | Spot count × estimated audience |
| **QR scan-to-vote** | Physical QR at venue → mobile vote page with brand interstitial | QR scans, vote completions |
| **QR scan-to-win** | "Scan to enter [Brand] giveaway" at sponsor booth | Scans, lead captures (name + phone) |
| **Branded Wi-Fi** | Network SSID: "Patrocinado por [Brand]" | Connections, captive portal page views |
| **Sponsor lounge / VIP area** | Branded hospitality zone with product sampling | Foot traffic (RFID or manual count) |
| **Photo booth with overlay** | Branded frame on selfie station → shared to IG | Photo count, social shares |
| **Product sampling station** | Brand distributes samples with QR to redeem discount | Distribution count, redemption rate |
| **Sponsor trophy / award** | "Premio [Brand] a la Mejor Pasarela" — category naming rights | PR mentions, social tags |

---

### D. Experiential Activations

| Activation | Mechanic | Complexity | Revenue model |
|---|---|---|---|
| **Spin-to-win kiosk** | Tablet at event → wheel spins → wins brand prize → email/WhatsApp capture | Medium | Lead capture fee |
| **Live voting leaderboard** | Branded real-time contestant ranking on LED screen | Low (already in mdeai) | Surface fee |
| **Scavenger hunt (ScanHunt)** | Scan QR codes at 5 sponsor booths to collect stamps → win prize | Medium | Per-booth sponsor fee |
| **AR face filter** | Instagram filter with brand + event branding, shared by contestants | High | Flat fee + usage bonus |
| **Gamified trivia** | "Answer 3 questions about [Brand] to get VIP access upgrade" | Medium | Lead + CPL model |
| **Second-screen experience** | Event app on phone syncs with stage: vote on phone while watching live | High | Premium surface fee |
| **Live auction (charity tie-in)** | Brand sponsors charity auction → bid via mdeai app | Medium | Rev share |

---

## 2. Activation Comparison Table

| Activation | Setup cost (COP) | Est. monthly impressions | Avg CTR | Revenue model | Complexity | ROI tier |
|---|---|---|---|---|---|---|
| Instagram influencer story | $500K–2M | 50K–500K | 3–8% swipe | Flat fee | Low | ⭐⭐⭐⭐ |
| TikTok hashtag challenge | $1M–5M | 100K–5M | 0.5–2% | Flat + UGC bonus | Medium | ⭐⭐⭐⭐⭐ |
| WhatsApp voting campaign | $200K–1M | 5K–50K direct | N/A (opt-in) | CPL $2K/lead | Low | ⭐⭐⭐⭐ |
| Contest header banner | $500K/month | 200K–1M | 2–5% | CPM + flat | Low | ⭐⭐⭐ |
| Contestant profile badge | $300K/month | 50K–300K | 4–8% | Flat or CPC | Low | ⭐⭐⭐⭐ |
| AI embedded card (chat) | $800K/month | 30K–100K | 8–15% | CPM premium | Low | ⭐⭐⭐⭐⭐ |
| QR scan-to-win on-site | $800K setup | 500–5K scans | 60–80% | CPL $5K/lead | Medium | ⭐⭐⭐⭐ |
| Title sponsorship | $15M–50M | All event traffic | N/A | Flat season | High (legal) | ⭐⭐⭐⭐⭐ |
| Live leaderboard branding | $2M/event | 10K–50K venue | N/A | Flat per event | Low | ⭐⭐⭐ |
| Spin-to-win kiosk | $1M setup | 500–2K/event | 90%+ (gamified) | CPL | Medium | ⭐⭐⭐⭐ |
| AR face filter | $3M–8M | 50K–500K | Viral potential | Flat | High | ⭐⭐⭐⭐ |
| Sponsored Wi-Fi | $500K | All venue attendees | Captive 100% | Flat | Low | ⭐⭐⭐ |
| Highlight reel (AI video) | $500K | 10K–200K | 5–12% | Flat | Low (AI) | ⭐⭐⭐⭐⭐ |
| Second-screen experience | $5M–15M | All event users | High engagement | Premium tier | High | ⭐⭐⭐⭐ |

---

## 3. Advanced Activation Strategies

### Real-time engagement during events

```
Architecture:
  Supabase Realtime → broadcast channel → mdeai web/app
  
  During voting window:
    Every 60s: UPDATE sponsor.roi_daily WHERE day=today
    Every 30s: broadcast leaderboard update to connected clients
    Sponsor leaderboard_footer impression count updates live
    Admin sees: "412 people currently viewing contest — Postobón banner served 5,847 times this hour"
```

### Second-screen experience

```
User flow:
  1. Attendee at venue opens mdeai.co on phone
  2. GPS/event code confirms they're on-site → "Bienvenido a Reina de Antioquia 2026"
  3. Sponsor banner: "Patrocinado por Claro — Vota y gana datos gratis"
  4. Vote from phone → real-time rank on LED screen updates
  5. After voting: Claro offer: "Escanea para activar 5GB gratis"
  
  DB: events.geo_fence jsonb (lat/lng bounding box)
      impressions.is_onsite boolean (derived from geo-check)
      onsite impressions billed at 2× rate
```

### Personalized sponsor content

```
Supabase edge fn: sponsor-personalize
  Input: viewer_user_id OR viewer_anon_id
  
  Logic:
    1. Load viewer profile: age, gender, city, past_votes
    2. Load active placements for event
    3. Score each placement by viewer fit:
       - Beauty brand → female 18-34 → score +0.3
       - Beverage → male 18-24 → score +0.2
    4. Return highest-score placement for surface
    5. Log impression with viewer_segment='female_18_34'
    
  Result: same surface shows different sponsor to different users
```

### Geo-targeted on-site activations

```
Implementation:
  1. Event venue defines geo_fence polygon (Supabase PostGIS)
  2. Browser Geolocation API checks user position
  3. If inside fence: show on-site sponsor content variant
  4. QR stations trigger: "Estás en el venue — escanea para ganar"
  5. On-site impressions tracked separately (higher value billing)
```

---

## 4. Innovative / Cutting-Edge Ideas

### 4.1 Dynamic slot pricing

```sql
-- pricing_rules table
CREATE TABLE sponsor.pricing_rules (
  surface          text PRIMARY KEY,
  base_price_cents int NOT NULL,
  surge_multiplier float NOT NULL DEFAULT 1.0,
  surge_threshold  int NOT NULL DEFAULT 2,   -- # of competing applications
  max_multiplier   float NOT NULL DEFAULT 3.0
);

-- Edge fn: compute real-time price
CREATE OR REPLACE FUNCTION sponsor.get_current_price(p_surface text, p_event_id uuid)
RETURNS int AS $$
DECLARE
  v_competing int;
  v_base int;
  v_multiplier float;
BEGIN
  SELECT base_price_cents, surge_multiplier, surge_threshold, max_multiplier
  INTO v_base, ... FROM sponsor.pricing_rules WHERE surface = p_surface;
  
  SELECT COUNT(*) INTO v_competing
  FROM sponsor.applications
  WHERE event_id = p_event_id
    AND activation_type = p_surface
    AND status IN ('submitted','under_review','approved');
  
  v_multiplier := LEAST(
    1.0 + (GREATEST(v_competing - v_surge_threshold, 0) * 0.25),
    v_max_multiplier
  );
  
  RETURN (v_base * v_multiplier)::int;
END;
$$ LANGUAGE plpgsql;
```

UI: "2 brands are viewing this slot — price increases 25% if another brand applies today"

### 4.2 AI-generated highlight reels

```
Tool: Mootion API or HeyGen API
Trigger: event ends → workflow fires

Step 1: Pull top 10 contestant photos + vote counts from DB
Step 2: Generate video:
  - Mootion prompt: "Create 30s highlight reel of beauty contest.
    Sponsor: [Brand]. Colors: [brand_colors]. 
    Include: top 3 contestant photos, vote counts, event name."
Step 3: Overlay sponsor logo in corner (FFmpeg)
Step 4: Upload to Supabase Storage (events/highlights/)
Step 5: Share via:
  - Infobip WhatsApp to sponsor contact: "Tu reels está listo 🎬"
  - Auto-post to event Instagram via Meta Business API (optional)
  - Add to sponsor dashboard as "Your activation highlight"

Cost: ~$0.50–2.00/reel via API
ROI: Sponsor brand appears in 50K+ video views organically
```

### 4.3 Performance-based Bronze tier

```
Implementation:
  applications.pricing_model = 'cpa'
  flat_price_cents = 0
  rev_share_pct = 0.030   -- 3% of attributed purchase value

Monthly invoice generation:
  SELECT SUM(conversion_value_cents) * 0.030 AS invoice_amount
  FROM sponsor.attributions a
  JOIN sponsor.placements p ON p.id = a.placement_id
  WHERE p.application_id = $1
    AND a.attributed_at BETWEEN invoice_period_start AND invoice_period_end
    AND a.conversion_kind = 'purchase'

Stripe: create invoice programmatically each month end
Minimum: $200K COP/month (floor to cover platform cost)
```

### 4.4 AI-generated creative variants + A/B testing

```
Edge fn: sponsor-creative-gen (task 054 expanded)

Input: { brand_name, brand_colors, tagline, surface, event_name }

Gemini imagen prompt:
  "Create a 728×90 banner ad for [Brand] at [Event].
   Colors: [hex]. Include logo space on left.
   Tagline: '[tagline]'. Style: modern Colombian fashion."

Outputs 3 variants → stored in sponsor.assets
  
Rotation: placements serve variant A for 24h, then B, then C
Winner: roi_daily shows highest CTR variant → auto-promote to 100%
Loser variants: paused after 72h

No human creative work required per activation.
```

### 4.5 Gamified referral system

```
Flow:
  1. Sponsor funds a prize pool: $5M COP
  2. Event creates referral code: REINA2026-BAVARIA
  3. Attendees share code → friend buys ticket or votes
  4. Referrer gets points → leaderboard → top 3 win prize
  
  DB:
    sponsor.referral_codes (code, application_id, reward_per_referral_cents)
    sponsor.referrals (code_id, referrer_user_id, referred_user_id, converted_at)
  
  Attribution: referral → sponsor
  Sponsor sees: "Your $5M prize pool generated 3,200 referrals → 890 new votes"
  Cost per referral: ~$1,562 COP ($0.40 USD) — highly efficient
```

---

## 5. AI Features + Agent Workflows

### 5A. AI Content Generation

```
sponsor-creative-gen edge fn (Gemini Pro):

1. Banner ads:
   Input: brand_data + surface dimensions + event_theme
   Output: banner HTML/CSS OR Gemini imagen URL
   
2. Caption generator:
   Input: placement.surface + event.name + brand.tagline
   Output: 3 Instagram caption variants (Colombian Spanish)
   e.g., "✨ El evento del año llega con el respaldo de @leonisa
          Vota por tu reina favorita y gana sorpresas increíbles 🌺
          #ReinaDeAntioquia #Leonisa #Medellín"

3. WhatsApp message generator:
   Input: brand + prospect_data + event + match_score
   Output: 160-char personalized WhatsApp pitch
   
4. Proposal PDF:
   Input: event + sponsor + match_score + surface_mockups
   Output: 8-slide bilingual PDF via Gemini + HTML→PDF
```

### 5B. AI Matchmaking

```
sponsor-audience-match edge fn:

Score = (
  audience_overlap_pct × 0.35   -- Gemini compares brand vs event audience
  + category_fit × 0.25         -- lookup table
  + past_activity × 0.20        -- enrichment_data.sponsorship_frequency
  + local_presence × 0.10       -- Medellín HQ = 1.0
  + budget_fit × 0.10           -- tier affordability
)

Recommended surfaces per score range:
  score > 0.80 → title + contest_header + contestant_profile
  score 0.65–0.80 → leaderboard_footer + digital_banner
  score 0.50–0.65 → qr_station only
  score < 0.50 → micro-slot only
```

### 5C. AI Insights (Gemini Flash)

```
sponsor-roi-explain edge fn:

Prompt:
  "You are a sponsorship analyst.
   Brand: [brand_name]. Event: [event_name].
   Last 7 days data:
     Impressions: [n]. Clicks: [n]. CTR: [n]%.
     Attributed purchases: [n]. Cost per purchase: $[n] COP.
     Top surface: [surface] (CTR [n]%).
     Audience: [breakdown].
   
   Write 3 bullet insights in Colombian Spanish:
   1. What is performing well and why
   2. What to optimize
   3. Predicted performance next 7 days
   
   Keep it concise, data-driven, actionable."

Output stored in applications.campaign_goals.ai_insight
Refreshed daily by pg_cron
```

### 5D. AI Optimization Agent

```
Trigger: daily cron OR when CTR drops >20% vs 7-day average

sponsor-optimize edge fn logic:

IF surface_ctr < platform_avg_ctr × 0.7:
  → "Move to higher-traffic surface: leaderboard_footer → contest_header"
  → Push recommendation to sponsor dashboard
  → Admin gets Realtime notification

IF peak_hour not in current_schedule:
  → "Your CTR peaks Tue-Thu 18:00-21:00 — recommend scheduling impressions 
     to weight 3× during this window"

IF creative.age > 14 days AND CTR_trend = 'declining':
  → "Creative fatigue detected — generating 3 fresh variants"
  → Trigger sponsor-creative-gen
  → Admin approval → auto-swap
```

### 5E. AI Agents (full pipeline)

```
Agent 1: sponsor-discovery-agent (n8n, daily)
  → OpenClaw scrapes LinkedIn / Instagram / local directories
  → Firecrawl enriches websites
  → Gemini classifies industry + audience
  → Inserts into sponsor_discovery.prospects

Agent 2: sponsor-score-agent (Supabase edge fn, on demand)
  → Loads prospect + event data
  → Computes match_score
  → Writes event_matches + recommended surfaces + tier

Agent 3: outreach-sequence-agent (n8n, per prospect)
  → Day 0: Infobip WhatsApp (personalized Gemini message)
  → Day 3: WhatsApp follow-up
  → Day 5: Instagram DM (OpenClaw)
  → Day 8: Resend.com email + proposal PDF attached
  → Day 16: LinkedIn InMail (OpenClaw)
  → Day 22: Dormant → re-queue next event

Agent 4: campaign-monitor-agent (pg_cron, every 5 min)
  → Checks CTR vs benchmark
  → Flags underperformers
  → Triggers optimize recommendations
  → Sends WhatsApp alert to sponsor if placements go live

Agent 5: renewal-agent (pg_cron, daily)
  → Checks contract_end_at < now() + 30 days
  → Generates post-campaign debrief PDF
  → Sends WhatsApp + email to sponsor contact
  → Creates renewal prospect entry in CRM

Agent 6: highlight-reel-agent (n8n, event end trigger)
  → Pulls top contestants + votes from DB
  → Calls Mootion / HeyGen API
  → Overlays sponsor logo (FFmpeg)
  → Uploads to Storage
  → WhatsApps reel to sponsor
```

---

## 6. Tool Stack — Full Comparison + Recommendation

### Discovery

| Tool | Stars | Price | Colombia coverage | Verdict |
|---|---|---|---|---|
| **OpenClaw** | — | $97/mo | ⭐⭐⭐⭐ (LinkedIn, Instagram, web) | **Primary — computer use agent** |
| **Firecrawl** | 34k GitHub | $83/mo | ⭐⭐⭐⭐⭐ (any URL, JS rendering) | **Primary — website scraping** |
| **PhantomBuster** | — | $69/mo | ⭐⭐⭐ (social scraping) | Alt to OpenClaw for social |
| **SerpAPI** | — | $50/mo | ⭐⭐⭐⭐ (Google Search) | Good for discovery queries |
| **Apify** | — | ~$5/1k results | ⭐⭐⭐⭐ (Instagram, TikTok actors) | **Social scraping** |

### Enrichment — Open Source First

| Tool | GitHub | Price | Capabilities | Verdict |
|---|---|---|---|---|
| **Fire Enrich** | [firecrawl/fire-enrich](https://github.com/firecrawl/fire-enrich) ⭐650 | **Free (self-hosted)** | 4 AI agents, real-time, citations | **Best for self-hosting — $0.01–0.05/lead** |
| **n8n** | [n8n-io/n8n](https://github.com/n8n-io/n8n) ⭐186k | **Free (self-hosted)** | 400+ integrations, AI nodes | **Orchestration backbone** |
| **Clay** | Closed source | $149/mo | 50+ sources, waterfall | Good if budget allows |
| **Apollo** | Closed | $99/seat | 250M+ contacts (weak LATAM) | Only for multinational brands |
| **Hunter.io** | Closed | $49/mo | Email finder + verify | Email verification only |
| **Twenty CRM** | [twentyhq/twenty](https://github.com/twentyhq/twenty) ⭐25k | **Free (self-hosted)** | Open source Salesforce | **Self-hosted CRM layer** |

### Outreach

| Tool | Price | Colombia fit | Open rate | Verdict |
|---|---|---|---|---|
| **Infobip** (WhatsApp) | Pay-per-msg | ⭐⭐⭐⭐⭐ | 85% | **Primary — already in stack** |
| **Resend** (email) | $20/mo | ⭐⭐⭐⭐ | 28% cold | **Email layer — Supabase native** |
| **Instantly.ai** | $97/mo | ⭐⭐⭐⭐ | 45% warm | Cold email sequences |
| **OpenClaw** | $97/mo | ⭐⭐⭐⭐ | 15% IG DM | Social channel |

### AI Creative

| Tool | Price | Use case | Verdict |
|---|---|---|---|
| **Gemini Pro** | Per token | Proposals, captions, copy, insights | **Already in stack** |
| **Gemini imagen** | Per image | Banner mockups, surface previews | **Use for mockups** |
| **Mootion** | Per video | AI highlight reels, event videos | **Reel generation** |
| **HeyGen** | $29/mo | Branded video with logo overlay | Alternative to Mootion |
| **Omneky** | $500+/mo | Full ad campaign automation | Phase C only |

### Automation / Orchestration

| Tool | GitHub | Price | Verdict |
|---|---|---|---|
| **n8n** | [n8n-io/n8n](https://github.com/n8n-io/n8n) ⭐186k | **Free self-hosted** | **Primary orchestrator** |
| **Activepieces** | [activepieces/activepieces](https://github.com/activepieces/activepieces) ⭐11k | **Free self-hosted** | Simpler n8n alternative |
| Make (Integromat) | Closed | $9/mo | SaaS if VPS not available |

### Recommended mdeai Stack

```
Discovery:    OpenClaw + Firecrawl + Apify (Instagram/TikTok)
Enrichment:   Fire Enrich (self-hosted, free) + Gemini Flash classification
Scraping:     Firecrawl (JS-rendered, Colombian sites)
Outreach:     Infobip (WhatsApp) + Resend (email) + OpenClaw (Instagram DM)
Email seq:    Instantly.ai (cold outreach to corporate)
Orchestration: n8n (self-hosted on task 021 VPS)
CRM:          Twenty CRM (self-hosted) OR sponsor_discovery schema (built-in)
AI creative:  Gemini Pro + Gemini imagen + Mootion
Analytics:    Built-in (Supabase + roi_daily) + Blinkfire for social ROI

Monthly cost: ~$400–600/mo tools
              + ~$0.02/prospect Gemini enrichment
              + ~$0.005/WhatsApp message (Infobip)
Capacity:     500 prospects/mo, 200 outreach/day, 50 reels/month
```

---

## 7. OpenClaw Integration Plan

### Setup for mdeai

```
1. Deploy OpenClaw on existing VPS (task 021)
   docker run -d openclaw/openclaw:latest

2. Connect channels:
   - WhatsApp: connect brand's WhatsApp Business number
     Policy: allowlist mode (only send to verified prospects)
   - Instagram: connect @mdeai.co account
   - LinkedIn: connect admin LinkedIn account

3. Configure task-specific agents (WhatsApp policy post-Jan 2026):
   Agent: "Sponsor Outreach Agent"
   Entry point: n8n webhook
   Flow: receive prospect data → draft message → send → log response
   Completion: prospect replies OR 7 days elapsed
   
4. Workflow triggers from n8n:
   n8n → POST openclaw/api/task → {
     channel: 'whatsapp',
     to: '+573001234567',
     message: gemini_generated_message,
     context: { prospect_id, event_id, match_score }
   }
   
5. Response webhook (Infobip → n8n → Supabase):
   Prospect replies → Infobip webhook → n8n receives →
   UPDATE outreach_messages SET replied_at=now() →
   UPDATE prospects SET crm_status='responded' →
   Supabase Realtime notifies admin →
   Admin gets WhatsApp alert: "Bavaria respondió! 🎉"
```

### OpenClaw use cases for mdeai

| Use case | Channel | Trigger | Output |
|---|---|---|---|
| **Sponsor discovery** | Web (computer-use) | n8n daily cron | LinkedIn company list → prospects table |
| **Prospect outreach** | WhatsApp | match_score > 0.65 | Personalized WhatsApp pitch |
| **Follow-up sequence** | WhatsApp + Instagram | 3 days no reply | Multi-touch sequence |
| **Influencer DM** | Instagram | influencer_score > threshold | Collaboration pitch |
| **Renewal reminder** | WhatsApp | 30 days before contract end | Debrief PDF + renewal link |
| **Campaign alerts** | WhatsApp → admin | CTR drops 20% | Optimization notification |
| **Reel delivery** | WhatsApp | Event ends | Highlight reel + metrics report |

---

## 8. Channel Strategy — Colombia / Medellín

### Channel priority matrix

```
WhatsApp Business (Infobip)
  → Priority #1 for ALL outreach in Colombia
  → 92% smartphone penetration, 89% daily WhatsApp usage
  → Businesses expect WhatsApp contact (not email)
  → Response rate: 35% vs 8% email
  → Use: prospect outreach, sponsor alerts, renewal, reel delivery
  → Constraint: task-specific flows only (Jan 2026 policy)
  → Template approval: 2–5 business days via Meta

Instagram (OpenClaw + Meta Business API)
  → Priority #1 for fashion, beauty, lifestyle brands
  → Medellín influencer ecosystem: 50+ macro (500k+ followers)
  → Micro-influencers (10k–100k): higher engagement, lower cost
  → Key hashtags: #MedellinModa #ReinaDeAntioquia #MedellinBeauty
  → Top influencer categories: beauty, fashion, nightlife, fitness
  → Contact method: DM via OpenClaw OR creator marketplace

TikTok (Apify data + manual DM)
  → Priority #1 for youth events (18–24 segment)
  → Gemelas Abello: 20.8M TikTok followers — Colombian twins
  → #ColombiaChallenge pattern: high viral coefficient
  → Sponsored sound: brand-commissioned audio for challenge
  → Measurement: TikTok Creator Marketplace analytics

Email (Resend + Instantly)
  → Use for: corporate/fintech/telecom decision-makers
  → Bancolombia, Claro Colombia: procurement via email required
  → Subject line A/B testing in Instantly
  → Send from: outreach@mdeai.co (verified domain)

LinkedIn (OpenClaw InMail)
  → Use for: CMO/Marketing Director of national brands
  → After no WhatsApp response (Day 16)
  → Message tone: formal, ROI-focused
```

### Influencer segmentation (Medellín)

| Tier | Followers | Cost (COP) | Best for |
|---|---|---|---|
| Nano (UGC) | 1K–10K | $100K–300K/post | Authentic voting promotion |
| Micro | 10K–100K | $300K–800K/post | Product + event co-promotion |
| Mid | 100K–500K | $800K–2M/post | Launch amplification |
| Macro | 500K–2M | $2M–8M/post | Brand awareness |
| Mega | 2M+ | $8M–30M/post | Title sponsor only |

**Source:** Modash.io tracks top Medellín fashion/beauty influencers in real-time.

---

## 9. Industry Segmentation × Activation Fit

| Industry | Best activation | Channel | Pitch hook |
|---|---|---|---|
| **Fashion / Beauty** | Contestant profile badge + influencer stories | Instagram | "Tu marca en el guardarropa de la Reina" |
| **Beverage** | QR-scan-to-win + venue branding + Wi-Fi | On-site | "8,000 copas en una noche con tu logo" |
| **Fintech / Banking** | Cashless payments partner + digital banner | Digital | "Cashless powered by [Brand]" |
| **Telecom** | Wi-Fi naming + second-screen sponsor | On-site + digital | "Conecta tu marca a 50,000 fans" |
| **Nightlife / Hospitality** | VIP lounge naming + sponsor happy hour | Experiential | "Tu marca es la fiesta" |
| **Fitness / Wellness** | Hydration station + contestant fitness content | On-site + TikTok | "Potencia el entrenamiento de las candidatas" |
| **Luxury** | Title naming + trophy award + reel | All | "Tu marca define el estándar" |
| **Consumer Apps** | QR-to-download + embedded AI card + gamification | Digital | "Gana datos gratis al votar con [App]" |
| **Education** | Contestant scholarship award + digital banner | PR + digital | "Inversión en el talento de Colombia" |
| **Tourism** | Official travel partner + airport activation | PR + on-site | "La ciudad que enamora, patrocinado por [Brand]" |

---

## 10. 20 Actionable Activation Ideas for mdeai

| # | Idea | Surface | Revenue | Time to ship |
|---|---|---|---|---|
| 1 | **AI banner generator** — Gemini imagen creates contest_header from brand logo in 10 seconds | contest_header | Premium CPM | 1 week |
| 2 | **Live vote counter with brand** — "Voto #50,000 patrocinado por Bavaria" notification | leaderboard_footer | Flat per event | 3 days |
| 3 | **Sponsored voting boost** — brand pays for 2h window where contest_header is fullscreen | contest_header | Surge pricing | 1 week |
| 4 | **Contestant x Brand TikTok** — platform auto-matches brand + contestant for collab content | TikTok (external) | Influencer fee | 2 weeks |
| 5 | **WhatsApp voting opt-in with brand prize** — vote via WA → get brand coupon code | WhatsApp | CPL $3K/lead | 2 weeks |
| 6 | **QR at Colombiamoda booth** — mdeai sponsors booth → QR → sponsor brands visible | On-site | Flat per event | 1 month |
| 7 | **AI highlight reel on WhatsApp** — post-event reel sent to sponsor within 2h of event end | WhatsApp + Storage | Flat per reel | 2 weeks |
| 8 | **Branded countdown timer** — 48h countdown on homepage "Powered by [Brand]" | homepage | Flat per event | 3 days |
| 9 | **Micro-slot self-serve** — $200K COP buys contestant_profile badge for 24h, no approval | contestant_profile | Volume play | 1 week |
| 10 | **Gamified scavenger hunt** — scan 5 sponsor QRs at event → win prize → lead capture | On-site | CPL per scan | 3 weeks |
| 11 | **Dynamic surge notification** — "2 brands competing for contest_header — price rises in 4h" | Apply wizard | +25% avg deal | 1 week |
| 12 | **Influencer package** — brand pays for 3 micro-influencer Stories + mdeai digital banner bundle | Instagram | Bundle pricing | 2 weeks |
| 13 | **Sponsor trophy integration** — "Premio Postobón a la Mejor Pasarela" — award in app + real life | PR + digital | Premium flat | 2 weeks |
| 14 | **Personalized chat ad** — mdeai AI assistant mentions brand when user asks about event | AI chat | Premium CPM | 1 week |
| 15 | **Performance CPA Bronze** — $0 upfront, 3% of attributed purchases invoiced monthly | digital | Recurring rev | 2 weeks |
| 16 | **Renewal prediction alert** — admin sees "Claro has 68% renewal probability — call today" | Admin dashboard | Retention | 3 days |
| 17 | **Post-campaign WhatsApp debrief** — auto-PDF + WhatsApp with metrics 24h after event ends | WhatsApp | Retention tool | 1 week |
| 18 | **Social amplification report** — detect sponsor tags in contestant IG posts, add to ROI | Instagram (Apify) | Upsell value | 2 weeks |
| 19 | **AI competitor alert** — "Bavaria applied — Postobón has 48h to claim category exclusivity" | Admin + sponsor | Urgency pricing | 1 week |
| 20 | **Brand safety auto-screen** — Gemini scans sponsor IG before admin review → auto-approve clean | Admin queue | Time savings | 1 week |

---

## 11. Step-by-Step Implementation Plan

### Week 1–2 — Digital activation infrastructure

```
□ Deploy sponsor.pricing_rules table + get_current_price() function
□ Add surge pricing UI to apply wizard ("2 brands competing")
□ Build micro-sponsorship self-serve flow (contestant_profile, $200K COP)
□ Deploy sponsor-creative-gen edge fn (Gemini imagen banner output)
□ Add AI insight card to sponsor dashboard (sponsor-roi-explain)
□ Add AI optimization notifications (sponsor-optimize)
```

### Week 3–4 — On-site activation kit

```
□ Build QR station landing page (/qr/:placement_id)
   - Brand logo + offer + opt-in form (name + WhatsApp)
   - On submit: INSERT into sponsor_leads table
   - Redirect to: brand website with UTM
□ Set up lead capture table: sponsor.leads (name, whatsapp, email, placement_id, captured_at)
□ Build admin lead export: CSV download from sponsor dashboard
□ Create event geo_fence field + on-site impression detection
□ Branded Wi-Fi captive portal template (HTML)
```

### Week 5–6 — Social + influencer layer

```
□ Set up Apify Instagram actor (hashtag + mention monitoring)
□ Social amplification tracker: detect sponsor tags → add organic impressions to roi_daily
□ Build influencer prospect list (Modash API OR manual Modash export):
   Top 50 Medellín fashion + beauty influencers with contact info
□ OpenClaw Instagram DM flow for influencer outreach
□ Influencer contract mini-template (click-wrap, simpler than sponsor)
□ TikTok challenge kit: brief template + hashtag + audio recommendation
```

### Week 7–8 — AI automation pipeline

```
□ Deploy n8n on VPS (task 021)
   Workflows: discovery-agent, outreach-sequence-agent, renewal-agent,
              highlight-reel-agent, campaign-monitor-agent
□ Self-host Fire Enrich (github.com/firecrawl/fire-enrich)
   Connect: Firecrawl API + OpenAI API
   Seed: 50 Colombian brands
□ Infobip WhatsApp template approval:
   - Initial outreach template
   - Follow-up template
   - Debrief/renewal template
□ Deploy sponsor-discovery-search admin page
□ CRM pipeline board: Kanban in admin (Prospect → Converted)
```

### Week 9–10 — Marketplace launch

```
□ /explore/sponsor — brand-facing event browse
   Filters: industry, budget_tier, city, event_type
   Match score displayed per event
□ Self-serve apply flow (no sales call for bronze/micro)
□ Organizer config: /host/event/:id/sponsorships
   Set tiers, surfaces, prices, exclusivity rules
□ Dynamic pricing active: surge notification on competing applications
□ Launch with 10 seed events + 50 pre-enriched prospects
```

### Week 11–12 — Highlight reels + advanced AI

```
□ Mootion API integration for post-event reels
□ FFmpeg Supabase edge fn for logo overlay
□ Auto-WhatsApp reel delivery to sponsor
□ Performance CPA tier invoice generation
□ AI competitor alert system
□ Brand safety auto-screener (Gemini scan before admin review)
```

---

## Key GitHub Repos

| Repo | Stars | Purpose |
|---|---|---|
| [firecrawl/fire-enrich](https://github.com/firecrawl/fire-enrich) | 650+ | Open-source Clay alternative — self-host |
| [n8n-io/n8n](https://github.com/n8n-io/n8n) | 186k | Workflow automation backbone |
| [n8n-io/self-hosted-ai-starter-kit](https://github.com/n8n-io/self-hosted-ai-starter-kit) | — | n8n + AI ready setup |
| [twentyhq/twenty](https://github.com/twentyhq/twenty) | 25k | Open-source CRM (Salesforce alternative) |
| [activepieces/activepieces](https://github.com/activepieces/activepieces) | 11k | Simpler n8n alternative |
| [czlonkowski/n8n-mcp](https://github.com/czlonkowski/n8n-mcp) | — | Claude Code → builds n8n workflows |

---

## Related tasks

- `060-sponsor-discovery-qualification-module.md` — discovery + scoring engine
- `054-sponsor-ai-edge-fns.md` — AI edge fns (moderate, explain, optimize)
- `052-sponsor-dashboard.md` — sponsor ROI dashboard
- `021-openclaw-vps-provision.md` — VPS where n8n + OpenClaw + Fire Enrich run
