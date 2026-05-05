# mdeai.co — Master Todo (Ordered by Dependency)
> **Last updated:** 2026-05-05 (all L1–L8 done · 4 edge fns deployed · 243/243 tests)
> **Tests:** 243/243 passing · **Build:** clean 5.97s · **Live:** mdeai.co

---

## 🔴 IMMEDIATE BLOCKERS — Do These First

| # | Action | Effort | Unblocks |
|---|---|---|---|
| ~~B1~~ | ~~Set `STRIPE_SECRET_KEY` in Supabase prod~~ | ✅ DONE | — |
| ~~B2~~ | ~~Set `STRIPE_WEBHOOK_SECRET` in Supabase prod~~ | ✅ DONE | — |
| ~~B3~~ | ~~Set `STAFF_LINK_SECRET` in Supabase prod~~ | ✅ DONE | — |
| ~~B4~~ | ~~Set `QR_SIGNING_SECRET` in Supabase prod~~ | ✅ DONE | — |
| B5 | Create `STRIPE_SPONSOR_CHECKOUT_KEY` restricted API key | 15 min | Sponsor checkout (048) |

```bash
supabase secrets set \
  STRIPE_SECRET_KEY="sk_live_..." \
  STRIPE_WEBHOOK_SECRET="whsec_..." \
  STAFF_LINK_SECRET="..." \
  QR_SIGNING_SECRET="..." \
  --project-ref zkwcbyxiwklihegjhuql
```

---

## 🎟️ PHASE 1 — EVENTS (P0 Launch Gate)

> **Overall: 91% complete.** Gate blocked on 007 (staff check-in PWA) + load test + Lighthouse.

| Order | # | Task | % | Status | Blocker |
|---|---|---|---|---|---|
| 1 | 001 | Event schema migration (6 tables, 10 RPCs, RLS) | 100% | ✅ DONE | — |
| 2 | 002 | Host event new wizard (`/host/event/new`) | 100% | ✅ DONE | — |
| 3 | 034 | Staff link generator edge fn (JWT mint + revoke) | 100% | ✅ DONE | ✅ Deployed; secret set |
| 4 | 004 | Ticket checkout edge fn (Stripe + atomic RPC) | 100% | ✅ DONE | ✅ Deployed; secret set |
| 5 | 005 | Payment webhook edge fn (Stripe sig verify → finalize) | 90% | ✅ DONE | ✅ Deployed; secret set |
| 6 | 006 | Ticket validate edge fn (staff JWT + QR consume) | 100% | ✅ DONE | ✅ Deployed; secret set |
| 7 | 008 | Buyer tickets page (`/me/tickets` + fullscreen QR) | 100% | ✅ DONE | — |
| 8 | 068 | Schema.org JSON-LD on `/events/:id` | 100% | ✅ DONE | — |
| 9 | 003 | Host event dashboard (`/host/event/:id`, KPIs, Realtime) | 100% | ✅ DONE | — |
| 10 | 007 | Staff check-in PWA (mobile QR scanner, offline queue) | 0% | 🔴 TODO | — (secrets now set) |
| 11 | 009 | Chatbot event creation (Gemini tool-combination) | 0% | 🔴 TODO | 045 tail + 007 |

### Phase 1 Acceptance Gate Checklist

- [x] Schema deployed + advisor clean
- [x] Wizard publishes event end-to-end
- [x] Host dashboard KPIs accurate to the cent
- [ ] **Camila buys via Stripe → email → QR** ← unblocked: all secrets set + fns deployed; needs E2E test
- [ ] **Andrés scans QR → green ✓; rescan → ALREADY_USED** ← blocked: 007 not built
- [ ] **Revoking staff link invalidates scanner JWTs** ← needs 007 E2E
- [ ] **Load test: 50 concurrent buyers → 0 oversell** ← not run
- [ ] **Lighthouse a11y ≥ 90** on 4 new screens ← not measured

---

## 🔧 PHASE 1.5 — EVENTS HARDENING (Post-launch)

> **Overall: 26% complete.** Start after Phase 1 gate is green.

| Order | # | Task | % | Status | Blocker |
|---|---|---|---|---|---|
| 1 | 045 | Migrate `ai-chat` → native Gemini SDK (045 tail) | 85% | 🟡 IN PROGRESS | — |
| 2 | 030 | Media assets schema (`event_media_assets` table) | 0% | 🔴 TODO | — |
| 3 | 025 | Promo codes schema (`event_promo_codes`) | 0% | 🔴 TODO | — |
| 4 | 026 | Order refunds schema (`event_order_refunds`) | 0% | 🔴 TODO | B1 + B2 secrets |
| 5 | 027 | Taxes & fees (IVA 19% at checkout) | 0% | 🔴 TODO | 004 RPC mod |
| 6 | 033 | Photo moderation edge fn (Gemini-powered) | 0% | 🔴 TODO | 030 + 045 done |

---

## 🎯 PHASE 1 — CHATBOT CREATION (P1, after 045 tail)

| Order | # | Task | % | Status | Blocker |
|---|---|---|---|---|---|
| 1 | 045 | Finish `ai-chat` → native Gemini SDK | 85% | 🟡 IN PROGRESS | — |
| 2 | 009 | Chatbot event creation (tool-combination: `create_event_draft` + `search_venues`) | 0% | 🔴 TODO | 045 tail complete |

---

## 🏆 PHASE 3 — SPONSORS (14/14 Core Tasks DONE ✅)

> **Core system: 100% complete.** Phase 3+ marketplace is queued.

### Core (100% done)

| # | Task | % |
|---|---|---|
| 045–046 | Schema + apply wizard | 100% ✅ |
| 047 | Admin approval queue | 100% ✅ |
| 048 | Stripe checkout + webhook | 100% ✅ |
| 049–050 | SponsoredSurface + impression/click edge fns | 100% ✅ |
| 051 | Attribution trigger | 100% ✅ |
| 052 | ROI dashboard (6 tiles, 4 windows, AI insight, CSV) | 100% ✅ |
| 053 | ROI rollup cron | 100% ✅ |
| 054 | 5 AI edge fns (moderate/roi-explain/creative-gen/optimize/audience-match) | 100% ✅ |
| 055–058 | Contracts schema + generate + sign page + dispute UI | 100% ✅ |

### Phase 3+ Marketplace (Queued — start after Phase 1 gate)

| Order | # | Task | % | Status |
|---|---|---|---|---|
| 1 | 067 | Sponsor chat concierge (3 intent keys in `ai-chat`) | 0% | 🔴 TODO |
| 2 | 069 | Sponsor self-serve renewal CTA (90-day cycle) | 0% | 🔴 TODO |
| 3 | 070 | Unified marketing schema migration | 0% | 🔴 TODO |
| 4 | 071–075 | Marketplace UI (brand profile, event listing, browse, proposals) | 0% | 🔴 TODO |
| 5 | 076–081 | Discovery pipeline (admin UI, enrichment, scoring, outreach) | 0% | 🔴 TODO |
| 6 | 082–091 | AI automation (proposal gen, creative, campaign planning) | 0% | 🔴 TODO |
| 7 | 092–096 | Advanced features (retention risk, dynamic pricing, governance) | 0% | 🔴 TODO |

---

## 🥊 PHASE 2 — CONTESTS (Voting Layer)

> **Blocked on Phase 1 gate.** Do not start until all Phase 1 acceptance items are green.

| Order | # | Task | % | Status | Layer |
|---|---|---|---|---|---|
| 1 | 010 | Vote schema | 100% | ✅ DONE | Schema |
| 2 | 014 | Hybrid scoring trigger | 100% | ✅ DONE | Schema |
| 3 | 018 | Contestant intake form | 100% | ✅ DONE | UI |
| 4 | 019 | Admin moderation page | 100% | ✅ DONE | UI |
| 5 | 012 | Vote page (mobile) | 100% | ✅ DONE | UI |
| 6 | 013 | Realtime leaderboard | 100% | ✅ DONE | UI |
| 7 | 021 | OpenClaw VPS provision | 0% | 🔴 TODO | Infra |
| 8 | 016 | Phone OTP (Infobip) | 0% | 🔴 TODO | Auth |
| 9 | 015 | Cloudflare Turnstile (bot guard) | 0% | 🔴 TODO | Auth |
| 10 | 020 | Gemini photo moderation | 0% | 🔴 TODO | AI |
| 11 | 011 | Vote cast edge fn | 0% | 🔴 TODO | Edge fn |
| 12 | 022 | Leaderboard broadcast skill | 0% | 🔴 TODO | Realtime |

**Contests % complete: 50% (6/12 tasks done)**

---

## 🏠 LANDLORD V1 — Auth & Listing Flow

> **8/8 blockers cleared (2026-05-05).** All L1–L8 done. Remaining: onboarding/dashboard pages + seed data.

| # | Fix | Status |
|---|---|---|
| L1 | `ThreePanelLayout.tsx` CJS `require()` → ES re-export (crashed ApartmentDetail) | ✅ DONE |
| L2 | `useAuth.tsx` — `AccountType`, landlord `emailRedirectTo`, `signInWithGoogle` options, PostHog identify | ✅ DONE |
| L3 | `ApartmentDetail.tsx` — `formatListingPrice()` COP/USD, conditional price tiles, `HostCard` | ✅ DONE |
| L4 | `Login.tsx` — post-login routes landlord → `/host/dashboard`; reads `?returnTo=` param | ✅ DONE |
| L5 | `Onboarding.tsx` — landlords bypass renter onboarding → `/host/onboarding` | ✅ DONE |
| L6 | `Signup.tsx` — 3-step flow: AccountTypeStep → credentials → inline success | ✅ DONE |
| L7 | `index.html` — remove temp debug error-capture script | ✅ DONE |
| L8 | Listing wizard Step 1 "Continue" stuck disabled when Places autocomplete returns no suggestions | ✅ DONE |

### Landlord V1 Remaining

| Order | Task | Blocker |
|---|---|---|
| 1 | `/host/onboarding` — landlord onboarding page (redirect target live, page 404s) | ✅ L6 done — build now |
| 2 | `/host/dashboard` — landlord home (redirect target live, page 404s) | ✅ L4 done — build now |
| 3 | Seed 3–5 test apartments linked to `landlord_id` for HostCard QA | ✅ L3 done — seed now |

---

## 🏠 REAL ESTATE — CORE Phase (Weeks 1–8)

> **Overall: 6% complete.** E1 (seed data) has zero blockers — start anytime.

| Order | Epic | Task | % | Status | Blocker |
|---|---|---|---|---|---|
| 1 | E1 | Seed 20–30 rental listings (data foundation) | 0% | 🔴 TODO | **NONE — do first** |
| 2 | E3 | Security hardening (`verify_jwt`, Zod, RBAC server-side) | 0% | 🔴 TODO | — |
| 3 | E2 | Lead-to-lease pipeline (5 edge fns: lead-capture, showing-create, application-create, booking-create, payment-webhook) | 0% | 🔴 TODO | E1 data |
| 4 | E2 | Showing reminders cron (T-24h + T-1h SMS+email) | 0% | 🔴 TODO | E2 edge fns |
| 5 | E4 | Frontend rental flow (MapView + LandlordDashboard full build) | 30% | 🟡 PARTIAL | E2 edge fns |
| 6 | E10 | P1 CRM edge fn (lead→showing→application→booking state machine) | 0% | 🔴 TODO | E2 edge fns |
| 7 | E9 | Production readiness (Analytics, E2E tests, Sentry alerts) | 20% | 🟡 PARTIAL | — |

---

## 🤖 REAL ESTATE — ADVANCED Phase (Weeks 9–16)

| Order | Epic | Task | % | Status | Blocker |
|---|---|---|---|---|---|
| 1 | E5 | Agent infrastructure (Paperclip CEO + Hermes config + OpenClaw adapter) — 14 sub-tasks | 0% | 🔴 TODO | E2 + E4 done |
| 2 | E6 | Hermes intelligence (7-factor ranking + taste profiles + market snapshots) | 0% | 🔴 TODO | E5 done |
| 3 | E7 | Contract automation (lease review ≥90%, Gemini Pro) | 0% | 🔴 TODO | E2 done |

---

## 🚀 REAL ESTATE — PRODUCTION Phase (Weeks 17–22)

| Order | Epic | Task | % | Status | Blocker |
|---|---|---|---|---|---|
| 1 | E8 | WhatsApp v2 + multi-channel routing (8 sub-tasks) | 0% | 🔴 TODO | E5 done |
| 2 | Trio | Paperclip + Hermes + OpenClaw integration (`12A–12C`) | 0% | 🔴 TODO | E5–E8 done |

---

## 🔩 INFRASTRUCTURE & QUALITY GATES

| Item | % | Status | Action |
|---|---|---|---|
| Supabase `zkwcbyxiwklihegjhuql` running | 100% | ✅ | — |
| `GEMINI_API_KEY` set | 100% | ✅ | — |
| `INFOBIP_*` keys set | 100% | ✅ | — |
| `sponsor` schema exposed to PostgREST | 100% | ✅ | — |
| `STRIPE_SECRET_KEY` | 100% | ✅ SET | — |
| `STRIPE_WEBHOOK_SECRET` | 100% | ✅ SET | — |
| `STAFF_LINK_SECRET` | 100% | ✅ SET | — |
| `QR_SIGNING_SECRET` | 100% | ✅ SET | — |
| `STRIPE_SPONSOR_CHECKOUT_KEY` (RAK) | 0% | 🔴 NOT SET | Create at dashboard.stripe.com/apikeys |
| Vitest unit tests | 100% | ✅ 243/243 | — |
| Playwright E2E suite | 30% | 🟡 Minimal | Expand for events + sponsor |
| Lighthouse a11y ≥ 90 | 0% | 🔴 NOT RUN | Run on `/host/event/new`, `/me/tickets`, `/host/event/:id`, `/events/:id` |
| Load test 50 concurrent buyers | 0% | 🔴 NOT RUN | Required for Phase 1 gate |
| Admin RBAC server-side | 0% | 🔴 Client-guard only | Add `verify_jwt` + role check in admin edge fns |
| Vercel auto-deploy on `main` | 100% | ✅ | — |

---

## 📈 OVERALL PROGRESS SUMMARY

| Vertical | Done | Total | % |
|---|---|---|---|
| Phase 1 Events (P0) | 10 | 11 | **91%** |
| Phase 1.5 Hardening | 1 | 7 | **14%** |
| Phase 3 Sponsors (core) | 14 | 14 | **100%** |
| Phase 3+ Marketplace | 0 | 7 | **0%** |
| Phase 2 Contests | 6 | 12 | **50%** |
| Real Estate CORE | 0 | 7 | **6%** |
| Real Estate ADVANCED | 0 | 3 | **0%** |
| Real Estate PRODUCTION | 0 | 2 | **0%** |
| Infrastructure / Secrets | 8 | 13 | **62%** |
| **TOTAL** | **39** | **76** | **51%** |
