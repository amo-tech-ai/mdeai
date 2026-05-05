import { AlertCircle } from 'lucide-react';
import type { ConsideredButRejected } from '@/types/chat';

interface NotAFitTableProps {
  rows: ConsideredButRejected[];
}

/**
 * Rejection-transparency table — the Mindtrip "Not a Good Fit" pattern.
 *
 * Shows the user WHICH listings the AI considered but didn't include in the
 * shortlist, with plain-language reasons. This is the trust moat: users
 * believe the top picks because they see the work behind them.
 *
 * Server populates rows in executeSearchApartments by over-fetching and
 * comparing each non-top candidate to the #1 pick. Day 4 seeds rating +
 * price gap reasons; cross-source + scam reasons arrive when ingestion lands.
 *
 * See: tasks/CHAT-CENTRAL-PLAN.md §5 · Week 1 Thu.
 */
export function NotAFitTable({ rows }: NotAFitTableProps) {
  if (!rows || rows.length === 0) return null;

  return (
    <div className="mt-3 rounded-xl border border-border bg-muted/30 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/40">
        <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />
        <h4 className="text-xs font-semibold">Not a Good Fit</h4>
        <span className="text-[10px] text-muted-foreground">
          Considered but didn't rank in the shortlist
        </span>
      </div>
      <table className="w-full text-xs">
        <tbody className="divide-y divide-border/50">
          {rows.map((row, i) => (
            <tr key={i}>
              <td className="px-3 py-2 align-top w-[55%] text-foreground">
                {row.listing_summary}
              </td>
              <td className="px-3 py-2 align-top text-muted-foreground">
                {row.reason}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
