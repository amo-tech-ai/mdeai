---
task_id: 054-sponsor-ai-edge-fns
title: sponsor AI edge fns — moderation + creative-gen + roi-explain + optimize + audience-match (5-in-1)
phase: PHASE-2-SPONSOR-GROWTH
priority: P2
status: Open
estimated_effort: 2 days
area: backend
skill:
  - gemini
  - supabase-edge-functions
  - mdeai-project-gates
edge_function: sponsor-moderate
schema_tables:
  - sponsor.assets
  - sponsor.applications
  - sponsor.roi_daily
  - public.ai_runs
depends_on:
  - '045-sponsor-schema-migration'
  - '053-sponsor-roi-rollup-cron'
mermaid_diagram: null
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-2-SPONSOR-GROWTH — AI tools differentiate the platform from generic ad networks |
| **Edge functions** | `sponsor-moderate` · `sponsor-creative-gen` · `sponsor-roi-explain` · `sponsor-optimize` · `sponsor-audience-match` |
| **Models** | Flash (`gemini-3-flash-preview`) for moderation + explain; Pro (`gemini-3.1-pro-preview`) for creative + optimize + audience-match |
| **All G1–G6 compliant** | `responseJsonSchema`, default temperature (G2), `x-goog-api-key` header (G4), structured output + tools (G3) |
| **Real-world** | Admin uploads Postobón's logo → `sponsor-moderate` checks in < 3s. Postobón brand manager requests creative → `sponsor-creative-gen` returns 5 captions (ES+EN) + 3 IG Story prompts in < 8s |

## Description

**The situation.** Five AI capabilities are needed: asset moderation (required at upload), creative generation (Growth), daily ROI insights (Growth), campaign optimizer (Growth), and audience matching (Growth). Building them separately wastes shared setup. All five follow the same edge-fn pattern (Zod validation, Gemini call, ai_runs log).

**Build strategy.** Implement all five as separate edge functions under `supabase/functions/`. Each is standalone — no shared runtime state. They share `_shared/gemini.ts` (existing `callGeminiStructured`) and `_shared/ai-runs.ts`.

---

## 1. sponsor-moderate

```typescript
// POST /functions/v1/sponsor-moderate
// Auth: service_role only (called by admin UI after asset upload)
// Body: { asset_id: string, storage_url: string, kind: 'logo'|'video'|'image'|'copy'|'color' }
// Model: gemini-3-flash-preview + urlContext tool
// thinkingLevel: "low"
// Schema: { verdict: 'clean'|'flagged'|'rejected', flags: string[], reasons: string[], score: number }

// On clean: UPDATE sponsor.assets SET ai_moderation_status='clean'
// On flagged/rejected: UPDATE sponsor.assets SET ai_moderation_status=verdict
// System prompt tuned per asset kind (logo vs video thumbnail vs copy text)
// Timeout: 15s (URL context fetch + Gemini)
```

## 2. sponsor-creative-gen

```typescript
// POST /functions/v1/sponsor-creative-gen
// Auth: Bearer JWT (sponsor org member)
// Body: { application_id: string, creative_brief: string, tone?: string }
// Model: gemini-3.1-pro-preview
// thinkingLevel: "medium"
// Schema: {
//   captions: [{ es: string, en: string, platform: 'instagram'|'whatsapp'|'push'|'email' }],
//   ig_story_prompts: string[],       // 3 prompts for Gemini image gen
//   push_notif_copy: string,          // ≤ 80 chars
//   wa_broadcast_subtitle: string,    // ≤ 120 chars (appended to leaderboard screenshot)
// }
// Rate limit: 10/min/sponsor
// Never auto-publishes — returns for human review
// Reject if output contains invented URLs (regex: /https?:\/\/[^\s]+/ not in brief)
```

## 3. sponsor-roi-explain

```typescript
// POST /functions/v1/sponsor-roi-explain (also called by daily pg_cron)
// Auth: Bearer JWT (sponsor) OR service_role (cron)
// Body: { application_id: string }
// Model: gemini-3-flash-preview
// thinkingLevel: "low"
// Context: last 7 days of roi_daily + industry benchmarks (hardcoded baseline CTR by surface)
// Schema: { insight: string, recommendation: string, action?: { type: string, payload: object } }
// insight: ≤ 3 sentences explaining performance trend
// recommendation: 1 concrete next action
// Stored to: sponsor.applications campaign_goals.ai_insight (JSONB update)
// Cron: daily at 06:00 Bogotá time (UTC-5) for all active applications
```

## 4. sponsor-optimize

```typescript
// POST /functions/v1/sponsor-optimize
// Auth: Bearer JWT (admin or sponsor)
// Body: { application_id: string }
// Model: gemini-3.1-pro-preview
// thinkingLevel: "high"
// Context: roi_daily last 30 days + placements list + campaign goals
// Schema: {
//   recommendations: [{
//     action: 'increase_weight'|'decrease_weight'|'add_surface'|'replace_creative'|'change_schedule',
//     surface?: string,
//     placement_id?: string,
//     new_value?: number | string,
//     expected_lift_pct: number,
//     why: string,
//   }]
// }
// Rate limit: 6/min/sponsor
// Returns proposals only — never auto-applies
```

## 5. sponsor-audience-match

```typescript
// POST /functions/v1/sponsor-audience-match
// Auth: Bearer JWT (admin or sponsor)
// Body: { organization_id: string, brand_description: string, brand_keywords: string[] }
// Model: gemini-3.1-pro-preview + googleSearch tool
// thinkingLevel: "medium"
// Schema: {
//   top_events: [{ event_id: string, event_name: string, match_score: number, rationale: string }],
//   top_segments: [{ segment: string, size_estimate: number, fit_rationale: string }],
//   estimated_reach: number,
// }
// Uses Google Search to ground results in real Medellín event data
// Rate limit: 6/min/sponsor
```

## Shared patterns (all 5 fns)

- Auth: `getUserId(authHeader)` for sponsor fns; `getServiceClient()` for service-role-only
- All log to `ai_runs` via `insertAiRun` (agent_name=fn_name, agent_type='sponsor')
- All return `{ success: true, data: {...} }` or `errorBody(CODE, message)`
- All use `callGeminiStructured` from `_shared/gemini.ts`
- Timeout: 15s for Flash fns, 30s for Pro fns

## Model assignment (authoritative)

| Function | Model | Thinking | Reason |
|---|---|---|---|
| `sponsor-moderate` | `gemini-3-flash-preview` | low | Speed > quality; binary clean/flagged |
| `sponsor-roi-explain` | `gemini-3-flash-preview` | low | 3-sentence summary; runs frequently (cron + on-demand) |
| `sponsor-creative-gen` | `gemini-3.1-pro-preview` | medium | Quality output; bilingual captions |
| `sponsor-optimize` | `gemini-3.1-pro-preview` | high | Reasoning over 30d of data; recommendations |
| `sponsor-audience-match` | `gemini-3.1-pro-preview` | medium | + googleSearch grounding |

⚠️ CORRECTED: Summary said "Flash for moderation + explain; Pro for creative + optimize + audience-match" — this is correct. Some earlier notes incorrectly assigned Flash to optimize. Use the table above as authoritative.

## pg_cron invocation for sponsor-roi-explain (daily AI insights)

```sql
-- Runs daily at 06:00 UTC (= 01:00 Bogotá UTC-5)
-- Calls sponsor-roi-explain for all active applications
SELECT cron.schedule(
  'sponsor-roi-explain-daily',
  '0 6 * * *',
  $$
    SELECT net.http_post(
      url := current_setting('app.edge_fn_base_url') || '/functions/v1/sponsor-roi-explain-batch',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    );
  $$
);
-- Requires: pg_net extension + 'app.edge_fn_base_url' + 'app.service_role_key' set via ALTER DATABASE
```

## Acceptance Criteria

- [ ] `sponsor-moderate`: returns `clean` for a standard PNG logo; returns `flagged` for a prompted adult-content image (use a solid-red test image to avoid false triggers); logs to `ai_runs`.
- [ ] `sponsor-creative-gen`: returns valid JSON matching schema; captions have both `es` and `en` keys; no invented URLs in output.
- [ ] `sponsor-roi-explain`: returns 3-sentence insight + 1 recommendation; stores to `campaign_goals.ai_insight` JSONB field.
- [ ] `sponsor-optimize`: returns ≥ 1 recommendation with all required keys; `expected_lift_pct` is a number.
- [ ] `sponsor-audience-match`: returns ≥ 1 top event with `match_score` and `rationale`.
- [ ] All 5 fns log to `ai_runs` with correct `agent_name` and `status`.
- [ ] G1 compliant: all use `responseJsonSchema`.
- [ ] G4 compliant: no `?key=` query params.
- [ ] `npm run verify:edge` passes for all 5.

## See also

- [`tasks/events/03-sponsorship-system.md`](03-sponsorship-system.md) §6 — AI tools spec
- [`supabase/functions/_shared/gemini.ts`](../../../supabase/functions/_shared/gemini.ts) — `callGeminiStructured`
- [`supabase/functions/event-photo-moderate/index.ts`](../../../supabase/functions/event-photo-moderate/index.ts) — moderation pattern to follow
