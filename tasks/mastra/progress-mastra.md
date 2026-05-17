# Mastra + Maps — Progress Task Tracker

> **Role:** Systems architect · detective reviewer  
> **Last verified:** 2026-05-16 (evening) — **`npm run floor` exit 0** (lint + build + Vitest + `verify:edge` + `verify:mastra`); `npm run test` **222/222** (18 files); `cd my-mastra-app && npm run test` **56/56** (4 files) · Sprint shipped: W5 (supabase db reset exits 0), C5 (/concierge → /chat redirect), C7 (OPEN_EVENT_RESULTS tool-id fix + event format instructions), MASTRA-040 (ai_runs middleware) · commit 9316e39
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
| `lib/models.ts` (**MASTRA-050**) | **Completed (YAML + runtime)** | `my-mastra-app/src/mastra/lib/models.ts`; agents import canonical model IDs |
| `verify-task-deps.mjs` | **Shipped** | `scripts/verify-task-deps.mjs` in `npm run verify:mastra` (DAG check) |
| Grounding Lite MCP | **Partial** | `my-mastra-app/src/mastra/lib/maps-grounding-client.ts` ships MCP client plumbing; **no** `searchGroundedPlaces` agent tool (**MASTRA-049** open) |
| Map ID env (**MASTRA-068**) | **✅ FIXED 2026-05-16** | `VITE_GOOGLE_MAPS_MAP_ID=e50ffcd09fd436de96a02ad2` in Vercel prod; `getGoogleMapsMapId()` in `src/lib/google-maps-map-id.ts`; prod bundle confirmed clean |
| Maps API key (**MASTRA-068 dep**) | **✅ FIXED 2026-05-16** | `VITE_GOOGLE_MAPS_API_KEY` re-added without surrounding quotes; `gm_authFailure` resolved; tiles confirmed in browser |
| `grounding_quota_log` migration | Shipped | `supabase/migrations/20260513103000_grounding_quota_log.sql` (**057**) |
| `places-mask-checklist.md` (**MASTRA-073**) | **v1 shipped** | `tasks/maps/places-mask-checklist.md` — call-site CI grep (**081**) optional |
| `maps_url` + `ai_summary` cols | **Migration shipped** | `supabase/migrations/20260514000100_places_cache_schema.sql` adds cols to `restaurants`, `tourist_destinations`, `events` (**048/067**) |
| `ai_runs` Mastra logger | **✅ Wired** | `ai-runs-middleware.ts` path-scoped to `/chat`; fires after every concierge turn; 500ms cap; no-throw (**040** complete commit 9316e39) |
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

> **74** markdown files with `task_id` or narrative/reference frontmatter (excludes index, PRD, roadmap, forensic checklist, citation template, source inventory). Dot column blends **YAML `status`** with **spot runtime** (§1) — not a substitute for each task’s DoD.

<!-- inventory: n=74; YAML sync spot-check 2026-05-15 — 8 MASTRA maps rows Completed/Complete (046,047,050,053,054,056,057,073) -->

| ID | Task file | Dot | % | YAML `status` | Title |
|----|-----------|-----|---|---------------|-------|
| **MASTRA-003** | [`003-mastra-tool-audit-control-events.md`](./tasks/core/003-mastra-tool-audit-control-events.md) | 🔴 | 0% | Not Started | Mastra Tool Audit And Control Events |
| **MASTRA-004** | [`004-mastra-hybrid-search-tools.md`](./tasks/core/004-mastra-hybrid-search-tools.md) | 🔴 | 0% | Not Started | Mastra Hybrid Search Tools |
| **MASTRA-005** | [`005-mastra-chat-router-concierge.md`](./tasks/mvp/005-mastra-chat-router-concierge.md) | 🔴 | 0% | Not Started | Mastra Chat Router And Concierge MVP |
| **MASTRA-006** | [`006-mastra-real-estate-mvp-agents.md`](./tasks/mvp/006-mastra-real-estate-mvp-agents.md) | 🔴 | 0% | Not Started | Mastra Real Estate MVP Agents |
| **MASTRA-007** | [`007-mastra-events-mvp-runtime.md`](./tasks/mvp/007-mastra-events-mvp-runtime.md) | 🔴 | 0% | Not Started | Mastra Events MVP Runtime |
| **MASTRA-008** | [`008-mastra-restaurants-mvp-discovery.md`](./tasks/mvp/008-mastra-restaurants-mvp-discovery.md) | 🔴 | 0% | Not Started | Mastra Restaurants MVP Discovery |
| **MASTRA-009** | [`009-mastra-ui-dojo-chat-frontend.md`](./tasks/mvp/009-mastra-ui-dojo-chat-frontend.md) | 🔴 | 0% | Not Started | Mastra UI Dojo Chat Frontend — Reference Patterns Only |
| **MASTRA-010** | [`010-mastra-memory-rag-mvp.md`](./tasks/mvp/010-mastra-memory-rag-mvp.md) | 🔴 | 0% | Not Started | Mastra Memory And RAG MVP |
| **MASTRA-011** | [`011-mastra-observability-evals-guardrails.md`](./tasks/mvp/011-mastra-observability-evals-guardrails.md) | 🔴 | 0% | Not Started | Mastra Observability Evals And Guardrails |
| **MASTRA-012** | [`012-mastra-workflow-state-runtime.md`](./tasks/core/012-mastra-workflow-state-runtime.md) | 🔴 | 0% | Not Started | Mastra Workflow State Runtime Supabase Backed MVP |
| **MASTRA-013** | [`013-mastra-tenant-isolation.md`](./tasks/core/013-mastra-tenant-isolation.md) | 🔴 | 0% | Not Started | Mastra Tenant And Organization Isolation |
| **MASTRA-014** | [`014-mastra-ai-rate-limits.md`](./tasks/core/014-mastra-ai-rate-limits.md) | 🔴 | 0% | Not Started | Mastra AI Rate Limits Tokens And Cost Controls |
| **MASTRA-015** | [`015-mastra-tool-registry-system.md`](./tasks/core/015-mastra-tool-registry-system.md) | 🔴 | 0% | Not Started | Mastra Shared Tool Registry And Audit Wrapper |
| **MASTRA-016** | [`016-mastra-streaming-ui-state.md`](./tasks/mvp/016-mastra-streaming-ui-state.md) | 🔴 | 0% | Not Started | Mastra Streaming UI State Contracts |
| **MASTRA-017** | [`017-mastra-workflow-recovery.md`](./tasks/mvp/017-mastra-workflow-recovery.md) | 🔴 | 0% | Not Started | Mastra Workflow Recovery And Dead Letter Handling |
| **MASTRA-018** | [`018-mastra-human-handoff-runtime.md`](./tasks/mvp/018-mastra-human-handoff-runtime.md) | 🔴 | 0% | Not Started | Mastra Human Handoff Runtime |
| **MASTRA-019** | [`019-mastra-client-sdk-integration.md`](./tasks/mvp/019-mastra-client-sdk-integration.md) | 🟡 | 60% | In Progress — 019A ✅ done, 019B ✅ done, 019C ✅ done (production deploy | Mastra Client SDK Integration Layer |
| **MASTRA-020** | [`020-mastra-paperclip-approval-bridge.md`](./tasks/mvp/020-mastra-paperclip-approval-bridge.md) | 🔴 | 0% | Not Started | Mastra Paperclip Approval Bridge |
| **MASTRA-021** | [`021-mastra-vdb-local-remote-reconciliation.md`](./tasks/core/021-mastra-vdb-local-remote-reconciliation.md) | 🔴 | 0% | Not Started | Mastra VDB Local Remote Reconciliation |
| **MASTRA-024** | [`024-mastra-env-secret-boundary.md`](./tasks/core/024-mastra-env-secret-boundary.md) | 🔴 | 0% | Not Started | Mastra Env And Secret Boundary |
| **MASTRA-025** | [`025-mastra-dependency-alias-map.md`](./tasks/core/025-mastra-dependency-alias-map.md) | 🔴 | 0% | Not Started | Mastra Dependency Alias Map |
| **MASTRA-031** | [`031-mastra-editor-prompt-architecture.md`](./tasks/advanced/031-mastra-editor-prompt-architecture.md) | 🔴 | 0% | Not Started | Mastra Editor Prompt Architecture For mdeAI |
| **MASTRA-032** | [`032-mastra-editor-prompt-block-library.md`](./tasks/advanced/032-mastra-editor-prompt-block-library.md) | 🔴 | 0% | Not Started | mdeAI Mastra Prompt Block Library |
| **MASTRA-033** | [`033-mastra-editor-seeding-and-versioning.md`](./tasks/advanced/033-mastra-editor-seeding-and-versioning.md) | 🔴 | 0% | Not Started | Mastra Editor Prompt Seeding And Versioning |
| **MASTRA-034** | [`034-mastra-editor-runtime-preview-and-context.md`](./tasks/advanced/034-mastra-editor-runtime-preview-and-context.md) | 🔴 | 0% | Not Started | Mastra Editor Runtime Preview And Request Context |
| **MASTRA-035** | [`035-mastra-editor-prompt-qa-studio-workflow.md`](./tasks/advanced/035-mastra-editor-prompt-qa-studio-workflow.md) | 🔴 | 0% | Not Started | Mastra Editor Prompt QA And Studio Workflow |
| **MASTRA-036** | [`036-gemini-structured-output-helper.md`](./tasks/advanced/036-gemini-structured-output-helper.md) | 🟡 | 60% | In Progress | Gemini structured-output helper (`callGeminiStructured`) + unblock P3 sponsor functions |
| **MASTRA-037** | [`037-verify-edge-floor-integration.md`](./tasks/advanced/037-verify-edge-floor-integration.md) | 🟡 | 70% | In Review | Wire `verify:edge` into the floor -- fail PRs on edge-function type errors |
| **MASTRA-038** | [`038-mastra-chat-live-smoke-timezone.md`](./tasks/advanced/038-mastra-chat-live-smoke-timezone.md) | 🔴 | 0% | Not Started | Mastra chat Preview smoke — prove the events weekend timezone fix end-to-end |
| **MASTRA-039** | [`039-mastra-chat-production-rollout.md`](./tasks/advanced/039-mastra-chat-production-rollout.md) | 🟥 | 0% | Blocked (depends on MASTRA-038) | Mastra chat Production rollout — flip the flag for real users |
| **MASTRA-040** | [`040-mastra-ai-runs-logging.md`](./tasks/advanced/040-mastra-ai-runs-logging.md) | 🔴 | 0% | Not Started | Mastra agents must write `ai_runs` rows on every invocation |
| **MASTRA-041** | [`041-mastra-search-events-supabase.md`](./tasks/advanced/041-mastra-search-events-supabase.md) | 🟢 | 90% | Functionally Complete — YAML drift (YAML still "Not Started") | Replace `search-events` mock with Supabase-backed query (Bogotá-local-time boundaries) — ✅ shipped in `search-events.ts`; YAML not yet updated |
| **MASTRA-042** | [`042-sponsor-gemini-structured-functions.md`](./tasks/advanced/042-sponsor-gemini-structured-functions.md) | 🟥 | 0% | Blocked — sponsor schema incomplete | Land Gemini structured-output helper foundation (sponsor consumers blocked on schema) |
| **MASTRA-043** | [`043-mastra-geo-production-plan.md`](./tasks/maps/043-mastra-geo-production-plan.md) | 🟡 | 40% | Active | Geo-Chat Production Plan — cards + pins + map sync (master roadmap) |
| **MASTRA-044** | [`044-mastra-deploy-verification.md`](./tasks/advanced/044-mastra-deploy-verification.md) | 🔴 | 0% | Not Started | Deploy Mastra beta — verification checklist |
| **MASTRA-045** | [`045-mastra-smoke-hardening.md`](./tasks/advanced/045-mastra-smoke-hardening.md) | 🔴 | 0% | Not Started | Smoke spec hardening — known-event assertion + pin count + ai_runs check |
| **MASTRA-046** | [`046-mastra-action-schema-validation.md`](./tasks/maps/046-mastra-action-schema-validation.md) | 🟢 | 100% | Completed | normalizeToolOutput — Zod safeParse before ChatAction dispatch |
| **MASTRA-047** | [`047-mastra-map-pin-merge-versioning.md`](./tasks/maps/047-mastra-map-pin-merge-versioning.md) | 🟢 | 100% | Completed | Multi-tool pin merge + action payload versioning (version: 1) |
| **MASTRA-048** | [`048-mastra-maps-enrichment-phase2.md`](./tasks/maps/048-mastra-maps-enrichment-phase2.md) | 🟡 | 65% | YAML Completed (2026-05-14) — schema landed, enrichment script partial | Phase 2 — place_id + maps_url + ai_summary caching — migration shipped; `maps_url`/`ai_summary` cols live; enrichment runtime (`enrich-places.ts`) exists but no CI proof of full population |
| **MASTRA-049** | [`049-mastra-geo-grounding-phase3.md`](./tasks/maps/049-mastra-geo-grounding-phase3.md) | 🔴 | 0% | Not Started | Phase 3 — Intent-gated Maps MCP tool for live geo queries |
| **MASTRA-050** | [`050-mastra-canonical-models-constants.md`](./tasks/maps/050-mastra-canonical-models-constants.md) | 🟢 | 100% | Completed | Canonical model constants — `lib/models.ts` (no more hardcoded strings) |
| **MASTRA-053** | [`053-mastra-wire-search-restaurants.md`](./tasks/maps/053-mastra-wire-search-restaurants.md) | 🟢 | 100% | Completed | Wire search-restaurants.ts to live Supabase (remove mock data) |
| **MASTRA-054** | [`054-mastra-wire-search-attractions.md`](./tasks/maps/054-mastra-wire-search-attractions.md) | 🟢 | 100% | Completed | Wire search-attractions.ts to live Supabase (`tourist_destinations` via pg Pool) |
| **MASTRA-056** | [`056-mastra-grounded-mappincategory.md`](./tasks/maps/056-mastra-grounded-mappincategory.md) | 🟢 | 100% | Complete (shipped in repo) | Add 'grounded' MapPinCategory for Phase 3 grounded place pins |
| **MASTRA-057** | [`057-mastra-grounding-quota-log-migration.md`](./tasks/maps/057-mastra-grounding-quota-log-migration.md) | 🟢 | 100% | Complete | grounding_quota_log Supabase migration + RLS (durable daily quota) |
| **MASTRA-059** | [`059-mastra-google-search-grounding.md`](./tasks/maps/059-mastra-google-search-grounding.md) | 🔴 | 0% | Not Started | Google Search grounding on concierge agent (real-time context) |
| **MASTRA-060** | [`060-mastra-code-execution-budget-agent.md`](./tasks/advanced/060-mastra-code-execution-budget-agent.md) | 🔴 | 0% | Not Started | Code Execution budget agent for price math (separate from concierge) |
| **MASTRA-061** | [`061-mastra-retire-concierge-route.md`](./tasks/maps/061-mastra-retire-concierge-route.md) | 🔴 | 0% | Not Started | Retire /concierge route — redirect to /chat, delete Concierge.tsx |
| **MASTRA-062** | [`062-mastra-wire-route-display.md`](./tasks/maps/062-mastra-wire-route-display.md) | 🔴 | 0% | Not Started | Wire RouteDisplay — OPEN_ROUTE_RESULTS ChatAction + EmbeddedListings + normalizeToolOutput |
| **MASTRA-063** | [`063-mastra-sponsor-schema-foundation.md`](./tasks/advanced/063-mastra-sponsor-schema-foundation.md) | 🔴 | 0% | Not Started | Sponsor schema foundation (missing CREATE TABLE migrations + RLS) |
| **MASTRA-064** | [`064-mastra-sponsor-gemini-edge-functions.md`](./tasks/advanced/064-mastra-sponsor-gemini-edge-functions.md) | 🔴 | 0% | Not Started | Sponsor Gemini edge functions + Deno tests + migrations staged with schema |
| **MASTRA-065** | [`065-mastra-grounded-pins-lite.md`](./tasks/maps/065-mastra-grounded-pins-lite.md) | 🔴 | 0% | Not Started | Grounded Pins Lite — AI-grounded nearby pins around rentals |
| **MASTRA-066** | [`066-mastra-grounding-attribution-component.md`](./tasks/maps/066-mastra-grounding-attribution-component.md) | 🟢 | 100% | Completed | GroundingAttribution — Google Maps Grounding Lite ToS badge |
| **MASTRA-067** | [`067-mastra-places-field-mask-placeuri.md`](./tasks/maps/067-mastra-places-field-mask-placeuri.md) | 🟢 | 100% | Completed (YAML 2026-05-14) — `maps_url` col + migration shipped | Places API (New) field mask — googleMapsLinks.placeUri for maps_url |
| **MASTRA-068** | [`068-mastra-production-map-id.md`](./tasks/maps/068-mastra-production-map-id.md) | 🟢 | 100% | Completed (YAML 2026-05-14) + env fixed 2026-05-16 — `VITE_GOOGLE_MAPS_MAP_ID` set in Vercel prod; quoted-key bug fixed; tiles confirmed live | Production Map ID — AdvancedMarkerElement requirement |
| **MASTRA-069** | [`069-mastra-grounding-lite-telemetry.md`](./tasks/maps/069-mastra-grounding-lite-telemetry.md) | 🔴 | 0% | Not Started | Grounding Lite telemetry — pageSize cap + ai_runs logging |
| **MASTRA-070** | [`070-mastra-contextual-view-defer-ga.md`](./tasks/maps/070-mastra-contextual-view-defer-ga.md) | 🔴 | 0% | Not Started | Contextual View widget — defer until Google GA |
| **MASTRA-071** | [`071-mastra-google-cloud-api-key-ip-restrictions.md`](./tasks/maps/071-mastra-google-cloud-api-key-ip-restrictions.md) | 🔴 | 0% | Not Started | Google Cloud — IP-restrict server Places / Maps API keys |
| **MASTRA-072** | [`072-mastra-grounding-lite-weather-cache.md`](./tasks/maps/072-mastra-grounding-lite-weather-cache.md) | 🔴 | 0% | Not Started | Grounding Lite `lookup_weather` + weather cache |
| **MASTRA-073** | [`073-mastra-places-field-masks-cost-audit.md`](./tasks/maps/places/073-mastra-places-field-masks-cost-audit.md) | 🟢 | 100% | Completed | Places API (New) — field masks + cost audit; [`places-mask-checklist.md`](../maps/places-mask-checklist.md) |
| **MASTRA-074** | [`074-mastra-places-cache-schema-ttl.md`](./tasks/maps/places/074-mastra-places-cache-schema-ttl.md) | 🔴 | 0% | Not Started | Places cache — Supabase schema + TTL strategy |
| **MASTRA-075** | [`075-mastra-places-nearby-rental-show-nearby.md`](./tasks/maps/places/075-mastra-places-nearby-rental-show-nearby.md) | 🔴 | 0% | Not Started | Nearby Search (New) — rental/event “Show nearby” Mastra tool |
| **MASTRA-076** | [`076-mastra-places-details-cache-enrichment.md`](./tasks/maps/places/076-mastra-places-details-cache-enrichment.md) | 🔴 | 0% | Not Started | Place Details (New) — cache + deep venue enrichment |
| **MASTRA-077** | [`077-mastra-places-photos-cards.md`](./tasks/maps/places/077-mastra-places-photos-cards.md) | 🔴 | 0% | Not Started | Place Photos (New) — card thumbnails via media endpoint |
| **MASTRA-078** | [`078-mastra-places-autocomplete-host-venue.md`](./tasks/maps/places/078-mastra-places-autocomplete-host-venue.md) | 🔴 | 0% | Not Started | Place Autocomplete (New) — host / event venue input |
| **MASTRA-079** | [`079-mastra-geocoding-address-fallback.md`](./tasks/maps/079-mastra-geocoding-address-fallback.md) | 🔴 | 0% | Not Started | Geocoding API — fallback for submitted Colombian addresses |
| **MASTRA-080** | [`080-mastra-places-security-quota-controls.md`](./tasks/maps/places/080-mastra-places-security-quota-controls.md) | 🔴 | 0% | Not Started | Places API — security, quota, and runtime billing guards |
| **MASTRA-081** | [`081-mastra-places-test-fixtures-mocks.md`](./tasks/maps/places/081-mastra-places-test-fixtures-mocks.md) | 🔴 | 0% | Not Started | Places API (New) — test fixtures and mocked HTTP responses |
| **MASTRA-083** | [`083-mastra-search-restaurants-integration-tests.md`](./tasks/advanced/083-mastra-search-restaurants-integration-tests.md) | 🔴 | 0% | Not Started | search-restaurants — optional Supabase integration tests |
| **EVT-103** | [`103-ticket-payment-edge-functions-repo-gap.md`](./tasks/advanced/103-ticket-payment-edge-functions-repo-gap.md) | 🔴 | 0% | Not Started | Ticket checkout / payment webhook — not in this repo tree |
| *(20-mastra.md — no `task_id`)* | [`20-mastra.md`](./tasks/20-mastra.md) | 🟢 | 100% | Delivered | Mastra Production Architecture Plan — mdeai.co |
| *(21-mastra-repos-templates.md — no `task_id`)* | [`21-mastra-repos-templates.md`](./tasks/21-mastra-repos-templates.md) | ⚪ | 100% | Reference | Mastra Repos & Templates — mdeAI Reuse Analysis |
| *(22-mastra-repos-extract-tasks.md — no `task_id`)* | [`22-mastra-repos-extract-tasks.md`](./tasks/22-mastra-repos-extract-tasks.md) | ⚪ | 100% | Reference | Mastra Repos — Extract Tasks (per-repo, MVP-tight) |
| *(23-mastra-modules-verified.md — no `task_id`)* | [`23-mastra-modules-verified.md`](./tasks/23-mastra-modules-verified.md) | ⚪ | 100% | Reference | Mastra Modules — Verified Reference Catalogue |

**Gaps in MASTRA numbering:** there are no task files **051**, **052**, **055**, or **058** under `core/`, `mvp/`, `advanced/`, or `maps/` (by design or retired IDs).

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
| **MASTRA-040** | `ai_runs` logging from Mastra agents | 🟡 | 40% | `my-mastra-app/src/mastra/lib/ai-runs.ts` exists (best-effort, 500ms timeout) | Not wired in all agents; no token-count fields | Wire in concierge + rental agents |
| **MASTRA-020** | Paperclip approval bridge | 🔴 | 0% | Task only | No Mastra ↔ Paperclip runtime | Plan-only until staffed |
| **Studio / agents** | Router, concierge, rental, event, weather, ping, eval | 🟡 | ~78% | `mastra dev` / 7 agents registered; server health `{"success":true}` | Eval scorer IDs, memory gaps, anon chat gap | Fix scorer tool names; add rental/event memory |

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
| `ai_runs` in Mastra agents | 🟡 | `ai-runs.ts` exists (best-effort); not wired in all agents (**040**) |
| **Overall Mastra+Maps readiness** | 🟡 **~62–68%** | **13** tasks shipped (up from 8); fixed: 041/048/067/068/074 drift; open: **003/012/013/015/049/040** + ticket fns (**EVT-103**) |

---

## 7. Next 10 actions (ordered, 2026-05-16)

1. **Update MASTRA-041 YAML** — change `status: Not Started` → `Completed` in task file (code has been live since this session). 5-min fix.  
2. **Phase 1 gate: Camila E2E (G1)** — buyer flow ticket purchase → email → QR; blocks Phase 2 entirely.  
3. **049** — `searchGroundedPlacesTool` MCP transport + agent wiring (only P0 Maps gap remaining after 068 is fixed).  
4. **040** — Wire `ai-runs.ts` into concierge + rental agents for full observability.  
5. **062** — `OPEN_ROUTE_RESULTS` + `RouteDisplay` end-to-end from Mastra tool → EmbeddedListings.  
6. **048** completion — run `enrich-places.ts` against production DB; verify `maps_url` populated on ≥50% of restaurants/destinations.  
7. **003 → 012 → 013 → 015** — infrastructure train: tool audit events, workflow state, tenant isolation, registry (per [`000-index`](./tasks/000-index.md)).  
8. **038** — live smoke timezone proof (unblocks **039** production rollout flag flip).  
9. **075** — Nearby Search (New) `show-nearby` Mastra tool (first concrete Places API consumer after **074** schema).  
10. **EVT-103** — ticket payment edge functions repo gap + Phase 1 gate alignment.

**Hygiene (non-blocking):** fix ~30 archive-only WARNs in `verify-task-deps.mjs`; remove `localhost:8080` from Maps API key referrer list before production lock.

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
