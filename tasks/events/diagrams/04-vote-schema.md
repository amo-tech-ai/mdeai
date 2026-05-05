---
id: VOTE-SCHEMA
phase: CORE
prd_section: 4.3 Database schemas, 01-contests.md §3
type: erd
related: [01-vote-cast-flow, 02-hybrid-scoring-formula, 11-integrated-schema-map]
---

# 04 — `vote.*` schema (ERD)

**What this shows.** All Phase 1 tables in the `vote.*` schema and their relationships. Source of truth: [`01-contests.md`](../01-contests.md) §3.

**Phase.** CORE — full schema migrates in Phase 1.

```mermaid
erDiagram
    contests ||--o{ categories : "1:N"
    contests ||--o{ entities : "1:N"
    contests ||--o{ votes : "1:N"
    contests ||--o{ entity_tally : "1:N"
    contests ||--o{ judges : "1:N"
    contests ||--o{ scoring_criteria : "1:N"
    contests ||--o{ paid_vote_orders : "1:N"

    categories ||--o{ entities : "0..1:N"
    entities ||--|| entity_tally : "1:1"
    entities ||--o{ votes : "1:N"
    entities ||--o{ judge_scores : "1:N"

    judges ||--o{ judge_scores : "1:N"
    scoring_criteria ||--o{ judge_scores : "1:N"

    votes ||--o| fraud_signals : "0..1:1"
    votes ||--o{ paid_vote_orders : "0..N:0..1"

    contests {
        uuid id PK
        text slug UK
        text kind "pageant | restaurant | event | generic"
        text title
        text status "draft | live | closed | archived"
        int free_votes_per_user_per_day
        bool paid_votes_enabled
        int judge_weight_pct "0..100"
        uuid org_id FK
        timestamptz starts_at
        timestamptz ends_at
        text scoring_formula "JSON: 0.5/0.3/0.2 default"
        uuid event_id FK "nullable Phase3+"
    }

    categories {
        uuid id PK
        uuid contest_id FK
        text slug
        text title
        int position
    }

    entities {
        uuid id PK
        uuid contest_id FK
        uuid category_id FK "nullable"
        text slug
        text display_name
        text bio
        text hero_url
        jsonb media
        jsonb socials
        vector embedding "768"
        bool approved
        timestamptz identity_verified_at "Phase1 pageant"
    }

    votes {
        uuid id PK
        uuid contest_id FK
        uuid entity_id FK
        uuid voter_user_id FK "nullable"
        text voter_anon_id "nullable"
        numeric weight "1.0 default"
        text source "audience | judge | paid"
        text ip_hash "daily-rotating salt"
        text device_hash
        text country
        numeric fraud_score "0..1"
        text fraud_status "pending | clean | suspicious | blocked"
        text idempotency_key UK
        timestamptz created_at
    }

    entity_tally {
        uuid entity_id PK
        uuid contest_id FK
        bigint audience_votes
        bigint paid_votes
        numeric judge_score
        numeric engagement_score
        numeric weighted_total
        int rank
        numeric trend_24h
        timestamptz updated_at
    }

    judges {
        uuid contest_id FK
        uuid user_id FK
        numeric weight "1.0 default"
    }

    scoring_criteria {
        uuid id PK
        uuid contest_id FK
        text key "beauty | talent | qa"
        text label
        int weight_pct
        int max_score
    }

    judge_scores {
        uuid contest_id FK
        uuid entity_id FK
        uuid judge_id FK
        uuid criterion_id FK
        numeric score
        text comment
        numeric ai_assist_score "Gemini side-panel"
        timestamptz created_at
    }

    fraud_signals {
        uuid vote_id PK
        text rules_hit "array L4 + L5"
        text ai_label "bot | collusion | clean"
        text ai_reason
        uuid reviewed_by FK
        timestamptz reviewed_at
    }

    paid_vote_orders {
        uuid id PK
        uuid payment_id FK "p1_payments"
        uuid contest_id FK
        uuid entity_id FK
        uuid buyer_user_id FK
        int votes_purchased
        int votes_credited
        timestamptz created_at
    }
```

## Notes

- **Phase 1 (Miss Elegance Colombia 2026, free voting):** all tables migrate. `paid_vote_orders` exists but unused until Phase 2.
- **`votes` is append-only.** Never updated. Shadow-block sets `fraud_status = 'blocked'` and the trigger sets `weight = 0` in `entity_tally` recompute.
- **`entity_tally` is materialized** via after-insert trigger — clients read this counter, not raw `votes` rows. Keeps finals-night load O(1) per leaderboard view.
- **`identity_verified_at`** on `entities` enforces the Phase 0 partnership agreement: a contestant cannot go public until admin moderation of waiver + ID is complete.
