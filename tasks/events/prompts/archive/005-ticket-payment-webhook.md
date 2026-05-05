---
task_id: 005-ticket-payment-webhook
diagram_id: EVENT-TICKET-PURCHASE
prd_section: 15-user-stories.md §3 (S-A-3, S-A-4) + 100-events-prd.md §4.6.3 (HE-3 react-pdf)
title: ticket-payment-webhook — Stripe webhook → single atomic RPC + PDF email
phase: PHASE-1-EVENTS
priority: P0
status: Done
estimated_effort: 1 day
area: backend
skill:
  - supabase-edge-functions
  - supabase
  - mdeai-project-gates
edge_function: ticket-payment-webhook
schema_tables:
  - public.event_tickets   # qty_sold increment (single transaction)
  - public.event_orders    # status pending → paid; sets stripe_payment_intent
  - public.event_attendees # status pending → active (qr_token already minted at checkout)
depends_on: ['001-event-schema-migration', '004-ticket-checkout-edge-fn']
mermaid_diagram: ../diagrams/09-event-ticket-purchase.md
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-1-EVENTS |
| **Path** | `POST /functions/v1/ticket-payment-webhook` (Stripe-only; `verify_jwt = false`) |
| **Triggers** | Stripe `payment_intent.succeeded` AND `charge.refunded` |
| **Atomicity** | One SECURITY DEFINER RPC per webhook event — order flip + attendees flip + qty_sold increment in one transaction (audit R4) |
| **Reads from Stripe** | **Only `pi.metadata.order_id`** — everything else from DB (audit B1) |
| **PDF** | `react-pdf` (MIT) per HE-3 — no AGPL contamination |
| **Email** | SendGrid free tier |

## Description

**The function.** Stripe webhook receiver. On `payment_intent.succeeded`, calls `ticket_payment_finalize(order_id, payment_intent_id)` which atomically (a) flips `event_orders.status` pending → paid, (b) records `stripe_payment_intent`, (c) flips all `event_attendees` for the order pending → active, (d) increments `event_tickets.qty_sold` by `event_orders.quantity`. Then renders PDF + emails the buyer. On `charge.refunded`, looks up order via stored `stripe_payment_intent` and calls a single refund RPC.

**Why one RPC.** The original draft did `rpc('ticket_payment_finalize')` then a separate `supabase.from('event_attendees').insert(...)` — two transactions, possible inconsistency on failure. Now everything is in one DB transaction (audit R4).

**Why no PII in metadata.** The webhook reads only `pi.metadata.order_id`. Attendees are already in the DB (created during checkout in task 004). Buyer email is on `event_orders.buyer_email`. Eliminates audit B1.

**Why `event_orders.quantity` is the source of truth for qty_sold increment.** Persisted at checkout in `event_orders.quantity` (task 001 schema + task 004 RPC). Eliminates audit B2.

**Why `react-pdf` (not Hi.Events PDF code).** HE-3 audit in `100-events-prd.md` §4.6.3 — Hi.Events is AGPL §13; copying their code forces mdeai's source open. `react-pdf` is MIT — clean.

## Request

```typescript
// POST /functions/v1/ticket-payment-webhook
// Stripe sends raw body + 'stripe-signature' header
// Set verify_jwt = false in supabase/config.toml — Stripe doesn't send Supabase JWT
```

## Logic

```typescript
import Stripe from "https://esm.sh/stripe@14?target=denonext";
import { renderTicketPdf } from "../_shared/pdf.ts";
import { renderIcs } from "../_shared/ics.ts";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);

Deno.serve(async (req) => {
  // 1. Verify Stripe signature (CRITICAL — replay protection)
  const body = await req.text();
  const sig  = req.headers.get('stripe-signature');
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body, sig!, Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    );
  } catch {
    return new Response('Bad signature', { status: 400 });
  }

  // 2. Idempotency — Stripe retries on 5xx. Same event.id → same outcome.
  const cached = await getIdempotency(`stripe_${event.id}`);
  if (cached) return new Response('OK', { status: 200 });

  // 3. Branch on event type
  try {
    if (event.type === 'payment_intent.succeeded') {
      await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
    } else if (event.type === 'charge.refunded') {
      await handleRefund(event.data.object as Stripe.Charge);
    }
    // Other event types: silently ignore (200 OK so Stripe doesn't retry)
  } catch (err) {
    // Throw to make Stripe retry — DB failures are retryable.
    console.error('webhook handler failed', { event_id: event.id, err });
    return new Response('Retry', { status: 500 });
  }

  await setIdempotency(`stripe_${event.id}`, { ok: true });
  return new Response('OK', { status: 200 });
});

async function handlePaymentSucceeded(pi: Stripe.PaymentIntent) {
  const orderId = pi.metadata.order_id;  // ONLY field we read from Stripe
  if (!orderId) throw new Error('PI missing order_id metadata');

  // 4. Single atomic RPC: flip order + flip attendees + increment qty_sold
  const { data, error } = await supabase.rpc('ticket_payment_finalize', {
    p_order_id:           orderId,
    p_payment_intent_id:  pi.id,
  });
  if (error) throw error;
  // data = { event, order, ticket, attendees: [...] } — fully populated for email

  // 5. Render PDF (one PDF with N attendee pages) + .ics
  const pdfBuffer = await renderTicketPdf(data);
  const icsString = renderIcs(data.event);

  // 6. Email buyer via SendGrid
  await sendgrid.send({
    to: data.order.buyer_email,
    from: 'tickets@mdeai.co',
    subject: `Your ticket: ${data.event.name}`,
    html: ticketEmailHtml(data),
    attachments: [
      { content: btoa(pdfBuffer), filename: 'ticket.pdf', type: 'application/pdf' },
      { content: btoa(icsString),  filename: 'event.ics',  type: 'text/calendar' },
    ],
  });
}

async function handleRefund(charge: Stripe.Charge) {
  // Audit R5 fix: charge.payment_intent is a STRING id, not an object with metadata.
  const piId = typeof charge.payment_intent === 'string'
    ? charge.payment_intent
    : charge.payment_intent?.id;
  if (!piId) return;  // not a PI-based charge; nothing to do

  // Look up the order by stored stripe_payment_intent (indexed in task 001)
  const { data: order } = await supabase
    .from('event_orders')
    .select('id')
    .eq('stripe_payment_intent', piId)
    .single();
  if (!order) return;  // unknown — manual reconcile required

  // Single atomic refund RPC
  const { error } = await supabase.rpc('ticket_payment_refund', { p_order_id: order.id });
  if (error) throw error;
}
```

## The Postgres functions (single transaction each)

```sql
-- Single atomic finalize (audit R4 + R6)
CREATE OR REPLACE FUNCTION public.ticket_payment_finalize(
  p_order_id uuid, p_payment_intent_id text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_order  public.event_orders%ROWTYPE;
  v_ticket public.event_tickets%ROWTYPE;
  v_event  public.events%ROWTYPE;
BEGIN
  -- 1. Lock the order row
  SELECT * INTO v_order FROM public.event_orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ORDER_NOT_FOUND'; END IF;

  -- Idempotent: if already paid (e.g., webhook double-fire that bypassed the cache), no-op succeed
  IF v_order.status = 'paid' THEN
    SELECT * INTO v_event FROM public.events WHERE id = v_order.event_id;
    SELECT * INTO v_ticket FROM public.event_tickets WHERE id = v_order.ticket_id;
    RETURN ticket_payment_finalize_response(v_event, v_order, v_ticket);
  END IF;

  IF v_order.status <> 'pending' THEN
    RAISE EXCEPTION 'ORDER_BAD_STATE: %', v_order.status;
  END IF;

  -- 2. Lock the ticket row + atomic increment (no advisory lock needed — checkout RPC already
  --    reserved capacity; this just commits the reservation)
  SELECT * INTO v_ticket FROM public.event_tickets WHERE id = v_order.ticket_id FOR UPDATE;
  UPDATE public.event_tickets SET qty_sold = qty_sold + v_order.quantity WHERE id = v_order.ticket_id;
  v_ticket.qty_sold := v_ticket.qty_sold + v_order.quantity;

  -- 3. Flip order status + record PI
  UPDATE public.event_orders
     SET status = 'paid', stripe_payment_intent = p_payment_intent_id
   WHERE id = p_order_id;

  -- 4. Flip attendees pending → active (qr_token already minted at checkout — audit R6)
  UPDATE public.event_attendees SET status = 'active' WHERE order_id = p_order_id AND status = 'pending';

  SELECT * INTO v_event FROM public.events WHERE id = v_order.event_id;

  -- 5. Build the response payload for email/PDF
  RETURN ticket_payment_finalize_response(v_event, v_order, v_ticket);
END;
$$;

-- Helper that gathers the response object — used in both the happy and idempotent-replay paths
CREATE OR REPLACE FUNCTION public.ticket_payment_finalize_response(
  v_event public.events, v_order public.event_orders, v_ticket public.event_tickets
) RETURNS jsonb LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT jsonb_build_object(
    'event',     row_to_json(v_event),
    'order',     row_to_json(v_order),
    'ticket',    row_to_json(v_ticket),
    'attendees', (SELECT jsonb_agg(row_to_json(a)) FROM public.event_attendees a WHERE a.order_id = v_order.id)
  );
$$;

-- Single atomic refund (audit R5 fix — driven by stripe_payment_intent lookup in JS, then this fn)
CREATE OR REPLACE FUNCTION public.ticket_payment_refund(p_order_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_order public.event_orders%ROWTYPE;
BEGIN
  SELECT * INTO v_order FROM public.event_orders WHERE id = p_order_id FOR UPDATE;
  IF v_order.status NOT IN ('paid','partial_refund') THEN
    RAISE EXCEPTION 'ORDER_NOT_REFUNDABLE: %', v_order.status;
  END IF;

  UPDATE public.event_attendees SET status = 'refunded' WHERE order_id = p_order_id AND status = 'active';
  UPDATE public.event_orders    SET status = 'refunded' WHERE id = p_order_id;

  -- Decrement qty_sold so the seat returns to inventory
  UPDATE public.event_tickets
     SET qty_sold = GREATEST(0, qty_sold - v_order.quantity)
   WHERE id = v_order.ticket_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ticket_payment_finalize(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.ticket_payment_refund(uuid)         TO service_role;
```

## Acceptance Criteria

- [ ] Bad Stripe signature → 400 immediately, zero DB writes.
- [ ] Stripe replay (same `event.id`) → 200 OK, no duplicate writes (idempotency cache).
- [ ] Concurrent webhook + manual replay (rare) → second call hits the `if status='paid'` early-return, no double increment.
- [ ] Successful payment: `qty_sold` += quantity, order flipped to `paid`, all attendees flipped to `active`, email arrives within 2 min, PDF + .ics attached, all in one DB transaction.
- [ ] Refund (Stripe Dashboard): `qty_sold` decrements, order + attendees flip to `refunded`; next QR scan returns `REFUNDED` (per task 006).
- [ ] PDF renders: event name, start time, address, QR image (high-contrast PNG), attendee name, ticket tier, short_id.
- [ ] .ics opens cleanly in Apple Calendar + Google Calendar.
- [ ] Email passes SPF/DKIM (SendGrid handles).
- [ ] DB transaction failure → throws → 500 → Stripe retries (up to 3 days).
- [ ] All edge-fn-pattern requirements per `.claude/rules/edge-function-patterns.md`.

## Failure handling

- DB transaction fails → throw → 500 → Stripe retries with exponential backoff.
- SendGrid down → log to `ai_runs` (or `email_failures` table — P2); admin alert; manual resend possible because attendee rows + qr_tokens exist.
- PDF render fails → email sent without PDF; body contains the QR codes inline (data URI fallback).
- Unknown PI on refund → silent return (manual reconciliation via Stripe Dashboard logs).

## Wiring plan

1. Read `supabase/functions/lead-from-form/index.ts` for edge fn shell.
2. Read `.claude/rules/edge-function-patterns.md`.
3. Install for Deno: `import { Document, Page, Image, Text } from "https://esm.sh/@react-pdf/renderer@3.4.5"`.
4. Create `supabase/functions/ticket-payment-webhook/index.ts`.
5. Create `supabase/functions/_shared/pdf.ts` (renderTicketPdf — one PDF with N attendee pages).
6. Create `supabase/functions/_shared/ics.ts` (renderIcs).
7. Add the 3 Postgres functions above (or include in task 001's migration).
8. Configure secrets: `STRIPE_WEBHOOK_SECRET`, `STRIPE_SECRET_KEY`, `SENDGRID_API_KEY`, `QR_SIGNING_SECRET`.
9. Set `verify_jwt = false` in `supabase/config.toml` for this fn — Stripe doesn't send Supabase JWT.
10. Register webhook URL in Stripe Dashboard: `https://<project>.supabase.co/functions/v1/ticket-payment-webhook`.
11. Subscribe to events: `payment_intent.succeeded`, `charge.refunded`.

## See also

- [`../diagrams/09-event-ticket-purchase.md`](../diagrams/09-event-ticket-purchase.md)
- [`001-event-schema-migration.md`](./001-event-schema-migration.md) — `stripe_payment_intent` column + ticket_id/quantity columns + attendees `pending` status
- [`004-ticket-checkout-edge-fn.md`](./004-ticket-checkout-edge-fn.md) — what creates the pending order + pre-mints QR JWTs
- [`006-ticket-validate-edge-fn.md`](./006-ticket-validate-edge-fn.md) — door scan that consumes the QR
- [`100-events-prd.md`](../100-events-prd.md) §4.6.3 — HE-3 PDF library decision (`react-pdf` MIT)
