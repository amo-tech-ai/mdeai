# mdeai.co — Production Progress Tracker
> **Role:** Expert project analyst · Detective reviewer · Systems Architect
> **Last updated:** 2026-05-03 | **Reviewer:** Claude Sonnet 4.6
> **Process:** Examine → Verify → Validate → Measure → Identify

---

## Legend

| Symbol | Meaning |
|---|---|
| 🟢 | Done — verified in production or browser |
| 🟡 | Partial — code exists, gaps remain |
| 🔴 | Not started — blocked or queued |
| 🟥 | Blocker — prevents downstream work |

---

## 📊 Phase 1 EVENTS — P0 Launch Gate (10 tasks)

| # | Task Name | Description | Status | % | ✅ Confirmed | ⚠️ Missing / Failing | 💡 Next Action |
|---|---|---|---|---|---|---|---|
| 001 | **Event Schema Migration** | 6 tables: `event_venues`, `event_tickets`, `event_orders`, `event_attendees`, `event_check_ins` + ALTER `events` + 10 RPCs + RLS | 🟢 DONE | 100% | Schema live on `zkwcbyxiwklihegjhuql`; 10 RPCs invocable; 1 venue + 1 event + 4 tiers + 2 orders seeded; advisor count 84→82 | — | — |
| 002 | **Host Event Wizard** | 4-step: Basics → Tickets → Review → Publish. `useEventDraft` autosave. Sofía persona journey. Route: `/host/event/new` | 🟢 DONE | 100% | Wizard renders, 4 steps navigable, `useEventDraft` hook autosaves to DB, event published in seed | Lighthouse a11y not yet measured (target ≥90) | Run Lighthouse on `/host/event/new` |
| 034 | **Staff Link Generator** | Edge fn minting HS256 JWTs (24h TTL) signed with `STAFF_LINK_SECRET`; revoke endpoint bumps `staff_link_version` | 🟢 DONE | 100% | 3/3 curl boundary tests pass; `bump_staff_link_version` RPC verified (1→2); advisor −2 | `STAFF_LINK_SECRET` secret not yet set in prod via CLI | `supabase secrets set STAFF_LINK_SECRET=...` |
| 004 | **Ticket Checkout Edge Fn** | Stripe Checkout session + atomic `ticket_checkout_create_pending` RPC; pre-minted QR JWTs; idempotency via `idempotency_keys` | 🟢 DONE | 100% | **12/12 boundary tests pass** (8 HTTP + 4 RPC: happy path, OUT_OF_STOCK, cancel, finalize); `qty_pending` invariant verified | `STRIPE_SECRET_KEY` not yet set → Stripe calls fail in prod | `supabase secrets set STRIPE_SECRET_KEY=sk_live_...` |
| 005 | **Payment Webhook Edge Fn** | Stripe sig verify + idempotency on `event.id`; `payment_intent.succeeded` → `ticket_payment_finalize` RPC; `charge.refunded` → `ticket_payment_refund` | 🟢 DONE | 90% | Deployed; 3/3 curl boundary (METHOD/CONFIG) pass; RPC chain proven via 004 test #12 | Full Stripe sig path untestable without `STRIPE_WEBHOOK_SECRET`; SendGrid email skipped | Set `STRIPE_WEBHOOK_SECRET=whsec_...` then curl real event replay |
| 006 | **Ticket Validate Edge Fn** | Staff JWT + QR JWT verify; revocation gate; atomic `ticket_validate_consume` RPC; `event_check_ins` audit log on every scan | 🟢 DONE | 100% | 4/4 HTTP boundary; 3/3 RPC outcomes (consumed → already_used on rescan + unknown_token + audit log insert) | `QR_SIGNING_SECRET` not set in prod | `supabase secrets set QR_SIGNING_SECRET=...` |
| 008 | **Buyer Tickets Page** | `/me/tickets` list (upcoming/past, status badges), `/me/tickets/:id` fullscreen QR (dark bg, grayscale when used), anon `?token=` path | 🟢 DONE | 100% | 185/185 vitest; 10/10 bundle chunks within budget; build 4.72s; browser proof: empty state + QR fullscreen + desktop sidebar; anon path verified via seed `access_token_finalize_test` | — | — |
| 003 | **Host Event Dashboard** | `/host/event/:id` — KPIs (revenue, sold, pending, check-ins), Realtime tile updates, attendee table, "Generate staff link" CTA | 🔴 TODO | 0% | — | Entire page missing | Invoke `mdeai-planner` → `mdeai-executor` with spec at `tasks/events/prompts/003-*` |
| 007 | **Staff Check-in PWA** | Mobile-first QR scanner; offline-first queue replays on reconnect; Andrés persona; Pixel 7 viewport; <500ms p95 4G | 🔴 TODO | 0% | — | Entire PWA missing; no `event-staff-link-generator` consumer exists in UI | Invoke `mdeai-planner` → `mdeai-executor` with spec at `tasks/events/prompts/007-*` |
| 009 | **Chatbot Event Creation** | Gemini tool-combination in `ai-chat` edge fn: `create_event_draft` + `search_venues` tools; `include_server_side_tool_invocations: true`; thoughtSignature preserved | 🔴 TODO | 0% | — | `ai-chat` still uses legacy `fetchGemini`/`fetchGeminiStream` (not native SDK); tool-combination not wired | Migrate `ai-chat` → native Gemini SDK first (045 deferred); then add tools |

### Phase 1 Acceptance Gate

| Gate | Status | Verified |
|---|---|---|
| Schema deployed + advisor clean | 🟢 | ✅ |
| Wizard publishes event end-to-end | 🟢 | ✅ |
| Camila buys via Stripe → email → QR at `/me/tickets` | 🟥 | Blocked: `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` unset |
| Andrés scans QR → green ✓; rescan → red ✗ ALREADY_USED | 🟥 | Blocked: task 007 not started |
| Sofía's dashboard reconciles to the cent vs Stripe | 🟥 | Blocked: task 003 not started |
| Load test: 50 concurrent buyers → 10 sold, 40 OUT_OF_STOCK, 0 oversell | 🟥 | Not run |
| Revoking `staff_link_version` invalidates outstanding JWTs | 🟡 | 034 done; needs 007 scanner to test end-to-end |
| Lighthouse a11y ≥90 on 4 new screens | 🔴 | Not measured |

---

## 📊 Phase 1.5 EVENTS — Fast-Follow Hardening (7 tasks, ships post-launch)

| # | Task Name | Description | Status | % | ✅ Confirmed | ⚠️ Missing / Failing | 💡 Next Action |
|---|---|---|---|---|---|---|---|
| 045 | **Gemini Native SDK Migration** | `_shared/gemini.ts`: `callGeminiStructured<T>`, `callGeminiAgent`, `withRetry`; G1 enforced at type level; G2 (no temp); G7 tool-combination + thoughtSignature; 5 callers migrated | 🟢 DONE | 85% | 5 callers migrated; build 4.55s; 170 tests pass | `ai-chat` (1054 LOC) still uses legacy `fetchGemini`/`fetchGeminiStream` — deferred to follow-up PR | Migrate `ai-chat` to native SDK (prerequisite for 009) |
| 046 | **Gemini Skill Housekeeping** | Patched SKILL.md (tool-combination note); 3 new ref files: `tool-combination.md`, `maps-grounding.md`, `code-execution.md`; corrected model pricing + thinking levels matrix | 🟢 DONE | 100% | All 3 ref files written; SKILL.md Resources + Checklist updated | — | — |
| 025 | **Promo Codes Schema** | `event_promo_codes` table; 100% sponsor comp tickets; HE-2 critical gap | 🔴 TODO | 0% | — | Migration not written | `supabase migration new event_promo_codes` → apply |
| 026 | **Order Refunds Schema** | `event_order_refunds` table; partial refund + chargeback audit trail; reconciles to Stripe | 🔴 TODO | 0% | — | — | Depends on 005 being fully operational with Stripe secrets |
| 027 | **Taxes & Fees Schema** | Colombia IVA 19% applied at checkout; legal organizer invoicing | 🔴 TODO | 0% | — | Tax calc not in checkout RPC today | Requires 004 RPC modification |
| 030 | **Media Assets Schema** | `event_media_assets` table; sponsor logos + gallery + flyers; storage policy | 🔴 TODO | 0% | — | — | Needed for 033 verdict storage |
| 033 | **Photo Moderation Edge Fn** | Gemini-powered; 4 asset_type variants (logo/gallery/flyer/profile); `mediaResolution` saves 4× tokens on logos | 🔴 TODO | 0% | — | 030 schema needed first; `callGeminiStructured` (045) now available | Sequence: 030 → 033 |

---

## 📊 Phase 2 CONTESTS — Voting Layer (15 tasks) 🟥 BLOCKED on Phase 1 gate

> **Cannot start until all 8 Phase 1 gate items are green.** Layer batching below.

| Layer | # | Task Name | Description | Status | Skills Required |
|---|---|---|---|---|---|
| 1 | 010 | **Vote Schema** | `contest_votes` (UNIQUE voter_phone + contest_id), RPCs, atomic insert | 🔴 TODO | supabase, supabase-postgres-best-practices |
| 1 | 016 | **Phone OTP** | Twilio/Infobip OTP; Colombia E.164; replay blocked; rate limit per phone | 🔴 TODO | supabase-edge-functions, supabase |
| 1 | 021 | **OpenClaw VPS Provision** | OpenClaw daemon on VPS; SSH smoke test; heartbeat from edge fns | 🔴 TODO | open-claw |
| 2 | 014 | **Hybrid Scoring Trigger** | PG trigger: 50% votes + 50% judges = `hybrid_score`; tunable per contest | 🔴 TODO | supabase, supabase-postgres-best-practices |
| 2 | 015 | **Cloudflare Turnstile** | Bot-traffic gate; <300ms UX overhead; Vitest mock | 🔴 TODO | mdeai-project-gates |
| 2 | 020 | **Gemini Photo Moderation** | Gemini `callGeminiStructured`; safe/unsafe/NSFW verdict; uses 045 helpers | 🔴 TODO | gemini, supabase-edge-functions |
| 3 | 011 | **Vote Cast Edge Fn** | Turnstile + OTP verify + double-vote rejection + rate-limit per phone | 🔴 TODO | supabase-edge-functions |
| 3 | 018 | **Contestant Intake Form** | Multi-step form; photo upload; Daniela persona; status → pending moderation | 🔴 TODO | frontend-design, vitest-component-testing |
| 3 | 019 | **Admin Moderation Page** | Approve/reject 5 contestants <30s; audit log row per decision | 🔴 TODO | frontend-design, vitest-component-testing |
| 3 | 022 | **Leaderboard Broadcast Skill** | WhatsApp/IG/Twitter post on threshold change; rate limit honoured | 🔴 TODO | open-claw |
| 4 | 012 | **Vote Page (Mobile)** | Contestant cards; 1 vote/min/IP rate gate; Camila persona; LCP <2.5s | 🔴 TODO | frontend-design, claude-preview-browser-testing |
| 4 | 013 | **Realtime Leaderboard** | Supabase Realtime channel; tab 1 vote → tab 2 updates <2s; ranking: hybrid_score → vote_count → earliest | 🔴 TODO | frontend-design, vitest-component-testing |
| 4 | 017 | **Fraud Scan Cron** | pg_cron; 1000 votes/30s from same /24 flagged in 5 min; <2% false positive | 🔴 TODO | supabase-edge-functions |
| 4 | 023 | **pg_cron Backstop** | Fires if OpenClaw offline; idempotent | 🔴 TODO | supabase |
| 4 | 024 | **Trust Page** | `/contests/:slug/trust`; hybrid weights visible; 015/017 fraud measures explained | 🔴 TODO | frontend-design |

---

## 📊 Phase 2 EVENTS — Production Ops Layer (4 tasks) 🔴

| # | Task Name | Description | Status | % | 💡 Next Action |
|---|---|---|---|---|---|
| 028 | **Stakeholders Schema** | Judges + planners per event; RLS: planner reads but can't edit organizer notes | 🔴 TODO | 0% | Ships alongside contests layer 1 |
| 029 | **Vendors Schema** | Photographer/AV/security/catering trackable per event | 🔴 TODO | 0% | Ships alongside 028 |
| 031 | **Sponsors Link Schema** | Bridge table: events ↔ Phase 3 sponsor system | 🔴 TODO | 0% | Ships before Phase 3 |
| 032 | **Attendee Profiles Schema** | Dietary/accessibility/company JSONB per attendee | 🔴 TODO | 0% | Ships alongside 028 |

---

## 📊 Venue Management (10 tasks across Phases 1–4) 🔴

| Phase | # | Task Name | Description | Status | % |
|---|---|---|---|---|---|
| 1 | 035 | **Venue Picker in Wizard** | Autocomplete in host wizard (step 1); create-new-venue inline; ≥3 results in 200ms | 🔴 TODO | 0% |
| 2 | 036 | **Venue Resources Schema** | Per-venue AV/catering/furniture inventory; RLS scoped to venue owner | 🔴 TODO | 0% |
| 2 | 037 | **Venue Staff Schema** | Security/AV/catering ops staff trackable per venue | 🔴 TODO | 0% |
| 2 | 038 | **Venue Availability Schema** | iCal RRULE recurrence; open/blocked windows | 🔴 TODO | 0% |
| 2 | 039 | **Host Venue Management Page** | `/host/venue/:id` — 4 tabs (overview/resources/staff/availability); Sofía persona | 🔴 TODO | 0% |
| 3 | 040 | **Venue Layouts Schema** | Floor plans + zones (theater/banquet/reception) per venue | 🔴 TODO | 0% |
| 3 | 041 | **Venue Bookings Schema** | `EXCLUDE USING gist` double-booking guard; contracts attachable | 🔴 TODO | 0% |
| 3 | 042 | **Venue Analytics Dashboard** | Utilization %, revenue $, resource cost $, staff hours | 🔴 TODO | 0% |
| 4 | 043 | **AI Venue Optimizer Edge Fn** | Gemini `callGeminiAgent` + Maps grounding + Code Execution + custom fns; pricing/scheduling JSON | 🔴 TODO | 0% |
| 4 | 044 | **AI Venue Layout Generator** | Python sandbox via Code Execution; floor plan JSON; aisle widths ≥1.5m enforced | 🔴 TODO | 0% |

---

## 📊 Core Platform / Landlord V1 (shipped D1–D15)

| Area | Feature | Status | % | Notes |
|---|---|---|---|---|
| **Auth** | Email/password signup + Google OAuth | 🟢 | 100% | Fix #1: signup redirect → success panel (PR #8) |
| **Auth** | Post-login routing by account_type | 🟢 | 100% | Fix #2: landlord → `/host/dashboard` (PR #8) |
| **Onboarding** | Renter vs landlord wizard fork | 🟢 | 100% | Fix #3: landlord → `/host/onboarding` (PR #8) |
| **Host Onboarding** | 3-step wizard: basics → verify → welcome | 🟢 | 100% | D3 shipped |
| **Listing Wizard** | 4-step: address → specs → media → pricing | 🟡 | 90% | Fix #4: Places autocomplete fallback (PR #8); Step 4 submit landing D5 |
| **Host Dashboard** | KPIs: listings, leads, views, reply rate | 🟢 | 100% | D7 shipped |
| **Lead Inbox** | `/host/leads` list + `/host/leads/:id` detail | 🟢 | 100% | D9–D10 shipped |
| **Contact Host Form** | Renter → SECURITY DEFINER RPC → WhatsApp deep-link | 🟢 | 100% | D7.5 shipped |
| **WhatsApp Notifications** | 30-min reminder cron + lead-in ping | 🟡 | 70% | Sandbox only; D11 Meta self-signup pending |
| **Public Listing** | `HostCard`, `formatListingPrice`, COP currency display | 🟢 | 100% | Fixes #5,#6,#7 (PR #8) |
| **Analytics** | `analytics_events_daily` pg_cron snapshot 03:10 UTC | 🟢 | 100% | D14 |
| **E2E Playwright** | 6 tests (anon redirects, contact-host, landlord inbox) | 🟡 | 40% | D14; GHA runs on every PR; needs expansion for events |
| **Admin RBAC** | `user_roles` table; server-side enforcement | 🔴 | 10% | Client-side only — R3 blocker |
| **Money path (rental)** | `booking-create` + `payment-webhook` edge fns | 🔴 | 0% | R1 — critical blocker for rentals commerce |

---

## 📊 AI / Gemini Stack

| Agent / Tool | Function | Status | % | Notes |
|---|---|---|---|---|
| **ai-chat** | Multi-agent: concierge / trips / explore / bookings; SSE streaming | 🟡 | 75% | Still uses legacy `fetchGemini`/`fetchGeminiStream`; must migrate to native SDK before 009 |
| **ai-router** | Intent classification (EXPLORE/BOOK/TRIP/SEARCH/MEMORY/GENERAL) | 🟢 | 100% | Migrated to `callGeminiStructured` (045) |
| **ai-search** | pgvector semantic search: apartments + restaurants + cars + events | 🟢 | 100% | Migrated (045); `gemini-3-flash-preview` |
| **ai-trip-planner** | Complex trip generation; `gemini-3.1-pro-preview` | 🟢 | 100% | Migrated (045); model_name hotfix (sunsetted → 3.1) |
| **ai-optimize-route** | Route optimization via Google Directions proxy | 🟢 | 100% | Migrated (045) |
| **rentals** | Rental intake conversation; `gemini-3.1-pro-preview` | 🟢 | 100% | Migrated (045) |
| **_shared/gemini.ts** | `callGeminiStructured<T>`, `callGeminiAgent`, `withRetry`, `geminiClient()` | 🟢 | 100% | G1 (responseJsonSchema required), G2 (no temp), G5 (groundingChunks), G7 (tool-combination) |
| **Tool combination** | `include_server_side_tool_invocations: true` + thoughtSignature preservation | 🟢 | 100% | Documented in `gemini/references/tool-combination.md`; SDK wired |
| **Maps grounding** | Google Maps API via Gemini grounding | 🟢 | 100% | Ref at `gemini/references/maps-grounding.md` |
| **Code Execution** | Python sandbox for numerical reasoning (043, 044) | 🟢 | 100% | Ref at `gemini/references/code-execution.md` |
| **Chatbot Event Creation** | Gemini tool-combination to create event draft from chat | 🔴 | 0% | Task 009 — requires `ai-chat` SDK migration first |
| **Gemini Photo Moderation** | `callGeminiStructured` verdict on uploads; 4 asset_type variants | 🔴 | 0% | Task 020 — Phase 2 |
| **AI Venue Optimizer** | `callGeminiAgent` + Maps + Code Exec + custom fns | 🔴 | 0% | Task 043 — Phase 4 |
| **AI Venue Layout Generator** | Python floor plan via Code Execution sandbox | 🔴 | 0% | Task 044 — Phase 4 |

---

## 📊 Schema — Tables & RPCs

| Table | Purpose | Status | RLS | Notes |
|---|---|---|---|---|
| `events` | Event listings (extended with ticket fields) | 🟢 | ✅ | ALTERed in 001 |
| `event_venues` | Venue records | 🟢 | ✅ | 001 |
| `event_tickets` | Ticket tiers (qty_total, qty_sold, qty_pending) | 🟢 | ✅ | CHECK constraint enforced |
| `event_orders` | Buyer orders; `access_token` for anon magic-link | 🟢 | ✅ | `orders_buyer_select` policy |
| `event_attendees` | Per-attendee rows; `qr_token` JWT | 🟢 | ✅ | `attendees_via_order_select` |
| `event_check_ins` | Audit log every scan (success + failure) | 🟢 | ✅ | Append-only via edge fn |
| `event_promo_codes` | Discount codes | 🔴 | — | Task 025 |
| `event_order_refunds` | Refund audit trail | 🔴 | — | Task 026 |
| `event_media_assets` | Sponsor logos, gallery, flyers | 🔴 | — | Task 030 |
| `contest_votes` | UNIQUE (voter_phone_e164, contest_id) | 🔴 | — | Task 010 |
| Venue ops tables (resources/staff/availability/layouts/bookings) | Venue ops tables | 🔴 | — | Tasks 036–041 |
| **Key RPCs** | | | | |
| `ticket_checkout_create_pending` | Atomic capacity guard (race-safe) | 🟢 | service_role | Proven 12/12 tests |
| `ticket_checkout_cancel` | Release qty_pending on Stripe failure | 🟢 | service_role | |
| `ticket_payment_finalize` | pending→paid + attendees→active + qty transfer | 🟢 | service_role | |
| `ticket_validate_consume` | Single-use QR; `UPDATE ... WHERE qr_used_at IS NULL RETURNING` | 🟢 | service_role | |
| `get_anonymous_order` | SECURITY DEFINER; anon+auth; validates access_token | 🟢 | anon+auth | Used by `/me/tickets/:id?token=` |
| `bump_staff_link_version` | Revoke outstanding staff JWTs | 🟢 | service_role | |

---

## 📊 User Journeys

| Persona | Journey | Status | Proof |
|---|---|---|---|
| **Sofía** (organizer) | `/host/event/new` → 4-step wizard → publishes "Reina de Antioquia" with 4 tiers | 🟢 | Seed: 1 published event + 4 tiers in DB |
| **Sofía** | `/host/event/:id` — views KPIs, Realtime updates, generates staff link | 🔴 | Task 003 not built |
| **Camila** (buyer) | `/events/:id` → ticket checkout → Stripe → webhook → `/me/tickets` → QR | 🟡 | Checkout edge fn done; Stripe secrets needed; QR page done |
| **Camila** | `/me/tickets` — upcoming/past list; `/me/tickets/:id` — fullscreen QR | 🟢 | Browser proof: 3 screenshots captured (2026-05-03) |
| **Andrés** (door staff) | Magic link → PWA scanner → scan QR → consumed; rescan → already_used | 🔴 | Task 007 not built |
| **Sanjiv Khullar** (landlord) | Signup → onboard → list → contact from renter → WhatsApp notification | 🟢 | D7.5+PR#8 browser verified (7/7 fixes) |
| **Daniela** (contestant) | Submit intake form → photo moderated → admin approves | 🔴 | Tasks 018+019+020 not built |
| **Anon buyer** | `/me/tickets/:id?token=access_token` — QR via magic link | 🟢 | Verified with seed `access_token_finalize_test` |

---

## 📊 Infrastructure & Secrets

| Item | Status | Detail |
|---|---|---|
| Supabase project `zkwcbyxiwklihegjhuql` | 🟢 | Live, advisors at 82 |
| `STAFF_LINK_SECRET` | 🔴 | Not set in prod — `supabase secrets set STAFF_LINK_SECRET=...` |
| `QR_SIGNING_SECRET` | 🔴 | Not set in prod |
| `STRIPE_SECRET_KEY` | 🔴 | Not set in prod |
| `STRIPE_WEBHOOK_SECRET` | 🔴 | Not set in prod |
| `GEMINI_API_KEY` | 🟢 | Set in dashboard |
| `INFOBIP_API_KEY` / `INFOBIP_BASE_URL` | 🟢 | Set (WhatsApp) |
| PR #8 (fix/landlord-launch-blockers → main) | 🟡 | Open; CodeRabbit review pending; needs merge |
| Vercel auto-deploy | 🟢 | `www.mdeai.co` live on `main` push |
| git HTTP/1.1 + postBuffer fix | 🟢 | Repo-local config; SSH fallback documented |
| `~/bin/git` safety wrapper | 🟢 | Blocks 9 destructive variants |
| `.git/hooks/post-checkout` | 🟢 | Warns on file count drop in `tasks/`, `.claude/skills/`, `supabase/` |
| Sentry / PostHog in prod | 🟡 | Vars set + init verified; no real event confirmed in dashboard (R4) |
| Admin RBAC server-side | 🔴 | Client-route-guard only (R3) |

---

## 📊 Test Coverage

| Suite | Count | Status | Notes |
|---|---|---|---|
| Vitest unit + hook tests | **185 / 185** | 🟢 | 15 files; baseline grew from 86 after task 008 |
| Deno edge fn tests | **47 / 47** | 🟢 | `supabase/functions/tests/` |
| Playwright E2E | **6 / 6** | 🟡 | D14 suite; anon redirects + contact-host + landlord inbox; needs expansion for events |
| Bundle chunks | **10 / 10** | 🟢 | All within gzip budget; entry 95.78 KB |
| Lighthouse a11y | **Not measured** | 🔴 | Target ≥90 on 4 new screens |
| RWT load test | **Not run** | 🟥 | 50 concurrent buyers → 0 oversell required for Phase 1 gate |

---

## 📋 Priority Queue — What to do next (top-to-bottom)

| Priority | Action | Effort | Unblocks |
|---|---|---|---|
| **1** | Merge PR #8 → `main` | 30 min | Clean base for Phase 1 completion |
| **2** | Set 4 Supabase secrets (`STAFF_LINK_SECRET`, `QR_SIGNING_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) | 15 min | Full Stripe E2E; ticket validate prod ready |
| **3** | Task 003 — Host Event Dashboard (2d) | 2d | Sofía acceptance gate; Phase 1 gate |
| **4** | Task 007 — Staff Check-in PWA (1.5d) | 1.5d | Andrés acceptance gate; Phase 1 gate |
| **5** | Migrate `ai-chat` → native Gemini SDK (deferred 045 tail) | 0.5d | Task 009 chatbot event creation |
| **6** | Task 009 — Chatbot Event Creation (2d) | 2d | Phase 1 P1 feature; closes Phase 1 |
| **7** | Run RWT: 50 concurrent buyers load test | 1h | Phase 1 gate item |
| **8** | Lighthouse a11y ≥90 on 4 new screens | 1h | Phase 1 gate item |
| **9** | D11 WhatsApp production (Meta Self-Signup + Spanish template) | 1d | Removes sandbox friction for landlords |
| **10** | Phase 1.5: 025→026→027→030→033 (post-launch hardening) | 3.5d | Promo codes, refunds, taxes, media, moderation |
