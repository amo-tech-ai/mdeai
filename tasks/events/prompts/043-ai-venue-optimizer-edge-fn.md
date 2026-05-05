---
task_id: 043-ai-venue-optimizer-edge-fn
title: ai-venue-optimizer edge fn — dynamic pricing + scheduling + resource allocation (3-in-1)
phase: PHASE-4-AI
priority: P2
status: Open
estimated_effort: 1.5 days
area: backend
skill:
  - supabase-edge-functions
  - gemini
  - mdeai-project-gates
edge_function: ai-venue-optimizer
schema_tables:
  - public.event_venue_bookings
  - public.event_venue_resources
  - public.event_venue_staff
  - public.events
  - public.ai_runs
depends_on: ['042-venue-analytics-dashboard', '041-event-venue-bookings-schema']
mermaid_diagram: ../diagrams/15-ai-roi-optimization-loop.md
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-4-AI — gates on ≥30 days of utilization data from task 042 |
| **Path** | `POST /functions/v1/ai-venue-optimizer` |
| **Model** | `gemini-3.1-pro-preview` (high reasoning for pricing + scheduling judgment) |
| **3 actions in 1 fn** | `pricing` (suggest rate for a date) · `scheduling` (suggest best date for an inquiry) · `resource_allocation` (suggest staff + AV mix for an event type) |
| **Real-world** | Sofía gets an inquiry: "Can we host a corporate gala for 200 in October?" → AI returns: "Recommend Oct 22 (Saturday) at $8.5M COP base + 15% weekend premium; assign 3 security + 2 AV + 4 catering staff; allocate 2 LED screens + 6 mics + 30 banquet rounds" |

## Description

Phase 4 brings AI to venue ops. Three optimization actions — surfaced as a single endpoint with an `action` discriminator. Per `.claude/rules/ai-interaction-patterns.md`: AI **proposes** the recommendation; venue manager **applies** via the existing UI (no auto-write).

## Request

```typescript
// POST /functions/v1/ai-venue-optimizer
{
  action: 'pricing' | 'scheduling' | 'resource_allocation',
  venue_id: string,

  // For pricing
  date_range?: { starts_at: string, ends_at: string },
  event_type?: string,        // 'pageant' | 'gala' | 'concert' | ...

  // For scheduling
  inquiry?: {
    target_capacity: number,
    preferred_month: string,  // "2026-10"
    event_type: string,
    duration_hours: number
  },

  // For resource_allocation
  event_id?: string           // existing event needing recommendations
}
```

## Response

```typescript
{ success: true, data: {
  action: string,
  recommendation: string,           // human-readable summary
  reasoning: string,                // Gemini's explanation
  details: {                        // structured per action
    suggested_price_cents?: number,
    base_price_cents?: number,
    premium_factors?: { name: string, multiplier: number }[],
    suggested_dates?: { date: string, score: number, reason: string }[],
    suggested_resources?: { resource_id: string, quantity: number, reason: string }[],
    suggested_staff?: { role: string, count: number, reason: string }[]
  },
  confidence: number,               // 0..1
  data_completeness: number,        // 0..1 — gates on >0.6 to avoid premature recommendations
  model: string,
  duration_ms: number
}}
```

## Logic (all 3 actions)

```typescript
import { GeminiClient } from "../_shared/gemini.ts";

const MODEL = 'gemini-3.1-pro-preview';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return errorResponse(405, 'METHOD_NOT_ALLOWED');
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return errorResponse(401, 'UNAUTHORIZED');
  const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (!user) return errorResponse(401, 'UNAUTHORIZED');

  const body = optimizerSchema.parse(await req.json());

  // Verify caller owns the venue
  const { data: venue } = await supabase.from('event_venues')
    .select('organizer_id').eq('id', body.venue_id).single();
  if (!venue || venue.organizer_id !== user.id) return errorResponse(403, 'NOT_VENUE_OWNER');

  // Pull historical context (last 90 days of bookings, resources, staff)
  const context = await gatherVenueContext(body.venue_id);
  const completeness = computeCompleteness(context);
  if (completeness < 0.6) {
    return jsonResponse({ success: true, data: {
      action: body.action, recommendation: 'Insufficient data — need ≥30 days of bookings before AI can recommend.',
      data_completeness: completeness, confidence: 0
    }});
  }

  // Branch on action
  let result;
  if (body.action === 'pricing')              result = await suggestPricing(body, context);
  else if (body.action === 'scheduling')      result = await suggestScheduling(body, context);
  else if (body.action === 'resource_allocation') result = await suggestResources(body, context);

  // Log to ai_runs
  await supabase.from('ai_runs').insert({
    agent_name: 'ai-venue-optimizer',
    input_tokens: result.usage.input,
    output_tokens: result.usage.output,
    duration_ms: result.duration_ms,
    status: 'success',
    metadata: { action: body.action, venue_id: body.venue_id, confidence: result.confidence },
  });

  return jsonResponse({ success: true, data: { ...result, model: MODEL } });
});
```

## Acceptance Criteria

- [ ] All 3 actions return structured recommendations with `confidence` ≥ 0.6 on well-populated venues.
- [ ] On a venue with <30 days of data, all actions return `data_completeness < 0.6` and a friendly "need more data" message — never a hallucinated number.
- [ ] Pricing recommendation cites at least 2 historical comparable bookings.
- [ ] Resource allocation never recommends quantities exceeding `event_venue_resources.quantity_total`.
- [ ] Staff allocation never recommends staff who aren't on the venue's `event_venue_staff` roster.
- [ ] Latency p95 < 8s on `gemini-3.1-pro-preview` (Pro is slow).
- [ ] Every call logs to `ai_runs`.
- [ ] Eval set (50 hand-labeled scenarios across 3 actions): mean human rating ≥ 4.0/5.

## Failure handling

- Gemini timeout (>30s) → 504 with retry-after; client retries with backoff.
- Insufficient data → return `data_completeness` < 0.6 with friendly message; never block the UI.
- Hallucinated resource_id (not in venue inventory) → reject in post-processing; return error to caller for retry.

## Gemini integration (per task 045 + tool-combination preview)

Reasoning-heavy multi-tool agent. Custom DB-read functions + Maps grounding (rate intel) + Code Execution (pricing math) + Google Search (event-market signals) — all in a single agentic turn.

| Setting | Value | Source |
|---|---|---|
| Endpoint | native `:generateContent` | skill G4 |
| Model | `gemini-3.1-pro-preview` (reasoning-heavy) | task spec |
| `thinkingLevel` | **`high`** (pricing math + scheduling judgment) | skill §"Thinking Levels" |
| Custom function declarations | `read_venue_history(venue_id, days)`, `read_resource_inventory(venue_id)`, `read_staff_roster(venue_id)` — service-role-only DB reads | task body |
| Built-in tools (preview combination) | `googleMaps` (comparable rates) + `googleSearch` (event-market signals) + `codeExecution` (pricing math) | live docs § Tool combination |
| `include_server_side_tool_invocations` | `true` | live docs § Tool combination |
| `responseMimeType` | `application/json` | skill G1 |
| `responseJsonSchema` | per task body — `{ recommendation, reasoning, details, confidence, data_completeness, ... }` | skill G3 (combine schema with tools) |
| Citations | persist `groundingChunks` from Google Search + Maps to `ai_runs.metadata.citations` | skill G5 |
| Thought signatures | preserve `thoughtSignature` + `id` + `tool_type` across all parts | skill G7 |
| `temperature` | omit (default 1.0; G2) | skill G2 |

**Why combine 3 built-in tools:** "What's the going rate for 500-cap ballroom in El Poblado on a Saturday next October" needs Maps (location data) + Search (event calendar context) + Code Execution (compute weekend premium). One turn vs 3 sequential calls = 3× faster + fewer thought-signature round-trips.

**Maps pricing:** $25/1k grounded prompts. Free tier: 500/day. Off by default — call only when geo intent detected.

## See also

- [`042-venue-analytics-dashboard.md`](./042-venue-analytics-dashboard.md) — feeds context to this fn
- [`044-ai-venue-layout-generator-edge-fn.md`](./044-ai-venue-layout-generator-edge-fn.md) — sibling AI fn (layouts)
- [`../diagrams/15-ai-roi-optimization-loop.md`](../diagrams/15-ai-roi-optimization-loop.md) — the propose-apply loop
- `.claude/rules/ai-interaction-patterns.md` — propose-only contract
