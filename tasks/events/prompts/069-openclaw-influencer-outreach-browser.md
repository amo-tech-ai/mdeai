---
task_id: 069-openclaw-influencer-outreach-browser
title: OpenClaw influencer outreach — browser-based IG/TikTok DMs via Playwright
phase: PHASE-2-OPENCLAW
priority: P2
status: Open
estimated_effort: 1 day
area: backend (OpenClaw VPS skill)
skill:
  - supabase
  - mdeai-project-gates
edge_function: openclaw-browser-outreach-webhook
schema_tables:
  - marketing.influencer_outreach
  - marketing.delivery_logs
  - marketing.influencers
depends_on:
  - '059-marketing-schema-migration'
  - '064-openclaw-outreach-edge-fns'
  - '067-openclaw-delivery-webhook'
mermaid_diagram: null
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-2-OPENCLAW |
| **What it does** | OpenClaw VPS uses Playwright to send IG/TikTok DMs to influencers who haven't responded to WhatsApp/email outreach — only as a secondary channel after WhatsApp/email reply |
| **Compliance rule** | **Only DM an influencer on IG/TikTok AFTER they have replied to the WhatsApp or email outreach.** Cold IG/TikTok DMs = account ban risk. This rule is hardcoded |
| **Real-world** | @laurabotero replied to the WhatsApp outreach ("Sí me interesa"). OpenClaw escalates to IG DM to send her media assets and UTM link |

## Description

**The ban-avoidance architecture.** Direct IG/TikTok DMs from automation = near-certain account ban within days. The compliant pattern:
1. First outreach: WhatsApp Business API + SendGrid (zero ban risk)
2. Only after a positive reply: IG/TikTok DM (warm contact, human-quality reply rate)
3. OpenClaw Playwright skill: navigates to the influencer's profile, opens DM, sends message
4. Human account required: organizer connects their personal IG account to OpenClaw VPS

**This edge fn's role.** mdeai doesn't run the Playwright browser — OpenClaw VPS does. This edge fn:
1. Fetches influencers who replied to WhatsApp/email AND have an IG/TikTok handle
2. Builds the DM payload (personalized Gemini-generated message + UTM link)
3. Posts job to OpenClaw VPS via HMAC-signed webhook
4. Receives delivery receipt via `openclaw-delivery-webhook`

## Edge function spec

```typescript
// POST /functions/v1/openclaw-browser-outreach-webhook
// Body: { campaign_id, dry_run?: boolean }
//
// 1. Verify approval gate (campaign_approvals.status='approved')
// 2. Fetch influencer_outreach WHERE status='replied' AND platform IN ('instagram','tiktok')
//    AND influencer_outreach not already sent on this channel
// 3. For each: generate personalized DM via Gemini Flash (≤500 chars, mentions their content niche)
// 4. POST to OPENCLAW_WEBHOOK_URL with job_type='browser_dm'
// 5. UPDATE influencer_outreach with new channel attempt
```

## Daily cap

50 browser DMs per day per account (same as WhatsApp cap). Enforced by checking `delivery_logs` count before dispatching.

## Acceptance Criteria

- [ ] Only influencers with `influencer_outreach.status='replied'` are targeted — never cold outreach.
- [ ] Approval gate blocks unapproved campaigns.
- [ ] Daily cap of 50 enforced; excess returns 200 with `{ contacts_sent: 0, reason: 'daily_cap_reached' }`.
- [ ] HMAC signature on VPS payload.
- [ ] `dry_run=true` returns payload without calling VPS.
- [ ] Logs to `ai_runs`.
- [ ] `npm run lint` zero new errors; `npm run build` clean.

## See also

- [`02-openclaw-growth.md`](../02-openclaw-growth.md) — compliant outreach architecture
- [`064-openclaw-outreach-edge-fns.md`](./064-openclaw-outreach-edge-fns.md) — WhatsApp/email first-touch (prerequisite)
