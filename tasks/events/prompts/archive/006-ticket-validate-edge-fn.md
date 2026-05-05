---
task_id: 006-ticket-validate-edge-fn
diagram_id: EVENT-TICKET-PURCHASE
prd_section: 15-user-stories.md §3 (S-A-5) + §4 (S-D-2)
title: ticket-validate edge function — door scan, single-use QR with race-safe update
phase: PHASE-1-EVENTS
priority: P0
status: Done
estimated_effort: 1 day
area: backend
skill:
  - supabase-edge-functions
  - supabase
  - mdeai-project-gates
edge_function: ticket-validate
schema_tables:
  - public.event_attendees   # qr_used_at update (race-safe via UPDATE ... WHERE qr_used_at IS NULL)
depends_on: ['001-event-schema-migration', '005-ticket-payment-webhook', '034-event-staff-link-generator-edge-fn']
mermaid_diagram: ../diagrams/09-event-ticket-purchase.md
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-1-EVENTS |
| **Path** | `POST /functions/v1/ticket-validate` |
| **Auth** | **Custom HS256 staff JWT validated in-function** — `verify_jwt = false` in `config.toml` (audit B4) |
| **Latency target** | <500ms p95 on 4G |
| **Single-use guarantee** | Atomic `UPDATE ... WHERE qr_used_at IS NULL RETURNING id` (race-safe) |
| **Real-world** | Andrés scans Camila's QR → green ✓ in 250ms with her name + tier; second scan returns red ✗ ALREADY_USED |

## Description

**The function.** Verifies a custom staff JWT, verifies the QR JWT signature, looks up the attendee by `qr_token`, atomically marks `qr_used_at = now()` if currently NULL, returns pass/fail.

**Why `verify_jwt = false` (audit B4).** The staff JWT is a custom HS256 token signed by task 003's "Generate staff link" RPC, **not** a Supabase-issued user JWT. Supabase's gateway `verify_jwt = true` would reject our custom tokens (gateway only accepts Supabase JWTs). Set `verify_jwt = false` and validate the staff token in-function with our own secret.

**Why the staff JWT carries `staff_link_version`.** Task 003 lets organizers revoke a leaked staff link by bumping `events.staff_link_version`. The validate fn checks `jwt.staff_link_version === events.staff_link_version` and rejects mismatches as `STAFF_TOKEN_REVOKED`. Eliminates the "couples door-staff to platform JWT secret" risk noted in audit medium issues.

**Why distinguish `UNKNOWN_TOKEN` from `INVALID_SIGNATURE` (audit medium).** Original draft returned `INVALID_SIGNATURE` for both "we can't find this token in DB" and "signature didn't verify." Operators need the distinction: `INVALID_SIGNATURE` means counterfeit (bad actor); `UNKNOWN_TOKEN` means a stale/cancelled order or a sync race. Different operational responses.

## Request

```typescript
// POST /functions/v1/ticket-validate
{
  qr_token:         string,   // the JWT from the QR
  scanner_event_id: string    // from the staff link URL
}
// Header: Authorization: Bearer <staff_jwt>  (custom HS256, NOT Supabase user JWT)
```

## Response

```typescript
// 200 OK — valid scan, gate opens
{ success: true, data: {
  attendee_name: string,
  ticket_tier:   string,
  short_id:      string  // for staff to read aloud
}}

// 200 with error code (still HTTP 200 so scanner can branch on code; not a transport failure)
{ success: false, error: {
  code: 'ALREADY_USED' | 'WRONG_EVENT' | 'EXPIRED' | 'INVALID_SIGNATURE'
      | 'UNKNOWN_TOKEN' | 'REFUNDED' | 'CANCELLED' | 'PENDING_PAYMENT' | 'EVENT_ENDED',
  message: string,
  details?: { used_at?: string, attendee_name?: string }
}}

// 4xx for transport problems
{ success: false, error: { code: 'BAD_REQUEST' | 'STAFF_TOKEN_INVALID' | 'STAFF_TOKEN_EXPIRED' | 'STAFF_TOKEN_REVOKED', message } }
```

## Logic

```typescript
import { verifyJwtHs256 } from "../_shared/jwt.ts";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return errorResponse(405, 'METHOD_NOT_ALLOWED');

  // 1. Verify the staff JWT in-function (NOT via Supabase gateway — audit B4)
  const staffToken = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!staffToken) return errorResponse(401, 'STAFF_TOKEN_INVALID');
  const staffPayload = verifyJwtHs256(staffToken, Deno.env.get('STAFF_LINK_SECRET')!);
  if (!staffPayload)                    return errorResponse(401, 'STAFF_TOKEN_INVALID');
  if (staffPayload.exp < Date.now()/1000) return errorResponse(401, 'STAFF_TOKEN_EXPIRED');
  if (staffPayload.role !== 'door_staff') return errorResponse(403, 'STAFF_TOKEN_INVALID');

  const body = validateRequestSchema.parse(await req.json());

  // 2. Verify the QR JWT signature (separate secret from staff token)
  const qrPayload = verifyJwtHs256(body.qr_token, Deno.env.get('QR_SIGNING_SECRET')!);
  if (!qrPayload) {
    return jsonResponse({ success: false, error: { code: 'INVALID_SIGNATURE', message: 'QR signature does not verify — likely counterfeit' } });
  }

  // 3. Cross-check event scope (defense in depth — DB will catch this too)
  if (qrPayload.event_id !== body.scanner_event_id) {
    return jsonResponse({ success: false, error: { code: 'WRONG_EVENT', message: 'QR is for a different event' } });
  }
  if (qrPayload.event_id !== staffPayload.event_id) {
    return errorResponse(403, 'STAFF_TOKEN_INVALID', 'Staff link does not match scanner event');
  }

  // 4. Verify staff link revocation: jwt.staff_link_version === events.staff_link_version
  const { data: ev } = await supabase
    .from('events').select('staff_link_version').eq('id', staffPayload.event_id).single();
  if (!ev || ev.staff_link_version !== staffPayload.staff_link_version) {
    return errorResponse(401, 'STAFF_TOKEN_REVOKED', 'Organizer revoked this staff link — request a new one');
  }

  // 5. Atomic single-use update via RPC
  const { data, error } = await supabase.rpc('ticket_validate_consume', { p_qr_token: body.qr_token });
  if (error) return errorResponse(500, 'DB_ERROR', error.message);

  if (data.result === 'consumed') {
    return jsonResponse({ success: true, data: data.details });
  }

  return jsonResponse({
    success: false,
    error: {
      code:    data.result.toUpperCase(),
      message: HUMAN_REASONS[data.result],
      details: data.details
    }
  });
});

const HUMAN_REASONS = {
  unknown_token:    'No ticket on file with that code (refunded or cancelled?)',
  already_used:     'Ticket was already scanned',
  refunded:         'Ticket was refunded',
  cancelled:        'Ticket was cancelled',
  pending_payment:  'Payment not yet confirmed — wait 30 seconds',
  event_ended:      'Event has already ended',
};
```

## The Postgres function

```sql
CREATE OR REPLACE FUNCTION public.ticket_validate_consume(p_qr_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_attendee public.event_attendees%ROWTYPE;
  v_ticket   public.event_tickets%ROWTYPE;
  v_event    public.events%ROWTYPE;
  v_now      timestamptz := now();
BEGIN
  -- 1. Look up attendee by qr_token (UNIQUE; O(1))
  SELECT * INTO v_attendee FROM public.event_attendees WHERE qr_token = p_qr_token;
  IF NOT FOUND THEN
    -- Distinguish UNKNOWN_TOKEN (no row) from INVALID_SIGNATURE (caller pre-checked sig)
    RETURN jsonb_build_object('result', 'unknown_token');
  END IF;

  -- 2. Status checks (no DB write yet)
  IF v_attendee.status = 'pending'   THEN RETURN jsonb_build_object('result', 'pending_payment'); END IF;
  IF v_attendee.status = 'refunded'  THEN RETURN jsonb_build_object('result', 'refunded',
    'details', jsonb_build_object('attendee_name', v_attendee.full_name)); END IF;
  IF v_attendee.status = 'cancelled' THEN RETURN jsonb_build_object('result', 'cancelled'); END IF;

  IF v_attendee.qr_used_at IS NOT NULL THEN
    RETURN jsonb_build_object('result', 'already_used', 'details', jsonb_build_object(
      'used_at',        v_attendee.qr_used_at,
      'attendee_name',  v_attendee.full_name
    ));
  END IF;

  -- 3. Event sanity
  SELECT * INTO v_event FROM public.events WHERE id = v_attendee.event_id;
  IF v_event.event_end_time IS NOT NULL AND v_event.event_end_time < v_now THEN
    RETURN jsonb_build_object('result', 'event_ended');
  END IF;

  -- 4. Atomic consume — race-safe (returns 0 rows if another concurrent scan won)
  UPDATE public.event_attendees
     SET qr_used_at = v_now
   WHERE id = v_attendee.id AND qr_used_at IS NULL
   RETURNING qr_used_at INTO v_attendee.qr_used_at;

  IF NOT FOUND THEN
    -- Race lost — read the winner's timestamp
    SELECT qr_used_at INTO v_attendee.qr_used_at FROM public.event_attendees WHERE id = v_attendee.id;
    RETURN jsonb_build_object('result', 'already_used', 'details', jsonb_build_object(
      'used_at',       v_attendee.qr_used_at,
      'attendee_name', v_attendee.full_name
    ));
  END IF;

  SELECT * INTO v_ticket FROM public.event_tickets WHERE id = v_attendee.ticket_id;

  RETURN jsonb_build_object('result', 'consumed', 'details', jsonb_build_object(
    'attendee_name', v_attendee.full_name,
    'ticket_tier',   v_ticket.name,
    'short_id',      (SELECT short_id FROM public.event_orders WHERE id = v_attendee.order_id)
  ));
END;
$$;
GRANT EXECUTE ON FUNCTION public.ticket_validate_consume(text) TO service_role;
```

## Acceptance Criteria

- [ ] Valid scan: 200 with `consumed` result; subsequent scan returns `already_used` with original timestamp.
- [ ] Two concurrent scanners hit the same QR → exactly 1 succeeds, 1 returns `already_used`.
- [ ] Tampered JWT (signature won't verify) → 200 with `INVALID_SIGNATURE`.
- [ ] Valid signature but no DB row (e.g., webhook race or token refunded mid-scan) → 200 with `UNKNOWN_TOKEN`.
- [ ] QR for event A scanned at event B → 200 with `WRONG_EVENT`.
- [ ] Order still `pending` (Stripe webhook hasn't fired yet) → 200 with `PENDING_PAYMENT` + advice "wait 30 seconds".
- [ ] Refunded order's QR → `REFUNDED` (with `attendee_name` for staff context).
- [ ] Event ended (`event_end_time < now`) → `EVENT_ENDED`.
- [ ] Staff JWT expired → 401 `STAFF_TOKEN_EXPIRED`.
- [ ] Staff JWT for an event whose `staff_link_version` was bumped → 401 `STAFF_TOKEN_REVOKED`.
- [ ] Latency p95 < 500ms on 4G.
- [ ] `verify_jwt = false` in config.toml for this fn (verified by reading config).

## Failure handling

- DB connection drop → 500 `DB_ERROR`; scanner queues + retries.
- Stale staff JWT cached on scanner → 401 → scanner shows "Staff link expired, ask organizer for new one."

## Wiring plan

1. Read `.claude/rules/edge-function-patterns.md`.
2. Reuse `supabase/functions/_shared/jwt.ts` from task 004 (`verifyJwtHs256`).
3. Create `supabase/functions/ticket-validate/index.ts` per the logic above.
4. Add `ticket_validate_consume` Postgres function (or include in task 001 migration).
5. **Set `verify_jwt = false`** in `supabase/config.toml` for this fn — staff JWT is custom (audit B4).
6. Configure secrets: `QR_SIGNING_SECRET` (from task 004), `STAFF_LINK_SECRET` (NEW — separate from Supabase JWT secret per audit medium).
7. Deploy: `supabase functions deploy ticket-validate`.
8. Add Vitest test: 100 concurrent scans of same QR → exactly 1 success.

## See also

- [`../diagrams/09-event-ticket-purchase.md`](../diagrams/09-event-ticket-purchase.md)
- [`001-event-schema-migration.md`](./001-event-schema-migration.md) — `staff_link_version` column + attendees `pending` status
- [`003-host-event-dashboard.md`](./003-host-event-dashboard.md) — generates the staff JWT (uses `STAFF_LINK_SECRET`, not Supabase JWT secret)
- [`007-staff-checkin-pwa.md`](./007-staff-checkin-pwa.md) — front-end that calls this fn
- [`005-ticket-payment-webhook.md`](./005-ticket-payment-webhook.md) — what flips attendees pending → active
- `.claude/rules/edge-function-patterns.md`
