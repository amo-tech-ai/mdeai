---
task_id: 065-referral-tracking
title: Referral tracking — referral_links + campaign-track-click edge fn
phase: PHASE-2-MARKETING
priority: P2
status: Open
estimated_effort: 0.5 day
area: backend
skill:
  - supabase
  - mdeai-project-gates
edge_function: campaign-track-click
schema_tables:
  - marketing.referral_links
  - marketing.clicks
  - marketing.conversions
depends_on:
  - '059-marketing-schema-migration'
mermaid_diagram: null
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-2-MARKETING |
| **Route** | `GET /functions/v1/campaign-track-click?ref=TOKEN` (redirect + log) |
| **Auth** | Public (no auth required — tracks anonymous clicks) |
| **Real-world** | @laurabotero shares `https://mdeai.co/e/reina-2026?ref=abc123` in her IG story. Each click hits `campaign-track-click`, which logs to `marketing.clicks`, increments `referral_links.clicks_count`, then 302-redirects to the event page. When that visitor buys a ticket, `marketing.conversions` records the conversion — attributing CPL/CPA to Laura's outreach |

## Edge function spec

```typescript
// GET /functions/v1/campaign-track-click?ref=TOKEN&utm_source=instagram&utm_medium=story
//
// 1. Lookup marketing.referral_links WHERE ref_token = TOKEN
//    → 404 if not found
// 2. INSERT INTO marketing.clicks (campaign_id, ref_token, utm_source, utm_medium, ip_hash, user_agent_hash)
//    ip_hash = SHA-256(client IP)   // no raw PII stored
//    user_agent_hash = SHA-256(User-Agent)
// 3. UPDATE marketing.referral_links SET clicks_count = clicks_count + 1
// 4. 302 Redirect to referral_links.destination_url
//
// Idempotency: same IP+UA within 5 min = don't double-count (check clicks WHERE ip_hash+ua_hash < 5min ago)

// POST /functions/v1/campaign-track-click (conversion)
// Body: { ref_token: string, event_type: 'ticket_purchase'|'vote_cast'|'registration', revenue_cents?: number }
// Called by ticket-payment-webhook (005) after successful payment to record downstream conversion
//
// 1. Lookup latest click WHERE ref_token = TOKEN (within 24h window)
// 2. INSERT INTO marketing.conversions (click_id, campaign_id, event_type, revenue_cents)
// 3. UPDATE marketing.referral_links SET conversions_count = conversions_count + 1
```

## Attribution window

- Click → conversion: 24-hour window (last-click attribution)
- Multiple conversions from same click: allowed (e.g., voter buys a ticket AND votes)

## Acceptance Criteria

- [ ] `GET ?ref=TOKEN` logs click + redirects to destination URL in <100ms.
- [ ] IP hash stored, not raw IP; `SELECT ip FROM marketing.clicks` returns only hashes.
- [ ] Duplicate click (same IP+UA within 5 min) returns redirect without inserting duplicate row.
- [ ] Unknown `ref_token` returns 404.
- [ ] Conversion POST links to the originating click within 24h window.
- [ ] `marketing.referral_links.clicks_count` + `conversions_count` stay in sync with actual row counts.
- [ ] `npm run lint` zero new errors; `npm run build` clean.

## See also

- [`059-marketing-schema-migration.md`](./059-marketing-schema-migration.md) — schema
- [`066-campaign-ingest-metrics.md`](./066-campaign-ingest-metrics.md) — rolls up clicks + conversions for dashboard
- [`053-sponsor-roi-rollup-cron.md`](053-sponsor-roi-rollup-cron.md) — sponsor CPL uses conversion data from this table
