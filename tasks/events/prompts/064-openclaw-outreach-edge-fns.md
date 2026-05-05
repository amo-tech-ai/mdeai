---
task_id: 064-openclaw-outreach-edge-fns
title: openclaw-build-audience + openclaw-send-outreach edge fns
phase: PHASE-2-MARKETING
priority: P1
status: Open
estimated_effort: 1 day
area: backend
skill:
  - supabase
  - mdeai-project-gates
edge_function: openclaw-build-audience + openclaw-send-outreach
schema_tables:
  - marketing.influencers
  - marketing.influencer_outreach
  - marketing.delivery_logs
  - marketing.campaign_approvals
depends_on:
  - '059-marketing-schema-migration'
  - '062-campaign-approve-flow'
  - '067-openclaw-delivery-webhook'
mermaid_diagram: null
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-2-MARKETING |
| **Routes** | `POST /functions/v1/openclaw-build-audience` · `POST /functions/v1/openclaw-send-outreach` |
| **Auth** | service_role (admin/cron only) |
| **Approval gate** | `openclaw-send-outreach` hard blocks if `campaign_approvals.status != 'approved'` |
| **Real-world** | Admin runs `openclaw-build-audience` to pull consent-gated contacts from `marketing.influencers`. Then runs `openclaw-send-outreach` → OpenClaw VPS executes WhatsApp/Telegram/email messages at the approved daily cap of 50 per channel |

## openclaw-build-audience spec

```typescript
// POST /functions/v1/openclaw-build-audience
// Body: { campaign_id, segment_filter: { city?, niche_tags?, platform?, min_followers? } }
//
// 1. SELECT from marketing.influencers WHERE opt_out=false AND matches segment_filter
// 2. For each contact: INSERT INTO marketing.influencer_outreach (influencer_id, campaign_id, status='pending')
//    ON CONFLICT DO NOTHING (idempotent)
// 3. Return { contacts_added: N }
//
// PII rule: contact_hash (SHA-256) is sent to OpenClaw, never raw phone/email
```

## openclaw-send-outreach spec

```typescript
// POST /functions/v1/openclaw-send-outreach
// Body: { campaign_id, dry_run?: boolean }
//
// 1. Verify campaign_approvals.status = 'approved' → 400 APPROVAL_REQUIRED if not
// 2. Check daily cap: COUNT delivery_logs WHERE campaign_id AND date=today AND channel=X < 50
// 3. Fetch pending influencer_outreach rows (up to cap)
// 4. Build job payload:
{
  "job_id": "...",
  "campaign_id": "...",
  "contacts": [{ "contact_hash": "sha256...", "channel": "whatsapp", "message": "..." }],
  "daily_cap": 50,
  "no_send_window": { "start": "22:00", "end": "08:00", "tz": "America/Bogota" }
}
// 5. POST to OPENCLAW_WEBHOOK_URL with HMAC-SHA256 signature (OPENCLAW_WEBHOOK_SECRET)
// 6. On 202 from OpenClaw: UPDATE influencer_outreach SET status='sent', sent_at=now()
//    INSERT delivery_logs (status='sent')
// 7. Log to ai_runs
```

## Safety rules (hardcoded, not configurable)

| Rule | Value |
|---|---|
| Daily cap | 50 messages/channel/campaign |
| No-send window | 10pm–8am Medellín time (UTC-5) |
| Approval gate | `campaign_approvals.status = 'approved'` — hard 400 |
| Suppression check | `marketing.influencers.opt_out = false` — enforced in query |
| PII | SHA-256 hash only; raw phone/email never leaves mdeai DB |

## Secrets required

- `OPENCLAW_WEBHOOK_URL` — VPS webhook endpoint
- `OPENCLAW_WEBHOOK_SECRET` — HMAC-SHA256 signing secret

## Acceptance Criteria

- [ ] `openclaw-build-audience` builds audience respecting `opt_out=false`; inserts `influencer_outreach` rows idempotently.
- [ ] `openclaw-send-outreach` with `campaign_approvals.status != 'approved'` returns 400.
- [ ] Daily cap enforced: second call on same day after cap reached returns 200 with `contacts_sent: 0`.
- [ ] Payload sent to OpenClaw VPS has HMAC-SHA256 signature; test VPS endpoint verifies it.
- [ ] `dry_run=true` skips the VPS call, returns what would be sent.
- [ ] Logs to `ai_runs`.
- [ ] `npm run lint` zero new errors; `npm run build` clean.

## See also

- [`067-openclaw-delivery-webhook.md`](./067-openclaw-delivery-webhook.md) — receives delivery receipts back from VPS
- [`059-marketing-schema-migration.md`](./059-marketing-schema-migration.md) — schema
- [`social/02-openclaw-strategy.md`](../social/02-openclaw-strategy.md) — full OpenClaw architecture
