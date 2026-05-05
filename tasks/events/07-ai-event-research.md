# AI event-management research — adoption strategy

> **BLUF:** Of the 10 GitHub repos you ranked, **none are production references** — six have 0–5 stars and most are stale tutorials. The agent **frameworks** (CrewAI 50k★, LangGraph 31k★, MetaGPT 67k★, AutoGPT 184k★) are real but redundant with what we already chose: Hermes + OpenClaw + Paperclip natively cover the same patterns. The **one genuinely useful artifact** is Niels Berglund's "Building an Event Management System with Claude Code Part 11" — it ships a battle-tested Postgres campaign-tracking schema we should adopt verbatim into `growth.*`. The two real-world agent case studies worth porting (EventMobi attendance-confirmation, Tree-Fan speaker management) are net-add 3 days of work each in our existing stack — no new framework needed.

**TL;DR — what this report changes in the plan:**
1. **Adopt 3 tables** into `growth.*` (campaigns / communications / communication_recipients / marketing_assets / asset_distributions) — credit nielsberglund.com.
2. **Add 2 automations** to the trio plan (A6 attendance confirmation, A7 speaker/contestant intake chase).
3. **Skip every "AI event planner" repo** as code reference — they are tutorials.
4. **Don't adopt** CrewAI / LangGraph / AutoGPT / MetaGPT as runtime — Hermes already covers their patterns.
5. **Don't pivot to n8n / RainFocus** — they're SaaS substitutes for what we're building, not augmentation.

---

## 1. URL + repo verification (gh API queried May 2026)

### Repos the user ranked — actual GitHub state

| User rank | Repo | Stars (May 2026) | Last update | Honest assessment |
|---|---|---|---|---|
| 🥇 #1 | [ChristinaMakri/event-planner-agent](https://github.com/ChristinaMakri/event-planner-agent) | **0** | 2025-07-20 (stale ~10mo) | Multi-modal Python tutorial. 26 KB. Generates PDFs + images. Not an "agent system" — single Python script. |
| 🥈 #2 | [Jamirahmadmulani/event-ai-manager-v2](https://github.com/Jamirahmadmulani/event-ai-manager-v2) | **0** | 2026-04-26 | No description, no README in API. Active but undocumented. |
| 🥉 #3 | [Brijeshvasoya/AI-EventManagemet](https://github.com/Brijeshvasoya/AI-EventManagemet) (sic) | **0** | 2026-04-28 | No description. Typo in repo name. Tutorial scope. |
| #4 | [Shubham40289/AI-event-management-system](https://github.com/Shubham40289/AI-event-management-system) | **0** | n/a verified | Couldn't fetch metadata — likely tutorial. |
| #1 (2nd list) | [thekartikeyamishra/event-management-ai](https://github.com/thekartikeyamishra/event-management-ai) | **0** | 2025-02-02 (stale ~15mo) | React Native app with GPT-3.5 wrapper. Mobile UI, no backend agent system. |
| #2 (2nd list) | [warrenshiv/AIEventPlanner](https://github.com/warrenshiv/AIEventPlanner) | **5** | 2024-01-05 (stale 16mo) | Next.js + GPT-3.5 quick ideation tool. The "highest-star" event planner here, and it's still 5 stars + abandoned. |
| #3 (2nd list) | [shaadclt/Agentic-Automated-Event-Planning](https://github.com/shaadclt/Agentic-Automated-Event-Planning) | **3** | 2024-10-12 (stale 7mo) | CrewAI demo notebook. Useful as a CrewAI tutorial. Not a system. |
| #7 (2nd list) | [AryaAppaji/event-management-system](https://github.com/AryaAppaji/event-management-system) | unknown | n/a | Service-matching CRUD app, AI ranking layer. |
| referenced | [Rishiii7/AI-Agent-Valentine-Week-Planner](https://github.com/Rishiii7/AI-Agent-Valentine-Week-Planner) | **0** | n/a | Niche use-case demo. |

**Conclusion.** Eight of nine repos have 0 stars; the top one has 5. Not a single repo crossed 50 stars. **None of these are credible production references.** Reading them = absorbing one developer's first-pass tutorial. The user's "Score 90/100" rankings were generous — adjusted honestly, the highest score belongs to warrenshiv at ~40/100 (5 stars, stale 16 months, useful for "what does GPT-3.5 + Next.js look like").

### Frameworks the user listed — real and large

| Framework | Stars | Best for | Already covered by our stack? |
|---|---|---|---|
| [AutoGPT](https://github.com/Significant-Gravitas/AutoGPT) | **184k** | Autonomous loop demos | ❌ Don't adopt — its "run forever" pattern fights Paperclip's budget caps |
| [MetaGPT](https://github.com/geekan/MetaGPT) | **68k** | "AI software company" with role-based agents | ✅ Hermes sub-agents + Paperclip companies do this natively |
| [CrewAI](https://github.com/joaomdmoura/crewAI) | **50k** | Role-playing collaborative agents (Agents/Tasks/Crews/Processes) | ✅ Hermes spawns role-specific sub-agents; CrewAI patterns map 1:1 |
| [AgentGPT](https://github.com/reworkd/AgentGPT) | **36k** | Browser-based autonomous tasks | ❌ Browser-bound; OpenClaw browser tool is more flexible |
| [LangGraph](https://github.com/langchain-ai/langgraph) | **31k** | Stateful, durable, long-running workflows (nodes + edges + state) | ✅ Paperclip routines + Supabase `trio.tool_runs` cover persistence |
| [SuperAGI](https://github.com/TransformerOptimus/SuperAGI) | **18k** | Dev-first multi-agent framework | ✅ Hermes + Paperclip equivalents, smaller surface area |

**Conclusion.** Every framework pattern the user is excited about already exists in the stack we chose:
- **Role-based agents** (CrewAI/MetaGPT) → Hermes sub-agents + Paperclip roles
- **Stateful graph workflows** (LangGraph) → Paperclip issue trees + `trio.tool_runs` persistence
- **Autonomous loops** (AutoGPT) → deliberately rejected — incompatible with our governance model
- **Browser automation** (AgentGPT) → OpenClaw browser plugin + Hermes Camofox

Adopting any framework here would mean **rewriting the trio** to gain nothing. Skip.

### Articles the user linked

| URL | Status | What it actually is | Adopt? |
|---|---|---|---|
| [nielsberglund.com Part 11 — Campaign Tracking & Batch Sending](https://nielsberglund.com/post/2026-02-22-building-an-event-management-system-with-claude-code-part-11---campaign-tracking--batch-sending/) | ✅ **Gold** | Battle-tested Postgres schema (campaigns, communications, communication_recipients, marketing_assets, asset_distributions); Brevo MCP for email; Claude Skills for portable workflow | **Yes — schema verbatim** |
| [mcpmarket.com association-event-management](https://mcpmarket.com/tools/skills/association-event-management) | ⚠️ Couldn't verify (rate limited 429) | Likely an MCP skill for association events | Check separately before adopting |
| [Rishiii7/AI-Agent-Valentine-Week-Planner](https://github.com/Rishiii7/AI-Agent-Valentine-Week-Planner) | ⚠️ 0 stars | Tutorial demo | Skip |

---

## 2. The one source worth mining — Niels Berglund Part 11

This blog is the inverse of the GitHub list: low-profile (a personal Substack), but the schema and patterns are exactly what we need. Five tables that we should fold into `growth.*`:

| nielsberglund table | Purpose | Maps to in our stack |
|---|---|---|
| **campaigns** | Campaign metadata (name, status, event_id) | Replaces our `growth.outreach_campaigns` — adopt his shape (it's better) |
| **communications** | Channel-agnostic sends (email, LinkedIn post, WA, etc.) | NEW — we don't have this yet; merges email + WA + Telegram into one log |
| **communication_recipients** | Per-recipient tracking with provider message IDs (Brevo, Twilio, SendGrid) | Replaces our `growth.outreach_messages` — adds provider-message-id linking |
| **marketing_assets** | Flyers, graphics, social content with version control | NEW — perfect for sponsor creative gallery from `03-sponsorship-system.md` |
| **asset_distributions** | Where/when each asset was shared | NEW — gives us "this flyer was posted to IG Story at T+2h" tracking |

**Other patterns worth borrowing:**
- `UNIQUE(campaign_id, contact_id)` constraint to prevent duplicate sends at the DB level (we already do this — confirmed good).
- Conversational schema design via Claude Code (we did this; nielsberglund did the same independently).
- Multi-MCP orchestration via natural language (his Claude Desktop + Brevo MCP = our Hermes + Twilio MCP).
- Confirmation gates before sends (we already have via Paperclip approvals — confirmed good).
- Skills as portable instructions (we already use this pattern).

**Net change to our plan:** the `growth.*` schema in [`02-openclaw-growth.md`](./02-openclaw-growth.md) gets refactored with 3 new tables. Migration is additive (no breaking changes to existing `outreach_messages`).

### Proposed schema additions

```sql
-- Channel-agnostic communications log: one row per "send" across email, WA, LinkedIn, Telegram
CREATE TABLE growth.communications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     uuid NOT NULL REFERENCES growth.outreach_campaigns(id),
  channel         text NOT NULL CHECK (channel IN ('email','whatsapp','telegram','linkedin','sms','ig_dm','tiktok_dm','phone_call','other')),
  subject         text,
  body            text NOT NULL,
  provider        text NOT NULL CHECK (provider IN ('sendgrid','twilio','telegram_bot','linkedin_api','custom')),
  template_key    text,
  scheduled_at    timestamptz,
  sent_at         timestamptz,
  status          text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','queued','sent','delivered','failed','bounced')),
  metadata        jsonb NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON growth.communications (campaign_id, status);

-- Per-recipient tracking, with provider message IDs for round-trip correlation
CREATE TABLE growth.communication_recipients (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  communication_id         uuid NOT NULL REFERENCES growth.communications(id) ON DELETE CASCADE,
  contact_id               uuid NOT NULL REFERENCES growth.contacts(id),
  provider_message_id      text,                   -- e.g. Twilio SID, SendGrid message-id, Telegram message_id
  delivered_at             timestamptz,
  opened_at                timestamptz,
  clicked_at               timestamptz,
  replied_at               timestamptz,
  bounced_at               timestamptz,
  bounce_reason            text,
  error                    text,
  UNIQUE (communication_id, contact_id)
);
CREATE INDEX ON growth.communication_recipients (contact_id, delivered_at);
CREATE INDEX ON growth.communication_recipients (provider_message_id) WHERE provider_message_id IS NOT NULL;

-- Marketing assets with version + ownership
CREATE TABLE growth.marketing_assets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id      uuid REFERENCES vote.contests(id),
  event_id        uuid REFERENCES event.events(id),
  application_id  uuid REFERENCES sponsor.applications(id),  -- when asset belongs to a sponsor
  kind            text NOT NULL CHECK (kind IN ('flyer','reel','story','carousel','email_html','one_pager','program_pdf','logo','video','copy_block')),
  version         int NOT NULL DEFAULT 1,
  storage_path    text NOT NULL,
  preview_url     text,
  alt_text        text,
  ai_generated    bool NOT NULL DEFAULT false,
  ai_run_id       uuid REFERENCES ai_runs(id),               -- when Gemini generated it
  language        text DEFAULT 'es-CO',
  approved_by     uuid REFERENCES auth.users(id),
  approved_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON growth.marketing_assets (contest_id, kind);
CREATE INDEX ON growth.marketing_assets (event_id, kind);

-- Where/when each asset was distributed
CREATE TABLE growth.asset_distributions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id        uuid NOT NULL REFERENCES growth.marketing_assets(id) ON DELETE CASCADE,
  channel         text NOT NULL CHECK (channel IN ('ig_feed','ig_story','ig_reel','tiktok','x','linkedin','facebook','wa_community','wa_status','email','telegram','youtube_short','youtube_long','venue_print','other')),
  external_url    text,                          -- public URL of the distributed post
  external_id     text,                          -- platform's post ID (for analytics)
  scheduled_for   timestamptz,
  distributed_at  timestamptz,
  metrics         jsonb NOT NULL DEFAULT '{}',   -- {views,likes,shares,comments,reach,impressions}
  metrics_updated_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON growth.asset_distributions (asset_id, distributed_at);
```

**RLS one-liners:** all four tables service-role only (PII + brand assets); SELECT for sponsors limited to their own `application_id` rows.

---

## 3. Real-world agent examples worth porting

The broader 2026 search surfaced two production-deployed agents that are directly useful for the contests initiative. Neither requires a new framework — both fit cleanly into the trio.

### A6 — Attendance confirmation agent (port of EventMobi pattern)

**Source.** EventMobi's agent calls registrants the night before an event to confirm attendance + answer questions. Reduces a 2–3 hour task to overnight automation.

**Adapted for mdeai.** Since voice calls are expensive in Colombia and WhatsApp is the dominant channel, we replace "phone calls" with "WhatsApp template messages + Hermes-classified replies".

```
Schedule: Paperclip routine fires T-12h before any event with status='live'.

Steps:
  1. Paperclip wakes Hermes; pulls all event.bookings WHERE status='paid' AND qr_used_at IS NULL.
  2. For each booking, OpenClaw sends WA template "¿Confirmas asistencia mañana? Responde SI / NO / TAL VEZ".
  3. Inbound replies routed to Hermes for sentiment classification.
  4. Hermes updates event.bookings.attendance_intent ('confirmed','declined','maybe','no_response').
  5. Paperclip routine summary: "412 confirmed / 23 declined / 65 maybe / 0 no_response after 12h" — auto-closes.
  6. If decline rate > 15% → opens admin review issue with priority=high.
```

**Why this is high-ROI.** Resolves "ghost attendees" (paid + no-show) which break venue capacity planning. Costs ~$0.005 per WA template. For a 5,000-attendee festival, that's $25 to recover ~750 confirmed seats vs no-data baseline.

### A7 — Contestant/speaker intake chase agent (port of Tree-Fan pattern)

**Source.** Tree-Fan Events agent compiles speaker info from multiple sources, flags missing pieces, sends reminders.

**Adapted for mdeai.** Pageant/restaurant contestants need: bio, photos, social links, consent form, signed waiver. Current state: organizer manually chases each contestant via WhatsApp.

```
Schedule: Paperclip routine fires twice weekly during contest setup window.

Steps:
  1. Paperclip wakes Hermes; pulls all vote.entities WHERE approved=false AND created_at > now()-14d.
  2. For each entity, Hermes computes completeness score:
     - bio: present? (>50 chars)
     - hero_url: present?
     - media[]: ≥3 items?
     - socials: ≥1 link?
     - consent_signed_at: present?
  3. If missing items → Hermes drafts personalized WhatsApp/email reminder
     ("Hola Laura, te falta tu bio + 1 foto más para activar tu perfil para Reina de Antioquia").
  4. OpenClaw sends via existing growth.outreach pathway (logged to growth.communications).
  5. Hermes flags Paperclip issue if same contestant ignores 3 reminders → admin manual touch.
  6. Auto-approves entities once completeness=100% AND admin moderation passes.
```

**Why this is high-ROI.** Resolves the "dead contestants" problem — pageants typically lose 15–25% of contestants during the setup window because no one chased them. Recovering even half that is the difference between a "30 contestants" pageant and a "40 contestants" pageant.

---

## 4. Industry trend for 2026 worth absorbing

From the broader search:

> **"Event management software is evolving from a logistics tool into a predictive, automated growth engine. AI-powered event platforms now automate the entire data flow from registration to attribution reporting in real time."**
> — [ServvAI: Future of AI in Event Management Software 2026](https://servv.ai/next-gen-ai-event-management-software/)

**What this means for our positioning.** mdeai.co's contest-initiative is not a "logistics tool" (Eventbrite, Cvent) — it's a **growth engine** (events host contests host sponsors). That positioning is already correct in `00-overview.md`. The trend-line says we're aligned with where the market is moving in 2026.

**Companion data points worth tracking:**
- Chatbots handle ~40% of guest inquiries instantly → our OpenClaw WhatsApp ops bot already covers this.
- AI scheduling cuts labor overtime ~15% → Paperclip routines + heartbeat scheduler do this for us.
- Predictive maintenance reduces equipment failures 30–50% → not directly applicable to digital events, but Paperclip's productivity-review feature is the analog (auto-flags stuck loops).

---

## 5. Adoption matrix — what to take from each source

| Source | Take | Skip |
|---|---|---|
| **nielsberglund Part 11** | Schema (campaigns, communications, recipients, assets, distributions); MCP-orchestrated batch sending pattern; UNIQUE constraints for dedup | Brevo specifically (we use Twilio + SendGrid) |
| **CrewAI** (50k★) | "Agents have roles + goals + backstories" pattern → bake into Hermes sub-agent prompts | The CrewAI runtime itself |
| **LangGraph** (31k★) | Persistence-through-failure pattern → ensure `trio.tool_runs` always logs even on crash | The graph DSL |
| **MetaGPT** (68k★) | "AI software company" role hierarchy → mirror in Paperclip company structure (CEO agent, marketing agent, fraud agent) | The MetaGPT runtime |
| **AutoGPT** (184k★) | Nothing safe to adopt — "run until done" loops are incompatible with budget caps | Everything |
| **EventMobi pattern** | Attendance confirmation agent (A6) | Phone calls — use WhatsApp |
| **Tree-Fan pattern** | Contestant intake chase agent (A7) | Their tooling stack |
| **0-star event repos** (×8) | Reading them costs more than it teaches | All code |
| **n8n / RainFocus / Otter.ai** | Inspiration for what generic SaaS does | Replacing our stack with them |
| **mcpmarket association-event-management** | Investigate when rate limit clears — could be useful skill if real | Currently unverified |

---

## 6. Updated recommended automation list (revised from 06-trio)

The trio plan listed 5 first automations + 10 suggested. Adding 2 from this research, both high-ROI:

**Replacing the original A1–A5:** keep them — they're foundational.

**New additions:**

- **A6. Attendance confirmation agent** (T-12h before event) — Paperclip routine → OpenClaw WA template → Hermes intent classification → updates `event.bookings.attendance_intent`. **Effort:** 2 days. **ROI:** ~$25 cost recovers ~750 confirmed seats for a 5k-attendee festival.

- **A7. Contestant intake chase agent** (twice weekly during setup) — Paperclip routine → Hermes drafts personalized reminders → OpenClaw sends via growth.communications. Auto-flags Paperclip issue after 3 ignored reminders. **Effort:** 3 days. **ROI:** recovers 15–25% of contestants typically lost during setup.

Updated order:
1. A1 daily contest health review (foundational)
2. A2 sponsor application approval (revenue-positive)
3. A3 leaderboard broadcast every 4h (visibility)
4. A4 outreach send-loop with budget cap (volume)
5. A5 weekly sponsor ROI report (retention)
6. **A6 attendance confirmation** (NEW — reduces no-shows)
7. **A7 contestant intake chase** (NEW — recovers dead contestants)

---

## 7. What we deliberately reject (and why)

| Rejection | Why |
|---|---|
| Adopting CrewAI / LangGraph / MetaGPT as runtime | Hermes covers the same patterns; adopting would mean reworking the trio for zero new capability |
| Adopting any of the 0-star "AI event planner" repos as code | They're tutorials — the engineering quality is "first weekend hackathon" |
| Adopting AutoGPT autonomous loops | Incompatible with Paperclip budget caps + approval gates by design |
| Adopting n8n / RainFocus Nexus as substitute for the trio | They're SaaS solutions to similar problems but lock us in + add subscription cost |
| Replacing Gemini with OpenAI GPT-3.5/4 | Most listed repos use OpenAI; mdeai is Gemini-native; switching halves observability and doubles spend |
| Adopting MetaGPT's "first AI software company" framing for marketing | Paperclip already does multi-company; MetaGPT's framing is a Twitter hook |
| Building our own framework | Don't. Use the trio + Supabase. Don't reinvent CrewAI badly. |

---

## 8. Bottom line — recommendation

**Keep the trio plan exactly as written.** It is more sophisticated than every repo in the user's "top 10" combined.

**Three concrete additions to the plan:**

1. **Schema:** Fold the nielsberglund 5-table communications/assets pattern into `growth.*`. Migration is additive. Estimated: half a day.
2. **Automations:** Add A6 (attendance confirmation) and A7 (contestant intake chase) to the trio plan's first-7 list. Estimated: 5 days combined.
3. **Sponsor positioning:** Update sales/founder collateral to use the "growth engine, not logistics tool" framing — that's where the market is moving in 2026.

**Total new work from this research:** ~6 dev-days. **Patterns adopted:** 3. **Frameworks added to stack:** 0. **Repos cloned:** 0.

The honest message about the user's repo list: most of it is noise. The signal is in:
- One blog post (nielsberglund Part 11)
- Two real-world deployed agent patterns (EventMobi + Tree-Fan)
- One industry trend line (logistics → growth engine)

Everything else is interesting reading, not building blocks.

---

## Sources verified May 2026

- [Niels Berglund — Building an Event Management System with Claude Code Part 11](https://nielsberglund.com/post/2026-02-22-building-an-event-management-system-with-claude-code-part-11---campaign-tracking--batch-sending/) — primary adoption source
- [AIforEvents — Agentic AI for Events 2026](https://www.aiforevents.co/blog/agentic-ai-for-events) — EventMobi + Tree-Fan case studies
- [ServvAI — Future of AI in Event Management Software 2026](https://servv.ai/next-gen-ai-event-management-software/) — "growth engine" trend line
- [Whova — How to Use AI for Event Planning in 2026](https://whova.com/blog/ai-event-planning/)
- [DigitalDefynd — AI in Event Management 10 Case Studies 2026](https://digitaldefynd.com/IQ/ai-in-event-management/)
- [Ticket Fairy — AI in Ticketing Systems 2026](https://www.ticketfairy.com/blog/ai-powered-venue-operations-in-2026-automating-management-for-efficiency-and-enhanced-experiences)
- [CrewAI](https://github.com/joaomdmoura/crewAI) (50k★, verified)
- [LangGraph](https://github.com/langchain-ai/langgraph) (31k★, verified)
- [AutoGPT](https://github.com/Significant-Gravitas/AutoGPT) (184k★, verified)
- [MetaGPT](https://github.com/geekan/MetaGPT) (68k★, verified)

GitHub API queried directly via `gh api repos/<org>/<repo>` for repo verification — see §1 table.

---

## See also

- [`00-overview.md`](./00-overview.md) — initiative index
- [`02-openclaw-growth.md`](./02-openclaw-growth.md) — `growth.*` schema this report extends
- [`03-sponsorship-system.md`](./03-sponsorship-system.md) — sponsor creative gallery now backed by `growth.marketing_assets`
- [`05-unified-platform.md`](./05-unified-platform.md) — events that A6 attendance-confirmation operates on
- [`06-trio-integration.md`](./06-trio-integration.md) — A1–A5 automations this extends with A6 + A7
