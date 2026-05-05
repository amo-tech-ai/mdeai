---
id: EVENT-CREATION-WIZARD
phase: MVP
prd_section: 2.2 Epic E2.1, 05-unified-platform.md §user flows
type: flowchart
related: [09-event-ticket-purchase, 11-integrated-schema-map]
---

# 10 — Organizer event-creation wizard (flowchart)

**What this shows.** Daniela's 6-step path from "I have an event in my head" to "published with embedded contests, tickets, and sponsor pricing" in 30 minutes. Loads the [`event-planner`](../../../.claude/skills/event-planner/SKILL.md) skill's logistics checklist; auto-generates a brief PDF on publish via [`event-briefs`](../../../.claude/skills/event-briefs/SKILL.md).

**Phase.** MVP — Phase 3 release blocker.

```mermaid
flowchart TD
    classDef ui fill:#dbeafe,stroke:#1e40af,color:#000
    classDef ai fill:#e9d5ff,stroke:#6b21a8,color:#000
    classDef store fill:#fef3c7,stroke:#854d0e,color:#000
    classDef gate fill:#fee2e2,stroke:#991b1b,color:#000
    classDef out fill:#dcfce7,stroke:#166534,color:#000

    START([Organizer at /host/event/new]):::ui

    S1[Step 1 - Basics<br/>title - description - kind - city - dates]:::ui
    DB1[(Save draft to event.events<br/>status=draft)]:::store

    S2[Step 2 - Venue<br/>pick from event.venues<br/>or create new]:::ui
    DB2[(event.venues link or insert)]:::store

    S3[Step 3 - Tickets<br/>tier name + price + qty + bonus_votes]:::ui
    DB3[(event.tickets rows)]:::store

    S4[Step 4 - Schedule<br/>day-by-day timeline<br/>preloaded from event-planner skill]:::ui
    PLAN[event-planner skill<br/>12mo - 9mo - 6mo - day-of checklist]:::ai
    DB4[(event.schedule_items rows)]:::store

    S5[Step 5 - Contests<br/>add embedded vote.contests<br/>with event_id pre-filled]:::ui
    DB5[(vote.contests rows<br/>event_id NOT NULL)]:::store

    S6[Step 6 - Sponsor pricing<br/>configure tier prices<br/>or accept defaults]:::ui
    DB6[(internal pricing card<br/>shown on /sponsor/apply)]:::store

    REVIEW[Review summary<br/>show all 6 steps]:::ui
    VAL{All required fields<br/>valid - dates ordered -<br/>capacity within venue?}:::gate
    FIX[Show inline errors]:::gate

    PUB[Click Publish]:::ui
    BRIEF[event-briefs skill<br/>Gemini generates<br/>brief PDF]:::ai
    AS[(growth.marketing_assets<br/>kind=one_pager)]:::store

    LIVE[(event.events status=published)]:::store
    NOT[Notify sponsors of new contest]:::out
    EXP[Calendar export ICS]:::out
    SHR[Share link generated<br/>with UTM]:::out

    START --> S1 --> DB1
    DB1 --> S2 --> DB2
    DB2 --> S3 --> DB3
    DB3 --> S4
    PLAN -.preloads.-> S4
    S4 --> DB4
    DB4 --> S5 --> DB5
    DB5 --> S6 --> DB6
    DB6 --> REVIEW --> VAL
    VAL -- no --> FIX --> S1
    VAL -- yes --> PUB
    PUB --> LIVE
    PUB --> BRIEF --> AS
    LIVE --> NOT
    LIVE --> EXP
    LIVE --> SHR
```

## Notes

- **Draft persists on blur** — refresh-safe across all 6 steps. Daniela never loses work.
- **`event-planner` preloads** the timeline checklist as suggested `schedule_items` items the organizer can accept or override. Saves ~15 minutes per event.
- **`event-briefs` Gemini call** runs on publish, not earlier — only finalized data goes into the brief PDF. Brief lives in `growth.marketing_assets` and is shared with sponsors automatically.
- **Validation gate** rejects: `ends_at < starts_at`, sum of ticket qty > venue capacity, embedded contest with status='live' but contest dates outside event range.
- **30-minute target** verified with 5-buyer dogfood cohort before Phase 3 ships.
