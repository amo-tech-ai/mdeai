---
task_id: 060-campaign-builder-ui
title: Campaign builder UI — /host/event/:id/campaigns
phase: PHASE-2-MARKETING
priority: P1
status: Open
estimated_effort: 1 day
area: frontend
skill:
  - frontend-design
  - supabase
  - mdeai-project-gates
edge_function: null
schema_tables:
  - marketing.campaigns
  - marketing.posts
  - marketing.campaign_approvals
depends_on:
  - '059-marketing-schema-migration'
  - '061-campaign-generate-plan-edge-fn'
mermaid_diagram: null
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-2-MARKETING — organizer's entry point to the marketing system |
| **Routes** | `/host/event/:id/campaigns` (list) · `/host/event/:id/campaigns/new` (wizard) · `/host/event/:id/campaigns/:campaignId` (detail + approval rail) |
| **Real-world** | Sofía opens her "Reina de Antioquia 2026" dashboard, clicks "Create Campaign", selects 14-day window + WhatsApp + Instagram channels, clicks "Generate Plan" → Gemini returns a day-by-day content plan. She reviews each post, edits the day-5 copy, clicks "Submit for Approval" — the plan lands in the admin queue |

## Description

**What already exists.** `/host/event/:id` dashboard (task 003). The campaign builder adds a "Marketing" tab to that dashboard.

**Three-panel layout.** Left: channel/date filters. Main: post timeline (calendar or list view). Right: post detail preview + edit + approve/reject per post.

**Generate → Review → Submit.** Organizer triggers `campaign-generate-plan` edge fn (task 061); the Gemini-generated plan populates `marketing.posts` as `status='draft'`. Organizer edits individual posts inline. When satisfied, submits the campaign for approval → `marketing.campaign_approvals.status` flips to `'pending'`. Admin approves → `'approved'`. Only then can posts be scheduled to Postiz or OpenClaw.

## Screens

### 1. Campaign list (`/host/event/:id/campaigns`)
- Table: campaign name, channels, date range, status badge, post count, actions
- Empty state: "No campaigns yet — Create your first campaign"
- "Create Campaign" button → opens wizard

### 2. Campaign wizard — Step 1 (Plan)
- Fields: campaign name, start date, end date, channels checkboxes (IG, FB, TikTok, WhatsApp, Email)
- "Generate Plan" button → calls `campaign-generate-plan` edge fn
- Loading state: "Gemini is crafting your 14-day content plan…" with skeleton

### 3. Campaign detail / review (`/host/event/:id/campaigns/:campaignId`)
- Left panel: channel filter chips, date range picker
- Main: timeline of posts sorted by `scheduled_at`; each post card shows channel icon, content preview, status badge
- Click a post → right panel: full text edit, media URL input, channel + date/time selectors, "Save" button
- Bottom bar: "Submit for Approval" (only if all posts are `status='draft'` or `status='rejected'`); disabled with tooltip if campaign is already approved/active

### 4. Approval status banner
- `pending`: "Waiting for admin approval" with timestamp
- `approved`: "Approved ✓ — posts will be scheduled automatically" + "View Schedule"
- `rejected`: admin note shown; "Edit & Resubmit" button

## Acceptance Criteria

- [ ] Campaign list renders with loading/empty/error states.
- [ ] "Generate Plan" calls edge fn 061; skeleton shown during call; posts appear in timeline on success.
- [ ] Organizer can edit post text and scheduled time inline; changes persist to `marketing.posts`.
- [ ] "Submit for Approval" creates `marketing.campaign_approvals` row with `status='pending'`; button disables after submit.
- [ ] Approval status banner reflects DB state (real-time via Supabase Realtime subscription).
- [ ] Admin view at `/admin/campaigns/:id` shows same detail with "Approve" / "Reject + Note" buttons.
- [ ] `npm run lint` zero new errors; `npm run build` clean.

## See also

- [`059-marketing-schema-migration.md`](./059-marketing-schema-migration.md) — schema
- [`061-campaign-generate-plan-edge-fn.md`](./061-campaign-generate-plan-edge-fn.md) — generates the AI plan
- [`062-campaign-approve-flow.md`](./062-campaign-approve-flow.md) — admin approval edge fn + queue
