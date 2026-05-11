---
task_id: MASTRA-029
title: Mastra Event Agent Studio Registration
phase: MVP
priority: P0
status: Done
status_evidence: event-agent live at http://localhost:4111/api/agents. provider=google modelId=gemini-3-flash-preview. searchEventsTool + eventDiscoveryWorkflow live. PR #22 merged to main (05cd7a8) 2026-05-10.
estimated_effort: 2 days
area: mastra-events
skill: [mde-task-lifecycle, mastra]
subagents: [backend, qa]
edge_function: ai-chat
schema_tables: [events, tickets, ai_tool_audit_events]
depends_on: [MASTRA-002, MASTRA-003, MASTRA-004, MASTRA-015, MASTRA-022, MASTRA-024, MASTRA-026, MASTRA-027, MASTRA-030]
blocks: []
verified_model_registry: 2026-05-10T13:49:30Z
model_candidates:
  event_default: openai/gpt-5.4-mini
  deterministic_rerank: local-logic
studio_target: http://localhost:4111/agents
---

<!-- task-summary -->
> **What:** Add `event-agent` for Medellin event discovery.
> **Why:** Events are the second core mdeAI vertical and need grounded discovery in Studio.
> **Delivers:** Event Agent, `search-events` tool wiring, safe ticket language, and Studio/API proof.
> **Tools/Skills:** `mde-task-lifecycle` · `mastra`
> **MVP · P0 · Not Started · Effort: 2 days**

# Mastra Event Agent Studio Registration

## Easy Summary

**Purpose:** find Medellin events across nightlife, music, culture, food, sports, and tickets.

**Goals:** recommend up to 5 grounded event options and explain fit without pretending to sell tickets or guarantee availability.

**Success criteria:** `event-agent` appears in Studio, uses `search-events`, and routes ticket actions to deterministic backend or draft/approval flows.

## Scope

Implement `/home/sk/mde/my-mastra-app/src/mastra/agents/event-agent.ts` and the tool surface needed by `/home/sk/mde/my-mastra-app/src/mastra/tools/search-events.ts` or the existing shared tool registry.

The agent must:

- Support nightlife, music, culture, food, sports, and tickets.
- Return max 5 events.
- Include date/time, venue, neighborhood, ticket status, and URL only when tool output provides them.
- Ask one clarifying question if date, vibe, or location is required.
- Never claim purchase, guest list, refund, check-in, or ticket validity.

## Official Mastra Agent Rules

Use the official Mastra agent pattern from `docs/agents/overview`:

- Import `Agent` from `@mastra/core/agent`.
- Create the agent with `id`, `name`, `instructions`, and a verified `provider/model-name`.
- Register the agent in `src/mastra/index.ts` through `new Mastra({ agents: { eventAgent, ... } })`.
- When calling this agent from workflows, tools, routes, or tests, retrieve it with `mastra.getAgentById("event-agent")` so it has access to shared storage, logger, observability, and registry services.
- Use this agent for open-ended event preference reasoning and explanation.
- Use `event-discovery-workflow` for predetermined search, rerank, format, and audit steps.
- Attach `search-events` through the agent `tools` property with concise descriptions and typed input/output schemas.
- Keep deterministic ticket and availability logic outside the LLM.
- Use Studio at `http://localhost:4111/agents` to inspect tool calls and grounded responses.

## Model Rules

Use the installed provider registry before coding:

```bash
cd /home/sk/mde/my-mastra-app
node /home/sk/mde/.claude/skills/mastra/scripts/provider-registry.mjs --provider openai
```

Current verified candidates from the installed registry:

| Use | Model ID | Why |
| --- | --- | --- |
| Event explanation | `openai/gpt-5.4-mini` | Lower-cost event recommendation reasoning |
| Candidate reranking | `local-logic` | Prefer deterministic scoring when event metadata is structured |

## Required Tool

`search-events`

Output must include `source`:

- `source: "supabase"` when returning real DB-backed data.
- `source: "mock"` only for explicit local placeholder data.

Do not silently mock event data.

## Acceptance Criteria

- [ ] `event-agent` is implemented with `id: "event-agent"`.
- [ ] `event-agent` is registered in `new Mastra({ agents: ... })`.
- [ ] Any runtime caller uses `mastra.getAgentById("event-agent")`, not a direct imported instance.
- [ ] `search-events` is implemented or wired through the existing registry.
- [ ] `search-events` is visible in Studio Tools.
- [ ] Agent returns at most 5 event cards.
- [ ] Agent supports nightlife, music, culture, food, sports, and tickets.
- [ ] Agent never invents event URLs, prices, ticket availability, venues, or dates.
- [ ] Ticketing actions remain deterministic backend actions or handoff/draft flows.
- [ ] Studio at `http://localhost:4111/agents` shows `event-agent`.

## Verification

Run:

```bash
cd /home/sk/mde/my-mastra-app
npm run typecheck
npm run build
rm -rf .mastra/output
npm run smoke:runtime
MASTRA_DEV_NO_CACHE=1 npx mastra dev
```

Then verify:

```bash
curl -fsS http://localhost:4111/api/agents | jq 'keys'
curl -fsS http://localhost:4111/api/tools | jq 'keys'
curl -fsS http://localhost:4111/api/workflows | jq 'keys'
```

Browser proof:

- Open `http://localhost:4111/agents`.
- Confirm `event-agent` appears.
- Confirm Tools includes `search-events`.
- Run "music or nightlife events in Medellin this weekend" and verify grounded output.

## Red Flags

- Agent claims a ticket purchase or availability without a deterministic backend response.
- Agent invents venue/date/price data.
- Event tool returns mock results without `source: "mock"`.
