---
task_id: 004-ticket-checkout-edge-fn
diagram_id: EVENT-TICKET-PURCHASE
prd_section: 15-user-stories.md §3 (S-A-3) + diagrams/09-event-ticket-purchase.md
title: ticket-checkout edge function — Stripe Checkout + atomic capacity guard + JWT mint at checkout
phase: PHASE-1-EVENTS
priority: P0
status: Done
estimated_effort: 2 days
area: backend
skill:
  - supabase-edge-functions
  - supabase
  - mdeai-project-gates
edge_function: ticket-checkout
schema_tables:
  - public.event_tickets   # atomic qty_sold check (no increment yet)
  - public.event_orders    # creates row with status='pending' + ticket_id + quantity + access_token
  - public.event_attendees # creates N rows with status='pending' + qr_token (JWT signed at checkout)
depends_on: ['001-event-schema-migration']
mermaid_diagram: ../diagrams/09-event-ticket-purchase.md
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-1-EVENTS — the revenue-unlocking edge function |
| **Path** | `POST /functions/v1/ticket-checkout` |
| **Auth** | Optional (anonymous purchase allowed; `buyer_email` + `access_token` carry identity) |
| **Atomicity** | `pg_advisory_xact_lock(event_id)` + `FOR UPDATE` on ticket row + `qty_sold + quantity <= qty_total` check |
| **Idempotency** | Reuses existing `idempotency_keys` table; same key → same Stripe URL |
| **JWT mint** | QR JWTs signed in JS *at checkout* (not webhook); `attendee.id` UUIDs generated in JS so JWT.attendee_id always matches the row PK |
| **Real-world** | Camila taps "Get Tickets" → Stripe Checkout URL returned in <500ms; if she abandons, the pending order + pending attendees stay until cleanup cron (P2) |

## Description

**The function.** Receives a ticket-purchase request, atomically (a) checks ticket capacity, (b) creates a `pending` order with `ticket_id` + `quantity`, (c) creates N `pending` attendees with pre-signed QR JWTs, then opens a Stripe Checkout Session referencing only `order_id` in PI metadata. **Does NOT increment `qty_sold` yet** — that happens in task 005 webhook on payment confirmation.

**Why JWTs are signed at checkout, not webhook.** If we mint the JWT in the webhook (the original draft), we have to insert attendee rows after, then the JWT.attendee_id and the row PK can diverge. By generating attendee UUIDs in JS *first*, signing JWTs with those UUIDs, then INSERT-ing — JWT and row are always consistent. Eliminates audit R6.

**Why `attendees` is NOT in PI metadata.** The original draft put `attendees` in Stripe Checkout Session metadata; the webhook tried to read it from PaymentIntent metadata where it doesn't propagate. By creating attendee rows up front (status='pending'), the webhook only needs `order_id` in PI metadata to look up everything from the DB. Eliminates audit B1.

**Why `ticket_id` + `quantity` on `event_orders`.** The webhook needs to know which tier was purchased to increment the right `qty_sold`. Persisting at checkout time is the only correct path. Eliminates audit B2.

**Why pending status on attendees.** Buyer sees their tickets in `/me/tickets/:order_id?token=...` but they're marked `pending` (not scannable at the door) until payment confirms. Door scanner (task 006) explicitly rejects `status='pending'`.

## Request

```typescript
// POST /functions/v1/ticket-checkout
{
  event_id: string,            // uuid
  ticket_id: string,           // uuid (event_tickets.id)
  quantity: number,            // 1-10
  buyer_email: string,
  buyer_name: string,
  attendees: [                 // length must equal quantity
    { email: string, full_name: string }
  ],
  idempotency_key: string,     // client-generated UUID
  return_url_success: string,
  return_url_cancel: string
}
```

## Response

```typescript
// 200 OK
{ success: true, data: {
  stripe_session_url: string,
  order_id: string,
  short_id: string,            // "MDE-A4F2X1" — display to buyer immediately
  access_token: string         // for anon buyers — frontend stashes in localStorage as fallback
}}

// 4xx errors — structured
{ success: false, error: { code, message } }
```

Error codes: `INVALID_PAYLOAD`, `EVENT_NOT_PUBLISHED`, `TICKET_INACTIVE`, `OUT_OF_STOCK`, `QUANTITY_OUT_OF_RANGE`, `ATTENDEES_MISMATCH`, `RATE_LIMITED`, `STRIPE_ERROR`.

## Logic

```typescript
import Stripe from "https://esm.sh/stripe@14?target=denonext";
import { signJwtHs256 } from "../_shared/jwt.ts";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return errorResponse(405, 'METHOD_NOT_ALLOWED');

  // 1. Parse + validate via Zod
  const body = ticketCheckoutSchema.parse(await req.json());
  if (body.attendees.length !== body.quantity) {
    return errorResponse(400, 'ATTENDEES_MISMATCH', 'attendees array length must equal quantity');
  }

  // 2. Idempotency check — return cached result on replay
  const cached = await getIdempotency(body.idempotency_key);
  if (cached) return jsonResponse(cached);

  // 3. Pre-mint UUIDs + sign JWTs in JS BEFORE the RPC call.
  //    Each attendee gets its real PK now, so JWT.attendee_id == event_attendees.id always.
  const accessToken = crypto.randomUUID().replaceAll('-', '');  // 32-char hex for the URL
  const attendeesWithJwts = body.attendees.map((a) => {
    const id = crypto.randomUUID();
    const qr_token = signJwtHs256(
      { attendee_id: id, event_id: body.event_id, iat: Math.floor(Date.now() / 1000) },
      Deno.env.get('QR_SIGNING_SECRET')!
    );
    return { id, email: a.email, full_name: a.full_name, qr_token };
  });

  // 4. Atomic RPC: capacity check + create pending order + create pending attendees
  const { data: rpcData, error: rpcError } = await supabase.rpc('ticket_checkout_create_pending', {
    p_event_id:     body.event_id,
    p_ticket_id:    body.ticket_id,
    p_quantity:     body.quantity,
    p_buyer_email:  body.buyer_email,
    p_buyer_name:   body.buyer_name,
    p_access_token: accessToken,
    p_attendees:    attendeesWithJwts,  // jsonb array — RPC inserts each
  });
  if (rpcError) {
    // RPC raises EXCEPTION with the error code — surface verbatim
    const code = rpcError.message.match(/[A-Z_]+/)?.[0] ?? 'UNKNOWN';
    return errorResponse(400, code, rpcError.message);
  }

  // 5. Create Stripe Checkout Session in COP
  //    METADATA: only order_id on payment_intent_data — no PII, no attendees array.
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'cop',
        product_data: { name: rpcData.ticket_name, description: rpcData.event_name },
        unit_amount: rpcData.price_cents,
      },
      quantity: body.quantity,
    }],
    customer_email: body.buyer_email,
    success_url: body.return_url_success,
    cancel_url:  body.return_url_cancel,
    payment_intent_data: {
      metadata: { order_id: rpcData.order_id },  // ONE field — webhook reads everything else from DB
    },
    metadata: { order_id: rpcData.order_id },     // session-level too, for /sessions retrieval
  });

  // 6. Persist stripe_session_id (best-effort; webhook will still work via metadata.order_id)
  await supabase.from('event_orders')
    .update({ stripe_session_id: session.id })
    .eq('id', rpcData.order_id);

  // 7. Cache idempotency response
  const result = {
    success: true,
    data: {
      stripe_session_url: session.url,
      order_id:     rpcData.order_id,
      short_id:     rpcData.short_id,
      access_token: accessToken,
    }
  };
  await setIdempotency(body.idempotency_key, result);
  return jsonResponse(result);
});
```

## The Postgres function (the real atomic guard)

```sql
CREATE OR REPLACE FUNCTION public.ticket_checkout_create_pending(
  p_event_id uuid, p_ticket_id uuid, p_quantity int,
  p_buyer_email text, p_buyer_name text,
  p_access_token text, p_attendees jsonb  -- jsonb array of { id, email, full_name, qr_token }
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_ticket public.event_tickets%ROWTYPE;
  v_event  public.events%ROWTYPE;
  v_order_id uuid;
  v_short_id text;
  v_attendee jsonb;
BEGIN
  -- Lock at event_id granularity. NOTE: hashtext can theoretically collide; for v2 consider
  -- bigint advisory key derived from uuid bytes. Audit R7 — low priority for P1.
  PERFORM pg_advisory_xact_lock(hashtext(p_event_id::text));

  -- 1. Capacity check (FOR UPDATE on the row holds it for this transaction)
  SELECT * INTO v_ticket FROM public.event_tickets WHERE id = p_ticket_id FOR UPDATE;
  IF NOT FOUND OR NOT v_ticket.is_active THEN RAISE EXCEPTION 'TICKET_INACTIVE'; END IF;
  IF v_ticket.event_id <> p_event_id THEN RAISE EXCEPTION 'TICKET_INACTIVE'; END IF;
  IF v_ticket.qty_sold + p_quantity > v_ticket.qty_total THEN RAISE EXCEPTION 'OUT_OF_STOCK'; END IF;

  SELECT * INTO v_event FROM public.events WHERE id = p_event_id;
  IF v_event.status NOT IN ('published','live') THEN RAISE EXCEPTION 'EVENT_NOT_PUBLISHED'; END IF;

  v_short_id := 'MDE-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));

  -- 2. Create pending order — records ticket_id + quantity + access_token (audit B2 + R3)
  INSERT INTO public.event_orders
    (event_id, ticket_id, quantity, buyer_email, buyer_name, total_cents, currency, status, short_id, access_token)
  VALUES
    (p_event_id, p_ticket_id, p_quantity, p_buyer_email, p_buyer_name,
     v_ticket.price_cents * p_quantity, v_ticket.currency, 'pending', v_short_id, p_access_token)
  RETURNING id INTO v_order_id;

  -- 3. Create pending attendees with caller-provided UUIDs + JWTs (audit R6)
  FOR v_attendee IN SELECT * FROM jsonb_array_elements(p_attendees) LOOP
    INSERT INTO public.event_attendees
      (id, order_id, ticket_id, event_id, email, full_name, qr_token, status)
    VALUES
      ((v_attendee->>'id')::uuid, v_order_id, p_ticket_id, p_event_id,
       v_attendee->>'email', v_attendee->>'full_name', v_attendee->>'qr_token', 'pending');
  END LOOP;

  -- NOTE: qty_sold NOT incremented here — only on payment_intent.succeeded in task 005.

  RETURN jsonb_build_object(
    'order_id',    v_order_id,
    'short_id',    v_short_id,
    'price_cents', v_ticket.price_cents,
    'ticket_name', v_ticket.name,
    'event_name',  v_event.name
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.ticket_checkout_create_pending(uuid,uuid,int,text,text,text,jsonb) TO service_role;
```

## Acceptance Criteria

- [ ] 50 concurrent buyers on a 10-ticket tier → exactly 10 orders created, 40 receive `OUT_OF_STOCK`, **0 oversell**.
- [ ] Same `idempotency_key` replayed → same Stripe URL, same order_id, no duplicate row.
- [ ] Anonymous purchase (no auth header) succeeds; `buyer_user_id` NULL but `buyer_email` + `access_token` set.
- [ ] Stripe session in COP; price = `price_cents × quantity`.
- [ ] Event `status='draft'` → 400 `EVENT_NOT_PUBLISHED`.
- [ ] Ticket `is_active=false` OR mismatched `event_id` → 400 `TICKET_INACTIVE`.
- [ ] Quantity 0 or 11 → 400 `QUANTITY_OUT_OF_RANGE` (Zod).
- [ ] `attendees.length !== quantity` → 400 `ATTENDEES_MISMATCH`.
- [ ] Each created `event_attendees` row has `status='pending'` and a `qr_token` JWT whose `attendee_id` claim equals the row's `id`.
- [ ] Stripe `payment_intent_data.metadata` contains **only** `{ order_id }` — no PII, no attendees array.
- [ ] Successful response in <500ms p95 (excluding Stripe API latency).
- [ ] All edge-fn-pattern requirements per `.claude/rules/edge-function-patterns.md`.

## Failure handling

- Stripe API timeout (>10s) → 502 `STRIPE_ERROR`; pending order + pending attendees remain (a P2 cleanup cron flips them to `cancelled` after 30 min if no PI).
- Lock contention timeout → 503 `RATE_LIMITED`; client retries with backoff + same idempotency_key.
- DB error mid-RPC → entire RPC transaction rolls back; nothing inserted; safe to retry.
- JWT signing fails (env missing) → 500 with clear error; fail loud at boot.

## Wiring plan

1. Read existing `supabase/functions/lead-from-form/index.ts` for the edge fn shell pattern.
2. Read `.claude/rules/edge-function-patterns.md` for response format + auth lifecycle.
3. Create `supabase/functions/_shared/jwt.ts` with `signJwtHs256(payload, secret)` + `verifyJwtHs256(token, secret)`. Shared with tasks 005 + 006.
4. Create `supabase/functions/ticket-checkout/index.ts` per the logic above.
5. Add Stripe SDK import: `import Stripe from "https://esm.sh/stripe@14?target=denonext"`.
6. Add migration for `ticket_checkout_create_pending` RPC (or include in task 001's migration).
7. Configure secrets in Supabase dashboard: `STRIPE_SECRET_KEY`, `QR_SIGNING_SECRET`.
8. Set `verify_jwt = false` in `supabase/config.toml` for this fn (anonymous purchase allowed).
9. Deploy: `supabase functions deploy ticket-checkout`.
10. Add 50-concurrent load test in `tasks/RWT/event-checkout-load.test.ts`.

## See also

- [`../diagrams/09-event-ticket-purchase.md`](../diagrams/09-event-ticket-purchase.md)
- [`001-event-schema-migration.md`](./001-event-schema-migration.md) — schema this fn writes to
- [`005-ticket-payment-webhook.md`](./005-ticket-payment-webhook.md) — what flips pending → active
- [`008-me-tickets-page.md`](./008-me-tickets-page.md) — front-end that calls this fn
- `.claude/rules/edge-function-patterns.md`
