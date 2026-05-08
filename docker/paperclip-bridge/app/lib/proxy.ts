import type { Request, Response } from "express";
import { writeAuditRow, type AuditStatus } from "./audit.js";
import { log } from "./logger.js";

const DEFAULT_TIMEOUT_MS = Number(process.env.UPSTREAM_TIMEOUT_MS ?? 10_000);

export interface ProxyOptions {
  target: string;
  upstreamUrl: string;
  /** Override or strip headers before forwarding. */
  rewriteHeaders?: (incoming: Record<string, string>) => Record<string, string>;
  /** Pre-flight body transform (e.g. wrap Postiz payload). */
  rewriteBody?: (raw: Buffer) => Buffer;
  timeoutMs?: number;
}

export async function proxyRequest(
  req: Request,
  res: Response,
  opts: ProxyOptions,
): Promise<void> {
  const t0 = Date.now();
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  const incomingHeaders: Record<string, string> = {};
  for (const [k, v] of Object.entries(req.headers)) {
    if (typeof v === "string") incomingHeaders[k.toLowerCase()] = v;
  }
  const fwd = opts.rewriteHeaders
    ? opts.rewriteHeaders(incomingHeaders)
    : pickForwardableHeaders(incomingHeaders);

  const raw = (req as Request & { rawBody?: Buffer }).rawBody ?? Buffer.alloc(0);
  const body = opts.rewriteBody ? opts.rewriteBody(raw) : raw;

  let status: AuditStatus = "ok";
  let httpStatus = 502;
  let errorCode: string | undefined;

  try {
    const init: RequestInit = {
      method: req.method,
      headers: fwd,
      signal: ctrl.signal,
    };
    if (req.method !== "GET" && req.method !== "HEAD") {
      init.body = body;
    }
    const upstream = await fetch(opts.upstreamUrl, init);
    httpStatus = upstream.status;
    const respBody = await upstream.arrayBuffer();
    upstream.headers.forEach((value, name) => {
      if (!HOP_BY_HOP.has(name.toLowerCase())) res.setHeader(name, value);
    });
    res.status(upstream.status).send(Buffer.from(respBody));
    if (!upstream.ok) {
      status = "failed";
      errorCode = `UPSTREAM_${upstream.status}`;
    }
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      status = "timeout";
      errorCode = "UPSTREAM_TIMEOUT";
      httpStatus = 504;
      res.status(504).json({ success: false, error: { code: errorCode, target: opts.target } });
    } else {
      status = "failed";
      errorCode = "UPSTREAM_DOWN";
      log.error({ err: (err as Error).message, target: opts.target }, "upstream error");
      res.status(502).json({ success: false, error: { code: errorCode, target: opts.target } });
    }
  } finally {
    clearTimeout(timer);
    const duration_ms = Date.now() - t0;
    void writeAuditRow({
      agent_name: "bridge",
      target: opts.target,
      status,
      duration_ms,
      ...(errorCode ? { error_code: errorCode } : {}),
      metadata: { method: req.method, http_status: httpStatus },
    });
  }
}

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "content-encoding",
  "content-length",
]);

function pickForwardableHeaders(h: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(h)) {
    if (k.startsWith("x-bridge-")) continue;
    if (k === "host") continue;
    if (k === "authorization") continue;
    if (HOP_BY_HOP.has(k)) continue;
    out[k] = v;
  }
  if (!out["content-type"]) out["content-type"] = "application/json";
  if (h["x-correlation-id"]) out["x-correlation-id"] = h["x-correlation-id"];
  return out;
}
