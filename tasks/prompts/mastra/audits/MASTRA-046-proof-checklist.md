---
id: MASTRA-046-AUDIT
title: MASTRA-046 — action schema validation proof checklist
created: 2026-05-11
related:
  - tasks/prompts/mastra/tasks/046-mastra-action-schema-validation.md
  - tasks/prompts/mastra/tasks/047-mastra-map-pin-merge-versioning.md
  - src/lib/chat/normalize-tool-output.ts
  - src/hooks/useChat.ts
---

# MASTRA-046 proof checklist

Cursor / reviewers: tick each box only after you have verified it on the branch under review.

## Proof summary (all must be true)

MASTRA-046 is correct if:

- [ ] **`normalizeToolOutput` exists** — `src/lib/chat/normalize-tool-output.ts` exports `normalizeToolOutput` (and typically `unwrapToolOutput`). Uses Zod **`safeParse`** only; invalid → `null`, dev → `console.warn`; valid → `ChatAction` with `payload: { filters: {}, listings }` and **no** `version` field.
- [ ] **`useChat` validates before dispatch** — On `tool-output-available`, `ev.output` passes through `normalizeToolOutput(toolName, ev.output)` **before** `setPendingActions`. No raw tool output enqueues listing actions without normalization.
- [ ] **Malformed payloads return `null`** — Unknown `toolName`, parse failures, COP event currency (if spec requires USD-only), missing required ids, etc. yield `null`; UI does not throw.
- [ ] **Prose-only fallback remains** — When normalization returns `null` or empty listings, the assistant reply still renders from streamed text; no requirement that every message attach cards. Empty/bad tool output does not break the chat transcript path.
- [ ] **Tests pass** — `npm run lint` (0 errors), `npm run build`, `npm run test -- --run`; `src/lib/chat/normalize-tool-output.test.ts` covers happy paths, wrappers (`results` / `listings` / `items`), rejection cases, and rental field transforms per task spec.
- [ ] **No `version: 1`** — Grep the MASTRA-046 PR diff: no `version`, `version: 1`, or pin-merge versioning on `ChatAction` / normalize output. That belongs to **MASTRA-047**.
- [ ] **No MASTRA-047 changes** — PR does not edit `MapContext`, pin merge logic, or Mastra server tools for versioning; scope stays frontend normalize + `useChat` wiring only.

## Quick verification commands

```bash
# Implementation present
test -f src/lib/chat/normalize-tool-output.ts && test -f src/lib/chat/normalize-tool-output.test.ts

# No version field introduced by MASTRA-046 files (should return no matches)
rg 'version\s*:\s*1|version:\s*1' src/lib/chat/normalize-tool-output.ts src/hooks/useChat.ts || true

# Dispatch path uses normalize (adjust match if code moved)
rg 'normalizeToolOutput' src/hooks/useChat.ts

# Tests
npm run lint && npm run build && npm run test -- --run
```

## Out of scope (defer to MASTRA-047)

- Map pin merge, `version` on actions, `MapContext` consumption changes.
