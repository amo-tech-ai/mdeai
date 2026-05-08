import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "./index.js";
import { signRequest } from "./lib/sign.js";

const SECRET = "k".repeat(64);

beforeAll(() => {
  process.env.BRIDGE_SECRET = SECRET;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function sign(body: unknown) {
  return signRequest(SECRET, body);
}

describe("createApp — health", () => {
  it("GET /health returns 200 and version", async () => {
    const app = createApp({ secret: SECRET });
    const r = await request(app).get("/health");
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
    expect(r.body.version).toBe("1.0.0");
    expect(typeof r.body.uptime_s).toBe("number");
  });

  it("unknown path returns 404 with structured error", async () => {
    const app = createApp({ secret: SECRET });
    const r = await request(app).get("/nope");
    expect(r.status).toBe(404);
    expect(r.body.error.code).toBe("NOT_FOUND");
  });
});

describe("createApp — auth gate on POST routes", () => {
  it("/run/openclaw without HMAC → 401", async () => {
    const app = createApp({ secret: SECRET });
    const r = await request(app).post("/run/openclaw").send({ skill: "noop" });
    expect(r.status).toBe(401);
    expect(r.body.error.code).toBe("MISSING_HEADER");
  });

  it("/run/postiz without HMAC → 401", async () => {
    const app = createApp({ secret: SECRET });
    const r = await request(app).post("/run/postiz").send({});
    expect(r.body.error.code).toBe("MISSING_HEADER");
  });

  it("/log/supabase without HMAC → 401", async () => {
    const app = createApp({ secret: SECRET });
    const r = await request(app).post("/log/supabase").send({ a: 1 });
    expect(r.body.error.code).toBe("MISSING_HEADER");
  });
});

describe("createApp — proxy paths (env not configured)", () => {
  it("signed /run/openclaw without OPENCLAW_INTERNAL_URL → 503 UPSTREAM_NOT_CONFIGURED", async () => {
    delete process.env.OPENCLAW_INTERNAL_URL;
    const { ts, sig, body } = sign({ skill: "noop" });
    const app = createApp({ secret: SECRET });
    const r = await request(app)
      .post("/run/openclaw")
      .set("content-type", "application/json")
      .set("x-bridge-ts", ts)
      .set("x-bridge-sig", sig)
      .send(body);
    expect(r.status).toBe(503);
    expect(r.body.error.code).toBe("UPSTREAM_NOT_CONFIGURED");
  });

  it("signed /run/postiz without POSTIZ_API_KEY → 503 POSTIZ_API_KEY_MISSING", async () => {
    process.env.POSTIZ_INTERNAL_URL = "http://postiz-fake.invalid";
    delete process.env.POSTIZ_API_KEY;
    const { ts, sig, body } = sign({ post: { content: "hi" } });
    const app = createApp({ secret: SECRET });
    const r = await request(app)
      .post("/run/postiz")
      .set("content-type", "application/json")
      .set("x-bridge-ts", ts)
      .set("x-bridge-sig", sig)
      .send(body);
    expect(r.status).toBe(503);
    expect(r.body.error.code).toBe("POSTIZ_API_KEY_MISSING");
  });

  it("signed /paperclip/comment validates issue_id + comment", async () => {
    process.env.PAPERCLIP_INTERNAL_URL = "http://pc-fake.invalid";
    process.env.PAPERCLIP_API_KEY = "pcp_test";
    const { ts, sig, body } = sign({});
    const app = createApp({ secret: SECRET });
    const r = await request(app)
      .post("/paperclip/comment")
      .set("content-type", "application/json")
      .set("x-bridge-ts", ts)
      .set("x-bridge-sig", sig)
      .send(body);
    expect(r.status).toBe(400);
    expect(r.body.error.code).toBe("BAD_REQUEST");
  });
});

describe("createApp — successful proxy via mocked fetch", () => {
  it("/run/hermes forwards body and returns upstream response", async () => {
    process.env.HERMES_INTERNAL_URL = "http://hermes.invalid";
    const upstream = vi.fn(async () => {
      return new Response(JSON.stringify({ score: 0.92 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", upstream);
    const { ts, sig, body } = sign({ contact_id: "c1" });
    const app = createApp({ secret: SECRET });
    const r = await request(app)
      .post("/run/hermes")
      .set("content-type", "application/json")
      .set("x-bridge-ts", ts)
      .set("x-bridge-sig", sig)
      .send(body);
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ score: 0.92 });
    expect(upstream).toHaveBeenCalledOnce();
    const [calledUrl, init] = upstream.mock.calls[0]!;
    expect(String(calledUrl)).toBe("http://hermes.invalid/mcp/invoke");
    expect((init as RequestInit).method).toBe("POST");
  });

  it("/run/postiz strips x-bridge-* and injects apikey header", async () => {
    process.env.POSTIZ_INTERNAL_URL = "http://postiz.invalid";
    process.env.POSTIZ_API_KEY = "post_secret";
    const upstream = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", upstream);
    const { ts, sig, body } = sign({ message: "hello" });
    const app = createApp({ secret: SECRET });
    await request(app)
      .post("/run/postiz")
      .set("content-type", "application/json")
      .set("x-bridge-ts", ts)
      .set("x-bridge-sig", sig)
      .set("x-correlation-id", "abc-123")
      .send(body);
    const init = upstream.mock.calls[0]![1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers["apikey"]).toBe("post_secret");
    expect(headers["x-correlation-id"]).toBe("abc-123");
    expect(headers["x-bridge-sig"]).toBeUndefined();
    expect(headers["x-bridge-ts"]).toBeUndefined();
  });

  it("/run/openclaw maps upstream 5xx to UPSTREAM_5xx audit code (returns upstream status)", async () => {
    process.env.OPENCLAW_INTERNAL_URL = "http://openclaw.invalid";
    process.env.OPENCLAW_GATEWAY_TOKEN = "gw_tok";
    vi.stubGlobal("fetch", vi.fn(async () => new Response("boom", { status: 502 })));
    const { ts, sig, body } = sign({ skill: "send_wa" });
    const app = createApp({ secret: SECRET });
    const r = await request(app)
      .post("/run/openclaw")
      .set("content-type", "application/json")
      .set("x-bridge-ts", ts)
      .set("x-bridge-sig", sig)
      .send(body);
    expect(r.status).toBe(502);
  });

  it("/run/postiz-approve without SUPABASE_URL → 503 UPSTREAM_NOT_CONFIGURED", async () => {
    delete process.env.SUPABASE_URL;
    const { ts, sig, body } = sign({ approval_id: "a", campaign_id: "c" });
    const app = createApp({ secret: SECRET });
    const r = await request(app)
      .post("/run/postiz-approve")
      .set("content-type", "application/json")
      .set("x-bridge-ts", ts)
      .set("x-bridge-sig", sig)
      .send(body);
    expect(r.status).toBe(503);
    expect(r.body.error.code).toBe("UPSTREAM_NOT_CONFIGURED");
  });

  it("/run/postiz-approve without SERVICE_ROLE_KEY → 503 SERVICE_ROLE_KEY_MISSING", async () => {
    process.env.SUPABASE_URL = "https://x.supabase.co";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { ts, sig, body } = sign({ approval_id: "a", campaign_id: "c" });
    const app = createApp({ secret: SECRET });
    const r = await request(app)
      .post("/run/postiz-approve")
      .set("content-type", "application/json")
      .set("x-bridge-ts", ts)
      .set("x-bridge-sig", sig)
      .send(body);
    expect(r.status).toBe(503);
    expect(r.body.error.code).toBe("SERVICE_ROLE_KEY_MISSING");
  });

  it("/run/postiz-approve forwards to Supabase fn URL with bearer + preserves HMAC headers", async () => {
    process.env.SUPABASE_URL = "https://proj.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "srv_key_x";
    const upstream = vi.fn(async () => new Response(JSON.stringify({ success: true, scheduled: 5 }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }));
    vi.stubGlobal("fetch", upstream);
    const { ts, sig, body } = sign({ approval_id: "a1", campaign_id: "c1" });
    const app = createApp({ secret: SECRET });
    const r = await request(app)
      .post("/run/postiz-approve")
      .set("content-type", "application/json")
      .set("x-bridge-ts", ts)
      .set("x-bridge-sig", sig)
      .set("x-correlation-id", "cor-1")
      .send(body);
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ success: true, scheduled: 5 });
    const approveCall = upstream.mock.calls.find((c) =>
      String(c[0]).endsWith("/functions/v1/postiz-approval-webhook"),
    );
    expect(approveCall).toBeDefined();
    const init = approveCall![1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    expect(headers["authorization"]).toBe("Bearer srv_key_x");
    expect(headers["x-bridge-ts"]).toBe(ts);
    expect(headers["x-bridge-sig"]).toBe(sig);
    expect(headers["x-correlation-id"]).toBe("cor-1");
  });

  it("/run/postiz-approve unsigned → 401 (guard fires before route)", async () => {
    process.env.SUPABASE_URL = "https://proj.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "srv_key_x";
    const app = createApp({ secret: SECRET });
    const r = await request(app)
      .post("/run/postiz-approve")
      .send({ approval_id: "a", campaign_id: "c" });
    expect(r.status).toBe(401);
    expect(r.body.error.code).toBe("MISSING_HEADER");
  });

  it("returns 502 UPSTREAM_DOWN when fetch throws", async () => {
    process.env.HERMES_INTERNAL_URL = "http://hermes.invalid";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("ECONNREFUSED");
      }),
    );
    const { ts, sig, body } = sign({ q: 1 });
    const app = createApp({ secret: SECRET });
    const r = await request(app)
      .post("/run/hermes")
      .set("content-type", "application/json")
      .set("x-bridge-ts", ts)
      .set("x-bridge-sig", sig)
      .send(body);
    expect(r.status).toBe(502);
    expect(r.body.error.code).toBe("UPSTREAM_DOWN");
  });
});
