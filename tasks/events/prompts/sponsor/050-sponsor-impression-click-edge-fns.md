---
task_id: 050-sponsor-impression-click-edge-fns
title: sponsor-impression + sponsor-click + /v/:placementId — tracking edge fns + QR redirect
phase: PHASE-2-SPONSOR-GROWTH
priority: P1
status: Open
estimated_effort: 0.5 day
area: backend
skill:
  - supabase-edge-functions
  - mdeai-project-gates
edge_function: sponsor-impression
schema_tables:
  - sponsor.impressions
  - sponsor.clicks
depends_on: ['045-sponsor-schema-migration', '049-sponsor-surface-component']
mermaid_diagram: null
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-2-SPONSOR-GROWTH — data without tracking is guesswork |
| **Edge functions** | `POST /sponsor-impression` · `POST /sponsor-click` · `GET /v/:placementId` (QR redirect) |
| **Rate limits** | Impression: 600/min/IP · Click: 120/min/IP |
| **Real-world** | Every time a user sees the Postobón logo on the contest hero, one `sponsor.impressions` row lands in < 50ms. Every click fires `sponsor-click` then 302s to `utm_destination`. A venue QR scan hits `/v/<placement_id>` — same click row, same UTM redirect |

## Description

**The situation.** `<SponsoredSurface>` (task 049) fires beacons on render and click, but the receiving endpoints don't exist yet. Without these, sponsor dashboards show zero impressions/clicks and attribution (task 051) has no click rows to join against.

**Why separate impression and click endpoints (not one event endpoint).** Impression rate is ~20–100× click rate. Different rate limits, different write patterns, different row sizes. Merging them creates a bottleneck.

**Why `/v/:placementId` as a separate route.** QR codes printed on physical materials must point to a stable short URL. A redirect handler that records a click first, then 302s to the UTM destination, gives the same impression/click data as the digital surfaces.

## sponsor-impression edge function

```typescript
// POST /functions/v1/sponsor-impression
// Auth: none (public — impression fires from anonymous browsers)
// Body: { placement_id: string, surface: string, viewer_anon_id?: string }
// Response: { success: true }
// Rate limit: 600/min/IP via Supabase rate-limit header

// Logic:
// 1. Validate placement_id (UUID), surface (string max 50), viewer_anon_id (string max 36)
// 2. Hash IP for privacy: sha256(ip + daily_salt) → ip_hash
// 3. INSERT sponsor.impressions (best-effort; NEVER throw on DB error — impression loss is acceptable)
// 4. Return 200 immediately (fire-and-forget; no response body needed by caller)
```

## sponsor-click edge function

```typescript
// POST /functions/v1/sponsor-click
// Auth: none
// Body: { placement_id: string, viewer_anon_id?: string, utm_full?: string }
// Response: { success: true, data: { redirect_url: string } }
// Rate limit: 120/min/IP

// Logic:
// 1. Load placement (must be active=true); if not found → 404
// 2. Hash IP for privacy
// 3. INSERT sponsor.clicks
// 4. Return { redirect_url: placement.utm_destination + UTM params }
// Caller navigates; the component does window.location.href = redirect_url
```

## /v/:placementId — QR redirect route

This is a separate edge function or a Supabase function route that:

```typescript
// GET /functions/v1/sponsor-qr-redirect?placement_id=<uuid>
// Auth: none
// Response: 302 to placement.utm_destination (with UTM params)

// Logic:
// 1. Load placement by ID (must be active=true)
// 2. INSERT sponsor.clicks (viewer_anon_id = null for physical QR)
// 3. 302 to buildUtmUrl(placement.utm_destination, placement.id, 'qr_station')
// 4. On error (invalid placement): 302 to https://mdeai.co (never show a 404 on a printed QR)
```

## IP privacy

```typescript
// Daily salt rotates at midnight UTC — prevents long-term cross-session tracking
// while still allowing within-day deduplication of bot traffic
const daily_salt = new Date().toISOString().slice(0, 10); // '2026-05-04'
const ip_hash = await crypto.subtle.digest('SHA-256',
  new TextEncoder().encode(ip + daily_salt)
);
```

## Acceptance Criteria

- [ ] `sponsor-impression`: INSERT into `sponsor.impressions` succeeds for a valid active placement; returns 200 even if DB write fails (best-effort).
- [ ] `sponsor-impression`: Never returns 5xx to the caller (impression loss is acceptable; caller should not retry on error).
- [ ] `sponsor-click`: Returns `{ redirect_url }` for a valid active placement; INSERT into `sponsor.clicks` succeeds.
- [ ] `sponsor-click`: Returns 404 for an inactive or unknown placement.
- [ ] `sponsor-qr-redirect`: Returns 302 to `utm_destination`; click row created; never returns 404 (fallback to homepage).
- [ ] IP hashing uses daily salt; raw IPs never stored.
- [ ] Rate limits enforced: > 600 impressions/min from same IP → 429.
- [ ] All three fns log to `ai_runs` (agent_name, duration_ms, status).
- [ ] `npm run verify:edge` passes.

## See also

- [`051-sponsor-attribution-trigger.md`](051-sponsor-attribution-trigger.md) — joins clicks to votes
- [`049-sponsor-surface-component.md`](049-sponsor-surface-component.md) — component that calls these
