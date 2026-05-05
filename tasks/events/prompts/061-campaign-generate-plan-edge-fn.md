---
task_id: 061-campaign-generate-plan-edge-fn
title: campaign-generate-plan edge fn — Gemini Flash 14-day content plan
phase: PHASE-2-MARKETING
priority: P1
status: Open
estimated_effort: 1 day
area: backend
skill:
  - gemini
  - supabase
  - mdeai-project-gates
edge_function: campaign-generate-plan
schema_tables:
  - marketing.campaigns
  - marketing.posts
  - events
depends_on:
  - '059-marketing-schema-migration'
mermaid_diagram: null
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-2-MARKETING |
| **Route** | `POST /functions/v1/campaign-generate-plan` |
| **Auth** | Bearer JWT (organizer) |
| **Real-world** | Sofía clicks "Generate Plan" for "Reina de Antioquia 2026". Edge fn reads event data, calls Gemini Flash with G1 `responseJsonSchema`, returns 14 posts (2/day) across WhatsApp + Instagram + TikTok. Posts written to `marketing.posts` with `status='draft'`. Sofía sees them in the timeline within 3 seconds |

## Description

**Input:**
```typescript
{
  campaign_id: string,
  channels: ('instagram' | 'facebook' | 'tiktok' | 'whatsapp' | 'telegram' | 'email')[],
  start_date: string,  // ISO date
  end_date: string,    // ISO date
  tone?: 'energetic' | 'elegant' | 'community'  // defaults 'energetic'
}
```

**Output (written to DB + returned):**
```typescript
{
  success: true,
  data: {
    campaign_id: string,
    posts_created: number,
    posts: Array<{
      id: string,
      channel: string,
      scheduled_at: string,
      content_text: string,
      media_suggestion: string  // non-persisted hint for organizer
    }>
  }
}
```

## Edge function spec

```typescript
// G1: responseJsonSchema guarantees valid JSON
// G2: no temperature override (default 1.0)
// G4: x-goog-api-key header
// gemini-3-flash-preview — fast + cheap for content gen

const postSchema = {
  type: "object",
  properties: {
    posts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          channel:       { type: "string" },
          day_offset:    { type: "integer" },  // days from start_date
          time_of_day:   { type: "string" },   // 'morning'|'afternoon'|'evening'
          content_text:  { type: "string" },
          media_suggestion: { type: "string" }
        },
        required: ["channel", "day_offset", "time_of_day", "content_text"]
      }
    }
  },
  required: ["posts"]
};

// Prompt includes:
// - Event name, description, date, location from events table
// - Contest name(s) from vote.contests WHERE event_id = ...
// - Sponsor names (if any active placements)
// - Target channels + tone
// - Colombian Spanish Paisa voice
// - WhatsApp posts: plain text, ≤300 chars, emoji OK
// - Instagram/TikTok: caption + hashtags, ≤500 chars
// - Distribution: 2 posts/day across channels, evenly spread

// After generating:
// 1. INSERT INTO marketing.posts (campaign_id, channel, content_text, scheduled_at, status='draft')
//    for each post; scheduled_at = start_date + day_offset + time_of_day offset
// 2. Log to ai_runs (agent_name='campaign-generate-plan', tokens, duration, status)
```

## Scheduling defaults

| Time of day | UTC offset (Medellín = UTC-5) | Scheduled at UTC |
|---|---|---|
| morning | 09:00 COT | 14:00 UTC |
| afternoon | 14:00 COT | 19:00 UTC |
| evening | 19:00 COT | 00:00 UTC +1d |

## Acceptance Criteria

- [ ] Returns valid JSON matching schema (G1 enforced via `responseJsonSchema`).
- [ ] 14-day campaign with 2 channels generates 20–28 posts (2/day, distributed).
- [ ] All posts written to `marketing.posts` with `status='draft'` before response returns.
- [ ] `marketing.campaigns.status` flips to `'draft'` (remains; plan generated but not yet approved).
- [ ] Unauthorized call (no JWT) returns 401.
- [ ] Non-organizer call (JWT of user who doesn't own the event) returns 403.
- [ ] Logs to `ai_runs`.
- [ ] `npm run lint` zero new errors; `npm run build` clean.

## See also

- Gemini skill G1–G6 rules — always follow
- [`059-marketing-schema-migration.md`](./059-marketing-schema-migration.md)
- [`060-campaign-builder-ui.md`](./060-campaign-builder-ui.md) — UI that calls this fn
