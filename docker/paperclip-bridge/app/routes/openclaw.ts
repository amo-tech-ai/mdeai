import { Router } from "express";
import { proxyRequest } from "../lib/proxy.js";

export const openclawRouter: Router = Router();

openclawRouter.post("/", async (req, res) => {
  const upstream = process.env.OPENCLAW_INTERNAL_URL;
  const token = process.env.OPENCLAW_GATEWAY_TOKEN;
  if (!upstream) {
    res.status(503).json({ success: false, error: { code: "UPSTREAM_NOT_CONFIGURED" } });
    return;
  }
  await proxyRequest(req, res, {
    target: "openclaw",
    upstreamUrl: `${upstream}/hooks/agent`,
    rewriteHeaders: (h) => ({
      "content-type": h["content-type"] ?? "application/json",
      ...(h["x-correlation-id"] ? { "x-correlation-id": h["x-correlation-id"] } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    }),
  });
});
