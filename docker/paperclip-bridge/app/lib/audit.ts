import { log } from "./logger.js";

export type AuditStatus = "ok" | "failed" | "unauthorized" | "timeout";

export interface AuditRow {
  agent_name: "bridge";
  target: string;
  status: AuditStatus;
  duration_ms?: number;
  error_code?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Best-effort write to Supabase `agent_runs`. Never throws — we never want auth/audit
 * failures to mask the original request error.
 */
export async function writeAuditRow(row: AuditRow): Promise<void> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    log.debug({ row }, "audit skipped — supabase env missing");
    return;
  }
  try {
    const res = await fetch(`${url}/rest/v1/agent_runs`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        apikey: key,
        authorization: `Bearer ${key}`,
        prefer: "return=minimal",
      },
      body: JSON.stringify({
        ...row,
        created_at: new Date().toISOString(),
      }),
    });
    if (!res.ok) {
      log.warn({ status: res.status, target: row.target }, "audit write non-2xx");
    }
  } catch (err) {
    log.warn({ err: errMsg(err), target: row.target }, "audit write failed");
  }
}

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
