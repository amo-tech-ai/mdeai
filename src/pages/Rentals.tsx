import { useState } from "react";
import { Building2, Sparkles, List, LayoutGrid, Map } from "lucide-react";
import { ThreePanelLayout, useThreePanelContext } from "@/components/explore/ThreePanelLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RentalsWizardForm } from "@/components/rentals/RentalsWizardForm";
import { RentalsSearchResults } from "@/components/rentals/RentalsSearchResults";
import { RentalsListingDetail } from "@/components/rentals/RentalsListingDetail";
import type { Apartment } from "@/types/listings";

type RentalView = "wizard" | "results";

function RentalsContent() {
  const [view, setView] = useState<RentalView>("wizard");
  const [filterJson, setFilterJson] = useState<Record<string, unknown> | null>(null);
  const [selectedListing, setSelectedListing] = useState<Apartment | null>(null);
  const { setRightPanelContent } = useThreePanelContext();

  // Handle wizard completion
  const handleWizardComplete = (filters: Record<string, unknown>) => {
    setFilterJson(filters);
    setView("results");
  };

  // Handle listing selection
  const handleSelectListing = (listing: Apartment) => {
    setSelectedListing(listing);
    setRightPanelContent(
      <div className="p-4">
        <RentalsListingDetail
          listingId={listing.id}
          initialData={listing}
          onClose={() => {
            setSelectedListing(null);
            setRightPanelContent(null);
          }}
        />
      </div>
    );
  };

  // Reset to wizard
  const handleReset = () => {
    setView("wizard");
    setFilterJson(null);
    setSelectedListing(null);
    setRightPanelContent(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-2">
            <Building2 className="w-8 h-8 text-primary" />
            Find Your Apartment
          </h1>
          <p className="text-muted-foreground mt-1">
            Search apartments in Medellín
          </p>
        </div>
        {view === "results" && (
          <Button variant="outline" onClick={handleReset}>
            <Sparkles className="w-4 h-4 mr-2" />
            New Search
          </Button>
        )}
      </div>

      {/* Main Content - NO chat here, wizard or results only */}
      {view === "wizard" ? (
        <div className="flex justify-center">
          <RentalsWizardForm
            onComplete={handleWizardComplete}
            onCancel={filterJson ? () => setView("results") : undefined}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* View toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView("wizard")}
              >
                <Sparkles className="w-4 h-4 mr-1" />
                Edit Search
              </Button>
            </div>
          </div>

          {/* Results */}
          {filterJson ? (
            <RentalsSearchResults
              filterJson={filterJson}
              onSelectListing={handleSelectListing}
            />
          ) : (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Use the wizard to specify your search criteria
              </p>
              <Button className="mt-4" onClick={() => setView("wizard")}>
                Start Search
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Tip about Concierge */}
      {view === "wizard" && (
        <div className="text-center text-sm text-muted-foreground mt-8">
          <p>
            💡 Prefer to chat? Use the <strong>AI Concierge</strong> on the right 
            to describe what you're looking for in natural language.
          </p>
        </div>
      )}
    </div>
  );
}

export default function Rentals() {
  return (
    <ThreePanelLayout>
      <RentalsContent />
    </ThreePanelLayout>
  );
}
