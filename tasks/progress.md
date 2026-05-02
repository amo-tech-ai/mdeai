# Progress Task Tracker — mdeai.co

> Last updated: 2026-04-05 (edge + rentals polish)
> Phase: CORE (Weeks 1-8)
> Overall: ~49% complete (security session + edge CORS/Deno.serve + rentals API + P1 idempotency fix)
>
> **Two views:** **§1–14** = epic-aligned (E1–E10, wireframes, security audit). **§15** = cross-area tracker (Supabase vs frontend vs commerce vs agents vs CI), copied from [`tasks/notes/progress-tracker.md`](notes/progress-tracker.md) — keep both in sync when material changes.

## Status Legend

| Symbol | Meaning |
|--------|---------|
| 🟢 | Done — verified working |
| 🟡 | In Progress / Partial |
| 🔴 | Missing / Not Started |
| 🟥 | CRITICAL — Blocking or Security Issue |
| ⚫ | N/A / Later Phase |

---

## 1. Data Foundation (E1) — 55%

| # | Item | Status | % | Confirmed | Missing/Failing | Next Action | Skill | Wireframe |
|---|------|--------|---|-----------|----------------|-------------|-------|-----------|
| 1 | Database schema (28 + 6 P1 tables) | 🟢 | 100 | Core + P1 migrations applied on linked DB; RLS on P1; PostGIS | pgvector optional (E1-007) | — | `supabase-edge-functions` | — |
| 2 | Seed data | 🟡 | 60 | `supabase/seed.sql` + `[db.seed]`; remote loaded via `db query --linked` | Restaurants, cars, events still unseeded; not 50+ apartments | Extend seed for verticals + scale | `real-estate` | — |
| 3 | Apartment fixtures (50+) | 🟡 | 55 | 28 apartments in seed (USD, Medellín barrios) | Need 22+ more to hit 50+ target | Add rows or second seed file | `real-estate` | `01-rental-search` |
| 4 | Restaurant fixtures | 🔴 | 0 | Schema ready | No seed rows | Add to seed or migration | `real-estate` | — |
| 5 | Car rental fixtures | 🔴 | 0 | Schema ready | No seed rows | Add to seed or migration | — | — |
| 6 | Event fixtures | 🔴 | 0 | Schema ready | No seed rows | Add to seed or migration | — | — |
| 7 | pgvector embeddings | 🔴 | 0 | Extension may vary by env | No embeddings generated | E1-007 migration + backfill | — | — |
| 8 | RLS policies audit | 🟡 | 75 | P1 policies in migrations | Full policy review vs prod | Audit each policy | `supabase-edge-functions` | — |

## 2. Lead-to-Lease Pipeline (E2) — 43%

| # | Item | Status | % | Confirmed | Missing/Failing | Next Action | Skill | Wireframe |
|---|------|--------|---|-----------|----------------|-------------|-------|-----------|
| 1 | lead-capture edge function | 🟡 | 68 | `p1-crm`: `create_lead`, `record_payment`, `schedule_showing`, `create_rental_application` (JWT + Zod + rate limit); typed client `p1-crm-api`; CTAs + `/dashboard/rentals`; **apartment detail dialogs rotate idempotency key per open** (fixes silent no-op on 2nd tour/application) | Optional split into dedicated edge fns; hosted smoke **10C** open | Run deploy smoke; consider split | `supabase-edge-functions` | — |
| 2 | showing-create edge function | 🔴 | 0 | — | Not a separate deployable fn; showings exist in DB | Build edge or RPC + RLS | `supabase-edge-functions` | `05-showing-scheduler` |
| 3 | Pipeline tables (leads, showings, applications) | 🟢 | 100 | `leads`, `showings`, `rental_applications`, `property_verifications`, `payments`, `neighborhoods` + seed rows | — | Forward migrations only | `real-estate` | — |
| 4 | Status machine (lead → showing → application → lease) | 🔴 | 0 | — | No state machine | Design + implement | `real-estate` | `06-application-flow` |
| 5 | Notification triggers | 🔴 | 0 | notifications table exists | No triggers wired | Wire after pipeline | — | — |

## 3. Security Hardening (E3) — 58% 🟡

| # | Item | Status | % | Confirmed | Missing/Failing | Next Action | Skill | Wireframe |
|---|------|--------|---|-----------|----------------|-------------|-------|-----------|
| 1 | Edge function JWT verification | 🟢 | 100 | All 10 functions now `verify_jwt = true` in config.toml (2026-04-05) | — | Deploy config to hosted | `supabase-edge-functions` | — |
| 2 | CORS lockdown | 🟢 | 100 | `_shared/http.ts` + **all** browser-invoked functions use `getCorsHeaders(req)` on OPTIONS (204) and JSON/SSE responses (2026-04-05) | — | Re-verify after new functions added | `supabase-edge-functions` | — |
| 3 | Input validation (Zod) | 🟡 | 70 | Most functions have Zod schemas (ai-chat, ai-router, ai-search, ai-trip-planner, p1-crm, rentals, ai-optimize-route) | ai-suggest-collections, google-directions, rules-engine thin | Add schemas to remaining 3 | `supabase-edge-functions` | — |
| 4 | Rate limiting | 🟡 | 60 | In-memory sliding window in all user-facing functions | Not durable (resets on cold start); acceptable with verify_jwt | Consider Upstash Redis for Phase 2 | `supabase-edge-functions` | — |
| 5 | Service role key leaks | 🟡 | 50 | Shared `_shared/supabase-clients.ts` created with `getUserClient`/`getServiceClient` pattern; applied to ai-search + ai-router (2026-04-05) | ai-chat + ai-trip-planner still use old pattern | Apply shared helpers to remaining 2 | `supabase-edge-functions` | — |
| 6 | Admin auth guard | 🔴 | 10 | useAdminAuth hook exists, queries user_roles table | No server-side enforcement in edge functions | Add role check in admin edges | — | `09-admin-listings` |
| 7 | Token tracking in ai_runs | 🟡 | 45 | ai_runs table exists; ai-chat, ai-router, ai-search, ai-trip-planner, **ai-optimize-route** (Gemini path) call `insertAiRun` | ai-suggest-collections is heuristic-only (no LLM); rentals not applicable | Optional: rentals if AI added | `supabase-edge-functions` | — |
| 8 | Request timeouts | 🟡 | 30 | Shared `_shared/gemini.ts` created with 30s AbortController (2026-04-05) | Not yet applied to individual functions' fetch calls | Replace bare fetch() with fetchGemini() | `supabase-edge-functions` | — |
| 9 | Frontend hardcoded secrets | 🟢 | 100 | All 7 files fixed to use `import.meta.env.*` (2026-04-05) | — | — | — | — |
| 10 | Dead code removed | 🟢 | 100 | useIntentRouter.ts + ChatRightPanel.tsx deleted; routeMessage() removed from useChat (2026-04-05) | — | — | — | — |

## 4. Frontend Rental Flow (E4) — 43%

| # | Item | Status | % | Confirmed | Missing/Failing | Next Action | Skill | Wireframe |
|---|------|--------|---|-----------|----------------|-------------|-------|-----------|
| 1 | Rental search page | 🟢 | 95 | `/rentals` route, filters, grid layout | No real data to display | Needs seed data | `mdeai-three-panel` | `01-rental-search` |
| 2 | Listing detail page | 🟢 | 92 | `/apartments/:id` with gallery, map, details; **Schedule tour / Start application** → `p1-crm` atomic actions; idempotency key **per dialog open** | Map is icon-only (no Google Maps component) | Build MapView component | `mdeai-three-panel` | `03-listing-detail` |
| 3 | Intake wizard | 🟡 | 60 | Multi-step form exists in rentals | Missing validation, no backend save | Wire to edge function | — | `02-intake-wizard` |
| 4 | 3-panel layout | 🟢 | 95 | ThreePanelLayout + context working | — | — | `mdeai-three-panel` | — |
| 5 | Mobile responsive | 🟡 | 70 | Bottom nav, panel collapse | Some panels don't collapse properly | Test on mobile viewports | — | `07-mobile-rental-search` |
| 6 | Google Maps integration | 🔴 | 5 | API key configured, MapPin icons used | No actual Map component built | Build MapView with Google Maps JS | — | `03-listing-detail` |
| 7 | Filter persistence | 🟡 | 50 | Filter state in component | Not persisted to URL params | Add URL param sync | — | `01-rental-search` |

## 5. Existing Features (Pre-Epic) — 95% UI Complete

| # | Feature | Status | % | Confirmed | Missing/Failing | Skill |
|---|---------|--------|---|-----------|----------------|-------|
| 1 | Auth (email + Google OAuth) | 🟢 | 95 | Login, signup, forgot/reset password, ProtectedRoute | Google OAuth needs Supabase config verification | — |
| 2 | Apartment listings | 🟢 | 90 | Full CRUD UI, filters, detail pages | No real data | — |
| 3 | Car listings | 🟢 | 90 | Full CRUD UI, filters, detail pages | No real data | — |
| 4 | Restaurant listings | 🟢 | 90 | Full CRUD UI, filters, detail pages | No real data | — |
| 5 | Event listings | 🟢 | 90 | Full CRUD UI, filters, detail pages | No real data | — |
| 6 | Trip planner | 🟢 | 85 | Create, edit, itinerary builder | AI trip planner edge fn never called | — |
| 7 | Bookings | 🟢 | 80 | Booking UI, management | No actual booking flow tested | — |
| 8 | Collections | 🟢 | 85 | Curated collections, save/unsave | Empty with no data | — |
| 9 | Saved places | 🟢 | 85 | Save/unsave, list view | Empty with no data | — |
| 10 | Notifications | 🟡 | 60 | UI components, bell icon | No notification triggers | — |
| 11 | Admin dashboard | 🟡 | 70 | CRUD for all listing types | No admin auth guard (🟥) | — |
| 12 | Onboarding flow | 🟢 | 80 | Multi-step onboarding wizard | No real data to personalize | — |
| 13 | Coffee / Commerce | 🟡 | 60 | `/coffee` route, Gadget integration, cart hook | No test products in Shopify dev store | `mdeai-commerce` |
| 14 | Dashboard | 🟢 | 88 | User dashboard; **My rentals** → `/dashboard/rentals` (P1 pipeline: leads, showings, applications via `useP1Pipeline`) | Stripe/booking loop still missing | — |
| 15 | Explore / Discovery | 🟢 | 85 | Explore page with categories | No data to explore | — |
| 16 | Concierge page | 🟢 | 80 | AI concierge landing | Chat not wired to real AI | — |
| 17 | Static pages | 🟢 | 95 | How it works, pricing, privacy, terms, sitemap | — | — |

## 6. AI Chat & Agents (E5) — 15%

| # | Item | Status | % | Confirmed | Missing/Failing | Next Action | Skill | Wireframe |
|---|------|--------|---|-----------|----------------|-------------|-------|-----------|
| 1 | ai-chat edge function | 🟡 | 40 | Deployed, multi-agent, tool calling | No JWT verify, no Zod, no rate limit, wildcard CORS | Security hardening | `supabase-edge-functions` | — |
| 2 | ai-router edge function | 🟡 | 40 | Deployed, intent classification | Same security issues | Security hardening | `supabase-edge-functions` | — |
| 3 | ai-search edge function | 🟡 | 20 | Deployed | Never called from frontend | Wire to search UI | `supabase-edge-functions` | — |
| 4 | ai-trip-planner edge function | 🟡 | 20 | Deployed | Never called from frontend | Wire to trip planner | `supabase-edge-functions` | — |
| 5 | ai-optimize-route edge function | 🟡 | 30 | Deployed | Likely untested with real data | Test with seed data | `supabase-edge-functions` | — |
| 6 | ai-suggest-collections edge function | 🟡 | 30 | Deployed | Likely untested | Test with seed data | `supabase-edge-functions` | — |
| 7 | rules-engine edge function | 🔴 | 10 | Deployed | Never called from frontend, purpose unclear | Audit and wire or remove | `supabase-edge-functions` | — |
| 8 | FloatingChatWidget | 🟢 | 80 | Renders, message input, conversation UI | Needs real AI backend working | — | — |
| 9 | AI streaming (SSE) | 🟡 | 40 | Pattern implemented in ai-chat | Not tested end-to-end | Test full flow | — | — |
| 10 | Paperclip agent orchestration | 🔴 | 5 | Running at :3102, 4 agents registered. CEO broken (3/10 audit), workspace unbound | Instructions placeholder, workspace not bound to `/home/sk/mde` | E5-001 (fix CEO), E5-002 (bind workspace) | `paper-clip` | — |
| 11 | Hermes intelligence | 🔴 | 5 | v0.7.0 installed, 637 skills, Claude via OpenRouter | Missing `instructionsFilePath`, timeout not set (4/10 audit) | E5-003 (set config) | `hermes` | — |
| 12 | Payment loop (Stripe) | 🟥 | 0 | — | No `payment-webhook`, no `booking-create` fn, Stripe not wired | **BLOCKER for O1** — spike PSP decision + build webhook | `supabase-edge-functions` | — |

## 7. Commerce (Phase 1) — 30%

| # | Item | Status | % | Confirmed | Missing/Failing | Next Action | Skill | Wireframe |
|---|------|--------|---|-----------|----------------|-------------|-------|-----------|
| 1 | Shopify dev store connected | 🟢 | 100 | mdeaidev.myshopify.com | — | — | `mdeai-commerce` | — |
| 2 | Gadget sync bridge | 🟢 | 90 | Gadget app connected, webhooks flowing | Need to verify sync works | Add test products | `gadget-best-practices` | — |
| 3 | `/coffee` route | 🟢 | 70 | Page renders, fetches from Gadget | No products to display | Add test products | `mdeai-commerce` | — |
| 4 | useShopifyCart hook | 🟢 | 70 | Cart mutations via Storefront API | Untested (no products) | Test after adding products | `mdeai-commerce` | — |
| 5 | FreshnessBadge component | 🟢 | 80 | Renders freshness from roasted_at | Untested with real metafield data | Test with real products | `mdeai-freshness` | — |
| 6 | Test products in Shopify | 🔴 | 0 | — | No coffee products with metafields | Create 3-5 in Shopify admin | `mdeai-commerce` | — |
| 7 | Full checkout flow | 🔴 | 0 | — | Never tested end-to-end | Test browse→cart→checkout→payment | `mdeai-commerce` | — |

## 8. Multi-Channel (E8) — 0% (Later Phase)

| # | Item | Status | % | Confirmed | Missing/Failing | Next Action | Skill | Wireframe |
|---|------|--------|---|-----------|----------------|-------------|-------|-----------|
| 1 | Infobip WhatsApp config | ⚫ | 0 | API keys configured in Supabase | Not wired | Phase 3 | — | `08-whatsapp-conversation` |
| 2 | OpenClaw WhatsApp adapter | ⚫ | 0 | Architecture designed | Not built | Phase 3 | `open-claw` | `08-whatsapp-conversation` |
| 3 | Human handover | ⚫ | 0 | — | Not built | Phase 3 | — | — |

## 9. Production Readiness (E9) — 5%

| # | Item | Status | % | Confirmed | Missing/Failing | Next Action | Skill | Wireframe |
|---|------|--------|---|-----------|----------------|-------------|-------|-----------|
| 1 | Vercel deployment | 🟢 | 90 | Live at www.mdeai.co | — | — | — | — |
| 2 | Vercel env vars | 🟥 | 30 | Vars exist | Wrong NEXT_PUBLIC_* prefix (should be VITE_*) | Fix to VITE_* | — | — |
| 3 | Vercel Analytics | 🔴 | 0 | — | Not installed | Add @vercel/analytics | — | — |
| 4 | ai_runs logging | 🔴 | 0 | Table exists | No edge function logs to it | Wire logging in all 6 AI functions | `supabase-edge-functions` | — |
| 5 | E2E tests (Playwright) | 🔴 | 0 | Playwright configured | No tests written | Write critical path tests | — | — |
| 6 | Unit tests (Vitest) | 🔴 | 0 | Vitest configured | Minimal/no coverage | Write hook + util tests | — | — |
| 7 | Monitoring alerts | 🔴 | 0 | — | No alerts configured | Set up after analytics | — | — |
| 8 | Error boundary coverage | 🟡 | 50 | Some error boundaries | Not comprehensive | Audit all routes | — | — |

## 10. Testing — 8%

| # | Area | Status | % | Confirmed | Missing | Next Action |
|---|------|--------|---|-----------|---------|-------------|
| 1 | Unit tests (hooks) | 🔴 | 0 | Vitest configured | No hook tests yet | Write tests for critical hooks |
| 2 | Unit tests (utils) | 🟡 | 15 | `src/lib/p1-crm-envelope.test.ts` (envelope parse) | Rest of `lib/` untested | Expand lib coverage |
| 3 | Component tests | 🔴 | 0 | — | No tests | Write for critical components |
| 4 | E2E tests | 🔴 | 0 | Playwright configured | No tests | Write critical user journeys |
| 5 | Edge function tests | 🟡 | 20 | Deno tests in `supabase/functions/tests/` (`http_rate_test`, `json_test`, `cron_test`) | Not full coverage of 10 functions | Add CI `verify:edge`; extend cases |
| 6 | Integration tests | 🔴 | 0 | — | No tests | Auth flow, booking flow |

---

## 10b. Continuous Testing Strategy — Production Readiness Gates

> **Purpose:** Every change must pass these gates before deploy. Run after each PR, not just at the end.

### Gate 1: Build + Lint (every PR)
```bash
npm run build          # Must pass — zero errors
npm run lint           # Must pass — zero warnings in changed files
```
**Red flags:** TypeScript errors, missing imports from deleted files, env var undefined at build time.

### Gate 2: Security Grep (every PR that touches src/ or supabase/)
```bash
grep -r "zkwcbyxiwklihegjhuql" src/           # Must return 0 — no hardcoded URLs
grep -r "eyJhbGciOi" src/                      # Must return 0 — no hardcoded JWTs
grep "verify_jwt = false" supabase/config.toml # Must return 0 — all functions verified
grep -r '"Access-Control-Allow-Origin": "\\*"' supabase/functions/ # Must return 0
grep -r "SUPABASE_SERVICE_ROLE_KEY" supabase/functions/ai-chat/   # Only in getServiceClient()
```
**Red flags:** Any hardcoded secret, any wildcard CORS, any service role key in user-facing query.

### Gate 3: Edge Function Verification (every PR that touches supabase/)
```bash
npm run verify:edge    # Deno check + shared tests (7+ tests)
```
**Red flags:** Import errors from `_shared/`, type mismatches, missing env vars in Deno.

### Gate 4: Functional Smoke (weekly or after major changes)
```
Manual browser test:
1. Open localhost:8080 → app loads, no console errors
2. Browse /apartments → listings render (not empty if seeded)
3. Click apartment → detail page renders
4. Open chat widget → send message → streaming response appears
5. Login → /dashboard loads → /dashboard/rentals shows pipeline
6. /admin → redirects if not admin (RBAC check)
```
**Red flags:** Empty pages with seed data, CORS errors in console, 401 on chat.

### Gate 5: Pipeline End-to-End (before each milestone)
```
Test the full pipeline once data and edge functions are wired:
1. Create lead via p1-crm → verify in DB
2. Schedule showing → verify in DB
3. Create application → verify in DB
4. (When built) Approve application → booking created
5. (When built) Stripe payment → booking confirmed
```
**Red flags:** FK violations, missing notifications, duplicate records (idempotency failure).

### Gate 6: Production Deploy Checklist
```bash
# Pre-deploy
npm run build && npm run lint && npm run verify:edge
grep -c "verify_jwt = false" supabase/config.toml  # Must be 0
# Post-deploy
curl -s https://www.mdeai.co | head -1              # Must return HTML
curl -s https://zkwcbyxiwklihegjhuql.supabase.co/functions/v1/ai-chat \
  -X POST -d '{}' | grep -q "UNAUTHORIZED"          # Must get 401 without token
```

### Failure Point Watchlist

| Area | What Could Break | How to Detect | Frequency |
|------|-----------------|---------------|-----------|
| Auth | JWT verification blocks legitimate users | Browser console shows 401 on chat/search | Every deploy |
| CORS | Origin mismatch blocks frontend calls | Browser console shows CORS error | Every deploy |
| Gemini timeout | AI calls hang indefinitely | No response after 30s in chat | Weekly test |
| Service role leak | User queries bypass RLS | Query returns other users' data | Security audit |
| Rate limiting | In-memory resets on cold start | Burst of requests goes through after deploy | Load test |
| Seed data FK | Profiles without auth.users | `supabase db reset` fails | After migration changes |
| Env vars | VITE_ not picked up by Vite | Build succeeds but runtime shows undefined | Every deploy |
| Dead code imports | Deleted file still imported | `npm run build` fails | Every PR |

---

## 11. Security Audit Summary 🟡

**2026-04-05 update:** 4 of 8 CRITICAL issues resolved in this session. Remaining 4 need follow-up PRs.

| # | Issue | Severity | Status | What Changed (2026-04-05) |
|---|-------|----------|--------|--------------------------|
| 1 | `verify_jwt: false` on most functions | ~~CRITICAL~~ | 🟢 FIXED | All 10 functions now `verify_jwt = true` in config.toml |
| 2 | Wildcard CORS `*` | ~~CRITICAL~~ | 🟢 FIXED | `_shared/http.ts` + **every** browser-facing function uses `getCorsHeaders(req)` (2026-04-05 full pass) |
| 3 | No Zod on most functions | 🟡 PARTIAL | 🟡 70% | Most functions already had Zod; 3 still need schemas |
| 4 | No rate limiting | 🟡 PARTIAL | 🟡 60% | In-memory limiter exists in most; acceptable with JWT required |
| 5 | Service role key in inter-function calls | 🟡 PARTIAL | 🟡 50% | Shared `supabase-clients.ts` created + applied to ai-search, ai-router; ai-chat + ai-trip-planner pending |
| 6 | No request timeouts | 🟡 PARTIAL | 🟡 30% | Shared `gemini.ts` helper created with AbortController; not yet applied to individual calls |
| 7 | No token tracking | 🟡 PARTIAL | 🟡 40% | 4 of 7 AI functions log to ai_runs; 3 remaining |
| 8 | Admin auth guard broken | 🔴 OPEN | 🔴 10% | useAdminAuth hook exists; server-side enforcement still missing |
| **9** | **Frontend hardcoded secrets** | ~~CRITICAL~~ | 🟢 **FIXED** | **All 7 files: URLs → env vars, JWT tokens removed** |
| **10** | **Dead code + wasted API call** | ~~HIGH~~ | 🟢 **FIXED** | **2 files deleted, routeMessage() removed (saves 50% Gemini cost/msg)** |

---

## 12. Wireframe → Task Mapping

| Wireframe | File | Mapped To | Status |
|-----------|------|-----------|--------|
| 01 Rental Search Desktop | `01-rental-search-desktop.md` | E4 (Frontend) | 🟢 Built |
| 02 Intake Wizard Desktop | `02-intake-wizard-desktop.md` | E2 (Pipeline) + E4 | 🟡 Partial |
| 03 Listing Detail Desktop | `03-listing-detail-desktop.md` | E4 (Frontend) | 🟢 Built (no map) |
| 04 Landlord Dashboard | `04-landlord-dashboard.md` | E2 (Pipeline) | 🔴 Not built |
| 05 Showing Scheduler | `05-showing-scheduler.md` | E2 (Pipeline) | 🔴 Not built |
| 06 Application Flow | `06-application-flow.md` | E2 (Pipeline) | 🔴 Not built |
| 07 Mobile Rental Search | `07-mobile-rental-search.md` | E4 (Frontend) | 🟡 Partial |
| 08 WhatsApp Conversation | `08-whatsapp-conversation.md` | E8 (Multi-Channel) | ⚫ Phase 3 |
| 09 Admin Listings | `09-admin-listings.md` | E4 + E3 (Security) | 🟡 Built (no auth) |
| 10 AI Strategy Dashboard | `10-ai-strategy-dashboard.md` | E5 (Agents) | 🔴 Not built |

---

## 13. Component Inventory

| Category | Count | Key Files |
|----------|-------|-----------|
| UI primitives (shadcn) | 40+ | `src/components/ui/` |
| Layout | 8 | ThreePanelLayout, Navigation, Sidebar |
| Apartments | 12 | Cards, filters, detail, gallery |
| Cars | 8 | Cards, filters, detail |
| Restaurants | 10 | Cards, filters, detail |
| Events | 8 | Cards, filters, detail |
| Rentals (unified) | 6 | Search, wizard, filters |
| Chat/AI | 10 | FloatingChatWidget, messages, proposals |
| Admin | 12 | Dashboard, CRUD panels |
| Bookings | 5 | Cards, management |
| Trips | 8 | Planner, itinerary, items |
| Auth | 4 | Login, signup, protected routes |
| Onboarding | 4 | Wizard steps |
| **Total** | **~158** | |

---

## 14. Critical Path to First Booking

```
🟡 Seed Data (E1) ──→ 🟥 Security (E3) ──→ 🟡 Pipeline (E2) ──→ 🔴 Stripe (E2) ──→ 🟡 Frontend (E4) ──→ 🟢 Deploy
     ↓                      ↓                     ↓                    ↓                    ↓
  Expand verticals    JWT + CORS + Zod      showing/app fns       payment-webhook      Wire forms
  50+ apts target     Rate limiting on AI    Status machine        booking-create fn   Test flows
  restaurants/cars    Admin auth             Stripe test mode      Commission split     Mobile QA
  embeddings          Token logging + timeouts  —                  —                    Google Maps
```

**Blockers (in priority order):**
1. 🟡 **Partial seed** — Apartments + P1 CRM seeded on linked DB; restaurants, cars, events still empty; 50+ apartment target not met
2. 🟥 **Security** — 8 CRITICAL patterns remain across **nine** legacy edge functions; `p1-crm` is hardened (JWT + Zod + rate limit) but not the rest
3. 🟥 **No production payment loop** — No Stripe webhook, no hosted `booking-create` — **PRD O1** still blocked
4. 🟡 **Pipeline HTTP surface** — Tables + `p1-crm` MVP done; dedicated showing/application/booking edge endpoints still missing
5. 🔴 **3 unused AI functions** — ai-search, ai-trip-planner, rules-engine never wired from frontend
6. 🔴 **Wrong Vercel env vars** — NEXT_PUBLIC_* → VITE_*
7. 🔴 **No Google Maps component** — MapPin icons only
8. 🔴 **PSP decision open** — Stripe-only vs Wompi for COP (PRD §12 decision #1)

---

## 15. Cross-area tracker (weighted / ops view)

**Sources:** repo + [`notes/01-supa.md`](notes/01-supa.md) (Supabase/edge) + [`notes/02-hermes-notes.md`](notes/02-hermes-notes.md) (agents / Hermes).

**Verification discipline:** each stage should pass **`npm run verify:edge`** (Deno) + **`npm run build`** before promote; DB changes require **`supabase db push`** + types regen; production deploy requires Supabase + Vercel env audit.

**Status legend (§15):**

| Symbol | Meaning |
|--------|---------|
| 🟢 | Complete — implemented & locally verifiable |
| 🟡 | In progress — partial or unverified in prod |
| 🔴 | Not started / missing |
| 🟥 | Blocked — dependency or critical risk |

### A. Platform & backend (Supabase)

| Task Name | Description | Status | % | ✅ Confirmed | ⚠️ Missing / Failing | 💡 Next action |
|------------|-------------|--------|---|--------------|----------------------|----------------|
| Postgres schema + RLS | Migrations, P1 tables, `ai_runs`, bookings | 🟢 | 90% | Migrations in repo; RLS in SQL | Prod/staging parity not automated | `supabase db push --linked`; advisors optional |
| Seed & local data | `seed.sql`, `[db.seed]` | 🟡 | 75% | Idempotent seed for dev | Production DB may be empty or different | Run seed on staging; document prod seed policy |
| Edge functions — core | 10 functions + `_shared` | 🟢 | 92% | `npm run verify:edge` passes; **per-request CORS** on all browser-facing handlers; `Deno.serve` entrypoints | Remote deploy not proven in every CI run | Deploy all functions that import `_shared`; re-run verify before CI |
| Edge — `p1-crm` | Leads, payments, showings, applications | 🟢 | 90% | Zod + JWT + rate limit; typed client (`p1-crm-api`), CTAs + `/dashboard/rentals` per **10A/10B** | **Hosted** deploy + smoke not closed ([**`10C-crm-deploy-smoke.md`**](prompts/10C-crm-deploy-smoke.md)) | Run `10C`; then E2E optional |
| Edge — AI stack | chat, router, search, trip, optimize | 🟢 | 88% | Structured errors, limits, **`insertAiRun` includes ai-optimize-route** (Gemini path) | Token/cost observability manual | Dashboard: `ai_runs` analytics |
| Edge — `ai-search` | Semantic / unified search API | 🟡 | 50% | Function hardened in repo | **`useAISearch` calls `ai-chat`**, not `ai-search` | Either invoke `ai-search` from UI or document single-path |
| Edge — `rules-engine` | Proactive suggestions | 🟡 | 55% | POST + `CRON_SECRET` guard | Cron must send `x-cron-secret` if secret set | Configure pg_net / scheduler headers |
| Secrets & env | Gemini, Maps, Shopify, Supabase | 🟡 | 70% | `.env` patterns in CLAUDE | Vercel wrong `NEXT_PUBLIC_*` noted historically | `vercel env` audit; match `VITE_*` |
| Security audit follow-up | P0 edge issues from `docs/audits/` | 🟡 | 60% | Hardening done in repo | Full re-audit not run | Re-run security pass post-deploy |

### B. Frontend — app, chat, dashboards

| Task Name | Description | Status | % | ✅ Confirmed | ⚠️ Missing / Failing | 💡 Next action |
|------------|-------------|--------|---|--------------|----------------------|----------------|
| Routes & shell | Vite, RRv6, 3-panel layout, 30+ routes | 🟢 | 95% | `npm run build` passes | — | Keep smoke checklist on release |
| Floating chat / concierge | `useChat`, tabs, streaming | 🟢 | 85% | SSE path; structured error parse | Real load / failure drills | Monitor edge logs in prod |
| Intent router UI | `useIntentRouter` + ai-router | 🟡 | 75% | Router function OK | End-to-end intent accuracy unmeasured | Add metrics / sampling |
| Trip planner UI | Trips pages, hooks | 🟡 | 70% | Edge `ai-trip-planner` hardened | Planner E2E not automated | Playwright happy path |
| Explore / listings | Apartments, cars, restaurants, events | 🟢 | 85% | Pages + hooks | Some verticals thin in seed | Seed more demo rows |
| Admin dashboard | `/admin/*` routes | 🟡 | 55% | Screens exist | **Admin auth guard** needs audit (`useAdminAuth`) | Role-based guard + server checks |
| Onboarding wizard | `/onboarding` | 🟡 | 65% | Route exists | Completion vs DB sync | Test full funnel |
| Coffee / Shopify | `/coffee`, Gadget, cart | 🟡 | 55% | Route + commerce hooks | Full checkout not CI-proven | Manual checkout test on dev store |

### C. Commerce & marketplace (Phase roadmap)

| Task Name | Description | Status | % | ✅ Confirmed | ⚠️ Missing / Failing | 💡 Next action |
|------------|-------------|--------|---|--------------|----------------------|----------------|
| Shopify + Gadget | Headless catalog sync | 🟡 | 50% | Integration code present | Test products + metafields | Sprint: 3–5 coffee SKUs (per master plan) |
| Checkout | Storefront checkout | 🟡 | 45% | Patterns in hooks | No automated E2E | Record Playwright checkout once |
| Mercur / vendor marketplace | Phase 3 | 🔴 | 10% | Architecture in docs | Not implemented | Defer until first sale stable |
| **booking-create** edge | Server-side booking insert | 🔴 | 15% | `bookings` table exists | No dedicated function | Implement + JWT + idempotency |
| **payment-intent** + Stripe | Ledger + webhooks | 🔴 | 25% | `payments` migration exists | No live Stripe edge flow | Stripe webhook edge + tests |
| WhatsApp / Infobip | Notifications / intake | 🟥 | 20% | Secrets listed in CLAUDE | Webhook not in repo | Import or build `whatsapp-webhook` |

### D. AI, agents, automation

| Task Name | Description | Status | % | ✅ Confirmed | ⚠️ Missing / Failing | 💡 Next action |
|------------|-------------|--------|---|--------------|----------------------|----------------|
| Multi-agent chat | Tools + Gemini | 🟢 | 80% | Streaming + tool parse hardening | `ai_runs` partial coverage | Stream completion logging optional |
| Paperclip + **Nous Hermes** CLI | E5 — instructions path, adapter, logging | 🔴 | 20% | Local Hermes usable (`~/.hermes`) | **E5-003/004** open — not orchestrated from Paperclip | [`05E-agent-infrastructure.md`](prompts/05E-agent-infrastructure.md); detail in [`notes/02-hermes-notes.md`](notes/02-hermes-notes.md) |
| **Hermes Intelligence** (edge) | E6 — `hermes-ranking`, taste, market snapshot | 🔴 | 15% | Epics + MERM docs | No `hermes-ranking` edge; **search → rank** contract unshipped | [`06E-hermes-intelligence.md`](prompts/06E-hermes-intelligence.md); sync MERM-07 |
| Embeddings / pgvector | E1-007 | 🔴 | 25% | pgvector in stack | No embedding pipeline in CI | Plan in [`01E-data-foundation.md`](prompts/01E-data-foundation.md) |
| `agent_jobs` worker | Queue processing | 🔴 | 15% | Table exists | No worker | Only if product needs async jobs |
| Collection suggestions | `ai-suggest-collections` | 🟢 | 70% | Hardened | Usage analytics | Feature flag usage |

### E. Quality, CI, production readiness

| Task Name | Description | Status | % | ✅ Confirmed | ⚠️ Missing / Failing | 💡 Next action |
|------------|-------------|--------|---|--------------|----------------------|----------------|
| Unit tests (app) | Vitest | 🟡 | 35% | `npm run test` exists | Low coverage | Target critical hooks |
| E2E (main app) | Playwright | 🔴 | 5% | Config may exist | No `src/` e2e suite | Add auth + chat smoke |
| Edge unit tests | Deno | 🟢 | 65% | 7 tests in `supabase/functions/tests` | Not in GitHub Actions yet | Add CI job: `verify:edge` |
| Lint | ESLint | 🟡 | 70% | Works on app | Fails on monorepo `paperclip/` paths | Scope lint or fix paths |
| Deploy pipeline | Vercel + Supabase | 🟡 | 75% | Docs + commands | Single-button release gate | Document promote checklist |

### Summary metrics (weighted estimate)

| Area | Approx. % complete |
|------|---------------------|
| Frontend UX / routes | **~89%** |
| Supabase edge (code quality) | **~86%** |
| Agents / Hermes integration (CLI + edge) | **~18%** |
| Data / seed / prod parity | **~65%** |
| Commerce first sale | **~45%** |
| Marketplace Phase 3 | **~10%** |
| Test automation | **~30%** |
| **Overall product (MVP → first revenue)** | **~46–56%** |

### Next steps (ordered — from `01-supa.md`, `todo.md`, `02-hermes-notes.md`)

1. **Security / env (Week 1 gates):** Vercel `VITE_*`, `verify_jwt`, CORS, Zod, rate limits — see **`03E-security-hardening.md`**.  
2. **Deploy** hardened edge functions to linked Supabase (all `_shared` consumers).  
3. **P1 CRM prod:** complete **[`10C-crm-deploy-smoke.md`](prompts/10C-crm-deploy-smoke.md)** (`p1-crm` deploy + browser smoke); epic index **[`10E-crm-real-estate.md`](prompts/10E-crm-real-estate.md)**.  
4. **Cron:** set `CRON_SECRET` + `x-cron-secret` on `rules-engine` callers.  
5. **Decide `ai-search`:** wire `useAISearch` → `ai-search` **or** document chat-only search; wire **`ai-trip-planner`** or document deferral.  
6. **Commerce:** Shopify dev products + full checkout smoke test.  
7. **Implement** `booking-create` + Stripe webhook path when ready.  
8. **Admin:** harden `useAdminAuth` + RLS for admin role.  
9. **CI:** add `npm run verify:edge` + `npm run build` on PR.  
10. **E2E:** one Playwright flow (login → chat message → explore).  
11. **Later — agents:** E5-003/004 (Hermes instructions + Paperclip adapter), then E6 ranking — see **`notes/02-hermes-notes.md`**.

### Proof commands (last verified pattern)

```bash
npm run verify:edge   # Deno: all functions + 7 tests
npm run build         # Vite production build
```

---

## 16. Skills Reference

| Skill | Path | Relevant Epics |
|-------|------|---------------|
| `supabase-edge-functions` | `.claude/skills/supabase-edge-functions` | E1, E2, E3, E5, E6, E9 |
| `real-estate` | `.claude/skills/real-estate` | E1, E2, E4 |
| `mdeai-three-panel` | `.claude/skills/mdeai-three-panel` | E4 |
| `mdeai-commerce` | `.claude/skills/mdeai-commerce` | Commerce |
| `mdeai-freshness` | `.claude/skills/mdeai-freshness` | Commerce |
| `mdeai-tasks` | `.claude/skills/mdeai-tasks` | Task management |
| `paper-clip` | `.claude/skills/paper-clip` | E5 |
| `hermes` | `.claude/skills/hermes` | E6 |
| `open-claw` | `.claude/skills/open-claw` | E8 |
| `gadget-best-practices` | `.agents/skills/gadget-best-practices` | Commerce |
| `roadmap` | `.claude/skills/roadmap` | Planning |
| `mermaid-diagrams` | `.claude/skills/mermaid-diagrams` | Architecture docs |
