---
task_id: 062-openclaw-hermes-paperclip-sponsorship-system
title: Sponsorship System — OpenClaw + Hermes + Paperclip full lifecycle design
phase: PHASE-3-SPONSOR-AI
priority: P0
status: Design
estimated_effort: 8 weeks
area: system-design
tools:
  - openclaw
  - hermes-agent
  - paperclip
  - supabase
  - n8n
  - fire-enrich
---

# Production Sponsorship System: OpenClaw + Hermes + Paperclip

**For:** mdeai.co — Medellín, Colombia event platform  
**Goal:** Full lifecycle — discover → qualify → onboard → contract → activate → track → optimize → renew  
**Date:** 2026-05-04

---

## A. SYSTEM ARCHITECTURE (3-Layer)

```
┌──────────────────────────────────────────────────────────────────┐
│  LAYER 1: OPENCLAW — Channels / Execution / Mouth                │
│                                                                  │
│  WhatsApp (primary Colombia)  ─┐                                 │
│  Instagram DM                 ─┤→ openclaw gateway (localhost)   │
│  Telegram                     ─┤      ↕ pairing protocol        │
│  Email (via SMTP plugin)      ─┤→ openclaw skills + crons       │
│  Web scraping (browser tool)  ─┘      ↕ Firecrawl               │
└──────────────────┬───────────────────────────────────────────────┘
                   │ events + messages + scraped data
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│  LAYER 2: HERMES — Reasoning / Brain / Intelligence              │
│                                                                  │
│  hermes-agent (Python, ~/.hermes)                                │
│  ├── Sponsor scoring agent                                       │
│  ├── Proposal generation agent                                   │
│  ├── ROI explanation agent                                       │
│  ├── Creative optimization agent                                 │
│  └── Renewal prediction agent                                    │
│                                                                  │
│  Model: claude-sonnet-4.6 (via OpenRouter or direct Anthropic)  │
│  Tools: browser, file, web-fetch, code_execution, delegation     │
└──────────────────┬───────────────────────────────────────────────┘
                   │ decisions + tasks + structured outputs
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│  LAYER 3: PAPERCLIP — Governance / Control Plane / CEO           │
│                                                                  │
│  paperclipai (localhost:3102)                                    │
│  ├── Issue tracker (lifecycle states as issues)                  │
│  ├── Approval gates (contract, payment, activation)              │
│  ├── Budget enforcement per sponsor                              │
│  ├── Heartbeat routines (daily enrichment, weekly ROI report)    │
│  └── Audit log (Colombia Ley 527 compliance)                     │
└──────────────────┬───────────────────────────────────────────────┘
                   │ SQL + Edge Functions + Storage
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│  DATA LAYER: SUPABASE                                            │
│                                                                  │
│  sponsor schema (14 tables, existing)                            │
│  sponsor_discovery schema (4 tables, task 060)                   │
│  storage: contracts (private), sponsor-assets (private)          │
│  Edge Functions: 8 deployed, 5 planned (task 054)                │
└──────────────────────────────────────────────────────────────────┘
```

### Layer responsibilities

| Layer | Does | Does NOT |
|---|---|---|
| **OpenClaw** | Send/receive messages across all channels. Trigger crons. Run browser scraping. Execute outreach sequences. | Make decisions. Store data. Approve anything. |
| **Hermes** | Classify leads. Score sponsors. Generate proposals/messages/reports. Analyze ROI. Forecast renewal likelihood. | Send messages directly. Approve contracts. Write to DB (uses edge fns). |
| **Paperclip** | Track every sponsor as a Paperclip issue. Enforce approval gates. Control budget spend. Log all agent actions. | Reason. Generate content. Scrape. |

---

## B. END-TO-END LIFECYCLE (Step-by-Step)

### Phase 0: Discovery (Day 0–2)

```
TRIGGER: Paperclip heartbeat fires daily at 06:00 COT

1. Paperclip creates issue: "Discovery run — {date}"
   → assigns to Hermes CEO agent

2. Hermes receives issue → delegates to Discovery sub-agent:
   - Reads sponsor_discovery.prospects (Colombia brands)
   - Calls OpenClaw browser tool → scrapes:
     a. Instagram: searches #Medellín #PatrocinadorColombia
     b. LinkedIn: searches "Sponsor" + "Medellín" + "evento"
     c. Cámara de Comercio MDE directory (public)
     d. Ruta N company index
   - Calls Firecrawl → enriches each brand website

3. Hermes scores each prospect:
   score = audience_match×0.30 + industry_fit×0.25 + local_presence×0.15
         + sponsorship_history×0.20 + budget_fit×0.10

4. Hermes writes structured output:
   [{ name, score, reason, recommended_tier, suggested_activation }]

5. Paperclip records run → creates child issue per prospect ≥70 score:
   "Qualify: Postobón S.A. (score 84)"

6. Supabase: Hermes calls edge fn sponsor-enrich → upserts
   sponsor_discovery.prospects row
```

### Phase 1: Qualification (Day 2–5)

```
TRIGGER: Child issue "Qualify: {brand}" assigned to Hermes

1. Hermes Qualification agent:
   - Fetches brand's last 90 days IG posts (OpenClaw browser)
   - Detects sponsorship signals: "#Patrocinador", event tags, co-branding
   - Reads mdeai event calendar (Supabase events table)
   - Scores audience overlap against event attendee demographics
   - Generates qualification report (400 words, Spanish)

2. Paperclip GATE: "Human approval required"
   → Admin reviews in Paperclip UI
   → Approve → advances to "Outreach"
   → Reject → closes issue, sets prospect.status='disqualified'

3. Budget check: Paperclip verifies available outreach budget
   (max 5 new outreach sequences/week by default)
```

### Phase 2: Outreach (Day 5–14)

```
TRIGGER: Issue advances to "Outreach" state

1. Hermes generates personalized message (Spanish):
   - Context: brand industry, past event type, Medellín presence
   - Tone: professional but warm (Colombian business culture)
   - CTA: "¿Le interesa una sesión de 20 minutos esta semana?"

2. OpenClaw selects channel by priority:
   a. WhatsApp Business (if number found) — 85% open rate Colombia
   b. Instagram DM (if <10k followers, DMs likely open)
   c. LinkedIn InMail (decision maker identified)
   d. Email (fallback)

3. OpenClaw sends message → logs delivery to Paperclip issue comment

4. Hermes schedules follow-up sequence via OpenClaw cron:
   Day 0:  Initial WhatsApp
   Day 3:  Follow-up WhatsApp ("Solo verificando...")
   Day 5:  Instagram DM (different channel)
   Day 8:  Email with PDF deck attachment
   Day 14: Final "cerrando el loop" message
   Day 22: → sponsor_discovery.outreach_messages status='dormant'

5. RESPONSE DETECTED:
   OpenClaw receives reply → triggers webhook → Paperclip issue update
   → Hermes responds in real-time (24/7 coverage)
   → Classifies intent: INTERESTED / NOT_NOW / NOT_INTERESTED
   → Advances issue state accordingly
```

### Phase 3: Onboarding (Day 14–21)

```
TRIGGER: Prospect status = INTERESTED → link sent to /sponsor/apply

1. Self-serve wizard (4 steps, already built task 046):
   Step 1: Organization details
   Step 2: Campaign goals + target audience
   Step 3: Budget selection (tiers)
   Step 4: Activation preferences

2. During wizard → Hermes AI assist (via ai-chat edge fn):
   - Suggests activations based on budget + event type
   - Recommends tier upgrades with ROI projection
   - Generates draft campaign goal statement

3. Paperclip GATE: Application submitted
   → Creates issue: "Review application: {brand}"
   → Admin reviews in admin queue (/admin/sponsorships, task 047)
   → Approve → advance to Contract
   → Request changes → Hermes generates revision prompt for sponsor

4. Supabase: sponsor.applications row created
   status: pending_review → approved
```

### Phase 4: Contract + Payment (Day 21–28)

```
TRIGGER: Application approved → Paperclip auto-triggers contract generation

1. Hermes contract agent (via sponsor-contract-generate edge fn):
   - Generates bilingual HTML contract (Spanish/English)
   - Injects: brand name, event, tier, placement details, COP pricing
   - Uploads to Supabase Storage (contracts/ bucket, private)
   - Creates sponsor.contracts row (status: sent_for_signature)

2. OpenClaw sends WhatsApp: "Su contrato está listo para firmar"
   + direct link to /sponsor/contract/:contractId

3. Sponsor signs (task 057):
   - Views contract in iframe
   - Checks "Acepto los términos"
   - Types full legal name → SHA-256 IP hash stored
   - Contract status → 'signed' (Colombia Ley 527/1999 compliant)

4. Stripe checkout (task 048):
   - Invoice generated automatically
   - WhatsApp + email link sent
   - Payment confirmed → webhook → placements.active = true

5. Paperclip GATE: Payment confirmed
   → Advances issue to "Active" state
   → Budget deducted from sponsor allocation
   → Audit log entry: {contract_id, signed_at, ip_hash, amount}
```

### Phase 5: Activation (Day 28+)

```
TRIGGER: placements.active = true + start_at <= now()

1. Supabase triggers (task 051):
   - Impression logging starts (SponsoredSurface component, task 049)
   - Click tracking active

2. OpenClaw sends "Go-live" WhatsApp to sponsor:
   "¡Sus patrocinios están en vivo! Vea su dashboard: {link}"

3. Hermes Activation monitor (daily heartbeat):
   - Reads roi_daily (task 053 cron, every 5 min)
   - Compares CTR against tier benchmarks
   - If CTR < threshold: generates optimization recommendation
   - Posts recommendation to Paperclip issue comment

4. Paperclip GATE: If optimization requires placement change:
   → Creates sub-issue: "Activation adjustment: {brand}"
   → Admin approves → Hermes applies change
```

### Phase 6: ROI Tracking + Optimization (Ongoing)

```
TRIGGERS: 
  - Every 5 min: roi_daily cron (task 053)
  - Every day: Hermes daily insight generation (task 054)
  - Every week: Paperclip weekly report routine

1. Daily:
   Hermes reads roi_daily for each active application
   → Generates insight text (Spanish):
     "CTR pico: martes 19:00–21:00. Recomienda aumentar peso
      en contest_header durante esa ventana."
   → Writes to applications.campaign_goals.ai_insight

2. Weekly:
   Paperclip triggers "Weekly ROI report" routine
   → Hermes generates full report (PDF-ready HTML)
   → OpenClaw sends WhatsApp + email to sponsor
   → Includes: impressions, CTR, attributed purchases, CPA, vs. benchmark

3. Real-time:
   SponsorDashboard (task 052) receives Supabase Realtime push
   → Tiles update within 3 seconds of new roi_daily INSERT

4. Anomaly detection:
   Hermes detects CTR drop >20% in 24h
   → Creates Paperclip issue: "Alert: CTR drop — {brand}"
   → OpenClaw sends WhatsApp alert to account manager
```

### Phase 7: Renewal (30 days before end_at)

```
TRIGGER: Paperclip routine — "Check renewals" (fires daily)
         Query: placements WHERE end_at <= now() + 30 days

1. Hermes Renewal agent:
   - Calculates total ROI: impressions, CTR, attributed revenue
   - Compares against tier pricing + market benchmark
   - Generates renewal recommendation (upgrade / same / downgrade)
   - Scores renewal likelihood: 0–100

2. OpenClaw sends personalized renewal message (30 days before):
   "Hola {name}, su patrocinio termina en 30 días. Sus resultados:
    412k impresiones, 4.4% CTR (benchmark: 2.1%). Renovar ahora
    con 10% descuento por cliente frecuente."

3. Hermes generates renewal proposal:
   - 3 options (same tier / upgrade / downgrade)
   - Each with projected ROI based on historical data
   - One-click accept link → pre-fills /sponsor/apply

4. Paperclip tracks renewal outcome:
   - Renewed → new placements, new contract cycle
   - Not renewed → exit survey (OpenClaw WhatsApp)
   - No response → Hermes tries alternative contacts (LinkedIn, email)
```

---

## C. AI AGENT ROLES

### Agents deployed in Paperclip + Hermes

| Agent | Layer | Role | Trigger |
|---|---|---|---|
| **CEO** | Paperclip/Hermes | Orchestrates all sponsor work; assigns issues to sub-agents | Paperclip heartbeat (every 6h) |
| **Discovery** | Hermes | Scrapes + enriches prospects; writes to sponsor_discovery | Daily 06:00 COT |
| **Qualifier** | Hermes | Scores prospects; generates qualification reports | On new prospect issue |
| **Outreach** | Hermes + OpenClaw | Generates messages; orchestrates multi-channel sequences | On qualification approved |
| **Proposal** | Hermes | Generates sponsor proposals (PDF-ready HTML) | On sponsor request |
| **ROI-Explainer** | Hermes | Generates weekly insight text from roi_daily | Daily + on-demand |
| **Campaign-Monitor** | Hermes | Detects anomalies; triggers alerts | Every 30 min (cron) |
| **Renewal** | Hermes + OpenClaw | Scores renewal likelihood; sends renewal messages | 30/14/7 days before end_at |
| **Creative-Gen** | Hermes | Generates AI creatives (logo variations, banner copy) | On asset request |
| **Moderator** | Hermes | Moderates uploaded assets (safe content check) | On asset upload |

### Hermes agent config (example: Qualifier agent)

```yaml
# ~/.hermes/agents/sponsor-qualifier.yaml
name: sponsor-qualifier
model: anthropic/claude-sonnet-4.6
maxIterations: 20
timeoutSec: 120
tools:
  - web-fetch
  - file
  - code_execution
systemPrompt: |
  You are a B2B sponsorship qualifier for mdeai, a Colombian event platform.
  
  Given a brand profile, score it 0-100 using this formula:
  score = (audience_match * 0.30) + (industry_fit * 0.25) + 
          (local_presence * 0.15) + (sponsorship_history * 0.20) + 
          (budget_fit * 0.10)
  
  Output ONLY valid JSON:
  {
    "score": number,
    "breakdown": { audience_match, industry_fit, local_presence, 
                   sponsorship_history, budget_fit },
    "recommendation": "qualify|defer|disqualify",
    "reasoning": "string (max 200 words, Spanish)"
  }
  
  Colombian context:
  - Medellín is the #2 business hub in Colombia
  - Beauty pageants (reinas), fashion shows, food festivals dominate
  - Local presence = physical office or distribution in Antioquia
  - Budget signals: team size >20, recent IG ad spend, event logos on website
```

---

## D. TOOLING COMPARISON

### OpenClaw vs alternatives

| Tool | Primary use | Price | Colombia/WhatsApp | Self-host | Best for |
|---|---|---|---|---|---|
| **OpenClaw** | Multi-channel AI gateway (WhatsApp, Telegram, IG, email) | Free (OSS) + VPS $10–20/mo | ✅ Native WhatsApp pairing | ✅ Full | Channel automation + AI agent gateway |
| **Clay** | B2B lead enrichment (150+ sources) | $720/mo base (~$12–15k/yr with tooling) | ❌ Weak LATAM data | ❌ No | US/EU enterprise enrichment |
| **Apollo.io** | Prospect discovery + email | $49–149/user/mo; 5k email credits/mo | ❌ LATAM coverage poor; high bounce rates | ❌ No | Email-heavy outreach (US market) |
| **Instantly.ai** | Cold email sequences | $37–358/mo; max 30 sends/inbox/day | ❌ Email only | ❌ No | High-volume cold email |
| **Lemlist** | Cold email + LinkedIn | $63–87/user/mo; 8.5% avg reply rate | ❌ No WhatsApp | ❌ No | Multi-step email + LinkedIn (image personalization) |
| **PhantomBuster** | Social scraping | $69–439/mo (credits expire monthly) | ⚠️ Instagram/LinkedIn scraping (fragile, TOS risk) | ❌ No | Social media scraping |
| **Firecrawl** | Web scraping API | $83–99/mo (100k credits); OSS free | ✅ Agnostic | ✅ Full | Website enrichment (mdeai stack already uses) |
| **Fire Enrich** | Open-source Clay | $0 + $0.01–0.05/enrichment via APIs | ✅ Build LATAM sources | ✅ Full | Self-hosted enrichment pipeline |
| **n8n** | Workflow orchestration | $0 (self-host) | ✅ WhatsApp node (400+ integrations) | ✅ Full | Connecting systems without code |

### Recommended stack for mde

```
DISCOVERY:       Fire Enrich (self-hosted) + Firecrawl + OpenClaw browser
ENRICHMENT:      Fire Enrich → Gemini API ($0.01/brand) → Supabase
OUTREACH:        OpenClaw (WhatsApp primary) + Gmail SMTP (email fallback)
AUTOMATION:      OpenClaw crons + n8n (for complex multi-system workflows)
REASONING:       Hermes (claude-sonnet-4.6 via OpenRouter)
GOVERNANCE:      Paperclip (local, localhost:3102)
DATA:            Supabase (existing)
```

**Total monthly cost:** ~$50–80 (VPS for OpenClaw + Firecrawl API + Gemini API)  
vs. Clay + Instantly + PhantomBuster: $350–900/mo for weaker LATAM coverage

---

## E. DB SCHEMA + APIS

### New tables (extends existing sponsor schema)

```sql
-- Paperclip issue ↔ sponsor application bridge
CREATE TABLE sponsor.paperclip_issues (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES sponsor.applications(id) ON DELETE CASCADE,
  paperclip_issue_id text NOT NULL,       -- Paperclip internal issue ID
  paperclip_company_id text NOT NULL,
  lifecycle_phase text NOT NULL CHECK (lifecycle_phase IN (
    'discovery', 'qualification', 'outreach', 'onboarding',
    'contract', 'payment', 'active', 'optimization', 'renewal', 'closed'
  )),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (application_id, lifecycle_phase)
);

-- Hermes agent run log (extends ai_runs for sponsor context)
CREATE TABLE sponsor.agent_runs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name     text NOT NULL,              -- 'qualifier', 'outreach', 'roi-explainer'
  application_id uuid REFERENCES sponsor.applications(id),
  prospect_id    uuid REFERENCES sponsor_discovery.prospects(id),
  paperclip_run_id text,                    -- PAPERCLIP_RUN_ID from env
  model          text NOT NULL,
  input_tokens   integer,
  output_tokens  integer,
  duration_ms    integer,
  status         text NOT NULL CHECK (status IN ('success', 'error', 'timeout')),
  output_summary text,                       -- First 500 chars of output
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- OpenClaw message log
CREATE TABLE sponsor.openclaw_messages (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id    uuid REFERENCES sponsor_discovery.prospects(id),
  application_id uuid REFERENCES sponsor.applications(id),
  channel        text NOT NULL CHECK (channel IN ('whatsapp', 'instagram', 'telegram', 'email')),
  direction      text NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  message_text   text,
  openclaw_message_id text,                 -- OpenClaw internal message reference
  delivery_status text,                     -- 'sent', 'delivered', 'read', 'failed'
  sent_at        timestamptz NOT NULL DEFAULT now(),
  read_at        timestamptz
);

-- Renewal tracking
CREATE TABLE sponsor.renewals (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id       uuid REFERENCES sponsor.applications(id) ON DELETE CASCADE,
  renewal_score        integer NOT NULL CHECK (renewal_score BETWEEN 0 AND 100),
  recommendation       text NOT NULL CHECK (recommendation IN ('upgrade', 'same', 'downgrade', 'risk')),
  total_impressions    bigint NOT NULL DEFAULT 0,
  total_clicks         bigint NOT NULL DEFAULT 0,
  attributed_revenue   bigint NOT NULL DEFAULT 0,  -- COP cents
  hermes_reasoning     text,
  outreach_sent_at     timestamptz,
  outcome              text CHECK (outcome IN ('renewed', 'churned', 'no_response')),
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- Paperclip approval gates
CREATE TABLE sponsor.approval_gates (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES sponsor.applications(id) ON DELETE CASCADE,
  gate_type      text NOT NULL CHECK (gate_type IN (
    'qualification', 'contract_review', 'asset_moderation',
    'activation_plan', 'renewal_proposal'
  )),
  status         text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected', 'revision_requested'
  )),
  paperclip_issue_id text,
  reviewer_user_id uuid REFERENCES public.profiles(id),
  reviewed_at    timestamptz,
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now()
);
```

### New edge functions

| Function | Method | Auth | Purpose |
|---|---|---|---|
| `sponsor-enrich` | POST | service_role | Writes Fire Enrich output to sponsor_discovery.prospects |
| `sponsor-score` | POST | service_role | Calls Hermes qualifier agent → writes score |
| `sponsor-outreach-send` | POST | service_role | Calls OpenClaw API → sends message → logs to openclaw_messages |
| `sponsor-renewal-check` | POST | service_role | Reads placements ending in 30d → calls Hermes renewal agent |
| `sponsor-gate-review` | PATCH | JWT (admin) | Updates approval_gates row + triggers next phase |

### OpenClaw webhook endpoint

```typescript
// supabase/functions/openclaw-inbound/index.ts
// OpenClaw calls this when a reply arrives on any channel

Deno.serve(async (req) => {
  // OpenClaw sends: { messageId, channel, from, text, timestamp }
  const { messageId, channel, from, text } = await req.json();
  
  // Match to prospect or application by phone/handle
  const { data: prospect } = await supabase
    .from('sponsor_discovery.prospects')
    .select('id, name')
    .eq('whatsapp_number', from)
    .single();
  
  // Log inbound message
  await supabase.from('sponsor.openclaw_messages').insert({
    prospect_id: prospect?.id,
    channel,
    direction: 'inbound',
    message_text: text,
    openclaw_message_id: messageId,
  });
  
  // Call Hermes outreach agent to generate reply
  // Hermes reads conversation history + generates contextual response
  const hermesResponse = await fetch(`${HERMES_API}/agent/outreach/run`, {
    method: 'POST',
    body: JSON.stringify({ prospectId: prospect?.id, inboundText: text, channel }),
    headers: { Authorization: `Bearer ${HERMES_API_KEY}` }
  });
  
  // OpenClaw sends the reply (via Hermes tool call)
  return new Response(JSON.stringify({ success: true }));
});
```

---

## F. AUTOMATION WORKFLOWS

### Workflow 1: Daily Discovery (06:00 COT)

```
Paperclip heartbeat (cron: 0 11 * * * UTC = 06:00 COT)
    → creates issue "Discovery: {date}"
    → Hermes Discovery agent picks up

Hermes:
    for each Colombia industry segment (beauty, food, fashion, fintech, real estate):
        OpenClaw browser.search("instagram.com/explore #Medellín#Patrocinador")
        → extract 10–20 brand handles
        
        Firecrawl.scrape(brand_website) → extract:
            - employee count signal (LinkedIn embed)
            - "Patrocinadores" or "Partners" page
            - Contact email/phone
        
        Fire Enrich → enrich with:
            - Cámara de Comercio data
            - LinkedIn company size
            - Instagram follower count + engagement rate
    
    Score each → upsert sponsor_discovery.prospects
    Create child Paperclip issues for score ≥ 70
```

### Workflow 2: Outreach Sequence (OpenClaw crons)

```yaml
# OpenClaw cron config (via openclaw cli cron)
- name: sponsor-outreach-day0
  schedule: "immediate"
  trigger: paperclip_issue_state_change == "outreach"
  action: openclaw.message.send(prospect.whatsapp, message_day0)

- name: sponsor-outreach-day3
  schedule: "+3d"
  trigger: prospect.last_reply == null
  action: openclaw.message.send(prospect.whatsapp, message_day3)

- name: sponsor-outreach-day5
  schedule: "+5d"
  trigger: prospect.last_reply == null
  action: openclaw.message.send(prospect.instagram_handle, message_day5)

- name: sponsor-outreach-day8
  schedule: "+8d"
  trigger: prospect.last_reply == null
  action: openclaw.email.send(prospect.email, deck_attachment)

- name: sponsor-outreach-day22
  schedule: "+22d"
  trigger: prospect.last_reply == null
  action:
    - supabase.update(prospect, { status: 'dormant' })
    - paperclip.issue.close(issue_id, reason: "no_response_22d")
```

### Workflow 3: Weekly ROI Report (n8n)

```
n8n workflow: "Weekly Sponsor ROI Report"
Schedule: Monday 08:00 COT

1. n8n → Supabase: SELECT active applications
2. n8n → Hermes: generate report for each application
3. Hermes → reads roi_daily last 7 days + benchmark comparison
4. Hermes → generates HTML report (Spanish)
5. n8n → OpenClaw: send WhatsApp to sponsor (report summary + link)
6. n8n → Gmail: send full HTML report PDF
7. n8n → Paperclip: update issue comment with report generated timestamp
```

### Workflow 4: Asset Upload + Moderation

```
Sponsor uploads asset via DashboardAssets tab:

1. Frontend → Supabase Storage signed upload URL (edge fn: sponsor-asset-upload)
2. File lands in sponsor-assets/ bucket
3. Supabase Storage trigger (via pg_net webhook) → calls sponsor-moderate edge fn
4. Hermes Moderator agent:
   - Downloads asset via signed URL
   - Checks: explicit content, competitor branding, prohibited claims
   - Returns: { verdict: 'clean'|'flagged', flags: string[] }
5. If clean → sponsor.assets row updated: moderation_status='approved'
6. If flagged → sponsor.assets updated: moderation_status='rejected', flags=[...]
7. OpenClaw sends WhatsApp to sponsor:
   Clean: "Su creatividad fue aprobada. Estará en vivo en 30 minutos."
   Flagged: "Encontramos un problema con su archivo: {flags}. Por favor envíe una versión revisada."
8. Paperclip gates approval_gates row: status='approved'|'rejected'
```

---

## G. COMMUNICATION + MARKETING STRATEGY

### Channel priority for Colombia B2B

```
Priority 1: WhatsApp Business API
  - 85% message open rate (Colombia)
  - 92% smartphone penetration Medellín
  - Primary business communication channel
  - OpenClaw: native WhatsApp pairing + task-specific flows
  - Templates: pre-approved via Infobip (2–5 day approval)
  
Priority 2: Instagram DM
  - Brands with <10k followers have open DMs
  - Visual platform — attach mockups of their logo in event context
  - OpenClaw browser tool handles Instagram DM sending
  
Priority 3: Email (professional + formal)
  - For PDF contracts, formal proposals
  - Higher perceived legitimacy for contracts
  - OpenClaw email plugin (SMTP via Gmail or Postmark)

Priority 4: LinkedIn (decision makers)
  - CEOs and Marketing Directors reachable
  - InMail for companies with closed DMs everywhere else
```

### Message templates (Spanish, localized)

```
DAY 0 — Initial WhatsApp:
"Hola {first_name} 👋 Soy del equipo de mdeai.co

Vi que {brand} ha estado activo en el ecosistema de eventos en Medellín. 
Trabajamos con las marcas más importantes de Antioquia para conectarlas 
con +50,000 asistentes a eventos de moda, gastronomía y cultura.

¿Le interesa una sesión de 20 minutos esta semana para ver cómo podemos 
generar visibilidad para {brand}?

// Hermes inserts: event name + sample attendee demographic"

DAY 3 — Follow-up:
"Hola {first_name}, solo verificando si recibió mi mensaje anterior sobre 
patrocinios en {event_name}. 

Nuestro siguiente evento es el {date} — quedan {N} paquetes disponibles.

¿Tiene 5 minutos esta semana?"

RENEWAL (30 days before):
"Hola {first_name} 🎉 

Su patrocinio con mdeai termina en 30 días y los resultados han sido 
impresionantes:

📊 {impressions} impresiones
👆 {ctr}% CTR (benchmark del sector: 2.1%)  
💰 {attributed_revenue} en ventas atribuidas

Queremos ofrecerle renovación anticipada con un 10% de descuento.
¿Le enviamos las opciones?"
```

### Content marketing (Hermes-generated)

```
Monthly: "Informe de Patrocinios en Eventos de Medellín"
  - Generated by Hermes from aggregated (anonymized) roi_daily
  - Published on mdeai.co/blog
  - Distributed via OpenClaw to all prospect list

Weekly: LinkedIn post from mde company page
  - "Caso de éxito: {brand} logró {N}% CTR en {event}"
  - Generated by Hermes, approved by Paperclip gate, posted by OpenClaw

Event-specific: "Presentación de patrocinadores" content
  - Post-event recap with sponsor logo + metric highlight
  - Instagram Reel / TikTok (AI highlight reel via Mootion API)
```

---

## H. 20+ FEATURES (Core + Advanced + Innovative)

### Core (already built or in sprint)

| # | Feature | Status | Task |
|---|---|---|---|
| 1 | Sponsor application wizard (4-step) | ✅ Done | 046 |
| 2 | Admin approval queue | ✅ Done | 047 |
| 3 | Stripe checkout + invoicing | ✅ Done | 048 |
| 4 | Sponsored surface component (impressions) | ✅ Done | 049 |
| 5 | Click tracking + impression edge fns | ✅ Done | 050 |
| 6 | Revenue attribution trigger | ✅ Done | 051 |
| 7 | Real-time ROI dashboard | 🔵 Next | 052 |
| 8 | ROI daily rollup cron | ✅ Done | 053 |
| 9 | AI edge fns (moderate/explain/optimize) | 📋 Design | 054 |
| 10 | Contract generation + storage | ✅ Done | 056 |
| 11 | Contract sign page (Colombia Ley 527) | ✅ Done | 057 |
| 12 | Dispute UI + cancel flow | ✅ Done | 058 |

### Advanced (Phase 3: Weeks 5–8)

| # | Feature | Description | Time-to-ship |
|---|---|---|---|
| 13 | **Dynamic pricing** | Slot price = base × demand_multiplier. Demand = (filled_slots/total_slots). If >80% filled → price × 1.5. If <30% filled → 0.8 discount. SQL trigger. | 3 days |
| 14 | **Performance-based CPA tier** | Bronze tier: pay flat rate. Silver: flat + 3% of attributed_revenue. Gold: performance-only (5% CPA, monthly Stripe invoice). Auto-invoice via cron. | 1 week |
| 15 | **Sponsor self-serve creative replacement** | Mid-campaign logo/banner upload → Hermes moderates in <2 min → live. | 4 days |
| 16 | **AI-generated proposals** | Hermes generates a 3-page sponsor proposal PDF for each prospect. Includes: event demographics, placement mockups, projected ROI in COP. | 5 days |
| 17 | **Competitive intelligence** | Hermes monitors competitors' sponsor pages (Cabildo Events, Medellín Moda). Flags when a target brand sponsors a competitor → triggers priority outreach. | 1 week |
| 18 | **Renewal scoring** | Hermes predicts P(renewal) from: total ROI, account health, engagement trend, time-in-market. Score ≥75 → automated renewal offer. Score <40 → human escalation. | 5 days |
| 19 | **Multi-event packages** | Sponsor can buy across events in one invoice. Hermes suggests bundles: "Patrocine Reina de Antioquia + Festival de la Moda = 15% off". | 1 week |
| 20 | **Co-sponsor matching** | Hermes identifies complementary brands (fashion brand + beauty brand) and proposes co-sponsorship. Reduces cost-per-brand, fills slots faster. | 1 week |

### Innovative (Phase 4: Weeks 9–12)

| # | Feature | Description | Implementation |
|---|---|---|---|
| 21 | **Real-time leaderboard pricing** | During live events, surface pricing updates every 5 min based on real-time engagement. More engagement → higher rate card for next slot. OpenClaw WhatsApp alert: "Su placement está generando 40% más CTR que el promedio — ¿ampliar exposición ahora?" | Supabase Realtime + OpenClaw webhook |
| 22 | **AI creative A/B testing** | Hermes generates 3 creative variants per placement. ROI cron tracks per-creative CTR. Auto-promotes winner at 80% statistical confidence. Sponsor sees results in dashboard. | roi_daily GROUP BY asset_id + Hermes analysis |
| 23 | **Sponsor discovery network** | "Referred by" tracking: existing sponsor refers new brand → 5% referral credit on next invoice. OpenClaw sends thank-you gift code automatically. | sponsor.referrals table + Paperclip workflow |
| 24 | **AI-generated highlight reels** | Post-event: Hermes calls Mootion API with event footage → generates 90-second branded reel with sponsor logo. Sponsor gets WhatsApp: "Su marca en el evento — ver video". Viral loop content. | Mootion API + OpenClaw media send |
| 25 | **Predictive audience matching** | Before event, Hermes analyzes ticket buyer data (anonymized) → predicts attendee demographics → generates "Your audience will be 68% female, 25–34, Medellín, interested in fashion." Sponsors see this before booking. | pgvector cosine similarity on profile embeddings |
| 26 | **Sponsor marketplace** | Brands browse upcoming events self-serve. Filter: industry, audience size, price, event type. Real-time slot availability. Instant checkout. No sales call required. | New route: /marketplace + existing Stripe flow |
| 27 | **Budget tracker with burn rate** | Paperclip enforces monthly sponsor budget ceiling. Dashboard shows burn rate: "Llevas 68% de tu presupuesto mensual en 15 días." Alerts at 80% and 100%. | approval_gates.budget_remaining + Paperclip budget enforcement |

---

## I. OPENCLAW USE CASES (Detailed)

### 1. Sponsor Discovery Automation

```bash
# OpenClaw skill: sponsor-discovery
# ClawHub: openclaw skills install sponsor-discovery

# Usage (from Hermes tool call):
openclaw browser.search({
  query: "patrocinador evento moda Medellín 2026",
  platform: "instagram",
  extract: ["handle", "follower_count", "bio_text", "contact_email"]
})

# Then Firecrawl enriches each brand's website:
openclaw firecrawl.scrape({
  url: "https://brandwebsite.com",
  extract: ["sponsorship_page", "contact_info", "team_size_signal", "event_logos"]
})
```

### 2. WhatsApp Outreach Campaign (task-specific flows)

```
OpenClaw WhatsApp flow: "sponsor-inquiry-v1"
(Pre-approved Infobip template: HSM category = MARKETING)

Entry point: User clicks link → scans QR → opens WhatsApp chat
OR: OpenClaw sends template message to phone number

Flow:
  BOT: "Hola {name} 👋 ¿Le interesa conocer los paquetes de patrocinio para {event}?"
  
  Option A: "Sí, quiero información"
    → BOT sends: event deck PDF (OpenClaw media.send)
    → BOT asks: "¿Cuál es su presupuesto mensual para marketing?"
    → Options: "<$5M COP" | "$5M–20M COP" | ">$20M COP"
    → Routes to appropriate tier + sends /sponsor/apply link
    
  Option B: "No por ahora"
    → BOT: "Entendido. ¿Cuándo sería mejor contactarle?"
    → Calendar picker → creates Paperclip reminder issue
    
  Option C: "¿Qué incluye?"
    → BOT: "Incluye: {placement_types}. Su logo en {N} pantallas del evento."
    → BOT: sends event venue photos (OpenClaw media.send)
    → continues to Option A flow

Completion: User submits application → flow ends (Jan 2026 policy compliant)
```

### 3. Real-Time Engagement Triggers

```
During live event:
  → SponsoredSurface generates spike in impressions
  → roi_daily cron detects >2x normal rate
  → Supabase Edge Fn calls OpenClaw webhook
  → OpenClaw sends WhatsApp to sponsor:
    "¡Sus impresiones están explotando ahora! 
    🔥 12,400 en los últimos 30 min (normal: 4,800)
    Ver dashboard: {link}"

Post-event (within 2h):
  → Paperclip routine fires "Post-event report"
  → Hermes generates summary
  → OpenClaw sends WhatsApp + email:
    "Resumen de {event} para {brand}:
    Total: {impressions} | CTR: {ctr}% | Atribuido: ${revenue} COP
    Informe completo: {pdf_link}"
```

### 4. Event Promotion Automation

```
OpenClaw cron: "event-countdown" 
Fires: 14d, 7d, 3d, 1d before event

Recipients: 
  1. Sponsor contacts → "Su patrocinio entra en vigor en X días"
  2. Prospective sponsors → "¡Solo {N} paquetes disponibles!"
  3. Existing customers → "Este evento lo patrocinan {brand1}, {brand2}..." (social proof)

Content generated by: Hermes + event data from Supabase
Channel mix: WhatsApp (primary) + Instagram DM (secondary) + Email (tertiary)
```

---

## J. HERMES USE CASES (Detailed)

### 1. Sponsor Scoring + Ranking

```python
# Hermes runs this as code_execution tool:
def score_sponsor(prospect: dict, event: dict) -> dict:
    # Industry fit matrix (Medellín-specific)
    INDUSTRY_MATRIX = {
        "beauty": {"reina_de_antioquia": 1.0, "moda": 0.9, "lifestyle": 0.7},
        "food_beverage": {"food_festival": 1.0, "lifestyle": 0.8, "sports": 0.6},
        "fintech": {"networking": 0.9, "startup": 1.0, "lifestyle": 0.5},
        "fashion": {"moda": 1.0, "reina_de_antioquia": 0.9, "lifestyle": 0.8},
    }
    
    industry_fit = INDUSTRY_MATRIX.get(
        prospect["industry"], {}
    ).get(event["category"], 0.3)
    
    # Local presence: Antioquia headquarters = 1.0, Colombia = 0.7, foreign = 0.3
    local_presence = (
        1.0 if prospect.get("hq_city") == "Medellín"
        else 0.7 if prospect.get("hq_country") == "Colombia"
        else 0.3
    )
    
    # Audience match: compare prospect's IG audience demographics 
    # vs event attendee profile (from past events)
    audience_match = compute_demographic_overlap(
        prospect["ig_audience_age_female_25_34"],
        event["expected_audience_age_female_25_34"]
    )
    
    score = (
        audience_match * 0.30 +
        industry_fit * 0.25 +
        local_presence * 0.15 +
        prospect.get("sponsorship_history_score", 0.5) * 0.20 +
        prospect.get("budget_fit_score", 0.5) * 0.10
    )
    
    return {"score": round(score * 100), "breakdown": {...}}
```

### 2. ROI Explanation (Spanish, Actionable)

```
Input: roi_daily rows for application_id, last 30 days

Hermes prompt:
"Analiza estos datos de ROI para el patrocinador {brand} en el evento {event}.
Genera un insight de 3 párrafos en español para el dashboard del patrocinador.

ESTRUCTURA:
1. Resumen ejecutivo (qué pasó, en números concretos)
2. Insight accionable (cuándo/dónde fue mejor el rendimiento, por qué)  
3. Recomendación concreta (qué hacer diferente en el próximo ciclo)

Datos:
{roi_daily_json}

Benchmark del sector (Colombia eventos 2025):
- CTR promedio: 2.1%
- CPM promedio: $8,500 COP
- CPA promedio: $45,000 COP"

Output (example):
"**Semana 1:** Su marca generó 412,000 impresiones con un CTR del 4.4%, 
más del doble del benchmark del sector (2.1%). El costo por acción fue 
$21,000 COP vs. $45,000 en el mercado — un 53% más eficiente.

**Mejor momento:** El martes y miércoles entre 18:00 y 21:00 concentraron 
el 38% de todos los clics, coincidiendo con el horario de mayor tráfico del 
evento. La ubicación 'contest_header' tuvo el mejor rendimiento (6.1% CTR) 
vs 'sidebar' (1.8% CTR).

**Recomendación:** Para el próximo ciclo, asigne el 70% del presupuesto 
al 'contest_header' y priorice la franja martes–jueves 18:00–21:00. 
Proyección: +35% en atribuciones con el mismo presupuesto."
```

### 3. Renewal Prediction Model

```python
# Hermes code_execution: renewal scoring
def predict_renewal(application_id: str, roi_data: dict) -> dict:
    # Signals
    roi_vs_benchmark = roi_data["ctr"] / 2.1  # >1 = beating benchmark
    trend = roi_data["week4_ctr"] / roi_data["week1_ctr"]  # >1 = improving
    attributed_roi = roi_data["attributed_revenue"] / roi_data["invoice_amount"]
    response_time_hours = roi_data["avg_support_response_h"]  # <4h = high satisfaction
    
    # Renewal likelihood score
    score = (
        min(roi_vs_benchmark, 2.0) * 25 +   # max 50 pts
        min(trend, 1.5) * 20 +               # max 30 pts
        min(attributed_roi * 10, 15) +        # max 15 pts
        (15 if response_time_hours < 4 else 10 if < 24 else 5)  # max 15 pts
    )
    
    recommendation = (
        "upgrade" if score >= 80 and attributed_roi > 5 else
        "same" if score >= 60 else
        "downgrade" if score >= 40 else
        "risk"
    )
    
    return {
        "score": round(score),
        "recommendation": recommendation,
        "outreach_message": generate_renewal_message(recommendation, roi_data)
    }
```

---

## K. PAPERCLIP USE CASES (Detailed)

### 1. Workflow State Machine

```
Paperclip issue states for each sponsor:

[discovery] → [qualification_review] → [outreach]
    ↓ approved                 ↓ approved      ↓ responded
[onboarding] → [contract_sent] → [payment_pending] → [active]
    ↓                               ↓ paid                ↓ end_at approaching
[revision_requested]          [dispute]           [renewal_outreach]
                                   ↓                      ↓ accepted
                              [resolved]            [renewal_active]
                                                          ↓ rejected
                                                    [churned]
```

### 2. Approval Gates (non-negotiable checkpoints)

```
Gate 1: Qualification
  Trigger: Hermes scores prospect ≥70
  Approver: Account Manager (human)
  Deadline: 48h (Paperclip SLA enforcement)
  Reject: → closes issue, prospect marked 'disqualified'

Gate 2: Contract Review
  Trigger: Contract HTML generated
  Approver: Legal/Admin (human)
  Auto-approve: If template unchanged + amount ≤ $5M COP
  Manual review: If amount >$5M COP OR custom terms

Gate 3: Asset Moderation
  Trigger: Sponsor uploads new creative
  Approver: Hermes (automated) → human override if flagged
  Deadline: 30 min
  Blocked states: placements remain active with previous asset

Gate 4: Activation Plan
  Trigger: New activation type requested (not in standard tier)
  Approver: Operations Manager
  Examples: custom venue branding, experiential activation

Gate 5: Renewal Proposal
  Trigger: Renewal score <40 (risk) OR upgrade proposal >$20M COP
  Approver: CEO (human)
  Auto-approve: Score ≥60 + same/downgrade tier
```

### 3. Budget Control

```
Paperclip budget enforcement:

Per-agent budgets (monthly):
  CEO agent: $50 compute (Hermes runs)
  Discovery agent: $30 (scraping + enrichment)
  Outreach agent: $40 (Hermes messages + OpenClaw sends)
  ROI-Explainer: $20 (daily insights)
  Total: ~$140/mo in AI compute

Per-sponsor outreach budget:
  Max 5 new outreach sequences/week
  Max $2,000 COP in Infobip WhatsApp template costs/sponsor
  Stop outreach if no response after Day 22

Platform revenue goal:
  Paperclip tracks: applications × avg invoice amount
  Alert if monthly target <80%: creates issue for CEO "Revenue at risk"
  Alert if ≥100%: creates issue "Capacity check — can we serve more?"
```

### 4. Audit Log (Colombia Ley 527 Compliance)

```sql
-- Every Paperclip run writes an agent_runs row
-- Every approval gate writes an approval_gates row
-- Contract signing: sha256(ip + daily_salt) stored

-- Full audit trail for any contract:
SELECT 
  sc.id,
  sc.sponsor_signed_at,
  sc.signed_ip_hash,
  sc.sponsor_display_name,
  ag_contract.reviewed_at AS admin_approved_at,
  ag_contract.reviewer_user_id,
  om.sent_at AS contract_link_sent_at,
  om.channel AS contract_sent_via,
  sar.created_at AS hermes_generated_at,
  sar.model AS hermes_model
FROM sponsor.contracts sc
JOIN sponsor.approval_gates ag_contract 
  ON ag_contract.application_id = sc.application_id 
  AND ag_contract.gate_type = 'contract_review'
JOIN sponsor.openclaw_messages om 
  ON om.application_id = sc.application_id 
  AND om.direction = 'outbound'
  AND om.message_text LIKE '%contrato%'
JOIN sponsor.agent_runs sar 
  ON sar.application_id = sc.application_id 
  AND sar.agent_name = 'contract-generator'
WHERE sc.id = $1;
```

---

## L. IMPLEMENTATION PLAN (12 weeks)

### Week 1–2: Foundation

- [ ] OpenClaw gateway on VPS (Hetzner €6/mo, Docker)
- [ ] OpenClaw WhatsApp pairing (Infobip Business API)
- [ ] Paperclip issue states configured (lifecycle phases)
- [ ] Hermes CEO agent instructions updated + Paperclip project bound to `/home/sk/mde`
- [ ] `sponsor.paperclip_issues`, `sponsor.openclaw_messages`, `sponsor.agent_runs` tables migrated

### Week 3–4: Discovery + Qualification Pipeline

- [ ] Fire Enrich self-hosted (Docker) + Colombia data sources configured
- [ ] Hermes Discovery agent + Qualifier agent + scoring model
- [ ] OpenClaw browser tool → Instagram/LinkedIn scraping skill
- [ ] Paperclip qualification gate wired to admin UI
- [ ] Seed 50 Colombian brands into sponsor_discovery.prospects

### Week 5–6: Outreach Automation

- [ ] OpenClaw WhatsApp flows (3 templates pre-approved Infobip)
- [ ] Hermes Outreach agent → generates personalized messages (Spanish)
- [ ] Multi-channel sequence (Day 0→3→5→8→14→22) via OpenClaw crons
- [ ] Inbound reply handler (openclaw-inbound edge fn)
- [ ] Hermes real-time response (24/7 coverage)

### Week 7–8: ROI + Optimization Layer

- [ ] Task 052: SponsorDashboard (React frontend)
- [ ] Task 054: AI edge fns (sponsor-moderate, roi-explain, optimize)
- [ ] Hermes ROI-Explainer agent → daily Spanish insights
- [ ] Hermes Campaign-Monitor → anomaly detection (CTR drop alerts)
- [ ] n8n: Weekly ROI report workflow

### Week 9–10: Advanced Features

- [ ] Dynamic pricing (demand_multiplier SQL trigger)
- [ ] Performance-based CPA tier (Silver/Gold Stripe auto-invoice)
- [ ] Renewal prediction model (Hermes)
- [ ] OpenClaw renewal sequence (30/14/7 day crons)
- [ ] AI creative A/B testing (roi_daily GROUP BY asset_id)

### Week 11–12: Marketplace + Scale

- [ ] Sponsor marketplace (/marketplace route)
- [ ] Co-sponsor matching (Hermes + complementary brand scoring)
- [ ] AI highlight reels (Mootion API integration)
- [ ] Predictive audience matching (pgvector demographics)
- [ ] Budget tracker + Paperclip spend enforcement

---

## M. ENVIRONMENT SETUP

### Required secrets (Supabase dashboard)

```
OPENCLAW_GATEWAY_URL=https://your-vps.hetzner.com:3000
OPENCLAW_GATEWAY_TOKEN=<generated via openclaw cli auth>
HERMES_API_URL=http://localhost:8080  # or remote Hermes endpoint
HERMES_API_KEY=<from ~/.hermes/config.yaml auth>
PAPERCLIP_API_URL=http://127.0.0.1:3102
PAPERCLIP_API_KEY=<from Paperclip UI → Settings → API Keys>
PAPERCLIP_COMPANY_ID=<from Paperclip UI → Company Settings>
FIRE_ENRICH_URL=http://localhost:8081
FIRECRAWL_API_KEY=<from firecrawl.dev dashboard>
INFOBIP_API_KEY=<existing>
N8N_WEBHOOK_URL=https://your-n8n.hetzner.com/webhook/sponsor-roi
```

### OpenClaw deployment (Hetzner VPS)

```bash
# On fresh Hetzner Ubuntu 24.04 VPS ($6/mo, 2 vCPU, 4GB)
docker run -d \
  --name openclaw \
  -p 3000:3000 \
  -v openclaw-data:/data \
  -e OPENCLAW_GATEWAY_TOKEN=$TOKEN \
  -e INFOBIP_API_KEY=$INFOBIP_KEY \
  -e INFOBIP_BASE_URL=$INFOBIP_BASE \
  openclaw/openclaw:latest

# Pair WhatsApp (scan QR in Paperclip UI or openclaw TUI):
openclaw channels pair whatsapp

# Install sponsor skills:
openclaw skills install sponsor-discovery
openclaw skills install sponsor-outreach

# Register crons:
openclaw cron add "sponsor-discovery" "0 11 * * *" "hermes run discovery"
openclaw cron add "sponsor-renewal-check" "0 12 * * *" "hermes run renewal-check"
```

### Paperclip agents to create

```
1. CEO (Hermes adapter, claude-sonnet-4.6)
   - Instructions: delegate only, no curl
   - Routines: daily heartbeat at 06:30 COT

2. Discovery (Hermes adapter, claude-haiku-4.5 for speed)
   - Instructions: run discovery agent, output JSON only
   - Trigger: on issue "Discovery: {date}"

3. Qualifier (Hermes adapter, claude-sonnet-4.6)
   - Instructions: score + qualify, output JSON
   - Trigger: on issue "Qualify: {brand}"

4. Outreach (Hermes adapter, claude-sonnet-4.6)
   - Instructions: generate Spanish messages, call OpenClaw send
   - Trigger: on issue state → "outreach"

5. ROI-Explainer (Hermes adapter, claude-sonnet-4.6)
   - Instructions: generate Spanish insights, write to DB via edge fn
   - Trigger: daily routine 08:00 COT

6. Monitor (Hermes adapter, claude-haiku-4.5 for speed)
   - Instructions: check CTR anomalies, create alert issues
   - Trigger: every 30 min routine
```

---

## N. QUICK-START: First 5 Sponsors

Run this to seed the first Colombian targets (all verified Medellín ecosystem sponsors; Bancolombia, EPM, Corona, Comfama, Grupo Sura are the top 5 corporate sponsors in Antioquia by research):

```sql
INSERT INTO sponsor_discovery.prospects (name, industry, city, website, instagram_handle, score, status) VALUES
('Bancolombia',     'fintech',       'Medellín', 'bancolombia.com',    '@bancolombia',      89, 'pending'),
('EPM',             'utilities',     'Medellín', 'epm.com.co',         '@epm_energia',      77, 'pending'),
('Grupo Sura',      'fintech',       'Medellín', 'gruposura.com',      '@gruposura',        82, 'pending'),
('Comfama',         'wellness',      'Medellín', 'comfama.com',        '@comfama',          85, 'pending'),
('Corona',          'consumer_goods','Medellín', 'corona.com.co',      '@coronacolombia',   73, 'pending'),
('Leonisa',         'fashion',       'Medellín', 'leonisa.com',        '@leonisa',          88, 'pending'),
('Auteco',          'automotive',    'Medellín', 'auteco.com.co',      '@autoecolombia',    71, 'pending'),
('Postobón S.A.',   'food_beverage', 'Medellín', 'postobon.com',       '@postobon',         82, 'pending'),
('Grupo Nutresa',   'food_beverage', 'Medellín', 'gruponutresa.com',   '@gruponutresa',     76, 'pending'),
('Haceb',           'appliances',    'Medellín', 'haceb.com.co',       '@haceb_colombia',   71, 'pending');
```

Then in Paperclip UI: create one issue "Qualify: Leonisa (score 88)" and run the Qualifier agent. Validates the full pipeline in <30 min.

---

## O. SUCCESS METRICS

| Metric | Target (Month 1) | Target (Month 3) | Measurement |
|---|---|---|---|
| Prospects discovered/week | 50 | 200 | sponsor_discovery.prospects COUNT |
| Outreach response rate | 8% | 15% | openclaw_messages (inbound/outbound ratio) |
| Qualification-to-application rate | 20% | 35% | approval_gates qualified→onboarded |
| Contract-to-payment time | <7 days | <3 days | contracts.sent_at → invoices.paid_at |
| Average sponsor revenue | $8M COP | $15M COP | invoices.amount AVG |
| Renewal rate | — | 60% | renewals.outcome = 'renewed' / total |
| AI agent cost per signed sponsor | <$50,000 COP | <$20,000 COP | agent_runs total cost / signed contracts |

---

*Document created: 2026-05-04*  
*Implements: OpenClaw (channels) + Hermes (reasoning) + Paperclip (governance)*  
*Extends: tasks 045–061 in sponsor task index*
