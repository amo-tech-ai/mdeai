---
task_id: MASTRA-034
title: Mastra Editor Runtime Preview And Request Context
phase: MVP
priority: P0
status: Not Started
estimated_effort: 1 day
area: mastra-editor
skill: [mde-task-lifecycle, mastra, ai-chatbot]
subagents: [backend, qa]
edge_function: none
schema_tables: [mastra_prompt_blocks, mastra_prompt_block_versions]
depends_on: [MASTRA-031, MASTRA-032, MASTRA-033]
blocks: [MASTRA-035]
verified_docs:
  - docs/editor/prompts
  - docs/server/request-context
  - reference/editor/mastra-editor
studio_targets:
  - http://localhost:4111/prompts
  - http://localhost:4111/agents
---

<!-- task-summary -->
> **What:** Add runtime preview examples for prompt blocks, variables, request context, and display conditions.
> **Why:** mdeAI needs proof that Editor-managed prompts resolve correctly before agents use them in production.
> **Delivers:** Preview script, requestContext examples, display condition examples, and draft/published testing workflow.
> **Tools/Skills:** `mde-task-lifecycle` · `mastra` · `ai-chatbot`
> **MVP · P0 · Not Started · Effort: 1 day**

# Mastra Editor Runtime Preview And Request Context

## Scope

Create:

- `/home/sk/mde/my-mastra-app/src/mastra/scripts/preview-editor-prompts.ts`
- `/home/sk/mde/my-mastra-app/src/mastra/prompts/agent-instructions.ts`
- request context examples for routing, language, domain, and risk.

## Prompt Block Ref Pattern

Create `/home/sk/mde/my-mastra-app/src/mastra/prompts/agent-instructions.ts`:

```ts
import type { AgentInstructionBlock } from '@mastra/core/storage';

export const conciergeInstructionBlocks: AgentInstructionBlock[] = [
  { type: 'prompt_block_ref', id: 'mde-brand-voice' },
  { type: 'prompt_block_ref', id: 'mde-safe-tool-usage' },
  { type: 'prompt_block_ref', id: 'mde-no-hallucinations' },
  { type: 'prompt_block_ref', id: 'mde-followup-memory' },
  { type: 'prompt_block_ref', id: 'mde-structured-card-format' },
  {
    type: 'text',
    content: 'You are the main mdeAI Medellin concierge. Ask one clarifying question only when required.',
  },
];

export const rentalInstructionBlocks: AgentInstructionBlock[] = [
  { type: 'prompt_block_ref', id: 'mde-brand-voice' },
  { type: 'prompt_block_ref', id: 'mde-rental-ranking' },
  { type: 'prompt_block_ref', id: 'mde-safe-tool-usage' },
  { type: 'prompt_block_ref', id: 'mde-no-hallucinations' },
  { type: 'prompt_block_ref', id: 'mde-structured-card-format' },
  { type: 'prompt_block_ref', id: 'mde-followup-memory' },
];
```

## Runtime Preview Example

Create `/home/sk/mde/my-mastra-app/src/mastra/scripts/preview-editor-prompts.ts`:

```ts
import { mastra } from '../index';
import { conciergeInstructionBlocks } from '../prompts/agent-instructions';

const editor = mastra.getEditor();
if (!editor) throw new Error('Editor is not registered');

const preview = await editor.prompt.preview(conciergeInstructionBlocks, {
  user: {
    locale: 'en',
    neighborhood: 'Laureles',
  },
  session: {
    channel: 'web',
  },
  search: {
    intent: 'rental',
    budget: 1500,
    neighborhood: 'Laureles',
  },
  memory: {
    previousIntent: 'rental',
    previousResultsSummary: 'Three furnished Laureles listings under $1500.',
    lastNeighborhood: 'Laureles',
  },
  request: {
    riskLevel: 'normal',
    allowedTools: ['search-rentals', 'get-weather'],
  },
  output: {
    cardType: 'rental',
    maxCards: 5,
  },
});

console.log(preview);
```

## Request Context Examples

Use these variable namespaces consistently:

```ts
export const sampleRequestContext = {
  user: {
    id: 'user_demo',
    locale: 'en',
    neighborhood: 'Laureles',
    travelStyle: 'digital-nomad',
  },
  session: {
    channel: 'web',
    city: 'Medellin',
  },
  routing: {
    previousIntent: 'rental',
    userMessage: 'show cheaper',
  },
  request: {
    riskLevel: 'normal',
    allowedTools: ['search-rentals', 'search-events', 'get-weather'],
  },
};
```

## Display Condition Examples

Prompt blocks may include display conditions through Editor/Studio. Use these patterns in task implementation and Studio QA:

```ts
const rentalOnlyRule = {
  combinator: 'AND',
  conditions: [
    { field: 'routing.previousIntent', operator: 'equals', value: 'rental' },
  ],
};

const riskyActionRule = {
  combinator: 'OR',
  conditions: [
    { field: 'request.riskLevel', operator: 'equals', value: 'high' },
    { field: 'request.allowedTools', operator: 'not_contains', value: 'write' },
  ],
};
```

If the exact `RuleGroup` shape differs in the installed type definitions, inspect:

```bash
cd /home/sk/mde/my-mastra-app
rg -n "export type RuleGroup|type RuleGroup|interface RuleGroup" node_modules/@mastra/core/dist node_modules/@mastra/editor/dist
```

## Acceptance Criteria

- [ ] `agent-instructions.ts` exports instruction block arrays for router, concierge, rental, event, and evaluation agents.
- [ ] Each array uses `prompt_block_ref`.
- [ ] Preview script calls `editor.prompt.preview()`.
- [ ] Preview context includes `user`, `session`, `routing`, `search`, `memory`, `request`, and `output` examples.
- [ ] Display condition examples are documented and verified against installed types.
- [ ] Preview output resolves `{{variable}}` interpolation.
- [ ] Preview output excludes blocks whose display conditions do not match.

## Verification

```bash
cd /home/sk/mde/my-mastra-app
npm run seed:prompts
node --experimental-strip-types src/mastra/scripts/preview-editor-prompts.ts
npm run typecheck
npm run build
```

Studio proof:

- Open `http://localhost:4111/prompts`.
- Preview or test a prompt block with `{{user.neighborhood}}`.
- Open `http://localhost:4111/agents`.
- Test draft vs published instructions if available.

## Red Flags

- Preview script imports Markdown directly instead of using Editor storage after seeding.
- Request context names drift between frontend, workflows, and prompt blocks.
- Display conditions hide required safety blocks.
- Draft prompt content is accidentally used for production traffic.
