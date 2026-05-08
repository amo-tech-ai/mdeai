import { Router } from "express";
import { proxyRequest } from "../lib/proxy.js";

/**
 * 16A — bridge proxy for the Postiz approval webhook.
 *
 * Forwards POST `/run/postiz-approve` to
 *   ${SUPABASE_URL}/functions/v1/postiz-approval-webhook
 * preserving the caller's HMAC headers (so the Supabase function can
 * re-verify them) and injecting the service-role bearer used by Supabase
 * to gate edge fn invocation.
 */
export const postizApproveRouter: Router = Router();

postizApproveRouter.post("/", async (req, res) => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl) {
    res.status(503).json({ success: false, error: { code: "UPSTREAM_NOT_CONFIGURED", target: "postiz-approve" } });
    return;
  }
  if (!serviceKey) {
    res.status(503).json({ success: false, error: { code: "SERVICE_ROLE_KEY_MISSING", target: "postiz-approve" } });
    return;
  }
  await proxyRequest(req, res, {
    target: "postiz-approve",
    upstreamUrl: `${supabaseUrl}/functions/v1/postiz-approval-webhook`,
    rewriteHeaders: (h) => ({
      "content-type": "application/json",
      authorization: `Bearer ${serviceKey}`,
      // Preserve HMAC envelope so the Supabase fn can re-verify.
      ...(h["x-bridge-ts"] ? { "x-bridge-ts": h["x-bridge-ts"] } : {}),
      ...(h["x-bridge-sig"] ? { "x-bridge-sig": h["x-bridge-sig"] } : {}),
      ...(h["x-correlation-id"] ? { "x-correlation-id": h["x-correlation-id"] } : {}),
    }),
  });
});
