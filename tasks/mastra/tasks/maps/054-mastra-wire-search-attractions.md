---
task_id: MASTRA-054
title: Wire search-attractions.ts to live Supabase (remove mock data)
phase: Phase 1.5 — Pre-task Blockers
priority: P1
status: Completed
estimated_effort: 1 hour
area: mastra / tools
skill: [mde-task-lifecycle, mde-supabase, mastra, mde-maps]
depends_on: [MASTRA-050]
blocks: [MASTRA-048]
last_updated: 2026-05-14
completed_at: 2026-05-14
evidence_commit: pending
verified_docs:
  - .claude/skills/mde-supabase/references/project-rules/supabase-migrations.md
  - .claude/skills/mde-maps/references/places-official/README.md
  - .claude/skills/mde-maps/references/places-api-new.md
  - .claude/skills/mde-maps/references/official-docs-mirror.md
  - .claude/skills/mde-maps/references/google-offline/README.md
---

# MASTRA-054 — Wire search-attractions.ts to live Supabase

## 1. Purpose

`my-mastra-app/src/mastra/tools/search-attractions.ts` returns `MOCK_ATTRACTIONS` — 8 hardcoded rows — on every query. Same problem as `search-restaurants.ts` (**MASTRA-053**): fake data, broken filters, MASTRA-048 enrichment unverifiable.

> **Table name (non-negotiable):** Canonical Supabase relation is **`public.tourist_destinations`**. There is **no** `public.attractions` table — do not add one; do not query `from('attractions')`. The tool **file** may stay `search-attractions.ts` for routing labels only.

This task is identical in approach to **MASTRA-053** — can ship in the same PR.

**Not in scope:** `place_id`, `maps_url`, `ai_summary` columns (MASTRA-048), adding new parameters beyond current tool inputs.

**Contract rule:** Map **`price_usd` → `priceUsd`**, **`source_url` → `sourceUrl`** (and full **`outputSchema` camelCase**) before returning — **MASTRA-046** `AttractionListingSchema` must remain aligned.

---

## 2. Goals

- [ ] `MOCK_ATTRACTIONS` constant removed from `search-attractions.ts`
- [ ] Tool queries **`supabase.from('tourist_destinations')`** using the same client pattern as `search-rentals.ts`
- [ ] Filters applied: `neighborhood`, minimum `rating` — skip clause if param is undefined
- [ ] Returns `{ results: [], total: 0 }` gracefully when no DB rows match (optional `error` — **never** uncaught `throw`)
- [ ] **DB → tool camelCase mapping** on each row; output matches existing tool **`outputSchema`** + **MASTRA-046** (same joint-schema rule as **MASTRA-053**)

---

## 3. Features (what the user gets)

- "Things to do in El Poblado" returns real Medellín attractions from the DB instead of the same 8 fake rows
- MASTRA-048 enrichment scripts can run against real attraction rows with real IDs

---

## 4. Workflows

1. Open `my-mastra-app/src/mastra/tools/search-attractions.ts`.
2. Read `search-rentals.ts` to confirm client pattern (same as **MASTRA-053**).
3. Replace mock `execute()` body with a Supabase query:

```typescript
const query = supabase
  .from('tourist_destinations')
  .select('id, name, neighborhood, latitude, longitude, rating, price_usd, source_url')
  .limit(context.limit ?? 10);

if (context.neighborhood) query.ilike('neighborhood', `%${context.neighborhood}%`);
if (context.rating_min)   query.gte('rating', context.rating_min);

const { data, error } = await query;
if (error) {
  return { results: [], total: 0, error: error.message };
}
const rows = data ?? [];
const results = rows.map(({ price_usd, source_url, ...rest }) => ({
  ...rest,
  priceUsd: price_usd ?? null,
  sourceUrl: source_url ?? null,
}));
return { results, total: results.length };
```

4. Delete `MOCK_ATTRACTIONS` constant.
5. `npm run build` — fix TypeScript errors.
6. Test in Studio: `searchAttractionsTool` with `{ neighborhood: "El Poblado" }` → real rows (DB failures return **`results: []`** + **`error`**, never an uncaught throw).

---

## 4.5 Verification references (proof)

- `.claude/skills/mde-supabase/SKILL.md` — service-role Supabase usage from Mastra server context
- `.claude/skills/mastra/SKILL.md` — Mastra tool execution semantics (`my-mastra-app/`)

---

## 5. User stories, journeys & real-world examples

### Analogy

Treating attractions mock data like looped museum GIF — charming demo, cruel UX when travelers rearrange trips nightly.

### User stories

| Role | I want … | So that … |
|------|-----------|-----------|
| **Family planner** | real botanical gardens vs trampoline parks | kids itineraries survive scrutiny |
| **Marketing intern** | photo‑worthy venues surfaced honestly | IG Lives aren't embarrassed reroutes |
| **CRM engineer** | Supabase IDs feeding enrichment | segmentation pipelines trustworthy |

### Journeys

- **Mateo's nieces** beg butterfly pavilion vs cable metro combo Saturday → concierge proposes **real** combo durations sourced DB—not carousel placeholders.
- **Laura** ships bilingual attraction bundles (`things_to_do_es`) knowing **`rating`** distributions reflect the **full catalogue**, not eight duplicated demo clones.

### Without MASTRA-054

Tour stacks degrade identical nightly loops → churn climbs ("felt scripted"), sponsors hesitate pairing logos with stale attraction roster.

---

## 6. Agents

| Agent | Edge fn | Model | What it does in this task |
|-------|---------|-------|---------------------------|
| concierge-agent | Mastra chatRoute | `CONCIERGE_MODEL` | Routes to `searchAttractionsTool`; now gets live DB results |

---

## 7. Integrations

| Integration | Purpose | Auth source |
|-------------|---------|-------------|
| Supabase **`tourist_destinations`** table | Live tourist POI / “attraction” data | `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in Mastra Vercel env |

---

## 8. Summary

Replace 8 hardcoded mock attractions with a real Supabase query. Ships in the same PR as **MASTRA-053**. Unblocks MASTRA-048 and makes attraction search accurate.

---

## 9. Definition of Done

- [x] `npm run typecheck` clean in `my-mastra-app/` — `tsc --noEmit` exit 0 in 2.39 s (2026-05-14)
- [x] `npm run build` clean in `my-mastra-app/` — Mastra CLI build successful in 23.29 s (2026-05-14)
- [x] `npm run test` clean — 15/15 tests pass in 0.57 s; count did not regress
- [x] `npm run verify:edge` — N/A (no Supabase edge function changes)
- [x] `npm run verify:mastra` — `verify-maps-task-alignment: 0 error(s), 0 warn(s)` (MASTRA-054 warn cleared; was previously `WARN: search-attractions.ts: MOCK_ATTRACTIONS present, no tourist_destinations — MASTRA-054 still open`)
- [x] `grep -RIn "MOCK_ATTRACTIONS" my-mastra-app/src/` → **0 results** (build artifacts in `.mastra/.build/`, `.mastra/output/`, `.vercel/output/` are stale — cleaned on next build)
- [ ] Manual: Mastra Studio → `searchAttractionsTool` `{ neighborhood: "El Poblado" }` → real DB rows — **deferred** to live preview (requires `DATABASE_URL` populated in Mastra Vercel env; smoke test pending on next deploy)
- [ ] PR body: Studio screenshot showing real results — **deferred** to live preview (manual step on next deploy)

## 10. Implementation summary

- Replaced the 8-row `MOCK_ATTRACTIONS` constant + sync `searchAttractions()` with an **async** Supabase query against `public.tourist_destinations` using the same `pg.Pool` pattern as `search-rentals.ts`.
- Added four pure helpers (`normalizeCategory`, `parseDurationMinutes`, `deriveBestTime`, `deriveNeighborhood`) that map free-form DB columns to the strict `attractionSchema` enum. All four are exported for unit testing in a follow-up PR.
- DB columns mapped: `entry_fee_amount → priceUsd`, `estimated_visit_duration → durationMinutes` (parsed), `primary_image_url → imageUrl`, `website → sourceUrl`, `best_for`/`tags → bestTimeOfDay` (derived), `category`/`subcategory → category` (coerced to enum, default `landmark`).
- Output schema: `source` field now `z.literal('supabase')` (was `'mock'`); added optional `error` field for non-throw failure path. Schema-shape compatible with downstream callers per `concierge-routing-workflow.ts` (updated to `await` the now-async call).
- DB failure path returns `{ results: [], total: 0, source: 'supabase', error }` — never an uncaught throw, matching the task spec contract.
- Streaming writer event (`data-mdeai-actions` with `kind: 'attraction_results'`) preserved verbatim.


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
| Production Readiness | 30/100 | From YAML `status` + task type — evidence-based re-score in PR. |
| Testing Coverage | 34/100 | From automation presence inferred only — **Unverified** line/branch coverage. |

### Overall

58/100 — Incomplete or high-risk until migrations, RLS, and automated tests land.

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
