import { cn } from "@/lib/utils";
import { getFreshnessInfo, type FreshnessLevel } from "@/types/coffee";

interface FreshnessBadgeProps {
  roastedAt: string | null | undefined;
  className?: string;
}

const levelStyles: Record<FreshnessLevel, string> = {
  peak: "bg-emerald-500/90 text-white",
  fresh: "bg-yellow-500/90 text-white",
  aging: "bg-muted/80 text-muted-foreground",
};

export function FreshnessBadge({ roastedAt, className }: FreshnessBadgeProps) {
  const { level, label } = getFreshnessInfo(roastedAt);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        levelStyles[level],
        className
      )}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
