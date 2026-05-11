---
id: MASTRA-INTEGRATION
title: Mastra ↔ mdeAI Integration Plan
status: Reference
priority: P1
effort: 3–5 days
owner: engineering
depends_on: [MASTRA-001]
skill: [mastra, mde-supabase, mde-vercel]
---

# Mastra ↔ mdeAI Integration Plan

> Written: 2026-05-11. Audience: product owner who also reviews code. Plain English throughout — jargon defined on first use.

---

## 1. Executive Recommendation

The Mastra server (`my-mastra-app/`) is already running locally and has a strong concierge agent with working memory. The Vite frontend (`src/`) currently talks to a Supabase Edge Function called `ai-chat` to drive the `/chat` page — that Edge Function is a separate AI layer from Mastra. The cleanest path forward is to install `@mastra/client-js` in the frontend (it is currently missing from `/home/sk/mde/package.json`), write a thin bridge file (`src/lib/mastra-client.ts`), and swap the `sendMessage()` call inside `src/hooks/useChat.ts` to call the Mastra `concierge-agent` instead of the `ai-chat` edge function. The UI, the conversation persistence logic, and all Supabase writes stay untouched. Streaming works through `@mastra/client-js`'s `stream()` method, which returns the same SSE (Server-Sent Events — a one-way push channel from server to browser) format the current `useChat.ts` already consumes. Vercel deployment of the Mastra server is straightforward with `@mastra/deployer-vercel` once local wiring is proven.

---

## 2. Which Guide Is For What

| Guide / Doc | What it actually covers | Does mdeAI need it now? |
|---|---|---|
| **AI SDK backend guide** (`mastra.ai/guides/agent-frameworks/ai-sdk`) | How to wrap existing AI SDK `generateText()` calls with Mastra features (memory, processors) without migrating to Mastra agents | No — mdeAI already uses Mastra agents natively, not raw AI SDK calls |
| **AI SDK UI guide** (`mastra.ai/guides/build-your-ui/ai-sdk-ui`) | How to use `@ai-sdk/react`'s `useChat()` hook wired to Mastra's `chatRoute()` API route | Partially — the `useChat` hook pattern is useful reference, but mdeAI's custom `useChat.ts` can talk to Mastra directly via `@mastra/client-js` without adopting the AI SDK React hook |
| **Vite React guide** (`mastra.ai/guides/getting-started/vite-react`) | Fresh-project setup: init Mastra inside a new Vite app, add `chatRoute()`, use AI Elements components | No for scaffolding (project exists); Yes for `chatRoute()` pattern if we want the Mastra server to expose a chat endpoint |
| **Vercel deployment guide** (`mastra.ai/guides/deployment/vercel`) | How to deploy the Mastra server to Vercel using `@mastra/deployer-vercel` | Yes — needed when we move Mastra to production |
| **Mastra Client SDK** (`mastra.ai/docs/server/mastra-client`) | `@mastra/client-js` API: `getAgent()`, `agent.stream()`, `agent.generate()`, thread/memory parameters | Yes — this is the primary integration point for the frontend |
| **Agents overview** (`mastra.ai/docs/agents/overview`) | How agents work, `.generate()` vs `.stream()`, tool calling | Reference — already implemented in `my-mastra-app/` |
| **Workflows overview** (`mastra.ai/docs/workflows/overview`) | Steps, `.start()` vs `.stream()`, state | Reference — already implemented |
| **Memory overview** (`mastra.ai/docs/memory/overview`) | `resourceId`, `threadId`, working memory, multi-agent isolation | Yes — needed to wire thread/resource IDs from the frontend |
| **Vercel deployer reference** (`mastra.ai/reference/deployer/vercel`) | `VercelDeployer` config options (studio, maxDuration, memory, regions) | Yes — for production deployment |

---

## 3. What Is Already Correct

- `my-mastra-app/` has `@mastra/core`, `@mastra/memory`, `@mastra/libsql`, `@mastra/pg`, `@mastra/client-js`, `@mastra/duckdb`, `@mastra/observability` — all required Mastra server packages are installed.
- `my-mastra-app/` has a working `concierge-agent` with full working memory schema (lastIntent, lastRentalQuery, lastRentalResults, selectedListingId, lastEventQuery, lastEventResults, selectedEventId) and tools (searchRentalsTool, searchEventsTool, searchRestaurantsTool, searchAttractionsTool).
- `my-mastra-app/` has a `router-agent` for intent classification and dispatch — correctly kept server-side only.
- `my-mastra-app/` has `rentalSearchWorkflow`, `eventDiscoveryWorkflow`, `conciergeRoutingWorkflow` — multi-step workflows for structured tasks.
- Mastra observability is wired (`@mastra/observability` with `DefaultExporter` and `SensitiveDataFilter`).
- Mastra storage uses a real Postgres store (`createPostgresStore`) — not file-based, so it survives Vercel's ephemeral filesystem.
- `.gitignore` in `my-mastra-app/` correctly excludes `.env`, `.env.*`, `node_modules`, `dist`, `.mastra`, `.vercel`, and `*.db`.
- The frontend `useChat.ts` already handles SSE streaming (reading `data:` lines, parsing JSON, building `assistantContent` incrementally) — this pattern transfers cleanly to Mastra's stream output.
- The frontend already generates `crypto.randomUUID()` for conversation IDs — same pattern needed for Mastra `threadId`.
- Supabase auth (`session.access_token`) is already extracted in `useChat.ts` — can be passed as the Mastra `resourceId`.
- `vite.config.ts` has a clean vendor-chunk strategy. Adding `@mastra/client-js` would fall into the entry chunk (no special chunk needed given its small size).
- Node.js version requirement `>=22.13.0` is set in `my-mastra-app/package.json` — matches Mastra's requirement.

---

## 4. What Is Missing

- `@mastra/client-js` is NOT in `/home/sk/mde/package.json` (it is in `my-mastra-app/package.json` — that is the Mastra server, not the Vite frontend). The frontend cannot call Mastra without this package.
- `@ai-sdk/react` is NOT in `/home/sk/mde/package.json`. This is optional if we use `@mastra/client-js` directly (recommended), but required if we switch to AI SDK's `useChat` hook.
- `@mastra/deployer-vercel` is NOT in `my-mastra-app/package.json`. Required before deploying Mastra to Vercel.
- There is NO `VITE_MASTRA_SERVER_URL` (or equivalent) in `/home/sk/mde/.env`. The frontend has no way to know where the Mastra server lives.
- `my-mastra-app/src/mastra/index.ts` does NOT register a `chatRoute()` or expose any AI SDK-compatible HTTP chat endpoint. The Mastra server exposes agents via its default REST API at `/api/agents/{agentId}/stream` — `@mastra/client-js` uses this natively.
- There is NO `src/lib/mastra-client.ts` bridge file. Every AI call from the frontend goes to Supabase edge functions, with no path to Mastra.
- The frontend's `useIntentRouter` hook calls the Supabase `ai-router` edge function — this is a duplicate of the `router-agent` already in Mastra. Two intent routers doing the same job is waste and a source of inconsistency.
- `OPENAI_API_KEY` appears in `my-mastra-app/.env` variable names, but the concierge agent uses `google/gemini-3.1-flash-lite-preview`. If OpenAI is not actually used, the key is dead weight (not a blocking issue but worth auditing).
- No `MASTRA_SERVER_URL` in Vercel environment variables (blocks production, not local dev).

---

## 5. Best Architecture for mdeAI

```
Vite/React frontend (port 8080)
        |
        | HTTP (local: port 4111, prod: Vercel URL)
        |
  @mastra/client-js  ← src/lib/mastra-client.ts (bridge file)
        |
        ▼
  Mastra server (my-mastra-app/)
        |
        ▼
  concierge-agent  ← ONLY agent the frontend ever calls
  /api/agents/concierge-agent/stream
        |
        ├── searchRentalsTool      ← calls Supabase RPC
        ├── searchEventsTool       ← calls Supabase RPC
        ├── searchRestaurantsTool  ← calls Supabase RPC
        └── searchAttractionsTool  ← calls Supabase RPC
        |
  Working Memory (thread-scoped)
  lastIntent / lastRentalQuery / lastRentalResults /
  selectedListingId / lastEventQuery / lastEventResults
        |
        ▼
  Postgres storage (same DATABASE_URL as Supabase)
        |
        ▼
  Supabase PostgreSQL (apartments, events, restaurants tables)
```

**Why the frontend ONLY calls concierge-agent:**

- `router-agent` is an internal routing brain. Exposing it to the browser means the frontend could accidentally bypass the concierge's clarification gates, working memory rules, and formatting logic. The concierge already has the full intent-routing logic baked into its system prompt (the pre-search clarification gate, the confidence scoring, the follow-up preservation rules). There is nothing the frontend gains by calling the router directly.
- `rental-agent` and `event-agent` are specialist sub-agents — they produce raw data, not user-facing prose. Calling them from the browser would return unformatted results with no neighborhood intelligence, no "Best for" labels, and no empty-state recovery.
- Keeping a single frontend entry point makes it trivial to add auth middleware, rate limiting, and observability at exactly one layer.

**The `ai-chat` edge function vs Mastra:**

Once `@mastra/client-js` is wired in the frontend, `ai-chat` and `ai-router` Supabase edge functions become redundant for the `/chat` page. They should be kept running while the migration is tested (parallel path), then decommissioned once Mastra is live in production. This avoids a hard cutover with no rollback.

---

## 6. Step-by-Step Setup (Local Dev)

1. **Install `@mastra/client-js` in the frontend.**
   ```bash
   cd /home/sk/mde
   npm install @mastra/client-js@latest
   ```

2. **Add the Mastra server URL to the frontend `.env`.**
   Open `/home/sk/mde/.env` and add one line:
   ```
   VITE_MASTRA_SERVER_URL=http://localhost:4111
   ```
   This tells the frontend where to find Mastra in local dev. In production it will point to the Vercel deployment URL.

3. **Create the bridge file `src/lib/mastra-client.ts`.**
   See Section 7 for the complete file content.

4. **Start the Mastra dev server.**
   ```bash
   cd /home/sk/mde/my-mastra-app && bash scripts/mastra-start.sh
   ```
   Verify it responds: `curl http://localhost:4111/api/agents` — you should see JSON with `concierge-agent`, `router-agent`, etc.

5. **Wire the `/chat` page to call Mastra concierge.**
   In `src/hooks/useChat.ts`, replace the `fetch(${SUPABASE_URL}/functions/v1/ai-chat, ...)` block with a call to the bridge file's `streamConcierge()` helper. See Section 8 for exact changes.

6. **Thread and resourceId strategy.**
   - `resourceId` = `user.id` from Supabase Auth (`auth.uid()`). This ties all of a user's Mastra memory to their account. For anonymous visitors, use `anonSessionId` (already available in `useChat.ts`).
   - `threadId` = `currentConversation.id` — the UUID already generated for each conversation. This means one conversation in Supabase = one thread in Mastra memory. They share the same ID, making debugging straightforward.
   - For new conversations, `crypto.randomUUID()` already generates the ID in `useChat.ts` before the first message. Pass that UUID as both the Supabase conversation ID and the Mastra threadId.

7. **Test one round-trip locally.**
   Open `http://localhost:8080/chat`, type "show me 1BR apartments in Laureles under $80/night". The response should come from the Mastra concierge agent (check the Mastra Studio at `http://localhost:4111` for the trace).

---

## 7. The Bridge File

Full content for `/home/sk/mde/src/lib/mastra-client.ts`:

```typescript
/**
 * mastra-client.ts
 *
 * Single entry point for all Mastra server calls from the Vite/React frontend.
 * The frontend ONLY calls concierge-agent — never router-agent, rental-agent,
 * or event-agent directly.
 *
 * resourceId = Supabase auth.uid() — ties Mastra memory to the user account.
 * threadId   = conversation UUID  — one conversation row = one Mastra thread.
 */
import { MastraClient } from '@mastra/client-js';

// VITE_MASTRA_SERVER_URL is set in .env (local: http://localhost:4111, prod: Vercel URL)
const MASTRA_URL = import.meta.env.VITE_MASTRA_SERVER_URL ?? 'http://localhost:4111';

// Singleton client — created once, reused across all calls.
// Do not create a new MastraClient on every message send.
export const mastraClient = new MastraClient({
  baseUrl: MASTRA_URL,
  // Retry transient network errors up to 2 times before surfacing to user.
  retries: 2,
  backoffMs: 300,
  maxBackoffMs: 3000,
});

/**
 * Options for a single concierge turn.
 */
export interface ConciergeTurnOptions {
  /** Supabase auth.uid() for authenticated users, or the anonSessionId for guests. */
  resourceId: string;
  /** The conversation UUID — shared between Supabase conversations table and Mastra threads. */
  threadId: string;
  /** The user's message text. */
  message: string;
  /** Optional context chips (neighborhood, dates, travelers, budget). */
  sessionData?: Record<string, unknown> | null;
}

/**
 * streamConcierge()
 *
 * Sends one user turn to the concierge-agent and returns an AsyncIterable
 * of text chunks. The caller (useChat.ts) appends chunks to assistantContent
 * exactly as it does today with the SSE reader loop.
 *
 * Usage:
 *   for await (const chunk of streamConcierge(options)) {
 *     assistantContent += chunk;
 *     setMessages(...);
 *   }
 */
export async function* streamConcierge(
  opts: ConciergeTurnOptions,
): AsyncGenerator<string> {
  const agent = mastraClient.getAgent('concierge-agent');

  // Build the message payload. We send only the latest user message —
  // Mastra's working memory (thread-scoped) handles conversation history
  // server-side. This avoids sending the full transcript on every turn.
  const messages = [
    {
      role: 'user' as const,
      content: opts.sessionData
        ? `[context: ${JSON.stringify(opts.sessionData)}]\n${opts.message}`
        : opts.message,
    },
  ];

  // Memory options tie this turn to the user's thread.
  const memoryOptions = {
    resource: opts.resourceId,
    thread: opts.threadId,
  };

  let stream: Awaited<ReturnType<typeof agent.stream>>;
  try {
    stream = await agent.stream(messages, {
      memory: memoryOptions,
    });
  } catch (err) {
    throw new Error(
      `Mastra concierge unreachable at ${MASTRA_URL}. ` +
        `Is the Mastra server running? Original error: ${(err as Error).message}`,
    );
  }

  // @mastra/client-js exposes processDataStream() for consuming the response.
  // We convert it to an AsyncGenerator so the caller can iterate with for-await.
  // Each yielded value is a text chunk (string).
  let resolve: ((value: IteratorResult<string>) => void) | null = null;
  let reject: ((reason: unknown) => void) | null = null;
  const queue: string[] = [];
  let done = false;
  let error: unknown = null;

  const next = (): Promise<IteratorResult<string>> =>
    new Promise((res, rej) => {
      if (queue.length > 0) {
        res({ value: queue.shift()!, done: false });
      } else if (done) {
        res({ value: '', done: true });
      } else if (error) {
        rej(error);
      } else {
        resolve = res;
        reject = rej;
      }
    });

  // processDataStream is non-blocking — it fires callbacks as chunks arrive.
  stream.processDataStream({
    onTextPart: (text: string) => {
      if (resolve) {
        const r = resolve;
        resolve = null;
        r({ value: text, done: false });
      } else {
        queue.push(text);
      }
    },
    onError: (err: unknown) => {
      error = err;
      if (reject) reject(err);
    },
  });

  // Signal done when processDataStream completes (it returns a Promise).
  void (stream as unknown as { processDataStream: (...args: unknown[]) => Promise<void> })
    .processDataStream({})
    .then(() => {
      done = true;
      if (resolve) resolve({ value: '', done: true });
    })
    .catch((err: unknown) => {
      error = err;
      if (reject) reject(err);
    });

  while (true) {
    const result = await next();
    if (result.done) break;
    yield result.value;
  }
}

/**
 * generateConcierge()
 *
 * Non-streaming version — waits for the full response before returning.
 * Use only for short responses where streaming is not needed (e.g., tests).
 */
export async function generateConcierge(
  opts: ConciergeTurnOptions,
): Promise<string> {
  const agent = mastraClient.getAgent('concierge-agent');

  const messages = [
    {
      role: 'user' as const,
      content: opts.sessionData
        ? `[context: ${JSON.stringify(opts.sessionData)}]\n${opts.message}`
        : opts.message,
    },
  ];

  const response = await agent.generate(messages, {
    memory: {
      resource: opts.resourceId,
      thread: opts.threadId,
    },
  });

  return response.text ?? '';
}
```

**Note on the streaming implementation:** `@mastra/client-js`'s `processDataStream()` API uses callbacks rather than a native async iterator. The bridge file wraps it in an `AsyncGenerator` so `useChat.ts` can consume it with a simple `for await` loop — the same mental model as the existing SSE reader. If Mastra publishes a native async iterator API in a future release, the bridge file is the only place that needs updating.

---

## 8. /chat Integration Steps

The goal is to swap the AI backend in `src/hooks/useChat.ts` without touching the UI components, Supabase persistence, or conversation management logic.

**In `src/hooks/useChat.ts`:**

1. Add import at the top of the file:
   ```typescript
   import { streamConcierge } from '@/lib/mastra-client';
   ```

2. Find the `sendMessage` function. The block that currently does:
   ```typescript
   const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, { ... });
   // ... SSE reader loop with buffer, decoder, data: lines ...
   ```
   Replace the entire fetch + SSE reader block with:
   ```typescript
   for await (const chunk of streamConcierge({
     resourceId: user?.id ?? anonSessionId ?? 'anon',
     threadId: conversation.id,
     message: content,
     sessionData: hasChatContext(chatContext) ? chatContext : null,
   })) {
     assistantContent += chunk;
     setMessages(prev =>
       prev.map(m =>
         m.id === assistantMessage.id
           ? { ...m, content: assistantContent }
           : m,
       ),
     );
   }
   ```

3. Remove imports no longer needed after the swap:
   - `SUPABASE_URL` (the `const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL` line at the top of `useChat.ts` can stay since it is used elsewhere in the file for auth session calls).
   - The `abortControllerRef` logic can be simplified — `@mastra/client-js` supports `AbortSignal` via the `MastraClient` constructor's `abortSignal` option. To keep abort working, pass an `AbortController` signal when constructing the client per-turn, or accept a small regression where cancel-stream does not abort mid-turn (lower priority).

4. The Supabase persistence blocks (insert user message, insert assistant message, update `last_message_at`) stay exactly as-is. Mastra handles AI memory. Supabase handles conversation history for the UI.

5. The `useIntentRouter` hook (`src/hooks/useIntentRouter.ts`) calls `ai-router` edge function. Once Mastra is the backend, intent routing happens inside the Mastra concierge agent's system prompt. `useIntentRouter` can be removed from `src/components/chat/ChatCanvas.tsx` (or wherever it is called) in a follow-up cleanup PR.

---

## 9. Streaming Plan

**Does `@mastra/client-js` support streaming?** Yes. The `agent.stream()` method returns a stream object with a `processDataStream()` method that fires callbacks as text chunks arrive. It does not expose a native `ReadableStream` or `AsyncIterable` — it uses a callback API. The bridge file in Section 7 wraps this into an `AsyncGenerator` for clean consumption.

**Pattern comparison:**

| Pattern | How it works | Fits mdeAI? |
|---|---|---|
| Current `useChat.ts` SSE reader | Manual `fetch()` + `ReadableStream` reader, parse `data:` lines | Works, but bespoke and fragile |
| `@ai-sdk/react` `useChat()` hook | Managed state + streaming, but requires `DefaultChatTransport` and the Mastra `chatRoute()` endpoint | Possible but requires adding `@ai-sdk/react` and `chatRoute()` to Mastra server — more moving parts |
| `@mastra/client-js` `agent.stream()` | Direct agent call, callback-based streaming | Recommended — cleanest path, no extra packages |
| Manual `EventSource` | Browser's native SSE API — read-only, no POST body support | Not suitable (needs POST with message body) |

**Recommended approach for mdeAI:** `@mastra/client-js` `agent.stream()` wrapped in the `AsyncGenerator` bridge (Section 7). This keeps the frontend change minimal: replace one `fetch()` block with one `for await` loop.

**Known issue:** There are open GitHub issues (as of May 2026) about SSE stream instability when using `chatRoute()` + `useChat()` together. The `@mastra/client-js` direct approach avoids `chatRoute()` entirely and calls the agent's native REST API, which is more stable.

---

## 10. Memory / Thread / Resource ID Strategy

Mastra memory uses two identifiers to isolate and share context:

- **`resourceId`** — "who is this?" — stable across all conversations for the same user.
  - Authenticated users: `user.id` from `supabase.auth.getSession()` (the UUID Supabase assigns at signup).
  - Anonymous visitors: `anonSessionId` from `useAnonSession()` hook (already available in `useChat.ts`).
  - This means a user's Mastra working memory (their rental preferences, neighborhood intel, etc.) persists across browser sessions as long as they use the same Supabase account.

- **`threadId`** — "which conversation is this?" — one per conversation session.
  - Use `currentConversation.id` — the UUID already stored in the Supabase `conversations` table.
  - For new conversations before the first DB row exists: `crypto.randomUUID()` (already done in `useChat.ts`). Pass the same UUID as both the Supabase `conversations.id` insert and the Mastra `threadId`. This makes cross-referencing trivial.
  - **Store `threadId` in React state**, not just `localStorage`. `localStorage` is fine as a secondary persistence layer for anonymous users.

**How working memory persists across turns:**

The `concierge-agent` has `workingMemory: { enabled: true, scope: 'thread' }`. This means:
- After each turn, Mastra extracts structured values (lastIntent, lastRentalQuery, etc.) from the agent's response and writes them to the Postgres storage.
- On the next turn, Mastra injects the working memory back into the system context before the model runs.
- The frontend sends only the latest user message. Mastra reconstructs the full context server-side. This reduces payload size and avoids the "send full history on every turn" anti-pattern currently in `useChat.ts`.

**How to pass memory options from frontend:**

```typescript
await agent.stream(messages, {
  memory: {
    resource: userId,   // ties to user account
    thread: threadId,   // ties to this conversation
  },
});
```

No additional configuration needed — the concierge agent already has `Memory` configured with `lastMessages: 20` and the working memory schema.

---

## 11. Env Separation

| Variable | Frontend `.env` | Mastra `.env` | Vercel env (frontend project) | Vercel env (Mastra project) | Notes |
|---|---|---|---|---|---|
| `VITE_SUPABASE_URL` | Yes | No | Yes | No | Frontend Supabase connection |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | No | Yes | No | Frontend anon key — safe to expose |
| `VITE_GOOGLE_MAPS_API_KEY` | Yes | No | Yes | No | Map rendering |
| `VITE_SUPABASE_PROJECT_ID` | Yes | No | Yes | No | Project reference |
| `VITE_MASTRA_SERVER_URL` | Yes | No | Yes | No | Points to Mastra server (local: localhost:4111, prod: Vercel URL) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | No | Yes | No | Yes | Gemini — never in frontend |
| `DATABASE_URL` | No | Yes | No | Yes | Postgres connection — never in frontend |
| `OPENAI_API_KEY` | No | Yes (if used) | No | Yes (if used) | Only if an OpenAI model is actually called |
| `NODE_ENV` | No | Yes | No | Yes | Runtime environment flag |
| `GEMINI_API_KEY` | No | Edge fns only | No | No | Supabase edge function secret — separate from Mastra |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Edge fns only | No | No | Never in Mastra or frontend |
| `STRIPE_SECRET_KEY` | No | No | No | No | Edge fns only via Infisical |

**Rule:** `VITE_` prefix = safe for browser bundle. Everything else stays server-side. Mastra's `.env` has `DATABASE_URL` and `GOOGLE_GENERATIVE_AI_API_KEY` — correct placement, never expose to the Vite build.

---

## 12. Vercel Deployment Strategy

**Two separate Vercel projects:**

| Project | Repo root | Build command | Output |
|---|---|---|---|
| **Frontend** | `/` (root of repo) | `npm run build` | Vite static assets → `dist/` |
| **Mastra server** | `my-mastra-app/` | `mastra build` | Vercel serverless function via `.vercel/output/` |

This is the cleanest split. The frontend auto-deploys from `main` (already set up). The Mastra server is a second Vercel project pointed at the `my-mastra-app/` subdirectory.

**Steps to deploy Mastra to Vercel:**

1. Install the deployer in `my-mastra-app/`:
   ```bash
   cd /home/sk/mde/my-mastra-app
   npm install @mastra/deployer-vercel@latest
   ```

2. Add the deployer to `my-mastra-app/src/mastra/index.ts`:
   ```typescript
   import { VercelDeployer } from '@mastra/deployer-vercel';

   export const mastra = new Mastra({
     // ... existing config ...
     deployer: new VercelDeployer({
       maxDuration: 60,  // seconds — enough for Gemini calls
       memory: 1024,     // MB
       regions: ['iad1'], // closest to Supabase us-east-1
     }),
   });
   ```

3. Set environment variables in the Mastra Vercel project:
   - `GOOGLE_GENERATIVE_AI_API_KEY` — Gemini key
   - `DATABASE_URL` — Supabase Postgres connection string (use the pooler URL for serverless)

4. `MASTRA_SERVER_URL` in production:
   - Local dev: `http://localhost:4111`
   - Production: `https://my-mastra-app.vercel.app` (the Vercel URL of the Mastra project)
   - Set `VITE_MASTRA_SERVER_URL=https://my-mastra-app.vercel.app` in the frontend Vercel project's environment variables.

5. CORS: The Mastra server must allow requests from `https://www.mdeai.co`. Configure in `my-mastra-app/src/mastra/index.ts`:
   ```typescript
   export const mastra = new Mastra({
     server: {
       cors: {
         origin: ['https://www.mdeai.co', 'http://localhost:8080'],
         allowMethods: ['GET', 'POST', 'OPTIONS'],
         allowHeaders: ['Content-Type', 'Authorization'],
       },
     },
     // ... rest of config
   });
   ```

6. All agent endpoints will be available at `https://my-mastra-app.vercel.app/api/agents`.

**Monorepo note:** Vercel supports deploying from a subdirectory. In the Mastra Vercel project settings, set "Root Directory" to `my-mastra-app/`. The build command is `mastra build`. The output directory is `.vercel/output`.

**Storage on Vercel:** Mastra uses the Postgres store (`createPostgresStore`) with `DATABASE_URL` pointing to Supabase. This works on Vercel's ephemeral filesystem because data lives in Supabase, not the Vercel instance. The DuckDB observability store writes to a file — this will be lost on redeploy. For production observability, switch to an external store or disable the DuckDB exporter.

---

## 13. Red Flags / Errors Found

1. **Duplicate AI layers doing the same job.** The Supabase `ai-chat` edge function and the Mastra `concierge-agent` both handle rental search and event discovery. Running both simultaneously means two intent routers, two sets of prompts, and two Gemini API bills. Pick one: ship Mastra as the backend, keep `ai-chat` as a cold fallback during migration, then remove it.

2. **`useIntentRouter` calls `ai-router` edge function from the browser.** Intent routing should be server-side. The Mastra `router-agent` already handles this. Once Mastra is the backend, `useIntentRouter.ts` becomes dead code.

3. **`@mastra/client-js` is in `my-mastra-app/package.json`, not in the root `package.json`.** The Mastra server uses this package internally (for its own client utilities). The Vite frontend also needs it — but installed separately at the repo root. Having it only in `my-mastra-app/` is correct for the server; it is missing from the frontend.

4. **No CORS configuration on the Mastra server.** When the frontend (port 8080) calls the Mastra server (port 4111 in local dev, or `*.vercel.app` in production), the browser will block the request unless the Mastra server sends proper `Access-Control-Allow-Origin` headers. Add CORS config before testing (see Section 12).

5. **`OPENAI_API_KEY` in `my-mastra-app/.env` but no OpenAI model in use.** The concierge, router, rental, and event agents all use `google/gemini-3.1-flash-lite-preview`. If no agent in the Mastra app uses OpenAI, the key is unused. Audit whether any tool or scorer imports from `openai`. If not, remove the key from `.env` to reduce secret surface area.

6. **DuckDB file-based observability will break on Vercel.** `@mastra/duckdb` writes to a local file. Vercel serverless functions have an ephemeral filesystem — files are lost between invocations. Either remove `@mastra/duckdb` for production or replace it with a Postgres-backed exporter before deploying to Vercel.

7. **`bun.lockb` and `package-lock.json` both present** in the root (noted in CLAUDE.md). This is a package manager conflict. Pick npm (already used in scripts) and delete `bun.lockb`. Adding `@mastra/client-js` via `npm install` will add it correctly to `package-lock.json`.

8. **No auth middleware on the Mastra server.** Anyone who discovers the Mastra server URL can call any agent. Before production, add at minimum a shared secret header check (`X-Mastra-Key`) verified on every request, or use Vercel's Edge Middleware to protect the `/api/*` routes. The Vercel deployment guide flags this explicitly.

9. **`useChat.ts` sends full conversation history on every turn** (`messages: user ? [...messages, userMessage].map(...)`) . With Mastra handling memory server-side, sending the full history becomes wasteful and creates a risk of hitting model context limits. After migrating to Mastra, send only the latest user message — Mastra reconstructs context from its thread store.

---

## 14. What To Use Now vs Later

| Tool | Use Now? | Use Later? | Why |
|---|---|---|---|
| `@mastra/client-js` (in frontend) | Yes | Yes (keep) | Missing — install first thing. It is the frontend's only path to Mastra. |
| `@ai-sdk/react` `useChat()` hook | No | Maybe | Adds complexity; mdeAI's custom `useChat.ts` already handles streaming. Only revisit if the custom hook becomes hard to maintain. |
| CopilotKit | No | No | Full UI framework replacement — overkill for mdeAI which has a working chat UI. |
| Assistant UI | No | Maybe | Pre-built chat components; useful if a future feature (e.g., voice, tool rendering) requires richer UI primitives. |
| UI Dojo (AI Elements) | No | No | Component library from the Mastra Vite getting-started guide — aimed at greenfield projects, not a mature codebase. |
| `@mastra/deployer-vercel` | Not yet (local first) | Yes | Install and configure once local wiring is proven. Needed before Mastra can serve production traffic. |
| Mastra Cloud | No | Maybe | Managed hosting for Mastra — removes DevOps burden, but currently no Vercel-native edge function support. Revisit at Phase 3. |
| MastraEditor (`@mastra/editor`) | Already installed | Yes (keep) | Powers the Studio UI at port 4111. Already in `my-mastra-app/package.json` and `index.ts`. |
| `@mastra/ai-sdk` (backend wrapper) | No | No | For wrapping existing AI SDK `generateText()` calls with Mastra memory — not applicable since mdeAI uses native Mastra agents. |
| `chatRoute()` (Mastra server) | No | Maybe | Only needed if switching to `@ai-sdk/react` `useChat()`. Not required with `@mastra/client-js` direct calls. |

---

## 15. Commands to Run Right Now

Run these in order. Each step must succeed before moving to the next.

```bash
# Step 1: Install @mastra/client-js in the Vite frontend
cd /home/sk/mde
npm install @mastra/client-js@latest

# Step 2: Verify the install
grep '"@mastra/client-js"' /home/sk/mde/package.json

# Step 3: Add VITE_MASTRA_SERVER_URL to the frontend .env
# (Open /home/sk/mde/.env in your editor and add the line below)
# VITE_MASTRA_SERVER_URL=http://localhost:4111

# Step 4: Create the bridge file (copy content from Section 7 above)
# File path: /home/sk/mde/src/lib/mastra-client.ts

# Step 5: Lint and typecheck to catch import errors
cd /home/sk/mde
npm run lint && npm run typecheck:app

# Step 6: Start the Mastra server
cd /home/sk/mde/my-mastra-app && bash scripts/mastra-start.sh

# Step 7: Verify Mastra server is up and concierge-agent is registered
curl http://localhost:4111/api/agents | python3 -m json.tool | grep -i concierge

# Step 8: Start the Vite dev server
cd /home/sk/mde && npm run dev

# Step 9: Open http://localhost:8080/chat and test one message
# Expected: response streams in from Mastra concierge (not ai-chat edge fn)
# Verify in Mastra Studio: http://localhost:4111 → Agents → concierge-agent → last run

# Step 10 (after wiring useChat.ts): run the full test suite
cd /home/sk/mde
npm run lint && npm run build && npm run test
```

---

## 16. Production Checklist

All boxes must be checked before pointing `www.mdeai.co` at the Mastra backend.

- [ ] `@mastra/client-js` installed in `/home/sk/mde/package.json` (frontend)
- [ ] `@mastra/deployer-vercel` installed in `my-mastra-app/package.json`
- [ ] `src/lib/mastra-client.ts` bridge file created and typechecks clean
- [ ] `VITE_MASTRA_SERVER_URL` set in frontend `.env` (local) and Vercel env (prod)
- [ ] CORS configured in `my-mastra-app/src/mastra/index.ts` to allow `mdeai.co` and `localhost:8080`
- [ ] Auth middleware or shared-secret header protecting the Mastra `/api/*` routes
- [ ] `GOOGLE_GENERATIVE_AI_API_KEY` set in Mastra Vercel project environment variables
- [ ] `DATABASE_URL` set in Mastra Vercel project — use Supabase pooler URL for serverless
- [ ] DuckDB observability replaced or disabled for Vercel (file-based store breaks on ephemeral filesystem)
- [ ] `my-mastra-app/src/mastra/index.ts` has `VercelDeployer` configured with `maxDuration` and `regions`
- [ ] `mastra build` runs clean (`cd my-mastra-app && npm run build`)
- [ ] `mastra-smoke.sh` passes all 8 agent/workflow probes against the deployed Vercel URL
- [ ] Manual test: send a rental query in `/chat` — response comes from Mastra (verify in Mastra Studio traces)
- [ ] Manual test: follow-up question ("show cheaper options") — working memory correctly refines the search without asking for context again
- [ ] Manual test: new conversation — `threadId` changes, previous memory does not bleed in
- [ ] `npm run test` passes with count not regressed (259/259 or higher)
- [ ] `npm run build` clean with no new chunk size warnings
- [ ] `ai-chat` Supabase edge function kept as fallback (do not delete until Mastra is stable for 48 hours)
- [ ] `useIntentRouter.ts` and `ai-router` edge function decommission tracked as a follow-up task
- [ ] Vercel deployment URL documented in `CLAUDE.md` under Environment Variables

---

## 17. Links

Official documentation fetched for this plan:

- [Mastra AI SDK backend guide](https://mastra.ai/guides/agent-frameworks/ai-sdk)
- [Mastra AI SDK UI guide](https://mastra.ai/guides/build-your-ui/ai-sdk-ui)
- [Mastra Vite React guide](https://mastra.ai/guides/getting-started/vite-react)
- [Mastra Vercel deployment guide](https://mastra.ai/guides/deployment/vercel)
- [Mastra Client SDK docs](https://mastra.ai/docs/server/mastra-client)
- [Mastra Client JS agents reference](https://mastra.ai/reference/client-js/agents)
- [Mastra agents overview](https://mastra.ai/docs/agents/overview)
- [Mastra workflows overview](https://mastra.ai/docs/workflows/overview)
- [Mastra memory overview](https://mastra.ai/docs/memory/overview)
- [Mastra Vercel deployer reference](https://mastra.ai/reference/deployer/vercel)
- [Mastra + Vercel AI Gateway integration](https://vercel.com/docs/ai-gateway/framework-integrations/mastra)
- [Mastra GitHub repository](https://github.com/mastra-ai/mastra)
- [Streaming instability issue (chatRoute + useChat)](https://github.com/mastra-ai/mastra/issues/10211)
- [Mastra blog: Using AI SDK with Mastra](https://mastra.ai/blog/using-ai-sdk-with-mastra)
