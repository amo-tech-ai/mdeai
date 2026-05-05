# Real Estate Vertical — Strategic Roadmap

> **Generated from:** `tasks/prd-real-estate.md` (PRD v2, April 5 2026)
> **Phase system:** `roadmap.md` §7 (CORE → MVP → ADVANCED → PRODUCTION)
> **Diagrams:** `tasks/mermaid/INDEX.md` (10 diagrams, source of truth)
> **Methodology:** Outcome-driven, Now/Next/Later sequencing with RICE prioritization
> **Last updated:** 2026-04-05 — Added booking+landlord comms, planning dashboard, reminders, WhatsApp to CORE; promoted from later phases per user request. See `tasks/audit/09-full-system-audit.md` for system state context.

---

## 1. Business Outcomes (Success Criteria)

| # | Outcome | Metric | Target | Phase |
|---|---------|--------|--------|-------|
| O1 | First end-to-end booking | Booking count with payment + commission line item | ≥ 1 | P1 |
| O2 | Lead-to-lease conversion | % of leads reaching signed booking | ≥ 5% | P1 |
| O3 | Hermes ranking accuracy | Top-1 result matches user preference | ≥ 70% | P2 |
| O4 | Lease review automation | AI review passes fixture set | ≥ 90% | P2 |
| O5 | WhatsApp lead conversion | % of WA leads that convert | ≥ 10% | P1 |
| O6 | Automated ops coverage | % of routine ops handled by Paperclip | ≥ 80% | P3 |
| O7 | Time to first response | Lead receives first contact | < 5 min | P1 |
| O8 | Host payout reliability | Payouts processed on schedule (Fri 8AM) | 100% | P3 |
| O9 | System uptime | Edge function availability | ≥ 99.5% | PROD |
| O10 | Search relevance | Users find suitable listing within 3 results | ≥ 60% | P2 |
| O11 | Planning dashboard usage | % of active users who save ≥3 favorites | ≥ 40% | P1 |
| O12 | Showing attendance rate | % of scheduled showings where renter shows up | ≥ 80% | P1 |
| O13 | Landlord response time | Host responds to application within | < 48h | P1 |

---

## 2. Current State Assessment

### What Works
- 28 database tables with RLS (0 rows — no seed data)
- 9 edge functions deployed (6 tested, 3 untested)
- Vite + React + shadcn/ui frontend (158+ components, 33 pages)
- Supabase Auth (email + Google OAuth)
- AI chat with 6 Gemini-powered agents
- Paperclip running at :3102 (4 agents registered)
- Hermes v0.7.0 installed (637 skills)
- Vercel deployment live at mdeai.co

### Critical Blockers
| Blocker | Impact | Effort to Unblock |
|---------|--------|-------------------|
| Empty database (0 rows in all 28 tables) | Cannot demo anything | S — seed script |
| No payment loop (Stripe not wired) | Cannot complete O1 | M — payment-webhook edge fn |
| Paperclip CEO broken (3/10) | No agent governance | M — fix instructions, bind workspace |
| Hermes runtime config (4/10) | No intelligent ranking | M — instructionsFilePath, timeout |
| 8 CRITICAL security issues in edge functions | Cannot go to production | M — JWT, CORS, Zod, rate limits, RBAC, timeouts |
| No CRM/lead pipeline | Cannot track O2 | M — leads table + lead-capture fn |

---

## 3. Epics & Initiatives

### Epic 1: Data Foundation
**Hypothesis:** Seeding the database with realistic test data unblocks all frontend demos, AI search, and agent testing.
**Diagrams:** MERM-06 (data model), MERM-09 (edge functions)
**Outcome:** O1, O2, O10

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Create seed script (apartments, neighborhoods, profiles) | P0 | S | None |
| Add 6 P1 tables (leads, showings, payments, rental_applications, property_verifications, neighborhoods) | P0 | M | Seed script |
| Add indexes on filter/sort columns | P0 | S | P1 tables |
| Configure RLS for new tables | P0 | S | P1 tables |

### Epic 2: Lead-to-Lease Pipeline
**Hypothesis:** A complete lead→showing→application→**approval**→booking→payment pipeline enables the first real booking (O1).
**Diagrams:** MERM-03 (rental pipeline), MERM-05 (intake wizard), MERM-09 (edge functions)
**Outcome:** O1, O2, O7, O12, O13

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Implement `lead-capture` edge function | P0 | M | P1 tables |
| Implement `showing-create` edge function | P0 | M | leads table |
| Implement `application-create` edge function | P0 | M | leads table |
| **Implement `application-review` edge function (host approve/reject)** | **P0** | **M** | **application-create** |
| Implement `booking-create` edge function | P0 | M | application-review |
| Implement `payment-webhook` edge function (Stripe) | P0 | L | booking-create |
| Wire intake wizard → lead-capture → search results | P0 | M | lead-capture fn |
| Build ShowingScheduler component | P0 | M | showing-create fn |
| Build ApplicationWizard component | P0 | M | application-create fn |
| **Build HostApplicationReview component (approve/reject/request-info)** | **P0** | **M** | **application-review fn** |
| Build PaymentButton + BookingConfirmation | P0 | M | payment-webhook fn |
| **Implement showing reminders (T-24h, T-1h notifications)** | **P0** | **M** | **showing-create fn** |
| **Build in-app messaging (renter ↔ landlord thread per application)** | **P0** | **M** | **application-create fn** |

### Epic 3: Security Hardening
**Hypothesis:** Fixing the 8 CRITICAL security issues is prerequisite for any real user data or payments.
**Diagrams:** MERM-09 (edge functions), MERM-10 (deployment)
**Outcome:** O9

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Enable `verify_jwt: true` on all 9 edge functions | P0 | S | None |
| Add Zod input validation to all edge functions | P0 | M | None |
| Fix CORS — restrict to `https://www.mdeai.co` | P0 | S | None |
| Add rate limiting (10 AI/min, 30 search/min) | P0 | S | None |
| Fix service role key leak in inter-function calls | P0 | S | None |
| Fix admin auth guard (implement RBAC) | P0 | M | None |
| Add request timeouts (30s AI, 10s DB) | P0 | S | None |
| Add Stripe webhook signature verification | P0 | S | payment-webhook |

### Epic 4: Frontend Rental Flow
**Hypothesis:** A polished rental search → detail → book flow with favorites and a planning dashboard drives the first conversion.
**Diagrams:** MERM-08 (frontend components), MERM-01 (user journeys), MERM-05 (intake wizard)
**Outcome:** O1, O2, O10, O11, O13

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Build MapView + PricePin components | P0 | M | Seed data |
| Build RentalsListingDetail page | P0 | M | Seed data |
| Build NeighborhoodCard component | P0 | S | neighborhoods table |
| **Build Planning Dashboard (saved favorites, compare, notes)** | **P0** | **M** | **Seed data, saved_places table** |
| **Build LandlordDashboard (listings, applications, messages, earnings)** | **P0** | **L** | **bookings pipeline** |
| Build ModerationQueue (admin) | P1 | M | None |

### Epic 5: Agent Infrastructure (Paperclip + Hermes)
**Hypothesis:** Fixing agent configuration enables automated ops and intelligent ranking.
**Diagrams:** MERM-07 (agent architecture), MERM-02 (system architecture)
**Outcome:** O3, O6, O7, O8

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Fix Paperclip CEO instructions (replace placeholder .md) | P0 | S | None |
| Bind Paperclip workspace to /home/sk/mde | P0 | S | Paperclip UI |
| Set Hermes `instructionsFilePath` + timeout=30s | P0 | S | None |
| Wire hermes_local adapter → Hermes CLI | P1 | M | Hermes config |
| Implement heartbeat schedule (daily 15-min cycle) | P1 | M | CEO fix |
| Implement approval gates (payment >$500, listing publication) | P1 | M | CEO fix |
| Wire openclaw_gateway adapter → OpenClaw | P2 | L | OpenClaw setup |

### Epic 6: Hermes Intelligence
**Hypothesis:** Composite ranking with 7 weighted factors improves search relevance to ≥70% top-1 accuracy.
**Diagrams:** MERM-07 (agent architecture), MERM-09 (edge functions)
**Outcome:** O3, O10

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Implement `hermes-ranking` edge function | P1 | L | Seed data, Hermes config |
| Build 7-factor scoring (budget 0.25, neighborhood 0.20, wifi 0.15, stay_length 0.15, amenity 0.10, host 0.10, freshness 0.05) | P1 | L | hermes-ranking fn |
| Build HermesScoreBreakdown component | P1 | M | hermes-ranking fn |
| Implement taste profile learning (search history → preferences) | P2 | L | User activity data |
| Implement market intelligence snapshots | P2 | M | neighborhoods table |

### Epic 7: Contract & Lease Automation
**Hypothesis:** AI lease review at ≥90% accuracy reduces renter risk and builds trust.
**Diagrams:** MERM-09 (edge functions), MERM-07 (agent architecture)
**Outcome:** O4

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Add P2 tables (lease_reviews, market_snapshots, taste_profiles) | P2 | M | None |
| Implement `contract-analysis` edge function | P2 | L | lease_reviews table |
| Build LeaseReviewCard component | P2 | M | contract-analysis fn |
| Create fixture set (50+ leases) for validation | P2 | M | None |

### Epic 8: Multi-Channel (WhatsApp) — PROMOTED TO CORE
**Hypothesis:** WhatsApp is Colombia's primary messaging app. Capturing leads via WA before they visit the website is critical for the Medellín market.
**Diagrams:** MERM-04 (chat flow), MERM-09 (edge functions)
**Outcome:** O5, O7

**Phasing:** Ship in 2 stages — v1 (lead capture + reminders) in CORE, v2 (AI routing + escalation) in ADVANCED.

| Task | Priority | Effort | Dependencies | Stage |
|------|----------|--------|--------------|-------|
| Configure Infobip WhatsApp Business API webhook | **P0** | M | Infobip account | **v1** |
| Implement WA → lead-capture edge function (text only, no AI) | **P0** | M | lead-capture fn | **v1** |
| **Implement WA apartment search via ai-search bridge (08L)** | **P0** | **M** | **Infobip config, ai-search fn** | **v1** |
| Send showing reminders via WhatsApp (T-24h, T-1h) | **P0** | S | Infobip config, showings table | **v1** |
| Send booking confirmations via WhatsApp | **P0** | S | Infobip config, booking-create | **v1** |
| Wire OpenClaw WhatsApp channel adapter (AI routing) | P2 | L | openclaw_gateway | v2 |
| Build human handover escalation | P2 | M | WA channel + OpenClaw | v2 |
| Language detection (Spanish-first, English fallback) | P2 | M | OpenClaw adapter | v2 |

### Epic 9: Production Readiness
**Hypothesis:** Monitoring, observability, and deployment hardening enable ≥99.5% uptime.
**Diagrams:** MERM-10 (deployment architecture)
**Outcome:** O9

| Task | Priority | Effort | Dependencies |
|------|----------|--------|--------------|
| Set up Vercel Analytics + Speed Insights | P1 | S | None |
| Implement ai_runs logging in all AI edge functions | P1 | M | None |
| Add agent_audit_log table + logging | P1 | M | Paperclip fix |
| Write e2e tests (Playwright) for critical paths | P1 | L | Seed data |
| Fix env vars in Vercel (VITE_* not NEXT_PUBLIC_*) | P0 | S | None |
| Configure monitoring alerts (error rate, latency) | P2 | M | Analytics |

---

## 4. RICE Prioritization

| Epic | Reach | Impact | Confidence | Effort | RICE Score | Rank | Phase |
|------|-------|--------|------------|--------|------------|------|-------|
| E1: Data Foundation | 10 | 10 | 10 | 2 | 500 | 1 | CORE |
| E3: Security Hardening | 10 | 9 | 10 | 3 | 300 | 2 | CORE |
| E2: Lead-to-Lease Pipeline (+ approval + messaging + reminders) | 9 | 10 | 9 | 10 | 81 | 3 | **CORE** |
| E4: Frontend Rental Flow (+ planning dashboard + landlord dash) | 9 | 9 | 9 | 8 | 91 | 4 | **CORE** |
| E8: WhatsApp v1 (lead capture + reminders, no AI routing) | 8 | 8 | 8 | 4 | 128 | 5 | **CORE** |
| E9: Production Readiness | 10 | 7 | 9 | 6 | 105 | 6 | CORE |
| E5: Agent Infrastructure | 6 | 8 | 7 | 5 | 67 | 7 | ADVANCED |
| E6: Hermes Intelligence | 5 | 8 | 6 | 8 | 30 | 8 | ADVANCED |
| E7: Contract Automation | 4 | 7 | 5 | 7 | 20 | 9 | ADVANCED |
| E8 v2: WhatsApp AI routing + escalation | 3 | 7 | 5 | 6 | 18 | 10 | ADVANCED |

> **Note:** E2, E4, and E8v1 promoted to CORE per product decision (2026-04-05). E8 split into v1 (simple WA lead capture + outbound reminders) and v2 (AI routing via OpenClaw). Agent infrastructure (E5) remains ADVANCED — agents are not required for the core user journey.

---

## 5. Sequenced Roadmap (Now / Next / Later)

### NOW — Weeks 1-8 (P1 CORE)

**Phase:** CORE
**Exit criteria:** End-to-end booking with payment. Renter and landlord can communicate. Planning dashboard with favorites. Showing reminders via app + WhatsApp. WhatsApp lead capture works.
**Outcomes:** O1, O2, O5, O7, O11, O12, O13

```
Week 1-2: Foundation + Security
├── [E1] Seed script — 50+ apartments, neighborhoods, profiles
├── [E1] Create 6 P1 tables + indexes + RLS
├── [E3] Rotate leaked secrets (.env in Git) ← EMERGENCY
├── [E3] Enable verify_jwt on all 10 edge functions
├── [E3] Fix CORS (restrict to mdeai.co + localhost:8080)
├── [E3] Zod validation on all edge function inputs
├── [E3] Fix service role key leak in edge functions
├── [E3] Rate limiting on AI + search endpoints
├── [E3] Request timeouts (30s AI, 10s DB)
├── [E9] Fix Vercel env vars (VITE_* prefix)
└── [E9] Remove hardcoded JWT tokens from 3 frontend files

Week 3-4: Pipeline + Landlord Comms
├── [E2] lead-capture edge function
├── [E2] showing-create edge function
├── [E2] application-create edge function
├── [E2] application-review edge function (host approve/reject) ← NEW
├── [E2] booking-create edge function
├── [E2] payment-webhook edge function (Stripe)
├── [E2] In-app messaging (renter ↔ landlord thread per application) ← NEW
├── [E3] Stripe webhook signature verification
├── [E3] Admin RBAC (role checks in edge functions + frontend)
├── [E4] MapView + PricePin components
└── [E4] NeighborhoodCard component

Week 5-6: Frontend + Planning Dashboard
├── [E2] Wire intake wizard → lead-capture → search
├── [E4] ShowingScheduler component
├── [E4] ApplicationWizard component
├── [E4] HostApplicationReview component (approve/reject/request-info) ← NEW
├── [E4] PaymentButton + BookingConfirmation
├── [E4] RentalsListingDetail page polish
├── [E4] Planning Dashboard (saved favorites, compare, notes) ← NEW
├── [E4] LandlordDashboard (listings, apps, messages, earnings) ← NEW
├── [E9] ai_runs logging in all AI edge functions
├── [E9] Wire ai-search to frontend (replace ai-chat searchMode)
└── [MILESTONE] First complete booking with payment ✓

Week 7-8: WhatsApp v1 + Reminders
├── [E8] Configure Infobip WhatsApp Business API webhook ← PROMOTED
├── [E8] WA → lead-capture edge function (text only, no AI) ← PROMOTED
├── [E8] WA apartment search via ai-search bridge (08L) ← NEW
├── [E8] Send showing reminders via WhatsApp (T-24h, T-1h) ← PROMOTED
├── [E8] Send booking confirmations via WhatsApp ← PROMOTED
├── [E2] Showing reminders in-app (T-24h, T-1h notifications) ← PROMOTED
├── [E2] Payment idempotency keys on all money paths
├── [E9] E2E Playwright test — full renter journey
├── [E9] Monitoring alerts (error rate, latency)
└── [MILESTONE] WhatsApp lead capture + reminders live ✓
```

**Capacity notes:**
- 7 new edge functions (lead-capture, showing-create, application-create, application-review, booking-create, payment-webhook, WA lead-capture)
- 6 new DB tables + messaging table
- 8 new frontend components (MapView, ShowingScheduler, ApplicationWizard, HostApplicationReview, PaymentButton, PlanningDashboard, LandlordDashboard, NeighborhoodCard)
- WhatsApp v1 = Infobip webhook + outbound reminders (no AI routing)
- **No agent work in CORE** — Paperclip/Hermes/OpenClaw deferred to ADVANCED

### NEXT — Weeks 9-16 (P2 ADVANCED — Intelligence + Agents)

**Phase:** ADVANCED
**Exit criteria:** Hermes ranking ≥70% accuracy. Lease review ≥90%. WhatsApp AI routing via OpenClaw. Agent orchestration operational.
**Outcomes:** O3, O4, O6, O10

```
Week 9-10: Ranking + Agent Foundation
├── [E6] hermes-ranking edge function (7-factor scoring)
├── [E6] HermesScoreBreakdown component
├── [E5] Fix Paperclip CEO instructions + bind workspace
├── [E5] Set Hermes instructionsFilePath + timeout
├── [E5] Wire hermes_local adapter
└── [E4] ModerationQueue (admin)

Week 11-12: Intelligence Layer
├── [E7] Add P2 tables (lease_reviews, market_snapshots, taste_profiles)
├── [E7] contract-analysis edge function (Gemini lease PDF review)
├── [E7] LeaseReviewCard component
├── [E6] Taste profile learning (search history → preferences)
├── [E6] Market intelligence snapshots (neighborhood trends)
└── [E9] Vercel Analytics + Speed Insights

Week 13-14: WhatsApp v2 + Agent Automation
├── [E8] Wire OpenClaw WhatsApp channel adapter (AI routing)
├── [E8] Human handover escalation
├── [E8] Language detection (Spanish-first)
├── [E5] Heartbeat schedule (daily 15-min cycle)
├── [E5] Approval gates (payment >$500, listing publication)
└── [E5] openclaw_gateway adapter wiring

Week 15-16: Validation + Buffer
├── [E7] Lease fixture set (50+ leases) + validation run
├── [E6] Hermes ranking eval dataset (50+ test cases)
├── [E9] agent_audit_log + Paperclip logging
├── Bug fixes, performance tuning, UX iteration
└── [MILESTONE] Hermes ranking validated, lease review ≥90% ✓
```

### LATER — Weeks 17-22 (P3 PRODUCTION — Operations + Scale)

**Phase:** PRODUCTION
**Exit criteria:** Paperclip handles ≥80% routine ops. System ≥99.5% uptime.
**Outcomes:** O6, O8, O9

```
Week 17-18: Full Agent Automation
├── [E5] Full Paperclip automation (stale leads, freshness, payouts)
├── [E5] Weekly ops tasks (Mon pipeline, Wed freshness, Fri payouts)
├── [E5] CEO human escalation for edge cases
├── [E6] Post-showing similar listing suggestions
└── P3 tables (communication_logs, payout_records)

Week 19-20: Production Hardening
├── Load testing (simulated concurrent users)
├── Security audit (penetration testing)
├── Disaster recovery procedures
├── [E9] Production deployment hardening
└── Documentation + runbooks

Week 21-22: Scale Preparation
├── Performance optimization under load
├── Cost optimization (AI spend analysis from ai_runs)
├── Operational playbooks for on-call
└── [MILESTONE] System stable under real-world usage ✓
```

### FUTURE — Weeks 23+ (P4 Expansion)

- Multi-city expansion (Bogota, Cartagena)
- Vendor marketplace (Mercur/MedusaJS V2)
- Commission management + automated payouts
- Mobile app (React Native)
- Advanced analytics dashboard
- Telegram channel adapter
- Property verification automation (AI photo analysis)

---

## 6. Dependency Map

```
CORE PHASE DEPENDENCIES:

Seed Data ──────────┬──→ Frontend demos (MapView, ListingDetail)
                    ├──→ AI search testing
                    ├──→ Planning Dashboard (needs apartments to save)
                    └──→ E2E tests

P1 Tables ──────────┬──→ lead-capture fn
                    ├──→ showing-create fn ──→ Showing reminders (app + WA)
                    ├──→ application-create fn ──→ application-review fn (host)
                    │                           ├──→ HostApplicationReview UI
                    │                           └──→ In-app messaging
                    └──→ booking-create fn ──→ payment-webhook fn
                                            ├──→ BookingConfirmation
                                            └──→ WA booking confirmation

Security fixes ─────┬──→ All edge functions (JWT, CORS, Zod)
                    └──→ Admin RBAC ──→ LandlordDashboard, ModerationQueue

Infobip config ─────┬──→ WA lead-capture fn (text only, no AI)
                    ├──→ WA showing reminders (T-24h, T-1h)
                    └──→ WA booking confirmations

ADVANCED PHASE DEPENDENCIES (deferred):

Paperclip CEO fix ──┬──→ Heartbeat schedule
                    ├──→ Approval gates
                    └──→ agent_audit_log

Hermes config fix ──┬──→ hermes_local adapter
                    └──→ hermes-ranking fn ──→ HermesScoreBreakdown

OpenClaw setup ─────┬──→ WA v2 AI routing
                    └──→ Human handover
```

**Single-threaded risks (CORE):**
- Stripe integration (payment-webhook) is on the critical path to O1
- Seed data blocks nearly everything (highest priority)
- Infobip account setup may take days (WhatsApp Business API approval)
- Application-review fn is the missing pipeline step — must ship before bookings work

**Deferred risks (ADVANCED):**
- Paperclip CEO fix blocks all agent automation (acceptable — agents not in CORE)
- Hermes config fix blocks intelligent ranking (acceptable — simple sort works for MVP)

---

## 7. Phase ↔ system.md Mapping

| system.md Phase | PRD Phase | Weeks | Epics | Key Deliverable |
|----------------|-----------|-------|-------|-----------------|
| **CORE** | P1 (Wk 1-8) | 1-8 | E1, E2, E3, E4, E8v1, E9 | Full booking pipeline + landlord comms + planning dashboard + WA lead capture + reminders |
| **ADVANCED** | P2 (Wk 9-16) | 9-16 | E5, E6, E7, E8v2 | Agent orchestration + Hermes ranking + lease review + WA AI routing |
| **PRODUCTION** | P3 (Wk 17-22) | 17-22 | E5 (full), E9 (hardening) | Paperclip automation + production stability + scale |

**What changed (2026-04-05):**
- Booking approval workflow (E2-003b) added to CORE — pipeline was broken without it
- LandlordDashboard promoted from P1 to P0 — hosts need to see and respond to applications
- Planning Dashboard added to CORE — users save favorites and compare apartments
- In-app messaging added to CORE — renter ↔ landlord communication per application
- Showing reminders promoted from Phase 2 to CORE — 80% attendance target (O12)
- WhatsApp v1 (lead capture + reminders) promoted from Phase 3 to CORE — Colombia market requires WA
- Agent infrastructure (E5) stays in ADVANCED — core pipeline works without agents
- WhatsApp v2 (AI routing via OpenClaw) stays in ADVANCED — v1 text-only is sufficient for CORE

---

## 8. Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Stripe integration delays (KYC, test mode issues) | Medium | High | Start Stripe setup in Week 1, use test mode throughout P1 |
| Gemini API rate limits or cost overruns | Medium | Medium | Rate limiting already planned, monitor ai_runs table |
| Paperclip CEO unfixable (deeper issues than config) | Low | High | Fallback: manual ops + cron jobs for P1, revisit for P2 |
| Hermes ranking accuracy below 70% target | Medium | Medium | Start with simple scoring, iterate on weights with user feedback |
| WhatsApp Business API approval delays | High | Medium | P3 timeline provides buffer; can test with sandbox first |
| Single developer bottleneck | High | High | Prioritize ruthlessly, defer nice-to-haves, automate testing early |

---

## 9. Diagram → Task Traceability

| Diagram | Epic | Key Tasks Generated |
|---------|------|-------------------|
| MERM-01 (User Journeys) | E4 | UX acceptance criteria per journey step |
| MERM-02 (System Architecture) | E5, E9 | Infrastructure wiring, agent integration |
| MERM-03 (Rental Pipeline) | E2 | 5 pipeline edge functions, 3 approval gates |
| MERM-04 (Chat Flow) | E8 | WhatsApp channel, human handover |
| MERM-05 (Intake Wizard) | E2, E4 | Wizard → lead-capture → search wiring |
| MERM-06 (Data Model) | E1 | 6 P1 tables, seed data, migrations |
| MERM-07 (Agent Architecture) | E5 | Paperclip fix, Hermes config, heartbeats |
| MERM-08 (Frontend Components) | E4 | 8 new components (ShowingScheduler, MapView, etc.) |
| MERM-09 (Edge Functions) | E2, E3, E6, E7 | 7 new edge functions, security hardening |
| MERM-10 (Deployment) | E9 | Monitoring, analytics, production topology |

---

## 10. Next Steps

1. **Immediate (today):** Rotate leaked secrets (.env in Git) — EMERGENCY
2. **Immediate (today):** Enable `verify_jwt = true` on all edge functions + fix CORS
3. **This week:** Seed database with 50+ realistic Medellin apartments
4. **This week:** Security hardening (Zod, rate limits, timeouts, service role fix)
5. **Week 2:** Start pipeline — lead-capture, showing-create, application-create
6. **Week 3:** Application-review (host approval) + in-app messaging — the missing pipeline step
7. **Week 4:** Frontend — MapView, ShowingScheduler, Planning Dashboard, LandlordDashboard
8. **Week 5-6:** Payment + booking completion + end-to-end integration
9. **Week 7-8:** WhatsApp v1 (Infobip config + lead capture + reminders)

**Deferred to ADVANCED (Wk 9+):** Paperclip CEO, Hermes ranking, OpenClaw routing, lease review, agent automation. These are optimization, not core flow.

## 11. What Changed (2026-04-05 Reprioritization)

| Feature | Was | Now | Rationale |
|---------|-----|-----|-----------|
| Host approval workflow | Not in any task | **CORE P0** | Pipeline broken without it — renters can't book |
| Renter ↔ landlord messaging | Not planned | **CORE P0** | Hosts need to ask questions, renters need to negotiate |
| Planning dashboard (favorites) | Implicit (saved_places hook existed) | **CORE P0** | Users need to compare apartments side-by-side |
| LandlordDashboard | P1 (Week 11) | **CORE P0** (Week 5) | Hosts must review applications to unblock bookings |
| Showing reminders | Phase 2 (02F) | **CORE P0** (Week 7) | 80% attendance target; critical for conversion |
| WhatsApp lead capture | Phase 3 (E8) | **CORE P0** (Week 7) | Colombia market — WA is primary channel |
| WhatsApp reminders | Phase 3 | **CORE P0** (Week 7) | Users expect WA notifications in Colombia |
| Agent infrastructure (E5) | CORE (Week 1) | **ADVANCED** (Week 9) | Agents are not needed for core user journey |
| Hermes ranking (E6) | CORE (Week 5) | **ADVANCED** (Week 9) | Simple sort is good enough for MVP |
| WhatsApp AI routing (E8v2) | Phase 3 | **ADVANCED** (Week 13) | Text-only WA works for MVP |
