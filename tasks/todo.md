# Next Steps — mdeai.co

> **Last updated:** 2026-04-27 — Marketing homepage at `/` + AI prompt auth handoff + maps stabilization + auto-fire race fix all live on `www.mdeai.co`. **Production readiness 96/100.**
> Priority order. Work top-to-bottom.
> **Phase:** CORE → Chat-central MVP (Weeks 1-2 of `tasks/CHAT-CENTRAL-PLAN.md`)
> **Prompts:** `tasks/prompts/core/` (20 files), `tasks/prompts/INDEX.md`
> **Testing:** Run Gates 1-2 after every PR. See `tasks/progress.md` §10b.

## DONE 2026-04-27 — Marketing homepage + auth handoff + maps stabilization (PRs #2, #3, #4 to main)

### Live on `www.mdeai.co`
- [x] **Marketing homepage at `/`** — Mindtrip-style centered hero with embedded AI Concierge prompt. Full-width single-column. Logged-in users get a `<Navigate to="/chat" replace />`.
- [x] **AI prompt auth handoff** — anon types prompt → `savePendingPrompt` → `/signup?returnTo=/chat?send=pending` → after auth → ChatCanvas auto-fires once via ref-guard + URL replace. Single sessionStorage key `mdeai_pending_prompt`. 8/8 unit tests.
- [x] **`/chat` route** — anon (3-msg gate) + authed both supported. Auto-fires saved prompt when URL is `/chat?send=pending`.
- [x] **Maps stabilization (full Quick Wins audit)** — singleton loader, `gmp-click` migration, MarkerClusterer, telemetry helper (9 event kinds, pluggable sink), v=quarterly pin, a11y on markers, clearPins on conv switch.
- [x] **Day 1 sprint** — ChatLeftNav (chats + Saved + Trips counts) + "Search this area" pill on viewport idle (Haversine over 8 known neighborhoods → re-fire search).
- [x] **Apartment booking flow** — multi-step BookingDialog, ContactHostDialog with pre-filled inquiry, pricing engine + 12 tests. No DB migration.
- [x] **Critical bug fixes** — blank `/apartments/:id` (CommonJS `require()` shim), anon-UUID 400s + realtime CHANNEL_ERROR loops, double-script load, CORS Allow-Methods missing, auto-fire race with auth state on `/chat?send=pending`.

### Verification (today)
- [x] tsc + build clean
- [x] 28/28 unit tests (5 files)
- [x] Vercel production deploys: 3 successful merges (PR #2/#3/#4)
- [x] Bundle audits on prod: hero strings present, masonry alt-text absent, no `pending_ai_prompt` alias, no `anon-` runtime strings, all 9 telemetry kinds present
- [x] End-to-end smoke from `Origin: https://www.mdeai.co` → 200 OK, streaming SSE, phase events

### Known gaps (informed roadmap, not bugs)
- [x] ~~**No Sentry / PostHog sink**~~ — **wired 2026-04-27 evening**. `VITE_SENTRY_DSN` + `VITE_POSTHOG_KEY` + `VITE_POSTHOG_HOST` set in `.env.local` and Vercel (production + preview). Maps telemetry sink forwards every event to Sentry breadcrumbs + captures `*_failed` as Sentry issues + forwards conversion events (`pin_click`, `cluster_expand`, `map_auth_failed`) to PostHog. Bundle audit: `phc_rpJoH...` and `o4510109062...ingest` literals baked into `dist/assets/index-*.js`.
- [ ] **`viewport_idle` event TYPED but not emitted yet** — wired into the "Search this area" feature; emit site lives in ChatMap idle listener (already shipped).
- [ ] **MapProvider is chat-only** — apartment detail and trips pages don't share pin state.
- [ ] **Bundle 1.81 MB / ~480 KB gzip** — no code-splitting yet; LATAM 4G first-paint hit.
- [x] ~~**`npm run verify:edge` broken** (pre-existing) — `p1-crm/index.ts` deno-imports `@supabase/supabase-js`~~ — **resolved**. Verified 2026-04-28: `npm run verify:edge` runs deno check on all 10 functions + 4 shared modules + 11/11 deno tests pass. The earlier blocker self-resolved (deno fetched the dep on first run; cached for subsequent runs).
- [ ] **Email confirmation flow loses pending prompt** — sessionStorage is per-tab; clicking the email link in a new tab loses the saved prompt. Documented limitation.

## NEXT — Recommended sprint (ranked by Revenue / Growth / UX / Tech / Speed)

### Day 2 — Observability + Mobile (highest leverage)
- [x] **Wire Sentry SDK** — DSN in `.env.local` + Vercel (prod + preview). `initSentry()` activates, replaces maps-telemetry sink with Sentry breadcrumb + captureException sink for `*_failed` events. Build verified: 8 sentry refs in prod bundle.
- [x] **Wire PostHog** — `VITE_POSTHOG_KEY` + `VITE_POSTHOG_HOST` in `.env.local` + Vercel. `initPostHog()` activates, typed `AppEvent` union, 6 call sites already emit (`prompt_send`, `prompt_autofired`, `viewport_search`, `pin_click`, `cluster_expand`, `booking_submitted`). Stale `VITE_PUBLIC_POSTHOG_*` deleted from Vercel.
- [ ] **Mobile fullscreen map drawer** — currently no map on `md:hidden`. Add a "🗺️ Map" floating button that opens a `<Sheet>` drawer. Mobile is most of LATAM. **R 4 / G 5 / U 5 / T 3 / S 4 = 21**.

### Day 3 — Conversion improvements
- [x] **Affiliate attribution + `outbound_clicks` migration** — **shipped 2026-04-27 late evening**. Migration `20260427210000_outbound_clicks.sql` (table + RLS + `log_outbound_click` RPC), `src/lib/affiliate.ts` (Booking/Airbnb/VRBO rewriter, 12 unit tests), `src/lib/track-outbound.ts` (RPC + PostHog event), wired in `RentalCardInline` (chat surface = `chat_card`) + `RentalsListingDetail` (surface = `detail_page`). Env tags optional (`VITE_BOOKING_AID` / `VITE_AIRBNB_AFFILIATE_TAG` / `VITE_VRBO_AFFILIATE_TAG`); clicks log with `affiliate_tag = NULL` until partner IDs are configured. **Closes Week 2 exit-test prerequisite #5.**
- [x] **SEO page → chat handoff** — **shipped 2026-04-28**. "Ask mdeai about this →" button on `/apartments/:id` right rail composes a listing-grounded prompt + `savePendingPrompt` + nav to `/chat?send=pending`. Live-verified: button click → URL handoff → auto-fire → Gemini response with `rental_search` payload of 9 listings.

### Day 4 — Mindtrip parity polish
- [x] **InfoWindow on pin click** — **shipped 2026-04-28**. Single InfoWindow instance reused across pins (Mindtrip pattern). Peek = photo + title + neighborhood/BR/BA + price/rating + "View details →" button. Cmd/Ctrl/middle-click + keyboard preserve direct-nav. Pin meta extended in `ChatCanvas` with `image / rating / bedrooms / bathrooms`. Cleanup closes peek on `pins` change so it can't outlive anchor.
- [x] **Booking dialog polish** — **shipped 2026-04-28**. Review step now shows a horizontal photo strip (snap-x, up to 4 thumbnails + "+N more" link) and a 2-col amenity grid with check icons (caps at 8, "+N more →" if exceeded). Both render conditionally so listings without photos/amenities don't get empty placeholders. Verified end-to-end on `/apartments/30000000...0001` (Poblado Penthouse) → screenshot confirms PHOTOS + WHAT'S INCLUDED sections render correctly above the dates/pricing rows.

### Tech-debt cleanup (anytime, low priority)
- [ ] **`useMarkerLayer` hook** — factor duplication between ChatMap and GoogleMapView. (audit § 6)
- [ ] **Custom Cloud Console MapID** — Mindtrip-style muted palette. Pure visual polish. (audit § 90-day)
- [ ] **Code-split + lazy-load** map / detail pages — drops ~600 KB from initial bundle. (audit § 60-day)
- [ ] **Fix `npm run verify:edge`** — wire `deno install` in the script so the CI gate works.
- [ ] **Tighten `Conversation.user_id` type** — currently `string`; pin to `uuid | 'anon'`.

## Code-quality cleanup (audit § 6)

Small, surgical fixes called out in `tasks/plan/01- MDEAI Maps Architecture Audit.md` § 6.

- [ ] **`google-maps-loader.ts:21-22`** — docstring claims it returns destructured constructors; actually returns the library. Minor doc fix.
- [ ] **`google-maps-loader.ts:40`** — delete `void UUID_RE;` dead code.
- [ ] **`google-maps-loader.ts:78-86`** — `installAuthFailureHandler` is invoked only from `installBootstrap`. Rename `_installAuthFailureHandler` (private) or expose + document.
- [ ] **`google-maps-loader.ts:168-209`** — Vitest unit test for the shim recursion (`fn(libName, ...rest)`). Mock `window.google` to make it regression-proof.
- [ ] **`ChatMap.tsx:160`** — "Pins never clear between turns" tradeoff is documented in ChatCanvas, not here. Add cross-reference comment.
- [ ] **`ChatMap.tsx:248-260`** — `MEDELLIN_CENTER` is hardcoded; center on first pin or on chip neighborhood instead.
- [ ] **`ChatCanvas.tsx:116-127`** — replace ambiguous "Keep pins across turns" comment with explicit toggle: "merge with prior pins" or "replace each turn".
- [ ] **`GoogleMapView.tsx:290-298`** — highlight effect rebuilds full marker content on every selection change. With 50+ pins that's 50 DOM rewrites. Mutate only the changed pin.
- [ ] **`GoogleMapView.tsx:211-219`** — marker rebuild rewires listeners every time. Use a stable id-keyed map (parity with ChatMap's `markersRef`).
- [ ] **`MapContext.tsx:7-14`** — `MapPin.meta?: Record<string, unknown>` is too loose. Strongly type per-vertical (`RentalPin extends MapPin`).

## 30-day backlog (audit § 7 — "Stabilize + observe")

Items not yet in the Day 2/3/4 sprint but still on the 30-day plan.

- [ ] **Cloud Console quota + budget alarm** on the Maps key — 30 min, you-side action. Prevents bill surprises if the key leaks.
- [ ] **MapContext → zustand store** (or lift to root `<App>`) — required before `MapShell` (each page needs a different layer source). (audit § 6 + 60-day)

## 60-day backlog (audit § 7 — "Mindtrip parity")

- [ ] **`MapShell` component** — single map renderer used by chat / apartment detail / trips. Owns `AdvancedMarkerElement` lifecycle, clustering, InfoWindow. Reusable shell, three call sites. **Unblocks the bottom-map on apartment detail.** (audit § 5 + § 60-day)
- [ ] **Bidirectional card ↔ pin sync** — currently only hover syncs. Card click should pan/zoom the map to the matching pin. (audit § 60-day)
- [ ] **Saved pins ❤️ overlay on markers** — show a small heart on pins the user has saved, bound to `useChatActions.savedIds`. (audit § 60-day)
- [ ] **ApartmentDetail bottom map** — show the apartment + nearby restaurants/cafés on the detail page. Unlocked by `MapShell`. (audit § 60-day)

## 90-day backlog (audit § 7 — "Scale to thousands of listings")

- [ ] **Server-side pin clustering** — Postgis `ST_ClusterDBSCAN` on bbox queries. API returns clusters at the user's viewport zoom; client never holds 1000+ pins.
- [ ] **Heatmap layer** — Wi-Fi speed / walkability overlay for nomad targeting.
- [ ] **Drawing tools** — drag a polygon to filter listings to a custom area ("only these 4 blocks").
- [ ] **Walking-distance circles** — draw a 15-min walk radius around a selected pin.
- [ ] **A/B framework via PostHog** — depends on PostHog wiring (Day 2). Run experiments on map UX changes.
- [ ] **Service-worker cache for Maps tile layer** — LATAM 4G first-paint perf.

## Week 2 exit test (§5 of `tasks/CHAT-CENTRAL-PLAN.md`)

- [ ] Logged-in user searches rentals → saves 2 listings (`saved_places` rows exist) → adds 1 to a new trip (`trip_items` row exists) → clicks outbound to Airbnb → click logged to `outbound_clicks` with affiliate tag.

**3 of 5 prerequisites done** (chat works, Save + Add-to-trip + social proof shipped). Need affiliate attribution (Day 3) to complete this exit test.

---

## DONE 2026-04-24 — Maps stabilization sprint + Quick Wins audit

### Shipped (commits on `fix/chat-production-hardening`)
- [x] **Singleton Google Maps loader** → `src/lib/google-maps-loader.ts` (commit `e00b872`). Idempotent across StrictMode + remounts. Detects pre-existing `<script id="google-maps-script">` and reuses it. Killed the duplicate-script + `gmp-* already defined` error class.
- [x] **`gmp-click` migration** + `gmpClickable: true` + symmetric `removeEventListener` cleanup on unmount (ChatMap + GoogleMapView). Killed the deprecation warning + listener leaks.
- [x] **anon UUID hardening** (`c9ea238`) — `useAnonSession` validates with strict UUID regex + `crypto.randomUUID()` polyfill; `useChat` synthetic anon conversation id is now a pure UUID. Realtime subscription gated on `conversation.user_id === user.id`. Killed `invalid input syntax for type uuid` + `CHANNEL_ERROR`.
- [x] **CommonJS `require()` panel-context shim removed** (`9b86f72`) — `/apartments/:id` no longer renders blank.
- [x] **Quick Win #1: Maps SDK `v=quarterly` in prod** (`63d3faf`) — tree-shake-verified; `weekly` channel only in dev.
- [x] **Quick Win #4: `clearPins()` on conversation change** (`63d3faf`) — pins no longer bleed across conversations.
- [x] **Quick Win #5: A11y on AdvancedMarkerElement** (`63d3faf`) — `role`, `aria-label`, `aria-current`, `aria-hidden` on emoji.
- [x] **Quick Win #2: pluggable maps telemetry** (`b054b08`) — 9 event kinds wired (script_loaded, markers_rendered, fitbounds, pin_click, cluster_expand, auth_failed, etc.); 4/4 unit tests; default sink is structured console; replace once at app boot to forward to Sentry/PostHog.
- [x] **Quick Win #3: MarkerClusterer** (`ae918f7`) — `@googlemaps/markerclusterer ^2.6.2`. Pins cluster to numbered bubbles at city zoom, fan out on zoom-in. Cluster-click telemetry wired.
- [x] **Booking flow** (`c0caa97`) — multi-step BookingDialog (dates → review → success), ContactHostDialog with pre-filled message, pricing engine (12 unit tests), uses existing `bookings` + `leads` tables (no migration).
- [x] **Maps audit verified** — 21/21 verification items pass; no critical hidden bugs; production readiness **92/100**.

### Verification table
| Verified | Result |
|---|---|
| Singleton loader; no duplicate scripts; no `gmp-* already defined` | ✅ |
| `gmp-click` everywhere; `gmpClickable: true` | ✅ |
| Pin click → `/apartments/:id`; Cmd/Ctrl-click → new tab | ✅ |
| MarkerClusterer + cluster_expand telemetry | ✅ |
| `clearPins` on conv switch | ✅ |
| A11y: tab/Enter/Space/aria-* | ✅ (visible focus = browser default; cosmetic gap only) |
| Telemetry events fire (9 kinds) | ✅ default sink is `console.debug` — set DevTools to "Verbose" to see them |
| E2E chat from prod origin | ✅ 200 OK, 9 listings, 2 phase events |
| Memory leaks across navigation | ✅ unmount cleanup is symmetric |

### Known gaps (informed roadmap, not bugs)
- [ ] **No Sentry / PostHog sink** — telemetry events fire but go to console only.
- [ ] **`viewport_idle` telemetry event TYPED but not EMITTED** — wired with "Search this area" feature.
- [ ] **MapProvider is chat-only** — apartment detail and trips pages don't share pin state.
- [ ] **Bundle 1.81 MB / ~480 KB gzip** — no code-splitting yet; LATAM 4G first-paint hit.
- [ ] **`npm run verify:edge` broken** (pre-existing) — `p1-crm/index.ts` deno-imports `@supabase/supabase-js`.

## NEXT 10 (ranked by Revenue / Growth / UX / Tech / Speed)

| # | Task | Total |
|---|---|---|
| 1 | **Wednesday's `ChatLeftNav`** (chats + Saved + Trips counts) | 21 |
| 2 | **"Search this area" on viewport idle** (debounced bbox → `rentals_search`) | 21 |
| 3 | **Mobile fullscreen map drawer** (currently zero map on `md:hidden`) | 21 |
| 4 | **Thursday's SEO page → chat handoff** (`/apartments/:id` "Ask mdeai about this →") | 20 |
| 5 | **InfoWindow on pin click** (peek before navigating; preserves anon chat) | 19 |
| 6 | **Sentry SDK + PostHog wired into telemetry sink** | 19 |
| 7 | **Friday's affiliate attribution + `outbound_clicks`** | 17 |
| 8 | **Booking dialog polish** (photo gallery + amenity grid in review step) | 16 |
| 9 | **Custom Cloud Console MapID** (Mindtrip-style muted palette) | 12 |
| 10 | **`useMarkerLayer` hook** (factor duplication between ChatMap + GoogleMapView) | 11 |

### Recommended sprint order (4 days)
- **Day 1**: #1 ChatLeftNav + #2 Search this area
- **Day 2**: #6 Sentry/PostHog wiring + #3 Mobile fullscreen map
- **Day 3**: #7 Affiliate attribution + #4 SEO handoff
- **Day 4**: #5 InfoWindow + #8 Booking polish

## Week 2 Remaining (chat-central plan)

- [ ] **Wed — `ChatLeftNav`** (= "Next 10 #1") — sidebar lists recent conversations + "Saved (N)" + "Trips (N)" sections.
- [ ] **Thu — SEO handoff + email-gate polish** (= "Next 10 #4")
- [ ] **Fri — Affiliate attribution + `outbound_clicks`** (= "Next 10 #7")

## Week 2 exit test (§5 of `tasks/CHAT-CENTRAL-PLAN.md`)

- [ ] Logged-in user searches rentals → saves 2 listings (`saved_places` rows exist) → adds 1 to a new trip (`trip_items` row exists) → clicks outbound to Airbnb → click logged to `outbound_clicks` with affiliate tag.

---

## DONE 2026-04-23 — Week 2 Mon/Tue + CORS fix + production merge

### Shipped
- [x] **PR #1 merged** → `287b1cc` → **chat canvas live on `www.mdeai.co`** (was Index marketing page). Verified: 200 OK, production bundle contains ChatCanvas / apartment_save_counts RPC name / welcome headline. End-to-end POST from prod origin returns streaming SSE with 10 Laureles listings.
- [x] **CORS fix** → `_shared/http.ts` now emits `Access-Control-Allow-Methods: POST, GET, OPTIONS` + `x-anon-session-id` in `Allow-Headers` + `Max-Age: 86400` + `Vary: Origin`. Browsers were aborting POST after preflight (logs showed OPTIONS 204, no follow-up POST). All 10 edge fns redeployed.
- [x] **Week 2 Tue** — `saved_places` toggleSave (optimistic + rollback), `AddToTripModal` (pick-existing / create-new with NOT NULL date enforcement), `apartment_save_counts` RPC (SECURITY DEFINER, no user-id leakage) for "Saved by N nomads" social proof on `RentalCardInline`.
- [x] **Week 2 Mon** — `ChatContextChips` above the message list (📍 neighborhood · 📅 dates · 👥 travelers · 💰 budget) with write-through persistence to `conversations.session_data.chat_context` (authed) / in-memory (anon); `sessionData` on every ai-chat POST + new `sessionContextBlock` inlined in the system prompt so Gemini inherits chip values.

### Known issues
- [ ] **`npm run verify:edge` broken** — `p1-crm/index.ts` imports `@supabase/supabase-js` but the script no longer runs `deno install`. Pre-existing, not introduced this session. `deno check` passes on `ai-chat` + `_shared` individually.
- [ ] **Supabase Preview CI check failing** on `main` — pre-existing, separate preview-branch system, not blocking production (Vercel passed).

## Week 2 Remaining (on `fix/chat-production-hardening` or a fresh branch)

- [ ] **Wed — `ChatLeftNav`** — sidebar lists recent conversations (title from first user msg, sorted by `last_message_at`) + "Saved (N)" + "Trips (N)" sections. Click a row → `selectConversation` (already hydrates chips). `useChat.newChat()` helper added; reuse.
- [ ] **Thu — SEO page → chat handoff** — `/apartments/:id` "Ask mdeai about this →" CTA opens `/` with listing context pre-loaded (query param or router state). Polish email-gate modal UX (copy + spacing).
- [ ] **Fri — Affiliate attribution** — new migration `20260424XXXXXX_outbound_clicks.sql` (table: `user_id nullable, listing_id, source_url, affiliate_tag, ts`). Wrap `source_url` in `ApartmentCard` / `RentalCardInline` with affiliate-tag rewriter (Airbnb + Booking.com IDs via env). Edge fn or RPC to log clicks.

## Week 2 exit test (§5 of `tasks/CHAT-CENTRAL-PLAN.md`)

- [ ] Logged-in user searches rentals → saves 2 listings (`saved_places` rows exist) → adds 1 to a new trip (`trip_items` row exists) → clicks outbound to Airbnb → click logged to `outbound_clicks` with affiliate tag.

---

## DONE This Session (2026-04-05) — edge + rentals polish

- [x] **`tasks/notes/06-search.md`** — Rental search strategy + meta-search (links `03-realestate-search.md`)
- [x] **`02E` prompt** — Rental **payments off-platform** (landlord/owner); booking-create / E2-009 / INDEX aligned; E2-005 Stripe webhook deferred
- [x] **`CLAUDE.md`** — **Task completion & docs** section + `verify:edge` in quick commands / git workflow (aligned with `.cursor/rules/task-completion-and-docs.mdc`)
- [x] **`tasks/prompts/core`** — **Success criteria (tests · verify · production-ready)** section added to all **20** prompt files (before **Feature success**)
- [x] **`Deno.serve`** on all edge `index.ts` (removed `std/http` `serve`)
- [x] **Per-request CORS** — `getCorsHeaders(req)` + `jsonResponse(..., req)` / SSE headers on ai-chat, ai-router, ai-search, ai-trip-planner, google-directions, rentals, ai-optimize-route, ai-suggest-collections, rules-engine; **OPTIONS → 204** where applicable
- [x] **`ai-optimize-route`** — `insertAiRun` for Gemini path (when user JWT present); shared clients + `okJson`
- [x] **`rentals` API** — legacy body/response shapes (intake, listing `listing_id`, search flat fields, verify `freshness_status`, map pin coords)
- [x] **`ApartmentRentActions`** — idempotency key rotates via **`useEffect` when dialog opens** (fixes silent CRM no-op on reopen)

## DONE Earlier (2026-04-05) — security hardening

- [x] **verify_jwt = true** on all 10 edge functions → `supabase/config.toml`
- [x] **CORS locked down** → `_shared/http.ts` now uses `getCorsHeaders(req)` with allowed origins
- [x] **Service role fix** → `_shared/supabase-clients.ts` created; applied to ai-search + ai-router
- [x] **Gemini timeout helper** → `_shared/gemini.ts` with 30s AbortController
- [x] **Frontend hardcoded URLs removed** → All 7 files now use `import.meta.env.*`
- [x] **Frontend hardcoded JWT tokens removed** → 3 files fixed
- [x] **Dead code deleted** → useIntentRouter.ts + ChatRightPanel.tsx
- [x] **Wasted ai-router call removed** → useChat.ts no longer double-calls (saves ~50% Gemini cost/message)
- [x] **Core migration created** → `20260405120000_core_phase_corrections.sql` (idempotency_keys, notifications, agent_audit_log + indexes)
- [x] **Prompts audited + fixed** → 12 core prompts corrected (wrong schemas, missing tables, route mismatches, deletion errors)
- [x] **Roadmap updated** → Booking/landlord comms, planning dashboard, WA promoted to CORE
- [x] **Full system audit** → `tasks/audit/09-full-system-audit.md` (25/100 overall, 8 CRITICAL found)
- [x] **Prompts audit** → `tasks/audit/08-prompts-audit.md` (30/100, 13 CRITICAL found)

## Week 1 Remaining: Security Follow-Through

- [ ] **Apply service role fix to ai-chat + ai-trip-planner** → same pattern as ai-search/ai-router (use `_shared/supabase-clients.ts`) — *partial: optimize-route uses shared clients; chat/trip-planner still review*
- [ ] **Apply fetchGemini() to all 8 Gemini calls** → replace bare fetch() in ai-chat (3), ai-router (1), ai-search (2), ai-trip-planner (1), ai-optimize-route (1)
- [x] **Update OPTIONS + JSON CORS** → `getCorsHeaders(req)` across browser-invoked functions (**done 2026-04-05**)
- [ ] **Apply migration** → `supabase db reset` (local) then push to hosted
- [ ] **Rotate leaked secrets** → `.env` has Shopify/Gadget tokens in Git history — rotate in Shopify/Gadget dashboards
- [ ] **Fix Vercel env vars** → Change NEXT_PUBLIC_* to VITE_* in Vercel dashboard → `09E` E9-001
- [ ] **Deploy hardened functions** → `supabase functions deploy` for all functions with `_shared` changes

## Week 2: Pipeline + Approval Workflow

- [ ] **Build application-review edge function** → host approve/reject (the missing pipeline step) → `02E`
- [ ] **Build in-app messaging** → renter ↔ landlord thread per application → `02E`
- [ ] **Build booking-create edge function** → `02E` E2-004
- [ ] **Build payment-webhook edge function** → Stripe signature verify → `02E` E2-005
- [ ] **Stripe test mode setup** → register, get test keys, configure webhook endpoint
- [ ] **Add Zod schemas to remaining 3 functions** → ai-suggest-collections, google-directions, rules-engine
- [x] **insertAiRun on ai-optimize-route** → Gemini path (**done 2026-04-05**); ai-suggest-collections is heuristic-only; rentals has no LLM

## Week 3-4: Frontend + Planning Dashboard

- [ ] **Build Planning Dashboard** → saved favorites, compare, notes → `04E`
- [ ] **Build LandlordDashboard** → listings, applications, messages, earnings → `04E`
- [ ] **Build HostApplicationReview component** → approve/reject/request-info → `04E`
- [ ] **Build MapView + PricePin components** → Google Maps integration → `04E`
- [ ] **Build ShowingScheduler component** → `04E`
- [ ] **Wire ai-search to frontend** → replace ai-chat searchMode → `04A`
- [ ] **Wire intake wizard → pipeline** → `04E`
- [ ] **Build PaymentButton + BookingConfirmation** → `04E`

## Week 5-6: First Booking Milestone

- [ ] **End-to-end booking test** → browse → detail → schedule tour → apply → host approves → pay → confirmation
- [ ] **Showing reminders** → pg_cron T-24h + T-1h → `02F`
- [ ] **Payment idempotency tests** → duplicate POST returns cached response → `13B`
- [ ] **E2E Playwright tests** → critical path automation → `09E` E9-005
- [ ] **Admin RBAC** → server-side role checks in edge functions → `13A`
- [ ] **MILESTONE: First end-to-end booking with payment** (O1)

## Week 7-8: WhatsApp v1

- [ ] **Configure Infobip WhatsApp webhook** → `08A`
- [ ] **WA lead capture edge function** → text only, calls p1-crm → `08C`
- [ ] **WA apartment search** → calls ai-search, formats top 3 → `08L`
- [ ] **WA showing reminders** → T-24h/T-1h via Infobip outbound → `02F`
- [ ] **WA booking confirmations** → via Infobip outbound
- [ ] **MILESTONE: WhatsApp lead capture + search live** (O5)

## Later (Phase 2-3) — ADVANCED

- [ ] Paperclip CEO fix + workspace binding (E5)
- [ ] Hermes intelligence scoring (E6)
- [ ] Contract automation — lease PDF analysis (E7)
- [ ] WhatsApp v2 — AI routing via OpenClaw (E8v2)
- [ ] Trio integration contract (E12)

## Testing Strategy (run continuously)

| Gate | When | Command | Pass Criteria |
|------|------|---------|---------------|
| 1. Build + Lint | Every PR | `npm run build && npm run lint` | Zero errors |
| 2. Security Grep | Every PR touching src/ or supabase/ | See §10b in progress.md | Zero hardcoded secrets |
| 3. Edge Verification | PRs touching supabase/ | `npm run verify:edge` | All Deno tests pass |
| 4. Functional Smoke | Weekly | Manual browser test (6 steps) | No CORS/401 errors |
| 5. Pipeline E2E | Before milestones | Full lead→booking flow | No FK violations or duplicates |
| 6. Deploy Checklist | Before production | Pre/post deploy script | 401 without token, HTML with token |

## Open Decisions

| # | Decision | Options | Owner | Due |
|---|----------|---------|-------|-----|
| 1 | Primary PSP for COP | Stripe-only vs Wompi/local | TBD | Week 2 |
| 2 | Showing availability model | Calendar integration vs manual slots | TBD | Week 3 |
| 3 | Service fee % | 12% flat vs tiered | TBD | Week 2 |
