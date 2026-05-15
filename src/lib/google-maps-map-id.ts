/**
 * MASTRA-068 — Production-safe Google Maps Map ID helper.
 *
 * MCP-verified via google-maps-code-assist (2026-05-14):
 *   Source: developers.google.com/maps/documentation/javascript/advanced-markers/start
 *   "For testing, you can skip creating a Map ID by using mapId: 'DEMO_MAP_ID'"
 *   "Advanced markers requires a map ID. If the map ID is missing, advanced
 *    markers cannot load."
 *
 * Rules (per MASTRA-068 task spec):
 * - VITE_GOOGLE_MAPS_MAP_ID set → always use it, in any environment.
 * - VITE_GOOGLE_MAPS_MAP_ID unset + MODE !== 'production' (dev/test):
 *     Fall back to DEMO_MAP_ID with a console.warn. DEMO_MAP_ID is
 *     explicitly documented as dev/testing only by Google.
 * - VITE_GOOGLE_MAPS_MAP_ID unset + MODE === 'production':
 *     Log a console.error and return undefined.
 *     AdvancedMarkerElement will be unavailable — this is intentionally
 *     visible so the misconfiguration is caught at deploy time, not silently
 *     degraded to the demo map ID.
 *
 * Create a real Map ID:
 *   https://console.cloud.google.com/google/maps-apis/studio/maps
 *   (Maps Management page → Create Map ID → type: JavaScript)
 * Then set VITE_GOOGLE_MAPS_MAP_ID in:
 *   - Vercel Dashboard → Settings → Environment Variables (production + preview)
 *   - .env.local for local dev if you have a test Map ID (optional — DEMO_MAP_ID
 *     fallback works for local development)
 *
 * NEVER set server-side keys (GOOGLE_PLACES_API_KEY, etc.) as VITE_ vars —
 * they are visible in the browser bundle.
 */

/** The Google-provided demo Map ID — valid for dev/testing only. */
export const DEMO_MAP_ID = 'DEMO_MAP_ID' as const;

/**
 * Returns the Google Maps Map ID to use in map initialization.
 *
 * - Returns `VITE_GOOGLE_MAPS_MAP_ID` (trimmed) if set and non-empty.
 * - In non-production environments (dev, Vitest): returns `DEMO_MAP_ID` with a
 *   console.warn so developers know the env var needs to be set for production.
 * - In production without the env var: returns `undefined` with a console.error.
 *   This causes AdvancedMarkerElement to silently refuse to load — intentional.
 *   The error message explains exactly what to fix.
 *
 * @returns Map ID string, or undefined in production when env var is missing.
 */
export function getGoogleMapsMapId(): string | undefined {
  const mapId = (import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string | undefined)?.trim();
  if (mapId) return mapId;

  if (import.meta.env.MODE !== 'production') {
    // Dev / test: use DEMO_MAP_ID so AdvancedMarkerElement works locally.
    // console.warn so the developer knows to set the env var before shipping.
    console.warn(
      '[mdeai/maps] VITE_GOOGLE_MAPS_MAP_ID is not set — falling back to ' +
        "DEMO_MAP_ID for dev/test. AdvancedMarkerElement requires a real " +
        "Map ID in production. Create one at " +
        "https://console.cloud.google.com/google/maps-apis/studio/maps " +
        "then set VITE_GOOGLE_MAPS_MAP_ID in Vercel + .env.local.",
    );
    return DEMO_MAP_ID;
  }

  // Production misconfiguration — fail clearly, not silently.
  // Returning undefined causes the Map to initialize without a mapId, which
  // means AdvancedMarkerElement will not load (but the base map still renders).
  console.error(
    '[mdeai/maps] VITE_GOOGLE_MAPS_MAP_ID is not set in production. ' +
      'AdvancedMarkerElement will not load. ' +
      'Set VITE_GOOGLE_MAPS_MAP_ID in Vercel Dashboard → Settings → ' +
      'Environment Variables (create the Map ID first at ' +
      'https://console.cloud.google.com/google/maps-apis/studio/maps).',
  );
  return undefined;
}
