---
id: MASTRA-056-AUDIT
title: MASTRA-056 — grounded MapPinCategory proof checklist
created: 2026-05-12
verification_status: verified_on_branch
last_verified: 2026-05-12
notes: >-
  Proof summary items marked [x] against current repo state (MapContext + tests).
  Re-run checks on every PR that touches pins/maps before merge.
related:
  - tasks/prompts/mastra/tasks/056-mastra-grounded-mappincategory.md
  - tasks/prompts/mastra/tasks/049-mastra-geo-grounding-phase3.md
  - tasks/prompts/mastra/tasks/065-mastra-grounded-pins-lite.md
  - src/context/MapContext.tsx
  - src/context/MapContext.test.ts
---

# MASTRA-056 proof checklist

## Proof summary (verified against repo — re-check on PR if pins/maps change)

MASTRA-056 is correct if:

- [x] **`MapPinCategory` includes `grounded`** — alongside `rental`, `restaurant`, `event`, `attraction` in `src/context/MapContext.tsx` (lines 12–17).
- [x] **`PIN_CATEGORY_CONFIG` is exhaustive** — `Record<MapPinCategory, { emoji; color; label }>` includes **`grounded`** with **`#6B7280`**, label **`Place`**, emoji **`📌`** (`MapContext.tsx` lines 112–121).
- [x] **Existing categories unchanged** — four inventory rows unchanged vs MASTRA-056 intent (`rental`, `restaurant`, `event`, `attraction` hex/emoji/labels preserved).
- [x] **No undefined config path** — exhaustive `Record` guarantees `PIN_CATEGORY_CONFIG[pin.category]` for every `MapPinCategory`.
- [x] **Rendering safe** — `ChatMap.tsx`, `pinContent.ts`, `MdeMap.tsx` use `PIN_CATEGORY_CONFIG[pin.category]`; **`pinDetailPath`** returns `null` for non-rental (including `grounded`) → navigation no-op, no crash.
- [x] **Scope clean** — MASTRA-056 PR must contain **no** `searchGroundedPlacesTool`, `maps-mcp-client`, **059 migrations for grounding**, Places wiring, SSE/action edits, or “Show nearby” UI. *(Note: `grounding_quota_log` may exist from **MASTRA-057** in other commits — not part of 056.)*
- [x] **Tests** — `src/context/MapContext.test.ts`: config row per category; grounded gray + label; `mergePinsByCategory` grounded batch keeps rentals; legacy merge tests preserved (**6 tests**, `npm run test -- --run src/context/MapContext.test.ts`).
- [x] **Floor** — `npm run lint` (0 errors), `npm run build`, `npm run test -- --run` green on verification pass.

## Optional notes

- **`clusterColor`** is **not** part of `PIN_CATEGORY_CONFIG` in this repo; default `@googlemaps/markerclusterer` styling applies unless a future task extends the shape.

---

## 1. Before opening PR

Run locally:

```bash
cd /home/sk/mde

npm run lint
npm run build
npm run test -- --run
npm run test -- --run src/context/MapContext.test.ts
```

Confirms: TypeScript safety, exhaustive config, `grounded` support, no regressions.

---

## 2. During PR review (formal audit — **MASTRA-056-AUDIT**)

Manually confirm:

| Area | Check |
|------|--------|
| Types | `MapPinCategory` union |
| Config | `PIN_CATEGORY_CONFIG` row for `grounded` |
| Scope | No MCP tool code, no Maps migrations **for 056**, no Places client in this slice |
| Tests | `MapContext.test.ts` grounded + merge cases |

Use **Quick verification commands** below.

---

## 3. Browser / runtime (optional before merge)

```bash
npm run dev
```

Open `http://localhost:8080/chat` (or `8081` if 8080 busy).

Confirm: map loads, no runtime errors. Full **grounded pin** placement is **not** required for 056:

- **MASTRA-049** — MCP + tool output + real grounded pins  
- **MASTRA-065** — “Show nearby” / rental-grounded UX  

056 only guarantees **future** `category: 'grounded'` pins render safely (colors, no undefined config).

---

## 4. After MASTRA-049

First milestone for **live** grounded pins on map:

- MCP client, `search_places`, tool → `MapPin`, coexistence with rentals, quota (**057**).

Then validate: grounded pins visible, pin coexistence, attribution, quota behavior.

---

## Recommended workflow

```txt
056 verify now (this checklist)
    ↓
merge PR (056-only slice)
    ↓
057 verify (grounding_quota_log) — if not already merged
    ↓
048 / enrichment as planned
    ↓
049 MCP + grounded tool
    ↓
full grounded pin browser test (+ 065 when scheduled)
```

---

## Quick verification commands

```bash
rg "MapPinCategory|'grounded'" src/context/MapContext.tsx
rg "PIN_CATEGORY_CONFIG\[pin\.category\]" src/components/chat/ChatMap.tsx src/components/map/pinContent.ts src/components/map/MdeMap.tsx
rg "searchGroundedPlacesTool|maps-mcp-client" src my-mastra-app || true
npm run test -- --run src/context/MapContext.test.ts
npm run lint && npm run build && npm run test -- --run
```

## Out of scope (defer)

- **MASTRA-049** — MCP client, `search_places`, quota wiring in Mastra.
- **MASTRA-065** — “Show nearby” rental UX and grounded pin injection from tools.
