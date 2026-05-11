# Next Steps — mdeai.co

> **How this file works**
> - Ordered top → bottom by **implementation order**. Top = ship next. Bottom = later.
> - Only **open** tasks live here. The moment a task ships (merged to `main` + verified live), **move it to [/home/sk/mde/changelog](../changelog)** with the date and PR link. Do **not** keep `[x]` rows in this file.
> - Before starting any task, check [.claude/skills/](../.claude/skills/) for a matching owner skill and follow its instructions. Common owners: `mde-task-lifecycle`, `mde-supabase`, `mde-vercel`, `mde-stripe`, `mde-whatsapp`, `mde-testing`.
> - **When you write a new task** (here or in `tasks/prompts/`), follow [.claude/rules/task-writing.md](../.claude/rules/task-writing.md): Purpose → Goals → Features → Workflows → User journeys → Agents → Integrations → Summary. Plain English. Lead with what the user can see, not file paths.
> - Source of truth for *why* each task matters: [prd.md](../prd.md) v5.1.
> - Floor before any PR: `npm run lint && npm run build && npm run test`.

**Last updated:** 2026-05-11 · 41/41 tests · build clean · `supabase db reset` green · PRs #17 #18 #19 #22 #24 merged · hybrid search v47 live · Mastra 7 agents on `main` · source=supabase confirmed · one worktree only

---

## 🟥 1. Phase 1 gate — Events + Tickets MVP (P0, blocks Phase 2)

> **What these are:** The Events + Tickets feature is fully built. These five items are **QA runs**, not new features — they verify the built thing actually works end-to-end before we call Phase 1 done. Think of them as the sign-off checklist before a product ships to real users.

Build is 100% done per [prd.md §5.2](../prd.md). These five gate items are **the only thing standing between Phase 1 → Phase 2**.

- [ ] **G1 — Camila E2E (buyer)** — A real person buys a ticket on mdeai.co → confirms the confirmation email arrived in their inbox → QR code displays on their phone screen. Tests: Stripe charge, email delivery (Infobip), QR generation, mobile rendering. Skill: `mde-testing`, `mde-stripe`.
- [ ] **G2 — Roberto E2E (staff)** — A real person clicks a staff magic link → opens the scanner PWA → scans a valid QR → sees green ✓ → scans the same QR again → sees `ALREADY_USED`. Tests: staff auth, scan RPC, idempotency. Skill: `mde-testing`.
- [ ] **G3 — Staff link revocation** — A host revokes a staff link in the dashboard; within 60 seconds the scanner with that link must be denied entry. Tests: revocation propagation latency. Skill: `mde-testing`, `mde-supabase`.
- [ ] **G4 — Load test** — A script fires 50 simultaneous checkout requests at a 30-seat event. Result must be: exactly 30 tickets sold, 20 rejected, zero oversell. Tests: `ticket-payment-webhook` idempotency under concurrency. Skill: `mde-testing`.
- [ ] **G5 — Lighthouse a11y ≥ 90** — Run Google Lighthouse on event listing page, ticket buy page, staff scanner PWA, and host dashboard. Each must score ≥ 90 on accessibility. Skill: `mde-testing`, `debug-optimize-lcp`.

**Exit criteria:** all 5 green → unlock §3 (Phase 2 contests).

---

## 🟧 2. Chat track — revenue-critical UX (P0, parallel to §1)

> **Context:** C01, C02, C03 are implemented and committed — not yet merged to `main`. Merge them first before picking up C14.

**Implemented, pending merge to main:**
- **C01 — Inline rental cards** — rentals search results appear as cards inside the chat stream (done)
- **C02 — Reasoning Trace UX** — collapsible "Thought for Ns" panel shows above AI reply (done)
- **C03 — Lead Capture Tool** — every chat session writes a row to `leads`; `chat-lead-capture` edge fn live (done)

**Open — implement in order:**

- [ ] **C04 — Host Listing Intake via Chat** (3d) — host describes their property in chat; AI extracts structured listing data. Unblocks the host SaaS funnel ($99–299/mo). Depends on **C03** + **MASTRA-005**. Prompt: [C04-host-listing-intake.md](./prompts/chat/C04-host-listing-intake.md).
- [ ] **C05 — Events Chat Flows** (4d) — discovery + ticket purchase + event creation all happen inside chat. 5–8% commission per ticket. Depends on `events` table + `ticket-checkout` edge fn + **MASTRA-005**. Prompt: [C05-events-chat-flows.md](./prompts/chat/C05-events-chat-flows.md).

---

## 🟧 2B. Mastra orchestration runtime (P0 / P1, parallel-ready)

> **Status 2026-05-10:** MASTRA-001 ✅ (source inventory at `tasks/mastra/mastra-source-inventory.md`). MASTRA-002 ✅ (`@mastra/pg` + `@mastra/client-js` installed, PostgresStore wired, folder structure created, health endpoint + runbook). MASTRA-003 is the immediate next action.

Mastra is the AI application runtime — typed tool registry, agent orchestration, multi-step workflows, memory/RAG, and observability. It orchestrates the Supabase edge functions; it does not replace them.

- **Skills:** **`mastra`** (always check embedded docs first), **`mde-task-lifecycle`** (plan → ship), **`mde-supabase`**.
- **Dev server:** `cd /home/sk/mde/my-mastra-app && npx bgproc list` · Studio at http://localhost:4111.

**Live on main (PR #22 merged 2026-05-10):** 7 agents · 5 tools · 4 workflows · source=supabase confirmed.

**P0 ladder (canonical order — implement in sequence)**

- [x] **MASTRA-001** ✅ — Source inventory + safety baseline.
- [x] **MASTRA-002** ✅ — Core runtime scaffold. 7 agents live, Studio running.
- [ ] **MASTRA-003** — Tool audit + control events (1d). Every tool logs to `ai_tool_audit_events`. Prompt: [003](003-mastra-tool-audit-control-events.md).
- [ ] **MASTRA-012** — Workflow state runtime (1d). Prompt: [012](prompts/mastra/tasks/012-mastra-workflow-state-runtime.md).
- [ ] **MASTRA-013** — Tenant isolation (1d). Prompt: [013](prompts/mastra/tasks/013-mastra-tenant-isolation.md).
- [ ] **MASTRA-014** — AI rate limits + cost controls (1d). Prompt: [014](prompts/mastra/tasks/014-mastra-ai-rate-limits.md).
- [ ] **MASTRA-015** — Shared tool registry (1d). Prompt: [015](prompts/mastra/tasks/015-mastra-tool-registry-system.md).
- [ ] **MASTRA-004** — Hybrid search tools (1d). Wraps `hybrid_search_*` RPCs. Prompt: [004](004-mastra-hybrid-search-tools.md).
- [ ] **MASTRA-005** — Chat router + concierge MVP (2d). **Unblocks C04, C05.** Prompt: [005](005-mastra-chat-router-concierge.md).
- [ ] **MASTRA-019** — `@mastra/client-js` SDK wrapper (1d). Prompt: [019](prompts/mastra/tasks/019-mastra-client-sdk-integration.md).
- [ ] **MASTRA-011** — Observability + evals + guardrails (2d). Prompt: [011](011-mastra-observability-evals-guardrails.md).
- [ ] **MASTRA-006** — Real estate MVP agents (3d). Prompt: [006](006-mastra-real-estate-mvp-agents.md).
- [ ] **MASTRA-007** — Events MVP runtime (3d). Prompt: [007](007-mastra-events-mvp-runtime.md).
- [ ] **MASTRA-008** — Restaurants MVP discovery (2d, P1). Prompt: [008](008-mastra-restaurants-mvp-discovery.md).

---

## 🟧 2A. Vector track — semantic intelligence (P0)

> **Status 2026-05-11:** C14 ✅ · VDB-01 ✅ (ai-search v47, PRs #17 #18) — hybrid FTS+semantic live in production.

- [ ] **VDB-02 — User memory pipeline** (3d) — remembers what each user told the concierge across sessions. Depends on **VDB-01 ✅** + **MASTRA-010**. Prompt: [VDB-02-user-memory-pipeline.md](./prompts/vector/VDB-02-user-memory-pipeline.md).
- [ ] **VDB-03 — Semantic query cache** (1d) — "apartamento Laureles" and "apartamento en Laureles" are the same query; cache the embedding so we don't call Gemini twice. Saves ~150ms latency per cached hit. Depends on **C14, VDB-01**. Prompt: [VDB-03-query-semantic-cache.md](./prompts/vector/VDB-03-query-semantic-cache.md).
- [ ] **VDB-04 — Personalization** (2d) — "For You" section in chat surfaces listings based on the user's browsing + preference history. Depends on **VDB-02**. Prompt: [VDB-04-personalization-recommendations.md](./prompts/vector/VDB-04-personalization-recommendations.md).
- [ ] **VDB-05 — Gemini Embedding 2 upgrade** (1d) — swap `gemini-embedding-001` → `gemini-embedding-2-002` across all embedding calls. Better multilingual quality, lower latency. Depends on **VDB-01–04** (run last). Prompt: [VDB-05-gemini-embedding-2-upgrade.md](./prompts/vector/VDB-05-gemini-embedding-2-upgrade.md).

---

## 🟨 3. Phase 2 — Contest engine (Miss Elegance Colombia)

Schema + admin + vote page already shipped. These items finish the loop. **Blocked on §1 gate.** See [prd.md §5.2 Phase 2](../prd.md).

- [ ] **V1 — Phone OTP via Infobip** — voter verification. Skill: `mde-whatsapp`.
- [ ] **V2 — Cloudflare Turnstile bot guard** on vote page.
- [ ] **V3 — `vote-cast` edge function** — tally + idempotency + nonce burn.
- [ ] **V4 — Gemini photo moderation** for contestant intake.
- [ ] **V5 — Leaderboard broadcast skill** — `vote:tally:{contestId}` realtime channel under load.
- [ ] **V6 — Trust page + Colombian legal sign-off** (Ley 1581/2012, Ley 643/2001).
- [ ] **V7 — OpenClaw VPS provision** (task 021 in legacy backlog).
- [ ] **V8 — Supabase Pro tier upgrade** — required before contest launch (1k+ leaderboard subscribers > Free 200 cap).

**Exit criteria:** $1K MRR · 5 paying agents · 1 contest with 1k+ votes · 0% confirmed fraud · first sponsor contract.

---

## 🟩 4. Phase 1.5 — Events hardening (parallel to Phase 2)

Per [prd.md §5.2 Phase 1.5](../prd.md). Pick up between blockers.

- [ ] **H1 — Native Gemini SDK migration** (`@google/genai@^1.0.0`) — task 045, currently 85%.
- [ ] **H2 — `event_media_assets` schema** — multi-image gallery for events.
- [ ] **H3 — `event_promo_codes` schema** + apply flow at checkout.
- [ ] **H4 — Order refunds + Stripe refund API** in `ticket-payment-webhook`. Skill: `mde-stripe`.
- [ ] **H5 — Taxes / IVA 19%** at checkout.
- [ ] **H6 — `listing-moderate` photo moderation edge fn**.

---

## 🟦 5. Phase 3 — Sponsorship marketplace + intelligence

Sponsorship core (14/14 tasks) done. `STRIPE_SPONSOR_CHECKOUT_KEY` is now set in prod. Marketplace + intelligence layer is 0%. Top items:

- [ ] **S1 — Sponsor chat concierge** — 3 intents in `ai-router` + `ai-chat`.
- [ ] **S2 — `find_sponsor_match` tool** — wire `ai-audience-match` into chat tool registry.
- [ ] **S3 — Sponsor onboarding wizard** — application → contract → first impression.
- [ ] **S4 — `ai-roi-explain` daily insight card** in sponsor dashboard.
- [ ] **S5 — `ai-creative-gen` brief → ad copy + image prompts**.
- [ ] **S6 — Stripe Connect payouts** to event organizers (per-event split).
- [ ] **S7 — Scam-score pipeline** for inbound listings (S1–S6 signals per [prd.md §4.5](../prd.md)).

---

## 🟪 6. Chat track — retention + reach (P1)

After C04–C05 land. These compound the chat surface.

- [ ] **C06 — Chat memory + personalization** (3d) — returning users 3× conversion. Depends on `user_preferences` + Hermes. Prompt: [C06-chat-memory-personalization.md](./prompts/chat/C06-chat-memory-personalization.md).
- [ ] **C07 — Multilingual EN/ES + personas** (2d) — 60% addressable-market lift. Standalone. Prompt: [C07-multilingual-follow-up.md](./prompts/chat/C07-multilingual-follow-up.md).
- [ ] **C08 — WhatsApp continuity** (2d) — LATAM 5× retention. Depends on `openclaw-concierge-webhook`. Skill: `mde-whatsapp`. Prompt: [C08-whatsapp-continuity.md](./prompts/chat/C08-whatsapp-continuity.md).
- [ ] **C15 — Booking confirmation flow** (2d) — closes booking revenue loop. Depends on existing `create_booking_preview` tool. Prompt: [C15-booking-confirmation-flow.md](./prompts/chat/C15-booking-confirmation-flow.md).
- [ ] **C16 — Multi-vertical inline cards** (2d) — restaurants/events/cars parity with rentals. Prompt: [C16-multi-vertical-inline-cards.md](./prompts/chat/C16-multi-vertical-inline-cards.md).
- [ ] **C09 — CRM + sponsor + buyer/seller flows** (5d, P2) — sponsor deals $500–5K each. Depends on **C03 + C06**. Prompt: [C09-chat-crm-sponsor-buyer-flows.md](./prompts/chat/C09-chat-crm-sponsor-buyer-flows.md).

---

## ⬜ 7. Tech-debt cleanup (anytime, low priority)

- [ ] **Merge `chore/claude-audit-tools` → `main`** — contains C14 fixes, VDB-01 hybrid search, deps (qrcode, jsqr, @testing-library/dom, fake-indexeddb). Before merging: update `20260509230000_fix_embedding_indexes_and_rpcs.sql` to use `operator(extensions.<=>)` (local schema) to match the `20260509205216` fix already on `main`. Otherwise `supabase db reset` will fail on the merged chain.
- [ ] Add proper admin auth guards on `/admin/*` routes (`useAdminAuth` hook audit).
- [ ] Write Playwright e2e suite (config exists, suite empty). Skill: `mde-testing`.
- [ ] Pick one package manager — drop either `bun.lockb` or `package-lock.json`.
- [ ] Tighten `Conversation.user_id` type (`string` → `uuid | 'anon'`).
- [ ] Factor `useMarkerLayer` hook between `ChatMap` and `GoogleMapView`.
- [ ] Custom Cloud Console MapID — Mindtrip-muted palette.
- [ ] Cloud Console quota + budget alarm on Maps key.
- [ ] Lift `MapContext` to root or migrate to Zustand (prereq for `MapShell`).

---

## ⬜ 8. Phase 4 — Trio (OpenClaw / Hermes / Paperclip) — internal only

- [ ] Paperclip CEO fix + workspace binding (E5).
- [ ] Hermes intelligence scoring (E6).
- [ ] Contract automation — lease PDF analysis (E7).
- [ ] WhatsApp v2 — AI routing via OpenClaw (E8v2).

---

## ⬜ 9. Phase 5 — Native rental booking + landlord SaaS (later)

Not yet planned in detail. Tracked here so it doesn't get lost. Starts after Phase 3 hits exit criteria.

- [ ] Native rental booking (12% commission).
- [ ] Landlord SaaS — listing manager, leads inbox, calendar.
- [ ] Application review pipeline (host approve / reject / request-info).
- [ ] In-app messaging (renter ↔ landlord per application).
- [ ] Showing reminders via pg_cron T-24h + T-1h.

---

## Open product decisions

| # | Decision | Options | Due |
|---|----------|---------|-----|
| 1 | Primary PSP for COP | Stripe-only vs Wompi/local | Phase 2 |
| 2 | Showing availability model | Calendar integration vs manual slots | Phase 5 |
| 3 | Service fee % on native bookings | 12% flat vs tiered | Phase 5 |

---

## Testing gates (run continuously)

| Gate | When | Command | Pass |
|------|------|---------|------|
| 1. Build + Lint | Every PR | `npm run lint && npm run build` | Zero errors |
| 2. Unit tests | Every PR | `npm run test` | All pass |
| 3. Edge verify | PRs touching `supabase/` | `npm run verify:edge` | Deno tests pass |
| 4. Functional smoke | Weekly | Manual browser test | No CORS / 401 |
| 5. Pre-deploy | Before release | `/deploy-check full` | Security + data integrity green |
