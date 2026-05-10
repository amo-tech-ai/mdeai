---
task_id: MASTRA-013
title: Mastra Tenant And Organization Isolation
phase: CORE
priority: P0
status: Not Started
estimated_effort: 4 days
area: mastra-security-rls
skill: [mde-task-lifecycle, mde-supabase]
subagents: [backend, supabase-auditor, security-auditor]
edge_function: null
schema_tables: [workflow_runs, workflow_steps, ai_tool_audit_events, ai_control_events, ai_recommendation_drafts, workflow_failures, workflow_approvals]
depends_on: [MASTRA-002, MASTRA-012, MASTRA-003]
blocks: []
---

<!-- task-summary -->
> **What:** Enforce mandatory `organization_id` (tenant) presence and RLS for all Mastra-affected rows: workflows, audits, drafts, approvals, failures.
> **Why:** Marketplace data must never cross tenants; concierge tools must refuse ambiguous context.
> **Delivers:** Policies, JWT claims/`organization_members` linkage, Mastra RequestContext/header contract tests.
> **Tools/Skills:** `mde-task-lifecycle` · `supabase`
> **CORE · P0 · Not Started · Effort: 4 days**
> **Depends on:** MASTRA-002, MASTRA-012, MASTRA-003

# Mastra Tenant And Organization Isolation

## Architectural rules

```text
Every workflow row MUST have organization_id
Every audit (`ai_tool_audit_events`) MUST have organization_id once column exists — backfill migration if adding column
Every draft MUST have organization_id (align `ai_recommendation_drafts`)
Every approval record MUST carry organization_id
All Mastra-side tools REQUIRE tenant context injected before execution (server-side middleware)
Hermes/OpenClaw never substitute tenant derivation for Supabase authoritative membership
Agents NEVER issue raw SQL; reads go through parameterized RPC/views only
```

## Easy summary

Treat `organization_id` as a mandatory capability token derived from authenticated membership, not LLM guesses.

## Enforcement layers

| Layer | Must do |
| --- | --- |
| Supabase JWT / session | Embed or resolve `organization_id` for active tenant |
| Edge / Mastra gateway | Reject requests missing tenant context (`400 TENANT_REQUIRED`) |
| Tool runtime | Wrapper validates `organization_id` matches JWT before side effects |
| RLS | `select auth.uid()` + membership join predicates; forbid cross-org reads |

## Tests

Include **RLS suites** covering:

1. Authenticated Org A cannot `select/update` Org B workflows or audits.
2. Service-role paths used ONLY by audited gateway—not exposed to Mastra unconstrained prompts.
3. Draft + approval linkage respects same org.

## Acceptance

- Column + policy rollout plan for any legacy tables lacking `organization_id`.
- Automated tests in CI enforcing regression on cross-tenant read attempts (`throws`/`0 rows`).
- Developer doc for RequestContext/header keys consumed by `@/lib/mastra/client` after MASTRA-019.

## Dependencies downstream

Unlocks MASTRA-019 (client propagation), MASTRA-014 budgets (per-org quotas), vertical MVPs (`MASTRA-006`-`008`) hardening.
