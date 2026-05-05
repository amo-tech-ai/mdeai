---
task_id: 052-sponsor-dashboard
title: /sponsor/dashboard/:applicationId — real-time ROI dashboard for sponsors
phase: PHASE-2-SPONSOR-GROWTH
priority: P1
status: Open
estimated_effort: 2 days
area: frontend
skill:
  - frontend-design
  - supabase
  - mdeai-project-gates
  - vitest-component-testing
edge_function: null
schema_tables:
  - sponsor.roi_daily
  - sponsor.placements
  - sponsor.attributions
  - sponsor.invoices
depends_on:
  - '051-sponsor-attribution-trigger'
  - '053-sponsor-roi-rollup-cron'
  - '045-sponsor-schema-migration'
mermaid_diagram: null
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-2-SPONSOR-GROWTH — ROI visibility drives upsells and renewals |
| **Routes** | `/sponsor/dashboard/:applicationId` · `/sponsor/dashboard/:applicationId/assets` · `/sponsor/dashboard/:applicationId/insights` |
| **Real-world** | Postobón's brand manager opens their dashboard after Week 1. Sees: 412k impressions, 18k clicks, CTR 4.4%, 7,200 attributed purchases, cost-per-attributed-purchase $2.08. Gemini insight: "CTR peaked Tue–Thu 18:00–21:00. Recommend increasing `contest_header` weight." One-click apply |
| **Realtime** | Supabase Realtime channel `sponsor:dashboard:<applicationId>` pushes tile updates on `roi_daily` changes |

## Description

**The situation.** Sponsors have paid and their logos are live, but there is no way to see ROI. Without a dashboard, the sponsor calls the account manager (overhead); no data = no upsell; no renewal decision.

**Why Realtime (not polling).** `roi_daily` is updated every 5 minutes by the rollup cron (task 053). Polling at that frequency burns quota. Supabase Realtime notifies the dashboard the instant a new rollup row lands — zero wasted requests.

**What already exists.** Supabase Realtime channel pattern established in `useRealtimeChannel` hook. `roi_daily` table (task 045). Attribution data (task 051). Gemini insights text (task 054).

## Dashboard tiles

| Tile | Source | Realtime? |
|---|---|---|
| Impressions today / 7d / total | `roi_daily` SUM | ✓ |
| Clicks today / 7d / total | `roi_daily` SUM | ✓ |
| CTR (clicks/impressions × 100) | Computed | ✓ |
| Attributed purchases | `attributions` COUNT | ✓ |
| Cost-per-attributed-purchase | `invoice.amount / attributed_purchases` | ✓ |
| Top surface by CTR | `roi_daily JOIN placements ON placement_id → surface` (see query below) | ✓ |
| AI insight (today) | `applications.campaign_goals.ai_insight` text | ✗ (daily cron) |
| Creative gallery with per-creative CTR | `assets` + `placements` join | ✗ |

## Wiring plan

| Layer | File | Action |
|---|---|---|
| Page | `src/pages/sponsor/Dashboard.tsx` | Create |
| Page | `src/pages/sponsor/DashboardAssets.tsx` | Create (asset upload/replace) |
| Page | `src/pages/sponsor/DashboardInsights.tsx` | Create (Gemini insights tab) |
| Component | `src/components/sponsor/dashboard/ROITile.tsx` | Create |
| Component | `src/components/sponsor/dashboard/TopSurfacesChart.tsx` | Create |
| Component | `src/components/sponsor/dashboard/CreativeGallery.tsx` | Create |
| Component | `src/components/sponsor/dashboard/AIInsightCard.tsx` | Create |
| Hook | `src/hooks/sponsor/useSponsorDashboard.ts` | Create |
| Hook | `src/hooks/sponsor/useSponsorRealtime.ts` | Create (Realtime subscription) |
| Route | `src/App.tsx` | Add `/sponsor/dashboard/:id` protected routes |

## useSponsorDashboard hook

```typescript
function useSponsorDashboard(applicationId: string) {
  // Loads:
  // 1. application + organization + event details
  // 2. roi_daily last 30 days — keyed by (placement_id, day); join placements for surface name
  // 3. attributions count + total value (via placements → applications join)
  // 4. invoice status + amount
  // 5. placements list with asset URLs + surface column
  // Realtime: listens on sponsor.roi_daily INSERT/UPDATE for this application's placements
  // Returns: { metrics, placements, aiInsight, topSurfaces, isLoading, error }
}
```

⚠️ QUERY CORRECTION — roi_daily has no `surface` column; must join `placements`:
```sql
-- Correct: top surface by CTR (join required)
SELECT
  p.surface,
  SUM(rd.impressions) AS total_impressions,
  SUM(rd.clicks)      AS total_clicks,
  ROUND(SUM(rd.clicks)::numeric / NULLIF(SUM(rd.impressions), 0) * 100, 2) AS ctr_pct
FROM sponsor.roi_daily rd
JOIN sponsor.placements p ON p.id = rd.placement_id
JOIN sponsor.applications a ON a.id = p.application_id
WHERE a.id = $1
  AND rd.day >= CURRENT_DATE - 30
GROUP BY p.surface
ORDER BY ctr_pct DESC;

-- Wrong (roi_daily has NO surface column):
-- SELECT surface, ... FROM sponsor.roi_daily GROUP BY surface  ← does NOT work
```

## Asset replacement (DashboardAssets tab)

Sponsor can upload a new logo/video mid-campaign:
1. Upload to Supabase Storage (existing signed URL pattern)
2. `POST /functions/v1/sponsor-asset-upload` (task 054) moderates the asset
3. On `clean` verdict: `UPDATE sponsor.assets SET storage_path=...` + re-runs Gemini moderation
4. On `flagged`: upload rejected with specific flags shown

## Acceptance Criteria

- [ ] Dashboard renders all 8 tiles with correct values from `roi_daily` and `attributions`.
- [ ] Realtime updates: inserting a new `roi_daily` row updates the tile within 3 seconds without page refresh.
- [ ] Auth guard: only the org's `primary_contact_user_id` can view their own dashboard (403 for others).
- [ ] CTR rendered as "4.4%" (not 0.044); cost-per-purchase rendered in COP with thousands separator.
- [ ] AI insight tab shows the latest Gemini text or a placeholder "Insights generating — check back tomorrow."
- [ ] Asset replacement flow: file type and size validated; moderation result shown; page does not reload on success.
- [ ] Loading states: skeleton tiles on initial load; no layout shift when Realtime updates arrive.
- [ ] Empty state: if no impressions yet, show "Your placements go live at `start_at`. Check back then."
- [ ] Export: "Download CSV" button exports `roi_daily` rows as CSV (client-side via `Blob`).
- [ ] `npm run lint` zero new errors; `npm run build` clean.

## Real-World Examples

**Scenario 1 — Week 1 check-in:** Postobón brand manager opens `/sponsor/dashboard/abc123` at 9am Monday. Tiles show 412k impressions, 18k clicks (4.4% CTR), 7,200 attributed purchases. AI insight: "Peak CTR Tuesday 19:00–21:00. Recommend doubling weight on contest_header during this window." Manager clicks "Apply recommendation" → creates a support ticket for admin (auto-apply in Phase 3).

**Scenario 2 — Pre-launch wait state:** Mi Sazón paid for their Bronze placement, but the contest doesn't start for 3 days. Dashboard shows: Impressions 0, Clicks 0, "Your placements go live on May 10." No confusing zeros — just a clear launch date.

**Scenario 3 — Asset replacement mid-campaign:** Postobón updates their logo (new color for Copa América tie-in). DashboardAssets tab → upload new SVG → Gemini moderation passes → new logo live within 5 minutes. Old impressions/clicks remain attributed to the original asset_id in `roi_daily`.

## Outcomes

| Before | After |
|---|---|
| Sponsor calls account manager for ROI data | Self-serve dashboard with live tile updates |
| Impressions/clicks tracked but not visible | All metrics in one screen in real-time |
| No mid-campaign asset updates | Asset replacement with moderation in 5 min |
| AI insights exist in DB but not surfaced | Insights tab with actionable recommendations |

## See also

- [`053-sponsor-roi-rollup-cron.md`](053-sponsor-roi-rollup-cron.md) — populates the tiles this reads
- [`054-sponsor-ai-edge-fns.md`](054-sponsor-ai-edge-fns.md) — AI insight text written here
- [`051-sponsor-attribution-trigger.md`](051-sponsor-attribution-trigger.md) — attribution data source
