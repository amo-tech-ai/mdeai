import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { signRequest, signedHeaders } from "./sign.js";

const SECRET = "x".repeat(64);

describe("signRequest", () => {
  it("returns a 64-char hex sig", () => {
    const { sig } = signRequest(SECRET, { hello: 1 });
    expect(sig).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic for the same ts + body", () => {
    const a = signRequest(SECRET, { x: 1 }, 1700000000);
    const b = signRequest(SECRET, { x: 1 }, 1700000000);
    expect(a.sig).toBe(b.sig);
    expect(a.body).toBe(b.body);
  });

  it("differs when body whitespace changes (raw bytes signed)", () => {
    const a = signRequest(SECRET, { a: 1, b: 2 }, 1700000000);
    // simulate manual signing of canonically-different bytes
    const ts = "1700000000";
    const altBody = '{"a": 1, "b": 2}'; // extra whitespace
    const altSig = createHmac("sha256", SECRET).update(`${ts}.`).update(altBody).digest("hex");
    expect(altSig).not.toBe(a.sig);
  });

  it("differs across different secrets", () => {
    const a = signRequest("a".repeat(64), { x: 1 }, 1);
    const b = signRequest("b".repeat(64), { x: 1 }, 1);
    expect(a.sig).not.toBe(b.sig);
  });

  it("throws on short secret", () => {
    expect(() => signRequest("short", {})).toThrow(/secret/);
  });

  it("returns canonical JSON body string", () => {
    const { body } = signRequest(SECRET, { z: 1, a: 2 });
    expect(body).toBe('{"z":1,"a":2}');
  });
});

describe("signedHeaders", () => {
  it("builds a fetch-ready header set", () => {
    const { headers, body } = signedHeaders(SECRET, { ping: true });
    expect(headers["content-type"]).toBe("application/json");
    expect(headers["x-bridge-ts"]).toMatch(/^\d+$/);
    expect(headers["x-bridge-sig"]).toMatch(/^[0-9a-f]{64}$/);
    expect(body).toBe('{"ping":true}');
  });

  it("merges extra headers without clobbering signature", () => {
    const { headers } = signedHeaders(SECRET, {}, { "x-correlation-id": "abc" });
    expect(headers["x-correlation-id"]).toBe("abc");
    expect(headers["x-bridge-sig"]).toBeDefined();
  });
});
