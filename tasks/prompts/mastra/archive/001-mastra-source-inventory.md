---
task_id: MASTRA-001
title: Mastra Source Inventory And Safety Baseline
phase: CORE
priority: P0
status: Complete
status_evidence: my-mastra-app/ scaffold + @mastra/core 1.32.1 inventory verified 2026-05-10 (notes/05-audit.md §B.1, notes/06-checklist.md §C.1).
estimated_effort: 1 day
area: mastra-foundation
skill: [mde-task-lifecycle, roadmap-planning]
subagents: [backend, supabase-auditor]
edge_function: null
schema_tables: [ai_control_events, ai_tool_audit_events, apartments, events, restaurants, conversations]
depends_on: []
blocks: [MASTRA-002, MASTRA-003, MASTRA-004, MASTRA-005, MASTRA-006, MASTRA-007, MASTRA-008]
---

<!-- task-summary -->
> **What:** Inventory the active mdeAI code, Supabase schema, edge functions, and agent/runtime surfaces before adding Mastra.
> **Why:** The roadmap spans chat, real estate, events, restaurants, vector search, OpenClaw, Hermes, Paperclip, and Postiz. New Mastra work must start from verified repo/runtime state, not plan assumptions.
> **Delivers:** A written source-of-truth inventory with gaps, blockers, and safe implementation order.
> **Tools/Skills:** `mde-task-lifecycle` · `roadmap-planning`
> **CORE · P0 · Complete · Effort: 1 day**

# Mastra Source Inventory And Safety Baseline

## Easy Summary

**Purpose:** make sure the real codebase, Supabase schema, edge functions, and live service assumptions are known before anyone builds Mastra features.

**Goals:** find what already exists, find what is missing, identify blockers, and create a clean source-of-truth report.

**Success criteria:** the report names every P0 blocker, includes commands/proof, and contains no secrets.

**Production-ready checklist:**

- Repo inventory complete.
- Supabase local and remote state checked or blocked explicitly.
- Events ticketing, restaurants, real estate, chat, vector, OpenClaw, Hermes, Paperclip, and Postiz surfaces reviewed.
- Secret hygiene verified.
- Downstream Mastra tasks updated if the inventory changes assumptions.

## Description

Create the baseline evidence pack for the Mastra rollout. Verify which chat, rental, event, restaurant, vector, OpenClaw, Hermes, Paperclip, and Postiz pieces actually exist in the repo and Supabase catalog before implementation starts.

This task is read-only except for writing the inventory report.

## Rationale

Mastra will become the AI application runtime. If it is connected before the existing backend boundaries are reconciled, it can duplicate edge-function logic, bypass RLS, or trigger unsafe side effects.

## User Stories

| Persona | Goal | Outcome |
| --- | --- | --- |
| Developer | know which tables and edge functions exist | I can wire Mastra to real APIs only |
| Operator | see known blockers before automation | I do not trust fake green status |
| Auditor | see safety boundaries documented | AI writes can be reviewed before launch |

## Acceptance Criteria

- [ ] Produce `/home/sk/mde/tasks/mastra/mastra-source-inventory.md`.
- [ ] Inventory local source files for chat, rentals, events, restaurants, vector search, OpenClaw, Hermes, Paperclip, and Postiz.
- [ ] Inventory local Supabase migrations and edge functions relevant to those domains.
- [ ] Verify remote Supabase table/function presence if project access is available; otherwise document the exact blocked verification.
- [ ] Identify mismatches between `mastra-roadmap.md` and active repo/runtime state.
- [ ] List P0 blockers for Mastra core, real estate MVP, events MVP, and restaurants MVP.
- [ ] Confirm no `.env`, `.env.local`, `.env.paperclip`, or API tokens are printed into the report.
- [ ] Include exact commands run and sanitized proof outputs.

## Wiring Plan

| Layer | File | Action |
| --- | --- | --- |
| Docs | `tasks/mastra/mastra-source-inventory.md` | Create baseline inventory report |
| Repo audit | `src/`, `supabase/`, `tasks/prompts/` | Read-only inventory |
| Supabase audit | Remote catalog queries if available | Read-only verification |
| Roadmap | `tasks/mastra/mastra-roadmap.md` | Reference but do not rewrite unless new blockers require it |

## Edge Cases

| Scenario | Expected Behavior |
| --- | --- |
| Supabase access unavailable | Document exact command/tool failure and continue with local inventory |
| Local docs mention non-existent functions | Mark as gap and block downstream task |
| Secret-like values appear in command output | Redact before saving |
| Git worktree has unrelated changes | Do not modify or revert them |

## Real-World Examples

**Scenario 1 - events gap:** If docs say `ticket-payment-webhook` exists but local repo lacks it, the inventory marks Events MVP as blocked until reconciliation.

**Scenario 2 - vector gap:** If VDB tasks exist but RPCs are absent, Mastra search tools depend on `VDB-01`.

## Outcomes

| Before | After |
| --- | --- |
| Mastra plan depends on mixed assumptions | Implementation begins from verified state |
| Events/restaurant readiness is ambiguous | Blockers are explicit |
| AI safety tables may or may not exist | Audit/control requirements are confirmed |

## Verification

Run:

```bash
test -f /home/sk/mde/tasks/mastra/mastra-source-inventory.md
rg -n "P0 Blockers|Commands Run|Secret Hygiene" /home/sk/mde/tasks/mastra/mastra-source-inventory.md
rg -n "(API_KEY|TOKEN|SECRET_KEY|SERVICE_ROLE_KEY)=['"]?[^ '"|]+" /home/sk/mde/tasks/mastra/mastra-source-inventory.md || true
```
