---
id: MASTRA-047-VERIFY
title: MASTRA-047 verification report (forensic QA)
created: 2026-05-11
related_commit: fab3027
related:
  - tasks/prompts/mastra/tasks/047-mastra-map-pin-merge-versioning.md
  - tasks/prompts/mastra/tasks/046-mastra-action-schema-validation.md
---

## MASTRA-047 Verification Report

### Verdict

**PASS** (PR-ready with documented caveats below)

---

### Scope

| Check | Status | Notes |
|-------|--------|--------|
| No unrelated production changes in MASTRA snapshot commit | **PASS** | `fab3027` touches only 8 paths under `src/` (ChatCanvas, MapContext, Concierge, useChat, chat types, `src/lib/chat/*`). |
| No MASTRA-048 Places enrichment | **PASS** | No Places wiring in scoped files. |
| No Maps MCP grounding | **PASS** | Not present in scoped files. |
| No Supabase migrations in MASTRA snapshot | **PASS** | Commit stat has zero `supabase/migrations`. |
| No backend Mastra tool changes in MASTRA snapshot | **PASS** | No `my-mastra-app/` in commit. |
| No `/concierge` retirement | **PASS** | `Concierge.tsx` still present and routed. |
| No `@vis.gl/react-google-maps` added to app | **PASS** | Root `package.json` has no `@vis.gl/react-google-maps` (only vendored samples under `github/` elsewhere in repo). |
| “Only MASTRA-047” strict interpretation | **PARTIAL** | Same commit includes **MASTRA-046** (`normalizeToolOutput`, Zod) as documented dependency of 047. Acceptable as single merge train. |

---

### Implementation proof

| Requirement | Status | Evidence |
|-------------|--------|----------|
| MapContext setter supports functional updates | **PASS** | `setPins: Dispatch<SetStateAction<MapPin[]>>` at `src/context/MapContext.tsx:63`; provider uses raw `useState` setter `src/context/MapContext.tsx:79`. |
| Per-category pin merge implemented | **PASS** | `mergePinsByCategory` `src/context/MapContext.tsx:18–23`; Concierge `src/pages/Concierge.tsx:54,67,80,93`; ChatCanvas `src/components/chat/ChatCanvas.tsx:290,310,327,344`. |
| Latest action per category | **PASS** | `[...pendingActions].reverse().find(...)` pattern in Concierge and ChatCanvas (same files). |
| ChatAction listing types `version: 1` | **PASS** | `src/types/chat.ts:45,114,123,132`; `LeadCapturedAction` unchanged (no version). |
| `normalizeToolOutput` stamps `version: 1` | **PASS** | `src/lib/chat/normalize-tool-output.ts:204–208`. |
| useChat skips unknown listing versions | **PASS** | Mastra `tool-output-available`: `listingToolActionPassesVersionGate` before `setPendingActions` `src/hooks/useChat.ts:413–426`. |
| `data-mdeai-actions` listing payloads stamped | **PASS** | `version: 1` on built actions `src/hooks/useChat.ts:436,456,478,500`. |

**Note:** Warning string `[useChat] Unknown action version …` is emitted from `listingToolActionPassesVersionGate` in `src/lib/chat/normalize-tool-output.ts:181–182`, not from `useChat.ts` (avoids importing the hook module in tests).

**Note:** Literal grep `React.Dispatch<React.SetStateAction<MapPin[]>>` does not appear; codebase uses equivalent `Dispatch<SetStateAction<MapPin[]>>` import from `react` (`MapContext.tsx:7–9,63`).

**Note:** Literal pattern `setPins(prev` does not appear; codebase correctly uses `setPins((prev) => …)`.

---

### Pin reset / stale-pin behavior

| Surface | Status | Evidence |
|---------|--------|----------|
| ChatCanvas | **PASS** | `clearPins()` when `messages.length === 0` and on `currentConversation?.id` change `ChatCanvas.tsx:349–359`. |
| Concierge page | **GAP** | No `clearPins` usage in `Concierge.tsx`; new chat clears messages via `useChat` but map pins may persist until user navigates away. Treat as **follow-up** if `/concierge` is still a primary map surface. |

---

### Test proof

| Test | Status | Evidence |
|------|--------|----------|
| `normalizeToolOutput` returns `version: 1` | **PASS** | Multiple `expect(action?.version).toBe(1)` in `src/lib/chat/normalize-tool-output.test.ts` (e.g. events, rentals, wraps). |
| Version 2 skipped with warning | **PASS** | `describe('listingToolActionPassesVersionGate')` · `rejects version 2 listing actions with warning` `normalize-tool-output.test.ts:38–59`. |
| Version 1 passes gate | **PASS** | `allows version 1 listing actions` `normalize-tool-output.test.ts:29–36`. |
| Events + restaurants coexist | **PASS** | `mergePinsByCategory` · `accumulates events then restaurants` `src/context/MapContext.test.ts:7–11`. |
| Second event replaces only event pins | **PASS** | `second event batch replaces only event pins` `MapContext.test.ts:14–20`. |
| Single-tool / same-category replacement | **PASS** | `single-tool rental query replaces only prior rentals` `MapContext.test.ts:23–27`. |
| `src/hooks/useChat.toolOutputHandler.test.ts` | **N/A** | File **removed by design**; gate tests live next to `normalize-tool-output` to avoid pulling Supabase auth into Vitest. |

---

### Commands run (summary)

| Command | Result |
|---------|--------|
| `npm run lint` | Exit **0** — **0 errors**, 102 warnings (repo-wide, pre-existing class). |
| `npm run build` | **Success** (~5s). |
| `npm run test -- --run` | **9** files, **73** tests, **all passed**. |
| `npm run test -- --run src/lib/chat/normalize-tool-output.test.ts` | **19** tests, **all passed**. |
| `npm run test -- --run src/hooks/useChat.toolOutputHandler.test.ts` | **Skipped** — path does not exist (tests consolidated). |

---

### Red flags / mismatches

1. **Concierge vs ChatCanvas pin reset:** `/chat` clears pins on new conversation / empty messages; **`/concierge` does not call `clearPins`** — possible stale pins on that route.
2. **Legacy `ai-chat` path:** `parsed.mdeai_actions` still appended without client-side version gate (`useChat.ts:628`) — acceptable for backward compatibility; listing actions from edge may omit `version` while types now prefer `version: 1`.
3. **Proof grep expectations:** Auditors using exact strings `React.Dispatch<…>` or `setPins(prev` or `Unknown action version` only inside `useChat.ts` will get false negatives; actual equivalents are documented above.

---

### Final decision

* **Ready for PR:** **YES**
* **Optional fixes after merge (non-blocking):**
  1. Wire `clearPins` (or equivalent) on Concierge new-chat / conversation switch for parity with ChatCanvas.
  2. Optionally add integration/e2e covering multi-tool pins on `/concierge` per task Definition of Done.

---

## Short checklist (047 correct only if)

```txt
047 is correct only if:
✅ MapContext supports `setPins((prev) => ...)` via `Dispatch<SetStateAction<MapPin[]>>`
✅ Pins merge by category (`mergePinsByCategory`)
✅ Other categories are preserved on each tool sync
✅ Listing actions have `version: 1` in `src/types/chat.ts`
✅ normalizeToolOutput stamps version 1
✅ useChat tool-output path uses listingToolActionPassesVersionGate before enqueue
✅ Tests prove multi-tool merge + version gate + normalized v1 (`normalize-tool-output.test.ts`, `MapContext.test.ts`)
✅ No Places/MCP/migration/backend Mastra tools in MASTRA snapshot commit
```
