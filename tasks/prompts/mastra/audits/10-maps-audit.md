# Mastra maps stack audit — MASTRA-046 … MASTRA-049

**Scope:** Four task specs (`tasks/prompts/mastra/tasks/046` … `049`) vs repo reality, Supabase schema, Google Maps / Gemini guidance in-repo (`mde-maps`, `gemini/references/google-maps.md`), and Mastra chat wiring.

**Hierarchy (agreed):**

| Layer | Role |
|-------|------|
| **Supabase** | Inventory and search source of truth for listings/events |
| **Places API (New)** | Deterministic enrichment (`place_id`, `maps_url`, optional summaries) — batch/offline |
| **Gemini (`generateContent`)** | Reasoning, structured output, optional non‑Maps context |
| **Gemini Maps grounding** | Phase 3 only — open-ended geo realtime (hours, “open now”, proximity), intent-gated |

**Do not:** Replace Supabase search with Maps grounding for catalog discovery. Do not adopt Interactions API for these phases unless there is a documented Phase 3 need (049 stays on `generateContent`-style calls per task).

---

## Executive summary

046–049 describe a coherent phased path: validate tool → merge pins / version actions → cache Places fields → optional grounded geo. Against the current codebase, **047’s diagnosis is accurate** (pins replaced on multi-tool turns in both `Concierge.tsx` and `ChatCanvas.tsx`). **046 must align Zod with raw Mastra tool shapes *and* with the existing field mapping in `useChat.ts`** (aliases like `nightly_price`). **048’s warning about `generativeSummary`** matches operational reality for Colombia; trusting Gemini text for `ai_summary` is reasonable but needs attribution/disclosure discipline if any content is AI-authored. **049 has several factual mismatches with `public.ai_runs`** (example insert uses nonexistent columns and invalid `status`), **pricing should be verified against current Google billing docs**, and **daily quota must not ship as in-process memory** on serverless (task already flags this).

---

## Task-by-task scoring

Judgment is “how correct / shippable as written,” not product priority.

| Task | ID | % aligned | Verdict |
|------|-----|-----------|---------|
| Normalize tool output + Zod | MASTRA-046 | **72%** | **Revise** — schemas must mirror tools + `useChat` mapping |
| Pin merge + action versioning | MASTRA-047 | **88%** | **Safe now** — paths and bug description match repo |
| Places enrichment Phase 2 | MASTRA-048 | **82%** | **Revise** — migration naming + generativeSummary caveat |
| Maps grounding Phase 3 | MASTRA-049 | **58%** | **Defer** until 048 + schema/telemetry fixes |

---

## Detailed findings

### MASTRA-046 — `normalizeToolOutput` + Zod

**Strengths**

- Correct problem statement: `tool-output-available` feeds `ev.output.results[]` straight into `ChatAction` construction in `useChat.ts` with no validation.

**Repo corrections**

1. **Tool names:** Handler branches use `searchEventsTool`, `searchRentalsTool`, `searchRestaurantsTool`, `searchAttractionsTool` — task matches.

2. **Rental shape mismatch:** `useChat.ts` maps `price_daily` from `r.nightly_price ?? r.price_daily` and images from `r.image` (single string → array). Task’s `RentalListingSchema` only lists `price_daily` and `images[]`; raw tool rows may expose `nightly_price`, `tags`, `image`. Normalize layer should either parse **raw tool output** (preferred: one schema per tool matching `my-mastra-app` Zod) **or** explicitly coerce after parse — do not only validate the already-mapped card shape.

3. **Events:** Mastra `search-events.ts` defines strict output (`pricePerTicket` number, `currency: 'USD'`, required `imageUrl`). Chat mapping defaults nullables liberally. Zod for normalize should reflect **what the tool promises**, then map to `EventInlineListing`.

4. **Currency:** Task suggests `COP | USD` optional on events; Mastra schema currently uses `z.literal('USD')` for tool output. Align task copy with tool schema or widen tool schema deliberately.

5. **Test count:** “51+ tests” may drift; Definition of Done should say **`npm run test` green** / CI parity.

**Verdict:** **Revise** — Update 046 spec schemas and acceptance tests to dual-layer: (raw result row) → (validated) → (same mapping as today into `ChatAction`).

---

### MASTRA-047 — Pin merge + `version: 1` on actions

**Strengths**

- **Bug is real:** `Concierge.tsx` and `ChatCanvas.tsx` both call `setPins(...)` from listings derived from `pendingActions`, replacing the full pin set per effect.

- Versioned actions reduce silent skew when payloads gain fields (e.g. `place_id` in Phase 2).

**Corrections**

1. **Dispatch site:** Version check belongs where actions are **created** (`useChat.ts`) and anywhere **SSE legacy paths** build actions (`data-mdeai-actions`). Grep all `setPendingActions` and action constructors.

2. **`ChatAction` union:** Task lists four OPEN_* types; confirm whether `LeadCapturedAction` and others need versioning for consistency (minimal: document “tool-result actions only”).

**Verdict:** **Safe now** — Implement after 046 so normalization + versioning land together.

---

### MASTRA-048 — Places enrichment Phase 2

**Strengths**

- Correct strategic split: batch Places writes, no per-turn Places calls.

- Explicit **do not request `generativeSummary`** for Medellín — matches `.claude/skills/mde-maps/references/places-api-new.md` style guidance.

- Field mask listing `places.id`, `googleMapsLinks`, `location` is appropriate for New Places.

**Corrections**

1. **Migration filename:** Repo uses timestamp-prefixed migrations (e.g. `20260404044720_remote_schema.sql`). Replace illustrative `20260513_add_place_id_maps_url.sql` with **`YYYYMMDDHHMMSS_description.sql`** per `.claude/rules/supabase-migrations.md` / guard hooks.

2. **`ai_summary` source:** If Gemini generates summaries server-side, log usage (cost, model) in enrichment script runs; consider tagging rows with `ai_summary_source` or documenting in runbook.

3. **Events:** `events` get `place_id` + `maps_url` only — consistent with task; ensure Mastra `search-events` tool SELECT includes new columns when ready.

4. **≥80% KPI:** Define denominator (seeded rows vs rows with non-null venue name).

**Verdict:** **Revise** migration naming and telemetry notes; otherwise directionally sound.

---

### MASTRA-049 — Maps grounding Phase 3

**Strengths**

- Intent gating + cost awareness match `mde-maps/references/maps-grounding.md`.

- Sequential pattern (grounded call → structured follow-up) is prudent given evolving Gemini feature matrices.

- Documents serverless **in-memory quota blocker** — must fix before prod.

**Critical repo / schema issues**

1. **`public.ai_runs` columns** (from `supabase/migrations/20260404044720_remote_schema.sql`): `id`, `user_id`, `conversation_id`, `agent_name`, `agent_type`, `status`, `error_message`, `input_data`, `output_data`, `input_tokens`, `output_tokens`, `total_tokens`, `duration_ms`, `estimated_cost_usd`, `model_name`, `temperature`, `metadata`, timestamps. **There is no `grounded` or `cost_class` column.** Put `{ grounded: true, cost_class: 'maps' }` in **`metadata` jsonb** and/or structured **`output_data`**, and extend **Mastra `recordMastraRun`** (or shared helper) to accept `metadata`.

2. **Example insert is invalid:** Task shows `status: 'ok'` — enum values are `pending | running | success | error | timeout | cancelled`. Use **`success`** for completed grounded calls.

3. **`agent_type` enum:** DB allows only `local_scout`, `dining_orchestrator`, `event_curator`, `itinerary_optimizer`, `budget_guardian`, `booking_assistant`, `general_concierge`. Mastra `my-mastra-app/src/mastra/lib/ai-runs.ts` currently types **`restaurant_scout`**, which **does not exist** on `public.agent_type` — fix Typescript union + any callers **before** relying on inserts.

4. **`recordMastraRun`:** Implemented but **never called** from agents yet (see MASTRA-040 / checklist). Grounding telemetry depends on wiring inserts consistently.

5. **Pricing ($25/1K):** CONFIRM against current [Gemini API pricing](https://ai.google.dev/pricing) / Maps grounding billing; `mde-maps/references/maps-grounding.md` may cite a different figure — treat task numbers as **placeholder until quoted from billing console**.

6. **SDK surface:** Pseudocode uses `gemini.generateContent({ tools: [{ googleMaps: {} }], toolConfig: { retrievalConfig: { latLng }}})`. Validate against **`@google/genai`** (or Vertex) version pinned in `my-mastra-app` — parameter names move between REST vs SDK.

**Verdict:** **Defer** until 048 is done and **049 spec + helpers** are corrected for real `ai_runs` rows and quota storage.

---

## Implementation order

1. **MASTRA-046** — Normalize + tests (unblocks confidence for 047).
2. **MASTRA-047** — Pin merge + versioning across Concierge + ChatCanvas + all action emit paths.
3. **MASTRA-048** — Migrations + enrichment script + frontend Maps links + optional `ai_summary`.
4. **MASTRA-049** — Intent classifier, sequential Gemini calls, durable quota, **`metadata` grounding flags**, manual E2E matrix.

Dependencies **049 → 048** as written are correct. **040** (ai_runs from Mastra) should be considered a **prerequisite or parallel** for production-grade telemetry.

---

## Skill / reference files to use

| Path | Use |
|------|-----|
| `.claude/skills/mde-maps/SKILL.md` | Router |
| `.claude/skills/mde-maps/references/architecture.md` | Places vs grounding decision tree |
| `.claude/skills/mde-maps/references/places-api-new.md` | MASTRA-048 |
| `.claude/skills/mde-maps/references/maps-grounding.md` | MASTRA-049, quotas, sequential patterns |
| `.claude/skills/mde-maps/references/maps-js-api.md` | Pins / AdvancedMarker |
| `.claude/skills/mde-maps/references/security-and-optimization.md` | Keys |
| `.claude/skills/gemini/references/google-maps.md` | Gemini + Maps overview |
| `.claude/skills/mde-supabase/` | RLS, migrations, edge patterns |
| `.claude/skills/supabase-edge-functions/` | If grounding moves to edge |
| `.claude/skills/testing/SKILL.md` | Vitest strategy |
| `.claude/skills/test-driven-development/SKILL.md` | RED/GREEN for normalize |

Optional doc aliases (not present today): adding stub files `google-maps-platform.md` → redirect to `architecture.md` is nice-to-have only.

---

## Tests to add

| Area | Tests |
|------|--------|
| **046** | Per-tool valid/missing-field/extra-field cases; rental alias (`nightly_price`); snapshot of emitted `ChatAction` |
| **047** | Multi-tool pin state: two categories in one turn → both pin sets present; unknown `version` skipped |
| **048** | Script unit tests with mocked Places client; migration apply smoke |
| **049** | `requiresMapsGrounding()` regex matrix (EN/ES); quota exhausted → fallback path; **no** grounding on catalog queries |

---

## Production checklist (maps-specific)

- [ ] **No `GOOGLE_PLACES_API_KEY` in `VITE_*`** (browser).
- [ ] **Grounding quota** persisted (Supabase row or Redis), not process memory.
- [ ] **`ai_runs` inserts** use valid `agent_type`, `status`, and **`metadata` for maps flags**.
- [ ] **Gemini + Maps** disclosure strings in UI if citations shown (follow Google attribution rules).
- [ ] **Cost alerts** on grounding volume (dashboard on `metadata.cost_class` or equivalent).
- [ ] **CLAUDE.md floor:** `npm run floor` before merge.

---

## Summary verdicts

| Task | Verdict |
|------|---------|
| **046** | **Revise** — Zod must match Mastra tool output + `useChat` coercion |
| **047** | **Safe now** |
| **048** | **Revise** — migration naming + enrichment observability |
| **049** | **Defer** — fix `ai_runs` contract, SDK verification, quota durability, pricing |

---

## References (external — verify before quoting in contracts)

- Google Maps Platform documentation — https://developers.google.com/maps/documentation
- Gemini API — https://ai.google.dev/gemini-api/docs
- Gemini pricing — https://ai.google.dev/pricing

---

*Audit produced 2026-05-12 against repo paths under `/home/sk/mde`.*

---

## Re-validation — 2026-05-12 (post-repo research)

Verified each finding against actual source files. Summary of what's confirmed, corrected, and superseded.

### Confirmed correct (verified against source)

| Finding | Source | Status |
|---------|--------|--------|
| `ai_runs` has no `grounded`/`cost_class` — use `metadata` jsonb | `supabase/migrations/20260404044720_remote_schema.sql` line 1156–1183 | ✅ Correct |
| `status: 'ok'` invalid — use `success` | `ai_run_status` enum: `pending\|running\|success\|error\|timeout\|cancelled` | ✅ Correct |
| `agent_type` mismatch — `restaurant_scout`, `trip_planner`, `real_estate_agent` not in DB enum | DB enum: `local_scout, dining_orchestrator, event_curator, itinerary_optimizer, budget_guardian, booking_assistant, general_concierge` | ✅ Correct |
| `recordMastraRun` never called from agents | `grep -rn "recordMastraRun" my-mastra-app/src/mastra/` returns no agent call sites | ✅ Correct |
| `nightly_price` alias — task's `RentalListingSchema` must handle raw field, not pre-mapped field | `useChat.ts` line 439: `price_daily: r.nightly_price ?? r.price_daily ?? null` | ✅ Correct |
| Currency `z.literal('USD')` not `z.enum(['COP','USD'])` | `my-mastra-app/src/mastra/tools/search-events.ts` line 25: `currency: z.literal('USD')` | ✅ Correct |
| Migration must use `YYYYMMDDHHMMSS_description.sql` format | `.claude/rules/supabase-migrations.md` + hook guard | ✅ Correct |

### Bug missed by audit — `error_code` vs `error_message`

`my-mastra-app/src/mastra/lib/ai-runs.ts` line 63 inserts `error_code` but the DB schema column (line 1163) is `error_message`. Every insert that includes error info silently discards it — Supabase client ignores unknown columns rather than throwing.

**Fix:** Rename `error_code` → `error_message` in the `MastraRunRecord` interface and insert call. Also add `metadata` field to the interface and insert for Phase 3 grounding flags (`{ grounded: true, cost_class: 'maps' }`).

### MASTRA-049 findings — partially superseded

The audit's finding #6 (SDK surface / sequential 2-call pattern) is **now obsolete**. MASTRA-049 was rewritten on 2026-05-12 to use a **Mastra tool wrapping Maps Grounding Lite MCP** instead of Gemini-level `googleMaps` tool + sequential calls.

Updated verdict for MASTRA-049:

| Finding | Status |
|---------|--------|
| `ai_runs` insert — no `grounded`/`cost_class`, use `metadata`, fix `error_code` → `error_message` | 🔴 Still must fix before shipping |
| `status: 'ok'` → `status: 'success'` | 🔴 Still must fix |
| `agent_type` mismatch (`restaurant_scout` invalid) | 🔴 Still must fix |
| In-memory quota counter — production blocker | 🔴 Still must fix |
| Sequential 2-call pattern (Gemini `googleMaps` tool) | ✅ Obsolete — replaced by `searchGroundedPlacesTool` Mastra tool wrapping MCP |
| SDK surface validation for `tools: [{ googleMaps: {} }]` | ✅ Obsolete — no Gemini-level `googleMaps` tool in new approach |

**New implementation approach** (see updated `049-mastra-geo-grounding-phase3.md`):
- `searchGroundedPlacesTool` added to concierge agent tools
- Tool calls `mapstools.googleapis.com/mcp` via `@modelcontextprotocol/sdk` `StreamableHTTPClientTransport`
- Reference implementation: `github/grounding-lite-mcp-sample-app/services/groundingLiteService.ts` (locally cloned)
- Quota guard and DB enrichment live inside tool `execute()` — same pattern as all other tools
- Results flow through existing `tool-output-available` → `ChatAction` path unchanged

**Revised verdict for 049:** **Revise** (not Defer) — `ai_runs` contract and quota durability still need fixing, but implementation approach is now simpler and doesn't require Gemini-level feature flag verification.

### Updated scoring

| Task | Old score | New score | Change |
|------|-----------|-----------|--------|
| MASTRA-046 | 72% | 72% | Unchanged — schema alignment work still needed |
| MASTRA-047 | 88% | 88% | Unchanged — safe to ship after 046 |
| MASTRA-048 | 82% | 85% | +3% — geocoding fallback now references correct library (`google-maps-services-js`) |
| MASTRA-049 | 58% | 68% | +10% — approach simplified (MCP tool); DB/quota bugs remain |

### Additional fix needed before any ai_runs insert ships

```typescript
// my-mastra-app/src/mastra/lib/ai-runs.ts — required fixes
export interface MastraRunRecord {
  // ...existing fields...
  error_message?: string | null;  // was: error_code — schema column name is error_message
  metadata?: Record<string, unknown>;  // add — for grounded, cost_class, etc.
}

// In recordMastraRun insert:
{
  error_message: record.error_message ?? null,  // was: error_code
  metadata: record.metadata ?? {},
}
```

The `agent_type` TypeScript union in `ai-runs.ts` must also be narrowed to only values that exist in the DB enum:
```typescript
export type AgentType =
  | 'event_curator'
  | 'local_scout'
  | 'general_concierge'
  | 'dining_orchestrator'
  | 'itinerary_optimizer'
  | 'budget_guardian'
  | 'booking_assistant';
// Remove: 'trip_planner', 'real_estate_agent', 'restaurant_scout' — not in DB enum
```
