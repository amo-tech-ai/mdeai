---
id: OUTREACH-CAMPAIGN-FLOW
phase: MVP
prd_section: 02-openclaw-growth.md, 07-ai-event-research.md (nielsberglund schema)
type: flowchart
related: [11-integrated-schema-map]
---

# 08 — Compliant outreach campaign flow (flowchart)

**What this shows.** From Apify nightly enrichment to a personalized WhatsApp/email landing in an influencer's inbox. Compliance rails enforced as hard rules: 50/day cap, suppression list, bounce-rate auto-pause.

**Phase.** MVP — Phase 2 release blocker; **does NOT ship in Phase 1** (Miss Elegance Colombia uses inbound-only — contest is the viral hook).

```mermaid
flowchart TD
    classDef ext fill:#fed7aa,stroke:#9a3412,color:#000
    classDef cron fill:#fef3c7,stroke:#854d0e,color:#000
    classDef ai fill:#e9d5ff,stroke:#6b21a8,color:#000
    classDef store fill:#dbeafe,stroke:#1e40af,color:#000
    classDef gate fill:#fee2e2,stroke:#991b1b,color:#000
    classDef ok fill:#dcfce7,stroke:#166534,color:#000

    AP[Apify actors<br/>IG and TikTok hashtag scrapers]:::ext
    CRON1[OpenClaw cron 02:00 ART<br/>nightly enrichment]:::cron
    GM1[Gemini classify<br/>niche tags + city + influence score]:::ai
    GM2[Gemini text-embedding-004<br/>bio + recent posts]:::ai
    DB1[growth.contacts<br/>upsert on platform + handle]:::store

    SEG[Segment filter<br/>e.g. medellin_beauty_micro<br/>top 200 by score]:::cron
    DRAFT[For each contact:<br/>Gemini personalize a single line]:::ai
    URL{Output contains<br/>invented URL?}:::gate
    REJECT[Reject + flag<br/>for human review]:::gate
    QUEUE[INSERT growth.communications<br/>+ growth.communication_recipients<br/>status=queued]:::store

    CRON2[Outreach send-loop<br/>every 30 min 09 to 18 ART]:::cron
    CAP{daily_cap reached?<br/>50 per channel per sender}:::gate
    PAUSE[Skip this run<br/>resume tomorrow]:::gate
    OPT{Contact opted out?}:::gate
    SKIP[Skip this contact<br/>do not send]:::gate
    BOUNCE{bounce_rate > 5%<br/>over 7 days?}:::gate
    HALT[Auto-pause campaign<br/>open admin issue]:::gate

    SEND[Send via channel]:::cron
    TW[Twilio WA Business<br/>template message]:::ext
    SG[SendGrid<br/>HTML email]:::ext
    TG[Telegram bot]:::ext

    DLR[Delivered / Opened / Clicked<br/>provider webhooks]:::ext
    UPD[UPDATE recipients<br/>delivered_at opened_at clicked_at]:::store

    REPLY[Inbound reply detected]:::ext
    SENT[Gemini classify<br/>interested cold opt_out]:::ai
    SET_OPT[SET opt_out=true<br/>if stop unsubscribe remove no]:::store
    CONV[INSERT conversion_event<br/>shared registered voted]:::store

    AP --> CRON1 --> GM1 --> DB1
    DB1 --> GM2 --> DB1
    DB1 --> SEG --> DRAFT --> URL
    URL -- yes --> REJECT
    URL -- no --> QUEUE
    QUEUE --> CRON2 --> CAP
    CAP -- yes --> PAUSE
    CAP -- no --> OPT
    OPT -- yes --> SKIP
    OPT -- no --> BOUNCE
    BOUNCE -- yes --> HALT
    BOUNCE -- no --> SEND
    SEND --> TW
    SEND --> SG
    SEND --> TG
    TW --> DLR
    SG --> DLR
    TG --> DLR
    DLR --> UPD
    UPD --> REPLY
    REPLY --> SENT
    SENT --> SET_OPT
    SENT --> CONV
```

## Hard compliance rules

| Rule | Enforced where |
|---|---|
| 50 sends/day/channel/sender | `growth.outreach_campaigns.daily_cap NOT NULL` |
| Suppression honored ≤24h | `growth.contacts.opt_out` + inbound watcher |
| Bounce rate < 5% rolling 7d | Auto-pause job; admin issue opened |
| No invented URLs in AI output | regex `https?://` validation in personalize step |
| Email unsubscribe in every send | Static template footer |
| WA template-only first contact | Free-form unlocks 24h after their reply |
| IG/TikTok DM **only after** prior reply elsewhere | Channel branch logic in send-loop |

## Notes

- **Phase 1 does NOT ship outreach.** The contest itself is the viral hook. Phase 1 monetizes via sponsor sales against the live contest, not via outreach campaigns.
- **Phase 2 starts with hand-curated top-50** influencers, not full 200/day. Volume ramps gradually with Twilio reputation.
- **nielsberglund schema** (campaigns / communications / communication_recipients / marketing_assets / asset_distributions) replaces our older outreach_messages structure and is what the diagram references.
