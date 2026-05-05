---
id: AI-ROI-OPTIMIZATION-LOOP
phase: ADVANCED
prd_section: 3.1 AI capabilities, 03-sponsorship-system.md §6 AI tools
type: flowchart
related: [07-sponsor-roi-attribution, 13-trio-architecture]
---

# 15 — AI ROI optimization loop (flowchart)

**What this shows.** The "AI proposes, human applies" loop for sponsor campaign optimization. Daily Gemini insight reads `sponsor.roi_daily`, identifies underperforming surfaces or opportune time-windows, and proposes one-click actions for the admin. Admin approves; the system applies; metrics improve; loop continues.

**Phase.** ADVANCED — Phase 4 release blocker; depends on 30+ days of `sponsor.roi_daily` data from Phase 2/3.

```mermaid
flowchart TD
    classDef store fill:#dbeafe,stroke:#1e40af,color:#000
    classDef ai fill:#e9d5ff,stroke:#6b21a8,color:#000
    classDef human fill:#fef3c7,stroke:#854d0e,color:#000
    classDef apply fill:#dcfce7,stroke:#166534,color:#000
    classDef gate fill:#fee2e2,stroke:#991b1b,color:#000

    DB[(sponsor.roi_daily<br/>last 30 days)]:::store
    BASE[(Reference baselines<br/>median CTR by surface + time)]:::store
    DB2[(sponsor.placements<br/>active rules + weights)]:::store

    READ[Daily cron 09:00 ART<br/>per active application]:::ai
    HER[Hermes spawns sub-agent<br/>per application]:::ai
    REASON[Reasoning over deltas vs baseline<br/>Gemini 3.1-pro]:::ai

    GUARD{Output JSON-schema valid?<br/>No invented numbers?}:::gate
    REJECT[Discard + log<br/>open eng issue]:::gate

    PROPOSE[Propose 1-3 actions<br/>e.g. shift weight from X to Y<br/>+12% expected CTR]:::ai
    EXPLAIN[Plain Spanish-Paisa<br/>3-sentence narrative<br/>en first then es-CO]:::ai

    DB3[(growth.marketing_assets<br/>kind=ai_insight)]:::store
    DASH[/sponsor/dashboard tile<br/>Insight of the day]:::human

    ADM{Admin one-click apply?}:::human
    APPLY[Update sponsor.placements<br/>weight or active or time_window]:::apply
    AB{Set up A/B test?<br/>Thompson sampling]:::human
    TRACK[(Track lift over 7 days<br/>vs control)]:::store

    REJECT2[No change]:::gate

    DB --> READ
    BASE --> READ
    DB2 --> READ
    READ --> HER --> REASON
    REASON --> GUARD
    GUARD -- no --> REJECT
    GUARD -- yes --> PROPOSE
    PROPOSE --> EXPLAIN
    EXPLAIN --> DB3
    DB3 --> DASH
    DASH --> ADM
    ADM -- yes --> APPLY
    ADM -- no --> REJECT2
    APPLY --> AB
    AB -- yes --> TRACK
    AB -- no --> DB2

    TRACK --> READ
    REJECT2 --> READ
    APPLY --> READ
```

## Example insights and actions

| Gemini observation | Proposed action | Apply mechanism |
|---|---|---|
| CTR rose 41% Tuesday 18:00–21:00 in Laureles | Double `weight` for `push_notif` placement Tue 18:00–21:00 | UPDATE `sponsor.placements.weight = 200` for that time window |
| `event_ticket_email` placement 3× CTR vs `digital_banner` | Shift 30% of impression budget from banner to email | UPDATE active flags + new placement weights |
| Sponsor's audience overlap with `vote.contests` voters is 78% | Recommend cross-promotion bundle for next quarter | Open Paperclip issue for sales team |
| `wa_broadcast` watermark CTR 2× higher than baseline | Apply this watermark across all 5 contests in portfolio | Bulk UPDATE placements |

## Guardrails

- **No invented numbers.** Eval on 70 synthetic narratives — 0 hallucinated stats accepted (hard requirement). Regex + JSON-schema check.
- **Approve-before-apply.** Admin one-click; never silent application.
- **A/B for ambiguous changes.** Thompson sampling over 4 placement variants; auto-pick winner after statistical significance.
- **Reversibility.** Every applied change recorded in `trio.handoffs` with prior state. One-click revert.
- **Cost cap.** Max 1 Gemini Pro call per active application per day (~$0.05/sponsor/day at scale).

## Notes

- **Why ADVANCED phase.** Optimization loops only matter once you have enough volume to optimize. 30+ days of data + 5+ active sponsors is the practical floor. Earlier than that, the AI is overfitting on noise.
- **The human stays in the loop.** This is the "AI proposes, doesn't apply" pattern from `ai-interaction-patterns.md`. The dashboard tile is the human checkpoint, not a bypass.
- **Hermes Curator (Phase 4 v0.12.0+).** As Hermes accumulates approved → applied → measured-lift cases, Curator promotes the most-effective patterns to a stable "playbook" that's auto-suggested to new sponsors with similar profiles.
