# mdeai Venue Playbook
> **Production-ready strategy for physical venues on mdeai.co**
> Version 1.0 · 2026-05-03 · Medellín-first

---

## Table of Contents

1. [Venue Strategy](#1-venue-strategy)
2. [Venue Funnel](#2-venue-funnel)
3. [Landing Page System](#3-landing-page-system)
4. [Booking + Payment System](#4-booking--payment-system)
5. [Venue Operations System](#5-venue-operations-system)
6. [Revenue Model](#6-revenue-model)
7. [Advanced Growth — The mdeai Advantage](#7-advanced-growth)
8. [Database + API Mapping](#8-database--api-mapping)
9. [Execution Plan](#9-execution-plan)

---

## 1. Venue Strategy

### How a venue uses mdeai end-to-end

A venue owner — call them Sofía (Daniela at Club Mansión, or Carlos at Hotel Intercontinental) — does four things on mdeai:

1. **Registers the venue once** (`/host/venues` → `event_venues` row with capacity, address, geo, floor plan)
2. **Creates events against it** (wizard pre-fills address + capacity from saved venue in 2 clicks)
3. **Sells tickets directly** (Stripe-powered, QR-generated, no middleman)
4. **Operates the door** (PWA scanner + staff JWT, no paper lists)

The entire lifecycle — from "I want to host a fashion show" to "Last ticket sold, 300 people checked in, $18M COP deposited" — happens inside one platform.

### Why mdeai beats Eventbrite + Instagram + WhatsApp

| Pain point (current stack) | How mdeai fixes it |
|---|---|
| **Eventbrite takes 6.5% + $1.59/ticket** (a 300-person event at $60k COP/ticket = ~$2M COP gone to fees) | mdeai takes **5% flat** via Stripe Connect; ~$900k COP saved on same event |
| **Instagram DMs for ticket questions** (disorganized, no history) | AI chat widget on every event page answers 90% of questions instantly |
| **WhatsApp spreadsheet check-in** (screenshots, paper lists, 3-min queue per person) | PWA QR scanner validates in <2s; works offline |
| **No upsell path** (GA ticket holder has no way to upgrade to VIP at door) | Ticket tiers (GA/VIP/Backstage) + promo codes + sponsor activations wired together |
| **Separate tools, separate logins** (Canva poster → Linktree → Eventbrite → WhatsApp → Instagram) | One URL: `mdeai.co/events/mi-evento` handles everything |
| **No ROI data for sponsors** (brand sends check, trusts the organizer) | Real-time impression/click/attributed-purchase dashboard for every sponsor |
| **Ticket resale fraud** | JWT-signed QR, single-use validation, `ticket-validate` edge fn rejects duplicates |

### Core value proposition for venue owners

> **"Sell more tickets, keep more money, run a smoother door — all from one link."**

Three concrete numbers for the pitch:
- **$900k COP** saved per 300-person event vs Eventbrite (5% vs 6.5% + fees)
- **< 30 minutes** to publish a new event (wizard: Basics → Tickets → Review → Publish)
- **< 2 seconds** per guest at check-in (QR scan via PWA, no WiFi needed)

---

## 2. Venue Funnel

### Full funnel: Traffic → Landing → Booking → Event → Retention

```
TRAFFIC                    LANDING                BOOKING              EVENT              RETENTION
──────────                 ───────                ───────              ─────              ─────────
QR poster in venue    →    /events/:slug          AI chat widget       PWA scanner        Post-event email
Instagram bio link    →    (hero + tickets        answers questions    validates QR       "Rate your night"
WhatsApp broadcast    →     + map + chat)         ↓                   ↓                  ↓
Google "events Medellín"   ↓                      Stripe Checkout      Real-time          AI recommends
Word of mouth         →    AI concierge           (one page, mobile-   capacity dash      next event
                           routes interest        first, Apple Pay /   ↓                  ↓
                           to event page          PSE supported)       Staff dashboard    WhatsApp retarget
                                                  ↓                   ↓                  (OpenClaw)
                                                  QR ticket email      Upsell at door
                                                  + WhatsApp           (VIP upgrade)
```

### QR usage in the real world

| Placement | What it says | Where it points |
|---|---|---|
| A3 poster at venue entrance | "¡Compra tus boletas!" + QR | `mdeai.co/events/[slug]` |
| Table tent card | "Reserva tu mesa VIP" + QR | `mdeai.co/events/[slug]?tier=vip` |
| Instagram story / Reels caption | "Link en bio" | Same event URL |
| WhatsApp broadcast (OpenClaw) | Leaderboard screenshot + CTA | `mdeai.co/events/[slug]?utm_source=wa` |
| Sponsor booth at venue | "Scan para votar / comprar" | `/v/[placement_id]` (QR redirect with click tracking) |
| Receipt / wristband | "Accede a tu boleta" | `/me/tickets/[order_id]?token=[jwt]` |

### Chat-first conversion points

The AI chat widget (`FloatingChatWidget`) is mounted on every event page. It handles:

1. **Pre-purchase questions** — "¿Qué incluye el VIP?", "¿Hay parqueadero?", "¿Cuántos tickets quedan?"
2. **Ticket recommendation** — "Somos 4 amigos, ¿qué boleta nos conviene?" → recommends tier + quantity
3. **Upsell** — "Vi que hay una opción Backstage…" → explains and links directly to that tier
4. **Post-purchase** — "¿A qué hora abren las puertas?" → answers from event `run_of_show` metadata

The AI never needs a human agent for these — all answers come from the event's structured data (start time, ticket descriptions, venue address, sponsor info) + Gemini Flash.

### Conversion points (ranked by impact)

| Point | Drop-off risk | Fix |
|---|---|---|
| Event page → ticket selection | High — confusing tier options | Pre-select recommended tier via URL param (`?tier=ga`) |
| Ticket selection → Stripe checkout | Medium — price shock | Show COP total + IVA breakdown before redirect |
| Stripe checkout → payment | Low — Stripe handles | Offer Apple Pay / PSE (Colombian bank) as first options |
| Payment confirmation → event | Low | QR ticket in email + WhatsApp within 60s |

---

## 3. Landing Page System

### Venue event page template

Every `mdeai.co/events/:slug` page follows this structure (3-panel layout):

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  LEFT PANEL (240px)              MAIN (flex-1)              RIGHT (320px)   │
│  ─────────────                  ────────────────            ─────────────   │
│  Event name (Playfair)          HERO PHOTO                  MAP (Google)    │
│  Date + time                    (w/ sponsor logo overlay)   ↓               │
│  Venue name + address           ↓                           TICKET WIDGET   │
│  ↓                              ABOUT                       GA: 0 → $60k    │
│  SOCIAL PROOF                   (AI-generated summary       VIP: 0 → $120k  │
│  ★★★★★ from past events         of event description)       [Buy Tickets]   │
│  "412 people going"             ↓                           ↓               │
│  ↓                              LINEUP / SCHEDULE           SPONSOR STRIP   │
│  SPONSORS                       ↓                           ↓               │
│  (SponsoredSurface              GALLERY (past events)       AI CHAT WIDGET  │
│   contestant_profile)           ↓                           "Ask about      │
│  ↓                              FAQ                          this event"    │
│  SHARE BUTTONS                  (AI-generated from          ↓               │
│  [WhatsApp] [IG] [Copy link]     event data)                SOCIAL SHARE    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### What converts best (validated patterns)

| Element | Why it converts | Implementation |
|---|---|---|
| **Ticket widget in right panel** (always visible) | No scrolling to find "buy" button | Sticky right panel; ticket widget mounts above fold |
| **Countdown timer** ("Quedan 3 días") | FOMO; urgency | Computed from `event_start_time - now()` |
| **Seats remaining indicator** | Social proof + scarcity | `qty_total - qty_sold - qty_pending` per tier; show "¡Solo 12 disponibles!" below 20% |
| **Hero photo with crowd** | Emotional connection | `event_media_assets` WHERE `asset_type='hero_photo'` AND `is_public=true` |
| **"X people going"** | Social proof | `COUNT(event_attendees WHERE status='active')` |
| **QR-accessible price** (no signup required) | Reduces friction | Public route, no auth wall before ticket selection |
| **AI chat for instant answers** | Removes last objections | `FloatingChatWidget` pre-seeded with event context |

### What should be AI-generated (dynamic)

| Content | AI model | How |
|---|---|---|
| **Event description** | Gemini Flash | Organizer enters 3 bullets → AI expands to 3 paragraphs in ES + EN |
| **FAQ section** | Gemini Flash | Generated from event type + venue + ticket descriptions |
| **SEO meta description** | Gemini Flash | Auto-generated at publish time, stored in `events.metadata.seo_description` |
| **Social share copy** | Gemini Flash | "Únete a nosotros en [Event] este [Date] en [Venue]…" + emoji |
| **Sponsor placement creatives** | Gemini Pro | `sponsor-creative-gen` edge fn generates captions per surface |
| **Ticket recommendation in chat** | Gemini Flash | Chat answers "which tier?" based on group size + preferences |

### Sponsor placements on event page

Per task 049 (`<SponsoredSurface>`), every surface is query-driven:

```tsx
// Mounts on hero photo — no hardcoded sponsor
<SponsoredSurface surface="contest_header" surfaceRef={eventId} />

// Bottom of ticket widget
<SponsoredSurface surface="leaderboard_footer" surfaceRef={eventId} />

// FTC required — "Sponsored" label auto-added by component
```

---

## 4. Booking + Payment System

### How tickets are created (`event_tickets`)

```sql
-- Organizer creates tiers in the wizard (task 002)
INSERT INTO public.event_tickets (
  event_id, name, description, price_cents, currency,
  qty_total, sale_starts_at, sale_ends_at, ticket_type,
  max_per_order, is_hidden
) VALUES
  (uuid, 'Entrada General', 'Acceso al evento', 60000, 'COP', 200, now(), event_end, 'paid', 10, false),
  (uuid, 'VIP', 'Zona VIP + 2 bebidas', 120000, 'COP', 50, now(), event_end, 'paid', 6, false),
  (uuid, 'Backstage', 'Meet & greet + foto', 350000, 'COP', 20, now(), event_end, 'paid', 2, false),
  (uuid, 'Gratis Staff', 'Acceso staff', 0, 'COP', 10, now(), event_end, 'free', 1, true); -- hidden
```

### Checkout flow (Stripe, atomic, fraud-safe)

```
[Buyer selects tier + qty]
         ↓
POST /functions/v1/ticket-checkout
  1. Validate JWT (auth required)
  2. Zod validate: ticket_id, quantity (1–10), attendees[], idempotency_key
  3. RPC: ticket_payment_initiate_v2()
     → SELECT event_tickets FOR UPDATE
     → Check qty_sold + qty_pending + requested ≤ qty_total (else: OUT_OF_STOCK)
     → INSERT event_orders (status='pending')
     → INSERT event_attendees × quantity (status='pending')
     → UPDATE event_tickets SET qty_pending += quantity
  4. Create Stripe Checkout session (mode='payment', currency='cop')
     → metadata: {order_id, ticket_id, event_id, idempotency_key}
     → success_url: /events/:slug/success?order_id={id}
     → cancel_url: /events/:slug?tier=ga
  5. Return { checkout_url }

[Buyer completes Stripe Checkout]
         ↓
POST /functions/v1/ticket-payment-webhook
  Stripe-Signature verified
  On checkout.session.completed:
  → RPC: ticket_payment_confirm_v2(order_id, stripe_payment_intent)
    → UPDATE event_orders SET status='paid', stripe_payment_intent=...
    → UPDATE event_attendees SET status='active'
    → UPDATE event_tickets SET qty_pending -= qty, qty_sold += qty
  → Generate QR ticket JWT (HS256, payload: {order_id, attendee_ids, event_id, exp: event_end+24h})
  → Send email (ticket PDF with QR) + WhatsApp (ticket image)
```

### QR ticket generation + validation

**Generation** (in `ticket-payment-webhook`):
```typescript
// JWT-signed QR per attendee
const token = await create(
  { alg: "HS256", typ: "JWT" },
  {
    sub: attendee_id,
    order_id,
    event_id,
    exp: Math.floor(event_end_time.getTime() / 1000) + 86400, // +24h
    single_use: true
  },
  Deno.env.get("QR_SECRET")
);
// Stored as: event_attendees.qr_token = token
// Rendered as: QR code image (base64 PNG) in email/WhatsApp
```

**Validation** (in `ticket-validate` PWA — task 007):
```typescript
// POST /functions/v1/ticket-validate
// Body: { qr_token: string }
// Auth: staff JWT (24h, from event-staff-link-generator)

// 1. Verify JWT signature (QR_SECRET)
// 2. Check exp not expired
// 3. SELECT event_attendees WHERE id=sub AND status='active'
//    → if status='checked_in' → return ALREADY_SCANNED
//    → if status='refunded' → return REFUNDED
// 4. UPDATE event_attendees SET status='checked_in', checked_in_at=now()
// 5. Return { valid: true, name: attendee_name, tier: ticket_name, order_id }
```

### Refund + no-show logic

**Refund** (via `ticket_payment_refund_v2` RPC — task 026):
```
Admin or organizer triggers refund in dashboard
→ Stripe refund via API (stripe_payment_intent)
→ RPC: UPDATE event_orders SET status='refunded'/'partial_refund'
→ UPDATE event_attendees SET status='refunded'
→ UPDATE event_tickets SET qty_sold -= refunded_qty
→ INSERT event_order_refunds (audit trail)
```

**No-show logic**:
```sql
-- Run at event_end_time + 1h (pg_cron)
UPDATE public.event_attendees
   SET status = 'no_show'
 WHERE status = 'active'
   AND order_id IN (
     SELECT o.id FROM public.event_orders o
     JOIN public.events e ON e.id = o.event_id
     WHERE e.event_end_time < now() - interval '1 hour'
   );
```

---

### Real-world examples

#### Nightclub event (Club Mansión — "Best DJ Medellín Final")

```
Event: Saturday, doors 22:00, capacity 400
Tickets:
  - GA: 200 × $40k COP = $8M COP
  - VIP table (4 people): 20 × $300k COP = $6M COP
  - Early bird (ended): 50 × $25k COP = $1.25M COP (sold out)
Total gross: $15.25M COP
mdeai fee (5%): $762k COP
Organizer payout (T+2 via Stripe Connect): $14.49M COP

Checkout path:
  → Instagram reel → "Link en bio" → event page
  → Buyer selects VIP table (4 pax)
  → Fills 4 attendee names
  → Stripe Checkout (Nequi / PSE / card)
  → QR ticket per person in WhatsApp < 60s
  → Door: 2 staff with PWA scanner, <2s/person, no queue

Sponsor: Club Mansión placed a Bronze sponsor ($500k COP) on the
leaderboard footer → 24k impressions, 1.2k clicks, 380 attributed tickets
→ cost-per-ticket-attributed: $1.3k COP
```

#### Restaurant reservation event (Mi Sazón — "Cena Maridaje")

```
Event: Friday, seated dinner for 40, prix-fixe + wine pairing
Tickets:
  - Seated dinner: 40 × $185k COP = $7.4M COP
  - VIP chef's table (6): 6 × $350k COP = $2.1M COP
Total gross: $9.5M COP
mdeai fee: $475k COP

Key differences vs nightclub:
  - max_per_order = 2 (dining tickets are per-person, not group)
  - Promo code "MARIDAJE10" = 10% off for newsletter subscribers
  - No-show window: 48h cancellation → full refund; <48h → 0% refund (set via ticket.sale_ends_at)
  - Check-in: host greets by name (attendee_name pre-printed on seat card from CSV export)
```

#### Fashion show (Semana de la Moda Medellín)

```
Event: Saturday 15:00, Hotel Intercontinental Salón Real, capacity 500
Tickets:
  - Press / Industry: free (hidden, promo code "PRENSA26") → 50 seats
  - General: 300 × $80k COP = $24M COP
  - Front Row: 80 × $200k COP = $16M COP
  - Backstage package: 30 × $500k COP = $15M COP (meet designer + gift bag)
Total gross: $55M COP
mdeai fee: $2.75M COP

Sponsor activations:
  - Title sponsor (brand): $15M COP → "Semana de la Moda presentada por [Brand]"
  - Fragrance brand: $5M COP → front-row section naming
  - Jewelry brand: $2M COP → backstage gift bag sponsor

Total revenue (tickets + sponsors): $77M COP
mdeai total cut: ~$5.5M COP (5% tickets + 10% sponsor facilitation)
```

---

## 5. Venue Operations System

### Staff roles + access levels

| Role | How they log in | What they can do |
|---|---|---|
| **Organizer** | Full mdeai account | Create events, manage tickets, see all dashboards, generate staff links |
| **Door staff** | 24h JWT via `/host/event/:id` → "Staff access" | Scan QR codes (PWA) only; no ticket data, no revenue |
| **Bar/floor manager** | Same 24h JWT | Scan QR + see capacity count; no revenue |
| **Admin** | mdeai admin account | Everything + dispute resolution + refund override |

Staff JWT generation (task 034, already shipped):
```
Organizer clicks "Generate staff access" in dashboard
→ POST /functions/v1/event-staff-link-generator
→ Returns: https://mdeai.co/staff/[event_id]?token=[24h_jwt]
→ Organizer sends link via WhatsApp to door staff
→ Staff opens on phone → PWA scanner auto-authenticates via URL token
→ No login required for staff; token expires at event_end + 8h
```

### Check-in PWA (task 007)

**The PWA runs fully offline** after first load. This matters in Medellín venues where WiFi drops under 400-person load.

```
PWA check-in flow (Andrés at the door):

1. Organizer WhatsApp sends: "https://mdeai.co/staff/abc123?token=eyJ…"
2. Andrés opens on phone → PWA loads, token stored in IndexedDB
3. Camera opens automatically (no permissions prompt after first use)
4. Guest shows QR (from email or WhatsApp)
5. PWA scans → validates signature locally (JWT verify, no network needed)
6. Syncs to server in background (UPDATE event_attendees SET status='checked_in')
7. Shows: ✅ green flash + guest name + ticket tier
8. If already scanned: ⚠️ yellow flash "Ya ingresó a las 22:14"
9. If refunded: ❌ red flash "Boleta cancelada"

Offline mode:
  - Validations cached locally (JWT verify works without server)
  - Sync queue drains when connectivity returns
  - Conflicts resolved: first scan wins (server timestamp authority)
```

### Capacity tracking (real-time dashboard)

```
/host/event/:id dashboard shows:

┌─────────────────────────────────────────────┐
│  CAPACITY LIVE                               │
│  ████████████████░░░░  247/300  (82%)        │
│  ↑ 12 in last 5 min                          │
│                                              │
│  GA:      198/200  ████████████████████ 99%  │
│  VIP:      40/50   ████████████████░░░░ 80%  │
│  Backstage: 9/20   █████████░░░░░░░░░░  45%  │
└─────────────────────────────────────────────┘
```

Powered by:
- `COUNT(event_attendees WHERE status='checked_in')` per tier
- Supabase Realtime channel `event:attendance:[event_id]` → dashboard updates in <500ms

### Real-time operations dashboard

```
/host/event/:id — three panels during live event:

LEFT PANEL                   MAIN PANEL                   RIGHT PANEL
──────────                   ──────────                   ───────────
Capacity gauge               Recent check-ins timeline    Revenue total
Tier breakdown               (name, tier, time, status)   Checked in / Sold
Alerts                       ↓                            No-shows so far
• "VIP almost full"          Last 20 entries              ↓
• "3 failed scans"           ↓                            Quick actions:
• "Payment issue on          Staff activity               • Export attendees
   order XYZ"                (which staff scanned what)   • Block entry
                                                          • Send alert to staff
```

### Staff notifications

When capacity hits 90%:
```
→ Supabase Realtime triggers notification to organizer dashboard
→ Organizer sends WhatsApp to door staff: "¡Quedan 30 cupos! Solo VIP disponible"
→ Door staff sees alert in PWA: banner "VIP solo"
```

---

## 6. Revenue Model

### All revenue streams from one event

| Stream | Who pays | Rate | Notes |
|---|---|---|---|
| **GA ticket sales** | Attendees | 5% platform fee | Core; Stripe Connect T+2 payout |
| **VIP ticket sales** | Attendees | 5% platform fee | Higher ASP; fewer refunds |
| **Backstage / add-on tiers** | Attendees | 5% platform fee | Premium tier; often sells out first |
| **Promo code resales** | Comps / sponsors | 0% (free tier) | Track separately |
| **Bronze sponsor** | Brand | 10% facilitation | $500k COP floor; logo + 1 mention |
| **Silver sponsor** | Brand | 10% facilitation | $2M COP; category + 3 mentions |
| **Gold sponsor** | Brand | 10% facilitation | $5M COP; broadcast + logo + dashboard |
| **Premium / title sponsor** | Brand | 10% facilitation | $15M COP+; naming rights |
| **Venue rental (external)** | Client paying venue | Not captured in Phase 1 | Phase 3: `event_venue_bookings.total_cents` |

### 300-person event revenue breakdown (realistic Medellín nightclub)

**Event details:**
- Club Mansión, capacity 300
- Saturday night, DJ + open bar option
- 4 ticket tiers

```
TICKET SALES
─────────────────────────────────────────
Tier          Qty   Price COP   Gross COP
Early bird     80   $30,000     $2,400,000
General       140   $50,000     $7,000,000
VIP (2-pack)   60   $90,000     $5,400,000
Table VIP(4)   20   $200,000    $4,000,000
TOTAL         300               $18,800,000

mdeai platform fee (5%):          $940,000
Stripe processing (~2.9% + $300): $576,000
Organizer net:               $17,284,000

SPONSOR REVENUE (3 sponsors)
─────────────────────────────────────────
Bronze sponsor × 1:   $500,000
Silver sponsor × 1:   $2,000,000
Gold sponsor × 1:     $5,000,000
TOTAL SPONSOR:        $7,500,000

mdeai facilitation fee (10%):     $750,000

TOTAL EVENT GROSS:           $26,300,000
TOTAL MDEAI REVENUE:          $1,690,000
ORGANIZER PAYOUT:            $24,610,000
```

### Revenue per tier tier (unit economics)

```
Per attendee revenue analysis:
  GA ($50k COP ticket):
    Platform fee: $2,500 COP
    Net to organizer: $47,500 COP

  VIP ($90k COP, 2-pack):
    Platform fee: $4,500 COP/person
    Net to organizer: $85,500 COP

  Table VIP ($200k COP, 4 people):
    Platform fee: $10,000 COP/person
    Net to organizer: $190,000 COP

Lesson: push buyers to higher tiers.
Each GA → VIP upgrade is worth an extra $38,000 COP to the organizer
and $2,000 COP extra to mdeai.
```

### Upsell system

| Upsell | Trigger | Implementation |
|---|---|---|
| **Tier upgrade at checkout** | GA buyer lingers on ticket selection | "🔥 Por $40k más, accede al VIP (quedan 8)" shown below GA selector |
| **Add-on at door** | Check-in staff offers upgrade | Staff PWA shows "Upgrade a VIP disponible" button → second payment link |
| **Promo code for next event** | Post-event email | "Gracias por venir. Usa MANSIONVIP20 para 20% off el próximo sábado" |
| **WhatsApp re-engage** | 7 days post-event (OpenClaw) | Broadcast to all attendees: upcoming event with early-bird price |

---

## 7. Advanced Growth

### AI chat as conversion assistant

Every event page carries the AI chat widget pre-loaded with event context:

```typescript
// Chat widget initialization on /events/:slug
const systemContext = `
  Event: ${event.name}
  Date: ${event.event_start_time}
  Venue: ${event.address}
  Tickets: ${tickets.map(t => `${t.name}: $${t.price_cents/1000}k COP (${t.qty_total - t.qty_sold} left)`).join(', ')}
  FAQ: ${event.metadata.faq || 'See website'}
`;
```

Real conversion flows the AI handles:

```
User: "Somos 6 personas, ¿qué nos conviene?"
AI:   "Para 6 personas, la mejor opción es 1 Mesa VIP ($200k, incluye 4)
       + 2 General ($50k cada uno). Total: $300k COP.
       La Mesa VIP garantiza zona privada con servicio. ¿Reservo ambas?"
       [Sí, quiero eso →] (pre-fills checkout with exact SKUs)

User: "¿Puedo entrar con el niño?"
AI:   "El evento es solo para mayores de 18 años — este es un evento
       nocturno en Club Mansión. ¿Puedo ayudarte con otra cosa?"

User: "¿Cuántas boletas quedan del VIP?"
AI:   "Quedan 8 boletas VIP. Se han vendido 42 de 50 en las últimas 6 horas."
       (real-time from qty_sold query)
```

### WhatsApp automation via OpenClaw

**Broadcast flows** (per `tasks/events/02-openclaw-growth.md` patterns):

```
T-14 days: "🎉 Ya están disponibles las boletas para [Event Name]!
            Early bird hasta el domingo. [Link]"
            → Sent to: previous attendees + subscribers (Supabase contacts list)

T-7 days:  "⏰ Quedan 47 boletas GA. Los VIP ya casi se agotan.
            [Foto del venue] 🔥 [Link]"

T-2 days:  Sponsor-watermarked leaderboard screenshot (if contest event)
            + "Tu boleta: [QR image]" to confirmed buyers

Event day: "📍 Puertas abren hoy a las 22:00. Tu QR está en el correo.
            [Venue address + Google Maps link]"

T+1 day:   "¡Gracias! ¿Cómo estuvo? → [1-tap rating link]
            Próximo evento: [Next event name] — early bird disponible: [Link]"
```

**Conversion impact:** WhatsApp messages in Medellín get **90%+ open rate** (vs 22% email). Each broadcast to 500 previous attendees generates ~50–80 new ticket sales.

### Referral loops: share → bonus → traffic

```
After ticket purchase:
  → "Comparte y gana: trae un amigo con este link y obtén $10k COP de descuento"
  → Referral link: /events/[slug]?ref=[order_id] (UTM tracked)
  → On friend purchase: INSERT promo code for referrer (task 025 redeem_promo_code)
  → Referrer gets email/WhatsApp: "Tu amigo compró. Aquí tu código: AMIGO10"

For contest-type events:
  → Share contestant's profile → get 1 free vote credit
  → Creates viral loop: contestants promote themselves, driving traffic to the event
```

### Sponsor ROI dashboards (task 052)

What sponsors see in real-time that no other platform offers:

```
Postobón Dashboard — Reina de Antioquia 2026 (Gold, Day 14):

Impressions today:    12,400  (+8% vs yesterday)
Clicks today:            520  (CTR: 4.2%)
Attributed purchases:    180  (tickets bought within 24h of sponsor click)
Cost-per-attributed:  $27,800 COP / ticket (vs $80k COP ticket price = 35% acquisition cost)

Top surface:         contest_header (CTR: 6.1%) vs leaderboard_footer (CTR: 2.3%)
Peak hour:           20:00–22:00 Bogotá time
AI insight (today):  "CTR +41% on Tuesdays. Consider doubling impression weight
                      Tue–Thu evenings. Estimated lift: +850 attributed tickets/week."
```

This is the killer feature for sponsors: **they can see ROI in units they understand** (cost per ticket sold) not vanity metrics (CPM). It's why a brand renews.

---

## 8. Database + API Mapping

### Core tables mapped to features

| Feature | Tables | Key columns |
|---|---|---|
| Event creation | `events` | `organizer_id, venue_id, status, event_start_time, currency` |
| Venue management | `event_venues` | `organizer_id, name, capacity, address, geo` |
| Ticket tiers | `event_tickets` | `event_id, price_cents, qty_total, qty_sold, qty_pending, is_hidden` |
| Purchase order | `event_orders` | `ticket_id, buyer_user_id, quantity, total_cents, status, stripe_payment_intent` |
| Individual attendees | `event_attendees` | `order_id, event_id, status (pending/active/checked_in/refunded/no_show), qr_token` |
| Promo codes | `event_promo_codes` | `event_id, code, discount_type, usage_count, max_usages, unlocks_hidden_tickets` |
| Refunds | `event_order_refunds` | `order_id, amount_cents, stripe_refund_id, status, attendee_ids` |
| Tax/IVA | `event_taxes_and_fees` | `organizer_id, type (TAX/FEE), calculation_type, rate` |
| Media assets | `event_media_assets` | `event_id, asset_type, storage_path, is_public, metadata (AI moderation score)` |
| Venue resources | `event_venue_resources` | `venue_id, resource_type, quantity_total, cost_per_event_cents` |
| Venue bookings | `event_venue_bookings` | `venue_id, event_id, starts_at, ends_at, status, EXCLUDE USING gist` |
| Sponsors | `sponsor.organizations, applications, placements, invoices, contracts` | See tasks 045–058 |
| Impressions | `sponsor.impressions, clicks, attributions, roi_daily` | Tracking + attribution |
| AI runs | `public.ai_runs` | All Gemini calls logged here (agent_name, tokens, duration, status) |

### Edge functions mapped to user actions

| User action | Edge function | Auth |
|---|---|---|
| Buy ticket | `POST /ticket-checkout` | JWT required |
| Stripe payment confirmation | `POST /ticket-payment-webhook` | Stripe-Signature header |
| Scan QR at door | `POST /ticket-validate` | Staff JWT (24h) |
| Generate staff link | `POST /event-staff-link-generator` | Organizer JWT |
| Moderate event photo | `POST /event-photo-moderate` | Organizer JWT |
| Apply as sponsor | `POST /sponsor-application-create` | Optional JWT (draft) |
| Pay for sponsorship | `POST /sponsor-checkout` | Sponsor JWT |
| Sponsor payment webhook | `POST /sponsor-payment-webhook` | Stripe-Signature |
| Sign sponsor contract | `POST /sponsor-contract-sign` | Sponsor JWT |
| Record sponsor impression | `POST /sponsor-impression` | Public (rate limited) |
| Record sponsor click | `POST /sponsor-click` | Public (rate limited) |
| AI chat on event page | `POST /ai-chat` | Optional JWT |
| AI search for events | `POST /ai-search` | Optional JWT |
| Route user intent | `POST /ai-router` | Optional JWT |

### AI functions mapped to features

| Feature | Function | Model | When called |
|---|---|---|---|
| Ticket recommendation in chat | `ai-chat` (concierge agent) | Gemini Flash | User asks "which ticket?" |
| Event search ("events this weekend") | `ai-search` | Gemini Flash | Any search query |
| Event FAQ generation | `ai-chat` (direct) | Gemini Flash | Organizer publishes event |
| Photo moderation | `event-photo-moderate` | Gemini Flash + URL Context | Asset upload |
| Sponsor asset moderation | `sponsor-moderate` | Gemini Flash + URL Context | Sponsor uploads logo |
| Sponsor creative generation | `sponsor-creative-gen` | Gemini Pro | Sponsor requests captions |
| Sponsor ROI insights | `sponsor-roi-explain` | Gemini Flash | Daily cron + on-demand |
| Campaign optimizer | `sponsor-optimize` | Gemini Pro | On-demand from dashboard |
| Chatbot event creation | `ai-chat` (event creator tools) | Gemini Flash | User: "help me create an event" |

### RPC functions (Postgres, atomic)

| Operation | RPC | Why not edge fn |
|---|---|---|
| Reserve ticket inventory | `ticket_payment_initiate_v2` | Needs `FOR UPDATE` row lock |
| Confirm payment + activate tickets | `ticket_payment_confirm_v2` | Atomic with qty_pending → qty_sold |
| Process refund | `ticket_payment_refund_v2` | Atomic order + attendees + qty |
| Compute ticket total (IVA) | `compute_ticket_total` | STABLE, called pre-checkout |
| Redeem promo code | `redeem_promo_code` | `FOR UPDATE` prevents double-redeem |
| Approve sponsor application | `approve_sponsor_application` | Creates placements atomically |
| Check resource availability | `check_resource_availability` | STABLE, called in venue wizard |
| Book venue (conflict-free) | `create_venue_booking` | EXCLUDE constraint enforced |

---

## 9. Execution Plan

### MVP (what to build first — Week 1–2)

**Goal:** One real venue can sell tickets and check in guests end-to-end.

| Day | Task | Deliverable |
|---|---|---|
| Day 1 | Task 001 ✅ (done) | Schema: events, tickets, orders, attendees, venues |
| Day 1 | Task 002 ✅ (done) | `/host/event/new` wizard (4 steps) |
| Day 2 | Task 034 ✅ (done) | Staff link generator |
| Day 2–3 | Task 004 ✅ (done) | `ticket-checkout` edge fn + Stripe session |
| Day 3 | Task 005 ✅ (done) | `ticket-payment-webhook` + QR ticket email |
| Day 3 | Task 006 ✅ (done) | `ticket-validate` edge fn |
| Day 4 | Task 003 | Host event dashboard (KPI cards + realtime) |
| Day 5 | Task 007 | PWA QR scanner (offline-capable) |
| Day 6 | Task 008 | `/me/tickets/:order_id` — buyer ticket page |
| Day 7 | Event landing page `/events/:slug` | Public purchase page with AI chat |

**MVP done-when:** Sofía creates an event, shares the link, 10 buyers purchase tickets via Stripe, 10 QR codes generated, Andrés scans all 10 at the door in <20 seconds, dashboard shows 10 checked in.

### Wave 2 — Compliance + Operations (Week 3)

**Goal:** Production-legal and operator-ready.

| Task | What | Why |
|---|---|---|
| 025 ✅ | Promo codes | Early-bird offers; comp tickets for press/sponsors |
| 026 ✅ | Refunds | Legal requirement in Colombia |
| 027 ✅ | IVA 19% taxes | Colombia fiscal compliance |
| 030 ✅ | Media assets | Photo uploads; AI-moderated event gallery |
| 033 ✅ | Photo moderation | Automatic via Gemini before public display |
| 035 | Venue picker in wizard | Sofía re-uses Hotel Intercontinental in 2 clicks |

### Wave 3 — Revenue acceleration (Week 4)

**Goal:** First sponsor live; AI chat driving ticket sales.

| Task | What | Why |
|---|---|---|
| 009 | Chatbot event creation | AI creates event draft from WhatsApp conversation |
| 045 | Sponsor schema migration | Required for any sponsor feature |
| 046 | `/sponsor/apply` wizard | Bronze sponsor self-serves in 10 min |
| 047 | Admin sponsorship queue | Admin approves first sponsor |
| 048 | Sponsor Stripe checkout | First sponsor pays |
| 049 | `<SponsoredSurface>` | Sponsor logo visible on event pages |

### Wave 4 — Venue operations (Week 5–6)

**Goal:** Venue manager has full operational tooling.

| Task | What | Effort |
|---|---|---|
| 036 | Venue resources schema | 0.5d |
| 037 | Venue staff schema | 0.5d |
| 038 | Venue availability schema | 0.5d |
| 039 | `/host/venues` management page | 1.5d |
| 040 | Venue layouts | 0.5d |
| 041 | Venue bookings (EXCLUDE constraint) | 1d |
| 042 | Venue analytics dashboard | 1d |

### What to delay (never delay for revenue)

| Feature | Why delay | Unlock condition |
|---|---|---|
| Contest / voting engine (tasks 010–024) | Requires Phase 1 tickets complete | After first event sells out |
| AI venue optimizer (task 043) | Needs 30 days of utilization data | After 10 events at same venue |
| AI layout generator (task 044) | Same data requirement | Same |
| Sponsor CPL/CPA pricing | Needs attribution working (task 051) | After tracking live |
| Multi-city expansion | Medellín first | After $50k MRR |
| Influencer co-branded campaigns | Phase 3+ | After OpenClaw fully integrated |

### Week-by-week sprint (4-week view)

```
WEEK 1: Core checkout working
  Mon–Tue: Tasks 003, 007 (dashboard + scanner)
  Wed–Thu: Task 008 (ticket page) + event landing page
  Fri:     End-to-end test: create event → buy ticket → scan at door

WEEK 2: First real event
  Mon:     Onboard one real Medellín venue (Mansión or restaurant)
  Tue–Wed: Compliance layer (tasks 025–027 promo/refunds/IVA)
  Thu:     Load test: 50 concurrent buyers on 10-ticket tier (atomic)
  Fri:     Live event: venue opens, real tickets sold

WEEK 3: Sponsors live
  Mon–Tue: Tasks 045–047 (sponsor schema + wizard + admin queue)
  Wed:     Tasks 048, 055 (Stripe + contracts schema)
  Thu–Fri: First sponsor applies, pays, logo live on event page

WEEK 4: Full venue operations
  Mon–Wed: Tasks 036–038 (venue resources, staff, availability)
  Thu:     Task 039 (venue management dashboard)
  Fri:     Task 042 (analytics dashboard) + soft-launch to 3 Medellín venues
```

### Critical path dependencies

```
001 (schema)
  ├── 002 (wizard) ──────── 035 (venue picker)
  ├── 034 (staff links) ─┬─ 006 (validate) ─── 007 (scanner PWA)
  │                      └─ 003 (dashboard)
  ├── 004 (checkout) ────── 005 (webhook) ──── 008 (ticket page)
  └── 025 (promos) ──────── 027 (taxes) ────── checkout full compliance

009 (chatbot creation) ─── requires 001–003 complete

045 (sponsor schema) ──┬── 046 (apply wizard)
                       ├── 047 (admin queue) ─── 056 (contract gen)
                       ├── 048 (Stripe) ──────── 057 (contract sign)
                       └── 055 (contract schema) ─ 058 (dispute)
```

### Revenue unlocks by week

```
Week 1: $0 (building)
Week 2: First real event → $15–50M COP gross ticket revenue → $750k–2.5M COP mdeai revenue
Week 3: First sponsor → $500k–5M COP gross → $50k–500k COP mdeai revenue
Week 4: 3 venues × 1 event/week → $45–150M COP gross → $2.25–7.5M COP mdeai/week
```

---

## Appendix: Medellín Venue Targets (First Cohort)

Priority venues for Week 2 onboarding (real, contactable, high fit):

| Venue | Type | Capacity | Event frequency | Revenue potential |
|---|---|---|---|---|
| **Club Mansión** (Laureles) | Nightclub | 400 | 2–3/week | $15–30M COP/event |
| **Hotel Intercontinental** (El Poblado) | Event space | 500–1500 | 4–8/month | $30–100M COP/event |
| **El Social** (Laureles) | Restaurant/bar | 120 | 2–4/month | $5–15M COP/event |
| **Casa Gardeliana** (Manrique) | Cultural space | 200 | 2–3/month | $8–20M COP/event |
| **Centro de Convenciones** (Centro) | Convention center | 2000+ | 6–10/month | $100M+ COP/event |

**Pitch for each:** 
> "Tu próximo evento en [Venue]: 30 minutos para publicarlo, Stripe para cobrar, QR para la entrada, dashboard para ver el dinero en tiempo real. mdeai toma 5% — Eventbrite toma 8%+ y no te da el WhatsApp de tus asistentes. Nosotros sí."

---

*Playbook version 1.0 — execute in production as of Week 2 of mdeai Events Phase 1.*
*Update after first 3 live events with real conversion data.*
