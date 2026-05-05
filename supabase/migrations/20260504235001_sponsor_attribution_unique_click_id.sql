-- Migration: sponsor_attribution_unique_click_id
-- Fixes silent duplicate-attribution bug.
-- The attribution trigger used ON CONFLICT DO NOTHING but no UNIQUE constraint
-- existed on click_id, making the conflict clause a no-op. Any repeated trigger
-- fire (React StrictMode, webhook retry, page reload) inserted duplicate rows,
-- inflating ROI counts. This constraint makes the ON CONFLICT clause functional.
ALTER TABLE sponsor.attributions
  ADD CONSTRAINT attributions_click_id_unique UNIQUE (click_id);

-- Verify: constraint must appear in pg_constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'sponsor'
      AND t.relname = 'attributions'
      AND c.conname = 'attributions_click_id_unique'
      AND c.contype = 'u'
  ) THEN
    RAISE EXCEPTION 'MIGRATION FAILED: attributions_click_id_unique constraint not found';
  END IF;
END $$;
