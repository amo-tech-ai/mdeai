import { Router } from "express";
import { proxyRequest } from "../lib/proxy.js";

export const hermesRouter: Router = Router();

hermesRouter.post("/", async (req, res) => {
  const upstream = process.env.HERMES_INTERNAL_URL;
  if (!upstream) {
    res.status(503).json({ success: false, error: { code: "UPSTREAM_NOT_CONFIGURED" } });
    return;
  }
  await proxyRequest(req, res, {
    target: "hermes",
    upstreamUrl: `${upstream}/mcp/invoke`,
  });
});
