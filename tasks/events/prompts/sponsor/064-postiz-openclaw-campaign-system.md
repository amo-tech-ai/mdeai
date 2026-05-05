---
task_id: 064-postiz-openclaw-campaign-system
title: Sponsor Campaign System — Postiz + OpenClaw + AI
phase: PHASE-3-SPONSOR-AI
priority: P0
status: Design
estimated_effort: 5 weeks
area: campaign-automation
tools:
  - postiz
  - openclaw
  - hermes-agent
  - paperclip
  - cloudinary
  - composio
  - supabase
---

> ⚠️ **PHASE 3 DESIGN DOCUMENT** — All Cloudinary references in this doc should be replaced with **Supabase Storage** for Phase 1–2 implementation. Cloudinary may be adopted in Phase 3+ for advanced image transforms (per-platform resizing, watermarking, AI generation). Do not add Cloudinary as a dependency until 10+ active paid sponsors are onboarded (Paperclip governance gate applies — see task 062).

# Sponsor Campaign System: Postiz + OpenClaw + AI

**For:** mdeai.co — Medellín, Colombia event platform  
**Goal:** Plan, execute, automate, and optimize sponsor campaigns across all channels  
**Date:** 2026-05-04

> **Key insight (verified):** gitroomhq created BOTH Postiz (social scheduler) and Paperclip (agent control plane) — they are designed to work together. The OpenClaw + Postiz integration boosted Postiz to $70k MRR. This is the most natural stack for mdeai.

---

## A. CAMPAIGN STRATEGY (STEP-BY-STEP)

### Campaign lifecycle overview

```
CREATE → PLAN (AI) → GENERATE (AI) → APPROVE (human gate) → SCHEDULE (Postiz)
    → PUBLISH → TRACK (UTM) → ANALYZE (AI) → OPTIMIZE (AI) → REPORT (AI)
```

### 1. Campaign creation inputs

```typescript
// Every campaign is created with these inputs in Supabase:
type CampaignInput = {
  // Event context
  event_id: UUID;
  event_name: string;           // "Reina de Antioquia 2026"
  event_date: Date;             // 2026-07-15
  event_venue: string;          // "Plaza Mayor Medellín"
  expected_attendance: number;  // 5000
  
  // Sponsor context
  sponsor_application_id: UUID;
  sponsor_brand: string;        // "Leonisa"
  sponsor_tier: "bronze" | "silver" | "gold" | "platinum";
  sponsor_industry: string;     // "fashion"
  
  // Campaign goals (sponsor picks ONE primary)
  primary_goal: "ticket_sales" | "brand_awareness" | "leads" | "votes";
  secondary_goal?: string;
  target_audience: string;      // "mujeres 25-35 Medellín moda"
  
  // Budget
  campaign_budget_cop: number;  // 5_000_000 (COP)
  
  // Timeline
  campaign_start: Date;         // 14 days before event
  campaign_end: Date;           // event day + 1 (post-event recap)
}
```

### 2. AI-planned timeline (Campaign Planner Agent output)

```
PHASE 1: TEASER (Days 1–5, 14–10 days before event)
  Monday:   Instagram post — "Coming to Medellín: [Sponsor] × mdeai"
  Tuesday:  TikTok teaser (15s) — venue reveal + sponsor logo
  Thursday: WhatsApp broadcast — "VIP pre-sale opens Friday"
  Friday:   Instagram Stories — "Swipe up for early-bird tickets"

PHASE 2: LAUNCH (Days 6–10, 9–5 days before event)
  Daily Instagram: 1 post + 3–5 Stories (behind-the-scenes, sponsor feature)
  Daily TikTok: 1–2 reels (influencer collabs, event preview)
  Wednesday: WhatsApp — "Early-bird ends in 48h"
  Friday: X post — "Weekend agenda: mdeai x [Sponsor] 🎉"

PHASE 3: ACTIVATION (Days 11–14, 4–1 days before event)
  Daily: Instagram + TikTok (urgency content: "X tickets remaining")
  48h before: WhatsApp broadcast — "Solo quedan X entradas. Entra aquí:"
  24h before: Instagram Story countdown + Instagram + TikTok live preview
  Morning of event: X post + Instagram Story — "¡Hoy es el día!"

PHASE 4: EVENT DAY (Day 15)
  Live: Instagram Stories every 2h (venue, crowd, sponsor activation)
  Live: X updates (real-time atmosphere posts)
  Evening: TikTok live stream (if >10k followers) or recap clip

PHASE 5: POST-EVENT (Days 16–17)
  Day +1: Instagram recap reel + sponsor highlight
  Day +1: WhatsApp — "Gracias. Ver fotos: [link]" 
  Day +2: AI-generated sponsor report delivered
```

### 3. Channel mix (Medellín-first priorities)

| Channel | Role | Content type | Posting freq | Best time COT |
|---|---|---|---|---|
| **WhatsApp** | Conversion primary | Short copy + CTA + QR | 3×/week | 7–9 PM |
| **Instagram** | Awareness + brand | Posts + Carousels + Reels + Stories | 1–2 posts/day | 7–9 PM |
| **TikTok** | Virality + youth | 15–30s vertical clips | 1–3/day | 6–9 PM |
| **X (Twitter)** | Real-time updates | Text + images | 1–2/day | 8–10 PM |
| **Email** | Formal + invoices | HTML newsletter | 1×/week | Tue–Thu 10 AM |

---

## B. POSTIZ + OPENCLAW INTEGRATION PLAN

### What Postiz is

Postiz is an **open-source multi-platform social scheduler** (GitHub: `gitroomhq/postiz-app`) with:

- API-first design (REST + webhooks)
- Platforms: Instagram, TikTok, X, LinkedIn, Facebook, YouTube, Reddit, Pinterest, Bluesky, Dribbble, Slack, Discord
- Built-in AI post generation
- Visual calendar interface
- Self-hostable (Docker compose: `gitroomhq/postiz-docker-compose`)
- **Postiz Agent** (OpenClaw skill: `gitroomhq/postiz-agent`)

**Connection to mdeai stack:** gitroomhq (Postiz creators) also built Paperclip — the same control plane mdeai uses. This means Postiz ↔ Paperclip integration is first-class, not an afterthought.

### Postiz Agent (OpenClaw skill)

```bash
# Install via ClawHub:
openclaw skills install postiz

# Or directly from GitHub:
openclaw skills install github:gitroomhq/postiz-agent

# Configure:
openclaw secrets set POSTIZ_API_URL="https://your-postiz.domain.com"
openclaw secrets set POSTIZ_API_KEY="your-postiz-api-key"
```

**Available CLI commands (verified from `gitroomhq/postiz-agent` SKILL.md):**

```bash
# Auth
postiz auth:login              # OAuth2 device flow
postiz integrations:list       # show connected platforms
postiz integrations:settings <id>  # platform config

# Posts (28+ platforms: X, LinkedIn, Reddit, Instagram, TikTok, YouTube, Discord, Slack...)
postiz posts:create            # schedule post (see options below)
postiz posts:list              # query scheduled/published posts
postiz posts:delete <id>       # remove post
postiz posts:status <id>       # toggle draft ↔ scheduled
postiz posts:missing <id>      # resolve missing release IDs
postiz posts:connect <id>      # link post to provider content ID

# Media (IMPORTANT: must pre-upload — API rejects raw file paths or external URLs)
postiz upload <file>           # stage media, returns mediaId
# Then use mediaId in posts:create — not a direct URL

# Analytics
postiz analytics:platform <id>  # platform-level metrics
postiz analytics:post <id>      # individual post performance: impressions, clicks, engagement

# Threading
postiz posts:create --thread    # create threaded replies with configurable delay between replies
```

**OpenClaw skill wrapper (higher-level):**
```
postiz.createPost({
  content: string,           # caption text
  mediaIds: string[],        # from postiz.upload() — NOT external URLs
  platforms: string[],       # ["instagram", "tiktok", "x"]
  scheduleDate: ISO8601,     # scheduled publish time
  isDraft: boolean,          # true = draft (manual approve), false = auto-schedule
  tags: string[],            # internal labels: ["sponsor:leonisa"]
})
```

**TikTok note (verified):** Use Postiz draft scheduling, NOT direct TikTok API posting (shadowban risk). TikTok requires 30% manual work — human must select audio track. Warm up account ≥3 days before automation starts.

### Composio MCP for Postiz (alternative integration)

```typescript
// If using Composio MCP toolkit instead of direct skill:
// composio.dev/toolkits/postiz_mcp/framework/openclaw

// In OpenClaw config:
mcp:
  - name: postiz
    command: npx @composio/postiz-mcp
    env:
      POSTIZ_API_KEY: "${POSTIZ_API_KEY}"
      POSTIZ_API_URL: "${POSTIZ_API_URL}"

// Composio exposes same methods via MCP protocol:
// tools: postiz_create_post, postiz_schedule, postiz_get_analytics
```

### Full data flow

```
[mdeai DB: campaign created]
    │
    ▼
[Paperclip: creates issue "Campaign: Leonisa × Reina 2026"]
    │
    ▼
[Hermes Campaign Planner Agent]
    │ reads: event data, sponsor tier, past performance
    │ outputs: JSON calendar { day, channel, content_type, caption, hashtags, cta }
    ▼
[Hermes Content Generator Agent]
    │ generates: captions, hashtags, image prompts
    │ calls: Cloudinary (image transforms, watermark, resize per platform)
    │ outputs: { media_url, caption, hashtags, platform }
    ▼
[Paperclip approval gate: "Content review required"]
    │ Sponsor reviews in mdeai /sponsor/dashboard → approves/edits
    ▼
[OpenClaw Postiz skill]
    │ postiz.createPost({ content, media, platforms, scheduleDate })
    │ stores: post_id → Supabase campaign_posts table
    ▼
[Postiz publishes at scheduled time]
    │ sends webhook to mdeai on publish
    ▼
[mdeai: records published_at, post_id, platform]
    │
    ▼
[Hermes Performance Analyst: daily read of Postiz analytics API]
    │ joins: post_id + UTM clicks + ticket sales + WhatsApp opens
    ▼
[Weekly sponsor report: auto-generated by Hermes, sent via OpenClaw WhatsApp]
```

### Postiz deployment (self-hosted)

```bash
# On same Hetzner VPS as OpenClaw (or separate $6/mo instance):
git clone https://github.com/gitroomhq/postiz-docker-compose
cd postiz-docker-compose

# Configure .env:
DATABASE_URL=postgresql://user:pass@localhost:5432/postiz
REDIS_URL=redis://localhost:6379
NEXT_PUBLIC_BACKEND_URL=https://your-postiz.domain.com
BACKEND_INTERNAL_URL=http://localhost:3000
FRONTEND_URL=https://your-postiz.domain.com
OPENAI_API_KEY=xxx  # for built-in AI features (or use OpenRouter)

docker compose up -d

# Connect platform accounts:
# Postiz UI → Channels → Connect Instagram (OAuth)
# Postiz UI → Channels → Connect TikTok (OAuth)  
# Postiz UI → Channels → Connect X (OAuth)
```

### Posting best practices

```
INSTAGRAM:
  Posts:   1/day max (7–9 PM COT weekdays; 12–2 PM weekends)
  Stories: 3–5/day (throughout day — ephemeral, no spam concern)
  Reels:   3–4/week (highest reach algorithm boost)
  Carousels: 2/week (drives saves + engagement)

TIKTOK:
  Videos:  1–3/day (6–9 PM COT = peak Medellín nightlife scroll time)
  Length:  15–30s (hook in first 3 seconds mandatory)
  Format:  Vertical 9:16, 1080×1920px

X (Twitter):
  Tweets:  1–2/day (morning 8–10 AM + evening 8–10 PM)
  Threads: 1/week (campaign launch, event recap)
  Live updates: Event day (1 per hour during event)

DRAFT vs AUTO-POST:
  Use DRAFTS for:    New sponsor copy, legal warnings, first-ever post per account
  Use AUTO-POST for: Established templates, last-call reminders, day-of updates
  Approval threshold: Any post mentioning price or specific claim → human review
```

---

## C. AI AGENTS (HERMES)

### Agent 1: Campaign Planner

```yaml
# ~/.hermes/agents/campaign-planner.yaml
name: campaign-planner
model: anthropic/claude-sonnet-4.6
maxIterations: 30
timeoutSec: 180
tools: [file, code_execution, web-fetch]

systemPrompt: |
  You are a senior growth strategist for mdeai, an event platform in Medellín, Colombia.
  
  Given a sponsor + event brief, create a complete campaign plan.
  
  OUTPUT FORMAT (JSON):
  {
    "campaign_duration_days": number,
    "phases": [
      {
        "name": "teaser|launch|activation|event_day|post_event",
        "start_day": number,
        "end_day": number,
        "daily_schedule": [
          {
            "day": number,
            "channel": "instagram|tiktok|x|whatsapp|email",
            "content_type": "post|story|reel|carousel|broadcast|thread",
            "caption_brief": "1-line description of what the post should say",
            "cta": "buy_tickets|register|swipe_up|dm_us",
            "hashtags": ["#Medellín", "#mdeai"],
            "postiz_schedule_time": "HH:MM COT"
          }
        ]
      }
    ],
    "kpis": {
      "target_impressions": number,
      "target_clicks": number,
      "target_ticket_conversions": number
    },
    "influencer_recommendations": [
      { "tier": "nano|micro|mid", "count": number, "niche": string }
    ]
  }
  
  Colombian context:
  - WhatsApp open rate: 85–90% (primary conversion channel)
  - Instagram is #1 for brand discovery in Medellín
  - TikTok is fastest-growing for 18–28 year olds
  - Best posting time: 7–9 PM COT (after-work nightlife crowd)
  - Medellín events: fashion, nightlife, beauty pageants, gastronomy
```

### Agent 2: Content Generator

```yaml
name: content-generator
model: anthropic/claude-sonnet-4.6
maxIterations: 50
tools: [file, code_execution, image_gen]

systemPrompt: |
  You generate social media content for mdeai sponsor campaigns in Medellín, Colombia.
  
  For each content brief, generate:
  1. Caption (Spanish, max 150 words, colloquial Colombian tone)
  2. English translation (for brand approval if needed)
  3. Hashtags (mix of: 3 broad, 3 niche, 2 location, 2 sponsor)
  4. Image generation prompt (for Cloudinary AI or DALL-E)
  5. CTA text (specific, action-oriented, 1 sentence)
  6. ALT text for accessibility
  
  Tone rules:
  - Warm, energetic, authentic — NOT corporate
  - Use Colombian colloquialisms: "bacano", "chévere", "rumbear"
  - Sponsor must be mentioned organically (not #ad-heavy)
  - CTA always ends with emoji: "¡Entra aquí! 👇" or "Consigue tu entrada 🎟️"
  
  Platform-specific:
  - Instagram: emotional storytelling, aspirational
  - TikTok: hook in first line, trend-aware language
  - X: punchy, news-style, fits in 280 chars
  - WhatsApp: conversational, personal, direct
```

**Content Generator output example:**

```json
{
  "platform": "instagram",
  "caption": "¿Lista para la noche más bacana del año? 🌟\n\nLeonisa × mdeai trae una experiencia que no vas a querer perderte — moda, diseño colombiano, y mucho estilo en el corazón de Medellín.\n\n✨ Entradas disponibles por tiempo limitado.\n📍 Plaza Mayor, 15 de julio\n\n¡Consigue la tuya antes de que se agoten! 🎟️\n\n#mdeai #Medellín #LeonisaColombia #ModaColombia #EventosMedellín #PaísaStyle #NocheMedellín",
  "english_translation": "Ready for the most amazing night of the year?...",
  "hashtags": ["#mdeai", "#Medellín", "#LeonisaColombia", "#ModaColombia", "#EventosMedellín", "#PaísaStyle", "#NocheMedellín", "#RumbaMedellín"],
  "image_prompt": "Glamorous fashion event in Medellín Colombia, elegant Latina women in Leonisa lingerie-inspired fashion, Plaza Mayor venue, warm golden lighting, nighttime atmosphere, editorial photography style",
  "cta": "Consigue tu entrada antes que se agoten 🎟️",
  "alt_text": "Evento de moda mdeai × Leonisa en Plaza Mayor Medellín"
}
```

### Agent 3: Outreach Agent

```yaml
name: outreach-agent
model: anthropic/claude-sonnet-4.6
maxIterations: 40
tools: [file, code_execution, web-fetch]

systemPrompt: |
  You draft personalized outreach messages for mdeai's sponsor campaigns.
  
  MESSAGE TYPES:
  1. Influencer collaboration offer (WhatsApp/Instagram DM)
  2. Sponsor campaign approval request (WhatsApp/Email)
  3. Ticket sales reminder to past attendees (WhatsApp broadcast)
  4. Post-event thank you + results (WhatsApp/Email)
  
  Rules:
  - Always use first name ("Hola Carolina,")
  - Mention a specific detail about them (their niche, past post, city)
  - Keep WhatsApp messages under 100 words
  - Email messages max 200 words
  - Include clear opt-out: "Para no recibir más mensajes, responde STOP"
  
  INFLUENCER BRIEF FORMAT expected:
  { handle, follower_count, niche, recent_post_topic, location }
  
  OUTPUT: { channel, message, subject_if_email, followup_day }
```

### Agent 4: Performance Analyst

```yaml
name: performance-analyst
model: anthropic/claude-sonnet-4.6
maxIterations: 30
tools: [code_execution, file]

systemPrompt: |
  You analyze sponsor campaign performance for mdeai in Medellín.
  
  DATA SOURCES:
  - Postiz analytics API (impressions, clicks, engagement per post)
  - mdeai Supabase: ticket_sales, utm_clicks, whatsapp_opens
  - roi_daily table (from task 053): sponsor impressions/clicks
  
  TASKS:
  1. Attribution: "Which post drove the most ticket sales?"
  2. Timing analysis: "What time of day had best CTR?"
  3. Creative analysis: "Which caption style performed best?"
  4. Channel ranking: "WhatsApp vs Instagram vs TikTok — ROI per COP spent"
  5. Benchmark comparison: "How did this campaign compare to industry average?"
  
  OUTPUT: Spanish-language insights (3 paragraphs) + JSON data for dashboard
  
  Always include:
  - Top 3 performing posts (post_id + why)
  - 3 concrete recommendations for next campaign
  - Revenue attribution in COP
```

### Agent 5: Optimization Agent

```yaml
name: optimization-agent
model: anthropic/claude-haiku-4.5  # cheaper for frequent monitoring
maxIterations: 15
tools: [code_execution]

systemPrompt: |
  You monitor mdeai sponsor campaigns and trigger optimizations in real-time.
  
  Check every 6 hours:
  1. Ticket sales velocity vs target
  2. Post engagement rate vs benchmark
  3. WhatsApp click rate vs baseline
  
  DECISION RULES:
  - Ticket sales < 60% of target at Day 7: increase posting to 3×/day, trigger urgency WhatsApp
  - Post CTR < 1%: flag for creative swap, suggest 3 new caption variants
  - WhatsApp open rate < 50%: change send time by ±2h
  - Top performer: boost similar content, cancel underperforming scheduled posts
  - Event < 48h: activate urgency campaign regardless of performance
  
  OUTPUT FORMAT:
  { action: "increase_frequency|swap_creative|change_timing|activate_urgency|no_action",
    reason: string, specific_posts_to_cancel: string[], new_content_brief: object }
```

---

## D. CHANNEL STRATEGY (MEDELLÍN / COLOMBIA)

### WhatsApp (primary conversion channel)

```
Open rate: 85–90% Colombia (vs 20% email)
Click rate: 45–60% on properly crafted messages
Use for: final conversion, ticket links, VIP offers, event-day reminders

SETUP:
  Infobip WhatsApp Business API (existing in mdeai stack)
  Pre-approved templates (2–5 day approval per template)
  OpenClaw sends → Infobip delivers → logs to openclaw_messages table

BROADCAST LISTS (opt-in required):
  Past attendees list (opted in at checkout)
  VIP subscribers list
  Influencer list (separate, personalized)

TEMPLATES TO PRE-APPROVE:

  Template 1: Campaign launch
  "Hola {{1}} 👋 
  {{2}} × mdeai llega a Medellín el {{3}}.
  Entradas disponibles aquí: {{4}}
  Para no recibir mensajes, responde STOP"

  Template 2: Last call (48h)
  "⏰ Solo quedan {{1}} entradas para {{2}} × mdeai.
  El evento es {{3}} en {{4}}.
  Asegura la tuya: {{5}}"

  Template 3: Post-event thank you
  "Gracias por estar en {{1}} × mdeai 🙌
  Ver fotos y videos: {{2}}
  ¿Nos vemos en el próximo evento?"
```

### Instagram (brand + discovery)

```
Algorithm priorities 2026:
  Reels: 3–4×/week → highest organic reach
  Stories: 3–5/day → highest retention (appears first in feed)
  Posts: 1/day max → saves + shares drive algorithm
  Carousels: 2/week → 3× more engagement than single image

Medellín fashion ecosystem:
  Key accounts to tag: @colombiamoda, @medellin.fashion, @viviendomedellín
  Key hashtags: #ModaMedellín, #NocheMedellín, #PaísaStyle, #EventosMedellín
  
Postiz settings for Instagram:
  Enable: Instagram Reels scheduling
  First comment: hashtag block (keeps caption clean)
  Auto-publish: yes for Stories/Reels; draft for first campaign post

UTM structure:
  utm_source=instagram&utm_medium=social&utm_campaign={campaign_id}
  &utm_content={post_id}&utm_term={sponsor_brand}
```

### TikTok (virality + 18–28 demographic)

```
Best content formats for Medellín events:
  "Get ready with me" (GRWM) → fashion event preparation
  "Night out in Medellín" → venue reveal
  "What to wear at [event]" → sponsor fashion collab
  "Outfit check at mdeai" → UGC challenge
  "Best outfit wins" → gamified activation

Posting strategy:
  3 videos/day max (TikTok rewards consistency)
  Hook in first 2 seconds (text overlay + sound)
  POV, storytime, challenge formats → highest completion rate
  Sound: use trending Colombian music (vallenato remixes, reggaeton)

Postiz + TikTok:
  Schedule via Postiz (TikTok Business API)
  Auto-notify: account manager to manually add trending sound
  (TikTok API limitation: can't auto-add music)
```

### Influencer strategy (Colombia tiers)

```
TIER + PRICING (COP per post):

Nano (1k–10k followers):    $100k–300k COP
  → highest engagement rate (8–15%)
  → local Medellín accounts preferred
  → gift-based collab often sufficient

Micro (10k–100k):           $300k–1.5M COP
  → 3–6% engagement
  → niche fashion/nightlife/gastronomy
  → 1 Instagram post + 2 Stories + 1 TikTok

Mid-tier (100k–500k):       $1.5M–5M COP
  → brand-awareness focus
  → negotiate: 3-post package better value

Macro (500k–1M):            $5M–15M COP
  → national reach
  → Medellín brands as anchor

Mega (1M+):                 $15M–50M COP
  → only for Platinum sponsors
  → Maluma-adjacent talent for fashion

WORKFLOW:
  1. Hermes Outreach Agent drafts personalized DM (Instagram)
  2. OpenClaw sends via Instagram DM or WhatsApp
  3. Influencer accepts → contract via Paperclip issue
  4. Sponsor reviews collab content → approves in dashboard
  5. Influencer posts → Hermes tracks via @mention + hashtag monitoring
  6. Revenue attributed via unique UTM link per influencer
```

---

## E. SPONSOR ACTIVATION PLAN

### Activation 1: Social Media Campaign

```
Execution:
  Content Generator Agent → captions + images → Cloudinary (optimize)
  OpenClaw Postiz skill → schedule to Instagram + TikTok + X
  Paperclip gate: sponsor approves all content before scheduling
  
Postiz workflow:
  1. Agent creates posts in DRAFT state (approvalRequired: true)
  2. Sponsor reviews at /sponsor/dashboard/:id/campaigns
  3. Sponsor clicks "Approve" → webhook → OpenClaw → postiz.approvePost(id)
  4. Postiz publishes at scheduled time → sends webhook to mdeai
  5. mdeai records: post_id + published_at + UTM → campaign_posts table

KPIs tracked: impressions, reach, saves, shares, link_clicks (UTM)
```

### Activation 2: Website Placements (existing SponsoredSurface)

```
mdeai already has: SponsoredSurface component (task 049)
  → tracks impressions + clicks via existing edge fns

Campaign layer adds:
  Cloudinary-hosted creatives (resized per placement):
    contest_header:   1200×400px
    sidebar:          300×600px
    mobile_banner:    375×100px
  
  Dynamic creative rotation (A/B testing):
    Variant A: brand logo + tagline
    Variant B: sponsor product visual + CTA
    Hermes Campaign Monitor → picks winner at 80% confidence

  Postiz + mdeai sync:
    When Instagram post is published → Postiz webhook → mdeai updates
    website banner with same creative (consistent cross-channel look)
```

### Activation 3: Event Branding (venue + digital)

```
QR codes (per sponsor placement):
  OpenClaw generates: QR image → Cloudinary → campaign_posts table
  QR encodes: https://mdeai.co/e/{event_id}?sponsor={brand}&utm_source=qr
  
  Physical: printed on posters, wristbands, table cards
  Digital: displayed on venue LED screens (via event app)

LED screen content (Postiz + mdeai):
  Schedule: Postiz manages slide deck as "posts" with X-minute rotation
  Content: Cloudinary-hosted images (optimized for 1920×1080 display)
  OpenClaw cron: rotates slides every 10 minutes during event

Countdown widget:
  Embedded on mdeai event page: "X tickets remaining" (live Supabase realtime)
  Sponsor logo watermark (Cloudinary transformation)
```

### Activation 4: Experiential + WhatsApp Triggers

```
Booth activation:
  QR scan at venue → triggers OpenClaw WhatsApp flow:
    "Bienvenido al stand de [Sponsor] en mdeai 🎉
    Escanea y recibe tu regalo exclusivo: [link]"

  Flow continues:
    → User shares their name
    → Receives personalized sponsor-branded GIF (Cloudinary generated)
    → Optional: enters contest ("Mejor outfit gana VIP")

Real-time audience triggers (OpenClaw + Supabase webhooks):
  Event: ticket_purchased
    → Trigger: WhatsApp confirmation + sponsor-branded PDF ticket
    → Postiz: schedule "thanks for buying" Instagram Story mention
  
  Event: event 2h away (cron)
    → Trigger: WhatsApp broadcast "¡El evento empieza en 2 horas!"
    → Include: venue address + parking + sponsor exclusive offer

  Event: contest votes spike
    → Trigger: OpenClaw posts real-time X update
    → Include: sponsor hashtag + live leaderboard link
```

### Activation 5: Post-Event Content

```
T+1 hour after event ends:
  Hermes: generates recap summary from event data
  
T+24 hours:
  Content Generator: creates 3 recap posts
    - Instagram: photo carousel (best moments)
    - TikTok: 30s highlight reel (Mootion API or manual edit)
    - X: thread "Here's what happened at mdeai × [Sponsor]"
  
  Postiz schedules: recap content for T+24h publish
  
T+48 hours:
  Performance Analyst: generates sponsor ROI report
  OpenClaw: sends report via WhatsApp + email to sponsor contact
  Paperclip: closes campaign issue, creates renewal opportunity issue
```

---

## F. OUTREACH AUTOMATION SYSTEM

### Sponsor campaign approval flow

```
Day 0 (campaign created):
  OpenClaw WhatsApp to sponsor DM contact:
  "Hola {name} 👋 Su plan de campaña para {event} está listo para revisar.
  Vea el calendario completo aquí: {link}
  Necesitamos su aprobación antes del {deadline}."

Day 2 (if no approval):
  OpenClaw: send follow-up WhatsApp
  "Recordatorio: Su campaña inicia el {start_date}. 
  ¿Necesita hacer cambios al plan? Estamos listos para ajustar."

Day 4 (still no approval — Paperclip alert):
  Creates Paperclip issue: "Campaign approval at risk: {brand}"
  OpenClaw: calls sponsor via WhatsApp voice note (if OpenClaw supports) OR
  Hermes: drafts urgent email with "Last chance to approve" subject
  
Auto-approve rule (no response after 5 days):
  Standard tier templates with no custom copy → auto-approved
  Custom copy or creative → requires explicit approval (never auto-approve)
```

### Influencer outreach sequence

```
Day 0 — Initial reach (Instagram DM via OpenClaw):
  "Hola {first_name} ✨
  Soy del equipo de mdeai en Medellín.
  Vi tu contenido de {recent_post_topic} — perfecto para lo que estamos 
  creando con {sponsor_brand}.
  ¿Te interesa participar como creadora en {event_name}?
  Incluye: acceso VIP + {compensation}."

Day 3 (no reply) — WhatsApp (if number found):
  "Hola {first_name}, solo verificando mi DM de Instagram sobre
  mdeai × {sponsor}. El evento es el {date}. 
  ¿Podemos hablar 5 min?"

Day 7 (no reply) — Email:
  Subject: "Invitación collab: mdeai × {sponsor} — {city}, {date}"
  Body: [full pitch with deck PDF attached, Cloudinary-hosted]

Day 14 (no reply) → status: "dormant"
  OpenClaw: closes sequence, logs to enrichment_jobs
```

### Audience engagement triggers

```python
# Supabase webhooks → openclaw-inbound edge fn → OpenClaw → action

TRIGGERS = {
  "ticket_purchased": {
    "delay": "immediate",
    "action": "whatsapp_send",
    "template": "ticket_confirmation",
    "variables": ["name", "event_name", "date", "venue", "sponsor_offer"]
  },
  "link_clicked": {
    "delay": "5_minutes",  # don't spam immediately
    "condition": "not_yet_purchased",
    "action": "whatsapp_send",
    "template": "ticket_nudge",
    "variables": ["name", "event_name", "remaining_tickets"]
  },
  "event_48h_away": {
    "delay": "cron",
    "schedule": "48h_before_event_date",
    "action": ["postiz_schedule_urgency_posts", "whatsapp_broadcast_lastcall"],
    "condition": "tickets_remaining > 0"
  },
  "event_2h_away": {
    "delay": "cron",
    "action": "whatsapp_broadcast_reminder"
  },
  "post_event_1h": {
    "delay": "cron",
    "action": ["whatsapp_thankyou", "postiz_schedule_recap"]
  }
}
```

---

## G. METRICS + ROI TRACKING

### UTM structure (per campaign)

```
Base URL: https://mdeai.co/events/{event_id}

UTM schema:
  utm_source:    instagram | tiktok | x | whatsapp | email | qr
  utm_medium:    social | broadcast | story | reel | post | influencer
  utm_campaign:  {campaign_id} (UUID, maps to Supabase)
  utm_content:   {postiz_post_id} (for per-post attribution)
  utm_term:      {sponsor_brand} | {influencer_handle}

Example:
  https://mdeai.co/events/abc123?
    utm_source=instagram&
    utm_medium=reel&
    utm_campaign=c7f91234&
    utm_content=postiz_p8x2k&
    utm_term=leonisa

Shortened (OpenClaw generates via bit.ly or mdeai short-link service):
  https://mde.ai/e/abc123?u=instagram-reel-leonisa
```

### Attribution model

```sql
-- Full attribution chain:
SELECT
  cp.postiz_post_id,
  cp.platform,
  cp.sponsor_brand,
  cp.influencer_handle,
  COUNT(DISTINCT uc.click_id) AS link_clicks,
  COUNT(DISTINCT t.id) FILTER (WHERE t.utm_content = cp.postiz_post_id) AS ticket_sales,
  SUM(t.price_cop) FILTER (WHERE t.utm_content = cp.postiz_post_id) AS revenue_cop,
  cp.impressions,
  cp.reach,
  ROUND(COUNT(DISTINCT t.id)::numeric / NULLIF(uc.clicks, 0) * 100, 2) AS conversion_rate_pct
FROM campaign_posts cp
LEFT JOIN utm_clicks uc ON uc.utm_content = cp.postiz_post_id
LEFT JOIN tickets t ON t.utm_content = cp.postiz_post_id
WHERE cp.campaign_id = $1
GROUP BY cp.postiz_post_id, cp.platform, cp.sponsor_brand, cp.influencer_handle, uc.clicks
ORDER BY revenue_cop DESC NULLS LAST;
```

### Per-sponsor ROI dashboard (Supabase + Postiz Analytics)

```typescript
// useSponsorCampaign hook (extends task 052 SponsorDashboard):
function useSponsorCampaign(campaignId: string) {
  const { data: postizData } = useQuery({
    queryKey: ["postiz-analytics", campaignId],
    queryFn: async () => {
      // Calls mdeai edge fn → Postiz API → aggregates
      const res = await supabase.functions.invoke("campaign-analytics", {
        body: { campaignId }
      });
      return res.data;
    },
    refetchInterval: 3_600_000, // 1hr (Postiz data not realtime)
    staleTime: 1_800_000,       // 30min
  });
  
  return {
    totalImpressions: postizData?.total_impressions ?? 0,
    totalClicks: postizData?.total_clicks ?? 0,
    ticketRevenue: postizData?.attributed_revenue_cop ?? 0,
    topPost: postizData?.top_performing_post,
    byChannel: postizData?.by_channel,  // { instagram, tiktok, x, whatsapp }
    byInfluencer: postizData?.by_influencer,
  };
}
```

### Influencer tracking

```
Per-influencer attribution:
  - Unique UTM link: utm_term={influencer_handle}
  - Unique WhatsApp QR: encodes influencer_id → tracked in openclaw_messages
  - Postiz stores: postiz_post_id linked to influencer_id in campaign_posts table
  
Influencer leaderboard (in admin UI):
  Rank | Handle | Impressions | Clicks | Ticket sales | Revenue COP | Commission
  1    | @nano1  | 45k         | 2,100  | 87           | $4.35M COP  | $435k COP (10%)
  2    | @micro2 | 122k        | 4,800  | 201          | $10.05M COP | $1.005M COP
```

---

## H. AUTOMATION RULES (TRIGGER → ACTION)

```python
AUTOMATION_RULES = [
  {
    "name": "ticket_sales_drop_alert",
    "trigger": "ticket_sales_velocity < target_velocity * 0.6",
    "window": "3_consecutive_days",
    "actions": [
      "postiz.increase_frequency(campaign_id, platform='all', posts_per_day=3)",
      "openclaw.whatsapp_broadcast(list='warm_prospects', template='urgency')",
      "hermes.campaign_monitor.create_issue('Ticket sales at risk: {campaign}')"
    ]
  },
  {
    "name": "post_underperforming",
    "trigger": "post.ctr < benchmark_ctr * 0.5 AND hours_since_publish > 4",
    "actions": [
      "hermes.content_generator.generate_variant(post_id)",
      "postiz.cancel_similar_scheduled_posts(campaign_id, platform=post.platform)",
      "postiz.schedule_variant(new_content)",
      "paperclip.add_issue_comment('Swapped creative for {post_id} — low CTR')"
    ]
  },
  {
    "name": "influencer_replied",
    "trigger": "openclaw_messages.inbound WHERE prospect_type='influencer'",
    "actions": [
      "hermes.outreach_agent.generate_followup(prospect_id)",
      "openclaw.send_reply(channel=original_channel, message=followup)",
      "paperclip.update_issue_state('influencer_interested')"
    ]
  },
  {
    "name": "48h_urgency_campaign",
    "trigger": "event.date - now() <= 48h AND tickets_remaining > 0",
    "actions": [
      "hermes.content_generator.generate_urgency_pack(event_id)",
      "postiz.schedule_batch(posts=urgency_pack, interval='every_6h')",
      "openclaw.whatsapp_broadcast(list='all_opted_in', template='last_call')",
      "postiz.schedule(platform='x', content='thread: últimas {N} entradas')"
    ]
  },
  {
    "name": "sold_out_celebration",
    "trigger": "tickets_remaining == 0",
    "actions": [
      "postiz.cancel_all_pending_sale_posts(campaign_id)",
      "postiz.schedule_soldout_announcement()",
      "openclaw.whatsapp_broadcast(list='waitlist', template='sold_out_waitlist')"
    ]
  },
  {
    "name": "top_performer_boost",
    "trigger": "post.ctr > benchmark_ctr * 2.0 AND hours_since_publish < 6",
    "actions": [
      "hermes.content_generator.generate_similar(post_id, count=2)",
      "postiz.schedule_similar(new_posts, interval='every_8h')",
      "paperclip.add_comment('Boosting top performer: {post_id} — 2x CTR')"
    ]
  },
  {
    "name": "post_event_recap_trigger",
    "trigger": "event.end_time + 60_minutes",
    "actions": [
      "hermes.performance_analyst.generate_event_summary(event_id)",
      "hermes.content_generator.generate_recap_posts(event_id)",
      "postiz.schedule_batch(posts=recap_posts, schedule='T+24h T+48h')",
      "openclaw.whatsapp_sponsor(report=roi_report)"
    ]
  }
]
```

---

## I. DB SCHEMA (campaign_posts + extensions)

```sql
-- Campaign tracking table (connects mdeai ↔ Postiz ↔ sponsors)
CREATE TABLE public.campaign_posts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id       uuid NOT NULL,  -- references campaign (to be created)
  application_id    uuid REFERENCES sponsor.applications(id),
  event_id          uuid REFERENCES public.events(id),
  
  -- Postiz tracking
  postiz_post_id    text UNIQUE,    -- Postiz internal post ID
  postiz_status     text CHECK (postiz_status IN (
    'draft', 'pending_approval', 'scheduled', 'published', 'failed', 'cancelled'
  )),
  
  -- Content
  platform          text NOT NULL CHECK (platform IN (
    'instagram', 'tiktok', 'x', 'linkedin', 'facebook', 'youtube', 'whatsapp', 'email'
  )),
  content_type      text NOT NULL CHECK (content_type IN (
    'post', 'story', 'reel', 'carousel', 'thread', 'broadcast', 'newsletter'
  )),
  caption           text,
  hashtags          text[],
  media_urls        text[],        -- Cloudinary CDN URLs
  
  -- Attribution
  utm_campaign      text,
  utm_content       text,          -- = postiz_post_id for post-level attribution
  utm_term          text,          -- sponsor_brand or influencer_handle
  influencer_id     uuid REFERENCES sponsor_discovery.contacts(id),
  
  -- Scheduling
  scheduled_at      timestamptz,
  published_at      timestamptz,
  cancelled_at      timestamptz,
  
  -- Performance (updated daily from Postiz Analytics API)
  impressions       bigint DEFAULT 0,
  reach             bigint DEFAULT 0,
  likes             integer DEFAULT 0,
  comments          integer DEFAULT 0,
  shares            integer DEFAULT 0,
  saves             integer DEFAULT 0,
  link_clicks       integer DEFAULT 0,
  last_analytics_at timestamptz,
  
  -- Revenue attribution (joined from tickets table)
  attributed_tickets    integer DEFAULT 0,
  attributed_revenue_cop bigint DEFAULT 0,
  
  created_at        timestamptz NOT NULL DEFAULT now(),
  created_by_agent  text         -- 'campaign-planner', 'optimization-agent', 'manual'
);

-- Campaigns table (groups all posts for one sponsor × event)
CREATE TABLE public.campaigns (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id          uuid REFERENCES public.events(id) ON DELETE CASCADE,
  application_id    uuid REFERENCES sponsor.applications(id),
  sponsor_brand     text NOT NULL,
  primary_goal      text NOT NULL CHECK (primary_goal IN (
    'ticket_sales', 'brand_awareness', 'leads', 'votes'
  )),
  status            text NOT NULL DEFAULT 'planning' CHECK (status IN (
    'planning', 'pending_approval', 'active', 'paused', 'completed', 'cancelled'
  )),
  campaign_budget_cop bigint,
  ai_plan           jsonb,         -- Campaign Planner Agent output (full JSON calendar)
  kpi_targets       jsonb,         -- { impressions, clicks, ticket_conversions }
  paperclip_issue_id text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- UTM click tracking (server-side, from mdeai redirect links)
CREATE TABLE public.utm_clicks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  click_id      uuid NOT NULL DEFAULT gen_random_uuid(),
  campaign_id   uuid REFERENCES public.campaigns(id),
  post_id       uuid REFERENCES public.campaign_posts(id),
  utm_source    text,
  utm_medium    text,
  utm_campaign  text,
  utm_content   text,
  utm_term      text,
  user_id       uuid REFERENCES public.profiles(id),
  ip_hash       text,           -- SHA-256 hash for privacy
  user_agent    text,
  clicked_at    timestamptz NOT NULL DEFAULT now()
);

-- RLS: service_role writes; sponsors read only their own campaigns
ALTER TABLE public.campaign_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sponsor_read_own_campaigns" ON public.campaigns
  FOR SELECT TO authenticated
  USING (
    application_id IN (
      SELECT a.id FROM sponsor.applications a
      JOIN sponsor.organizations o ON o.id = a.organization_id
      WHERE o.primary_contact_user_id = (SELECT auth.uid())
    )
  );
```

---

## J. CLOUDINARY INTEGRATION

### Image pipeline (content generation → publish)

```typescript
// Cloudinary transformations per platform:

const PLATFORM_TRANSFORMS = {
  instagram_post:     "w_1080,h_1080,c_fill,q_auto,f_auto",
  instagram_story:    "w_1080,h_1920,c_fill,q_auto,f_auto",
  instagram_reel:     "w_1080,h_1920,c_fill,q_auto,f_auto",
  tiktok:             "w_1080,h_1920,c_fill,q_auto,f_auto",
  x_post:             "w_1200,h_675,c_fill,q_auto,f_auto",
  website_banner:     "w_1200,h_400,c_fill,q_auto,f_webp",
  mobile_banner:      "w_375,h_100,c_fill,q_auto,f_webp",
  whatsapp_image:     "w_800,h_800,c_fill,q_80,f_jpeg",
};

// Auto-watermark with sponsor logo:
const withSponsorLogo = (base_image: string, logo_url: string) => 
  `${base_image}/l_fetch:${encodeBase64(logo_url)},w_200,g_south_east,x_20,y_20`;

// OpenClaw generates all variants in one batch:
async function generateCampaignCreatives(imagePrompt: string, sponsorLogo: string) {
  const base = await cloudinary.upload(await dalle.generate(imagePrompt));
  
  return Object.entries(PLATFORM_TRANSFORMS).reduce((acc, [platform, transform]) => ({
    ...acc,
    [platform]: `${base.secure_url.replace('/upload/', `/upload/${transform}/`)}`,
  }), {});
}
```

---

## K. 15 ADVANCED FEATURES

| # | Feature | How it works | Priority |
|---|---|---|---|
| 1 | **AI campaign reports** | Performance Analyst generates weekly PDF (Hermes → HTML → Puppeteer → PDF → Cloudinary → WhatsApp) | P0 |
| 2 | **Automated sponsor proposals** | OpenClaw + Hermes: brand profile + event → generates tailored 3-page PDF proposal in Spanish | P0 |
| 3 | **Dynamic posting optimization** | Optimization Agent adjusts Postiz schedule every 6h based on live KPIs | P0 |
| 4 | **Referral reward system** | Unique UTM + promo code per attendee: "Trae 3 amigos → VIP gratis" | P1 |
| 5 | **Influencer marketplace** | Self-serve catalog at /marketplace/influencers — filtered by niche, city, audience size | P1 |
| 6 | **Real-time campaign dashboard** | Live Postiz analytics + mdeai UTM clicks + ticket sales in one sponsor view | P0 |
| 7 | **Geofence WhatsApp push** | When user near venue (GPS via app) → OpenClaw sends sponsor discount QR | P2 |
| 8 | **AI highlight reels** | Post-event: Hermes → Mootion API → 90s branded recap → Postiz → Instagram + TikTok | P1 |
| 9 | **A/B creative testing** | Postiz schedules 2 variants → Performance Analyst picks winner at 80% confidence → cancels loser | P1 |
| 10 | **Auto content library** | Cloudinary tags all assets: event + sponsor + platform + performance_score | P2 |
| 11 | **Smart personalized invites** | Cloudinary + merge fields: unique digital invite per VIP with their name + sponsor branding | P1 |
| 12 | **Cross-channel sanity checks** | OpenClaw checks: no conflicting messages across channels before any post publishes | P1 |
| 13 | **COP performance-based posting** | Silver/Gold tier: posting frequency scales with attributed revenue (more revenue = more Postiz posts) | P2 |
| 14 | **LATAM language adaptation** | Optimization Agent: detects audience location → adapts captions for Mexico vs Colombia dialects | P2 |
| 15 | **Sponsor renewal trigger** | 30 days before end_at: Performance Analyst generates renewal report → Outreach Agent sends renewal proposal | P0 |

---

## L. IMPLEMENTATION PLAN (5 WEEKS)

### Week 1: Postiz Setup + Basic Scheduling

- [ ] Deploy Postiz self-hosted (Hetzner VPS or same as OpenClaw)
- [ ] Connect: Instagram Business, TikTok Business, X Developer accounts
- [ ] Install `postiz` skill in OpenClaw (`openclaw skills install github:gitroomhq/postiz-agent`)
- [ ] Supabase: migrate `campaigns`, `campaign_posts`, `utm_clicks` tables
- [ ] Paperclip: create "Campaign Planner" agent with correct instructions
- [ ] First test: manually create campaign → Postiz draft → approve → publish

### Week 2: AI Content Generation

- [ ] Hermes Campaign Planner agent → generates JSON calendar
- [ ] Hermes Content Generator → captions + hashtags for each post
- [ ] Cloudinary: image pipeline (upload → transform per platform → return URLs)
- [ ] Postiz skill: `createPost` with media_urls from Cloudinary
- [ ] Sponsor approval flow: /sponsor/dashboard campaign tab → approve/edit posts

### Week 3: WhatsApp Automation

- [ ] Pre-approve 3 Infobip templates (launch, last-call, post-event)
- [ ] OpenClaw WhatsApp flows: ticket_purchased + link_clicked + 48h_urgency
- [ ] Supabase webhook → openclaw-inbound edge fn → trigger correct flow
- [ ] UTM tracking: utm_clicks table wired to mdeai redirect service

### Week 4: AI Agents + Optimization

- [ ] Hermes Outreach Agent → influencer DM generation + sequence
- [ ] Hermes Performance Analyst → daily analytics read from Postiz API
- [ ] Optimization Agent → automation rules (drop alert, underperformer, top-performer boost)
- [ ] A/B testing: Content Generator variants → Performance Analyst evaluation
- [ ] Campaign dashboard UI in /sponsor/dashboard

### Week 5: ROI Attribution + Reports

- [ ] Full UTM → ticket attribution pipeline (utm_clicks JOIN tickets)
- [ ] Influencer tracking (per-handle UTM + leaderboard)
- [ ] Performance Analyst: auto-generate weekly sponsor report
- [ ] OpenClaw: deliver report via WhatsApp + email (Cloudinary PDF)
- [ ] Renewal trigger: 30-day post-campaign renewal proposal automation

---

## M. ENVIRONMENT VARIABLES

```bash
# Postiz
POSTIZ_API_URL=https://your-postiz.domain.com
POSTIZ_API_KEY=xxx
POSTIZ_WEBHOOK_SECRET=xxx    # for verifying webhooks from Postiz

# Cloudinary
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx

# Add to OpenClaw secrets:
openclaw secrets set POSTIZ_API_URL="..."
openclaw secrets set POSTIZ_API_KEY="..."
openclaw secrets set CLOUDINARY_CLOUD_NAME="..."
openclaw secrets set CLOUDINARY_API_KEY="..."
openclaw secrets set CLOUDINARY_API_SECRET="..."
```

---

## N. QUICK-START: FIRST CAMPAIGN TEST

```bash
# 1. Install Postiz skill
openclaw skills install github:gitroomhq/postiz-agent

# 2. Create test campaign (via OpenClaw agent)
openclaw agent run campaign-planner \
  --event "Reina de Antioquia 2026" \
  --sponsor "Leonisa" \
  --goal "ticket_sales" \
  --start-date "2026-07-01" \
  --event-date "2026-07-15"

# 3. Review calendar output in /tmp/campaign-plan.json

# 4. Generate content for Day 1 posts
openclaw agent run content-generator \
  --plan /tmp/campaign-plan.json \
  --day 1

# 5. Create draft posts in Postiz
openclaw postiz createPost \
  --content "{caption from Day 1}" \
  --platforms instagram,tiktok \
  --schedule "2026-07-01T19:00:00-05:00" \
  --approval-required true

# 6. Check drafts in Postiz UI: http://your-postiz.domain.com
# 7. Approve → watch it publish at 7 PM COT
```

---

*Document: 064-postiz-openclaw-campaign-system.md*  
*Extends: 062 (3-layer architecture), 063 (discovery engine)*  
*Prerequisites: Postiz deployed, OpenClaw gateway running, Paperclip running*  
*Note: gitroomhq (postiz-app) also created paperclip — same creator, designed to work together*
