/**
 * Pending-prompt handoff between the marketing homepage and the chat app.
 *
 * Flow
 * ----
 *  1. Logged-out visitor types a prompt in <HeroChatPrompt> on `/` and clicks
 *     "Start →".
 *  2. We `savePendingPrompt(text)` to sessionStorage and route the user
 *     through `/signup` or `/login` (carrying `returnTo=/chat?send=pending`).
 *  3. After auth success, the user lands on `/chat?send=pending`.
 *  4. <ChatCanvas> reads `getPendingPrompt()`, fires it once via a ref-guard,
 *     calls `clearPendingPrompt()`, and `navigate('/chat', { replace: true })`
 *     so a refresh can never replay the prompt.
 *
 * sessionStorage (not localStorage) is intentional:
 *  - Per-tab — multi-tab users won't fire the same prompt twice.
 *  - Cleared when the tab closes — abandoned auth flows don't leave stale
 *    prompts queued for the next session.
 *
 * Single storage key: `mdeai_pending_prompt`. Do NOT introduce other keys
 * (e.g. `pending_ai_prompt`) — pin to one or risk silently dropping prompts
 * across versions.
 */

export const PENDING_PROMPT_KEY = 'mdeai_pending_prompt';

/** Cap protects against pathological pastes that would bloat the URL/storage. */
const MAX_PROMPT_LENGTH = 4_000;

export function savePendingPrompt(prompt: string): void {
  if (typeof window === 'undefined') return;
  if (typeof prompt !== 'string') return;
  const trimmed = prompt.trim().slice(0, MAX_PROMPT_LENGTH);
  if (trimmed.length === 0) return;
  try {
    window.sessionStorage.setItem(PENDING_PROMPT_KEY, trimmed);
  } catch {
    // Safari private mode / quota — silently no-op so the auth flow still
    // continues; the user just won't get the auto-fire (acceptable degrade).
  }
}

export function getPendingPrompt(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = window.sessionStorage.getItem(PENDING_PROMPT_KEY);
    if (!v) return null;
    const trimmed = v.trim();
    return trimmed.length > 0 ? trimmed : null;
  } catch {
    return null;
  }
}

export function clearPendingPrompt(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(PENDING_PROMPT_KEY);
  } catch {
    /* ignore */
  }
}

/** True when the URL signals "auto-fire the saved prompt now". */
export function urlSignalsPendingSend(search: string): boolean {
  if (typeof search !== 'string') return false;
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  return params.get('send') === 'pending';
}
