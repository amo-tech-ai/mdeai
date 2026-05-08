-- 25F: hermes.* schema — read-only reasoning/ranking layer
-- 5 tables: ranking_runs, taste_profiles, score_breakdowns, embedding_cache, market_snapshots
-- Requires: vector extension in public schema (v0.8.0)

CREATE SCHEMA IF NOT EXISTS hermes;
GRANT USAGE ON SCHEMA hermes TO service_role, authenticated;

CREATE TABLE hermes.ranking_runs (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  intent      text        NOT NULL CHECK (intent IN ('apartment_match','restaurant_match','event_pick','general')),
  query       jsonb       NOT NULL,
  user_id     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  result_ids  uuid[],
  scores      numeric[],
  feature_set jsonb,
  duration_ms int,
  model       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ranking_runs_intent_recent ON hermes.ranking_runs (intent, created_at DESC);
CREATE INDEX ranking_runs_user ON hermes.ranking_runs (user_id) WHERE user_id IS NOT NULL;

CREATE TABLE hermes.taste_profiles (
  user_id    uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  vector     public.vector(1536),
  facets     jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE hermes.score_breakdowns (
  ranking_run_id uuid    NOT NULL REFERENCES hermes.ranking_runs(id) ON DELETE CASCADE,
  item_id        uuid    NOT NULL,
  total_score    numeric NOT NULL,
  components     jsonb   NOT NULL,
  PRIMARY KEY (ranking_run_id, item_id)
);
CREATE INDEX ON hermes.score_breakdowns (ranking_run_id);

CREATE TABLE hermes.embedding_cache (
  source_table text               NOT NULL,
  source_id    uuid               NOT NULL,
  content_hash text               NOT NULL,
  embedding    public.vector(1536) NOT NULL,
  model        text               NOT NULL,
  created_at   timestamptz        NOT NULL DEFAULT now(),
  PRIMARY KEY (source_table, source_id)
);
-- HNSW index for approximate nearest-neighbor cosine search
CREATE INDEX embedding_cache_ann ON hermes.embedding_cache
  USING hnsw (embedding public.vector_cosine_ops);

CREATE TABLE hermes.market_snapshots (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  scope       text        NOT NULL,
  metric      text        NOT NULL,
  value       numeric     NOT NULL,
  metadata    jsonb,
  observed_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON hermes.market_snapshots (scope, metric, observed_at DESC);

ALTER TABLE hermes.ranking_runs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE hermes.taste_profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE hermes.score_breakdowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE hermes.embedding_cache  ENABLE ROW LEVEL SECURITY;
ALTER TABLE hermes.market_snapshots ENABLE ROW LEVEL SECURITY;

DO $$ DECLARE t text; BEGIN
  FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'hermes' LOOP
    EXECUTE format('CREATE POLICY "service role all" ON hermes.%I FOR ALL TO service_role USING (true) WITH CHECK (true)', t);
    EXECUTE format('CREATE POLICY "anon blocked"     ON hermes.%I FOR ALL TO anon      USING (false) WITH CHECK (false)', t);
  END LOOP;
END $$;

CREATE POLICY "user reads own taste_profile" ON hermes.taste_profiles
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "user reads own ranking_runs" ON hermes.ranking_runs
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "admin reads ranking_runs"     ON hermes.ranking_runs     FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "admin reads taste_profiles"   ON hermes.taste_profiles   FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "admin reads market_snapshots" ON hermes.market_snapshots FOR SELECT TO authenticated USING (public.is_admin());
