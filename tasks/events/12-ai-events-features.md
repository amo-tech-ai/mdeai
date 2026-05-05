# AI features for the events system — core, advanced, and how to use them

> **Goal.** Define every AI capability the mdeai events platform offers, ranked by phase and ROI. Companion to [`11-events-system-design.md`](./11-events-system-design.md). Distilled from research on Eventbrite's AI roadmap, Luma's chat features, the trio architecture (Hermes + OpenClaw + Paperclip), and the GitHub-AI-event-planner ecosystem.

**Honest framing first.** Most "AI event planning" GitHub repos that look impressive on paper are 0–5 star tutorials (verified in [`07-ai-event-research.md`](./07-ai-event-research.md) — eight of nine repos at 0 stars; highest at 5). The real AI moat for events is **runtime orchestration on production-grade infra**, not a clever prompt that generates a checklist. This doc is about runtime, not prompts.

---

## 1. Summary

Events platforms in 2026 split into three AI maturity tiers:

| Tier | What they do | Examples |
|---|---|---|
| **Tier 1 — copilot** | AI as autocomplete (event description suggestions, FAQ answers) | Luma chat, Eventbrite Ads optimization |
| **Tier 2 — automator** | AI replaces specific human tasks (recap PDF, attendance calls, sponsor reports) | EventMobi attendance agent, RainFocus Nexus |
| **Tier 3 — orchestrator** | AI runs multi-step workflows with human approval gates | mdeai's target with trio (Phase 4) |

mdeai ships Tier 1 in Phase 1, Tier 2 in Phase 3, Tier 3 in Phase 4. **Don't promise Tier 3 in marketing before Phase 4 ships** — that's how AI products get the "looks impressive but doesn't work" reputation.

**Single biggest AI bet for events:** sponsor ROI attribution explainer (Phase 2-4). 40% of organizers can't prove sponsor ROI today. AI that explains "why your CTR rose 41% Tuesday" is a real differentiator.

---

## 2. Core AI features (must-have for v1.0 — Phase 1+2)

The minimum any modern events platform needs. Each feature uses Gemini directly via existing edge functions; no Hermes/Paperclip yet.

| # | Feature | Model | Phase | Cost/use | Real value |
|---|---|---|---|---|---|
| 1 | **Event hero copy generator** | gemini-3.1-pro-preview | 1 | $0.01–0.03 | Organizer publishes event description in 2 min instead of 30 |
| 2 | **Photo + asset moderation** (events + contestants + sponsor uploads) | gemini-3-flash-preview | 1 | $0.005 | Reject nudity/minors/brand-conflict in <5s; admin reviews edge cases |
| 3 | **Smart auto-tagging** (event categories, themes, audience) | gemini-3-flash-preview | 1 | $0.002 | Better discovery in `/explore`; better recommendations |
| 4 | **Personalized event recommendations** | text-embedding-004 + cosine | 1 | $0.0001/user | "/explore" surfaces events matching user's past behavior |
| 5 | **Pre-event email + WhatsApp copy** (confirmation, T-7, T-1, T-1h) | gemini-3-flash-preview | 1 | $0.005 each | Localized to Spanish-Paisa; voice consistency across cadence |
| 6 | **Anti-fraud anomaly detection** (vote bursts, ticket re-sale rings) | gemini-3-flash-preview | 2 | $0.001/cron tick | L5 of fraud defense; catches slow-burn collusion |
| 7 | **Sponsor creative generator** (3 variants × 2 langs) | gemini-3.1-pro-preview | 2 | $0.05 | Sponsors save agency invoices; faster activation |
| 8 | **Sponsor ROI explainer** (daily 3-sentence narrative) | gemini-3-flash-preview | 2 | $0.005/sponsor/day | "CTR rose 41% Tuesday because…" — the 40%-of-organizers gap closer |
| 9 | **Audience matcher** (sponsor ↔ events fit) | text-embedding-004 + cosine | 2 | $0.0001/match | Sponsors find right events; mdeai converts more sponsors |
| 10 | **Event recap generator** (post-event PDF + 3 social posts) | gemini-3.1-pro-preview | 2 | $0.10/event | Organizer + sponsor get instant deliverable; closes loop |

**Phase 1 cost ceiling for AI:** $50/mo per active event (mostly hero copy + photo moderation). Capped via `ai_runs` table monitoring.

---

## 3. Advanced AI features (Phase 3-4)

These need either (a) Hermes for reasoning, (b) Paperclip for budget/approval gates, or (c) 30+ days of data to be honest.

| # | Feature | Why advanced | Phase |
|---|---|---|---|
| 11 | **AI event planner agent** (organizer prompts "create restaurant week"; AI drafts schedule + tickets + sponsor pitches) | Multi-step reasoning needs Hermes; approvals need Paperclip | 4 |
| 12 | **A6 — attendance confirmation agent** (T-12h WA template + reply classification) | Agent-driven workflow with sub-agent fan-out | 3 (basic) → 4 (orchestrated) |
| 13 | **A7 — contestant intake chase** (twice-weekly reminders for incomplete profiles) | Personalized reminders with context | 3 (basic) → 4 (orchestrated) |
| 14 | **Smart ticket pricing** (dynamic pricing based on demand) | Needs A/B test infrastructure + statistical confidence | 4 |
| 15 | **Sponsor optimizer** (daily insight + one-click apply: "shift weight from X to Y; expected +12% CTR") | Reasoning over time-series + reversibility | 4 |
| 16 | **Brand-safety auto-pause** (controversy detection → pause sponsor placement → admin alert) | Multi-signal classification + governance | 4 |
| 17 | **Live polling + Q&A AI moderator** (filter spam, surface best questions) | Real-time inference under load | 4 |
| 18 | **Voice-driven event ops** ("Hermes, broadcast top 5 to WA Community") | Talk Mode integration | 4 |
| 19 | **Sentiment analysis on attendee feedback** (post-event survey aggregation) | Free-text NLP at scale | 3 |
| 20 | **Predictive attendance forecaster** (will this event sell out by week N?) | ML model over 50+ past events | 4+ |

---

## 4. AI agents architecture for events (the trio in detail)

Phase 4 introduces three runtimes with strict separation of concerns. Until then, Gemini direct + cron does most of the work.

```
┌──────────────────────────────────────────────────────────────────┐
│ PAPERCLIP — control plane (issues, approvals, budgets, audit)    │
│                                                                    │
│ Per event: 1 company, 4 goals (publish / sell / run / recap)      │
│ Heartbeat scheduler triggers daily review issues                  │
│ Budget cap: max $X/day per agent before pause                     │
└─────────┬────────────────────────────────────────┬───────────────┘
          │                                          │
          │ wakes via PAPERCLIP_TASK_ID              │ webhook
          ▼                                          ▼
┌──────────────────────────────────┐  ┌────────────────────────────┐
│ HERMES — reasoning brain         │  │ OPENCLAW — execution hands │
│                                   │  │                              │
│ Reads Supabase via MCP           │  │ Twilio + SendGrid + Apify  │
│ Computes deltas + recommendations │  │ Browser screenshots         │
│ Spawns sub-agents per event      │  │ Cron broadcasts             │
│ Writes plans, never auto-acts    │  │ Inbound message handling   │
└────────────┬─────────────────────┘  └────────┬───────────────────┘
             │                                  │
             └──────────┬───────────────────────┘
                        ▼
            ┌────────────────────────────┐
            │ SUPABASE — source of truth │
            │ event.* vote.* sponsor.*   │
            │ trio.tool_runs (audit)     │
            └────────────────────────────┘
```

### 4.1 Per-event agent setup (Phase 4)

When an event publishes, Paperclip auto-creates:
1. **Company** — "Estéreo Picnic 2026" with 4 goals (publish, sell tickets, run on day, post-event recap)
2. **Issue tree** — root issue for each goal, sub-issues for each task (12 sub-issues for ticket sales alone)
3. **Routines** — daily review (9am), weekly digest (Mon 10am), per-event hooks (T-30 / T-7 / T-0 / T+1)

Each routine wakes Hermes with `PAPERCLIP_TASK_ID`. Hermes reads context, drafts decisions, posts comments, suggests actions. Admin one-taps approval; OpenClaw executes.

### 4.2 Seven first automations for events (priority-ordered)

Same A1–A7 from `06-trio-integration.md`, restated for events context:

| # | Automation | Phase | Trigger | Action |
|---|---|---|---|---|
| **A1** | Daily event health review | 4 | Cron 9am | Hermes pulls last-24h ticket sales + attendance + sponsor metrics → narrative comment |
| **A2** | Sponsor application approval | 4 | INSERT into `sponsor.applications` | Paperclip approval gate → Hermes welcome draft → OpenClaw WA send |
| **A3** | Leaderboard / countdown broadcast | 1 | Cron every 4h during live event | OpenClaw direct (Phase 1) → re-orchestrated via Paperclip+Hermes (Phase 4) |
| **A4** | Outreach send-loop with budget cap | 3 | Cron every 30 min | Paperclip checks budget → Hermes drafts → OpenClaw sends via Twilio + SendGrid |
| **A5** | Weekly sponsor ROI report | 3 | Cron Monday 10am | Hermes narrates last 7 days → PDF → OpenClaw delivers via email + WA |
| **A6** | Attendance confirmation (T-12h before event) | 3 | Cron triggered T-12h | OpenClaw sends WA template → Hermes classifies replies → updates `event.bookings.attendance_intent` |
| **A7** | Contestant intake chase (Phase 2 contests only) | 3 | Cron twice-weekly | Hermes drafts per-contestant reminder → OpenClaw sends |

### 4.3 Why three runtimes, not one

| Concern | Owner | Why not the others |
|---|---|---|
| Reasoning + ranking + sub-agents + memory | **Hermes** | OpenClaw doesn't have learning loop; Paperclip is governance not reasoning |
| Channels + browser + scraping + cron | **OpenClaw** | Hermes doesn't have 18+ messaging channels; Paperclip orchestrates but doesn't execute |
| Approvals + budgets + audit + multi-tenant | **Paperclip** | Hermes/OpenClaw lack governance primitives; needed for sponsor money + brand safety |
| Source of truth | **Supabase** | All three runtimes read this; never the inverse |

**Rule of thumb.** *Channel or external API → OpenClaw. Reasoning or memory → Hermes. Approval or budget → Paperclip. What's true → Supabase.*

---

## 5. How to best use AI features (concrete patterns)

### 5.1 Pattern: AI proposes, human applies

The **single most important AI rail** in mdeai. Per [`ai-interaction-patterns.md`](../../.claude/rules/ai-interaction-patterns.md). No AI auto-publishes a sponsor creative, auto-charges CPL, auto-shadow-blocks, or auto-emails sponsors.

```
Voter → Vote
         ↓
Realtime triggers fraud-scan cron
         ↓
Gemini classifies "suspicious cluster, confidence 0.94"
         ↓
Paperclip opens issue with one-tap "Apply shadow-block?"
         ↓
Admin reviews, approves
         ↓
OpenClaw applies; trio.tool_runs logs the action
```

**Never skip the admin tap.** Even at 99% confidence, the trust narrative requires human-in-the-loop for actions with brand or money implications.

### 5.2 Pattern: progressive AI enrichment

Don't run expensive Gemini Pro on every input. Layer cheap → expensive only when needed.

| Layer | Cost | Use |
|---|---|---|
| L1 — Postgres CHECK constraint | $0 | Reject obviously invalid input |
| L2 — Embedding lookup | $0.0001 | Semantic match against existing classifications |
| L3 — Gemini Flash classification | $0.002 | Quick categorical decision |
| L4 — Gemini Pro reasoning | $0.05 | Multi-step decision with explanation |
| L5 — Hermes sub-agent fan-out (Phase 4) | $0.20 | Complex multi-source decisions |

**Example: contestant photo upload** — Postgres rejects file >10MB (L1) → embed against `vote.entities.embedding` for similar-photo dedup (L2) → Flash classifies clean/flagged/rejected (L3); only escalate to L4 if borderline.

### 5.3 Pattern: AI explainability over AI accuracy

**Sponsors and organizers don't trust black-box AI.** Every AI output must include "why" in plain Spanish-Paisa, citing data points the user can verify.

Bad: `{ "label": "bot", "confidence": 0.94 }`
Good:
```json
{
  "label": "bot",
  "confidence": 0.94,
  "reason": "73 votes from 4 IPs in same /24 within 60s; user-agent cluster suggests automation",
  "evidence": [
    { "type": "ip_cluster", "details": "..." },
    { "type": "ua_repetition", "details": "..." }
  ]
}
```

**Why this matters.** When admin one-taps Apply on a shadow-block, they see the evidence. When the journalist asks why a vote was excluded, you have an audit trail.

### 5.4 Pattern: budget-capped AI

Per `06-trio-integration.md` §8: every AI call logs cost in `trio.tool_runs.cost_usd_cents`. Daily aggregates roll into `trio.budgets_today` materialized view. Paperclip auto-pauses any agent that exceeds its daily budget.

| Agent | Daily cap (Phase 1) | Daily cap (Phase 4) |
|---|---|---|
| Photo moderation | $5 | $10 |
| Hero copy generation | $1 | $5 |
| Anti-fraud cron | $5 | $10 |
| Sponsor ROI explainer (per sponsor) | $0.50 | $1 |
| Hermes reasoning (per event) | n/a | $5 |
| Total per event per day | ~$15 | ~$50 |

**Override path.** Admin can extend budget via Paperclip approval; logged. Auto-pause if budget hit and not extended within 1h.

### 5.5 Pattern: AI for the right actor at the right time

| Actor | Best AI feature for them | When |
|---|---|---|
| **Organizer** (Daniela) | Event hero copy generator | At publish |
| **Organizer** | A6 attendance confirmation | T-12h before event |
| **Organizer** | A1 daily health review | 9am during sales window |
| **Organizer** | Recap PDF generator | T+1 after event |
| **Attendee** (Camila) | Personalized recommendations on `/explore` | Always |
| **Attendee** | Smart event reminders (right cadence, right tone) | T-7, T-1, T-1h |
| **Sponsor** (Andrés) | Daily ROI explainer narrative | 9am every day during event |
| **Sponsor** | Creative generator (3 variants for sponsor approval) | At asset-upload step |
| **Sponsor** | Audience matcher | When considering a new event |
| **Contestant** (Laura) | Photo moderation feedback at upload | Live during intake |
| **Contestant** | Intake chase reminders (A7) | T-7 + T-3 if profile incomplete |
| **Judge** (Juan) | AI scoring co-pilot (vision-based, side-panel suggestion) | During scoring (never replaces) |
| **Voter** (Camila) | Hybrid scoring formula explanation on Trust page | First visit |
| **Admin** (mdeai ops) | Brand-safety alert on fraud spike | As-detected |
| **Admin** | Sponsor optimizer recommendations | Daily |

---

## 6. AI evaluation strategy (eval before production)

Every AI feature has a measurable pass-rate before launch. Per `09-prd.md` §3.3:

| Feature | Eval | Pass rate |
|---|---|---|
| Photo moderation | 100 hand-labeled images (50 clean / 30 borderline / 20 reject) | ≥95% precision on rejects, ≥90% recall |
| Anti-fraud anomaly | 1,000 vote bursts (700 clean / 200 bot / 100 collusion) | ≥85% F1 on `suspicious` |
| Outreach personalization | 50 hand-labeled contacts; check URL hallucination | ≥95% URL-clean; ≥80% perceived-personalization |
| Creative generator | 25 sponsor briefs; human eval 5 dimensions | Mean ≥4.0/5.0 |
| ROI explainer | 10 weeks synthetic; check hallucinated numbers | **0 hallucinated numbers** (hard requirement) |
| A6 attendance classifier | 200 real Spanish replies; F1 across 4 labels | ≥90% F1 weighted |
| A7 chase drafter | 50 incomplete profiles; perceived personalization | ≥80% |
| Event recap | 5 closed events; sponsor + organizer rating | Mean ≥4.0/5.0 |

Eval data + scripts at `tasks/events/evals/` (to be created in Phase 1 task).

---

## 7. What we don't build (explicit non-goals)

| Don't build | Why |
|---|---|
| **AI auto-publishing sponsor creatives** | Brand-safety nightmare; admin approval mandatory |
| **AI auto-charging CPL via Stripe Connect** | Trust-gated; needs admin sign-off + dispute path |
| **AI auto-pricing tickets dynamically** | Requires huge data + statistical confidence; Phase 4+ at earliest |
| **AI chat for attendees** (Eventbrite-style "ask the event") | Maintenance burden; redirect to human FAQ |
| **AI judge that replaces humans** | Ethical + legal risk; only side-panel suggestion |
| **AI image generation of contestants** | Identity rights; not appropriate for pageant |
| **Free-text AI search across all events** | Pgvector + simple cosine wins; expensive RAG for marginal gain |
| **Voice-only event creation** ("Hermes, create my event") | Demos great, ships poorly; Phase 4+ if at all |
| **Cross-event recommendation AI that follows users across organizers** | Privacy minefield; needs explicit consent UX |

---

## 8. Anti-patterns from the GitHub-AI-event-planner ecosystem

Per `07-ai-event-research.md` audit (verified May 2026): 8 of 9 "AI event planner" repos have 0 stars; highest has 5; most are stale 7+ months. **They are tutorials, not production references.** Common pitfalls to AVOID:

| Anti-pattern (from the repos) | What we do instead |
|---|---|
| GPT-3.5 wrappers with no eval pipeline | Gemini 3.x with eval suites per feature |
| Single-prompt "give me an event plan" demos | Phased workflow with checkpoints |
| AI that does everything end-to-end | AI proposes; human applies |
| Front-end that shells out to AI in browser | Edge functions only; no client-side keys |
| No cost tracking | `ai_runs` + `trio.tool_runs` + budget caps |
| No fraud detection in voting | 5-layer defense, 4 of which are hand-tuned |
| English-only assumptions | English-first + Spanish-Paisa native |
| Single-tenant schema | Multi-event from day 1 (`event.events` + `vote.contests` joinable) |
| No audit trail | Paperclip records every mutating action |
| Hot-reloading prompts in production | Versioned prompts with Gemini structured output schema |

---

## 9. Real-world AI use cases — Miss Elegance Colombia 2026 (Phase 1)

### Day 0: Daniela publishes the event

1. Daniela types title + description. Taps "Generate hero copy" — Gemini Pro returns 3 en-first variants in es-CO.
2. Uploads venue photo. Gemini Flash moderates → clean.
3. Adds tickets. Auto-tagging classifies as `pageant_finals`, suggests cross-listing in `Beauty / Pageant / Medellín` tags.
4. Publishes. `event.events.embedding` computed for `/explore` recommendation.
5. **Total AI cost so far:** ~$0.05. Human time saved: ~30 min.

### Day -7: Tickets selling, sponsor onboarding

1. Postobón applies. Sponsor moderation: Gemini Flash checks logo + brand guidelines compliance — clean.
2. Sponsor uploads creative. Gemini Pro generates 3 caption variants (en + es-CO).
3. Daniela approves. **A2 automation (Phase 4):** Hermes drafts welcome email; OpenClaw sends.
4. **Cost so far:** ~$0.10/sponsor. Human time saved: ~2 hours of agency invoice.

### Day -1: Attendance confirmation (Phase 3)

1. **A6 fires at T-12h.** OpenClaw sends WA template "¿Confirmas mañana?" to all 4,200 paid attendees.
2. As replies come in, Hermes classifies (Phase 4) — 3,140 confirmed, 210 declined, 380 maybe, 470 no_response.
3. Daniela sees rollup at 9am day-of: "70%+ confirmation; 11% decline rate (within normal); 11% maybe (target with reminder?)."
4. **Cost:** ~$25 (4,200 × $0.005 Twilio template + Gemini classification). **Saved:** an entire community manager call list.

### Day 0: Live event

1. **A3 broadcasts** every 4h to 5,200-member Medellín WhatsApp Community: leaderboard screenshot + caption. Sponsor logo watermarked.
2. **Anti-fraud cron** (every 60s): Gemini Flash analyzes vote bursts. Detects bot ring at 20:42 (73 votes/min from one IP cluster). Paperclip alerts Daniela on Signal. She one-taps approve. OpenClaw shadow-blocks.
3. **Cost:** ~$2 for the event broadcast + fraud scan. **Saved:** real-time visibility + caught attack invisible to manual ops.

### Day +1: Recap

1. Daniela hits "Generate recap." Gemini Pro produces 5-page PDF: ticket sales, attendance %, NPS, top quotes, sponsor metrics, suggested next-event tweaks.
2. Hermes drafts 3 social posts (TikTok/IG/X). Daniela approves.
3. Postobón gets their own ROI dashboard with daily AI insight: "CTR rose 41% Tuesday because contest hit a viral moment in Laureles. Recommend doubling weight on push_notif Tue 18:00–21:00 next event."
4. **Cost:** ~$1/recap. **Saved:** 4–6 hours of agency post-event work.

### Total event AI spend: ~$30. Human time saved: ~12+ hours. Sponsor renewal probability: significantly up.

---

## 10. Skills mapping — which skill does what for AI features

Skills referenced from the consolidated set (post-cleanup, 50 entries; see [`skills-audit.md`](../skills-audit.md)).

| Skill | AI feature coverage |
|---|---|
| [`gemini`](../../.claude/skills/gemini) | Edge-function integration patterns (every Gemini call) |
| [`gemini-api-dev`](../../.claude/skills/gemini-api-dev) | SDK usage for Pro/Flash; structured output; thinking levels |
| [`gemini-interactions-api`](../../.claude/skills/gemini-interactions-api) | Multi-turn chat patterns when relevant |
| [`events`](../../.claude/skills/events) | Event-specific workflow context (briefs, planner, marketer, hosting) |
| [`mermaid-diagrams`](../../.claude/skills/mermaid-diagrams) | Diagrams for AI workflow design |
| [`mde-writing-plans`](../../.claude/skills/mde-writing-plans) | AI prompt + skill authoring patterns |
| [`mdeai-project-gates`](../../.claude/skills/mdeai-project-gates) | Pre-deploy verification of any AI-touched code |
| [`open-claw`](../../.claude/skills/open-claw) | OpenClaw skill authoring (A3, A4, A6 handlers) |
| [`hermes`](../../.claude/skills/hermes) | Phase 4 reasoning agent setup |
| [`paper-clip`](../../.claude/skills/paper-clip) | Phase 4 governance + budgets |
| [`twilio-whatsapp`](../../.claude/skills/twilio-whatsapp) | A6 + A3 + A2 send patterns |
| [`firecrawl-agent`](../../.claude/skills/firecrawl-agent) | Influencer enrichment for outreach |
| [`vitest-component-testing`](../../.claude/skills/vitest-component-testing) | Eval suites for every AI feature |
| [`systematic-debugging`](../../.claude/skills/systematic-debugging) | When AI produces wrong output |
| [`prd`](../../.claude/skills/prd) | Eval pass-rate documented per feature |

---

## 11. Final recommendation — phased AI adoption

| Phase | AI tier | What ships |
|---|---|---|
| **1 — MVP Events** (4 weeks) | Tier 1 (copilot) | Hero copy, photo moderation, smart auto-tagging, recommendations, cadence email/WA copy |
| **2 — Sponsorship + Contests** (5 weeks) | Tier 1 + early Tier 2 | + Anti-fraud cron, sponsor creative gen, sponsor ROI explainer, audience matcher, recap generator |
| **3 — Marketing + Growth** (4 weeks) | Tier 2 (automator) | + A6 attendance, A7 intake chase, A4 outreach send-loop, A5 weekly ROI report — all via OpenClaw direct (no Hermes yet) |
| **4 — AI Orchestration** (6 weeks) | Tier 3 (orchestrator) | + Hermes + Paperclip + AI sponsor optimizer + brand-safety auto-pause + CPL pricing + voice mode |

**Don't market Tier 3 capabilities before Phase 4 ships.** Demos that work in Phase 1 with Hermes + Paperclip will be brittle until the trio runs for 14 days clean. Better to under-promise and over-deliver.

---

## 12. Quick reference: AI features at a glance

```
PHASE 1 (live now after MVP)
✓ Generate event description    ✓ Photo moderation
✓ Auto-tag events               ✓ Smart recommendations
✓ Cadence email/WA copy

PHASE 2 (with sponsorship + contests)
✓ Anti-fraud anomaly cron       ✓ Sponsor creative gen
✓ Sponsor ROI explainer          ✓ Audience matcher
✓ Event recap generator

PHASE 3 (with growth orchestration)
✓ A6 attendance confirm         ✓ A7 contestant chase
✓ A4 outreach send-loop          ✓ A5 weekly ROI report

PHASE 4 (with trio = Hermes + Paperclip)
✓ AI event planner agent        ✓ Sponsor optimizer
✓ Brand-safety auto-pause       ✓ Voice ops
✓ CPL pricing engine             ✓ Sub-agent fan-out
```

---

## 13. Key insight for product narrative

> **mdeai's AI is not "smart event creation" — it's "AI that closes the 40% sponsor-ROI gap that Eventbrite, Luma, and Cvent all leave open."**

That's the wedge. Every other AI feature (hero copy, recap, moderation) is table-stakes by 2026. The differentiator is sponsor attribution + AI explainer + governed action loops. Sell that.

---

## See also

- [`11-events-system-design.md`](./11-events-system-design.md) — events platform design (this is the AI deep-dive companion)
- [`09-prd.md`](./09-prd.md) §3 — AI System Requirements + eval strategy
- [`06-trio-integration.md`](./06-trio-integration.md) — Hermes + OpenClaw + Paperclip runtime
- [`07-ai-event-research.md`](./07-ai-event-research.md) — honest audit of GitHub AI-event-planner ecosystem
- [`02-openclaw-growth.md`](./02-openclaw-growth.md) — A1–A7 automation specs
- [`.claude/skills/events/`](../../.claude/skills/events) — consolidated events skill (briefs / planner / marketer / hosting)

## Sources (verified May 2026)

- [Niels Berglund — Building Event Management with Claude Code Part 11](https://nielsberglund.com/post/2026-02-22-building-an-event-management-system-with-claude-code-part-11---campaign-tracking--batch-sending/) — campaign tracking + batch sending; MCP orchestration patterns
- [Niels Berglund — Part 3: Architecting an AI-Native System](https://nielsberglund.com/post/2025-12-28-building-an-event-management-system-with-claude-code-part-3---architecting-an-ai-native-system/) — AI-native architecture
- [mcpmarket — event-planning-briefing skill](https://mcpmarket.com/tools/skills/event-planning-briefing) — already absorbed into `.claude/skills/events/references/briefs.md`
- [mcpmarket — event-coordinator-for-google-workspace](https://mcpmarket.com/tools/skills/event-coordinator-for-google-workspace) — already absorbed into `.claude/skills/events/references/planner.md` §Tool integrations
- [mcpmarket — sponsorships-partnerships-expert](https://mcpmarket.com/tools/skills/sponsorships-partnerships-expert) — referenced; rate-limited at fetch time
- [Bizzabo Sponsor ROI Onsite Data Playbook](https://www.bizzabo.com/blog/sponsor-roi-onsite-data-playbook) — 40% organizer ROI gap
- [Anyroad event sponsorship packages 2026](https://blog.anyroad.com/post/event-sponsorship-packages) — ROI guide
- [Ticket Fairy proving sponsor ROI 2026](https://www.ticketfairy.com/blog/proving-sponsor-roi-in-2026-tech-tools-to-deliver-value-and-secure-partnerships)
- [Claude — How to create Skills](https://claude.com/blog/how-to-create-skills-key-steps-limitations-and-examples)
- [Claude Code Skills docs](https://code.claude.com/docs/en/skills)
- [Top GitHub AI event repos audit (in `07-ai-event-research.md`)](./07-ai-event-research.md) — 8 of 9 repos at 0 stars; tutorials only
