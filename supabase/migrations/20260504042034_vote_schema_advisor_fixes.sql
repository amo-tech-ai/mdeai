-- Fix advisor findings on vote.* schema:
-- 1. Missing FK indexes (unindexed_foreign_keys)
-- 2. RLS-enabled-no-policy on vote.fraud_signals
-- 3. Multiple permissive SELECT policies → consolidated into one per table

-- ─── 1. Missing FK indexes ────────────────────────────────────────────────────

CREATE INDEX vote_votes_entity_idx              ON vote.votes(entity_id);
CREATE INDEX vote_paid_orders_entity_idx        ON vote.paid_vote_orders(entity_id) WHERE entity_id IS NOT NULL;
CREATE INDEX vote_fraud_signals_reviewed_by_idx ON vote.fraud_signals(reviewed_by) WHERE reviewed_by IS NOT NULL;

-- ─── 2. fraud_signals: add SELECT policy for contest organizers ───────────────

CREATE POLICY fraud_signals_org_select ON vote.fraud_signals FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM vote.votes v
    JOIN vote.contests c ON c.id = v.contest_id
    WHERE v.id = fraud_signals.vote_id
      AND c.org_id = (SELECT auth.uid())
  ));

-- ─── 3. Consolidate multiple permissive SELECT policies ───────────────────────

-- vote.contests
DROP POLICY contests_public_select ON vote.contests;
DROP POLICY contests_org_select    ON vote.contests;
CREATE POLICY contests_select ON vote.contests FOR SELECT
  USING (status IN ('live','closed') OR org_id = (SELECT auth.uid()));

-- vote.categories
DROP POLICY categories_public_select ON vote.categories;
DROP POLICY categories_org_select    ON vote.categories;
CREATE POLICY categories_select ON vote.categories FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM vote.contests c WHERE c.id = categories.contest_id
      AND (c.status IN ('live','closed') OR c.org_id = (SELECT auth.uid()))
  ));

-- vote.entities
DROP POLICY entities_public_select ON vote.entities;
DROP POLICY entities_org_select    ON vote.entities;
CREATE POLICY entities_select ON vote.entities FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM vote.contests c WHERE c.id = entities.contest_id
      AND (c.org_id = (SELECT auth.uid()) OR (c.status IN ('live','closed') AND entities.approved = true))
  ));

-- vote.entity_tally
DROP POLICY tally_public_select ON vote.entity_tally;
DROP POLICY tally_org_select    ON vote.entity_tally;
CREATE POLICY tally_select ON vote.entity_tally FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM vote.contests c WHERE c.id = entity_tally.contest_id
      AND (c.status IN ('live','closed') OR c.org_id = (SELECT auth.uid()))
  ));

-- vote.judges
DROP POLICY judges_own_select ON vote.judges;
DROP POLICY judges_org_select ON vote.judges;
CREATE POLICY judges_select ON vote.judges FOR SELECT
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM vote.contests c WHERE c.id = judges.contest_id
        AND c.org_id = (SELECT auth.uid())
    )
  );

-- vote.scoring_criteria
DROP POLICY criteria_public_select ON vote.scoring_criteria;
DROP POLICY criteria_org_select    ON vote.scoring_criteria;
CREATE POLICY criteria_select ON vote.scoring_criteria FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM vote.contests c WHERE c.id = scoring_criteria.contest_id
      AND (c.status IN ('live','closed') OR c.org_id = (SELECT auth.uid()))
  ));

-- vote.judge_scores
DROP POLICY judge_scores_own_select ON vote.judge_scores;
DROP POLICY judge_scores_org_select ON vote.judge_scores;
CREATE POLICY judge_scores_select ON vote.judge_scores FOR SELECT
  USING (
    judge_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM vote.contests c WHERE c.id = judge_scores.contest_id
        AND c.org_id = (SELECT auth.uid())
    )
  );

-- vote.paid_vote_orders
DROP POLICY paid_orders_own_select ON vote.paid_vote_orders;
DROP POLICY paid_orders_org_select ON vote.paid_vote_orders;
CREATE POLICY paid_orders_select ON vote.paid_vote_orders FOR SELECT
  USING (
    buyer_user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM vote.contests c WHERE c.id = paid_vote_orders.contest_id
        AND c.org_id = (SELECT auth.uid())
    )
  );
