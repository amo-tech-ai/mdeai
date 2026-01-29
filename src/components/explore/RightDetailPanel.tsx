import { useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { 
  X, 
  Heart, 
  Share2, 
  MapPin, 
  Clock, 
  Sparkles, 
  Star,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useThreePanelContext, SelectedItem } from "@/context/ThreePanelContext";
import { useIsSaved, useToggleSave } from "@/hooks/useSavedPlaces";
import { useAuth } from "@/hooks/useAuth";
import { AddToTripDialog } from "@/components/trips/AddToTripDialog";
import type { TripItemType } from "@/types/trip";

import apartmentPlaceholder from "@/assets/apartment-1.jpg";
import carPlaceholder from "@/assets/car-1.jpg";
import restaurantPlaceholder from "@/assets/restaurant-1.jpg";
import eventPlaceholder from "@/assets/event-1.jpg";

const placeholders: Record<string, string> = {
  apartment: apartmentPlaceholder,
  car: carPlaceholder,
  restaurant: restaurantPlaceholder,
  event: eventPlaceholder,
  destination: eventPlaceholder,
};

const typeLabels: Record<string, string> = {
  apartment: "Stays",
  car: "Car Rentals",
  restaurant: "Restaurants",
  event: "Things to Do",
  destination: "Destinations",
};

const typeRoutes: Record<string, string> = {
  apartment: "apartments",
  car: "cars",
  restaurant: "restaurants",
  event: "events",
  destination: "destinations",
};

// Price level display
function getPriceDisplay(data: any, type: string): string {
  if (type === "restaurant") {
    return "$".repeat(data.price_level || 2);
  }
  if (type === "apartment") {
    if (data.price_monthly) return `$${data.price_monthly}/mo`;
    if (data.price_daily) return `$${data.price_daily}/day`;
    return "Contact for price";
  }
  if (type === "car") {
    return `$${data.price_daily}/day`;
  }
  if (type === "event") {
    if (data.ticket_price_min) return `From $${data.ticket_price_min}`;
    return "Free";
  }
  return "";
}

// Get image from entity data
function getImage(data: any, type: string): string {
  // Try various image fields
  if (data.primary_image_url) return data.primary_image_url;
  if (data.images?.length > 0) {
    const firstImage = data.images[0];
    if (typeof firstImage === "string") return firstImage;
    if (firstImage?.url) return firstImage.url;
  }
  return placeholders[type];
}

// Get title from entity data
function getTitle(data: any, type: string): string {
  if (data.title) return data.title;
  if (data.name) return data.name;
  if (type === "car") return `${data.make} ${data.model}`;
  return "Untitled";
}

// Get description
function getDescription(data: any): string {
  return data.description || "Experience the essence of Medellín luxury. This location offers a unique blend of local culture and modern sophistication, making it a favorite among discerning travelers.";
}

// Generate AI pitch based on type and data
function getAiPitch(data: any, type: string): string {
  if (type === "restaurant") {
    const cuisines = data.cuisine_types?.join(", ") || "Colombian";
    return `Must-visit for ${cuisines.toLowerCase()} lovers. This spot perfectly matches your preference for fine dining.`;
  }
  if (type === "apartment") {
    return `Perfect for your stay in ${data.neighborhood || "El Poblado"}. Great location with all the amenities you need.`;
  }
  if (type === "car") {
    return `Ideal vehicle for exploring Medellín. ${data.transmission || "Automatic"} transmission makes city driving a breeze.`;
  }
  if (type === "event") {
    return `Don't miss this experience! Perfect timing for your visit and matches your interests.`;
  }
  return `Highly recommended by locals and travelers alike.`;
}

interface RightDetailPanelProps {
  className?: string;
}

export function RightDetailPanel({ className }: RightDetailPanelProps) {
  const { selectedItem, rightPanelOpen, rightPanelContent, closeDetailPanel } = useThreePanelContext();
  const { user } = useAuth();
  
  const { data: isSaved = false } = useIsSaved(
    selectedItem?.id || "", 
    selectedItem?.type || "restaurant"
  );
  const toggleSave = useToggleSave();

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && rightPanelOpen) {
        closeDetailPanel();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [rightPanelOpen, closeDetailPanel]);

  const handleSave = useCallback(() => {
    if (!selectedItem || !user) return;
    toggleSave.mutate({
      locationId: selectedItem.id,
      locationType: selectedItem.type,
      isSaved,
    });
  }, [selectedItem, user, isSaved, toggleSave]);

  // If no content to show, don't render
  if (!selectedItem && !rightPanelContent) return null;

  // Custom content mode (for dashboards, etc.)
  if (rightPanelContent) {
    return (
      <>
        {/* Backdrop for mobile/tablet */}
        <div 
          className={cn(
            "fixed inset-0 bg-black/50 z-30 transition-opacity duration-300 lg:hidden",
            rightPanelOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={closeDetailPanel}
        />
        
        {/* Panel with custom content */}
        <aside
          className={cn(
            "fixed top-0 right-0 h-screen w-full sm:w-[500px] bg-background z-40",
            "transform transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
            "shadow-[-4px_0_24px_rgba(0,0,0,0.1)] overflow-y-auto",
            rightPanelOpen ? "translate-x-0" : "translate-x-full",
            className
          )}
        >
          {/* Close button */}
          <div className="sticky top-0 bg-background z-10 p-4 border-b border-border flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              onClick={closeDetailPanel}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Custom content */}
          {rightPanelContent}
        </aside>
      </>
    );
  }

  // Standard entity detail mode
  if (!selectedItem) return null;

  const { type, data } = selectedItem;
  const image = getImage(data, type);
  const title = getTitle(data, type);
  const price = getPriceDisplay(data, type);
  const description = getDescription(data);
  const aiPitch = getAiPitch(data, type);
  const detailUrl = `/${typeRoutes[type]}/${selectedItem.id}`;

  return (
    <>
      {/* Backdrop for mobile/tablet */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/50 z-30 transition-opacity duration-300 lg:hidden",
          rightPanelOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={closeDetailPanel}
      />
      
      {/* Panel */}
      <aside
        className={cn(
          "fixed top-0 right-0 h-screen w-full sm:w-[500px] bg-background z-40",
          "transform transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          "shadow-[-4px_0_24px_rgba(0,0,0,0.1)] overflow-y-auto",
          rightPanelOpen ? "translate-x-0" : "translate-x-full",
          className
        )}
      >
        {/* Hero Image */}
        <div className="relative h-[250px] overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover"
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white bg-black/20 hover:bg-black/40 rounded-full"
            onClick={closeDetailPanel}
          >
            <X className="w-5 h-5" />
          </Button>
          
          {/* Content overlay */}
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <Badge className="bg-primary text-primary-foreground mb-2">
              {typeLabels[type]}
            </Badge>
            <h2 className="text-2xl font-bold mb-1 drop-shadow-lg">{title}</h2>
            <div className="flex items-center gap-3 text-sm">
              {data.rating && (
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-accent text-accent" />
                  {data.rating.toFixed(1)}
                  {data.rating_count && (
                    <span className="text-white/80">({data.rating_count})</span>
                  )}
                </span>
              )}
              <span className="text-accent font-medium">{price}</span>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="sticky top-0 bg-background z-10 p-4 border-b border-border">
          <div className="flex gap-2">
            <AddToTripDialog
              itemType={type as TripItemType}
              sourceId={selectedItem.id}
              title={title}
              description={description}
              locationName={data.neighborhood || data.address}
              address={data.address}
              latitude={data.latitude}
              longitude={data.longitude}
              trigger={
                <Button className="flex-1" variant="default">
                  Add to Trip
                </Button>
              }
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleSave}
              disabled={!user}
              className={cn(isSaved && "bg-primary/10 border-primary text-primary")}
            >
              <Heart className={cn("w-4 h-4", isSaved && "fill-current")} />
            </Button>
            <Button variant="outline" size="icon">
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Why You'll Love It */}
          <section className="p-4 rounded-lg bg-primary/5 border border-primary/20 border-l-4 border-l-primary">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">Why you'll love it</h3>
                <p className="text-sm text-muted-foreground">{aiPitch}</p>
              </div>
            </div>
          </section>

          {/* Quick Info Cards */}
          <section className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-secondary border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs uppercase">Open Now</span>
              </div>
              <p className="text-sm font-medium text-foreground">Until 11:00 PM</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <MapPin className="w-4 h-4" />
                <span className="text-xs uppercase">Distance</span>
              </div>
              <p className="text-sm font-medium text-foreground">0.2 mi away</p>
            </div>
          </section>

          {/* About */}
          <section>
            <h3 className="font-semibold text-foreground mb-2">About</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          </section>

          {/* Location */}
          <section>
            <h3 className="font-semibold text-foreground mb-2">Location</h3>
            <div className="rounded-lg overflow-hidden border border-border h-[180px] bg-muted flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MapPin className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">
                  {data.neighborhood || data.address || "El Poblado, Medellín"}
                </p>
              </div>
            </div>
            <Button variant="link" className="mt-2 p-0 h-auto text-primary">
              <ExternalLink className="w-4 h-4 mr-1" />
              View on Google Maps
            </Button>
          </section>

          {/* View Full Page Link */}
          <Link to={detailUrl} className="block">
            <Button variant="outline" className="w-full">
              View Full Details
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </aside>
    </>
  );
}
