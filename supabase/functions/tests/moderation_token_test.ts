import {
  assertEquals,
  assert,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  signModerationToken,
  verifyModerationToken,
  buildModerationUrl,
  TOKEN_DEFAULT_TTL_SECONDS,
} from "../_shared/moderation-token.ts";

const SECRET =
  "test-secret-must-be-at-least-32-chars-long-aaaaaaaaaaaa";

Deno.test("signModerationToken — round-trip succeeds for valid payload", async () => {
  const now = Math.floor(Date.now() / 1000);
  const token = await signModerationToken(
    { lid: "abc-123", act: "approve", iat: now, exp: now + 60 },
    SECRET,
  );
  assert(token.includes("."), "token should be `payload.sig`");
  const v = await verifyModerationToken(token, SECRET, now);
  assert(v.ok, "verify should succeed");
  if (v.ok) {
    assertEquals(v.payload.lid, "abc-123");
    assertEquals(v.payload.act, "approve");
  }
});

Deno.test("verifyModerationToken — wrong secret rejects with BAD_SIGNATURE", async () => {
  const now = Math.floor(Date.now() / 1000);
  const token = await signModerationToken(
    { lid: "abc", act: "reject", iat: now, exp: now + 60 },
    SECRET,
  );
  const v = await verifyModerationToken(
    token,
    "different-secret-also-32-chars-min-aaaaaaaaaa",
    now,
  );
  assert(!v.ok);
  if (!v.ok) assertEquals(v.reason, "BAD_SIGNATURE");
});

Deno.test("verifyModerationToken — expired token rejects", async () => {
  const past = Math.floor(Date.now() / 1000) - 3600;
  const token = await signModerationToken(
    { lid: "abc", act: "approve", iat: past - 60, exp: past },
    SECRET,
  );
  const v = await verifyModerationToken(token, SECRET);
  assert(!v.ok);
  if (!v.ok) assertEquals(v.reason, "EXPIRED");
});

Deno.test("verifyModerationToken — token from the future rejects", async () => {
  const now = Math.floor(Date.now() / 1000);
  const future = now + 3600;
  const token = await signModerationToken(
    { lid: "abc", act: "approve", iat: future, exp: future + 60 },
    SECRET,
  );
  const v = await verifyModerationToken(token, SECRET, now);
  assert(!v.ok);
  if (!v.ok) assertEquals(v.reason, "NOT_YET_VALID");
});

Deno.test("verifyModerationToken — malformed strings rejected", async () => {
  const a = await verifyModerationToken("garbage", SECRET);
  assert(!a.ok);
  if (!a.ok) assertEquals(a.reason, "MALFORMED");

  const b = await verifyModerationToken("a.b.c", SECRET);
  // a.b.c splits to "a" and "b" (split limit 2) — still has bad sig
  assert(!b.ok);

  const c = await verifyModerationToken("", SECRET);
  assert(!c.ok);
  if (!c.ok) assertEquals(c.reason, "MALFORMED");
});

Deno.test("verifyModerationToken — tampered payload rejects", async () => {
  const now = Math.floor(Date.now() / 1000);
  const token = await signModerationToken(
    { lid: "abc", act: "approve", iat: now, exp: now + 60 },
    SECRET,
  );
  const [, sig] = token.split(".");
  // Forge a payload with `act: "reject"` but reuse the original sig.
  const forgedPayload = btoa(
    JSON.stringify({ lid: "abc", act: "reject", iat: now, exp: now + 60 }),
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  const forged = `${forgedPayload}.${sig}`;
  const v = await verifyModerationToken(forged, SECRET);
  assert(!v.ok);
  if (!v.ok) assertEquals(v.reason, "BAD_SIGNATURE");
});

Deno.test("signModerationToken — short secret throws", async () => {
  let threw = false;
  try {
    await signModerationToken(
      { lid: "x", act: "approve", iat: 0, exp: 1 },
      "tooshort",
    );
  } catch {
    threw = true;
  }
  assert(threw, "expected signModerationToken to reject short secret");
});

Deno.test("buildModerationUrl — assembles correctly", () => {
  const url = buildModerationUrl(
    "https://example.supabase.co",
    "fake.token",
  );
  assertEquals(
    url,
    "https://example.supabase.co/functions/v1/listing-moderate?token=fake.token",
  );
});

Deno.test("TOKEN_DEFAULT_TTL_SECONDS — 7 days", () => {
  assertEquals(TOKEN_DEFAULT_TTL_SECONDS, 7 * 24 * 60 * 60);
});
