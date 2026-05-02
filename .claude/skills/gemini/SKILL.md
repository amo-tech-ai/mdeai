---
name: gemini
description: Use when integrating Gemini AI models in Supabase Edge Functions or Deno. Covers Gemini 3/3.1 models (gemini-3.1-pro-preview, gemini-3-flash-preview, gemini-3.1-flash-image-preview), thinking levels, URL Context, Google Search grounding, structured output, thought signatures, function calling, image generation, document processing, deep search, error handling, and REST API patterns. Use for AI enrichment, data extraction, analysis tasks, and image generation.
---

# Gemini AI Integration

Build AI features using Google's Gemini 3/3.1 models (gemini-3.1-pro-preview, gemini-3-flash-preview, gemini-3.1-flash-image-preview) with URL Context, Google Search grounding, structured outputs, thinking levels, function calling, and image generation.

---

## CRITICAL RULES (Audit Findings G1-G6)

> **These rules MUST be followed in every Gemini integration. Violating them causes crashes, degraded output, or security issues.**

| ID | Rule | Why |
|----|------|-----|
| **G1** | Always use `responseJsonSchema` with `responseMimeType: "application/json"` | `responseMimeType` alone just *asks* the model to try JSON. Adding `responseJsonSchema` **guarantees** syntactically valid JSON matching the schema. Without it, JSON parse crashes are likely. |
| **G2** | Keep temperature at default `1.0` for Gemini 3 | Setting temperature below 1.0 causes looping, repetitive output, or degraded performance on Gemini 3 models. The docs explicitly warn against this. |
| **G3** | Combine structured output with Google Search | Gemini 3 supports `responseJsonSchema` + `googleSearch` together. Use both to get valid JSON even with search grounding. Without the schema, search metadata can corrupt JSON output. |
| **G4** | Pass API key via `x-goog-api-key` header, NOT query param | `?key=` exposes the key in server logs and referrer headers. Every official REST example uses the header. |
| **G5** | Extract `groundingChunks` citations from Google Search | The response includes `groundingChunks` (source URLs/titles) and `groundingSupports` (inline citation mapping). Don't discard this data — use it for citations. |
| **G6** | Both `googleSearch` and `google_search` casing work | The API accepts both camelCase and snake_case via protobuf. Use camelCase for SDK consistency. |

---

## Quick Reference

| Model | Use Case | Context | Pricing |
|-------|----------|---------|---------|
| `gemini-3.1-pro-preview` | Complex reasoning, analysis | 1M / 64k | $2-4 / $12-18 |
| `gemini-3-flash-preview` | Fast responses, extraction, chat | 1M / 64k | $0.50 / $3 |
| `gemini-3.1-flash-image-preview` | Image generation (4K) | 65k / 32k | $2 / $0.134 |

All Gemini 3 models have a knowledge cutoff of **January 2025**.

## SDK Setup (Deno Edge Functions)

```typescript
import { GoogleGenAI } from "npm:@google/genai@^1.0.0";

const ai = new GoogleGenAI({ apiKey: Deno.env.get("GEMINI_API_KEY") });
```

**IMPORTANT:** Use `npm:@google/genai@^1.0.0` (not `esm.sh`, not legacy `@google/generativeai`).

## Thinking Levels

Control reasoning depth with `thinkingLevel` (Gemini 3):

| Level | Models | Use Case | Latency |
|-------|--------|----------|---------|
| `minimal` | Flash only | Matches "no thinking" for most queries | Lowest |
| `low` | Pro + Flash | Simple instruction following | Low |
| `medium` | Flash only | Balanced tasks | Medium |
| `high` | Pro + Flash | Complex analysis, scoring (default) | Higher |

```typescript
// SDK pattern
const response = await ai.models.generateContent({
  model: "gemini-3-flash-preview",
  contents: prompt,
  config: {
    thinkingConfig: {
      thinkingLevel: "high"  // For complex analysis
    }
  }
});
```

**Best Practice:** Use `high` for scoring, readiness calculations, and complex analysis. Use `low` or `minimal` for simple extraction and chat.

**WARNING:** Cannot use both `thinkingLevel` and legacy `thinkingBudget` in the same request (400 error).

## Built-in Tools

### 1. URL Context

Extract data from web URLs directly:

```typescript
const response = await ai.models.generateContent({
  model: "gemini-3-flash-preview",
  contents: `Extract company info from ${url}`,
  config: {
    tools: [{ urlContext: {} }]
  }
});
```

**Limitations:**
- Up to 20 URLs per request
- Max 34MB per URL
- Cannot access: paywalled content, YouTube, Google Workspace, localhost
- Supported: HTML, JSON, PDF, images (PNG, JPEG)

**Metadata access:**
```typescript
const metadata = response.candidates[0].urlContextMetadata;
// Check retrieval status for each URL
```

### 2. Google Search Grounding

Connect to real-time web information:

```typescript
const response = await ai.models.generateContent({
  model: "gemini-3-flash-preview",
  contents: "Who won the 2024 Euro championship?",
  config: {
    tools: [{ googleSearch: {} }]
  }
});

// Access grounding metadata (G5: DON'T discard this!)
const { webSearchQueries, groundingChunks, groundingSupports } =
  response.candidates[0].groundingMetadata;
```

**Extracting Citations (G5):**
```typescript
// groundingChunks contains source URLs and titles
const citations = groundingChunks?.map(chunk => ({
  url: chunk.web?.uri,
  title: chunk.web?.title
})) ?? [];

// groundingSupports maps text segments to sources
const supports = groundingSupports?.map(support => ({
  text: support.segment?.text,
  sources: support.groundingChunkIndices  // indexes into groundingChunks
})) ?? [];
```

**Combine Tools:**
```typescript
config: {
  tools: [
    { urlContext: {} },
    { googleSearch: {} }
  ]
}
```

## Structured Output

Force JSON responses matching a schema. **G1: Always use `responseJsonSchema` — this guarantees valid JSON.**

```typescript
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const schema = z.object({
  company_name: z.string(),
  industry: z.array(z.string()),
  description: z.string(),
  founded_year: z.number().optional()
});

const response = await ai.models.generateContent({
  model: "gemini-3-flash-preview",
  contents: `Extract company info from: ${url}`,
  config: {
    tools: [{ urlContext: {} }],
    responseMimeType: "application/json",
    responseJsonSchema: zodToJsonSchema(schema)  // G1: REQUIRED for valid JSON
  }
});

const data = schema.parse(JSON.parse(response.text));
```

**Why `responseJsonSchema` matters:**
- `responseMimeType` alone = model *tries* to output JSON (can fail)
- `responseMimeType` + `responseJsonSchema` = **guaranteed** syntactically valid JSON matching the schema
- Works with Google Search, URL Context, and Code Execution tools (G3)

**Supported types:** `string`, `number`, `integer`, `boolean`, `object`, `array`, `null`

## REST API Patterns

For raw `fetch()` calls in Edge Functions (instead of SDK):

### Basic Request

```typescript
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const model = "gemini-3-flash-preview";

// G4: Use x-goog-api-key header, NOT ?key= query param
const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

const response = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-goog-api-key": GEMINI_API_KEY,  // G4: Header, not query param
  },
  body: JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseJsonSchema: schema,  // G1: Include schema
      // G2: Do NOT set temperature below 1.0
      thinkingConfig: {
        thinkingLevel: "high"
      }
    }
  })
});

const data = await response.json();
const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
```

### With Google Search + Structured Output (G3)

```typescript
const response = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-goog-api-key": GEMINI_API_KEY,
  },
  body: JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    tools: [{ googleSearch: {} }],
    generationConfig: {
      responseMimeType: "application/json",
      responseJsonSchema: {
        type: "object",
        properties: {
          summary: { type: "string" },
          sources: {
            type: "array",
            items: {
              type: "object",
              properties: {
                url: { type: "string" },
                title: { type: "string" }
              }
            }
          }
        },
        required: ["summary", "sources"]
      }
    }
  })
});

const data = await response.json();
const result = JSON.parse(data.candidates[0].content.parts[0].text);

// G5: Also extract grounding citations
const groundingChunks = data.candidates[0].groundingMetadata?.groundingChunks ?? [];
```

### Streaming (REST)

```typescript
const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`;

const response = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-goog-api-key": GEMINI_API_KEY,
  },
  body: JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }]
  })
});
```

## Complete Edge Function Pattern

```typescript
import { GoogleGenAI } from "npm:@google/genai@^1.0.0";
import { z } from "npm:zod@^3.23.0";
import { zodToJsonSchema } from "npm:zod-to-json-schema@^3.23.0";

const ai = new GoogleGenAI({ apiKey: Deno.env.get("GEMINI_API_KEY") });

// Enrichment with URL Context + Google Search + Structured Output
async function enrichUrl(url: string) {
  const schema = z.object({
    company_name: z.string(),
    description: z.string(),
    industry: z.array(z.string()),
    competitors: z.array(z.object({
      name: z.string(),
      differentiator: z.string()
    }))
  });

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze this company: ${url}. Find competitors.`,
    config: {
      tools: [
        { urlContext: {} },
        { googleSearch: {} }
      ],
      responseMimeType: "application/json",
      responseJsonSchema: zodToJsonSchema(schema),  // G1+G3
      thinkingConfig: {
        thinkingLevel: "medium"
      }
      // G2: No temperature override — keeps default 1.0
    }
  });

  // G5: Extract citations
  const citations = response.candidates[0]?.groundingMetadata
    ?.groundingChunks?.map(c => ({ url: c.web?.uri, title: c.web?.title })) ?? [];

  return {
    data: schema.parse(JSON.parse(response.text)),
    citations
  };
}

// Analysis with high thinking
async function calculateReadiness(data: object) {
  const schema = z.object({
    overall_score: z.number().min(0).max(100),
    category_scores: z.object({
      product: z.number(),
      market: z.number(),
      team: z.number(),
      clarity: z.number()
    }),
    recommendations: z.array(z.string())
  });

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Calculate investor readiness score: ${JSON.stringify(data)}`,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: zodToJsonSchema(schema),  // G1
      thinkingConfig: {
        thinkingLevel: "high"  // Deep reasoning for scoring
      }
    }
  });

  return schema.parse(JSON.parse(response.text));
}
```

## Function Calling

Declare tools the model can call:

```typescript
const tools = [{
  functionDeclarations: [{
    name: "get_weather",
    description: "Get weather for a city",
    parameters: {
      type: "object",
      properties: {
        city: { type: "string", description: "City name" }
      },
      required: ["city"]
    }
  }]
}];

const response = await ai.models.generateContent({
  model: "gemini-3-flash-preview",
  contents: "What's the weather in Paris?",
  config: { tools }
});

// Handle function call
const functionCall = response.functionCalls?.[0];
if (functionCall) {
  // Execute your function, then send result back
}
```

**Modes:** `AUTO` (default), `ANY` (force tool use), `NONE` (disable), `VALIDATED`

**NOTE:** Combining built-in tools (Google Search, URL Context) with function calling is NOT supported in Gemini 3.

## Thought Signatures (Multi-turn)

For function calling and image editing workflows, preserve thought context:

```typescript
// Model response includes thoughtSignature
const response1 = await ai.models.generateContent({...});
const signature = response1.candidates[0].content.parts[0].thoughtSignature;

// Return signature in next request
const response2 = await ai.models.generateContent({
  model: "gemini-3-flash-preview",
  contents: [
    { role: "user", parts: [{ text: "Initial prompt" }] },
    {
      role: "model",
      parts: [{
        functionCall: {...},
        thoughtSignature: signature  // REQUIRED for function calling
      }]
    },
    { role: "user", parts: [{ functionResponse: {...} }] }
  ]
});
```

**Rules:**
- **Required** for function calling (400 error without it)
- **Required** for multi-turn image editing conversations (single-turn generation works without them)
- **Recommended** for text/chat (improves reasoning continuity)
- SDKs handle this automatically
- SDKs manage thought signatures automatically; preserve all accumulated signatures in multi-turn
- Parallel calls: only the first `functionCall` has the signature
- Multi-step: ALL accumulated signatures must be preserved

## Image Generation

```typescript
const response = await ai.models.generateContent({
  model: "gemini-3.1-flash-image-preview",
  contents: "Generate a logo for a tech startup",
  config: {
    tools: [{ googleSearch: {} }],  // Optional: ground in real data
    imageConfig: {
      aspectRatio: "16:9",
      imageSize: "4K"
    }
  }
});

// Extract image
const imagePart = response.candidates[0].content.parts
  .find(p => p.inlineData);
const imageData = imagePart.inlineData.data;  // base64
```

**Key capabilities:**
- 4K resolution with text rendering
- Grounded generation via Google Search
- Conversational editing (multi-turn, requires thought signatures)
- SynthID watermarks on all generated images

## Document Processing

Process PDFs and documents directly:

```typescript
// Inline (small docs)
const response = await ai.models.generateContent({
  model: "gemini-3-flash-preview",
  contents: [
    { text: "Summarize this document" },
    { inlineData: { mimeType: "application/pdf", data: base64Data } }
  ]
});

// Files API (large docs, recommended)
const file = await ai.files.upload({ file: "document.pdf" });
const response = await ai.models.generateContent({
  model: "gemini-3-flash-preview",
  contents: [
    { text: "Extract key findings" },
    { fileData: { fileUri: file.uri, mimeType: file.mimeType } }
  ]
});
```

- Supports up to 1000 pages
- Use `mediaResolution: "media_resolution_medium"` for standard PDFs
- Combine with structured output for typed extraction

## System Instructions

```typescript
const response = await ai.models.generateContent({
  model: "gemini-3-flash-preview",
  contents: "Hello there",
  config: {
    systemInstruction: "You are a startup advisor. Be concise and data-driven.",
  }
});
```

## Temperature

**G2: Always use default temperature (1.0) for Gemini 3.** Lower values cause looping or degraded performance, especially for reasoning and math tasks.

```typescript
// WRONG — causes issues on Gemini 3
config: { temperature: 0.4 }

// RIGHT — use default (omit temperature)
config: { /* no temperature setting */ }
```

## Error Handling

| Code | Error | Cause | Fix |
|------|-------|-------|-----|
| 400 | `INVALID_ARGUMENT` | Bad request params, missing thought signature | Check schema, ensure thought signatures present |
| 403 | `PERMISSION_DENIED` | Invalid API key or restricted | Check key, ensure API enabled |
| 404 | `NOT_FOUND` | Model not found | Verify model ID (e.g., `gemini-3-flash-preview`) |
| 429 | `RESOURCE_EXHAUSTED` | Rate limit hit | Implement exponential backoff |
| 500 | `INTERNAL` | Server error | Retry with backoff |
| 503 | `UNAVAILABLE` | Service temporarily down | Retry with backoff |

**Retry pattern:**
```typescript
async function callGeminiWithRetry(fn: () => Promise<any>, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429 || error.status >= 500) {
        await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
        continue;
      }
      throw error;  // Don't retry 400/403/404
    }
  }
  throw new Error("Max retries exceeded");
}
```

## Token Counting

```typescript
const { thoughtsTokenCount, candidatesTokenCount, totalTokenCount } =
  response.usageMetadata;

// For URL Context
const { toolUsePromptTokenCount } = response.usageMetadata;
```

## Common Patterns

### Extraction with Fallback
```typescript
try {
  // Try URL Context first
  const result = await enrichWithUrlContext(url);
} catch (error) {
  // Fallback to Google Search
  const result = await enrichWithGoogleSearch(companyName);
}
```

### Founder Lookup (Google Search Only)
```typescript
// DON'T use URL Context for LinkedIn (private profiles)
const response = await ai.models.generateContent({
  model: "gemini-3-flash-preview",
  contents: `Find info about founder: "${name}" at "${company}"`,
  config: {
    tools: [{ googleSearch: {} }],  // Not urlContext!
    responseMimeType: "application/json",
    responseJsonSchema: founderSchema  // G1: Always include schema
  }
});
```

## Resources

- [references/gemini-3.md](references/gemini-3.md) - Full Gemini 3 documentation
- [references/text-generation.md](references/text-generation.md) - Text gen, system instructions, temperature
- [references/structured-output.md](references/structured-output.md) - JSON schema output, Zod patterns
- [references/google-search.md](references/google-search.md) - Google Search grounding, citations
- [references/function-calling.md](references/function-calling.md) - Tool declarations, multi-turn
- [references/thinking.md](references/thinking.md) - Thinking levels, budgets
- [references/thought-signatures.md](references/thought-signatures.md) - Multi-turn state, function calling
- [references/url-context.md](references/url-context.md) - URL extraction, limitations
- [references/image-generation.md](references/image-generation.md) - Nano Banana, 4K, SynthID
- [references/document-processing.md](references/document-processing.md) - PDF, inline data, Files API
- [references/deep-search.md](references/deep-search.md) - Deep Research Agent, Interactions API
- [references/troubleshooting.md](references/troubleshooting.md) - Error codes, temperature warnings
- [references/api-setup.md](references/api-setup.md) - API keys, SDKs, quickstart

## Checklist

When implementing Gemini AI:

- [ ] Use `npm:@google/genai@^1.0.0` (not esm.sh, not legacy SDK)
- [ ] Set `GEMINI_API_KEY` via `Deno.env.get()` in Edge Functions
- [ ] **G1:** Use BOTH `responseMimeType` AND `responseJsonSchema` for JSON output
- [ ] **G2:** Do NOT set temperature below 1.0 on Gemini 3 models
- [ ] **G3:** Combine `responseJsonSchema` with `googleSearch` when using both
- [ ] **G4:** Pass API key via `x-goog-api-key` header (not query param)
- [ ] **G5:** Extract `groundingChunks` citations from Google Search responses
- [ ] Choose appropriate thinking level for task complexity
- [ ] Handle URL Context failures with Google Search fallback
- [ ] Don't use URL Context for private pages (LinkedIn)
- [ ] Return thought signatures for function calling and image editing
- [ ] Implement retry with exponential backoff for 429/5xx errors
