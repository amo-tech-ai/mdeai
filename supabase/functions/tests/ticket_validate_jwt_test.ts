/**
 * ticket-validate JWT validation tests.
 *
 * Tests the JWT logic that ticket-validate applies to both the staff token
 * and the QR token, using the shared verifyJwtHs256 / signJwtHs256 from
 * _shared/jwt.ts. No DB or Supabase client needed — pure crypto logic.
 *
 * Coverage:
 *   - Valid staff JWT (correct role, matching event_id, future exp) → verified
 *   - Expired staff JWT (exp in the past) → "EXPIRED"
 *   - Wrong role in staff JWT → verified but role !== 'door_staff'
 *   - Tampered staff JWT (signature broken) → "BAD_SIGNATURE"
 *   - Valid QR JWT → verified
 *   - QR JWT with wrong event_id → verified but event mismatch detected
 *   - Mismatched staff_link_version → version field accessible for revocation check
 *   - Secret-missing guard → "SECRET_MISSING"
 */

import { assertEquals } from "jsr:@std/assert@1";
import { signJwtHs256, verifyJwtHs256 } from "../_shared/jwt.ts";

const STAFF_SECRET = "test-staff-secret-32-chars-long!";
const QR_SECRET = "test-qr-secret-32-chars-long!!!";
const EVENT_ID = "00000000-0000-0000-0000-000000000001";
const now = () => Math.floor(Date.now() / 1000);

// ---------------------------------------------------------------------------
// Staff JWT
// ---------------------------------------------------------------------------

Deno.test("ticket-validate | valid staff JWT verifies correctly", async () => {
  const token = await signJwtHs256(
    {
      event_id: EVENT_ID,
      organizer_id: "org-uuid",
      staff_link_version: 1,
      role: "door_staff",
      exp: now() + 3600,
    },
    STAFF_SECRET,
  );

  const result = await verifyJwtHs256(token, STAFF_SECRET);
  assertEquals(result.valid, true);
  if (result.valid) {
    assertEquals(result.payload.role, "door_staff");
    assertEquals(result.payload.event_id, EVENT_ID);
    assertEquals(result.payload.staff_link_version, 1);
  }
});

Deno.test("ticket-validate | expired staff JWT returns EXPIRED", async () => {
  const token = await signJwtHs256(
    {
      role: "door_staff",
      event_id: EVENT_ID,
      staff_link_version: 1,
      exp: now() - 100, // already expired
    },
    STAFF_SECRET,
  );

  const result = await verifyJwtHs256(token, STAFF_SECRET, { clockSkewSec: 0 });
  assertEquals(result.valid, false);
  if (!result.valid) assertEquals(result.reason, "EXPIRED");
});

Deno.test("ticket-validate | tampered staff JWT returns BAD_SIGNATURE", async () => {
  const token = await signJwtHs256(
    { role: "door_staff", event_id: EVENT_ID, exp: now() + 3600 },
    STAFF_SECRET,
  );
  // Corrupt the signature part
  const [h, p] = token.split(".");
  const tampered = `${h}.${p}.badsignature`;

  const result = await verifyJwtHs256(tampered, STAFF_SECRET);
  assertEquals(result.valid, false);
  if (!result.valid) assertEquals(result.reason, "BAD_SIGNATURE");
});

Deno.test("ticket-validate | staff JWT with wrong role — role field accessible for check", async () => {
  const token = await signJwtHs256(
    { role: "viewer", event_id: EVENT_ID, exp: now() + 3600 },
    STAFF_SECRET,
  );
  const result = await verifyJwtHs256(token, STAFF_SECRET);
  assertEquals(result.valid, true);
  // The function code then does: if (staffPayload.role !== 'door_staff') → 403
  if (result.valid) assertEquals(result.payload.role, "viewer");
});

Deno.test("ticket-validate | staff_link_version accessible for revocation check", async () => {
  const token = await signJwtHs256(
    { role: "door_staff", event_id: EVENT_ID, staff_link_version: 3, exp: now() + 3600 },
    STAFF_SECRET,
  );
  const result = await verifyJwtHs256(token, STAFF_SECRET);
  assertEquals(result.valid, true);
  if (result.valid) assertEquals(result.payload.staff_link_version, 3);
});

// ---------------------------------------------------------------------------
// QR JWT
// ---------------------------------------------------------------------------

Deno.test("ticket-validate | valid QR JWT verifies correctly", async () => {
  const attendeeId = "att-uuid-001";
  const token = await signJwtHs256(
    { attendee_id: attendeeId, event_id: EVENT_ID, iat: now() },
    QR_SECRET,
  );
  const result = await verifyJwtHs256(token, QR_SECRET);
  assertEquals(result.valid, true);
  if (result.valid) {
    assertEquals(result.payload.attendee_id, attendeeId);
    assertEquals(result.payload.event_id, EVENT_ID);
  }
});

Deno.test("ticket-validate | QR JWT signed with wrong secret → BAD_SIGNATURE", async () => {
  const token = await signJwtHs256(
    { attendee_id: "att-1", event_id: EVENT_ID },
    "some-other-secret-that-is-at-least-32ch",
  );
  const result = await verifyJwtHs256(token, QR_SECRET);
  assertEquals(result.valid, false);
  if (!result.valid) assertEquals(result.reason, "BAD_SIGNATURE");
});

Deno.test("ticket-validate | event_id mismatch detectable after QR verify", async () => {
  const WRONG_EVENT = "00000000-0000-0000-0000-000000000002";
  const token = await signJwtHs256(
    { attendee_id: "att-1", event_id: WRONG_EVENT, iat: now() },
    QR_SECRET,
  );
  const result = await verifyJwtHs256(token, QR_SECRET);
  // Signature verifies — the mismatch is caught by comparing qrPayload.event_id
  // against body.scanner_event_id (the check after verify).
  assertEquals(result.valid, true);
  if (result.valid) assertEquals(result.payload.event_id, WRONG_EVENT);
});

// ---------------------------------------------------------------------------
// Missing secret guard
// ---------------------------------------------------------------------------

Deno.test("ticket-validate | missing secret returns SECRET_MISSING", async () => {
  const result = await verifyJwtHs256("any.token.here", "");
  assertEquals(result.valid, false);
  if (!result.valid) assertEquals(result.reason, "SECRET_MISSING");
});

Deno.test("ticket-validate | malformed token (2 parts) returns MALFORMED", async () => {
  const result = await verifyJwtHs256("only.twoparts", STAFF_SECRET);
  assertEquals(result.valid, false);
  if (!result.valid) assertEquals(result.reason, "MALFORMED");
});
