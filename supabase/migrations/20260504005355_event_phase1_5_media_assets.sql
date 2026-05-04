-- =============================================================================
-- Task 030: event_media_assets — logos, flyers, sponsor creatives, photos, videos
-- Phase 1.5 EVENTS
-- =============================================================================

CREATE TABLE public.event_media_assets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  asset_type      text NOT NULL CHECK (asset_type IN (
    'hero_photo','gallery_photo','flyer','sponsor_logo','speaker_photo',
    'venue_layout','stage_render','run_of_show','contract','other'
  )),
  storage_bucket  text NOT NULL,
  storage_path    text NOT NULL,
  public_url      text,
  filename        text NOT NULL,
  mime_type       text NOT NULL,
  size_bytes      bigint NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 52428800),  -- 50 MB cap
  caption         text,
  alt_text        text,
  display_order   int NOT NULL DEFAULT 0,
  uploaded_by     uuid REFERENCES auth.users(id),
  copyright_owner text,
  sponsor_id      uuid,
  is_public       boolean NOT NULL DEFAULT false,
  metadata        jsonb DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (storage_bucket, storage_path)
);

CREATE INDEX event_media_assets_event_idx       ON public.event_media_assets(event_id);
CREATE INDEX event_media_assets_uploaded_by_idx ON public.event_media_assets(uploaded_by) WHERE uploaded_by IS NOT NULL;
CREATE INDEX event_media_assets_type_idx  ON public.event_media_assets(event_id, asset_type);
CREATE INDEX event_media_assets_public    ON public.event_media_assets(event_id) WHERE is_public = true;

ALTER TABLE public.event_media_assets ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER event_media_assets_set_updated_at
  BEFORE UPDATE ON public.event_media_assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Public SELECT: only approved public assets on published/live/closed events
CREATE POLICY media_public_select ON public.event_media_assets FOR SELECT
  USING (
    is_public = true
    AND EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_media_assets.event_id AND e.status IN ('published','live','closed')
    )
  );

-- Organizer manages all their event's assets
CREATE POLICY media_organizer_all ON public.event_media_assets FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_media_assets.event_id AND e.organizer_id = (select auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_media_assets.event_id AND e.organizer_id = (select auth.uid())
  ));

COMMENT ON TABLE  public.event_media_assets IS 'Per-event media assets: hero, gallery, flyers, sponsor logos. is_public=true only after moderation passes (task 033).';
COMMENT ON COLUMN public.event_media_assets.metadata IS 'JSONB bag: exif data, pixel dimensions, ai_moderation_score, verdict, flags. Set by task 033 photo-moderate edge fn.';
COMMENT ON COLUMN public.event_media_assets.sponsor_id IS 'Nullable; FK to Phase 2 sponsor table (not yet created). Stored here now so Phase 2 ALTERs are minimal.';
