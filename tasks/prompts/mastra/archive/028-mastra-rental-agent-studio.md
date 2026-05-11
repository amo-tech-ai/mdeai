---
task_id: MASTRA-028
title: Mastra Rental Agent Studio Registration
phase: MVP
priority: P0
status: Done
status_evidence: rental-agent live at http://localhost:4111/api/agents. provider=google modelId=gemini-3.1-pro-preview. searchRentalsTool live (queries Supabase apartments table). rentalSearchWorkflow returns 5 cards with sourceUrl+scheduleViewingUrl. PR #22 merged to main (05cd7a8) 2026-05-10.
estimated_effort: 2 days
area: mastra-rentals
skill: [mde-task-lifecycle, mastra, mde-real-estate]
subagents: [backend, qa]
edge_function: ai-chat
schema_tables: [apartments, leads, showings, ai_tool_audit_events]
depends_on: [MASTRA-002, MASTRA-003, MASTRA-004, MASTRA-015, MASTRA-022, MASTRA-024, MASTRA-026, MASTRA-027, MASTRA-030]
blocks: []
verified_model_registry: 2026-05-10T13:49:30Z
model_candidates:
  rental_default: openai/gpt-5.4-mini
  deterministic_rerank: local-logic
studio_target: http://localhost:4111/agents
---

<!-- task-summary -->
> **What:** Add `rental-agent` for Medellin rental search and explanation.
> **Why:** Rentals are the first high-intent mdeAI vertical and need a Studio-visible agent.
> **Delivers:** Rental Agent, `search-rentals` tool wiring, safe explanations, and Studio/API proof.
> **Tools/Skills:** `mde-task-lifecycle` · `mastra` · `mde-real-estate`
> **MVP · P0 · Not Started · Effort: 2 days**

# Mastra Rental Agent Studio Registration

## Easy Summary

**Purpose:** help users search Medellin rentals with grounded, explainable recommendations.

**Goals:** return best-fit listings, rejected options, price/neighborhood/WiFi notes, and viewing links only when tool data provides them.

**Success criteria:** `rental-agent` appears in Studio, uses `search-rentals`, and explains up to 5 results without inventing listings.

## Scope

Implement `/home/sk/mde/my-mastra-app/src/mastra/agents/rental-agent.ts` and the tool surface needed by `/home/sk/mde/my-mastra-app/src/mastra/tools/search-rentals.ts` or the existing shared tool registry.

The agent must:

- Search Medellin rentals.
- Explain best fit.
- Explain rejected options.
- Include price, neighborhood, WiFi, furnished status, pet fit, and viewing links only when present in tool output.
- Respect max 5 results.
- Ask one clarifying question if budget, dates, or neighborhood are missing and required.
- Create no booking or outbound message.

## Official Mastra Agent Rules

Use the official Mastra agent pattern from `docs/agents/overview`:

- Import `Agent` from `@mastra/core/agent`.
- Create the agent with `id`, `name`, `instructions`, and a verified `provider/model-name`.
- Register the agent in `src/mastra/index.ts` through `new Mastra({ agents: { rentalAgent, ... } })`.
- When calling this agent from workflows, tools, routes, or tests, retrieve it with `mastra.getAgentById("rental-agent")` so it has access to shared storage, logger, observability, and registry services.
- Use this agent for open-ended rental explanation and shortlist reasoning.
- Use `rental-search-workflow` for predetermined search, rerank, format, and audit steps.
- Attach `search-rentals` through the agent `tools` property with concise descriptions and typed input/output schemas.
- Keep deterministic reranking in local workflow/helper logic when structured data is enough.
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
| Rental explanation | `openai/gpt-5.4-mini` | Good enough for concise ranking explanations at lower cost |
| Candidate reranking | `local-logic` | Prefer deterministic scoring when fields are structured |

## Required Tool

`search-rentals`

Output must include `source`:

- `source: "supabase"` when returning real DB-backed data.
- `source: "mock"` only for explicit local placeholder data.

Do not silently mock rental data.

## Acceptance Criteria

- [ ] `rental-agent` is implemented with `id: "rental-agent"`.
- [ ] `rental-agent` is registered in `new Mastra({ agents: ... })`.
- [ ] Any runtime caller uses `mastra.getAgentById("rental-agent")`, not a direct imported instance.
- [ ] `search-rentals` is implemented or wired through the existing registry.
- [ ] `search-rentals` is visible in Studio Tools.
- [ ] Agent returns at most 5 rental cards.
- [ ] Agent explains why each recommended listing fits.
- [ ] Agent explains major rejected options when relevant.
- [ ] Agent never invents listing URLs, viewing links, prices, host names, or availability.
- [ ] Agent uses deterministic scoring/reranking where structured fields are enough.
- [ ] Studio at `http://localhost:4111/agents` shows `rental-agent`.

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
- Confirm `rental-agent` appears.
- Confirm Tools includes `search-rentals`.
- Run "furnished 1BR in Laureles under $1500 with strong WiFi" and verify grounded output.

## Red Flags

- More than 5 results.
- Unmarked mock data.
- Any direct DB write.
- Any autonomous WhatsApp/booking/showing action.
