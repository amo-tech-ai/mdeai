/// <reference types="@types/google.maps" />
import { useCallback, useEffect, useRef, useState } from 'react';
import { trackMapEvent } from '@/lib/maps-telemetry';
import type { MapPin } from '@/context/MapContext';
import type { ViewportSearchPayload } from '@/components/chat/ChatMap';

interface UseFitBoundsOptions {
  map: google.maps.Map | null;
  pins: MapPin[];
  padding?: number;
  onViewportSearch?: (payload: ViewportSearchPayload) => void;
}

interface UseFitBoundsResult {
  showSearchPill: boolean;
  handleSearchThisArea: () => void;
}

/**
 * Fits the map viewport to the current pin set and manages the
 * "Search this area" pill after the user pans/zooms.
 *
 * Extracted from ChatMap.tsx so it can be reused by MdeMap and any
 * other map surface that needs auto-framing on pin updates.
 */
export function useFitBounds({
  map,
  pins,
  padding = 56,
  onViewportSearch,
}: UseFitBoundsOptions): UseFitBoundsResult {
  const [showSearchPill, setShowSearchPill] = useState(false);
  const justFitRef = useRef(false);

  // Fit bounds whenever pins change.
  useEffect(() => {
    if (!map) return;
    const pinsWithCoords = pins.filter(
      (p) => p.latitude != null && p.longitude != null,
    );

    if (pinsWithCoords.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      for (const p of pinsWithCoords) {
        bounds.extend({ lat: p.latitude!, lng: p.longitude! });
      }
      justFitRef.current = true;
      setShowSearchPill(false);
      map.fitBounds(bounds, { top: padding, right: padding, bottom: padding, left: padding });
      trackMapEvent({ kind: 'fitbounds', pinCount: pinsWithCoords.length });
    } else if (pinsWithCoords.length === 1) {
      justFitRef.current = true;
      setShowSearchPill(false);
      const p = pinsWithCoords[0];
      map.setCenter({ lat: p.latitude!, lng: p.longitude! });
      map.setZoom(15);
    } else if (pins.length === 0) {
      setShowSearchPill(false);
    }
  }, [map, pins, padding]);

  // Show the "Search this area" pill after the user manually pans/zooms.
  useEffect(() => {
    if (!map) return;
    const listener = map.addListener('idle', () => {
      if (justFitRef.current) {
        justFitRef.current = false;
        return;
      }
      if (pins.length > 0) {
        setShowSearchPill(true);
        const center = map.getCenter();
        const bounds = map.getBounds();
        if (center && bounds) {
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();
          trackMapEvent({
            kind: 'viewport_idle',
            bbox: { n: ne.lat(), s: sw.lat(), e: ne.lng(), w: sw.lng() },
          });
        }
      }
    });
    return () => listener.remove();
  }, [map, pins.length]);

  const handleSearchThisArea = useCallback(() => {
    if (!map || !onViewportSearch) return;
    const center = map.getCenter();
    const bounds = map.getBounds();
    const zoom = map.getZoom();
    if (!center || !bounds || zoom == null) return;
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    setShowSearchPill(false);
    onViewportSearch({
      center: { lat: center.lat(), lng: center.lng() },
      zoom,
      bounds: {
        north: ne.lat(),
        south: sw.lat(),
        east: ne.lng(),
        west: sw.lng(),
      },
    });
  }, [map, onViewportSearch]);

  return { showSearchPill, handleSearchThisArea };
}
