/**
 * Resolve the Supabase **publishable** (anon) JWT for Edge Function `apikey` headers.
 * Canonical name matches the dashboard and `CLAUDE.md`: `VITE_SUPABASE_PUBLISHABLE_KEY`.
 * `VITE_SUPABASE_ANON_KEY` is accepted as a legacy alias when set (same role=anon value).
 */
export function getSupabasePublishableKey(): string {
  const fromPublishable = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const fromLegacyAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const key =
    (typeof fromPublishable === 'string' && fromPublishable.trim()) ||
    (typeof fromLegacyAnon === 'string' && fromLegacyAnon.trim()) ||
    '';
  if (!key) {
    throw new Error(
      'Missing Supabase publishable key: set VITE_SUPABASE_PUBLISHABLE_KEY (or legacy VITE_SUPABASE_ANON_KEY) for Edge `apikey` requests.',
    );
  }
  return key;
}
