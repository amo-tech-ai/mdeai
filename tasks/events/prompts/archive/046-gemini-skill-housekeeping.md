---
task_id: 046-gemini-skill-housekeeping
title: Patch .claude/skills/gemini SKILL.md + add 3 missing reference files
phase: PHASE-1.5-EVENTS
priority: P2
status: Done
estimated_effort: 0.5 day
area: docs
skill:
  - gemini
edge_function: null
schema_tables: []
depends_on: []
mermaid_diagram: null
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-1.5-EVENTS — pure housekeeping; doesn't block any code task but prevents future tasks from getting stale guidance |
| **Files touched** | `.claude/skills/gemini/SKILL.md` (1 line patch + 1 new note) + 3 NEW reference files in `references/` |
| **Real-world** | A future Claude session reads the gemini skill before writing edge-fn code; gets accurate guidance on tool combination + Maps grounding + Code Execution |

## Description

**The situation.** During the 2026-05-03 Gemini audit, I found `.claude/skills/gemini/SKILL.md` line 387 contradicts the live Google docs:

> Skill says: *"Combining built-in tools (Google Search, URL Context) with function calling is NOT supported in Gemini 3."*
>
> Live docs (https://ai.google.dev/gemini-api/docs/tool-combination, last updated **2026-04-28**): *"Gemini allows the combination of built-in tools…and function calling…in a single generation."*

This bad guidance directly affects **3 mdeai tasks** (009 chatbot, 043 venue optimizer, 044 layout generator) — all of which need built-in tool + custom function combinations. Without this fix, future Claude sessions will design those tasks wrong.

Also missing from the skill: reference files for Maps grounding, Code Execution, and Tool Combination. The skill's `references/` directory has 13 files but lacks these 3 features that we explicitly want to use in Phase 2-4.

## Goals

1. **Primary:** Future Claude sessions reading the gemini skill get accurate guidance on tool combination + the 3 newer features.
2. **Quality:** Reference files match the live Google docs structure (verbatim quotes where possible).

## Acceptance Criteria

- [ ] `.claude/skills/gemini/SKILL.md` line 387 patched per the diff below.
- [ ] `references/tool-combination.md` created (≥80 lines covering: requirements, supported combinations, code examples, the `include_server_side_tool_invocations` flag).
- [ ] `references/maps-grounding.md` created (≥60 lines covering: when to use vs Google Search, API config, `latLng` retrievalConfig, $25/1k pricing, free tier 500/day).
- [ ] `references/code-execution.md` created (≥60 lines covering: Python sandbox, 30s runtime, pre-approved libs, combining with other tools).
- [ ] SKILL.md `## Resources` section (line ~570) lists the 3 new reference files.
- [ ] SKILL.md `## Checklist` section (line ~586) gains 1 line for tool-combination signature preservation.

## Diff for the SKILL.md fix

```diff
-**NOTE:** Combining built-in tools (Google Search, URL Context) with function calling is NOT supported in Gemini 3.
+**NOTE:** Combining built-in tools (Google Search, URL Context, Maps, Code Execution) with function calling
+IS supported in Gemini 3 (preview as of 2026-04-28). Requirements:
+  • set `include_server_side_tool_invocations: true`
+  • include both `function_declarations` (custom) and built-in tools in the same request
+  • preserve `thoughtSignature`, `id`, and `tool_type` fields across all parts in multi-turn flows
+See `references/tool-combination.md` for full pattern.
```

## Suggested content for `references/tool-combination.md`

Core points to capture (from live docs):

```markdown
# Tool Combination in Gemini 3 (Preview)

## What's supported

Gemini 3 supports combining custom function calling with these built-in tools in a single generation:
- Google Search grounding
- Google Maps grounding
- URL Context
- File Search
- Code Execution
- (any combination of the above)

## Required settings

| Setting | Value | Reason |
|---|---|---|
| `include_server_side_tool_invocations` | `true` | Tells server to surface built-in tool calls in the response stream so the SDK can return signatures back |
| Multi-turn signature preservation | always pass back `thoughtSignature` + `id` + `tool_type` from each `Part` | Gemini 3 returns 400 if signatures are dropped between turns |

## Example: chatbot + Google Search + custom event tools

[code example mirroring task 009's chatbot pattern]

## Anti-patterns

- ❌ Trying to combine on Gemini 2.x (not supported)
- ❌ Dropping `thoughtSignature` between turns (400 error)
- ❌ Hand-rolling signature management — use `npm:@google/genai@^1.0.0` SDK instead

## Pricing

Standard token billing applies; built-in tools have their own pricing layers (e.g., Maps $25/1k grounded prompts, free tier 500/day).
```

## Suggested content for `references/maps-grounding.md`

Mirrors the structure of existing `references/google-search.md`:

```markdown
# Google Maps Grounding

[when to use vs Google Search]

## API configuration

```json
"tools": [{"googleMaps": {}}]
```

Optional widget + user location:
```json
"toolConfig": {
  "retrievalConfig": {
    "latLng": { "latitude": 6.244, "longitude": -75.581 }
  }
}
```

## Pricing
- $25 per 1,000 grounded prompts
- Free tier: 500 requests/day
- Off by default — explicitly opt-in only when geo intent is detected

## Models
All current Gemini 3 models support Maps grounding.
```

## Suggested content for `references/code-execution.md`

```markdown
# Code Execution

Python-only sandboxed execution. The model writes and runs Python; reasons over the output iteratively.

## API configuration

```typescript
tools: [{ codeExecution: {} }]
```

## Sandbox limits

- Maximum runtime: **30 seconds** per execution
- Pre-approved libraries: NumPy, Pandas, Matplotlib, TensorFlow (full list in live docs)
- Cannot install custom libraries via pip
- No network access

## When to use

- Reasoning-heavy math (geometric, statistical, financial)
- Data wrangling on JSON inputs
- Verifying numerical outputs the model would otherwise approximate

## Combinations

Works with Google Search + custom function calling per `tool-combination.md`.
```

## Wiring plan

1. Read full `.claude/skills/gemini/SKILL.md` to find the exact line to patch.
2. Apply the 1-line diff to line 387 region.
3. Read existing `references/google-search.md` for stylistic template.
4. Write the 3 new reference files (~60-80 lines each) using verbatim quotes from live Google docs where possible.
5. Update SKILL.md `## Resources` (~line 570) to list the 3 new files.
6. Update SKILL.md `## Checklist` (~line 586) to add tool-combination + thought-signature-preservation bullet.
7. Verify by re-reading the skill end-to-end — no contradictions remain.

## See also

- [`045-gemini-native-sdk-migration.md`](./045-gemini-native-sdk-migration.md) — the code-side companion task
- [`100-events-prd.md`](../100-events-prd.md) §3.4 — surfaces the same tool-combination guidance for the PRD reader
- Live docs: https://ai.google.dev/gemini-api/docs/tool-combination
- Live docs: https://ai.google.dev/gemini-api/docs/maps-grounding
- Live docs: https://ai.google.dev/gemini-api/docs/code-execution
