import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'mdeai_anon_session_id';

/**
 * Persistent anonymous-visitor session id used by the chat to carry a
 * stable identifier across page loads so the server can enforce a
 * 3-messages-per-day gate before asking for email.
 *
 * Lives in localStorage. If cleared (incognito, privacy tool), the user
 * effectively "restarts" their anonymous quota — acceptable trade-off
 * for MVP. Production hardening (fingerprinting, signed cookies) is a
 * follow-up once abuse shows up in the rate_limit_hits table.
 *
 * See: tasks/CHAT-CENTRAL-PLAN.md §5 · Week 1 Fri.
 */
export function useAnonSession(): { anonSessionId: string | null; reset: () => void } {
  const [anonSessionId, setAnonSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      let id = window.localStorage.getItem(STORAGE_KEY);
      // Validate stored value — older builds may have written non-UUID
      // strings (e.g. `anon_<time>_<rand>`). Anything that doesn't look
      // like a UUID is regenerated so DB-facing usages (messages.conversation_id,
      // realtime topic) never see a non-UUID value.
      const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!id || !UUID_RE.test(id)) {
        id = generateUuid();
        window.localStorage.setItem(STORAGE_KEY, id);
      }
      setAnonSessionId(id);
    } catch {
      // Storage unavailable (e.g. Safari private browsing with strict settings).
      // Fall through: the hook returns null, chat stays logged-out-only.
    }
  }, []);

  const reset = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setAnonSessionId(null);
  }, []);

  return { anonSessionId, reset };
}

/**
 * Generate a RFC-4122 v4 UUID. Uses `crypto.randomUUID()` when available
 * (every modern browser since 2022); falls back to a manual v4 with
 * `crypto.getRandomValues`. We never mint non-UUID strings — this id is
 * persisted to localStorage AND used as `messages.conversation_id` for
 * anon turns, so it must satisfy Postgres' uuid type.
 */
function generateUuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 1
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  }
  // Should never hit in modern browsers; last-ditch deterministic UUID
  // is better than a non-UUID string that breaks Postgres.
  const r = (n: number) => Math.floor(Math.random() * n).toString(16);
  return `${Date.now().toString(16).padStart(8, '0').slice(-8)}-${r(0xffff).padStart(4, '0')}-4${r(0xfff).padStart(3, '0')}-8${r(0xfff).padStart(3, '0')}-${r(0xffffffffffff).padStart(12, '0')}`;
}
