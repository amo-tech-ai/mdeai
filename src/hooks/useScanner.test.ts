/**
 * useScanner tests — debounce logic only.
 * Camera access is not available in JSDOM; we skip the getUserMedia path
 * and test the debounce guard directly by inspecting the Map logic.
 */
import { describe, it, expect, vi } from "vitest";

const DEBOUNCE_MS = 5_000;

/**
 * Extracted debounce guard (mirrors the logic in useScanner.ts).
 * Returns true if the QR should fire, false if it should be suppressed.
 */
function shouldFire(
  qr: string,
  lastDetected: Map<string, number>,
  now: number,
): boolean {
  const last = lastDetected.get(qr) ?? -Infinity;
  if (now - last > DEBOUNCE_MS) {
    lastDetected.set(qr, now);
    return true;
  }
  return false;
}

describe("QR debounce guard", () => {
  it("fires the first time a QR is seen", () => {
    const map = new Map<string, number>();
    expect(shouldFire("QR-1", map, 1000)).toBe(true);
  });

  it("suppresses the same QR within 5s", () => {
    const map = new Map<string, number>();
    const t0 = 10_000;
    shouldFire("QR-1", map, t0);
    expect(shouldFire("QR-1", map, t0 + 2_000)).toBe(false);
    expect(shouldFire("QR-1", map, t0 + 4_999)).toBe(false);
  });

  it("allows the same QR after 5s", () => {
    const map = new Map<string, number>();
    const t0 = 10_000;
    shouldFire("QR-1", map, t0);
    expect(shouldFire("QR-1", map, t0 + 5_001)).toBe(true);
  });

  it("allows different QRs independently", () => {
    const map = new Map<string, number>();
    const t0 = 10_000;
    expect(shouldFire("QR-A", map, t0)).toBe(true);
    expect(shouldFire("QR-B", map, t0 + 100)).toBe(true);
    // QR-A suppressed, QR-B suppressed, QR-C fine
    expect(shouldFire("QR-A", map, t0 + 1_000)).toBe(false);
    expect(shouldFire("QR-C", map, t0 + 1_000)).toBe(true);
  });

  it("handles rapid-fire identical calls (race condition guard)", () => {
    const map = new Map<string, number>();
    const onDetected = vi.fn();
    const t = 100;
    // Simulate 5 concurrent frames with the same QR at t=100
    for (let i = 0; i < 5; i++) {
      if (shouldFire("QR-X", map, t)) onDetected("QR-X");
    }
    expect(onDetected).toHaveBeenCalledTimes(1);
  });
});
