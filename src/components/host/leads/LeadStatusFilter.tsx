import { cn } from "@/lib/utils";
import type { LeadStatus } from "@/hooks/host/useLeads";

/**
 * Filter pills for the leads inbox (D9).
 *
 * 5 segments: All · New · Viewed · Replied · Archived. Counts come
 * from the parent so the same hook fetch powers both the list and
 * the badges — no extra round-trip.
 */

export type LeadFilter = "all" | LeadStatus;

interface LeadStatusFilterProps {
  value: LeadFilter;
  onChange: (next: LeadFilter) => void;
  counts: Record<LeadFilter, number>;
}

const SEGMENTS: { value: LeadFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "viewed", label: "Viewed" },
  { value: "replied", label: "Replied" },
  { value: "archived", label: "Archived" },
];

export function LeadStatusFilter({
  value,
  onChange,
  counts,
}: LeadStatusFilterProps) {
  return (
    <div
      role="tablist"
      aria-label="Filter leads by status"
      className="inline-flex rounded-lg bg-muted p-1 gap-1 overflow-x-auto"
      data-testid="lead-status-filter"
    >
      {SEGMENTS.map((seg) => {
        const active = value === seg.value;
        const count = counts[seg.value] ?? 0;
        return (
          <button
            key={seg.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(seg.value)}
            className={cn(
              "inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            data-testid={`lead-filter-${seg.value}`}
          >
            <span>{seg.label}</span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-xs tabular-nums",
                active
                  ? "bg-primary/10 text-primary"
                  : "bg-background text-muted-foreground",
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
