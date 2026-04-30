# Next Steps — mdeai.co

> **Last updated:** 2026-04-30 — **D5 shipped end-to-end.** `listing-create` edge fn deployed (id `bda85444-117c-4ffa-bc75-72579ce4e650`, version 1, ACTIVE). Step4Description + useListingCreate + ListingNew wiring complete. Browser-proven both verdicts (happy → 201 needs_review with apartments row; rejected → 422 with 3 reasons, zero rows inserted). All gates green: lint clean (D5 files), 86/86 tests, build 4.31s, 10/10 chunks within budget, 25 deno tests (14 auto-moderation). Step1Address fallback fix shipped (wizard no longer blocks when Maps key fails). **Next:** D6 founder review queue + admin moderation UI per `tasks/plan/06-landlord-v1-30day.md`.
> Priority order. Work top-to-bottom.
> **Phase:** CORE → Chat-central MVP (Weeks 1-2 of `tasks/CHAT-CENTRAL-PLAN.md`)
> **Prompts:** `tasks/prompts/core/` (20 files), `tasks/prompts/INDEX.md`
> **Testing:** Run Gates 1-2 after every PR. See `tasks/progress.md` §10b.

---

## 🛠️ Skills atlas — invoke before writing code (added 2026-04-29)

> Load the matching skill from `.claude/skills/` (preferred) or `.agents/skills/` (fallback) BEFORE writing code for that task type. Skipping skills shipped multiple bugs already (D3 Rules-of-Hooks; D4 missing FK indexes; D5 GoTrue auth-row schema). Full per-task-type table lives in `tasks/plan/06-landlord-v1-30day.md` §5.0; this is the quick lookup.

| Task type | Use skill | Notes |
|---|---|---|
| Migration / RLS / schema | `supabase` + `supabase-postgres-best-practices` (+ `supabase-auth` for auth.users / identities) | Always run `get_advisors` after DDL |
| Edge function (Deno) | `supabase-edge-functions` | Use `_shared/http.ts` template + Zod |
| Storage bucket / policies | `supabase` (path convention `<auth.uid()>/...`) | |
| React form | `shadcn` + `frontend-design` + `ui-ux-pro-max` | react-hook-form + Zod required |
| React data hook | `vercel-react-best-practices` + `supabase` | TanStack Query patterns |
| Mermaid / sequence / state diagram | `mermaid-diagrams` | |
| Real-estate domain logic | `real-estate` (+ `real-estate-expert`, `real-estate-workflows`) | |
| Listing scraping (V2) | `firecrawl-scraper` | |
| Marketing copy / outreach | `content-creation` | §6 Spanish scripts |
| Plan / runbook / changelog | `mde-writing-plans` (+ `plan-writing`, `documentation`, `prd`) | |
| WhatsApp integration (D8+) | `automate-whatsapp` (+ `integrate-whatsapp`, `whatsapp-automation`) | V1 = `wa.me/` deep-link only |
| Sentry alerts / fixes (post-D11) | `sentry-react-sdk` + `sentry-create-alert` + `sentry-fix-issues` | |
| Gemini AI calls (D8 lead-classify) | `gemini` | |
| Commit / PR | `commit-commands:commit-push-pr` (slash command) | Global plugin |

### Skills installed 2026-04-29 (was GAPs)

All 6 skills shipped at `.claude/skills/`. Sources: skills.sh + rohitg00/awesome-claude-code-toolkit.

| Skill | Replaces / fills | Status |
|---|---|---|
| `vitest-component-testing` | CT-14 (testing patterns) | ✅ installed |
| `claude-preview-browser-testing` | CT-15 (browser proof) | ✅ installed |
| `mdeai-project-gates` | CT-16 (lint/test/build/edge/bundle) | ✅ installed |
| `systematic-debugging` | CT-17 (bug diagnosis) | ✅ installed |
| `better-auth-best-practices` | CT-18 (auth/RLS/tokens) | ✅ installed |
| `real-estate-tech` | CT-19 (V2 platform scale prep) | ✅ installed |

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

## 📋 NEXT — Sequenced 5-phase plan (44 items total: 22 feature + 22 RWT)

Each phase is one PR (batched where indicated). Order respects dependencies — an item's "unblocks" target is downstream. **Phase E (Real-World Testing) is parallel to B/C and gates pre-launch sign-off** — see "Why this is its own phase" below.

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

### Phase E — Real-World Testing (~71 hrs total, runs in parallel with B + C)

> **Why this is its own phase.** Synthetic gates (lint / tsc / unit / Lighthouse) all pass on a perfect browser at full speed with clean data. Real users hit edge cases those gates can't catch — tab switches mid-flow, email-link in new tab, slow LATAM 4G, double-submits, hostile inputs. Phase E builds the infrastructure + the 22 RWT specs (RWT-1 through RWT-22) defined in the **Real-World User Tests** section below. **Critical-path RWTs (1, 3, 4, 5) are pre-launch blockers** — without them, B2/B3 (money path) cannot be marked production-ready.

**E0 — Test infrastructure batch** (1 PR, ~10 hrs, blocks everything else in this phase)
- [ ] **E0.1 — Playwright project matrix** — chromium / firefox / webkit / iPhone 13 / Pixel 7. **Files**: `playwright.config.ts`. ~1 hr.
- [ ] **E0.2 — Throttled-network fixture** — `slow-3g` / `4g-latam` / `wifi` profiles via CDP `Network.emulateNetworkConditions`. **Files**: `e2e/fixtures/network.ts`. ~2 hrs.
- [ ] **E0.3 — Test inbox for magic links** — Mailpit (local) + Inbucket (Supabase preview). Helper `getMagicLinkFromInbox(email)`. **Files**: `e2e/fixtures/inbox.ts`, `docker-compose.test.yml`. ~3 hrs.
- [ ] **E0.4 — Supabase test project / branch DB** — separate `mdeai-test` project OR per-PR branch DB so e2e doesn't pollute prod. CI step pushes migrations via `supabase db push --project-ref $TEST_PROJECT_REF`. ~2 hrs.
- [ ] **E0.5 — Test-data factories** — typed fixtures for apartments / users / leads / outbound-clicks with cleanup. **Files**: `e2e/fixtures/factories.ts`. ~3 hrs.
- [ ] **E0.6 — Geographic simulation** — Vercel preview with `VERCEL_REGION=gru1` (São Paulo) for TTFB testing. Documented procedure, not automated. ~30 min user-side.

**E1 — Critical-path RWTs** (1 PR per spec, runs after E0; blocks any pre-launch sign-off)
- [ ] **E1.1 — RWT-1** Anonymous → authed prompt handoff (3 hrs)
- [ ] **E1.2 — RWT-3** Search → Save → Add-to-trip → Outbound click (Week 2 exit test) (6 hrs)
- [ ] **E1.3 — RWT-4** SEO → chat handoff with listing context (2 hrs)
- [ ] **E1.4 — RWT-5** Booking + idempotency on double-submit (4 hrs, depends on B2)

**E2 — Reliability + edge-case RWTs** (1 PR per spec, parallel with C-phase work)
- [ ] **E2.1 — RWT-2** Email link in NEW TAB (the R7 case) (4 hrs, depends on D7)
- [ ] **E2.2 — RWT-6** Tab refresh mid-stream (3 hrs)
- [ ] **E2.3 — RWT-7** Browser back button after pin click (2 hrs)
- [ ] **E2.4 — RWT-8** Anon → authed transition preserves conversation (3 hrs)
- [ ] **E2.5 — RWT-9** Sign out resets observability identity (2 hrs)
- [ ] **E2.6 — RWT-10** Two-tab session sync (3 hrs)

**E3 — Performance + perception under stress** (chromium + 4g-latam profiles)
- [ ] **E3.1 — RWT-11** Slow 3G first-paint (3 hrs)
- [ ] **E3.2 — RWT-12** Time-to-first-pin on slow 4G with `ttfp_ms` reported to PostHog (3 hrs)
- [ ] **E3.3 — RWT-13** Concurrent users + rate-limit observability (4 hrs, depends on B6)

**E4 — Mobile + iOS quirks** (mobile-safari + mobile-chrome)
- [ ] **E4.1 — RWT-14** iOS Safari 100vh + safe-area + 100dvh map drawer (3 hrs)
- [ ] **E4.2 — RWT-15** Touch-tap behavior — no stuck hover, ≥ 44 × 44 px (2 hrs)

**E5 — Accessibility** (`@axe-core/playwright` + keyboard sim)
- [ ] **E5.1 — RWT-16** Screen-reader navigation through chat (4 hrs)
- [ ] **E5.2 — RWT-17** Reduced-motion respect (2 hrs)

**E6 — Security + hostile inputs**
- [ ] **E6.1 — RWT-18** XSS payload in chat input (2 hrs)
- [ ] **E6.2 — RWT-19** SQL injection attempt in chat-context chips (2 hrs)
- [ ] **E6.3 — RWT-20** Anon user attempts admin endpoint (2 hrs, depends on B4)

**E7 — Geographic + network reality**
- [ ] **E7.1 — RWT-21** LATAM TTFB from São Paulo VPS — manual one-shot procedure (30 min user-side)
- [ ] **E7.2 — RWT-22** Lighthouse CI cold-cache real-user load (2 hrs)

**Phase E acceptance:**
- [ ] E0 batch PR merged (Playwright + network fixture + inbox + branch DB + factories + geo procedure)
- [ ] All 4 critical-path RWTs (E1.1–E1.4) green for **5 consecutive runs** on chromium + firefox + webkit + mobile-safari, on `wifi` AND `4g-latam`
- [ ] All edge-case RWTs (E2–E7) green on chromium with the relevant browser/network knob
- [ ] Failures auto-attach Playwright trace + screenshot + console + network HAR to the PR comment
- [ ] Perf RWTs (E3.2 RWT-12, E7.2 RWT-22) report measurements to PostHog `test_perf_*` events so prod regressions show up in real-data dashboards

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

## 🎯 Recommended sequencing (next 3-week sprint, real-user-test-driven)

**Week 1 — Foundation + critical money-path (Mon–Fri, ~28 hrs)**
- **Day 1**: ✅ **Phase A** (5 of 7 items shipped on commit `49855b8`). A7 + A8 = manual user-side actions to schedule.
- **Day 2**: **E0 — RWT infrastructure batch** (~10 hrs, 1 PR). Playwright matrix + network fixture + magic-link inbox + branch DB + factories + geo procedure. **Blocks all subsequent E-phase specs** so this lands first.
- **Day 3**: **E1.1 RWT-1** anon→authed handoff (3 hrs) + **E1.3 RWT-4** SEO→chat handoff (2 hrs) + **E1.2 RWT-3** Week 2 exit test (6 hrs ÷ 2 days). Critical-path RWTs that don't depend on B-phase.
- **Day 4**: Finish RWT-3 + start **B2 booking-create** (Stripe vs Wompi decision must be made now or pick Stripe-only as default).
- **Day 5**: Finish **B2** + start **B3 payment-webhook**.

**Week 2 — Money path + idempotency + security batch (~28 hrs)**
- **Day 1**: Finish **B3**. Then **E1.4 RWT-5** booking + idempotency on double-submit (4 hrs, depends on B2 + B3). Closes PRC-1 with end-to-end real-user proof.
- **Day 2**: **B4 RBAC + B5 CSP + B6 durable rate-limit + B7 Sentry release tag** (security batch, 1 PR, ~10 hrs combined — they share `_shared/` infra). Then **E6.3 RWT-20** anon-as-admin (2 hrs, depends on B4).
- **Day 3**: **B8 Showing-reminder cron** (3 hrs) + **E3.3 RWT-13** concurrent users + rate-limit (4 hrs, depends on B6).
- **Day 4–5**: **E2.2 RWT-6** refresh mid-stream + **E2.3 RWT-7** browser back + **E2.4 RWT-8** anon→authed conversation + **E2.5 RWT-9** signout identity + **E2.6 RWT-10** two-tab sync (~13 hrs total, edge-case batch in 1 PR).

**Week 3 — Mindtrip parity + remaining RWTs (~22 hrs)**
- **Day 1**: **C1 MapContext → zustand** (3 hrs) + **C3 useMarkerLayer** (2 hrs).
- **Day 2**: **C2 MapShell** (1 day) — unblocks C4 / C6 for next sprint.
- **Day 3**: **E3.1 RWT-11** Slow 3G first-paint (3 hrs) + **E3.2 RWT-12** time-to-first-pin (3 hrs).
- **Day 4**: **E4.1 RWT-14** iOS Safari quirks + **E4.2 RWT-15** touch-tap (~5 hrs combined).
- **Day 5**: **E5.1 RWT-16** screen-reader nav + **E5.2 RWT-17** reduced-motion + **E6.1 RWT-18** XSS + **E6.2 RWT-19** SQLi (~10 hrs, but each spec ≤ 4 hrs so multiple can ship).

**Backlog (post-week-3, parallel with D-phase)**:
- **D7 → E2.1** Email-in-new-tab fix + RWT (R7 + RWT-2 closure)
- **E7.1 RWT-21** LATAM TTFB manual + **E7.2 RWT-22** Lighthouse CI

**Why this ordering:**
1. **Phase A done first (compounding wins)** — already shipped.
2. **E0 RWT infrastructure (Day 2 W1)** — without this, every B-phase task ships with synthetic-only verification and cannot pass the new "production-ready" definition.
3. **Critical-path RWTs (E1.x) before B2/B3** where possible — RWT-1 / 3 / 4 don't depend on money path. Build the regression net before building the money path.
4. **B2 + B3 with RWT-5 attached** — the money-path edge functions ship with their idempotency real-user test in the same PR-pair, so the launch blocker (R1) closes with proof, not synthetic verification.
5. **Security batch (B4–B7) + RWT-20** — same lane. RWT-20 (anon-as-admin) verifies B4 closes R3 in real-user terms.
6. **Edge-case RWTs (E2.x)** ship as one batch in W2 once B-phase infra is settled — they share fixtures.
7. **Phase C in W3** runs after the regression net is live, so map refactors don't silently break critical flows.

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
- [ ] **CT-12 — Landlord V1 critical-path Playwright spec** — `e2e/landlord-v1-signup-to-listing.spec.ts` covering AccountTypeStep → email signup → /host/onboarding → (D7) host dashboard → (D5) listing-create → (D9) lead inbox. Lands incrementally as each V1 day ships. **Files**: new `e2e/landlord-v1-*.spec.ts` (one per critical path). **First milestone (D7):** signup → onboarding stub gate. ~2 hrs initial, +1 hr per V1 day.
- [ ] **CT-13 — Per-V1-day testing block** — every V1 day's PR must include: (a) Vitest unit test for any new component with non-trivial logic, (b) Claude Preview MCP browser verification (snapshot + click + screenshot in commit description), (c) PostHog event firing confirmed via `network` filter or `posthog._isIdentified()` eval, (d) for edge-fn changes, deno test added. Codified in `tasks/plan/06-landlord-v1-30day.md` §13. ~0 hrs (process), enforced via PR review.
- [x] **CT-14 — Skill: `vitest-component-testing`** **DONE 2026-04-29** — installed at `.claude/skills/vitest-component-testing/SKILL.md`. Codifies RTL + `vi.mock`-before-import + MemoryRouter + JSDOM polyfills (already in `src/test/setup.ts`) + 7 reference test files from D2-D5. Source: skills.sh `test-driven-development`, adapted.
- [x] **CT-15 — Skill: `claude-preview-browser-testing`** **DONE 2026-04-29** — installed at `.claude/skills/claude-preview-browser-testing/SKILL.md`. 5-step browser proof flow: `preview_start` → navigate + auth-gate verify → sign in as `qa-landlord@mdeai.co` (uses migration `20260501000000`) → drive UI + assert state → screenshot + DB write proof + cleanup. Includes the GoTrue empty-string-vs-NULL gotcha. Source: skills.sh `playwright-best-practices`, adapted.
- [x] **CT-16 — Skill: `mdeai-project-gates`** **DONE 2026-04-29** — installed at `.claude/skills/mdeai-project-gates/SKILL.md`. 7 gates: lint (444 baseline), test (86/86), build, check:bundle, verify:edge, browser proof, get_advisors. Source: skills.sh `verification-before-completion`, adapted.
- [x] **CT-17 — Skill: `systematic-debugging`** **DONE 2026-04-29** — installed at `.claude/skills/systematic-debugging/SKILL.md`. Hypothesis-then-evidence 5-step loop with 4 mdeai.co bug case studies (D3 Rules-of-Hooks, D4 FK indexes, D4 clearDraft race, D5 GoTrue defaults). Source: skills.sh.
- [x] **CT-18 — Skill: `better-auth-best-practices`** **DONE 2026-04-29** — installed at `.claude/skills/better-auth-best-practices/SKILL.md`. 7 rules: `user_metadata` vs `app_metadata`, GoTrue defaults, UPDATE-needs-SELECT, `(SELECT auth.uid())`, signed tokens, JWT post-delete, service-role-never-VITE. Source: skills.sh.
- [x] **CT-19 — Skill: `real-estate-tech`** **DONE 2026-04-29** — installed at `.claude/skills/real-estate-tech/SKILL.md`. V2+ ramp for MLS/RETS/RESO ingestion, dedup, PostGIS clustering, AVM. NOT for V1 use. Source: rohitg00/awesome-claude-code-toolkit.

### Per-V1-day testing pattern (codified in plan §13)

For every day D2-D30, the PR closing the day MUST include all four:

| # | Test type | Target | Tool | Skill | Required when |
|---|---|---|---|---|---|
| 1 | **Unit (Vitest)** | Pure logic, callbacks, type safety | `vitest run src/**/*.test.{ts,tsx}` | `vitest-component-testing` *(GAP — CT-14)* | Any new component with non-trivial logic OR any new lib file |
| 2 | **Browser preview** | UI rendering, interaction, route transitions, console clean | Claude Preview MCP (`preview_snapshot` + `preview_click` + `preview_screenshot`) | `claude-preview-browser-testing` *(GAP — CT-15)* | Any UI change |
| 3 | **PostHog event check** | Event fires once with the right payload | `preview_eval` of `(window).posthog?._isIdentified()` + network filter for `i.posthog.com` | `vercel-react-best-practices` (analytics patterns) | Any new event arm |
| 4 | **Edge fn deno test** | Auth gate + Zod validation + happy path | `npm run verify:edge` | `supabase-edge-functions` (.claude / .agents) | Any `supabase/functions/` change |
| 5 | **Project gates** | lint / build / bundle within budget | `npm run lint && npm run test && npm run build && npm run check:bundle` | `mdeai-project-gates` *(GAP — CT-16)* | Every PR |

The first V1 day to fully follow this is **D2** — see `src/components/auth/AccountTypeStep.test.tsx` (4 vitest tests) + browser screenshots in the D2 PR.

### Skills atlas (linked from plan §5.0)

For per-task-type skill mapping (DB / edge fn / React component / form / telemetry / docs / commit), see `tasks/plan/06-landlord-v1-30day.md` §5.0. Key principle: **load the skill BEFORE writing code for that task type**. Skipping skills was the source of multiple bugs already shipped (D3 Rules-of-Hooks, D4 missing FK indexes, D5 GoTrue auth-row schema mismatch) — every one was covered by an existing skill we didn't load.

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

#### Landlord V1 (added 2026-04-29 — sequenced with V1 build days)

- [ ] **RWT-23 — Landlord signup → onboarding stub** (V1 D2 critical path)
  - **Journey**: Anon user lands on `/signup`. Picks "I'm a landlord or agent." Submits email + password. Confirms via magic link in test inbox. Lands on `/host/onboarding`.
  - **Reality knobs**: chromium + mobile-chrome (Pixel 7), wifi profile, fresh Supabase test user.
  - **Pass criteria**: `landlord_signup_started` PostHog event fires once. `auth.users.raw_user_meta_data.account_type === 'landlord'` after confirm. `/host/onboarding` renders without redirecting away. `landlord_signup_completed` event fires once with `method: 'email'`. NO `landlord_inbox` row created (that's D8). NO `landlord_profiles` row created (that's D3).
  - **Files**: `e2e/rwt-23-landlord-signup.spec.ts`. ~3 hrs (depends on test inbox = RWT infra item 3).
- [ ] **RWT-24 — Renter signup unchanged after AccountTypeStep** (V1 D2 regression guard)
  - **Journey**: Anon user lands on `/signup`. Picks "I'm looking for a place." Submits email + password. Confirms via magic link. Lands on `/`.
  - **Pass criteria**: Renter signup still works exactly as it did pre-V1. No `landlord_*` PostHog events fire. `account_type === 'renter'`. Existing `pendingFiredRef` prompt-handoff flow still works if `?returnTo=/chat?send=pending` was on the URL.
  - **Files**: `e2e/rwt-24-renter-signup-unchanged.spec.ts`. ~2 hrs.
- [ ] **RWT-25 — Landlord OAuth signup via Google** (V1 D2 OAuth path)
  - **Journey**: Anon user picks "landlord" → "Continue with Google" → completes Google OAuth → lands on `/host/onboarding`.
  - **Reality knobs**: Stubbed Google OAuth (Supabase test mode); chromium.
  - **Pass criteria**: `redirectTo` URL passed to Google contains `/host/onboarding`. Post-redirect URL pathname is `/host/onboarding`. `account_type` metadata set on first sign-in.
  - **Files**: `e2e/rwt-25-landlord-oauth.spec.ts`. ~3 hrs.
- [ ] **RWT-26 — Landlord lists apartment, renter chats, lead lands in inbox** (V1 D8-D10 end-to-end, the loop)
  - **Journey**: Two browser contexts. Context A = landlord (signs up D2 flow, completes onboarding D3, creates listing D5). Context B = renter (anon, opens `/apartments/<new-listing-id>`, asks "Is this still available?"). Landlord reloads `/host/leads` → sees the new lead.
  - **Pass criteria**: One `landlord_inbox` row, status='new', `apartment_id` matches, `landlord_id` matches A's profile, `raw_message` contains the renter's text. PostHog event chain: `listing_published` → renter `inquiry_sent` → landlord `lead_card_clicked` → landlord `whatsapp_reply_clicked` (if they click the WA button).
  - **Files**: `e2e/rwt-26-end-to-end-loop.spec.ts`. ~6 hrs (depends on D5+D8+D9+D10).
- [ ] **RWT-27 — RLS gate: landlord A cannot see landlord B's leads** (V1 D8 security)
  - **Journey**: Two landlords + two listings. Landlord A queries `landlord_inbox` via the supabase-js client with their own JWT. Should return only A's rows.
  - **Pass criteria**: Zero rows from B's listings; `acting_landlord_ids()` correctly scopes; service-role bypass still works for the trigger.
  - **Files**: `e2e/rwt-27-rls-isolation.spec.ts` + supabase test fixtures. ~3 hrs.

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

## WIP 2026-05-01 — Landlord V1 D5 (listing-create edge fn) — uncommitted on disk

Local-only work present but not yet committed/applied/deployed/verified. Land in this order on the next D5 commit.

**Already drafted on disk** (review before commit):
- [x] `supabase/functions/listing-create/auto-moderation.ts` — pure module, 5 rules from plan §3.1 (photos ≥ 5, Medellín bbox, contact-info regex, COP/USD price range, description ≥ 80 chars)
- [x] `supabase/functions/listing-create/index.ts` — edge fn: CORS → auth (verify_jwt + getUserId) → durable rate-limit (10/hr/user) → Zod payload → landlord_profiles ownership check → auto-mod → service-role apartments INSERT. `rejected` returns 422 + reasons; `auto_approved` → `moderation_status='approved'`; `needs_review` → `'pending'` (still goes live optimistically per plan).
- [x] `supabase/functions/tests/listing_create_auto_moderation_test.ts` — 12 deno tests (clean / single / double / price / metro / phone / email / short-desc / boundary cases for `isInMedellinMetro` + `containsContactInfo`)
- [x] `supabase/migrations/20260501000000_landlord_v1_qa_user_seed.sql` — qa-landlord@mdeai.co with email_confirmed_at + auth.identities + landlord_profiles row, password `Qa-Landlord-V1-2026`, idempotent. **D5 enhancement A** from `tasks/plan/07.md`.

**Still missing for D5 to ship**:
- [ ] **Register `listing-create` in `supabase/config.toml`** with `verify_jwt = true` (currently absent from the 9-function block)
- [ ] **Apply the qa-user seed migration** (`mcp execute_sql` against project `zkwcbyxiwklihegjhuql` + register to schema_migrations)
- [ ] **Deploy `listing-create` edge fn** (`mcp deploy_edge_function`)
- [ ] **`Step4Description.tsx`** — title (8-100) + description (80-4000) react-hook-form + Zod, with live char counter + plan-§3.1 rule hints (photos ≥ 5, no contact info, etc.)
- [ ] **`useListingCreate.ts`** — TanStack mutation wrapping the edge fn POST + fold into the wizard's submit handler. On success: `clearDraft()` + nav to `/dashboard?listing=<id>` (D7 will surface it). On `AUTO_REJECTED` (422): show reasons + keep draft.
- [ ] **Wire Step4 into `ListingNew.tsx`** — replaces the D4 D5-placeholder block; stepper progresses 4 → done
- [ ] **Vitest** — Step4Description (Zod boundaries + counter) + useListingCreate (success / 422 reject / 401 / 403 onboarding gate) + a wizard integration test
- [ ] **Browser proof via Claude Preview MCP** — sign in as qa-landlord@mdeai.co (now possible without burning the email rate limit), step through wizard 1→4, submit, verify `apartments` row + `moderation_status` via SQL, screenshot in PR
- [ ] **2 new PostHog event arms** — `listing_published` (`apartmentId`, `autoModerated: bool`, `verdict`) + extend `listing_create_step` to include step 4. (Events 8 + 9 of 12 V1 taxonomy)
- [ ] **Gates** — `npm run lint` 0 new · `npm run test` (target ~95+) · `npm run verify:edge` (target ~23 deno tests with the new 12) · `npm run build` · `npm run check:bundle` 10/10 within budget
- [ ] **Commit** `feat(host): listing-create edge fn + auto-moderation (D5)` + audit pass per the D3/D4 pattern

**D5 enhancements B-F from `tasks/plan/07.md`** — sequence after the must-have lands:
- [ ] **B** — drag-and-drop photo upload via `@dnd-kit` (1 hr)
- [ ] **C** — client-side image resize (`canvas.toBlob` 1920px max, 0.85 JPEG) (1.5 hr)
- [ ] **D** — debounce sessionStorage writes in `useListingDraft` (300 ms) (15 min)
- [ ] **E** — CT-12 Playwright spec `e2e/landlord-v1-create-listing.spec.ts` (4 hr; depends on A which now exists)
- [ ] **F** — CT-1 pre-commit gate `scripts/gate-pr.sh` (lint + test + check:bundle) wired into `pre-push` (30 min)

**Hidden risk to address pre-D22**: bump Supabase project's `MAILER_RATE_LIMIT_BURST` (or move email confirmations to Resend magic-links) before founder onboards 20 landlords in a day. Dashboard-only setting; document in D11 email-template PR.

---

## DONE 2026-04-30 evening — Landlord V1 D4 audit follow-up

Post-D4 schema audit via `information_schema.table_constraints`. Two FK columns from D1 had no covering index, violating the existing "schema-foreign-key-indexes" convention.

- [x] **Migration `20260430130000_landlord_v1_fk_indexes.sql`** — partial indexes on `landlord_inbox_events.actor_user_id WHERE actor_user_id IS NOT NULL` + `verification_requests.reviewed_by WHERE reviewed_by IS NOT NULL`. Both confirmed live in `pg_indexes`. Applied via `execute_sql` + registered to `supabase_migrations.schema_migrations`.
- [x] **Audit pass clean elsewhere** — zero `TODO/FIXME/XXX`, zero `console.log`, zero `any` casts, throws limited to mutation guards (correct pattern).
- [x] **Commit `3111cb9`** pushed to origin.

### D5 enhancement candidates (came out of the audit — sequence for D5+)

| # | Enhancement | Why | Effort |
|---|---|---|---|
| **A** | **Seed permanent `qa-landlord@mdeai.co` test user** via one-off migration with email_confirmed + landlord_profile pre-set. NOT in seed.sql (avoid prod accidents). | Today's D4 live walkthrough was deferred — Supabase project hit the per-hour email-signup rate limit. Same wall blocks CT-12 Playwright spec. | 30 min |
| **B** | **Drag-and-drop photo upload** (use existing `@dnd-kit` deps) | Better UX, especially mobile. Matches D7 dashboard sortable-card pattern. | 1 hr |
| **C** | **Client-side image resize** before upload (`canvas.toBlob` at 1920px max width, 0.85 JPEG) | Drops phone-photo upload size 60-80%; users hit 5 MB ceiling far less often. | 1.5 hr |
| **D** | **Debounce sessionStorage writes** in `useListingDraft` (300ms) | Currently writes on every keystroke; debounce keeps DevTools quiet + storage events bounded. | 15 min |
| **E** | **CT-12 Playwright spec** — `e2e/landlord-v1-create-listing.spec.ts` (signup → onboarding → listing 1→4 → submit → moderation → visible on /apartments). Depends on enhancement A. | Per plan §13 + tasks/todo.md CT-12. The actual end-to-end automated proof. | 4 hr |
| **F** | **CT-1 pre-commit gate script** — `scripts/gate-pr.sh` runs lint + test + check:bundle. Wire into git pre-push hook. | Prevents the "I forgot to run check:bundle" failure. ~30 min. | 30 min |

### Hidden risk worth flagging (not yet ticketed)

- **Supabase email-signup rate limit (4/hr default)** blocked our live D4 walkthrough this session and will block the founder if they manually onboard 20 landlords in a single day during D22-D30. **Recommendation:** during D5, bump the project's `MAILER_RATE_LIMIT_BURST` setting (or move to magic-link via Resend if confirmation emails dominate the budget). Requires Supabase dashboard access; can include in D5 docs but the actual setting change is user-side.
- **FK-index drift** as a class of bug: today's audit caught 2 missing indexes that were only spotted via a `SELECT … FROM information_schema.table_constraints` query. **Recommendation:** add `npm run check:schema` (separate from `check:bundle`) that runs the same FK-coverage query and fails on any uncovered FK. ~30 min.

---

## DONE 2026-04-30 — Landlord V1 D4: listing wizard steps 1-3 + bundle-size budget gate

Per `tasks/plan/06-landlord-v1-30day.md` §5.1 D4.

- [x] **`listing-photos` PUBLIC Storage bucket** — 5 MB / image, JPEG/PNG/WebP. Path convention `<auth.uid()>/<draftId>/<filename>`. Bucket public so anon renters can `<img src>` listing photos without signed URLs.
- [x] **5 Storage RLS policies** — `listing_photos_insert_own` (folder-scoped to auth.uid), `_select_public` (anon SELECT), `_update_own` / `_delete_own` (folder-scoped), `_service_role`. Verified via SQL `count(*)` and a real anon-upload attempt that returned HTTP 403.
- [x] **Migration `20260430120000_landlord_v1_listing_photos_bucket.sql`** registered to schema_migrations.
- [x] **`lib/storage/upload-listing-photo.ts`** — typed helper with `LISTING_PHOTO_MAX_BYTES` + `LISTING_PHOTO_ACCEPTED_TYPES` constants, named error classes (`ListingPhotoTooLargeError` / `ListingPhotoUnsupportedTypeError`), public-URL resolution, 1-year Cache-Control header (URLs are stable via timestamp suffix), best-effort `removeListingPhoto` for orphan cleanup.
- [x] **`useListingDraft` hook** — wizard form state + sessionStorage persistence keyed by per-mount UUID draftId. `clearDraft` correctly wipes both state + storage via a `skipNextPersistRef` pattern (CAUGHT + FIXED in this PR's test cycle — initial impl had a re-write bug).
- [x] **`Step1Address.tsx`** — Google Places Autocomplete (CO biased), maps-auth-failure aware (falls back to free-form input). Auto-fills neighborhood + city + lat/lng from picked place via address_components.
- [x] **`Step2Specs.tsx`** — 4 visual blocks: bedroom/bath number steppers w/ bounds, size + price + currency, furnished switch + min stay, 10-amenity + 8-building-amenity chip groups.
- [x] **`Step3Photos.tsx`** — multi-file upload, sequential (no race vs file_size_limit), 5+ photo minimum (matches D5 auto-mod threshold), cover-image badge, click-to-promote any photo to cover, remove-with-storage-cleanup.
- [x] **`pages/host/ListingNew.tsx`** — wizard state machine. 4-step stepper. Back navigation. D5 placeholder for Step 4. Auth gate: anon → /login; renter → /dashboard; landlord without onboarding profile → /host/onboarding (must finish D3 first); landlord → wizard.
- [x] **`/host/listings/new` route** registered in App.tsx with lazy chunk.
- [x] **2 new PostHog events** — `listing_create_step` (step + durationSec) + `listing_photo_uploaded` (sizeBytes + totalCount). Total V1 events: 7 of 12 from plan §7.2.
- [x] **21 new Vitest tests** (61 → 83 total). Step1Address: 5 (renders + validation + onSubmit). Step2Specs: 7 (steppers, amenity toggles, price gating). useListingDraft: 5 (uuid stability, patch + persist + clear). upload-listing-photo: 5 (size + MIME guards). Caught + fixed real bug in clearDraft (re-write race) and a test-import bug (real supabase client init unhandled rejection in JSDOM).
- [x] **Browser proofs** via Claude Preview MCP (against live Supabase project zkwcbyxiwklihegjhuql):
  1. Anon `/host/listings/new` → `/login?returnTo=%2Fhost%2Flistings%2Fnew` ✓ (screenshot in PR)
  2. SQL state of bucket + 5 policies confirmed ✓
  3. RLS proof: anon `supabase.storage.from('listing-photos').upload(...)` returned 403 "new row violates row-level security policy" ✓
  4. Live wizard render walkthrough — DEFERRED this session due to Supabase email-signup rate limit (4/hour cap; we hit it creating the D3 test user). Same wizard internals exercised by the 21 unit tests; D5 will revisit with a stable test landlord.
- [x] **CT-2 SHIPPED** — `scripts/check-bundle-size.mjs` + `npm run check:bundle`. 10 entry-relevant chunks tracked with explicit gzip budgets: index (100 KB ceiling), radix (100), posthog (70), supabase (60), gadget (60), sentry (35), forms (30), dates (25), icons (20), tanstack (20). Today's report: 10/10 within budget; entry chunk at 92.96 KB / 100 KB.
- [x] **Gates green** — `npm run lint` exit 0 (zero new issues; 444 pre-existing) · `npm run test` 83/83 (14 files) · `npm run build` 4.33s · `npm run check:bundle` 10/10 within budget · entry chunk gzip 92.96 KB.

**Next: D5 (listing creation finale).** Per §5.1: build `Step4Description` (title + description text inputs with Zod), `listing-create` edge function (Zod-validated INSERT into apartments via service role with auto-moderation rules from §3.1: `photos.length >= 5` / lat-lng inside Medellín metro / no contact info in description / price within range / description >= 80 chars). On `auto_approved` set `moderation_status='approved'` + `status='active'`; on `needs_review` keep pending + email founder; on `rejected` return reasons array. Commit message: `feat(host): listing-create + auto-moderation`.

---

## DONE 2026-04-29 night — Landlord V1 D3: onboarding 3-step wizard

Per `tasks/plan/06-landlord-v1-30day.md` §5.1 D3.

- [x] **`identity-docs` Storage bucket** — private, 10 MB limit, JPEG/PNG/WebP/PDF only. Path convention `<auth.uid()>/<filename>`. Migration `20260430000000_landlord_v1_identity_docs_bucket.sql` registered.
- [x] **5 Storage RLS policies** — `identity_docs_insert_own` / `_select_own` / `_update_own` / `_delete_own` / `_service_role`. Landlord gated to own folder via `storage.foldername(name)[1] = auth.uid()::text`. Admin reads all.
- [x] **`useLandlordOnboarding.ts` hook** — `useOwnLandlordProfile` (RLS-gated SELECT), `useSubmitStep1Basics` (UPSERT on user_id), `useSubmitVerification` (storage upload + verification_requests INSERT, with orphan-cleanup on DB error).
- [x] **`Step1Basics.tsx`** — react-hook-form + zod schema; display_name + kind radios + WhatsApp E.164 regex + neighborhood Select. 11 curated Medellín neighborhoods.
- [x] **`Step2Verification.tsx`** — doc_kind Select (5 types) + drag-n-drop file picker with 10 MB + MIME validation + "Skip for now" + "Submit & continue".
- [x] **`Step3Welcome.tsx`** — first-name greeting, Profile + Verification status cards, CTAs to `/host/listings/new` + `/dashboard`, founder WhatsApp.
- [x] **`pages/host/Onboarding.tsx`** — wizard state machine. Stepper with progress bars. Per-step `durationSec` PostHog timer. Back button. "Finish later" escape hatch. Re-entry: existing `landlord_profiles` row pre-fills Step 1.
- [x] **3 PostHog events** — `onboarding_step_completed` (step + durationSec), `onboarding_completed` (totalDurationSec), `verification_doc_uploaded` (docKind). Plan §7.2 events 3-5 of 12.
- [x] **13 Vitest unit tests** added (48 → 61 total). Step1Basics: 6 (validation + onSubmit contract). Step2Verification: 5 (file-size + MIME guards real File objects). Step3Welcome: 5 (greeting + CTA hrefs).
- [x] **`src/test/setup.ts` extended** — ResizeObserver polyfill + scrollIntoView/pointer-capture mocks so Radix Select renders in JSDOM.
- [x] **Browser verification end-to-end** via Claude Preview MCP against live Supabase:
  1. Anon `/host/onboarding` → `/login?returnTo=%2Fhost%2Fonboarding` ✓
  2. Test landlord user (account_type='landlord' in user_metadata) signed in via supabase-js ✓
  3. Wizard renders Step 1 with stepper ("1. Your basics" current, 2 + 3 upcoming) ✓
  4. Form filled (display_name=`D3 Test Landlord`, whatsapp=`+573001112233`) → Continue ✓
  5. `landlord_profiles` row created via RLS — confirmed via direct SQL query (id=`da688800-…`, user_id matches authed user, all columns correct) ✓
  6. Step 2 advances with stepper showing 1=complete, 2=current, 3=upcoming ✓
  7. "Skip for now" → Step 3 "Welcome aboard, D3." with both CTAs (`/host/listings/new` + `/dashboard`) rendered ✓
  8. File upload happy path: Storage upload to `identity-docs/<user_id>/national_id_<stamp>_test-id.pdf` + verification_requests INSERT (status=`pending`) — both confirmed via SQL `count(*)` joins ✓
  9. Test user + landlord_profile + verification + storage object all cleaned up; 0 leftover D3 test data in live DB ✓
- [x] **2 React bugs caught + fixed in-session via the browser verify cycle:**
  - Rules-of-Hooks violation (`useRef` after early returns) → moved all hooks above conditional returns
  - ResizeObserver missing in JSDOM blocked Radix Select rendering → polyfilled in `src/test/setup.ts`
- [x] **Gates green** — `npm run lint` exit 0 (zero new issues; 444 pre-existing) · `npm run test` 61/61 · `npm run build` 4.64s · entry chunk gzip 94.99 KB (under 100 KB budget).

**Next: D4 (listing form steps 1-3).** Per §5.1: build `Step1Address` (Google Places autocomplete) + `Step2Specs` (bedrooms/baths/price/amenities) + `Step3Photos` (multi-image upload to `listing-photos` bucket) + `lib/storage/upload-listing-photo.ts`. Commit message: `feat(host): listing form steps 1-3`.

---

## DONE 2026-04-29 evening — Landlord V1 D2: signup branch + per-day testing block

Per `tasks/plan/06-landlord-v1-30day.md` §5.1 D2.

- [x] **`AccountTypeStep.tsx` shipped** — full-screen radiogroup at the top of `/signup`. Two options: "I'm looking for a place" (renter) and "I'm a landlord or agent" (landlord, with Founding-Beta blurb). 220px min-height tap targets, focus-ring, brand-aligned, `data-account-type` selectors for tests, BrandLogo header.
- [x] **`Signup.tsx` two-step flow** — AccountTypeStep renders first, then the existing email/Google form gated behind it. Form headlines + hero blurb adapt to the chosen type. "Change account type" back button replaces "Back to home" after selection.
- [x] **`useAuth.tsx` extended** — `signUp(email, password, { accountType })` + `signInWithGoogle(redirectTo, { accountType })` both accept the new option. Landlords get `emailRedirectTo: /host/onboarding`; renters get `/`. `account_type` persisted to `auth.users.raw_user_meta_data` so it survives email confirmation + OAuth round-trips. Exported `AccountType` type.
- [x] **`/host/onboarding` stub page + route** — anon → `/login?returnTo=/host/onboarding`, renter → `/dashboard`, landlord → welcome screen with founder WhatsApp + "Go to dashboard" / "See live listings" CTAs. D3 fleshes out the wizard.
- [x] **PostHog events added** — `landlord_signup_started` (`from`) + `landlord_signup_completed` (`method: 'email' \| 'google'`). First 2 of the 12 V1 events from plan §7.2.
- [x] **Vitest unit tests** — 4 new tests in `src/components/auth/AccountTypeStep.test.tsx`: both options render as radios, each click fires onSelect with the correct literal, no auto-fire on mount. Total Vitest count: 44 → 48.
- [x] **Browser verification via Claude Preview MCP** — 4 flows snapshotted/clicked/screenshotted:
  1. `/signup` shows AccountTypeStep with both radios
  2. Click landlord → form with "LANDLORD / AGENT" badge + landlord copy
  3. Click renter → form with "Renter" badge + original copy
  4. `/host/onboarding` (anon) → redirects to `/login?returnTo=%2Fhost%2Fonboarding`
  All states: console clean (no errors).
- [x] **Per-day testing block codified** as plan §13 — every V1 day D2-D30 PR must include (1) Vitest unit tests for non-trivial logic, (2) Claude Preview MCP browser verification with screenshot in PR description, (3) PostHog event smoke test, (4) deno test for any edge fn change. D2 met all four.
- [x] **RWT scenarios added** for landlord V1 — RWT-23 (landlord signup happy path), RWT-24 (renter signup regression), RWT-25 (landlord OAuth Google), RWT-26 (end-to-end renter→landlord inbox loop), RWT-27 (RLS isolation between landlords). Each Playwright spec sequenced with the V1 day that ships its underlying flow.
- [x] **CT items added** — CT-12 (landlord critical-path Playwright specs, ~2 hrs initial + 1 hr per V1 day) + CT-13 (per-V1-day testing block, ~0 hrs process).
- [x] **Gates green** — `npm run lint` exit 0 · `npm run test` 48/48 · `npm run verify:edge` 11/11 · `npm run build` succeeds.

**Verification artifacts (live on dev server during this session):**
- AccountTypeStep snapshot: 2 radios with full a11y tree
- Landlord branch screenshot: badge + headline + form + Google button rendered correctly
- Renter branch eval: badge="Renter", headline="Create your account" (unchanged)
- /host/onboarding anon eval: pathname=/login, search=?returnTo=%2Fhost%2Fonboarding

**Next: D3 (onboarding 3-step wizard).** Per §5.1: build `pages/host/Onboarding.tsx` (replace D2 stub), `Step1Basics.tsx` / `Step2Verification.tsx` / `Step3Welcome.tsx`, and `landlord-onboarding-step` + `verification-submit` edge functions. Commit message: `feat(host): onboarding wizard`.

---

## DONE 2026-04-29 — Landlord V1 D1: schema migration + plan refinements

Per `tasks/plan/06-landlord-v1-30day.md` §5.1 D1.

- [x] **Migration `20260429000000_landlord_v1.sql` applied** to hosted Supabase via MCP `apply_migration`. 5 new tables (`landlord_profiles`, `landlord_inbox`, `landlord_inbox_events`, `verification_requests`, `analytics_events_daily`), 1 view (`landlord_profiles_public`, security_invoker), 4 `apartments` columns (`landlord_id` FK, `moderation_status`, `rejection_reason`, `source`), 14 RLS policies, 2 functions (`acting_landlord_ids()`, `auto_create_landlord_inbox_from_message()`), 3 triggers.
- [x] **43 seed apartments backfilled** — `moderation_status='approved'`, `source='seed'`. Renter-side queries unchanged (still filter `status='active'`).
- [x] **Existing P1-CRM `leads` table preserved** — 6 rows + FKs from `showings` (4) and `rental_applications` (4) untouched. V1 uses `landlord_inbox` instead (Option C).
- [x] **Trigger SQL fixed** — plan §2.8 referenced `NEW.body` / `NEW.user_id` / `NEW.metadata` (don't exist on `messages`). Live trigger uses `NEW.content`, JOINs `conversations.user_id`, reads `session_data->>'apartment_id'`. SECURITY DEFINER + search_path locked.
- [x] **`database.types.ts` regenerated** — 3940 → 4326 lines via `supabase gen types typescript --linked --schema public`. 24 references to new landlord tables.
- [x] **Plan doc patched** — §2.3, §2.4, §2.7, §2.8 renamed to `landlord_inbox`/`landlord_inbox_events` with rationale callout. §5.1 D1 row updated.
- [x] **Plan refinements landed** (external review feedback):
  - §1 reframed "free for everyone" → "Founding Beta, free for first 100 landlords permanently"
  - §1 + §8.1 D30 targets split into Acceptable / Stretch bands (kill criteria unchanged)
  - §7.1 daily scorecard reorders quality-first (reply rate + time-to-reply + active landlords) above count metrics; adds weekly renter-demand health check
  - §9.1 routine notes founder time shifts to outreach once D11 email automation lands
  - §9.4 verification swaps naked magic-link for signed JWT (24h expiry, single-use)
- [x] **Gates green** — `npm run lint` exit 0 · `npm run test` 44/44 · `npm run verify:edge` 11/11 · `npm run build` succeeds in 4.04s.

**Verification queries (live on hosted Supabase):**
- 5 new tables exist · 1 view exists · 4 apartment columns added · 43 apartments backfilled · 2 functions registered · 3 triggers active · 14 policies installed · 6 existing leads rows untouched.

**Next: D2 (signup branch).** Per §5.1: extend `src/pages/Signup.tsx` with `AccountTypeStep` ("renter" or "landlord"), add post-signup redirect logic to `useAuth.tsx`, add `landlord_signup_started` PostHog event. Commit message: `feat(auth): landlord account-type toggle`.

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
