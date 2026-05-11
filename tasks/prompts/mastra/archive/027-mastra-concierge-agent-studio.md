---
task_id: MASTRA-027
title: Mastra Concierge Agent Studio Registration
phase: MVP
priority: P0
status: Done
status_evidence: concierge-agent live at http://localhost:4111/api/agents. provider=google modelId=gemini-3.1-flash-lite. Working memory, clarification gate (confidence schema), search-rentals/events/restaurants/attractions tools. PR #22 merged to main (05cd7a8) 2026-05-10.
estimated_effort: 2 days
area: mastra-agents
skill: [mde-task-lifecycle, mastra, ai-chatbot]
subagents: [backend, qa]
edge_function: ai-chat
schema_tables: [conversations, messages, ai_tool_audit_events, mastra_threads, mastra_messages]
depends_on: [MASTRA-002, MASTRA-003, MASTRA-010, MASTRA-015, MASTRA-022, MASTRA-024, MASTRA-026]
blocks: [MASTRA-028, MASTRA-029]
verified_model_registry: 2026-05-10T13:49:30Z
model_candidates:
  concierge_reasoning: openai/gpt-5.4
  fallback_reasoning: openai/gpt-5.4-mini
studio_target: http://localhost:4111/agents
---

<!-- task-summary -->
> **What:** Add `concierge-agent` as the main mdeAI user-facing Medellin concierge.
> **Why:** Users need one chat surface that can remember follow-ups and coordinate rentals, events, restaurants, attractions, and support.
> **Delivers:** Concierge Agent with memory, safe tool access, routing workflow integration, and Studio proof.
> **Tools/Skills:** `mde-task-lifecycle` · `mastra` · `ai-chatbot`
> **MVP · P0 · Not Started · Effort: 2 days**

# Mastra Concierge Agent Studio Registration

## Easy Summary

**Purpose:** create the main user-facing Medellin AI concierge in Mastra Studio.

**Goals:** answer compactly, call approved read-only tools, remember follow-ups, and hand off risky actions.

**Success criteria:** `concierge-agent` appears in Studio, can handle multi-turn follow-ups, and does not invent listings, events, prices, hosts, URLs, or bookings.

## Scope

Implement `/home/sk/mde/my-mastra-app/src/mastra/agents/concierge-agent.ts` and register it in `/home/sk/mde/my-mastra-app/src/mastra/index.ts`.

The agent must cover:

- Rentals.
- Events.
- Restaurants.
- Attractions.
- Weather/context.
- General Medellin guidance.
- Follow-ups such as "show cheaper", "when can I view", and "compare 1 and 3".

## Official Mastra Agent Rules

Use the official Mastra agent pattern from `docs/agents/overview`:

- Import `Agent` from `@mastra/core/agent`.
- Create the agent with `id`, `name`, `instructions`, and a verified `provider/model-name`.
- Register the agent in `src/mastra/index.ts` through `new Mastra({ agents: { conciergeAgent, ... } })`.
- When calling this agent from workflows, tools, routes, or tests, retrieve it with `mastra.getAgentById("concierge-agent")` so it has access to shared storage, logger, observability, memory, and registry services.
- Use this agent for open-ended user-facing concierge conversation.
- Use workflows for deterministic multi-step control flow such as `concierge-routing-workflow`, `rental-search-workflow`, and `event-discovery-workflow`.
- Attach tools through the agent `tools` property using concise tool descriptions and typed schemas.
- Use memory only with a storage provider and pass both `resource` and `thread` when testing persistence.
- Use Studio at `http://localhost:4111/agents` to inspect tool calls, memory behavior, and responses.

## Model Rules

Use the installed provider registry before coding:

```bash
cd /home/sk/mde/my-mastra-app
node /home/sk/mde/.claude/skills/mastra/scripts/provider-registry.mjs --provider openai
```

Current verified candidates from the installed registry:

| Use | Model ID | Why |
| --- | --- | --- |
| Concierge default | `openai/gpt-5.4` | Stronger reasoning for cross-domain Medellin concierge answers |
| Concierge fallback | `openai/gpt-5.4-mini` | Lower-cost fallback for routine chats |

Do not use unverified model IDs.

## Acceptance Criteria

- [ ] `concierge-agent` is implemented with `id: "concierge-agent"`.
- [ ] `concierge-agent` is registered in `new Mastra({ agents: ... })`.
- [ ] Any runtime caller uses `mastra.getAgentById("concierge-agent")`, not a direct imported instance.
- [ ] Agent uses working memory / storage-backed memory so context does not reset.
- [ ] Memory calls use both `thread` and `resource` in runtime smoke coverage.
- [ ] Agent has access to approved tools: `search-rentals`, `search-events`, `search-restaurants`, `search-attractions`, `get-weather`, and `ping`.
- [ ] Agent returns max 5 cards/results per answer.
- [ ] Agent asks at most one clarifying question when required.
- [ ] Agent never claims a booking, ticket, showing, host response, price, URL, or availability unless a tool returned it.
- [ ] Agent creates drafts or handoffs for risky actions; it does not send WhatsApp, mutate Stripe, or write arbitrary DB rows.
- [ ] Studio at `http://localhost:4111/agents` shows `concierge-agent`.

## Implementation Notes

- Use `PostgresStore` through existing `DATABASE_URL`.
- Do not add `SUPABASE_URL` or `SUPABASE_ANON_KEY` unless code imports `@supabase/supabase-js`.
- Keep Supabase as source of truth; Mastra is runtime/orchestration only.
- If local placeholder tools are needed, they must return `source: "mock"` and be visibly marked as non-production.
- Use concise, Medellin-native instructions in plain English.

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
curl -fsS http://localhost:4111/api/agents/concierge-agent/generate \
  -H 'content-type: application/json' \
  --data '{"messages":"I need a furnished apartment in Laureles under $1500, then show cheaper options"}'
```

Browser proof:

- Open `http://localhost:4111/agents`.
- Confirm `concierge-agent` appears.
- Start a chat and verify follow-up context remains in the same intent.

## Red Flags

- Agent resets context on follow-up.
- Agent returns more than 5 cards.
- Agent invents availability or URLs.
- Agent directly imports Supabase for early MVP without an explicit task and boundary.
