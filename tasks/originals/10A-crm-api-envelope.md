---
id: 10A
diagram_id: MERM-09
prd_section: "7. Technical — Edge functions, p1-crm"
title: P1 CRM typed client and JSON envelope (no client in parser tests)
skills:
  - mdeai-tasks
  - supabase/supabase-edge-functions
epic: E10
phase: CORE
priority: P0
status: Done
owner: Full-Stack
dependencies: []
estimated_effort: S
percent_complete: 100
outcome: O1
---

| Aspect | Details |
|--------|---------|
| **Diagram** | MERM-09 — `p1-crm` I/O and auth |
| **Edge** | Contract `{ success, data }` / `{ success, error }` from `supabase/functions/p1-crm/` |
| **Files** | `src/lib/p1-crm-envelope.ts`, `src/lib/p1-crm-api.ts`, `src/lib/p1-crm-envelope.test.ts` |
| **Skills** | **mdeai-tasks** (task shape); **supabase-edge-functions** (invoke, JWT, structured errors) |

## Description

**The situation:** The app needs a single typed layer for `functions.invoke('p1-crm')` with testable parsing.

**Why it matters:** Duplicated error handling and untested envelopes break CRM flows silently.

**What already exists:** `p1-crm` edge handler returns `jsonResponse` + `errorBody`.

**The build:** Pure `parseP1CrmEnvelope` in a module that does **not** import the Supabase browser client; `invokeP1Crm`, `scheduleTourRequest`, `startRentalApplicationRequest`, neighborhood name resolution.

## Acceptance criteria

- [x] Vitest covers success envelope, error envelope, garbage input
- [x] `npm run test` passes without Supabase `localStorage` errors
- [x] `npm run build` passes

## Wiring plan

| Layer | File | Action |
|-------|------|--------|
| Lib | `src/lib/p1-crm-envelope.ts` | Create |
| Lib | `src/lib/p1-crm-api.ts` | Create |
| Test | `src/lib/p1-crm-envelope.test.ts` | Create |
