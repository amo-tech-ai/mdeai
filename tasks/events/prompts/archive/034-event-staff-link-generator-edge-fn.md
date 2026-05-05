---
task_id: 034-event-staff-link-generator-edge-fn
title: event-staff-link-generator edge fn — sign door-staff JWTs with dedicated secret
phase: PHASE-1-EVENTS
priority: P0
status: Done
estimated_effort: 0.5 day
area: backend
skill:
  - supabase-edge-functions
  - mdeai-project-gates
edge_function: event-staff-link-generator
schema_tables:
  - public.events  # reads staff_link_version
depends_on: ['001-event-schema-migration']
mermaid_diagram: ../diagrams/09-event-ticket-purchase.md
---

## Summary

| Aspect | Details |
|---|---|
| **Phase** | PHASE-1-EVENTS — extracted from task 003 dashboard per audit M2 |
| **Path** | `POST /functions/v1/event-staff-link-generator` |
| **Auth** | `verify_jwt = true` — only authenticated organizers can mint staff links for their own events |
| **Why a dedicated fn (not inline in task 003)** | Separation of concerns: the dashboard UI calls a backend fn; the fn holds the `STAFF_LINK_SECRET` env var and writes audit logs. Audit M2 fix |
| **Real-world** | Sofía clicks "Generate staff link" on `/host/event/:id` → fn returns `https://mdeai.co/staff/check-in/<event_id>?token=<jwt>` (24h TTL). Sends to Andrés on WhatsApp |

## Description

**The situation.** Task 003 dashboard mentions "a tiny edge fn that signs a JWT" inline. The audit's M2 flagged that **using the Supabase JWT secret** for door-staff tokens couples door-staff compromise surface to platform auth — leak the staff JWT once, attacker rotates platform auth secret. **Separate secret + dedicated fn = better posture.**

**The fn signs a JWT containing:** `{ event_id, role: 'door_staff', staff_link_version, organizer_id, exp }` — using `STAFF_LINK_SECRET` (NOT the Supabase JWT secret). Task 006 (`ticket-validate`) verifies with the same secret and rejects mismatched `staff_link_version` (organizer revoked the link).

**Why HS256 (symmetric, not RS256).** Both signer (this fn) and verifier (task 006) live in the same Supabase project. Symmetric is sufficient + cheaper than asymmetric for a non-distributed system.

## Request

```typescript
// POST /functions/v1/event-staff-link-generator
{
  event_id: string,           // uuid; must match an event the caller organizes
  ttl_hours?: number          // default 24, max 168 (7 days)
}
```

## Response

```typescript
// 200 OK
{ success: true, data: {
  staff_link_url: string,     // "https://mdeai.co/staff/check-in/<event_id>?token=<jwt>"
  jwt: string,
  expires_at: string,         // ISO timestamp
  staff_link_version: number  // for organizer's audit log
}}

// 4xx
{ success: false, error: { code: 'UNAUTHORIZED' | 'NOT_ORGANIZER' | 'EVENT_NOT_FOUND' | 'TTL_OUT_OF_RANGE', message } }
```

## Logic

```typescript
import { signJwtHs256 } from "../_shared/jwt.ts";

const APP_BASE_URL = Deno.env.get('APP_BASE_URL') ?? 'https://mdeai.co';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST')   return errorResponse(405, 'METHOD_NOT_ALLOWED');

  // 1. Auth: must be a logged-in user
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return errorResponse(401, 'UNAUTHORIZED');
  const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (!user)       return errorResponse(401, 'UNAUTHORIZED');

  const body = staffLinkRequestSchema.parse(await req.json());
  const ttl = Math.min(body.ttl_hours ?? 24, 168);
  if (ttl < 1) return errorResponse(400, 'TTL_OUT_OF_RANGE');

  // 2. Verify caller is the event's organizer
  const { data: event } = await supabase.from('events')
    .select('id, organizer_id, staff_link_version')
    .eq('id', body.event_id).single();
  if (!event)                              return errorResponse(404, 'EVENT_NOT_FOUND');
  if (event.organizer_id !== user.id)      return errorResponse(403, 'NOT_ORGANIZER');

  // 3. Sign the JWT with the dedicated STAFF_LINK_SECRET
  const expSeconds = Math.floor(Date.now()/1000) + ttl * 3600;
  const jwt = signJwtHs256({
    event_id:           event.id,
    organizer_id:       event.organizer_id,
    staff_link_version: event.staff_link_version,
    role:               'door_staff',
    iat:                Math.floor(Date.now()/1000),
    exp:                expSeconds,
  }, Deno.env.get('STAFF_LINK_SECRET')!);

  return jsonResponse({
    success: true,
    data: {
      staff_link_url:     `${APP_BASE_URL}/staff/check-in/${event.id}?token=${jwt}`,
      jwt,
      expires_at:         new Date(expSeconds * 1000).toISOString(),
      staff_link_version: event.staff_link_version,
    }
  });
});
```

## Companion: revoke endpoint (same fn, different action)

A separate `POST /functions/v1/event-staff-link-revoke` (or query param `?action=revoke`) bumps `events.staff_link_version`:

```sql
-- Called by frontend "Revoke link" button
CREATE OR REPLACE FUNCTION public.bump_staff_link_version(p_event_id uuid)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_new_version int;
BEGIN
  UPDATE public.events SET staff_link_version = staff_link_version + 1
   WHERE id = p_event_id AND organizer_id = (SELECT auth.uid())
   RETURNING staff_link_version INTO v_new_version;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_ORGANIZER'; END IF;
  RETURN v_new_version;
END;
$$;
GRANT EXECUTE ON FUNCTION public.bump_staff_link_version(uuid) TO authenticated;
```

After bump, all outstanding staff JWTs for that event become invalid (task 006 rejects them on next scan).

## Acceptance Criteria

- [ ] Fn deploys with `verify_jwt = true` in `supabase/config.toml`.
- [ ] `STAFF_LINK_SECRET` env var configured (separate from Supabase JWT secret — audit M2).
- [ ] Non-organizer caller gets 403 `NOT_ORGANIZER`.
- [ ] Default TTL = 24h; max = 168h (7 days); out-of-range = 400.
- [ ] JWT includes `staff_link_version` claim from current `events.staff_link_version`.
- [ ] Organizer revokes via `bump_staff_link_version` RPC → existing JWTs fail next call to task 006.
- [ ] Returned URL is `${APP_BASE_URL}/staff/check-in/<event_id>?token=<jwt>` exactly.

## Wiring plan

1. Read `.claude/rules/edge-function-patterns.md` for response format.
2. Reuse `supabase/functions/_shared/jwt.ts` from task 004.
3. Create `supabase/functions/event-staff-link-generator/index.ts`.
4. Add `bump_staff_link_version` to a Phase 1 follow-up migration (or include in task 001).
5. Configure `STAFF_LINK_SECRET` secret in Supabase dashboard.
6. **Update task 003** to call this fn instead of inline signing logic.

## See also

- [`001-event-schema-migration.md`](./001-event-schema-migration.md) — `events.staff_link_version` column
- [`003-host-event-dashboard.md`](./003-host-event-dashboard.md) — UI that triggers this fn
- [`006-ticket-validate-edge-fn.md`](./006-ticket-validate-edge-fn.md) — validates the JWT this fn signs
- `.claude/rules/edge-function-patterns.md`
