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
      if (!id) {
        // Use crypto.randomUUID where available; fall back to time+random.
        id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `anon_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
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
