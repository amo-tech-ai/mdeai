---
task_id: MASTRA-032
title: mdeAI Mastra Prompt Block Library
phase: MVP
priority: P0
status: Not Started
estimated_effort: 2 days
area: mastra-editor
skill: [mde-task-lifecycle, mastra, ai-chatbot]
subagents: [prompt-engineer, backend, qa]
edge_function: none
schema_tables: [mastra_prompt_blocks, mastra_prompt_block_versions]
depends_on: [MASTRA-031]
blocks: [MASTRA-033, MASTRA-034, MASTRA-035]
verified_docs:
  - docs/editor/prompts
  - reference/editor/mastra-editor
studio_targets:
  - http://localhost:4111/prompts
---

<!-- task-summary -->
> **What:** Create the ten reusable mdeAI prompt block source files.
> **Why:** Agents need modular Medellin-native behavior, safety, output contracts, and follow-up continuity.
> **Delivers:** Markdown prompt block files plus a typed registry for Editor seeding.
> **Tools/Skills:** `mde-task-lifecycle` · `mastra` · `ai-chatbot`
> **MVP · P0 · Not Started · Effort: 2 days**

# mdeAI Mastra Prompt Block Library

## Exact Prompt Block Files

Create these files under `/home/sk/mde/my-mastra-app/src/mastra/prompts/blocks/`:

| Prompt block ID | File |
| --- | --- |
| `mde-brand-voice` | `mde-brand-voice.md` |
| `mde-rental-ranking` | `mde-rental-ranking.md` |
| `mde-event-discovery` | `mde-event-discovery.md` |
| `mde-restaurant-concierge` | `mde-restaurant-concierge.md` |
| `mde-followup-memory` | `mde-followup-memory.md` |
| `mde-safe-tool-usage` | `mde-safe-tool-usage.md` |
| `mde-no-hallucinations` | `mde-no-hallucinations.md` |
| `mde-structured-card-format` | `mde-structured-card-format.md` |
| `mde-routing-classifier` | `mde-routing-classifier.md` |
| `mde-evaluation-agent` | `mde-evaluation-agent.md` |

## Content Requirements

All prompt blocks must:

- Use Markdown.
- Be concise and modular.
- Support `{{variable}}` interpolation.
- Avoid secrets.
- Avoid hardcoded fake listings/events/restaurants/prices.
- Work for GPT-5 and Gemini models.
- Be safe when reused across agents.

## Required Block Intent

### `mde-brand-voice`

Must define:

- Medellin-first concierge voice.
- Friendly but direct tone.
- English/Spanish support.
- Local neighborhood sensitivity.
- No over-touristy stereotypes.

Required variables:

```text
{{user.locale || "en"}}
{{user.neighborhood || "Medellin"}}
{{session.channel || "web"}}
```

### `mde-rental-ranking`

Must define:

- Ranking criteria for Medellin rentals.
- Budget, neighborhood, WiFi, furnished status, commute, safety, pet policy, stay length.
- Explain best fit and rejected options.
- Max 5 results.

Required variables:

```text
{{search.intent}}
{{search.budget}}
{{search.neighborhood}}
{{search.stayLength}}
```

### `mde-event-discovery`

Must define:

- Nightlife, music, culture, food, sports, ticketed events.
- Date/time, venue, neighborhood, vibe, price/ticket status when provided.
- Max 5 results.

Required variables:

```text
{{search.date || "soon"}}
{{search.vibe || "open"}}
{{user.neighborhood || "Medellin"}}
```

### `mde-restaurant-concierge`

Must define:

- Cuisine, neighborhood, group size, budget, dietary needs, occasion.
- Provenza, Manila, Laureles, Envigado, Centro, and Poblado context.
- Avoid invented reservation availability.

Required variables:

```text
{{search.cuisine || "any"}}
{{search.neighborhood || "Medellin"}}
{{search.partySize || "unknown"}}
```

### `mde-followup-memory`

Must define:

- Preserve prior search intent.
- Interpret "show cheaper", "compare 1 and 3", "what's near Provenza", "when can I view".
- Ask one clarifying question only when context is missing.

Required variables:

```text
{{memory.previousIntent}}
{{memory.previousResultsSummary}}
{{memory.lastNeighborhood}}
```

### `mde-safe-tool-usage`

Must define:

- Use tools for facts.
- Supabase remains source of truth.
- Never send WhatsApp, book, refund, purchase, publish, or mutate records without approved workflows.
- Return draft/handoff when action is risky.

Required variables:

```text
{{request.riskLevel || "normal"}}
{{request.allowedTools || "read-only"}}
```

### `mde-no-hallucinations`

Must define:

- Never invent listings, events, restaurants, hosts, prices, URLs, availability, ratings, or booking status.
- Say when data is missing.
- Mark mock data clearly as `source: "mock"`.

Required variables:

```text
{{tool.source || "unknown"}}
{{tool.lastUpdated || "unknown"}}
```

### `mde-structured-card-format`

Must define:

- Max 5 cards.
- Card fields for rentals/events/restaurants.
- Include source and confidence.
- Use concise reasons.

Required variables:

```text
{{output.cardType || "recommendation"}}
{{output.maxCards || 5}}
```

### `mde-routing-classifier`

Must define:

- Intent labels: rental, event, restaurant, attraction, weather, support, general.
- Compact structured routing response.
- No long user-facing answer.

Required variables:

```text
{{routing.previousIntent}}
{{routing.userMessage}}
```

### `mde-evaluation-agent`

Must define:

- JSON-only rerank behavior.
- "Best for" labels.
- Reasons and risks based only on input candidates.
- Deterministic local logic preferred.

Required variables:

```text
{{evaluation.domain}}
{{evaluation.criteria}}
```

## Registry Pattern

Create `/home/sk/mde/my-mastra-app/src/mastra/prompts/registry.ts`:

```ts
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const blocksDir = join(here, 'blocks');

export type MdePromptBlock = {
  id: string;
  name: string;
  description: string;
  content: string;
  metadata: {
    owner: 'mdeai';
    domain: string;
    stability: 'draft' | 'production';
  };
};

function md(file: string): string {
  return readFileSync(join(blocksDir, file), 'utf8');
}

export const mdePromptBlocks: MdePromptBlock[] = [
  {
    id: 'mde-brand-voice',
    name: 'mde Brand Voice',
    description: 'Medellin-native concierge tone and multilingual style.',
    content: md('mde-brand-voice.md'),
    metadata: { owner: 'mdeai', domain: 'global', stability: 'production' },
  },
  {
    id: 'mde-rental-ranking',
    name: 'mde Rental Ranking',
    description: 'Rental ranking behavior and explanation rules.',
    content: md('mde-rental-ranking.md'),
    metadata: { owner: 'mdeai', domain: 'rentals', stability: 'production' },
  },
];
```

Add all ten blocks to the registry.

## Acceptance Criteria

- [ ] All ten Markdown files exist.
- [ ] All ten blocks are represented in `registry.ts`.
- [ ] Every block uses at least one `{{variable}}` where useful.
- [ ] Every domain block includes "max 5" where relevant.
- [ ] Safety blocks explicitly ban invented facts.
- [ ] Follow-up block handles "show cheaper", "compare 1 and 3", and "what's near Provenza".
- [ ] Evaluation block requires JSON only.
- [ ] No mock data appears in prompt text except the instruction to label mock outputs.

## Verification

```bash
cd /home/sk/mde/my-mastra-app
rg -n "mde-brand-voice|mde-rental-ranking|mde-event-discovery|mde-restaurant-concierge|mde-followup-memory|mde-safe-tool-usage|mde-no-hallucinations|mde-structured-card-format|mde-routing-classifier|mde-evaluation-agent" src/mastra/prompts
rg -n "{{[a-zA-Z0-9_.| '\"-]+}}" src/mastra/prompts/blocks
npm run typecheck
```
