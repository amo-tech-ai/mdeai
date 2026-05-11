---
task_id: MASTRA-031
title: Mastra Editor Prompt Architecture For mdeAI
phase: MVP
priority: P0
status: Not Started
estimated_effort: 1 day
area: mastra-editor
skill: [mde-task-lifecycle, mastra, ai-chatbot]
subagents: [backend, prompt-engineer, qa]
edge_function: none
schema_tables: [mastra_prompt_blocks, mastra_prompt_block_versions]
depends_on: [MASTRA-002, MASTRA-022, MASTRA-024, MASTRA-026, MASTRA-027, MASTRA-028, MASTRA-029, MASTRA-030]
blocks: [MASTRA-032, MASTRA-033, MASTRA-034, MASTRA-035]
verified_docs:
  - docs/editor/overview
  - docs/editor/prompts
  - reference/editor/mastra-editor
  - docs/agents/overview
  - docs/workflows/overview
verified_model_registry: 2026-05-10T13:49:30Z
studio_targets:
  - http://localhost:4111/agents
  - http://localhost:4111/prompts
---

<!-- task-summary -->
> **What:** Define the production prompt architecture for mdeAI using Mastra Editor and prompt blocks.
> **Why:** mdeAI needs reusable, versioned instructions that product/prompt teams can tune in Studio without redeploying code.
> **Delivers:** Folder structure, naming strategy, prompt registry pattern, versioning policy, and Studio workflow.
> **Tools/Skills:** `mde-task-lifecycle` · `mastra` · `ai-chatbot`
> **MVP · P0 · Not Started · Effort: 1 day**

# Mastra Editor Prompt Architecture For mdeAI

## Architecture Summary

Mastra Editor should manage reusable prompt content. Code remains the stable baseline:

```text
my-mastra-app/src/mastra/
  agents/
    router-agent.ts
    concierge-agent.ts
    rental-agent.ts
    event-agent.ts
    evaluation-agent.ts
  prompts/
    blocks/
      mde-brand-voice.md
      mde-rental-ranking.md
      mde-event-discovery.md
      mde-restaurant-concierge.md
      mde-followup-memory.md
      mde-safe-tool-usage.md
      mde-no-hallucinations.md
      mde-structured-card-format.md
      mde-routing-classifier.md
      mde-evaluation-agent.md
    registry.ts
    agent-instructions.ts
    types.ts
  scripts/
    seed-editor-prompts.ts
    preview-editor-prompts.ts
```

## Official Mastra Editor Rules

Verified against installed docs and types:

- Register `new MastraEditor()` in `src/mastra/index.ts`.
- Access it with `mastra.getEditor()`.
- Create prompt blocks with `editor.prompt.create()`.
- Update prompt blocks with `editor.prompt.update()`; each update creates a draft version.
- Preview composed instructions with `editor.prompt.preview(blocks, context)`.
- Reference reusable blocks from agent instructions with `{ type: "prompt_block_ref", id: "mde-brand-voice" }`.
- Use `{{variable}}` interpolation from variables or request context.
- Use display conditions for context-specific blocks.
- Treat published prompt versions as production; drafts are for testing.

## Prompt Block Strategy

| Layer | Block IDs | Purpose |
| --- | --- | --- |
| Global behavior | `mde-brand-voice`, `mde-safe-tool-usage`, `mde-no-hallucinations` | Applies to most agents |
| Conversation continuity | `mde-followup-memory` | Keeps "show cheaper", "compare 1 and 3", and "near Provenza" grounded |
| Domain expertise | `mde-rental-ranking`, `mde-event-discovery`, `mde-restaurant-concierge` | Domain-specific behavior |
| Output contracts | `mde-structured-card-format`, `mde-routing-classifier`, `mde-evaluation-agent` | Renderable UI and JSON contracts |

## Prompt Naming Conventions

- Prefix reusable mdeAI blocks with `mde-`.
- Use lowercase kebab-case IDs.
- Keep block IDs stable forever after publication.
- Put version details in metadata or Studio version history, not in the ID.
- Use domain names: `rental`, `event`, `restaurant`, `routing`, `evaluation`.

## Acceptance Criteria

- [ ] Create `/home/sk/mde/my-mastra-app/src/mastra/prompts/`.
- [ ] Add `/home/sk/mde/my-mastra-app/src/mastra/prompts/blocks/`.
- [ ] Add `/home/sk/mde/my-mastra-app/src/mastra/prompts/registry.ts`.
- [ ] Add `/home/sk/mde/my-mastra-app/src/mastra/prompts/agent-instructions.ts`.
- [ ] Add `/home/sk/mde/my-mastra-app/src/mastra/prompts/types.ts`.
- [ ] Document which prompt blocks attach to each agent.
- [ ] Keep prompt block content concise and modular.
- [ ] Do not place secrets or env values in prompt text.
- [ ] Do not make prompt blocks responsible for source-of-truth data.
- [ ] Studio Prompts tab can display seeded prompt blocks.

## Agent-To-Block Map

| Agent | Prompt blocks |
| --- | --- |
| `router-agent` | `mde-brand-voice`, `mde-no-hallucinations`, `mde-routing-classifier`, `mde-followup-memory` |
| `concierge-agent` | `mde-brand-voice`, `mde-safe-tool-usage`, `mde-no-hallucinations`, `mde-followup-memory`, `mde-structured-card-format` |
| `rental-agent` | `mde-brand-voice`, `mde-rental-ranking`, `mde-safe-tool-usage`, `mde-no-hallucinations`, `mde-structured-card-format`, `mde-followup-memory` |
| `event-agent` | `mde-brand-voice`, `mde-event-discovery`, `mde-safe-tool-usage`, `mde-no-hallucinations`, `mde-structured-card-format`, `mde-followup-memory` |
| `evaluation-agent` | `mde-no-hallucinations`, `mde-evaluation-agent` |

## Versioning Strategy

Use Mastra Editor lifecycle:

| Status | mdeAI use |
| --- | --- |
| Draft | Prompt experiments, internal QA, Spanish/English tone tests |
| Published | Production traffic |
| Archived | Rollback point |

Rules:

- Production agents load published versions by default.
- Staging smoke tests may load `status: "draft"`.
- Canary tests may pass `versionId`.
- Every prompt update must include a changelog note in metadata or seed manifest.
- Never edit code-defined fallback instructions until prompt block changes pass Studio and smoke tests.

## Verification

```bash
cd /home/sk/mde/my-mastra-app
npm run typecheck
npm run build
rm -rf .mastra/output
npm run smoke:runtime
MASTRA_DEV_NO_CACHE=1 npx mastra dev
```

Studio proof:

- Open `http://localhost:4111/prompts`.
- Confirm the ten `mde-*` prompt blocks exist.
- Open `http://localhost:4111/agents`.
- Confirm agent instructions use prompt block refs or stored Editor overrides.

## Red Flags

- Giant all-in-one prompts.
- Domain facts hardcoded in prompts instead of tools/Supabase.
- Prompt IDs that include version numbers.
- Prompt edits that bypass draft/publish review.
- Agents importing prompt block content directly after Studio ownership begins.
