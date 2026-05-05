---
task_id: 062-campaign-approve-flow
title: campaign-approve edge fn + admin approval queue
phase: PHASE-2-MARKETING
priority: P1
status: Open
estimated_effort: 0.5 day
area: backend + frontend
skill:
  - supabase
  - frontend-design
  - mdeai-project-gates
edge_function: campaign-approve
schema_tables:
  - marketing.campaign_approvals
  - marketing.campaigns
  - marketing.posts
depends_on:
  - '059-marketing-schema-migration'
  - '060-campaign-builder-ui'
mermaid_diagram: null
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-2-MARKETING — the mandatory human gate before any post is sent |
| **Routes** | `/admin/campaigns` (queue) · `POST /functions/v1/campaign-approve` (action) |
| **Auth** | `campaign-approve` requires `service_role` (admin only) |
| **Real-world** | Admin reviews Sofía's 14-day plan, reads each post, approves the campaign. `campaign_approvals.status` flips to `'approved'`. Subsequent edge fns (063 Postiz, 064 OpenClaw) check this status before sending anything |

## Edge function spec

```typescript
// POST /functions/v1/campaign-approve
// Body: {
//   campaign_id: string,
//   action: 'approve' | 'reject',
//   notes?: string  // required on reject
// }
//
// approve:
//   1. UPDATE campaign_approvals SET status='approved', reviewed_by=user_id, reviewed_at=now()
//   2. UPDATE campaigns SET status='approved'
//   3. UPDATE posts SET status='approved' WHERE campaign_id = ... AND status='draft'
//
// reject:
//   1. UPDATE campaign_approvals SET status='rejected', notes=notes, reviewed_by=user_id
//   2. UPDATE campaigns SET status='draft'  (organizer can edit and resubmit)
//   3. Notify organizer (Supabase notification row)
```

## Admin queue UI (`/admin/campaigns`)

- Table: campaign name, event, organizer, channels, date range, post count, submitted_at, status
- Click row → `/admin/campaigns/:id` detail (same view as organizer but with Approve/Reject buttons)
- Approve button: one-click, no confirmation needed (admin reviewed posts manually)
- Reject button: opens textarea for required notes, then submits

## Acceptance Criteria

- [ ] `action='approve'` flips `campaign_approvals.status` + `campaigns.status` + all draft posts to `'approved'`.
- [ ] `action='reject'` flips to `'rejected'`; `notes` field persisted; organizer notification created.
- [ ] Non-service-role call returns 403.
- [ ] Admin queue at `/admin/campaigns` shows pending campaigns with correct status badges.
- [ ] Organizer dashboard reflects approval status in real time (Realtime subscription).
- [ ] `npm run lint` zero new errors; `npm run build` clean.

## See also

- [`063-postiz-schedule-posts-edge-fn.md`](./063-postiz-schedule-posts-edge-fn.md) — checks `status='approved'` before scheduling
- [`064-openclaw-outreach-edge-fns.md`](./064-openclaw-outreach-edge-fns.md) — same gate
