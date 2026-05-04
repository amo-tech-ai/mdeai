---
task_id: 014-hybrid-scoring-trigger
diagram_id: HYBRID-SCORING-FORMULA
prd_section: 1.2 Solution, 6 Q3 Decision (50/30/20)
title: entity_tally recompute trigger with hybrid 50/30/20 scoring formula
phase: PHASE-2-CONTESTS
priority: P0
status: Open
estimated_effort: 1 day
area: backend
skill:
  - supabase-postgres-best-practices
  - supabase
  - mdeai-project-gates
edge_function: null
schema_tables:
  - vote.entity_tally
  - vote.votes
  - vote.judge_scores
  - vote.contests
depends_on:
  - 010-vote-schema
mermaid_diagram: ../diagrams/02-hybrid-scoring-formula.md
---

## Summary

| Aspect | Details |
|---|---|
| **Trigger** | AFTER INSERT on `vote.votes` AND AFTER INSERT/UPDATE on `vote.judge_scores` |
| **Computes** | `weighted_total = audience_norm * w_audience + judge_norm * w_judges + engagement_norm * w_engagement` |
| **Default weights** | audience 0.5, judges 0.3, engagement 0.2 (per `vote.contests.scoring_formula` JSONB) |
| **Performance** | Sub-trigger: <50ms even at 1000 votes/min |
| **Real-world** | "Final scoring formula visible to public on Trust page; reconciles audience + judges + engagement deterministically" |

## Description

**The situation.** Schema exists (task 010). Votes are inserted (task 011). Without this trigger, `entity_tally.weighted_total` stays at 0 — leaderboard ranking is incorrect.

**Why it matters.** Hybrid scoring is the centerpiece of the Trust narrative. The formula must be deterministic, reproducible, and publicly visible. Errors here = immediate trust damage.

**What already exists.** `vote.entity_tally` table (task 010) has all needed columns. `vote.contests.scoring_formula` JSONB stores per-contest weights (default `{"audience":0.5,"judges":0.3,"engagement":0.2}`).

**The build.** A Postgres trigger function that:
1. On vote insert → recompute `audience_votes`, `paid_votes`, `engagement_score` for the entity
2. On judge_scores insert/update → recompute `judge_score` (avg across all criteria, normalized to 0..1)
3. Reads `vote.contests.scoring_formula` for the contest's active weights
4. Computes `weighted_total = sum(component_norm × weight)`
5. Updates `entity_tally` row atomically with all values + `updated_at = NOW()`
6. Recomputes `rank` for all entities in the contest (DENSE_RANK over weighted_total DESC)

**Example.** Camila votes for Laura (audience vote, weight=1.0, fraud_status=clean). Trigger fires. Laura's audience_votes goes 287→288. Audience normalize: 288/max_in_contest. Judge score unchanged. Engagement signal recomputed (shares/replies in last 24h). Final weighted_total: 0.63. Rank in contest: 3rd. Trigger commits in 38ms. Realtime broadcasts.

## Rationale

**Problem.** Without trigger, weighted_total stays 0; leaderboard ranks alphabetically; trust narrative collapses.
**Solution.** Atomic trigger that reconciles all 3 score components per `scoring_formula` JSONB.
**Impact.** Trust page (task 015) renders the live formula; leaderboard (tasks 003 + 004) shows correct ranks; finals reveal computes deterministically.

## User Stories

| As a... | I want to... | So that... |
|---|---|---|
| Voter | see hybrid scoring (50/30/20) reflected in the rank | I trust the result |
| Organizer (Daniela) | configure custom weights per contest | I can override default for restaurant week (0.7/0/0.3) |
| Auditor | replay historical votes and reproduce final scores | the platform is verifiable |
| Frontend | read pre-computed `weighted_total` from `entity_tally` | leaderboard query stays O(1) |

## Goals

1. **Primary:** weighted_total updates atomically on every vote/judge_score change.
2. **Quality:** Trigger latency <50ms p95 even at 1000 votes/min.
3. **Determinism:** Same inputs → same outputs always.

## Acceptance Criteria

- [ ] Function `vote.recompute_entity_tally(p_entity_id uuid)` exists, takes one param, recomputes the row.
- [ ] Trigger `tr_recompute_tally_on_vote` AFTER INSERT ON vote.votes calls the function with NEW.entity_id.
- [ ] Trigger `tr_recompute_tally_on_judge_score` AFTER INSERT OR UPDATE ON vote.judge_scores calls the function with NEW.entity_id.
- [ ] Function reads `scoring_formula` from `vote.contests` row (joined via entity).
- [ ] Audience normalization: `audience_votes / NULLIF(max_audience_in_contest, 0)`.
- [ ] Judge normalization: weighted average across `vote.scoring_criteria` weights, divided by max_score.
- [ ] Engagement normalization: log z-score of (shares + replies + dwell_seconds_avg) over the contest's distribution.
- [ ] `weighted_total` computed as sum of component × weight from formula JSONB.
- [ ] Function uses `weight=0` for any vote with `fraud_status='blocked'` or `fraud_status='suspicious'` (configurable per-contest via formula).
- [ ] Rank recomputed: DENSE_RANK() OVER (PARTITION BY contest_id ORDER BY weighted_total DESC).
- [ ] `trend_24h` recomputed: weighted_total minus weighted_total at NOW()-24h (using `entity_tally_history` if exists, else 0).
- [ ] `entity_tally.updated_at = NOW()`.
- [ ] Function is `SECURITY DEFINER` so it bypasses RLS (can read all related rows).
- [ ] Trigger is idempotent (re-running on same vote produces same final state).
- [ ] Performance test: 1000 votes inserted in 60s; p95 trigger latency <50ms.

## Wiring Plan

| Layer | File | Action |
|---|---|---|
| Migration | `supabase/migrations/<timestamp>_vote_tally_trigger.sql` | Create |
| Test | `supabase/tests/vote-tally-trigger.test.sql` (pgTAP) | Create — 6 test scenarios |

## Schema (function signature)

```sql
CREATE OR REPLACE FUNCTION vote.recompute_entity_tally(p_entity_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = vote, public
AS $$
DECLARE
  v_contest_id uuid;
  v_formula jsonb;
  v_audience_score numeric;
  v_judge_score numeric;
  v_engagement_score numeric;
  v_weighted numeric;
BEGIN
  -- 1. Read contest_id + scoring_formula
  SELECT contest_id INTO v_contest_id FROM vote.entities WHERE id = p_entity_id;
  SELECT scoring_formula INTO v_formula FROM vote.contests WHERE id = v_contest_id;

  -- 2. Compute audience normalize
  -- ... (full logic in migration)

  -- 3. UPSERT into entity_tally
  INSERT INTO vote.entity_tally (entity_id, contest_id, audience_votes, paid_votes,
                                  judge_score, engagement_score, weighted_total, updated_at)
  VALUES (p_entity_id, v_contest_id, ...)
  ON CONFLICT (entity_id) DO UPDATE SET
    audience_votes = EXCLUDED.audience_votes,
    -- ...
    updated_at = NOW();

  -- 4. Recompute rank for ALL entities in the contest
  WITH ranked AS (
    SELECT entity_id, DENSE_RANK() OVER (ORDER BY weighted_total DESC) AS rnk
    FROM vote.entity_tally WHERE contest_id = v_contest_id
  )
  UPDATE vote.entity_tally et SET rank = r.rnk FROM ranked r
  WHERE et.entity_id = r.entity_id;
END;
$$;

CREATE TRIGGER tr_recompute_tally_on_vote
  AFTER INSERT ON vote.votes
  FOR EACH ROW
  EXECUTE FUNCTION vote.trigger_recompute_tally_on_vote();

-- (Trigger wrapper extracts entity_id from NEW and calls recompute_entity_tally)
```

## Edge Cases

| Scenario | Expected Behavior |
|---|---|
| Contest has no judges yet | judge_norm = 0; formula still computes audience + engagement only |
| Engagement signal not yet implemented | engagement_score = 0; formula treats as null |
| Vote with fraud_status='suspicious' | weight = 0; doesn't contribute to audience_votes |
| max_audience_in_contest = 0 (no votes yet) | NULLIF protects from div-by-zero; audience_norm = 0 |
| Custom formula: restaurant week 0.7/0.0/0.3 | judge component multiplied by 0; effectively excluded |
| Race condition: 2 votes for same entity simultaneously | Both triggers run; last one wins; rank recompute is idempotent — final state is correct |
| Trigger fails on a single vote | Vote insert is rolled back (transactional); user gets 500; needs retry |

## Real-World Examples

**Scenario 1 — Miss Elegance finals night.** 6 finalists. 22,000 audience votes. 5 judges have submitted scores. Engagement signals tracked over 30 days. Each new vote triggers recompute. Laura's components: audience 0.91 × 0.5 = 0.455, judges 8.4/10 × 0.3 = 0.252, engagement +1.2σ → 0.78 × 0.2 = 0.156. Total = 0.863. Rank: 1st. **Without trigger,** weighted_total stays at 0; leaderboard is alphabetical chaos.

**Scenario 2 — Restaurant week (audience-only weighting).** Daniela configures "Best Bandeja Paisa" with `scoring_formula = {"audience": 0.7, "judges": 0.0, "engagement": 0.3}`. Trigger reads formula; judge component is multiplied by 0. Laura's restaurant gets pure audience + engagement weighted score. **Without per-contest formula support,** all contests would be locked to 0.5/0.3/0.2.

**Scenario 3 — Mass shadow-block.** Admin shadow-blocks a 200-vote bot ring. Trigger sees `weight=0` for those votes. Laura's audience_votes excludes them. weighted_total drops appropriately. Rank may shift down. **Without weight-aware aggregation,** shadow-blocking does nothing visible.

## Outcomes

| Before | After |
|---|---|
| weighted_total stays 0; leaderboard nonsense | Hybrid 50/30/20 reconciles to deterministic rank |
| Per-contest formula override not possible | `scoring_formula` JSONB lets organizer customize per contest |
| Shadow-blocked votes still inflate count | weight=0 votes excluded from audience_votes |
| Rank requires expensive frontend computation | rank pre-computed in trigger, O(1) read |

## Verification

- pgTAP test: insert vote → tally updated correctly within transaction.
- pgTAP test: insert judge_score → tally updated correctly.
- pgTAP test: contest with custom formula → applied weights match.
- pgTAP test: shadow-blocked vote (weight=0) → audience_votes unchanged.
- pgTAP test: 1000 votes in 60s → p95 trigger time <50ms (use EXPLAIN ANALYZE on a sample).
- Manual: query `entity_tally` after a vote and verify weighted_total matches hand-computed value.
- `mdeai-project-gates` skill clean.

## See also

- [`tasks/events/diagrams/02-hybrid-scoring-formula.md`](../diagrams/02-hybrid-scoring-formula.md) — formula diagram
- [`tasks/events/01-contests.md`](../01-contests.md) — full schema
- [`.claude/skills/supabase-postgres-best-practices/`](../../../.claude/skills/supabase-postgres-best-practices/) — trigger patterns
