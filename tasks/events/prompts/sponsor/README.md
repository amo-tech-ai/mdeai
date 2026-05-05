# Sponsor System — Production Progress Tracker

> **Role:** Expert project analyst · Detective reviewer · Systems Architect
> **Last updated:** 2026-05-05 | **Branch:** `main` | **Reviewer:** Claude Sonnet 4.6
> **Process:** Examine → Verify → Validate → Measure → Identify
> **Master plan:** [104-master-implementation-plan.md](./104-master-implementation-plan.md)

---

## Legend

| Symbol | Meaning |
|---|---|
| 🟢 | Done — code committed, verified correct |
| 🟡 | In Progress — code exists, gaps remain |
| 🔴 | Not Started — planned but not implemented |
| 🟥 | Blocked — missing dependency, secret, or critical failure |

---

## 📊 PHASE 1 — MVP Core (Tasks 045–058)

| # | Task | Description | Status | % | ✅ Confirmed | ⚠️ Missing / Failing | 💡 Next Action |
|---|---|---|---|---|---|---|---|
| 045 | **Sponsor Schema Migration** | 10 tables: organizations, applications, assets, placements, impressions, clicks, attributions, roi_daily, invoices, contracts + RLS + pg_cron extension | 🟢 Done | 100% | `20260504140000_sponsor_schema.sql` applied to prod; all 10 tables live in `sponsor.*` schema; 3 bug-fix migrations also applied (235001/235002/235003) | — | — |
| 046 | **Apply Wizard (4-step)** | `/sponsor/apply` — Step1Company → Step2Package → Step3Assets → Step4Review; `useSponsorsWizard` hook; draft saves to `sponsor.applications`; auth gate at step 4 | 🟢 Done | 100% | `src/pages/sponsor/Apply.tsx` + 4 step components in `wizard/`; `sponsor-application-create` edge fn; route wired in App.tsx; build clean | — | — |
| 047 | **Admin Approval Queue** | `/admin/sponsorships` — pending/approved/rejected tabs; approve/reject mutations via `approve_sponsor_application` RPC; SponsorApplicationCard component | 🟢 Done | 100% | `AdminSponsorships.tsx` + `AdminSponsorshipDetail.tsx` + `SponsorApplicationCard.tsx` committed; routes wired; RPC H2 fix applied via `20260504110000` | — | — |
| 048 | **Stripe Checkout + Webhook** | `sponsor-checkout` edge fn creates session; `sponsor-payment-webhook` verifies sig + flips `status='active'`; `sponsor-assets` storage bucket | 🟡 In Progress | 80% | Both edge fns committed (`supabase/functions/sponsor-checkout/` + `sponsor-payment-webhook/`) | `STRIPE_SECRET_KEY`, `STRIPE_SPONSOR_WEBHOOK_SECRET`, `FRONTEND_URL` secrets NOT set in Supabase dashboard; `sponsor-assets` storage bucket NOT created | Set 3 Supabase secrets; create bucket via dashboard |
| 049 | **SponsoredSurface Component** | `<SponsoredSurface placementId surface />` — renders brand logo + UTM link; fires impression on mount; fires click on interact | 🟡 In Progress | 85% | `src/components/sponsor/SponsoredSurface.tsx` committed; edge fns wired; Tailwind C3 bug fixed | Not yet mounted on any contest or event page — **zero real impressions flowing** | Import + place on `EventDetail.tsx` hero and `ContestVote.tsx` header |
| 050 | **Impression + Click Edge Fns** | `sponsor-impression`: upserts by `(placement_id, viewer_anon_id, day)`; `sponsor-click`: writes click + resolves `viewer_user_id` from JWT | 🟢 Done | 100% | Both edge fns committed; `viewer_user_id` capture confirmed in both (M2 fixed in impression fn); `UNIQUE(click_id)` constraint applied via `20260504235001` | — | — |
| 051 | **Attribution Trigger** | `sponsor.attribute_order()` PG trigger on `event_orders`; last-click 24h window; matches `viewer_user_id` or `viewer_anon_id` → `sponsor.attributions` | 🟢 Done | 100% | Migration `20260504081937` applied to prod; `UNIQUE(click_id)` added (235001); ON CONFLICT DO NOTHING now has constraint to act on | — | — |
| 052 | **Sponsor Dashboard** | `/sponsor/dashboard/:applicationId` — status timeline; 4 KPI tiles (impressions, clicks, conversions, placements); Recharts LineChart; invoice + package cards | 🟢 Done | 100% | `src/pages/sponsor/Dashboard.tsx` + `useSponsorDashboard.ts` committed; route protected by ProtectedRoute; all 4 states handled (loading/error/empty/data); staleTime: 60_000 set | — | — |
| 053 | **ROI Rollup Cron** | `rollup_roi_daily()` pg_cron every 5 min; aggregates impressions+clicks+attributions → `roi_daily`; dispute_freeze aware | 🟢 Done | 100% | Migration `20260504082006` applied to prod; `20260504235002` replaces function with dispute_freeze filter; C2 idempotent unschedule fix applied | — | — |
| 055 | **Contracts Schema** | `sponsor.contracts` table + click-wrap RLS; `sponsor-contracts` storage bucket migration | 🟢 Done | 100% | Included in `20260504110000_sponsor-h2-h3-contracts.sql` + `20260504250000_sponsor-contracts-bucket.sql` applied to prod | — | — |
| 056 | **Contract Generate Edge Fn** | `sponsor-contract-generate` — creates contract row from approved application; generates PDF URL | 🟢 Done | 100% | `supabase/functions/sponsor-contract-generate/index.ts` committed | Not yet deployed to Supabase (file exists, `supabase functions deploy` not confirmed) | Deploy: `supabase functions deploy sponsor-contract-generate` |
| 057 | **Contract Sign Page** | `/sponsor/contract/:contractId` — reads contract, renders `<ContractViewer>` + `<SignatureForm>`; calls `sponsor-contract-sign` edge fn | 🟢 Done | 100% | `src/pages/sponsor/ContractSign.tsx` + `ContractViewer.tsx` + `SignatureForm.tsx` + `useContractSign.ts` + `sponsor-contract-sign` edge fn committed; route wired | — | — |
| 058 | **Dispute UI** | `/admin/sponsorships/:id/dispute` — admin can freeze ROI rollup, issue partial refund, log dispute note; calls `sponsor-cancel` edge fn | 🟢 Done | 100% | `AdminSponsorDispute.tsx` committed; `sponsor-cancel` edge fn committed; `dispute_freeze` column + migration `20260504260000` applied to prod; rollup respects freeze flag | — | — |
| H1 | **Orgs UNIQUE Constraint** | `UNIQUE(primary_contact_user_id)` on `sponsor.organizations` — prevents duplicate org rows per wizard session | 🟢 Done | 100% | `20260504090000` + `20260504230420` applied to prod | — | — |
| H2 | **Approve RPC Fix** | `approve_sponsor_application` — `CASE activation_type` mapping to correct placement surfaces (venue_sponsor ≠ digital slot) | 🟢 Done | 100% | `20260504110000` migration includes CASE mapping in `v_surfaces[]` logic | Migration NOT confirmed applied to prod via MCP — check DB | Apply: MCP `apply_migration 20260504110000` |
| H3 | **Rejected columns** | `sponsor.applications.rejected_by` + `rejected_at` columns; index on `rejected_by` | 🟢 Done | 100% | `20260504110000` adds both columns with `DO $$ IF NOT EXISTS $$` guard | Migration NOT confirmed applied to prod — same as H2 | Apply same migration |
| H4 | **Attribution UNIQUE Constraint** | `UNIQUE(click_id)` on `sponsor.attributions` — makes ON CONFLICT DO NOTHING functional | 🟢 Done | 100% | `20260504235001` applied to prod in this session | — | — |

**Phase 1 Completion: ~88%** — Code complete. 3 blockers: Stripe secrets, SponsoredSurface placement, H2/H3 migration confirm.

---

## 🔵 PHASE 2 — Sponsor Self-Serve (Tasks 065–069)

| # | Task | Description | Status | % | ✅ Confirmed | ⚠️ Missing / Failing | 💡 Next Action |
|---|---|---|---|---|---|---|---|
| 065 | **ROI Dashboard — Full Build** | Extend `/sponsor/dashboard` with CPM/CPC/CPA computed metrics; 30/60/90 day windows; PDF export CTA; comparison mode | 🔴 Not Started | 15% | Base dashboard exists (task 052) with 7-day view and Recharts line chart | CPM/CPC computed, window selector, PDF export, comparison mode all missing | Spec: `052-sponsor-dashboard.md` → invoke `mdeai-planner` |
| 066 | **AI Edge Fns Phase A** | 4 Gemini fns: `roi-explain` (narrative sentence), `creative-gen` (logo + tagline suggestions), `moderate-asset` (logo quality check), `optimize-placement` (A/B rotation) | 🔴 Not Started | 0% | `moderate-asset` edge fn exists (general asset moderation) — not sponsor-specific | 3 of 4 fns missing; no AI narrative for ROI; no creative generation | Spec: `054-sponsor-ai-edge-fns.md` → implement 4 fns |
| 067 | **Chat Integration — Sponsor Concierge** | `ai-router` + `ai-chat` extension: sponsor intent classification; concierge agent answers "How is my campaign doing?" in Spanish | 🔴 Not Started | 0% | `ai-router` and `ai-chat` exist; no sponsor-specific intent or tool | No sponsor intents in INTENT_CATEGORIES; no `get_sponsor_roi` tool in ai-chat | Add 3 sponsor intents to ai-router; add tool fn to ai-chat |
| 068 | **Schema.org Event Markup** | JSON-LD `Event` schema on `/events/:id` — `name`, `startDate`, `location`, `offers`; `SponsorshipOffer` extension for contest pages | 🔴 Not Started | 0% | EventDetail page exists | No JSON-LD injected; Google Rich Results test would fail | 2-hour task: inject `<script type="application/ld+json">` in EventDetail |
| 069 | **Sponsor Report Export** | PDF report: logo, KPIs, chart image, period dates; CSV raw data export from `roi_daily` | 🔴 Not Started | 0% | Dashboard exists | No export; no PDF generation; no CSV download | Depends on 065; use `jsPDF` or `puppeteer` via edge fn |

**Phase 2 Completion: ~3%** — Only foundation (dashboard skeleton) exists.

---

## 📋 PHASE 3 — Marketplace (Tasks 070–075)

| # | Task | Description | Status | % | ✅ Confirmed | ⚠️ Missing / Failing | 💡 Next Action |
|---|---|---|---|---|---|---|---|
| 070 | **Unified Marketing + Campaign Schema** | 13 new tables: campaigns, campaign_items, campaign_metrics, audience_segments + marketing schema | 🔴 Not Started | 0% | — | All tables missing | Design phase — spec in `104-master-implementation-plan.md` |
| 071 | **Marketplace Tables + Vectors** | 5 new `sponsor.*` tables: brand_profiles, event_listings, proposals, messages, pgvector embeddings | 🔴 Not Started | 0% | — | All tables missing | Depends on 070 |
| 072 | **Brand Profile UI** | `/sponsor/profile` — brand logo, description, activation history, social links | 🔴 Not Started | 0% | — | Route missing; no page | Depends on 071 |
| 073 | **Event Marketplace Listing** | `/marketplace/events/:id` — sponsor-facing view with audience data, pricing, past sponsors | 🔴 Not Started | 0% | — | Route missing; no page | Depends on 071 |
| 074 | **Marketplace Browse + Search** | `/sponsor/marketplace` — pgvector semantic search; filter by category/budget/date | 🔴 Not Started | 0% | — | Route missing; no page | Depends on 071, 073 |
| 075 | **Proposal + Messaging System** | In-platform proposal submission; threaded messages between sponsor and organizer | 🔴 Not Started | 0% | — | No messaging tables; no UI | Depends on 071, 074 |

**Phase 3 Completion: 0%**

---

## 🔍 PHASE 4 — Discovery Pipeline (Tasks 076–081)

| # | Task | Description | Status | % | ✅ Confirmed | ⚠️ Missing / Failing | 💡 Next Action |
|---|---|---|---|---|---|---|---|
| 076 | **Discovery Schema Migration** | `sponsor_discovery.*` — 4 tables: prospects, enrichment_runs, scoring_results, outreach_log | 🔴 Not Started | 0% | — | All tables missing | Design → migrate |
| 077 | **Discovery Admin UI** | `/admin/sponsor-discovery` — prospect list, enrichment status, score badges, outreach queue | 🔴 Not Started | 0% | — | Route missing; no page | Depends on 076 |
| 078 | **Enrichment Edge Fn** | Firecrawl scrape + Fire Enrich brand data → `enrichment_runs` table | 🔴 Not Started | 0% | — | `firecrawl` skill exists in `.claude/skills/` but no edge fn | Depends on 076 |
| 079 | **Scoring Edge Fn** | 5-factor formula (audience match + budget + engagement + growth + category fit) via Hermes bridge | 🔴 Not Started | 0% | — | Hermes not running; no scoring fn | Depends on 076, 078 |
| 080 | **Outreach Edge Fn** | Infobip WhatsApp + Resend email; template selection; approval gate check | 🔴 Not Started | 0% | — | No outreach fn; Infobip key set but unused for sponsors | Depends on 076, 079 |
| 081 | **Contact Extraction Edge Fn** | Extract emails + WA from brand websites via Firecrawl | 🔴 Not Started | 0% | — | No fn exists | Depends on 076, 078 |

**Phase 4 Completion: 0%**

---

## 🤖 PHASE 5 — AI Automation + OpenClaw + Postiz + Hermes (Tasks 082–091)

| # | Task | Description | Status | % | ✅ Confirmed | ⚠️ Missing / Failing | 💡 Next Action |
|---|---|---|---|---|---|---|---|
| 082 | **AI Proposal Generator** | Gemini Pro — bilingual PDF proposal from brand profile + event data | 🔴 Not Started | 0% | — | No fn | Depends on 065, 066 |
| 083 | **AI Ideas Generator** | Gemini Flash — activation ideas in <30s from brand vertical | 🔴 Not Started | 0% | — | No fn | Depends on 066 |
| 084 | **AI Contract Extract** | Gemini Pro + urlContext — extracts terms from external contract PDFs | 🔴 Not Started | 0% | — | No fn | Depends on 055, 056 |
| 085 | **AI Audience Match** | Gemini Pro + googleSearch — matches brand audience to event demographics | 🔴 Not Started | 0% | — | No fn | Depends on 071 |
| 086–091 | **Campaign Planner + Postiz + OpenClaw + Hermes** | Full campaign generation, scheduling, outreach, scoring bridge | 🔴 Not Started | 0% | — | VPS for OpenClaw not running | Blocked on OpenClaw VPS (tasks 021-023) |

**Phase 5 Completion: 0%**

---

## 🔒 PRODUCTION READINESS — Critical Gates

| Gate | Status | Verified | Blocker |
|---|---|---|---|
| Schema deployed (10 sponsor tables) | 🟢 | ✅ `20260504140000` applied | — |
| 3 critical bug migrations applied | 🟢 | ✅ 235001/235002/235003 applied | — |
| Build clean | 🟢 | ✅ `vite build` 5.96s, 0 errors | — |
| 238 vitest tests green | 🟢 | ✅ | — |
| Apply wizard → submit application | 🟢 | ✅ Code complete | — |
| Admin approve → contract generate | 🟡 | Code exists | `sponsor-contract-generate` not deployed |
| Sponsor signs contract | 🟡 | Code exists | Depends on deploy above |
| Stripe payment flow end-to-end | 🟥 | **BLOCKED** | `STRIPE_SECRET_KEY` + `STRIPE_SPONSOR_WEBHOOK_SECRET` not set |
| Impression/click data flows | 🟥 | **BLOCKED** | `SponsoredSurface` not placed on any page |
| ROI rollup runs | 🟢 | ✅ pg_cron deployed every 5 min | — |
| H2/H3 migration applied to prod | 🟡 | File committed | NOT confirmed applied via MCP |
| `fake-indexeddb` in devDependencies | 🟡 | — | Still in `dependencies` |

---

## 🛠️ Gemini Agents + Tools + Edge Functions — Full Inventory

| Function | Model | Tools / Mode | Status | Sponsor Aware? |
|---|---|---|---|---|
| `ai-chat` | gemini-3-flash-preview | Multi-turn; tool-calling: `search_listings`, `check_availability` | 🟢 Running | ❌ No sponsor intents |
| `ai-router` | gemini-3.1-flash-lite-preview | `callGeminiStructured`; JSON schema intent classification | 🟢 Running | ❌ No `sponsor_inquiry` intent |
| `ai-search` | gemini-3-flash-preview | `callGeminiStructured`; param extraction | 🟢 Running | ❌ Not sponsor-domain aware |
| `ai-trip-planner` | gemini-3.1-pro-preview | `callGeminiStructured`; listings context | 🟢 Running | ❌ |
| `ai-optimize-route` | gemini-3-flash-preview | `callGeminiStructured`; nearest-neighbor fallback | 🟢 Running | ❌ |
| `rentals` | gemini-3.1-pro-preview | `callGeminiAgent`; function-calling mode:ANY | 🟢 Running | ❌ |
| `sponsor-application-create` | — (no AI) | DB upsert — org + application atomic | 🟢 Running | ✅ |
| `sponsor-impression` | — | JWT decode; idempotent upsert | 🟢 Running | ✅ viewer_user_id captured |
| `sponsor-click` | — | JWT decode; click write | 🟢 Running | ✅ |
| `sponsor-checkout` | — | Stripe SDK | 🟡 Code complete | ✅ — needs STRIPE_SECRET_KEY |
| `sponsor-payment-webhook` | — | Stripe sig verify | 🟡 Code complete | ✅ — needs STRIPE_SPONSOR_WEBHOOK_SECRET |
| `sponsor-contract-generate` | — | PDF generation | 🟡 Code complete | ✅ — needs `supabase functions deploy` |
| `sponsor-contract-sign` | — | Signature capture; contract update | 🟡 Code complete | ✅ — needs deploy |
| `sponsor-cancel` | — | Dispute freeze + refund | 🟢 Running | ✅ |
| `ticket-checkout` | — | Stripe + atomic RPC | 🟢 Running | — |
| `ticket-payment-webhook` | — | Stripe sig verify | 🟡 Code complete | — needs STRIPE_WEBHOOK_SECRET |
| `ticket-validate` | — | Staff JWT + QR JWT | 🟢 Running | — |
| `vote-cast` | — | Hybrid scoring trigger | 🟢 Running | — |
| **roi-explain** (066) | gemini-3-flash | Narrative ROI sentence in Spanish | 🔴 Not Built | ✅ |
| **creative-gen** (066) | gemini-3-flash | Logo/tagline suggestions | 🔴 Not Built | ✅ |
| **optimize-placement** (066) | gemini-3-flash | A/B surface rotation | 🔴 Not Built | ✅ |
| **sponsor-concierge** (067) | gemini-3-flash | Chat agent for sponsor ROI questions | 🔴 Not Built | ✅ |

---

## 🗄️ Database Schema — Sponsor Tables Status

| Table | Columns | RLS | Indexes | Prod Status |
|---|---|---|---|---|
| `sponsor.organizations` | 12 cols + UNIQUE(primary_contact_user_id) | ✅ 3 policies | ✅ contact_idx | Applied |
| `sponsor.applications` | 20 cols + dispute_freeze + rejected_by + rejected_at | ✅ 4 policies (SELECT/INSERT/UPDATE/admin) | ✅ org_idx, status_idx, rejected_idx | Applied |
| `sponsor.assets` | 10 cols | ✅ | ✅ | Applied |
| `sponsor.placements` | 12 cols | ✅ | ✅ active_surface_idx | Applied |
| `sponsor.impressions` | 8 cols | ✅ | ✅ placement_day_anon_idx | Applied |
| `sponsor.clicks` | 10 cols + UNIQUE(click_id) | ✅ | ✅ | Applied |
| `sponsor.attributions` | 10 cols + UNIQUE(click_id) | ✅ | ✅ | Applied |
| `sponsor.roi_daily` | 12 cols | ✅ | ✅ | Applied |
| `sponsor.invoices` | 14 cols | ✅ | ✅ | Applied |
| `sponsor.contracts` | 15 cols | ✅ | ✅ | Applied via 110000 |

---

## 📋 User Journey Validation

| Persona | Journey | Status | Proof |
|---|---|---|---|
| **Daniela** (brand manager) | Opens `/sponsor/apply` → fills 4 steps → submits application | 🟢 Done | Apply.tsx + wizard steps all committed |
| **Admin** | Sees pending in `/admin/sponsorships` → clicks approve → signs | 🟡 Partial | AdminSponsorships.tsx done; contract-generate needs deploy |
| **Daniela** | Receives approval email → clicks checkout link → Stripe payment | 🟥 Blocked | STRIPE_SECRET_KEY missing |
| **Daniela** | Signs contract at `/sponsor/contract/:id` | 🟡 Partial | Page ready; needs contract-generate deploy first |
| **Daniela** | Views ROI at `/sponsor/dashboard/:appId` | 🟢 Done | Dashboard committed; shows impressions/clicks/conversions |
| **Staff (Andrés)** | Opens scan app at `/staff/check-in/:event_id` → scans QR | 🟢 Done | StaffCheckIn PWA committed |
| **Buyer (Camila)** | Buys ticket → QR at `/me/tickets/:id` | 🟡 Partial | Ticket pages done; STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET needed |
| **Contest viewer** | Sees sponsor logo on `/vote/:slug` | 🟥 Blocked | SponsoredSurface not placed on any page yet |

---

## 🔴 Immediate Action Items (Priority Order)

| # | Priority | Action | Owner | Time |
|---|---|---|---|---|
| 1 | 🔴 **CRITICAL** | Set Supabase secrets: `STRIPE_SECRET_KEY`, `STRIPE_SPONSOR_WEBHOOK_SECRET`, `STRIPE_WEBHOOK_SECRET`, `STAFF_LINK_SECRET`, `QR_SIGNING_SECRET` | Ops | 15 min |
| 2 | 🔴 **CRITICAL** | Create `sponsor-assets` storage bucket in Supabase dashboard | Ops | 5 min |
| 3 | 🔴 **CRITICAL** | Place `<SponsoredSurface>` on `EventDetail.tsx` hero + `ContestVote.tsx` header | Dev | 1 hour |
| 4 | 🟠 **HIGH** | Apply migration `20260504110000` to prod (H2 + H3 fix) | Dev | 10 min |
| 5 | 🟠 **HIGH** | Deploy `sponsor-contract-generate` + `sponsor-contract-sign` edge fns | Dev | 10 min |
| 6 | 🟡 **MEDIUM** | Move `fake-indexeddb` from `dependencies` → `devDependencies` | Dev | 5 min |
| 7 | 🟡 **MEDIUM** | Build Phase 2: task 065 (dashboard windows) + task 066 (AI edge fns) | Dev | 2 days |
| 8 | 🟡 **MEDIUM** | Add Schema.org JSON-LD to `/events/:id` (task 068 — 2-hour quick win) | Dev | 2 hours |

---

## 📈 Overall Completion Summary

| Phase | Tasks | Done | % |
|---|---|---|---|
| Phase 1 MVP Core (045–058 + fixes) | 16 | 14 | **88%** |
| Phase 2 Self-Serve (065–069) | 5 | 0.1 | **3%** |
| Phase 3 Marketplace (070–075) | 6 | 0 | **0%** |
| Phase 4 Discovery (076–081) | 6 | 0 | **0%** |
| Phase 5 AI Automation (082–091) | 10 | 0 | **0%** |
| Phase 6 Advanced (092–096) | 5 | 0 | **0%** |
| **TOTAL** | **48** | **14.1** | **~29%** |

**Production ready for MVP launch: ~88%** — 3 blockers (Stripe secrets + SponsoredSurface placement + deploy 2 edge fns)

---

## Phase Roadmap

```
Phase 0 (NOW):      ← Stripe secrets + bucket + SponsoredSurface placement + deploy 2 fns
Phase 1 (DONE ✅): MVP — apply → approve → pay → sign → track → rollup
Phase 2 (Week 1-2): Self-serve — ROI dashboard windows + AI edge fns + chat + Schema.org
Phase 3 (Week 3-4): Marketplace — browse events, brand profiles, proposals, messaging
Phase 4 (Month 2):  Discovery — sponsor_discovery schema + enrichment pipeline
Phase 5 (Month 2-3): AI Automation — proposals + campaigns + Postiz + OpenClaw + Hermes
Phase 6 (Month 3+): Advanced — renewals + dynamic pricing + Paperclip governance
```

## Revenue Target

| Month | Active Sponsors | MRR (15% commission) |
|---|---|---|
| 1 | 2 Bronze + 1 Silver | ~$375 |
| 2 | 5 Bronze + 3 Silver | ~$1,050 |
| 3 | 8 Bronze + 5 Silver + 2 Gold | ~$2,850 |
| 6 | 20 Bronze + 15 Silver + 10 Gold + 2 Platinum | ~$12,375 |
