---
task_id: 067-openclaw-delivery-webhook
title: openclaw-delivery-webhook edge fn — receive delivery receipts from VPS
phase: PHASE-2-OPENCLAW
priority: P1
status: Open
estimated_effort: 0.5 day
area: backend
skill:
  - supabase
  - mdeai-project-gates
edge_function: openclaw-delivery-webhook
schema_tables:
  - marketing.delivery_logs
  - marketing.openclaw_conversations
  - marketing.influencers
depends_on:
  - '059-marketing-schema-migration'
mermaid_diagram: null
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-2-OPENCLAW — OpenClaw VPS calls this after each message send/delivery/read |
| **Route** | `POST /functions/v1/openclaw-delivery-webhook` |
| **Auth** | HMAC-SHA256 signature verification (OPENCLAW_WEBHOOK_SECRET) — no Bearer JWT |
| **Real-world** | OpenClaw VPS delivers a WhatsApp message to @laurabotero. 3 minutes later she reads it. VPS fires two webhook calls: `status=delivered` and `status=read`. This fn upserts both into `marketing.delivery_logs`, feeding the analytics dashboard and influencer_outreach status |

## Edge function spec

```typescript
// POST /functions/v1/openclaw-delivery-webhook
// Headers: X-OpenClaw-Signature: hmac-sha256=HEX
// Body (per event from VPS):
{
  "job_id": "...",
  "campaign_id": "...",
  "contact_hash": "sha256...",
  "channel": "whatsapp",
  "status": "delivered" | "read" | "failed" | "opted_out",
  "openclaw_job_id": "...",
  "timestamp": "2026-06-01T15:23:00Z",
  "error_detail": "..." // only on failed
}

// Processing:
// 1. Verify HMAC-SHA256 signature → 401 on fail
// 2. UPSERT marketing.delivery_logs (openclaw_job_id UNIQUE)
//    ON CONFLICT (openclaw_job_id) DO UPDATE SET status, delivered_at/read_at/error_detail
// 3. If status='opted_out': UPDATE marketing.influencers SET opt_out=true WHERE contact_hash=...
// 4. UPDATE marketing.influencer_outreach SET status=... WHERE campaign_id + contact_hash match
// 5. Return 200 { received: true }
```

## Opt-out handling

When `status='opted_out'`:
1. Set `marketing.influencers.opt_out = true` — immediately excluded from all future audience builds
2. Set `marketing.influencer_outreach.status = 'opted_out'`
3. Do NOT send any further messages to this contact hash — enforced by `openclaw-build-audience` (checks `opt_out=false`)

## Acceptance Criteria

- [ ] Missing or invalid HMAC signature returns 401; valid signature returns 200.
- [ ] `delivery_logs` row upserted correctly; second call with same `openclaw_job_id` updates rather than duplicates.
- [ ] `opted_out` status flips `marketing.influencers.opt_out = true` within the same transaction.
- [ ] `failed` status persists `error_detail`.
- [ ] Handles burst of 100 events/second without timeout (uses bulk upsert, not row-by-row).
- [ ] `npm run lint` zero new errors; `npm run build` clean.

## See also

- [`064-openclaw-outreach-edge-fns.md`](./064-openclaw-outreach-edge-fns.md) — sends jobs to VPS
- [`social/02-openclaw-strategy.md`](../social/02-openclaw-strategy.md) §edge-fn-contracts
