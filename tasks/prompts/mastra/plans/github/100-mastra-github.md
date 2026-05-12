# Mastra Ecosystem — 16 Repo Deep Dive
Date: 2026-05-11

---

## Executive Summary

The 16 repositories surveyed confirm that the Mastra ecosystem has converged on three production patterns that matter for mdeai: **chat-first streaming UIs with tool-call cards rendered inline**, **HITL (Human-in-the-Loop) approval gates as first-class workflow steps**, and **three-layer memory (episodic / semantic / working) as the baseline for any agent worth deploying**. Repositories like `assistant-ui/mastra-hitl`, `ataschz/tanstack-start-mastra-example`, and `p-meier/mastra-claw` prove these patterns are deployable today without experimental APIs.

mdeai's architecture — chat concierge over Supabase/pgvector, Google Gemini as the LLM, streaming SSE, and a propose-only approval contract — is a near-perfect fit for this ecosystem. The main gaps are (1) the UI layer lacks `assistant-ui`-style inline tool cards, (2) the agent network has no explicit supervisor/routing agent separate from the main concierge, and (3) HITL gates for payments and sponsor onboarding are conceptual rather than implemented as interruptible workflow steps. All three are solvable with patterns extracted directly from these repos.

The top 5 ideas to ship immediately: (1) adopt `assistant-ui`'s `makeAssistantToolUI()` for inline tool cards in the chat widget, (2) implement a Mastra HITL approval step for ticket payment confirmation (blocking execution until user confirms), (3) build a supervisor routing agent that dispatches to specialized sub-agents (rentals, events, concierge), (4) port the three-layer memory pattern from `dgalarza/mastra-meeting-assistant` into the mdeai concierge agent, and (5) add processor-based PII/topic guardrails from the workshops examples as an input pipeline on all chat routes.

---

## Master Comparison Table

| # | Repo | Focus | mdeai Use Case | Score |
|---|------|-------|---------------|-------|
| 1 | [mastra-ai/personal-assistant-example](https://github.com/mastra-ai/personal-assistant-example) | MCP tools + memory + daily workflows | Concierge memory, daily briefings, tool integration | 95 |
| 2 | [assistant-ui/mastra-hitl](https://github.com/assistant-ui/mastra-hitl) | HITL approvals + streaming tool cards | Payment gates, sponsor approvals, content moderation | 94 |
| 3 | [mastra-ai/mastra-triage](https://github.com/mastra-ai/mastra-triage) | Intent routing + multi-workflow dispatch | Lead triage, event routing, squad assignment | 92 |
| 4 | [ataschz/tanstack-start-mastra-example](https://github.com/ataschz/tanstack-start-mastra-example) | Agent networks + streaming UI + Gemini | Full-stack reference closest to mdeai's stack | 89 |
| 5 | [mastra-ai/workshops](https://github.com/mastra-ai/workshops) | 10 workshop examples across all Mastra features | Guardrails, memory, multi-agent, browser, harness | 87 |
| 6 | [mastra-ai/ai-buddies](https://github.com/mastra-ai/ai-buddies) | Multi-agent showcase (weather, story, planner) | Agent composition patterns, MCP tool design | 72 |
| 7 | [dgalarza/mastra-meeting-assistant](https://github.com/dgalarza/mastra-meeting-assistant) | 3-layer memory + webhooks + Slack adapter | Per-user memory, webhook ingestion, WhatsApp model | 86 |
| 8 | [DarkNoah/aime-chat](https://github.com/DarkNoah/aime-chat) | Desktop AI with RAG, memory wiki, cron agents | Knowledge base design, cultivation memory, scheduling | 78 |
| 9 | [laoposkj/mastra-agentic-rag](https://github.com/laoposkj/mastra-agentic-rag) | Agentic RAG pipeline + eval scorers | Semantic search over local knowledge for mdeai concierge | 85 |
| 10 | [mastra-ai/template-browsing-agent](https://github.com/mastra-ai/template-browsing-agent) | Stagehand browser automation | Scraping venue data, attraction pages, event listings | 62 |
| 11 | [smthomas/mastra-claw-workshop](https://github.com/smthomas/mastra-claw-workshop) | Multi-agent: browser, memory, skills, workspace | Agent harness pattern, workspace/skills system | 74 |
| 12 | [p-meier/mastra-claw](https://github.com/p-meier/mastra-claw) | Enterprise Mastra+Supabase+Next.js platform | Closest architecture to mdeai (Supabase + Mastra + RLS) | 93 |
| 13 | [Array-Ventures/coworker](https://github.com/Array-Ventures/coworker) | AI coworker with WhatsApp, MCP, skills marketplace | WhatsApp bridge pattern, A2A protocol, cron workflows | 82 |
| 14 | [ssdeanx/AgentStack](https://github.com/ssdeanx/AgentStack) | 25+ agents, 57 tools, 12 supervisor networks | Supervisor network pattern, RAG pipeline, dataset eval | 80 |
| 15 | [KishorNaik/Sol_Basic_Hotel_Booking_Assistant_Mastra_AI_Google_Gemini](https://github.com/KishorNaik/Sol_Basic_Hotel_Booking_Assistant_Mastra_AI_Google_Gemini) | Gemini hotel booking agent | Booking tool pattern with Gemini, prompt engineering | 68 |
| 16 | [Calinemesef/mastra-hotel-booking-ai-agent](https://github.com/Calinemesef/mastra-hotel-booking-ai-agent) | LiteAPI hotel search + booking agent | Multi-step booking conversation flow | 55 |

---

## Individual Repo Reviews

### 1. [mastra-ai/personal-assistant-example](https://github.com/mastra-ai/personal-assistant-example)
**Score: 95/100**

**What it is:** The official Mastra personal assistant reference — MCP-connected tools for Gmail, GitHub, weather, Hacker News, and todo lists with conversation memory and a Telegram bot interface.

**Key features:**
- MCP server integration (Zapier, GitHub, Hacker News)
- Custom tools: weather (open-meteo API), daily workflow summarizer
- Conversation + working memory via `@mastra/memory`
- Daily workflow that fetches news and PR summaries into a single briefing
- Telegram bot as the delivery channel

**Architecture patterns:**
- Single `personalAssistantAgent` with many tools; memory scoped per user thread
- Workflows for multi-step tasks (fetch HN → fetch PRs → combine → deliver)
- MCP servers as plug-in tool namespaces, not custom-coded tools
- `src/mastra/agents/` + `src/mastra/tools/` + `src/mastra/workflows/` folder convention

**mdeai alignment:**
- The Telegram channel pattern mirrors how mdeai's WhatsApp outreach should work
- The daily workflow briefing pattern applies to mdeai's sponsor ROI digest and lead follow-up
- MCP server approach means mdeai could plug in Google Maps, Supabase, or Stripe as MCP namespaces rather than custom edge functions

**Ideas to steal:**
1. Build a `dailyBriefingWorkflow` in mdeai that fetches new leads + event bookings overnight and posts a summary to the host's WhatsApp
2. Wrap mdeai's Supabase tools as an MCP server so the concierge agent can use them without custom glue code
3. Copy the Telegram bot adapter pattern for the WhatsApp outreach agent — same webhook → agent → channel reply model
4. Use the `todo list tool` pattern (filesystem-backed persistent notes) for the concierge's working memory scratch pad
5. Port the daily workflow schedule trigger to Supabase cron for lead reminder emails

**Weaknesses:** Uses OpenAI (not Gemini). No frontend UI — purely CLI/bot-driven. No streaming UI component.

---

### 2. [assistant-ui/mastra-hitl](https://github.com/assistant-ui/mastra-hitl)
**Score: 94/100**

**What it is:** A production-ready HITL (Human-in-the-Loop) agent template using `assistant-ui` for React streaming components and Mastra for agent orchestration — mandatory approval gates at every execution step.

**Key features:**
- `updateTodosTool` — real-time todo list that updates as the agent works
- `askForPlanApprovalTool` — blocks execution until the user approves, rejects, or edits the plan
- `requestInputTool` — agent pauses and asks the user for missing information
- `proposeEmailTool` + `sendEmailTool` — two-step email: preview then send
- `makeAssistantToolUI()` — type-safe React component per tool, renders inline in chat stream
- `firecrawlTool` — web scraping with per-IP rate limits

**Architecture patterns:**
```
User Request → Agent creates todo list → askForPlanApproval (BLOCKS)
→ User approves → execute tasks sequentially
→ For each task: requestInput if needed / proposeEmail → (approval) → sendEmail
→ Real-time todo updates throughout
```
Tools are split into "propose" tools (blocking, UI-rendered) and "execute" tools (run after approval). Every blocking tool returns `{ approved: boolean }`.

**mdeai alignment:**
- This is exactly the HITL pattern needed for mdeai ticket purchases (propose checkout → user approves → execute Stripe charge)
- The `proposeEmail` + `sendEmail` two-step maps to mdeai's lead capture: propose follow-up message → host approves → send WhatsApp
- `makeAssistantToolUI()` is the missing piece for rendering apartment cards, event cards, and map pins inline in mdeai's chat widget
- The todo list real-time update pattern works for trip planning: show itinerary steps being built live

**Ideas to steal:**
1. Implement `proposeTicketPurchaseTool` + `executeTicketPurchaseTool` using this exact HITL pattern for mdeai's event ticket flow
2. Use `makeAssistantToolUI()` to render `ApartmentCard`, `EventCard`, and `MapPin` components inline as the agent returns search results
3. Copy the plan approval pattern for sponsor onboarding: agent proposes campaign plan → sponsor approves → workflow executes
4. Implement `requestInputTool` for the concierge: when budget/dates are missing, agent pauses and asks rather than guessing
5. Use the real-time todo tracker pattern during trip planning to show the itinerary being assembled step by step

**Weaknesses:** Uses Anthropic Claude (not Gemini). No server-side streaming persistence. No Supabase integration.

---

### 3. [mastra-ai/mastra-triage](https://github.com/mastra-ai/mastra-triage)
**Score: 92/100**

**What it is:** Mastra Cloud deployment that auto-triages GitHub issues using AI classification agents — classifies by product area, assigns effort/impact labels, syncs with Discord threads.

**Key features:**
- `triageWorkflow` — classify issue → derive squad → estimate effort/impact → apply labels
- `discordToGithubWorkflow` — converts Discord forum threads into GitHub issues
- `discordSyncWorkflow` — syncs Discord replies back to GitHub issues
- `classificationAgent` + `effortImpactAgent` — separate agents for different classification tasks
- GitHub Actions triggers (webhook + cron)

**Architecture patterns:**
- Multi-workflow architecture with single-purpose workflows, each triggered by different events
- Classification agents are narrow and focused — one job each
- Concurrency: 10 parallel issue syncs in `discordSyncWorkflow`
- Cron + webhook triggers = dual-mode operation (reactive + scheduled)

**mdeai alignment:**
- The triage workflow pattern applies directly to mdeai lead triage: classify intent (rental inquiry / event ticket / general) → route to correct agent
- The effort/impact scoring translates to lead scoring: classify lead quality → route hot leads to host WhatsApp immediately
- The cron + webhook dual trigger is the exact pattern needed for mdeai's WhatsApp outreach: webhook on new lead, cron for follow-up reminders

**Ideas to steal:**
1. Build a `leadTriageWorkflow` in mdeai: classify lead → score quality → route to host or auto-reply
2. Use the narrow-agent pattern: separate `classificationAgent` for intent, `scoringAgent` for lead quality — don't combine into one fat agent
3. Port the concurrency pattern (10 parallel) for bulk operations like syncing events from Google Calendar to mdeai
4. Use the GitHub Actions trigger model for mdeai admin workflows: maps to `new lead received` → classify and route
5. Apply the Discord→GitHub sync pattern for mdeai's WhatsApp→Supabase lead sync: inbound message → create lead record → classify → assign

**Weaknesses:** No frontend UI — purely backend orchestration. Heavily GitHub/Discord-specific; requires domain adaptation for mdeai.

---

### 4. [ataschz/tanstack-start-mastra-example](https://github.com/ataschz/tanstack-start-mastra-example)
**Score: 89/100**

**What it is:** Full-stack travel assistant using TanStack Start + Mastra + Gemini — agent networks, real-time streaming, thread persistence, and dynamic UI for tool calls and reasoning.

**Key features:**
- Agent network: routing agent delegates to weather agent + destinations agent
- Gemini Flash Lite for thread title generation, stronger model for chat
- Thread persistence via LibSQL (SQLite)
- Stream event types: text, tool-call, network execution (delegation), reasoning (chain-of-thought)
- `toAISdkV5Messages()` + `filterDisplayableMessages()` for clean chat history rendering
- Auto-generated thread titles

**Architecture patterns:**
```
User → DefaultChatTransport (POST /chat) → networkRoute(routingAgent)
→ routingAgent analyzes → delegates to WeatherAgent or DestinationsAgent
→ SSE stream: text chunks + tool calls + network execution events + reasoning
→ Frontend: switch on part.type to render MessageResponse / Tool / NetworkExecution / Reasoning
```
Backend runs on port 4111 (Mastra), frontend on 3000. Clean separation.

**mdeai alignment:**
- This is the closest full-stack reference to mdeai's architecture — Gemini + Vite + streaming + multi-agent
- The routing agent → specialist agent delegation model is exactly what mdeai needs: concierge routes to rentals agent, events agent, or trip planner
- The stream event type switch pattern is the blueprint for mdeai's `FloatingChatWidget` message renderer
- Thread persistence pattern maps directly to mdeai's `conversations` + `messages` Supabase tables

**Ideas to steal:**
1. Copy the `networkRoute()` pattern: replace mdeai's single `ai-chat` edge function with a Mastra network of 3-4 specialist agents routed by a supervisor
2. Implement the stream event type switch in `FloatingChatWidget`: render different React components based on `part.type` (text / tool-call / map-pin / card)
3. Add auto-generated thread titles using a fast Gemini Flash Lite call after the first message
4. Use `filterDisplayableMessages()` to hide internal network routing messages from the user-facing chat history
5. Port the `DefaultChatTransport` → Mastra backend pattern to replace the current direct Supabase edge function calls

**Weaknesses:** Uses LibSQL (not Supabase/pgvector) for storage. TanStack Start is SSR-first while mdeai is Vite SPA — routing model differs. No map integration.

---

### 5. [mastra-ai/workshops](https://github.com/mastra-ai/workshops)
**Score: 87/100**

**What it is:** 10 workshop examples from the Mastra team covering the full feature surface: memory (Observational Memory), guardrails, processors, multi-agent networks, harness, and browser + channels.

**Key features:**
- `examples/04-guardrails` — PII guard + topic guard processors on a support agent
- `examples/05-beyond-guardrails` — cost tracker, model router, response enricher, task drift monitor
- `examples/06-enterprise-pipeline` — full input/output pipeline with escalation detection, regex pre-filter, wrap-up enforcer
- `examples/08-multi-agent-networks` — council (legislative analysis) + supervisor (stack advisor with delegation timeline UI in Svelte)
- `examples/09-browser-channels-workshop` — browser automation + Mastra channels
- Observational Memory (OM) harness pattern in examples 00, 01, 02, 07

**Architecture patterns:**
- Processors are composable middleware: input pipeline (pre-filter → topic guard → PII guard) → agent → output pipeline (cost tracker → response enricher)
- Supervisor agent pattern: `stack-advisor-supervisor.ts` delegates to `app-recommender`, `operations-reviewer`, `security-reviewer`
- Delegation timeline UI: visual component showing which sub-agent handled each step
- Harness = wrapping an agent with processors + scorers + memory config

**mdeai alignment:**
- The guardrails processors are immediately applicable to mdeai's chat: topic guard (keep to Medellín/mdeai topics), PII guard (redact phone numbers before logging), escalation detector (route to human when confidence is low)
- The supervisor delegation timeline UI is a ready-made pattern for showing users which agent is handling their request
- The enterprise pipeline (input → agent → output) is the architecture mdeai's Mastra chat route should follow

**Ideas to steal:**
1. Add a `topicGuard` processor to mdeai's chat input pipeline: if the message is not about Medellín/rentals/events/restaurants, redirect with a friendly in-scope message
2. Add a `piiGuard` processor to the output pipeline before logging to `ai_runs`: redact phone numbers, email addresses, and passport numbers
3. Add an `escalationDetector` processor: if agent confidence is low or user expresses frustration, trigger a human handoff notification to the host's WhatsApp
4. Build a `DelegationTimeline` component (port from the Svelte example) for the mdeai admin dashboard
5. Use the cost tracker processor to feed real token costs into the `ai_runs` table per request

**Weaknesses:** Workshop code is deliberately minimal — not production-ready without adaptation. Svelte-based UI examples need React porting.

---

### 6. [mastra-ai/ai-buddies](https://github.com/mastra-ai/ai-buddies)
**Score: 72/100**

**What it is:** Mastra showcase with 7 diverse agents: Ghibli art generator, Git operations, Hacker News reader, multi-agent planner, story generator with embeddings, weather agent, and web search agent.

**Key features:**
- `storybase` agent with `story-search` tool using semantic vector search (embeddings)
- `story-embedder` workflow: ingest stories → embed → store in vector index
- `multiagent` showing A2A delegation: planner → sub-agents
- `websearch` agent with real-time search tool
- MCP docs server in `src/mastra/mcp/docs-server.ts`

**Architecture patterns:**
- Each agent is a self-contained file in `src/mastra/agents/`
- Shared tools in `src/mastra/tools/` (reused across agents)
- Story embedder workflow separates ingestion from querying (ingest once, search many times)
- MCP docs server exposes internal documentation as a tool namespace

**mdeai alignment:**
- The `story-embedder` workflow is the reference for mdeai's apartment/event embedding pipeline
- The `story-search` tool pattern is directly applicable to mdeai's `search-rentals` and `search-events` tools
- The MCP docs server pattern is valuable: expose mdeai's local knowledge (neighborhoods, attractions, tips) as an MCP server the concierge consults

**Ideas to steal:**
1. Use the story embedder workflow pattern for mdeai's attraction/neighborhood knowledge embedding — run it as a Supabase cron when new content is added
2. Port the MCP docs server to expose mdeai's curated Medellín knowledge as a tool the concierge calls
3. Copy the `websearch` agent tool for the concierge when a user asks about something not in the knowledge base — fallback to live search
4. Use the `multiagent` planner pattern as the blueprint for mdeai's trip planning agent
5. Note the clean agent registry pattern in `src/mastra/index.ts` — register all mdeai agents in one place for easy Studio inspection

**Weaknesses:** No frontend UI, no auth, no Supabase integration. Agents are demos, not production-hardened.

---

### 7. [dgalarza/mastra-meeting-assistant](https://github.com/dgalarza/mastra-meeting-assistant)
**Score: 86/100**

**What it is:** Production meeting assistant that preps briefings from Cal.com webhooks, posts to Slack, maintains 3-layer memory, and scores outputs with LLM-as-judge evaluators.

**Key features:**
- Three memory layers: episodic (last 10 messages), semantic (vector recall across all conversations), working (persistent user profile updated by agent)
- Cal.com + Slack webhooks as input channels
- Exa API for person/company research
- Post-meeting follow-up scheduling (SQLite + 30s polling scheduler)
- LLM-as-judge scorer for hallucination detection in action item extraction
- Mastra Chat SDK adapter for Slack thread replies

**Architecture patterns:**
```
Webhook (Cal/Slack) → ChatSDK → SlackAdapter → MeetingAssistantAgent
Agent has: tools (searchWeb) + Episodic + Semantic + Working memory
Scheduler polls SQLite every 30s for follow-up tasks
```
Working memory = persistent scratchpad that accumulates user preferences over time. Agent updates it after each interaction. Semantic memory = vector search across all past conversations for recall.

**mdeai alignment:**
- The 3-layer memory is the reference implementation for mdeai's per-user concierge memory
- The scheduler pattern (SQLite + 30s poll) maps to mdeai's lead reminder system
- The Slack adapter is the model for the WhatsApp adapter: webhook → channel adapter → agent → channel reply
- The LLM-as-judge scorer is immediately applicable for mdeai's lead quality assessment

**Ideas to steal:**
1. Implement mdeai's concierge memory using this exact 3-layer pattern: episodic (last 10 turns), semantic (recall past conversations), working (user profile: budget, neighborhood preference, travel dates)
2. Port the scheduler pattern for mdeai's lead follow-up: schedule a WhatsApp follow-up 48h after initial lead capture if no booking
3. Use the webhook → ChatSDK → agent → channel reply pattern as the blueprint for the WhatsApp outreach agent
4. Implement an LLM-as-judge scorer for mdeai's lead quality: did the agent correctly identify the lead's budget and requirements?
5. Copy the Cal.com webhook pattern for mdeai's event booking confirmations: on booking created → agent researches attendee → posts briefing to host WhatsApp

**Weaknesses:** Uses Claude (not Gemini) and Exa (not Google Search). Slack-specific adapter needs porting to WhatsApp/Infobip. Uses SQLite for vectors — not pgvector.

---

### 8. [DarkNoah/aime-chat](https://github.com/DarkNoah/aime-chat)
**Score: 78/100**

**What it is:** Electron desktop AI with 10+ LLM providers, RAG knowledge base, cultivation memory (daily cron extracts preferences from chat history into a persistent memory wiki), cron automation, MCP client, and STT/TTS.

**Key features:**
- Cultivation memory: cron agent reads recent conversations, deduplicates against existing memories, writes to structured Markdown pages (`preferences.md`, `habits.md`, project notes)
- Knowledge base: vector database with document upload, retrieval, and Q&A
- Skill system: import AI skills from Git repos or online marketplace
- Background bash sessions with live status in chat
- Channel integration: WeChat and Telegram bridges
- Secrets management: local encrypted secret store

**Architecture patterns:**
- Cultivation agent = a scheduled Mastra agent that processes conversation history into long-term memory entries
- Skill system = pluggable markdown instructions that extend agent capabilities without code changes
- Channel bindings table: maps channels to agents dynamically — adding a new channel is a data change, not code

**mdeai alignment:**
- The cultivation memory pattern is highly applicable: a nightly cron agent reads the day's concierge conversations, extracts user preferences, and writes them to each user's working memory profile
- The channel bindings table pattern solves mdeai's multi-channel routing: one table entry maps WhatsApp number → rental agent, another maps web chat → concierge
- The skill system mirrors mdeai's `.claude/skills/` — a pattern to extend the concierge's capabilities without rewriting the agent

**Ideas to steal:**
1. Build a nightly `cultivationWorkflow` for mdeai: scan today's concierge conversations → extract user preferences → upsert to user `working_memory` in Supabase
2. Use the channel bindings table pattern to route WhatsApp messages to the correct agent by context
3. Copy the skill import system for mdeai's concierge: skills as markdown files the agent reads at runtime
4. Adapt the background bash session display for mdeai's admin panel: show long-running AI jobs with live status
5. Use the cultivation agent to score and summarize leads nightly rather than in real-time

**Weaknesses:** Electron desktop app — no web frontend patterns directly portable. Heavy dependencies. Chinese-language UI reduces documentation clarity.

---

### 9. [laoposkj/mastra-agentic-rag](https://github.com/laoposkj/mastra-agentic-rag)
**Score: 85/100**

**What it is:** Production-oriented agentic RAG (Retrieval-Augmented Generation) starter: agent decides when to call retrieval, refines queries across turns, and answers from an ingested knowledge base. Includes eval scorers and a research workflow.

**Key features:**
- `ragAgent` with `ragTool` (semantic search over chunked docs)
- LibSQL vector store (no Docker required) — interchangeable with pgvector
- `researchWorkflow`: retrieve chunks → `ragAgent.generate` with `toolChoice: 'none'` so answers stay grounded in retrieved context
- Eval scorers: tool-call accuracy for `ragTool` + completeness
- `ingestMarkdown()` pipeline: chunk → embed → upsert to vector index
- Optional pgvector via Docker Compose

**Architecture patterns:**
- Agentic RAG: model decides when to call `ragTool` vs. answer from training knowledge
- Research workflow separates retrieval (step 1) from synthesis (step 2 with tools disabled) — prevents hallucination in synthesis
- Two-database approach: `mastra.db` for state/threads, `vectors.db` for embeddings

**mdeai alignment:**
- This is the reference implementation for mdeai's concierge knowledge base over Medellín local knowledge
- The `toolChoice: 'none'` synthesis step is critical: after retrieving apartment listings, synthesis agent should not call more tools — compose from what was retrieved
- The eval scorer pattern is immediately applicable: did the concierge correctly call `search-rentals` for a rental question?
- The pgvector option maps directly to mdeai's existing pgvector setup on Supabase

**Ideas to steal:**
1. Implement the two-step research workflow in mdeai's trip planner: step 1 retrieves relevant attractions/restaurants (tools enabled), step 2 synthesizes itinerary (tools disabled, grounded in step 1 output)
2. Add `toolCallAccuracy` scorer to mdeai's agent evals: measure whether the correct tool was called for each user intent
3. Use the `ingestMarkdown()` pipeline to ingest mdeai's Medellín knowledge base (neighborhoods, attraction descriptions, restaurant write-ups) into pgvector
4. Apply `toolChoice: 'none'` in mdeai's rentals synthesis step: retrieve apartments → then answer without further retrieval
5. Use the LibSQL vector store as a fallback during local development so pgvector credentials are not required for testing

**Weaknesses:** Uses OpenAI (not Gemini) for embeddings and chat. LibSQL is not pgvector — swap needed for mdeai's Supabase stack. No frontend UI.

---

### 10. [mastra-ai/template-browsing-agent](https://github.com/mastra-ai/template-browsing-agent)
**Score: 62/100**

**What it is:** Official Mastra template using Stagehand (Browserbase) for AI-driven web automation — navigate, observe, click, extract, and manage browser sessions.

**Key features:**
- Web navigation, element observation, click/fill actions, structured data extraction
- Smart session management: automatic timeouts and reconnection
- Browserbase API for headless browser sessions
- OpenAI models for natural language→action translation

**Architecture patterns:**
- Agent wraps Stagehand browser session as a tool namespace
- Session lifecycle managed separately from agent lifecycle
- Data extraction returns structured objects, not raw HTML

**mdeai alignment:**
- Lower direct alignment — mdeai has a structured Supabase backend, not scraped data
- Useful for mdeai's content ingestion: scraping new events from ticketing sites, importing restaurant menus, or pulling venue details
- The session management pattern is relevant for any long-running browser task

**Ideas to steal:**
1. Use the browsing agent to scrape upcoming events from Medellín event sites and ingest into mdeai's events table
2. Apply the structured data extraction pattern when ingesting new apartments from external listing sites
3. Use the session reconnection pattern for long-running admin tasks that browse multiple pages
4. Add a "research venue" tool to the concierge that browses and summarizes a venue's web presence on demand
5. Use Stagehand for QA automation: browser agent navigates the mdeai ticket purchase flow and asserts on completion

**Weaknesses:** Requires Browserbase API key (paid service). OpenAI-only. High latency for real-time chat. No persistent storage integration.

---

### 11. [smthomas/mastra-claw-workshop](https://github.com/smthomas/mastra-claw-workshop)
**Score: 74/100**

**What it is:** Workshop version of the MastraClaw agent harness — 6 agents (browser, memory, skills, tools, weather, workspace), structured around the harness + workspace pattern.

**Key features:**
- `mastra-claw-agent` as the main orchestrator
- `memory-agent` for long-term recall
- `skills-agent` that reads runtime markdown skills
- `workspace-agent` for file system operations
- `browser-agent` for web automation
- Public workspace with skill files (`email-style`, `poem-style`, `repeater`)
- `assistant-data.ts` service for shared state

**Architecture patterns:**
- Skills-as-files: markdown files in `src/mastra/public/assistant-workspace/skills/` loaded at runtime
- Workspace service wraps file system operations (read/write/list) as tools
- Each agent has a single responsibility; orchestrator delegates

**mdeai alignment:**
- The skills-as-files pattern is directly applicable: mdeai could store Medellín-specific prompts as markdown skills loaded at runtime
- The workspace agent pattern maps to mdeai's admin workflows: generate reports, export lead CSVs
- Memory agent as a dedicated sub-agent (not baked into the main agent) is a cleaner pattern for complex multi-agent systems

**Ideas to steal:**
1. Implement skills-as-files for mdeai's concierge: store `medellin-neighborhoods.md` as a runtime skill the agent reads when neighborhood questions arise
2. Create a dedicated `memoryAgent` in mdeai that the concierge delegates memory operations to (write preference, recall history)
3. Use the workspace agent pattern for mdeai's admin: generate weekly report → export to CSV → write to Supabase Storage
4. Copy the `assistant-data.ts` service for shared state between agents in the same session
5. Use the public workspace folder as a staging area for dynamically generated content (itineraries, lead summaries) before persisting to Supabase

**Weaknesses:** Workshop-quality code — not production-hardened. No auth, no Supabase, no frontend. Lacks HITL or streaming UI patterns.

---

### 12. [p-meier/mastra-claw](https://github.com/p-meier/mastra-claw)
**Score: 93/100**

**What it is:** Enterprise-ready personal AI agent built on Mastra + Supabase + Next.js — the most architecturally similar project to mdeai in the entire survey.

**Key features:**
- Mastra embedded in-process in Next.js (no separate API service)
- Supabase as the only backend: Postgres for Mastra storage, pgvector for embeddings, Storage for workspaces, GoTrue for auth, Vault (pgsodium) for encrypted user secrets
- RLS on every tenant table — multi-tenancy from day one
- Main Agent + Sub Agents with bindings table routing: `bindings` table maps channels (Telegram, web) to agents — adding a new channel is a data change
- Tool approval buttons in the UI: `tool-approval-buttons.tsx` — HITL per tool call
- Three architecture paradigms: skill-based (markdown), workflow-based (typed steps), hybrid (main agent calls workflow as a tool)
- The compound error table: documents why 20-step autonomous tasks fail 64% of the time — justifies typed workflows
- Supabase migrations for agent storage, onboarding, workspace bucket, provider channels

**Architecture patterns:**
```
Next.js Server Component → getCurrentUser() → mastraFor(currentUser)
→ Main Agent (orchestrator) → Sub Agents (specialists)
→ Bindings table routes: channel → agent
→ Supabase: pgvector + RLS + Vault secrets + Storage workspaces
```
The `mastraFor(currentUser)` pattern creates a user-scoped Mastra instance with the correct permissions and secrets — elegant multi-tenancy without shared state.

**mdeai alignment:**
- This is the closest architecture to mdeai in the entire survey: Supabase + RLS + pgvector + multi-agent + web UI
- The `mastraFor(currentUser)` pattern is exactly how mdeai should scope Mastra agent instances per authenticated user
- The bindings table (channel → agent routing) solves mdeai's multi-channel problem: one table row maps WhatsApp to rentals agent, another maps web chat to the main agent
- Tool approval buttons in the UI are the missing HITL UI component in mdeai's chat widget
- The compound error justification validates mdeai's current edge-function-per-workflow approach

**Ideas to steal:**
1. Implement `mastraFor(currentUser)` in mdeai: a function that returns a user-scoped Mastra instance with the user's memory, preferences, and permission context
2. Build a `channel_bindings` table in Supabase that maps `(channel_type, channel_id) → agent_id` — making it data-driven to add new channels
3. Port the tool approval buttons (`tool-approval-buttons.tsx`) into mdeai's `FloatingChatWidget` for HITL on payment tools
4. Copy the Supabase migrations structure — especially the platform schema migration pattern for versioned schema changes
5. Use the hybrid paradigm explicitly: concierge agent is skill-based for simple Q&A, calls typed workflows for trip planning and ticket purchase

**Weaknesses:** Draft/WIP status — not all features are implemented. Next.js App Router only (mdeai is Vite SPA). No Gemini integration out of the box.

---

### 13. [Array-Ventures/coworker](https://github.com/Array-Ventures/coworker)
**Score: 82/100**

**What it is:** Open-source AI coworker with WhatsApp bridge, MCP UI, skills marketplace (ClawHub), A2A protocol, Inngest-scheduled tasks, Google Workspace integration, and app builder.

**Key features:**
- WhatsApp bridge: `src/mastra/whatsapp/` — connects WhatsApp messages to Mastra agents
- MCP UI: visual interface for managing MCP servers
- A2A protocol: lets other AI agents discover and communicate via Agent-to-Agent protocol
- Scheduled tasks via Inngest (cron workflow runner)
- Google Workspace: manage Gmail, Calendar, Docs via natural language
- Skills marketplace: install community skills from ClawHub

**Architecture patterns:**
```
src/mastra/agents/      — agent definitions
src/mastra/tools/       — reusable tools
src/mastra/workflows/   — Inngest-scheduled workflows
src/mastra/whatsapp/    — WhatsApp bridge
src/mastra/gog/         — Google Workspace integration
src/mastra/mcp/         — MCP server
```
Inngest handles scheduling separately from Mastra — clean separation between agent logic and cron infrastructure.

**mdeai alignment:**
- The WhatsApp bridge (`src/mastra/whatsapp/`) is directly applicable to mdeai's WhatsApp outreach agent
- The A2A protocol is relevant if mdeai ever needs to expose its agents to external systems (partner integrations, sponsor AI tools)
- Inngest for scheduling is a well-supported alternative to Supabase cron for complex multi-step workflows
- The Google Workspace integration maps to how a host might manage their mdeai event calendar

**Ideas to steal:**
1. Port the `src/mastra/whatsapp/` bridge as mdeai's WhatsApp outreach agent foundation — inbound WhatsApp → Mastra agent → Infobip reply
2. Use the A2A protocol to let mdeai's concierge be discoverable by partner platforms (travel agencies, booking sites)
3. Adopt the Inngest scheduling pattern if Supabase cron proves insufficient for complex multi-step scheduled workflows
4. Copy the MCP UI concept for mdeai's admin panel: visual interface showing all active tool connections and their status
5. Study the app builder pattern — mdeai could offer hosts an AI-generated dashboard for their event analytics

**Weaknesses:** Electron desktop app for the client side — web-first patterns need extraction. Heavy multi-dependency stack. No Supabase integration.

---

### 14. [ssdeanx/AgentStack](https://github.com/ssdeanx/AgentStack)
**Score: 80/100**

**What it is:** Production-grade multi-agent platform with 57 tools, 25+ agents, 12 supervisor networks, 105 UI components, RAG pipeline, financial intelligence, and enterprise observability — a maximalist reference.

**Key features:**
- 12+ supervisor networks with delegation hooks
- `@mastra/rag` with LibSQL HNSW + rerank + graphRAG
- TanStack Query hooks (1590+ lines) for all Mastra APIs: `useAgentsQuery()`, `useMemoryQuery()`, etc.
- Langfuse integration for observability
- Better Auth + RBAC for enterprise security
- Dataset management: versioning, experiments, evaluation
- 105 UI components: AI Elements (50 chat/reasoning/canvas components) + shadcn/ui (55 base)
- 97% Vitest coverage

**Architecture patterns:**
- Supervisor network: coordinator agent with delegation hooks selects the right specialist
- TanStack Query as the data fetching layer between React UI and Mastra backend
- Processor middleware on all agent calls for observability and cost tracking
- Dataset + experiment API for iterative agent improvement

**mdeai alignment:**
- The TanStack Query hooks pattern maps directly to mdeai's existing TanStack Query setup — drop-in hooks for Mastra agent calls
- The supervisor network pattern is the multi-agent routing solution for mdeai
- The 97% Vitest coverage for agents sets the testing standard mdeai should aim for
- The dataset/experiment API is the roadmap for systematically improving mdeai's agents over time

**Ideas to steal:**
1. Copy the `useAgentsQuery()` / `useMemoryQuery()` TanStack Query hook pattern to build mdeai's agent data layer
2. Use the supervisor network pattern to structure mdeai's routing: one `conciergeNetwork` coordinator routes to `rentalsAgent`, `eventsAgent`, `tripPlannerAgent`
3. Add Langfuse (or similar) observability to mdeai's Mastra agents alongside the existing `ai_runs` Supabase logging
4. Adopt the dataset + experiment API for A/B testing mdeai's concierge prompts systematically
5. Study the 105 AI Elements UI component set — several chat components (reasoning display, tool call card) can be adapted for mdeai's widget

**Weaknesses:** Maximalist — 57 tools and 25+ agents create maintenance overhead. Financial intelligence features are irrelevant to mdeai. Not Gemini-optimized.

---

### 15. [KishorNaik/Sol_Basic_Hotel_Booking_Assistant_Mastra_AI_Google_Gemini](https://github.com/KishorNaik/Sol_Basic_Hotel_Booking_Assistant_Mastra_AI_Google_Gemini)
**Score: 68/100**

**What it is:** Minimal Mastra + Google Gemini hotel booking assistant — single agent with a `getBookings` tool, LibSQL storage, and structured prompt engineering for hotel-specific responses.

**Key features:**
- Google Gemini as the LLM (same as mdeai)
- `getBookings` tool fetches reservations by account ID
- Strict prompt engineering: only English, only hotel topics, list upcoming bookings chronologically
- LibSQL for in-memory storage
- Clean tool/agent separation in `src/mastra/agents/hotel_assistance/` + `src/mastra/tools/booking/`

**Architecture patterns:**
- Prompt-first design: agent instructions enforce domain scope strictly before any tool calls
- Tool returns structured data; agent formats it for the user
- Account-ID-scoped tool calls (user isolation at the tool level)

**mdeai alignment:**
- The Google Gemini + Mastra combination is confirmed working — same stack as mdeai
- The account-ID-scoped `getBookings` tool is the pattern for mdeai's `search-rentals` and `get-bookings` tools (always filter by `auth.uid()`)
- The strict prompt constraints (domain-only, language-only) are directly applicable to mdeai's concierge instructions

**Ideas to steal:**
1. Use the account-ID-scoped tool pattern for all mdeai tools: `search-rentals` always filters by `user_id`, `get-bookings` always scopes to the authenticated user
2. Copy the strict prompt engineering pattern: "You only discuss Medellín rentals, events, and restaurants. Respond only in [user's language]."
3. Reference this repo as confirmation that Gemini + Mastra works with minimal configuration — no OpenAI fallback needed
4. Use the chronological booking list (nearest first) as the default sort for mdeai's bookings tool output
5. Document the LibSQL → Supabase `@mastra/pg` swap as a reference for any new mdeai Mastra tools that need local dev storage

**Weaknesses:** No frontend UI. Minimal — single tool, single agent. No memory, no streaming, no HITL. Educational rather than production reference.

---

### 16. [Calinemesef/mastra-hotel-booking-ai-agent](https://github.com/Calinemesef/mastra-hotel-booking-ai-agent)
**Score: 55/100**

**What it is:** Prototype hotel booking agent using LiteAPI (travel API) for real hotel search and booking, built with Mastra in a few hours.

**Key features:**
- LiteAPI integration for hotel search by city + date range
- Multi-step booking conversation: search → select → book
- Example conversations: "Find me a hotel in Bucharest" → filter by dates → book
- Service-oriented tool architecture with centralized error handling
- HTML-based frontend (minimal)

**Architecture patterns:**
- Service-oriented: each API capability is a separate service/tool
- Error handling service wraps all API calls
- Conversation-driven booking flow (no pre-set UI steps — everything through chat)

**mdeai alignment:**
- The conversation-driven booking flow (no UI form, just chat) is the pattern mdeai's ticket purchase should follow for simple cases
- The multi-step conversation pattern (search → present options → book) maps to mdeai's rental inquiry → apartment selection → lead capture
- The error handling service wrapper is applicable to mdeai's tool layer

**Ideas to steal:**
1. Use the multi-step conversation pattern for mdeai's rental flow: "show apartments" → agent presents 3 options → user selects → HITL confirmation → lead capture
2. Apply conversation-driven booking as a fallback when the mdeai UI booking flow is unavailable (mobile users in WhatsApp)
3. Use the LiteAPI integration pattern as a reference for integrating third-party booking APIs as mdeai tools
4. The centralized error handler pattern for wrapping all tool API calls in mdeai
5. Reference as proof that an end-to-end booking conversation can be prototyped in hours with Mastra

**Weaknesses:** Prototype quality — no auth, no memory, no streaming, no production error handling. HTML frontend is minimal. LiteAPI-specific (no Supabase). Low architectural depth.

---

## Synthesized Ideas for mdeai

### Tier 1 — Ship Now (high impact, low effort)

| # | Idea | Source | What to Copy | Where in mdeai |
|---|------|--------|-------------|----------------|
| 1 | **Inline tool cards in chat widget** | `assistant-ui/mastra-hitl` | `makeAssistantToolUI()` pattern + `components/tools/` | `src/components/chat/FloatingChatWidget.tsx` — add ApartmentCard, EventCard, MapPin tool UIs |
| 2 | **HITL ticket purchase gate** | `assistant-ui/mastra-hitl` | `proposeTicketPurchaseTool` + `executeTicketPurchaseTool` two-step | New `ai-ticket-checkout` edge function + UI approval component |
| 3 | **Topic guard processor** | `mastra-ai/workshops` ex04/06 | `topic-guard.ts` processor on chat input pipeline | Mastra `ai-router` input pipeline — reject out-of-scope messages gracefully |
| 4 | **PII guard processor** | `mastra-ai/workshops` ex04 | `pii-guard.ts` processor on output pipeline | Before `ai_runs` logging — redact phone/email |
| 5 | **Escalation detector** | `mastra-ai/workshops` ex06 | `escalation-detector.ts` processor | Trigger human handoff to host WhatsApp when confidence is low |
| 6 | **Auto-generated thread titles** | `ataschz/tanstack-start-mastra-example` | Gemini Flash Lite call after first message | `src/hooks/useChat.ts` — add title generation after message 1 |
| 7 | **3-layer memory on concierge** | `dgalarza/mastra-meeting-assistant` | Episodic (10 turns) + semantic (pgvector) + working (user profile) | Mastra concierge agent memory config |
| 8 | **Account-scoped tool pattern** | `KishorNaik/Sol_Basic_...` | Tool always filters by `user_id` / `auth.uid()` | All mdeai Mastra tools: `search-rentals`, `search-events`, `get-bookings` |

### Tier 2 — Next Sprint (medium effort, high value)

| # | Idea | Source | What to Copy | Where in mdeai |
|---|------|--------|-------------|----------------|
| 1 | **Supervisor routing agent** | `ataschz/tanstack-start-mastra-example`, `mastra-ai/workshops` ex08 | `networkRoute()` + supervisor agent delegating to specialists | New `conciergeNetwork`: routing agent → rentalsAgent / eventsAgent / tripPlannerAgent |
| 2 | **`mastraFor(currentUser)` scoping** | `p-meier/mastra-claw` | `src/mastra/lib/mastra-for.ts` | mdeai Mastra init — per-user instance with memory + permission context |
| 3 | **Channel bindings table** | `p-meier/mastra-claw`, `DarkNoah/aime-chat` | `bindings` table: `(channel_type, channel_id) → agent_id` | New Supabase migration — data-driven channel→agent routing |
| 4 | **Stream event type switch in chat** | `ataschz/tanstack-start-mastra-example` | `part.type` switch → `MessageResponse` / `Tool` / `MapPin` / `NetworkExecution` | `FloatingChatWidget.tsx` message renderer refactor |
| 5 | **WhatsApp bridge** | `Array-Ventures/coworker` | `src/mastra/whatsapp/` bridge pattern | New `src/mastra/whatsapp/` module — inbound WhatsApp → Mastra agent → Infobip reply |
| 6 | **Cultivation memory workflow** | `DarkNoah/aime-chat` | Nightly cron agent: scan conversations → extract preferences → upsert working memory | Supabase cron `cultivationWorkflow` nightly |
| 7 | **Two-step RAG + synthesis workflow** | `laoposkj/mastra-agentic-rag` | retrieve chunks → synthesize with `toolChoice: 'none'` | `ai-trip-planner` edge function refactor |
| 8 | **TanStack Query hooks for Mastra** | `ssdeanx/AgentStack` | `useAgentsQuery()` hook pattern | `src/hooks/useMastra.ts` — typed hooks for agent calls + memory |

### Tier 3 — Roadmap (larger efforts worth planning)

| # | Idea | Source | What to Plan | Where in mdeai |
|---|------|--------|-------------|----------------|
| 1 | **MCP server for mdeai knowledge** | `mastra-ai/ai-buddies`, `mastra-ai/personal-assistant-example` | Expose Supabase tools + Medellín knowledge as MCP namespace | `src/mastra/mcp/` — Supabase MCP server + knowledge MCP server |
| 2 | **Skills-as-files system** | `smthomas/mastra-claw-workshop`, `DarkNoah/aime-chat` | Runtime markdown skills loaded by concierge | `src/mastra/skills/` — `neighborhoods.md`, `event-types.md`, `pricing-guide.md` |
| 3 | **Browsing agent for content ingestion** | `mastra-ai/template-browsing-agent` | Stagehand → structured extraction → Supabase upsert | Admin workflow: scrape Medellín event sites weekly → import to events table |
| 4 | **A2A protocol exposure** | `Array-Ventures/coworker` | Expose mdeai concierge as A2A-discoverable service | Partner API for travel agencies to query mdeai's events/rentals via agent |
| 5 | **Dataset + experiment API** | `ssdeanx/AgentStack` | Dataset versioning + eval experiments for agent improvement | Admin panel: A/B test concierge prompts systematically |
| 6 | **Delegation timeline UI** | `mastra-ai/workshops` ex08 | `DelegationTimeline.svelte` → React port | Admin dashboard: show which sub-agent handled each conversation step |
| 7 | **LLM-as-judge scorer** | `dgalarza/mastra-meeting-assistant` | Hallucination detector for agent responses | Eval pipeline: score lead quality assessments + itinerary factual accuracy |
| 8 | **Lead triage workflow** | `mastra-ai/mastra-triage` | `triageWorkflow` → lead classifier + quality scorer + router | `leadTriageWorkflow`: classify intent → score quality → route to host or auto-reply |

---

## Architecture Patterns Extracted

### Memory & Context

The ecosystem has converged on a **three-layer memory model** as the production standard:

| Layer | What it stores | Scope | Implementation |
|-------|---------------|-------|---------------|
| Episodic | Last N messages (N=10 is the common default) | Thread | `@mastra/memory` with `lastN` config |
| Semantic | Vector similarity search across all past conversations | Global per user | pgvector / LibSQL HNSW with cosine similarity |
| Working | Structured user profile (preferences, facts, ongoing context) | User (persistent) | JSON blob updated by agent after each session |

mdeai already has pgvector and the `ai_context` table. The missing piece is wiring `@mastra/memory` with all three layers into the concierge agent config — a configuration change, not a schema change.

### HITL / Approval Gates

The standard pattern (from `assistant-ui/mastra-hitl`, `p-meier/mastra-claw`) is:

1. **Propose tool** — agent calls `proposeSomethingTool(payload)` → returns `{ handle, approved: false }`; UI renders a blocking approval card
2. **User interacts** — approve / reject / edit the proposal
3. **Execute tool** — agent calls `executeSomethingTool({ handle })` → runs only if `approved: true`
4. **Real-time todo tracker** — separate `updateTodosTool` keeps a live status list visible throughout

The `approved: boolean` return pattern allows the agent to branch: if rejected, revise and re-propose; if approved, execute. This is already mdeai's "propose-only" AI contract — it needs a UI implementation, not a policy change.

### Routing & Triage

Three routing patterns seen across repos:

1. **Intent classification → workflow dispatch** (`mastra-ai/mastra-triage`): classify message → pick workflow → execute
2. **Network routing** (`ataschz/tanstack-start-mastra-example`): routing agent analyzes and delegates to the most capable sub-agent
3. **Bindings table** (`p-meier/mastra-claw`, `DarkNoah/aime-chat`): data-driven map of `(channel, context) → agent` — no code change to add new routes

mdeai should use all three in layers: intent classifier for inbound message routing, network routing for agent delegation, bindings table for channel routing.

### RAG & Knowledge Retrieval

The agentic RAG pattern (`laoposkj/mastra-agentic-rag`) is the production standard:

1. Agent decides **when** to call retrieval (not always — avoid "retrieve everything" overhead)
2. Retrieval step: embed query → cosine search → return top-K chunks with metadata
3. Synthesis step: run agent with `toolChoice: 'none'` so it grounds the answer in retrieved chunks only
4. Eval scorers: `toolCallAccuracy` + `completeness` to measure retrieval quality over time

mdeai's `ai-embed` edge function already handles step 2. Steps 1, 3, and 4 need to be added to the concierge and trip planner workflows.

### Streaming UI

The reference streaming UI pattern (from `ataschz/tanstack-start-mastra-example`, `assistant-ui/mastra-hitl`):

```
Backend SSE → Frontend part.type switch:
  "text"           → MessageResponse (plain text bubble)
  "tool-{name}"    → ToolCard (params + result + status: pending/done)
  "data-network"   → NetworkExecution (delegation steps, which agent, latency)
  "reasoning"      → Reasoning (collapsible chain-of-thought)
  "data-approval"  → ApprovalCard (blocking — approve/reject buttons)
  "data-map-pin"   → MapPin (inline map card with coordinates)
  "data-listing"   → ApartmentCard or EventCard (inline content card)
```

The `makeAssistantToolUI()` from `assistant-ui` provides type-safe per-tool React components that render inline in the stream. mdeai's `FloatingChatWidget` should be refactored to this `part.type` switch model.

### Tool Design

Common patterns across all repos:

- **Always validate with Zod** — every tool has `inputSchema: z.object(...)` and `outputSchema: z.object(...)`
- **Return structured data, not formatted strings** — the agent does formatting, the tool returns raw data
- **Scope by user** — tools filter by `userId` / `auth.uid()` at the tool level, not just at agent instruction level
- **Separate propose and execute tools** for any tool that has side effects (payments, emails, bookings)
- **Error as structured return** — `return { success: false, error: 'reason' }` not thrown exceptions

mdeai's current edge functions do most of this. The missing pieces: separate propose/execute for payment tools, and explicit Zod output schemas.

### Workflow Design

The compound error problem (documented in `p-meier/mastra-claw`) is the key justification: at 95% per-step accuracy, a 20-step autonomous task succeeds only 35.8% of the time. This justifies mdeai's typed workflows for complex operations:

- Use **typed Mastra workflows** for: trip planning (multi-day itinerary), ticket purchase (multi-step Stripe flow), lead capture (multi-turn conversation + CRM write)
- Use **agent skills** (markdown instructions) for: simple Q&A, neighborhood recommendations, event discovery
- The hybrid: agent calls a workflow as a single tool call — complexity is hidden inside the typed workflow, not exposed to the agent's autonomous reasoning chain

Current mdeai edge functions implement this implicitly. Making it explicit with Mastra workflow steps adds retry logic, checkpointing, and human-in-the-loop suspension at no extra cost.

---

## Final Recommendation

**`p-meier/mastra-claw`** is the repo that most closely mirrors where mdeai should go architecturally. It is the only surveyed project that combines all of: Mastra + Supabase (with RLS + pgvector) + web framework + multi-agent with bindings-based routing + HITL tool approval UI + Supabase migrations for versioned schema. The architectural decisions documented in its `ARCHITECTURE.md` — server-only execution boundary, `mastraFor(currentUser)` per-user scoping, compound error justification for typed workflows, multi-tenancy from day one — align precisely with mdeai's security and scalability requirements.

The caveat: `p-meier/mastra-claw` is in draft/WIP status and uses Next.js App Router (mdeai is Vite SPA). The patterns are sound; the implementation needs adaptation to mdeai's stack.

For immediate UI patterns, **`assistant-ui/mastra-hitl`** is the second most valuable repo — it provides production-ready HITL streaming UI components that mdeai's chat widget needs to move from prototype to product. Combining the architecture decisions from `mastra-claw` with the UI patterns from `mastra-hitl` and the memory design from `dgalarza/mastra-meeting-assistant` defines the complete target state for mdeai's Mastra layer over the next 2-3 sprints.
