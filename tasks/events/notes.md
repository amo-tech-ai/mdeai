create mermaid diagrams from the prd /home/sk/mde/.claude/skills/mermaid-diagrams /home/sk/mde/system.md add the mermaid diagrams to /home/sk/mde/tasks/events/diagrams

[create the tasks using the template /home/sk/mde/tasks/[tasks-template.md](http://tasks-template.md) add the tasks prompts to /home/sk/mde/tasks/events/prompts the tasks should use the skills 


/home/sk/mde/.claude/skills i have combined the events skills into one folder is it correct /home/sk/mde/.claude/skills/events]()


and for /home/sk/mde/.claude/skills/instagram-content-generation /home/sk/mde/.claude/skills/instagram-downloader /home/sk/mde/.claude/skills/instagram-marketing /home/sk/mde/.claude/skills/instagram-research /home/sk/mde/.claude/skills/instagram-scraper /home/sk/mde/.claude/skills/scrapesocial-instagram /home/sk/mde/.claude/skills/social-media-image-sizes /home/sk/mde/.claude/skills/social-media-image-sizes /home/sk/mde/.claude/skills/social-media-trends-research /home/sk/mde/.claude/skills/skill-creator how to best consolidate
/home/sk/mde/.claude/skills/social-media-trends-research


Tight phased requirements. Reality-grounded against what's already in your Supabase + codebase.

## CORE SETUP (foundation — mostly already done)

|Component|Status today|
|---|---|
|Supabase project (`medellin`, ACTIVE_HEALTHY)|✅|
|Auth (`profiles` 13 rows)|✅|
|Vite/React/shadcn app deployed|✅|
|Stripe (`payments` 3 rows, working)|✅|
|Gemini API in Supabase secrets|✅|
|Rate limiter (`rate_limit_hits` 59 hits)|✅|
|Idempotency keys, audit log, notifications|✅ all in schema|
|Twilio WhatsApp Business creds|⚠️ confirm provisioned|
|SendGrid creds|⚠️ confirm provisioned|

**Nothing new to install for Phase 1.** Just extend what exists.

---

## MVP (Phase 1 — 3 weeks · first event live)

|Layer|Delivery|
|---|---|
|**Schema**|Extend existing `public.events` (slug, status, organizer_id) · NEW `event_tickets` (id, event_id, name, price_cents, qty_total, qty_sold) · extend `public.bookings` (qr_token, qr_used_at, attendee_email)|
|**Backend**|3 edge fns — `ticket-checkout` (Stripe + atomic qty) · `ticket-payment-webhook` (mint QR + email) · `ticket-validate` (door scan)|
|**Frontend**|Extend `EventDetail.tsx` w/ buy CTA · NEW `/host/event/new` (create) · NEW `/host/event/:id` (dashboard) · NEW `/staff/check-in/:event` (PWA)|
|**AI**|2 Gemini direct calls — event description generator + hero photo moderation|
|**Workflows**|(1) organizer create → publish (2) attendee buy → QR by email (3) door scan → mark attended (4) organizer dashboard view|
|**Automations**|1 only — Stripe webhook → mint QR → SendGrid email|

**Acceptance:** 1 organizer publishes 1 event, 100+ tickets sold, ≥80% door scan rate, 0 fraud, Stripe Connect payout settles.

---

## POST-MVP (Phase 2 — 4 weeks · sponsors + contests)

|Layer|Delivery|
|---|---|
|**Schema**|NEW `vote.*` (contests, votes, entity_tally, judges) · NEW `sponsor.*` (applications, placements, impressions, clicks, attributions)|
|**Backend**|`vote-cast` · `sponsor-application-create` · `sponsor-checkout` · `sponsor-attribute` (24h click→vote) · `fraud-scan` cron|
|**Frontend**|`/vote/:slug` (mobile-first) · `/sponsor/apply` 4-step wizard · sponsor ROI dashboard · Trust page (`/vote/:slug/how-it-works`)|
|**AI**|Anti-fraud Gemini cron · sponsor creative generator · sponsor ROI daily explainer · audience matcher (pgvector)|
|**Workflows**|(5) sponsor apply → admin approve → logo flips live (6) voter cast → fraud scan → tally update (7) attribution: click → vote → ROI tile updates|
|**Automations**|Hybrid-scoring trigger · placement auto-flip at start_at · 5-min ROI rollup cron · 60-sec fraud-scan cron|

**Acceptance:** 1+ paying sponsor with attributed votes visible, 1k+ votes, 0 confirmed fraud, $5k+ revenue.

---

## ADVANCED (Phase 3 — 4 weeks · marketing automation + scale)

|Layer|Delivery|
|---|---|
|**Schema**|NEW `growth.*` (contacts, campaigns, communications, marketing_assets, asset_distributions)|
|**Backend**|OpenClaw VPS provisioned + 1 skill (Workflow C broadcast) · `outreach-send-loop` w/ daily cap · `event-recap` cron|
|**Frontend**|`/explore` event recommendations · referral attribution UI (?ref=) · organizer cross-event analytics|
|**AI**|A6 attendance confirmation (T-12h WA template + Gemini classify) · A7 contestant chase · auto-generated recap PDF + 3 social posts|
|**Workflows**|(8) WA Community broadcast every 4h (9) viral vote→share loop (10) attendance prep T-12h (11) post-event recap T+1|
|**Automations**|OpenClaw cron broadcasts · pg_cron backstop · referral payouts via Stripe Connect (1%) · A6/A7 cron|

**Acceptance:** 0 social account bans, K-factor > 1.0 over 7d, A6 hit ≥70%, recurring events live.

---

## AI AGENTS (Phase 4 — 6 weeks · trio orchestration)

|Layer|Delivery|
|---|---|
|**Schema**|NEW `trio.*` (tool_runs, handoffs, approval_requests, budgets_today materialized view)|
|**Runtimes**|Hermes VPS (reasoning) · Paperclip sidecar (governance) · OpenClaw expansion|
|**Bridges**|Paperclip→Hermes via heartbeat env · Paperclip→OpenClaw via webhook · Hermes→OpenClaw via MCP|
|**AI Agents (7)**|A1 daily health review · A2 sponsor approval · A3 leaderboard broadcast (re-orchestrated) · A4 outreach budget-capped · A5 weekly ROI · A6 attendance · A7 intake chase — all with **approval gates**|
|**Advanced AI**|Sponsor optimizer (recommend → admin one-tap apply) · brand-safety auto-pause · CPL pricing (after 30d data) · AI event planner agent ("create restaurant week")|
|**Workflows**|(12) AI proposes → Paperclip approval → OpenClaw executes (13) every action logged to `trio.tool_runs` w/ cost (14) budget-capped autonomous loops|
|**Automations**|All 7 trio routines · cost auto-pause · brand-safety auto-pause · multi-tenant per-organizer Paperclip companies|

**Acceptance:** 5+ concurrent contests, ≥1 CPL sponsor with measurable cost-per-vote, 14d trio uptime no missed automations.

---

## Phased automation count (the actual reality)

|Phase|Automations live|New AI agents|
|---|---|---|
|1 (MVP)|**1** (Stripe webhook → email)|0 agents — only Gemini direct calls|
|2|+ 4 (hybrid trigger · placement flip · ROI rollup · fraud cron)|0 agents still — Gemini direct|
|3|+ 4 (broadcast cron · outreach loop · A6 · A7 · recap)|0 agents still — OpenClaw skills, no Hermes|
|4|+ 7 (A1–A7 orchestrated)|**3 runtimes activated** — Hermes + Paperclip + OpenClaw scaled|

**Total: 16 automations across 4 phases.** Phase 1 ships ONE. Phase 4 has the orchestrated trio with full agent capabilities.

---

## What requires approval (governance gates by phase)

|Phase|Approval-required actions|
|---|---|
|1|None — admin manually configures sponsors|
|2|Sponsor go-live (admin one-tap in `/admin/sponsorships`)|
|3|Outreach campaign first 100 sends (admin batch-approve)|
|4|+ Shadow-blocks · budget extends · brand-safety unpauses · CPL invoice settle · multi-touch attribution config|

**Rule of thumb:** approval gates scale with automation. More autonomy = more gates.

---

## What we DON'T build (deferred or skipped)

|Item|Why|
|---|---|
|Tax/VAT support|Until first organizer asks|
|Refunds via UI|Stripe Dashboard handles manually until Phase 3|
|Promo codes|Until sponsor comp tickets need it|
|Drag-and-drop event page builder|Months of work; mobile-first defaults are fine|
|Embeddable widget|Phase 4+ if any organizer requests|
|Multi-tier capacity / shared limits|Festival-scale; Phase 4|
|Reserved seating|Phase 4+|
|Webhooks for Zapier|Phase 4|
|Multi-language UI (beyond en + es-CO)|Phase 5+|
|Hermes / Paperclip in Phase 1-3|Reserved for Phase 4|
|AI venue layout generator|Phase 4 backlog|
|CSP solver for festival scheduling|Phase 5+|

**Total deferred features: 12.** All can be added later when a real customer asks. None block Phase 1 launch.

---

## The commitment in one paragraph

> **Phase 1 ships in 3 weeks: one organizer publishes a beauty pageant gala, sells 100 tickets via Stripe, scans QR codes at the door, sees revenue in a dashboard. Six features, four screens, three edge functions, two Gemini calls, one Stripe webhook automation. That's MVP. Everything else — sponsors, contests, marketing automation, agents, sponsor ROI — comes after this works in production for one event with one real customer.**

Want me to (a) **write the actual Phase 1 schema migration** for `events` + `event_tickets` + `bookings` extension as the kickoff PR, (b) **diff `public.events` columns** so I can plan the precise extension, or (c) **stop planning, leave it here** and you start building?