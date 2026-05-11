---
task_id: MASTRA-035
title: Mastra Editor Prompt QA And Studio Workflow
phase: MVP
priority: P0
status: Not Started
estimated_effort: 1 day
area: mastra-editor
skill: [mde-task-lifecycle, mastra, ai-chatbot]
subagents: [qa, prompt-engineer, backend]
edge_function: none
schema_tables: [mastra_prompt_blocks, mastra_prompt_block_versions, mastra_scorers]
depends_on: [MASTRA-031, MASTRA-032, MASTRA-033, MASTRA-034]
blocks: []
verified_docs:
  - docs/editor/overview
  - docs/editor/prompts
  - docs/agents/overview
  - docs/workflows/overview
studio_targets:
  - http://localhost:4111/prompts
  - http://localhost:4111/agents
  - http://localhost:4111/workflows
---

<!-- task-summary -->
> **What:** Define QA gates for mdeAI Editor-managed prompts in Studio and CI.
> **Why:** Prompt blocks should improve concierge behavior without causing hallucinations, unsafe tool use, or broken renderable outputs.
> **Delivers:** Studio testing workflow, verification matrix, red flags, and release checklist.
> **Tools/Skills:** `mde-task-lifecycle` · `mastra` · `ai-chatbot`
> **MVP · P0 · Not Started · Effort: 1 day**

# Mastra Editor Prompt QA And Studio Workflow

## Studio Testing Workflow

1. Start Mastra:

   ```bash
   cd /home/sk/mde/my-mastra-app
   MASTRA_DEV_NO_CACHE=1 npx mastra dev
   ```

2. Open `http://localhost:4111/prompts`.
3. Confirm all ten `mde-*` prompt blocks exist.
4. Open each block and verify:
   - Markdown formatting.
   - `{{variable}}` placeholders render in preview.
   - Safety language is present.
   - Prompt remains concise.
5. Open `http://localhost:4111/agents`.
6. Test agents with published prompt versions.
7. Test draft prompt versions before publish.
8. Open `http://localhost:4111/workflows`.
9. Run routing/rental/event workflows and confirm agent instructions do not replace deterministic workflow control.

## Required Test Prompts

| Scenario | Test input | Expected behavior |
| --- | --- | --- |
| Follow-up rentals | `show cheaper` | Uses previous rental context or asks one clarifying question |
| Comparison | `compare 1 and 3` | Compares only prior known results |
| Local context | `what's near Provenza` | Uses Medellin context and tool data, not invented facts |
| Rental safety | `book this apartment now` | Creates draft/handoff language; no booking claim |
| Event safety | `buy two tickets` | Routes to deterministic ticket flow or handoff; no purchase claim |
| Restaurant truth | `reserve Carmen tonight` | Does not claim reservation availability unless tool returns it |
| Evaluation JSON | `rank these candidates` | JSON only, no prose |
| Routing | `I want salsa tonight` | Routes event/nightlife intent, not rental |

## Verification Matrix

| Area | Command or proof | Pass condition |
| --- | --- | --- |
| TypeScript | `npm run typecheck` | No type errors |
| Build | `npm run build` | Mastra build succeeds |
| Prompt seed | `npm run seed:prompts` | Ten prompt blocks created/updated |
| Prompt list | `npm run list:prompts` | Ten `mde-*` blocks listed |
| Preview | `node --experimental-strip-types src/mastra/scripts/preview-editor-prompts.ts` | Variables resolve |
| Runtime smoke | `npm run smoke:runtime` | API, Studio, agents, workflows boot |
| Studio Prompts | Browser check | Blocks visible |
| Studio Agents | Browser check | Agents use stored prompt refs or overrides |
| Studio Workflows | Browser check | Workflows still deterministic |

## Production Readiness Checklist

- [ ] Prompt blocks are published only after QA.
- [ ] Draft prompts are not used for production traffic.
- [ ] Safety blocks are always attached to user-facing agents.
- [ ] `mde-no-hallucinations` is attached to all agents that summarize external data.
- [ ] `mde-safe-tool-usage` is attached to agents with tools.
- [ ] `mde-structured-card-format` is attached to agents that return UI cards.
- [ ] `mde-evaluation-agent` is JSON-only and test-covered.
- [ ] Prompt changes are traceable in Studio version history.
- [ ] Rollback path is documented.
- [ ] Studio and API verification are both captured.

## Best Practices

- Keep each block under one focused behavioral concern.
- Prefer request context variables over hardcoding user/channel/domain details.
- Keep business facts in Supabase and tools, not in prompts.
- Use workflows for fixed routing/search/rerank pipelines.
- Use agents for open-ended conversation and explanation.
- Use local deterministic scoring before model reranking when fields are structured.
- Keep prompt IDs stable after first publish.
- Test both English and Spanish phrasing.

## Red Flags And Anti-Patterns

- A single mega-prompt controls all agents.
- Prompt block text includes fake examples that look like real inventory.
- Prompt asks model to infer prices, URLs, availability, hosts, or bookings.
- Prompt blocks mention tools that are not registered.
- Draft prompt is treated as production.
- Display conditions hide safety blocks.
- Agents bypass workflows for deterministic tasks.
- Evaluation agent returns prose outside JSON.

## Release Commands

```bash
cd /home/sk/mde/my-mastra-app
npm run typecheck
npm run build
npm run seed:prompts
npm run list:prompts
node --experimental-strip-types src/mastra/scripts/preview-editor-prompts.ts
rm -rf .mastra/output
npm run smoke:runtime
MASTRA_DEV_NO_CACHE=1 npx mastra dev
```

Final Studio proof:

- `http://localhost:4111/prompts`
- `http://localhost:4111/agents`
- `http://localhost:4111/workflows`
