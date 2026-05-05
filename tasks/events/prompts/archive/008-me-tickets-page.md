---
task_id: 008-me-tickets-page
diagram_id: MVP-GAP
prd_section: 15-user-stories.md §3 (S-A-2, S-A-4)
title: /me/tickets + EventDetail.tsx extension to internal ticket-checkout
phase: PHASE-1-EVENTS
priority: P0
status: Done
estimated_effort: 1 day
area: frontend
skill:
  - frontend-design
  - vercel-react-best-practices
  - supabase
  - vitest-component-testing
edge_function: null
schema_tables:
  - public.event_orders   # SELECT my orders
  - public.event_attendees # SELECT my QR
  - public.events
depends_on: ['001-event-schema-migration', '005-ticket-payment-webhook']
mermaid_diagram: ../diagrams/18-mvp-gap.md
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-1-EVENTS — closes the buyer loop |
| **Routes added** | `/me/tickets` (list) · `/me/tickets/:attendee_id` (fullscreen QR) |
| **Routes extended** | `EventDetail.tsx` — "Get Tickets" CTA now calls `ticket-checkout` instead of external `ticket_url` |
| **Auth** | Authenticated users (Supabase) for the list; magic-link token for guest buyers |
| **Real-world** | Camila opens email → taps QR link → fullscreen high-contrast QR with brightness boost prompt |

## Description

**Two surfaces.** Authenticated users see all their tickets at `/me/tickets`. Anonymous buyers (no Supabase account, paid as guest) get a one-shot magic-link URL in their email — `/me/tickets/:attendee_id?token=<jwt>` — works without login.

**The EventDetail extension.** Current code in `src/pages/EventDetail.tsx` (per `diagrams/17-current-data-flow.md`) opens `EventBookingWizardPremium` but defaults to redirecting to external `events.ticket_url`. P1 swaps that fallback: if `event_tickets` rows exist for the event, use internal `ticket-checkout`; if not (legacy Google/Ticketmaster catalog), keep the external redirect. **No regression on existing 200+ catalog events.**

## /me/tickets — list page

Layout (3-panel per CLAUDE.md):

| Panel | Content |
|---|---|
| Left | User profile card · "Saved events" link (existing) · "My tickets" (current page, highlighted) |
| Main | List grouped: **Upcoming → Past**. Each row: event hero thumb, name, date, ticket tier, status badge. Tap row → fullscreen QR view |
| Right | Quick stats: "3 tickets across 2 events · next: Saturday 9pm" |

Status badge values:
- 🟢 **Active** — purchased, QR not yet scanned
- ✅ **Used** — scanned at door (with timestamp "Sat 9:42 PM")
- ⌛ **Expired** — event end_time passed without scan
- ❌ **Refunded**

## /me/tickets/:attendee_id — fullscreen QR

```
┌─────────────────────────────────────┐
│ ← Back                              │
│                                     │
│ Reina de Antioquia 2026 — Finals    │
│ Saturday Oct 18 · 8:00 PM           │
│ Hotel Intercontinental, Medellín    │
│                                     │
│      ████ ▄ ▄▄ ▄▄▄ █ ▄▄ ████        │  ← QR (huge, high contrast)
│      █  █ ▄  ▄▄▄▄  █ ▄  █  █        │
│      ████  ▄  ▄ ▄▄▄  ▄▄ ████        │
│                                     │
│      Camila Restrepo — GA           │
│      MDE-A4F2X1                     │
│                                     │
│  [💡 Boost brightness]              │  ← iOS-only prompt
│  [📅 Add to calendar]               │
└─────────────────────────────────────┘
```

- QR rendered as PNG via `qrcode` library (~10KB, MIT) using the JWT from `event_attendees.qr_token`.
- Background dark navy / QR pure white for max contrast.
- Body text minimal — only what the door staff needs to see at-a-glance.
- "Boost brightness" button uses `screen.brightness` if available; else shows iOS instructions inline.

## EventDetail.tsx extension

```typescript
// Pseudocode of the change
const ticketTiers = useEventTickets(event.id);  // NEW hook

const handleGetTickets = () => {
  if (ticketTiers.length > 0) {
    // P1 internal flow
    openCheckoutWizard({ event_id: event.id, tiers: ticketTiers });
  } else if (event.ticket_url) {
    // Legacy external redirect (Google/Ticketmaster catalog)
    window.open(event.ticket_url, '_blank');
  } else {
    // No tickets, no external link → show "Tickets coming soon"
    showToast('Tickets coming soon');
  }
};
```

The `EventBookingWizardPremium` component (already imported in EventDetail.tsx) gets a new prop `mode: 'internal' | 'external'` and routes to the `ticket-checkout` edge fn when internal.

## Acceptance Criteria

- [ ] Authenticated user with 0 tickets → `/me/tickets` shows empty state with "Browse events" CTA.
- [ ] Authenticated user with 5 tickets across 3 events → grouped correctly Upcoming/Past, sorted by date.
- [ ] Anonymous buyer (no Supabase login) follows email link → fullscreen QR loads, JWT in URL is verified.
- [ ] Tapping a ticket row navigates to fullscreen QR; back button returns to list.
- [ ] QR is scannable from a phone screen at arm's length under venue lighting (manual test).
- [ ] EventDetail "Get Tickets" CTA on a P1 event with `event_tickets` rows → opens internal wizard, NOT external link.
- [ ] EventDetail "Get Tickets" CTA on legacy event with no `event_tickets` rows → opens external `ticket_url`, NO regression.
- [ ] Calendar download button on QR page → .ics file with correct event datetime.
- [ ] Lighthouse a11y ≥ 90 on both routes.
- [ ] Mobile 360px: QR fills width with margin; no overflow.

## Failure handling

- Magic-link JWT expired (>30 days post-event) → "Link expired, sign in to view your tickets" + login CTA.
- QR image fails to render (qrcode library error) → fallback to large monospace text of the JWT (still scannable by some readers).
- Realtime status update (e.g. refund mid-page-view) → show toast "Status updated" and refetch.

## Wiring plan

1. Read `src/pages/EventDetail.tsx` to understand current structure.
2. Read `src/components/events/EventBookingWizardPremium.tsx` to wire the `mode` prop.
3. Read `src/hooks/useEvents.ts` for the existing event hook pattern.
4. Install `qrcode`: `npm install qrcode @types/qrcode` (~10KB, MIT).
5. Create `src/pages/me/MyTickets.tsx` (list).
6. Create `src/pages/me/TicketDetail.tsx` (fullscreen QR).
7. Create `src/hooks/useMyTickets.ts` + `src/hooks/useEventTickets.ts`.
8. Update `src/components/events/EventBookingWizardPremium.tsx` to accept `mode` and call `ticket-checkout`.
9. Add the 2 new routes to `src/App.tsx` (under `<ProtectedRoute>` for `/me/tickets`; magic-link route is public).
10. Vitest: 1 component test for QR rendering + 1 integration test for the internal/external branch in EventDetail.

## See also

- [`004-ticket-checkout-edge-fn.md`](./004-ticket-checkout-edge-fn.md) — what the wizard calls
- [`005-ticket-payment-webhook.md`](./005-ticket-payment-webhook.md) — what creates the QR
- [`../diagrams/17-current-data-flow.md`](../diagrams/17-current-data-flow.md) — current EventDetail flow
- [`../15-user-stories.md`](../15-user-stories.md) §3 (S-A-2, S-A-4)
- `src/pages/EventDetail.tsx` + `src/components/events/EventBookingWizardPremium.tsx` — files to extend
