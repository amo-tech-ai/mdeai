# Mastra Ecosystem — Complete Strategic Report
*Date: 2026-05-11 | For: mdeai.co | 44 repos surveyed across 2 research passes*

---

## Executive Summary

Three structural findings emerge from surveying 44 repos across the Mastra ecosystem in May 2026:

**1. The stack has converged.** Production Mastra apps look the same: Agent Network for routing → specialist agents per domain → typed Workflows for anything with ≥4 steps → Observational Memory for per-user context → `data-*` SSE chunks for inline UI. mdeai already has most of this; the gaps are the supervisor routing layer and the HITL UI components.

**2. mdeai's architecture is confirmed correct.** `p-meier/mastra-claw` is the only public repo combining Mastra + Supabase + RLS + pgvector + multi-agent bindings routing + HITL approval UI — and it looks almost identical to what mdeai should be. The propose-only AI contract (AI proposes, human confirms, system executes) is now the ecosystem default, not mdeai-specific.

**3. The highest-ROI work is small.** Eight Tier 1 improvements (inline tool cards, HITL ticket gate, topic/PII guard processors, thread title generation, 3-layer memory, account-scoped tools, Observational Memory, PostGIS+pgvector hybrid search) are each 1-2 days of work and collectively transform the quality of the agent experience. None require new infrastructure.

**Top 5 to ship this week:**
1. Enable Mastra Observational Memory on concierge agent — persists user preferences across sessions, 3-40x cheaper than naive history
2. Wire HITL gate on ticket purchase: `proposeTicketPurchaseTool` → approval card → `executeTicketPurchaseTool`
3. Supervisor routing agent: router (Gemini Flash Lite) delegates to rental / events / trip / general specialists
4. Add topic guard + PII guard processors to the chat input/output pipeline
5. Switch to `text-embedding-004` (Google's embedding model, consistent with Gemini ecosystem)

---

## Part 1: Master Comparison Table (44 repos)

### Tier A — Direct mdeai value (score ≥ 85)

| Repo | Category | Stack | Agents | HITL | Memory | RAG | Score |
|------|----------|-------|--------|------|--------|-----|-------|
| [mastra-ai/personal-assistant-example](https://github.com/mastra-ai/personal-assistant-example) | Full assistant | Mastra+MCP+Telegram | 1 + MCP tools | No | Working+Semantic | No | 95 |
| [mastra-ai/mastra](https://github.com/mastra-ai/mastra) | Core framework | TS, Node 22 | Multi | Suspend/resume | 4-layer OM | Yes | 95 |
| [assistant-ui/mastra-hitl](https://github.com/assistant-ui/mastra-hitl) | HITL reference | Mastra+assistant-ui | 1 (multi-gate) | Yes (3-gate) | LibSQL | No | 94 |
| [p-meier/mastra-claw](https://github.com/p-meier/mastra-claw) | Enterprise platform | Mastra+Supabase+Next.js | Multi+bindings | Yes (per-tool) | Supabase pg+pgvector | Yes | 93 |
| [mastra-ai/mastra-triage](https://github.com/mastra-ai/mastra-triage) | Routing/triage | Mastra Cloud | 2 (classify+score) | No | State | No | 92 |
| [ataschz/tanstack-start-mastra-example](https://github.com/ataschz/tanstack-start-mastra-example) | Travel AI starter | TanStack+Mastra+Gemini | 3 (router+2 spec) | No | LibSQL | No | 92 |
| [ssdeanx/AgentStack](https://github.com/ssdeanx/AgentStack) | Enterprise multi-agent | Next.js+Mastra+LibSQL | 25+ | Suspend/resume | LibSQL+HNSW | Yes | 88 |
| [mastra-ai/mastra-observational-memory-workshop](https://github.com/mastra-ai/mastra-observational-memory-workshop) | Memory workshop | TS+Mastra | Observer+Reflector | No | Observational | Semantic | 88 |
| [mastra-ai/workshops](https://github.com/mastra-ai/workshops) | 10 workshop examples | TS+Mastra | Multi patterns | No | Observational | No | 87 |
| [AmitxParmar/ai-agent](https://github.com/AmitxParmar/ai-agent) | Mastra+Supabase RAG | TS+Mastra+Supabase+Hono | 3 (classify+RAG+resp) | No | pgvector | Yes | 87 |
| [dgalarza/mastra-meeting-assistant](https://github.com/dgalarza/mastra-meeting-assistant) | Meeting assistant | Mastra+Cal.com+Slack | 1+webhooks | No | 3-layer | Yes (Exa) | 86 |
| [supabase-community/chatgpt-your-files](https://github.com/supabase-community/chatgpt-your-files) | Production RAG | Next.js+Supabase+pgvector | 1 | No | pgvector+RLS | Yes | 85 |
| [mastra-ai/template-deep-research](https://github.com/mastra-ai/template-deep-research) | HITL research | TS+Mastra+Exa | 2 (research+report) | Yes (explicit) | State | Yes (Exa) | 85 |
| [laoposkj/mastra-agentic-rag](https://github.com/laoposkj/mastra-agentic-rag) | Agentic RAG | TS+Mastra+LibSQL | 1+ragTool | No | LibSQL+vector | Yes | 85 |

### Tier B — High value, some adaptation needed (75–84)

| Repo | Category | Stack | Score |
|------|----------|-------|-------|
| [bitsandbrainsai/agentic-rag-n8n-ingestion-pipeline](https://github.com/bitsandbrainsai/agentic-rag-n8n-ingestion-pipeline) | RAG ingestion pipeline | n8n+Supabase+pgvector | 80 |
| [mem0ai/mem0](https://github.com/mem0ai/mem0) | Universal memory layer | Python+Node, multi-backend | 82 |
| [Array-Ventures/coworker](https://github.com/Array-Ventures/coworker) | AI coworker platform | Mastra+WhatsApp+Inngest | 82 |
| [DarkNoah/aime-chat](https://github.com/DarkNoah/aime-chat) | Desktop AI with RAG+cron | Electron+Mastra | 78 |
| [openclaw/openclaw](https://github.com/openclaw/openclaw) | Personal AI OS | TS+Node, 24+ channels | 78 |
| [smthomas/mastra-claw-workshop](https://github.com/smthomas/mastra-claw-workshop) | Multi-agent harness | Mastra+workshop | 74 |
| [josstei/maestro-orchestrate](https://github.com/josstei/maestro-orchestrate) | 39-specialist orchestrator | Node+TOML+multi-LLM | 74 |
| [mastra-ai/ai-buddies](https://github.com/mastra-ai/ai-buddies) | Multi-agent showcase | TS+Mastra | 72 |
| [mastra-ai/template-browsing-agent](https://github.com/mastra-ai/template-browsing-agent) | Browser automation | TS+Mastra+Stagehand | 62 |
| [hyperbrowserai/HyperAgent](https://github.com/hyperbrowserai/HyperAgent) | Production browser AI | TS+Playwright+CDP | 75 |
| [ideamans/mastra-ai-agent-batch-example](https://github.com/ideamans/mastra-ai-agent-batch-example) | Batch browser+Mastra | TS+Mastra+Playwright MCP | 76 |
| [supavec/supabase-ai](https://github.com/supavec/supabase-ai) | Supabase pgvector SDK | TS+Supabase+pgvector | 75 |
| [abhi1693/openclaw-mission-control](https://github.com/abhi1693/openclaw-mission-control) | Agent dashboard | TS+OpenClaw | 72 |
| [tubone24/a2a_mastra](https://github.com/tubone24/a2a_mastra) | A2A multi-agent | TS+Mastra+Bedrock | 70 |

### Tier C — Reference only (< 75)

| Repo | Category | Score |
|------|----------|-------|
| [KishorNaik/Sol_Basic_Hotel_Booking_Assistant_Mastra_AI_Google_Gemini](https://github.com/KishorNaik/Sol_Basic_Hotel_Booking_Assistant_Mastra_AI_Google_Gemini) | Hotel booking (Gemini) | 68 |
| [TechWithTy/gemini-stream](https://github.com/TechWithTy/gemini-stream) | Gemini Live API SSE | 68 |
| [matrixorigin/Memoria](https://github.com/matrixorigin/Memoria) | Git-versioned memory | 68 |
| [blaxel-templates/template-mastra-ts](https://github.com/blaxel-templates/template-mastra-ts) | Blaxel deployment template | 70 |
| [JackChen-me/open-multi-agent](https://github.com/JackChen-me/open-multi-agent) | Goal→DAG auto-orchestration | 65 |
| [mastra-ai/template-coding-agent](https://github.com/mastra-ai/template-coding-agent) | Coding sandbox | 65 |
| [KishorNaik/Sol_Mastra_AI_Demo_Google_Gemini](https://github.com/KishorNaik/Sol_Mastra_AI_Demo_Google_Gemini) | Minimal Gemini+Mastra | 62 |
| [mastra-ai/template-github-review-agent](https://github.com/mastra-ai/template-github-review-agent) | Code review agent | 60 |
| [Calinemesef/mastra-hotel-booking-ai-agent](https://github.com/Calinemesef/mastra-hotel-booking-ai-agent) | Hotel booking prototype | 55 |
| [evilmartians/mastra-coding-agent](https://github.com/evilmartians/mastra-coding-agent) | Coding agent E2B | 55 |
| [Gen-Verse/OpenClaw-RL](https://github.com/Gen-Verse/OpenClaw-RL) | RL training (OpenClaw) | 30 |
| [BunsDev/mastra-starter](https://github.com/BunsDev/mastra-starter) | Basic Mastra starter | 45 |
| [browser-use/browser-use](https://github.com/browser-use/browser-use) | Python browser AI | 72 |

---

## Part 2: Deep Repo Reviews

### 1. [mastra-ai/personal-assistant-example](https://github.com/mastra-ai/personal-assistant-example) — Score 95

**What it is:** Official Mastra personal assistant — MCP-connected tools for Gmail, GitHub, weather, and Hacker News with conversation memory and Telegram delivery.

**Architecture:**
- Single `personalAssistantAgent` with many tools; memory scoped per user thread
- Workflows for multi-step tasks: fetch HN → fetch PRs → combine → deliver daily briefing
- MCP servers as plug-in tool namespaces (not custom-coded tools)
- `src/mastra/agents/` + `src/mastra/tools/` + `src/mastra/workflows/` folder convention

**Ideas to steal for mdeai:**
1. `dailyBriefingWorkflow` — nightly cron fetches new leads + bookings → posts WhatsApp digest to hosts
2. Wrap mdeai Supabase tools as an MCP server so the concierge agent doesn't need custom edge-function glue
3. Port the Telegram adapter pattern → WhatsApp adapter: webhook → channel adapter → agent → reply
4. `todo list tool` (filesystem-backed notes) → working memory scratch pad for the concierge
5. Cal.com webhook trigger → agent researches attendee → posts briefing to host WhatsApp

**Weaknesses:** OpenAI only, no web frontend, no streaming UI components.

---

### 2. [assistant-ui/mastra-hitl](https://github.com/assistant-ui/mastra-hitl) — Score 94

**What it is:** Production-ready HITL agent template using `assistant-ui` React components + Mastra for mandatory approval gates at every execution step.

**HITL architecture — three gates:**
```
Gate 1 (plan): updateTodosTool creates live checklist
               askForPlanApprovalTool → BLOCKS → user edits/approves
Gate 2 (action): proposeEmailTool → shows draft → BLOCKS
                  user approves → sendEmailTool executes
Gate 3 (dynamic): if new tasks arise mid-execution → re-approval triggered
```

**Key components:**
- `plan-approval.tsx` — editable todo checklist that blocks execution
- `human-in-the-loop.tsx` — email draft preview with approve/reject
- `todo.tsx` — real-time status tracker showing in-progress state
- `makeAssistantToolUI()` — type-safe React component per tool, renders inline in chat stream
- Every blocking tool returns `{ approved: boolean }` — clean branching contract

**Ideas to steal:**
1. `proposeTicketPurchaseTool` + `executeTicketPurchaseTool` — exact HITL pattern for mdeai ticket flow
2. `makeAssistantToolUI()` → render `ApartmentCard`, `EventCard`, `MapPin` inline in mdeai chat widget
3. Plan approval pattern → sponsor onboarding: propose campaign plan → sponsor approves → workflow executes
4. `requestInputTool` → concierge pauses when budget/dates missing, asks rather than guessing
5. Real-time todo tracker → trip planning: show itinerary being assembled step-by-step

**Weaknesses:** Anthropic Claude (not Gemini), no Supabase, single-agent only.

---

### 3. [p-meier/mastra-claw](https://github.com/p-meier/mastra-claw) — Score 93

**What it is:** Enterprise-ready personal AI agent on Mastra + Supabase + Next.js — the most architecturally similar public project to mdeai.

**Architecture:**
```
Next.js Server Component → getCurrentUser() → mastraFor(currentUser)
→ Main Agent (orchestrator) → Sub Agents (specialists)
→ Bindings table routes: (channel_type, channel_id) → agent_id
→ Supabase: pgvector + RLS + Vault secrets + Storage workspaces
```

**Standout patterns:**
- `mastraFor(currentUser)` — creates per-user Mastra instance with correct permissions and secrets. Elegant multi-tenancy.
- **Bindings table** — `(channel_type, channel_id) → agent_id` in DB. Adding WhatsApp = one INSERT, no code change.
- **Tool approval buttons** (`tool-approval-buttons.tsx`) — per-tool HITL in the UI. Missing in mdeai.
- **Three paradigms explicitly documented:** skill-based (markdown, for simple Q&A), workflow-based (typed steps, for complex ops), hybrid (agent calls workflow as tool — hides complexity).
- **Compound error table:** 20-step autonomous task at 95%/step accuracy = 35.8% success. Justifies typed workflows.
- Supabase Vault (pgsodium) for encrypted per-user secrets.

**Ideas to steal:**
1. Implement `mastraFor(currentUser)` in mdeai — user-scoped Mastra instance as single pattern for auth boundary
2. Build `channel_bindings` table in Supabase — data-driven channel→agent routing
3. Port `tool-approval-buttons.tsx` → mdeai `FloatingChatWidget` HITL for payment tools
4. Copy Supabase migrations structure — platform schema pattern for versioned changes
5. Use hybrid paradigm explicitly: skill-based for Q&A, typed workflows for trip/ticket

**Weaknesses:** Draft/WIP status. Next.js App Router (mdeai is Vite SPA). No Gemini integration.

---

### 4. [ataschz/tanstack-start-mastra-example](https://github.com/ataschz/tanstack-start-mastra-example) — Score 92

**What it is:** AI travel assistant — Mastra agent network + TanStack Start + Gemini + real-time streaming. Closest full-stack reference to mdeai.

**Architecture:**
```
User → DefaultChatTransport (POST /chat) → networkRoute(routingAgent)
→ routingAgent → delegates to WeatherAgent or DestinationsAgent
→ SSE stream: text + tool-call + network-execution + reasoning events
→ Frontend: switch part.type → MessageResponse / Tool / NetworkExecution / Reasoning
```
- Thread persistence via LibSQL; auto-generated titles via Gemini Flash Lite
- `toAISdkV5Messages()` + `filterDisplayableMessages()` for clean history rendering
- Backend (Mastra) on port 4111, frontend on 3000 — clean separation

**Ideas to steal:**
1. `networkRoute()` → replace mdeai `ai-chat` edge function with Mastra network of 3-4 specialists
2. `part.type` switch → render different React components (text / tool-call / map-pin / card)
3. Auto-generated thread titles → Gemini Flash Lite call after message 1
4. `filterDisplayableMessages()` → hide internal routing messages from user-facing chat history
5. `DefaultChatTransport` → Mastra backend pattern as replacement for direct Supabase edge calls

**Weaknesses:** LibSQL not Supabase, TanStack Start SSR vs Vite SPA, no map integration.

---

### 5. [mastra-ai/mastra-triage](https://github.com/mastra-ai/mastra-triage) — Score 92

**What it is:** Mastra Cloud triage system that auto-classifies GitHub issues, assigns squad labels, estimates effort/impact, and syncs with Discord — dual cron+webhook triggers.

**Architecture:**
- `triageWorkflow`: classify → derive squad → estimate effort/impact → apply labels
- `classificationAgent` + `effortImpactAgent` — separate agents, single-purpose
- Concurrency: 10 parallel syncs in `discordSyncWorkflow`
- Cron + webhook dual trigger (reactive + scheduled)

**Ideas to steal:**
1. `leadTriageWorkflow`: classify lead → score quality → route to host or auto-reply
2. Narrow-agent pattern: separate `classificationAgent` + `scoringAgent` (don't combine into fat agent)
3. Concurrency pattern (10 parallel) → bulk calendar sync for events from Google Calendar
4. Cron+webhook dual trigger → mdeai WhatsApp: webhook on new lead, cron for 48h follow-up

---

### 6. [mastra-ai/workshops](https://github.com/mastra-ai/workshops) — Score 87

**What it is:** 10 workshop examples from the Mastra team covering the full feature surface.

**Standout examples:**
- `examples/04-guardrails` — PII guard + topic guard processors on support agent
- `examples/05-beyond-guardrails` — cost tracker, model router, response enricher, task drift monitor
- `examples/06-enterprise-pipeline` — full input/output pipeline: escalation detection, regex pre-filter, wrap-up enforcer
- `examples/08-multi-agent-networks` — supervisor (`stack-advisor-supervisor.ts`) delegates to `app-recommender`, `operations-reviewer`, `security-reviewer`
- `examples/09-browser-channels-workshop` — browser automation + Mastra channels

**Processor middleware pattern:**
```
Input pipeline: pre-filter → topic-guard → PII-guard → agent
Output pipeline: agent → cost-tracker → response-enricher → client
```

**Ideas to steal:**
1. `topicGuard` processor → if message not about Medellín/rentals/events, redirect gracefully
2. `piiGuard` processor → redact phone numbers, email before logging to `ai_runs`
3. `escalationDetector` → if confidence low or frustration detected, trigger host WhatsApp handoff
4. `DelegationTimeline` component (port Svelte→React) for mdeai admin dashboard
5. Cost tracker processor → feed real token costs into `ai_runs` table per request

---

### 7. [dgalarza/mastra-meeting-assistant](https://github.com/dgalarza/mastra-meeting-assistant) — Score 86

**What it is:** Production meeting assistant — 3-layer memory, Cal.com+Slack webhooks, Exa research, LLM-as-judge scorers.

**3-layer memory architecture:**
```
Episodic:  last 10 messages (fast, cheap, in-thread)
Semantic:  vector search across ALL past conversations (Exa API)
Working:   persistent user profile Markdown updated by agent after each session
```

**Scheduler pattern:** SQLite + 30s polling for follow-up task scheduling.

**Ideas to steal:**
1. Implement mdeai concierge memory with this exact 3-layer pattern:
   - Episodic: last 10 turns
   - Semantic: pgvector recall of past conversations
   - Working: user profile (budget, neighborhoods, dates) — JSON in Supabase `ai_context`
2. Scheduler pattern → lead follow-up: schedule WhatsApp follow-up 48h after lead if no booking
3. Webhook → ChatSDK → agent → channel reply → blueprint for WhatsApp outreach agent
4. LLM-as-judge scorer → lead quality assessment: did agent correctly capture budget and requirements?

---

### 8. [ssdeanx/AgentStack](https://github.com/ssdeanx/AgentStack) — Score 88

**What it is:** Production-grade multi-agent platform: 25+ specialized agents, 57 tools, 12 supervisor networks, 105 UI components, 97% Vitest coverage.

**Key patterns:**
- Supervisor networks with delegation hooks (coordinator selects specialist)
- TanStack Query integration: `useAgentsQuery()`, `useMemoryQuery()` — 1590+ typed hooks
- Langfuse for observability (per-agent token spend, latency, tool call success rates)
- 3072D Gemini embeddings with HNSW indexing
- Dataset + experiment API for iterative agent improvement

**Ideas to steal:**
1. `useAgentsQuery()` / `useMemoryQuery()` TanStack hook pattern → `src/hooks/useMastra.ts`
2. Supervisor network → `conciergeNetwork`: coordinator routes to rental / events / trip agents
3. Langfuse (or Helicone) → connect Mastra telemetry alongside existing `ai_runs` logging
4. Dataset + experiment API → A/B test concierge prompts systematically
5. 97% Vitest coverage standard → add vitest for all Mastra tools in mdeai

---

### 9. [laoposkj/mastra-agentic-rag](https://github.com/laoposkj/mastra-agentic-rag) — Score 85

**What it is:** Agentic RAG starter: agent decides when to call retrieval, two-step pipeline separates retrieval from synthesis.

**Two-step RAG workflow (critical pattern):**
```
Step 1 (retrieve): ragAgent calls ragTool → semantic search → top-K chunks (tools enabled)
Step 2 (synthesize): ragAgent.generate() with toolChoice: 'none' → grounds answer in chunks only
```

The `toolChoice: 'none'` in synthesis is crucial — prevents the model from making additional retrieval calls when it should be composing from what was retrieved. Prevents hallucination.

**Ideas to steal:**
1. Trip planner: Step 1 retrieves attractions/restaurants (tools enabled), Step 2 synthesizes itinerary (`toolChoice: 'none'`)
2. `toolCallAccuracy` scorer → measure whether correct tool was called for each user intent
3. `ingestMarkdown()` pipeline → ingest mdeai's Medellín knowledge base (neighborhoods, attractions) into pgvector
4. LibSQL vector store as fallback during local dev (no pgvector credentials needed for tests)

---

### 10. [Array-Ventures/coworker](https://github.com/Array-Ventures/coworker) — Score 82

**What it is:** Open-source AI coworker with WhatsApp bridge, MCP UI, A2A protocol, Inngest scheduling, Google Workspace integration.

**Standout architecture:**
```
src/mastra/whatsapp/    — WhatsApp bridge (inbound → Mastra agent)
src/mastra/workflows/   — Inngest-scheduled cron workflows
src/mastra/gog/         — Google Workspace (Gmail, Calendar, Docs)
src/mastra/mcp/         — MCP server exposure
```

**Ideas to steal:**
1. Port `src/mastra/whatsapp/` as mdeai's WhatsApp outreach agent foundation
2. A2A protocol → expose mdeai concierge to partner platforms (travel agencies, booking sites)
3. Inngest for scheduling → alternative to Supabase cron for complex multi-step scheduled workflows
4. MCP UI concept → mdeai admin panel: visual tool connection status

---

### 11. [openclaw/openclaw](https://github.com/openclaw/openclaw) — Score 78

**What it is:** Personal AI OS connecting to 24+ messaging platforms (WhatsApp, Telegram, Slack, Discord, iMessage). 247k GitHub stars. Originally Clawdbot, renamed January 2026.

**Architecture:** Local-first gateway as control plane. pnpm workspace, TypeScript/Node. Modular extensions. Per-channel agent isolation with separate workspace and session.

**OpenClaw for mdeai:** Best understood as the channel layer, not the processing layer:
```
WhatsApp → OpenClaw gateway (channel isolation) → Mastra agent (processing) → Infobip reply
```
The per-channel isolation pattern prevents cross-user state leakage in WhatsApp conversations.

**Ideas to steal:**
1. Per-channel agent isolation → WhatsApp leads get a dedicated `lead-nurture-agent` separate from web concierge
2. SOUL.md / AGENTS.md prompt injection → persona consistency across channel types
3. Cron-based automation → lead follow-up scheduling without Trigger.dev dependency
4. Multi-channel unified gateway → mdeai notifications across email, WhatsApp, push

---

### 12. [DarkNoah/aime-chat](https://github.com/DarkNoah/aime-chat) — Score 78

**What it is:** Desktop AI with 10+ LLM providers, RAG knowledge base, cultivation memory (daily cron → preferences Markdown), cron automation, MCP client, WeChat/Telegram bridges.

**Cultivation memory (standout pattern):**
```
Nightly cron → reads recent conversations → deduplicates against existing memories
→ writes to preferences.md, habits.md, project-notes.md
→ agent reads these files as working memory on next session
```

**Ideas to steal:**
1. `cultivationWorkflow` in mdeai: nightly cron scans concierge conversations → extracts user preferences → upsert to user `working_memory` in Supabase
2. Channel bindings table → route WhatsApp messages to the correct agent by context
3. Skill system → concierge skills as markdown files loaded at runtime (`neighborhoods.md`, `event-types.md`)

---

### 13. [AmitxParmar/ai-agent](https://github.com/AmitxParmar/ai-agent) — Score 87

**What it is:** Mastra + Supabase + Google `text-embedding-004` multi-agent RAG with Hono API + Vercel Edge.

**Three-agent RAG pipeline:**
```
Query Classifier → RAG Retriever (category-filtered pgvector) → Response Generator
```

**Key details:**
- `text-embedding-004` (Google's embedding model, Gemini-ecosystem consistent)
- Category-filter on vector search: only search apartments when intent=RENTAL
- Similarity threshold floor at 0.6 — prevents hallucinated near-misses
- Multi-tenant RLS on `document_sections`

**Ideas to steal:**
1. Switch `ai-embed` edge function to `text-embedding-004` (free on Vertex AI tier, Gemini-consistent)
2. Add category filter to pgvector search — prevents cross-vertical contamination
3. Similarity threshold 0.6 floor in `ai-search` → filter out weak matches before sending to LLM

---

### 14. [supabase-community/chatgpt-your-files](https://github.com/supabase-community/chatgpt-your-files) — Score 85

**What it is:** Official Supabase community production MVP for RAG chat over documents. Next.js + Edge Functions + pgvector + GTE-small + RLS.

**Standout patterns:**
- HNSW index with `vector_ip_ops` (negative inner product) — fastest Supabase similarity
- **Trigger-based async embedding:** don't embed at upload time — use DB trigger → async Edge Function
- RLS cascade: parent document ownership cascades to `document_sections`
- Top-5 chunk injection into prompt

**Ideas to steal:**
1. HNSW with `vector_ip_ops` on apartments + events embedding columns → faster search
2. Trigger-based embedding: new listing → DB trigger → `ai-embed` function fires → embedding stored
3. Top-5 chunk injection ceiling in trip planner RAG step

---

### 15. [mastra-ai/template-deep-research](https://github.com/mastra-ai/template-deep-research) — Score 85

**What it is:** AI deep research with explicit HITL approval gates — Research → human review → reject/refine loop → report generation.

**Iterative refinement pattern:**
```
Research step → suspend for human review → user approves or rejects with feedback
→ if rejected: more research with refined query → re-present
→ if approved: synthesis step (toolChoice: 'none')
```

**Ideas to steal:**
1. Rejection-and-refinement loop for apartment search: "not quite right" → agent refines criteria → re-presents
2. `evaluateResultTool` — before returning results to user, score relevance (filter weak results)
3. `extractLearningsTool` — after each search, extract user preference signals for working memory

---

### 16. [hyperbrowserai/HyperAgent](https://github.com/hyperbrowserai/HyperAgent) — Score 75

**What it is:** TypeScript browser AI combining Playwright + CDP. Gemini support built in. Anti-detection stealth mode.

**Two operation modes:**
- `page.perform()` — fast, accessibility tree, 1 LLM call — for competitive scraping
- `page.ai()` — multi-step, visual, for complex UIs

**Ideas to steal:**
1. Zod output schema for structured listing extraction from competitor sites
2. `page.perform()` single-call pattern → competitor rental price scraping (Airbnb, booking.com)
3. Action caching → replay competitive analysis without repeat LLM calls

---

### 17. Hotel booking repos (combined) — Scores 55–68

**[KishorNaik/Sol_Basic_Hotel_Booking_Assistant_Mastra_AI_Google_Gemini](https://github.com/KishorNaik/Sol_Basic_Hotel_Booking_Assistant_Mastra_AI_Google_Gemini)** and **[Calinemesef/mastra-hotel-booking-ai-agent](https://github.com/Calinemesef/mastra-hotel-booking-ai-agent)**

Both confirm: Gemini + Mastra works out of the box, account-ID-scoped tools are the right pattern, and a multi-step booking conversation (search → present options → book) can be prototyped in hours.

**Ideas to steal:**
1. Account-ID-scoped tool pattern: `search-rentals` always filters by `auth.uid()` at the tool level, not just in agent instructions
2. Strict prompt constraints: "Only discuss Medellín rentals, events, restaurants. Respond in [user's language]."
3. Chronological booking sort (nearest first) as default tool output order

---

## Part 3: Best Architecture Patterns

### Memory Architecture

**Recommended: Mastra Observational Memory (OM)**

Mastra 1.0's OM is the production standard as of Q1 2026:
- Observer agent compresses raw messages into emoji-prioritized observations (🔴/🟡/🟢) at token threshold
- Reflector agent condenses observations when they accumulate
- Append-only prefix = cacheable = 4-10x cost reduction
- **94.87% on LongMemEval** vs 84.23% for RAG-based approaches
- Average 30k context window despite 57M tokens of conversation history

**Storage hierarchy for mdeai:**
```
Per-user thread memory  → Mastra OM with LibSQL (fast, local to Mastra server)
Listing knowledge base  → Supabase pgvector (RLS-enforced, location-aware)
Workflow state          → Supabase Postgres (consistent with rest of mdeai DB)
Observability           → Langfuse or Helicone (traces, token costs, latency)
```

**Thread vs resource memory:**
- `threadId` = per-conversation (one chat session)
- `resourceId` = per-user across all conversations (persistent preferences: "prefers El Poblado, budget $1200/mo")

**Working memory pattern for mdeai:**
```typescript
// Agent uses this as structured scratchpad — updated after each session
const workingMemory = {
  name: user.name,
  budget: '$1200/mo',
  neighborhoods: ['El Poblado', 'Laureles'],
  mustHaves: ['wifi', 'gym'],
  travelDates: { start: '2026-06-01', end: '2026-06-30' },
  leadStatus: 'warm'
}
```

**Three-layer memory table:**
| Layer | What it stores | Scope | Mastra config |
|-------|---------------|-------|--------------|
| Episodic | Last 10 messages | Thread | `lastN: 10` |
| Semantic | Vector search across all past conversations | Global per user | pgvector cosine, `resourceId = auth.uid()` |
| Working | Structured user profile (budget, neighborhoods, dates) | User-persistent | JSON updated by agent post-session |

---

### HITL / Approval Gate Architecture

**Three-gate pattern for mdeai booking flows:**

| Gate | Trigger | Pattern | Resume method |
|------|---------|---------|--------------|
| Soft (search confirmation) | AI finds results | `AIProposalCard` — no suspend | No suspend needed |
| Medium (booking intent) | User wants to book | `workflow.suspend({ bookingSummary })` | `run.resume({ confirmed: true, dates })` |
| Hard (payment) | Stripe charge | Always suspend. Stripe webhook resumes. | `POST /api/workflows/booking/resume` |

**Suspend/resume wiring:**
```typescript
// Backend — step suspends until user confirms
const bookingStep = createStep({
  id: 'confirm-booking',
  resumeSchema: z.object({ dates: z.string(), confirmed: z.boolean() }),
  execute: async ({ resumeData, suspend }) => {
    if (!resumeData?.confirmed) {
      return await suspend({ bookingSummary: await buildSummary() })
    }
    return await createBooking(resumeData)
  }
})

// Frontend — SSE fires 'workflow.suspended' → show card → user confirms → resume
const runId = await startBookingWorkflow(query)
// SSE: workflow.suspended → show <BookingConfirmCard proposal={suspendPayload} />
// User clicks confirm →
await fetch(`/api/mastra/workflows/booking/${runId}/resume`, {
  method: 'POST',
  body: JSON.stringify({ step: 'confirm-booking', resumeData: { confirmed: true } })
})
```

**Landlord approval via email link:**
```
AI drafts lease terms → emails landlord with approve/reject link (signed with STAFF_LINK_SECRET)
→ Link hits edge function → run.resume({ step: 'landlord-approval', resumeData: { approved: true } })
→ Tenant notified
```

---

### Routing & Triage Architecture

**Three-layer routing for mdeai (use all three):**

| Layer | Pattern | Model | Latency |
|-------|---------|-------|---------|
| Intent classification | `classifyIntentTool` | Gemini Flash Lite | ~300ms |
| Network routing | `networkRoute(routingAgent)` with `agents` property | Gemini Flash Lite | ~500ms |
| Channel routing | DB bindings table: `(channel, context) → agent_id` | No LLM | ~5ms |

**Agent network pattern:**
```typescript
const routingAgent = new Agent({
  id: 'mdeai-router',
  model: 'google/gemini-flash-lite-preview', // cheap + fast
  agents: { rentalAgent, eventsAgent, restaurantsAgent, tripsAgent, knowledgeAgent },
  instructions: `
    Route to rentalAgent for apartment/housing requests.
    Route to eventsAgent for events, tickets, nightlife.
    Route to restaurantsAgent for food, dining, cafes.
    Route to tripsAgent for trip planning, itineraries.
    Route to knowledgeAgent for neighborhood info, safety, transit.
  `
})
```

**Escalation pattern:**
```
If specialist returns empty results → router tries adjacent specialist
If confidence < threshold → clarifyIntentTool asks user to specify
If 3 retries fail → suspend + notify support via WhatsApp
```

---

### RAG Architecture

**Agentic RAG vs Static RAG:**
| Scenario | Use Static | Use Agentic |
|----------|-----------|-------------|
| Neighborhood FAQ | ✓ | |
| Transit info | ✓ | |
| Apartment search (multi-criteria) | | ✓ |
| Trip itinerary building | | ✓ |
| Event discovery with refinement | | ✓ |

**pgvector + PostGIS hybrid SQL for apartment search:**
```sql
SELECT a.*,
  1 - (a.embedding <=> $1) AS semantic_score,
  ST_Distance(a.location::geography, $2::geography) AS distance_m
FROM apartments a
WHERE ST_DWithin(a.location::geography, $2::geography, $3)  -- radius first (fast)
  AND 1 - (a.embedding <=> $1) > 0.6                        -- semantic floor
ORDER BY
  (1 - (a.embedding <=> $1)) * 0.7 +
  (1 - LEAST(ST_Distance(a.location::geography, $2::geography) / $3, 1)) * 0.3
LIMIT 10;
```

**Embedding model:** Switch to `text-embedding-004` (Google) — consistent with Gemini ecosystem, free on Vertex AI tier, same team as Gemini.

**Chunking strategy:**
| Content type | Chunk size | Overlap | Include in metadata |
|-------------|-----------|---------|-------------------|
| Apartments | 256 tokens (by section: amenities, location, rules, price) | 32 | neighborhood, price_monthly, bedrooms |
| Events | 512 tokens (one per event — usually short) | 0 | date, venue, neighborhood |
| Neighborhoods | 512 tokens (paragraph chunks) | 64 | neighborhood_name, location coords |
| Restaurants | 256 tokens | 32 | cuisine, price_tier, neighborhood |

---

### Tool Design Patterns

Production patterns confirmed across all repos:

1. **Schema-first with Zod** — every tool has `inputSchema` and `outputSchema`. Mastra's compatibility layer embeds Zod constraints in `description` field for Gemini (Gemini ignores `minLength`/`maxLength` in JSON Schema — constraint lives in the description).

2. **`toModelOutput` for streaming dual output** — raw data for frontend, text for model reasoning:
```typescript
createTool({
  id: 'search-apartments',
  outputSchema: z.array(apartmentSchema),
  execute: async ({ context }) => searchApartments(context),
  toModelOutput: (listings) => ({
    type: 'text',
    text: listings.map(l => `${l.name}: $${l.price}/mo, ${l.bedrooms}BR, ${l.neighborhood}`).join('\n')
  })
})
```

3. **Separate propose and execute tools** — for any tool with side effects:
   - `proposeBookingTool` → shows card, returns `{ proposalId, approved: false }`
   - `executeBookingTool` → runs only if `approved: true` from prior tool

4. **Error as structured return** — `return { success: false, error: 'reason' }`, not thrown exceptions (thrown errors in tool execute break the Mastra agent loop)

5. **User-scoped at tool level** — `auth.uid()` filter in the tool's execute function, not just in agent instructions (defense in depth)

6. **`data-mdeai-actions` SSE protocol** (mdeai-specific, already in use):
```
data-apartment-card: { id, name, price, location, imageUrl }
data-map-pin: { lat, lng, label, color, category }
data-event-card: { id, title, date, venue, ticketUrl }
data-booking-proposal: { apartmentId, dates, totalPrice, confirmed: false }
data-approval-gate: { runId, step, payload }  ← add for HITL
```

---

### Workflow Design Patterns

**The compound error problem** (documented by `p-meier/mastra-claw`):

| Steps | Per-step accuracy | Workflow success rate |
|-------|-----------------|---------------------|
| 5 steps | 95% | 77.4% |
| 10 steps | 95% | 59.9% |
| 20 steps | 95% | 35.8% |

**Lesson:** Use typed Mastra workflows for any process with ≥4 steps. Never let autonomous agent reasoning chain replace a typed workflow for money operations.

**Branching pattern for mdeai:**
```
User message → Router (Gemini Flash Lite, ~300ms)
  ┌─ RENTAL → searchApartments → rankResults → proposeBooking → [HITL] → createBooking
  ├─ EVENTS → searchEvents → checkAvailability → proposeTicket → [HITL] → stripeCheckout
  ├─ TRIP   → parseItinerary → optimizeRoute → proposePlan → [HITL] → saveTripItems
  └─ GENERAL → knowledgeBaseRAG (toolChoice: 'none') → respond
```

**Error recovery:**
- Every step: idempotent (safe to retry)
- Workflow: `maxRetries: 3` per step before escalating
- Human escalation: if 3 retries fail, suspend + notify support
- Long workflow checkpointing: trip planner checkpoints after each day planned; `runId` stored in `agent_jobs`

---

## Part 4: Real-World AI Product Ideas for mdeai

### 1. AI Rental Concierge (Autonomous with HITL)
**Workflow:** Intent classification → semantic + PostGIS search → inline listing cards → HITL booking confirmation → Stripe payment → WhatsApp/email confirmation
**Agents:** router (Gemini Flash Lite) → rental-agent (Gemini Flash Preview) → booking-workflow (HITL)
**Business model:** Lead capture for property owners, booking commission, premium listing placement
**Tech:** Mastra agent network + Supabase pgvector + PostGIS radius filter + Stripe + Infobip WhatsApp + Observational Memory

### 2. Event Discovery & Booking Agent
**Workflow:** Natural language date/genre/budget parsing → event search → ticket availability → propose event card with map pin → HITL ticket purchase → QR delivery
**Agents:** events-agent with `searchEvents`, `checkAvailability`, `proposeTicket` tools
**Business model:** Ticket sales commission, event promotion packages
**Tech:** Events table + pgvector + Stripe + QR signing already implemented

### 3. Sponsor ROI Assistant
**Workflow:** Sponsor inputs brand brief → audience-match scores brand↔contest fit → ROI projection → dashboard → contract proposal → HITL sign-off
**Agents:** brand-match-agent (Gemini Pro) → roi-agent (Gemini Pro) → contract-agent
**Business model:** Sponsorship packages, performance-based pricing
**Tech:** Sponsor profile table + event analytics + Gemini Pro + PDF contract generation

### 4. WhatsApp Lead Nurture Agent
**Workflow:** Infobip webhook → classify lead intent → respond with listings → schedule follow-up cron → escalate hot leads to human agent
**Agents:** chat-agent (warm persona) → segmentation-agent → scheduling-agent
**Business model:** Property manager subscription, lead qualification service
**Tech:** Infobip WABA + Mastra WhatsApp workflow (3-step) + Supabase cron

### 5. Agentic RAG for Local Knowledge (Highest moat)
**Workflow:** User asks about El Poblado safety / metro lines / cost of living → classifier → pgvector search neighborhood docs → PostGIS locates nearest POIs → synthesize with sources
**Agents:** knowledge-agent with `searchNeighborhoods`, `findNearbyPOIs`, `getTransitInfo` tools
**Business model:** Premium feature for relocation packages, expat onboarding
**Tech:** Neighborhood knowledge base embedded in pgvector; PostGIS for POI proximity; trigger-based embedding refresh

### 6. Browser Agent for Listing Scraping
**Workflow:** Cron → HyperAgent navigates competitor listings → Zod-schema extraction → price comparison → alert if mdeai listings not competitive → suggest price adjustment
**Agents:** scraper-agent (HyperAgent + Gemini) → pricing-agent → notification-agent
**Business model:** Data advantage, dynamic pricing recommendations for landlords
**Tech:** HyperAgent (TS) + Gemini + Zod schemas + stealth mode

### 7. AI Operational Team (Background Workers)
**Four always-running agents:**
- Embedding-refresher: watches `apartments` table for changes, re-embeds on update (Supabase webhook trigger)
- Lead-nurture-scheduler: fires follow-up messages at optimal times (Trigger.dev cron)
- Analytics-summarizer: weekly digest for property managers (WhatsApp + email)
- Anomaly-detector: flags unusual booking patterns, potential fraud

### 8. Persistent Travel Planner
**Workflow:** User describes trip → agent builds multi-day itinerary → proposes day-by-day plan → user edits → agent optimizes route → saves to `trips` table → shares link
**Agents:** planner-agent (Gemini Pro, multi-day reasoning) → optimizer-agent (Google Routes API)
**Business model:** Premium planning service, affiliate revenue from bookings in itinerary
**Tech:** `ai-trip-planner` edge function upgraded to Mastra workflow with Observational Memory for iterative refinement

---

## Part 5: Recommended mdeai Architecture

### Frontend — Streaming SSE Protocol

```typescript
// Extended part.type switch for mdeai FloatingChatWidget
switch (part.type) {
  case 'text':                return <TextBubble content={part.text} />
  case 'data-apartment-card': return <ApartmentCardInline listing={part.data} />
  case 'data-event-card':     return <EventCardInline event={part.data} />
  case 'data-restaurant-card':return <RestaurantCardInline restaurant={part.data} />
  case 'data-map-pin':        return null  // → addPin() on Google Maps instance
  case 'data-approval-gate':  return <ApprovalGate proposal={part.data} onApprove={resume} />
  case 'workflow.suspended':  return <BookingConfirmCard runId={part.runId} />
  case 'data-network':        return <DelegationStatus step={part.agent} />  // optional admin
}
```

### Backend Orchestration

```
User Message (Vite SPA)
  │ POST /api/chat (Mastra streaming endpoint)
  ▼
Router Agent [gemini-flash-lite, ~300ms]
  Reads: intent, channel, user session
  Routes: RENTAL | EVENTS | TRIP | RESTAURANTS | GENERAL | SUPPORT
  │
  ├─ RENTAL ──► Rental Agent [gemini-flash-preview]
  │               Tools: searchApartments (pgvector+PostGIS), checkAvailability
  │               Propose → [HITL Gate] → booking-workflow
  │
  ├─ EVENTS ──► Events Agent [gemini-flash-preview]
  │               Tools: searchEvents, checkTickets, proposeTicket
  │               Propose → [HITL Gate] → stripeCheckout-workflow
  │
  ├─ TRIP ────► Trip Planner Agent [gemini-pro-preview]
  │               Tools: buildItinerary, optimizeRoute (Google Directions)
  │               Propose → [HITL Gate] → saveTripItems-workflow
  │
  ├─ RESTAURANTS ► Restaurants Agent [gemini-flash-preview]
  │               Tools: searchRestaurants, getMenu
  │
  └─ GENERAL ──► Knowledge Agent [gemini-flash-preview]
                  Tools: searchNeighborhoods (RAG), getFAQ
                  toolChoice: 'none' in synthesis step
  │
  ▼
SSE Response Stream → Frontend (data-mdeai-actions protocol)
```

### Mastra Configuration

```typescript
import { Mastra } from '@mastra/core'
import { Memory } from '@mastra/memory'
import { PostgresStore } from '@mastra/pg'
import { LibSQLStore } from '@mastra/libsql'

export const mastra = new Mastra({
  agents: { routerAgent, rentalAgent, eventsAgent, tripsAgent, knowledgeAgent },
  // Workflow state + long-term storage: Supabase Postgres
  storage: new PostgresStore({ connectionString: process.env.SUPABASE_DB_URL }),
  // Per-user Observational Memory: LibSQL (fast, local to Mastra process)
  memory: new Memory({
    storage: new LibSQLStore({ url: process.env.TURSO_URL ?? 'file:./memory.db' }),
    vector: new PgVector({ connectionString: process.env.SUPABASE_DB_URL }),
    options: { observationalMemory: true, lastN: 10 }
  }),
  // Telemetry: feed into ai_runs table + optional Langfuse
  telemetry: { enabled: true }
})

// Per-user scoping pattern (from p-meier/mastra-claw)
export function mastraFor(userId: string) {
  return mastra.withContext({ resourceId: userId })
}
```

---

## Part 6: Production Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| AI hallucination in booking flows | High | Critical | Tool-grounded only. `toModelOutput` strips free-form. HITL for all money actions. |
| Token costs blowout | Medium | High | Per-user daily budget in `ai_runs`. OM reduces 3-40x. Router uses Gemini Lite. |
| Gemini tool calling silent failures | Low (mitigated) | High | Mastra's compatibility layer embeds constraints in descriptions. Error rate: 3%. Monitor via Langfuse. |
| Memory isolation breach | Low | Critical | `resourceId = auth.uid()`. Supabase RLS on all tables. Never share thread IDs. |
| Workflow deadlock (suspend indefinitely) | Medium | High | 24h timeout on all suspend steps. Admin override endpoint. `agent_jobs` table shows all suspended runs. |
| Browser agent blocking | High | Medium | HyperAgent stealth mode. UA rotation. Fallback to non-scraping data sources. |
| Concurrent booking oversell | Medium | High | Supabase row-level lock on availability + insert. Idempotency key on booking create. |
| WhatsApp rate limiting | Medium | Medium | Infobip handles Meta limits. Queue outbound in Supabase with exponential backoff. |
| Observational Memory observer cost | Low | Low | Observer runs async (not in critical path). Monitor observer token spend separately. |
| HITL approval expiry | Low | Medium | Suspend payloads include expiry timestamp. Expired runs auto-bail with user notification. |

---

## Part 7: Implementation Roadmap

### Phase 1 — This Week (1-2 days each)

1. **Enable Observational Memory on concierge agent** — `Memory({ observationalMemory: true })`, `resourceId = auth.uid()`. Users' apartment preferences persist across sessions.
2. **HITL gate on ticket purchase** — `proposeTicketPurchaseTool` + `executeTicketPurchaseTool`. Frontend `<ApprovalGate>` component. `runId` stored in `agent_jobs`.
3. **Topic guard + PII guard processors** — on chat input pipeline. Topic: only Medellín/mdeai content. PII: redact phone/email before `ai_runs` logging.
4. **Switch to `text-embedding-004`** in `ai-embed` edge function — Gemini-ecosystem embedding consistency.
5. **Auto-generated thread titles** — Gemini Flash Lite call after first message → persist to `conversations.title`.

### Phase 2 — Next Sprint (3-7 days each)

6. **Supervisor routing agent** — Mastra Agent Network with `routingAgent` delegating to 4 specialists. Replace current `ai-router` intent pattern-match with LLM routing.
7. **pgvector + PostGIS hybrid search** — `searchApartments` Mastra tool with 70% semantic + 30% proximity SQL. Category filter (0.6 floor) prevents cross-vertical contamination.
8. **WhatsApp agent** — 3-step Mastra workflow: classify intent → generate response → send via Infobip. `mastraFor(userId)` scoping.
9. **`mastraFor(currentUser)` pattern** — user-scoped Mastra instance as the single auth boundary pattern for all chat routes.

### Phase 3 — 30 Days

10. **Browser agent for listing scraping** — HyperAgent + Gemini + Zod schemas scraping competitor listings nightly. Results in `competitor_listings` for pricing intelligence.
11. **Sponsor ROI agent** — Gemini Pro over event analytics. Brand-fit scoring. ROI projection with confidence intervals.
12. **Agentic RAG for neighborhood knowledge** — embed neighborhood guides, transit maps, safety reports. Category-filtered retrieval with source citations.
13. **Langfuse observability** — connect Mastra telemetry. Track per-agent token spend, latency, tool call success rates. Feed costs into `ai_runs`.

### Phase 4 — 90 Days (Advanced)

14. **Full operational AI team** — 4 background agents: embedding-refresher, lead-nurture-scheduler, analytics-summarizer, anomaly-detector. Trigger.dev for durable execution.
15. **Two-step RAG synthesis** in trip planner — retrieve (tools enabled) → synthesize (`toolChoice: 'none'`). Prevents hallucination in itinerary composition.
16. **A2A agent protocol** — expose specialist agents via standard A2A endpoints. Enables third-party integrations and white-label concierge.
17. **Dataset + experiment API** — systematic A/B testing of concierge prompts via Langfuse experiments.

---

## Part 8: Final Ranked List — Best Repos by mdeai ROI

| Rank | Repo | Summary | Score | Highest-Value Idea | Effort |
|------|------|---------|-------|--------------------|--------|
| 1 | [mastra-ai/mastra](https://github.com/mastra-ai/mastra) | Core framework | 95 | Observational Memory for per-user concierge context | S (already using) |
| 2 | [mastra-ai/personal-assistant-example](https://github.com/mastra-ai/personal-assistant-example) | Full assistant with MCP+memory | 95 | Daily briefing workflow → host WhatsApp digest | S |
| 3 | [assistant-ui/mastra-hitl](https://github.com/assistant-ui/mastra-hitl) | Multi-gate HITL approval UI | 94 | `plan-approval.tsx` → booking confirmation card | S |
| 4 | [p-meier/mastra-claw](https://github.com/p-meier/mastra-claw) | Mastra+Supabase+RLS enterprise | 93 | `mastraFor(currentUser)` + `channel_bindings` table | M |
| 5 | [mastra-ai/mastra-triage](https://github.com/mastra-ai/mastra-triage) | Routing/triage workflow | 92 | Lead triage workflow pattern | S |
| 6 | [ataschz/tanstack-start-mastra-example](https://github.com/ataschz/tanstack-start-mastra-example) | Nearest travel concierge to mdeai | 92 | `MessagePartRenderer` → inline card protocol | S |
| 7 | [ssdeanx/AgentStack](https://github.com/ssdeanx/AgentStack) | 25-agent enterprise + Langfuse | 88 | Supervisor network + Langfuse wiring | M |
| 8 | [mastra-ai/mastra-observational-memory-workshop](https://github.com/mastra-ai/mastra-observational-memory-workshop) | OM setup examples | 88 | Full Observer+Reflector config | S |
| 9 | [mastra-ai/workshops](https://github.com/mastra-ai/workshops) | 10 feature workshops | 87 | Topic guard + PII guard processors | S |
| 10 | [AmitxParmar/ai-agent](https://github.com/AmitxParmar/ai-agent) | Mastra+Supabase+Gemini RAG | 87 | `text-embedding-004` + category-filtered pgvector | S |
| 11 | [dgalarza/mastra-meeting-assistant](https://github.com/dgalarza/mastra-meeting-assistant) | 3-layer memory + webhook adapter | 86 | 3-layer memory config + scheduler pattern | S |
| 12 | [supabase-community/chatgpt-your-files](https://github.com/supabase-community/chatgpt-your-files) | Production Supabase RAG | 85 | HNSW `vector_ip_ops` + trigger-based embedding | S |
| 13 | [mastra-ai/template-deep-research](https://github.com/mastra-ai/template-deep-research) | HITL research + refinement loop | 85 | Reject-and-refine for property search | M |
| 14 | [laoposkj/mastra-agentic-rag](https://github.com/laoposkj/mastra-agentic-rag) | Two-step RAG pipeline | 85 | `toolChoice: 'none'` synthesis step | S |
| 15 | [mem0ai/mem0](https://github.com/mem0ai/mem0) | Universal memory layer | 82 | `user_id` filter namespacing pattern | S |
| 16 | [Array-Ventures/coworker](https://github.com/Array-Ventures/coworker) | AI coworker + WhatsApp bridge | 82 | WhatsApp bridge source code | M |
| 17 | [bitsandbrainsai/agentic-rag-n8n-ingestion-pipeline](https://github.com/bitsandbrainsai/agentic-rag-n8n-ingestion-pipeline) | Event-driven RAG ingestion | 80 | DB trigger → auto-embed new listings | M |
| 18 | [DarkNoah/aime-chat](https://github.com/DarkNoah/aime-chat) | Cultivation memory + cron agents | 78 | Nightly cultivation workflow | M |
| 19 | [openclaw/openclaw](https://github.com/openclaw/openclaw) | 24-channel AI OS | 78 | Per-channel agent isolation | L |
| 20 | [ideamans/mastra-ai-agent-batch-example](https://github.com/ideamans/mastra-ai-agent-batch-example) | Batch browser + Mastra | 76 | Batch loop for listing refresh | M |
| 21 | [supavec/supabase-ai](https://github.com/supavec/supabase-ai) | pgvector SDK | 75 | Cosine similarity threshold 0.6 floor | S |
| 22 | [hyperbrowserai/HyperAgent](https://github.com/hyperbrowserai/HyperAgent) | Production browser AI + Gemini | 75 | Zod output schema for listing extraction | M |
| 23 | [smthomas/mastra-claw-workshop](https://github.com/smthomas/mastra-claw-workshop) | Multi-agent harness workshop | 74 | Skills-as-files for concierge | S |
| 24 | [josstei/maestro-orchestrate](https://github.com/josstei/maestro-orchestrate) | 39-specialist multi-runtime | 74 | Express vs Standard routing pattern | M |
| 25 | [mastra-ai/ai-buddies](https://github.com/mastra-ai/ai-buddies) | Multi-agent showcase | 72 | Story-embedder workflow → listing embedder | S |

**Effort key:** S = Small (1-2 days), M = Medium (3-7 days), L = Large (1-3 weeks)

---

## Final Strategic Recommendation

**Closest architectural match:** `p-meier/mastra-claw` — only public repo combining Mastra + Supabase + RLS + pgvector + multi-agent bindings routing + HITL approval UI. Read `ARCHITECTURE.md` before starting any major mdeai refactor.

**Highest ROI in the next 2 weeks:**
1. Observational Memory config (S) → immediately makes concierge remember users across sessions
2. Supervisor routing agent (S) → makes the multi-agent system properly delegating instead of monolithic
3. HITL gate for ticket purchase (S) → closes the Phase 1 gate requirement
4. Topic+PII guard processors (S) → makes production AI safe for real users
5. PostGIS+pgvector hybrid search (M) → makes apartment search dramatically more relevant for location queries

**What NOT to overengineer now:**
- Browser scraping agent — mdeai has Supabase as source of truth, scraping is Phase 3
- A2A protocol — not needed until partner integrations exist
- Dataset/experiment API — valuable only once you have enough conversations to learn from
- Graph RAG — solve simple RAG first, graph adds complexity before there's data to justify it
- 39-specialist supervisor networks (AgentStack scale) — 4-5 specialists is right for mdeai's current products

**Fastest path to revenue impact:**
1. HITL ticket purchase (closes Phase 1 gate → real revenue from events)
2. Observational Memory (increases rental conversion — agent remembers user requirements)
3. WhatsApp lead nurture agent (automates the highest-value manual task in the current product)
