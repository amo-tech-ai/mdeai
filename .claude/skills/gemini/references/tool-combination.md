# Tool Combination in Gemini 3

> Source: https://ai.google.dev/gemini-api/docs/tool-combination (last updated 2026-04-28)
> **Status (2026-05-03):** Preview. Verified against the live docs by the mdeai gemini audit.

## What's supported

Gemini 3 supports combining custom function calling with these built-in tools in a single generation call:

- Google Search grounding
- Google Maps grounding
- File Search
- Code Execution
- (any combination of the above)

Plus URL Context — but **only with built-in tools**. URL Context + custom function calling specifically is **not supported** (verbatim from `https://ai.google.dev/gemini-api/docs/url-context`: *"Function calling with URL Context is currently unsupported."*).

The relevant capability the docs name is *"tool context circulation"* — the model carries reasoning state across heterogeneous tools so a single turn can search the web, call a custom function with the result, then run code on the function's output.

## Why this matters for mdeai

Three Phase 2-4 tasks need this combination explicitly:

| Task | Combination |
|---|---|
| `009-chatbot-event-creation` | custom event-creation functions + Google Search (current ticket prices on competitive events) |
| `043-ai-venue-optimizer-edge-fn` | custom venue/seat-block functions + Google Maps + Google Search + Code Execution |
| `044-ai-venue-layout-generator-edge-fn` | custom layout-generator function + Code Execution (Python geometry) |

Without tool combination, each of those would need a multi-call orchestration layer in our edge function. With it, a single `generateContent` call handles the round-trip.

## Required settings

| Setting | Value | Why |
|---|---|---|
| `include_server_side_tool_invocations` | `true` | Tells the server to surface built-in tool calls in the response stream so the SDK can return signatures back to the client. Without it, signatures get dropped and turn 2 fails with 400. |
| `thoughtSignature` preservation | always pass back `thoughtSignature` + `id` + `tool_type` from each `Part` | Gemini 3 returns 400 if signatures are dropped between turns. The `@google/genai` SDK manages this automatically — don't hand-roll it. |
| `mode: VALIDATED` | recommended | Verbatim from function-calling docs: *"Default mode for tool combination. Ensures function schema adherence."* |

## Example: chatbot + Google Search + custom event tools (mirrors task 009)

```typescript
import { GoogleGenAI, Type } from "npm:@google/genai@^1.0.0";

const ai = new GoogleGenAI({ apiKey: Deno.env.get("GEMINI_API_KEY") });

const eventTools = {
  functionDeclarations: [
    {
      name: "create_event_draft",
      description: "Persist a draft event to the events table.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          start_at: { type: Type.STRING, description: "ISO timestamp" },
          venue_id: { type: Type.STRING, description: "UUID" },
          ticket_tiers: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                price_cop: { type: Type.INTEGER },
                qty_total: { type: Type.INTEGER },
              },
            },
          },
        },
        required: ["title", "start_at"],
      },
    },
    {
      name: "search_venues",
      description: "Search venues by city + capacity.",
      parameters: {
        type: Type.OBJECT,
        properties: {
          city: { type: Type.STRING },
          min_capacity: { type: Type.INTEGER },
        },
      },
    },
  ],
};

const response = await ai.models.generateContent({
  model: "gemini-3-flash-preview",
  contents: "Help me create a music festival in Medellín for ~2000 people. " +
    "Check current ticket prices for similar Bogotá festivals so I can price competitively.",
  config: {
    tools: [
      eventTools,                    // custom functions
      { googleSearch: {} },          // built-in: real-time pricing data
    ],
    toolConfig: {
      functionCallingConfig: {
        mode: "VALIDATED",            // recommended for combinations
      },
    },
    // include_server_side_tool_invocations is set automatically by the SDK
    // when you mix custom + built-in tools.
  },
});

// Inspect what the model did
const calls = response.functionCalls ?? [];
for (const call of calls) {
  console.log(`Custom function: ${call.name}`, call.args);
}

// Extract Search citations (G5)
const citations = response.candidates?.[0]?.groundingMetadata?.groundingChunks
  ?.map((c) => ({ url: c.web?.uri, title: c.web?.title })) ?? [];
```

## Anti-patterns

- ❌ Trying to combine on Gemini 2.x — explicitly not supported. Tool combination is a Gemini 3 feature.
- ❌ Dropping `thoughtSignature` between turns — every signature must be echoed back in the next user/tool turn or you get a 400.
- ❌ Hand-rolling signature management — use `npm:@google/genai@^1.0.0` SDK; it tracks them automatically.
- ❌ URL Context + custom functions in the same request — this single combo is unsupported. Use URL Context alone, or pre-fetch the URL contents and inject them as text.
- ❌ Setting `temperature` below 1.0 to "tighten" tool selection — G2 forbids this on Gemini 3, and tool selection is governed by `mode` (`AUTO`/`ANY`/`VALIDATED`/`NONE`), not temperature.

## Pricing

Standard token billing applies for the text portions of the call. Built-in tools layer on top:

| Tool | Pricing |
|---|---|
| Google Search | per *search query* the model executes (a single prompt may issue multiple queries) |
| Google Maps grounding | $25 per 1,000 grounded prompts; free tier 500/day |
| Code Execution | included in token billing for the executed Python (no extra fee at preview) |
| URL Context | included in input tokens for the fetched content |
| Custom function calls | free — they're just JSON in/out |

## Compatibility matrix (Gemini 3 vs older)

| Capability | Gemini 3 Pro | Gemini 3 Flash | Gemini 3 Flash-Lite | Gemini 2.x |
|---|---|---|---|---|
| Custom + Google Search | ✅ | ✅ | ✅ | ❌ |
| Custom + Maps | ✅ | ✅ | ✅ | ❌ |
| Custom + Code Execution | ✅ | ✅ | ✅ | ❌ |
| Custom + URL Context | ❌ (unsupported single combo) | ❌ | ❌ | ❌ |
| Built-ins + Built-ins (no custom) | ✅ | ✅ | ✅ | partial |

## See also

- [`function-calling.md`](./function-calling.md) — declarations, modes, multi-turn
- [`thought-signatures.md`](./thought-signatures.md) — why signatures matter + how to preserve them
- [`google-search.md`](./google-search.md) — Search grounding details
- [`maps-grounding.md`](./maps-grounding.md) — Maps grounding details
- [`code-execution.md`](./code-execution.md) — Python sandbox details
- [`url-context.md`](./url-context.md) — URL Context limitations (incl. the function-calling exception)
- Live docs: https://ai.google.dev/gemini-api/docs/tool-combination
