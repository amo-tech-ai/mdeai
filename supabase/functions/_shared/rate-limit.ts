/** Simple in-memory sliding-window rate limiter (per isolate; resets on cold start). */

const buckets = new Map<string, number[]>();

export function allowRate(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const windowStart = now - windowMs;
  let stamps = buckets.get(key) ?? [];
  stamps = stamps.filter((t) => t > windowStart);
  if (stamps.length >= max) return false;
  stamps.push(now);
  buckets.set(key, stamps);
  return true;
}

/** Best-effort client key for unauthenticated routes. */
export function clientIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  return req.headers.get("cf-connecting-ip") ?? "unknown";
}
