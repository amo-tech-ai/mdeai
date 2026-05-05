/**
 * scanQueue tests — covers offline queue enqueue / flush logic.
 * IndexedDB is polyfilled by fake-indexeddb (in-memory) in the JSDOM env.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ---- fake-indexeddb polyfill (in-memory IDB) ---------------------------
// We register the polyfill globals before importing scanQueue so the
// openDb() call inside the module uses the in-memory implementation.
import "fake-indexeddb/auto";
// Reset IDB stores between tests so results don't bleed.
import { IDBFactory } from "fake-indexeddb";

import { enqueue, getAll, remove, queueSize, flushQueue } from "./scanQueue";

beforeEach(() => {
  // Replace the global indexedDB with a fresh in-memory instance each test.
  (globalThis as unknown as { indexedDB: IDBFactory }).indexedDB = new IDBFactory();
});

const makeScan = (qr = "QR-001") => ({
  qr_token: qr,
  event_id: "evt-1",
  scanned_at: new Date().toISOString(),
});

describe("enqueue / getAll / remove", () => {
  it("enqueues a scan and retrieves it", async () => {
    await enqueue(makeScan());
    const all = await getAll();
    expect(all).toHaveLength(1);
    expect(all[0].qr_token).toBe("QR-001");
    expect(all[0].id).toBeDefined();
  });

  it("removes a scan by id", async () => {
    await enqueue(makeScan("QR-A"));
    await enqueue(makeScan("QR-B"));
    const [first] = await getAll();
    await remove(first.id!);
    const remaining = await getAll();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].qr_token).toBe("QR-B");
  });

  it("queueSize returns correct count", async () => {
    expect(await queueSize()).toBe(0);
    await enqueue(makeScan("A"));
    await enqueue(makeScan("B"));
    await enqueue(makeScan("C"));
    expect(await queueSize()).toBe(3);
  });
});

describe("flushQueue", () => {
  it("removes items on success", async () => {
    await enqueue(makeScan("QR-1"));
    await enqueue(makeScan("QR-2"));

    const validateFn = vi.fn().mockResolvedValue({ ok: true, permanent: false });
    const { flushed, failed } = await flushQueue(validateFn);

    expect(flushed).toBe(2);
    expect(failed).toBe(0);
    expect(await queueSize()).toBe(0);
  });

  it("removes items on permanent 4xx error", async () => {
    await enqueue(makeScan("QR-bad"));
    const validateFn = vi.fn().mockResolvedValue({ ok: false, permanent: true });
    const { flushed } = await flushQueue(validateFn);
    expect(flushed).toBe(1);
    expect(await queueSize()).toBe(0);
  });

  it("keeps items on transient network error", async () => {
    await enqueue(makeScan("QR-net"));
    const validateFn = vi.fn().mockResolvedValue({ ok: false, permanent: false });
    const { failed } = await flushQueue(validateFn);
    expect(failed).toBe(1);
    expect(await queueSize()).toBe(1);
  });

  it("passes scan data to validateFn", async () => {
    await enqueue(makeScan("QR-TOKEN-XYZ"));
    const validateFn = vi.fn().mockResolvedValue({ ok: true, permanent: false });
    await flushQueue(validateFn);
    expect(validateFn).toHaveBeenCalledWith(
      expect.objectContaining({ qr_token: "QR-TOKEN-XYZ", event_id: "evt-1" }),
    );
  });
});
