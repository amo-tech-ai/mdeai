import { assertEquals, assertExists } from "jsr:@std/assert@1";
import { verifyTurnstile } from "../_shared/turnstile.ts";
import { issueNonce, verifyNonce } from "../_shared/nonce.ts";

// ── Turnstile tests ───────────────────────────────────────────────────────────

Deno.test("verifyTurnstile — passes when TURNSTILE_SECRET_KEY not set (dev mode)", async () => {
  // No env var set in test env → should always return true
  const result = await verifyTurnstile(undefined);
  assertEquals(result, true);
});

Deno.test("verifyTurnstile — passes with undefined token when no secret configured", async () => {
  const result = await verifyTurnstile(undefined, "203.0.113.1");
  assertEquals(result, true);
});

// ── Nonce tests ───────────────────────────────────────────────────────────────

Deno.test("issueNonce — returns a 3-part dot-separated token", async () => {
  const token = await issueNonce("contest-uuid-123");
  const parts = token.split(".");
  assertEquals(parts.length, 3);
});

Deno.test("verifyNonce — dev mode: unsigned token passes", async () => {
  const token = await issueNonce("contest-abc");
  const result = await verifyNonce(token, "contest-abc");
  assertEquals(result.valid, true);
  assertExists(result.payload);
  assertEquals(result.payload!.contest_id, "contest-abc");
});

Deno.test("verifyNonce — dev mode: wrong contest_id fails", async () => {
  const token = await issueNonce("contest-abc");
  const result = await verifyNonce(token, "different-contest");
  assertEquals(result.valid, false);
  assertEquals(result.reason, "contest_mismatch");
});

Deno.test("verifyNonce — missing token in dev mode passes (no secret)", async () => {
  const result = await verifyNonce(undefined);
  assertEquals(result.valid, true);
});

Deno.test("verifyNonce — malformed token returns invalid", async () => {
  const result = await verifyNonce("not.a.valid.jwt.token");
  assertEquals(result.valid, false);
});

Deno.test("verifyNonce — expired token fails (manipulated exp)", async () => {
  // Construct a token with exp in the past
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const payload = btoa(JSON.stringify({
    contest_id: "c1",
    iat: Math.floor(Date.now() / 1000) - 200,
    exp: Math.floor(Date.now() / 1000) - 100,
    jti: "test-jti",
  })).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const token = `${header}.${payload}.unsigned`;
  const result = await verifyNonce(token, "c1");
  assertEquals(result.valid, false);
  assertEquals(result.reason, "nonce_expired");
});
