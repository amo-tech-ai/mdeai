# Trio integration plan — OpenClaw + Hermes + Paperclip + Supabase

> **BLUF:** Three runtimes, one source of truth. **OpenClaw** owns channels and execution (WhatsApp, Telegram, Discord, Signal, browser, exec, scraping). **Hermes Agent** owns reasoning, memory, sub-agent spawning, and the MCP tool surface. **Paperclip** owns governance — issues, approvals, budgets, multi-company isolation, audit trail. **Supabase** stays the source of truth (`vote.* / growth.* / sponsor.* / event.*` from the rest of this folder). Cost-aware, security-aware, beginner-friendly: nothing irreversible happens without a Paperclip approval; nothing pays for itself without crossing a Paperclip budget cap.

**Goal.** Replace ad-hoc shell scripts and "I'll do it myself in Make.com" with one integrated stack that runs the contests initiative end-to-end with auditable governance.

**User story.**
> *As an operator running "Reina de Antioquia 2026" + "Bandeja Paisa Week" simultaneously, I want every automated action — DM sent, vote cast, sponsor logo flipped live, budget transferred — to flow through Paperclip's approval queue, leverage Hermes for reasoning + memory, and reach the world via OpenClaw's messaging channels. I want one weekly review issue that auto-closes if everything is green and pages me only when something needs a human.*

**Approach.** Each tool does what it's best at. Paperclip is the planner and approver; Hermes is the brain; OpenClaw is the hands. They communicate through Supabase (`trio.*` schema) plus Paperclip webhooks → OpenClaw cron → Hermes MCP calls. No tool tries to be all three.

**Stack.**
- **OpenClaw** v2026 (self-hosted, $20/mo VPS) — channels + exec + skills
- **Hermes Agent** v0.12.0+ (self-hosted, $5+ VPS) — reasoning + memory + sub-agents
- **Paperclip** v2026.428.0+ (self-hosted, can sidecar on either VPS) — governance + tasks
- **Supabase** (mdeai project) — source of truth, durable rate limiter, idempotency

---

## 1. Simple explanation of each tool

### OpenClaw — the hands

> **What it is:** an open-source self-hosted gateway that routes AI agents across 18+ messaging channels (WhatsApp, Telegram, Discord, Slack, iMessage, Signal, Matrix, MS Teams, Google Chat, …) and runs skills with browser/exec/cron tools.
>
> **Best at:** turning a chat message into a real-world action (post to TikTok, send WA template, scrape a page, run a shell command). Has the largest ecosystem — 5,700+ community skills on ClawHub.
>
> **Worst at:** reasoning over long context, ranking, learning from past runs. It's a "doer that turns messages into actions and has very few opinions about how to use them."

### Hermes Agent — the brain

> **What it is:** an open-source self-hosted agent by Nous Research (Feb 2026) with a closed learning loop, agent-curated memory, sub-agent spawning, and MCP tool support.
>
> **Best at:** reasoning, ranking, memory, sub-agent fan-out, MCP integration (40+ built-in tools, plus any MCP server). Self-improves: creates skills from experience, refines them during use, persists user models across sessions.
>
> **Worst at:** running 18 messaging channels (only 15+ but smaller plugin set than OpenClaw). Better for "understand your workflows deeply" than "send the message reliably."
>
> **Key bridge:** ships `hermes claw migrate` to import OpenClaw config + memory + skills + keys. This is your escape hatch if OpenClaw stops being maintained — no lock-in.

### Paperclip — the control plane

> **What it is:** an open-source Node.js + React orchestration platform (March 2026, by @dotta) that runs "AI companies" — collections of agents working on issues with goals, budgets, approvals, audit logs.
>
> **Best at:** governance — multi-company isolation, approval gates, budget caps with hard stops, run liveness watchdog, structured issue threads, audit trail (every mutating request linked to an actor).
>
> **Worst at:** running scrapers / posting to social / understanding your domain. It's a coordinator, not a worker. Stability "not there yet" per April 2026 reports — wait for v2026.5xx releases or use cautiously.
>
> **Why it's critical:** Cisco flagged OpenClaw as a prompt-injection risk because of broad system permissions. Paperclip's approval gate + budget cap + audit trail directly mitigates that risk class.

### Supabase — the source of truth

> Already wired in mdeai. Holds `vote.* / growth.* / sponsor.* / event.*` from the four prior plans. Adds `trio.*` schema (this doc) for cross-tool run tracking.

---

## 2. Integration architecture

```
                       ┌──────────────────────────────────────┐
                       │          PAPERCLIP                   │
                       │  Companies, issues, goals, budgets    │
                       │  Approval gates, audit trail          │
                       │  Heartbeat scheduler → wakes agents   │
                       └─────┬───────────────────┬────────────┘
                             │ webhook /         │ approval gate
                             │ heartbeat         │ + budget cap
                             ▼                   ▼
                ┌──────────────────────┐    ┌──────────────────────┐
                │   HERMES AGENT       │    │   OPENCLAW           │
                │   Reasoning + memory │    │   Channels + exec    │
                │   Sub-agents         │    │   Skills + cron      │
                │   MCP tools (40+)    │    │   Browser/scraping   │
                │   Camofox (anti-bot) │    │   ClawHub (5,700+)   │
                └────────────┬─────────┘    └─────────┬────────────┘
                             │                        │
                             │ both call              │
                             │ Supabase via           │
                             │ MCP (Hermes) or        │
                             │ service-role JWT       │
                             │ (OpenClaw skills)      │
                             ▼                        ▼
                   ┌────────────────────────────────────────────┐
                   │              SUPABASE                      │
                   │  vote.*  growth.*  sponsor.*  event.*      │
                   │  trio.tool_runs  trio.handoffs  ai_runs    │
                   │  Storage  Realtime  pg_cron  Stripe         │
                   └────────────────────────────────────────────┘
                             ▲                        ▲
                             │                        │
                             └────────┬───────────────┘
                                      │
                            ┌─────────▼──────────┐
                            │   END USERS        │
                            │  Travelers / hosts │
                            │  voters / sponsors │
                            └────────────────────┘
```

### Communication patterns

| From → To | Pattern | Example |
|---|---|---|
| **Paperclip → OpenClaw** | Webhook to OpenClaw HTTP API | "Issue moved to in_progress; trigger broadcast workflow" |
| **Paperclip → Hermes** | Heartbeat env (`PAPERCLIP_TASK_ID`) → Hermes spawned as ACP agent | "Wake up, work issue PAP-123, then exit" |
| **Hermes → OpenClaw** | MCP tool: `openclaw.message_send`, `openclaw.run_skill` | Hermes drafts content; calls OpenClaw to send via WA |
| **OpenClaw → Hermes** | MCP bridge — OpenClaw exposes channels as MCP tools | OpenClaw forwards inbound WA message; Hermes reasons |
| **Any → Supabase** | service-role JWT, scoped RLS per schema | Hermes reads `growth.contacts`; OpenClaw writes `growth.outreach_messages` |
| **Any → Paperclip** | REST `/api/issues/*` with run-id header | OpenClaw or Hermes opens an issue when something needs human eyes |

---

## 3. Feature table — who owns what

| Capability | Owner | Why |
|---|---|---|
| WhatsApp / Telegram / Discord routing | **OpenClaw** | Native multi-channel gateway, 18+ platforms, biggest ecosystem |
| Reasoning + ranking + recommendation | **Hermes** | Closed learning loop + curated memory + sub-agent fan-out |
| Approval gates / human-in-loop | **Paperclip** | Multi-stage workflow with audit trail |
| Budget / cost control with hard stop | **Paperclip** | Per-agent budgets; pauses when spent |
| Multi-company / multi-tenant isolation | **Paperclip** | "Multi-business in one install" — one company per organizer |
| Sub-agent spawning + parallel work | **Hermes** | `execute_code` programmatic tool calling |
| MCP tool integration | **Hermes** (preferred) | 40+ built-in tools + any MCP server |
| Browser automation + scraping | **Hermes** for stealth, **OpenClaw** for simple | Hermes ships Camofox anti-detection (v0.7.0+) |
| Persistent issue tracking | **Paperclip** | Companies → goals → projects → issues → comments |
| Cron / scheduled automations | **OpenClaw** for channel actions, **Paperclip** for routines | OpenClaw cron drives sends; Paperclip routines drive review issues |
| Memory across sessions | **Hermes** | FTS5 cross-session recall + agent-curated MEMORY.md |
| Long-term user modeling | **Hermes** | Honcho dialectic user modeling (built-in) |
| Run liveness watchdog | **Paperclip** | Detects stalled work, auto-opens recovery issues |
| Source of truth (data) | **Supabase** | Already in mdeai — keep it that way |
| Audit trail | **Paperclip** | Every mutating API call linked to an actor + run id |
| Voice / Talk Mode (TTS + wake word) | **OpenClaw** | Native; Hermes can call via MCP |
| Image / video generation | **Hermes** + Gemini Pro | ComfyUI bundled in Hermes v0.12.0; Gemini Pro for stills |

**Rule of thumb.** If it's a *channel* or *external API* — OpenClaw. If it's *reasoning* or *memory* — Hermes. If it's *who needs to approve* or *what's the budget* — Paperclip. If it's *what is true* — Supabase.

---

## 4. Event management use cases

| Step | Tool | What happens |
|---|---|---|
| 1. Organizer creates "Estéreo Picnic 2026" via `/host/event/new` | Supabase | Row inserted into `event.events` |
| 2. Postgres trigger opens a Paperclip issue | Paperclip | "Set up Estéreo Picnic 2026" issue with 4 sub-issues (one per contest) |
| 3. Operator's heartbeat picks up the issue | Paperclip → Hermes | Hermes spawned with `PAPERCLIP_TASK_ID`; reads issue context |
| 4. Hermes drafts a launch checklist | Hermes | Posts comment to issue with 12-step checklist |
| 5. Operator approves checklist | Paperclip | Checklist becomes child issues |
| 6. "Generate event hero copy" issue runs | Hermes → Gemini Pro | Drafts 3 variants in **en + es-CO** (English first) |
| 7. "Schedule promo posts" issue runs | OpenClaw → Post Bridge | Daily TikTok + IG Story scheduled |
| 8. "Daily ticket-sales review" routine | Paperclip cron | Wakes Hermes nightly; Hermes pulls from `event.bookings`, posts narrative comment |
| 9. Day-of: "Door scan QR validate" | OpenClaw skill | Operator scans QR at gate; OpenClaw calls `ticket-validate` edge fn |
| 10. Post-event recap | Paperclip → Hermes | Hermes generates PDF + 3 social posts |

**What changes vs. doing it solo:** Without Paperclip, there's no audit trail of who approved what; without Hermes, the copy is generic; without OpenClaw, the WhatsApp broadcasts don't go out reliably. Each tool would work alone but with worse outcomes.

---

## 5. Sponsorship system use cases

| Step | Tool | What happens |
|---|---|---|
| 1. Sponsor submits `/sponsor/apply` | Supabase | Row in `sponsor.applications` (status='submitted') |
| 2. Trigger opens Paperclip approval issue | Paperclip | Issue routed to admin with 24h SLA |
| 3. Admin opens issue, sees AI moderation pre-check | Hermes → Gemini | Side-panel comment: "Brand legal in CO ✓; competitor conflict: none" |
| 4. Admin approves | Paperclip | Application status → `approved`; budget cap enforced |
| 5. Stripe Checkout | Supabase edge fn | `sponsor-checkout` returns URL |
| 6. Payment webhook | Supabase | Flips `sponsor.invoices.status` to `paid` |
| 7. Welcome message drafted | Hermes | Personalized to brand + tier |
| 8. Welcome message sent | OpenClaw → Twilio WA | Template message to brand contact |
| 9. Daily ROI rollup | Supabase pg_cron | `sponsor.roi_daily` populated |
| 10. Weekly insight + recap | Paperclip routine → Hermes | Hermes writes 3-sentence "why it worked" → posted as issue comment + sent via OpenClaw |
| 11. Performance pricing reconciliation | Paperclip approval gate | Variable Stripe Connect transfer requires admin sign-off |

**Why three tools.** Approval (Paperclip) protects against a misconfigured sponsor going live; reasoning (Hermes) protects against generic AI slop; channels (OpenClaw) protect against deliverability issues.

---

## 6. Contest / voting use cases

| Step | Tool | What happens |
|---|---|---|
| 1. Voter casts vote in `/vote/:slug` | Supabase | `vote.votes` insert via `vote-cast` edge fn |
| 2. Fraud signal exceeds threshold | Supabase | Postgres `NOTIFY` fires |
| 3. Listener opens Paperclip issue | Paperclip | "Suspicious vote burst — IP cluster X" with priority=critical |
| 4. Admin gets WhatsApp ping | OpenClaw | Notification with one-tap "View issue" link |
| 5. Hermes pulls full context | Hermes | Calls Supabase via MCP, reads recent `vote.votes`, runs anomaly reasoning |
| 6. Hermes posts findings | Paperclip | Comment with classification: `bot_ring`, `coordinated_collusion`, or `clean` |
| 7. Admin one-taps "shadow-block" | Paperclip approval | Approval triggers OpenClaw skill `shadow-block-cluster` |
| 8. Shadow-block executes | OpenClaw | Calls `vote-shadow-block` edge fn; logs to `trio.tool_runs` |
| 9. Daily leaderboard broadcast (4h cadence) | Paperclip routine → OpenClaw | OpenClaw cron triggers; reads top-5 from `vote.entity_tally`; Gemini writes caption; sends to WA Community |
| 10. Reply-to-vote on WhatsApp | OpenClaw inbound hook | Voter texts "1/2/3" → calls `vote-cast` |

---

## 7. Marketing / social media automation use cases

| Step | Tool | What happens |
|---|---|---|
| 1. Apify nightly enrichment cron | OpenClaw skill | Pulls `#medellin` IG/TikTok hashtags, ~500 contacts/night |
| 2. Classification + embedding | Hermes (sub-agent fan-out) | Spawns 5 sub-agents to parallel-classify; uses Gemini text-embedding-004 |
| 3. Upsert into Supabase | OpenClaw skill | `growth.contacts` upsert on `(platform, source_handle)` |
| 4. "Outreach campaign" issue | Paperclip | Operator creates campaign issue with daily cap = 50, budget = $30/day |
| 5. Personalization drafts | Hermes | For each contact, Hermes drafts a personalized line; rejects any with invented URLs |
| 6. Approval queue (first 100) | Paperclip | Drafts in `in_review` status; admin batch-approves |
| 7. Send loop runs every 30 min | OpenClaw cron | Reads approved messages; sends via Twilio WA + SendGrid |
| 8. Reply detection | OpenClaw inbound hook | Routes reply to Hermes for sentiment + intent classification |
| 9. Hot lead → Stripe Connect onboard | Hermes → OpenClaw | Hermes drafts partnership invite; OpenClaw sends; Paperclip tracks signed contracts |
| 10. Budget cap hit | Paperclip | Pauses campaign automatically; opens "extend budget?" issue |

---

## 8. Supabase schema for cross-tool tracking

```sql
CREATE SCHEMA IF NOT EXISTS trio;

-- One row per tool run. Lets us correlate cost + status across the three runtimes.
CREATE TABLE trio.tool_runs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool            text NOT NULL CHECK (tool IN ('openclaw','hermes','paperclip')),
  external_id     text NOT NULL,                   -- Paperclip run id / Hermes session id / OpenClaw turn id
  domain          text NOT NULL CHECK (domain IN ('event','contest','sponsor','growth','admin','other')),
  domain_ref      uuid,                             -- FK into event.events / vote.contests / sponsor.applications / growth.outreach_campaigns
  status          text NOT NULL DEFAULT 'running' CHECK (status IN ('running','completed','failed','cancelled')),
  started_at      timestamptz NOT NULL DEFAULT now(),
  ended_at        timestamptz,
  duration_ms     int,
  cost_usd_cents  int NOT NULL DEFAULT 0,
  input_tokens    int,
  output_tokens   int,
  error_message   text,
  metadata        jsonb NOT NULL DEFAULT '{}'
);
CREATE INDEX ON trio.tool_runs (tool, status, started_at);
CREATE INDEX ON trio.tool_runs (domain, domain_ref);

-- One row per cross-tool handoff. "Paperclip woke Hermes which called OpenClaw."
CREATE TABLE trio.handoffs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_tool       text NOT NULL CHECK (from_tool IN ('openclaw','hermes','paperclip','supabase')),
  to_tool         text NOT NULL CHECK (to_tool IN ('openclaw','hermes','paperclip','supabase')),
  from_run_id     uuid REFERENCES trio.tool_runs(id),
  to_run_id       uuid REFERENCES trio.tool_runs(id),
  payload         jsonb NOT NULL,
  result          jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON trio.handoffs (from_tool, to_tool, created_at);

-- Approval requests crossing tool boundaries (Paperclip is canonical, this is a mirror for fast queries).
CREATE TABLE trio.approval_requests (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paperclip_approval_id text UNIQUE,
  domain          text NOT NULL,
  domain_ref      uuid,
  requested_by_tool text NOT NULL,
  requested_by_run_id uuid REFERENCES trio.tool_runs(id),
  action_type     text NOT NULL,           -- 'send_outreach_batch','sponsor_go_live','shadow_block','budget_extend'
  payload         jsonb NOT NULL,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','expired')),
  approved_by     uuid REFERENCES auth.users(id),
  approved_at     timestamptz,
  expires_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON trio.approval_requests (status, expires_at) WHERE status = 'pending';

-- Per-tool budget snapshot — fastest "what's left for this campaign?" query
CREATE MATERIALIZED VIEW trio.budgets_today AS
SELECT
  date_trunc('day', started_at) AS day,
  tool,
  domain,
  domain_ref,
  COUNT(*) AS run_count,
  SUM(cost_usd_cents) AS spent_cents,
  SUM(input_tokens) AS input_tokens,
  SUM(output_tokens) AS output_tokens
FROM trio.tool_runs
WHERE status IN ('running','completed')
GROUP BY 1,2,3,4;
CREATE UNIQUE INDEX ON trio.budgets_today (day, tool, domain, domain_ref);
```

**RLS one-liners:**
- `tool_runs` / `handoffs` / `approval_requests` — service-role only (PII potential).
- `budgets_today` — same; admins read via `/admin/trio` page.

---

## 9. MVP build plan (5 weeks, ~1 dev)

### Week 1 — provision + connect

- [ ] **W1.1.** Provision two VPS (Hetzner CX22 for OpenClaw, $5 Linode/Lightsail for Hermes).
- [ ] **W1.2.** Install Hermes via `curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash`. Pair to admin Telegram. → **Verify:** `hermes doctor` clean.
- [ ] **W1.3.** Install OpenClaw via `curl -fsSL https://openclaw.ai/install.sh | bash`. Pair to admin Signal. → **Verify:** `openclaw status` clean.
- [ ] **W1.4.** Install Paperclip on Hermes VPS as sidecar. Create company "mdeai-contests". → **Verify:** `/api/companies/mdeai-contests` returns 200; first agent registered.
- [ ] **W1.5.** Create `trio.*` migration in Supabase. → **Verify:** advisors clean.

### Week 2 — wire to Supabase

- [ ] **W2.1.** Issue service-role JWT scoped to `trio.*` + `growth.*` for OpenClaw.
- [ ] **W2.2.** Issue service-role JWT scoped to `vote.*` + `growth.*` + `sponsor.*` (read) for Hermes.
- [ ] **W2.3.** Configure Hermes MCP server pointing at Supabase REST. → **Verify:** `hermes` chat: "list 10 most recent contacts" returns rows.
- [ ] **W2.4.** Configure OpenClaw `supabase` skill (community-built, in ClawHub). → **Verify:** `openclaw agent --message "send me top 5 contacts"` returns rows via DM.

### Week 3 — Paperclip ↔ OpenClaw bridge

- [ ] **W3.1.** Author OpenClaw skill `paperclip-issue-trigger` that opens a Paperclip issue from any OpenClaw event.
- [ ] **W3.2.** Author Paperclip plugin `openclaw-action-trigger` that calls OpenClaw HTTP API on issue status changes.
- [ ] **W3.3.** End-to-end test: a Postgres `NOTIFY` on `vote.fraud_signals` → opens Paperclip issue → Paperclip approval → triggers OpenClaw shadow-block skill. → **Verify:** `trio.handoffs` shows 3 rows for the round trip.

### Week 4 — Paperclip ↔ Hermes bridge

- [ ] **W4.1.** Hermes runs as a Paperclip ACP agent (same pattern as Codex/Claude Code). When `PAPERCLIP_TASK_ID` is set, Hermes wakes, checks out the issue, does the work, exits.
- [ ] **W4.2.** First Paperclip routine: "daily contest health review" — wakes Hermes nightly with last 24h `vote.entity_tally` deltas. Hermes posts a narrative comment.
- [ ] **W4.3.** End-to-end test: routine fires at midnight ART; Hermes posts within 5 min; cost logged in `trio.tool_runs`.

### Week 5 — first 5 automations live

See [§11 First 5 automations](#11-recommended-first-5-automations) below. Each gated by Paperclip approval; each writes to `trio.tool_runs`.

**MVP done when:**
- All five automations run end-to-end without engineering intervention for 7 days.
- `trio.budgets_today` shows daily cost <$15 across all three tools.
- One real fraud-spike alert triggers + admin shadow-blocks via one tap → Paperclip → OpenClaw.

---

## 10. Advanced roadmap

### Phase 2 — Growth (weeks 6–10)

- [ ] White-label per organizer: each contest organizer gets their own Paperclip company (multi-tenancy native).
- [ ] Hermes Curator runs weekly on the skill library — auto-prunes stale skills.
- [ ] Auto-A/B testing of outreach templates (Thompson sampling, 4 variants/segment) — Hermes reasons over results.
- [ ] Sub-agent fan-out: Hermes spawns 5 parallel agents during finals night to handle reasoning load.
- [ ] OpenClaw mobile node (iOS) for organizers to operate from venue.

### Phase 3 — Scale (months 3+)

- [ ] Voice mode: Hermes Talk Mode → WA voice notes via OpenClaw inbound, replied via OpenClaw TTS.
- [ ] Cross-organizer ROI benchmarks (anonymized).
- [ ] AI-driven sponsor matchmaking: Hermes embeds sponsors + contests, suggests fits; Paperclip handles approval.
- [ ] Federated budget across organizers: Paperclip multi-company budget rollup with revenue-share calculations.
- [ ] Hermes External memory provider (Honcho or Mem0) for long-term user taste modeling.
- [ ] Pluggable sandbox provider (Paperclip beta) → run scrapers in E2B sandbox instead of OpenClaw VPS.

---

## 11. Recommended first 5 automations

Build in this order. Each has a single clear ROI trigger and a Paperclip approval gate to keep the human in the loop.

### A1 — Daily contest health review (Paperclip routine → Hermes → OpenClaw)

```
Schedule: Paperclip routine "contest-health-review" runs every day at 09:00 ART.

Steps:
  1. Paperclip wakes Hermes with PAPERCLIP_TASK_ID set.
  2. Hermes calls Supabase MCP: "show me yesterday's votes per contest."
  3. Hermes computes deltas vs the prior day; flags anomalies.
  4. If all green → Hermes auto-closes the issue with summary comment.
  5. If anomaly → Hermes leaves issue open with priority=high; OpenClaw pings admin via WA.
```

**Why first:** lowest risk (read-only), proves the Paperclip→Hermes→Supabase plumbing works.

### A2 — Sponsor application approval (Paperclip approval → Hermes draft → OpenClaw send)

```
Trigger: row inserted into sponsor.applications (status='submitted').

Steps:
  1. Postgres NOTIFY → opens Paperclip issue PAP-XXX with approval gate.
  2. Hermes runs moderation reasoning, posts as issue comment.
  3. Admin approves in Paperclip UI (one tap).
  4. Approval webhook → Hermes drafts welcome message.
  5. OpenClaw Twilio WA template send to brand contact.
  6. trio.handoffs records: sponsor → Paperclip → Hermes → OpenClaw.
```

**Why second:** revenue-positive, validates approval gates work for money-moving actions.

### A3 — Leaderboard broadcast every 4h (Paperclip cron → Hermes caption → OpenClaw send)

```
Schedule: Paperclip routine fires every 4h during contest.

Steps:
  1. Paperclip wakes Hermes with current contest_id.
  2. Hermes pulls top-5 from vote.entity_tally; writes es-CO Paisa-tone caption.
  3. Hermes calls OpenClaw MCP: openclaw.message_send(channel='wa_community', text=caption, media=screenshot).
  4. trio.tool_runs logs cost.
  5. pg_cron backstop fires the same job 5 min later if Paperclip routine missed.
```

**Why third:** highest visibility, drives K-factor; proves end-to-end automation under real traffic.

### A4 — Outreach send-loop with budget cap (Paperclip budget → Hermes draft → OpenClaw send)

```
Schedule: Paperclip routine every 30 min, 09:00–18:00 ART.

Steps:
  1. Paperclip checks campaign budget; if hit → pauses + opens "extend?" issue. Stop.
  2. Hermes drafts up to 25 messages from queued growth.outreach_messages rows.
  3. Hermes rejects any with invented URLs (regex check); flags for human review.
  4. Approved batch → OpenClaw sends via Twilio WA + SendGrid.
  5. trio.tool_runs logs per-message cost; trio.budgets_today rolls up.
  6. If bounce_rate > 5% over 7d → Paperclip auto-pauses campaign.
```

**Why fourth:** real money on the line; budget cap is the killer feature.

### A5 — Weekly sponsor ROI report (Paperclip routine → Hermes narrate → OpenClaw deliver)

```
Schedule: Paperclip routine every Monday at 10:00 ART.

Steps:
  1. Paperclip wakes Hermes for each active sponsor application.
  2. Hermes pulls last 7d from sponsor.roi_daily; writes a 3-sentence narrative.
  3. Hermes calls Gemini Pro for PDF generation (via existing edge fn).
  4. PDF lands in Supabase Storage.
  5. OpenClaw delivers PDF link via email + WA template message.
  6. Paperclip closes the routine issue with "delivered to N sponsors" summary.
```

**Why fifth:** retention-positive, sponsors love being told why their campaign worked.

---

## 12. Risks, limitations, setup requirements

| Risk | Mitigation |
|---|---|
| **Cisco-flagged OpenClaw prompt-injection risk** | Paperclip approval gate on any "send" action; OpenClaw exec runs in sandbox profile; rotate `OPENCLAW_GATEWAY_TOKEN` quarterly |
| **Paperclip stability "not there yet" (April 2026)** | Pin to v2026.428.0+; monitor releases; have manual fallback for critical ops (e.g., admin can shadow-block by SQL if Paperclip down) |
| **Three runtimes = 3 places to debug** | Centralize via `trio.tool_runs` + `trio.handoffs`; one Sentry/Grafana dashboard; daily Hermes-generated health digest |
| **Skill drift across tools** | Both Hermes and OpenClaw support agentskills.io format → write skills once, deploy to either; Paperclip company skills live separately by design |
| **Hermes self-improvement = unpredictable behavior** | Curator-approved skills only; Paperclip approval on first 10 runs of any new auto-created skill |
| **OpenClaw vs Hermes overlap (both have cron, both have channels)** | This doc's rule: OpenClaw owns *channels + exec*, Hermes owns *reasoning + memory*. Keep the line clean |
| **Cost: 2 VPS minimum** | Hetzner CX22 ($20) + Linode 4GB ($24) + Paperclip sidecar = ~$45/mo before tools. Acceptable for a contest run |
| **Paperclip's Cisco/security concerns about OpenClaw transitive risk** | Paperclip never executes OpenClaw skills directly — only triggers them via signed webhook with run-id |
| **Migration path if OpenClaw stops being maintained** | `hermes claw migrate` imports config + memory + skills + keys; ~1 day migration |
| **Three tools = three update cadences** | Schedule a monthly "trio update Sunday" — review changelogs, run `openclaw doctor`, `hermes update`, Paperclip release notes |

### Setup requirements (the honest minimum)

- 2 Linux VPS (≥ 2 vCPU, 4 GB RAM each) — Hetzner / Hostinger / Linode
- Domain + DNS + Cloudflare (for the OpenClaw gateway public endpoint)
- Supabase project (already in mdeai)
- Twilio account (WhatsApp Business API)
- SendGrid account
- Apify token
- Gemini API key
- One operator who can read JSON and Postgres queries

Skip if you don't have at least these: don't try to wire all three on day one.

---

## 13. Real-world walkthroughs (the trio in action)

### "Reina de Antioquia 2026" — full trio

**Setup.** Paperclip company "Reina de Antioquia 2026" with 4 goals: publish 30 contestants, sell 5,000 tickets, sign 3 sponsors, hit 25,000 votes. Hermes paired to admin Telegram for ops chat. OpenClaw paired to admin Signal for fraud alerts.

**Day-of finals.** 18:00 — Paperclip routine "broadcast-leaderboard" wakes Hermes. Hermes pulls top-5; writes "🌹 Top 5 con 2 horas para cerrar — vota ya". Calls OpenClaw to broadcast to 5,200-member WA Community + post to TikTok via Post Bridge.

20:42 — Postgres NOTIFY: 73 votes/min from one IP cluster. Listener opens Paperclip issue with priority=critical. OpenClaw pings admin via Signal: "Vote spike from cluster X — see PAP-481". Admin opens issue. Hermes has already pulled context and posted: "Likely bot ring (geo mismatch + UA cluster + perfect ratio). Recommend shadow-block weight=0." Admin one-taps approve. OpenClaw runs `shadow-block-cluster` skill.

21:00 — Final results. Hermes generates 3 winner social posts. OpenClaw schedules them via Post Bridge.

**Trio cost for 30-day contest:** ~$150/mo tooling (per `02-openclaw-growth.md`) + ~$15/mo Hermes inference + ~$5/mo Paperclip = **~$170/mo total** for full automation.

### "Bandeja Paisa Week" — minimalist trio

**Setup.** Paperclip company "Restaurant Voting" with one goal. No sponsors. No outreach. Just leaderboard broadcasts.

**Daily.** Noon — Paperclip routine fires. Hermes pulls top-5 from `vote.entity_tally`. Writes "🍽️ Hoy en cabeza: ..." message. OpenClaw broadcasts to 2,800-member WA foodie group. Voters reply "1/2/3"; OpenClaw inbound hook calls `vote-cast`.

**Total ops time:** zero on a normal day. Five minutes a week to review the Paperclip "weekly health" auto-issue.

### "Estéreo Picnic" — multi-company trio

**Setup.** Paperclip multi-company: parent "Estéreo Picnic 2026" with 4 child companies (Best DJ, Best Stage, Best Outfit, Crowd Favorite). Each child has its own budget cap and approval routing. Hermes spawns 4 parallel sub-agents (one per contest) during finals night for reasoning load.

**Why this works.** Paperclip's "multi-business in one install" feature is exactly designed for this. One operator monitors the parent company's dashboard; each contest has its own sponsor list, fraud workers, broadcast schedule.

---

## 14. Suggested additional features

These didn't make the first 5 but are easy adds once the trio runs cleanly.

| # | Feature | Tool combo | Effort |
|---|---|---|---|
| 6 | **Voice-driven leaderboard** — organizer says "broadcast the top 5" in Hermes Talk Mode → routes to OpenClaw send | Hermes + OpenClaw | 1 day |
| 7 | **AI sponsor matchmaker** — Hermes embeds active contests + interested sponsors, suggests fits to admin via Paperclip | Hermes + Paperclip | 2 days |
| 8 | **Auto-debrief after every contest** — Paperclip routine fires on `vote.contests.status='closed'`; Hermes generates a 5-page PDF deck for the organizer | Paperclip + Hermes + Gemini | 2 days |
| 9 | **Multi-language broadcasts** — Hermes drafts in 3 languages; admin picks via Paperclip approval; OpenClaw sends per-segment | Hermes + Paperclip + OpenClaw | 1 day |
| 10 | **Live mid-contest tuning** — Hermes detects a stagnant contest; suggests "increase WA broadcast frequency to 2h"; admin approves; Paperclip updates the routine | Hermes + Paperclip | 3 days |
| 11 | **Sponsor self-serve insights chat** — sponsor messages a dedicated Telegram bot; Hermes answers from `sponsor.roi_daily` via MCP | Hermes + OpenClaw | 2 days |
| 12 | **Per-judge briefing bot** — Hermes generates per-contestant summaries; OpenClaw delivers to each judge's private channel; Paperclip tracks who has scored | All three | 4 days |
| 13 | **Influencer reply triage** — Hermes classifies inbound replies (interested/hot/cold); Paperclip routes hot leads to admin; cold to auto-archive | Hermes + Paperclip | 2 days |
| 14 | **Weekly investor digest** — Paperclip routine pulls KPIs; Hermes writes narrative; emails investor list via SendGrid | All three | 1 day |
| 15 | **AI fraud forensics** — Hermes deep-reasons on suspicious vote clusters; produces evidence pack for admin review | Hermes | 3 days |

---

## 15. Latest updates (verified May 2026)

| Tool | Latest release | Key new things |
|---|---|---|
| **OpenClaw** | rolling | 5,700+ ClawHub skills (April 2026 count); Google Meet bundled (2026.4.25); OpenTelemetry observability now spans model + tool + memory; DeepSeek V4 bundled; sandbox via Docker |
| **Hermes** | v0.12.0 (April 30, 2026) "Curator" | Autonomous Curator (background agent grades/prunes skills); 4 new inference providers; 18th + 19th messaging platforms (QQBot + Teams); native Spotify + Google Meet; ComfyUI bundled; Camofox anti-detection browser (v0.7.0) |
| **Paperclip** | v2026.428.0 (April 28, 2026) | Pause/resume agents and issue subtrees; productivity review (auto-flags stuck loops); pluggable sandbox providers (E2B beta); structured issue-thread interactions; multi-user invite flows |
| **Migration helper** | `hermes claw migrate` | Imports OpenClaw config + memory + skills + API keys + messaging settings |
| **Hostinger 1-click** | both OpenClaw and Hermes | Hostinger ships 1-click installers for OpenClaw and Hermes via hPanel — fast for non-DevOps operators |

**Sources verified May 2026:**
- [OpenClaw docs](https://docs.openclaw.ai/)
- [Hermes Agent v0.12.0 release](https://github.com/NousResearch/hermes-agent/releases/tag/v2026.4.30)
- [Hermes migrate-from-openclaw guide](https://hermes-agent.nousresearch.com/docs/guides/migrate-from-openclaw)
- [Paperclip v2026.428.0 release](https://github.com/paperclipai/paperclip/releases/tag/v2026.428.0)
- [Paperclip control plane](https://paperclip.ing/)
- [Hostinger 1-click OpenClaw](https://www.hostinger.com/support/what-is-1-click-openclaw-and-how-to-set-it-up/)
- [Hostinger 1-click Hermes](https://www.hostinger.com/support/how-to-get-started-with-hermes-agent-at-hostinger/)
- [Hostinger 1-click Paperclip](https://www.hostinger.com/support/how-to-get-started-with-the-paperclip-at-hostinger/)
- [I switched from OpenClaw to Hermes — what nobody told me (Medium)](https://medium.com/@sathishkraju/i-switched-from-openclaw-to-hermes-agent-heres-what-nobody-told-me-5f33a746b6ca)
- [Paperclip review: AI agent teams as companies (vibecoding.app)](https://vibecoding.app/blog/paperclip-review)

---

## Tasks (executable, in dependency order)

- [ ] **Tr1.** Create `trio.*` migration in [`supabase/migrations/`](../../supabase/migrations). → **Verify:** advisors clean.
- [ ] **Tr2.** Provision Hermes VPS, install Hermes, pair to admin Telegram. → **Verify:** `hermes doctor` clean; first chat works.
- [ ] **Tr3.** Provision OpenClaw VPS (or reuse from `02-openclaw-growth.md` Tr1), pair to admin Signal. → **Verify:** `openclaw status` clean.
- [ ] **Tr4.** Install Paperclip on Hermes VPS as sidecar; create company "mdeai-contests"; register agents (Hermes + OpenClaw). → **Verify:** `/api/companies/mdeai-contests/agents` shows both.
- [ ] **Tr5.** Issue scoped service-role JWTs to Hermes (read `vote.* / growth.* / sponsor.*`) and OpenClaw (write `growth.outreach_messages` only). → **Verify:** RLS denies any other table access.
- [ ] **Tr6.** Configure Hermes Supabase MCP server. → **Verify:** "list 10 contacts" returns rows in chat.
- [ ] **Tr7.** Configure OpenClaw `supabase` skill (community-built). → **Verify:** OpenClaw can write a single `growth.outreach_messages` row.
- [ ] **Tr8.** Author Paperclip plugin `openclaw-action-trigger`. → **Verify:** issue status change posts to OpenClaw HTTP endpoint within 5s.
- [ ] **Tr9.** Author OpenClaw skill `paperclip-issue-trigger`. → **Verify:** OpenClaw event opens a Paperclip issue within 5s.
- [ ] **Tr10.** Wire Hermes as Paperclip ACP agent. → **Verify:** `PAPERCLIP_TASK_ID` env triggers Hermes wake within 30s of issue assignment.
- [ ] **Tr11.** Build automation A1 (daily health review). → **Verify:** end-to-end run logs to `trio.tool_runs` with all 3 tools represented.
- [ ] **Tr12.** Build automation A2 (sponsor approval). → **Verify:** end-to-end test sponsor app → Paperclip approval → OpenClaw welcome WA delivered.
- [ ] **Tr13.** Build automation A3 (leaderboard broadcast every 4h). → **Verify:** 7-day soak with no missed broadcasts (pg_cron backstop covers Paperclip downtime).
- [ ] **Tr14.** Build automation A4 (outreach send-loop with budget cap). → **Verify:** synthetic 200-message campaign with $5 budget pauses at $5 spent.
- [ ] **Tr15.** Build automation A5 (weekly sponsor ROI). → **Verify:** Monday 10:00 routine delivers PDF + WA link to test sponsor.

---

## See also

- [`00-overview.md`](./00-overview.md) — initiative index
- [`01-contests.md`](./01-contests.md) — voting engine the trio operates on
- [`02-openclaw-growth.md`](./02-openclaw-growth.md) — OpenClaw layer in detail (canonical OpenClaw plan)
- [`03-sponsorship-system.md`](./03-sponsorship-system.md) — sponsor flows the trio approves
- [`04-roadmap.md`](./04-roadmap.md) — combined timeline
- [`05-unified-platform.md`](./05-unified-platform.md) — events that bundle everything
- [`tasks/trio/01-trio.md`](../trio/01-trio.md) — per-tool feature scoring (related, complementary)
- [`tasks/trio/02-trio-hosted.md`](../trio/02-trio-hosted.md) — Hostinger 1-click deployment guide
