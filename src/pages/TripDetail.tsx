import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, parseISO, differenceInDays, addDays } from "date-fns";
import { ArrowLeft, Calendar, MapPin, DollarSign, Map, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ThreePanelLayout } from "@/components/explore/ThreePanelLayout";
import { VisualItineraryBuilder } from "@/components/itinerary/VisualItineraryBuilder";
import { DayTimeline } from "@/components/trips/DayTimeline";
import { AITripPlannerButton } from "@/components/trips/AITripPlannerButton";
import { useTrip, useUpdateTrip } from "@/hooks/useTrips";
import { useDeleteTripItem, useReorderTripItem, useUpdateTripItem } from "@/hooks/useTripItems";
import { useRouteOptimization } from "@/hooks/useRouteOptimization";
import { EmptyState } from "@/components/listings/EmptyState";
import { cn } from "@/lib/utils";
import type { TripStatus, TripItem } from "@/types/trip";
import { toast } from "sonner";

const statusColors: Record<TripStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-primary text-primary-foreground",
  completed: "bg-green-500/10 text-green-600",
  cancelled: "bg-destructive/10 text-destructive",
};

function TripDetailContent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [viewTab, setViewTab] = useState<"timeline" | "builder">("builder");
  const [showMap, setShowMap] = useState<boolean>(true);
  
  const { data: trip, isLoading, error } = useTrip(id!);
  const updateTrip = useUpdateTrip();
  const deleteTripItem = useDeleteTripItem();
  const reorderTripItem = useReorderTripItem();
  const updateTripItem = useUpdateTripItem();
  const { isOptimizing, optimizeRoute } = useRouteOptimization();

  const handleStatusChange = async (status: TripStatus) => {
    if (!trip) return;
    try {
      await updateTrip.mutateAsync({ id: trip.id, status });
      toast.success(`Trip marked as ${status}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleRemoveItem = async (item: TripItem) => {
    try {
      await deleteTripItem.mutateAsync({ id: item.id, trip_id: item.trip_id });
      toast.success("Item removed from trip");
    } catch (error) {
      toast.error("Failed to remove item");
    }
  };

  const handleReorderItem = async (itemId: string, newDayIndex: number, newPosition: number) => {
    if (!trip) return;
    try {
      const newStartAt = addDays(parseISO(trip.start_date), newDayIndex);
      await reorderTripItem.mutateAsync({
        id: itemId,
        trip_id: trip.id,
        newStartAt: newStartAt.toISOString(),
      });
      toast.success("Item moved");
    } catch (error) {
      toast.error("Failed to move item");
    }
  };

  const handleOptimizeRoute = async (dayItems: TripItem[], dayDate: string) => {
    if (!trip) return;
    
    const result = await optimizeRoute(dayItems, dayDate);
    
    if (result && result.optimizedOrder.length > 0) {
      // Apply the optimized order by updating each item's start_at with a time offset
      const baseDate = parseISO(dayDate);
      
      // Update items in the optimized order with staggered times (1 hour apart)
      for (let i = 0; i < result.optimizedOrder.length; i++) {
        const itemId = result.optimizedOrder[i];
        const item = dayItems.find(di => di.id === itemId);
        if (item) {
          const newTime = new Date(baseDate);
          newTime.setHours(9 + i, 0, 0, 0); // Start at 9 AM, 1 hour apart
          
          await updateTripItem.mutateAsync({
            id: itemId,
            trip_id: trip.id,
            start_at: newTime.toISOString(),
          });
        }
      }
      
      toast.success(
        `Route optimized! ${result.explanation}`,
        { 
          description: result.savings.timeMinutes > 0 
            ? `Saved ~${result.savings.timeMinutes} min travel time`
            : undefined
        }
      );
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
        <div className="space-y-4 mt-8">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="p-6">
        <EmptyState
          title="Trip not found"
          description="This trip doesn't exist or you don't have access to it."
          action={{ label: "Back to Trips", onClick: () => navigate("/trips") }}
        />
      </div>
    );
  }

  const startDate = parseISO(trip.start_date);
  const endDate = parseISO(trip.end_date);
  const days = differenceInDays(endDate, startDate) + 1;
  const status = trip.status as TripStatus;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-2 -ml-2"
            onClick={() => navigate("/trips")}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Trips
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-display font-bold">{trip.title}</h1>
            <Badge className={cn(statusColors[status])}>{status}</Badge>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {trip.destination && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {trip.destination}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}
              <span className="text-muted-foreground/60">({days} days)</span>
            </span>
            {trip.budget && (
              <span className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                {trip.currency || "USD"} {trip.budget.toLocaleString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <AITripPlannerButton
            tripId={trip.id}
            startDate={trip.start_date}
            endDate={trip.end_date}
            destination={trip.destination}
            existingItems={trip.items}
            variant="outline"
          />
          {status === "draft" && (
            <Button onClick={() => handleStatusChange("active")}>
              Activate Trip
            </Button>
          )}
          {status === "active" && (
            <Button onClick={() => handleStatusChange("completed")}>
              Mark Complete
            </Button>
          )}
        </div>
      </div>

      {/* Description */}
      {trip.description && (
        <p className="text-muted-foreground">{trip.description}</p>
      )}

      {/* Itinerary View Tabs */}
      <Tabs value={viewTab} onValueChange={(v) => setViewTab(v as "timeline" | "builder")}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-xl font-semibold">Itinerary</h2>
          <div className="flex items-center gap-2">
            {/* Map toggle (only for builder view) */}
            {viewTab === "builder" && (
              <ToggleGroup
                type="single"
                value={showMap ? "map" : "list"}
                onValueChange={(v) => setShowMap(v === "map")}
                size="sm"
              >
                <ToggleGroupItem value="list" aria-label="List view only">
                  <List className="w-4 h-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="map" aria-label="List + Map view">
                  <Map className="w-4 h-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            )}
            <TabsList>
              <TabsTrigger value="builder">
                Builder
              </TabsTrigger>
              <TabsTrigger value="timeline">
                <Calendar className="w-4 h-4 mr-1" />
                Timeline
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="builder" className="mt-4">
          <VisualItineraryBuilder
            startDate={trip.start_date}
            endDate={trip.end_date}
            items={trip.items}
            onReorderItem={handleReorderItem}
            onRemoveItem={handleRemoveItem}
            selectedDay={selectedDay}
            onDaySelect={setSelectedDay}
            showMapView={showMap}
            onOptimizeRoute={handleOptimizeRoute}
            isOptimizing={isOptimizing}
            onAddItem={(dayIndex) => {
              toast.info("Browse listings and use 'Add to Trip' to add items!");
            }}
          />
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <DayTimeline
            startDate={trip.start_date}
            endDate={trip.end_date}
            items={trip.items}
            onRemoveItem={handleRemoveItem}
            selectedDay={selectedDay}
            onDaySelect={setSelectedDay}
            onAddItem={(dayIndex) => {
              toast.info("Browse listings and use 'Add to Trip' to add items!");
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function TripDetail() {
  return (
    <ThreePanelLayout>
      <TripDetailContent />
    </ThreePanelLayout>
  );
}
