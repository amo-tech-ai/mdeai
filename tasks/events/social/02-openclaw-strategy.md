# OpenClaw Strategy + Use Cases — mdeai Events Platform

**Doc owner:** mdeai.co founders
**Version:** 1.0 — May 3, 2026
**Status:** Draft — pending founder review
**Companion docs:** [`01-postiz-openclaw.md`](./01-postiz-openclaw.md), [`../growth-strategy.md`](../growth-strategy.md) §7, [`../100-events-prd.md`](../100-events-prd.md) §8.6

---

## What is OpenClaw (Corrected Understanding)

> **Important architectural correction from prior docs.** Earlier mdeai docs described OpenClaw as a "signed job envelope messaging gateway" — a narrow framing. The real OpenClaw is dramatically more capable, and changes how we integrate it.

OpenClaw is an **open-source, self-hosted AI agent framework** built on Anthropic's Claude (also supports Gemini). Created by PSPDFKit founder Peter Steinberger. It is the most-starred repository in GitHub history (347,000+ stars as of April 2026). It functions as a **24/7 autonomous agent running on a VPS** that:

- Connects natively to **WhatsApp, Telegram, Discord, Slack, iMessage** as input/output channels
- Has **browser automation** (form-filling, scraping, DM outreach)
- Executes **shell commands and scripts** on the host machine
- Maintains **persistent memory** across conversations via local Markdown files
- Runs **cron jobs + webhooks** for scheduled + trigger-based tasks
- Integrates with **50+ third-party services** (Notion, GitHub, Stripe, Google Calendar, etc.)
- Can **write its own skills** (autonomous capability extension without coding)
- Supports **multi-agent coordination** (parallel specialized agents sharing a backend)

**Cost:** Free and open-source. Only cost is AI API calls (Claude/Gemini) and VPS hosting (~$20/month).

### What this changes for mdeai

| Previous understanding | Corrected understanding |
|---|---|
| OpenClaw = "fire-and-forget outreach gateway" | OpenClaw = persistent 24/7 AI agent on VPS |
| Receives signed job envelopes, executes them | mdeai sends jobs AND OpenClaw reasons about them |
| Limited to WhatsApp broadcast templates | Full WhatsApp + Telegram + Discord + email + browser |
| Single workflow per job | Multi-agent coordination across simultaneous workflows |
| Needs custom code for every new capability | Self-writes new skills from natural language descriptions |

### The mental model

```
mdeai.co (intelligence + data)
    ↓ approved jobs via Supabase webhook
OpenClaw VPS (execution + memory + channels)
    ↓ messages, browser actions, scheduled tasks
WhatsApp · Telegram · Email · Browser (real world)
    ↓ user responses, clicks, conversions
mdeai.co (logged via edge functions)
```

---

## 1. OpenClaw Strategy Layer — Role in mdeai

### What OpenClaw is responsible for

OpenClaw is the **execution layer** for everything that must reach the physical world (messages, browsers, APIs with rate limits) and requires persistent state across days/weeks. mdeai handles all reasoning, data, and approval. OpenClaw executes only what mdeai tells it to execute.

| Responsibility | OpenClaw | mdeai |
|---|---|---|
| AI reasoning (what to send, to whom, why) | ❌ Never | ✅ Gemini via edge fns |
| Audience building (who to target) | ❌ Never | ✅ `marketing.campaign_audiences` |
| Content drafting | ❌ Never | ✅ `campaign-generate-plan` edge fn |
| Human approval gate | ❌ Never | ✅ `/admin/campaigns/:id/approve` |
| Message delivery (WhatsApp, Telegram, email) | ✅ | ❌ |
| Browser automation (influencer DMs, scraping) | ✅ | ❌ |
| Scheduled sends (reminders, follow-ups) | ✅ | Triggers via pg_cron webhooks |
| Persistent contact memory | ✅ | Synced to `marketing.campaign_events` |
| Rate limiting + opt-out enforcement | ✅ (enforces) | ✅ (defines limits) |
| Multi-channel coordination | ✅ | ❌ |

### Why OpenClaw is critical for growth (5 reasons)

1. **WhatsApp is the #1 trust channel in Medellín.** Camila trusts WhatsApp more than email, IG, or any app. OpenClaw makes mdeai's AI concierge available on WhatsApp — a native, real-time channel.

2. **Browser automation unlocks influencer outreach at scale.** OpenClaw can open Instagram, find a Medellín influencer's DM, type a personalized pitch, and send it — without any API (Instagram has no DM API). This is only possible via browser automation.

3. **Persistent memory makes outreach feel human.** OpenClaw remembers that Camila attended Reina de Antioquia 2025, that she prefers Saturday evening events, and that she opted out of discount messages. The next message it sends her references that history.

4. **Self-writing skills mean zero dev time for new automations.** If the community manager says "I need OpenClaw to send a WhatsApp voice note to VIP attendees the morning of the event," OpenClaw writes that skill itself. No sprint ticket needed.

5. **$20/month infrastructure for a capability that would cost $500k+ to custom-build.** The alternative to OpenClaw is a custom Twilio + n8n + CRM stack. OpenClaw replaces all of it on a single VPS.

---

## 2. Feature Set — All OpenClaw-Powered Features

### Feature 1 — WhatsApp AI Concierge (replaces Twilio for conversational flows)

**What it does:** OpenClaw runs a persistent WhatsApp agent. Users text mdeai's WhatsApp number → OpenClaw receives the message → calls mdeai's `ai-chat` edge function for reasoning → replies via WhatsApp. Every conversation is logged to `marketing.outreach_messages`.

**When it triggers:** Any incoming WhatsApp message to mdeai's business number.

**Integration:** OpenClaw webhook → mdeai `ai-chat` edge fn → Gemini reasoning → OpenClaw sends reply → `campaign-track-click` logs engagement.

**Example flow:**
> Camila: "¿Cuándo es el próximo evento en El Poblado?"
> OpenClaw → ai-chat → "Tenemos Reina de Antioquia Finals el sábado 14 de junio a las 7pm en Club Mansión. ¿Quieres tu entrada? 🎫" + ticket link
> Camila: "Sí" → OpenClaw sends checkout link → ticket purchase tracked back to WhatsApp conversation

**Daily cap:** Incoming responses: unlimited (user-initiated). Outbound proactive: 50/day/channel.

---

### Feature 2 — Event Promotion Campaign

**What it does:** Sends event invites, countdowns, and last-ticket urgency messages to segmented WhatsApp/Telegram lists built from `marketing.campaign_audiences`.

**When it triggers:** Admin approves campaign in `/admin/campaigns/:id` → Supabase webhook fires to OpenClaw VPS → OpenClaw executes scheduled sends per the approved calendar.

**Integration:** `campaign-approve` edge fn → Supabase webhook → OpenClaw processes job → sends messages → receipts logged to `marketing.campaign_events`.

**Channels:** WhatsApp broadcast templates, Telegram channel posts, email via OpenClaw-integrated SendGrid.

**Message templates (approved before send):**

```
T-14 days: "¡Se viene Reina de Antioquia 2026! 👑 
            Entradas Early Bird hasta el domingo. [link]"

T-7 days:  "Quedan 47 entradas para la gran final 🔥
            [Counter: XX entradas disponibles]
            Reserva la tuya → [link]"

T-12h:     "Tu evento es MAÑANA 🎉
            Aquí tu entrada QR para la entrada rápida 📱 [QR image]
            Puertas abren 7pm. Dirección: Club Mansión, Cl. 9 #40-20"

T-2h:      "¡Ya casi! El evento empieza en 2 horas.
            ¿Todavía vienes? → [Confirm / Can't make it]"
```

---

### Feature 3 — Influencer Outreach Automation (Browser)

**What it does:** OpenClaw uses its browser automation capability to send personalized DMs to Medellín micro-influencers on Instagram and TikTok. mdeai's `sponsor-audience-match` edge fn identifies the targets and drafts the message. OpenClaw executes the outreach.

**When it triggers:** Admin runs "Find + Pitch Influencers" action in campaign builder → Gemini scores top influencers → admin approves the message template → OpenClaw executes.

**Channels:** Instagram DM (browser), TikTok DM (browser), WhatsApp (if number is known).

**Why browser-not-API:** Instagram and TikTok have no public DM API. Browser automation is the only way to do this at scale. OpenClaw handles the browser session on the VPS.

**Example flow (Miss Elegance Colombia 2026):**
1. `sponsor-audience-match` identifies 15 Medellín influencers (10k-100k followers, beauty/fashion niche, IG engagement >3%)
2. Gemini drafts personalized pitch: "Hola @[handle], vi tu contenido de moda paisa y me encantó. Estamos organizando la gran final de Miss Elegance Colombia 2026 en Club Mansión el 14 de junio. ¿Te gustaría cubrirlo como invitada especial? Te enviamos la entrada VIP + contenido exclusivo de bastidores 🎬"
3. Admin reviews 5-message sample in `/admin/campaigns/:id/outreach`
4. Admin approves → OpenClaw opens Instagram browser session → sends each DM with 30-second random delay between sends
5. Replies captured → OpenClaw routes interested replies to admin WhatsApp

**Rate limits:** Max 20 DMs/hour per account, randomized delays, stop on any detection signal.

---

### Feature 4 — Referral + Viral Growth System

**What it does:** Every ticket buyer and voter receives a personalized referral link (`?ref=<buyer_uid>`). OpenClaw sends a follow-up message T+30min after ticket purchase: "Invita 3 amigos y sube a VIP gratis 🎟️". Tracks conversions via `marketing.referral_links`.

**When it triggers:** `event_orders` INSERT (status='paid') → Supabase webhook → OpenClaw sends referral prompt after 30-min delay.

**Channels:** WhatsApp (preferred), email (fallback).

**Conversion incentive tiers:**
- 1 referral → "Top Fan" badge on voter leaderboard
- 3 referrals → Early door access (skip queue)
- 5 referrals → Upgrade to VIP tier (if available)
- 10 referrals → Free ticket to next event

**Flow:**
```
Ticket purchased
→ 30-min delay (let excitement peak)
→ OpenClaw: "Gracias por tu entrada 🎉 Aquí tu link especial:
   [link]?ref=camila123 — si 3 amigos compran, subes a VIP gratis"
→ Friend clicks link → tracks to Camila → 3rd friend purchases
→ OpenClaw: "¡Lo lograste! 🎊 Tu entrada se actualizó a VIP.
   Muestra este mensaje en la puerta"
```

---

### Feature 5 — No-Show Recovery + Attendance Confirmation (A6)

**What it does:** T-12h before event, OpenClaw sends attendance confirmation to all ticket buyers. Buyers who don't confirm → waitlist buyers are offered their spot. Reduces no-show rate by 15-20%.

**When it triggers:** pg_cron fires T-12h before `events.start_at` → Supabase webhook → OpenClaw executes.

**Flow:**
```
T-12h: "¡Tu evento es mañana! 🎉
         Confirma tu asistencia → [Sí voy ✓] [No puedo ✗]

         Sí voy → recibe QR en este chat + parking tips
         No puedo → OpenClaw offers spot to waitlist buyer + refund initiated
```

**Waitlist flow:** No-show buyer cancels → OpenClaw instantly pings top waitlist buyer → "¡Quedó disponible tu entrada! Tienes 15 min para comprarla → [link]" → `ticket-checkout` processes.

---

### Feature 6 — AI Concierge on WhatsApp (Event FAQ + Ticket Sales)

**What it does:** OpenClaw serves as the always-on WhatsApp concierge for mdeai. Handles FAQs (dress code, parking, schedule), delivers ticket links, answers "is it sold out?", processes cancellation requests.

**When it triggers:** Incoming WhatsApp message to mdeai's business number.

**Sample conversations:**

> "¿Qué es el dress code para el evento del sábado?"
> → OpenClaw → ai-chat → "La final de Reina de Antioquia es formal/elegante 👗 Traje de noche para damas, blazer para caballeros. El código está especificado en tu entrada. ¿Algo más que quieras saber?"

> "Quiero cancelar mi entrada"
> → OpenClaw → "Claro, tu entrada sigue dentro del período de cancelación (tienes hasta mañana a las 11:59pm). ¿Confirmas la cancelación? Recibirás el reembolso en 5-10 días hábiles" → User confirms → `sponsor-cancel` edge fn → Stripe refund initiated

> "¿Hay descuento para grupos?"
> → OpenClaw → "¡Sí! Para grupos de 5+ personas hay 15% de descuento. Escríbenos el email con el que se registraron y les enviamos un código promo" → captures lead → creates promo code → `event.promo_codes` INSERT

---

### Feature 7 — Contestant Chase Automation (A7)

**What it does:** Contestants who are registered but haven't submitted required photos/bio → OpenClaw sends twice-weekly reminders with a deeplink to their submission form. Recovers 15-25% of incomplete profiles.

**When it triggers:** pg_cron twice weekly → checks `vote.contestants` WHERE `profile_complete = false` → Supabase webhook → OpenClaw sends personalized reminders.

**Messages:**
```
Day 1: "Hola [Name] 👋 Eres parte de Miss Elegance Colombia 2026 🌟
        Faltan 2 pasos para completar tu perfil:
        1. Foto principal (fondo blanco, 800x1000px)
        2. Video de presentación (30-60 seg)
        → Subir ahora: [link]"

Day 4: "¡[Name]! El plazo de inscripción cierra el domingo 🔔
        Tienes 3 días para completar tu perfil.
        Tu posición actual en el ranking preliminar: #12
        → Completar perfil: [link]"

Day 6: "Último día ⏰ [Name], el plazo cierra HOY a medianoche.
        Muchos votantes ya te están apoyando — no pierdas tu lugar.
        → Completar en 5 min: [link]"
```

---

### Feature 8 — Sponsor Activation Campaigns

**What it does:** Sponsor buys a "WhatsApp Activation" surface → Gemini generates branded message → OpenClaw sends to opted-in event attendees → attribution tracked to `sponsor.attributions`.

**When it triggers:** Sponsor activates campaign in `/sponsor/dashboard/:id` → mdeai generates content → admin approves → OpenClaw executes → sponsor sees real-time delivery report.

**Example (Postobón Gold activation):**
> "¡Postobón te da la bienvenida a la Gran Final de Miss Elegance 2026! 🥂
>  Esta noche, tu Postobón está en todos los puntos de bar del venue.
>  Muestra este mensaje y llévate una Postobón de cortesía 🎁
>  [Ver el menú completo →]"

**Attribution:** Message click → `?ref=sponsor_postobon_placement_id` → `sponsor.clicks` row → if ticket/bar order follows within 24h → `sponsor.attributions` INSERT.

---

### Feature 9 — Restaurant Promotion + Table Booking

**What it does:** Restaurants on mdeai use OpenClaw to send dining event promotions to past attendees and mdeai users who have dined there before. "Chef tasting tonight — reserve now" style campaigns.

**When it triggers:** Restaurant admin creates campaign in `/host/restaurants/:id/campaigns` → Gemini drafts → admin approves → OpenClaw sends to segmented list.

**Example (Mi Sazón tasting dinner):**
> "Esta noche en Mi Sazón 🍽️
>  Cena de Degustación Especial: Gastronomía Paisa con maridaje de vinos argentinos.
>  Solo 20 cupos — 3 mesas disponibles.
>  → Reservar ahora: [link] (10 min para completar)"

**Table booking flow:** User replies "Reservar" → OpenClaw collects party size + name → fires `restaurant-booking` edge fn → confirmation sent → restaurant notified → `restaurant_reservations` INSERT.

---

### Feature 10 — Post-Event Follow-up + Re-engagement

**What it does:** T+24h after event, OpenClaw sends personalized recap to all attendees → winner announcement, highlight reel link, and next event preview. Re-engages the audience before they forget the experience.

**When it triggers:** `events.status` flips to `completed` → Supabase webhook → OpenClaw executes T+24h job.

**Message sequence:**
```
T+24h: "¡Gracias por ser parte de la Gran Final de Miss Elegance 2026! 👑
         La ganadora: [Name] — ¡felicitaciones!
         Ver el video de la coronación → [link]
         
         ¿Quieres estar en el próximo evento? 
         → Guarda el cupo anticipado aquí: [next event link]"

T+72h (to non-openers): "[Name], te perdiste de algo increíble 🌟
                          Mira lo que pasó en la noche más elegante de Medellín → [recap link]"
```

**Re-engagement to conversion:** Attendees who click the next event preview → tracked as warm leads → sales cycle from 3 weeks → 3 days.

---

### Feature 11 — Brand Monitoring + Hashtag Tracking (Browser)

**What it does:** OpenClaw monitors Instagram, TikTok, and Twitter for event hashtags (`#MissElegancia2026`, `#ReinaDeAntioquia`, `#mdeai`). Alerts admin to high-engagement posts. Identifies UGC for reposting. Detects negative mentions for crisis response.

**When it triggers:** pg_cron every 2 hours → OpenClaw opens browser → scrapes hashtag pages → processes new posts → logs to `marketing.campaign_events` → alerts admin on Telegram if engagement spike or negative sentiment.

**Output:**
- Top 10 UGC posts by engagement → admin selects which to repost via Postiz
- Negative mentions → immediate Telegram alert to admin
- Influencer discovery → new contacts added to `campaign_audiences`

---

### Feature 12 — Multi-Agent Content Factory

**What it does:** A coordinated team of OpenClaw sub-agents that produces a complete event content package overnight: research agent scrapes competitor events + trending topics → writing agent drafts 8 social posts + 12 WA messages + 3 email templates → review agent checks Spanish-Paisa voice quality → packaging agent formats for Postiz upload.

**When it triggers:** Admin clicks "Generate Full Campaign Package" in `/admin/campaigns/new` → OpenClaw orchestrates 4 agents → results in `/admin/campaigns/:id/review` within 30 min.

**Output per event:**
- 8 Instagram captions (feed posts)
- 4 Reels scripts (30-60 sec voiceover copy)
- 12 WhatsApp broadcast templates (T-14, T-7, T-3, T-1, T-day, T+24h…)
- 3 email templates (launch, reminder, post-event)
- Hashtag recommendations (researched from current trending Medellín content)
- 3 LinkedIn posts (B2B/sponsor audience)

**Cost:** ~$0.30-0.50 Gemini API per full content package.

---

### Feature 13 — Autonomous Skill Creation

**What it does:** When the community manager needs a new automation that doesn't exist yet, they describe it in natural language to OpenClaw → OpenClaw writes the skill code, installs it, and it's available immediately.

**Example:** CM says "I need OpenClaw to send a WhatsApp voice note (not text) to VIP attendees the morning of the event with the welcome message I wrote." → OpenClaw writes a skill that:
1. Converts text to audio via Gemini TTS
2. Formats as WhatsApp voice note
3. Sends via WhatsApp API
4. Logs to `marketing.outreach_messages`

No developer involvement. Skill is ready in ~10 minutes.

---

### Feature 14 — CRM Follow-up + Lead Nurturing

**What it does:** Past attendees who haven't bought tickets in 90+ days → OpenClaw sends personalized re-engagement based on their history. References specific events they attended, contestants they voted for, restaurants they visited.

**When it triggers:** pg_cron weekly → identifies inactive users → mdeai generates personalized message → admin approves batch → OpenClaw sends.

**Example:**
> "Hola Camila 👋 Hace un tiempo no te vemos por aquí.
>  La última vez votaste por Isabella Torres en la final de agosto — quedó #2 🥈
>  Este año vuelve al concurso. Sus audiciones empiezan el 20 de junio.
>  → Ver Isabella's perfil actualizado: [link]"

**Conversion rate benchmark:** Personalized re-engagement vs generic blast = 3-5× higher click-through.

---

### Feature 15 — Real Estate + Rental Outreach (mdeai Core Extension)

**What it does:** Extends OpenClaw's reach to mdeai's original rentals vertical. Users who saved apartments or cars → OpenClaw sends availability alerts when price drops or unit becomes available.

**When it triggers:** `apartments.price_cents` UPDATE > 5% drop → Supabase webhook → OpenClaw sends to users who have this apartment saved.

**Example:**
> "¡Buenas noticias Camila! El apartamento en Laureles que guardaste bajó de $2.8M a $2.4M/mes 🏠
>  Son 3 pisos con terraza y parking incluido.
>  → Ver el apartamento: [link] | Agendar recorrido: [link]"

---

## 3. Real-World Use Cases

### Use Case A — Nightclub Event (La Octava, El Poblado)

**Campaign:** "Reggaeton Friday — DJ Luisa Nights"
**Budget:** $200k COP marketing
**Objective:** Sell 180 tickets in 5 days

**Flow:**
```
Day 1 (Monday):
  mdeai.co: Gemini generates campaign package (Feature 12)
  Admin: Reviews + approves content in /admin/campaigns/:id (15 min)
  Postiz: Schedules 3 IG posts, 2 TikTok reels for Tue-Fri
  OpenClaw: Sends WA broadcast to 1,200 past attendees (batch of 50/day cap)
  
Day 2 (Tuesday):  
  Postiz: IG post goes live (preview video + ticket link)
  OpenClaw: Influencer DMs sent to 8 Medellín lifestyle influencers via browser
  → 2 influencers reply within 4h → admin offers free VIP entry
  
Day 3 (Wednesday):
  OpenClaw: Referral follow-ups sent to Tuesday ticket buyers
  → 12 buyers share link → 28 additional tickets sold (K=2.3 on day 3)
  
Day 4 (Thursday):
  OpenClaw: "Quedan 43 entradas" urgency message to WA list
  IG Story: Auto-scheduled via Postiz (sold-out countdown)
  
Day 5 (Friday — event day):
  OpenClaw T-12h: QR delivery + "te esperamos esta noche" WA
  OpenClaw T-2h: "Puertas abren en 2h — parking recomendado: [map link]"
  Sponsor activation: "Tu primer trago cortesía de Águila 🍺 [voucher code]"
  
T+24h:
  OpenClaw: Recap + next Friday preview
  → 67 of 180 attendees open the recap
  → 31 pre-register for next week (K-factor compounds)

Result: 176 of 180 tickets sold. 31 pre-registrations for next event.
mdeai revenue: 180 × $30k COP × 5% = $270k COP from this single event.
```

---

### Use Case B — Fashion Show Influencer Campaign (Inexmoda Preview)

**Campaign:** "Colombian Fashion Week Preview — March 2027"
**Objective:** 50 micro-influencers attending + 500 tickets sold

**Flow:**
1. `sponsor-audience-match` (Gemini + googleSearch) identifies 80 Medellín fashion influencers (10k-200k followers, fashion/lifestyle niche, engagement >4%)
2. Gemini drafts 3 message variants (warm/formal/casual tones) for A/B testing
3. Admin reviews + approves all 3 variants
4. OpenClaw opens Instagram browser session → sends 20 DMs/hour with randomized delays
5. Admin receives Telegram notification for each reply (OpenClaw routes replies)
6. 18 influencers accept → OpenClaw sends them VIP ticket codes automatically
7. Post-event: OpenClaw monitors their content for #ColombiaModa2027 tags → alerts admin to the best UGC for reposting
8. Sponsor (Renault Colombia, automotive partner): "Your brand appeared in 18 influencer stories reaching 1.4M Medellín accounts" → ROI tile in `/sponsor/dashboard`

---

### Use Case C — Restaurant Tasting (Mi Sazón Chef's Table)

**Campaign:** "Cena del Chef — Gastronomía Paisa Contemporánea"
**Budget:** $0 marketing (OpenClaw does it all)
**Objective:** Fill 20-person private dining experience

**Flow:**
1. OpenClaw has memory of everyone who dined at Mi Sazón in the last 6 months (from `restaurant_reservations` table)
2. Gemini identifies the top 40 by: frequency of visits, avg spend, engagement with food content
3. OpenClaw sends personalized WA message to top 40 (20 max per session × 2 days):
   > "Hola [Name]! Sabemos que eres fan de la cocina de Mi Sazón. El próximo jueves, Chef Carolina Londoño presenta su nuevo menú de temporada. Mesa para 2 personas, 7 platos, maridaje incluido. Solo 10 mesas disponibles. → Reservar: [link]"
4. 14 of 40 click within 2 hours → 10 book immediately → dinner sold out
5. Post-dinner: OpenClaw sends personalized "¿Cómo fue tu experiencia?" survey → responses feed `ai_context` for future personalization

---

### Use Case D — Sponsor Activation (Postobón at Reina de Antioquia Finals)

**Campaign:** Postobón Gold Sponsorship ($5M COP) activation
**Objective:** Track brand exposure → measure attributed sales → prove CPL to Postobón director

**Flow:**
1. Sponsor placement goes live: `<SponsoredSurface surface="event_header" />` + WA activation message
2. OpenClaw sends "Tu Postobón tonight" message to 280 confirmed ticket holders (T-3h):
   > "La gran final de esta noche tiene algo especial 🏆 Postobón te invita a tu bebida favorita en cualquier punto de bar de Club Mansión. Muestra este mensaje → bebida gratis 🥤 Busca los stands con el logo azul."
3. 210 of 280 open the message (75% open rate — WhatsApp is native)
4. 156 redeem the bar coupon (venue tracks via QR scan at bar → `sponsor.attributions` INSERT)
5. 38 additional ticket sales attributed to Postobón's branded sharing (referral links in their social posts)
6. T+24h: `sponsor-roi-explain` generates: "Postobón activated 280 ticket holders. 156 bar redemptions (56% conversion). 38 attributed ticket sales = $1.14M COP revenue driven. CPL: $32k COP. Benchmark: $45k COP."
7. Postobón director sees this in the Sponsor Dashboard → renews at Gold tier for next event

---

## 4. Workflow Design

### Standard campaign workflow (all features)

```
Step 1 — DEFINE (mdeai, admin)
  Admin creates campaign in /admin/campaigns/new
  Fills: event_id, target_channels, audience_criteria, budget, daily_cap

Step 2 — GENERATE (mdeai, Gemini)
  campaign-generate-plan edge fn calls Gemini Flash
  Returns: PostBundleSchema JSON (captions, WA templates, schedules, hashtags)
  Also builds: audience list from campaign_audiences criteria (from profiles DB)
  Status: campaign.status = 'draft'

Step 3 — PREVIEW (mdeai, admin)
  Admin opens /admin/campaigns/:id
  Reviews: content calendar, message templates, audience sample (5 random contacts shown)
  Can edit individual messages inline
  Status: campaign_approvals row with status='pending_review'

Step 4 — APPROVE (mdeai, admin) ← MANDATORY GATE
  Admin clicks "Approve Campaign"
  campaign_approvals.status = 'approved', approver_user_id = admin.uid, approved_at = now()
  This is the ONLY trigger that allows OpenClaw to proceed
  Status: campaign.status = 'approved'

Step 5 — DELEGATE (mdeai → OpenClaw)
  Supabase webhook fires to OpenClaw VPS:
  POST https://<openclaw-vps>/webhook/mdeai-campaign
  Body: { campaign_id, approved_posts, audience_batch, schedule, daily_caps, suppression_list }
  OpenClaw stores job in its local memory + task queue
  Status: campaign.status = 'executing'

Step 6 — EXECUTE (OpenClaw)
  OpenClaw processes each channel independently:
  - WhatsApp: sends to audience_batch respecting daily_cap (50/day)
  - Instagram DM: browser session, 20 DMs/hour max, random delays
  - Telegram: sends to channel
  Each send: logged via POST to mdeai's campaign-track-click edge fn
  Status: outreach_messages rows inserted per send

Step 7 — REPORT (OpenClaw → mdeai)
  Every 6h: OpenClaw POSTs delivery stats to mdeai
  mdeai writes to campaign_metrics (opens, clicks, replies, opt-outs)
  Suppression list updates: any opt-out → marketing.suppression_lists INSERT
  Admin sees live metrics in /admin/campaigns/:id/analytics
  Status: campaign.status = 'executing' → 'completed'
```

### Safety rules (hardcoded, never bypassed)

| Rule | Enforcement |
|---|---|
| No message without `campaign_approvals.status='approved'` | OpenClaw refuses job if approval not present in webhook payload |
| Daily cap: 50 messages/channel/campaign/day | OpenClaw internal counter; hard stops at cap |
| Opt-out processing: within 5 min | Any "STOP", "No quiero", "Unsubscribe" → `suppression_lists` INSERT → no further messages |
| Rate limit: 20 DMs/hour for browser outreach | OpenClaw sleep timers between sends |
| No sends between 10pm–8am (Medellín time) | OpenClaw time-zone aware scheduler |
| Suppression list checked before every send | Cached from mdeai webhook at job start |
| Delivery failure logging | Every failed send logged; admin alerted after 5 consecutive failures |

---

## 5. System Architecture Integration

### Updated architecture (corrected from prior docs)

```
┌─────────────────────────────────────────────────────────────┐
│  mdeai.co (Vercel + Supabase)                               │
│  ┌──────────┐  ┌───────────────────────────────────────┐   │
│  │ Frontend │  │ Supabase DB                           │   │
│  │ /admin/  │  │  marketing.* · sponsor.* · event.*   │   │
│  │ campaigns│  │  campaign_approvals (the gate)        │   │
│  └──────────┘  └───────────────────────────────────────┘   │
│       │              │                                       │
│  ┌────▼──────────────▼────────────────────────────────┐    │
│  │ Edge Functions (Deno)                              │    │
│  │  campaign-generate-plan (Gemini)                   │    │
│  │  campaign-approve (state machine)                  │    │
│  │  campaign-track-click (beacon)                     │    │
│  │  openclaw-delivery-webhook (receives receipts)     │    │
│  └──────────────────────────────┬─────────────────────┘    │
└─────────────────────────────────┼───────────────────────────┘
                                  │ HTTPS webhook (signed)
                         ┌────────▼────────────────────┐
                         │  OpenClaw VPS ($20/mo)       │
                         │  ┌─────────────────────────┐ │
                         │  │ OpenClaw Agent Process  │ │
                         │  │  - Claude Opus 4.7      │ │
                         │  │  - Gemini 3 Flash       │ │
                         │  │  - Persistent memory    │ │
                         │  │  - Skill library        │ │
                         │  │  - Task queue           │ │
                         │  └─────────────────────────┘ │
                         │  ┌──────┐ ┌────────────────┐ │
                         │  │ WA   │ │ Browser        │ │
                         │  │ Tel  │ │ (Playwright)   │ │
                         │  │ Email│ │ IG/TikTok DMs  │ │
                         │  └──────┘ └────────────────┘ │
                         └─────────────────────────────────┘
                                  │
                         ┌────────▼────────────────────┐
                         │ Postiz (parallel, for        │
                         │ scheduled social posts —    │
                         │ separate from OpenClaw)     │
                         └─────────────────────────────┘
```

### OpenClaw vs Postiz — clear separation

| Capability | OpenClaw | Postiz |
|---|---|---|
| Instagram feed posts (scheduled) | ❌ | ✅ |
| Facebook page posts | ❌ | ✅ |
| TikTok (draft + schedule) | ❌ | ✅ |
| LinkedIn posts | ❌ | ✅ |
| YouTube uploads | ❌ | ✅ |
| Instagram/TikTok DMs (browser) | ✅ | ❌ |
| WhatsApp broadcast | ✅ | ❌ |
| Telegram broadcast | ✅ | ❌ |
| Email | ✅ | ❌ |
| Browser automation (scraping, forms) | ✅ | ❌ |
| Persistent memory + conversation | ✅ | ❌ |
| Skill self-writing | ✅ | ❌ |
| Multi-agent coordination | ✅ | ❌ |

### Integration with Supabase Realtime

OpenClaw subscribes to Supabase Realtime channel `campaign_approvals` for instant notification when admin approves a job. No polling required. Latency: ~200ms from approval click to OpenClaw receiving the job.

```typescript
// OpenClaw skill: supabase-realtime-listener
// Listens for approved campaigns and starts execution immediately
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
supabase.channel('campaign_approvals')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'marketing',
    table: 'campaign_approvals',
    filter: 'status=eq.approved'
  }, payload => executeApprovedCampaign(payload.new.campaign_id))
  .subscribe();
```

---

## 6. Database Additions

The `marketing.*` schema already covers most needs ([`01-postiz-openclaw.md`](./01-postiz-openclaw.md) §3). OpenClaw-specific additions:

```sql
-- OpenClaw delivery receipts (per-message delivery status)
CREATE TABLE marketing.delivery_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id      uuid NOT NULL REFERENCES marketing.outreach_messages(id),
  channel         text NOT NULL CHECK (channel IN ('whatsapp','telegram','email','instagram_dm','tiktok_dm')),
  openclaw_job_id text NOT NULL,              -- OpenClaw internal job reference
  status          text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','sent','delivered','read','failed','opted_out')),
  delivered_at    timestamptz,
  read_at         timestamptz,
  error_detail    text,                       -- null on success
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX delivery_logs_message_idx ON marketing.delivery_logs(message_id);
CREATE INDEX delivery_logs_status_idx ON marketing.delivery_logs(status)
  WHERE status IN ('pending','failed');

-- OpenClaw conversations (persistent memory for WhatsApp AI concierge)
CREATE TABLE marketing.openclaw_conversations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel         text NOT NULL,              -- 'whatsapp' | 'telegram'
  contact_hash    text NOT NULL,              -- SHA256(phone + daily_salt)
  user_id         uuid REFERENCES auth.users(id),
  openclaw_session_id text,                  -- OpenClaw internal session ref
  last_message_at timestamptz,
  message_count   int NOT NULL DEFAULT 0,
  topic_tags      text[] DEFAULT '{}',        -- ['ticketing','faq','booking']
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (channel, contact_hash)
);

-- OpenClaw skills registry (tracks custom skills written by OpenClaw)
CREATE TABLE marketing.openclaw_skills (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_name  text NOT NULL UNIQUE,
  description text NOT NULL,
  trigger     text NOT NULL,               -- 'webhook' | 'cron' | 'manual' | 'realtime'
  created_by  text NOT NULL DEFAULT 'openclaw_agent',
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

---

## 7. API / Edge Functions

### `openclaw-delivery-webhook` (NEW — receives receipts from OpenClaw)

```typescript
// POST /functions/v1/openclaw-delivery-webhook
// Called by OpenClaw VPS after each send
// Auth: HMAC-SHA256 signature (shared secret in Supabase secrets)

// Body:
// {
//   campaign_id: string,
//   job_id: string,
//   events: Array<{
//     message_id: string,
//     contact_hash: string,
//     channel: string,
//     status: 'sent' | 'delivered' | 'read' | 'failed' | 'opted_out',
//     timestamp: string,
//     error?: string
//   }>
// }

// 1. Verify HMAC signature (reject if invalid → 401)
// 2. Upsert marketing.delivery_logs for each event
// 3. For opted_out: INSERT marketing.suppression_lists
// 4. Update campaign_metrics aggregates
// 5. If failure_rate > 20%: alert admin via Supabase notification
// 6. Return { success: true, processed: N }
```

### `openclaw-send-outreach` (UPDATED)

```typescript
// POST /functions/v1/openclaw-send-outreach
// Auth: service_role only (called server-side after approval)
// Body: { campaign_id: string }

// 1. Verify campaign_approvals.status = 'approved' — GATE
// 2. Build job payload:
//    - audience: SELECT from campaign_contacts WHERE opted_out = false
//      AND NOT IN (SELECT identifier FROM suppression_lists)
//    - messages: SELECT from campaign_posts WHERE status = 'approved'
//    - schedule: from campaign_channels.schedule_config
//    - daily_cap: from campaign_channels.daily_cap (default: 50)
//    - openclaw_auth: HMAC-signed token with campaign_id + exp=24h
// 3. POST to OpenClaw VPS webhook endpoint
// 4. OpenClaw returns { job_id: string, estimated_completion: string }
// 5. UPDATE campaigns.status = 'executing', openclaw_job_id = job_id
// 6. Log to ai_runs
```

### `openclaw-build-audience` (UPDATED)

```typescript
// POST /functions/v1/openclaw-build-audience
// Auth: service_role only (called from campaign builder)
// Body: { campaign_id: string, filters: AudienceCriteria }

// AudienceCriteria:
// {
//   min_past_events?: number,       // attended ≥ N events
//   event_categories?: string[],    // ['pageant', 'dining', 'festival']
//   last_active_days?: number,      // active within N days
//   city?: string,                  // 'Medellín'
//   age_range?: [number, number],   // [18, 45]
//   ticket_tier?: string[],         // ['VIP', 'General']
//   voted_in_contest?: string,      // contest slug
//   suppress_recent_days?: number   // skip contacts messaged in last N days
// }

// 1. BUILD audience from profiles + event_attendees + event_orders:
//    SELECT DISTINCT p.phone, p.email, p.id
//    FROM profiles p
//    JOIN event_attendees ea ON ea.user_id = p.id
//    JOIN event_orders eo ON eo.buyer_user_id = p.id
//    WHERE [filters applied]
//    AND p.phone NOT IN (SELECT identifier FROM suppression_lists WHERE platform='whatsapp')
//    LIMIT 500  -- hard cap per campaign

// 2. INSERT marketing.campaign_audiences row
// 3. INSERT marketing.campaign_contacts (one per contact)
// 4. Return { audience_id, total_contacts, estimated_reach }
```

---

## 8. Safety + Compliance

### The 8 non-negotiable safety rules

| Rule | Enforcement mechanism | Penalty for violation |
|---|---|---|
| **No send without approval** | `campaign_approvals.status` check in `openclaw-send-outreach`; OpenClaw verifies HMAC token contains approval flag | Edge fn returns 403 |
| **Daily cap: 50/channel/campaign/day** | OpenClaw internal counter; Supabase `delivery_logs` count check at job start | OpenClaw queues remaining sends for next day |
| **No-send hours: 10pm–8am Medellín (UTC-5)** | OpenClaw time-zone scheduler; jobs scheduled during quiet hours queued for 8am | Silent queuing, no error |
| **Opt-out within 5 min** | OpenClaw listens for "STOP", "No", "Cancelar", "Unsubscribe" → POSTs to `openclaw-delivery-webhook` → `suppression_lists` INSERT | Contact never messaged again |
| **Suppression list refresh before every batch** | `openclaw-send-outreach` provides fresh suppression list in job payload; OpenClaw re-fetches if job runs >12h after payload | Hard stop if fetch fails |
| **Consent required (Habeas Data Ley 1581/2012)** | Only users who explicitly opted in during `ticket-checkout` or signup receive marketing messages; `profiles.marketing_consent = true` required | Contact filtered out at audience build |
| **PII protection** | Phone/email transmitted as SHA256 hash to OpenClaw; OpenClaw never stores plaintext PII beyond the current session | OpenClaw's local memory stores only hashed identifiers |
| **No auto-send of financial offers** | Discount codes, refunds, promo upgrades require `campaign_approvals.approval_type = 'financial'` (separate approval tier) | Edge fn returns 403 without financial approval |

### Compliance mapping

| Regulation | Requirement | mdeai + OpenClaw implementation |
|---|---|---|
| Colombia Ley 1581/2012 (Habeas Data) | Explicit consent; deletion within 30 days | `profiles.marketing_consent` flag; deletion flows at `/account/data` |
| WhatsApp Business Policy | Only approved template messages for broadcast | OpenClaw sends only pre-approved templates from `campaign_posts`; no free-form bulk |
| WhatsApp terms (anti-spam) | No unsolicited messages | Consent required; suppression list enforced; opt-out immediate |
| Instagram ToS (browser automation) | No automated DM spam | Max 20 DMs/hour; randomized delays; stops on detection signal; DM only to accounts that follow mdeai's IG |
| GDPR (EU visitors) | Same as Habeas Data + right to erasure | Same flows; 30-day deletion SLA |

---

## 9. PRD Integration (§8.6 addition + corrections)

The following corrects and extends `100-events-prd.md` §8.6.8 Integration updates:

**Corrected OpenClaw integration entry:**

| System | Phase | Integration | What it does | Auth |
|---|---|---|---|---|
| **OpenClaw VPS** | 2 | Self-hosted AI agent (Claude/Gemini-powered) running on $20/mo VPS. Receives approved campaign jobs via Supabase webhook + Realtime. Executes: WhatsApp/Telegram broadcast, Instagram/TikTok DM via browser, email, scheduled reminders, AI concierge on WhatsApp, multi-agent content pipeline. Returns delivery receipts to `openclaw-delivery-webhook`. | HMAC-SHA256 signed webhook payloads; Supabase Realtime subscription |

**Feature additions to §8.6.2 (edge functions):**

| Edge function | NEW | Description |
|---|---|---|
| `openclaw-delivery-webhook` | ✅ NEW | Receives per-message delivery status from OpenClaw VPS; upserts `delivery_logs`; processes opt-outs into suppression list |
| `openclaw-build-audience` | 🔄 UPDATED | Now includes `profiles.marketing_consent` filter; returns contact hash list not plaintext |
| `openclaw-send-outreach` | 🔄 UPDATED | Now validates HMAC-signed token; provides suppression list in payload; opens Supabase Realtime channel for real-time job status |

---

## 10. Roadmap Integration

### Phase 1 (current — Events MVP)

**OpenClaw role: NONE.** Ticket confirmation and QR delivery use Infobip (transactional WhatsApp templates). No OpenClaw setup required.

**Exception:** If founder wants WhatsApp AI concierge for event FAQ during Phase 1, OpenClaw can be set up in 1 day on a $20/mo Hetzner VPS. Risk: low. Reward: immediate WhatsApp presence without Twilio cost.

**Recommendation:** Deploy OpenClaw for WhatsApp AI concierge in Phase 1 (1 day of setup) because the WhatsApp number needs warm-up time before Phase 2 broadcast volume. Starting early is better.

### Phase 2 (Q3 2026 — Sponsorship + Marketing)

**OpenClaw role: CORE.** All 15 features above become available.

Priority order within Phase 2:
1. **Week 1:** OpenClaw VPS setup + WhatsApp connection + `openclaw-send-outreach` edge fn
2. **Week 2:** Event promotion campaign (Feature 2) — first broadcast to past attendees
3. **Week 3:** Referral system (Feature 4) + no-show recovery (Feature 5)
4. **Week 4:** Influencer outreach via browser (Feature 3) — highest-effort, biggest reach unlock
5. **Week 5-6:** Contestant chase A7 (Feature 7) + sponsor activation (Feature 8)

### Phase 3 (Q4 2026 — Venue Ops + Restaurant)

**OpenClaw role: EXPANSION.**
- Restaurant promotion + table booking (Feature 9)
- Brand monitoring via browser (Feature 11)
- CRM re-engagement (Feature 14)
- Real estate outreach (Feature 15)

### Phase 4 (Q1 2027 — AI Orchestration)

**OpenClaw role: ORCHESTRATION LAYER.**
- Multi-agent content factory (Feature 12) running overnight for all active events
- Autonomous skill creation (Feature 13) deployed to community manager with no-code interface
- Hermes + Paperclip → OpenClaw bridge for budget governance + audit trail on every automation
- Bogotá expansion: OpenClaw connects to Bogotá WhatsApp Communities; same codebase, new audience

---

## 11. Execution Plan

### Build order (exact sequence)

**Phase 1 fast-follow (1-2 days, optional but recommended):**
```
Day 1:
  - Provision OpenClaw VPS (Hetzner CX21, $20/mo, Frankfurt or São Paulo)
  - Install OpenClaw, configure Claude Opus 4.7 API key
  - Connect WhatsApp Business number
  - Write mdeai system prompt (Spanish-Paisa voice, event context)
  - Test: send "¿Cuál es el próximo evento?" → AI responds
  
Day 2:
  - Install Supabase Realtime skill in OpenClaw
  - Connect to mdeai DB (read-only anon key)
  - Test: ask "¿Cuántas entradas quedan para X?" → OpenClaw queries Supabase, responds accurately
  - Deploy `openclaw-delivery-webhook` edge fn (logs to marketing.openclaw_conversations)
```

**Phase 2 core (Week 1):**
```
- Deploy marketing.* schema migration (task 059)
- openclaw-build-audience edge fn (audience building from profiles DB)
- openclaw-send-outreach edge fn (job dispatch with approval gate)
- openclaw-delivery-webhook edge fn (receipt logging)
- Admin UI: /admin/campaigns view with OpenClaw job status panel
```

**Phase 2 features (Weeks 2-6, sequenced):**
```
Week 2: Event promotion campaigns (Feature 2) + referral system (Feature 4)
Week 3: No-show recovery A6 (Feature 5) + contestant chase A7 (Feature 7)
Week 4: Influencer outreach via browser (Feature 3)
Week 5: Sponsor activation campaigns (Feature 8)
Week 6: Brand monitoring hashtag tracker (Feature 11)
```

**What to delay:**
- Restaurant promotion (Phase 3 — restaurant_reservations schema not yet built)
- CRM re-engagement (Phase 3 — needs 90+ days of attendee data to be meaningful)
- Multi-agent content factory (Phase 3 — OpenClaw skills need to be battle-tested first)
- Autonomous skill creation for CM (Phase 4 — requires CM to understand the system first)
- Real estate outreach (Phase 4 — OpenClaw must prove itself in events vertical first)

### Infrastructure

| Component | Option | Cost | Why |
|---|---|---|---|
| VPS | Hetzner CX21 (2 vCPU, 4GB RAM, Frankfurt) | $6/mo | Closest to Colombia; low latency on HTTPS webhooks |
| VPS alt | Contabo VPS S (4 vCPU, 8GB RAM) | $8/mo | More RAM for browser automation |
| Claude API | Opus 4.7 for reasoning; Flash for content gen | ~$20-50/mo at Phase 2 volume | Required for OpenClaw intelligence |
| Backup | Hetzner snapshot daily | $1/mo | Full state backup |
| **Total infra** | | **~$30-60/mo** | |

### Success metrics (Phase 2 gates)

| Metric | Target | Measurement |
|---|---|---|
| WhatsApp open rate | ≥ 65% | `delivery_logs` status='read' / status='delivered' |
| Campaign attribution rate | ≥ 15% of tickets traceable to OpenClaw campaign | `campaign_conversions` / `event_orders` |
| Opt-out rate | < 2% per campaign | `suppression_lists` inserts / audience size |
| No-show rate reduction | ≥ 15% vs baseline | Baseline: no A6; target: with A6 |
| Influencer outreach reply rate | ≥ 20% | `delivery_logs` status='replied' / sent |
| Zero WhatsApp bans | 0 account suspensions | Manual monitoring + OpenClaw detection alerts |

---

## See also

- [`01-postiz-openclaw.md`](./01-postiz-openclaw.md) — original architecture (campaign schema + Postiz)
- [`../growth-strategy.md`](../growth-strategy.md) §7 — OpenClaw positioning vs Postiz
- [`../100-events-prd.md`](../100-events-prd.md) §8.6 — Marketing + Growth System PRD section
- [`../101-roadmap.md`](../101-roadmap.md) — roadmap with OpenClaw phase integration
- [OpenClaw official showcase](https://openclaw.ai/showcase) — community implementations
- [GitHub awesome-openclaw-usecases](https://github.com/hesamsheikh/awesome-openclaw-usecases) — 40+ curated use cases

Sources:
- [What is OpenClaw? — DigitalOcean](https://www.digitalocean.com/resources/articles/what-is-openclaw)
- [OpenClaw Business Use Cases — Contabo](https://contabo.com/blog/openclaw-use-cases-for-business-in-2026/)
- [15 OpenClaw Use Cases — Kanerika](https://kanerika.com/blogs/openclaw-usecases/)
- [OpenClaw Showcase](https://openclaw.ai/showcase)
- [awesome-openclaw-usecases — GitHub](https://github.com/hesamsheikh/awesome-openclaw-usecases)
