# Contests initiative — combined roadmap

> **⚠️ Superseded for phase ordering.** This file's 3-layer-parallel schedule was restructured by [`08-plan-audit-response.md`](./08-plan-audit-response.md) into 4 sequential phases (Contest Engine → + Sponsors → + Events → + AI Orchestration). Use `08-plan-audit-response.md` as the canonical phase plan. Per-week deliverables and cross-layer dependency notes below remain useful reference.

> **BLUF (original):** Three layers (voting, growth, sponsorship) shipped over ~12 weeks across three phases — MVP (proves the loop), Growth (proves monetization), Scale (proves repeatability). Every phase ends with a concrete acceptance gate and a real customer running on it. Built on existing mdeai infrastructure; ~30% new code, ~70% schema + glue.

**Total cost to get to monetized phase:** ~5 dev-weeks + ~$200/mo tooling.

---

## Phase 1 — MVP (Week 1–3)

**Acceptance gate:** one live contest end-to-end with one paying Bronze sponsor and OpenClaw broadcasting every 4h.

| Layer | Ships in Phase 1 |
|---|---|
| **Voting** ([`01-contests.md`](./01-contests.md)) | `vote.contests/categories/entities/votes/entity_tally`; `vote-cast` edge fn (Turnstile + nonce + rate limit + idempotency); `/vote/:slug` mobile-first page; Realtime leaderboard; basic admin (create contest, approve entities); one contest seeded |
| **Growth** ([`02-openclaw-growth.md`](./02-openclaw-growth.md)) | OpenClaw VPS provisioned + paired; Workflow C (leaderboard broadcast every 4h to one WhatsApp Community); `pg_cron` backstop |
| **Sponsorship** ([`03-sponsorship-system.md`](./03-sponsorship-system.md)) | `sponsor.*` schema; `/sponsor/apply` 4-step wizard; `/admin/sponsorships` queue; Stripe Checkout for Bronze tier; one placement type (`contest_header`); Gemini asset moderation |

**What we deliberately defer.** Judges, paid voter votes, Apify enrichment, Workflow B (outreach), Workflow D (fraud alerts), all activation types beyond `contest_header`, AI tools (creative-gen / optimize / explain / audience-match), QR voting stations, push notifs, sponsor dashboard.

**Acceptance verification.**
- [ ] One real organizer self-serves a contest via `/host/contest/new`.
- [ ] One real Bronze sponsor self-serves via `/sponsor/apply` and sees their logo live on the contest page within 48h.
- [ ] OpenClaw broadcasts a leaderboard screenshot to a WhatsApp Community every 4h for 7 consecutive days.
- [ ] No `supabase get_advisors` security errors on the new schemas.
- [ ] `npm run build` and `npm run test` pass; bundle delta within budget per [`mdeai-project-gates`](../../.claude/skills/mdeai-project-gates).

---

## Phase 2 — Growth (Week 4–8)

**Acceptance gate:** one Premium sponsor running CPL pricing, ROI dashboard live, OpenClaw outreach to 200/day influencers driving measurable referral votes.

| Layer | Ships in Phase 2 |
|---|---|
| **Voting** | Judges + scoring criteria; weighted formula; paid votes via Stripe (reuse `p1_payments`); push/email notifications; basic analytics; phone OTP auth |
| **Growth** | Workflow A (Apify nightly enrichment) for 5 niches; Workflow B (outreach send-loop, 50/day each on email + WA); Workflow D (fraud alerts → Signal); Vote→Share modal with `?ref=`; Stripe Connect referral payouts (1%); WhatsApp reply-to-vote |
| **Sponsorship** | All 5 activation types (`title_naming`, `category_powered_by`, `contestant_sponsor`, `venue_sponsor`, `digital`); 8 visible surfaces using `<SponsoredSurface>`; impression + click tracking; attribution edge fn; sponsor dashboard with Realtime tiles; CPL pricing via Stripe Connect; all 4 AI tools (optimize, audience-match, creative-gen, roi-explain); QR voting stations |

**Acceptance verification.**
- [ ] One Premium sponsor with CPL contract sees daily attributed-vote count + cost-per-vote in their dashboard.
- [ ] Workflow B reaches 200 contacts/day across email + WhatsApp with bounce rate < 5%.
- [ ] Vote→Share loop produces measurable K-factor > 1.0 over a 7-day window.
- [ ] Fraud-spike alert fires within 60s of a synthetic 50-vote-from-one-IP burst.
- [ ] OpenClaw broadcasts watermark sponsor logo on every screenshot.

---

## Phase 3 — Scale (Month 3+)

**Acceptance gate:** two contests running concurrently, multi-tenant, three sponsors per contest with dynamic placements, hands-off automation.

| Layer | Ships in Phase 3 |
|---|---|
| **Voting** | Multi-tenant (`tenant_id` column, subdomain routing); iOS/Android via Capacitor PWA; replay-mode video voting (TikTok-style swipe); pgvector recommendations + explanations; vision-based AI scoring side-panel for judges; content-gen for organizers |
| **Growth** | Multi-agent OpenClaw (each organizer gets their own agent); pgvector "find more like this" influencer search; AI judge briefing bot; auto-A/B testing of outreach templates (Thompson sampling, 4 variants per segment); Voice/Talk Mode for organizers |
| **Sponsorship** | Dynamic placements (Thompson sampling on weight); public sponsor leaderboard; affiliate/referral system for sponsors; brand-safety guardrails (auto-pause near fraud spike or judge controversy); co-branded influencer campaigns (cross to `growth.*`); multi-touch attribution; Bronze auto-creative generator; per-organizer white-label sponsor portal |

**Acceptance verification.**
- [ ] Two contests in two different cities running concurrently with separate organizer dashboards.
- [ ] One sponsor running on dynamic placements sees CTR uplift > 15% vs static-weight baseline (controlled A/B).
- [ ] Brand-safety guardrail auto-pauses a placement when synthetic fraud spike fires; resumes after admin clears.
- [ ] White-label sponsor portal renders at organizer subdomain with their colors/logo.

---

## Per-week deliverables (Phase 1 + 2 detail)

| Week | Voting | Growth | Sponsorship |
|---|---|---|---|
| 1 | `vote.*` migration + `vote-cast` edge fn + `/vote/:slug` page (basic) | OpenClaw VPS provisioned, paired to admin Telegram | `sponsor.*` migration |
| 2 | Realtime leaderboard + admin shell | Workflow C (broadcast) wired + `pg_cron` backstop | `/sponsor/apply` wizard + Stripe Checkout (Bronze) |
| 3 | First contest seeded; first Bronze sponsor live | First broadcast cycle (7-day soak) | `/admin/sponsorships` approval queue |
| 4 | Judges + scoring criteria | Workflow A (Apify enrichment, 5 niches) | All 5 activation types schemas wired |
| 5 | Paid votes (Stripe) | Workflow B (outreach, 50/day) + suppression list | `<SponsoredSurface>` on 8 surfaces |
| 6 | Push + email notifications | Workflow D (fraud alerts → Signal) + Vote→Share modal | Impression/click tracking + attribution edge fn |
| 7 | Phone OTP auth | Stripe Connect referral payouts | Sponsor dashboard with Realtime tiles |
| 8 | Basic analytics | WhatsApp reply-to-vote | All 4 Gemini AI tools live + QR stations |

---

## Cross-layer dependencies (read this before starting any task)

1. **`growth.outreach_messages.contest_id` requires `vote.contests` to exist first** → ship `01-contests.md` migration before `02-openclaw-growth.md` migration.
2. **`sponsor.applications.contest_id` requires `vote.contests` and `vote.entities`** → same ordering.
3. **OpenClaw broadcast watermarking depends on `sponsor.placements` being populated** → Phase 2's "OpenClaw broadcast watermark sponsor logo" requires Phase 1's `sponsor.placements` schema.
4. **Sponsor attribution requires `vote.votes` insert trigger** → Phase 2's `sponsor-attribute` edge fn requires Phase 1's `vote.votes` table.
5. **AI cost logging via `ai_runs` is shared** → must be migrated once before any Gemini call across all three layers.

---

## Cost model (combined, per month, at Phase 2 steady state)

| Line item | Monthly |
|---|---|
| Hetzner CX22 VPS (OpenClaw) | $20 |
| Twilio WhatsApp Business (200/day × 30) | ~$120 |
| SendGrid (200/day × 30) | ~$25 |
| Apify (5 actors weekly) | ~$30 |
| Post Bridge or Mixpost Pro | ~$29 |
| Gemini API (~30k calls — voting AI + sponsor AI + growth AI) | ~$60 |
| Stripe fees | 2.9% + $0.30/charge — variable |
| Supabase | already paid by mdeai |
| Vercel | already paid by mdeai |
| **Run-rate total** | **~$300/mo + Stripe fees** |

**Break-even.** One Bronze sponsor ($500) covers ~1.5 months of run-rate. One Gold sponsor ($5k) covers >12 months.

---

## Risks across layers

| Risk | Layer affected | Mitigation owner | Mitigation |
|---|---|---|---|
| IG/TikTok ban for mass DM | Growth | Engineering | Don't do it. WA + email only |
| Stripe webhook race with placement activation | Sponsorship | Engineering | Idempotent webhook with `placement.start_at >= now()` guard |
| Sponsor logo association with controversial contestant | Sponsorship | Brand-safety auto-pause (Phase 3); manual contract clause (Phase 1–2) |
| Real-time leaderboard cost spike at finals | Voting | Engineering | Materialized `entity_tally` updated by trigger; clients read counter, not vote rows |
| OpenClaw VPS down → no broadcasts | Growth | Engineering | `pg_cron` backstop runs the same Workflow C |
| Vote attribution miscount (anon → user upgrade) | Sponsorship | Engineering | Retro-attribute on identity merge |
| Influencer claims fraud (their followers' votes counted) | Growth | Engineering | Tracked links per influencer; show conversion dashboard |
| Apify costs spiraling | Growth | Ops | Monthly budget cap; cache 7d before re-run |
| Gemini hallucinates personalization | All AI | Engineering | Reject invented URLs; manual review for first 100 sends per campaign |

---

## What "done" looks like for the whole initiative

- Two contests running concurrently in two cities.
- 25k+ votes per pageant-class contest, no platform bans.
- ≥3 paying sponsors per contest, with dashboard CTR data flowing daily.
- No engineering involvement to launch a new contest or onboard a new sponsor.
- Run-rate cost ≤ $500/mo per active contest, including all tooling.
- Vote attribution accurate within 1% on a synthetic test (10k clicks → 10k votes → 10k attributions, off-by-one tolerated).

If we hit those numbers, the contests initiative is **a self-serve product, not a project**. That's the goal.

---

## See also

- [`00-overview.md`](./00-overview.md)
- [`01-contests.md`](./01-contests.md)
- [`02-openclaw-growth.md`](./02-openclaw-growth.md)
- [`03-sponsorship-system.md`](./03-sponsorship-system.md)
