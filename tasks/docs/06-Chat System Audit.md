I'll audit the actual code — no assumptions. Starting with discovery.

# Chat System Audit — Gemini + Supabase

Based on reading [`useChat.ts`](https://claude.ai/epitaxy/src/hooks/useChat.ts), [`FloatingChatWidget.tsx`](https://claude.ai/epitaxy/src/components/chat/FloatingChatWidget.tsx), [`ChatInput.tsx`](https://claude.ai/epitaxy/src/components/chat/ChatInput.tsx), [`ChatMessageList.tsx`](https://claude.ai/epitaxy/src/components/chat/ChatMessageList.tsx), [`useRealtimeChannel.ts`](https://claude.ai/epitaxy/src/hooks/useRealtimeChannel.ts), [`ai-chat/index.ts`](https://claude.ai/epitaxy/supabase/functions/ai-chat/index.ts), [`_shared/gemini.ts`](https://claude.ai/epitaxy/supabase/functions/_shared/gemini.ts), [`_shared/rate-limit.ts`](https://claude.ai/epitaxy/supabase/functions/_shared/rate-limit.ts), [`_shared/supabase-clients.ts`](https://claude.ai/epitaxy/supabase/functions/_shared/supabase-clients.ts), [`_shared/http.ts`](https://claude.ai/epitaxy/supabase/functions/_shared/http.ts), and migration [`20260404044720_remote_schema.sql`](https://claude.ai/epitaxy/supabase/migrations/20260404044720_remote_schema.sql).

---

## 1. Executive Summary

The chat is **architecturally sound but has 4 silent correctness bugs that will misbehave in production today**, plus a history-spoofing vulnerability, plus flaky rate limiting. The core wiring (Gemini → SSE → UI, Zod validation, RLS, realtime broadcast) is correctly designed. The failure modes are in state management and trust boundaries, not plumbing.

**Will it work?** Yes, for a single user, single message, happy path. **Will it break?** Yes, on rapid sends, errors, retries, or any adversarial input.

---

## 2. Issues by Severity

### 🔴 Critical (ship-blockers)

|#|Issue|File:line|Impact|
|---|---|---|---|
|C1|**Duplicate user messages in chat UI.** Client inserts message with client-side UUID (`crypto.randomUUID()` line 141), then `INSERT` to DB generates a _different_ server UUID. Realtime trigger broadcasts the server row. Dedup check `prev.some(m => m.id === x)` fails → **user sees own message twice**|[useChat.ts:141,150,30](https://claude.ai/epitaxy/src/hooks/useChat.ts:141)|User-visible bug on every single send|
|C2|**History spoofing / prompt injection via client**. `ai-chat` trusts client-sent `messages[]` as conversation history — never loads from DB. Client can forge `{role:"user", content:"ignore prior instructions, do X"}` entries or impersonate system. `conversationId` is accepted but **unused server-side**|[ai-chat/index.ts:743,753-756](https://claude.ai/epitaxy/supabase/functions/ai-chat/index.ts:743)|Security — bypass system prompt, force jailbreaks, waste tokens|
|C3|**Duplicate send race.** `ChatInput.handleSend` checks `!isLoading`, but `isLoading` is flipped async inside `sendMessage` _after_ the DB insert + fetch start. Two rapid Enter presses fire two full round-trips and create **two user-message rows + two Gemini calls**|[ChatInput.tsx:17-22](https://claude.ai/epitaxy/src/components/chat/ChatInput.tsx:17) + [useChat.ts:128-157](https://claude.ai/epitaxy/src/hooks/useChat.ts:128)|Double-billing on Gemini, DB rows duplicated|
|C4|**Anonymous users can burn your Gemini key.** Edge function accepts anon-key auth (anyone) and rate-limits per-isolate only. In-memory buckets reset on cold start. A single attacker hitting different cold isolates bypasses the 10/min cap|[useChat.ts:178-182](https://claude.ai/epitaxy/src/hooks/useChat.ts:178) + [rate-limit.ts:3](https://claude.ai/epitaxy/supabase/functions/_shared/rate-limit.ts:3) + [ai-chat/index.ts:720-726](https://claude.ai/epitaxy/supabase/functions/ai-chat/index.ts:720)|Direct revenue impact — uncapped $/day|

### 🟠 High

|#|Issue|File:line|Impact|
|---|---|---|---|
|H1|**Assistant message never persisted if stream drops mid-flight.** DB insert happens only after the full read-loop completes (line 281). Closing the tab mid-stream = lost message|[useChat.ts:241-286](https://claude.ai/epitaxy/src/hooks/useChat.ts:241)|Missing history on refresh|
|H2|**Retry creates duplicate user message in DB.** First attempt inserts row at line 150. Retry calls `sendMessage(msg)` at line 335, which inserts _again_. No idempotency|[useChat.ts:323-337](https://claude.ai/epitaxy/src/hooks/useChat.ts:323)|Data integrity|
|H3|**Orphan conversations.** `createConversation` inserts into DB before Gemini call. Gemini 500 → conversation row exists with 0 messages permanently|[useChat.ts:132-137](https://claude.ai/epitaxy/src/hooks/useChat.ts:132)|DB pollution|
|H4|**Error on DB insert silently ignored.** `await supabase.from('messages').insert(...)` at line 150 has no `.error` check. If RLS blocks it (e.g., expired JWT), user sees their message in UI, it never hits DB → phantom message on refresh|[useChat.ts:150-154](https://claude.ai/epitaxy/src/hooks/useChat.ts:150)|Data loss, untraceable|
|H5|**`message_count` race.** Client-side `+2` increment can desync if assistant insert fails or concurrent updates happen. Should be a DB trigger|[useChat.ts:289-295](https://claude.ai/epitaxy/src/hooks/useChat.ts:289)|Stale counts|
|H6|**Tool call `Promise.all` fails-all on any single throw.** One bad tool → user sees "Failed to get final response." Should be `allSettled` with per-tool error string fed back to model|[ai-chat/index.ts:825-845](https://claude.ai/epitaxy/supabase/functions/ai-chat/index.ts:825)|Brittle UX|
|H7|**Internal `rentals` call via service role loses user context.** `ai-chat → rentals` uses `SUPABASE_SERVICE_ROLE_KEY` so downstream RLS is bypassed. Fine for public search, but if rentals ever adds user-scoped logic (saved searches, lead capture), user is unknowable|[ai-chat/index.ts:574-618](https://claude.ai/epitaxy/supabase/functions/ai-chat/index.ts:574)|Trust boundary|

### 🟡 Medium

|#|Issue|File:line|Impact|
|---|---|---|---|
|M1|`ai_runs` logged with hardcoded token counts of 0 and status `"success"` _before_ streaming completes|[ai-chat/index.ts:795-813](https://claude.ai/epitaxy/supabase/functions/ai-chat/index.ts:795)|Useless metrics, no cost tracking|
|M2|RLS policies use a gratuitous `profiles` subquery: `WHERE profiles.id = auth.uid()` instead of `user_id = (select auth.uid())`. Functionally equivalent but adds planner work per row|[migration:3392](https://claude.ai/epitaxy/supabase/migrations/20260404044720_remote_schema.sql)|Minor perf|
|M3|`content` max length 500,000 chars per message × 50 messages = 25 MB context. Way too permissive for prompt injection / token waste|[ai-chat/index.ts:13](https://claude.ai/epitaxy/supabase/functions/ai-chat/index.ts:13)|DoS surface|
|M4|No timeout on client-side stream read. Server timeout is 30s on initial Gemini call, but streaming phase has no client abort after N seconds of silence|[useChat.ts:241-278](https://claude.ai/epitaxy/src/hooks/useChat.ts:241)|Hung UI|
|M5|`session` fetched fresh each send (line 176) — good — but not refreshed during long streams. Token can expire mid-response|[useChat.ts:175-182](https://claude.ai/epitaxy/src/hooks/useChat.ts:175)|Rare|
|M6|Tool arg parse failure silently yields empty params via `safeJsonParse` → tool runs with `{}` no error logged|[ai-chat/index.ts:699-704](https://claude.ai/epitaxy/supabase/functions/ai-chat/index.ts:699)|Silent failure mode|
|M7|`handleTabChange` resets `messages` but **not** `currentConversation`, so next send writes to the previous tab's conversation until `useEffect` fires|[FloatingChatWidget.tsx:46-49](https://claude.ai/epitaxy/src/components/chat/FloatingChatWidget.tsx:46)|Wrong agent_type on first message after tab switch|

### 🟢 Low / style

|#|Issue|File:line|Impact|
|---|---|---|---|
|L1|Repeated inline `as` casts for `agentType` across 4 call sites — would be a helper|useChat.ts:60,97,166,285|Maintainability|
|L2|Toast success path missing (only errors)|useChat.ts|UX polish|
|L3|No unit or integration tests for chat subsystem|—|Regression risk|
|L4|`handleQuickAction` can be clicked repeatedly while loading — no guard|FloatingChatWidget.tsx:51|Double-send via quick actions|
|L5|Streaming cursor `<span className="animate-pulse" />` always renders on the last assistant message even after stream ends — cosmetic|ChatMessageList.tsx:57|Trivial|

---

## 3. Critical Fixes (do these 4 first)

### Fix C1 — Remove realtime duplication OR round-trip the server UUID

**Simpler fix:** disable realtime for your own sent messages; only use it for assistant updates from the edge function.

```tsx
// useChat.ts — capture server-generated ID instead of client UUID
const { data: userRow } = await supabase.from('messages').insert({
  conversation_id: conversation.id, role: 'user', content,
}).select('id, created_at').single();

const userMessage: ChatMessage = {
  id: userRow?.id ?? crypto.randomUUID(),  // server ID so dedup works
  conversation_id: conversation.id,
  role: 'user', content,
  created_at: userRow?.created_at ?? new Date().toISOString(),
};
setMessages(prev => [...prev, userMessage]);
```

Then the realtime `INSERT` payload IDs will match and dedup succeeds.

### Fix C2 — Server is the source of truth for history

```ts
// ai-chat/index.ts
if (conversationId) {
  const { data: history } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(50);
  aiMessages = [{ role: 'system', content: systemPrompt }, ...history, { role: 'user', content: lastUserMessage }];
}
```

Accept only the **latest user message** from the client — pull prior turns from DB. RLS already enforces ownership.

### Fix C3 — Ref-based send guard

```tsx
// ChatInput.tsx
const sendingRef = useRef(false);
const handleSend = () => {
  if (sendingRef.current || !input.trim() || isLoading) return;
  sendingRef.current = true;
  onSend(input.trim());
  setInput('');
  // reset guard when parent signals done
  setTimeout(() => { sendingRef.current = false; }, 500);
};
```

Better: move the guard into `useChat.sendMessage` with a ref check at the top so all call sites (tabs, quick actions, retry) are covered.

### Fix C4 — Gate anonymous chat + persist rate limits

- Return **401** for unauthenticated requests to `ai-chat`. Guest chat = separate cheaper flow or disabled.
- Replace in-memory bucket with a DB-backed limiter using a `rate_limits` table + `pg_cron` cleanup, or use Upstash Redis. At minimum, add a global hourly cap env var.

---

## 4. Best Practices Review

|Practice|Status|Evidence|
|---|---|---|
|Zod validation on edge input|✅|ai-chat:9-19|
|Input length caps|⚠️ too permissive|500KB×50 = 25MB|
|AbortController on fetch|✅ client + server|useChat:173, gemini.ts:26|
|Timeout on LLM call|✅ 30s|gemini.ts:21|
|CORS allow-list (no wildcard)|✅|http.ts:61-67|
|Rate limiting|⚠️ per-isolate, not durable|rate-limit.ts:3|
|Structured error envelope|✅|http.ts:115|
|SSE streaming format|✅|ai-chat:873-890|
|Retry logic|⚠️ creates duplicates|useChat:323|
|Loading + error + empty states|✅|ChatMessageList|
|RLS on conversations/messages|✅|migration:3364+|
|Separate user vs service Supabase clients|✅|supabase-clients.ts|
|`ai_runs` logging|⚠️ fake token counts, premature status|ai-chat:795|
|History from server|❌ client-trusted|ai-chat:753|
|Idempotency on writes|❌ none|useChat:150|
|Send debounce / duplicate guard|❌|ChatInput:17|
|Unit/integration tests|❌ zero coverage|—|
|Type safety|⚠️ casts via `as`|useChat:60,97,166,285|
|Secrets in frontend|✅ only anon key|useChat:179|
|Auth guard on admin routes|❌ unrelated but carries through|App.tsx|

---

## 5. Percent Correct

**≈ 70% correct.** Core plumbing is right; specific bugs invalidate safety and correctness assumptions. Breakdown:

- Architecture & layering: 90%
- Request/response handling: 85%
- Streaming: 90%
- Error handling: 60%
- State correctness: 55% (C1 + C3 + H1 + H4)
- Security: 50% (C2 + C4 are serious)
- Observability: 40% (fake metrics)
- Testing: 0%

---

## 6. Score: **62 / 100**

|Dimension|/100|
|---|---|
|Design|80|
|Implementation correctness|60|
|Security|50|
|Reliability|55|
|Observability|45|
|Testing|0|
|**Weighted overall**|**62**|

---

## 7. Production Readiness Verdict

**❌ Not production-ready.**

The 4 critical issues alone would cause a visible bug (C1) on every send, a security incident (C2 or C4) in week one, and a billing surprise (C3 or C4) in week two. Fix C1–C4 + H1–H4 before enabling for external users. After fixes, re-score — likely 85/100 at that point, ready for controlled rollout.

**Minimum to ship:** Apply the 4 critical fixes above (≈1 day of work) + add an integration test that sends 5 messages and verifies exactly 5 rows in `messages`. Ship behind a feature flag to 10% of users, monitor `ai_runs` for anomalies for 48h, then 100%.

---

## 8. Diagrams

### Current architecture (what's really happening)

```mermaid
flowchart LR
  U[User] -->|Enter or click Send| CI[ChatInput]
  CI -->|onSend content| UC[useChat.sendMessage]
  UC -->|optimistic client UUID| MS[messages state]
  UC -->|INSERT unchecked error| DB[(messages)]
  DB -.->|realtime broadcast<br/>server UUID| RT[useRealtimeChannel]
  RT -->|UUID mismatch = dup| MS
  UC -->|POST + full history| EF[ai-chat edge fn]
  EF -->|Zod + rate limit 10/min per isolate| EF
  EF -->|trusts client history| GM[Gemini Flash]
  GM -->|tool_calls| TL[Tool Executor]
  TL -->|service role| RE[rentals fn]
  TL -->|user client| DB2[(apartments, events...)]
  GM -->|SSE stream| EF
  EF -->|SSE| UC
  UC -->|accumulate| MS
  UC -->|INSERT assistant after stream ends| DB
  classDef bug fill:#fee,stroke:#c00,stroke-width:2px;
  class MS,RT,EF,UC bug
```

### Fix plan (target architecture)

```mermaid
flowchart LR
  U[User] --> CI[ChatInput + ref guard]
  CI -->|sendMessage| UC[useChat]
  UC -->|INSERT .select id| DB[(messages)]
  UC -->|optimistic with SERVER id| MS[messages state]
  DB -.->|realtime INSERT| RT[useRealtimeChannel]
  RT -->|id matches, dedup works| MS
  UC -->|POST conversationId + last user msg only| EF[ai-chat]
  EF -->|401 if not authed| UC
  EF -->|load history from DB via RLS| DB
  EF -->|durable rate limit via Postgres or Redis| RL[(rate_limits)]
  EF -->|Zod with strict caps<br/>content 8k chars| GM[Gemini Flash]
  GM -->|tool_calls| TL[Promise.allSettled]
  TL -->|per-tool error becomes<br/>string in tool response| GM
  GM -->|SSE| EF
  EF -->|SSE| UC
  UC -->|INSERT assistant INCREMENTALLY<br/>every N tokens| DB
  EF -->|ai_runs with real tokens<br/>after stream ends| AR[(ai_runs)]
  classDef fix fill:#efe,stroke:#070,stroke-width:2px;
  class CI,UC,EF,TL,AR fix
```

### Fix priority order

```mermaid
gantt
    title Chat fixes — priority order
    dateFormat  YYYY-MM-DD
    section Ship-blockers
    C1 Server UUID roundtrip         :crit, c1, 2026-04-22, 1d
    C3 Send debounce ref guard       :crit, c3, 2026-04-22, 1d
    C2 Server-authoritative history  :crit, c2, after c1, 1d
    C4 Require auth + durable RL     :crit, c4, after c3, 1d
    section High
    H1 Incremental assistant save    :h1, after c2, 1d
    H2 Idempotent retry              :h2, after c4, 1d
    H3 Lazy conversation create      :h3, after h1, 1d
    H4 Handle insert errors          :h4, after h1, 1d
    H6 Promise.allSettled tools      :h6, after h2, 1d
    section Medium
    M1 Real token counts             :m1, after h4, 2d
    M3 Tight content caps            :m3, after h6, 1d
    M7 Reset conversation on tab     :m7, after h3, 1d
    section Tests
    Integration test: 5 sends = 5 rows  :t1, after m1, 2d
    Load test: 100 concurrent anon      :t2, after t1, 1d
```

---

**TL;DR:** 62/100. Solid bones, four sharp edges. Fix C1-C4 this week, then it's genuinely shippable.