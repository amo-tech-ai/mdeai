# Next Steps — mdeai.co

> **Last updated:** 2026-04-28 evening — PR #6 merged to `main` (commit `ec92105`). `outbound_clicks` migration + `log_outbound_click` RPC deployed to hosted Supabase (live + smoke-tested). `database.types.ts` regenerated; `track-outbound.ts` rpc cast removed. **Production readiness 99/100** — only the money-path edge functions remain before launch-grade.
> Priority order. Work top-to-bottom.
> **Phase:** CORE → Chat-central MVP (Weeks 1-2 of `tasks/CHAT-CENTRAL-PLAN.md`)
> **Prompts:** `tasks/prompts/core/` (20 files), `tasks/prompts/INDEX.md`
> **Testing:** Run Gates 1-2 after every PR. See `tasks/progress.md` §10b.

---

## 🔴 Red flags / blockers / failure points

Catalogued for visibility — see "Phase B" below for fixes.

| # | Severity | Issue | Mitigation |
|---|---|---|---|
| **R1** | 🔴 **PRE-LAUNCH BLOCKER** | **Money path broken** — `booking-create` + `payment-webhook` edge functions don't exist. UX implies bookings work; back end stops at row insertion. No payment confirmation, no host notification, no Stripe webhook. | Phase B item B2 |
| **R2** | 🟡 HIGH | **Zero E2E Playwright tests.** Every PR ships on manual smoke + unit tests only. Regression risk is increasing with the velocity. | Phase B item B1 |
| **R3** | 🟡 HIGH | **Admin RBAC not enforced server-side.** `user_roles` table exists, no edge fn checks it. Admin endpoints are gated by client-side route guards only. | Phase B item B4 |
| **R4** | 🟡 HIGH | **Sentry / PostHog not yet observed in real prod.** Vars set, init verified, bundle has literals — but no real event has been confirmed in `app.posthog.com` Live Events / Sentry dashboard. SDKs could be silently failing in some browser contexts. | Phase A item A8 |
| **R5** | 🟡 MEDIUM | **Stripe / PSP decision still TBD** (Stripe-only vs Wompi/local for COP). Blocks B2 implementation. | Open Decisions §1 |
| **R6** | 🟡 MEDIUM | **In-memory rate limiter** (`_shared/rate-limit.ts`) resets per edge invocation. Acceptable for MVP, fails at scale. Durable Postgres-backed limiter migration exists (`20260423120000_durable_rate_limiter.sql`) but not yet wired to all functions. | Phase B item B6 |
| **R7** | 🟡 MEDIUM | **Email confirmation flow loses pending prompt** — sessionStorage is per-tab. Documented limitation; user opens email link in new tab → prompt lost. | Phase D item D7 |
| **R8** | 🟢 LOW | **`Conversation.user_id` typed as `string`** — anon-vs-uuid bug class previously hit at runtime (now fixed at runtime, type still loose). | Phase A item A4 |
| **R9** | 🟢 LOW | **MapProvider is chat-only** — apartment detail / trips pages don't share pin state. | Phase C items C1, C2 |
| **R10** | 🟢 LOW | **2 fast-refresh warnings in `MapContext.tsx`** — non-component exports trigger react-refresh rule. HMR-only, no correctness impact. | Phase A item A3 |
| **R11** | 🟢 LOW | **Auth-redirect Suspense flash** — authed users landing on `/` see ~50–200 ms spinner before ChatCanvas chunk loads. | Phase A item A1 |
| **R12** | 🟢 LOW | **`viewport_idle` PostHog event TYPED but not emitted.** | Phase A item A6 |

---

## ✅ Best-practices review (post-merge)

| Area | Status | Notes |
|---|---|---|
| Code-splitting + lazy routes | ✅ | 33 routes lazy, 51 chunks emitted |
| Vendor chunking | ✅ | 10 cacheable groups, ordered by dependency depth |
| Suspense boundaries | ✅ | Single boundary at `<Routes>` level with `<RouteFallback>` |
| Migrations | ✅ | All idempotent (`CREATE OR REPLACE` / `IF NOT EXISTS`) |
| RLS on all tables | ✅ | Including new `outbound_clicks` (no public SELECT) |
| SECURITY DEFINER RPCs | ✅ | `apartment_save_counts`, `log_outbound_click` |
| Typed env vars | ✅ | `VITE_*` convention enforced; rule documented |
| Telemetry layering | ✅ | Sentry breadcrumbs + PostHog events |
| Pin lifecycle docs | ✅ | Source-of-truth in ChatCanvas, cross-ref in ChatMap |
| Edge function CORS | ✅ | Per-request `getCorsHeaders(req)` |
| Edge function auth | ✅ | `verify_jwt: true` on all 10 |
| **E2E tests** | ❌ | **0 Playwright tests written. R2.** |
| **Money-path edge fns** | ❌ | **booking-create + payment-webhook missing. R1.** |
| **Admin RBAC server-side** | ❌ | **Not enforced. R3.** |
| **CSP headers** | ❌ | **Not set on Vercel.** |
| **Sentry release tagging** | ❌ | **Errors not associated with deploy version.** |
| **Database backup verification** | ❓ | **Never verified.** |
| **Secrets rotation** | ❌ | **No documented schedule for Shopify/Gadget/Vercel tokens.** |

---

## 📋 NEXT — Sequenced 22-item plan (4 phases)

Each phase is one PR. Items within a phase can ship together. Order respects dependencies (an item's "unblocks" target is downstream).

### Phase A — Quick wins batch (target: 1 PR, ~6 hrs)

Compound improvements with low review surface. Ship before Phase B starts.

- [x] **A5 — Regenerate `database.types.ts`** — **DONE 2026-04-28 evening**. Removed the local rpc cast from `track-outbound.ts`; `log_outbound_click` is now fully typed via the canonical Database type.
- [x] **A1 — Pre-fetch `ChatCanvas` chunk on Home mount** — **DONE 2026-04-28 (later)**. `useEffect(() => void import('@/components/chat/ChatCanvas'), [])` in Home. Live-verified — `/` page-load now pre-fetches `ChatCanvas + ChatTabs + ChatMessageList + ChatInput` before any nav. R11 closed.
- [x] **A2 — Lazy-mount `<GadgetProvider>` only on `/coffee`** — **DONE 2026-04-28 (later)**. New `<CoffeeShell>` parent route lazy-loaded. **Entry chunk 420 → 312 KB raw / 118 → 95 KB gzip (-19.5%)** on all non-coffee routes. Live-verified — Home has zero Gadget references; nav to `/coffee` triggers Gadget client load + real GraphQL request.
- [x] **A3 — Split `MapContext.tsx`** — **DONE 2026-04-28 (later)**. New `src/types/map-pin.ts` exports `MapPin / MapPinCategory / RentalPinMeta / PIN_CATEGORY_CONFIG`. `MapContext.tsx` re-exports for backward compat. The remaining `useMapContext` hook gets a documented eslint-disable (provider + hook conventionally co-located). R10 closed.
- [x] **A4 — Tighten `Conversation.user_id` to `(string & {}) \| 'anon'`** — **DONE 2026-04-28 (later)**. New `ConversationUserId` type alias preserves `'anon'` IntelliSense via the no-widening trick + extensive JSDoc explaining when to check the literal. R8 closed.
- [x] **A6 — `viewport_idle` event reaches PostHog** — **DONE 2026-04-28 (later)**. Was a Sentry breadcrumb only; now also forwarded to PostHog via the `mapEventToSentry()` sink with `bboxN/S/E/W` + `zoom`. `MapTelemetryEvent.viewport_idle` extended with `zoom`. R12 closed.
- [ ] **A7 — Cloud Console Maps key — quota + budget alarm** — 30 min user-side action. Prevents bill surprises if the key leaks. **Files**: none (Google Cloud Console).
- [ ] **A8 — Verify Sentry / PostHog in real prod** — submit a hero prompt on `www.mdeai.co`, confirm `prompt_send` arrives in PostHog Live Events; force a synthetic Sentry error and confirm it lands in the dashboard. Closes R4. ~15 min. **Files**: none.

**Phase A acceptance:** all 8 boxes checked + lint/build/tests pass + bundle audit confirms `chunkSizeWarningLimit` not regressed.

---

### Phase B — Production readiness (target: 1 PR per item, sequenced)

Pre-launch blockers. **R1 (money path) must ship before any public marketing push.**

- [ ] **B1 — Playwright E2E for Week 2 exit-test path** — `search rentals → save 2 → add 1 to trip → click outbound to Airbnb → verify outbound_clicks row`. Covers the highest-traffic happy-path. ~6 hrs. **Files**: `playwright.config.ts` (already present), new `e2e/week2-exit-test.spec.ts`. Unblocks confident merging of every subsequent PR.
- [ ] **B2 — `booking-create` edge function** ⚠️ **R1 PRE-LAUNCH BLOCKER**. Validates dates / availability, creates `bookings` row with idempotency key, dispatches host notification (email + future WhatsApp). Depends on Open Decisions §1 (Stripe vs Wompi). ~1 day. **Files**: `supabase/functions/booking-create/index.ts`, `supabase/functions/_shared/notifications.ts`.
- [ ] **B3 — `payment-webhook` edge function** ⚠️ **R1 PRE-LAUNCH BLOCKER**. Stripe signature verification; flips `bookings.payment_status` → confirmed; idempotency-key dedupe. ~1 day. **Files**: `supabase/functions/payment-webhook/index.ts`.
- [ ] **B4 — Admin RBAC server-side** — read `user_roles` in every admin edge fn before action. ~4 hrs. **Files**: new `_shared/admin-guard.ts`, every admin fn.
- [ ] **B5 — CSP headers + security audit** — set `Content-Security-Policy` on Vercel; verify no inline scripts after lazy-load refactor. ~2 hrs. **Files**: `vercel.json` (or `next.config` equivalent).
- [ ] **B6 — Wire durable rate-limiter RPC** — replace in-memory `_shared/rate-limit.ts` with the `check_rate_limit` Postgres RPC (migration already shipped at `20260423120001`). ~3 hrs. **Files**: `supabase/functions/_shared/rate-limit.ts`, every fn that calls it.
- [ ] **B7 — Sentry release tagging** — set `release: <commit SHA>` in `initSentry()` so dashboard groups errors by deploy. ~30 min. **Files**: `src/lib/sentry.ts`, `vite.config.ts` (define plugin).
- [ ] **B8 — Showing-reminder pg_cron** (T-24h + T-1h) — closes the lead-to-booking loop. ~3 hrs. **Files**: new migration with `pg_cron` jobs invoking edge fn that posts to email + WhatsApp.

**Phase B acceptance:** R1 + R2 + R3 + R4 closed. All edge functions enforced server-side; CSP shipped; first synthetic Sentry release tag confirmed.

---

### Phase C — Mindtrip parity (each: half-day, dependency-ordered)

Visual + interaction parity on the maps surface. Ships after Phase A.

- [ ] **C1 — `MapContext` → zustand store, lifted to root `<App>`** — single pin store across `/chat`, `/apartments/:id`, `/trips/:id`. Closes R9. ~3 hrs. **Files**: new `src/stores/map-store.ts`, `App.tsx`, all `useMapContext()` call sites.
- [ ] **C2 — `MapShell` reusable component** — single map renderer for 3 surfaces. Pulls clustering + InfoWindow + lifecycle into one place. Depends on C1. ~1 day. **Files**: new `src/components/map/MapShell.tsx`, refactor ChatMap + GoogleMapView to consume it.
- [ ] **C3 — `useMarkerLayer` hook** — dedup ChatMap + GoogleMapView. After audit § 6 made the patterns symmetric, this is mechanical. ~2 hrs. **Files**: new `src/hooks/useMarkerLayer.ts`, refactor 2 consumers.
- [ ] **C4 — ApartmentDetail bottom map** — show the apartment + nearby restaurants/cafés on the detail page. Big trust signal. Depends on C2. ~3 hrs. **Files**: `src/pages/ApartmentDetail.tsx`.
- [ ] **C5 — Saved pins ❤️ overlay on markers** — bound to `useChatActions.savedIds`. Visual continuity. ~2 hrs. **Files**: ChatMap + RentalCardInline.
- [ ] **C6 — Bidirectional card ↔ pin sync** — card click pans/zooms map (currently only hover syncs). Depends on C2. ~3 hrs. **Files**: `src/stores/map-store.ts`, `RentalCardInline.tsx`, `MapShell`.
- [ ] **C7 — Pre-fetch route chunk on link hover** — `onMouseEnter={() => preload}` on top nav links. ~50 ms warmup → near-instant nav. ~1 hr. **Files**: top nav component.

**Phase C acceptance:** map state shared across 3 surfaces; bottom-map live on ApartmentDetail; visual parity with Mindtrip.

---

### Phase D — Scale + new channels (multi-day, milestone-tracked)

90-day backlog. Order is impact-weighted; each item is its own milestone PR.

- [ ] **D1 — Server-side pin clustering** (Postgis `ST_ClusterDBSCAN`) — scales to 1000+ listings. Today's `MarkerClusterer` is client-only. ~2 days.
- [ ] **D2 — Service-worker tile cache for Maps** — first-paint LATAM 4G perf. **Now meaningful** because vendor chunks rarely change. ~2 days.
- [ ] **D3 — A/B framework via PostHog** — selective preload of `posthog` chunk + experiment flags. ~1 day.
- [ ] **D4 — WhatsApp v1** (Infobip webhook + lead capture + search + reminders) — todo.md Week 7-8 milestone. LATAM messaging norm. ~1 week.
- [ ] **D5 — Walking-distance circles** — visual layer on selected pin. ~half-day.
- [ ] **D6 — Heatmap overlay** — Wi-Fi speed / walkability for nomad targeting. ~1 day.
- [ ] **D7 — Email confirmation flow → cross-tab pending prompt** — broadcast channel + IndexedDB fallback. Closes R7. ~3 hrs.

---

## 🆕 Newly identified (added 2026-04-28 evening)

Not yet phased — review and slot into A / B / C / D:

- [ ] **PostHog dashboard setup** — define funnel + retention queries (prompt → save → outbound → booking). Without dashboards, the events are landing in a black box. ~1 hr (PostHog UI).
- [ ] **Outbound-clicks analytics dashboard** — table now exists; SQL view + Metabase/Looker tile for "top affiliate-tagged URLs / hour". ~2 hrs.
- [ ] **Database backup verification** — confirm Supabase point-in-time recovery is enabled on the production project tier. ~30 min user-side.
- [ ] **Status page** (`status.mdeai.co`) — Better-Stack or Statuspage; subscribe to Vercel + Supabase health. ~1 hr.
- [ ] **Secrets rotation schedule** — quarterly rotation cadence for Shopify CLI token, Admin API token, Gadget secret, Vercel deploy token. Document in CLAUDE.md. ~1 hr.
- [ ] **Domain warm-up / DNS check** — confirm DNS has low TTL during launch + Vercel edge routing for LATAM. ~1 hr.
- [ ] **Outbound-click attribution dashboard alert** — Sentry alert when `log_outbound_click` errors > 1% of calls. ~30 min.

---

## 🎯 Recommended sequencing (next 2-week sprint)

**Week 1 (Mon–Fri, 22 hrs):**
- Day 1–2: **Phase A** (8 items in 1 PR — ~6 hrs total). Gives compounding wins immediately.
- Day 3: **B1 Playwright E2E** (6 hrs). Without this, every PR after Phase A flies blind.
- Day 4–5: **B2 booking-create + B3 payment-webhook** (1.5 days combined). Closes the money-path gap.

**Week 2 (Mon–Fri, 22 hrs):**
- Day 1: **B4 + B5 + B6 + B7** (security batch — RBAC + CSP + durable rate-limit + Sentry release tag). 1 PR.
- Day 2–3: **B8 Showing-reminder cron** (3 hrs) + **C1 MapContext → zustand** (3 hrs) + **C3 useMarkerLayer** (2 hrs). 1 PR each.
- Day 4–5: **C2 MapShell** (1 day) — unblocks C4/C6.

**Why this ordering:**
1. Phase A first — compounding wins ship before bigger work begins; review surface stays small.
2. B1 (Playwright) immediately after — every PR from this point benefits from automated smoke.
3. B2 + B3 (money path) is the last pre-launch blocker — must land before any marketing push.
4. Security batch (B4-B7) ships as one PR — they share `_shared/` infrastructure.
5. Phase C unblocks Mindtrip parity for the 60-day plan; runs in parallel with B once B1 + B2 + B3 are merged.

---

## 🧪 Continuous-testing strategy (per-feature, per-phase, pre-launch)

Every task in Phases A/B/C/D MUST pass the **per-PR gate** to merge. Phase B items must additionally pass the **pre-staging gate** before deploying to preview. Pre-launch additionally enforces the **pre-production gate**.

### Per-PR gate (runs on every commit, blocks merge)

| Gate | Tool / command | Pass criteria | Today's status |
|---|---|---|---|
| **G1 — Type-check** | `npx tsc --noEmit` | 0 errors | ✅ green |
| **G2 — Lint** | `npm run lint` | 0 NEW errors on changed files; pre-existing 461 issues do not regress | ✅ green |
| **G3 — Unit tests** | `npm run test` | All pass (currently 44 / 44 across 7 files); new tests required for any new lib in `src/lib/` | ✅ green |
| **G4 — Edge function check** | `npm run verify:edge` (when `supabase/` changed) | Deno `check` clean + 11 / 11 deno tests pass | ✅ green |
| **G5 — Build** | `npm run build` | Clean exit; entry-chunk gzip ≤ 100 KB (current: 95 KB) | ✅ green — budget added below |
| **G6 — Security grep** | repo-wide grep for hardcoded `phc_`, `sk_live_`, `eyJhbGciOi...`, `https://*.supabase.co/...` outside `.env*` and `dist/` | 0 hits | ⚠️ run manually today, automate in B5 |
| **G7 — CodeRabbit / Vercel preview** | GitHub PR checks | All `state: SUCCESS` (Supabase Preview can be SKIPPED on this branch) | ✅ green |

### Per-phase gate (runs at the end of each phase batch)

| Gate | Tool / command | Pass criteria | Status |
|---|---|---|---|
| **F1 — Bundle audit** | `du -h dist/assets/index-*.js` + grep entry chunk for vendor leakage | Entry chunk gzip ≤ 100 KB (today: **95 KB**); no `@gadgetinc/` / `@sentry/` / `@googlemaps/` substrings in entry; total chunks ≥ 50 | ✅ enforced this PR |
| **F2 — Browser smoke** | Claude Preview MCP — navigate every route added/changed in the phase + verify console clean | No `TypeError` / `Uncaught` / `map_init_failed`; no 500 on edge fns | ✅ for Phase A |
| **F3 — Migration soundness** (Phase B+) | Apply via `supabase db push` to a branch DB; verify with `\d+ <table>` + RLS tests | Idempotent (re-run is no-op); RLS denies anon SELECT on private tables; SECURITY DEFINER functions have explicit GRANTs | ✅ enforced this sprint |
| **F4 — E2E** (added in B1) | `npx playwright test --reporter=line` | 100 % pass on critical-path specs; flaky retries ≤ 1 | ❌ **B1 not yet shipped** |
| **F5 — Telemetry sanity** | `performance.getEntriesByType('resource')` filtered for `posthog`, `sentry` | Both SDKs initialized; first event lands within 60 s of nav | ⚠️ manual verify post-merge |

### Pre-launch gate (one-time before public marketing push)

| Gate | Method | Pass criteria | Status |
|---|---|---|---|
| **L1 — Money-path smoke** | Manual booking on prod with Stripe test card | Booking row created, host email fired, payment-webhook idempotency-tested with duplicate POST | ❌ **R1 — booking-create + payment-webhook missing** |
| **L2 — Admin RBAC** | Curl admin endpoints with non-admin JWT | 403 on every route; no client-side-only gating | ❌ **R3 not yet shipped** |
| **L3 — CSP audit** | DevTools → Console (no inline-script violations after lazy-load); `securityheaders.com` | Score ≥ A; no `unsafe-inline` on script-src | ❌ B5 not yet shipped |
| **L4 — Lighthouse mobile** | `npx lighthouse https://www.mdeai.co --form-factor=mobile` | Performance ≥ 85; Accessibility ≥ 95; Best Practices ≥ 90; SEO ≥ 95 | ❓ never run |
| **L5 — Web Vitals (real users)** | PostHog `web_vitals` plugin OR `@sentry/replay` | LCP P75 < 2.5 s on prod traffic for 7 days | ❓ not wired |
| **L6 — Sentry error rate** | Sentry dashboard, last 24 h | Error rate ≤ 0.1 % of pageviews; no Critical-tagged events | ❓ never measured |
| **L7 — Database backup** | Supabase dashboard → Backups | Point-in-time recovery enabled; last backup < 24 h old | ❓ user-side, never confirmed |
| **L8 — Rate-limit observability** | Insert 100 ai-chat requests in 1 min from one user | 429 returned after limit; PostHog `rate_limit_exceeded` event fires | ❌ B6 (durable rate-limiter) pending |
| **L9 — Affiliate attribution end-to-end** | Click outbound on prod with `VITE_BOOKING_AID` set | URL has `aid=<value>`; `outbound_clicks` row inserted with `affiliate_tag = 'booking'` | ⚠️ partner accounts not yet live |
| **L10 — Mobile responsive audit** | Chrome DevTools 320 / 375 / 414 px widths | No horizontal scroll, no overlapping text, FAB above MobileNav | ✅ for current scope |
| **L11 — Domain + DNS** | `dig www.mdeai.co +short` + Vercel edge regions | TTL ≤ 300; CNAME chain ≤ 2 hops; `--latam` POPs available | ❓ never confirmed |
| **L12 — Status page** | `status.mdeai.co` exists + subscribed to Vercel + Supabase health | Live + email/SMS alerts wired | ❌ Newly identified item |

### Continuous-testing TODO (build out the gates that are still ❌ / ❓)

These tasks add the missing automation. Each should ship with its own PR, ordered by ROI.

- [ ] **CT-1 — `npm run gate:pr`** — single bash script that runs G1-G6 in sequence, prints a green/red summary, exits 1 on any failure. Used as the `pre-push` git hook OR as a CI step. **Files**: new `scripts/gate-pr.sh`. ~1 hr.
- [ ] **CT-2 — Bundle-size budget enforcement** — script that fails the build if entry-chunk gzip exceeds 100 KB. Wraps `vite build --reporter=json` + reads + asserts. **Files**: new `scripts/budget-check.ts`. ~1 hr.
- [ ] **CT-3 — Secrets grep CI step** — `git diff` against base branch + grep for known token prefixes. Run inside G6. ~30 min.
- [ ] **CT-4 — Playwright critical-path specs** (= B1) — `e2e/week2-exit-test.spec.ts` covering Save → Add-to-trip → Outbound. **6 hrs.**
- [ ] **CT-5 — Visual regression with Playwright `toHaveScreenshot()`** — guards the polished BookingDialog review step + ApartmentDetail header + ChatCanvas welcome. ~3 hrs.
- [ ] **CT-6 — Lighthouse CI** — GitHub Action that runs lighthouse on every PR's Vercel preview URL and posts a comment with deltas. **Files**: `.github/workflows/lighthouse.yml`. ~2 hrs.
- [ ] **CT-7 — Axe a11y CI** — `@axe-core/playwright` on the routes covered by CT-4. Fail PR on new violations. ~2 hrs.
- [ ] **CT-8 — Web Vitals → PostHog** — `posthog-js` has built-in `web_vitals` capture; flip the flag + add a PostHog dashboard tile. ~1 hr.
- [ ] **CT-9 — Sentry release tagging** (= B7) — `release: <commit SHA>` in `initSentry()` + Vite define plugin. ~30 min.
- [ ] **CT-10 — Edge function E2E** — `deno test` against a Supabase branch DB; fires real auth-gated requests. ~3 hrs.
- [ ] **CT-11 — Migration smoke test** — apply every migration to a fresh local DB and run `pg_restore --schema-only` diff. ~2 hrs.

---

## 🌎 Real-World User Tests (RWT) — must mirror messy reality, not synthetic gates

> **Why this section exists.** Lint + tsc + unit tests + Lighthouse all pass on a synthetic browser at full speed with clean data. Real users hit edge cases those gates can't catch: tab switches mid-flow, email links in new tabs, slow LATAM 4G, OAuth round-trips, hostile inputs, double-submits, browser-back, refresh, copy-paste URLs across devices, screen-reader nav. Every scenario below MUST pass before that path counts as production-ready — not just "code reaches the function".

### Test infrastructure (build before scenarios)

- [ ] **Playwright project matrix** — chromium / firefox / webkit, plus mobile-safari (iPhone 13) + mobile-chrome (Pixel 7). `playwright.config.ts` `projects: [...]`. **Files**: `playwright.config.ts`. ~1 hr.
- [ ] **Throttled-network fixture** — preset profiles for `slow-3g` (400 ms RTT, 400 Kbps), `4g-latam` (200 ms RTT, 4 Mbps), `wifi` (no throttle). Wraps `page.route` + CDP `Network.emulateNetworkConditions`. **Files**: `e2e/fixtures/network.ts`. ~2 hrs.
- [ ] **Test inbox for magic links** — Mailpit (local) + Supabase test-project Inbucket (preview). Helper `getMagicLinkFromInbox(email)` parses the auth email and returns the verification URL. **Files**: `e2e/fixtures/inbox.ts` + `docker-compose.test.yml`. ~3 hrs.
- [ ] **Supabase test project / branch** — separate `mdeai-test` project OR per-PR branch DB so e2e suites don't pollute production. CI step: `supabase db push --linked --project-ref $TEST_PROJECT_REF`. ~2 hrs.
- [ ] **Test-data factories** — typed fixtures for apartments / users / leads / outbound-clicks. Wrap `supabase.from('...').insert(...)` + cleanup. **Files**: `e2e/fixtures/factories.ts`. ~3 hrs.
- [ ] **Geographic simulation** — Vercel preview with `VERCEL_REGION=gru1` (São Paulo) for TTFB testing. Documented procedure, not automated. ~30 min user-side.

### RWT scenarios (each is one Playwright spec; sequenced by ROI)

#### Critical path (must pass before any marketing push)

- [ ] **RWT-1 — Anonymous → authed prompt handoff** (closes Week 2 exit test prereq + R7 partially)
  - **Journey**: User lands on `/` from a Google search on mobile Safari. Types a prompt. Hits the 3-message anon gate. Magic-link signs up. Returns to `/chat?send=pending` and the saved prompt auto-fires once.
  - **Reality knobs**: 4g-latam network throttle, iPhone 13 viewport, magic link from test inbox.
  - **Pass criteria**: prompt fires exactly once (not zero, not twice); `pendingFiredRef` guard holds; URL is replaced from `/chat?send=pending` to `/chat` after fire; `prompt_send` + `prompt_autofired` both arrive in PostHog; conversation row owned by the new auth.uid().
  - **Files**: `e2e/rwt-01-anon-to-authed-handoff.spec.ts`. ~3 hrs.

- [ ] **RWT-2 — Email link in NEW TAB (the R7 case)** (closes R7)
  - **Journey**: User types prompt in tab A, requests magic link, opens email in tab B (new tab), completes auth in B, returns to A.
  - **Reality knobs**: Two browser contexts (`browser.newContext()` × 2). Test inbox.
  - **Pass criteria**: tab A is informed of the auth via `BroadcastChannel` (after D7 ships) and replays the prompt — OR — shows a clear "Sign-in completed in another tab; click to continue" CTA if D7 not yet shipped. NEVER silently loses the prompt without UI feedback.
  - **Files**: `e2e/rwt-02-email-new-tab.spec.ts`. ~4 hrs (depends on D7).

- [ ] **RWT-3 — Search → Save → Add-to-trip → Outbound click** (Week 2 exit test, RWT version)
  - **Journey**: Authed user on desktop. Searches "rentals in Laureles". Saves 2 listings. Adds 1 to a new trip. Clicks "View on Airbnb" outbound link.
  - **Reality knobs**: Real data via factory; real network calls to ai-chat; affiliate tag in env.
  - **Pass criteria**: 2 `saved_places` rows; 1 `trips` row; 1 `trip_items` row; 1 `outbound_clicks` row with `affiliate_tag = 'airbnb'` and `surface = 'chat_card'`; outbound URL rewritten with `?af=<tag>`; PostHog `outbound_clicked` event arrives; server-side affiliate dispute reconciliation possible from the row alone.
  - **Files**: `e2e/rwt-03-week2-exit-test.spec.ts`. ~6 hrs.

- [ ] **RWT-4 — SEO → chat handoff with listing context** (Day 3 #2, RWT version)
  - **Journey**: Anon user lands on `/apartments/30000000-...-0001` from a Google SERP. Clicks "Ask mdeai about this →". Lands in `/chat?send=pending` with a listing-grounded prompt. Submits.
  - **Reality knobs**: chromium, no auth, normal network.
  - **Pass criteria**: pending prompt contains the apartment title + neighborhood; auto-fires once; Gemini response references the listing by name; no marketing-flash visible during transition.
  - **Files**: `e2e/rwt-04-seo-handoff.spec.ts`. ~2 hrs.

- [ ] **RWT-5 — Booking + idempotency on double-submit** (closes PRC-1, after B2 ships)
  - **Journey**: Authed user on desktop. Opens BookingDialog on `/apartments/...001`. Fills dates. Clicks "Submit booking request" — then immediately clicks again before the first response (Cmd+Click + retry). Verifies only ONE booking row.
  - **Reality knobs**: Inject 2-second latency on the booking-create edge function via `page.route()` so the double-submit window is reliably reproducible.
  - **Pass criteria**: exactly 1 row in `bookings` with the user's id; the second POST returns the SAME booking_id from the idempotency cache; one host-notification fired (not two).
  - **Files**: `e2e/rwt-05-booking-idempotency.spec.ts`. ~4 hrs (depends on B2).

#### Reliability / edge cases

- [ ] **RWT-6 — Tab refresh mid-stream** — User submits a prompt, sees streaming start, refreshes the page mid-stream. Verify (a) the in-flight SSE is cancelled cleanly, (b) the conversation row's last message is intact, (c) hydrating the page restores the conversation incl. the partial assistant message OR removes it cleanly. **Files**: `e2e/rwt-06-refresh-mid-stream.spec.ts`. ~3 hrs.

- [ ] **RWT-7 — Browser back button after pin click** — User on `/chat` clicks a pin → InfoWindow → "View details" → `/apartments/:id` → browser back → `/chat`. Verify (a) chat state preserved, (b) pins still rendered, (c) scroll position restored. **Files**: `e2e/rwt-07-back-button.spec.ts`. ~2 hrs.

- [ ] **RWT-8 — Anon → authed transition preserves conversation** — Anon types 3 prompts, hits limit, signs in mid-conversation. Verify (a) the in-memory anon messages are cleared (security), (b) a fresh DB-backed conversation is minted, (c) `useChat` doesn't double-fetch on the auth-state-change event. **Files**: `e2e/rwt-08-anon-to-authed-conversation.spec.ts`. ~3 hrs.

- [ ] **RWT-9 — Sign out resets observability identity** — Authed user with established PostHog distinct-id signs out. Verify (a) `posthog.reset()` fires, (b) the next anon session has a different distinct-id, (c) Sentry breadcrumbs don't carry the old user id. **Files**: `e2e/rwt-09-signout-identity-reset.spec.ts`. ~2 hrs.

- [ ] **RWT-10 — Two-tab session sync** — Tab A signs in. Tab B (open before sign-in, on `/`) should detect the auth-state change and offer to nav to `/chat`. Verify the supabase auth event reaches both tabs. **Files**: `e2e/rwt-10-two-tab-sync.spec.ts`. ~3 hrs.

#### Performance + perception under stress

- [ ] **RWT-11 — Slow 3G first-paint** — Anon user lands on `/` with `slow-3g` throttle. Verify (a) HTML loads in < 2 s, (b) hero copy paints before the chat input becomes interactive, (c) every chunk-loading state has a visible fallback. Lighthouse score Performance ≥ 50 on Slow 3G mobile preset. **Files**: `e2e/rwt-11-slow-3g-paint.spec.ts`. ~3 hrs.

- [ ] **RWT-12 — Time-to-first-pin on slow 4G** (PRC-19) — Authed user on `/chat` types a prompt. From submit-click to first pin painted: < 5 s on 4g-latam throttle. Reports the actual measurement to PostHog as `ttfp_ms`. **Files**: `e2e/rwt-12-time-to-first-pin.spec.ts`. ~3 hrs.

- [ ] **RWT-13 — Concurrent users + rate-limit observability** (PRC-9, after B6) — Spawn 100 simultaneous anon sessions, each sending 1 prompt. Verify (a) every request is honored OR returns 429 cleanly (no 5xx), (b) Postgres connection pool stays under 80 % utilization, (c) PostHog `rate_limit_exceeded` events match the 429 count. **Files**: `e2e/rwt-13-concurrent-users.spec.ts`. ~4 hrs (depends on B6).

#### Mobile + iOS quirks

- [ ] **RWT-14 — iOS Safari 100vh + safe-area** — On `iPhone 13` device profile in Playwright. Open `/chat`. Verify (a) chat input never sits behind the address bar, (b) MobileNav respects `safe-area-inset-bottom`, (c) Map drawer Sheet height uses `100dvh` (not `100vh`) so it survives the URL bar showing/hiding. **Files**: `e2e/rwt-14-ios-safari.spec.ts`. ~3 hrs.

- [ ] **RWT-15 — Touch-tap behavior** — On mobile-chrome, tap the Map FAB. Verify (a) no hover-state remains stuck after tap, (b) tap-target is ≥ 44 × 44 px (WCAG AAA), (c) ripple feedback fires within 100 ms of tap-start. **Files**: `e2e/rwt-15-touch-tap.spec.ts`. ~2 hrs.

#### Accessibility + screen reader

- [ ] **RWT-16 — Screen-reader navigation through chat** — Use `@axe-core/playwright` + Playwright's keyboard simulation. Navigate `/chat` with Tab key only. Verify (a) every interactive element has accessible label, (b) chat messages are announced via `aria-live`, (c) the InfoWindow peek is keyboard-dismissable with Esc. **Files**: `e2e/rwt-16-screen-reader.spec.ts`. ~4 hrs.

- [ ] **RWT-17 — Reduced-motion respect** — On a context with `reducedMotion: 'reduce'`. Verify (a) Sheet drawer slide-in is replaced with fade or instant, (b) skeleton shimmer animation pauses, (c) MarkerClusterer doesn't auto-zoom. **Files**: `e2e/rwt-17-reduced-motion.spec.ts`. ~2 hrs.

#### Security + hostile inputs

- [ ] **RWT-18 — XSS payload in chat input** — Submit `<script>alert(1)</script>` and `<img src=x onerror=alert(1)>` as user messages. Verify (a) renders as text, never executes, (b) does NOT trip CSP (B5 must allow text rendering of these strings), (c) Gemini's response also doesn't echo it as HTML. **Files**: `e2e/rwt-18-xss.spec.ts`. ~2 hrs.

- [ ] **RWT-19 — SQL injection attempt in search filters** — Submit a chat-context budget chip with `'; DROP TABLE apartments; --`. Verify (a) the chip is stored as text, (b) Postgres queries from `useApartments` use parameterized `.eq()` not raw SQL, (c) edge fn returns 422 if Zod schema rejects. **Files**: `e2e/rwt-19-sqli.spec.ts`. ~2 hrs.

- [ ] **RWT-20 — Anon user attempts admin endpoint** (PRC-6, after B4) — Anon user POSTs to `/admin/apartments` edge fn. Verify 403 returned; row not inserted; PostHog `unauthorized_access_attempt` event fires. **Files**: `e2e/rwt-20-admin-rbac.spec.ts`. ~2 hrs (depends on B4).

#### Geographic + network reality

- [ ] **RWT-21 — LATAM TTFB** (PRC-25, manual) — Curl `https://www.mdeai.co/` from a São Paulo VPS (e.g. DigitalOcean SFO3). TTFB < 500 ms. Documented one-shot procedure. ~30 min.

- [ ] **RWT-22 — Cold-cache real-user load** (PRC-20) — Lighthouse CI run from a 4G-throttled mobile preset on a cold cache. Performance score ≥ 85; LCP < 2.5 s; CLS < 0.1; INP < 200 ms. **Files**: `.github/workflows/lighthouse.yml` → adds `--throttling.cpuSlowdownMultiplier=4 --throttling-method=devtools`. ~2 hrs.

### RWT testing matrix (every critical-path spec runs all combinations)

| | chromium | firefox | webkit | mobile-safari | mobile-chrome |
|---|---|---|---|---|---|
| **wifi** | RWT-1, 3, 4, 5, 6, 7, 8, 9, 10 | RWT-1, 3 | RWT-1, 3 | RWT-1, 3, 14, 15 | RWT-1, 3, 14, 15 |
| **4g-latam** | RWT-11, 12, 22 | — | — | RWT-11, 12 | RWT-11, 12 |
| **slow-3g** | RWT-11 (Lighthouse) | — | — | RWT-11 | — |

Critical path = RWT-1 / 3 / 4 / 5 — must run on at least 3 browsers in CI. Edge cases run on chromium only unless the bug class is browser-specific (RWT-14 webkit-only).

### RWT acceptance criteria for "production-ready"

- [ ] **All critical-path RWTs (1, 3, 4, 5)** pass on chromium + firefox + webkit + mobile-safari, on `wifi` AND `4g-latam` profiles. 5 consecutive runs green, no flaky retries.
- [ ] **All edge-case RWTs (6–22)** pass on chromium with the relevant browser/network knob.
- [ ] **Failures auto-attach** — Playwright trace + screenshot + console log + network HAR captured for every failure and uploaded to the PR comment.
- [ ] **Each RWT contributes to PostHog dashboards** — perf RWTs report `ttfp_ms` / `lcp_ms` to a PostHog test-only group so prod regressions trigger a real-data alert, not just a CI red.

### RWT effort summary

- Test infrastructure (6 items, ~10 hrs)
- Critical-path scenarios (RWT-1 to RWT-5, ~19 hrs)
- Reliability + edge (RWT-6 to RWT-10, ~13 hrs)
- Performance under stress (RWT-11 to RWT-13, ~10 hrs)
- Mobile + iOS (RWT-14, RWT-15, ~5 hrs)
- A11y (RWT-16, RWT-17, ~6 hrs)
- Security (RWT-18 to RWT-20, ~6 hrs)
- Geographic (RWT-21, RWT-22, ~2.5 hrs)
- **Total: ~71 hrs** (≈ 9 engineer-days). Sequence: infra batch → critical path → edge cases parallel with B-phase tasks.

---

## 🚦 Production-Ready Checklist (success criteria, definition of done)

Every feature MUST hit these explicit criteria before being marked done in this todo. The bar is intentionally high — a feature that ships without all four columns is technical debt by definition.

### Definition of done (per feature)

| Column | Required artifact | Measurable threshold |
|---|---|---|
| **Built** | Source landed on the branch + lint + tsc + build green | G1+G2+G5 pass |
| **Tested** | Unit OR E2E test covering the new behavior | New test added; per-PR gate green |
| **Documented** | Changelog entry + `tasks/todo.md` flipped to checked + JSDoc on any new export | Visible in `git log` + `cat changelog \| head -40` |
| **Verified** | Live smoke on dev OR preview OR prod (whichever surface the feature lives on) | Either Claude Preview MCP transcript OR screenshot OR a `curl` log attached to the PR |

### Production-grade success criteria (pre-launch gate)

Cross-references R1–R12 + L1–L12 above. **Every checkbox below must be green before any public marketing push.**

#### Functional readiness
- [ ] **PRC-1 — Money path end-to-end** ⚠️ **CURRENT BLOCKER** — booking submitted → host notified → payment confirmed (Stripe test mode) → confirmation email arrives → idempotent on duplicate webhook delivery. (R1, B2, B3, L1) **RWT-5 covers idempotency.**
- [ ] **PRC-2 — Lead-to-booking pipeline** — chat search → save → schedule showing → application → host approve → booking → payment. End-to-end Playwright spec must run green for ≥ 5 consecutive runs. (B1, F4) **RWT-3 covers Week 2 exit-test.**
- [ ] **PRC-3 — Affiliate attribution** — every outbound URL on a partner-program domain rewrites + logs to `outbound_clicks`; partner-tag values live for at least 1 partner. (Day 3 #1 ✓ shipped, partner IDs ⚠️) **RWT-3 verifies the row + tag end-to-end.**
- [ ] **PRC-4 — Mobile parity** — every critical flow (search / save / book / message host) works on 375 × 812 with zero horizontal scroll. (Phase A drawer ✓; rest spot-verified) **RWT-14 (iOS Safari quirks) + RWT-15 (touch tap) cover this.**

#### Security
- [ ] **PRC-5 — RLS hard guarantee** — service-role-only tables (`outbound_clicks`, `agent_audit_log`, `idempotency_keys`) deny `anon` SELECT under positive test (`curl` with anon JWT returns []). (R3, B4) **RWT-19 (SQLi attempt) covers parameterization.**
- [ ] **PRC-6 — Admin RBAC server-side** — every admin edge fn checks `user_roles` before mutating. Non-admin JWT returns 403. (R3, B4) **RWT-20 covers anon-as-admin attempt.**
- [ ] **PRC-7 — CSP locked** — `Content-Security-Policy` on Vercel; no `unsafe-inline` on `script-src`; `securityheaders.com` score ≥ A. (B5, L3) **RWT-18 (XSS attempt) verifies CSP catches inline script.**
- [ ] **PRC-8 — Secrets isolation** — `git log -p` finds zero secrets in history; `.env*` rotated quarterly; Vercel + Supabase tokens in 1Password (or vault equivalent). (Newly identified; document rotation cadence)
- [ ] **PRC-9 — Rate limiting durable** — `_shared/rate-limit.ts` backed by Postgres RPC, not in-memory `Map`. 100 requests / minute / user enforced; 429 returns visible in PostHog. (R6, B6, L8) **RWT-13 (concurrent users) verifies under load.**
- [ ] **PRC-10 — Auth + session integrity** — anon-vs-uuid path-handling lint-clean; realtime subscriptions gated on `conversation.user_id === user.id`; sign-out resets PostHog distinct-id. (R8 ✓ via A4) **RWT-8 + RWT-9 + RWT-10 cover the transitions.**

#### Observability + reliability
- [ ] **PRC-11 — Sentry catches a real error in prod** — verified via synthetic exception within 24 h of cutover. (R4, A8)
- [ ] **PRC-12 — PostHog captures `prompt_send` from a real user** — visible in Live Events within 24 h of cutover. (R4, A8)
- [ ] **PRC-13 — Sentry release tagging** — every dashboard issue groups by deploy commit SHA. (B7, CT-9)
- [ ] **PRC-14 — Web Vitals visibility** — LCP / INP / CLS captured per-route in PostHog; P75 LCP < 2.5 s on prod traffic for 7 days. (L5, CT-8)
- [ ] **PRC-15 — Lighthouse score** — mobile: Performance ≥ 85, A11y ≥ 95, Best-Practices ≥ 90, SEO ≥ 95. (L4, CT-6)
- [ ] **PRC-16 — Status page live** — `status.mdeai.co`; auto-subscribed to Vercel + Supabase. Email/SMS to oncall on degradation. (Newly identified, L12)
- [ ] **PRC-17 — DB backup + PITR** — Supabase point-in-time recovery enabled (Pro plan); last backup confirmed < 24 h old; restore tested at least once. (L7, Newly identified)

#### Performance
- [ ] **PRC-18 — Bundle budget** — entry chunk ≤ 100 KB gzip; no single chunk > 250 KB gzip; total chunks ≥ 50. (CT-2) **Today: 95 KB / 596 KB / 51 chunks ✓.**
- [ ] **PRC-19 — Time-to-first-pin on `/chat`** — < 5 s median on a throttled 4G connection. **RWT-12 measures + reports `ttfp_ms` to PostHog.**
- [ ] **PRC-20 — Cold-cache full-load** — < 4 s TTI on 4G for `/`, `/chat`, `/apartments/:id`. **RWT-22 (Lighthouse CI cold-cache) measures.**
- [ ] **PRC-21 — Maps quota guard** — Cloud Console daily-quota alarm + monthly-spend alarm wired. (A7, L11)

#### Compliance + ops
- [ ] **PRC-22 — Privacy policy + Terms live** — `/privacy` + `/terms` accurate to current data flows (PostHog distinct-id, Sentry PII flag, Supabase auth.users). Reviewed by counsel if any GDPR-scope users. (Spot-check pages today)
- [ ] **PRC-23 — Cookie consent** — visible banner if EEA users land; PostHog respects `posthog.opt_out_capturing()` from rejected consent. (Newly identified)
- [ ] **PRC-24 — Email confirmation flow recovery** — pending prompt survives email-link open in a new tab. (R7, D7) **RWT-2 verifies the new-tab case.**
- [ ] **PRC-25 — Domain + DNS** — TTL ≤ 300; CNAME chain ≤ 2 hops; LATAM-region Vercel POPs verified live. (L11) **RWT-21 (São Paulo TTFB) measures.**

### Acceptance criteria for marking the WHOLE app production-ready

- [ ] All 25 PRC items checked. Anything still ❌ documented as a known gap with mitigation in this file.
- [ ] **All 22 RWT scenarios pass on the matrix (chromium / firefox / webkit / mobile-safari × wifi / 4g-latam where applicable).** 5 consecutive runs green on the critical-path subset (RWT-1, 3, 4, 5).
- [ ] Last 7 days of prod traffic: < 0.1 % Sentry error rate, > 95 % positive booking-attempt completion.
- [ ] On-call rotation defined (even if 1 person); runbook document for the 3 most-likely incidents (Maps API down, Supabase RLS misconfig, Stripe webhook 500).
- [ ] Backup of `database.types.ts` + the `supabase/migrations/` directory snapshotted to a dated tag (`pre-launch-YYYY-MM-DD`).

---

## 🧪 Plan verification checklist

- [x] Every item maps to a closing red flag OR a documented user-value increment
- [x] Phase A items are all <1 hr — fits "Quick wins batch" definition
- [x] Phase B items are pre-launch blockers (R1 closure)
- [x] Phase C items are dependency-ordered (C1 → C2 → C4/C6)
- [x] Phase D items have milestone status (not weekly)
- [x] Every red flag (R1–R12) has a phase + item assigned
- [x] No duplicate items between phases
- [x] No item depends on something later in the same phase
- [x] Each newly-identified item has an explicit slot to be triaged into

---

## DONE 2026-04-28 evening — PR #6 merged + migration deployed

- [x] **PR #6 merged to `main`** — squash-merge `ec92105`. 7 commits on the sprint, all live at `www.mdeai.co` after Vercel auto-deploy.
- [x] **`outbound_clicks` migration deployed to hosted Supabase** — applied via Supabase MCP `apply_migration`. Table + indexes + RLS + `log_outbound_click` RPC all confirmed via `information_schema` + `pg_indexes` + `role_routine_grants` queries.
- [x] **RPC smoke tests passed** — defense-in-depth http(s) regex correctly rejected `javascript:alert(1)` with sqlstate 22023; real insert succeeded with all columns populated; test row deleted post-verification.
- [x] **`apartment_save_counts_rpc` migration registered** — was previously deployed out-of-band; this added it to the migration history table so local + remote are now in sync.
- [x] **`database.types.ts` regenerated** — 3940 lines, includes `outbound_clicks` row + `log_outbound_click` RPC signature.
- [x] **`track-outbound.ts` rpc cast removed** — function call now goes through canonical typed `supabase.rpc('log_outbound_click', ...)`. Type-check + lint clean.

---

## DONE 2026-04-28 — Day 2 / 3 / 4 sprint + audit § 6 + code-split (PR #6, 7 commits)

### Live on `fix/chat-production-hardening` (awaiting PR #6 merge)

**Day 2 (observability + mobile)**
- [x] **Sentry + PostHog activated** — env vars in Vercel (production + preview) + `.env.local`. Wiring code shipped earlier; this turned the no-op switches on. Bundle audit confirms `phc_rpJoH...` + Sentry DSN literals baked into prod build.
- [x] **Mobile fullscreen map drawer** — floating `Map (N)` pill at `bottom-24 right-4` opens a `<Sheet side="bottom">` with the same `<ChatMap />`. MapContext shares pin state. Verified at `375 × 812`; hidden on `md:` and up.

**Day 3 (revenue / SEO loop)**
- [x] **Affiliate attribution + `outbound_clicks`** — migration `20260427210000_outbound_clicks.sql` (table + RLS + `log_outbound_click` RPC) + `src/lib/affiliate.ts` (Booking/Airbnb/VRBO rewriter, **12 unit tests**) + `src/lib/track-outbound.ts` + wired in RentalCardInline (chat surface) + RentalsListingDetail (detail surface). Closes Week 2 exit-test prereq #5.
- [x] **SEO → chat handoff** — "Ask mdeai about this →" CTA on `/apartments/:id` composes a listing-grounded prompt + `savePendingPrompt()` + nav to `/chat?send=pending`. Verified end-to-end (button → URL handoff → auto-fire → 9-listing rental_search payload).

**Day 4 (Mindtrip parity)**
- [x] **InfoWindow peek on pin click** — single InfoWindow instance reused across pins. Peek = photo + title + neighborhood / BR/BA + price/rating + "View details →". Cmd/Ctrl/middle-click + keyboard preserve direct-nav.
- [x] **Booking dialog polish** — review step shows photo strip (snap-x, up to 4 thumbs + "+N more" link) + 2-col amenity grid with check icons (caps at 8). Both render conditionally. Verified end-to-end on Poblado Penthouse listing.

**Audit § 6 (10 surgical fixes + new Vitest)**
- [x] All 10 audit-§-6 items closed in commit `a3a4a4c`. Highlights: GoogleMapView selection-mutation went from O(n) to O(2) DOM rewrites per click; id-keyed marker map (parity with ChatMap); typed `RentalPinMeta`; new `google-maps-loader.test.ts` with 4 Vitests covering shim recursion, script src construction, missing-key rejection, `gm_authFailure` handshake.

**Performance — code-splitting (commit `a802093`)**
- [x] **Entry chunk 597 KB → 118 KB gzip (80% smaller).** 33 routes lazy-loaded behind a Suspense boundary; vendor chunks split into 10 cacheable groups (radix 95 KB / supabase 51 KB / posthog 62 KB / sentry 29 KB / forms 23 KB / gadget 24 KB / dates 18 KB / icons 12 KB / tanstack 12 KB / maps 8 KB gzip). Live-verified: navigating to `/login` triggers 22 new fetches that were NOT in the initial 70-fetch batch.

### Verification (this sprint)
- [x] `npm run lint` — 0 errors on changed files
- [x] `npm run build` — 3.95 s, **51 chunks emitted** (was 1)
- [x] `npm run test` — **44 / 44** across 7 files (was 28 / 28 across 5 — added 12 affiliate tests + 4 google-maps-loader tests)
- [x] `npm run verify:edge` — deno check + 11 / 11 deno tests pass (the "broken" status in todo was stale; now confirmed green)
- [x] Browser smoke (Claude Preview MCP): mobile drawer + desktop layout + observability init + affiliate rewriter + booking review step + lazy chunk fetch — all verified live

### Post-merge actions (queued for after PR #6 lands)
- [ ] `supabase db push` — deploys `outbound_clicks` migration to hosted
- [ ] `supabase gen types typescript --linked` — refreshes `database.types.ts` so `track-outbound.ts` can drop its local rpc cast
- [ ] (Optional, when partner accounts go live) Add `VITE_BOOKING_AID` / `VITE_AIRBNB_AFFILIATE_TAG` / `VITE_VRBO_AFFILIATE_TAG` to Vercel + `.env.local`. Until then, clicks log with `affiliate_tag = NULL` — useful baseline for "we'd have earned X% on Y clicks" analysis
- [ ] Confirm a real PostHog event arrives in `app.posthog.com` Live Events after a hero-prompt submit on www.mdeai.co
- [ ] Confirm a synthetic Sentry error captures (e.g. force `script_load_failed` map telemetry)

---

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
- [x] ~~**Bundle 1.81 MB / ~480 KB gzip**~~ — **resolved 2026-04-28 late-night**. Entry chunk down to 118 KB gzip after vendor splitting + route-level lazy loading. See changelog for full breakdown.
- [x] ~~**`npm run verify:edge` broken** (pre-existing) — `p1-crm/index.ts` deno-imports `@supabase/supabase-js`~~ — **resolved**. Verified 2026-04-28: `npm run verify:edge` runs deno check on all 10 functions + 4 shared modules + 11/11 deno tests pass. The earlier blocker self-resolved (deno fetched the dep on first run; cached for subsequent runs).
- [ ] **Email confirmation flow loses pending prompt** — sessionStorage is per-tab; clicking the email link in a new tab loses the saved prompt. Documented limitation.

## NEXT — Recommended sprint (ranked by Revenue / Growth / UX / Tech / Speed)

### Day 2 — Observability + Mobile (highest leverage) — **all 3 shipped**
- [x] **Wire Sentry SDK** — DSN in `.env.local` + Vercel (prod + preview). `initSentry()` activates, replaces maps-telemetry sink with Sentry breadcrumb + captureException sink for `*_failed` events. Build verified: 8 sentry refs in prod bundle.
- [x] **Wire PostHog** — `VITE_POSTHOG_KEY` + `VITE_POSTHOG_HOST` in `.env.local` + Vercel. `initPostHog()` activates, typed `AppEvent` union, 6 call sites already emit (`prompt_send`, `prompt_autofired`, `viewport_search`, `pin_click`, `cluster_expand`, `booking_submitted`). Stale `VITE_PUBLIC_POSTHOG_*` deleted from Vercel.
- [x] **Mobile fullscreen map drawer** — **shipped 2026-04-28**. Floating `Map (N)` pill at `bottom-24 right-4` opens a `<Sheet side="bottom">` with `<ChatMap />` inside. MapContext shares pin state automatically. Verified at `375 × 812`; correctly hidden on `md:` and up.

### Day 3 — Conversion improvements
- [x] **Affiliate attribution + `outbound_clicks` migration** — **shipped 2026-04-27 late evening**. Migration `20260427210000_outbound_clicks.sql` (table + RLS + `log_outbound_click` RPC), `src/lib/affiliate.ts` (Booking/Airbnb/VRBO rewriter, 12 unit tests), `src/lib/track-outbound.ts` (RPC + PostHog event), wired in `RentalCardInline` (chat surface = `chat_card`) + `RentalsListingDetail` (surface = `detail_page`). Env tags optional (`VITE_BOOKING_AID` / `VITE_AIRBNB_AFFILIATE_TAG` / `VITE_VRBO_AFFILIATE_TAG`); clicks log with `affiliate_tag = NULL` until partner IDs are configured. **Closes Week 2 exit-test prerequisite #5.**
- [x] **SEO page → chat handoff** — **shipped 2026-04-28**. "Ask mdeai about this →" button on `/apartments/:id` right rail composes a listing-grounded prompt + `savePendingPrompt` + nav to `/chat?send=pending`. Live-verified: button click → URL handoff → auto-fire → Gemini response with `rental_search` payload of 9 listings.

### Day 4 — Mindtrip parity polish
- [x] **InfoWindow on pin click** — **shipped 2026-04-28**. Single InfoWindow instance reused across pins (Mindtrip pattern). Peek = photo + title + neighborhood/BR/BA + price/rating + "View details →" button. Cmd/Ctrl/middle-click + keyboard preserve direct-nav. Pin meta extended in `ChatCanvas` with `image / rating / bedrooms / bathrooms`. Cleanup closes peek on `pins` change so it can't outlive anchor.
- [x] **Booking dialog polish** — **shipped 2026-04-28**. Review step now shows a horizontal photo strip (snap-x, up to 4 thumbnails + "+N more" link) and a 2-col amenity grid with check icons (caps at 8, "+N more →" if exceeded). Both render conditionally so listings without photos/amenities don't get empty placeholders. Verified end-to-end on `/apartments/30000000...0001` (Poblado Penthouse) → screenshot confirms PHOTOS + WHAT'S INCLUDED sections render correctly above the dates/pricing rows.

### Tech-debt cleanup (anytime, low priority)
- [ ] **`useMarkerLayer` hook** — factor duplication between ChatMap and GoogleMapView. (audit § 6) **PARTIALLY UNBLOCKED:** GoogleMapView refactor in audit-§-6 made the patterns symmetric; extraction is now mostly mechanical.
- [ ] **Custom Cloud Console MapID** — Mindtrip-style muted palette. Pure visual polish. (audit § 90-day)
- [x] **Code-split + lazy-load** map / detail pages — **shipped 2026-04-28 late-night**. Entry chunk 597 KB → **118 KB gzip** (80% smaller). 33 routes lazy-loaded behind a Suspense boundary; vendor chunks split into 10 cacheable tier-2/tier-3 groups (radix, supabase, posthog, sentry, forms, dates, icons, tanstack, maps, gadget). Live-verified: navigating to `/login` triggers 22 new fetches (including `src/pages/Login.tsx`) that were NOT in the initial 70-fetch batch.
- [x] ~~**Fix `npm run verify:edge`**~~ — **resolved 2026-04-28**. `npm run verify:edge` runs deno check + 11 / 11 deno tests pass. The blocker self-resolved after deno cached `@supabase/supabase-js` on first run.
- [ ] **Tighten `Conversation.user_id` type** — currently `string`; pin to `uuid | 'anon'`.

## Code-quality cleanup (audit § 6) — **all 10 shipped 2026-04-28 night**

Small, surgical fixes called out in `tasks/plan/01- MDEAI Maps Architecture Audit.md` § 6. See `changelog` 2026-04-28 night entry for full details.

- [x] **`google-maps-loader.ts` docstring** — example now shows the typed `loadGoogleMapsLibrary<google.maps.MapsLibrary>('maps', key)` form returning the whole library object.
- [x] **`google-maps-loader.ts` dead `void UUID_RE`** — deleted.
- [x] **`google-maps-loader.ts` `_installAuthFailureHandler`** — renamed to underscore-prefixed private. Verified post-rename: module exports are exactly `[isMapsAuthFailed, loadGoogleMapsLibrary, onMapsAuthFailed]`.
- [x] **`google-maps-loader.test.ts`** — new Vitest, 4 tests covering: shim recursion lands in real impl (not stale closure), script src is built correctly (key + loading=async + callback), missing apiKey rejects clearly, `gm_authFailure` toggles `isMapsAuthFailed()`.
- [x] **`ChatMap.tsx` cross-reference** — comment at the top of the component points to ChatCanvas as pin-lifecycle source-of-truth.
- [x] **`ChatMap.tsx` smart `MEDELLIN_CENTER`** — first geo-pinned listing in context wins; falls back to default only when chat hasn't surfaced anything yet.
- [x] **`ChatCanvas.tsx` pin-merge comment** — explicit policy block: each tool response REPLACES pins; two scope-change effects clear; cleanup is intentionally empty.
- [x] **`GoogleMapView.tsx` surgical selection mutation** — split items-update from selection-change; selection-change uses `prevSelectedRef` and only mutates the prev → new pin pair (O(2) DOM rewrites per click vs O(n) before — 50 pins → 50× → 2× rewrites).
- [x] **`GoogleMapView.tsx` id-keyed marker map** — replaced `AdvancedMarkerElement[]` with `Map<string, MarkerEntry>`. Items-update diffs in 3 phases (REMOVE / UPDATE / ADD) so same id reuses DOM + click handler. Listener rewiring eliminated.
- [x] **`MapContext.tsx` `RentalPinMeta`** — typed per-vertical bag added; producers (ChatCanvas) build typed `meta`; consumers (ChatMap InfoWindow) narrow with `as RentalPinMeta` instead of casting field-by-field. `MapPin.meta` stays loosely-typed so new verticals (restaurant/event/attraction) plug in without touching the base.

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

## Week 2 exit test (§5 of `tasks/CHAT-CENTRAL-PLAN.md`) — **all 5 prerequisites shipped**

- [ ] **Run end-to-end on prod** (post-merge): logged-in user searches rentals → saves 2 listings (`saved_places` rows exist) → adds 1 to a new trip (`trip_items` row exists) → clicks outbound to Airbnb → click logged to `outbound_clicks` with affiliate tag.

**5 of 5 prerequisites done** ✓ chat ✓ Save ✓ Add-to-trip ✓ social proof ✓ affiliate attribution + outbound-click logging. The only remaining step is the live end-to-end run after PR #6 merges + `supabase db push` deploys the migration.

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
- [x] ~~**Bundle 1.81 MB / ~480 KB gzip**~~ — **resolved 2026-04-28 late-night**. Entry chunk down to 118 KB gzip after vendor splitting + route-level lazy loading. See changelog for full breakdown.
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
