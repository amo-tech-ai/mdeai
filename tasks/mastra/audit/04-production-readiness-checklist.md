# 04 — Google Maps Production Readiness Checklist

> **Purpose:** 10-point scoring rubric (each item worth 10 pts, max 100) for the Maps + Enrichment + AI pipeline.  
> **Created:** 2026-05-15 · MCP-verified against Google Maps Platform docs, Gemini API docs, and Supabase MCP.  
> **Last scored:** 2026-05-15

---

## Overall Score: 61 / 100

| # | Category | Score | Status |
|---|----------|-------|--------|
| 1 | API Key Security | 6/10 | ⚠️ PARTIAL |
| 2 | Enrichment Coverage | 4/10 | ⚠️ PARTIAL |
| 3 | 429 Retry / Backoff | 10/10 | ✅ DONE |
| 4 | Places API Field Masks | 10/10 | ✅ DONE |
| 5 | Cache Layer Wiring | 2/10 | 🔴 OPEN |
| 6 | Marker Accessibility | 9/10 | ✅ DONE |
| 7 | ChatMap / MdeMap Consolidation | 7/10 | ⚠️ PARTIAL |
| 8 | Maps Grounding (Gemini) | 0/10 | 🔴 OPEN |
| 9 | Production Deploy | 4/10 | ⚠️ PARTIAL |
| 10 | Test Coverage | 9/10 | ✅ DONE |

---

## 1. API Key Security — 6 / 10

**What it guards:** Prevents Gemini API key from being exposed in the client-side JS bundle and abused.

### Scoring breakdown

| Check | Status | Points |
|-------|--------|--------|
| `VITE_GEMINI_API_KEY` removed from Vercel env vars | ⚠️ OPEN | +0 |
| `GEMINI_API_KEY` (no VITE_ prefix) added to Supabase secrets | ⚠️ OPEN | +0 |
| `mastra-start.sh` no longer checks for `VITE_GEMINI_API_KEY` | ✅ Fixed 2026-05-15 | +2 |
| Gemini key rotated in Google Cloud Console after exposure | ⚠️ OPEN | +0 |
| Maps JS API browser key has HTTP-referrer restrictions set | ✅ (assumed from prior audit) | +2 |
| Server key (Places/Geocoding/Routes) has IP restrictions set | ✅ (assumed from prior audit) | +2 |

### What to do to reach 10/10

```bash
# Step 1: Vercel dashboard → Environment Variables
# Remove: VITE_GEMINI_API_KEY
# Add:    GEMINI_API_KEY = <same value>
# Scope: Production + Preview

# Step 2: Supabase dashboard → Edge Functions → Secrets
# Confirm: GEMINI_API_KEY is set (edge functions read it directly, not VITE_)

# Step 3: Google Cloud Console → APIs & Services → Credentials
# Rotate the exposed key — create new key, update Vercel + Supabase, delete old

# Step 4: Redeploy (Vercel auto-deploys on env var save)
```

**Official docs:**  
- https://cloud.google.com/maps-platform/billing  
- https://vercel.com/docs/environment-variables  

---

## 2. Enrichment Coverage — 4 / 10

**What it guards:** `mapsUrl` and `aiSummary` show on event/destination cards. Cards show fallbacks ("View on Maps", blank summary) when not enriched.

### Scoring breakdown

| Table | place_id coverage | Score |
|-------|-------------------|-------|
| restaurants | 100% (all enriched) | +4 |
| tourist_destinations | 78.6% (22/28) — below 80% gate | +0 |
| events | ~0% (0/49) | +0 |

**Total: 4/10** (only restaurants fully pass)

### What to do to reach 10/10

```bash
# Requires env vars: GOOGLE_PLACES_API_KEY and SUPABASE_SERVICE_ROLE_KEY

# 1. Enrich events (0 → ~40+)
npx ts-node --esm scripts/enrich-places.ts

# 2. Enrich tourist_destinations to push past 80%
# The script runs all tables; re-run if the first pass was partial

# 3. Verify coverage after run:
# In Supabase SQL editor:
SELECT 
  'tourist_destinations' as tbl,
  COUNT(*) FILTER (WHERE google_place_id IS NOT NULL)::float / COUNT(*) * 100 as pct
FROM tourist_destinations
UNION ALL
SELECT 'events', 
  COUNT(*) FILTER (WHERE google_place_id IS NOT NULL)::float / COUNT(*) * 100
FROM events;
```

**Gate:** tourist_destinations ≥ 80% AND events ≥ 80% → +10

---

## 3. 429 Retry / Backoff — 10 / 10 ✅

**What it guards:** Transient Google API quota errors don't silently drop enrichment rows.

### Evidence

- `withRetry<T>(fn, maxRetries=3)` present in `scripts/enrich-places.ts` — retries on HTTP 429 + 5xx
- `withRetry<T>(fn, maxRetries=3)` present in `scripts/cache-ai-summaries.ts` — retries on `'quota'` + 429
- Exponential backoff: `2^attempt * 1000ms + jitter(0–500ms)`
- Regression tests: `places-enrichment-compliance.test.ts` lines 70–74, 95–98

**No action needed.**

---

## 4. Places API Field Masks — 10 / 10 ✅

**What it guards:** Wrong or missing field masks cause HTTP 400 (rejected request) or Advanced SKU billing charges.

### Evidence

```
FIELD_MASK = 'places.id,places.displayName,places.googleMapsLinks,places.location'
```

| Check | Status |
|-------|--------|
| `X-Goog-FieldMask` header present | ✅ |
| No spaces in mask (Google rejects with 400) | ✅ |
| No `*` wildcard (triggers Advanced SKU) | ✅ |
| All fields have `places.` prefix (Text Search New requirement) | ✅ |
| No expensive SKU fields (rating, photos, reviews, etc.) | ✅ |
| Signed MASTRA-073 mask matches exactly | ✅ |

Regression tests: `places-enrichment-compliance.test.ts` lines 31–63.

**No action needed.**

---

## 5. Cache Layer Wiring — 2 / 10

**What it guards:** Without cache, every page load that triggers enrichment re-calls the Places API, multiplying costs by concurrent users.

### Current state

- `places_search_cache` table — ✅ exists, RLS enabled (4 policies, split by operation)
- `places_details_cache` table — ✅ exists, RLS enabled
- `enrich-places.ts` — ❌ writes to DB but **never reads from cache first** (cache-aside not implemented)
- `cache-ai-summaries.ts` — writes AI summaries to `tourist_destinations.ai_summary` column (row-level, not cache table)

Partial credit (2/10) for tables existing with correct schema.

### What to do to reach 10/10

Add cache-aside read before each Places API call in `enrich-places.ts`:

```typescript
// Before calling Places API text search:
const cached = await supabase
  .from('places_search_cache')
  .select('response_body, cached_at')
  .eq('query_hash', hash(query))
  .gte('cached_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // 30-day TTL
  .maybeSingle();

if (cached.data) {
  return JSON.parse(cached.data.response_body);
}

// ... call Places API ...

// After successful API call, write to cache:
await supabase.from('places_search_cache').upsert({
  query_hash: hash(query),
  query_text: query,
  response_body: JSON.stringify(result),
  cached_at: new Date().toISOString(),
});
```

**Files to modify:** `scripts/enrich-places.ts`  
**Effort:** ~2 hours

---

## 6. Marker Accessibility — 9 / 10 ✅

**What it guards:** Screen reader users and keyboard navigators can interact with map pins (WCAG 2.1 AA).

### Evidence

| Check | File | Status |
|-------|------|--------|
| `AdvancedMarkerElement.title` set (screen reader reads this) | `MdeMarker.tsx` | ✅ Fixed 2026-05-15 |
| `AdvancedMarkerElement.title` set | `ChatMap.tsx` | ✅ Fixed 2026-05-15 |
| `gmpClickable: true` (enables keyboard tab + Enter) | Both | ✅ |
| `role="button"` on content element | `pinContent.ts` | ✅ |
| `aria-label` on content element | `pinContent.ts` | ✅ |
| `aria-hidden="true"` on emoji dot | `pinContent.ts` | ✅ |
| `aria-current="true"` on highlighted pin | `pinContent.ts` | ✅ |

**-1pt:** Full keyboard tab-order testing not done in live browser (deferred until Playwright E2E exists).

**Official docs:** https://developers.google.com/maps/documentation/javascript/advanced-markers/accessible-markers

---

## 7. ChatMap / MdeMap Consolidation — 7 / 10

**What it guards:** Single source of truth for pin rendering — accessibility and style changes propagate to all map contexts.

### Current state

| Check | Status |
|-------|--------|
| `makeContent()` useCallback removed from `ChatMap.tsx` | ✅ Fixed 2026-05-15 |
| `ChatMap.tsx` imports `buildPinContent` from `pinContent.ts` | ✅ Fixed 2026-05-15 |
| `makeContent` removed from `useEffect` dependency arrays | ✅ Fixed 2026-05-15 |
| `ChatMap.tsx` fully merged into `MdeMap.tsx` (single component) | ⚠️ NOT YET |
| Info window content (`makeInfoContent`) deduplicated | ⚠️ OPEN — still duplicated |

**Partial (-3pts):** Two map components still exist. MdeMap is the canonical successor; ChatMap should eventually be removed.

### What to do to reach 10/10

1. Extract `makeInfoContent` into `pinContent.ts` (alongside `buildPinContent`)
2. Migrate `ChatMap.tsx` → `MdeMap.tsx` (use the same component with a `mode` prop)
3. Delete `ChatMap.tsx`

**Files to modify:** `src/components/map/pinContent.ts`, `src/components/chat/ChatMap.tsx`, `src/components/map/MdeMap.tsx`  
**Effort:** ~4 hours (risk: ChatMap has chat-specific side effects to port)

---

## 8. Maps Grounding (Gemini) — 0 / 10

**What it guards:** AI chat answers can cite real Medellín places from live Google Maps data, not hallucinated locations.

### Current state

The `ai-chat` edge function does **not** pass `tools: [{ googleMaps: {} }]` to `generateContent`. Grounding is completely absent.

### What to do to reach 10/10

**MCP-verified API (Gemini):**

```typescript
// In supabase/functions/ai-chat/index.ts
const response = await ai.models.generateContent({
  model: 'gemini-3-flash-preview',
  contents: [{ role: 'user', parts: [{ text: userMessage }] }],
  config: {
    tools: [{ googleMaps: {} }],        // ← Maps Grounding
    toolConfig: {
      retrievalConfig: {
        latLng: { latitude: 6.2442, longitude: -75.5812 }, // Medellín
      },
    },
    thinkingConfig: { thinkingBudget: 0 },
    temperature: 0.3,
    maxOutputTokens: 800,
  },
});
```

**Gate it behind a feature flag** (safe rollout):
```bash
# Vercel env var:
MDEAI_MAPS_GROUNDING=true   # off by default until tested
```

```typescript
if (Deno.env.get('MDEAI_MAPS_GROUNDING') === 'true') {
  config.tools = [{ googleMaps: {} }];
}
```

**Files to modify:** `supabase/functions/ai-chat/index.ts`  
**Effort:** ~3 hours + smoke test  
**Official docs:** https://ai.google.dev/gemini-api/docs/grounding

---

## 9. Production Deploy — 4 / 10

**What it guards:** All code fixes above are actually live at https://www.mdeai.co.

### Current state

```
Local main:   21 commits ahead of origin/main
origin/main:  0 commits ahead of local
Vercel live:  tracks origin/main → STALE by 21 commits
```

**Commits pending push include:**
- geocode-missing.ts column fix
- MdeMarker.tsx `title` property
- ChatMap.tsx deduplication + `title`
- places-enrichment-compliance.test.ts (15 new tests)
- Audit checklist updates

### What to do to reach 10/10

```bash
# 1. Confirm floor passes (already verified 2026-05-15):
npm run lint && npm run build && npm run test

# 2. Push to GitHub (triggers Vercel auto-deploy):
git push origin main

# 3. Watch Vercel deploy (1–2 min):
# https://vercel.com/amo-tech-ai/mdeai-co/deployments

# 4. Verify live:
curl -s -o /dev/null -w "%{http_code}" https://www.mdeai.co
# Expected: 200

# 5. Remove VITE_GEMINI_API_KEY from Vercel, add GEMINI_API_KEY (see item #1)
# Vercel will auto-redeploy after env var save
```

**Blockers for 10/10:**  
- `git push origin main` (user action — requires SSH/HTTPS auth)  
- Remove `VITE_GEMINI_API_KEY` from Vercel dashboard (user action)

---

## 10. Test Coverage — 9 / 10 ✅

**What it guards:** Regressions caught before they reach production.

### Evidence (2026-05-15 floor run)

| Suite | Count | Files | Status |
|-------|-------|-------|--------|
| Root Vitest | 167 / 167 | 15 files | ✅ |
| my-mastra-app Vitest | 56 / 56 | 4 files | ✅ |
| Build | exit 0 (6.66s) | — | ✅ |
| Lint | 0 errors | — | ✅ |

**Compliance tests (new 2026-05-15):**
- `src/lib/places-enrichment-compliance.test.ts` — 15 tests guarding FIELD_MASK, thinkingBudget, model version, 429 retry, geocode column correctness

**-1pt:** No Playwright E2E tests exist (config is present, suite is empty). Marker accessibility and enrichment pipeline are tested only via unit tests, not via live browser automation.

### What to do to reach 10/10

Write Playwright specs for:
1. Map pin renders with `title` attribute (keyboard nav smoke)
2. `mapsUrl` link present on event/restaurant/destination card when enriched
3. Chat `ai-summary` text visible on enriched card

**Files:** `tests/e2e/maps-pins.spec.ts`, `tests/e2e/enrichment-cards.spec.ts`

---

## Fix Priority Order (to go from 61 → 100)

| Priority | Item | Points gain | Effort | Blocks |
|----------|------|-------------|--------|--------|
| **P0** | Push 21 commits to origin/main | +2 (deploy gate) | 5 min | All live fixes |
| **P0** | Remove `VITE_GEMINI_API_KEY` from Vercel, add `GEMINI_API_KEY` | +2 (key security) | 5 min | Key safety |
| **P0** | Rotate Gemini key in Google Cloud Console | +2 (key security) | 10 min | Key safety |
| **P1** | Run `enrich-places.ts` against production DB | +6 (enrichment) | 30 min | tourist_dest + events coverage |
| **P1** | Cache-aside wiring in `enrich-places.ts` | +8 (cache) | 2 hrs | API cost control |
| **P2** | Maps Grounding feature flag + ai-chat wiring | +10 (grounding) | 3 hrs | AI quality |
| **P2** | ChatMap → MdeMap consolidation + info window dedup | +3 (consolidation) | 4 hrs | Code health |
| **P3** | Playwright E2E specs (pins + cards) | +1 (test coverage) | 2 hrs | Regression confidence |

**Projected score after P0 + P1:** 61 + 2 + 2 + 2 + 6 + 8 = **81 / 100**  
**Projected score after all P2:** 81 + 10 + 3 = **94 / 100**  
**Full 100:** P3 Playwright + live keyboard nav test = **100 / 100**

---

## Pass / Fail Thresholds

| Score | Gate |
|-------|------|
| ≥ 90 | Production-ready — no known billing/security/coverage gaps |
| 70–89 | Conditional — P0/P1 issues must be logged + scheduled |
| 50–69 | Current state — P0 items block go-live of enrichment pipeline |
| < 50 | Do not launch enrichment to real users |

**Current: 61 — enrichment pipeline should not be run against production DB until item #1 (VITE_GEMINI key) is resolved.**
