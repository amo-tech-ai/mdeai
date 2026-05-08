import { Router } from "express";
import { writeAuditRow } from "../lib/audit.js";
import { log } from "../lib/logger.js";

export const supabaseRouter: Router = Router();

interface LogPayload {
  agent_name?: string;
  target?: string;
  status?: "ok" | "failed" | "unauthorized" | "timeout";
  duration_ms?: number;
  error_code?: string;
  metadata?: Record<string, unknown>;
}

supabaseRouter.post("/", async (req, res) => {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    res.status(503).json({ success: false, error: { code: "SUPABASE_NOT_CONFIGURED" } });
    return;
  }
  const payload = req.body as LogPayload | undefined;
  if (!payload?.agent_name || !payload.status || !payload.target) {
    res
      .status(400)
      .json({ success: false, error: { code: "BAD_REQUEST", message: "agent_name, target, status required" } });
    return;
  }
  try {
    const r = await fetch(`${url}/rest/v1/agent_runs`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: key,
        authorization: `Bearer ${key}`,
        prefer: "return=minimal",
      },
      body: JSON.stringify({ ...payload, created_at: new Date().toISOString() }),
    });
    if (!r.ok) {
      const text = await r.text();
      log.warn({ status: r.status, text }, "supabase log relay failed");
      res
        .status(502)
        .json({ success: false, error: { code: "SUPABASE_RELAY_FAILED", upstream_status: r.status } });
      return;
    }
    void writeAuditRow({
      agent_name: "bridge",
      target: "supabase-log-relay",
      status: "ok",
      metadata: { for_agent: payload.agent_name },
    });
    res.status(204).end();
  } catch (err) {
    log.error({ err: (err as Error).message }, "supabase relay threw");
    res.status(502).json({ success: false, error: { code: "SUPABASE_RELAY_FAILED" } });
  }
});
