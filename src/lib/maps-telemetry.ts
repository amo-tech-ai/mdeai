/**
 * Pluggable maps telemetry.
 *
 * Today's sink is a structured `console.warn` / `console.error` so
 * silent failures stop being silent. Tomorrow we add a Sentry breadcrumb
 * and / or PostHog event by replacing one function — the call sites stay
 * unchanged.
 *
 * Usage
 * -----
 *   import { trackMapEvent } from '@/lib/maps-telemetry';
 *
 *   trackMapEvent({ kind: 'script_loaded', durationMs: 1240 });
 *   trackMapEvent({ kind: 'auth_failed', error: 'RefererNotAllowedMapError' });
 *   trackMapEvent({ kind: 'pin_click', pinId, durationMs });
 *
 * The discriminated union forces every call site to declare its `kind`,
 * so we get clean event categories in whatever sink we wire up later.
 */

export type MapTelemetryEvent =
  | { kind: 'script_loaded'; durationMs: number; libraries?: string[] }
  | { kind: 'script_load_failed'; error: string }
  | { kind: 'auth_failed'; error?: string }
  | { kind: 'map_init_failed'; error: string }
  | { kind: 'markers_rendered'; count: number; durationMs?: number }
  | { kind: 'marker_render_failed'; error: string; pinCount: number }
  | { kind: 'pin_click'; pinId: string; viaKeyboard?: boolean; newTab?: boolean }
  | { kind: 'fitbounds'; pinCount: number }
  | {
      kind: 'viewport_idle';
      bbox: { n: number; s: number; e: number; w: number };
      /** Map zoom level at the moment of idle (1–22). */
      zoom: number;
    }
  | { kind: 'cluster_expand'; clusterSize: number };

/**
 * Pluggable sink. Default is a structured console log; set this once at
 * app boot to swap in Sentry / PostHog / OTel without touching call sites.
 */
type Sink = (event: MapTelemetryEvent) => void;

const consoleSink: Sink = (event) => {
  // Errors → console.error so they show up in browser DevTools red.
  // Everything else → console.debug so it's filterable in production.
  const isError =
    event.kind === 'script_load_failed' ||
    event.kind === 'auth_failed' ||
    event.kind === 'map_init_failed' ||
    event.kind === 'marker_render_failed';
  const fn = isError ? console.error : console.debug;
  fn('[maps]', event.kind, event);
};

let activeSink: Sink = consoleSink;

/**
 * Replace the active telemetry sink. Call this once at app boot, AFTER
 * Sentry / PostHog initialize:
 *
 *   setMapTelemetrySink((event) => {
 *     Sentry.addBreadcrumb({ category: 'maps', message: event.kind, data: event });
 *     posthog.capture(`map_${event.kind}`, event);
 *   });
 */
export function setMapTelemetrySink(sink: Sink): void {
  activeSink = sink;
}

export function trackMapEvent(event: MapTelemetryEvent): void {
  try {
    activeSink(event);
  } catch (err) {
    // Telemetry must never break the app. If a sink throws, fall back
    // to console.error so the failure itself is visible.
    console.error('[maps] telemetry sink threw:', err, 'event was:', event);
  }
}

/**
 * Convenience: time an async block + emit a `script_loaded` event with
 * the measured duration. Use only for the Maps SDK script load — every
 * other measurement is per-effect and small enough for inline timing.
 */
export async function measureScriptLoad<T>(
  fn: () => Promise<T>,
  libraries: string[],
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    trackMapEvent({
      kind: 'script_loaded',
      durationMs: Math.round(performance.now() - start),
      libraries,
    });
    return result;
  } catch (err) {
    trackMapEvent({
      kind: 'script_load_failed',
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}
