import { timingSafeEqual as nodeTimingSafeEqual } from "node:crypto";

/** Constant-time string comparison to prevent timing attacks on secrets. */
export function timingSafeEqual(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  if (aBytes.byteLength !== bBytes.byteLength) return false;
  return nodeTimingSafeEqual(aBytes, bBytes);
}
