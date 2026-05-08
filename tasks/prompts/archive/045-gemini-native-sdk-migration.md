---
task_id: 045-gemini-native-sdk-migration
title: Migrate _shared/gemini.ts from OpenAI-compat → native @google/genai SDK
phase: PHASE-1.5-EVENTS
priority: P1
status: Done
estimated_effort: 1 day
area: backend
skill:
  - gemini
  - supabase-edge-functions
  - mdeai-project-gates
edge_function: _shared (helper) + ai-router, ai-search, ai-chat, ai-trip-planner, ai-suggest-collections, ai-optimize-route, rentals
schema_tables: []
depends_on: []
mermaid_diagram: null
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-1.5-EVENTS — fast-follow housekeeping; unblocks all Phase 2-4 Gemini features |
| **Path** | Refactors `supabase/functions/_shared/gemini.ts` + 7 callers |
| **Hot-fix bundled** | `ai-trip-planner/index.ts:295` — `gemini-3-pro-preview` (sunsets **March 9, 2026**) → `gemini-3.1-pro-preview` |
| **Real-world** | After this task, every Gemini call gets `responseJsonSchema` (no more parse failures), `thinkingLevel` (cost tuning), and the option to combine built-in tools (Maps/Search/Code Exec/URL Context) with custom function calling |

## Description

**The situation.** `supabase/functions/_shared/gemini.ts` calls Gemini's OpenAI-compatibility endpoint (`/v1beta/openai/chat/completions`) with `Authorization: Bearer`. This works for basic chat but **disables** every advanced feature we need for tasks 002, 009, 033, 043, 044:

- ❌ No `responseJsonSchema` (skill rule G1 — guaranteed-valid JSON)
- ❌ No `thinkingLevel` (cost/quality tuning per request)
- ❌ No Google Search / Maps / URL Context grounding
- ❌ No Code Execution sandbox
- ❌ No multimodal `mediaResolution` control
- ❌ No thought signatures (required by Gemini 3 for multi-turn function calling — task 009 chatbot will 400 without these)
- ❌ No image generation (sponsor banners, event share-cards)
- ❌ No context caching (50% cost cut on `ai-chat` system prompts)

The migration replaces the helper + its callers with the native Gemini API, accessed via `npm:@google/genai@^1.0.0`. **Once shipped, every existing edge fn keeps working** + the new features become available drop-in.

**Plus a hot-fix:** `ai-trip-planner/index.ts:295` references `gemini-3-pro-preview` (no `.1`), which sunsets **March 9, 2026**. Bundle the rename here so the deprecation is gone in the same migration.

## Goals

1. **Primary:** All Gemini callers use the native SDK with the `_shared/gemini.ts` helper.
2. **Quality:** Zero behavior regressions on existing edge fns (ai-router, ai-search, ai-chat, ai-trip-planner, ai-suggest-collections, ai-optimize-route, rentals).
3. **Hardening:** Every G1-G7 rule enforceable via the helper signature (e.g., `callGeminiStructured` requires a Zod schema arg).

## The new `_shared/gemini.ts` (target shape)

```typescript
// supabase/functions/_shared/gemini.ts
import { GoogleGenAI } from "npm:@google/genai@^1.0.0";
import { z } from "npm:zod@^3.23.0";
import { zodToJsonSchema } from "npm:zod-to-json-schema@^3.23.0";

let _ai: GoogleGenAI | null = null;
function client(): GoogleGenAI {
  if (_ai) return _ai;
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new Error("GEMINI_API_KEY environment variable not set");
  _ai = new GoogleGenAI({ apiKey: key });
  return _ai;
}

export interface CallGeminiArgs<TSchema extends z.ZodTypeAny> {
  model: "gemini-3-flash-preview" | "gemini-3.1-pro-preview" | "gemini-3.1-flash-lite-preview";
  prompt: string;
  systemInstruction?: string;
  schema: TSchema;                          // G1: ALWAYS required
  thinkingLevel?: "minimal" | "low" | "medium" | "high";
  tools?: Array<{ googleSearch?: object } | { urlContext?: object } | { googleMaps?: object } | { codeExecution?: object }>;
  timeoutMs?: number;                       // default 30s
  agentName: string;                        // for ai_runs logging
  // No `temperature` parameter — G2 forbids overriding
}

export interface CallGeminiResult<T> {
  data: T;
  citations: Array<{ url: string; title: string }>;
  usage: { input_tokens: number; output_tokens: number; thoughts_tokens?: number };
  duration_ms: number;
}

export async function callGeminiStructured<TSchema extends z.ZodTypeAny>(
  args: CallGeminiArgs<TSchema>,
): Promise<CallGeminiResult<z.infer<TSchema>>> {
  const start = Date.now();
  const response = await Promise.race([
    client().models.generateContent({
      model: args.model,
      contents: args.prompt,
      config: {
        systemInstruction: args.systemInstruction,
        tools: args.tools,
        responseMimeType: "application/json",        // G1
        responseJsonSchema: zodToJsonSchema(args.schema), // G1
        thinkingConfig: args.thinkingLevel ? { thinkingLevel: args.thinkingLevel } : undefined,
      },
    }),
    new Promise<never>((_, rej) =>
      setTimeout(() => rej(new Error("GEMINI_TIMEOUT")), args.timeoutMs ?? 30_000),
    ),
  ]);
  const duration_ms = Date.now() - start;

  // G1: parse + validate
  const text = response.text;
  const parsed = args.schema.parse(JSON.parse(text));

  // G5: citations
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
  const citations = groundingChunks.map((c: any) => ({ url: c.web?.uri ?? "", title: c.web?.title ?? "" }));

  return {
    data: parsed,
    citations,
    usage: {
      input_tokens: response.usageMetadata?.promptTokenCount ?? 0,
      output_tokens: response.usageMetadata?.candidatesTokenCount ?? 0,
      thoughts_tokens: response.usageMetadata?.thoughtsTokenCount,
    },
    duration_ms,
  };
}

/** For chatbot (task 009) + venue optimizer (043) — function calling with tool combination */
export interface CallGeminiAgentArgs { /* declarations + tools + signatures + ... */ }
export async function callGeminiAgent(/* ... */) { /* ... */ }

/** For SSE streaming chat (existing ai-chat) */
export async function streamGeminiChat(/* ... */) { /* ... */ }

/** Retry wrapper with exponential backoff on 429/5xx (per skill §"Error Handling") */
export async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> { /* ... */ }
```

## Migration checklist (per caller)

| Caller | Current | New | Notes |
|---|---|---|---|
| `_shared/gemini.ts` | OpenAI-compat fetch | `@google/genai` SDK + 4 helpers (`callGeminiStructured`, `callGeminiAgent`, `streamGeminiChat`, `withRetry`) | This task's main artifact |
| `ai-router/index.ts` | Bearer + free-text JSON parse | `callGeminiStructured` with intent enum schema | Single highest-value caller (every chat turn hits it) |
| `ai-search/index.ts` | Bearer + free-text JSON parse | `callGeminiStructured` | x2 calls in this fn |
| `ai-chat/index.ts` | `fetchGemini` + `fetchGeminiStream` | Use new `streamGeminiChat`; preserve thought signatures across turns; SDK handles automatically | Largest file (~1054 lines); split refactor into 2 PRs if needed |
| `ai-trip-planner/index.ts` | `gemini-3-pro-preview` (deprecated!) | `gemini-3.1-pro-preview` + `thinkingLevel: "high"` | **Hot fix:** rename in same PR |
| `ai-suggest-collections/index.ts` | OpenAI-compat | `callGeminiStructured` | |
| `ai-optimize-route/index.ts` | OpenAI-compat | `callGeminiStructured` | |
| `rentals/index.ts` | OpenAI-compat | `callGeminiStructured` | |

## Acceptance Criteria

- [ ] `package.json` (Deno or `_shared`) imports `npm:@google/genai@^1.0.0` (NOT esm.sh, NOT legacy `@google/generativeai`).
- [ ] `_shared/gemini.ts` exports `callGeminiStructured`, `callGeminiAgent`, `streamGeminiChat`, `withRetry`.
- [ ] `callGeminiStructured` requires a Zod schema (compile-time enforcement of G1).
- [ ] No call sites pass `temperature` (G2 enforced via the helper not accepting it).
- [ ] All 7 callers refactored; deployed via `supabase functions deploy <name>`.
- [ ] `ai-trip-planner` no longer references `gemini-3-pro-preview` (verify via `grep -r "gemini-3-pro-preview" supabase/functions/` returns zero).
- [ ] Smoke test on each fn: 1 successful call returns expected shape.
- [ ] All Gemini calls log to `ai_runs` with `agent_name`, `input_tokens`, `output_tokens`, `duration_ms`, `status`.
- [ ] Citations persisted to `ai_runs.metadata.citations` for any fn using Google Search / Maps / URL Context.
- [ ] No regression on existing user-facing flows (manual smoke: search a listing, ask the chat widget, plan a trip).

## Failure handling

- Migration fails on a caller → revert just that caller (the helper is stable independently).
- 429/5xx during smoke testing → `withRetry` with exponential backoff (up to 3 attempts; per skill §"Error Handling").
- Schema parse failure → log to ai_runs with `status='schema_violation'` + raw text in metadata; surface 502 to the client.

## Wiring plan

1. Read `.claude/skills/gemini/SKILL.md` (full file — 600 lines; the 6 G-rules are mandatory).
2. Read `_shared/gemini.ts` + each of the 7 callers (current state).
3. Add `npm:@google/genai@^1.0.0` + `npm:zod-to-json-schema@^3.23.0` to deno deps.
4. Rewrite `_shared/gemini.ts` per the target shape above.
5. Migrate `ai-router` first (smallest + highest value); deploy + smoke test.
6. Migrate remaining 6 callers; deploy each after smoke test.
7. **Hot fix:** in the `ai-trip-planner` migration, also rename `gemini-3-pro-preview` → `gemini-3.1-pro-preview`.
8. Run `npm run lint` + `npm run build` + `npm run test` — must all pass.
9. Update task 002, 009, 033, 043, 044 to remove "TODO: wire to ai-chat" stubs and call the new helpers directly.

## See also

- `.claude/skills/gemini/SKILL.md` — the 6 critical rules (G1-G6) + reference files
- [`002-host-event-new-wizard.md`](./002-host-event-new-wizard.md) — uses `callGeminiStructured` for description generator
- [`009-chatbot-event-creation.md`](./009-chatbot-event-creation.md) — uses `callGeminiAgent` for tool-combination chat
- [`033-event-photo-moderate-edge-fn.md`](./033-event-photo-moderate-edge-fn.md) — uses `callGeminiStructured` w/ multimodal input
- [`043-ai-venue-optimizer-edge-fn.md`](./043-ai-venue-optimizer-edge-fn.md) — uses `callGeminiAgent` w/ Maps + Search + Code Exec
- [`044-ai-venue-layout-generator-edge-fn.md`](./044-ai-venue-layout-generator-edge-fn.md) — uses `callGeminiAgent` w/ Code Exec
- [`046-gemini-skill-housekeeping.md`](./046-gemini-skill-housekeeping.md) — sibling task; patches the installed skill
- [`100-events-prd.md`](../100-events-prd.md) §3.4 — Gemini integration patterns (rules + per-feature mapping)

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
