# Product Requirements Document — mdeai Events + Contests + Sponsorship Platform

**Doc owner:** mdeai.co founders
**Version:** 1.1 — May 3, 2026 (events-first amendment)
**Status:** Approved — Phase 1 = events MVP per §0 amendment
**Authoritative sources:** [`00-overview.md`](./00-overview.md), [`01-contests.md`](./01-contests.md), [`02-openclaw-growth.md`](./02-openclaw-growth.md), [`03-sponsorship-system.md`](./03-sponsorship-system.md), [`05-unified-platform.md`](./05-unified-platform.md), [`06-trio-integration.md`](./06-trio-integration.md), [`07-ai-event-research.md`](./07-ai-event-research.md), [`08-plan-audit-response.md`](./08-plan-audit-response.md), [`15-user-stories.md`](./15-user-stories.md), [`index-events.md`](./index-events.md)

> **Discovery note (per PRD skill):** This PRD synthesizes 9 prior implementation plans. The §0 amendment supersedes earlier Phase 1 contest-engine framing.

---

## 0. May 3, 2026 amendment — Phase 1 is **Events + Tickets MVP** (locked)

**Decision (per [`index-events.md`](./index-events.md) §6.2):** Option B — Events-first MVP. Locked May 2, 2026.

**What changed.** Earlier drafts of this PRD framed Phase 1 as the Contest Engine (vote.* schema, hybrid scoring, Trust page, fraud defense). External review + founder reset on May 2 surfaced that Phase 1 was overbuilt: 5+ weeks of work for $0 platform revenue, while a 44-table production Supabase including events/bookings/payments primitives sat unused.

**Phase 1 is now narrowed to 9 deliverables across 4 surfaces:**

| Surface | Phase 1 deliverable | Task |
|---|---|---|
| **Schema** | `events` ALTER + new `event_tickets`, `event_orders`, `event_attendees` tables | [`prompts/001`](./prompts/001-event-schema-migration.md) |
| **Wizard** | `/host/event/new` 4-step wizard (Basics → Tickets → Review → Publish) | [`prompts/002`](./prompts/002-host-event-new-wizard.md) |
| **Dashboard** | `/host/event/:id` organizer dashboard (KPIs + attendees + Realtime + staff link) | [`prompts/003`](./prompts/003-host-event-dashboard.md) |
| **Edge functions** | `ticket-checkout` (Stripe + atomic qty guard) + `ticket-payment-webhook` (mint QR JWT + email PDF) + `ticket-validate` (single-use door scan) | [`prompts/004-006`](./prompts/) |
| **PWA scanner** | `/staff/check-in/:event` offline-first PWA | [`prompts/007`](./prompts/007-staff-checkin-pwa.md) |
| **Buyer pages** | `/me/tickets` + EventDetail extension (internal `ticket-checkout` instead of external `ticket_url`) | [`prompts/008`](./prompts/008-me-tickets-page.md) |
| **Chatbot creation** | Extend existing `ai-chat` edge fn with 3 new tools so organizers create events conversationally; preview card hands off to wizard | [`prompts/009`](./prompts/009-chatbot-event-creation.md) |

**Phase 1 explicitly excludes** (deferred to Phase 2+):

- ❌ Voting / contests / hybrid scoring (was P1 — moves to **Phase 2**)
- ❌ AI fraud detection (Gemini L5 anomaly) — Phase 2
- ❌ Trust page + Colombian counsel sign-off — Phase 2 (no voting in P1 = no lottery question)
- ❌ Sponsor system (sponsor.* schema + ROI dashboard) — Phase 2/3
- ❌ Identity verification flow — Phase 2 (ships with contest contestant onboarding)
- ❌ Promo codes / taxes / VAT / refunds-via-UI — Phase 2/3 (HE-2 audit additions)
- ❌ OpenClaw broadcasts / WhatsApp automation — Phase 3
- ❌ Hermes + Paperclip orchestration — Phase 4
- ❌ Multi-venue / restaurant week / festival mode — Phase 2/3

**Phase 1 net.** ~16-17 dev-days = **3.5 weeks at 1 dev**. First profitable phase: ~$3k revenue from one mid-size event vs $0 in earlier P1. Reuses existing Supabase events tables, `EventBookingWizardPremium` (already imported in `EventDetail.tsx`), `useEvents` hook, `ai-chat` edge function with 7-agent intent router.

**Phase order (locked):**

| Phase | Theme | Weeks | Deliverable |
|---|---|---|---|
| **1 (current)** | Events + Tickets MVP | 3.5 | First ticket revenue |
| **2** | Contest engine | 4 | Voting, hybrid scoring, fraud defense, Trust page |
| **3** | Sponsorship + growth | 4 | sponsor.* + ROI dashboard + OpenClaw outreach |
| **4** | AI orchestration | 6 | Hermes + Paperclip + trio runtime |

The 8 `TBD` items in §6 (founder Open Questions) **continue to apply** to Phase 2 contest scope. None of them block Phase 1 events MVP. The Q3 founder decision (Miss Elegance Colombia 2026 as flagship contest) becomes the Phase 2 contest anchor; Phase 1 ships the **finals-night ticket sales** for that same event.

> **The rest of this PRD remains as-written for context and Phase 2-4 reference.** Read §0 as the binding amendment for Phase 1 scope.

---

## 1. Executive Summary

### 1.1 Problem statement

Local event organizers in Medellín — pageant producers, restaurant-week hosts, festival promoters, nightclub bookers — currently stitch together 5–8 disconnected SaaS tools (Eventbrite for tickets, Typeform for contestant signup, Google Forms for sponsor sales, Mailchimp for outreach, Excel for vote tallies, WhatsApp manually for community broadcasts, Canva for sponsor mockups, Stripe for payments). Each tool is in English, none integrate, none speak Spanish-Paisa naturally, and none surface ROI to sponsors in real time. Voting credibility is the deepest pain — every Latin pageant of consequence has been tainted by a buy-votes scandal in the last 5 years.

### 1.2 Proposed solution

An **English-first platform with Spanish-Paisa (es-CO) localization, focused on Medellín** on **mdeai.co** that bundles **events** (tickets, venues, schedules), **contests** (voting with hybrid scoring), and **sponsorships** (self-serve tiers + ROI dashboard) on top of the existing Vite/React + Supabase stack. UI strings, admin tooling, and primary docs are English-first to match the existing app and the founder's working language; Spanish-Paisa is the localized layer for Medellín-facing voter pages, sponsor outreach to Colombian brands, and Trust-page copy where Spanish is the trust-building register. AI (Gemini) generates content in **English first, then Spanish-Paisa** (in that order); OpenClaw delivers WhatsApp broadcasts; Stripe Connect handles organizer payouts; trust is enforced via a public Trust page, hybrid scoring, phone OTP, and 5-layer fraud defense. The platform's defensibility is the bundle: **events host contests host sponsors**, with one schema and one ROI dashboard.

> **Phase 1 flagship contest (locked, May 2026):** [**Miss Elegance Colombia 2026**](https://misseleganceco.com/) — *Certamen Nacional de Elegancia, Liderazgo y Autenticidad*. Free voting (no charges to voters). Although the contest is national in branding, mdeai's amplification, sponsor sales, and WhatsApp Community outreach focus on Medellín. Phase 0 prerequisite: signed partnership with Miss Elegance Colombia organizers (covering scoring formula, contestant onboarding flow, prize disclosure compliance, and finals-night logistics). See §6 Q3 for full decision rationale.

### 1.3 Success criteria (KPIs)

The platform is "successful" when these five metrics are hit by end of Q3 2026 (4 phases, ~17 weeks of build):

| KPI | Target | Why it matters |
|---|---|---|
| **Live contests with paid sponsors** | ≥ 5 concurrent | Proves repeatability — 1 contest is luck, 5 is a product |
| **Cumulative platform revenue** | ≥ $50k USD | Revenue proves willingness-to-pay; Phase 1 break-even is one Bronze sponsor |
| **Confirmed-fraud rate (post-audit)** | < 0.5% of total votes | Trust narrative survives scrutiny |
| **Sponsor NPS** | ≥ 40 | Sponsors who would re-buy = renewable revenue |
| **K-factor on Vote→Share loop** | > 1.0 (sustained 7-day) | Each voter brings ≥1 new voter = product is viral on its own |

> **Phase 1 KPI note:** First contest is a **free beauty pageant** (per §6 Q3 founder decision), so the "≥1 paid voter vote settled in Stripe" gate from earlier drafts is removed for Phase 1. Phase 1 monetary revenue is zero; the revenue path is sponsor sales **against the live Phase 1 contest** during Phase 2. Stripe paid-voter-vote flow moves to Phase 2.

### 1.4 Non-goals (what we're NOT building)

- ❌ A new backend or framework (we use existing Vite/React + Supabase)
- ❌ Native mobile apps (PWA only until Phase 4+)
- ❌ White-label SaaS for other countries (Medellín → Colombia → LatAm sequence; not a US play)
- ❌ A general-purpose AI agent platform (the trio in Phase 4 is for our use, not a product)
- ❌ A Webflow rebuild of the marketing site
- ❌ Crypto / NFT / on-chain voting (regulatory + UX cost > value)
- ❌ Voice / video AI judges (Phase 4+ as optional add-on, not core)
- ❌ Replacing existing mdeai.co rentals/restaurants/explore product (this initiative complements, doesn't replace)

---

## 2. User Experience & Functionality

### 2.1 Personas

#### **Persona A — Camila (the voter)**
> 24-year-old paisa, lives in Laureles, follows beauty + foodie content on TikTok and IG. Speaks Spanish, intermediate English. Owns an Android, never installs apps if she doesn't have to. Pays with PSE/Nequi (mobile wallet) and credit card. Trusts WhatsApp deeply.

**Goals:** find local events worth her time; back her favorite contestant; share with friends; not get scammed.

**Pain today:** "Mi prima me mandó un link de votación, no sabía si era real."

#### **Persona B — Daniela (the organizer / pageant producer)**
> 38-year-old, runs a small events company that produces Reina de Antioquia + 2 other contests/year. Has a bookkeeper, a part-time community manager, and one contractor designer. Uses Google Sheets, Eventbrite, and 6 separate WhatsApp Communities. Spends ~8 hrs/week chasing contestants for missing photos.

**Goals:** more revenue per event; less manual work; sponsors who renew next year.

**Pain today:** "Cada año empiezo de cero con los patrocinadores."

#### **Persona C — Andrés (the sponsor / brand manager)**
> 34-year-old at Postobón's regional brand team. Has $150k/yr local-marketing budget. Used to print banners and TV; experimenting with digital but skeptical because "todos prometen alcance, nadie muestra ventas."

**Goals:** demonstrate trackable engagement to his director; find activations that fit Postobón's brand; not be embarrassed by association with controversy.

**Pain today:** "Pago $20M por banners en un evento y no sé si alguien los vió."

#### **Persona D — Laura (the contestant / restaurant)**
> Either a 22-year-old beauty contestant submitting for Reina, or a 45-year-old restaurant owner submitting for "Best Bandeja Paisa". Wants exposure. Will share on her socials if the platform makes it easy.

**Goals:** complete profile fast; share confidently; track her ranking; win.

**Pain today:** "Me pidieron 5 fotos, una bio, redes sociales, consentimiento — todo por WhatsApp suelto. Olvidé la mitad."

#### **Persona E — Juan (the judge)**
> 50-year-old industry expert (chef, designer, journalist) invited to judge. Has 20 minutes between meetings to score 30 contestants. Doesn't want to install anything.

**Goals:** score quickly; not feel responsible for fraud accusations; have his judgments respected.

**Pain today:** "El año pasado me dieron una hoja de Excel; me dolió la mano de tanto rellenar."

#### **Persona F — mdeai operator (us)**
> Solo founder/dev for Phase 1. 1 community manager joins Phase 2. Speaks English, writes Spanish.

**Goals:** ship Phase 1 in 3 weeks without burning out; phase 2 generates real revenue.

---

### 2.2 User stories with acceptance criteria

#### **Epic E1 — Camila votes confidently**

**Story E1.1.** *As Camila, I want to vote for a contestant in 1 tap so that I can support my prima without friction.*

Acceptance:
- ✅ `/vote/:slug` page loads in < 1.5s on a 3G connection.
- ✅ Vote button is visible above the fold on a 360px-wide screen.
- ✅ Casting a vote requires only phone OTP (one-time per device); subsequent votes that day need only the Vote tap.
- ✅ Daily quota is enforced server-side: 1 free vote per day per (phone hash + IP cluster).
- ✅ Real-time leaderboard updates within 2s of my vote landing in `vote.entity_tally`.

**Story E1.2.** *As Camila, I want to see how voting works so that I trust the result.*

Acceptance:
- ✅ Footer link "¿Cómo funciona la votación?" goes to `/vote/:slug/how-it-works` (Trust page).
- ✅ Trust page explains hybrid scoring (50% public + 30% judges + 20% engagement) in plain Spanish-Paisa.
- ✅ Page lists fraud defenses (phone OTP, IP rate limit, fingerprint, anomaly detection).
- ✅ Page shows current scoring formula for THIS contest (organizer can adjust per-contest, transparency required).

**Story E1.3.** *As Camila, I want to share my vote so my friends can vote too.*

Acceptance:
- ✅ After casting a vote, a share modal appears with "Comparte tu voto, gana 3 votos extra mañana".
- ✅ Share generates a tracked link `mdeai.co/vote/<slug>?ref=<token>`.
- ✅ When a friend votes via that link, I see "+3 votos" credited to my next-day quota in real time.
- ✅ Modal supports IG Stories sticker, WhatsApp, Twitter/X, copy link.

**Real-world example.**
> Camila opens a TikTok bio link to `mdeai.co/vote/reina-antioquia-2026`. Page loads in 1.2s. She sees Laura's photo, taps "Votar". A modal asks for her phone — she enters `+57 300 555 0123`. OTP arrives via SMS in 8 seconds. She enters the code; vote registers; leaderboard ticks Laura from #4 to #3 in real time. Share modal opens; she taps "WhatsApp", picks her group "Las Primas", and sends. 4 cousins vote within 24h via her `?ref=` link. Her next-day quota now shows "1 voto + 12 votos extra ganados".

---

#### **Epic E2 — Daniela runs an event end-to-end**

**Story E2.1.** *As Daniela, I want to create an event with embedded contests in 30 minutes so I can launch on Tuesday morning.*

Acceptance:
- ✅ `/host/event/new` 6-step wizard (basics → venue → tickets → schedule → contests → sponsors).
- ✅ Each step persists draft on blur — never lose work on browser refresh.
- ✅ Wizard preloads logistics checklist from the [`event-planner`](../../.claude/skills/event-planner/SKILL.md) skill (12mo / 9mo / 6mo / day-of timelines).
- ✅ On publish, a brief PDF auto-generates via Gemini using the [`event-briefs`](../../.claude/skills/event-briefs/SKILL.md) skill (overview / narrative / experience / promotion / operations / measurement).
- ✅ Total time-to-publish for a 1-contest event with 3 ticket tiers ≤ 30 min (measured from a 5-buyer test cohort).

**Story E2.2.** *As Daniela, I want to invite judges via magic link so I don't have to onboard them through customer support.*

Acceptance:
- ✅ Add judges by email or WA E.164 number; system sends a passwordless magic link.
- ✅ Judge lands on `/judge/:contest_slug` and immediately sees scoring rubric (criteria + weights).
- ✅ Judge can score 30 contestants in ≤ 20 minutes (measured with stopwatch in dogfood).
- ✅ Judges' scores are private until contest closes; no judge can see other judges' scores until reveal.

**Story E2.3.** *As Daniela, I want sponsors to self-serve so I'm not playing email-tag for 2 weeks.*

Acceptance:
- ✅ I share `mdeai.co/sponsor/apply?contest=:slug` to potential sponsors.
- ✅ Sponsor completes 4-step wizard, pays, uploads assets, and lands in my admin queue within 15 min of starting.
- ✅ I review + approve in `/admin/sponsorships` in < 5 min/application.
- ✅ At `start_at`, sponsor's logo flips live on configured surfaces automatically; I get a Slack/Email confirmation.

**Real-world example.**
> Daniela opens `/host/event/new` Monday at 9am. By 9:25, "Reina de Antioquia 2026" is published with 4 contests (Reina, Best Silletero, Best Float, Best Caballero), 3 ticket tiers (GA $40 × 1000, VIP $120 × 200, Backstage $400 × 30), and a draft sponsor pricing card. She sends Postobón a WhatsApp with the `sponsor/apply` link. By Wednesday lunch, Postobón has paid $25k Premium tier and her ROI dashboard shows projected 1.2M impressions + 18k clicks. She's already saved 6 hours vs last year.

---

#### **Epic E3 — Andrés sponsors with confidence**

**Story E3.1.** *As Andrés, I want guaranteed-value packages first so I can prove this to my director.*

Acceptance:
- ✅ Default pricing tiers (Bronze $500 / Silver $2k / Gold $5k / Premium $25k) display **fixed deliverables** ("5,000 guaranteed impressions + 50 leads + 1 influencer post"), not CPL claims.
- ✅ CPL/CPA pricing options are visible but flagged "available after 30 days of dashboard data".
- ✅ Each tier shows a sample ROI summary from a comparable past sponsor (with permission).

**Story E3.2.** *As Andrés, I want a real-time ROI dashboard so my director can poke around without me.*

Acceptance:
- ✅ `/sponsor/dashboard/:application_id` is shareable via per-org JWT (no signup required for read-only viewers).
- ✅ Tiles tick within 2s of new impression/click/attribution.
- ✅ Daily Gemini-generated insight: "CTR rose 41% on Tuesday because the contest hit a viral moment in Laureles."
- ✅ Export buttons: PDF (one-pager for the director), CSV (raw data for analyst).
- ✅ Brand-safety auto-pause if controversy detected (synthetic fraud spike or judge-resignation event).

**Story E3.3.** *As Andrés, I want creative co-pilots so I'm not paying my agency for every tweak.*

Acceptance:
- ✅ "Generate creative" button (Gemini Pro) produces 3 caption variants in **en + es-CO** (English first, then Spanish-Paisa), plus 1 IG Story sticker concept.
- ✅ Anti-hallucination: AI rejects any output containing URLs the model invented (regex `https?://` validation).
- ✅ Manual approve-before-publish required (AI proposes, human applies — per [`ai-interaction-patterns.md`](../../.claude/rules/ai-interaction-patterns.md)).

**Real-world example.**
> Andrés gets a `mdeai.co/sponsor/apply?contest=reina-antioquia-2026` link. He picks Premium ($25k), uploads Postobón logo + 30s video, pays via Stripe Checkout. Daniela approves within 4 hours. Day 1 of contest, his dashboard shows 12k impressions, 680 clicks. Day 7: 412k impressions, 18k clicks, 7,200 attributed votes. Gemini's daily insight: "Push notifications drove 22% lift in ticket sales — recommend doubling weight on push." He one-clicks Apply. Director sees the dashboard via shared link, asks for next-quarter renewal.

---

#### **Epic E4 — Laura completes her contestant profile**

**Story E4.1.** *As Laura, I want to complete my profile in 10 minutes from my phone so I can get back to work.*

Acceptance:
- ✅ `/host/contest/:slug/apply` is mobile-first; bio + 3 photos + socials + consent in ≤ 10 input steps.
- ✅ Photo upload supports phone gallery + camera + drag-drop on desktop.
- ✅ AI moderation runs automatically on upload (Gemini); rejects nudity / minors / brand-conflict in < 5s.
- ✅ I get a real-time completeness meter: "70% complete — falta 1 foto + redes sociales".

**Story E4.2.** *As Laura, I want auto-reminders so I don't miss the deadline.*

Acceptance:
- ✅ If profile < 100% complete 48h after starting, the A7 chase agent (per [`07-ai-event-research.md`](./07-ai-event-research.md)) sends me a personalized WhatsApp.
- ✅ After 3 ignored reminders, the system flags a manual touch ticket for Daniela (no more spam).
- ✅ Once complete, Daniela approves and my profile goes live within 24h.

**Real-world example.**
> Laura starts her contestant profile Tuesday on a coffee break. Bio + 2 photos uploaded; she runs out of time. Wednesday at 10am she gets a WA: "Hola Laura, te falta 1 foto + tus redes para activar tu perfil — toma 2 minutos: [link]." She finishes that night. Her profile goes live Thursday morning. She shares to her 18k IG followers via a one-tap mdeai-generated Story. Friday she's #2 on the leaderboard.

---

#### **Epic E5 — Juan judges quickly**

**Story E5.1.** *As Juan, I want to score 30 contestants in 20 minutes so I can get back to my real job.*

Acceptance:
- ✅ `/judge/:contest_slug` shows all 30 contestants in a single scrollable list with photo + 1-line bio.
- ✅ Scoring criteria (e.g. beauty 30%, talent 30%, Q&A 40%) are visible at the top.
- ✅ Sliders or 1–10 numeric inputs per criterion, auto-saving as I move them.
- ✅ Optional: AI-suggested score side-panel (Gemini Pro vision; never replaces my score).
- ✅ Total scoring time for 30 × 3 criteria = 90 inputs, target ≤ 20 min.

**Story E5.2.** *As Juan, I want my scores to be private until reveal so politics don't influence my judgment.*

Acceptance:
- ✅ Scores are visible only to me (and admin, encrypted-at-rest).
- ✅ Live leaderboard during voting shows public + judge **aggregate**, not per-judge breakdown.
- ✅ At reveal, my name is shown alongside criterion totals (transparency), but per-contestant scores stay anonymized.

---

### 2.3 Non-goals (functional)

- No live-stream player built into the contest page (organizer embeds YouTube/Twitch).
- No in-platform DM between voters and contestants (legal + safety risk).
- No anonymous voting (phone OTP required — trade-off is enforced).
- No vote-trading marketplace ("I'll vote for you if you vote for me" detection in fraud layer).
- No multi-language UI beyond **en + es-CO** (Phase 4+ may add pt-BR for São Paulo).

---

## 3. AI System Requirements

### 3.1 AI capabilities (per phase)

| Capability | Phase | Model | Purpose |
|---|---|---|---|
| **AI moderation** on contestant photo + bio + sponsor asset | 1 | `gemini-3-flash-preview` | Reject nudity / minors / brand conflict / illegal content in < 5s |
| **AI fraud anomaly** on vote bursts | 1 | `gemini-3-flash-preview` | Flag IP clusters / device reuse / improbable patterns; admin one-tap shadow-block |
| **Hybrid scoring formula renderer** (read-only AI) | 1 | none | Computed in Postgres, displayed on Trust page |
| **Outreach personalization** | 2 | `gemini-3-flash-preview` | One personalized line per contact, max 30 tokens, regex URL rejection |
| **Sponsor creative generator** | 2 | `gemini-3.1-pro-preview` | 3 caption variants + IG Story sticker + email subject |
| **Sponsor ROI explainer** | 2 | `gemini-3-flash-preview` | Daily 3-sentence narrative for each active sponsor |
| **Audience matcher** (sponsor ↔ contest fit) | 2 | `text-embedding-004` + cosine | Suggest 5 best contests for a brand |
| **AI judge co-pilot** (vision) | 2 (optional) | `gemini-3.1-pro-preview` | Side-panel suggestion only; never replaces human |
| **A6 attendance confirmation** classifier | 3 | `gemini-3-flash-preview` | Classify replies as `confirmed/declined/maybe/no_response` |
| **A7 contestant intake chase** drafter | 3 | `gemini-3-flash-preview` | Personalized reminder w/ specific missing fields named |
| **Event recap generator** | 3 | `gemini-3.1-pro-preview` | Post-event PDF + 3 social posts in **en + es-CO** |
| **Content optimizer** (campaign timing) | 4 | `gemini-3.1-pro-preview` | "Shift weight from X to Y; expected +12% CTR" with one-tap apply |
| **Hermes reasoning over `growth.contacts`** | 4 | Hermes (Nous) on top of Gemini Pro | Sub-agent fan-out for parallel classification |

All calls log to `ai_runs(agent_name, input_tokens, output_tokens, duration_ms, status)`.

### 3.2 Tool requirements

| Phase | Tools needed |
|---|---|
| 1 | Supabase (DB + Storage + Edge + Realtime + Auth) · Stripe Checkout · Twilio WhatsApp Business + SMS OTP · Gemini API · OpenClaw VPS (single workflow) · Vercel · GitHub · Sentry |
| 2 | + SendGrid · Apify · Post Bridge or PostFast · FingerprintJS · Stripe Connect · Resend (email) |
| 3 | + Stripe Connect organizer onboarding · QR code library · React Email templates · ICS generator |
| 4 | + Hermes Agent VPS · Paperclip sidecar VPS · MCP server (Hermes ↔ Supabase) · OpenTelemetry · Grafana Cloud free tier |

### 3.3 Evaluation strategy

Every AI feature has a measurable pass-rate before production:

| Feature | Eval | Pass rate |
|---|---|---|
| **AI moderation** | 100 hand-labeled images (50 clean / 30 borderline / 20 reject); blind run | ≥ 95% precision on rejects (false positives = pissed-off contestant); ≥ 90% recall (false negatives = brand risk) |
| **AI fraud** | 1,000 vote bursts (700 clean / 200 bot ring / 100 collusion); compare to admin gold-standard | ≥ 85% F1 on `suspicious` label |
| **Outreach personalization** | 50 hand-labeled contacts; check that line references the bio + has no invented URLs | ≥ 95% URL-clean; ≥ 80% perceived-personalization (human eval) |
| **Creative generator** | 25 sponsor briefs; human eval on 5 dimensions (relevance, voice, length, tone, originality) | Mean ≥ 4.0 / 5.0 |
| **ROI explainer** | 10 weeks of synthetic data; check explanations for hallucinated numbers | 0 hallucinated numbers across 70 narratives (hard requirement) |
| **A6 attendance classifier** | 200 real Spanish replies; F1 across 4 labels | ≥ 90% F1 weighted |
| **A7 chase drafter** | 50 incomplete profiles; human eval for personalization + tone | ≥ 80% perceived-personalization |
| **Event recap** | 5 closed events; sponsor + organizer rating | Mean ≥ 4.0 / 5.0 |

Eval data + scripts live at `tasks/events/evals/` (not yet created — Phase 1 task).

---

### 3.4 Gemini integration patterns (added 2026-05-03 — per `.claude/skills/gemini` audit + live docs review)

Replaces ad-hoc OpenAI-compat calls with native-API patterns that unlock structured output, thinking levels, multi-tool combination, and Maps/Code-Execution grounding. See task 045 for the migration of `supabase/functions/_shared/gemini.ts` + 3 retroactive task updates (009, 033, 043, 044).

#### 3.4.1 Mandatory rules (every Gemini call)

| Rule | Reason | Enforcement |
|---|---|---|
| **G1** Always pair `responseMimeType:"application/json"` with `responseJsonSchema` | Without the schema, the model only *tries* JSON; with it, output is **guaranteed** valid + schema-shaped | Code review: any free-text JSON parsing in our edge fns is a defect |
| **G2** Never set `temperature` below 1.0 on Gemini 3 | Lower values cause looping + degraded reasoning per Google docs | Lint: grep `temperature.*0\.` in `supabase/functions/` returns zero |
| **G3** Combine `responseJsonSchema` with `googleSearch` (and other built-in tools) | Search metadata can corrupt JSON output without the schema | Tested by tasks 043 + 044 |
| **G4** Pass API key via `x-goog-api-key` header (NOT query param) | Query keys leak via referrer + server logs | `_shared/gemini.ts` enforces this for all callers |
| **G5** Persist `groundingChunks` citations from search-grounded calls | Trust narrative requires showing sources | Stored in `ai_runs.metadata.citations` |
| **G7** Preserve `thoughtSignature` / `id` / `tool_type` across multi-turn function calls | Required by Gemini 3 (400 error otherwise) | `@google/genai` SDK handles automatically — DO NOT roll custom |

#### 3.4.2 Per-feature mapping to mdeai use cases

| Gemini feature | Where in mdeai | Phase | Rationale |
|---|---|---|---|
| **Structured output** (`responseJsonSchema`) | All AI fns: ai-router, ai-search, description-generator (002), photo-moderate (033), venue-optimizer (043), layout-generator (044), chatbot tools (009) | 1 + 1.5 | Eliminates parse failures in ~5 edge fns |
| **`thinkingLevel`** | `minimal` for ai-router; `low` for description gen; `medium` for moderation + chatbot; `high` for venue-optimizer + layout + trip-planner | per-task | Cost/quality tuning |
| **`mediaResolution`** | Photo moderation (033): `high` for hero, `medium` for sponsor logos | 1.5 | 4× token savings on logo moderation |
| **Function calling MODE: `ANY`** + `allowedFunctionNames` | Chatbot event creation (009) | 1 | Prevents AI from free-chatting away from event-creation tools |
| **Tool combination** (custom + built-in) | Chatbot (009): GS + custom fns; Venue optimizer (043): Maps + Code Exec + custom fns; Sponsor matcher (Phase 3): URL Context + GS + custom | 1 + 2 + 3 | Single-turn agentic flows |
| **Google Search grounding** (`googleSearch`) | Chatbot (date lookup); Venue optimizer (event-market signals); Sponsor enrichment | 1 + 2 + 3 | Real-time data beats stale training |
| **Google Maps grounding** (`googleMaps`) | Venue optimizer (043) — comparable rates; Chatbot create-event flows; Trip planner (existing) | 2 + 3 | $25/1k grounded prompts; 500/day free; events are inherently location-based |
| **Code Execution** (`codeExecution`) | Layout generator (044) — Python geometry; Venue analytics (042) — utilization math; Tax/refund verifier (027) | 3 + 4 | Python sandbox; 30s max; NumPy/Pandas/Matplotlib available |
| **URL Context** (`urlContext`) | Wizard (002 polish) — competitor URL analysis; Sponsor enrichment (Phase 3) | 1.5 + 3 | 20 URLs/req, 34MB/URL; no LinkedIn/paywalled |
| **Context caching** (system prompts) | `ai-chat` 7-agent system prompts (~3k tokens × every turn) | 1.5 | ~50% chat cost cut |
| **Image generation** (`gemini-3.1-flash-image-preview`) | Sponsor banner mockups; Event share-card images | 2 + 3 | Replaces agency creative-gen line item; 4K + SynthID |

#### 3.4.3 Models in use (verified 2026-05-03)

| Model | Use | Status |
|---|---|---|
| `gemini-3-flash-preview` | Default — chat, search, router, moderation, description gen, chatbot | ✅ Current |
| `gemini-3.1-pro-preview` | Reasoning-heavy: trip planner, venue optimizer (043), layout generator (044) | ✅ Current |
| `gemini-3.1-flash-lite-preview` | Cheapest tier — intent router only | ✅ Current |
| `gemini-3.1-flash-image-preview` | Image generation — sponsor banners, event cards (Phase 2+) | ✅ Current |
| ~~`gemini-3-pro-preview`~~ (no `.1`) | Used in `ai-trip-planner/index.ts:295` | ❌ **Sunsets March 9, 2026** — fixed in task 045 |

All Gemini 3 models are in **preview** (no GA yet). Knowledge cutoff: **January 2025**.

#### 3.4.4 Skill staleness flag (housekeeping)

The installed `.claude/skills/gemini/SKILL.md` line 387 says: *"Combining built-in tools with function calling is NOT supported in Gemini 3."* This is **outdated**. Live docs (last updated 2026-04-28) confirm the combination IS supported in preview, with `include_server_side_tool_invocations: true` + thought-signature preservation. Task 046 patches the skill + adds 3 missing reference files (maps-grounding, code-execution, tool-combination).

---

## 4. Technical Specifications

### 4.1 Architecture overview

```
┌────────────────────────────────────────────────────────────────────┐
│  CLIENT (existing Vite/React/shadcn at mdeai.co)                  │
│  /explore /event /vote /sponsor/apply /host/event /host/contest   │
│  /judge /admin/* /sponsor/dashboard                                │
└────────────────────────────┬───────────────────────────────────────┘
                             │ HTTPS + WSS (Realtime)
┌────────────────────────────▼───────────────────────────────────────┐
│  VERCEL EDGE (existing)                                            │
│  Static + SSR + edge-cached leaderboard reads                      │
└────────────────────────────┬───────────────────────────────────────┘
                             │
┌────────────────────────────▼───────────────────────────────────────┐
│  SUPABASE (existing project, new schemas)                          │
│  Postgres: vote.* growth.* sponsor.* event.* trio.*                │
│  Auth (email + OAuth + phone OTP)                                  │
│  Storage (contestant photos, sponsor assets, ticket QR)            │
│  Realtime (leaderboard, dashboard tiles)                           │
│  pg_cron (broadcast backstop, ROI rollup, fraud scan)              │
│  Edge Functions (vote-cast, ticket-checkout, sponsor-impression…)  │
└────────────┬─────────────────────┬─────────────────────────────────┘
             │                     │
┌────────────▼────────────┐  ┌────▼────────────┐  ┌─────────────────┐
│ Stripe                   │  │ Gemini 3.x      │  │ OpenClaw VPS    │
│ Checkout (1) Connect (2) │  │ All AI features │  │ Phase 1: 1 wf   │
│                          │  │ (already wired) │  │ Phase 2+: more  │
└──────────────────────────┘  └─────────────────┘  └────────┬────────┘
                                                           │
                                                  ┌────────▼────────┐
                                                  │ Twilio WA + SMS │
                                                  │ SendGrid email  │
                                                  │ Apify (Phase 2) │
                                                  │ Post Bridge (2) │
                                                  └─────────────────┘
                                                           │
                                                  ┌────────▼────────┐  Phase 4 only
                                                  │ Hermes VPS      │
                                                  │ Paperclip sidecar│
                                                  └─────────────────┘
```

### 4.2 Integration points

| System | Phase | Integration | Auth |
|---|---|---|---|
| **Supabase** | 1 | Source of truth; all schemas; RLS scoped per role | service-role JWT (edge fns); user JWT (frontend) |
| **Stripe Checkout** | 1 | Paid voter votes | Stripe webhook signature verification |
| **Stripe Connect** | 2/3 | Organizer payouts (T+7 delayed) | OAuth onboarding flow |
| **Twilio WhatsApp Business** | 1 | Outbound template messages, SMS OTP | API key (rotated quarterly) |
| **Twilio inbound** | 2 | Reply-to-vote (text "1/2/3") | Webhook signature |
| **SendGrid** | 2 | Email outreach + ticket confirmations | API key |
| **Apify** | 2 | Influencer scraping actors | API token |
| **Post Bridge / PostFast / Mixpost** | 2 | Multi-platform social posting | Per-platform OAuth tokens, held by SaaS |
| **Gemini API** | 1 | All AI features | API key in Supabase secrets |
| **OpenClaw** | 1 | Multi-channel messaging gateway, scheduled jobs | Service-role JWT scoped to `growth.*` |
| **FingerprintJS** | 2 | Device fingerprinting for fraud | Public key (frontend) + secret (edge fn) |
| **Hermes Agent** | 4 | Reasoning, sub-agents, MCP | Hermes API token |
| **Paperclip** | 4 | Issues, approvals, budgets | Paperclip API key per agent |

### 4.3 Database schemas (already designed)

Five schemas, fully specified in prior docs:

| Schema | Owner doc | Phase intro | Tables |
|---|---|---|---|
| `vote.*` | [`01-contests.md`](./01-contests.md) | 1 | contests, categories, entities, votes, entity_tally, judges, scoring_criteria, judge_scores, fraud_signals, paid_vote_orders |
| `growth.*` | [`02-openclaw-growth.md`](./02-openclaw-growth.md) + [`07-ai-event-research.md`](./07-ai-event-research.md) | 2 | contacts, segments, outreach_campaigns, outreach_messages, referral_payouts, **+ campaigns, communications, communication_recipients, marketing_assets, asset_distributions** (nielsberglund) |
| `sponsor.*` | [`03-sponsorship-system.md`](./03-sponsorship-system.md) | 1 (minimal) → 2 (full) | organizations, applications, assets, placements, impressions, clicks, attributions, roi_daily, invoices |
| `event.*` | [`05-unified-platform.md`](./05-unified-platform.md) | 3 | events, venues, tickets, bookings, schedule_items |
| `trio.*` | [`06-trio-integration.md`](./06-trio-integration.md) | 4 | tool_runs, handoffs, approval_requests, budgets_today (mat-view) |

Cross-schema FKs: `vote.contests.event_id`, `sponsor.applications.event_id`, `growth.outreach_messages.contest_id`, `sponsor.attributions.vote_id`. All nullable / additive — backwards compatible.

### 4.4 Key API endpoints (edge functions)

Per-phase, summarized — full specs in source docs.

**Phase 1:**
- `POST /vote-cast` — auth + Turnstile + nonce + rate-limit + idempotency + L3 hard rules
- `POST /vote-shadow-block` — admin-triggered, weight=0 for cluster
- `POST /paid-vote-checkout` + `POST /paid-vote-webhook` — Stripe paid voting
- `POST /sponsor-impression` + `POST /sponsor-click` — beacons (only one sponsor surface in Phase 1)
- `POST /fraud-scan` — cron every 60s
- `GET  /leaderboard?contest=<slug>` — edge-cached 2s

**Phase 2:** + `sponsor-application-create`, `sponsor-asset-upload`, `sponsor-checkout`, `sponsor-payment-webhook`, `sponsor-attribute`, `sponsor-roi-rollup`, `sponsor-creative-gen`, `sponsor-roi-explain`, `sponsor-optimize`, `sponsor-audience-match`, `sponsor-moderate`, `outreach-send-loop`

**Phase 3:** + `event-create`, `event-publish`, `ticket-checkout`, `ticket-payment-webhook`, `ticket-validate`, `event-recap`, `event-share`

**Phase 4:** + Paperclip↔OpenClaw bridge, Hermes MCP server, all 7 trio automations (A1–A7)

### 4.5 Security & Privacy

| Concern | Mitigation |
|---|---|
| **PII (phone, email, address)** | RLS strict on all tables; user can see only own data. Phone hashed daily-rotating salt; email + address kept clear (operationally needed) but encrypted-at-rest by Supabase |
| **Voter privacy** | `vote.votes.voter_user_id` and `voter_anon_id` SELECT-able only by self; aggregates public |
| **Sponsor data** | RLS on `sponsor.*`: SELECT only own org's applications; no cross-org data leak |
| **Judge scores** | Encrypted-at-rest (Postgres native + Supabase pgcrypto if needed); private until reveal |
| **Service-role JWT** | Edge functions only; never frontend; rotated quarterly |
| **Stripe webhook signature** | Verified on every `*-payment-webhook` |
| **CSRF / nonce** | Vote-cast requires short-lived (60s) signed JWT issued at page render |
| **Rate limit** | Durable Postgres (`rate_limit_hits` + `check_rate_limit` RPC); not per-isolate |
| **Compliance — Habeas Data (Colombia Law 1581/2012)** | Privacy policy in es-CO; explicit consent on signup; deletion path at `/account/data`; 30-day deletion SLA |
| **Compliance — GDPR (for any EU voter)** | Same flows; DPA with Apify, Twilio, SendGrid, Stripe |
| **Brand-safety** | Sponsor placement auto-pause on confirmed-fraud spike or judge-resignation event |
| **Content moderation** | Gemini moderation on every photo upload; admin override; right-of-appeal documented |
| **Audit trail** | Phase 4: every Paperclip mutating action linked to actor + run-id; pre-Phase 4: Postgres `created_by` + `created_at` on every PII-touching table |

---

### 4.6 Hi.Events benchmark — schema + features gap audit (HE-1, HE-2, HE-3)

[Hi.Events](https://hi.events) (3,767⭐ open-source ticketing platform, AGPL v3 + commercial license) is the production-grade reference for this category. Per [`13-ai-events-repo-audit.md`](./13-ai-events-repo-audit.md) §4.9, we deep-inspected its codebase and ran three audit actions:

#### 4.6.1 HE-1 — Schema audit (our `event.*` vs Hi.Events 103 migrations)

**Hi.Events ships 25+ canonical tables** (initial_db.sql + 102 incremental migrations as of April 2026). Comparison vs our planned `event.*` schema (5 tables in [`11-events-system-design.md`](./11-events-system-design.md) §7.3):

| Concept | Hi.Events table | Our planned event.* | Verdict |
|---|---|---|---|
| Tenant root | `accounts` | (uses mdeai's existing `profiles`) | ✅ different model — OK |
| Organizer | `organizers` + `organizer_settings` | (uses `profiles.id` as organizer_id) | ⚠️ **Phase 2** add `event.organizers` for branding/payout/timezone separately from individual profiles |
| Event core | `events` | `event.events` | ✅ comparable; add their `attributes` JSONB + `short_id` |
| **Ticket types** | `tickets` (renamed `products` 2024-09 — extended for merch/donations/upgrades) | `event.tickets` | ⚠️ **Phase 1 add**: `type IN ('paid','free','donation','tiered')`, `is_hidden`, `hide_before_sale_start_date`, `hide_after_sale_end_date`, `hide_when_sold_out`, `is_hidden_without_promo_code`, `min_per_order`, `max_per_order` |
| **Order (purchase)** | `orders` (parent of N attendees + N tickets in one transaction) | (none — we conflated booking with order) | 🚨 **Phase 1 ADD `event.orders`** — one purchase can contain multiple tickets/attendees; current schema has `event.bookings.ticket_id` 1:1 which breaks for "1 GA + 2 VIP" multi-ticket purchases |
| Attendee | `attendees` (per-person record with email/locale/check-in status) | `event.bookings` (currently conflated) | 🚨 **Phase 1 SPLIT**: rename our `bookings` → `orders`, add `event.attendees` for the per-person records; `bookings.qty=2` becomes 2 attendee rows under 1 order |
| Check-ins | `attendee_check_ins` + `check_in_lists` + `ticket_check_in_lists` | `event.check_ins` | ⚠️ **Phase 2** add `check_in_lists` for access-controlled scanner permissions |
| **Promo codes** | `promo_codes` | (none) | 🚨 **Phase 1 ADD** — `event.promo_codes` (code, discount, applicable_ticket_ids, max_usages, expiry, attendee_usage_count) |
| **Taxes & fees** | `taxes_and_fees` (per-account) + `account_vat_settings` | (none) | 🚨 **Phase 1 ADD** — VAT compliance for Colombia (19% IVA) is a release blocker |
| Refunds | `order_refunds` | (none) | 🚨 **Phase 1 ADD** — full + partial refund history |
| Capacity sharing | `capacity_assignments` + `ticket_capacity_assignments` | (none) | ⚠️ **Phase 3** — useful for multi-section festivals |
| Waitlist | `waitlist_entries` | (none) | ⚠️ **Phase 3** |
| Affiliate tracking | `affiliates` (per-event) | `growth.referral_payouts` (contest-bound) | ⚠️ **Phase 2 ADD** `event.affiliates` for event-level affiliate links separate from contest referrals |
| Audit log | `event_logs` (polymorphic) + `order_audit_logs` | (relies on `created_by/created_at`) | ⚠️ **Phase 2** add explicit audit table |
| Invoices | `invoices` | (planned — `sponsor.invoices` only) | ⚠️ **Phase 3** — auto-invoicing for B2B organizers |
| Email templates | `email_templates` | (none) | ⚠️ **Phase 2** — organizer customization |
| Outgoing messages | `outgoing_messages` | `growth.communications` (campaign-bound) | ⚠️ **Phase 2** — per-event message log |
| Webhooks | `webhooks` + `webhook_logs` | (none) | ⚠️ **Phase 4** — Zapier/Make/CRM integrations |
| Ticket lookup tokens | `ticket_lookup_tokens` | (planned in `qr_token`) | ✅ — our QR token covers this |
| Stripe details | `stripe_customers` + `stripe_payouts` + `account_stripe_platforms` | (relies on Supabase `p1_payments`) | ⚠️ **Phase 2** — explicit payout tracking |
| Images | `images` (polymorphic via `entity_id` + `entity_type`) | (Supabase Storage) | ✅ different model — OK |
| Schedule | (none — they don't have multi-day schedule) | `event.schedule_items` | ✅ **mdeai is ahead here** |
| Venues | (none — `events.location` text + `location_details` jsonb) | `event.venues` | ✅ **mdeai is ahead here** |

**HE-1 Phase 1 schema must-adds (5 critical):**

```sql
-- 1. Separate orders from bookings
CREATE TABLE event.orders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES event.events(id),
  buyer_user_id   uuid REFERENCES auth.users(id),
  buyer_email     text NOT NULL,
  buyer_name      text NOT NULL,
  total_cents     int NOT NULL,
  subtotal_cents  int NOT NULL,
  tax_cents       int NOT NULL DEFAULT 0,
  fee_cents       int NOT NULL DEFAULT 0,
  discount_cents  int NOT NULL DEFAULT 0,
  promo_code_id   uuid REFERENCES event.promo_codes(id),
  payment_id      uuid REFERENCES public.p1_payments(id),
  status          text NOT NULL CHECK (status IN ('pending','paid','refunded','partial_refund','cancelled')),
  short_id        text NOT NULL UNIQUE,                    -- public-friendly order number
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- 2. Attendees as people, not transactions
CREATE TABLE event.attendees (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid NOT NULL REFERENCES event.orders(id) ON DELETE CASCADE,
  ticket_id       uuid NOT NULL REFERENCES event.tickets(id),
  email           text NOT NULL,
  full_name       text NOT NULL,
  phone_e164      text,
  qr_token        text NOT NULL UNIQUE,                    -- single-use server-signed JWT
  qr_used_at      timestamptz,
  bonus_votes_remaining int NOT NULL DEFAULT 0,            -- Phase 2 contests integration
  metadata        jsonb DEFAULT '{}',                       -- dietary, accessibility, custom Qs
  locale          text DEFAULT 'es-CO',
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled','refunded'))
);
CREATE UNIQUE INDEX ON event.attendees (qr_token);
CREATE INDEX ON event.attendees (order_id);
CREATE INDEX ON event.attendees (email, event_id);  -- after we add event_id (denormalized for fast lookup)

-- 3. Promo codes
CREATE TABLE event.promo_codes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES event.events(id) ON DELETE CASCADE,
  code            text NOT NULL,
  discount_type   text NOT NULL CHECK (discount_type IN ('percent','fixed','free')),
  discount_value  numeric(8,2) NOT NULL,
  applicable_ticket_ids uuid[],                            -- nullable = applies to all
  max_usages      int,                                      -- nullable = unlimited
  usage_count     int NOT NULL DEFAULT 0,
  expires_at      timestamptz,
  unlocks_hidden_tickets bool NOT NULL DEFAULT false,        -- per Hi.Events `is_hidden_without_promo_code`
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, code)
);

-- 4. Taxes & fees (Colombia 19% IVA + service fees)
CREATE TABLE event.taxes_and_fees (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id    uuid NOT NULL REFERENCES public.profiles(id),
  name            text NOT NULL,
  type            text NOT NULL CHECK (type IN ('TAX','FEE')),
  calculation_type text NOT NULL CHECK (calculation_type IN ('FIXED','PERCENTAGE')),
  rate            numeric(10,3) NOT NULL,
  is_active       bool NOT NULL DEFAULT true,
  is_default      bool NOT NULL DEFAULT false,
  description     text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- 5. Refunds
CREATE TABLE event.order_refunds (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid NOT NULL REFERENCES event.orders(id),
  amount_cents    int NOT NULL,
  reason          text,
  initiated_by    uuid REFERENCES auth.users(id),
  stripe_refund_id text,
  status          text NOT NULL CHECK (status IN ('pending','completed','failed')),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- 6. Add ticket visibility flags + types (Hi.Events parity)
ALTER TABLE event.tickets
  ADD COLUMN type text NOT NULL DEFAULT 'paid' CHECK (type IN ('paid','free','donation','tiered')),
  ADD COLUMN is_hidden bool NOT NULL DEFAULT false,
  ADD COLUMN hide_before_sale_start_date bool NOT NULL DEFAULT false,
  ADD COLUMN hide_after_sale_end_date bool NOT NULL DEFAULT false,
  ADD COLUMN hide_when_sold_out bool NOT NULL DEFAULT false,
  ADD COLUMN is_hidden_without_promo_code bool NOT NULL DEFAULT false,
  ADD COLUMN min_per_order int,
  ADD COLUMN max_per_order int;
```

**Net change to Phase 1 task 001 (`event.*` migration):** schema grows from 5 → 9 tables + 7 column additions. Estimated effort: 1 day → **1.5 days**.

#### 4.6.2 HE-2 — Feature gap-check (Hi.Events v1.0 features × mdeai status)

| Category | Feature | Hi.Events | mdeai Phase | Gap? |
|---|---|---|---|---|
| **Ticketing** | Free tickets | ✅ | 1 | ✅ no gap |
| | Paid tickets | ✅ | 1 | ✅ no gap |
| | **Donation tickets** | ✅ | not planned | 🚨 **gap** |
| | **Tiered tickets** | ✅ | 1 | partial |
| | **Hidden tickets (require promo code)** | ✅ | not planned | 🚨 **gap** |
| | **Locked tickets behind codes** | ✅ | not planned | 🚨 **gap — add Phase 1 via promo_codes** |
| | **Pre-sale access** | ✅ | not planned | 🚨 **gap** |
| | **Product add-ons (merch, upgrades)** | ✅ | not planned | ⚠️ **Phase 3** |
| | **Product categories** | ✅ | not planned | ⚠️ **Phase 2** |
| | **Tax/VAT/fee support** | ✅ | not planned | 🚨 **gap — Phase 1 release blocker (Colombia IVA)** |
| | Capacity management | ✅ | 1 | ✅ |
| | Shared capacity limits | ✅ | not planned | ⚠️ **Phase 3** |
| **Branding** | Conversion-optimized checkout | ✅ | 1 | partial |
| | **Custom PDF ticket designs** | ✅ | not planned | ⚠️ **Phase 1 — see HE-3** |
| | Branded organizer homepage | ✅ | not planned | ⚠️ **Phase 3** |
| | **Drag-and-drop event page builder** | ✅ | not planned | 🚨 **gap — competitive disadvantage** |
| | **Embeddable ticket widget** | ✅ | not planned | ⚠️ **Phase 3** |
| | SEO + Open Graph | ✅ | 1 | partial (can be added) |
| **Attendee** | Custom checkout questions | ✅ | not planned | 🚨 **Phase 1 add — common organizer ask** |
| | Search/filter/export (CSV/XLSX) | ✅ | partial | ⚠️ **Phase 1 add CSV export** |
| | **Full + partial refunds** | ✅ | not planned | 🚨 **Phase 1 release blocker** |
| | Bulk messaging by ticket type | ✅ | partial (growth.communications) | ⚠️ **Phase 2** |
| | QR code check-in with scan logs | ✅ | 1 | ✅ |
| | Access-controlled check-in lists | ✅ | not planned | ⚠️ **Phase 2** |
| **Analytics** | Real-time sales dashboard | ✅ | 1 | ✅ |
| | **Affiliate + referral tracking (event-level)** | ✅ | partial (contest-only) | 🚨 **Phase 2 add event-level** |
| | Advanced reporting (sales/tax/promos) | ✅ | not planned | ⚠️ **Phase 3** |
| | **Webhooks (Zapier/Make/CRM)** | ✅ | not planned | ⚠️ **Phase 4** |
| **Operations** | Multi-user roles + permissions | ✅ | partial | ⚠️ **Phase 2** |
| | **Stripe Connect instant payouts** | ✅ (instant) | 1 (T+7 default) | partial — we ship more conservative |
| | **Offline payment methods** | ✅ | not planned | ⚠️ **Phase 3** |
| | **Offline event support** | ✅ | not planned | ⚠️ **Phase 3** |
| | **Automatic invoicing** | ✅ | not planned | ⚠️ **Phase 3** |
| | Event archive | ✅ | 1 (status='archived') | ✅ |
| | Multi-language support | ✅ (13 langs) | partial (en + es-CO) | ⚠️ **Phase 4** |
| | Full REST API | ✅ | partial (Supabase auto) | partial |

**Summary: 36 features compared. mdeai status: 6 ✅ no-gap · 13 partial/Phase-2-3 · 17 🚨 critical-gap-or-must-add.**

**Phase 1 release-blocker additions (5):**
1. **Tax/VAT support** — Colombia IVA 19% on tickets is mandatory by Colombian law. Without it, organizer can't legally invoice.
2. **Refunds (full + partial)** — chargebacks are inevitable; without refund handling, support burden becomes unmanageable.
3. **Promo codes** — even basic ones; required for sponsor comp tickets + group sales.
4. **Custom checkout questions** — every event needs at least dietary + accessibility; organizers expect this.
5. **CSV/XLSX export of attendees** — door staff print attendee lists; finance teams need order exports.

**Phase 1 calendar impact:** scope grows from 12 tasks (4 weeks) to **~16 tasks (5 weeks)**. Trade-off: launch one week later vs ship without features competitors have had since 2018.

#### 4.6.3 HE-3 — PDF ticket template (AGPL implications)

**Hi.Events generates customizable PDF tickets server-side**. Pattern is in `backend/app/Services/Domain/Order/PdfTicketService.php` (Laravel + DomPDF or similar).

**AGPL v3 §13 implications for mdeai:**

> "If you modify the Program... you must... offer all users... the corresponding source... over a network."

Translation: if mdeai incorporates Hi.Events code into a server that interacts with users via the network (which we do — mdeai.co), we must release the entire mdeai server source code to those users under AGPL.

**This is a non-starter for a closed-source platform.** mdeai cannot incorporate Hi.Events code directly.

**Three legal-clean options:**
1. **Reimplement from scratch** — study Hi.Events visual design as inspiration, build our own PDF using a different library (`react-pdf` for SSR, or Gemini-generated SVG → PDF). No AGPL exposure. **RECOMMENDED.**
2. **Buy Hi.Events commercial license** — removes AGPL §13. Pricing not public; contact sales. Probably $$$.
3. **Use a different open-source PDF library** — `pdfme` (MIT), `react-pdf` (MIT), `pdfkit` (MIT), `puppeteer` (Apache 2.0 to render HTML→PDF). All compatible with mdeai's Vite/Edge stack.

**Phase 1 task 005 (`ticket-payment-webhook`) recommendation:** use `puppeteer` or `react-pdf` in a Supabase edge function. Render HTML template to PDF. Store in Supabase Storage. Email link via SendGrid. **0 lines of Hi.Events code copied.**

The branded design pattern (organizer logo + event hero + QR + ticket details + social share footer) is a UX convention, not copyrightable. We replicate the *layout idea*, not the implementation.

**Effort:** 1 day for PDF generation in Phase 1 task 005. Already in scope.

#### 4.6.4 Net update to Phase 1 scope

| Was | Now |
|---|---|
| 12 tasks · 4 weeks · 5 `event.*` tables | **16 tasks · 5 weeks · 9 `event.*` tables (orders/attendees/promo_codes/taxes_and_fees/order_refunds added)** |
| Stripe paid voter votes deferred | Same — Phase 2 |
| No tax handling | **Colombia IVA 19% via `event.taxes_and_fees`** + checkout calculation |
| No refunds | **Full + partial refunds via `event.order_refunds` + Stripe API** |
| No promo codes | **`event.promo_codes` with hidden-ticket-unlock + sponsor comp tickets** |
| No checkout questions | **Custom checkout questions JSONB on `event.tickets` + answers JSONB on `event.attendees`** |
| No CSV export | **CSV/XLSX export endpoint on `/host/event/:id/dashboard`** |

**The schema audit + feature gap-check raised Phase 1 scope by ~25%, but eliminates competitive gaps that would have surfaced in the first sponsor + organizer conversations.**

Trade-off accepted: **5 weeks vs 4 weeks for Phase 1**. Miss Elegance Colombia 2026 launch target moves from week-of-June-23 → week-of-June-30 (per §6 Q1 default).

---

## 5. Risks & Roadmap

### 5.1 Phased rollout (canonical = [`08-plan-audit-response.md`](./08-plan-audit-response.md))

| Phase | Weeks | Theme | Acceptance gate (must hit before next phase) |
|---|---|---|---|
| **1 — Contest Engine** | 3 | Hybrid voting, Trust page, ONE OpenClaw broadcast, ONE sponsor surface, paid voter votes | 1 contest live + 1k votes + 0% confirmed fraud + 1 paid vote settled |
| **2 — Sponsorship + Compliant Growth** | 4 | Full sponsor wizard, all 5 activations, growth schemas, compliant outreach, dashboards, Stripe Connect | 5+ sponsors paying, $5k+ revenue, K-factor > 1.0, 0 bans |
| **3 — Events + Tickets** | 4 | `event.*`, ticketing, QR, Stripe Connect payouts, A6 + A7 automations | 1 event 100+ tickets, attendance ≥ 70%, payouts settled |
| **4 — AI Orchestration** | 6 | Hermes + Paperclip + AI sponsor tools + CPL pricing + white-label | 5+ concurrent contests, 1 CPL sponsor, 14d trio uptime |

**Total:** ~17 weeks of build for full v1.0. Phase 1 is the only release blocker; subsequent phases are revenue-positive expansions.

### 5.2 Technical risks register

| Risk | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|
| **Vote manipulation scandal** | Medium | Catastrophic (platform credibility = dead) | Hybrid scoring + Trust page + 5-layer fraud + brand-safety pause + transparent post-incident report template (drafted Phase 1) | Founder |
| **Twilio number flagged as spam** | Medium | High (no WA broadcasts → no virality) | Warm-up gradient (10/day → 50/day over 2 weeks); rotate sender; volume cap as hard rule | Ops |
| **Stripe payout dispute / refund storm** | Low | High | Stripe Connect T+7 delayed transfer; dispute window before payout; refund SLA in TOS | Founder |
| **Phone OTP cost runaway** | Medium | Medium | Cap free votes at 1/day/phone; budget alarms at $300/$600/$900/mo; failover to email-OTP | Eng |
| **Gemini hallucination** in personalization | Medium | Medium | Regex URL rejection; manual review for first 100/campaign; audit trail in `ai_runs` | Eng |
| **OpenClaw VPS crash → no broadcasts** | Low | Medium | `pg_cron` backstop runs same job; reconcile on restart | DevOps |
| **Supabase quota exceeded** | Low | High | Reservations on Pro tier; alert at 80%; partition `vote.votes` by month if > 10M rows | DevOps |
| **Apify cost spiraling** | Medium | Medium | Monthly cap in dashboard; 7-day result cache; pause on alert | Ops |
| **Phase scope creep** | High | High | Phase gates (this doc + `08`); cannot advance without green KPIs; retrospective per-phase | Founder |
| **Solo dev burnout** | High | Catastrophic | Phase 2 hires community manager; Phase 3 hires part-time dev; mental-health gates per phase | Founder |
| **Legal — Colombia voting / lottery rules** | Medium | High | Pageant ≠ lottery (skill-based); legal review on TOS in Phase 1; no "buy votes to win prizes" wording | Legal |
| **Sponsor ROI undelivered** | Medium | High | Guaranteed-value packages by default; CPL gated until 30d data; refund/credit policy explicit | Founder |
| **Cross-vendor lock-in (Post Bridge etc.)** | Low | Medium | Abstract behind one OpenClaw skill `social-publish`; migration playbook in `06-trio-integration.md` | Eng |
| **Hermes / Paperclip stability (April 2026 reports)** | Medium | High | Phase 4 deferred until both ≥ stable releases; manual-fallback for every automation | Eng |
| **Colombia IVA non-compliance** (added by HE-2 audit) | High if shipped without tax | High (legal) | `event.taxes_and_fees` + checkout calculation in Phase 1; counsel review on tax rate config | Legal + Eng |
| **No refund handling at launch** (added by HE-2 audit) | High | High (chargeback storms) | `event.order_refunds` + Stripe refund API in Phase 1 | Eng |
| **Hi.Events feature gap shocks first organizer** (added by HE-2) | Medium | Medium | 17 critical features mapped to Phase 1-3 in §4.6.2; first-organizer expectations set explicitly in Phase 0 partnership | Founder |
| **AGPL contamination if Hi.Events code copied** (added by HE-3) | Low (we won't) | Catastrophic (forces open-source) | Reimplement PDF from scratch with `react-pdf`/MIT libraries; no Hi.Events code in repo | Eng |

### 5.3 Operational risks

| Risk | Mitigation |
|---|---|
| **AI Spanish doesn't sound like Medellín** (the AI's Spanish drifts toward generic "translated English" or non-Paisa Latin American Spanish — locals read it and feel "this is not from here") | Spanish-native QA contractor reviews first 100 outputs/month; corrections fed back into Gemini system prompt; founder spot-checks weekly |
| **Judge no-show after agreeing** | 24h-before-reveal SMS reminder; backup judge pool |
| **Contest-day surge crashes leaderboard** | Materialized `vote.entity_tally`; clients read counter, not raw votes; Realtime fan-out |
| **Misaligned organizer expectations** | "What success looks like" required field in `/host/event/new`; PRD-style brief auto-generated and reviewed |

---

## 6. Open questions (TBD — confirm with founders before Phase 1 kickoff)

These are **not** trivia. Each one materially changes Phase 1 scope, schedule, or cost. Each section below states: the question, why it matters, the options with concrete trade-offs, the default I'm recommending and why, and what changes downstream depending on the answer.

> **How to use this section:** founder reads each question, picks an option (default or alternative), and writes the answer next to the **Decision** line. After all 7 are resolved, Phase 1 kickoff begins. Any answer different from the default adjusts `08-plan-audit-response.md` Phase 1 gates.

---

### Q1 — Phase 1 launch target date

**Question.** What calendar date is the "1 contest live with 1k votes" gate due?

**Why it matters.** Phase 1 is 3 weeks of dev + ~1 week of legal review + ~1 week of first-organizer onboarding/seeding contestants = **5 weeks minimum from PRD signoff to first vote cast**. Today is May 2, 2026. Earliest realistic launch is week of June 9. The date drives Twilio WhatsApp Business approval timing (3–10 day SLA), legal counsel scheduling, and how aggressively we recruit the first organizer.

**Options.**

| Option | Date | Trade-off |
|---|---|---|
| **Aggressive** | Mon June 9, 2026 (5 weeks) | No buffer for any setback. Twilio approval delay → instant slip. Legal review compressed |
| **Realistic (default)** | Mon June 23, 2026 (7 weeks) | One full week of buffer; aligns with end-of-quarter (Q2 close) for KPI reporting; cleaner founder narrative |
| **Conservative** | Mon July 14, 2026 (10 weeks) | Two weeks of buffer; comfortable but slow; risk that the audit's "execution risk: HIGH" verdict resurfaces |

**Recommended default:** **June 23, 2026** — gives one week of buffer for the inevitable Twilio/legal/organizer slip while still feeling ambitious enough to maintain founder velocity.

**What changes by answer.**
- Aggressive → cut paid-vote Stripe Checkout from Phase 1 (defer to Phase 2). Free voting only.
- Conservative → add paid-vote Stripe Checkout AND second sponsor surface to Phase 1 (use the extra weeks).

**Decision:** _________________________ (founder writes here)

---

### Q2 — Resource model for Phase 1

**Question.** Solo founder dev for Phase 1, or solo + 1 contractor / hire?

**Why it matters.** Phase 1 needs ~120 dev-hours over 3 weeks. Solo founder = 40 hr/wk for 3 weeks straight. The audit flagged "solo dev burnout" as **HIGH likelihood / catastrophic impact**. Hiring earlier costs $$$ before any revenue exists.

**Options.**

| Option | Cost (Phase 1) | Velocity | Risk profile |
|---|---|---|---|
| **Solo founder dev (default)** | $0 incremental | 100% founder bandwidth | Burnout risk high; depth-first focus |
| **Solo + Spanish QA contractor** (10 hrs/wk × 3 wks = 30 hrs) | ~$600 | Founder stays 100% on dev; Spanish review and Trust page copy outsourced | Best Spanish quality; minimal cost |
| **Solo + part-time junior dev** (20 hrs/wk × 3 wks) | ~$2,400 | Parallel work on UI polish | Onboarding cost eats into Phase 1 time |
| **Full team — solo + CM hire from day 1** | ~$3,500/mo | CM helps with first-organizer outreach Phase 1 | Burns runway pre-revenue; over-investment |

**Recommended default:** **Solo + Spanish QA contractor** ($600 total). Founder owns all code; contractor reviews Trust page + voter-facing es-CO copy + sponsor outreach templates. Most leverage per dollar; protects against the highest single risk (Spanish-Paisa voice drift, which would damage trust on day 1). The original default (pure-solo) underweights this risk.

**What changes by answer.**
- Solo only → add 1 week to Phase 1 for Spanish review (founder must do it themselves at the end).
- + junior dev → Phase 1 ships with polished UI but slower because of onboarding (net wash — pick if founder enjoys the company).
- + CM full-time → Phase 1 includes outbound organizer recruitment (3 candidates lined up by gate); reduces Phase 2 ramp-up.

**Decision:** _________________________

---

### Q3 — First contest type

**Question.** Which kind of contest is the first one in the wild — beauty pageant, restaurant week, or a small bar/meetup contest?

**Why it matters.** This is the decision that most influences perceived risk in Phase 1. The three options have wildly different fraud, legal, and PR profiles. **The first contest defines the platform's narrative for sponsors and press.**

**Options.**

| Option | Legal risk | Fraud risk | Revenue potential | Setup complexity | Phase 1 fit |
|---|---|---|---|---|---|
| **Pageant** ("Reina de Antioquia 2026") | High — winner gets prizes; voting weighting must be defensible; pageant industry has buy-vote scandal history | High — public bots, paid-vote pressure | $$$ — full sponsor stack viable | High — needs 30 contestants, 5 judges, scoring rubric, identity verification | ⚠️ Stretch — feasible but tests many moving parts at once |
| **Restaurant Week** ("Best Bandeja Paisa Medellín") (default) | Low — no individual prize money; public ranking only | Medium — restaurant-on-restaurant collusion, but lower stakes | $$ — sponsors per restaurant ($500 × 28 = $14k) + event-level Gold ($10k) | Medium — restaurants self-promote; we seed from existing mdeai restaurant DB | ✅ Strong — low risk, demonstrates engine, organic growth |
| **Micro-contest** (one Laureles bar, "Best DJ Wednesday") | Very low — single-night, no prize money | Very low — small audience | $ — single Bronze sponsor $500 | Low — 4 contestants, no judges | ✅ Easiest — but uninspiring demo for follow-on sponsors |

**Recommended default:** **Restaurant Week** — proves the engine end-to-end without exposing the platform to the highest-risk failure mode (pageant fraud scandal) on day 1. Restaurants are existing mdeai data (340 in `restaurants` table), so seeding contestants takes minutes not weeks. Restaurants self-promote because their customers see the badge — organic growth requires no founder marketing labor.

**Decision (founder, May 2026):** **Beauty pageant — [Miss Elegance Colombia 2026](https://misseleganceco.com/) (*Certamen Nacional de Elegancia, Liderazgo y Autenticidad*) — free voting (no charges to voters in Phase 1).** This overrides the restaurant-week default. Founder accepts the higher risk profile in exchange for the bigger PR opportunity and a real organizer-partnership anchor (an actual 2026 contest with its own brand, organizers, and contestants). Free voting simplifies Phase 1 by removing Stripe Checkout for paid votes; sponsorship monetization remains the Phase 1 → Phase 2 revenue bridge.

**Phase 0 prerequisite (added by this decision).** Before Phase 1 dev kickoff, founder must close a written partnership with Miss Elegance Colombia covering: (a) scoring formula approval (mdeai's hybrid `0.5 × audience + 0.3 × judges + 0.2 × engagement`), (b) contestant onboarding flow (who collects waivers, who moderates photos, who arbitrates disputes), (c) prize-disclosure compliance (Colombia distinguishes "skill-based competition" from "lottery" — contest TOS must follow Ley 643/2001 and Ley 1581/2012), (d) finals-night logistics, including whether mdeai's leaderboard is shown live on the broadcast feed, (e) brand placement rules — co-branded "powered by mdeai" or white-label. **Without this signed partnership, Phase 1 cannot start** because the entire flagship contest narrative depends on it.

**Although the contest is national in branding (`Certamen Nacional`), mdeai's amplification stays Medellín-focused** — Apify scrapers target `#medellin / #paisa / #laureles` hashtags; WhatsApp Community broadcasts go to Medellín-anchored groups; founder-led influencer outreach focuses on the top 200 Medellín creators; sponsor sales target Antioquia-headquartered brands (Postobón, Bavaria, Grupo Éxito, Banco BBVA Colombia, etc.). National contestants from outside Medellín are visible on the platform but the marketing flywheel is local. This avoids the "premature scaling" trap from §6 Q5.

**Concrete Phase 1 deltas from this decision** (already applied to [`08-plan-audit-response.md`](./08-plan-audit-response.md) Phase 1 ships and gates):

| Change | What it means |
|---|---|
| ➖ **Cut: Stripe Checkout for paid voter votes** | Saves ~3 days of Phase 1 dev. No `paid-vote-checkout` / `paid-vote-webhook` / Stripe paid-vote-revenue tables wired in Phase 1. Stripe paid-vote flow moves to **Phase 2** as part of the sponsorship + growth bundle. |
| ➕ **Add: Identity verification flow for contestants** | Each contestant uploads a government-ID photo + signed waiver. Admin moderates before profile activation. Reuses existing mdeai `identity_docs` Storage bucket. ~3 days dev. |
| ➕ **Add: Tighter Gemini photo moderation** for contestant-submitted images | False-positive cost is "an annoyed contestant" — manageable. False-negative cost is "a brand-safety incident". Threshold raised; admin override visible. ~1 day dev. |
| ➕ **Add: Pageant-specific Trust page section** | Explains hybrid scoring (50/30/20), judge selection, fraud defenses, and why this isn't a lottery (Colombia legal distinction). Counsel sign-off mandatory before voting opens. ~1 day copy + 1 week legal |
| 🔄 **Acceptance gate change** | Drop "≥1 paid voter vote settled in Stripe". Add "All N contestants verified through identity flow before public voting opens" + "Trust page reviewed by Colombian counsel + signed off". |
| ➖ **Phase 1 revenue from contest** | Zero (free voting). Revenue path is: Phase 1 demo proves the engine → Phase 2 sponsor sales for the **same contest while it's still live** (sponsor logo flips on contest_header surface). Founder closes 1–2 sponsor deals during Phase 2 against the live Phase 1 contest. |
| ⚠️ **Risk profile** | Higher than restaurant-week. Mitigations: (a) phone OTP from day 1, (b) hybrid scoring 50/30/20 default, (c) Trust page legal sign-off, (d) device fingerprinting deferred from Phase 2 → Phase 1.5 if first 1k votes show > 1% suspicious-flagged rate, (e) brand-safety auto-pause hooks built into `vote.fraud_signals`. |

**Phase 1 net dev-time impact:** approximately wash. ~3 days cut (paid-vote Stripe) + ~5 days added (ID verify + tighter moderation + pageant-specific Trust copy + Phase 1.5 fingerprinting contingency) = +2 days. Calendar: extend Phase 1 from 3 weeks to **3.5 weeks** (still aligns with the June 23, 2026 default if Q1 lands as recommended).

**Strategic upside captured.** Reina de Antioquia is a **flagship case study** for Phase 2 sponsor sales. "Powered the voting platform for Reina de Antioquia 2026" closes Postobón / Águila / Bavaria conversations faster than "Powered Restaurant Week" would have. The original `00-overview.md` scenario was always pageant-led — this decision aligns the plan with the original strategic narrative.

**Strategic risk acknowledged.** A Phase 1 fraud incident on a beauty pageant kills the platform before Phase 2 starts. The 5 mitigations above are mandatory release blockers. If any one isn't green, the contest does not go live.

**What changes by answer.**
- Pageant → Phase 1 must include identity verification (waiver upload + admin moderation); add 1 week to Phase 1; legal review more rigorous; PR upside huge if it goes well. **← This is what we picked.**
- Restaurant Week → free RSVP only (no Stripe Checkout for paid votes in Phase 1); paid voting moves to Phase 2 demo. **This is the biggest scope reducer of any answer in this section.**
- Micro-contest → Phase 1 ships in 2 weeks not 3; sponsor demonstration weak; harder to recruit Phase 2 sponsors without a flagship case study.

**Strategic note.** You can have it both ways: launch **Restaurant Week as the public Phase 1 contest** (low risk) AND start sponsor sales for "Reina de Antioquia 2026" Phase 2 in parallel. The public case study (Restaurant Week) closes the deal for the bigger pageant.

**Decision:** _________________________

---

### Q4 — Pricing latitude for paid voter votes

**Question.** Can organizers set their own paid-vote price, or is it fixed at $1/vote platform-wide?

**Why it matters.** Paid voting is the platform's #2 revenue stream (after sponsorship). Pricing controls who participates: $0.10/vote = mass-market; $5/vote = serious supporters only. Different contests have different elasticity (pageant fans pay more; restaurant fans pay less). But pricing inconsistency across contests creates a "why is this contest more expensive?" support headache.

**Options.**

| Option | Organizer flexibility | Platform consistency | Support complexity | Revenue elasticity |
|---|---|---|---|---|
| **Locked $1/vote globally** | None | Maximum | Lowest | None — single point on demand curve |
| **Ranged $0.50–$5/vote (default)** | Bounded — organizer picks tier within range | Good | Low — tier name explains price ("standard"/"premium"/"VIP") | Medium — organizer can match audience |
| **Fully flexible $0.10–$50/vote** | Maximum | Low — voters confused by 50× variance | High | High — organizer optimizes per audience |

**Recommended default:** **Ranged $0.50/$1/$2/$5 (4 named tiers)** — gives organizer control without explaining-floor confusion. Tiers shown to voters as "Standard / Premium / VIP / Founder" so the price feels intentional, not arbitrary. Each tier tag describes what the voter pays for (e.g. "Premium = your vote counts as 2 audience votes" if we want to bundle weighting).

**What changes by answer.**
- Locked $1 → simpler UI in `/host/contest/new`; one less variable to test; shapes the platform as a low-touch utility.
- Ranged → tier picker UI in wizard; clear labeling on voter page; tiered weighting becomes a feature option.
- Fully flexible → free-form input; risk of organizers setting absurd prices; founder must set hidden caps anyway.

**Decision:** _________________________

---

### Q5 — Geographic scope for v1.0

**Question.** Is v1.0 Medellín-only, Aburrá Valley (greater Medellín), Antioquia department, all of Colombia, or LatAm-ready?

**Why it matters.** Geographic scope determines: which legal jurisdictions apply (Habeas Data is national, but municipal regulations may apply for ticketed events); how we curate the influencer database in `growth.contacts`; which Twilio sender numbers we need; how we phrase the Trust page; what sponsors we pitch.

**Options.**

| Option | TAM | Marketing focus | Legal complexity | Operational complexity |
|---|---|---|---|---|
| **Medellín-only (default)** | ~2.5M people | Tight — single city narrative | Low — one set of bylaws, one DPA | Low — one city's WA Communities |
| **Aburrá Valley** (Medellín + Envigado + Sabaneta + Bello + Itagüí + La Estrella) | ~4M | Slight blur ("Medellín metro") | Low — same legal framework | Medium — multiple municipal venue licensees |
| **Antioquia department** (incl. Rionegro, Marinilla, Apartadó) | ~6.6M | "Paisa identity" narrative — strong cultural cohesion | Medium — different municipalities for venue rules | Medium — multiple WA Communities |
| **All of Colombia** | ~52M | Diluted | High — Costa-Caribe vs Pacific vs Andina cultural variance | High — multiple sender numbers, dialects |
| **LatAm-ready (CO + MX + AR + BR…)** | 600M+ | Lost | Very high — pt-BR localization, multi-currency, multi-tax | Very high — premature optimization |

**Recommended default:** **Medellín-only** for v1.0 (Phase 1 → 4). Aburrá Valley acceptable if a venue partner makes it natural. Antioquia in Phase 5. National Colombia + LatAm in 2027+.

**Why focus wins here.** mdeai's competitive advantage is "knows Medellín deeply" — losing that advantage by going broad is the classic premature-scaling trap. The platform technically works anywhere; the **playbook** doesn't.

**What changes by answer.**
- Medellín-only → Apify hashtag scrapers focus on `#medellin`, `#paisa`, `#laureles`; influencer enrichment limited to ~5k creators; founder can hand-curate top-200.
- Aburrá Valley → add `#envigado`, `#sabaneta`; ~8k creators; still hand-curatable.
- Antioquia → add Rionegro, Apartadó; ~25k creators; need automated tier scoring (Phase 2 work brought forward).
- Colombia / LatAm → completely different platform; defer to 2027 roadmap.

**Decision:** _________________________

---

### Q6 — Voter PII data retention

**Question.** How long do we keep `vote.votes`, `growth.contacts`, and `event.bookings` PII (phone, email, IP hash, device fingerprint) after a contest closes?

**Why it matters.** Colombia's Habeas Data law (Ley 1581/2012) requires (a) explicit consent for data collection, (b) clear purpose-limitation, and (c) deletion when purpose is fulfilled. "Indefinite retention because someday we might use it" is not legal. But too-aggressive deletion kills our ability to detect repeat fraud across contests, run year-over-year analytics, or recall a fraud actor from a prior incident.

**Options.**

| Option | Retention | Pros | Cons | Storage cost (5k contests) |
|---|---|---|---|---|
| **Minimal** — delete PII 30 days after contest closes | Phone/email/IP retained 30d post-close, then anonymized; aggregates kept forever | Cleanest legal posture | Lose cross-contest fraud detection; lose YoY voter analytics | ~negligible |
| **Default — 12 months** | PII retained 12 months post-close, then anonymized | Year-over-year analytics; cross-contest fraud detection | More data to protect; quarterly audit needed | ~$100/yr Supabase storage |
| **Extended — 24 months** | Industry-typical | Stronger fraud detection; longer marketing reach | Larger compliance surface; deletion-request volume scales | ~$200/yr |
| **Indefinite (until user requests deletion)** | Forever unless user acts | Maximum analytics value | Fails Habeas Data purpose-limitation; legal exposure | Grows unbounded |

**Recommended default:** **12 months from contest close** (anonymize, don't delete — keep aggregate stats). This is the median in Colombian e-commerce; gives us cross-contest fraud detection for the next-year repeat-contestant scenario; aligns with annual pageant cycle; legal counsel can defend it as "purpose-limited to YoY same-contest comparison."

**Hard requirement regardless of choice:** user-requested deletion in **30 days** (Habeas Data SLA). Implement at `/account/data` from Phase 1.

**What changes by answer.**
- Minimal → no fraud detection across contests; need to add a one-way hash retention anyway for repeat-fraud detection; effectively the default with extra steps.
- 12 months → default behavior; quarterly Postgres job anonymizes rows where `closed_at < now() - interval '12 months'`.
- 24 months → same job, longer interval; more legal scrutiny.
- Indefinite → not recommended; lawyer will say no.

**Decision:** _________________________

---

### Q7 — Founding-sponsor pricing

**Question.** Do we discount the first 5 (or 10) sponsors who sign during Phase 2, or do we hold the line on standard tier prices?

**Why it matters.** Phase 2's KPI is **5+ paying sponsors, $5k+ revenue, NPS ≥ 30**. The first 5 sponsors are the riskiest: no testimonials yet, no past ROI dashboard, no case study. Discounting reduces their hesitation. But discounts establish a price ceiling that's hard to lift, and over-discounting signals weakness.

**Options.**

| Option | First-5 sponsor pricing | Acquisition cost | Testimonial leverage | Future pricing risk |
|---|---|---|---|---|
| **Full price** ($500–$25k tiers as published) | 100% | $0 discount; harder to close | Smallest leverage | Cleanest ladder |
| **50% off first contest (default)** | 50% | $0–$12.5k revenue forgone × 5 = $0–$62k max | Strong — "sponsored 5 of the first 5 contests at $X off" | Mild — easy to reset to standard tier in Phase 3 |
| **Free for testimonial** | $0 | $2.5k–$125k forgone | Strongest — case studies, video testimonials, panel speakers | Significant — getting first paying customer becomes harder |
| **Equity-style "free + revenue share"** | $0 + 5% of attributed-vote revenue | Variable | Innovative narrative; long-tail income | High — operationally complex; legal exposure |

**Recommended default:** **50% off first contest, capped at first 5 sponsors per organizer's first contest**, contractually clear that subsequent contests are standard pricing. "Founding Sponsor of mdeai" badge on their dashboard + landing page footer for 12 months. This converts revenue dilution into marketing asset.

**Math.** If 5 founding sponsors avg Silver ($2k → $1k after 50% off) = $5k Phase 2 revenue (hits gate). At standard pricing it would be $10k. Net cost of program: $5k = 1 month run-rate of Phase 2 = acceptable acquisition spend for 5 case studies.

**What changes by answer.**
- Full price → fewer sponsors close Phase 2; gate slips by 2–3 weeks; testimonial leverage zero.
- 50% off (default) → gate hit on schedule; founding-sponsor narrative for press.
- Free for testimonial → fastest acquisition; but no Phase 2 revenue; KPI gate "$5k+ revenue" fails.
- Equity-style → too clever for Phase 2; defer to Phase 4 white-label tier.

**Decision:** _________________________

---

### Summary of the 7 decisions

| # | Question | Default recommendation | Cost of the wrong answer |
|---|---|---|---|
| Q1 | Phase 1 launch date | June 23, 2026 (7 weeks from PRD signoff) | Wrong = Phase 2 cascades; Twilio/legal slips |
| Q2 | Phase 1 resource model | Solo + Spanish QA contractor ($600) | Wrong = Spanish voice drift damages trust on day 1 |
| Q3 | First contest type | Restaurant Week (Best Bandeja Paisa Medellín) | Wrong = Phase 1 fraud scandal kills platform |
| Q4 | Pricing latitude | Ranged 4-tier ($0.50/$1/$2/$5 named) | Wrong = pricing chaos or revenue ceiling locked-in |
| Q5 | Geographic scope v1.0 | Medellín-only through Phase 4 | Wrong = premature scaling, competitive dilution |
| Q6 | Voter PII retention | 12 months post-close, then anonymize | Wrong = Habeas Data exposure or analytics blindness |
| Q7 | Founding-sponsor pricing | 50% off first contest, capped at first 5 | Wrong = $5k Phase 2 gate slips OR price ceiling locked |

**Action.** Schedule a 60-min founder review block this week. Walk through each question, write the **Decision** line, and lock the answers. Phase 1 kickoff begins the next business day. Any answer different from the default triggers a 30-min sync with eng to adjust `08-plan-audit-response.md` Phase 1 gates accordingly.

---

## 7. Real-world walkthroughs (5 use cases, the platform end-to-end)

### 7.1 "Reina de Antioquia 2026" — flagship pageant

> **Phase 4 capability — what fully-loaded looks like.**

**T-45.** Daniela publishes the event via `/host/event/new` in 25 min. 4 contests embedded. Stripe Connect onboarding completed. Postobón applies for Premium tier ($25k); Águila for Gold on Best Silletero ($5k); 6 local restaurants for Bronze contestant-sponsor ($500 each).

**T-30.** Apify nightly enrichment surfaces 1,800 Medellín influencers; Gemini + Hermes classify; top 200 prioritized. Workflow B sends 50/day compliant outreach. Reply rate 18%. 36 sign partnerships via Stripe Connect (1% kicker).

**T-21 to T-7.** Daily IG/TikTok posts (Post Bridge), 4-hourly WA Community broadcasts (OpenClaw → Twilio), per-event tracking links. Trust page at 12k pageviews — voters reading the formula.

**T-7 (voting opens).** 4 ticket tiers sold out (5,000 GA + 500 VIP + 30 Backstage). Each ticket grants 5 bonus votes.

**T-0 (finals night).** Live X thread auto-posted. Workflow D fires twice (fraud spikes from VPN clusters); admin one-taps shadow-block in Signal via Paperclip approval. Hybrid score: `0.5 × audience + 0.3 × judges + 0.2 × engagement`. Winner announced. Gemini generates 3 winner social posts in 60s; Post Bridge schedules them.

**T+1.** Postobón ROI dashboard: 1.2M impressions, 84k clicks, 18k attributed votes, attendance correlation +22%. Recap PDF delivered. Renewal conversation kicks off.

**Mdeai take:** ~$135k tickets × 5% + ~$24k paid votes × 20% + $66k sponsorships × 30% = **~$31k revenue from one event**. Run-rate cost ~$500/mo. Net contribution > $30k.

### 7.2 "Bandeja Paisa Week" — city-wide free contest (Phase 1 first launch)

**Setup.** 7-day restaurant-week event, no central venue. 340 Medellín restaurants seeded as `vote.entities`. Free RSVP "passport" tickets grant 7 free votes (one per day). Águila buys event-level Gold $10k. Each restaurant can buy contestant-Bronze $500 (28 do).

**Daily during.** Noon: OpenClaw broadcasts daily top-5 to 2,800-member foodies WhatsApp Community. Voters reply "1/2/3" via Twilio number → OpenClaw inbound hook → `vote-cast`. Twilio number = unique identity → free duplicate-vote protection.

**Result.** 14,200 votes cast over 7 days. Águila got 412k cross-surface impressions for $10k. 28 restaurants × $500 = $14k contestant sponsor revenue. Mdeai take: ~$1,800 paid votes × 20% + $7,200 sponsorship × 30% = **~$9k from one weeklong campaign**. ~zero ops involvement.

### 7.3 "Estéreo Picnic 2026" — multi-contest festival (Phase 4)

3-day music festival, `kind='festival'`. 4 contests embedded: Best DJ (audience-only), Best Stage Design (judges-only), Best Outfit (audience + 30% judge), Crowd Favorite (audience-only). 3 ticket tiers (15k GA + 1.5k VIP + 30 Backstage).

12 sponsors across tiers: Bavaria title $40k + 4 Gold contest sponsors @ $5k + 3 Silver category @ $2k + 4 Bronze contestant @ $500 = $66k sponsor revenue.

OpenClaw event mode: 4-hour broadcasts × 4 contests × 3 days = 36 broadcasts each carrying watermarked sponsor logos (rotated by weight). Live leaderboard on venue main screens between sets.

**Result.** ~120k votes cast. Attendance scans 14,800/16,500 = 90%. Bavaria ROI: 3.2M impressions, 240k clicks, 38k attributed votes. 4 of 12 sponsors upgrade for next festival.

**Mdeai take:** ~$135k tickets × 5% + ~$24k paid votes × 20% + $66k sponsorships × 30% = **~$31k**. Run-rate cost ~$500.

### 7.4 "Colombiamoda partner contest" — B2B fashion week tie-in

Inecmoda runs Colombiamoda annually. mdeai partners as the digital voting layer for "Best Emerging Designer". Colombiamoda gates contestant entry; mdeai handles voting + judging + sponsor activations.

**Why it works.** Colombiamoda has 50k attendees + 500 brand sponsors but no voting infrastructure. mdeai brings the engine, Inexmoda brings the audience. 50/50 sponsor revenue split.

**Phase impact.** This is a **Phase 4 white-label** play — Inexmoda gets their own subdomain `vota.colombiamoda.co`, their own Paperclip company, their own Stripe Connect account. mdeai earns 30% of sponsor revenue + 5% of paid votes.

### 7.5 Local Laureles bar's "Best DJ Wednesday" — micro-contest

Club Mansión runs a weekly "Best DJ" contest. 4 DJs, audience votes via free RSVP (no tickets, no Stripe). Single-night contest, single sponsor (Aguila $500).

**Why this matters.** Proves the platform works at the smallest scale — a 100-person bar, $500 sponsorship, 3 hours of voting. If this works, it works at every scale up.

**Phase impact.** Phase 1 capable. Daniela can configure this in 5 min via `/host/contest/new` (no event needed — contest can stand alone).

---

## 8. Out-of-band (signaling future expansion)

These are NOT in the v1.0 plan but worth noting so Phase 4 doesn't surprise:

- **Phase 5 — São Paulo expansion** (Q4 2026): same platform, pt-BR localization, Brazilian payment rails (Pix integration).
- **Phase 5 — Sports voting** (Q4 2026): "Best Local Football Team in Antioquia"; same `vote.*` schema; new vertical.
- **Phase 6 — Live-stream native** (Q1 2027): HLS player + chat + per-second leaderboard ticker overlay.
- **Phase 6 — AR voting at venue** (Q1 2027): camera scan QR → live AR overlay with current ranking.
- **Phase 7 — White-label per-organizer** (Q2 2027): full subdomain + branding + per-tenant Paperclip company.

---

## 8.5 Event Venue Management System (added 2026-05-03)

**Why this section.** Venues are a first-class concept in production events ("Hotel Intercontinental ballroom" vs "Club Mansión rooftop") and the seam between physical operations (chairs, AV, security) and digital ops (tickets, scans, sponsors). A dedicated venue system avoids duplicating venue data per event AND lets organizers track resources, staff, and rentals across multiple events at the same venue.

**Critical constraint.** Phase 1 ships **minimal venue support only** — a venue table + venue picker in the wizard. The full system phases in over Phases 2-4. Venue work MUST NOT delay Phase 1 ticketing launch.

### 8.5.1 Tier breakdown

| Tier | Phase | Capabilities |
|---|---|---|
| **Core** | 1 | `event_venues` table; venue picker in wizard; venue display on event detail; capacity tracking |
| **Operational** | 2 | Resource inventory (AV/catering/furniture); venue staff roster; availability calendar with conflict detection |
| **Enterprise** | 3 | Floor-plan + seating layouts; multi-event booking system; venue contracts + invoicing; venue-side CRM for repeat clients; analytics (utilization, revenue) |
| **AI-optimized** | 4 | Dynamic pricing recommendations; AI layout generation from event metadata; AI resource allocation given attendee profile |

### 8.5.2 Schema (5 new tables)

| Table | Phase | Purpose |
|---|---|---|
| `event_venues` | 1 (✅ in task 001) | Venue master record — name, address, geo, default capacity |
| `event_venue_resources` | 2 | Inventory of AV / catering / furniture per venue |
| `event_venue_staff` | 2 | Venue-side staff (security, AV tech, catering ops) — distinct from `event_stakeholders` (organizer-side) and `event_attendees` (paying customers) |
| `event_venue_availability` | 2 | Time windows when venue is open/blocked; iCal RRULE for recurring rules |
| `event_venue_bookings` | 3 | Multi-event bookings on the same venue with PostgreSQL `EXCLUDE USING gist` constraint preventing double-booking confirmed slots |
| `event_venue_layouts` | 3 | Floor plans + zones — references `event_media_assets` for the actual image/PDF |

**Relationships.**

```
events  ─── venue_id ──→  event_venues
                              ├──→  event_venue_resources    (1:N)
                              ├──→  event_venue_staff        (1:N)
                              ├──→  event_venue_availability (1:N)
                              ├──→  event_venue_bookings     (1:N) — also FK back to events
                              └──→  event_venue_layouts      (1:N)

event_orders / event_attendees / event_check_ins
  → continue to reference events.id (NOT venue.id) — venues are infrastructure,
    not the unit attendees buy into
```

The Phase 3 `event_venue_bookings` table is what enables a venue (e.g., Hotel Intercontinental) to host **multiple events from different organizers** without double-booking — the `EXCLUDE USING gist` PostgreSQL constraint prevents two confirmed bookings from overlapping.

### 8.5.3 Real-world walkthroughs

**Beauty Pageant — "Reina de Antioquia 2026 Finals" (Phase 1 venue use):**
> Sofía picks Hotel Intercontinental's Salón Real ballroom in `/host/event/new` Step 1. Phase 1 needs only: venue name + address + capacity 500. The hotel's contracted AV team handles equipment outside mdeai. Tickets sell with `events.address` denormalized to "Hotel Intercontinental, Calle 16 #28-51, Medellín". One venue, one event, no conflicts to detect.

**Restaurant Week — "Bandeja Paisa Week" (Phase 2-3 multi-venue):**
> Daniela's restaurant week spans **28 venues across Medellín** for one week. She needs Phase 2 features: each restaurant is an `event_venues` row; the parent "festival event" links to all 28 via a Phase 2/3 multi-venue extension (separate from this PRD). For Phase 1, she creates 28 separate single-venue events — clunky but works. Phase 3's `event_venue_bookings` formalizes "one festival → N venue slots".

**Music Concert — "Estéreo Picnic 2026" (Phase 3 enterprise):**
> 3-day festival at Parque Simón Bolívar with 4 stages (rooms in venue terms). Phase 3 `event_venue_layouts` defines stage zones; `event_venue_resources` tracks AV per stage; `event_venue_staff` covers security per stage; `event_venue_bookings` reserves the park for setup day -2 through teardown day +1. Without these, the Phase 1/2 schema can't model multi-stage festivals correctly.

### 8.5.4 New tasks (10 total — added to `tasks/events/prompts/`)

Per phase distribution:

| Phase | Tasks | Effort |
|---|---|---|
| Phase 1 (minimal) | 035 (venue picker in wizard — 0.5d add to task 002) | 0.5d |
| Phase 2 (operational) | 036 resources schema · 037 staff schema · 038 availability schema · 039 host-venue-management page | ~3.5d |
| Phase 3 (enterprise) | 040 layouts schema · 041 bookings + contracts schema · 042 venue analytics dashboard | ~3d |
| Phase 4 (AI) | 043 ai-venue-optimizer (pricing + scheduling) · 044 ai-venue-layout-generator | ~3d |
| **Total** | **10 tasks** | **~10 dev-days across phases 1-4** |

### 8.5.5 Constraints + risks

| Constraint / risk | Mitigation |
|---|---|
| **Phase 1 must NOT block on venue work** | Phase 1 venue support is a 0.5d add to task 002. `event_venues` table already in task 001. No blocker. |
| **Venue is a support system, not a standalone product** | All venue tables are `public.event_venue_*` (NOT a separate `venue.*` schema). Reuses existing organizer auth + existing media assets table. |
| **Conflict detection must be DB-enforced, not application-enforced** | Phase 3 task 041 uses PostgreSQL `EXCLUDE USING gist` constraint — race-safe by construction; cannot double-book even under concurrent inserts. |
| **Multi-tenant venues (one venue serving multiple organizers)** | Phase 3 — `event_venues.organizer_id` becomes nullable, ownership moves to a separate `venue_clients` association table. Defer until first venue partner asks. |
| **Existing `events.address` denormalization** | Stays. Legacy Google Places + Ticketmaster catalog rows keep `address`; new wizard-created events populate both `address` AND `venue_id`. Reads prefer venue when joinable. |
| **AI venue optimization (Phase 4) requires ≥30 days of utilization data** | Phase 3 analytics task (042) seeds the data; Phase 4 AI gates on data volume. |

---

## 8.6 Marketing + Growth System (Phase 2)

> **Full architecture:** [`social/01-postiz-openclaw.md`](./social/01-postiz-openclaw.md). **Full strategy:** [`growth-strategy.md`](./growth-strategy.md) §§3–7. This section captures the PRD-level requirements and acceptance gates.

### 8.6.1 Problem

Organizers create events and then scramble to promote them across 5+ disconnected tools: Canva for graphics, Instagram DM for influencer outreach, WhatsApp manually for broadcast, Mailchimp for email, a separate analytics tool for social metrics. Nothing connects. When a ticket sells, there's no way to trace it back to the Instagram reel or the WhatsApp broadcast that drove it.

mdeai closes the loop: **one campaign interface generates AI content, schedules via Postiz, executes outreach via OpenClaw, and attributes every ticket purchase + vote cast back to the campaign that drove it** — with sponsor ROI computed automatically.

### 8.6.2 Core principle — human approval gate (non-negotiable)

AI proposes → human previews → human approves → system executes.

This applies to every outgoing message, post, or broadcast without exception:
- Postiz scheduling: Gemini generates draft → admin reviews at `/admin/campaigns/:id` → admin approves → `postiz-schedule-posts` fires
- OpenClaw outreach: audience built → admin reviews sample messages → admin approves → `openclaw-send-outreach` fires
- No message leaves the platform without a `campaign_approvals` row with `status='approved'` and `approver_user_id` set

**Why.** A single mistranslated WhatsApp broadcast to 5,000 Medellín contacts could result in account suspension, brand damage, and regulatory complaint under Habeas Data (Ley 1581/2012). The approval gate is also the product's trust signal to organizers: "We never send without your explicit OK."

### 8.6.3 Marketing schema (Phase 2 — `marketing.*`)

Full schema specified in [`social/01-postiz-openclaw.md`](./social/01-postiz-openclaw.md) §3. Summary:

| Table | Purpose |
|---|---|
| `marketing.campaigns` | Campaign: name, event_id, status, budget_cents, target_channels |
| `marketing.campaign_channels` | Per-channel config: platform, postiz_account_id, daily_cap |
| `marketing.campaign_posts` | Individual posts: content, scheduled_for, provider_post_id, status |
| `marketing.campaign_assets` | Media: URL, type, Gemini image prompt, moderation_status |
| `marketing.campaign_audiences` | OpenClaw audience segments: openclaw_audience_id, size, filters |
| `marketing.campaign_contacts` | Individual recipients: identifier, status, opted_out_at |
| `marketing.outreach_messages` | Sent messages: contact_id, content, sent_at, delivery_status |
| `marketing.campaign_approvals` | Approval gate: step, status, approver_user_id, approved_at |
| `marketing.campaign_events` | Audit log: event_type, payload, created_at |
| `marketing.campaign_metrics` | Perf: post_id, likes, shares, reach, ctr (polled from Postiz every 6h) |
| `marketing.campaign_conversions` | Attribution: campaign_id, user_id, conversion_type, value_cents |
| `marketing.referral_links` | UTM: slug, campaign_id, clicks, conversions |
| `marketing.suppression_lists` | Opt-out: identifier, platform, reason, added_at |

All tables: RLS enabled, `updated_at` trigger, service_role write via edge functions only.

### 8.6.4 Edge functions (Phase 2)

| Edge function | Description | Trigger |
|---|---|---|
| `campaign-create` | Scaffold campaign + channel rows; link to event_id | Admin POST |
| `campaign-generate-plan` | Gemini (Flash, `responseJsonSchema` G1) generates 4-week content calendar for all channels | Admin POST (on-demand) |
| `campaign-approve` | State machine: `draft → pending_review → approved → executing → completed` | Admin POST |
| `postiz-schedule-posts` | `POST /public/v1/posts` to Postiz API for each approved post; stores `provider_post_id` | Triggered on `campaign_approvals.status = 'approved'` |
| `openclaw-build-audience` | Build segmented contact list from `marketing.campaign_audiences` criteria | Admin POST |
| `openclaw-send-outreach` | Send signed job envelope to OpenClaw gateway; stores job receipt | Triggered on outreach approval |
| `campaign-track-click` | Record `referral_links` + `sponsor.clicks` on `?ref=` UTM hit | GET (beacon) |
| `campaign-ingest-metrics` | Poll Postiz API for post metrics; upsert `campaign_metrics` | pg_cron every 6h |
| `campaign-generate-report` | Gemini generates sponsor-facing PDF performance summary | On-demand / post-event cron |
| `campaign-cancel` | Cancel all pending posts/outreach; update campaign status | Admin POST |

### 8.6.5 Social channels

| Channel | Tool | Phase | Approval gate |
|---|---|---|---|
| Instagram (feed + reels) | Postiz | 2 | Yes |
| Facebook (page + event) | Postiz | 2 | Yes |
| TikTok (draft-only for IG-linked) | Postiz | 2 | Yes |
| LinkedIn (B2B sponsor audience) | Postiz | 2 | Yes |
| YouTube (highlights, venue tours) | Postiz | 3 | Yes |
| WhatsApp (broadcast templates) | OpenClaw + Infobip | 2 | Yes for broadcast; No for transactional |
| WhatsApp (ticket confirm, OTP, reminders) | Infobip (transactional) | 1 | No — system-triggered |
| SMS (OTP) | Infobip | 2 | No — system-triggered |
| Email (ticket PDF, sponsor contract, ROI recap) | SendGrid | 1 | No — system-triggered |
| Reddit | Manual (CM) + UTM link | 3 | CM posts manually |
| Push (PWA) | Web Push API | 3 | No — system-triggered |
| Telegram | Telegram Bot API | 3 | No |

### 8.6.6 Growth loops (3 viral mechanisms)

**Loop 1 — Vote → Share → Referral**
Contestant votes trigger a share modal with `?ref=<placement_id>` UTM. Any ticket purchase or vote within 72h of clicking that link attributes to the referring voter. Voter earns a "Top Amplifier" badge (Phase 2) or discount code on next event (Phase 3).

**Loop 2 — Ticket → UGC → Discovery**
Ticket purchase triggers a "Share your spot" prompt: pre-written IG story + `#EventSlug2026` hashtag. OpenClaw monitors the hashtag; top 10 sharers get early-door access. Campaign metrics track how many new ticket sales originated from UGC.

**Loop 3 — Sponsor Content → Attendee → Re-engagement**
Sponsor-generated content (Gemini creative gen) is shared by the sponsor on their own channels. Their audience discovers mdeai events. Attribution via `referral_links` with sponsor-specific `?ref=sponsor_<org_id>` tracks how many new attendees arrived from sponsor amplification.

### 8.6.7 Acceptance criteria (Phase 2 marketing module)

- [ ] `marketing.*` schema live with all 13 tables, RLS enabled, indexes on FKs.
- [ ] `/admin/campaigns` lists campaigns by event; create flow scaffolds channel rows.
- [ ] `campaign-generate-plan` returns valid JSON matching `PostBundleSchema` (G1: `responseJsonSchema` required).
- [ ] Gemini content calendar covers: 8 IG posts, 4 TikTok, 2 Facebook events, 12 WhatsApp templates, 3 LinkedIn posts.
- [ ] No post reaches Postiz until `campaign_approvals.status = 'approved'` — verified by test that calls `postiz-schedule-posts` without approval row → 403.
- [ ] No outreach reaches OpenClaw without approval — same test pattern.
- [ ] `campaign-track-click` writes `referral_links` row + `sponsor.clicks` row (if `?ref=` maps to a placement) within 200ms.
- [ ] `campaign-ingest-metrics` polls Postiz, upserts `campaign_metrics`, logs to `ai_runs`.
- [ ] Suppression list enforced: contacts in `marketing.suppression_lists` never appear in outreach audience.
- [ ] Daily cap enforced: `campaign_channels.daily_cap` respected; no channel sends > cap/day.
- [ ] `npm run lint` zero new errors; `npm run build` clean; `npm run verify:edge` passes.

### 8.6.8 OpenClaw — corrected integration profile

> **Important correction from earlier docs.** Prior architecture described OpenClaw as a "messaging gateway receiving signed job envelopes." The correct description is below.

**What OpenClaw actually is:** OpenClaw is an open-source, self-hosted AI agent framework (the most-starred GitHub repo in history — 347k stars, April 2026). It runs on a $20/month VPS, connects natively to WhatsApp + Telegram + Discord + browser (Playwright), maintains persistent memory via local Markdown, can run cron jobs and webhooks, and can write its own skills from natural language descriptions. Full strategy: [`social/02-openclaw-strategy.md`](./social/02-openclaw-strategy.md).

**The 15 OpenClaw-powered features for mdeai:**

| # | Feature | When |
|---|---|---|
| 1 | WhatsApp AI Concierge (FAQ, ticket delivery, booking via WhatsApp) | Phase 1 fast-follow |
| 2 | Event Promotion Campaigns (WhatsApp/Telegram broadcast) | Phase 2 |
| 3 | Influencer Outreach via Browser (Instagram/TikTok DMs — no API needed) | Phase 2 |
| 4 | Referral + Viral Growth System (T+30min follow-up after ticket purchase) | Phase 2 |
| 5 | No-Show Recovery A6 (T-12h confirm/cancel; instant waitlist offer) | Phase 2 |
| 6 | AI Concierge — WhatsApp chat extension for event FAQ + bookings | Phase 1 fast-follow |
| 7 | Contestant Chase A7 (twice-weekly WA reminders for incomplete profiles) | Phase 2 |
| 8 | Sponsor Activation Campaigns (branded WA messages to opted-in attendees) | Phase 2 |
| 9 | Restaurant Promotion + Table Booking (dining event campaigns via WA) | Phase 3 |
| 10 | Post-Event Follow-up + Re-engagement (recap + next event preview) | Phase 2 |
| 11 | Brand Monitoring + Hashtag Tracking (browser scraping of IG/TikTok) | Phase 3 |
| 12 | Multi-Agent Content Factory (overnight: research → write → format) | Phase 3 |
| 13 | Autonomous Skill Creation (CM describes automation → OpenClaw builds it) | Phase 4 |
| 14 | CRM Follow-up (personalized re-engagement for 90-day inactive users) | Phase 3 |
| 15 | Real Estate + Rental Outreach (apartment price drop alerts) | Phase 4 |

**Integration updates (§4.2):**

| System | Phase | Integration | Auth |
|---|---|---|---|
| **Postiz** | 2 | Social scheduling (IG, FB, TikTok, YT, LinkedIn) via `POST /public/v1/posts` | Postiz API key in Supabase secrets |
| **OpenClaw VPS** | 1 fast-follow | Self-hosted AI agent on $20/mo Hetzner VPS. Receives approved jobs via Supabase Realtime + webhook. Executes: WhatsApp/Telegram/email broadcast, Instagram/TikTok DMs via browser, cron reminders, WhatsApp AI concierge. Returns receipts to `openclaw-delivery-webhook`. | HMAC-SHA256 signed payloads; `OPENCLAW_WEBHOOK_SECRET` in Supabase secrets |
| **Infobip** | 1 | Transactional WhatsApp only (ticket PDF confirm, OTP, staff check-in alerts) | Infobip API key |

**New edge functions added for OpenClaw:**

| Edge function | Description |
|---|---|
| `openclaw-delivery-webhook` | Receives per-message delivery status from OpenClaw VPS; upserts `marketing.delivery_logs`; processes opt-outs into `suppression_lists` |
| `openclaw-build-audience` | Builds consent-gated audience from `profiles` + `event_attendees`; hashes PII; writes to `campaign_contacts` |
| `openclaw-send-outreach` | Dispatches approved campaign job to OpenClaw VPS; validates `campaign_approvals.status='approved'` gate |

---

## 9. Approval

| Role | Name | Signoff |
|---|---|---|
| Product owner | (founder) | TBD |
| Engineering lead | (founder for Phase 1; +1 hire Phase 3) | TBD |
| Legal review (Habeas Data + pageant rules) | (Colombian counsel) | TBD before Phase 1 launch |
| Design (Trust page copy, Spanish review) | (Spanish-native reviewer) | TBD before Phase 1 launch |

PRD signed → Phase 1 kickoff begins.

---

## See also

- [`00-overview.md`](./00-overview.md) — initiative index
- [`01-contests.md`](./01-contests.md), [`02-openclaw-growth.md`](./02-openclaw-growth.md), [`03-sponsorship-system.md`](./03-sponsorship-system.md), [`05-unified-platform.md`](./05-unified-platform.md), [`06-trio-integration.md`](./06-trio-integration.md), [`07-ai-event-research.md`](./07-ai-event-research.md), [`08-plan-audit-response.md`](./08-plan-audit-response.md) — implementation specs
- [`10-roadmap.md`](./10-roadmap.md) — strategic roadmap (Now / Next / Later) derived from this PRD
