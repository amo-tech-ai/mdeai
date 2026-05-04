-- task 014: hybrid scoring trigger
-- Replaces the basic on_vote_insert increment with a full
-- recompute that handles audience normalization, judge scores,
-- weighted_total per scoring_formula JSONB, and DENSE_RANK.
-- Also enables Supabase Realtime on entity_tally (task 013).

-- ── 1. Full recompute function ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION vote.recompute_entity_tally(p_entity_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = vote, public
AS $$
DECLARE
  v_contest_id      uuid;
  v_formula         jsonb;
  v_w_audience      numeric;
  v_w_judges        numeric;
  v_audience_votes  bigint;
  v_paid_votes      bigint;
  v_max_audience    bigint;
  v_audience_norm   numeric;
  v_judge_norm      numeric;
  v_weighted        numeric;
  v_trend_24h       numeric;
BEGIN
  -- 1. Resolve contest_id + scoring_formula
  SELECT e.contest_id, c.scoring_formula
  INTO v_contest_id, v_formula
  FROM vote.entities e
  JOIN vote.contests c ON c.id = e.contest_id
  WHERE e.id = p_entity_id;

  IF v_contest_id IS NULL THEN RETURN; END IF;

  v_w_audience := COALESCE((v_formula->>'audience')::numeric, 0.5);
  v_w_judges   := COALESCE((v_formula->>'judges')::numeric, 0.3);

  -- 2. Count clean audience + paid votes for this entity
  SELECT
    COUNT(*) FILTER (WHERE source = 'audience' AND fraud_status <> 'blocked'),
    COUNT(*) FILTER (WHERE source = 'paid')
  INTO v_audience_votes, v_paid_votes
  FROM vote.votes
  WHERE entity_id = p_entity_id;

  -- 3. Max audience votes across the entire contest (for normalization)
  SELECT COALESCE(MAX(sub.cnt), 1)
  INTO v_max_audience
  FROM (
    SELECT COUNT(*) FILTER (WHERE source = 'audience' AND fraud_status <> 'blocked') AS cnt
    FROM vote.votes
    WHERE contest_id = v_contest_id
    GROUP BY entity_id
  ) sub;

  v_audience_norm := v_audience_votes::numeric / v_max_audience::numeric;

  -- 4. Judge score: weighted average across scoring_criteria, normalised 0..1
  --    Returns 0 when no judge scores exist yet.
  SELECT COALESCE(
    SUM(js.score * sc.weight_pct::numeric / 100.0)
    / NULLIF(SUM(sc.weight_pct::numeric / 100.0 * sc.max_score::numeric), 0),
    0
  )
  INTO v_judge_norm
  FROM vote.judge_scores js
  JOIN vote.scoring_criteria sc ON sc.id = js.criterion_id
  WHERE js.entity_id = p_entity_id;

  -- 5. Weighted total (engagement = 0 until signals wired)
  v_weighted := (v_audience_norm * v_w_audience) + (v_judge_norm * v_w_judges);

  -- 6. Trend: audience votes landed in the last 24 h
  SELECT COUNT(*) FILTER (
    WHERE source = 'audience'
      AND fraud_status <> 'blocked'
      AND created_at >= NOW() - interval '24 hours'
  )
  INTO v_trend_24h
  FROM vote.votes
  WHERE entity_id = p_entity_id;

  -- 7. Upsert entity_tally row
  INSERT INTO vote.entity_tally (
    entity_id, contest_id,
    audience_votes, paid_votes,
    judge_score, weighted_total, trend_24h,
    updated_at
  ) VALUES (
    p_entity_id, v_contest_id,
    v_audience_votes, v_paid_votes,
    v_judge_norm, v_weighted, v_trend_24h,
    NOW()
  )
  ON CONFLICT (entity_id) DO UPDATE SET
    audience_votes = EXCLUDED.audience_votes,
    paid_votes     = EXCLUDED.paid_votes,
    judge_score    = EXCLUDED.judge_score,
    weighted_total = EXCLUDED.weighted_total,
    trend_24h      = EXCLUDED.trend_24h,
    updated_at     = NOW();

  -- 8. Recompute DENSE_RANK for every entity in the contest
  WITH ranked AS (
    SELECT entity_id,
           DENSE_RANK() OVER (ORDER BY weighted_total DESC) AS rnk
    FROM vote.entity_tally
    WHERE contest_id = v_contest_id
  )
  UPDATE vote.entity_tally et
  SET rank = r.rnk
  FROM ranked r
  WHERE et.entity_id = r.entity_id
    AND et.contest_id = v_contest_id;
END;
$$;

-- ── 2. Trigger wrapper functions ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION vote.trigger_recompute_on_vote()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = vote, public
AS $$
BEGIN
  PERFORM vote.recompute_entity_tally(NEW.entity_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION vote.trigger_recompute_on_judge_score()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = vote, public
AS $$
BEGIN
  PERFORM vote.recompute_entity_tally(NEW.entity_id);
  RETURN NEW;
END;
$$;

-- ── 3. Replace old simple trigger with new recompute trigger ─────────────────

DROP TRIGGER IF EXISTS vote_votes_on_insert ON vote.votes;
DROP FUNCTION IF EXISTS vote.on_vote_insert();

CREATE TRIGGER tr_recompute_tally_on_vote
  AFTER INSERT ON vote.votes
  FOR EACH ROW
  EXECUTE FUNCTION vote.trigger_recompute_on_vote();

CREATE TRIGGER tr_recompute_tally_on_judge_score
  AFTER INSERT OR UPDATE ON vote.judge_scores
  FOR EACH ROW
  EXECUTE FUNCTION vote.trigger_recompute_on_judge_score();

-- ── 4. Enable Supabase Realtime on entity_tally (task 013) ──────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE vote.entity_tally;
