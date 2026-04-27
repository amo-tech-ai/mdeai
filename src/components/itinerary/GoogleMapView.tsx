/// <reference types="@types/google.maps" />
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { MapPin, Clock, Route, Navigation, AlertCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TripItem, TripItemType } from "@/types/trip";
import type { DirectionsResult } from "@/hooks/useGoogleDirections";
import { loadGoogleMapsLibrary } from "@/lib/google-maps-loader";

interface GoogleMapViewProps {
  items: TripItem[];
  selectedItemId?: string;
  onItemSelect?: (item: TripItem) => void;
  directionsResult?: DirectionsResult | null;
  isLoadingDirections?: boolean;
  onRequestDirections?: () => void;
  apiKey: string;
}

// Type icons for markers
const typeIcons: Record<TripItemType, string> = {
  apartment: "🏠",
  car: "🚗",
  restaurant: "🍽️",
  event: "🎉",
  activity: "⭐",
  transport: "🚌",
  note: "📝",
};

// Marker colors
const markerColors: Record<TripItemType, string> = {
  apartment: "#3B82F6",
  car: "#F97316",
  restaurant: "#22C55E",
  event: "#A855F7",
  activity: "#EAB308",
  transport: "#64748B",
  note: "#6B7280",
};

// Decode Google encoded polyline
function decodePolyline(encoded: string): google.maps.LatLngLiteral[] {
  const points: google.maps.LatLngLiteral[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return points;
}

// Format duration
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
}

// Format distance
function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function GoogleMapView({
  items,
  selectedItemId,
  onItemSelect,
  directionsResult,
  isLoadingDirections,
  onRequestDirections,
  apiKey,
}: GoogleMapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Filter items with coordinates
  const itemsWithCoords = useMemo(
    () => items.filter((item) => item.latitude !== null && item.longitude !== null),
    [items]
  );

  // Load Google Maps via the shared singleton loader. Never inject our
  // own <script> tag — that's the whole reason the loader exists. The
  // loader is idempotent across components AND React StrictMode remounts.
  useEffect(() => {
    if (!apiKey) return;
    let cancelled = false;
    (async () => {
      try {
        // Pre-warm the libraries we use so the init effect below doesn't
        // race the script-load promise.
        await Promise.all([
          loadGoogleMapsLibrary("maps", apiKey),
          loadGoogleMapsLibrary("marker", apiKey),
        ]);
        if (!cancelled) setIsMapLoaded(true);
      } catch (err) {
        if (!cancelled) setMapError(err instanceof Error ? err.message : "Failed to load Google Maps");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  // Initialize map (StrictMode-safe via the `mapRef.current` guard).
  useEffect(() => {
    if (!isMapLoaded || !mapContainerRef.current || mapRef.current) return;

    try {
      // Default center: Medellín
      const defaultCenter = { lat: 6.2442, lng: -75.5812 };

      mapRef.current = new google.maps.Map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 13,
        mapId: "itinerary-map",
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        gestureHandling: "greedy",
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      });
    } catch (err) {
      console.error("Map init error:", err);
      setMapError("Failed to initialize map");
    }
  }, [isMapLoaded]);

  // Create custom marker content
  const createMarkerContent = useCallback(
    (item: TripItem, index: number, isSelected: boolean) => {
      const itemType = item.item_type as TripItemType;
      const color = markerColors[itemType] || "#6B7280";
      const icon = typeIcons[itemType] || "📍";

      const div = document.createElement("div");
      div.className = `flex items-center gap-1 px-2 py-1.5 rounded-full shadow-lg border-2 transition-all cursor-pointer ${
        isSelected
          ? "scale-110 border-primary bg-primary text-primary-foreground"
          : "border-white bg-white hover:scale-105"
      }`;
      div.style.borderColor = isSelected ? "" : color;

      div.innerHTML = `
        <span class="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" 
              style="background: ${isSelected ? "rgba(255,255,255,0.2)" : color + "20"}; color: ${isSelected ? "inherit" : color}">
          ${index + 1}
        </span>
        <span class="text-sm">${icon}</span>
        <span class="text-xs font-medium max-w-[80px] truncate" style="color: ${isSelected ? "inherit" : "#1f2937"}">
          ${item.title}
        </span>
      `;

      return div;
    },
    []
  );

  // Update markers
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;

    // Clear existing markers
    // Clean up listeners + detach existing markers before rebuilding.
    markersRef.current.forEach((marker) => {
      const stash = marker as unknown as { __mdeaiClick?: EventListener };
      if (stash.__mdeaiClick) {
        marker.removeEventListener('gmp-click', stash.__mdeaiClick);
        stash.__mdeaiClick = undefined;
      }
      marker.map = null;
    });
    markersRef.current = [];

    if (itemsWithCoords.length === 0) return;

    const bounds = new google.maps.LatLngBounds();

    itemsWithCoords.forEach((item, index) => {
      const position = { lat: item.latitude!, lng: item.longitude! };
      bounds.extend(position);

      const isSelected = selectedItemId === item.id;

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapRef.current!,
        position,
        content: createMarkerContent(item, index, isSelected),
        zIndex: isSelected ? 1000 : index,
        // Required for the modern `gmp-click` event to fire (also makes
        // the element keyboard-focusable for a11y).
        gmpClickable: true,
      });

      // Use the modern `gmp-click` event per Google's recent guidance.
      // <gmp-advanced-marker> deprecates plain 'click'; using addListener
      // logs a console warning. The handler is captured separately so we
      // can removeEventListener on cleanup below.
      const onClick = () => onItemSelect?.(item);
      marker.addEventListener("gmp-click", onClick);
      // Stash the handler on the element for cleanup.
      (marker as unknown as { __mdeaiClick?: EventListener }).__mdeaiClick = onClick;

      markersRef.current.push(marker);
    });

    // Fit bounds with padding
    if (itemsWithCoords.length > 1) {
      mapRef.current.fitBounds(bounds, { top: 50, right: 50, bottom: 100, left: 50 });
    } else if (itemsWithCoords.length === 1) {
      mapRef.current.setCenter({
        lat: itemsWithCoords[0].latitude!,
        lng: itemsWithCoords[0].longitude!,
      });
      mapRef.current.setZoom(15);
    }
  }, [itemsWithCoords, selectedItemId, isMapLoaded, createMarkerContent, onItemSelect]);

  // Update route polyline when directions result changes
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded) return;

    // Clear existing polyline
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (!directionsResult?.success || !directionsResult.overviewPolyline) return;

    try {
      const path = decodePolyline(directionsResult.overviewPolyline);

      polylineRef.current = new google.maps.Polyline({
        path,
        geodesic: true,
        strokeColor: "hsl(var(--primary))",
        strokeOpacity: 0.8,
        strokeWeight: 4,
        map: mapRef.current,
      });
    } catch (err) {
      console.error("Polyline error:", err);
    }
  }, [directionsResult, isMapLoaded]);

  // Update markers when selection changes
  useEffect(() => {
    if (!isMapLoaded) return;

    markersRef.current.forEach((marker, index) => {
      const item = itemsWithCoords[index];
      if (item) {
        const isSelected = selectedItemId === item.id;
        marker.content = createMarkerContent(item, index, isSelected);
        marker.zIndex = isSelected ? 1000 : index;
      }
    });
  }, [selectedItemId, itemsWithCoords, createMarkerContent, isMapLoaded]);

  // Empty state
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/50 rounded-xl">
        <div className="text-center text-muted-foreground">
          <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Add activities to see them on the map</p>
        </div>
      </div>
    );
  }

  if (itemsWithCoords.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/50 rounded-xl">
        <div className="text-center text-muted-foreground">
          <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No location data for today's activities</p>
          <p className="text-sm mt-1">Add activities with addresses to see the route</p>
        </div>
      </div>
    );
  }

  // Error state
  if (mapError) {
    return (
      <div className="flex items-center justify-center h-full bg-destructive/10 rounded-xl">
        <div className="text-center text-destructive">
          <AlertCircle className="w-12 h-12 mx-auto mb-2" />
          <p>{mapError}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            Reload
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden">
      {/* Map container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Loading overlay */}
      {(!isMapLoaded || isLoadingDirections) && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Stats panel */}
      {directionsResult?.success && (
        <div className="absolute bottom-4 left-4 right-4 flex gap-2 justify-center flex-wrap">
          <Badge variant="secondary" className="bg-background/95 shadow-md backdrop-blur-sm">
            <Route className="w-3 h-3 mr-1" />
            {formatDistance(directionsResult.totalDistanceMeters)} total
          </Badge>
          <Badge variant="secondary" className="bg-background/95 shadow-md backdrop-blur-sm">
            <Clock className="w-3 h-3 mr-1" />
            {formatDuration(directionsResult.totalDurationSeconds)} travel
          </Badge>
          <Badge variant="secondary" className="bg-background/95 shadow-md backdrop-blur-sm">
            <Navigation className="w-3 h-3 mr-1" />
            {itemsWithCoords.length} stops
          </Badge>
        </div>
      )}

      {/* Get directions button if no result yet */}
      {!directionsResult && itemsWithCoords.length >= 2 && onRequestDirections && (
        <div className="absolute bottom-4 left-4 right-4 flex justify-center">
          <Button
            onClick={onRequestDirections}
            disabled={isLoadingDirections}
            className="shadow-lg"
          >
            {isLoadingDirections ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Route className="w-4 h-4 mr-2" />
            )}
            Get Directions
          </Button>
        </div>
      )}

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-background/95 rounded-lg p-2 shadow-md border text-xs backdrop-blur-sm">
        <div className="flex items-center gap-1 text-muted-foreground mb-1">
          <span>Activity Types</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {(["restaurant", "event", "activity", "apartment"] as TripItemType[]).map((type) => (
            <span
              key={type}
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded"
              style={{ backgroundColor: markerColors[type] + "20" }}
            >
              <span>{typeIcons[type]}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
