---
task_id: MASTRA-002
title: Mastra Core Runtime Scaffold
phase: CORE
priority: P0
status: Done
status_evidence: Mastra Studio running at localhost:4111. typecheck clean. build clean (~3s). 7 agents + 5 tools + 4 workflows registered. health endpoint live. Server-only env vars isolated from Vite bundle. Merged to main via PR #22 (05cd7a8) 2026-05-10. MASTRA-023 (weather removal) superseded — weather-agent is now a production feature, not a demo.
estimated_effort: 2 days
area: mastra-runtime
skill: [mde-task-lifecycle, mastra]
subagents: [backend]
edge_function: null
schema_tables: []
depends_on: [MASTRA-001]
blocks: [MASTRA-003, MASTRA-004, MASTRA-005]
---

<!-- task-summary -->
> **What:** Add the minimal Mastra runtime service for mdeAI with health, config validation, typed environment boundaries, and local tests.
> **Why:** mdeAI needs one AI application runtime before adding real estate, events, restaurants, OpenClaw, Hermes, or Paperclip workflows.
> **Delivers:** A small Mastra scaffold that can run locally without secrets in source control.
> **Tools/Skills:** `mde-task-lifecycle` · `mastra`
> **CORE · P0 · In Progress · Effort: 2 days**
> **Depends on:** MASTRA-001

# Mastra Core Runtime Scaffold

## Easy Summary

**Purpose:** create the smallest production-shaped Mastra runtime for mdeAI.

**Goals:** boot Mastra safely, validate server-only config, expose health, and create a place for agents/tools/workflows.

**Success criteria:** Mastra starts locally, health works without exposing secrets, and tests/build stay green.

**Production-ready checklist:**

- Use current Mastra docs or installed embedded docs before coding.
- TypeScript config supports Mastra's ES module requirements.
- Runtime has health and config validation.
- Server-only env vars never enter the Vite client bundle.
- Mastra Studio/local dev path is documented.

## Description

Create the first production-shaped Mastra runtime for mdeAI. The runtime must be small, typed, testable, and separate from irreversible business workflows.

Use installed package documentation from the repo before coding. Do not invent APIs from memory.

## Rationale

Mastra should own AI app orchestration, not Supabase source-of-truth writes, OpenClaw execution, or Paperclip governance. The scaffold establishes the boundary before agents and tools are added.

## User Stories

| Persona | Goal | Outcome |
| --- | --- | --- |
| Developer | run Mastra locally | I can test agents before production wiring |
| Operator | see a health endpoint | I can tell if AI runtime is alive |
| Security reviewer | see validated env boundaries | secrets do not leak into browser code |

## Acceptance Criteria

- [ ] Verify the installed Mastra version and local docs before implementation.
- [ ] Use the canonical Mastra runtime location `my-mastra-app/` (already scaffolded). Do not introduce `apps/mastra/` — that path was retired on 2026-05-10 after [05-audit.md §C row 3](../notes/05-audit.md).
- [ ] Add typed config loading that fails closed when required server-only env vars are missing.
- [ ] Add a health endpoint or health command that does not require model API keys.
- [ ] Add a no-op test agent or ping workflow that proves runtime boot without touching production data.
- [ ] Add npm scripts for local dev, typecheck/test, and health verification.
- [ ] Ensure no service role key or model key is exposed to the Vite client bundle.
- [ ] Document local startup in `/home/sk/mde/tasks/mastra/mastra-runtime-runbook.md`.

## Wiring Plan

| Layer | File | Action |
| --- | --- | --- |
| Package config | `my-mastra-app/package.json` | Add Mastra scripts/dependency only after docs verification |
| Runtime | `my-mastra-app/**` | Mastra app scaffold (already exists — verify, don't recreate) |
| Config | `my-mastra-app/src/mastra/config.ts` | Validate server-only env |
| Health | `my-mastra-app/src/mastra/public/health.ts` (already present) | Health proof, exposed via `npm run health` |
| Tests | `my-mastra-app/**/__tests__` or repo test home | Add runtime boot/config tests |
| Docs | `tasks/mastra/mastra-runtime-runbook.md` | Create startup and troubleshooting runbook |

## Edge Cases

| Scenario | Expected Behavior |
| --- | --- |
| Mastra package is not installed | Add exact dependency plan and install only through normal package manager |
| Env var missing | Health/config test fails with safe message and no secret output |
| Existing repo uses single-app layout | Keep scaffold minimal and document placement choice |
| Port conflict | Use configurable port with documented default |

## Real-World Examples

**Scenario 1 - local dev:** A developer runs the Mastra health command and gets a healthy response without connecting to WhatsApp, Stripe, or Paperclip.

**Scenario 2 - production boot:** A missing model key fails runtime startup cleanly and logs only the variable name, not the value.

## Outcomes

| Before | After |
| --- | --- |
| AI runtime exists only as plans | Mastra boots locally |
| Env boundaries are unclear | Server-only config is explicit |
| Future agents have no home | Agents and tools have a runtime folder |

## Verification

Run:

```bash
cd my-mastra-app
npm run typecheck
npm run build
npm run health
cd ..
rg -n "SUPABASE_SERVICE_ROLE_KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY|GEMINI_API_KEY" my-mastra-app src || true
```
