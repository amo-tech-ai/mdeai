import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EventDashboardCheckIn } from "@/hooks/host/useEventDashboard";

interface RecentActivityStripProps {
  checkIns: EventDashboardCheckIn[];
}

/**
 * Right-panel strip showing the last 10 scan attempts (any outcome).
 * Differentiates the dashboard from a bare admin grid (audit #4).
 */
export function RecentActivityStrip({ checkIns }: RecentActivityStripProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Recent activity</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        {checkIns.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            No scans yet — share the staff link with door staff to start.
          </p>
        ) : (
          <ul className="divide-y" data-testid="recent-check-ins">
            {checkIns.map((ci) => (
              <li
                key={ci.id}
                className="flex items-start gap-3 px-4 py-3"
                data-testid={`check-in-${ci.result}`}
              >
                <ResultIcon result={ci.result} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {attendeeName(ci) ?? humanResult(ci.result)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tierName(ci) ? `${tierName(ci)} · ` : ""}
                    {humanResult(ci.result)} ·{" "}
                    {new Date(ci.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ResultIcon({ result }: { result: string }) {
  if (result === "consumed") {
    return (
      <span
        className={cn(
          "mt-0.5 grid h-6 w-6 place-items-center rounded-full",
          "bg-emerald-100 text-emerald-700",
        )}
        aria-hidden="true"
      >
        <Check className="h-4 w-4" />
      </span>
    );
  }
  if (result === "already_used" || result === "wrong_event" || result === "invalid_signature") {
    return (
      <span
        className={cn(
          "mt-0.5 grid h-6 w-6 place-items-center rounded-full",
          "bg-rose-100 text-rose-700",
        )}
        aria-hidden="true"
      >
        <X className="h-4 w-4" />
      </span>
    );
  }
  return (
    <span
      className={cn(
        "mt-0.5 grid h-6 w-6 place-items-center rounded-full",
        "bg-amber-100 text-amber-700",
      )}
      aria-hidden="true"
    >
      <AlertTriangle className="h-4 w-4" />
    </span>
  );
}

function attendeeName(ci: EventDashboardCheckIn): string | null {
  const d = ci.details as { attendee_name?: string } | null;
  return d?.attendee_name ?? null;
}
function tierName(ci: EventDashboardCheckIn): string | null {
  const d = ci.details as { ticket_tier?: string } | null;
  return d?.ticket_tier ?? null;
}
function humanResult(r: string): string {
  switch (r) {
    case "consumed":           return "Checked in";
    case "already_used":       return "Already used";
    case "unknown_token":      return "Unknown token";
    case "refunded":           return "Refunded";
    case "cancelled":          return "Cancelled";
    case "pending_payment":    return "Pending payment";
    case "event_ended":        return "Event ended";
    case "invalid_signature":  return "Invalid signature";
    case "wrong_event":        return "Wrong event";
    case "staff_token_revoked":return "Staff token revoked";
    default:                   return r;
  }
}
