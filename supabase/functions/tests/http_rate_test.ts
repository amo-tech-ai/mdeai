import { assertEquals } from "jsr:@std/assert@1";
import { errorBody, jsonResponse } from "../_shared/http.ts";
import { allowRate, clientIp } from "../_shared/rate-limit.ts";

Deno.test("errorBody — structured failure shape", () => {
  const e = errorBody("CODE", "message", { field: "x" });
  assertEquals(e.success, false);
  assertEquals(e.error.code, "CODE");
  assertEquals(e.error.message, "message");
  assertEquals(e.error.details, { field: "x" });
});

Deno.test("jsonResponse — status and JSON body", async () => {
  const res = jsonResponse({ success: true, data: { n: 1 } }, 201);
  assertEquals(res.status, 201);
  assertEquals(res.headers.get("Content-Type"), "application/json");
  const body = await res.json();
  assertEquals(body.success, true);
  assertEquals(body.data.n, 1);
});

Deno.test("clientIp — prefers x-forwarded-for first hop", () => {
  const req = new Request("https://example.com", {
    headers: { "x-forwarded-for": "203.0.113.1, 10.0.0.1" },
  });
  assertEquals(clientIp(req), "203.0.113.1");
});

Deno.test("allowRate — enforces max requests per window", () => {
  const key = `rl-test-${crypto.randomUUID()}`;
  assertEquals(allowRate(key, 3, 60_000), true);
  assertEquals(allowRate(key, 3, 60_000), true);
  assertEquals(allowRate(key, 3, 60_000), true);
  assertEquals(allowRate(key, 3, 60_000), false);
});
