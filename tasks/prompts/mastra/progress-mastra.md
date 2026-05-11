# Mastra AI Runtime — Master Progress Tracker

> **Role:** Systems Architect · Project Analyst · Detective Reviewer  
> **Last audited:** 2026-05-11 (session 2)  
> **Smoke suite:** ✅ PASS 8/8 probes · **Build:** ✅ 5.64s · **Tests:** ✅ 41/41  
> **Studio:** http://localhost:4111 · **Mastra core:** @mastra/core@1.9.2  
> **Sources verified:** archive/, tasks/, notes/, live file analysis, ai-chat code review, session 2 live verification

---

## Legend

🟢 Completed — fully functional, tested, confirmed  
🟡 In Progress — partially working  
🔴 Not Started — planned, prompt file exists, not implemented  
🟥 Blocked — missing dependency or critical failure  

---

## PART A — Archived Tasks (Completed)

These tasks have been fully implemented and archived. Prompt files live in  
`tasks/prompts/mastra/archive/`.

| Task ID | Title | Status | % | ✅ Proof of Completion | Date |
|---------|-------|--------|---|----------------------|------|
| **MASTRA-001** | Source Inventory + Safety Baseline | 🟢 Completed | 100% | `mastra-source-inventory.md` written; 24+ tables catalogued; P0 blockers identified | 2026-05-09 |
| **MASTRA-002** | Core Runtime Scaffold — 7 agents, 4 workflows, Studio running | 🟢 Completed | 100% | PR #22/#24 merged; 8/8 smoke probes pass; 7 agents + 4 workflows registered | 2026-05-10 |
| **MASTRA-022** | Runtime Smoke Script | 🟢 Completed | 100% | `scripts/mastra-smoke.sh` — typecheck → build → health → 8 probes | 2026-05-10 |
| **MASTRA-023** | Replace Weather Demo with mdeAI Ping / Router | 🟢 Completed | 100% | `ping-agent` + `router-agent` live; weather-agent retained as scaffold example | 2026-05-10 |
| **MASTRA-026** | Router Agent Studio Registration | 🟢 Completed | 100% | Studio shows router-agent; `classify-intent` tool registered | 2026-05-10 |
| **MASTRA-027** | Concierge Agent Studio Registration | 🟢 Completed | 100% | Studio shows concierge-agent; working memory schema visible | 2026-05-10 |
| **MASTRA-028** | Rental Agent Studio Registration | 🟢 Completed | 100% | Studio shows rental-agent; `search-rentals` tool wired to live Supabase | 2026-05-10 |
| **MASTRA-029** | Event Agent Studio Registration | 🟢 Completed | 100% | Studio shows event-agent; `search-events` tool live | 2026-05-10 |
| **MASTRA-030** | Evaluation Agent Studio Registration | 🟢 Completed | 100% | Studio shows evaluation-agent; 3 scorers registered | 2026-05-10 |
| **M22-01** | Smoke script must build temp env file from process env | 🟢 Completed | 100% | `mastra-start.sh` reads `.env.local`, writes to `/tmp/`; `mastra-smoke.sh` uses temp env | 2026-05-10 |
| **M22-02** | Add timeouts to weather-tool fetch calls | 🟢 Completed | 100% | `AbortSignal.timeout(5000)` on both `fetch()` calls in `weather-tool.ts` | 2026-05-10 |
| **classify-intent extraction** | Move tool from router.ts inline → own file | 🟢 Completed | 100% | `tools/classify-intent.ts` created; re-exported via `tools/index.ts` | 2026-05-11 |
| **MastraEditor registration** | `@mastra/editor@0.7.23` wired in `index.ts` | 🟢 Completed | 100% | Studio shows Editor tab per agent; Draft→Published versioning active | 2026-05-11 |
| **`.nvmrc`** | Pin Node 22.22.2 for `my-mastra-app/` | 🟢 Completed | 100% | `nvm use` auto-switches; Linuxbrew crash eliminated | 2026-05-11 |
| **Local `.env`** | `my-mastra-app/.env` with 3 keys for bare `npx mastra dev` | 🟢 Completed | 100% | `DATABASE_URL` crash fixed; file gitignored | 2026-05-11 |
| **`@mastra/client-js` in frontend** | Install in Vite frontend (`/home/sk/mde`) | 🟢 Completed | 100% | `@mastra/client-js@1.17.1` in `package.json` | 2026-05-11 |
| **`VITE_MASTRA_SERVER_URL`** | Env var in frontend `.env` | 🟢 Completed | 100% | `VITE_MASTRA_SERVER_URL=http://localhost:4111` added | 2026-05-11 |
| **`src/lib/mastra-client.ts`** | Bridge file: `streamConcierge()` + `generateConcierge()` | 🟢 Completed | 100% | Created; `processDataStream({ onTextPart })` API verified against official docs; lint-clean; tsc-clean | 2026-05-11 |
| **mastra-best-practices.md** | 10-section living guide for all Mastra patterns in mdeAI | 🟢 Completed | 100% | Verified agent table; confirmed memory on rental/event agents; backlog ordered | 2026-05-11 |
| **mastra-mdeai-integration.md** | 17-section integration plan: frontend → Mastra → Supabase | 🟢 Completed | 100% | Architecture, bridge file, streaming plan, memory strategy, Vercel deploy, security | 2026-05-11 |
| **`@ai-sdk/react ai` in frontend** | Install AI SDK React packages in Vite frontend | 🟢 Completed | 100% | `@ai-sdk/react@1.x` + `ai@4.x` in `/home/sk/mde/package.json`; build clean | 2026-05-11 |
| **`VITE_USE_MASTRA_CHAT` feature flag** | `.env` toggle to switch between Mastra and legacy ai-chat SSE paths | 🟢 Completed | 100% | `VITE_USE_MASTRA_CHAT=false` in `.env`; `USE_MASTRA_CHAT` constant in `useChat.ts` | 2026-05-11 |
| **`useChat.ts` Mastra branch** | Feature-flag branch inside `sendMessage()` hitting `POST /chat` with AI SDK SSE parsing | 🟢 Completed | 100% | Parses `{type:"text-delta", delta}` events; passes `memory: { thread, resource }`; legacy path intact | 2026-05-11 |
| **`MastraAuthSupabase` wired** | Production-only JWT guard on all Mastra endpoints | 🟢 Completed | 100% | `MastraAuthSupabase({ url, anonKey, authorizeUser: user => !!user?.id })` in `index.ts`; skipped in dev (NODE_ENV≠production) | 2026-05-11 |
| **`seed-editor-agents.sh`** | Script to create stored agent records for Mastra Editor via clone API | 🟢 Completed | 100% | Seeds `concierge-agent`, `rental-agent`, `event-agent`; idempotent (409/duplicate key = skip) | 2026-05-11 |

**Archived task total: 25/25 done ✅**

---

## PART B — Active Tasks (Open)

Prompt files live in `tasks/prompts/mastra/tasks/`.

### B1 — Foundation

| Task | Description | Status | % | ✅ Confirmed | ⚠️ Missing / Failing | 💡 Next Action |
|------|-------------|--------|---|--------------|----------------------|----------------|
| **MASTRA-003** | Tool Audit + Control Events — every tool logs to `ai_tool_audit_events` | 🔴 Not Started | 10% | `audit-wrapper.ts` skeleton + `risk-levels.ts` exist | No DB migration for `ai_tool_audit_events`; audit-wrapper not applied to any tool | Create migration; apply wrapper to all 4 search tools |
| **MASTRA-012** | Workflow State Runtime — persistent workflow state; resume after restart | 🔴 Not Started | 5% | Doc `012` written | No implementation | Implement from doc |
| **MASTRA-013** | Tenant Isolation — RLS-enforced agent namespace per user | 🔴 Not Started | 5% | Doc `013` written | No implementation | Implement from doc |
| **MASTRA-014** | AI Rate Limits + Cost Controls — rate limiting at Mastra layer | 🔴 Not Started | 5% | Doc `014` written | Rate limits currently only in `ai-chat` edge fn | Implement from doc |
| **MASTRA-015** | Shared Tool Registry — one import source for all tool definitions | 🟡 In Progress | 20% | `registry.ts` file exists | Agents don't import from registry; each agent imports tools directly | Migrate agents to import from `registry.ts` |
| **MASTRA-024** | Env / Secret Boundary — Infisical CLI connected to local instance | 🟡 In Progress | 75% | `.env` + startup scripts working | Infisical CLI points to `app.infisical.com` (cloud), not `localhost:80` | `infisical login --domain http://localhost:80` |
| **MASTRA-025** | Dependency Alias Map — which package does what | 🟡 In Progress | 40% | `23-mastra-modules-verified.md` written | Several packages lack embedded docs | Check each `node_modules/@mastra/*/dist/docs/` |

### B2 — Agents (In-Progress)

| Agent | Description | Status | % | ✅ Confirmed | ⚠️ Missing / Failing | 💡 Next Action |
|-------|-------------|--------|---|--------------|----------------------|----------------|
| **concierge-agent** | Main user-facing agent — memory, 4 tools, clarification gate | 🟡 In Progress | 80% | Working memory schema-typed; 4 tools; clarification gate; smoke passes | Not wired to frontend; no semantic recall | Wire `useChat.ts` → Mastra (line 364 swap) |
| **router-agent** | Intent classification → dispatch | 🟡 In Progress | 90% | `classify-intent` extracted; follow-up preservation rules set | Not yet replacing `ai-router` edge fn from frontend | Retire after `useChat.ts` wired |
| **rental-agent** | Rental search specialist | 🟡 In Progress | 70% | `search-rentals` live; source=supabase confirmed | No memory at all — each call stateless | `Memory({ options: { lastMessages: 10 } })` |
| **event-agent** | Event discovery specialist | 🟡 In Progress | 70% | `search-events` live | No memory | Same as rental-agent |
| **evaluation-agent** | Runs scorers | 🟡 In Progress | 50% | Registered; 3 scorers in Studio | `toolCallAppropriatenessScorer` references wrong tool ID (`weatherTool` vs `get-weather`) | Fix scorer tool ID |

### B2b — Agents (Not Started)

| Agent | Description | Status | % | ✅ Confirmed | ⚠️ Missing / Failing | 💡 Next Action |
|-------|-------------|--------|---|--------------|----------------------|----------------|
| **MASTRA-005** Chat Router + Concierge MVP | Full wire-up: concierge orchestrates router → rental/event workflows | 🔴 Not Started | 10% | Doc `005` written; components exist separately | Not wired end-to-end from frontend | Implement from doc — this is P0 |
| **MASTRA-006** Real Estate MVP Agents | Full landlord + tenant agent pipeline | 🔴 Not Started | 5% | Doc `006` written | Not implemented | Implement after MASTRA-005 |
| **MASTRA-007** Events MVP Runtime | Full event discovery + ticket purchase via Mastra agents | 🔴 Not Started | 5% | Doc `007` written | Not implemented | Implement after MASTRA-005 |
| **MASTRA-008** Restaurants MVP Discovery | Restaurant discovery agent | 🔴 Not Started | 5% | Doc `008` written | Not implemented | Implement after MASTRA-006 |
| **OpenClaw** | Gateway adapter; WhatsApp routing; VPS provisioning | 🔴 Not Started | 5% | 8 prompt files in `tasks/prompts/openclaw/` | No Mastra agent | Implement `05H-openclaw-gateway-adapter.md` |
| **Hermes** | Intelligence scoring; ranking; advisory reasoning | 🔴 Not Started | 5% | 6 prompt files in `tasks/prompts/hermes/` | No Mastra agent | Implement `05D-hermes-local-adapter.md` |
| **Paperclip** | CEO approval gateway; budget governance | 🔴 Not Started | 5% | Prompt files in `tasks/prompts/paperclip/` | No Mastra agent | Implement `020-mastra-paperclip-approval-bridge.md` |
| **Postiz** | Social media scheduler; campaign management | 🔴 Not Started | 5% | 5 prompt files in `tasks/prompts/postiz/` | No Mastra agent | Implement `16B-postiz-campaign-cancel-edge-fn.md` |

### B3 — Workflows

| Workflow | Description | Status | % | ✅ Confirmed | ⚠️ Missing / Failing | 💡 Next Action |
|----------|-------------|--------|---|--------------|----------------------|----------------|
| **rental-search-workflow** | 3-step: search → format → rerank | 🟢 Completed | 85% | Smoke passes; "Best for" labels; source=supabase | No per-step error handling; no `.parallel()` | Add try/catch per step |
| **event-discovery-workflow** | 2-step: fetch → format | 🟢 Completed | 85% | Smoke passes | No per-step error handling | Add try/catch |
| **concierge-routing-workflow** | classify → branch → execute | 🟡 In Progress | 75% | Registered in Studio | Not in smoke suite; branch logic untested vs live data | Add smoke probe |
| **MASTRA-012** Workflow State Runtime | Persistent state; resume after crash | 🔴 Not Started | 5% | Doc exists | No implementation | Implement |
| **MASTRA-017** Workflow Recovery / DLQ | Dead-letter queue; retry; escalation | 🔴 Not Started | 5% | Doc `017` exists | No implementation | Implement |
| **MASTRA-018** Human Handoff Runtime | Escalation to human; notification | 🔴 Not Started | 5% | Doc `018` exists | No implementation | Implement |

### B4 — Tools

| Tool | Description | Status | % | ✅ Confirmed | ⚠️ Missing / Failing | 💡 Next Action |
|------|-------------|--------|---|--------------|----------------------|----------------|
| **`search-rentals`** | Supabase `apartments` query + pg Pool | 🟢 Completed | 80% | source=supabase confirmed; 19 fields returned; mock fallback | No audit wrapper; no semantic search | Wire `audit-wrapper.ts` |
| **`search-events`** | Supabase `events` query | 🟡 In Progress | 75% | Returns live data | No audit wrapper | Wire audit-wrapper |
| **`search-restaurants`** | Supabase `restaurants` query | 🟡 In Progress | 70% | Returns data | No audit wrapper | Wire audit-wrapper |
| **`search-attractions`** | Supabase `attractions` query | 🟡 In Progress | 70% | Returns data | No audit wrapper | Wire audit-wrapper |
| **`audit-wrapper.ts`** | Tool logging middleware | 🟡 In Progress | 30% | File exists | Not applied to any tool | Apply to all 4 search tools |
| **`registry.ts`** | Shared tool registry | 🟡 In Progress | 40% | File exists | Agents don't import from it | Migrate |
| **MASTRA-003** Tool audit DB table | `ai_tool_audit_events` migration | 🔴 Not Started | 0% | — | Table doesn't exist | Create migration |
| **MASTRA-004** Hybrid Search Tools | Wrap `hybrid_search_*` RPCs (VDB-01 ready) | 🔴 Not Started | 0% | Doc `004` exists; RPCs live in Supabase | No Mastra tool wrapping RPCs | Implement from doc |
| **MASTRA-016** Streaming UI State | Typed SSE event contracts | 🔴 Not Started | 5% | Doc `016` exists | No typed event enum | Implement |
| **M22-03** lastIntent enum extension | Add `restaurant` + `attraction` intents to memory enum | 🔴 Not Started | 0% | Bug confirmed in audit | Enum too narrow | Fix `concierge.ts` memory schema |
| **M22-04** `freeOnly` routing | Wire `freeOnly` filter through workflow → attraction tool | 🔴 Not Started | 0% | Bug confirmed | Not wired | Fix routing workflow |
| **M22-05** Price field constraints | Add `.positive()` to agent working-memory price fields | 🔴 Not Started | 0% | Bug confirmed | No validation | Fix schema |
| **M22-06** Unit tests for `classifyDeterministic` | Regression tests for intent classifier | 🔴 Not Started | 0% | Bug confirmed | No tests | Add Vitest spec |
| **M22-08** `source_url` → `sourceUrl` alignment | Rental card field name mismatch | 🔴 Not Started | 0% | Bug confirmed in CodeRabbit | Card renders wrong field | Fix `rental-search-workflow` formatter |
| **M22-09** `bedrooms` in cardSchema | Reranker reads regex on subline instead of typed field | 🔴 Not Started | 0% | Bug confirmed | Reranker fragile | Fix `cardSchema` |

### B5 — Memory & RAG

| Task | Description | Status | % | ✅ Confirmed | ⚠️ Missing / Failing | 💡 Next Action |
|------|-------------|--------|---|--------------|----------------------|----------------|
| **Concierge working memory** | Schema-typed Zod object; 7 fields; thread-scoped | 🟢 Completed | 100% | Multi-turn smoke passes; `lastRentalResults`, `selectedListingId` tracked | No semantic recall | Add `semanticRecall: { topK: 5 }` |
| **Rental-agent memory** | `lastMessages` + workingMemory for follow-up | 🔴 Not Started | 0% | Agent exists | Each call is stateless | `Memory({ options: { lastMessages: 10 } })` |
| **Event-agent memory** | Same pattern as rental-agent | 🔴 Not Started | 0% | Agent exists | Stateless | Same fix |
| **MASTRA-010** Memory + RAG MVP | Semantic recall; cross-session context | 🔴 Not Started | 10% | Doc `010` exists; concierge has basic memory | Semantic recall not configured | Implement from doc |
| **MASTRA-021** VDB Reconciliation | Sync local pgvector with remote Supabase | 🔴 Not Started | 5% | Doc `021` exists | No implementation | Implement after VDB-02 |
| **VDB-02** User Memory Pipeline | Per-user preferences across sessions | 🔴 Not Started | 0% | Prompt exists | Depends on MASTRA-010 | Implement after MASTRA-010 |
| **VDB-03** Semantic Query Cache | Cache embeddings for repeated queries | 🔴 Not Started | 0% | Prompt exists | Depends on VDB-01 ✅ | Implement |
| **VDB-04** Personalization | "For You" section from user history | 🔴 Not Started | 0% | Prompt exists | Depends on VDB-02 | After VDB-02 |
| **VDB-05** Gemini Embedding 2 | Upgrade to `gemini-embedding-2-002` | 🔴 Not Started | 0% | Prompt exists | Run last | After VDB-01–04 |

### B6 — Evaluation & Observability

| Task | Description | Status | % | ✅ Confirmed | ⚠️ Missing / Failing | 💡 Next Action |
|------|-------------|--------|---|--------------|----------------------|----------------|
| **`toolCallAppropriatenessScorer`** | Did agent call the right tool? | 🟡 In Progress | 80% | Registered; visible in Studio | References `weatherTool` (wrong — should be `get-weather`) | Fix tool ID reference |
| **`completenessScorer`** | Did response cover all questions? | 🟢 Completed | 90% | Registered; visible | Not yet run against rental/event queries | Run eval |
| **`translationScorer`** | LLM judge for non-English location handling | 🟢 Completed | 90% | Uses `openai/gpt-5-mini`; requires OPENAI_API_KEY | OpenAI key not always present | Document dependency |
| **DefaultExporter** | Traces via `ObservabilityPG` (Postgres) → Studio "Traces" tab | 🟢 Completed | 100% | Traces visible in Studio; verified: uses `@mastra/pg` ObservabilityPG, NOT DuckDB | `batchCreateLogs`/`batchCreateMetrics` WARN once (benign — only spans implemented); `flush()` needed before Vercel fn exit | Add `observability?.flush()` |
| **SensitiveDataFilter** | Strips API keys + tokens from spans | 🟢 Completed | 100% | Registered in observability config | — | None |
| **PinoLogger** | Structured JSON at info level | 🟢 Completed | 100% | Active | — | None |
| **MASTRA-011** Observability + Evals + Guardrails | OTLP; rental scorer; context-retention scorer; guardrails | 🔴 Not Started | 30% | Basic observability done; doc `011` exists | No OTLP; no rental scorer; no guardrails | Add rental-relevance LLM scorer |
| **OTLP exporter** | Ship traces to Grafana/Datadog | 🔴 Not Started | 0% | Not configured | Required for production | Add `OtlpExporter` |
| **ai_runs logging (Mastra)** | Write Mastra runs to Supabase `ai_runs` | 🔴 Not Started | 0% | `ai-chat` edge fn logs; Mastra does not | Dual logging gap | Add custom span processor |
| **PII sanitizer processor** | Strip emails/phones before Gemini | 🔴 Not Started | 0% | Pattern in best-practices doc | Compliance risk | Add `sanitizePiiProcessor` to concierge |

### B7 — Frontend Integration (MASTRA-019)

| Task | Description | Status | % | ✅ Confirmed | ⚠️ Missing / Failing | 💡 Next Action |
|------|-------------|--------|---|--------------|----------------------|----------------|
| **`@mastra/client-js` installed** | In `/home/sk/mde/package.json` | 🟢 Completed | 100% | `@mastra/client-js@1.17.1` ✅ | — | None |
| **`VITE_MASTRA_SERVER_URL`** | In frontend `.env` | 🟢 Completed | 100% | `http://localhost:4111` ✅ | Vercel env var not set yet | Set in Vercel dashboard |
| **`src/lib/mastra-client.ts`** | Bridge file with streaming callbacks | 🟢 Completed | 100% | `streamConcierge()` + `generateConcierge()` verified ✅ | — | None |
| **Wire `useChat.ts` → Mastra** | Feature-flag branch in `sendMessage()` → `POST /chat` with AI SDK SSE | 🟡 In Progress | 70% | `USE_MASTRA_CHAT` branch parses `text-delta` events; `memory: { thread, resource }` passed | `VITE_USE_MASTRA_CHAT` still `false` — live test + `true` flip needed (MASTRA-019C) | Flip flag to `true`, test streaming end-to-end, then retire legacy path |
| **Thread / resourceId wiring** | `resourceId` = uid; `threadId` = conversationId | 🟢 Completed | 100% | `requestBody.memory = { thread: conversation.id, resource: user.id }` in Mastra branch | — | None |
| **JWT verification on Mastra server** | Validate Supabase JWT before agents run | 🟢 Completed | 100% | `MastraAuthSupabase` with `authorizeUser: user => !!user?.id` wired production-only; dev/Studio unauthenticated | Production deploy needed to exercise path | Verify after Vercel deploy |
| **CORS restriction** | Lock Mastra to mdeai.co domain | 🔴 Not Started | 0% | Currently open | Must restrict before Vercel deploy | Add CORS config in `index.ts` server options |
| **Retire `useIntentRouter`** | Remove duplicate Supabase `ai-router` call | 🔴 Not Started | 0% | Mastra has router-agent | Two routers create inconsistency | After `VITE_USE_MASTRA_CHAT=true` confirmed stable |
| **`@mastra/deployer-vercel`** | Install for Vercel deployment | 🟢 Completed | 100% | Already installed + wired in Part A (session 1) | — | None |
| **`MASTRA_SERVER_URL` in Vercel** | Prod env var pointing to Mastra Vercel URL | 🔴 Not Started | 0% | Not set | Frontend hits localhost in prod | Set after Vercel Mastra deploy succeeds |

### B8 — Editor (Prompt Architecture 031–035)

| Task | Description | Status | % | ✅ Confirmed | ⚠️ Missing / Failing | 💡 Next Action |
|------|-------------|--------|---|--------------|----------------------|----------------|
| **MASTRA-031** Editor Prompt Architecture | Agent config in MastraEditor; Draft → Published flow | 🟡 In Progress | 40% | `MastraEditor` registered; `concierge-agent` stored record in DB (status: published); `scripts/seed-editor-agents.sh` idempotent seeder created | No prompt blocks authored yet; rental-agent/event-agent need seeding run | Run `seed-editor-agents.sh`; publish first prompt version via Studio |
| **MASTRA-032** Prompt Block Library | Reusable prompt fragments (persona, guardrail, format) | 🔴 Not Started | 5% | Doc `032` exists | No blocks created | Create 3 core blocks |
| **MASTRA-033** Editor Seeding + Versioning | Seed initial published versions | 🔴 Not Started | 5% | Doc `033` exists | No seeds | Implement seeding script |
| **MASTRA-034** Runtime Preview + Context | Preview agent with test messages in Studio | 🔴 Not Started | 5% | Doc `034` exists | Not tested | Test in Studio playground |
| **MASTRA-035** Prompt QA Studio Workflow | QA checklist for prompt changes | 🔴 Not Started | 5% | Doc `035` exists | No workflow defined | Define reviewer process |

### B9 — MCP Servers

| Task | Description | Status | % | ✅ Confirmed | ⚠️ Missing / Failing | 💡 Next Action |
|------|-------------|--------|---|--------------|----------------------|----------------|
| **`@mastra/mcp-docs-server`** | Dev-time: agents query Mastra docs | 🔴 Not Started | 0% | Skill references it | Not installed | `codex mcp add mastra-docs -- npx -y @mastra/mcp-docs-server@latest` |
| **Google Maps MCP** | Directions + distance for concierge | 🔴 Not Started | 0% | `@googlemaps/mcp-server` available | No `MCPClient` configured | Add MCPClient |
| **Supabase MCP** | Agents query DB schema + run RPCs | 🔴 Not Started | 0% | Official MCP server available | Not wired | Wire after core agents stable |

---

### B10 — Vercel Deployment (verified 2026-05-11 against mastra.ai/guides/deployment/vercel)

> Official path confirmed. `DefaultExporter` verified Postgres-backed (NOT DuckDB — no blocker). `MastraAuthSupabase` wired. Auth package confirmed.

| Task | Description | Status | % | ✅ Confirmed | ⚠️ Missing / Failing | 💡 Next Action |
|------|-------------|--------|---|--------------|----------------------|----------------|
| **`@mastra/deployer-vercel` installed** | Vercel deployer package in `my-mastra-app/` | 🟢 Completed | 100% | `@mastra/deployer-vercel@1.1.26` installed; `VercelDeployer({ studio: true })` wired in `index.ts` | — | None |
| **`chatRoute()` wired** | Official AI SDK-compatible `/chat` endpoint | 🟢 Completed | 100% | `POST /chat` live; returns AI SDK SSE format; smoke verified `data: {"type":"start"...}` | — | None |
| **`@mastra/ai-sdk` installed** | Required for `chatRoute()` + `toAISdkStream()` | 🟢 Completed | 100% | `@mastra/ai-sdk@1.4.1` installed | — | None |
| **`@mastra/auth-supabase` installed** | JWT auth package for Mastra server | 🟢 Completed | 100% | `@mastra/auth-supabase@1.0.0` installed | Not wired yet (MASTRA-019B) — default checks `isAdmin` in `public.users` which mdeAI doesn't have | Wire with custom `authorizeUser` for mdeAI (any valid Supabase user = authorized) |
| **`DefaultExporter` uses Postgres (NOT DuckDB)** | Trace export via `ObservabilityPG` in `@mastra/pg` | 🟢 Completed | 100% | Verified: `DefaultExporter` → `ObservabilityStorage` → `ObservabilityPG` (Postgres). `@mastra/duckdb` is NOT imported anywhere. `batchCreateLogs`/`batchCreateMetrics` WARN once then self-disable (benign). | — | `observability?.flush()` before Vercel fn exits still needed |
| **`@ai-sdk/react ai` in frontend** | For official `useChat` + `DefaultChatTransport` pattern | 🟢 Completed | 100% | `@ai-sdk/react` + `ai` installed in `/home/sk/mde` | Full `useChat` hook migration deferred to MASTRA-019C | Feature-flag branch uses manual SSE parsing for now |
| **Migrate `useChat.ts` to AI SDK `useChat` hook** | Replace custom SSE parsing with AI SDK `useChat` hook | 🔴 Not Started | 0% | Pattern: `useChat({ transport: new DefaultChatTransport({ api: '...4111/chat', prepareSendMessagesRequest }) })` | mdeAI has custom `mdeai_actions` sidecar events that need `writer.custom()` migration; 400+ line rewrite | Tackle as MASTRA-019C after flag=true confirmed stable |
| **`MASTRA_SERVER_URL` in Vercel** | Prod env var for frontend to find Mastra | 🔴 Not Started | 0% | Not set in Vercel dashboard | Frontend hits localhost in prod | Set after Vercel Mastra deploy succeeds |
| **`MastraAuthSupabase` wired** | JWT verification on all Mastra endpoints | 🟢 Completed | 100% | `authorizeUser: async (user) => !!user?.id` overrides default `isAdmin` check; production-only conditional so Studio works locally | Only enforced in prod (NODE_ENV=production + env vars present) | Document in MASTRA-024 env boundary |
| **`observability?.flush()` on shutdown** | Ensure telemetry completes before Vercel fn exits | 🔴 Not Started | 0% | Required per official Vercel guide | Not implemented | Add graceful shutdown handler in `index.ts` |

**Vercel deploy commands (verified against official docs):**
```bash
# Step 1 — already done
# @mastra/deployer-vercel installed + VercelDeployer({ studio: true }) wired

# Step 2 — build
cd my-mastra-app && npx mastra build

# Step 3 — push to Git → Vercel auto-deploys
# Verify: curl https://<project>.vercel.app/api/agents

# Required env vars in Vercel dashboard:
# GOOGLE_GENERATIVE_AI_API_KEY   (Gemini API key)
# OPENAI_API_KEY                  (for translationScorer)
# DATABASE_URL                    (Supabase Session Pooler URL — NOT local 127.0.0.1)
# SUPABASE_URL                    (for MastraAuthSupabase JWT verification)
# SUPABASE_ANON_KEY               (for MastraAuthSupabase)
# NODE_ENV=production             (triggers MastraAuthSupabase conditional)
```

**Note on observability:** `DefaultExporter` uses `ObservabilityPG` from `@mastra/pg` (Postgres-backed). DuckDB is NOT used anywhere in this project. `batchCreateLogs` and `batchCreateMetrics` emit a one-time WARN then self-disable — this is a benign known limitation of `ObservabilityPG`. The only remaining action is adding `observability?.flush()` before Vercel function exits to ensure spans complete.

**Official AI SDK `useChat` pattern for mdeAI (two steps):**
```typescript
// Step 1 — Mastra server (already done — chatRoute wired in index.ts)
// POST /chat → concierge-agent with AI SDK SSE format

// Step 2 — Vite frontend (replaces custom useChat.ts SSE parsing)
// npm install @ai-sdk/react ai  (in /home/sk/mde)
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

const { messages, sendMessage } = useChat({
  transport: new DefaultChatTransport({
    api: import.meta.env.VITE_MASTRA_SERVER_URL + '/chat',
    prepareSendMessagesRequest({ messages }) {
      return {
        body: {
          messages: [messages[messages.length - 1]],  // send only latest
          memory: { thread: threadId, resource: userId },
        },
      };
    },
  }),
});
// mdeai_actions sidecar events migrate to: writer.custom({ type: 'mdeai_action', payload: ... })
// Tool states (input-available, output-available, output-error) built-in — no manual parsing needed
```

---

## PART C — Supabase Edge Function: `ai-chat` Review

> Is `supabase/functions/ai-chat/index.ts` 100% correct?  
> **Verdict: 85% production-ready.** Auth, rate limiting, tool calling, SSE streaming, and logging are solid. Gaps are improvements, not blockers.

| Component | Status | % | ✅ Correct | ⚠️ Issue / Gap |
|-----------|--------|---|-----------|----------------|
| CORS (OPTIONS preflight) | 🟢 | 100% | `getCorsHeaders(req)` + 204 | — |
| Auth — JWT + anon gate | 🟢 | 100% | JWT users + `X-Anon-Session-Id` (3 free/24h); `ANON_LIMIT_EXCEEDED` vs `RATE_LIMIT` differentiated | Anon ID is localStorage-resettable (MVP accepted risk) |
| Rate limiting | 🟢 | 100% | `allowRateDurable()` — 3 anon/24h, 10 authed/min; Durable Object per key | — |
| Zod validation | 🟢 | 100% | `sessionDataSchema` (80-char neighborhood cap, $0–100K budget) + `chatBodySchema` (8KB/msg, 20 msgs max) | — |
| Tool registry | 🟢 | 100% | `TOOLS` object + `toolsArrayFromRegistry` + `dispatchTool` — adding a tool = 1 entry | — |
| Tool execution (parallel) | 🟢 | 95% | `Promise.all()` on tool calls; phase narration ("Handing off to Rentals Concierge...") | No MAX_TOOL_ROUNDS guard; no per-tool timeout |
| SSE streaming | 🟢 | 100% | Phase events → actions sidecar → Gemini stream; correct `text/event-stream` headers | — |
| `ai_runs` logging | 🟢 | 100% | Real token counts from Gemini usage block; duration; anon skipped (NOT NULL guard) | Anon runs not logged → cost invisible |
| Propose-only booking | 🟢 | 100% | `create_booking_preview` never auto-confirms; "Reply 'confirm' to proceed" | — |
| Auth forwarding to rentals fn | 🟢 | 100% | Forwards caller's JWT; falls back to anon key | — |
| `capture_lead` tool | 🟢 | 90% | Inserts to `leads` via service client; returns `OPEN_LEAD_CAPTURED` action | Creates fresh `getServiceClient()` per call (minor extra pool connection) |
| Input caps (prompt injection guard) | 🟢 | 100% | `sessionDataSchema.passthrough()` locked to known keys; message content capped 8KB | — |
| Duplicate search tools | 🟡 | 60% | Both `search_apartments` and `rentals_search` registered | Two tools for the same intent confuse Gemini's tool selection — merge them |
| PII in logs | 🟡 | 70% | Rate-limit key uses userId (safe) | `console.log("Executing rentals_search with params:", params)` may log neighborhood/name PII |
| MAX_TOOL_ROUNDS guard | 🔴 | 0% | Not implemented | If Gemini loops on tool requests, no ceiling — potential infinite loop |
| Per-tool timeout | 🔴 | 0% | Not implemented | A hanging DB query blocks SSE stream indefinitely |
| Model name | 🟡 | 80% | `gemini-3-flash-preview` used | Mastra agents use `gemini-3.1-flash-lite-preview` — confirm both are valid model IDs |

**Top 3 fixes for `ai-chat` edge function:**
1. Add `MAX_TOOL_ROUNDS = 3` guard — bail after 3 tool round-trips
2. Merge `search_apartments` into `rentals_search` — one search tool, not two
3. Wrap `executeTool()` with `AbortSignal.timeout(10_000)` — kill hanging tool calls at 10s

---

## PART D — Overall Progress Summary

| Domain | Total Tasks | 🟢 Done | 🟡 In Progress | 🔴 Not Started | % Complete |
|--------|------------|---------|---------------|----------------|------------|
| Archived (completed) tasks | 25 | 25 | 0 | 0 | **100%** |
| Foundation / Env | 7 | 2 | 3 | 2 | **43%** |
| Agents (7 live + 8 planned) | 13 | 2 | 5 | 6 | **35%** |
| Workflows | 6 | 2 | 1 | 3 | **38%** |
| Tools + Bug Fixes (M22) | 15 | 2 | 4 | 9 | **27%** |
| Memory & RAG / VDB | 9 | 1 | 0 | 8 | **11%** |
| Evaluation & Observability | 10 | 5 | 1 | 4 | **55%** |
| Frontend Integration | 10 | 7 | 1 | 2 | **70%** |
| Editor (031–035) | 5 | 0 | 1 | 4 | **20%** |
| MCP Servers | 3 | 0 | 0 | 3 | **0%** |
| OpenClaw / Hermes / Paperclip / Postiz | 4 | 0 | 0 | 4 | **0%** |
| **Active tasks subtotal** | **82** | **21** | **16** | **45** | **32%** |
| **All tasks (incl. archived)** | **107** | **46** | **16** | **45** | **43%** |

---

## PART E — Recommended Execution Order (Next 10 Actions)

| Priority | Action | Effort | Impact | Unlocks |
|----------|--------|--------|--------|---------|
| 🔴 **1** | End-to-end test Mastra path: set `VITE_USE_MASTRA_CHAT=true`, send a chat message, confirm streaming; then flip back to `false` or leave if working | 30m | Revenue | MASTRA-019C |
| 🔴 **2** | Add CORS restriction to Mastra server (lock to mdeai.co) | 30m | Security | Vercel deploy |
| 🟠 **3** | Add memory to `rental-agent` + `event-agent` (`Memory({ options: { lastMessages: 10 } })`) | 30m | Quality | Follow-up retention |
| 🟠 **4** | Fix `toolCallAppropriatenessScorer` tool ID (`weatherTool` → `get-weather`) | 15m | Eval accuracy | MASTRA-011 |
| 🟠 **5** | Fix M22-08 (`source_url` → `sourceUrl`) + M22-09 (bedrooms in cardSchema) | 1h | Card rendering | Visual correctness |
| 🟠 **6** | Add `observability?.flush()` graceful shutdown handler | 30m | Observability | Vercel traces |
| 🟡 **7** | **MASTRA-003** Tool audit DB table + apply `audit-wrapper.ts` to 4 tools | 1d | Compliance | MASTRA-015 |
| 🟡 **8** | Add MAX_TOOL_ROUNDS guard to `ai-chat` edge fn | 1h | Stability | Production safety |
| 🟡 **9** | **MASTRA-004** Hybrid search tools (wrap `hybrid_search_*` RPCs) | 1d | Search quality | VDB-02 |
| 🟡 **10** | **MASTRA-005** Full concierge → router → workflows wire-up | 2d | P0 | C04, C05 |

---

## PART F — Production Readiness Checklist

| Gate | Status | Action |
|------|--------|--------|
| Smoke suite 8/8 | 🟢 Pass | None |
| `useChat.ts` Mastra branch wired | 🟡 Feature flag (flag=false) | Flip `VITE_USE_MASTRA_CHAT=true` + live test |
| JWT auth on Mastra | 🟢 Done (prod-only) | Verify after Vercel deploy |
| CORS locked to mdeai.co | 🔴 Not done | Add CORS config in `index.ts` |
| `@mastra/deployer-vercel` installed | 🟢 Done | None |
| `MASTRA_SERVER_URL` in Vercel | 🔴 Not done | Set in Vercel dashboard after deploy |
| DefaultExporter uses Postgres | 🟢 Done (verified) | Add `observability?.flush()` |
| OTLP traces to Grafana | 🔴 Not done | Add `OtlpExporter` |
| Rate limits at Mastra layer | 🔴 Not done | MASTRA-014 |
| Tenant isolation | 🔴 Not done | MASTRA-013 |

**Current gate score: 4/10 production-ready** (was 1/10 — JWT, deployer-vercel, DefaultExporter confirmed added this session).  
Critical path to production: flip flag → test → CORS config → Vercel deploy → set `MASTRA_SERVER_URL`.

---

*Auditor: Systems Architect · mdeai.co · 2026-05-11 (session 2)*  
*Sources: live file analysis · smoke suite results · ai-chat/index.ts code review · archive/ task files · notes/14-master-audit.md · session 2 changes: MastraAuthSupabase wired, useChat.ts feature-flag branch, @ai-sdk/react installed, DefaultExporter verified Postgres not DuckDB, seed-editor-agents.sh created*
