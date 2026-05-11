# mdeAI Mastra Mega Implementation Plan

Last updated: 2026-05-10

Status: strategy and production implementation plan.

Primary sources:

- Mastra docs: https://mastra.ai/docs
- Mastra GitHub: https://github.com/mastra-ai/mastra
- Mastra templates: https://mastra.ai/templates
- Mastra Skills: https://mastra.ai/blog/introducing-mastra-skills
- Mastra UI Dojo: https://mastra.ai/blog/aiuidojo
- LangGraph durable execution: https://docs.langchain.com/oss/python/langgraph/durable-execution
- Supabase vector columns: https://supabase.com/docs/guides/ai/vector-columns
- OpenClaw security: https://docs.openclaw.ai/security
- OpenClaw browser: https://docs.openclaw.ai/browser
- Paperclip: https://paperclip.ing
- n8n AI docs: https://docs.n8n.io/advanced-ai/langchain/overview/
- Local roadmap artifact: [mastra-roadmap.md](./mastra-roadmap.md)
- Real estate implementation plan: [03-real-estate-plan.md](./03-real-estate-plan.md)
- Events implementation plan: [05-events-mastra-plan.md](./05-events-mastra-plan.md)

## 1. Executive Summary

mdeAI should use Mastra as the TypeScript AI application backend, not as an all-purpose replacement for Supabase, Paperclip, OpenClaw, or LangGraph.

The production architecture should be:

```text
React/Vite UI + channel webhooks
  -> Mastra API layer
  -> Supabase Postgres + pgvector
  -> official WhatsApp/Meta/email APIs
  -> OpenClaw for approved execution/browser actions
  -> Paperclip for governance, approvals, budgets, audit, agent company ops
  -> LangGraph for durable multi-day workflows when MVP flows prove value
```

The safest MVP is Mastra + Supabase + official channel APIs + Paperclip approval gates. Add OpenClaw only for approved execution jobs. Add LangGraph only for durable, long-running workflows that need checkpoint/replay semantics.

Final stack score: 92/100 for mdeAI if rolled out in phases. The same stack drops to 72/100 if all pieces are enabled immediately without approval gates, observability, and channel policy controls.

### 2026-05-09 Cross-Domain Roadmap Update

This PRD now treats Mastra as the shared AI runtime for the full mdeAI operating system:

| Domain | Roadmap role | First safe Mastra use | Do not automate first |
| --- | --- | --- | --- |
| Core chat | Primary product surface | Router + Concierge agents, inline cards, memory, audit | Unreviewed tool writes |
| Vector/RAG | Search and memory foundation | Hybrid FTS + pgvector search across rentals, events, restaurants | External vector DB before pgvector limits are proven |
| Real estate | First revenue/ops wedge | Rentals search, lead capture, qualification drafts, showing requests | Autonomous scraping, lease/legal advice, payment/refund actions |
| Events | Ticketing and nightlife OS | Event concierge, event draft creation, campaign drafts, live-ops support | AI-owned ticket inventory, Stripe webhook finalization, QR check-in mutation |
| Restaurants | High-frequency concierge wedge | Restaurant discovery, dinner-near-rental/event cross-sell, reservation draft/monitor | Real-money Rappi orders, unapproved voice calls, native booking before schema |
| Postiz/social | Scheduled marketing layer | Approved social drafts and scheduled posts | Direct WhatsApp, raw external media URLs, unapproved publishing |
| OpenClaw | Execution layer | Approved WhatsApp/browser jobs with idempotency | Business brain, unrestricted skills, shell/browser actions without gates |
| Hermes | Intelligence layer | Ranking, sponsor research, content briefs, market snapshots | Direct sends, direct DB mutation, unsupervised outbound campaigns |
| Paperclip | Governance layer | Approvals, budget gates, project-scoped routines, audit | Vague timer heartbeats or customer-facing low-latency chat |

Strategic sequencing:

1. Build **Core Foundation** first: Mastra runtime, typed tools, audit events, hybrid search, channel-safe chat.
2. Ship **Real Estate MVP** next because rentals are the highest-intent revenue wedge and already have the most UI/schema surface.
3. Reconcile and ship **Events Ticketing MVP** only after active edge functions and remote catalog agree for ticket checkout, webhook, validation, staff links, and check-ins.
4. Add **Restaurants MVP** as discovery and reservation-assist first; native booking follows after `restaurant.*` schema and race-safe booking are proven.
5. Expand **Postiz/OpenClaw/Hermes/Paperclip** only after approval, idempotency, suppression lists, and observability are green.

The detailed execution roadmap lives in [mastra-roadmap.md](./mastra-roadmap.md).

### Additional Local Docs Reviewed for This Update

| Folder | High-signal docs used | Roadmap impact |
| --- | --- | --- |
| `tasks/prompts/chat` | `CHAT-CENTRAL-PLAN.md`, `prd-chat.md`, `C01-C16` | Chat remains the primary product surface and all verticals render through one canvas |
| `tasks/prompts/vector` | `03-mdeai-vector-architecture-plan.md`, `VDB-01` through `VDB-05` | Hybrid search, user memory, query cache, personalization, and embedding upgrades sequence the AI foundation |
| `tasks/prompts/real-estate` | `prd-real-estate.md`, `001-012` | Manual beta first, then safe AI control events, Hermes ranking drafts, WhatsApp sandbox, Paperclip approval gates |
| `tasks/prompts/event_prompts` | `000-index.md`, `events-prd.md`, restaurant tasks `071-072`, campaign/sponsor docs | Events and ticketing require deterministic backend reconciliation before Mastra orchestration |
| `tasks/prompts/openclaw` | `openclaw-real-estate.md`, `openclaw-events.md`, `openclaw-restaurant.md`, gateway/health/safety tasks | OpenClaw is execution-only and requires allowlists, audit, idempotency, and security review |
| `tasks/prompts/hermes` | `15-hermes-production-plan.md`, `06E-hermes-intelligence.md` | Hermes is advisory intelligence/memory/ranking, not execution |
| `tasks/prompts/postiz` | `16B-16F` | Postiz is social scheduling with deployment/runbook/suppression/integration-discovery work before scale |

## 2. Best Overall Architecture

### Recommended System Diagram

```text
Users and operators
  WhatsApp | Web Chat | Instagram | Facebook | Email | Admin UI
        |
        v
Channel ingress
  WhatsApp Cloud API | Meta Messaging APIs | Resend/SendGrid | Webhooks
        |
        v
Mastra AI application backend
  intent routing | agents | streaming | tools | MCP | RAG | evals | observability
        |
        v
Supabase source of truth
  auth | tenants | leads | rentals | events | tickets | sponsors | CRM | audit
  pgvector | hybrid search | semantic memory | embeddings
        |
        +--------------------+
        |                    |
        v                    v
LangGraph durable flows      Paperclip governance
  multi-day lifecycle        approvals | budgets | routines | agent company | audit
  checkpoint/replay
        |                    |
        +---------+----------+
                  v
Execution layer
  official APIs | OpenClaw | Browserbase/Playwright | Postiz | n8n glue
                  |
                  v
Observability
  Langfuse | OpenTelemetry | Sentry | PostHog | Supabase audit tables
```

### Role Boundaries

| Tool | Correct mdeAI role | Do not use it for |
| --- | --- | --- |
| Mastra | AI app backend, agents, tools, RAG, streaming, MCP, evals | Durable multi-week state without extra design |
| LangGraph | Durable workflow engine for long-running lifecycle flows | Simple chat, CRUD, or short MVP tasks |
| OpenClaw | Approved execution layer for channels, browser, operator actions | Business brain, unrestricted social automation |
| Paperclip | Governance, approvals, budgets, agent company, routines, audit | Primary app backend or public customer chat runtime |
| Supabase | Source of truth, auth, CRM, pgvector memory, PostGIS geography, realtime, audit | LLM reasoning engine |
| n8n | Low-code SaaS glue, scheduled integrations, simple ops workflows | Core multi-agent reasoning brain |
| Browserbase/Playwright | Isolated browser automation and testing | Permanent social-login botting |
| Langfuse/Sentry/PostHog/OTel | LLM/app/product observability | Secret storage |

### Non-negotiable agent runtime posture (architecture pack)

Planning tasks: **`tasks/prompts/mastra/000-index.md`** (canonical order) covering **MASTRA-012 workflow state**, **MASTRA-013 tenant isolation**, **MASTRA-014 rate limits**, **MASTRA-015 tool registry**, **MASTRA-016 streaming UI**, **MASTRA-017 recovery**, **MASTRA-018 human handoff**, **MASTRA-019 Mastra Client SDK wrapper** (`@mastra/client-js` per MCP `reference/client-js/*`).

| Rule | Requirement |
| --- | --- |
| Mastra | Orchestration runtime only — no authoritative commerce/ticketing ledger |
| Supabase | Source of truth — workflow rows (`workflow_*`), audits, quotas, approvals |
| OpenClaw | Execution only after approval/idempotency — agents never invoke OpenClaw clients |
| Paperclip | Approvals/governance/trace — escalation hooks |
| Hermes | Advisory ranking/research — no unsupervised outbound or privileged DB writes |
| Agents | NEVER direct DB mutation, unrestricted SQL, Stripe mutations, privileged keys in browser bundles |
| Tooling | ALWAYS typed registry entries, audited gateway wrappers, Paperclip escalation when flagged |

Temporal, LangGraph, autonomous OpenClaw, and AI owned payments/refunds/check ins remain explicitly **post MVP** gates (see Mastra roadmap Not In MVP table).

## 3. Core Stack Recommendation

### MVP Stack

| Layer | Choice | Why |
| --- | --- | --- |
| App AI backend | Mastra | TypeScript-first; fits Vite/React/Supabase |
| Database | Supabase Postgres | Existing mdeAI source of truth |
| Vector memory | Supabase pgvector | Same DB, RLS, simpler operations |
| Geo search | Supabase PostGIS | Map pins, neighborhoods, nearby restaurants/events/rentals |
| Messaging | Official WhatsApp Cloud API + email API | Compliance and reliability |
| Governance | Paperclip | Human approvals, audit, budgets |
| Execution | OpenClaw only behind approval gates | Useful but risky if unrestricted |
| Observability | Sentry + PostHog + Langfuse + OTel | App, product, and LLM visibility |
| Jobs | Trigger.dev or Supabase cron first | Lower operational burden than Temporal |

### Production Stack

Add LangGraph for:

- rental lead lifecycle
- abandoned lead recovery
- sponsor outreach pipeline
- event ticket buyer reminders
- restaurant/venue outreach
- QR check-in escalation flows
- human approvals that may resume days later

### Advanced Enterprise Stack

Add later:

- Milvus only if pgvector performance/scale becomes a real bottleneck
- Temporal only if LangGraph/Trigger.dev cannot meet reliability requirements
- Browserbase for isolated paid browser sessions
- Paperclip multi-agent org expansion after stable roster and project-scoped runs

## 4. Top Mastra Repos and Examples

| Rank | Repo | Purpose | mdeAI use | Score | Use? | Pros | Cons |
| ---: | --- | --- | --- | ---: | --- | --- | --- |
| 1 | https://github.com/mastra-ai/mastra | Core framework | Build mdeAI AI backend | 98 | Yes | Official, active, broad primitives | Requires disciplined architecture |
| 2 | https://github.com/mastra-ai/skills | Official coding-agent skill | Teach Codex/Claude Mastra | 96 | Yes | Official, current, built for agent context | Not app code by itself |
| 3 | https://github.com/mastra-ai/docs-chatbot-example | Docs/RAG chatbot | mdeAI concierge knowledge base | 94 | Yes | Closest MVP template | Needs Supabase adaptation |
| 4 | https://github.com/mastra-ai/ui-dojo | AI frontend patterns | Choose chat/copilot UI | 92 | Yes | Shows AI SDK, Assistant UI, CopilotKit, HITL | Demo code, not product-ready alone |
| 5 | https://github.com/mastra-ai/personal-assistant-example | Assistant + MCP | Concierge behavior reference | 90 | Study | Good mental model | Must adapt to tenants/channels |
| 6 | https://github.com/mastra-ai/mastra-mcp-workshop | MCP workshop | Internal MCP strategy | 88 | Study | Official workshop | Not production package |
| 7 | https://github.com/mastra-ai/workshops | Workshop collection | Team training | 84 | Study | Official learning material | Not direct implementation |
| 8 | https://github.com/mastra-ai/template-browsing-agent | Browser automation | Browserbase/Stagehand pattern | 82 | Later | Useful for web tasks | Browser automation needs sandboxing |
| 9 | https://github.com/mastra-ai/template-coding-agent | Coding agent | Reference only | 78 | Later/study | Sandbox pattern | Duplicates Paperclip/Codex responsibilities |
| 10 | https://github.com/mastra-ai/mastra-auth-examples | Auth examples | Auth/runtime-context reference | 76 | Study | Useful patterns | Sparse repo health |
| 11 | https://github.com/mastra-ai/skills-api | Skills API | Skill distribution reference | 75 | Study | Official ecosystem piece | Not MVP-critical |
| 12 | https://github.com/mastra-ai/mastra-agent-course | Course | Training | 74 | Study | Structured learning | Not app code |
| 13 | https://github.com/apify/actor-mastra-mcp-agent | Apify + MCP + Mastra | Approved web data collection | 72 | Later | Useful for Apify actor architecture | External/community dependency |
| 14 | https://github.com/CopilotKit/with-mastra | In-app copilot starter | Admin copilot | 72 | Pilot | Good UI integration idea | Community starter |
| 15 | https://github.com/CopilotKit/mastra-pm-canvas | PM canvas | Internal planning assistant | 70 | Inspiration | Good product ops UI idea | Not core concierge |
| 16 | https://github.com/CopilotKit/canvas-with-mastra | Canvas UI | Visual workflow experiments | 68 | Inspiration | Interesting UX | Not MVP-critical |
| 17 | https://github.com/evilmartians/mastra-browsing-agent | Browser automation | Scraping/browser example | 60 | Inspiration only | Small and focused | Tiny repo; do not depend on it |
| 18 | https://github.com/langchain-ai/langgraph | Durable workflows | Production long-running flows | 91 | Use later | Strong durability model | Python-first complexity/security patching |
| 19 | https://github.com/openclaw/openclaw | Execution agent | Channels/browser/operator actions | 78 | Gated | Powerful execution | High security blast radius |
| 20 | https://github.com/tisu19021997/langclaw | LangChain + OpenClaw | Pattern study | 58 | Avoid dependency | Useful idea | Too immature for production |

### Additional Template Patterns to Track

The local `01-mastra.md` and `02-mastra.md` notes mention template patterns that are useful even when the exact repository is not adopted directly.

| Pattern | mdeAI feature | Phase | Guardrail |
| --- | --- | --- | --- |
| Chat with database / text-to-SQL | Internal analytics and support queries over Supabase | Phase 1/2 | Read-only RPCs only; no raw SQL from users |
| PDF Q&A | Lease, venue agreement, sponsor deck review | Phase 2 | No legal advice; cite clauses and escalate |
| Meeting scheduler | Apartment showings and sponsor calls | Phase 2 | Calendar writes require confirmation |
| Google Sheets/report export | Sponsor reports and ops exports | Phase 2 | Export only approved tenant data |
| Browser agent | Public listing/venue research | Phase 2/3 | Approved domains, no credentialed scraping by default |
| Customer feedback agent | Reviews, support tickets, NPS summaries | Phase 2 | PII redaction before traces/evals |

## 5. Mastra Features Deep Dive

### Agents

Mastra agents should be the mdeAI application-facing AI workers:

- Router agent
- Concierge agent
- Rental search agent
- Event assistant
- Sponsor assistant
- Restaurant/venue assistant
- Support triage agent
- Scheduling agent
- Lease/document review agent
- Internal analyst agent

Agents receive tenant/user/channel context through runtime context and call typed tools rather than direct unrestricted APIs.

### Workflows

Use Mastra workflows for short-to-medium deterministic flows:

- classify lead
- enrich profile
- retrieve matching rentals/events
- draft WhatsApp reply
- ask for human approval
- write audit event

Use LangGraph when the workflow spans days/weeks or requires replay after failure.

### Memory

Use layered memory:

1. Supabase relational truth: users, leads, events, bookings, conversations.
2. Supabase pgvector: semantic recall over messages, listings, docs, venue notes.
3. Mastra memory: thread/session working context.
4. LangGraph checkpoints: workflow state, not general knowledge.
5. Paperclip tickets: governance/audit memory for agent work.

### Streaming

Use Mastra streaming for web chat and admin copilot. Do not use streaming for high-risk outbound messages until approval gates are in place.

### MCP

Use MCP as a controlled tool bridge:

- Supabase read/query tools for internal agents
- Paperclip issue/routine tools
- Postiz scheduling tools
- OpenClaw approved execution gateway
- Browserbase/Playwright tools for isolated browser tasks

Every MCP tool must have:

- typed input schema
- tenant boundary
- permission scope
- audit event
- allowlist/denylist
- idempotency key for side effects

### Tools

Mastra tools should wrap mdeAI backend capabilities:

- `routeIntent`
- `searchKnowledge`
- `searchRentals`
- `searchByMapArea`
- `rankListings`
- `createLeadDraft`
- `draftWhatsAppReply`
- `requestApproval`
- `scheduleShowingDraft`
- `scheduleEventReminder`
- `createStripeCheckoutLink`
- `qrCheckInSupport`
- `createSponsorOutreachDraft`
- `readOnlySqlInsight`
- `analyzeLeasePdf`
- `enqueueIngestionJob`
- `enqueuePostizPost`
- `createPaperclipIssue`
- `invokeOpenClawJob`

No tool should expose raw shell, unrestricted SQL, or unrestricted browser control.

### Evals and Tracing

Use Mastra scorers/evals for:

- answer relevance
- Spanish/English tone consistency
- unsafe-action refusal
- hallucinated listing detection
- WhatsApp policy compliance
- lead qualification accuracy
- retrieval faithfulness

Use Langfuse + OTel export for LLM traces and Sentry for runtime errors.

### Channels

Mastra should handle channel-agnostic intent and response generation. Channel-specific sending should stay behind official APIs or OpenClaw execution jobs.

### Approvals

Approvals must exist for:

- first outbound sponsor campaign
- bulk messages
- LinkedIn actions
- payments/refunds
- production deploys
- OpenClaw browser actions involving logins
- writes to canonical CRM records from untrusted input

### Browser Automation

Mastra should request browser jobs. OpenClaw/Browserbase/Playwright should execute them. Paperclip should approve risky browser tasks.

## 6. Real mdeAI Use Cases

### Rentals

```text
WhatsApp lead -> Mastra classify -> Supabase lead -> pgvector listing recall -> rank -> draft reply -> send via WhatsApp API
```

### Map and Neighborhood Search

```text
User asks for "near Provenza but quieter" -> Router Agent -> PostGIS area filter + pgvector taste recall -> map card + explanation
```

### Apartment Showing Scheduling

```text
Qualified lead -> Scheduling Agent drafts showing slots -> user confirms -> host approval if needed -> calendar/message send
```

### Restaurants

```text
User asks for dinner -> Mastra preference extraction -> Supabase restaurant search -> pgvector taste match -> booking CTA -> human handoff if needed
```

### Events and Ticketing

```text
Event page/chat -> Mastra answers questions -> Supabase event/ticket lookup -> Stripe checkout link -> reminder workflow
```

### QR Check-In Support

```text
Door staff issue -> Mastra Support Agent checks ticket state -> safe instructions -> manager approval for overrides
```

### Sponsors

```text
Sponsor target list -> Mastra drafts outreach -> Paperclip approval -> email/LinkedIn human-approved send -> CRM status update
```

### Lease and Document Review

```text
User uploads lease/venue/sponsor PDF -> Document Agent extracts clauses -> cites relevant text -> flags risks -> escalates to human
```

### CRM

```text
Conversation/event -> extraction -> Supabase CRM event -> lead score -> next-best-action draft
```

### WhatsApp Follow-Up

```text
No reply after 24h -> LangGraph checkpoint resumes -> Mastra drafts contextual follow-up -> policy check -> send or approval
```

### Trip Planning

```text
Dates/preferences -> itinerary agent -> restaurants/events/rentals retrieval -> curated plan -> save to profile
```

### Venue Operations

```text
Venue manager asks for weekly report -> Mastra queries Supabase -> generates occupancy/ticket/ROI summary -> Paperclip audit
```

## 7. AI Agent Plan

| Agent | Role | Tools | Memory | Approval required |
| --- | --- | --- | --- | --- |
| Router Agent | Intent routing and handoff | classify, route, confidence score | recent session context | Low confidence or unsafe intent |
| Concierge Agent | Frontline WhatsApp/web chat | search, retrieve, draft, handoff | session + user profile + pgvector | Sends outside templates, refunds, sensitive requests |
| Rentals Agent | Rental search and qualification | rental search, rank, lead draft | lead history, listing embeddings | Host contact, viewing booking, contract-related advice |
| Events Agent | Event discovery and ticket support | event search, ticket lookup, reminder draft | event/ticket state | Refunds, check-in overrides |
| Sponsor Agent | Sponsor research and outreach drafts | sponsor CRM, email draft, LinkedIn draft | sponsor profile/history | Any outbound campaign |
| Restaurant Agent | Restaurant/venue recommendations | restaurant search, booking draft | taste profile, venue notes | Reservation outreach if not user-confirmed |
| CRM Agent | Lead scoring and lifecycle | score lead, update stage draft | full CRM timeline | Canonical stage changes above risk threshold |
| Moderation Agent | Safety and policy checks | classifier, policy lookup | policy logs | Escalates unsafe content |
| Fraud/Scam Agent | Detect suspicious listings/events/leads | anomaly checks, reputation data | incident history | Account action or block |
| Support Agent | Customer support triage | ticket tools, status lookup | ticket history | Compensation/refund |
| Analytics Agent | Reports and ROI | aggregate queries, report generator | metrics snapshots | External report send |
| Scheduling Agent | Showing, reservation, and sponsor call coordination | availability, draft invite, reminders | appointment history | Calendar write or external invite |
| Document Agent | Lease, venue, sponsor PDF review | PDF extraction, clause citation, risk flags | document summaries | Legal/financial interpretation |
| Check-In Agent | Event entry and QR support | ticket lookup, check-in status, escalation | ticket/check-in logs | Override, refund, comp ticket |
| Ops Agent | Internal operations | Paperclip, Postiz, n8n, OpenClaw job enqueue | ops audit | Docker/restart/deploy/firewall |

## 8. Workflow Architecture

### Short Mastra Workflow

```text
Inbound message
  -> normalize channel payload
  -> identify tenant/user
  -> classify intent
  -> retrieve context
  -> call domain tool
  -> draft answer
  -> policy check
  -> send or request approval
  -> write audit event
```

### Realtime App Workflow

```text
Supabase realtime event
  -> update admin queue
  -> notify Router/CRM Agent if automation is enabled
  -> draft next action
  -> wait for approval or safe auto-send rule
```

### Long LangGraph Workflow

```text
Create workflow thread
  -> checkpoint state
  -> send message
  -> wait for reply/event/time
  -> resume with same thread_id
  -> branch based on state
  -> approve risky side effects
  -> complete or escalate
```

LangGraph should wrap side effects with idempotency keys. Durable execution docs emphasize persistence, thread identifiers, deterministic replay, tasks for side effects, and idempotent operations.

### Retry and Dead-Letter Pattern

Every side-effect workflow needs:

- idempotency key
- retry count
- last error
- `dead_letter` status after max retries
- human escalation path
- proof artifact such as message ID, ticket ID, trace ID, or screenshot

### Multi-Agent Coordination

MVP coordination should be hub-and-spoke:

```text
Concierge/CEO router
  -> one specialist agent
  -> one verifier/checker
  -> response
```

Avoid many-to-many autonomous chatter. It wastes tokens and creates ambiguous ownership.

## 9. Memory Architecture

### Options

| Memory type | Use | MVP? | Notes |
| --- | --- | --- | --- |
| Supabase relational memory | CRM, bookings, leads, events | Yes | Source of truth |
| Supabase pgvector | Semantic recall | Yes | Start here |
| Supabase PostGIS | Location-aware recall and map search | Yes | Useful for rentals, restaurants, venues, tourism |
| Mastra thread memory | Conversation working memory | Yes | Keep scoped to user/thread |
| Observational memory | Structured facts/events learned from usage | Later | Useful once schemas stabilize |
| RAG | Docs/listings/venue knowledge | Yes | Required |
| Graph RAG | Relationships between people, venues, sponsors | Later | Useful after data volume grows |
| Milvus | Dedicated vector DB | Later | Use only if pgvector cannot meet scale |

### MVP Memory Stack

```text
Supabase:
  profiles
  leads
  conversations
  messages
  location points/areas via PostGIS
  ai_memory_facts
  ai_retrieval_chunks
  ai_tool_audit_events
  vector embeddings via pgvector

Mastra:
  per-thread working memory
  tool context
  retrieved documents
```

### Advanced Memory Stack

```text
Supabase relational truth
  + pgvector hybrid search
  + graph tables for entities/relationships
  + LangGraph checkpoints
  + Paperclip issue memory
  + Langfuse traces/evals
```

## 10. OpenClaw Architecture

OpenClaw should execute approved actions. It should not decide business policy.

### Allowed MVP Actions

- browser screenshot of public page
- extract public event/venue data
- send approved WhatsApp/social job through an allowlisted channel
- run read-only operational checks
- perform sandbox browser flows

### Denied by Default

- unrestricted shell
- installing third-party skills without review
- persistent config changes
- cron creation
- direct secrets access
- LinkedIn automation outside compliant flow
- bulk DMs without explicit approval

OpenClaw security docs warn that open allowlists make commands effectively open for a channel, and recommend denying powerful control-plane tools such as gateway, cron, session spawn, and session send for untrusted surfaces.

### Safe OpenClaw Flow

```text
Mastra creates execution request
  -> Paperclip approval if risky
  -> signed job payload
  -> OpenClaw gateway validates signature/scope
  -> execute allowlisted action
  -> return result
  -> Supabase audit event
```

## 11. Browser Automation Strategy

| Tool | Best use | MVP recommendation |
| --- | --- | --- |
| Playwright | Deterministic tests and scripted browser checks | Use now for testing |
| Browserbase | Isolated hosted browser sessions | Pilot for risky browsing |
| Stagehand | AI browser action layer | Use through browsing-agent prototype later |
| OpenClaw browser | Operator/browser execution from agent workflows | Gated only |
| Apify | Web data actors and scraping jobs | Approved batch jobs only |
| Firecrawl | Search/scrape content extraction | Approved research/data extraction |

Safest setup:

```text
Mastra requests browser job
  -> policy classifier
  -> approval if login/social/send action
  -> Browserbase or sandbox Playwright
  -> no private network access
  -> screenshot/log proof
  -> Supabase audit
```

## 12. Observability Stack

| Layer | Tool | What to capture |
| --- | --- | --- |
| LLM traces | Langfuse | prompts, completions, tools, scores, costs |
| Vendor-neutral traces | OpenTelemetry | Mastra agents, tools, workflows, DB spans |
| App errors | Sentry | API errors, frontend exceptions, workflow crashes |
| Product analytics | PostHog | funnels, retention, campaign outcomes |
| DB audit | Supabase | immutable business events |
| Governance audit | Paperclip | approvals, issues, agent runs |

Mastra supports OpenTelemetry export and Langfuse integration. Use sensitive-data filters and redact PII/secrets before export.

## 13. Security Review

| Risk | Severity | Mitigation |
| --- | --- | --- |
| OpenClaw malicious skills | Critical | No random skills, pin reviewed skills, sandbox, no root |
| Prompt injection | Critical | Treat external content as untrusted, tool schemas, approval gates |
| Secret leakage | Critical | Infisical/Supabase secrets, no env commits, log redaction |
| WhatsApp policy violations | High | Opt-in, templates, rate limits, unsubscribe, human handoff |
| LinkedIn account bans | High | Avoid botting; use official/compliant APIs or human-in-loop |
| Browser session theft | High | Isolated profiles, no saved broad credentials, Browserbase/containers |
| Cross-tenant leaks | High | Supabase RLS, tenant-scoped runtime context, tests |
| Runaway token spend | Medium | Paperclip budgets, per-agent caps, Langfuse cost traces |
| Bad CRM writes | Medium | Draft-first writes, approvals, idempotency keys |
| Duplicate sends | Medium | Idempotency keys and workflow state checks |
| Unbounded channel spend/noise | Medium | Per-user, per-tenant, per-channel rate limits |
| Unsafe SQL generated by agent | High | Read-only RPC allowlist; never expose arbitrary SQL execution |
| Misleading lease/legal summary | High | Cite source clauses, call it informational, escalate to qualified human |

## 14. Skills Strategy

### Use Immediately

- Mastra official skills: https://github.com/mastra-ai/skills
- Internal mdeAI Mastra skill with:
  - project architecture
  - approved tool list
  - Supabase schema conventions
  - channel policy rules
  - OpenClaw safety boundaries

### Build Internally

- `mdeai-mastra-concierge`
- `mdeai-whatsapp-policy`
- `mdeai-rental-lead-routing`
- `mdeai-event-ticket-support`
- `mdeai-sponsor-outreach-drafts`
- `mdeai-openclaw-safe-execution`
- `mdeai-supabase-rag`
- `mdeai-agent-evals`

### Avoid

- unreviewed OpenClaw public skills
- skills that request broad filesystem/shell access
- skills that automate LinkedIn/social login flows
- skills that store credentials in plain text
- skills that bypass Paperclip approval for risky actions

### Sandbox

- browser automation
- scraping
- coding agents
- CRM bulk mutation
- outbound messaging

## 15. Phased Rollout Plan

### Phase 1: MVP, 0-90 Days

Exact stack:

- Mastra
- Supabase Postgres + pgvector
- React/Vite web chat/admin
- WhatsApp Cloud API sandbox then production number
- Resend or SendGrid
- Paperclip approval/audit for high-risk actions
- Sentry + PostHog
- Langfuse for AI traces
- Playwright for testing

Exact repos/templates:

- https://github.com/mastra-ai/mastra
- https://github.com/mastra-ai/skills
- https://github.com/mastra-ai/docs-chatbot-example
- https://github.com/mastra-ai/ui-dojo
- https://github.com/mastra-ai/personal-assistant-example

MVP features:

1. Mastra server under `src/mastra` or `apps/mastra`.
2. Router Agent plus Concierge Agent with streaming web chat.
3. Rental/event/restaurant RAG against Supabase pgvector.
4. PostGIS-backed neighborhood/map search for listings, venues, and restaurants.
5. WhatsApp inbound webhook normalization.
6. Draft-first outbound replies.
7. Human approval for outbound sponsor/marketing messages.
8. Supabase audit tables for all AI tool calls.
9. Basic per-user, per-tenant, and per-channel rate limits.
10. Langfuse trace per conversation.
11. Sentry and PostHog instrumentation.
12. Playwright smoke test for web chat.

Acceptance proof:

- web chat asks for apartment and retrieves Supabase-backed answer
- map query returns location-aware results and card/map payload
- WhatsApp sandbox inbound creates conversation row
- outbound draft requires approval before send
- rate limit blocks excess messages in a controlled test
- Langfuse trace shows model/tool calls
- Sentry has no new runtime errors during smoke test
- Supabase audit row exists for every tool call

### Phase 2: Production Scale

Add:

- LangGraph for durable workflows
- Trigger.dev for simple TypeScript jobs
- Paperclip routine for weekly AI ops report
- stronger eval suites
- channel templates and policy checks
- OpenClaw gateway for approved execution jobs
- showing/meeting scheduling workflow
- lease/PDF review workflow
- read-only analytics/text-to-SQL workflow
- QR check-in support workflow

Production workflows:

- rental lead follow-up
- apartment showing scheduling
- event buyer reminder
- abandoned lead recovery
- sponsor outreach
- restaurant/venue outreach
- QR check-in escalation
- lease and venue document review

Acceptance proof:

- workflow resumes after process restart
- duplicate sends blocked by idempotency key
- approval rejection stops workflow
- read-only analytics tool cannot mutate data
- PDF review cites source clauses and escalates high-risk claims
- all runs have tenant/user/channel audit trail

### Phase 3: Advanced AI OS

Add:

- Paperclip permanent agent org: CEO, CTO, QA, Release, CMO, Ops
- advanced memory and entity graph
- Browserbase for isolated browser tasks
- OpenClaw skill safety review pipeline
- optional n8n workflows for SaaS integrations
- optional Milvus if pgvector limits are proven
- optional Temporal if workflow volume/criticality requires it

Avoid until then:

- full autonomous multi-agent swarms
- random OpenClaw skills
- mass social automation
- LinkedIn botting
- direct production deploys by agents

## 16. Final Recommendations

### Use Now

- Mastra as AI app backend.
- Supabase + pgvector as source of truth and memory.
- Official WhatsApp/Meta/email APIs for production channels.
- Paperclip as approval/governance layer.
- Langfuse/Sentry/PostHog/OTel for observability.
- Mastra official skills and docs-chatbot template.

### Delay

- LangGraph until first durable lifecycle workflow is needed.
- OpenClaw beyond approved/sandbox execution.
- Browserbase until browser automation creates repeatable business value.
- Milvus until pgvector fails measured performance targets.
- Temporal until operations justify it.

### Avoid

- LangClaw as production dependency.
- n8n as the core AI brain.
- OpenClaw as unrestricted workflow engine.
- social scraping/login automation.
- broad public skill imports.

### What Is Hype

- Huge multi-agent rosters before stable workflows.
- Autonomous browser control without approvals.
- Dedicated vector DB before data scale.
- AI agents that directly mutate CRM without draft/approval.

### What Is Production-Ready

- Supabase Postgres/RLS/pgvector for MVP data and memory.
- Mastra typed tools and agents for TypeScript AI APIs.
- Official messaging APIs.
- Paperclip approval/audit.
- Langfuse/Sentry/PostHog/OTel.
- LangGraph for selected durable workflows with idempotency.

## 17. Implementation Sequence

1. Install Mastra official skills in the repo context.
2. Scaffold Mastra in an isolated branch or `apps/mastra`.
3. Create Supabase AI audit and memory tables.
4. Implement `routeIntent`, `searchKnowledge`, `searchRentals`, `searchByMapArea`, `createOutboundDraft`, `requestApproval`.
5. Build Router Agent, Concierge Agent, and web chat smoke test.
6. Add WhatsApp sandbox ingress.
7. Add rate limits and idempotency keys.
8. Add Langfuse/Sentry/PostHog/OTel.
9. Add eval fixtures for unsafe sends, hallucinated listings, and retrieval faithfulness.
10. Add Paperclip approval bridge for risky actions.
11. Add read-only analytics/text-to-SQL tool after RPC allowlist exists.
12. Pilot one LangGraph workflow: abandoned lead recovery or showing scheduling.
13. Pilot OpenClaw only for one sandbox browser/read-only job.
14. Expand to sponsor/event/restaurant workflows.

## 18. Verification Checklist

| Check | Proof |
| --- | --- |
| Mastra server runs | local health endpoint and Studio/dev server |
| Agent answers from Supabase | trace shows retrieval tool call |
| pgvector works | SQL/RPC returns nearest chunks |
| PostGIS/map search works | neighborhood query returns correct map/card payload |
| WhatsApp ingress works | sandbox message creates conversation row |
| Approval gate works | risky send pauses until approved |
| Rate limits work | excess channel send is blocked and audited |
| No secrets leak | logs/traces redacted |
| OpenClaw gated | signed job + allowlist + audit row |
| LangGraph durable | workflow resumes from checkpoint |
| Read-only analytics guarded | mutation attempt is rejected |
| PDF review guarded | output cites source clauses and escalates legal claims |
| Observability works | Langfuse trace, Sentry release, PostHog event |
| Tests pass | unit + integration + Playwright smoke |

## 19. Open Questions

1. Should Mastra live inside the existing Vite repo or a separate `apps/mastra` service?
2. Should the MVP use Resend or SendGrid for email?
3. Is WhatsApp Cloud API already approved for production templates?
4. Should Paperclip approvals be surfaced in the admin UI or only in Paperclip initially?
5. Which single workflow should be first for LangGraph: abandoned lead recovery or rental showing scheduling?

## 20. Bottom Line

Build mdeAI as a simple production system first:

```text
Mastra for AI APIs
Supabase for truth and memory
official APIs for channels
Paperclip for control
OpenClaw for approved execution
LangGraph for durable workflows only when needed
```

This gives mdeAI the fastest path to useful AI concierge workflows without turning the MVP into a fragile agent laboratory.
