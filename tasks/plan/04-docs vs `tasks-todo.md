Cross-checking both plan docs against the current todo.md.

Cross-checked both plan docs against `tasks/todo.md`. Here's the audit:

# Coverage audit — plan docs vs `tasks/todo.md`

## ✅ Already in todo (or shipped)

From the **Quick Wins** + **Best Next 10** lists:

|Item|Status|
|---|---|
|v=quarterly + clearPins + a11y + MarkerClusterer + Telemetry seam|✅ shipped|
|ChatLeftNav|✅ shipped|
|Search this area|✅ shipped|
|Sentry + PostHog|✅ in todo (Day 2 #1, #2)|
|Mobile fullscreen map drawer|✅ in todo (Day 2 #3)|
|Affiliate attribution + outbound_clicks|✅ in todo (Day 3 #4)|
|SEO page → chat handoff|✅ in todo (Day 3 #5)|
|InfoWindow on pin click|✅ in todo (Day 4 #6)|
|Booking dialog photo gallery + amenity grid|✅ in todo (Day 4 #7)|
|Custom Cloud Console MapID|✅ in todo (tech-debt)|
|useMarkerLayer hook|✅ in todo (tech-debt)|
|Code-split / lazy-load map code|✅ in todo (tech-debt)|
|Tighten Conversation.user_id type|✅ in todo (tech-debt)|
|Fix `npm run verify:edge`|✅ in todo (tech-debt)|

## ❌ Gaps — present in the plans but NOT in todo

**24 items missing.** Three buckets:

### Code-quality micro-cleanup (from § 6 of plan 01)

1. `google-maps-loader.ts:21-22` — docstring lies, returns library not constructors
2. `google-maps-loader.ts:40` — delete `void UUID_RE;` dead code
3. `google-maps-loader.ts:78-86` — rename `_installAuthFailureHandler` or document
4. `google-maps-loader.ts:168-209` — **Vitest unit test for the shim recursion** (regression-proof)
5. `ChatMap.tsx:160` — cross-reference comment about pin persistence
6. `ChatMap.tsx:248-260` — center map on first pin or chip neighborhood (instead of hardcoded MEDELLIN_CENTER)
7. `ChatCanvas.tsx:116-127` — explicit "merge with prior pins" / "replace each turn" toggle, replace ambiguous comment
8. `GoogleMapView.tsx:290-298` — mutate only changed pin (perf at 50+ pins)
9. `GoogleMapView.tsx:211-219` — stable id-keyed marker map (parity with ChatMap)
10. `MapContext.tsx:7-14` — strongly type per-vertical (`RentalPin extends MapPin`)

### 30-day backlog

11. **Cloud Console quota + budget alarm** on the Maps key — 30 min, you-side action
12. **MapContext → zustand store** (or lift to root `<App>`) — needed before MapShell

### 60-day "Mindtrip parity"

13. **MapShell component** — single renderer for chat / detail / trips (apartment-bottom map)
14. **Bidirectional card ↔ pin sync** — card click pans/zooms the map
15. **Saved pins ❤️ overlay on markers** — uses `useChatActions.savedIds`
16. **ApartmentDetail bottom map** — show apartment + nearby restaurants/cafés

### 90-day scale

17. **Server-side pin clustering** (Postgis `ST_ClusterDBSCAN`) — bbox API returns clusters
18. **Heatmap layer** — Wi-Fi speed / walkability for nomad targeting
19. **Drawing tools** — drag a polygon to filter listings
20. **Walking-distance circles** — 15-min radius around selected pin
21. **A/B framework via PostHog** — depends on PostHog wiring
22. **Service-worker cache for Maps tile layer** — LATAM 4G perf

Adding all of these to `tasks/todo.md` now.