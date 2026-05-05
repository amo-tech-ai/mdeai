Only `event_venues` exists — 13 tables are missing. Here's the complete picture.

---

## Current state

**What exists in DB (event domain):** `events`, `event_venues`, `event_tickets`, `event_orders`, `event_attendees`, `event_check_ins`, `event_promo_codes`, `event_order_refunds`, `event_taxes_and_fees`, `event_ticket_taxes_and_fees`, `event_media_assets`

**Dashboards that exist:**

- `/host/event/new` — wizard (002 ✅)
- `/host/dashboard` — landlord KPIs (not event-specific)
- `/me/tickets/:id` — attendee QR (008 ✅)
- `/staff/checkin` — door scanner PWA (007 ✅)

**Dashboards that do NOT exist yet:**

- No `/host/venues` page
- No `/host/venues/:id/analytics`
- No stakeholder management UI
- No vendor tracking UI
- No sponsor management UI
- No attendee profile collection flow

---

## Full gap map — 14 remaining tasks

|#|Task|Phase|Effort|Deps|What it adds|
|---|---|---|---|---|---|
|**035**|venue-picker-in-wizard|**P1 missed**|0.5d|001✅ 002✅|UI: pick/create venue in event wizard|
|**028**|event_stakeholders|P2|0.5d|001✅|Schema: planners, judges, MC, co-producer per event|
|**029**|event_vendors|P2|0.5d|001✅|Schema: AV, catering, security costs + contracts|
|**031**|event_sponsors_link|P2|0.5d|001✅|Schema: event↔sponsor M:N + logo placement surfaces|
|**032**|event_attendee_profiles|P2|0.5d|001✅|Schema: dietary, accessibility, custom fields per attendee|
|**036**|event_venue_resources|P2|0.5d|001✅|Schema: AV/furniture inventory + availability check RPC|
|**037**|event_venue_staff|P2|0.5d|001✅ 028|Schema: venue-side staff roster + event assignments|
|**038**|event_venue_availability|P2|1d|001✅|Schema: open/blocked windows + `is_venue_available()` RPC|
|**039**|host-venue-management-page|P2|1.5d|036 037 038|**UI dashboard**: `/host/venues` resources/staff/calendar|
|**040**|event_venue_layouts|P3|1d|001✅ 030✅|Schema: floor plans + seating zones + layout assignments|
|**041**|event_venue_bookings|P3|1d|038|Schema: EXCLUDE constraint race-safe multi-event scheduler|
|**042**|venue-analytics-dashboard|P3|1d|041 036 037|**UI dashboard**: utilization, revenue, staff/resource costs|
|**043**|ai-venue-optimizer|P4-AI|1.5d|041 042|Edge fn: Gemini Pro — pricing/scheduling/resource AI|
|**044**|ai-venue-layout-generator|P4-AI|1d|040|Edge fn: Gemini Pro + Code Execution — floor plan AI|

**Total: ~11.5 dev-days**

---

## Additional tasks NOT yet written

These gaps exist in the event domain that have no task spec yet:

**Missing UI for data already in DB:**

- No `/host/event/:id/stakeholders` management tab (028 schema exists after implementation, but no UI task)
- No `/host/event/:id/vendors` tab with cost tracker (029 schema, no UI)
- No `/host/event/:id/sponsors` tab (031 schema, no UI)
- No attendee profile collection form at checkout (032 schema, no UI)
- No organizer view of attendee dietary/accessibility reports (needed for catering handoff)

**Missing operational tasks:**

- **Email delivery** — ticket confirmation email with PDF + `.ics` is in the Phase 1 gate but no edge function exists for it (task 005 webhook marks paid but never sends email)
- **Stripe webhook secrets** — `STRIPE_WEBHOOK_SECRET` env var not configured; the webhook fn currently has no real sig verification
- **Event search/discovery** — `/events` page exists but has no AI-powered search using the events schema (no `ai-search` integration for events)
- **Event public page** — `/events/:id` shows static data; no ticket purchase flow wired to `ticket-checkout` edge fn
- **Load test** — 50-concurrent-buyer test against 10-ticket tier (Phase 1 gate item, never run)
- **Lighthouse audit** — Phase 1 gate requires ≥90 a11y on 4 new screens (not yet run)

---

## Recommended implementation order

**Wave 1 — Finish Phase 1 first (1 day):**

1. **035** venue-picker-in-wizard — it's a Phase 1 task that was missed; completes the event creation wizard
2. Wire `/events/:id` "Buy Tickets" button → `ticket-checkout` edge fn (no task spec yet, ~0.5d)

**Wave 2 — People & Relationships schemas (2 days, all independent, batch in one PR):** 3. **028** event_stakeholders 4. **029** event_vendors 5. **031** event_sponsors_link 6. **032** event_attendee_profiles

**Wave 3 — Venue operations backend (2 days):** 7. **036** event_venue_resources 8. **037** event_venue_staff (needs 028) 9. **038** event_venue_availability

**Wave 4 — Venue UI (1.5 days):** 10. **039** host-venue-management-page (needs 036+037+038)

**Wave 5 — Venue booking + layouts (2 days):** 11. **040** event_venue_layouts 12. **041** event_venue_bookings

**Wave 6 — Analytics (1 day):** 13. **042** venue-analytics-dashboard

**Wave 7 — AI layer (2.5 days, last because it needs all data to exist):** 14. **043** ai-venue-optimizer 15. **044** ai-venue-layout-generator

---

## Recommendation

**Start with Wave 1 + Wave 2** — they're the highest-value/lowest-risk combination:

- **035** completes Phase 1 and unblocks the Phase 1 acceptance gate (organizer can't fully create events without a venue)
- **028/029/031/032** are all pure SQL migrations with no deps on each other — they can be written, applied, and advisor-checked in a single 2-hour session as one PR
- Waves 3–7 are the venue operations system, which is independently shippable and doesn't block any Phase 2 contest work

**Do NOT start 043 or 044 until 041+042 are done** — the AI functions need real booking + analytics data to be useful. Building them on empty tables produces hallucinated recommendations.

Which wave do you want to start with?