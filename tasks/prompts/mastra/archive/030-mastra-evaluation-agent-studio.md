---
task_id: MASTRA-030
title: Mastra Evaluation Agent Studio Registration
phase: MVP
priority: P0
status: Done
status_evidence: evaluation-agent live at http://localhost:4111/api/agents. provider=google modelId=gemini-3.1-flash-lite. Registered in mastra/index.ts. PR #22 merged to main (05cd7a8) 2026-05-10.
estimated_effort: 1 day
area: mastra-evals
skill: [mde-task-lifecycle, mastra]
subagents: [backend, qa]
edge_function: none
schema_tables: [ai_tool_audit_events, mastra_scorers]
depends_on: [MASTRA-002, MASTRA-003, MASTRA-011, MASTRA-015, MASTRA-022, MASTRA-024]
blocks: [MASTRA-028, MASTRA-029]
verified_model_registry: 2026-05-10T13:49:30Z
model_candidates:
  evaluation_fallback: openai/gpt-5.4-mini
  preferred_rerank: local-logic
studio_target: http://localhost:4111/agents
---

<!-- task-summary -->
> **What:** Add `evaluation-agent` for structured JSON reranking and "Best for" labels.
> **Why:** Rentals and events need explainable, reproducible ranking without letting the user-facing agents invent facts.
> **Delivers:** Evaluation Agent, deterministic local rerank preference, JSON-only contract, and Studio proof.
> **Tools/Skills:** `mde-task-lifecycle` · `mastra`
> **MVP · P0 · Not Started · Effort: 1 day**

# Mastra Evaluation Agent Studio Registration

## Easy Summary

**Purpose:** rerank rental/event candidates and assign "Best for" labels.

**Goals:** produce structured JSON only, prefer deterministic local logic, and provide a fallback model path for ambiguous scoring.

**Success criteria:** `evaluation-agent` appears in Studio and returns schema-valid JSON with no prose.

## Scope

Implement `/home/sk/mde/my-mastra-app/src/mastra/agents/evaluation-agent.ts` and any deterministic helper under `/home/sk/mde/my-mastra-app/src/mastra/evaluation/` or `/home/sk/mde/my-mastra-app/src/mastra/tools/`.

The agent must:

- Rerank rental candidates.
- Rerank event candidates.
- Assign concise "Best for" labels.
- Output structured JSON only.
- Never invent facts not present in candidate inputs.
- Prefer deterministic local scoring when structured metadata is enough.

## Official Mastra Agent Rules

Use the official Mastra agent pattern from `docs/agents/overview`:

- Import `Agent` from `@mastra/core/agent`.
- Create the agent with `id`, `name`, `instructions`, and a verified `provider/model-name` only if model fallback is needed.
- Register the agent in `src/mastra/index.ts` through `new Mastra({ agents: { evaluationAgent, ... } })`.
- When calling this agent from workflows, tools, routes, or tests, retrieve it with `mastra.getAgentById("evaluation-agent")` so it has access to shared storage, logger, observability, and registry services.
- Use this agent only for ambiguous open-ended fit labeling.
- Use deterministic helper functions or workflows for fixed scoring/ranking steps.
- Keep output structured and renderable by the UI; no prose outside JSON.
- Use Studio at `http://localhost:4111/agents` to inspect schema behavior.

## Model Rules

Use deterministic local logic first. Only call a model when semantic tie-breaking is needed.

Before coding fallback model use, run:

```bash
cd /home/sk/mde/my-mastra-app
node /home/sk/mde/.claude/skills/mastra/scripts/provider-registry.mjs --provider openai
```

Current verified candidates from the installed registry:

| Use | Model ID | Why |
| --- | --- | --- |
| Preferred rerank | `local-logic` | Reproducible and cheaper for structured rental/event fields |
| Fallback evaluator | `openai/gpt-5.4-mini` | Good enough for ambiguous natural-language fit labels |

## JSON Contract

Return JSON only:

```json
{
  "ranked": [
    {
      "id": "string",
      "rank": 1,
      "score": 0.92,
      "bestFor": ["quiet stay", "strong WiFi"],
      "reasons": ["Matched Laureles", "Within budget"],
      "risks": ["No pet policy found"]
    }
  ],
  "rejected": [
    {
      "id": "string",
      "reason": "Over budget"
    }
  ]
}
```

## Acceptance Criteria

- [ ] `evaluation-agent` is implemented with `id: "evaluation-agent"`.
- [ ] `evaluation-agent` is registered in `new Mastra({ agents: ... })`.
- [ ] Any runtime caller uses `mastra.getAgentById("evaluation-agent")`, not a direct imported instance.
- [ ] Agent returns structured JSON only.
- [ ] Invalid candidate input returns structured error JSON, not prose.
- [ ] Deterministic scoring handles price, neighborhood, date, category, WiFi, pets, and availability fields where present.
- [ ] "Best for" labels are based only on input fields.
- [ ] Evaluation helper is covered by unit tests or smoke tests.
- [ ] Studio at `http://localhost:4111/agents` shows `evaluation-agent`.

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
curl -fsS http://localhost:4111/api/agents/evaluation-agent/generate \
  -H 'content-type: application/json' \
  --data '{"messages":"Rank these candidates as JSON only: [{\"id\":\"a\",\"price\":1200,\"neighborhood\":\"Laureles\",\"wifiMbps\":200},{\"id\":\"b\",\"price\":1700,\"neighborhood\":\"Poblado\"}]"}' \
  | jq .
```

Browser proof:

- Open `http://localhost:4111/agents`.
- Confirm `evaluation-agent` appears.
- Confirm a sample run returns JSON only.

## Red Flags

- Any prose outside JSON.
- Labels not supported by candidate fields.
- Model call used where local deterministic scoring was enough.
- Evaluation agent writes to Supabase directly.
