---
task_id: 049-sponsor-surface-component
title: <SponsoredSurface> — universal brand render component for all 8 event surfaces
phase: PHASE-2-SPONSOR-GROWTH
priority: P1
status: Open
estimated_effort: 1.5 days
area: frontend
skill:
  - frontend-design
  - supabase
  - mdeai-project-gates
  - vitest-component-testing
edge_function: null
schema_tables:
  - sponsor.placements
  - sponsor.assets
depends_on: ['045-sponsor-schema-migration', '048-sponsor-stripe-checkout']
mermaid_diagram: null
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-2-SPONSOR-GROWTH — makes every live placement visible to users |
| **Component** | `<SponsoredSurface surface="..." surfaceRef={uuid} />` |
| **Surfaces** | `contest_header` · `category_header` · `leaderboard_footer` · `contestant_profile` · `digital_banner` · `push_notif` · `social_post` · `qr_station` |
| **Real-world** | The `/events/:id` page mounts `<SponsoredSurface surface="contest_header" surfaceRef={eventId} />`. It queries active placements, picks one by weight, renders the brand logo, and fires an impression beacon — all transparently |

## Description

**The situation.** Placements are live in `sponsor.placements` but nothing renders them. The event pages (`/events/:id`, leaderboard, contestant profile) show no sponsor branding even when `active=true` placements exist.

**Why a single universal component (not per-surface components).** All surfaces share: placement query → weight-based rotation → impression beacon → click tracking → UTM wrapping. A single `<SponsoredSurface>` with a `surface` prop handles all variants; per-surface cosmetic differences are controlled by `className` + slot props.

**What already exists.** Event detail pages, leaderboard components, and the 3-panel layout are live. `sponsor.placements` table (task 045) stores the active rows. The impression/click edge fns (task 050) receive the beacons.

**The build.** One universal component + one query hook + impression/click beacon calls wired to task 050 edge fns.

## Component API

```tsx
<SponsoredSurface
  surface="contest_header"   // one of 8 surface keys
  surfaceRef={eventId}       // uuid of the event/entity/category
  className="..."            // caller controls sizing
  fallback={null}            // what to render when no active placement (default: null)
/>
```

## Hook: useSponsorPlacements

```typescript
// src/hooks/sponsor/useSponsorPlacements.ts
function useSponsorPlacements(surface: string, surfaceRef?: string): {
  placement: SponsorPlacement | null;  // weighted random pick
  isLoading: boolean;
}
// Query: SELECT placements + assets WHERE surface=$1 AND surface_ref=$2 AND active=true
// Client-side weighted pick: Math.random() * total_weight → cumulative selection
// Cache: staleTime 5 minutes (placements don't change mid-session)
```

## Impression + click beacon

```typescript
// On mount (after placement renders):
await fetch('/functions/v1/sponsor-impression', {
  method: 'POST',
  body: JSON.stringify({ placement_id, surface, viewer_anon_id }),
});

// On click (wraps the UTM link):
<a
  href={buildUtmUrl(placement.utm_destination, placement.id)}
  onClick={() => recordClick(placement.id)}
  rel="noopener sponsored"
>
  <img src={assetUrl} alt={placement.alt_text} />
</a>
```

## Surface render variants

| Surface | Visual | Sizing |
|---|---|---|
| `contest_header` | Logo bottom-right of hero image | 120×40px max |
| `category_header` | "Powered by [Logo]" text + small logo | 80×24px logo |
| `leaderboard_footer` | Full-width strip: "Powered by [Logo]" | 200×50px |
| `contestant_profile` | "Powered by [Logo]" badge below name | 100×32px |
| `digital_banner` | 300×250 right-sidebar slot | 300×250px |
| `push_notif` | Text-only: prefix "Sponsored by X" | text |
| `social_post` | Logo watermark bottom-right | 100×32px |
| `qr_station` | Large logo + "Scan to vote" CTA | 240×80px |

## FTC compliance

Every placement renders with a visible "Sponsored" label. Implementation:
```tsx
<div className="relative">
  <span className="absolute top-1 right-1 text-[10px] text-muted-foreground">Sponsored</span>
  <img ... />
</div>
```

## Wiring plan

| Layer | File | Action |
|---|---|---|
| Component | `src/components/sponsor/SponsoredSurface.tsx` | Create |
| Hook | `src/hooks/sponsor/useSponsorPlacements.ts` | Create |
| Util | `src/lib/sponsor/buildUtmUrl.ts` | Create |
| Types | `src/types/sponsor.ts` | Extend (SponsorPlacement type) |
| Integration | `src/pages/EventDetail.tsx` | Add `<SponsoredSurface surface="contest_header" ...>` |
| Integration | Any leaderboard component | Add `<SponsoredSurface surface="leaderboard_footer" ...>` |

## Acceptance Criteria

- [ ] `<SponsoredSurface>` renders null (no DOM) when no active placement exists for the surface.
- [ ] When a placement exists: logo renders from Supabase Storage signed URL; "Sponsored" label visible.
- [ ] Impression beacon fires once per mount (not on re-renders).
- [ ] Click on the logo fires click beacon then navigates to `utm_destination` with UTM params.
- [ ] Weight-based rotation: if two placements exist with weights 100/200, the 200-weight placement is picked ~67% of the time (tested with 1000 random samples ±10%).
- [ ] `staleTime: 5 * 60 * 1000` on the query — no beacon spam from stale-cache re-fetches.
- [ ] "Sponsored" label visible on all surface variants; readable contrast ratio ≥ 4.5:1.
- [ ] Vitest: 5 tests — null render (no placement), logo render, impression beacon called, click beacon called, weighted rotation distribution.
- [ ] `npm run lint` zero new errors; `npm run build` clean.

## Real-World Examples

**Scenario 1 — Active Gold placement:** `/events/reina-antioquia-2026` mounts `<SponsoredSurface surface="contest_header" surfaceRef={eventId}>`. Hook finds Postobón's active placement. Logo renders in the hero bottom-right. On page load, impression beacon fires. User clicks logo → click beacon fires → user lands on `postobon.com/?utm_source=mdeai&utm_medium=contest_header&utm_campaign=reina-2026&utm_content=<placement_id>`.

**Scenario 2 — No placement:** `/events/test-event-no-sponsors` mounts the component. Hook returns `placement: null`. `<SponsoredSurface>` renders null — no empty box, no layout shift. Event page looks the same as before sponsorship shipped.

**Scenario 3 — Two competing Bronze sponsors on leaderboard:** Footer has two active placements (weights 100, 100). Each page load picks one at 50/50. Both sponsors see approximately equal impressions across the contest.

## Outcomes

| Before | After |
|---|---|
| Event pages show no sponsor branding | Active placements render on 8 surfaces |
| No impression tracking | Beacon fires per render; data lands in `sponsor.impressions` |
| No click tracking | UTM + click beacon on every sponsor link |
| Hardcoded sponsor display (if any) | Query-driven; zero code changes needed to add new sponsors |

## See also

- [`050-sponsor-impression-click-edge-fns.md`](050-sponsor-impression-click-edge-fns.md) — beacon endpoints
- [`045-sponsor-schema-migration.md`](045-sponsor-schema-migration.md) — placements schema
