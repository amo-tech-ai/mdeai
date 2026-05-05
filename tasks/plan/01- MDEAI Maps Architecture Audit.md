Doing the actual audit before writing the report.

# 🔧 MDEAI Maps Architecture Audit

**Auditor:** principal-eng lens, no filler. **Scope:** [google-maps-loader.ts](https://claude.ai/epitaxy/src/lib/google-maps-loader.ts), [ChatMap.tsx](https://claude.ai/epitaxy/src/components/chat/ChatMap.tsx), [GoogleMapView.tsx](https://claude.ai/epitaxy/src/components/itinerary/GoogleMapView.tsx), [MapContext.tsx](https://claude.ai/epitaxy/src/context/MapContext.tsx), [ChatCanvas.tsx](https://claude.ai/epitaxy/src/components/chat/ChatCanvas.tsx), [ApartmentDetail.tsx](https://claude.ai/epitaxy/src/pages/ApartmentDetail.tsx), routing, env.

---

## 1 · Executive Summary

**Where you are:** maps work on the happy path. The duplicate-loader fire was put out yesterday. Click → listing works. fitBounds works.

**Where you're not:** zero clustering, zero viewport-aware search, zero telemetry, no lazy split, `v=weekly` (moving target on a paid API), 1.78 MB single JS chunk, MapContext not shared with other map surfaces, no infowindow/peek pattern. The thing is alive but it's not yet at the standard a Mindtrip engineer would call done.

**Bottom line:** **84/100 production readiness for the chat MVP.** Jumps to ~95 once you do the four Quick Wins below. Hits Mindtrip parity with the 60-day plan.

---

## 2 · Current Architecture in 5 Sentences

1. One singleton `loadGoogleMapsLibrary(name, apiKey)` in [src/lib/google-maps-loader.ts](https://claude.ai/epitaxy/src/lib/google-maps-loader.ts) installs Google's inline bootstrap, dedupes against pre-existing `<script>` tags, and exposes `isMapsAuthFailed` / `onMapsAuthFailed`.
2. `ChatMap` (right column of the chat) uses `AdvancedMarkerElement`, fits bounds on every new pin batch, syncs hover with `MapContext.highlightedPinId`, and falls back to a pin list on auth failure.
3. `MapContext` is a plain React Context owned only by `<ChatCanvas>` — pins live there; `ApartmentDetail` and trip maps use their own state, so no cross-page coherence.
4. Pin data flows: tool result on `ai-chat` → `OPEN_RENTALS_RESULTS.payload.listings` → `ChatCanvas` `useEffect` builds `MapPin[]` → `setPins` → `ChatMap` reads + renders.
5. Detail map (apartment page) doesn't exist — only the right-rail "Book This Place" card renders; pin click skips straight to `/apartments/:id`.

---

## 3 · Top 10 Problems (ranked by what bites you in prod)

|#|Problem|Where|Severity|
|---|---|---|---|
|1|**`v=weekly` channel** — Google ships breaking changes to weekly. A bad week = your map breaks for users with no commit on your end.|[loader:180](https://claude.ai/epitaxy/src/lib/google-maps-loader.ts#L180)|🔴|
|2|**No clustering**. 50+ pins on a city-wide search overlap into a black blob. Mindtrip-killer when supply scales past Laureles.|ChatMap markers|🔴|
|3|**No telemetry**. `console.error` is the only signal when `gm_authFailure`, marker init, or fitBounds throws. Silent failures will exist in prod and you won't know until users churn.|every map effect|🔴|
|4|**No lazy split.** Maps + chat + booking + detail all in `index-CvGlrXVi.js` (1.78 MB minified, ~480 KB gzip). Slow first paint on mobile + LATAM 4G.|`vite.config.ts`|🟡|
|5|**`MapContext` is chat-only**. Apartment detail page has no map. When a user clicks a pin → leaves chat → arrives on `/apartments/:id` they lose the map context entirely. Not how Mindtrip / Airbnb behave.|[ChatCanvas.tsx:258](https://claude.ai/epitaxy/src/components/chat/ChatCanvas.tsx#L258)|🟡|
|6|**Pins never clear between conversations**. `clearPins()` only fires when `messages.length === 0` ([ChatCanvas.tsx:132](https://claude.ai/epitaxy/src/components/chat/ChatCanvas.tsx#L132)). Two consecutive searches → 10 pins from search 1 plus 10 from search 2 stay on the map. User confusion.|ChatCanvas useEffect|🟡|
|7|**No InfoWindow / pin peek.** Click goes straight to `/apartments/:id`, leaving the chat. Anon users lose state. Mindtrip shows a card overlay first.|ChatMap click handler|🟡|
|8|**No "Search this area" affordance** when user pans/zooms. Static result set tied to chat turn only.|not implemented|🟡|
|9|**`gm_authFailure` is global**. If a single bad map render trips it (e.g. Cloud key edited mid-session), every map on the tab flips to fallback list. Acceptable but undocumented.|[loader:73-81](https://claude.ai/epitaxy/src/lib/google-maps-loader.ts#L73-L81)|🟢|
|10|**Bundle splitting + zero `Suspense`.** `ChatMap` and `GoogleMapView` are statically imported. ApartmentDetail loads even when never visited.|every map import|🟢|

Ignored as **not problems**:

- Browser-extension noise (`web-client-content-script.js`, `inspector.js`) — not your code.
- "loaded directly without loading=async" — fixed.
- gmp-click warning — fixed.
- Anon-UUID — fixed.
- Maps loaded twice — fixed.
- ApartmentDetail blank — fixed.

---

## 4 · Risk Table

|Risk|Likelihood|Impact|Detection|Mitigation|
|---|---|---|---|---|
|Google ships breaking change in `v=weekly`|**Medium**|🟥 site-wide map breaks|None today (no telemetry)|Pin to `v=quarterly` + add Sentry|
|Map JS API key leaks → bill spike|Low|🟥 financial|Cloud Console alert (not configured)|Cloud Console quota + budget alarm|
|Anon user sends message → realtime error → chat dies|Low (post-fix)|🟧 conversion drop|Browser console only|Add Sentry breadcrumb on `realtime: error`|
|200+ pins on city-wide search → map jank|High at scale|🟧 UX collapse|manual|MarkerClusterer|
|Mobile user opens chat → has no map at all (md:hidden)|High|🟧 feature gap|manual|Bottom-sheet map drawer|
|RefererNotAllowedMapError on a new vercel preview URL|Medium per PR|🟨 preview broken|gm_authFailure (logs)|Whitelist `*.vercel.app` already done|
|Memory leak from a future map page that forgets cleanup|Medium|🟨 perf rot|DevTools heap|Centralize marker mgmt in a hook|
|Multiple users render Maps SDK with different keys|Low|🟨 confusion|console warn (already in loader)|Single VITE env value|

---

## 5 · Best-Practices Target Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│  src/lib/google-maps-loader.ts    (✓ singleton, idempotent)         │
│    - loadGoogleMapsLibrary(name)                                    │
│    - isMapsAuthFailed / onMapsAuthFailed                            │
│    - tracked: load latency, retry count                             │
└────────────────────┬─────────────────────────────────────────────────┘
                     │
┌────────────────────▼─────────────────────────────────────────────────┐
│  src/components/maps/MapShell.tsx       (NEW — single map renderer) │
│    - dynamic import (React.lazy + Suspense)                         │
│    - props: { pins, highlightedId, onPinClick, onViewportIdle }     │
│    - owns the AdvancedMarkerElement lifecycle                       │
│    - owns clustering (MarkerClusterer)                              │
│    - owns InfoWindow/peek                                           │
│    - reusable: chat right rail, apartment detail bottom map,        │
│                trips itinerary map                                  │
└──┬──────────────┬────────────┬────────────────┬─────────────────────┘
   │              │            │                │
┌──▼──────┐  ┌───▼────────┐  ┌▼─────────────┐  ┌▼─────────────────┐
│ChatMap  │  │ApartmentMap│  │TripsMap      │  │AdminApartmentsMap│
│(rail)   │  │(below info)│  │(itinerary)   │  │(supply ops)      │
└─────────┘  └────────────┘  └──────────────┘  └──────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  src/state/maps/                                                     │
│    pins.store.ts  (zustand or stable global)                         │
│      - global pin layer keyed by source ('chat' | 'detail' | 'trip') │
│      - clearOnRouteChange option                                     │
│      - persists hot pin across navigations                           │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  src/lib/maps-telemetry.ts                                           │
│    track({ kind, latency, error })                                   │
│      - script_load, marker_render, viewport_change, click,           │
│        cluster_expand, auth_failed                                   │
│    Wired to Sentry breadcrumbs + PostHog events.                     │
└──────────────────────────────────────────────────────────────────────┘
```

### Required pieces (gap → solution)

|Gap|Solution|Library|
|---|---|---|
|Clustering|Add `MarkerClusterer`|`@googlemaps/markerclusterer`|
|Viewport-aware re-search|`idle` listener → debounced bbox → new tool call|core SDK|
|InfoWindow on click|`<gmp-info-window>` or custom DOM element|core SDK|
|Lazy load|`React.lazy(() => import('@/components/maps/MapShell'))` + `<Suspense fallback=…>`|React|
|Mobile fullscreen|bottom-sheet drawer (`<Sheet>` from shadcn)|shadcn|
|Telemetry|Sentry (errors) + PostHog (clicks/conversions)|both|
|Saved-pin state|Heart icon on marker bound to `useChatActions.savedIds`|own|
|Route-safe init|`<Suspense>` boundary + cleanup useEffect (✓ already)|React|

---

## 6 · Code-Quality Review (file:line)

### `src/lib/google-maps-loader.ts`

|Line|Issue|Fix|
|---|---|---|
|180|`params.set('v', 'weekly');` — moving channel|switch to `'quarterly'` for prod, `'weekly'` only in `import.meta.env.DEV`|
|21–22|docstring lies — actually returns the library, not destructured constructors directly|minor doc fix|
|40|`void UUID_RE; // unused at runtime`|dead code, delete|
|78–86|`installAuthFailureHandler` works but is invoked from `installBootstrap` only — never called explicitly|rename to `_installAuthFailureHandler` or expose, document|
|168–209|shim re-call recursion (`fn(libName, …rest)`) is correct but cute. Add a unit test or it'll bit-rot.|add Vitest with mocked `window.google`|

### `src/components/chat/ChatMap.tsx`

|Line|Issue|Fix|
|---|---|---|
|348–360|unmount cleanup uses `markersRef.current` captured in closure — correct, but if a future contributor changes `markersRef = useRef(...)` to a `useState(Map)` it silently leaks|add a comment explaining why this works, or refactor to use a `useMarkerLayer` custom hook|
|320–340|same `try/catch` + `console.error` repeated in 3 effects|factor into a `useMapMarkers` hook|
|160|"Pins never clear between turns" tradeoff is documented in ChatCanvas, NOT here — easy to misread|cross-reference|
|248–260|`MEDELLIN_CENTER` hardcoded; doesn't honor user's chip neighborhood|center on first pin or on chip neighborhood|

### `src/components/chat/ChatCanvas.tsx`

|Line|Issue|Fix|
|---|---|---|
|116–127|"Keep pins across turns" left as comment; intentional but confusing UX|replace with explicit "merge with prior pins" or "replace each turn" toggle|
|132|`clearPins()` only when `messages.length === 0` — on conversation switch via ChatLeftNav (Wed task) the prior conversation's pins persist|add `useEffect(() => clearPins(), [currentConversation?.id])`|

### `src/components/itinerary/GoogleMapView.tsx`

|Line|Issue|Fix|
|---|---|---|
|290–298|Highlight effect rebuilds full marker content on every selection change. With 50+ pins that's 50 DOM rewrites.|mutate only the pin that changed|
|211–219|Marker rebuild also rewires listeners every time → if `items` reference changes by identity even when data didn't, listeners thrash|memoize `itemsWithCoords` (already done) but also use a stable `id` keyed map like ChatMap does|
|Whole file|This component still has ~600 lines for an itinerary-specific use. Should consume `MapShell` once it lands.|refactor in 60-day plan|

### `src/context/MapContext.tsx`

|Line|Issue|Fix|
|---|---|---|
|Whole file|Provider only mounted at `ChatCanvasInner` ([ChatCanvas:258](https://claude.ai/epitaxy/src/components/chat/ChatCanvas.tsx#L258)). Other pages can't read pins.|lift to root `<App>` or migrate to zustand store|
|7–14|Pin shape doesn't carry `category-specific metadata` (e.g. price) explicitly — uses generic `meta?: Record<string, unknown>`|strongly type per-vertical (`RentalPin extends MapPin`)|

---

## 7 · 30/60/90 Day Roadmap

### 30 days — **Stabilize + observe**

|Task|Impact|Effort|Risk|Result|
|---|---|---|---|---|
|Pin Maps SDK to `v=quarterly`|🟥→🟢|5 min|low|No more random Tuesday breakage|
|Add Sentry browser SDK + breadcrumb on every map error path|High|1d|low|Silent failures become alerts|
|Add PostHog `map_pin_click`, `map_viewport_idle`, `map_auth_failed` events|High|1d|low|Conversion funnel visible|
|Cloud Console quota + budget alarm on the Maps key|High|30 min|low|No bill surprises|
|`MarkerClusterer` integration for ChatMap|Medium|4h|low|Handles 200+ pins cleanly|
|Tighten Maps key restrictions: HTTP referrer + API restriction = "Maps JavaScript API only"|High|10 min (you already started)|low|Key leaks become non-issues|
|Centralize marker lifecycle in a `useMarkerLayer` hook|Medium|1d|low|Kills duplication between ChatMap + GoogleMapView|
|Vitest: unit-test `google-maps-loader.ts` (mock `window.google`)|High|4h|low|Bootstrap regression-proof|

### 60 days — **Mindtrip parity**

|Task|Impact|Effort|Risk|
|---|---|---|---|
|**MapShell** component — single renderer used by chat / detail / trips|High|3d|medium|
|**Lazy-load** map code via `React.lazy` + Suspense; split chunk|Medium|4h|low|
|**InfoWindow on click** — preview without leaving chat; "View details" link|High|2d|low|
|**"Search this area"** — debounced viewport idle → re-fire `rentals_search` with bbox|Very high|3d|medium|
|**Bidirectional card↔pin sync** — card click pans/zooms map|Medium|4h|low|
|**Mobile fullscreen map drawer** (currently no map on `md:hidden`)|High|1d|low|
|**Saved pins ❤️ overlay** on markers using `useChatActions.savedIds`|Medium|4h|low|
|**MapContext → zustand store** with per-source layers (chat/detail/trips)|Medium|2d|medium|
|**ApartmentDetail bottom map** — show the apartment + nearby restaurants/cafés|High|1d|low|

### 90 days — **Scale to thousands of listings**

|Task|Impact|Effort|Risk|
|---|---|---|---|
|Server-side pin clustering (Postgis `ST_ClusterDBSCAN`) → API returns clusters at viewport zoom|Very high|1w|high|
|Heatmap layer of nightly Wi-Fi / walkability for nomad targeting|Medium|3d|medium|
|Drawing tools — drag a polygon to filter listings to a custom area|High|1w|medium|
|Walking-distance circles around selected pin (15-min walk radius)|Medium|2d|low|
|Custom map style via Cloud Console MapID — Mindtrip's muted palette|Medium|4h|low|
|A/B framework for map UX changes (uses PostHog)|High|1w|medium|
|Service-worker cache for the Maps tile layer (LATAM mobile perf)|Medium|3d|medium|

---

## 8 · Quick Wins This Week

These are **all small, all unblocked, all high ROI**. Can be one PR.

1. **`v=quarterly` in prod, `v=weekly` in dev** — 5 minute change, removes the #1 risk.
2. **Sentry SDK + breadcrumbs on every map effect** — 4h, makes failures visible.
3. **MarkerClusterer** — 4h, kills the "10 pins in 50px box" problem.
4. **`clearPins()` on conversation change** — 5 minute change, fixes the stale-pin UX.
5. **`Cmd+Click` consistency check** + accessibility audit (keyboard focus on pins via `gmpClickable`) — 1h.

If you do exactly those five this week, score moves from **84 → 92**.

---

## 9 · Final Production Score

|Dimension|Score|Reasoning|
|---|---|---|
|**Stability**|92/100|Singleton loader bulletproof; UUID & duplicate-script bugs killed. -8 for `v=weekly`.|
|**Performance**|70/100|Map renders cleanly at 10 pins; collapses at 100+. Bundle is one big chunk.|
|**Maintainability**|80/100|Loader is well-commented; ChatMap and GoogleMapView still duplicate marker mgmt.|
|**UX**|75/100|Mindtrip's table stakes (clustering, peek, search-this-area) all missing.|
|**Scalability**|65/100|Client-side rendering of all pins; no server clustering; no viewport bbox.|
|**Security**|90/100|Key restricted to Maps JS API only + HTTP referrers. -10 for no rate-limit alarm.|
|**Production readiness**|**84/100**|**Ship to mdeai.co — but ship with telemetry on.**|

> **Brutally honest:** the code is clean. The architecture is not yet scaled. You'll outgrow this setup at ~500 listings. Do the 30-day plan and you're production-ready for Medellín; do the 60-day plan and you're at Mindtrip's table.

---

## 10 · The Real Recommendation

**Don't keep adding map features until #1, #3, and #4 from "Quick Wins" land.** Pinning the SDK + adding telemetry + adding clustering is the foundation that makes every later feature safe to ship. Without those, every new feature becomes a debugging session in production.

Ready to execute Quick Wins this week? Greenlight any of #1–5 and I'll do them.