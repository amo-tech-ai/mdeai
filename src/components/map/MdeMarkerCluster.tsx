/// <reference types="@types/google.maps" />
import { useCallback, useEffect, useRef } from 'react';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { trackMapEvent } from '@/lib/maps-telemetry';
import { type MapPin } from '@/context/MapContext';
import { MdeMarker } from './MdeMarker';

export interface MdeMarkerClusterProps {
  map: google.maps.Map | null;
  pins: MapPin[];
  highlightedPinId: string | null;
  onPinClick: (pin: MapPin, openInNewTab: boolean) => void;
}

/**
 * Manages a MarkerClusterer instance for a set of pins.
 * Renders an MdeMarker for each pin and registers it with the clusterer.
 *
 * Per-category accumulation pattern (MASTRA-047):
 *   <MdeMarkerCluster map={map} pins={rentalPins} ... />
 *   <MdeMarkerCluster map={map} pins={restaurantPins} ... />
 * Each instance owns its own clusterer so categories never interfere.
 *
 * Returns null — renders onto the Maps canvas.
 */
export function MdeMarkerCluster({
  map,
  pins,
  highlightedPinId,
  onPinClick,
}: MdeMarkerClusterProps) {
  const clustererRef = useRef<MarkerClusterer | null>(null);

  // Create / destroy the clusterer when the map instance changes.
  useEffect(() => {
    if (!map) return;
    const clusterer = new MarkerClusterer({
      map,
      markers: [],
      onClusterClick: (_event, cluster) => {
        trackMapEvent({
          kind: 'cluster_expand',
          clusterSize: cluster.markers?.length ?? 0,
        });
      },
    });
    clustererRef.current = clusterer;
    return () => {
      clusterer.clearMarkers();
      clustererRef.current = null;
    };
  }, [map]);

  // Each MdeMarker calls this when it mounts, giving us the raw
  // AdvancedMarkerElement so we can add it to the clusterer.
  const handleMarkerMount = useCallback(
    (marker: google.maps.marker.AdvancedMarkerElement) => {
      clustererRef.current?.addMarker(marker);
      return () => {
        clustererRef.current?.removeMarker(marker);
      };
    },
    [],
  );

  const pinsWithCoords = pins.filter(
    (p) => p.latitude != null && p.longitude != null,
  );

  return (
    <>
      {pinsWithCoords.map((pin) => (
        <MdeMarker
          key={pin.id}
          pin={pin}
          isHighlighted={pin.id === highlightedPinId}
          onClick={onPinClick}
          onMount={handleMarkerMount}
        />
      ))}
    </>
  );
}
