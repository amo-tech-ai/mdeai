---
task_id: MASTRA-016
title: Mastra Streaming UI State Contracts
phase: MVP
priority: P1
status: Not Started
estimated_effort: 3 days
area: mastra-frontend-streaming
skill: [mde-task-lifecycle, mastra]
subagents: [frontend]
edge_function: null
schema_tables: []
depends_on: [MASTRA-005, MASTRA-009, MASTRA-019, MASTRA-011, MASTRA-018]
blocks: []
---

<!-- task-summary -->
> **What:** Define streaming UI states for concierge chat: partial deltas, tools, approvals, errors, retries, cards, pending handoffs, generative UI surfaces.
> **Why:** SSE/stream behaviour must be deterministic so React surfaces don’t regress when adding workflows + Paperclip approvals.
> **Delivers:** State-machine doc + typings + parity evaluation vs AI SDK / UI Dojo patterns.
> **Tools/Skills:** `mde-task-lifecycle` · `mastra`
> **MVP · P1 · Not Started · Effort: 3 days**
> **Depends on:** MASTRA-005, MASTRA-009, MASTRA-019, MASTRA-011, MASTRA-018

# Mastra Streaming UI State Contracts

## Architectural rules

```text
Browser never parses privileged approval payloads verbatim — hydrate via signed summaries from gateway
Hermes/OpenClaw do not mutate UI Redux/local state directly; only Mastra/normalized SSE events allowed
Agents never stream raw Stripe objects or tenant cross-leak payloads
Approval waiting states sanitize external IDs (opaque tokens only)
```

## Easy summary

Document canonical stream chunk phases consumable by the React/Vite frontend after MASTRA-019 client integration.

## Required UI states

| State | Behaviour |
| --- | --- |
| Partial response | Concatenate incremental assistant tokens with abort support |
| Tool loading | Indicate tool name (+ risk hue per MASTRA-015 metadata if forwarded) |
| Tool result | Render structured payloads into cards/maps/listings consistently |
| Approval waiting | Locked composer + CTA routed to governance review screen |
| Error | Recoverable vs fatal distinctions; escalate MASTRA-018 when configured |
| Retry | User-visible manual retry respecting MASTRA-014 counters |
| Handoff | Dedicated surfaces for WhatsApp escalation / sponsor approval |
| Card rendering | Map pin + listing/event/restaurant schemas documented |
| Generative UI | Slot pattern for streamed component descriptors (coordinate with `@mastra-ai/ui-dojo`) |

## Pattern comparison matrix (must deliver)

Evaluate **mastra-ai/ui-dojo** vs:

- AI SDK `@ai-sdk/react` streaming primitives
- Mastra Responses / Conversations client helpers (`reference/client-js/*`)

Document trade-offs (SSR constraints, suspense, suspense fallbacks vs Vite CSR).

## Acceptance

1. Storybook/visual harness or Cypress component tests covering each state badge.
2. Contract JSON schema (`zod`) checked into repo docs (recommended: `docs/mastra/streaming-contract.schema.json`; avoid blocking on exact path).
3. Documented downgrade path when hard-stop rate limit fires (shows operator message templates).
