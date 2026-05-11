---
title: Mastra Task Index
status: Active
area: mastra
last_updated: 2026-05-10
---

# Mastra Task Index

This folder converts the Mastra PRD and roadmap into shippable implementation prompts.

Source plans:

- `/home/sk/mde/tasks/prompts/mastra/tasks/mastra-prd.md`
- `/home/sk/mde/tasks/prompts/mastra/tasks/mastra-roadmap.md`
- `/home/sk/mde/tasks/prompts/mastra/tasks/03-real-estate-plan.md`
- `/home/sk/mde/tasks/prompts/mastra/tasks/05-events-mastra-plan.md`
- Index (this file): `/home/sk/mde/tasks/prompts/mastra/tasks/000-index.md`

Architecture boundary:

```text
Mastra = orchestration runtime
Supabase = source of truth, auth, RLS, realtime, pgvector, PostGIS
OpenClaw = execution only (approved jobs)
Hermes = advisory reasoning, ranking, research, drafts (no direct execution)
Paperclip = approvals, budgets, governance, audit surfaces
Agents must NEVER: write DB directly · run unrestricted SQL · mutate Stripe · call OpenClaw directly from LLM tools
Actions must ALWAYS: pass typed tools, audited gateway, idempotency, approvals when required

Postiz = scheduled social publishing
LangGraph / Temporal / autonomous AI payments = explicitly later (see Not In MVP)
```

## Execution order — recommended shippable sequence

| Seq | Step | Task | ID | Priority | Depends on |
| --- | --- | --- | --- | --- | --- |
| 1 | 1 | Source inventory | [001](001-mastra-source-inventory.md) | P0 | None |
| 2 | 2 | Core runtime scaffold | [002](002-mastra-core-runtime-scaffold.md) | P0 | 001 |
| 3 | 3 | Runtime smoke script | [022](022-mastra-runtime-smoke-script.md) | P0 | 002 |
| 4 | 4 | Env and secret boundary | [024](024-mastra-env-secret-boundary.md) | P0 | 002, **022** |
| 5 | 5 | Replace weather demo | [023](023-mastra-replace-weather-demo.md) | P0 | 002, **022** |
| 6 | 6 | Tool audit + control events | [003](003-mastra-tool-audit-control-events.md) | P0 | 001, 002, **022**, **024** |
| 7 | 7 | Workflow state runtime (Supabase) | [012](012-mastra-workflow-state-runtime.md) | P0 | 002, 003, **022** |
| 8 | 8 | Tenant / org isolation | [013](013-mastra-tenant-isolation.md) | P0 | 002, **012**, 003, **022** |
| 9 | 9 | AI rate limits + cost controls | [014](014-mastra-ai-rate-limits.md) | P0 | 003, 013, **022** |
| 10 | 10 | Shared tool registry + wrappers | [015](015-mastra-tool-registry-system.md) | P0 | 003, **013**, **014**, **022** |
| 11 | 11 | VDB local/remote reconciliation | [021](021-mastra-vdb-local-remote-reconciliation.md) | P0 | 001, **022** |
| 12 | 12 | Hybrid search tools | [004](004-mastra-hybrid-search-tools.md) | P0 | 001–003, **012–015**, **021**, **022**, VDB-01 |
| 13 | 13 | Chat router + concierge MVP | [005](005-mastra-chat-router-concierge.md) | P0 | 002, 003, **004**, **012–015**, **022**, **023** |
| 14 | 14 | Mastra Client SDK wrapper (`@mastra/client-js`) | [019](019-mastra-client-sdk-integration.md) | P0 | **002**, **005**, **013**, **022**, **024** |
| 15 | 15 | Observability + evals + guardrails | [011](011-mastra-observability-evals-guardrails.md) | P0 | **002**, **003**, **005**, **015**, **019**, **022** |
| 16 | 16 | Paperclip approval bridge | [020](020-mastra-paperclip-approval-bridge.md) | P0 | **003**, **012**, **013**, **022** |
| 17 | 17 | UI Dojo frontend decision | [009](009-mastra-ui-dojo-chat-frontend.md) | P0 | **002**, **005**, **019**, **011**, **022** |
| 18 | 18 | Human handoff runtime | [018](018-mastra-human-handoff-runtime.md) | P0 | **003**, **005**, **012**, **013**, **015**, **011**, **020**, **022** |
| 19 | 19 | Dependency alias map | [025](025-mastra-dependency-alias-map.md) | P1 | 001 |
| 20 | 20 | Real estate MVP agents | [006](006-mastra-real-estate-mvp-agents.md) | P0 | **004**, **005**, **011**, **018**, **012**, **013**, **015**, **019**, **020**, **022**, **025**, RE-001–RE-008 |
| 21 | 21 | Events MVP runtime | [007](007-mastra-events-mvp-runtime.md) | P0 | As **006**, plus ticketing EVT backlog |
| 22 | 22 | Restaurants MVP discovery | [008](008-mastra-restaurants-mvp-discovery.md) | P1 | As **007** style + EVT-071 per prompt |
| 23 | 23 | Streaming UI state contracts | [016](016-mastra-streaming-ui-state.md) | P1 | **005**, **009**, **019**, **011**, **018**, **022** |
| 24 | 24 | Workflow recovery + DLQ | [017](017-mastra-workflow-recovery.md) | P1 | **003**, **012**, **014**, **022** |
| 25 | 25 | Memory + RAG MVP | [010](010-mastra-memory-rag-mvp.md) | P1 | 003–005, **013**, **021**, **022**, VDB-02 |
| 26 | 26 | Router Agent Studio registration | [026](026-mastra-router-agent-studio.md) | P0 | **002**, **003**, **015**, **022**, **024** |
| 27 | 27 | Concierge Agent Studio registration | [027](027-mastra-concierge-agent-studio.md) | P0 | **002**, **003**, **010**, **015**, **022**, **024**, **026** |
| 28 | 28 | Evaluation Agent Studio registration | [030](030-mastra-evaluation-agent-studio.md) | P0 | **002**, **003**, **011**, **015**, **022**, **024** |
| 29 | 29 | Rental Agent Studio registration | [028](028-mastra-rental-agent-studio.md) | P0 | **002**, **003**, **004**, **015**, **022**, **024**, **026**, **027**, **030** |
| 30 | 30 | Event Agent Studio registration | [029](029-mastra-event-agent-studio.md) | P0 | **002**, **003**, **004**, **015**, **022**, **024**, **026**, **027**, **030** |
| 31 | 31 | Editor prompt architecture | [031](031-mastra-editor-prompt-architecture.md) | P0 | **002**, **022**, **024**, **026–030** |
| 32 | 32 | mdeAI prompt block library | [032](032-mastra-editor-prompt-block-library.md) | P0 | **031** |
| 33 | 33 | Editor prompt seeding + versioning | [033](033-mastra-editor-seeding-and-versioning.md) | P0 | **031**, **032** |
| 34 | 34 | Runtime preview + request context | [034](034-mastra-editor-runtime-preview-and-context.md) | P0 | **031**, **032**, **033** |
| 35 | 35 | Prompt QA + Studio workflow | [035](035-mastra-editor-prompt-qa-studio-workflow.md) | P0 | **031–034** |

> **Important:** Canonical task IDs (`MASTRA-0xx`) live in YAML. **`019` is the Client SDK** — **`010` remains Memory+RAG**.

## Ordering rationale (production deltas)

```text
011 before verticals — traces, costs, guardrails/scorers prove agent behaviour before leases/events risk.
018 before verticals — lease/legal, refunds, ticketing uncertainty, WhatsApp escalation must resolve to operators before RE/Events agents ship.
016 after verticals shaping — tighten stream contracts once real tools + router paths exist (still gated by UI Dojo decision).
017 after reliability load — DLQ/manual resume once workflow volume justifies ops load.
010 last in this ladder — depends on tenant-safe memory infra + VDB-02 alignment.

026–030 split the Studio-visible mdeAI agent pack into small mergeable units. They are intentionally narrower than 005–008 and exist to make `http://localhost:4111/agents` prove real agents beyond Weather/Ping: router, concierge, rental, event, and evaluation.

031–035 add the Mastra Editor prompt architecture: reusable prompt blocks, Editor seeding/versioning, runtime preview with request context, and Studio QA for `http://localhost:4111/prompts`, `/agents`, and `/workflows`.
```

## Dependency map — net new edges

```text
001→002→022→024→023→003→012→013→014→015
          │
          └──►004→005→019→011→009
                       │
                       └──►018 ──► 006 / 007 / 008  (Restaurant **008** remains P1 after rentals + events)

006+ also depend on observability/handoff/registry (see YAML)

016 follows 009+018+019+011 · 017 hangs off 012+014 · 010 after search + concierge + tenant
```

## MVP definition (architecture-safe)

Same as prior pack, plus explicitly:

- **MASTRA-011** observable baselines instrument **chat + tool traces** **before `MASTRA-006`** ships high-stakes concierge paths.
- **MASTRA-018** escalation tables + signalling exist **before** rentals/events Mastra surfaces **simulate** Stripe/ticket/handoff ambiguity (draft-only AI; backend remains source of truth).

Stretch: full DLQ dashboards (`017`), personalization depth (`010`) — phased.

## Explicitly NOT in MVP (first pack reaffirmed)

| Excluded | Reason |
| --- | --- |
| LangGraph / Temporal | Supabase mirrored `workflow_*` first |
| Autonomous OpenClaw | Approved execution-only |
| AI-owned payments, authoritative tickets/check-ins | Stripe + deterministic functions |
| Unrestricted SQL from agents | Parameterized/read-only analytics later |
| Secrets in frontend bundles | BFF/JWT ingress only |

## Numbering conflicts + resolutions

| Requested slot | Repo reality | Resolution |
| --- | --- | --- |
| `010-*` Client SDK | `010-mastra-memory-rag-mvp.md` (`MASTRA-010`) | **[`019-mastra-client-sdk-integration.md`](019-mastra-client-sdk-integration.md)** |

- **Simultaneous spike risk:** `019`→`011`→`009` stacked — allow parallel staffing if infra owner ≠ frontend owner.

## Official Mastra Sources To Reuse

| Source | Use in mdeAI | Tasks |
| --- | --- | --- |
| [`mastra-ai/mastra`](https://github.com/mastra-ai/mastra) | Framework + Mastra Server deploy | Core |
| [`mastra-ai/skills`](https://github.com/mastra-ai/skills) | Agent coding conventions | All |
| [`mastra-ai/ui-dojo`](https://github.com/mastra-ai/ui-dojo) | Chat / generative UI comparisons | **009**, **016** |
| `@mastra/client-js` + MCP `reference/client-js/*` | Typed browser integration | **019** |

Use **Mastra MCP (`user-mastra`)** for API lookups before implementation.
