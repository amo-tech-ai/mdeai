-- Task: Admin entity moderation — add rejection_reason column to vote.entities
-- so admins can record why an application was rejected.

ALTER TABLE vote.entities
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Index: fast lookup of rejected entities for the admin queue
CREATE INDEX IF NOT EXISTS vote_entities_rejected_idx
  ON vote.entities(contest_id, approved)
  WHERE rejection_reason IS NOT NULL;

-- Admin service-role policy: allow admins to UPDATE approved + rejection_reason
-- Guard with IF NOT EXISTS since this policy may already exist from an earlier migration.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'vote'
      AND tablename  = 'entities'
      AND policyname = 'entities_admin_update'
  ) THEN
    CREATE POLICY entities_admin_update ON vote.entities
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = (SELECT auth.uid())
            AND ur.role IN ('admin', 'super_admin')
            AND (ur.expires_at IS NULL OR ur.expires_at > now())
        )
      );
  END IF;
END $$;
