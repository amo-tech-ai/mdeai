import { describe, expect, it } from "vitest";
import express, { type Request } from "express";
import request from "supertest";
import { createHmacGuard } from "./hmac.js";
import { signRequest } from "./sign.js";

const SECRET = "a".repeat(64); // 64-char hex-style fake secret (≥32)

function buildApp(opts: { secret?: string; now?: () => number } = {}) {
  const app = express();
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        (req as Request & { rawBody?: Buffer }).rawBody = buf;
      },
    }),
  );
  const guard = createHmacGuard({ secret: opts.secret ?? SECRET, ...(opts.now ? { now: opts.now } : {}) });
  app.post("/protected", guard, (_req, res) => res.json({ ok: true }));
  return app;
}

describe("hmacGuard — happy path", () => {
  it("accepts a correctly signed request", async () => {
    const body = { hello: "world" };
    const { ts, sig, body: raw } = signRequest(SECRET, body);
    const r = await request(buildApp())
      .post("/protected")
      .set("content-type", "application/json")
      .set("x-bridge-ts", ts)
      .set("x-bridge-sig", sig)
      .send(raw);
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ ok: true });
  });

  it("accepts an empty body if signed", async () => {
    const { ts, sig } = signRequest(SECRET, {});
    const r = await request(buildApp())
      .post("/protected")
      .set("content-type", "application/json")
      .set("x-bridge-ts", ts)
      .set("x-bridge-sig", sig)
      .send("{}");
    expect(r.status).toBe(200);
  });
});

describe("hmacGuard — rejection paths", () => {
  it("rejects MISSING_HEADER when ts/sig absent", async () => {
    const r = await request(buildApp()).post("/protected").send({ a: 1 });
    expect(r.status).toBe(401);
    expect(r.body.error.code).toBe("MISSING_HEADER");
  });

  it("rejects MISSING_HEADER when only ts is present", async () => {
    const r = await request(buildApp())
      .post("/protected")
      .set("x-bridge-ts", "1700000000")
      .send({ a: 1 });
    expect(r.body.error.code).toBe("MISSING_HEADER");
  });

  it("rejects STALE_TIMESTAMP for a 6-minute-old ts", async () => {
    const sixMinAgo = Math.floor(Date.now() / 1000) - 6 * 60;
    const { ts, sig, body: raw } = signRequest(SECRET, { x: 1 }, sixMinAgo);
    const r = await request(buildApp())
      .post("/protected")
      .set("content-type", "application/json")
      .set("x-bridge-ts", ts)
      .set("x-bridge-sig", sig)
      .send(raw);
    expect(r.status).toBe(401);
    expect(r.body.error.code).toBe("STALE_TIMESTAMP");
  });

  it("rejects STALE_TIMESTAMP for a 6-minute-FUTURE ts (clock-skew abuse)", async () => {
    const sixMinAhead = Math.floor(Date.now() / 1000) + 6 * 60;
    const { ts, sig, body: raw } = signRequest(SECRET, { x: 1 }, sixMinAhead);
    const r = await request(buildApp())
      .post("/protected")
      .set("content-type", "application/json")
      .set("x-bridge-ts", ts)
      .set("x-bridge-sig", sig)
      .send(raw);
    expect(r.body.error.code).toBe("STALE_TIMESTAMP");
  });

  it("rejects STALE_TIMESTAMP for a non-numeric ts", async () => {
    const r = await request(buildApp())
      .post("/protected")
      .set("x-bridge-ts", "not-a-number")
      .set("x-bridge-sig", "deadbeef")
      .send({});
    expect(r.body.error.code).toBe("STALE_TIMESTAMP");
  });

  it("rejects BAD_SIGNATURE when sig is wrong", async () => {
    const { ts, body: raw } = signRequest(SECRET, { x: 1 });
    const r = await request(buildApp())
      .post("/protected")
      .set("content-type", "application/json")
      .set("x-bridge-ts", ts)
      .set("x-bridge-sig", "00".repeat(32))
      .send(raw);
    expect(r.status).toBe(401);
    expect(r.body.error.code).toBe("BAD_SIGNATURE");
  });

  it("rejects BAD_SIGNATURE when sig is non-hex", async () => {
    const { ts, body: raw } = signRequest(SECRET, { x: 1 });
    const r = await request(buildApp())
      .post("/protected")
      .set("content-type", "application/json")
      .set("x-bridge-ts", ts)
      .set("x-bridge-sig", "zzzz")
      .send(raw);
    expect(r.body.error.code).toBe("BAD_SIGNATURE");
  });

  it("rejects BAD_SIGNATURE when body bytes are tampered after signing", async () => {
    const { ts, sig } = signRequest(SECRET, { hello: "world" });
    // caller computed sig over {"hello":"world"} but sends a different payload
    const r = await request(buildApp())
      .post("/protected")
      .set("content-type", "application/json")
      .set("x-bridge-ts", ts)
      .set("x-bridge-sig", sig)
      .send('{"hello":"WORLD"}');
    expect(r.body.error.code).toBe("BAD_SIGNATURE");
  });

  it("rejects when secret used by caller differs from server", async () => {
    const wrongCallerSecret = "b".repeat(64);
    const { ts, sig, body: raw } = signRequest(wrongCallerSecret, { x: 1 });
    const r = await request(buildApp({ secret: SECRET }))
      .post("/protected")
      .set("content-type", "application/json")
      .set("x-bridge-ts", ts)
      .set("x-bridge-sig", sig)
      .send(raw);
    expect(r.body.error.code).toBe("BAD_SIGNATURE");
  });
});

describe("hmacGuard — boot guards", () => {
  it("throws if secret is missing", () => {
    expect(() => createHmacGuard({ secret: "" })).toThrow(/BRIDGE_SECRET/);
  });

  it("throws if secret is shorter than 32 chars", () => {
    expect(() => createHmacGuard({ secret: "tooshort" })).toThrow(/BRIDGE_SECRET/);
  });
});

describe("hmacGuard — replay window edges", () => {
  it("accepts ts exactly 300s in the past", async () => {
    const real = Math.floor(Date.now() / 1000);
    const tsPast = real - 300;
    const { ts, sig, body: raw } = signRequest(SECRET, { y: 2 }, tsPast);
    const r = await request(buildApp({ now: () => real }))
      .post("/protected")
      .set("content-type", "application/json")
      .set("x-bridge-ts", ts)
      .set("x-bridge-sig", sig)
      .send(raw);
    expect(r.status).toBe(200);
  });

  it("rejects ts 301s in the past", async () => {
    const real = Math.floor(Date.now() / 1000);
    const tsPast = real - 301;
    const { ts, sig, body: raw } = signRequest(SECRET, { y: 2 }, tsPast);
    const r = await request(buildApp({ now: () => real }))
      .post("/protected")
      .set("content-type", "application/json")
      .set("x-bridge-ts", ts)
      .set("x-bridge-sig", sig)
      .send(raw);
    expect(r.status).toBe(401);
    expect(r.body.error.code).toBe("STALE_TIMESTAMP");
  });
});
