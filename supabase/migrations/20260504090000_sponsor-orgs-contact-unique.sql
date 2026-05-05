-- ============================================================
-- Fix H1: UNIQUE constraint on sponsor.organizations.primary_contact_user_id
-- Without this, upsert onConflict:"primary_contact_user_id" silently falls
-- back to INSERT, creating orphan org rows per wizard session.
-- NOTE: 20260504230420 added sponsor_orgs_contact_unique (same column).
-- This migration is intentionally idempotent — skip if any unique constraint
-- already covers primary_contact_user_id.
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'sponsor'
      AND t.relname = 'organizations'
      AND c.contype = 'u'
      AND EXISTS (
        SELECT 1 FROM pg_attribute a
        WHERE a.attrelid = t.oid
          AND a.attname = 'primary_contact_user_id'
          AND a.attnum = ANY(c.conkey)
      )
  ) THEN
    ALTER TABLE sponsor.organizations
      ADD CONSTRAINT orgs_contact_unique
      UNIQUE (primary_contact_user_id);
  END IF;
END $$;
