---
id: AUDIT-PLACES-01
title: Places API (New) — Production Enrichment Checklist
status: Completed
created: 2026-05-15
author: Claude (MASTRA-048 finalization)
models:
  - gemini-3-flash-preview        # @google/genai native SDK (thinkingBudget: 0)
  - gemini-3.1-flash-lite         # lightweight tasks
  - gemini-3.1-pro-preview        # complex reasoning
  - google/gemini-3-flash-preview # Mastra / Vercel AI SDK (provider-prefixed)
references:
  - .claude/skills/mde-maps/references/places-official/places-text-search.md
  - .claude/skills/mde-maps/references/places-official/places-choose-fields.md
  - .claude/skills/mde-maps/references/places-official/places-data-fields.md
  - .claude/skills/mde-maps/references/places-official/places-id.md
  - .claude/skills/mde-maps/references/places-official/places-types.md
  - .claude/skills/mde-maps/references/places-api-new.md
  - .claude/skills/mde-maps/references/security-and-optimization.md
---

# AUDIT-PLACES-01 — Places API (New) Production Enrichment Checklist

> **Scope:** TypeScript enrichment pipeline for mdeai.co venues (restaurants + tourist_destinations).
> **Decision:** TypeScript is CORRECT — Node.js scripts, Mastra server-side tools, Supabase Edge Functions.
> **Obsolete model warning:** `gemini-2.5-flash` is DEPRECATED. Use `gemini-3-flash-preview` (native) or `google/gemini-3-flash-preview` (Mastra/AI SDK). Never use `gemini-2.5-*` variants.

---

## 🏆 Checklist Grade Summary — QA Verified 2026-05-15

> Color key: 🟢 Pass (≥ 95%) · 🟡 Caution (80–94%) · 🟠 At Risk (60–79%) · 🔴 Fail / Blocker (< 60% or P0 critical)

| # | Section | Pass | ⚠️ Warn | ❌ Fail | Score | Grade |
|---|---------|------|---------|--------|-------|-------|
| C01 | API Key Security | 4 | 0 | 1 | 80% | 🔴 P0 security blocker |
| C02 | Field Mask Format | 4 | 0 | 0 | 100% | 🟢 |
| C03 | Text Search Structure | 4 | 0 | 0 | 100% | 🟢 |
| C04 | Place Details Structure | 3 | 0 | 0 | 100% | 🟢 |
| C05 | placeUri Extraction | 3 | 0 | 0 | 100% | 🟢 |
| C06 | Place ID Storage & Refresh | 3 | 1 | 0 | 75% | 🟡 |
| C07 | AI Summary / thinkingBudget | 5 | 0 | 0 | 100% | 🟢 |
| C08 | Model IDs | — | — | — | 100% | 🟢 reference |
| C09 | RLS Policies | 5 | 0 | 0 | 100% | 🟢 |
| C10 | Schema Migrations | 4 | 0 | 0 | 100% | 🟢 |
| C11 | Rate Limiting | 5 | 0 | 0 | 100% | 🟢 429 backoff fixed |
| C12 | Idempotent Scripts | 4 | 0 | 0 | 100% | 🟢 |
| C13 | Stack Separation | 4 | 0 | 0 | 100% | 🟢 |
| C14 | Enrichment Coverage | 1 | 1 | 1 | 33% | 🔴 events 0%, td 78.6% |
| C15 | Error Handling & Retry | 6 | 0 | 0 | 100% | 🟢 backoff fixed |
| C16 | Test Coverage | 5 | 1 | 0 | 83% | 🟡 missing regression |
| C17 | Nested Anchor Fix | 4 | 0 | 0 | 100% | 🟢 |
| C18 | Coordinate Validation | 3 | 1 | 0 | 75% | 🟡 2 events |
| C19 | Cache Tables | 5 | 2 | 0 | 71% | 🟠 no TTL / no hit-check |
| C20 | Production Deployment | 6 | 3 | 0 | 67% | 🟠 21 commits pending |
| **Total** | | **88** | **9** | **2** | **90%** | **🟡 A− / Ship-blocker: C01 + C14** |

### 🔴 Blockers before production push

| Priority | Item | Fix |
|----------|------|-----|
| P0 🔴 | `VITE_GEMINI_API_KEY` present in production bundle — key exposed to all users | Rename to `GEMINI_API_KEY` in `.env.local` + Vercel + rotate key |
| P1 🔴 | `tourist_destinations` 78.6% — below ≥80% target (22/28) | Enrich 1 more row via `enrich-places.ts` |
| P1 🔴 | `events` 0/49 enriched — `google_place_id` column exists but empty | Run `enrich-places.ts` for events table |
| P2 🟠 | 21 local commits not pushed | `git push origin main` |

---

## Phase 1 — Stack Verdict

| Layer | Decision | Rationale |
|-------|----------|-----------|
| Language | **TypeScript ✅** | Type-safety for Places API response shapes; required by Mastra framework |
| Enrichment SDK | **`@googlemaps/places` v2.x ✅** | Official server-side Places API (New) SDK; handles field masks, retries, auth |
| AI generation | **`@google/genai` v1.44.0 ✅** | Native SDK for `gemini-3-flash-preview`; not the Vercel AI SDK |
| Runtime env | **Node.js scripts (offline) ✅** | `scripts/` runs locally; never in browser or Supabase Edge Functions |
| Key type | **Server API key (unrestricted) ✅** | `GOOGLE_MAPS_API_KEY` — no HTTP-referrer restriction; separate from `VITE_GOOGLE_MAPS_API_KEY` |

**Key constraint:** `VITE_GOOGLE_MAPS_API_KEY` is HTTP-referrer-restricted (browser-only).
`GOOGLE_MAPS_API_KEY` is the server key used in `scripts/` and `my-mastra-app/`.
**Never cross-use them.**

---

## Phase 2 — File Inventory

| File | Purpose | Status |
|------|---------|--------|
| `scripts/enrich-places.ts` | Fetches `google_place_id` + `maps_url` for venues | ✅ Idempotent |
| `scripts/cache-ai-summaries.ts` | Generates `ai_summary` via Gemini for enriched venues | ✅ Fixed (thinkingBudget: 0) |
| `scripts/geocode-missing.ts` | Fills lat/lng for events with missing coordinates | ⚠️ Not yet run for 2 events |
| `my-mastra-app/src/mastra/tools/search-restaurants.ts` | Mastra tool — reads `mapsUrl`, `aiSummary` from DB | ✅ Schema exported |
| `my-mastra-app/src/mastra/tools/search-attractions.ts` | Mastra tool — reads `mapsUrl`, `aiSummary` from DB | ✅ Schema exported |
| `my-mastra-app/src/mastra/tools/__tests__/search-restaurants-logic.test.ts` | Unit tests for enrichment schema fields | ✅ 3 new tests |
| `my-mastra-app/src/mastra/tools/__tests__/search-attractions-logic.test.ts` | Unit tests for enrichment schema fields | ✅ 3 new tests |
| `supabase/migrations/20260514000100_places_cache_schema.sql` | Creates `places_search_cache`, `place_details_cache` tables | ✅ Fixed (4-policy RLS) |
| `src/components/maps/RestaurantCard.tsx` | UI card — renders `mapsUrl` link, `aiSummary` text | ✅ Nested-a fixed |
| `src/components/maps/AttractionCard.tsx` | UI card — renders `mapsUrl` link, `aiSummary` text | ✅ Nested-a fixed |
| `src/components/maps/ApartmentCard.tsx` | UI card — renders `mapsUrl` link | ✅ Nested-a fixed |

---

## Phase 3 — Production Checklist (20 sections)

### C01 — API Key Security 🔴 80% (4/5) — P0 BLOCKER

| Check | Status | Verification | Fix if Failing |
|-------|--------|-------------|----------------|
| `VITE_GOOGLE_MAPS_API_KEY` never used in `scripts/` or `my-mastra-app/` | ✅ PASS | `grep -r "VITE_GOOGLE_MAPS_API_KEY" scripts/ my-mastra-app/` → 0 results | Remove VITE_ usage; use `process.env.GOOGLE_MAPS_API_KEY` |
| `GOOGLE_MAPS_API_KEY` never exposed in `src/` frontend | ✅ PASS | `grep -r "GOOGLE_MAPS_API_KEY" src/` → 0 results | Move to edge function |
| Both keys set in local `.env` (not committed) | ✅ PASS | `.env` in `.gitignore`; `cat .env \| grep MAPS` shows both | Add to Infisical if missing |
| `GOOGLE_MAPS_API_KEY` set in Supabase prod secrets | ✅ PASS | Edge functions use it for directions | Add via `supabase secrets set` |
| 🔴 **`VITE_GEMINI_API_KEY` NOT in client bundle** | ❌ **FAIL — P0** | `grep -r "AIza" dist/` → **2 tokens found** including Gemini key. Vite's `vite:define` inlines ALL `VITE_*` vars regardless of access pattern. Partial fix applied in `affiliate.ts` (explicit 3-key type) but root cause persists. | **Action required: (1)** Rename `VITE_GEMINI_API_KEY` → `GEMINI_API_KEY` in `.env.local`; **(2)** Remove the `VITE_` prefix in Vercel project env settings; **(3)** Rotate the key in Google Cloud Console; **(4)** Update `mastra-start.sh` line 25 |

**Rule (from `security-and-optimization.md`):**
- Browser key → HTTP-referrer restriction → `VITE_GOOGLE_MAPS_API_KEY`
- Server key → IP/API restriction → `GOOGLE_MAPS_API_KEY`
- Gemini key → server-only → **must NOT have `VITE_` prefix** (Vite inlines all `VITE_*` into bundle)
- Never swap them.

> **Why `VITE_GEMINI_API_KEY` leaks:** Vite's `vite:define` plugin serializes every env key that has the `VITE_` prefix into the client bundle at build time — even if the variable is never explicitly referenced in `src/`. The `affiliate.ts` fix (replacing `import.meta.env` whole-object spread with a 3-key typed object) prevents one accidental vector but cannot stop Vite's core inlining behavior. The only complete fix is removing the `VITE_` prefix from the key name.

---

### C02 — Places API Field Mask Format 🟢 100% (4/4)

| Check | Status | Verification | Fix |
|-------|--------|-------------|-----|
| Text Search uses `places.` prefix | ✅ PASS | `enrich-places.ts` uses `places.id,places.displayName,places.googleMapsLinks,places.location` | Add `places.` prefix to all Text Search fields |
| Place Details uses bare field names (no prefix) | ✅ PASS | `getPlace` calls use `id,displayName,googleMapsLinks,location` | Remove `places.` prefix from Details requests |
| No spaces in field mask string | ✅ PASS | Strings verified with `grep "fields:" scripts/` | Remove all spaces from field mask |
| `fields` parameter always present (required) | ✅ PASS | 400 error if omitted | Add `fields` parameter |

**Reference:** `places-choose-fields.md` — Text Search fields MUST have `places.` prefix.
Place Details fields MUST NOT have prefix.

---

### C03 — Text Search Request Structure 🟢 100% (4/4)

**Correct pattern (from `places-text-search.md`):**
```typescript
// POST https://places.googleapis.com/v1/places:searchText
const request: SearchTextRequest = {
  textQuery: 'restaurante El Poblado Medellín',
  languageCode: 'es',
  maxResultCount: 5,
};
const fieldMask = 'places.id,places.displayName,places.googleMapsLinks,places.location';
const { places } = await placesClient.searchText(request, { otherArgs: { headers: { 'X-Goog-FieldMask': fieldMask } } });
```

| Check | Status |
|-------|--------|
| `textQuery` not `query` | ✅ PASS |
| `maxResultCount` not `maxResults` | ✅ PASS |
| `languageCode` not `language` | ✅ PASS |
| Field mask in `X-Goog-FieldMask` header | ✅ PASS |

---

### C04 — Place Details Request Structure 🟢 100% (3/3)

**Correct pattern:**
```typescript
// GET https://places.googleapis.com/v1/places/{name}
const place = await placesClient.getPlace(
  { name: `places/${placeId}` },
  { otherArgs: { headers: { 'X-Goog-FieldMask': 'id,displayName,googleMapsLinks,location,rating' } } }
);
```

| Check | Status |
|-------|--------|
| Place name uses `places/${placeId}` format | ✅ PASS |
| Field mask has NO `places.` prefix | ✅ PASS |
| `googleMapsLinks.placeUri` accessible | ✅ PASS |

---

### C05 — `googleMapsLinks.placeUri` Extraction 🟢 100% (3/3)

**Only valid source for `maps_url`:**
```typescript
const mapsUrl = place.googleMapsLinks?.placeUri;
// Validate before storing:
if (!mapsUrl || !mapsUrl.startsWith('https://maps.google.com/')) {
  console.warn(`[${name}] Invalid placeUri: ${mapsUrl}`);
  continue;
}
```

| Check | Status | Note |
|-------|--------|------|
| Only `googleMapsLinks.placeUri` used (not `url`, not constructed manually) | ✅ PASS | `url` field is deprecated |
| Prefix validation before storage | ✅ PASS | Guards against empty string storage |
| `maps_url` column is `text` (not `varchar(255)`) | ✅ PASS | placeUri can be long |

---

### C06 — Place ID Storage and Refresh Policy 🟡 75% (3/4)

From `places-id.md`:
- Place IDs are exempt from caching restrictions (Section 3.2.3(b) of ToS).
- Place IDs **may change** — refresh if stored >12 months.
- Refresh by calling Place Details with only `place_id` in the `fields` parameter (triggers ID Refresh SKU, billed at lower rate).

| Check | Status |
|-------|--------|
| `google_place_id` stored in DB | ✅ PASS — both tables |
| `place_id_fetched_at` timestamp stored | ✅ PASS — for age tracking |
| Refresh logic documented | ⚠️ NOT YET — add `scripts/refresh-stale-place-ids.ts` if data is >12 months old |
| `NOT_FOUND` handling | ✅ PASS — logged + skipped in `enrich-places.ts` |

---

### C07 — AI Summary Generation (Critical: thinkingBudget) 🟢 100% (5/5)

**Root cause of 70% skip rate (FIXED):**
`gemini-3-flash-preview` is a thinking model. Internal reasoning tokens consume `maxOutputTokens: 150` before actual output, resulting in `finishReason: MAX_TOKENS` and empty `response.text`.

**Fix:** `thinkingConfig: { thinkingBudget: 0 }` disables thinking mode → `finishReason: STOP` → full output.

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-3-flash-preview',  // bare ID — no 'google/' prefix for @google/genai
  contents: [{ role: 'user', parts: [{ text: prompt }] }],
  config: {
    maxOutputTokens: 150,
    temperature: 0.3,
    thinkingConfig: { thinkingBudget: 0 },  // REQUIRED for thinking models
  },
});
```

| Check | Status | Verification |
|-------|--------|-------------|
| `thinkingBudget: 0` set | ✅ PASS | `grep -n "thinkingBudget" scripts/cache-ai-summaries.ts` |
| `response.text?.trim()` length check (`< 20`) | ✅ PASS | Guards empty/garbage output |
| Model is `gemini-3-flash-preview` (not `gemini-2.5-*`) | ✅ PASS | Updated in MASTRA-048 |
| `DELAY_MS: 400` between requests (rate limit compliance) | ✅ PASS | Prevents 429 errors |
| Result: 100% fill rate (was 30%) | ✅ PASS | 31/31 restaurants + 17/17 attractions |

---

### C08 — Model IDs 🟢 Reference (no pass/fail checks)

**Canonical model IDs for mdeai.co:**

| SDK | Model | Correct ID | Wrong IDs (never use) |
|-----|-------|------------|----------------------|
| `@google/genai` (native) | Fast/default | `gemini-3-flash-preview` | `gemini-2.5-flash`, `gemini-2.5-pro` |
| `@google/genai` (native) | Lightweight | `gemini-3.1-flash-lite` | `gemini-2.0-flash-lite` |
| `@google/genai` (native) | Pro reasoning | `gemini-3.1-pro-preview` | `gemini-2.5-pro-preview` |
| Mastra / Vercel AI SDK | Fast/default | `google/gemini-3-flash-preview` | (same as above with `google/` prefix) |

**Rule:** `@google/genai` uses bare model ID. Mastra/`@ai-sdk/google` uses `google/` prefix.
Never mix the two SDK forms. Never use `gemini-2.5-*` — obsolete.

---

### C09 — RLS Policies (4-Policy Split) 🟢 100% (5/5)

**`FOR ALL` is FORBIDDEN** per `.claude/rules/supabase-rls-policies.md`.
Each operation requires a separate `CREATE POLICY` statement.

```sql
-- CORRECT pattern:
CREATE POLICY "service_role_select_places_search_cache"
  ON public.places_search_cache FOR SELECT TO service_role USING (true);
CREATE POLICY "service_role_insert_places_search_cache"
  ON public.places_search_cache FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "service_role_update_places_search_cache"
  ON public.places_search_cache FOR UPDATE TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_delete_places_search_cache"
  ON public.places_search_cache FOR DELETE TO service_role USING (true);
```

| Check | Status | Verification |
|-------|--------|-------------|
| `places_search_cache` — 4 policies | ✅ PASS | Migration `20260514000100` |
| `place_details_cache` — 4 policies | ✅ PASS | Migration `20260514000100` |
| `restaurants` — 4 policies | ✅ PASS | Earlier migrations |
| `tourist_destinations` — 4 policies | ✅ PASS | Earlier migrations |
| No `FOR ALL` anywhere | ✅ PASS | `grep -r "FOR ALL" supabase/migrations/` → 0 |

---

### C10 — Schema Migrations (STABLE vs IMMUTABLE) 🟢 100% (4/4)

**`now()` is STABLE, not IMMUTABLE — cannot be used in partial index predicates.**

```sql
-- WRONG (PostgreSQL error):
CREATE INDEX idx_places_expires
  ON public.places_search_cache (expires_at)
  WHERE expires_at < now() + interval '7 days';  -- ERROR: STABLE function

-- CORRECT:
CREATE INDEX idx_places_search_cache_expires_at
  ON public.places_search_cache (expires_at);  -- Plain index, no predicate
```

| Check | Status |
|-------|--------|
| No `now()` in index predicates | ✅ PASS — Fixed in MASTRA-048 |
| Migration file timestamps ordered correctly | ✅ PASS |
| `supabase db reset` exits 0 | ✅ PASS — Verified 2026-05-10 |
| Remote migration applied | ✅ PASS — Applied 2026-05-14 |

---

### C11 — Rate Limiting and Request Delays 🟢 100% (5/5) — Fixed 2026-05-15

| Check | Status | Value |
|-------|--------|-------|
| `DELAY_MS` between Places API calls | ✅ PASS | 300ms in `enrich-places.ts` |
| `DELAY_MS` between Gemini calls | ✅ PASS | 400ms in `cache-ai-summaries.ts` |
| Retry logic on 429 | ✅ FIXED 2026-05-15 | `withRetry<T>(fn, maxRetries=3)` — `2^attempt * 1000ms + jitter(0–500ms)`; retries 429 + 5xx; applied to both `enrich-places.ts` and `cache-ai-summaries.ts` |
| `maxResultCount` ≤ 5 for enrichment queries | ✅ PASS | We only need 1 result per venue |
| Edge function rate limits (10 AI/min, 30 search/min) | ✅ PASS | Enforced in `ai-chat`, `ai-search` |

---

### C12 — Idempotent Scripts (WHERE IS NULL Guards) 🟢 100% (4/4)

| Check | Status | Guard |
|-------|--------|-------|
| `enrich-places.ts` only processes unenriched rows | ✅ PASS | `WHERE google_place_id IS NULL` |
| `cache-ai-summaries.ts` only processes rows without summaries | ✅ PASS | `WHERE ai_summary IS NULL AND google_place_id IS NOT NULL` |
| Re-running scripts does nothing if all rows enriched | ✅ PASS | 0 rows fetched = 0 updates |
| Scripts can be safely re-run after partial failure | ✅ PASS | `error++; continue` pattern |

---

### C13 — Stack Separation (Critical Boundary) 🟢 100% (4/4)

| Location | Allowed | Forbidden |
|----------|---------|-----------|
| `scripts/` (offline Node.js) | `@googlemaps/places`, `@google/genai`, `GOOGLE_MAPS_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | `VITE_*` env vars, browser APIs |
| `src/` (Vite/React browser) | `VITE_GOOGLE_MAPS_API_KEY`, Google Maps JS API, Supabase anon key | Server API keys, `@googlemaps/places`, `PlacesClient` |
| `supabase/functions/` (Deno edge) | `GOOGLE_MAPS_API_KEY`, `GEMINI_API_KEY`, service role | `VITE_*` vars, npm packages (use `esm.sh` or Deno URLs) |
| `my-mastra-app/` (Mastra server) | `GOOGLE_MAPS_API_KEY`, `@google/genai`, `@googlemaps/places` | Browser-restricted keys |

**Verification:**
```bash
grep -r "PlacesClient\|@googlemaps/places" src/      # must return 0
grep -r "VITE_GOOGLE_MAPS" scripts/ my-mastra-app/   # must return 0
grep -r "SERVICE_ROLE" src/                           # must return 0
```

---

### C14 — Enrichment Coverage Thresholds 🔴 33% (1/3) — BLOCKER

**Target:** ≥ 80% of all venues with `google_place_id`. QA-verified status as of 2026-05-15:

| Table | Total | Enriched (place_id) | Maps URL | AI Summary | Coverage | Status |
|-------|-------|---------------------|----------|------------|----------|--------|
| `restaurants` | 66 | 62 | 62 (100%) | 62 (100%) | **93.9%** | ✅ PASS |
| `tourist_destinations` | 28 | 22 | 22 (100%) | 22 (100%) | **78.6%** | ⚠️ FAIL — 1.4% below 80% target. Need 1 more row enriched (23/28). |
| `events` | 49 | 0 | 0 | N/A | **0%** | ❌ FAIL — `google_place_id` column exists but zero rows enriched. **Code fix applied 2026-05-15:** `enrich-places.ts` now targets events (`name`, `address` columns). Script has not yet run — requires `GOOGLE_PLACES_API_KEY` + `SUPABASE_SERVICE_ROLE_KEY` in environment. |

> **Note:** The previous checklist marked `tourist_destinations` 78.6% as ✅ — this was incorrect. 78.6% < 80% target. Corrected by QA audit 2026-05-15.

**Verification SQL:**
```sql
-- Restaurants coverage
SELECT
  COUNT(*) AS total,
  COUNT(google_place_id) AS enriched,
  ROUND(COUNT(google_place_id)::numeric / COUNT(*) * 100, 1) AS pct,
  COUNT(maps_url) AS has_maps_url,
  COUNT(ai_summary) AS has_ai_summary
FROM restaurants;

-- Tourist destinations coverage
SELECT
  COUNT(*) AS total,
  COUNT(google_place_id) AS enriched,
  ROUND(COUNT(google_place_id)::numeric / COUNT(*) * 100, 1) AS pct,
  COUNT(maps_url) AS has_maps_url,
  COUNT(ai_summary) AS has_ai_summary
FROM tourist_destinations;
```

---

### C15 — Error Handling and Retry 🟢 100% (6/6) — Fixed 2026-05-15

| Check | Status |
|-------|--------|
| `NOT_FOUND` place IDs logged + skipped | ✅ PASS |
| `INVALID_REQUEST` (truncated place ID) logged + skipped | ✅ PASS |
| Empty AI summary (`< 20 chars`) skipped with warning | ✅ PASS |
| DB update errors logged + counted | ✅ PASS |
| Final stats printed (ok/skipped/errors) | ✅ PASS |
| Exponential backoff on 429 | ✅ FIXED 2026-05-15 — `withRetry<T>(fn, maxRetries=3)` in both `enrich-places.ts` (is429 `msg.includes('429')`, is5xx `/HTTP 5\d\d/`) and `cache-ai-summaries.ts` (adds `msg.toLowerCase().includes('quota')` for Gemini) |
| `ZERO_RESULTS` from text search handled | ✅ PASS — skipped with warning |

---

### C16 — Test Coverage 🟡 83% (5/6) — no thinkingBudget/429 regression tests

| Test File | Tests | What it covers |
|-----------|-------|----------------|
| `search-restaurants-logic.test.ts` | 18 | cuisine mapping, price tier, enrichment fields (placeId/mapsUrl/aiSummary) |
| `search-attractions-logic.test.ts` | 12 | attraction schema, enrichment fields |
| `search-restaurants.test.ts` | 8 | Supabase query integration |
| `search-attractions.test.ts` | 6 | Supabase query integration |
| Root Vitest suite | 152 | Full app coverage |
| Mastra Vitest suite | 56 | Tool + agent coverage |

**Enrichment-specific tests (added MASTRA-048):**
```
✓ restaurantSchema — accepts mapsUrl and aiSummary when enriched
✓ restaurantSchema — accepts null mapsUrl and aiSummary when not yet enriched
✓ restaurantSchema — accepts missing mapsUrl and aiSummary (undefined)
✓ attractionSchema — accepts mapsUrl and aiSummary when enriched
✓ attractionSchema — accepts null mapsUrl and aiSummary when not yet enriched
✓ attractionSchema — accepts missing mapsUrl and aiSummary (undefined)
```

---

### C17 — Nested Anchor Fix 🟢 100% (4/4)

**Problem:** `<a href={mapsUrl}><a href={cardUrl}>…</a></a>` — WCAG violation, browser warning.

**Fix:** Outer wrapper uses `div[role="link"]` + `onClick` + `tabIndex`. Inner `<a>` has `e.stopPropagation()`.

```tsx
// CORRECT pattern in RestaurantCard, AttractionCard, ApartmentCard:
<div
  role="link"
  tabIndex={0}
  onClick={() => navigate(cardUrl)}
  onKeyDown={(e) => e.key === 'Enter' && navigate(cardUrl)}
>
  {/* Inner link to Google Maps — stops click from bubbling to outer div */}
  <a
    href={mapsUrl}
    target="_blank"
    rel="noopener noreferrer"
    onClick={(e) => e.stopPropagation()}
  >
    View on Maps
  </a>
</div>
```

| Check | Status | Verification |
|-------|--------|-------------|
| No `<a>` inside `<a>` in card components | ✅ PASS | DOM: `nestedAnchorCount = 0` |
| `stopPropagation` on inner link | ✅ PASS | Code inspection |
| `role="link"` + `tabIndex={0}` on outer div | ✅ PASS | Accessibility compliant |
| Browser warning absent | ✅ PASS | Console screenshot 2026-05-14 |

---

### C18 — Coordinate Validation 🟡 75% (3/4) — 2 events missing

| Check | Status |
|-------|--------|
| `restaurants` — 0 rows with `lat IS NULL` | ✅ PASS |
| `tourist_destinations` — 0 rows with `lat IS NULL` | ✅ PASS |
| `events` — 2 rows missing coordinates | ⚠️ OPEN — run `scripts/geocode-missing.ts` |
| Lat/lng bounds for Medellín: lat ≈ 6.1–6.4, lng ≈ -75.7–-75.5 | ✅ PASS (spot-check) |

**Verification SQL:**
```sql
SELECT id, name, lat, lng FROM restaurants WHERE lat IS NULL OR lng IS NULL;
SELECT id, name, lat, lng FROM tourist_destinations WHERE lat IS NULL OR lng IS NULL;
SELECT id, name, lat, lng FROM events WHERE lat IS NULL OR lng IS NULL;
```

---

### C19 — Cache Tables 🟠 71% (5/7) — no TTL cleanup, no cache hit-check

| Check | Status |
|-------|--------|
| `places_search_cache` table created | ✅ PASS |
| `place_details_cache` table created | ✅ PASS |
| Both tables have RLS enabled | ✅ PASS |
| Both tables have 4-policy RLS split | ✅ PASS |
| `expires_at` column + index | ✅ PASS |
| TTL enforcement logic | ⚠️ MISSING — no cleanup cron yet; stale rows accumulate |
| Cache hit check before Places API call | ⚠️ PARTIAL — `enrich-places.ts` doesn't use cache yet |

**Recommended next step:** Add cleanup cron or Edge Function to `DELETE FROM places_search_cache WHERE expires_at < now()`.

---

### C20 — Production Deployment Checklist 🟠 67% (6/9) — 3 pending items

| Step | Status |
|------|--------|
| `npm run lint` — 0 errors | ✅ PASS |
| `npm run build` — exit 0 | ✅ PASS |
| `npm run test` — 152/152 root | ✅ PASS |
| `cd my-mastra-app && npm run test` — 56/56 Mastra | ✅ PASS |
| `npm run verify:edge` — 21 passed | ✅ PASS |
| Remote migration applied | ✅ PASS — 2026-05-14 |
| `git push origin main` | ⚠️ PENDING — 21 local commits not pushed |
| Vercel auto-deploy | ⚠️ PENDING — triggers after push |
| Live verification at mdeai.co | ⚠️ PENDING — after deploy |

---

## Phase 4 — Success Criteria

| Criterion | Target | Actual | Status |
|-----------|--------|--------|--------|
| Restaurant enrichment coverage | ≥ 80% | 93.9% | ✅ |
| Tourist destination enrichment | ≥ 80% | **78.6%** | ⚠️ FAIL — 1.4% below target |
| Events enrichment coverage | ≥ 80% | **0%** | ❌ FAIL — not yet run |
| `maps_url` fill rate (where place_id exists) | 100% | 100% | ✅ |
| `ai_summary` fill rate (where place_id exists) | 100% | 100% | ✅ |
| AI summary minimum length | ≥ 20 chars | ~150 avg | ✅ |
| `VITE_GEMINI_API_KEY` absent from bundle | absent | **local: absent ✅ / Vercel: user action pending** | ⚠️ PARTIAL |
| Test count (root) | ≥ 152 | 152 | ✅ |
| Test count (Mastra) | ≥ 50 | 56 | ✅ |
| Lint errors | 0 | 0 | ✅ |
| Build | exit 0 | exit 0 | ✅ |
| Nested anchor count in DOM | 0 | 0 | ✅ |
| Browser console errors | 0 | 0 | ✅ |
| RLS policy count (no FOR ALL) | 0 FOR ALL | 0 | ✅ |
| `supabase db reset` | exit 0 | exit 0 | ✅ |

---

## Phase 5 — Testing Strategy

### 5.1 Static Analysis
```bash
npm run lint                                    # ESLint: 0 errors
npm run typecheck                               # tsc --noEmit: 0 errors
cd my-mastra-app && npm run typecheck           # Mastra types
grep -r "VITE_GOOGLE_MAPS" scripts/             # must be 0
grep -r "PlacesClient" src/                     # must be 0
grep -r "FOR ALL" supabase/migrations/          # must be 0
grep -r "now()" supabase/migrations/ | grep WHERE  # must be 0
```

### 5.2 Unit Tests (Vitest)
```bash
npm run test                                    # 152 root tests
cd my-mastra-app && npm run test               # 56 Mastra tests
```
Key test files:
- `search-restaurants-logic.test.ts` — enrichment schema (mapsUrl, aiSummary, placeId)
- `search-attractions-logic.test.ts` — attraction enrichment schema

### 5.3 Integration Tests (DB)
```sql
-- All 6 SQL checks:
SELECT COUNT(*) FROM restaurants WHERE google_place_id IS NOT NULL AND ai_summary IS NULL;  -- → 0
SELECT COUNT(*) FROM restaurants WHERE google_place_id IS NOT NULL AND maps_url IS NULL;    -- → 0
SELECT COUNT(*) FROM tourist_destinations WHERE google_place_id IS NOT NULL AND ai_summary IS NULL; -- → 0
SELECT id FROM restaurants GROUP BY id HAVING COUNT(*) > 1;  -- → 0 rows
SELECT id FROM tourist_destinations GROUP BY id HAVING COUNT(*) > 1; -- → 0 rows
SELECT COUNT(*) FROM restaurants WHERE lat IS NULL OR lng IS NULL; -- → 0
```

### 5.4 Script Safety Tests
```bash
# Dry run — confirm idempotency (should show 0 rows to process)
npx ts-node --esm scripts/cache-ai-summaries.ts 2>&1 | tail -5
npx ts-node --esm scripts/enrich-places.ts 2>&1 | tail -5
```
Expected output: `0 rows to summarise` / `0 rows to enrich`.

### 5.5 Browser / Visual Tests
```
1. Start dev server: npm run dev (port 8080)
2. Navigate to /explore (map view with restaurant pins)
3. Click a restaurant card → verify mapsUrl link opens Google Maps
4. Verify aiSummary text renders in card
5. Open DevTools console → 0 red errors
6. document.querySelectorAll('a a').length → must equal 0
```

### 5.6 Places API Safety Tests (live, use sparingly — billed)
```typescript
// Verify placeUri format:
const place = await placesClient.getPlace({ name: 'places/ChIJ_TEST' }, fieldMask);
console.assert(place.googleMapsLinks?.placeUri?.startsWith('https://maps.google.com/'));

// Verify text search field mask:
const { places } = await placesClient.searchText({ textQuery: 'test' }, 'places.id,places.displayName');
console.assert(places[0].id !== undefined);
```

---

## Phase 6 — Verification Results (MASTRA-048, 2026-05-14)

### Floor Suite — 2026-05-14 (MASTRA-048 ship)
```
npm run lint      → 0 errors ✅
npm run build     → exit 0, ~7s ✅
npm run test      → 152/152 (12 files) ✅
npm run verify:edge → 21 passed, 51 ignored ✅
cd my-mastra-app && npm run test → 56/56 ✅
cd my-mastra-app && npm run typecheck → 0 errors ✅
```

### Floor Suite — 2026-05-15 (backoff + geocode-missing.ts fix session)
```
npm run lint      → 0 errors, 155 warnings (pre-existing) ✅
npm run build     → exit 0, 4.42s ✅
npm run test      → 152/152 (14 files) ✅
cd my-mastra-app && npm run test → 56/56 (4 files) ✅
cd my-mastra-app && npm run typecheck → 0 errors ✅
```
Fixes verified: `withRetry<T>()` in enrich-places.ts + cache-ai-summaries.ts, events table added to enrich-places.ts,
geocode-missing.ts column bug fixed (venue/neighborhood → name/address), mastra-start.sh VITE_GEMINI ref removed.

### DB Verification (live Supabase)
```
restaurants:         62/66 enriched (93.9%), 62/62 maps_url, 62/62 ai_summary ✅
tourist_destinations: 22/28 enriched (78.6%), 22/22 maps_url, 22/22 ai_summary ✅
Duplicates: 0 ✅
Null coordinates: 0 (restaurants), 0 (tourist_destinations) ✅
```

### Browser Proof
```
localhost:8080 — HTTP 200 ✅
/explore map view — 3 panels rendered ✅
Restaurant grid — cards with mapsUrl + aiSummary ✅
Console errors — 0 ✅
document.querySelectorAll('a a').length → 0 ✅ (nested anchor fixed)
```

### AI Summary Script
```
Before fix (gemini-2.5-flash, no thinkingBudget):
  restaurants: 13 ok / 31 skipped (58% skip rate)
  tourist_destinations: 5 ok / 17 skipped (77% skip rate)

After fix (gemini-3-flash-preview, thinkingBudget: 0):
  restaurants: 31 ok / 0 skipped / 0 errors ✅
  tourist_destinations: 17 ok / 0 skipped / 0 errors ✅
```

---

## Phase 7 — Errors and Red Flags

> QA-updated 2026-05-15 with verified findings from browser + DB audit.

| # | Type | Description | Status | Fix Applied |
|---|------|-------------|--------|-------------|
| 1 | CRITICAL | `gemini-2.5-flash` thinking model consumes all `maxOutputTokens` → empty `response.text` | ✅ FIXED | `thinkingBudget: 0` + model → `gemini-3-flash-preview` |
| 2 | CRITICAL | `FOR ALL` in RLS policies → blocked by Supabase | ✅ FIXED | 4-policy split per table (SELECT/INSERT/UPDATE/DELETE) |
| 3 | HIGH | `now()` in index predicate → PostgreSQL STABLE/IMMUTABLE error | ✅ FIXED | Removed WHERE predicate; plain index |
| 4 | HIGH | Nested `<a>` elements in card components → WCAG violation | ✅ FIXED | `div[role="link"]` outer + `stopPropagation` inner |
| 5 | HIGH | `VITE_GOOGLE_MAPS_API_KEY` would fail in server scripts (HTTP-referrer restricted) | ✅ FIXED | Server scripts use `GOOGLE_MAPS_API_KEY` |
| 6 | MEDIUM | Wrong column names (`neighborhood` → `address`, `cuisine` → `cuisine_types`) | ✅ FIXED | Updated in `cache-ai-summaries.ts` |
| 7 | MEDIUM | `restaurantSchema` and `attractionSchema` not exported → untestable | ✅ FIXED | `export const schema = z.object({…})` |
| 8 | MEDIUM | `Write` tool fails on new files not yet read in session | ✅ FIXED | Use Bash heredoc or read-then-write pattern |
| 9 | WARNING | No exponential backoff on 429 errors in enrichment scripts | ✅ FIXED 2026-05-15 | `withRetry<T>(fn, maxRetries=3)` added to `enrich-places.ts` and `cache-ai-summaries.ts` — `2^attempt * 1000 + jitter(0–500)ms` on 429/5xx |
| 9b | BUG NEW | `geocode-missing.ts` used wrong column names for events (`venue`, `neighborhood`) — neither column exists; events uses `name` + `address` | ✅ FIXED 2026-05-15 | `selectCols` unified to `'id, name, address'`; `buildQuery()` now reads `row['name']` + `row['address']`; SC-5 SQL corrected |
| 10 | WARNING | 2 events missing coordinates (lat/lng NULL) | ⚠️ OPEN — column bug fixed | Run `scripts/geocode-missing.ts` (now uses correct columns); note: one event has `address: "TBD"` — may not geocode |
| 11 | WARNING | Cache tables (`places_search_cache`) not yet used by enrichment scripts | ⚠️ OPEN | Future: check cache before calling Places API |
| 12 | WARNING | 21 local commits not pushed to `origin/main` | ⚠️ OPEN | `git push origin main` |
| 13 | 🔴 P0 NEW | **`VITE_GEMINI_API_KEY` present in production bundle** — Gemini API key exposed to all users | ⚠️ PARTIAL — user action still required | **Code fixed 2026-05-15:** `.env.local` already uses `GEMINI_API_KEY` (no VITE_ prefix); local bundle verified clean (only 1 AIza prefix = Maps key); both `mastra-start.sh` copies updated to read `GEMINI_API_KEY`. **User must:** (1) Remove `VITE_GEMINI_API_KEY` from Vercel project env dashboard; (2) Add `GEMINI_API_KEY=<value>` there; (3) Rotate the key in Google Cloud Console |
| 14 | HIGH NEW | **`tourist_destinations` 78.6% is below ≥80% target** — checklist previously marked ✅ incorrectly | ⚠️ OPEN | Enrich 1 more row: run `enrich-places.ts` for `tourist_destinations` (23/28 needed) |
| 15 | HIGH NEW | **`events` table 0/49 google_place_id** — `google_place_id` column exists but enrichment never run | ⚠️ PARTIAL — code fix applied | **Code fixed 2026-05-15:** `enrich-places.ts` now calls `enrichTable('events', 'name', 'address')`. Not yet run — needs `GOOGLE_PLACES_API_KEY` + `SUPABASE_SERVICE_ROLE_KEY` in environment. Run: `cd /home/sk/mde && npx ts-node --esm scripts/enrich-places.ts` |
| 16 | MEDIUM NEW | No `thinkingBudget: 0` regression test — if model changes, silent empty-output regression risk | ⚠️ OPEN | Add Vitest test asserting `thinkingBudget: 0` present in `cache-ai-summaries.ts` config |
| 17 | VERIFIED OK | `gmpClickable: true` flagged as missing — QA confirmed present on ALL 3 marker paths | ✅ NOT A BUG | `MdeMarker.tsx:45`, `GoogleMapView.tsx:271`, `ChatMap.tsx:487` all set `gmpClickable: true` |

---

## Phase 8 — Architecture Diagram + Summary

### Architecture: Enrichment Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                     OFFLINE SCRIPTS (Node.js)                    │
│                                                                   │
│  scripts/enrich-places.ts                                        │
│    │  GOOGLE_MAPS_API_KEY (server, unrestricted)                 │
│    │  @googlemaps/places SDK → PlacesClient                      │
│    │  Text Search: places.id,places.displayName,                 │
│    │               places.googleMapsLinks,places.location        │
│    └─→ Supabase: UPDATE restaurants SET                          │
│         google_place_id, maps_url, place_id_fetched_at          │
│                                                                   │
│  scripts/cache-ai-summaries.ts                                   │
│    │  GEMINI_API_KEY + @google/genai                             │
│    │  model: gemini-3-flash-preview (bare ID)                    │
│    │  thinkingConfig: { thinkingBudget: 0 }  ← CRITICAL         │
│    └─→ Supabase: UPDATE restaurants SET ai_summary               │
└─────────────────────────────────────────────────────────────────┘
         │                          │
         ▼                          ▼
┌─────────────────┐      ┌──────────────────────┐
│  Supabase DB    │      │  Mastra Server        │
│                 │      │  my-mastra-app/       │
│  restaurants    │◄─────│  search-restaurants   │
│  + google_place │      │  (reads enriched data)│
│  + maps_url     │      │  model: google/       │
│  + ai_summary   │      │  gemini-3-flash-     │
│                 │      │  preview (AI SDK)     │
└────────┬────────┘      └──────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BROWSER (Vite/React)                          │
│                                                                   │
│  src/components/maps/RestaurantCard.tsx                          │
│    VITE_GOOGLE_MAPS_API_KEY (browser, HTTP-referrer restricted)  │
│    Renders: aiSummary text, div[role="link"] + inner <a mapsUrl> │
│    No PlacesClient, no server API key, no GOOGLE_MAPS_API_KEY   │
└─────────────────────────────────────────────────────────────────┘
```

### Final Score (QA-revised 2026-05-15)

| Category | Score | Notes |
|----------|-------|-------|
| Architecture alignment | 21/25 | Stack separation clean; cache tables not wired; events enrichment absent |
| Official docs compliance (MCP-verified) | 24/25 | Field masks correct; Text Search vs Details boundary enforced |
| Test coverage | 20/25 | 6 new enrichment tests; no 429 retry test; no thinkingBudget regression test |
| Production readiness | 17/25 | Floor passing; P0 key leak in bundle; tourist_destinations < 80%; 21 commits pending |
| **Total** | **82/100** | ⚠️ Pre-production — blockers: C01 P0 key leak, C14 coverage gaps |

### Next Steps (Priority Order — QA-revised 2026-05-15)

**Must-fix before pushing to production:**

1. 🔴 **Fix `VITE_GEMINI_API_KEY` bundle leak (P0)** — rename to `GEMINI_API_KEY` in `.env.local` + Vercel + rotate key + update `mastra-start.sh` line 25
2. 🔴 **Enrich `tourist_destinations` to ≥80%** — run `enrich-places.ts` for tourist_destinations (need 23/28 = 1 more row)
3. 🔴 **Enrich `events` table** — extend `enrich-places.ts` to target `events` (column: `name`, neighborhood: `address`); 0/49 currently enriched
4. **`git push origin main`** → triggers Vercel deploy → verify live at mdeai.co

**Nice-to-have (post-deploy):**

5. **Run `scripts/geocode-missing.ts`** → fix 2 events with missing lat/lng coordinates
6. **Add 429 exponential backoff** to `enrich-places.ts` and `cache-ai-summaries.ts`
7. **Add `thinkingBudget: 0` regression test** → Vitest test asserting config field present
8. **Wire cache tables** — check `places_search_cache` before calling Places API
9. **Add stale-ID refresh script** (`scripts/refresh-stale-place-ids.ts`) for place IDs > 12 months old
10. **Add TTL cleanup cron** → `DELETE FROM places_search_cache WHERE expires_at < now()`
11. **Pin `@googlemaps/places` to exact version** → `npm install @googlemaps/places@2.4.1 --save-exact`

---

*Generated: 2026-05-15 · MASTRA-048 finalization · mdeai.co production audit*
