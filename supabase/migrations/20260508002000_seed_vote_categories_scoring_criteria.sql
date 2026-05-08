-- Applied via MCP on 2026-05-08; captured as local file.
-- Seeds vote.categories and vote.scoring_criteria for Reina de Antioquia 2026

INSERT INTO vote.categories (contest_id, slug, title, position)
SELECT 'aaaaaaaa-0001-0001-0001-000000000001', slug, title, pos
FROM (VALUES
  ('evening_gown', 'Evening Gown', 0),
  ('talent',       'Talent',       1),
  ('interview',    'Interview',    2),
  ('swimwear',     'Swimwear',     3),
  ('casual_wear',  'Casual Wear',  4)
) AS v(slug, title, pos)
WHERE NOT EXISTS (
  SELECT 1 FROM vote.categories
  WHERE contest_id = 'aaaaaaaa-0001-0001-0001-000000000001'
    AND vote.categories.slug = v.slug
);

-- Weights: grace 25 + stage 25 + interview 30 + talent 20 = 100
INSERT INTO vote.scoring_criteria (contest_id, key, label, weight_pct, max_score)
SELECT 'aaaaaaaa-0001-0001-0001-000000000001', key, label, weight, max_score
FROM (VALUES
  ('grace',     'Grace & Poise',      25, 10),
  ('stage',     'Stage Presence',     25, 10),
  ('interview', 'Interview Answer',   30, 10),
  ('talent',    'Talent Performance', 20, 10)
) AS v(key, label, weight, max_score)
WHERE NOT EXISTS (
  SELECT 1 FROM vote.scoring_criteria
  WHERE contest_id = 'aaaaaaaa-0001-0001-0001-000000000001'
    AND vote.scoring_criteria.key = v.key
);
