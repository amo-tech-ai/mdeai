import { useState, useMemo, useCallback } from "react";
import { Search, MapPin, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ThreePanelLayout, useThreePanelContext } from "@/components/explore/ThreePanelLayout";
import { ExploreCard } from "@/components/explore/ExploreCard";
import { ExploreCategoryTabs } from "@/components/explore/ExploreCategoryTabs";
import { ExploreMapView } from "@/components/explore/ExploreMapView";
import { NeighborhoodSelector } from "@/components/places/NeighborhoodSelector";
import { ContextBanner } from "@/components/places/ContextBanner";
import { AISearchInput } from "@/components/explore/AISearchInput";
import { useExplorePlaces, useExploreCounts } from "@/hooks/useExplorePlaces";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { ExploreCategory, ExplorePlaceResult } from "@/types/explore";
import type { SelectedItem } from "@/context/ThreePanelContext";
import type { AISearchResult } from "@/hooks/useAISearch";

// Category labels and routes for "See more" links
const categoryRoutes: Record<string, { label: string; route: string }> = {
  apartment: { label: "Stays", route: "/apartments" },
  car: { label: "Car Rentals", route: "/cars" },
  restaurant: { label: "Restaurants", route: "/restaurants" },
  event: { label: "Things to Do", route: "/events" },
};

// Inner content component that uses panel context
function ExploreContent() {
  const [activeCategory, setActiveCategory] = useState<ExploreCategory>("all");
  const [neighborhood, setNeighborhood] = useState("El Poblado");
  const [searchQuery, setSearchQuery] = useState("");
  const [aiSearchResults, setAISearchResults] = useState<AISearchResult[]>([]);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [useAISearch, setUseAISearch] = useState(false);
  const { openDetailPanel } = useThreePanelContext();

  // Supabase queries
  const { data: places = [], isLoading } = useExplorePlaces({
    category: activeCategory,
    neighborhood,
    searchQuery,
  });

  const { data: counts } = useExploreCounts({
    neighborhood,
    searchQuery,
  });

  // Group places by type for "All" view
  const groupedPlaces = useMemo(() => {
    const groups: Record<string, ExplorePlaceResult[]> = {
      restaurant: [],
      apartment: [],
      event: [],
      car: [],
    };

    places.forEach((place) => {
      groups[place.type].push(place);
    });

    return groups;
  }, [places]);

  // Handle place selection - opens the right detail panel
  const handlePlaceSelect = (place: ExplorePlaceResult) => {
    setSelectedPlaceId(place.id);
    
    // Create selected item for the panel
    const selectedItem: SelectedItem = {
      type: place.type as SelectedItem["type"],
      id: place.id,
      data: place.rawData || place, // Use rawData for full entity, fallback to place
    };
    
    openDetailPanel(selectedItem);
  };

  // Handle AI search result click
  const handleAIResultSelect = useCallback((result: AISearchResult) => {
    const selectedItem: SelectedItem = {
      type: result.type as SelectedItem["type"],
      id: result.id,
      data: result.metadata || result,
    };
    setSelectedPlaceId(result.id);
    openDetailPanel(selectedItem);
  }, [openDetailPanel]);

  // Handle AI search results
  const handleAIResultsChange = useCallback((results: AISearchResult[]) => {
    setAISearchResults(results);
    setUseAISearch(results.length > 0);
  }, []);

  // Convert AI results to ExplorePlaceResult format for display
  const aiPlaces = useMemo((): ExplorePlaceResult[] => {
    return aiSearchResults.map((result) => ({
      id: result.id,
      type: result.type,
      title: result.title,
      description: result.description || "",
      image: result.imageUrl || "",
      neighborhood: result.location || "",
      rating: result.rating || null,
      price: result.priceLabel || "",
      priceLevel: result.price ? Math.ceil(result.price / 50) : 1,
      tags: [],
      coordinates: null,
      rawData: result.metadata,
    }));
  }, [aiSearchResults]);

  // Use AI results if available, otherwise use regular query results
  const displayPlaces = useAISearch && aiPlaces.length > 0 ? aiPlaces : places;

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-20 px-4 lg:px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <NeighborhoodSelector
            selected={neighborhood}
            onSelect={setNeighborhood}
          />
        </div>

        {/* AI-Powered Search */}
        <AISearchInput
          onResultsChange={handleAIResultsChange}
          onResultSelect={handleAIResultSelect}
          neighborhood={neighborhood}
          placeholder="Search with AI... try 'romantic dinner in Poblado'"
          className="mb-4"
        />

        {/* Show badge when AI search is active */}
        {useAISearch && aiPlaces.length > 0 && (
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="w-3 h-3 mr-1" />
            AI found {aiPlaces.length} results
          </Badge>
        )}

        {/* Category Tabs with counts */}
        <ExploreCategoryTabs
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          counts={counts}
        />
      </div>

      {/* Content */}
      <div className="px-4 lg:px-6 py-6 space-y-8">
        {/* Context Banner */}
        <ContextBanner neighborhood={neighborhood} />

        {/* Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/3] rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : activeCategory === "all" ? (
          // Grouped view for "All" category
          Object.entries(groupedPlaces).map(([type, typePlaces]) =>
            typePlaces.length > 0 ? (
              <section key={type}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-foreground">
                    {categoryRoutes[type]?.label}
                  </h2>
                  <Link 
                    to={categoryRoutes[type]?.route || "#"} 
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    See more
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {typePlaces.slice(0, 4).map((place) => (
                    <ExploreCard 
                      key={place.id} 
                      place={place} 
                      isSelected={selectedPlaceId === place.id}
                      onSelect={() => handlePlaceSelect(place)}
                    />
                  ))}
                </div>
              </section>
            ) : null
          )
        ) : (
          // Flat grid for specific category
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {places.map((place) => (
              <ExploreCard 
                key={place.id} 
                place={place}
                isSelected={selectedPlaceId === place.id}
                onSelect={() => handlePlaceSelect(place)}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && places.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">No places found</h2>
            <p className="text-muted-foreground mt-2">
              Try adjusting your filters or search query.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Explore() {
  return (
    <ThreePanelLayout>
      <ExploreContent />
    </ThreePanelLayout>
  );
}
