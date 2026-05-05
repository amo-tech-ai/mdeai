---
id: CURRENT-SUPABASE-ERD
phase: REALITY (not aspirational)
prd_section: 09-prd.md §4.6 (Hi.Events benchmark grounded in actual schema)
type: erd
related: [17-current-data-flow, 18-mvp-gap]
---

# 16 — What's actually in Supabase TODAY (events domain)

**Source.** Live `medellin` Supabase project (`zkwcbyxiwklihegjhuql`), inspected May 2026 via MCP. Plus the canonical `public.events` DDL the user pasted. **44 tables exist in `public`.** This diagram shows ONLY the ~12 tables relevant to the events module — everything else (apartments, restaurants, landlord, P1-CRM, etc.) is omitted for clarity.

```mermaid
erDiagram
    profiles ||--o{ events : "creates (created_by)"
    profiles ||--o{ bookings : "books"
    profiles ||--o{ saved_places : "saves"
    profiles ||--o{ payments : "pays"
    profiles ||--o{ conversations : "starts"
    profiles ||--o{ notifications : "receives"

    events ||--o{ bookings : "booked via type=event"
    events ||--o{ saved_places : "saved as type=event"
    events ||--o{ ai_runs : "AI ops on (event_id metadata)"

    bookings ||--o| payments : "0..1 — Stripe ledger"
    bookings ||--o{ notifications : "triggers"

    conversations ||--o{ messages : "1:N"
    conversations ||--o{ ai_runs : "1:N AI calls"

    profiles {
        uuid id PK
        text email
        text full_name
        text avatar_url
        timestamptz created_at
    }

    events {
        uuid id PK
        text name
        text source "google ticketmaster manual ai_generated"
        text google_place_id UK
        text ticketmaster_id
        text external_id
        text description
        text event_type
        text subcategory
        text_array tags
        text address
        text city
        text state
        text country
        text postal_code
        numeric latitude
        numeric longitude
        text phone
        text website
        text email
        timestamptz event_start_time
        timestamptz event_end_time
        text timezone
        text ticket_url "external link only — no internal ticketing yet"
        numeric ticket_price_min
        numeric ticket_price_max
        text currency
        text primary_image_url
        jsonb images
        jsonb details
        numeric rating
        int rating_count
        bool is_active
        bool is_verified
        timestamptz data_freshness
        timestamptz cache_expires_at
        timestamptz created_at
        timestamptz updated_at
        uuid created_by FK "auth.users"
    }

    bookings {
        uuid id PK
        uuid user_id FK "profiles"
        text type "apartment car restaurant event — UNIFIED"
        uuid item_id "polymorphic — events.id when type=event"
        timestamptz starts_at
        timestamptz ends_at
        text status
        numeric total_amount
        text currency
        timestamptz created_at
    }

    payments {
        uuid id PK
        uuid booking_id FK
        uuid user_id FK
        numeric amount_cents
        text currency
        text stripe_session_id
        text stripe_payment_intent
        text status
        timestamptz created_at
    }

    saved_places {
        uuid id PK
        uuid user_id FK
        uuid location_id "polymorphic"
        text location_type "event apartment car restaurant"
        timestamptz created_at
    }

    notifications {
        uuid id PK
        uuid user_id FK
        text kind
        text title
        text body
        bool read
        timestamptz created_at
    }

    conversations {
        uuid id PK
        uuid user_id FK
        text agent_type
        text status
    }

    messages {
        uuid id PK
        uuid conversation_id FK
        text role
        text content
        jsonb ai_metadata
    }

    ai_runs {
        uuid id PK
        text agent_name
        int input_tokens
        int output_tokens
        int duration_ms
        text status
        jsonb metadata
    }

    idempotency_keys {
        text key PK
        timestamptz created_at
    }

    outbound_clicks {
        uuid id PK
        text destination_url
        text utm_source
        text ref_token
        uuid user_id FK
    }

    agent_audit_log {
        uuid id PK
        text agent
        text action
        jsonb payload
        timestamptz created_at
    }
```

## Key observations from the actual schema

| Observation | Implication |
|---|---|
| **`events` is a discovery catalog** with Google Places + Ticketmaster + manual sources | It's NOT a transactional events table. There's no `qty_total`, `qty_sold`, ticket inventory, organizer ownership, or status workflow. |
| **`ticket_url` is an external link** | mdeai today doesn't sell tickets — it links out. **Phase 1 MVP must add internal ticketing to make events transactional.** |
| **`bookings` is polymorphic** (apartments, cars, restaurants, events all share it) | We can use it for event tickets without a new table. Need to add `qr_token` + `qr_used_at`. |
| **`payments` is a real Stripe ledger** with 3 rows already | Working payments infra. Just wire to event bookings. |
| **`agent_audit_log` exists** with comment "audit trail for Paperclip/Hermes/OpenClaw agent actions" | Phase 4 trio infra is already in schema even though runtimes aren't installed. |
| **`idempotency_keys` table** exists with TTL 24h cron | Reuse for `ticket-checkout` retries. |
| **`outbound_clicks` table** exists for affiliate attribution | Phase 2 sponsor ROI tracking already has its starting point. |
| **`is_active` flag** + 10 indexes on `events` | Discovery query patterns are well-optimized. Don't break them. |

## What's missing for Phase 1 MVP (additive only)

Per [`18-mvp-gap.md`](./18-mvp-gap.md), only **3 schema changes needed** to enable internal ticketing — none of them risky:

1. **NEW `event_tickets` table** — ticket types (id, event_id, name, price_cents, qty_total, qty_sold)
2. **Extend `public.events`** with: `slug` (UK), `status` (draft|published|live|closed), `organizer_id` (FK profiles), `total_capacity`
3. **Extend `public.bookings`** with: `qr_token` (UK), `qr_used_at`, `attendee_email`, `attendee_name`

That's it. **Three additive migrations.** No table renames. No column drops. No data loss.

## See also

- [`17-current-data-flow.md`](./17-current-data-flow.md) — how `useEvents` + `EventBookingWizardPremium` work today end-to-end
- [`18-mvp-gap.md`](./18-mvp-gap.md) — exactly what to add (3 migrations + 3 edge fns + 4 screens) to ship Phase 1
- [`tasks/events/09-prd.md`](../09-prd.md) §4.6 — Hi.Events benchmark + feature gap analysis
