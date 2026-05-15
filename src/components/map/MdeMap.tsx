/// <reference types="@types/google.maps" />
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  isMapsAuthFailed,
  loadGoogleMapsLibrary,
  onMapsAuthFailed,
} from '@/lib/google-maps-loader';
import { measureScriptLoad, trackMapEvent } from '@/lib/maps-telemetry';
import { getGoogleMapsMapId } from '@/lib/google-maps-map-id';
import { useMapContext, PIN_CATEGORY_CONFIG, type MapPin } from '@/context/MapContext';
import { cn } from '@/lib/utils';
import { MapPin as MapPinIcon } from 'lucide-react';
import { MdeMarkerCluster } from './MdeMarkerCluster';
import { MdeInfoWindow } from './MdeInfoWindow';
import { useFitBounds } from './useFitBounds';
import type { ViewportSearchPayload } from '@/components/chat/ChatMap';

const MEDELLIN_CENTER = { lat: 6.2442, lng: -75.5812 };
// MASTRA-068: Map ID resolved via getGoogleMapsMapId() — see src/lib/google-maps-map-id.ts

export interface MdeMapProps {
  onViewportSearch?: (payload: ViewportSearchPayload) => void;
}

/**
 * Modular map panel built from MdeMarkerCluster + MdeInfoWindow + useFitBounds.
 *
 * Drop-in replacement surface for ChatMap, composed of the standalone pieces
 * in src/components/map/. ChatMap.tsx remains unchanged and is still the
 * active production component — this is the composable successor.
 *
 * Key differences from ChatMap.tsx:
 * - Per-category clusterers: each MapPinCategory gets its own MdeMarkerCluster,
 *   so MASTRA-047 pin accumulation works without extra filtering at the map level.
 * - InfoWindow state is React state (openPin) rather than an imperative ref.
 * - useFitBounds extracted — bounds / search-pill logic lives in its own hook.
 */
export function MdeMap({ onViewportSearch }: MdeMapProps = {}) {
  const { pins, highlightedPinId, setHighlightedPinId } = useMapContext();
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const navigate = useNavigate();

  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [librariesReady, setLibrariesReady] = useState(false);
  const [authFailed, setAuthFailed] = useState<boolean>(isMapsAuthFailed());
  const [mapError, setMapError] = useState<string | null>(null);

  const [openPin, setOpenPin] = useState<MapPin | null>(null);
  const [openAnchor, setOpenAnchor] =
    useState<google.maps.marker.AdvancedMarkerElement | null>(null);

  useEffect(() => onMapsAuthFailed(() => setAuthFailed(true)), []);

  // Initialize the map once.
  useEffect(() => {
    if (!apiKey || authFailed || !containerRef.current || map) return;
    let cancelled = false;
    (async () => {
      try {
        const [mapsLib] = await measureScriptLoad(
          () =>
            Promise.all([
              loadGoogleMapsLibrary<google.maps.MapsLibrary>('maps', apiKey),
              loadGoogleMapsLibrary<google.maps.MarkerLibrary>('marker', apiKey),
            ]),
          ['maps', 'marker'],
        );
        if (cancelled || map) return;

        const firstGeoPin = pins.find(
          (p) => typeof p.latitude === 'number' && typeof p.longitude === 'number',
        );
        const initialCenter = firstGeoPin
          ? { lat: firstGeoPin.latitude as number, lng: firstGeoPin.longitude as number }
          : MEDELLIN_CENTER;

        const mapInstance = new mapsLib.Map(containerRef.current!, {
          center: initialCenter,
          zoom: 13,
          mapId: getGoogleMapsMapId(),
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: 'greedy',
          clickableIcons: false,
        });
        setMap(mapInstance);
        setLibrariesReady(true);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        console.error('MdeMap init failed:', err);
        trackMapEvent({ kind: 'map_init_failed', error: message });
        setMapError(message);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, authFailed]);

  // Close InfoWindow when pins change (anchor may no longer exist).
  useEffect(() => {
    setOpenPin(null);
    setOpenAnchor(null);
  }, [pins]);

  const { showSearchPill, handleSearchThisArea } = useFitBounds({
    map,
    pins,
    onViewportSearch,
  });

  const pinDetailPath = useCallback((pin: MapPin): string | null => {
    if (pin.category === 'rental') return `/apartments/${pin.id}`;
    return null;
  }, []);

  const navigateToPin = useCallback(
    (pin: MapPin, openInNewTab = false) => {
      const path = pinDetailPath(pin);
      if (!path) return;
      if (openInNewTab) window.open(path, '_blank', 'noopener,noreferrer');
      else navigate(path);
    },
    [navigate, pinDetailPath],
  );

  const handlePinClick = useCallback(
    (pin: MapPin, openInNewTab: boolean) => {
      setHighlightedPinId(pin.id);
      if (openInNewTab) {
        navigateToPin(pin, true);
        return;
      }
      // Store the pin for InfoWindow; anchor is set by onMarkerClick below.
      setOpenPin(pin);
    },
    [setHighlightedPinId, navigateToPin],
  );

  // Split pins by category so each gets its own clusterer.
  const pinsByCategory = pins.reduce<Record<string, MapPin[]>>((acc, pin) => {
    (acc[pin.category] ??= []).push(pin);
    return acc;
  }, {});

  // Fallback: no API key or auth failed.
  if (!apiKey || authFailed) {
    if (pins.length === 0) {
      return (
        <aside className="h-full flex items-center justify-center text-center p-8 bg-muted/20 border-l border-border">
          <div className="max-w-xs">
            <MapPinIcon className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Pins appear here as you chat.</p>
            <p className="text-xs text-muted-foreground mt-1">Try "top rentals in Laureles" →</p>
          </div>
        </aside>
      );
    }
    return (
      <aside className="h-full overflow-y-auto bg-muted/10 border-l border-border">
        <div className="sticky top-0 bg-background/80 backdrop-blur border-b border-border px-4 py-3 z-10">
          <h2 className="text-sm font-semibold">{pins.length} on the map</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {authFailed
              ? 'Map unavailable — enable Maps JavaScript API on the key'
              : 'Interactive map pending Google Maps key'}
          </p>
        </div>
        <ul className="divide-y divide-border">
          {pins.map((pin) => {
            const cfg = PIN_CATEGORY_CONFIG[pin.category];
            const isHot = pin.id === highlightedPinId;
            return (
              <li
                key={pin.id}
                onMouseEnter={() => setHighlightedPinId(pin.id)}
                onMouseLeave={() => setHighlightedPinId(null)}
                onClick={() => navigateToPin(pin)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigateToPin(pin);
                  }
                }}
                className={cn(
                  'flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors',
                  isHot ? 'bg-accent' : 'hover:bg-accent/40',
                )}
              >
                <span
                  aria-hidden
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm flex-shrink-0"
                  style={{ backgroundColor: `${cfg.color}20`, color: cfg.color }}
                >
                  {cfg.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium line-clamp-1">{pin.title}</p>
                  {pin.label && (
                    <p className="text-xs text-muted-foreground mt-0.5">{pin.label}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </aside>
    );
  }

  return (
    <aside className="relative h-full border-l border-border overflow-hidden bg-muted/10">
      <div ref={containerRef} className="w-full h-full" />

      {librariesReady && map && (
        <>
          {/* One clusterer per category — supports MASTRA-047 per-category pin merge */}
          {Object.entries(pinsByCategory).map(([category, categoryPins]) => (
            <MdeMarkerCluster
              key={category}
              map={map}
              pins={categoryPins}
              highlightedPinId={highlightedPinId}
              onPinClick={handlePinClick}
            />
          ))}
          <MdeInfoWindow
            map={map}
            anchor={openAnchor}
            pin={openPin}
            onViewDetails={(pin) => {
              setOpenPin(null);
              setOpenAnchor(null);
              navigateToPin(pin, false);
            }}
          />
        </>
      )}

      {pins.length > 0 && (
        <div className="absolute top-3 left-3 z-10 bg-background/90 backdrop-blur rounded-full px-3 py-1.5 text-xs font-medium shadow-sm border border-border">
          {pins.length} on the map
        </div>
      )}

      {showSearchPill && onViewportSearch && (
        <button
          type="button"
          onClick={handleSearchThisArea}
          className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-foreground text-background hover:bg-foreground/90 rounded-full px-4 py-2 text-xs font-semibold shadow-lg border border-border transition-colors animate-in fade-in slide-in-from-top-2"
          aria-label="Search this area"
        >
          🔍 Search this area
        </button>
      )}

      {librariesReady && pins.length === 0 && (
        <div className="absolute inset-0 flex items-end justify-center p-6 pointer-events-none">
          <div className="bg-background/95 backdrop-blur rounded-xl px-4 py-3 shadow-lg border border-border max-w-xs text-center">
            <p className="text-sm">Pins appear here as you chat.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Try "top rentals in Laureles" →
            </p>
          </div>
        </div>
      )}

      {mapError && (
        <div className="absolute top-3 right-3 z-10 bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2 text-xs text-destructive max-w-[220px]">
          Map failed to load. Chat still works — we'll show pins as a list.
        </div>
      )}
    </aside>
  );
}
