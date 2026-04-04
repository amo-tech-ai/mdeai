import { Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CoffeeFilters as CoffeeFiltersType } from "@/types/coffee";

interface CoffeeFiltersBarProps {
  filters: CoffeeFiltersType;
  onFiltersChange: (filters: CoffeeFiltersType) => void;
}

const ROAST_LEVELS = ["Light", "Medium", "Medium-Dark", "Dark"];
const PROCESSING_METHODS = ["Washed", "Natural", "Honey", "Anaerobic"];

export function CoffeeFiltersBar({
  filters,
  onFiltersChange,
}: CoffeeFiltersBarProps) {
  const activeCount =
    (filters.roastLevel?.length || 0) +
    (filters.processingMethod?.length || 0) +
    (filters.availableOnly ? 1 : 0);

  const toggleFilter = (
    key: "roastLevel" | "processingMethod",
    value: string
  ) => {
    const current = filters[key] || [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFiltersChange({ ...filters, [key]: next.length ? next : undefined });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: filters.search, // preserve search
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filters</span>
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 gap-1 px-2 text-xs"
            onClick={clearFilters}
          >
            Clear ({activeCount})
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Roast Level */}
      <div className="space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Roast Level</span>
        <div className="flex flex-wrap gap-1.5">
          {ROAST_LEVELS.map((level) => (
            <Badge
              key={level}
              variant={filters.roastLevel?.includes(level) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleFilter("roastLevel", level)}
            >
              {level}
            </Badge>
          ))}
        </div>
      </div>

      {/* Processing Method */}
      <div className="space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Process</span>
        <div className="flex flex-wrap gap-1.5">
          {PROCESSING_METHODS.map((method) => (
            <Badge
              key={method}
              variant={
                filters.processingMethod?.includes(method)
                  ? "default"
                  : "outline"
              }
              className="cursor-pointer"
              onClick={() => toggleFilter("processingMethod", method)}
            >
              {method}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
