-- Fix 3 missing FK indexes (advisor: unindexed_foreign_keys)
CREATE INDEX event_sponsor_placements_asset_idx ON public.event_sponsor_placements(asset_id) WHERE asset_id IS NOT NULL;
CREATE INDEX event_sponsors_approved_by_idx      ON public.event_sponsors(approved_by)      WHERE approved_by IS NOT NULL;
CREATE INDEX event_stakeholders_invited_by_idx   ON public.event_stakeholders(invited_by)   WHERE invited_by IS NOT NULL;

-- Fix multiple permissive SELECT policies (advisor: multiple_permissive_policies)
-- Strategy: drop FOR ALL + per-table SELECT policies; replace with
--   (a) one consolidated SELECT policy (all conditions OR'd internally)
--   (b) one INSERT/UPDATE/DELETE policy for organizer-only writes

-- ── event_stakeholders ──────────────────────────────────────────────────────
DROP POLICY stakeholders_organizer_all  ON public.event_stakeholders;
DROP POLICY stakeholders_self_select    ON public.event_stakeholders;
DROP POLICY stakeholders_peer_select    ON public.event_stakeholders;

CREATE POLICY stakeholders_select ON public.event_stakeholders FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_stakeholders.event_id
            AND e.organizer_id = (SELECT auth.uid()))
    OR user_id = (SELECT auth.uid())
    OR EXISTS (SELECT 1 FROM public.event_stakeholders peer
               WHERE peer.event_id = event_stakeholders.event_id
                 AND peer.user_id = (SELECT auth.uid()))
  );

CREATE POLICY stakeholders_organizer_write ON public.event_stakeholders
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.events e WHERE e.id = event_stakeholders.event_id
      AND e.organizer_id = (SELECT auth.uid())
  ));

CREATE POLICY stakeholders_organizer_update ON public.event_stakeholders FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.events e WHERE e.id = event_stakeholders.event_id
      AND e.organizer_id = (SELECT auth.uid())
  ));

CREATE POLICY stakeholders_organizer_delete ON public.event_stakeholders FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.events e WHERE e.id = event_stakeholders.event_id
      AND e.organizer_id = (SELECT auth.uid())
  ));

-- ── event_vendors ────────────────────────────────────────────────────────────
DROP POLICY vendors_organizer_all          ON public.event_vendors;
DROP POLICY vendors_costakeholder_select   ON public.event_vendors;

CREATE POLICY vendors_select ON public.event_vendors FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_vendors.event_id
            AND e.organizer_id = (SELECT auth.uid()))
    OR EXISTS (SELECT 1 FROM public.event_stakeholders s
               WHERE s.event_id = event_vendors.event_id
                 AND s.user_id = (SELECT auth.uid())
                 AND s.role IN ('co_producer','planner'))
  );

CREATE POLICY vendors_organizer_write ON public.event_vendors
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.events e WHERE e.id = event_vendors.event_id
      AND e.organizer_id = (SELECT auth.uid())
  ));

CREATE POLICY vendors_organizer_update ON public.event_vendors FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.events e WHERE e.id = event_vendors.event_id
      AND e.organizer_id = (SELECT auth.uid())
  ));

CREATE POLICY vendors_organizer_delete ON public.event_vendors FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.events e WHERE e.id = event_vendors.event_id
      AND e.organizer_id = (SELECT auth.uid())
  ));

-- ── event_sponsors ───────────────────────────────────────────────────────────
DROP POLICY sponsors_organizer_all  ON public.event_sponsors;
DROP POLICY sponsors_public_select  ON public.event_sponsors;

CREATE POLICY sponsors_select ON public.event_sponsors FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_sponsors.event_id
            AND e.organizer_id = (SELECT auth.uid()))
    OR (status = 'active' AND EXISTS (
      SELECT 1 FROM public.events e WHERE e.id = event_sponsors.event_id
        AND e.status IN ('published','live','closed')
    ))
  );

CREATE POLICY sponsors_organizer_write ON public.event_sponsors
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.events e WHERE e.id = event_sponsors.event_id
      AND e.organizer_id = (SELECT auth.uid())
  ));

CREATE POLICY sponsors_organizer_update ON public.event_sponsors FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.events e WHERE e.id = event_sponsors.event_id
      AND e.organizer_id = (SELECT auth.uid())
  ));

CREATE POLICY sponsors_organizer_delete ON public.event_sponsors FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.events e WHERE e.id = event_sponsors.event_id
      AND e.organizer_id = (SELECT auth.uid())
  ));

-- ── event_sponsor_placements ─────────────────────────────────────────────────
DROP POLICY placements_organizer_all  ON public.event_sponsor_placements;
DROP POLICY placements_public_select  ON public.event_sponsor_placements;

CREATE POLICY placements_select ON public.event_sponsor_placements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.event_sponsors s
      JOIN public.events e ON e.id = s.event_id
      WHERE s.id = event_sponsor_placements.event_sponsor_id
        AND e.organizer_id = (SELECT auth.uid())
    )
    OR (is_active = true AND EXISTS (
      SELECT 1 FROM public.event_sponsors s
      WHERE s.id = event_sponsor_placements.event_sponsor_id
        AND s.status = 'active'
    ))
  );

CREATE POLICY placements_organizer_write ON public.event_sponsor_placements
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.event_sponsors s
    JOIN public.events e ON e.id = s.event_id
    WHERE s.id = event_sponsor_placements.event_sponsor_id
      AND e.organizer_id = (SELECT auth.uid())
  ));

CREATE POLICY placements_organizer_update ON public.event_sponsor_placements FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.event_sponsors s
    JOIN public.events e ON e.id = s.event_id
    WHERE s.id = event_sponsor_placements.event_sponsor_id
      AND e.organizer_id = (SELECT auth.uid())
  ));

CREATE POLICY placements_organizer_delete ON public.event_sponsor_placements FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.event_sponsors s
    JOIN public.events e ON e.id = s.event_id
    WHERE s.id = event_sponsor_placements.event_sponsor_id
      AND e.organizer_id = (SELECT auth.uid())
  ));
