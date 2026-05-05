import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EventDashboardTier } from "@/hooks/host/useEventDashboard";
import { formatListingPrice } from "@/lib/format-price";

interface TierTableProps {
  tiers: EventDashboardTier[];
}

/**
 * Per-tier breakdown — Sold / Remaining / Revenue.
 *
 * "Remaining" reflects qty_total − qty_sold − qty_pending so a host watching
 * during a sales rush sees real-time availability (in-flight checkouts hide
 * from the column). The pending count is shown in parens next to remaining.
 */
export function TierTable({ tiers }: TierTableProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Per-tier breakdown</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <table className="w-full text-sm" data-testid="tier-table">
          <thead>
            <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-2 font-medium">Tier</th>
              <th className="px-4 py-2 font-medium tabular-nums">Sold</th>
              <th className="px-4 py-2 font-medium tabular-nums">Remaining</th>
              <th className="px-4 py-2 font-medium tabular-nums text-right">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((t) => (
              <tr
                key={t.id}
                className="border-b last:border-b-0 text-foreground"
                data-testid={`tier-row-${t.id}`}
              >
                <td className="px-4 py-3 font-medium">{t.name}</td>
                <td className="px-4 py-3 tabular-nums">
                  {t.qty_sold} / {t.qty_total}
                </td>
                <td className="px-4 py-3 tabular-nums">
                  {t.remaining}
                  {t.qty_pending > 0 ? (
                    <span className="ml-1 text-xs text-muted-foreground">
                      (·{t.qty_pending})
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 tabular-nums text-right">
                  {formatListingPrice(t.tier_revenue_cents / 100, t.currency)}
                </td>
              </tr>
            ))}
            {tiers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                  No ticket tiers configured.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        {tiers.some((t) => t.qty_pending > 0) ? (
          <p className="px-4 pt-2 pb-4 text-xs text-muted-foreground">
            (·N) = N tickets in checkout, awaiting payment confirmation.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
