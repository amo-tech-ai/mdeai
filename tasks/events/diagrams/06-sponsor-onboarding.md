---
id: SPONSOR-ONBOARDING
phase: MVP
prd_section: 2.2 Epic E3, 4.4 sponsor edge fns, 03-sponsorship-system.md §2
type: sequence
related: [07-sponsor-roi-attribution, 11-integrated-schema-map]
---

# 06 — Sponsor onboarding end-to-end (sequence)

**What this shows.** From a brand manager visiting `/sponsor/apply` to their logo flipping live on the contest page. Phase 2 ships the full self-serve flow; Phase 1 has admin-only manual configuration of one `contest_header` surface.

**Phase.** MVP — Phase 2 release blocker.

```mermaid
sequenceDiagram
    autonumber
    actor B as Brand manager (Andrés)
    participant W as /sponsor/apply<br/>4-step wizard
    participant DB as sponsor.applications
    participant ST as Storage sponsor_assets
    participant GM as Gemini moderation
    participant SC as Stripe Checkout
    participant ADM as Admin (mdeai ops)
    participant ADP as /admin/sponsorships
    participant SP as sponsor.placements
    participant CR as Contest pages<br/>(SponsoredSurface)

    B->>W: Step 1 - Company details
    W->>DB: INSERT applications (status=draft)
    B->>W: Step 2 - Pick contest, activation, tier
    W->>DB: UPDATE draft
    B->>W: Step 3 - Upload assets
    W->>ST: Signed PUT logo + video
    W->>GM: Moderate each asset
    GM-->>W: clean | flagged
    opt Flagged
        W-->>B: Re-upload required
    end
    B->>W: Step 4 - Submit
    W->>DB: UPDATE applications SET status=submitted

    par Admin notification
        DB->>ADP: Open issue in approval queue
        ADP-->>ADM: Slack/Email ping (24h SLA)
    and Stripe Checkout
        W->>SC: Create checkout session
        SC-->>B: Redirect to payment page
        B->>SC: Pay
        SC->>W: payment_intent.succeeded webhook
        W->>DB: UPDATE invoices SET status=paid
    end

    ADM->>ADP: Review application
    ADP->>ST: Get signed URLs for assets
    ADP->>GM: AI moderation pre-check report
    GM-->>ADP: Brand legal in CO ✓<br/>Competitor conflict: none
    ADM->>ADP: Approve

    ADP->>DB: UPDATE status=approved
    ADP->>SP: INSERT placements (one per surface, active=false)
    Note right of SP: title_naming + leaderboard_footer +<br/>contestant_profile + wa_broadcast = 4 placement rows

    Note over SP: At placement.start_at,<br/>cron flips active=true
    SP->>CR: SponsoredSurface reads active placements
    CR-->>B: Logo live on /vote/:slug

    Note over B: Andrés sees ROI dashboard<br/>filling with impressions/clicks
```

## Notes

- **One application → many placements.** A Premium tier produces 5 placement rows (one per surface). Bronze produces 1.
- **`active=false` until `start_at`** so an early-paying sponsor doesn't appear before their contracted start date. Cron flips at the boundary.
- **Brand-safety guardrail (Phase 4).** If a fraud spike or judge controversy hits during a sponsor's window, `active` flips to `false` automatically until admin clears.
- **Phase 1 simplification.** Admin manually creates `placements` rows for the first sponsor of Miss Elegance Colombia 2026 — no wizard yet. Wizard ships in Phase 2.
