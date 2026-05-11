---
title: Mastra Repos & Templates — mdeAI Reuse Analysis
status: Reference
created: 2026-05-10
scope: Which patterns from 12 Mastra repos/templates are worth stealing, and how they map to the MASTRA-001–019 task ladder
---

# Mastra Repos & Templates — mdeAI Reuse Analysis

> **How to use this doc:** Before starting any MASTRA task, check the "Maps to tasks" column. Read the linked repo section for specific patterns to adapt. Never copy code verbatim — adapt for Supabase + Gemini + tenant isolation. The "NOT to take" notes are as important as the reuse notes.

---

## Quick Reference — Priority Map

| Priority | Repo / Template | MASTRA Tasks Fed | Take |
|----------|----------------|-----------------|------|
| 🔴 P0 | `mastra-ai/mastra` (core) | 002, 003, 005, 006, 007, 008, 011, 012, 015 | Agent structure, createTool, createWorkflow, scorer patterns |
| 🔴 P0 | Deep Search (`template-deep-search`) | 005, 006, 008, 012, 017 | Self-eval loop, suspend/resume, recursive search workflow |
| 🔴 P0 | Research Coordinator guide | 005, 018 | Supervisor+subagent handoff, `onDelegationStart`, context budget |
| 🔴 P0 | WhatsApp guide | WhatsApp workflow, 018 | 3-step pipeline, Zod output segments, thread memory |
| 🟡 P1 | UI Dojo (`mastra-ai/ui-dojo`) | 009, 016, 019 | Streaming UI, generative cards, tool-call rendering |
| 🟡 P1 | AI SDK UI guide | 016, 019 | `useChat` + `DefaultChatTransport`, partial render pattern |
| 🟡 P1 | Text-to-SQL template | 015, 013, 003 | Safe query construction, schema introspection, allowlist enforcement |
| 🟡 P1 | Docs Chatbot template | 010 | RAG chunking, source attribution, MCP-connected agent |
| 🟡 P1 | Mastra Triage (`mastra-triage`) | 005, 018 | Intent routing, escalation, handoff architecture |
| 🟡 P1 | Multi-Agent Systems guide | 005, 006, 007, 008 | Coordinator pattern, context budget, delegation lifecycle |
| 🟢 P2 | Customer Feedback Summarization | 005, 011 | Structured Zod output, agent scorer wiring |
| ⬜ Skip | Browser Agent | — | OpenClaw handles execution; don't add a second browser runtime |
| ⬜ Skip | Template Coding Agent | — | Internal dev tooling only, not customer-facing |
| ⬜ Skip | Repo Base | — | Folder structure already done in MASTRA-002 |

---

## 1. Mastra Core Framework — `mastra-ai/mastra`

**What it is:** The official monorepo. Everything else builds on top of it. Most useful sections: `/examples/`, `/packages/core/src/`, and the agent/workflow/tool source.

### Take — Agent structure

Every agent in mdeAI follows this exact constructor shape from core:

```typescript
// Pattern from @mastra/core/agent
export const realEstateAgent = new Agent({
  id: 'real-estate-agent',         // snake-case, stable across deploys
  name: 'Real Estate Agent',
  instructions: `...`,              // plain English, no code
  model: 'google/gemini-2.0-flash', // via Vercel AI Gateway string
  tools: { searchRentals, createDraft, requestApproval },
  memory: configuredMemory,         // from memory/config.ts
  scorers: {                        // at least 1 quality scorer per agent
    responseQuality: { scorer: proposalQualityScorer, sampling: { type: 'ratio', rate: 0.25 } },
  },
});
```

Key rules from core patterns:
- `id` never changes after first deploy (breaks memory threads if it does)
- `tools` keys must be stable identifiers — they appear in tool call logs
- `scorers` sampling at 0.25 (1 in 4) balances quality signal vs cost
- `model` string uses `provider/model` format, not provider SDK imports

### Take — createTool pattern

The Zod-in/Zod-out contract from core is the entire tool safety boundary:

```typescript
// Pattern from @mastra/core/tools
export const searchRentalsTool = createTool({
  id: 'search_rentals',
  description: 'Search apartments by neighborhood, price, and features. Returns up to 10 results.',
  inputSchema: z.object({
    query: z.string().min(1).max(500),
    neighborhood: z.string().optional(),
    max_price_usd: z.number().positive().optional(),
    limit: z.number().int().min(1).max(20).default(10),
  }),
  outputSchema: z.object({
    results: z.array(RentalResultSchema),
    total: z.number(),
    search_id: z.string().uuid(),
  }),
  execute: async ({ context }) => {
    // context.input is fully typed by inputSchema
    // wrap with withAudit() — see MASTRA-003
  },
});
```

Rules from core:
- `description` must describe output shape, not just purpose — agents read this to pick tools
- `outputSchema` must match actual return — Mastra validates at runtime
- Tool IDs use `snake_case` (matches `ai_tool_audit_events.tool_name` column)

### Take — createWorkflow + createStep

Deep Search uses this pattern; core defines it. Use it verbatim for rental inquiry + ticket purchase workflows:

```typescript
const classifyIntent = createStep({
  id: 'classify-intent',
  inputSchema: z.object({ message: z.string(), user_id: z.string() }),
  outputSchema: z.object({ intent: IntentSchema, confidence: z.number() }),
  execute: async ({ inputData, mastra }) => { ... },
});

const workflow = createWorkflow({
  id: 'rental-inquiry',
  inputSchema: z.object({ message: z.string(), user_id: z.string() }),
  outputSchema: z.object({ response: z.string(), draft_id: z.string().nullable() }),
})
  .then(classifyIntent)
  .then(searchProperties)
  .then(generateResponse);

workflow.commit(); // required — seals the DAG
```

Suspend/resume for approval gates:
```typescript
const awaitApproval = createStep({
  id: 'await-approval',
  inputSchema: z.object({ draft_id: z.string() }),
  outputSchema: z.object({ approved: z.boolean() }),
  execute: async ({ inputData, suspend }) => {
    // suspend() pauses here — workflow_runs row stays 'suspended'
    // Supabase Realtime fires when human_handoffs.status changes
    const { approved } = await suspend({ reason: 'human_approval', draft_id: inputData.draft_id });
    return { approved };
  },
});
```

### Take — Scorer (eval) patterns

Three weather scorers exist in the scaffold. Adapt their shape for domain scorers:

```typescript
// From my-mastra-app/src/mastra/scorers/weather-scorer.ts — adapt, don't delete
// New domain scorers go in: scorers/intent-accuracy.ts, scorers/proposal-quality.ts
export const intentAccuracyScorer = createScorer({
  id: 'intent-accuracy',
  description: 'How accurately RouterAgent classified the intent.',
  scoring: async ({ input, output }) => {
    // input.expectedIntent vs output.classifiedIntent
    return { score: ..., reasoning: '...' };
  },
});
```

### NOT to take from core

- `examples/weather-agent` — placeholder only; delete after MASTRA-005 agent exists
- Any OpenAI-keyed models in examples — mdeAI uses `google/gemini-*` only
- LibSQL storage examples — already replaced in MASTRA-002
- `@mastra/cloudflare-workers` examples — mdeAI runs on Railway/Mastra Cloud, not Workers

**Maps to:** MASTRA-003, 005, 006, 007, 008, 011, 012, 015

---

## 2. UI Dojo — `mastra-ai/ui-dojo`

**What it is:** Reference app showing streaming generative UI, tool-call rendering, and loading states using `@mastra/client-js` + Vercel AI SDK UI. The most important frontend reference in the Mastra ecosystem.

### Take — Streaming chat transport

```typescript
// Adapt for src/lib/mastra/client.ts (Vite app — MASTRA-019)
import { MastraClient } from '@mastra/client-js';

export const mastraClient = new MastraClient({
  baseUrl: import.meta.env.VITE_MASTRA_URL,
  // Pass Supabase JWT on every request — UI Dojo shows this pattern
  getHeaders: async () => ({
    Authorization: `Bearer ${await supabase.auth.getSession().then(s => s.data.session?.access_token)}`,
  }),
});
```

### Take — useChat with DefaultChatTransport

UI Dojo shows the transport wiring that connects `@mastra/client-js` to Vercel AI SDK's `useChat`:

```typescript
// In the chat component — MASTRA-016 / MASTRA-019
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from '@mastra/client-js';

const { messages, sendMessage } = useChat({
  transport: new DefaultChatTransport({
    client: mastraClient,
    agentId: 'concierge-agent',
  }),
});
```

### Take — Generative card rendering pattern

UI Dojo shows how to render tool call outputs as structured UI rather than text. This is the exact pattern for rental cards and event cards:

```typescript
// Tool output → structured card (MASTRA-009)
// When tool_name === 'search_rentals', render <RentalCard /> not raw JSON
// When tool_name === 'search_events', render <EventCard />
// Pattern: messages.filter(m => m.toolInvocations).map(renderToolCard)
```

### Take — Loading states for streaming

UI Dojo shows three states to implement:
1. `pending` — spinner, "Searching Medellín..."
2. `streaming` — partial text renders word-by-word
3. `tool-calling` — "Looking up properties..." skeleton card

### NOT to take from UI Dojo

- Next.js app directory structure — mdeAI uses Vite + react-router-dom v6
- `next/font` or `next/image` — N/A for Vite
- Any demo auth/session logic — mdeAI uses Supabase Auth

**Maps to:** MASTRA-009, 016, 019

---

## 3. Text-to-SQL Template

**What it is:** A Mastra agent that turns natural language into SQL queries with schema introspection and safety boundaries.

### Take — Allowlist enforcement pattern

This is the safety model for MASTRA-003's audit gateway and MASTRA-015's tool registry. The template enforces an allowlist of allowed table names and query types:

```typescript
// Adapt for mastra-tool-gateway (MASTRA-003)
const ALLOWED_TABLES = ['apartments', 'events', 'restaurants', 'profiles'] as const;
const ALLOWED_ACTIONS = ['search', 'read', 'create_draft', 'request_approval'] as const;

function validateToolRequest(action: string, entity: string) {
  if (!ALLOWED_ACTIONS.includes(action as typeof ALLOWED_ACTIONS[number])) {
    throw new Error(`REJECTED: action '${action}' not in allowlist`);
  }
  if (!ALLOWED_TABLES.includes(entity as typeof ALLOWED_TABLES[number])) {
    throw new Error(`REJECTED: entity '${entity}' not a known table`);
  }
}
```

### Take — Schema introspection via Supabase RPC

The template queries `information_schema` to give the agent table shape. Adapt for the tool registry manifest (MASTRA-015):

```typescript
// Build tool registry metadata from live schema (MASTRA-015)
// The registry.ts catalogue should include column types pulled from Supabase
// so tools can self-describe their Zod schemas accurately
```

### Take — SELECT-only enforcement architecture

The template blocks all mutations at the DB query layer. Same principle applies to MASTRA-013 (tenant isolation): every tool that touches Supabase must go through a typed RPC, never raw `.from().insert()` from agent code.

### NOT to take from Text-to-SQL

- Any direct `supabase.rpc('execute_sql', ...)` pattern — Text-to-SQL uses it because that's its purpose; mdeAI tools use typed RPCs only
- The "generate SQL from LLM" core logic — mdeAI agents call typed tools, not free-form SQL
- Any admin-facing UI — Text-to-SQL dashboard is internal tooling only

**Maps to:** MASTRA-003, 013, 015

---

## 4. Docs Chatbot Template

**What it is:** A Mastra agent connected to an MCP server that does RAG retrieval from a docs corpus.

### Take — RAG chunking pipeline shape

```
Content → chunk(512 tokens, 64 overlap) → embed(gemini-embedding-001) → pgvector store → retrieve(top-k, cosine)
```

This is the exact pipeline for MASTRA-010. The template shows how to structure the ingestion step as a separate workflow from the retrieval step — critical for mdeAI because re-embedding happens offline (not in chat response time).

### Take — Source attribution pattern

The template shows how to include source metadata in every retrieval result:

```typescript
// Retrieval output shape (MASTRA-010)
z.object({
  content: z.string(),
  source: z.object({
    table: z.string(),  // 'apartments' | 'events' | 'restaurants'
    id: z.string().uuid(),
    updated_at: z.string(),
  }),
  similarity: z.number().min(0).max(1),
})
```

### Take — MCP-connected agent pattern

The template wires an agent to an MCP server for knowledge retrieval. In mdeAI MASTRA-010, the equivalent is the memory recall tool connected to pgvector. The connection pattern is the same; the transport is different.

### NOT to take from Docs Chatbot

- Any specific embedding model code — mdeAI uses `gemini-embedding-001` via `ai-embed` edge function (C14 ✅)
- The "web scraping for corpus" pattern — mdeAI content comes from Supabase tables, not scraped HTML
- LibSQL memory store used in the template — already replaced with `@mastra/pg` in MASTRA-002

**Maps to:** MASTRA-010 (blocked until VDB-02 ✅)

---

## 5. Deep Search Template — `mastra-ai/template-deep-search`

**What it is:** A multi-agent research pipeline that recursively searches, evaluates its own output quality, and suspends for human review on low-confidence answers. Ranked #1 in `20-mastra.md` (92/100).

### Take — Self-evaluating loop pattern

This is the most important structural pattern for the ConciergeAgent. The template runs a scorer after each search step and decides whether to search again or return:

```typescript
// Adapt for concierge.ts (MASTRA-005)
const evaluateResults = createStep({
  id: 'evaluate-results',
  execute: async ({ inputData, mastra }) => {
    const quality = await scoreResultQuality(inputData.results);
    if (quality.score < 0.7) {
      return { needsMoreSearch: true, refinedQuery: quality.suggestedQuery };
    }
    return { needsMoreSearch: false };
  },
});

// Conditional branching in workflow
workflow
  .then(search)
  .then(evaluateResults)
  .branch([
    [({ needsMoreSearch }) => needsMoreSearch, refinedSearch],
    [() => true, formatAndReturn],
  ]);
```

### Take — Exa-style structured search output schema

The template defines a clean output schema for search results with citations. Adapt for mdeAI search tools:

```typescript
// outputSchema for search tools (MASTRA-004 / 015)
z.object({
  results: z.array(z.object({
    id: z.string().uuid(),
    title: z.string(),
    summary: z.string().max(200),
    score: z.number().min(0).max(1),
    source_table: z.string(),
  })),
  total_found: z.number(),
  search_strategy: z.enum(['semantic', 'fts', 'hybrid']),
})
```

### Take — Suspend for low-confidence answers

The template shows when to `suspend()` vs when to return with uncertainty. Critical for MASTRA-018 (human handoff):
- **Suspend:** confidence < 0.5 OR action is irreversible
- **Return with flag:** confidence 0.5–0.7, action is read-only
- **Return directly:** confidence > 0.7, action is read-only

### Take — Workflow step ID naming convention

The template uses `verb-noun` step IDs that match the audit log: `search-properties`, `evaluate-quality`, `format-response`, `await-approval`. mdeAI should follow this — step IDs appear in `workflow_steps.step_name`.

### NOT to take from Deep Search

- Exa API client — mdeAI uses Supabase hybrid search RPCs, not Exa
- The "find academic papers" domain logic — context only
- Any `.env` that references `EXA_API_KEY` — substitute `DATABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`

**Maps to:** MASTRA-005, 006, 008, 012, 017

---

## 6. Template Coding Agent

**What it is:** An agent that reads repos, runs commands, and writes code.

### Take — Tool orchestration sequencing

The template shows how to sequence tools where each step depends on the previous output. Useful pattern for multi-step workflows that need intermediate state:

```typescript
// Pattern: output of step N feeds input of step N+1 via inputData
// Already used in weather-workflow.ts — apply this to rental-inquiry.ts
```

### Take — Retry + timeout wrapping on tool calls

The template wraps external calls with timeout and retry logic. This is MASTRA-017 (workflow recovery) territory:

```typescript
// Adapt for MASTRA-017: wrap tool execute() with retry
async function withRetry<T>(fn: () => Promise<T>, attempts = 3, delayMs = 1000): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); }
    catch (err) {
      if (i === attempts - 1) throw err;
      await new Promise(r => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw new Error('unreachable');
}
```

### NOT to take from Template Coding Agent

- The entire code execution / file write logic — not customer-facing
- Repo analysis tools — internal dev tooling only
- Any `exec()` / shell invocation patterns — never in mdeAI agents

**Maps to:** MASTRA-017 (retry pattern only)

---

## 7. Mastra Triage — `mastra-ai/mastra-triage`

**What it is:** A triage/routing agent that classifies inbound requests and delegates to specialist handlers with escalation logic.

### Take — Intent classification prompt structure

The Triage repo shows how to write a RouterAgent system prompt that reliably produces structured output. Core pattern:

```typescript
// router.ts instructions (MASTRA-005)
instructions: `You classify user messages into one of: RENTAL | EVENT | RESTAURANT | SPONSOR | SUPPORT | GENERAL.

Rules:
- Return ONLY the intent label as JSON: { "intent": "RENTAL", "confidence": 0.92 }
- If confidence < 0.6, return GENERAL and explain in "reason" field
- Never ask follow-up questions — classify on available information
- "apartment", "rent", "neighborhood", "furnished" → RENTAL
- "event", "ticket", "concert", "venue", "show" → EVENT
- "restaurant", "food", "eat", "dinner", "reserve" → RESTAURANT
- "sponsor", "brand", "contest", "advertise" → SPONSOR
`
```

### Take — Escalation condition pattern

Triage shows when to escalate to human (MASTRA-018). Three escalation triggers to adapt:
1. **Topic out of bounds** — intent classified as UNKNOWN for 2+ consecutive messages
2. **Confidence below threshold** — confidence < 0.5 after retry
3. **Explicit user request** — "talk to a person", "human agent", "help"

```typescript
// In ConciergeAgent tool set — request_human_handoff tool
// Triggers: suspension of workflow + human_handoffs row insert
```

### Take — `messageFilter` for context budget

Triage uses `messageFilter` on the Agent to cap token spend when delegating:

```typescript
// ConciergeAgent delegates to RealEstateAgent with trimmed context
const agent = new Agent({
  messageFilter: ({ messages }) =>
    messages.slice(-10), // Last 10 turns only when delegating
});
```

### NOT to take from Mastra Triage

- Slack/Discord channel integrations — mdeAI uses WhatsApp via Infobip
- Any "ticket" concept — clashes with mdeAI event tickets; rename anything called "ticket" to "support_request"
- Human agent assignment logic — mdeAI's approval flow goes through Paperclip, not a ticketing system

**Maps to:** MASTRA-005, 018

---

## 8. Repo Base — `mastra-ai/repo-base`

**What it is:** Clean starter template for a Mastra TypeScript project.

### Take — nothing new

MASTRA-002 already implemented the folder structure. The package setup, tsconfig, and `.env.example` are already in place at `my-mastra-app/`.

### Verify one thing from Repo Base

Repo Base uses `"moduleResolution": "bundler"` in tsconfig — confirm `my-mastra-app/tsconfig.json` matches. This setting is needed to resolve `@mastra/*` bare specifiers correctly.

**Maps to:** Already done in MASTRA-002.

---

## 9. WhatsApp Chat Bot Guide

**What it is:** Official Mastra guide showing a 3-step WhatsApp pipeline: receive message → Mastra AI processing → segment output and send.

### Take — 3-step pipeline structure

This is the foundation for `workflows/whatsapp-inbound.ts`:

```typescript
// 3 steps — adapting the guide's architecture
const receiveAndValidate = createStep({
  id: 'receive-validate',
  inputSchema: z.object({
    from: z.string(),           // Infobip sender ID
    body: z.string(),
    media_url: z.string().nullable(),
  }),
  execute: async ({ inputData }) => {
    // Validate phone number, look up user_id in profiles table
    // Return: { user_id, normalized_message, language }
  },
});

const processWithConcierge = createStep({
  id: 'process-concierge',
  execute: async ({ inputData, mastra }) => {
    const concierge = mastra.getAgent('concierge-agent');
    // Route through RouterAgent first, then Concierge
  },
});

const segmentAndQueue = createStep({
  id: 'segment-queue',
  execute: async ({ inputData }) => {
    // Guide shows Zod-validated output segmentation
    // mdeAI: create ai_recommendation_drafts row, NOT direct send
    // Sending requires Paperclip approval (MASTRA-018)
  },
});
```

### Take — Zod-enforced message segmentation

The guide shows how to parse AI output into structured message segments before sending. Critical for WhatsApp because messages > 1600 chars must be split:

```typescript
const MessageSegmentsSchema = z.object({
  segments: z.array(z.object({
    text: z.string().max(1600),
    delay_ms: z.number().default(0),
    media_url: z.string().nullable().default(null),
  })),
  total_segments: z.number(),
  language: z.enum(['es', 'en']),
});
```

### Take — Thread memory with phone as key

The guide uses phone number as the LibSQL memory thread key. mdeAI replaces LibSQL with `@mastra/pg`, but the thread key pattern is the same: `thread_id = user_id` (Supabase `auth.uid()`), not phone number (phone numbers are PII; use the internal user_id).

### NOT to take from WhatsApp guide

- LibSQL memory store — already replaced
- Direct `sendMessage()` call in the workflow step — mdeAI drafts only until Paperclip approves
- Twilio-specific webhook shape — mdeAI uses Infobip; adjust field names (`from`, `to`, `text` differ)

**Maps to:** WhatsApp workflow, MASTRA-018

---

## 10. Browser Agent

**What it is:** A Mastra agent wired to a browser automation tool (Stagehand/Playwright).

### Take — Session handling + retry logic patterns

The session handling pattern (establish → execute → cleanup on error) is reusable for any stateful external call:

```typescript
// Pattern: wrap stateful external calls with session lifecycle
// Relevant for: OpenClaw VPS calls (MASTRA-015 integration tools)
// NOT for running a second browser runtime
```

### Take — Structured extraction output schema

The agent shows how to define a Zod schema for unstructured-to-structured extraction. Useful as a reference when building tools that parse external API responses:

```typescript
// Any tool that calls an external API and needs to normalize its output
// should follow this pattern: parse → validate with Zod → return typed result
```

### NOT to take from Browser Agent

- Stagehand / Playwright runtime setup — OpenClaw is already the browser execution layer
- The `BrowserTool` implementation — two browser runtimes would conflict
- Any autonomous execution model — all browser execution in mdeAI requires Paperclip approval

**Maps to:** Patterns only, no direct code reuse

---

## 11. AI SDK UI Guide — `mastra.ai/guides/build-your-ui/ai-sdk-ui`

**What it is:** Official guide for connecting Mastra to Vercel AI SDK UI (`@ai-sdk/react`'s `useChat`).

### Take — Transport wiring (the critical bridge)

This is the most important connection between `my-mastra-app` and the Vite frontend:

```typescript
// my-mastra-app → Vite frontend bridge (MASTRA-019 + MASTRA-016)
// Step 1: Mastra server exposes agent via @mastra/client-js
// Step 2: Vite app creates MastraClient with Supabase JWT getter
// Step 3: DefaultChatTransport connects MastraClient to useChat
// Step 4: messages[] streams to React in real time via SSE

// The guide shows this exact 4-step wiring
```

### Take — `onToolCall` rendering hook

The guide shows how to intercept tool call events for custom rendering — the foundation for rental cards and event cards in the chat:

```typescript
// MASTRA-016: wire this in the chat component
const { messages } = useChat({
  transport: chatTransport,
  onToolCall: async ({ toolCall }) => {
    // toolCall.toolName === 'search_rentals' → show <RentalSearchSkeleton />
    // toolCall.toolName === 'search_events' → show <EventSearchSkeleton />
    return 'handled'; // prevents default text rendering
  },
});
```

### Take — Partial render pattern for streaming

The guide shows `experimental_useObject` for streaming structured data (not just text). Use this when streaming search result cards rather than streaming prose:

```typescript
// For search results that should appear as cards while streaming (MASTRA-016)
const { object: searchResults, isLoading } = experimental_useObject({
  schema: RentalResultsSchema,
  api: '/mastra/stream-object',
});
```

### NOT to take from AI SDK UI guide

- Next.js Server Actions examples — mdeAI uses Vite
- `route.ts` handler patterns — mdeAI routes through `@mastra/client-js`, not custom endpoints

**Maps to:** MASTRA-016, 019

---

## 12. Multi-Agent Systems Guide — `mastra.ai/guides/concepts/multi-agent-systems`

**What it is:** Conceptual guide covering coordinator + specialist patterns, delegation hooks, context budget management.

### Take — Coordinator pattern implementation

The guide's "supervisor" pattern is exactly the ConciergeAgent architecture:

```typescript
// ConciergeAgent as coordinator (MASTRA-005)
// 1. Receives classified intent from RouterAgent
// 2. Selects specialist agent: mastra.getAgent('real-estate-agent')
// 3. Delegates with trimmed context: pass last 10 messages only
// 4. Waits for specialist response
// 5. Post-processes and formats for user

const conciergeAgent = new Agent({
  tools: {
    delegateToRealEstate: createTool({
      execute: async ({ context, mastra }) => {
        const specialist = mastra.getAgent('real-estate-agent');
        return specialist.generate(context.refinedQuery, { maxSteps: 5 });
      },
    }),
  },
});
```

### Take — `onDelegationStart` + `onDelegationComplete` hooks

These lifecycle hooks from the guide are used for audit logging when one agent calls another — maps directly to the `withAudit()` wrapper requirement:

```typescript
// Every inter-agent call should log to ai_tool_audit_events
// onDelegationStart → write pre-audit row
// onDelegationComplete → write post-audit row with duration + result summary
```

### Take — Context budget management

The guide quantifies context costs. mdeAI's MASTRA-014 (rate limits + cost controls) can use this as the cost model:
- RouterAgent: ~200 tokens input (intent classification only)
- ConciergeAgent: ~2,000 tokens input (context + tools)
- Specialist agents: ~3,000 tokens input (full context + domain knowledge)
- Target: < 10,000 total tokens per user conversation turn

### NOT to take from Multi-Agent guide

- Any examples using OpenAI models — substitute `google/gemini-2.0-flash` equivalents
- The "autonomous execution" framing — mdeAI agents are advisory/propose-only
- Network call patterns that bypass withAudit — every tool call goes through the audit wrapper

**Maps to:** MASTRA-005, 006, 007, 008, 014

---

## Cross-Cutting Patterns (Appear in 3+ Repos)

These patterns show up consistently across the Mastra ecosystem. Implement them once, use everywhere.

### Pattern A — Zod-in / Zod-out on every boundary

Every tool, every step, every workflow has explicit Zod input + output schemas. No exceptions.
- Tool inputs: validated before `execute()`
- Tool outputs: validated before returning to agent
- Workflow inputs: validated at workflow entry
- Step outputs: typed via outputSchema

### Pattern B — Stable IDs everywhere

Agent `id`, tool `id`, workflow `id`, step `id` — all stable strings. They appear in:
- `ai_tool_audit_events.tool_name`
- `workflow_runs.workflow_name`
- `workflow_steps.step_name`
- Memory thread lookups

Changing an ID after first deploy breaks audit history, memory retrieval, and workflow recovery.

### Pattern C — Memory thread = user session

Every agent that interacts with a user gets `memory` configured with:
- `threadId: user_id` (from Supabase JWT)
- `resourceId: org_id` (tenant isolation)
- Storage: PostgresStore from MASTRA-002

### Pattern D — Separate ingestion from retrieval

Content embedding (RAG pipeline) runs as a background workflow, not in real-time chat response. Only retrieval happens in chat. This keeps response latency under 3s.

### Pattern E — Draft before send

Any tool that would cause an outbound action (WhatsApp, email, Stripe, calendar) creates a draft row + audit row. It never executes directly. Execution requires Paperclip approval or explicit user confirmation via MASTRA-018.

---

## Consolidated Task-to-Source Table

| MASTRA Task | Primary Source | Specific Pattern to Steal |
|-------------|---------------|--------------------------|
| MASTRA-003 (audit gateway) | Text-to-SQL allowlist, Mastra Core scorer | Allowlist enforcement, rejection patterns, idempotency key |
| MASTRA-004 (hybrid search tools) | Mastra Core createTool, Deep Search output schema | Zod tool shape, search result schema with source attribution |
| MASTRA-005 (router + concierge) | Triage intent prompt, Multi-Agent coordinator, Deep Search eval loop | Intent classification prompt, delegation hooks, self-eval branching |
| MASTRA-006 (real estate agents) | Mastra Core agent structure, Deep Search suspend | Agent constructor, scorer wiring, suspend for approvals |
| MASTRA-007 (events runtime) | Mastra Core workflow, Multi-Agent specialist | createWorkflow + createStep, specialist delegation pattern |
| MASTRA-008 (restaurants) | Deep Search recursive loop, Multi-Agent | Research workflow, quality eval branching |
| MASTRA-009 (UI Dojo frontend) | UI Dojo generative cards | Tool call rendering, generative card pattern, 3 loading states |
| MASTRA-010 (memory + RAG) | Docs Chatbot chunking, Mastra Core pgvector | Ingestion workflow shape, retrieval output schema, source attribution |
| MASTRA-011 (observability + evals) | Mastra Core scorer pattern, Customer Feedback | Scorer constructor, sampling ratio, structured eval output |
| MASTRA-012 (workflow state) | Deep Search suspend/resume, Mastra Core | Workflow step IDs, suspend() call shape, resume handler |
| MASTRA-013 (tenant isolation) | Text-to-SQL SELECT-only | Typed RPC tools only, no raw .from() writes |
| MASTRA-014 (rate limits + cost) | Multi-Agent context budget | Per-agent token budgets, circuit breaker thresholds |
| MASTRA-015 (tool registry) | Mastra Core createTool, Text-to-SQL schema introspection | Registry catalogue shape, risk metadata, allowlist |
| MASTRA-016 (streaming UI) | AI SDK UI guide onToolCall, UI Dojo | Transport wiring, onToolCall hook, partial render pattern |
| MASTRA-017 (workflow recovery) | Template Coding Agent retry, Deep Search | withRetry wrapper, step ID naming for dead-letter queue |
| MASTRA-018 (human handoff) | Triage escalation, WhatsApp 3-step pipeline | Escalation triggers, suspend conditions, human_handoffs row |
| MASTRA-019 (client SDK) | UI Dojo, AI SDK UI guide | MastraClient constructor, JWT getter, DefaultChatTransport |
| WhatsApp workflow | WhatsApp guide 3-step, Triage | Pipeline shape, Zod segments, draft-before-send |

---

## What NOT to Reuse — Consolidated

| Repo / Pattern | Why NOT | What to do instead |
|----------------|---------|-------------------|
| LibSQL stores from any template | Ephemeral; data lost on restart | `@mastra/pg` PostgresStore (MASTRA-002 ✅) |
| DuckDB observability store | Same ephemeral issue | Postgres or hosted OTLP endpoint |
| Next.js app dir / server actions | mdeAI is Vite + react-router-dom | Adapt to Vite component patterns |
| Stagehand / Browser Agent runtime | OpenClaw is already the execution layer | OpenClaw integration via MASTRA-015 |
| Autonomous tool execution patterns | mdeAI is propose-only | Draft + approval gates (MASTRA-018) |
| Demo auth in any template | mdeAI uses Supabase Auth | Supabase JWT in Authorization header |
| OpenAI / Anthropic models in examples | mdeAI uses Gemini only | `google/gemini-2.0-flash` via AI Gateway |
| EXA_API_KEY / Exa search client | mdeAI uses Supabase hybrid search | `hybrid_search_*` RPCs from VDB-01 |
| Direct `.from().insert()` in agent tools | Bypasses RLS + audit | Typed Supabase RPCs only |
| Template "ticket" naming (Triage) | Conflicts with mdeAI event tickets | Rename to `support_request` |
| Direct Stripe mutations from agents | Finance-approved separate task | Audit + approval gate only |
| Infobip direct send in workflow step | No approval gate | Draft row → Paperclip approval → send |

---

## Open Questions Before Implementing

These need answers before writing code that references these templates:

1. **MASTRA-009 (UI Dojo):** Does mdeAI replace `FloatingChatWidget` entirely with the UI Dojo streaming pattern, or extend it? The existing component uses `useChat` from `ai-sdk/react` already — check if `DefaultChatTransport` from `@mastra/client-js` is a drop-in or requires a rewrite.

2. **MASTRA-010 (Docs Chatbot / RAG):** VDB-02 is still not done. Confirm before starting MASTRA-010 that `hybrid_search_restaurants` RPC exists in Supabase remote (it doesn't exist locally per the inventory).

3. **MASTRA-018 (human handoff):** Paperclip API URL + auth method not documented in any task prompt. This needs to be sourced before MASTRA-018 can ship. Check `tasks/mastra/04-openclaw.md` for Paperclip endpoint.

4. **Multi-agent delegation:** When ConciergeAgent delegates to RealEstateAgent, does each agent call cost toward the same user's rate limit quota (MASTRA-014)? Clarify before implementing cost controls.
