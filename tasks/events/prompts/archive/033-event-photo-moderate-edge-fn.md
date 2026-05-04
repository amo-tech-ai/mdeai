---
task_id: 033-event-photo-moderate-edge-fn
title: event-photo-moderate edge fn — Gemini multimodal moderation for event hero/gallery/sponsor assets
phase: PHASE-1.5-EVENTS
priority: P1
status: Done
estimated_effort: 0.5 day
area: backend
skill:
  - supabase-edge-functions
  - gemini
  - mdeai-project-gates
edge_function: event-photo-moderate
schema_tables:
  - public.ai_runs              # logs every Gemini call (only DB write this fn does)
depends_on: ['001-event-schema-migration']
mermaid_diagram: null
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-1.5-EVENTS — replaces the temporary `listing-moderate` dependency that task 002 wizard currently borrows from the landlord product |
| **Path** | `POST /functions/v1/event-photo-moderate` |
| **Auth** | `verify_jwt = true` — only authenticated users can submit (organizers + admins) |
| **Model** | `gemini-3-flash-preview` (multimodal) |
| **Persistence** | **Pure validator** — fn returns the verdict; caller persists wherever appropriate (audit #2 B4: decoupled from `event_media_assets` to avoid Phase 1.5 / Phase 2 phase inversion). Phase 1.5 callers (task 002 wizard) display the verdict and reject the upload on `rejected`. Phase 2 callers (task 030 `event_media_assets`) store the verdict in `metadata` after this fn returns |
| **Real-world** | Sofía uploads "Reina de Antioquia 2026" hero photo → moderation runs in 2.5s → returns `{verdict: 'approved', flags: []}` → wizard accepts the upload. A test photo with explicit content returns `{verdict: 'rejected', flags: ['nudity'], reasons: [...]}` → wizard rejects with red banner |

## Description

**The situation.** Task 002 wizard says *"run through existing `listing-moderate` pattern"* — but `listing-moderate` is landlord-product-specific (apartment photos: floor plans, room counts, occupancy). The audit's M1 flagged this as scope creep. We need a dedicated event-photo moderator with event-specific prompts (not landlord prompts) and the right asset-type flags.

**Why one fn for all event media.** Hero photos, gallery photos, sponsor logos, speaker headshots — same Gemini multimodal call shape, different system prompts per `asset_type`. Cheaper to operate one fn that branches on type than to ship 4 fns.

**What it rejects.** Nudity, minors, gore, illegal-substance imagery, brand conflicts (per-event allowed-brand list), text-heavy ad creative posing as a hero photo, low-resolution submissions (<800px on the long edge).

**Why the fn is now a pure validator (audit #2 B4).** Earlier draft wrote the verdict to `event_media_assets` (a Phase 2 table). That created a phase-inversion: Phase 1.5 fn depending on Phase 2 schema. **Fix:** the fn returns the verdict; the caller decides what to do with it. Phase 1.5 callers display verdict + accept/reject the upload. Phase 2 task 030 calls this fn AND stores result in `event_media_assets.metadata`. No phase inversion; no premature schema dependency.

**How it integrates.**
- **Phase 1.5 (task 002 wizard):** Sofía uploads photo → wizard calls this fn → on `verdict='rejected'`, wizard shows red banner with reasons; on `approved`, wizard proceeds.
- **Phase 2 (task 030 `event_media_assets`):** the schema task explicitly calls this fn before INSERT; verdict + flags stored in `metadata` JSONB; `is_public` flips to true only on approved.

## Request

```typescript
// POST /functions/v1/event-photo-moderate
{
  asset_id:       string,    // event_media_assets.id
  asset_type:     'hero_photo' | 'gallery_photo' | 'flyer' | 'sponsor_logo' | 'speaker_photo' | 'other',
  storage_url:    string,    // signed URL to the image (Supabase Storage)
  context: {                 // helps the prompt
    event_name:   string,
    event_type?:  string,    // 'pageant' | 'concert' | 'workshop' | ...
    organizer_id: string
  }
}
```

## Response

```typescript
// 200 OK
{ success: true, data: {
  verdict: 'approved' | 'rejected' | 'manual_review',
  flags:   ('nudity' | 'minors' | 'gore' | 'drugs' | 'brand_conflict' | 'low_quality' | 'text_heavy' | 'other')[],
  reasons: string[],         // human-readable per flag
  ai_moderation_score: number, // 0..1 (1 = clean)
  model: string,
  duration_ms: number
}}
```

## Logic

```typescript
import { GeminiClient } from "../_shared/gemini.ts";

const MODEL = 'gemini-3-flash-preview';
const SYSTEM_PROMPTS: Record<string, string> = {
  hero_photo:   'You moderate event hero photos for a Medellín-focused events platform...',
  gallery_photo:'You moderate event gallery photos...',
  sponsor_logo: 'You moderate sponsor brand logos. Reject text-heavy ads. Allow stylized brand marks...',
  speaker_photo:'You moderate professional speaker headshots...',
  flyer:        'You moderate event flyers (text-heavy is OK; graphic violence is NOT)...',
  other:        'You moderate event imagery for nudity, minors, gore, illegal content...',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST')   return errorResponse(405, 'METHOD_NOT_ALLOWED');

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return errorResponse(401, 'UNAUTHORIZED');
  const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (!user)       return errorResponse(401, 'UNAUTHORIZED');

  const body = moderationRequestSchema.parse(await req.json());

  const start = Date.now();
  const result = await gemini.moderate({
    model: MODEL,
    systemPrompt: SYSTEM_PROMPTS[body.asset_type] ?? SYSTEM_PROMPTS.other,
    imageUrl: body.storage_url,
    context: body.context,
    structuredOutput: {
      verdict:             { type: 'enum', values: ['approved','rejected','manual_review'] },
      flags:               { type: 'array', items: 'string' },
      reasons:             { type: 'array', items: 'string' },
      ai_moderation_score: { type: 'number', min: 0, max: 1 },
    }
  });
  const duration = Date.now() - start;

  // Log to ai_runs (existing table)
  await supabase.from('ai_runs').insert({
    agent_name: 'event-photo-moderate',
    input_tokens:  result.usage.input,
    output_tokens: result.usage.output,
    duration_ms: duration,
    status: 'success',
    metadata: { asset_id: body.asset_id, asset_type: body.asset_type, verdict: result.verdict, flags: result.flags },
  });

  // Note: NO event_media_assets write here (audit #2 B4). The fn is a pure validator.
  // Caller (task 002 wizard in Phase 1.5; task 030 in Phase 2) persists wherever appropriate.

  return jsonResponse({ success: true, data: { ...result, model: MODEL, duration_ms: duration } });
});
```

## Acceptance Criteria

- [ ] 100 hand-labeled images: ≥95% precision on rejects, ≥90% recall on borderline.
- [ ] Nudity / minors → always `rejected`.
- [ ] Latency p95 < 5s on 1080p hero photos.
- [ ] Every call logs to `ai_runs` with input/output tokens + duration.
- [ ] **Pure validator: fn returns verdict; does NOT write to `event_media_assets`** (audit #2 B4). Caller persists.
- [ ] Manual_review verdict (low-confidence borderline) → admin can override via dashboard panel (task 003 — Phase 2 surface).
- [ ] **Task 002 wizard updated** — replace `listing-moderate` reference with this fn; reject upload on `rejected` verdict.
- [ ] **Task 030 (Phase 2)** — when implementing `event_media_assets`, calls this fn before INSERT and stores verdict in `metadata`.

## Gemini integration (per task 045 + new gemini skill)

Multimodal photo moderation with structured-output guarantee + per-image resolution control for token savings.

| Setting | Value | Source |
|---|---|---|
| Endpoint | native `:generateContent` | skill G4 |
| Model | `gemini-3-flash-preview` (multimodal) | task spec |
| `thinkingLevel` | `medium` (judgment + flagging) | skill §"Thinking Levels" |
| `mediaResolution` (per asset_type) | `hero_photo`: `media_resolution_high` (1120 tok) · `gallery_photo`: `media_resolution_medium` (560 tok) · `sponsor_logo`: `media_resolution_medium` (560 tok) · `speaker_photo`: `media_resolution_medium` (560 tok) · `flyer`: `media_resolution_high` (text-heavy) | live docs §"media resolution" |
| `responseMimeType` | `application/json` | skill G1 |
| `responseJsonSchema` | `{ verdict: enum["approved","rejected","manual_review"], flags: array<string>, reasons: array<string>, ai_moderation_score: number(0..1), model_metadata: { model: string, duration_ms: number } }` | skill G1 |
| Image input | `inlineData` for ≤4MB; Files API for larger | skill §"Document Processing" |
| `temperature` | omit (default 1.0) | skill G2 |
| Logged to `ai_runs` | `agent_name='event-photo-moderate'`, asset_type in metadata | repo convention |

**Token saving math:** 4 logo uploads at `medium` (560 tok ea) = 2,240 tok vs same logos at `high` (1120 tok ea) = 4,480 tok. **2× savings** per moderation session, scales to thousands during sponsor onboarding.

## See also

- [`030-event-media-assets-schema.md`](./030-event-media-assets-schema.md) — what this fn writes to
- [`002-host-event-new-wizard.md`](./002-host-event-new-wizard.md) — calls this fn on photo upload
- [`100-events-prd.md`](../100-events-prd.md) §3 (AI eval strategy)
- `supabase/functions/listing-moderate/index.ts` — landlord-product version (do NOT generalize; copy the Gemini-call pattern only)
