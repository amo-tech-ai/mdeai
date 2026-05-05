# Code Execution

> Source: https://ai.google.dev/gemini-api/docs/code-execution
> **Status (2026-05-03):** Generally available on Gemini 3 models.

Code Execution gives the model a sandboxed Python interpreter. The model writes Python, runs it, observes the output (text, plots, errors), and iterates — all inside a single API call. You don't run anything yourself; you just enable the tool.

## When to use

- **Reasoning-heavy math** — geometric, statistical, financial calculations the model would otherwise approximate
- **Data wrangling on JSON** — sort/filter/aggregate user-supplied tabular data
- **Verifying numerical outputs** — model writes the formula, runs it, returns the verified answer
- **Plotting** — matplotlib charts returned as inline images
- **Quick algorithmic tasks** — graph traversal, combinatorics, optimization sub-problems

For mdeai specifically: `044-ai-venue-layout-generator-edge-fn` uses this for Python geometry math (seat-block packing, sight-line angles, aisle widths).

## API configuration

```typescript
config: {
  tools: [{ codeExecution: {} }]
}
```

That's it — no other setup needed.

## SDK example (TypeScript / Deno)

```typescript
import { GoogleGenAI } from "npm:@google/genai@^1.0.0";

const ai = new GoogleGenAI({ apiKey: Deno.env.get("GEMINI_API_KEY") });

const response = await ai.models.generateContent({
  model: "gemini-3-flash-preview",
  contents: "I have a 30m × 50m rectangular venue. " +
    "If I want 8 rows of seats with a 3m central aisle and 1.2m row spacing, " +
    "how many seats per row maximizes capacity? Verify with code.",
  config: {
    tools: [{ codeExecution: {} }],
    thinkingConfig: { thinkingLevel: "high" },
  },
});

// Inspect the parts — there will be: text, executableCode, codeExecutionResult, text
for (const part of response.candidates?.[0]?.content?.parts ?? []) {
  if (part.text) console.log("TEXT:", part.text);
  if (part.executableCode) console.log("CODE:", part.executableCode.code);
  if (part.codeExecutionResult) {
    console.log("OUTPUT:", part.codeExecutionResult.output);
    console.log("OUTCOME:", part.codeExecutionResult.outcome); // OUTCOME_OK or OUTCOME_FAILED
  }
}
```

## Sandbox limits

| Limit | Value | Notes |
|---|---|---|
| Maximum runtime | 30 seconds per execution | Hard wall — exceed it and the result is `OUTCOME_DEADLINE_EXCEEDED` |
| Network access | None | The sandbox is air-gapped |
| Custom libraries via pip | Disallowed | You can't install your own packages |
| File output | Inline data only | Plots return as base64 PNG in `inlineData` |
| Memory | Per-execution sandbox, no persistence between turns | Each call starts fresh |

## Pre-approved libraries

Available without setup (full list in live docs, partial list here):

- **Numerical:** NumPy, SciPy, SymPy
- **Data:** Pandas, openpyxl
- **Plotting:** Matplotlib (charts return as inline base64 PNG)
- **ML:** TensorFlow, scikit-learn (limited use given the 30s wall)
- **Stdlib:** All Python 3.11 stdlib

## Combining with other tools

Code Execution works in combination with custom function calling, Google Search, and Google Maps grounding (Gemini 3 only):

```typescript
config: {
  tools: [
    { codeExecution: {} },
    { googleSearch: {} },                  // fetch real-world data, then compute on it
    { functionDeclarations: [/* custom */]} // model can also call your own tools
  ],
}
```

See [`tool-combination.md`](./tool-combination.md) for the required `include_server_side_tool_invocations` flag and signature preservation rules.

## Anti-patterns

- ❌ Asking for any **network** call from inside the sandbox — `urllib`/`requests` will fail. Pre-fetch with Google Search or URL Context, then pass the data into the prompt.
- ❌ Long-running ML training — the 30s wall makes this impractical
- ❌ Hand-parsing the parts array casually — outputs may be split into multiple `executableCode` + `codeExecutionResult` pairs if the model iterates. Iterate over all of them.
- ❌ Using `temperature: 0` to "make it deterministic" — G2 still applies; let the model use its default
- ❌ Trusting plots without `outcome === "OUTCOME_OK"` — always check the outcome field; failed executions still return `executableCode` parts.

## Pricing

No extra fee at preview. Standard input + output token billing applies, including any tokens consumed by the executed code's stdout.

## Models supporting Code Execution

- `gemini-3.1-pro-preview` ✅
- `gemini-3-flash-preview` ✅
- `gemini-3.1-flash-lite-preview` ✅
- Image preview models ❌

## Real-world example (mdeai task 044)

```typescript
const response = await ai.models.generateContent({
  model: "gemini-3.1-pro-preview",
  contents: `
    Venue is 25m wide × 40m deep with a 4m stage at the front.
    Generate a seating plan with:
    - aisle widths >= 1.5m (Colombian fire code)
    - row spacing >= 0.9m
    - rake angle 5° (sight-line rule)
    - max capacity
    Return JSON: { rows: [{ y: number, seats: number, width: number }], total_capacity: number }
  `,
  config: {
    tools: [{ codeExecution: {} }],
    responseMimeType: "application/json",       // G1
    responseJsonSchema: zodToJsonSchema(seatingPlanSchema),
    thinkingConfig: { thinkingLevel: "high" },
  },
});

const layout = seatingPlanSchema.parse(JSON.parse(response.text));
```

## See also

- [`tool-combination.md`](./tool-combination.md) — combining Code Execution with Search/Maps/custom functions
- [`structured-output.md`](./structured-output.md) — pairing Code Execution with `responseJsonSchema` for typed output
- [`thinking.md`](./thinking.md) — `thinkingLevel: high` is the right default for math-heavy tasks
- Live docs: https://ai.google.dev/gemini-api/docs/code-execution
