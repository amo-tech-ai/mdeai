/**
 * scanQueue — IndexedDB-backed offline queue for staff check-in scans.
 *
 * When the device is offline (or the ticket-validate call fails with a
 * network error), callers push a PendingScan. On reconnect, the caller
 * flushes via `flushQueue`. Each flushed item is removed on success;
 * permanent API errors (4xx) are also removed so the queue doesn't loop.
 */

const DB_NAME = "mde-scan-queue";
const STORE = "scans";
const DB_VERSION = 1;

export interface PendingScan {
  id?: number;
  qr_token: string;
  event_id: string;
  scanned_at: string; // ISO timestamp from the device
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function enqueue(scan: Omit<PendingScan, "id">): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).add(scan);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getAll(): Promise<PendingScan[]> {
  const db = await openDb();
  const result = await new Promise<PendingScan[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as PendingScan[]);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return result;
}

export async function remove(id: number): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function queueSize(): Promise<number> {
  const db = await openDb();
  const count = await new Promise<number>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return count;
}

/**
 * Flush all pending scans. For each item, calls `validateFn`.
 * Items are removed on success OR on permanent 4xx errors.
 * Transient network errors leave the item in the queue.
 */
export async function flushQueue(
  validateFn: (scan: PendingScan) => Promise<{ ok: boolean; permanent: boolean }>,
): Promise<{ flushed: number; failed: number }> {
  const items = await getAll();
  let flushed = 0;
  let failed = 0;
  for (const item of items) {
    try {
      const { ok, permanent } = await validateFn(item);
      if (ok || permanent) {
        await remove(item.id!);
        flushed++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }
  return { flushed, failed };
}
