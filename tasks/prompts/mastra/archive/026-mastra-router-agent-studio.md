---
task_id: MASTRA-026
title: Mastra Router Agent Studio Registration
phase: MVP
priority: P0
status: Done
status_evidence: router-agent live at http://localhost:4111/api/agents. provider=google modelId=gemini-3.1-flash-lite. Registered in mastra/index.ts. PR #22 merged to main (05cd7a8) 2026-05-10. curl PASS.
estimated_effort: 1 day
area: mastra-agents
skill: [mde-task-lifecycle, mastra]
subagents: [backend, qa]
edge_function: none
schema_tables: [ai_tool_audit_events]
depends_on: [MASTRA-002, MASTRA-003, MASTRA-015, MASTRA-022, MASTRA-024]
blocks: [MASTRA-027, MASTRA-028, MASTRA-029]
verified_model_registry: 2026-05-10T13:49:30Z
model_candidates:
  fast_router: google/gemini-2.5-flash-lite
  fallback_fast_router: openai/gpt-5.4-nano
studio_target: http://localhost:4111/agents
---

<!-- task-summary -->
> **What:** Add `router-agent` to `my-mastra-app` and make it visible in Mastra Studio.
> **Why:** mdeAI needs a short, deterministic intent router before concierge or vertical agents answer users.
> **Delivers:** Router Agent, intent schema, routing workflow hook, and Studio/API verification.
> **Tools/Skills:** `mde-task-lifecycle` · `mastra`
> **MVP · P0 · Not Started · Effort: 1 day**

# Mastra Router Agent Studio Registration

## Easy Summary

**Purpose:** classify user intent and route to the right mdeAI workflow without producing long user-facing answers.

**Goals:** identify rental, event, restaurant, attraction, weather, support, and general concierge intents; return compact structured routing output; preserve follow-up context.

**Success criteria:** Mastra Studio and `/api/agents` show `router-agent`, and routing smoke tests prove it does not answer like the main concierge.

## Scope

Implement `router-agent` in `/home/sk/mde/my-mastra-app/src/mastra/agents/router-agent.ts` and register it in `/home/sk/mde/my-mastra-app/src/mastra/index.ts`.

The agent must:

- Use plain English instructions.
- Use Medellin-native context.
- Classify intent only.
- Return structured routing metadata, not long user-facing text.
- Ask at most one clarifying question only when routing cannot be determined.
- Preserve follow-up intent for phrases such as "show cheaper", "compare 1 and 3", or "when can I view".
- Never invent listings, events, restaurants, prices, hosts, URLs, or bookings.

## Official Mastra Agent Rules

Use the official Mastra agent pattern from `docs/agents/overview`:

- Import `Agent` from `@mastra/core/agent`.
- Create the agent with `id`, `name`, `instructions`, and a verified `provider/model-name`.
- Register the agent in `src/mastra/index.ts` through `new Mastra({ agents: { routerAgent, ... } })`.
- When calling this agent from workflows, tools, routes, or tests, retrieve it with `mastra.getAgentById("router-agent")` so it has access to shared storage, logger, observability, and registry services.
- Use this agent only for open-ended classification/routing decisions. For fixed routing execution, use `concierge-routing-workflow`.
- Keep tool descriptions and schemas concise if this agent receives tools later.
- Use Studio at `http://localhost:4111/agents` to inspect and test the registered agent.

## Model Rules

Use the installed provider registry before coding:

```bash
cd /home/sk/mde/my-mastra-app
node /home/sk/mde/.claude/skills/mastra/scripts/provider-registry.mjs --provider google
node /home/sk/mde/.claude/skills/mastra/scripts/provider-registry.mjs --provider openai
```

Current verified candidates from the installed registry:

| Use | Model ID | Why |
| --- | --- | --- |
| Router default | `google/gemini-2.5-flash-lite` | Fast, cheap, already compatible with the app's Ping Agent pattern |
| Router fallback | `openai/gpt-5.4-nano` | Fast OpenAI fallback if Google key/runtime is unavailable |

Do not guess model IDs. Re-run the registry script if dependency versions change.

## Acceptance Criteria

- [ ] `router-agent` is implemented with `id: "router-agent"`.
- [ ] `router-agent` is registered in `new Mastra({ agents: ... })`.
- [ ] Any runtime caller uses `mastra.getAgentById("router-agent")`, not a direct imported instance.
- [ ] Router output includes `intent`, `confidence`, `nextWorkflow`, `needsClarification`, and optional `clarifyingQuestion`.
- [ ] Router supports at least `rental`, `event`, `restaurant`, `attraction`, `weather`, `support`, and `general`.
- [ ] Router does not return multi-paragraph answers.
- [ ] Follow-up phrases use recent memory/context instead of resetting intent.
- [ ] Unknown intent asks one clarifying question.
- [ ] No direct Supabase access is added.
- [ ] No `SUPABASE_URL` or `SUPABASE_ANON_KEY` env dependency is added.
- [ ] Studio at `http://localhost:4111/agents` shows `router-agent`.

## Implementation Notes

- Prefer structured output or a strict schema where supported by the installed Mastra version.
- Keep Supabase as source of truth; the router only decides where to send work.
- If a mock tool or fallback is needed during local dev, mark outputs with `source: "mock"` visibly.
- Use `mastra.getAgentById("router-agent")` in workflow code rather than direct imports when shared runtime services matter.

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
curl -fsS http://localhost:4111/api/workflows | jq 'keys'
```

Browser proof:

- Open `http://localhost:4111/agents`.
- Confirm `router-agent` appears with Weather Agent and Ping Agent.

## Red Flags

- Router produces user-facing concierge answers.
- Router invents data instead of routing.
- Router loses context on "show cheaper" or "compare 1 and 3".
- Router requires Supabase env vars without importing `@supabase/supabase-js`.
