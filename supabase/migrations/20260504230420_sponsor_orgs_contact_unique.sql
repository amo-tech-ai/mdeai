-- Fix H1 from forensic audit:
-- sponsor-application-create uses upsert with onConflict: "primary_contact_user_id"
-- but no UNIQUE constraint existed, causing silent INSERT fallback and orphan org rows.

ALTER TABLE sponsor.organizations
  ADD CONSTRAINT sponsor_orgs_contact_unique
  UNIQUE (primary_contact_user_id);