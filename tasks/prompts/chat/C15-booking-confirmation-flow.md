---
id: C15
title: Booking Confirmation Flow — Preview → Confirm → Write
status: Not Started
priority: P1
effort: 2 days
revenue_impact: High — closes the booking loop; without confirm flow, no revenue from chat-initiated bookings
depends_on: create_booking_preview tool in ai-chat (exists), bookings table, mde-stripe
skill:
  - frontend-design
  - mde-stripe
  - mde-real-estate
---

<!-- task-summary -->
> **What:** Booking Confirmation Flow — Preview → Confirm → Write
> **Why:** The `create_booking_preview` tool in `ai-chat` currently returns a JSON stub. There is no: - UI component that renders the booking preview - "Confirm" button that writes to the `bookings` table - Payment step wired to…
> **Tools/Skills:** `frontend-design` · `mde-stripe` · `mde-real-estate`
> **P1 · Not Started · Effort: 2 days**
> **Depends on:** create_booking_preview tool in ai-chat (exists), bookings table, mde-stripe

# C15 — Booking Confirmation Flow

## Problem

The `create_booking_preview` tool in `ai-chat` currently returns a JSON stub. There is no:
- UI component that renders the booking preview
- "Confirm" button that writes to the `bookings` table
- Payment step wired to Stripe
- "Cancel" path that returns to browsing

Per the AI propose-only rule in `ai-interaction-patterns.md`: **AI proposes, user confirms, user can undo**. The preview→confirm→undo pattern must be enforced — the AI must never auto-book.

## What to Build

### 1. `BookingPreviewCard` component

```tsx
// src/components/chat/embedded/BookingPreviewCard.tsx
interface BookingPreview {
  listing_id: string;
  listing_title: string;
  listing_image: string;
  neighborhood: string;
  check_in: string;   // ISO date
  check_out: string;
  total_nights: number;
  price_per_night: number;
  total_price: number;
  currency: 'COP' | 'USD';
}
```

Renders: listing thumbnail + title + dates + price breakdown + "Confirm Booking" / "Cancel" buttons.
Confirm → POST to `booking-confirm` edge fn.
Cancel → dismisses card, sends "No problem — want to see other options?" assistant message.

### 2. `booking-confirm` edge fn

- Validates availability (re-check; race condition protection)
- Creates `bookings` row with status=`pending_payment`
- Initiates Stripe Payment Intent (or redirects to Stripe Checkout)
- Returns booking_id + payment_url
- On payment success webhook: update `bookings.status` → `confirmed`

### 3. SSE action wiring in `ai-chat`

When `create_booking_preview` tool result is ready:
- Emit `SHOW_BOOKING_PREVIEW` action in `__mdeai_actions__` sidecar
- Payload: BookingPreview object
- `EmbeddedListings` routes `SHOW_BOOKING_PREVIEW` → render `BookingPreviewCard`

### 4. Undo within session

After confirmation, show "Booking confirmed ✓" + "Undo (cancel booking)" for 60s.
Undo → POST to `booking-cancel` edge fn (sets status=`cancelled`, refund if eligible).

## Acceptance Criteria

- [ ] `BookingPreviewCard` renders preview with listing image, dates, price breakdown
- [ ] "Confirm Booking" button posts to `booking-confirm` and redirects to Stripe
- [ ] "Cancel" dismisses card and sends follow-up assistant message
- [ ] `SHOW_BOOKING_PREVIEW` action routed in `EmbeddedListings`
- [ ] `booking-confirm` edge fn validates availability before writing
- [ ] `bookings` row created with `pending_payment` status
- [ ] On Stripe webhook: status updated to `confirmed`
- [ ] Undo button shown for 60s post-confirmation
- [ ] AI never auto-confirms — user explicit click required
- [ ] `npm run build` passes

## Files

| Layer | File | Action |
|---|---|---|
| Component | `src/components/chat/embedded/BookingPreviewCard.tsx` | Create |
| Listings router | `src/components/chat/embedded/EmbeddedListings.tsx` | Modify — add SHOW_BOOKING_PREVIEW case |
| Edge fn | `supabase/functions/booking-confirm/index.ts` | Create |
| Edge fn | `supabase/functions/booking-cancel/index.ts` | Create |
| Edge fn | `supabase/functions/ai-chat/index.ts` | Modify — emit SHOW_BOOKING_PREVIEW from tool result |
| Types | `src/types/chat.ts` | Modify — add BookingPreview type |

---

## Definition of Done (continuous testing — mandatory)

A task is **not** done until every applicable row is checked. "Code merged" is not the finish line — **tested + verified live** is. See [.claude/rules/task-writing.md §9](../../../.claude/rules/task-writing.md) and [CLAUDE.md → Definition of Done](../../../CLAUDE.md).

- [ ] `npm run lint` clean
- [ ] `npm run build` clean
- [ ] `npm run test` clean and **count did not regress** (new logic = new tests; bugs = regression test that fails without the fix)
- [ ] `npm run verify:edge` clean *(only if `supabase/` was touched — else "N/A — no edge-fn change")*
- [ ] E2E covered *(Playwright spec OR documented manual run with screenshot — only if user-facing flow touched; else "N/A")*
- [ ] Live verification on https://www.mdeai.co after Vercel deploy *(only if UI shipped to prod; HTTP 200 + visual check)*
- [ ] PR body lists what was tested + result for each layer

If a layer is N/A, **say so explicitly** in the PR. Silence ≠ exemption.
