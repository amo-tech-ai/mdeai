import { useState } from "react";
import { Building2, Sparkles, List } from "lucide-react";
import { ThreePanelLayout, useThreePanelContext } from "@/components/explore/ThreePanelLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RentalsIntakeWizard } from "@/components/rentals/RentalsIntakeWizard";
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
            AI-powered apartment search in Medellín
          </p>
        </div>
        {view === "results" && (
          <Button variant="outline" onClick={handleReset}>
            <Sparkles className="w-4 h-4 mr-2" />
            New Search
          </Button>
        )}
      </div>

      {/* View Tabs */}
      <Tabs value={view} onValueChange={(v) => setView(v as RentalView)}>
        <TabsList>
          <TabsTrigger value="wizard" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            AI Assistant
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2" disabled={!filterJson}>
            <List className="w-4 h-4" />
            Results {filterJson && "(Active)"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wizard" className="mt-6">
          <div className="max-w-2xl">
            <RentalsIntakeWizard
              onComplete={handleWizardComplete}
              onCancel={() => setView("results")}
            />
          </div>
        </TabsContent>

        <TabsContent value="results" className="mt-6">
          {filterJson ? (
            <RentalsSearchResults
              filterJson={filterJson}
              onSelectListing={handleSelectListing}
            />
          ) : (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Use the AI Assistant to describe what you're looking for
              </p>
              <Button className="mt-4" onClick={() => setView("wizard")}>
                Start AI Search
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
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
