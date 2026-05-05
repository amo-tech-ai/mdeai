---
task_id: 044-ai-venue-layout-generator-edge-fn
title: ai-venue-layout-generator — propose floor plans from event metadata
phase: PHASE-4-AI
priority: P2
status: Open
estimated_effort: 1 day
area: backend
skill:
  - supabase-edge-functions
  - gemini
  - mdeai-project-gates
edge_function: ai-venue-layout-generator
schema_tables:
  - public.event_venue_layouts
  - public.events
  - public.event_tickets
  - public.ai_runs
depends_on: ['040-event-venue-layouts-schema']
mermaid_diagram: null
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-4-AI |
| **Path** | `POST /functions/v1/ai-venue-layout-generator` |
| **Model** | `gemini-3.1-pro-preview` (vision optional for venue-photo input; text-only for first version) |
| **Output** | A proposed layout (zones jsonb) — organizer reviews + saves to `event_venue_layouts` |
| **Real-world** | Sofía's pageant has 4 ticket tiers (GA 1000 / VIP 200 / Backstage 30 / Frontrow 100). AI proposes: Theater layout, GA in rear 60% of seats, Frontrow in middle 12 rows, VIP in side balconies, Backstage as standing area near stage |

## Description

Layout generation is the highest-value layout AI: organizers struggle most with translating ticket-tier definitions into seating geometry. AI proposes; organizer applies via the venue management UI (per `.claude/rules/ai-interaction-patterns.md`). Never auto-saves.

## Request

```typescript
// POST /functions/v1/ai-venue-layout-generator
{
  event_id: string,                 // pulls event_tickets + total_capacity
  venue_id: string,
  layout_type_hint?: 'theater' | 'banquet' | 'classroom' | 'reception' | 'exhibition' | 'custom',
  vibe_hint?: string                // "elegant gala", "rowdy concert", "intimate workshop"
}
```

## Response

```typescript
{ success: true, data: {
  proposed_layout: {
    name: string,
    layout_type: string,
    total_capacity: number,
    zones: [{
      name: string,                 // "VIP balcony"
      capacity: number,
      tier: string,                 // matches event_tickets.name
      position_hint: string,        // "stage-right balcony, second row"
      reason: string                // why this assignment
    }]
  },
  rationale: string,                // overall design narrative
  alternative_count: number,        // how many alternatives the AI considered
  confidence: number,
  model: string,
  duration_ms: number
}}
```

## Logic

```typescript
const MODEL = 'gemini-3.1-pro-preview';

Deno.serve(async (req) => {
  // Auth + ownership check (same as task 043)
  // ...

  const body = layoutGenSchema.parse(await req.json());

  // Pull event + tickets + venue context
  const { event, tickets, venue } = await gatherLayoutContext(body.event_id, body.venue_id);

  // Verify total ticket capacity ≤ venue capacity
  const totalTicketCapacity = tickets.reduce((s, t) => s + t.qty_total, 0);
  if (totalTicketCapacity > venue.capacity) {
    return errorResponse(400, 'CAPACITY_OVERFLOW',
      `Tickets total ${totalTicketCapacity} > venue capacity ${venue.capacity}`);
  }

  // Build prompt + call Gemini Pro
  const result = await gemini.generateLayout({
    model: MODEL,
    systemPrompt: buildLayoutSystemPrompt(body.layout_type_hint, body.vibe_hint),
    context: { event, tickets, venue },
    structuredOutput: layoutOutputSchema,
  });

  // Validate AI's output: total zone capacity == sum of ticket qty_total (within 5% tolerance)
  const proposedTotal = result.zones.reduce((s, z) => s + z.capacity, 0);
  if (Math.abs(proposedTotal - totalTicketCapacity) / totalTicketCapacity > 0.05) {
    return errorResponse(500, 'AI_LAYOUT_MISMATCH',
      `AI proposed capacity ${proposedTotal} doesn't match tickets ${totalTicketCapacity}`);
  }

  // Validate every zone tier exists in event_tickets
  for (const z of result.zones) {
    if (!tickets.some(t => t.name === z.tier)) {
      return errorResponse(500, 'AI_TIER_HALLUCINATION', `Zone tier "${z.tier}" not in event tickets`);
    }
  }

  // Log + return (no DB write — propose only)
  await supabase.from('ai_runs').insert({ agent_name: 'ai-venue-layout-generator', /* ... */ });
  return jsonResponse({ success: true, data: result });
});
```

## Acceptance Criteria

- [ ] Total proposed zone capacity equals sum of `event_tickets.qty_total` within 5%.
- [ ] Every proposed zone's `tier` matches an existing `event_tickets.name` (zero hallucinated tiers).
- [ ] `layout_type_hint` is respected when provided.
- [ ] No auto-save — caller must explicitly INSERT the proposed layout into `event_venue_layouts`.
- [ ] Latency p95 < 10s.
- [ ] Eval: 25 sample events × 5-dimension human rating (relevance, capacity correctness, tier mapping, vibe match, geometric coherence) → mean ≥ 4.0/5.
- [ ] Every call logs to `ai_runs`.

## Failure handling

- Gemini returns malformed structured output → 500 `AI_OUTPUT_INVALID`; caller can retry.
- Capacity mismatch / tier hallucination → 500 with detail; caller retries (don't show user).
- Vision input (Phase 4.5+ — base64 venue photo) not yet supported → ignore field if present.

## Gemini integration (per task 045 + Code Execution)

Geometric reasoning — model writes Python in a sandbox to compute optimal seat spacing, capacity per row, sightlines.

| Setting | Value | Source |
|---|---|---|
| Endpoint | native `:generateContent` | skill G4 |
| Model | `gemini-3.1-pro-preview` (reasoning-heavy) | task spec |
| `thinkingLevel` | **`high`** (geometric reasoning) | skill §"Thinking Levels" |
| Built-in tools | `codeExecution` (Python: NumPy, math) — model writes/runs code to verify total zone capacity matches sum of `event_tickets.qty_total` within 5% | live docs §"Code Execution" |
| Sandbox limits | 30s max runtime; pre-approved libs (NumPy, Pandas, Matplotlib); no custom installs | live docs §"Code Execution" |
| `responseMimeType` | `application/json` | skill G1 |
| `responseJsonSchema` | per task body — `proposed_layout: { name, layout_type, total_capacity, zones: [{name, capacity, tier, position_hint, reason}] }` | skill G1 |
| Vision input (Phase 4.5+) | base64 venue photo via `inlineData`; ignored for text-only Phase 4 launch | skill §"Document Processing" |
| Validation post-Gemini | every zone tier must match an existing `event_tickets.name`; reject `AI_TIER_HALLUCINATION` | task acceptance criteria |
| `temperature` | omit (default 1.0; G2) | skill G2 |

**Why Code Execution:** Layout generation needs *provable* capacity math. Without sandboxed Python, the model approximates ("~480 seats fit"); with it, the model computes (`area_per_seat * 0.85 fill = 487 exact`) and we get tighter capacity matching. Validation in JS post-call catches any remaining drift.

## See also

- [`040-event-venue-layouts-schema.md`](./040-event-venue-layouts-schema.md) — output writes here
- [`043-ai-venue-optimizer-edge-fn.md`](./043-ai-venue-optimizer-edge-fn.md) — sibling AI fn
- `.claude/rules/ai-interaction-patterns.md` — propose-only contract
