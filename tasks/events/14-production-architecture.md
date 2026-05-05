# Production architecture — events + contests + sponsorship + marketing + AI

> **BLUF (1 paragraph).** Production reference for mdeai's events platform. **Three layers** (Events foundation → Contests + Sponsorship monetization → AI orchestration intelligence) shipped in **four phases** (4w MVP → 5w monetization → 4w marketing → 6w AI agents). **Five Postgres schemas** (`event.* / vote.* / sponsor.* / growth.* / trio.*`). **Three runtimes** (Hermes = reasoning, OpenClaw = execution, Paperclip = governance) introduced incrementally — Phase 1 uses minimal AI; full trio only in Phase 4. **The competitive bet** is sponsor-ROI attribution + contests-inside-events + AI orchestration with hard governance gates — the gap Eventbrite, Luma, and Cvent each leave open. THIS doc is the canonical engineering reference; [`09-prd.md`](./09-prd.md), [`11-events-system-design.md`](./11-events-system-design.md), [`12-ai-events-features.md`](./12-ai-events-features.md), and [`13-ai-events-repo-audit.md`](./13-ai-events-repo-audit.md) provide deep-dive details for each section.

---

## 1. Summary

### What we're building (in one diagram)

```
┌─────────────────────────────────────────────────────────────────┐
│ INTELLIGENCE LAYER (Phase 4)                                     │
│ Hermes (reasoning) + OpenClaw (execution) + Paperclip (control)  │
│ AI features: planning · recommendations · fraud · ROI explainer  │
└────────┬───────────────────────────────────────────────┬─────────┘
         │                                                │
┌────────▼───────────────────────────┐  ┌─────────────────▼─────────┐
│ MONETIZATION LAYER (Phase 2-3)     │  │ DISTRIBUTION LAYER (P3)   │
│ Sponsor packages + activations      │  │ WhatsApp Communities      │
│ Contest voting + Trust page         │  │ Compliant outreach        │
│ Sponsor ROI dashboard + attribution │  │ Viral loops + referrals   │
└────────┬───────────────────────────┘  └────────┬──────────────────┘
         │                                        │
         └──────────────────┬─────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────────┐
│ EVENTS FOUNDATION (Phase 1)                                       │
│ Event creation · Tickets · QR check-in · Stripe Connect · Disco  │
│ One organizer self-serves; one event live; one Stripe payout     │
└──────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│ DATA FOUNDATION                                                  │
│ event.* + vote.* + sponsor.* + growth.* + trio.* (Supabase)      │
│ public.events stays as discovery catalog (don't merge)            │
└──────────────────────────────────────────────────────────────────┘
```

### Three core concepts (the architecture's truth)

1. **Events host contests host sponsors.** Not three separate products. One platform with FK relationships (`vote.contests.event_id` → `event.events`; `sponsor.applications.event_id`).
2. **AI is layered onto the foundation, not the foundation itself.** Phase 1 ships zero "AI agents". Phase 4 adds the trio. Don't market Phase 4 capabilities in Phase 1.
3. **Governance comes BEFORE autonomy.** Paperclip approval gates exist before Hermes auto-decisions. Auto-charging Stripe without admin tap = banned by design.

### Phased intro of the trio

| Phase | Hermes | OpenClaw | Paperclip |
|---|---|---|---|
| **1 — Events MVP** | None — Gemini direct calls only | 1 skill (Workflow C broadcast) | None |
| **2 — Contests + Sponsors** | None — Gemini direct | + outreach skill (manual trigger) | None |
| **3 — Marketing automation** | None still — Gemini direct | + multi-channel posting (Post Bridge) | Basic dashboards (issue tracking, no agents) |
| **4 — AI orchestration** | **First introduced** — reasoning + memory + sub-agents | + autonomous workflows (cron-driven) | **Full** — approvals + budgets + audit |

---

## 2. Feature breakdown

### 2.1 Core (Tier 1 — must build first; 10 features ranked by criticality)

| # | Feature | Phase | Score |
|---|---|---|---|
| 1 | **Event creation + public page** | 1 | 98 |
| 2 | **Ticketing + payments (Stripe)** | 1 | 97 |
| 3 | **QR tickets + check-in** | 1 | 96 |
| 4 | **Organizer dashboard + analytics** | 1 | 95 |
| 5 | **Email + WhatsApp confirmations + reminders** | 1 | 94 |
| 6 | **Event discovery (`/explore`)** | 1 | 94 |
| 7 | **Schedule / run-of-show** | 2 | 88 |
| 8 | **Mobile-first responsive (PWA)** | 1 | 92 |
| 9 | **Stripe Connect organizer payouts (T+7)** | 1 | 90 |
| 10 | **Spanish-Paisa localization** | 1 | 91 |

**Without these,** the product fails. Eventbrite + Luma both ship all 10 (Luma faster, Eventbrite more polished).

### 2.2 Advanced (Tier 2 — differentiators; makes money)

| # | Feature | Phase | Score |
|---|---|---|---|
| 11 | **Sponsor system + 5 placement types** | 2 | 99 (differentiator) |
| 12 | **Sponsor ROI tracking (impression → click → vote)** | 2 | **100 (unique)** |
| 13 | **Contests inside events (1st-class FK)** | 2 | **99 (unique)** |
| 14 | **Referral + viral loops (?ref links + bonus votes)** | 2 | 92 |
| 15 | **Trust page (legal-counsel-signed)** | 2 | 96 (release blocker) |
| 16 | **Hybrid scoring (50% public / 30% judges / 20% engagement)** | 2 | 95 |
| 17 | **Promo codes + discounts** | 2 | 88 |
| 18 | **Recurring events + community calendars** | 3 | 89 |
| 19 | **Waitlist + approval-based RSVPs** | 3 | 90 |
| 20 | **Community chat per event** | 3 | 87 |

**The differentiator stack.** Items 11–13 are what make mdeai different from Eventbrite + Luma combined. Items 14–20 are how mdeai matches Luma's community-first feel.

### 2.3 AI features (Tier 3 — competitive edge; ranked)

| # | Feature | Type | Phase | Priority |
|---|---|---|---|---|
| AI-1 | **AI Sponsor ROI Explainer** | Agent | 2 | Must-have |
| AI-2 | **AI Fraud Detection Agent** (vote bursts + ticket re-sale rings) | Agent | 2 | Must-have |
| AI-3 | **AI Event Planner Agent** (prompt → full event scaffolding) | Agent | 4 | High |
| AI-4 | **AI Marketing Agent** (drafts WA/email/social campaigns) | Agent | 3-4 | High |
| AI-5 | **AI Sponsor Matcher** (brands ↔ events ↔ audiences) | Agent | 4 | High |
| AI-6 | **AI Event Copy Generator** (title / description / FAQ) | Tool | 1 | Core |
| AI-7 | **AI Recommendation Engine** (events for users) | Tool | 1 | Core |
| AI-8 | **AI Photo / Asset Moderator** | Tool | 1 | Core |
| AI-9 | **AI Attendance Confirmation Agent** (T-12h reminders + classify replies) | Agent | 3 | Advanced |
| AI-10 | **AI Contestant Intake Chase Agent** | Agent | 3 | Advanced |
| AI-11 | **AI Recap Generator** (post-event PDF + 3 social posts) | Tool | 2 | Advanced |
| AI-12 | **AI Venue Layout Generator** | Tool | 4 | Backlog (NEW from 13-audit) |
| AI-13 | **AI Schedule Optimizer (CSP solver for festivals)** | Agent | 4 | Backlog (NEW from 13-audit) |
| AI-14 | **AI Brand-Safety Auto-Pause** | Agent | 4 | Advanced |
| AI-15 | **AI Voice Ops** (organizer commands by voice) | Agent | 4+ | Later |

### 2.4 Agent capabilities by runtime

#### Hermes (reasoning brain)

| Capability | Core (Phase 4 launch) | Advanced (Phase 5+) |
|---|---|---|
| Event planner agent | ✅ "Create restaurant week" → full draft | + Self-learning across past events |
| Sponsor matcher | ✅ Embed-based brand↔event fit | + Predictive ROI before purchase |
| Campaign strategy | ✅ Drafts marketing plan | + Bandit testing + auto-optimization |
| Analytics interpreter | ✅ Daily ROI narrative | + Multi-event trend analysis |
| Sub-agent fan-out | ✅ Parallel classification at scale | + Auto-generates new sub-agents on demand |
| Memory / curated knowledge | ✅ FTS5 cross-session recall | + Curator auto-prunes skill library |

#### OpenClaw (execution hands)

| Capability | Core (Phase 1 launch) | Advanced (Phase 4) |
|---|---|---|
| Leaderboard broadcast | ✅ Workflow C every 4h | + Per-segment broadcast (sponsor watermarked) |
| Outreach send-loop | Phase 2 — manual trigger only | ✅ Cron-driven with budget cap |
| Apify scraping (influencers) | Phase 2 — weekly | ✅ Daily enrichment + dedup |
| Social posting | Phase 2 — Post Bridge | ✅ Multi-platform parallel |
| Browser screenshot for broadcasts | ✅ Phase 1 | + Branded compositing (sponsor logos) |
| Inbound message handling | Phase 2 — reply-to-vote | ✅ Multi-channel with Hermes routing |

#### Paperclip (governance plane)

| Capability | Core (Phase 4 launch) | Advanced (Phase 4+) |
|---|---|---|
| Approval gates | ✅ Required for sponsor go-live, send-batches, shadow-blocks | + Multi-stage policies |
| Budget caps | ✅ Per-agent daily/monthly | + Cross-agent + multi-tenant |
| Issue tracking | ✅ One company per contest/event | + Auto-routing by skill/domain |
| Audit log | ✅ Every mutating action linked to actor + run-id | + Compliance reports auto-generated |
| Run-liveness watchdog | ✅ Detects stalled work | + Auto-recovery + alert |
| Pause/resume controls | ✅ Operator can stop bad automation in 1 tap | + Pre-emptive policy-based pauses |

---

## 3. Use cases (real-world, end-to-end)

### 3.1 Miss Elegance Colombia 2026 — Gala finals (Phase 1 launch event)

| Phase | Actor | Action | Tech |
|---|---|---|---|
| T-45 | Daniela (organizer) | Publishes event via `/host/event/new` (6-step wizard, 25 min) | event.events insert; Gemini hero copy |
| T-30 | Postobón (sponsor) | Applies for Premium $25k via `/sponsor/apply`; admin approves | sponsor.applications + .placements |
| T-30 | Contestants | Submit profiles via `/host/contest/:slug/apply` (10-step wizard) | vote.entities; Gemini photo moderation |
| T-21 | OpenClaw | Apify enrichment fetches 1,800 Medellín influencers; Gemini classifies | growth.contacts; Hermes embeds |
| T-14 | OpenClaw send-loop | 50/day compliant outreach (WA + email) to top-200 | growth.communications |
| T-7 | Voters | Vote opens — `/vote/:slug` page; phone OTP; 5-layer fraud | vote.votes; entity_tally trigger |
| T-0 | Door staff | Scan ticket QR at venue gate via `/staff/check-in` PWA | event.bookings; event.check_ins |
| Live | Camila (voter) | Casts vote on Laura; tally updates via Realtime in <2s; share modal | vote-cast edge fn; viral loop |
| Live | Fraud-scan cron | Detects 73-vote burst from VPN cluster; Paperclip alerts admin via Signal | trio.tool_runs; brand-safety pause (Phase 4) |
| T+1 | Postobón | Sees ROI dashboard: 412k impressions, 84k clicks, 18k attributed votes | sponsor.roi_daily; AI ROI explainer |
| T+7 | Stripe Connect | Settles delayed payout to Daniela's account | event.bookings.status='paid' |

**End-to-end: 14 system components, 4 actors, 2 agents (OpenClaw broadcast + fraud-scan cron in Phase 1; full trio in Phase 4).**

### 3.2 Bandeja Paisa Week — distributed restaurant week

| Phase | Action |
|---|---|
| Setup | Daniela publishes event with `kind='restaurant_week'`. 340 Medellín restaurants seed-imported as `vote.entities`. Free RSVP "passport" tickets. |
| Sponsor | Águila buys event-level Gold $10k; 28 restaurants buy contestant-Bronze $500 each |
| Daily | OpenClaw broadcasts noon top-5 to 2,800-member foodies WA Community |
| Engagement | Voters reply "1/2/3" via Twilio number; OpenClaw inbound hook → vote-cast |
| Outcome | 14,200 votes cast over 7 days; ~$9k mdeai revenue from one weeklong campaign |

### 3.3 Estéreo Picnic 2026 — 3-day music festival (Phase 3+ scope)

| Aspect | Implementation |
|---|---|
| Tickets | 3 tiers (GA $180 × 15k, VIP $450 × 1.5k, Backstage $400 × 30) |
| Embedded contests | 4 — Best DJ, Best Stage, Best Outfit, Crowd Favorite |
| Sponsors | 12 brands across 5 activation types (Bavaria title $40k + 4 Gold + 3 Silver + 4 Bronze) |
| AI ops | A6 (attendance confirm), A3 (4-hourly broadcast × 4 contests × 3 days = 36 broadcasts), AI optimizer |
| Result | ~120k votes; 90% attendance scan rate; ~$31k mdeai revenue |

### 3.4 AI Founders Medellín — networking meetup (Phase 3+ recurring)

| Aspect | Implementation |
|---|---|
| Format | Free RSVP, ≤50 attendees, recurring monthly |
| Sponsor | Single Bronze $500 from a job board → "Sponsored by" badge |
| Loop | Community calendar followers auto-notified; chat per event for pre-event intros |
| Outcome | Sponsor tracks 8 attributed signups in 30 days via `?ref=` |

---

## 4. Gap analysis — why GitHub repos fail and what mdeai must do differently

### 4.1 What 57 audited GitHub repos consistently miss

| Gap | % of repos missing | Why it kills production use |
|---|---|---|
| **Real payment processing (Stripe live)** | ~95% | Demo → no revenue → no business |
| **Sponsor system with ROI attribution** | 100% | The biggest unsolved category problem (40% of organizers can't prove sponsor ROI per Bizzabo 2026) |
| **Fraud defense (5-layer)** | ~98% | Buy-vote scandals destroy pageant platforms in days |
| **Compliance (Habeas Data, Stripe webhooks signed, RLS)** | ~90% | Production data leaks, GDPR fines, compromise |
| **Multi-tenant from day 1** | ~85% | Single-tenant demos don't scale to multi-organizer reality |
| **Approval gates / governance** | 100% | AI auto-charges, auto-blasts, auto-bans = real damage |
| **Stripe Connect organizer payouts** | ~95% | Organizers pick Luma over Eventbrite for instant cash flow |
| **Real evals on AI features** | ~98% | "looks great in demo, breaks in prod" pipeline |
| **Cost tracking on AI calls** | 100% | $2k/month bills with no observability |
| **Spanish-Paisa native (or any non-English)** | ~99% | Not relevant for English-speaking demos but fatal for Medellín |

### 4.2 The 5 reasons GitHub repos fail in production

1. **Built as class projects** (April 2026 cluster, ~35 of 48) — graduation deadline drives them; no maintenance after.
2. **GPT-3.5 wrappers** with no eval suite — accuracy unknown, cost unbounded.
3. **No fraud / governance** — voting platforms without anti-fraud are fraud waiting to happen.
4. **Front-end calls LLMs directly** — leaked API keys, no rate limits, no audit.
5. **Single-prompt "AI does it all"** — can't be tested, can't be governed, can't be improved.

### 4.3 What mdeai does differently

| Their pitfall | Our approach |
|---|---|
| Class projects | Production-shaped 5-schema design (53 tables across event/vote/sponsor/growth/trio) |
| GPT-3.5 wrappers | Gemini 3.x with eval pass-rates per AI feature (≥85% F1, 0 hallucinated numbers) |
| No fraud | 5-layer defense (Turnstile + nonce + DB rules + behavioral + Gemini AI) |
| Front-end LLM calls | Edge functions only, service-role JWTs scoped per schema |
| Single mega-prompt | Three-runtime split — Hermes (reasoning), OpenClaw (execution), Paperclip (governance) |
| No cost tracking | `ai_runs` + `trio.tool_runs` + budget caps + auto-pause |
| English-only | English-first product + Spanish-Paisa native voter surfaces |
| No payments | Stripe Checkout + Connect from Phase 1 |
| No sponsor ROI | Vote-attribution within 24h click→vote window — the category-of-one play |
| Single-tenant | Multi-event from day 1; multi-organizer Phase 4 |

---

## 5. Database architecture (5 schemas, ~53 tables)

Full canonical schema. Cross-schema FKs are nullable for additive migration.

### 5.1 event.* (Phase 1 — 5 tables)

```
event.events           — top-level event record (festival, gala, conference, restaurant_week)
event.venues           — physical or virtual locations; nullable FK to public.restaurants
event.tickets          — ticket types per event (GA, VIP, Backstage)
event.bookings         — one row per ticket purchased; QR token; bonus_votes_remaining
event.check_ins        — each scan event at venue gate (audit trail)
event.schedule_items   — per-day timetable (Phase 2)
```

Key constraints:
- `events.status IN ('draft','published','live','closed','cancelled','archived')`
- `tickets.qty_sold <= qty_total` (advisory-locked atomic updates)
- `bookings.qr_token UNIQUE` (server-signed JWT, single-use)
- `bookings.bonus_votes_remaining` decrements on `vote-cast` when `event_id` matches

### 5.2 vote.* (Phase 2 — 10 tables)

```
vote.contests          — root entity; nullable event_id FK; scoring_formula JSONB (default 0.5/0.3/0.2)
vote.categories        — sub-buckets within contest
vote.entities          — contestants/restaurants/etc; embedding for similarity
vote.votes             — append-only fact table; idempotency_key UNIQUE
vote.entity_tally      — materialized counter; weighted_total computed by trigger
vote.judges            — per-contest judge weighting
vote.scoring_criteria  — beauty/talent/Q&A weights
vote.judge_scores      — per-judge per-criterion
vote.fraud_signals     — L4/L5 detections + admin reviews
vote.paid_vote_orders  — Stripe paid voter votes (Phase 2)
```

Key invariants:
- Every `vote.votes` insert triggers `entity_tally` recompute (atomic via after-insert trigger)
- Hybrid scoring formula stored per-contest (default `{audience:0.5, judges:0.3, engagement:0.2}`)
- Shadow-blocked votes have `fraud_status='blocked'` → trigger sets `weight=0`

### 5.3 sponsor.* (Phase 2 — 9 tables)

```
sponsor.organizations    — brand entity (multi-application)
sponsor.applications     — one application per (org, event/contest, tier, activation)
sponsor.assets           — logos, videos, copy
sponsor.placements       — concrete render surfaces; rendered via <SponsoredSurface>
sponsor.impressions      — every render fires beacon
sponsor.clicks           — click + UTM redirect
sponsor.attributions     — vote/conversion linked back to placement (24h window)
sponsor.roi_daily        — rolled-up tile data (5min cron)
sponsor.invoices         — Stripe payment lifecycle (links to public.p1_payments)
```

Key flow:
1. Render → `impressions` row
2. Click → `clicks` row → 302 redirect with UTM
3. Vote within 24h → `attributions` row links `vote_id` to `placement_id`
4. Cron rolls up to `roi_daily` for fast dashboard reads

### 5.4 growth.* (Phase 2 — 9 tables, includes nielsberglund 5-table addition)

```
growth.contacts                    — influencers, journalists; embedding for kNN
growth.segments                    — saved filter spec
growth.outreach_campaigns          — channel + daily_cap
growth.outreach_messages           — legacy (will be merged into communications)
growth.referral_payouts            — Stripe Connect 1% kickbacks
growth.campaigns                   — nielsberglund: Campaign metadata
growth.communications              — channel-agnostic sends (email + WA + LinkedIn + Telegram)
growth.communication_recipients    — per-recipient tracking with provider message IDs
growth.marketing_assets            — flyers, reels, stories with version control
growth.asset_distributions         — where/when each asset was shared (with metrics)
```

### 5.5 trio.* (Phase 4 — 4 tables)

```
trio.tool_runs              — one row per agent run (Hermes/OpenClaw/Paperclip), with cost
trio.handoffs               — cross-tool delegation events (audit trail)
trio.approval_requests      — Paperclip approval mirror for fast queries
trio.budgets_today          — materialized view of daily costs per tool/domain
```

### 5.6 Cross-schema foreign keys (the integration points)

| FK | From → To | Phase | Purpose |
|---|---|---|---|
| `vote.contests.event_id` | → `event.events.id` (nullable) | 2 | Embeds contest in event |
| `event.bookings.user_id` | → `auth.users.id` | 1 | Ticket holder identity |
| `sponsor.applications.event_id` | → `event.events.id` (nullable) | 2 | Event-level sponsor |
| `sponsor.applications.contest_id` | → `vote.contests.id` (nullable) | 2 | Contest-level sponsor |
| `sponsor.applications.entity_id` | → `vote.entities.id` (nullable) | 2 | Contestant sponsor |
| `sponsor.attributions.vote_id` | → `vote.votes.id` | 2 | ROI attribution |
| `growth.outreach_campaigns.contest_id` | → `vote.contests.id` (nullable) | 2 | Contest-bound campaign |
| `growth.marketing_assets.event_id/contest_id/application_id` | → respective tables | 2 | Multi-parent asset library |
| `trio.tool_runs.domain_ref` | → various (`domain` discriminator) | 4 | Cross-domain run audit |

`public.events` (existing discovery catalog) stays separate — does NOT merge into `event.events` (different purposes per `13-audit` finding).

---

## 6. Workflows (4 end-to-end lifecycles)

### 6.1 Event lifecycle

```
[Draft] organizer fills wizard
  ↓
[Published] event public on /event/:slug
  ↓
[Promote] WhatsApp Community broadcasts (OpenClaw); referral links shared
  ↓
[Sell tickets] Stripe Checkout → ticket-payment-webhook → mint QR
  ↓
[Day-of: Live] door staff scans QR via /staff/check-in PWA
  ↓
[Closed] tickets stop selling at ends_at
  ↓
[Recap] Gemini generates PDF + 3 social posts
  ↓
[Stripe Connect payout] T+7 to organizer's connected account
  ↓
[Archived] event.events.status='archived'; data retained 12 months
```

### 6.2 Contest lifecycle

```
[Draft] organizer creates contest, links event_id (or standalone)
  ↓
[Setup] contestants apply via /host/contest/:slug/apply; admin moderates (ID + waiver + photo)
  ↓
[Approved] all entities have approved=true AND identity_verified_at NOT NULL
  ↓
[Live] vote-cast accepts votes; entity_tally trigger updates ranks; Realtime broadcasts
  ↓
[Fraud-scan loop] every 60s — Gemini classifies suspicious clusters; Paperclip approves shadow-block
  ↓
[Closed] votes stop; final weighted_total computed
  ↓
[Audit] admin reviews fraud_signals; edge cases adjudicated
  ↓
[Winner reveal] final standings public; congrats social posts auto-generated
  ↓
[Archived] vote.contests.status='archived'; PII anonymized at 12 months
```

### 6.3 Sponsorship lifecycle

```
[Apply] sponsor fills /sponsor/apply 4-step wizard; pays via Stripe Checkout (flat tiers)
  ↓
[Admin queue] Paperclip-style approval; AI moderation pre-check (Gemini)
  ↓
[Approved] sponsor.applications.status='approved'; Hermes drafts welcome message; OpenClaw sends
  ↓
[Active] at start_at, placements auto-flip to active=true; logos render via <SponsoredSurface>
  ↓
[Tracking] every render → sponsor.impressions; every click → sponsor.clicks → 302; vote within 24h → sponsor.attributions
  ↓
[Daily ROI] cron rolls up to sponsor.roi_daily; Hermes generates 3-sentence narrative explainer
  ↓
[Brand-safety auto-pause (Phase 4)] if fraud spike or controversy detected, placement pauses; admin one-tap resume
  ↓
[End_at] placements auto-deactivate; final invoice settled (CPL variable charge if applicable)
  ↓
[Recap] sponsor receives ROI PDF + branded social-asset for their own channels
  ↓
[Renewal] system surfaces "Top 3 events for next quarter" based on this performance
```

### 6.4 Marketing lifecycle (the Paperclip-orchestrated version, Phase 4)

```
[Plan] Hermes drafts campaign — channel mix, segment, daily cap, expected outcomes
  ↓
[Approve] Paperclip approval gate → admin one-tap or batch-approve first 100 sends
  ↓
[Execute] OpenClaw send-loop — Twilio + SendGrid + (Phase 4) Telegram with budget cap enforced
  ↓
[Inbound replies] OpenClaw routes to Hermes for sentiment classification
  ↓
[Adjust] if reply rate < target, Hermes proposes adjustment; admin approves; OpenClaw applies
  ↓
[Measure] daily Gemini-generated narrative; weekly summary issue in Paperclip
  ↓
[Pause if spend > cap] Paperclip auto-pauses; admin extends or stops
```

---

## 7. Agent architecture (DETAILED — the trio in production)

### 7.1 Hermes — reasoning brain

**Identity.** Self-hosted CLI + gateway by Nous Research. Persistent memory (FTS5 + USER.md + MEMORY.md). 40+ built-in tools + MCP. Sub-agent spawning via `execute_code`. Camofox anti-detection browser.

**Phase 4 init scope (core):**
- Event planner agent: "create restaurant week" → multi-step draft
- Sponsor matcher: pgvector kNN over `sponsor.organizations.embedding` × `vote.contests.embedding`
- Daily ROI explainer: read `sponsor.roi_daily`, narrate in plain Spanish-Paisa
- Sub-agent fan-out: parallel classify on inbound campaign replies

**Phase 5+ advanced:**
- Self-improving via Curator (auto-prunes outdated skills)
- Cross-event optimization (learns from past 6 events what time of day gets best engagement)
- Predictive ROI (forecasts sponsor performance before they buy)

**What Hermes NEVER does:**
- Never directly executes external API calls (always via OpenClaw)
- Never writes to user-facing surfaces without Paperclip approval
- Never persists state in private memory (Supabase is source of truth)

### 7.2 OpenClaw — execution hands

**Identity.** Self-hosted gateway routing AI agents across 18+ messaging channels (WhatsApp, Telegram, Discord, Signal, Slack, etc.). 5,700+ ClawHub skills. Browser + exec + cron tools.

**Phase 1 init scope (core):**
- One skill: leaderboard broadcast every 4h (Workflow C)
- Twilio WA template messages
- Headless screenshot capture

**Phase 2 expansion:**
- Apify scraping for influencer enrichment
- Outreach send-loop (manual trigger initially; budget-capped)
- Inbound message routing (reply-to-vote)

**Phase 4 advanced:**
- Cron-driven autonomous workflows
- Multi-platform parallel posting (Post Bridge / PostFast)
- Paperclip approval gate hooks before any "send" or "publish"
- Per-segment broadcasts with sponsor-watermarked screenshots

**What OpenClaw NEVER does:**
- Never makes content decisions (Hermes decides what; OpenClaw delivers)
- Never bypasses budget caps (hardcoded daily limits)
- Never charges Stripe (Paperclip approval required)

### 7.3 Paperclip — governance plane

**Identity.** Open-source orchestration platform. Multi-company / multi-tenant. Issues, approvals, budgets, audit logs. Heartbeat scheduler.

**Phase 4 init scope (core):**
- One company per active contest/event ("Miss Elegance Colombia 2026")
- Approval gates on: sponsor go-live, send batches, shadow-blocks, mid-event budget extends
- Daily routines: 9am health review wakes Hermes
- Budget caps: per-agent daily/monthly hard stops with auto-pause

**Phase 4+ advanced:**
- Multi-stage approval policies (e.g. Premium sponsor → CFO + admin)
- Cross-agent budget federation (Hermes + OpenClaw share $X/day pool)
- Auto-recovery on stalled runs
- Compliance reports (every mutating action linked to actor + run-id, exportable for audit)

**What Paperclip NEVER does:**
- Never executes work itself (delegates to Hermes/OpenClaw)
- Never bypasses its own approval rules (admin can override but it's logged)
- Never silently fails (always surfaces issue + alerts admin)

### 7.4 The communication patterns (cross-runtime)

| From → To | Pattern | Example |
|---|---|---|
| Paperclip → OpenClaw | Webhook on issue status change | "Issue moved to in-progress; trigger broadcast workflow" |
| Paperclip → Hermes | Heartbeat env (`PAPERCLIP_TASK_ID`) | "Wake up, work issue PAP-123, post comment, exit" |
| Hermes → OpenClaw | MCP tool: `openclaw.message_send` | Hermes drafts content; calls OpenClaw to deliver |
| OpenClaw → Hermes | MCP bridge — channels exposed as tools | OpenClaw forwards inbound WA → Hermes classifies sentiment |
| Any → Supabase | Service-role JWT, scoped by RLS per schema | Hermes reads `growth.contacts`; OpenClaw writes `growth.communications` |
| Any → Paperclip | REST `/api/issues/*` with run-id header | OpenClaw opens issue when something needs human eyes |

### 7.5 The "AI proposes, human applies" rail (NON-NEGOTIABLE)

Every action with money or brand implications passes through this gate:

```
1. Hermes computes recommendation + evidence
2. Paperclip opens approval issue; logs to audit trail
3. Admin reviews evidence; one-tap Apply or Reject
4. OpenClaw executes (only on Apply)
5. trio.tool_runs records the action with cost
6. Reversibility: every applied change has prior-state snapshot for one-click revert
```

---

## 8. Strategy plan (4 phases, ~19 weeks total)

### Phase 1 — Events MVP (4 weeks)

**Goal.** One organizer publishes Miss Elegance Colombia Gala Finals. 100+ paid tickets sold. Door QR scans work. Stripe Connect payout settles.

**Ships:**
- `event.*` schema (5 tables) + RLS
- `/host/event/new` 6-step wizard
- `/event/:slug` public page (mobile-first)
- `ticket-checkout` edge fn (Stripe + atomic inventory)
- `ticket-payment-webhook` (mint QR + email)
- `ticket-validate` + `/staff/check-in` PWA
- Stripe Connect organizer onboarding (T+7)
- `/host/event/:id/dashboard` Realtime tiles
- Calendar export ICS
- Admin moderation queue
- Trust page legal review (event-specific TOS + Habeas Data + counsel sign-off)

**AI usage:** Gemini direct calls only. **Zero Hermes. Zero Paperclip.** ONE OpenClaw VPS for ONE workflow (broadcast, if applicable).

**Acceptance gate:** 100+ tickets, ≥80% door scan rate, $0 fraud, Stripe Connect payout settled.

### Phase 2 — Contests + Sponsors embedded (5 weeks)

**Goal.** First paying sponsor sees attributable ROI. First contest ("Reina de Antioquia") embedded in the event.

**Ships:**
- `vote.*` schema (10 tables) — contests embedded via `event_id`
- `/vote/:slug` page + Realtime leaderboard
- 5-layer fraud defense (Turnstile + nonce + DB rules + behavioral + Gemini)
- Trust page (hybrid scoring 50/30/20 + counsel sign-off)
- Phone OTP (mandatory for voters)
- Identity verification flow for contestants
- `sponsor.*` schema + `/sponsor/apply` wizard
- Sponsor ROI tracking (impressions + clicks + 24h vote attribution)
- `growth.*` schema with nielsberglund 5-table addition
- AI sponsor creative generator + ROI explainer (Gemini direct)

**AI usage:** Still Gemini direct. **Hermes deferred. Paperclip deferred.**

**Acceptance gate:** 1k+ votes, 0 confirmed fraud, 5+ sponsors paying, $5k+ revenue, K-factor > 1.0.

### Phase 3 — Marketing automation (4 weeks)

**Goal.** Compliant outreach scales. Attendance + intake automations live. K-factor sustained > 1.0.

**Ships:**
- OpenClaw outreach send-loop (50/day cap, suppression list)
- Apify nightly enrichment for top-200 influencers
- Vote→Share viral loop with `?ref=` tracking
- Stripe Connect 1% referral kickbacks
- A6 attendance confirmation agent (T-12h WA template + Gemini classify)
- A7 contestant intake chase agent
- Multi-platform social posting (Post Bridge)
- Basic Paperclip dashboard for issue tracking (NO automation yet)
- Cross-event analytics in `/host/dashboard`

**AI usage:** OpenClaw expands. **Hermes still deferred.** **Paperclip introduced as dashboard-only** (issues + audit log; no approval gates yet).

**Acceptance gate:** 0 social account bans, K-factor > 1.0 over 7d, A6 ≥ 70% attendance confirmation rate.

### Phase 4 — AI orchestration (6 weeks)

**Goal.** Full trio live. AI agents earn their cost. CPL pricing validates.

**Ships:**
- `trio.*` schema
- Hermes VPS provisioned + paired
- Paperclip sidecar with company-per-contest setup
- Trio bridges (Paperclip → Hermes via heartbeat; Paperclip → OpenClaw via webhook; Hermes → OpenClaw via MCP)
- Approval gates on all sponsor-money actions
- Budget caps per agent (auto-pause at threshold)
- A1 daily health review routine
- A2 sponsor approval automation
- A4 outreach with budget-capped scaling
- AI sponsor optimizer (recommendations + one-click apply)
- Brand-safety auto-pause
- CPL pricing for sponsors (after 30+ days of attribution data)
- White-label per organizer (multi-tenant Paperclip companies)

**AI usage:** Full trio. Hermes orchestrates; OpenClaw executes; Paperclip governs.

**Acceptance gate:** 5+ concurrent contests, ≥1 CPL sponsor with measurable cost-per-vote, 14d trio uptime with no missed automations.

---

## 9. Safety + constraints model

### 9.1 What MUST require approval (Paperclip approval gate)

- Sponsor money charges (Stripe Checkout settle, CPL invoice, refund)
- Outbound to > 50 recipients/day on any compliant channel
- Brand placements going live (sponsor logo flips active=true)
- Fraud shadow-blocks at scale (cluster of > 20 votes affected)
- Mid-event budget extensions (campaign cap reached → admin authorizes more)
- Public communications during incidents (fraud spike, judge controversy)
- Rejection of sponsor applications (audit trail + reason required)
- Modification of `sponsor.applications.tier` or `pricing_model` after activation
- Campaign template changes (after 100 sends, locked unless approved)

### 9.2 What can be automated (no approval needed)

- Internal reports (daily / weekly digests to founders)
- Internal alerts (Signal pings to admin on suspicious activity)
- Cron broadcasts on opt-in channels (WA Community already opted-in)
- Photo moderation (with admin override path)
- Recap PDF generation
- Suggested optimizations (Hermes proposes; admin one-taps if applying)
- Audit log writes
- Calendar event creation in `event.schedule_items`

### 9.3 What NEVER to automate

- Refund processing (always admin-decided)
- Legal / compliance decisions (always counsel-reviewed)
- Press communications (always founder-authored)
- Replying to negative reviews (always founder-authored)
- Pricing changes mid-contest (would break trust)
- Adding new ticket types after sales opened (would confuse buyers)
- Cancelling events (always organizer-decided with refund handling)
- Removing voters or contestants (only admin via Paperclip with reason)
- Promoting/demoting judges (always organizer-decided)
- Public statements about other platforms or sponsors

### 9.4 Spam + abuse + brand prevention rules (hardcoded)

| Concern | Rule | Where enforced |
|---|---|---|
| Cold IG/TikTok DM | Forbidden — only after reply on email or WA first | OpenClaw skill branch logic |
| WA template-only first contact | Free-form unlocks 24h after recipient's reply | Twilio API behavior |
| Daily cap per channel | 50/day/sender (compliance) | `growth.outreach_campaigns.daily_cap NOT NULL` |
| Suppression list | Honor "stop / unsubscribe / no" replies within 24h | OpenClaw inbound watcher → Supabase update |
| Bounce rate | Auto-pause campaign at > 5% over 7 days | Cron-checked |
| AI invented URLs | Reject any output containing URLs not in allowlist | Regex validation in personalize step |
| Manual review for first 100/campaign | Hardcoded gate before scaling sends | Paperclip routine |
| Email unsubscribe link | Mandatory in every send | React Email template |
| Phone OTP rate limit | Max 3/hour/phone (Supabase native) | Supabase Auth |
| Fraud ratio per contest | Auto-pause if `confirmed_fraud / total_votes > 1%` | pg_cron + Paperclip |
| Sponsor brand-safety | Auto-pause placement if controversy fraud spike (Phase 4) | Hermes-watched + Paperclip approval to resume |

### 9.5 Cost-runaway prevention

| Risk | Hard cap | Where enforced |
|---|---|---|
| Twilio SMS OTP | 500/day | Twilio dashboard alert + Supabase rate limiter |
| Apify scraping | $30/mo (5 actors weekly) | Apify dashboard cap |
| Gemini API | $5/event/day in Phase 1; $50/event/day in Phase 4 | `ai_runs` daily aggregate + Paperclip pause |
| Hermes inference | $5/event/day in Phase 4 | `trio.tool_runs` budget cap |
| OpenClaw send-loop | $0.005/send × 50/day = $25/day max | OpenClaw skill enforcement |
| Stripe fees | 2.9% + $0.30 (variable) | Pass-through to organizer / sponsor |

---

## 10. Final recommendation + differentiation

### 10.1 What Eventbrite does well (we should match)

- Discovery marketplace at scale (`/explore` already mdeai's strength to extend)
- On-site hardware partnerships (Phase 3+ if needed; PWA scanner suffices for MVP)
- Reserved seating (Phase 3 add for theaters/galas)
- Established trust + brand recognition
- Eventbrite Ads in-marketplace promotion

### 10.2 What Luma does better (we will replicate)

- < 2-minute publish flow (we target < 5 min minimal, < 30 min full)
- Modern mobile-first event pages (we already have shadcn + Tailwind)
- Instant Stripe payouts (we ship T+7 default in Phase 1; configurable to instant)
- Built-in chat + CRM (Phase 3)
- Community calendars + followers (Phase 3)
- Free unlimited events on free tier (we'll match — 0% on free events; 5% on paid)

### 10.3 What 57 GitHub repos all fail at (mdeai's category-of-one)

| Gap | mdeai response |
|---|---|
| Sponsor ROI attribution to votes | `sponsor.attributions` 24h click→vote window with explainable AI |
| Contests inside events | First-class FK + Trust page + 5-layer fraud |
| AI orchestration with governance | Hermes + OpenClaw + Paperclip; "AI proposes, human applies" |
| Spanish-Paisa native + Habeas Data | Counsel-reviewed Trust page; voter surfaces in Paisa register |
| Hybrid scoring (audience + judges + engagement) | `vote.contests.scoring_formula` JSONB (50/30/20 default) |
| Multi-tier sponsor packages with guaranteed value | `sponsor.applications` with flat / CPL / CPA / CPM / hybrid pricing |
| Brand-safety auto-pause | Phase 4 Paperclip approval gate on controversy detection |
| Real evals on AI features | Per-feature pass-rate gates (≥85% F1, 0 hallucinations) |

### 10.4 The "10x" thesis in one sentence

> **mdeai is the events platform that pays organizers faster than Eventbrite, looks better than Luma, sells sponsors more effectively than Cvent, runs on AI nobody else has, speaks Paisa Spanish, and embeds contests as first-class — built first for Medellín, designed for LatAm.**

### 10.5 First-action recommendation

Don't reinvent. Execute the existing plan:

1. **Confirm the events-first pivot** is locked (per `08-plan-audit-response.md` if updated).
2. **Generate Phase 1 task prompts** (12 prompts, replacing the 15 contest-first prompts at `tasks/events/prompts/` which become Phase 2).
3. **Start Phase 1 with task 001** — `event.*` migration. Everything else cascades.
4. **Sign Phase 0 partnership** with Miss Elegance Colombia organizers in parallel (per `09-prd.md` §6 Q3).
5. **Hire Spanish QA contractor** ($600 for 30 hours over Phase 1) — protects voice quality from day 1.
6. **Reserve Phase 4 work for Phase 4** — don't introduce Hermes/Paperclip until Phase 1 + 2 + 3 ship.

---

## Sources synthesized

- [`09-prd.md`](./09-prd.md) — Product Requirements Document (750 lines)
- [`11-events-system-design.md`](./11-events-system-design.md) — events platform design (559 lines)
- [`12-ai-events-features.md`](./12-ai-events-features.md) — AI features deep-dive (413 lines)
- [`13-ai-events-repo-audit.md`](./13-ai-events-repo-audit.md) — 57-repo audit (451 lines)
- [`/home/sk/mde/github/eventraa/`](/home/sk/mde/github/eventraa) — deep-inspected MERN reference (Xenova local embeddings + 2-tier AI pattern)
- [`/home/sk/mde/github/event-playbook-skills/`](/home/sk/mde/github/event-playbook-skills) — B2B SaaS skill suite (5 skills, 6-dim eval framework)
- [`/home/sk/mde/github/event-planner-os/`](/home/sk/mde/github/event-planner-os) — OpenClaw skill (20+ event templates)
- [`02-openclaw-growth.md`](./02-openclaw-growth.md) — OpenClaw marketing
- [`03-sponsorship-system.md`](./03-sponsorship-system.md) — sponsor schema canonical
- [`06-trio-integration.md`](./06-trio-integration.md) — Hermes + OpenClaw + Paperclip runtime
- [`08-plan-audit-response.md`](./08-plan-audit-response.md) — phase plan
- Eventbrite, Luma, Cvent research (May 2026)
- TalkValue commercial reference ([trytalkvalue.com](https://trytalkvalue.com/))

---

## See also

- [`00-overview.md`](./00-overview.md) — initiative index
- [`tasks/events/diagrams/`](./diagrams/) — 16 mermaid diagrams (architecture / flows / schemas)
- [`tasks/events/prompts/`](./prompts/) — 16 task prompts (currently contests-first; will migrate to events-first when Phase 1 starts)
- [`/home/sk/mde/system.md`](/home/sk/mde/system.md) — PRD → diagrams → tasks → roadmap discipline
