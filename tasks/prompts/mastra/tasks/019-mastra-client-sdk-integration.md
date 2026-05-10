---
task_id: MASTRA-019
title: Mastra Client SDK Integration Layer
phase: MVP
priority: P0
status: Not Started
estimated_effort: 3 days
area: mastra-frontend-gateway
skill: [mde-task-lifecycle, mastra, mde-supabase]
subagents: [frontend, backend, security-auditor]
edge_function: null
schema_tables: []
depends_on: [MASTRA-002, MASTRA-005, MASTRA-013]
blocks: []
---

<!-- task-summary -->
> **What:** Add a typed browser-facing integration layer around Mastra for `mdeai-co` (`src/lib/mastra/client.ts`), using official `@mastra/client-js` semantics where applicable.
> **Why:** Frontend must stop ad hoc `fetch` to Mastra, centralize retries/headers/streaming/errors, and keep secrets off the browser (see MCP reference: `reference/client-js/mastra-client`, `reference/client-js/workflows`).
> **Delivers:** Single client wrapper + auth/context propagation + streaming + workflow helpers + approval-state typing.
> **Tools/Skills:** `mde-task-lifecycle` · `mastra` · `supabase`
> **MVP · P0 · Not Started · Effort: 3 days**
> **Depends on:** MASTRA-002, MASTRA-005, MASTRA-013
<!-- Note: original spec asked for MASTRA-010 filename; repo already uses MASTRA-010 for memory/RAG → this task is MASTRA-019 -->

# Mastra Client SDK Integration Layer

## Architectural rules (must never regress)

```text
Mastra = orchestration runtime
Supabase = source of truth
OpenClaw = execution only
Paperclip = approvals/governance
Hermes = advisory reasoning/ranking
Agents must NEVER write DB directly · NEVER unrestricted SQL · NEVER mutate Stripe · NEVER call OpenClaw directly
Actions go through typed tools, audited gateway, idempotency, approvals
Browser must NEVER hold service_role, OpenClaw, Paperclip server tokens, Shopify admin, Gadget secrets
```

## Easy summary

**Purpose:** one sanctioned path from Vite/React to Mastra APIs for agents, workflows, and streaming UX.

**Official surface (verify installed version via Mastra MCP / embedded docs):**

- `@mastra/client-js` — `MastraClient` (`baseUrl`, `headers`, `retries`, `backoffMs`, `maxBackoffMs`, `credentials`)
- `RequestContext` for propagation of IDs (map to mdeAI tenant/user after MASTRA-013)
- `getAgent()`, `agent.generate()`, stream variants per deployed Mastra Server contract
- `getWorkflow()`, `createRun()`, `stream()`, `startAsync()`, `resume*`, `cancel`, `runById()` (see MCP `reference/client-js/workflows`)

**Deliverables:**

| Path | Role |
| --- | --- |
| `src/lib/mastra/client.ts` | Factory: returns configured client singleton or scoped instance |
| Typed wrapper exports | Narrow methods mdeAI needs (agents, workflows, observability hooks if any) |

**Must include:**

- Typed client wrapper around `MastraClient` configuration
- Auth header handling: derive **short-lived Supabase JWT** (or gateway-issued opaque token from a **BFF/edge proxy** — choose one documented pattern); never embed secrets in bundles
- Streaming calls with abort/cancel propagation and backoff policies aligned with Mastra SDK defaults (`retries`, `backoffMs`, `maxBackoffMs`)
- Workflow calls wrapping `createRun` / `stream` / resume paths; map `runId` to Supabase `workflow_runs` (MASTRA-012)
- Error taxonomy: classify network vs Mastra HTTP vs policy (rate limit MASTRA-014) vs `approval_pending`
- Retry strategy: exponential backoff respecting `retry-after` headers when exposed
- Approval-state support: parse structured machine-readable states emitted by concierge/router (coordinate with Paperclip identifiers)
- **No secrets exposed to browser**: `baseUrl` must point at **public Mastra ingress** or BFF — no service role keys, no Paperclip/OpenClaw privates

## Dependencies

| Upstream | Why |
| --- | --- |
| MASTRA-002 | Running Mastra server / deploy boundary |
| MASTRA-005 | Stable agent IDs and concierge contracts |
| MASTRA-013 | Mandatory `organization_id` / tenant context in `RequestContext` or headers |

## Acceptance criteria

1. Frontend code paths that talk to Mastra import from `@/lib/mastra/client` (or documented alias), not scattered `fetch`.
2. At least one E2E or integration test proving token attachment + mocked Mastra ingress (Vitest/playwright harness acceptable).
3. Streaming path demonstrated for one agent workflow (fixture or staging).
4. Approval-required flows render safe placeholders without leaking privileged approval URLs or Paperclip secrets.
5. Bundle / source scan proves absence of forbidden env keys (`SERVICE_ROLE`, `OPENCLAW`, `PAPERCLIP` server tokens).

## Verification

```bash
rg "new MastraClient|fetch\\(.*mastra|MastraClient" src --glob '!**/lib/mastra/**'
npm run lint && npm run test
```
