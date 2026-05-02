 

# 🔬 mdeai.co — Forensic Audit + Redesign Strategy

_Brutally honest. No fluff. Numbers where available. Fiction flagged as fiction._

---

## PART 1 — CURRENT SYSTEM AUDIT

### 1.1 Architecture

- Layers exist on paper but blur in code. Vite/React, Supabase, Edge Functions, Gadget/Shopify client are all wired. The "Agentic Trio" (OpenClaw/Hermes/Paperclip) is **documentation-only** — confirmed: [`tasks/hermes/`](https://claude.ai/epitaxy/tasks/hermes/) contains **1 file (`links.md`)**. [`tasks/paperclip/`](https://claude.ai/epitaxy/tasks/paperclip/) is **markdown only**. An unrelated full Paperclip install exists at [`/home/sk/mde/paperclip/`](https://claude.ai/home/sk/mde/paperclip/) — not integrated with the app.
- Missing: orchestration layer, workflow engine (no Lobster, no queue, no cron), CRM pipeline, payment webhook, courier/notification backbone.
- Coupling: Frontend calls Edge Functions directly. No commerce abstraction despite PRD claiming one. Shopify+Gadget SDKs installed but **no checkout path renders in any route**.

### 1.2 AI System

|Claim|Reality|
|---|---|
|6 working AI edge functions|**3 Gemini-integrated** verified: [`ai-chat`](https://claude.ai/epitaxy/supabase/functions/ai-chat/index.ts) (902 lines), [`ai-router`](https://claude.ai/epitaxy/supabase/functions/ai-router/index.ts) (387), [`rentals`](https://claude.ai/epitaxy/supabase/functions/rentals/index.ts) (783). Others exist but Gemini wiring not verified end-to-end.|
|Semantic search live|pgvector installed, `ai-search` deployed (432L), **no embeddings populated** (0 rows).|
|Multi-agent chat|One Edge Function with 4 "tabs" — not multi-agent. No agent registry, no inter-agent messaging, no persistent memory.|
|Tool-calling|Real in `ai-chat`, limited tool set.|
|Streaming|Real.|

**Verdict:** AI-_assisted_, not AI-native. There is no reasoning layer, no long-term memory, no self-improvement, no budgeting, no autonomy loop.

### 1.3 Features vs PRD

|Status|Features|
|---|---|
|✅ Working|Rentals intake wizard (Gemini 3.1 Pro, end-to-end), AI chat UI, intent router, 3-panel layout, auth, admin CRUD scaffolding, Vercel deploy, Gadget+Shopify SDK plumbing|
|⚠️ Partial|Coffee route (no products), apartment listings (no data), cart hook (no checkout path visible), pgvector extension (no embeddings)|
|❌ Not implemented|Booking flow, payment webhook, Stripe/Wompi, WhatsApp/Infobip, CRM/lead pipeline, showing scheduler, lease review, vendor portal, multi-site aggregation (Firecrawl), courier dispatch, payouts, Mercur, Lobster, Paperclip/Hermes/OpenClaw integrations, seed data (0 rows in all tables)|
|🗑 Redundant / bloat|Dual lockfiles (`bun.lockb` + `package-lock.json` + `pnpm-lock.yaml` + `pnpm-workspace.yaml` present — pick one), 34 routes where 16 are shell pages, 162 components for essentially a demo|

### 1.4 Real-World Use Case Scoring

Scores = usefulness / feasibility-as-built / business value.

|Use Case|Useful|Feasible Now|Biz Value|
|---|---|---|---|
|Furnished rental search (digital nomad)|**95**|40|**92**|
|Lead generation (capture → qualify → sell to agents)|92|55|**95**|
|Booking flow end-to-end with payment|90|25|88|
|WhatsApp concierge|90|10|85|
|CRM automation for landlords|80|20|75|
|Coffee marketplace|55|45|40|
|Contract/lease AI review|70|15|60|
|Multi-vendor marketplace (Mercur)|60|5|50|

### 1.5 Data + Backend (Supabase)

- **37 tables** (PRD says 28 — inflated), RLS on most, 9 policies actually defined. **0 rows in production tables** = no marketplace.
- Extensions (PostGIS, pgvector, pg_trgm) — good foundation but unused.
- Missing triggers: payment → booking status, listing freshness decay, idempotency enforcement on bookings.
- No materialized views for ranking, no scheduled jobs (pg_cron not wired).

### 1.6 UX / Product Flow

- Live site returns **only a tagline** to crawlers → no SSR content → disastrous SEO for a discovery product.
- 34 routes is far too many pre-PMF. Users don't know whether this is a rental site, a coffee shop, or a trip planner.
- The wizard is the one real conversion surface — but it dead-ends (no listings to return, no showing scheduler, no payment).

### 1.7 Production Readiness

|Dimension|Score /100|Reason|
|---|---|---|
|Architecture|55|Clean layering, but orchestration + workflow layers absent|
|Scalability|45|Stateless frontend OK; no job queue, no backpressure, no caching layer|
|Reliability|30|No retries, no dead-letter queues, no webhook idempotency|
|Security|40|**Admin routes not wrapped in `AdminProtectedRoute` in [`App.tsx:166-171`](https://claude.ai/epitaxy/src/App.tsx) — real auth bypass risk.** Good CORS + rate limits in edge fns.|
|Automation|10|Nothing runs on a schedule or event. Every path is user-triggered.|
|**Overall**|**36/100**|Close to the PRD's own self-score of 26/100 — PRD was honest here.|

---

## PART 2 — OPENCLAW + HERMES + PAPERCLIP RESEARCH

### OpenClaw (Execution / Skills / Channels)

- Locally-running agent framework, MCP-based. **13,729 community skills** (≈5,211 curated).
- Model-agnostic (25+ providers). Channels: web, voice, X/Bluesky/iMessage/Signal; **no native WhatsApp SDK** — needs Infobip adapter.
- Useful skills for mde: `airbnb` scraper, `apify-competitor-intelligence`, `apollo`, `agenticmail`, `agent-passport` (human consent), `askhuman`, `agent-task-manager`.
- **Gap**: No real-estate-specific skills; limited state machine formalism.

### Hermes (Reasoning / Memory)

- Nous Research self-improving agent. 47 built-in tools, MCP compatible, persistent memory via FTS5 + LLM summarization (not a vector DB — important).
- Strength: subagent spawning, autonomous skill creation.
- **Gap**: no orchestration protocol with external systems; docs thin on planning/reflection; designed as a standalone agent, not a service.

### Paperclip (Orchestration / Governance)

- 57.8k stars, v2026.416.0, MIT. Node.js + React UI + embedded Postgres (local) → external Postgres (prod). Listens on :3100.
- Primitives: **Agents, Tickets, Org Chart, Heartbeats, Budgets (monthly caps), Approval Gates, Audit Log.**
- Works with Claude, OpenClaw, Codex, Cursor.
- **Gotcha**: "If you have one agent, you don't need Paperclip." 1.1k open issues, still early. Telemetry on by default.

---

## PART 3 — GAP ANALYSIS

|Layer|Have|Ideal|Gap|
|---|---|---|---|
|Communication|Web chat only|Web + WhatsApp + Email|No Infobip, no email digests|
|Reasoning|Single-shot Gemini calls|Planning + memory + reflection|No Hermes-class agent; no long-term memory|
|Orchestration|None|Paperclip tickets + heartbeats + budgets|Zero — claims in docs, nothing running|
|Execution|Edge functions|Skills registry + scraping|No Firecrawl, no Apify, no scheduled jobs|
|Data|Schema only|Populated, embedded, ranked|0 rows, no embeddings, no ranking fn|
|Payments|Nothing wired|Stripe + Wompi + webhooks + payouts|Zero|
|Governance|Nothing|Budgets + audit + approval|Zero|

**Overengineering red flags:**

- Coffee vertical (delete or defer — dilutes focus)
- Cars, restaurants, events (schemas for verticals with no demand signal)
- Mercur/multi-vendor marketplace (Phase 3 work being designed before Phase 1 works)
- 34 routes, 162 components before first paying customer

**Wrong priorities:**

- Building Agentic Trio before first booking exists
- Shopify+Gadget+Mercur complexity before one product sells
- Planning documents (25+ files in `plan/`) instead of seeding data

---

## PART 4 — BEST SYSTEM DESIGN

### 4.1 Core (MVP) — 6-week plan that actually generates revenue

```
     ┌─────────────────────────────────────────────────────┐
     │  USER (Web, later WhatsApp)                         │
     └────────────────────┬────────────────────────────────┘
                          │
                  mdeai.co (Vite + React)
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
     Edge Fns         Supabase        Stripe Checkout
     (Gemini)         (Postgres)      (hosted, PCI-safe)
     • rentals        • apartments
     • lead-capture   • leads
     • book-create    • showings
     • pay-webhook    • payments
          │               │
          └───────┬───────┘
                  ▼
         pg_cron (every 15 min)
         - stale lead alert
         - listing freshness ping
         - host payout Friday 8am
```

**Drop for MVP:** OpenClaw, Hermes, Paperclip, Mercur, Lobster, WhatsApp, coffee, cars, restaurants, events, contract AI, voice, vision.

**Keep:** rentals wizard, lead → showing → booking → Stripe → payout. **One vertical. One loop. One revenue event.**

### 4.2 Advanced (Autonomous) — Month 6+ only after MVP proves revenue

```
  ┌─────────────────────────────────────────────────────────┐
  │  PAPERCLIP (CEO) — tickets, budgets, approval gates     │
  │  - Heartbeat every 15m                                  │
  │  - Per-agent caps: $0.50/day Hermes, $0.30 OpenClaw     │
  └──────────────┬──────────────────────────────────────────┘
                 │
     ┌───────────┼────────────┐
     ▼                        ▼
 ┌────────────────┐   ┌─────────────────────┐
 │ HERMES (Brain) │   │ OPENCLAW (Mouth+Hands) │
 │ - Ranking       │   │ - WhatsApp (Infobip)   │
 │ - Embeddings    │   │ - Web chat             │
 │ - Taste profile │   │ - Firecrawl scrapers   │
 │ - Lease review  │   │ - Airtable, Apollo     │
 │ - Memory (FTS5) │   │ - Host outreach        │
 └────────┬────────┘   └──────────┬──────────────┘
          │                       │
          └───────────┬───────────┘
                      ▼
           SUPABASE (source of truth)
           + pgvector embeddings
           + agent_messages (ACP)
           + agent_audit_log
```

---

## PART 5 — REAL WORKFLOWS

### 5.1 Rental Search (revenue-generating)

```
Sarah (WhatsApp): "2BR Laureles, $1200, 3 months, WiFi"
  → OpenClaw (intent: RENTAL_SEARCH, extracts filters)
  → Hermes ranks via composite score vs internal + scraped listings
  → Returns top 3 in WhatsApp as cards + "Schedule showing?"
  → showings row created, host notified
  → After showing: "Apply?" → application → lease review
  → Stripe Checkout (first month + deposit)
  → Webhook: payment → booking confirmed → 88/12 split queued
  → Friday 8am: Paperclip heartbeat triggers payout
💰 Revenue: 12% × first month + deposit (~$120 per booking)
```

### 5.2 Lead Capture → Sale (no booking needed)

```
User search → lead row created (structured_profile JSONB)
  → Hermes scores quality (completeness × intent × budget_realism)
  → score > 0.7 → push to buyer agent via email/WhatsApp API
  → buyer marks "contacted" via link → charge per qualified lead
💰 Revenue: $10-50 per qualified rental lead sold to agencies
```

### 5.3 Listing Aggregation → Affiliate Revenue

```
Cron: OpenClaw scraper heartbeat (Firecrawl → FincaRaiz, Airbnb)
  → Normalize to apartments schema
  → Embed with Gemini → pgvector
  → User search → return mix of native + affiliate-linked listings
  → User clicks Airbnb link → attribution cookie → commission
💰 Revenue: 3-5% affiliate on Airbnb/Booking (if affiliate program accepted)
```

### 5.4 CRM Automation for Landlords

```
Landlord signs up → Paperclip creates recurring heartbeat per property
  → Daily: check inquiries, post to WhatsApp, schedule showings
  → Weekly: listing freshness check + price suggestion from market_snapshots
  → Monthly: occupancy + earnings report
💰 Revenue: $50-200/month SaaS per landlord
```

### 5.5 Events & Experiences (affiliate only)

```
User: "What's happening this weekend?"
  → ai-search across events table + scraped Eventbrite/Vive
  → Return with affiliate tracking links
💰 Revenue: affiliate only — do NOT rebuild Eventbrite
```

---

## PART 6 — BUSINESS STRATEGY

**What actually makes money (ranked by speed to first dollar):**

|#|Model|Setup Time|First $|Recurring|
|---|---|---|---|---|
|1|**Rental commission 12%**|2 weeks|1 booking × ~$120|~$120/month per active renter|
|2|**Qualified lead sales to agents**|1 week|1 lead × $30|$300-3K/month at 10-100 leads|
|3|**Airbnb/Booking affiliate**|3 days|1 conversion × $15|depends on traffic volume|
|4|**Landlord SaaS** ($50/mo)|4 weeks|1 sub × $50|$500-5K/month at 10-100 subs|
|5|Coffee / vendor marketplace|3 months|low ARPU|low — kill it|

**Fastest path:** Affiliate links live in 72 hours. Lead sale within 2 weeks. First booking commission within 6 weeks.

---

## PART 7 — FINAL OUTPUT

### 7.1 Audit Summary

- **Working:** Rentals wizard end-to-end, AI chat UI, auth, deployments, Gadget/Shopify plumbing.
- **Broken/missing:** Zero seed data, no payment webhook, no booking creation, no CRM, no scheduled jobs, admin auth bypass risk, no SSR (SEO invisible), no agents running (Trio is documentation).
- **Biggest risks:** (1) Building Phase 2/3 before Phase 1 revenue; (2) Dual lockfiles + untested migrations; (3) Admin route bypass; (4) 37 tables + 0 rows is an inverted pyramid; (5) Shopify+Gadget+Mercur complexity pre-PMF.

### 7.2 Scores /100

||Score|
|---|---|
|Architecture|55|
|AI system (true autonomy)|20|
|Product (reality vs claims)|35|
|Business viability|70 (if focused) / 30 (if kitchen-sink)|
|**Overall**|**36/100**|

### 7.3 Top 10 Critical Fixes

1. **Fix admin auth bypass** — wrap all `/admin/*` routes in `AdminProtectedRoute` in [`App.tsx`](https://claude.ai/epitaxy/src/App.tsx).
2. **Kill scope.** Delete coffee, cars, restaurants, events from P1. Focus: furnished rentals only.
3. **Seed 30 real listings** with real photos + source URLs before anything else.
4. **Build `lead-capture` + `booking-create` + `payment-webhook` edge functions** (Stripe Checkout hosted, COP via Wompi later).
5. **Pick one package manager.** Delete 2 of 3 lockfiles ([`bun.lockb`](https://claude.ai/epitaxy/bun.lockb), [`pnpm-lock.yaml`](https://claude.ai/epitaxy/pnpm-lock.yaml), [`package-lock.json`](https://claude.ai/epitaxy/package-lock.json)).
6. **Add SSR** on key routes (or at minimum prerender homepage + listing detail) — live site currently returns tagline-only HTML.
7. **Add `pg_cron` jobs** for freshness decay, stale-lead alerts, Friday payouts.
8. **Delete or feature-flag** the Paperclip/Hermes/OpenClaw "plans" from the PRD. They are not Phase 1.
9. **Add webhook idempotency** — `idempotency_keys` table exists, wire it into payment + booking flows.
10. **Populate pgvector embeddings** on write (apartment insert trigger → `ai-embed` function).

### 7.4 Best System Architecture

See 4.1 (MVP) and 4.2 (Advanced) above. One sentence: **Supabase is the core; Stripe handles money; Gemini handles language; Paperclip/Hermes/OpenClaw bolt on only when the manual process is profitable and repeatable.**

### 7.5 MVP Plan (6 weeks, step-by-step)

- **Wk 1:** Fix admin auth. Seed 30 Laureles/El Poblado listings. Create `leads`, `showings`, `payments` tables with RLS. Delete coffee/cars/restaurants/events from nav.
- **Wk 2:** Build `lead-capture` edge fn; wire rentals wizard submission → `leads` row. Ship Airbnb/Booking affiliate links on listing cards (fastest $).
- **Wk 3:** `showing-create` edge fn + UI component. Email/WhatsApp notifications via Resend + Infobip (minimum viable).
- **Wk 4:** Stripe Checkout hosted + `payment-webhook` + `booking-create`. Host payout calculation in `payments.host_payout_status`.
- **Wk 5:** Add `pg_cron` weekly payout job. Admin moderation queue. Manual QA one full booking flow.
- **Wk 6:** Launch to 10 landlord WhatsApp contacts in El Poblado. Measure: leads captured, showings scheduled, bookings completed.

**Exit criteria:** one booking with commission recorded.

### 7.6 Advanced AI Plan (Month 4-9, only if MVP hits exit criteria)

- **M4:** Populate pgvector embeddings. Ship Hermes composite ranking as an edge function (not a separate agent yet).
- **M5:** OpenClaw skill: Firecrawl scrapers for FincaRaiz + Metrocuadrado → nightly cron → apartments table.
- **M6:** Paperclip deployed on a VPS, one agent (lead-follow-up). Budget cap $1/day. Audit log to Supabase.
- **M7:** WhatsApp channel via Infobip + OpenClaw state machine. Human handover at confidence < 0.5.
- **M8:** Lease review (Hermes + PDF extract). Bilingual EN/ES.
- **M9:** Landlord SaaS dashboard ($50/mo).

### 7.7 👉 Next 3 Priorities (only these)

1. **Admin auth fix + delete 4 verticals** (rentals only). 3 days.
2. **Seed 30 real listings + ship affiliate links on cards.** 5 days. Revenue within week 2.
3. **End-to-end rental booking with Stripe.** 3 weeks. First commission in ~6 weeks.

Everything else — Paperclip, Hermes, OpenClaw, WhatsApp, Mercur, coffee, contract AI — is a distraction until these three prove traction.

---

## 💰 Monetization Summary

|Stream|Monthly @ 100 MAU|Monthly @ 1,000 MAU|Setup|
|---|---|---|---|
|Airbnb/Booking affiliate|$150|$1.5K|3 days|
|Lead sales to agents ($30/lead)|$300|$3K|2 weeks|
|Rental commissions (12%)|$600|$6K|6 weeks|
|Landlord SaaS ($50/mo × 10%)|$500|$5K|3 months|
|**Total realistic**|**~$1.5K**|**~$15K**|—|

**Best AI monetization model:** hybrid — affiliate + lead gen fund the infra; rental commissions drive growth; landlord SaaS is the moat and margin. Agents don't generate revenue directly; they reduce ops cost on the first three streams.

---

**Bottom line:** mdeai.co is a well-designed demo with a real rentals wizard, a long PRD, and no revenue loop. Ship 30 listings, Stripe, and affiliate links in 6 weeks. Postpone the Agentic Trio by 3-6 months. Anything else is procrastination disguised as architecture.