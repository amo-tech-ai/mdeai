import { useMemo } from "react";
import { useLeads, type InboxLeadRow } from "./useLeads";

/**
 * Landlord performance KPIs (D12).
 *
 * V1 strategy: compute client-side from `useLeads()` data so we don't
 * need a new edge fn / view / migration. The cohort has at most a few
 * hundred leads per landlord, so the math is cheap.
 *
 * The plan §7.2 cohort-level goals are surfaced as a single
 * landlord-facing dashboard view:
 *
 *   total_leads    Count over the time window (defaults to last 30 days).
 *   active_leads   status IN ('new','viewed') — needs landlord action.
 *   reply_rate_pct % of leads with first_reply_at set.
 *   median_ttfr_ms Median first-reply latency (ms). Null when no replies yet.
 *
 * The hook also surfaces relativeWindowDays so the UI can label
 * ("últimos 30 días"). Switching the window is a one-arg change later.
 */

export interface LandlordMetrics {
  /** Total leads in the window. */
  total: number;
  /** Leads that still need landlord action (status='new' or 'viewed'). */
  active: number;
  /** Replied leads in the window (basis for the rate denominator). */
  replied: number;
  /** Archived leads in the window. */
  archived: number;
  /** % of leads with first_reply_at, 0-100, integer. Null when total=0. */
  replyRatePct: number | null;
  /** Median time-to-first-reply in ms. Null when no replies yet. */
  medianTtfrMs: number | null;
  /** New (unviewed) leads — same as the nav badge count. */
  newCount: number;
  /** The window in days (e.g. 30). */
  windowDays: number;
}

interface UseLandlordMetricsOptions {
  /** Time window in days. Defaults to 30. Set to 0 for all-time. */
  windowDays?: number;
}

interface UseLandlordMetricsReturn {
  metrics: LandlordMetrics;
  isLoading: boolean;
  error: Error | null;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Pure math — exported for unit testing without TanStack Query. */
export function computeLandlordMetrics(
  leads: InboxLeadRow[],
  windowDays = 30,
  nowMs: number = Date.now(),
): LandlordMetrics {
  const cutoffMs = windowDays > 0 ? nowMs - windowDays * MS_PER_DAY : 0;
  const inWindow = leads.filter(
    (l) => new Date(l.created_at).getTime() >= cutoffMs,
  );

  let active = 0;
  let replied = 0;
  let archived = 0;
  let newCount = 0;
  const ttfrs: number[] = [];

  for (const l of inWindow) {
    if (l.status === "new") newCount += 1;
    if (l.status === "new" || l.status === "viewed") active += 1;
    if (l.status === "replied") replied += 1;
    if (l.status === "archived") archived += 1;
    if (l.first_reply_at) {
      const ttfr =
        new Date(l.first_reply_at).getTime() -
        new Date(l.created_at).getTime();
      // Sanity: drop negatives (clock skew) + absurdly large (>30d)
      if (ttfr > 0 && ttfr < 30 * MS_PER_DAY) ttfrs.push(ttfr);
    }
  }

  const total = inWindow.length;
  const repliedAny = ttfrs.length;

  return {
    total,
    active,
    replied,
    archived,
    newCount,
    replyRatePct:
      total === 0 ? null : Math.round((repliedAny / total) * 100),
    medianTtfrMs: ttfrs.length === 0 ? null : median(ttfrs),
    windowDays,
  };
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

export function useLandlordMetrics(
  options: UseLandlordMetricsOptions = {},
): UseLandlordMetricsReturn {
  const windowDays = options.windowDays ?? 30;
  const { leads, isLoading, error } = useLeads();

  const metrics = useMemo(
    () => computeLandlordMetrics(leads ?? [], windowDays),
    [leads, windowDays],
  );

  return { metrics, isLoading, error };
}

/** Format ms as "<1 min" / "12 min" / "1h 14m" / "1d 3h". */
export function formatDuration(ms: number | null): string {
  if (ms == null) return "—";
  const totalMin = Math.round(ms / 60000);
  if (totalMin < 1) return "<1 min";
  if (totalMin < 60) return `${totalMin} min`;
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (hours < 24) return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
  const days = Math.floor(hours / 24);
  const hrRest = hours % 24;
  return hrRest === 0 ? `${days}d` : `${days}d ${hrRest}h`;
}
