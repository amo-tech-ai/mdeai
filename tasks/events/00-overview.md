# Contests initiative — overview

> **BLUF:** A four-layer contest platform built on the existing mdeai.co stack: a **voting engine** (`vote.*`), a **marketing growth engine** orchestrated by OpenClaw (`growth.*`), a **sponsorship layer** (`sponsor.*`), and an **event layer** (`event.*`) that ties them together with tickets, venues, and schedules. All four share Supabase, Gemini, Stripe (`p1_payments`), and the existing Vite/React app — no new infrastructure. Target use cases: beauty pageants, restaurant rankings, event competitions, and full festivals with multiple contests + sponsors.

**Status:** design phase. No code yet. Tracer-bullet PR proposed at the end of `01-contests.md`.

---

## Why this lives in `tasks/events/`

> **Folder rename note:** This folder was renamed from `tasks/contests/` → `tasks/events/` (May 2026). Internal `./*.md` links work unchanged because they're relative. Any external references to `tasks/contests/<file>` need updating to `tasks/events/<file>`.



It is a single product initiative with three tightly coupled subsystems. Splitting them across `tasks/plan/` and `tasks/openclaw/` would lose the cross-cutting links (the sponsor schema references `vote.contests`; the growth engine reads `vote.entity_tally`; the leaderboard broadcast carries the sponsor logo). One folder, four docs, one shared schema.

---

## Documents in this folder

| File | Layer | Type |
|---|---|---|
| [00-overview.md](./00-overview.md) | — | Index + BLUF (this file) |
| [01-contests.md](./01-contests.md) | Voting engine | Architecture + schema + edge fns + AI + anti-fraud |
| [02-openclaw-growth.md](./02-openclaw-growth.md) | Marketing — **canonical OpenClaw plan** | OpenClaw orchestration: discovery, outreach, social, broadcast |
| [03-sponsorship-system.md](./03-sponsorship-system.md) | Sponsorship | Onboarding, activations, ROI, AI placement, performance pricing |
| [04-roadmap.md](./04-roadmap.md) | All layers | Combined MVP → Scale roadmap with per-week deliverables |
| [05-unified-platform.md](./05-unified-platform.md) | Events + integration | `event.*` schema, ticketing, venues, schedules; how events host contests and bundle sponsor activations |
| [06-trio-integration.md](./06-trio-integration.md) | Runtime integration | OpenClaw + Hermes Agent + Paperclip + Supabase: who owns what, MVP build plan, first 5 automations |
| [07-ai-event-research.md](./07-ai-event-research.md) | Research + adoption | Honest audit of "top 10 AI event repos" (most are 0-star tutorials); adopts nielsberglund campaign-schema; adds A6 attendance + A7 intake-chase automations |
| [08-plan-audit-response.md](./08-plan-audit-response.md) | Canonical phase plan | External audit response; restructures into 4 sequential phases (Contest Engine → + Sponsors → + Events → + AI); supersedes `04-roadmap.md` for phase ordering |
| [09-prd.md](./09-prd.md) | **Product Requirements Document** | Strict-schema PRD: personas, user stories with acceptance criteria, AI eval strategy, 5 real-world walkthroughs, 7 open questions for founder confirmation |
| [10-roadmap.md](./10-roadmap.md) | **Strategic roadmap** | Now / Next / Later swimlanes with RICE prioritization; quarterly themes Q2 2026 → Q2 2027; capacity plan; risk register; decision log |

> **Note on duplicates:** `02-openclaw.md` (your earlier saved verbatim copy from prior turn, ~434 lines) is **redundant** with the canonical `02-openclaw-growth.md` (plan-doc format with BLUF / goal / user story / tasks / verify, broken-link free). Both are kept per CLAUDE.md no-delete rule. Safe to remove `02-openclaw.md` manually with `rm tasks/contests/02-openclaw.md` whenever convenient — content is preserved in git history.

---

## Single-scenario anchor

Use this scenario as the litmus test for every design decision in the four docs:

> **Scenario — "[Miss Elegance Colombia 2026](https://misseleganceco.com/)"** (Phase 1 flagship contest, locked May 2026)
> Free public voting (no charges). Postobón signs a $5k Gold sponsorship in Phase 2 through `/sponsor/apply` on day T-30. By T-21, OpenClaw has enriched 1,800 Medellín influencers (national contest, **Medellín amplification focus**), scored the top 200, and sent 50/day compliant outreach (email + WhatsApp template, never cold IG DM). By T-14, 36 Medellín-based influencers have signed partnerships with tracked `?ref=` links. T-7: leaderboard broadcasts fire every 4h to a 5,200-member Medellín WhatsApp Community, each carrying Postobón's logo via a `sponsor.placements` row. T-0: a fraud spike from two VPN ranges is auto-shadow-blocked; finals stream live. Day after: Postobón sees a ROI dashboard with `impressions=412k`, `clicks=18k`, `attributed_votes=7,200`, plus a Gemini-generated "why it worked" summary in English first, then Spanish-Paisa.

If a design decision in any of the four docs would break this scenario, the decision is wrong.

---

## Stack reuse — what's already in mdeai.co

| Need | Already in mdeai | Used by |
|---|---|---|
| Auth (email + OAuth + anon) | [`useAuth.tsx`](../../src/hooks/useAuth.tsx) + [`useAnonSession.ts`](../../src/hooks/useAnonSession.ts) | voting, sponsor onboarding |
| Realtime channels | [`useRealtimeChannel`](../../src/hooks/useRealtimeChannel.ts) | leaderboard, sponsor ROI live |
| Durable rate limiter | [`rate_limit_hits` + RPC](../../supabase/migrations/20260423120000_durable_rate_limiter.sql) | vote-cast, outreach send-loop |
| AI inference | 6 edge fns on Gemini 3.x | content gen, fraud, ROI explain |
| Vector search | pgvector + `ai-search` template | recommendations, influencer "find similar" |
| AI cost logging | `ai_runs` table | every Gemini call across all three layers |
| Idempotency / atomic ops | `p1_crm_idempotency_atomic.sql` pattern | vote-cast, sponsor-payment-webhook |
| Storage | Supabase Storage buckets | contestant photos, sponsor assets |
| Stripe scaffold | `p1_payments` migration | paid votes, sponsor invoices, performance payouts |
| WhatsApp / push | `landlord_v1_whatsapp_notify` + `useNotifications` | leaderboard broadcast, judge briefing |
| Admin shell | `/admin/*` routes + `useAdminAuth` (audit needed) | sponsor approval, fraud review |

**The contests initiative ships ~30% new code, ~70% schema + glue.** That's the whole point of building it on mdeai.

---

## Five new Postgres schemas

```
vote.*      — contests, entities, votes, tallies, judges, scoring (01-contests.md)
growth.*    — contacts, segments, outreach campaigns, messages    (02-openclaw-growth.md)
sponsor.*   — orgs, packages, applications, placements, ROI       (03-sponsorship-system.md)
event.*     — events, venues, tickets, bookings, schedules        (05-unified-platform.md)
trio.*      — tool_runs, handoffs, approval_requests, budgets     (06-trio-integration.md)
```

Cross-links:
- `vote.contests.event_id` → `event.events.id` (nullable — contests may be standalone)
- `growth.outreach_messages.contest_id` → `vote.contests.id`
- `sponsor.applications.contest_id` → `vote.contests.id`
- `sponsor.applications.event_id` → `event.events.id` (for event-level sponsorship)
- `sponsor.placements.entity_id` → `vote.entities.id` (for contestant-sponsor)
- `sponsor.attributions.vote_id` → `vote.votes.id` (for ROI)
- `event.bookings.payment_id` → `public.p1_payments.id` (for tickets)

---

## Acceptance for this initiative as a whole

- [ ] One live contest end-to-end on the test environment with: 1 free vote/day enforced, leaderboard ticking via Realtime, OpenClaw broadcasting every 4h, and one sponsor's logo rendering with click-through tracking.
- [ ] Supabase advisor lints clean across all three schemas (no missing RLS, no unindexed FK).
- [ ] `npm run build` and `npm run test` pass with new code.
- [ ] One real organizer can self-serve a contest from `/host/contest/new` without engineering help.
- [ ] One real sponsor can self-serve a Bronze tier from `/sponsor/apply` without engineering help.

---

## What this folder is NOT

- Not a PRD. The PRD lives upstream — these are implementation plans.
- Not a marketing copy doc. Founder/external comms live in `tasks/plan/06-landlord-v1-30day.md` patterns or PR descriptions.
- Not a roadmap for mdeai.co at large — only for the contests initiative. Master roadmap is in [`tasks/MDEAI-ROADMAP.md`](../MDEAI-ROADMAP.md).

---

## How to read these in order

1. **Start here** (`00-overview.md`) — 5 min.
2. Read [`05-unified-platform.md`](./05-unified-platform.md) first if you want the bird's-eye integration view — events tie everything together. ~15 min.
3. Read [`01-contests.md`](./01-contests.md) — the voting engine. ~15 min.
4. Read [`02-openclaw-growth.md`](./02-openclaw-growth.md) — how traffic gets there. ~10 min.
5. Read [`03-sponsorship-system.md`](./03-sponsorship-system.md) — how it gets paid for. ~15 min.
6. Read [`06-trio-integration.md`](./06-trio-integration.md) — how OpenClaw + Hermes + Paperclip share the work. ~15 min.
7. Read [`04-roadmap.md`](./04-roadmap.md) — what ships when. ~5 min.
8. Optional: [`07-ai-event-research.md`](./07-ai-event-research.md) — what's worth adopting from the AI-event-agent ecosystem (most repos are tutorials; one blog has gold). ~10 min.

Total ~90 min to be fully briefed before writing any code.
