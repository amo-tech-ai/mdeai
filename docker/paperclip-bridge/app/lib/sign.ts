import { createHmac } from "node:crypto";

export interface SignedRequest {
  ts: string;
  sig: string;
  body: string;
}

/**
 * Compute HMAC-SHA256 over `${ts}.${rawBody}` and return headers + canonical body.
 * Callers MUST send `body` verbatim and set X-Bridge-Ts/X-Bridge-Sig from the result.
 */
export function signRequest(secret: string, body: unknown, nowSec?: number): SignedRequest {
  if (!secret || secret.length < 32) {
    throw new Error("signRequest: secret missing or too short (min 32 chars)");
  }
  const ts = String(nowSec ?? Math.floor(Date.now() / 1000));
  const json = body === undefined ? "" : JSON.stringify(body);
  const sig = createHmac("sha256", secret).update(`${ts}.`, "utf8").update(json, "utf8").digest("hex");
  return { ts, sig, body: json };
}

/**
 * Convenience builder: returns headers ready to merge into fetch().
 */
export function signedHeaders(secret: string, body: unknown, extra: Record<string, string> = {}): {
  headers: Record<string, string>;
  body: string;
} {
  const { ts, sig, body: json } = signRequest(secret, body);
  return {
    headers: {
      "content-type": "application/json",
      "x-bridge-ts": ts,
      "x-bridge-sig": sig,
      ...extra,
    },
    body: json,
  };
}
