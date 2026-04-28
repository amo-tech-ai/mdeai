import * as Sentry from '@sentry/react';
import {
  setMapTelemetrySink,
  type MapTelemetryEvent,
} from '@/lib/maps-telemetry';

/**
 * Sentry browser SDK init + wiring.
 *
 * Goals
 * -----
 *   1. Capture unhandled exceptions in the React tree (via <Sentry.ErrorBoundary>
 *      mounted at the App root in main.tsx).
 *   2. Forward maps-telemetry events as Sentry breadcrumbs so when an error
 *      DOES surface, the trail of `script_loaded → markers_rendered →
 *      pin_click → map_init_failed` is right there in the issue.
 *   3. Capture map error-events (`*_failed` kinds) as full Sentry events
 *      so we get alerted, not just breadcrumbed.
 *
 * Public DSN is safe to ship in the client bundle — Sentry's design. The DSN
 * authenticates events to a project but doesn't grant API access.
 *
 * Init is idempotent and gated on `VITE_SENTRY_DSN` being non-empty so dev
 * builds without the env var stay silent (no spurious telemetry).
 */

let initialized = false;

export function initSentry(): void {
  if (initialized) return;
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn || dsn.trim().length === 0) {
    // Dev / preview builds without DSN — stay silent. Map telemetry sink
    // remains the default console one set in maps-telemetry.ts.
    return;
  }

  Sentry.init({
    dsn,
    // PII (IP address etc.) — Sentry's `sendDefaultPii` flag. Safe for
    // first-party apps; revisit if compliance scope changes.
    sendDefaultPii: true,
    // Performance monitoring at 10% in prod, 100% in dev. Trace sampling
    // controls how many transactions get sent for perf insights.
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    // Replays: off by default — enable selectively later if we want session
    // replays on errors. (Adds ~50 KB to the bundle.)
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    // Tag the build so we can correlate errors with release.
    environment: import.meta.env.PROD ? 'production' : 'development',
  });

  // Replace the maps-telemetry sink with one that forwards every event as
  // a Sentry breadcrumb, plus captures `*_failed` events as Sentry issues.
  setMapTelemetrySink(mapEventToSentry);
  initialized = true;
}

/**
 * Single-purpose sink: maps event → Sentry breadcrumb (always) + Sentry
 * captureException (when the event is an error kind).
 *
 * Breadcrumbs are cheap and high-signal — they show up on every error
 * timeline, so when something does break we get the last ~100 map ops
 * leading up to it for free.
 */
function mapEventToSentry(event: MapTelemetryEvent): void {
  const isError =
    event.kind === 'script_load_failed' ||
    event.kind === 'auth_failed' ||
    event.kind === 'map_init_failed' ||
    event.kind === 'marker_render_failed';

  Sentry.addBreadcrumb({
    category: 'maps',
    message: event.kind,
    level: isError ? 'error' : 'info',
    // Strip the `kind` from the data payload since it's already in `message`.
    data: stripKind(event),
  });

  if (isError) {
    // Capture as a Sentry issue. Use a synthetic Error so the title is
    // grouped by `kind` rather than the exact error string.
    const e = new Error(`[maps] ${event.kind}`);
    Sentry.captureException(e, {
      tags: { component: 'maps', kind: event.kind },
      extra: stripKind(event),
    });
  }
}

function stripKind<E extends MapTelemetryEvent>(event: E): Omit<E, 'kind'> {
  const { kind: _kind, ...rest } = event;
  void _kind;
  return rest as Omit<E, 'kind'>;
}

/** Re-export ErrorBoundary so main.tsx can wrap <App /> without importing Sentry. */
export const SentryErrorBoundary = Sentry.ErrorBoundary;
