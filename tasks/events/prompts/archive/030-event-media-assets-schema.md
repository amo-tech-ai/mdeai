---
task_id: 030-event-media-assets-schema
title: event_media_assets — logos, flyers, sponsor creatives, photos, videos
phase: PHASE-1.5-EVENTS
priority: P1
status: Done
estimated_effort: 0.5 day
area: backend
skill:
  - supabase
  - supabase-postgres-best-practices
edge_function: null
schema_tables:
  - public.event_media_assets  # NEW
depends_on: ['001-event-schema-migration']
mermaid_diagram: null
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-1.5-EVENTS — **moved up from Phase 2 (2026-05-03 review)** because it's the natural persistence layer for task 033 photo-moderate verdicts and arrives early-season for sponsor logos / gallery photos |
| **Schema** | 1 NEW table |
| **Real-world** | Sofía uploads: 1 hero photo (auto-set on event), 5 sponsor logos (Postobón / Águila / Bavaria), the official flyer PDF, 3 stage-design renders, the run-of-show doc. All organized + searchable + RLS-scoped |

## Description

**The situation.** Phase 1 stores the event hero photo in `events.primary_image_url` + `events.images jsonb` (legacy columns from the existing schema). That covers the hero. But Phase 1.5 needs more: gallery photos beyond hero, sponsor logos (sponsors arrive informally before the full Phase 3 sponsor system), flyers (PDF + JPG variants), and a place to persist task 033's photo-moderation verdicts. Storing all of that in a JSONB blob on `events.images` blocks per-asset metadata, indexing, and per-asset RLS.

**Why moved from Phase 2 to Phase 1.5 (2026-05-03 review).** The audit #2 B4 fix decoupled task 033 (photo-moderate edge fn) from this table to avoid phase inversion. That fix works, but it left 033 returning verdicts with nowhere clean to persist them ("caller stores wherever appropriate"). Moving 030 to Phase 1.5 — the same phase as 033 — makes the pair conceptually whole: 033 validates, 030 stores. Cost: 0.5d (already-written task; only frontmatter + index update needed). Benefit: cleaner Phase 1.5 architecture + earlier support for sponsor logos arriving in informal Phase 1.5 sponsor conversations.

**Why a separate table (vs JSONB blob).** Each asset has its own metadata (uploader, intended use, sponsor link, copyright owner, AI moderation verdict). JSONB can't enforce uniqueness or carry per-asset RLS. The table also makes sense to pre-establish so Phase 2 task 040 (floor plan layouts) and Phase 2 task 031 (sponsor placements) can FK into it without extra ALTER work.

**Distinction from contestant photos (task 020 in Phase 2 contests).** Contestant photos belong to `vote.entities`. Event media assets belong to `events` directly — brand/marketing/operational assets, not competition material.

**Integration with task 033.** Phase 1.5 wizard flow: user uploads photo → task 033 returns verdict → caller (task 002 wizard) inserts into `event_media_assets` with the verdict in `metadata`, sets `is_public = true` only on `approved`. Tight pair, same phase.

## The migration

```sql
CREATE TABLE public.event_media_assets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  asset_type      text NOT NULL CHECK (asset_type IN
    ('hero_photo','gallery_photo','flyer','sponsor_logo','speaker_photo',
     'venue_layout','stage_render','run_of_show','contract','other')),
  storage_bucket  text NOT NULL,                                  -- Supabase Storage bucket name
  storage_path    text NOT NULL,                                  -- key within bucket
  public_url      text,                                            -- only set if bucket is public
  filename        text NOT NULL,
  mime_type       text NOT NULL,
  size_bytes      bigint NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 50 * 1024 * 1024),  -- 50MB cap
  caption         text,
  alt_text        text,                                            -- accessibility
  display_order   int NOT NULL DEFAULT 0,
  uploaded_by     uuid REFERENCES auth.users(id),
  copyright_owner text,
  sponsor_id      uuid,                                            -- nullable; FK added in Phase 2 sponsor task
  is_public       boolean NOT NULL DEFAULT false,                  -- true = visible to anon on event page
  metadata        jsonb DEFAULT '{}'::jsonb,                       -- exif, dimensions, ai_moderation_score
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (storage_bucket, storage_path)
);
CREATE INDEX event_media_assets_event_idx ON public.event_media_assets(event_id);
CREATE INDEX event_media_assets_type_idx  ON public.event_media_assets(event_id, asset_type);
CREATE INDEX event_media_assets_public    ON public.event_media_assets(event_id) WHERE is_public = true;
ALTER TABLE  public.event_media_assets ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER event_media_assets_set_updated_at BEFORE UPDATE ON public.event_media_assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

## RLS policies

```sql
-- Public SELECT on is_public assets (event hero, gallery, sponsor logos shown publicly)
CREATE POLICY media_public_select ON public.event_media_assets FOR SELECT
  USING (is_public = true AND EXISTS (
    SELECT 1 FROM public.events e WHERE e.id = event_media_assets.event_id AND e.status IN ('published','live','closed')
  ));
-- Organizer manages all
CREATE POLICY media_organizer_all ON public.event_media_assets FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.events e WHERE e.id = event_media_assets.event_id AND e.organizer_id = (select auth.uid())
  ));
```

## Acceptance Criteria

- [ ] Table + indexes + RLS created.
- [ ] 50MB size cap enforced via CHECK.
- [ ] UNIQUE `(storage_bucket, storage_path)` prevents duplicate-path uploads.
- [ ] On event INSERT via task 002 wizard, the hero photo creates a row here (in addition to setting `events.primary_image_url`).
- [ ] All assets routed through task 033 photo-moderate edge fn before `is_public=true`.

## See also

- [`001-event-schema-migration.md`](./001-event-schema-migration.md)
- [`033-event-photo-moderate-edge-fn.md`](./033-event-photo-moderate-edge-fn.md) — moderation gate
