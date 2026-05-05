---
id: SPONSOR-ROI-ATTRIBUTION
phase: MVP
prd_section: 2.2 Epic E3.2, 03-sponsorship-system.md §7
type: flowchart
related: [06-sponsor-onboarding, 11-integrated-schema-map]
---

# 07 — Sponsor ROI attribution pipeline (flowchart)

**What this shows.** How an impression → click → vote turns into one row of attributed ROI in the sponsor dashboard. Last-click within a 24-hour window on `(viewer_anon_id OR viewer_user_id)`.

**Phase.** MVP — Phase 2 release blocker (CPL pricing depends on this).

```mermaid
flowchart TD
    classDef event fill:#dbeafe,stroke:#1e40af,color:#000
    classDef store fill:#fef3c7,stroke:#854d0e,color:#000
    classDef compute fill:#e9d5ff,stroke:#6b21a8,color:#000
    classDef out fill:#dcfce7,stroke:#166534,color:#000

    P[Sponsor placement<br/>renders on contest page]:::event
    I[POST /sponsor-impression]:::event
    DB1[sponsor.impressions<br/>row inserted]:::store

    C[Voter clicks sponsored surface]:::event
    CL[POST /sponsor-click]:::event
    DB2[sponsor.clicks<br/>row inserted]:::store
    R[302 redirect to UTM destination]:::event

    V[Voter casts a vote<br/>via vote-cast edge fn]:::event
    DB3[vote.votes row inserted]:::store
    TR[After-insert trigger:<br/>sponsor-attribute]:::compute

    Q1{Recent click in last 24h<br/>same anon_id or user_id?}:::compute
    DB4[sponsor.attributions<br/>vote_id linked to placement_id]:::store

    BILL{pricing_model = cpl?}:::compute
    DB5[sponsor.charge_events<br/>queue Stripe invoice line]:::store

    DAILY[sponsor-roi-rollup cron<br/>every 5 min]:::compute
    DB6[sponsor.roi_daily<br/>impressions, clicks, attributed_votes,<br/>conversions, revenue_cents]:::store

    RT[Realtime channel<br/>sponsor application id]:::compute
    DASH[Sponsor dashboard tiles<br/>tick within 2s]:::out
    AI[Daily Gemini ROI explainer<br/>3-sentence narrative]:::out

    P --> I --> DB1
    C --> CL --> DB2 --> R
    V --> DB3 --> TR
    TR --> Q1
    Q1 -- yes --> DB4
    Q1 -- no within window --> SKIP[No attribution<br/>vote still counts]:::store
    DB4 --> BILL
    BILL -- yes --> DB5
    BILL -- no --> NEXT[Next vote]
    DB1 --> DAILY
    DB2 --> DAILY
    DB4 --> DAILY
    DAILY --> DB6
    DB6 --> RT --> DASH
    DB6 --> AI --> DASH
```

## Edge cases handled

- **Anon → user upgrade.** When a `viewer_anon_id` resolves to a `user_id`, retro-attribute the last 24h of clicks to the new user's votes. One-shot SQL job on identity merge.
- **Multi-touch (Premium tier only).** If `application.attribution_model = 'multi_touch'`, distribute credit across last 3 placements seen — 50/30/20 split.
- **Click without vote.** Counted as engagement (not attribution); shown in dashboard CTR but not CPL revenue.
- **Vote without prior click.** Organic vote — no sponsor attribution.

## Notes

- **24-hour window.** Configurable per contest via `application.attribution_window_hours`; default 24, max 72 (matches typical pageant decision-cycle research).
- **Brand-safety.** If `vote.fraud_signals.fraud_status = 'blocked'`, the attribution is also voided — sponsor doesn't pay CPL on a fake vote.
- **Why this matters.** "How many real customers?" — the Phase 1 question Andrés asks his director. Phase 2 ships actual numbers, not promises.
