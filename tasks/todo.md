# Next Steps — mdeai.co

> **How this file works**
> - Ordered top → bottom by **implementation order**. Top = ship next. Bottom = later.
> - Only **open** tasks live here. The moment a task ships (merged to `main` + verified live), **move it to [/home/sk/mde/changelog](../changelog)** with the date and PR link. Do **not** keep `[x]` rows in this file.
> - Before starting any task, check [.claude/skills/](../.claude/skills/) for a matching owner skill and follow its instructions. Common owners: `mde-task-lifecycle`, `mde-supabase`, `mde-vercel`, `mde-stripe`, `mde-whatsapp`, `mde-testing`.
> - Source of truth for *why* each task matters: [prd.md](../prd.md) v5.1.
> - Floor before any PR: `npm run lint && npm run build && npm run test`.

**Last updated:** 2026-05-08 · 259/259 tests · build clean · live at https://www.mdeai.co

---

## 🔴 0. Immediate blockers (clear before anything else)

- [ ] **B1 — Set `STRIPE_SPONSOR_CHECKOUT_KEY`** in Supabase prod (15 min). Until set, sponsor checkout 500s. Skill: `mde-stripe`, `mde-infisical`.

---

## 🟥 1. Phase 1 gate — Events + Tickets MVP (P0, blocks Phase 2)

Build is 100% done per [prd.md §5.2](../prd.md). These five gate items are **the only thing standing between Phase 1 → Phase 2**. Run them in order.

- [ ] **G1 — Camila E2E (buyer)** — buy ticket → email arrives → QR displayed on phone. Skill: `mde-testing`, `mde-stripe`.
- [ ] **G2 — Roberto E2E (staff)** — staff link → valid scan returns ✓ → rescan returns `ALREADY_USED`. Skill: `mde-testing`.
- [ ] **G3 — Staff link revocation** — revoke a staff link; scanner must be denied within 60s. Skill: `mde-testing`, `mde-supabase`.
- [ ] **G4 — Load test** — 50 concurrent buyers on a 30-seat tier → 0 oversell. Skill: `mde-testing`.
- [ ] **G5 — Lighthouse a11y ≥ 90** on event listing, ticket buy, scanner, host dashboard. Skill: `mde-testing`, `debug-optimize-lcp`.

**Exit criteria for this section:** all 5 green → unlock §3 (Phase 2 contests).

---

## 🟧 2. Chat track — revenue-critical UX (P0, parallel to §1 since it's UI-only)

Each task is a prompt at [tasks/prompts/chat/](./prompts/chat/). Start C02 + C03 first (they don't overlap).

- [ ] **C02 — Reasoning Trace UX** (2d) — collapsible "Thought for Ns" panel above the streaming reply. +15% trust → +20% conversion. Depends on existing `ai-chat` SSE phase events. Prompt: [C02-reasoning-trace-ux.md](./prompts/chat/C02-reasoning-trace-ux.md).
- [ ] **C03 — Lead Capture Tool** (1d) — every chat session becomes a row in `leads`. $20–50 per qualified lead. Uses existing `leads` table + `lead-from-form` edge fn. Prompt: [C03-lead-capture-tool.md](./prompts/chat/C03-lead-capture-tool.md).
- [ ] **C14 — pgvector RAG semantic search** (2d) — unlocks vibe queries ("quiet place for remote work"). Depends on `25L_embedding_cache` table. Prompt: [C14-pgvector-rag-semantic-search.md](./prompts/chat/C14-pgvector-rag-semantic-search.md). Skill: `pgvector`, `pgvector-semantic-search`.
- [ ] **C04 — Host Listing Intake via Chat** (3d) — unblocks the host SaaS funnel ($99–299/mo). Depends on **C03**. Prompt: [C04-host-listing-intake.md](./prompts/chat/C04-host-listing-intake.md).
- [ ] **C05 — Events Chat Flows** (4d) — discovery + ticket purchase + creation in chat. 5–8% commission. Depends on `events` table + `ticket-checkout`. Prompt: [C05-events-chat-flows.md](./prompts/chat/C05-events-chat-flows.md).

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
- [ ] **H3 — `event_promo_codes` schema + apply flow at checkout.
- [ ] **H4 — Order refunds + Stripe refund API** in `ticket-payment-webhook`. Skill: `mde-stripe`.
- [ ] **H5 — Taxes / IVA 19%** at checkout.
- [ ] **H6 — `listing-moderate` photo moderation edge fn**.

---

## 🟦 5. Phase 3 — Sponsorship marketplace + intelligence

Sponsorship core (14/14 tasks) done. Marketplace + intelligence layer is 0%. Top items:

- [ ] **S1 — Sponsor chat concierge** — 3 intents in `ai-router` + `ai-chat`.
- [ ] **S2 — `find_sponsor_match` tool** — wire `ai-audience-match` into chat tool registry.
- [ ] **S3 — Sponsor onboarding wizard** — application → contract → first impression.
- [ ] **S4 — `ai-roi-explain` daily insight card** in sponsor dashboard.
- [ ] **S5 — `ai-creative-gen` brief → ad copy + image prompts**.
- [ ] **S6 — Stripe Connect payouts** to event organizers (per-event split).
- [ ] **S7 — Scam-score pipeline** for inbound listings (S1–S6 signals per [prd.md §4.5](../prd.md)).

---

## 🟪 6. Chat track — retention + reach (P1)

After C02–C05 land. These compound the chat surface.

- [ ] **C06 — Chat memory + personalization** (3d) — returning users 3× conversion. Depends on `user_preferences` + Hermes. Prompt: [C06-chat-memory-personalization.md](./prompts/chat/C06-chat-memory-personalization.md).
- [ ] **C07 — Multilingual EN/ES + personas** (2d) — 60% addressable-market lift. Standalone. Prompt: [C07-multilingual-follow-up.md](./prompts/chat/C07-multilingual-follow-up.md).
- [ ] **C08 — WhatsApp continuity** (2d) — LATAM 5× retention. Depends on `openclaw-concierge-webhook`. Skill: `mde-whatsapp`. Prompt: [C08-whatsapp-continuity.md](./prompts/chat/C08-whatsapp-continuity.md).
- [ ] **C15 — Booking confirmation flow** (2d) — closes booking revenue loop. Depends on existing `create_booking_preview` tool. Prompt: [C15-booking-confirmation-flow.md](./prompts/chat/C15-booking-confirmation-flow.md).
- [ ] **C16 — Multi-vertical inline cards** (2d) — restaurants/events/cars parity with rentals. Prompt: [C16-multi-vertical-inline-cards.md](./prompts/chat/C16-multi-vertical-inline-cards.md).
- [ ] **C09 — CRM + sponsor + buyer/seller flows** (5d, P2) — sponsor deals $500–5K each. Depends on **C03 + C06**. Prompt: [C09-chat-crm-sponsor-buyer-flows.md](./prompts/chat/C09-chat-crm-sponsor-buyer-flows.md).

---

## ⬜ 7. Tech-debt cleanup (anytime, low priority)

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
