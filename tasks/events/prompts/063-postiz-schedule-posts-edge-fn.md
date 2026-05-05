---
task_id: 063-postiz-schedule-posts-edge-fn
title: postiz-schedule-posts edge fn — schedule approved posts to Postiz
phase: PHASE-2-MARKETING
priority: P1
status: Open
estimated_effort: 1 day
area: backend
skill:
  - supabase
  - mdeai-project-gates
edge_function: postiz-schedule-posts
schema_tables:
  - marketing.posts
  - marketing.campaign_approvals
depends_on:
  - '059-marketing-schema-migration'
  - '062-campaign-approve-flow'
mermaid_diagram: null
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-2-MARKETING |
| **Route** | `POST /functions/v1/postiz-schedule-posts` |
| **Auth** | Bearer JWT (organizer) OR service_role (cron) |
| **Approval gate** | Hard blocks if `campaign_approvals.status != 'approved'` |
| **Real-world** | After Sofía's campaign is approved, this fn batches all `status='approved'` posts for social channels (IG, FB, TikTok) to `POST /public/v1/posts` on Postiz. Postiz returns `provider_post_id` stored back to `marketing.posts.postiz_post_id` |

## Description

**What Postiz does.** Postiz (`POSTIZ_BASE_URL`, `POSTIZ_API_KEY` in Supabase secrets) is the scheduled social posting layer. It accepts posts with content, media, channel, and scheduled time. It handles OAuth to IG/FB/TikTok on behalf of the organizer's connected accounts.

**What this edge fn does.**
1. Verify `campaign_approvals.status = 'approved'` — hard 400 if not.
2. Fetch all `marketing.posts` for the campaign where `channel IN ('instagram','facebook','tiktok','twitter','youtube','linkedin')` AND `status='approved'`.
3. For each post: `POST /public/v1/posts` to Postiz with content + scheduled_at.
4. On success: update `marketing.posts.postiz_post_id = response.id`, `status='scheduled'`.
5. Log each batch to `ai_runs` (agent_name='postiz-schedule-posts').

**Channels:** Only social channels go to Postiz. `whatsapp`, `telegram`, `email` channels go to OpenClaw (task 064) — never Postiz.

## Postiz API contract

```typescript
// POST ${POSTIZ_BASE_URL}/public/v1/posts
// Headers: Authorization: Bearer ${POSTIZ_API_KEY}
// Body (per post):
{
  "integration_id": "${postiz_integration_id}",  // per channel, stored in POSTIZ_INTEGRATION_IDS secret
  "content": "...",
  "scheduled_at": "2026-06-01T14:00:00Z",
  "media": [{ "url": "..." }]  // optional
}
// Response: { "id": "postiz_post_id_xxx", "status": "scheduled" }
```

## Secrets required (Supabase dashboard)

- `POSTIZ_BASE_URL` — e.g. `https://app.postiz.com`
- `POSTIZ_API_KEY` — API key from Postiz account
- `POSTIZ_INTEGRATION_IDS` — JSON map `{"instagram":"int_xxx","facebook":"int_yyy","tiktok":"int_zzz"}`

## Acceptance Criteria

- [ ] Calling fn with `campaign_approvals.status != 'approved'` returns 400 `APPROVAL_REQUIRED`.
- [ ] All approved social posts for a campaign are scheduled to Postiz in a single call.
- [ ] `marketing.posts.postiz_post_id` populated after successful Postiz response.
- [ ] `marketing.posts.status` flips to `'scheduled'`.
- [ ] WhatsApp/Telegram/Email channel posts are skipped (those go to OpenClaw via 064).
- [ ] Logs to `ai_runs`.
- [ ] `npm run lint` zero new errors; `npm run build` clean.

## See also

- [`062-campaign-approve-flow.md`](./062-campaign-approve-flow.md) — approval gate
- [`064-openclaw-outreach-edge-fns.md`](./064-openclaw-outreach-edge-fns.md) — handles WhatsApp/Telegram/Email posts
