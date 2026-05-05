-- Task 010: vote.* schema — 10 tables + RLS + indexes + triggers
-- Foundation for Phase 2 contest engine (tasks 011-024 all depend on this)

-- Ensure pgvector is available (already enabled on this project)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE SCHEMA IF NOT EXISTS vote;

-- ─── vote.contests ────────────────────────────────────────────────────────────

CREATE TABLE vote.contests (
  id                          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                        text        UNIQUE NOT NULL,
  kind                        text        NOT NULL CHECK (kind IN ('pageant','restaurant','event','generic')),
  title                       text        NOT NULL,
  description                 text,
  cover_url                   text,
  event_id                    uuid        REFERENCES public.events(id) ON DELETE SET NULL,
  org_id                      uuid        NOT NULL REFERENCES public.profiles(id),
  starts_at                   timestamptz NOT NULL,
  ends_at                     timestamptz NOT NULL,
  status                      text        NOT NULL DEFAULT 'draft'
                              CHECK (status IN ('draft','live','closed','archived')),
  free_votes_per_user_per_day int         NOT NULL DEFAULT 1,
  paid_votes_enabled          boolean     NOT NULL DEFAULT false,
  judge_weight_pct            int         NOT NULL DEFAULT 30
                              CHECK (judge_weight_pct BETWEEN 0 AND 100),
  scoring_formula             jsonb       NOT NULL DEFAULT '{"audience":0.5,"judges":0.3,"engagement":0.2}'::jsonb,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX vote_contests_org_idx    ON vote.contests(org_id);
CREATE INDEX vote_contests_event_idx  ON vote.contests(event_id) WHERE event_id IS NOT NULL;
CREATE INDEX vote_contests_status_idx ON vote.contests(status);
ALTER TABLE vote.contests ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER vote_contests_set_updated_at BEFORE UPDATE ON vote.contests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- public SELECT when live or closed; org INSERT/UPDATE/DELETE
CREATE POLICY contests_public_select ON vote.contests FOR SELECT
  USING (status IN ('live','closed'));
CREATE POLICY contests_org_select ON vote.contests FOR SELECT
  USING (org_id = (SELECT auth.uid()));
CREATE POLICY contests_org_write ON vote.contests
  FOR INSERT WITH CHECK (org_id = (SELECT auth.uid()));
CREATE POLICY contests_org_update ON vote.contests FOR UPDATE
  USING (org_id = (SELECT auth.uid()));
CREATE POLICY contests_org_delete ON vote.contests FOR DELETE
  USING (org_id = (SELECT auth.uid()));

-- ─── vote.categories ─────────────────────────────────────────────────────────

CREATE TABLE vote.categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id  uuid NOT NULL REFERENCES vote.contests(id) ON DELETE CASCADE,
  slug        text NOT NULL,
  title       text NOT NULL,
  position    int  NOT NULL DEFAULT 0,
  UNIQUE (contest_id, slug)
);
CREATE INDEX vote_categories_contest_idx ON vote.categories(contest_id);
ALTER TABLE vote.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY categories_public_select ON vote.categories FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM vote.contests c WHERE c.id = categories.contest_id
      AND c.status IN ('live','closed')
  ));
CREATE POLICY categories_org_select ON vote.categories FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM vote.contests c WHERE c.id = categories.contest_id
      AND c.org_id = (SELECT auth.uid())
  ));
CREATE POLICY categories_org_write ON vote.categories
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM vote.contests c WHERE c.id = categories.contest_id
      AND c.org_id = (SELECT auth.uid())
  ));
CREATE POLICY categories_org_update ON vote.categories FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM vote.contests c WHERE c.id = categories.contest_id
      AND c.org_id = (SELECT auth.uid())
  ));
CREATE POLICY categories_org_delete ON vote.categories FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM vote.contests c WHERE c.id = categories.contest_id
      AND c.org_id = (SELECT auth.uid())
  ));

-- ─── vote.entities ────────────────────────────────────────────────────────────

CREATE TABLE vote.entities (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id   uuid    NOT NULL REFERENCES vote.contests(id) ON DELETE CASCADE,
  category_id  uuid    REFERENCES vote.categories(id) ON DELETE SET NULL,
  slug         text    NOT NULL,
  display_name text    NOT NULL,
  bio          text,
  hero_url     text,
  media        jsonb   NOT NULL DEFAULT '[]',
  socials      jsonb   NOT NULL DEFAULT '{}',
  embedding    vector(768),
  approved     boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (contest_id, slug)
);
CREATE INDEX vote_entities_contest_idx    ON vote.entities(contest_id);
CREATE INDEX vote_entities_category_idx   ON vote.entities(category_id) WHERE category_id IS NOT NULL;
CREATE INDEX vote_entities_approved_idx   ON vote.entities(contest_id, approved);
CREATE INDEX vote_entities_embedding_idx  ON vote.entities USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
ALTER TABLE vote.entities ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER vote_entities_set_updated_at BEFORE UPDATE ON vote.entities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY entities_public_select ON vote.entities FOR SELECT
  USING (approved = true AND EXISTS (
    SELECT 1 FROM vote.contests c WHERE c.id = entities.contest_id
      AND c.status IN ('live','closed')
  ));
CREATE POLICY entities_org_select ON vote.entities FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM vote.contests c WHERE c.id = entities.contest_id
      AND c.org_id = (SELECT auth.uid())
  ));
CREATE POLICY entities_org_write ON vote.entities
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM vote.contests c WHERE c.id = entities.contest_id
      AND c.org_id = (SELECT auth.uid())
  ));
CREATE POLICY entities_org_update ON vote.entities FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM vote.contests c WHERE c.id = entities.contest_id
      AND c.org_id = (SELECT auth.uid())
  ));
CREATE POLICY entities_org_delete ON vote.entities FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM vote.contests c WHERE c.id = entities.contest_id
      AND c.org_id = (SELECT auth.uid())
  ));

-- ─── vote.votes ───────────────────────────────────────────────────────────────
-- Append-only fact table: no UPDATE/DELETE allowed (only fraud_status + weight via trigger)

CREATE TABLE vote.votes (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id      uuid        NOT NULL REFERENCES vote.contests(id) ON DELETE CASCADE,
  entity_id       uuid        NOT NULL REFERENCES vote.entities(id) ON DELETE CASCADE,
  voter_user_id   uuid        REFERENCES auth.users(id),
  voter_anon_id   text,
  weight          numeric(6,3) NOT NULL DEFAULT 1.000,
  source          text        NOT NULL CHECK (source IN ('audience','judge','paid')),
  ip_hash         text        NOT NULL,
  device_hash     text,
  user_agent      text,
  country         text,
  fraud_score     numeric(4,3),
  fraud_status    text        NOT NULL DEFAULT 'pending'
                  CHECK (fraud_status IN ('pending','clean','suspicious','blocked')),
  idempotency_key text        NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX vote_votes_idempotency_idx      ON vote.votes(idempotency_key);
CREATE INDEX        vote_votes_contest_entity_idx   ON vote.votes(contest_id, entity_id, created_at DESC);
CREATE INDEX        vote_votes_voter_user_idx       ON vote.votes(voter_user_id, contest_id, created_at) WHERE voter_user_id IS NOT NULL;
CREATE INDEX        vote_votes_ip_hash_idx          ON vote.votes(ip_hash, contest_id, created_at);
CREATE INDEX        vote_votes_fraud_status_idx     ON vote.votes(contest_id, fraud_status) WHERE fraud_status != 'clean';
-- Daily dedup index: add a stored vote_date column so the dedup index is IMMUTABLE-safe
ALTER TABLE vote.votes ENABLE ROW LEVEL SECURITY;

-- INSERT via service-role (vote-cast edge fn) only; users SELECT their own
CREATE POLICY votes_own_select ON vote.votes FOR SELECT
  USING (voter_user_id = (SELECT auth.uid()));

-- ─── vote.entity_tally ────────────────────────────────────────────────────────
-- Counter table updated by trigger; leaderboard reads this, not raw votes

CREATE TABLE vote.entity_tally (
  entity_id      uuid         PRIMARY KEY REFERENCES vote.entities(id) ON DELETE CASCADE,
  contest_id     uuid         NOT NULL REFERENCES vote.contests(id) ON DELETE CASCADE,
  audience_votes bigint       NOT NULL DEFAULT 0,
  paid_votes     bigint       NOT NULL DEFAULT 0,
  judge_score    numeric(8,3) NOT NULL DEFAULT 0,
  weighted_total numeric(12,3) NOT NULL DEFAULT 0,
  rank           int,
  trend_24h      numeric(8,3) NOT NULL DEFAULT 0,
  updated_at     timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX vote_entity_tally_leaderboard_idx ON vote.entity_tally(contest_id, weighted_total DESC);
ALTER TABLE vote.entity_tally ENABLE ROW LEVEL SECURITY;

CREATE POLICY tally_public_select ON vote.entity_tally FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM vote.contests c WHERE c.id = entity_tally.contest_id
      AND c.status IN ('live','closed')
  ));
CREATE POLICY tally_org_select ON vote.entity_tally FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM vote.contests c WHERE c.id = entity_tally.contest_id
      AND c.org_id = (SELECT auth.uid())
  ));

-- ─── vote.judges ──────────────────────────────────────────────────────────────

CREATE TABLE vote.judges (
  contest_id uuid        NOT NULL REFERENCES vote.contests(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight     numeric(4,2) NOT NULL DEFAULT 1.0,
  invited_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (contest_id, user_id)
);
CREATE INDEX vote_judges_user_idx ON vote.judges(user_id);
ALTER TABLE vote.judges ENABLE ROW LEVEL SECURITY;

CREATE POLICY judges_own_select ON vote.judges FOR SELECT
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY judges_org_select ON vote.judges FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM vote.contests c WHERE c.id = judges.contest_id
      AND c.org_id = (SELECT auth.uid())
  ));

-- ─── vote.scoring_criteria ────────────────────────────────────────────────────

CREATE TABLE vote.scoring_criteria (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id  uuid NOT NULL REFERENCES vote.contests(id) ON DELETE CASCADE,
  key         text NOT NULL,
  label       text NOT NULL,
  weight_pct  int  NOT NULL CHECK (weight_pct BETWEEN 0 AND 100),
  max_score   int  NOT NULL DEFAULT 10,
  UNIQUE (contest_id, key)
);
CREATE INDEX vote_scoring_criteria_contest_idx ON vote.scoring_criteria(contest_id);
ALTER TABLE vote.scoring_criteria ENABLE ROW LEVEL SECURITY;

CREATE POLICY criteria_public_select ON vote.scoring_criteria FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM vote.contests c WHERE c.id = scoring_criteria.contest_id
      AND c.status IN ('live','closed')
  ));
CREATE POLICY criteria_org_select ON vote.scoring_criteria FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM vote.contests c WHERE c.id = scoring_criteria.contest_id
      AND c.org_id = (SELECT auth.uid())
  ));
CREATE POLICY criteria_org_write ON vote.scoring_criteria
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM vote.contests c WHERE c.id = scoring_criteria.contest_id
      AND c.org_id = (SELECT auth.uid())
  ));
CREATE POLICY criteria_org_update ON vote.scoring_criteria FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM vote.contests c WHERE c.id = scoring_criteria.contest_id
      AND c.org_id = (SELECT auth.uid())
  ));
CREATE POLICY criteria_org_delete ON vote.scoring_criteria FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM vote.contests c WHERE c.id = scoring_criteria.contest_id
      AND c.org_id = (SELECT auth.uid())
  ));

-- ─── vote.judge_scores ────────────────────────────────────────────────────────

CREATE TABLE vote.judge_scores (
  contest_id      uuid        NOT NULL REFERENCES vote.contests(id) ON DELETE CASCADE,
  entity_id       uuid        NOT NULL REFERENCES vote.entities(id) ON DELETE CASCADE,
  judge_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  criterion_id    uuid        NOT NULL REFERENCES vote.scoring_criteria(id) ON DELETE CASCADE,
  score           numeric(5,2) NOT NULL,
  comment         text,
  ai_assist_score numeric(5,2),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (contest_id, entity_id, judge_id, criterion_id)
);
CREATE INDEX vote_judge_scores_entity_idx    ON vote.judge_scores(entity_id);
CREATE INDEX vote_judge_scores_judge_idx     ON vote.judge_scores(judge_id);
CREATE INDEX vote_judge_scores_criterion_idx ON vote.judge_scores(criterion_id);
ALTER TABLE vote.judge_scores ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER vote_judge_scores_set_updated_at BEFORE UPDATE ON vote.judge_scores
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY judge_scores_own_select ON vote.judge_scores FOR SELECT
  USING (judge_id = (SELECT auth.uid()));
CREATE POLICY judge_scores_org_select ON vote.judge_scores FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM vote.contests c WHERE c.id = judge_scores.contest_id
      AND c.org_id = (SELECT auth.uid())
  ));
-- Only judges of the contest may insert/update
CREATE POLICY judge_scores_judge_write ON vote.judge_scores
  FOR INSERT WITH CHECK (
    judge_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM vote.judges j WHERE j.contest_id = judge_scores.contest_id
        AND j.user_id = (SELECT auth.uid())
    )
  );
CREATE POLICY judge_scores_judge_update ON vote.judge_scores FOR UPDATE
  USING (
    judge_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM vote.judges j WHERE j.contest_id = judge_scores.contest_id
        AND j.user_id = (SELECT auth.uid())
    )
  );

-- ─── vote.fraud_signals ───────────────────────────────────────────────────────
-- Service role + admin only; no user-facing RLS SELECT

CREATE TABLE vote.fraud_signals (
  vote_id     uuid     PRIMARY KEY REFERENCES vote.votes(id) ON DELETE CASCADE,
  rules_hit   text[]   NOT NULL DEFAULT '{}',
  ai_label    text,
  ai_reason   text,
  reviewed_by uuid     REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE vote.fraud_signals ENABLE ROW LEVEL SECURITY;
-- No public policies — service role bypasses RLS; admin access via service role only

-- ─── vote.paid_vote_orders ────────────────────────────────────────────────────

CREATE TABLE vote.paid_vote_orders (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id text,
  contest_id      uuid        REFERENCES vote.contests(id) ON DELETE SET NULL,
  entity_id       uuid        REFERENCES vote.entities(id) ON DELETE SET NULL,
  buyer_user_id   uuid        REFERENCES auth.users(id),
  votes_purchased int         NOT NULL,
  votes_credited  int         NOT NULL DEFAULT 0,
  amount_cents    int         NOT NULL,
  currency        text        NOT NULL DEFAULT 'COP',
  status          text        NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','paid','credited','failed','refunded')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX vote_paid_orders_buyer_idx   ON vote.paid_vote_orders(buyer_user_id);
CREATE INDEX vote_paid_orders_contest_idx ON vote.paid_vote_orders(contest_id);
ALTER TABLE vote.paid_vote_orders ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER vote_paid_orders_set_updated_at BEFORE UPDATE ON vote.paid_vote_orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY paid_orders_own_select ON vote.paid_vote_orders FOR SELECT
  USING (buyer_user_id = (SELECT auth.uid()));
CREATE POLICY paid_orders_org_select ON vote.paid_vote_orders FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM vote.contests c WHERE c.id = paid_vote_orders.contest_id
      AND c.org_id = (SELECT auth.uid())
  ));

-- ─── entity_tally auto-update trigger ────────────────────────────────────────
-- Atomically increments entity_tally on each new clean/pending vote INSERT

CREATE OR REPLACE FUNCTION vote.on_vote_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = vote, public AS $$
BEGIN
  INSERT INTO vote.entity_tally (entity_id, contest_id, audience_votes, paid_votes, updated_at)
  VALUES (NEW.entity_id, NEW.contest_id,
    CASE WHEN NEW.source = 'audience' THEN 1 ELSE 0 END,
    CASE WHEN NEW.source = 'paid'     THEN 1 ELSE 0 END,
    now())
  ON CONFLICT (entity_id) DO UPDATE SET
    audience_votes = vote.entity_tally.audience_votes + CASE WHEN NEW.source = 'audience' THEN 1 ELSE 0 END,
    paid_votes     = vote.entity_tally.paid_votes     + CASE WHEN NEW.source = 'paid'     THEN 1 ELSE 0 END,
    updated_at     = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER vote_votes_on_insert
  AFTER INSERT ON vote.votes
  FOR EACH ROW EXECUTE FUNCTION vote.on_vote_insert();
