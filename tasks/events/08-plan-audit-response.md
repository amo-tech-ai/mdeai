# Plan audit response — revised phases, milestones, best practices

> **BLUF:** An external audit graded the plan **Vision 9/10, Architecture 8.5/10, Execution risk HIGH, MVP clarity 5/10**. The audit is **mostly right** on five critiques and lands the most important one cleanly: we tried to ship three layers (voting + growth + sponsorship) in parallel during a 12-week window. **We're restructuring to four sequential phases**, with Phase 1 shipping a single coherent revenue loop (contest engine), and Hermes + Paperclip deferred to Phase 4. We also adopt three best-practice improvements: hybrid voting formula (50% public / 30% judges / 20% engagement) as the default; guaranteed-value sponsorship packages (not CPL) until 30 days of ROI data exists; a public **Trust page** before any contest opens. We push back on one audit point: a single OpenClaw VPS for WhatsApp broadcasts at $20/mo is too cheap and too high-ROI to defer.

**Goal of this doc.** Resolve the audit, lock the revised phase plan, and map the five new event-* skills the user installed to the right phase.

**User story — what changes for the operator.**
> *As a solo founder shipping the contest engine, I want a 4-phase plan where Phase 1 produces $1 of real revenue from one contest before I touch sponsorship, events, or AI orchestration. Each phase has a measurable acceptance gate; I don't advance until last phase's gates are green.*

**This doc supersedes** `04-roadmap.md`'s phase ordering. `04-roadmap.md` is kept for reference but its 3-layer-parallel schedule is no longer canonical.

---

## 1. URL audit (this turn's sources)

| URL | Status | What it actually is | Adopt? |
|---|---|---|---|
| [tencentcloud.com/techpedia/141401](https://www.tencentcloud.com/techpedia/141401) | ✅ Real | Tencent Cloud sales page for OpenClaw-on-Lighthouse for event ops (registration, reminders, check-in, follow-up). Sales framing, but the capability claims are real | Inspirational; **don't** lock to Tencent infra |
| [clawbot.ai/skills/afrexai-event-management.html](https://clawbot.ai/skills/afrexai-event-management.html) | ⚠️ 403 (couldn't verify) | Likely a real OpenClaw skill but bot-protected | Investigate manually before adopting |
| [nielsberglund Part 11](https://nielsberglund.com/post/2026-02-22-building-an-event-management-system-with-claude-code-part-11---campaign-tracking--batch-sending/) | ✅ Already adopted | See [`07-ai-event-research.md`](./07-ai-event-research.md) | **Yes** — schema verbatim |

---

## 2. Audit verdict — honest line-by-line

| Audit critique | Score | Verdict | Action |
|---|---|---|---|
| ❌ **Over-engineered AI stack** (Hermes + OpenClaw + Paperclip = 3 runtimes) | High signal | **Mostly right.** Three runtimes from week 1 = three failure surfaces, three security profiles, three update cadences. Not appropriate for MVP. | **Defer** Hermes + Paperclip to Phase 4. Keep ONE OpenClaw workflow (leaderboard broadcast) from Phase 1 — see push-back below. |
| ❌ **Growth depends too much on automation** (ban risk + low quality) | Medium signal | **Half right.** Compliance is already in plan (no IG/TikTok cold DM, daily caps, suppression list). But the audit's strategic frame — *"contest = viral hook → influencers join voluntarily"* — is better than ours. | **Adopt:** bias growth from outbound→inbound. Reserve outreach for the top-50 highest-fit influencers, not 200/day. |
| ❌ **Voting = biggest hidden risk** | Highest signal | **Highly right.** A buy-votes scandal kills platform credibility overnight. Our 5-layer fraud is real, but the hybrid scoring framing is a stronger trust narrative. | **Adopt as default**: hybrid scoring `50% public + 30% judges + 20% engagement` for pageant-class contests. Phone OTP day 1. Public Trust page. |
| ❌ **Sponsor ROI assumptions optimistic** | High signal | **Right.** Early-stage platforms can't credibly claim CPL outcomes — sponsors will ask "how many real customers?" and we won't have that data for 30+ days. | **Adopt:** Phase 2 sponsor packages = guaranteed-value (fixed impressions + leads + influencer posts), not CPL. Defer CPL/CPA to Phase 4 once 30+ days of dashboard data exists. |
| ❌ **Too many features too early** | Highest signal | **Right.** 12 weeks across 3 layers = high WIP, low velocity, high failure rate. | **Restructure** into 4 sequential phases. Phase 1 ships ONE revenue loop; subsequent phases extend, not start over. |
| ⚠️ "AI will improve results automatically" | Already correct | We never claimed this. AI proposes; humans approve (per `ai-interaction-patterns.md`). | No change. |
| ⚠️ "Influencers will respond" | Half right | Cold response < 5% is realistic. We use compliant compliant + tracked links + Stripe Connect 1% kicker. | Already addressed; reduce target volume. |
| ⚠️ "OpenClaw automation = growth" | Right framing | Growth = distribution + incentives + network effects. OpenClaw is plumbing. | No code change; **update positioning** docs. |
| ⚠️ "Users will trust voting" | Right | Trust must be earned via transparency. | **New requirement:** ship a public Trust page before any contest opens. |

**Net audit verdict:** the audit lands the highest-signal critiques (voting trust, scope, ROI honesty, runtime complexity). It overcorrects on two: framework choice (Vite/React, not Webflow) and OpenClaw scope (drop entirely vs use minimally). Both push-backs are detailed below.

---

## 3. Push-back where the audit overcorrects

### 3.1 "Skip OpenClaw initially" — disagree

**Audit recommendation:** drop OpenClaw from MVP entirely.

**Counter:** A single OpenClaw VPS running **only** Workflow C (leaderboard broadcast every 4h to a WhatsApp Community) costs $20/mo and replaces ~5 hours/day of community-manager labor from day 1. The risk surface is small because:
- Only one outbound action (post a screenshot + caption to a WA Community).
- No inbound parsing yet (defer reply-to-vote to Phase 2).
- No autonomous decisions — content is generated by Gemini (existing edge fn) and OpenClaw just delivers.

**Decision:** keep OpenClaw in Phase 1 with **one workflow only**. No Hermes, no Paperclip, no scraping, no outreach until Phase 2+.

### 3.2 "Use Webflow / Next.js for frontend" — disagree

**Audit recommendation:** Webflow / React / Next.js (open framing).

**Counter:** mdeai already has a working **Vite + React + shadcn** app with 152+ components, 31 hooks, and the 3-panel layout per `CLAUDE.md`. Switching frontend frameworks at the start of the contest initiative would lose 6+ months of UI work. The audit was framework-agnostic; we keep what we have.

**Decision:** Vite/React/shadcn unchanged. New routes added under `/vote/*`, `/host/event/*`, `/sponsor/*`.

### 3.3 "AI Contest Engine, not events platform" — partially disagree

**Audit recommendation:** focus on AI Contest Engine; defer events.

**Counter:** the **strategic moat** is `events host contests host sponsors`. A standalone contest engine has no defensibility — anyone can ship one. Bundling events + tickets + sponsors is what makes mdeai sticky. We agree on **MVP staging** (Phase 1 = contests only) but disagree on **dropping the long-term vision**.

**Decision:** Phase 1 = Contest Engine. Phase 3 = add events. Don't drop the vision; stage it.

---

## 4. Revised 4-phase plan (canonical)

### Phase 1 — Contest Engine (3 weeks, ~1 dev)

**Goal:** ship one coherent revenue loop. One contest, free + paid votes, real money in Stripe, hybrid scoring, public Trust page. Nothing else.

**Stack:** Vite/React/shadcn + Supabase + Gemini (direct via existing edge fns) + Stripe Checkout + **one** OpenClaw VPS for Workflow C only.

**Ships:**
> **Phase 1 contest type — locked decision (May 2026):** First contest is **[Miss Elegance Colombia 2026](https://misseleganceco.com/)** (*Certamen Nacional de Elegancia, Liderazgo y Autenticidad*) — **free voting, no charges to voters**. National contest in branding; **Medellín-focused** in marketing, sponsor sales, and WhatsApp Community amplification. **English-first** product, Spanish-Paisa for voter-facing surfaces. No paid voter votes in Phase 1 — Stripe Checkout for paid votes moves to Phase 2. Identity verification + tighter moderation + pageant-specific Trust copy added. **Phase 0 prerequisite:** signed partnership with Miss Elegance Colombia organizers (scoring formula, contestant onboarding, prize-disclosure compliance, finals logistics, brand placement). Phase 1 calendar extends from 3 → **3.5 weeks**. See [`09-prd.md`](./09-prd.md) §6 Q3 for the full decision rationale.

- `vote.*` migration (contests/categories/entities/votes/entity_tally/judges/scoring_criteria/judge_scores/fraud_signals — `paid_vote_orders` table created but not wired) per [`01-contests.md`](./01-contests.md)
- `vote-cast` edge fn (Turnstile + nonce + rate limit + idempotency + L3 hard rules) — **free votes only**
- `/vote/:slug` mobile-first 1-tap voting page + Realtime leaderboard
- **Hybrid scoring as default** for pageant-class: `0.5 × audience + 0.3 × judges + 0.2 × engagement`
- **Phone OTP** as default auth on top of email/Google (Supabase native)
- **Trust page** at `/vote/:slug/how-it-works` (anti-fraud, weighting, transparency, **pageant-specific section** explaining "this is not a lottery" per Colombia Ley 1581/2012 + Ley 643/2001)
- **Identity verification flow** for pageant contestants — government ID photo + signed waiver upload to existing `identity_docs` Storage bucket; admin moderation before profile activation
- **Tightened Gemini photo moderation** — higher threshold for contestant-submitted images; admin override path
- **One** sponsor surface only: `contest_header` (no `sponsor.applications` schema yet — manually configured in admin)
- ~~Stripe Checkout for paid voter votes~~ — **moved to Phase 2** (free voting only in Phase 1)
- One OpenClaw VPS, paired to admin Signal, running Workflow C every 4h
- One beauty pageant contest seeded end-to-end (e.g. Reina de Antioquia 2026)

**Acceptance gates** (cannot advance without all green):
- ✅ One real organizer self-serves a contest from `/host/contest/new`.
- ✅ 1,000+ free votes cast; fraud-scan confirms < 0.5% confirmed-fraud rate after manual audit (was "0%" — relaxed slightly to acknowledge that pageant traffic surfaces edge cases worth investigating).
- ✅ Hybrid scoring formula displayed on every contest page (transparency requirement).
- ✅ Trust page published with pageant-specific section; **Colombian counsel sign-off captured** (mandatory release blocker).
- ✅ All contestants verified through identity flow before public voting opens. Admin-moderated waivers archived in Storage with retention.
- ✅ OpenClaw broadcasts WA leaderboard every 4h for 7 consecutive days, no missed slots.
- ✅ ~~At least one paid voter vote settles in Stripe~~ — **N/A for free pageant**; replaced by gate above.
- ✅ Brand-safety auto-pause hook tested (synthetic suspicious-vote burst → admin Signal alert within 60s).
- ✅ `npm run build` and `npm run test` pass; bundle delta within budget per [`mdeai-project-gates`](../../.claude/skills/mdeai-project-gates).
- ✅ Supabase `get_advisors` clean for `vote.*`.

**KPIs:** 1 live free beauty pageant. 1k+ free votes. < 0.5% confirmed fraud. NPS measurable on the Trust page (≥ 40 from voters surveyed). Identity-verification 100% completion before voting opens. Counsel sign-off on file.

**Cost ceiling:** $30/mo (OpenClaw VPS + Twilio WA template + Twilio SMS for OTP).

**Phase 1 revenue from contest:** $0 (free voting, no Phase 1 sponsor wizard). Revenue path: founder closes 1–2 sponsor deals against the **live Phase 1 contest** during Phase 2 onset (sponsor logo flips on `contest_header` surface, manually configured in admin until Phase 2 self-serve wizard ships).

**Out of scope:** events, tickets, sponsor onboarding wizard, multiple sponsor surfaces, growth outreach, Apify scraping, Hermes, Paperclip, AI sponsor tools, push notifs, mobile app, **paid voter votes (Stripe Checkout)**.

---

### Phase 2 — Sponsorship + Compliant Growth (4 weeks)

**Goal:** turn the contest engine into something that generates sponsor revenue, with compliant growth motion that does not get any account banned.

**Ships:**
- `sponsor.*` migration + `/sponsor/apply` 4-step wizard + `/admin/sponsorships` queue per [`03-sponsorship-system.md`](./03-sponsorship-system.md)
- All 5 activation types (`title_naming`, `category_powered_by`, `contestant_sponsor`, `venue_sponsor`, `digital`)
- 8 visible sponsor surfaces using `<SponsoredSurface>`
- Impression + click tracking + 24h-window vote attribution
- Sponsor dashboard with Realtime tiles
- **Guaranteed-value packages only** for Bronze/Silver/Gold (fixed impressions + leads + influencer posts). No CPL/CPA yet.
- `growth.*` schema with the **nielsberglund 5-table additions** (campaigns / communications / communication_recipients / marketing_assets / asset_distributions) per [`07-ai-event-research.md`](./07-ai-event-research.md)
- Compliant outreach: WA Business + Email only. Daily cap 50/channel/sender. Suppression list. Top-50 hand-curated targets, not 200/day.
- Hybrid voting hardened: device fingerprinting (FingerprintJS) + IP rotating salt + CAPTCHA on suspicious patterns.
- Vote→Share modal with `?ref=` UTM (referral attribution).
- Stripe Connect for organizer payouts.
- Push notifications (web push) for paid-vote sponsors only.

**Acceptance gates:**
- ✅ 5+ paying sponsors across at least 2 contests, $5k+ revenue.
- ✅ Sponsor NPS ≥ 30 measured at end of Phase 2.
- ✅ 0 social account bans, 0 Twilio number flagging.
- ✅ Outreach bounce rate < 5% over 7 days.
- ✅ Sponsor dashboard live with 7+ days of impression/click data per active sponsor.
- ✅ K-factor > 1.0 from referral loop measured over a 7-day window.
- ✅ Vote→Share conversion rate > 3% (votes that result in a share + return-vote within 24h).
- ✅ **Stripe Checkout for paid voter votes is wired and producing revenue** (deferred from Phase 1 per §6 Q3 founder decision). At least 50 paid votes settled.

**KPIs:** $5k+ sponsor revenue. 5+ sponsors. Sponsor NPS ≥ 30. K-factor > 1.0.

**Cost ceiling:** $200/mo (Twilio + SendGrid + OpenClaw + Apify weekly + Gemini).

**Out of scope:** events, tickets, AI optimizer / creative-gen / ROI explainer, performance pricing, Hermes, Paperclip.

---

### Phase 3 — Events + Tickets (4 weeks)

**Goal:** events that bundle contests + sponsors. Tickets unlock votes. Organizer dashboard.

**Ships:**
- `event.*` migration per [`05-unified-platform.md`](./05-unified-platform.md)
- `vote.contests.event_id` and `sponsor.applications.event_id` additive ALTER
- `/host/event/new` 6-step wizard
- `/event/:slug` public detail page with embedded contest leaderboards + sponsor surfaces
- `ticket-checkout` edge fn (atomic `qty_sold` increment via advisory lock)
- `ticket-payment-webhook` mints QR token + sends email
- `ticket-validate` venue gate scan (single-use server-signed)
- `vote-cast` extension: decrement `bonus_votes_remaining` when ticket exists
- Organizer dashboard at `/host/event/:id/dashboard` with Realtime tiles
- Calendar export (ICS)
- New OpenClaw workflows (still no Hermes/Paperclip): contestant intake chase + attendance confirmation per [`07-ai-event-research.md`](./07-ai-event-research.md) (A6 + A7) — but as direct Supabase-cron + OpenClaw-broadcast jobs, not orchestrated via Hermes
- `event-planner` skill drives the wizard's logistics checklist
- `event-briefs` skill auto-generates a brief PDF on event creation (Gemini)

**Acceptance gates:**
- ✅ 1+ event with 100+ paid ticket sales.
- ✅ Tickets unlock voting bonus correctly (manual verify with 5 test buyers).
- ✅ Stripe Connect payout lands in organizer's connected account at T+7 post-event-close.
- ✅ Attendance confirmation agent (A6) reaches 70%+ confirmation rate before event.
- ✅ Contestant intake chase agent (A7) achieves 90%+ profile completeness.
- ✅ Organizer dashboard tiles tick within 2s of insert.
- ✅ ICS calendar download works on iOS + Android.

**KPIs:** 1 event live. 100+ tickets sold. 70%+ attendance-confirmation rate. Stripe Connect payout settled.

**Cost ceiling:** $250/mo.

**Out of scope:** Hermes, Paperclip, performance pricing (CPL/CPA), AI sponsor tools, multi-tenant white-label, recurring events, ticket marketplace.

---

### Phase 4 — AI Orchestration (Hermes + Paperclip + advanced AI) (6 weeks)

**Goal:** introduce Hermes + Paperclip ONLY when the team or scale demands it. Add AI tools that earn their cost.

**Ships:**
- `trio.*` migration per [`06-trio-integration.md`](./06-trio-integration.md)
- Hermes installed on $5+ VPS, paired to admin Telegram, with Supabase MCP scoped read-only on `vote.*`/`growth.*`/`sponsor.*`
- Paperclip on Hermes VPS as sidecar; one company "mdeai-contests"
- Trio bridges (Paperclip ↔ OpenClaw, Paperclip ↔ Hermes) per `06-trio-integration.md` Tr8–Tr10
- Automations A1–A7 live (daily review / sponsor approval / leaderboard / outreach / weekly ROI / attendance / intake-chase) — ported from Phase 2/3 OpenClaw skills to Paperclip-orchestrated Hermes-reasoned versions
- AI sponsor tools: optimizer + audience-match + creative-gen + ROI explainer
- Performance pricing (CPL/CPA) — only after 30+ days of `sponsor.roi_daily` data per active sponsor
- White-label per organizer (multi-tenant Paperclip company per organizer)
- Hermes Curator approved for 10 mdeai-specific skills

**Acceptance gates:**
- ✅ 5+ contests running concurrently across 2+ cities with separate organizer dashboards.
- ✅ 1+ sponsor on CPL pricing with > 0 attributed votes paid.
- ✅ Cost-per-attributed-vote computed and visible on sponsor dashboard for ≥ 7 days.
- ✅ Brand-safety guardrail auto-pauses a placement when synthetic fraud spike fires.
- ✅ AI optimizer recommendation acceptance rate > 30% (admin one-click apply).
- ✅ All 7 trio automations run for 14 consecutive days with no missed cycles.

**KPIs:** 5+ concurrent contests. ≥ 1 CPL sponsor. 14d trio uptime. AI optimizer ≥ 30% acceptance.

**Cost ceiling:** $500/mo run-rate (per `06-trio-integration.md` cost model).

---

## 5. Best practices adopted (10 hard rules)

| # | Rule | Why | Where enforced |
|---|---|---|---|
| 1 | **Hybrid scoring formula default** for pageant-class: `0.5 × audience + 0.3 × judges + 0.2 × engagement` | Pure-public voting destroys credibility on the first buy-votes scandal. Hybrid lets us discount mass-bot signal. | `vote.contests.scoring_formula` column; UI visible on every contest page |
| 2 | **Public Trust page** before any contest opens | Trust must be earned via transparency, not assumed. | `/vote/:slug/how-it-works` route — Phase 1 release blocker |
| 3 | **Phone OTP** as auth default from day 1 | Phone numbers cost more than emails to fake; cuts bot-account creation by ~10×. | Supabase Auth phone OTP, enabled in Phase 1 |
| 4 | **Guaranteed-value sponsor packages** for Bronze/Silver/Gold | Early-stage platforms can't credibly claim CPL — sponsors won't trust dashboard numbers in week 1. | Phase 2 default; CPL/CPA gated to Phase 4 + 30d data |
| 5 | **Daily caps as hard rules**, not optional | Enforces compliance even if an operator panics under deadline. | `growth.outreach_campaigns.daily_cap` NOT NULL |
| 6 | **Single revenue loop per phase** | Multiple half-built loops have no flywheel. | Phase gates (this doc) |
| 7 | **Hermes + Paperclip deferred to Phase 4** | Three runtimes from week 1 = three failure surfaces. Add complexity when scale demands it. | This doc supersedes `04-roadmap.md` |
| 8 | **Inbound > outbound** for influencers | Contest = viral hook. Influencers join voluntarily for top-10 / VIP exposure. Cold outreach reserved for top-50 high-fit only. | Phase 2 outreach plan; not 200/day |
| 9 | **Source of truth = Supabase, always** | Even when adding Hermes (Phase 4), Hermes reads Supabase via MCP, never owns state. | `06-trio-integration.md` schema rule |
| 10 | **Phase advance gated on green KPIs** — not calendar | Calendar pressure produces half-shipped phases that hurt the next phase. | This doc's per-phase gates |

---

## 6. Skill integration map (the 5 new event-* skills)

| Skill | Best fit | Phase | How it integrates |
|---|---|---|---|
| **[event-briefs](../../.claude/skills/event-briefs/SKILL.md)** | Auto-generate event brief PDFs from `/host/event/new` wizard data | Phase 3 | Gemini consumes the SKILL.md framework (overview / narrative / experience / promotion / operations / measurement) when an organizer publishes; brief stored as `growth.marketing_assets` row with `kind='one_pager'` |
| **[event-hosting](../../.claude/skills/event-hosting/SKILL.md)** | Internal use — mdeai team's own meetups (founder Luma events to recruit organizers) | Anytime | Not user-facing; team uses for monthly "Medellín Contest Organizer Meetup" recruiting events |
| **[event-marketer](../../.claude/skills/event-marketer/SKILL.md)** | Sponsor + organizer playbook; feeds the marketing-asset library and ROI dashboards | Phase 2 + 3 | EPIC checklist (Execute / Perform / Implement / Calculate) → `sponsor.applications.campaign_goals`. Event funnel metrics → sponsor dashboard tiles. Anti-patterns → admin checklist on application review. |
| **[event-planner](../../.claude/skills/event-planner/SKILL.md)** | Drives the `/host/event/new` wizard's logistics checklist (12mo / 9mo / 6mo / day-of timeline; venue selection matrix; AV checklist) | Phase 3 | Wizard step 4 ("logistics") loads checklist items from this skill; vendor tracker becomes a sidebar in `/host/event/:id/dashboard` |
| **[event-prospecting](../../.claude/skills/event-prospecting/SKILL.md)** | **Internal mdeai team** uses to find sponsor leads at industry events (Colombiamoda speakers, Estéreo Picnic exhibitors, etc.) | Phase 2 (team tool) | Browserbase + bb CLI → `growth.contacts` import with `source='event_prospecting'`. Run before each new festival kicks off. NOT exposed to end users. |

**Key insight:** the 5 skills break naturally into **2 user-facing** (event-planner, event-briefs — drive wizards), **2 internal team tools** (event-hosting, event-prospecting — mdeai uses), and **1 strategic playbook** (event-marketer — informs both sponsor + organizer flows).

---

## 7. Updated cost model per phase

| Phase | Run-rate $$ | Why |
|---|---|---|
| Phase 1 (3 wks) | **$30/mo** | One OpenClaw VPS + Twilio WA template. No Apify, no Hermes, no Paperclip. |
| Phase 2 (4 wks) | **$200/mo** | + SendGrid + Apify weekly + Gemini outreach + tracking pixels |
| Phase 3 (4 wks) | **$250/mo** | + Stripe Connect (free for transfers; fees per charge) + Resend or SendGrid for ticket emails + QR generation |
| Phase 4 (6 wks) | **$500/mo** | + Hermes VPS ($5–24) + Paperclip sidecar + AI sponsor tools (Gemini Pro for creative-gen) + multi-tenant overhead |

**Break-even:** Phase 1 break-even on **one** Bronze sponsor at $500. Phase 2 break-even on **one** Silver sponsor at $2,000. Phase 4 break-even on **2 Gold sponsors** at $5k each per month.

---

## 8. Critical risks added by this restructure

| Risk | Mitigation |
|---|---|
| Phase 1 gates not hit by week 3 | Cut scope further — drop Stripe Checkout for paid votes; ship free-only voting |
| Sponsor onboarding wizard takes longer than 4 weeks | Phase 2.5: ship `/sponsor/apply` as Typeform initially; build wizard in Phase 2.5 |
| Trust page legal sign-off blocks Phase 1 | Pre-draft the page in Phase 0 (this week) and circulate to Colombian legal counsel |
| Phone OTP cost-per-verify (Twilio) | Cap free votes at 1/day/phone; budget $0.05 × ~500 verifies/day = $750/mo at peak |
| Audit was wrong about Webflow / OpenClaw | Push-back captured in §3; revisit if audit team disagrees |
| Hybrid scoring is "less democratic" PR risk | Trust page explicitly explains why hybrid > pure-public; link to fraud incidents at competing platforms |

---

## 9. What does NOT change from prior plans

These elements of `01-contests.md` / `02-openclaw-growth.md` / `03-sponsorship-system.md` / `05-unified-platform.md` / `06-trio-integration.md` / `07-ai-event-research.md` are **unchanged** — only the staging changes:

- All Postgres schemas (`vote.*`, `growth.*`, `sponsor.*`, `event.*`, `trio.*`) — kept verbatim
- The architecture diagrams — kept; the trio diagram still describes Phase 4 end-state
- Anti-fraud 5-layer strategy — kept; hardened in Phase 2
- nielsberglund 5-table adoption — kept (Phase 2)
- A6 / A7 automations — kept; **but moved from "trio orchestration" to "OpenClaw skill + pg_cron" in Phase 3**, then re-orchestrated via Hermes/Paperclip in Phase 4
- Real-world walkthroughs (Reina de Antioquia, Bandeja Paisa Week, Estéreo Picnic) — kept; Phase 4 represents the full version

---

## 10. Single biggest change in one sentence

> **Ship one revenue loop in Phase 1 (contest engine, hybrid scoring, Trust page, one OpenClaw broadcast workflow, one sponsor surface) before any other layer touches code.** Sequencing > parallelism for a 1-dev team.

Everything else in this audit response is in service of that sentence.

---

## 11. Tasks (executable, in dependency order)

- [ ] **A1.** Draft Trust page copy in **en + es-CO** (English first, then Spanish-Paisa). Get legal review for Colombia. → **Verify:** counsel signoff captured.
- [ ] **A2.** Implement hybrid scoring (`0.5/0.3/0.2`) as default in `vote.contests` defaults. → **Verify:** new contest created via `/host/contest/new` shows formula on its page.
- [ ] **A3.** Enable Supabase Auth phone OTP. Set as default option alongside email/Google. → **Verify:** phone OTP login works on staging.
- [ ] **A4.** Reduce Phase 1 sponsor support to one surface (`contest_header`); defer wizard. → **Verify:** an admin can manually configure a sponsor on a contest page in 5 minutes.
- [ ] **A5.** Wire OpenClaw VPS for Workflow C only (broadcast every 4h). Disable scrapers / outreach / inbound — Phase 1 has none. → **Verify:** 7-day soak with no missed broadcasts.
- [ ] **A6.** Build the Phase 1 acceptance dashboard at `/admin/phase-1-gates` showing the 8 gate checks live. → **Verify:** all gates show green before declaring Phase 1 done.
- [ ] **A7.** Update `04-roadmap.md` with a banner pointing to this doc as canonical phase plan. → **Verify:** banner visible at top of `04`.
- [ ] **A8.** Update `00-overview.md` to add this doc to the index and fold the new event-* skills into the reading order. → **Verify:** index shows 11 docs, reading time ≤ 95 min.
- [ ] **A9.** Phase 2 kick-off only after all 8 Phase 1 gates green. Block calendar pressure with explicit "no-go" if any gate is yellow.

---

## 12. Verdict — final scoring after this restructure

| Dimension | Before audit | After audit + restructure | Why |
|---|---|---|---|
| Vision | 9/10 | 9/10 | Unchanged — events host contests host sponsors is still the moat |
| Architecture | 8.5/10 | 8.5/10 | Schemas unchanged; staging changed |
| Execution risk | HIGH | **MEDIUM** | One revenue loop per phase, Hermes/Paperclip deferred, hard gates before advance |
| MVP clarity | 5/10 | **9/10** | Phase 1 is now 8 ship-able tasks with measurable gates |
| Trust posture | 5/10 | **9/10** | Hybrid scoring + Trust page + phone OTP + 5-layer fraud — best-in-class for Latin American pageant context |
| Cost discipline | 7/10 | **9/10** | $30/mo Phase 1 → $500/mo Phase 4 with break-even on first sponsor in each phase |

**Net:** the audit was correct. We restructure rather than defend.

---

## See also

- [`00-overview.md`](./00-overview.md) — initiative index
- [`04-roadmap.md`](./04-roadmap.md) — superseded by this doc for phase ordering; kept for reference
- [`01-contests.md`](./01-contests.md) — voting engine (Phase 1 ships this)
- [`02-openclaw-growth.md`](./02-openclaw-growth.md) — OpenClaw layer (Phase 1 ships ONE workflow only; full content in Phase 2)
- [`03-sponsorship-system.md`](./03-sponsorship-system.md) — sponsorship (Phase 2)
- [`05-unified-platform.md`](./05-unified-platform.md) — events (Phase 3)
- [`06-trio-integration.md`](./06-trio-integration.md) — Hermes + Paperclip (Phase 4)
- [`07-ai-event-research.md`](./07-ai-event-research.md) — research that fed this restructure
- [`.claude/skills/event-briefs/SKILL.md`](../../.claude/skills/event-briefs/SKILL.md), [`.claude/skills/event-hosting/SKILL.md`](../../.claude/skills/event-hosting/SKILL.md), [`.claude/skills/event-marketer/SKILL.md`](../../.claude/skills/event-marketer/SKILL.md), [`.claude/skills/event-planner/SKILL.md`](../../.claude/skills/event-planner/SKILL.md), [`.claude/skills/event-prospecting/SKILL.md`](../../.claude/skills/event-prospecting/SKILL.md)
