# Strategic roadmap — mdeai Events + Contests + Sponsorship

**Doc owner:** mdeai.co founders
**Version:** 1.1 — May 3, 2026 (events-first amendment)
**Frame:** Now / Next / Later (with quarterly themes + RICE prioritization)
**Source-of-truth phase plan:** [`100-events-prd.md`](./100-events-prd.md) §0 amendment + [`08-plan-audit-response.md`](./08-plan-audit-response.md). Phase 1 reordered to events-first per [`index-events.md`](./index-events.md) §6 Decision: B (locked 2026-05-02).

> **May 3 amendment.** Phase 1 swaps from **Contest Engine** to **Events + Tickets MVP**. Contests move to Phase 2. The 7 contest-engine initiatives previously labeled 🟢 NOW are now 🟡 NEXT. See `100-events-prd.md` §0 for the binding decision.

> **Roadmaps communicate outcomes and bets, not Gantt contracts** (per [`roadmap` skill](../../.claude/skills/roadmap/SKILL.md)). Every "add" considers capacity. Dates are directional. KPI gates are real.

---

## 1. Vision (one sentence)

> By end of Q3 2026, mdeai.co is the default platform that Medellín event organizers, contestants, voters, and sponsors choose for any contest-bearing experience — because it bundles voting, ticketing, AI-generated marketing campaigns, and sponsorship ROI dashboards under one roof, in an **English-first product with Spanish-Paisa (es-CO) localization** for the Medellín audience. Every ticket purchase is traced to the campaign that drove it. Every sponsor sees real CPS, CPL, and CPA — not impressions.

---

## 2. Quarterly themes

| Quarter | Theme | What "winning" looks like by quarter end |
|---|---|---|
| **Q2 2026 (Apr–Jun)** | **Trust + first revenue** | Events MVP live; ticket sales for 1st event; 1 contest with 1k votes; 0% confirmed fraud; first sponsor onboarded with contracts signed; marketing campaign scheduler (Postiz) sending first social posts |
| **Q3 2026 (Jul–Sep)** | **Monetize + scale outreach** | Sponsorship + Marketing + Venue Ops all live; 5+ paying sponsors; $50k+ cumulative revenue; 1 ticketed event > 100 tickets; K-factor > 1.0; 3+ venues on platform; campaign → ticket attribution working |
| **Q4 2026 (Oct–Dec)** | **AI orchestration + multi-tenant** | Hermes + Paperclip wired; CPL pricing live; 5+ concurrent contests; first white-label organizer (Inexmoda or similar) |
| **Q1 2027 (Jan–Mar)** | **Geographic expansion + adjacent verticals** | Bogotá launch; sports vertical pilot; pt-BR localization scoping |
| **Q2+ 2027** | **Live-stream native + AR + sports + white-label scale** | Per-second leaderboard during live streams; venue AR; 5+ white-label organizers |

---

## 3. Now / Next / Later — outcome swimlanes

### 🟢 NOW (in flight Q2 2026 — Phase 1: **Events + Tickets MVP**)

**Theme:** First ticket revenue + ship-fast events foundation.

**Per [`100-events-prd.md`](./100-events-prd.md) §0 amendment, Phase 1 = events MVP (locked 2026-05-02).** Contest engine moves to Phase 2.

| Initiative                                                                                                                                                                                 | Outcome bet                                                              | Owner | RICE                                | Status       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ | ----- | ----------------------------------- | ------------ |
| **`event.*` schema migration** — ALTER `events` (slug + status + organizer_id + total_capacity) + NEW `event_tickets` + `event_orders` + `event_attendees`                                 | Foundation; unblocks all 8 downstream tasks                              | Eng   | R 10 · I 10 · C 10 · E 1 → **1000** | 🟢 in flight |
| **`/host/event/new` 4-step wizard** (Basics → Tickets → Review → Publish) with auto-save + Gemini description generator (propose-only)                                                     | Sofía publishes "Reina de Antioquia 2026 Finals" in ≤25 min from a phone | Eng   | R 10 · I 10 · C 9 · E 3 → **300**   | 🟢 in flight |
| **`/host/event/:id` organizer dashboard** — KPIs (sold/revenue/attended/no-shows) + attendee list + Realtime tiles + staff link generator                                                  | Organizer never opens Stripe Dashboard for daily ops                     | Eng   | R 9 · I 9 · C 9 · E 2 → **365**     | 🟢 in flight |
| **`ticket-checkout` edge fn** — Stripe Checkout session + `pg_advisory_xact_lock` atomic qty guard + idempotency                                                                           | Zero oversell under 50 concurrent buyers                                 | Eng   | R 10 · I 10 · C 10 · E 2 → **500**  | 🟢 in flight |
| **`ticket-payment-webhook` edge fn** — mint signed JWT QR + email PDF (`react-pdf` MIT — HE-3 §4.6.3) + .ics attachment via SendGrid                                                       | Camila gets her ticket within 2 min of paying                            | Eng   | R 10 · I 9 · C 9 · E 1 → **810**    | 🟢 in flight |
| **`ticket-validate` edge fn** — single-use door scan via atomic `UPDATE … WHERE qr_used_at IS NULL RETURNING`                                                                              | Zero double-entry under concurrent staff scans                           | Eng   | R 9 · I 9 · C 10 · E 1 → **810**    | 🟢 in flight |
| **`/staff/check-in/:event` PWA scanner** — installable, offline-first IndexedDB queue, jsQR camera                                                                                         | Andrés scans 240 QRs in 90 min on bad venue WiFi                         | Eng   | R 9 · I 8 · C 9 · E 2 → **324**     | 🟢 in flight |
| **`/me/tickets` + EventDetail extension** — internal `ticket-checkout` replaces external `ticket_url`; legacy events still work                                                            | Camila stops being redirected to Eventbrite                              | Eng   | R 10 · I 9 · C 10 · E 1 → **900**   | 🟢 in flight |
| **Chatbot event creation** — extend existing `ai-chat` edge fn with 3 new tools (`create_event_draft`, `add_ticket_tier`, `finalize_event_draft`); chat preview card → deep-link to wizard | Sofía creates event in ~5 min by typing one Spanish-Paisa sentence       | Eng   | R 9 · I 9 · C 8 · E 2 → **324**     | 🟢 in flight |

| **Minimal venue support** — `event_venues` table (in task 001) + venue picker step in `/host/event/new` wizard (task 035) | Sofía picks Hotel Intercontinental Salón Real once; venue lives separately from event so reuse Phase 2 | Eng | R 7 · I 6 · C 9 · E 0.5 → **756** | 🟢 in flight |
| **Gemini native SDK migration** (task 045) — `_shared/gemini.ts` from OpenAI-compat → `@google/genai@^1.0.0`; unlocks `responseJsonSchema`, `thinkingLevel`, tool combination, Maps grounding, image gen | Eliminates JSON parse failures across 5 edge fns; fixes 1 deprecation (`gemini-3-pro-preview`); unblocks all Phase 2-4 Gemini features | Eng | R 9 · I 9 · C 9 · E 2 → **365** | 🟢 in flight (P1.5 fast-follow) |
| **Gemini skill housekeeping** (task 046) — patch `.claude/skills/gemini/SKILL.md` line 387 (tool combination IS supported in Gemini 3 preview); add 3 missing reference files | Future tasks don't get bad guidance from a stale skill | Eng | R 5 · I 5 · C 9 · E 0.5 → **450** | 🟢 in flight (housekeeping) |

**Capacity:** 1 dev × **3.5 weeks** = ~140 dev-hours = ~16-17 dev-days. Initiatives sequenced; some parallel after schema lands (002 ‖ 004, 007 ‖ 008). If any slips → push date, do not parallelize across track boundaries.

**Phase 1 first revenue.** ~$3k expected from one mid-size event during the launch window. **First profitable phase from week 3** (vs $0 under earlier contest-first plan that didn't earn until Phase 2 sponsors closed at week 9).

**Why no contest engine in Phase 1.** Earlier plan's vote.* + hybrid scoring + Trust page + counsel sign-off + identity verification was 5+ weeks of work for $0 revenue while events tables sat unused. Per founder May 2 reset: events first (lower-risk MVP, reuses production infrastructure), contests second.

### 🟡 NEXT (Q3 2026 — Phases 2 + 3)

**Theme:** Layer contests + sponsorship onto the live events foundation.

**Phase 2 = Contest Engine** (the work that was Phase 1 in v1.0 of this roadmap). Phase 3 = Sponsorship + Growth. **Phase 1 events tables and ticket sales already live by Q3 start** — contest engine integrates by adding `vote.contests.event_id` FK to the existing `event.events` table.

| Initiative | Outcome bet | RICE | Phase |
|---|---|---|---|
| **Contest engine** — `vote.*` schema + `vote-cast` edge fn + `/vote/:slug` mobile-first + Realtime leaderboard + hybrid scoring trigger | Voting works on top of live events; Miss Elegance Colombia 2026 voting opens August 4 | R 10 · I 10 · C 9 · E 5 → **180** | 2 |
| **Trust page + Spanish legal sign-off** | Voters trust the platform on day 1 of voting; legal exposure mitigated | R 9 · I 9 · C 9 · E 2 → **365** | 2 |
| **5-layer fraud defense** (Turnstile + nonce + DB rules + behavioral + Gemini L5) | Strongest defense vs buy-votes scandal | R 8 · I 9 · C 9 · E 3 → **216** | 2 |
| **Phone OTP + identity verification** | Bot-account creation cost ↑ 10×; pageant contestants verified | R 8 · I 8 · C 9 · E 3 → **192** | 2 |
| **Pageant-specific Trust copy + Colombian counsel sign-off** | Explains "not a lottery" distinction (Ley 1581/2012 + Ley 643/2001) | R 10 · I 10 · C 9 · E 3 → **300** | 2 |
| **First contest seeded end-to-end** — Miss Elegance Colombia 2026 voting layer (free voting, Medellín-focused amplification) | Phase 2 acceptance gate; flagship case study for Phase 3 sponsor sales | R 10 · I 10 · C 9 · E 5 → **180** | 2 |
| **One sponsor surface (`contest_header`) — admin-configured** | Phase 2 demo can show sponsor logo without full wizard | R 7 · I 6 · C 9 · E 2 → **189** | 2 |
| **Operational venue tools** — `event_venue_resources` (036) + `event_venue_staff` (037) + `event_venue_availability` (038) + `/host/venues` management page (039) | Multi-event organizers track AV/catering/staff per venue; conflict detection prevents double-booking | R 8 · I 7 · C 8 · E 4 → **112** | 2 |
| **`sponsor.*` schema + 4-step apply wizard + admin queue** | Self-serve sponsor onboarding cuts sales cycle from 2 weeks to 2 days | R 9 · I 9 · C 9 · E 5 → **146** | 3 |
| **Enterprise venue system** — layouts (040) + bookings + contracts (041) + analytics dashboard (042) | Multi-event venue rentals; PostgreSQL `EXCLUDE USING gist` prevents double-booking; revenue/utilization tracking | R 7 · I 7 · C 7 · E 4 → **86** | 3 |
| **All 5 sponsor activation types** (`title_naming`, `category_powered_by`, `contestant_sponsor`, `venue_sponsor`, `digital`) | Brands buy across the bundle, not one-off | R 8 · I 8 · C 8 · E 6 → **85** | 2 |
| **Guaranteed-value packages** (Bronze/Silver/Gold default = fixed impressions + leads + content) | Sponsors trust early-stage data; CPL deferred until 30d data | R 8 · I 9 · C 9 · E 2 → **324** | 2 |
| **Sponsor ROI dashboard with Realtime tiles** | "Could my director see this?" passes | R 9 · I 9 · C 8 · E 5 → **130** | 2 |
| **`marketing.*` schema (13 tables)** — `marketing.campaigns`, `campaign_channels`, `campaign_posts`, `campaign_assets`, `campaign_audiences`, `campaign_contacts`, `outreach_messages`, `campaign_approvals`, `campaign_events`, `campaign_metrics`, `campaign_conversions`, `referral_links`, `suppression_lists` | Single campaign data model replaces 5 disconnected tools | R 9 · I 9 · C 9 · E 3 → **243** | 2 |
| **`campaign-generate-plan` edge fn** (Gemini Flash + `responseJsonSchema` G1) generates 4-week content calendar: 8 IG posts, 4 TikTok, 2 FB events, 12 WA templates, 3 LinkedIn posts | AI turns a 2-hour manual planning session into 2 minutes; human approves before any post fires | R 9 · I 9 · C 8 · E 2 → **324** | 2 |
| **`postiz-schedule-posts` edge fn** — `POST /public/v1/posts` to Postiz API (IG, FB, TikTok, YT, LinkedIn); stores `provider_post_id`; campaign approval gate (no post without `status='approved'`) | All social scheduling in one UI; 0 manual copy-paste to social tools | R 9 · I 9 · C 9 · E 1 → **729** | 2 |
| **OpenClaw VPS setup** — self-hosted AI agent (Claude Opus 4.7) on $20/mo Hetzner VPS; WhatsApp + Telegram + browser native channels; Supabase Realtime subscription for instant job dispatch; `openclaw-delivery-webhook` edge fn for receipt logging | WhatsApp AI concierge live day 1; broadcast capability without Twilio per-message cost | R 9 · I 9 · C 9 · E 2 → **365** | 1-fast-follow |
| **`openclaw-build-audience` + `openclaw-send-outreach`** — approved campaign job dispatch to OpenClaw; audience from `profiles` + `event_attendees`; daily 50/channel cap; suppression list enforced; HMAC-signed payloads | Compliant broadcast at scale; 0 account bans | R 8 · I 9 · C 9 · E 3 → **216** | 2 |
| **OpenClaw influencer outreach (browser automation)** — browser-based Instagram/TikTok DM outreach to Medellín micro-influencers (20 DMs/hour, randomized delays); no API needed; `sponsor-audience-match` identifies targets | Organic influencer reach without API access; 20% reply rate target | R 9 · I 8 · C 8 · E 2 → **288** | 2 |
| **OpenClaw WhatsApp AI concierge** — persistent 24/7 WhatsApp agent for FAQ, ticket delivery, booking, cancellation, referral prompts; incoming messages route to `ai-chat` edge fn for Gemini reasoning | Camila gets answers + ticket in WhatsApp without opening mdeai.co | R 9 · I 9 · C 8 · E 1 → **648** | 1 (fast-follow) or 2 |
| **OpenClaw A6 no-show recovery** — T-12h attendance confirmation with Confirm/Cancel reply; no-shows trigger instant waitlist offer to top waitlist buyer; reduces no-show rate 15-20% | Fills every sold event; waitlist buyer gets their chance | R 9 · I 9 · C 9 · E 1 → **729** | 2 |
| **`campaign-track-click` + `referral_links`** — `?ref=` UTM beacon writes `referral_links` + `sponsor.clicks`; attributes ticket purchases to campaigns | Every ticket traceable to the campaign that drove it; sponsor CPL calculation unblocked | R 9 · I 9 · C 8 · E 1 → **648** | 2 |
| **`campaign-ingest-metrics` cron (6h)** — polls Postiz API; upserts `campaign_metrics`; feeds campaign analytics dashboard + sponsor ROI tiles | Organizer + sponsor see real IG/FB/TikTok reach without leaving mdeai | R 8 · I 8 · C 8 · E 2 → **256** | 2 |
| **Vote→Share modal with `?ref=` UTM** | K-factor > 1.0; viral growth proven | R 9 · I 8 · C 8 · E 2 → **288** | 2 |
| **`growth.*` schema + nielsberglund 5 tables** — legacy outreach contacts + segments (supplements `marketing.*`) | Cross-contest contact database for re-engagement campaigns | R 7 · I 7 · C 9 · E 2 → **220** | 2 |
| **Compliant outreach** (WA template + email; daily 50/channel cap; suppression list) | 0 social account bans | R 8 · I 9 · C 9 · E 3 → **216** | 2 |
| **FingerprintJS + IP rotating salt** | Fraud Layer 4 hardened; 5-layer defense complete | R 8 · I 8 · C 8 · E 2 → **256** | 2 |
| **Vote→Share modal with `?ref=` UTM** | K-factor > 1.0; viral growth proven | R 9 · I 8 · C 8 · E 2 → **288** | 2 |
| **Stripe Connect for organizer payouts** (T+7 delayed) | Organizers can self-onboard without phone calls | R 8 · I 7 · C 8 · E 4 → **112** | 2/3 |
| **`event.*` schema + `/host/event/new` 6-step wizard** | Events become the umbrella, contests become children | R 9 · I 9 · C 8 · E 6 → **108** | 3 |
| **`ticket-checkout` + payment webhook + QR mint** | Tickets unlock votes; revenue stream #2 | R 9 · I 9 · C 9 · E 5 → **146** | 3 |
| **`ticket-validate` venue gate scan** | Door staff confirm attendance; no-shows auto-detected | R 8 · I 8 · C 9 · E 2 → **288** | 3 |
| **Organizer dashboard** with attendance + revenue + sponsor tiles | Daniela never opens Eventbrite again | R 9 · I 8 · C 8 · E 4 → **144** | 3 |
| **A6 attendance confirmation** (T-12h WA template + Hermes-replacement classifier) | -15%+ no-show rate | R 8 · I 7 · C 8 · E 2 → **224** | 3 |
| **A7 contestant intake chase** (twice-weekly automated reminders) | Recovers 15-25% of lost contestants during setup | R 8 · I 8 · C 8 · E 3 → **171** | 3 |
| **AI sponsor tools** (creative-gen, audience-match, ROI explainer) | Sponsors save agency invoices; renewal rate up | R 7 · I 7 · C 7 · E 4 → **86** | 2 |
| **Gemini Maps grounding + Tool combination** — venue-optimizer (task 043) and chatbot (task 009) gain `googleMaps` + `googleSearch` + custom-function multi-tool flows | Real-time Medellín venue rates + brand campaign data feed sponsor + venue recommendations | R 8 · I 8 · C 8 · E 3 → **170** | 2 |
| **Gemini Code Execution + Image Generation** — layout generator (044) writes Python for seat math; sponsor creative-gen via `gemini-3.1-flash-image-preview` | Replaces agency creative-gen invoices; layout proposals provably hit capacity targets | R 7 · I 7 · C 7 · E 3 → **114** | 3 |

**Capacity:** 1 dev + 1 community manager × 8 weeks. ~640 dev-hours. Phase 2 (4 wks) → Phase 3 (4 wks) sequential, not overlapping.

### 🔵 LATER (Q4 2026 + 2027 — Phase 4 and beyond)

**Theme:** AI orchestration → multi-tenant → adjacent verticals.

| Initiative | Outcome bet | Quarter |
|---|---|---|
| **Hermes Agent VPS + Supabase MCP** | Reasoning + memory layer for sub-agent fan-out | Q4 2026 |
| **Paperclip sidecar + multi-company** | Governance, budget caps, approval gates | Q4 2026 |
| **`trio.*` schema + cross-tool run logging** | Cost visibility + debug across runtimes | Q4 2026 |
| **Trio bridges (Paperclip ↔ OpenClaw, Paperclip ↔ Hermes)** | One control plane orchestrates all 7 automations | Q4 2026 |
| **A1–A7 ported to trio orchestration** (was OpenClaw + pg_cron) | Audit trail per heartbeat; budget hard stops | Q4 2026 |
| **Performance pricing — CPL/CPA via Stripe Connect variable transfers** | Sponsors pay for outcomes; mdeai earns 30% on top | Q4 2026 |
| **White-label per organizer** (subdomain + per-tenant Paperclip company) | First B2B partner: Inexmoda Colombiamoda | Q4 2026 |
| **AI venue optimization** — `ai-venue-optimizer` edge fn (043) for dynamic pricing + scheduling; `ai-venue-layout-generator` (044) for floor-plan suggestions | Venue managers get AI-recommended price + layout per event type | Q4 2026 |
| **Hermes Curator approved for 10 mdeai-specific skills** | Self-improving agent ecosystem | Q4 2026 |
| **Bogotá launch** (same platform, expanded influencer DB, local sponsorships) | Geographic expansion proof | Q1 2027 |
| **Sports vertical** ("Best Local Football Team in Antioquia") | Same engine, new market | Q1 2027 |
| **pt-BR localization scoping** (São Paulo) | Pre-Q4 expansion groundwork | Q1 2027 |
| **Live-stream native** (HLS player + chat + per-second leaderboard ticker) | Replaces "watch on YouTube + vote on mdeai" friction | Q1 2027 |
| **AR-aware QR voting at venue** | Walk up to a screen, scan QR, see live ranking in AR | Q2 2027 |
| **Recurring events** (monthly DJ contests, weekly bar competitions) | Subscription-style revenue from venues | Q2 2027 |
| **Multi-day festival mode** (parallel contests, multi-stage scheduling) | Estéreo Picnic / Festival Cordillera class events | Q2 2027 |
| **Ticket marketplace** (face-value-cap resale) | Reduce scalping; capture secondary-market revenue | Q3 2027 |

**Capacity:** Hire schedule: +1 dev (Q4 2026), +1 sales (Q4 2026), +1 designer (Q1 2027). ~2,400 dev-hours through end of 2027.

---

## 4. Cross-cutting bets (always-on)

These don't fit in a phase but get continuous investment:

| Bet | Why | Investment |
|---|---|---|
| **Spanish-Paisa voice quality** | Founder reviews first 100 AI outputs/month; corrections fed into Gemini system prompt | 4 hr/mo founder time |
| **Trust narrative** | Trust page updated with each new fraud-class detected and mitigated; quarterly transparency report | 8 hr/quarter |
| **Founder-led sponsor sales for first 10 sponsors** | Pricing latitude; testimonials; learn the objection list | 50% of founder time during Phase 2 |
| **Eval suite for AI features** | Every AI feature has a measurable pass-rate before production (per [PRD §3.3](./09-prd.md#33-evaluation-strategy)) | 1 day/feature |
| **Security posture** | Quarterly Supabase advisor + dependency audit + secret rotation | 1 day/quarter |
| **Founder mental health** | Burnout = company-killer. Phase gates with mandatory week-off between phases | 5 days/quarter |

---

## 5. Dependency map

```
[Phase 1] event.* schema → required by → [Phase 1] Ticket checkout, wizard, PWA scanner, buyer pages
[Phase 1] ticket-checkout + ticket-validate → required by → [Phase 1] First ticket revenue
[Phase 1] Trust page → required by → [Phase 2] First contest launch (legal blocker)
[Phase 1] Hybrid scoring → required by → [Phase 2] Trust page (formula displayed)
[Phase 1] Phone OTP → required by → [Phase 2] vote-cast (auth gate)
[Phase 1] vote.* schema → required by → [Phase 2, 3, 4] everything contest-related

[Phase 2] sponsor.* schema → required by → [Phase 2] Sponsor wizard, dashboard, contracts
[Phase 2] sponsor.contracts → required by → [Phase 2] Placement activation (no active=true without signed contract)
[Phase 2] marketing.* schema → required by → [Phase 2] Campaign builder, Postiz scheduling, OpenClaw outreach
[Phase 2] campaign-generate-plan → required by → [Phase 2] postiz-schedule-posts (must have content to schedule)
[Phase 2] campaign_approvals → required by → [Phase 2] postiz-schedule-posts + openclaw-send-outreach (hard gate)
[Phase 2] referral_links + campaign-track-click → required by → [Phase 2] sponsor CPL attribution
[Phase 2] sponsor.roi_daily (30+ days) → required by → [Phase 3/4] CPL pricing activation
[Phase 2] growth.* schema → required by → [Phase 2] Outreach, contact database
[Phase 2] Stripe Connect → required by → [Phase 3] Organizer payouts
[Phase 2] Vote→Share loop → required by → K-factor measurement (Q3 acceptance)
[Phase 2] campaign-ingest-metrics → required by → [Phase 2] Sponsor ROI tiles + campaign analytics dashboard

[Phase 3] Venue booking system → required by → [Phase 3] Venue SaaS subscription revenue
[Phase 3] A6 + A7 automations → unblock Phase 4 trio orchestration (port from OpenClaw to Hermes-orchestrated)
[Phase 3] campaign-generate-report → required by → [Phase 3] Sponsor ROI PDF recap emails

[Phase 4] trio.* schema → required by → all 7 automations (orchestrated version)
[Phase 4] White-label → requires → 30+ days of CPL data + at least 1 partner candidate (Colombiamoda 2026 finalists)
[Phase 4] CPL pricing → requires → 30+ days of sponsor.roi_daily

[Q1 2027] Bogotá → requires → all Phase 4 gates green + 2nd dev hired
[Q1 2027] pt-BR → requires → Bogotá launched (proves geographic-expansion playbook)
[Q1 2027] Sports vertical → requires → 1 partnership with local sports org
```

**Single-threaded risks** (only one person can do this; if they're out, work stops):
- Phase 1 Trust page + legal sign-off (founder + Colombian counsel)
- Phase 2 Twilio + WhatsApp Business API onboarding (founder + Twilio sales)
- Phase 4 Hermes/Paperclip operational ramp-up (eng — first hire bottleneck)

**Mitigation:** before each phase, identify single-threaded risks in the per-phase kickoff issue. Backup owners assigned. No phase advances with > 2 single-threaded risks open.

---

## 6. Capacity plan (honest)

| Week range | Phase | Headcount | Total dev-weeks |
|---|---|---|---|
| W1–W3 | 1 — Contest Engine | 1 dev (founder) | 3 |
| W4–W7 | 2 — Sponsorship + Growth | 1 dev + 1 community manager (CM hires W4) | 4 dev + 4 CM |
| W8–W11 | 3 — Events + Tickets | 1 dev + 1 CM + 1 part-time dev (5h/wk) | 4 + 4 + 0.5 |
| W12–W17 | 4 — AI Orchestration | 2 devs + 1 CM + 1 sales | 12 dev + 6 CM + 6 sales |
| **Total to v1.0** | | | **23.5 dev-weeks + 14 CM-weeks + 6 sales-weeks** |

Hires:
- **Community manager** (Phase 2 start): Spanish-native, Medellín-based, runs WA Communities + sponsor relationships.
- **Part-time dev** (Phase 3): contracts only; helps with `event.*` migration + ticket flow.
- **Full-time dev #2** (Phase 4): senior full-stack; owns Hermes/Paperclip integration.
- **Sales lead** (Phase 4): owns sponsor renewals + white-label B2B.

If founder-only beyond W3 — Phase 2 stretches from 4 weeks to 8 weeks. Plan for that as the **bear-case** schedule.

---

## 7. Risk register (top 10 rolling)

| # | Risk | Owner | Q2 status | Mitigation |
|---|---|---|---|---|
| 1 | Phase 1 misses calendar | Founder | 🟡 watching | Cut paid voting from Phase 1 if needed; ship free-only contest |
| 2 | Vote manipulation scandal | Founder | 🟢 mitigated | Hybrid scoring + Trust page + 5-layer fraud + brand-safety |
| 3 | Twilio number flagged spam | Eng | 🟡 watching | Warm-up gradient; rotate sender |
| 4 | Solo dev burnout | Founder | 🔴 high | Phase gates with mandatory rest; CM hire timed correctly |
| 5 | First contest fails to find 30 contestants | CM (when hired) | 🟡 watching | A7 chase agent + manual founder outreach for first 30 |
| 6 | Sponsor refund storm in Phase 2 | Founder | 🟢 mitigated | Guaranteed-value packages; refund/credit policy explicit |
| 7 | Hermes/Paperclip stability blocks Phase 4 | Eng | 🟡 watching | Defer Phase 4 if not ≥ stable releases by Q4 2026 |
| 8 | Colombia legal ruling reclassifies pageant voting as lottery | Legal | 🟡 watching | Quarterly counsel review; TOS does not promise prizes for paying voters |
| 9 | Apify ToS change blocks influencer scraping | Ops | 🟡 watching | Multi-actor strategy; manual fallback for top-50 influencers |
| 10 | Founder leaves the country / can't work for > 2 weeks | Founder | 🟡 watching | Documented runbooks; CM trained on incident response by end of Phase 2 |

---

## 8. Decision log (when we changed direction)

| Date | Decision | Why |
|---|---|---|
| May 1, 2026 | Renamed `tasks/contests/` → `tasks/events/` | Reflects the umbrella (events host contests) |
| May 1, 2026 | Adopted hybrid voting (50/30/20) as default | External audit signaled trust risk; we agreed |
| May 1, 2026 | Deferred Hermes + Paperclip to Phase 4 | Audit signaled over-engineering for MVP; we agreed |
| May 1, 2026 | Kept OpenClaw in Phase 1 (1 workflow only) | Audit said drop entirely; counter said $20/mo is too cheap to defer |
| May 1, 2026 | Kept Vite/React/shadcn (rejected Webflow) | 152+ existing components; switching cost > value |
| May 1, 2026 | Adopted nielsberglund 5-table campaign schema | Battle-tested + maps cleanly into `growth.*` |
| May 1, 2026 | Sponsor packages default to guaranteed-value, not CPL | Early-stage trust; CPL gated by 30d data |
| May 1, 2026 | Phone OTP enabled day 1 (not deferred) | Bot-creation cost ↑ 10× — too valuable to defer |

---

## 9. Communication plan

| Audience | Channel | Cadence | What we share |
|---|---|---|---|
| **Founders + 1 advisor** | Weekly 30-min call | Weekly | Phase progress vs gates; risk register; decisions needed |
| **Phase 2+ team (CM + part-time dev)** | Daily Telegram thread | Daily | Yesterday / today / blockers |
| **Sponsors** | Email + WA | Phase 2: weekly during contest, monthly off-season; Phase 4: real-time dashboard | ROI tiles, AI insights, recap PDFs |
| **Organizers** | Email + WA Community | Monthly post-Phase 3 | New features; case studies; pricing changes |
| **Voters** | Push + WA broadcast (event-bound) | Per-event | Voting reminders, results, share loops |
| **Public** | mdeai.co/changelog + LinkedIn + Twitter | Per release | Phase milestones; new use cases; transparency reports |
| **Industry observers** | Substack newsletter | Quarterly | Quarterly "state of the platform" with anonymized metrics |

---

## 10. How this roadmap evolves

**Monthly review** (last Friday of each month, 60 min):
- KPIs vs targets (5 from PRD §1.3 + 4 cross-cutting bets)
- Risk register updates (rotate top 10)
- Capacity reality check
- Add / reprioritize / cut initiatives based on actual signal

**Quarterly review** (last Friday of each quarter, full day):
- Theme retrospective (did we hit Q theme?)
- Update Now / Next / Later swimlanes
- Renew or revise vision sentence
- Board-style narrative for advisors

**Anti-pattern to avoid:** treating dates as commitments. We commit to KPI gates; calendar dates are forecasts. If a date slips and the gate is still green, don't panic. If a date slips AND a gate stays yellow for 2 weeks, it's a real problem.

---

## 11. Three-line elevator pitch (use when explaining the roadmap to anyone)

> **Now (Q2):** ship the Events + Tickets MVP — first ticket revenue from real events; first sponsor onboarded with signed contracts; AI campaign scheduler (Postiz) sending social posts; [Miss Elegance Colombia 2026](https://misseleganceco.com/) voting opens end of June.
> **Next (Q3):** layer on Sponsorship + Marketing + Venue Ops — the platform becomes a closed loop where every campaign is attributed, every sponsor sees real-time ROI, and venues book events without spreadsheets; K-factor > 1.0 from Vote→Share referral loop.
> **Later (Q4 + 2027):** add Hermes + Paperclip AI orchestration, CPL pricing for sponsors, white-label for partners (Inexmoda), expand to Bogotá and adjacent verticals (sports, restaurant week, festivals).

That's the entire 12-month bet in 3 sentences.

---

## See also

- [`100-events-prd.md`](./100-events-prd.md) — Product Requirements Document this roadmap derives from (§8.6 = Marketing + Growth System)
- [`08-plan-audit-response.md`](./08-plan-audit-response.md) — phase plan with detailed gates
- [`00-overview.md`](./00-overview.md) — initiative index
- [`growth-strategy.md`](./growth-strategy.md) — full 11-section growth + monetization strategy (Events + Marketing + Sponsorships + Venues + Restaurants + Growth loops)
- [`venue-playbook.md`](./venue-playbook.md) — venue strategy + 4-week execution sprint
- [`social/01-postiz-openclaw.md`](./social/01-postiz-openclaw.md) — Postiz + OpenClaw integration architecture (12-table schema + 10 edge functions)
- [`03-sponsorship-system.md`](./03-sponsorship-system.md) — sponsorship system design (sponsor.* schema + tasks S1–S14)
- [`roadmap` skill — strategic-planning](../../.claude/skills/roadmap/references/strategic-planning.md) (if installed)
- [`roadmap` skill — update-reprioritize](../../.claude/skills/roadmap/references/update-reprioritize.md) (if installed)
