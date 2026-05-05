---
id: INDEX-EVENTS
purpose: comprehensive map of every doc in tasks/events/ + diagram gap analysis + prompts reorder
last_reviewed: 2026-05-02
---

# Events initiative — master index

> **What this is.** Single map of all 55 markdown files under `/home/sk/mde/tasks/events/`. Use this as the entry point — it links every doc, calls out which are canonical, identifies missing diagrams, and proposes how to reorder the task prompts to match the user's events-first reset (May 2, 2026).

> **What this is NOT.** Not a re-statement of the PRD. Not a re-statement of the roadmap. It indexes those docs and flags gaps.

---

## 1. Reading order (90 minutes to fully brief)

If a new collaborator arrives cold, hand them this list:

| # | File | Why | Time |
|---|---|---|---|
| 1 | `00-overview.md` | BLUF + the single litmus-test scenario every doc must support | 5 min |
| 2 | `diagrams/16-current-supabase-erd.md` | What's actually in Supabase TODAY (44 tables; 12 events-relevant) | 5 min |
| 3 | `diagrams/17-current-data-flow.md` | How `/events` works today (real `useEvents` hook walkthrough) | 5 min |
| 4 | `diagrams/18-mvp-gap.md` | The exact 3-week gap from current → Phase 1 launch | 5 min |
| 5 | `15-user-stories.md` | 15 testable Phase 1 stories (organizer, attendee, door staff, admin) | 10 min |
| 6 | `14-production-architecture.md` | Synthesized architecture (10 sections, all phases) | 15 min |
| 7 | `100-events-prd.md` §1–§3 | Problem, personas, AI eval strategy | 15 min |
| 8 | `101-roadmap.md` | Now / Next / Later swimlanes with RICE | 10 min |
| 9 | `100-events-prd.md` §6 (Open questions) | 7 founder-decision blockers | 10 min |
| 10 | `prompts/000-index.md` | What gets built first | 10 min |

Anything beyond this is **deep reference** — read on demand, not front-to-back.

---

## 2. Top-level documents (`tasks/events/`)

19 files. Sorted by canonical/aspirational/superseded status to match real intent.

### 2.1 Canonical — read these first

| File | Lines | Type | Status | What it owns |
|---|---|---|---|---|
| [`100-events-prd.md`](./100-events-prd.md) | 1006 | PRD | **canonical** | Strict-schema PRD; 5 personas; 5 user-story epics; HE-1/HE-2/HE-3 audits; 7 founder-decision Open Questions |
| [`101-roadmap.md`](./101-roadmap.md) | 257 | Roadmap | **canonical** | Now/Next/Later × RICE; quarterly themes Q2 2026 → Q2 2027; capacity plan; risk register; decision log |
| [`14-production-architecture.md`](./14-production-architecture.md) | 757 | Architecture | **canonical** | 10-section synthesis; 5 schemas; trio runtime split; 5-layer fraud defense |
| [`15-user-stories.md`](./15-user-stories.md) | 405 | User stories | **canonical (Phase 1 only)** | 15 testable stories; 10 event types × Phase fit; story → schema → screen mapping |
| [`08-plan-audit-response.md`](./08-plan-audit-response.md) | n/a | Phase plan | **canonical (calendar)** | 4-phase sequential plan, the source-of-truth for *when* (audit response after external review) |

### 2.2 Domain implementation specs — read on demand

| File | Type | Owns |
|---|---|---|
| [`01-contests.md`](./01-contests.md) | Domain spec | `vote.*` schema + `vote-cast` edge fn + anti-fraud — the voting engine spec |
| [`02-openclaw-growth.md`](./02-openclaw-growth.md) | Domain spec | OpenClaw orchestration: discovery, outreach, social, broadcast workflows A/B/C/D |
| [`03-sponsorship-system.md`](./03-sponsorship-system.md) | Domain spec | `sponsor.*` schema + onboarding wizard + activations + ROI dashboard |
| [`05-unified-platform.md`](./05-unified-platform.md) | Domain spec | `event.*` schema + ticketing + venues + how events host contests + bundle sponsors |
| [`06-trio-integration.md`](./06-trio-integration.md) | Domain spec | OpenClaw + Hermes + Paperclip ownership matrix; `trio.*` schema; first 5 automations |
| [`07-ai-event-research.md`](./07-ai-event-research.md) | Research | 57-repo audit; nielsberglund 5-table campaign-schema adoption; A6/A7 automations |
| [`11-events-system-design.md`](./11-events-system-design.md) | Design | Events system design (`event.*` 5-table schema baseline before HE-1 audit) |
| [`12-ai-events-features.md`](./12-ai-events-features.md) | Design | AI event features per phase |
| [`13-ai-events-repo-audit.md`](./13-ai-events-repo-audit.md) | Research | 57-repo audit + Hi.Events deep inspection (3,767⭐ production reference) |

### 2.3 Index / orientation

| File | Type | Owns |
|---|---|---|
| [`00-overview.md`](./00-overview.md) | BLUF | Initiative overview + single-scenario anchor + stack reuse table |
| [`index-events.md`](./index-events.md) | Index | Master map (you are here) |
| [`notes.md`](./notes.md) | Notes | Working notes — not spec, not commitments |

### 2.4 Superseded by renumbering (May 2026)

| Old file | Superseded by | Why renumbered |
|---|---|---|
| `09-prd.md` | `100-events-prd.md` | Promoted to "100" tier to signal "the canonical PRD" — same content |
| `10-roadmap.md` | `101-roadmap.md` | Same — promoted to canonical roadmap |

> ⚠️ Some inbound links in older docs still reference `./09-prd.md` and `./10-roadmap.md`. These files no longer exist. Find-and-replace pass needed (see §11).

### 2.5 Redundant — slated for removal (per CLAUDE.md no-delete rule, requires explicit user OK)

| File | Status | Why redundant |
|---|---|---|
| [`02-openclaw.md`](./02-openclaw.md) | duplicate | Earlier verbatim copy; canonical version is `02-openclaw-growth.md` |
| [`04-roadmap.md`](./04-roadmap.md) | superseded | Pre-RICE combined-roadmap; canonical is `101-roadmap.md` (per `00-overview.md` note) |

> Per CLAUDE.md absolute no-delete rule, neither is deleted by Claude. Founder explicit consent required first.

---

## 3. Sub-folder: `diagrams/` (19 files)

Detailed index lives at [`diagrams/00-INDEX.md`](./diagrams/00-INDEX.md). Quick summary:

| Phase | Count | Diagrams |
|---|---|---|
| **CORE — Phase 1 (contest engine)** | 6 | 01 vote-cast-flow · 02 hybrid-scoring · 03 fraud-defense · 04 vote-schema · 05 identity-verify · 12 leaderboard-broadcast |
| **MVP — Phase 2/3 (sponsors + events)** | 6 | 06 sponsor-onboarding · 07 sponsor-roi · 08 outreach · 09 event-ticket-purchase · 10 event-creation-wizard · 11 integrated-schema-map |
| **ADVANCED — Phase 4 (AI orchestration)** | 3 | 13 trio-architecture · 14 a6-attendance · 15 ai-roi-optimization-loop |
| **REALITY — what's deployed today (May 2026)** | 3 | 16 current-supabase-erd · 17 current-data-flow · 18 mvp-gap |

**18 diagrams total + 1 index.** All render in GitHub markdown natively.

---

## 4. Sub-folder: `prompts/` (25 files = 1 index + 24 tasks)

Detailed index lives at [`prompts/000-index.md`](./prompts/000-index.md). All tasks renumbered 2026-05-03 — events first sequentially, then contests.

### 4.1 Phase 1 — Events MVP (001–009)

| # | Title | Surface | Effort |
|---|---|---|---|
| 001 | event-schema-migration (ALTER events + NEW event_tickets/orders/attendees) | schema | 1d |
| 002 | host-event-new-wizard (`/host/event/new` 4-step) | wizard | 3d |
| 003 | host-event-dashboard (`/host/event/:id` KPIs + Realtime) | dashboard | 2d |
| 004 | ticket-checkout-edge-fn (Stripe + atomic qty guard) | edge fn | 2d |
| 005 | ticket-payment-webhook (mint QR JWT + email PDF) | edge fn | 1d |
| 006 | ticket-validate-edge-fn (single-use door scan) | edge fn | 1d |
| 007 | staff-checkin-pwa (offline-first scanner) | PWA | 1.5d |
| 008 | me-tickets-page (`/me/tickets` + EventDetail extension) | page | 1d |
| 009 | chatbot-event-creation (extend `ai-chat` with 3 tools) | chatbot | 2d |
| **Subtotal** | **9 events tasks** | | **~14.5d ≈ 3 weeks** |

### 4.2 Phase 2 — Contest Engine (010–024) — deferred

| # | Title | Domain | Effort |
|---|---|---|---|
| 010 | vote-schema (10 tables + RLS) | contests | 1d |
| 011 | vote-cast-edge-fn | contests | 2d |
| 012 | vote-page-mobile (`/vote/:slug`) | contests | 2d |
| 013 | realtime-leaderboard | contests | 1d |
| 014 | hybrid-scoring-trigger (50/30/20) | contests | 1d |
| 015 | cloudflare-turnstile (L1 fraud) | contests | 0.5d |
| 016 | phone-otp (Supabase Auth) | contests | 1d |
| 017 | fraud-scan-cron (Gemini L5) | contests | 1.5d |
| 018 | contestant-intake-form (`/host/contest/:slug/apply`) | contests | 2d |
| 019 | admin-moderation-page (`/admin/entities`) | contests | 1.5d |
| 020 | gemini-photo-moderation | contests | 1d |
| 021 | openclaw-vps-provision | growth | 0.5d |
| 022 | leaderboard-broadcast-skill (Workflow C) | growth | 2d |
| 023 | pg-cron-backstop | growth | 0.5d |
| 024 | trust-page (`/vote/:slug/how-it-works`) | contests | 2d |
| **Subtotal** | **15 contest tasks** | | **~19d ≈ 4 weeks** |

**Observation:** Phase 1 is now events-first (9 tasks) per the May 2 reset. Phase 2 retains the original 15 contest tasks unchanged in content — only file numbers shifted. The two phases together = 24 tasks across 7 weeks of build time before any sponsor work begins.

---

## 5. Sub-folder: `sponsorship/` (1 file)

| File | Type | Owns |
|---|---|---|
| [`sponsorship/Sponsorship Opportunities.md`](./sponsorship/Sponsorship%20Opportunities.md) | Marketing | Pricing-tier deck for outbound sponsor sales (Bronze / Silver / Gold / Premium) |

---

## 6. Phase 1 scope inconsistency (must resolve before any code lands)

**The contradiction:**

| Source | What it says Phase 1 = |
|---|---|
| `100-events-prd.md` §1.2, §5.1 | **Contest Engine.** vote.* schema, hybrid scoring, Trust page, Phase 0 partnership with Miss Elegance Colombia |
| `101-roadmap.md` §3 NOW swimlane | **Contest Engine.** vote.* + vote-cast + leaderboard listed as 🟢 in flight |
| `08-plan-audit-response.md` (referenced as canonical) | **Contest Engine.** 4-phase sequential plan, contests first |
| `prompts/000-index.md` | **Contest Engine.** 15 contest-focused tasks, 0 events-MVP tasks |
| `diagrams/18-mvp-gap.md` (May 2 user reset) | **Events MVP.** 3 schema changes, 3 edge fns, 4 screens; events-only, no voting in P1 |
| `15-user-stories.md` (May 2 user reset) | **Events MVP.** 15 stories all about ticketing + door check-in; sponsors/contests stubbed for P2+ |
| `diagrams/16-current-supabase-erd.md` (May 2) | **Events MVP.** Frames `vote.*` as Phase 2 |

**Two camps live in this folder.** The PRD + roadmap (older docs, Q2 plan) say *contests-first*. The reality docs + user stories (newer, post-reset) say *events-first*. Both describe a 3-to-5-week Phase 1, but the deliverables don't overlap.

### 6.1 Resolution — the 3 options, real-world (founder decides)

Each option is presented with the 8 ingredients required by [CLAUDE.md §"Decision presentation must be real-world"](/home/sk/mde/CLAUDE.md). Pick A, B, or C in writing on the **Decision** line below.

---

#### 🟥 OPTION A — Reaffirm contests-first

> Keep `100-events-prd.md` + `101-roadmap.md` as canonical. Mark `15-user-stories.md` + `diagrams/16-18` as "Phase 2 reference only." Execute the existing 15 contest prompts.

**1. The week you'd live (5 weeks calendar, 19 dev-days).**
- **Day 1 (Mon):** call Miss Elegance Colombia, sign Phase 0 partnership (scoring formula, prize disclosure, finals logistics, brand placement). Schedule Colombian counsel meeting for Trust page sign-off (typical 1-week SLA).
- **Day 2:** write `supabase/migrations/<ts>_vote_schema.sql` (10 tables, RLS, indexes per `prompts/001`).
- **Day 3-4:** deploy `vote-cast` edge fn (`supabase/functions/vote-cast/index.ts`) — Turnstile + nonce + rate-limit + idempotency + L4 fraud rule.
- **Day 5-6:** build `/vote/:slug` mobile-first page (`src/pages/Vote.tsx`).
- **Day 7-8:** Realtime leaderboard subscription + `entity_tally` recompute trigger (50/30/20 hybrid scoring formula).
- **Day 9-10:** Phone OTP via Supabase Auth + Cloudflare Turnstile L1.
- **Day 11-13:** contestant intake `/host/contest/:slug/apply` + admin moderation `/admin/entities` + Gemini photo moderation edge fn.
- **Day 14:** provision OpenClaw VPS + pair to admin Signal.
- **Day 15-16:** Workflow C broadcast skill (Twilio WA every 4h) + `pg_cron` backstop.
- **Day 17-18:** Trust page `/vote/:slug/how-it-works` (Spanish-Paisa copy + counsel review running concurrent).
- **Day 19:** integration test, fraud-scan cron 1k-vote burst test.
- **Week 4 (days 20-22):** seed Miss Elegance contestants (30 × 5 photos + ID upload + admin moderation + counsel sign-off).
- **Day 23 (week 5):** open public voting at `mdeai.co/vote/miss-elegance-colombia-2026`.
- **End state:** 1 contest live, 1k votes, 0% confirmed fraud. **`mdeai.co/events` still redirects to external `ticket_url` for ticket purchases — no internal ticketing yet.**

**2. The dollar cost.**
- Phase 1 platform revenue: **$0** (free voting per Q3 decision in `100-events-prd.md` §6).
- Twilio SMS OTP: $0.05 × ~1,500 unique voters = ~$75.
- Twilio WhatsApp Business broadcast: ~$50/mo.
- OpenClaw VPS: $20/mo.
- Colombian counsel review for Trust page: **~$1,200–$1,500 one-time** (release blocker — must clear before voting opens).
- Spanish QA contractor (per Q2 default): $600 over 3 weeks.
- Gemini API (photo moderation + L5 fraud + content gen): ~$50/mo.
- **Phase 1 cash burn: ~$2,000–$2,500. Revenue: $0. Net: −$2,000.**
- Phase 2 (weeks 6-9) closes 1-2 sponsor deals against the live contest = $5k–$25k. Cash positive only at week 9+.

**3. The named-persona experience.**
- **Sofía (Miss Elegance organizer):** opens `/host/contest/miss-elegance-colombia-2026/apply` Wednesday week 4 to invite 30 contestants. By Friday she has 12 signed; A7 chase agent (per `07-ai-event-research.md`) reminds the rest. By week 5 day 1, all 30 verified. Voting opens day 23.
- **Camila (voter):** opens TikTok bio link to `/vote/miss-elegance-colombia-2026`. Phone OTP. Vote registers. Leaderboard ticks. **When she navigates to `/event/concierto-julio` and clicks "Get Tickets" — she's redirected to Eventbrite. mdeai earns $0.**
- **Daniela (a different organizer running a non-pageant event — say, a Laureles bar's DJ night):** visits `/host/event/new` → page doesn't exist. Tries `/host/contest/new` → forced to fit her event into a "contest" mold. **Has no clean path on mdeai.** Falls back to Eventbrite for ticketing.

**4. The code path.**
- 19 dev-days as already scoped in `prompts/001`–`015`.
- NEW `vote.*` schema (10 tables) — `supabase/migrations/<ts>_vote_schema.sql` (~600 LOC SQL).
- NEW edge fns: `vote-cast` (~600 LOC), `fraud-scan` (~400 LOC), `vote-shadow-block` (~150 LOC).
- NEW pages: `/vote/:slug` (~700 LOC), `/host/contest/:slug/apply` (~500 LOC), `/admin/entities` (~400 LOC), `/vote/:slug/how-it-works` Trust page (~300 LOC).
- Touches `useAuth.tsx`, `useRealtimeChannel.ts`. **Does NOT touch `EventDetail.tsx`, `Events.tsx`, `useEvents.ts`, `EventBookingWizardPremium`.**
- **Total ~6,500 LOC.**

**5. What you give up.**
- No internal ticketing for ~10 weeks (Phase 1 + Phase 2 sequential per `101-roadmap.md` §3). Phase 3 starts week 11 — that's when `event.*` ticketing schema arrives.
- The 4 existing rows in `payments` table stay at 4 until week 12+.
- `EventBookingWizardPremium` (already imported in `EventDetail.tsx` per `diagrams/17-current-data-flow.md`) stays partial / unused until Phase 3.
- The 44-table production Supabase including events/bookings columns sits idle for events use case for 10 weeks.
- Camila clicks "Get Tickets" and goes to Eventbrite for 10 weeks — mdeai earns $0 on that traffic.

**6. What's already done (sunk cost, all carries forward).**
- 15 task prompts in `prompts/010-024` — written, ready to execute. Wastes 0% of them.
- 6 CORE diagrams (`01-vote-cast`, `02-hybrid-scoring`, `03-fraud-defense`, `04-vote-schema`, `05-identity-verify`, `12-leaderboard-broadcast`). Wastes 0%.
- `100-events-prd.md` + `101-roadmap.md` need no rewrite — they already say contests-first.
- Phase 0 Miss Elegance Colombia partnership prep work (signed agreement → release blocker, but already in flight).

**7. The sceptic's question.**
> "You spent 5 weeks building voting infrastructure for $0 platform revenue, while a 44-table Supabase including events + bookings + payments primitives sat unused. The first time mdeai earns $1 from event ticketing is Phase 3 (~week 11). Why didn't you ship the lower-risk events MVP first, validate willingness-to-pay with real ticket sales, then layer voting on top in Phase 2 — when you'd have proven the platform works?"
>
> The honest answer: because the original PRD said so. That's a sunk-cost trap.

---

#### 🟩 OPTION B — Adopt events-first reset (recommended)

> Patch `100-events-prd.md` + `101-roadmap.md` with a "May 2 amendment" reframing Phase 1 as events-MVP. Reclassify the 15 contest prompts to Phase 2 (frontmatter flip only — no file moves). Generate 8 new Phase 1 events prompts per [`15-user-stories.md`](./15-user-stories.md) §9.

**1. The week you'd live (3 weeks calendar, 13 dev-days).**
- **Day 1 (Mon):** write `supabase/migrations/<ts>_event_schema_v2.sql` per [`diagrams/18-mvp-gap.md`](./diagrams/18-mvp-gap.md) — ALTER `events` (slug + status + organizer_id + total_capacity), NEW `event_tickets`, ALTER `bookings` (qr_token + qr_used_at + attendee_email + attendee_name + ticket_id).
- **Day 2-3:** NEW `ticket-checkout` edge fn (`supabase/functions/ticket-checkout/index.ts`) — Stripe Checkout session + atomic `qty_sold` increment via `pg_advisory_xact_lock`. Idempotency via existing `idempotency_keys` table.
- **Day 4:** NEW `ticket-payment-webhook` edge fn — mints signed JWT QR token, sends email via SendGrid with PDF (using `react-pdf`, MIT — per HE-3 §4.6.3 to avoid AGPL contamination from Hi.Events).
- **Day 5:** NEW `ticket-validate` edge fn — door scan single-use (sets `qr_used_at`).
- **Day 6-8:** NEW `/host/event/new` 4-step wizard with Gemini Flash description generator (3 variants, propose-only per `.claude/rules/ai-interaction-patterns.md`).
- **Day 9-10:** NEW `/host/event/:id` organizer dashboard with Realtime tiles (sold/attended/revenue).
- **Day 11-12:** NEW `/staff/check-in/:event` PWA scanner (offline-first, IndexedDB queue per `15-user-stories.md` S-D-3).
- **Day 13:** NEW `/me/tickets` page + extend `EventDetail.tsx` to call internal `ticket-checkout` instead of external `ticket_url`.
- **Day 14-15:** integration test (50 concurrent buyers on a 10-ticket tier → exactly 10 sold + 40 declined — 0 oversell). Lighthouse a11y ≥ 90 on 4 new screens. RLS audit. Phase 1 done.
- **End state:** Sofía (any event organizer) publishes "Reina de Antioquia 2026" event with 4 ticket tiers; Camila buys a $40 GA; Andrés scans her QR at the door; ticket marked used; Sofía sees the check-in in her dashboard live.

**2. The dollar cost.**
- Phase 1 platform revenue: **~$3,000 expected** from one mid-size event (mid-case: 200 GA × $40 × 5% take = $400; or 1k mixed tickets averaging $60 × 5% = $3,000). **First real revenue from events.**
- SendGrid email: $0 (free tier covers 100 emails/day).
- Stripe fees: 2.9% + $0.30/txn (passed to organizer; mdeai's net is the 5% take).
- Spanish QA contractor: $600 (same as Option A).
- Counsel review: **$0 in Phase 1** (no voting/lottery question; defer to P2 when contest layer ships).
- Gemini API (description generator + photo moderation): ~$30/mo.
- **Phase 1 cash burn: ~$700–$1,000. Revenue: ~$3,000. Net: +$2,000.** First profitable phase.

**3. The named-persona experience.**
- **Sofía (any event organizer — including Miss Elegance for ticket sales):** opens `/host/event/new` Tuesday morning. By 9:25, "Reina de Antioquia 2026 — Finals Night" is published with 4 ticket tiers (GA $40 × 1000, VIP $120 × 200, Backstage $400 × 30, Frontrow $80 × 100). She copies `mdeai.co/event/reina-antioquia-2026-finals` to her WhatsApp groups. By Friday: 73 GA + 12 VIP sold = $4,360 in Stripe. Her dashboard shows live updates.
- **Camila:** opens TikTok bio link to `mdeai.co/event/reina-antioquia-2026-finals`. Page loads 1.4s. Picks GA, enters name + email, taps Stripe Checkout, pays in COP. Email arrives in 90s with QR + .ics calendar attachment. Saturday night she shows QR at door; green ✓ on Andrés's scanner; she walks in. **mdeai earns 5% on her purchase.**
- **Andrés (door staff hired by Sofía):** opens staff link on phone (no login required, scoped JWT). Scans 240 QRs in 90 minutes. 3 fail (already used / wrong event). Counter at top shows `attended/sold = 240/250`.
- **Daniela (Laureles bar owner running "Best DJ Wednesday"):** uses the same `/host/event/new` to publish a free RSVP event. Sells 80 tickets at $0 just to get headcount. **Has a clean path on mdeai for the first time.**

**4. The code path.**
- 13 dev-days as already scoped in `15-user-stories.md` §9 mapping table.
- SCHEMA: 1 migration with 3 ALTERs + 1 NEW table — ~80 LOC SQL.
- EDGE FNS: `ticket-checkout` (~250 LOC), `ticket-payment-webhook` (~300 LOC including PDF gen via `react-pdf`), `ticket-validate` (~120 LOC). ~670 LOC total.
- PAGES: `/host/event/new` (~600 LOC), `/host/event/:id` (~400 LOC), `/staff/check-in/:event` (~350 LOC), `/me/tickets` (~200 LOC). Plus extend `src/pages/EventDetail.tsx` (~50 LOC delta to swap external link for `ticket-checkout` call). ~1,600 LOC.
- **Reuses** existing: `EventBookingWizardPremium` (already imported in `EventDetail.tsx`), `useEvents` hook, `useAuth.tsx`, 3-panel layout (`src/components/layout/`), shadcn/ui primitives (`src/components/ui/`).
- **Total ~2,350 LOC** — about **36% of Option A's volume**.

**5. What you give up.**
- No voting in Phase 1. Miss Elegance Colombia 2026's voting layer ships in **Phase 2** (~weeks 4-7). Their finals-night ticket sales still launch in P1.
- The 15 task prompts at `prompts/010-024` get reclassified `phase: CORE` → `phase: PHASE-2-CONTESTS`. **Frontmatter flip only — no file moves, no content rewrite.** All content survives.
- "Trust page legal sign-off" gate moves to Phase 2 — no Colombian counsel meeting in Phase 1.
- Miss Elegance Colombia partnership conversation reframes from "powering voting" to "powering ticketing first, voting second." Slightly weaker pitch on day 1 but they're still anchor partner.

**6. What's already done (sunk cost, mostly carries forward).**
- All 18 diagrams remain in use. `diagrams/16-current-supabase-erd.md`, `17-current-data-flow.md`, `18-mvp-gap.md` are the **direct** Phase 1 references. The contest diagrams (`01-15`) become Phase 2 references — wastes 0%.
- `15-user-stories.md` §9 mapping is the ready-to-go task spec — wastes 0%.
- `prompts/010-024` content survives — only `phase` field changes — wastes 0%.
- Existing infrastructure (44 Supabase tables, 14 edge functions, `EventBookingWizardPremium` component already imported, `useEvents` hook already deployed) **gets used immediately rather than sitting idle for 10 weeks.**
- `100-events-prd.md` + `101-roadmap.md` need a §0 "May 2 amendment" patch (~1 hour write-time) — not a rewrite.

**7. The sceptic's question.**
> "You promised Miss Elegance Colombia they'd be the Phase 1 flagship. Now their voting isn't ready until Phase 2. How do you keep them on board?"
>
> The honest answer: their finals-night ticket sales still ship in Phase 1 on `mdeai.co/event/reina-antioquia-2026-finals`. The contest **brand** stays anchor partner. The voting **layer** ships in Phase 2 — and now it ships *with* a real revenue story behind it (Phase 1 ticket sales worked), which strengthens the Phase 2 sponsor pitch ("we already sold $X of their tickets — sponsor a category and reach those buyers").

---

#### 🟨 OPTION C — Parallel tracks (Phase 1a + Phase 1b sequential)

> Phase 1a = events MVP (3 weeks). Phase 1b = contest engine (3-4 weeks). Total Phase 1 = 6-7 weeks before Phase 2 starts.

**1. The week you'd live.** 6-7 weeks calendar. Solo dev burn rate: 40 hr/wk × 7 wks = 280 hr — **2× the founder's safe weekly cap** per `101-roadmap.md` §7 risk #4 ("Solo dev burnout — HIGH likelihood / catastrophic impact"). The "parallel" framing is misleading: solo dev cannot run two tracks in parallel; this is sequential. So Option C is *Option B then Option A back-to-back* — the slowest ship of any option.

**2. The dollar cost.**
- Phase 1a revenue: ~$3k (per Option B).
- Phase 1b cash burn: ~$2,000 (per Option A) — minus the $1,500 counsel review (already paid? — depends on timing).
- **Total Phase 1 net: roughly +$1k. Worse than B alone, better than A alone.**
- Plus the hidden cost: **week 6-7 founder is operating in burnout-risk zone.** Not on the spreadsheet.

**3. The named-persona experience.** Same as B for first 3 weeks, then same as A for next 3-4 weeks. Sofía + Camila get ticketing in week 3; Miss Elegance voting opens in week 7. **2 launch announcements** (Phase 1a then 1b) — narrative gets diluted.

**4. The code path.** Option A + Option B = ~8,850 LOC over 6-7 weeks. Solo dev cannot maintain quality at that pace for that long.

**5. What you give up.** Founder mental health. Per `100-events-prd.md` §6 Q2 ("Resource model"), this option was already evaluated and rejected as "burns runway pre-revenue; over-investment." Resurrecting it without hiring a contractor is a regression.

**6. What's already done.** Same as A + B combined.

**7. The sceptic's question.**
> "Why are you parallelizing as a solo dev what one person should sequence? You picked the most expensive solution for a problem that the simpler solution would have solved."

---

### 6.2 Recommendation — Option B

**Why B over A:**
- **Faster:** 3 weeks calendar vs 5 weeks (40% faster to first launch).
- **Cheaper:** −$700 cash burn vs −$2,000 (65% lower spend in Phase 1).
- **Revenue-positive Phase 1:** +$3,000 expected vs $0. **First profitable phase from week 3 instead of week 9.**
- **Lower risk:** no fraud-defense complexity, no Colombian counsel sign-off as release blocker, no pageant-buy-vote-scandal exposure on day 1.
- **Honors the user's May 2 reset** ("focus on events system that is the important first phase").
- **Reuses existing production infrastructure** (44-table Supabase, `EventBookingWizardPremium`, `useEvents`) — code that's already deployed gets used immediately instead of sitting idle for 10 weeks.
- **Wastes nothing:** 15 contest prompts move to P2 with frontmatter flip; all 18 diagrams remain in use; PRD + roadmap need a 1-hour patch, not a rewrite.

**Why B over C:**
- C is the slowest, riskiest path. Founder solo at 40 hr/wk for 6-7 weeks crosses into burnout territory per `101-roadmap.md` §7.
- C's parallel framing is fictional — solo dev cannot parallelize. C is "B then A," which is just the slowest version of doing both.
- B preserves the Miss Elegance partnership AND creates a real revenue story BEFORE the contest layer ships, strengthening the Phase 2 pitch.

**The risk of picking B (be honest about it):**
- Miss Elegance Colombia hears "your voting isn't in Phase 1" and walks away from the partnership. **Mitigation:** call them this week and reframe — "your finals-night ticket sales launch June 23 on mdeai; voting goes live August 4 (Phase 2 week 1)." Their finals night isn't until October, so August voting goes live well before they need it.

**If founder picks B, next concrete step:** I draft the 8 new Phase 1 events prompts (numbered 001-009 per §8.2) in one session — ~3 hours. Existing 15 contest prompts get a `phase` frontmatter flip in the same session — ~10 minutes.

---

**Decision:** **B — Events-first MVP**

**Date locked:** 2026-05-02

**Founder rationale (paraphrased):** "Phase 1 is overbuilt. Strip it to events + tickets + orders + attendees + Stripe + QR. No voting, no AI fraud, no sponsor system, no advanced analytics in P1. Contests come later."

Phase 1 kickoff = unblocked. Action items:

1. ✅ Generated 9 Phase 1 events prompts (renumbered 2026-05-03 to **001–009**) — [`prompts/001`](./prompts/001-event-schema-migration.md) through [`prompts/009`](./prompts/009-chatbot-event-creation.md)
2. ⏳ Flip `phase: CORE` → `phase: PHASE-2-CONTESTS` on existing prompts 010–024 (frontmatter only — no content rewrite, no file moves)
3. ⏳ Patch `100-events-prd.md` §1.2 + §5.1 with "May 2 amendment" reframing P1 as events-MVP (~1 hr)
4. ⏳ Patch `101-roadmap.md` §3 NOW swimlane to lead with events ticketing (~30 min)
5. ⏳ Update `prompts/000-index.md` to show two-phase task split

Items 1 + 5 ship in this session. Items 2/3/4 in the next.

---

## 7. Diagram gap analysis — what's missing

Source: cross-referenced 100-events-prd.md sections vs `diagrams/` files. The 18 existing diagrams are heavy on contest engine + sponsor + trio, light on events MVP, refunds, taxes, and the new HE-1 schema additions.

### 7.1 Tier 1 — recommend creating now (Phase 1 critical)

| ID | Title | Type | Source PRD section | Why now |
|---|---|---|---|---|
| 19 | `EVENT-ORDERS-ATTENDEES-ERD` | erd | 100-events-prd §4.6.1 (HE-1) | The 5 Phase-1 must-add tables (orders, attendees, promo_codes, taxes_and_fees, order_refunds) need a visual. Today they're SQL-only in the PRD |
| 20 | `HOST-EVENT-WIZARD-FLOW` (events) | flowchart | 15-user-stories §2 S-O-1 | Different from existing diagram 10 (contest wizard). 4 steps: Basics → Tickets → Review → Publish |
| 21 | `STAFF-CHECKIN-PWA-OFFLINE` | sequence | 15-user-stories §4 S-D-3 | Service worker queue + IndexedDB; no current diagram for offline-first scan |
| 22 | `ORDER-STATE-MACHINE` | state | HE-1 §4.6.1 + 18-mvp-gap | `pending → paid → refunded → partial_refund → cancelled` — no state diagram exists yet |

**Effort to draft all 4: ~2 hours.** Each ~50–100 lines mermaid + frontmatter.

### 7.2 Tier 2 — create before Phase 2 starts

| ID | Title | Type | Source | Why later |
|---|---|---|---|---|
| 23 | `STRIPE-CONNECT-ORGANIZER-PAYOUT` | sequence | 100-events-prd §4.4 + 05-unified-platform | Phase 2/3 capability; not needed for P1 (mdeai keeps funds in P1) |
| 24 | `REFUND-FLOW` (full + partial) | sequence | HE-2 §4.6.2 + 18-mvp-gap §6 Non-Goals | Marked Phase 2 in user-stories — diagram before P2 kickoff |
| 25 | `PROMO-CODE-REDEMPTION` | flowchart | HE-2 §4.6.2 | Phase 1.5 if HE-2 audit accepted; Phase 2 otherwise |
| 26 | `TAX-VAT-CALCULATION` (Colombia IVA 19%) | flowchart | HE-2 §4.6.2 + risk register | Compliance-critical; defer unless HE-2 accepted |
| 27 | `BRAND-SAFETY-AUTOPAUSE-STATE` | state | 100-events-prd §4.5 + 5.2 | Triggered on confirmed-fraud spike or judge-resignation; Phase 2 capability |
| 28 | `GROWTH-SCHEMA-FIELD-ERD` (5 nielsberglund tables) | erd | 02-openclaw-growth + 07-ai-event-research | Phase 2 `growth.*` field-level — diagrams/00-INDEX already flagged this as TODO |
| 29 | `SPONSOR-SCHEMA-FIELD-ERD` (full) | erd | 03-sponsorship-system §3 | Phase 2 — diagrams/00-INDEX already flagged this as TODO |

### 7.3 Tier 3 — Phase 3+ (don't build yet)

| ID | Title | Type | Why defer |
|---|---|---|---|
| 30 | `EVENT-VS-CONTEST-RELATIONSHIP` | erd | Resolved when contest engine integrates with events |
| 31 | `MULTI-VENUE-RESTAURANT-WEEK-FLOW` | flowchart | Phase 2 multi-venue capability |
| 32 | `RECURRING-EVENTS-SERIES` | erd | Phase 2 capability |
| 33 | `MULTI-TENANT-WHITE-LABEL-ROUTING` | flowchart | Phase 4 — first white-label organizer signs |
| 34 | `LIVE-STREAM-NATIVE-PLAYER` | sequence | 2027 roadmap |
| 35 | `AR-VOTING-VENUE` | flowchart | 2027 roadmap |

### 7.4 Don't create — already covered

| Concept | Where it's already documented |
|---|---|
| Voter user journey | 100-events-prd §2.2 E1.1 walkthrough |
| Organizer user journey | 100-events-prd §2.2 E2 + 15-user-stories §2 |
| Judge journey | 100-events-prd §2.2 E5 |
| Phase Gantt | 08-plan-audit-response.md text + 101-roadmap §6 capacity table |
| 10 event types × phase fit | 15-user-stories §7 table |

---

## 8. Prompts reorder recommendation

Tied to §6 inconsistency. Two scenarios:

### 8.1 If founder picks Option A (contests-first)

No reorder needed. Current 15 prompts ARE Phase 1. Add Phase 2 prompts later for events ticketing. Existing `prompts/000-index.md` stays canonical.

### 8.2 If founder picks Option B (events-first — recommended)

**Step 1 — Reclassify existing 15 prompts as Phase 2.** No file moves yet (no-delete rule); update `prompts/000-index.md` frontmatter `phase: CORE` → `phase: PHASE-2-CONTESTS`.

**Step 2 — Generate 8 new Phase 1 events prompts.** Mapping comes directly from `15-user-stories.md` §9 story → schema → screen → effort table. Proposed numbering (100+ to avoid collision):

| # | Title | Story | Diagram | Effort |
|---|---|---|---|---|
| 100 | `event-schema-migration` (ALTER events + event_tickets + ALTER bookings) | S-O-1, S-O-2, S-A-3 | 18-mvp-gap + new 19 | 1 day |
| 101 | `host-event-new-wizard` (4-step) | S-O-1, S-O-2, S-O-3 | new 20 | 3 days |
| 102 | `host-event-dashboard` (`/host/event/:id`) | S-O-4, S-O-5 | extends 18-mvp-gap | 2 days |
| 103 | `ticket-checkout-edge-fn` (Stripe + atomic qty_sold) | S-A-3 | 09-event-ticket-purchase | 2 days |
| 104 | `ticket-payment-webhook` (QR mint + email + PDF via react-pdf) | S-A-3, S-A-4 | 09 + HE-3 §4.6.3 | 1 day |
| 105 | `ticket-validate-edge-fn` (door scan single-use) | S-D-2 | 09 | 1 day |
| 106 | `staff-checkin-pwa` (offline-first scanner) | S-D-1, S-D-2, S-D-3 | new 21 | 1.5 days |
| 107 | `me-tickets-page` (`/me/tickets` + QR display) | S-A-4 | implicit | 1 day |
| **Total** | | | | **~12.5 dev-days = ~2.5 weeks** |

Plus: extend `EventBookingWizardPremium` (already imported in `EventDetail.tsx`) to call `ticket-checkout` instead of external link → 0.5 day. Total ~13 days, matches the 15-day estimate in 18-mvp-gap.

**Step 3 — Update `prompts/000-index.md`** to show two phases:
- **Phase 1 (events MVP, ~3 weeks):** prompts 001–009
- **Phase 2 (contest engine, ~4 weeks):** prompts 010–024 (reclassified)

No file deletions. Existing prompts keep their content; only the phase label changes.

---

## 9. Numbering scheme (clarity on the 00–15 vs 100–101 split)

| Range | Convention | Examples |
|---|---|---|
| **00–15** | Domain spec docs (history, written one at a time as the initiative evolved) | 01-contests, 02-openclaw-growth, 03-sponsorship-system, 14-production-architecture, 15-user-stories |
| **100–199** | Canonical anchor docs (PRD, roadmap) — promoted from earlier numbers | 100-events-prd (was 09), 101-roadmap (was 10) |
| **diagrams/01–15** | Aspirational diagrams (per phase) | 01 vote-cast-flow → 15 ai-roi-optimization-loop |
| **diagrams/16–18** | Reality diagrams (current Supabase + gap) | 16 current-supabase-erd, 17 current-data-flow, 18 mvp-gap |
| **diagrams/19+** | (proposed) Phase 1 fill-in diagrams | (none yet — see §7.1) |
| **prompts/000-index** | Index | |
| **prompts/010–024** | Contest engine tasks (currently labeled Phase 1) | |
| **prompts/001-009** | Events MVP tasks (Phase 1) | renumbered 2026-05-03 from former 100-108 |
| **prompts/010-024** | Contest engine tasks (Phase 2) | renumbered 2026-05-03 from former 001-015 |

**Rule of thumb when adding a new file:**
- Domain spec → next available 00–15 slot
- New canonical anchor → 1xx range
- Diagram → next available diagrams/ slot
- Task prompt → 0xx for contest, 1xx for events MVP (under Option B)

---

## 10. Quick links by purpose

### "I'm a new dev — where do I start?"
1. `00-overview.md` (5 min)
2. `diagrams/16-current-supabase-erd.md` (5 min)
3. `diagrams/18-mvp-gap.md` (5 min)
4. `15-user-stories.md` (10 min)
5. `prompts/000-index.md` (10 min)

### "I'm the founder reviewing scope"
1. `100-events-prd.md` §6 — 7 Open Questions (15 min)
2. **§6 of THIS doc — Phase 1 inconsistency** (5 min)
3. `101-roadmap.md` Now/Next/Later (10 min)

### "I'm a sponsor / partner"
1. `00-overview.md` single-scenario anchor
2. `sponsorship/Sponsorship Opportunities.md`
3. `100-events-prd.md` §7 walkthroughs (5 stories)

### "I'm legal counsel"
1. `100-events-prd.md` §4.5 Security & Privacy
2. `100-events-prd.md` §6 Q3 (pageant decision + Ley 643/2001 + Ley 1581/2012)
3. `100-events-prd.md` §6 Q6 (PII retention)

### "I'm reviewing the codebase to plan a sprint"
1. `diagrams/18-mvp-gap.md`
2. `15-user-stories.md` §9 (story → schema → screen → effort)
3. `prompts/000-index.md` (current task list)

---

## 11. Summary — what to do next (priority order)

1. **Resolve §6 Phase 1 inconsistency** — founder picks Option A, B, or C. Until then, no code.
2. **If Option B picked:** generate the 8 Phase 1 events prompts per §8.2 (reuses existing user-stories doc for content).
3. **Create Tier-1 diagrams 19–22** (~2 hr, batch in one session).
4. **Patch broken `09-prd.md` / `10-roadmap.md` links** in older docs (find-replace `09-prd` → `100-events-prd`, `10-roadmap` → `101-roadmap`).
5. **Founder consent on `02-openclaw.md` + `04-roadmap.md` removal** — then archive (per CLAUDE.md no-delete rule).

Items 1 + 2 unblock Phase 1 dev. Items 3 + 4 + 5 are housekeeping that can wait one sprint.

---

## See also

- [`diagrams/00-INDEX.md`](./diagrams/00-INDEX.md) — diagram index (CORE / MVP / ADVANCED / REALITY)
- [`prompts/000-index.md`](./prompts/000-index.md) — task index (15 contest tasks; events tasks TBD per §8.2)
- [`/home/sk/mde/CLAUDE.md`](/home/sk/mde/CLAUDE.md) — repo conventions (especially the no-delete rule that explains why redundant docs aren't gone)
- [`/home/sk/mde/system.md`](/home/sk/mde/system.md) — phase discipline source (CORE → MVP → ADVANCED → PRODUCTION)
