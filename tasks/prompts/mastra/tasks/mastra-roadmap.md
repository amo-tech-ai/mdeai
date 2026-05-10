# mdeAI Mastra Roadmap

Last updated: 2026-05-10  
Status: strategic execution roadmap  
Scope: complete mdeAI AI setup across core chat, real estate, events, restaurants, vector memory, OpenClaw, Hermes, Paperclip, Postiz, Supabase, and production operations

## 1. Roadmap Principles

This roadmap follows the local `roadmap-planning` workflow: gather inputs, define outcome-driven initiatives, prioritize by business value and risk, sequence by dependencies, and make the roadmap a strategic plan rather than a feature pile.

The product strategy is:

```text
Chat-first Medellín concierge
  -> rentals revenue wedge
  -> events ticketing and nightlife OS
  -> restaurants as high-frequency engagement
  -> sponsorship and marketing automation
  -> governed AI operations
```

The architecture strategy is:

```text
Mastra = AI application runtime
Supabase = source of truth, RLS, realtime, pgvector, PostGIS
OpenClaw = approved execution only
Hermes = advisory intelligence and memory
Paperclip = approvals, budgets, audit, project-scoped routines
Postiz = scheduled social publishing
LangGraph = later durable workflows only when needed
```

## 2. Inputs Reviewed

| Area | Docs reviewed | Key roadmap input |
| --- | --- | --- |
| Mastra strategy | `mastra-prd.md`, `01-mastra.md`, `02-mastra.md`, `03-real-estate-plan.md`, `05-events-mastra-plan.md` | Mastra should be phased in as typed tools, agents, workflows, memory, evals, and observability |
| Chat | `tasks/prompts/chat/CHAT-CENTRAL-PLAN.md`, `prd-chat.md`, `C01-C16` | Chat is the primary UI; rentals/events/restaurants render through one canvas with cards and map state |
| Real estate | `tasks/prompts/real-estate/prd-real-estate.md`, `001-012` | Manual rentals beta first; AI starts with draft, ranking, lead capture, and approval-gated actions |
| Events | `tasks/prompts/event_prompts/000-index.md`, `docs/events-prd.md`, `05-events-mastra-plan.md` | Events need deterministic ticketing/check-in reconciliation before Mastra touches revenue flows |
| Restaurants | `openclaw-restaurant.md`, `071-restaurant-reservations-schema.md`, `072-restaurant-booking-edge-fn.md` | Start with discovery and reservation assist; native booking after race-safe schema and function |
| Vector/RAG | `VDB-01` through `VDB-05`, `03-mdeai-vector-architecture-plan.md` | pgvector stays first; hybrid FTS + vector, memory pipeline, query cache, personalization sequence AI quality |
| OpenClaw | `openclaw-real-estate.md`, `openclaw-events.md`, `openclaw-restaurant.md`, gateway and health tasks | Execution-only, allowlisted, idempotent, security-audited |
| Hermes | `15-hermes-production-plan.md`, `06E-hermes-intelligence.md` | Advisory ranking, research, and content intelligence; no sends or direct DB mutation |
| Paperclip | `05A-05T`, `17A`, `18A`, Paperclip docs/plans | Governance layer, stable project-scoped routines, approvals, budget caps, audit |
| Postiz | `16B-16F`, campaign docs | Social scheduling layer; needs runbook, API key handling, suppression, cancel/discovery paths |

## 3. Strategic Outcomes

| Outcome | Metric | Why it matters |
| --- | --- | --- |
| O1: Chat becomes the main product surface | 80% of new sessions start or continue in chat | Users should not need to understand site navigation |
| O2: Rentals produce qualified leads | Qualified rental leads/week, lead-to-showing rate | Highest-intent revenue wedge |
| O3: Event ticketing is reliable | 0 oversell, QR rescan returns `ALREADY_USED`, dashboard reconciles to Stripe | Revenue and trust |
| O4: Restaurants increase engagement | Restaurant searches/session, booking-assist conversion | High-frequency daily use case |
| O5: AI actions are governed | 100% risky actions have approval/audit rows | Prevents unsafe autonomy |
| O6: Search quality improves | Hybrid search top result accuracy and zero-result rate | Core user experience |
| O7: WhatsApp continuity works | Opt-in WA handoffs, no duplicate sends | LATAM-native retention |
| O8: Ops are observable | Every run has trace, audit, cost, and error visibility | Production maintainability |

## 4. Roadmap Summary

| Phase | Theme | Timebox | Primary outcome | Status |
| --- | --- | --- | --- | --- |
| 0 | Safety and source-of-truth cleanup | 1-2 weeks | Known repo/schema/runtime state | Do first |
| 1 | Core Mastra foundation | 2-4 weeks | Typed AI runtime + audit + hybrid search | MVP foundation |
| 2 | Real Estate MVP | 3-6 weeks | Rentals concierge, lead capture, showing requests | First revenue wedge |
| 3 | Events MVP reconciliation and runtime | 3-6 weeks | Ticketing/check-in reliability plus event concierge | Revenue pillar |
| 4 | Restaurants MVP | 2-4 weeks | Restaurant discovery and reservation assist | Engagement wedge |
| 5 | Memory and personalization | 2-4 weeks | User memory, query cache, For You recommendations | Post-MVP quality |
| 6 | Marketing, Postiz, and OpenClaw execution | 3-5 weeks | Approval-gated social/WhatsApp execution | Growth layer |
| 7 | Hermes and Paperclip production governance | 2-4 weeks | Intelligence briefs, approvals, routines, budgets | Ops layer |
| 8 | Advanced AI OS | 6+ weeks | Durable workflows, advanced browser, sponsors, multi-city | Later |

## 5. Phase 0: Safety and Source-of-Truth Cleanup

### Hypothesis

We believe that reconciling repo, schema, and live service state before adding Mastra will reduce production regressions because several prompt docs describe systems that are not fully visible in active code.

### Initiatives

| Initiative | Deliverables | Acceptance proof |
| --- | --- | --- |
| Inventory active code and live DB | Table/function inventory for rentals, events, restaurants, chat, vector, OpenClaw/Paperclip bridges | `rg` inventory plus Supabase catalog query saved in task notes |
| Reconcile Events ticketing gap | Confirm or restore `ticket-checkout`, `ticket-payment-webhook`, `ticket-validate`, `staff-link` | Active repo has functions or documented remote deployment proof |
| Lock AI safety boundary | `ai_control_events`, `ai_recommendation_drafts`, approval metadata design | Risky action cannot proceed without approval reference |
| Verify OpenClaw safety | Health, allowlist, idempotency, security audit runbook | OpenClaw health and audit proof; no broad skill execution |
| Verify Paperclip project scoping | Routines and issues attach to project/workspace; no fallback workspaces | New issue-backed run has no fallback warning |
| Secret hygiene | `.env*` ignored, docs scanned | Secret scan clean |

### Files likely touched

- `tasks/mastra/mastra-roadmap.md`
- `tasks/mastra/mastra-prd.md`
- `tasks/prompts/INDEX.md` if new implementation tasks are added
- Optional: `tasks/mastra/status.md` or `tasks/mastra/checklists.md`

### Do not do in Phase 0

- Do not install broad OpenClaw skills.
- Do not enable autonomous heartbeats.
- Do not move payment/check-in logic into Mastra.
- Do not change production firewall or Docker config unless a verified blocker requires it.

## 6. Phase 1: Core Mastra Foundation

### Hypothesis

We believe a small Mastra runtime with typed tools, audit events, and hybrid search will let mdeAI ship safe AI features across all verticals without duplicating edge-function logic.

### Core Features

| Feature | Build | Notes |
| --- | --- | --- |
| Mastra service scaffold | `apps/mastra` preferred for long-running runtime | Verify embedded/MCP docs (`user-mastra`) before coding |
| Workflow state MVP | Tables `workflow_runs`, `workflow_steps`, `workflow_failures`, `workflow_approvals` synced to Mastra `runId` (`MASTRA-012`) | Supabase authoritative — no Temporal/LangGraph yet |
| Tenant isolation | Mandatory `organization_id` + membership-aware RLS on workflow + audit artefacts (`MASTRA-013`) | Blocks cross-org reads/tests in CI |
| AI rate limits + budgets | `ai_usage_limits`, `agent_rate_limits`, `workflow_budget_limits` with hard stop + warning modes (`MASTRA-014`) | Wire before vertical MVPs widen blast radius |
| Shared tool registry | `apps/mastra/src/tools/registry.ts`, `audit-wrapper.ts`, `risk-levels.ts`, `openclaw-policy.ts`, `index.ts` (`MASTRA-015`) | Default deny OpenClaw + Stripe classifications |
| Hybrid search | `hybrid_search_listings/events/restaurants` (`MASTRA-004`) | After safety pack **`012–015`** + `VDB-01` |
| Router Agent | Routes rental/event/restaurant/sponsor/support intents (`MASTRA-005`) | After **`004`** wired |
| Concierge Agent | Frontline web/WhatsApp response generation | Same ship slice as **`005`** MVP |
| Tool audit | `ai_tool_audit_events` / `ai_control_events` | Every tool call stamped with registry snapshot |
| Frontend Mastra SDK layer | `@mastra/client-js` wrapper (`src/lib/mastra/client.ts`, `MASTRA-019`) | No secrets in browser; bearer/BFF ingress |
| Observability | Langfuse + Sentry + PostHog + eval scorers (**`MASTRA-011`**) | **Immediately after SDK** (`019`) — before UI Dojo + before vertical Mastra MVPs (`006`/`007`) |
| Human handoffs | Escalation schema + signalling (**`MASTRA-018`**) | **Before RE/Events** agents (`006`/`007`) for lease/refund/ticket ambiguity |
| UI Dojo / frontend pattern | Mastra-ai/ui-dojo + integration proof (**`MASTRA-009`**) | After **`019` + `011`** telemetry baselines exist |
| Workflow recovery roadmap | Replay/DL/stuck SLA (**`MASTRA-017`**) | Ops dashboards phased after vertical traffic |
| Streaming UI parity | Contracts for partial/tool/approval/handoff/errors (`MASTRA-016`) | After **`018`/`009`** + real vertical telemetry |
| Basic memory | Thread/session memory (`MASTRA-010`) | Dedicated RAG MVP after tenant + embeddings (`VDB-02`) |
| Web chat smoke test | Chat answers from Supabase-backed search (`MASTRA-004→005`) | Must not ship fake-cards |

| Tool | Risk | Domain |
| --- | --- | --- |
| `route_intent` | Low | all |
| `search_entities` | Low | rentals/events/restaurants |
| `search_by_map_area` | Low | rentals/restaurants/events |
| `create_outbound_draft` | Medium | all |
| `request_paperclip_approval` | Medium | all |
| `create_audit_event` | Low | all |

### Acceptance Proof

- Web chat returns real Supabase-backed rental/event/restaurant results.
- Workflow tables stay consistent with Mastra-visible `runId`s for at least one golden path + resume simulation.
- Cross-tenant QA attempts return zero surrogate rows (`MASTRA-013` suites).
- Soft + hard quota scenarios behave per spec (`MASTRA-014` fixtures).
- Tool audit rows reference registry metadata for every Mastra-side tool (`MASTRA-015`).
- **Observability + eval baseline** measurable on router/concierge + SDK ingress **before enabling `006`/`007`** (`MASTRA-019`→`MASTRA-011`).
- **Human handoff** schema + signalling path proven for at least one forced-escalation fixture **before `006`/`007`** (`MASTRA-018`).
- Hybrid search improves both exact-neighborhood and vibe queries (after prerequisites).
- No risky outbound send occurs without draft/approval.
- `npm run test` and `npm run build` pass before merge.

## 7. Phase 2: Real Estate MVP

### Hypothesis

We believe rentals should be the first verticalized Mastra rollout because it has the clearest revenue path and the current repo already has rental UI, leads, showings, applications, search, and chat surfaces.

### Core MVP Features

| Epic | Features | Acceptance proof |
| --- | --- | --- |
| Rentals Concierge | Search listings, explain neighborhoods, compare Laureles/Poblado/Envigado/Belén/Sabaneta | Chat returns listing cards and map pins from Supabase |
| Lead Capture | Convert chat into `leads` row with consent and idempotency | Same contact/request does not duplicate lead |
| Lead Qualification | Budget, dates, pets, bedrooms, remote work, urgency | Qualified lead has structured profile |
| Showing Request | Create showing request draft or confirmed request | Host/operator sees request; no double booking |
| WhatsApp Handoff | Draft-first WhatsApp follow-up | OpenClaw/WhatsApp send only after safe rule or approval |
| Property Trust | Verification status and scam-risk explanation | Listing cards show confidence/trust notes |

### Post-MVP Real Estate Features

- Lease PDF review with cited clauses and human legal escalation.
- Landlord onboarding agent.
- Property manager bulk listing flow.
- Market snapshots by neighborhood.
- Stale lead Paperclip routine.
- Move-in concierge cross-sell to restaurants/events.

### Guardrails

- No autonomous scraping in MVP.
- No lease/legal conclusions without human handoff.
- No direct payment/refund actions.
- No broad CRM mutation by LLM.

## 8. Phase 3: Events MVP Reconciliation and Runtime

### Hypothesis

We believe Mastra can make events feel like an operating system, but only after ticket checkout, payment webhook, QR validation, staff links, and realtime dashboard state are deterministic and reconciled.

### Core MVP Features

| Epic | Features | Acceptance proof |
| --- | --- | --- |
| Ticketing Reconciliation | Active functions and DB tables for checkout, webhook, validation, staff links | Functions exist locally or documented remote proof exists |
| Event Concierge | Recommend upcoming events by vibe, location, price, date | Chat returns real event cards |
| Event Draft Assistant | Create draft events and public copy proposals | Draft requires host confirmation |
| Ticketing Support | Explain order/ticket status; route to checkout | AI does not finalize payment/order state |
| Staff Support | Explain scan errors and direct to safe next action | `ALREADY_USED` remains backend-owned |
| Live Ops Support | Watch dashboard summaries and create alerts | Alert links to real event metrics |

### Post-MVP Events Features

- Campaign draft and approval flow.
- Postiz scheduling for approved posts.
- WhatsApp event reminders with opt-in/suppression.
- Sponsor proposals and ROI summaries.
- Venue fit and layout suggestions.
- Post-event recap and retargeting.

### Guardrails

- Mastra never owns ticket inventory, Stripe webhooks, or check-in mutation.
- Refunds, comp tickets, bulk sends, sponsor claims, and public campaigns require Paperclip approval.
- Realtime payloads must stay minimal and private.

## 9. Phase 4: Restaurants MVP

### Hypothesis

We believe restaurants should be the third vertical because it creates high-frequency daily engagement and strong cross-sell from rentals and events, but Medellín reservations mostly happen by WhatsApp/phone rather than Resy/OpenTable.

### Core MVP Features

| Epic | Features | Acceptance proof |
| --- | --- | --- |
| Restaurant Discovery | Search by cuisine, neighborhood, vibe, dietary needs | Chat returns restaurant cards and map pins |
| Dinner Near Rental/Event | Cross-sell from listing/event context | Response uses current location/context |
| Reservation Draft | Create a booking request draft for WhatsApp/phone | User confirms before any external contact |
| Partner Directory | Mark promoted/partner restaurants clearly | Sponsored placement is labeled |
| Menu Intelligence | Store structured menu snippets where available | Dietary recommendations cite source/menu |

### Post-MVP Restaurant Features

- `restaurant.*` schema from tasks `071-072`.
- Race-safe `restaurant-booking` edge function.
- Owner dashboard for reservations.
- WhatsApp or voice reservation assist with approval.
- Rappi delivery integration only in staging with real-money disabled first.

### Guardrails

- No real-money Rappi orders in MVP.
- No unapproved restaurant calls or DMs.
- No fake availability claims.
- No scraping behind credentials by default.

## 10. Phase 5: Memory, Personalization, and Vector Quality

### Hypothesis

We believe persistent, privacy-safe memory will increase conversion because users should not repeat preferences across chat, WhatsApp, rentals, events, and restaurants.

### Initiatives

| Initiative | Source | Acceptance proof |
| --- | --- | --- |
| User episodic memory | VDB-02 | `user_episodes` stores safe events with RLS |
| User preference memory | VDB-02 | `user_preferences_memory` recalls preferences |
| Semantic query cache | VDB-03 | Repeated similar queries avoid duplicated expensive work |
| Personalization RPC | VDB-04 | "For You" returns listings/events/restaurants matching taste vector |
| Embedding model upgrade | VDB-05 | Model slug verified; backfill and quality eval plan |
| Memory expiry | Vector docs | Stale/PII-heavy memory expires or is deleted |

### Guardrails

- Store summaries/facts, not raw sensitive transcripts unless required.
- Keep RLS on user memory.
- Do not export PII to traces.
- Use pgvector first; no Milvus until measured scale limits.

## 11. Phase 6: Marketing, Postiz, and OpenClaw Execution

### Hypothesis

We believe approved campaign automation can grow supply and demand without account bans if Postiz handles scheduled social and OpenClaw handles only approved, idempotent execution jobs.

### Initiatives

| Initiative | Features | Acceptance proof |
| --- | --- | --- |
| Campaign schema | `marketing.social_posts`, `marketing.postiz_publications`, suppressions | Draft rows created without posting |
| Approval cards | Paperclip approval for campaign batch | Rejection prevents execution |
| Postiz scheduling | Schedule approved social posts | Postiz ID stored; cancel path works |
| OpenClaw WhatsApp jobs | Approved reminders/follow-ups | Idempotency prevents duplicate sends |
| Integration discovery | Scheduled check for connected platforms | Missing integration creates setup task |
| Metrics ingest | Pull Postiz performance | Supabase rows updated |

### Guardrails

- Postiz does not send WhatsApp.
- OpenClaw does not decide content.
- TikTok/Instagram/LinkedIn automation must respect platform rules and human review.
- Suppression list checked before every outbound send.

## 12. Phase 7: Hermes and Paperclip Production Governance

### Hypothesis

We believe Hermes and Paperclip add leverage only after core workflows exist, because Hermes should create evidence-backed intelligence and Paperclip should govern real work, not generate vague activity.

### Hermes Initiatives

| Initiative | Use | Acceptance proof |
| --- | --- | --- |
| Ranking and score breakdown | Rentals/events/restaurants recommendations | Eval dataset meets target or downgrade to deterministic |
| Sponsor research | Briefs with citations | No uncited sponsor claims |
| Content briefs | Daily content ideas from real Supabase data | Drafts cite event/listing/restaurant IDs |
| Market snapshots | Neighborhood/event/restaurant trends | Aggregates anonymized |
| CRM enrichment | Contact summary and next action | Writes drafts, not direct stage mutations |

### Paperclip Initiatives

| Initiative | Use | Acceptance proof |
| --- | --- | --- |
| Stable agent roster | CEO, CTO, QA, Release, CMO, Ops | Agents exist with stable IDs |
| Project-scoped routines | Stale leads, content machine, health monitors | Runs attach to project/workspace |
| Budget caps | Prevent spend runaway | Budget status visible and enforced |
| Approval lifecycle | Campaign/refund/outbound gates | Every risky action has approval ID |
| Audit ordering | Clear source of truth before custom tables | No dependency on non-existent audit tables |

### Guardrails

- Hermes proposes; Paperclip approves; OpenClaw/Postiz executes.
- No Paperclip timer routine without a concrete project, issue, agent, and proof artifact.
- No CEO delegation to stale temporary agent IDs.

## 13. Phase 8: Advanced AI OS

### Advanced Features

| Feature | When to build | Dependency |
| --- | --- | --- |
| LangGraph durable workflows | Multi-day rental/event/sponsor workflows need checkpoint/replay | Core Mastra tools and audit stable |
| Browserbase isolated browser jobs | Browser automation creates repeatable value | OpenClaw safety and approval gates |
| Sponsor discovery engine | Sponsor revenue pipeline is active | Campaign schema and Paperclip approvals |
| Dynamic event pricing suggestions | Ticket sales data volume exists | Event ticketing stable |
| Restaurant voice reservation calls | User demand proven | Approval, call cost caps, Spanish prompts |
| Native restaurant booking | Restaurant partners onboarded | `restaurant.*` schema and edge function |
| Multi-city expansion | Medellín playbook is profitable | City abstraction and data sourcing |
| Milvus/pgvectorscale | pgvector measured bottleneck | Vector eval and ops budget |
| Temporal | Workflow criticality outgrows LangGraph/Trigger.dev | Production workflow metrics |

### Avoid Until Advanced

- Autonomous social/bulk WhatsApp campaigns.
- Broad ClawHub skill imports.
- AI-owned payments, refunds, ticket inventory, or check-in overrides.
- Unreviewed browser sessions with credentials.
- Huge multi-agent org charts before stable workflows.

## 14. Now / Next / Later

### Now

1. Phase 0 inventory and reconciliation.
2. Core Mastra scaffold and typed tools.
3. Hybrid search across rentals, events, restaurants.
4. Real Estate MVP agents and lead capture.
5. Audit/approval primitives.

### Next

1. Events ticketing reconciliation and event concierge.
2. Restaurant discovery and reservation draft flow.
3. User memory and personalization.
4. WhatsApp continuity with opt-in and suppression.
5. Postiz draft/schedule workflow after approvals.

### Later

1. LangGraph durable workflows.
2. Hermes research and ranking agents at scale.
3. Native restaurant booking and voice calls.
4. Sponsor discovery and campaign automation.
5. Multi-city and advanced prediction.

## 15. Cross-Domain Agent Roadmap

| Phase | Agents |
| --- | --- |
| 1 | Router Agent, Concierge Agent, Human Handoff Agent |
| 2 | Rentals Search Agent, Lead Qualification Agent, Showing Scheduler Agent |
| 3 | Event Concierge Agent, Event Creation Agent, Ticketing Support Agent, Check-In Support Agent |
| 4 | Restaurant Discovery Agent, Reservation Assist Agent, Menu Intelligence Agent |
| 5 | Memory Curator Agent, Personalization Agent |
| 6 | Campaign Agent, WhatsApp Execution Agent, Postiz Scheduling Agent |
| 7 | Hermes Research Agent, Sponsor Agent, Ops Agent, Paperclip CEO/QA/Release roster |

## 16. Dependencies and Blocking Risks

| Dependency | Blocks | Current risk |
| --- | --- | --- |
| Active event ticket edge functions | Events revenue workflows | High until reconciled |
| `restaurant.*` schema | Native restaurant booking | Medium; tasks exist but open |
| Mastra package/version install | All code implementation | Medium; must use installed docs |
| AI audit/control tables | Risky tool actions | High if skipped |
| OpenClaw health/security gate | WhatsApp/browser execution | High if skipped |
| Paperclip project-scoped runs | Governed autonomous routines | Medium; prior fallback warnings show risk |
| Hybrid search | Quality across verticals | Medium; VDB tasks exist |
| WhatsApp production approval/templates | Production WA sends | Medium/unknown |

## 17. Measurement Plan

| Metric | Phase | Target |
| --- | --- | --- |
| Search zero-result rate | 1 | Down 30% after hybrid search |
| Tool audit coverage | 1 | 100% Mastra tools audited |
| Qualified rental leads/week | 2 | Baseline then +25% |
| Lead-to-showing conversion | 2 | Baseline then +15% |
| Event checkout oversell | 3 | 0 oversell in 50-concurrent load test |
| QR rescan behavior | 3 | Always `ALREADY_USED` |
| Restaurant discovery engagement | 4 | 2+ restaurant results/session where intent exists |
| Duplicate outbound sends | 6 | 0 in idempotency tests |
| Risky action approval coverage | 6-7 | 100% |
| Trace/audit observability | all | 100% critical runs traceable |

## 18. Verification Gates

| Gate | Required proof |
| --- | --- |
| Core build gate | `npm run test`, `npm run build`, Mastra health check |
| Supabase gate | RLS enabled, advisors reviewed, catalog proof for new tables/RPCs |
| Vector gate | Query fixtures for exact, vibe, mixed EN/ES searches |
| Real estate gate | Lead capture idempotency, search cards, showing request proof |
| Events gate | Stripe test checkout, webhook idempotency, QR scan/rescan, realtime dashboard |
| Restaurants gate | Concurrent booking test for native booking or draft-only proof for MVP |
| OpenClaw gate | health, allowlist, security audit, idempotency test |
| Postiz gate | draft -> approval -> schedule -> cancel -> metrics proof |
| Paperclip gate | approval card creation and rejection stops action |
| Observability gate | Langfuse trace, Sentry release, PostHog event, Supabase audit row |

## 19. Additional Features to Add as Tasks

| Priority | Task idea | Folder |
| --- | --- | --- |
| P0 | Mastra Core Scaffold and Tool Audit Foundation | `tasks/mastra/tasks/` or `tasks/prompts/advanced/mastra/` |
| P0 | Mastra Hybrid Search Integration over VDB-01 | `tasks/prompts/vector/` |
| P0 | Mastra Real Estate MVP Agent Pack | `tasks/mastra/tasks/` |
| P0 | Events Ticketing Function Reconciliation | `tasks/prompts/event_prompts/` |
| P1 | Restaurant Discovery Agent and Reservation Draft Flow | `tasks/prompts/event_prompts/` or `tasks/prompts/restaurants/` |
| P1 | OpenClaw Execution Job Queue and Idempotency | `tasks/prompts/openclaw/` |
| P1 | Paperclip Approval Bridge for Mastra Risky Actions | `tasks/prompts/paperclip/tasks/` |
| P1 | Postiz Campaign Draft/Schedule Bridge | `tasks/prompts/postiz/` |
| P2 | User Memory Pipeline and For You Recommendations | `tasks/prompts/vector/` |
| P2 | Hermes Ranking Eval Integration with Mastra | `tasks/prompts/hermes/` |
| P3 | LangGraph Durable Workflow Pilot | `tasks/mastra/tasks/` |

## 20. Final Recommendation

Build the roadmap in this order:

```text
Safety inventory
  -> Mastra core runtime
  -> hybrid search and audit
  -> Real Estate MVP
  -> Events deterministic ticketing/runtime
  -> Restaurant discovery/reservation assist
  -> memory/personalization
  -> Postiz/OpenClaw approved execution
  -> Hermes/Paperclip production governance
  -> durable workflows and advanced AI OS
```

This gives mdeAI the fastest path to revenue and real user value while keeping the dangerous parts of AI automation behind deterministic APIs, approval gates, and audit trails.
