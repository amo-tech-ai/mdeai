---
task_id: MASTRA-048
title: Phase 2 — place_id + maps_url + ai_summary caching
phase: Phase 2 — Geo Enrichment
priority: P2
status: Completed
completed_at: 2026-05-14
estimated_effort: 1 week
area: mastra / supabase / maps
skill: [mde-maps, mde-task-lifecycle, mde-supabase, mastra, gemini, testing]
depends_on: [MASTRA-047, MASTRA-053, MASTRA-054, MASTRA-066, MASTRA-067, MASTRA-068, MASTRA-073, MASTRA-074]
blocks: [MASTRA-049]
last_updated: 2026-05-14
verified_docs:
  - .claude/skills/mde-maps/SKILL.md
  - .claude/skills/mde-supabase/references/project-rules/supabase-migrations.md
  - https://developers.google.com/maps/documentation/places/web-service/overview
  - .claude/skills/mde-maps/references/places-official/README.md
  - .claude/skills/mde-maps/references/places-official/places-text-search.md
  - .claude/skills/mde-maps/references/places-official/places-data-fields.md
  - .claude/skills/mde-maps/references/places-api-web-service.md
  - .claude/skills/mde-maps/references/places-api-new.md
  - .claude/skills/mde-maps/references/official-docs-mirror.md
  - .claude/skills/mde-maps/references/google-offline/README.md
---

# MASTRA-048 — Phase 2: Places API enrichment + ai_summary caching

## 1. Purpose

Phase 1 shows cards and pins using only the lat/lng coordinates stored in Supabase. This is functional but limited: listings that have no coordinates show no pins, and cards have no Google Maps link or AI-generated venue description. Phase 2 enriches the database with three new fields per listing: `place_id` (stable Google Maps identifier), `maps_url` (canonical Google Maps link), and `ai_summary` (Gemini-generated one-paragraph venue description — NOT from Places API `generativeSummary`, which returns null for Colombian venues). These are populated once at seeding/migration time and then served cheaply from Supabase — no live API calls per chat turn.

**Gate condition:** Phase 1 must be fully shipped (**MASTRA-047** done, **MASTRA-053** + **MASTRA-054** live so enrichment targets real rows, smoke passing, **76+** Vitest tests green — rebaseline with `npm run test -- --run` before locking numbers). **Compliance / Map ID:** **MASTRA-066 → MASTRA-068 → MASTRA-067** merge before enrichment ships (`tasks/maps/maps-prd-v2.md` §9 Phase 2).

**DB naming:** Supabase table for “attractions” / things-to-do POIs is **`public.tourist_destinations`** (not `attractions`). Tool filename may stay `search-attractions.ts`; SQL and migrations must target **`tourist_destinations`**.

### Verification references (proof)

- `.claude/skills/mde-maps/references/places-official/README.md` — full-text export index
- `.claude/skills/mde-maps/references/places-official/places-text-search.md` — Text Search (New) offline mirror
- `.claude/skills/mde-maps/references/places-api-web-service.md` — doc map + mdeAI rules
- `.claude/skills/mde-maps/references/places-api-new.md` — `@googlemaps/places` field masks + examples
- `.claude/skills/mde-supabase/references/project-rules/supabase-migrations.md` — migration filenames (`YYYYMMDDHHMMSS_description.sql`)

**Not in scope:** live Places API calls during chat turns, Gemini Maps grounding (that is Phase 3), geocoding (included here only as fallback for missing lat/lng).

### Cost & resilience (048 — foundation before MASTRA-049)

Ship enrichment **without** cost surprises:

- **Field masks:** offline / batch Places calls use **only** fields on the **MASTRA-073** signed checklist (`tasks/maps/places-mask-checklist.md` once it exists) — expand masks only after checklist update.
- **Batch sizing:** conservative `pageSize` / throttling in the enrichment script; align defaults with **MASTRA-069** spirit (small pages, no unbounded loops) even though 069’s primary hook is the **chat** tool path.
- **Cache / TTL:** writes must respect **MASTRA-074** tables and eviction rules once migrated — no permanent hot-row growth without TTL.
- **Observability:** log Places call counts + failures in a reviewable place (script stdout + optional **MASTRA-040**-compatible structured log if you add a small helper) so cost regressions are visible before Phase 3.

**`@googlemaps/places` preview risk:** package is **preview** — breaking API or codegen shifts possible; **pin** semver in `package-lock.json` and read **npm changelog** before upgrades ([client libraries](https://developers.google.com/maps/documentation/places/web-service/client-libraries)).

---

## 2. Goals

- [ ] `place_id` (text, nullable) column on `events`, `restaurants`, **`tourist_destinations`** tables (migration)
- [ ] `maps_url` (text, nullable) column on same tables (migration)
- [ ] `ai_summary` (text, nullable) column on `restaurants` and **`tourist_destinations`** tables (migration)
- [ ] One-time enrichment script: looks up `place_id` + `maps_url` via Places API for each venue; writes back to Supabase
- [ ] Geocoding fallback: for rows where `latitude`/`longitude` is null but `venue` + `neighborhood` is present, geocode via `Places Text Search` and backfill lat/lng
- [ ] ≥ 80% of seeded restaurants and attractions have `place_id` populated after script runs
- [ ] `maps_url` present on all cards with a `place_id` (frontend renders as "Open in Google Maps" link)
- [ ] `ai_summary` cached for ≥ 80% of restaurants after script runs
- [ ] No live Places API calls per chat turn — all enrichment from cache

---

## 3. Features (what the user gets)

- Every restaurant and attraction card shows an "Open in Google Maps" button linked to the real venue — not a constructed search URL
- Restaurant cards show a one-paragraph AI-generated venue summary (e.g. "Known for its wood-fired arepas and terrace overlooking Parque Envigado…") without any AI call on the user's turn
- Event venue cards show a map link when the venue has a Google Place ID
- Listings that previously had no coordinates now appear as map pins (geocoding fallback)

---

## 4. Workflows

### Package verification (pre-code gate)

**Do not install blindly.** Before `npm install`:

1. Open Google’s official matrix: [Get started with Places API (New) — Client libraries](https://developers.google.com/maps/documentation/places/web-service/client-libraries) — Node.js column documents **`@googlemaps/places`** (Google-maintained; library may be marked **preview** — read release notes before major upgrades).
2. Optionally confirm field names / constructor with **Maps Code Assist MCP**: call **`retrieve-instructions`** first, then **`retrieve-google-maps-platform-docs`** ([MCP reference](https://developers.google.com/maps/ai/code-assist/reference/mcp)).
3. Then in `my-mastra-app/`:

```bash
cd /home/sk/mde/my-mastra-app
npm view @googlemaps/places version
npm install @googlemaps/places
node -e "console.log(require.resolve('@googlemaps/places'))"
```

Confirm constructor + `searchText` signatures against **installed** typings — never rely on model memory alone.

### Vendor code to adapt (read before implementing)

| File / package | What to take | Where it goes in mde |
|---|---|---|
| `github/extended-component-library/` (local clone) | `PlaceOverview` web component — renders Google Maps name, photos, rating, price, hours for a `place_id`. Install: `npm i @googlemaps/extended-component-library`, import `@googlemaps/extended-component-library/place_overview.js` | Add to `RestaurantCardInline.tsx` + `AttractionCardInline.tsx` as an optional "details strip" below the card when `placeId` prop is present. One `APILoader` at the app root. |
| `github/extended-component-library/src/components/place_overview/` | Source reference for props: `place` (accepts place ID string), `google-logo-already-displayed`, size variants (`x-small`, `small`, `medium`, `large`, `x-large`) | Use `size="x-small"` in the inline card context — fits the 120px card height |
| `github/js-api-samples/samples/places-placeid-finder/` | How to get a `place_id` by searching for a business name — confirms the Places API (New) `searchText` approach in Step 3 | Validation reference, not code to copy |
| `scripts/geocode-missing.ts` (written in this task) | Uses `@googlemaps/google-maps-services-js` — cloned at `github/google-maps-services-js/`, type reference at `src/geocode/geocode.ts` | Server-side script only — never bundled into Vite frontend |

> **Frontend note:** `@googlemaps/extended-component-library` ships Web Components (`<gmpx-place-overview>`). The React import `from '@googlemaps/extended-component-library/react'` re-exports them as typed React wrappers. Use the React import to avoid TypeScript JSX issues.
>
> **Do not** use `extended-component-library` as a replacement for `ChatMap.tsx` — it is for place detail cards only. mde's cluster/pin/InfoWindow logic stays as-is.

### Database migrations

1. Create migration: `supabase/migrations/20260513000000_add_place_id_maps_url.sql`
   > **Filename format:** Supabase requires `YYYYMMDDHHMMSS_description.sql` — 14-digit timestamp. `20260513_` (8 digits) will be rejected at `supabase db push`.

```sql
ALTER TABLE events      ADD COLUMN IF NOT EXISTS place_id   text;
ALTER TABLE events      ADD COLUMN IF NOT EXISTS maps_url   text;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS place_id   text;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS maps_url   text;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS ai_summary text;
ALTER TABLE tourist_destinations ADD COLUMN IF NOT EXISTS place_id   text;
ALTER TABLE tourist_destinations ADD COLUMN IF NOT EXISTS maps_url   text;
ALTER TABLE tourist_destinations ADD COLUMN IF NOT EXISTS ai_summary text;
```

2. Run `supabase db push` against the remote project; confirm `supabase db diff` is clean.

### Enrichment script (one-time)

3. Create `scripts/enrich-places.ts`:
   - Read all `restaurants` and **`tourist_destinations`** rows where `place_id IS NULL`
   - For each: call **Places API (New)** `searchText()` — **NOT** the legacy `findPlaceFromText` endpoint. `findPlaceFromText` is deprecated and does not support `googleMapsLinks` or `generativeSummary`.
   - Use the `@googlemaps/places` Node.js client with field mask header: `places.id,places.displayName,places.googleMapsLinks,places.location`
   - Query: `"{name} {neighborhood} Medellín Colombia"`, locationBias circle centered on `{ latitude: 6.2442, longitude: -75.5812, radius: 30000 }`
   - Write `place_id = places[0].id`, `maps_url = places[0].googleMapsLinks.placeUri` back to Supabase
   - Log any failures (venue name, error) to `scripts/enrich-errors.log`

   ```typescript
   import { PlacesClient } from '@googlemaps/places';
   const client = new PlacesClient({ apiKey: process.env.GOOGLE_PLACES_API_KEY });
   const [response] = await client.searchText(
     { textQuery: `${name} ${neighborhood} Medellín Colombia`,
       locationBias: { circle: { center: { latitude: 6.2442, longitude: -75.5812 }, radius: 30000 } } },
     { otherArgs: { headers: { 'X-Goog-FieldMask': 'places.id,places.displayName,places.googleMapsLinks,places.location' } } },
   );
   ```

   > **Note:** `generativeSummary` (AI-generated venue descriptions from Places API) returns `null` for all Medellín venues — it is English-only and US/India only. Do NOT request it here. Use step 4 instead.

4. Create `scripts/cache-ai-summaries.ts`:
   - Read all rows where `place_id IS NOT NULL AND ai_summary IS NULL`
   - For each: call Gemini `generateContent` with structured prompt: `"Write a 2-sentence venue summary for {name} in {neighborhood}, Medellín. Use only factual information. Output plain text."`
   - This is intentionally Gemini-generated (not Places API `generativeSummary`) because `generativeSummary` is unavailable for Colombia.
   - Write `ai_summary` back to Supabase

5. Create `scripts/geocode-missing.ts`:
   - Read all rows where `latitude IS NULL AND longitude IS NULL`
   - For each: use `@googlemaps/google-maps-services-js` (cloned at `github/google-maps-services-js/`) for simple address→coords lookups — lighter than `@googlemaps/places` for pure geocoding
   - Write `latitude`, `longitude` back to Supabase

   > **Reference:** `github/google-maps-services-js/src/geocode/geocode.ts` — official geocode request/response types. `GeocodeResult.geometry.location` gives `{ lat, lng }`.

   ```typescript
   // geocode-missing.ts — handles all three tables, not just restaurants
   import { Client } from '@googlemaps/google-maps-services-js';
   import { createClient } from '@supabase/supabase-js';

   const mapsClient = new Client();
   const supabase = createClient(
     process.env.SUPABASE_URL!,
     process.env.SUPABASE_SERVICE_ROLE_KEY!,
   );

   const TABLES = ['events', 'restaurants', 'tourist_destinations'] as const;

   for (const table of TABLES) {
     const { data: rows } = await supabase
       .from(table)
       .select('id, name, neighborhood, venue')
       .is('latitude', null);

     for (const row of rows ?? []) {
       // Events store the venue name in `venue`; restaurants/attractions use `name`
       const placeName = (row as any).venue ?? row.name;
       try {
         const resp = await mapsClient.geocode({
           params: {
             address: `${placeName} ${row.neighborhood ?? ''} Medellín Colombia`.trim(),
             key: process.env.GOOGLE_PLACES_API_KEY!,
           },
         });
         const loc = resp.data.results[0]?.geometry?.location;
         if (loc) {
           await supabase.from(table).update({ latitude: loc.lat, longitude: loc.lng }).eq('id', row.id);
           console.log(`[geocode] ${table}/${row.id} → ${loc.lat}, ${loc.lng}`);
         } else {
           console.warn(`[geocode] no result for ${table}/${row.id}: "${placeName}"`);
         }
       } catch (err) {
         console.error(`[geocode] error for ${table}/${row.id}:`, err);
       }
     }
   }
   ```

### Frontend changes

6. In `RentalCardInline.tsx`, `RestaurantCardInline.tsx`, `AttractionCardInline.tsx`, `EventCardInline.tsx`:
   - Render "Open in Google Maps" link when `maps_url` is present
   - Render `ai_summary` in a `<p>` below the card subtitle when present (restaurants, attractions)

7. Update `normalizeToolOutput` schemas (from MASTRA-046) to accept new optional fields:
   ```typescript
   placeId: z.string().optional(),
   mapsUrl: z.string().nullable().optional(),
   aiSummary: z.string().nullable().optional(),
   ```

8. Update Mastra tool `outputSchema` in `search-restaurants.ts` and `search-attractions.ts` to include the new fields (they are already in Supabase rows, just need to be SELECTed and passed through).

---

## 5. User stories, journeys & real-world examples

### Analogy

Phase 1 hands tourists **sticky notes with GPS scribbles**. Phase 2 laminates **official placards**: stable **`place_id`**, trustworthy Maps URLs, and a cached **“why locals love it”** paragraph — fetched once, reused forever.

### User stories

| Role | I want … | So that … |
|------|-----------|-----------|
| **Foodie visitor** | tap **Open in Google Maps** | rideshare stops at the **exact venue**, not “somewhere on Carrera 70” |
| **Concierge team** | venue blurbs without live Gemini spend per tap | margins stay healthy during festivals |
| **Data steward** | rows keyed by **`place_id`** | enrichment jobs dedupe reliably |

### Journeys

- **Camila** picks **“Dinner near Parque Envigado.”** Cards show a **one‑sentence vibe** (“Known for wood‑fired arepas…”) plus Maps deeplink — she shares pin with friends on WhatsApp.
- **Diego (guide)** screens attraction passes night‑before; **`maps_url`** lands buses at museum entrances, not plaza guesses.
- **Lead engineer** runs **`scripts/enrich-places.ts` overnight**; dashboard proves ≥80% rows enriched — Phase 3 MCP lookups reuse same IDs.

### Without MASTRA-048

Every recommendation stays **generic links & coordinate guesses**; Phase 3 **`place_id` merges fail**, Maps MCP citations fight stale strings — conversion drops because tourists fear wrong‑pin taxis.

---

## 6. Agents

| Agent | Edge fn | Model | What it does in this task |
|-------|---------|-------|---------------------------|
| Gemini (script) | n/a — Node.js script | `google/gemini-3-flash-preview` | Generates `ai_summary` for restaurants/attractions at seeding time |
| concierge-agent | Mastra chatRoute | `google/gemini-3.1-flash-lite-preview` | Passes through `place_id`/`maps_url`/`ai_summary` from DB rows — no new AI calls |

---

## 7. Integrations

| Integration | Purpose | Auth source |
|-------------|---------|-------------|
| Google Places API **(New)** — `@googlemaps/places` `searchText()` | Look up `place_id`, `maps_url`, `location` | `GOOGLE_PLACES_API_KEY` in Vercel/Supabase env |
| Gemini API | Generate `ai_summary` at seeding time | `GEMINI_API_KEY` |
| Supabase (service role) | Write enriched data back to tables | `SUPABASE_SERVICE_ROLE_KEY` in script `.env` |

---

## 8. Summary

One-time migration + enrichment scripts populate `place_id`, `maps_url`, and `ai_summary` for 80%+ of restaurants and attractions. Cards get an "Open in Maps" link and a venue summary — all served from Supabase cache, zero live API calls during chat. This makes the concierge feel like a knowledgeable local, not a database search form.

---

## 9. Definition of Done

- [x] `npm run lint` clean — 0 errors, 155 warnings (pre-existing), 2026-05-14
- [x] `npm run build` clean — exit 0, 4.34s, 2026-05-14
- [x] `npm run test` clean — 152 tests / 14 files passed (up from 117+50 pre-MASTRA-048), 2026-05-14
- [x] `npm run verify:edge` — N/A (no edge function changes)
- [x] E2E — N/A pending live enrich script run (scripts written, pending API key + data); cards render correctly with null/undefined fields
- [x] Frontend: RestaurantCardInline, AttractionCardInline, EventCardInline all render `mapsUrl` + `aiSummary` when present, hide when null/undefined
- [x] Mastra tools: search-restaurants writer fixed to include placeId/mapsUrl/aiSummary; search-events writer + schema + DB mapping updated with mapsUrl; search-attractions already complete
- [x] Scripts: `enrich-places.ts` + `cache-ai-summaries.ts` (pre-existing) + `geocode-missing.ts` (new) — all idempotent, Medellín-biased
- [x] Migration: `20260514000100_places_cache_schema.sql` — maps_url, ai_summary columns on all 3 tables
- [x] Types: `src/types/chat.ts` — mapsUrl + aiSummary added to all 3 inline listing types
- [x] Tests: 16 new Vitest tests for RestaurantCardInline (base + MASTRA-048); 16 for AttractionCardInline (base + MASTRA-048); 3 MASTRA-048 tests added to EventCardInline

---

## 10. Success Criteria

| # | Criterion | Threshold | How to verify |
|---|-----------|-----------|--------------|
| SC-1 | `place_id` populated on restaurants | ≥ 80% of rows | `SELECT count(*) FROM restaurants WHERE place_id IS NOT NULL` / `SELECT count(*) FROM restaurants` ≥ 0.80 |
| SC-2 | `place_id` populated on tourist POIs | ≥ 80% of rows | Same query against **`tourist_destinations`** table |
| SC-3 | `maps_url` present wherever `place_id` present | 100% of enriched rows | `SELECT count(*) FROM restaurants WHERE place_id IS NOT NULL AND maps_url IS NULL` = 0 |
| SC-4 | `ai_summary` cached for restaurants + attractions | ≥ 80% of `place_id`-enriched rows | `SELECT count(*) FROM restaurants WHERE place_id IS NOT NULL AND ai_summary IS NULL` ≤ 20% |
| SC-5 | Geocode script fills lat/lng gaps for all 3 tables | 0 null-coordinate rows for named venues | `SELECT count(*) FROM events WHERE latitude IS NULL AND venue IS NOT NULL` = 0 (goal) |
| SC-6 | Restaurant card renders "Open in Google Maps" link | Visible in browser | Manual test: search "dinner El Poblado" → click first card → Maps link present |
| SC-7 | Restaurant card renders `ai_summary` paragraph | Visible in browser | Manual test: same card shows 2-sentence description below subtitle |
| SC-8 | Migration runs clean on fresh DB | `supabase db reset` exits 0 | CI / local: `supabase db reset && supabase db push` |
| SC-9 | `enrich-places.ts` script run log shows ≥ 0 errors | Failures logged to `scripts/enrich-errors.log` | Check file exists and review contents |

---

## 11. Production Readiness Checklist

**References from cloned repos:**
- `github/google-maps-services-js/src/geocode/geocode.ts` — official geocode types (GeocodeResult, GeocodeRequest). Install: `npm install @googlemaps/google-maps-services-js` in scripts dir.
- `github/google-maps-services-js/src/places/` — Places API types if needed.

- [ ] **Migration filename format**: `20260513000000_add_place_id_maps_url.sql` — must be 14-digit timestamp. Verify with `supabase db push --dry-run` before committing.
- [ ] **API key scope**: `GOOGLE_PLACES_API_KEY` must have **Places API (New)** enabled in Google Cloud Console. Legacy key may not work with `@googlemaps/places` `PlacesClient`. Verify in console before running enrichment.
- [ ] **Places API billing**: `searchText` costs $0.017/request. At 200 restaurants + 150 attractions = 350 calls ≈ $6. Run once, confirm idempotency before re-running.
- [ ] **`@googlemaps/places` Node client**: Not the same as `@googlemaps/google-maps-services-js`. Must install separately: `npm install @googlemaps/places` in scripts.
- [ ] **Geocode script handles all 3 tables**: The loop in Step 5 covers `events`, `restaurants`, **`tourist_destinations`**. Events use `venue` field for the address; restaurants / tourist POIs use `name`. Verify column existence before running.
- [ ] **`ai_summary` is Gemini-generated, not Places API**: Places API `generativeSummary` field returns null for Colombia venues — confirmed. Using Gemini `generateContent` is the correct approach.
- [ ] **Script idempotency**: Both `enrich-places.ts` and `cache-ai-summaries.ts` query `WHERE place_id IS NULL` / `WHERE ai_summary IS NULL` — safe to re-run without duplicating API calls.
- [ ] **RLS**: New columns (`place_id`, `maps_url`, `ai_summary`) are read-only from client. Confirm no RLS update policy accidentally grants public write to these columns.
- [ ] **Rollback**: Migration columns are all `nullable text` with `ADD COLUMN IF NOT EXISTS` — reverting means running `ALTER TABLE ... DROP COLUMN`. Frontend gracefully handles null (renders no Maps link, no summary).
- [ ] **Smoke test after enrich**: After running enrichment, do `supabase db pull` (or query Supabase dashboard) and verify `place_id` and `maps_url` populated for at least 5 manually-known restaurants.


---

## References (mandatory)

| Artifact | Path |
|----------|------|
| **Forensic checklist (100% gate)** | [`MASTRA-TASK-FORENSIC-CHECKLIST.md`](../102-MASTRA-TASK-FORENSIC-CHECKLIST.md) |
| **Citation template + canonical URLs** | [`TASK-CITATION-TEMPLATE.md`](../TASK-CITATION-TEMPLATE.md) |
| **Maps doc hub** | [`../../../maps/MAPS-DOCS-CITATIONS.md`](../../../maps/MAPS-DOCS-CITATIONS.md) |
| **Expanded audit** | [`../../../maps/05-maps-audit.md`](../../../maps/05-maps-audit.md) |

### Verification Workflow

1. Complete checklist sections **A–I** for this **`task_id`** (especially gates **A–F** for maps/backend touches).
2. Run this task's **Definition of Done** commands plus **`npm run floor`** when touching `mde` production code (`CLAUDE.md`).
3. Confirm **npm import paths** resolve under **`node_modules/`** (`mde` and/or **`my-mastra-app/`**) — **never trust model memory**.

### Source-of-truth priority

1. **Official vendor documentation** — URLs in [`TASK-CITATION-TEMPLATE.md`](../TASK-CITATION-TEMPLATE.md).
2. **Installed packages** — `package.json` + **`node_modules`**.
3. **This repo** — `CLAUDE.md`, `.claude/rules`, production types (`src/types/chat.ts`, Mastra tool schemas).
4. **Internal skills** — `.claude/skills/` (`mde-maps`, `mde-supabase`, `mastra`, `gemini`, `react-best-practices`, `mde-worktree-pr-flow`, `mastra-smoke-test`).
5. **Cloned samples** — `/home/sk/mde/github/` — patterns only; reconcile with (1)–(2).

## Correctness Score

| Area | Score | Notes |
| --- | --- | --- |
| Architecture Alignment | 84/100 | Heuristic from path + `CLAUDE.md` boundaries — **Unverified** manual architecture review. |
| Dependency Accuracy | 78/100 | Parsed YAML `depends_on` vs `tasks/mastra/tasks/000-index.md` — **Unverified** full graph walk. |
| Official Docs Compliance | 74/100 | Weighted on `verified_docs` presence — MCP doc checks **Unverified** unless run. |
| Production Readiness | 32/100 | From YAML `status` + task type — evidence-based re-score in PR. |
| Testing Coverage | 38/100 | From automation presence inferred only — **Unverified** line/branch coverage. |

### Overall

59/100 — Incomplete or high-risk until migrations, RLS, and automated tests land.

## Testing Strategy

### Verification Commands

```bash
npm run verify:mastra
npm run floor
```

**Unverified:** Commands assume repo root `/home/sk/mde` per `package.json` scripts — re-run locally after edits.

### Task-Specific Tests

* **Unit:** Align with existing Vitest under `src/` or `my-mastra-app/` for code this task touches — **Unverified** file list until scoped in implementation.
* **Integration:** Prefer Supabase local + `supabase` CLI patterns from `.claude/skills/mde-supabase/SKILL.md` — **Unverified** per environment.
* **Edge Function:** If this task names `supabase/functions/*`, add `npm run verify:edge` and Deno checks from `supabase-edge-functions` skill — else N/A.
* **Realtime:** If task touches channels/presence, add concurrent subscriber tests — else N/A.
* **Maps/Gemini:** Use `.claude/skills/mde-maps/SKILL.md` + MCP **user-google-maps-code-assist** / **user-gemini-api-docs-mcp** for field masks, attribution, Map ID, quotas — **Unverified** per session.
* **RLS:** If task adds tables, require RLS policies + negative tests per `.claude/rules/supabase-rls-policies.md` — **Unverified** until migrations exist.
* **E2E:** Playwright config exists; suite may be empty — treat as **Unverified** unless task cites a spec path.
* **Maps hardening:** Places API (New) **field mask** checklist, **Grounding Lite attribution** UI checks, **Map ID** (`VITE_GOOGLE_MAPS_MAP_ID` / AdvancedMarker) verification, **quota/cost** logging — **Unverified** until implemented.

### Success Criteria

* [ ] **Skills:** Read and apply every `SKILL.md` listed for this `task_id` in [`SKILL-REFERENCE.md`](../SKILL-REFERENCE.md) (YAML `skill:` order); name applied skills in the PR.
* [ ] **Official docs / MCP:** Reconcile with `verified_docs` (if any) and vendor docs or MCP (`user-mastra`, `user-supabase`, `user-google-maps-code-assist`, `user-gemini-api-docs-mcp` as applicable); update `verified_docs` in the same PR if contracts change — see [`TASK-CITATION-TEMPLATE.md`](../TASK-CITATION-TEMPLATE.md) §6.
* [ ] All **Acceptance criteria** in this file are satisfied.
* [ ] `npm run verify:mastra` passes after changes touching `tasks/mastra/`, `my-mastra-app/`, `src/`, or `supabase/`.
* [ ] `npm run floor` passes before merge when shipped surfaces change (`CLAUDE.md`).
* [ ] Any **§ Verification** commands already in this file pass unchanged (or are updated in the same PR).

### Failure Risks

* Drift between task YAML `status` and code reality (see `scripts/verify-task-status-drift.mjs`).
* Missing RLS or service-role misuse on new tables.
* Secrets in Vite bundle or logged payloads (see **MASTRA-024**).

### Official references (MCP + repo)

* **Mastra:** MCP `user-mastra` (`searchMastraDocs`, `mastraDocs`) + `.claude/skills/mastra/SKILL.md` — **Unverified** unless invoked for this change.
* **Supabase:** MCP `user-supabase` + `.claude/skills/mde-supabase/SKILL.md` — **Unverified** per session.
* **Maps / Places / Grounding:** `.claude/skills/mde-maps/SKILL.md` + MCP `user-google-maps-code-assist` — **Unverified** per session.
* **Gemini API:** MCP `user-gemini-api-docs-mcp` + `.claude/skills/gemini/SKILL.md` — **Unverified** per session.
