-- Task 018: Contestant intake form — add self-registration columns + RLS policies to vote.entities

-- ─── New columns ─────────────────────────────────────────────────────────────

ALTER TABLE vote.entities
  ADD COLUMN IF NOT EXISTS submitted_at       timestamptz,
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS id_front_url       text,
  ADD COLUMN IF NOT EXISTS id_back_url        text,
  ADD COLUMN IF NOT EXISTS waiver_url         text;

-- Index so the contestant can quickly find their own drafts
CREATE INDEX IF NOT EXISTS vote_entities_created_by_idx
  ON vote.entities(created_by_user_id)
  WHERE created_by_user_id IS NOT NULL;

-- ─── RLS policies — contestant self-management ────────────────────────────────

-- Contestants can INSERT their own entity (must be unapproved at creation time)
CREATE POLICY entities_contestant_insert ON vote.entities
  FOR INSERT WITH CHECK (
    created_by_user_id = (SELECT auth.uid())
    AND approved = false
  );

-- Contestants can UPDATE their own unapproved entity
-- (once approved = true the org controls further edits via entities_org_update)
CREATE POLICY entities_contestant_update ON vote.entities
  FOR UPDATE USING (
    created_by_user_id = (SELECT auth.uid())
    AND approved = false
  );

-- Contestants can SELECT their own entity (draft or approved)
CREATE POLICY entities_contestant_select ON vote.entities
  FOR SELECT USING (
    created_by_user_id = (SELECT auth.uid())
  );
