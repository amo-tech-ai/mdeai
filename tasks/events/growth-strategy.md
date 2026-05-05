# Growth + Monetization Strategy — mdeai Events Platform

**Doc owner:** mdeai.co founders
**Version:** 1.0 — May 3, 2026
**Status:** Draft — pending founder review
**Depends on:** [`100-events-prd.md`](./100-events-prd.md), [`101-roadmap.md`](./101-roadmap.md), [`03-sponsorship-system.md`](./03-sponsorship-system.md), [`venue-playbook.md`](./venue-playbook.md), [`social/01-postiz-openclaw.md`](./social/01-postiz-openclaw.md)

---

## 1. Core Strategy — Platform Positioning

### The positioning bet

mdeai is not competing with Eventbrite. Eventbrite is a ticket marketplace — it doesn't care who wins, doesn't track whether sponsors saw ROI, doesn't know who Camila is after she leaves. mdeai is a **closed-loop event intelligence platform**: every touchpoint (ticket buy, vote cast, sponsor impression, QR scan at the door) feeds back into a single data model that makes the next event more profitable for organizers and more accountable for sponsors.

The three incumbents mdeai displaces in Medellín:

| Incumbent | Why they lose in Medellín | mdeai's wedge |
|---|---|---|
| **Eventbrite** | English-only UX; 2.5–5.9% fee per ticket; no voting, no sponsors, no AI | Spanish-Paisa chatbot creates events in 5 min; 5% flat fee same as Stripe minimum; voting + sponsors bundled |
| **Instagram** | Reach without data; no ticket sales; no sponsor attribution | mdeai channels IG for reach but captures the audience (email, phone) before the user bounces |
| **WhatsApp (manual)** | Infinite surface area; zero data; Daniela sending 80 messages/day manually | OpenClaw sends compliant broadcast templates; every message tracked; reply-to routes to AI concierge |

### The closed loop (non-negotiable)

```
EVENT CREATED
    → AI Generates Campaign (Postiz schedules IG + FB + TikTok + WA)
    → Audience Reaches Event Page
    → Ticket Purchased / Vote Cast  ← REVENUE
    → QR Issued + Email/WA Confirmation
    → Sponsor Impression Logged
    → QR Scanned at Door → Attendance Confirmed
    → Post-Event Content Auto-Generated (Postiz)
    → Sponsor ROI Computed (roi_daily rollup)
    → Referral Loop Activated (share link + ?ref= UTM)
    → Next Event Promoted to Same Audience
    → Sponsor Renews Based on Data
```

Every step that currently leaks audience to a third party is plugged. Camila's phone number doesn't go to Eventbrite — it stays in `profiles`. Postobón's impression data doesn't live in a Google Ads black box — it lives in `sponsor.roi_daily`.

### Differentiation that compounds

| Feature | Eventbrite | Instagram | mdeai |
|---|---|---|---|
| Spanish-Paisa AI chatbot | ❌ | ❌ | ✅ |
| Sponsor ROI dashboard (real-time CPS/CPL/CPA) | ❌ | ❌ | ✅ |
| Hybrid voting with fraud defense | ❌ | ❌ | ✅ |
| QR ticket + door scan + no-show tracking | Basic | ❌ | ✅ |
| Automated post-event social content | ❌ | ❌ | ✅ |
| Venue double-booking prevention | ❌ | ❌ | ✅ |
| Closed audience database (organizer owns it) | ❌ | ❌ | ✅ |

---

## 2. Unified System Architecture

### The 7-layer stack

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 7 — INTELLIGENCE                                         │
│  Gemini (Flash/Pro) powers: chatbot creation · AI campaign     │
│  · sponsor moderation · ROI explain · venue optimizer          │
└──────────────────────────────────┬──────────────────────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────────────┐
│  LAYER 6 — OUTREACH                                             │
│  Postiz API (scheduling: IG + FB + TikTok + YT + LinkedIn)     │
│  OpenClaw (WhatsApp broadcast + DM outreach — approval gate)   │
│  Infobip (SMS + transactional WA: ticket confirm, reminders)   │
└──────────────────────────────────┬──────────────────────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────────────┐
│  LAYER 5 — CAPTURE                                              │
│  Event pages · Ticket checkout (Stripe) · Voting UI            │
│  Sponsor apply wizard · Venue booking · Restaurant booking     │
└──────────────────────────────────┬──────────────────────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────────────┐
│  LAYER 4 — ACTIVATION                                           │
│  QR mint → door scan · Placement scheduler (pg_cron)           │
│  Attribution trigger (24h last-click on event_orders)          │
│  Referral link tracking (?ref= UTM → sponsor.attributions)    │
└──────────────────────────────────┬──────────────────────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────────────┐
│  LAYER 3 — DATA                                                 │
│  PostgreSQL: event.* · vote.* · sponsor.* · venue.* · mktg.*  │
│  pgvector (semantic search) · PostGIS (geospatial)             │
│  Realtime subscriptions (Supabase channels)                    │
└──────────────────────────────────┬──────────────────────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────────────┐
│  LAYER 2 — COMPUTE                                              │
│  Supabase Edge Functions (Deno) · pg_cron · Postgres triggers  │
│  Stripe webhooks · Postiz webhooks · OpenClaw job results      │
└──────────────────────────────────┬──────────────────────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────────────┐
│  LAYER 1 — DISTRIBUTION                                         │
│  mdeai.co (Vercel) · PWA (offline QR scanner)                  │
│  Postiz→IG/FB/TikTok/YT · WhatsApp · Email · SMS              │
└─────────────────────────────────────────────────────────────────┘
```

### Closed-loop data flows (5 critical paths)

**Path 1 — Ticket purchase → attribution**
`ticket-checkout` → Stripe → `ticket-payment-webhook` → `event_orders` INSERT → `sponsor.attribute_order()` trigger → `sponsor.attributions` → `roi_daily` rollup

**Path 2 — Vote cast → share → referral**
`vote-cast` → `event_votes` → share modal → `?ref=<placement_id>` link → `campaign-track-click` edge fn → `referral_links` + `sponsor.clicks` → next ticket/vote attributed to that placement

**Path 3 — Campaign → engagement → sponsor ROI**
Admin approves campaign → Postiz schedules posts → `postiz_schedule_posts` stores `provider_post_id` → `campaign-ingest-metrics` polls Postiz every 6h → `campaign_metrics` → sponsor sees "3,240 IG impressions from Postobón Gold campaign" in roi_daily

**Path 4 — Restaurant booking → AI concierge → upsell**
QR menu scan → AI concierge conversation → table booking → `event_attendees` row (type='restaurant') → post-meal Gemini generates personalized follow-up → `postiz` schedules "Camila loved Mi Sazón — join our next tasting event"

**Path 5 — Venue inquiry → booking → event creation**
Venue landing page → `/venues/:slug` → availability check → `event_venue_bookings` → auto-draft event in wizard → triggers campaign generation → sponsors see venue's event calendar

---

## 3. Event Growth System

### Pre-event (T-30 to T-0)

**Week -4: Campaign launch**
- Gemini (`campaign-generate-plan`) generates a 4-week content calendar: 8 IG posts, 4 TikTok videos, 2 YouTube shorts, 2 Facebook events, 12 WhatsApp broadcast messages, 3 LinkedIn posts (for B2B/sponsor audience)
- Human approval gate: admin reviews draft in `/admin/campaigns/:id/approve` before any post is scheduled
- Postiz receives approved batch via `POST /public/v1/posts` for each channel
- OpenClaw receives outreach list for WhatsApp DM campaign to past attendees (approval gate: admin reviews 5-message sample before any send)

**Week -3: Contest/ticket opening**
- Voting opens → vote-cast rate feeds `roi_daily.votes_today` → Realtime tile in organizer dashboard
- Ticket tiers go live: Early Bird → General → VIP (pg_cron flips `available_from` dates automatically)
- Referral links generated per ticket buyer: every Camila gets `?ref=camila_uid` — any subsequent ticket purchase within 72h credits her referral account
- A7 contestant chase: twice-weekly WhatsApp template to contestants who haven't submitted photos yet

**Week -2: Amplification**
- Gemini generates contestant spotlight content for each registered contestant (structured Gemini `post_bundle` schema: caption + hashtags + image prompt)
- UGC challenge: `#MissEleganciaVota2026` hashtag tracking via OpenClaw search → reward top 10 sharers with early-door access
- Influencer scoring (`sponsor-audience-match` + `googleSearch` grounding): identifies top 5 Medellín micro-influencers aligned to event audience → DM pitch template via OpenClaw

**Week -1: Urgency**
- Ticket scarcity: remaining inventory displayed live (`event_tickets.quantity_available` via Realtime subscription)
- Postiz schedules countdown posts (T-7, T-3, T-1, T-day)
- A6 attendance confirmation: WhatsApp template `"¡Tu evento es mañana! Aquí tu entrada QR 📱"` sent T-12h to all buyers
- Sponsor banner goes live: `<SponsoredSurface surface="event_header" />` on EventDetail page

### Live (event day)

- Staff QR scanner PWA: `/staff/check-in/:event` — jsQR camera, IndexedDB offline queue, sync on reconnect
- Door check-in rate feeds Realtime tile in organizer dashboard: "142 scanned / 220 expected"
- Sponsor impressions fire on every EventDetail page load during event window
- Live leaderboard (vote ranking): updates every 30s via Supabase Realtime subscription
- Social proof: top-voted contestant's name displayed on sponsor banner surfaces

### Post-event (T+0 to T+7)

- `ticket-validate` final state: `attended` vs `no_show` computed — feeds ROI dashboard (no-show rate → event health metric)
- Gemini generates recap content: highlight reel captions, winner announcement copy, "Thank you" social posts → Postiz schedules 4 posts over T+1 to T+7
- Sponsor ROI PDF: `sponsor-roi-explain` generates plain-language performance summary → emailed to Andrés automatically
- Post-event referral: all attendees receive WhatsApp message with next event preview + early-access link

### Social channels — full matrix

| Channel | Phase | Use case | Tool | Approval gate |
|---|---|---|---|---|
| **Instagram** | Phase 2 | Contest promo, contestant spotlights, countdown reels | Postiz | Yes — admin reviews draft |
| **Facebook** | Phase 2 | Event pages, local group amplification, older Medellín audience | Postiz | Yes |
| **TikTok** | Phase 2 | Behind-the-scenes, contestant intros, voting tutorials | Postiz (draft-only for IG-linked accounts) | Yes |
| **YouTube** | Phase 3 | Event highlights, sponsor case study videos, venue tours | Postiz | Yes |
| **LinkedIn** | Phase 2 | Sponsor targeting (Postobón brand managers), B2B venue outreach | Postiz | Yes |
| **WhatsApp** | Phase 2 | Ticket confirmation, voting reminders, contestant chase, broadcast campaigns | Infobip (transactional) + OpenClaw (broadcast) | Yes for broadcast |
| **Reddit** | Phase 3 | r/Medellin, r/Colombia community posts; event discovery | Manual post by CM → link tracked with UTM | CM posts manually |
| **Telegram** | Phase 3 | Internal team comms; eventually public mdeai channel for power users | Manual (Telegram Bot API for push notifications) | No |
| **Email** | Phase 1 | Ticket PDF + QR delivery; sponsor contract; post-event recap | SendGrid via `ticket-payment-webhook` | No — transactional |
| **SMS** | Phase 2 | OTP + attendance reminder (Infobip) | Infobip | No — transactional |
| **Push (PWA)** | Phase 3 | Voting reminders, countdown, results announcement | Web Push API (service worker) | No — system-triggered |

**Additional channels to add (Phase 3-4):**
- **Spotify Podcast Ads** — sponsor-funded audio ads targeting Medellín listeners during event week
- **Google Display** — retargeting past attendees via `event_orders.buyer_email` custom audiences
- **Mercado Libre** — ticket resale monitoring (detect scalping, enforce face-value caps)
- **Tinder/Bumble** — event promotion cards (Medellín's dating apps heavily used for event discovery)

---

## 4. Venue Strategy

### The problem Medellín venues have today

Club Mansión, Hotel Intercontinental, Salón Versalles — these venues have:
- 0 CRM (contacts live in owner's WhatsApp)
- 0 online booking (all inquiries via email or DM)
- 0 revenue analytics (how many events/month? which was most profitable? who were the sponsors?)
- 0 double-booking protection (two organizers book the same Saturday → disaster)

mdeai solves all four with a system venues already want but can't build themselves.

### Venue revenue model (full detail in [`venue-playbook.md`](./venue-playbook.md))

| Revenue stream | Example | mdeai cut |
|---|---|---|
| Booking fee (per event) | Club Mansión books a 200-person event @ $800k COP | 5% = $40k COP |
| Sponsor placement premium | Postobón sponsors 3 venues during Feria de las Flores | 15% uplift on sponsor tier → mdeai keeps 15% |
| Venue SaaS subscription | Hotel Intercontinental manages 6+ events/month | $250k COP/month subscription |
| Upsell: AI layout generator | Venue uses `ai-venue-layout-generator` → seats 23 more guests | Included in subscription |
| Upsell: AI dynamic pricing | Venue uses price optimizer for weekend premium | Included in subscription |

**Target venues (Medellín, Phase 2 pilot):**

| Venue | Capacity | Target use case | MRR potential |
|---|---|---|---|
| Club Mansión (El Poblado) | 300 | Beauty pageants, fashion shows | $250k COP/mo |
| Salón Versalles (Centro) | 800 | Large galas, graduation events | $250k COP/mo |
| Hotel Intercontinental Salón Real | 500 | Corporate + pageant finals | $500k COP/mo |
| La Macarena event spaces (5+ venues) | 50–200 | Pop-up dinners, intimate contests | $150k COP/mo each |
| Casa Gardeliana (El Centro) | 120 | Restaurant week dinners, tastings | $150k COP/mo |

**Phase 2 venue launch checklist:**
1. `/venues/:slug` landing page (static, public — no auth required)
2. `event_venue_availability` table + conflict detection (`EXCLUDE USING gist` on tstzrange)
3. Venue inquiry form → creates draft event → organizer wizard auto-populated
4. Venue dashboard: upcoming events, revenue tiles, sponsor placements on venue surfaces
5. Venue contract generation (same `sponsor-contract-generate` pattern with `venue_contract` template)

### Venue → sponsor cross-sell

Every venue booking becomes a sponsor sale opportunity. When Club Mansión books a 300-person event:
- mdeai auto-generates a sponsor pitch deck: "300 attendees, 18-35 female Medellín audience, 4 brand surfaces available"
- Admin sends via email + WhatsApp to top 3 relevant brands from `sponsor.organizations`
- Brands apply via the existing `/sponsor/apply` wizard
- Revenue compounds: one venue booking becomes one event listing + one sponsor deal + one ticket flow

---

## 5. Restaurant Strategy

### The restaurant loop

Restaurants are the missing link between **events** and **daily platform revenue**. A restaurant on mdeai isn't just a listing — it's an active event host.

| Restaurant action | mdeai revenue |
|---|---|
| Monthly "tasting dinner" event listed | 5% ticket commission |
| "Best Bandeja Paisa in Medellín" contest entry | $150k COP contest listing fee (Phase 2) |
| Table reservation (AI concierge → direct booking) | $5k–10k COP booking fee per table |
| Sponsor placement ("Mi Sazón powered by Águila beer") | 15% sponsor tier as platform fee |
| Post-event WhatsApp follow-up (Infobip) | Included in subscription |

### Restaurant-specific growth loops

**Loop 1 — Contest → traffic → repeat bookings**
Restaurant enters "Best Bandeja Paisa 2026" → Camila votes → visits restaurant → books table via mdeai concierge → mdeai captures her email/phone → promotes next contest/event to her

**Loop 2 — AI menu → event → upsell**
QR menu scan on table → AI concierge suggests: "¿Quieres reservar la cena de degustación del próximo mes?" → reservation confirmed → ticket issued → post-dinner follow-up with contestant spotlight

**Loop 3 — Sponsor → restaurant → sponsor renews**
Mi Sazón signs a Bronze sponsorship ($500k COP) → placed on contest pages → attribution shows 340 restaurant visits → Andrés's counterpart at Mi Sazón renews at Silver ($2M COP) with data

### Restaurant data model (Phase 2 additions)

```sql
-- Extends existing restaurants table
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS mdeai_venue_id uuid REFERENCES event_venues(id),
  ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'free'
    CHECK (subscription_tier IN ('free','basic','pro')),
  ADD COLUMN IF NOT EXISTS booking_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS contest_eligible boolean DEFAULT false;

-- Restaurant table reservations (Phase 2)
CREATE TABLE restaurant_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid NOT NULL REFERENCES restaurants(id),
  guest_user_id uuid REFERENCES auth.users(id),
  party_size int NOT NULL CHECK (party_size BETWEEN 1 AND 20),
  reservation_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','seated','completed','cancelled','no_show')),
  source text NOT NULL DEFAULT 'ai_concierge'
    CHECK (source IN ('ai_concierge','direct','whatsapp','referral')),
  booking_fee_cents int NOT NULL DEFAULT 0,
  stripe_payment_intent text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

---

## 6. Sponsorship System

> Full schema, edge functions, and task specs: [`03-sponsorship-system.md`](./03-sponsorship-system.md) and tasks [`045`–`058`](./prompts/).

### Tier architecture + revenue per event

| Tier | Price (COP) | Surfaces | Attribution | Commitment |
|---|---|---|---|---|
| **Bronze** | $500k | 2 digital surfaces | Impressions + clicks | 30-day min |
| **Silver** | $2M | 5 surfaces + contestant sponsor | Impressions + clicks + CPL | 60-day min |
| **Gold** | $5M | 8 surfaces + venue naming + title naming | Full CPA | 90-day min |
| **Premium** | $15M+ | Exclusive event + all surfaces + co-brand content | Full CPA + guaranteed ROI | Custom |

**Platform revenue at full capacity (10 events × 1 Gold + 2 Silver + 4 Bronze):**
- Gold: 10 × $5M × 5% = $2.5M COP/month
- Silver: 20 × $2M × 5% = $2M COP/month
- Bronze: 40 × $500k × 5% = $1M COP/month
- **Total: ~$5.5M COP/month (~$1,375 USD/month) from sponsorships alone**

### Sponsor acquisition funnel

```
1. Outreach (OpenClaw + LinkedIn DM)
   → Brand manager opens email/DM
2. Self-serve apply (/sponsor/apply wizard — 4 steps, 8 min)
   → Submission creates sponsor.applications row
3. Admin review (/admin/sponsorships — queue view)
   → Approve → sponsor-contract-generate fires
4. Sponsor signs contract (/sponsor/contract/:id — inline PDF + click-wrap)
   → sponsor_signed_at set
5. Stripe Checkout (sponsor-checkout edge fn)
   → invoice.status = 'paid'
6. Placements activate (pg_cron hourly check)
   → sponsor.placements.active = true
7. Campaign runs (SponsoredSurface component fires impressions)
8. ROI dashboard (/sponsor/dashboard/:id — 8 Realtime tiles)
   → Andrés shows his director
9. Renewal conversation (sponsor-roi-explain email + WhatsApp template)
   → Andrés signs next contract at higher tier
```

### Sponsorship → contest synergy

The most defensible feature: a sponsor can buy a **contestant sponsor** activation — "Esta concursante es patrocinada por Postobón". Every vote for that contestant becomes an attributed engagement. Postobón can see: "Our sponsored contestant received 4,200 votes from 18-34F Medellín audience." No other platform in Colombia offers this.

---

## 7. Postiz + OpenClaw Integration

### Separation of concerns (non-negotiable)

| Capability | Tool | Who triggers | Auth |
|---|---|---|---|
| Social scheduling (IG, FB, TikTok, YT, LinkedIn) | Postiz | `postiz-schedule-posts` edge fn | Postiz API key (server-side only) |
| WhatsApp broadcast (bulk) | OpenClaw | `openclaw-send-outreach` edge fn | Signed job envelope (HMAC-SHA256) |
| WhatsApp transactional (ticket confirm, OTP, reminders) | Infobip | `ticket-payment-webhook`, OTP edge fn | Infobip API key |
| Instagram/TikTok DM outreach | OpenClaw | `openclaw-build-audience` → admin approval → `openclaw-send-outreach` | Signed job envelope |

**Approval gate (non-negotiable product rule):** AI proposes → human previews → human approves → system executes. OpenClaw never sends anything without a `campaign_approvals` row with `status='approved'` and `approver_user_id` set.

### Gemini → Postiz workflow

```typescript
// 1. Gemini generates post bundle (G1: responseJsonSchema guaranteed)
const postBundle = await ai.models.generateContent({
  model: "gemini-3-flash-preview",
  contents: systemPrompt + eventContext,
  config: {
    responseMimeType: "application/json",
    responseJsonSchema: zodToJsonSchema(PostBundleSchema), // G1
    tools: [{ googleSearch: {} }],                         // G3: search for trending hashtags
    thinkingConfig: { thinkingLevel: "low" }               // fast for content gen
  }
});

// 2. Save to campaign_posts (status='draft')
await supabase.from('campaign_posts').insert({
  campaign_id, content: postBundle.captions,
  scheduled_for: postBundle.suggested_times,
  status: 'draft', platform: channel
});

// 3. Admin reviews → approves in /admin/campaigns/:id
// 4. postiz-schedule-posts edge fn fires
const postizRes = await fetch('https://app.postiz.com/public/v1/posts', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${POSTIZ_API_KEY}` },
  body: JSON.stringify({
    type: 'schedule',
    date: post.scheduled_for,
    shortLink: true,
    settings: { /* per-channel settings */ },
    content: [{ content: post.content }],
    tags: [campaignId]
  })
});
// 5. Store provider_post_id → campaign_posts.provider_post_id
```

### OpenClaw workflow

```typescript
// 1. Build audience (admin-triggered)
const audience = await buildAudienceJob({
  platform: 'whatsapp',
  filters: { city: 'Medellín', event_category: 'pageant', language: 'es-CO' },
  max_contacts: 500, // daily cap: 50/channel enforced in job validation
});

// 2. Generate message (Gemini draft)
const messageDraft = await ai.models.generateContent({ /* Spanish-Paisa WA template */ });

// 3. Save to campaign_approvals (status='pending_review')
// 4. Admin reviews sample messages in /admin/campaigns/:id/outreach
// 5. Admin clicks Approve → campaign_approvals.status = 'approved'
// 6. openclaw-send-outreach fires with signed job envelope
const jobEnvelope = {
  job_id: uuid(), campaign_id, platform: 'whatsapp',
  contacts: audience.slice(0, dailyCap),
  message_template: approvedTemplate,
  scheduled_at: nextSendWindow,
  hmac: sign(jobPayload, OPENCLAW_SECRET)
};
// OpenClaw executes → returns receipts → campaign_events logged
```

---

## 8. Revenue Model — All Streams

### Revenue streams ranked by Phase

| Phase | Stream | Unit economics | Monthly potential (COP) |
|---|---|---|---|
| **1** | Ticket commission (5%) | $2k COP avg ticket × 200 sold × 5% = $20k COP/event | $200k–2M COP |
| **2** | Sponsorship platform fee | $500k–15M COP contract × 5% | $1M–5M COP |
| **2** | Contest listing fee | $150k COP/restaurant or brand | $750k COP (5 contests/month) |
| **3** | Venue booking fee (5%) | $500k COP venue × 5% | $500k–2M COP |
| **3** | Venue SaaS subscription | $150k–500k COP/venue/month | $1M–3M COP (10 venues) |
| **3** | Restaurant booking fee | $7.5k COP/table × 200 tables | $1.5M COP |
| **3** | Restaurant subscription | $100k COP/restaurant/month | $1M COP (10 restaurants) |
| **4** | CPL/CPA sponsor performance pricing | $50k COP/lead × 1k leads | $2.5M COP (5% share) |
| **4** | White-label organizer fee | $2M COP setup + $500k COP/month | $2M COP/month per partner |
| **4** | AI creative upsell (sponsor) | $500k COP/campaign creative package | $2.5M COP (5 sponsors) |

### Scaling model — monthly platform revenue

| Milestone | Events/mo | Sponsors | Venues | Restaurants | Monthly revenue (COP) |
|---|---|---|---|---|---|
| Phase 1 launch | 1 | 0 | 0 | 0 | $200k |
| Phase 2 (6 weeks out) | 5 | 5 | 0 | 0 | $2M |
| Phase 3 (12 weeks out) | 10 | 10 | 5 | 10 | $8M |
| Phase 4 (20 weeks out) | 20 | 20 | 15 | 30 | $20M |
| Q1 2027 (Bogotá expansion) | 40 | 40 | 30 | 60 | $45M |

At $4,000 COP/USD: Phase 4 = ~$5,000 USD/month; Q1 2027 = ~$11,250 USD/month.

### Unit economics per flagship event (Phase 2 example)

**Event:** Reina de Antioquia Finals — 300 attendees, 2-week campaign, 1 Gold sponsor

| Line item | Gross | mdeai net |
|---|---|---|
| Ticket sales (300 × $80k COP) | $24M COP | $1.2M COP (5%) |
| Gold sponsor (Postobón) | $5M COP | $250k COP (5%) |
| Venue fee (Club Mansión) | $1.5M COP | $75k COP (5%) |
| Postiz campaign (included in sponsor) | — | — |
| **Total gross** | **$30.5M COP** | **$1.525M COP** |

**Net margin after Stripe fees (~3% on tickets) and Infobip (~$50k COP):** ~$1.4M COP per flagship event.

---

## 9. Database + API Mapping

### Complete table inventory (events + marketing + sponsorship)

```
event.*
├── event.events           (core event: slug, status, organizer_id, total_capacity)
├── event.event_tickets    (tier: name, price_cents, quantity, available_from)
├── event.event_orders     (purchase: buyer_user_id, tickets_json, stripe_pi, status)
├── event.event_attendees  (QR: qr_token, qr_used_at, check_in_time)
├── event.event_venues     (venue: name, slug, address, capacity, geom)
├── event.event_venue_bookings  (booking: venue_id, event_id, tstzrange, status)

vote.*
├── vote.contests          (contest: event_id FK, scoring formula, status)
├── vote.contestants       (profile: contest_id, display_name, photo_url)
├── vote.votes             (ballot: contestant_id, voter_user_id, vote_source)
├── vote.judges            (judge: contest_id, user_id, weight)
├── vote.judge_scores      (score: contestant_id, judge_id, category, score)

sponsor.*
├── sponsor.organizations  (brand: legal_name, tax_id, website, tier_interest)
├── sponsor.applications   (apply: org_id, event_id, tier, activation_type, dispute_freeze)
├── sponsor.contracts      (legal: signed_ip_hash, sponsor_signed_at, status)
├── sponsor.invoices       (billing: stripe_payment_intent, amount_cents, status)
├── sponsor.placements     (ad slot: surface, start_at, end_at, active, priority)
├── sponsor.assets         (creative: url, type, status, ai_moderation_score)
├── sponsor.impressions    (telemetry: placement_id, viewer_hash, page_url)
├── sponsor.clicks         (telemetry: placement_id, viewer_user_id, viewer_anon_id)
├── sponsor.attributions   (conversion: click_id, conversion_kind, value_cents)
├── sponsor.roi_daily      (rollup: application_id, date, impressions, clicks, attributed_orders)

marketing.*  (Phase 2 — from social/01-postiz-openclaw.md)
├── marketing.campaigns        (campaign: name, event_id, status, budget_cents)
├── marketing.campaign_channels (channel: campaign_id, platform, postiz_account_id)
├── marketing.campaign_posts    (post: channel_id, content, scheduled_for, provider_post_id)
├── marketing.campaign_assets   (media: url, type, gemini_prompt)
├── marketing.campaign_audiences (segment: campaign_id, openclaw_audience_id, size)
├── marketing.campaign_contacts  (recipient: audience_id, identifier, status)
├── marketing.outreach_messages  (message: contact_id, content, sent_at, status)
├── marketing.campaign_approvals (gate: campaign_id, step, status, approver_user_id)
├── marketing.campaign_events    (log: campaign_id, event_type, payload)
├── marketing.campaign_metrics   (perf: post_id, likes, shares, reach, ctr)
├── marketing.campaign_conversions (conversion: campaign_id, user_id, conversion_type)
├── marketing.referral_links     (ref: campaign_id, slug, clicks, conversions)
├── marketing.suppression_lists  (opt-out: identifier, platform, reason)

venue.*  (Phase 2 — from venue-playbook.md)
├── event.event_venues            (merged into event schema)
├── event.event_venue_resources   (AV, catering, staff per venue)
├── event.event_venue_staff       (staff roles per booking)
├── event.event_venue_availability (conflict detection via EXCLUDE USING gist)
├── event.event_venue_layouts     (floor plans, seat counts, AI-generated)
├── event.event_venue_contracts   (Phase 3: venue rental agreements)
```

### Edge function inventory (all deployed + planned)

```
Phase 1 (deployed):
├── ticket-checkout        Stripe Checkout session + atomic qty guard
├── ticket-payment-webhook QR JWT mint + email PDF + .ics
├── ticket-validate        Single-use door scan
├── ai-chat                Multi-agent chat (7 intents)
├── ai-router              Intent classification
├── ai-search              Semantic search (pgvector)

Phase 2 (to deploy):
├── vote-cast              Atomic vote + fraud check
├── sponsor-application-create  Self-serve sponsor apply
├── sponsor-checkout       Stripe Checkout for sponsors
├── sponsor-payment-webhook Stripe webhook → placement activate
├── sponsor-impression     Fire-and-forget impression beacon
├── sponsor-click          Click beacon + UTM wrap
├── sponsor-qr-redirect    302 redirect with click tracking
├── sponsor-cancel         Cancel/dispute state machine
├── sponsor-contract-generate  PDF generation + Storage upload
├── sponsor-contract-sign  Click-wrap signature
├── campaign-create        Marketing campaign scaffold
├── campaign-generate-plan Gemini content calendar (G1+G3)
├── campaign-approve       Approval gate state machine
├── postiz-schedule-posts  Postiz API integration
├── openclaw-build-audience Audience segmentation
├── openclaw-send-outreach Signed job envelope → OpenClaw
├── campaign-track-click   UTM click → referral_links
├── campaign-ingest-metrics Postiz metrics polling (6h)

Phase 3 (to deploy):
├── sponsor-moderate       Gemini creative moderation
├── sponsor-creative-gen   Gemini image/copy generation
├── sponsor-roi-explain    Plain-language ROI summary
├── sponsor-optimize       Campaign optimization suggestions
├── sponsor-audience-match Gemini + googleSearch brand alignment
├── ai-venue-optimizer     Dynamic venue pricing
├── ai-venue-layout-generator  Floor plan suggestions
├── campaign-generate-report  Sponsor PDF recap
├── restaurant-booking     Table reservation flow
```

---

## 10. PRD Expansion — What Gets Added to 100-events-prd.md

### New section: Marketing System (Phase 2)

**Module overview:** The marketing system gives organizers and mdeai operators a single interface to generate, approve, schedule, and measure social campaigns tied to events. It wraps Postiz (scheduling) and OpenClaw (outreach) behind a human approval gate.

**Deliverables (Phase 2, 2 weeks):**

| Deliverable | Task file | Estimated |
|---|---|---|
| `marketing.*` schema migration | `tasks/events/prompts/059-marketing-schema.md` | 0.5 day |
| `/admin/campaigns` campaign builder | `tasks/events/prompts/060-campaign-builder-ui.md` | 1 day |
| `campaign-generate-plan` edge fn (Gemini) | `tasks/events/prompts/061-campaign-generate-plan.md` | 1 day |
| `campaign-approve` + approval UI | `tasks/events/prompts/062-campaign-approve.md` | 0.5 day |
| `postiz-schedule-posts` edge fn | `tasks/events/prompts/063-postiz-schedule-posts.md` | 1 day |
| `openclaw-build-audience` + `openclaw-send-outreach` | `tasks/events/prompts/064-openclaw-outreach.md` | 1 day |
| `campaign-track-click` + `referral_links` | `tasks/events/prompts/065-referral-tracking.md` | 0.5 day |
| `campaign-ingest-metrics` + analytics dashboard | `tasks/events/prompts/066-campaign-analytics.md` | 1 day |
| **Total** | | **6.5 days** |

### New section: Venue System (Phase 2-3)

**Module overview:** Full venue booking and management system. Tasks already exist in `031–044` range for venue schema + operational tools + enterprise booking + AI optimization.

**Adds to PRD:** Venue subscription tier as a standalone revenue stream (not just a feature of events). Venues get their own `/host/venues` dashboard, contract generation (same `sponsor-contract-generate` pattern), and public landing page (`/venues/:slug`).

### New section: Restaurant Module (Phase 3)

**Module overview:** Restaurants participate as event hosts (monthly dinners, tastings, contests), not just as listings. `restaurant_reservations` table + AI concierge integration + QR booking flow.

### New section: Sponsor System (Phase 2-3)

Already in PRD Phase 2 scope. The addition: sponsor contracts (tasks 055–058) must be referenced as a dependency for placement activation. No contract signed = no placement active.

---

## 11. Execution Plan — 6 Weeks

### Dependency graph

```
Phase 1 (done or in flight) ─────────────────────────────────────────────────────────
  event.* schema, ticket-checkout, ticket-validate, wizard, PWA scanner, buyer pages

Phase 2 — Week 1-2: Contest + First Sponsor + Campaign Foundation
  ├── vote.* schema + vote-cast edge fn
  ├── sponsor.* schema (task 045) + apply wizard (046) + admin queue (047)
  ├── sponsor-checkout (048) + payment webhook
  ├── marketing.* schema (059)
  ├── campaign-create + campaign-generate-plan (060, 061)
  └── Gemini SDK migration (already in flight)

Phase 2 — Week 3-4: Sponsor Surfaces + Campaign Execution
  ├── SponsoredSurface component (049) + impression/click edge fns (050)
  ├── Attribution trigger (051)
  ├── Sponsor dashboard (052) + ROI rollup cron (053)
  ├── campaign-approve UI (062) + postiz-schedule-posts (063)
  ├── openclaw-build-audience + send-outreach (064)
  └── referral-tracking (065) + campaign-analytics (066)

Phase 2 — Week 5-6: Contracts + Dispute + Campaign Analytics
  ├── sponsor.contracts schema (055)
  ├── sponsor-contract-generate (056) + contract-sign page (057)
  ├── sponsor-dispute UI (058) + sponsor-cancel edge fn
  ├── campaign-ingest-metrics polling (066)
  ├── Venue system: event_venue_bookings + availability (031-034)
  └── First contest live (Miss Elegance Colombia 2026 voting opens)
```

### Week-by-week task assignments

**Week 1 (May 4-10):**
| Day | Task | Output |
|---|---|---|
| Mon | Task 045: `sponsor.*` schema migration | `sponsor.*` schema live in Supabase |
| Tue | Task 046: Sponsor apply wizard | `/sponsor/apply` 4-step wizard |
| Wed | Task 047: Admin sponsor queue | `/admin/sponsorships` |
| Thu | Task 048: Stripe checkout + webhook | Sponsor pays via Stripe |
| Fri | Task 059: `marketing.*` schema | Marketing tables in Supabase |

**Week 2 (May 11-17):**
| Day | Task | Output |
|---|---|---|
| Mon | Task 049: SponsoredSurface component | `<SponsoredSurface>` renders on event pages |
| Tue | Task 050: Impression + click edge fns | Beacons fire; rate-limited |
| Wed | Task 051: Attribution trigger | 24h last-click attribution live |
| Thu | Task 052: Sponsor dashboard | `/sponsor/dashboard/:id` with Realtime tiles |
| Fri | Task 053: ROI rollup cron | `roi_daily` refreshes every 5 min |

**Week 3 (May 18-24):**
| Day | Task | Output |
|---|---|---|
| Mon | Task 060: Campaign builder UI | `/admin/campaigns` create + preview |
| Tue | Task 061: `campaign-generate-plan` edge fn | Gemini generates 4-week content calendar |
| Wed | Task 062: Campaign approve flow | Approval gate UI + edge fn |
| Thu | Task 063: `postiz-schedule-posts` | Posts scheduled in Postiz |
| Fri | Task 064: OpenClaw outreach | WhatsApp broadcasts with approval gate |

**Week 4 (May 25-31):**
| Day | Task | Output |
|---|---|---|
| Mon | Task 065: Referral tracking | `referral_links` + `?ref=` UTM attribution |
| Tue | Task 066: Campaign analytics dashboard | `/admin/campaigns/:id/analytics` |
| Wed | Task 055: `sponsor.contracts` schema | Contracts table live |
| Thu | Task 056: `sponsor-contract-generate` | PDF generated + emailed |
| Fri | Task 057: Contract sign page | Sponsor signs click-wrap |

**Week 5 (Jun 1-7):**
| Day | Task | Output |
|---|---|---|
| Mon | Task 058: Dispute UI + cancel edge fn | Full cancellation/dispute flow |
| Tue | Task 054: AI sponsor edge fns | Moderation + creative gen + ROI explain |
| Wed | Tasks 031-033: Venue schema + ops tools | Venue system Phase 2 core |
| Thu | Tasks 034-035: Venue availability + picker | Double-booking prevention live |
| Fri | Vote schema + `vote-cast` edge fn | Voting ready for contest launch |

**Week 6 (Jun 8-14):**
| Day | Task | Output |
|---|---|---|
| Mon | Contest contestant intake + admin review | Contestants on-platform |
| Tue | Voting UI (`/vote/:slug`) + leaderboard | Public voting page live |
| Wed | First campaign approved + Postiz schedules | IG/FB/TikTok posts live |
| Thu | First sponsor (Bronze) onboarded + signed | First paying sponsor |
| Fri | **Miss Elegance Colombia 2026 voting OPENS** | **Phase 2 complete** |

### What to defer (and why)

| Item | Why defer | Target |
|---|---|---|
| Hermes + Paperclip orchestration | Too complex for solo dev; OpenClaw + pg_cron handles Phase 2 automations | Phase 4 (Q4 2026) |
| CPL/CPA pricing | Requires 30d of `roi_daily` data first | Phase 3/4 |
| YouTube campaign | Lower ROI than IG + TikTok for Medellín audience; less urgent | Phase 3 |
| Reddit | Low Medellín-specific audience; manual posts fine | Phase 3 |
| Restaurant booking flow | Venue system delivers more revenue first | Phase 3 |
| White-label organizer | Requires multi-tenant schema changes + CPL data | Phase 4 |
| Bogotá expansion | Platform must be proven in Medellín first | Q1 2027 |
| Spotify/Google Display ads | Requires ad spend budget ($1M+ COP/month) | Phase 4 |

### Risk log (Phase 2 specific)

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Postiz API rate limits hit during large campaign | Medium | High | Batch posts across 48h window; 50 posts/day cap in `postiz-schedule-posts` |
| OpenClaw WhatsApp account flagged | Medium | High | Warm up sender (5→25→50 msgs/day gradient); suppression list active from day 1 |
| First sponsor expects Eventbrite-quality reporting | High | Medium | Over-deliver on ROI dashboard (Realtime tiles + PDF summary) vs Eventbrite's basic analytics |
| `campaign-generate-plan` Gemini output fails JSON schema | Low | High | G1 (`responseJsonSchema`) + retry with backoff; fallback to manual campaign creation |
| Stripe refund storm if first contest fails | Low | Critical | Guaranteed-value packages + dispute UI (task 058) + explicit cancellation policy in contract |
| Solo dev burnout during 6-week sprint | High | Critical | Phase gates with explicit Friday check-ins; defer any task marked "Phase 3" if velocity drops |

---

## See also

- [`100-events-prd.md`](./100-events-prd.md) — binding PRD (updated with marketing + venue sections)
- [`101-roadmap.md`](./101-roadmap.md) — roadmap (updated with growth initiatives)
- [`03-sponsorship-system.md`](./03-sponsorship-system.md) — full sponsor schema + tasks S1-S14
- [`venue-playbook.md`](./venue-playbook.md) — venue strategy + 4-week execution
- [`social/01-postiz-openclaw.md`](./social/01-postiz-openclaw.md) — Postiz + OpenClaw integration architecture
- [`prompts/045`–`058`](./prompts/) — sponsorship system task prompts
