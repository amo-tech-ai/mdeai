import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { writeAuditRow } from "./audit.js";
import { log } from "./logger.js";

const WINDOW_SEC = 300;
const MIN_SECRET_LEN = 32;

export type RejectCode = "MISSING_HEADER" | "STALE_TIMESTAMP" | "BAD_SIGNATURE" | "BODY_TOO_LARGE";

export interface HmacGuardOptions {
  /** Provide a secret explicitly (tests). Defaults to process.env.BRIDGE_SECRET. */
  secret?: string;
  /** Optional clock provider (tests). */
  now?: () => number;
}

export function loadSecret(explicit?: string): Buffer {
  const value = explicit ?? process.env.BRIDGE_SECRET;
  if (!value || value.length < MIN_SECRET_LEN) {
    throw new Error(
      `BRIDGE_SECRET missing or too short (min ${MIN_SECRET_LEN} chars, got ${value?.length ?? 0})`,
    );
  }
  return Buffer.from(value, "utf8");
}

export function createHmacGuard(opts: HmacGuardOptions = {}) {
  const secretBuf = loadSecret(opts.secret);
  const now = opts.now ?? (() => Math.floor(Date.now() / 1000));

  return function hmacGuard(req: Request, res: Response, next: NextFunction): void {
    const ts = req.header("x-bridge-ts");
    const sig = req.header("x-bridge-sig");

    if (!ts || !sig) {
      return reject(req, res, "MISSING_HEADER");
    }

    const tsNum = Number(ts);
    if (!Number.isFinite(tsNum) || !Number.isInteger(tsNum)) {
      return reject(req, res, "STALE_TIMESTAMP");
    }

    const drift = Math.abs(now() - tsNum);
    if (drift > WINDOW_SEC) {
      return reject(req, res, "STALE_TIMESTAMP", { drift });
    }

    const raw = (req as Request & { rawBody?: Buffer }).rawBody;
    if (!raw) {
      return reject(req, res, "BAD_SIGNATURE", { reason: "no_raw_body" });
    }

    const expected = createHmac("sha256", secretBuf)
      .update(`${ts}.`, "utf8")
      .update(raw)
      .digest();

    let provided: Buffer;
    try {
      provided = Buffer.from(sig, "hex");
    } catch {
      return reject(req, res, "BAD_SIGNATURE", { reason: "bad_hex" });
    }

    if (provided.length !== expected.length) {
      return reject(req, res, "BAD_SIGNATURE", { reason: "length_mismatch" });
    }

    if (!timingSafeEqual(provided, expected)) {
      return reject(req, res, "BAD_SIGNATURE", { reason: "mismatch" });
    }

    next();
  };
}

function reject(
  req: Request,
  res: Response,
  code: RejectCode,
  meta: Record<string, unknown> = {},
): void {
  log.warn({ code, path: req.path, ...meta }, "bridge auth rejected");
  void writeAuditRow({
    agent_name: "bridge",
    target: req.path,
    status: "unauthorized",
    metadata: { reason: code, ...meta },
  });
  res
    .status(401)
    .json({ success: false, error: { code, message: "Unauthorized" } });
}

export const HMAC_WINDOW_SEC = WINDOW_SEC;
