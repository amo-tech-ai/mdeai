---
task_id: MASTRA-024
title: Mastra Env And Secret Boundary
phase: CORE
priority: P0
status: Not Started
estimated_effort: 1 day
area: mastra-security
skill: [mastra, mde-task-lifecycle]
subagents: [backend, security-auditor]
edge_function: null
schema_tables: []
depends_on: [MASTRA-002, MASTRA-022]
blocks: [MASTRA-003, MASTRA-019, MASTRA-020]
---

<!-- task-summary -->
> **What:** Define and enforce the Mastra env/secret boundary across local smoke, edge functions, and the Vite client bundle.
> **Why:** mdeAI ships rentals + events + restaurants + Paperclip approvals; one leaked service-role/Paperclip/OpenClaw key in a Vite bundle would be a P0 incident. The boundary needs to be explicit, scanned, and rotatable without touching git.
> **Delivers:** Documented env names per surface, denylist scan command, Vite-prefix allowlist enforcement, and a rotation runbook.
> **Tools/Skills:** `mastra` · `mde-task-lifecycle` · `mde-supabase`
> **CORE · P0 · Not Started · Effort: 1 day**
> **Depends on:** MASTRA-002, MASTRA-022

# Mastra Env And Secret Boundary

## Easy Summary

**Purpose:** prevent Mastra secrets from leaking into browser code, logs, task docs, or generated output.

**Goals:** define env ownership, local smoke env behavior, production env requirements, and denylist scans.

**Success criteria:** required server env names are documented, smoke uses temporary env files, and source/bundle scans find no secret values.

## Acceptance Criteria

- [ ] Document required local/prod env names.
- [ ] Document `DATABASE_URL` local smoke override behavior.
- [ ] Add denylist scan for service-role, Paperclip, OpenClaw, Infobip, Stripe, model API keys.
- [ ] Ensure Vite-visible envs use only allowed public prefixes.
- [ ] Add runbook for rotating or replacing env values without commits.

## Verification

```bash
cd /home/sk/mde
rg -n "(SERVICE_ROLE|PAPERCLIP|OPENCLAW|HAPI|STRIPE_SECRET|INFOBIP|DATABASE_URL)" src my-mastra-app/src tasks/prompts/mastra
cd /home/sk/mde/my-mastra-app
npm run smoke:runtime
```

