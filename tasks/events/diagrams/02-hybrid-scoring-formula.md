---
id: HYBRID-SCORING-FORMULA
phase: CORE
prd_section: 1.2 Solution, 5.1 Phase 1 ships, 6 §Q3 Decision
type: flowchart
related: [01-vote-cast-flow, 04-vote-schema]
---

# 02 — Hybrid scoring formula (flowchart)

**What this shows.** How a contestant's final score is computed from three weighted inputs — public votes (50%), judge scores (30%), engagement signal (20%). Default for pageant-class contests like Miss Elegance Colombia 2026. Organizer can override per contest; the formula in use is always rendered on the public Trust page for transparency.

**Phase.** CORE — must be visible on the public Trust page before Phase 1 voting opens.

```mermaid
flowchart TD
    classDef input fill:#dbeafe,stroke:#1e40af,stroke-width:2px,color:#000
    classDef weight fill:#fef3c7,stroke:#92400e,stroke-width:2px,color:#000
    classDef compute fill:#e0e7ff,stroke:#4338ca,stroke-width:2px,color:#000
    classDef output fill:#dcfce7,stroke:#166534,stroke-width:2px,color:#000

    A1[Public votes<br/>vote.entity_tally.audience_votes]:::input
    A2[Audience normalize<br/>vote_count / max_votes_in_contest]:::compute
    A3[× 0.50]:::weight

    B1[Judge scores<br/>vote.judge_scores per criterion]:::input
    B2[Judge normalize<br/>weighted_avg / 10]:::compute
    B3[× 0.30]:::weight

    C1[Engagement signal<br/>shares + reply-rate + dwell]:::input
    C2[Engagement normalize<br/>logarithmic z-score]:::compute
    C3[× 0.20]:::weight

    SUM[Sum the three<br/>weighted contributions]:::compute
    OUT[Final score 0..1<br/>vote.entity_tally.weighted_total]:::output
    LB[Public leaderboard<br/>updated via Realtime]:::output
    TP[Trust page renders formula<br/>per active contest]:::output

    A1 --> A2 --> A3 --> SUM
    B1 --> B2 --> B3 --> SUM
    C1 --> C2 --> C3 --> SUM
    SUM --> OUT
    OUT --> LB
    OUT -.shown to public.-> TP

    subgraph Override[Organizer override per contest]
        direction LR
        OA[Audience-only<br/>1.0 / 0.0 / 0.0]
        OJ[Judge-only<br/>0.0 / 1.0 / 0.0]
        OS[Custom split<br/>any 3 weights summing to 1.0]
    end
    Override -.replaces default.-> SUM
```

## Notes

- **Default 0.5 / 0.3 / 0.2** for pageant-class. Restaurant week defaults to 0.7 / 0.0 / 0.3 (audience + engagement, no judges).
- **Engagement** is computed from `share_clicks` + `wa_reply_rate` + average `time_on_contest_page`, normalized via log z-score.
- **Override is contractual.** Organizer signs off in the partnership agreement (Phase 0). Cannot change mid-contest.
- **Trust page.** The active formula is always shown to voters, with plain-Spanish-Paisa explanation of each weight.
