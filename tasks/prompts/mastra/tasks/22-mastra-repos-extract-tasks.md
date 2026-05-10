---
title: Mastra Repos — Extract Tasks (per-repo, MVP-tight)
status: Reference
created: 2026-05-10
companion: 21-mastra-repos-templates.md
scope: One extraction task per repo/template, scoped to a 7-day MVP first
sources_verified: 2026-05-10 via WebFetch
---

# Mastra Repos — Extract Tasks (per-repo, MVP-tight)

> Companion to [21-mastra-repos-templates.md](21-mastra-repos-templates.md). That doc maps repos → patterns. **This doc** turns each repo into a discrete extract-task with priority, effort, acceptance criteria, and an explicit "defer or skip" decision. Driven by the reviewer feedback that the 19-task ladder is architecturally strong but **MVP scope is too wide**.

> **Read [23-mastra-modules-verified.md §A0 — Global Rules](23-mastra-modules-verified.md#a0-global-rules-apply-to-every-module-below) before opening any task in this doc.** Those five rules (No Vendoring Community Repos, No License = No Use, No Autonomous Writes, No New Infrastructure Week 1, Canonical Priority Order) override anything inferred from a source repo and are non-negotiable for every EXTRACT below.

---

## A. Reviewer Suggestions — Verdicts

| Reviewer suggestion | Verdict | Action |
|---|---|---|
| Too many systems early — keep MVP to Mastra + Supabase + Vercel | ✅ Correct | Push OpenClaw, Hermes, Paperclip integration to Phase 3 |
| Hermes is optional in Phase 1 | ✅ Correct | No EXTRACT task references Hermes |
| Too many specialized agents too soon (drop WhatsApp/Sponsor/Restaurants) | ✅ Correct | Phase 1 agents = Router + Concierge + Rentals + Events only |
| Browser Agent — explicit DO NOT USE early | ✅ Correct | EXTRACT-07 = "Skip" with rationale |
| Workflow complexity (DLQ, replay, recovery) too early | ✅ Correct | Defer MASTRA-017 patterns to Phase 2 |
| Missing "Build in 7 days" section | ✅ Useful | Section C below |
| Agents never write directly to DB | ✅ Correct | Already locked in MASTRA-003 |
| "Mastra Client SDK + Vercel AI SDK" recommendation | ⚠ Nuanced | Use **both** `@mastra/ai-sdk` (server) + `@mastra/client-js` (client); UI Dojo is reference only |
| Text-to-SQL "schema introspection useful" | ⚠ Half-right | The template ships introspection but **no documented safety**. mdeAI must add its own allowlist |
| Biggest hidden risk = too much orchestration before user adoption | ✅ Correct | Reflected in EXTRACT-04, EXTRACT-06, EXTRACT-07 deferrals |

**Two corrections to** [21-mastra-repos-templates.md](21-mastra-repos-templates.md) **based on verified source content:**

1. **Docs Chatbot Example** uses **Next.js + CopilotKit**, not an MCP-connected agent. RAG architecture is not documented in the README. Adjust expectations: this is a UI integration sample, not a RAG reference.
2. **AI SDK UI guide** uses **`@mastra/ai-sdk`** package (with `chatRoute()`, `workflowRoute()`, `networkRoute()` server helpers), not direct `@mastra/client-js`. The `onToolCall` + `experimental_useObject` patterns I cited are from the base Vercel AI SDK, not from that specific Mastra guide.
3. **WhatsApp guide** uses **Meta WhatsApp Business API directly** (`graph.facebook.com` + `WHATSAPP_ACCESS_TOKEN`), not Twilio. mdeAI uses **Infobip** — so adapt the pipeline shape, but replace the send transport.

---

## B. Source Verification (2026-05-10)

| Repo / Guide | Confirmed Tech | Confirmed Pattern Worth Stealing |
|---|---|---|
| `mastra-ai/mastra` | TS monorepo, 23.7k stars, packages/examples/templates/integrations | Agent / Tool / Workflow shapes; PostgreSQL adapter; eval scorers |
| `mastra-ai/ui-dojo` | Vite + pnpm + TS; demos AI SDK / Assistant UI / CopilotKit side-by-side | Generative UI for tool responses; suspend/resume HITL; agent networks |
| Text-to-SQL template | 2 tools (schema introspect + SQL exec); SQLite sample data | Schema introspection shape; **safety must be built ourselves** |
| `mastra-ai/docs-chatbot-example` | **Next.js + CopilotKit** (not MCP); RAG not in README | Folder structure only; not a RAG reference |
| `mastra-ai/template-deep-search` | TS, Exa-powered search, 3-step workflow | Self-evaluating loop; suspend for clarifying questions |
| WhatsApp guide | **Meta Graph API direct** (not Twilio); LibSQL memory; Zod `{ messages: z.array(z.string()) }` | 3-step pipeline shape; Zod segmentation contract |
| `AgentBrowser` reference | 15 tools; `vercel-labs/agent-browser` library; deterministic | Don't use; OpenClaw owns browser execution |
| AI SDK UI guide | **`@mastra/ai-sdk`** package; `chatRoute()/workflowRoute()/networkRoute()`; `DefaultChatTransport` from Vercel SDK | Server route helpers; `prepareSendMessagesRequest` for memory-aware payload trimming |
| `tlolkema/ai-mastra-agent-workshop` | TS, GitHub PR analysis workshop | Learning material — not production |
| `github.com/search?q=mastra` | Templates index | Reference only — Cometchat starters, BunsDev/mastra-starter, GitHub PR review template |

---

## C. 7-Day MVP Scope (Reviewer's Recommendation, Adopted)

Build only this in week 1. Everything else deferred to week 2+.

| Day | Deliverable | MASTRA task | Source extract task |
|---|---|---|---|
| 1 | Audit gateway tables + `withAudit()` wired to DB | MASTRA-003 | EXTRACT-01 (Mastra Core) |
| 2 | Workflow state mirror + tenant isolation in tools | MASTRA-012 + 013 | EXTRACT-01 |
| 3 | Hybrid search tools (rentals, events) | MASTRA-004 | EXTRACT-01 |
| 4 | Router + Concierge agents + intent prompt | MASTRA-005 | EXTRACT-01 (Mastra Core search → eval shape; **not** Deep Search) |
| 5 | `@mastra/client-js` + `@mastra/ai-sdk` server routes | MASTRA-019 | EXTRACT-08 (AI SDK UI guide) |
| 6 | Streaming UI in Vite app, basic loading states | MASTRA-016 | EXTRACT-02 (UI Dojo **reference patterns only — no component copy**) |
| 7 | End-to-end smoke test: chat → search → card → reply | — | — |

**Explicitly NOT in week 1:**
- Memory + RAG (MASTRA-010) — depends on VDB-02 not done
- Real estate / events vertical agents (MASTRA-006, 007) — week 2
- Restaurants (MASTRA-008) — P1 / week 3+
- Human handoff (MASTRA-018) — week 2
- Workflow recovery / DLQ (MASTRA-017) — Phase 2
- WhatsApp inbound — Phase 2
- Deep Search self-eval workflow (EXTRACT-05) — **Week 2+, async/offline only initially.** Concierge live chat in Week 1 uses a lighter Mastra Core search → eval shape, not the full Exa-style recursive loop.
- Text-to-SQL (EXTRACT-03) — **operator-only / internal-only.** No end-user natural-language → SQL path in MVP, ever. Builds for Patricia (operator dashboards), never Camila (end user).
- OpenClaw / Hermes / Paperclip — Phase 3
- **Any new infrastructure** — no Redis, Temporal, LangGraph, external vector DBs, Kubernetes, or new background-job runtimes. Stack is Mastra + Supabase + Vercel only in Week 1.

---

## D. Per-Repo Extract Tasks

Each task below follows the [task-writing convention](../../../../.claude/rules/task-writing.md). Tasks are read-only or low-risk: they extract patterns into mdeAI's own files, never vendor third-party code wholesale.

---

### EXTRACT-01 — Mastra Core: vendor canonical agent/tool/workflow shapes

```
id: EXTRACT-01
title: Vendor canonical Mastra Core shapes into mdeAI patterns
status: Not Started
priority: P0
effort: 0.5 day
owner: backend
depends_on: [MASTRA-002]
source: https://github.com/mastra-ai/mastra
maps_to: MASTRA-003, 004, 005, 011, 012, 015
```

#### 1. Purpose

Lock down the exact constructor shapes mdeAI uses for `new Agent({...})`, `createTool({...})`, `createWorkflow({...})`, `createStep({...})`, `createScorer({...})`. Every future task in the ladder reuses these shapes, so getting them right once removes ambiguity from MASTRA-003 through MASTRA-015.

#### 2. Goals

- 5 reference snippets committed to `my-mastra-app/src/mastra/_patterns/` (one per primitive)
- Each snippet uses Gemini model strings (`google/gemini-2.0-flash`), Zod input/output schemas, and stable snake-case IDs
- Pattern doc cross-references which `ai_tool_audit_events` / `workflow_runs` columns each ID maps to

#### 3. What to take (verified content)

- **Agent constructor**: `id`, `name`, `instructions`, `model`, `tools`, `memory`, `scorers` keys
- **Tool**: `createTool({ id, description, inputSchema, outputSchema, execute })`
- **Workflow**: `createWorkflow({...}).then(step).then(step).commit()`
- **Step**: `createStep({ id, inputSchema, outputSchema, execute })` with optional `suspend()`
- **Scorer**: `createScorer({...})` shape from existing `weather-scorer.ts` adapted to domain

#### 4. What NOT to take

- LibSQL / DuckDB storage in any example
- OpenAI model strings in examples
- The `weather-agent` placeholder (delete after MASTRA-005 lands)
- Any `examples/cloudflare-workers` deploy pattern

#### 5. Acceptance criteria

- [ ] `my-mastra-app/src/mastra/_patterns/agent.ts` exists with reference Agent
- [ ] `my-mastra-app/src/mastra/_patterns/tool.ts` exists with reference Tool wrapped in `withAudit()`
- [ ] `my-mastra-app/src/mastra/_patterns/workflow.ts` exists with reference Workflow including `suspend()`
- [ ] `my-mastra-app/src/mastra/_patterns/scorer.ts` adapts existing weather scorer
- [ ] `npm run build` clean inside `my-mastra-app/`
- [ ] No model string starts with `openai/` or `anthropic/`

---

### EXTRACT-02 — UI Dojo: lift streaming + generative-card patterns (reference only)

```
id: EXTRACT-02
title: Document UI Dojo streaming + generative-card patterns for Vite chat
status: Not Started
priority: P0
effort: 0.5 day
owner: frontend
depends_on: [MASTRA-019]
source: https://github.com/mastra-ai/ui-dojo
maps_to: MASTRA-009, 016
```

#### 1. Purpose

UI Dojo is the highest-quality streaming-UI reference in the ecosystem and — uniquely — uses Vite, the same bundler as mdeAI. We extract three specific patterns (loading states, generative tool-output cards, suspend-resume HITL state) and document them as a checklist in `tasks/mastra/mastra-streaming-ui-runbook.md`.

> **Reference patterns only. UI Dojo is NOT a dependency or component source.** mdeAI keeps shadcn/ui as the single component source of truth. Nothing from UI Dojo's component library, theme, routing, or page structure is imported, copied, or treated as architectural canon. We read it, document the *ideas* in our own runbook in our own words, and close the tab.

#### 2. Goals

- 3 patterns documented with snippet + screenshot reference: pending / streaming / tool-call states
- Generative card mapping table: tool name → Vite component (e.g., `search_rentals` → `<RentalCard />`)
- HITL "waiting for approval" state added to `tasks/mastra/mastra-streaming-ui-runbook.md`

#### 3. What to take (verified content)

- 3 loading states (pending → streaming → tool-calling)
- Generative-UI rendering: tool output → typed card component
- HITL pattern: suspended workflow shows "Awaiting approval — Camila to confirm"
- Agent network routing visualization (defer to Phase 2 — operator dashboard only)

#### 4. What NOT to take

- Next.js routing — N/A
- pnpm workspace setup — mdeAI uses npm in main repo
- The OpenAI model integration — replace with Gemini
- The full component library — keep shadcn/ui as mdeAI's source of truth

#### 5. Acceptance criteria

- [ ] `tasks/mastra/mastra-streaming-ui-runbook.md` exists
- [ ] Generative card mapping table has at least 3 entries (rentals, events, message draft)
- [ ] Runbook references existing mdeAI components, not new UI Dojo components
- [ ] No file under `src/` imports anything from a `ui-dojo` package or path
- [ ] No commit in this task vendors UI Dojo source files (verify via `git diff --stat`)

---

### EXTRACT-03 — Text-to-SQL: borrow schema-introspection shape, build our own safety

```
id: EXTRACT-03
title: Adapt Text-to-SQL schema introspection for mdeAI tool registry
status: Not Started
priority: P1
effort: 1 day
owner: backend
depends_on: [MASTRA-003, MASTRA-013]
source: https://mastra.ai/templates/text-to-sql
maps_to: MASTRA-013, 015, future analytics agent (Phase 2)
```

#### 1. Purpose

Text-to-SQL gives us the **shape** for an **operator-only / internal-only** analytics agent (introspect schema → generate query → return results). The README does **not** document SELECT-only enforcement, allowlists, or RLS interaction — so we borrow the shape and write our own safety layer.

> **Hard rule: there is NO end-user natural-language-to-SQL path in mdeAI MVP — ever.** This agent serves Patricia (operator dashboards) only, never Camila (end user). End-user discovery uses the typed search tools (`hybrid_search_apartments`, `hybrid_search_events`), not free-form NL→SQL.

This task is P1 because mdeAI doesn't need an operator analytics agent in Week 1; it ships in Phase 2 once the concierge stabilizes.

#### 2. Goals

- Schema-introspection helper at `my-mastra-app/src/mastra/tools/_schema-introspect.ts` that pulls column types from Supabase `information_schema`
- Allowlist enforced **before** any introspection result reaches an agent: only `apartments`, `events`, `restaurants`, `profiles` are exposed
- SELECT-only read tools — never an "execute SQL" tool

#### 3. What to take (verified content)

- 2-tool architecture (introspect + execute) — but rename "execute" to `read_typed_query` and constrain to whitelisted RPCs
- Schema introspection shape (table → columns → types)
- Sample-data preview pattern for grounding agent responses

#### 4. What NOT to take

- The "execute arbitrary SQL" tool — **never** in mdeAI
- INSERT / UPDATE / DELETE capability
- The SQLite-only assumption — mdeAI is Postgres
- Any agent that accepts a free-form query string from a user without going through a Zod schema first

#### 5. Acceptance criteria

- [ ] Schema-introspect helper exists, returns only allowlisted tables
- [ ] No tool exposes raw SQL to agents
- [ ] RLS test: introspect run by user A cannot reveal user B's `apartments` rows beyond what they can already query
- [ ] `npm run test` covers the allowlist rejection path

---

### EXTRACT-04 — Docs Chatbot: defer

```
id: EXTRACT-04
title: Defer — RAG patterns not documented; reuse Mastra Core RAG primitives instead
status: Deferred
priority: P2
effort: 0 days (decision only)
source: https://github.com/mastra-ai/docs-chatbot-example
maps_to: MASTRA-010 (when VDB-02 lands)
```

#### 1. Decision

Source verification (2026-05-10) found this repo is a **Next.js + CopilotKit** integration sample. The README does **not** document chunking, vector store choice, or RAG retrieval architecture. There is nothing to extract that isn't already in `mastra-ai/mastra`'s `examples/rag-*` folder.

#### 2. What to do instead

- For MASTRA-010, pull the RAG primitives directly from `mastra-ai/mastra/examples/rag-*` (chunking, embedding, retrieval)
- Use Supabase pgvector (already in production via VDB-01)
- Use `gemini-embedding-001` (already wired via `ai-embed` edge function — C14 ✅)

#### 3. What this means for the doc

The earlier claim in [21-mastra-repos-templates.md](21-mastra-repos-templates.md) §4 that this repo demonstrates "MCP-connected RAG" is **incorrect**. Treat that section as superseded by this entry.

---

### EXTRACT-05 — Deep Search: self-evaluating loop (Week 2+, async/offline only)

```
id: EXTRACT-05
title: Adapt Deep Search self-eval loop for async/offline workflows
status: Not Started
priority: P1
effort: 1 day
owner: backend
depends_on: [MASTRA-005, MASTRA-012]
source: https://github.com/mastra-ai/template-deep-search
maps_to: MASTRA-005, 012, 018 (async paths only)
scope: Async / offline workflows only (e.g., scheduled trip-research jobs, sponsor brand-fit reports). NOT the Concierge live chat path.
```

#### 1. Purpose

Some mdeAI workflows benefit from a recursive "search → evaluate quality → search again or return" loop — for example, scheduled trip research, sponsor brand-fit reports, and operator-side analytics. Deep Search is the cleanest open-source reference for that loop. **However, this is not the Concierge live chat path.** The Concierge in Week 1 uses a lighter single-pass search → eval shape from Mastra Core directly (EXTRACT-01), because recursive Exa-style loops add latency and cost that the live chat experience doesn't justify yet.

This task is **P1, Week 2+**, and runs async/offline only initially. It is promoted to P0 only after the Concierge MVP ships and we have data showing recursive search would meaningfully improve outcomes.

#### 2. Goals

- `workflows/concierge-search.ts` runs: classify → search → eval → (refine | return)
- Eval step uses a Mastra scorer (not a separate LLM call) for cost
- "Suspend for clarification" path implemented when confidence < 0.5 — surfaces a `human_handoffs` row

#### 3. What to take (verified content)

- 3-step workflow shape (search → evaluate → synthesize)
- Self-evaluating loop with confidence threshold (0.7 = good, 0.5–0.7 = ask user, < 0.5 = suspend)
- `suspend()` call shape for clarifying questions
- Citation/source-attribution output schema

#### 4. What NOT to take

- **Exa API client** — replace with `hybrid_search_apartments` / `hybrid_search_events` Supabase RPCs (VDB-01 ✅)
- The "research papers" domain framing — mdeAI is Medellín concierge, not academic research
- Any environment variable named `EXA_API_KEY`
- The web-page scraping step — mdeAI content lives in Supabase, never scrapes external HTML

#### 5. Acceptance criteria

- [ ] Workflow committed under an `async/` or `offline/` namespace (e.g., `workflows/research-trip.ts`), **not** invoked from the Concierge live chat route
- [ ] Suspend path triggers `human_handoffs` row insert via approved tool
- [ ] No reference to Exa or external scraping
- [ ] At least one Vitest test covers the "low confidence → suspend" branch
- [ ] PR description states explicitly: "This workflow does NOT run on the Concierge live chat path."

---

### EXTRACT-06 — WhatsApp guide: 3-step pipeline (Phase 2)

```
id: EXTRACT-06
title: Document WhatsApp 3-step pipeline shape; defer build to Phase 2
status: Deferred (pattern documented, build later)
priority: P2
effort: 0.5 day (doc only)
owner: backend
depends_on: [MASTRA-018]
source: https://mastra.ai/guides/guide/whatsapp-chat-bot
maps_to: WhatsApp inbound workflow (Phase 2)
```

#### 1. Purpose

The reviewer correctly flagged that adding WhatsApp in week 1 is overscope. **However**, the 3-step pipeline shape (receive → process → segment) is a clean reference, and Infobip integration already exists in mdeAI for OTP. We document the pattern adaptation now so when Phase 2 starts, there is no ambiguity.

#### 2. Goals

- Pattern documented in `tasks/mastra/mastra-whatsapp-runbook.md`
- Send transport mapped: Meta Graph API → Infobip
- Draft-before-send rule applied: every WhatsApp send goes through `ai_recommendation_drafts` → Paperclip approval

#### 3. What to take (verified content)

- 3-step pipeline (receive webhook → AI process → segment + send)
- Zod segmentation contract: `z.object({ messages: z.array(z.string()) })`
- Phone number → user_id lookup in `profiles` table
- Memory thread keyed by `user_id` (not phone — phone is PII)

#### 4. What NOT to take

- LibSQL memory store — replace with `@mastra/pg`
- Meta Graph API send call — replace with Infobip API call **only after approval**
- Any direct `sendMessage()` call inside the workflow step
- The guide's `WHATSAPP_ACCESS_TOKEN` env name — mdeAI uses `INFOBIP_API_KEY`

#### 5. Acceptance criteria

- [ ] Runbook exists at `tasks/mastra/mastra-whatsapp-runbook.md`
- [ ] Pattern explicitly states Infobip replaces Meta Graph
- [ ] Pattern explicitly states draft + approval gate before send
- [ ] No code committed in this task — doc only; build is Phase 2

---

### EXTRACT-07 — Browser Agent: skip explicitly

```
id: EXTRACT-07
title: Mastra AgentBrowser — explicit skip; OpenClaw owns browser execution
status: Skip
priority: —
effort: 0
source: https://mastra.ai/reference/browser/agent-browser
maps_to: nothing
```

#### 1. Decision

The reviewer correctly insisted this should be a hard NO. Source verification confirms `AgentBrowser` is a deterministic browser tool wrapping the `vercel-labs/agent-browser` library with 15 tools. Running this alongside OpenClaw (when OpenClaw lands in Phase 3) would mean two browser runtimes, two auth flows, two debugging surfaces.

#### 2. Rule

> **Do not install `@mastra/browser` in `my-mastra-app/`. Do not register any AgentBrowser tools. OpenClaw is the only browser execution layer and only via approved Paperclip jobs.**

#### 3. Where this rule lives

- This file
- [21-mastra-repos-templates.md](21-mastra-repos-templates.md) §10
- [20-mastra.md](prompts/mastra/tasks/20-mastra.md) §5 "NOT Yet / Never" table

---

### EXTRACT-08 — AI SDK UI guide: wire `@mastra/ai-sdk` server routes + `@mastra/client-js` client

```
id: EXTRACT-08
title: Wire @mastra/ai-sdk server helpers and @mastra/client-js client SDK
status: Not Started
priority: P0
effort: 1 day
owner: full-stack
depends_on: [MASTRA-002, MASTRA-005]
source: https://mastra.ai/guides/build-your-ui/ai-sdk-ui
maps_to: MASTRA-016, 019
```

#### 1. Purpose

The verified content of the AI SDK UI guide shows mdeAI needs **both** packages, used at different layers:

- **`@mastra/ai-sdk`** runs on the Mastra server side and exposes `chatRoute()`, `workflowRoute()`, `networkRoute()` helpers that serve AI SDK-compatible streams.
- **`@mastra/client-js`** runs in the Vite app (or any browser) and is used for direct API calls (e.g., listing agents, invoking tools imperatively).
- **`DefaultChatTransport`** comes from Vercel's AI SDK and points at the Mastra server route.

The reviewer's "Mastra Client SDK + Vercel AI SDK" suggestion is right in spirit but missed that `@mastra/ai-sdk` is the server-side glue.

#### 2. Goals

- `@mastra/ai-sdk` installed in `my-mastra-app/`
- Mastra server exposes `/chat` route via `chatRoute({ agent: conciergeAgent })`
- Vite frontend uses `useChat({ transport: new DefaultChatTransport({ api: '<MASTRA_URL>/chat' }) })`
- `@mastra/client-js` already installed (MASTRA-002 ✅) — wired via `src/lib/mastra/client.ts` for non-streaming calls (list agents, fetch run state)

#### 3. What to take (verified content)

- `chatRoute()` helper for agent streaming
- `workflowRoute()` for workflow streaming with suspend/resume
- `networkRoute()` if/when agent networks are introduced (defer)
- `prepareSendMessagesRequest` for trimming history when memory is configured
- Framework-agnostic `handleChatStream()` / `handleWorkflowStream()` for non-Express adapters

#### 4. What NOT to take

- Next.js route handlers shape (`route.ts`) — mdeAI uses Mastra server's built-in routes
- Any auth bypass in examples — Supabase JWT must be in Authorization header
- Mock model providers in examples

#### 5. Acceptance criteria

- [ ] `@mastra/ai-sdk` installed; appears in `my-mastra-app/package.json`
- [ ] `/chat` server route returns SSE stream when called with valid JWT
- [ ] Vite app receives streamed response via `useChat`
- [ ] Network tab shows `text/event-stream` Content-Type
- [ ] `npm run build` clean in both repos

---

### EXTRACT-09 — Workshop repo: learning material only, do not vendor

```
id: EXTRACT-09
title: tlolkema/ai-mastra-agent-workshop — learning reference, no extraction
status: Reference only
priority: P3
effort: 0
source: https://github.com/tlolkema/ai-mastra-agent-workshop
maps_to: nothing direct; useful for onboarding new contributors
```

#### 1. Decision

This is a workshop covering autonomous PR analysis agents. Its patterns are not mdeAI-aligned (autonomous execution conflicts with mdeAI's propose-only contract). Useful for onboarding contributors who are new to Mastra.

#### 2. Action

Add a one-line link to it in `tasks/mastra/mastra-runtime-runbook.md` under a "Further reading" section. No code extracted, no patterns adopted.

---

### EXTRACT-10 — Mastra templates index: scan-only

```
id: EXTRACT-10
title: Sweep mastra.ai/templates for high-value patterns; pin nothing yet
status: Reference only
priority: P3
effort: 0.25 day
source: https://mastra.ai/templates
maps_to: future verticals
```

#### 1. Action

Quarterly review only. Note in `tasks/mastra/mastra-roadmap.md` a recurring task: "Every 90 days, sweep mastra.ai/templates and any new mastra-ai/* repos. Open a fresh extract task only when a template directly maps to an active mdeAI vertical."

Templates to keep an eye on (from the GitHub search):
- GitHub PR code review template — maybe useful for internal repo automation, not user-facing
- BunsDev/mastra-starter — full starter; reference only
- Cometchat/ai-agent-mastra-examples — third-party starters; verify before using

---

## E. What NOT to Reuse — Final Consolidated List

| Source | Why NOT | Verified |
|---|---|---|
| LibSQL stores from any sample | Ephemeral filesystem; data lost on restart | ✅ |
| DuckDB observability store | Same ephemeral issue | ✅ |
| Next.js app dir / route.ts handlers | mdeAI is Vite + react-router-dom v6 | ✅ |
| Mastra `AgentBrowser` / Stagehand | OpenClaw owns browser execution | ✅ |
| Autonomous tool execution patterns | mdeAI is propose-only | ✅ |
| Demo auth in any sample | Supabase Auth is the single source of truth | ✅ |
| OpenAI / Anthropic models in examples | Production AI is Gemini-only | ✅ |
| Exa search client | Use Supabase `hybrid_search_*` RPCs | ✅ |
| Direct `.from().insert()` in agent tools | Bypasses RLS + audit | ✅ |
| Triage repo "ticket" naming | Conflicts with mdeAI event tickets | ✅ |
| Direct Stripe mutations from agents | Finance-approved separate task | ✅ |
| Meta Graph API direct send (WhatsApp guide) | mdeAI uses Infobip via approved gate | ✅ |
| LibSQL memory thread keyed by phone number | PII; key by `user_id` instead | ✅ |
| Free-form SQL execution tool (Text-to-SQL) | Allowlist + typed RPCs only | ✅ |
| End-user natural-language → SQL | Operator-only; end users use typed search tools | ✅ |
| Direct DB / Stripe / Infobip / OpenClaw writes from any agent | Propose-only contract — typed audited tools + Paperclip approval gate | ✅ |
| Vendoring any community repo (no license, no review, hackathon commit count) | §A0 rule 1 of [23-doc](23-mastra-modules-verified.md) — patterns only, no clone-and-merge | ✅ |
| Adding Redis / Temporal / LangGraph / external vector DBs / Kubernetes in Week 1 | §A0 rule 4 of [23-doc](23-mastra-modules-verified.md) — Mastra + Supabase + Vercel only | ✅ |
| UI Dojo components / theme / routing / pages | Reference patterns only; shadcn/ui is mdeAI's component source of truth | ✅ |

---

## F. Open Questions — Resolve Before Phase 2

1. **`@mastra/ai-sdk` install order** — does it install cleanly alongside `@mastra/pg` 1.10.0 in `my-mastra-app/`? Verify in EXTRACT-08.
2. **Infobip webhook shape** — does Infobip's inbound message webhook match the 3-step pipeline assumption? Confirm before EXTRACT-06 build phase.
3. **Paperclip API contract** — still undocumented. Blocks the "draft + approval" path in EXTRACT-06 + EXTRACT-05 suspend.
4. **VDB-02 status** — required before EXTRACT-04 stops being deferred.

---

## G. Sources (verified 2026-05-10)

- [mastra-ai/mastra](https://github.com/mastra-ai/mastra) — core framework
- [mastra-ai/ui-dojo](https://github.com/mastra-ai/ui-dojo) — Vite + AI SDK / Assistant UI / CopilotKit demos
- [Text-to-SQL template](https://mastra.ai/templates/text-to-sql) — schema introspection sample
- [mastra-ai/docs-chatbot-example](https://github.com/mastra-ai/docs-chatbot-example) — Next.js + CopilotKit integration
- [mastra-ai/template-deep-search](https://github.com/mastra-ai/template-deep-search) — Exa-powered self-eval research loop
- [WhatsApp chat-bot guide](https://mastra.ai/guides/guide/whatsapp-chat-bot) — 3-step pipeline via Meta Graph API
- [AgentBrowser reference](https://mastra.ai/reference/browser/agent-browser) — deterministic browser tool (skip)
- [AI SDK UI guide](https://mastra.ai/guides/build-your-ui/ai-sdk-ui) — `@mastra/ai-sdk` server helpers
- [tlolkema/ai-mastra-agent-workshop](https://github.com/tlolkema/ai-mastra-agent-workshop) — learning workshop
- [Mastra templates index](https://mastra.ai/templates) — template directory
- [mastra-ai org repos](https://github.com/orgs/mastra-ai/repositories) — full GitHub presence
