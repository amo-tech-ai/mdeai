---
id: USER-STORIES
phase: ALL (Phase 1 prioritized — Phase 2+ preview only)
prd_section: 09-prd.md §2 + 14-production-architecture.md §3
type: user-stories
related: [09-prd, 14-production-architecture, 18-mvp-gap]
---

# 15 — User stories: events platform

**Reality check.** Phase 1 (the 3-week MVP per [`diagrams/18-mvp-gap.md`](./diagrams/18-mvp-gap.md)) covers **5 of the 10 event types with one code path** — any event that is *single-venue + paid tickets + door check-in*. That's beauty pageant, music concert, networking, fashion show, workshop. The other 5 (restaurant week, contest/awards, sports/stadium, community/recurring, hybrid/virtual) need Phase 2+ features (multi-venue, voting, recurring schedules, large-capacity flows, streaming) and are stubbed in §7 — not built now.

This doc is the contract between the event types you care about and the user-facing screens we ship in Phase 1. Every story below is testable.

---

## 1. Personas

| Persona | Real-world example | Primary goal | Phase introduced |
|---|---|---|---|
| **Organizer** (Sofía) | Producer of Miss Elegance Colombia 2026 | Create event, sell tickets, run check-in, see revenue | Phase 1 |
| **Attendee** (Camila) | Local 24yo or visiting traveler | Discover the event, buy a ticket, get in at the door | Phase 1 |
| **Door staff** (Andrés) | Hired hand or volunteer at venue | Scan QR codes fast, decide who enters | Phase 1 |
| **Admin** (mdeai team) | Internal operator | Spot-check listings, toggle visibility, handle Stripe issues | Phase 1 |
| **Sponsor** (Daniela @ Postobón) | Brand rep funding the event | Pay → see exposure → measure ROI | Phase 2 |
| **Contestant** (Luna, candidate #7) | Pageant participant | Have a profile, collect public votes | Phase 2 |
| **Vendor partner** (Carlos, restaurant owner) | Joins multi-venue food festival | List my place, attract foot traffic | Phase 2 |
| **Marketing operator** (the AI agent OpenClaw) | Automation runtime | Compose + queue WhatsApp/IG content | Phase 3 |

**Phase 1 ships with the top 4 personas only.** The remaining 4 are scoped in §7.

---

## 2. Phase 1 user stories — Organizer (Sofía)

These stories cover the `/host/event/new` wizard + `/host/event/:id` dashboard from [`18-mvp-gap.md`](./diagrams/18-mvp-gap.md).

### S-O-1 — Create a new event

> **As an organizer, I want to create an event in 4 short steps so I can publish it the same day I sit down to do it.**

**Acceptance criteria:**
- ✅ Wizard at `/host/event/new` has 4 steps: **Basics → Tickets → Review → Publish**.
- ✅ Step 1 captures: name, description, hero photo, start/end datetime, timezone (default `America/Bogota`), address + city, optional website, optional age restriction.
- ✅ Step 1 offers a "✨ Generate description" button that calls Gemini Flash and returns 3 short variants (≤200 chars each); user picks one or rejects all.
- ✅ Hero photo runs through existing photo-moderation edge fn before save.
- ✅ Step 4 sets `status='published'` and generates a unique `slug` from the name (with collision → append `-2`, `-3`, …).
- ✅ Draft auto-saves on every step transition (`status='draft'`); resuming hits `/host/event/new?draft=:id`.
- ✅ All four data-state branches handled (loading, error, empty, success) per `style-guide.md`.

**Out of scope for S-O-1:** schedule items, venue picker, custom checkout questions, embeddable widget. Those are Phase 2.

---

### S-O-2 — Define ticket types

> **As an organizer, I want to add 1–5 ticket tiers (e.g. GA, VIP, Early Bird) so I can capture different price points.**

**Acceptance criteria:**
- ✅ In wizard Step 2, organizer adds rows to `event_tickets` with: name, description (optional), price in COP cents, quantity (`qty_total > 0`).
- ✅ Currency is `'COP'` by default; locked for Phase 1 (multi-currency = Phase 2).
- ✅ Validation: `qty_total > 0`, `price_cents >= 0` (zero allowed for free events), at least 1 ticket type required to publish.
- ✅ A read-only field shows live `qty_sold / qty_total` and revenue once tickets are sold.
- ✅ Organizer can mark a tier as `is_active=false` to stop selling it without deleting it (preserves audit history).

**Out of scope:** promo codes, donations, hidden tickets, tax/VAT, refund policy text, custom checkout questions. Phase 2.

---

### S-O-3 — Publish & share the event

> **As an organizer, I want to publish my event and get a shareable URL so I can post it in WhatsApp groups and Instagram.**

**Acceptance criteria:**
- ✅ Publishing transitions `status` from `draft` → `published`; the event appears on `/events` listing.
- ✅ Wizard Step 4 shows the public URL `https://mdeai.co/event/:slug` with one-click copy.
- ✅ A "Share" panel offers prefilled WhatsApp + IG copy (English-first; Spanish-Paisa toggle available).
- ✅ Once published, organizer cannot reduce `qty_total` below `qty_sold` (DB CHECK enforces).

---

### S-O-4 — See my dashboard

> **As an organizer, I want to see how many tickets I sold, how many people checked in, and how much money I made — without doing math.**

**Acceptance criteria:**
- ✅ At `/host/event/:id`, four KPI cards show: **Tickets sold**, **Revenue (COP)**, **Checked in**, **No-shows** (computed = sold − checked-in once event end_time has passed).
- ✅ Per-ticket-tier breakdown table (sold/remaining/revenue per tier).
- ✅ Attendee list with name, email, ticket tier, purchase time, check-in status — paginated 50 per page.
- ✅ Live updates via Supabase Realtime channel on `bookings` rows for this event (no polling).
- ✅ All numbers traceable to existing tables (no new aggregation tables for Phase 1).

---

### S-O-5 — Delegate door check-in

> **As an organizer, I want my door staff to scan tickets without giving them my password.**

**Acceptance criteria:**
- ✅ At `/host/event/:id`, organizer generates a "staff link" that opens the scanner PWA at `/staff/check-in/:event` with a short-lived JWT (24h TTL).
- ✅ The link grants only the `ticket-validate` edge fn permission scoped to that one event — no other access.
- ✅ Organizer can revoke the link any time (button in dashboard).
- ✅ Multiple staff can use the same link concurrently — server enforces single-use per QR via `qr_used_at`.

---

## 3. Phase 1 user stories — Attendee (Camila)

These stories extend the existing `/events` discovery flow + replace the external `ticket_url` redirect with internal Stripe Checkout.

### S-A-1 — Discover an event

> **As a traveler in Medellín, I want to browse upcoming events filtered by date and city so I can pick something for tonight.**

**Acceptance criteria:**
- ✅ Existing `/events` page (Events.tsx) continues to work — no regression on filters: type, city, date, free, search, calendar view.
- ✅ Events seeded from Google + Ticketmaster + manual continue to render.
- ✅ NEW Phase-1 organizer-created events appear alongside (`source='manual'` or new `source='organizer'`).
- ✅ Sort default: `event_start_time ASC` (soonest first).

**No code change here** — existing `useEvents` hook already supports this. Story exists to confirm the foundation is not broken.

---

### S-A-2 — Read event detail and decide

> **As an attendee, I want to see the event description, photos, exact location, ticket prices, and remaining capacity so I can decide before I pay.**

**Acceptance criteria:**
- ✅ `/event/:slug` (extended from existing `/event/:id`) shows: hero photo, description, datetime, address, map pin, ticket tiers with price + remaining count.
- ✅ "Get Tickets" CTA is **internal** (Phase 1 change) — opens the existing `EventBookingWizardPremium` configured for the new `ticket-checkout` flow.
- ✅ For events with no `event_tickets` rows (legacy Google/Ticketmaster catalog), CTA falls back to the existing external `ticket_url` (no regression).
- ✅ Save / unsave button writes to `saved_places` (existing).
- ✅ Slug-based routes prefer `slug`; numeric ids still resolve for legacy.

---

### S-A-3 — Buy a ticket

> **As an attendee, I want to pay with my card and get my ticket emailed to me — no account creation required.**

**Acceptance criteria:**
- ✅ Click "Get Tickets" → wizard collects: ticket tier, quantity (1–10), attendee name, attendee email.
- ✅ Submit calls `ticket-checkout` edge fn; receives Stripe Checkout Session URL.
- ✅ Stripe Checkout opens (hosted page); user pays in COP.
- ✅ On success, Stripe webhook → `ticket-payment-webhook` edge fn → atomically increments `event_tickets.qty_sold`, mints signed JWT QR token, writes `bookings` row with `qr_token`, sends confirmation email via SendGrid.
- ✅ Atomic guarantee: `qty_sold` increment uses `pg_advisory_xact_lock(event_id)` + check `qty_sold + qty < qty_total` or transaction rolls back. **No oversell ever.**
- ✅ Idempotency: webhook uses Stripe `payment_intent` id as idempotency key (existing `idempotency_keys` table) — replays do not double-mint tickets.
- ✅ Anonymous purchase allowed (no Supabase auth required) — `bookings.user_id` nullable when `attendee_email` is set.
- ✅ User can purchase up to 10 tickets in one transaction (one QR per ticket).

**Failure handling:**
- Card declined → Stripe handles UI, user returns to event page, no DB write.
- Webhook fails after Stripe charge → admin alert; manual reconciliation via Stripe Dashboard (Phase 1 allows this; Phase 2 adds auto-retry).

---

### S-A-4 — Receive ticket via email + see in app

> **As an attendee, I want my ticket in my email AND on a page on the site, so I don't lose it.**

**Acceptance criteria:**
- ✅ Confirmation email arrives within 2 minutes of payment, contains: event name, datetime, address, attendee name, QR code image (PNG embed), unique ticket id, calendar (.ics) attachment.
- ✅ Email links to `/me/tickets/:bookingId` (works without login if magic-link-style token in URL; better UX with login).
- ✅ Authenticated users see all their tickets at `/me/tickets` listed by upcoming → past.
- ✅ Each ticket row shows: event name + thumb, date, ticket tier, attendee name, status (`unused` | `used` | `expired`).
- ✅ Tap a ticket → fullscreen QR display optimized for door scanner (high contrast, no auto-dim, brightness boost prompt on iOS).

---

### S-A-5 — Walk in at the door

> **As an attendee, I want my QR scanned in under 3 seconds so I'm not blocking the line.**

**Acceptance criteria:**
- ✅ QR contains signed JWT (HS256, secret in Supabase secrets) — door scanner verifies signature offline.
- ✅ First successful scan sets `qr_used_at = now()`; second scan returns `error: ALREADY_USED` with the original timestamp.
- ✅ Door scanner UX: green flash + ✓ on success, red flash + ✗ + reason on failure. Sound cue optional.
- ✅ Round-trip latency: <500ms p95 on 4G.

---

## 4. Phase 1 user stories — Door staff (Andrés)

### S-D-1 — Open scanner

> **As door staff, I want to open the scanner on my phone with one tap and not have to log in.**

**Acceptance criteria:**
- ✅ Organizer's staff link opens `/staff/check-in/:event` PWA on Andrés's phone.
- ✅ PWA is installable (manifest + service worker); Phase 1 ships as installable web app, not native.
- ✅ Permission prompt for camera on first open; gracefully degrades if denied (manual code entry fallback).

---

### S-D-2 — Scan a ticket

> **As door staff, I want to point my camera at a QR and instantly see if the person can enter.**

**Acceptance criteria:**
- ✅ Camera scans QR continuously (debounced — same code in 5s window only triggers once).
- ✅ On scan, calls `ticket-validate` with the JWT.
- ✅ Success: green screen for 1.5s with attendee name + ticket tier, then auto-returns to scanner.
- ✅ Failure modes shown clearly:
  - `ALREADY_USED` (red) with original check-in time
  - `WRONG_EVENT` (red) — QR is for a different event
  - `EXPIRED` (red) — event already ended
  - `INVALID_SIGNATURE` (red) — counterfeit
- ✅ Counter at top shows `attended / sold` for the event in real time.

---

### S-D-3 — Survive offline

> **As door staff at a venue with bad WiFi, I want scans to keep working and sync when connectivity returns.**

**Acceptance criteria:**
- ✅ Service worker queues scan attempts when network is down (IndexedDB).
- ✅ JWT signature verification works offline (public key cached at install).
- ✅ When back online, queued scans flush in order; conflicts (same QR scanned twice across devices) resolved server-side by `first-write-wins` on `qr_used_at`.
- ✅ Banner shows "🔴 Offline — N pending" when queue >0.

**Phase 1 acceptable**: 30s reconciliation lag. Phase 2 adds per-device device-id for audit.

---

## 5. Phase 1 user stories — Admin (mdeai team)

### S-X-1 — See all events on the platform

> **As an admin, I want to see every event with its organizer, status, sales, and a hide-button.**

**Acceptance criteria:**
- ✅ Existing `/admin/events` page extended to show: event, organizer name, status badge, tickets sold, revenue, hide toggle.
- ✅ Hide toggle flips `is_active`; organizer is notified by email.
- ✅ "Open in Stripe" link deep-links to that event's Stripe payments dashboard (organizer's Stripe Connect account in Phase 2; mdeai's account in Phase 1).

---

### S-X-2 — Refund a ticket (manual)

> **As an admin, I want to refund a buyer when they request it — without building UI for it in Phase 1.**

**Acceptance criteria:**
- ✅ **Phase 1 path: Stripe Dashboard refund** → admin marks the `bookings` row to `status='refunded'` manually via Supabase Studio or a one-off SQL helper.
- ✅ Webhook handles Stripe `charge.refunded` to set `bookings.status='refunded'` and decrement `event_tickets.qty_sold`.
- ✅ Refunded ticket's QR is invalidated (next scan returns `REFUNDED`).
- ✅ **No refund UI in Phase 1.** Documented Non-Goal — see §6.

---

## 6. Phase 1 Non-Goals (deliberately deferred)

These are common asks. Phase 1 says "no" to all of them on purpose. Each maps to a Phase 2+ slot:

| Item | Why it's not in Phase 1 | When it returns |
|---|---|---|
| Refunds via UI | Stripe Dashboard handles manually until volume justifies UI | Phase 2 |
| Promo codes / discount codes | Useful for sponsor comp tickets — comes when sponsors come | Phase 2 |
| Donations, hidden tickets, tiered "pay what you want" | Add when first organizer asks | Phase 2 |
| Multi-currency (USD, EUR) | Locked to COP for Phase 1 | Phase 2 |
| Tax / VAT (Colombia IVA) | Compliance after first organizer requests it | Phase 2 |
| Custom checkout questions | Common ask, not a blocker | Phase 2 |
| Schedule items (multi-session events) | Festival-scale feature | Phase 2 |
| Venue table + reusable venues | Inline address strings cover Phase 1 | Phase 2 |
| Capacity sharing (whole-festival cap across events) | Festival feature | Phase 3 |
| CSV/XLSX export | Built into dashboard later | Phase 2 |
| Embeddable widget for organizer's own site | Long-tail | Phase 3 |
| Stripe Connect (organizer payouts to their own bank) | Phase 1 routes to mdeai bank; we manually pay organizers | Phase 2 |
| Sponsor system + ROI attribution | Major Phase 2 work | Phase 2 |
| Voting / contests inside events | After events foundation works | Phase 2 |
| Multi-venue / restaurant-week pattern | Need venue table + cross-venue passes first | Phase 2 |
| Recurring events | Date-series + clone-from-template | Phase 2 |
| Streaming / hybrid | Mux or YouTube embed | Phase 3 |
| Marketing automation (OpenClaw → WhatsApp/IG) | Trio runtime work | Phase 3 |
| AI orchestration (Hermes + Paperclip) | Only when scale demands it | Phase 4 |

---

## 7. Event type × Phase 1 fit

The 10 event types from the source menu, mapped to "fits Phase 1 as-is" or "needs Phase 2+":

| # | Event type | Phase 1 fit? | Rationale | First good fit |
|---|---|---|---|---|
| 1 | **Beauty Pageant / Gala** | ✅ Yes (no voting) | Single-venue ticketed gala — wizard + Stripe + QR is enough. **Voting deferred to Phase 2.** | Phase 1 ships ticket sales + door check-in for Miss Elegance Colombia 2026. |
| 2 | **Restaurant Week / Food Festival** | ❌ Phase 2 | Needs multi-venue passes + cross-venue redemption. | Phase 2 adds `venues` table + `multi_venue_pass` ticket type. |
| 3 | **Music Festival / Concert** | ✅ Yes | Single-venue ticketed; tier-pricing covered. | Phase 1 fits a single-stage concert. Multi-stage festival = Phase 2. |
| 4 | **Networking / Business Event** | ✅ Yes (lead capture deferred) | Tickets + check-in fit; lead-capture forms = Phase 2. | Phase 1 fits the meetup; Phase 2 adds badge printing + lead capture. |
| 5 | **Fashion Show / Designer Showcase** | ✅ Yes | Same shape as gala. | Phase 1 fits. |
| 6 | **Contest / Awards Event** | ❌ Phase 2 | Voting system is the whole point — that's the Phase 2 contest module. | Phase 2 adds `vote.*` schema + leaderboard. |
| 7 | **Workshops / Classes / Masterclasses** | ✅ Yes | Smallest case — one organizer, one room, one ticket type. | Phase 1 fits perfectly. |
| 8 | **Sports / Stadium Events** | ⚠️ Partial | Tickets + check-in work, but needs **seat assignment + reserved seating + 10k+ capacity stress test**. | Phase 1 fits up to ~1000 capacity. Stadium = Phase 3. |
| 9 | **Community / Recurring Events** | ❌ Phase 2 | Needs recurrence rules + cloning. | Phase 2 adds `event.series` table. |
| 10 | **Hybrid / Virtual Events** | ❌ Phase 3 | Needs streaming integration (Mux/YouTube/Zoom). | Phase 3 adds `event.streaming_url` + access gating. |

**Phase 1 covers types 1, 3, 4, 5, 7 fully + type 8 up to ~1k capacity = 5.5 of 10.**

---

## 8. Phase 2+ stories preview (one paragraph each — not built now)

Each is a stub. Full stories ship when the user (or first paying organizer) signs off on Phase 1.

### 8.1 Sponsor (Daniela @ Postobón) — Phase 2

> *As a sponsor, I want to pay for tier-based exposure on a specific event and see how many people clicked my logo, so I can justify the budget to my boss.*

Adds: `sponsor.brands`, `sponsor.placements`, `sponsor.click_attribution`, `outbound_clicks` extension, sponsor dashboard with conversion funnel.

### 8.2 Contestant (Luna, candidate #7) — Phase 2

> *As a contestant in Miss Elegance, I want a public profile and a unique referral link so my friends and family can vote for me.*

Adds: `vote.contestants`, `vote.ballots`, 5-layer fraud defense (Turnstile + nonce + DB rules + behavioral + Gemini AI per [`14-production-architecture.md`](./14-production-architecture.md)), leaderboard, hybrid scoring (`0.5 × audience + 0.3 × judges + 0.2 × engagement`).

### 8.3 Vendor partner (Carlos, restaurant owner) — Phase 2

> *As a restaurant owner, I want to opt into Restaurant Week, set my menu deal, and see how many people redeemed it at my place.*

Adds: `event.venues`, `event.menu_deals`, `bookings.redeemed_at_venue_id`, multi-venue pass (one ticket → multiple redemptions, capped per venue).

### 8.4 Marketing operator (OpenClaw) — Phase 3

> *As an event organizer, I want OpenClaw to draft and queue WhatsApp + IG content for the 14 days leading up to my event, so I don't have to do it manually.*

Adds: OpenClaw agent runtime, content templates, WhatsApp Business + Meta Graph API integration, approval rail (per `ai-interaction-patterns.md` — propose, never auto-apply).

### 8.5 AI orchestration (Hermes + Paperclip) — Phase 4

> *As the platform itself, I want Hermes to plan and Paperclip to govern, so OpenClaw's actions stay safe at scale.*

Adds: trio runtime, `agent_audit_log` writes from runtime (table already exists), policy engine, kill-switches.

---

## 9. Story → schema → screen mapping

The cross-reference for engineers picking up tickets:

| Story | New schema | New edge fn | New screen | Effort |
|---|---|---|---|---|
| S-O-1 Create event | ALTER `events` (slug, status, organizer_id, total_capacity) | — | `/host/event/new` (4-step wizard) | 3 days |
| S-O-2 Define tickets | NEW `event_tickets` | — | wizard step 2 | (in S-O-1) |
| S-O-3 Publish | (uses S-O-1 schema) | — | wizard step 4 | (in S-O-1) |
| S-O-4 Dashboard | (read-only on existing tables) | — | `/host/event/:id` | 2 days |
| S-O-5 Delegate check-in | — | — | dashboard button | 0.5 day |
| S-A-1 Discover | (no change) | (no change) | (no change) | 0 |
| S-A-2 Detail | (no change) | — | extend `EventDetail.tsx` | 0.5 day |
| S-A-3 Buy ticket | ALTER `bookings` (qr_token, qr_used_at, attendee_email, attendee_name, ticket_id) | NEW `ticket-checkout` + `ticket-payment-webhook` | extend `EventBookingWizardPremium` | 3 days |
| S-A-4 Email + my tickets | — | (email send in `ticket-payment-webhook`) | NEW `/me/tickets` + `/me/tickets/:id` | 1 day |
| S-A-5 Walk in (the QR is read by S-D-2) | — | — | (covered by S-D-2) | 0 |
| S-D-1 Open scanner | — | — | NEW `/staff/check-in/:event` (PWA shell) | 0.5 day |
| S-D-2 Scan ticket | — | NEW `ticket-validate` | scanner UI | 1 day |
| S-D-3 Survive offline | — | (signature verify offline) | service worker + IndexedDB queue | 0.5 day |
| S-X-1 Admin list | — | — | extend `/admin/events` | 0.5 day |
| S-X-2 Manual refund | — | (webhook handles `charge.refunded`) | (no UI) | 0.5 day |
| **TOTAL** | **3 changes** | **3 fns** | **4 new + 2 extended** | **~13 dev-days + 2 days testing/polish = 15 days = 3 weeks at 1 dev** |

Matches the build sheet in [`diagrams/18-mvp-gap.md`](./diagrams/18-mvp-gap.md) within rounding. ✅

---

## 10. Definition of "Phase 1 done"

Ship Phase 1 when **all of these are true**:

- [ ] Sofía (organizer of Miss Elegance Colombia) creates her event end-to-end through `/host/event/new` without help.
- [ ] Camila (test attendee) buys a ticket via Stripe → email arrives → QR shown at `/me/tickets`.
- [ ] Andrés (door staff) scans Camila's QR → green ✓ → second scan returns red ✗ ALREADY_USED.
- [ ] Sofía sees the check-in reflected in her dashboard within 5 seconds.
- [ ] Sofía's dashboard math reconciles with Stripe Dashboard to the cent.
- [ ] No oversell possible — load test with 50 concurrent buyers on a 10-ticket tier results in 10 tickets sold + 40 declined.
- [ ] Lighthouse a11y on the 4 new screens ≥ 90.
- [ ] All 4 data states handled on every new component.
- [ ] No regressions on `/events`, `/event/:id`, `/saved` (existing flows).
- [ ] RLS policies on `event_tickets` deny anon writes; deny non-organizer reads on draft events.

The day all 10 boxes flip green = ship.

---

## 11. See also

- [`09-prd.md`](./09-prd.md) — full PRD (over-engineered for context only — this user-stories doc is the trimmed-to-Phase-1 version)
- [`14-production-architecture.md`](./14-production-architecture.md) — the broader plan (everything beyond Phase 1)
- [`diagrams/16-current-supabase-erd.md`](./diagrams/16-current-supabase-erd.md) — schema today
- [`diagrams/17-current-data-flow.md`](./diagrams/17-current-data-flow.md) — discovery + detail flow today
- [`diagrams/18-mvp-gap.md`](./diagrams/18-mvp-gap.md) — exact gap to close (this doc's stories implement that gap)
- `.claude/rules/style-guide.md` — TypeScript / React conventions all stories must follow
- `.claude/rules/edge-function-patterns.md` — `ticket-checkout`, `ticket-payment-webhook`, `ticket-validate` must follow this
- `.claude/rules/supabase-patterns.md` — all RLS policies in §10 must follow this
- `.claude/rules/ai-interaction-patterns.md` — the "✨ Generate description" button in S-O-1 must follow propose-only

---

## Appendix — Quick "what to build first" if you can only build one screen

If the team has only **one week** instead of three, ship **S-A-3 (Buy a ticket)** alone:
1. NEW `event_tickets` table + ALTER `bookings` for `qr_token`.
2. NEW `ticket-checkout` + `ticket-payment-webhook` edge fns.
3. Extend `EventBookingWizardPremium` to call internal checkout instead of external link.
4. Stub the dashboard with raw Stripe Dashboard for now; manually mint QR via SQL.

That's the **smallest possible internal-ticketing slice**. It's a credible Phase 1 demo. Everything else (organizer wizard, dashboard, scanner) can ship in week 2–3.
