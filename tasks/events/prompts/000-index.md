# Events MVP — Task Index

> **Purpose.** Implementation prompts for the events initiative. **Phase 1 = Events + Tickets MVP** (locked May 2, 2026 per `index-events.md` §6 Decision: B). **Tasks numbered 001–044** across 4 phases (events MVP + contests + Phase 1.5 hardening + Phase 2 ops + venue track). Execute in **build order** (per phase below) — not strictly numerical, since some Phase 1 tasks (e.g., 034) were written after Phase 2 task slots, and some venue tasks (035–044) span all phases. Build order respects `depends_on` for parallel branching.

**Source-of-truth chain (per [`/home/sk/mde/system.md`](/home/sk/mde/system.md)):**
> PRD ([`../100-events-prd.md`](../100-events-prd.md)) → User Stories ([`../15-user-stories.md`](../15-user-stories.md)) → Diagrams ([`../diagrams/`](../diagrams/)) → **Tasks (this folder)** → Implementation → Milestones

---

## Phase split (locked 2026-05-02; expanded 2026-05-03 with audit fixes + founder schema additions)

| Phase | Name | Tasks | Effort | What ships |
|---|---|---|---|---|
| **PHASE-1-EVENTS** (current) | Events + Tickets MVP | 001–009, 034 (10 tasks) | ~16 dev-days = **3.5 weeks** | Schema (6 tables), wizard, dashboard, Stripe checkout, QR door scan with audit log, chatbot creation, staff-link generator |
| **PHASE-1.5-EVENTS** (fast-follow) | Compliance + media + ops hardening | 025, 026, 027, 030, 033 (5 tasks) | ~3 dev-days = ~1 week | Promo codes, refund history, IVA 19% + service fees, **media assets table (logos/galleries/flyers)**, dedicated event-photo moderator |
| **PHASE-2-CONTESTS** | Contest engine (voting layer on Phase 1 events) | 010–024 (15 tasks) | ~19 dev-days = ~4 weeks | Voting, hybrid scoring, fraud defense, Trust page |
| **PHASE-2-EVENTS** | Production-ops layer | 028–032 (5 tasks) | ~2.5 dev-days = ~1 week | Stakeholders, vendors, media assets, sponsors-link, attendee profiles |
| **PHASE-2-MARKETING** | Campaign builder + Postiz + referral attribution | 059–066 (8 tasks) | ~6.5 dev-days = ~1.5 weeks | marketing.* schema, Gemini content plan, Postiz scheduling, OpenClaw outreach, referral tracking, analytics |
| **PHASE-2-OPENCLAW** | OpenClaw VPS automation layer | 067–070 (4 tasks) | ~3.5 dev-days = ~1 week | Delivery webhook, WhatsApp concierge, browser DM outreach, A6 attendance confirmation |
| **PHASE-3-SPONSORS** | Full sponsorship system | 045–058 (14 tasks) | ~10 dev-days = ~2 weeks | sponsor.* schema, apply wizard, Stripe checkout, ROI dashboard, contracts, dispute UI |
| **PHASE-3-RESTAURANT** | Native restaurant reservations | 071–072 (2 tasks) | ~2 dev-days | restaurant.* schema, race-safe booking edge fn + UI |
| **PHASE-4-AI** | AI orchestration | TBD | ~6 weeks | Hermes + Paperclip + trio runtime |

**Total to v1.0:** ~17 weeks. Phase 1 unblocks first revenue (~$3k from one mid-size event).

> **Renumbering note (2026-05-03):** Phase 1 events are 001–009 (was 100–108). Phase 2 contests are 010–024 (was 001–015). Phase 1.5 + Phase 2 events fill 025–034. Internal `task_id`, `depends_on`, and "See also" links are auto-updated. Task 034 is logically Phase 1 P0 (numbering = order-of-write, not phase) — see Phase 1 build order below.

---

## PHASE-1-EVENTS acceptance gate

Cannot start Phase 2 without **all** of these green:

- ✅ One organizer (Sofía or test) self-serves an event from `/host/event/new` end-to-end without engineering help.
- ✅ One attendee (test buyer) buys via Stripe → email arrives with PDF + .ics → QR shown at `/me/tickets`.
- ✅ One door staff scans the QR → green ✓; second scan returns red ✗ ALREADY_USED; **scan logged to `event_check_ins` audit table**.
- ✅ Sofía's dashboard reconciles to the cent against Stripe Dashboard.
- ✅ Load test: 50 concurrent buyers on a 10-ticket tier → exactly 10 sold, 40 declined, 0 oversell.
- ✅ Revoking a leaked staff link (bumping `staff_link_version`) immediately invalidates outstanding scanner JWTs.
- ✅ Lighthouse a11y ≥ 90 on all 4 new screens.
- ✅ All 4 data states handled per `style-guide.md` on every new component.
- ✅ RLS audit clean (`get_advisors`); zero `SECURITY DEFINER` functions without `GRANT EXECUTE ... TO service_role` lockdown.
- ✅ No regressions on `/events`, `/event/:id`, `/saved`.
- ✅ `npm run build` and `npm run test` pass; bundle delta within budget.

---

## Phase 1 build order (10 tasks, ~16 dev-days)

**Topological — not strict numerical** since task 034 was written after the Phase 2 tasks but logically belongs here:

```
001 (schema) ──┬──→ 002 (wizard) ──→ 003 (dashboard) ──→ 034 (staff-link-gen)
               │                  └─→ 009 (chatbot)
               ├──→ 004 (checkout) ──→ 005 (webhook) ──┬──→ 006 (validate) ──→ 007 (PWA scanner)
               │                                       │
               │                                       └──→ 008 (me/tickets + EventDetail extension)
               └──→ (none direct)
```

| Order | # | Task | Surface | Story | Effort | Depends on |
|---|---|---|---|---|---|---|
| 1 | 001 | [event-schema-migration](./archive/001-event-schema-migration.md) | schema (6 tables) | S-O-1, S-O-2, S-A-3, S-D-2 | 1.5d | — |
| 2 | 002 | [host-event-new-wizard](./archive/002-host-event-new-wizard.md) | wizard | S-O-1, S-O-2, S-O-3 | 3d | 001 |
| 3 | 003 | [host-event-dashboard](./archive/003-host-event-dashboard.md) | dashboard | S-O-4, S-O-5 | 2d | 001, 002 |
| 4 | 004 | [ticket-checkout-edge-fn](./archive/004-ticket-checkout-edge-fn.md) | edge fn | S-A-3 | 2d | 001 |
| 5 | 005 | [ticket-payment-webhook](./archive/005-ticket-payment-webhook.md) | edge fn | S-A-3, S-A-4 | 1d | 001, 004 |
| 6 | 006 | [ticket-validate-edge-fn](./archive/006-ticket-validate-edge-fn.md) | edge fn | S-D-2 | 1d | 001, 005, 034 |
| 7 | 007 | [staff-checkin-pwa](./archive/007-staff-checkin-pwa.md) | PWA | S-D-1, S-D-2, S-D-3 | 1.5d | 006 |
| 8 | 008 | [me-tickets-page](./archive/008-me-tickets-page.md) | page + extension | S-A-2, S-A-4 | 1d | 001, 005 |
| 9 | 009 | [chatbot-event-creation](./archive/009-chatbot-event-creation.md) | chatbot | S-O-1 (alt entry) | 2d | 001, 002, 004 |
| 10 | 034 | [event-staff-link-generator](./archive/034-event-staff-link-generator-edge-fn.md) | edge fn | S-O-5 | 0.5d | 001 |
| **Total** | | | | | **~16d ≈ 3.5 weeks** | |

**Parallel opportunities** (after 001):
- 002 + 004 + 034 in parallel (front-end vs back-end vs edge fn)
- 003 + 009 wait for 002; 003 also waits for 034 (uses staff-link gen)
- 006 starts after 005 + 034 land; 007 + 008 in parallel after 006

**Note on priority P1 vs P0** (audit M5): Task 009 (chatbot) is `priority: P1` — it ships *within* Phase 1 but does NOT block launch. If Phase 1 timeline slips, 009 fast-follows in Phase 1.5. Tasks 001–008 and 034 are all P0 = launch blockers.

### Surface coverage (founder requested: wizards, forms, dashboards, chatbot all included)

| Surface | Task(s) | Description |
|---|---|---|
| **Schema** | 001 | Foundation — events ALTER + 5 new tables (venues, tickets, orders, attendees, check_ins) + triggers + RPCs |
| **Wizard** | 002 | 4-step organizer wizard with auto-save |
| **Forms** | 002 (within wizard), 008 (within EventDetail) | All forms use react-hook-form + Zod per `style-guide.md` |
| **Dashboard** | 003 | Organizer KPIs + attendees + Realtime + check-in audit panel |
| **Edge functions** | 004, 005, 006, 034 | checkout / webhook / validate / staff-link-gen |
| **PWA / Scanner** | 007 | Door staff offline-first scanner |
| **Buyer pages** | 008 | `/me/tickets` + EventDetail extension |
| **Chatbot** | 009 | Natural-language event creation via existing `ai-chat` edge fn |

---

## Phase 1.5 build order (5 tasks, ~3 dev-days)

Compliance + media + ops hardening — ships immediately after Phase 1 launch. Each task is independent of the others; can run in parallel.

| # | Task | Why now | Effort |
|---|---|---|---|
| 025 | [event-promo-codes-schema](./archive/025-event-promo-codes-schema.md) | Sponsor comp tickets, VIP unlocks, group discounts (HE-2 critical gap) | 0.5d |
| 026 | [event-order-refunds-schema](./archive/026-event-order-refunds-schema.md) | Audit trail per refund; partial-refund support; chargeback reconciliation | 0.5d |
| 027 | [event-taxes-and-fees-schema](./archive/027-event-taxes-and-fees-schema.md) | Colombia IVA 19% compliance — required for legal organizer invoicing | 1d |
| 030 | [event-media-assets-schema](./archive/030-event-media-assets-schema.md) | **Moved up from Phase 2 (2026-05-03 review).** Persistence layer for task 033 verdicts; sponsor logos arrive in informal P1.5 sponsor convos before P3 sponsor.* schema | 0.5d |
| 033 | [event-photo-moderate-edge-fn](./archive/033-event-photo-moderate-edge-fn.md) | Replaces `listing-moderate` (landlord-specific) dependency in task 002 wizard. Pairs with task 030 above (same phase) | 0.5d |
| ✅ 045 | [~~gemini-native-sdk-migration~~](./archive/045-gemini-native-sdk-migration.md) | Migrate `_shared/gemini.ts` from OpenAI-compat → `@google/genai` native SDK. **DONE 2026-05-03 — task file archived at `archive/045-gemini-native-sdk-migration.md`.** ⚠️ **Number conflict:** `prompts/045-sponsor-schema-migration.md` is a DIFFERENT task (Phase 3 sponsors). Sponsor tasks reuse numbers 045–058 in the active `prompts/` dir; gemini tasks 045/046 live in `archive/`. | 1d |
| ✅ 046 | [~~gemini-skill-housekeeping~~](./archive/046-gemini-skill-housekeeping.md) | Patch `.claude/skills/gemini/SKILL.md`. **DONE 2026-05-03 — task file archived at `archive/046-gemini-skill-housekeeping.md`.** ⚠️ **Number conflict:** `prompts/046-sponsor-apply-wizard.md` is a DIFFERENT task (Phase 3 sponsors). See PHASE-3-SPONSORS section below. | 0.5d |

---

## Phase 2 contests build order (15 tasks, topological — NOT numerical)

Audit #1 B5 fix + audit #2 clarification: layer-batching is permissive, not strict. Each task only waits for its **explicit** `depends_on` — see frontmatter on each file. The layers below are a **suggested batching** for parallel execution, NOT a hard ordering.

```
Layer 1 (no deps):       010 (vote-schema), 016 (phone-otp), 021 (openclaw-vps)
Layer 2 (after 010):     014 (hybrid-scoring), 015 (turnstile), 020 (gemini-photo-moderate)
Layer 3 (specific deps):
   • 011 (vote-cast)  ← needs 010 + 015 + 016 (NOT 020 — clarified per audit #2)
   • 018 (contestant-intake) ← needs 010 + 020
   • 019 (admin-moderation) ← needs 010 + 020
   • 022 (broadcast-skill) ← needs 010 + 014 + 021
Layer 4 (after L3):      012 (vote-page) ← 011; 013 (realtime-leaderboard) ← 012; 017 (fraud-scan-cron) ← 011 + 014; 023 (pg-cron-backstop) ← 022; 024 (trust-page) ← 014
```

> **Audit #2 dependency lint:** Run `rg '^depends_on:' tasks/events/prompts/*.md` and reconcile against this layer table. Where they disagree, **YAML wins** (it's the build-time source of truth). Update the layer table here when YAML changes.

| Layer | # | Task |
|---|---|---|
| 1 | 010 | [vote-schema](./010-vote-schema.md) |
| 1 | 016 | [phone-otp](./016-phone-otp.md) |
| 1 | 021 | [openclaw-vps-provision](./021-openclaw-vps-provision.md) |
| 2 | 014 | [hybrid-scoring-trigger](./014-hybrid-scoring-trigger.md) |
| 2 | 015 | [cloudflare-turnstile](./015-cloudflare-turnstile.md) |
| 2 | 020 | [gemini-photo-moderation](./020-gemini-photo-moderation.md) |
| 3 | 011 | [vote-cast-edge-fn](./011-vote-cast-edge-fn.md) |
| 3 | 018 | [contestant-intake-form](./018-contestant-intake-form.md) |
| 3 | 019 | [admin-moderation-page](./019-admin-moderation-page.md) |
| 3 | 022 | [leaderboard-broadcast-skill](./022-leaderboard-broadcast-skill.md) |
| 4 | 012 | [vote-page-mobile](./012-vote-page-mobile.md) |
| 4 | 013 | [realtime-leaderboard](./013-realtime-leaderboard.md) |
| 4 | 017 | [fraud-scan-cron](./017-fraud-scan-cron.md) |
| 4 | 023 | [pg-cron-backstop](./023-pg-cron-backstop.md) |
| 4 | 024 | [trust-page](./024-trust-page.md) |

Frontmatter `phase` field on tasks 010–024 = `PHASE-2-CONTESTS` (010 already updated 2026-05-03; 011–024 to be batch-flipped from `CORE` when Phase 2 begins).

---

## Phase 2 events build order (4 tasks, ~2 dev-days)

Production-ops layer — ships alongside or after Phase 2 contests. Tasks are mostly independent. Note: 030 (media assets) moved to Phase 1.5 per 2026-05-03 review.

| # | Task | Effort | Why deferred to Phase 2 (not earlier) |
|---|---|---|---|
| 028 | [event-stakeholders-schema](./028-event-stakeholders-schema.md) — planners, hosts, judges, sponsor contacts | 0.5d | Phase 1 has zero stakeholders besides organizer; judges arrive with contest engine in Phase 2 |
| 029 | [event-vendors-schema](./029-event-vendors-schema.md) — photographer, AV, security, catering | 0.5d | Vendor tracking only matters once organizer runs 2nd+ event at the same venue |
| 031 | [event-sponsors-link-schema](./031-event-sponsors-link-schema.md) — bridges events ↔ Phase 3 `sponsor.*` schema | 0.5d | Bridge table to Phase 3 sponsor system; nothing to bridge until sponsor.* lands |
| 032 | [event-attendee-profiles-schema](./032-event-attendee-profiles-schema.md) — dietary/accessibility/company | 0.5d | Pageant + concert Phase 1 events don't ask dietary; first need = sit-down gala in Phase 2+ |

---

## Venue Management System (Phase 1-4 across all phases — 10 tasks total, ~10 dev-days)

Per `100-events-prd.md` §8.5, venue management phases in incrementally without bloating Phase 1. **Phase 1 venue support = 0.5d (task 035) — does not delay ticketing launch.** Built only the 6 core + 5 AI features that earn or save real money; deferred 4 core + 5 AI features that need volume to be useful.

### Phase 1 venue (1 task, 0.5d) — minimal, ships with Phase 1

| # | Task | Effort |
|---|---|---|
| 035 | [venue-picker-in-wizard](./035-venue-picker-in-wizard.md) — autocomplete saved venues + inline create-new in `/host/event/new` | 0.5d |

### Phase 2 venue (4 tasks, ~3.5d) — operational tools

| # | Task | Effort |
|---|---|---|
| 036 | [event-venue-resources-schema](./036-event-venue-resources-schema.md) — AV / catering / furniture inventory | 0.5d |
| 037 | [event-venue-staff-schema](./037-event-venue-staff-schema.md) — venue-side roster (security, AV, catering ops) | 0.5d |
| 038 | [event-venue-availability-schema](./038-event-venue-availability-schema.md) — open/blocked windows + iCal RRULE | 1d |
| 039 | [host-venue-management-page](./039-host-venue-management-page.md) — `/host/venues` UI with 4 tabs | 1.5d |

### Phase 3 venue (3 tasks, ~3d) — enterprise booking + analytics

| # | Task | Effort |
|---|---|---|
| 040 | [event-venue-layouts-schema](./040-event-venue-layouts-schema.md) — floor plans + zones (theater/banquet/reception) | 1d |
| 041 | [event-venue-bookings-schema](./041-event-venue-bookings-schema.md) — `EXCLUDE USING gist` race-safe scheduler + contracts | 1d |
| 042 | [venue-analytics-dashboard](./042-venue-analytics-dashboard.md) — utilization, revenue, resource cost, staff hours | 1d |

### Phase 4 venue (2 tasks, ~3d) — AI optimization

| # | Task | Effort |
|---|---|---|
| 043 | [ai-venue-optimizer-edge-fn](./043-ai-venue-optimizer-edge-fn.md) — pricing + scheduling + resource allocation (3-in-1) | 1.5d |
| 044 | [ai-venue-layout-generator-edge-fn](./044-ai-venue-layout-generator-edge-fn.md) — propose floor plans from event metadata | 1d |

### Venue features deliberately deferred (per "no over-engineering")

| Feature category | Reason | Phase planned |
|---|---|---|
| Online booking portal (clients book venue directly) | Only when first venue partner asks; today organizers create their own events | Phase 4+ |
| Venue-side CRM (client history, repeat-buyer tracking) | Phase 3 `sponsor.*` already covers org-level CRM | Phase 3 (covered) |
| Contract management with e-signature | Native Stripe Checkout + email receipts cover P3; full e-sign needs DocuSign/HelloSign integration | Phase 3+ extension |
| Invoicing for organizer-side billing | Phase 3 sponsor system has invoicing; venue side reuses pattern when needed | Phase 3 (covered) |
| AI demand forecasting | Needs ≥6 months of bookings — premature optimization | Phase 5+ |
| AI lead scoring (CRM) | Phase 4 sponsor system covers org lead scoring | Phase 4 (covered there) |
| AI marketing automation | Already covered by `02-openclaw-growth.md` outreach work | Phase 3 (covered) |
| AI anomaly detection (overbooking) | Phase 3 task 041 prevents double-booking via PostgreSQL `EXCLUDE USING gist` constraint — DB-enforced is stronger than AI-detected | Built in via 041 |
| AI resource allocator (separate fn) | Folded into task 043 ai-venue-optimizer (3-in-1 fn) | Built in via 043 |
| AI post-event insights (separate fn) | Already covered by diagram 15 (`ai-roi-optimization-loop`) + sponsor ROI explainer | Phase 4 (covered there) |

---

## PHASE-3-SPONSORS build order (14 tasks, ~10 dev-days)

Full sponsorship system — brands apply, pay, get ROI dashboards, sign contracts, handle disputes. Tasks 045–058 are on disk; this section documents their phase membership.

> **Numbering note (2026-05-03 audit):** `prompts/045–058` are the active sponsor task files. `archive/045` and `archive/046` are the completed gemini tasks sharing those numbers — they are different tasks. The gemini tasks were completed and archived first; the sponsor tasks were later assigned numbers starting at 045 before the conflict was noticed. Resolution: treat `archive/` and `prompts/` as separate namespaces. The gemini tasks are done and will never be re-run.

| # | Task | Effort | Phase |
|---|---|---|---|
| 045 | [sponsor-schema-migration](045-sponsor-schema-migration.md) — 9-table `sponsor.*` schema + RLS | 1d | PHASE-3-SPONSORS |
| 046 | [sponsor-apply-wizard](046-sponsor-apply-wizard.md) — `/sponsor/apply` multi-step wizard | 1d | PHASE-3-SPONSORS |
| 047 | [sponsor-admin-queue](047-sponsor-admin-queue.md) — `/admin/sponsorships` review queue | 1d | PHASE-3-SPONSORS |
| 048 | [sponsor-stripe-checkout](048-sponsor-stripe-checkout.md) — Stripe Checkout + webhook | 1d | PHASE-3-SPONSORS |
| 049 | [sponsor-surface-component](049-sponsor-surface-component.md) — `<SponsoredSurface>` + impression tracking | 0.5d | PHASE-3-SPONSORS |
| 050 | [sponsor-impression-click-edge-fns](050-sponsor-impression-click-edge-fns.md) — impression/click logging edge fns | 0.5d | PHASE-3-SPONSORS |
| 051 | [sponsor-attribution-trigger](051-sponsor-attribution-trigger.md) — downstream conversion attribution trigger | 0.5d | PHASE-3-SPONSORS |
| 052 | [sponsor-dashboard](052-sponsor-dashboard.md) — `/sponsor/dashboard/:id` ROI dashboard | 1d | PHASE-3-SPONSORS |
| 053 | [sponsor-roi-rollup-cron](053-sponsor-roi-rollup-cron.md) — pg_cron 5-min `roi_daily` rollup | 0.5d | PHASE-3-SPONSORS |
| 054 | [sponsor-ai-edge-fns](054-sponsor-ai-edge-fns.md) — Gemini ROI explainer + creative generator | 1d | PHASE-3-SPONSORS |
| 055 | [sponsor-contracts-schema](055-sponsor-contracts-schema.md) — `sponsor.contracts` + `sponsor.invoices` | 0.5d | PHASE-3-SPONSORS |
| 056 | [sponsor-contract-generate-edge-fn](056-sponsor-contract-generate-edge-fn.md) — Gemini-generated contract PDF | 0.5d | PHASE-3-SPONSORS |
| 057 | [sponsor-contract-sign-page](057-sponsor-contract-sign-page.md) — click-wrap signing UI | 0.5d | PHASE-3-SPONSORS |
| 058 | [sponsor-dispute-ui](058-sponsor-dispute-ui.md) — `/admin/sponsorships/:id/dispute` + `sponsor-cancel` edge fn | 0.5d | PHASE-3-SPONSORS |

**Topological build order:** 045 → 046 → 047 → 048 → 049 + 050 → 051 → 052 → 053 → 054 → 055 → 056 → 057 → 058

---

## PHASE-2-MARKETING build order (8 tasks, ~6.5 dev-days)

Closed-loop marketing system: AI generates campaign → human approves → Postiz schedules social posts → OpenClaw sends WhatsApp/Telegram outreach → referral attribution flows back to sponsor CPL.

**Human-approval gate is mandatory.** No message is ever sent without `marketing.campaign_approvals.status='approved'`.

| # | Task | Effort | Depends on |
|---|---|---|---|
| 059 | [marketing-schema-migration](./059-marketing-schema-migration.md) — 13-table `marketing.*` schema | 1d | 001, 045 |
| 060 | [campaign-builder-ui](./060-campaign-builder-ui.md) — `/host/event/:id/campaigns` wizard | 1d | 059, 061 |
| 061 | [campaign-generate-plan-edge-fn](./061-campaign-generate-plan-edge-fn.md) — Gemini Flash 14-day content plan | 1d | 059 |
| 062 | [campaign-approve-flow](./062-campaign-approve-flow.md) — `campaign-approve` edge fn + admin queue | 0.5d | 059, 060 |
| 063 | [postiz-schedule-posts-edge-fn](./063-postiz-schedule-posts-edge-fn.md) — schedule approved posts to Postiz | 1d | 059, 062 |
| 064 | [openclaw-outreach-edge-fns](./064-openclaw-outreach-edge-fns.md) — `openclaw-build-audience` + `openclaw-send-outreach` | 1d | 059, 062, 067 |
| 065 | [referral-tracking](./065-referral-tracking.md) — `marketing.referral_links` + `campaign-track-click` edge fn | 0.5d | 059 |
| 066 | [campaign-ingest-metrics](./066-campaign-ingest-metrics.md) — pg_cron metrics rollup + analytics dashboard | 1d | 059, 063, 065 |

**Topological:** 059 → 061 → 060 → 062 → 063 + 065 → 064 → 066

---

## PHASE-2-OPENCLAW build order (4 tasks, ~3.5 dev-days)

OpenClaw VPS execution layer: delivery receipts, WhatsApp AI concierge, browser DM outreach (warm contacts only), A6 attendance confirmation automation.

| # | Task | Effort | Depends on |
|---|---|---|---|
| 067 | [openclaw-delivery-webhook](./067-openclaw-delivery-webhook.md) — HMAC-verified delivery receipt receiver | 0.5d | 059 |
| 068 | [openclaw-whatsapp-concierge](./068-openclaw-whatsapp-concierge.md) — 24/7 voter/attendee support bot | 1d | 059, 067 |
| 069 | [openclaw-influencer-outreach-browser](./069-openclaw-influencer-outreach-browser.md) — Playwright IG/TikTok DMs (warm only) | 1d | 059, 064, 067 |
| 070 | [openclaw-no-show-recovery](./070-openclaw-no-show-recovery.md) — A6 attendance confirmation + no-show recovery | 1d | 059, 068, 005 |

---

## PHASE-3-RESTAURANT build order (2 tasks, ~2 dev-days)

Native restaurant reservations — replaces external `reservation_url` redirect with first-party booking.

| # | Task | Effort | Depends on |
|---|---|---|---|
| 071 | [restaurant-reservations-schema](./071-restaurant-reservations-schema.md) — 5-table `restaurant.*` schema | 1d | 001 |
| 072 | [restaurant-booking-edge-fn](./072-restaurant-booking-edge-fn.md) — race-safe booking edge fn + RestaurantDetail widget | 1d | 071 |

---

## What's deliberately NOT in any phase yet (per founder May 2 reset)

| Cut from any current phase | Why |
|---|---|
| `event_checkout_questions` (custom organizer fields per checkout) | Phase 2+ — covered by `event_attendee_profiles.custom_fields` JSONB until volume justifies a dedicated table |
| `event_planners` table (external planner/agency) | Phase 3 — covered by `event_stakeholders.role='planner'` until B2B partnerships ship |
| `event_tasks` (planning checklist) | Phase 3 — defer until project-management view is asked for |
| Hermes / Paperclip / OpenClaw deep automation | Phase 4 — only when scale demands |
| Multi-venue / restaurant week / festival mode | Phase 2/3 — single-venue covers 5 of 10 event types in P1 |

---

## How to execute a task

1. Open the `.md` file (e.g. `001-event-schema-migration.md`).
2. Read **Description**, **Acceptance Criteria**, **Wiring Plan** in that order.
3. Open the referenced diagram from frontmatter `mermaid_diagram`.
4. Open the referenced PRD section (`prd_section` field).
5. Load skills via Claude Code (frontmatter `skill` list — supabase, supabase-postgres-best-practices, supabase-edge-functions, gemini, etc.).
6. Read existing code referenced in **Wiring Plan** before changing it.
7. Implement in wiring-plan order.
8. Verify all **Acceptance Criteria** check.
9. Run `mdeai-project-gates` skill (lint + test + build + bundle + edge-fn advisor).
10. Update task status: `Open` → `In Progress` → `In Review` → `Done`.

---

## Audit & integrity log

### Audit #1 (2026-05-03) — [`../audit/01-events-audit.md`](../audit/01-events-audit.md)

13 issues found, all 13 fixed:

- **B1, B2, B3** (Stripe metadata + ticket selection + schema drift) — fixed in 001 + 004 + 005.
- **B4** (verify_jwt for ticket-validate) — fixed in 006: `verify_jwt = false`, in-function staff JWT validation.
- **B5** (Phase 2 task order) — fixed via topological build order above.
- **R1–R6** (stale task IDs, phase, anon RLS, transactional finalize, Stripe refund field, JWT UUID) — all fixed in 001/004/005/010.
- **R7** (advisory lock collision) — annotated in 004 as low-priority v2 hardening.
- **M1, M2, M4** (listing-moderate scope creep, staff JWT secret, Lighthouse aspirational) — fixed in 002, new tasks 033 + 034, 007.

### Audit #2 (2026-05-03) — [`../audit/02-events-audit.md`](../audit/02-events-audit.md)

5 critical blockers found, **all 5 fixed in this commit**:

| Audit ID | Finding | Fix |
|---|---|---|
| **B1** | `event_orders.payment_id` FK to `public.payments` — but `payments.booking_id` was NOT NULL. Event-ticket payments had no booking; revenue path broken. | **Fixed in 001:** ALTER `payments` to drop NOT NULL on `booking_id`, add `event_order_id uuid REFERENCES event_orders`, add `payments_source_chk` CHECK constraint enforcing exactly one source, add new RLS policy for event-order payments. |
| **B2** | `006-ticket-validate-edge-fn` `depends_on` missing `034-event-staff-link-generator-edge-fn` (yet 006 verifies the staff JWT 034 mints). | **Fixed:** added `034` to 006's frontmatter `depends_on`. |
| **B3** | `003-host-event-dashboard` `depends_on` missing `034` (dashboard generates the staff link via 034). | **Fixed:** added `034` to 003's frontmatter `depends_on`. |
| **B4** | `033-event-photo-moderate-edge-fn` (Phase 1.5) depended on `030-event-media-assets-schema` (Phase 2) — phase inversion blocking Phase 1.5 launch. | **Fixed:** decoupled. 033 is now a pure validator that returns the verdict. Phase 1.5 callers (task 002) display verdict + accept/reject upload. Phase 2 task 030 calls 033 AND stores verdict in `event_media_assets.metadata`. 033's `depends_on` is now `[001]` only. |
| **B5** | Audit log "all fixed" claim was overstated (this exact section). | **Fixed:** this log now distinguishes audit #1 from audit #2 + verified each by file inspection. |

**Plus:**
- Phase frontmatter on 011–024 batch-flipped from `CORE` → `PHASE-2-CONTESTS` (all 14 files; 010 was already correct).
- `event_venues` RLS tightened: `USING (true)` → `USING (EXISTS event with status published/live)` — draft venues no longer publicly readable.
- Layer table in §"Phase 2 contests build order" clarified to show 011 does NOT depend on 020 (only 018+019 do).
- Index header scope updated: "001–034" → "001–044".

---

## See also

- [`../index-events.md`](../index-events.md) — master events folder index
- [`../audit/01-events-audit.md`](../audit/01-events-audit.md) — forensic audit (13 fixes applied)
- [`../100-events-prd.md`](../100-events-prd.md) — Product Requirements Document (§0 amendment locks Phase 1 = events)
- [`../101-roadmap.md`](../101-roadmap.md) — Strategic roadmap (Now/Next/Later)
- [`../15-user-stories.md`](../15-user-stories.md) — testable user stories (the source for tasks 001–009)
- [`../diagrams/00-INDEX.md`](../diagrams/00-INDEX.md) — diagram index
- [`../diagrams/18-mvp-gap.md`](../diagrams/18-mvp-gap.md) — the gap that tasks 001–009 close
- `.claude/skills/{supabase,supabase-postgres-best-practices,supabase-edge-functions,gemini,frontend-design}` — required skills
- `.claude/rules/{style-guide,supabase-patterns,edge-function-patterns,ai-interaction-patterns}.md` — repo conventions
