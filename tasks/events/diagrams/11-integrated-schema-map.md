---
id: INTEGRATED-SCHEMA-MAP
phase: MVP
prd_section: 4.3 Database schemas
type: erd
related: [04-vote-schema, 06-sponsor-onboarding, 09-event-ticket-purchase]
---

# 11 — Integrated schema relationships across `vote.* / growth.* / sponsor.* / event.*` (ERD)

**What this shows.** The cross-schema **relationships** that make the bundle work. Field-level detail per schema lives in [`04-vote-schema.md`](./04-vote-schema.md) and the upstream specs ([`03-sponsorship-system.md`](../03-sponsorship-system.md), [`05-unified-platform.md`](../05-unified-platform.md), [`02-openclaw-growth.md`](../02-openclaw-growth.md)). This relationship-only view fits on one page; the full field-level ERD spans 22 entities and is split across the per-schema diagrams.

**Phase.** MVP — by Phase 3 all 4 schemas live; Phase 4 adds `trio.*`.

```mermaid
erDiagram
    EVENTS ||--o{ CONTESTS : "embeds 0..1:N"
    EVENTS ||--o{ TICKETS : "1:N"
    EVENTS ||--o{ BOOKINGS : "1:N"
    EVENTS ||--o{ SCHEDULE_ITEMS : "1:N"
    EVENTS ||--o{ APPLICATIONS : "0..1:N event-level sponsor"
    VENUES ||--o{ EVENTS : "0..1:N"

    CONTESTS ||--o{ ENTITIES : "1:N"
    CONTESTS ||--o{ VOTES : "1:N"
    CONTESTS ||--o{ APPLICATIONS : "0..1:N contest sponsor"
    CONTESTS ||--o{ OUTREACH_CAMPAIGNS : "0..1:N"
    CONTESTS ||--o{ MARKETING_ASSETS : "0..1:N"

    ENTITIES ||--o{ APPLICATIONS : "0..1:N contestant sponsor"

    APPLICATIONS ||--o{ PLACEMENTS : "1:N"
    APPLICATIONS ||--o{ INVOICES : "1:N"
    APPLICATIONS ||--o{ ASSETS_SPONSOR : "1:N"

    PLACEMENTS ||--o{ IMPRESSIONS : "1:N"
    PLACEMENTS ||--o{ CLICKS : "1:N"
    PLACEMENTS ||--o{ ATTRIBUTIONS : "1:N"
    PLACEMENTS ||--o{ ROI_DAILY : "1:N"

    VOTES ||--o| ATTRIBUTIONS : "0..1:1 sponsor ROI"

    OUTREACH_CAMPAIGNS ||--o{ COMMUNICATIONS : "1:N"
    COMMUNICATIONS ||--o{ COMMUNICATION_RECIPIENTS : "1:N"
    CONTACTS ||--o{ COMMUNICATION_RECIPIENTS : "1:N"
    CONTACTS ||--o{ REFERRAL_PAYOUTS : "1:N"
```

## The eight cross-schema FKs (the integration points)

| FK | From → To | Phase introduced | Why |
|---|---|---|---|
| 1 | `vote.contests.event_id` → `event.events.id` | 3 | embed contest in event |
| 2 | `event.bookings.user_id` → `auth.users.id` | 3 | ticket holder identity |
| 3 | `sponsor.applications.event_id` → `event.events.id` | 3 | event-level sponsor |
| 4 | `sponsor.applications.contest_id` → `vote.contests.id` | 2 | contest-level sponsor |
| 5 | `sponsor.applications.entity_id` → `vote.entities.id` | 2 | contestant sponsor |
| 6 | `sponsor.attributions.vote_id` → `vote.votes.id` | 2 | ROI link |
| 7 | `growth.outreach_campaigns.contest_id` → `vote.contests.id` | 2 | contest-bound campaign |
| 8 | `growth.marketing_assets` → `{vote.contests, event.events, sponsor.applications}` | 2 | multi-parent asset library |

All cross-schema FKs are **nullable** so each schema works standalone. Adding events doesn't require rewriting voting; adding sponsors doesn't require events.

## Per-schema field-level ERDs

| Schema | Diagram |
|---|---|
| `vote.*` | [04-vote-schema.md](./04-vote-schema.md) |
| `sponsor.*` | not yet diagrammed — see [03-sponsorship-system.md §3](../03-sponsorship-system.md) |
| `event.*` | not yet diagrammed — see [05-unified-platform.md §8](../05-unified-platform.md) |
| `growth.*` | not yet diagrammed — see [02-openclaw-growth.md `growth.*` schema](../02-openclaw-growth.md) + [07-ai-event-research.md §2](../07-ai-event-research.md) for nielsberglund 5-table additions |
| `trio.*` | not yet diagrammed — see [06-trio-integration.md §8](../06-trio-integration.md) |
