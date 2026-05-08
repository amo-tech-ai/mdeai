import { Router } from "express";
import { proxyRequest } from "../lib/proxy.js";

export const postizRouter: Router = Router();

postizRouter.post("/", async (req, res) => {
  const upstream = process.env.POSTIZ_INTERNAL_URL;
  const apiKey = process.env.POSTIZ_API_KEY;
  if (!upstream) {
    res.status(503).json({ success: false, error: { code: "UPSTREAM_NOT_CONFIGURED" } });
    return;
  }
  if (!apiKey) {
    res.status(503).json({ success: false, error: { code: "POSTIZ_API_KEY_MISSING" } });
    return;
  }
  await proxyRequest(req, res, {
    target: "postiz",
    upstreamUrl: `${upstream}/public/v1/posts`,
    rewriteHeaders: (h) => ({
      "content-type": "application/json",
      apikey: apiKey,
      ...(h["x-correlation-id"] ? { "x-correlation-id": h["x-correlation-id"] } : {}),
      ...(h["idempotency-key"] ? { "idempotency-key": h["idempotency-key"] } : {}),
    }),
  });
});
