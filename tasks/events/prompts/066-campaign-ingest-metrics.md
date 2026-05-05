---
task_id: 066-campaign-ingest-metrics
title: campaign-ingest-metrics cron + campaign analytics dashboard
phase: PHASE-2-MARKETING
priority: P2
status: Open
estimated_effort: 1 day
area: backend + frontend
skill:
  - supabase
  - frontend-design
  - mdeai-project-gates
edge_function: campaign-ingest-metrics
schema_tables:
  - marketing.clicks
  - marketing.conversions
  - marketing.delivery_logs
  - marketing.posts
  - marketing.campaigns
depends_on:
  - '059-marketing-schema-migration'
  - '065-referral-tracking'
  - '063-postiz-schedule-posts-edge-fn'
mermaid_diagram: null
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-2-MARKETING |
| **Cron** | `campaign-ingest-metrics` runs every 30 min via pg_cron |
| **Route** | `GET /host/event/:id/campaigns/:campaignId/analytics` (dashboard) |
| **Real-world** | Sofía opens her campaign analytics and sees: 1,240 WhatsApp messages delivered, 380 Instagram post impressions, 42 clicks on her referral links, 8 ticket conversions attributed to the campaign. She can show this to her next sponsor as proof of marketing reach |

## Description

**Two parts:**
1. **`campaign-ingest-metrics` edge fn** — fetches Postiz post metrics (impressions, engagements) for scheduled posts; upserts into `marketing.impressions`; rolls up aggregates per campaign per day.
2. **Analytics dashboard** — shows campaign performance: delivery rates, click-through, conversion funnel, referral attribution.

## Metrics rolled up

| Metric | Source | Displayed as |
|---|---|---|
| Messages sent | `marketing.delivery_logs.status='sent'` | "X sent" |
| Messages delivered | `delivery_logs.status='delivered'` | "X delivered (Y%)" |
| Messages read | `delivery_logs.status='read'` | "X read (Y%)" |
| Social impressions | Postiz API `/public/v1/posts/{id}/analytics` | "X impressions" |
| Clicks | `marketing.clicks COUNT` | "X link clicks" |
| CTR | clicks / impressions | "X%" |
| Ticket conversions | `marketing.conversions WHERE event_type='ticket_purchase'` | "X tickets" |
| Revenue attributed | `SUM(conversions.revenue_cents)` | "$X COP" |
| CPL | revenue / (messages_sent OR clicks) | "$X/lead" |

## Postiz analytics API

```typescript
// GET ${POSTIZ_BASE_URL}/public/v1/posts/{postiz_post_id}/analytics
// Headers: Authorization: Bearer ${POSTIZ_API_KEY}
// Response: { impressions: N, likes: N, comments: N, shares: N, reach: N }
// → upsert into marketing.impressions
```

## Dashboard sections

1. **Summary row** — 6 KPI tiles (sent, delivered rate, clicks, conversions, revenue, CPL)
2. **Timeline chart** — clicks/conversions by day over campaign period
3. **Channel breakdown** — per-channel delivery + engagement table
4. **Referral leaderboard** — top referral links by conversions (influencer attribution)
5. **Funnel** — sent → delivered → read → clicked → converted

## Acceptance Criteria

- [ ] `campaign-ingest-metrics` runs via pg_cron every 30 min; idempotent (ON CONFLICT DO UPDATE).
- [ ] Postiz impressions fetched for all `status='sent'` posts; stored in `marketing.impressions`.
- [ ] Analytics dashboard renders all 5 sections with loading/empty/error states.
- [ ] CPL calculated correctly: if 0 revenue, shows "—" not divide-by-zero.
- [ ] Referral leaderboard ranks influencers by conversion count.
- [ ] Logs to `ai_runs` (agent_name='campaign-ingest-metrics').
- [ ] `npm run lint` zero new errors; `npm run build` clean.

## See also

- [`065-referral-tracking.md`](./065-referral-tracking.md) — click/conversion data source
- [`053-sponsor-roi-rollup-cron.md`](053-sponsor-roi-rollup-cron.md) — parallel sponsor ROI rollup
