# Mastra Ecosystem Deep Research
*Date: 2026-05-11 | For: mdeai.co*

---

## Section 1: Ecosystem Comparison Table

All repos researched, scored for relevance to mdeai.co (Mastra + Gemini + Supabase + real estate/events/concierge).

| # | Repo URL | Category | Stack | Agents | Workflows | RAG | HITL | Memory | Browser | Score/100 |
|---|----------|----------|-------|--------|-----------|-----|------|--------|---------|-----------|
| 1 | github.com/mastra-ai/mastra | Core Framework | TS, Deno, Node | Multi | Graph-based | Yes | Yes | LibSQL/PG | @mastra/agent-browser | 95 |
| 2 | github.com/ssdeanx/AgentStack | Multi-agent Platform | Next.js 16, Mastra, LibSQL | 25+ | 10+ | Yes (HNSW) | Yes (suspend/resume) | LibSQL+Turso | No | 88 |
| 3 | github.com/mastra-ai/template-deep-research | HITL Template | TS, Mastra, Exa | 2 (Research+Report) | 1 (3-phase) | Yes (Exa search) | Yes (explicit) | State-based | No | 85 |
| 4 | github.com/mastra-ai/template-coding-agent | Sandbox Agent | TS, Mastra, E2B/Daytona | 1 (Coding) | Sequential | No | No | Per-session | No | 65 |
| 5 | github.com/mastra-ai/template-github-review-agent | Code Review | TS, Mastra, Claude | 2 (Review+Workflow) | 4-step | No | No | Observational | No | 60 |
| 6 | github.com/assistant-ui/mastra-hitl | HITL UI | TS, Mastra, assistant-ui | 1 | Plan→Approve→Execute | No | Yes (multi-gate) | LibSQL | No | 90 |
| 7 | github.com/openclaw/openclaw | Personal AI OS | TS, Node, multi-channel | Multi (routed) | Cron+Webhook | No | No | Local workspace | No | 78 |
| 8 | github.com/abhi1693/openclaw-mission-control | Agent Dashboard | TS, OpenClaw Gateway | Multi | Approval flows | No | Yes | Gateway | No | 72 |
| 9 | github.com/Gen-Verse/OpenClaw-RL | RL Training | Python, RL | Training agents | RL loops | No | No | Episode-based | No | 30 |
| 10 | github.com/ataschz/tanstack-start-mastra-example | Travel AI | TS, TanStack, Mastra, SQLite | 3 (Router+Weather+Dest) | Agent network | No | No | LibSQL (SQLite) | No | 92 |
| 11 | github.com/bitsandbrainsai/agentic-rag-n8n-ingestion-pipeline | Agentic RAG | n8n, Supabase, pgvector | Event-driven | Ingestion pipeline | Yes (hybrid) | No | Multi-tenant pgvector | No | 80 |
| 12 | github.com/supabase-community/chatgpt-your-files | RAG Chat | Next.js, Supabase, pgvector | 1 | 3-phase (upload→embed→chat) | Yes (384D GTE) | No | pgvector + RLS | No | 85 |
| 13 | github.com/AmitxParmar/ai-agent | Multi-agent RAG | TS, Mastra, Supabase, Hono | 3 (Classify+RAG+Respond) | Sequential | Yes (text-embedding-004) | No | Supabase pgvector | No | 87 |
| 14 | github.com/mem0ai/mem0 | Memory Layer | Python+Node, multi-backend | Memory agents | Search-augment | Semantic (per-user) | No | User-namespaced | No | 82 |
| 15 | github.com/tubone24/a2a_mastra | A2A Demo | TS, Mastra, Bedrock | 4 (Gateway+3 workers) | Hybrid REST+A2A | No | No | Per-agent | No | 70 |
| 16 | github.com/browser-use/browser-use | Browser Agent | Python, Playwright | 1 (BrowserAgent) | Task-loop | No | No | Session-scoped | Yes (Playwright) | 72 |
| 17 | github.com/hyperbrowserai/HyperAgent | Browser AI | TS/JS, Playwright, CDP | 1 (HyperAgent) | page.ai() multi-step | No | No | Session | Yes (CDP+Playwright) | 75 |
| 18 | github.com/ideamans/mastra-ai-agent-batch-example | Batch Browser | TS, Mastra, Playwright MCP | 1 (Survey agent) | Batch loop | No | No | Google Sheets | Yes (Playwright MCP) | 76 |
| 19 | github.com/blaxel-templates/template-mastra-ts | Production Template | TS, Mastra, Blaxel | Configurable | Configurable | No | No | Configurable | No | 70 |
| 20 | github.com/BunsDev/mastra-starter | Starter | TS, Mastra, OpenAI | 1 (weather) | 1 (weather-workflow) | No | No | None | No | 45 |
| 21 | github.com/TechWithTy/gemini-stream | Gemini SSE | TS, Next.js, Gemini Live API | 1 (multimodal) | None | No | No | None | No | 68 |
| 22 | github.com/KishorNaik/Sol_Mastra_AI_Demo_Google_Gemini | Gemini+Mastra | TS, Mastra, Gemini | 1 (Todo agent) | None | No | No | None | No | 62 |
| 23 | github.com/josstei/maestro-orchestrate | Multi-runtime Orch | Node, TOML, multi-LLM | 39 specialists | Express+Standard | No | Yes (approval gates) | Session files | No | 74 |
| 24 | github.com/JackChen-me/open-multi-agent | DAG Orchestration | TS, MCP, live tracing | Goal-to-DAG | Auto-DAG | No | No | In-memory | No | 65 |
| 25 | github.com/matrixorigin/Memoria | Memory Kit | Multi-lang | Memory agents | Version-controlled | Semantic | No | Git-versioned | No | 68 |
| 26 | github.com/mastra-ai/mastra-observational-memory-workshop | Memory Workshop | TS, Mastra | Observer+Reflector | Compression pipeline | Yes (semantic) | No | Observational | No | 88 |
| 27 | github.com/supavec/supabase-ai | SDK | TS, Supabase, pgvector | None | None | Yes (cosine sim) | No | pgvector | No | 75 |
| 28 | github.com/evilmartians/mastra-coding-agent | Coding Agent | TS, Mastra, E2B | 1 (Coding) | E2B sandbox loop | No | No | Per-session | No | 55 |

---

## Section 2: Top Repos — Deep Reviews

### 1. [mastra-ai/mastra](https://github.com/mastra-ai/mastra)
**Score: 95/100** | **Category:** Core Framework

- **What it is:** The official Mastra framework — TypeScript-native agent framework from the Gatsby team, 23.8k stars, 1.8M npm downloads/month, 1.0 released January 2026.
- **Core architecture:** Monorepo with `@mastra/core` (agents, workflows, RAG, memory), `@mastra/mcp` (138k weekly downloads), `@mastra/evals`, `@mastra/pg`, `@mastra/pinecone`/`@mastra/qdrant` etc. Six building blocks: Agents, Workflows, RAG, Memory, Evals, MCP.
- **Agent structure:** Agents instantiated with `new Agent({ id, model, tools, instructions, memory })`. Two invocation patterns: `.generate()` (blocking) and `.stream()` (SSE). Agent loop now controlled by Mastra itself (v0.14.0+), not delegated to AI SDK.
- **Workflow structure:** Graph-based state machine. Control flow via `.then()`, `.parallel()`, `.branch()`, `.foreach()`, `.dountil()`, `.dowhile()`. Suspend/resume for HITL. `run.stream()` returns `ReadableStream` of lifecycle events (`workflow.start`, `workflow.step`, `workflow.end`, `workflow.fail`). Two stream formats: legacy (flat events) and vNext (AI SDK-compatible chunks with `data-*` prefixes).
- **Memory/retrieval:** Four layers: conversation history (raw), working memory (structured Markdown), semantic recall (embedding-based), observational memory (Observer+Reflector agents compressing at token thresholds — 94.87% on LongMemEval, 3-40x compression). Default storage: LibSQL (Turso); supported: Postgres, MongoDB, ClickHouse, Redis.
- **Tool calling:** `createTool({ id, description, inputSchema, outputSchema, execute })`. Zod, Valibot, or ArkType for schemas. Lifecycle hooks: `onInputStart`, `onInputDelta`, `onInputAvailable`, `onOutput`. `toModelOutput` transforms output before model sees it. Tool compatibility layer reduced Gemini error rate from 15% to 3%.
- **Realtime capabilities:** Agent SSE with `text/event-stream`. Workflow chunked transfer with ASCII Record Separator (`\x1E`). Nested streaming for agent-calling-agent. `@mastra/agent-browser` for browser automation via accessibility refs.
- **HITL patterns:** `suspend({ reason, payload })` inside step execute; `run.resume({ step, resumeData })` to continue. Persist `runId` for cross-restart recovery. Three placement patterns: tool-level (before dangerous tool), step-level (mid-workflow), agent-as-step (clean history).
- **Browser automation:** `@mastra/agent-browser` package uses Playwright + accessibility tree refs (`@e1`, `@e2`). `browser_snapshot` → interact via ref. Remote CDP supported.
- **Best features to copy:** (1) Observational memory for mdeai concierge — no vector DB needed for per-user context; (2) Agent Network for intent-router → specialist dispatch; (3) `writer.custom()` + `data-mdeai-actions` SSE protocol for inline cards; (4) `suspend()`/`resume()` for payment confirmation HITL; (5) Tool compatibility layer already in place for Gemini.
- **Weaknesses:** Node.js 22.13.0+ requirement; Studio dev server at 4111 conflicts if multiple projects; Postgres storage backend less documented than LibSQL.
- **mdeai use case:** Primary framework backbone for all 4 agent verticals.

---

### 2. [ssdeanx/AgentStack](https://github.com/ssdeanx/AgentStack)
**Score: 88/100** | **Category:** Multi-agent Enterprise Platform

- **What it is:** Production-grade multi-agent system built on Mastra with 25+ specialized agents, 57 enterprise tools, 12+ supervisor networks, and 97% test coverage. Next.js 16 frontend.
- **Core architecture:** Hierarchical — Supervisors → Specialists → Tools. LibSQL primary storage with optional Turso cloud. Langfuse for observability. RBAC auth. 105 UI components (50 AI Elements + 55 shadcn/ui).
- **Agent structure:** Agents organized by domain: research, content, financial, data, coding, business. Supervisor agents use delegation hooks to route tasks. 3072D Gemini embeddings for vector storage with HNSW indexing.
- **Workflow structure:** 10+ orchestrated workflows. Sequential and parallel branches. Suspend/resume for HITL. A2A coordination via MCP.
- **Memory/retrieval:** LibSQL with thread management. Vector storage via HNSW. Session storage. TanStack Query integration with 1590+ typed hooks.
- **Tool calling:** 57 tools including Polygon, Finnhub, AlphaVantage, SerpAPI. Strict Zod schemas. Real-time latency/token tracking per tool.
- **Realtime capabilities:** Real-time agent response streaming. Langfuse trace collection. Custom scoring.
- **HITL patterns:** Suspend/resume workflow integration. Sensitive actions gated through explicit approval flows.
- **Best features to copy:** (1) Supervisor network pattern for mdeai intent routing; (2) Gemini 3072D embeddings configuration; (3) Real-time observability setup (Langfuse); (4) Domain-scoped agent organization (rental-agent, events-agent, etc.); (5) RBAC structure for admin vs. user access.
- **Weaknesses:** Very large codebase — hard to cherry-pick patterns; financial domain focus means many tools irrelevant; LibSQL-first, may need adaptation for Supabase Postgres.
- **mdeai use case:** Architecture reference for the mdeai supervisor network (ai-router → specialist agents).

---

### 3. [assistant-ui/mastra-hitl](https://github.com/assistant-ui/mastra-hitl)
**Score: 90/100** | **Category:** HITL Reference Implementation

- **What it is:** Production-quality HITL demo with mandatory approval gates at every execution step. Three-phase workflow: plan → approve → execute.
- **Core architecture:** assistant-ui for UI + Mastra for orchestration. Blocking tool pattern (tools halt until user responds).
- **Agent structure:** Single agent with multi-gate approval. Agent receives plan-approval and email-proposal tools that block until user acts.
- **Workflow structure:** Plan phase: `updateTodosTool` creates editable todo list. Approval gate: `askForPlanApprovalTool` blocks returning `{todos[], approved: boolean}`. Execution phase: runs only after approval. Dynamic re-approval if new tasks arise mid-execution.
- **Memory/retrieval:** LibSQL for thread persistence. Todo state tracked across turns.
- **Tool calling:** `askForPlanApprovalTool` → UI renders editable checklist → user approves/rejects → tool returns result. `proposeEmailTool` → shows draft → `sendEmailTool` executes only on approval.
- **Realtime capabilities:** Real-time todo tracker shows in-progress status. Streaming agent responses.
- **HITL patterns:** Three-layer HITL: (1) Plan approval before any execution; (2) Action-level approval per risky action (email send); (3) Dynamic re-approval if scope changes. UI components: `plan-approval.tsx` (editable todo), `human-in-the-loop.tsx` (email draft preview), `todo.tsx` (real-time tracker).
- **Best features to copy:** (1) `plan-approval.tsx` editable todo list pattern for mdeai booking confirmation; (2) Multi-gate approval (budget → dates → confirm) for trip planner; (3) `proposeEmailTool`/`sendEmailTool` split for WhatsApp lead follow-up; (4) Re-approval trigger when scope changes mid-execution.
- **Weaknesses:** assistant-ui dependency adds complexity; single-agent only; no memory across sessions.
- **mdeai use case:** Direct model for the "AI proposes, user confirms" booking and payment flows. Clone `plan-approval.tsx` for rental booking confirmation card.

---

### 4. [ataschz/tanstack-start-mastra-example](https://github.com/ataschz/tanstack-start-mastra-example)
**Score: 92/100** | **Category:** AI Travel Assistant (closest to mdeai)

- **What it is:** AI travel assistant with Mastra agent networks, TanStack Start, real-time streaming, and dynamic tool-call UI. Very close to mdeai architecture.
- **Core architecture:** TanStack Start (SSR React) + Mastra agent network + LibSQL (SQLite) memory + Perplexity Sonar search.
- **Agent structure:** Three agents — routing agent (analyzes intent, delegates), weather agent (climate queries), destinations agent (travel recommendations). Routing agent has `agents` property containing specialists.
- **Workflow structure:** Agent network with LLM-based routing. No predetermined sequences. Memory tracks task history for completion detection.
- **Memory/retrieval:** SQLite via `@mastra/libsql`. Persistent thread storage with automatic title generation (Gemini Flash Lite). Message resolution converts Mastra format to AI SDK.
- **Tool calling:** Web search via Perplexity Sonar with source citations. Custom tool UI registry per tool type.
- **Realtime capabilities:** `useChat()` hook streaming multiple event types: text chunks, tool invocations (with params + results), network execution data (routing decisions), reasoning events (chain-of-thought).
- **HITL patterns:** None implemented. Pure propose-only.
- **Best features to copy:** (1) `MessagePartRenderer` switching on part type — clone this for mdeai inline cards (rental card, event card, map pin); (2) Network execution visualization showing routing decisions; (3) Routing agent pattern with `description`-driven specialist dispatch; (4) Automatic thread title generation; (5) Multi-event SSE stream consumption pattern.
- **Weaknesses:** SQLite only (not Postgres/Supabase); Perplexity dependency; no HITL; no RAG over proprietary data.
- **mdeai use case:** Direct architecture reference. Routing agent → rental-agent / events-agent / restaurants-agent. `MessagePartRenderer` → mdeai inline card components.

---

### 5. [openclaw/openclaw](https://github.com/openclaw/openclaw)
**Score: 78/100** | **Category:** Personal AI OS / Multi-channel Automation

- **What it is:** Personal AI assistant running locally, connecting to 24+ messaging platforms (WhatsApp, Telegram, Slack, Discord, iMessage, etc.). 247k GitHub stars. Originally named Clawdbot, renamed to OpenClaw January 2026.
- **Core architecture:** Local-first Gateway as control plane. pnpm workspace, TypeScript/Node.js. Modular plugin architecture via `extensions/`. Agent workspaces at `~/.openclaw/workspace` with injected prompt files (AGENTS.md, SOUL.md, TOOLS.md).
- **Agent structure:** Multi-agent routing: inbound channel → isolated agent with separate workspace and session. Each agent has configurable skills and prompt files.
- **Workflow structure:** Cron jobs, webhooks, Gmail Pub/Sub. Tool-based automation. Session management via `sessions_list`, `sessions_history`, `sessions_send`.
- **Memory/retrieval:** Local session history in Gateway storage. `/compact` for conversation compression. Thinking levels via `/think <level>`.
- **Tool calling:** First-class tools: browser, canvas, nodes, cron, sessions, platform-specific actions (Discord/Slack).
- **Realtime capabilities:** Native app on macOS/iOS/Android for voice. Live Canvas rendering. All 24+ messaging channels real-time.
- **HITL patterns:** None explicit — fully autonomous by design.
- **Best features to copy:** (1) Per-channel agent isolation pattern for mdeai (WhatsApp leads → dedicated lead-nurture agent, different from web concierge); (2) SOUL.md / AGENTS.md prompt injection pattern for persona consistency; (3) Cron-based automation for lead follow-up scheduling; (4) Multi-channel unified gateway for mdeai notifications (email, WhatsApp, push).
- **Weaknesses:** Python/local-first — needs significant adaptation for Supabase/cloud; no HITL; no structured RAG; security model is local-only.
- **mdeai use case:** WhatsApp lead capture channel. OpenClaw as the channel layer → mdeai Mastra agents as the processing backend.

---

### 6. [bitsandbrainsai/agentic-rag-n8n-ingestion-pipeline](https://github.com/bitsandbrainsai/agentic-rag-n8n-ingestion-pipeline) / [AmitxParmar/ai-agent](https://github.com/AmitxParmar/ai-agent)
**Score: 80-87/100** | **Category:** Agentic RAG + Supabase

- **What it is (combined):** Two repos showing production agentic RAG with Supabase/pgvector. The n8n version uses event-driven ingestion. The ai-agent version uses Mastra + Hono + Supabase + multi-agent classification.
- **Core architecture (ai-agent):** Hono API + Vercel Edge + Mastra + Supabase pgvector + Google `text-embedding-004` model. Three sequential agents: Query Classifier → RAG Retriever → Response Generator.
- **Agent structure:** Query Classifier analyzes intent/category → RAG Agent does semantic search with category filter → Response Agent synthesizes answer. All coordinated via Mastra orchestration layer.
- **Workflow structure:** Sequential pipeline with classification gate. RLS enforced on Supabase side. Similarity thresholds 0.6-0.8 configurable.
- **Memory/retrieval:** Supabase pgvector for knowledge base. `text-embedding-004` (Google's embedding model). Category-filtered retrieval for precision. Conversation history in Supabase.
- **HITL patterns:** None — fully automated retrieval.
- **Best features to copy:** (1) `text-embedding-004` for Gemini-ecosystem embedding consistency; (2) Category-filter on vector search for mdeai verticals (only search apartments when intent=RENTAL); (3) Similarity threshold 0.6 floor prevents hallucinated near-misses; (4) Multi-tenant RLS pattern on `document_sections`; (5) n8n ingestion pipeline for automated listing refresh.
- **mdeai use case:** The agentic RAG backbone for `ai-search` edge function. Classification → filtered pgvector search → response with citations.

---

### 7. [supabase-community/chatgpt-your-files](https://github.com/supabase-community/chatgpt-your-files)
**Score: 85/100** | **Category:** Production RAG with Supabase

- **What it is:** Official Supabase community production MVP for RAG chat over documents. Next.js + Supabase Edge Functions + pgvector + GTE-small 384D embeddings + RLS.
- **Core architecture:** Next.js frontend → Supabase Edge Function (Deno) → pgvector similarity search → LLM response. Storage: Supabase object storage (S3-backed).
- **RAG implementation:** Upload trigger → `process` Edge Function (markdown → sections) → `embed` Edge Function (GTE-small, 384D vectors) → HNSW index (`vector_ip_ops`). Query: `embedding <#> embedding < -match_threshold ORDER BY embedding` (negative inner-product). Top 5 sections injected into prompt.
- **Security:** RLS on `document_sections` cascades from parent document ownership (`auth.uid() = created_by`). Auth headers propagate through Edge Functions.
- **Streaming:** `OpenAIStream` wrapper → `useChat()` hook for incremental token display.
- **Best features to copy:** (1) HNSW index with `vector_ip_ops` for max speed; (2) Trigger-based async embedding (don't embed at upload time — use DB trigger); (3) RLS cascade pattern (listing RLS → listing_sections RLS); (4) Top-5 chunk injection pattern; (5) Negative inner-product operator for fast Supabase similarity.
- **mdeai use case:** Template for mdeai apartment/event listing embeddings. The `embed` trigger pattern means new listings auto-embed without manual orchestration.

---

### 8. [mastra-ai/template-deep-research](https://github.com/mastra-ai/template-deep-research)
**Score: 85/100** | **Category:** HITL Research Workflow

- **What it is:** AI deep research assistant with explicit HITL approval gates. Research → human review → report generation.
- **Workflow structure:** `researchWorkflow` → suspend for approval → `reportAgent` synthesis. Rejection loops back to more research.
- **Tools:** `webSearchTool` (Exa API), `evaluateResultTool` (relevance scoring), `extractLearningsTool` (insights + follow-up questions).
- **HITL pattern:** Suspension after research phase. User sees findings, approves or requests more research. Approval advances to report generation.
- **Best features to copy:** (1) `evaluateResultTool` pattern — before returning search results to user, score relevance; (2) Iterative refinement loop (reject → research more) for mdeai property search ("not quite right, show me more"); (3) `extractLearningsTool` pattern for building user preference profiles across sessions.
- **mdeai use case:** Property search refinement loop. User searches → AI finds options → user says "closer to El Poblado" → loop refines → user approves → booking initiated.

---

### 9. [hyperbrowserai/HyperAgent](https://github.com/hyperbrowserai/HyperAgent)
**Score: 75/100** | **Category:** Production Browser Automation

- **What it is:** TypeScript browser AI agent combining Playwright with CDP for production-grade web automation. Gemini support built in.
- **Core architecture:** `page.perform()` (fast, accessibility tree, 1 LLM call) vs `page.ai()` (multi-step, visual). CDP-first for exact coordinates. Zod output schemas for structured data extraction.
- **Anti-detection:** Stealth mode, fingerprint patching, automatic ad/tracking iframe filtering.
- **LLM integration:** OpenAI, Claude, Gemini, DeepSeek. MCP client for Composio tools.
- **Best features to copy:** (1) Zod output schema for structured listing extraction; (2) `page.perform()` single-call pattern for competitive listing scraping; (3) Action caching for replay without LLM calls; (4) CDP coordinates for reliable cross-site scraping.
- **mdeai use case:** Scraping competitor rental listings (Airbnb, booking.com) to keep mdeai prices competitive. One-call extraction with Gemini + Zod schema.

---

### 10. [ideamans/mastra-ai-agent-batch-example](https://github.com/ideamans/mastra-ai-agent-batch-example)
**Score: 76/100** | **Category:** Batch Browser + Mastra

- **What it is:** Mastra + Playwright MCP + Google Sheets batch processing. Survey agent processes lists of URLs and records findings.
- **Workflow:** Sheets → retrieve pending → Playwright navigate → Brave Search when discrepancy → record findings → repeat.
- **Best features to copy:** (1) Google Sheets as lightweight task queue for batch scraping jobs; (2) Mastra coordinating Playwright MCP (not direct Playwright) — cleaner separation; (3) `batch.ts` workflow loop pattern for processing n listings.
- **mdeai use case:** Batch embedding refresh when listings update. Or periodic competitor price scraping.

---

### 11. [mem0ai/mem0](https://github.com/mem0ai/mem0)
**Score: 82/100** | **Category:** Universal Memory Layer

- **What it is:** Universal memory layer for AI agents with per-user namespacing, semantic search, and multi-framework integration.
- **Memory API:** `memory.add(messages, user_id=userId)` → store. `memory.search(query, filters={"user_id": userId}, top_k=3)` → retrieve. Cleanly separated per-user.
- **Integration:** CrewAI, LangGraph, Claude, Cursor. Python + Node SDKs. REST API for any framework.
- **Best features to copy:** (1) Per-user `filters={"user_id": userId}` pattern — directly maps to mdeai's `(select auth.uid())` RLS pattern; (2) `top_k=3` retrieval ceiling to keep prompts lean; (3) Multi-framework compatibility means can sit in front of Mastra agents.
- **Weaknesses:** Python-first; adds another service dependency; not Mastra-native (Mastra has its own memory now).
- **mdeai use case:** Alternative if Mastra's observational memory doesn't fit — mem0 as the user preference store, Mastra for orchestration.

---

## Section 3: Best Architecture Patterns

### Memory Architecture Patterns

**Recommended for mdeai: Mastra Observational Memory**

The best pattern for per-user persistent memory in 2026 is Mastra's Observational Memory (OM):
- Observer agent compresses raw messages into dated, emoji-prioritized observations (🔴/🟡/🟢) when token threshold is hit
- Reflector agent further condenses observations when they accumulate
- Append-only, cacheable prefix = 4-10x cost reduction via prompt caching
- 94.87% on LongMemEval vs 84.23% for RAG-based approaches
- Average 30k context window despite 57M tokens of conversation history

**Storage backend hierarchy for mdeai:**
```
Per-user thread memory → Mastra OM with LibSQL (fast, local to Mastra server)
Listing knowledge base → Supabase pgvector (RLS-enforced, location-aware)
Shared workflow state → Supabase Postgres (consistent with rest of mdeai DB)
Observability → Langfuse (traces, token costs, latency)
```

**Thread vs resource memory:**
- `threadId` = per-conversation (e.g., one chat session)
- `resourceId` = per-user across all conversations (e.g., user's persistent preferences: "prefers El Poblado, budget $1200/mo, no-pet buildings")

**Working memory pattern for mdeai:**
```typescript
// Inject structured user profile as working memory
const workingMemory = `
# User Profile
- Name: ${user.name}
- Budget: $${user.maxBudget}/mo
- Neighborhoods: ${user.preferredNeighborhoods.join(', ')}
- Must-haves: ${user.amenities.join(', ')}
`
```

---

### HITL Architecture Patterns

**Three-gate pattern for mdeai booking flows:**

1. **Gate 1 — Search confirmation** (soft): "I found 3 apartments matching your criteria. Want me to show details on [El Poblado Loft]?" — no suspend needed, just `AIProposalCard`.

2. **Gate 2 — Booking intent** (medium): Workflow suspends. Frontend shows booking summary card with editable dates/guests. `run.resume({ step: 'confirm-booking', resumeData: { dates, guests, confirmed: true } })`.

3. **Gate 3 — Payment** (hard): Always HITL. Workflow suspends at payment step. Stripe checkout opens. Webhook resumes workflow on `payment_intent.succeeded`.

**Suspend/resume wiring:**
```typescript
// Backend: suspend
const bookingStep = createStep({
  id: 'confirm-booking',
  resumeSchema: z.object({ dates: z.string(), confirmed: z.boolean() }),
  execute: async ({ resumeData, suspend }) => {
    if (!resumeData?.confirmed) return await suspend({ bookingSummary })
    return await createBooking(resumeData)
  }
})

// Frontend: resume via SSE + REST
const runId = await startBookingWorkflow(query)
// SSE fires 'suspended' event → show confirmation card
// User clicks confirm →
await fetch(`/api/workflows/booking/resume`, {
  method: 'POST',
  body: JSON.stringify({ runId, step: 'confirm-booking', resumeData: { confirmed: true } })
})
```

**Notification → Review → Execute for landlords:**
- AI drafts lease terms → emails landlord with approve/reject link
- Link hits edge function → `run.resume({ step: 'landlord-approval', resumeData: { approved: true } })` → tenant notified

---

### Routing & Triage Patterns

**Recommended pattern: Mastra Agent Network (vNext)**

The intent router in mdeai should use the Agent Network pattern:

```typescript
const routingAgent = new Agent({
  id: 'mdeai-router',
  model: 'google/gemini-flash-lite-preview',  // cheap + fast for classification
  agents: { rentalAgent, eventsAgent, restaurantsAgent, tripsAgent },
  workflows: { searchWorkflow, bookingWorkflow, tripPlannerWorkflow },
  tools: { clarifyIntentTool },
  memory: new Memory({ storage: libSQLStore })
})
```

Key routing rules:
- Better agent `description` = smarter routing (the LLM reads descriptions to decide)
- Memory stores task history so router knows what specialist already tried
- Fallback: if confidence < threshold, `clarifyIntentTool` asks user to specify
- Escalation: if specialist returns empty results, router tries adjacent specialist

**Intent classification tiers:**
```
Tier 1 (router): gemini-flash-lite (~0.5s, cheap) — classify only
Tier 2 (specialist): gemini-flash-preview (~2-4s) — search + tool calls
Tier 3 (planner): gemini-pro-preview (~5-15s) — multi-day itinerary, complex reasoning
```

---

### RAG Architecture Patterns

**Agentic RAG vs Static RAG for mdeai:**

| Feature | Static RAG | Agentic RAG |
|---------|-----------|-------------|
| Query expansion | None | Agent rewrites query if results poor |
| Multi-hop | No | Agent chains multiple retrievals |
| Filtering | Pre-defined | Agent decides which filter to apply |
| Refinement | No | User rejects → agent tries different query |
| Cost | Low | 2-5x higher |
| Use case | FAQ, docs | Complex property search, trip planning |

**Use static RAG for:** neighborhood FAQ, transit info, safety guides, event descriptions.
**Use agentic RAG for:** apartment search (multi-criteria + location), trip itinerary building.

**pgvector + PostGIS hybrid pattern for mdeai:**
```sql
-- Hybrid: vector similarity + location proximity
SELECT a.*, 
  1 - (a.embedding <=> $1) AS semantic_score,
  ST_Distance(a.location::geography, $2::geography) AS distance_m
FROM apartments a
WHERE ST_DWithin(a.location::geography, $2::geography, $3)  -- radius filter first (fast)
  AND 1 - (a.embedding <=> $1) > 0.6  -- semantic threshold
ORDER BY 
  (1 - (a.embedding <=> $1)) * 0.7 +  -- 70% semantic
  (1 - LEAST(ST_Distance(a.location::geography, $2::geography) / $3, 1)) * 0.3  -- 30% proximity
LIMIT 10;
```

**Chunking strategy for mdeai listings:**
- Apartments: chunk by section (amenities, location, rules, price) — 256 tokens with 32 overlap
- Events: single chunk per event (usually short enough) — 512 tokens
- Neighborhoods: paragraph chunks with location metadata in chunk — 512 tokens, 64 overlap
- Embed with `text-embedding-004` (Google, consistent with Gemini ecosystem) or `text-embedding-3-small` (OpenAI)

---

### Tool Design Patterns

**Best practices from production repos:**

1. **Schema-first with Zod** — every tool input/output strictly typed. Gemini silently ignores unsupported JSON Schema constraints (like `minLength`); embed constraints in `description` field as fallback (Mastra's tool compatibility layer does this automatically).

2. **Streaming tool results** — use `toModelOutput` to transform structured data into text the model can reason about, while preserving raw data for the frontend:
```typescript
createTool({
  id: 'search-apartments',
  execute: async ({ context }) => {
    const listings = await searchApartments(context)
    return listings
  },
  toModelOutput: (listings) => ({
    type: 'text',
    text: listings.map(l => `${l.name}: $${l.price}/mo, ${l.bedrooms}BR, ${l.neighborhood}`).join('\n')
  })
})
```

3. **Tool composition** — chain tools by having specialist agents call other tools sequentially. Don't mega-tool everything into one function; keep tools single-responsibility.

4. **mdeai `data-` SSE protocol** — follow AI SDK v5 `data-*` chunk naming for inline card rendering:
```
data-apartment-card: { id, name, price, location, imageUrl }
data-map-pin: { lat, lng, label, popupHtml }
data-event-card: { id, title, date, venue, ticketUrl }
data-booking-proposal: { apartmentId, dates, totalPrice, confirmed: false }
```

---

### Workflow Design Patterns

**Branching pattern for mdeai:**
```
User message
  → Router (gemini-flash-lite)
    → RENTAL branch: searchApartments → rankResults → proposeBooking → [HITL] → createBooking
    → EVENTS branch: searchEvents → filterByDate → proposeTicket → [HITL] → stripeCheckout
    → TRIP branch: parseItinerary → optimizeRoute → proposePlan → [HITL] → savePlan
    → GENERAL branch: knowledgeBaseRAG → respond
```

**Error recovery pattern:**
- Each step: idempotent (can retry safely)
- Workflow: `maxRetries: 3` per step before escalating
- Human escalation: if 3 retries fail, suspend and notify support
- Timeout: 30s per AI step (already in mdeai edge function rules), 10s per DB step

**Long workflow checkpointing:**
- Trip planner workflow: checkpoint after each day planned
- Persist `runId` in Supabase `agent_jobs` table
- If user closes browser, can resume from last checkpoint via stored `runId`

---

## Section 4: Best Real-World AI Product Ideas for mdeai

### Idea 1: AI Rental Concierge (Autonomous with HITL)
**Workflow:** Intent classification → semantic search (pgvector + PostGIS) → propose listing cards → HITL booking confirmation → Stripe payment → WhatsApp/email confirmation.
**Agents:** router-agent (Gemini Flash Lite) → rental-agent (Gemini Flash Preview) → booking-agent (workflow with HITL).
**Business model:** Lead capture for property owners, booking commission, premium listing placement.
**Tech:** Mastra agent network + Supabase pgvector + PostGIS radius filter + Stripe + Infobip WhatsApp. Memory: Observational Memory for user preferences.

### Idea 2: Event Discovery & Booking Agent
**Workflow:** Natural language date/genre/budget parsing → event search → ticket availability check → propose event card with map pin → HITL ticket purchase → QR delivery.
**Agents:** events-agent with `searchEvents`, `checkAvailability`, `proposeTicket` tools.
**Business model:** Ticket sales commission, event promotion packages.
**Tech:** Events table in Supabase + pgvector for semantic search + Stripe for tickets + QR signing already implemented.

### Idea 3: Sponsor ROI Assistant
**Workflow:** Sponsor inputs brand brief → ai-audience-match scores brand ↔ contest fit → ai-roi-explain projects reach/impressions → ROI dashboard → contract proposal → HITL sign-off.
**Agents:** brand-match-agent (Gemini Pro) → roi-agent (Gemini Pro) → contract-agent.
**Business model:** Sponsorship packages, performance-based pricing.
**Tech:** Sponsor profile table + event analytics + Gemini Pro reasoning + PDF contract generation.

### Idea 4: WhatsApp Lead Nurture Agent
**Workflow:** Infobip webhook → OpenClaw/Mastra WhatsApp handler → classify lead intent → respond with listings → schedule follow-up cron → escalate hot leads to human agent.
**Agents:** chat-agent (warm persona, Gemini Flash) → segmentation-agent → scheduling-agent.
**Business model:** Property manager subscription, lead qualification service.
**Tech:** Infobip WABA + Mastra WhatsApp workflow (3-step: respond → segment → schedule) + cron via `LEAD_REMINDER_CRON_SECRET` already in mdeai.

### Idea 5: Agentic RAG for Local Knowledge
**Workflow:** User asks about El Poblado safety / metro lines / cost of living → classifier routes to knowledge base → pgvector search neighborhood docs → PostGIS locates nearest relevant POIs → synthesize response with sources.
**Agents:** knowledge-agent with `searchNeighborhoods`, `findNearbyPOIs`, `getTransitInfo` tools.
**Business model:** Premium feature for relocation packages, expat onboarding.
**Tech:** Neighborhood knowledge base embedded in pgvector; PostGIS for POI proximity; trigger-based embedding refresh when content updated.

### Idea 6: Browser Agent for Listing Scraping
**Workflow:** Cron triggers → HyperAgent navigates competitor listings → Zod-schema extraction → price/availability comparison → alert if mdeai listings not competitive → suggest price adjustment.
**Agents:** scraper-agent (HyperAgent + Gemini) → pricing-agent → notification-agent.
**Business model:** Data advantage, dynamic pricing recommendations for landlords.
**Tech:** HyperAgent (TS) + Gemini + Zod extraction schemas + Supabase for results + stealth mode.

### Idea 7: AI Triage for Support & Moderation
**Workflow:** User report/inquiry → sentiment classification → route to FAQ RAG or human queue → auto-respond if confident → flag for admin if borderline → log all decisions.
**Agents:** triage-agent → faq-agent → escalation-agent.
**Business model:** Operational efficiency — reduce human support load.
**Tech:** Mastra workflow with branch (auto-answer vs. escalate) + Supabase `notifications` table + admin dashboard notification.

### Idea 8: Human-in-the-Loop Approval System
**Workflow:** Any financial or data-changing action → workflow suspends → email/WhatsApp notification to approver → approver clicks link → edge function resumes workflow → action executes → audit log written.
**Agents:** request-agent (structures the proposal) → notification-agent (sends approval request) → execution-agent (runs after approval).
**Business model:** Compliance and trust feature for property managers and event hosts.
**Tech:** `run.resume()` called from edge function hit by approval link; approval link signed with `STAFF_LINK_SECRET`; 60s revocation window already in mdeai.

### Idea 9: Persistent Travel Planner Agent
**Workflow:** User describes trip (dates, budget, interests) → agent builds multi-day itinerary → proposes day-by-day plan → user edits → agent optimizes route → saves to `trips` table → shares itinerary link.
**Agents:** planner-agent (Gemini Pro, multi-day reasoning) → optimizer-agent (Google Routes API) → save-agent.
**Business model:** Premium trip planning service, affiliate revenue from bookings in the itinerary.
**Tech:** `ai-trip-planner` edge function (already exists) upgraded to Mastra workflow with observational memory for iterative refinement. Google Directions API already integrated.

### Idea 10: AI Operational Team (Background Workers)
**Workflow:** Set of always-running agents: (a) embedding-refresher — watches `apartments` table for changes, re-embeds on update; (b) lead-nurture-scheduler — fires follow-up messages at optimal times; (c) analytics-summarizer — weekly digest for property managers; (d) anomaly-detector — flags unusual booking patterns.
**Agents:** Four background Mastra agents triggered by DB webhooks or cron.
**Business model:** Platform reliability, user retention through proactive outreach.
**Tech:** Supabase webhooks → Mastra workflows → Trigger.dev for durable execution + retry. Langfuse for observability.

---

## Section 5: Recommended mdeai Architecture

### Frontend Architecture

**Streaming chat (SSE protocol):**
```typescript
// useChat hook consumes SSE with multiple event types
const { messages, data } = useChat({
  api: '/api/chat',
  onData: (chunk) => {
    if (chunk.type === 'data-apartment-card') renderApartmentCard(chunk.data)
    if (chunk.type === 'data-map-pin') addMapPin(chunk.data)
    if (chunk.type === 'data-booking-proposal') showHITLCard(chunk.data)
    if (chunk.type === 'workflow.suspended') showApprovalUI(chunk.payload)
  }
})
```

**Inline card components per vertical:**
- `<ApartmentProposalCard>` — price, photos, map pin, "Book this" CTA → triggers suspend/resume
- `<EventCard>` — date, venue, ticket count, "Buy Ticket" CTA
- `<TripItineraryCard>` — day-by-day plan, edit mode, "Save Plan" CTA
- `<BookingConfirmCard>` — editable dates/guests, total price, approve/reject

**Map pin protocol:**
```typescript
// data-map-pin SSE chunk
{ type: 'data-map-pin', data: { lat, lng, label, color, popupHtml, linkTo } }
// Front-end adds pin to Google Maps instance already in mdeai
```

**HITL approval UI pattern:**
```tsx
// Show when SSE fires workflow.suspended
<ApprovalGate
  proposal={suspendPayload}
  onApprove={() => resumeWorkflow({ confirmed: true })}
  onReject={() => resumeWorkflow({ confirmed: false })}
  onEdit={(changes) => resumeWorkflow({ confirmed: true, ...changes })}
/>
```

### Backend Architecture

**Supabase Edge Functions vs Mastra Tools:**

| Use Case | Use Supabase Edge Fn | Use Mastra Tool |
|----------|---------------------|----------------|
| Auth-gated data access | Yes | No (use Supabase client inside tool) |
| Stripe webhooks | Yes | No |
| Rate limiting (AI/search) | Yes (already implemented) | No |
| Multi-step AI orchestration | No | Yes |
| Tool calling within agents | No | Yes |
| RAG retrieval | Hybrid (Supabase query + Mastra tool wraps it) | |

**Mastra workflow triggers:**
- Webhook: `POST /api/mastra/workflows/rental-search/start` (from frontend chat submit)
- Cron: Lead follow-up scheduler via Trigger.dev
- DB event: Supabase webhook → Mastra when `apartments` updated → re-embed
- User action: Approval link → edge function → `run.resume()`

**Memory configuration for mdeai:**
```typescript
const mastra = new Mastra({
  agents: { routerAgent, rentalAgent, eventsAgent, tripsAgent },
  storage: new PostgresStore({ connectionString: process.env.SUPABASE_DB_URL }),
  vectors: new PgVector({ connectionString: process.env.SUPABASE_DB_URL }),
  // Observational Memory enabled per-agent
  memory: new Memory({
    storage: new LibSQLStore({ url: process.env.TURSO_URL }),
    options: { observationalMemory: true }
  })
})
```

### Orchestration Architecture

```
User Message (frontend)
  │
  ▼
Mastra Streaming Endpoint (Next.js / Hono adapter)
  │
  ▼
Router Agent [gemini-flash-lite, <500ms]
  • Reads: intent, context, user session
  • Classifies: RENTAL | EVENTS | TRIP | GENERAL | SUPPORT
  │
  ├──RENTAL──► Rental Agent [gemini-flash-preview]
  │              Tools: searchApartments (pgvector+PostGIS)
  │                     checkAvailability, getNeighborhoodInfo
  │                     proposeBooking → [HITL Gate] → createBooking
  │
  ├──EVENTS──► Events Agent [gemini-flash-preview]
  │              Tools: searchEvents, checkTickets
  │                     proposeTicket → [HITL Gate] → stripeCheckout
  │
  ├──TRIP────► Trip Planner Agent [gemini-pro-preview]
  │              Tools: buildItinerary, optimizeRoute (Google Directions)
  │                     proposePlan → [HITL Gate] → saveTripItems
  │
  └──GENERAL─► Knowledge Agent [gemini-flash-preview]
                 Tools: searchNeighborhoods (RAG), getFAQ
  │
  ▼
SSE Response Stream → Frontend
  • text chunks (natural language)
  • data-apartment-card / data-event-card / data-map-pin
  • workflow.suspended → HITL approval UI
  • workflow.end → done state
```

### Production Readiness Checklist

- Token cost controls: Per-user budget tracked in `ai_runs` table (already logging). Add `daily_token_limit` column; check before each request.
- Rate limiting: Already implemented (10 AI/min, 30 search/min in edge functions). Carry this into Mastra tools via middleware.
- Memory isolation: Per-user `resourceId = auth.uid()` in Mastra memory config. Never mix threads across users.
- Hallucination guards: Tools must be grounded — never allow agent to invent listing data. `toModelOutput` transforms only verified DB results.
- Workflow recovery: Every step idempotent. `runId` stored in Supabase `agent_jobs`. `createRun({ runId })` for resumability.
- Gemini tool calling: Mastra's compatibility layer already reduces error rate to 3% — no additional configuration needed.

---

## Section 6: Production Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| AI hallucination in booking flows | High | Critical | Tool-grounded only — agent cannot invent listings. HITL for all money actions. `toModelOutput` strips free-form fabrication. |
| Token costs blowout | Medium | High | Per-user daily budget in `ai_runs`. Observational Memory reduces tokens 3-40x. Router uses cheap Gemini Lite for classification. |
| Gemini tool calling silent failures | Medium (mitigated) | High | Mastra's tool compatibility layer embeds constraints in descriptions. Error rate now 3%. Monitor via Langfuse. |
| Memory isolation breach | Low | Critical | `resourceId = auth.uid()` namespacing. Supabase RLS on all underlying tables. Never share thread IDs across users. |
| Workflow deadlock (suspended indefinitely) | Medium | High | Timeout on all suspend steps (24h max). Admin override endpoint. `agent_jobs` table shows all suspended runs for ops team. |
| Browser agent blocking | High | Medium | HyperAgent stealth mode. User-agent rotation. Residential proxy (Hyperbrowser Cloud). Fallback to non-scraping data sources. |
| Concurrent booking oversell | Medium | High | Supabase row-level lock on availability check + insert (already designed for ticket system). Idempotency key on booking create. |
| WhatsApp rate limiting | Medium | Medium | Infobip handles Meta rate limits. Queue outbound messages in Supabase with exponential backoff retry. |
| HITL approval expiry | Low | Medium | Suspend payloads include expiry timestamp. Frontend shows countdown. Expired runs auto-bail and notify user to restart. |
| Observational Memory observer cost | Low | Low | Observer runs async (not in critical path). Langfuse monitors observer token spend separately. |

---

## Section 7: Implementation Roadmap for mdeai

### Phase 1 — Ship Now (this week)

1. **Switch ai-router edge function to Mastra Agent Network** — replace raw Gemini call with Mastra routing agent. Use `gemini-flash-lite-preview` (cheap). Map existing EXPLORE/BOOK/TRIP/SEARCH/MEMORY/GENERAL intents to specialist agents.

2. **Enable Observational Memory on rental agent** — replace current conversation history pass-through with `Memory({ observationalMemory: true })`. Per-user `resourceId = auth.uid()`. Immediate: users' apartment preferences persist across sessions.

3. **Add `text-embedding-004` to `ai-embed` edge function** — switch from current embedding model to Google's `text-embedding-004` (consistent with Gemini ecosystem, free on Vertex AI tier).

4. **Implement Mastra tool compatibility layer** — already included in Mastra core, but ensure all `createTool` definitions embed Zod constraints in descriptions for Gemini.

### Phase 2 — Next Sprint (2 weeks)

5. **Wire HITL for booking confirmation** — add suspend/resume to booking workflow. Frontend `ApprovalGate` component. Store `runId` in `agent_jobs` table.

6. **Build pgvector + PostGIS hybrid search tool** — `searchApartments` Mastra tool using the hybrid SQL query (70% semantic + 30% proximity). Replace current edge function implementation.

7. **WhatsApp agent via Mastra** — three-step Mastra workflow: classify intent → generate response → segment into short messages (Infobip pattern). Deploy Mastra WhatsApp workflow.

8. **Langfuse observability** — connect Mastra telemetry to Langfuse. Track per-agent token spend, latency, and tool call success rates.

### Phase 3 — 30 days

9. **Agent browser for listing scraping** — HyperAgent with Gemini + Zod schemas scraping competitor listings nightly. Results stored in `competitor_listings` table for pricing intelligence.

10. **Sponsor ROI agent** — Gemini Pro reasoning over event analytics. Brand-fit scoring. ROI projection with confidence intervals.

11. **Agentic RAG for neighborhood knowledge** — embed neighborhood guides, transit maps, safety reports. Category-filtered retrieval. Source citations in responses.

12. **Trigger.dev integration** — wrap Mastra workflows in Trigger.dev tasks for durable execution + retry on WhatsApp agent and embedding refresh jobs.

### Phase 4 — 90 days (advanced)

13. **Full operational AI team** — four background agents: embedding-refresher, lead-nurture-scheduler, analytics-summarizer, anomaly-detector.

14. **Graph RAG for related listings** — connect listing nodes by neighborhood, price range, host. Multi-hop retrieval: "apartments similar to #A123 but with pool."

15. **Persistent travel planner** — full `ai-trip-planner` upgrade with Mastra workflow checkpointing. Iterative plan refinement over multiple sessions using observational memory.

16. **A2A agent protocol** — expose specialist agents via standard A2A endpoints. Enables third-party integrations and white-label concierge.

---

## Section 8: Best Repos Ranked by mdeai ROI

| Rank | URL | One-line Summary | Score | Highest-Value Idea to Steal | Effort |
|------|-----|-----------------|-------|-----------------------------|--------|
| 1 | github.com/mastra-ai/mastra | Core framework — everything else builds on this | 95 | Observational Memory for per-user concierge context | S (already using) |
| 2 | github.com/ataschz/tanstack-start-mastra-example | Nearest working travel concierge to mdeai | 92 | `MessagePartRenderer` → inline card protocol | S |
| 3 | github.com/assistant-ui/mastra-hitl | Multi-gate HITL with editable approval UI | 90 | `plan-approval.tsx` → booking confirmation card | S |
| 4 | github.com/ssdeanx/AgentStack | Enterprise multi-agent with Mastra, 25 specialists | 88 | Supervisor network pattern + Langfuse wiring | M |
| 5 | github.com/mastra-ai/mastra-observational-memory-workshop | OM workshop — implementation examples | 88 | Full OM setup code (Observer+Reflector config) | S |
| 6 | github.com/supabase-community/chatgpt-your-files | Production Supabase RAG with RLS | 85 | HNSW index + trigger-based embedding pattern | S |
| 7 | github.com/mastra-ai/template-deep-research | Research HITL with iterative refinement loop | 85 | Reject-and-refine loop for property search | M |
| 8 | github.com/AmitxParmar/ai-agent | Mastra + Supabase + Gemini multi-agent RAG | 87 | Query classifier → category-filtered pgvector | S |
| 9 | github.com/bitsandbrainsai/agentic-rag-n8n-ingestion-pipeline | Event-driven agentic RAG ingestion | 80 | DB trigger → auto-embed new listings pattern | M |
| 10 | github.com/mem0ai/mem0 | Universal memory layer with per-user namespacing | 82 | `user_id` filter pattern (maps to `auth.uid()`) | S |
| 11 | github.com/openclaw/openclaw | Personal AI OS for 24+ messaging channels | 78 | Per-channel agent isolation for WhatsApp leads | L |
| 12 | github.com/mastra-ai/template-deep-research | HITL research workflow template | 85 | `evaluateResultTool` relevance scoring | S |
| 13 | github.com/hyperbrowserai/HyperAgent | Production browser agent with Gemini + Zod | 75 | Zod output schema for structured listing extraction | M |
| 14 | github.com/ideamans/mastra-ai-agent-batch-example | Mastra + Playwright MCP batch processing | 76 | Batch loop + Sheets queue for listing refresh | M |
| 15 | github.com/supavec/supabase-ai | TypeScript SDK for Supabase pgvector RAG | 75 | Cosine similarity threshold pattern (0.6-0.8 floor) | S |
| 16 | github.com/abhi1693/openclaw-mission-control | Agent orchestration dashboard with approval flows | 72 | Approval trail attached to work items | L |
| 17 | github.com/tubone24/a2a_mastra | A2A multi-agent with REST + native protocol | 70 | Gateway→workers discovery pattern | M |
| 18 | github.com/josstei/maestro-orchestrate | 39-specialist multi-runtime orchestrator | 74 | Express (1 specialist) vs Standard (4-phase) routing | M |
| 19 | github.com/blaxel-templates/template-mastra-ts | Production Blaxel deployment template | 70 | `blaxel.toml` deployment config pattern | S |
| 20 | github.com/TechWithTy/gemini-stream | Gemini Live API streaming SSE with typed hooks | 68 | `useGeminiStream` hook pattern for multimodal | M |
| 21 | github.com/matrixorigin/Memoria | Git-versioned memory for AI agents | 68 | Auditable memory change history for compliance | L |
| 22 | github.com/browser-use/browser-use | Python browser AI agent | 72 | Action caching for replay without LLM calls | L |
| 23 | github.com/JackChen-me/open-multi-agent | Goal → DAG auto-orchestration | 65 | Auto-DAG for complex multi-step trip planning | L |
| 24 | github.com/KishorNaik/Sol_Mastra_AI_Demo_Google_Gemini | Minimal Mastra + Gemini CRUD agent | 62 | Reference for createTool + Gemini API key config | S |
| 25 | github.com/BunsDev/mastra-starter | Basic Mastra starter template | 45 | Scaffolding reference only | S |

**Effort key:** S = Small (1-2 days), M = Medium (3-7 days), L = Large (1-3 weeks), XL = Extra Large (1+ month)

---

*Research conducted 2026-05-11. All scores reflect relevance to mdeai.co's specific stack (Vite+React+Supabase+Mastra+Gemini) and product verticals (rentals, events, concierge). Framework version referenced: Mastra 1.x (January 2026 release). GitHub star counts as of research date.*
