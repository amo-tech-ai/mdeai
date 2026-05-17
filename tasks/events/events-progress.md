---
doc_id: EVENTS-PROGRESS
title: Events V2 — progress tracker
version: 1.8
date: 2026-05-17
status: Active
mvp_plan: ./docs/EVENTS-MVP-PLAN.md
mvp_hub: ./mvp-events.md
gate: ../todo.md §1 (G1–G5 — **G2/G3/G5 need rewrite** if scanner deferred)
mvp_definition: commerce-first (no door scan)
---

# Events V2 progress

## MVP snapshot (2026-05-17) — **Commerce MVP** (scanner deferred)

**Product name:** Lightweight **event commerce** — not venue-ops infrastructure.

**MVP loop:**

```text
discover → publish → pay → receive QR/ticket in wallet → host sees sales
```

**Out of this MVP:** staff scanner, check-in, staff-link revoke at door, offline scan queue, G2/G3 as currently written in [`todo.md`](../todo.md). Those move to **Phase 5 — Operations** (EVT-036–038, EVT-024) after real payments + organizers.

Spec: [`docs/EVENTS-MVP-PLAN.md`](./docs/EVENTS-MVP-PLAN.md) (update pending) · Hub: [`mvp-events.md`](./mvp-events.md).

### Overall MVP completion: **~50%**

Re-weighted for **commerce-only** (scanner lane removed from denominator).

| Lane | Weight | Done | Notes |
|------|--------|------|-------|
| **Commerce foundation** (webhook, idempotency, `qty_pending`, RLS) | 25% | **~72%** | RLS catalog + **EVT-011 live anon negatives** ✅; G4 + prod webhook + pending expiry cron still open |
| **Buyer path** (browse, checkout, wallet, QR) | 30% | **~75%** | Local proof strong; live mdeai.co + email reliability open |
| **Host path** (publish, tiers, sales dashboard) | 30% | **~5%** | **Long pole** — `/admin/events` only; EVT-027–030 not in `App.tsx` |
| **Production wiring + gates** | 15% | **~15%** | G1 partial locally; G4/G5 open; G2/G3 N/A until ops phase |

**Launch (commerce MVP):** 🔴 **NO-GO** until host dashboard + prod webhook + G4 oversell proof.

### What’s needed to complete MVP (task order)

#### Phase 1 — Commerce foundation (P0)

| # | Deliverable | Tasks |
|---|-------------|-------|
| 1 | Permanent Stripe webhook on production URL | G1, EVT-068 |
| 2 | Webhook idempotency + replay safety (proven) | EVT-016, EVT-069 ✅ local |
| 3 | Inventory lock (`qty_pending` + CHECK) proven under load | EVT-013, **G4** |
| 4 | Abandoned checkout: `ticket_checkout_cancel` + **scheduled expiry** (cron/RPC) | Migration has RPC; **no cron doc yet** |
| 5 | Reconciliation job spec: Stripe ↔ DB, stale `pending` orders | **New task** |
| 6 | Auth matrix + RLS negative tests | EVT-008 open · **EVT-011 ✅** |
| 7 | Production smoke on mdeai.co | G1 |

#### Phase 2 — Buyer experience

| # | Deliverable | Tasks |
|---|-------------|-------|
| 8 | `/events`, `/events/:id`, checkout, wallet, QR detail | EVT-032–034 ✅ local |
| 9 | Mobile UX + wallet hardening | EVT-035 |
| 10 | Email / resend reliability (proof of purchase) | EVT-020, G1 |

#### Phase 3 — Host experience (**now the product**)

| # | Deliverable | Tasks |
|---|-------------|-------|
| 11 | `/host/event/new` — publish + tiers | EVT-027–029 |
| 12 | `/host/event/:id` — sales KPIs, attendee export | EVT-030 |
| 13 | Realtime sales tiles | EVT-025 |

#### Phase 4 — Discovery (minimal)

| # | Deliverable | Tasks |
|---|-------------|-------|
| 14 | Chat cards → `/events/:id` | Chat track |
| 15 | Event search in chat (existing) | — |

#### Phase 5 — Deferred (after real users + payments)

Scanner (EVT-036–038), staff revoke (G3), contests, OpenClaw, sponsor campaigns, Places autocomplete (EVT-039+), Hermes.

### MVP exit criteria (commerce)

- [ ] Organizer can **publish** an event with ≥1 tier  
- [ ] Buyer can **pay** on mdeai.co → **wallet QR** (email nice-to-have)  
- [ ] **Zero oversell** under 50 concurrent checkouts (G4)  
- [ ] Host sees **ticket sales / revenue** on dashboard  
- [x] RLS negatives pass (EVT-011) — 7 live anon tests 2026-05-17  
- [ ] Lighthouse a11y ≥90 on **listing, buy, wallet, host dashboard** (not scanner)  
- [ ] `npm run floor` green  

**Not required for commerce MVP:** G2 scan, G3 staff revoke, scanner route.

---

**Real-world picture (commerce MVP):** A host publishes “Salsa Friday” on mdeai.co. A tourist finds it (browse or chat), pays, gets a QR in the wallet. The host watches tickets sold on a dashboard. **Door scan is a later phase** — for MVP the ticket is proof of purchase; manual list check at small events is acceptable.

**V2 = that full loop on our stack** (Supabase + Stripe + React), with AI helping **find** events and **draft** listings — never taking money or scanning doors automatically.

**Tracker:** 72 tasks `EVT-001`…`072` in `V2-tasks/{core,mvp,advanced,production}/` — **MVP slice ≈ EVT-001–038 + G1–G5**.

---

## Summary — completed vs in progress (2026-05-17)

### ✅ Completed (signed off)

| ID | Real world | Technical proof |
|----|------------|-----------------|
| **EVT-009** | Checkout and door-scan APIs work when the app calls them (gateway was blocking calls) | `verify_jwt=false` on checkout/validate; curl proof |
| **EVT-069** | A test card payment actually marks an order **paid**; paying twice does not sell extra seats | `cs_test_` + webhook + SQL `paid` + replay |
| **EVT-032** | Event detail starts real V2 ticket checkout instead of the legacy wizard | Headed Chrome `/events/:id` → Buy Ticket → `cs_test_` Checkout |
| **EVT-033** | Buyer wallet shows the paid active ticket | `/me/tickets?checkout=success` rendered the paid ticket after webhook finalization |
| **EVT-034** | QR ticket detail renders only for paid active attendee | `/me/tickets/:id` showed paid/active state and QR on desktop + 390x844 mobile |

**Formal count:** **5 / 72** tasks **Completed**.

### 🟡 Built but not signed off

| Area | Real world | ~% |
|------|------------|-----|
| **Database** | System remembers events, ticket types, who bought, who scanned in | ~70% |
| **Server APIs** | “Start pay”, “Stripe told us they paid”, “scan QR”, “give staff a scan link” | ~75% |
| **Parity / edges** | Production matches repo enough to deploy ticket code | ~85% |
| **Buyer V2 UI** | Event detail → Stripe Checkout → paid order → wallet → QR proof passed locally through Stripe CLI listener | ~90% |

### 🔧 Working on next

| # | Real world |
|---|------------|
| 1 | Permanent Stripe Dashboard webhook endpoint + Vercel/live-domain buyer smoke |
| 2 | Wallet hardening and QR proof regression tests |
| 3 | **Staff scanner** shell and validation |
| 4 | Prove strangers cannot read other people’s orders |

### Verdict

| Question | Answer |
|----------|--------|
| **Events MVP overall (commerce)** | **~48%** — see [MVP snapshot](#mvp-snapshot-2026-05-17--commerce-mvp-scanner-deferred) |
| Can a stranger buy a ticket on mdeai.co today? | **Local proof passed; live mdeai.co not signed off** — proof used localhost UI + remote Supabase Edge Functions + Stripe CLI webhook forwarding |
| EVT YAML signed off | **5 / 72** (~7%) — not the same as MVP % |
| Backend / buyer UI only | **~65%** backend · **~90%** buyer ticket UI (local) |
| Launch | 🔴 **NO-GO** until items 1–10 in [What’s needed to complete MVP](#whats-needed-to-complete-mvp-in-order) |

---

## Dashboards — who sees what (events)

*A **dashboard** is a signed-in screen where someone manages or monitors events. Below: what exists **today** vs what **V2 plans**.*

### Dashboard progress overview

| Dashboard | URL (today) | Who uses it | Real-world job | Built? | Chatbot link |
|-----------|-------------|-------------|----------------|--------|----------------|
| **Public browse** | `/events` | Tourist, local | “What’s on this week?” | 🟢 List + filters | Chat sends people here indirectly (weak links) |
| **Event detail** | `/events/:id` | Buyer | Read details, save, buy V2 ticket, legacy fallback if no V2 tier | 🟢 Local V2 buyer proof passed through Stripe test Checkout | Cards should open here — today often external URL |
| **User home** | `/dashboard` | Logged-in user | See my trips/bookings + event teasers | 🟡 Snippet only | No “your hosted events” |
| **Admin events** | `/admin/events` | Internal admin | Create/edit any event listing | 🟢 CRUD | **Not** for hosts; admins only |
| **Admin home** | `/admin` | Internal admin | Count events + jump to admin lists | 🟢 Stats tile | None |
| **Host events** | `/host/events` *(planned)* | Event organizer | My drafts, publish, tiers, sales KPI | 🔴 **Missing** | Target: chat draft → open this dashboard |
| **Host event editor** | `/host/events/:id` *(planned)* | Host | Edit date, venue, ticket types, go live | 🔴 **Missing** | AI proposes fields; human publishes here |
| **Buyer wallet** | `/me/tickets` | Buyer | All my QRs after purchase | 🟢 Local paid-order wallet proof passed; live-domain smoke pending | Chat: “show my ticket” → here |
| **Staff scanner** | `/staff/scan` *(planned)* | Door staff | Camera scan → valid / already used | 🔴 **Missing** | None (staff use PWA, not chat) |

### Real-world journeys vs dashboards

| Persona | Today they use… | Missing dashboard |
|---------|-----------------|-------------------|
| **Camila (buyer)** | Chat or `/events` → detail → V2 Buy Ticket if tiers exist; legacy fallback if not | Local test-card proof passed; chat deep link and live-domain proof still missing |
| **Host (organizer)** | `/admin/events` *(if admin)* or ask team to list event | `/host/events` wizard + live sales view |
| **Roberto (staff)** | Nothing in app | `/staff/scan` PWA |
| **Ops / you** | `/admin/events` | Host self-serve so admins are not the bottleneck |

---

## Chatbot integration — [/chat](https://www.mdeai.co/chat)

*How the concierge at mdeai.co/chat connects to Events V2. **Propose-only:** AI suggests; user confirms; money and publish stay human-controlled.*

### Chat integration progress

| Journey step | Real world (what the user says) | Today | Target (V2) |
|--------------|-----------------------------------|-------|-------------|
| **Discover** | “What’s on Saturday?” / “salsa near Poblado” | 🟢 Search DB → event cards + map pins | Same + better summaries (`ai_summary`) |
| **Pick an event** | “Tell me more about #2” | 🟡 Text reply; card may open **external** ticket site | Card opens `/events/:id` on mdeai |
| **Buy** | “Book 2 tickets” | 🟢 Event detail button completed one local Stripe test-card flow; chat still has no checkout tool | Button → Stripe checkout → “View in My tickets” |
| **After purchase** | “Where’s my QR?” | 🟢 Wallet/QR routes showed paid active ticket locally; chat still has no ticket intent | Link to `/me/tickets/:orderId` |
| **Create event (host)** | “Create a salsa night May 20 at Lido” | 🔴 Not possible in chat | AI **draft preview** → Apply → `/host/events/:draftId` |
| **Manage event (host)** | “How many tickets sold?” | 🔴 No host context in chat | Read-only KPI card + “Open dashboard” link |
| **Staff** | “Scan this QR” | 🔴 N/A | Staff use scanner PWA, not chat |

### How chat works technically (today)

| Piece | Role |
|-------|------|
| **`/chat`** | Main concierge UI (`ChatCanvas`) — map panel + messages |
| **`ai-chat` edge** | Default path: Gemini + tool `search_events` → `OPEN_EVENT_RESULTS` |
| **Mastra** *(optional)* | If `VITE_USE_MASTRA_CHAT=true`: router → `event-discovery-workflow` + `search-events` tool |
| **`EventCardInline`** | Renders results in the thread |
| **`EmbeddedListings`** | Puts event pins on the chat map |
| **Gap** | `sourceUrl` = `ticket_url` (external), not `/events/{id}`; no create/host/buy tools |

### Chat ↔ dashboard handoff (target)

```text
Host in /chat                          Host dashboard (planned)
─────────────────────────────────────────────────────────────
"Create salsa night May 20"     →      Draft appears in /host/events
AI shows preview (propose)             Host sets tiers + price
User taps [Apply draft]                User taps [Publish]
                                       Live on /events/:id

Buyer in /chat                         Buyer screens (planned)
─────────────────────────────────────────────────────────────
"Events this weekend"           →      Cards → /events/:id
"Buy 2 for the first one"       →      Stripe → /me/tickets (QR)
```

---

## Current screens (inventory)

| Route | Real world | V2 pay / QR | Chat tie-in |
|-------|------------|-------------|-------------|
| `/chat` | Ask the city concierge | Discover only | **Primary** event discovery |
| `/events` | Browse like Eventbrite list | List only | Should receive traffic from chat cards |
| `/events/:id` | Event landing page | V2 tiers call `ticket-checkout`; old wizard is labeled legacy fallback; headed browser payment proof passed locally | Target deep link from chat |
| `/explore` | Map-first discovery | Links to `/events` | Same catalog as chat search |
| `/me/tickets` | Buyer wallet | Reads paid orders through anonymous token RPC; paid ticket proof passed locally | Future “show my ticket” chat handoff |
| `/me/tickets/:id` | Ticket QR page | Shows QR only for paid active attendees; QR proof passed locally | Future QR deep link |
| `/dashboard` | “My account” home | Bookings snippet | No host events |
| `/concierge` | Alternate chat entry | Same as `/chat` | Duplicate path |
| `/admin/events` | Staff maintains catalog | Manual rows | **Not** host self-serve |

**Planned routes:** `/host/events`, `/host/events/:id`, `/staff/scan`.

---

## Suggested next steps (product + chat + dashboards)

1. Permanent webhook/Vercel smoke: prove the same buyer flow on `https://www.mdeai.co` with the Stripe Dashboard endpoint, not only the CLI listener.
2. Wallet hardening + QR proof regression tests.
3. **EVT-026 (G4)** — 50-buyer load test (**commerce P0**; EVT-011 ✅).
4. **EVT-008** — publish edge auth matrix doc.
5. ~~EVT-036–037 scanner~~ — **deferred** (ops phase); CORE 021–023 coded.
6. **Host dashboard shell** — `/host/event/new` + `/host/event/:id` (EVT-027–030).
7. **Chat cards** — `sourceUrl` → `https://www.mdeai.co/events/{id}`.
8. **Chat `propose_event_draft`** — preview → host dashboard.

---

## Phase overview

| Phase | Real world (what users get) | YAML 🟢 | Built | Dashboards in scope | Chat in scope |
|-------|----------------------------|---------|-------|---------------------|---------------|
| **CORE** | Money and data work on the server | **4/26 Completed** (001, 009, 010, 011) · **~14/26 built** | **~65%** code · **~45%** verified — [`V2-tasks/core/00-core-audit.md`](./V2-tasks/core/00-core-audit.md) | APIs only | Search only |
| **MVP** | Host publishes; buyer pays; wallet QR | 3/12 signed | ~48% commerce | Host + wallet (**scanner deferred**) | Deep links |
| **ADVANCED** | Maps venue, smarter search, AI copy | 0/18 | ~15% | Venue picker in host wizard | Richer discovery + descriptions |
| **PRODUCTION** | Safe to turn on for real money | 1/16 | ~35% | N/A | Parity + no accidental AI checkout |

---

## Progress tracker — P0 spine

| Task | Real world | Dashboard | Chat | Status |
|------|------------|-----------|------|--------|
| EVT-057 | Ticket code lives in our repo | — | — | 🟡 |
| EVT-068 | Proof prod DB matches dev | Admin relies on this | — | 🟡 |
| EVT-008 | Written rules: who can call which API | — | — | 🔴 |
| EVT-009 | Pay/scan APIs reachable | — | — | 🟢 |
| EVT-011 | Hackers cannot read others’ orders | Host/buyer dashboards safe | — | 🟢 **Completed** |
| EVT-069 | Test payment really works | — | — | 🟢 |
| EVT-032 | “Buy ticket” button | **Event detail** | Leads from chat card | 🟢 local headed-browser 4242 proof passed via `cs_test_...` Checkout |
| EVT-033–034 | Phone wallet with QR | **`/me/tickets`** | “My QR” link | 🟢 paid active ticket + QR proof passed on desktop and 390x844 mobile |
| EVT-036–037 | Door scan app | **`/staff/scan`** | — | 🔴 |
| G1–G5 | Real people test the loop | All above | Optional chat discover | 🔴 |

---

## CORE (001–026) — database and ticket engine

**Audit:** [`V2-tasks/core/00-core-audit.md`](./V2-tasks/core/00-core-audit.md) · Each task has **Purpose / Goals / Features** at top (2026-05-17).

**Real world:** Invisible plumbing — reserve seat, record order, mint QR. Commerce MVP needs **012–019 + 013 + 016 + 026 + 011** proven; scanner tasks **021–024** coded but **deferred** for launch.

| Task | Real world | % | Status | Tests |
|------|------------|---|--------|-------|
| EVT-001 | Published events public | 100 | 🟢 **Completed** | Vitest 6 |
| EVT-002 | Ticket tiers + caps | 80 | 🟡 | — |
| EVT-003 | Orders pending → paid | 80 | 🟡 | smoke |
| EVT-004 | One attendee per ticket | 85 | 🟡 | EVT-069 |
| EVT-005 | Scan audit log | 75 | 🟡 ops defer | — |
| EVT-006 | Venue on event | 75 | 🟡 | — |
| EVT-007 | AI run logging | 15 | 🔴 Open | — |
| EVT-008 | Auth matrix doc | 35 | 🔴 Open | — |
| EVT-009 | Gateway JWT settings | 92 | 🟢 **Completed** | Vitest 5/5 |
| EVT-010 | RLS policy review | 100 | 🟢 **Completed** | Vitest 10 |
| EVT-011 | RLS negative tests | 100 | 🟢 **Completed** | Vitest 9 (7 live) |
| EVT-012 | Start payment API | 88 | 🟡 | smoke 6 |
| EVT-013 | Seat hold / no oversell | 85 | 🟡 | G4 open |
| EVT-014 | Stripe paid webhook | 88 | 🟡 | smoke |
| EVT-015 | Stripe signature | 85 | 🟡 | smoke |
| EVT-016 | Webhook idempotency | 82 | 🟡 | smoke |
| EVT-017 | Order → paid | 85 | 🟡 | smoke |
| EVT-018 | Create attendees | 88 | 🟡 | SQL proof |
| EVT-019 | Signed QR JWT | 85 | 🟡 | local |
| EVT-020 | Email ticket | 5 | 🔴 Open | — |
| EVT-021 | Validate QR API | 80 | 🟡 ops defer | config only |
| EVT-022 | ALREADY_USED | 55 | 🟡 ops defer | missing |
| EVT-023 | Staff magic link | 78 | 🟡 ops defer | — |
| EVT-024 | Revoke staff link | 65 | 🟡 ops defer | — |
| EVT-025 | Realtime sales | 70 | 🟡 needs EVT-030 | — |
| EVT-026 | 50-buyer load test | 0 | 🔴 **P0 G4** | not run |

---

## MVP (027–038) — dashboards and screens people touch

**Real world:** Hosts run events without calling admin. Buyers pay on-site. Staff scan phones at the door.

### MVP dashboard map

| Task | Screen / dashboard | Real world | Chat integration (target) | Status |
|------|-------------------|------------|---------------------------|--------|
| EVT-027 | `/host/events/new` wizard | “I’m hosting a meetup” step-by-step | Chat fills draft → opens wizard | 🔴 |
| EVT-028 | Host editor | Draft / published / sold out / ended | Status visible after chat Apply | 🔴 |
| EVT-029 | Publish gate | Cannot go live without date, tier, price | Chat warns what’s missing | 🔴 |
| EVT-030 | **Host dashboard** | Tickets sold, revenue, check-ins live | “How am I doing?” → summary + link | 🔴 |
| EVT-031 | Host draft + AI | AI suggests title/description; host edits | **Propose-only** in chat | 🔴 |
| EVT-032 | **Event detail** | Big “Buy tickets” | Card CTA → this page → Stripe | 🟢 local proof complete |
| EVT-033 | **`/me/tickets`** | List of my events | “My tickets” intent in chat | 🟢 local proof complete |
| EVT-034 | **`/me/tickets/:id`** | QR fullscreen for door | Link after purchase | 🟢 local proof complete |
| EVT-035 | Mobile QA | Thumb-friendly buy + QR | Test chat → buy on phone | 🔴 |
| EVT-036 | **`/staff/scan`** shell | Staff opens link on phone | — | 🔴 |
| EVT-037 | Scanner → validate API | Beep valid / already used | — | 🔴 |
| EVT-038 | Scanner a11y | Works with screen readers | — | 🔴 |

---

## ADVANCED (039–056) — maps, AI, automation

**Real world:** Pick a venue on the map, get AI-written event blurbs, discover events in chat with Medellín context. Marketing bots only run **after** a human approves.

**Dashboards:** Venue picker inside **host editor**; sponsor/campaign views later.  
**Chatbot:** Richer **search** and **description proposals**; never auto-publish or charge.

| Area | Real world | Dashboard | Chat | Status |
|------|------------|-----------|------|--------|
| EVT-039–044 | “Teatro Lido” autocomplete, map route | Host wizard venue step | “Events near Parque Lleras” + map | 🟡 partial |
| EVT-045–049 | Smarter event search in Mastra | — | Main discovery upgrade | 🟡 partial |
| EVT-049 | AI cannot call checkout | Protects all dashboards | Guardrail on tools | 🔴 |
| EVT-050–056 | Campaign drafts, approvals, bots | Sponsor ops (other pillar) | Propose campaigns only | 🔴 |

---

## PRODUCTION (057–072) — safe to launch

**Real world:** Confidence checks before real customers — production DB matches code, test card works, dependencies not vulnerable.

| Task | Real world | Dashboards / chat |
|------|------------|-------------------|
| EVT-057 | Ticket code in git | Enables all dashboards |
| EVT-058 | Webhook cannot oversell | Protects host KPI truth |
| EVT-059 | Public checkout allowed safely | Buy button + chat CTA |
| EVT-060 | Bots cannot post without approval | Chat/host safety |
| EVT-068 | Prod vs dev parity doc | Admin/host data trust |
| EVT-069 | Test Stripe path | Proves buyer dashboard will work |
| EVT-070–072 | Alerts, cost caps, clean npm audit | Ops dashboard (future) |

---

## Systems — how pieces connect (real world)

| System | Everyday role | Dashboards using it | Chat using it | % |
|--------|---------------|---------------------|---------------|---|
| **Supabase** | Database + APIs | All host/buyer/staff screens | `search_events` | ~70% |
| **Stripe** | Card payments | Event detail, host revenue | Future “buy” tool | ~80% local proof; permanent webhook still open |
| **React app** | What people click | All routes above | `/chat` UI | ~90% buyer tickets |
| **Gemini** | Write suggestions | Host editor copy | Chat replies + cards | ~20% |
| **Mastra** | Route “events vs rentals” | — | Optional `/chat` backend | ~25% |
| **Google Maps** | Where is the venue | Host picker, chat map | Pins on chat map | ~30% |

---

## Proof already run

| Check | Real world meaning |
|-------|-------------------|
| 222 Vitest pass | Automated checks green |
| EVT-069 smoke | Test buyer could pay (script path) |
| `ticket-checkout` invoked from `src/components/events/EventTicketCheckout.tsx` | App now has a local V2 buyer path; browser payment proof passed through Stripe CLI listener |
| Browser smoke on `127.0.0.1:4177` | `/events` loaded, `/events/:id` loaded V2 tiers, Buy Ticket redirected to `checkout.stripe.com/c/pay/cs_test_...` |
| Stripe 4242 browser payment | Real headed Chrome completed hosted Checkout with `cs_test_`; Stripe CLI forwarded webhooks to Supabase with HTTP 200 |
| SQL order proof | Order `f2a8bcd4-2c09-4e9b-8859-b793667b4566` is `paid` with non-null Stripe payment intent |
| SQL attendee proof | Attendee `1053b7d2-80d4-4e87-8719-dc2d176ee1ff` is `active` with a QR token prefix; full QR token intentionally not recorded |
| Replay proof | Resent successful Stripe event; order stayed `paid` and attendee count stayed `1` |
| Mobile wallet/QR smoke | `/me/tickets` and `/me/tickets/:id` render the paid active ticket/QR at 390×844 |
| `MDEAI_ALLOW_MIGRATION_EDIT=1 npm run verify:edge` | Edge compile/tests green after JWT/webhook/validate type fixes |
| `npm audit --omit=dev --audit-level=high` | Still fails: 4 high + 1 moderate production advisories remain |
| G1–G5 not run | Camila/Roberto stories not exercised |

---

## Roadmap (one list)

1. ✅ Server auth + test Stripe (009, 069)  
2. 🟡 Sign parity + repo edges (068, 057)  
3. ✅ **Buyer dashboard path:** detail buy → Stripe → paid order → `/me/tickets` → QR proved locally  
4. 🔜 **Wallet hardening / QR regression proof**  
5. 🔜 **Staff dashboard:** `/staff/scan`  
6. 🔜 **Host dashboard:** `/host/events` + publish  
7. 🔜 **Chat:** deep links + propose draft → host dashboard  
8. ⏸ Maps + automation (039+) after core loop  

**Last updated:** 2026-05-17
