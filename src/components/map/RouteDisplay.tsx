import { cn } from '@/lib/utils';

/**
 * React adaptation of grounding-lite-mcp-sample-app/components/route-display.ts
 * (Lit Element RouteDisplay → React functional component).
 *
 * Renders Duration + Distance from a compute_routes Maps MCP response.
 * Used by OPEN_ROUTE_RESULTS chat action payloads (Phase 3 directions feature).
 *
 * Uses metric units (km/m) — appropriate for Medellín / Colombia.
 * Lit original used Imperial; adapted here for local context.
 */

export interface RouteData {
  /** Duration string returned by Maps MCP, e.g. "1234s" */
  duration: string;
  /** Distance in metres returned by Maps MCP */
  distanceMeters: number;
  /** Optional human-readable label for the route */
  label?: string;
}

function formatDuration(durationString: string): string {
  if (!durationString) return '';
  const seconds = parseInt(durationString.replace('s', ''), 10);
  if (isNaN(seconds)) return '';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) return `${hours} hr ${minutes > 0 ? `${minutes} min` : ''}`.trim();
  if (minutes > 0) return `${minutes} min`;
  return `${remainingSeconds} sec`;
}

function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

export interface RouteDisplayProps {
  route: RouteData;
  className?: string;
}

export function RouteDisplay({ route, className }: RouteDisplayProps) {
  return (
    <div
      className={cn(
        'border border-emerald-200/50 bg-emerald-50/50 rounded-lg p-3 mb-2 text-sm font-sans',
        className,
      )}
      aria-label={route.label ? `Route: ${route.label}` : 'Route details'}
    >
      {route.label && (
        <p className="text-[11px] font-medium text-emerald-800 mb-2 truncate">{route.label}</p>
      )}
      <div className="flex items-center justify-around text-center">
        <div className="flex-1 px-1">
          <p className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wider">
            Duration
          </p>
          <p className="text-lg font-bold text-emerald-900">
            {formatDuration(route.duration)}
          </p>
        </div>
        <div className="border-l border-emerald-200/60 h-8 mx-2" aria-hidden />
        <div className="flex-1 px-1">
          <p className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wider">
            Distance
          </p>
          <p className="text-lg font-bold text-emerald-900">
            {formatDistance(route.distanceMeters)}
          </p>
        </div>
      </div>
    </div>
  );
}
