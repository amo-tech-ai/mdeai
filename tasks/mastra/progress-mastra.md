# Mastra + Maps — Progress Task Tracker

> **Role:** Systems architect · detective reviewer  
> **Last verified:** 2026-05-17 (evening) — **`npm run test` 222/222 (18 files)**; `my-mastra-app tsc --noEmit` clean; `my-mastra-app npm run build` clean · Sprint shipped: W5 (supabase db reset exits 0), C5 (/concierge → /chat redirect), C7 (OPEN_EVENT_RESULTS tool-id fix + event format instructions), MASTRA-040 (ai_runs middleware) · commit 9316e39 · **2026-05-17 evening:** **Gap A FIXED** — `cardSchema` lat/lng added to all 4 branches + `source: out.source` override removed; **MASTRA-050 FIXED** — model IDs corrected to `google/gemini-2.5-flash` / `google/gemini-2.5-pro`
> **Canonical task tree:** `tasks/mastra/tasks/` (meta at root; specs in `core/`, `mvp/`, `advanced/`, and `maps/`) · index [`000-index.md`](./tasks/000-index.md) · skills matrix [`SKILL-REFERENCE.md`](./tasks/SKILL-REFERENCE.md)  
> **Forensic audits:** [`tasks/audit/33-mde-audit.md`](../audit/33-mde-audit.md) · [`tasks/mastra/audit/05-audit-tasks.md`](./audit/05-audit-tasks.md)  
> **Legacy prompts pack (deprecated):** `tasks/prompts/mastra/tasks/` — do not use for execution order

---

## Legend

| Symbol | Meaning |
|--------|---------|
| 🟢 | **Completed** — shipped in repo and/or task YAML `Complete`/`Completed`; smoke or tests cited |
| 🟡 | **In Progress** — partial implementation or task YAML `In Progress` |
| 🔴 | **Not Started** — spec exists; code missing or stub |
| 🟥 | **Blocked** — dependency, schema, or external gate (sponsor schema, Cloud Console, etc.) |
| ⚪ | **Reference / narrative** — no `task_id`; YAML `Reference` or architecture doc (see §2 inventory) |

---

## 1. Verification snapshot (evidence)

| Check | Result | How verified |
|-------|--------|----------------|
| Root Vitest | **216 / 216** passed, **16** files | `npm run test` (2026-05-16); includes `normalize-tool-output`, `MapContext`, `EventCardInline`, `AttractionCardInline`, `RestaurantCardInline`, `GroundingAttribution`, `google-maps-loader` + maps telemetry |
| `my-mastra-app` Vitest | **56 / 56** passed, **4** files | `cd my-mastra-app && npm run test` (2026-05-16); `search-*-logic`, `search-events-logic`, `search-attractions-logic` |
| `my-mastra-app` `tsc --noEmit` | **pass** | `npm run typecheck` (2026-05-15) |
| `normalizeToolOutput` + Zod | Shipped | `src/lib/chat/normalize-tool-output.ts` + `.test.ts` (**23 tests**) |
| `search-restaurants` live | Shipped | `my-mastra-app/src/mastra/tools/search-restaurants.ts` (task **053** = Completed) |
| `search-events` live | **Supabase-backed** | `my-mastra-app/src/mastra/tools/search-events.ts` — real `public.events` query + Bogotá TZ boundary (task **041** = functionally Completed) |
| `search-attractions` | **Live `tourist_destinations` (pg Pool)** | `DATABASE_URL` + `search-attractions.ts`; YAML **MASTRA-054** = **Completed**; helper Vitest in `my-mastra-app` |
| `@modelcontextprotocol/sdk` | **Present** | `my-mastra-app/package.json` |
| `@googlemaps/places` | **Present** | `my-mastra-app/package.json` |
| `lib/models.ts` (**MASTRA-050**) | **✅ FIXED 2026-05-17** | `google/gemini-2.5-flash` + `google/gemini-2.5-pro`; `tsc --noEmit` + `npm run build` clean |
| `verify-task-deps.mjs` | **Shipped** | `scripts/verify-task-deps.mjs` in `npm run verify:mastra` (DAG check) |
| Grounding Lite MCP | **Partial** | `my-mastra-app/src/mastra/lib/maps-grounding-client.ts` ships MCP client plumbing; **no** `searchGroundedPlaces` agent tool (**MASTRA-049** open) |
| Map ID env (**MASTRA-068**) | **✅ FIXED 2026-05-16** | `VITE_GOOGLE_MAPS_MAP_ID=e50ffcd09fd436de96a02ad2` in Vercel prod; `getGoogleMapsMapId()` in `src/lib/google-maps-map-id.ts`; prod bundle confirmed clean |
| Maps API key (**MASTRA-068 dep**) | **✅ FIXED 2026-05-16** | `VITE_GOOGLE_MAPS_API_KEY` re-added without surrounding quotes; `gm_authFailure` resolved; tiles confirmed in browser |
| `grounding_quota_log` migration | Shipped | `supabase/migrations/20260513103000_grounding_quota_log.sql` (**057**) |
| `places-mask-checklist.md` (**MASTRA-073**) | **v1 shipped** | `tasks/maps/places-mask-checklist.md` — call-site CI grep (**081**) optional |
| `maps_url` + `ai_summary` cols | **Migration shipped** | `supabase/migrations/20260514000100_places_cache_schema.sql` adds cols to `restaurants`, `tourist_destinations`, `events` (**048/067**) |
| `ai_runs` Mastra logger | **✅ Wired** | `ai-runs-middleware.ts` path-scoped to `/chat`; fires after every concierge turn; 500ms cap; no-throw (**040** complete commit 9316e39). §2 inventory mistakenly shows 🔴 — corrected below. |
| `VITE_USE_MASTRA_CHAT` prod | **true** | Bundle confirms `USE_MASTRA_CHAT:"true"` — authenticated users route to Mastra; anon falls through to legacy `ai-chat` |
| Mastra server health | **✅ Live** | `https://my-mastra-app-beta.vercel.app/health` → `{"success":true}` (2026-05-16) |
| EmbeddedListings → map pins | **✅ Wired** | `EmbeddedListings.tsx` 4 useEffects push pins to MapContext; `useSafeMapContext()` null-safe; `mergePinsByCategory` confirmed (**046/047**) |

---

## 1b. Tracker accuracy grade (YAML vs runtime)

| Dimension | Grade | Notes |
|-----------|-------|--------|
| **Task specs internally consistent** | **B+** | `verify:mastra` + `verify-task-deps` catch broken `depends_on`, cycles, bad links; ~30 WARNs remain (archive-only deps). |
| **YAML `status` = runtime truth** | **B−** | **046/047/050/053/054/056/057/066/067/068/073** Completed where shipped; **3 confirmed drifts** (2026-05-16 audit): **041** YAML “Not Started” but code is live; **048** YAML “Completed” but tracker showed 🔴; **074** tracker 🔴 but migration `20260514000100` shipped. |
| **Automated test score (repo gates)** | **A** | Root **216/216** Vitest (**16** files); `my-mastra-app` **56/56** (**4** files); `typecheck` green (2026-05-16). |
| **”100% correct” task inventory?** | **No** | Open gaps: **MASTRA-049** (no grounded tool), **003/012/013/015** (infrastructure), **EVT-103** (ticket edge fns out of scope here). |

**Not a substitute:** always open the task file + run the task’s § Verification block before marking **Completed**.

---

## 1c. Completed MASTRA maps tasks — implementation score (0–100)

Scores reflect **repo tests + code inspection + production verification** on **2026-05-16**.

| ID | Score | Verification |
|----|------:|--------------|
| **041** | **88** | `search-events.ts` live Supabase query + Bogotá TZ boundary; Vitest in `my-mastra-app`. YAML drift: status still "Not Started" — update needed. |
| **046** | **95** | `normalizeToolOutput` + `listingToolActionPassesVersionGate` — **23** tests; root Vitest **216/216**. |
| **047** | **93** | `version: 1` + pin merge — **`MapContext.test.ts`** (**6** tests); `EmbeddedListings` pin push confirmed in browser. |
| **048** | **65** | `maps_url`/`ai_summary` migration shipped; enrichment script exists. No CI proof of full row population or enrichment telemetry. |
| **050** | **90** | `lib/models.ts` + all agent imports; `typecheck` exit 0. |
| **053** | **86** | Live Supabase + logic test; full integration needs `SUPABASE_*` env (**083** optional). |
| **054** | **92** | `tourist_destinations` via `pg` Pool + Vitest (**9** blocks). |
| **056** | **96** | `'grounded'` category + neutral styling in `MapContext.test.ts`. |
| **057** | **84** | Migration on disk + RLS declared; no CI `db push` proof against remote. |
| **066** | **95** | `GroundingAttribution` + **20** Vitest tests; renders in app. |
| **067** | **82** | `maps_url` column migration shipped; no automated Places SKU verification yet. |
| **068** | **98** | `getGoogleMapsMapId()` + `VITE_GOOGLE_MAPS_MAP_ID` env in Vercel prod; production maps tiles confirmed in browser (2026-05-16); quoted-key bug fixed. |
| **073** | **89** | YAML + `places-mask-checklist.md`; no automated CI SKU test harness (**081**). |

**Corpus note:** **13** MASTRA rows now Completed/Functionally Complete; remaining are Not Started, In Progress, or Blocked.

---

## 2. Full inventory — every spec in `tasks/mastra/tasks/core/`, `tasks/mastra/tasks/mvp/`, `tasks/mastra/tasks/advanced/`, and `tasks/mastra/tasks/maps/`

> **74** markdown files with `task_id` or narrative/reference frontmatter. **Verified 2026-05-17** against actual code files, Mastra MCP (`mastraDocs`), and Google Maps MCP. Dot column is authoritative runtime truth — not YAML status alone.

<!-- dot-audit: 2026-05-17 — verified every row against: file existence, code grep, Mastra MCP model registry, mde-maps skill, RLS SQL -->

**Dot legend:** 🟢 Complete · 🟡 In Progress (partial code) · 🔴 Failing (started but defective/incomplete) · ⚪ Not yet started

| ID | Task file | Dot | Evidence / reason |
|----|-----------|-----|-------------------|
| **MASTRA-003** | [`003-mastra-tool-audit-control-events.md`](./tasks/core/003-mastra-tool-audit-control-events.md) | 🟡 | `audit-wrapper.ts` + `registry.ts` + `risk-levels.ts` exist in `tools/`. NOT wired to any agent (0 imports). No `ai_tool_audit_events` DB migration. |
| **MASTRA-004** | [`004-mastra-hybrid-search-tools.md`](./tasks/core/004-mastra-hybrid-search-tools.md) | ⚪ | No `tools/hybrid*` file found. VDB-01 FTS migration exists but Mastra tool wrapper not created. |
| **MASTRA-005** | [`005-mastra-chat-router-concierge.md`](./tasks/mvp/005-mastra-chat-router-concierge.md) | 🟡 | `router.ts` + `concierge.ts` + `rental-agent.ts` + `event-agent.ts` all exist and registered. **✅ Fixed 2026-05-17**: model IDs corrected (MASTRA-050), `cardSchema` lat/lng added (Gap A), `source: ‘mock’` override removed. Remaining: SSE event type names unconfirmed (Gap B). |
| **MASTRA-006** | [`006-mastra-real-estate-mvp-agents.md`](./tasks/mvp/006-mastra-real-estate-mvp-agents.md) | 🟡 | `rental-agent.ts` + `search-rentals.ts` (Supabase-backed) exist. Missing: full agent spec coverage, memory persistence for rentals tested end-to-end. |
| **MASTRA-007** | [`007-mastra-events-mvp-runtime.md`](./tasks/mvp/007-mastra-events-mvp-runtime.md) | 🟡 | `event-agent.ts` + `search-events.ts` (Supabase-backed) exist. `event-discovery-workflow.ts` registered. |
| **MASTRA-008** | [`008-mastra-restaurants-mvp-discovery.md`](./tasks/mvp/008-mastra-restaurants-mvp-discovery.md) | 🟡 | `search-restaurants.ts` Supabase-backed (MASTRA-053 shipped). Mastra agent + workflow not yet separately scoped per this task spec. |
| **MASTRA-009** | [`009-mastra-ui-dojo-chat-frontend.md`](./tasks/mvp/009-mastra-ui-dojo-chat-frontend.md) | ⚪ | Title says “Reference Patterns Only”. No code required — deliberately a reference doc. |
| **MASTRA-010** | [`010-mastra-memory-rag-mvp.md`](./tasks/mvp/010-mastra-memory-rag-mvp.md) | 🟡 | `Memory` with `workingMemory` configured in `concierge.ts`. `@mastra/memory` installed. RAG / semantic recall not wired. |
| **MASTRA-011** | [`011-mastra-observability-evals-guardrails.md`](./tasks/mvp/011-mastra-observability-evals-guardrails.md) | 🟡 | `Observability` + `DefaultExporter` + `SensitiveDataFilter` in `index.ts`. `evaluation.ts` agent + scorers exist. Guardrails (`PromptInjectionDetector` + `TokenLimiter`) in concierge. Evals harness not run against prod. |
| **MASTRA-012** | [`012-mastra-workflow-state-runtime.md`](./tasks/core/012-mastra-workflow-state-runtime.md) | ⚪ | No workflow-state Supabase migration found. `createPostgresStore()` wired but no workflow persistence schema. |
| **MASTRA-013** | [`013-mastra-tenant-isolation.md`](./tasks/core/013-mastra-tenant-isolation.md) | ⚪ | No `org_id` RLS policies or tenant-isolation migration found. |
| **MASTRA-014** | [`014-mastra-ai-rate-limits.md`](./tasks/core/014-mastra-ai-rate-limits.md) | 🟡 | `durable_rate_limiter.sql` + `check_rate_limit_rpc.sql` migrations exist for the `ai-chat` edge function path. Mastra-side rate limiting not yet wired. |
| **MASTRA-015** | [`015-mastra-tool-registry-system.md`](./tasks/core/015-mastra-tool-registry-system.md) | 🔴 | `registry.ts` exists but `TOOL_REGISTRY = {}` — empty object, never populated. `registerTool()` function defined but never called anywhere. Structure present, non-functional. |
| **MASTRA-016** | [`016-mastra-streaming-ui-state.md`](./tasks/mvp/016-mastra-streaming-ui-state.md) | 🟡 | `useChat.ts` Mastra SSE path streams `text-delta`, handles `tool-input-available` / `tool-output-available` / `data-mdeai-actions`. Pin pipeline gap found (§3.5) — SSE event type names unconfirmed vs live Mastra stream. |
| **MASTRA-017** | [`017-mastra-workflow-recovery.md`](./tasks/mvp/017-mastra-workflow-recovery.md) | ⚪ | No DLQ or dead-letter handling found. |
| **MASTRA-018** | [`018-mastra-human-handoff-runtime.md`](./tasks/mvp/018-mastra-human-handoff-runtime.md) | ⚪ | No human-handoff runtime found. |
| **MASTRA-019** | [`019-mastra-client-sdk-integration.md`](./tasks/mvp/019-mastra-client-sdk-integration.md) | 🟢 | `@mastra/client-js` installed. `VITE_USE_MASTRA_CHAT=true` confirmed in Vercel Production + Preview. `useChat.ts` routes auth users to `${MASTRA_SERVER_URL}/chat`. Server health `{“success”:true}` (2026-05-16). Anon users still fall through to legacy `ai-chat` — intentional (no access token). |
| **MASTRA-020** | [`020-mastra-paperclip-approval-bridge.md`](./tasks/mvp/020-mastra-paperclip-approval-bridge.md) | ⚪ | No Mastra ↔ Paperclip bridge code found. |
| **MASTRA-021** | [`021-mastra-vdb-local-remote-reconciliation.md`](./tasks/core/021-mastra-vdb-local-remote-reconciliation.md) | 🟡 | VDB-01 `vdb01_hybrid_fts_search.sql` migration exists + `pgvector_semantic_search.sql`. Local/remote parity not formally verified or scripted. |
| **MASTRA-024** | [`024-mastra-env-secret-boundary.md`](./tasks/core/024-mastra-env-secret-boundary.md) | ⚪ | No env-boundary enforcement file found in `my-mastra-app/src/mastra/lib/`. `SUPABASE_URL`/`SUPABASE_ANON_KEY` missing from `my-mastra-app/.env` (commented out). |
| **MASTRA-025** | [`025-mastra-dependency-alias-map.md`](./tasks/core/025-mastra-dependency-alias-map.md) | ⚪ | No dependency alias map created. |
| **MASTRA-031** | [`031-mastra-editor-prompt-architecture.md`](./tasks/advanced/031-mastra-editor-prompt-architecture.md) | ⚪ | Editor prompt stack not started. `@mastra/editor` installed in `package.json` only. |
| **MASTRA-032** | [`032-mastra-editor-prompt-block-library.md`](./tasks/advanced/032-mastra-editor-prompt-block-library.md) | ⚪ | Not started. |
| **MASTRA-033** | [`033-mastra-editor-seeding-and-versioning.md`](./tasks/advanced/033-mastra-editor-seeding-and-versioning.md) | ⚪ | Not started. |
| **MASTRA-034** | [`034-mastra-editor-runtime-preview-and-context.md`](./tasks/advanced/034-mastra-editor-runtime-preview-and-context.md) | ⚪ | Not started. |
| **MASTRA-035** | [`035-mastra-editor-prompt-qa-studio-workflow.md`](./tasks/advanced/035-mastra-editor-prompt-qa-studio-workflow.md) | ⚪ | Not started. |
| **MASTRA-036** | [`036-gemini-structured-output-helper.md`](./tasks/advanced/036-gemini-structured-output-helper.md) | ⚪ | `callGeminiStructured` not found anywhere in `src/` or `my-mastra-app/src/`. YAML says “In Progress” — YAML drift. |
| **MASTRA-037** | [`037-verify-edge-floor-integration.md`](./tasks/advanced/037-verify-edge-floor-integration.md) | 🟢 | `verify:edge` is in both `floor` and `outcomes:verify` scripts in `package.json`. Edge function type errors fail the floor. |
| **MASTRA-038** | [`038-mastra-chat-live-smoke-timezone.md`](./tasks/advanced/038-mastra-chat-live-smoke-timezone.md) | 🔴 | `mastra-smoke.sh` exists with ~38 general assertions. Zero assertions for timezone, pin count, or `ai_runs` (grep returned 0). Task spec requires those specific assertions — not met. |
| **MASTRA-039** | [`039-mastra-chat-production-rollout.md`](./tasks/advanced/039-mastra-chat-production-rollout.md) | 🟡 | `VITE_USE_MASTRA_CHAT` in Vercel Production ✅. `/concierge` → `/chat` redirect in `App.tsx` line 211 ✅. Outstanding: anon user CORS on Mastra server; `Concierge.tsx` file not deleted. |
| **MASTRA-040** | [`040-mastra-ai-runs-logging.md`](./tasks/advanced/040-mastra-ai-runs-logging.md) | 🟢 | `ai-runs-middleware.ts` shipped, path-scoped to `/chat`, commit 9316e39. Fires on every concierge turn; 500ms cap; no-throw. YAML not yet updated (still “Not Started” — drift). |
| **MASTRA-041** | [`041-mastra-search-events-supabase.md`](./tasks/advanced/041-mastra-search-events-supabase.md) | 🟢 | `search-events.ts` uses `createClient()` (6 occurrences) + Bogotá TZ boundaries. Live Supabase-backed. YAML still “Not Started” — drift. |
| **MASTRA-042** | [`042-sponsor-gemini-structured-functions.md`](./tasks/advanced/042-sponsor-gemini-structured-functions.md) | ⚪ | Sponsor schema now exists (MASTRA-063 shipped). Original blocker resolved. `callGeminiStructured` still not implemented — task is now unblocked but not started. |
| **MASTRA-043** | [`043-mastra-geo-production-plan.md`](./tasks/maps/043-mastra-geo-production-plan.md) | 🟡 | Master plan doc exists. Many sub-tasks from this plan are complete (046/047/053/054/056/057/066/067/068/073/074). Pin pipeline gap + model IDs + grounding (049) still open. |
| **MASTRA-044** | [`044-mastra-deploy-verification.md`](./tasks/advanced/044-mastra-deploy-verification.md) | 🟡 | Health endpoint `public/health.ts` exists + returns `{ok:true}`. Mastra server live at `my-mastra-app-beta.vercel.app/health`. Full deploy verification checklist (smoke + CORS + auth) not documented or automated. |
| **MASTRA-045** | [`045-mastra-smoke-hardening.md`](./tasks/advanced/045-mastra-smoke-hardening.md) | 🔴 | `mastra-smoke.sh` script exists with 38 assertions. Zero assertions for: known-event pin count, `ai_runs` row check, timezone boundary. Task spec explicitly requires these — not met. |
| **MASTRA-046** | [`046-mastra-action-schema-validation.md`](./tasks/maps/046-mastra-action-schema-validation.md) | 🟢 | `normalizeToolOutput` + `listingToolActionPassesVersionGate` in `src/lib/chat/normalize-tool-output.ts`. 23 Vitest tests passing. TOOL_MAP covers all 4 categories in both kebab-case and camelCase. |
| **MASTRA-047** | [`047-mastra-map-pin-merge-versioning.md`](./tasks/maps/047-mastra-map-pin-merge-versioning.md) | 🟢 | `mergePinsByCategory` in `MapContext.tsx`. `version: 1` set in all 4 ChatCanvas `useEffect` hooks. `MapContext.test.ts` passing. Code is correct — pin visibility bug is in `cardSchema` (§3.5), not this task. |
| **MASTRA-048** | [`048-mastra-maps-enrichment-phase2.md`](./tasks/maps/048-mastra-maps-enrichment-phase2.md) | 🟡 | `mapsUrl`/`aiSummary` in `src/types/chat.ts` ✅. Migration `20260514000100` shipped ✅. `enrich-places.ts` script exists. No CI proof of full DB row population — enrichment not run in verified session. |
| **MASTRA-049** | [`049-mastra-geo-grounding-phase3.md`](./tasks/maps/049-mastra-geo-grounding-phase3.md) | 🔴 | `maps-grounding-client.ts` exists (MCP transport plumbing). No `searchGroundedPlacesTool` created or registered in any agent. Task core deliverable missing. |
| **MASTRA-050** | [`050-mastra-canonical-models-constants.md`](./tasks/maps/050-mastra-canonical-models-constants.md) | 🟢 | **✅ FIXED 2026-05-17** — `CONCIERGE_MODEL`/`REASONING_MODEL` = `’google/gemini-2.5-flash’`; `PLANNING_MODEL` = `’google/gemini-2.5-pro’`. MCP-verified IDs. `tsc --noEmit` + build clean. |
| **MASTRA-053** | [`053-mastra-wire-search-restaurants.md`](./tasks/maps/053-mastra-wire-search-restaurants.md) | 🟢 | `search-restaurants.ts` live Supabase query via `@supabase/supabase-js`. Logic tests passing. |
| **MASTRA-054** | [`054-mastra-wire-search-attractions.md`](./tasks/maps/054-mastra-wire-search-attractions.md) | 🟢 | `search-attractions.ts` uses `pg` Pool → `tourist_destinations` table. 9 Vitest blocks passing. |
| **MASTRA-056** | [`056-mastra-grounded-mappincategory.md`](./tasks/maps/056-mastra-grounded-mappincategory.md) | 🟢 | `’grounded’` in `MapContext.tsx` union type (line 17) + pin style entry `{ emoji: ‘📌’, color: ‘#6B7280’, label: ‘Place’ }` (line 130). |
| **MASTRA-057** | [`057-mastra-grounding-quota-log-migration.md`](./tasks/maps/057-mastra-grounding-quota-log-migration.md) | 🟢 | `supabase/migrations/20260513103000_grounding_quota_log.sql` on disk. RLS: `grounding_quota_log.relrowsecurity = true` (verified via Supabase MCP 2026-05-17). |
| **MASTRA-059** | [`059-mastra-google-search-grounding.md`](./tasks/maps/059-mastra-google-search-grounding.md) | ⚪ | No `googleSearch` tool or `useGoogleSearch` found in Mastra agents. Not started. |
| **MASTRA-060** | [`060-mastra-code-execution-budget-agent.md`](./tasks/advanced/060-mastra-code-execution-budget-agent.md) | ⚪ | Not started. |
| **MASTRA-061** | [`061-mastra-retire-concierge-route.md`](./tasks/maps/061-mastra-retire-concierge-route.md) | 🟡 | `App.tsx` line 211: `<Route path=”/concierge” element={<Navigate to=”/chat” replace />} />` ✅. Comment: “Concierge page retired”. `Concierge.tsx` file still exists and not deleted — task half-done. |
| **MASTRA-062** | [`062-mastra-wire-route-display.md`](./tasks/maps/062-mastra-wire-route-display.md) | 🟡 | `src/components/map/RouteDisplay.tsx` exists. No `OPEN_ROUTE_RESULTS` ChatAction type, no Mastra tool output wired, not in `normalizeToolOutput` TOOL_MAP. Component exists, wiring is missing. |
| **MASTRA-063** | [`063-mastra-sponsor-schema-foundation.md`](./tasks/advanced/063-mastra-sponsor-schema-foundation.md) | 🟢 | 3 sponsor migrations exist: `sponsor_schema_foundation.sql`, `sponsor_schema_edge_acl.sql`, `sponsor_activate_placements_if_ready.sql`. RLS present per 05-audit-tasks.md. |
| **MASTRA-064** | [`064-mastra-sponsor-gemini-edge-functions.md`](./tasks/advanced/064-mastra-sponsor-gemini-edge-functions.md) | ⚪ | Not started. Schema prerequisite (063) now done. |
| **MASTRA-065** | [`065-mastra-grounded-pins-lite.md`](./tasks/maps/065-mastra-grounded-pins-lite.md) | ⚪ | No `search-grounded*` tool found. Depends on MASTRA-049. |
| **MASTRA-066** | [`066-mastra-grounding-attribution-component.md`](./tasks/maps/066-mastra-grounding-attribution-component.md) | 🟢 | `src/components/maps/GroundingAttribution.tsx` + `.test.tsx`. 20 Vitest tests passing. ToS badge renders in app. |
| **MASTRA-067** | [`067-mastra-places-field-mask-placeuri.md`](./tasks/maps/067-mastra-places-field-mask-placeuri.md) | 🟢 | `maps_url` column in migration `20260514000100`. `mapsUrl` field in `src/types/chat.ts`. `placeUri` field mask verified against mde-maps skill. |
| **MASTRA-068** | [`068-mastra-production-map-id.md`](./tasks/maps/068-mastra-production-map-id.md) | 🟢 | `src/lib/google-maps-map-id.ts` helper. `VITE_GOOGLE_MAPS_MAP_ID` in Vercel Production (encrypted). Map tiles confirmed live in browser 2026-05-16. |
| **MASTRA-069** | [`069-mastra-grounding-lite-telemetry.md`](./tasks/maps/069-mastra-grounding-lite-telemetry.md) | ⚪ | No telemetry code found in `my-mastra-app/`. Depends on MASTRA-049. |
| **MASTRA-070** | [`070-mastra-contextual-view-defer-ga.md`](./tasks/maps/070-mastra-contextual-view-defer-ga.md) | ⚪ | Intentionally deferred until Google Contextual View reaches GA. Not a failure — correctly parked. |
| **MASTRA-071** | [`071-mastra-google-cloud-api-key-ip-restrictions.md`](./tasks/maps/071-mastra-google-cloud-api-key-ip-restrictions.md) | ⚪ | GCP Console action — no code change required. Not yet done (key rotation + IP restrict pending). |
| **MASTRA-072** | [`072-mastra-grounding-lite-weather-cache.md`](./tasks/maps/072-mastra-grounding-lite-weather-cache.md) | ⚪ | No `weather_cache` migration. `weather-workflow.ts` exists but no caching layer. |
| **MASTRA-073** | [`073-mastra-places-field-masks-cost-audit.md`](./tasks/maps/places/073-mastra-places-field-masks-cost-audit.md) | 🟢 | `tasks/maps/places-mask-checklist.md` exists. mde-maps skill confirms field mask pattern (`X-Goog-FieldMask` with `places.googleMapsLinks`). |
| **MASTRA-074** | [`074-mastra-places-cache-schema-ttl.md`](./tasks/maps/places/074-mastra-places-cache-schema-ttl.md) | 🟢 | `supabase/migrations/20260514000100_places_cache_schema.sql` ships `places_search_cache` + `place_details_cache` + 8 RLS policies. Both tables `relrowsecurity=true` (Supabase MCP 2026-05-17). TTL sweep not automated — 95% complete. |
| **MASTRA-075** | [`075-mastra-places-nearby-rental-show-nearby.md`](./tasks/maps/places/075-mastra-places-nearby-rental-show-nearby.md) | ⚪ | No `search-nearby*` tool found. |
| **MASTRA-076** | [`076-mastra-places-details-cache-enrichment.md`](./tasks/maps/places/076-mastra-places-details-cache-enrichment.md) | ⚪ | Not started. |
| **MASTRA-077** | [`077-mastra-places-photos-cards.md`](./tasks/maps/places/077-mastra-places-photos-cards.md) | ⚪ | Not started. |
| **MASTRA-078** | [`078-mastra-places-autocomplete-host-venue.md`](./tasks/maps/places/078-mastra-places-autocomplete-host-venue.md) | ⚪ | Not started. |
| **MASTRA-079** | [`079-mastra-geocoding-address-fallback.md`](./tasks/maps/079-mastra-geocoding-address-fallback.md) | ⚪ | Not started. |
| **MASTRA-080** | [`080-mastra-places-security-quota-controls.md`](./tasks/maps/places/080-mastra-places-security-quota-controls.md) | ⚪ | Not started. |
| **MASTRA-081** | [`081-mastra-places-test-fixtures-mocks.md`](./tasks/maps/places/081-mastra-places-test-fixtures-mocks.md) | ⚪ | Not started. |
| **MASTRA-083** | [`083-mastra-search-restaurants-integration-tests.md`](./tasks/advanced/083-mastra-search-restaurants-integration-tests.md) | ⚪ | Optional integration tests. Not started. |
| **EVT-103** | [`103-ticket-payment-edge-functions-repo-gap.md`](./tasks/advanced/103-ticket-payment-edge-functions-repo-gap.md) | ⚪ | Ticket edge functions not in this repo tree. Cross-repo coordination needed. |
| *(20-mastra.md)* | [`20-mastra.md`](./tasks/20-mastra.md) | 🟢 | Delivered — Mastra Production Architecture Plan |
| *(21-mastra-repos-templates.md)* | [`21-mastra-repos-templates.md`](./tasks/21-mastra-repos-templates.md) | ⚪ | Reference doc — no implementation required |
| *(22-mastra-repos-extract-tasks.md)* | [`22-mastra-repos-extract-tasks.md`](./tasks/22-mastra-repos-extract-tasks.md) | ⚪ | Reference doc — no implementation required |
| *(23-mastra-modules-verified.md)* | [`23-mastra-modules-verified.md`](./tasks/23-mastra-modules-verified.md) | ⚪ | Reference doc — no implementation required |

**Dot summary (2026-05-17):** 🟢 Complete: 19 · 🟡 In Progress: 15 · 🔴 Failing: 5 · ⚪ Not started: 35

**Failing tasks (must fix before calling production-ready):**
- 🔴 **MASTRA-015** — `TOOL_REGISTRY = {}` empty, never populated  
- 🔴 **MASTRA-038** — smoke.sh missing timezone + pin + ai_runs assertions  
- 🔴 **MASTRA-045** — same as 038, smoke spec not met  
- 🔴 **MASTRA-049** — `searchGroundedPlacesTool` not implemented  
- 🔴 **MASTRA-050** — model IDs `gemini-3.x` not in Mastra docs; verified correct IDs are `google/gemini-2.5-flash` / `google/gemini-2.5-pro`

**Gaps in MASTRA numbering:** no task files **051**, **052**, **055**, or **058** (by design or retired IDs).

---

## 3. Mastra runtime — core tracker

| Task / area | Description | Status | % | ✅ Confirmed | ⚠️ Missing / Failing | 💡 Next action |
|-------------|---------------|--------|---|--------------|----------------------|----------------|
| **MASTRA-041** | `search-events` live Supabase query + Bogotá TZ | 🟢 | 90% | Code shipped in `search-events.ts`; Vitest in `my-mastra-app` | YAML status still "Not Started" — drift to fix | Update task YAML |
| **MASTRA-046** | `normalizeToolOutput` + Zod for tool → UI actions | 🟢 | 100% | **23** Vitest + `useChat` path wired | — | Keep aligned with new tools |
| **MASTRA-047** | Pin merge + `version: 1` on map actions | 🟢 | 100% | YAML **Completed** + version gate + `MapContext.test.ts`; pin→card sync confirmed in browser | — | Keep version gate when adding tools |
| **MASTRA-050** | Canonical `lib/models.ts` for Gemini model IDs | 🟢 | 100% | YAML **Completed** + agent imports + `typecheck` | — | Rotate IDs in one file when Google deprecates |
| **MASTRA-053** | Wire `search-restaurants` → Supabase | 🟢 | 100% | Task Completed + logic test | — | Optional **083** integration tests |
| **MASTRA-054** | Wire `search-attractions` → **`tourist_destinations`** | 🟢 | 100% | YAML **Completed** + Pool SQL + Vitest **9 blocks** | No CI DB integration without `DATABASE_URL` | Staging smoke before prod parity claim |
| **MASTRA-066** | `GroundingAttribution` ToS badge | 🟢 | 100% | YAML **Completed** + **20** Vitest; renders in app | Full grounded UX still needs **049** | — |
| **MASTRA-067** | `maps_url` column + placeUri field mask | 🟢 | 100% | YAML **Completed** + migration shipped `20260514000100` | No automated SKU CI test | Wire enrichment script consumers |
| **MASTRA-068** | Production Map ID + `getGoogleMapsMapId()` | 🟢 | 100% | YAML **Completed** + env in Vercel prod + quoted-key bug fixed 2026-05-16 + browser confirmed | — | Monitor billing dashboard |
| **MASTRA-073** | Places field-mask / SKU checklist | 🟢 | 100% | YAML **Completed** + `places-mask-checklist.md` | Call-site CI grep (**081**) optional | Wire **074** consumers |
| **MASTRA-003** | Tool audit + `ai_tool_audit_events` | 🔴 | ~15% | Wrapper patterns + `registry.ts` | Full migration + all tools wrapped | Follow task `003` |
| **MASTRA-004–005** | Hybrid search + router/concierge MVP | 🔴 | ~10–30% | Docs + partial wiring | End-to-end gated on safety stack | See [`000-index.md`](./tasks/000-index.md) order |
| **MASTRA-012–015** | Workflow state, tenant, rate limits, registry | 🔴 | ~5–20% | Specs | Not production-complete | Sequential per index |
| **MASTRA-019** | Client SDK / chat ingress | 🟢 | ~90% | `@mastra/client-js`, `chatRoute`, **`VITE_USE_MASTRA_CHAT=true` in prod bundle confirmed** (2026-05-16) | CORS on Mastra server; anon users still legacy path | Verify CORS headers on `my-mastra-app-beta.vercel.app` |
| **MASTRA-040** | `ai_runs` logging from Mastra agents | 🟢 | 85% | `ai-runs-middleware.ts` wired to `/chat` — commit 9316e39; fires on every concierge turn | Per-agent token-count fields not populated; YAML status not updated | Update YAML; optional **083** token-count extension |
| **MASTRA-020** | Paperclip approval bridge | 🔴 | 0% | Task only | No Mastra ↔ Paperclip runtime | Plan-only until staffed |
| **Studio / agents** | Router, concierge, rental, event, weather, ping, eval | 🟡 | ~78% | `mastra dev` / 7 agents registered; server health `{"success":true}` | Eval scorer IDs, memory gaps, anon chat gap | Fix scorer tool names; add rental/event memory |

---

## 3.5 PIN PIPELINE GAP — Root cause found 2026-05-17

> **Problem:** Google Map loads on `/chat` but zero pins appear, even after the concierge responds with rental results.  
> **Status:** **Gap A FIXED 2026-05-17** — `cardSchema` lat/lng + `source: out.source` committed. Gap B (SSE event type names) still unconfirmed — verify via live Network tab.

### Evidence gathered this session

| Check | Result |
|-------|--------|
| `VITE_USE_MASTRA_CHAT` in Vercel prod | ✅ `true` — production routes to Mastra, not legacy `ai-chat` |
| All 44 apartments have `latitude`/`longitude` in DB | ✅ `with_both: 44`, lat 6.143–6.260, lng -75.615 to -75.555 |
| `searchRentalsTool` includes lat/lng in `context?.writer?.custom()` cards | ✅ `latitude: r.latitude ?? null` in tool execute |
| `normalizeToolOutput` TOOL_MAP has `'search-rentals'` key | ✅ mapped to `OPEN_RENTALS_RESULTS` |
| `rentalListingSchema` in `normalize-tool-output.ts` includes lat/lng | ✅ `latitude: z.number().nullable().optional()` |
| ChatCanvas 4 `useEffect` hooks dispatch pins to MapContext | ✅ MASTRA-047 implemented (lines 262–344) |
| ChatMap filters `pinsWithCoords = pins.filter(p => p.latitude != null)` | ✅ — correct, filters out null-coord pins |

### Root cause — TWO gaps

**Gap A: `cardSchema` in `concierge-routing-workflow.ts` has no lat/lng**

```typescript
// concierge-routing-workflow.ts line 150–157
const cardSchema = z.object({
  id: z.string(),
  headline: z.string(),
  subline: z.string(),
  priceLabel: z.string(),
  imageUrl: z.string().optional(),
  sourceUrl: z.string().optional(),
  // ← NO latitude, NO longitude
});
```

The `dispatchStep` maps rental results to this schema (lines 204–211) — dropping lat/lng. When the workflow emits `data-mdeai-actions`, the cards payload has `latitude: undefined`. `useChat.ts` line 449: `latitude: c.latitude ?? null` → always `null`. ChatMap filters these out. **All pins are dropped.**

**Gap B: `tool-output-available` SSE event type not confirmed**

`useChat.ts` line 413 listens for `ev.type === 'tool-output-available'` from the Mastra SSE stream. The Mastra framework's `/chat` endpoint uses the Vercel AI SDK UI stream format — the actual event type names have not been confirmed via live browser Network inspection. If Mastra emits `tool-result` or `tool-call` instead, the `normalizeToolOutput` path is never triggered.

### Fix required

| File | Change |
|------|--------|
| ~~`my-mastra-app/src/mastra/workflows/concierge-routing-workflow.ts`~~ | ✅ **DONE** — `latitude: z.number().nullable().optional()` + `longitude` added to `cardSchema`; all 4 card mappings pass `lat ?? null` / `lng ?? null`; `source: out.source` replaces `source: 'mock' as const` |
| `src/hooks/useChat.ts` | **Still open** — Confirm actual Mastra SSE event type names for tool-call and tool-result by inspecting live Network tab; update `'tool-input-available'`/`'tool-output-available'` if Mastra uses different names |

### Not a bug in
- `searchRentalsTool` — correctly includes lat/lng in both the writer payload and return value  
- `normalizeToolOutput` — schema and TOOL_MAP are correct  
- ChatCanvas MASTRA-047 effects — correctly wired  
- ChatMap filter — correctly only renders pins with coords  

---

## 4. Google Maps + Grounding Lite (focused)

| Task | Description | Status | % | ✅ Confirmed | ⚠️ Missing / Failing | 💡 Next action |
|------|---------------|--------|---|--------------|----------------------|----------------|
| **MASTRA-056** | `grounded` `MapPinCategory` + styling | 🟢 | 100% | Task + repo | — | None |
| **MASTRA-057** | `grounding_quota_log` table + RLS | 🟢 | 100% | Migration on disk | No CI `db push` proof against remote | Next migration: add comment fix |
| **MASTRA-066** | `GroundingAttribution` (ToS/legal) | 🟢 | 100% | YAML **Completed**; **20** Vitest | Full grounded UI still needs **049** | Ship **049** train |
| **MASTRA-067** | `maps_url` + placeUri field mask | 🟢 | 100% | YAML **Completed**; migration shipped | — | Wire enrichment script consumers |
| **MASTRA-068** | Production Map ID + env | 🟢 | 100% | ✅ FIXED 2026-05-16 — env set in Vercel; tiles confirmed live | — | Monitor billing |
| **MASTRA-069** | Grounding telemetry + caps | 🔴 | 0% | Spec | No tool code | Ship in same train as **049** |
| **MASTRA-049** | `searchGroundedPlacesTool` (MCP client) | 🔴 | ~10% | MCP deps installed; client transport stub | **No tool implementation**; not wired to concierge | Implement transport + tool |
| **MASTRA-048** | Offline Places enrichment | 🟡 | 65% | Schema + cols shipped; `enrich-places.ts` script | No CI proof of full row population | Run enrichment + verify row counts |
| **MASTRA-074** | Places cache TTL schema | 🟢 | 95% | Migration `20260514000100` ships `places_search_cache` + `place_details_cache` + RLS — **tracker was wrong** | No CI TTL sweep tested | Track expiry sweep separately |
| **MASTRA-073–081** | Places API (New) layer | 🟡 / 🔴 | ~35–45% | **073** done; **074** schema done; **067** col done | **075–081** unimplemented; no CI mask enforcement | **075** nearby rental next |
| **MASTRA-062** | Route display action | 🔴 | ~40% | `RouteDisplay.tsx` exists | Mastra tool output + `OPEN_ROUTE_RESULTS` not wired | Wire normalizeToolOutput + EmbeddedListings |
| **MASTRA-072** | Weather + `weather_cache` | 🔴 | 0% | Spec | No migration or tool | After **049** pattern stable |

---

## 5. Integrations (chat-adjacent systems)

| System | Description | Status | % | ✅ Confirmed | ⚠️ Missing / Failing | 💡 Next action |
|--------|---------------|--------|---|--------------|----------------------|----------------|
| **Gemini 3 agents + tools** | Mastra agents + search tools | 🟡 | ~72% | Multiple agents; **053**/**054** live paths; **050** models; **047** version gate; **066** attribution | No grounded **agent** tool (**049**) | **049** + **068** |
| **Supabase edge (`ai-chat`)** | Legacy SSE chat + tools | 🟢 | ~85% | Rate limits, Zod, logging | MAX_TOOL_ROUNDS, duplicate search tools | See audit §33 Part C |
| **OpenClaw** | Approved execution / channels | 🔴 | ~5% | `tasks/openclaw/` plans | No product runtime in Mastra path | Defer; keep security gates |
| **Hermes** | Advisory ranking / research | 🔴 | ~5% | Prompts / links | No runtime | Defer |
| **Paperclip** | Governance / approvals | 🟡 | ~25% | Monorepo `paperclip/` | **MASTRA-020** not started | Bridge after core chat stable |
| **Postiz** | Social scheduling | 🔴 | ~5% | Prompts / skill | No Mastra integration | Defer |

---

## 6. Production readiness (Mastra path)

| Gate | Status | Evidence / gap |
|------|--------|------------------|
| Floor green (`npm run floor`) | 🟢 | lint + build + Vitest (**216/216**) + `verify:edge` + `verify:mastra` — 2026-05-16 |
| `npm run verify:mastra` | 🟢 | DAG + YAML drift heuristics + surface gates; ~30 archive-only WARNs (cosmetic) |
| Mastra `typecheck` + tests | 🟢 | `cd my-mastra-app && npm run test` — **56/56** (**4** files), 2026-05-16 |
| Production Maps rendering | 🟢 | `gm_authFailure` fixed; tiles confirmed in browser (2026-05-16); `VITE_GOOGLE_MAPS_MAP_ID` live |
| `VITE_USE_MASTRA_CHAT=true` in prod | 🟢 | Bundle confirmed; Mastra server health `{“success”:true}`; auth users → Mastra |
| Task YAML **Completed** | Policy | Only after **floor** + evidence in `verify-task-status-drift.mjs` map |
| Anon users → Mastra | 🔴 | Anon falls through to legacy `ai-chat` (no access token); **MASTRA-019** CORS + anon path open |
| No grounded Maps **agent tool** | 🔴 | **049** not implemented; **066** badge shipped; grounding runtime incomplete |
| No runaway Maps billing | 🟡 | **057** table exists; **049/069** quota enforcement not wired |
| `ai_runs` in Mastra agents | 🟢 | `ai-runs-middleware.ts` wired to `/chat` — fires on every concierge turn (commit 9316e39); per-agent token-count optional (**040** middleware done) |
| **Overall Mastra+Maps readiness** | 🟡 **~70%** | **15** tasks shipped (MASTRA-050 fixed 2026-05-17); **Gap A fixed** (cardSchema lat/lng + source); Gap B (SSE type names) still open; open: **003/012/013/015/049** + ticket fns (**EVT-103**) |

---

## 7. Next actions — ordered implementation sequence (updated 2026-05-17)

### Tier 0 — Unblock visible map pins (P0, current sprint)

1. **PIN PIPELINE FIX** — Add `latitude`/`longitude` to `cardSchema` in `concierge-routing-workflow.ts`; pass through coords in `dispatchStep` card mappings for all 4 categories (rental/event/restaurant/attraction). Then confirm Mastra SSE event type names (`tool-input-available`/`tool-output-available`) match the actual stream by checking Network tab once. **Files:** `concierge-routing-workflow.ts` + `src/hooks/useChat.ts`. No migration, no new test files needed beyond updating normalize-tool-output tests. **Blocks:** all map UX.

2. **Fix `source: 'mock' as const`** — Change `concierge-routing-workflow.ts` line 215 to `source: out.source` so live Supabase results aren't tagged as mock. 1-line fix. **File:** `concierge-routing-workflow.ts`.

3. **Add `SUPABASE_URL`/`SUPABASE_ANON_KEY` to `my-mastra-app/.env`** — Uncomment the two lines. Without these, `search-events` and `search-restaurants` silently fail in local dev. **File:** `my-mastra-app/.env` (gitignored).

### Tier 1 — YAML drift cleanup (P0, 15 min total)

4. **Update MASTRA-041 YAML** — Change `status: Not Started` → `Completed` in `041-mastra-search-events-supabase.md`. Code shipped; tests pass.

5. **Update MASTRA-040 YAML** — Change `status: Not Started` → `Completed` in `040-mastra-ai-runs-logging.md`. Middleware shipped in commit 9316e39.

### Tier 2 — Smoke + production hardening (P0, blocks EVT Phase 2)

6. **Phase 1 gate: Camila E2E (G1)** — Buyer flow ticket purchase → email → QR. Blocks Phase 2 entirely. EVT task, not Mastra — but listed here because it's the current blocking gate for the whole product.

7. **038** — Live smoke timezone proof (confirms event weekend boundaries work end-to-end). Unblocks **039** production rollout flag flip.

### Tier 3 — Maps grounding (P1, Phase 3 train)

8. **049** — `searchGroundedPlacesTool` MCP transport + concierge agent wiring. Only P0 Maps gap after **068** is fixed. Implement transport first, then agent tool, then **069** telemetry.

9. **062** — `OPEN_ROUTE_RESULTS` + `RouteDisplay` end-to-end from Mastra tool → EmbeddedListings + normalizeToolOutput. `RouteDisplay.tsx` exists; tool output + action type not wired.

10. **048** completion — Run `enrich-places.ts` against production DB; verify `maps_url` populated on ≥50% of restaurants/destinations; add CI proof.

### Tier 4 — Infrastructure spine (P1, unblocks >20 downstream tasks)

11. **003 → 012 → 013 → 015** — Tool audit events, Supabase workflow state, tenant isolation, shared registry. Must be done in this order per `000-index.md` execution sequence.

12. **075** — Nearby Search (New) `show-nearby` Mastra tool. First concrete Places API consumer after **074** schema is confirmed.

---

**Hygiene (non-blocking):** fix ~30 archive-only WARNs in `verify-task-deps.mjs`; remove `localhost:8080` from Maps API key HTTP-referrer list before production lock; update `MASTRA-019` CORS gap for anon users.

---

## 8. References

| Doc | Path |
|-----|------|
| Task index (execution order) | [`tasks/mastra/tasks/000-index.md`](./tasks/000-index.md) |
| Places field-mask checklist (MASTRA-073) | [`tasks/maps/places-mask-checklist.md`](../maps/places-mask-checklist.md) |
| Maps PRD v2 | [`tasks/maps/maps-prd-v2.md`](../maps/maps-prd-v2.md) |
| Maps v2 forensic | [`tasks/maps/07-mapsv2-tasks.md`](../maps/07-mapsv2-tasks.md) |
| Mastra verification audit | [`tasks/audit/archive/mastra-verification-system-audit.md`](../audit/archive/mastra-verification-system-audit.md) |
| Repo todo / gates | [`tasks/todo.md`](../todo.md) |
| Changelog | [`changelog`](../../changelog) — **2026-05-15** verification entry (`floor`, scores, `todo`) |

---

## 9. How to re-verify (copy/paste)

```bash
cd /home/sk/mde && npm run floor
cd /home/sk/mde && node scripts/verify-task-deps.mjs
cd /home/sk/mde/my-mastra-app && npm run typecheck && npm run test
rg "tourist_destinations|MOCK_ATTRACTIONS" my-mastra-app/src/mastra/tools/search-attractions.ts
rg "google/gemini-3" my-mastra-app/src/mastra/agents my-mastra-app/src/mastra/workflows my-mastra-app/src/mastra/scorers
rg "searchGroundedPlaces|StreamableHTTPClientTransport" my-mastra-app/src/mastra
```

---

*Replace narrative-only progress with this table-driven tracker after each merged PR; bump **Last verified**; refresh §2 dots when task frontmatter **or** runtime evidence changes. **`status: Completed`** in task YAML only after `npm run floor` (includes `verify:mastra` → `verify-task-deps`, links, drift heuristics) and `cd my-mastra-app && npm run typecheck && npm run test` when the task touches `my-mastra-app/` — see [`mastra-verification-system-audit.md`](../audit/archive/mastra-verification-system-audit.md) and [`TASK-CITATION-TEMPLATE.md`](./tasks/TASK-CITATION-TEMPLATE.md) §6.*
