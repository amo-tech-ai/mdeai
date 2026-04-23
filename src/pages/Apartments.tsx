import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ThreePanelLayout, useThreePanelContext } from "@/components/explore/ThreePanelLayout";
import { ApartmentCard } from "@/components/apartments/ApartmentCard";
import { ApartmentFiltersBar } from "@/components/apartments/ApartmentFilters";
import { ListingSkeleton } from "@/components/listings/ListingSkeleton";
import { EmptyState } from "@/components/listings/EmptyState";
import { useApartments, useNeighborhoods } from "@/hooks/useApartments";
import type { ApartmentFilters, Apartment } from "@/types/listings";
import type { SelectedItem } from "@/context/ThreePanelContext";

/**
 * Parse the `?q=` URL param emitted by the chat's OPEN_RENTALS_RESULTS action.
 * Payload shape: `encodeURIComponent(JSON.stringify({ neighborhoods, bedrooms, priceRange, ... }))`.
 * Returns an empty object on parse failure so the page still renders.
 */
function parseFiltersFromQuery(raw: string | null): ApartmentFilters {
  if (!raw) return {};
  try {
    const decoded = decodeURIComponent(raw);
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as ApartmentFilters;
    }
  } catch {
    /* fall through to empty filters */
  }
  return {};
}

function ApartmentsContent() {
  const [searchParams] = useSearchParams();
  // Initial filters come from ?q= if present (chat hand-off), else empty.
  const initialFilters = useMemo(
    () => parseFiltersFromQuery(searchParams.get("q")),
    // We only care about the first read — subsequent filter changes update
    // local state, not the URL. (Bidirectional sync is a follow-up.)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [filters, setFilters] = useState<ApartmentFilters>(initialFilters);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data, isLoading, error } = useApartments(filters);
  const { data: neighborhoods = [] } = useNeighborhoods();
  const { openDetailPanel } = useThreePanelContext();

  const handleApartmentSelect = (apartment: Apartment) => {
    setSelectedId(apartment.id);
    const selectedItem: SelectedItem = {
      type: "apartment",
      id: apartment.id,
      data: apartment,
    };
    openDetailPanel(selectedItem);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold">Apartments</h1>
        <p className="text-muted-foreground mt-1">Find your perfect home in Medellín</p>
      </div>

      {/* Search & Filters */}
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search apartments..."
            className="pl-10"
            value={filters.search || ""}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
        <ApartmentFiltersBar
          filters={filters}
          onFiltersChange={setFilters}
          neighborhoods={neighborhoods}
        />
      </div>

      {/* Results */}
      {isLoading ? (
        <ListingSkeleton count={6} />
      ) : error ? (
        <EmptyState
          title="Error loading apartments"
          description="Something went wrong. Please try again."
          action={{ label: "Retry", onClick: () => window.location.reload() }}
        />
      ) : !data?.apartments.length ? (
        <EmptyState
          title="No apartments found"
          description="Try adjusting your filters to see more results."
          action={{ label: "Clear filters", onClick: () => setFilters({}) }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.apartments.map((apt) => (
            <ApartmentCard 
              key={apt.id} 
              apartment={apt}
              isSelected={selectedId === apt.id}
              onSelect={() => handleApartmentSelect(apt)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Apartments() {
  return (
    <ThreePanelLayout>
      <ApartmentsContent />
    </ThreePanelLayout>
  );
}
