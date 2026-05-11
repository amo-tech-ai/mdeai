---
task_id: MASTRA-023
title: Mastra Replace Weather Demo With mdeAI Ping Router
phase: CORE
priority: P0
status: Superseded
estimated_effort: 1 day
area: mastra-runtime
skill: [mastra, mastra-smoke-test]
subagents: [backend]
edge_function: null
schema_tables: []
depends_on: [MASTRA-002, MASTRA-022]
blocks: [MASTRA-005, MASTRA-009, MASTRA-011]
---

<!-- task-summary -->
> **What:** Replace `weatherAgent`, `weatherWorkflow`, and weather scorers in `my-mastra-app` with mdeAI-safe ping/router fixtures.
> **Why:** The weather demo from the Mastra scaffold is still present. It has no business in production traces, scorers, or Studio output and creates demo-vs-real ambiguity.
> **Delivers:** `mdePingAgent` / `mdeRuntimeSmokeWorkflow` replacements, no-side-effect fixtures, runbook update, and proof Studio shows mdeAI agent/workflow names only.
> **Tools/Skills:** `mastra` · `mastra-smoke-test`
> **CORE · P0 · Not Started · Effort: 1 day**
> **Depends on:** MASTRA-002, MASTRA-022

# Mastra Replace Weather Demo With mdeAI Ping Router

## Easy Summary

**Purpose:** remove template/demo drift from the Mastra runtime.

**Goals:** replace weather agent/workflow/scorers with mdeAI-safe ping/router fixtures that do not call external tools.

**Success criteria:** Studio shows mdeAI agent/workflow names, smoke tests still pass, and no user-facing task depends on weather examples.

## Acceptance Criteria

- [ ] Replace `weatherAgent` with `mdePingAgent` or `mdeRouterSmokeAgent`.
- [ ] Replace `weatherWorkflow` with a no-side-effect `mdeRuntimeSmokeWorkflow`.
- [ ] Replace weather scorers with mdeAI smoke scorers or remove until `MASTRA-011`.
- [ ] Update runbook and smoke docs.
- [ ] Verify Studio/API with `npm run smoke:runtime`.

## Verification

```bash
cd /home/sk/mde/my-mastra-app
npm run smoke:runtime
rg -n "weather|get-weather" src/mastra || true
```

