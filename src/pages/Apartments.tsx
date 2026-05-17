import { useState, useMemo, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, LayoutGrid, Map as MapIcon, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThreePanelLayout, useThreePanelContext } from "@/components/explore/ThreePanelLayout";
import { ApartmentCard } from "@/components/apartments/ApartmentCard";
import { ApartmentFiltersBar } from "@/components/apartments/ApartmentFilters";
import { ListingSkeleton } from "@/components/listings/ListingSkeleton";
import { EmptyState } from "@/components/listings/EmptyState";
import { useApartments, useNeighborhoods } from "@/hooks/useApartments";
import { MapProvider, useMapContext, type MapPin } from "@/context/MapContext";
import { MdeMap } from "@/components/map/MdeMap";
import { cn } from "@/lib/utils";
import type { ApartmentFilters, Apartment } from "@/types/listings";
import type { SelectedItem } from "@/context/ThreePanelContext";

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse the `?q=` URL param emitted by the chat's OPEN_RENTALS_RESULTS action.
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

function buildInitialFilters(searchParams: URLSearchParams): ApartmentFilters {
  const base = parseFiltersFromQuery(searchParams.get("q"));
  const rawIds = searchParams.get("ids");
  if (rawIds) {
    base.ids = rawIds.split(",").filter(Boolean);
  }
  return base;
}

// ── Map view ─────────────────────────────────────────────────────────────────

/** Syncs loaded apartments into MapContext as rental pins. Must be inside MapProvider. */
function ApartmentPinSync({ apartments }: { apartments: Apartment[] }) {
  const { setPins } = useMapContext();

  // Use a stable key so the effect only re-runs when the actual IDs change,
  // not on every render (avoids the infinite setPins → re-render loop).
  const aptIdsKey = apartments.map((a) => a.id).join(",");

  useEffect(() => {
    const pins: MapPin[] = apartments
      // Supabase returns PostgreSQL `numeric` columns as JS strings — `typeof === "number"`
      // always returns false. Use != null + Number() coercion to handle both string and
      // number values coming from the DB, while rejecting genuine null/undefined/NaN.
      .filter((a) => {
        const lat = Number(a.latitude);
        const lng = Number(a.longitude);
        return a.latitude != null && a.longitude != null && !isNaN(lat) && !isNaN(lng);
      })
      .map((a) => ({
        id: a.id,
        category: "rental" as const,
        title: a.title,
        latitude: Number(a.latitude),
        longitude: Number(a.longitude),
        label: a.price_daily
          ? `$${a.price_daily}/night`
          : a.price_monthly
            ? `$${a.price_monthly}/mo`
            : undefined,
        meta: {
          neighborhood: a.neighborhood ?? null,
          image: a.images?.[0] ?? null,
          bedrooms: a.bedrooms ?? null,
          source_url: null,
        },
      }));
    setPins(pins);
    return () => setPins([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aptIdsKey]);

  return null;
}

/**
 * Full-page map view: apartment list on the left, interactive Google Map on the right.
 * Activated when ?view=map is in the URL (from chat "See all on the map" hand-off).
 */
function ApartmentsMapInner({ filters }: { filters: ApartmentFilters }) {
  const { data, isLoading } = useApartments({ ...filters, limit: 50 });
  const { highlightedPinId, setHighlightedPinId } = useMapContext();
  const apartments = data?.apartments ?? [];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left: apartment list */}
      <div className="w-[400px] flex-shrink-0 flex flex-col border-r border-border bg-background">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              to="/apartments"
              className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              aria-label="Back to apartments grid"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-base font-semibold truncate">
              {isLoading ? "Loading…" : `${apartments.length} apartment${apartments.length !== 1 ? "s" : ""} on map`}
            </h1>
          </div>
          <Link to="/apartments" className="flex-shrink-0">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <LayoutGrid className="w-3.5 h-3.5" />
              Grid view
            </Button>
          </Link>
        </div>

        {/* Apartment list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-24 bg-muted/40 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : apartments.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No apartments found
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {apartments.map((apt) => {
                const isHighlighted = highlightedPinId === apt.id;
                return (
                  <li
                    key={apt.id}
                    onMouseEnter={() => setHighlightedPinId(apt.id)}
                    onMouseLeave={() => setHighlightedPinId(null)}
                    className={cn(
                      "flex gap-3 p-3 cursor-pointer transition-colors",
                      isHighlighted ? "bg-accent" : "hover:bg-accent/50"
                    )}
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                      {apt.images?.[0] ? (
                        <img
                          src={apt.images[0]}
                          alt={apt.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">
                          🏠
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/apartments/${apt.id}`}
                        className="text-sm font-medium line-clamp-1 hover:text-primary transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {apt.title}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {apt.neighborhood}
                        {apt.bedrooms ? ` · ${apt.bedrooms}BR` : ""}
                      </p>
                      <p className="text-sm font-semibold mt-1 text-primary">
                        {apt.price_daily
                          ? `$${apt.price_daily}/night`
                          : apt.price_monthly
                            ? `$${apt.price_monthly.toLocaleString()}/mo`
                            : "Contact for price"}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Right: map fills remaining space */}
      <div className="flex-1 relative">
        <ApartmentPinSync apartments={apartments} />
        <MdeMap />
      </div>
    </div>
  );
}

function ApartmentsMapPage() {
  const [searchParams] = useSearchParams();
  const initialFilters = useMemo(
    () => buildInitialFilters(searchParams),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <MapProvider>
      <ApartmentsMapInner filters={initialFilters} />
    </MapProvider>
  );
}

// ── Grid view ────────────────────────────────────────────────────────────────

/** Grid content — must be a child of ThreePanelProvider (via ThreePanelLayout). */
function ApartmentsGridContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilters = useMemo(
    () => buildInitialFilters(searchParams),
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

  const switchToMap = () => {
    const next = new URLSearchParams(searchParams);
    next.set("view", "map");
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Apartments</h1>
          <p className="text-muted-foreground mt-1">Find your perfect home in Medellín</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 mt-1" onClick={switchToMap}>
          <MapIcon className="w-3.5 h-3.5" />
          Map view
        </Button>
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

// ── Page root ─────────────────────────────────────────────────────────────────

export default function Apartments() {
  const [searchParams] = useSearchParams();
  const viewMode = searchParams.get("view");

  // Map mode: full-page split layout — no ThreePanelLayout needed
  if (viewMode === "map") {
    return <ApartmentsMapPage />;
  }

  // Grid mode: existing ThreePanelLayout with the grid
  return (
    <ThreePanelLayout>
      <ApartmentsGridContent />
    </ThreePanelLayout>
  );
}
