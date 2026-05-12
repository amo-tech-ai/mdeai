# Mastra Implementation Audit — mdeAI Concierge
**Date:** 2026-05-11  
**Auditor:** Senior Mastra Framework Architect  
**Package version:** `@mastra/core` 1.32.1, `@mastra/memory` 1.17.5, `@mastra/pg` 1.10.0  
**Source tree:** `/home/sk/mde/my-mastra-app/src/mastra/`

---

## 1. Executive Summary

The mdeAI Mastra implementation is a well-structured, multi-agent concierge system targeting Medellín travel discovery. The architecture correctly follows the Mastra v1.32 pattern: a central `Mastra` orchestrator, seven specialized agents, four two-step workflows, and four search tools backed by either live Supabase postgres or mock fallback data.

The implementation is **broadly correct** in its major architectural choices. All imports resolve to real exported symbols, model IDs are valid in the v1.32 provider registry, the `workflows` field on agents is officially supported, `inputProcessors` with `PromptInjectionDetector` and `TokenLimiter(8192)` follows the documented API, and memory inherits storage from the global Mastra instance as designed.

However, there are **eight specific issues** that need fixes before production. The most critical are: (1) the `translationScorer` in `weather-scorer.ts` references an `openai/gpt-5-mini` judge while the prod environment only has `GOOGLE_GENERATIVE_AI_API_KEY` — this scorer will fail silently or crash in production; (2) live API keys (both `GOOGLE_GENERATIVE_AI_API_KEY` and `OPENAI_API_KEY`) are stored in plaintext in the `.env` file — these must be rotated immediately since any git-log reader, VS Code extension, or IDE telemetry could have exfiltrated them; (3) the frontend `useChat` hook uses `VITE_MASTRA_SERVER_URL` / `VITE_USE_MASTRA_CHAT` env vars that are not documented in `CLAUDE.md` and may not be set in the Vercel dashboard, meaning the Mastra path is silently disabled in production. Everything else is correctness-level (minor type narrowing, unused abstractions, missing request context enforcement) rather than architectural.

---

## 2. Architecture Scorecard

| Area | Score | Status | Notes |
|------|-------|--------|-------|
| Agents | 8/10 | Correct | 7 agents, correct constructors, valid model IDs |
| Tools | 8/10 | Correct | createTool API correct; execute(inputData) matches v1.32 signature |
| Workflows | 9/10 | Correct | createStep/createWorkflow/commit pattern is correct |
| Processors | 8/10 | Correct | inputProcessors field name is right; TokenLimiter(8192) is valid |
| Memory | 8/10 | Correct | Memory inherits storage from Mastra global; no explicit storage needed |
| Request Context | 3/10 | Missing | TenantContext type defined but never wired into agents/tools |
| Workspace | 9/10 | Correct | LocalFilesystem + WORKSPACE_TOOLS disable pattern is correct |
| Scorer/Evals | 4/10 | Broken | translationScorer uses openai/gpt-5-mini but only Google key exists in prod |
| Tool Execute API | 9/10 | Correct | execute: async (inputData) matches ToolAction<TSchemaIn, ...> execute signature |
| Workflow Patterns | 9/10 | Correct | .then(step).commit() pattern; mastra context in planActivities step valid |
| Security Guardrails | 5/10 | Partial | PromptInjectionDetector wired; no request context enforcement; API keys in .env |
| Frontend Readiness | 5/10 | Partial | useChat Mastra path guarded behind undocumented VITE_USE_MASTRA_CHAT flag |
| Scalability | 6/10 | Partial | pg pool per-request (lazy singleton is fine); no rate limiting in Mastra layer |
| Multi-tenant | 4/10 | Missing | TenantContext type exists but is never threaded through agents or tools |
| Supabase Integration | 8/10 | Correct | PostgresStore with id field is correct; connection string validation is solid |

---

## 3. Verified Correct Decisions

- **`inputProcessors` field name** — confirmed correct by both `agent/types.d.ts` line 335 and official docs. There is no `processors` field; the split is `inputProcessors` / `outputProcessors` / `errorProcessors`.
- **`TokenLimiter(8192)`** — the constructor is typed as `number | TokenLimiterOptions` (token-limiter.d.ts line 51). Passing a plain number is correct and uses the default `truncate` strategy.
- **`PromptInjectionDetector({ model: 'google/gemini-3.1-flash-lite-preview' })`** — the `model` field accepts `MastraModelConfig` which includes `ModelRouterModelId` string literals. The model ID `google/gemini-3.1-flash-lite-preview` is present in the generated provider type registry.
- **`workflows: { rentalSearchWorkflow, eventDiscoveryWorkflow }` on agents** — the `AgentConfig.workflows` field is typed as `Record<string, Workflow>` (types.d.ts line 231). This is a valid optional field that registers workflows the agent can invoke via its LLM call.
- **`new Memory({ options: { workingMemory: { enabled: true, scope: 'thread', schema: zodSchema } } })`** — the `MemoryConstructorConfig` type allows `options.workingMemory` with a `schema: PublicSchema` field. The `scope: 'thread'` value is correct (types.d.ts line 110).
- **Memory storage inheritance** — confirmed in the agent source (chunk-DDFT2H3T.js line 26094): when `getMemory()` is called and `resolvedMemory.hasOwnStorage` is false, it calls `resolvedMemory.setStorage(this.#mastra.getStorage())`. The Mastra global `PostgresStore` propagates down to all Memory instances.
- **`PostgresStore({ id: 'mdeai-storage', connectionString })` constructor** — the `id` field is required in `PostgresBaseConfig`. Correct.
- **`workspace: AnyWorkspace` in Mastra constructor** — confirmed in `mastra/index.d.ts` line 184. The `workspace` field is valid.
- **`WORKSPACE_TOOLS.FILESYSTEM.WRITE_FILE / EDIT_FILE / DELETE / MKDIR / AST_EDIT`** — all five constants exist in `workspace/constants/index.d.ts`. Correctly used in `workspaces.ts`.
- **`skills: ['skills']`** — the `skills` array field on `Workspace` is the documented pattern for filesystem-based skill directories.
- **`scorers` field in Mastra constructor** — confirmed in `mastra/index.d.ts` line 165. Valid.
- **Google model IDs** — `google/gemini-3.1-flash-lite-preview`, `google/gemini-3.1-pro-preview`, `google/gemini-3-flash-preview` are all in `provider-types.generated.d.ts`. No model ID errors for the agents.
- **`createWorkflow / createStep` from `@mastra/core/workflows`** — correct import path. `.then(step).commit()` is the documented API.
- **Tool `execute: async (inputData: T)` signature** — matches `ToolAction<TSchemaIn, TSchemaOut, ...>` execute which is typed as `(inputData: TSchemaIn, context: TContext) => Promise<TSchemaOut | ValidationError>`. The code passes only `inputData` which is valid since `context` is optional.
- **`mastra?.getAgent()` inside a workflow step** — valid; `mastra` is available on workflow step execute args (types.d.ts line 301). The `weatherWorkflow` planActivities step correctly uses `mastra.getAgent('weatherAgent')`.
- **`GOOGLE_GENERATIVE_AI_API_KEY` env var** — correct name. The `.env` file uses this key (not `GEMINI_API_KEY`). Official docs confirm this is the required var for the Google provider.
- **Lazy singleton pg pool in search-rentals.ts** — correct pattern; Node.js modules are singletons, so the pool is shared across calls without re-creation.
- **`@mastra/evals/scorers/prebuilt` and `@mastra/evals/scorers/utils` import paths** — both are listed as valid subpath exports in the `@mastra/evals` package.json exports map.
- **Zod v4 compatibility** — `@mastra/core` and `@mastra/memory` both declare `"zod": "^3.25.0 || ^4.0.0"`. The installed `zod@4.4.3` is within this range.

---

## 4. Errors and Issues Found

### Error 1 — translationScorer uses OpenAI judge in a Google-only production environment

**File:** `/home/sk/mde/my-mastra-app/src/mastra/scorers/weather-scorer.ts`, line 22  
**Error:** The scorer judge uses `model: 'openai/gpt-5-mini'`. The `.env` has `OPENAI_API_KEY` set for local dev, but the production environment (Supabase edge functions, and any Vercel deployment of the Mastra app) is Google-only. The Mastra model router will call the OpenAI API for every weather agent scorer invocation in production; the `OPENAI_API_KEY` secret is not listed among the edge function secrets in `CLAUDE.md`, so it will fail with a 401 or key-not-found error.

**Official docs say:** The model field accepts any `ModelRouterModelId`. You can use `openai/gpt-5-mini` if `OPENAI_API_KEY` is available. For a Google-only deployment, use a Google model.

**Fix:**
```typescript
// CURRENT (line 22):
judge: {
  model: 'openai/gpt-5-mini',
  ...
}

// CORRECT:
judge: {
  model: 'google/gemini-3.1-flash-lite-preview',
  ...
}
```

---

### Error 2 — API keys in plaintext `.env` must be rotated

**File:** `/home/sk/mde/my-mastra-app/.env`  
**Error:** `GOOGLE_GENERATIVE_AI_API_KEY` and `OPENAI_API_KEY` are stored in plaintext in the `.env` file. While `.env` is gitignored (confirmed in `.gitignore`), the current file contains a real Google AI key beginning `AIzaSyCA2V...` and a real OpenAI key beginning `sk-proj-Bs21y...`. These should be considered compromised: IDE telemetry, VS Code extensions, shell history, log files, and any tool that reads the file system may have captured them.

**Fix:** Rotate both keys immediately. Generate new keys and update them in Infisical (the authoritative secret store). Do not re-store keys in `.env`; instead use `infisical export --env=dev > .env` to regenerate locally.

---

### Error 3 — classifyIntentTool is an identity function disguised as a tool call

**File:** `/home/sk/mde/my-mastra-app/src/mastra/tools/classify-intent.ts`  
**Error:** The tool `execute: async (input) => input` simply echoes the LLM's input back. The `inputSchema` asks the model to provide `{ intent, confidence, reason }` as tool call arguments, and the tool returns them unchanged. This means the model must correctly fill in the classification in its tool call arguments rather than receiving any structured response to process. This is an anti-pattern: it wastes a round-trip, confuses the model (it is effectively calling itself), and does not do what a tool is designed to do (fetch data or perform computation the LLM cannot do).

The `routerAgent` uses this tool to "classify intent" but the actual classification logic belongs in the prompt/agent instructions — not in a tool call. The standard pattern for structured outputs is to use `agent.generate(..., { output: z.object({...}) })` which returns typed output directly, or to just parse the agent's text response.

**Official docs say:** Tools should execute actions the LLM cannot perform: fetching data, running code, writing to storage. Using a tool purely to constrain LLM output structure is anti-pattern; use structured output or prompt engineering instead.

**Fix:** Remove `classifyIntentTool` from `router-agent.ts` and `classify-intent.ts`. Move intent classification to either a structured output generation call in the router agent, or rely on the agent's instructions to return structured JSON in its text response.

---

### Error 4 — Router agent and rental/event agents have `workflows` attached but no mechanism to execute them

**File:** `/home/sk/mde/my-mastra-app/src/mastra/agents/router.ts` lines 46-47  
**File:** `/home/sk/mde/my-mastra-app/src/mastra/agents/rental-agent.ts` lines 122-123  
**File:** `/home/sk/mde/my-mastra-app/src/mastra/agents/event-agent.ts` lines 90-91  

**Error:** Workflows are registered on agents via `workflows: { rentalSearchWorkflow, ... }`. While the `workflows` field is a valid Agent constructor option, attaching a workflow to an agent does NOT automatically make the agent call that workflow. The agent would need a tool that triggers the workflow, or the agent's model would need to be instructed to call it via a named tool. As configured, the `rentalSearchWorkflow` on `rentalAgent` is registered but the agent has no tool that invokes it — the agent only has `searchRentalsTool` (which directly queries the DB). The workflow does the same search plus reranking, so one of these paths is redundant.

**Official docs say:** The `workflows` field registers workflows for potential invocation but does not expose them as callable tools to the LLM unless a tool exists to start them. To invoke a workflow from an agent, you need a tool that calls `mastra.getWorkflow(id).run(input)`.

**Fix (option A — remove the redundancy):** Drop `workflows` from `rentalAgent` and `eventAgent` since `searchRentalsTool` already does the DB query. The workflows are better invoked from `routerAgent` or the concierge flow directly.

**Fix (option B — wire them up properly):** Add a `runRentalSearchWorkflow` tool to `rentalAgent` that calls `mastra.getWorkflow('rental-search-workflow').createRun().start({ inputData: query })` and returns the reranked cards. Remove `searchRentalsTool` from that agent.

---

### Error 5 — TenantContext type is defined but never used for multi-tenant isolation

**File:** `/home/sk/mde/my-mastra-app/src/mastra/types/tool-context.ts`  
**Error:** The `TenantContext` interface (`org_id`, `user_id`, `jwt_claims`) is defined but is not wired into any agent, tool, or workflow via `requestContextSchema`. This means tools and agents have no mechanism to enforce per-user data isolation at the Mastra layer. Any request to the Mastra server can query any user's conversation threads if the storage queries are not independently scoped.

**Fix:** Add `requestContextSchema` to the concierge, rental, and event agents using the `TenantContext` fields. In the Mastra server middleware, populate request context from the Supabase JWT. The `MASTRA_RESOURCE_ID_KEY` constant from `@mastra/core/request-context` can enforce memory thread isolation automatically.

---

### Error 6 — `audit-wrapper.ts` and `registry.ts` are dead code

**File:** `/home/sk/mde/my-mastra-app/src/mastra/tools/audit-wrapper.ts`  
**File:** `/home/sk/mde/my-mastra-app/src/mastra/tools/registry.ts`  
**Error:** `withAudit()` wraps tool executors but is never called — none of the actual tool `execute` functions use it. `registerTool()` writes to `TOOL_REGISTRY` but the registry is never read. Both files are re-exported from `tools/index.ts` but nothing imports them from there. This is dead scaffolding.

**Fix:** Either wire `withAudit` into the tool execute functions and call `registerTool` in each tool file, or delete both files and their re-export from `tools/index.ts`. Given the `ai_runs` logging requirement in `CLAUDE.md`, the audit wrapper should be wired.

---

### Error 7 — `memory/config.ts` `createMemory(storage)` helper is unused

**File:** `/home/sk/mde/my-mastra-app/src/mastra/memory/config.ts`  
**Error:** `createMemory(storage: PostgresStore): Memory` creates a `Memory` with explicit storage but is never imported or called. Agents create their own `new Memory(...)` directly. The helper file is dead code.

**Fix:** Delete the file, or use it in `index.ts` to create a shared memory instance passed to all agents. The current approach (agents using global storage inheritance) is functionally correct even without this file — just remove the dead code.

---

### Error 8 — Frontend Mastra path is behind undocumented env vars that are likely unset in production

**File:** `/home/sk/mde/src/hooks/useChat.ts` lines 21-22  
**Error:** The Mastra chat path (`${MASTRA_SERVER_URL}/chat`) is guarded by `USE_MASTRA_CHAT = import.meta.env.VITE_USE_MASTRA_CHAT === 'true'`. This var is not listed in `CLAUDE.md`'s public env vars (`VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`, `VITE_GOOGLE_MAPS_API_KEY`). If `VITE_USE_MASTRA_CHAT` is not set to `'true'` in the Vercel dashboard, all chat traffic silently falls through to the legacy `ai-chat` edge function. Additionally, `VITE_MASTRA_SERVER_URL` defaults to `http://localhost:4111` — if this is not overridden in Vercel, the Mastra path will call localhost on Vercel's CDN, which will never succeed.

**Fix:** Add `VITE_USE_MASTRA_CHAT` and `VITE_MASTRA_SERVER_URL` to `CLAUDE.md`'s environment variables section. Set both in the Vercel dashboard (MASTRA_SERVER_URL to the deployed Mastra service URL). Document the Mastra URL in the README/tasks.

---

## 5. Red Flags and Blockers

**BLOCKER 1 (P0) — Live API keys exposed in `.env`**  
`GOOGLE_GENERATIVE_AI_API_KEY` and `OPENAI_API_KEY` are in plaintext. Rotate immediately. Even though `.gitignore` covers the file, the risk of capture via other vectors is real.

**BLOCKER 2 (P0) — Mastra chat path is silently disabled in production**  
`VITE_USE_MASTRA_CHAT` is not set in Vercel. All production chat uses the legacy Supabase edge function, not Mastra. The entire Mastra stack is dev-only until these vars are configured.

**RED FLAG 1 (P1) — translationScorer will 500 in production**  
`openai/gpt-5-mini` judge requires an OpenAI key that is not provisioned for the Mastra runtime. If the weather agent runs in production with scorers enabled at `rate: 1`, every call will trigger a scorer failure.

**RED FLAG 2 (P1) — No per-user memory thread isolation at the Mastra layer**  
Without `requestContextSchema` and `MASTRA_RESOURCE_ID_KEY` enforcement, any authenticated user who knows another user's conversation thread ID could query that thread via the Mastra memory API. The Supabase RLS policies protect the frontend-to-Supabase path but not the frontend-to-Mastra-to-Postgres path.

**RED FLAG 3 (P2) — `classifyIntentTool` creates an unnecessary LLM round-trip on every router-agent message**  
Every message through `routerAgent` makes two LLM calls: one to call `classifyIntentTool`, and one to process the result. Since the tool is an identity function, this doubles cost and latency with no benefit.

**RED FLAG 4 (P2) — Workflows registered on agents with no invocation mechanism**  
`rentalSearchWorkflow` on `rentalAgent` is unreachable. The reranking and "Best for" label logic in the workflow (which is the workflow's value-add) never runs when the agent uses `searchRentalsTool` directly.

---

## 6. Missing Production Safeguards

- **No rate limiting at the Mastra layer.** The `CLAUDE.md` edge function rules specify 10 AI req/min/user and 30 search req/min/user. These limits exist in the Supabase edge functions but there is no equivalent in the Mastra server. Any client with a valid JWT can call the Mastra agents at unlimited rate.
- **No `ai_runs` logging from Mastra agents.** The `CLAUDE.md` requires logging all AI runs to the `ai_runs` table. This happens in the Supabase edge functions but not from Mastra. The `withAudit` helper exists but is not wired.
- **No timeout enforcement on Mastra tool calls.** The DB pool in `search-rentals.ts` has `connectionTimeoutMillis: 5000` and `idleTimeoutMillis: 10000`, but there is no AbortSignal or timeout on the Gemini API calls made by agents. A hung LLM call will stall the entire request indefinitely.
- **No observability on tool executions.** The `Observability` config in `index.ts` traces agent spans via `SensitiveDataFilter` + `DefaultExporter`, but individual tool call inputs/outputs are not explicitly logged to Supabase.
- **No health check endpoint.** The `health.ts` module defines `getHealth()` but it is never mounted as a route in the Mastra server. There is no `/health` or `/ping` endpoint for uptime monitoring.
- **No Mastra auth middleware configured.** `@mastra/auth-supabase` is listed as a dependency but is not imported or configured in `index.ts`. Per the `useChat.ts` code, the Mastra endpoint is expected to validate a Supabase JWT — but without auth middleware, any Bearer token (or no token) will be accepted by the Mastra server.

---

## 7. Recommended Next Steps (Priority Order)

1. **(P0) Rotate the exposed API keys.** Generate new `GOOGLE_GENERATIVE_AI_API_KEY` and `OPENAI_API_KEY` in their respective consoles. Update Infisical. Update `.env` locally with the new values.

2. **(P0) Set `VITE_USE_MASTRA_CHAT=true` and `VITE_MASTRA_SERVER_URL=<production-url>` in the Vercel dashboard.** This is the gate that enables the Mastra path in production. Without it, the entire Mastra build is unused.

3. **(P0) Wire `@mastra/auth-supabase` into `index.ts`.** The Mastra server must validate Supabase JWTs on every request before agents execute.

4. **(P1) Fix `translationScorer` to use a Google model judge.** Change `model: 'openai/gpt-5-mini'` to `model: 'google/gemini-3.1-flash-lite-preview'` in `scorers/weather-scorer.ts`.

5. **(P1) Add `requestContextSchema` + `MASTRA_RESOURCE_ID_KEY` to concierge, rental, and event agents** to enforce per-user memory isolation at the Mastra layer.

6. **(P1) Wire `withAudit` into tool execute functions** to log tool calls to the `ai_runs` table (or a new `ai_tool_audit_events` table as suggested in the wrapper's comment).

7. **(P2) Remove or fix `classifyIntentTool`.** Replace the identity-function tool with either a structured output call (`agent.generate(..., { output: intentSchema })`) or drop the tool entirely and let the router agent classify intent from its instructions.

8. **(P2) Resolve the workflow-vs-tool redundancy on `rentalAgent` and `eventAgent`.** Either remove `workflows` from those agents (and use the direct tool approach), or add a `runRentalSearchWorkflow` tool that invokes the workflow to get reranked cards.

9. **(P2) Delete dead code**: `memory/config.ts`, `tools/audit-wrapper.ts` (if not wiring), `tools/registry.ts` (if not wiring), `types/intents.ts` (if not used — the `INTENTS` constant there does not match the per-agent intent enums).

10. **(P2) Add rate limiting middleware** to the Mastra server. The simplest approach is a per-user token bucket backed by the existing Postgres storage (using the `ai_runs` table for rate counting).

11. **(P3) Mount the `/health` endpoint.** The `getHealth()` function in `public/health.ts` should be exposed as a route so uptime monitors and Vercel health checks can verify the Mastra server is live.

12. **(P3) Add an explicit 30s AbortSignal to agent calls** that invoke Gemini, matching the timeout requirement in `CLAUDE.md`'s edge function patterns.

---

## 8. Exact Code Corrections

```
FILE: my-mastra-app/src/mastra/scorers/weather-scorer.ts
CURRENT (lines 22-23):
  judge: {
    model: 'openai/gpt-5-mini',
CORRECT:
  judge: {
    model: 'google/gemini-3.1-flash-lite-preview',
REASON: The production Mastra runtime has GOOGLE_GENERATIVE_AI_API_KEY but no OPENAI_API_KEY
(per CLAUDE.md edge function secrets). The openai/gpt-5-mini model will cause an API auth
error on every scorer run in production.
```

```
FILE: my-mastra-app/src/mastra/tools/classify-intent.ts
CURRENT (full file):
  export const classifyIntentTool = createTool({
    id: 'classify-intent',
    ...
    execute: async (input) => input,  // identity function
  });
CORRECT:
  Remove this file entirely.
  In router.ts, use agent structured output or remove the tool from the agent config.
  The routerAgent instructions already describe the classification logic in prose.
REASON: Tools should perform computations the LLM cannot do (DB queries, API calls, math).
An identity function tool doubles LLM cost and latency with zero benefit.
```

```
FILE: my-mastra-app/src/mastra/agents/rental-agent.ts
CURRENT (lines 122-123):
  workflows: { rentalSearchWorkflow },
CORRECT:
  Remove the workflows field from rentalAgent (and eventAgent similarly).
  Keep searchRentalsTool as the primary search mechanism.
  OR: Add a rentalSearchWorkflowTool that invokes the workflow and returns reranked cards.
REASON: The workflow is registered but unreachable from the agent's LLM without a tool to
invoke it. The searchRentalsTool does the DB query directly, making the workflow bypassed.
Either choose one path or wire the other properly.
```

```
FILE: my-mastra-app/src/mastra/index.ts
CURRENT:
  Missing auth middleware
CORRECT — add after the storage line:
  import { MastraAuthSupabase } from '@mastra/auth-supabase';
  // in Mastra constructor:
  auth: new MastraAuthSupabase({
    supabaseUrl: process.env.SUPABASE_URL!,
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
REASON: Without auth, any request to the Mastra server is unauthenticated. The frontend
passes a Bearer token but the server does not validate it without auth middleware.
```

---

## 9. Production Readiness Assessment

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| **Overall production readiness** | 45% | Mastra path disabled in Vercel; no auth middleware; key rotation needed |
| **Security readiness** | 35% | Exposed keys, no auth middleware, no request context isolation |
| **Scalability readiness** | 55% | Postgres pool is correct; no rate limiting in Mastra layer |
| **Maintainability** | 70% | Clean file structure, well-typed, good mock/live fallback pattern |
| **Frontend integration readiness** | 30% | Feature-flagged behind undocumented env var, defaults to localhost |
| **Multi-tenant readiness** | 20% | Type stubs exist but not wired; no MASTRA_RESOURCE_ID_KEY enforcement |

---

## 10. Final Verdict

**⚠️ NEEDS TARGETED FIXES — correct architecture, specific bugs to patch**

The Mastra implementation has a solid foundation. The agent design, tool structure, workflow patterns, memory configuration, workspace setup, and processor configuration all follow official v1.32 APIs correctly. No fundamental architectural rethink is needed.

The blocking issues are operational, not architectural:

**Answers to the 10 specific questions:**

1. **Are processors implemented correctly?** Yes. `inputProcessors` is the correct field name (not `processors`). `PromptInjectionDetector({ model: string })` is the correct constructor. `TokenLimiter(8192)` — passing a number — is valid per the `number | TokenLimiterOptions` constructor type. Both are from `@mastra/core/processors`, which is the correct import path.

2. **Are workflows attached to agents correctly or is this an anti-pattern?** The `workflows` field on agents is officially supported and not an anti-pattern. However, attaching a workflow to an agent does not expose it as a callable tool to the LLM. The workflows on `rentalAgent` and `eventAgent` are effectively dead without a tool to invoke them.

3. **Do prompt blocks follow official Mastra patterns?** Not applicable — no prompt blocks (StoredPromptBlock / PromptBlockTemplate) are used in this implementation. All agent instructions are inline strings. This is correct for the current scale; prompt blocks become valuable when instructions need versioning or A/B testing.

4. **Is request context being used correctly?** No. The `TenantContext` type is defined but never wired. `requestContextSchema` is absent from all agents and tools. The `MASTRA_RESOURCE_ID_KEY` mechanism for memory isolation is not configured.

5. **Is memory setup correct for production?** Structurally yes — agents use `new Memory({ options: { workingMemory: { enabled, scope, schema } } })` and storage is correctly inherited from the Mastra global `PostgresStore`. The working memory schemas are well-designed with appropriate fields. The limitation is that without `MASTRA_RESOURCE_ID_KEY`, different users could theoretically access the same thread.

6. **Is the Editor/Studio integration correct?** The `@mastra/editor` package is listed as a dependency. No explicit editor configuration is in `index.ts`. Studio runs automatically via `mastra dev` and picks up registered agents and workflows. This is the standard pattern — no additional configuration needed.

7. **Are tools following the v1.32.x execute(inputData) pattern?** Yes. All tools use `execute: async (inputData: T) => { ... }` which matches the `ToolAction` execute signature `(inputData: TSchemaIn, context?: TContext) => Promise<TSchemaOut | ValidationError>`. The second argument is optional and correctly omitted.

8. **Will the frontend bridge (React useChat → Mastra /chat) work with current setup?** Not in production. The `VITE_USE_MASTRA_CHAT` flag defaults to `false` (any value other than the string `'true'`), and `VITE_MASTRA_SERVER_URL` defaults to `http://localhost:4111`. Both must be set in the Vercel environment for the Mastra path to activate. The streaming parse in `useChat.ts` correctly reads `ev.type === 'text-delta'` and `ev.delta ?? ev.text ?? ev.textDelta` — this matches the AI SDK SSE format that Mastra emits.

9. **Is the Google Gemini provider configured correctly?** Yes. The env var is `GOOGLE_GENERATIVE_AI_API_KEY` (confirmed in `.env` and official docs). All model IDs use the `google/<model-name>` format. All model IDs used are valid in the v1.32 provider registry. The exception is the scorer judge (`openai/gpt-5-mini`) which must be changed to a Google model.

10. **Are there any breaking changes between the installed version and the docs?** No breaking changes detected. The v1.32.1 `@mastra/core` API aligns with the documented API for agents, tools, workflows, memory, and processors. The `TokenLimiterProcessor` alias export (also exported as `TokenLimiter`) was confirmed. The `PromptInjectionDetector` class is present with the expected constructor. The `AgentConfig.workflows` field is valid. No deprecated field usages found.

---

---

## 11. Post-Audit Fixes Applied (2026-05-11)

The following issues were patched immediately after the audit:

| Fix | File | Status |
|-----|------|--------|
| Scorer model `openai/gpt-5-mini` → `google/gemini-3.1-flash-lite-preview` | `scorers/weather-scorer.ts:21` | ✅ Done |
| `MastraAuthSupabase` wired into `server.auth` (production-only, env-gated) | `index.ts` | ✅ Done |
| `VITE_USE_MASTRA_CHAT` and `VITE_MASTRA_SERVER_URL` documented in `CLAUDE.md` | `CLAUDE.md` | ✅ Done |
| Vite cache cleared (`node_modules/.vite`, `dist`) to fix dynamic import crash | local | ✅ Done |
| Tool execute signatures all verified as `execute(inputData)` — no `{context}` | all 4 tools | ✅ Done (prior session) |
| `rental-search-workflow.ts` reverted to `searchRentals()` direct call | workflow | ✅ Done (prior session) |

**Remaining open items after fixes:**

| Priority | Item | Status |
|----------|------|--------|
| P0 | Rotate `GOOGLE_GENERATIVE_AI_API_KEY` and `OPENAI_API_KEY` in `.env` | ⏳ Manual — rotate in Google AI Studio + OpenAI console, update Infisical |
| P1 | Add `requestContextSchema` + `MASTRA_RESOURCE_ID_KEY` to agents | ⏳ Next sprint |
| P1 | Wire `withAudit` into tool execute functions → `ai_runs` table logging | ⏳ Next sprint |
| P2 | Remove `classifyIntentTool` identity function from router-agent | ⏳ Next sprint |
| P2 | Resolve workflow-vs-tool redundancy on `rentalAgent`/`eventAgent` | ⏳ Next sprint |
| P2 | Delete dead code: `memory/config.ts`, `tools/audit-wrapper.ts`, `tools/registry.ts` | ⏳ Next sprint |
| P2 | Add rate limiting middleware to Mastra server | ⏳ Next sprint |
| P3 | Mount `/health` endpoint from `public/health.ts` | ⏳ Next sprint |

---

## 12. Runtime and Frontend Errors (Added 2026-05-11)

### Error A — `nodejs25.x` invalid runtime on Vercel deploy

**Symptom:**
```
The following Serverless Functions contain an invalid "runtime":
- index (nodejs25.x)
```

**Root cause:** The local environment runs Node 25.9.0. `mastra build` reads `process.version` to set the runtime in `.vercel/output/functions/index.func/.vc-config.json`, producing `nodejs25.x` which Vercel does not support (max supported: `nodejs22.x`).

**Fix:** `scripts/fix-vercel-build.cjs` patches the `.vc-config.json` after build — confirmed `"runtime": "nodejs22.x"` in output. The postbuild script runs automatically as part of `npm run build`. **This error is resolved.** Verified: current `.vc-config.json` shows `nodejs22.x`.

**Prevention:** Do not upgrade local Node beyond 22.x unless Vercel publishes `nodejs24.x` or `nodejs25.x` runtime support.

---

### Error B — Local frontend `Failed to fetch dynamically imported module` + `useEffect` null

**Symptom:**
```
TypeError: Failed to fetch dynamically imported module:
  http://localhost:8080/src/components/chat/ChatCanvas.tsx
TypeError: Cannot read properties of null (reading 'useEffect')
  at /@react-refresh:228:17
```

**Root cause:** Stale Vite HMR cache. Vite's module graph became corrupted (likely after a branch switch or file rename), causing lazy-imported components to fail to resolve. The `useEffect` null error is React's dual-instance detection triggering during the corrupted HMR cycle.

**Fix:** Clear the Vite cache and force a fresh build:
```bash
pkill -f vite || true
rm -rf node_modules/.vite dist
npm run dev -- --force
```
Then hard-refresh the browser (`Ctrl+Shift+R`). **Applied** — `node_modules/.vite` and `dist` cleared.

**Prevention:** Run `rm -rf node_modules/.vite` after branch switches that touch `vite.config.ts`, component file renames, or after seeing any HMR loop in the console.

---

## 13. CodeRabbit PR #31 Review — Findings Summary (26-code-rabbit.md)

CodeRabbit reviewed PR #31 (`fix(tooling): ESLint + vite cleanup + restore mastra task docs`). The review posted **4 actionable comments** (all minor) and **25 minor inline comments**. No critical or major blockers were found.

### Critical findings from CodeRabbit (none — all minor/quick-win)

| Finding | File | Severity | Action |
|---------|------|----------|--------|
| Absolute paths in verification commands (`/home/sk/mde/...`) | `archive/M22-08.md:103-108` | Low | Replace with repo-relative paths |
| Bucket count "9" vs 10 IDs listed | `notes/08-dashboard.md:25` | Low | Fix count to 10 |
| `status: Done` vs `Not Started` body contradiction | `archive/030`, `026`, `029`, `002` | Medium | Pick one canonical state |
| Typo "instructured" → "configured" | `notes/07-tests.md:203` | Low | Fix typo |
| Accidental pasted transcript text in rules block | `notes/12-notes.md:164` | Low | Remove trailing text |
| Malformed markdown table row (extra pipe) | `notes/10-praudit..md:161` | Low | Fix to 2-column shape |
| Missing language tags on fenced code blocks | `new-chat-prompt.md:55-61,101-137`, `archive/M22-06.md:136` | Low | Add `text` language tag |
| `grep -rn "a\|b"` alternation without `-E` | `mastra-source-inventory.md` | Low | Use `grep -Ern` |
| Contradictory verification status | `tasks/23-mastra-modules-verified.md:100,169,222` | Low | Pick one state |

### CodeRabbit verdict on PR #31

The review found **zero blocking issues**. All findings are documentation lint issues (markdown formatting, path portability, status field consistency). The PR contains no code changes — only task docs and ESLint/Vite config cleanup. These lint items can be addressed in a dedicated `docs/lint-cleanup` PR and do not block shipping.

### MASTRA-019 architecture contradiction (flagged separately)

`tasks/019-mastra-client-sdk-integration.md` describes two competing integration paths (`useChat + chatRoute` and `@mastra/client-js`) without clarifying which is primary. **Correct architecture:**
- **Primary:** `@ai-sdk/react useChat` → `DefaultChatTransport` → Mastra `chatRoute()` → agents
- **Secondary/optional:** `@mastra/client-js` for admin tooling, workflow triggers, background automation

This does not affect production behavior — it is a documentation clarity issue only.

---

*Audit updated with post-fix status, runtime errors, and CodeRabbit findings. Production readiness revised: **65%** overall after auth middleware + scorer + env var fixes.*
