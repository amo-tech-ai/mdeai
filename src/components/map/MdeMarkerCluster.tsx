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
  /** Called when a marker is clicked, passing both the pin and its DOM element so the parent can anchor an InfoWindow. */
  onMarkerClick?: (pin: MapPin, marker: google.maps.marker.AdvancedMarkerElement) => void;
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
  onMarkerClick,
}: MdeMarkerClusterProps) {
  const clustererRef = useRef<MarkerClusterer | null>(null);
  // Markers that registered before the clusterer was ready. React runs child
  // effects before parent effects on mount, so MdeMarker's useEffect fires
  // first and calls handleMarkerMount while clustererRef.current is still
  // null. Without this queue those markers were silently dropped, which is
  // why the map showed zero pins despite the "N on the map" badge proving
  // pins state was populated.
  const pendingMarkersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);

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
    // Drain any markers that registered before the clusterer existed.
    if (pendingMarkersRef.current.length > 0) {
      clusterer.addMarkers(pendingMarkersRef.current);
      pendingMarkersRef.current = [];
    }
    return () => {
      clusterer.clearMarkers();
      clustererRef.current = null;
    };
  }, [map]);

  // Each MdeMarker calls this when it mounts, giving us the raw
  // AdvancedMarkerElement so we can add it to the clusterer.
  const handleMarkerMount = useCallback(
    (marker: google.maps.marker.AdvancedMarkerElement) => {
      if (clustererRef.current) {
        clustererRef.current.addMarker(marker);
      } else {
        // Clusterer not ready yet — queue. The clusterer-init effect drains.
        pendingMarkersRef.current.push(marker);
      }
      return () => {
        if (clustererRef.current) {
          clustererRef.current.removeMarker(marker);
        } else {
          const idx = pendingMarkersRef.current.indexOf(marker);
          if (idx >= 0) pendingMarkersRef.current.splice(idx, 1);
        }
      };
    },
    [],
  );

  // Defensive coordinate check: reject null/undefined AND NaN/Infinity that
  // would crash Google Maps with "InvalidValueError: not a number". Apartment
  // pins from PostgREST numeric columns arrive as strings; ApartmentPinSync
  // and ChatMap both coerce with Number(), so a defensive isFinite catches any
  // upstream regression.
  const pinsWithCoords = pins.filter(
    (p) =>
      p.latitude != null &&
      p.longitude != null &&
      Number.isFinite(Number(p.latitude)) &&
      Number.isFinite(Number(p.longitude)),
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
          onMarkerClick={onMarkerClick}
        />
      ))}
    </>
  );
}
