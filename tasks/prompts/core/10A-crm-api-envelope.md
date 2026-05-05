---
id: 10A
diagram_id: MERM-09
prd_section: "7. Technical — Edge functions, p1-crm"
title: P1 CRM typed client and JSON envelope (no client in parser tests)
description: "Ships «P1 CRM typed client and JSON envelope (no client in parser tests)» for this epic—full scope in § Prompt below."
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


### Real world — purpose & outcomes

**In one sentence:** The app and `p1-crm` edge agree on the **same JSON shape** for leads and errors—so TypeScript doesn’t lie and production doesn’t surprise you.

- **Who it’s for:** Frontend devs calling CRM; anyone reviewing API contracts.
- **Purpose:** One typed envelope: success, error codes, nested rows—versioned if needed.
- **Goals:** Compile-time safety; tests fail if envelope drifts; docs match code.
- **Features / deliverables:** Shared types in `src/lib/p1-crm-*`, tests, short doc of error codes.

| Aspect | Details |
|--------|---------|
| **Diagram** | MERM-09 — `p1-crm` I/O and auth |
| **Edge** | Contract `{ success, data }` / `{ success, error }` from `supabase/functions/p1-crm/` |
| **Files** | `src/lib/p1-crm-envelope.ts`, `src/lib/p1-crm-api.ts`, `src/lib/p1-crm-envelope.test.ts` |
| **Skills** | **mdeai-tasks** (task shape); **supabase-edge-functions** (invoke, JWT, structured errors) |

## Success criteria (tests · verify · production-ready)

| Track | Definition |
|-------|------------|
| **Tests** | Relevant automated checks pass: `npm run lint`, `npm run build`, `npm run test` (and `npm run verify:edge` when Supabase edge functions change). Add or update tests when behavior changes. |
| **Verify** | Manual smoke: confirm the user-visible or API outcome in dev/staging; for auth, CORS, payments, or idempotency, exercise the real path once. |
| **Production-ready** | No open security gaps for this change scope; deploy path documented or executed; rollback/monitoring understood if the change touches production data or money. Mark complete only when the rows above are satisfied. |

## Feature success (goals → shippable features)

Aligned with [`PROMPT-VERIFICATION.md`](../PROMPT-VERIFICATION.md) §6 (Goal · Workflow · Proof · Gates · Rollout), [`.claude/skills/mde-writing-plans/SKILL.md`](../../../.claude/skills/mde-writing-plans/SKILL.md) (user stories + observable proof), and optionally [`.agents/skills/tasks-generator/SKILL.md`](../../../.agents/skills/tasks-generator/SKILL.md) (PRD → tasks).

| Layer | Intent |
|-------|--------|
| **Goal** | Typed CRM envelope prevents drift between UI and `p1-crm` edge. |
| **Workflow** | Types match edge response; tests lock shape. |
| **Proof** | Breaking change fails compile/tests. |
| **Gates** | JWT required on CRM calls. |
| **Rollout** | Consumers updated in same PR. |

---

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
