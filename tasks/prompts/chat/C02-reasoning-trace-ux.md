---
id: C02
title: Reasoning Trace UX — "Thought for Ns" Collapsible Panel
status: Not Started
priority: P0
effort: 2 days
revenue_impact: High — +15% trust → +20% conversion on $1,200/mo decisions
depends_on: ai-chat SSE phase events (see CHAT-CENTRAL-PLAN §3)
skill:
  - frontend-design
  - gemini
  - better-chatbot
---

<!-- task-summary -->
> **What:** Reasoning Trace UX — "Thought for Ns" Collapsible Panel
> **Why:** Per `CHAT-CENTRAL-PLAN.md §3`, the SSE stream should emit `phase` events that the client renders as a collapsible "Thought for Ns" panel. This is the ChatGPT/Perplexity thinking trace pattern. Without it, users see…
> **Tools/Skills:** `frontend-design` · `gemini` · `better-chatbot`
> **P0 · Not Started · Effort: 2 days**
> **Depends on:** ai-chat SSE phase events (see CHAT-CENTRAL-PLAN §3)

# C02 — Reasoning Trace UX

## Problem

Per `CHAT-CENTRAL-PLAN.md §3`, the SSE stream should emit `phase` events that the client renders as a collapsible "Thought for Ns" panel. This is the ChatGPT/Perplexity thinking trace pattern. Without it, users see "thinking..." and then results with no context — low trust for a $1,200/mo apartment decision.

The SSE format is defined in the plan:
```
data: {"phase":"handoff","agent_label":"Rentals Concierge","message":"Handing off..."}
data: {"phase":"thinking","message":"Scouting 43 rentals across sources..."}
data: {"phase":"thinking","message":"Filtering 7 scam-flagged listings..."}
data: {"phase":"thinking","message":"Considering 12 of 43 matching your criteria..."}
```

Currently: `ai-chat/index.ts` does NOT emit these phase events. The SSE stream goes directly from `[tool_call_start]` to text content.

## What to Build

### 1. Phase events in ai-chat/index.ts

Before calling the first Gemini API (initial tool decision), emit:
```typescript
const encoder = new TextEncoder();
// When AI decides to call a tool, emit handoff phase
if (toolName === 'rentals_search') {
  yield encoder.encode(`data: ${JSON.stringify({
    phase: 'handoff',
    agent_label: 'Rentals Concierge',
    message: 'Looking up rentals for you...'
  })}\n\n`);
}
// After tool call completes, emit result phase
yield encoder.encode(`data: ${JSON.stringify({
  phase: 'thinking',
  message: `Scanned ${result.total_count} listings, applying your filters...`
})}\n\n`);
```

Refactor `ai-chat/index.ts` to use a `ReadableStream` with a generator so we can emit events at each step:
1. Before tool call: "Analyzing your request..."
2. After intent identified: "Switching to [Agent Label]..."
3. During tool execution: "Searching [N] listings..."
4. After tool returns: "Found [N] matches, checking [M] against your criteria..."
5. Before text stream: emit `__mdeai_actions__` then start text

### 2. Parse phase events in useChat.ts

The SSE parser in `sendMessage` already handles `__mdeai_actions__`. Add phase event handling:

```typescript
if (parsed.phase) {
  setReasoningPhases(prev => [...prev, {
    phase: parsed.phase,
    message: parsed.message,
    agent_label: parsed.agent_label,
    timestamp: Date.now(),
  }]);
  continue;
}
```

`reasoningPhases` is already returned from `useChat` (currently empty array). Change it to real state:
```typescript
const [reasoningPhases, setReasoningPhases] = useState<ReasoningPhase[]>([]);
```

Clear reasoning phases when new message sent:
```typescript
setReasoningPhases([]); // at start of sendMessage
```

### 3. ChatReasoningTrace component

File: `src/components/chat/ChatReasoningTrace.tsx`

```tsx
interface ReasoningPhase {
  phase: 'handoff' | 'thinking' | 'done';
  message: string;
  agent_label?: string;
  timestamp: number;
}

interface ChatReasoningTraceProps {
  phases: ReasoningPhase[];
  isStreaming: boolean;
  agentLabel?: string;
}
```

Render:
- During streaming: animated "Thought for Ns" header with spinner
- Expanding on click: ordered list of phase messages
- After streaming: collapsible "Thought for 2.3s ↕" with phase list inside
- Agent badge: "Rentals Concierge" label with housing icon

Display above each assistant message. Minimal, doesn't take vertical space when collapsed.

### 4. Wire into ChatMessageList

For each assistant message, if `reasoningPhases` is non-empty, render `<ChatReasoningTrace>` above the message content.

Since reasoning phases are per-turn (not per-message), associate them with the last assistant message during streaming. After streaming completes, freeze them with the message.

Option: store `reasoning_trace: ReasoningPhase[]` in the `ChatMessage.metadata` field before persisting to DB. Then `ChatMessageList` reads it from the message itself.

### 5. Agent Label in system prompt

When `agent_label` is "Rentals Concierge", the ai-chat response should be framed from that persona:
```
System: You are Mia, the mdeai Rentals Concierge. Speak with warmth and expertise about Medellín rentals...
```

Different agents for different intents (from ai-router):
- `housing_search` → "Rentals Concierge" (persona: Mia)
- `event_discover` → "Events Scout" (persona: Carlos)
- `restaurant_discovery` → "Food Scout" (persona: Ana)
- `trip_planning` → "Tour Guide" (persona: Sofia)
- `landlord_listing` → "Host Manager" (persona: Diego)

## Acceptance Criteria

- [ ] Typing "rentals Laureles" shows animated "Thinking..." during stream
- [ ] After response: "Thought for 2.1s ↕" collapsible appears above AI text
- [ ] Expanding shows 3-5 phase messages with timestamps
- [ ] Agent label "Rentals Concierge" shows in reasoning trace header
- [ ] Phase events don't appear in the text content of the message
- [ ] reasoningPhases cleared when new message sent
- [ ] Works on mobile (collapsible doesn't overflow)

## Files to Touch

- `supabase/functions/ai-chat/index.ts` — emit phase events via SSE generator
- `src/hooks/useChat.ts` — parse phase events, real reasoningPhases state
- `src/components/chat/ChatReasoningTrace.tsx` — create
- `src/components/chat/ChatMessageList.tsx` — wire in ChatReasoningTrace
- `src/types/chat.ts` — add ReasoningPhase type

---

## Definition of Done (continuous testing — mandatory)

A task is **not** done until every applicable row is checked. "Code merged" is not the finish line — **tested + verified live** is. See [.claude/rules/task-writing.md §9](../../../.claude/rules/task-writing.md) and [CLAUDE.md → Definition of Done](../../../CLAUDE.md).

- [ ] `npm run lint` clean
- [ ] `npm run build` clean
- [ ] `npm run test` clean and **count did not regress** (new logic = new tests; bugs = regression test that fails without the fix)
- [ ] `npm run verify:edge` clean *(only if `supabase/` was touched — else "N/A — no edge-fn change")*
- [ ] E2E covered *(Playwright spec OR documented manual run with screenshot — only if user-facing flow touched; else "N/A")*
- [ ] Live verification on https://www.mdeai.co after Vercel deploy *(only if UI shipped to prod; HTTP 200 + visual check)*
- [ ] PR body lists what was tested + result for each layer

If a layer is N/A, **say so explicitly** in the PR. Silence ≠ exemption.
