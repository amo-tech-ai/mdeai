---
task_id: MASTRA-015
title: Mastra Shared Tool Registry And Audit Wrapper
phase: CORE
priority: P0
status: Not Started
estimated_effort: 4 days
area: mastra-tooling-safety
skill: [mde-task-lifecycle, mastra, mde-supabase]
subagents: [backend, security-auditor]
edge_function: null
schema_tables: [ai_tool_audit_events, ai_tool_registry_definitions]
depends_on: [MASTRA-003, MASTRA-013, MASTRA-014]
blocks: []
---

<!-- task-summary -->
> **What:** Central registry describing every Mastra tool with governance metadata + runtime audit wrapper enforcing policy before execution.
> **Why:** Without a catalogue, approvals, rate limits (MASTRA-014), and OpenClaw gating drift per agent.
> **Delivers:** Registry module + risk classes + unified wrapper used by Mastra bootstrap.
> **Tools/Skills:** `mde-task-lifecycle` · `mastra` · `supabase`
> **CORE · P0 · Not Started · Effort: 4 days**
> **Depends on:** MASTRA-003, MASTRA-013, MASTRA-014

# Mastra Shared Tool Registry System

## Architectural rules

```text
Agents never register tools dynamically from LLM suggestions (no runtime self-expansion)
Hermes NEVER executes tools marked execution-only unless advisory-only façade
Tools that could touch OpenClaw MUST pass openclaw policy guard (explicit allow:false default)
Agents MUST NOT mutate Stripe/refunds/checkout — registry flags disallow
Agents MUST NOT call OpenClaw client libraries — flag `openclaw_allowed:false` hard fail
Reads vs writes flagged; writes require approvals per risk tier
Every invocation logs audit_events with registry snapshot hash (version tools)
```

## Files (preferred layout under Mastra service)

| File | Responsibility |
| --- | --- |
| `my-mastra-app/src/tools/registry.ts` | Authoritative declarative catalogue + exports |
| `my-mastra-app/src/tools/audit-wrapper.ts` | Pre/post hooks: audit ids, timings, sanitized args |
| `my-mastra-app/src/tools/risk-levels.ts` | Enum + mapping helpers (`low/med/high/critical`) |
| `my-mastra-app/src/tools/openclaw-policy.ts` | Validates OpenClaw-permitted tools subset (likely empty early MVP) |
| `my-mastra-app/src/tools/index.ts` | Aggregation + guarded `register*` used by Mastra instantiation |

Alternate path `/src/mastra/...` allowed if scaffold differs — MUST document final path in README snippet.

## Registry fields (minimum)

| Field | Description |
| --- | --- |
| `tool_name`, `domain` | Stable identifiers |
| `risk_level` | Ties escalation + Paperclip thresholds |
| `allowed_actor_roles` | e.g. `consumer`, `host`, `staff`, `sponsor_coord` |
| `approval_required` | bool |
| `idempotency_required` | bool |
| `audit_required` | bool (always true prod) |
| `openclaw_allowed` | bool — default **false** |
| `classification` | `read`, `write`, `draft`, `dangerous` |

## Persistence

Consider table `ai_tool_registry_definitions` for operator visibility + diff history (optional MVP if registry file alone insufficient — choose one source of runtime truth documented).

## Acceptance

1. All tools loaded in Mastra pass through audit wrapper CI assertion (unit scanning tests).
2. Attempt to execute `openclaw_allowed:true` without dual control fails review checklist.
3. Cross-reference MASTRA-003 events include `registry_version`/`tool_hash`.

## MCP reference

Tool composition patterns (`reference/tools/...`) consulted via Mastra MCP when implementing Mastra `@mastra/core` primitives.
