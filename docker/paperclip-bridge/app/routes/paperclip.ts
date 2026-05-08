import { Router } from "express";
import { proxyRequest } from "../lib/proxy.js";

export const paperclipRouter: Router = Router();

paperclipRouter.post("/comment", async (req, res) => {
  const upstream = process.env.PAPERCLIP_INTERNAL_URL;
  const apiKey = process.env.PAPERCLIP_API_KEY;
  if (!upstream) {
    res.status(503).json({ success: false, error: { code: "UPSTREAM_NOT_CONFIGURED" } });
    return;
  }
  if (!apiKey) {
    res.status(503).json({ success: false, error: { code: "PAPERCLIP_API_KEY_MISSING" } });
    return;
  }

  const body = req.body as { issue_id?: string; comment?: string } | undefined;
  if (!body?.issue_id || !body.comment) {
    res
      .status(400)
      .json({ success: false, error: { code: "BAD_REQUEST", message: "issue_id and comment required" } });
    return;
  }

  await proxyRequest(req, res, {
    target: "paperclip-comment",
    upstreamUrl: `${upstream}/api/issues/${encodeURIComponent(body.issue_id)}/comments`,
    rewriteHeaders: (h) => ({
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
      ...(h["x-correlation-id"] ? { "x-correlation-id": h["x-correlation-id"] } : {}),
    }),
    rewriteBody: () => Buffer.from(JSON.stringify({ body: body.comment }), "utf8"),
  });
});
