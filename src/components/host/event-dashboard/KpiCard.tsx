import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  className?: string;
  /** Right-aligned icon (lucide). */
  icon?: ReactNode;
  "data-testid"?: string;
}

export function KpiCard({
  label,
  value,
  hint,
  className,
  icon,
  "data-testid": testId,
}: KpiCardProps) {
  return (
    <Card className={cn("relative overflow-hidden", className)} data-testid={testId}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          {icon ? (
            <span className="text-muted-foreground" aria-hidden="true">
              {icon}
            </span>
          ) : null}
        </div>
        <p className="mt-2 font-display text-3xl font-bold tabular-nums text-foreground">
          {value}
        </p>
        {hint ? (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
