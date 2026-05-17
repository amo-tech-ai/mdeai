/**
 * MASTRA-040 — ai_runs middleware for the Mastra /chat endpoint.
 *
 * Intercepts POST /chat (concierge agent) requests and writes a best-effort
 * row to public.ai_runs after each turn completes. Uses service role key so
 * the insert is not gated by user RLS — the user_id is extracted from the
 * JWT in the Authorization header.
 *
 * Design constraints:
 * - Never throws / never delays the streaming response.
 * - Hono's body caching means c.req.json() is safe to call before next().
 * - JWT payload decode is done without signature verification because Mastra's
 *   auth middleware already validated the token before this middleware runs.
 */
import { recordMastraRun } from './ai-runs';

/** Decode the `sub` claim from a JWT without verifying the signature. */
function jwtSub(token: string): string | null {
  try {
    const b64 = token.split('.')[1];
    if (!b64) return null;
    // Use Buffer in Node.js runtime; atob for edge runtimes
    const json =
      typeof Buffer !== 'undefined'
        ? Buffer.from(b64, 'base64').toString('utf-8')
        : atob(b64);
    const payload = JSON.parse(json) as Record<string, unknown>;
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

/**
 * Mastra server middleware scoped to /chat.
 * Exported as `{ path, handler }` so it can be added directly to
 * `server.middleware` in the Mastra constructor:
 *
 *   server: { middleware: [aiRunsMiddleware] }
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const aiRunsMiddleware: { path: string; handler: (c: any, next: () => Promise<void>) => Promise<void> } = {
  path: '/chat',
  handler: async (c, next) => {
    const start = Date.now();

    // Extract user_id from Authorization header JWT (no re-validation needed —
    // Mastra's auth middleware already ran).
    let userId: string | null = null;
    const authHeader = c.req.header('Authorization') as string | undefined;
    if (authHeader?.startsWith('Bearer ')) {
      userId = jwtSub(authHeader.slice(7));
    }

    // Snapshot the last user message for input_data (Hono caches body after
    // the first parse so this does not consume the stream for the actual handler).
    let inputSummary: Record<string, unknown> = {};
    try {
      const body = await c.req.json() as Record<string, unknown>;
      const messages = body.messages;
      if (Array.isArray(messages) && messages.length > 0) {
        const last = messages[messages.length - 1] as Record<string, unknown>;
        inputSummary = { last_user_message: last.content ?? '' };
      }
    } catch {
      // body may not be JSON-parseable in some edge cases — ignore
    }

    await next();

    const duration = Date.now() - start;
    const status = typeof c.res?.status === 'number' && c.res.status >= 400 ? 'error' : 'success';

    // Fire-and-forget — a slow Supabase insert must never block the response.
    if (userId) {
      recordMastraRun({
        user_id: userId,
        agent_name: 'concierge-agent',
        agent_type: 'general_concierge',
        input_data: inputSummary,
        output_data: { status },
        status,
        duration_ms: duration,
      }).catch((err) => {
        console.warn('[ai-runs-middleware] insert failed:', err instanceof Error ? err.message : String(err));
      });
    }
  },
};
