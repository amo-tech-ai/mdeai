---
id: EVENT-TICKET-PURCHASE
phase: MVP
prd_section: 05-unified-platform.md §8 event.* schema, 4.4 ticket-* edge fns
type: sequence
related: [10-event-creation-wizard, 11-integrated-schema-map]
---

# 09 — Event ticket purchase end-to-end (sequence)

**What this shows.** From a traveler buying a $40 GA ticket to scanning their QR at the venue gate. Atomic inventory decrement, server-signed single-use QR token, bonus-vote unlock for embedded contests.

**Phase.** MVP — Phase 3 release blocker.

```mermaid
sequenceDiagram
    autonumber
    actor T as Traveler
    participant FE as /event/:slug
    participant EF as Edge fn ticket-checkout
    participant DB as event.tickets + event.bookings
    participant SC as Stripe Checkout
    participant WH as Edge fn ticket-payment-webhook
    participant ST as Supabase Storage
    participant EM as React Email + SendGrid
    participant PWA as PWA install prompt
    participant SCAN as Edge fn ticket-validate
    actor D as Door staff

    T->>FE: View event detail
    FE-->>T: Tickets - GA $40 - VIP $120 - Backstage $400
    T->>FE: Pick GA, qty 2
    FE->>EF: POST ticket-checkout (ticket_id, qty=2)
    EF->>DB: BEGIN; advisory lock on ticket_id
    EF->>DB: SELECT qty_total - qty_sold
    alt Sold out
        DB-->>EF: insufficient inventory
        EF->>DB: ROLLBACK
        EF-->>FE: 409 sold out
    else Available
        EF->>DB: UPDATE qty_sold + 2; INSERT booking status=pending
        DB-->>EF: booking_id
        EF->>DB: COMMIT
        EF->>SC: Create Checkout session
        SC-->>EF: session_url
        EF-->>FE: Redirect to Stripe
        FE-->>T: Stripe Checkout page
        T->>SC: Pay
        SC->>WH: payment_intent.succeeded
        WH->>WH: Verify Stripe signature
        WH->>WH: Mint server-signed JWT (qr_token)
        WH->>DB: UPDATE booking status=paid + qr_token + bonus_votes_remaining
        WH->>ST: Generate QR PNG, store in tickets bucket
        WH->>EM: Render React Email template
        EM-->>T: Email with QR + Add to Calendar + sponsor logo
        WH-->>SC: 200 OK ack
    end

    T->>PWA: Tap email link
    PWA-->>T: Install prompt
    T->>T: Add to home screen

    Note over T: Festival day arrives

    T->>D: Show QR from email or PWA
    D->>SCAN: Scan QR with venue PWA
    SCAN->>DB: SELECT booking by qr_token
    alt Already used
        DB-->>SCAN: qr_used_at NOT NULL
        SCAN-->>D: REJECTED already used
    else Token expired or invalid sig
        SCAN-->>D: REJECTED invalid
    else Valid
        SCAN->>DB: UPDATE qr_used_at = NOW
        DB-->>SCAN: bonus_votes_remaining = 5
        SCAN-->>D: ALLOW + entity name on screen
        D-->>T: Welcome - 5 bonus votes unlocked
    end

    Note over T: Inside venue, T opens<br/>vote.contests embedded in event.<br/>vote-cast extension decrements<br/>bonus_votes_remaining per vote.
```

## Notes

- **Atomic inventory.** Postgres advisory lock on `ticket_id` ensures 1,000 concurrent buyers for 100 tickets resolve to exactly 100 paid bookings. The 901st request gets a clean 409 sold-out response.
- **QR token = server-signed JWT.** Single-use (`qr_used_at` flips on first scan); short TTL anchored to event end_at; impossible to forge because signed by service-role.
- **Sponsor logo in email.** When a Premium sponsor's `event_ticket_email` placement is active, the React Email template includes their logo. Reuses the `<SponsoredSurface>` component server-side via SSR.
- **Bonus votes.** Each ticket grants `event.tickets.bonus_votes` worth of voting privilege for any `vote.contests` row with `event_id = this_event_id`. `vote-cast` decrements `event.bookings.bonus_votes_remaining` before counting against daily quota.
- **Phase 3 only.** Phase 1 (Miss Elegance Colombia) does not ship tickets — the pageant uses free voting throughout.
