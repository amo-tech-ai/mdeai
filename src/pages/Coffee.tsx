import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  ThreePanelLayout,
  useThreePanelContext,
} from "@/components/explore/ThreePanelLayout";
import { CoffeeCard } from "@/components/coffee/CoffeeCard";
import { CoffeeFiltersBar } from "@/components/coffee/CoffeeFilters";
import { ListingSkeleton } from "@/components/listings/ListingSkeleton";
import { EmptyState } from "@/components/listings/EmptyState";
import { useCoffeeProducts } from "@/hooks/useCoffee";
import type { CoffeeFilters } from "@/types/coffee";
import type { SelectedItem } from "@/context/ThreePanelContext";

function CoffeeContent() {
  const [filters, setFilters] = useState<CoffeeFilters>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [{ data, fetching, error }] = useCoffeeProducts(filters);
  const { openDetailPanel } = useThreePanelContext();

  const handleProductSelect = (product: Record<string, unknown>) => {
    setSelectedId(product.id);
    const selectedItem: SelectedItem = {
      type: "coffee",
      id: product.id,
      data: product,
    };
    openDetailPanel(selectedItem);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold">Coffee</h1>
        <p className="text-muted-foreground mt-1">
          Freshly roasted coffee from Medellín's best roasters
        </p>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search coffees..."
            className="pl-10"
            value={filters.search || ""}
            onChange={(e) =>
              setFilters({ ...filters, search: e.target.value })
            }
          />
        </div>
        <CoffeeFiltersBar
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>

      {/* Results */}
      {fetching ? (
        <ListingSkeleton count={6} />
      ) : error ? (
        <EmptyState
          title="Unable to load coffee"
          description={error.message || "Something went wrong. Please try again."}
          icon="alert"
        />
      ) : !data?.length ? (
        <EmptyState
          title="No coffee products yet"
          description="Coffee products will appear here once they're added to the store and synced through Gadget."
          icon="coffee"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((product: Record<string, unknown>) => (
            <CoffeeCard
              key={product.id}
              product={product}
              isSelected={selectedId === product.id}
              onSelect={() => handleProductSelect(product)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Coffee() {
  return (
    <ThreePanelLayout>
      <CoffeeContent />
    </ThreePanelLayout>
  );
}
