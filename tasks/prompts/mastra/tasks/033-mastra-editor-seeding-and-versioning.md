---
task_id: MASTRA-033
title: Mastra Editor Prompt Seeding And Versioning
phase: MVP
priority: P0
status: Not Started
estimated_effort: 1 day
area: mastra-editor
skill: [mde-task-lifecycle, mastra]
subagents: [backend, qa]
edge_function: none
schema_tables: [mastra_prompt_blocks, mastra_prompt_block_versions]
depends_on: [MASTRA-031, MASTRA-032]
blocks: [MASTRA-034, MASTRA-035]
verified_docs:
  - docs/editor/overview
  - docs/editor/prompts
  - reference/editor/mastra-editor
studio_targets:
  - http://localhost:4111/prompts
---

<!-- task-summary -->
> **What:** Add scripts to seed and update mdeAI prompt blocks through `mastra.getEditor().prompt`.
> **Why:** Prompt blocks must be reproducible across local, staging, and production while preserving Editor version history.
> **Delivers:** Idempotent seed script, create/update examples, versioning strategy, and Studio proof.
> **Tools/Skills:** `mde-task-lifecycle` · `mastra`
> **MVP · P0 · Not Started · Effort: 1 day**

# Mastra Editor Prompt Seeding And Versioning

## Scope

Create:

- `/home/sk/mde/my-mastra-app/src/mastra/scripts/seed-editor-prompts.ts`
- `/home/sk/mde/my-mastra-app/src/mastra/scripts/list-editor-prompts.ts`
- npm scripts in `/home/sk/mde/my-mastra-app/package.json`

Suggested scripts:

```json
{
  "seed:prompts": "node --experimental-strip-types src/mastra/scripts/seed-editor-prompts.ts",
  "list:prompts": "node --experimental-strip-types src/mastra/scripts/list-editor-prompts.ts"
}
```

## Exact Editor APIs

Use installed Mastra Editor APIs:

- `const editor = mastra.getEditor()`
- `editor.prompt.create(input)`
- `editor.prompt.update(input)`
- `editor.prompt.list(args?)`
- `editor.prompt.getById(id, options?)`
- `editor.prompt.preview(blocks, context)`
- `editor.prompt.clearCache(id?)`

## Seed Script Pattern

Implement idempotent create-or-update:

```ts
import { mastra } from '../index';
import { mdePromptBlocks } from '../prompts/registry';

const editor = mastra.getEditor();
if (!editor) {
  throw new Error('Mastra Editor is not registered. Add editor: new MastraEditor() in src/mastra/index.ts');
}

for (const block of mdePromptBlocks) {
  const existing = await editor.prompt.getById(block.id);

  if (!existing) {
    await editor.prompt.create({
      id: block.id,
      name: block.name,
      description: block.description,
      content: block.content,
      metadata: block.metadata,
    });
    console.log(`created ${block.id}`);
    continue;
  }

  await editor.prompt.update({
    id: block.id,
    name: block.name,
    description: block.description,
    content: block.content,
    metadata: block.metadata,
  });
  console.log(`updated draft ${block.id}`);
}
```

## Agent Instruction Update Example

Use `prompt_block_ref` patterns:

```ts
import { mastra } from '../index';

const editor = mastra.getEditor();
if (!editor) throw new Error('Editor is not registered');

await editor.agent.update({
  id: 'concierge-agent',
  instructions: [
    { type: 'prompt_block_ref', id: 'mde-brand-voice' },
    { type: 'prompt_block_ref', id: 'mde-safe-tool-usage' },
    { type: 'prompt_block_ref', id: 'mde-no-hallucinations' },
    { type: 'prompt_block_ref', id: 'mde-followup-memory' },
    { type: 'prompt_block_ref', id: 'mde-structured-card-format' },
    {
      type: 'text',
      content: 'You are the main mdeAI Medellin concierge. Keep answers concise and useful.',
    },
  ],
});
```

## Versioning Strategy

- Seed script may create or update drafts.
- Human reviewer tests drafts in Studio.
- Production publish happens through Studio or a separate reviewed promotion script.
- Do not auto-publish from local seed scripts.
- Use `status: "draft"` in tests when validating new prompt text.
- Use published default for production.

## Acceptance Criteria

- [ ] `seed-editor-prompts.ts` creates missing prompt blocks.
- [ ] Existing prompt blocks are updated as draft versions, not deleted/recreated.
- [ ] Seed script does not auto-publish.
- [ ] `list-editor-prompts.ts` prints IDs, names, and status/version metadata where available.
- [ ] Scripts fail clearly if Editor is not registered.
- [ ] Scripts do not read or write `.env`.
- [ ] `package.json` includes prompt seed/list commands.
- [ ] Studio Prompts tab shows all ten seeded blocks.

## Verification

```bash
cd /home/sk/mde/my-mastra-app
npm run typecheck
npm run build
npm run seed:prompts
npm run list:prompts
MASTRA_DEV_NO_CACHE=1 npx mastra dev
```

Studio proof:

- Open `http://localhost:4111/prompts`.
- Confirm all ten blocks exist.
- Edit one block, save draft, publish, then verify version history exists.

## Red Flags

- Deleting prompt blocks during seed.
- Auto-publishing unreviewed prompt text.
- Hardcoding version IDs in source code without an environment-specific reason.
- Using prompt seed scripts to hide data/tool behavior changes.
